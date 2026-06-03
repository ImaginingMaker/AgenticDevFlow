---
name: adfp-spec-generator
description: "技术规格文档（SPEC）生成器。从PRD出发，生成前端技术规格：页面架构（页面→区块映射）、数据模型、API契约、状态管理策略、路由设计。不涉及详细组件树（归adfp-component-designer）和文件层级规划（归adfp-architecture-designer）。TRIGGER: 用户说'生成SPEC'、'技术规格'、'spec文档'、'technical spec'、'技术方案'、'写技术文档'、'技术设计'。Use proactively when: 用户已有PRD或明确需求，需要技术规格作为实现依据。"
---

# 技术规格生成器

从 PRD/需求生成前端技术规格。PRD → 代码实现之间的技术桥梁。

## 核心流程

```
读取PRD/需求 → 功能模块划分 → 页面架构 → 数据模型 → API契约 → 状态策略 → 路由设计 → 输出SPEC
```

**职责边界**：SPEC 只定义「有什么页面、用什么数据、调什么接口、怎么路由、状态怎么管」。**不定义**详细组件树（归 adfp-component-designer）、文件层级规划（归 adfp-architecture-designer）。

---

## 一、功能模块划分

从 PRD 功能清单映射到前端模块：

| 模块 | 对应PRD功能 | 页面/组件 | 优先级 |
|------|-----------|----------|--------|
| {模块名} | F1, F2 | {页面路径} | P0 |

---

## 二、页面架构

**只定义页面→区块映射，不展开叶子组件。** 详细组件树和 Props 设计归 `adfp-component-designer` 负责。

### 页面清单

| 页面 | 路由 | 页面组件 | 区块组成 | 优先级 |
|------|------|---------|---------|--------|
| 首页 | `/` | HomePage | Header, HeroBanner, FeatureGrid, Footer | P0 |
| 用户列表 | `/users` | UserListPage | Header, SearchBar, UserTable, Pagination, Footer | P0 |

### 页面→区块映射（不展开叶子）

```
App
├── Layout（Header + Footer 公共布局）
├── HomePage
│   ├── HeroSection     → 归 adfp-component-designer 展开
│   └── FeatureSection  → 归 adfp-component-designer 展开
├── UserListPage
│   ├── SearchSection   → 归 adfp-component-designer 展开
│   └── ListSection     → 归 adfp-component-designer 展开
└── UserDetailPage
    ├── ProfileHeader   → 归 adfp-component-designer 展开
    └── DetailContent   → 归 adfp-component-designer 展开
```

### 公共区块识别

| 区块 | 使用页面 | 说明 |
|------|---------|------|
| Header | 全部 | 顶部导航，含 Logo + NavMenu |
| Footer | 全部 | 页脚 |

---

## 三、数据模型

```typescript
// 核心实体定义

interface User {
  id: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

// 枚举定义

type {Status} = 'active' | 'inactive' | 'pending';
```

---

## 四、API 契约

### 接口清单

| 方法 | 路径 | 描述 | 请求体 | 响应体 | 使用页面 |
|------|------|------|--------|--------|----------|
| GET | `/api/users` | 获取用户列表 | `{ page, size, keyword }` | `{ items: User[], total }` | UserList |
| POST | `/api/users` | 创建用户 | `{ name, email }` | `User` | UserCreate |

### 状态处理约定

每个 API 调用的组件必须处理三种状态：
```
loading → 显示 Loading/Skeleton
empty   → 显示空状态引导
error   → 显示错误 + 重试
```

---

## 五、状态管理策略

**只定义策略（数据分几层、每层怎么管），不列具体状态变量。** 具体状态变量定义归 `adfp-component-designer` 负责。

### 数据分层策略

| 数据层 | 范围 | 管理策略 | 示例 |
|--------|------|---------|------|
| 全局共享 | 跨页面 | 提升到 Context/Store | 当前用户信息、主题 |
| 页面级 | 单页面内 | 页面组件持有 | 列表数据、筛选条件 |
| 组件级 | 单组件内 | 组件内部 useState | 表单输入、展开/折叠 |
| 服务端缓存 | 跨组件 | 缓存+自动刷新 | API 响应数据 |

### 状态管理原则
- 仅全局共享的状态提升
- 页面级数据不放入全局 Store
- 服务端数据走缓存层，避免重复请求
- 具体状态变量名和初始值由 adfp-component-designer 定义

---

## 六、路由设计

| 路径 | 页面组件 | 权限 | 懒加载 |
|------|----------|------|--------|
| `/` | HomePage | 公开 | ✅ |
| `/users` | UserListPage | 登录用户 | ✅ |
| `/users/:id` | UserDetailPage | 登录用户 | ✅ |
| `/login` | LoginPage | 公开 | ❌ |

---

## 七、风险与技术债

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| {技术风险} | {影响范围} | {缓解方案} |

---

## 八、输出：SPEC 文档

### 产物位置

| 模式 | 输出路径 | 说明 |
|------|---------|------|
| 敏捷模式（直接调用） | `./spec.md` 或用户指定 | 当前工作目录 |
| 工程模式（通过 harness） | `docs/workflows/{任务ID}/spec.md` | 由编排器指定 |

### CLI 集成（工程模式）

```
# 执行前：获取编译后的执行上下文
node skills/adfo-harness-runner/scripts/harness-cli.js context {任务ID}

# 执行后：校验产物并更新状态
node skills/adfo-harness-runner/scripts/harness-cli.js verify {任务ID} SPEC {产物路径}
```

### 文档模板

```markdown
---
phase: SPEC
status: completed
qualityGate: pass
---

# {项目名} - 技术规格文档

**版本**: 1.0
**基于PRD**: {PRD 引用}

## 1. 概述与技术选型
## 2. 功能模块映射
## 3. 页面架构（页面→区块映射，不含叶子组件）
## 4. 数据模型
## 5. API 契约
## 6. 状态管理策略
## 7. 路由设计
## 8. 风险与缓解
```

---

## 九、PRD 格式校验

**生成 SPEC 前，必须校验 PRD 是否具备必要信息。**

### 校验清单

| 检查项 | 必要性 | 说明 |
|--------|--------|------|
| 功能清单 | 必须 | 明确的功能模块列表，含优先级 |
| 用户故事 | 必须 | 每个功能对应的用户场景 |
| 验收标准 | 必须 | 可测试的验收条件 |
| 交互流程 | 推荐 | 关键业务流程描述 |
| 技术约束 | 推荐 | 已确定的技术栈或限制 |

### 校验失败处理

- **缺少必要项**：提示用户补充 PRD 内容，暂停生成
- **缺少推荐项**：标注「待确认」，继续生成但需用户确认

---

## 十、约束规则

1. 基于 PRD 生成，不凭空设计
2. 不确定的技术决策标注「待确认」
3. 页面架构止于页面→区块映射，不展开叶子组件树（归 adfp-component-designer）
4. 状态管理只定义分层策略，不列具体状态变量（归 adfp-component-designer）
5. 不规划文件目录结构（归 adfp-architecture-designer）
6. API 契约中每个接口必须标注使用页面
7. 不引入 PRD 中未提及的功能模块

---

## 模板注入

> 共享配置（技术栈、目录约定）由 `adfo-harness-runner/templates/custom.md` 统一管理。

`templates/custom.md` — SPEC 模板定制：

```markdown
# SPEC 自定义模板

## 技术栈（新项目时填写，已有项目自动从 package.json 等检测）
- 框架：{用户指定}
- 状态管理：{用户指定}
- UI 库：{用户指定}
- 样式：{用户指定}
- 路由：{用户指定}

## 目录约定（按实际项目结构，不从模板预设）
- 页面组件：{按项目实际路径}
- 通用组件：{按项目实际路径}
- API 调用：{按项目实际路径}
- 全局状态：{按项目实际路径}

## API 约定
- 统一使用 {用户指定} 封装
- 错误统一通过 {用户指定} 处理
- 请求需携带 {用户指定} 认证

## 性能目标
- 首屏加载：< {用户指定}s
- 交互响应：< {用户指定}ms
```
