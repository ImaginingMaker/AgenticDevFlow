# 开发助手 - 进度追踪与场景分析详细流程

> 供 `adfa-dev-helper` 使用。详细描述进度速览、场景分析和下一步建议的执行流程。

## 总体架构

```
用户触发
  ├─ "进度" / "现在到哪了" → 能力一：进度速览
  ├─ "推荐技能" / "我该用什么" → 能力二：场景分析
  ├─ "下一步" / "接下来做什么" → 能力三：下一步建议
  └─ 其他场景 → 根据上下文智能路由到对应能力
```

---

## 能力一：进度速览流程

### 触发词

用户说"进度"、"现在到哪了"、"还有什么没做"、"任务状态"

### 执行步骤

#### Step 1：扫描工作流目录

```bash
# 检查 docs/workflows/ 是否存在
ls docs/workflows/ 2>/dev/null
```

- 目录存在 → 扫描所有子目录（每个子目录是一个任务）
- 目录不存在 → 提示无活跃任务

#### Step 2：读取活跃任务 state.json

对每个任务目录，读取 `docs/workflows/{任务ID}/state.json`：

```json
{
  "id": "任务ID",
  "currentPhase": "DESIGN",
  "phaseHistory": [
    {"phase": "INIT", "status": "completed"},
    {"phase": "ANALYZE", "status": "completed"},
    {"phase": "PRD", "status": "completed"},
    {"phase": "SPEC", "status": "completed"},
    {"phase": "DESIGN", "status": "in_progress"}
  ],
  "blockers": [
    {"description": "等待UI设计稿", "severity": "high"}
  ]
}
```

#### Step 3：计算进度

| 信息 | 计算方式 |
|------|---------|
| 已完成阶段数 | phaseHistory 中 status=completed 的数量 |
| 总阶段数 | 所有 phase 的总数（不含 future） |
| 进度条 | `█` 字符表示完成，`░` 表示未完成 |
| 状态 | 有 blocker 则标🔴，否则✅ |

#### Step 4：生成仪表盘

```
📊 **开发进度仪表盘**

活跃任务：{N} 个
已完成：{N} 个

| 任务 | 当前阶段 | 进度 | 状态 |
|------|---------|------|------|
| {任务名} | DESIGN | ████░░░░ 2/4 | ✅ 正常 |
| {任务名} | IMPLEMENT | ██████░░ 3/4 | 🔴 有阻塞 |

阻断项：
🔴 {任务名}: {blocker 描述}

💡 建议：使用 adfa-dev-helper 的"下一步"功能获取具体行动建议。
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

## 能力二：场景分析流程

### 触发词

用户说"推荐技能"、"我该用什么技能"、"有什么工具可以用"、"帮我推荐"

### 执行步骤

#### Step 1：提取用户场景关键词

从用户描述中提取场景关键词：

| 关键词 | 映射场景 |
|--------|---------|
| 需求、想法、模糊 | 需求分析 |
| PRD、需求文档、产品规格 | 需求文档生成 |
| 技术规格、技术方案、SPEC | 规格生成 |
| 架构、文件结构、模块拆分 | 架构设计 |
| 找相似、类似的、参考、有没有现成的 | 相似组件匹配 |
| 组件、拆组件、页面结构 | 组件设计 |
| 交互体验、UX、状态处理、交互方案、用户体验 | UX交互分析 |
| 写代码、实现、状态缺失 | 代码实现 |
| 审查、review、检查、交互缺失 | 代码审查 |
| 重构、代码太乱 | 重构 |
| 测试、单元测试、E2E | 测试用例 |
| 理解、上下文、调用链 | 代码理解 |
| 创意、头脑风暴 | 头脑风暴 |
| 复用、提取 Hook | 逻辑提取 |
| 评审、方案评审 | 批判性评审 |
| 提交、commit、git | 智能提交 |
| 文档、Wiki | 页面 Wiki |
| 目录重塑、目录太乱、目录整理、合规 | 目录审查 |
| 预设目录、创建目录骨架、搭建项目骨架 | 目录预设 |

#### Step 2：场景→技能映射

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

#### Step 3：场景不明确时

```
🤔 让我了解更多：
- 你在哪个阶段？（想法 / 设计 / 开发 / 审查 / 重构）
- 你手头有什么？（需求文档 / 设计稿 / 已有代码 / 什么都没有）
- 你想要什么产出？（PRD / 技术方案 / 代码 / 审查报告）
```

---

## 能力三：下一步建议流程

### 触发词

用户说"下一步"、"接下来做什么"、"完成之后做什么"、"然后呢"

### 执行步骤

#### Step 1：判断当前阶段

读取 `state.json.currentPhase`（敏捷模式下通过对话推断阶段）

#### Step 2：映射下一步

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

## 组合链路建议

### 完整开发链路（含UX交互分析）
```
adfp-requirement-analyzer → adfp-prd-generator → adfp-spec-generator
    → adfp-architecture-designer → [adft-directory-restructurer Preset] → adfp-component-designer
    → [UX交互分析内建] → adfp-code-implementer → [四态骨架自动生成] → adfp-code-reviewer
    → [UX完整性审查] → adfa-ux-interaction-checker（可选深度检查）
```

### 快速原型链路（跳过文档）
```
adfp-architecture-designer（分析复用）→ adfp-code-implementer
```

### 实施前目录预设链路
```
adfp-architecture-designer（输出文件层级蓝图）
    → adft-directory-restructurer Preset（创建目录骨架）
    → adfp-component-designer → adfp-code-implementer（在骨架中写入代码）
```

### 相似组件快速参考链路
```
用户描述功能 → adfp-architecture-designer 快速模式 → component-match.md
    → adfp-code-implementer（基于匹配结果参考实现）
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
6. 不修改任何文件状态（这是 adfo-harness-runner 的职责）
