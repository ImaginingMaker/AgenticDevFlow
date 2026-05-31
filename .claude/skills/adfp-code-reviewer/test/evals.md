# adfp-code-reviewer - 评估用例

## 核心场景

| # | 场景 | 预期行为 | 验证方式 |
|---|------|---------|---------|
| 1 | **完整 7 维度审查** — 用户提交一个 React 组件代码要求审查 | 7 个维度 SubAgent 全部执行：类型安全、React 规范、性能与体积、边界处理、代码质量与复用、视觉美学、副作用分析；委托 `adfo-task-orchestrator` 并发执行 | 验证输出审查报告含全部 7 个维度的评分表，每维度有具体的扣分项和得分 |
| 2 | **加权评分系统** — 审查完成后计算综合评分 | 各维度按权重加权计算总分（类型安全 15% + React 规范 15% + 性能 15% + 边界 15% + 质量 15% + 美学 10% + 副作用 15% = 100%），输出评分分级（🟢优秀 90-100 / 🟡良好 70-89 / 🔴需改进 <70） | 验证报告含加权总分和各维度得分，扣分项与权重一致 |
| 3 | **Git 模式 — `--staged`** — 审查暂存区代码 | 执行 `git diff --staged` 获取暂存区变更，优先审查变更部分 | 验证报告中的行号引用均为暂存区变更覆盖的行 |
| 4 | **Git 模式 — `--commit=<hash>`** — 审查指定提交 | 执行 `git show <hash>` 获取提交内容，审查 diff 变更 + 用 `git show <hash>:<file>` 读取关键文件完整上下文 | 验证报告含 diff 变更内容，且核心文件有完整上下文引用 |
| 5 | **高频问题模式识别 — 内存泄漏** — useEffect 无清理函数 | 识别为 memory leak 模式，严重度为 critical | 验证报告中该问题标记为 🔴 critical，含「内存泄漏」标签 |
| 6 | **高频问题模式识别 — 敏感信息泄露** — 代码中含硬编码 API key | 识别为 sensitive info 模式，严重度为 critical | 验证报告中该问题标记为 🔴 critical，含「敏感信息泄露」标签 |
| 7 | **直接修复 — 确定性 bug** — 代码中有 console.log 调试残留 | 自动修复删除 console.log，在报告中标注 `[已修复]` | 验证代码中 console.log 被删除，报告列出已修复内容 |
| 8 | **直接修复 — 不自动修复** — 组件需要架构级拆分 | 不自动修改代码，在报告中标注「建议调用 adfa-refactor-advisor 处理结构性重构」 | 验证代码未被修改，报告中标注了建议而非直接修复 |
| 9 | **审查结论判定 — PASS** — 评分 ≥ 90 且无 critical 问题 | 审查结论为 PASS ✅，输出「质量门 pass」 | 验证报告结论为 PASS ✅，qualityGate: pass |
| 10 | **审查结论判定 — FAIL** — 评分 < 70 或存在 critical/high 问题 | 审查结论为 FAIL 🔴，输出阻塞项清单和修复建议，报告中标注通向 code-implementer 的修复路径 | 验证报告含阻塞项清单（严重度 + 位置 + 修复建议），结论为 FAIL 🔴，qualityGate: fail |
| 11 | **SubAgent 并发调度** — 7 个维度同时执行 | 生成含 SA1-SA7 的任务清单，全部无依赖，最大并发数 7，通过 `adfo-task-orchestrator` 调度 | 验证任务清单 ID 为 SA1-SA7，依赖均为空，并发数 = 7 |
| 12 | **大规模变更处理** — >10 文件的提交审查 | 先用 `git show --stat` 获取全局视图，优先审查核心业务逻辑（组件/Hooks/工具函数），配置/类型/样式文件简要说明 | 验证报告中标注「因变更规模较大，部分文件为简要审查」，核心文件优先详细审查 |

## 边界测试

| # | 边界情况 | 预期处理 |
|---|---------|---------|
| 1 | 目标文件为空文件 | 跳过该文件，报告中标注「文件为空，已跳过」 |
| 2 | Git 模式无变更（`--staged` 但暂存区空） | 输出「当前无待审查变更」，询问用户是否切换模式 |
| 3 | `--path=<path>` 目录下无代码文件 | 输出「目录下无可审查代码文件」，列出已扫描的文件类型 |
| 4 | `--commit=<hash>` 指定的提交不存在 | 提示「提交不存在」，列出最近 5 个提交供用户选择 |
| 5 | `--focus=<维度>` 传入了无效值 | 提示有效维度列表（basic/quality/perf/side-effect），默认执行全部维度 |
| 6 | 参数组合冲突（同时指定 `--commit` 和 `--staged`） | 按优先级选择：`--commit` > `--staged` > `--path` > `--file`，并提示用户 |
| 7 | 单维度 SubAgent 失败（如 SA3 性能分析异常） | 重试 1 次，仍失败则标记该维度为「待人工审查」，基于其他 6 个维度生成完整报告 |
| 8 | 多维度（≥3）SubAgent 失败 | 终止并行执行，回退为串行逐维度审查，记录失败原因，输出含「部分维度审查失败」标注的报告 |
| 9 | 9 个 SubAgent 全部失败 | 输出错误报告，建议用户检查环境或手动审查 |
| 10 | 评分恰好 90 分 | 门限值边界：评分 ≥ 90 且无 critical → PASS ✅ |
| 11 | 评分恰好 70 分 | 门限值边界：评分 ≥ 70 → 最低限度的 WARN 🟡 |
| 12 | 代码不包含视觉美学元素（纯逻辑代码） | SA6（视觉美学）标注「无可审查的 UI 代码，跳过该维度」，权重 10% 分配到其他维度重新计算或从总分中剔除 |

## 集成测试

| # | 上下游技能 | 集成点 | 预期 |
|---|----------|--------|------|
| 1 | **编排：adfo-task-orchestrator** | 本技能生成 SA1-SA7 任务清单，委托 orchestrator 并发调度 7 个维度 SubAgent | orchestrator 接收任务清单后同时执行 7 个无依赖 SubAgent，返回各维度审查结果 |
| 2 | **上游：adfp-code-implementer** | 本技能审查 implementer 产出的代码。审查 FAIL 时，implementer 修复模式只修 blockers | implementer 修复模式仅处理审查报告中 critical/high 的 blockers，不重新实现全部代码 |
| 3 | **下游：adfa-refactor-advisor** | 本技能发现架构级问题（需结构性重构），推荐调用 refactor-advisor | 审查报告中标注「建议调用 adfa-refactor-advisor 进行结构性重构」，本技能不做治疗只做诊断+分级 |
| 4 | **下游：adfa-edge-case-master** | 本技能发现边界覆盖不足（缺少 loading/empty/error 三态），推荐调用 edge-case-master | 审查报告中相应位置标注「建议调用 adfa-edge-case-master 补充测试用例」 |
| 5 | **下游：adfa-hooks-extractor** | 本技能发现可提取的重复逻辑，推荐调用 hooks-extractor | 审查报告中标注「建议调用 adfa-hooks-extractor 分析该段逻辑的可提取性」 |
| 6 | **下游：adfo-harness-runner** | 工程模式下，REVIEW 阶段确定 qualityGate，FAIL 时触发反馈循环进入 IMPLEMENT | 审查报告的 qualityGate: fail 时 harness-runner 读取 blockers 列表并回退到 IMPLEMENT 阶段 |
| 7 | **参考：adfa-critical-explorer** | 本技能和 critical-explorer 共享同一套维度分类法（`references/review-dimensions.md`） | 维度分类（类型安全/React规范/性能/边界/质量与复用/美学/副作用）与 critical-explorer 的 6 维度有共通分类体系 |
| 8 | **修复分工：adfp-code-implementer** | 本技能自动修复确定性 bug（console.log、缺类型、冗余注释），实现修复模式处理结构性阻塞 | 本技能不替 implementer 做组件拆分/Hook 提取/架构调整，这些标注后留给 implementer 修复模式 |
