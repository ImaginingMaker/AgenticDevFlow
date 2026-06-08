# adft-skill-creator - 评估用例

## 核心场景

| # | 场景 | 预期行为 | 验证方式 |
|---|------|---------|---------|
| 1 | **创建流水线技能** — 用户说「创建一个参与正向交付流水线的技能」 | 调用 skill-creator:skill-creator → 获取草稿 → 应用 ADF 命名约束 → 命名为 `adfp-<name>` 格式 → 生成基础文件结构（SKILL.md + test/evals.md + templates/custom.md） | 验证技能目录名为 `adfp-<name>`，SKILL.md 含 front-matter（name/description），test/evals.md 存在非空，templates/custom.md 存在 |
| 2 | **创建编排技能** — 用户说「创建一个流程调度技能」 | 调用 skill-creator → 命名为 `adfo-<name>` 格式 → 生成基础文件结构 | 验证前缀为 `adfo-`，SKILL.md 含 TRIGGER 和 Use proactively when |
| 3 | **创建辅助技能** — 用户说「创建一个辅助审查技能」 | 调用 skill-creator → 命名为 `adfa-<name>` 格式 → 生成基础文件结构 | 验证前缀为 `adfa-`，模板配置引用 harness-runner 共享配置 |
| 4 | **创建工具技能** — 用户说「创建一个不参与流水线的独立工具」 | 调用 skill-creator → 命名为 `adft-<name>` 格式 → 生成基础文件结构，不要求 harness 集成 | 验证前缀为 `adft-`，SKILL.md 不含 phase-registry 引用 |
| 5 | **命名规范执行 — 禁止格式** — 用户提议 `pi-data-extractor` 或 `DataExtractor` 作为技能名 | skill-creator 拒绝非 ADF 格式命名，提示正确格式 `adfp-<name>` / `adfo-<name>` / `adfa-<name>` / `adft-<name>` | 验证输出不包含旧前缀/驼峰/下划线/空格，最终命名符合 `adf<type>-<功能描述>` 格式 |
| 6 | **文件结构规范** — 生成的技能目录结构 | 目录含 SKILL.md（<500行） + references/（可选） + test/evals.md（必须） + templates/custom.md（必须，可空） | 验证 test/evals.md 存在且非空，SKILL.md 行数 ≤ 500 |
| 7 | **职责去重检查 — 高度重叠** — 新技能与现有技能在触发词+核心动作+输出产物上全部重叠 | 执行 5 维度重叠检查 → 判定为高度重叠 → 按决策树比较质量 → 外部更好则备份替换，否则告知用户现有技能已覆盖 | 验证输出不含直接创建，按决策树走替换或零操作路径 |
| 8 | **职责去重检查 — 中度重叠** — 新技能核心动作重叠但输入/阶段不同 | 判定为中度重叠 → 走共存路径 → 双方添加职责边界表 + 互设引用 + 消除歧义触发词 | 验证新技能 SKILL.md 中含职责边界章节，引用重叠技能 |
| 9 | **文档同步** — 技能创建完成后文档同步 | 创建 `docs/skills/adf<type>-<name>.md` 详情页 + 更新 `skills/README.md` 注册中心 + 更新 `docs/skills/README.md` 索引 | 验证 3 个文档全部更新，注册中心新增条目含名称/类型/前缀/触发词/文件位置 |
| 10 | **验证并交付** — 全部步骤完成后输出给用户 | 输出技能完整信息：名称、路径、类型、文件结构、职责边界、测试覆盖；包含「质量门全部通过」确认 | 验证输出含技能名称、路径、已创建文件列表、质量门检查状态 |

## 边界测试

| # | 边界情况 | 预期处理 |
|---|---------|---------|
| 1 | skill-creator 引擎返回的草稿 SKILL.md 超过 500 行 | 触发体积拆分：将 >300 行的参考内容抽取到 references/ 目录，保持 SKILL.md < 500 行 |
| 2 | 新技能与现有技能完全无重叠 | 零重叠不触发去重流程，正常集成，注明「无职责重叠」 |
| 3 | 用户要创建的技能类型与现有技能完全重复（功能相同） | 判定为外部是现有技能的子集 → 合入现有技能，不独立创建；输出合入建议和需要增强的章节 |
| 4 | 用户输入的需求不清晰（模糊描述而非具体功能） | 调用 skill-creator 前主动提问引导：技能要做什么？属于哪类（流水线/编排/辅助/工具）？产出的核心产物是什么？ |
| 5 | 用户要求创建的技能名带有大写、下划线或空格 | 自动修正为 `adf<type>-<name>` 格式，提示「已自动修正命名」 |
| 6 | 创建过程中用户要求中断 | 保存当前草稿状态（如已有部分文件结构），输出「已创建至 X 步，可随时继续」 |
| 7 | test/evals.md 自动生成的内容太简单（仅 1-2 条用例） | 补充至少覆盖核心场景×3 + 边界测试×3 的基础用例，标注「测试用例可后续补充」 |
| 8 | 创建的是工具技能（adft-）但用户试图添加 harness 集成 | 提示「adft- 技能不接入流水线，无需 phase-registry 引用；如需流水线集成请改为 adfp- 类型」 |
| 9 | `skills/README.md` 注册中心不存在或为空 | 创建/初始化注册中心文件后再写入新技能条目 |
| 10 | 共享配置引用路径错误（adfo-harness-runner/templates/custom.md 不存在） | 标注「共享配置源不存在，建议先创建 harness-runner 技能」，本技能单独管理配置 |

## 集成测试

| # | 上下游技能 | 集成点 | 预期 |
|---|----------|--------|------|
| 1 | **引擎：skill-creator:skill-creator** | 本技能调用官方技能创建器生成草稿 | skill-creator 返回完整草稿（意图捕获→起草→测试→评估→改进→打包）后再应用 ADF 约束 |
| 2 | **下游：skills/README.md 注册中心** | 新技能创建后必须在注册中心注册 | 注册中心新增条目含 name/type/prefix/trigger/filePath |
| 3 | **下游：docs/skills/README.md 索引** | 新技能创建后必须更新文档索引 | docs 索引新增条目，文档结构符合「基本信息+核心特性+依赖关系+流程生命周期」模板 |
| 4 | **参考：CLAUDE.md 技能基准规范** | 创建过程中逐项校验质量门 | 所有 10 项质量门检查清单通过 |
| 5 | **参考：adfo-harness-runner/templates/custom.md** | adfp/adfo/adfa 类型的技能引用 harness-runner 共享配置 | 新技能 SKILL.md 模板注入段声明「共享配置由 adfo-harness-runner/templates/custom.md 统一管理」 |
| 6 | **下游：adfa-dev-helper** | 新辅助/工具技能创建后需在 dev-helper 的场景→技能映射表中注册 | 注册中心更新后 dev-helper 自动派生映射（不硬编码），新技能在场景分析中可被推荐 |
