# 项目文档解析规则

## 文档优先级

### P0 级别（必读）

#### README.md
```
位置：项目根目录/README.md

提取信息：
├── 项目名称
├── 项目简介
├── 技术栈
│   ├── 前端框架（Vue/React/...）
│   ├── 状态管理（Pinia/Redux/...）
│   ├── UI 组件库
│   └── 构建工具
├── 目录结构
├── 开发命令
└── 部署说明
```

#### CLAUDE.md
```
位置：项目根目录/CLAUDE.md

提取信息：
├── 项目规范
│   ├── 命名规范
│   ├── 代码风格
│   └── 目录约定
├── 业务规则
├── 注意事项
└── 禁止事项
```

#### package.json
```
位置：项目根目录/package.json

提取信息：
├── name（项目名称）
├── version（版本号）
├── dependencies（运行时依赖）
├── devDependencies（开发依赖）
└── scripts（脚本命令）
```

### P1 级别（重要）

#### docs/README.md
```
位置：docs/README.md

提取信息：
├── 文档目录索引
├── 文档分类
└── 快速导航
```

#### docs/architecture.md
```
位置：docs/architecture.md

提取信息：
├── 系统架构图
├── 模块划分
├── 技术选型说明
└── 数据流向
```

#### docs/api.md
```
位置：docs/api.md

提取信息：
├── API 基础地址
├── 认证方式
├── 通用参数
├── 错误码定义
└── 接口列表
```

### P2 级别（补充）

#### 业务文档
```
位置：docs/business/*.md

提取信息：
├── 业务流程
├── 业务规则
├── 数据字典
└── 状态机定义
```

#### 技术文档
```
位置：docs/technical/*.md

提取信息：
├── 技术方案
├── 实现细节
├── 性能优化
└── 安全策略
```

## 信息提取模板

### 项目基础信息

```javascript
const projectInfo = {
  name: '',           // 项目名称
  description: '',    // 项目简介
  version: '',        // 版本号

  techStack: {
    framework: '',    // 框架：Vue 3 / React 18
    language: '',     // 语言：TypeScript / JavaScript
    stateManagement: '', // 状态管理：Pinia / Redux
    uiLibrary: '',    // UI库：Element Plus / Ant Design
    buildTool: '',    // 构建：Vite / Webpack
    testFramework: '' // 测试：Vitest / Jest
  },

  structure: {
    pages: '',        // 页面目录
    components: '',   // 组件目录
    api: '',          // 接口目录
    stores: '',       // 状态目录
    router: '',       // 路由目录
    utils: '',        // 工具目录
    assets: ''        // 静态资源目录
  }
}
```

### 业务模块信息

```javascript
const businessModules = [
  {
    name: '',           // 模块名称
    path: '',           // 路由前缀
    description: '',    // 模块描述
    pages: [            // 页面列表
      {
        name: '',       // 页面名称
        path: '',       // 页面路由
        file: ''        // 文件路径
      }
    ],
    permissions: []     // 权限列表
  }
]
```

### 权限体系信息

```javascript
const permissionSystem = {
  prefix: '',           // 权限前缀：system:user
  separator: '',        // 分隔符：冒号/下划线
  types: [],            // 操作类型：view/create/edit/delete
  roles: [],            // 角色列表
  checkMethod: ''       // 检查方式：v-if / 函数
}
```

### 数据模型信息

```javascript
const dataModels = [
  {
    name: '',           // 模型名称：User
    fields: [           // 字段列表
      {
        name: '',       // 字段名
        type: '',       // 类型
        required: false,// 是否必填
        description: '' // 描述
      }
    ],
    relations: []       // 关联关系
  }
]
```

## 文档解析示例

### README.md 解析示例

**输入**：
```markdown
# 用户管理系统

企业级用户权限管理平台，支持多租户、多角色权限控制。

## 技术栈

- Vue 3.4 + TypeScript 5.0
- Pinia 2.1 状态管理
- Element Plus 2.4
- Vite 5.0 构建

## 目录结构

src/
├── views/          # 页面组件
├── components/     # 公共组件
├── api/            # 接口定义
├── stores/         # 状态管理
└── router/         # 路由配置
```

**输出**：
```javascript
{
  name: '用户管理系统',
  description: '企业级用户权限管理平台，支持多租户、多角色权限控制',
  techStack: {
    framework: 'Vue 3.4',
    language: 'TypeScript 5.0',
    stateManagement: 'Pinia 2.1',
    uiLibrary: 'Element Plus 2.4',
    buildTool: 'Vite 5.0'
  },
  structure: {
    pages: 'src/views',
    components: 'src/components',
    api: 'src/api',
    stores: 'src/stores',
    router: 'src/router'
  }
}
```

### CLAUDE.md 解析示例

**输入**：
```markdown
# 项目规范

## 命名规范

- 组件文件：PascalCase（如 UserList.vue）
- 工具函数：camelCase（如 formatDate.ts）
- 样式文件：kebab-case（如 user-list.scss）

## 业务规则

- 用户状态：active/inactive/locked
- 默认分页：page=1, size=20
- 权限格式：module:action（如 user:view）
```

**输出**：
```javascript
{
  conventions: {
    naming: {
      component: 'PascalCase',
      utility: 'camelCase',
      style: 'kebab-case'
    }
  },
  businessRules: {
    userStatus: ['active', 'inactive', 'locked'],
    defaultPagination: { page: 1, size: 20 },
    permissionFormat: 'module:action'
  }
}
```

## 文档缺失处理

当关键文档不存在时的降级策略：

| 文档 | 缺失处理 |
|------|----------|
| README.md | 从 package.json 提取基础信息 |
| CLAUDE.md | 使用默认规范，提示用户补充 |
| docs/architecture.md | 从代码结构推断模块划分 |
| docs/api.md | 从 api 目录代码提取接口定义 |

## 上下文传递格式

将提取的文档信息传递给 SubAgent：

```markdown
## 项目上下文

### 项目信息
- 名称：{projectName}
- 技术栈：{techStack}
- 目录结构：{structure}

### 业务模块
{modules}

### 权限体系
{permissions}

### 开发规范
{conventions}

### 相关文档
- 业务文档：{businessDocs}
- 技术文档：{technicalDocs}
```
