# adft-directory-restructurer - 双模式评估用例

## 核心场景

### Mode A：规范预设模式

| # | 场景 | 预期行为 | 验证方式 |
|---|------|---------|---------|
| A1 | 从 architecture.md 生成目录骨架 | 读取 architecture.md 的「文件层级」章节，应用规则引擎生成蓝图，创建对应目录结构 | 目录树与蓝图一致，平级限制规则已应用 |
| A2 | 用户指定模块清单 + 框架 | 根据 "用户管理,订单管理,通用组件" 创建 components/ui/ + components/business/ + pages/UserManage/ + pages/OrderManage/ 等目录 | 目录树完整，命名规则正确 |
| A3 | 平级限制校验 | index.tsx 所在目录中，非 index 文件自动移入 `{组件名}/` 子目录 | 蓝图中的 `Button/index.tsx` 和 `Button/Button.tsx` 不在同一层 |
| A4 | 类型隔离校验 | components/ 下不允许 .ts 文件存在，应移至 types/ 或 utils/ | 蓝图中的文件后缀符合类型隔离规则 |
| A5 | 交互式无参数触发 | 展示询问模板，收集团模块清单和框架 | 用户输入后正确生成目录骨架 |

### Mode B：审查模式

| # | 场景 | 预期行为 | 验证方式 |
|---|------|---------|---------|
| B1 | 单文件移动到新目录 | `src/api/user.ts` → `src/services/user.ts`，其他文件的 import 路径更新 | 文件存在性验证 + import 路径校验 |
| B2 | 批量目录重塑（按层模式） | 混合目录按规则分配到对应目录，所有跨文件引用更新 | 新旧目录树对比 + 全局引用扫描 |
| B3 | 平级限制违规检测 + 修复 | `Button/index.tsx` + `Button/Button.tsx` 平级 → 检测为违规 → 自动修正为 `Button/Button/Button.tsx` | B2 校验检出违规，映射表中包含修正项 |
| B4 | 类型隔离违规检测 + 修复 | `components/` 下混入 `utils.ts` → 检测为违规 → 建议移至 `utils/` | B2 校验检出违规，映射表中包含修正项 |
| B5 | 别名路径项目（tsconfig paths 含 @utils） | 文件移动后，别名引用保持不变或同步更新 tsconfig | tsconfig paths 检查 |
| B6 | 无变化项目（已符合规范） | 报告"无需变更"，不执行任何文件移动 | 文件列表 md5 对比无变化 |
| B7 | 用户自定义映射规则 | "把 helpers/ 归入 utils/, api/ 归入 services/" 覆盖默认映射 | 映射表检验 |
| B8 | 命名规范检测 | `hooks/` 目录名为 `Hooks` → 标记违规，建议改为 `hooks/` | B2 规范校验输出包含命名违规项 |

## 边界测试

| # | 边界情况 | 预期处理 |
|---|---------|---------|
| 1 | Preset：目标目录已存在部分内容 | 跳过已有冲突目录，仅创建不存在的目录。报告标注 |
| 2 | Preset：architecture.md 不存在 | 降级为敏捷模式，询问用户模块清单 |
| 3 | Preset：无模块清单 | 仅创建顶层标准目录（components/hooks/services/utils/types/styles/assets/pages） |
| 4 | Review：目标目录不存在 | 提示目录不存在，列出当前项目可用目录 |
| 5 | Review：重名文件冲突 | 检测冲突并提示用户选择：保留两者 / 合并 / 重命名 |
| 6 | Review：跨仓库引用 | 不做 reference 更新，记录到报告 ⚠️ 项 |
| 7 | Review：循环依赖 | 不影响文件移动（只变路径不变内容），引用路径正确解析 |
| 8 | Review：目标目录是空目录或只有无关文件 | 报告"无明显可优化项"，询问用户是否继续 |
| 9 | Review：用户指定了不存在的目录 | 提示目录不存在，列出当前项目可用目录 |
| 10 | Review：项目没有 package.json | 询问确认是否为前端项目，若不是则建议中止 |
| 11 | Review：入口文件（package.json main 配置）被匹配到移动规则 | 不自动移动入口文件，标注为 protected 并询问用户 |
| 12 | Review：平级限制例外路径（pages/） | pages/ 下 index.tsx 与子目录平级不标记违规 |
| 13 | 规则引擎：未配置 templates/custom.md | 使用内置默认规则 fallback |
| 14 | 规则引擎：部分配置缺失 | 仅缺失部分使用默认值，已配置部分正常生效 |

## 集成测试

| # | 上下游技能 | 集成点 | 预期 |
|---|----------|--------|------|
| 1 | adfp-architecture-designer → Preset Mode | architecture.md 文件层级蓝图作为 Preset 模式的输入 | Preset 读取 architecture.md 生成目录骨架 |
| 2 | adfo-harness-runner → Preset Mode | IMPLEMENT 阶段前置调用 Preset 模式创建目录骨架 | 编排器在 IMPLEMENT 前安排目录创建 |
| 3 | Preset Mode → adfp-code-implementer | implementer 在已创建的目录骨架中写入代码 | 目录结构已就绪，implementer 直接写入 |
| 4 | Review Mode → adft-smart-commit | 目录重塑完成后建议提交 | 报告末尾推荐使用 smart-commit |
| 5 | Review Mode → adfp-code-reviewer | 目录重塑后建议代码审查 | 报告末尾推荐运行 code-reviewer |

## 测试数据要求

### Preset 模式测试夹具

测试验证需要以下输入数据：

```
# 输入：architecture.md 的「文件层级」章节（模拟）
## 文件层级
- 模块：LoginPage（页面）
- 模块：UserList（页面）
- 模块：UserCard（业务组件）
- 模块：Button（通用 UI 组件）
- 模块：Input（通用 UI 组件）

# 预期输出目录树
src/
├── components/
│   ├── ui/
│   │   ├── Button/
│   │   │   └── index.tsx
│   │   │   └── Button/
│   │   │       └── Button.tsx
│   │   └── Input/
│   │       └── index.tsx
│   │       └── Input/
│   │           └── Input.tsx
│   └── business/
│       └── UserCard/
│           └── index.tsx
│           └── UserCard/
│               └── UserCard.tsx
├── hooks/
├── services/
├── stores/
├── utils/
├── types/
├── styles/
├── assets/
└── pages/
    ├── LoginPage/
    │   └── index.tsx
    │   └── LoginPage/
    │       └── LoginPage.tsx
    └── UserList/
        └── index.tsx
        └── UserList/
            └── UserList.tsx
```

### Review 模式测试夹具（平级限制违规）

```typescript
// fixtures/flat-violation/src/
// 模拟一个存在平级限制违规的项目

src/
├── components/
│   └── Button/
│       ├── index.tsx       ← 入口
│       ├── Button.tsx      ← ⛔ 违规：与 index 平级
│       ├── Button.test.tsx ← ⛔ 违规：与 index 平级
│       └── types.ts        ← ⛔ 违规：与 index 平级 + 类型隔离
└── hooks/
    ├── useAuth.ts
    └── Hooks.tsx           ← 🟡 警告：命名不规范（非 use 前缀）
```

预期修正：

```
src/
├── components/
│   └── Button/
│       ├── index.tsx       ← 保留
│       └── Button/         ← 新增子目录
│           ├── Button.tsx
│           ├── test.tsx
│           └── types.ts
├── hooks/
│   ├── useAuth.ts
│   └── Hooks.tsx           ← 🟡 标记为警告（需用户确认）
└── types/
    └── ButtonTypes.ts      ← Button/types.ts 移入（类型隔离修正）
```

### Review 模式测试夹具（旧式混合目录）

```
test-fixture/
├── src/
│   ├── api/
│   │   └── user.ts          # 应 → services/user.ts
│   ├── common/
│   │   ├── Header.tsx       # 应 → components/ui/Header/index.tsx
│   │   └── Button.tsx       # 应 → components/ui/Button/index.tsx
│   ├── pages/
│   │   ├── index.tsx
│   │   └── about.tsx
│   ├── hooks/
│   │   └── useAuth.ts
│   ├── utils/
│   │   ├── format.ts
│   │   └── helpers.ts
│   ├── styles/
│   │   └── global.css
│   ├── config.ts            # 应 → constants/config.ts
│   └── types.ts             # 应 → types/index.ts
├── tsconfig.json
└── package.json
```

### 引用关系测试数据

```typescript
// src/pages/index.tsx
import { fetchUsers } from '../api/user';           // 应更新为 '../services/user'
import Header from '../common/Header';               // 应更新为 '../components/ui/Header'
import { useAuth } from '../hooks/useAuth';          // 保持不变
import { formatDate } from '../utils/format';        // 保持不变
import '../styles/global.css';                        // 保持不变

// src/common/Header.tsx
import Button from './Button';                        // 引用路径不变（同级移动）
```
