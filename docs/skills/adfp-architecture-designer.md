# adfp-architecture-designer
> 前端架构设计专家。两大模式：1）已有项目——并发5个SubAgent扫描现有代码，识别可复用原子化模块、依赖拓扑、规范模式；2）新项目——基于SPEC智能规划文件层级架构和模块边界。产物为architecture.md，包含可复用清单、依赖图、实施顺序、文件层级蓝图。是SPEC到DESIGN之间的架构桥梁。

## 基本信息
| 属性 | 值 |
|------|-----|
| **名称** | adfp-architecture-designer |
| **类型** | 流水线 |
| **前缀** | adfp- |
| **触发词** | `架构设计`、`architecture`、`分析项目架构`、`规划文件结构`、`复用分析`、`实施计划`、`模块拆分`、`依赖分析` |
| **文件位置** | `.claude/skills/adfp-architecture-designer/SKILL.md` |

## 核心特性

### 1. 模式 A：已有项目分析

**主 Agent 生成任务清单 → 委托 `adfo-task-orchestrator` 并发 5 个 SubAgent → 接收汇总 → 去重输出报告**。5 个 SubAgent 全部无依赖，同一并发组并行执行。

| SubAgent | 职责 | 扫描范围 |
|----------|------|---------|
| 组件扫描器 | 枚举已有组件，原子化评级 | `src/components/`、`src/pages/` |
| Hooks/逻辑盘点器 | 盘点已有 Hooks（不提取内联逻辑） | `src/hooks/`、`src/utils/` |
| Service/API 扫描器 | 分析 API 调用模式和封装 | `src/services/`、`src/api/` |
| 依赖图映射器 | 绘制组件间依赖拓扑 | import/export 关系 |
| 结构规范分析器 | 分析目录结构、命名规范、样式方案 | 全项目 |

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
| `adfo-harness-runner` | 编排调度 | 工程模式下由 harness 在 ARCHITECTURE 阶段调度本技能 |
| `adfo-task-orchestrator` | 委托调度 | 5 个 SubAgent 并发扫描通过 task-orchestrator 统一调度执行 |

### 下游消费（谁依赖本技能）
| 技能 | 关系类型 | 说明 |
|------|---------|------|
| `adfp-component-designer` | 后置消费 | 基于架构的文件层级蓝图展开详细组件设计 |
| `adfp-code-implementer` | 后置消费 | 快速原型模式下直接基于架构分析生成代码 |
| `adfa-hooks-extractor` | 建议下游 | 架构扫描发现可提取 Hook 时建议调用 |

## 流程生命周期

### 触发条件
- **自动触发**：harness 在 SPEC 通过后自动进入 ARCHITECTURE 阶段
- **手动触发**：用户说"架构设计"、"分析项目架构"、"规划文件结构"、"复用分析"、"实施计划"、"模块拆分"、"依赖分析"
- **下游回调**：adfp-component-designer 在发现架构信息不足时回退到本技能补充分析

### 生命周期图
```
adfp-spec-generator → 本技能 → adfp-component-designer

本技能内部流程：
输入(spec.md/项目代码) → 判断项目类型 → 选择模式(已有项目分析/新项目规划) → 并发5个SubAgent扫描 → 输出 architecture.md

异常路径：
  ├─ 项目代码缺失 → 降级为纯 SPEC 推导模式
  ├─ 循环依赖检测到 → 标注 critical，阻断后续
  └─ SPEC 不完整 → 回退到 adfp-spec-generator 补充
```

### 在完整流水线中的位置
```
INIT → ANALYZE → PRD → SPEC → 【ARCHITECTURE】 → DESIGN → IMPLEMENT → REVIEW → DONE
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
   - 已有项目：委托 adfo-task-orchestrator 并发 5 个 SubAgent 扫描
   - 新项目：基于 SPEC 智能规划文件层级
3. **依赖拓扑分析**：绘制模块依赖图，检测循环依赖
4. **输出产物**：生成 architecture.md，包含可复用清单、依赖图、实施顺序、文件层级蓝图

## 与现有技能的职责边界

| 本技能负责 | 不负责（归其他技能） |
|-----------|---------------------|
| 可复用模块盘点 | 深度提取内联逻辑（→ adfa-hooks-extractor） |
| 文件层级蓝图 | 拓扑排序/实施顺序（→ adfo-harness-runner） |
| 模块依赖图 | 详细组件树（→ adfp-component-designer） |
| 原子化评级 | 代码实现（→ adfp-code-implementer） |

## 约束规则

1. 不做代码实现——只做架构分析和规划
2. 不做内联逻辑提取——由 adfa-hooks-extractor 负责
3. 不做拓扑排序——由 adfo-harness-runner 负责
4. SubAgent 通过 `adfo-task-orchestrator` 并发调度（5 个全部无依赖，同一并发组）
5. 工程模式下从 `state.json.techStack` 读取已识别的技术栈，避免重复扫描
6. 已有项目以实际代码为准，不凭空假设

## 模板注入

共享配置由 `adfo-harness-runner/templates/custom.md` 统一管理。技能特有模板（原子化标准、禁止项、SubAgent 配置）见 `.claude/skills/adfp-architecture-designer/templates/custom.md`。

## 测试用例

详见 `.claude/skills/adfp-architecture-designer/test/`。
