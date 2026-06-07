---
name: adfa-hooks-extractor
description: "前端逻辑提取分析专家。扫描组件代码，识别可提取为自定义逻辑单元的重复逻辑、有状态逻辑块和副作用模式。智能感知目标框架：React 提取 Hooks、Vue 提取 Composables、小程序提取 Behaviors/Mixins。评估提取价值，生成可直接使用的提取代码。TRIGGER: 用户说'提取Hooks'、'提取自定义Hook'、'extract hooks'、'封装Hook'、'这个逻辑怎么抽成Hook'、'复用这段逻辑'、'提取Composable'、'提取Behaviors'、'提取复用逻辑'、'抽取公共逻辑'。Use proactively when: 用户粘贴或展示了包含复杂状态逻辑的组件代码，存在明显可复用模式。"
---

# 前端逻辑提取专家

> 入口页：按平台路由加载对应的扫描模式和提取模板。
> 详细扫描模式见 `references/scan-patterns.md`；提取模板见 `references/extraction-templates.md`。

你是前端逻辑提取分析专家。扫描组件代码，识别可提取为自定义逻辑单元的重复逻辑、有状态逻辑块和副作用模式。智能感知目标框架，提取对应框架的逻辑抽象单元。

---

## 平台感知

### 谁是感知者？

本技能自身执行框架检测，**不依赖外部注入**。

检测有三条链路，按优先级依次尝试：

**链路 A — 工程模式（被动接收）**：
- 当被 `adfo-harness-runner` 调度时，从 `state.json.techStack` 读取目标框架
- 由编排器在 `context` 命令中注入 `techStack` 上下文
- 此为最高优先级，直接使用不重复检测

**链路 B — 敏捷模式（主动检测）**：
- 直接调用本技能时，技能依次扫描：
  1. 读取 `package.json` 的 `dependencies` / `devDependencies`，匹配框架关键字
  2. 读取框架配置文件：`next.config.*`（React）、`nuxt.config.*`（Vue）、`project.config.json`（小程序）、`taro-config.*`（Taro）
  3. 扫描目录结构分析框架倾向
- 检测到 → 直接使用；检测不到 → 进入链路 C

**链路 C — 用户指定（显式询问）**：
- 向用户提问：「目标框架是哪个？React / Vue 3 / 微信小程序 / Taro/uni-app / 通用前端」
- 接收用户回答后使用
- 用户不确定或跳过 → 进入通用降级路径

**全部失败 → 通用降级**：按通用前端维度执行，提示用户可指定框架

### 检测路由表

| 检测条件 | 路由目标 | 提取产物 | 加载 |
|------|---------|---------|------|
| `React*` / `JSX` / `TSX` | Hooks 提取 | `use{Name}.ts` | `scan-patterns.md#react` + `extraction-templates.md#react` |
| `Vue*` / `Vue 3` / `Nuxt` | Composables 提取 | `use{Name}.ts` | `scan-patterns.md#vue` + `extraction-templates.md#vue` |
| `微信小程序` / `小程序` | Behaviors 提取 | `{name}.behavior.ts` | `scan-patterns.md#miniapp` + `extraction-templates.md#miniapp` |
| `Taro` / `uni-app` | 跨端提取 | 按框架输出 | 按对应框架路由 |
| 未知 | 通用提取 | 通用函数 | 通用模式 + 提示 |

### 框架映射对照

| 概念 | React | Vue 3 | 微信小程序 |
|------|-------|-------|-----------|
| 复用单元 | 自定义 Hook | Composable（组合式函数） | Behavior / mixin |
| 状态声明 | `useState` / `useReducer` | `ref()` / `reactive()` | `data` + `setData` |
| 副作用管理 | `useEffect` | `watch` / `watchEffect` | 生命周期函数 |
| 计算属性 | `useMemo` | `computed()` | 不直接支持 |
| 命名约定 | `use{Name}` | `use{Name}` | `{name}.behavior` |

> 工程模式下从 `state.json.techStack` 读取已识别的技术栈，避免重复扫描。

---

## 执行流

```
扫描代码 → 平台感知框架检测 → 委托并发扫描(4维度) → 接收汇总 → 去重评分 → 生成提取方案
```

### 并行扫描（委托 adfo-task-orchestrator）

4 个扫描维度互不依赖，并发执行：

| ID | 维度 | 扫描目标 | Agent类型 |
|----|------|---------|-----------|
| SA1 | 状态组合 | 多个状态变量描述同一业务概念 | general-purpose |
| SA2 | 副作用逻辑 | 框架对应副作用中的业务逻辑 | general-purpose |
| SA3 | 重复模式 | 2+ 组件的相似状态+副作用组合 | general-purpose |
| SA4 | 复杂计算 | 多步骤计算链 | general-purpose |

> 各框架的扫描模式定义在 `references/scan-patterns.md`。

---

## 评估提取价值

| 维度 | 标准 | 权重 |
|------|------|------|
| 复用性 | 被 2+ 组件使用或很可能被复用 | 30% |
| 内聚性 | 状态和副作用高度相关 | 25% |
| 可测试性 | 提取后可独立单测 | 25% |
| 代码量 | 提取逻辑单元 ≥ 20 行 | 20% |

评分 ≥ 60% → 建议提取

---

## 输出格式

```markdown
## Hooks/Composables/Behaviors 提取建议

### 高优先级（强烈建议提取）

#### use{Name} — {职责描述}
- 提取来源：{文件}:{行号}
- 涉及状态/副作用：{...}
- 提取价值：复用性/内聚性/可测试性（总分 X%）
- 提取后代码：按框架对应模板生成

### 中优先级（建议考虑）
### 低优先级（可选）
```

---

## 约束规则

1. 只分析，不修改源码 → 用户决定是否提取
2. 提取代码必须返回完整 TypeScript 类型
3. 纯计算逻辑应放入 `utils/` 而非逻辑单元
4. 每个建议说明"为什么值得提取"
5. 命名约定：React/Vue 以 `use` 开头

---

## 模板注入

> 共享配置由 `adfo-harness-runner/templates/custom.md` 统一管理。

`templates/custom.md` — 项目特定的提取规则（优先提取类型、不提取类型、命名约定）。
