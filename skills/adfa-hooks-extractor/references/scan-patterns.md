# 扫描模式

> 按框架路由的详细扫描模式。由 `adfa-hooks-extractor` 按平台感知检测结果动态加载。

---

## React 路径

### SA1: 状态组合 (useState/useReducer)
```
识别：多个 useState 共同描述一个业务概念 → 候选状态 Hook
示例：const [loading, setLoading], [error, setError], [data, setData]
     → useAsyncData()
```

### SA2: 副作用逻辑 (useEffect)
```
识别：useEffect 中包含业务逻辑 → 候选副作用 Hook
示例：useEffect(() => { fetch().then().catch() }, [id])
     → useFetchUser(id)
```

### SA3: 重复模式
```
识别：2+ 组件中存在相似的状态+副作用组合 → 候选复用 Hook
```

### SA4: 复杂计算 (useMemo)
```
识别：多步骤的 useMemo 计算链 → 候选计算 Hook
```

---

## Vue 路径

### SA1: 状态组合 (ref/reactive)
```
识别：多个 ref/reactive 共同描述一个业务概念 → 候选 Composable
示例：const loading = ref(false), const error = ref(null), const data = ref(null)
     → useAsyncData()
```

### SA2: 副作用逻辑 (watch/watchEffect)
```
识别：watch/watchEffect 或生命周期中包含业务逻辑 → 候选副作用 Composable
示例：watch(id, async () => { await fetch() })
     → useFetchUser(id)
```

### SA3: 重复模式
```
识别：2+ 组件中存在相似的状态+副作用组合 → 候选复用 Composable
```

### SA4: 复杂计算 (computed)
```
识别：多步骤的 computed/getter 链 → 候选计算 Composable
示例：const filtered = computed(() => items.value.filter(sortBy.value))
```

---

## 小程序路径

### SA1: 状态组合 (data)
```
识别：data 中多个相关字段共同描述一个业务概念 → 候选 Behavior
示例：data: { loading: false, error: null, data: null }
     → async-data behavior
```

### SA2: 副作用逻辑 (生命周期)
```
识别：onLoad/onShow 中包含数据加载逻辑 → 候选副作用 Behavior
示例：onLoad() { this.fetchUser() }
     → fetch-user behavior
```

### SA3: 重复模式
```
识别：2+ 页面中存在相似的 data + 生命周期组合 → 候选复用 Behavior
```

### SA4: 复杂计算 (无计算属性)
```
识别：WXS 中或 JS 层的数据转换逻辑 → 候选工具函数（Behaviors 不支持计算属性）
```
