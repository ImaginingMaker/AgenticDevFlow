# adfa-critical-explorer

> 多子代理并发批判性维度挖掘器，用于 React/前端技术方案的深度评审。

---

## 基本信息

| 属性 | 值 |
|------|-----|
| **名称** | adfa-critical-explorer |
| **类型** | 辅助 |
| **前缀** | adfa- |
| **触发词** | `帮我分析这个方案`、`评审一下`、`找找问题`、`多角度分析`、`批判性审视` |
| **文件位置** | .claude/skills/adfa-critical-explorer/SKILL.md |
| **阶段** | SPEC/DESIGN 后（批判性评审） |

---

## 核心特性

### 6 维度并发批判性分析

```
主 Agent 调度 → 并行拉起 6 个 SubAgent → 各维度独立批判 → 汇总结构化报告
```

| SubAgent | 维度 | 核心职责 |
|----------|------|---------|
| SA1 | 需求解析 | 提炼核心目标、约束、模糊点 |
| SA2 | 逻辑批判 | 批判设计逻辑、边界缺失、方案漏洞 |
| SA3 | 架构评审 | 评审组件拆分、Hook、状态管理 |
| SA4 | 交互体验 | 深挖交互链路、状态反馈、操作逻辑 |
| SA5 | 性能风险 | 评估渲染、兼容、打包风险 |
| SA6 | 替代方案 | 输出轻量/健壮/工程化三套方案 |

### 执行流程

```
接收输入 → 并发启动 6 SubAgent → 等待汇总 → 输出结构化报告
```

---

## 使用方式

```
# 评审组件方案
"帮我分析这个 React 组件方案：用户列表页面，支持搜索、筛选、分页..."

# 评审架构方案
"帮我批判性审视这个架构设计"

# 评审技术规格
"评审一下这个 SPEC 文档"

# 深度再挖某个维度
"让 SubAgent 3 再深入分析架构部分"
```

---

## 依赖关系

### 上游依赖（本技能依赖谁）

| 技能 | 关系类型 | 说明 |
|------|---------|------|
| `adfp-spec-generator` | 可选触发 | SPEC 完成后可调用本技能审查技术规格 |
| `adfp-component-designer` | 可选触发 | 设计方案完成后可调用本技能进行批判性评审 |
| `adfo-task-orchestrator` | **必须调用** | 6 个 SubAgent 并发调度委托 task-orchestrator 执行 |
| 用户 | 手动触发 | "帮我分析这个方案"、"评审一下"、"找找问题" |

### 下游消费（谁依赖本技能）

| 技能 | 关系类型 | 说明 |
|------|---------|------|
| `adfp-architecture-designer` | 后置消费 | 架构问题反馈给 architecture-designer 重新审视 |
| `adfp-component-designer` | 后置消费 | 设计问题反馈给 designer 调整方案 |
| `adfp-spec-generator` | 后置消费 | 规格问题反馈给 spec-generator 修正规格 |

---

## 流程生命周期

### 触发条件

- **手动触发**："帮我分析这个方案"、"评审一下"、"找找问题"、"批判性审视"
- **建议触发**：DESIGN 或 SPEC 阶段完成后，由对应技能建议调用

### 生命周期图

```
adfp-component-designer / adfp-spec-generator 方案
      ↓
本技能：接收方案 → 委托 adfo-task-orchestrator 并发 6 SubAgent → 各维度独立批判 → 汇总结构化报告
      ↓
反馈给下游技能调整方案
      ├─ 架构问题 → adfp-architecture-designer
      ├─ 设计问题 → adfp-component-designer
      └─ 规格问题 → adfp-spec-generator

异常路径：
  ├─ 方案信息不完整 → 补充预设并标注
  └─ 用户指定单个维度 → 仅该 SubAgent 深度再挖
```

### 产物状态

| 产物 | 路径 | 状态流转 |
|------|------|---------|
| 多维度批判性探索报告 | 对话内输出 | 输出 → 方案调整 → 丢弃 |

---

## 工作流程

### 标准流程

```
1. 接收输入
   ├─ 用户直接输入方案描述
   └─ 或从上游技能（spec-generator / component-designer）接收方案

2. 委托 adfo-task-orchestrator 并发执行
   ├─ 构建 6 个 SubAgent 任务清单
   ├─ 声明无依赖关系（6 维度可完全并行）
   └─ 调用 adfo-task-orchestrator 执行

3. 6 维度并行批判
   ├─ SA1 需求解析：提炼核心目标、约束条件、模糊点
   ├─ SA2 逻辑批判：批判设计逻辑、边界缺失、方案漏洞
   ├─ SA3 架构评审：评审组件拆分、Hook 设计、状态管理
   ├─ SA4 交互体验：深挖交互链路、状态反馈、操作逻辑
   ├─ SA5 性能风险：评估渲染性能、兼容性、打包风险
   └─ SA6 替代方案：输出轻量/健壮/工程化三套方案

4. 汇总整合
   ├─ 收集 6 个 SubAgent 输出
   ├─ 去重、归类、优先级排序
   └─ 生成结构化批判性探索报告

5. 输出报告
   └─ 反馈给调用方或下游技能
```

### 二次触发流程

```
用户指定单个维度深度再挖
      ↓
仅启动指定 SubAgent
      ↓
深度分析该维度
      ↓
追加到原报告
```

---

## 与现有技能的职责边界

| 技能 | 边界 |
|------|------|
| adfp-code-reviewer | critical-explorer 审查**设计方案**（编码前），code-reviewer 审查**已写好的代码**（编码后） |
| adfa-brainstorm | brainstorm 是**发散创意**，critical-explorer 是**批判收敛** |
| adfp-architecture-designer | architecture-designer **正向构建**架构，critical-explorer **审视批判**已有方案 |
| adfp-spec-generator | spec-generator **生成**技术规格，critical-explorer **审查**规格质量 |
| adfp-component-designer | component-designer **设计**组件方案，critical-explorer **评审**设计方案 |
| adfa-edge-case-master | edge-case-master 生成**测试用例代码**，critical-explorer 发现**设计层面**的边界缺失 |

---

## 约束规则

1. **必须并发执行**：同一消息中启动所有 6 个 SubAgent，通过 adfo-task-orchestrator 调度
2. **维度隔离**：每个 SubAgent 严格只负责自己维度，不越界分析
3. **保持批判性**：不盲从用户方案，必须指出问题和风险
4. **紧贴技术**：所有分析紧贴 React/前端工程化，避免空泛评论
5. **预设标注**：模糊需求自动补充预设并明确标注
6. **支持二次触发**：用户可指定单个 SubAgent 深度再挖
7. **依赖 task-orchestrator**：SubAgent 并发调度必须委托给 adfo-task-orchestrator

---

## 模板注入

> 共享配置由 `adfo-harness-runner/templates/custom.md` 统一管理。

`templates/custom.md` — 本技能特有的 SubAgent 执行参数与输出偏好配置。

### SubAgent 任务模板

```yaml
# SA1 需求解析
task_id: sa1-requirement-analysis
dimension: 需求解析
prompt: |
  分析以下方案的需求层面：
  1. 核心目标是什么？
  2. 有哪些约束条件？
  3. 哪些需求点模糊或缺失？
  4. 需要补充哪些预设？

# SA2 逻辑批判
task_id: sa2-logic-critique
dimension: 逻辑批判
prompt: |
  批判以下方案的逻辑层面：
  1. 设计逻辑是否自洽？
  2. 边界条件是否覆盖？
  3. 有哪些方案漏洞？
  4. 逻辑链路是否完整？

# SA3 架构评审
task_id: sa3-architecture-review
dimension: 架构评审
prompt: |
  评审以下方案的架构层面：
  1. 组件拆分是否合理？
  2. Hook 设计是否恰当？
  3. 状态管理是否清晰？
  4. 数据流向是否明确？

# SA4 交互体验
task_id: sa4-interaction-experience
dimension: 交互体验
prompt: |
  深挖以下方案的交互层面：
  1. 交互链路是否流畅？
  2. 状态反馈是否及时？
  3. 操作逻辑是否直观？
  4. 异常场景是否考虑？

# SA5 性能风险
task_id: sa5-performance-risk
dimension: 性能风险
prompt: |
  评估以下方案的性能层面：
  1. 渲染性能风险点？
  2. 兼容性问题点？
  3. 打包体积风险？
  4. 内存泄漏风险？

# SA6 替代方案
task_id: sa6-alternative-solutions
dimension: 替代方案
prompt: |
  为以下方案输出替代方案：
  1. 轻量方案：最小实现
  2. 健壮方案：生产级实现
  3. 工程化方案：可扩展实现
```

---

## 测试用例

详见 `.claude/skills/adfa-critical-explorer/test/evals.md`。

### 典型测试场景

| 场景 | 输入 | 预期输出 |
|------|------|---------|
| 组件方案评审 | React 用户列表组件方案 | 6 维度批判报告 + 替代方案 |
| 架构方案评审 | 前端状态管理架构 | 架构问题清单 + 改进建议 |
| SPEC 文档评审 | 技术规格文档 | 规格缺陷 + 补充建议 |
| 单维度深挖 | "让 SA3 再深入" | 架构维度深度分析报告 |
| 模糊需求处理 | 不完整方案描述 | 补充预设 + 标注模糊点 |
