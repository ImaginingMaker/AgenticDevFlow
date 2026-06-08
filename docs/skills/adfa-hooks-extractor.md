# adfa-hooks-extractor

> React Hooks 提取分析专家。扫描组件代码，识别可提取为自定义 Hook 的重复逻辑、有状态逻辑块和副作用模式，评估提取价值，生成可直接使用的 Hook 代码。

---

## 基本信息

| 属性 | 值 |
|------|-----|
| **名称** | adfa-hooks-extractor |
| **类型** | 辅助技能 |
| **阶段** | IMPLEMENT / REVIEW（Hook 提取） |
| **前缀** | adfa- |
| **触发词** | `提取Hooks`、`提取自定义Hook`、`extract hooks`、`封装Hook`、`这个逻辑怎么抽成Hook`、`复用这段逻辑` |
| **文件位置** | `skills/adfa-hooks-extractor/SKILL.md` |

---

## 核心特性

### 1. 四维扫描（委托 adfo-task-orchestrator 并发执行）

**主 Agent 生成任务清单 → 委托 `adfo-task-orchestrator` 并发 4 个 SubAgent → 接收汇总 → 去重评分 → 生成提取方案**。4 个 SubAgent 全部无依赖，同一并发组并行执行。

| SubAgent | 扫描维度 | 识别模式 | 候选命名示例 |
|----------|----------|---------|-------------|
| 状态组合扫描器 | 状态组合 | 多个 useState 描述同一业务概念 | `useAsyncData()` |
| 副作用逻辑扫描器 | 副作用逻辑 | useEffect 中含业务逻辑 | `useFetchUser(id)` |
| 重复模式扫描器 | 重复模式 | 2+ 组件中存在相似状态+副作用 | 复用 Hook |
| 复杂计算扫描器 | 复杂计算 | 多步骤 useMemo 计算链 | 计算 Hook |

### 2. 提取价值评估（四维度评分）

| 维度 | 标准 | 权重 |
|------|------|------|
| 复用性 | 被 2+ 组件使用或很可能被复用 | 30% |
| 内聚性 | 状态和副作用高度相关 | 25% |
| 可测试性 | 提取后可独立单测 | 25% |
| 代码量 | 提取的 Hook ≥ 20 行 | 20% |

**评分 ≥ 60% → 建议提取**

### 3. 按优先级输出

- **高优先级**：强烈建议提取，附带完整代码
- **中优先级**：建议考虑
- **低优先级**：可选

### 4. 产物输出

- **Hook 代码**：可直接使用的 TypeScript 代码，含完整类型定义
- **提取建议报告**：包含提取价值评分、使用示例、注意事项

---

## 使用方式

```
# 分析组件中的可提取逻辑
"提取 Hooks：这段代码里有哪些可以抽成自定义 Hook 的？"

# 分析整个文件
"帮我看下这个组件里有没有可以复用的 Hook 逻辑"

# 针对特定逻辑
"这个逻辑怎么抽成 Hook？"
"复用这段逻辑，帮我封装成 Hook"
```

---

## 依赖关系

### 上游依赖（本技能依赖谁）

| 技能 | 关系类型 | 说明 |
|------|---------|------|
| `adfp-code-reviewer` | 建议下游触发 | 审查发现可提取 Hook 时建议调用本技能 |
| `adfa-code-context` | 前置输入 | 理解代码上下文，辅助识别可提取逻辑 |
| 用户 | 手动触发 | "提取Hooks"、"封装Hook"、"复用这段逻辑" |

### 下游消费（谁依赖本技能）

| 技能 | 关系类型 | 说明 |
|------|---------|------|
| 无 | - | Hook 代码直接输出给用户，无下游技能依赖 |

---

## 流程生命周期

### 触发条件

- **手动触发**："提取Hooks"、"提取自定义Hook"、"extract hooks"、"封装Hook"、"这个逻辑怎么抽成Hook"、"复用这段逻辑"
- **建议触发**：`adfp-code-reviewer` 发现可提取逻辑时建议调用

### 生命周期图

```
adfp-code-reviewer（发现重复逻辑）
      ↓ 建议
adfa-code-context（理解代码上下文）
      ↓
本技能：扫描代码 → 委托 adfo-task-orchestrator 并发 4 扫描 → 去重评分 → 生成提取方案
      ↓
输出：Hook 代码 + 提取建议报告（直接给用户）

评分 ≥ 60% → 建议提取，附带完整代码
评分 < 60% → 建议考虑或可选
```

### 在完整流水线中的位置

```
INIT → ANALYZE → PRD → SPEC → ARCHITECTURE → DESIGN → 【IMPLEMENT】 → 【REVIEW】 → DONE
                                              ↑                    ↑
                                         Hook 提取            Hook 提取
```

### 产物状态

| 产物 | 路径 | 状态流转 |
|------|------|---------|
| Hook 代码 | 对话内输出 | 输出 → 用户决定是否应用 |
| 提取建议报告 | 对话内输出 | 输出 → 用户决策参考 → 丢弃 |

---

## 工作流程

```
扫描代码 → 委托 adfo-task-orchestrator 并发 4 扫描（状态组合、副作用逻辑、重复模式、复杂计算）→ 去重评分 → 生成提取方案
```

### 详细步骤

1. **扫描代码**：读取用户提供的组件代码或指定文件
2. **委托并发扫描**：通过 `adfo-task-orchestrator` 并发执行 4 个 SubAgent
   - 状态组合扫描器：识别多个 useState 描述同一业务概念
   - 副作用逻辑扫描器：识别 useEffect 中的业务逻辑
   - 重复模式扫描器：识别跨组件的相似状态+副作用模式
   - 复杂计算扫描器：识别多步骤 useMemo 计算链
3. **去重评分**：汇总 4 个 SubAgent 结果，去重后进行四维度评分
4. **生成提取方案**：按优先级输出 Hook 代码 + 提取建议报告

---

## 与现有技能的职责边界

| 本技能负责 | 不负责（归其他技能） |
|-----------|---------------------|
| 识别可提取的内联逻辑 | 盘点已有 Hooks（→ adfp-architecture-designer） |
| 评估提取价值 | 代码实现（→ adfp-code-implementer） |
| 生成 Hook 代码 | 重构方案（→ adfa-refactor-advisor） |
| 提取建议报告 | 测试用例生成（→ adfa-edge-case-master） |

### 与 adfp-architecture-designer 的区别

| adfp-architecture-designer | adfa-hooks-extractor |
|--------------------------|-------------------|
| 盘点已有 Hooks（扫描目录） | 深度分析内联逻辑，生成提取方案 |
| 架构层面：列出 "有什么" | 实现层面：建议 "应该抽什么" |

### 与 adfa-refactor-advisor 的区别

| adfa-refactor-advisor | adfa-hooks-extractor |
|---------------------|-------------------|
| 识别代码结构问题，提供重构方案 | 专注 Hook 提取，生成 Hook 代码 |
| 职责混杂、嵌套过深、硬编码等 | 状态组合、副作用逻辑、重复模式、复杂计算 |

---

## 约束规则

1. **只分析，不修改源码**——用户决定是否提取
2. **提取的 Hook 必须返回完整 TypeScript 类型**
3. **纯计算逻辑应放入 `utils/` 而非 `hooks/`**
4. **每个建议必须说明"为什么值得提取"**
5. **Hook 名必须以 `use` 开头**
6. **SubAgent 通过 `adfo-task-orchestrator` 并发调度**（4 个全部无依赖，同一并发组）
7. **评分 < 60% 的候选仅作为可选建议，不附带完整代码**

---

## 模板注入

共享配置由 `adfo-harness-runner/templates/custom.md` 统一管理。技能特有模板（优先提取规则、命名约定、评分权重调整）见 `skills/adfa-hooks-extractor/templates/custom.md`。

---

## 测试用例

详见 `skills/adfa-hooks-extractor/test/`。

### 测试场景覆盖

| 场景 | 输入 | 预期输出 |
|------|------|---------|
| 多个 useState 描述同一概念 | 含 loading/data/error 的组件 | `useAsyncData` Hook |
| useEffect 含业务逻辑 | 数据获取 + 状态更新 | `useFetch` 系列 Hook |
| 跨组件重复模式 | 2+ 组件含相似逻辑 | 复用 Hook + 使用示例 |
| 复杂计算链 | 多层 useMemo | 计算 Hook |
| 无可提取逻辑 | 简单组件 | "未发现可提取逻辑" |
