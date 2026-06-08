# SPEC 生成 - 分步执行流程

> SKILL.md 入口页中的路由入口。本文档详细描述 SPEC 生成的每一步执行流程。

## 总体执行流

```
PRD/需求输入 → [Step 0] PRD 格式校验 → [Step 1] 平台感知检测 →
[Step 2] 功能模块划分 → [Step 3] 页面架构 → [Step 4] 数据模型 →
[Step 5] API 契约 → [Step 6] 状态管理策略 → [Step 7] 路由设计 →
[Step 8] 风险与技术债 → [Step 9] 输出 SPEC 文档
```

---

## Step 0：PRD 格式校验

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

## Step 1：平台感知（技术栈检测）

### 检测优先级

1. **工程模式（最高优先级）**：从 `state.json.techStack` 读取
2. **敏捷模式**：扫描 `package.json` → 框架配置文件 → 目录结构
3. **用户指定**：主动询问
4. **通用降级**：按通用前端维度执行

### 检测路由表

| 检测条件 | 路由影响 |
|----------|---------|
| `React*` / `JSX` / `TSX` | 路由 → React Router v6、状态 → Zustand/Redux、请求 → React Query |
| `Vue*` / `Nuxt` | 路由 → Vue Router、状态 → Pinia、请求 → Vue Query/axios |
| `微信小程序` / `小程序` | 路由 → 小程序原生路由、状态 → 全局 data/Store |
| `Taro` / `uni-app` | 路由 → Taro.navigateTo/uni.navigateTo、状态 → 按配置选择 |
| 未知 | 通用推荐 + 提示用户指定 |

---

## Step 2：功能模块划分

从 PRD 功能清单映射到前端模块：

| 模块 | 对应 PRD 功能 | 页面/组件 | 优先级 |
|------|--------------|-----------|--------|
| {模块名} | F1, F2 | {页面路径} | P0 |

### 映射规则

- 一个模块对应 1 个或多个 PRD 功能
- 每个模块最终对应 1 个或多个页面/组件
- 模块按 PRD 优先级排序

---

## Step 3：页面架构

**只定义页面→区块映射，不展开叶子组件。详细组件树和 Props 设计归 `adfp-component-designer`。**

### 页面清单

| 页面 | 路由 | 页面组件 | 区块组成 | 优先级 |
|------|------|---------|---------|--------|
| 首页 | `/` | HomePage | Header, HeroBanner, FeatureGrid, Footer | P0 |

### 页面→区块映射规则

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

## Step 4：数据模型

### 实体定义

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

### 生成规则

- 从 PRD 用户故事中提取实体
- 每个实体包含：字段名、类型、是否可选、说明
- 标明实体间关系（1:1 / 1:N / N:M）

---

## Step 5：API 契约

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

### 生成规则

- 每个接口必须标注使用页面
- 标注哪些接口需要权限
- 不确定的接口设计标注「待确认」

---

## Step 6：状态管理策略

**只定义策略（数据分几层、每层怎么管），不列具体状态变量。具体状态变量定义归 `adfp-component-designer`。**

### 数据分层策略

| 数据层 | 范围 | 管理策略 | 示例 |
|--------|------|---------|------|
| 全局共享 | 跨页面 | 提升到 Context/Store | 当前用户信息、主题 |
| 页面级 | 单页面内 | 页面组件持有 | 列表数据、筛选条件 |
| 组件级 | 单组件内 | 组件内部 useState | 表单输入、展开/折叠 |
| 服务端缓存 | 跨组件 | 缓存+自动刷新 | API 响应数据 |

### 管理原则

- 仅全局共享的状态提升
- 页面级数据不放入全局 Store
- 服务端数据走缓存层，避免重复请求
- 具体状态变量名和初始值由 adfp-component-designer 定义

---

## Step 7：路由设计

| 路径 | 页面组件 | 权限 | 懒加载 |
|------|---------|------|--------|
| `/` | HomePage | 公开 | ✅ |
| `/users` | UserListPage | 登录用户 | ✅ |

### 设计规则

- 先列出所有页面路径
- 然后标注权限要求
- 最后决定懒加载策略

---

## Step 8：风险与技术债

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| {技术风险} | {影响范围} | {缓解方案} |

### 识别维度

| 风险维度 | 示例 |
|---------|------|
| 性能风险 | 大数据量列表、频繁 API 调用 |
| 架构风险 | 模块间循环依赖、过度耦合 |
| 安全风险 | 敏感数据暴露、权限控制遗漏 |
| 兼容性风险 | 浏览器兼容、多端适配 |
| 技术债风险 | 引入不熟悉的框架/库、过度定制 |

---

## Step 9：输出 SPEC 文档

### 产物位置

| 模式 | 输出路径 |
|------|---------|
| 敏捷模式（直接调用） | `./spec.md` 或用户指定 |
| 工程模式（通过 harness） | `docs/workflows/{任务ID}/spec.md` |

### 文档 front-matter

```markdown
---
phase: SPEC
status: completed
qualityGate: pass
---
```

### CLI 集成（工程模式）

```bash
# 执行前：获取编译后的执行上下文
node skills/adfo-harness-runner/scripts/harness-cli.js context {任务ID}

# 执行后：校验产物并更新状态
node skills/adfo-harness-runner/scripts/harness-cli.js verify {任务ID} SPEC {产物路径}
```

---

## 约束规则

1. 基于 PRD 生成，不凭空设计
2. 不确定的技术决策标注「待确认」
3. 页面架构止于页面→区块映射，不展开叶子组件树（归 adfp-component-designer）
4. 状态管理只定义分层策略，不列具体状态变量（归 adfp-component-designer）
5. 不规划文件目录结构（归 adfp-architecture-designer）
6. API 契约中每个接口必须标注使用页面
7. 不引入 PRD 中未提及的功能模块
