# 平台检测（三链路）

> 所有 `adfa-code-analysis` 模式共用的平台/框架检测机制。本文件可被其他技能引用以消除重复。

## 谁是感知者？

本技能自身执行框架检测，**不依赖外部注入**。检测结果以 `{framework}` 变量注入到所有 SubAgent 提示词中。

## 检测链路（按优先级）

### 链路 A — 工程模式（被动接收）

当被 `adfo-harness-runner` 调度时：
1. 从 `state.json.techStack` 读取目标框架
2. 由编排器在 `context` 命令中注入 `techStack` 上下文
3. **此为最高优先级**，直接使用不重复检测

### 链路 B — 敏捷模式（主动检测）

直接调用时，依次扫描：

1. **读取 `package.json`** 的 `dependencies` / `devDependencies`，匹配框架关键字
2. **读取框架配置文件**：
   - `next.config.*`（Next.js/React）
   - `nuxt.config.*`（Nuxt/Vue）
   - `vite.config.*`（根据插件判断）
   - `project.config.json`（小程序）
   - `taro-config.*`（Taro）
   - `pages.json`（uni-app）
3. **扫描目录结构**分析框架倾向

检测到 → 直接使用；检测不到 → 进入链路 C

### 链路 C — 用户指定（显式询问）

向用户提问：「目标框架是哪个？React / Vue 3 / 微信小程序 / Taro/uni-app / 通用前端」
- 用户回答 → 使用该框架
- 用户不确定或跳过 → 进入通用降级路径

### 全部失败 → 通用降级

`{framework} = "前端"`，按通用前端维度执行，提示用户可指定框架以获得更精确的结果。

## 检测路由表

| 检测条件 | 路由目标 | `{framework}` 值 | 影响 |
|---------|---------|-----------------|------|
| `React*` / `JSX` / `TSX` / `Next.js` | React 路径 | `React` | 加载 React 特有扫描/提取模式 |
| `Vue*` / `Vue 3` / `Nuxt` | Vue 路径 | `Vue 3` | 加载 Vue 特有扫描/提取模式 |
| `微信小程序` / `小程序` / `WXML` | 小程序路径 | `微信小程序` | 加载小程序特有扫描/提取模式 |
| `Taro` / `uni-app` | 跨端路径 | `Taro/uni-app` | 加载跨端扫描/提取模式 |
| 链路 C 用户指定 | 按回答路由 | 用户回答值 | 对应框架 |
| 全部失败 | 通用降级 | `前端` | 通用维度 |

## `{framework}` 回退效果示例

- React 场景提示词：`"你是一名 React 组件扫描器..."` → 自然通顺
- 通用降级提示词：`"你是一名前端组件扫描器..."` → 也自然通顺
- 所有 Prompt 在任一路径下都合理，无须条件判断

## 工程模式说明

工程模式下从 `state.json.techStack` 读取已识别的技术栈，避免重复扫描。
