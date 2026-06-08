# 框架感知检查矩阵

> 定义各框架（React / Vue / 小程序 / 跨端）的特有检查项。`adfp-code-reviewer` 根据检测到的框架路由到对应检查清单。

---

## 维度 2：框架规范 — 框架专用检查项

### React 检查项
- [ ] Hooks 依赖数组完整性（useEffect/useMemo/useCallback）
- [ ] JSX 语法正确性（条件渲染、列表渲染、事件绑定）
- [ ] 组件单一职责（单文件 ≤ 200行）
- [ ] 组件职责混杂 → `adfa-refactor-advisor`
- [ ] 存在可提取自定义 Hook 的重复逻辑 → `adfa-code-analysis`（mode:extract）
- [ ] 状态不必要提升（应下沉到使用方）
- [ ] 受控组件 vs 非受控组件的选择是否恰当
- [ ] Context 滥用导致不必要重渲染

### Vue 检查项
- [ ] SFC 结构规范：`<script setup lang="ts">` + `<template>` + `<style scoped>` 顺序正确
- [ ] Composition API 使用正确性（ref/reactive 区分、computed 依赖完整）
- [ ] 响应式代理正确使用（避免直接解构丢失响应性）
- [ ] 生命周期钩子正确性（onMounted/onUnmounted 配对）
- [ ] watch 监听器清理（组件卸载后需清理）
- [ ] v-for 绑定稳定 key
- [ ] 组件通信方式选择正确（props/emit/provide+inject/pinia）
- [ ] slot 使用规范（具名 slot、作用域 slot）
- [ ] 组件职责混杂 → `adfa-refactor-advisor`

### 小程序检查项
- [ ] Page/Component 生命周期函数正确性（onLoad/onShow/onReady/onUnload）
- [ ] setData 性能模式（合并多次 setData、避免高频调用、数据量过大）
- [ ] 模板 WXS 使用规范（复杂计算移至 WXS 减少通信开销）
- [ ] 分包配置正确性（主包大小控制、分包预下载）
- [ ] 自定义组件.properties 正确性
- [ ] 事件通信模型（triggerEvent 正确使用）
- [ ] appId/密钥等敏感信息未硬编码
- [ ] 多个页面共用的逻辑是否提取为 behaviors/mixins

### 跨端检查项（Taro/uni-app）
- [ ] 条件编译使用正确性（`TARO_ENV` / `process.env.UNI_PLATFORM`）
- [ ] 平台差异化处理的完整性（所有端均有对应实现）
- [ ] 避免使用平台独有的 API（先检测后使用）
- [ ] 跨端 UI 库兼容性（如 Taro UI / uni-ui 版本匹配）
- [ ] 样式兼容性（rpx/px/rem 按端选择、flex 布局兼容）

---

## 高频问题模式 — 框架专用变体

| 模式 | React 特征 | Vue 特征 | 小程序特征 |
|------|-----------|---------|-----------|
| 内存泄漏 | useEffect 无清理 | watch 无 off、定时器未清理 | onShow 重复注册事件、未清理定时器 |
| 竞态条件 | useEffect race、AbortController | watch+async 竞争 | 多个请求先后完成、数据覆盖 |
| 过宽渲染 | 全量声明式、未 memo | 响应式依赖链过长 | setData 传入大量不必要数据 |
| 硬编码 | JSX 中直接写字符串 | template 中写死文本 | WXML 中写死文本 |
| 重复逻辑 | 2+ 组件相似 Hooks | 2+ 组件相似 composables | 2+ 页面相似 onLoad 逻辑 |
