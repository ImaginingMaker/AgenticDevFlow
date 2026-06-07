# adfa-critical-explorer

> 多子代理并发批判性维度挖掘器，用于前端技术方案的深度评审。自动感知目标框架（React/Vue/小程序/跨端），路由到框架特定的批判性审查维度。

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

### 平台感知 + 6 维度并发批判性分析

```
主 Agent 调度 → 平台感知路由 → 并行拉起 6 个 SubAgent → 各维度框架感知批判 → 汇总结构化报告
```

| SubAgent | 维度 | 核心职责 |
|----------|------|---------|
| SA1 | 需求解析 | 提炼核心目标、约束、模糊点（框架感知） |
| SA2 | 逻辑批判 | 批判设计逻辑、边界缺失、方案漏洞（框架感知） |
| SA3 | 架构评审 | 评审组件拆分、组合式逻辑、状态管理（框架感知） |
| SA4 | 交互体验 | 深挖交互链路、状态反馈、操作逻辑（框架感知） |
| SA5 | 性能风险 | 评估渲染、兼容、打包风险（框架感知） |
| SA6 | 替代方案 | 输出轻量/健壮/工程化三套方案（框架感知） |

### 谁是感知者？

本技能自身执行框架检测，**不依赖外部注入**。检测结果写入 `{framework}` 变量，注入到 6 个 SubAgent 提示词中。

检测有三条链路，按优先级依次尝试：

**链路 A — 工程模式（被动接收）**：
- 当被 `adfo-harness-runner` 调度时，从 `state.json.techStack` 读取目标框架
- 由编排器在 `context` 命令中注入 `techStack` 上下文
- 此为最高优先级，直接使用不重复检测

**链路 B — 敏捷模式（主动检测）**：
- 直接调用本技能时，技能依次扫描：`package.json` 依赖 → 框架配置文件 → 目录结构
- 检测到 → 直接使用；检测不到 → 进入链路 C

**链路 C — 用户指定（显式询问）**：
- 向用户提问框架选择，接收用户回答
- 用户不确定或跳过 → 进入通用降级路径

**全部失败 → 通用降级**：`{framework} = "前端"`，按通用前端维度执行

### 检测路由表

| 检测条件 | 路由目标 | `{framework}` 值 | 框架细则 |
|------|---------|-----------------|---------|
| `React*` / `JSX` / `TSX` / `Next.js` | **React 评审路径** | `React` | `references/critical-dimensions.md#react-路径` |
| `Vue*` / `Vue 3` / `Nuxt` | **Vue 评审路径** | `Vue 3` | `references/critical-dimensions.md#vue-路径` |
| `微信小程序` / `小程序` / `WXML` | **小程序评审路径** | `微信小程序` | `references/critical-dimensions.md#小程序路径` |
| `Taro` / `uni-app` | **跨端评审路径** | `Taro/uni-app` | `references/critical-dimensions.md#跨端路径` |
| 链路 C 用户指定 | 按用户回答路由 | 用户回答值 | 对应框架章节 |
| 全部失败 | **通用评审路径（降级）** | `前端` | `references/critical-dimensions.md#通用` |

> `{framework}` 由本技能自主检测后动态填入。检测成功时填入框架名称，全部失败时默认回退为 `前端`，使所有 Prompt 保持自然可读。

### 执行流程

```
接收输入 → 框架检测 → {framework} 注入 SubAgent 提示词 → 并发启动 6 SubAgent → 等待汇总 → 输出结构化报告
```

---

## 使用方式

```
# 评审 React 组件方案（自动路由到 React 评审路径）
"帮我分析这个 React 组件方案：用户列表页面，支持搜索、筛选、分页..."

# 评审 Vue 3 架构方案（自动路由到 Vue 评审路径）
"评审一下这个 Vue 3 组件设计：商品卡片组件，支持多规格选择..."

# 评审小程序方案（自动路由到小程序评审路径）
"帮我分析这个微信小程序方案：电商首页，含轮播图、商品瀑布流..."

# 评审跨端方案（自动路由到跨端评审路径）
"评审一下这个 Taro 项目架构"

# 深度再挖某个维度（框架感知保留）
"让 SubAgent 3 再深入分析架构部分"
"按 Vue 的方式再看一遍"
```

---

## 依赖关系

### 上游依赖（本技能依赖谁）

| 技能 | 关系类型 | 说明 |
|------|---------|------|
| `adfp-spec-generator` | 可选触发 | SPEC 完成后调用本技能，techStack 自动传入 |
| `adfp-component-designer` | 可选触发 | 设计方案完成后调用，techStack 自动传入 |
| `adfo-task-orchestrator` | **必须调用** | 6 个 SubAgent 并发调度委托 task-orchestrator 执行 |
| `adfo-harness-runner` | 编排调度 | 工程模式下通过 state.json.techStack 注入框架信息 |
| 用户 | 手动触发 | "帮我分析这个方案"、"评审一下" |

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
上游技能（adfp-component-designer / adfp-spec-generator / 用户）
      ↓
平台感知路由 ← techStack（工程模式下从 state.json 注入，敏捷模式下自动检测）
      ↓
选择框架细则（React / Vue / 小程序 / 跨端 / 通用）
      ↓
{framework} 注入 6 个 SubAgent 提示词
      ↓
委托 adfo-task-orchestrator 并发 6 SubAgent → 各维度框架感知批判 → 汇总结构化报告
      ↓
反馈给下游技能调整方案
      ├─ 架构问题 → adfp-architecture-designer
      ├─ 设计问题 → adfp-component-designer
      └─ 规格问题 → adfp-spec-generator

异常路径：
  ├─ 方案信息不完整 → 补充预设并标注
  ├─ 无 techStack 上下文 → 走通用路径，提示用户指定框架
  └─ 用户指定单个维度 → 仅该 SubAgent 深度再挖
```

### 产物状态

| 产物 | 路径 | 状态流转 |
|------|------|---------|
| 多维度批判性探索报告（框架感知） | 对话内输出 | 输出 → 方案调整 → 丢弃 |

---

## 工作流程

### 标准流程

```
1. 接收输入
   ├─ 用户直接输入方案描述
   └─ 或从上游技能（spec-generator / component-designer）接收方案

2. 平台感知路由
   ├─ 读取 techStack（工程模式：state.json / 敏捷模式：自动检测）
   └─ 路由到对应框架的批判性评审细则

3. 委托 adfo-task-orchestrator 并发执行
   ├─ 根据框架细则生成 {framework} 注入的 6 个 SubAgent 任务清单
   ├─ 声明无依赖关系（6 维度可完全并行）
   └─ 调用 adfo-task-orchestrator 执行

4. 6 维度框架感知并行批判
   ├─ SA1 需求解析：提炼核心目标、约束条件、模糊点（含框架特有约束）
   ├─ SA2 逻辑批判：批判设计逻辑、边界缺失、方案漏洞（含框架特有异常链路）
   ├─ SA3 架构评审：评审组件拆分、组合式逻辑、状态管理（框架工程化实践）
   ├─ SA4 交互体验：深挖交互链路、状态反馈、操作逻辑（含框架特有状态兜底）
   ├─ SA5 性能风险：评估渲染性能、兼容性、打包风险（框架特有性能检查点）
   └─ SA6 替代方案：输出轻量/健壮/工程化三套方案（框架特有替代方向）

5. 汇总整合
   ├─ 收集 6 个 SubAgent 输出
   ├─ 去重、归类、优先级排序
   └─ 生成结构化批判性探索报告

6. 输出报告
   └─ 反馈给调用方或下游技能
```

### 二次触发流程

```
用户指定单个维度深度再挖（保留当前框架上下文）
      ↓
仅启动指定 SubAgent（使用原 {framework} 提示词）
      ↓
深度分析该维度
      ↓
追加到原报告

用户指定切换框架再评审
      ↓
重新路由到目标框架细则
      ↓
启动全部 6 个 SubAgent
      ↓
生成框架对比补充报告
```

---

## 与现有技能的职责边界

| 技能 | 边界 |
|------|------|
| adfp-code-reviewer | critical-explorer 审查**设计方案**（编码前），code-reviewer 审查**已写好的代码**（编码后）。critical-explorer 从 techStack 感知框架，code-reviewer 从代码本身检测框架 |
| adfa-brainstorm | brainstorm 是**发散创意**，critical-explorer 是**批判收敛** |
| adfp-architecture-designer | architecture-designer **正向构建**架构，critical-explorer **审视批判**已有方案 |
| adfp-spec-generator | spec-generator **生成**技术规格，critical-explorer **审查**规格质量 |
| adfp-component-designer | component-designer **设计**组件方案（框架感知），critical-explorer **评审**设计方案（框架感知） |
| adfa-edge-case-master | edge-case-master 生成**测试用例代码**（框架感知），critical-explorer 发现**设计层面**的边界缺失 |

---

## 约束规则

1. **必须并发执行**：同一消息中启动所有 6 个 SubAgent，通过 adfo-task-orchestrator 调度
2. **维度隔离**：每个 SubAgent 严格只负责自己维度，不越界分析
3. **保持批判性**：不盲从用户方案，必须指出问题和风险
4. **框架感知**：所有分析紧贴检测到的目标框架的工程化实践，从 `references/critical-dimensions.md` 加载对应框架细则
5. **敏捷模式降级**：无 techStack 上下文时默认走通用路径，提示用户指定框架
6. **预设标注**：模糊需求自动补充预设并明确标注
7. **支持二次触发**：用户可指定单个 SubAgent 深度再挖，或切换框架重新评审
8. **依赖 task-orchestrator**：SubAgent 并发调度必须委托给 adfo-task-orchestrator

---

## 模板注入

> 共享配置由 `adfo-harness-runner/templates/custom.md` 统一管理。

`templates/custom.md` — 本技能特有的 SubAgent 执行参数与框架感知配置。

### SubAgent 框架感知任务模板

```yaml
# SA1 需求解析（{framework} 由平台感知注入）
task_id: sa1-requirement-analysis
dimension: 需求解析
prompt: |
  分析以下 {framework} 方案的需求层面：
  1. 核心目标是什么？
  2. 有哪些约束条件（含 {framework} 特有约束）？
  3. 哪些需求点模糊或缺失？
  4. 需要补充哪些预设？

# SA2 逻辑批判
task_id: sa2-logic-critique
dimension: 逻辑批判
prompt: |
  批判以下 {framework} 方案的逻辑层面：
  1. 设计逻辑是否自洽？
  2. 边界条件是否覆盖（含 {framework} 特有异常链路）？
  3. 有哪些方案漏洞？
  4. 逻辑链路是否完整？

# SA3 架构评审
task_id: sa3-architecture-review
dimension: 架构评审
prompt: |
  评审以下 {framework} 方案的架构层面：
  1. 组件拆分是否合理？
  2. {framework} 组合式逻辑/状态管理是否恰当？
  3. 耦合度与可维护性如何？
  4. 数据流向是否明确？

# SA4 交互体验
task_id: sa4-interaction-experience
dimension: 交互体验
prompt: |
  深挖以下 {framework} 方案的交互层面：
  1. 交互链路是否流畅？
  2. 状态反馈是否及时（含 {framework} 特有状态兜底）？
  3. 操作逻辑是否直观？
  4. 异常场景是否考虑？

# SA5 性能风险
task_id: sa5-performance-risk
dimension: 性能风险
prompt: |
  评估以下 {framework} 方案的性能层面：
  1. {framework} 渲染/更新性能风险点？
  2. 兼容性问题点？
  3. 打包体积风险？
  4. 内存泄漏风险？

# SA6 替代方案
task_id: sa6-alternative-solutions
dimension: 替代方案
prompt: |
  为以下 {framework} 方案输出替代方案：
  1. 轻量方案：最小实现
  2. 健壮方案：生产级实现
  3. 工程化方案：可扩展实现
```

---

## 测试用例

详见 `skills/adfa-critical-explorer/test/evals.md`。

### 典型测试场景

| 场景 | 输入 | 预期输出 |
|------|------|---------|
| React 组件方案评审（框架感知） | React 用户列表组件方案 | 6 维度批判报告 + React 特有检查（Hooks、JSX 等） |
| Vue 3 组件方案评审（框架感知） | Vue 3 商品卡片组件方案 | 6 维度批判报告 + Vue 特有检查（Composition API、SFC 等） |
| 小程序方案评审（框架感知） | 微信小程序电商首页方案 | 6 维度批判报告 + 小程序特有检查（包体积、分包策略等） |
| 跨端方案评审（框架感知） | Taro 跨端项目方案 | 6 维度批判报告 + 跨端特有检查（条件编译、平台差异等） |
| 通用路径降级 | 前端方案（无 techStack） | 按通用前端维度执行，提示指定框架 |
| 单维度深挖 | "让 SA3 再深入" | 保留框架上下文的单维度深度分析 |
| 模糊需求处理 | 不完整方案描述 | 补充预设 + 标注模糊点 |
