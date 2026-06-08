# SKILLS 注册中心

所有技能的**唯一索引源**。新技能加入时在此注册，`adfa-dev-helper` 和 `adfo-harness-runner` 从此读取映射关系，避免硬编码。

> 自动索引机制：每个技能的 `SKILL.md` front-matter 包含 `description` 字段（含 TRIGGER 触发词）。需要发现技能时，读取各 `SKILL.md` 的 front-matter 即可推导场景→技能映射。

---

## 命名规范

本项目技能统一使用 `adf`（AgenticDevFlow）作为项目前缀，按类型定义二级前缀：

| 类型 | 前缀 | 含义 | 示例 |
|------|------|------|------|
| 流水线 | `adfp-` | AgenticDevFlow Pipeline | `adfp-code-implementer` |
| 编排 | `adfo-` | AgenticDevFlow Orchestration | `adfo-harness-runner` |
| 辅助 | `adfa-` | AgenticDevFlow Assistance | `adfa-brainstorm` |
| 工具 | `adft-` | AgenticDevFlow Tool | `adft-smart-commit` |

---

## 流水线技能（7 个）

参与正向交付流水线：PRD → SPEC → DESIGN → IMPLEMENT → REVIEW

| 技能 | 阶段 | 触发词 | 产物 |
|------|------|--------|------|
| `adfp-requirement-analyzer` | ANALYZE | 需求分析、需求拆解、开发计划 | `requirement-analysis.md` |
| `adfp-prd-generator` | PRD | 生成PRD、产品需求文档 | `prd.md` |
| `adfp-spec-generator` | SPEC | 生成SPEC、技术规格、技术方案 | `spec.md` |
| `adfp-architecture-designer` | ARCHITECTURE | 架构设计、分析项目架构、规划文件结构、找相似组件、参考一下、有没有现成的、依赖分析 | `architecture.md` / `component-match.md` |
| `adfp-component-designer` | DESIGN | 设计组件、组件设计、怎么拆分组件、组件架构、交互设计、UX设计、用户体验、状态处理、交互方案 | `design.md` |
| `adfp-code-implementer` | IMPLEMENT | 实现代码、写代码、implement、开发、帮我写代码、帮我实现组件 | 源码 + `implementation.md` |
| `adfp-code-reviewer` | REVIEW | 审查代码、code review、检查代码、提交前检查、检查交互、UX审查 | `review-report.md` |

## 编排技能（2 个）

管理流程调度与任务执行。

| 技能 | 层级 | 触发词 | 内置工具 |
|------|------|--------|---------|
| `adfo-harness-runner` | 阶段级流水线 | 启动工程模式、harness、工程化开发 | `scripts/harness-cli.js` 编译器 |
| `adfo-task-orchestrator` | 任务级并发 | 并发执行、并行处理、编排任务 | — |

## 辅助技能（8 个）

支持流水线各阶段，可在多阶段被调用。

| 技能 | 服务阶段 | 触发词 |
|------|---------|--------|
| `adfa-brainstorm` | ANALYZE 前 | 头脑风暴、brainstorm、帮我想点子 |
| `adfa-code-context` | 全阶段 | 理解这段代码、追踪调用链、代码上下文 |
| `adfa-critical-explorer` | SPEC/DESIGN 后 | 帮我分析这个方案、评审一下、找找问题 |
| `adfa-dev-helper` | 全阶段 | 开发助手、下一步、进度、推荐技能 |
| `adfa-edge-case-master` | IMPLEMENT→REVIEW | 生成测试用例、边界测试、异常场景测试 |
| `adfa-hooks-extractor` | IMPLEMENT/REVIEW | 提取Hooks、提取Composable、提取Behaviors、提取复用逻辑、封装Hook、复用这段逻辑 |
| `adfa-refactor-advisor` | REVIEW 后 | 重构、代码太乱、优化代码结构 |
| `adfa-ux-interaction-checker` | DESIGN/IMPLEMENT 后 | 检查交互缺陷、UX审查、交互检查、体验问题 |

## 工具技能（4 个）

独立工具，不参与前端开发流水线。

| 技能 | 功能 | 触发词 |
|------|------|--------|
| `adft-skill-creator` | 创建新技能 | 创建一个技能、new skill |
| `adft-page-wiki-generator` | 代码→Wiki 文档 | 解析页面生成Wiki、生成代码文档、分析页面链路 |
| `adft-smart-commit` | Git 智能提交 | commit、smart commit、分类提交、智能提交 |
| `adft-directory-restructurer` | 目录结构治理（双模式：规范预设+审查重塑） | 目录重塑、目录整理、重组目录、restructure directory、整理项目目录、目录太乱了、梳理目录结构、目录重构、设置目录结构、预设目录、创建目录骨架、目录预处理、检查目录、目录合规、目录审查 |

---

## 反馈循环

```
REVIEW FAIL               → IMPLEMENT（修复模式）
代码质量问题              → adfa-refactor-advisor → adfp-code-implementer
交互缺陷发现              → adfa-ux-interaction-checker → adfp-code-implementer
测试覆盖不足              → adfa-edge-case-master
架构问题发现              → adfa-code-context（标记） → adfp-architecture-designer（重审）
需求模糊                  → adfa-brainstorm（快速模式） → adfp-requirement-analyzer
```

## 维护规则

1. **新技能加入**：在本文对应分类下增加一行，`adfa-dev-helper` 和 `adfo-harness-runner` 的映射从此派生
2. **触发词变更**：同步更新本文和对应 SKILL.md 的 front-matter
3. **删除技能**：从本文移除，检查 dev-helper 和 harness-runner 中无残留引用
