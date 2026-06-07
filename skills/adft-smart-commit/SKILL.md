---
name: adft-smart-commit
description: |
  智能 Git 提交助手，分析未提交的文件变更并自动选择最优提交策略。根据文件数量、类别多样性和变更复杂度，智能决定使用 Quick Commit（单提交）或 Batch Commit（多提交）。

  TRIGGER when: 用户有未提交变更并说 "commit", "smart commit", "batch commit", "organize commits", "分类提交", "智能提交", "提交代码"; 用户运行 git status 显示多个文件; 用户想要结构化提交。

  Use proactively when: 你注意到有未提交文件可以从组织化提交中受益。
---

# 智能 Git 提交助手

> 入口页。详细的分组策略和提交规范见 `references/commit-flow.md`。

智能分析未提交文件，自动选择最优提交策略，生成符合 Conventional Commits 规范的提交消息。

## 核心流程

### Phase 1: 分析变更

```bash
git status --porcelain
git diff --stat
```

收集以下指标：
- **文件数量** - 未提交文件总数
- **类别数量** - 涉及的类别数
- **复杂度评分** - 基于 diff 大小和跨文件依赖
- **特殊 Artifacts 存在性** - 是否包含项目规划/实现 artifacts（如 BMad、specs 等）

### Phase 2: 选择策略

| 文件数 | 类别数 | 复杂度 | 策略 |
|--------|--------|--------|------|
| 1-3 | 单一 | 低 | Quick Commit |
| 1-5 | 单一 | 中 | Quick Commit |
| 4-15 | 2-3 | 低-中 | Batch Commit |
| 6-20 | 3-5 | 中 | Batch Commit |
| 15+ | 4+ | 高 | Batch Commit |
| 任意 | 含特殊artifact | 任意 | Batch Commit |

**Quick Commit 条件**（需全部满足）：
1. 文件属于同一类别
2. 文件逻辑相关（同一功能/模块）
3. 总 diff 行数 < 300
4. 无特殊 artifacts（如 BMad、specs）混入
5. 意图单一明确（feat/fix/style/docs）

**Batch Commit 条件**（满足任一）：
1. 文件跨 2+ 类别
2. 存在特殊 artifacts（如 BMad 规划文件）
3. 文件数 > 10
4. 不相关变更（不同功能）
5. 用户明确要求组织化

### Phase 3: 分类文件

按优先级排序：

1. **Infrastructure** - 配置、依赖、构建工具
2. **Core Source** - 业务逻辑、服务、stores
3. **Components** - UI 组件（按模块）
4. **Styles** - CSS、主题文件
5. **Tests** - 测试文件
6. **Documentation** - README、文档
7. **Project Artifacts** - 规划/实现 artifacts（BMad、specs 等，按项目配置）

### Phase 4: 生成提交

遵循 Conventional Commits 格式：

```
<type>(<scope>): <description>
```

**类型定义：**

| 类型 | 用途 | 示例 |
|------|------|------|
| `feat` | 新功能 | feat(editor): add toolbar |
| `fix` | Bug 修复 | fix(store): correct update logic |
| `docs` | 文档 | docs(readme): update install guide |
| `style` | 样式 | style: add theme variables |
| `refactor` | 重构 | refactor(hooks): extract logic |
| `test` | 测试 | test(editor): add unit tests |
| `chore` | 维护 | chore(deps): upgrade packages |

### Phase 5: 执行提交

对每个分组：
1. 暂存文件：`git add <files>`
2. 创建提交
3. 记录提交日志

### Phase 6: 输出报告

生成格式化的提交摘要。

---

## 文件分类规则

> **项目特有路径映射**由 `templates/custom.md` 统一管理。以下为通用分类规则框架：

```
Source Code (按目录结构自动推断 scope):
├── src/**/*.ts(x)        → feat/code
├── src/**/store/         → feat(store)
├── src/**/hooks/         → feat(hooks)
├── src/**/styles/        → style

Configuration:
├── package.json          → chore(deps)
├── *.config.{js,ts,mjs}  → chore(config)
└── tsconfig*.json        → chore(config)

Tests:
├── **/*.test.ts(x)       → test(module)
├── **/*.spec.ts          → test(module)
└── e2e/                  → test(e2e)

Documentation:
├── README.md             → docs
├── docs/                 → docs
└── CLAUDE.md             → docs(claude)
```

具体的项目路径映射（如 `src/main/`、`src/renderer/` 等 Electron 路径、BMad artifact 路径等）在 `templates/custom.md` 中配置。

---

## 特殊处理

### 特殊 Artifacts

按类型分开提交（具体路径规则见 `templates/custom.md`）：

```
docs(planning): update PRD and architecture
feat(story): implement basic feature flow
chore(sprint): update sprint status
docs(retro): add retrospective notes
```

### 组件分组

相关文件一起提交：
- 组件 + CSS 模块 + 测试 → 一个提交
- 示例：`Button.tsx`, `Button.module.css`, `Button.test.tsx`

### 大型 Diffs

文件变更 >500 行时：
- 考虑拆分（如逻辑可分离）
- 添加详细 body 说明
- 引用相关 issues/PRs

---

## 输出格式

### Quick Commit 输出

```
=== Smart Commit Analysis ===

Strategy: Quick Commit (single category, low complexity)

Files: 3 modified
Category: Components (editor module)
Complexity: Low (45 lines changed)

---
Creating commit...

✓ feat(editor): add toolbar buttons for text formatting

=== Summary ===
Created 1 commit from 3 files
```

### Batch Commit 输出

```
=== Smart Commit Analysis ===

Strategy: Batch Commit (multiple categories, medium complexity)

Found 47 uncommitted files across 8 categories:

Infrastructure (3 files):
  - package.json, package-lock.json, tsconfig.json

Core Source (8 files):
  - src/main/services/note.service.ts
  - src/renderer/store/note.store.ts
  ...

Components (12 files):
  - src/renderer/components/modules/editor/EditorPane.tsx
  ...

---
Creating commits...

✓ chore(deps): upgrade React to 19.2.0
✓ feat(store): implement note state management
✓ feat(editor): add EditorPane and EditorToolbar
✓ style: define design system variables
✓ test(store): add note store unit tests

=== Summary ===
Created 5 commits from 47 files
```

---

## 使用示例

**场景 1: 简单提交**
```
用户: "commit"（有 2-3 个相关文件）
→ Quick Commit: feat(editor): add EditorPane component
```

**场景 2: 批量提交**
```
用户: "smart commit" 或 "分类提交"（有很多文件）
→ Batch Commit: 分析、分类、生成多个提交
```

**场景 3: 策略覆盖**
```
用户: "把这些改动分成多个提交"
→ 强制使用 Batch Commit
```

---

## 注意事项

1. **分析优先** - 先理解变更再提交
2. **语义准确** - 提交消息反映真实意图
3. **相关聚合** - 相关文件一起提交
4. **不相关分离** - 不同功能分开提交
5. **中文描述** - 输出报告使用中文

---

## 职责边界

| 技能 | 边界 |
|------|------|
| adfo-harness-runner | harness-runner 管理**流水线阶段**和状态转换，adft-smart-commit 管理**Git 提交**的组织和生成 |
| adfa-dev-helper | dev-helper 做开发进度和场景分析，adft-smart-commit 处理具体的 Git 提交操作 |
| adfp-code-reviewer | code-reviewer 审查代码质量，adft-smart-commit 在审查通过后组织代码提交 |

## 模板注入

> 本技能为独立工具（adft-），不接入 adfo-harness-runner 的流水线共享配置。
`templates/custom.md` — 本技能特有的项目路径映射、artifact 规则、分类优先级配置
