# 贡献指南 / Contributing Guide

感谢你想为 DSH 配置市场添砖加瓦！本仓库是**纯内容仓库**（`index.json` 索引 + 条目包），没有程序代码。
Thanks for contributing to the DSH Config Marketplace! This repo is a **pure content repository** (`index.json` index + entry packages) — there is no program code here.

## 两种投稿方式（选一个）/ Two ways to contribute (pick one)

### 方式 A：插件端「一键上传」（零命令行，推荐给所有人）/ Option A: One-click upload from the plugin (zero CLI, recommended for everyone)

安装 dsh-config-manager 插件 → 「市场」→「我的配置」→ 登录 GitHub → 选导出 zip →「一键上传」。
Install the dsh-config-manager plugin → "Market" → "My Configs" → sign in to GitHub → pick an exported zip → "One-click upload".
插件自动完成：把你的配置写进**你自己的公开仓库** → fork 本仓库 → 在 `index.json` 追加
自托管引用 → 自动提**收录 PR**。你全程不用碰命令行。
The plugin automatically: writes your config to **your own public repo** → forks this repo → appends a
self-hosted reference to `index.json` → files an **inclusion PR**. You never touch the command line.

### 方式 B：命令行动手（维护者 / 进阶用户）/ Option B: Command-line (maintainers / power users)

见 README「发布 / 更新 / 投稿 实操指南」：
See the README's "Publish / Update / Contribute handbook":
`node scripts/publish.mjs --zip ...`，生成的 `items/<id>/` 提交到本仓库（官方托管），
或推到你自己的仓库并只把 `index.json` 引用提成 PR（作者自托管）。
Run `node scripts/publish.mjs --zip ...`, then commit the generated `items/<id>/` to this repo (officially hosted),
or push to your own repo and open a PR that only adds the `index.json` reference (author self-hosted).

## PR 规范（人工提 PR 时自查）/ PR checklist (self-check before opening a manual PR)

- ☐ 条目 id **全市场唯一**（只含字母/数字/点/下划线/连字符）；/ Entry id is **unique across the whole marketplace** (letters/digits/dot/underscore/hyphen only);
- ☐ 更新条目时**版本号递增**（1.0.0 → 1.0.1）；/ **Version is bumped** when updating (1.0.0 → 1.0.1);
- ☐ **不含任何密钥/凭据**，不含 `secrets` / `sessions` / `pluginFiles` / `self` 分区；/ **No secrets/credentials**, and no `secrets` / `sessions` / `pluginFiles` / `self` sections;
- ☐ `manifest.json` 的 checksum 与 `config.zip` 一致（用插件生成，别手写）；/ `manifest.json` checksum matches `config.zip` (generate with the plugin — don't hand-write);
- ☐ 提交后看 **Actions** 标签页：❌ 红的按报错改，✅ 绿了等合并。/ After pushing, check the **Actions** tab: ❌ red = fix per the error; ✅ green = wait for merge.

## 审核流程（你提交之后）/ Review process (after you submit)

- 插件自动提的收录 PR（分支 `dsh-market-sync/<itemId>`）与手动 PR **都走 CI 预检 + 维护者人工审核**；
- Both plugin-filed inclusion PRs (branch `dsh-market-sync/<itemId>`) and manual PRs go through **CI pre-check + human maintainer review**;
- CI 全绿是合并的**前置条件**，但不是充分条件——维护者还会看一眼条目内容是否合理；
- A green CI is a **prerequisite** for merge, but not sufficient — maintainers also review whether the entry content is reasonable;
- 作者自托管的条目：合并后你更新内容**无需再提 PR**（用户端每次实时拉取你的仓库）。
- For self-hosted entries: after merge, you can update content **without a new PR** (users pull live from your repo every time).

## 行为约定 / Code of conduct

- 对事不对人；发现可疑条目请走 `SECURITY.md` 或「条目故障」Issue 模板，不要在评论区开撕；
- Attack the problem, not the person; report suspicious entries via `SECURITY.md` or the "Entry issue" form — don't argue in comments;
- 一个问题一个 Issue / PR，方便追踪。
- One issue/PR per topic, for easier tracking.

## 目录速查 / Quick directory reference

```
index.json                    # 市场目录（唯一必建文件）/ Marketplace index (the only required file)
items/<itemId>/               # 官方托管条目（manifest.json + config.zip）/ Officially hosted entries (manifest.json + config.zip)
scripts/publish.mjs           # 一键发布 / 更新条目 / One-click publish or update an entry
scripts/validate-repo.mjs     # CI 校验脚本（push / PR 自动跑）/ CI validation script (runs on push / PR)
```