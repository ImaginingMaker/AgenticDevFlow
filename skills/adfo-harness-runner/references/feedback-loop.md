# 反向反馈循环

当阶段执行失败或发现设计冲突时，流水线进入反向反馈流程，回退到上游阶段修复。

> 本文档从 SKILL.md 抽取，由 adfo-harness-runner 主文件引用。

---

## 触发场景

```
REVIEW FAIL             ──→ IMPLEMENT（附 blockers 列表）
REVIEW 交互缺陷         ──→ adfa-ux-interaction-checker → IMPLEMENT（附 ux-review.md）
IMPLEMENT 设计冲突      ──→ DESIGN / ARCHITECTURE
DESIGN 方向偏离         ──→ ARCHITECTURE / SPEC
ARCHITECTURE 不合理     ──→ SPEC
PRD 需求背景不清        ──→ ANALYZE
```

> 完整回退规则见 `phase-registry.md` §四。

---

## 新增反馈路径：交互缺陷专线

当 REVIEW 阶段发现交互类缺陷（如缺少空状态、操作无反馈、Tab 切换数据不刷等）时，不走常规回退，而是先调用 `adfa-ux-interaction-checker` 做专项扫描。

### 触发条件

REVIEW 阶段 reviewer 输出报告中包含明确的交互缺陷，且用户确认需要修复。

### 执行流程

```
REVIEW 发现交互缺陷
  │
  ├─ 1. 编排器展示 UX 缺陷概况
  ├─ 2. 用户确认触发专项扫描
  ├─ 3. 调用 adfa-ux-interaction-checker
  │     ├─ 输入：review-report.md（交互缺陷块）+ 源码
  │     ├─ 模式：Smart 模式自动检测环境
  │     └─ 输出：ux-review.md
  ├─ 4. 审核 ux-review.md
  ├─ 5. 注入 blockers
  │     └─ state.json.blockers[] 追加 ux-review.md 中的 P0/P1 缺陷
  └─ 6. 回退到 IMPLEMENT（修复模式）
        └─ adfp-code-implementer 接收 ux-review.md 作为修复指引
```

### 产物

| 产物 | 路径 |
|------|------|
| UX 交互缺陷专项报告 | `docs/workflows/{任务ID}/ux-review.md` |

### 与常规回退的区别

| 维度 | 常规回退（REVIEW → IMPLEMENT） | 交互缺陷专线 |
|------|-------------------------------|-------------|
| **触发条件** | qualityGate = fail | reviewer 标记交互缺陷 |
| **前置步骤** | 无 | 调用 adfa-ux-interaction-checker 专项扫描 |
| **修复指引** | blockers 列表 | ux-review.md（结构化缺陷报告） |
| **适用范围** | 任何 REVIEW 失败 | 仅交互/UX 类缺陷 |

---

## 反馈执行流程

### Step 1: 确认回退

向用户展示：
- 回退原因
- 目标阶段
- 影响范围（将被删除的产物文件）

### Step 2: 记录 blockers

写入 `state.json.blockers[]`：

```json
{
  "phase": "REVIEW",
  "issue": "缺少空状态处理",
  "severity": "high",
  "resolved": false
}
```

### Step 3: 清理产物

删除回退目标阶段及之后的所有产物文件。

例如 REVIEW → IMPLEMENT：删除 `review-report.md`，保留 IMPLEMENT 产物。

### Step 4: 更新状态

- `currentPhase` → 回退目标阶段
- `retryCount` += 1
- `phaseHistory` 追加 `status: "retrying"`

### Step 5: 注入上下文

将 blockers 列表传递给目标阶段的原子技能，作为修复指引。

---

## 重试限制

| 条件 | 行为 |
|------|------|
| `retryCount < maxRetries` | 正常回退，继续执行 |
| `retryCount >= maxRetries` | `currentPhase = FAILED`，停止自动流程 |
| FAILED 状态 | 需人工介入修复后手动重置 `currentPhase` |

**maxRetries 默认值**：3

---

## FAILED 状态修复指引

当任务进入 FAILED 状态后，需人工介入：

### 诊断问题

1. 查看 `state.json.blockers[]` 了解失败原因
2. 查看 `phaseHistory` 中 `status: "failed"` 的阶段详情

### 修复方式

**方式一**：修复问题后重置状态

编辑 state.json：
- `currentPhase: "INIT"` 或目标阶段
- `retryCount: 0`
- `blockers: []`

**方式二**：删除任务重新开始

```bash
删除 docs/workflows/{任务ID}/ 目录
```

### 常见失败原因及对策

| 失败原因 | 对策 |
|---------|------|
| 产物文件缺失 | 手动补充缺失文件，或回退到对应阶段重试 |
| 质量门持续 fail | 检查 blockers 列表，逐项修复后重置 |
| 状态文件损坏 | 从 state.backup.json 恢复，或重新初始化 |
| 外部依赖问题 | 解决依赖问题后，重置 retryCount 继续 |

---

## 约束规则

1. **回退前必须用户确认**，展示影响范围
2. 回退时必须清理后续阶段的产物
3. FAILED 后不自动修复，需人工介入
4. 重试次数达到上限后停止自动流程
