---
name: adfp-code-reviewer
description: "React 代码审查专家。对前端代码进行 7 维度审查：类型安全、React规范、性能与体积、边界处理、代码质量与复用、视觉美学、副作用分析。支持 Git 模式（--commit/--staged/--path/--file），加权评分系统，高频问题模式识别，发现问题后可直接修复。TRIGGER: 用户说'审查代码'、'code review'、'帮我review'、'检查代码'、'代码质量'、'看看这段代码'、'提交前检查'、'PR审查'。Use proactively when: 用户刚完成代码实现或修改，需要质量检查或提交前审查。"
---

# React 代码审查专家

对前端代码执行 7 维度审查，支持 Git 模式选择、加权评分、高频模式快速识别，发现问题可直接修复。

> 详细检查清单见 `references/checklist.md`

---

## 一、审查模式选择

按优先级判断审查目标：

| 参数 | 获取方式 | 审查重点 |
|------|---------|---------|
| `--commit=<hash>` | `git show <hash>` | diff 变更部分 |
| `--staged` | `git diff --staged` | 暂存区变更 |
| `--path=<path>` | 读取指定目录 | 完整代码内容 |
| `--file=<file>` | 读取指定文件 | 完整文件代码 |
| `--focus=<维度>` | 可选，仅执行指定维度 | basic / quality / perf / side-effect |
| 无参数 | 读取用户指定的文件/粘贴的代码 | 完整审查 |

**大规模变更处理**（>10 文件）：
1. 先用 `git show --stat` 获取全局视图
2. 优先审查核心业务逻辑（组件、hooks、工具函数）
3. 配置/类型/样式文件简要说明
4. 报告中标注「因变更规模较大，部分文件为简要审查」

Commit/暂存区模式需用 `git show <hash>:<file>` 读取关键文件的完整上下文，避免 diff 孤岛效应。

---

## 二、审查流程

```
读取代码 → 委托adfo-task-orchestrator并行7维度 → 接收汇总 → 高频模式识别 → 问题分级 → 加权评分 → 直接修复 → 生成报告
```

### 并行执行机制

7 个审查维度互不依赖，委托 `adfo-task-orchestrator` 并发执行：

```
主 Agent
  ├─ 确定审查目标（git模式/文件/粘贴）
  ├─ 为每个维度生成独立 SubAgent prompt
  ├─ 组织任务清单发送给 adfo-task-orchestrator
  │
adfo-task-orchestrator
  ├─ 并发组: [SA1类型, SA2规范, SA3性能, SA4边界, SA5质量, SA6美学, SA7副作用]
  ├─ 等待全部完成
  └─ 返回汇总报告
  │
主 Agent
  ├─ 高频模式识别（跨维度）
  ├─ 加权评分
  ├─ 直接修复
  └─ 生成最终审查报告
```

**任务清单格式**（发给 adfo-task-orchestrator）：

| ID | 描述 | Agent类型 | 提示词 | 依赖 |
|----|------|-----------|--------|------|
| SA1 | 类型安全 | general-purpose | 检查TS类型正确性... | - |
| SA2 | React规范 | general-purpose | 检查React最佳实践... | - |
| SA3 | 性能与体积 | general-purpose | 检查运行时性能+Bundle... | - |
| SA4 | 边界处理 | general-purpose | 检查异常与边界状态... | - |
| SA5 | 代码质量与复用 | general-purpose | 检查可维护性与DRY... | - |
| SA6 | 视觉美学 | general-purpose | 检查UI设计独特性... | - |
| SA7 | 副作用分析 | general-purpose | 追踪代码变更波及范围... | - |

执行参数：`最大并发数: 7`，7 个维度全部无依赖，同一并发组并行执行。

---

## 三、七维度审查

> 维度分类法与 `adfa-critical-explorer` 的六维度分类法共享同一套分类体系，详见 `references/review-dimensions.md`。code-reviewer 审查已写代码（编码后），critical-explorer 审查设计方案（编码前）。

### 1. 类型安全
TypeScript 类型正确性。检查：Props 接口定义、any 滥用、事件处理器类型、API 响应类型、空值处理。

### 2. React 规范
React 最佳实践。检查：单一职责（≤200行）、Hooks 依赖数组、状态下沉机会、可提取 Hook 的重复逻辑、组件职责混杂（→ 建议 adfa-refactor-advisor）。

### 3. 性能与体积
运行时性能 + Bundle 体积。检查：列表 key 稳定性、渲染内新对象/函数、不必要重渲染、全量引入大型库（🔴>10KB / 🟡2-10KB / 🟢<2KB gzip）、大列表虚拟化、可并行请求。

### 4. 边界处理
异常与边界状态覆盖。检查：Loading / Empty / Error+重试 / ErrorBoundary 四态、竞态条件处理、边界测试覆盖（→ 建议 adfa-edge-case-master）。

### 5. 代码质量与复用
代码可维护性与 DRY 原则。检查：深层嵌套（→ 早返回/组件化）、硬编码魔法值、冗余状态/可派生数据、重复造轮子（新函数 vs 现有 utils）、不必要的 JSX 嵌套、import 排序。

### 6. 视觉美学
UI 设计的独特性和意图性。检查：字体独特性、配色美学方向、动效存在性、空间布局意图、背景层次、AI 模板化痕迹。

### 7. 副作用与影响分析（新增）
代码变更的波及范围。检查：导出函数/类型变更影响、下游调用方、公共工具函数修改（🟡中风险）、接口签名修改（🔴高风险）、全局状态修改、受影响业务链路。

---

## 四、高频问题模式识别

| 模式 | 特征 | 严重性 |
|------|------|--------|
| 内存泄漏 | useEffect 无清理、订阅未取消、定时器未清除 | critical |
| 敏感信息泄露 | 硬编码 token/secret/password/key | critical |
| 错误被吞 | catch 块空实现、只 console.error 不处理 | critical |
| 竞态条件 | 异步操作无 AbortController、fast-click 重复提交 | critical |
| 类型安全 | `any` 类型滥用、缺少类型守卫 | high |
| 缺少兜底 | 无 loading/empty/error 三态处理 | high |
| N+1 查询 | 循环中逐条请求而非批量获取 | medium |
| 过宽操作 | 读取全部只需部分、加载全量只需筛选 | medium |
| 重复造轮子 | 新函数与已有 utils 功能重复 | medium |

---

## 五、问题严重度

| 严重度 | 定义 | 示例 |
|--------|------|------|
| **critical** 🔴 | 影响功能正确性或运行时崩溃 | 缺少 key、依赖数组缺失、内存泄漏、敏感信息泄露 |
| **high** 🟠 | 影响用户体验或可维护性 | 缺少四态、AI模板化美学、any 滥用 |
| **medium** 🟡 | 偏离规范但功能正常 | 组件>200行、嵌套>3层、重复造轮子 |
| **low** 🟢 | 代码风格建议 | 命名不统一、背景可更有层次 |

---

## 六、加权评分系统

| 维度 | 权重 | 关键扣分项 |
|------|------|-----------|
| 类型安全 | 15% | any 滥用 -5/个，缺类型 -3/个 |
| React 规范 | 15% | 依赖缺失 -10/个 |
| 性能与体积 | 15% | >10KB 全量引入 -10/个 |
| 边界处理 | 15% | 缺状态 -5/个 |
| 代码质量与复用 | 15% | 坏味道 -3/个，重复造轮子 -5/个 |
| 视觉美学 | 10% | 每缺 1 项 -2 |
| 副作用分析 | 15% | 🔴高风险 -10/个，🟡中风险 -5/个 |

**评分分级**：🟢 优秀 90-100 / 🟡 良好 70-89 / 🔴 需改进 <70

**审查结论**：

| 结论 | 条件 |
|------|------|
| **PASS** ✅ | 评分 ≥ 90 且无 critical 问题 |
| **WARN** 🟡 | 评分 ≥ 70 或仅有 medium/low 问题 |
| **FAIL** 🔴 | 评分 < 70 或存在 critical/high 问题 |

> 完整评分细则见 `references/checklist.md`

---

## 七、直接修复

审查发现问题后，对**确定性**问题直接修复（不是只报告）：

**会自动修复的**：
- 删除 `console.log` / `debugger` 调试遗留
- 替换硬编码字符串为常量引用
- 补充缺失的类型标注（非破坏性）
- 删除不必要 JSX 嵌套包装
- 删除解释 WHAT 的冗余注释

**不会自动修复的**（需人工判断）：
- 组件拆分 / Hook 提取 → 建议调用 adfa-refactor-advisor 或 adfa-hooks-extractor
- 架构级变更 → 标注并建议
- 业务逻辑修改 → 不触及

每次自动修复后标注 `[已修复]`，报告中列出修复内容。

---

## 八、输出：审查报告

### 产物位置

| 模式 | 输出路径 |
|------|---------|
| 敏捷模式 | `./review-report.md` 或用户指定 |
| 工程模式 | `docs/workflows/{任务ID}/review-report.md` |

### CLI 集成（工程模式）

```
# 执行前：获取编译后的执行上下文
node skills/adfo-harness-runner/scripts/harness-cli.js context {任务ID}

# 执行后：校验产物并更新状态
node skills/adfo-harness-runner/scripts/harness-cli.js verify {任务ID} REVIEW {产物路径}
```

### 报告格式（行动项前置）

```markdown
---
phase: REVIEW
status: completed
qualityGate: {pass|warn|fail}
score: {N}/100 ({🟢优秀/🟡良好/🔴需改进})
---

# {任务名} - 代码审查报告

## 概要
- 审查文件: X 个 | 发现问题: Y 个 (critical: A, high: B, medium: C, low: D)
- 已自动修复: Z 个 | 加权评分: N/100 | 影响模块: M 个

## ⚠️ 必须处理（Critical + High）
| # | 严重度 | 问题 | 位置 | 修复建议 |
|---|--------|------|------|---------|
| 1 | 🔴 | {问题描述} | `file:行号` | ```diff // 修复建议代码 ``` |

## 📋 建议优化（Medium + Low）
| # | 严重度 | 问题 | 位置 | 建议 |
|---|--------|------|------|------|

## 🔍 副作用影响
| 变更项 | 影响模块 | 调用链 | 风险等级 |
|--------|---------|--------|---------|

## 📊 维度评分
| 维度 | 得分 | 扣分原因 |
|------|------|---------|

## 审查结论：{PASS ✅ / WARN 🟡 / FAIL 🔴}

{若 FAIL}
阻塞项：
- {问题1} → 修复建议：{建议}
→ 建议调用 `adfp-code-implementer`（修复模式）或 `adfa-refactor-advisor`（结构性重构）
```

---

## 八、异常处理

### SubAgent 失败重试机制

当委托 `adfo-task-orchestrator` 执行的 7 维度 SubAgent 出现失败时：

| 失败类型 | 处理策略 |
|---------|---------|
| 单维度失败 | 重试 1 次，仍失败则标记该维度为「待人工审查」，继续其他维度 |
| 多维度失败（≥3） | 终止并行执行，回退为串行逐维度审查，记录失败原因 |
| 全部失败 | 输出错误报告，建议用户检查环境或手动审查 |

**重试参数**：最大重试次数 1 次，重试间隔 2 秒。

### 空文件/无变更处理

| 场景 | 处理流程 |
|------|---------|
| 目标文件为空 | 跳过该文件，报告中标注「文件为空，已跳过」 |
| Git 模式无变更 | 输出提示「当前无待审查变更」，询问用户是否切换模式 |
| `--path` 目录无代码文件 | 输出提示「目录下无可审查代码文件」，列出已扫描的文件类型 |
| 部分文件为空 | 正常审查非空文件，空文件单独列出说明 |

### 无效参数容错处理

| 参数问题 | 容错策略 |
|---------|---------|
| `--commit=<hash>` 不存在 | 提示「提交不存在」，列出最近 5 个提交供选择 |
| `--path=<path>` 路径无效 | 提示「路径不存在」，显示当前工作目录结构 |
| `--file=<file>` 文件不存在 | 提示「文件不存在」，建议使用 `--path` 模式 |
| `--focus=<维度>` 无效值 | 提示有效维度列表（basic/quality/perf/side-effect），默认执行全部维度 |
| 参数组合冲突（如 `--commit` + `--staged`） | 按优先级选择：`--commit` > `--staged` > `--path` > `--file`，并提示用户 |

---

## 九、产物校验

审查报告生成后执行以下校验步骤：

### 校验清单

| 检查项 | 校验规则 | 失败处理 |
|--------|---------|---------|
| 报告文件存在 | 确认输出路径已生成文件 | 重新生成报告 |
| Frontmatter 完整 | 包含 phase/status/qualityGate/score 四字段 | 补充缺失字段 |
| 问题引用准确 | 每个问题有具体文件:行号引用 | 标注「引用缺失」待确认 |
| 评分计算正确 | 各维度扣分之和与总分一致 | 重新计算评分 |
| 结论与评分一致 | PASS/WARN/FAIL 与评分区间匹配 | 修正结论状态 |

### 校验流程

```
生成报告 → 检查文件存在 → 校验 Frontmatter → 校验问题引用 → 校验评分计算 → 校验结论一致性 → 输出最终报告
```

校验失败时在报告末尾添加「校验警告」章节，说明需要人工确认的项目。

---

## 十、约束规则

1. 不确定的信息不做假设，标注「待确认」
2. 每项检查必须有具体文件/行号引用
3. 直接修复仅限确定性修改，架构级问题建议走 adfa-refactor-advisor
4. FAIL 时必须输出阻塞项清单和修复建议
5. 副作用分析必须追踪至少一级下游调用方
6. >10 文件变更时标注简要审查范围
7. 中文输出

---

## 十一、模板注入

> 共享配置（技术栈、目录约定）由 `adfo-harness-runner/templates/custom.md` 统一管理。

`templates/custom.md` — 项目特定的审查规则：

```markdown
# 项目审查规则

## 必须通过的检查项（阻塞性）
- {项目特定约束，如："所有 API 调用通过统一封装层"}

## 忽略的规则
- {不需要检查的规则}

## 严重度调整
- {将某规则的严重度提升或降低}

## 审查模式偏好
- 默认模式：{--staged / --path / 完整文件}
- 默认聚焦维度：{all / basic / quality / perf / side-effect}
```

## 职责边界

| 技能 | 边界 |
|------|------|
| adfo-task-orchestrator | code-reviewer 定义审查维度和评分规则，task-orchestrator 负责**调度 7 个维度 SubAgent 的并发执行和结果汇总** |
| adfa-refactor-advisor | code-reviewer **诊断问题+分级**，refactor-advisor **治疗+重构方案+对照代码** |
| adfa-edge-case-master | code-reviewer 发现边界覆盖不足，edge-case-master 补充测试用例 |
| adfa-hooks-extractor | code-reviewer 发现可提取的重复逻辑，hooks-extractor 生成 Hook 代码 |
| adfp-code-implementer | code-reviewer 通过后标记完成；code-reviewer 失败时 code-implementer（修复模式）修复阻塞项。**修复分工**：code-reviewer 自动修复**确定性**问题（console.log、缺类型、冗余注释），code-implementer 修复模式处理**结构性**阻塞（组件拆分、Hook 提取、架构调整） |
| adfa-critical-explorer | 审查维度共享分类法见 `references/review-dimensions.md`，critical-explorer 审设计方案（编码前），code-reviewer 审代码（编码后） |
