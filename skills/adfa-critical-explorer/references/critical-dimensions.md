# 批判性评审维度 — 框架感知细则

> 此文件包含 6 个 SubAgent 的框架特定评审细则，按平台路由加载。
> 由 `adfa-critical-explorer` SKILL.md 按平台感知检测结果动态加载对应框架章节。
> 通用/通用路径的维度适用于所有框架。

---

## 通用（所有框架通用）

### SA1 需求解析 — 通用细则
- 提炼跨框架的核心需求、约束、边界
- 关注通用前端领域的模糊点
- 平台/框架差异的潜在影响

### SA2 逻辑批判 — 通用细则
- 组件/页面间逻辑一致性
- 数据流向是否清晰
- 状态与 UI 的映射关系
- 异常场景覆盖度

### SA3 架构评审 — 通用细则
- 组件拆分层次是否合理
- 复用性评估
- 耦合度评判
- 可测试性分析

### SA4 交互体验 — 通用细则
- 用户操作全流程完整性
- 加载/空/错误 三态覆盖
- 反馈延迟与即时性
- 表单校验逻辑
- 跳转/返回链路

### SA5 性能风险 — 通用细则
- 首屏加载策略
- 大数据列表渲染
- 请求并发控制
- 包体积基线

### SA6 替代方案 — 通用细则
- 轻量化最简实现
- 健壮可扩展实现
- 高复用工程化方案
- 迭代拓展路径

---

## React 路径

### SA1 需求解析
- 检查需求是否涉及 React 生态特有约束（SSR/CSR、React Router、Next.js 等）
- 关注 Hooks 使用假设

### SA2 逻辑批判
- Hooks 调用规则是否被遵守
- useEffect 依赖链是否正确
- 组件重新渲染触发条件是否合理
- useContext 滥用风险

### SA3 架构评审
- 组件拆分是否遵循单一职责（≤200行）
- 自定义 Hook 封装是否合理 vs 直接内联
- 状态管理选择是否匹配复杂度（Context vs Zustand vs Redux）
- 有无可提取为复用 Hook 的重复逻辑
- Props 穿透层级是否过深
- React.memo / useMemo / useCallback 使用是否恰当

### SA4 交互体验
- ErrorBoundary 覆盖范围
- Suspense 边界设置
- 受控组件 vs 非受控组件选择
- 表单库选择（React Hook Form / Formik）是否合理

### SA5 性能风险
- 列表 key 稳定性
- 渲染内新对象/函数创建频率
- useMemo/useCallback 误用（过早优化）
- 全量引入大型库的 Tree-shaking 风险
- 虚拟列表必要性判断
- React.lazy 代码分割策略

### SA6 替代方案
- 方案一：原生 Hooks 轻量实现
- 方案二：状态库 + 组件库健壮版
- 方案三：微前端/Module Federation 工程化版
- 考虑 Next.js/RSC 版本的可行性

---

## Vue 路径

### SA1 需求解析
- 检查需求是否涉及 Vue 生态特有约束（SSR/Nuxt、Vue Router、Pinia 等）
- 关注 Composition API vs Options API 选择的影响

### SA2 逻辑批判
- `ref()` / `reactive()` 选择是否合理
- `watch` / `watchEffect` 副作用边界
- `computed` 依赖链是否正确
- `provide/inject` 作用域管理

### SA3 架构评审
- SFC 三段式结构是否清晰（`<script setup>` + `<template>` + `<style scoped>`）
- 组件拆分是否遵循单一职责
- 可提取为 Composable 的公共逻辑识别
- 状态管理选择（Pinia vs provide/inject vs 组件内状态）
- Teleport 使用场景判断
- 动态组件 `<component :is="">` 使用合理性

### SA4 交互体验
- `<Transition>` / `<TransitionGroup>` 动效覆盖
- 表单双向绑定 `v-model` 设计是否合理
- 插槽（slot）设计是否灵活
- Suspense（Vue 3.3+）边界设置

### SA5 性能风险
- 计算属性 vs 方法选择
- `v-for` key 绑定稳定性
- 不可变数据更新模式
- 大型列表虚拟化判断
- 异步组件 `defineAsyncComponent` 代码分割策略
- 响应式深度监听性能影响

### SA6 替代方案
- 方案一：Composition API 轻量实现
- 方案二：Pinia + Element Plus 健壮版
- 方案三：Nuxt SSR 工程化版
- 考虑组件库替换方案（Naive UI / Ant Design Vue）

---

## 小程序路径（微信/支付宝/字节/百度）

### SA1 需求解析
- 检查需求是否涉及小程序特有约束（包体积 < 2MB、自定义导航栏、登录授权等）
- 关注平台差异（微信 vs 支付宝 vs 字节等）

### SA2 逻辑批判
- 页面/组件生命周期调用顺序
- 数据响应式更新路径
- 跨页面通信方式选择
- setData 频率控制

### SA3 架构评审
- 自定义组件拆分合理性
- Behavior 复用模式
- 页面级状态管理（globalData / 全局 Store）
- 分包策略合理性
- WXML / WXSS 限制（无 CSS 变量、选择器限制等）

### SA4 交互体验
- 小程序特有交互：下拉刷新、上拉加载、返回确认
- 按钮授权逻辑（wx.getUserProfile 等）
- 页面栈深度与跳转策略
- 分享/转发场景处理

### SA5 性能风险
- 包体积接近 2MB 限制
- setData 数据量过大
- 页面渲染节点数过多
- 图片/资源加载策略
- 分包预加载时机
- WXS 性能 vs JS 执行时机

### SA6 替代方案
- 方案一：无三方库最小实现
- 方案二：使用 TDesign/WeUI 小程序组件库
- 方案三：考虑 Taro/uni-app 跨端方案
- 分包结构调整建议

---

## 跨端路径（Taro / uni-app）

### SA1 需求解析
- 明确哪些端需要支持（H5 + 小程序 + App）
- 跨端一致性 vs 平台特色化 取舍

### SA2 逻辑批判
- 条件编译逻辑是否清晰（TARO_ENV / UNI_PLATFORM）
- 平台差异化分支是否可维护
- 跨端 API 兼容性

### SA3 架构评审
- 跨端组件抽象层次是否合理
- 业务逻辑与平台差异是否分离
- 公共样式管理方案
- 跨端路由配置统一性
- Taro：JSX + 组件库（NutUI / TDesign）
- uni-app：Vue SFC + 组件库（uni-ui / uView）

### SA4 交互体验
- 各端行为一致性 vs 平台原生体验平衡
- 滑动/点击事件跨端兼容
- 弹窗/Toast 跨端统一
- H5 跳转 vs 小程序导航 vs App 路由 差异处理

### SA5 性能风险
- 跨端兼容层带来的额外包体积
- 平台差异化条件编译的维护成本
- 各端构建产物体积控制
- 小程序端包体积限制（跨端框架普遍偏大）

### SA6 替代方案
- 方案一：纯 H5 方案（放弃小程序端）
- 方案二：跨端框架（Taro / uni-app）统一实现
- 方案三：各端独立实现（极致原生体验）
- 混合方案：公共逻辑跨端 + 差异化端独立开发
