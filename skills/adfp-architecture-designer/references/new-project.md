# 新项目规划 - 详细流程与输出示例

> 供 `adfp-architecture-designer` 在「新项目」模式下使用。
> 基于 SPEC 生成文件层级和模块边界规划。

## 核心原则

| 原则 | 说明 |
|------|------|
| **原子化优先** | 原子/分子/组织/模板 四级分层，鼓励高复用 |
| **就近原则** | 类型/样式/测试同目录，不跨目录分散 |
| **扁平优先** | 目录层级 ≤ 3 层，避免过深嵌套 |
| **领域隔离** | 业务模块不互相引用，通过抽象层解耦 |

---

## 执行流程

```
输入 SPEC → Step 1 划分业务域 → Step 2 设计目录骨架 →
Step 3 模块依赖定义 → Step 4 可复用层识别 →
Step 5 输出 architecture.md
```

### Step 1：划分业务域

基于 SPEC 页面架构和功能模块，识别业务域：

| 业务域 | 包含页面 | 描述 |
|--------|---------|------|
| {域A} | {页面1, 页面2} | {描述} |
| {域B} | {页面3, 页面4} | {描述} |

**规则**：
- 每个业务域对应 SPEC 中的一个功能模块
- 业务域之间通过接口/抽象层交互
- 共享功能（权限、配置、工具）不归入任何业务域

### Step 2：设计目录骨架

```
src/
├── shared/                   # 跨域共享层
│   ├── components/           # 通用原子组件
│   │   ├── Button/
│   │   ├── Input/
│   │   └── Modal/
│   ├── hooks/                # 通用 Hooks
│   ├── utils/                # 工具函数
│   ├── types/                # 全局类型定义
│   └── constants/            # 全局常量
├── domains/                  # 业务域
│   ├── auth/                 # 域A：认证
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── types/
│   │   └── pages/
│   ├── user/                 # 域B：用户管理
│   │   └── ...
│   └── order/                # 域C：订单
│       └── ...
├── layouts/                  # 布局组件
│   ├── MainLayout/
│   └── AuthLayout/
├── routes/                   # 路由配置
│   └── index.ts
├── stores/                   # 全局状态
│   └── index.ts
├── styles/                   # 全局样式
│   ├── variables.css
│   └── global.css
└── App.tsx                   # 入口
```

### Step 3：模块依赖定义

每个模块的依赖关系：

```
src/
├── shared/         → 无业务依赖（基础层）
├── layouts/        → 依赖 shared/
├── stores/         → 依赖 shared/types/
├── routes/         → 依赖 domains/*/pages/
├── domains/auth/   → 依赖 shared/
├── domains/user/   → 依赖 shared/ + auth/（用户需登录）
└── App.tsx         → 依赖 routes/ + layouts/
```

**依赖方向**：`domains/*` → `shared/`（单向），禁止 `domains/A` ←→ `domains/B` 直接引用。

### Step 4：可复用层识别

| 层级 | 复用范围 | 包含 | 示例 |
|------|---------|------|------|
| 原子（Atom） | 全局 | 最小通用组件 | Button, Input, Icon |
| 分子（Molecule） | 域内/跨域 | 原子组合 | SearchBar, UserCard |
| 组织（Organism） | 域内 | 分子组合 | UserList, OrderForm |
| 模板（Template） | 页面级 | 布局模板 | DashboardLayout |

---

## 输出格式

```markdown
## 目录结构
(Step 2 输出的目录骨架)

## 模块依赖关系
(Step 3 输出的依赖定义)

## 可复用层
(Step 4 输出的可复用层定义)

## 实施建议
- 建议开发顺序：shared → layouts → 域A → 域B
- 并行可能性：域A 与 域B 可并行开发
- 首批创建：shared/components 原子组件
```

---

## 约束规则

1. 基于 SPEC 生成，不凭空设计
2. 目录层级 ≤ 3 层（shared、domains、routes 等根目录不计入）
3. 业务域之间禁止直接引用，必须通过 shared/ 抽象层
4. 每个目录的职责单一（不混合业务域）
5. 不涉及具体组件实现（归 adfp-component-designer）
6. 不涉及实施顺序（归 adfo-harness-runner）
