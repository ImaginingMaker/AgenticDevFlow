# adfa-critical-explorer - 评估用例

## 核心场景

| # | 场景 | 预期行为 | 验证方式 |
|---|------|---------|---------|
| 1 | 提交 React 组件设计方案（框架感知） | 检测到 React 框架 → 路由到 `critical-dimensions.md#react-路径`，SubAgent 提示词中 `{framework}=React`，审查覆盖 Hooks/JSX 维度 | 检查 SubAgent 输出是否含 React 特有检查（Hooks 规则、useEffect 依赖、key 稳定性等） |
| 2 | 提交 Vue 3 组件设计方案（框架感知） | 检测到 Vue 框架 → 路由到 `critical-dimensions.md#vue-路径`，`{framework}=Vue 3`，覆盖 Composition API/SFC 维度 | 检查输出是否含 Vue 特有检查（Composition API、watch 副作用、Teleport 使用等） |
| 3 | 提交微信小程序方案（框架感知） | 检测到小程序 → 路由到 `critical-dimensions.md#小程序路径`，覆盖包体积/组件通信维度 | 检查输出是否含小程序特有检查（包体积 2MB、setData 控制、分包策略等） |
| 4 | 提交 Taro/uni-app 跨端方案（框架感知） | 检测到跨端 → 路由到 `critical-dimensions.md#跨端路径`，覆盖条件编译/平台差异维度 | 检查输出是否含跨端特有检查（TARO_ENV 条件编译、平台差异化、各端构建体积等） |
| 5 | 无 techStack 上下文（通用路径降级） | 自动走通用路径，提示用户指定框架 | 检查报告是否标注「框架未指定，按通用前端维度执行」 |
| 6 | 提交模糊需求描述 | SubAgent1 标注模糊点，其余 SubAgent 补充预设并标注 | 检查报告中是否有"预设说明"标注 |
| 7 | 指定只让某个 SubAgent 深度再挖 | 仅启动指定的 SubAgent，不启动全部 6 个 | 检查 Agent 调用数量 |
| 8 | 提交架构方案（框架感知） | SubAgent3 按检测到的框架评审组件拆分和状态管理 | 检查架构维度输出是否匹配目标框架 |

## 边界测试

| # | 边界情况 | 预期处理 |
|---|---------|---------|
| 1 | 输入为空 | 提示用户提供方案描述 |
| 2 | 输入为非前端领域（如后端 API 设计） | SubAgent 标注领域不匹配，但仍给出通用评审 |
| 3 | techStack 检测到未知框架 | 走通用路径，提示用户「未识别到框架，按通用前端维度评审」 |
| 4 | techStack 中 framework 和实际内容不匹配（如 React techStack 但方案是 Vue） | 按 techStack 指明框架执行，报告中标注「框架来源：techStack 配置」 |
| 5 | 敏捷模式无 techStack 上下文 | 走通用路径，提示用户指定框架以便获得更精确的审查 |
| 6 | 某个 SubAgent 超时未返回 | 主 Agent 标注该维度缺失，不影响其他维度汇总 |
| 7 | 6 个 SubAgent 结论冲突 | 主 Agent 标注冲突点，不做强行统一 |
| 8 | 输入仅为一句话描述 | SubAgent1 标注信息不足，各 SubAgent 基于预设分析 |

## 集成测试

| # | 上下游技能 | 集成点 | 预期 |
|---|----------|--------|------|
| 1 | adfp-spec-generator → adfa-critical-explorer | SPEC 产出后作为输入 | 对技术规格进行框架感知的 6 维度审查 |
| 2 | adfp-component-designer → adfa-critical-explorer | DESIGN 产出后作为输入，含 techStack | 根据 techStack 路由到对应框架评审细则 |
| 3 | adfp-architecture-designer → adfa-critical-explorer | 架构方案作为输入，含 techStack | 框架感知的架构多维度审视 |
| 4 | adfa-critical-explorer → adfp-code-implementer | 评审报告作为修复输入 | 实现者根据框架特定报告修复设计问题 |
| 5 | adfo-harness-runner → adfa-critical-explorer | 工程模式，techStack 从 state.json 注入 | 框架感知路由自动生效 |
