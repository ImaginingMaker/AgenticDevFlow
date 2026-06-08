---
name: adfa-code-scanner
description: "前端项目代码扫描与资产盘点专家。双模式运行：1) 全量扫描模式——并发3个SubAgent扫描整个项目，输出组件清单+原子化评级、Hooks/工具函数清单+引用分析、Service/API调用清单+封装评估；2) 快速匹配模式——并发2个SubAgent，给定功能描述快速查找项目中已有的相似组件和逻辑单元。智能感知目标框架，路由到对应扫描策略。TRIGGER: 用户说'扫描代码'、'代码扫描'、'扫描组件'、'盘点代码'、'分析项目代码'、'项目中有哪些组件'、'找组件'、'代码审计'、'代码资产盘点'、'项目中有什么'。Use proactively when: 用户需要在实施前了解现有代码资产、代码审查前做全量扫描、重构前评估影响范围、快速查找项目中已有的类似实现。"
---

# 前端代码扫描与资产盘点专家

> 入口页。全量扫描 3 个 SubAgent 详情见 `references/sub-agents.md`；快速匹配模式详情见 `references/quick-match.md`。

从 `adfp-architecture-designer` 提取的独立扫描能力，可在任何阶段独立调用。不做架构规划、不做依赖拓扑、不做代码实现——只做**扫描与盘点**。

---

## 职责边界

| 技能 | 关系 |
|------|------|
| `adfp-architecture-designer` | **上游**：本技能提供资产扫描数据，architecture-designer 用其做架构决策（SA4 依赖图 + SA5 结构分析 + 汇总整合） |
| `adfa-code-context` | **互补**：code-context 追踪**单个文件/模块**的调用链（微观），本技能扫描**整个项目**做编目（宏观） |
| `adfa-hooks-extractor` | **互补**：hooks-extractor 分析**给定代码**找可提取的逻辑，本技能盘点**所有已有**的逻辑单元 |
| `adfa-refactor-advisor` | **上游**：本技能扫描发现混乱模式，refactor-advisor 出重构方案 |
| `adfp-code-implementer` | **上游**：实施前扫描可复用资产，避免重复造轮子 |
| `adfo-harness-runner` | **编排调度**：IMPLEMENT 前可调度本技能扫描现有代码 |
| `adfa-edge-case-master` | **上游**：本技能识别 API 封装完整性，edge-case-master 补充缺失的测试 |

---

## 模式路由（双模式）

| 条件 | 模式 |
|------|------|
| 触发词含"找相似"、"参考"、"有没有现成的"、"类似的"、"项目中怎么做" | **模式 B：快速相似匹配** → 轻量 2 SA |
| 其他情况（扫描、盘点、审计） | **模式 A：全量扫描** → 3 SA 并发 |

---

## 平台感知

### 谁是感知者？

本技能自身执行框架检测，**不依赖外部注入**。检测结果路由到对应框架的扫描策略。

检测有三条链路，按优先级依次尝试：

**链路 A — 工程模式（被动接收）**：
- 当被 `adfo-harness-runner` 调度时，从 `state.json.techStack` 读取目标框架
- 由编排器在 `context` 命令中注入 `techStack` 上下文
- 此为最高优先级，直接使用不重复检测

**链路 B — 敏捷模式（主动检测）**：
- 直接调用本技能时，技能依次扫描：`package.json` 依赖 → 框架配置文件（`next.config.*`、`nuxt.config.*`、`vite.config.*`、`project.config.json`、`taro-config.*`）→ 目录结构
- 检测到 → 直接使用；检测不到 → 进入链路 C

**链路 C — 用户指定（显式询问）**：
- 向用户提问：「目标框架是哪个？React / Vue 3 / 微信小程序 / Taro/uni-app / 通用前端」
- 接收用户回答后使用
- 用户不确定或跳过 → 进入通用降级路径

**全部失败 → 通用降级**：按通用前端维度扫描，提示用户可指定框架以获得更精确的扫描结果。

### 检测路由表

| 检测条件 | 路由目标 | SubAgent 扫描重点 |
|------|---------|------------------|
| `React*` / `JSX` / `TSX` | React 扫描 | components/、hooks/、JSX 模板 |
| `Vue*` / `Nuxt` | Vue 扫描 | components/、composables/、SFC 结构 |
| `微信小程序` / `小程序` | 小程序扫描 | pages/、components/、WXML/WXSS |
| `Taro` / `uni-app` | 跨端扫描 | 统一 DSL + 条件编译 |
| 未知 | 通用扫描 | 按目录结构推断 |

> 工程模式下从 `state.json.techStack` 读取已识别的技术栈，避免重复扫描。

---

## 模式 A：全量扫描

3 个 SubAgent 通过 `adfo-task-orchestrator` 并发执行（全部无依赖，最大并发 3）：

| ID | 职责 | 扫描范围 | 产出 |
|----|------|---------|------|
| SA1 | 组件扫描器 | `components/` `pages/` 下的 `.tsx`/`.vue`/`.wxml` 等 | 组件清单 + 原子化评级 + 可复用候选 |
| SA2 | Hooks/逻辑盘点器 | `hooks/` `composables/` `utils/` `lib/` 下的 `.ts`/`.js` | Hook/Util 清单 + 引用次数 + 重复实现检测 |
| SA3 | Service/API 扫描器 | `services/` `api/` `utils/request` 等 API 调用代码 | API 调用清单 + 封装完整性评估 + 改进建议 |

> 具体 SubAgent 提示词和输出格式见 `references/sub-agents.md`

### 汇总流程

```
接收 3 SA 结果 → 去重 → 冲突校验 → 按资产类型分组 → 输出扫描报告
```

### 输出产物

```markdown
---
phase: CODE_SCAN
status: completed
qualityGate: pass
---

# {项目名} - 代码资产扫描报告

## 一、组件资产
### 组件清单
| 组件名 | 路径 | 行数 | Props 数 | 原子化评级 | 复用次数 |
|--------|------|------|---------|-----------|---------|

### 可复用候选
### 拆分建议

## 二、逻辑资产
### Hook/Util 清单
| 名称 | 路径 | 类型 | 引用次数 | 使用组件 |
|------|------|------|---------|---------|

### 引用模式分析
### 重复实现检测

## 三、API 资产
### API 调用清单
| 方法 | 端点 | 使用页面/组件 | 封装方式 | 错误处理 |
|------|------|-------------|---------|---------|

### 封装完整性评估
### 改进建议
```

| 模式 | 输出路径 |
|------|---------|
| 敏捷模式（直接调用） | `./code-scan-report.md` 或用户指定 |
| 工程模式（通过 harness） | `docs/workflows/{任务ID}/code-scan-report.md` |

---

## 模式 B：快速相似匹配

> 轻量模式。给定功能描述，快速查找项目中已有的相似组件和逻辑单元。
> 适用于实施/设计前快速了解现有资产，避免重复造轮子。

### 核心流程

```
接收功能描述 → 平台感知 → 并发 2 SA 扫描 → 相似度分析 → 输出匹配清单
```

2 个 SubAgent 通过 `adfo-task-orchestrator` 并发执行（全部无依赖，最大并发 2）：

| ID | 职责 | 扫描范围 | 产出 |
|----|------|---------|------|
| SA1-快速 | 组件/模式匹配器 | `components/` `pages/` 目录下的 UI 文件 | Top-5 相似组件 + 行数 + Props + 导入方 |
| SA2-快速 | 逻辑/API 匹配器 | `hooks/` `services/` `utils/` 下的 `.ts` 文件 + API 路由 | Top-5 相似逻辑单元 + 引用次数 + 调用方 |

> 具体 SubAgent 提示词见 `references/quick-match.md`

### 相似度评分标准

| 维度 | 权重 | 匹配方式 |
|------|------|---------|
| 功能关键词命中 | 40% | 文件名/组件名/函数名与用户描述关键词的重叠度 |
| 结构相似度 | 30% | Props 结构、依赖模式、返回类型的相似性 |
| 导入依赖模式 | 20% | 相同的外部库/工具函数引用 |
| 文件命名模式 | 10% | 目录结构命名风格的匹配度 |

### 输出产物

```markdown
---
phase: QUICK_MATCH
status: completed
---

# {功能描述} - 相似代码匹配报告

## 查询条件
- 功能描述：{用户输入}
- 目标框架：{框架}
- 扫描范围：{路径}

## Top-5 匹配结果
| 排名 | 匹配项 | 路径 | 类型 | 相似度 | 引用次数 |
|------|--------|------|------|--------|---------|

## 差异分析
| 匹配项 | 与需求的差异 | 是否可直接复用 |
|--------|-------------|--------------|

## 复用建议
- **直接复用**：相似度 ≥ 85%，可直接 import
- **参考模式**：相似度 60-84%，参考实现模式
- **新增包装**：相似度 < 60%，可封装部分逻辑

## 未发现匹配时
- 项目内未发现明显相似项
- 建议从零实现
```

| 模式 | 输出路径 |
|------|---------|
| 敏捷模式 | `./component-match.md` |
| 工程模式 | `docs/workflows/{任务ID}/component-match.md` |

---

## CLI 集成（工程模式）

```bash
# 执行前：获取编译后的执行上下文
node skills/adfo-harness-runner/scripts/harness-cli.js context {任务ID}

# 执行后：校验产物并更新状态
node skills/adfo-harness-runner/scripts/harness-cli.js verify {任务ID} CODE_SCAN {产物路径}
```

---

## 约束规则

1. **只读不写** — 只分析代码，不修改任何文件
2. **全量模式**必须通过 `adfo-task-orchestrator` 调度 3 个 SubAgent
3. **快速模式**仅在已有代码项目中适用（空项目无可匹对代码）
4. 快速模式不输出全量扫描报告（避免混淆）
5. 原子化评级标准：原子（≤100行，Props≤3）、分子（≤200行，Props≤5）、组织（>200行，建议拆分）
6. 不输出架构建议（归 adfp-architecture-designer）、不输出重构方案（归 adfa-refactor-advisor）
7. 汇总时标记 SA 间发现的重叠项（如某组件同时被 SA1 和 SA3 标记）

## 执行指令

当用户触发本技能时，按以下步骤执行：

### 模式判定

检查触发词 → 含"找相似"/"参考"/"有没有现成的"/"项目中怎么做" → **模式 B**；否则 → **模式 A**

### 模式 A：全量扫描

1. **平台感知**：检测/读取技术栈，传递给后续 SubAgent
2. **生成 SubAgent 任务**：创建 SA1-SA3 任务清单，委托 `adfo-task-orchestrator` 并发调度（最大并发 3）
3. **汇总整合**：去重 → 冲突校验 → 按组件/逻辑/API 分组 → 输出 `code-scan-report.md`
4. **输出建议**：在报告末尾推荐下游技能（如发现可复用组件推荐 architecture-designer、发现封装不完整推荐 edge-case-master）

### 模式 B：快速相似匹配

1. **接收输入**：提取用户描述的功能/组件关键词
2. **平台感知**：检测/读取技术栈
3. **生成 SubAgent 任务**：创建 SA1-快速 + SA2-快速 任务清单，委托 `adfo-task-orchestrator` 并发调度（最大并发 2）
4. **相似度分析**：关键词匹配 + 结构相似度评分 → Top-5
5. **输出产物**：生成 `component-match.md`

### 关于 `adfp-architecture-designer` 的兼容说明

本技能是从 `adfp-architecture-designer` 模式 A 的 SA1-SA3 和模式 C 的 SA1-快速/SA2-快速中提取的独立技能。architecture-designer 在独立调用时仍保留其模式 A（SA4+SA5）、模式 B（新项目）和模式 C 的汇总能力，但 SA1-SA3 的扫描推荐由本技能完成。两个技能形成上下游关系：

```
adfa-code-scanner（全量扫描 → 输出清单）→ adfp-architecture-designer（依赖图+结构分析 → 输出architecture.md）
adfa-code-scanner（快速匹配 → 输出匹配清单）→ adfp-component-designer（基于复用设计组件）
```

---

## 质量检查清单

### 模式 A 全量扫描

| # | 检查项 | 标准 |
|---|--------|------|
| 1 | **阶段一致性** | front-matter 中 `phase: CODE_SCAN` |
| 2 | **内容实质性** | 正文 ≥ 50 字符，不只含 front-matter |
| 3 | **三章完整** | 组件资产 + 逻辑资产 + API 资产 全覆盖 |
| 4 | **原子化评级** | 每个组件标注 原子/分子/组织/候选拆分 |
| 5 | **边界清晰** | 不包含架构建议、依赖拓扑、重构方案 |

### 模式 B 快速匹配

| # | 检查项 | 标准 |
|---|--------|------|
| 1 | **阶段一致性** | front-matter 中 `phase: QUICK_MATCH` |
| 2 | **内容实质性** | 正文 ≥ 50 字符，不只含 front-matter |
| 3 | **Top-5 完整** | 至少输出 Top-3（能找到的话），含相似度评分 |
| 4 | **差异分析** | 每项匹配说明与需求的差异 |
| 5 | **复用建议** | 明确可操作建议（直接复用/参考模式/新增包装） |

---

## 模板注入

> 共享配置由 `adfo-harness-runner/templates/custom.md` 统一管理。

`templates/custom.md` — 本技能特有的扫描规则配置（扫描路径映射、原子化评级阈值、忽略模式）。
