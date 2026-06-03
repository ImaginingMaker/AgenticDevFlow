# 阶段注册表

流水线阶段和技能映射的**唯一配置源**。`adfo-harness-runner` 和 `adfa-dev-helper` 均引用此文件，不硬编码阶段名或技能映射。

> 编排器集成状态见 [orchestrator-integration-check.md](./orchestrator-integration-check.md)

---

## 一、阶段枚举

| 序号 | 阶段 | 类型 | 说明 |
|------|------|------|------|
| 0 | `INIT` | 内置 | 任务初始化，创建 state.json |
| 1 | `ANALYZE` | 原子技能 | 需求多维度协同分析（PRD 前置澄清） |
| 2 | `PRD` | 原子技能 | 产品需求文档 |
| 3 | `SPEC` | 原子技能 | 技术规格（页面级架构） |
| 4 | `ARCHITECTURE` | 原子技能 | 架构分析 + 文件层级规划 |
| 5 | `DESIGN` | 原子技能 | 详细组件设计 |
| 6 | `IMPLEMENT` | 编排器内置 | DAG 任务调度 + 代码实现 |
| 7 | `REVIEW` | 原子技能 | 代码审查 |
| 8 | `DONE` | 内置 | 流水线完成，生成终态报告 |
| -1 | `FAILED` | 内置 | 超过最大重试次数，需人工介入 |

**终态**：`DONE`、`FAILED`
**非终态（活跃）**：`INIT`、`ANALYZE`、`PRD`、`SPEC`、`ARCHITECTURE`、`DESIGN`、`IMPLEMENT`、`REVIEW`

---

## 二、阶段→技能映射

| 阶段 | 技能 | 执行者 | 产物 | 可跳过 |
|------|------|--------|------|--------|
| `INIT` | — | 编排器内置 | `state.json` | 否 |
| `ANALYZE` | `adfp-requirement-analyzer` | 原子技能 | `requirement-analysis.md` | 是 |
| `ANALYZE` | `adfa-brainstorm`（前置可选） | 原子技能 | `brainstorm.md`（仅模糊需求时触发） | — |
| `PRD` | `adfp-prd-generator` | 原子技能 | `prd.md` | 是 |
| `SPEC` | `adfp-spec-generator` | 原子技能 | `spec.md` | 是 |
| `ARCHITECTURE` | `adfp-architecture-designer` | 原子技能 | `architecture.md` | 是 |
| `DESIGN` | `adfp-component-designer` | 原子技能 | `design.md` | 是 |
| `IMPLEMENT` | `adfo-task-orchestrator` + `adfp-code-implementer` | 编排器内置 | 源码 + `implementation.md` | **否** |
| `REVIEW` | `adfp-code-reviewer` | 原子技能 | `review-report.md` | 是 |
| `DONE` | — | 编排器内置 | 终态报告 | — |
| `FAILED` | — | 编排器内置 | — | — |

---

## 三、正向流转规则

### next（正常下一阶段）

| 从 | 到 | 条件 |
|----|-----|------|
| `INIT` | `ANALYZE` | 自动 |
| `ANALYZE` | `PRD` | qualityGate = pass |
| `PRD` | `SPEC` | qualityGate = pass |
| `SPEC` | `ARCHITECTURE` | qualityGate = pass |
| `ARCHITECTURE` | `DESIGN` | qualityGate = pass |
| `DESIGN` | `IMPLEMENT` | qualityGate = pass |
| `IMPLEMENT` | `REVIEW` | qualityGate = pass |
| `REVIEW` | `DONE` | qualityGate ∈ {pass, warn} |

### canSkipTo（可跳过目标）

#### 单阶段跳过

| 从 | 可跳到 | 条件 |
|----|--------|------|
| `INIT` | `PRD` | 用户跳过 ANALYZE（需求已足够清晰） |
| `ANALYZE` | `SPEC` | 用户提供已有 PRD → 记录 skipEvidence |
| `ANALYZE` | `ARCHITECTURE` | 用户跳过 PRD + SPEC |
| `PRD` | `SPEC` | 用户提供已有 PRD → 记录 skipEvidence |
| `PRD` | `ARCHITECTURE` | 用户跳过 SPEC |
| `PRD` | `DESIGN` | 用户跳过 SPEC + ARCHITECTURE |
| `SPEC` | `ARCHITECTURE` | 用户提供已有 SPEC |
| `SPEC` | `DESIGN` | 用户跳过 ARCHITECTURE |
| `ARCHITECTURE` | `DESIGN` | 用户提供已有架构设计 |
| `DESIGN` | `IMPLEMENT` | 用户提供已有组件设计 |
| `REVIEW` | `DONE` | 用户确认跳过审查 |

#### 跨阶段跳过（从 INIT 直接跳转）

用户从零开始但已有部分产物时，允许跨多个阶段跳过：

| 从 | 可跳到 | 条件 | 已跳过阶段 |
|----|--------|------|-----------|
| `INIT` | `SPEC` | 用户已有 PRD 文档 | ANALYZE, PRD |
| `INIT` | `ARCHITECTURE` | 用户已有 PRD + SPEC | ANALYZE, PRD, SPEC |
| `INIT` | `DESIGN` | 用户已有 PRD + SPEC + 架构设计 | ANALYZE, PRD, SPEC, ARCHITECTURE |
| `INIT` | `IMPLEMENT` | 用户已有完整设计和架构 | ANALYZE, PRD, SPEC, ARCHITECTURE, DESIGN |

> 跨阶段跳过时，所有跳过的阶段均记录 `status: "skipped"` + `skipEvidence`。`skippedPhases` 数组同时更新。下游技能以**敏捷模式**运行。

**IMPLEMENT 不可跳过**——没有代码就没有产物。

---

## 四、反向回退规则

### rollbackTo（回退目标）

| 从 | 回退到 | 触发条件 |
|----|--------|---------|
| `REVIEW` | `IMPLEMENT` | qualityGate = fail + retryCount < maxRetries |
| `IMPLEMENT` | `DESIGN` | 实现过程中发现设计冲突 |
| `IMPLEMENT` | `ARCHITECTURE` | 实现过程中发现架构规划不合理 |
| `DESIGN` | `ARCHITECTURE` | 设计过程中发现架构偏离 |
| `DESIGN` | `SPEC` | 设计过程中发现需求不明确（ARCHITECTURE 已跳过时） |
| `ARCHITECTURE` | `SPEC` | 架构分析发现 SPEC 设计不合理 |
| `PRD` | `ANALYZE` | PRD 生成时发现需求背景不清，需重新分析 |
| 任意 | `FAILED` | retryCount ≥ maxRetries |

### 回退时清理范围

回退到目标阶段时，删除该阶段及之后的所有产物文件。例如 REVIEW → IMPLEMENT：删除 `review-report.md`，保留 IMPLEMENT 产物。

---

## 五、质量门定义

| qualityGate | 含义 | 编排器行为 |
|-------------|------|-----------|
| `pass` | 通过 | 进入下一阶段 |
| `warn` | 警告（通过但有问题） | 展示警告项，用户确认后进入下一阶段 |
| `fail` | 不通过 | 进入反向反馈流程，回退修复 |
| 缺失 | 产物缺少 front-matter | 视为 `warn`，提示用户补充 |

### 质量门判定流程

编排器 `verify` 命令执行以下三判定（代码级）：

1. **阶段一致性**：产物 front-matter 中的 `phase` 字段必须与当前流水线阶段一致
   - 如 PRD 阶段产物中 `phase: PRD` ✅
   - 不匹配 → 标记为 `warn`，提示"产物阶段标识不匹配"
2. **内容实质性**：产物文件除 front-matter 外必须有 ≥50 字符的正文内容
   - 仅有 front-matter → 标记为 `warn`，提示"产物缺少实质性内容"
3. **qualityGate 值**：读取 front-matter 中的 `qualityGate` 字段，按上表判定

### 重试限制

| 条件 | 行为 |
|------|------|
| retryCount < maxRetries | 正常回退，继续执行 |
| retryCount ≥ maxRetries | currentPhase = FAILED，停止自动流程 |
| FAILED 状态 | 需人工介入修复后手动重置 currentPhase |

maxRetries 默认值：3

---

## 六、阶段状态枚举

PhaseRecord.status 的可选值：

| status | 含义 | 何时使用 |
|--------|------|---------|
| `pending` | 尚未开始 | 流水线到达该阶段前的初始状态 |
| `in_progress` | 执行中 | 原子技能执行期间 |
| `completed` | 已完成 | 质量门 pass/warn 后 |
| `skipped` | 已跳过 | 用户选择跳过或提供已有产物 |
| `failed` | 执行失败 | 产物缺失或质量门 fail |
| `retrying` | 回退重试中 | 从后续阶段回退到该阶段 |

---

## 七、典型开发流程

```
INIT → ANALYZE → PRD → SPEC → ARCHITECTURE → DESIGN → IMPLEMENT → REVIEW → DONE
  │       │        │      │         │            │          │          │
  └       └        └      └         └            └          └          └
自动   可跳过   可跳过  可跳过   可跳过       可跳过    不可跳过    可跳过
```

### 完整链路

```
adfp-requirement-analyzer → adfp-prd-generator → adfp-spec-generator → adfp-architecture-designer
    → adfp-component-designer → [adfo-task-orchestrator + adfp-code-implementer] → adfp-code-reviewer
```

> IMPLEMENT 阶段由编排器内置 DAG 调度，读取 architecture.md 的依赖图，通过 adfo-task-orchestrator 并发调度多个 adfp-code-implementer 任务。

### 快速原型链路（跳过文档）

```
adfp-architecture-designer（分析复用）→ [编排器直接调用 adfp-code-implementer，无 DAG]
```

> 单模块时无需 adfo-task-orchestrator，编排器直接调度 adfp-code-implementer。

### 审查+修复循环

```
adfp-code-reviewer → adfp-code-implementer（修复模式，单任务）→ adfp-code-reviewer
```

> 修复模式下编排器直接调用 adfp-code-implementer，不经过 DAG 调度。

### 重构链路

```
adfa-code-context（理解）→ adfa-refactor-advisor（方案）→ adfp-code-implementer（执行）
```

---

## 八、IMPLEMENT 阶段 DAG 调度详解

IMPLEMENT 是唯一不可跳过的阶段，且需要编排器主动执行 DAG 调度。

### 执行流程

```
Step 1: 解析依赖图 → Step 2: 生成任务清单 → Step 3: 委托 adfo-task-orchestrator → Step 4: 汇总结果
```

### Step 1: 解析依赖图

读取 `architecture.md` 的「模块依赖图」章节，提取：
- 所有模块名称
- 模块间依赖关系（depends on → ...）
- 并行识别标记（可并行开发的模块组）

**异常处理**：
- `architecture.md` 缺失 → 按 design.md 组件树顺序执行（降级）
- 依赖图不完整 → 提示用户补充或降级为顺序执行
- 单模块 → 跳过 DAG 调度，直接调用 adfp-code-implementer

### Step 2: 生成任务清单

按拓扑排序将依赖图转换为 `adfo-task-orchestrator` 的任务清单格式：

```markdown
## 任务清单
| ID | 描述 | Agent类型 | 提示词 | 依赖 |
|----|------|-----------|--------|------|
| T1 | 实现 Button | adfp-code-implementer | 基于 design.md 实现 Button 组件... | - |
| T2 | 实现 Input | adfp-code-implementer | 基于 design.md 实现 Input 组件... | - |
| T3 | 实现 SearchBar | adfp-code-implementer | 基于 design.md 实现 SearchBar... | T1,T2 |

## 执行参数
- 最大并发数: 3
- 单任务超时: 300s
- 失败策略: abort
```

**拓扑排序规则**：
1. 叶子节点（无依赖的原子模块）→ 第一并发组
2. 中间节点按依赖层级递增
3. 根节点（页面/入口）→ 最后执行

### Step 3: 委托 adfo-task-orchestrator

调用 `adfo-task-orchestrator` Skill，发送任务清单和执行参数。

编排器等待编排器返回执行报告，不自行调度。

### Step 4: 汇总结果

| 执行结果 | 处理方式 |
|---------|---------|
| 全部成功 | 合并文件列表 → 更新 state.json → 生成 implementation.md → 进入 REVIEW |
| 部分失败 | 记录 blockers → 按失败策略处理（abort/retry/continue） |
| 全部失败 | currentPhase = FAILED，停止流水线 |

### 单模块简化路径

若依赖图分析结果只有 1 个模块：
- **不调用 adfo-task-orchestrator**
- 直接调用 `adfp-code-implementer`，传入 design.md + architecture.md
- 等待完成后进入 REVIEW
