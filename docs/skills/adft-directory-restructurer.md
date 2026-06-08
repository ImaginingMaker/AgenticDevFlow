# adft-directory-restructurer

> 前端目录结构治理专家。双模式：规范预设模式 + 审查模式。

## 基本信息

| 属性 | 值 |
|------|-----|
| **名称** | adft-directory-restructurer |
| **类型** | 工具 |
| **前缀** | adft- |
| **触发词** | 目录重塑、目录整理、重组目录、restructure directory、整理项目目录、目录太乱了、梳理目录结构、目录重构、设置目录结构、预设目录、创建目录骨架、目录预处理、检查目录、目录合规、目录审查 |
| **文件位置** | `skills/adft-directory-restructurer/SKILL.md` |

## 核心特性

- **双模式架构**：Preset（规范预设）+ Review（审查重塑）
- **规则引擎**：4 维度可配置规则（命名/类型隔离/平级限制/深度限制），两模式共用
- **Preset 模式**：在 IMPLEMENT 前根据 architecture.md 蓝图创建符合规范的目录骨架
- **Review 模式**：扫描现有目录检测违规项，按规则执行目录重塑并更新所有引用路径
- **平级限制（硬约束）**：`index.tsx` 所在目录不得与非 index 文件平级
- **类型隔离**：components/hooks/services/utils/types/stores 各自只放规定后缀的文件
- **引用全更新**：相对路径、别名、CSS import、dynamic import、require、barrel export 全覆盖

## 使用方式

### Mode A：规范预设模式

```bash
# 交互式
"预设目录结构"            → 询问模块清单和框架
"帮我创建项目骨架"        → 交互式引导

# 带参快速启动
"预设 用户模块,订单模块 React 18 的目录结构"
"为我的 Next.js 项目搭建 components/hooks/services 骨架"

# 工程模式集成
"在实施前预设目录结构，读取 docs/workflows/{taskId}/architecture.md"
```

### Mode B：审查模式

```bash
# 交互式
"目录重塑"                → 询问目标目录和模式偏好
"检查目录合规"           → 默认扫描 src/，报告违规项

# 指定参数
"把 src/ 按功能模块重组，并执行"
"检查 src/ 的目录结构合规性"

# 仅生成计划
"目录重塑预览 — 只生成计划不执行"
```

## 依赖关系

| 关系类型 | 技能 | 说明 |
|---------|------|------|
| **上游输入** | `adfp-architecture-designer` | Preset 模式消费 architecture.md 的文件层级蓝图 |
| **下游消费** | `adfp-code-implementer` | implementer 在 Preset 创建的目录骨架中写入代码 |
| **编排调度** | `adfo-harness-runner` | IMPLEMENT 阶段安排 Preset 作为前置步骤（建议） |
| **互补** | `adft-directory-restructurer` | Preset 事前预设 / Review 事后修复 同技能双模式 |
| **互补** | `adfa-refactor-advisor` | refactor 重组代码逻辑，restructurer 重组文件位置 |
| **建议下游** | `adft-smart-commit` | 目录重塑完成后建议组织提交 |

## 流程生命周期

### Preset Mode

```
触发条件: 实施前（ARCHITECTURE → DESIGN → IMPLEMENT 之间）
手动触发: "预设目录结构"

输入 → 步骤 → 输出
architecture.md / 用户指令 → A1 读取输入 → A2 加载规则集 → A3 生成目录蓝图
  → A4 创建目录骨架 → A5 规范校验 → A6 输出 structure-plan.md

异常路径: architecture.md 不存在 → 降级敏捷模式，询问用户模块清单
```

### Review Mode

```
触发条件: 已有目录需要检查/重塑
手动触发: "目录重塑"、"检查目录合规"

输入 → 步骤 → 输出
目标目录路径 → B1 扫描与依赖映射 → B2 规范校验（4 维度） → B3 生成映射表
  → B4 用户确认 → B5 执行重塑 → B6 验证 → B7 输出 restructure-report.md

异常路径: 用户选择"仅生成计划" → 输出 restructure-plan.md 不执行
          用户选择"预览+调整" → 展示映射表，用户调整后执行
```

### 在完整流水线中的位置

```
INIT → ANALYZE → PRD → SPEC → ARCHITECTURE
                                    ↓
                             [Preset Mode] → 创建目录骨架
                                    ↓
                              DESIGN → IMPLEMENT → REVIEW → DONE
                                              ↓
                                       [Review Mode] → 检查/重塑
```

## 约束规则

1. **Preset 模式**：只创建目录骨架，不生成任何代码文件。不修改现有文件
2. **Review 模式**：不修改业务逻辑，仅移动文件和更新引用路径
3. **安全第一** — Review 模式执行前必须展示影响分析并等待用户确认
4. **先复制后删除** — Review 模式文件移动采用 copy → verify → delete 模式
5. **非侵入** — 不修改 node_modules、dist、.git 等无关目录
6. **全引用覆盖** — 相对路径、别名、CSS import、dynamic import、require、barrel export、资源引用全覆盖
7. **入口文件保护** — package.json main/module/browser、路由入口文件不得默认移动
8. **平级限制是硬约束** — Preset 和 Review 模式都必须校验

## 模板注入

> 本技能为独立工具（adft-），不接入 `adfo-harness-runner` 的流水线共享配置。

`templates/custom.md` — 规则引擎核心配置（命名规则、类型隔离、平级限制、深度限制）及执行偏好

## 测试用例

详见 `test/evals.md`。

| # | 模式 | 场景 |
|---|------|------|
| A1 | Preset | 从 architecture.md 生成目录骨架 |
| A2 | Preset | 用户指定模块清单 + 框架 |
| A3 | Preset | 平级限制校验 |
| B1 | Review | 单文件移动到新目录 |
| B2 | Review | 批量目录重塑（按层模式） |
| B3 | Review | 平级限制违规检测 + 修复 |
| B4 | Review | 类型隔离违规检测 + 修复 |
| B5 | Review | 别名路径项目 |
| B6 | Review | 无变化项目 |
