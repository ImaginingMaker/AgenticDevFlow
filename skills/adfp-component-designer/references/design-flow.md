# 组件设计详细流程

> 此文件包含完整的组件设计分步流程，按框架（React/Vue/小程序/跨端）路由。
> 由 `adfp-component-designer` SKILL.md 按平台感知检测结果动态加载对应章节。

---

## 通用：输入读取

无论哪种框架，设计流程的第一步都是理解输入。

从用户描述（敏捷模式）或上游产物（工程模式）中提取：
- 核心用户故事
- 关键交互流程
- 数据输入/输出

工程模式下还读取：
- `spec.md` → 页面架构、数据模型、API 契约、状态策略
- `architecture.md` → 可复用模块清单、文件层级蓝图、模块依赖图

---

## 通用：视觉设计方向

> **强制性步骤，不可跳过。**

### 设计思维四要素

1. **目的**：这个界面解决什么问题？谁在使用？
2. **风格基调**：极致简约 / 极繁混乱 / 复古未来 / 有机自然 / 奢品精致 / 趣味玩具 / 编辑杂志风 / 粗野原始 / 艺术装饰几何 / 柔和粉彩 / 工业实用
3. **约束**：技术限制（框架、性能、可访问性）
4. **差异化**：什么让人过目不忘？

### 美学方向如何影响组件拆分

| 美学方向 | 组件拆分策略 | 空间处理 |
|----------|-------------|----------|
| 极简 | 更少组件、更大粒度、依赖留白 | 宽裕负空间、精确对齐 |
| 极繁 | 更多装饰组件、层级叠加 | 受控密度、重叠布局 |
| 编辑风 | 内容优先、版面网格组件 | 非对称、跨网格元素 |
| 有机感 | 流体形状组件、自然过渡 | 不规则间距、曲线流动 |

### 输出格式

```
美学方向：[风格名称]
- 字体策略：[展示字体] + [正文字体]
- 色彩策略：[主色] / [强调色] / [背景处理]
- 空间策略：[负空间主导 / 受控密度 / 非对称 / ...]
- 记忆点：[用户会记住的一件事]
```

---

## React 路径

### 组件树设计
- 单一职责：每个组件只做一件事
- 自顶向下：先页面 → 再区块 → 最后叶子组件
- 区分类型：展示型 / 容器型 / 组合型

```
PageComponent（容器型）
├── Header（展示型）
├── MainContent（容器型）
│   ├── SearchBar（组合型）
│   └── DataList（容器型）
│       └── DataItem（展示型）×N
└── Footer（展示型）
```

### 状态设计
- 状态最小化：能在组件内部的不提升
- 识别可提取为自定义 Hook 的逻辑块

| 状态名 | 类型 | 初始值 | 所在组件 | 来源 |
|--------|------|--------|----------|------|

### Props 接口（TypeScript）
```typescript
interface {ComponentName}Props {
  fieldName: string;
  onAction?: (id: string) => void;
}
```

### 数据依赖
| 场景 | React 策略 |
|------|-----------|
| 加载中 | Loading / Skeleton |
| 数据为空 | 空状态提示 + 引导 |
| 请求失败 | 错误提示 + 重试按钮 |
| 组件崩溃 | ErrorBoundary 兜底 |

---

## Vue 路径

### 组件树设计
- SFC 组件：每个 `.vue` 文件一个组件，`<script setup>` + `<template>` + `<style scoped>`
- 动态组件：`<component :is="">` 场景识别
- Teleport：模态框/弹窗等挂载到 body 的场景

```
PageComponent.vue
├── Header.vue（展示型）
├── MainContent.vue（容器型）
│   ├── SearchBar.vue（组合型）
│   └── DataList.vue（容器型）
│       └── DataItem.vue（展示型）×N
└── Footer.vue（展示型）
```

### 状态设计
- Composition API：`ref()` / `reactive()` 管理状态
- 跨组件状态：Pinia store 或 provide/inject
- 识别可提取为 Composable 的逻辑块

| 状态名 | 声明方式 | 初始值 | 所在组件 | 来源 |
|--------|---------|--------|----------|------|

### Props 接口
```typescript
interface {ComponentName}Props {
  fieldName: string;
  onAction?: (id: string) => void;
}
const props = defineProps<{ComponentName}Props>();
```

### 数据依赖
| 场景 | Vue 策略 |
|------|---------|
| 加载中 | v-if loading → Skeleton |
| 数据为空 | v-if empty → 空状态 |
| 请求失败 | catch error → 错误提示 + 重试 |
| 组件崩溃 | onErrorCaptured 兜底 |

---

## 小程序路径

### 组件树设计
- **Page**：页面级组件，对应 `pages/xxx/` 目录
- **自定义组件**：可复用 UI 单元，对应 `components/xxx/` 目录
- **template**：纯展示模板（无逻辑）

```
pages/index/
├── components/Header/
├── components/SearchBar/
└── components/DataList/
    └── components/DataItem/ ×N
```

### 状态设计
- 页面状态：Page `data` 字段
- 组件状态：Component `properties` + `data`
- 识别可提取为 Behavior 的重复逻辑

| 字段名 | 定义位置 | 初始值 | 所属 | 说明 |
|--------|---------|--------|------|------|

### 属性接口
```json
properties: {
  fieldName: { type: String, value: '' },
}
```

### 数据依赖
| 场景 | 小程序策略 |
|------|-----------|
| 加载中 | wx.showLoading / loading 状态 |
| 数据为空 | hidden + 空状态提示 |
| 请求失败 | wx.showToast + 重试 |
| 组件异常 | 自定义错误处理 |

---

## 跨端路径（Taro/uni-app）

### Taro 路径
- 组件采用 React 风格 JSX 语法
- 样式推荐 CSS Modules 或 styled-components
- 平台差异用 `TARO_ENV` 条件编译

### uni-app 路径
- 组件采用 Vue SFC 风格
- 样式采用 scoped style + rpx
- 平台差异用 `process.env.UNI_PLATFORM`

### 设计产出标注
跨端设计需额外标注平台差异化：

```
# 平台差异化标注

| 功能点 | H5 实现 | 小程序实现 | 说明 |
|--------|---------|-----------|------|
| 登录 | OAuth 跳转 | wx.login + 授权 | 流程不同 |
| 支付 | 支付宝/微信 H5 | wx.requestPayment | API 不同 |
```
