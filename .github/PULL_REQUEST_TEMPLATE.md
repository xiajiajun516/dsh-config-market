## 这个 PR 做了什么？/ What does this PR do?

- [ ] 收录新条目（第一次上架）/ Add a new entry (first publish)
- [ ] 更新已有条目（升版本）/ Update an existing entry (bump version)
- [ ] 下架条目 / Remove an entry
- [ ] 其他（请在下方说明）/ Other (explain below)

## 条目信息（收录 / 更新时填写）/ Entry info (for adding / updating)

- **条目 ID / Entry ID**：`<id>`（全市场唯一；重复会被 CI 拦下 / unique in the whole marketplace; duplicates are blocked by CI）
- **托管方式 / Hosting**：☐ 官方托管（本 PR 带 `items/<id>/` 目录内容）／ ☐ 作者自托管（只改 `index.json` 加 `repo` 引用）
  ☐ Officially hosted (this PR includes the `items/<id>/` directory) / ☐ Author self-hosted (only add a `repo` reference to `index.json`)
- **条目名称 / Entry name**：
- **版本号**（更新条目时）/ **Version** (when updating)：`x.y.z`（必须递增 / must increase）
- **一句话描述 / One-line description**：

## CI 会自动检查这些（你不需要手工跑）/ CI checks these automatically (no need to run manually)

1. `index.json` 结构合规（字段白名单）/ `index.json` structure compliance (field whitelist)
2. 条目 id 不重复 / No duplicate entry ids
3. 官方托管条目通过 8 道安全校验（与插件端同款）/ Officially hosted entries pass the 8 security validations (same as the plugin)
4. 内容级秘密扫描（api key / token / password 字样会被拦下）/ Content-level secret scanning (api key / token / password strings are blocked)
5. checksum 自洽（manifest 声明值 = config.zip 实算值）/ checksum consistency (manifest-declared value = actual config.zip hash)

> 👉 提交后请到 **Actions** 标签页看检查结果：✅ 绿 = 等维护者合并；❌ 红 = 按报错修改后重新提交。
> After submitting, check the **Actions** tab: ✅ green = wait for maintainer merge; ❌ red = fix per the error and resubmit.

## 说明（可选）/ Notes (optional)

<!-- 其他想对维护者说的话 / Anything else for the maintainer -->