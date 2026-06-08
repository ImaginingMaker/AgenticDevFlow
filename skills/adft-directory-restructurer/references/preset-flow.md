# 规范预设模式（Preset Mode）详细流程

在 IMPLEMENT 阶段之前创建符合规范的目录骨架，供 `adfp-code-implementer` 写入代码。

---

## 核心流程

```
A1 读取输入 → A2 加载规则集 → A3 生成目录蓝图 → A4 创建目录骨架 → A5 规范校验 → A6 输出
```

---

## A1：读取输入

### 输入源

| 来源 | 读取内容 | 优先级 |
|------|---------|--------|
| `state.json.techStack`（工程模式） | 框架/平台/UI库/样式方案等 | 最高 |
| `architecture.md`（工程模式） | 文件层级蓝图、模块清单、依赖图 | 高 |
| 用户直接指定（敏捷模式） | 框架 + 模块列表 + 自定义规则 | 中 |

### 交互式询问模板

用户无输入时：

```
📁 目录结构预设向导

请提供以下信息以生成目录骨架：

1. 目标框架：React 18 / Vue 3 / 微信小程序 / Taro/uni-app / 其他
2. 模块清单（逗号分隔）：如 "用户管理, 订单管理, 首页, 通用组件"
3. 目录模式偏好：按层 / 按功能 / 原子化 / 自定义
4. 项目根目录（默认 src/）：

可跳过，使用默认值继续。
```

### architecture.md 解析规则

从 `architecture.md` 读取以下章节：

| 章节 | 提取内容 |
|------|---------|
| `## 文件层级` | 目录树结构、模块名称 |
| `## 模块依赖图` | 模块间依赖关系（用于确定目录分组） |
| `## 可复用清单` | 已知的公共模块（仅创建目录不创建文件） |

### 解析异常处理

| 情况 | 处理 |
|------|------|
| architecture.md 不存在 | 降级为敏捷模式，询问用户模块清单 |
| architecture.md 缺少「文件层级」章节 | 按 spec.md 的页面架构推断，或询问用户 |
| architecture.md 与新规则冲突 | 以规则引擎为准，标注「与 architecture.md 不一致项」 |

---

## A2：加载规则集

### 加载路径

1. 首先读取 `templates/custom.md` 中的规则引擎配置
2. 若用户指定了**自定义规则**（通过交互式或命令行参数），覆盖默认规则
3. 若既无模板配置也无自定义规则，使用内置默认规则

### 默认规则（规则引擎未配置时的 fallback）

```yaml
# 命名规则
component_dir_case: PascalCase    # 组件目录: Button, UserCard
non_component_dir_case: camelCase # 非组件目录: hooks, utils, services

# 类型隔离规则
type_isolation:
  components: [".tsx", ".jsx"]    # components/ 只放组件文件
  hooks: [".ts"]                  # hooks/ 只放 Hook
  services: [".ts", ".js"]        # services/ 只放 API 服务
  utils: [".ts", ".js"]           # utils/ 只放工具函数
  types: [".ts", ".d.ts"]         # types/ 只放类型定义
  stores: [".ts", ".js"]          # stores/ 只放状态管理

# 平级限制（硬约束）
flat_restriction:
  enabled: true
  protected_entry: "index.tsx"    # 被保护的入口文件名
  # ⛔ 违规示例: Button/index.tsx + Button/Button.tsx 平级
  # ✅ 正确: Button/index.tsx (仅 re-export)
  #          Button/Button/ (实现放在子目录)

# 深度限制
max_depth: 3                      # src/ 下最大嵌套深度
```

---

## A3：生成目录蓝图

### 步骤

#### 3.1 创建顶层目录

根据规则集创建顶层目录（可配置，默认清单）：

```
src/
├── components/     ← .tsx/.jsx 组件
├── hooks/          ← use*.ts 自定义 Hook
├── services/       ← API 调用层
├── stores/         ← 全局状态管理
├── utils/          ← 纯工具函数
├── types/          ← TypeScript 类型定义
├── styles/         ← 全局样式
├── assets/         ← 静态资源
└── pages/          ← 页面组件
```

#### 3.2 创建组件目录

```
src/components/
├── ui/             ← 通用 UI 组件（来自模块清单的通用组件）
│   ├── Button/
│   │   └── index.tsx
│   └── Input/
│       └── index.tsx
└── business/       ← 业务组件（来自模块清单的业务组件）
    ├── UserCard/
    │   └── index.tsx
    └── OrderList/
        └── index.tsx

src/pages/
├── LoginPage/
│   └── index.tsx
├── HomePage/
│   └── index.tsx
└── UserManage/
    └── index.tsx
```

#### 3.3 平级限制校验（硬约束）

对蓝图中每个目录执行平级检查：

```yaml
检查规则:
  - 如果目录下存在 index.tsx 或 index.ts
  - 则同目录下不得有其他非 index 的文件（非 index 的实现文件）
  - 实现文件应放在子目录中

✅ 正确的:
  Button/
    └── index.tsx           ← 仅 re-export
  ComplexComponent/
    ├── index.tsx           ← 仅 re-export
    └── ComplexComponent/   ← 实现子目录
        ├── Header.tsx
        ├── Body.tsx
        └── Footer.tsx

⛔ 错误的（将被标记违规并自动修正）:
  Button/
    ├── index.tsx           ← 入口
    └── Button.tsx          ← ⛔ 与 index 平级！（应移入 Button/ 子目录）
```

**违规处理方式**：

| 违规项 | 自动修正 |
|--------|---------|
| `Button/index.tsx` + `Button/Button.tsx` 平级 | 自动在蓝图中调整为 `Button/Button/Button.tsx` |
| `hooks/useAuth.ts` + `hooks/useUser.ts` 平级 | ✅ 允许（hooks 目录不适用平级限制） |
| `components/` 下混入 `.ts` 文件 | 移至 `utils/` 或 `types/` 对应目录 |

#### 3.4 类型隔离校验

```
检查规则:
  - components/ 下只允许 .tsx / .jsx 后缀文件
  - hooks/ 下只允许 use*.ts / use*.tsx 后缀文件
  - services/ 下只允许 .ts / .js 后缀文件

违规处理:
  - 类型文件 (.ts) 出现在 components/ → 移至 types/
  - 工具函数 (.ts) 出现在 components/ → 移至 utils/
  - 组件 (.tsx) 出现在 utils/ → 移至 components/
```

---

## A4：创建目录骨架

### 执行步骤

```bash
1. 在目标根目录（如 src/）下按蓝图创建空目录
2. 每个组件目录创建 index.tsx（骨架内容为空，post-matter 占位）
   但为确保 implementer 使用正确的目录位置，仅创建空目录不加文件
3. 叶目录放 .gitkeep（保持 Git 空目录追踪）
```

### 不生成的内容

- ❌ 不生成任何代码文件（类型定义、组件实现、工具函数等）
- ❌ 不修改已有的文件
- ❌ 不创建 `node_modules`、`.git` 等无关目录

---

## A5：规范校验

如果目标目录已有部分现有内容，执行合规检查：

| 检查项 | 方法 | 输出 |
|--------|------|------|
| 类型隔离 | 扫描 components/ 下是否有 .ts 文件 | 违规清单 |
| 平级限制 | 扫描 index.tsx 所在目录是否有非 index 平级文件 | 违规清单 |
| 命名规范 | 检查目录名是否符合 PascalCase/camelCase | 违规清单 |
| 深度限制 | 扫描 maxDepth 是否超限 | 违规清单 |

违规项记录到 `structure-plan.md` 中，标注：
- **建议处理**（非阻塞）：命名规范、深度限制
- **必须处理**（阻塞）：平级限制、类型隔离

---

## A6：输出结构计划

```markdown
---
phase: STRUCTURE_PLAN
status: completed
ruleSet: {默认/自定义规则集名称}
---

# 目录结构预设报告

## 基本信息
- 目标目录：{目标路径}
- 来源：{architecture.md / 用户指定模块 / 交互式}
- 规则集：{规则引擎配置描述}

## 目录树

```
src/
├── components/
│   ├── ui/
│   │   ├── Button/
│   │   │   └── index.tsx       ← 入口（仅 re-export）
│   │   │   └── Button/         ← 实现子目录
│   │   │       └── Button.tsx
│   │   └── Input/
│   │       └── index.tsx       ← 入口（仅 re-export）
│   │       └── Input/
│   │           └── Input.tsx
│   └── business/
│       └── UserCard/
│           └── index.tsx
│           └── UserCard/
│               └── UserCard.tsx
├── hooks/
│   └── useAuth.ts
├── services/
├── stores/
├── utils/
├── types/
├── styles/
├── assets/
└── pages/
    └── LoginPage/
        └── index.tsx
        └── LoginPage/
            └── LoginPage.tsx
```

## 已创建目录清单

| 目录路径 | 类型 | 状态 |
|---------|------|------|
| `src/components/ui/Button/` | 组件 | ✅ 新建 |
| `src/components/ui/Button/Button/` | 组件实现子目录 | ✅ 新建 |
| ... | ... | ... |

## 规则校验结果

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 命名规范 | ✅ 通过 | 组件目录 PascalCase，非组件目录 camelCase |
| 类型隔离 | ✅ 通过 | 各目录文件类型符合配置 |
| 平级限制 | ✅ 通过 | 无 index 与非 index 平级违规 |
| 深度限制 | ✅ 通过 | maxDepth=3，未超限 |

## 下一步建议

- 使用 `adfp-component-designer` 设计组件结构
- 使用 `adfp-code-implementer` 在目录骨架中写入代码
```

---

## 异常处理

| 异常场景 | 处理 |
|---------|------|
| 目标目录已存在文件 | 跳过已有冲突目录，仅创建不存在的目录。标注到报告中 |
| 目录创建失败（权限） | 报告错误，提示用户手动创建 |
| 蓝图生成后用户要求调整 | 支持用户修改蓝图中的特定目录路径，重新生成 |
| 无 modules 清单 | 仅创建顶层标准目录（components/hooks/services/utils/types/styles/assets/pages） |
