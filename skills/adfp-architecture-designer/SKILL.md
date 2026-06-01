---
name: adfp-architecture-designer
description: "前端架构设计专家。两大模式：1）已有项目——并发5个SubAgent扫描现有代码，识别可复用原子化模块、依赖拓扑、规范模式；2）新项目——基于SPEC智能规划文件层级架构和模块边界。产物为architecture.md，包含可复用清单、依赖图（供实施顺序编排）、文件层级蓝图。是SPEC到DESIGN之间的架构桥梁。TRIGGER: 用户说'架构设计'、'architecture'、'分析项目架构'、'规划文件结构'、'复用分析'、'架构实施计划'、'模块拆分'、'依赖分析'。Use proactively when: SPEC完成后需要将静态架构描述转化为可执行的实施计划，或在现有项目中识别可复用模块。"
---

# 前端架构设计专家

SPEC（技术规格）和 DESIGN（组件设计）之间的架构桥梁。不做代码实现，只做架构分析和规划。

## 核心价值

```
SPEC 产出"有什么"  →  ARCHITECTURE 产出"怎么组织、按什么顺序建、哪些能复用"
DESIGN 产出"每个组件长什么样"  →  IMPLEMENT 写代码
```

---

## 执行流程

```
判断项目类型 → 选择模式 → 分析/规划 → 依赖拓扑 → 实施顺序 → 输出 architecture.md
```

---

## 一、项目类型判断

首先判断项目状态：

| 条件 | 模式 | 说明 |
|------|------|------|
| `package.json` 存在 + `src/` 有代码 | **已有项目分析** | 走 SubAgent 并发扫描 |
| 无 `package.json` 或空项目 | **新项目规划** | 走智能层级规划 |

---

## 二、模式 A：已有项目分析（SubAgent 并发）

### 执行机制

**主 Agent 生成任务清单 → 委托 `adfo-task-orchestrator` 并发执行 5 个 SubAgent → 接收汇总结果 → 去重冲突校验 → 输出报告**

5 个 SubAgent 全部无依赖，同一并发组并行执行。任务清单格式：

| ID | 描述 | Agent类型 | 提示词 | 依赖 |
|----|------|-----------|--------|------|
| SA1 | 组件扫描 | general-purpose | 扫描 src/components/、src/pages/... | - |
| SA2 | Hooks/逻辑盘点 | general-purpose | 扫描 src/hooks/、src/utils/... | - |
| SA3 | Service/API扫描 | general-purpose | 扫描 src/services/、src/api/... | - |
| SA4 | 依赖关系图映射 | general-purpose | 分析 import/export 关系... | - |
| SA5 | 结构规范分析 | general-purpose | 分析目录结构、命名规范... | - |

执行参数：`最大并发数: 5`

> 工程模式下，已有项目应先从 `state.json.techStack` 读取 harness-runner 已识别的技术栈，避免重复扫描。

### SubAgent 1：组件扫描器

**职责**：扫描 `src/components/`、`src/pages/` 等目录，枚举所有已存在的组件。

**输出**：
```
组件清单：
| 组件 | 路径 | 类型 | Props | 职责 | 可复用性 |
|------|------|------|-------|------|----------|
| Button | src/components/ui/Button/ | 展示型 | {variant, size, children} | 通用按钮 | ✅ 高 |
| UserCard | src/pages/UserList/UserCard.tsx | 业务型 | {user, onClick} | 用户卡片 | ❌ 仅该页使用 |

原子化评级：
- ✅ 原子化良好（单一职责、Props最小化）：{组件列表}
- ⚠️ 可拆分（职责混杂 >1）：{组件列表}
- 🔴 应重构（>200行、多职责耦合）：{组件列表}
```

### SubAgent 2：Hooks/逻辑盘点器

**职责**：扫描 `src/hooks/`、`src/utils/`，盘点已有的可复用逻辑。**不做内联逻辑提取**——如需深度提取，建议调用 `adfa-hooks-extractor`。

**输出**：
```
已有 Hooks/Utils 清单：
| Hook/Util | 路径 | 职责 | 被引用次数 | 可复用性 |
|-----------|------|------|-----------|----------|
| useDebounce | src/hooks/useDebounce.ts | 输入防抖 | 3 | ✅ 高 |
| formatDate | src/utils/date.ts | 日期格式化 | 5 | ✅ 高 |

💡 发现组件内可能存在可提取的内联逻辑 → 建议运行 adfa-hooks-extractor 做深度分析
```

### SubAgent 3：Service/API 层扫描器

**职责**：扫描 `src/services/`、`src/api/` 等，分析 API 调用模式和封装情况。

**输出**：
```
API 层分析：
| Service | 路径 | 方法 | 使用页面 | 封装完整性 |
|---------|------|------|---------|-----------|
| userService | src/services/user.ts | getUserList, createUser | UserList, UserCreate | ✅ 完整 |
| authService | - | 内联在 LoginForm | LoginPage | 🔴 应提取 |

已有封装模式：
- 请求实例：{axios instance at src/utils/request.ts}
- 错误处理：{ErrorBoundary / 统一 toast}
- 认证方式：{token 拦截器 / cookie}
```

### SubAgent 4：依赖关系图映射器

**职责**：分析 import/export 关系，绘制组件间依赖拓扑。

**输出**：
```
依赖拓扑：
UserListPage
├── depends on → SearchBar, UserTable, Pagination
│   ├── SearchBar → useDebounce, Input
│   ├── UserTable → UserRow, useUserData
│   │   └── UserRow → Button, UserAvatar
│   └── Pagination → usePagination
└── 被依赖：AppRouter

循环依赖检测：{无 / 发现 X 处}
全局污染检测：{无 / 组件X 使用了全局样式/变量}
```

### SubAgent 5：结构规范分析器

**职责**：分析目录结构、命名规范、样式方案、TypeScript 配置。

**输出**：
```
项目结构规范：
目录约定：
- 页面组件：src/pages/{Name}/index.tsx
- 通用组件：src/components/{category}/{Name}/
- 自定义 Hooks：src/hooks/use{Name}.ts
- API 服务：src/services/{domain}.ts
- 类型定义：src/types/{domain}.ts

命名规范：
- 组件文件：PascalCase
- Hook 文件：camelCase, use前缀
- 事件处理：handle前缀
- Props 接口：{Component}Props

样式方案：{CSS Modules / Tailwind / styled-components}
TypeScript：strict: {true/false}
```

### 汇总整合

`adfo-task-orchestrator` 返回各 SubAgent 结果后，主 Agent 执行：

1. **去重**：多个 SubAgent 发现的同一模块合并
2. **冲突校验**：不一致的发现标注 ⚠️
3. **优先级排序**：按影响范围排列
4. **输出可复用清单**：汇总为统一视图

---

## 三、模式 B：新项目规划

无现有代码时，基于 SPEC 的组件树、路由、数据模型，生成最优文件层级。

### 规划原则

- **原子化优先**：组件树中识别原子/分子/组织/模板层级
- **就近原则**：组件相关文件（类型、样式、测试）放在同一目录
- **扁平优先**：3 层以内目录深度
- **领域隔离**：业务模块之间不互相引用

### 产出

```
src/
├── components/
│   ├── ui/                    # 原子级通用组件
│   │   ├── Button/
│   │   │   ├── index.tsx
│   │   │   ├── types.ts
│   │   │   └── button.module.css
│   │   ├── Input/
│   │   └── Modal/
│   └── business/              # 分子/组织级业务组件
│       ├── SearchBar/
│       └── UserTable/
├── pages/                     # 模板级页面
│   ├── UserList/
│   │   ├── index.tsx
│   │   └── components/        # 页面私有组件
│   └── UserDetail/
├── hooks/                     # 可复用 Hooks
│   ├── useUserList.ts
│   └── useDebounce.ts
├── services/                  # API 调用层
│   ├── user.ts
│   └── auth.ts
├── stores/                    # 全局状态
├── types/                     # 全局类型
├── utils/                     # 工具函数
└── constants/                 # 常量
```

每个目录附带说明为何这样组织（基于 SPEC 的哪部分推导）。

---

## 四、模块依赖图

两种模式都输出模块依赖关系图。**不做拓扑排序和实施顺序编排**——该职责归 `adfo-harness-runner`（读取此依赖图后生成实施顺序）。

### 输出格式

```
模块依赖图：
UserListPage
├── depends on → SearchBar, UserTable, Pagination
│   ├── SearchBar → useDebounce, Input
│   ├── UserTable → UserRow, useUserData
│   │   └── UserRow → Button, UserAvatar
│   └── Pagination → usePagination
└── 被依赖：AppRouter

循环依赖检测：{无 / 发现 X 处}
全局污染检测：{无 / 组件X 使用了全局样式/变量}

并行识别：
├── SearchBar 与 UserTable 无相互依赖 → 可并行开发
└── Pagination 依赖 Button → 需在 Button 之后
```

> `adfo-harness-runner` 读取此依赖图后，按拓扑排序生成分阶段实施顺序。

---

## 五、输出：architecture.md

### 产物位置

| 模式 | 输出路径 | 说明 |
|------|---------|------|
| 敏捷模式（直接调用） | `./architecture.md` 或用户指定 | 当前工作目录 |
| 工程模式（通过 harness） | `docs/workflows/{任务ID}/architecture.md` | 由编排器指定 |

### 文档模板

```markdown
---
phase: ARCHITECTURE
status: completed
qualityGate: pass
---

# {任务名} - 架构设计文档

## 1. 项目概况
- 项目类型：{已有项目 / 新项目}
- 分析范围：{文件数量、目录数}
- 技术栈：{检测结果}

## 2. 可复用模块清单（已有项目）
| 模块 | 类型 | 路径 | 复用价值 | 备注 |
|------|------|------|---------|------|

## 3. 文件层级蓝图
（目录树 + 组织说明）

## 4. 模块依赖图
（依赖关系 + 循环依赖检测 + 全局污染检测 + 并行识别）
> 实施顺序由 adfo-harness-runner 基于此依赖图生成

## 5. 架构建议
- 原子化改进建议
- 耦合解耦建议
- 命名规范统一建议

## 7. 风险与约束
- 架构层面的技术债
- 跨模块依赖风险
- 扩展性考量

## 8. 测试策略建议
> 架构设计完成后，建议调用 `adfa-edge-case-master` 为关键模块生成测试用例，覆盖：
> - 核心业务逻辑的边界条件
> - 模块间接口的异常场景
> - 数据流的性能边界

`adfa-edge-case-master` 可基于架构文档中的模块依赖图和接口定义，自动生成 P0-P2 优先级的测试矩阵。
```

---

## 六、约束规则

1. 不做代码实现——只做架构分析和规划
2. 不做内联逻辑提取——由 adfa-hooks-extractor 负责，本技能只盘点已有 Hooks
3. 不做拓扑排序和实施顺序——由 adfo-harness-runner 负责，本技能只输出依赖图
4. SubAgent 必须通过 `adfo-task-orchestrator` 并发调度，任务清单格式见执行机制
5. 已有项目分析以实际代码为准，不凭空假设
6. 新项目规划基于 SPEC 的页面架构、数据模型、路由
7. 原子化评级标准：单一职责 + Props 最小化 + 代码量 ≤ 200 行
8. 不确定的架构决策标注「待确认」
9. 架构设计完成后，推荐调用 `adfa-edge-case-master` 生成测试策略
10. **项目路径参数传递**：调用本技能时，若未明确指定项目路径，应主动询问用户或从上下文推断；已有项目分析模式下，项目路径为必需参数

---

## 模板注入

> 共享配置（技术栈、目录约定）由 `adfo-harness-runner/templates/custom.md` 统一管理。

`templates/custom.md` — 项目特定的架构规范（仅含架构特有配置）：

```markdown
# 架构设计规范

## 目录约定（已有项目自动检测，新项目用户指定）
- 原子组件：{如 src/components/ui/}
- 业务组件：{如 src/components/business/}
- 页面组件：{如 src/pages/}
- Hooks：{如 src/hooks/}
- Services：{如 src/services/}

## 命名约定
- 组件文件：{如 PascalCase/index.tsx}
- Hook 文件：{如 use{Name}.ts}
- Service 文件：{如 {domain}.ts}

## 原子化标准
- 单文件行数上限：{如 200}
- 单组件职责数上限：{如 1}
- Props 数量上限：{如 8}

## 禁止项
- {如：页面组件之间互相引用}
- {如：业务组件依赖其他业务模块}
```
