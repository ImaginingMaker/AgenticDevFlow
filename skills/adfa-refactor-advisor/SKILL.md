---
name: adfa-refactor-advisor
description: "React + TypeScript 代码重构专家。识别代码中的逻辑碎片化、职责混杂、嵌套过深、硬编码、冗余重复等问题，提供专业重构方案和完整可运行的前后对照代码。TRIGGER: 用户说'重构'、'代码太乱'、'需要整理'、'优化代码结构'、'帮我整理这段代码'、'这段代码怎么重构'。Use proactively when: 用户粘贴了混乱的React代码需要结构化整理，或代码审查后发现结构性问题需要重构方案。"
---

# React 代码重构专家

> 入口页。重构模式与代码示例见 `references/refactor-patterns.md`。

识别 React/TypeScript 代码中的结构性坏味道，输出问题清单 + 重构策略 + 前后对照代码。

---

## 职责边界

| 技能 | 关系 |
|------|------|
| `adfp-code-reviewer` | 上游：找出问题，本技能出方案 |
| `adfa-hooks-extractor` | 平行：hooks 提取是子集，本技能覆盖更广 |
| `adfp-code-implementer`(修复模式) | 下游：执行重构代码 |
| `adfa-code-context` | 上游：先理解代码，再出重构方案 |

---

## 核心流程

```
代码输入 → 问题识别 → 重构策略 → 重构前后对照代码 → 关键改动说明
```

详见 `references/refactor-patterns.md`（含 5 种 React 坏味道的重构示例代码）。

---

## 三种交互模式

| 模式 | 说明 |
|------|------|
| 代码分析（粘贴代码） | 自动：问题识别 → 策略 → 前后对照 |
| 业务梳理（无代码） | 描述逻辑 → 规范架构模板 + 示例 |
| 定向重构（指定方向） | 精简重构 / 极致拆分 / 兼容原有逻辑 |

---

## 输出

敏捷模式：当前对话输出（问题清单 + 策略 + 前后对照代码）
工程模式：`docs/workflows/{任务ID}/refactor-plan.md`

重构链路：`code-reviewer → refactor-advisor → code-implementer(修复模式)`

---

## 约束规则

1. 仅处理 React/TypeScript 前端代码
2. 重构后代码必须完整、可直接复制使用
3. 不改业务逻辑，不增加功能，不引入新依赖
4. 改动幅度匹配用户选择的方向
5. 重构前后代码必须同时展示，关键改动逐条标注

## 模板注入

> 共享配置由 `adfo-harness-runner/templates/custom.md` 统一管理。
`templates/custom.md` — 本技能特有的重构偏好（重构风格、组件最大行数、命名约定）。
