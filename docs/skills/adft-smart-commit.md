# adft-smart-commit

> 智能 Git 提交助手，分析未提交的文件变更并自动选择最优提交策略。根据文件数量、类别多样性和变更复杂度，智能决定使用 Quick Commit（单提交）或 Batch Commit（多提交）。

---

## 基本信息

| 属性 | 值 |
|------|-----|
| **名称** | adft-smart-commit |
| **类型** | 工具 |
| **前缀** | adft- |
| **触发词** | `commit`、`smart commit`、`batch commit`、`organize commits`、`分类提交`、`智能提交`、`提交代码` |
| **文件位置** | .claude/skills/adft-smart-commit/SKILL.md |
| **代码行数** | 270 行 |

---

## 核心特性

### 6 步智能提交流程

```
分析变更 → 选择策略 → 分类文件 → 生成提交 → 执行提交 → 输出报告
```

### 双策略模式

| 策略 | 条件 | 行为 |
|------|------|------|
| **Quick Commit** | 1-5同类文件、diff<300行、单一意图 | 单次提交 |
| **Batch Commit** | 多类别、多文件、含特殊artifact | 按分类分组，多个提交 |

### Conventional Commits 格式

`<type>(<scope>): <description>`

支持类型：feat、fix、docs、style、refactor、test、chore

---

## 使用方式

```
# 简单提交
"commit"

# 智能批量提交
"smart commit" / "分类提交"

# 强制批量
"把这些改动分成多个提交"

# 组织化提交
"organize commits"
```

---

## 依赖关系

### 上游依赖（本技能依赖谁）

| 技能 | 关系类型 | 说明 |
|------|---------|------|
| 无 | 独立触发 | 本技能为 adft- 前缀独立工具，不依赖其他技能 |

### 下游消费（谁依赖本技能）

| 技能 | 关系类型 | 说明 |
|------|---------|------|
| 无 | 直接执行 | Git 提交直接执行，不产生下游技能依赖的产物 |

### 外部建议触发

| 来源 | 触发场景 |
|------|---------|
| adfp-code-reviewer | 审查 PASS 后建议调用本技能提交代码 |
| adfa-dev-helper | 开发完成后推荐使用本技能 |
| 用户 | 手动触发："commit"、"smart commit"、"分类提交"、"智能提交" |

---

## 流程生命周期

### 触发条件

- **手动触发**："commit"、"smart commit"、"batch commit"、"organize commits"、"分类提交"、"智能提交"、"提交代码"
- **建议触发**：code-reviewer PASS 后建议提交
- **任意阶段可用**：只要有未提交变更即可使用，不参与流水线阶段

### 生命周期图

```
用户触发 / adfp-code-reviewer 建议
              ↓
    ┌─────────────────────────────────────────┐
    │         adft-smart-commit 执行流程         │
    │                                         │
    │  1. 分析变更                             │
    │     ├─ git status 扫描未提交文件          │
    │     ├─ git diff 分析变更内容             │
    │     └─ 识别文件类别和变更复杂度           │
    │              ↓                          │
    │  2. 选择策略                             │
    │     ├─ Quick Commit：1-5同类文件          │
    │     │   diff<300行、单一意图 → 单次提交    │
    │     └─ Batch Commit：多类别、多文件       │
    │         含特殊artifact → 多个分组提交      │
    │              ↓                          │
    │  3. 分类文件                             │
    │     ├─ 按功能模块分组                     │
    │     ├─ 按变更类型分组                     │
    │     └─ 相关文件聚合（组件+CSS+测试）       │
    │              ↓                          │
    │  4. 生成提交                             │
    │     ├─ 生成 Conventional Commits 消息     │
    │     └─ 格式：<type>(<scope>): <desc>     │
    │              ↓                          │
    │  5. 执行提交                             │
    │     ├─ git add 分组文件                   │
    │     └─ git commit -m "..."               │
    │              ↓                          │
    │  6. 输出报告                             │
    │     └─ 中文报告：提交数量、文件列表、摘要   │
    └─────────────────────────────────────────┘
              ↓
        Git 提交记录（永久保留）
```

### 产物状态

| 产物 | 路径 | 状态流转 |
|------|------|---------|
| Git 提交记录 | Git 历史 | 创建 → 团队共享 → 永久保留 |

---

## 工作流程

### Quick Commit 流程

```
输入：1-5个同类文件、diff<300行、单一意图
      ↓
分析：确认变更属于同一功能/修复
      ↓
生成：单个 Conventional Commit 消息
      ↓
执行：git add . && git commit -m "..."
      ↓
输出：提交摘要报告
```

### Batch Commit 流程

```
输入：多类别文件、多文件、含特殊artifact
      ↓
分析：按功能模块、变更类型分类
      ↓
分组：
  ├─ 组1：feat(auth) - 登录相关文件
  ├─ 组2：fix(ui) - 样式修复文件
  └─ 组3：chore(deps) - 依赖更新
      ↓
生成：多个 Conventional Commit 消息
      ↓
执行：逐组 git add && git commit
      ↓
输出：批量提交报告（提交数量、文件分组）
```

---

## 与现有技能的职责边界

| 技能 | 边界说明 |
|------|---------|
| adfo-harness-runner | harness-runner 管理**流水线阶段**（INIT→PRD→SPEC→DESIGN→IMPLEMENT→REVIEW→DONE），adft-smart-commit 管理**Git 提交**（独立工具，不参与流水线） |
| adfa-dev-helper | dev-helper 做进度速览和场景分析（只读），adft-smart-commit 处理具体 Git 操作（写入） |
| adfp-code-reviewer | code-reviewer 审查代码质量，adft-smart-commit 在审查通过后组织提交（建议下游） |
| adft-page-wiki-generator | 两者都是 adft- 前缀独立工具，互不依赖，各自独立触发执行 |

---

## 约束规则

1. **分析优先**：先理解变更再提交，不盲目执行
2. **语义准确**：提交消息必须反映真实意图，禁止模糊描述
3. **相关聚合**：组件+CSS+测试一起提交，保持原子性
4. **不相关分离**：不同功能分开提交，避免混合意图
5. **中文描述**：输出报告使用中文，便于理解
6. **Conventional Commits**：严格遵守 `<type>(<scope>): <description>` 格式
7. **独立执行**：不依赖流水线状态，只要有未提交变更即可触发

---

## 模板注入

> 本技能为独立工具（adft-），不接入 adfo-harness-runner 的流水线共享配置。

### 配置文件

`templates/custom.md` — 项目路径映射、artifact 规则、分类优先级、策略参数阈值配置。

### 可配置参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| quick_commit_threshold | 5 | Quick Commit 文件数量阈值 |
| diff_line_threshold | 300 | Quick Commit diff 行数阈值 |
| group_by_feature | true | 按功能模块分组 |
| group_by_type | true | 按变更类型分组 |

---

## 测试用例

详见 `.claude/skills/adft-smart-commit/test/evals.md`。

### 测试场景概览

| 场景 | 预期策略 | 验证点 |
|------|---------|--------|
| 单文件修改 | Quick Commit | 单次提交，消息准确 |
| 3个相关组件文件 | Quick Commit | 相关聚合，单次提交 |
| 10个多类别文件 | Batch Commit | 按类别分组，多次提交 |
| 混合功能+样式+测试 | Batch Commit | 功能分离，相关聚合 |
| 依赖更新单独文件 | Quick/Batch | 根据数量决定策略 |
