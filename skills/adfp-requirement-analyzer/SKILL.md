---
name: adfp-requirement-analyzer
description: "前端需求多维度协同分析技能。当用户需求模糊时自动触发adfa-brainstorm探索意图，需求清晰后并发3个SubAgent（需求背景解析、开发链路梳理、任务计划拆解），输出结构化分析报告。是PRD生成的前置澄清步骤。TRIGGER: 用户说'需求分析'、'需求拆解'、'开发计划'、'链路梳理'、'帮我分析这个需求'、'分析前端需求'。Use proactively when: 用户提出前端需求（无论清晰或模糊），需要先澄清分析再生成PRD。"
---

# 前端需求多维度协同分析

> 入口页。3 个 SubAgent 详情见 `references/sub-agents.md`；Brainstorm 联动流程见 `references/brainstorm-trigger.md`。

流水线定位：**ANALYZE 阶段**（PRD 之前）。接收需求 → 模糊时触发 brainstorm → 清晰后并发分析 → 输出报告。

---

## 职责边界

| 技能 | 关系 |
|------|------|
| `adfa-brainstorm` | 前置：用户想法模糊时触发快速模式 |
| `adfp-prd-generator` | 下游：消费本分析报告生成 PRD |
| `adfa-critical-explorer` | 平行：本技能建设性分析，explorer 批判性评审 |

---

## 核心流程

```
用户输入
  ├─ 需求模糊？→ 触发 adfa-brainstorm(快速模式) → 接收 Top3 方向
  └─ 需求清晰？→ 完整性检查 → 并发 3 SubAgent 分析 → 汇总报告
```

### 第零步：需求明确度判定

模糊信号（一句话、无目标用户、无功能点、用户说"没想好"）→ 触发 brainstorm
清晰信号（核心目标 + 目标用户 + 2+ 功能点）→ 直接进入

### 第二步：3 SubAgent 并发分析

通过 `adfo-task-orchestrator` 并发调度（全部无依赖，最大并发 3）：

| ID | 职责 | 聚焦 |
|----|------|------|
| SA1 | 需求背景解析师 | "为什么做"：业务场景、核心目标、优先级 |
| SA2 | 开发链路梳理师 | "怎么做"：技术选型、依赖条件、风险点 |
| SA3 | 任务计划拆解师 | "分阶段做"：任务拆解、工时、里程碑 |

> 每个 SubAgent 的详细提示词和输出格式见 `references/sub-agents.md`

---

## 输出

```markdown
# 前端开发需求协同分析报告
## 一、需求背景与核心目标
## 二、前端开发链路梳理
## 三、开发任务计划
## 四、总结与建议
## 五、需确认事项
```

| 模式 | 输出路径 |
|------|---------|
| 敏捷模式 | `./requirement-analysis.md` |
| 工程模式 | `docs/workflows/{任务ID}/requirement-analysis.md` |

---

## 约束规则

1. 仅聚焦前端开发需求
2. 需求模糊时**必须**先触发 brainstorm，不跳过
3. Brainstorm 控制在 15 分钟内收敛
4. 不生成用户故事（PRD 职责）、API 契约（SPEC 职责）、组件树（DESIGN 职责）
5. 潜在需求标注「建议补充」，由用户确认

## 模板注入

> 共享配置由 `adfo-harness-runner/templates/custom.md` 统一管理。
`templates/custom.md` — 本技能特有的分析维度配置（分析深度、默认技术偏好、报告偏好）。
