# Skills 技能索引

本项目包含 21 个自定义 Claude Code 技能，覆盖前端开发的完整生命周期——从需求到代码、从设计到审查，以及独立开发工具。

---

## 技能分类

### 流水线技能（7 个，按阶段顺序）

| # | 技能 | 阶段 | 核心职责 | 详情 |
|---|------|------|---------|------|
| 1 | **adfp-requirement-analyzer** | ANALYZE | 需求多维度协同分析（PRD前置澄清） | [查看](./adfp-requirement-analyzer.md) |
| 2 | **adfp-prd-generator** | PRD | 产品需求文档生成 | [查看](./adfp-prd-generator.md) |
| 3 | **adfp-spec-generator** | SPEC | 技术规格（页面架构+数据模型+API+路由） | [查看](./adfp-spec-generator.md) |
| 4 | **adfp-architecture-designer** | ARCHITECTURE | 架构分析（SubAgent扫描/文件层级规划） | [查看](./adfp-architecture-designer.md) |
| 5 | **adfp-component-designer** | DESIGN | 组件设计（含视觉设计方向） | [查看](./adfp-component-designer.md) |
| 6 | **adfp-code-implementer** | IMPLEMENT | 代码生成（含美学实现规范） | [查看](./adfp-code-implementer.md) |
| 7 | **adfp-code-reviewer** | REVIEW | 7维度审查+Git模式+加权评分+直接修复 | [查看](./adfp-code-reviewer.md) |

### 编排技能（2 个）

管理流程调度与任务执行。

| 技能 | 核心职责 | 详情 |
|------|---------|------|
| **adfo-harness-runner** | 工程化流水线编排+状态管理（阶段级编排） | [查看](./adfo-harness-runner.md) |
| **adfo-task-orchestrator** | 通用 DAG 任务编排执行器（任务级编排，基础设施） | [查看](./adfo-task-orchestrator.md) |

### 辅助技能（8 个）

| 技能 | 核心职责 | 详情 |
|------|---------|------|
| **adfa-brainstorm** | 创意头脑风暴引导器 | [查看](./adfa-brainstorm.md) |
| **adfa-code-context** | 代码上下文理解（追踪调用链+数据流） | [查看](./adfa-code-context.md) |
| **adfa-critical-explorer** | 6 维度并发批判性方案评审（设计阶段） | [查看](./adfa-critical-explorer.md) |
| **adfa-dev-helper** | 只读顾问：进度速览、场景分析、下一步建议 | [查看](./adfa-dev-helper.md) |
| **adfa-edge-case-master** | 测试用例生成（边界/异常/压力） | [查看](./adfa-edge-case-master.md) |
| **adfa-hooks-extractor** | Hooks 提取分析（深度扫描内联逻辑） | [查看](./adfa-hooks-extractor.md) |
| **adfa-refactor-advisor** | 代码重构专家（问题识别+重构方案+对照代码） | [查看](./adfa-refactor-advisor.md) |
| **adfa-ux-interaction-checker** | UX/UI 交互缺陷检查（10 维度系统化扫描） | [查看](./adfa-ux-interaction-checker.md) |

### 工具技能（4 个）

| 技能 | 核心职责 | 详情 |
|------|---------|------|
| `adft-skill-creator` | 创建以 adf 为前缀的 Claude Code 技能 | [查看](./adft-skill-creator.md) |
| `adft-page-wiki-generator` | 页面关键链路分析+Wiki自动生成 | [查看](./adft-page-wiki-generator.md) |
| `adft-smart-commit` | 智能 Git 提交助手（Quick/Batch策略） | [查看](./adft-smart-commit.md) |
| `adft-directory-restructurer` | 前端目录结构重塑（目录重组+引用更新） | [查看](./adft-directory-restructurer.md) |

> **前缀说明**：本项目所有技能统一使用 `adf`（AgenticDevFlow）作为项目前缀，按类型分四级：`adfp-`（流水线）、`adfo-`（编排）、`adfa-`（辅助）、`adft-`（工具）。详见 [AGENTS.md](../../AGENTS.md) §技能命名规范。

---

## 完整开发链路

```
adfp-requirement-analyzer → adfp-prd-generator → adfp-spec-generator → adfp-architecture-designer
    → adfp-component-designer → adfp-code-implementer → adfp-code-reviewer
```

所有阶段由 **adfo-harness-runner** 统一编排，提供状态持久化和断点恢复。

## 快速原型链路（跳过文档）

```
adfp-architecture-designer（分析复用）→ adfp-code-implementer
```

## 代码审查+修复循环

```
adfp-code-reviewer → adfp-code-implementer（修复模式）→ adfp-code-reviewer
```

## 重构链路

```
adfa-code-context（理解）→ adfa-refactor-advisor（方案）→ adfp-code-implementer（执行）
```

---

## 工程模式 vs 敏捷模式

| 维度 | 工程模式（harness） | 敏捷模式（独立技能） |
|------|-------------------|---------------------|
| 状态持久化 | ✅ state.json | ❌ 无 |
| 断点恢复 | ✅ checkpoint | ❌ 每次全新 |
| 反馈循环 | ✅ blockers → 回退 | ❌ 无 |
| 速度 | 慢（每阶段确认） | 快（直接执行） |
| 适用 | 正式项目 | 快速原型、单点任务 |

两种模式互补：不确定方案时先用敏捷模式快速验证，确定后走工程模式正式交付。

---

## 技能职责边界

| 边界 | ANALYZE 止于 | PRD 负责 |
|------|-------------|---------|
| 需求分析 | 背景+链路+任务计划 | 用户故事+功能清单+验收标准 |
| Brainstorm→Analyze | 发散探索（adfa-brainstorm） | 结构化收敛（adfp-requirement-analyzer） |

| 边界 | SPEC 止于 | DESIGN 负责 |
|------|----------|-------------|
| 组件树 | 页面→区块映射 | 展开详细叶子组件 |
| 状态 | 分层策略 | 具体状态变量+初始值 |
| 目录 | 不定义 | ARCHITECTURE 负责 |

| 边界 | ARCHITECTURE 止于 | HARNESS 负责 |
|------|-------------------|-------------|
| 实施顺序 | 输出依赖图 | 拓扑排序+分阶段计划 |
| Hooks 分析 | 盘点已有 Hooks | —（adfa-hooks-extractor 做深度提取） |
| Reviewer→Refactor | 诊断问题+分级（adfp-code-reviewer） | 治疗+重构方案+对照代码（adfa-refactor-advisor） |

---

## 快速使用

### 启动工程模式

```bash
"启动工程模式"      # 创建新任务或继续已有任务
"harness"            # 打开编排器
```

### 独立使用技能

```bash
"帮我写PRD：用户管理后台"
"生成SPEC" 
"分析现有项目架构"
"帮我设计这个页面"
"实现代码"
"审查代码"
```

### 进度查询

```bash
"进度"              # 查看所有活跃任务
"下一步"            # 获取下一步建议
"开发助手"          # 场景分析+技能推荐
```

---

## 技能开发规范

### 命名规范
- 所有技能以 `adf`（AgenticDevFlow）开头，按类型选择二级前缀
- 格式：`adf<type>-<功能描述>`，type 为 `p`(流水线) / `o`(编排) / `a`(辅助) / `t`(工具)
- 使用小写字母和连字符

### 文件结构
```
skills/adf<type>-<name>/
├── SKILL.md              # 主文件 (<500行)
├── references/           # 参考文档 (>300行需目录)
├── templates/
│   └── custom.md         # 技能特有模板
└── test/                 # 测试用例
```

### 文档同步（强制）

**每次修改 SKILL.md 必须同步更新 `docs/skills/` 中对应文档。** 详情见 `AGENTS.md` §文档同步规则。

### 文档结构
```
docs/skills/
├── README.md              # 技能索引（本文件）
├── adfp-requirement-analyzer.md  # ANALYZE 技能详情
├── adfp-prd-generator.md    # PRD 技能详情
├── adfp-spec-generator.md   # SPEC 技能详情
├── ...（每个技能一个 .md）
├── adfa-dev-helper.md
└── adfa-refactor-advisor.md   # 重构技能详情
```

### 添加新技能

1. 遵循 `AGENTS.md` 技能基准规范
2. 在 `skills/` 创建技能目录
3. 编写 `SKILL.md` 主文件（含 front-matter）
4. 创建 `templates/custom.md`（技能特有配置）
5. 添加 `test/` 测试用例
6. 在 `docs/skills/` 创建详情文档
7. 更新本索引文件
