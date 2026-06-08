---
name: adfp-requirement-analyzer
description: "前端需求多维度协同分析技能。当用户需求模糊时自动触发adfa-brainstorm探索意图，需求清晰后并发3个SubAgent（需求背景解析、开发链路梳理、任务计划拆解），输出结构化分析报告。是PRD生成的前置澄清步骤。TRIGGER: 用户说'需求分析'、'需求拆解'、'开发计划'、'链路梳理'、'帮我分析这个需求'、'分析前端需求'。Use proactively when: 用户提出前端需求（无论清晰或模糊），需要先澄清分析再生成PRD。"
---

# 前端需求多维度协同分析

> 入口页。3 个 SubAgent 详情见 `references/sub-agents.md`；Brainstorm 联动流程见 `references/brainstorm-trigger.md`。

流水线定位：**ANALYZE 阶段**（PRD 之前）。接收需求 → 模糊时触发 brainstorm → 清晰后并发分析 → 输出报告。

---

## 职责边界

| 技能 | 关系 |
|------|------|
| `adfa-brainstorm` | 前置：用户想法模糊时触发快速模式 |
| `adfp-prd-generator` | 下游：消费本分析报告生成 PRD |
| `adfa-critical-explorer` | 平行：本技能建设性分析，explorer 批判性评审 |

---

## 平台感知

> 公共三链路检测机制（链路 A 工程模式 / 链路 B 敏捷主动检测 / 链路 C 用户指定 → 通用降级）在 `adfo-harness-runner/references/platform-detection.md` 中统一管理。

---

## 核心流程

```
用户输入
  ├─ 需求模糊？→ 触发 adfa-brainstorm(快速模式) → 接收 Top3 方向
  └─ 需求清晰？→ 完整性检查 → 并发 3 SubAgent 分析 → 汇总报告
```

### 第零步：需求明确度判定

模糊信号（一句话、无目标用户、无功能点、用户说"没想好"）→ 触发 brainstorm
清晰信号（核心目标 + 目标用户 + 2+ 功能点）→ 直接进入

### 第二步：3 SubAgent 并发分析

> SubAgent 委托与聚合协议（任务清单格式、执行参数、聚合规范）见 `adfo-harness-runner/references/subagent-delegation.md`。

通过 `adfo-task-orchestrator` 并发调度（全部无依赖，最大并发 3）：

| ID | 职责 | 聚焦 |
|----|------|------|
| SA1 | 需求背景解析师 | "为什么做"：业务场景、核心目标、优先级 |
| SA2 | 开发链路梳理师 | "怎么做"：技术选型（从平台感知检测结果读取目标框架/平台）、依赖条件、风险点 |
| SA3 | 任务计划拆解师 | "分阶段做"：任务拆解、工时、里程碑 |

> 每个 SubAgent 的详细提示词和输出格式见 `references/sub-agents.md`

---

## 输出

```markdown
# 前端开发需求协同分析报告
## 一、需求背景与核心目标
## 二、前端开发链路梳理
## 三、开发任务计划
## 四、总结与建议
## 五、需确认事项
```

| 模式 | 输出路径 |
|------|---------|
| 敏捷模式 | `./requirement-analysis.md` |
| 工程模式 | `docs/workflows/{任务ID}/requirement-analysis.md` |

---

## 执行指令

当用户触发本技能时，按以下步骤执行：

### 第零步：参考资料收集

在需求明确度判定之前，主动询问参考资料：

```
📎 在开始分析前，请提供任何可以参考的资料，帮助我更精准地理解需求：

1. 📐 设计稿 / 原型链接（Figma / 蓝湖 / 摹客）
2. 🔗 竞品或参考产品链接
3. 💻 已有的前端项目代码（类似功能的实现路径）
4. 📚 UI 组件库 / 设计系统文档（Ant Design / Element Plus / shadcn/ui）
5. 📄 PRD / 需求文档（已有文档的链接或路径）
6. ❌ 无参考资料，直接开始分析
```

**约束**：
- 不强制要求，用户可跳过（直接进入需求分析）
- 提供的资料在后续步骤中作为上下文注入：技术选型参考现有项目、组件方案参考设计系统、交互流程参考竞品
- 工程模式下优先读取 `state.json.references`，避免重复询问

1. **需求明确度判定**：检查用户输入是否符合模糊信号（一句话、无目标用户、无功能点、用户说「没想好」、范围过大、多义性）
2. **模糊 → 触发 brainstorm**：调用 `adfa-brainstorm` 快速模式（15 分钟收敛），接收 Top3 方向，展示给用户选择
3. **清晰 → 完整性检查**：检查功能范围、用户角色、交互场景、技术约束四项，不完整则追问（最多 3 轮）
4. **平台感知**：按链路 A→B→C 检测目标框架
5. **并发分析**：通过 `adfo-task-orchestrator` 调度 SA1-SA3，全部无依赖、最大并发 3
6. **汇总整合**：去重 → 冲突校验 → 优先级排序 → 输出结构化分析报告
7. **输出产物**：生成 `requirement-analysis.md`，内容覆盖五大章节

> 3 个 SubAgent 的详细提示词见 `references/sub-agents.md`，Brainstorm 联动流程见 `references/brainstorm-trigger.md`。

## 输出原则

1. **忠实原需求** — 严格按用户需求拆解，不擅自增加功能
2. **不重复覆盖** — 分析止于「要做什么」和「怎么做」，不越界到 PRD/SPEC/DESIGN
3. **可追溯** — 每项任务标注对应的原始功能点，支持回溯
4. **量化优先** — 工时预估标注置信度（粗略/估算/精确）
5. **用户确认优先** — 所有假设性质的内容标注「待确认」，不替用户决策

## 质量检查清单

输出 `requirement-analysis.md` 前，检查以下事项：

| # | 检查项 | 标准 |
|---|--------|------|
| 1 | **阶段一致性** | front-matter 中 `phase: ANALYZE` |
| 2 | **内容实质性** | 正文 ≥ 50 字符，不只含 front-matter |
| 3 | **五大章节完整** | 需求背景 + 开发链路 + 任务计划 + 总结建议 + 疑问确认 全覆盖 |
| 4 | **技术选型** | 基于平台感知结果给出推荐，非前端的内容不覆盖 |
| 5 | **Brainstorm 触发正确** | 模糊需求有 brainstorm 记录，清晰需求无多余发散 |
| 6 | **追问记录** | 追问轮数 ≤ 3，每轮都有用户回复记录 |
| 7 | **边界清晰** | 不包含 PRD/SPEC/DESIGN 阶段的产物（用户故事、API 契约、组件树） |

## CLI 集成（工程模式）

```bash
# 执行前：获取编译后的执行上下文
node skills/adfo-harness-runner/scripts/harness-cli.js context {任务ID}

# 执行后：校验产物并更新状态
node skills/adfo-harness-runner/scripts/harness-cli.js verify {任务ID} ANALYZE {产物路径}
```

## 约束规则

1. 仅聚焦前端开发需求
2. 需求模糊时**必须**先触发 brainstorm，不跳过
3. Brainstorm 控制在 15 分钟内收敛
4. 不生成用户故事（PRD 职责）、API 契约（SPEC 职责）、组件树（DESIGN 职责）
5. 潜在需求标注「建议补充」，由用户确认

## 工程模式调用（Harness 调度）

当被 `adfo-harness-runner` 调度时，遵循两阶模式（context → execute → verify）：

### 执行前
LLM 已从 `harness-cli context <taskId>` 获取编译上下文，包括：
- **技术栈**：从 `state.json.techStack` 读取的完整技术栈信息
- **产物路径**：`docs/workflows/{taskId}/requirement-analysis.md`
- **上游产物**：已完成阶段的产物引用
- **跳过信息**：已跳过阶段的列表及原因

直接按上下文指令执行，**不需要自行读取 state.json**。

### 执行后
运行 `harness-cli verify <taskId> ANALYZE <artifact>` 校验产物：

```bash
node scripts/harness-cli.js verify <taskId> ANALYZE docs/workflows/<taskId>/requirement-analysis.md
```

LLM 不能跳过此步骤——状态更新由 verify 命令原子写入，包括：
1. 解析 front-matter 的 phase/status/qualityGate
2. 三判定校验：阶段一致性、内容实质性（≥50字符）、qualityGate 值
3. 原子写入 state.json（先写 tmp → mv）
4. 更新 checkpoint（文件 SHA-256 快照）

## 模板注入

> 共享配置由 `adfo-harness-runner/templates/custom.md` 统一管理。
`templates/custom.md` — 本技能特有的分析维度配置（分析深度、默认技术偏好、报告偏好）。
