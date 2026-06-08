# adfa-code-analysis
> 统一代码分析技能（三模式索引树）。

## 基本信息

| 属性 | 值 |
|------|-----|
| **名称** | adfa-code-analysis |
| **类型** | 辅助 |
| **前缀** | adfa- |
| **阶段** | 全阶段 |
| **触发词** | context: `理解这段代码` `追踪调用链` `分析这个模块`；scan→full: `扫描代码` `盘点资产` `代码审计` `项目中有哪些组件`；scan→quick: `找相似` `参考一下` `有没有现成的` `项目中怎么做`；extract: `提取Hooks` `封装Hook` `复用这段逻辑` `提取Composable` `提取Behaviors` |
| **文件位置** | `skills/adfa-code-analysis/SKILL.md` |

## 核心特性

### 三模式索引树

```
adfa-code-analysis (入口 — 仅含路由表)
│
├── mode:context — 单文件/模块调用链追踪
├── mode:scan
│   ├── submode:full — 全量项目资产盘点
│   └── submode:quick — 快速相似匹配
└── mode:extract — 可复用逻辑提取
```

### 1. mode:context — 代码上下文理解

**核心能力**：给定文件或文件夹路径，追踪所有引用、映射完整逻辑流程、输出结构化分析报告。

| 步骤 | 说明 |
|------|------|
| 确定入口点 | 文件路径直接使用；文件夹自动检测 index/main/App 等 |
| 追踪引用链 | 递归追踪内部模块 2-3 层 |
| 映射逻辑流 | 树形文本流程图 |
| 输出报告 | 基本信息+逻辑链+模块摘要+数据流+副作用+外部依赖+阅读顺序 |

### 2. mode:scan — 代码扫描与资产盘点

**submode:full** — 3 SA 并发扫描：

| SA | 职责 | 产出 |
|----|------|------|
| SA1 | 组件扫描器 | 组件清单 + 原子化评级 + 可复用候选 |
| SA2 | Hooks/逻辑盘点器 | Hook/Util 清单 + 引用次数 + 重复实现检测 |
| SA3 | Service/API 扫描器 | API 调用清单 + 封装完整性评估 |

**submode:quick** — 2 SA 快速相似匹配：

| SA | 职责 | 产出 |
|----|------|------|
| SA1-快速 | 组件/模式匹配器 | Top-5 相似组件 |
| SA2-快速 | 逻辑/API 匹配器 | Top-5 相似逻辑单元 |

### 3. mode:extract — 可复用逻辑提取

4 维度并发扫描 + 四维度评分（复用性/内聚性/可测试性/代码量），评分 ≥ 60% 建议提取。

| SA | 维度 | 识别模式 |
|----|------|---------|
| SA1 | 状态组合 | 多个状态变量描述同一业务概念 |
| SA2 | 副作用逻辑 | 副作用中的业务逻辑 |
| SA3 | 重复模式 | 2+ 组件的相似状态+副作用组合 |
| SA4 | 复杂计算 | 多步骤计算链 |

## 使用方式

```bash
# mode:context — 理解代码
"帮我理解一下 src/components/UserList.tsx"

# mode:scan→full — 全量扫描
"扫描一下项目中有哪些组件"

# mode:scan→quick — 快速匹配
"找一下有没有类似的搜索功能组件"

# mode:extract — 提取逻辑
"提取 Hooks：这段代码里有哪些可以抽成自定义 Hook 的？"
```

## 依赖关系

| 关系类型 | 技能 | 说明 |
|---------|------|------|
| `委托调度` | `adfo-task-orchestrator` | 各模式中涉及并发 SubAgent 时委托调度 |
| `编排调度` | `adfo-harness-runner` | 工程模式下由 harness 调度 |
| `下游消费` | `adfp-architecture-designer` | 消费 `code-scan-report.md` 做架构决策 |
| `下游消费` | `adfp-code-implementer` | IMPLEMENT 前扫描可复用资产 |
| `下游触发` | `adfp-code-reviewer` | 审查发现可提取模式时建议调用 extract |
| `互补` | `adfa-refactor-advisor` | extract 专注逻辑提取，refactor 覆盖更广 |
| `下游消费` | `adfa-edge-case-master` | 理解逻辑后生成测试用例 |
| `互补` | `adft-page-wiki-generator` | wiki 生成页面级链路，本技能做模块级分析 |

## 流程生命周期

### 触发条件

- **手动触发**：用户说对应模式的触发词
- **自动触发**：`adfo-harness-runner` 在 IMPLEMENT 前调度 scan→full
- **下游回调**：`adfp-code-reviewer` 发现可提取模式时建议 extract

### 生命周期图

```
用户输入 → 模式路由（匹配触发词）
  ├─ mode:context → 确定入口 → 追踪引用链 → 映射流程 → 输出分析报告
  ├─ mode:scan→full → 平台检测 → 3 SA 并发 → 汇总 → code-scan-report.md
  ├─ mode:scan→quick → 平台检测 → 2 SA 并发 → 相似度分析 → component-match.md
  └─ mode:extract → 平台检测 → 4 SA 并发 → 去重评分 → 提取方案
```

### 产物状态

| 模式 | 产物 | phase | 状态流转 |
|------|------|-------|---------|
| context | `{target}-context-report.md` | CONTEXT | 输出 → 用户/下游技能消费 |
| scan/full | `code-scan-report.md` | CODE_SCAN | 输出 → architecture-designer/implementer 消费 |
| scan/quick | `component-match.md` | QUICK_MATCH | 输出 → component-designer/implementer 消费 |
| extract | 对话输出 / `extraction-report.md` | EXTRACT | 输出 → 用户决定是否应用 |

## 与现有技能的职责边界

| 技能 | 边界 |
|------|------|
| `adfp-architecture-designer` | architecture-designer **全局架构规划**，本技能扫描/分析提供输入 |
| `adfa-refactor-advisor` | refactor 出**结构性重构方案**，本技能 extract 只做**逻辑提取**（不修改结构） |
| `adfp-code-reviewer` | reviewer **评估代码质量**，本技能 context 帮助**建立心智模型** |
| `adfp-code-implementer` | implementer **生成新代码**，本技能所有模式**只分析已有代码** |
| `adft-page-wiki-generator` | wiki 生成**页面级**链路 Wiki，本技能分析**模块级**代码上下文 |

## 约束规则

1. **只读不写** — 三个模式均只分析代码，不修改任何源码
2. **渐进式加载** — SKILL.md 仅含路由表，各模式详细流程从 `references/` 按需加载
3. **SubAgent 委托** — 涉及并发 SubAgent 均通过 `adfo-task-orchestrator` 调度
4. **产物一致性** — 各模式产物 front-matter 必须包含 `phase` 字段
5. **平台检测共享** — 三个模式共用同一套三链路检测机制

## 模板注入

共享配置由 `adfo-harness-runner/templates/custom.md` 统一管理。技能特有配置（扫描路径映射、原子化评级阈值、评分权重）见 `skills/adfa-code-analysis/templates/custom.md`。

## 测试用例

详见 `skills/adfa-code-analysis/test/evals.md`。
