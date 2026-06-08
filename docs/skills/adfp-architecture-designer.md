# adfp-architecture-designer
> 前端架构设计专家。两大模式：1）已有项目——先调用`adfa-code-analysis`（mode:scan→full）获取组件/逻辑/API资产清单，再通过2个SubAgent做依赖拓扑+规范分析；2）新项目——基于SPEC智能规划文件层级架构和模块边界。产物为architecture.md，包含可复用清单、依赖图、实施顺序、文件层级蓝图。是SPEC到DESIGN之间的架构桥梁。

## 基本信息
| 属性 | 值 |
|------|-----|
| **名称** | adfp-architecture-designer |
| **类型** | 流水线 |
| **前缀** | adfp- |
| **触发词** | `架构设计`、`architecture`、`分析项目架构`、`规划文件结构`、`复用分析`、`实施计划`、`模块拆分`、`依赖分析` |
| **文件位置** | `skills/adfp-architecture-designer/SKILL.md` |

## 核心特性

### 1. 模式 A：已有项目分析

> 组件扫描、Hooks/逻辑盘点、Service/API 扫描由 `adfa-code-analysis`（mode:scan→full）统一负责。本模式先调用 code-analysis 获取资产清单，再通过 2 个架构 SubAgent 做深度分析。

**Step 1：调用 adfa-code-analysis（mode:scan→full）** → 获取 `code-analysis-report.md`（组件/逻辑/API 资产清单）

**Step 2：委托 `adfo-task-orchestrator` 并发 2 个架构 SubAgent** → 依赖图映射器 + 结构规范分析器

| SubAgent | 职责 | 输入 |
|----------|------|------|
| 依赖图映射器 | 绘制组件间依赖拓扑，检测循环依赖 | scanner 的组件清单 + 项目代码 |
| 结构规范分析器 | 分析目录结构、命名规范、样式方案 | scanner 的逻辑/API 资产 + 项目目录 |

**Step 3：汇总整合** → 合并 scanner 资产清单 + 依赖图 + 规范分析 → 输出 `architecture.md`

### 2. 模式 B：新项目规划

基于 SPEC 的页面架构、数据模型、路由，生成最优文件层级：

```
src/
├── components/
│   ├── ui/          # 原子级通用组件
│   └── business/    # 业务组件
├── pages/           # 页面
├── hooks/           # 自定义 Hooks
├── services/        # API 层
├── stores/          # 全局状态
├── types/           # 类型定义
├── utils/           # 工具函数
└── constants/       # 常量
```

### 3. 模块依赖图

输出依赖拓扑 + 循环依赖检测 + 并行识别。**不做拓扑排序**（该职责归 adfo-harness-runner）。

### 4. 原子化评级标准

- ✅ 原子化良好：单一职责 + Props 最小化 + ≤200 行
- ⚠️ 可拆分：职责混杂 > 1
- 🔴 应重构：> 200 行、多职责耦合

## 使用方式

### 已有项目分析

```
"分析现有项目架构，找出可复用的模块"
"扫描项目依赖关系"
```

### 新项目规划

```
"基于 SPEC 规划文件结构"
"这个项目的组件应该怎么组织"
```

## 依赖关系

### 上游依赖（本技能依赖谁）
| 技能 | 关系类型 | 说明 |
|------|---------|------|
| `adfp-spec-generator` | 前置输入 | 基于 SPEC 的页面架构和数据模型进行架构分析 |
| `adfa-code-analysis` (mode:scan→full) | 前置输入（已有项目） | 消费 code-analysis 的组件/逻辑/API 资产清单，替代原 SA1-SA3 |
| `adfo-harness-runner` | 编排调度 | 工程模式下由 harness 在 ARCHITECTURE 阶段调度本技能 |
| `adfo-task-orchestrator` | 委托调度 | SA4-SA5 架构 SubAgent 通过 task-orchestrator 统一调度执行 |

### 下游消费（谁依赖本技能）
| 技能 | 关系类型 | 说明 |
|------|---------|------|
| `adfp-component-designer` | 后置消费 | 基于架构的文件层级蓝图展开详细组件设计 |
| `adfp-code-implementer` | 后置消费 | 快速原型模式下直接基于架构分析生成代码 |
| `adfa-code-analysis` (mode:extract) | 建议下游 | code-analysis 发现可提取逻辑时建议调用 |

## 流程生命周期

### 触发条件
- **自动触发**：harness 在 SPEC 通过后自动进入 ARCHITECTURE 阶段
- **手动触发**：用户说"架构设计"、"分析项目架构"、"规划文件结构"、"复用分析"、"实施计划"、"模块拆分"、"依赖分析"
- **下游回调**：adfp-component-designer 在发现架构信息不足时回退到本技能补充分析

### 生命周期图
```
adfp-spec-generator → adfa-code-analysis（mode:scan→full）→ 本技能 → adfp-component-designer

本技能内部流程（已有项目）：
输入(spec.md) → 调用 adfa-code-analysis（mode:scan→full）→ 接收 code-analysis 资产清单
    → 并发2个架构SubAgent(依赖图+规范分析) → 汇总整合 → 输出 architecture.md

本技能内部流程（新项目）：
输入(spec.md) → 按原子化四原则生成目录树 → 输出 architecture.md

异常路径：
  ├─ 项目代码缺失 → 降级为纯 SPEC 推导模式
  ├─ 循环依赖检测到 → 标注 critical，阻断后续
  └─ SPEC 不完整 → 回退到 adfp-spec-generator 补充
```

### 在完整流水线中的位置
```
INIT → ANALYZE → PRD → SPEC → 【CODE_SCAN】 → 【ARCHITECTURE】 → DESIGN → IMPLEMENT → REVIEW → DONE
                          ↑ adfa-code-analysis（mode:scan→full）  ↑ adfp-architecture-designer
```

### 产物状态
| 产物 | 路径 | 状态流转 |
|------|------|---------|
| architecture.md | `./architecture.md` / `docs/workflows/{任务ID}/architecture.md` | 创建 → DESIGN 消费 → 归档 |

## 工作流程

```
判断项目类型 → 选择模式（已有/新建）→ 分析/规划 → 依赖拓扑 → 输出 architecture.md
```

### 详细步骤

1. **判断项目类型**：检查是否存在现有代码库
2. **选择模式**：
   - 已有项目：先调用 adfa-code-analysis（mode:scan→full）全量扫描，再以其资产清单为输入运行 2 个架构 SubAgent
   - 新项目：基于 SPEC 智能规划文件层级
3. **依赖拓扑分析**：绘制模块依赖图，检测循环依赖
4. **输出产物**：生成 architecture.md，包含可复用清单、依赖图、实施顺序、文件层级蓝图

### 执行指令

当触发本技能时，按以下步骤执行：

1. **确定模式**：检查项目是否有代码 → 选择模式 A（已有项目）或模式 B（新项目）
2. **平台感知**：检测/读取技术栈
3. **已有项目 → Step 1 - 调用 code-analysis**：调度 `adfa-code-analysis`（mode:scan→full），获取 `code-analysis-report.md`
4. **已有项目 → Step 2 - 架构 SubAgent**：以 code-analysis 产出的资产清单为输入，创建 SA4-SA5 任务清单，委托 `adfo-task-orchestrator` 并发调度
5. **新项目 → 规划文件层级**：按原子化优先 + 就近原则 + 扁平优先 + 领域隔离 四原则生成目录树
6. **汇总整合**：合并 code-analysis 资产清单 + SA4 依赖图 + SA5 规范分析 → 去重 → 冲突校验 → 优先级排序 → 可复用清单
7. **生成模块依赖图**：标注依赖方向、循环依赖、可并行模块
8. **输出产物**：生成包含 `phase: ARCHITECTURE` front-matter 的 `architecture.md`

## 输出原则

1. **不重复代码** — 不粘贴大段源码，只提炼架构层面的信息
2. **不过度展开** — 每个模块/组件用 1-2 句话描述职责，不深入实现细节
3. **可执行优先** — 依赖图标注「可并行」和「串行依赖」，供 harness-runner 直接使用
4. **验收导向** — 每个架构决策标注理由，供下游 DESIGN 阶段理解
5. **一致性优先** — 已有项目以实际代码为准，不预设理想架构

## 架构质量检查清单

输出 `architecture.md` 前，检查以下事项：

| # | 检查项 | 标准 |
|---|--------|------|
| 1 | **阶段一致性** | front-matter 中 `phase: ARCHITECTURE` |
| 2 | **内容实质性** | 正文 ≥ 50 字符，不只含 front-matter |
| 3 | **code-analysis 资产完整** | 已调用 adfa-code-analysis（mode:scan→full）获取资产清单，不自行重复扫描 |
| 4 | **依赖图完整** | 含依赖拓扑 + 循环依赖检测 + 可并行标注 |
| 5 | **原子化评级** | 每个组件标注 ✅/⚠️/🔴 三级评级 |
| 6 | **规范分析** | 目录/命名/样式/TS 四项全覆盖 |
| 7 | **边界清晰** | 不包含本技能不应产出的内容（组件树、实施顺序） |

## CLI 集成（工程模式）

```bash
# 执行前：获取编译后的执行上下文
node skills/adfo-harness-runner/scripts/harness-cli.js context {任务ID}

# 执行后：校验产物并更新状态
node skills/adfo-harness-runner/scripts/harness-cli.js verify {任务ID} ARCHITECTURE {产物路径}
```

## 技能协作

| 技能 | 关系 | 说明 |
|------|------|------|
| `adfp-spec-generator` | 前置输入（新项目模式） | SPEC 的页面架构和路由作为文件层级蓝图输入 |
| `adfa-code-analysis` (mode:scan→full) | 前置输入（已有项目模式） | 消费 code-analysis 的组件/逻辑/API 资产清单，替代原 SA1-SA3 |
| `adfp-component-designer` | 后置消费 | 基于 architecture.md 的可复用清单避免重复设计 |
| `adfo-harness-runner` | 编排调度 | 读取依赖图生成实施顺序 |
| `adfo-task-orchestrator` | 委托调度 | SA4-SA5 通过 orchestrator 并发执行 |
| `adfa-code-analysis` (mode:extract) | 建议下游 | code-analysis 发现可提取逻辑时建议调用 |
| `adfa-edge-case-master` | 建议下游 | 架构文档末推荐生成测试策略 |

## 与现有技能的职责边界

| 本技能负责 | 不负责（归其他技能） |
|-----------|---------------------|
| 架构决策与规划 | 代码扫描盘点（→ adfa-code-analysis (mode:scan→full)，替代原 SA1-SA3） |
| 文件层级蓝图 | 拓扑排序/实施顺序（→ adfo-harness-runner） |
| 模块依赖图 | 详细组件树（→ adfp-component-designer） |
| 架构规范分析 | 代码实现（→ adfp-code-implementer） |

## 约束规则

1. 不做代码实现——只做架构分析和规划
2. 不做内联逻辑提取——由 adfa-code-analysis (mode:extract) 负责
3. 不做拓扑排序——由 adfo-harness-runner 负责
4. **已有项目**：必须先调用 `adfa-code-analysis`（mode:scan→full）获取资产清单，不自行重复扫描
5. **新项目**：无代码可扫描，不调用 code-analysis，直接基于 SPEC 规划
6. 工程模式下从 `state.json.techStack` 读取已识别的技术栈，避免重复扫描
7. 已有项目以实际代码为准，不凭空假设

## 模板注入

共享配置由 `adfo-harness-runner/templates/custom.md` 统一管理。技能特有模板（原子化标准、禁止项、SubAgent 配置）见 `skills/adfp-architecture-designer/templates/custom.md`。

## 测试用例

详见 `skills/adfp-architecture-designer/test/`。

### 工程模式调用（Harness 调度）

当被 `adfo-harness-runner` 调度时，遵循两阶模式（context → execute → verify）：

#### 执行前
LLM 已从 `harness-cli context <taskId>` 获取编译上下文，包括：
- **技术栈**：从 `state.json.techStack` 读取的完整技术栈信息
- **产物路径**：`docs/workflows/{taskId}/architecture.md`
- **上游产物**：已完成阶段的产物引用（如 spec.md）
- **跳过信息**：已跳过阶段的列表及原因

直接按上下文指令执行，**不需要自行读取 state.json**。

#### 执行后
运行 `harness-cli verify <taskId> ARCHITECTURE <artifact>` 校验产物：

```bash
node scripts/harness-cli.js verify <taskId> ARCHITECTURE docs/workflows/<taskId>/architecture.md
```

LLM 不能跳过此步骤——状态更新由 verify 命令原子写入，包括：
1. 解析 front-matter 的 phase/status/qualityGate
2. 三判定校验：阶段一致性、内容实质性（≥50字符）、qualityGate 值
3. 原子写入 state.json（先写 tmp → mv）
4. 更新 checkpoint（文件 SHA-256 快照）
