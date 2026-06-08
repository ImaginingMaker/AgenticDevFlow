# adfo-harness-runner - 评估用例

## 核心场景

| # | 场景 | 预期行为 | 验证方式 |
|---|------|---------|---------|
| 1 | **完整 9 阶段正向流水线** — 新任务从 INIT 到 DONE 正常流转 | INIT → ANALYZE → PRD → SPEC → ARCHITECTURE → DESIGN → IMPLEMENT → REVIEW → DONE 逐阶段推进，每阶段走两阶模式（context → execute → verify），质量门 pass 后进入下一阶段 | 验证 phaseHistory 包含全部 9 个阶段，DONE 为 finalPhase，每阶段有 contextAt/executedAt/verifiedAt 时间戳 |
| 2 | **阶段跳过（非 IMPLEMENT）** — 用户选择跳过 PRD、SPEC、DESIGN | 跳过的阶段在 phaseHistory 中记录 status: "skipped" + skipEvidence（说明跳过原因），并记录时间戳；跳过不影响后续阶段流转 | 验证 skipped 阶段含 skipEvidence 字段，后续阶段正常流转到 DONE |
| 3 | **IMPLEMENT 不可跳过** — 用户尝试跳过 IMPLEMENT 阶段 | 校验流转规则时阻止跳过，提示「IMPLEMENT 是唯一不可跳过的阶段，必须执行」 | 验证 IMPLEMENT 阶段被强制执行，phaseHistory 中无 skipped 标记 |
| 4 | **IMPLEMENT DAG 调度 4 步流程** — 存在完整 architecture.md 含多模块依赖图 | Step1 解析依赖图 → Step2 按拓扑排序生成任务清单（含并发组）→ Step3 委托 adfo-task-orchestrator → Step4 汇总结果 | 验证 4 步完整执行：architecture.md 被读取、任务清单含依赖层级、orchestrator 被调用、结果被汇总 |
| 5 | **IMPLEMENT 单模块简化路径** — architecture.md 只含 1 个模块 | 监测到仅有 1 个模块，跳过 Step2-3，直接调用 `adfp-code-implementer`，传入 design.md + architecture.md | 验证不生成任务清单、不调用 orchestrator、直接调用 code-implementer |
| 6 | **IMPLEMENT 部分模块失败** — orchestator 返回部分成功/部分失败 | 记录 blockers，按失败策略（abort/retry/continue）处理；retry 时重试最多 maxRetries 次；abort 时标记 FAILED | 验证 blockers 列表记录失败模块，retryCount 递增，当前阶段处理方式与配置的策略一致 |
| 7 | **反向反馈循环 — REVIEW FAIL → IMPLEMENT** | REVIEW 阶段 qualityGate 为 fail → 展示阻断项清单 → 用户确认回退 → 记录 blockers → 清理 IMPLEMENT 阶段产物 → 更新 state.json `rollbackTo: IMPLEMENT` → 注入审查上下文 → 进入 IMPLEMENT 修复模式 | 验证 phaseHistory 中 REVIEW 标记为 fail，rollbackTo 指向 IMPLEMENT，blockers 列表含审查阻断项 |
| 8 | **反向反馈循环 — IMPLEMENT 设计冲突 → DESIGN** | IMPLEMENT 阶段发现设计文档与实际需求冲突 → 用户确认回退 → 记录 blockers → 清理产物 → state.json rollbackTo 指向 DESIGN → 注入冲突上下文 → 进入 DESIGN 阶段 | 验证 rollbackTo: DESIGN，state.json 含 designConflict 说明字段 |
| 9 | **状态原子写入** — 每次 state.json 写入 | 先写 `state.tmp.json`，成功后 `mv` 覆盖 | 验证写入后无 `state.tmp.json` 残留，state.json 内容正确 |
| 10 | **Checkpoint 校验** — 继续已有任务时磁盘文件与 checkpoint.filesSnapshot 一致 | 读取 `state.json.checkpoint.filesSnapshot` 与当前磁盘文件校验 mtime/size，完全匹配则正常继续 | 验证 checkpoint 校验通过后正常进入下一阶段 |
| 11 | **多任务管理 — 创建与切换** — 同时管理 2 个开发任务 | Step2 展示活跃任务列表 → 用户选择编号继续 → 保存当前任务状态 → 加载目标任务的 state.json → 从目标任务的 currentPhase 继续 | 验证切换后 state.json 内容为目标任务的，而非保留当前任务的上下文 |
| 12 | **项目技术栈自动识别（已有项目）** — 启动时扫描 package.json 等 | 检测顺序：package.json → tsconfig.json → 框架配置 → 样式配置 → 目录结构；结果存入 `state.json.techStack` | 验证 state.json.techStack 含 framework、uiLib、style、stateManagement 等字段，值与实际配置文件一致 |
| 13 | **质量门判定 — 4 种状态** | 产物 frontmatter 解析后判定 qualityGate：pass（正常）→ 继续；warn（不达标但可继续）→ 记录；fail（不达标阻塞）→ 回退；缺失 → 视为 warn 提示确认 | 验证 pass 直接进入下一阶段；fail 触发回退流程；缺失 frontmatter 时输出「质量门缺失，视为 warn，请确认是否继续」 |
| 14 | **任务删除** — 用户要求删除一个已完成的 DONE 任务 | 输出任务列表确认 → 用户二次确认 → 删除整个任务目录 | 验证 docs/workflows/{任务ID}/ 目录被删除，不可恢复 |

## 边界测试

| # | 边界情况 | 预期处理 |
|---|---------|---------|
| 1 | `architecture.md` 缺失时 IMPLEMENT 阶段执行 | 降级：按 design.md 组件树顺序执行，不进行 DAG 调度，标注「架构文档缺失，已降级为顺序执行」 |
| 2 | `architecture.md` 依赖图不完整 | 提示用户补充，或降级为顺序执行，标注「依赖图不完整，部分模块顺序可能不准确」 |
| 3 | 产物缺失（阶段执行完但产物文件不存在） | `verify` 命令校验失败，标记 failed，提示「产物缺失，请重新执行该阶段」 |
| 4 | `state.json` 文件损坏 | 尝试修复 JSON，无法修复时引导用户重新 INIT |
| 5 | Checkpoint 不一致（磁盘文件与快照不匹配） | 展示差异列表（新增/修改/删除的文件），询问用户「文件已被外部修改，是否接受差异继续？」 |
| 6 | 用户中断（中途退出） | 保存当前 state.json（含已完成的 sub-phase 信息），等待用户恢复时展示中断位置 |
| 7 | FAILED 后自动修复 | 不自动修复，输出「流水线已终止，需人工介入」，列出失败原因和可能的解决方案 |
| 8 | 命令行参数 `--skip=PRD,SPEC` 但用户后续想补充 | 跳过阶段不可逆，标注「已跳过的阶段不可中途补做，如需补充请新建任务或使用敏捷模式单独执行」 |
| 9 | 阶段回退到非直接上游（如 REVIEW → SPEC）| 校验流转规则，回退只能到 `rollbackTo` 指定的阶段；不合规的回退请求被拒绝并提示 |
| 10 | INIT 阶段和 DONE 阶段被用户手动指定 | 拒绝操作，提示「INIT 和 DONE 不可手动进入，由编排器自动管理」 |
| 11 | 活跃任务删除（非终态任务） | 需先标记为 FAILED 再删除，输出「活跃任务需先标记为 FAILED」提示 |
| 12 | 新项目 INIT 阶段技术栈询问 | 不默认选择，逐项询问框架/UI 库/样式方案/状态管理，将结果存入 state.json.techStack |

## 集成测试

| # | 上下游技能 | 集成点 | 预期 |
|---|----------|--------|------|
| 1 | **调度：adfp-requirement-analyzer** | ANALYZE 阶段调用 requirement-analyzer，产物 requirement-analysis.md 校验 frontmatter | requirement-analysis.md 写入 `docs/workflows/{任务ID}/`，phaseHistory.ANALYZE 记录产物路径 |
| 2 | **调度：adfp-prd-generator** | PRD 阶段调用 prd-generator，产物 prd.md 校验 frontmatter | prd.md 写入正确路径，frontmatter 的 phase/status/qualityGate 被校验 |
| 3 | **调度：adfp-spec-generator** | SPEC 阶段调用 spec-generator，产物 spec.md 校验 frontmatter | spec.md 写入正确路径，质量门判定正确 |
| 4 | **调度：adfp-architecture-designer** | ARCHITECTURE 阶段调用 architecture-designer，产物 architecture.md 作为 IMPLEMENT 依赖图输入 | architecture.md 可被 IMPLEMENT 阶段正确解析出模块依赖关系 |
| 5 | **调度：adfp-component-designer** | DESIGN 阶段调用 component-designer，产物 design.md 作为 IMPLEMENT 代码生成输入 | design.md 中的组件树/Props/状态方案被 code-implementer 正确读取 |
| 6 | **调度：adfp-code-implementer（IMPLEMENT 单模块路径）** | 单模块简化路径下直接调用 code-implementer，传入 design.md + architecture.md | code-implementer 按 design.md 实现代码，忽略 orchestrator |
| 7 | **委托：adfo-task-orchestrator（IMPLEMENT 多模块路径）** | 多模块 DAG 调度时，任务清单委托 orchestrator 执行 | 任务清单含拓扑排序后的并发组、技术栈参数、上游产物引用 |
| 8 | **调度：adfp-code-reviewer** | REVIEW 阶段调用 code-reviewer，产物 review-report.md 的 qualityGate 决定是否触发回退 | review-report.md qualityGate = fail 时触发反馈循环，记录 blockers |
| 9 | **下游：adfa-dev-helper** | dev-helper 读取 state.json 做进度展示 | state.json 的 currentPhase/phaseHistory/blockers 字段结构被 dev-helper 正确解析展示 |
| 10 | **参考：phase-registry.md** | 阶段流转规则从 phase-registry.md 读取 | 阶段映射和跳转规则与 phase-registry.md 完全一致，不做硬编码 |
