---
name: adfp-code-reviewer
description: "前端代码审查专家。对前端代码进行 7 维度审查：类型安全、框架规范、性能与体积、边界处理与UX完整性、代码质量与复用、视觉美学、副作用分析。其中「边界处理与UX完整性」维度覆盖四态检查（loading/empty/error/ErrorBoundary）+ 交互反馈完整性（操作反馈、空列表引导、竞态取消、弱网处理），确保代码实现不仅功能正确，用户体验也完整。智能感知目标框架，加载对应检查清单。支持 Git 模式，加权评分，高频问题模式识别，发现问题可直接修复。TRIGGER: 用户说'审查代码'、'code review'、'帮我review'、'检查代码'、'代码质量'、'看看这段代码'、'提交前检查'、'PR审查'。Use proactively when: 用户刚完成代码实现或修改，需要质量检查或提交前审查；需要验证代码的UX完整性（交互反馈、状态兜底）。"
---

# 前端代码审查专家

> 入口页：按平台路由加载对应框架检查清单。
> 详细清单见 `references/checklist.md`；框架矩阵见 `references/framework-matrix.md`；完整审查流程见 `references/review-flow.md`。

对前端代码执行 7 维度审查，支持 Git 模式、加权评分、高频模式快速识别，发现问题可直接修复。

---

## 平台感知

### 谁是感知者？

本技能自身执行框架检测，**不依赖外部注入**。

检测有三条链路，按优先级依次尝试：

**链路 A — 工程模式（被动接收）**：
- 当被 `adfo-harness-runner` 调度时，从 `state.json.techStack` 读取目标框架
- 由编排器在 `context` 命令中注入 `techStack` 上下文
- 此为最高优先级，直接使用不重复检测

**链路 B — 敏捷模式（主动检测）**：
- 直接调用本技能时，技能依次扫描：
  1. 读取 `package.json` 的 `dependencies` / `devDependencies`，匹配框架关键字
  2. 读取框架配置文件：`next.config.*`（React）、`nuxt.config.*`（Vue）、`vite.config.*`（根据插件判断）、`project.config.json`（小程序）、`taro-config.*`（Taro）、`pages.json`（uni-app）
  3. 扫描目录结构分析框架倾向
- 检测到 → 直接使用；检测不到 → 进入链路 C

**链路 C — 用户指定（显式询问）**：
- 向用户提问：「目标框架是哪个？React / Vue 3 / 微信小程序 / Taro/uni-app / 通用前端」
- 接收用户回答后使用
- 用户不确定或跳过 → 进入通用降级路径

**全部失败 → 通用降级**：按通用前端维度执行，提示用户可指定框架

### 检测路由表

| 检测条件 | 路由目标 | 检查清单加载 |
|------|---------|------------|
| `React*` / `JSX` / `TSX` | React 审查 | `framework-matrix.md#react` |
| `Vue*` / `Vue 3` / `Nuxt` | Vue 审查 | `framework-matrix.md#vue` |
| `微信小程序` / `小程序` | 小程序审查 | `framework-matrix.md#miniapp` |
| `Taro` / `uni-app` | 跨端审查 | `framework-matrix.md#cross-platform` |
| 未知 | 通用审查 | checklist.md（通用前端规范） |

> 工程模式下从 `state.json.techStack` 读取已识别的技术栈，避免重复扫描。

---

## 审查模式选择

| 参数 | 审查重点 |
|------|---------|
| `--commit=<hash>` | diff 变更部分 |
| `--staged` | 暂存区变更 |
| `--path=<path>` | 完整目录内容 |
| `--file=<file>` | 单个文件 |
| 无参数 | 用户指定/粘贴 |

> 大量变更（>10 文件）：先用 `--stat` 全局视图，优先审查核心业务逻辑。

---

## 7 维度概览（详细流程见 `references/review-flow.md`）

| 维度 | 权重 | 核心关注 |
|------|------|---------|
| 1️⃣ 类型安全 | 15% | Props 类型、any 滥用、事件类型、空值处理 |
| 2️⃣ 框架规范 | 15% | 框架特有最佳实践（按平台路由） |
| 3️⃣ 性能与体积 | 15% | key 稳定性、不必要重渲染、Bundle 体积 |
| 4️⃣ 边界处理与UX完整性 | 15% | 四态覆盖（Loading/Empty/Error/ErrorBoundary）+ 交互反馈完整（操作反馈、弱网断网、空列表引导、竞态取消） |
| 5️⃣ 代码质量与复用 | 15% | 深层嵌套、硬编码、DRY |
| 6️⃣ 视觉美学 | 10% | 字体/色彩/动效/布局意图、AI 模板化痕迹 |
| 7️⃣ 副作用与影响分析 | 15% | 导出变更影响、下游调用方、全局状态 |

7 维度通过 `adfo-task-orchestrator` 并发执行（无依赖）。

---

## 高频问题模式

| 模式 | 严重性 | 框架特有变体 |
|------|--------|------------|
| 内存泄漏 | 🔴 | useEffect/onShow 未清理 |
| 敏感信息泄露 | 🔴 | token/key 硬编码 |
| 竞态条件 | 🔴 | async 操作未取消 |
| 缺少兜底 | 🟠 | 无 loading/empty/error |
| 操作无反馈 | 🟠 | 点击/提交后无 loading、无成功提示、无错误反馈 |
| 空状态无引导 | 🟡 | 空列表仅显示"暂无数据"，无引导操作 |
| 竞态条件 | 🔴 | async 操作未取消（fast-click 重复提交、搜索竞态） |
| 类型安全 | 🟠 | any 滥用 |
| N+1 查询 | 🟡 | 循环逐条请求 |

---

## 加权评分

| 等级 | 分数 | 结论（评分且无 critical） |
|------|------|--------------------------|
| ✅ PASS | ≥ 90 | 无 critical 问题 |
| 🟡 WARN | ≥ 70 | 仅有 medium/low |
| 🔴 FAIL | < 70 | 或存在 critical/high |

**直接修复**（确定性修改）：删除 console.log、替换硬编码、补类型标注、删冗余嵌套。修复后标注 `[已修复]`。

---

## 输出格式

```markdown
---
phase: REVIEW
status: completed
qualityGate: {pass|warn|fail}
score: {N}/100
---

## 概要
- 审查文件: X | 发现问题: Y | 已自动修复: Z
## ⚠️ 必须处理（Critical + High）
## 📋 建议优化（Medium + Low）
## 🔍 副作用影响
## 📊 维度评分
## 审查结论：{PASS / WARN / FAIL}
```

| 模式 | 输出路径 |
|------|---------|
| 敏捷模式 | `./review-report.md` 或用户指定 |
| 工程模式 | `docs/workflows/{任务ID}/review-report.md` |

---

## 约束规则

1. 每项检查必须有具体文件/行号引用
2. 直接修复仅限确定性修改
3. FAIL 时必须输出阻塞项清单和修复建议
4. 副作用分析追踪至少一级下游调用方
5. >10 文件变更时标注简要审查范围

---

## 异常处理

- 单维度 SubAgent 失败 → 重试 1 次，仍失败标记「待人工审查」
- 全部失败 → 输出错误报告
- 无效参数（hash/path 不存在）→ 容错提示可用项

---

## 模板注入

> 共享配置由 `adfo-harness-runner/templates/custom.md` 统一管理。

`templates/custom.md` — 项目特定的审查规则（阻塞性检查项、忽略规则、严重度调整）。
