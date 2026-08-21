# DSH 官方配置市场

> 本仓库是 **DSH Config Manager 插件（dsh-config-manager）** 的官方配置市场仓库。
> 它**不包含任何程序代码**，只是一个纯内容仓库：存放社区共享的 DSH 配置包
> （settings / 模型供应商 / 插件 / skill / agent preset 等），
> 供所有安装了该插件的用户通过「配置市场」面板浏览、下载、校验并一键导入。

## 它怎么工作（一句话版）

- 本仓库 = **目录索引**（`index.json`），只收录条目的元信息与引用；
- 条目内容（`manifest.json` + `config.zip`）由**作者在自己的公开 git 仓库自托管**
  （也可以直接放在本仓库 `items/<id>/` 下）；
- 官方仓库**永远只读、零凭据**：插件端只做 `git clone --depth 1` + `git pull --ff-only`，
  绝不写回、绝不需要任何 token。

## 目录结构

```
dsh-config-market/
├── index.json                  # L1 市场目录（唯一必建文件）
├── README.md                   # 本文件
├── scripts/                    # 自动化工具（见「发布/更新/投稿 实操指南」）
│   ├── publish.mjs             #   一键发布/更新条目
│   └── validate-repo.mjs       #   仓库预检（CI 自动调用）
├── .github/                    # GitHub 端配置（CI / Issue 表单 / PR 模板）
│   ├── workflows/validate.yml  #   CI 预检（push/PR 自动跑）
│   ├── ISSUE_TEMPLATE/         #   Issue 表单（新条目/故障/其他）
│   └── PULL_REQUEST_TEMPLATE.md#   PR 模板
├── CONTRIBUTING.md             # 投稿指南
├── SECURITY.md                 # 安全问题报告通道
├── LICENSE                     # MIT 授权（仅限本仓库自身内容）
└── items/
    └── <itemId>/               # 每个条目一个目录；目录名 = itemId
        ├── manifest.json       # L2 条目清单（sections + checksums + 供应链信息）
        └── config.zip          # L3 实际配置内容（导出/备份格式 ZIP）
```

## 安全红线（硬性要求）

从市场下载的条目一律视为「未经官方审核的不可信输入」。**以下内容严禁出现在任何条目中**：

- ❌ 任何密钥/凭据（api key / token / password 等）——市场通道永不携带秘密，
  插件端会做 8 道校验 + 内容级秘密扫描，发现即拒绝；
- ❌ 含禁止分区的条目：`secrets`（凭据）、`sessions`（历史会话）、
  `pluginFiles`（任意文件）、`self`（本地环境信息）；
- ❌ 非 `http(s)` 或带 userinfo（`user:pass@`）的 `repo` 引用；
- ❌ 在 `index.json` 里引入字段白名单之外的任何字段（会导致整份 index 被拒绝）。

> 💡 **最省事的生成方式**：不要手写 `config.zip` —— 用 dsh-config-manager 插件的
> 「导出」功能生成备份 zip（结构天然正确），再用「发布到市场 → 生成条目包」自动产出
> `manifest.json` 与 SHA-256。本仓库的人工维护只碰 `index.json` 引用。

## 发布 / 更新 / 投稿 实操指南（自动化）

本仓库配套了两个自动化工具（`scripts/` 目录），把「发布 → 校验 → 收录」从手工操作变成一条命令 + 自动安检。

### 什么时候用哪个（先看这个）

| 你想做什么 | 用什么 | 要手动操作吗 |
|---|---|---|
| **发布一个新条目**（第一次上架） | `publish.mjs` | 要，跑一条命令 |
| **更新一个已有条目**（出新版本） | `publish.mjs` | 要，跑一条命令 |
| **检查仓库有没有问题**（重复 id / 校验不过 / 含密钥） | CI 自动跑 `validate-repo.mjs` | **不用**，push 后机器人自动查 |
| **在 GitHub 上看检查结果** | GitHub 网页的 Actions 标签页 | 不用，push 后自动出现 |

> 👉 普通用户（只是浏览/下载市场）**不需要用任何命令**。只有作者/维护者（要上架或改版的人）才用 `publish.mjs`。

### 前置准备（只需一次）

```bash
# 1. 装 Node.js（≥ 20，含 npm）
# 2. 克隆官方仓库
git clone https://github.com/xiajiajun516/dsh-config-market.git
cd dsh-config-market
```

> 本机已装好 Node 的话，直接跳过第 1 步。`validate-repo.mjs` 能自动找到本机已安装的 dsh-config-manager 插件，无需额外 `npm i`。

### 发布一个新条目

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

> 💡 **Windows 用户**（PowerShell / CMD）：把命令写成一行即可（去掉 `\` 换行），例如：
> `node scripts/publish.mjs --zip 你的配置.zip --id 条目id --name "条目显示名" --version 1.0.0`

**参数说明（通俗版）**：

| 参数 | 必填 | 说明 |
|---|---|---|
| `--zip` | ✅ | 你的配置文件路径（用插件的「导出」功能生成，结构天然正确） |
| `--id` | ✅ | 条目身份证号：字母/数字开头，只能含 `. _ -`，**整个市场唯一**（与他人重复会被 CI 拦下） |
| `--name` | ✅ | 卡片上显示的名字 |
| `--version` | — | 版本号，默认 `1.0.0`；**每次更新记得升版本**（如 1.0.0 → 1.0.1） |
| `--description` | — | 一句话描述 |
| `--author` | — | 作者名（纯展示） |
| `--categories` | — | 分类标签，逗号分隔（如 `plugins,skills`） |
| `--repo-url` | — | **可选**：你的自托管仓库地址（填了就是"作者自托管"模式，见下） |
| `--dry-run` | — | 只做校验不写仓库（试跑用） |

### 更新已有条目

**情况 A：条目没有 `--repo-url`（官方托管）** —— 改配置 → 重新导出 zip → 跑同一条命令（记得 `--version` 升版）→ 脚本自动更新 `items/<id>/` 和 `index.json` → 提交推送 → 用户端刷新即得新版。

**情况 B：条目带 `--repo-url`（作者自托管，推荐给维护者）** —— 改配置 → 重新导出 → 把 `items/<id>/` 推到**你自己的仓库** → **完事，不用提 PR**。用户端每次下载都从你的仓库实时拉取，作者更新配置无需经官方审核。

> ⚠️ 无论哪种方式：**不能只换 zip 不换 manifest**（checksum 对不上 = 校验失败，直接 `invalid`）；新内容照样要过秘密扫描。

### push 后的自动检查（你不用动手）

每次 `git push`（或别人提 PR）后，GitHub Actions 自动运行 `scripts/validate-repo.mjs`，检查：

1. `index.json` 结构合规（字段白名单 / 格式）
2. **条目 id 无重复**（插件端本来不查重，这里补上）
3. 每个官方托管条目的 **8 道安全校验**（与插件下载端同一套函数）
4. **内容级秘密扫描**（残留的 api key / token 字样自动拦下）
5. checksum 自洽（manifest 声明的值与 config.zip 实算一致）

结果在 GitHub 仓库的 **Actions 标签页**查看：✅ 绿 = 可放心合并；❌ 红 = 按报错修复后重新提交。

## 用插件一键发布（零命令行，推荐）

安装 **dsh-config-manager** 插件后，作者**不需要碰命令行**，直接在插件市场面板的「我的配置」里完成发布：

1. **打开**：dsh-config-manager → 「市场」tab → 顶部切换到「我的配置」；
2. **登录 GitHub**：点「使用 GitHub 登录」，按提示在浏览器完成授权（一次性授权码，token 只存在本机插件凭据里，不会上传）；
3. **选包上传**：选择用「导出」功能生成的配置 zip → 本地 8 道校验 + 秘密扫描（含密钥会被当场拒绝）→ 填名称 / 描述 / 分类（可选）→ 点「一键上传」；
4. **插件自动完成**：
   - 把你的配置写进**你自己的公开仓库**（`<你的GitHub名>/dsh-configs`，没有会自动创建）；
   - 自动 **fork 本市场仓库** → 在 `index.json` 里追加一条**自托管引用**（`repo` 字段指向你的仓库）→ 自动提交**收录 PR**；
   - 条目 ID / 作者 / 版本 / 时间 / SHA-256 等元数据全部自动生成，你只需填少量描述；
5. **合并后生效**：PR 由维护者人工审核合并后，条目即出现在本市场；条目内容始终从你的仓库实时拉取，之后你更新配置（「一键更新」）不需要再提 PR。

> 📌 收录目标仓库固定为本仓库 `xiajiajun516/dsh-config-market`（插件内写死，界面不可修改）；
> 「装回本地」、状态徽章（未收录 / PR 待审核 / 已收录）都在「我的配置」里可视化展示。

## 如何提交一个条目（社区协作流程·手动）

1. 在 dsh-config-manager「发布到市场」向导完成发布：
   选 zip → 本地校验（拒绝含密钥）→ 生成条目包（manifest + SHA-256）→ 下载发布包；
2. 把 `items/<id>/`（manifest.json + config.zip）推到**自己的公开仓库**；
3. 提 **PR 到本仓库的 `index.json`**，在 `items[]` 里追加一条引用（`id` + `name` + `repo` 等）；
4. 维护者**人工审核**后合并；
5. 用户端 `pull --ff-only` 自动拿到新引用；条目内容始终从作者仓库实时拉取，
   作者更新配置无需再提 PR。

> 也可以在 PR 里直接附上 `items/<id>/`（条目本体），由官方仓库托管。

## 版权与授权

- 本仓库**自身内容**（`index.json`、`README.md`、`docs/`、`scripts/` 等）以 **MIT License** 授权（见 [LICENSE](LICENSE)）；
- **条目内容版权归各自作者**：`items/<id>/` 下或自托管仓库里的配置，被收录到市场**不代表版权转让**；
- 通过插件「我的配置」一键上传的条目同理，作者保留其配置的完整权利；
- 引用本仓库内容时请保留来源标注（署名 + 链接）。

## 技术规格

完整搭建/校验规格见 [docs/design/2026-08-19-market-repo-setup-guide.md](docs/design/2026-08-19-market-repo-setup-guide.md)。
