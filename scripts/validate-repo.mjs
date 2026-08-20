#!/usr/bin/env node
/**
 * dsh-config-market 仓库预检脚本（第二层自动化 · GitHub Actions CI 用）
 *
 * 校验内容（与插件端 100% 同款函数）：
 * 1. index.json 结构：parseMarketIndex（字段白名单 / schemaVersion / id 格式 / repo URL 合法性）
 * 2. items[].id 去重（插件端不查重，CI 补上 —— 防撞车）
 * 3. 每个无 repo 条目：validateMarketItem（8 道校验：id 一致 / 体积 / checksum / zip 加固 /
 *    内部 manifest / 内部完整性 / 分区数据合法 / L2↔L3 一致 + 禁止分区）
 * 4. 内容级秘密扫描：prepareMarketItem（复用发布向导的敏感内容拦截）
 * 5. checksum 自洽：prepare 算出的 sha256 必须等于 manifest 声明值
 *
 * 用法：
 *   node scripts/validate-repo.mjs            # 默认从 node_modules / 本机 profile 找插件
 *   DSH_CM_PATH=<路径> node scripts/validate-repo.mjs   # 指定插件安装路径
 *
 * 退出码：0 = 全部通过；1 = 校验失败（GitHub Actions 标红）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

// ---------- 定位 dsh-config-manager 包（含 lib/market/*.js） ----------
function findPlugin() {
  const candidates = [
    process.env.DSH_CM_PATH,
    path.join(REPO_ROOT, 'node_modules', 'dsh-config-manager'),
    // 本机 profile 安装（本地开发直接复用，无需 npm i）
    path.join(process.env.USERPROFILE || '', '.dsh', 'profiles', 'web', 'node_modules', 'dsh-config-manager'),
  ].filter(Boolean);
  for (const c of candidates) {
    const p = path.join(c, 'lib', 'market', 'security.js');
    if (fs.existsSync(p)) return c;
  }
  console.error('✗ 未找到 dsh-config-manager 包。请先: npm i dsh-config-manager （或设置 DSH_CM_PATH）');
  process.exit(1);
}

const pluginDir = findPlugin();
console.log(`ℹ 使用插件包: ${pluginDir}`);

// 用文件 URL 直接 import（绕过 package.json exports 限制 —— lib/market/*.js 是纯函数零外部依赖）
const importLib = (rel) => import(pathToFileURL(path.join(pluginDir, 'lib', rel)).href);
const { validateMarketItem } = await importLib('market/security.js');
const { parseMarketIndex } = await importLib('market/index-parser.js');
const { prepareMarketItem, MarketPrepareError } = await importLib('market/prepare.js');

// ---------- 主流程 ----------
let failed = false;
const fail = (msg) => { failed = true; console.error(`  ✗ ${msg}`); };
const pass = (msg) => console.log(`  ✓ ${msg}`);

// 1. index.json 结构校验
console.log('① 校验 index.json 结构…');
const indexPath = path.join(REPO_ROOT, 'index.json');
if (!fs.existsSync(indexPath)) {
  console.error('✗ index.json 不存在');
  process.exit(1);
}
const indexRaw = fs.readFileSync(indexPath, 'utf8');
const parsed = parseMarketIndex(indexRaw);
if (!parsed.ok) {
  parsed.errors.forEach((e) => fail(`index.json: ${e}`));
} else {
  pass(`schemaVersion=1，条目数=${parsed.index.items.length}` + (parsed.dropped ? `（${parsed.dropped} 条因 repo 非法被丢弃）` : ''));
}

// 2. id 去重（仅在 index 有效时）
if (parsed.ok) {
  console.log('② 检查 items[].id 唯一性…');
  const ids = parsed.index.items.map((it) => it.id);
  const seen = new Set();
  const dupes = [];
  for (const id of ids) {
    if (seen.has(id) && !dupes.includes(id)) dupes.push(id);
    seen.add(id);
  }
  if (dupes.length > 0) {
    dupes.forEach((d) => fail(`重复 id: ${d}`));
  } else {
    pass('无重复 id');
  }

  // 3. 每条目逐一校验
  for (const item of parsed.index.items) {
    console.log(`③ 校验条目 ${item.id}…`);
    const itemDir = path.join(REPO_ROOT, 'items', item.id);

    // 带 repo 的条目：内容在作者仓库，CI 不拉外部内容；引用合法性已由 ① 校验
    if (item.repo) {
      pass(`外部托管条目（repo=${item.repo}），内容由作者仓库提供，跳过内容校验`);
      continue;
    }

    // 官方托管条目：校验 manifest + config.zip
    const manifestPath = path.join(itemDir, 'manifest.json');
    const zipPath = path.join(itemDir, 'config.zip');
    if (!fs.existsSync(manifestPath)) { fail(`缺少 items/${item.id}/manifest.json`); continue; }
    if (!fs.existsSync(zipPath)) { fail(`缺少 items/${item.id}/config.zip`); continue; }

    const manifestRaw = fs.readFileSync(manifestPath, 'utf8');
    const zipBytes = fs.readFileSync(zipPath);

    // 3a. 8 道校验（与插件 download 端同函数）
    const v = validateMarketItem(item.id, manifestRaw, zipBytes);
    if (v.status !== 'valid') {
      v.errors.forEach((e) => fail(`${item.id}: ${e}`));
      continue;
    }
    pass(`8 道校验通过（sections=${v.sections.join(',')}）`);

    // 3b. 内容级秘密扫描（复用发布向导 prepare 的扫描逻辑）
    const m = v.manifest;
    try {
      const r = prepareMarketItem({
        itemId: item.id,
        name: m.name,
        version: m.version,
        description: m.description,
        author: m.author,
        categories: m.categories,
        zipBytes,
      });
      pass('内容级秘密扫描通过（0 命中）');
      // 3c. checksum 自洽：prepare 算出的 sha256 必须等于 manifest 声明值
      if (r.sha256 !== m.checksums.zip) {
        fail(`checksums.zip 与实算不符: manifest=${m.checksums.zip} 实际=${r.sha256}`);
      } else {
        pass('checksums.zip 匹配实算值');
      }
    } catch (err) {
      if (err instanceof MarketPrepareError) {
        fail(`${item.id}: 内容级秘密扫描拦截: ${err.message}`);
      } else {
        fail(`${item.id}: prepare 异常: ${err.message}`);
      }
    }
  }
}

// ---------- 汇总 ----------
if (failed) {
  console.error('\n❌ 仓库预检未通过，请修复后重新提交。');
  process.exit(1);
} else {
  console.log('\n✅ 仓库预检全部通过。');
  process.exit(0);
}