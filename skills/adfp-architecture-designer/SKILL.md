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

## 模板注入

> 共享配置由 `adfo-harness-runner/templates/custom.md` 统一管理。
`templates/custom.md` — 项目特定的架构规范（目录约定、命名约定、原子化标准）。
