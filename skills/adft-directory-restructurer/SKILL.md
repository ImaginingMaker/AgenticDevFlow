---
name: adft-directory-restructurer
description: "前端目录结构治理专家。双模式架构：1) 规范预设模式——实施前按可配置规则引擎创建符合规范的目录骨架，强制执行类型隔离（组件/Hooks/服务/工具分目录）、平级限制（index文件不得与非index平级）、命名规范、深度限制。2) 审查模式——扫描现有目录检测违规项，按规则执行目录重塑并更新所有引用路径。TRIGGER: 用户说'目录重塑'、'目录整理'、'重组目录'、'restructure directory'、'整理项目目录'、'目录太乱了'、'梳理目录结构'、'目录重构'、'设置目录结构'、'预设目录'、'创建目录骨架'、'目录预处理'、'检查目录'、'目录合规'、'目录审查'。Use proactively when: 实施前需要创建结构化的目录骨架（预设模式）；已有目录需要检查规范符合度或执行目录重组修复（审查模式）。"
---

# 前端目录结构治理专家

> 双模式入口。规范预设模式（Preset）详情见 `references/preset-flow.md`；审查模式（Review）详情见 `references/restructure-flow.md`。规则引擎配置见 `templates/custom.md`。

Dual-mode：实施前**预设**目录骨架（Preset）+ 现有目录**审查**与重塑（Review）。

---

## 模式路由

```
用户触发 → 意图识别：
  ├─ "创建"、"预设"、"搭建"、"建目录"、"设置目录"、"目录骨架" → Mode A: 规范预设模式
  │     ├─ 有 architecture.md → 读取文件层级蓝图
  │     ├─ 有模块清单 → 直接使用
  │     └─ 无输入 → 交互式询问模块列表
  │
  └─ "重组"、"重塑"、"整理"、"检查"、"合规"、"太乱" → Mode B: 审查模式
        ├─ 指定目录路径 → 扫描该目录
        └─ 无参数 → 默认可选: src/ / components/ / 当前项目根目录

规则引擎: 两个模式共用 templates/custom.md 中的规则集配置
```

---

## 规则引擎

两个模式共用同一套规则配置，存放在 `templates/custom.md`。规则引擎包含 4 个维度的可配置规则：

| 维度 | 说明 | 示例规则 |
|------|------|---------|
| **命名规则** | 目录/文件的命名规范 | 组件目录 `PascalCase`、非组件目录 `camelCase` |
| **类型隔离** | 不同文件类型分到独立目录 | `components/` 只放 `.tsx/.jsx`；`hooks/` 只放 `use*.ts` |
| **平级限制** | 入口文件与实现文件的同目录限制 | `index.tsx` 所在目录不得有非 index 的平级文件 |
| **深度限制** | 目录嵌套深度上限 | `src/` 下嵌套不超过 3 层 |

> 用户可通过 `templates/custom.md` 自定义规则集。Preset 和 Review 模式在应用规则时共享同一套校验逻辑。

---

## Mode A：规范预设模式（Preset）

> 详细流程见 `references/preset-flow.md`。

**定位**：在 IMPLEMENT 阶段之前，根据 architecture.md 的文件层级蓝图和规则引擎配置，创建符合规范的目录骨架。

**核心流程**：

```
读取输入 → 加载规则集 → 生成目录蓝图 → 创建目录骨架 → 校验 → 输出结构计划
```

| 步骤 | 说明 |
|------|------|
| **A1 读取输入** | 工程模式：读取 `state.json.techStack` + `architecture.md` 文件层级；敏捷模式：用户指定框架类型 + 模块清单 |
| **A2 加载规则集** | 从 `templates/custom.md` 读取命名规则、类型隔离、平级限制、深度限制规则 |
| **A3 生成目录蓝图** | 应用规则集将文件层级转为精确目录树，校验平级限制等硬约束 |
| **A4 创建目录骨架** | 按蓝图创建空目录（含 `.gitkeep`），不生成任何代码文件 |
| **A5 规范校验** | 对现有目录（如有）执行规范检查，输出违规项 |
| **A6 输出** | `structure-plan.md`（蓝图 + 已创建目录清单 + 校验结果） |

**输入源**：

| 模式 | 输入 |
|------|------|
| 工程模式（通过 harness） | `docs/workflows/{任务ID}/architecture.md` + `state.json.techStack` |
| 敏捷模式（直接调用） | 用户描述（框架 + 模块列表） |

**产物路径**：

| 模式 | 路径 |
|------|------|
| 工程模式 | `docs/workflows/{任务ID}/structure-plan.md` |
| 敏捷模式 | `./structure-plan.md` |

---

## Mode B：审查模式（Review）

> 详细流程见 `references/restructure-flow.md`。

**定位**：扫描现有目录检测违规项，生成映射表，用户确认后执行目录重塑并更新所有引用路径。

**核心流程**：

```
扫描与分析 → 规范校验 → 生成映射表 → 用户确认 → 执行重塑 → 验证 → 输出报告
```

| 步骤 | 说明 |
|------|------|
| **B1 目录扫描与依赖映射** | 递归扫描文件、解析 import 关系、构建依赖图、检测配置引用、识别入口文件 |
| **B2 规范校验** | 应用规则引擎 4 维度检查：命名规则、类型隔离、平级限制、深度限制。输出违规清单 |
| **B3 生成映射表** | 按规则和用户选择模式（按层/按功能/原子化/自定义）生成旧→新路径映射表 |
| **B4 用户确认** | 展示影响分析（移动数 + 引用更新数 + 配置修改 + 风险项），用户选择确认/预览/取消/仅计划 |
| **B5 执行重塑** | 创建目标目录 → 先复制后删除 → 更新所有引用路径（import/require/CSS/资源） |
| **B6 验证** | 文件完整性 MD5、无残留旧引用、别名同步、构建验证（建议）、Git 对比 |
| **B7 输出报告** | `restructure-report.md`（结构对比 + 映射明细 + 引用更新 + 验证结果） |

**内置规范模式**：

| 模式 | 适用场景 | 核心原则 |
|------|---------|---------|
| **按层(Layer-based)** | 中小型项目 | `components/` `pages/` `hooks/` `services/` 等 |
| **按功能(Feature-based)** | 中大型项目 | 每个功能模块自包含：`features/auth/` |
| **原子化(Atomic)** | 组件库/UI 项目 | `atoms/` `molecules/` `organisms/` |
| **自定义** | 有特殊规范的项目 | 用户提供目录映射规则 |

---

## 约束规则

1. **Preset 模式**：只创建目录骨架，不生成任何代码文件。不修改现有文件
2. **Review 模式**：不修改业务逻辑，仅移动文件和更新引用路径。代码内容保持不变（除 import 路径外）
3. **安全第一** — Review 模式执行前必须展示影响分析并等待用户确认；支持 `--dry-run`（仅输出计划）
4. **先复制后删除** — Review 模式文件移动采用 copy → verify → delete 模式
5. **非侵入** — 不修改 `node_modules`、`dist`、`.git` 等无关目录
6. **全引用覆盖** — Review 模式必须处理相对路径、别名、CSS import、dynamic import、require、barrel export、资源引用
7. **入口文件保护** — `package.json` main/module/browser、路由入口文件不得默认移动
8. **可回滚** — 若用户通过 Git 管理，建议先提交当前状态，再执行重塑
9. **平级限制是硬约束** — Preset 模式生成蓝图时必须校验，Review 模式检测时必须报告

---

## 职责边界

### 双模式内部边界

```
Mode A (Preset): "帮我搭建项目目录结构" → 创建骨架，不移动已有文件
Mode B (Review): "项目目录太乱了，帮我整理" → 分析+移动+更新引用
```

### 与外部技能的边界

| 技能 | Mode A 关系 | Mode B 关系 |
|------|------------|------------|
| `adfp-architecture-designer` | **上游输入** — 消费 `architecture.md` 的文件层级蓝图 | **互补** — architecture 纸上规划，本技能物理执行 |
| `adfp-code-implementer` | **下游消费** — implementer 在创建的目录骨架中写入代码 | **无关** — 重塑已有目录，不影响新代码生成 |
| `adfa-refactor-advisor` | 无关 | **互补** — refactor 重组代码逻辑，restructurer 重组文件位置 |
| `adft-smart-commit` | 建议下游（推荐） | 建议下游 — 重塑完成后组织提交 |

### 参考路径

```
需求 → SPEC → ARCHITECTURE(输出文件层级蓝图)
  → 【Preset】创建目录骨架 → DESIGN → 【Implementer】写代码
  → 【Review】审查目录合规性 → 修复 → 提交

已有项目混乱 → 【Review】扫描+检测+重塑+更新引用
```

---

## 使用方式

### Mode A: 规范预设模式

```bash
# 交互式
"预设目录结构"            → 询问模块清单和框架
"帮我创建项目骨架"        → 交互式引导

# 带参快速启动
"预设 用户模块,订单模块 React 18 的目录结构"
"为我的 Next.js 项目搭建 components/hooks/services 骨架"

# 工程模式集成（由 harness-runner 在 IMPLEMENT 前调用）
"在实施前预设目录结构，读取 docs/workflows/{taskId}/architecture.md"
```

### Mode B: 审查模式

```bash
# 交互式
"目录重塑"                → 询问目标目录和模式偏好
"检查目录合规"           → 默认扫描 src/，报告违规项

# 指定参数
"把 src/ 按功能模块重组，并执行"
"检查 src/ 的目录结构合规性"
"将 src/utils 目录按原子化整理"

# 仅生成计划
"目录重塑预览 — 只生成计划不执行"

# 自定义模式
"把 helpers/ 归入 utils/, api/ 归入 services/"
```

---

## 模板注入

> 本技能为独立工具（adft-），不接入 `adfo-harness-runner` 的流水线共享配置。

`templates/custom.md` — 规则引擎核心配置（命名规则、类型隔离、平级限制、深度限制）及执行偏好

---

## 测试用例

详见 `test/evals.md`。

### 测试场景概览

| # | 模式 | 场景 | 验证点 |
|---|------|------|--------|
| 1 | Preset | 从 architecture.md 生成目录骨架 | 平级限制、类型隔离规则正确应用 |
| 2 | Preset | 用户指定模块清单 | 目录树完整，命名规则正确 |
| 3 | Review | 单文件移动到新目录 | 引用路径正确更新 |
| 4 | Review | 批量目录重塑（按层模式） | 所有引用一致更新 |
| 5 | Review | 平级限制违规检测 | index.tsx 与非 index 平级→标记违规 |
| 6 | Review | 类型隔离违规检测 | components/ 下混入 .ts 非组件→标记违规 |
| 7 | Review | 别名路径项目 | tsconfig 别名是否同步更新 |
| 8 | Review | 无变化项目 | 报告无变更 |

---

## 文件结构

```
skills/adft-directory-restructurer/
├── SKILL.md                       # 主文件（本文档）
├── references/
│   ├── preset-flow.md             # 规范预设模式详细流程
│   └── restructure-flow.md        # 审查模式详细流程
├── templates/
│   └── custom.md                  # 规则引擎配置（命名/隔离/平级/深度）
├── test/
│   └── evals.md                   # 双模式评估用例
└── assets/
    └── default-rules.yaml         # 默认规则集（可选）
```
