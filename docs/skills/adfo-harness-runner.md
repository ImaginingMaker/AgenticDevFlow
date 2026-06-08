# adfo-harness-runner

> 前端开发工程化编排器。管理完整的正向交付流水线（INIT→PRD→SPEC→DESIGN→IMPLEMENT→REVIEW→DONE）和反向反馈循环，提供跨会话状态持久化、断点恢复、多任务编排。TRIGGER: 用户说'启动工程模式'、'harness'、'编排器'、'工程化开发'、'走完整流程'、'正规开发'、'流水线开发'、'启动harness'。Use proactively when: 用户准备正式开始项目开发，需要完整的工程化流程管理与状态追踪。

---

## 基本信息

| 属性 | 值 |
|------|-----|
| **名称** | adfo-harness-runner |
| **类型** | 编排技能（元技能） |
| **前缀** | adfo-（阶段级编排） |
| **触发词** | `启动工程模式`、`harness`、`编排器`、`工程化开发`、`走完整流程`、`正规开发`、`流水线开发`、`启动harness` |
| **文件位置** | `skills/adfo-harness-runner/SKILL.md` |
| **代码行数** | 388 行 |
| **配套文件** | 6 个 references 文件 + 1 个 templates 文件 |

---

## 核心特性

### 1. 正向交付流水线

```
INIT → ANALYZE → PRD → SPEC → ARCHITECTURE → DESIGN → IMPLEMENT → REVIEW → DONE
  │       │       │      │         │            │          │           │
  └       └       └      └         └            └          └           └
自动    可跳过  可跳过  可跳过    可跳过       可跳过    不可跳过     可跳过
```

各阶段调度对应原子技能（完整定义见 [phase-registry.md](references/phase-registry.md)）。

### 2. 两阶模式（CLI 编译驱动）

LLM 执行前运行 `harness-cli context <taskId>` 获取编译后的执行上下文（含下一阶段决策、上游产物状态、精确调用指令）。
完成内容生成后运行 `harness-cli verify <taskId> <phase> <artifact>` 自动校验产物并更新状态。

LLM 只负责内容生成，不做任何文件操作或状态管理。

### 3. 反向反馈循环

```
REVIEW FAIL             ──→ IMPLEMENT（附 blockers 列表）
REVIEW 交互缺陷         ──→ adfa-ux-interaction-checker → IMPLEMENT（附 ux-review.md）
IMPLEMENT 设计冲突      ──→ DESIGN / ARCHITECTURE
DESIGN 方向偏离         ──→ ARCHITECTURE / SPEC
```

详见 [feedback-loop.md](references/feedback-loop.md)。

> **交互缺陷专线**：REVIEW 阶段发现交互类缺陷时，不走常规回退，而是先调用 `adfa-ux-interaction-checker` 做专项扫描，输出 `ux-review.md` 注入 blockers 后再回退到 IMPLEMENT 修复。

### 4. 状态管理

`docs/workflows/{任务ID}/state.json` 是唯一状态源：
- `currentPhase`：当前阶段
- `phaseHistory`：阶段执行历史
- `techStack`：项目技术栈（framework/uiLibrary/styling/stateManagement 等）
- `blockers`：阻塞项列表
- `skippedPhases`：被跳过的阶段列表（快速查询）
- `checkpoint`：断点恢复快照（含文件 SHA-256）
- `retryCount`：重试计数

详见 [state-schema.md](references/state-schema.md)。

### 5. 编排器内置职责

- **IMPLEMENT 阶段 DAG 调度**：编排器主动执行 4 步流程 — ①解析 architecture.md 依赖图（含单模块简化路径）→ ②拓扑排序生成任务清单 → ③委托 adfo-task-orchestrator 并发执行 → ④汇总结果 + 失败策略处理
- **阶段注册中心**：阶段枚举和技能映射的唯一配置源

详见 [implement-phase.md](references/implement-phase.md)。

### 6. 工程模式 vs 敏捷模式

| 维度 | 工程模式（harness） | 敏捷模式（独立技能） |
|------|-------------------|---------------------|
| 状态持久化 | ✅ state.json | ❌ 无 |
| 断点恢复 | ✅ checkpoint 恢复 | ❌ 每次全新 |
| 反馈循环 | ✅ blockers → 回退 | ❌ 无 |
| 速度 | 慢（每阶段确认） | 快（直接执行） |
| 适用 | 正式项目 | 快速原型、单点任务 |

---

## 使用方式

### 启动

```
"启动工程模式" / "启动harness"
```

### 继续任务

```
"继续开发" → 扫描活跃任务 → 选择 → 从 currentPhase 恢复
```

### 任务管理

```
"查看所有任务" → 按状态分组展示
"切换任务"     → 保存当前 → 加载目标
"删除任务"     → 二次确认（仅终态可删）
```

---

## 依赖关系

### 上游依赖（本技能依赖谁）

| 技能 | 关系类型 | 说明 |
|------|---------|------|
| 无 | 顶级入口 | harness-runner 是流水线的顶级入口，由用户直接触发 |

### 下游消费（谁依赖本技能）

| 技能 | 关系类型 | 阶段 | 说明 |
|------|---------|------|------|
| `adfp-requirement-analyzer` | 编排调度 | ANALYZE | 需求分析阶段调度，可跳过 |
| `adfp-prd-generator` | 编排调度 | PRD | PRD 生成阶段调度，可跳过 |
| `adfp-spec-generator` | 编排调度 | SPEC | 技术规格生成阶段调度，可跳过 |
| `adfp-architecture-designer` | 编排调度 | ARCHITECTURE | 架构设计阶段调度，可跳过 |
| `adfp-component-designer` | 编排调度 | DESIGN | 组件设计阶段调度，可跳过 |
| `adfo-task-orchestrator` | 编排调度 | IMPLEMENT | DAG 任务调度 |
| `adfp-code-implementer` | 执行单元 | IMPLEMENT | 被 adfo-task-orchestrator 调用 |
| `adfp-code-reviewer` | 编排调度 | REVIEW | 代码审查阶段调度，可跳过 |
| `adfa-ux-interaction-checker` | **反馈循环** | REVIEW→IMPLEMENT | REVIEW 发现交互缺陷时调用，输出 ux-review.md 作为修复指引 |

## 流程生命周期

### 触发条件

- **手动触发**："启动工程模式"、"harness"、"流水线开发"
- **继续触发**："继续开发" → 扫描活跃任务 → 从 currentPhase 恢复

### 完整流水线生命周期

```
用户触发 → INIT（创建任务+state.json）
              ↓
         ANALYZE（adfp-requirement-analyzer）→ 可跳过
              ↓
         PRD（adfp-prd-generator）→ 可跳过
              ↓
         SPEC（adfp-spec-generator）→ 可跳过
              ↓
         ARCHITECTURE（adfp-architecture-designer）→ 可跳过
              ↓
         DESIGN（adfp-component-designer）→ 可跳过
              ↓
         IMPLEMENT（adfo-task-orchestrator + adfp-code-implementer）→ 不可跳过
              ↓
         REVIEW（adfp-code-reviewer）→ 可跳过
              ↓
         DONE
```

### 阶段流转规则

| 阶段 | 可跳过 | 产物 | 质量门 |
|------|--------|------|--------|
| INIT | 否 | state.json | 任务创建成功 |
| ANALYZE | 是 | analysis.md | 需求澄清完成 |
| PRD | 是 | prd.md | PRD 结构完整 |
| SPEC | 是 | spec.md | 技术规格完整 |
| ARCHITECTURE | 是 | architecture.md | 依赖图完整 |
| DESIGN | 是 | design.md | 组件树完整 |
| IMPLEMENT | **否** | 源代码文件 | 代码可运行 |
| REVIEW | 是 | review.md | 无阻塞问题 |
| DONE | 否 | - | 所有阶段完成 |

### 产物状态

| 产物 | 路径 | 状态流转 |
|------|------|---------|
| 任务状态 | `docs/workflows/{任务ID}/state.json` | 创建 → 更新 → DONE/FAILED |
| 各阶段产物 | `docs/workflows/{任务ID}/*.md` | 创建 → 消费 → 归档 |

---

## 工作流程

### 标准工作流程

```
用户触发 → INIT 阶段（创建 state.json，含 techStack）
              ↓
         两阶模式循环（context → EXECUTE → verify）
              ↓
         DONE 阶段（生成终态报告）
```

### Harness CLI

`scripts/harness-cli.js` — 编排器编译器，所有机械操作集中在此。

| 命令 | 功能 | 运行时机 |
|------|------|---------|
| `harness-cli list` | 列出所有任务（按状态分组） | 启动时 |
| `harness-cli status <taskId>` | 查看任务详细状态 | 继续任务前 |
| `harness-cli context <taskId>` | **编译执行上下文供 LLM 消费** | 每阶段执行前 |
| `harness-cli verify <taskId> <phase> <file>` | 校验产物 + 原子写 state | 每阶段执行后 |
| `harness-cli init <name> [--desc=...] [--tech=...] [--skip=...]` | 创建新任务，自动生成 state.json 含 techStack | 新任务创建时 |

**所有原子技能在工程模式下通过 CLI 获取状态**：
- 执行前：`node scripts/harness-cli.js context <taskId>` 获取编译后指令
- 执行后：`node scripts/harness-cli.js verify <taskId> <phase> <artifact>` 校验产物

CLI 零外部依赖（纯 Node.js 内置模块），位于 `skills/adfo-harness-runner/scripts/`。

### 断点恢复流程

```
"继续开发" → 扫描活跃任务 → 选择 → 读取 state.json → 从 checkpoint 恢复
```

### 反馈循环处理

详见 [feedback-loop.md](references/feedback-loop.md)。

---

## 与现有技能的职责边界

### 编排器 vs 原子技能

| 维度 | adfo-harness-runner | 原子技能 |
|------|-------------------|---------|
| 职责 | 流程管理、状态追踪 | 具体任务执行 |
| 状态 | 读写 state.json | 无状态 |
| 决策 | 阶段流转 | 单阶段技术决策 |

### 编排器 vs adfo-task-orchestrator

| 维度 | adfo-harness-runner | adfo-task-orchestrator |
|------|-------------------|---------------------|
| 调度粒度 | 阶段级 | 任务级 |
| 状态持久化 | 跨会话持久化 | 会话内临时 |
| 反馈循环 | 支持阶段回退 | 不支持回退 |
| IMPLEMENT 阶段 | 解析依赖图、生成清单 | 接收清单、DAG 调度 |

---

## 约束规则

1. **每次决策前必须读取 state.json**
2. state.json 写入使用原子操作
3. checkpoint 必须包含文件 SHA-256 校验
4. 编排器**不做具体实现**
5. 阶段切换必须校验流转规则
6. **回退前必须用户确认**
7. IMPLEMENT 阶段不可跳过
8. FAILED 后需人工介入

---

## 测试用例

| # | 场景 | 预期行为 |
|---|------|---------|
| 1 | 完整流水线执行 | 所有阶段产物存在，状态 DONE |
| 2 | 阶段跳过 | 被跳过阶段标记 SKIPPED，后续正常 |
| 3 | 反馈循环 | blockers 记录、retryCount 增加 |
| 4 | 断点恢复 | currentPhase 恢复、checkpoint 校验通过 |
| 5 | 最大重试次数 | 状态 FAILED、等待人工介入 |
| 6 | 多任务切换 | 状态保存、目标任务加载 |

---

## 文件结构

```
skills/adfo-harness-runner/
├── SKILL.md                           # 主文件（本文档）
├── scripts/
│   └── harness-cli.js                # 🔧 Harness 编译器 CLI（核心，~450行）
├── references/
│   ├── state-schema.md                # state.json 完整 JSON Schema
│   ├── phase-registry.md              # 阶段枚举+映射唯一源
│   ├── implement-phase.md             # IMPLEMENT 阶段 DAG 调度详解
│   ├── feedback-loop.md               # 反向反馈循环
│   ├── error-handling.md              # 异常处理
│   └── orchestrator-integration-check.md  # 编排器集成检查报告
├── templates/
│   └── custom.md                      # 共享配置主文件
└── test/
    ├── harness-cli.test.js            # CLI 集成测试（21 用例）
    ├── evals.md                       # 评估用例
    └── fixtures/                      # 测试夹具（3 种任务状态，均含 techStack）
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