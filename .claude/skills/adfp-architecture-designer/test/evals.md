# adfp-architecture-designer - 评估用例

## 核心场景

| # | 场景 | 预期行为 | 验证方式 |
|---|------|---------|---------|
| 1 | **已有项目分析** — 项目存在 `package.json` 且 `src/` 有代码，用户要求分析架构 | 识别为「已有项目」模式，生成 5 个 SubAgent 任务清单，委托 `adfo-task-orchestrator` 并发执行，汇总后输出 `architecture.md`，包含可复用清单、依赖图、文件层级蓝图 | 验证输出文档包含 phase: ARCHITECTURE、可复用模块清单、模块依赖图、架构建议 |
| 2 | **新项目规划** — 空项目目录，用户提供 SPEC，要求规划文件结构 | 识别为「新项目」模式，基于 SPEC 的页面架构和路由生成文件层级蓝图，输出原子/分子/组织/模板分层目录树 | 验证目录树深度 ≤ 3 层，含 `components/ui/`、`components/business/`、`pages/`、`hooks/`、`services/` 等标准目录及组织说明 |
| 3 | **SubAgent 并发调度** — 已有项目分析模式下，5 个 SubAgent 执行 | 生成含 SA1-SA5 的任务清单，全部标记无依赖，最大并发数 5，通过 `adfo-task-orchestrator` 调度 | 验证任务清单 ID 为 SA1-SA5，依赖均为空字符串，并发数 = 5 |
| 4 | **SubAgent 结果汇总整合** — 5 个 SubAgent 返回结果后主 Agent 处理 | 执行去重（同一模块合并）、冲突校验（标注 ⚠️）、优先级排序、输出统一可复用清单 | 验证可复用清单表中无重复行，冲突项标注 ⚠️，按影响范围排序 |
| 5 | **已有项目 — SubAgent 组件扫描** | SA1 扫描 `src/components/` 和 `src/pages/`，输出组件清单表（含组件名、路径、类型、Props、职责、可复用性），给出原子化评级（✅/⚠️/🔴） | 验证输出包含组件清单表 + 原子化评级三档 |
| 6 | **已有项目 — SubAgent Hooks/逻辑盘点** | SA2 扫描 `src/hooks/`、`src/utils/`，输出已有 Hooks/Utils 清单，含被引用次数和可复用性，不做内联逻辑提取 | 验证输出 Hooks 清单含引用次数，不包含内联逻辑提取建议（仅提示调用 `adfa-hooks-extractor`） |
| 7 | **已有项目 — SubAgent Service/API 扫描** | SA3 扫描 `src/services/`、`src/api/`，分析 API 调用封装完整性（✅/🔴），识别已有封装模式（请求实例、错误处理、认证方式） | 验证输出含 API 层分析表 + 已有封装模式三段 |
| 8 | **已有项目 — SubAgent 依赖关系图映射** | SA4 分析 import/export 关系，输出依赖拓扑树、循环依赖检测结果、全局污染检测结果、并行识别 | 验证输出含依赖树 + 循环依赖/全局污染检测 + 并行识别建议 |
| 9 | **已有项目 — SubAgent 结构规范分析** | SA5 分析目录结构、命名规范、样式方案、TypeScript 严格模式，输出完整规范报告 | 验证输出含目录约定、命名规范、样式方案、TypeScript 配置四项 |
| 10 | **模块依赖图输出** | 两种模式均输出模块依赖图，含循环依赖检测、全局污染检测、并行开发识别；不做拓扑排序和实施顺序 | 验证依赖图含「并行识别」段，不含「实施顺序」或「拓扑排序」标题，且标注「实施顺序由 adfo-harness-runner 基于此依赖图生成」 |

## 边界测试

| # | 边界情况 | 预期处理 |
|---|---------|---------|
| 1 | 已有项目 `src/` 目录为空（有 `package.json` 但无实际代码） | 识别为已有项目模式，SubAgent 返回空清单，汇总报告标注「项目无现有代码，建议切换至新项目模式」 |
| 2 | 已有项目无 `package.json` 但 `src/` 有代码 | 按「已有项目分析」模式处理，SA5 检测技术栈时标注「⚠️ 无法从 package.json 获取技术栈，建议通过 harness-runner 的 state.json.techStack 补充」 |
| 3 | 新项目模式但未提供 SPEC | 终止执行，提示「新项目规划需要 SPEC 作为输入，请先准备技术规格文档或提供功能描述」 |
| 4 | SubAgent 发现矛盾结果（如 SA1 和 SA4 对同一模块产出冲突） | 汇总时标注冲突项为 ⚠️，在报告「冲突校验」段列出矛盾点供用户裁决 |
| 5 | 已有项目代码量极小（仅 1-2 个文件） | SubAgent 正常执行，清单内容少但结构完整；触发提前返回条件时可跳过不必要的依赖分析步骤 |
| 6 | 项目路径参数未指定 | 主动询问用户项目路径，不默认假设路径 |
| 7 | 已有项目存在循环依赖 | SA4 检测到循环依赖，在依赖图中标注「⚠️ 发现 X 处循环依赖」并列出具体链 |
| 8 | 新项目 SPEC 中页面数量超过 20 个 | 文件层级蓝图按领域模块分组输出，每组独立目录树，标注「大规模项目，建议按模块拆分实施」 |

## 集成测试

| # | 上下游技能 | 集成点 | 预期 |
|---|----------|--------|------|
| 1 | **上游：adfp-spec-generator** → 本技能 | SPEC 的页面架构、数据模型、路由作为本技能新项目模式的输入 | 新项目模式下，文件层级蓝图基于 SPEC 的页面→区块映射和路由设计生成 |
| 2 | **下游：adfp-component-designer** | 本技能输出的 `architecture.md`（可复用清单 + 文件层级蓝图 + 依赖图）作为 component-designer 工程模式的输入 | component-designer 读取 `architecture.md` 的可复用清单避免重复设计，按文件层级蓝图定位组件 |
| 3 | **下游：adfo-harness-runner** | 本技能输出的模块依赖图由 harness-runner 读取，生成拓扑排序后的实施顺序 | harness-runner 不自行分析依赖关系，直接读取本技能依赖图中的并行识别信息 |
| 4 | **编排：adfo-task-orchestrator** | 本技能生成的 SA1-SA5 任务清单委托 orchestrator 并发调度 | orchestrator 接收任务清单后同时执行 5 个无依赖 SubAgent，返回汇总结果 |
| 5 | **下游：adfa-edge-case-master**（推荐） | 本技能在架构文档末推荐调用 adfa-edge-case-master 生成测试策略 | architecture.md 包含「测试策略建议」章节，引用 adfa-edge-case-master |
| 6 | **上游：adfa-hooks-extractor**（协作） | SA2 发现可提取的内联逻辑时提示调用 adfa-hooks-extractor | SA2 输出不自行提取内联逻辑，仅提示「建议运行 adfa-hooks-extractor 做深度分析」 |
| 7 | **上游：adfo-harness-runner state.json** | 工程模式下，已有项目从 `state.json.techStack` 读取已识别的技术栈 | 已有项目分析不走重复检测流程，SA5 优先读取 state.json 技术栈，仅在不完整时补充扫描 |
