# adfo-task-orchestrator

> 通用 DAG 任务编排执行器。接收任何 SKILL 产出的结构化任务清单（含依赖关系），自动构建 DAG 拓扑、识别并发组、按拓扑顺序调度 SubAgent 并发或串行执行，最后汇总所有结果。不负责需求解析和任务拆解——这些由调用方 SKILL 完成。

---

## 基本信息

| 属性 | 值 |
|------|-----|
| **名称** | adfo-task-orchestrator |
| **类型** | 编排 |
| **阶段** | 任务级（被其他技能调用） |
| **前缀** | adfo-（任务级编排） |
| **触发词** | `并发执行`、`并行处理`、`编排任务`、`调度执行` |
| **文件位置** | skills/adfo-task-orchestrator/SKILL.md |

---

## 核心特性

### 定位

**基础设施层**——不负责需求解析和任务拆解，只负责将调用方 SKILL 的任务清单按 DAG 拓扑调度执行。

```
调用方 SKILL（规划任务） → task-orchestrator（调度执行） → 返回汇总报告
```

### 5 步执行流程

```
解析任务清单 → 构建 DAG → 识别并发组 → 调度执行 → 汇总结果
```

### 并发调度

```
T1 → T2 → T4
T1 → T3 → T5

并发组1: [T1]
并发组2: [T2, T3]  ← 并行
并发组3: [T4, T5]  ← 并行
```

### 失败策略

| 策略 | 行为 |
|------|------|
| continue | 单任务失败后继续无依赖任务 |
| abort | 全部停止 |
| retry | 自动重试失败任务 |

---

## 使用方式

### 作为调用方 SKILL

```markdown
→ 调用 adfo-task-orchestrator Skill，发送任务清单：

## 任务清单
| ID | 描述 | Agent类型 | 提示词 | 依赖 |
|----|------|-----------|--------|------|
| T1 | ... | general-purpose | ... | - |
| T2 | ... | general-purpose | ... | T1 |
```

### 使用编排器的技能

| 技能 | 场景 |
|------|------|
| adfa-critical-explorer | 6 维度并发批判分析 |
| adfp-architecture-designer | 5 个 SubAgent 代码扫描 |
| adfp-requirement-analyzer | 3 个 SubAgent 需求分析 |
| adfo-harness-runner | IMPLEMENT 阶段 DAG 调度（多模块并发实现） |
| adfp-code-reviewer | 多维度并发代码审查 |
| adfa-code-analysis (mode:extract) | 多模式并发提取分析 |
| adfa-edge-case-master | 边界用例并发生成 |
| adft-page-wiki-generator | 多页面并发 Wiki 生成 |
| 任何需并发 SubAgent 的技能 | 委托任务调度 |

---

## 依赖关系

### 上游依赖（调用方提供任务清单）

| 技能 | 关系类型 | 说明 |
|------|---------|------|
| adfo-harness-runner | 调用方 | IMPLEMENT 阶段 DAG 调度时委托本技能执行 |
| adfa-critical-explorer | 调用方 | 6 维度并发批判分析时委托本技能调度 |
| adfp-architecture-designer | 调用方 | 5 个 SubAgent 代码扫描时委托本技能调度 |
| adfp-requirement-analyzer | 调用方 | 3 个 SubAgent 需求分析时委托本技能调度 |
| adfp-code-reviewer | 调用方 | 多维度并发代码审查时委托本技能调度 |
| adfa-code-analysis (mode:extract) | 调用方 | 多模式并发提取分析时委托本技能调度 |
| adfa-edge-case-master | 调用方 | 边界用例并发生成时委托本技能调度 |
| adft-page-wiki-generator | 调用方 | 多页面并发 Wiki 生成时委托本技能调度 |

### 下游消费（汇总结果返回调用方）

| 技能 | 关系类型 | 说明 |
|------|---------|------|
| 调用方技能 | 后置消费 | 各 SubAgent 执行结果汇总后返回给调用方 |

---

## 流程生命周期

### 触发条件

- **内部调用**：由其他技能（如 critical-explorer、architecture-designer）在需要并发调度 SubAgent 时调用
- **手动触发**：用户说"并发执行"、"并行处理"、"编排任务"、"调度执行"

### 生命周期图

```
调用方 SKILL（规划任务清单）
      ↓
┌─────────────────────────────────────────────────────────┐
│  本技能内部流程：                                         │
│  1. 解析任务清单 → 验证格式、提取依赖关系                  │
│  2. 构建 DAG → 拓扑排序、检测循环依赖                     │
│  3. 识别并发组 → 按依赖层级分组                           │
│  4. 调度执行 → 按组串行、组内并发                         │
│  5. 汇总结果 → 合并各 SubAgent 输出                       │
└─────────────────────────────────────────────────────────┘
      ↓
返回汇总报告给调用方

失败策略：
  ├─ continue → 单任务失败后继续无依赖任务
  ├─ abort → 全部停止
  └─ retry → 自动重试失败任务
```

### 在技能生态中的位置

```
本技能为基础设施层 — 不负责规划，只负责执行调度
任何需要并发 SubAgent 的技能都可委托本技能
```

### 产物状态

| 产物 | 路径 | 状态流转 |
|------|------|---------|
| 任务执行报告 | 对话内输出 | 输出 → 调用方消费 → 丢弃 |

---

## 工作流程

### 输入格式

调用方需提供结构化任务清单：

```markdown
## 任务清单

| ID | 描述 | Agent类型 | 提示词 | 依赖 |
|----|------|-----------|--------|------|
| T1 | 分析组件结构 | general-purpose | "分析以下组件..." | - |
| T2 | 检查类型安全 | general-purpose | "检查 TypeScript 类型..." | T1 |
| T3 | 性能分析 | general-purpose | "分析性能瓶颈..." | T1 |
| T4 | 生成报告 | general-purpose | "汇总分析结果..." | T2,T3 |
```

### 执行流程

```
Step 1: 解析任务清单
  ├─ 验证必填字段（ID、描述、Agent类型、提示词）
  ├─ 解析依赖关系（支持多依赖，逗号分隔）
  └─ 构建任务映射表

Step 2: 构建 DAG
  ├─ 拓扑排序（Kahn 算法）
  ├─ 检测循环依赖（拒绝执行）
  └─ 计算任务层级

Step 3: 识别并发组
  ├─ 同层级无相互依赖的任务归为同一并发组
  └─ 输出执行计划

Step 4: 调度执行
  ├─ 按并发组顺序串行执行
  ├─ 组内任务并发执行（上限可配置，默认 4）
  └─ 收集各任务结果

Step 5: 汇总结果
  ├─ 合并所有 SubAgent 输出
  ├─ 标记成功/失败状态
  └─ 返回结构化报告
```

### 输出格式

```markdown
## 任务执行报告

### 执行摘要
- 总任务数: 4
- 成功: 3
- 失败: 1
- 总耗时: 45s

### 任务详情

#### T1: 分析组件结构 ✅
- 耗时: 12s
- 结果: ...

#### T2: 检查类型安全 ✅
- 耗时: 8s
- 结果: ...

#### T3: 性能分析 ❌
- 耗时: 15s
- 错误: 超时

#### T4: 生成报告 ⏭️
- 状态: 跳过（依赖任务 T3 失败）
```

---

## 与现有技能的职责边界

| 技能 | 边界 |
|------|------|
| adfo-harness-runner | harness-runner 管理**阶段级**流水线（INIT→PRD→SPEC→DESIGN→IMPLEMENT→REVIEW→DONE）。在 IMPLEMENT 阶段，harness-runner 解析 architecture.md 的依赖图，生成任务清单，**委托 task-orchestrator 执行 DAG 调度** |
| adfp-code-implementer | 在 IMPLEMENT 阶段作为 task-orchestrator 的**执行单元**，每个任务节点调用一次 adfp-code-implementer |
| adfp-requirement-analyzer | requirement-analyzer 负责任务拆解和规划，task-orchestrator 负责执行调度 |
| adfa-critical-explorer | critical-explorer 定义分析维度和 prompt，task-orchestrator 调度执行 |
| adfp-architecture-designer | architecture-designer 定义扫描维度和 prompt，task-orchestrator 调度执行 |
| adfp-code-reviewer | code-reviewer 定义审查维度和 prompt，task-orchestrator 调度执行 |
| adfa-code-analysis (mode:extract) | code-analysis (mode:extract) 定义提取模式和 prompt，task-orchestrator 调度执行 |
| adfa-edge-case-master | edge-case-master 定义用例生成策略，task-orchestrator 调度执行 |
| adft-page-wiki-generator | page-wiki-generator 定义页面分析策略，task-orchestrator 调度执行 |

---

## 约束规则

1. **不解析需求、不拆解任务**——任务清单由调用方提供
2. **不定义角色**——SubAgent 类型由调用方指定
3. **最大并发上限**——默认 4，可配置
4. **循环依赖拒绝执行**——检测到循环依赖立即报错终止
5. **上下文最小化传递**——只传递任务必需的上下文，避免膨胀
6. **双重超时保护**——单任务超时 + 总体超时双重限制
7. **失败隔离**——单任务失败不影响无依赖的其他任务（continue 策略）

---

## 模板注入

> 共享配置由 `adfo-harness-runner/templates/custom.md` 统一管理。

`templates/custom.md` — 执行参数默认值：

```yaml
task-orchestrator:
  max_concurrency: 4        # 最大并发数
  task_timeout: 120s        # 单任务超时
  total_timeout: 600s       # 总体超时
  failure_strategy: continue # 失败策略: continue | abort | retry
  retry_count: 2            # 重试次数（retry 策略时生效）
```

---

## 测试用例

详见 `skills/adfo-task-orchestrator/test/evals.md`。

### 基础测试场景

| 场景 | 输入 | 预期输出 |
|------|------|---------|
| 线性依赖 | T1→T2→T3 | 串行执行，顺序正确 |
| 并发执行 | T1→(T2,T3)→T4 | T2/T3 并发，T4 等待 |
| 循环依赖 | T1→T2→T1 | 拒绝执行，报错 |
| 单任务失败 | T1→T2(失败)→T3 | T3 跳过（依赖失败） |
| 无依赖失败 | T1→T2, T3(失败) | T1/T2 正常执行 |

### 边界测试场景

| 场景 | 输入 | 预期输出 |
|------|------|---------|
| 空任务清单 | [] | 返回空报告 |
| 单任务 | [T1] | 正常执行 |
| 超并发上限 | 10 个无依赖任务 | 分批执行，每批 4 个 |
| 超时任务 | T1(超时) | 标记失败，继续后续 |
