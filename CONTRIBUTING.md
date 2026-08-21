# 贡献指南

感谢你想为 DSH 配置市场添砖加瓦！本仓库是**纯内容仓库**（`index.json` 索引 + 条目包），没有程序代码。

## 两种投稿方式（选一个）

### 方式 A：插件端「一键上传」（零命令行，推荐给所有人）

安装 dsh-config-manager 插件 → 「市场」→「我的配置」→ 登录 GitHub → 选导出 zip →「一键上传」。
插件自动完成：把你的配置写进**你自己的公开仓库** → fork 本仓库 → 在 `index.json` 追加
自托管引用 → 自动提**收录 PR**。你全程不用碰命令行。

### 方式 B：命令行动手（维护者 / 进阶用户）

见 README「发布 / 更新 / 投稿 实操指南」：
`node scripts/publish.mjs --zip ...`，生成的 `items/<id>/` 提交到本仓库（官方托管），
或推到你自己的仓库并只把 `index.json` 引用提成 PR（作者自托管）。

## PR 规范（人工提 PR 时自查）

- ☐ 条目 id **全市场唯一**（只含字母/数字/点/下划线/连字符）；
- ☐ 更新条目时**版本号递增**（1.0.0 → 1.0.1）；
- ☐ **不含任何密钥/凭据**，不含 `secrets` / `sessions` / `pluginFiles` / `self` 分区；
- ☐ `manifest.json` 的 checksum 与 `config.zip` 一致（用插件生成，别手写）；
- ☐ 提交后看 **Actions** 标签页：❌ 红的按报错改，✅ 绿了等合并。

## 审核流程（你提交之后）

- 插件自动提的收录 PR（分支 `dsh-market-sync/<itemId>`）与手动 PR **都走 CI 预检 + 维护者人工审核**；
- CI 全绿是合并的**前置条件**，但不是充分条件——维护者还会看一眼条目内容是否合理；
- 作者自托管的条目：合并后你更新内容**无需再提 PR**（用户端每次实时拉取你的仓库）。

## 行为约定

- 对事不对人；发现可疑条目请走 `SECURITY.md` 或「条目故障」Issue 模板，不要在评论区开撕；
- 一个问题一个 Issue / PR，方便追踪。

## 目录速查

```
index.json                    # 市场目录（唯一必建文件）
items/<itemId>/               # 官方托管条目（manifest.json + config.zip）
scripts/publish.mjs           # 一键发布 / 更新条目
scripts/validate-repo.mjs     # CI 校验脚本（push / PR 自动跑）
```