# adft-agent-browser
> agent-browser 浏览器自动化完整指南。包含登录态获取（macOS Keychain 问题解决）及完整浏览器操作工作流。

## 基本信息

| 属性 | 值 |
|------|-----|
| **名称** | adft-agent-browser |
| **类型** | 工具 |
| **前缀** | adft- |
| **触发词** | agent-browser、浏览器登录态、复用 Chrome Cookie、浏览器自动化、打开网站、填写表单、点击按钮、截图、提取数据、agent-browser profile 登录 |
| **文件位置** | skills/adft-agent-browser/SKILL.md |

## 核心特性

- **macOS 登录态获取**：解决 Chrome for Testing 与真 Chrome Keychain 密钥不匹配导致的 Cookie 解密失败
- **无障碍树快照**：~200-400 tokens 的低成本页面交互，通过 `@eN` ref 定位元素
- **语义化定位器**：按角色/文本/标签/占位符定位元素，无需先 snapshot
- **会话持久化**：跨重启保留登录态（支持 AES-256-GCM 加密）
- **完整自动化**：导航、点击、表单、截图、网络控制、视频录制、React DevTools
- **安全策略**：域名白名单、操作策略、输出截断、内容边界标记

## 使用方式

```bash
# 导航 + 交互
agent-browser open https://example.com
agent-browser snapshot -i
agent-browser click @e3
agent-browser fill @e4 "hello"

# macOS 登录态
agent-browser --profile Default \
  --executable-path "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  open https://app.example.com

# 会话持久化
agent-browser --state ./auth.json open https://app.example.com
```

## 依赖关系

| 关系类型 | 说明 |
|---------|------|
| `前置输入` | 用户提供的 URL、凭据、浏览器 profile 路径 |
| `后置消费` | 截图/PDF 被 adft-page-wiki-generator 消费; 数据提取结果作为下游任务输入 |
| `可选触发` | adfa-dev-helper 推荐本技能; adfo-task-orchestrator 可编排批量浏览器任务 |
| `编排调度` | 无（独立工具技能，不接入 harness-runner 流水线阶段） |

## 流程生命周期

### 触发条件

- **手动触发**：用户输入触发词（agent-browser、浏览器自动化、截图等）
- **下游回调**：其他技能需要浏览器操作时手动调用

### 生命周期图

```
用户触发
   │
   ├─ 【登录态获取】→ `--profile` + `--executable-path` → `snapshot -i` 验证
   │
   ├─ 【核心循环】→ `open url` → `snapshot -i` → `click/fill @eN` → `snapshot -i`
   │
   ├─ 【会话持久化】→ `state save ./auth.json` → 后续 `--state` 恢复
   │
   └─ 【数据提取】→ `snapshot -i --json` / `get text @eN` / `eval --stdin`
          │
          └─ 异常路径：ref 失效 → 重新 snapshot → 重试操作
```

### 在完整流水线中的位置

独立工具技能，不参与 `PRD → SPEC → DESIGN → IMPLEMENT → REVIEW` 正向交付流水线。可在任意阶段被手动调用。

### 产物状态

| 产物 | 路径 | 状态流转 |
|------|------|---------|
| 快照 | stdout / JSON 文件 | 临时 → 下游读取 |
| 截图 | 指定路径 / 临时目录 | 临时文件 → 下游消费或持久化 |
| 状态文件 | `./auth.json`（自定义路径） | 加密/明文 → 跨会话复用 |
| PDF | 指定路径 | 临时 → 下游消费 |
| WebM 录制 | 指定路径 | 临时 → 归档 |
| HAR 文件 | 指定路径 | 敏感 → 使用后删除 |

## 与现有技能的职责边界

本技能与现有所有技能**无职责重叠**：

| 技能 | 关系说明 | 重叠判定 |
|------|---------|---------|
| `adft-page-wiki-generator` | 本技能提供截图 — 下游消费。前者生成 Wiki，后者提供浏览器截图素材，互为上下游 | 低度（仅截图输出被消费） |
| `adfo-task-orchestrator` | 可编排多个 `agent-browser` 会话并行执行 | 无重叠（不同职责） |
| `adfa-dev-helper` | dev-helper 可推荐本技能 | 无重叠（推荐关系） |
| 其余所有技能 | 无任何交集 | 无重叠 |

## 工作流程

### 1. 获取浏览器登录态
```bash
agent-browser --profile Default \
  --executable-path "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  open https://www.google.com
agent-browser snapshot -i    # 验证
```

### 2. 核心工作循环
```bash
agent-browser open <url>
agent-browser snapshot -i
agent-browser click @e3
agent-browser snapshot -i    # 重新获取 ref
```

### 3. 会话持久化
```bash
agent-browser state save ./auth.json
agent-browser --state ./auth.json open https://app.example.com
```

## 约束规则

1. **macOS 登录态必传 `--executable-path`**：否则 Keychain 解密失败
2. **ref 生命周期**：页面变化后立即重新 snapshot
3. **操作优先级**：`snapshot + @eN` > `find` > CSS 选择器
4. **状态文件安全**：加入 `.gitignore`
5. **凭据保护**：使用 `--password-stdin` 避免 shell 历史
6. **远程调试安全**：`--remote-debugging-port` 使用后立即关闭

## 模板注入

> 共享配置由 `adfo-harness-runner/templates/custom.md` 统一管理。
>
> `templates/custom.md` — 本技能特有配置（工具技能，无阶段映射）

## 测试用例

详见 `skills/adft-agent-browser/test/evals.md`：

- **核心场景**：6 个核心操作场景
- **边界测试**：8 个边界/异常场景
- **集成测试**：3 个上下游技能集成点
