# IMPLEMENT 阶段 DAG 调度详解

IMPLEMENT 是唯一不可跳过的阶段，且需要编排器主动执行 DAG 调度。

> 本文档从 SKILL.md 抽取，由 adfo-harness-runner 主文件引用。

---

## 执行流程

```
Step 1: 解析依赖图 → Step 2: 生成任务清单 → Step 3: 委托 adfo-task-orchestrator → Step 4: 汇总结果
```

---

## Step 1: 解析依赖图

读取 `architecture.md` 的「模块依赖图」章节，提取：
- 所有模块名称
- 模块间依赖关系（depends on → ...）
- 并行识别标记（可并行开发的模块组）

**异常处理**：

| 情况 | 处理 |
|------|------|
| `architecture.md` 缺失 | 按 design.md 组件树顺序执行（降级） |
| 依赖图不完整 | 提示用户补充或降级为顺序执行 |
| 单模块 | 跳过 DAG 调度，直接调用 adfp-code-implementer |

---

## Step 2: 生成任务清单

按拓扑排序将依赖图转换为 `adfo-task-orchestrator` 的任务清单格式：

```markdown
## 任务清单
| ID | 描述 | Agent类型 | 提示词 | 依赖 |
|----|------|-----------|--------|------|
| T1 | 实现 Button | adfp-code-implementer | 基于 design.md 实现 Button 组件... | - |
| T2 | 实现 Input | adfp-code-implementer | 基于 design.md 实现 Input 组件... | - |
| T3 | 实现 SearchBar | adfp-code-implementer | 基于 design.md 实现 SearchBar... | T1,T2 |
| T4 | 实现 UserTable | adfp-code-implementer | 基于 design.md 实现 UserTable... | T1 |
| T5 | 实现 UserListPage | adfp-code-implementer | 组装 SearchBar + UserTable... | T3,T4 |

## 执行参数
- 最大并发数: 3
- 单任务超时: 300s
- 失败策略: abort
```

### 拓扑排序规则

1. **叶子节点**（无依赖的原子模块）→ 第一并发组
2. **中间节点**按依赖层级递增
3. **根节点**（页面/入口）→ 最后执行

### 提示词模板

```
你是代码实现代理。任务：实现 {模块名} 模块。

上下文来源：
- 设计文档：docs/workflows/{任务ID}/design.md
- 架构文档：docs/workflows/{任务ID}/architecture.md
- 技术栈：{从 state.json.techStack 读取}

要求：
1. 严格遵循 design.md 的组件设计
2. 输出文件路径遵循 architecture.md 的文件层级蓝图
3. 完成后输出实现的文件列表

{若依赖上游任务} 上游已完成：{上游模块的文件列表}
```

---

## Step 3: 委托 adfo-task-orchestrator

调用 `adfo-task-orchestrator` Skill，发送任务清单和执行参数。

编排器在此步骤**等待编排器返回执行报告**，不自行调度。

---

## Step 4: 汇总结果

接收 `adfo-task-orchestrator` 的执行报告：

| 执行结果 | 处理方式 |
|---------|---------|
| **全部成功** | 合并文件列表 → 更新 state.json → 生成 implementation.md → 进入 REVIEW |
| **部分失败** | 记录 blockers → 按失败策略处理（abort/retry/continue） |
| **全部失败** | currentPhase = FAILED，停止流水线 |

### 失败策略详解

| 策略 | 行为 |
|------|------|
| `abort` | 停止，标记 phaseHistory IMPLEMENT `status: "failed"` |
| `retry` | 重试失败任务（最多 maxRetries 次） |
| `continue` | 跳过失败任务，继续下游（仅适用于非关键模块） |

---

## 单模块简化路径

若依赖图分析结果只有 1 个模块：

1. **不调用 adfo-task-orchestrator**
2. 直接调用 `adfp-code-implementer`，传入 design.md + architecture.md
3. 等待完成后进入 REVIEW

---

## 与 phase-registry.md 的关系

`phase-registry.md` §八 包含本阶段的简要说明，本文档是详细展开。
