# AgenticDevFlow

基于 Claude Code 的前端工程化能力平台，通过 19 个可编排 AI 技能覆盖从需求分析到代码审查的完整开发生命周期。

## 核心概念

AgenticDevFlow 将前端开发流程标准化为 **INIT → ANALYZE → PRD → SPEC → ARCHITECTURE → DESIGN → IMPLEMENT → REVIEW → DONE** 九个阶段，每个阶段由专用 AI Skill 驱动。技能间通过 DAG 依赖图编排，支持正向交付流水线和反向反馈循环。

## 技能体系

### 命名规范

所有技能统一使用 `adf`（**A**gentic**D**ev**F**low）作为项目前缀，按类型定义二级前缀：

| 类型 | 前缀 | 含义 | 示例 |
|------|------|------|------|
| 流水线 | `adfp-` | Pipeline，正向交付流水线 | `adfp-code-implementer` |
| 编排 | `adfo-` | Orchestration，流程调度管理 | `adfo-harness-runner` |
| 辅助 | `adfa-` | Assistance，辅助分析/建议 | `adfa-brainstorm` |
| 工具 | `adft-` | Tool，独立工具不参与流水线 | `adft-smart-commit` |

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

### 辅助技能（7 个）
支持流水线各阶段，可按需在任意阶段调用：

| 技能 | 职责 |
|------|------|
| `adfa-dev-helper` | 只读顾问：进度速览、场景分析、下一步建议 |
| `adfa-brainstorm` | 创意头脑风暴引导 |
| `adfa-code-context` | 代码上下文理解与调用链追踪 |
| `adfa-critical-explorer` | 6 维度并发批判性方案评审 |
| `adfa-edge-case-master` | 边界/异常/压力测试用例生成 |
| `adfa-hooks-extractor` | 深度扫描可复用 Hook 逻辑 |
| `adfa-refactor-advisor` | 代码重构方案与前后对照代码 |

### 工具技能（3 个）
独立工具，不参与流水线：

| 技能 | 职责 |
|------|------|
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
├── .claude/                        # Claude Code 配置
│   └── skills/                     # 技能定义（19 个 SKILL.md）
│       ├── README.md               #   技能注册中心（唯一索引源）
│       ├── adfp-code-implementer/  #   流水线 - 代码生成器
│       ├── adfp-code-reviewer/     #   流水线 - 代码审查器
│       ├── adfo-harness-runner/    #   编排 - 流水线编排器
│       └── ...                     #   其他 16 个技能
├── docs/                           # 项目文档
│   ├── skills/                     #   技能详情文档（每个技能一个 .md）
│   ├── workflows/                  #   工作流记录（含 PRD/SPEC/DESIGN 等）
│   └── skill-evaluation/           #   技能质量评估框架
```

## 工程模式 vs 敏捷模式

| 维度 | 工程模式 | 敏捷模式 |
|------|---------|---------|
| 状态持久化 | state.json | 无 |
| 断点恢复 | checkpoint | 每次全新开始 |
| 反馈循环 | blockers → 回退 | 无 |
| 适用场景 | 正式项目 | 快速原型、单点任务 |

两种模式互补：不确定方案时先用敏捷模式快速验证，确定后走工程模式正式交付。

## 许可证

[Apache License 2.0](LICENSE)
