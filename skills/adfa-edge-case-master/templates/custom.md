# adfa-edge-case-master — 技能特有配置

> 本技能无需额外模板配置。测试框架由项目技术栈自动检测（详见 SKILL.md「平台感知」章节）。
>
> 共享配置由 `adfo-harness-runner/templates/custom.md` 统一管理。

## 产物路径（工程模式）

| 上下文 | 输出路径 |
|--------|---------|
| `docs/workflows/{taskID}/` | 测试报告产物目录 |

## 协作配置

| 协作技能 | 配置说明 |
|---------|---------|
| `adfo-task-orchestrator` | 5 边界维度并发分析时，由其调度本技能任务 |
| `adfp-code-reviewer` | 审查报告中引用测试覆盖建议时，调用本技能补充 |
