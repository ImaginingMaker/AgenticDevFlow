# adfp-component-designer

> React 组件设计专家。从用户需求出发，输出结构化的组件设计方案：组件树、状态方案、Props接口、数据依赖。

---

## 基本信息

| 属性 | 值 |
|------|-----|
| **名称** | adfp-component-designer |
| **类型** | 流水线技能 |
| **阶段** | DESIGN（在 ARCHITECTURE 和 IMPLEMENT 之间） |
| **前缀** | adfp- |
| **触发词** | `设计组件`、`组件设计`、`design component`、`帮我设计一下`、`怎么拆分组件`、`组件架构` |
| **文件位置** | `.claude/skills/adfp-component-designer/SKILL.md` |

---

## 核心特性

### 1. 视觉设计方向（强制性步骤）

在组件拆分之前，先确定整体美学方向，包含四要素：
- **目的**：界面解决什么问题？谁在使用？
- **风格基调**：极致简约 / 极繁混乱 / 复古未来 / 有机自然 / 奢品精致 / ...
- **约束**：技术限制（框架、性能、可访问性）
- **差异化**：用户会记住的 ONE THING

### 2. 美学→组件拆分映射

| 美学方向 | 组件拆分策略 | 空间处理 |
|----------|-------------|----------|
| 极简 | 更少组件、更大粒度 | 宽裕负空间、精确对齐 |
| 极繁 | 更多装饰组件、层级叠加 | 受控密度、重叠布局 |
| 编辑风 | 内容优先、版面网格 | 非对称、跨网格元素 |
| 有机感 | 流体形状、自然过渡 | 不规则间距、曲线流动 |

### 3. 组件树设计

按类型区分：展示型 / 容器型 / 组合型

```
PageComponent（容器型）
├── Header（展示型）
├── MainContent（容器型）
│   ├── SearchBar（组合型）
│   └── DataList（容器型）
│       └── DataItem（展示型）×N
└── Footer（展示型）
```

### 4. 完整输出（7 章节）

1. 需求摘要
2. 视觉设计方向（美学方向、字体/色彩/空间策略、记忆点）
3. 组件树
4. 状态设计（状态清单表）
5. Props 接口定义（TypeScript interface）
6. 数据依赖与状态兜底（loading/empty/error/crash）
7. 边界情况与约束

### 5. 双模式输入

| 模式 | 输入 | 说明 |
|------|------|------|
| 敏捷模式 | 用户描述 | 从零开始设计，独立闭环 |
| 工程模式 | `architecture.md` + `spec.md` | 承接上游架构，展开详细组件树 |

---

## 使用方式

```
# 直接描述需求
"帮我设计一个用户列表页面，支持搜索、筛选、分页"

# 从架构设计展开
"基于这份架构设计，展开用户管理模块的组件设计"
```

---

## 依赖关系

### 上游依赖（本技能依赖谁）

| 技能 | 关系类型 | 输入产物 | 说明 |
|------|---------|---------|------|
| `adfp-architecture-designer` | 前置输入 | `architecture.md` | 接收架构分析和文件层级蓝图展开详细组件树 |
| `adfp-spec-generator` | 前置输入 | `spec.md` | 接收 SPEC 的页面架构、数据模型、API 契约 |
| `adfo-harness-runner` | 编排调度 | 调度信号 | 工程模式下由 harness 在 DESIGN 阶段调度本技能 |

### 下游消费（谁依赖本技能）

| 技能 | 关系类型 | 输出产物 | 说明 |
|------|---------|---------|------|
| `adfp-code-implementer` | 后置消费 | `design.md` | 严格按照组件设计方案生成代码 |
| `adfa-critical-explorer` | 建议下游 | `design.md` | 可对设计方案进行 6 维度批判性评审 |

---

## 流程生命周期

### 触发条件

- **自动触发**：harness 在 ARCHITECTURE 通过后自动进入 DESIGN 阶段
- **手动触发**："设计组件"、"帮我设计一下"、"怎么拆分组件"、"组件架构"
- **敏捷模式**：跳过上游直接基于用户描述设计

### 生命周期图

```
adfp-architecture-designer / adfp-spec-generator / 用户描述
      ↓
本技能：需求摘要 → 视觉设计方向 → 组件树 → 状态方案 → Props接口 → 数据依赖 → 输出
      ↓
adfp-code-implementer（生成代码）

异常路径：
  ├─ 需求模糊 → 标注「待澄清」，不猜测
  └─ 设计偏离架构 → 建议回退 ARCHITECTURE 调整
```

### 在完整流水线中的位置

```
INIT → ANALYZE → PRD → SPEC → ARCHITECTURE → 【DESIGN】 → IMPLEMENT → REVIEW → DONE
```

### 产物状态

| 产物 | 路径 | 状态流转 |
|------|------|---------|
| 组件设计文档 | `./design.md` / `docs/workflows/{任务ID}/design.md` | 创建 → IMPLEMENT 消费 → 归档 |

---

## 工作流程

```
读取输入 → 需求理解 → 视觉设计方向（必选步骤）→ 组件树设计 → 状态设计 → Props接口定义 → 数据依赖 → 输出设计文档
```

### 详细步骤

1. **读取输入**
   - 工程模式：读取 `architecture.md` 和 `spec.md`
   - 敏捷模式：解析用户描述的需求

2. **需求理解**
   - 提取功能要点
   - 识别用户角色和使用场景
   - 标注模糊点为「待澄清」

3. **视觉设计方向（必选步骤）**
   - 确定美学方向（极简/极繁/编辑风/有机感等）
   - 定义字体、色彩、空间策略
   - 明确差异化记忆点

4. **组件树设计**
   - 根据美学方向确定拆分粒度
   - 区分展示型/容器型/组合型组件
   - 绘制组件层级结构

5. **状态设计**
   - 识别全局状态与局部状态
   - 遵循最小化原则
   - 设计状态清单表

6. **Props接口定义**
   - 为每个组件定义 TypeScript interface
   - 区分必填/可选属性
   - 定义事件回调类型

7. **数据依赖**
   - 识别数据来源（API/Context/Props）
   - 设计 loading/empty/error/crash 状态兜底
   - 定义数据流转路径

8. **输出设计文档**
   - 生成包含全部 7 章节的 `design.md`

---

## 与现有技能的职责边界

### 与 adfp-architecture-designer 的边界

| 技能 | 职责 | 产物 |
|------|------|------|
| `adfp-architecture-designer` | 文件层级规划、模块边界、依赖拓扑、可复用分析 | `architecture.md` |
| `adfp-component-designer` | 详细组件树、Props接口、状态变量、视觉方向 | `design.md` |

**边界原则**：architecture 决定"文件怎么组织"，component-designer 决定"组件内部怎么设计"。

### 与 adfp-spec-generator 的边界

| 技能 | 职责 | 产物 |
|------|------|------|
| `adfp-spec-generator` | 页面架构（页面→区块映射）、数据模型、API契约、路由设计 | `spec.md` |
| `adfp-component-designer` | 区块内组件拆分、Props接口、状态变量 | `design.md` |

**边界原则**：spec 定义"页面有哪些区块"，component-designer 定义"区块内组件结构"。

### 与 adfp-code-implementer 的边界

| 技能 | 职责 | 产物 |
|------|------|------|
| `adfp-component-designer` | 设计方案、接口定义、状态规划 | `design.md` |
| `adfp-code-implementer` | 代码实现、样式编写、测试用例 | 源代码文件 |

**边界原则**：component-designer 只设计不写代码，code-implementer 严格按设计实现。

### 与 adfa-critical-explorer 的协作

`adfa-critical-explorer` 可作为本技能的下游评审环节，对设计方案进行 6 维度批判性评审：
- 完整性：是否覆盖所有需求场景
- 一致性：组件命名、接口风格是否统一
- 可扩展性：是否预留合理扩展点
- 性能考量：是否存在明显性能隐患
- 可访问性：是否考虑无障碍需求
- 边界处理：异常状态是否完备

---

## 约束规则

1. **不写代码实现**，只输出设计文档
2. **视觉设计方向为必选步骤**，不可跳过
3. **遇到模糊需求标注「待澄清」**，不猜测
4. **状态设计遵循最小化原则**，避免过度设计
5. **产物必须包含全部 7 个章节**
6. **不确定时，用提问代替假设**
7. **设计偏离架构时**，建议回退 ARCHITECTURE 调整而非强行推进

---

## 模板注入

共享配置由 `adfo-harness-runner/templates/custom.md` 统一管理。

技能特有模板见 `.claude/skills/adfp-component-designer/templates/custom.md`，包含：
- 组件命名约定
- 状态管理规则
- Props 接口约定
- 视觉设计方向模板

---

## 测试用例

详见 `.claude/skills/adfp-component-designer/test/`。

### 典型测试场景

1. **敏捷模式测试**：用户描述"设计一个带搜索的用户列表页面"
2. **工程模式测试**：基于 `architecture.md` 和 `spec.md` 展开组件设计
3. **边界测试**：需求模糊时的「待澄清」标注
4. **美学映射测试**：不同美学方向对应的组件拆分策略
5. **状态兜底测试**：loading/empty/error/crash 四态完整性
