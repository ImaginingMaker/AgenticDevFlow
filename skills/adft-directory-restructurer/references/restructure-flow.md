# 审查模式（Review Mode）详细流程

扫描现有目录检测违规项，按规则执行目录重塑并更新所有引用路径。

---

## 核心流程

```
B1 扫描与分析 → B2 规范校验 → B3 生成映射表 → B4 用户确认 → B5 执行重塑 → B6 验证 → B7 输出
```

---

## B1：目录扫描与依赖映射

扫描目标目录，构建完整的依赖关系图：

| 步骤 | 动作 | 说明 |
|------|------|------|
| 1.1 | 递归扫描文件 | 读取目录下所有文件（排除 node_modules、dist、.git） |
| 1.2 | 解析导入关系 | 提取所有 import/require/dynamic import 语句 |
| 1.3 | 构建依赖图 | 文件→文件引用映射，标注哪些文件被引用、被哪些文件引用 |
| 1.4 | 检测配置引用 | 扫描 tsconfig.json（paths/compilerOptions）、webpack/vite 配置中的别名映射 |
| 1.5 | 识别入口文件 | 检测 package.json 的 main/module/browser 字段，以及路由配置文件 |

---

## B2：规范校验

应用规则引擎 4 维度检查，输出违规清单。

### B2.1 规则引擎加载

与 Preset 模式共用同一套规则配置（详见 `templates/custom.md`）。加载路径：

1. 读取 `templates/custom.md` 规则引擎配置
2. 用户指定自定义规则（如有）覆盖默认
3. 无配置时使用内置默认规则

### B2.2 四维度检查

#### 维度 1：命名规则检查

| 检查项 | 规则 | 示例 |
|--------|------|------|
| 组件目录命名 | PascalCase | ✅ `Button` / `UserCard` ⛔ `button` / `user-card` |
| 非组件目录命名 | camelCase | ✅ `hooks` / `utils` / `useAuth` ⛔ `Hooks` / `Utils` |
| Hook 文件命名 | `use` 前缀 | ✅ `useAuth.ts` ⛔ `auth.ts` |

#### 维度 2：类型隔离检查

扫描每个顶层目录的文件后缀，判断是否有混入：

| 目录 | 允许文件类型 | 违规示例 |
|------|------------|---------|
| `components/` 及子目录 | `.tsx` / `.jsx` | 出现 `.ts` 文件（应移至 `types/` 或 `utils/`） |
| `hooks/` 及子目录 | `.ts` / `.tsx`（use 前缀） | 出现 `Button.tsx`（应移至 `components/`） |
| `services/` 及子目录 | `.ts` / `.js` | 出现 `.tsx` 文件（应移至 `components/`） |
| `utils/` 及子目录 | `.ts` / `.js` | 出现 `.tsx` 文件（应移至 `components/`） |
| `types/` 及子目录 | `.ts` / `.d.ts` | 出现 `.tsx` 文件（应移至 `components/`） |
| `stores/` 及子目录 | `.ts` / `.js` | 出现 `.tsx` 文件（应移至 `components/`） |

#### 维度 3：平级限制检查（硬约束）

检查每个目录下 `index.tsx` 是否与非 index 的文件平级：

```
检查算法:
  对每个目录 d:
    如果 d 包含 index.tsx（或 index.ts）:
      列出同目录下所有非 index 文件 f
      如果 f 存在 → 标记违规
      
违规示例:
  Button/
    ├── index.tsx         ← 入口
    ├── Button.tsx        ← ⛔ 违规！与 index 平级
    ├── Button.test.tsx   ← ⛔ 违规！与 index 平级（测试也放子目录）
    └── types.ts          ← ⛔ 违规！与 index 平级

推荐修正:
  Button/
    ├── index.tsx         ← 仅 re-export
    └── Button/           ← 实现子目录
        ├── Button.tsx
        ├── test.tsx
        └── types.ts
```

**例外规则**：

| 例外 | 说明 |
|------|------|
| `pages/` 下页面目录 | `pages/LoginPage/index.tsx` + `pages/LoginPage/` 子目录 → 允许（按 Next.js 约定） |
| 用户自定义例外路径 | 在 `templates/custom.md` 中配置 `flatRestriction.excludePaths` |

#### 维度 4：深度限制检查

| 规则 | 说明 |
|------|------|
| `src/` 下最大嵌套 | ≤ 3 层（不含 `src/`） |
| 组件目录深度 | ≤ 2 层（`components/{组件名}/{子文件}`） |

### B2.3 违规等级

| 等级 | 含义 | 影响 |
|------|------|------|
| 🔴 阻塞 | 平级限制 / 类型隔离违规 | 必须处理，否则影响代码可维护性 |
| 🟡 警告 | 命名不规范 / 深度超限 | 建议处理，不影响基本功能 |
| 🔵 提示 | 非硬性约束但可优化 | 可选优化项 |

### B2.4 违规输出格式

```markdown
## B2 规范校验结果

### 🔴 阻塞项
| # | 维度 | 路径 | 问题 | 严重度 |
|---|------|------|------|--------|
| 1 | 平级限制 | `components/Button/` | index.tsx 与 Button.tsx 平级 | 🔴 |
| 2 | 类型隔离 | `components/` | 发现 .ts 文件 utils.ts → 应移至 utils/ | 🔴 |

### 🟡 警告
| # | 维度 | 路径 | 问题 | 严重度 |
|---|------|------|------|--------|
| 3 | 命名规范 | `hooks/` | 目录名 Hooks → 应是 camelCase hooks/ | 🟡 |
| 4 | 深度限制 | `src/features/auth/components/ui/Button/` | 嵌套深度 4 > maxDepth 3 | 🟡 |
```

---

## B3：生成映射表

基于规则引擎和用户选择的规范模式（按层/按功能/原子化/自定义），生成旧路径→新路径映射表。

```json
{
  "oldPath": "src/utils/helpers.ts",
  "newPath": "src/utils/helpers.ts",
  "reason": "已符合规范，保持不变",
  "violation": null
},
{
  "oldPath": "src/api/user.ts",
  "newPath": "src/services/user.ts",
  "reason": "API 调用层应归入 services/",
  "violation": "类型隔离"
},
{
  "oldPath": "src/common/Header.tsx",
  "newPath": "src/components/ui/Header/index.tsx",
  "reason": "通用 UI 组件归入 components/ui/",
  "violation": null
},
{
  "oldPath": "src/components/Button/Button.tsx",
  "newPath": "src/components/ui/Button/Button/Button.tsx",
  "reason": "平级限制：Button.tsx 与 index.tsx 不应平级",
  "violation": "平级限制"
}
```

### 映射生成规则

| 违规类型 | 修正规则 |
|---------|---------|
| 平级限制违规 | 创建 `{目录名}/{目录名}/` 子目录，将实现文件移入 |
| 类型隔离违规 | 按文件后缀映射到对应顶层目录（.ts→types/ | utils/ | services/） |
| 命名违规 | 重命名（PascalCase / camelCase 转换） |
| 深度超限 | 展平嵌套，将叶子文件提升到上限层 |

### 内置规范模式（完整目录树）

#### 按层模式（Layer-based）

```
src/
├── components/          # 通用 UI 组件
│   ├── ui/             # 基础 UI 组件
│   └── business/       # 业务组件
├── pages/              # 页面级组件
├── hooks/              # 自定义 Hooks
├── services/           # API 调用层
├── stores/             # 全局状态管理
├── types/              # TypeScript 类型定义
├── utils/              # 工具函数
├── constants/          # 常量定义
├── styles/             # 全局样式
└── assets/             # 静态资源
```

#### 按功能模式（Feature-based）

```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── index.ts
│   └── dashboard/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── types/
│       └── index.ts
├── shared/             # 跨功能共享
├── app/                # 应用配置
└── assets/
```

---

## B4：用户确认

执行操作前，展示完整的影响分析并请求用户确认：

| 维度 | 显示内容 |
|------|---------|
| 文件移动 | 总数 + 按类型分类 |
| 引用更新 | 总数 + 涉及文件数 |
| 配置修改 | tsconfig.json、package.json、vite.config.ts 等 |
| 风险标签 | 高风险项标注（如循环引用、重名文件、非标准引用） |

**用户选项：**

- `[确认]` — 执行完整重塑
- `[预览+调整]` — 先查看完整映射，可手动调整特定文件路径
- `[取消]` — 终止操作
- `[仅生成计划]` — 仅输出 `restructure-plan.md` 不执行

默认行为：询问用户确认后再执行。

---

## B5：执行重塑

```
1. 创建目标目录结构
2. 按映射表移动文件（先复制后删除，保证安全）
3. 更新所有引用路径
```

### 引用更新规则

| 引用类型 | 匹配方式 | 处理方式 |
|---------|---------|---------|
| 相对路径 import | `import X from '../old/path'` | 重新计算相对路径 |
| 别名路径 import | `import X from '@utils/xxx'` | 更新文件路径；如果别名映射也需更新则同步修改 tsconfig |
| CSS/SASS import | `@import './old/path'` | 重新计算相对路径 |
| dynamic import | `const X = import('./old/path')` | 同上 |
| require() | `const X = require('./old/path')` | 同上 |
| barrel export | `export * from './old/path'` | 更新索引文件中的导出路径 |
| 资源引用 | `<img src="./old/asset.png">` | 重新计算相对路径 |

### 别名更新规则

- 若 tsconfig.json 的 `paths` 配置了别名，且新目录结构需要调整别名映射，同步更新 tsconfig.json
- 若别名映射无需变更，则仅更新文件中的相对引用

---

## B6：验证

| 验证项 | 方法 | 通过标准 |
|--------|------|---------|
| 文件完整性 | 新旧文件 md5 对比 | 100% 匹配 |
| 无未解析引用 | 正则扫描 `from './xxx'`、`from '../xxx'` 残留 | 无残留旧路径 |
| 别名同步 | tsconfig paths 检查 | 配置与实际目录一致 |
| 构建验证 | `tsc --noEmit`、`npx vite build` 等（可选建议） | 无报错 |
| Git 对比 | `git diff --stat` | 仅文件路径变化，无内容变化 |

---

## B7：输出报告

```markdown
---
phase: RESTRUCTURE_REVIEW
status: completed
---

# 目录重塑报告

## 概览
- 目标目录：{项目路径}/src
- 应用模式：{按层/按功能/原子化/自定义}
- 规则集：{默认/自定义}
- 移动文件：{N} 个
- 更新引用：{M} 处（涉及 {K} 个文件）
- 修改配置：{L} 个

## 规范校验
| 维度 | 结果 | 违规项 |
|------|------|--------|
| 命名规范 | ✅ 通过 | - |
| 类型隔离 | ✅ 通过 | - |
| 平级限制 | ⚠️ 已修复 2 处 | 见映射表 |
| 深度限制 | ✅ 通过 | - |

## 结构对比

### 重塑前
```
（原目录树）
```

### 重塑后
```
（新目录树）
```

## 映射明细
| 旧路径 | 新路径 | 原因 |
|--------|--------|------|
| ... | ... | ... |

## 引用更新明细（按文件分组）
### src/pages/Home.tsx
- `'../api/user'` → `'../services/user'`
- `'../../common/Header'` → `'../components/ui/Header'`

## 配置变更
- tsconfig.json：paths 别名「@api」→「@services」
- vite.config.ts：resolve.alias 同步更新

## 验证结果
| 检查项 | 结果 |
|--------|------|
| 文件完整性 | ✅ 通过 |
| 无残留旧引用 | ✅ 通过 |
| 别名同步 | ✅ 通过 |
| 构建编译 | ⚠️ 建议运行 tsc --noEmit |
| Git diff | ✅ 仅文件路径+引用变更 |

## 注意事项
- ⚠️ 文件 {xxx.ts} 被多个模块引用，请关注后续改动
- ℹ️ 建议运行全量测试验证功能完整性
- ℹ️ 建议使用 `adft-smart-commit` 组织提交
```

## 异常处理

| 异常场景 | 处理 |
|---------|------|
| 目标目录不存在 | 提示目录不存在，列出当前项目可用目录 |
| 重名文件冲突 | 检测冲突并提示用户选择：保留两者 / 合并 / 重命名 |
| 跨仓库引用 | 不做 reference 更新，记录到报告 ⚠️ 项 |
| 循环依赖 | 不影响文件移动（只变路径不变内容），引用路径正确解析 |
| 入口文件被匹配到移动规则 | 不自动移动，标注为 protected 并询问用户 |
| 项目没有 package.json | 询问确认是否为前端项目，若不是则建议中止 |
