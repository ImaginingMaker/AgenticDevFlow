# 重构模式与代码示例

> 按框架路由加载对应的重构模式。本文件作为 `references/` 按需加载文件，**不重复** SKILL.md 中的路由逻辑。

---

## React 重构模式

### 1. 状态散乱 → 收敛

**问题代码**：
```tsx
const [items, setItems] = useState<Item[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [selectedId, setSelectedId] = useState<string | null>(null);
```

**重构后**：
```tsx
interface ItemListState {
  items: Item[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
}

const [state, dispatch] = useReducer(itemListReducer, {
  items: [],
  loading: false,
  error: null,
  selectedId: null,
});
```

或提取为自定义 Hook：

```tsx
function useItemList() {
  const [state, dispatch] = useReducer(itemListReducer, initialState);
  const actions = useMemo(() => ({
    fetch: () => { /* dispatch(...) */ },
    select: (id: string) => { /* dispatch(...) */ },
    reset: () => { /* dispatch(...) */ },
  }), []);
  return { ...state, ...actions };
}
```

### 2. 业务与视图耦合 → 提取 Hook

**问题代码**：组件内包含 API 调用逻辑、数据转换、事件处理、渲染

**重构后**：
```tsx
// useProductList.ts
export function useProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getProducts();
      setProducts(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    await api.deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  return { products, loading, fetchProducts, deleteProduct };
}

// ProductList.tsx
function ProductList() {
  const { products, loading, deleteProduct } = useProductList();

  if (loading) return <Spin />;
  return (
    <List dataSource={products} renderItem={item => (
      <List.Item actions={[<Button onClick={() => deleteProduct(item.id)}>删除</Button>]}>
        {item.name}
      </List.Item>
    )} />
  );
}
```

### 3. 组件过大 → 拆分

**策略**：提取子组件 + 提取自定义 Hook + 提取工具函数

**检查清单**：
- 单文件 > 300 行 → 必须拆分
- 单组件 > 100 行 → 提取子组件
- 一个 `return` 中 JSX 嵌套 > 50 行 → 提取子组件

### 4. 嵌套过深 → 早期返回 / 提取

**问题代码**（三元嵌套）：
```tsx
return (
  <div>
    {user ? (posts.length > 0 ? posts.map(post => (
      <div key={post.id}>{post.title}</div>
    )) : <Empty />) : <LoginPrompt />}
  </div>
);
```

**重构后**（早期返回）：
```tsx
if (!user) return <LoginPrompt />;
if (posts.length === 0) return <Empty />;

return (
  <div>
    {posts.map(post => <div key={post.id}>{post.title}</div>)}
  </div>
);
```

### 5. 硬编码 → 提取

```tsx
// 问题
const PAGE_SIZE = 10;
if (status === 'pending' || status === 'paid' || status === 'shipped') { }

// 重构
const PAYMENT_STATUSES = ['pending', 'paid', 'shipped'] as const;
type PaymentStatus = typeof PAYMENT_STATUSES[number];

const FILTER_OPTIONS = { PAGE_SIZE: 10 } as const;
```

---

## Vue 3 重构模式

### 1. 状态散乱 → 收敛

**问题代码**：
```vue
<script setup lang="ts">
const items = ref<Item[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const selectedId = ref<string | null>(null);
</script>
```

**重构后**（使用 composable）：
```ts
// useItemList.ts
export function useItemList() {
  const state = reactive<{
    items: Item[];
    loading: boolean;
    error: string | null;
    selectedId: string | null;
  }>({
    items: [],
    loading: false,
    error: null,
    selectedId: null,
  });

  async function fetchItems() {
    state.loading = true;
    try {
      const res = await api.getItems();
      state.items = res.data;
    } finally {
      state.loading = false;
    }
  }

  function selectItem(id: string) {
    state.selectedId = id;
  }

  return { ...toRefs(state), fetchItems, selectItem };
}
```

### 2. 业务与视图耦合 → 提取 Composable

**问题代码**：SFC 中同时包含 API 调用、数据转换、UI 状态、watch 逻辑

**重构后**：
```ts
// useProductList.ts
export function useProductList() {
  const products = ref<Product[]>([]);
  const loading = ref(false);

  async function fetchProducts() {
    loading.value = true;
    try {
      const res = await api.getProducts();
      products.value = res.data;
    } finally {
      loading.value = false;
    }
  }

  async function deleteProduct(id: string) {
    await api.deleteProduct(id);
    products.value = products.value.filter(p => p.id !== id);
  }

  return { products, loading, fetchProducts, deleteProduct };
}

// ProductList.vue
<script setup lang="ts">
const { products, loading, deleteProduct } = useProductList();
onMounted(fetchProducts);
</script>

<template>
  <Spin v-if="loading" />
  <List v-else :data-source="products">
    <template #renderItem="{ item }">
      <List.Item>
        {{ item.name }}
        <Button @click="deleteProduct(item.id)">删除</Button>
      </List.Item>
    </template>
  </List>
</template>
```

### 3. 组件过大 → 拆分

**策略**：提取子组件 + 提取 composables + 提取工具函数

**检查清单**：
- 单文件 > 300 行 → 必须拆分
- `<template>` 中 > 80 行 → 提取子组件
- `<script setup>` 中逻辑 > 150 行 → 提取 composable
- 多个 `watch` / `watchEffect` → 合并或提取 composable

### 4. 嵌套过深 → 提取 / v-if 简化

**问题代码**：
```vue
<template>
  <div>
    <template v-if="user">
      <template v-if="posts.length > 0">
        <div v-for="post in posts" :key="post.id">{{ post.title }}</div>
      </template>
      <Empty v-else />
    </template>
    <LoginPrompt v-else />
  </div>
</template>
```

**重构后**：
```vue
<template>
  <LoginPrompt v-if="!user" />
  <Empty v-else-if="posts.length === 0" />
  <div v-else>
    <div v-for="post in posts" :key="post.id">{{ post.title }}</div>
  </div>
</template>
```

### 5. 硬编码 → 提取

```ts
// 问题
const PAGE_SIZE = 10;
if (type === 'a' || type === 'b' || type === 'c') { }

// 重构
const VALID_TYPES = ['a', 'b', 'c'] as const;
type ValidType = typeof VALID_TYPES[number];
const CONFIG = { PAGE_SIZE: 10 } as const;
```

---

## 小程序重构模式

### 1. 状态散乱 → 收敛

**问题代码**：
```ts
Page({
  data: {
    items: [],
    loading: false,
    error: '',
    selectedId: '',
    page: 1,
    totalPages: 0,
  },
});
```

**重构后**（使用 Behavior 管理）：
```ts
// list-page-behavior.ts
export const ListPageBehavior = Behavior({
  data: {
    listState: {
      items: [] as Item[],
      loading: false,
      error: '',
      selectedId: '',
      page: 1,
      totalPages: 0,
    } as ListState,
  },
  methods: {
    setListState(partial: Partial<ListState>) {
      this.setData({
        'listState': { ...this.data.listState, ...partial },
      });
    },
    async fetchList() {
      this.setListState({ loading: true, error: '' });
      try {
        const res = await api.getList(this.data.listState.page);
        this.setListState({ items: res.data, loading: false });
      } catch (e) {
        this.setListState({ loading: false, error: '加载失败' });
      }
    },
  },
});
```

### 2. 业务与视图耦合 → 提取 Behavior

**问题代码**：Page/Component 中直接包含 API 调用、数据处理、UI 更新

**重构后**：
```ts
// product-behavior.ts
export const ProductBehavior = Behavior({
  data: { products: [], loading: false },
  methods: {
    async fetchProducts() {
      this.setData({ loading: true });
      const res = await api.getProducts();
      this.setData({ products: res.data, loading: false });
    },
    async deleteProduct(id: string) {
      await api.deleteProduct(id);
      const products = this.data.products.filter(p => p.id !== id);
      this.setData({ products });
    },
  },
  lifetimes: {
    attached() { this.fetchProducts(); },
  },
});

// Page
Component({
  behaviors: [ProductBehavior],
  methods: {
    onDelete(e) {
      this.deleteProduct(e.currentTarget.dataset.id);
    },
  },
});
```

### 3. Component 过大 → 拆分

**策略**：提取子 Component + 提取 Behavior + 提取工具函数

**检查清单**：
- 单文件 > 300 行 → 拆分
- `methods` 中 > 10 个方法 → 提取 Behavior
- `data` 中 > 10 个字段 → 收敛为状态对象

### 4. 嵌套过深 → 提前 return / template 简化

```ts
// 问题：wx:if 嵌套
<view wx:if="{{user}}">
  <view wx:if="{{posts.length > 0}}">
    <view wx:for="{{posts}}">{{item.title}}</view>
  </view>
  <empty wx:else />
</view>
<login-prompt wx:else />

// 重构：分散到多个 wxml 节点 + wx:elif
<login-prompt wx:if="{{!user}}" />
<empty wx:elif="{{posts.length === 0}}" />
<view wx:else>
  <view wx:for="{{posts}}">{{item.title}}</view>
</view>
```

### 5. setData 硬编码优化

```ts
// 问题：频繁 setData
this.setData({ 'item.name': name });
this.setData({ 'item.price': price });
this.setData({ 'item.desc': desc });

// 重构：批量 setData
this.setData({
  'item.name': name,
  'item.price': price,
  'item.desc': desc,
});
```

---

## 通用重构模式（框架无关）

当框架未检出或为通用前端时，使用下列模式：

### 逻辑抽取
将纯函数逻辑、数据转换、校验规则从组件中提取到独立的 `utils/` 或 `helpers/` 文件。

### 模块拆分
按单一职责原则拆分大文件：
- 配置常量 → `constants/`
- 类型定义 → `types/`
- API 方法 → `services/`
- 工具函数 → `utils/`

### 命名规范化
- 魔法数字 → 命名常量
- 硬编码字符串 → 枚举/配置对象
- 布尔参数 → 命名参数对象
