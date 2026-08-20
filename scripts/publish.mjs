#!/usr/bin/env node
/**
 * dsh-config-market 一键发布/更新脚本（第一层自动化）
 *
 * 用法：
 *   node scripts/publish.mjs --zip <config.zip> --id <itemId> --name "条目名"
 *        [--version 1.0.1] [--description "..."] [--author "xxx"]
 *        [--categories "plugins,skills"] [--repo-url "https://..."]
 *        [--dry-run] [--api http://127.0.0.1:3080]
 *
 * 流程：上传 zip → 发布向导 prepare（含 8 道校验 + 秘密扫描）→
 *       写入 items/<id>/（manifest.json + config.zip）→ 更新 index.json → 提示提交
 *
 * 设计要点（固化历史踩坑）：
 * 1. JSON body 一律 UTF-8 字节发送（避免中文变 ????）
 * 2. 上传前检查 zip 内部路径必须是正斜杠 /（避免 download 端找不到分区文件）
 * 3. 自动把 prepare 返回的 manifest 字段同步进 index.json（version/updatedAt 不再手改）
 * 4. --dry-run 只做上传+prepare 验证，不写仓库
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const zipPath = args['zip'];
  const itemId = args['id'];
  const name = args['name'];
  const apiBase = (args['api'] || 'http://127.0.0.1:3080').replace(/\/$/, '');
  const dryRun = args['dry-run'] === true;

  // ---------- 1. 基础入参检查 ----------
  if (!zipPath || !itemId || !name) {
    console.error('用法: node scripts/publish.mjs --zip <config.zip> --id <itemId> --name "条目名" [--version ...] [--description ...] [--author ...] [--categories "a,b"] [--repo-url ...] [--dry-run]');
    process.exit(1);
  }
  if (!fs.existsSync(zipPath)) {
    console.error(`✗ zip 文件不存在: ${zipPath}`);
    process.exit(1);
  }
  // config.zip 根目录的 manifest.json 必须存在（导出格式）
  // ---------- 2. zip 内部路径检查（必须正斜杠） ----------
  console.log(`① 检查 zip 内部路径… (${zipPath})`);
  const badSeps = await checkZipPathSlashes(zipPath);
  if (badSeps.length > 0) {
    console.error(`✗ zip 内部含反斜杠路径（插件端无法识别），前 5 个: ${badSeps.slice(0, 5).join(', ')}`);
    console.error('  请用插件的「导出」功能生成 zip（天然正斜杠），或重新打包（zip 内路径必须用 / 分隔）。');
    process.exit(1);
  }
  console.log('  ✓ zip 内部路径全部为 / 正斜杠');

  // ---------- 3. 上传到受控临时区 ----------
  console.log('② 上传 zip 到插件受控临时区…');
  const zipBytes = fs.readFileSync(zipPath);
  const up = await postBinary(`${apiBase}/api/dsh-config-manager/upload?name=${encodeURIComponent(path.basename(zipPath))}`, zipBytes);
  if (!up.zipPath) {
    console.error(`✗ 上传失败: ${JSON.stringify(up)}`);
    process.exit(1);
  }
  console.log(`  ✓ 已上传: ${up.zipPath} (${up.sizeBytes} bytes)`);

  // ---------- 4. 发布向导 prepare（8 道校验 + 秘密扫描） ----------
  const categories = args['categories']
    ? String(args['categories']).split(',').map((s) => s.trim()).filter(Boolean)
    : undefined;
  const payload = {
    zipPath: up.zipPath,
    itemId,
    name,
    ...(args['version'] ? { version: args['version'] } : {}),
    ...(args['description'] ? { description: args['description'] } : {}),
    ...(args['author'] ? { author: args['author'] } : {}),
    ...(args['repo-url'] ? { repoUrl: args['repo-url'] } : {}),
    ...(categories && categories.length > 0 ? { categories } : {}),
  };
  console.log('③ 发布向导 prepare（8 道校验 + 秘密扫描）…');
  const prep = await postJson(`${apiBase}/api/dsh-config-manager/market/prepare`, payload);
  if (!prep.ok) {
    console.error(`✗ prepare 失败: ${prep.error || JSON.stringify(prep)}`);
    process.exit(1);
  }
  console.log(`  ✓ 校验通过: sha256=${prep.sha256}`);
  console.log(`  ✓ 分区: ${prep.sections.join(', ')}`);
  prep.warnings?.forEach((w) => console.log(`  ⚠ ${w}`));

  if (dryRun) {
    console.log('\n[dry-run] 验证完成，未写入仓库。');
    return;
  }

  // ---------- 5. 写入 items/<id>/ ----------
  const manifest = JSON.parse(prep.manifestText);
  const itemDir = path.join(REPO_ROOT, 'items', itemId);
  fs.mkdirSync(itemDir, { recursive: true });
  fs.writeFileSync(path.join(itemDir, 'manifest.json'), prep.manifestText, 'utf8');
  fs.writeFileSync(path.join(itemDir, 'config.zip'), zipBytes);
  console.log(`④ 已写入 items/${itemId}/manifest.json + config.zip`);

  // ---------- 6. 更新 index.json（自动同步新字段） ----------
  console.log('⑤ 更新 index.json…');
  const indexPath = path.join(REPO_ROOT, 'index.json');
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const entry = {
    id: manifest.id,
    name: manifest.name,
    ...(manifest.description ? { description: manifest.description } : {}),
    ...(manifest.author ? { author: manifest.author } : {}),
    ...(manifest.version ? { version: manifest.version } : {}),
    updatedAt: manifest.updatedAt,
    ...(manifest.categories && manifest.categories.length > 0 ? { categories: manifest.categories } : {}),
    ...(args['repo-url'] ? { repo: args['repo-url'] } : {}),
  };
  const idx = index.items.findIndex((it) => it.id === itemId);
  if (idx >= 0) {
    index.items[idx] = entry; // 已存在 → 更新
    console.log(`  ✓ 更新已有条目 ${itemId}（version=${manifest.version}，updatedAt=${manifest.updatedAt}）`);
  } else {
    index.items.push(entry); // 不存在 → 追加
    console.log(`  ✓ 新增条目 ${itemId}`);
  }
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n', 'utf8');

  // ---------- 7. 提示提交 ----------
  console.log('\n✅ 发布包已就绪。请执行:');
  console.log('  git add items index.json');
  console.log(`  git commit -m "publish: ${itemId} ${manifest.version}"`);
  console.log('  git push origin main');
  console.log('\n推送后 GitHub Actions 会自动预检；本机插件 refresh 即可看到更新。');
}

async function checkZipPathSlashes(zipPath) {
  // 读取 zip 中央目录里的文件名（无需解压）：扫描 "PK\x05\x06" 前的文件名区
  // 简化可靠做法：读全部字节，找相对路径形态的 \ 分隔文件名
  const buf = fs.readFileSync(zipPath);
  const bad = [];
  // 用字符串扫描 local file headers（PK\x03\x04）后的文件名（len 从 header 偏移 26）
  for (let i = 0; i < buf.length - 4; i++) {
    if (buf[i] === 0x50 && buf[i + 1] === 0x4b && buf[i + 2] === 0x03 && buf[i + 3] === 0x04) {
      const nameLen = buf.readUInt16LE(i + 26);
      const extraLen = buf.readUInt16LE(i + 28);
      const nameStart = i + 30;
      const nameBuf = buf.subarray(nameStart, nameStart + nameLen);
      const nameStr = nameBuf.toString('utf8');
      if (nameStr.includes('\\')) bad.push(nameStr);
      i = nameStart + nameLen + extraLen - 1;
    }
  }
  return bad;
}

async function postJson(url, obj) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: Buffer.from(JSON.stringify(obj), 'utf8'),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) {
    return { ok: false, error: json.error || json.raw || `HTTP ${res.status}` };
  }
  return json;
}

async function postBinary(url, buf) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/octet-stream' },
    body: buf,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) {
    return { ok: false, error: json.error || json.raw || `HTTP ${res.status}` };
  }
  return json;
}

main().catch((err) => {
  console.error('✗ 脚本异常:', err);
  process.exit(1);
});