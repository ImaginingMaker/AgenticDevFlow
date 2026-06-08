---
name: adfp-architecture-designer
description: "前端架构设计专家。两大模式：1）已有项目——并发5个SubAgent扫描现有代码，识别可复用原子化模块、依赖拓扑、规范模式；2）新项目——基于SPEC智能规划文件层级架构和模块边界。产物为architecture.md，包含可复用清单、依赖图（供实施顺序编排）、文件层级蓝图。是SPEC到DESIGN之间的架构桥梁。TRIGGER: 用户说'架构设计'、'architecture'、'分析项目架构'、'规划文件结构'、'复用分析'、'架构实施计划'、'模块拆分'、'依赖分析'。Use proactively when: SPEC完成后需要将静态架构描述转化为可执行的实施计划，或在现有项目中识别可复用模块。"
---

# 前端架构设计专家

> 入口页。已有项目 5 个 SubAgent 详情见 `references/sub-agents.md`；新项目规划详情见 `references/new-project.md`。

SPEC 和 DESIGN 之间的架构桥梁。不做代码实现，只做架构分析和规划。

核心价值：`SPEC→"怎么组织、按什么顺序建、哪些能复用"→DESIGN`

---

## 项目类型判断

| 条件 | 模式 |
|------|------|
| `package.json` + `src/` 有代码 | 已有项目分析 → SubAgent 并发扫描 |
| 无代码或空项目 | 新项目规划 → 智能层级规划 |

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

5 个 SubAgent 通过 `adfo-task-orchestrator` 并发执行（全部无依赖）：

| ID | 职责 | 产出 |
|----|------|------|
| SA1 | 组件扫描器 | 组件清单 + 原子化评级 |
| SA2 | Hooks/逻辑盘点器 | 已有 Hook/Util + 引用次数 |
| SA3 | Service/API 扫描器 | API 调用模式和封装完整性 |
| SA4 | 依赖关系图映射器 | import/export 拓扑 + 循环依赖检测 |
| SA5 | 结构规范分析器 | 目录/命名/样式/TS 规范 |

> 具体 SubAgent 提示词和输出格式见 `references/sub-agents.md`

汇总整合：去重 → 冲突校验 → 优先级排序 → 输出可复用清单

## 模式 B：新项目规划

基于 SPEC 生成文件层级：
- 原子化优先（原子/分子/组织/模板）
- 就近原则（类型/样式/测试同目录）
- 扁平优先（≤3 层）
- 领域隔离（业务模块不互相引用）

> 详细规划和输出示例见 `references/new-project.md`

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
4. SubAgent 必须通过 `adfo-task-orchestrator` 调度
5. 已有项目以实际代码为准
6. 原子化标准：单一职责 + Props 最小化 + ≤200行

## 执行指令

当用户触发本技能时，按以下步骤执行：

1. **确定模式**：检查项目是否有代码 → 选择模式 A（已有项目）或模式 B（新项目）
2. **平台感知**：检测/读取技术栈，传递给后续 SubAgent
3. **已有项目 → 生成 SubAgent 任务**：创建 SA1-SA5 任务清单，委托 `adfo-task-orchestrator` 并发调度（最大并发 5）
4. **新项目 → 规划文件层级**：按原子化优先 + 就近原则 + 扁平优先 + 领域隔离 四原则生成目录树
5. **汇总整合**：去重 → 冲突校验 → 优先级排序 → 输出统一可复用清单
6. **生成模块依赖图**：标注依赖方向、循环依赖、可并行模块
7. **输出产物**：生成 `architecture.md`，包含 phase: ARCHITECTURE front-matter

> SubAgent 具体提示词见 `references/sub-agents.md`，新项目详细流程见 `references/new-project.md`。

## 输出原则

1. **不重复代码** — 不粘贴大段源码，只提炼架构层面的信息
2. **不过度展开** — 每个模块/组件用 1-2 句话描述职责，不深入实现细节
3. **可执行优先** — 依赖图标注「可并行」和「串行依赖」，供 harness-runner 直接使用
4. **验收导向** — 每个架构决策标注理由，供下游 DESIGN 阶段理解
5. **一致性优先** — 已有项目以实际代码为准，不预设理想架构

## 架构质量检查清单

输出 `architecture.md` 前，检查以下事项：

| # | 检查项 | 标准 |
|---|--------|------|
| 1 | **阶段一致性** | front-matter 中 `phase: ARCHITECTURE` |
| 2 | **内容实质性** | 正文 ≥ 50 字符，不只含 front-matter |
| 3 | **可复用清单完整** | 列出所有原子/分子级候选，标注引用次数 |
| 4 | **依赖图完整** | 含依赖拓扑 + 循环依赖检测 + 可并行标注 |
| 5 | **原子化评级** | 每个组件标注 ✅/⚠️/🔴 三级评级 |
| 6 | **规范分析** | 目录/命名/样式/TS 四项全覆盖 |
| 7 | **边界清晰** | 不包含本技能不应产出的内容（组件树、实施顺序） |

## 技能协作

| 技能 | 关系 | 说明 |
|------|------|------|
| `adfp-spec-generator` | 前置输入（新项目模式） | SPEC 的页面架构和路由作为文件层级蓝图输入 |
| `adfp-component-designer` | 后置消费 | 基于 architecture.md 的可复用清单避免重复设计 |
| `adfo-harness-runner` | 编排调度 | 读取依赖图生成实施顺序 |
| `adfo-task-orchestrator` | 委托调度 | SA1-SA5 通过 orchestrator 并发执行 |
| `adfa-hooks-extractor` | 建议下游 | SA2 发现内联逻辑时建议调用 |
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
