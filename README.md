# AgenticDevFlow

基于 Claude Code 的前端工程化能力平台，通过 21 个可编排 AI 技能覆盖从需求分析到代码审查的完整开发生命周期。

## 核心概念

AgenticDevFlow 将前端开发流程标准化为 **INIT → ANALYZE → PRD → SPEC → ARCHITECTURE → DESIGN → IMPLEMENT → REVIEW → DONE** 九个阶段，每个阶段由专用 AI Skill 驱动。技能间通过 DAG 依赖图编排，支持正向交付流水线和反向反馈循环。

项目包含可执行代码：Harness CLI 编译器（`skills/adfo-harness-runner/scripts/harness-cli.js`），用于状态管理、流转决策、产物校验等机械操作的自动化。所有可执行脚本通过 `package.json` 统一管理。

### 双层编排架构 + 编译架构

```
adfo-harness-runner（阶段级编排）
  ├─ 编译架构（两阶模式）
  │   ├─ 前置：harness-cli context <taskId>  → 编译 state.json 为 LLM 消费的上下文
  │   ├─ 执行：LLM 调用原子技能完成内容生成
  │   └─ 后置：harness-cli verify <taskId> <phase> <file> → 校验产物 + 原子写 state
  │
  ├─ 管理反向反馈循环（REVIEW FAIL→IMPLEMENT 等）
  ├─ 跨会话状态持久化（state.json）
  └─ IMPLEMENT 阶段委托给 ↓

adfo-task-orchestrator（任务级编排）
  └─ 接收结构化任务清单 + 依赖关系
  └─ 构建 DAG 拓扑、识别并发组
  └─ 按拓扑顺序调度 SubAgent 并发/串行执行
  └─ 汇总所有结果
```

**编译架构核心原则**：代码在 LLM 执行前/后处理机械操作（状态读取、流转决策、产物校验、原子写入），LLM 只负责内容生成。

关键区别：harness-runner 管理**阶段间流转**，task-orchestrator 管理**阶段内并发**。

## 技能体系

### 命名规范

所有技能统一使用 `adf`（**A**gentic**D**ev**F**low）作为项目前缀，按类型定义二级前缀：

| 类型 | 前缀 | 含义 | 示例 |
|------|------|------|------|
| 流水线 | `adfp-` | Pipeline，正向交付流水线 | `adfp-code-reviewer` |
| 编排 | `adfo-` | Orchestration，流程调度管理 | `adfo-harness-runner` |
| 辅助 | `adfa-` | Assistance，辅助分析/建议 | `adfa-dev-helper` |
| 工具 | `adft-` | Tool，独立工具不参与流水线 | `adft-smart-commit` |

**判断标准**：技能服务于前端开发哪个层面？
- 正向交付流水线（PRD→SPEC→DESIGN→IMPLEMENT→REVIEW）→ `adfp-`
- 流程调度与任务管理 → `adfo-`
- 辅助分析、建议、审查 → `adfa-`
- 独立工具、不参与开发流程 → `adft-`

格式统一：`<前缀><功能描述>`，小写 + 连字符。禁止驼峰、下划线、空格。

### 流水线技能（7 个）
参与正向交付流水线的核心技能，按阶段顺序执行：

| 技能 | 阶段 | 职责 |
|------|------|------|
| `adfp-requirement-analyzer` | ANALYZE | 需求多维度协同分析 |
| `adfp-prd-generator` | PRD | 产品需求文档生成 |
| `adfp-spec-generator` | SPEC | 技术规格（架构、数据模型、API、路由） |
| `adfp-architecture-designer` | ARCHITECTURE | 架构分析与文件层级规划 |
| `adfp-component-designer` | DESIGN | 组件结构与视觉设计 |
| `adfp-code-implementer` | IMPLEMENT | 代码生成（含美学规范） |
| `adfp-code-reviewer` | REVIEW | 7 维度代码审查 + 加权评分 |

### 编排技能（2 个）
管理层级调度：

| 技能 | 层级 | 职责 |
|------|------|------|
| `adfo-harness-runner` | 阶段级流水线 | 管理完整交付流程、状态持久化、断点恢复 |
| `adfo-task-orchestrator` | 任务级并发 | DAG 拓扑调度 SubAgent 并发执行 |

### 辅助技能（8 个）
支持流水线各阶段，可按需在任意阶段调用：

| 技能 | 职责 |
|------|------|
| `adfa-dev-helper` | 只读顾问：进度速览、场景分析、下一步建议 |
| `adfa-brainstorm` | 创意头脑风暴引导 |
| `adfa-code-context` | 代码上下文理解与调用链追踪 |
| `adfa-critical-explorer` | 6 维度并发批判性方案评审 |
| `adfa-edge-case-master` | 边界/异常/压力测试用例生成 |
| `adfa-hooks-extractor` | 深度扫描可复用 Hook 逻辑（支持 React/Vue/小程序） |
| `adfa-refactor-advisor` | 代码重构方案与前后对照代码 |
| `adfa-ux-interaction-checker` | UX/UI 交互缺陷检查（Web/小程序环境感知） |

### 工具技能（4 个）
独立工具，不参与流水线：

| 技能 | 职责 |
|------|------|
| `adft-directory-restructurer` | 前端目录结构重塑（目录重组 + 引用更新） |
| `adft-skill-creator` | 创建新的 Claude Code 技能 |
| `adft-page-wiki-generator` | 页面链路分析 + Wiki 文档自动生成 |
| `adft-smart-commit` | 智能 Git 提交（自动分类与组织） |

## 快速开始

### 启动工程模式
```
"启动工程模式"     # 创建新任务或恢复已有任务
"harness"           # 打开编排器面板
```

### 独立使用技能
```
"帮我写PRD：用户管理后台"
"生成SPEC"
"分析现有项目架构"
"实现代码"
"审查代码"
```

### 进度查询
```
"进度"             # 查看所有活跃任务状态
"下一步"           # 获取基于当前阶段的最优建议
"开发助手"         # 场景分析 + 技能推荐
```

## 典型开发链路

**完整工程链路：**
```
adfp-requirement-analyzer → adfp-prd-generator → adfp-spec-generator
  → adfp-architecture-designer → adfp-component-designer
  → adfp-code-implementer → adfp-code-reviewer
```

**快速原型链路（跳过文档）：**
```
adfp-architecture-designer → adfp-code-implementer
```

**审查修复循环：**
```
adfp-code-reviewer → adfp-code-implementer（修复模式）→ adfp-code-reviewer
```

**重构链路：**
```
adfa-code-context（理解）→ adfa-refactor-advisor（方案）→ adfp-code-implementer（执行）
```

## 项目结构

```
AgenticDevFlow/
├── AGENTS.md                       # 项目规范总纲
├── README.md                       # 本文件
├── LICENSE                         # MIT
├── package.json                    # npm 项目配置
├── .gitignore
├── docs/
│   ├── README.md                   # 技能文档索引
│   ├── skills/                     # 技能详情页（22 个 .md）
│   ├── workflows/{任务ID}/        # 工程模式产物（含 state.json）
│   └── skill-evaluation/           # 技能质量评估框架
└── skills/                         # 21 个技能（每个独立目录）
    ├── README.md                   # 技能注册中心（唯一索引源）
    ├── adfo-harness-runner/        # 编排器 + Harness CLI
    │   ├── SKILL.md
    │   ├── scripts/harness-cli.js  # 编译器 CLI
    │   ├── references/             # 状态管理、阶段注册等
    │   ├── templates/custom.md     # 共享配置主文件
    │   └── test/                   # CLI 测试（15 用例）
    ├── adfp-* (7)                  # 流水线技能
    ├── adfo-task-orchestrator/     # 任务级并发编排
    ├── adfa-* (8)                  # 辅助技能
    └── adft-* (4)                  # 工具技能
```

### 技能注册中心

`skills/README.md` — 所有技能的唯一索引源。`adfa-dev-helper` 和 `adfo-harness-runner` 从此读取映射关系，避免硬编码。

## 工程模式 vs 敏捷模式

| 维度 | 工程模式（harness） | 敏捷模式（独立技能） |
|------|-------------------|---------------------|
| 状态持久化 | ✅ `state.json` 唯一状态源 | ❌ 无 |
| 断点恢复 | ✅ checkpoint 自动恢复 | ❌ 每次全新开始 |
| 反馈循环 | ✅ blockers → 回退 → 修复 | ❌ 无 |
| 速度 | 慢（每阶段需确认） | 快（直接执行） |
| **执行模式** | **两阶模式**：CLI 编译前/后处理，LLM 只做内容 | **直接调用**：LLM 读 SKILL.md 全权执行 |
| 适用场景 | 正式项目、多阶段交付 | 快速原型、单点任务 |

**敏捷模式不涉及 CLI**：用户直接调用技能时，不执行 `harness-cli`，不读写 state.json，不校验产物。CLI 仅在工程模式下由 harness-runner 调度时使用。

两种模式互补：不确定方案时先用敏捷模式快速验证，确定后走工程模式正式交付。

## 许可证

[MIT](LICENSE)
