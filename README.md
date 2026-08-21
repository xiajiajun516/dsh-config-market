# DSH 官方配置市场 / DSH Official Config Marketplace

> 本仓库是 **DSH Config Manager 插件（dsh-config-manager）** 的官方配置市场仓库。
> This repository is the official configuration marketplace for the **DSH Config Manager plugin (dsh-config-manager)**.
>
> 它**不包含任何程序代码**，只是一个纯内容仓库：存放社区共享的 DSH 配置包
> （settings / 模型供应商 / 插件 / skill / agent preset 等），
> 供所有安装了该插件的用户通过「配置市场」面板浏览、下载、校验并一键导入。
> It contains **no program code** — it is a pure content repository holding community-shared DSH config packages
> (settings / model providers / plugins / skills / agent presets, etc.), so users of the plugin can
> browse, download, validate, and import them in one click from the "Config Marketplace" panel.

## 它怎么工作（一句话版）/ How it works (one-liner)

- 本仓库 = **目录索引**（`index.json`），只收录条目的元信息与引用；
- This repo is the **directory index** (`index.json`) — it only holds entries' metadata and references;
- 条目内容（`manifest.json` + `config.zip`）由**作者在自己的公开 git 仓库自托管**（也可以直接放在本仓库 `items/<id>/` 下）；
- Entry content (`manifest.json` + `config.zip`) is **self-hosted by authors in their own public git repositories** (or placed directly under this repo's `items/<id>/`);
- 官方仓库**永远只读、零凭据**：插件端只做 `git clone --depth 1` + `git pull --ff-only`，绝不写回、绝不需要任何 token。
- The official repo is **always read-only and credential-free**: the plugin only runs `git clone --depth 1` + `git pull --ff-only` — it never writes back and never needs any token.

## 目录结构 / Directory structure

```
dsh-config-market/
├── index.json                  # L1 市场目录（唯一必建文件）/ L1 marketplace index (the only required file)
├── README.md                   # 本文件 / This file
├── scripts/                    # 自动化工具（见「发布/更新/投稿 实操指南」）/ Automation tools (see the practical guide below)
│   ├── publish.mjs             #   一键发布/更新条目 / One-click publish or update an entry
│   └── validate-repo.mjs       #   仓库预检（CI 自动调用）/ Repo pre-check (called by CI automatically)
├── .github/                    # GitHub 端配置（CI / Issue 表单 / PR 模板）/ GitHub-side config (CI / issue forms / PR template)
│   ├── workflows/validate.yml  #   CI 预检（push/PR 自动跑）/ CI pre-check (runs on push/PR)
│   ├── ISSUE_TEMPLATE/         #   Issue 表单（新条目/故障/其他）/ Issue forms (new entry / problem / other)
│   └── PULL_REQUEST_TEMPLATE.md#   PR 模板 / PR template
├── CONTRIBUTING.md             # 投稿指南 / Contributing guide
├── SECURITY.md                 # 安全问题报告通道 / Security reporting channel
├── LICENSE                     # MIT 授权（仅限本仓库自身内容）/ MIT license (repo's own content only)
└── items/
    └── <itemId>/               # 每个条目一个目录；目录名 = itemId / One directory per entry; dir name = itemId
        ├── manifest.json       # L2 条目清单（sections + checksums + 供应链信息）/ L2 entry manifest (sections + checksums + provenance)
        └── config.zip          # L3 实际配置内容（导出/备份格式 ZIP）/ L3 actual config content (export/backup ZIP)
```

## 安全红线（硬性要求）/ Security red lines (hard requirements)

从市场下载的条目一律视为「未经官方审核的不可信输入」。**以下内容严禁出现在任何条目中**：
Anything downloaded from the marketplace is treated as "untrusted, unofficial input". **The following must never appear in any entry**:

- ❌ 任何密钥/凭据（api key / token / password 等）——市场通道永不携带秘密，插件端会做 8 道校验 + 内容级秘密扫描，发现即拒绝；
- ❌ Any secrets/credentials (api key / token / password, etc.) — the marketplace channel never carries secrets; the plugin runs 8 validation checks + content-level secret scanning and rejects anything found;
- ❌ 含禁止分区的条目：`secrets`（凭据）、`sessions`（历史会话）、`pluginFiles`（任意文件）、`self`（本地环境信息）；
- ❌ Entries containing forbidden sections: `secrets` (credentials), `sessions` (past conversations), `pluginFiles` (arbitrary files), `self` (local environment info);
- ❌ 非 `http(s)` 或带 userinfo（`user:pass@`）的 `repo` 引用；
- ❌ `repo` references that are not `http(s)` or that contain userinfo (`user:pass@`);
- ❌ 在 `index.json` 里引入字段白名单之外的任何字段（会导致整份 index 被拒绝）。
- ❌ Any field in `index.json` outside the field whitelist (the whole index is rejected).

> 💡 **最省事的生成方式 / Easiest way to generate content**：不要手写 `config.zip` —— 用 dsh-config-manager 插件的「导出」功能生成备份 zip（结构天然正确），再用「发布到市场 → 生成条目包」自动产出 `manifest.json` 与 SHA-256。本仓库的人工维护只碰 `index.json` 引用。
> Don't hand-write `config.zip` — use the dsh-config-manager plugin's "Export" feature to generate a backup zip (structure is always correct), then "Publish to marketplace → Generate entry package" to produce `manifest.json` and SHA-256 automatically. Manual maintenance here only touches the `index.json` references.

## 发布 / 更新 / 投稿 实操指南（自动化）/ Publish / Update / Contribute handbook (automated)

本仓库配套了两个自动化工具（`scripts/` 目录），把「发布 → 校验 → 收录」从手工操作变成一条命令 + 自动安检。
This repo ships two automation tools (in `scripts/`) that turn "publish → validate → index" from manual work into one command + automated checks.

### 什么时候用哪个（先看这个）/ Which one to use when (read this first)

| 你想做什么 / What you want | 用什么 / Use | 要手动操作吗 / Manual work? |
|---|---|---|
| **发布一个新条目**（第一次上架）/ **Publish a new entry** (first time) | `publish.mjs` | 要，跑一条命令 / Yes — run one command |
| **更新一个已有条目**（出新版本）/ **Update an existing entry** (new version) | `publish.mjs` | 要，跑一条命令 / Yes — run one command |
| **检查仓库有没有问题**（重复 id / 校验不过 / 含密钥）/ **Check the repo for problems** (duplicate ids / failed validation / secrets) | CI 自动跑 `validate-repo.mjs` / CI runs `validate-repo.mjs` | **不用**，push 后机器人自动查 / **No** — the bot checks after each push |
| **在 GitHub 上看检查结果** / **See results on GitHub** | GitHub 网页的 Actions 标签页 / Actions tab on GitHub | 不用，push 后自动出现 / No — appears after push |

> 👉 普通用户（只是浏览/下载市场）**不需要用任何命令**。只有作者/维护者（要上架或改版的人）才用 `publish.mjs`。
> Regular users (browsing/downloading) **don't need any commands**. Only authors/maintainers (publishing or updating entries) use `publish.mjs`.

### 前置准备（只需一次）/ Prerequisites (do once)

```bash
# 1. 装 Node.js（≥ 20，含 npm）/ Install Node.js (≥ 20, with npm)
# 2. 克隆官方仓库 / Clone the official repo
git clone https://github.com/xiajiajun516/dsh-config-market.git
cd dsh-config-market
```

> 本机已装好 Node 的话，直接跳过第 1 步。`validate-repo.mjs` 能自动找到本机已安装的 dsh-config-manager 插件，无需额外 `npm i`。
> If you already have Node installed, skip step 1. `validate-repo.mjs` auto-detects a locally installed dsh-config-manager plugin — no extra `npm i` needed.

### 发布一个新条目 / Publish a new entry

```bash
node scripts/publish.mjs \
  --zip 你的配置.zip \
  --id 条目id \
  --name "条目显示名" \
  --version 1.0.0 \
  --description "一句话描述" \
  --author 你的名字 \
  --categories "plugins,skills"
```

脚本自动完成：检查 zip 路径 → 上传 → **8 道安全校验 + 秘密扫描** → 写入 `items/<id>/` → 自动更新 `index.json`（version / 时间戳 / checksum 自动同步）。最后按提示提交推送即可。
The script automatically: checks the zip path → uploads → runs **8 security validations + secret scanning** → writes `items/<id>/` → updates `index.json` (version / timestamp / checksum synced automatically). Then just commit and push as prompted.

> 💡 **Windows 用户 / Windows users**（PowerShell / CMD）：把命令写成一行即可（去掉 `\` 换行），例如：
> Write the command as one line (drop the `\` line breaks), e.g.:
> `node scripts/publish.mjs --zip 你的配置.zip --id 条目id --name "条目显示名" --version 1.0.0`

**参数说明（通俗版）/ Parameters (plain-language)**：

| 参数 / Param | 必填 / Required | 说明 / Description |
|---|---|---|
| `--zip` | ✅ | 你的配置文件路径（用插件的「导出」功能生成，结构天然正确）/ Path to your config zip (generated by the plugin's "Export" feature — structure is always correct) |
| `--id` | ✅ | 条目身份证号：字母/数字开头，只能含 `. _ -`，**整个市场唯一**（与他人重复会被 CI 拦下）/ Entry ID: starts with a letter/digit, only `. _ -` allowed, **unique across the whole marketplace** (duplicates are blocked by CI) |
| `--name` | ✅ | 卡片上显示的名字 / Name shown on the card |
| `--version` | — | 版本号，默认 `1.0.0`；**每次更新记得升版本**（如 1.0.0 → 1.0.1）/ Version, default `1.0.0`; **bump it on every update** (e.g. 1.0.0 → 1.0.1) |
| `--description` | — | 一句话描述 / One-line description |
| `--author` | — | 作者名（纯展示）/ Author name (display only) |
| `--categories` | — | 分类标签，逗号分隔（如 `plugins,skills`）/ Categories, comma-separated (e.g. `plugins,skills`) |
| `--repo-url` | — | **可选**：你的自托管仓库地址（填了就是"作者自托管"模式，见下）/ **Optional**: your self-hosted repo URL (fills = "author self-hosted" mode, see below) |
| `--dry-run` | — | 只做校验不写仓库（试跑用）/ Validate only, don't write the repo (trial run) |

### 更新已有条目 / Update an existing entry

**情况 A：条目没有 `--repo-url`（官方托管）/ Case A: entry has no `--repo-url` (officially hosted)** —— 改配置 → 重新导出 zip → 跑同一条命令（记得 `--version` 升版）→ 脚本自动更新 `items/<id>/` 和 `index.json` → 提交推送 → 用户端刷新即得新版。
Change config → re-export zip → run the same command (remember to bump `--version`) → the script updates `items/<id>/` and `index.json` → commit & push → users get the new version on refresh.

**情况 B：条目带 `--repo-url`（作者自托管，推荐给维护者）/ Case B: entry has `--repo-url` (author self-hosted; recommended for maintainers)** —— 改配置 → 重新导出 → 把 `items/<id>/` 推到**你自己的仓库** → **完事，不用提 PR**。用户端每次下载都从你的仓库实时拉取，作者更新配置无需经官方审核。
Change config → re-export → push `items/<id>/` to **your own repo** → **done, no PR needed**. Users pull live from your repo on every download; authors update without official review.

> ⚠️ 无论哪种方式：**不能只换 zip 不换 manifest**（checksum 对不上 = 校验失败，直接 `invalid`）；新内容照样要过秘密扫描。
> Either way: **never replace the zip without updating the manifest** (checksum mismatch = validation failure, marked `invalid`); new content still goes through secret scanning.

### push 后的自动检查（你不用动手）/ Automated checks after push (hands-free)

每次 `git push`（或别人提 PR）后，GitHub Actions 自动运行 `scripts/validate-repo.mjs`，检查：
After every `git push` (or a PR from someone else), GitHub Actions automatically runs `scripts/validate-repo.mjs` to check:

1. `index.json` 结构合规（字段白名单 / 格式）/ `index.json` structure compliance (field whitelist / format)
2. **条目 id 无重复**（插件端本来不查重，这里补上）/ **No duplicate entry ids** (the plugin itself doesn't dedupe — this closes that gap)
3. 每个官方托管条目的 **8 道安全校验**（与插件下载端同一套函数）/ **8 security validations** for every officially hosted entry (same functions as the plugin's download side)
4. **内容级秘密扫描**（残留的 api key / token 字样自动拦下）/ **Content-level secret scanning** (leftover api key / token strings are blocked)
5. checksum 自洽（manifest 声明的值与 config.zip 实算一致）/ checksum consistency (manifest-declared value matches the actual config.zip hash)

结果在 GitHub 仓库的 **Actions 标签页**查看：✅ 绿 = 可放心合并；❌ 红 = 按报错修复后重新提交。
See results on the **Actions** tab of the GitHub repo: ✅ green = safe to merge; ❌ red = fix per the error and resubmit.

## 用插件一键发布（零命令行，推荐）/ One-click publishing from the plugin (zero CLI, recommended)

安装 **dsh-config-manager** 插件后，作者**不需要碰命令行**，直接在插件市场面板的「我的配置」里完成发布：
With the **dsh-config-manager** plugin installed, authors **don't need the command line** — publish directly from "My Configs" in the plugin's marketplace panel:

1. **打开 / Open**：dsh-config-manager → 「市场」tab → 顶部切换到「我的配置」/ dsh-config-manager → "Market" tab → switch to "My Configs" at the top;
2. **登录 GitHub / Sign in to GitHub**：点「使用 GitHub 登录」，按提示在浏览器完成授权（一次性授权码，token 只存在本机插件凭据里，不会上传）/ Click "Sign in with GitHub" and authorize in the browser (one-time code; the token stays in your local plugin credentials, never uploaded);
3. **选包上传 / Pick & upload**：选择用「导出」功能生成的配置 zip → 本地 8 道校验 + 秘密扫描（含密钥会被当场拒绝）→ 填名称 / 描述 / 分类（可选）→ 点「一键上传」/ Choose the config zip from "Export" → local 8 checks + secret scan (secrets are rejected on the spot) → fill name / description / category (optional) → click "One-click upload";
4. **插件自动完成 / The plugin then does everything**：
   - 把你的配置写进**你自己的公开仓库**（`<你的GitHub名>/dsh-configs`，没有会自动创建）/ Writes your config into **your own public repo** (`<your GitHub name>/dsh-configs`, auto-created if missing);
   - 自动 **fork 本市场仓库** → 在 `index.json` 里追加一条**自托管引用**（`repo` 字段指向你的仓库）→ 自动提交**收录 PR** / Automatically **forks this marketplace repo** → adds a **self-hosted reference** to `index.json` (`repo` field pointing to your repo) → files an **inclusion PR**;
   - 条目 ID / 作者 / 版本 / 时间 / SHA-256 等元数据全部自动生成，你只需填少量描述 / Entry ID / author / version / time / SHA-256 etc. are all generated; you only fill in a short description;
5. **合并后生效 / Takes effect after merge**：PR 由维护者人工审核合并后，条目即出现在本市场；条目内容始终从你的仓库实时拉取，之后你更新配置（「一键更新」）不需要再提 PR。
   After a maintainer reviews and merges the PR, the entry appears in the marketplace; entry content is always pulled live from your repo, so future updates ("One-click update") need no new PR.

> 📌 收录目标仓库固定为本仓库 `xiajiajun516/dsh-config-market`（插件内写死，界面不可修改）；
> The inclusion target is fixed to this repo `xiajiajun516/dsh-config-market` (hardcoded in the plugin, not changeable in the UI);
> 「装回本地」、状态徽章（未收录 / PR 待审核 / 已收录）都在「我的配置」里可视化展示。
> "Install back locally" and status badges (not included / PR pending / included) are all shown visually in "My Configs".

## 如何提交一个条目（社区协作流程·手动）/ How to submit an entry (community flow, manual)

1. 在 dsh-config-manager「发布到市场」向导完成发布：选 zip → 本地校验（拒绝含密钥）→ 生成条目包（manifest + SHA-256）→ 下载发布包；
   Complete publishing in the dsh-config-manager "Publish to marketplace" wizard: pick zip → local validation (secrets rejected) → generate entry package (manifest + SHA-256) → download the package;
2. 把 `items/<id>/`（manifest.json + config.zip）推到**自己的公开仓库**；
   Push `items/<id>/` (manifest.json + config.zip) to **your own public repo**;
3. 提 **PR 到本仓库的 `index.json`**，在 `items[]` 里追加一条引用（`id` + `name` + `repo` 等）；
   Open a **PR to this repo's `index.json`**, appending a reference in `items[]` (`id` + `name` + `repo`, etc.);
4. 维护者**人工审核**后合并；
   A maintainer **reviews manually** then merges;
5. 用户端 `pull --ff-only` 自动拿到新引用；条目内容始终从作者仓库实时拉取，作者更新配置无需再提 PR。
   Users get the new reference automatically via `pull --ff-only`; entry content is always pulled live from the author's repo, so authors don't need new PRs for updates.

> 也可以在 PR 里直接附上 `items/<id>/`（条目本体），由官方仓库托管。
> You may also include `items/<id>/` (the entry itself) in the PR to have it officially hosted.

## 版权与授权 / Copyright & license

- 本仓库**自身内容**（`index.json`、`README.md`、`docs/`、`scripts/` 等）以 **MIT License** 授权（见 [LICENSE](LICENSE)）；
- This repo's **own content** (`index.json`, `README.md`, `docs/`, `scripts/`, etc.) is licensed under the **MIT License** (see [LICENSE](LICENSE));
- **条目内容版权归各自作者**：`items/<id>/` 下或自托管仓库里的配置，被收录到市场**不代表版权转让**；
- **Entry content belongs to its respective author**: configs under `items/<id>/` or in self-hosted repos are not a **copyright transfer** when included in the marketplace;
- 通过插件「我的配置」一键上传的条目同理，作者保留其配置的完整权利；
- The same applies to entries uploaded via the plugin's "My Configs": authors retain full rights to their configs;
- 引用本仓库内容时请保留来源标注（署名 + 链接）。
- When referencing this repo's content, please keep attribution (name + link).

## 技术规格 / Technical spec

完整搭建/校验规格见 [docs/design/2026-08-19-market-repo-setup-guide.md](docs/design/2026-08-19-market-repo-setup-guide.md)。
Full setup/validation spec: [docs/design/2026-08-19-market-repo-setup-guide.md](docs/design/2026-08-19-market-repo-setup-guide.md). (中文规格书 / Chinese-language spec)