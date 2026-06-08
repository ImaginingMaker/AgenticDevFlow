---
name: adfa-critical-explorer
description: >
  多子代理并发批判性维度挖掘器。接收前端组件/交互逻辑/架构方案/技术规格需求，
  自动并发拉起 6 个独立 SubAgent，各维度并行批判性挖掘、漏洞评审、
  多视角拆解，最后主 Agent 汇总结构化报告。
  自动感知目标框架（React/Vue/小程序/跨端），路由到框架特定的批判性审查维度。
  TRIGGER: 用户输入前端技术方案、组件设计、交互逻辑、技术方案、架构需求、需求文档；
  用户说"帮我分析这个方案"、"评审一下"、"找找问题"、"多角度分析"、"批判性审视"。
  Use proactively when: 用户输入前端技术方案需要深度评审时。
---

# 多维度批判性方案评审

> 入口页。6 个评审维度详情见 `references/critical-dimensions.md`；框架感知路由细则见同文件各框架章节。

多子代理并发批判性维度挖掘器，用于前端技术方案的深度评审。支持 React / Vue / 小程序 / 跨端框架的框架感知审查。

## 核心机制

**主 Agent 调度 → 平台感知路由 → 并行拉起 6 个独立 SubAgent → 各 SubAgent 独立单维度框架感知批判性探索 → 汇总整合输出**

---

## 平台感知

> 公共三链路检测机制（链路 A 工程模式 / 链路 B 敏捷主动检测 / 链路 C 用户指定 → 通用降级）在 `adfo-harness-runner/references/platform-detection.md` 中统一管理。

### 检测路由表


| 检测条件 | 路由目标 | `{framework}` 值 | 框架细则 |
|------|---------|-----------------|---------|
| `React*` / `JSX` / `TSX` / `Next.js` | **React 评审路径** | `React` | `critical-dimensions.md#react-路径` |
| `Vue*` / `Vue 3` / `Nuxt` | **Vue 评审路径** | `Vue 3` | `critical-dimensions.md#vue-路径` |
| `微信小程序` / `小程序` / `WXML` / `miniapp` | **小程序评审路径** | `微信小程序` | `critical-dimensions.md#小程序路径` |
| `Taro` / `uni-app` | **跨端评审路径** | `Taro/uni-app` | `critical-dimensions.md#跨端路径` |
| 链路 C 用户指定 | 按用户回答路由 | 用户回答值 | 对应框架章节 |
| 全部失败 | **通用评审路径（降级）** | `前端` | `critical-dimensions.md#通用` |

> `{framework}` 是注入到 6 个 SubAgent 提示词中的变量。检测成功时填入框架名称，全部失败时默认回退为 `前端`，使所有 Prompt 保持自然可读（如"评审以下前端架构设计"）。

---

## 执行流程

### Step 1: 接收输入
接收用户技术输入（前端组件/交互/架构/规格需求）

### Step 2: 框架感知 → 生成任务清单 → 委托 adfo-task-orchestrator

> SubAgent 委托与聚合协议（任务清单格式、执行参数、聚合规范）见 `adfo-harness-runner/references/subagent-delegation.md`。

根据平台感知结果选择对应框架的评审细则（`{framework}` 注入到 SubAgent 提示词中），
将 6 个批判维度组装为框架感知的任务清单：

| ID | 描述 | Agent类型 | 提示词 | 依赖 |
|----|------|-----------|--------|------|
| T1 | 需求解析 | general-purpose | 见框架感知 Prompt | - |
| T2 | 逻辑批判 | general-purpose | 见框架感知 Prompt | - |
| T3 | 架构评审 | general-purpose | 见框架感知 Prompt | - |
| T4 | 交互体验 | general-purpose | 见框架感知 Prompt | - |
| T5 | 性能风险 | general-purpose | 见框架感知 Prompt | - |
| T6 | 替代方案 | general-purpose | 见框架感知 Prompt | - |

6 个维度全部无依赖，同一并发组并行执行。执行参数：`最大并发数: 6`

### Step 3: 接收汇总
`adfo-task-orchestrator` 返回各 SubAgent 结果后，主 Agent 执行：
- 去重、冲突校验、逻辑串联
- 按固定模板输出完整探索报告

---

## SubAgent 角色定义（框架感知模板）

> 每个 SubAgent 的 `{framework}` 由平台感知路由结果自动注入。
> 检测成功时值为框架名称（`React` / `Vue 3` / `微信小程序` / `Taro/uni-app`），检测失败或无 techStack 时默认回退为 `前端`。
> 框架特定审查细则详见 `references/critical-dimensions.md` 中各框架章节。
>
> **`{framework}` 回退效果**：
> - React 场景：`"你是架构评审代理。评审以下 React 架构设计"`
> - 通用降级场景：`"你是架构评审代理。评审以下前端架构设计"`
>
> 所有 Prompt 在任一路径下读起来都自然通顺，无冗余。

### SubAgent 1: 需求&字面解析
**职责：**
- 提炼用户 {framework} 需求核心目标、显性约束、隐含诉求
- 标记需求模糊点、缺失上下文、未定义边界
- 只做客观梳理，不做批判，只做信息归一

**Prompt 模板：**
```
你是需求解析代理。分析以下 {framework} 需求，输出：
1. 核心技术目标
2. 显性约束条件
3. 隐含诉求推断
4. 需求模糊/缺失点

只做客观梳理，不做批判。
```
> {framework} 框架感知扩展：参考 `critical-dimensions.md` 中对应框架的 SA1 细则，追加框架特有约束检查项。

### SubAgent 2: 批判性逻辑漏洞
**职责：**
- 审视 {framework} 组件设计、状态逻辑、数据流、交互链路逻辑矛盾
- 找出不合理假设、遗漏边界 case、异常场景缺失
- 批判方案里的设计瑕疵、耦合问题、职责划分混乱

**Prompt 模板：**
```
你是逻辑批判代理。批判性审视以下 {framework} 方案，输出：
1. 设计逻辑矛盾点
2. 缺失边界 Case
3. 不合理假设与隐患

保持批判性，敢于指出问题。
```
> {framework} 框架感知扩展：参考 `critical-dimensions.md` 中对应框架的 SA2 细则，追加框架特有异常链路和逻辑陷阱检查。

### SubAgent 3: 前端工程&架构
**职责：**
- 从 {framework} 架构、组件拆分、组合式函数/Hook 设计、状态管理、路由设计维度审视
- 评估技术选型合理性、是否存在技术债、复用性、可维护性
- 发掘架构层面隐患和优化点

**Prompt 模板：**
```
你是架构评审代理。评审以下 {framework} 架构设计，输出：
1. 组件拆分合理性
2. {framework} 状态管理/组合式逻辑问题
3. 耦合度与可维护性问题
4. 架构潜在技术债

紧贴 {framework} 工程化实践。
```
> {framework} 框架感知扩展：参考 `critical-dimensions.md` 中对应框架的 SA3 细则，追加框架特有架构检查点。

### SubAgent 4: 交互体验&UI 逻辑
**职责：**
- 专注前端交互逻辑：加载状态、异常兜底、用户操作链路、反馈机制
- 拆解交互缺失、跳转逻辑漏洞、弹窗/表单/校验逻辑问题
- 从用户操作全流程找不合理设计

**Prompt 模板：**
```
你是交互体验代理。深挖以下 {framework} 交互逻辑，输出：
1. 操作链路漏洞
2. 状态反馈缺失
3. 表单/校验/弹窗逻辑问题
4. 异常兜底缺失场景

从用户操作全流程视角审视。
```
> {framework} 框架感知扩展：参考 `critical-dimensions.md` 中对应框架的 SA4 细则，追加框架特有状态反馈和交互机制检查。

### SubAgent 5: 性能&兼容性风险
**职责：**
- 分析 {framework} 渲染性能、状态更新机制、大数据列表、防抖节流
- 浏览器兼容、移动端适配、包体积、首屏加载、接口并发风险
- 列出落地时真实技术阻碍和隐性风险

**Prompt 模板：**
```
你是性能风险代理。评估以下 {framework} 方案的性能风险，输出：
1. {framework} 渲染/更新性能风险
2. 兼容/适配风险
3. 工程化&打包隐患
4. 线上运行潜在问题

紧贴真实落地场景。
```
> {framework} 框架感知扩展：参考 `critical-dimensions.md` 中对应框架的 SA5 细则，追加框架特有性能检查点。

### SubAgent 6: 替代方案&优化拓展
**职责：**
- 同需求下给出多套 {framework} 实现方案
- 给出简化版、健壮版、可扩展版三种方案
- 延伸可迭代方向、功能拓展、规范落地建议

**Prompt 模板：**
```
你是替代方案代理。针对以下 {framework} 需求，输出：
1. 方案一：轻量化最简实现
2. 方案二：健壮可扩展实现
3. 方案三：高复用工程化方案
4. 后续迭代拓展建议

给出具体可落地方案。
```
> {framework} 框架感知扩展：参考 `critical-dimensions.md` 中对应框架的 SA6 细则，追加框架特有替代方向。

## 约束规则

1. **委托 adfo-task-orchestrator 并发执行**：6 个维度全部无依赖，同一并发组调度
2. **维度隔离**：每个 SubAgent 严格只负责自己维度，不跨维度发言
3. **保持批判性**：不盲从用户方案，敢于挑逻辑、挑架构、挑交互漏洞
4. **框架感知**：所有分析紧贴检测到的目标框架（`{framework}`）的工程化实践，从 `references/critical-dimensions.md` 加载对应框架细则。检测失败时 `{framework}` 回退为 `前端`，走通用路径
5. **主动检测**：直接调用时按三条链路（工程模式 ↔ 配置文件扫描 ↔ 用户询问）依次尝试确定 `{framework}`，不依赖外部注入
6. **敏捷模式降级**：三条链路全部失败时默认走通用路径（`{framework}=前端`），提示用户可指定框架以获得更精确的审查
7. **预设标注**：若用户需求模糊，自动补充合理预设，并标注「预设说明」
8. **支持二次触发**：用户可指定只让某一个 SubAgent 深度再挖，也可指定切换框架重新评审

## 输出模板

```markdown
# 多 SubAgent 并发批判性探索报告（{framework} 技术版）

## 一、SubAgent1 核心需求&边界梳理
- 核心技术目标：
- 显性约束条件：
- 隐含诉求推断：
- 需求模糊/缺失点：

## 二、SubAgent2 逻辑漏洞&批判性审视
- 设计逻辑矛盾点：
- 缺失边界 Case：
- 不合理假设与隐患：

## 三、SubAgent3 {framework} 架构&组件设计评审
- 组件拆分合理性：
- {framework} 状态管理/组合式逻辑问题：
- 耦合度与可维护性问题：
- 架构潜在技术债：

## 四、SubAgent4 交互逻辑&用户体验深挖
- 操作链路漏洞：
- 状态反馈缺失：
- 表单/校验/弹窗逻辑问题：
- 异常兜底缺失场景：

## 五、SubAgent5 性能&落地风险评估
- {framework} 渲染/更新性能风险：
- 兼容/适配风险：
- 工程化&打包隐患：
- 线上运行潜在问题：

## 六、SubAgent6 替代实现&优化方案
- 方案一：轻量化最简实现
- 方案二：健壮可扩展实现
- 方案三：高复用工程化方案
- 后续迭代拓展建议：

---
# 主 Agent 汇总结论
整体问题归纳 + 优先级风险排序 + 落地整改建议
```

> 报告标题中的 `{framework}` 由本技能自主检测后动态填入。通用路径下显示为"前端技术版"。

## 使用示例

**React 场景：**
```
帮我分析这个 React 组件方案：
一个用户列表页面，支持搜索、筛选、分页，点击行可以编辑，还有批量删除功能。
```
→ `{framework}=React`，路由到 React 评审路径，加载 `critical-dimensions.md#react-路径`

**Vue 场景：**
```
评审一下这个 Vue 3 组件设计：
一个商品卡片组件，支持多规格选择、加入购物车、收藏。
```
→ `{framework}=Vue 3`，路由到 Vue 评审路径，加载 `critical-dimensions.md#vue-路径`

**小程序场景：**
```
帮我分析这个微信小程序方案：
一个电商首页，包含轮播图、商品瀑布流、Tab 切换分类。
```
→ `{framework}=微信小程序`，路由到小程序评审路径，加载 `critical-dimensions.md#小程序路径`

**通用路径（无 techStack）：**
```
帮我分析这个页面设计方案：
一个商品卡片组件，支持多规格选择。
```
→ `{framework}=前端`，走通用评审路径，加载 `critical-dimensions.md#通用`，提示用户可指定框架

**技能执行：**
1. 检测目标框架 → 确定 `{framework}` 值
2. `{framework}` 注入到 6 个 SubAgent 提示词
3. 并发启动 6 个 SubAgent
4. 各 SubAgent 独立分析
5. 主 Agent 汇总输出完整报告

## 职责边界

| 技能 | 边界 |
|------|------|
| adfp-code-reviewer | critical-explorer 审查**设计方案**（编码前），code-reviewer 审查**已写好的代码**（编码后）。审查维度共享分类法见 `adfp-code-reviewer/references/review-dimensions.md`。critical-explorer 从 techStack 感知框架，code-reviewer 从代码本身检测框架 |
| adfa-brainstorm | brainstorm 是**发散创意**，critical-explorer 是**批判收敛** |
| adfp-architecture-designer | architecture-designer **正向构建**架构，critical-explorer **审视批判**已有方案 |
| adfp-spec-generator | spec-generator **生成**技术规格，critical-explorer **审查**规格质量 |
| adfa-edge-case-master | edge-case-master 生成**测试用例代码**，critical-explorer 发现**设计层面**的边界缺失 |
| adfo-task-orchestrator | critical-explorer 定义 6 个批判维度并**生成 prompt**，task-orchestrator 负责**调度 6 个 SubAgent 的并发执行** |

## 模板注入

> 共享配置由 `adfo-harness-runner/templates/custom.md` 统一管理。
`templates/custom.md` — 本技能特有的 SubAgent 执行参数与输出偏好配置
