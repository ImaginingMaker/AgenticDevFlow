# 组件结构分析 SubAgent

## 任务目标
分析组件树和依赖关系，生成标准化文档。

## 输入信息

### 项目上下文（从文档提取）
- 项目名称：{projectName}
- 组件目录结构：{componentStructure}
- 命名规范：{namingConventions}
- UI 组件库：{uiLibrary}

### 页面信息
- 页面文件路径：{filePath}
- 组件引入关系：{imports}
- 组件定义代码：{componentDefs}

## 分析步骤

### 1. 识别组件引入
查找 import 语句：
- Vue: `import Component from './Component.vue'`
- React: `import Component from './Component'`

### 2. 分析组件分类
将组件分类：
- 自定义组件：页面专属组件
- 公共组件：项目通用组件
- 业务组件：业务领域组件
- UI库组件：第三方组件库

### 3. 提取 Props 定义
识别组件 Props：
- Vue: `defineProps`, `props: {}`
- React: `interface Props`, `PropTypes`

### 4. 提取事件定义
识别组件事件：
- Vue: `defineEmits`, `$emit`
- React: `onXxx` props

## 输出格式

```markdown
## 第四章 组件结构与依赖

### 4.1 组件树结构

```
UserListPage (页面组件)
├── SearchForm (搜索表单)
│   ├── FormInput (输入框)
│   ├── FormSelect (下拉选择)
│   └── FormButton (按钮)
├── DataTable (数据表格)
│   ├── TableHeader (表头)
│   ├── TableBody (表体)
│   │   └── TableRow (行)
│   └── Pagination (分页)
└── UserFormModal (用户表单弹窗)
    ├── FormInput (输入框)
    ├── FormSelect (下拉选择)
    └── FormButton (按钮)
```

### 4.2 组件分类

| 组件名称 | 类型 | 来源 | 说明 |
|----------|------|------|------|
| SearchForm | 业务组件 | ./components/SearchForm.vue | 搜索表单组件 |
| DataTable | 公共组件 | @/components/DataTable.vue | 通用表格组件 |
| UserFormModal | 自定义组件 | ./components/UserFormModal.vue | 用户表单弹窗 |
| FormInput | UI库组件 | element-plus | 输入框组件 |

### 4.3 Props/事件说明

#### SearchForm 组件

**Props**:
| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| modelValue | object | 是 | - | 表单数据 |
| fields | array | 否 | [] | 表单字段配置 |

**Events**:
| 事件名 | 参数 | 说明 |
|--------|------|------|
| search | (params: object) | 搜索触发 |
| reset | - | 重置表单 |

#### DataTable 组件

**Props**:
| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| data | array | 是 | [] | 表格数据 |
| columns | array | 是 | - | 列配置 |
| loading | boolean | 否 | false | 加载状态 |

**Events**:
| 事件名 | 参数 | 说明 |
|--------|------|------|
| page-change | (page: number) | 页码变化 |
| size-change | (size: number) | 每页条数变化 |

### 4.4 组件渲染逻辑

**条件渲染**：
```vue
<!-- 权限控制渲染 -->
<EditButton v-if="hasPermission('user:edit')" />

<!-- 数据状态渲染 -->
<EmptyState v-if="tableData.length === 0" />
<DataTable v-else :data="tableData" />
```

**循环渲染**：
```vue
<!-- 列表循环 -->
<TableRow v-for="item in tableData" :key="item.id" :data="item" />
```

**动态组件**：
```vue
<!-- 动态组件加载 -->
<component :is="currentComponent" v-bind="currentProps" />
```
```

## 注意事项
- 组件树要体现层级关系
- Props 和 Events 要完整记录
- 标注条件渲染的逻辑条件