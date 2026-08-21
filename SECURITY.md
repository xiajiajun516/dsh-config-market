# 安全策略 / Security Policy

## 什么算安全问题（本仓库范围内）/ What counts as a security issue (in this repo)

- 某条目内容**疑似含密钥/凭据**（api key、token、password 等）或恶意脚本；
- An entry **appears to contain secrets/credentials** (api key, token, password, etc.) or malicious scripts;
- 某条目**描述与实际不符、诱导安装**（钓鱼式条目）；
- An entry **misrepresents itself or lures people into installing** (phishing-style entries);
- 仓库/CI 被侵入的迹象（例如 `index.json` 被异常改写、工作流被篡改）；
- Signs that the repo/CI has been compromised (e.g. an abnormal rewrite of `index.json`, tampered workflows);
- 插件端校验逻辑 / 秘密扫描的绕过方法。
- Ways to bypass the plugin's validation logic / secret scanning.

> 市场通道本身**永远禁止携带任何秘密**：插件端有 8 道校验 + 内容级秘密扫描，「市场 = 不可信输入」是硬红线，适用于一切条目。
> The marketplace channel itself **always forbids carrying any secrets**: the plugin runs 8 validations + content-level secret scanning, and "marketplace = untrusted input" is a hard red line that applies to every entry.

## 怎么报告（按优先级）/ How to report (by priority)

1. **首选（私密）/ Preferred (private)**：GitHub 的 **Private vulnerability reporting**
   —— 在仓库 Settings → Code security and analysis 里开启后，仓库 **Security** 标签页会出现
   「Report a vulnerability」按钮。报告**只对维护者可见**，不会在公开 Issue 里暴露细节。
   GitHub's **Private vulnerability reporting** — after enabling it in repo Settings → Code security and analysis,
   a "Report a vulnerability" button appears on the repo's **Security** tab. Reports are **visible only to maintainers**,
   so no details are exposed in public issues.
2. **未开启私密报告时 / If private reporting isn't enabled**：私信/联系维护者，或开一个公开 Issue（选「条目故障」模板，标题加 `[安全]` 前缀），敏感细节可以只在私聊里说。
   Message/contact the maintainer, or open a public issue (use the "Entry issue" form with a `[Security]` prefix in the title) — sensitive details can be shared only in private chat.

> 非敏感的一般故障（下载失败、校验不过）请直接走 Issue 模板「条目故障」，**不要**占用安全通道。
> Non-sensitive, ordinary problems (download failure, validation failure) should go through the "Entry issue" form — **don't** use the security channel for them.

## 我们承诺怎么做 / What we commit to

- 收到报告后 **48 小时**内确认并开始处理（维护者空闲时间，尽力而为）；
- Acknowledge and start handling reports within **48 hours** (maintainer's spare time, best effort);
- 确认有问题的条目会**立即下架 / 移除索引引用**；
- Confirmed problematic entries are **removed immediately / their index references are removed**;
- 如需公开披露，在修复完成后再统一说明，不提前暴露细节。
- If public disclosure is needed, it happens after the fix is done — no details are leaked early.

## 非安全问题（请别走这里）/ Non-security topics (don't file here)

- 插件本身的 bug / 功能建议 → dsh-config-manager 插件的反馈渠道；
- Plugin bugs / feature requests → the dsh-config-manager plugin's feedback channel;
- 配置怎么用、想要什么新功能 → 普通 Issue，欢迎随便聊。
- How to use configs, or feature ideas → a regular issue; casual talk is welcome.