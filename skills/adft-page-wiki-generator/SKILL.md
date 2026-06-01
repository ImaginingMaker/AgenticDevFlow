---
name: adft-page-wiki-generator
description: |
  页面关键链路分析与Wiki自动生成技能（独立工具，不参与前端开发流水线）。读取项目代码，自动解析页面结构、识别关键链路，生成标准化Wiki文档。

  TRIGGER when: 用户说"解析页面生成Wiki"、"生成代码文档"、"分析页面链路"、"批量生成Wiki"、"为这个页面写文档"、"分析这个组件的链路"；用户需要理解页面初始化流程、业务操作链路、数据流转；用户提到"关键链路"、"页面Wiki"、"代码Wiki"、"链路分析"。

  适用场景：多页面项目、复杂业务链路项目、需频繁更新Wiki的迭代型项目。
---

# 页面关键链路分析与Wiki生成技能

## 概述

本技能采用 **Main Agent + 多 SubAgent 并发** 架构，读取项目代码和文档，自动解析页面结构、识别关键链路，生成标准化Wiki文档。

## 核心架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Main Agent                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 1. 读取项目文档（README、CLAUDE.md、docs/）            │ │
│  │ 2. 解析范围确认                                        │ │
│  │ 3. 基础代码解析（路由、组件引入、接口定义）            │ │
│  │ 4. 构建项目上下文                                      │ │
│  │ 5. 调度 SubAgent 并发处理                              │ │
│  │ 6. 汇总结果，合并生成完整Wiki                          │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             │
             ┌───────────────┼───────────────┐
             │               │               │
             ▼               ▼               ▼
      ┌──────────┐    ┌──────────┐    ┌──────────┐
      │ SubAgent │    │ SubAgent │    │ SubAgent │
      │  链路1   │    │  链路2   │    │  链路N   │
      └──────────┘    └──────────┘    └──────────┘
```

## 执行流程

### Phase 0: 读取项目文档（新增）

Main Agent 首先读取项目中的文档，构建项目上下文，辅助后续解析：

#### 0.1 必读文档列表

按优先级读取以下文档：

| 优先级 | 文档路径 | 用途 |
|--------|----------|------|
| P0 | `README.md` | 项目概述、技术栈、目录结构 |
| P0 | `CLAUDE.md` | Claude Code 项目配置和规范 |
| P1 | `docs/README.md` | 文档目录索引 |
| P1 | `docs/architecture.md` | 架构设计文档 |
| P1 | `docs/api.md` | API 接口文档 |
| P2 | `docs/business/*.md` | 业务逻辑文档 |
| P2 | `docs/technical/*.md` | 技术方案文档 |

#### 0.2 文档解析规则

```markdown
## 从 README.md 提取

- 项目名称和简介
- 技术栈（框架、库、版本）
- 目录结构说明
- 开发规范

## 从 CLAUDE.md 提取

- 项目特定规范
- 代码风格要求
- 业务约定
- 注意事项

## 从 docs/ 提取

- 业务模块划分
- 数据模型定义
- 接口规范
- 权限体系
```

#### 0.3 构建项目上下文

将文档信息整合为项目上下文：

```javascript
const projectContext = {
  // 项目基础信息
  project: {
    name: '用户管理系统',
    description: '企业级用户权限管理平台',
    techStack: ['Vue 3', 'TypeScript', 'Pinia', 'Element Plus'],
    version: '2.0.0'
  },

  // 目录结构
  structure: {
    pages: 'src/views',
    components: 'src/components',
    api: 'src/api',
    stores: 'src/stores',
    router: 'src/router'
  },

  // 业务模块
  modules: [
    { name: '用户管理', path: '/user', pages: ['list', 'detail', 'edit'] },
    { name: '角色管理', path: '/role', pages: ['list', 'edit'] }
  ],

  // 权限体系
  permissions: {
    prefix: 'system:user',
    types: ['view', 'create', 'edit', 'delete']
  },

  // 开发规范
  conventions: {
    naming: 'kebab-case',
    apiPrefix: '/api/v1',
    storePattern: 'setup-syntax'
  }
}
```

### Phase 1: Main Agent 基础解析

Main Agent 负责轻量级的基础解析，为 SubAgent 提供上下文：

1. **确认解析范围**
   - 单页面模式：解析指定文件
   - 批量模式：遍历目录下所有页面文件

2. **基础代码解析**
   - 路由配置提取（路径、名称、守卫、权限）
   - 组件引入关系（import 语句分析）
   - 接口函数定义（api 目录扫描）
   - 状态管理结构（store 文件识别）

3. **生成 SubAgent 任务分配**
   - 根据代码复杂度决定并发粒度
   - 为每个 SubAgent 分配独立的链路分析任务

### Phase 2: SubAgent 并发处理（委托 adfo-task-orchestrator）

将 6 个链路分析维度组装为任务清单，委托 `adfo-task-orchestrator` 并发调度执行：

| ID | 描述 | Agent类型 | 提示词 | 依赖 |
|----|------|-----------|--------|------|
| T1 | 初始化链路分析 | general-purpose | 分析页面初始化加载链路... | - |
| T2 | 业务操作链路分析 | general-purpose | 分析用户交互操作链路... | - |
| T3 | 分支跳转链路分析 | general-purpose | 分析路由跳转和弹窗链路... | - |
| T4 | 异常处理链路分析 | general-purpose | 分析异常捕获和容错逻辑... | - |
| T5 | 组件结构分析 | general-purpose | 分析组件树和依赖关系... | - |
| T6 | 数据流分析 | general-purpose | 分析状态管理和数据流转... | - |

6 个维度全部无依赖，同一并发组并行执行。执行参数：`最大并发数: 6`

每个 SubAgent 接收：项目上下文（从文档提取的背景信息）、代码片段、输出格式要求。

### Phase 3: Main Agent 汇总合并

Main Agent 收集所有 SubAgent 结果，合并生成完整 Wiki：

1. **结果收集**：等待所有 SubAgent 完成
2. **内容合并**：按章节顺序组装文档
3. **目录同步**：写入 docs/wiki 目录
4. **索引更新**：更新总目录.md

## 详细步骤

### 第一步：读取项目文档

#### 1.1 扫描文档目录

```
项目根目录/
├── README.md              ← 必读
├── CLAUDE.md              ← 必读
├── package.json           ← 技术栈信息
└── docs/
    ├── README.md          ← 文档索引
    ├── architecture.md    ← 架构设计
    ├── api.md             ← API 文档
    ├── business/          ← 业务文档
    │   ├── user.md
    │   └── order.md
    └── technical/         ← 技术文档
        ├── auth.md
        └── state.md
```

#### 1.2 提取关键信息

**从 README.md 提取**：
- 项目名称、简介、版本
- 技术栈列表
- 目录结构说明
- 开发、构建命令

**从 CLAUDE.md 提取**：
- 项目特定规范
- 代码风格约定
- 业务规则
- 注意事项

**从 package.json 提取**：
- 依赖版本
- 脚本命令
- 项目元信息

**从 docs/ 提取**：
- 业务逻辑说明
- 数据模型定义
- 接口规范
- 架构设计

### 第二步：确认解析范围

根据用户指令确定解析范围：

| 模式 | 用户输入示例 | 处理方式 |
|------|-------------|----------|
| 单页面 | 解析 src/views/user/list.vue，生成Wiki | 解析单个文件 |
| 批量 | 解析 src/views/user 下所有页面 | 遍历目录 |

### 第三步：Main Agent 基础解析

执行轻量级解析，提取关键信息：

```javascript
// 基础解析结果结构
const baseContext = {
  // 项目上下文（从文档提取）
  project: { ... },

  // 页面信息
  pageInfo: {
    filePath: 'src/views/user/list.vue',
    routePath: '/user/list',
    routeName: 'UserList',
    permissions: ['user:view'],
    module: '用户管理'
  },

  // 代码结构
  imports: [
    { name: 'SearchForm', path: './components/SearchForm.vue' },
    { name: 'getUserList', path: '@/api/user' }
  ],
  apiFunctions: [
    { name: 'getUserList', method: 'GET', url: '/api/user/list' }
  ],
  stores: [
    { name: 'useUserStore', path: '@/stores/user' }
  ]
}
```

### 第四步：调度 SubAgent 并发

使用 Agent 工具并发启动多个 SubAgent，每个 SubAgent 接收项目上下文：

```
// 伪代码示意
parallel(
  Agent({
    subagent_type: "general-purpose",
    prompt: `
      ## 项目上下文
      ${projectContext}

      ## 任务
      分析页面初始化加载链路...

      ## 页面文件
      ${pageFilePath}
    `
  }),
  // ... 其他 SubAgent
)
```

### 第五步：汇总生成 Wiki

Main Agent 收集所有 SubAgent 结果，按章节合并：

```markdown
# 页面Wiki（index.md）

## 第一章 页面基础信息
[Main Agent 生成 - 结合项目文档]

## 第二章 路由与入口链路
[Main Agent 生成 - 结合路由文档]

## 第三章 核心业务链路
### 3.1 初始化加载链路
[SubAgent-1 输出]
### 3.2 主流程操作链路
[SubAgent-2 输出]
### 3.3 分支跳转链路
[SubAgent-3 输出]

## 第四章 组件结构与依赖
[SubAgent-5 输出]

## 第五章 数据流与状态管理
[SubAgent-6 输出]

## 第六章 接口请求规范
[Main Agent 生成 - 结合 API 文档]

## 第七章 权限、埋点与异常处理
[SubAgent-4 输出]

## 第八章 维护与变更记录
[Main Agent 生成]
```

### 第六步：目录同步

将生成的 Wiki 同步到项目目录：

```
docs/wiki/
├── 总目录.md
├── {业务模块}/
│   └── {页面名称}/
│       ├── index.md
│       └── assets/
```

## SubAgent 调度策略

### 并发数量决策

| 页面复杂度 | SubAgent 数量 | 策略 |
|-----------|--------------|------|
| 简单（<100行） | 2-3 | 合并部分任务 |
| 中等（100-500行） | 4-6 | 标准并发 |
| 复杂（>500行） | 6+ | 细粒度拆分 |

### 任务分配原则

1. **独立性**：每个 SubAgent 的任务相互独立，无依赖
2. **均衡性**：任务粒度相近，避免长尾等待
3. **完整性**：所有任务覆盖 Wiki 全部章节
4. **上下文传递**：每个 SubAgent 都接收项目上下文

## 输出格式规范

### 链路描述格式
```markdown
**链路名称**：[链路描述]

**触发条件**：[什么情况下触发]

**执行步骤**：
1. [步骤1]
2. [步骤2]
3. [步骤3]

**数据流转**：[数据如何变化]

**异常处理**：[如何处理异常]
```

### 接口表格格式
| 接口名称 | 请求方式 | 接口地址 | 调用时机 | 说明 |
|----------|----------|----------|----------|------|

### 组件表格格式
| 组件名称 | 类型 | Props | 事件 | 说明 |
|----------|------|-------|------|------|

## 使用示例

**单页面生成**：
```
用户：解析 src/views/user/list.vue，生成Wiki
```

**批量生成**：
```
用户：解析 src/views/user 下所有页面，批量生成Wiki
```

## 注意事项

1. **文档优先**：先读取项目文档，再解析代码，文档信息辅助理解
2. **Main Agent 职责**：只做轻量解析和上下文构建，重分析任务交给 SubAgent（通过 adfo-task-orchestrator 调度）
3. **SubAgent 并发**：委托 adfo-task-orchestrator 并发执行，避免串行等待
4. **上下文传递**：每个 SubAgent 都应接收项目上下文，确保分析一致性
5. **格式标准化**：每个子任务输出格式必须标准化，便于合并
6. **生成后校验**：需校验章节完整性和内容准确性

---

## 模板注入

> 本技能为独立工具（adft-），不接入 harness 流水线，模板配置按需使用。

`agents/` — 6 个 SubAgent 指令（init-link / business-link / branch-link / error-handling / component-structure / data-flow）
`references/` — 代码解析规则 / 文档解析规则 / 链路分析规则 / Wiki 结构规范
