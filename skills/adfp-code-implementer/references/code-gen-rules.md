# 代码生成规则

> 按框架路由的代码生成详细规则。由 `adfp-code-implementer` 按平台感知检测结果动态加载。

---

## 通用规则（所有框架）

- import 顺序：框架库 → 第三方 → 项目内部
- 所有 Props 导出类型定义
- 不写注释（除非逻辑不显而易见）
- 样式体现设计文档的美学方向

---

## React 路径

### 文件结构
```
types.ts          # 类型定义
hooks/use*.ts     # 自定义 Hooks
{Component}.tsx   # 组件
index.tsx         # 入口
```

### 生成规范
- 函数组件 + TypeScript
- Props 定义为 `interface {Name}Props`
- 状态：`useState` / `useReducer`
- 副作用：`useEffect` 依赖数组必须完整
- 计算：`useMemo` / `useCallback`（不滥用）
- 事件处理：`handle{Event}` 命名
- 错误边界：容器组件包裹 ErrorBoundary
- 列表：稳定 `key`，大列表虚拟化

### 代码模板
```tsx
import React, { useState, useEffect } from 'react';

interface {Name}Props {
  // ...
}

export const {Name}: React.FC<{Name}Props> = ({ ... }) => {
  // ...
};
```

---

## Vue 路径

### 文件结构
```
types.ts             # 类型定义
composables/use*.ts  # 组合式函数
{Component}.vue      # SFC 组件
```

### 生成规范
- Vue 3 Composition API + `<script setup lang="ts">`
- SFC 结构：`<script setup>` → `<template>` → `<style scoped>`
- 状态：`ref()` / `reactive()`
- 计算：`computed()`
- 副作用：`watch()` / `watchEffect()` + 清理
- 生命周期：`onMounted` / `onUnmounted` 配对
- 组件通信：`defineProps` / `defineEmits`
- 列表：`:key` 绑定稳定值

### 代码模板
```vue
<script setup lang="ts">
import { ref, computed } from 'vue';

interface {Name}Props {
  // ...
}
const props = defineProps<{Name}Props>();
const emit = defineEmits<{ ... }>();
</script>

<template>
  <div class="{class-name}">
    <!-- template -->
  </div>
</template>

<style scoped>
.{class-name} {
  /* styles */
}
</style>
```

---

## 小程序路径

### 文件结构
```
{page|component}.ts     # 逻辑层
{page|component}.wxml   # 模板层
{page|component}.wxss   # 样式层
{page|component}.json   # 配置层
```

### 生成规范
- Page 模式：`Page({ data: {}, onLoad() {} })`
- Component 模式：`Component({ properties: {}, data: {}, methods: {} })`
- 数据绑定：`setData()` 合并多次调用
- 事件：`bind` / `catch` + `triggerEvent`
- 生命周期：`onLoad` / `onShow` / `onReady` / `onUnload`
- 条件渲染：`wx:if` / `wx:elif` / `wx:else`
- 列表渲染：`wx:for` + `wx:key`
- 样式：rpx 单位，flex 布局

### 代码模板（Component）
```typescript
Component({
  properties: {
    // 对外属性
  },
  data: {
    // 内部状态
  },
  methods: {
    // 事件处理
  },
  lifetimes: {
    attached() { },
    detached() { },
  },
});
```

---

## 跨端路径（Taro/uni-app）

### Taro 路径
- 使用 React 风格 JSX：`.tsx` 文件
- 引入 `@tarojs/components` 替代 HTML 标签
- 路由：`Taro.navigateTo` / `Taro.switchTab`
- 平台差异：`TARO_ENV === 'weapp'` / `'h5'`
- 状态：同 React 路径

### uni-app 路径
- 使用 Vue SFC 风格：`.vue` 文件
- 使用 uni-app 内置组件：`<view>` / `<text>` / `<image>`
- 路由：`uni.navigateTo` / `uni.switchTab`
- 平台差异：`process.env.UNI_PLATFORM === 'mp-weixin'`
- 状态：同 Vue 路径

### 通用跨端规范
- 避免使用平台独有的 API（先检测后用）
- 样式兼容：flex 布局优先，rpx/px/vw 按端选择
- 条件编译包裹平台差异化代码段
- 使用跨端 UI 库（Taro UI / uni-ui）减少差异
