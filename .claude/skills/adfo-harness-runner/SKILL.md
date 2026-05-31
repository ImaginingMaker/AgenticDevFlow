---
name: adfo-harness-runner
description: "前端开发工程化编排器。管理完整的正向交付流水线（INIT→PRD→SPEC→DESIGN→IMPLEMENT→REVIEW→DONE）和反向反馈循环，提供跨会话状态持久化、断点恢复、多任务编排。TRIGGER: 用户说'启动工程模式'、'adfo-harness'、'编排器'、'工程化开发'、'走完整流程'、'正规开发'、'流水线开发'、'启动harness'。Use proactively when: 用户准备正式开始项目开发，需要完整的工程化流程管理与状态追踪。"
---

# 前端开发 Harness 编排器

工程化开发模式入口。**编排器不做具体实现**——只管理流程、追踪状态、协调调度。具体工作由原子 adf 技能完成。

## 工程模式 vs 敏捷模式

| 维度 | 工程模式（本技能） | 敏捷模式（独立 adf 技能） |
|------|-------------------|-------------------------|
| 状态持久化 | ✅ state.json 唯一状态源 | ❌ 无状态 |
| 断点恢复 | ✅ checkpoint 自动恢复 | ❌ 每次全新开始 |
| 反馈循环 | ✅ blockers → 回退 → 修复 | ❌ 无反馈机制 |
| 进度追踪 | ✅ 完整 phaseHistory | ❌ 无 |
| 速度 | 慢（每阶段需用户确认） | 快（直接执行） |
| 适用场景 | 正式项目开发、复杂需求 | 快速原型、单点任务、探索 |

**两种模式互补**：不确定方案时先用敏捷模式快速验证，确定后走工程模式正式交付。

---

## 一、启动流程

### Step 1: 扫描活跃任务

扫描 `docs/workflows/` 下所有 `state.json` 文件，过滤非终态任务（currentPhase ≠ `DONE` 且 ≠ `FAILED`）。

### Step 2: 展示任务列表

```
📋 活跃开发任务

| # | 任务 | 当前阶段 | 最后更新 |
|---|------|---------|---------|
| 1 | 登录页面 | DESIGN | 2026-05-23 14:30 |
| 2 | 用户列表 | IMPLEMENT | 2026-05-22 10:00 |

操作：
  [编号] — 继续该任务
  new   — 创建新任务
  del N — 删除任务（不可恢复，需二次确认）
  list  — 显示全部任务（含已完成/失败）
```

无活跃任务时直接进入新建流程。

### Step 3a: 继续已有任务

1. 读取 `docs/workflows/{任务ID}/state.json`
2. 校验 `checkpoint.filesSnapshot` 与磁盘文件是否一致
3. 展示进度仪表盘（当前阶段、已完成阶段、blockers、retryCount）
4. 从 `currentPhase` 继续——若该阶段已完成则推进到下一阶段

### Step 3b: 创建新任务

1. **参数来源优先级**：
   - 命令行参数（如 `--name=user-module --desc=用户管理模块`）
   - 用户交互式输入
2. 生成任务 ID：`YYYYMMDD-{任务名}`
3. 创建目录 `docs/workflows/{任务ID}/`
4. 进入 INIT 阶段

**命令行参数支持**：
```
--name=<任务名称>    英文缩写，如 login-page（必填）
--desc=<任务描述>    一句话描述（可选）
--skip=<阶段列表>    跳过的阶段，逗号分隔，如 PRD,SPEC（可选）
--tech=<技术栈>      指定技术栈，如 react-ts, vue3（可选）
```

---

## 二、正向交付流水线

```
INIT → ANALYZE → PRD → SPEC → ARCHITECTURE → DESIGN → IMPLEMENT → REVIEW → DONE
  │       │        │      │         │            │          │          │
  └       └        └      └         └            └          └          └
自动   可跳过   可跳过  可跳过   可跳过       可跳过    不可跳过    可跳过
```

> 完整流转规则见 [phase-registry.md](references/phase-registry.md)。

**核心约束**：
- **IMPLEMENT 不可跳过**（没有代码就没有产物）
- 回退只能到 `rollbackTo` 指定的阶段
- 跳过时 phaseHistory 记录 `status: "skipped"` + `skipEvidence`
- INIT 和 DONE 不可手动进入
- FAILED 只能从 retryCount ≥ maxRetries 产生

---

## 三、三步模式（每阶段固定流程）

### 步骤 1: PREVIEW（预览）

展示即将执行的阶段信息，等待用户确认：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 阶段预览：{阶段名}（{N}/{总阶段数}）

目标：{阶段目标}
方式：{执行步骤概要}
技能：/{技能名}
产物：{文件列表}
预计：{预估时间/复杂度}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
操作：[y] 继续  [skip] 跳过  [stop] 暂停
```

### 步骤 2: EXECUTE（执行）

生成精确调用指令，引导用户调用对应原子技能：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 执行：{阶段名}

📦 上游产物状态：
  {✅/❌} {上游产物1} — docs/workflows/{任务ID}/{产物1}
  {✅/❌} {上游产物2} — docs/workflows/{任务ID}/{产物2}

🎯 调用目标：/{技能名}
📤 输出目标：docs/workflows/{任务ID}/{产物名}
📋 模式：{工程模式 / 敏捷模式（上游已跳过）}
💡 说明：{阶段目标简述}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

调用完成后告知我（如"{阶段名}完成了"），我将校验产物并更新状态。

> **跳过阶段说明**：若上游某个阶段被跳过，对应产物标记 ❌ 且不存在。下游技能应以**敏捷模式**运行，跳过阶段的内容由用户现场补充说明。

> **产物路径说明**：工程模式下产物必须写入 `docs/workflows/{任务ID}/` 目录。SUMMARY 步骤会校验该路径下的产物文件。

**编排器在此步骤不做事**——等待用户调用原子技能并返回结果。

> **例外：IMPLEMENT 阶段**不适用上述模式。IMPLEMENT 是编排器内置阶段，需要编排器**主动**解析 architecture.md 依赖图、生成任务清单、委托 adfo-task-orchestrator 执行 DAG 调度。详见 [四 → IMPLEMENT 阶段](#implement-阶段编排器内置-dag-调度)。

### 步骤 3: SUMMARY（总结）

1. **读取产物**：确认产物文件是否存在预期路径 `docs/workflows/{任务ID}/{产物名}`
2. **解析 front-matter**：提取 `phase`、`status`、`qualityGate` 字段
3. **校验质量门**：
   - `phase` 字段是否与当前流水线阶段一致（如 PRD 阶段产物中 `phase: PRD`）— 不一致则标记为 `warn`
   - 产物文件除 front-matter 外是否有**实质性内容**（≥50 字符正文）— 仅有 front-matter 视为 `warn`
   - `qualityGate` 值判定 — 见 [phase-registry.md](references/phase-registry.md) §五
4. **更新 state.json**：追加 phaseHistory 记录
   - 若阶段被跳过，同步追加到 `skippedPhases` 数组
5. **展示阶段总结**：完成状态、产物清单、下一阶段预告

---

## 四、阶段→技能映射

> **唯一索引源**：`.claude/skills/README.md` 是技能注册中心。完整映射见 [phase-registry.md](references/phase-registry.md) §二。

| 阶段 | 技能 | 产物 |
|------|------|------|
| INIT | 编排器内置 | `state.json` |
| ANALYZE | `adfp-requirement-analyzer` | `requirement-analysis.md` |
| PRD | `adfp-prd-generator` | `prd.md` |
| SPEC | `adfp-spec-generator` | `spec.md` |
| ARCHITECTURE | `adfp-architecture-designer` | `architecture.md` |
| DESIGN | `adfp-component-designer` | `design.md` |
| IMPLEMENT | 编排器内置（DAG调度） | 源码 + `implementation.md` |
| REVIEW | `adfp-code-reviewer` | `review-report.md` |
| DONE | 编排器内置 | 终态报告 |

### INIT 阶段（编排器内置）

创建 `state.json` 初始结构。详见 [state-schema.md](references/state-schema.md)。

### IMPLEMENT 阶段（编排器内置 DAG 调度）

IMPLEMENT 是唯一不可跳过的阶段，需要编排器主动执行 DAG 调度。此阶段**不走三步模式的「引导用户调用」路径**——编排器必须自己完成以下 4 步：

> 详细参考见 [implement-phase.md](references/implement-phase.md)。

#### Step 1: 解析依赖图

读取 `architecture.md` 的「模块依赖图」章节，提取所有模块名称和依赖关系。

| 情况 | 处理 |
|------|------|
| `architecture.md` 存在且依赖图完整 | 正常解析，进入 Step 2 |
| `architecture.md` 缺失 | 降级：按 design.md 组件树顺序执行 |
| 依赖图不完整 | 提示用户补充，或降级为顺序执行 |
| **只有 1 个模块** | **走单模块简化路径**：跳过 Step 2-3，直接调用 `adfp-code-implementer`，传入 design.md + architecture.md，完成后进入 REVIEW |

#### Step 2: 生成任务清单

按拓扑排序将依赖图转换为 adfo-task-orchestrator 的任务清单格式：

- **叶子节点**（无依赖的原子模块）→ 第一并发组
- **中间节点**按依赖层级递增
- **根节点**（页面/入口）→ 最后执行

```markdown
| ID | 描述 | Agent类型 | 提示词 | 依赖 |
|----|------|-----------|--------|------|
| T1 | 实现 Button | adfp-code-implementer | 基于 design.md 实现... | - |
| T2 | 实现 SearchBar | adfp-code-implementer | 基于 design.md 实现... | T1 |
```

每个任务的提示词必须包含：design.md 路径、architecture.md 路径、技术栈（从 state.json.techStack 读取）、上游模块文件列表（如有依赖）。

#### Step 3: 委托 adfo-task-orchestrator

调用 `adfo-task-orchestrator` Skill，发送任务清单 + 执行参数（最大并发数、单任务超时、失败策略）。

编排器**等待 adfo-task-orchestrator 返回执行报告**，不自行调度 SubAgent。

#### Step 4: 汇总结果

| 执行结果 | 处理方式 |
|---------|---------|
| 全部成功 | 合并文件列表 → 更新 state.json → 生成 `implementation.md` → 进入 REVIEW |
| 部分失败 | 记录 blockers，按失败策略处理：`abort`（停止标记 failed）/ `retry`（重试最多 maxRetries 次）/ `continue`（跳过失败任务继续下游） |
| 全部失败 | 标记 `currentPhase = FAILED`，停止流水线 |

### DONE 阶段（编排器内置）

汇总全部阶段生成终态报告。

---

## 五、状态管理协议

> 详见 [state-schema.md](references/state-schema.md)。

### 唯一状态源

`docs/workflows/{任务ID}/state.json` 是唯一状态源。编排器的**每次决策前必须读取此文件**。

### 核心字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 任务唯一标识 |
| `currentPhase` | enum | 当前阶段 |
| `phaseHistory` | array | 阶段执行历史 |
| `retryCount` | integer | 当前阶段重试次数 |
| `blockers` | array | 阻塞项列表 |
| `checkpoint` | object | 断点恢复快照 |

### 读写规则

1. **读取时机**：启动时、阶段切换前、阶段完成后
2. **写入时机**：INIT 完成、每阶段 SUMMARY 后、回退完成
3. **原子写入**：先写 `state.tmp.json`，成功后 `mv` 覆盖
4. **备份**：每次写入前备份为 `state.backup.json`

---

## 六、反向反馈循环

> 详见 [feedback-loop.md](references/feedback-loop.md)。

当阶段执行失败或发现设计冲突时，流水线进入反向反馈流程。

**触发场景**：
```
REVIEW FAIL        ──→ IMPLEMENT
IMPLEMENT 设计冲突 ──→ DESIGN / ARCHITECTURE
DESIGN 方向偏离    ──→ ARCHITECTURE / SPEC
```

**核心流程**：确认回退 → 记录 blockers → 清理产物 → 更新状态 → 注入上下文

---

## 七、多任务管理

### 任务列表

扫描 `docs/workflows/` 下所有目录，按状态分组：
- 🔵 活跃（INIT/PRD/SPEC/ARCHITECTURE/DESIGN/IMPLEMENT）
- 🟡 审查中（REVIEW WARN）
- 🔴 阻塞（REVIEW FAIL / FAILED）
- ✅ 已完成（DONE）

### 任务切换

1. 保存当前任务状态
2. 加载目标任务 state.json
3. 从目标任务 currentPhase 继续

### 任务删除

- 仅可删除 DONE / FAILED 终态任务
- 活跃任务需先标记 FAILED 再删除
- 需用户二次确认

---

## 八、异常处理

> 详见 [error-handling.md](references/error-handling.md)。

| 异常场景 | 处理方式 |
|---------|---------|
| 产物缺失 | 标记 failed，提示重新执行 |
| 状态文件损坏 | 从 backup 恢复或重新初始化 |
| Checkpoint 不一致 | 展示差异，询问用户 |
| 用户中断 | 保存状态，等待恢复 |
| 质量门缺失 | 视为 warn，提示确认 |

---

## 九、约束规则

1. 编排器**不做具体实现**——只管理流程、追踪状态、协调调度
2. **每次决策前必须读取 state.json**，不依赖对话记忆
3. 阶段切换必须校验流转规则
4. **回退前必须用户确认**，展示影响范围
5. IMPLEMENT 阶段不可跳过
6. FAILED 后不自动修复，需人工介入
7. state.json 写入使用原子操作
8. 与原子技能的关系：编排器调度，原子技能执行

---

## 十、项目技术栈识别

### 已有项目

启动时自动扫描项目根目录，识别现有技术栈：

```
检测顺序：
1. package.json → dependencies/devDependencies
2. tsconfig.json → TypeScript 配置
3. 框架配置文件（next.config.* / vite.config.* 等）
4. 样式配置文件（tailwind.config.* 等）
5. 目录结构（src/pages/ / src/components/ 等）
```

识别结果存入 `state.json.techStack`。

### 新项目

INIT 阶段向用户询问技术栈偏好。

### 原则

- **已有项目**：以检测到的实际技术栈为准
- **新项目**：由用户指定，编排器不做默认选择

---

## 模板注入

`templates/custom.md` — 项目特定的流水线配置：

```markdown
# 流水线自定义配置

## 阶段配置
- 跳过的阶段：{PRD / SPEC / DESIGN / REVIEW}
- 最大重试次数：{默认 3}

## 技术栈（新项目时填写，已有项目自动检测）
- 框架：{用户指定}
- UI 库：{用户指定}
- 样式方案：{用户指定}
- 状态管理：{用户指定}

## 质量门自定义
- REVIEW 阶段额外检查项
- 自定义 qualityGate 判定规则
```

---

## 文件结构

```
.claude/skills/adfo-harness-runner/
├── SKILL.md                           # 主文件（本文档）
└── references/
    ├── state-schema.md                # state.json 完整 JSON Schema
    ├── phase-registry.md              # 阶段枚举+映射唯一源
    ├── implement-phase.md             # IMPLEMENT 阶段 DAG 调度详解
    ├── feedback-loop.md               # 反向反馈循环
    ├── error-handling.md              # 异常处理
    └── orchestrator-integration-check.md  # 编排器集成检查报告
```

---

## 相关文档

- [状态管理规范](references/state-schema.md)
- [阶段注册中心](references/phase-registry.md)
- [IMPLEMENT 阶段详解](references/implement-phase.md)
- [反向反馈循环](references/feedback-loop.md)
- [异常处理](references/error-handling.md)
- [编排器集成检查报告](references/orchestrator-integration-check.md)
- [自定义配置模板](templates/custom.md)
