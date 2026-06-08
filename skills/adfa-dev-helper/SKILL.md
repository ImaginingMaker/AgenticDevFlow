---
name: adfa-dev-helper
description: "前端开发轻量顾问（只读，不管理状态）。三大能力：1)进度速览——扫描docs/workflows/展示任务状态仪表盘；2)场景分析——根据用户描述的开发场景推荐适用的技能和工具；3)下一步建议——基于当前阶段给出最优下一步行动。与adfo-harness-runner的区别：dev-helper只读不写，harness-runner管理状态和流水线。TRIGGER: 用户说'开发助手'、'下一步'、'进度'、'现在该做什么'、'给我建议'、'推荐技能'、'我该用什么技能'。Use proactively when: 用户完成一个开发步骤后不知道下一步，或用户刚进入项目不清楚从哪开始，或用户描述了开发场景但不知道用哪个技能。"
---

# 前端开发综合助手

> 入口页。详细进度追踪和场景分析流程见 `references/assistant-flow.md`。

三大核心能力：进度追踪、场景分析、下一步建议。

---

## 能力一：进度速览（只读）

只读取 `docs/workflows/` 目录和 `state.json` 做展示，**不修改任何状态**。完整的状态管理和流水线编排由 `adfo-harness-runner` 负责。

### 触发
用户问"进度"、"现在到哪了"、"还有什么没做"

### 执行
1. 扫描 `docs/workflows/` 目录（若存在）
2. 读取活跃任务的 `state.json`
3. 输出状态仪表盘：

```
📊 **开发进度仪表盘**

活跃任务：{N} 个
已完成：{N} 个

| 任务 | 当前阶段 | 进度 | 状态 |
|------|---------|------|------|
| {任务名} | DESIGN | ████░░░░ 2/4 | ✅ 正常 |
| {任务名} | IMPLEMENT | ██████░░ 3/4 | 🔴 有阻塞 |
| {任务名} | - | ████████ 4/4 | ✅ 已完成 |

阻断项：
🔴 {任务名}: {blocker 描述}
```

### 无活跃任务时
```
📊 当前没有活跃的开发任务。

快速开始：
- 描述你的需求 → 推荐使用 adfp-prd-generator 生成 PRD
- 已有方案 → 使用 adfp-component-designer 设计组件
- 直接写代码 → 描述你要实现的功能
```

---

## 能力二：场景分析

### 触发
用户描述了一个开发场景但不清楚该用什么技能

### 场景→技能映射

> **索引源**：`skills/README.md` 是技能注册中心。本表以注册中心为准，新增技能时需同步更新本表（手动维护，列在注册中心之后）。

| 场景描述 | 推荐技能 | 理由 |
|----------|----------|------|
| "我有一个模糊的前端需求..." | `adfp-requirement-analyzer` | 多维度分析澄清需求 |
| "我有一个产品想法..." | `adfp-prd-generator` | 先把想法结构化 |
| "需求有了但不知道怎么做" | `adfp-spec-generator` | 生成技术规格 |
| "SPEC写好了，怎么规划实施？" | `adfp-architecture-designer` | 架构分析+实施顺序 |
| "项目里有哪些可复用的模块？" | `adfp-architecture-designer` | SubAgent 并发扫描 |
| "找相似的组件" / "项目中有没有类似的功能实现" | `adfp-architecture-designer`（快速模式） | 快速匹配Top-5相似组件+复用建议 |
| "页面怎么拆组件？" | `adfp-component-designer` | 设计组件结构 |
| "交互体验怎么做？" / "需要考虑哪些交互状态" | `adfp-component-designer` | 内建UX交互分析，输出四态方案 |
| "帮我写这个组件" | `adfp-code-implementer` | 生成代码 |
| "代码交互缺失，补状态" | `adfp-code-implementer` | 自动补全四态骨架代码 |
| "代码写完了帮看看" | `adfp-code-reviewer` | 审查代码 |
| "这段逻辑能复用吗？" | `adfa-hooks-extractor` | 提取可复用 Hook |
| "帮我评审这个方案" | `adfa-critical-explorer` | 6 维度批判性评审 |
| "帮我理解这段代码" | `adfa-code-context` | 追踪调用链 |
| "需要创意方案" | `adfa-brainstorm` | 头脑风暴发散 |
| "要写测试用例" | `adfa-edge-case-master` | 生成边界测试 |
| "代码太乱了" | `adfa-refactor-advisor` | 重构建议 |
| "完整项目开发" | `adfo-task-orchestrator` | 多角色协作编排 |
| "并发执行 / 并行处理多任务" | `adfo-task-orchestrator` | DAG拓扑调度SubAgent |
| "生成页面Wiki文档" | `adft-page-wiki-generator` | 代码→标准化Wiki |
| "分析页面关键链路" | `adft-page-wiki-generator` | 解析初始化/操作/跳转链路 |
| "提交代码" / "智能提交" / "分类提交" | `adft-smart-commit` | 自动分析分类并组织提交 |
| "目录重整" / "目录太乱了" / "检查目录是否规范" | `adft-directory-restructurer` | 预设目录骨架或审查现存目录合规性 |
| "创建目录结构" / "设置目录结构" / "搭建项目骨架" | `adft-directory-restructurer`（Preset模式） | 实施前创建符合规范的目录骨架 |

### 场景不明确时
主动询问：
```
🤔 让我了解更多：
- 你在哪个阶段？（想法 / 设计 / 开发 / 审查 / 重构）
- 你手头有什么？（需求文档 / 设计稿 / 已有代码 / 什么都没有）
- 你想要什么产出？（PRD / 技术方案 / 代码 / 审查报告）
```

---

## 能力三：下一步建议

### 触发
用户完成一个阶段后问"接下来做什么"

### 按阶段的下一步映射

> 完整阶段→技能映射见 `adfo-harness-runner/references/phase-registry.md` §二。

| 当前阶段 | 产物 | 推荐下一步 | 技能 |
|----------|------|-----------|------|
| 原始需求 | 散乱描述 | 需求分析与澄清 | `adfp-requirement-analyzer` |
| 需求分析 | `requirement-analysis.md` | 生成结构化 PRD | `adfp-prd-generator` |
| PRD | `prd.md` | 生成技术规格 | `adfp-spec-generator` |
| SPEC | `spec.md` | 架构设计与实施规划 | `adfp-architecture-designer` |
| 架构设计 | `architecture.md` | 设计组件结构 | `adfp-component-designer` |
| 组件设计 | `design.md` | 实现代码 | `adfp-code-implementer` |
| 代码实现 | `src/` | 代码审查 | `adfp-code-reviewer` |
| 审查通过 | `review-report.md` | 完成 / 测试 | `adfa-edge-case-master` |
| 审查失败 | `review-report.md` (FAIL) | 修复阻塞项 | `adfp-code-implementer` (修复模式) |

### 无明确阶段时
```
📋 **典型开发流程**

1. 想法 → 需求分析    → adfp-requirement-analyzer
2. 分析 → PRD         → adfp-prd-generator
3. PRD  → SPEC        → adfp-spec-generator
4. SPEC → 架构设计    → adfp-architecture-designer
5. 架构 → 组件设计    → adfp-component-designer
6. 设计 → 代码        → adfp-code-implementer
7. 代码 → 审查        → adfp-code-reviewer
8. 审查 → 完成        ✅

你现在在哪个环节？
```

---

## 组合建议

### 完整开发链路
```
adfp-requirement-analyzer → adfp-prd-generator → adfp-spec-generator → adfp-architecture-designer
    → adfp-component-designer → adfp-code-implementer → adfp-code-reviewer
```

### 快速原型链路（跳过文档）
```
adfp-architecture-designer（分析复用）→ adfp-code-implementer
```

### 代码审查+修复循环
```
adfp-code-reviewer → adfp-code-implementer(修复模式) → adfp-code-reviewer
```

### 重构链路
```
adfa-code-context(理解) → adfa-refactor-advisor(方案) → adfp-code-implementer(执行)
```

---

## 约束规则

1. 基于项目实际状态给出建议，不做无依据的推荐
2. 场景不明确时主动询问，不猜测
3. 进度追踪优先读取 `state.json`，不存在时扫描文件系统
4. 推荐技能时附带理由（为什么选这个）
5. 用户明确说"不需要"时停止建议
