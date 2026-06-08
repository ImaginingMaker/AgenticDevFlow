# adft-page-wiki-generator 技能特有配置

> 本技能为独立工具（adft-），不接入 harness 流水线。
> 此文件定义本技能特有的配置项。

---

## SubAgent 任务模板

```yaml
subAgents:
  - id: "init-link"
    description: "初始化链路分析"
    type: "general-purpose"
  - id: "business-link"
    description: "业务操作链路分析"
    type: "general-purpose"
  - id: "branch-link"
    description: "分支跳转链路分析"
    type: "general-purpose"
  - id: "error-handling"
    description: "异常处理链路分析"
    type: "general-purpose"
  - id: "component-structure"
    description: "组件结构分析"
    type: "general-purpose"
  - id: "data-flow"
    description: "数据流分析"
    type: "general-purpose"
```

## 并发调度策略

```yaml
parallelism:
  simple:      # 页面 < 100 行
    count: 2
    mergeStrategy: "combine-related"
  medium:      # 页面 100-500 行
    count: 6
    mergeStrategy: "full-separate"
  complex:     # 页面 > 500 行
    count: 6
    mergeStrategy: "full-separate"
```

## Wiki 输出路径

```yaml
output:
  wikiRoot: "docs/wiki/"
  indexFile: "总目录.md"
  pageStructure:
    - index.md
    - assets/
```

## 项目文档读取优先级

```yaml
documents:
  P0:
    - README.md
    - CLAUDE.md
  P1:
    - docs/README.md
    - docs/architecture.md
    - docs/api.md
  P2:
    - docs/business/*.md
    - docs/technical/*.md
```

## SubAgent 任务分配原则

```yaml
taskAssignment:
  - independence: true      # 每个 SubAgent 任务相互独立
  - balance: true           # 任务粒度相近，避免长尾等待
  - completeness: true      # 所有任务覆盖 Wiki 全部章节
  - contextPassing: true    # 每个 SubAgent 都接收项目上下文
```
