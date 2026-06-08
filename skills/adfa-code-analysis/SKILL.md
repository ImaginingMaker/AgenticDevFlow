---
name: adfa-code-analysis
description: >
  统一代码分析技能。三模式索引树：
  **mode:context** — 单文件/模块调用链追踪与代码理解；
  **mode:scan** — 项目级代码资产盘点（submode:full 全量扫描 / submode:quick 快速相似匹配）；
  **mode:extract** — 可复用逻辑提取（Hook/Composable/Behavior）。
  平台感知自动路由到 React / Vue / 小程序 / 跨端策略。
  TRIGGER: 用户说"理解这段代码"、"追踪调用链"（→context）；
  "扫描代码"、"盘点资产"、"项目中有哪些组件"、"代码审计"（→scan/full）；
  "找相似"、"参考一下"、"有没有现成的"、"项目中怎么做"（→scan/quick）；
  "提取Hooks"、"封装Hook"、"复用这段逻辑"、"提取Composable"、"提取Behaviors"（→extract）。
  Use proactively when: 用户需要理解已有代码、盘点项目资产、查找复用候选、提取可复用逻辑单元。
---

# adfa-code-analysis — 统一代码分析

> **索引树入口**。通过模式路由分发到对应子能力，各模式的详细流程按需从 `references/` 加载。

---

## 模式路由

| 触发条件 | 模式 | 加载路径 |
|---------|------|---------|
| "理解这段代码"、"分析这个模块"、"代码逻辑梳理"、"追踪调用链"、"帮我看看这个文件" | **mode:context** | `references/code-context-flow.md` |
| "扫描代码"、"盘点资产"、"代码审计"、"代码资产盘点"、"项目中有哪些组件"、"项目中有什么" | **mode:scan → submode:full** | `references/scan-full.md` |
| "找相似"、"参考一下"、"有没有现成的"、"类似的"、"项目中怎么做" | **mode:scan → submode:quick** | `references/scan-quick.md` |
| "提取Hooks"、"提取Composable"、"提取Behaviors"、"封装Hook"、"复用这段逻辑"、"抽取公共逻辑" | **mode:extract** | `references/extract-overview.md` |

### 模式判定逻辑

```
用户输入 → 匹配触发词：
  ├─ 含"理解"/"分析模块"/"追踪调用链"/"代码上下文" → mode:context
  ├─ 含"扫描"/"盘点"/"审计"/"组件" → mode:scan → submode:full
  ├─ 含"找相似"/"参考"/"现成"/"类似" → mode:scan → submode:quick
  └─ 含"提取"/"封装"/"复用"/"Hook"/"Composable"/"Behavior" → mode:extract
```

> **注意**：`mode:scan→quick` 的触发词已从此前的 `adfp-architecture-designer` 统一归口到此。
> architecture-designer 不再直接响应快速匹配，而是通过委托本技能执行。

---

## 平台感知（三链路检测）

> 公共三链路检测机制（链路 A 工程模式 / 链路 B 敏捷主动检测 / 链路 C 用户指定 → 通用降级）在 `adfo-harness-runner/references/platform-detection.md` 中统一管理。

检测结果注入到各模式 SubAgent 的 `{framework}` 变量。

---

## 核心约束

| 规则 | 说明 |
|------|------|
| **只读不写** | 三个模式均只分析代码，不修改任何源码 |
| **渐进式加载** | SKILL.md 仅含路由表，各模式的详细流程在 `references/` 中按需加载 |
| **SubAgent 委托** | 涉及并发 SubAgent 的模式（scan/full→3SA, scan/quick→2SA, extract→4SA）均通过 `adfo-task-orchestrator` 调度，委托与聚合协议见 `adfo-harness-runner/references/subagent-delegation.md` |
| **产物一致性** | 各模式产物 front-matter 必须包含 `phase` 字段，且与当前阶段一致 |
| **质量门** | 各模式都有自己的输出校验标准（详见对应 references） |

---

## 产物输出

| 模式 | 产物 | phase |
|------|------|-------|
| context | `{target}-context-report.md` | CONTEXT |
| scan/full | `code-scan-report.md` | CODE_SCAN |
| scan/quick | `component-match.md` | QUICK_MATCH |
| extract | 对话输出（+ 建议写入 `extraction-report.md`） | EXTRACT |

---

## 依赖关系

| 技能 | 关系 | 说明 |
|------|------|------|
| `adfo-task-orchestrator` | **委托调度** | 各模式中涉及并发 SubAgent 时委托调度 |
| `adfo-harness-runner` | **编排调度** | 工程模式下由 harness 调度，读取 `state.json.techStack` |
| `adfp-architecture-designer` | **下游消费（scan）** | 消费 `code-scan-report.md` 做架构决策 |
| `adfp-code-implementer` | **下游消费（scan）** | IMPLEMENT 前扫描可复用资产 |
| `adfp-code-reviewer` | **下游触发（extract）** | 审查发现可提取模式时建议调用 |
| `adfa-refactor-advisor` | **互补** | extract 专注逻辑提取，refactor 覆盖更广的结构性重构 |
| `adfa-edge-case-master` | **下游消费（scan/context）** | 理解逻辑后生成测试用例 |
| `adft-page-wiki-generator` | **互补** | wiki 生成**页面级**链路，本技能做**模块级**分析 |

---

## 与外部技能的职责边界

| 技能 | 边界 |
|------|------|
| `adfp-architecture-designer` | architecture-designer **全局架构规划**，本技能扫描/分析（宏观+微观+提取）为架构决策提供输入 |
| `adfa-refactor-advisor` | refactor-advisor **出重构方案**（结构改造），本技能 extract 只做**逻辑提取**（不修改结构） |
| `adfp-code-reviewer` | reviewer **评估代码质量**，本技能 context 帮助**建立心智模型**（理解做什么再评判好不好） |
| `adfp-code-implementer` | implementer **生成新代码**，本技能所有模式**只分析已有代码** |

---

## 模板注入

> 共享配置由 `adfo-harness-runner/templates/custom.md` 统一管理。

`templates/custom.md` — 本技能特有的分析规则配置（扫描路径映射、原子化评级阈值、忽略模式、命名约定）。
