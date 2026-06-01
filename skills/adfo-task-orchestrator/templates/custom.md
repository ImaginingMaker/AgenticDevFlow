# adfo-task-orchestrator 特有配置

## 执行参数默认值

| 参数 | 默认值 | 说明 |
|------|--------|------|
| 最大并发数 | 4 | 同一并发组最多同时执行的 SubAgent 数量 |
| 单任务超时 | 120s | 单个 SubAgent 最大执行时间 |
| 总超时 | 600s | 所有任务的总体超时 |
| 失败策略 | continue | continue（继续无依赖任务）/ abort（全部停止）/ retry（重试） |
| 最大重试次数 | 2 | 失败策略=retry 时的最大重试次数 |
| 汇总模式 | auto | auto（编排器自动汇总）/ manual（调用方自行汇总） |

## SubAgent 类型支持

编排器不预设 SubAgent 角色，以下为 Claude Code 原生支持的类型：

| Agent类型 | 适用场景 |
|-----------|---------|
| general-purpose | 通用任务执行 |
| Explore | 代码搜索/文件定位 |
| Plan | 架构设计/方案规划 |

调用方 SKILL 可指定任何有效的 SubAgent 类型。

## 上下文传递规则

| 参数 | 默认值 | 说明 |
|------|--------|------|
| 传递模式 | summary | summary（仅摘要）/ full（完整输出）/ none（不传递） |
| 摘要最大长度 | 500 字符 | 传递给下游的摘要截断长度 |
