# adfa-refactor-advisor - 评估用例

## 核心场景

| # | 场景 | 预期行为 | 验证方式 |
|---|------|---------|---------|
| 1 | React 组件状态散乱 | 识别 5+ 独立 useState，建议状态收敛为 `useReducer` 或自定义 Hook，输出重构前后代码 | 检查输出含问题清单 + 重构策略 + 前后对照代码 + 关键改动 |
| 2 | Vue 3 组件状态散乱 | 识别 5+ 独立 `ref()`，建议收敛为 `reactive()` 或 Composable，输出重构前后代码 | 检查输出使用 `reactive` / `toRefs` / Composable 模式 |
| 3 | 小程序状态散乱 | 识别多个独立 data 字段，建议收敛为状态对象 + Behavior，输出重构前后代码 | 检查输出使用 `setData` 批量更新 + Behavior 封装 |
| 4 | 业务与视图耦合（React） | 识别逻辑与渲染混杂问题，建议抽离自定义 Hook（如 `useProductList`），输出重构前后代码 | 检查建议中包含 `useXxx` Hook 命名，重构后组件主要负责渲染 |
| 5 | 业务与视图耦合（Vue 3） | 识别 SFC 中混杂的逻辑，建议抽离 Composable，输出重构前后代码 | 检查输出 Composable + SFC 分离结构 |
| 6 | 嵌套过深 | 识别 3+ 层嵌套条件渲染，建议早期返回/子组件提取 | 检查重构后嵌套 ≤ 2 层 |
| 7 | 用户指定「精简重构」方向 | 最小改动、保持功能不变、只消除最严重问题 | 检查改动幅度小、功能无变化 |

## 边界测试

| # | 边界情况 | 预期处理 |
|---|---------|---------|
| 1 | 代码已经比较规范，无明显坏味道 | 如实告知代码质量良好，指出 1-2 个可微调点 |
| 2 | 代码片段不完整（缺少 import、依赖类型） | 在重构代码中推断补全类型和 import |
| 3 | 用户说「代码太乱」但未粘贴代码 | 引导用户粘贴代码，不凭空给方案 |
| 4 | 用户要求「保留功能只优化结构」 | 重构前后功能行为完全一致，仅改变组织方式 |
| 5 | 极短的代码片段（< 20 行） | 若确实无需重构则直接告知；若有隐藏问题则指出 |
| 6 | 框架无法识别（无 package.json，无明确框架特征） | 使用通用重构模式输出，提示用户可指定框架 |
| 7 | 用户显式指定框架（如 "按 Vue 3 重构"） | 绕过检测，直接使用指定框架的路由模式 |

## 集成测试

| # | 上下游技能 | 集成点 | 预期 |
|---|----------|--------|------|
| 1 | `adfp-code-reviewer` | REVIEW 发现结构性问题 → refactor-advisor 出方案 | 重构方案聚焦 reviewer 标注的结构性问题 |
| 2 | `adfp-code-implementer` | refactor-advisor 方案 → implementer 修复模式执行 | implementer 能直接引用重构方案中的目标代码 |
| 3 | `adfa-code-analysis`（mode:extract） | 触发词区分 | "这段逻辑抽成 Hook"用 code-analysis extract，"整个组件太乱"用本技能 |
| 4 | `adfa-code-analysis`（mode:context） | 理解 → 重构 | code-analysis context 先构建代码心智模型，本技能基于理解出方案 |
| 5 | `adfo-harness-runner` | 工程模式调度 | 从 `state.json.techStack` 读取框架，不重复检测 |
