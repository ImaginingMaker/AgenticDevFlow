# 数据流分析 SubAgent

## 任务目标
分析状态管理和数据流转，生成标准化文档。

## 输入信息

### 项目上下文（从文档提取）
- 项目名称：{projectName}
- 状态管理方案：{stateManagement}
- 数据模型定义：{dataModels}
- 缓存策略：{cacheStrategy}

### 页面信息
- 页面文件路径：{filePath}
- Store 定义：{storeDefs}
- 状态使用代码：{stateUsage}

## 分析步骤

### 1. 识别全局状态
查找 Store 使用：
- Pinia: `useXxxStore()`
- Vuex: `useStore()`, `mapState`
- Redux: `useSelector()`

### 2. 识别局部状态
查找组件内状态：
- Vue: `ref()`, `reactive()`
- React: `useState()`, `useReducer()`

### 3. 追踪数据流转
追踪数据变化路径：
- 初始化来源
- 更新触发点
- 消费位置

### 4. 识别缓存策略
识别数据缓存方式：
- 本地存储：localStorage, sessionStorage
- 内存缓存：状态持久化
- 请求缓存：缓存策略

## 输出格式

```markdown
## 第五章 数据流与状态管理

### 5.1 全局状态使用说明

#### useUserStore

**Store 文件**：`@/stores/user.ts`

**State 结构**：
```typescript
interface UserState {
  userList: User[]
  currentUser: User | null
  loading: boolean
  total: number
}
```

**使用位置**：
| 属性 | 使用位置 | 用途 |
|------|----------|------|
| userList | UserListPage | 列表数据展示 |
| currentUser | UserDetailPage | 详情数据展示 |
| loading | UserListPage | 加载状态控制 |

**Actions**：
| 方法 | 参数 | 说明 |
|------|------|------|
| fetchUserList | (params) | 获取用户列表 |
| fetchUserDetail | (id) | 获取用户详情 |
| createUser | (data) | 创建用户 |
| updateUser | (id, data) | 更新用户 |

### 5.2 局部状态定义

| 状态名 | 类型 | 初始值 | 用途 |
|--------|------|--------|------|
| searchParams | object | {} | 搜索参数 |
| pagination | object | { page: 1, size: 10 } | 分页参数 |
| modalVisible | boolean | false | 弹窗显示状态 |
| selectedRows | array | [] | 选中的行数据 |

**状态定义代码**：
```typescript
// 搜索参数
const searchParams = ref({
  keyword: '',
  status: undefined
})

// 分页参数
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

// 弹窗状态
const modalVisible = ref(false)
const modalType = ref<'add' | 'edit'>('add')
```

### 5.3 数据流转流程

```
┌─────────────────────────────────────────────────────────┐
│                    数据流转图                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [用户操作]                                             │
│      │                                                  │
│      ▼                                                  │
│  [事件处理函数] ──→ [更新局部状态]                      │
│      │                   │                              │
│      │                   ▼                              │
│      │             [视图更新]                           │
│      │                                                  │
│      ▼                                                  │
│  [调用 Store Action] ──→ [发起接口请求]                 │
│      │                        │                         │
│      │                        ▼                         │
│      │                  [接口返回]                      │
│      │                        │                         │
│      ▼                        ▼                         │
│  [更新 Store State] ←── [处理响应数据]                  │
│      │                                                  │
│      ▼                                                  │
│  [触发视图更新]                                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**具体流转示例**：

1. **搜索操作数据流**：
```
用户输入关键词
    → handleSearch()
    → searchParams.value = { keyword: 'xxx' }
    → userStore.fetchUserList(searchParams)
    → API: GET /api/user/list?keyword=xxx
    → userStore.userList = response.data
    → 表格组件自动更新
```

2. **新增操作数据流**：
```
用户点击新增
    → modalVisible.value = true
    → 弹窗打开
用户填写表单点击确认
    → handleCreate(formData)
    → userStore.createUser(formData)
    → API: POST /api/user/create
    → userStore.userList.push(newUser)
    → modalVisible.value = false
    → 表格自动更新
```

### 5.4 数据缓存规则

| 数据类型 | 缓存方式 | 缓存时长 | 刷新策略 |
|----------|----------|----------|----------|
| 用户列表 | 内存缓存 | 会话期间 | 手动刷新、操作后刷新 |
| 用户详情 | 内存缓存 | 5分钟 | 详情页进入时刷新 |
| 下拉选项 | localStorage | 1天 | 每日首次加载时刷新 |
| 权限信息 | sessionStorage | 会话期间 | 登录时加载 |

**缓存实现**：
```typescript
// 列表缓存
const cachedList = localStorage.getItem('userList')
if (cachedList && !isExpired(cachedList)) {
  userList.value = JSON.parse(cachedList)
} else {
  await fetchUserList()
}
```
```

## 注意事项
- 区分全局状态和局部状态
- 追踪完整的数据流转路径
- 标注缓存策略和刷新时机