---
name: adft-directory-restructurer
description: |
  前端目录结构重塑专家。按前端最佳实践（按层/按功能/原子化设计）自动重组杂乱目录结构，并同步更新所有文件的 import/require 路径引用。不修改任何业务逻辑，仅做物理文件移动和引用路径修正。

  TRIGGER when: 用户说"目录重塑"、"目录整理"、"重组目录"、"restructure directory"、"重新组织文件结构"、"整理项目目录"、"目录太乱了"、"梳理目录结构"、"reorganize files"、"目录重构"。

  Use proactively when: 用户表示项目目录混乱、文件散落各处、需要按规范组织前端项目结构、或在代码审查/架构审查后发现目录结构问题。
---

# 前端目录结构重塑专家

扫描杂乱的目录，按前端最佳实践推荐目录结构，自动执行文件移动并修正所有跨文件引用路径。

---

## 核心流程

```
扫描 → 分析 → 推荐方案 → 用户确认 → 执行重塑 → 更新引用 → 验证 → 输出报告
```

### 流程详解

#### Phase 1: 目录扫描与依赖映射

扫描目标目录，构建完整的依赖关系图：

| 步骤 | 动作 | 说明 |
|------|------|------|
| 1.1 | 递归扫描文件 | 读取目录下所有文件（排除 node_modules、dist、.git） |
| 1.2 | 解析导入关系 | 提取所有 import/require/dynamic import 语句 |
| 1.3 | 构建依赖图 | 文件→文件引用映射，标注哪些文件被引用、被哪些文件引用 |
| 1.4 | 检测配置引用 | 扫描 tsconfig.json（paths/compilerOptions）、webpack/vite 配置中的别名映射 |
| 1.5 | 识别入口文件 | 检测 package.json 的 main/module/browser 字段，以及路由配置文件 |

#### Phase 2: 结构分析与推荐方案

基于前端最佳实践，推荐目标目录结构：

**内置规范模式（前 3 种用户可选，第 4 种由用户自定义）：**

| 模式 | 适用场景 | 核心原则 |
|------|---------|---------|
| **按层(Layer-based)** | 中小型项目 | `components/`, `pages/`, `hooks/`, `services/`, `utils/`, `types/`, `constants/` |
| **按功能(Feature-based)** | 中大型项目 | 每个功能模块自包含：`features/auth/`, `features/dashboard/` |
| **原子化(Atomic)** | 组件库/UI 项目 | `atoms/`, `molecules/`, `organisms/`, `templates/` |
| **自定义** | 有特殊规范的项目 | 用户提供目录映射规则 |

**按层模式推荐结构：**

```
src/
├── components/          # 通用 UI 组件
│   ├── ui/             # 基础 UI 组件（Button, Input, Modal...）
│   └── business/       # 业务组件（UserCard, SearchBar...）
├── pages/              # 页面级组件（每个页面一个目录）
├── hooks/              # 自定义 Hooks
├── services/           # API 调用层
├── stores/             # 全局状态管理
├── types/              # 全局 TypeScript 类型定义
├── utils/              # 工具函数
├── constants/          # 常量定义
├── styles/             # 全局样式
└── assets/             # 静态资源（图片、字体）
```

**按功能模式推荐结构：**

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
│   ├── components/     # 通用 UI 组件
│   ├── hooks/
│   ├── utils/
│   └── types/
├── app/               # 应用配置（路由、布局）
└── assets/
```

#### Phase 3: 生成映射表

生成旧路径 → 新路径的映射关系：

```json
{
  "oldPath": "src/utils/helpers.ts",
  "newPath": "src/utils/helpers.ts",
  "reason": "已符合规范，保持不变"
},
{
  "oldPath": "src/api/user.ts",
  "newPath": "src/services/user.ts",
  "reason": "API 调用层应归入 services/"
},
{
  "oldPath": "src/common/Header.tsx",
  "newPath": "src/components/ui/Header/index.tsx",
  "reason": "通用 UI 组件归入 components/ui/"
}
```

#### Phase 4: 用户确认（安全网）

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

#### Phase 5: 执行重塑

```
1. 创建目标目录结构
2. 按映射表移动文件（先复制后删除，保证安全）
3. 更新所有引用路径
```

**引用更新规则：**

| 引用类型 | 匹配方式 | 处理方式 |
|---------|---------|---------|
| 相对路径 import | `import X from '../old/path'` | 重新计算相对路径 |
| 别名路径 import | `import X from '@utils/xxx'` | 更新文件路径；如果别名映射也需更新则同步修改 tsconfig |
| CSS/SASS import | `@import './old/path'` | 重新计算相对路径 |
| dynamic import | `const X = import('./old/path')` | 同上 |
| require() | `const X = require('./old/path')` | 同上 |
| barrel export | `export * from './old/path'` | 更新索引文件中的导出路径 |
| 资源引用 | `<img src="./old/asset.png">` | 重新计算相对路径 |

**别名更新规则：**
- 若 tsconfig.json 的 `paths` 配置了别名（如 `@utils/*`），且新目录结构需要调整别名映射，同步更新 tsconfig.json
- 若别名映射无需变更（文件结构变化在别名解析范围内），则仅更新文件中的相对引用

#### Phase 6: 验证

验证重塑结果：

| 验证项 | 方法 | 通过标准 |
|--------|------|---------|
| 文件完整性 | 新旧文件 md5 对比 | 100% 匹配 |
| 无未解析引用 | 正则扫描 `from './xxx'`、`from '../xxx'` 残留 | 无残留旧路径 |
| 别名同步 | tsconfig paths 检查 | 配置与实际目录一致 |
| 构建验证 | `tsc --noEmit`、`npx vite build` 等（可选建议） | 无报错 |
| Git 对比 | `git diff --stat` | 仅文件路径变化，无内容变化 |

#### Phase 7: 输出报告

```markdown
# 目录重塑报告

## 概览
- 目标目录：{项目路径}/src
- 应用模式：{按层/按功能/原子化/自定义}
- 移动文件：{N} 个
- 更新引用：{M} 处（涉及 {K} 个文件）
- 修改配置：{L} 个

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
| 构建编译 | ⚠️ 建议运行 tsc --noEmit |
| Git diff | ✅ 仅文件路径+引用变更 |

## 注意事项
- ⚠️ 文件 {xxx.ts} 被多个模块引用，请关注后续改动
- ℹ️ 建议运行全量测试验证功能完整性
```

---

## 使用方式

```bash
# 快速启动
"目录重塑"    → 交互式引导，询问目标目录和模式偏好

# 指定目录 + 模式
"把 src/ 按功能模块重组"
"将 src/utils 目录按原子化整理"

# 仅生成计划不执行
"目录塑造预览 — 只生成计划"

# 自定义模式
"把 helpers/ 归入 utils/, api/ 归入 services/"
```

### 交互式流程

```
用户触发 → 询问目标目录
         → 询问规范模式（按层/按功能/原子化/自定义）
         → 扫描分析 + 生成映射表
         → 展示影响分析 → 用户确认
         → 执行重建 / 仅输出计划 / 用户调整后执行
         → 输出报告
```

### 非交互式（用户明确提供参数）

```
"按层模式重塑 /Users/me/project/src，确认执行"
→ 跳过询问，直接扫描→分析→执行→报告
```

---

## 约束规则

1. **不修改业务逻辑** — 仅移动文件和更新引用路径。代码内容保持不变（除 import 路径外）
2. **安全第一** — 执行前必须展示影响分析并等待用户确认；支持 `--dry-run`（仅输出计划）
3. **先复制后删除** — 文件移动采用 copy → verify → delete 模式，降低数据丢失风险
4. **非侵入** — 不修改 node_modules、dist、.git 等无关目录
5. **全引用覆盖** — 必须处理相对路径、别名、CSS import、dynamic import、require、barrel export、资源引用
6. **别名相关** — tsconfig.json paths 和构建工具 resolve.alias 需同步更新（若结构变化涉及别名映射）
7. **入口文件保护** — package.json main/module/browser、路由入口文件不得默认移动，除非用户明确指定
8. **可回滚** — 若用户通过 Git 管理，建议先提交当前状态，再执行重塑
9. **按层/按功能/原子化**三种模式为内置标准模式，用户也可提供自定义映射规则
10. **目标目录验证** — 执行前检测目标目录是否存在 `package.json`，若不存在则询问确认（可能是非前端项目）

---

## 职责边界

### 与相关技能的区分

| 技能 | 关系 | 区分 |
|------|------|------|
| `adfp-architecture-designer` | 互补 | architecture 输出**文件层级蓝图**（纸上规划），本技能**物理执行**目录重组和引用修正 |
| `adfa-refactor-advisor` | 互补 | refactor 重组**代码内部结构**（组件/逻辑重组），本技能重组**文件物理位置**（目录结构重组）|
| `adfp-code-implementer` | 无关 | implementer 生成新代码，本技能重塑已有目录结构 |
| `adft-smart-commit` | 建议下游 | 目录重塑完成后，建议使用 smart-commit 组织提交 |

### 边界说明

```
adfa-refactor-advisor: "这段代码太乱了，需要结构重构"
    → 重组组件内部逻辑、拆分文件内容
adft-directory-restructurer: "项目目录太乱了，需要整理"
    → 重组文件物理位置、目录层级、更新引用路径

adfp-architecture-designer: "帮我规划新项目的文件结构"
    → 新项目/新功能模块的结构设计
adft-directory-restructurer: "帮我整理现有目录"
    → 已有代码的目录结构调整与引用同步
```

---

## 模板注入

> 本技能为独立工具（adft-），不接入 adfo-harness-runner 的流水线共享配置。

`templates/custom.md` — 本技能特有的目录结构映射规则、忽略模式、别名配置偏好

## 测试用例

详见 `test/evals.md`。

### 测试场景概览

| 场景 | 验证点 |
|------|--------|
| 单文件移动到新目录 | 引用路径是否正确更新 |
| 批量目录重组（按层模式） | 所有引用是否一致更新 |
| 别名路径项目（@utils 等） | tsconfig 别名是否同步更新 |
| 无变化项目（已符合规范） | 报告无变更 |
| CSS/资源引用 | 非 TS 引用是否正确处理 |
| 跨目录循环依赖 | 重塑后引用是否仍正确 |
| 自定义映射模式 | 用户规则是否能覆盖默认 |
