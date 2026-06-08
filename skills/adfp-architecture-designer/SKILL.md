---
name: adfp-architecture-designer
description: "前端架构设计专家。三大模式：1）已有项目——并发5个SubAgent扫描现有代码，识别可复用原子化模块、依赖拓扑、规范模式；2）新项目——基于SPEC智能规划文件层级架构和模块边界；3）快速相似匹配——给定功能描述快速检索项目中已有的相似组件、模式、实现路径，输出Top-5匹配清单和复用建议。产物为architecture.md（全量）或component-match.md（快速模式），包含可复用清单、依赖图、文件层级蓝图。是SPEC到DESIGN之间的架构桥梁。TRIGGER: 用户说'架构设计'、'architecture'、'分析项目架构'、'规划文件结构'、'复用分析'、'架构实施计划'、'模块拆分'、'依赖分析'、'找相似组件'、'有什么类似的'、'项目中怎么做{功能}'、'参考一下'、'看看已有的'、'有没有现成的'。Use proactively when: SPEC完成后需要将静态架构描述转化为可执行的实施计划；在现有项目中识别可复用模块；实施/设计前需要参考项目中已有的同类实现模式。"
---

# 前端架构设计专家

> 入口页。已有项目 5 个 SubAgent 详情见 `references/sub-agents.md`；新项目规划详情见 `references/new-project.md`。

SPEC 和 DESIGN 之间的架构桥梁。不做代码实现，只做架构分析和规划。

核心价值：`SPEC→"怎么组织、按什么顺序建、哪些能复用"→DESIGN`

快速匹配价值：`功能描述→"项目中已有的类似方案，直接复用或参考"→DESIGN`

---

## 模式路由（三模式）

| 条件 | 模式 |
|------|------|
| `package.json` + `src/` 有代码 + **触发词含"找相似"、"参考"、"有没有现成的"、"类似的"** | **模式 C：快速相似匹配** → 轻量 2 SA 扫描 |
| `package.json` + `src/` 有代码 | **模式 A：已有项目分析** → 5 SA 全量扫描 |
| 无代码或空项目 | **模式 B：新项目规划** → 智能层级规划 |

> 模式判定从触发词和项目状态两个维度入手：含相似匹配关键词时优先进入模式 C，否则走原有模式 A/B 判定逻辑。

## 平台感知（技术栈检测）

已有项目分析前，自动从 `package.json` 或上下文检测目标框架，路由到对应扫描策略：

| 检测条件 | 路由目标 | SubAgent 扫描重点 |
|------|---------|------------------|
| `React*` / `JSX` / `TSX` | React 扫描 | components/、hooks/、JSX 模板 |
| `Vue*` / `Nuxt` | Vue 扫描 | components/、composables/、SFC 结构 |
| `微信小程序` / `小程序` | 小程序扫描 | pages/、components/、WXML/WXSS |
| `Taro` / `uni-app` | 跨端扫描 | 统一 DSL + 条件编译 |
| 未知 | 通用扫描 | 按目录结构推断 |

> 工程模式下从 `state.json.techStack` 读取已识别的技术栈，避免重复扫描。

---

## 模式 A：已有项目分析

> 组件扫描（原 SA1）、Hooks/逻辑盘点（原 SA2）、Service/API 扫描（原 SA3）已提取为独立技能 `adfa-code-scanner`。本模式先调用 `adfa-code-scanner` 获取资产清单，再通过 2 个 SubAgent 做架构层面的分析。

### Step 1：调用 adfa-code-scanner 扫描资产

先调度 `adfa-code-scanner`（全量扫描模式），获取组件清单、逻辑资产和 API 资产报告，作为后续架构分析的输入材料。

### Step 2：2 个架构 SubAgent 并发分析

2 个 SubAgent 通过 `adfo-task-orchestrator` 并发执行（全部无依赖）：

| ID | 职责 | 输入 | 产出 |
|----|------|------|------|
| SA4 | 依赖关系图映射器 | scanner 的组件清单 + 项目代码 | import/export 拓扑 + 循环依赖检测 |
| SA5 | 结构规范分析器 | scanner 的逻辑/API 资产 + 项目目录 | 目录/命名/样式/TS 规范 |

> 具体 SubAgent 提示词和输出格式见 `references/sub-agents.md`

### Step 3：汇总整合

去重 → 冲突校验 → 优先级排序 → 输出可复用清单 → 生成模块依赖图 → 输出 `architecture.md`

## 模式 B：新项目规划

基于 SPEC 生成文件层级：
- 原子化优先（原子/分子/组织/模板）
- 就近原则（类型/样式/测试同目录）
- 扁平优先（≤3 层）
- 领域隔离（业务模块不互相引用）

> 详细规划和输出示例见 `references/new-project.md`

---

## 模式 C：快速相似匹配

> 轻量模式。组件/模式匹配（原 SA1-快速）和逻辑/API 匹配（原 SA2-快速）已提取为独立技能 `adfa-code-scanner`（模式 B）。本模式直接调用 `adfa-code-scanner` 的快速匹配能力。

**定位**：在实施/设计前快速了解项目中已有的同类实现模式，避免重复造轮子。

**核心流程**：

```
接收功能描述 → 调用 adfa-code-scanner(快速匹配模式) → 接收 component-match.md → 输出给用户
```

| 步骤 | 说明 |
|------|------|
| **C1 接收输入** | 用户描述要查找的功能/组件 |
| **C2 委托扫描** | 调用 `adfa-code-scanner` 快速匹配模式，传入功能描述 |
| **C3 接收结果** | 接收 scanner 返回的 `component-match.md` |
| **C4 架构链接** | 如果匹配结果建议参考模式，标注该模式在 architecture.md 中的位置 |
| **C5 输出** | `component-match.md`（如有架构增强，追加架构分析章节） |

> 快速匹配的 SubAgent 提示词见 `adfa-code-scanner/references/quick-match.md`。

**相似度评分标准**：

| 维度 | 权重 | 匹配方式 |
|------|------|---------|
| 功能关键词命中 | 40% | 文件名/组件名/函数名与用户描述关键词的重叠度 |
| 结构相似度 | 30% | Props 结构、依赖模式、返回类型的相似性 |
| 导入依赖模式 | 20% | 相同的外部库/工具函数引用 |
| 文件命名模式 | 10% | 目录结构命名风格的匹配度 |

**输出产物**：

```markdown
---
phase: QUICK_MATCH
status: completed
---

# {功能描述} - 相似组件匹配报告

## 查询条件
- 功能描述：{用户输入}
- 目标框架：{框架}
- 扫描范围：{路径}

## Top-5 匹配结果

| 排名 | 匹配项 | 路径 | 相似度 | 类型 | 引用次数 |
|------|--------|------|--------|------|---------|
| 1 | {组件/逻辑名} | `src/...` | 92% | 组件 | 3 处 |

## 差异分析

| 匹配项 | 与需求的差异 | 是否可直接复用 |
|--------|-------------|--------------|
| {组件名} | Props 多了 2 个，需适配 | ✅ 简单修改 |

## 复用建议
- **直接复用**：{组件名} 可直接 import 使用
- **参考模式**：{组件名} 的实现模式可复制到新组件
- **新增包装**：基于 {组件名} 封装一层适配

## 未发现匹配时
- 项目内未发现明显相似组件
- 建议：从零实现，参考以下更泛化的模式：{列举项目通用模式}
```

**产物路径**：

| 模式 | 路径 |
|------|------|
| 敏捷模式 | `./component-match.md` |
| 工程模式 | `docs/workflows/{任务ID}/component-match.md` |

**触发约束**：
- 仅扫描已有代码项目，不适用于空项目（空项目无代码可匹对）
- 单次扫描 Top-5，不展开全量架构
- 快速模式不生成 `architecture.md`（避免与全量模式混淆）

---

## 模块依赖图

两种模式均输出，供 `adfo-harness-runner` 生成实施顺序。

```
模块依赖图：{模块A} → {模块B} → {模块C}
循环依赖：{无 / X 处}
可并行：{模块A 与 B 无依赖 → 可并行开发}
```

---

## 输出

```markdown
---
phase: ARCHITECTURE
status: completed
qualityGate: pass
---
# {任务} - 架构设计文档
## 项目概况 | 可复用清单 | 文件层级 | 模块依赖图 | 架构建议 | 风险约束
```

| 模式 | 输出路径 |
|------|---------|
| 敏捷模式 | `./architecture.md` |
| 工程模式 | `docs/workflows/{任务ID}/architecture.md` |

---

## 约束规则

1. 不做代码实现
2. 不做内联逻辑提取（归 adfa-hooks-extractor）
3. 不做拓扑排序和实施顺序（归 adfo-harness-runner）
4. **已有项目模式（模式A）**：必须先调用 `adfa-code-scanner` 获取资产清单，不自行重复扫描
5. **快速模式（模式C）**：委托 `adfa-code-scanner` 快速匹配模式执行，不自行调度扫描 SubAgent
6. **新项目模式（模式B）**：无代码可扫描，不调用 scanner，直接基于 SPEC 规划
7. 已有项目以实际代码为准
8. 原子化标准：单一职责 + Props 最小化 + ≤200行

## 执行指令

当用户触发本技能时，按以下步骤执行：

### 模式判定

0. **识别模式**：检查触发词 → 含"找相似"/"参考"/"有没有现成的" → **模式 C**；否则 → 检查项目是否有代码 → 有→**模式 A**；无→**模式 B**

### 模式 C 快速相似匹配

1. **接收输入**：提取用户描述的功能/组件关键词
2. **委托扫描**：调用 `adfa-code-scanner` 快速匹配模式，传入功能描述和框架信息
3. **接收结果**：等待 scanner 返回 `component-match.md`
4. **架构链接**：如果匹配结果建议参考模式，标注该模式在架构中的位置
5. **输出产物**：输出 `component-match.md`（如有增强，追加架构分析章节），包含 phase: QUICK_MATCH front-matter

### 模式 A 已有项目分析

1. **平台感知**：检测/读取技术栈
2. **调用 adfa-code-scanner**：调度 `adfa-code-scanner` 全量扫描模式，获取 `code-scan-report.md`（组件/逻辑/API 资产清单）
3. **生成架构 SubAgent 任务**：以 scanner 产出的资产清单为输入，创建 SA4-SA5 任务清单，委托 `adfo-task-orchestrator` 并发调度（最大并发 2）
4. **汇总整合**：合并 scanner 资产清单 + SA4 依赖图 + SA5 规范分析 → 去重 → 冲突校验 → 优先级排序 → 可复用清单
5. **生成模块依赖图**：标注依赖方向、循环依赖、可并行模块
6. **输出产物**：生成 `architecture.md`，包含 phase: ARCHITECTURE front-matter

### 模式 B 新项目规划

1. **规划文件层级**：按原子化优先 + 就近原则 + 扁平优先 + 领域隔离 四原则生成目录树
2. **生成模块依赖图**
3. **输出产物**：生成 `architecture.md`

> 架构相关 SubAgent 提示词见 `references/sub-agents.md`（SA4 依赖关系图映射器 + SA5 结构规范分析器），新项目详细流程见 `references/new-project.md`。扫描相关详情见 `adfa-code-scanner/references/sub-agents.md`。

## 输出原则

1. **不重复代码** — 不粘贴大段源码，只提炼架构层面的信息
2. **不过度展开** — 每个模块/组件用 1-2 句话描述职责，不深入实现细节
3. **可执行优先** — 依赖图标注「可并行」和「串行依赖」，供 harness-runner 直接使用
4. **验收导向** — 每个架构决策标注理由，供下游 DESIGN 阶段理解
5. **一致性优先** — 已有项目以实际代码为准，不预设理想架构
6. **快速模式不降质** — 即使只扫 2 个 SubAgent，匹配清单必须有意义、有可操作的建议

## 架构质量检查清单

### 模式 A/B 架构设计

| # | 检查项 | 标准 |
|---|--------|------|
| 1 | **阶段一致性** | front-matter 中 `phase: ARCHITECTURE` |
| 2 | **内容实质性** | 正文 ≥ 50 字符，不只含 front-matter |
| 3 | **scanner 资产完整** | 已调用 `adfa-code-scanner` 获取资产清单，不自行重复扫描 |
| 4 | **可复用清单完整** | 列出所有原子/分子级候选，标注引用次数 |
| 5 | **依赖图完整** | 含依赖拓扑 + 循环依赖检测 + 可并行标注 |
| 6 | **规范分析** | 目录/命名/样式/TS 四项全覆盖 |
| 7 | **边界清晰** | 不包含本技能不应产出的内容（组件树、实施顺序） |

### 模式 C 快速匹配

| # | 检查项 | 标准 |
|---|--------|------|
| 1 | **阶段一致性** | front-matter 中 `phase: QUICK_MATCH` |
| 2 | **内容实质性** | 正文 ≥ 50 字符，不只含 front-matter |
| 3 | **scanner 委托** | 已通过 `adfa-code-scanner` 执行快速匹配 |
| 4 | **Top-5 完整** | 至少输出 Top-3（能找到的话），含相似度评分 |
| 5 | **差异分析** | 每项匹配必须说明与需求的差异 |
| 6 | **复用建议** | 给出明确可操作建议（直接复用/参考模式/新增包装） |
| 7 | **产物正确** | 输出 `component-match.md`，非 `architecture.md` |

## 技能协作

| 技能 | 关系 | 说明 |
|------|------|------|
| `adfp-spec-generator` | 前置输入（新项目模式） | SPEC 的页面架构和路由作为文件层级蓝图输入 |
| `adfa-code-scanner` | **前置输入（已有项目模式）** | 消费 scanner 的组件/逻辑/API 资产清单，替代原 SA1-SA3 |
| `adfp-component-designer` | 后置消费 | 基于 architecture.md 的可复用清单避免重复设计 |
| `adfo-harness-runner` | 编排调度 | 读取依赖图生成实施顺序 |
| `adfo-task-orchestrator` | 委托调度 | SA4-SA5 通过 orchestrator 并发执行 |
| `adfa-hooks-extractor` | 建议下游 | SA2（已被 scanner 替代）发现内联逻辑时建议调用 |
| `adfa-edge-case-master` | 建议下游 | 架构文档末推荐生成测试策略 |

## CLI 集成（工程模式）

```bash
# 执行前：获取编译后的执行上下文
node skills/adfo-harness-runner/scripts/harness-cli.js context {任务ID}

# 执行后：校验产物并更新状态
node skills/adfo-harness-runner/scripts/harness-cli.js verify {任务ID} ARCHITECTURE {产物路径}
```

## 模板注入

> 共享配置由 `adfo-harness-runner/templates/custom.md` 统一管理。
`templates/custom.md` — 项目特定的架构规范（目录约定、命名约定、原子化标准）。
