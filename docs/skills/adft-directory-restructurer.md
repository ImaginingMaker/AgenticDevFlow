# adft-directory-restructurer

> 前端目录结构重塑专家。按前端最佳实践（按层/按功能/原子化设计）自动重组杂乱目录结构，并同步更新所有文件的 import/require 路径引用。不修改任何业务逻辑，仅做物理文件移动和引用路径修正。

---

## 基本信息

| 属性 | 值 |
|------|-----|
| **名称** | adft-directory-restructurer |
| **类型** | 工具 |
| **前缀** | adft- |
| **触发词** | `目录重塑`、`目录整理`、`重组目录`、`restructure directory`、`重新组织文件结构`、`整理项目目录`、`目录太乱了`、`梳理目录结构`、`reorganize files`、`目录重构` |
| **文件位置** | skills/adft-directory-restructurer/SKILL.md |
| **代码行数** | 323 行 |

---

## 核心特性

### 8 步重塑流程

```
扫描 → 分析 → 推荐方案 → 用户确认 → 执行重塑 → 更新引用 → 验证 → 输出报告
```

### 4 种目录结构模式

| 模式 | 适用场景 | 说明 |
|------|---------|------|
| **按层 (Layer-based)** | 中小型项目 | components/、pages/、hooks/、services/、utils/ |
| **按功能 (Feature-based)** | 中大型项目 | features/auth/、features/dashboard/，模块自包含 |
| **原子化 (Atomic)** | 组件库/UI 项目 | atoms/、molecules/、organisms/、templates/ |
| **自定义** | 有特殊规范的项目 | 用户提供任意目录映射规则 |

### 全类型引用更新

| 引用类型 | 处理方式 |
|---------|---------|
| 相对路径 import | 重新计算相对路径 |
| 别名路径 import | 更新文件路径并同步 tsconfig paths |
| CSS/SASS @import | 重新计算相对路径 |
| dynamic import | 同上 |
| require() | 同上 |
| barrel export | 更新索引文件中的导出路径 |
| 资源引用（img:src 等） | 重新计算相对路径 |

### 安全机制

- **用户确认**：执行前展示完整影响分析
- **先复制后删除**：copy → verify → delete 模式
- **入口文件保护**：package.json main/module/browser 默认不移动
- **可回滚建议**：推荐使用 Git 提交当前状态后再执行

---

## 使用方式

```
# 快速交互
"目录重塑" → 引导式询问目录和模式偏好

# 指定目录+模式
"把 src/ 按功能模块重组"
"将 src/utils 目录按原子化整理"

# 仅生成计划不执行
"目录重塑预览 — 只生成计划"

# 自定义规则
"把 helpers/ 归入 utils/, api/ 归入 services/"
```

---

## 依赖关系

### 上游依赖（本技能依赖谁）

| 技能 | 关系类型 | 说明 |
|------|---------|------|
| 无 | 独立触发 | 本技能为 adft- 独立工具，不依赖其他技能 |

### 下游消费（谁依赖本技能）

| 技能 | 关系类型 | 说明 |
|------|---------|------|
| 无 | 直接执行 | 目录重塑直接作用于文件系统，不产生下游技能依赖的产物 |

### 可选输入

| 来源 | 关系类型 | 说明 |
|------|---------|------|
| adfp-architecture-designer | 可选输入 | architecture 产出的 `architecture.md` 文件层级蓝图可作为本技能的映射规则参考 |

### 建议下游

| 技能 | 场景 |
|------|------|
| adft-smart-commit | 重塑完成后，建议使用 smart-commit 组织 Git 提交 |
| adfp-code-reviewer | 重塑完成后，建议运行 code-reviewer 检查引用完整性 |

---

## 流程生命周期

### 触发条件

- **手动触发**：用户说"目录重塑"、"目录整理"、"重组目录"、"reorganize files" 等
- **可选输入**：adfp-architecture-designer 产出的 architecture.md 可作为映射规则参考

### 生命周期图

```
用户触发 / 指定目录+模式
        ↓
┌─────────────────────────────────────────────────┐
│          adft-directory-restructurer               │
│                                                   │
│  1. 目录扫描与依赖映射                             │
│     ├─ 递归扫描所有文件                            │
│     ├─ 解析 import/require 语句                    │
│     ├─ 构建依赖关系图                              │
│     ├─ 检测 tsconfig alias / 构建配置              │
│     └─ 识别入口文件（package.json main）            │
│              ↓                                    │
│  2. 结构分析与推荐方案                             │
│     ├─ 按层模式 / 按功能模式 / 原子化 / 自定义     │
│     └─ 输出推荐目录结构                            │
│              ↓                                    │
│  3. 生成映射表（旧路径 → 新路径 + 原因）           │
│              ↓                                    │
│  4. 用户确认                                      │
│     ├─ [确认] → 执行                              │
│     ├─ [预览+调整] → 手动调整后执行               │
│     ├─ [仅生成计划] → 输出 restructure-plan.md    │
│     └─ [取消] → 终止                              │
│              ↓                                    │
│  5. 执行重塑                                      │
│     ├─ 创建目标目录结构                            │
│     ├─ copy → verify → delete 移动文件             │
│     └─ 更新所有引用路径                            │
│              ↓                                    │
│  6. 验证                                          │
│     ├─ 文件完整性（md5 对比）                      │
│     ├─ 无残留旧引用                                │
│     ├─ 别名同步检查                                │
│     └─ 建议构建验证                                │
│              ↓                                    │
│  7. 输出报告                                      │
│     └─ 概览 + 结构对比 + 映射明细 + 验证结果       │
└─────────────────────────────────────────────────┘
        ↓
  目录结构已重塑 + 引用已更新
        ↓
  建议: adft-smart-commit / adfp-code-reviewer
```

### 在完整流水线中的位置

本技能为独立工具（adft-），**不参与**前端开发流水线。可在任意阶段独立调用，特别适合在：

- `ARCHITECTURE` 阶段之后，根据 architecture 输出的蓝图执行物理重组
- `REVIEW` 阶段发现问题后，在 `adfa-refactor-advisor` 重构代码前先整理目录结构
- 项目初始化后，对脚手架生成的默认目录结构进行规范化

### 产物状态

| 产物 | 路径 | 状态流转 |
|------|------|---------|
| 目录结构变更 | 目标目录 | 重塑前 → 重塑后（文件系统级变更） |
| 引用更新 | 源代码文件 | 旧路径 → 新路径（import/require 语句修改） |
| 配置文件变更 | tsconfig.json 等 | 别名映射同步更新 |
| 重塑报告 | `restructure-plan.md` / 当前对话 | 创建 → 展示 → 存档 |
| 备份 | `.restructure-backup/` | 创建 → 可选删除 |

---

## 工作流程

### 交互式流程

```
用户触发 → 询问目标目录
         → 询问规范模式（按层/按功能/原子化/自定义）
         → 扫描分析 + 生成映射表
         → 展示影响分析 → 用户确认
         → 执行重建 / 仅输出计划 / 用户调整后执行
         → 输出报告
```

### 非交互式流程

```
"按层模式重塑 /Users/me/project/src，确认执行"
→ 跳过询问，直接扫描→分析→执行→报告
```

---

## 与现有技能的职责边界

| 技能 | 关系 | 区分 |
|------|------|------|
| **adfp-architecture-designer** | 互补 | architecture 输出**文件层级蓝图**（纸上规划），本技能**物理执行**目录重组和引用修正 |
| **adfa-refactor-advisor** | 互补 | refactor 重组**代码内部结构**（组件/逻辑重组），本技能重组**文件物理位置**（目录结构重组）|
| **adfp-code-implementer** | 无关 | implementer 生成新代码，本技能重塑已有目录结构 |
| **adft-smart-commit** | 建议下游 | 目录重塑完成后，建议使用 smart-commit 组织提交 |
| **adft-page-wiki-generator** | 无关 | 两者都是 adft- 独立工具，互不依赖 |

### 边界说明

```
adfa-refactor-advisor: "这段代码太乱了，需要结构重构"
    → 重组组件内部逻辑、拆分文件内容
adft-directory-restructurer: "项目目录太乱了，需要整理"
    → 重组文件物理位置、目录层级、更新引用路径

adfp-architecture-designer: "帮我规划新项目的文件结构"
    → 新项目/新功能模块的结构设计
adft-directory-restructurer: "帮我整理现有目录"
    → 已有代码的目录结构调整与引用同步
```

---

## 约束规则

1. **不修改业务逻辑** — 仅移动文件和更新引用路径。代码内容保持不变（除 import 路径外）
2. **安全第一** — 执行前必须展示影响分析并等待用户确认；支持 `--dry-run`（仅输出计划）
3. **先复制后删除** — 文件移动采用 copy → verify → delete 模式，降低数据丢失风险
4. **非侵入** — 不修改 node_modules、dist、.git 等无关目录
5. **全引用覆盖** — 必须处理相对路径、别名、CSS import、dynamic import、require、barrel export、资源引用
6. **别名相关** — tsconfig.json paths 和构建工具 resolve.alias 需同步更新（若结构变化涉及别名映射）
7. **入口文件保护** — package.json main/module/browser、路由入口文件不得默认移动，除非用户明确指定
8. **可回滚** — 若用户通过 Git 管理，建议先提交当前状态，再执行重塑
9. **按层/按功能/原子化**三种模式为内置标准模式，用户也可提供自定义映射规则
10. **目标目录验证** — 执行前检测目标目录是否存在 `package.json`，若不存在则询问确认（可能是非前端项目）

---

## 模板注入

> 本技能为独立工具（adft-），不接入 adfo-harness-runner 的流水线共享配置。

### 配置文件

`templates/custom.md` — 目录结构映射规则、忽略模式、别名配置偏好、执行策略参数

### 可配置参数

| 参数 | 说明 |
|------|------|
| `move_strategy` | 文件移动策略：`copy_delete` / `git_mv` / `dry_run` |
| `backup_enabled` | 是否启用备份 |
| `backup_dir` | 备份目录名称 |
| `reference_scope` | 引用更新范围：`project` / `changed_only` / `manual` |
| `protected_paths` | 受保护不自动移动的入口文件列表 |
| `ignore_patterns` | 忽略不处理的文件模式 |

---

## 测试用例

详见 `skills/adft-directory-restructurer/test/evals.md`。

### 测试场景概览

| 场景 | 验证点 |
|------|--------|
| 单文件移动到新目录 | 引用路径是否正确更新 |
| 批量目录重组（按层模式） | 所有引用是否一致更新 |
| 别名路径项目（@utils 等） | tsconfig 别名是否同步更新 |
| 无变化项目（已符合规范） | 报告无变更 |
| CSS/资源引用 | 非 TS 引用是否正确处理 |
| 跨目录循环依赖 | 重塑后引用是否仍正确 |
| 自定义映射模式 | 用户规则是否能覆盖默认 |
