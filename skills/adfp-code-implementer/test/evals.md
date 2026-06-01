# adfp-code-implementer - 评估用例

## 核心场景

| # | 场景 | 预期行为 | 验证方式 |
|---|------|---------|---------|
| 1 | **敏捷模式实现** — 用户描述一个带搜索和分页的用户列表组件，要求实现代码 | 从用户描述自行推断组件结构、Props、状态方案后编码；生成顺序：类型定义 → 自定义 Hooks → 子组件（自底向上）→ 入口文件；输出 `./implementation.md` | 验证生成文件顺序为 types.ts → hooks/use*.ts → 子组件 → index.tsx，实现报告完整 |
| 2 | **工程模式实现** — 通过 harness 提供 `design.md`，要求严格按设计方案实现 | 读取 `design.md` 获取组件树、Props、状态方案；校验必需章节完整性；按设计方案逐文件实现；不引入设计文档未提及的依赖 | 验证产物与 design.md 的组件树、Props 接口、状态方案完全一致 |
| 3 | **输入校验** — `design.md` 缺少「Props 接口」章节 | 校验失败，终止执行，提示「design.md 缺少必需章节：Props 接口，请先完善设计方案」 | 验证未生成任何代码文件，仅输出错误提示 |
| 4 | **修复模式** — 提供失败的审查报告，要求只修复 blocker 问题 | 只修改与 blockers 相关的文件；优先修复 severity: critical/high 的问题；修复记录写入实现报告 | 验证仅 blockers 相关文件被修改，实现报告包含「修复记录」章节 |
| 5 | **生成顺序遵守** — 完整实现一个带类型、Hooks、子组件、入口文件的复杂组件 | 严格的生成顺序：types.ts → utils.ts（若需）→ hooks/use*.ts → 子组件（叶子→容器→页面）→ index.tsx | 验证 types.ts 在同级 hooks/ 和组件文件之前生成，子组件在入口文件之前生成 |
| 6 | **代码规范执行** — 生成 TypeScript React 组件 | import 顺序：React → 第三方 → 项目内部；所有 Props 导出 interface；事件处理函数以 handle 开头；不使用 `any` 类型；巨型组件 >200 行拆分 | 验证 import 分组正确，Props 均为 interface 且导出，事件函数命名规范 |
| 7 | **修复模式 blocker 优先** — 审查报告含 critical + low 级别问题 | 优先修复 critical/high 级别的 blockers，low 级别的 issues 暂不处理 | 验证仅 critical/high 问题被修复，low 级别问题标注「未处理」并说明原因 |
| 8 | **样式代码应用美学方向** — design.md 指定了「极简」美学方向 | 样式代码体现极简美学方向（留白主导、精确对齐、克制色彩），不生成模板化默认样式 | 验证样式文件含明确的 spacing、color token 等美学策略，而非 AI 模板默认样式 |

## 边界测试

| # | 边界情况 | 预期处理 |
|---|---------|---------|
| 1 | `design.md` 缺少多个必需章节（组件树 + Props 接口 + 状态方案全部缺失） | 校验失败，终止执行，列出全部缺失章节名，提示「请先完善设计方案」 |
| 2 | 敏捷模式用户描述极其模糊（仅一句「写个表格组件」） | 主动追问以明确需求：数据类型、列数、交互方式（排序/筛选/编辑）、数据来源 |
| 3 | 工程模式下 `design.md` 存在但 architecture.md 不存在 | 正常执行。仅读取 design.md 为必需输入，architecture.md 作为可选项（有则读取可复用清单和文件层级） |
| 4 | 修复模式审查报告为空（无任何 blockers） | 检测到无 blockers，输出「审查报告无 blockers，无需修复」，不做任何代码变更 |
| 5 | 生成组件行数恰好 200 行（阈值边界） | 等于阈值不触发拆分，保持单文件 |
| 6 | 生成组件行数 201 行（超过阈值） | 触发拆分，提取为多个子组件或工具函数，保持每个文件 ≤ 200 行 |
| 7 | design.md 指定了不存在的外部库 | 不引入该依赖，标注「design.md 指定的 {库名} 属于第三方依赖，需用户确认」，使用手写实现或替代方案 |
| 8 | 敏捷模式用户描述与现有项目规范（templates/custom.md）冲突 | 以项目规范为准，在实现报告中标注「用户描述与项目规范存在冲突，已按项目规范执行」 |

## 集成测试

| # | 上下游技能 | 集成点 | 预期 |
|---|----------|--------|------|
| 1 | **上游：adfp-component-designer** → 本技能 | `design.md` 的组件树、Props 接口、状态方案、视觉设计方向作为本技能工程模式的输入 | 本技能按 design.md 的 Props 定义生成 TypeScript interface，按状态方案生成 Hooks，按美学方向应用样式 |
| 2 | **上游：adfp-architecture-designer** | `architecture.md` 的可复用模块清单和文件层级蓝图作为可选项 | 若存在 architecture.md，组件文件路径和可复用模块引用遵循其目录约定和模块清单 |
| 3 | **下游：adfp-code-reviewer** | 本技能生成的代码产物作为审查输入 | code-reviewer 审查后反馈 blockers，本技能修复模式时按 blockers 精准定位修复文件 |
| 4 | **下游：adfa-edge-case-master**（推荐） | 本技能在实现报告末推荐调用 adfa-edge-case-master | implementation.md 包含「建议调用 adfa-edge-case-master 为关键组件生成测试用例」 |
| 5 | **下游：adfo-harness-runner** | 工程模式下，harness-runner 指定产物路径 `docs/workflows/{任务ID}/`，IMPLEMENT 完成后更新 state.json | 源代码写入指定路径，implementation.md 写入 `docs/workflows/{任务ID}/implementation.md`，phase 状态更新 |
| 6 | **参考：adfp-component-designer aesthetics-guidelines** | 本技能和 component-designer 共享同一美学参考文件 | 样式实现遵循 `references/aesthetics-guidelines.md` 而非使用 AI 模板化美学 |
