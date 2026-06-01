# adfa-critical-explorer - 评估用例

## 核心场景

| # | 场景 | 预期行为 | 验证方式 |
|---|------|---------|---------|
| 1 | 提交 React 组件设计方案 | 并发启动 6 个 SubAgent，汇总输出结构化报告 | 检查是否同一消息中启动所有 SubAgent |
| 2 | 提交模糊需求描述 | SubAgent1 标注模糊点，其余 SubAgent 补充预设并标注 | 检查报告中是否有"预设说明"标注 |
| 3 | 指定只让某个 SubAgent 深度再挖 | 仅启动指定的 SubAgent，不启动全部 6 个 | 检查 Agent 调用数量 |
| 4 | 提交架构方案 | SubAgent3 重点评审组件拆分和状态管理 | 检查架构维度输出完整性 |

## 边界测试

| # | 边界情况 | 预期处理 |
|---|---------|---------|
| 1 | 输入为空 | 提示用户提供方案描述 |
| 2 | 输入为非前端领域（如后端 API 设计） | SubAgent 标注领域不匹配，但仍给出通用评审 |
| 3 | 某个 SubAgent 超时未返回 | 主 Agent 标注该维度缺失，不影响其他维度汇总 |
| 4 | 6 个 SubAgent 结论冲突 | 主 Agent 标注冲突点，不做强行统一 |
| 5 | 输入仅为一句话描述 | SubAgent1 标注信息不足，各 SubAgent 基于预设分析 |

## 集成测试

| # | 上下游技能 | 集成点 | 预期 |
|---|----------|--------|------|
| 1 | adfp-spec-generator → adfa-critical-explorer | SPEC 产出后作为输入 | 对技术规格进行 6 维度批判性审查 |
| 2 | adfp-component-designer → adfa-critical-explorer | DESIGN 产出后作为输入 | 对组件设计方案进行批判性评审 |
| 3 | adfp-architecture-designer → adfa-critical-explorer | 架构方案作为输入 | 对架构决策进行多维度审视 |
| 4 | adfa-critical-explorer → adfp-code-implementer | 评审报告作为修复输入 | 实现者根据报告修复设计问题 |
