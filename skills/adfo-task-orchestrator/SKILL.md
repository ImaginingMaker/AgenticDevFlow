---
name: adfo-task-orchestrator
description: >-
  通用 DAG 任务编排执行器。接收任何 SKILL 产出的结构化任务清单（含依赖关系），
  自动构建 DAG 拓扑、识别并发组、按拓扑顺序调度 SubAgent 并发或串行执行，
  最后汇总所有结果。不负责需求解析和任务拆解——这些由调用方 SKILL 完成。
  TRIGGER: 调用方 SKILL 产出任务清单后通过 Skill 工具委托执行；
  用户说"并发执行"、"并行处理"、"编排任务"、"调度执行"。
  Use proactively when: 任何 SKILL 需要并发执行多个 SubAgent 且有依赖关系需要管理；
  main agent 需要节约上下文，将多任务调度委托给编排器。
---

# 通用 DAG 任务编排执行器

**定位**：基础设施层技能。接收任务清单 → 构建 DAG → 调度执行 → 汇总结果。

**不做**：需求解析、任务拆解、角色定义。这些是调用方 SKILL 的职责。

---

## 一、输入协议

调用方 SKILL 向编排器发送以下格式的任务清单：

```markdown
## 任务清单
| ID | 描述 | Agent类型 | 提示词 | 依赖 |
|----|------|-----------|--------|------|
| T1 | 需求解析 | general-purpose | 分析以下需求的核心目标... | - |
| T2 | 逻辑批判 | general-purpose | 批判性审视以下方案... | T1 |
| T3 | 架构评审 | general-purpose | 评审组件拆分和状态管理... | T1 |
| T4 | 性能风险 | general-purpose | 评估渲染和打包风险... | T1 |
| T5 | 替代方案 | general-purpose | 输出三套实现方案... | T1 |
```

**字段说明**：

| 字段 | 必填 | 说明 |
|------|:--:|------|
| ID | ✅ | 唯一标识，如 T1, T2 |
| 描述 | ✅ | 一句话说明任务目标 |
| Agent类型 | ✅ | SubAgent 类型（general-purpose / Explore / Plan 等） |
| 提示词 | ✅ | 完整的 SubAgent prompt（含输入数据） |
| 依赖 | ❌ | 逗号分隔的前置任务 ID，如 `T1,T3`；无依赖填 `-` |

**可选参数**（附带在任务清单后）：

```markdown
## 执行参数
- 最大并发数: 4
- 单任务超时: 120s
- 总超时: 600s
- 失败策略: continue  # continue | abort | retry
- 重试次数: 3         # 仅策略=retry时生效，失败后最多重试N次
- 汇总模式: auto       # auto | manual
```

---

## 二、核心流程

### Step 1: 解析任务清单

从调用方输入中提取任务清单和可选参数，校验：
- 所有 ID 唯一
- 依赖关系无循环
- 所有依赖的 ID 在清单中存在

**任务清单格式校验**：
- 表格必须包含 5 列：ID、描述、Agent类型、提示词、依赖（顺序不限）
- ID 格式：字母开头，支持字母、数字、连字符（如 T1、task-1、ScanA）
- 依赖字段：多个依赖用逗号分隔，无依赖填 `-` 或留空
- 提示词：不能为空，需包含明确的任务指令

### Step 2: 构建 DAG

按依赖关系构建有向无环图：

```
T1 (无依赖)
 ├─→ T2 (依赖 T1)
 │    └─→ T5 (依赖 T2, T3)
 ├─→ T3 (依赖 T1)
 │    └─→ T5 ↗
 └─→ T4 (依赖 T1)
      └─→ T5 ↗
```

### Step 3: 识别并发组

按拓扑层级分组——同一层级无相互依赖，可并发执行：

```
并发组1: [T1]
并发组2: [T2, T3, T4]  ← 并行执行
并发组3: [T5]
```

**并发上限**：同一组任务数超过 `最大并发数` 时，分批执行。

### Step 4: 调度执行

按并发组顺序执行：

```
for each 并发组:
  在同一消息中启动组内所有 SubAgent（并行）
  等待组内所有完成
  将结果传递给下游依赖任务
```

**上下文传递**：串行链路中，下游 SubAgent 的 prompt 自动拼接上游结果。

### Step 5: 汇总结果

收集所有 SubAgent 输出，按输出模板生成执行报告。

---

## 三、失败处理

| 失败场景 | 策略=continue | 策略=abort | 策略=retry |
|---------|:---:|:---:|:---:|
| 单任务失败 | 标记阻塞下游，继续无依赖任务 | 停止所有执行 | 重试最多 N 次（由重试次数参数控制） |
| 并发组部分失败 | 下游只接收成功任务的结果 | 同 abort | 重试失败任务 |
| 超时 | 标记超时，继续执行无依赖任务 | 停止所有执行 | 不重试，标记超时失败 |
| 全部失败 | 返回空报告 + 错误摘要 | — | — |

**默认策略**：continue（最大化并行，不因单点失败阻塞整体）。

---

## 四、输出格式

```markdown
# 任务执行报告

## 执行概览
| 指标 | 值 |
|------|-----|
| 总任务数 | 5 |
| 成功 | 5 |
| 失败 | 0 |
| 并发组数 | 3 |
| 总耗时 | 45s |

## DAG 拓扑
```
T1 → T2 → T5
  → T3 → T5
  → T4 → T5
```

## 执行详情

### 并发组1: [T1]
| ID | 描述 | 状态 | 耗时 |
|----|------|------|------|
| T1 | 需求解析 | ✅ | 12s |

### 并发组2: [T2, T3, T4]
| ID | 描述 | 状态 | 耗时 |
|----|------|------|------|
| T2 | 逻辑批判 | ✅ | 15s |
| T3 | 架构评审 | ✅ | 18s |
| T4 | 性能风险 | ✅ | 10s |

### 并发组3: [T5]
| ID | 描述 | 状态 | 耗时 |
|----|------|------|------|
| T5 | 替代方案 | ✅ | 20s |

## 各任务输出

### T1 - 需求解析
[SubAgent 输出摘要]

### T2 - 逻辑批判
[SubAgent 输出摘要]

...

## 冲突与发现
- [主 Agent 对多个 SubAgent 冲突结论的标注]
- [值得注意的矛盾或互补发现]
```

---

## 五、使用示例

### 示例 1: adfa-critical-explorer 委托执行

**调用方**（adfa-critical-explorer）规划好 6 个维度任务后：

```
→ 调用 adfo-task-orchestrator Skill，发送：

## 任务清单
| ID | 描述 | Agent类型 | 提示词 | 依赖 |
|----|------|-----------|--------|------|
| T1 | 需求解析 | general-purpose | 你是需求解析代理。分析以下... | - |
| T2 | 逻辑批判 | general-purpose | 你是逻辑批判代理。审视以下... | T1 |
| T3 | 架构评审 | general-purpose | 你是架构评审代理。评审以下... | T1 |
| T4 | 交互体验 | general-purpose | 你是交互体验代理。深挖以下... | T1 |
| T5 | 性能风险 | general-purpose | 你是性能风险代理。评估以下... | T1 |
| T6 | 替代方案 | general-purpose | 你是替代方案代理。针对以下... | T1 |

## 执行参数
- 最大并发数: 6
```

**编排器**自动：

```
并发组1: [T1]
并发组2: [T2, T3, T4, T5, T6]  ← 5个并行执行
→ 汇总返回报告
```

### 示例 2: adfp-architecture-designer 委托执行

```
→ 调用 adfo-task-orchestrator，发送 5 个代码扫描 SubAgent 任务清单
→ 编排器：并发组1: [SA1, SA2, SA3, SA4, SA5] 全部并行
→ 返回架构扫描汇总
```

### 示例 3: 带依赖链的复杂场景

```
T1 → T2 → T4 → T6
T1 → T3 → T5 → T6

并发组1: [T1]
并发组2: [T2, T3]
并发组3: [T4, T5]
并发组4: [T6]
```

---

## 六、职责边界

| 技能 | 边界 |
|------|------|
| adfo-harness-runner | harness-runner 管理**阶段级**流水线（PRD→SPEC→...→DONE）。在 IMPLEMENT 阶段，harness-runner 解析 architecture.md 的依赖图，生成任务清单，**委托 task-orchestrator 执行 DAG 调度** |
| adfp-requirement-analyzer | requirement-analyzer 负责需求解析和**任务拆解**，task-orchestrator 接收拆解后的清单并**执行** |
| adfa-critical-explorer | critical-explorer 定义 6 个批判维度并**生成 prompt**，task-orchestrator 负责**调度这 6 个 SubAgent 的并发执行** |
| adfp-architecture-designer | architecture-designer 定义扫描维度并**生成 prompt**，task-orchestrator 负责**调度 5 个 SubAgent 的并发执行** |
| adfp-code-implementer | 在 IMPLEMENT 阶段作为 task-orchestrator 的**执行单元**，每个任务节点调用一次 adfp-code-implementer |
| 所有需并发 SubAgent 的技能 | 调用方 SKILL 负责"做什么"（任务规划+prompt），task-orchestrator 负责"怎么做"（DAG+调度+汇总） |

---

## 七、约束规则

1. **不解析需求**：编排器不拆解任务，任务清单由调用方提供
2. **不定义角色**：SubAgent 类型由调用方指定，编排器不预设
3. **最大并发控制**：单组并发上限默认 4，可配置（见 templates/custom.md）
4. **无循环依赖**：检测到循环依赖时拒绝执行，标记冲突任务
5. **上下文最小化**：只传递必要的前序结果，不传递完整对话历史
6. **超时保护**：单任务超时 + 总超时双重保护

## 模板注入

> 共享配置由 `adfo-harness-runner/templates/custom.md` 统一管理。
`templates/custom.md` — 本技能特有的执行参数默认值（并发上限、超时、失败策略）
