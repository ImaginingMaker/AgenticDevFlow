# 阶段技能编排器集成检查报告

> 最后更新: 2026-05-24

本文档记录 `adfo-harness-runner` 流水线各阶段技能与 `adfo-task-orchestrator` 的集成状态。

---

## 一、检查结果汇总

| 阶段 | 技能 | 是否有并发需求 | 是否已集成编排器 | 状态 |
|------|------|---------------|-----------------|------|
| `INIT` | 编排器内置 | 否 | - | 无需集成 |
| `ANALYZE` | `adfp-requirement-analyzer` | **是** (3个SubAgent) | **已集成** | ✅ 正确 |
| `PRD` | `adfp-prd-generator` | 否 (串行流程) | 未集成 | ✅ 无需集成 |
| `SPEC` | `adfp-spec-generator` | 否 (串行流程) | 未集成 | ✅ 无需集成 |
| `ARCHITECTURE` | `adfp-architecture-designer` | **是** (5个SubAgent) | **已集成** | ✅ 正确 |
| `DESIGN` | `adfp-component-designer` | 否 (串行流程) | 未集成 | ✅ 无需集成 |
| `IMPLEMENT` | `adfo-task-orchestrator` + `adfp-code-implementer` | **是** (多模块DAG) | **编排器内置** | ✅ 正确 |
| `REVIEW` | `adfp-code-reviewer` | **是** (7个SubAgent) | **已集成** | ✅ 正确 |
| `DONE` | 编排器内置 | 否 | - | 无需集成 |

---

## 二、已集成技能详情

### 1. adfp-requirement-analyzer (ANALYZE 阶段)

**并发需求**: 3 个 SubAgent 并发分析
- SA1: 需求背景解析
- SA2: 开发链路梳理
- SA3: 任务计划拆解

**集成方式**: 文档 §第二步 明确说明"委托 `adfo-task-orchestrator` 并发调度执行"

**执行参数**: `最大并发数: 3`

**验证点**:
- [x] 有任务清单格式定义
- [x] 有最大并发数参数
- [x] 有结果汇总流程描述
- [x] 有约束规则说明

---

### 2. adfp-architecture-designer (ARCHITECTURE 阶段)

**并发需求**: 5 个 SubAgent 并发扫描（已有项目分析模式）
- SA1: 组件扫描
- SA2: Hooks/逻辑盘点
- SA3: Service/API扫描
- SA4: 依赖关系图映射
- SA5: 结构规范分析

**集成方式**: 文档 §二明确说明"主 Agent 生成任务清单 → 委托 `adfo-task-orchestrator` 并发执行"

**执行参数**: `最大并发数: 5`

**验证点**:
- [x] 有任务清单格式定义
- [x] 有最大并发数参数
- [x] 有结果汇总流程描述
- [x] 约束规则第4条明确要求通过编排器调度

---

### 3. adfp-code-reviewer (REVIEW 阶段)

**并发需求**: 7 个维度并发审查
- SA1: 类型安全
- SA2: React规范
- SA3: 性能与体积
- SA4: 边界处理
- SA5: 代码质量与复用
- SA6: 视觉美学
- SA7: 副作用分析

**集成方式**: 文档 §二有完整的并行执行机制图示

**执行参数**: `最大并发数: 7`

**验证点**:
- [x] 有任务清单格式定义
- [x] 有最大并发数参数
- [x] 有结果汇总流程描述
- [x] 有并行执行机制图示
- [x] 职责边界明确标注编排器职责

---

### 4. adfo-harness-runner IMPLEMENT 阶段

**并发需求**: 多模块 DAG 调度

**集成方式**: IMPLEMENT 阶段由编排器内置，读取 `architecture.md` 依赖图，生成任务清单，委托 `adfo-task-orchestrator` 执行

**特殊说明**:
- 单模块时跳过 DAG 调度，直接调用 `adfp-code-implementer`
- 多模块时按拓扑排序生成任务清单

**验证点**:
- [x] 有依赖图解析流程
- [x] 有任务清单生成模板
- [x] 有拓扑排序规则说明
- [x] 有结果汇总流程
- [x] 有单模块简化路径

---

## 三、无需集成的技能说明

### 1. adfp-prd-generator (PRD 阶段)

**不集成原因**: 核心流程为纯串行：
```
信息收集 → 用户故事 → 功能清单 → 交互流程 → 验收标准 → 优先级 → 输出PRD
```

各步骤之间有逻辑依赖关系，不适合并发执行。

---

### 2. adfp-spec-generator (SPEC 阶段)

**不集成原因**: 核心流程为纯串行：
```
读取PRD → 功能模块划分 → 页面架构 → 数据模型 → API契约 → 状态策略 → 路由设计 → 输出SPEC
```

各章节之间有递进依赖，不适合并发。

---

### 3. adfp-component-designer (DESIGN 阶段)

**不集成原因**: 设计过程需要逐步推导：
```
读取输入 → 需求理解 → 视觉设计方向 → 组件树设计 → 状态方案 → Props接口 → 数据依赖 → 输出设计文档
```

组件树设计依赖视觉设计方向，状态方案依赖组件树，不适合并发。

---

## 四、编排器集成规范

### 必须包含的要素

任何需要集成 `adfo-task-orchestrator` 的技能，其 SKILL.md 必须包含：

1. **任务清单格式**:
```markdown
| ID | 描述 | Agent类型 | 提示词 | 依赖 |
|----|------|-----------|--------|------|
| T1 | ... | general-purpose | ... | - |
```

2. **执行参数**:
```markdown
执行参数：`最大并发数: N`
```

3. **结果汇总流程**:
- 主 Agent 如何接收编排器返回
- 如何处理部分失败场景

4. **约束规则**:
- 明确说明必须通过编排器调度

### 集成检查清单

新增技能或修改现有技能时，需检查：

- [ ] 是否有多个可并行执行的子任务？
- [ ] 子任务之间是否有依赖关系？
- [ ] 是否定义了任务清单格式？
- [ ] 是否指定了最大并发数？
- [ ] 是否描述了结果汇总流程？
- [ ] 约束规则中是否说明了编排器使用？
- [ ] IMPLEMENT 阶段是否有特殊执行分支（区别于标准三步模式的「引导用户调用」）？

---

## 五、相关文档

- [adfo-task-orchestrator SKILL.md](../../skills/adfo-task-orchestrator/SKILL.md)
- [adfo-harness-runner phase-registry.md](../phase-registry.md)
- [技能集成指南](../../docs/skills/README.md)
