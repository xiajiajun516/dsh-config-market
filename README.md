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

## 如何提交一个条目（社区协作流程）

1. 在 dsh-config-manager「发布到市场」向导完成发布：
   选 zip → 本地校验（拒绝含密钥）→ 生成条目包（manifest + SHA-256）→ 下载发布包；
2. 把 `items/<id>/`（manifest.json + config.zip）推到**自己的公开仓库**；
3. 提 **PR 到本仓库的 `index.json`**，在 `items[]` 里追加一条引用（`id` + `name` + `repo` 等）；
4. 维护者**人工审核**后合并；
5. 用户端 `pull --ff-only` 自动拿到新引用；条目内容始终从作者仓库实时拉取，
   作者更新配置无需再提 PR。

> 也可以在 PR 里直接附上 `items/<id>/`（条目本体），由官方仓库托管。

## 技术规格

完整搭建/校验规格见 [docs/design/2026-08-19-market-repo-setup-guide.md](docs/design/2026-08-19-market-repo-setup-guide.md)。
