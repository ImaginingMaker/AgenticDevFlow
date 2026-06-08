# adfp-requirement-analyzer

> 前端需求多维度协同分析技能。当用户需求模糊时自动触发 `adfa-brainstorm` 探索意图，需求清晰后并发 3 个 SubAgent（需求背景解析、开发链路梳理、任务计划拆解），输出结构化分析报告。是 PRD 生成的前置澄清步骤。

## 基本信息

| 属性 | 值 |
|------|-----|
| **名称** | adfp-requirement-analyzer |
| **类型** | 流水线 |
| **前缀** | adfp- |
| **阶段** | ANALYZE（在 INIT 和 PRD 之间） |
| **触发词** | 需求分析、需求拆解、开发计划、链路梳理、帮我分析这个需求、分析前端需求 |
| **文件位置** | skills/adfp-requirement-analyzer/SKILL.md |

## 核心特性

- **需求明确度判定**：自动判断需求是否需要先经过 brainstorm 发散
- **Brainstorm 前置集成**：需求模糊时自动触发 `adfa-brainstorm`（快速模式），按 4 步委托机制执行（告知→调用→接收→衔接），含 3 种异常处理
- **3 Agent 并发分析**：需求背景解析 + 开发链路梳理 + 任务计划拆解，并发执行提升效率
- **需求完整性检查**：信息不完整时主动追问，不猜测
- **前端领域限定**：仅聚焦前端开发需求，非前端需求明确拒绝
- **产物可流转**：分析报告可直接作为 `adfp-prd-generator` 的输入素材

## 使用方式

### 敏捷模式（直接调用）

```
"帮我分析这个前端需求：开发一个活动报名小程序..."
"需求分析：用户管理后台，需要用户列表、增删改查..."
"帮我做个页面"  → 自动触发 brainstorm 探索方向
```

### 工程模式（通过 harness）

编排器在 INIT 完成后自动进入 ANALYZE 阶段，调用本技能生成 `requirement-analysis.md`，然后流转到 PRD。

## 依赖关系

### 上游依赖（本技能依赖谁）

| 技能 | 关系类型 | 说明 |
|------|---------|------|
| `adfa-brainstorm` | 可选触发 | 需求模糊时自动触发，通过 4 步委托机制（告知→调用→接收→衔接）传递创意清单，收敛后衔接分析 |
| `adfo-harness-runner` | 编排调度 | 工程模式下由 harness 在 ANALYZE 阶段调度本技能 |

### 下游消费（谁依赖本技能）

| 技能 | 关系类型 | 说明 |
|------|---------|------|
| `adfp-prd-generator` | 后置消费 | 接收本技能的 `requirement-analysis.md` 作为 PRD 生成输入 |
| `adfo-harness-runner` | 编排调度 | qualityGate 判定后流转到 PRD 阶段 |

## 流程生命周期

### 触发条件

- **自动触发**：harness 完成 INIT 后自动进入 ANALYZE 阶段
- **手动触发**："帮我分析这个前端需求"、"需求分析"、"需求拆解"、"开发计划"
- **内部触发**：需求模糊时自动调用 `adfa-brainstorm`，收敛后回本技能

### 生命周期图

```
adfa-brainstorm（需求模糊时触发）
      ↓ 接收创意清单，收敛
本技能：完整性检查 → 3 SubAgent 并发分析 → 汇总报告
      ↓ 输出 requirement-analysis.md
adfp-prd-generator（生成 PRD）

异常路径：
  ├─ 非前端需求 → 拒绝并终止
  ├─ 信息不完整 → 追问用户 → 重新分析
  └─ 3 次追问仍不完整 → 标注「待确认」，降级输出
```

### 在完整流水线中的位置

```
INIT → 【ANALYZE】 → PRD → SPEC → ARCHITECTURE → DESIGN → IMPLEMENT → REVIEW → DONE
```

### 产物状态

| 产物 | 路径 | 内容 | 状态流转 |
|------|------|------|---------|
| 需求分析报告 | `./requirement-analysis.md` / `docs/workflows/{任务ID}/requirement-analysis.md` | 业务场景、技术栈选型、任务清单 | 创建 → PRD 消费 → 归档 |

## 工作流程

```
用户输入
  │
  ├─ 需求模糊？
  │     └─ YES → 触发 adfa-brainstorm（标准15min）→ 接收创意清单 → 收敛 → 衔接分析
  │
  └─ 需求清晰？
        └─ 完整性检查 → 并发 3 SubAgent → 汇总报告
                              │
                              ├─ SubAgent 1: 需求背景解析（业务场景、核心目标、用户画像）
                              ├─ SubAgent 2: 开发链路梳理（技术栈选型、依赖分析、风险点）
                              └─ SubAgent 3: 任务计划拆解（任务清单、优先级、预估工时）
```

### 内部流程详解

1. **需求明确度判定**
   - 输入：用户原始需求描述
   - 判定标准：需求是否包含明确的功能点、用户场景、技术约束
   - 模糊 → 触发 `adfa-brainstorm`
   - 清晰 → 进入完整性检查

2. **完整性检查**
   - 检查项：功能范围、用户角色、交互场景、技术约束
   - 不完整 → 追问用户（最多3轮）
   - 完整 → 启动并发分析

3. **并发 3 SubAgent**
   - **需求背景解析**：业务场景、核心目标、用户画像、成功指标
   - **开发链路梳理**：技术栈选型、依赖分析、技术风险点、可行性评估
   - **任务计划拆解**：任务清单、依赖关系、优先级排序、预估工时

4. **汇总报告**
   - 整合 3 个 SubAgent 输出
   - 生成 `requirement-analysis.md`

### 执行指令

当触发本技能时，按以下步骤执行：

1. **需求明确度判定**：检查用户输入是否符合模糊信号（一句话、无目标用户、无功能点、用户说「没想好」、范围过大、多义性）
2. **模糊 → 触发 brainstorm**：调用 `adfa-brainstorm` 快速模式（15 分钟收敛），接收 Top3 方向，展示给用户选择
3. **清晰 → 完整性检查**：检查功能范围、用户角色、交互场景、技术约束四项，不完整则追问（最多 3 轮）
4. **平台感知**：按链路 A→B→C 检测目标框架
5. **并发分析**：通过 `adfo-task-orchestrator` 调度 SA1-SA3，全部无依赖、最大并发 3
6. **汇总整合**：去重 → 冲突校验 → 优先级排序 → 输出结构化分析报告
7. **输出产物**：生成包含 `phase: ANALYZE` front-matter 的 `requirement-analysis.md`

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

## 与现有技能的职责边界

| 技能 | 关系 | 区分 |
|------|------|------|
| `adfa-brainstorm` | **上游** | brainstorm 帮助用户**发现**想要什么（发散），本技能将想法**结构化**为可执行需求（收敛） |
| `adfp-prd-generator` | **下游** | 本技能做需求**分析**（技术视角），PRD 做需求**文档化**（用户故事、验收标准） |
| `adfa-critical-explorer` | **平行** | 本技能是**建设性**分析（要做什么），critical-explorer 是**批判性**评审（方案有什么问题） |
| `adfp-spec-generator` | **下游下游** | 本技能不做数据模型、API 契约、路由设计，那是 SPEC 的职责 |
| `adfp-component-designer` | **下游下游** | 本技能不做组件树设计，那是 DESIGN 阶段的职责 |

## 约束规则

- **Brainstorm 前置**：需求模糊时必须先触发 brainstorm，不跳过发散直接分析
- **时间控制**：Brainstorm 控制在 15 分钟内收敛，SubAgent 并发不超过 5 分钟
- **领域限定**：仅聚焦前端开发需求，后端需求、运维需求明确拒绝
- **需求忠实**：严格按用户需求拆解，不擅自增加功能
- **职责边界**：不生成用户故事（PRD职责）、不定义 API（SPEC职责）、不展开组件树（DESIGN职责）
- **追问上限**：信息不完整时最多追问 3 轮，仍不完整则标注「待确认」降级输出

## 模板注入

> 共享配置由 `adfo-harness-runner/templates/custom.md` 统一管理。
> 特有配置见 `templates/custom.md`（分析深度、技术偏好、报告偏好、SubAgent 开关）。

### 可配置项

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `analysisDepth` | 分析深度（quick/standard/deep） | standard |
| `techPreference` | 技术栈偏好（React/Vue/Angular） | React |
| `reportFormat` | 报告格式（markdown/json） | markdown |
| `subAgentTimeout` | SubAgent 超时时间（分钟） | 5 |

### 工程模式调用（Harness 调度）

当被 `adfo-harness-runner` 调度时，遵循两阶模式（context → execute → verify）：

#### 执行前
LLM 已从 `harness-cli context <taskId>` 获取编译上下文，包括：
- **技术栈**：从 `state.json.techStack` 读取的完整技术栈信息
- **产物路径**：`docs/workflows/{taskId}/requirement-analysis.md`
- **上游产物**：已完成阶段的产物引用
- **跳过信息**：已跳过阶段的列表及原因

直接按上下文指令执行，**不需要自行读取 state.json**。

#### 执行后
运行 `harness-cli verify <taskId> ANALYZE <artifact>` 校验产物：

```bash
node scripts/harness-cli.js verify <taskId> ANALYZE docs/workflows/<taskId>/requirement-analysis.md
```

LLM 不能跳过此步骤——状态更新由 verify 命令原子写入，包括：
1. 解析 front-matter 的 phase/status/qualityGate
2. 三判定校验：阶段一致性、内容实质性（≥50字符）、qualityGate 值
3. 原子写入 state.json（先写 tmp → mv）
4. 更新 checkpoint（文件 SHA-256 快照）

## 测试用例

| # | 场景 | 输入示例 | 预期行为 |
|---|------|---------|---------|
| 1 | 完整需求输入 | "开发一个用户管理后台，包含用户列表、增删改查、权限分配，使用 React + TypeScript" | 跳过 brainstorm，直接并发 3 SubAgent，输出完整分析报告 |
| 2 | 需求模糊（一句话） | "帮我做个页面" | 触发 adfa-brainstorm 发散，收敛后衔接分析 |
| 3 | 已有 PRD 文档 | 提供 PRD 文档路径 | 跳过 brainstorm，直接基于 PRD 进行技术分析 |
| 4 | 信息不完整但方向清晰 | "做一个电商首页" | 追问：商品类型、用户角色、核心功能？补充后继续分析 |
| 5 | 非前端需求 | "帮我设计数据库表结构" | 拒绝并提示：本技能仅支持前端需求分析 |
| 6 | 追问 3 轮仍不完整 | 用户反复回答模糊 | 标注「待确认」项，降级输出部分分析报告 |
| 7 | 技术栈冲突 | 用户要求 Vue 但项目是 React | 提示冲突，询问是否迁移或新建项目 |
| 8 | 通过 harness 调用 | harness 进入 ANALYZE 阶段 | 自动读取 INIT 产物，执行分析，输出到指定路径 |
