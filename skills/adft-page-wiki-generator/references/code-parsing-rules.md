# 代码解析规则

## 路由解析

### Vue Router 解析
查找路由配置文件，提取以下信息：

```javascript
// 示例路由配置
{
  path: '/user/list',
  name: 'UserList',
  component: () => import('@/views/user/list.vue'),
  meta: {
    title: '用户列表',
    requiresAuth: true,
    permissions: ['user:view']
  }
}
```

提取内容：
- 路由路径：path
- 路由名称：name
- 组件路径：component
- 路由守卫：beforeEnter
- 元信息：meta（权限、标题等）

### React Router 解析
```javascript
// React Router 示例
<Route path="/user/list" element={<UserList />} />
```

## 组件解析

### Vue 组件解析
```vue
<template>
  <div class="user-list">
    <SearchForm @search="handleSearch" />
    <DataTable :data="tableData" :columns="columns" />
  </div>
</template>

<script setup>
import SearchForm from './components/SearchForm.vue'
import DataTable from '@/components/DataTable.vue'

const tableData = ref([])
const handleSearch = (params) => { ... }
</script>
```

提取内容：
- 子组件引入：import 语句
- Props 定义：defineProps
- 事件定义：defineEmits
- 响应式状态：ref, reactive
- 生命周期：onMounted, onUnmounted

### React 组件解析
```tsx
import { useState, useEffect } from 'react'

function UserList() {
  const [data, setData] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  return <div>...</div>
}
```

提取内容：
- Hooks 使用：useState, useEffect, useCallback
- 子组件引入
- Props 类型：interface 定义
- 事件处理函数

## 接口解析

### API 函数解析
```javascript
// api/user.js
export function getUserList(params) {
  return request({
    url: '/api/user/list',
    method: 'GET',
    params
  })
}

export function createUser(data) {
  return request({
    url: '/api/user/create',
    method: 'POST',
    data
  })
}
```

提取内容：
- 函数名称
- 请求方式
- 接口地址
- 入参结构
- 调用位置

## 状态解析

### Pinia Store 解析
```javascript
// stores/user.js
export const useUserStore = defineStore('user', {
  state: () => ({
    userList: [],
    currentUser: null
  }),
  actions: {
    async fetchUserList() { ... }
  }
})
```

### Redux Store 解析
```javascript
// slice/userSlice.js
const userSlice = createSlice({
  name: 'user',
  initialState: { list: [] },
  reducers: {
    setUserList: (state, action) => { ... }
  }
})
```

提取内容：
- Store 名称
- State 结构
- Actions/Reducers
- 使用位置
