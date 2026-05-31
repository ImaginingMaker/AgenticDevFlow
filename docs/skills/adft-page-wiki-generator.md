# adft-page-wiki-generator

> 页面关键链路分析与Wiki自动生成技能（独立工具，不参与前端开发流水线）。

---

## 基本信息

| 属性 | 值 |
|------|-----|
| **名称** | adft-page-wiki-generator |
| **类型** | 工具 |
| **前缀** | adft- |
| **触发词** | `解析页面生成Wiki`、`生成代码文档`、`分析页面链路`、`批量生成Wiki`、`为这个页面写文档`、`分析这个组件的链路`、`关键链路`、`页面Wiki`、`代码Wiki`、`链路分析` |
| **文件位置** | .claude/skills/adft-page-wiki-generator/SKILL.md |
| **阶段** | 无（不参与流水线） |
| **上游** | 无（独立触发） |
| **下游** | 无（Wiki文档直接输出） |

---

## 核心特性

### Main Agent + 6 SubAgent 并发架构

```
Main Agent（轻量解析+上下文构建+调度）
  ├─ SubAgent 1: 初始化链路分析
  ├─ SubAgent 2: 业务操作链路分析
  ├─ SubAgent 3: 分支跳转链路分析
  ├─ SubAgent 4: 异常处理链路分析
  ├─ SubAgent 5: 组件结构分析
  └─ SubAgent 6: 数据流分析
```

### 生成 8 章标准化 Wiki

1. 页面基础信息、2. 路由与入口链路、3. 核心业务链路（初始化/操作/跳转）、4. 组件结构与依赖、5. 数据流与状态管理、6. 接口请求规范、7. 权限/埋点/异常处理、8. 维护与变更记录

### 双模式

| 模式 | 说明 |
|------|------|
| 单页面 | 解析指定文件，生成单页 Wiki |
| 批量 | 遍历目录下所有页面，批量生成 |

### 文档优先策略

先读取 README.md / CLAUDE.md / docs/ 构建项目上下文，再解析代码，保证 Wiki 与项目规范一致。

---

## 使用方式

```
# 单页面
"解析 src/views/user/list.vue，生成 Wiki"

# 批量
"解析 src/views/user 下所有页面，批量生成 Wiki"
```

---

## 依赖关系

### 上游依赖（本技能依赖谁）

| 技能 | 关系类型 | 说明 |
|------|---------|------|
| 用户 | 手动触发 | "解析页面生成Wiki"、"生成代码文档"、"分析页面链路"、"批量生成Wiki"、"为这个页面写文档"、"分析这个组件的链路" |
| `adfa-dev-helper` | 建议下游 | dev-helper 在场景分析时可能推荐本技能 |

### 下游消费（谁依赖本技能）

本技能为独立文档工具（adft-），不接入流水线，无下游技能依赖其产物。

### 内部委托

| 委托目标 | 委托内容 | 说明 |
|---------|---------|------|
| `adfo-task-orchestrator` | 6维度并发分析 | Main Agent 构建上下文后，委托 orchestrator 并发调度 6 个 SubAgent |

---

## 流程生命周期

### 触发条件

- **手动触发**："解析页面生成Wiki"、"分析页面链路"、"批量生成Wiki"、"为这个页面写文档"、"分析这个组件的链路"
- **任意阶段可用**：作为独立工具，不限开发阶段

### 生命周期图

```
用户指定页面/目录
      ↓
本技能：
  Phase 0: 读取项目文档 → 构建项目上下文
  Phase 1: Main Agent 基础解析（路由、组件、API、状态）
  Phase 2: 委托 adfo-task-orchestrator 并发 6 维度分析
           ├─ 初始化链路分析
           ├─ 业务操作链路分析
           ├─ 分支跳转链路分析
           ├─ 异常处理链路分析
           ├─ 组件结构分析
           └─ 数据流分析
  Phase 3: Main Agent 汇总合并 → 生成完整 Wiki → 同步 docs/wiki/
```

### 产物状态

| 产物 | 路径 | 状态流转 |
|------|------|---------|
| 页面 Wiki 文档 | `docs/wiki/` | 创建 → 团队参考 → 随代码更新 |

---

## 工作流程

```
Phase 0: 读取项目文档 → 构建项目上下文
Phase 1: Main Agent 基础解析（路由、组件引入、API、状态管理）
Phase 2: 委托 adfo-task-orchestrator 并发调度 6 个 SubAgent（各负责 1-2 章）
Phase 3: Main Agent 汇总合并 → 生成完整 Wiki → 同步到 docs/wiki/
```

---

## 与现有技能的职责边界

| 维度 | adfp-architecture-designer | adft-page-wiki-generator |
|------|--------------------------|------------------------|
| 分析目的 | 为实施做架构规划 | 为文档做链路记录 |
| 输出 | 依赖图、文件层级规划 | 标准化 Wiki 文档 |
| 触发阶段 | ARCHITECTURE | 任意阶段（独立工具） |
| 接入 harness | ✅ 流水线第 3 阶段 | ❌ 不接入 |

---

## 约束规则

1. 文档优先：先读项目文档，再解析代码
2. Main Agent 只做轻量解析，重分析交 SubAgent
3. SubAgent 必须通过 adfo-task-orchestrator 并发启动
4. 每个 SubAgent 接收完整项目上下文
5. 输出格式标准化，便于合并
6. 生成后校验章节完整性和内容准确性

---

## 模板注入

> 本技能为独立工具（adft-），不接入 harness 流水线。

`agents/` — 6 个 SubAgent 指令
`references/` — 代码解析 / 文档解析 / 链路分析 / Wiki 结构规范

---

## 测试用例

详见 `.claude/skills/adft-page-wiki-generator/test/evals.md`。
