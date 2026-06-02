# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. 它是项目的**技能基准规范总纲**，所有新建、修改、集成技能的操作都必须遵守。

---

## 项目概述

AgenticDevFlow 是一个 Claude Code 技能生态系统和工程化开发编排系统。包含 19 个自定义技能（SKILL），覆盖前端开发的完整生命周期——从需求分析到代码审查，以及独立的开发工具。

---

## 核心架构

### 技能分类体系

共 20 个技能，分为 4 类：

| 分类 | 前缀 | 数量 | 标签 |
|------|------|------|------|
| 流水线技能 | `adfp-` | 7 | 正向交付流水线 |
| 编排技能 | `adfo-` | 2 | 流程调度与任务管理 |
| 辅助技能 | `adfa-` | 7 | 辅助分析/建议/审查 |
| 工具技能 | `adft-` | 4 | 独立工具，不参与流水线 |

### 双层编排架构

```
adfo-harness-runner（阶段级编排）
  └─ 管理正向流水线 INIT→ANALYZE→PRD→SPEC→ARCHITECTURE→DESIGN→IMPLEMENT→REVIEW→DONE
  └─ 管理反向反馈循环（REVIEW FAIL→IMPLEMENT 等）
  └─ 跨会话状态持久化（state.json）
  └─ IMPLEMENT 阶段委托给 ↓

adfo-task-orchestrator（任务级编排）
  └─ 接收结构化任务清单 + 依赖关系
  └─ 构建 DAG 拓扑、识别并发组
  └─ 按拓扑顺序调度 SubAgent 并发/串行执行
  └─ 汇总所有结果
```

关键区别：harness-runner 管理**阶段间流转**，task-orchestrator 管理**阶段内并发**。

### 流水线技能链

```
adfp-requirement-analyzer → adfp-prd-generator → adfp-spec-generator
  → adfp-architecture-designer → adfp-component-designer
  → adfp-code-implementer → adfp-code-reviewer
```

所有阶段由 `adfo-harness-runner` 统一编排。也可以独立调用任何技能走"敏捷模式"（无状态持久化，快速执行）。

### 工程模式 vs 敏捷模式

| 维度 | 工程模式（harness） | 敏捷模式（独立技能） |
|------|-------------------|---------------------|
| 状态持久化 | ✅ `state.json` 唯一状态源 | ❌ 无 |
| 断点恢复 | ✅ checkpoint 自动恢复 | ❌ 每次全新开始 |
| 反馈循环 | ✅ blockers → 回退 → 修复 | ❌ 无 |
| 速度 | 慢（每阶段需确认） | 快（直接执行） |

---

## 技能命名规范

所有技能统一使用 `adf`（AgenticDevFlow）作为项目前缀，按类型定义二级前缀：

| 类型 | 前缀 | 含义 | 示例 |
|------|------|------|------|
| 流水线 | `adfp-` | Pipeline，正向交付流水线 | `adfp-code-reviewer` |
| 编排 | `adfo-` | Orchestration，流程调度管理 | `adfo-harness-runner` |
| 辅助 | `adfa-` | Assistance，辅助分析/建议 | `adfa-dev-helper` |
| 工具 | `adft-` | Tool，独立工具不参与流水线 | `adft-smart-commit` |

**判断标准**：技能服务于前端开发哪个层面？
- 正向交付流水线（PRD→SPEC→DESIGN→IMPLEMENT→REVIEW）→ `adfp-`
- 流程调度与任务管理 → `adfo-`
- 辅助分析、建议、审查 → `adfa-`
- 独立工具、不参与开发流程 → `adft-`

格式统一：`<前缀><功能描述>`，小写 + 连字符。禁止驼峰、下划线、空格。

**技能注册中心**：`.claude/skills/README.md` — 所有技能的唯一索引源。`adfa-dev-helper` 和 `adfo-harness-runner` 从此读取映射关系，避免硬编码。

---

## 技能基准规范

此节定义所有技能必须满足的结构标准。新建、集成、修改均以此为校验基准。

### 1. 文件结构

```
.claude/skills/adf<type>-<name>/
├── SKILL.md              # 主文件，<500 行（必须）
├── test/
│   └── evals.md          # 评估用例（必须）
├── templates/
│   └── custom.md         # 技能特有配置（可选）
├── references/           # >300 行的参考内容抽取至此（可选）
├── scripts/              # 可执行脚本（可选）
├── agents/               # 子代理指令（可选）
└── assets/               # 静态资源（可选）
```

### 2. SKILL.md 格式

```yaml
# Front-matter（必须）
---
name: adf<type>-<name>
description: "<一句话描述>。TRIGGER: <触发词>。Use proactively when: <主动场景>。"
---
```

正文结构（推荐）：
```
# 标题
## 核心流程         # 做什么、怎么做
## 约束规则         # 行为边界
## 模板注入         # 共享配置引用 + 特有配置
```

### 3. 模板配置

**共享配置唯一源**：`adfo-harness-runner/templates/custom.md`（技术栈、目录约定、命名约定）。

其他技能只定义**本技能特有配置**，并在 SKILL.md 末尾声明：

```markdown
## 模板注入
> 共享配置由 `adfo-harness-runner/templates/custom.md` 统一管理。
`templates/custom.md` — 本技能特有的{配置类型}
```

### 4. 测试

每个技能必须有 `test/evals.md`：

```markdown
# {技能名} - 评估用例

## 核心场景
| # | 场景 | 预期行为 | 验证方式 |
|---|------|---------|---------|

## 边界测试
| # | 边界情况 | 预期处理 |
|---|---------|---------|

## 集成测试
| # | 上下游技能 | 集成点 | 预期 |
|---|----------|--------|------|
```

---

## 新建技能流程

```
用户需求 → adft-skill-creator → 草稿 → 校验 → 交付
```

| 步骤 | 动作 | 说明 |
|------|------|------|
| **0. 创建** | 调用 `adft-skill-creator` | **唯一入口**，禁止手动从零编写 SKILL.md |
| **1. 校验** | 逐项对照「质量门」检查清单 | 不通过 → 修改草稿 → 重新校验 |
| **2. 配置收敛** | 共享配置引用 harness-runner | 特有配置写入本技能的 templates/custom.md |
| **3. 职责去重** | 按「职责去重决策树」检测重叠 | 无重叠或边界清晰后通过 |
| **4. 文档同步** | 按「文档同步规则」同步 docs | 创建详情页 + 更新注册中心 + 更新 docs 索引 |
| **5. 交付** | 全部检查项通过 | 技能就绪 |

`adft-skill-creator` 负责生成雏形（调用官方 skill-creator 引擎 + 应用 adf 命名 + 生成基础结构），本规范负责校验集成。

---

## 集成外部技能流程

外部技能 = 非本项目原生创建的技能（全局技能、其他项目、技能市场、AI 生成）。

### 第一步：检查现有工作流

**在决定前缀之前，必须先理解现有技能生态。**

```
1. 读取 .claude/skills/README.md（技能注册中心）获取所有技能清单
2. 读取 .claude/skills/ 下各 SKILL.md 的 front-matter 确认职责细节
3. 分析外部技能与现有工作流的关系
```

**判定标准**——外部技能是否能嵌入前端开发的生命周期？

| 能嵌入的场景 | 判定 | 示例 |
|-------------|------|------|
| 可作为流水线某一阶段的输入/输出 | `adfp-` 流水线 | SPEC→DESIGN→IMPLEMENT |
| 流程调度/任务编排 | `adfo-` 编排 | harness-runner、task-orchestrator |
| 可辅助流水线阶段（审查、分析、建议） | `adfa-` 辅助 | code-reviewer、hooks-extractor |
| 可在多个阶段被调用（测试、上下文理解） | `adfa-` 辅助 | edge-case-master、code-context |
| 完全独立，不参与任何开发流程 | `adft-` 工具 | wiki生成器、git提交助手 |

### 第二步：集成决策

判定能集成后，确认是否值得：

| 维度 | 集成 | 不集成 |
|------|------|--------|
| 复用频率 | 2+ 场景需要 | 一次性使用 |
| 团队共享 | 团队通用 | 个人偏好 |

### 第三步：执行集成

```
外部技能
  │
  ├─ 工作流检查 → 判定 adfp-/adfo-/adfa-/adft-
  │
  ├─ 集成决策 → 不值得 → 放弃
  │
  ├─ 合规检查 → 不通过 → 说明风险 → 用户决定
  │   - 命名可改为 adf 格式？
  │   - 职责清晰且不与现有技能高度重叠？
  │   - SKILL.md < 500 行？
  │   - 无硬编码技术栈/框架？
  │   - 来源可审计？
  │   - 有或愿意补充 test/？
  │
  ├─ 适配改造
  │   ├─ 命名：应用 adf 前缀
  │   ├─ 结构：补全 test/evals.md + templates/custom.md
  │   └─ 配置：adfp/adfo/adfa → 引用 harness-runner；adft → 按需
  │
  ├─ 职责去重 → 按决策树处理
  │
  ├─ 文档同步 → docs/skills/<prefix>-<name>.md + 更新 README.md
  │
  └─ 验证 → 质量门全部通过
```

**集成后**即为本项目一等技能，遵循本规范全部规则。原始来源更新不自动同步。

### 工具技能（adft-）特殊规则

| 维度 | adfp/adfo/adfa（流水线/编排/辅助） | adft-（独立工具） |
|------|-----------------------------------|----------------|
| harness 集成 | ✅ 阶段映射 | ❌ 不接入 |
| phase-registry | ✅ 需更新 | ❌ 不涉及 |
| adfa-dev-helper 索引 | 已内置 | **必须添加** |
| 模板注入 | 引用 harness-runner | 可选，按需 |

---

## 职责去重决策树

### 发现重叠（5 维度对比）

| 维度 | 检查方式 |
|------|---------|
| 触发词 | 是否被现有技能覆盖？ |
| 输入 | 接受相同输入类型？ |
| 输出产物 | 产出相同类型的文件/结果？ |
| 目标阶段 | 服务同一开发阶段？ |
| 核心动作 | 执行相同关键操作？ |

**现有技能速查**：以 `.claude/skills/README.md`（技能注册中心）为唯一索引源。

### 判定重叠级别

| 级别 | 标准 |
|------|------|
| **高度重叠** | 触发词 + 核心动作 + 输出产物 三者均重叠 |
| **中度重叠** | 核心动作重叠，但输入/输出/阶段不同 |
| **低度重叠** | 仅触发词相似，核心动作不同 |
| **无重叠** | 5 维度均不重叠 |

### 按场景决策

```
高度重叠？
  ├─ 外部更好 → 【替换】备份 → 删除现有 → 集成外部 → 更新引用
  └─ 外部不更好 →
        ├─ 外部有局部优势 → 【合并】将优势点合入现有技能，不创建新技能
        └─ 现有更完善 → 【零操作】不做任何事，告知用户即可

中度重叠？ → 【共存】双方添加职责边界表 + 互设引用 + 消除歧义触发词

低度重叠？ → 【集成】正常集成，注明触发词差异

外部是现有子集？ → 【合并】合入现有技能，不独立创建

现有是外部子集？ → 【替换】按替换流程，额外检查上下游兼容性
```

**质量比较标准**（替换判定时逐项打分）：

| 维度 | 权重 |
|------|------|
| 功能完整度（边界 case、异常处理、输出完整度） | 30% |
| 结构规范（文件结构、行数限制） | 20% |
| 可维护性（清晰度、模板分离、注释） | 20% |
| 测试覆盖（evals.md 场景覆盖） | 15% |
| 流水线兼容（适配 harness-runner 阶段调度） | 15% |

### 冲突处理原则

1. **零操作优先** — 现有更好则不动，不制造无价值变更
2. **用户确认优先** — 删除/替换必须确认
3. **最小破坏** — 选对流水线影响最小的方案
4. **渐进优于推翻** — 能改现有就不新建
5. **回滚准备** — 替换前备份

---

## 质量门

### 检查清单

- [ ] 新建技能已通过 `adft-skill-creator` 创建
- [ ] 命名符合 `adfp-<name>` / `adfo-<name>` / `adfa-<name>` / `adft-<name>` 规范
- [ ] 前缀选择正确（adfp=流水线, adfo=编排, adfa=辅助, adft=工具）
- [ ] description 含 TRIGGER 和 Use proactively when
- [ ] SKILL.md < 500 行
- [ ] 有 test/evals.md
- [ ] 共享配置引用 harness-runner
- [ ] 模板注入仅含技能特有配置
- [ ] 职责边界清晰，无功能重叠
- [ ] docs/skills/ 对应文档已同步
- [ ] **`.claude/skills/README.md` 注册中心已同步**（技能增/删/触发词变更/职责变更时必须）
- [ ] docs 含「依赖关系」章节（上游+下游）
- [ ] docs 含「流程生命周期」章节（触发条件+生命周期图+产物状态）
- [ ] docs 含「在完整流水线中的位置」（流水线技能）
- [ ] **产物 front-matter 阶段字段与当前阶段一致**— 编排器 SUMMARY 步骤将校验 `phase` 字段
- [ ] **产物包含实质性内容**（≥50 字符正文，不只有 front-matter）

### 禁止项

- ❌ 无 `adf` 前缀
- ❌ 前缀选择错误
- ❌ 新建技能手动从零编写（必须通过 `adft-skill-creator`）
- ❌ SKILL.md > 500 行
- ❌ 硬编码技术栈/库名
- ❌ 与现有技能职责重叠
- ❌ 模板预设默认框架
- ❌ 缺失 front-matter
- ❌ 未同步 docs 文档
- ❌ test/ 目录为空
- ❌ 技能变更未同步 `.claude/skills/README.md` 注册中心

---

## 文档同步规则

**SKILLS 变更必须同步 docs 和 `.claude/skills/README.md` 注册中心，反之亦然。**

| 变更 | 同步操作 |
|------|---------|
| 新建技能 | 创建 `docs/skills/adf<type>-<name>.md` + 更新注册中心 |
| 修改 SKILL.md | 同步更新 docs 详情页 + 若触发词/职责变更则更新注册中心 |
| 修改触发词 | 更新 docs 的触发词字段 + 更新注册中心 |
| 修改职责边界 | 更新 docs 的职责边界说明 + 若影响分类则更新注册中心 |
| 修改阶段映射 | 更新 `phase-registry.md` + docs + 注册中心 |
| 删除技能 | 移除 docs 详情页 + 从注册中心移除 |
| 修改模板 | 更新 docs 的模板注入说明 |

### docs 详情页模板

```markdown
# adf<type>-<name>
> 一句话描述

## 基本信息
| 属性 | 值 |
|------|-----|
| **名称** | adf<type>-<name> |
| **类型** | 流水线 / 编排 / 辅助 / 工具 |
| **前缀** | adfp- / adfo- / adfa- / adft- |
| **触发词** | ... |
| **文件位置** | .claude/skills/adf<type>-<name>/SKILL.md |

## 核心特性
## 使用方式
## 依赖关系（必须）       # 上游依赖 + 下游消费
## 流程生命周期（必须）    # 触发条件 + 生命周期图 + 产物状态
## 工作流程
## 与现有技能的职责边界    # 若与其他技能有交集时必须
## 约束规则
## 模板注入
## 测试用例
```

### 依赖关系要求

每个 docs 详情页必须包含「依赖关系」章节：

| 关系类型 | 说明 |
|---------|------|
| `前置输入` | 该技能的产物是本技能的输入材料 |
| `后置消费` | 本技能的产物是该技能的输入材料 |
| `可选触发` | 特定条件下触发本技能 |
| `修复循环` | 发现问题后回退到本技能修复 |
| `编排调度` | harness-runner 调度本技能（所有流水线技能均有此项） |
| `建议下游` | 本技能报告中建议调用的技能 |

**要求**：
- 流水线技能（`adfp-`）必须列出上游和下游客
- 辅助技能（`adfa-`）至少列出下游消费
- 编排技能（`adfo-harness-runner`）列出所有被编排技能
- 工具技能（`adft-`）仅在有实际依赖时列出

### 流程生命周期要求

每个 docs 详情页必须包含「流程生命周期」章节：

- **触发条件**：自动触发 / 手动触发 / 下游回调
- **生命周期图**：输入 → 步骤 → 输出 + 异常路径
- **在完整流水线中的位置**：`INIT → ... → 【本阶段】 → ... → DONE`（流水线技能必须）
- **产物状态**：产物名 → 路径 → 状态流转

### 同步检查清单

- [ ] 基本信息表完整（名称、类型、前缀、触发词、文件位置）
- [ ] **依赖关系**：上游依赖 + 下游消费 均已列出
- [ ] **流程生命周期**：触发条件 + 生命周期图 + 产物状态
- [ ] 流水线技能含「在完整流水线中的位置」
- [ ] 与其他技能有交集时含「职责边界」表
- [ ] 模板注入说明正确
- [ ] 测试用例引用正确

---

## 状态管理

`docs/workflows/{任务ID}/state.json` 是唯一状态源。编排器每次决策前必须读取此文件。写入使用原子操作（先写 `.tmp.json`，成功后 `mv` 覆盖），每次写入前备份为 `.backup.json`。

### state.json 核心字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 任务唯一标识 |
| `currentPhase` | enum | 当前阶段 |
| `phaseHistory` | array | 阶段执行历史 |
| `retryCount` | integer | 当前阶段重试次数 |
| `blockers` | array | 阻塞项列表 |
| `skippedPhases` | array | 被跳过的阶段列表（快速查询），从 phaseHistory 中 status=skipped 派生 |
| `checkpoint` | object | 断点恢复快照 |

### 读写规则

1. **读取时机**：启动时、阶段切换前、阶段完成后
2. **写入时机**：INIT 完成、每阶段 SUMMARY 后、回退完成
3. **原子写入**：先写 `state.tmp.json`，成功后 `mv` 覆盖
4. **备份**：每次写入前备份为 `state.backup.json`
5. **skippedPhases 同步**：每阶段被标记 skipped 时同步追加到 `skippedPhases` 数组

---

## 目录结构

```
skills/
  README.md                     # 技能注册中心（唯一索引源）
  adf*-*/SKILL.md               # 各技能主文件
  adf*-*/references/            # >300行的参考内容抽取至此
  adf*-*/templates/custom.md    # 技能特有配置
  adf*-*/test/evals.md          # 评估用例
docs/
  skills/README.md              # 技能文档索引
  skills/adf*-*.md              # 每个技能一个详情页
  workflows/{任务ID}/           # 工程模式产物（含 state.json）
  skill-evaluation/             # 技能质量评估框架（含 test-data 测试数据）
```

---

## 关键约束

- 技能 SKILL.md 修改后必须同步更新 `docs/skills/` 对应文档和 `.claude/skills/README.md` 注册中心
- 职责去重决策树：新建技能前必须检查与现有技能的 5 维度重叠
- `IMPLEMENT` 阶段是唯一不可跳过的流水线阶段
- `IMPLEMENT` 阶段不走三步模式的「引导用户调用」路径——编排器必须主动执行 DAG 调度
- task-orchestrator 不负责需求解析和任务拆解，只负责调度执行
- **阶段跳过时必须同步更新 `state.json.skippedPhases`**，供下游技能快速判断上游产物是否可用
- **SUMMARY 步骤对产物执行三判定**：phase 一致性、内容实质性（≥50字符）、qualityGate 值
- 所有回答必须使用中文
