# 规则引擎配置

两个模式（Preset + Review）共用此规则集。所有规则均可自定义。

---

## 命名规则

```yaml
# 组件目录命名规范
component_dir_case: PascalCase  # PascalCase | camelCase | kebab-case

# 非组件目录命名规范
non_component_dir_case: camelCase  # PascalCase | camelCase | kebab-case

# Hook 文件前缀
hook_prefix: "use"  # 检测 Hook 文件的前缀

# 目录名转换例外（不走通用规则的路径）
naming_exceptions:
  - path: "src/assets"
    case: null  # 保持原样
  - path: "src/styles"
    case: null
```

---

## 类型隔离规则

定义每个目录类型允许的文件后缀（白名单模式）：

```yaml
type_isolation:
  # 组件目录：只放 .tsx / .jsx 组件文件
  components:
    allowed_extensions: [".tsx", ".jsx"]
    match_patterns:
      - "src/components/**"
      - "src/pages/**"

  # Hook 目录：只放 use*.ts / use*.tsx
  hooks:
    allowed_extensions: [".ts", ".tsx"]
    file_pattern: "use*"  # 文件必须 use 前缀
    match_patterns:
      - "src/hooks/**"

  # API 服务目录：只放 .ts / .js
  services:
    allowed_extensions: [".ts", ".js"]
    match_patterns:
      - "src/services/**"
      - "src/api/**"

  # 工具函数目录：只放 .ts / .js（不含组件和 Hook）
  utils:
    allowed_extensions: [".ts", ".js"]
    match_patterns:
      - "src/utils/**"
      - "src/lib/**"
      - "src/helpers/**"

  # 类型定义目录：只放 .ts / .d.ts
  types:
    allowed_extensions: [".ts", ".d.ts"]
    match_patterns:
      - "src/types/**"
      - "src/interfaces/**"

  # 状态管理目录：只放 .ts / .js
  stores:
    allowed_extensions: [".ts", ".js"]
    match_patterns:
      - "src/stores/**"
      - "src/store/**"
      - "src/state/**"

# 不强制类型隔离的目录（白名单）
type_isolation_exclude:
  - "src/assets/**"
  - "src/styles/**"
  - "src/constants/**"  # 常量为 .ts 文件，不做强制隔离
```

---

## 平级限制规则

```yaml
flat_restriction:
  # 是否启用平级限制
  enabled: true

  # 被保护的入口文件名
  protected_entry: "index.tsx"
  # 也可额外保护
  additional_protected: ["index.ts"]

  # 例外路径（不受平级限制约束）
  exclude_paths:
    - "src/pages/**"        # Next.js 页面模式
    - "src/app/**"          # Next.js App Router
    - "src/features/**/index.ts"  # 按功能模式的索引文件
  
  # 违规时自动修正策略
  auto_fix_strategy:
    # move_to_subdir: 将非 index 文件移入 {entry_name}/ 子目录
    # flatten_to_parent: 将 index 提升到父目录（不推荐）
    # ask_user: 询问用户（默认）
    default: "move_to_subdir"
  ```

---

## 深度限制规则

```yaml
depth_restriction:
  # 是否启用深度限制
  enabled: true

  # 根目录（相对于检测起点）
  root: "src"

  # 最大嵌套深度（不含 root）
  max_depth: 3

  # 检测时排除的路径
  exclude_paths:
    - "src/assets/**"       # 静态资源嵌套可能较深
    - "src/styles/**"       # 样式文件嵌套可能较深
```

---

## 忽略模式

```yaml
ignore_patterns:
  # 始终忽略
  - "node_modules/**"
  - ".git/**"
  - "dist/**"
  - "build/**"
  - ".next/**"
  - "coverage/**"
  - ".turbo/**"
  - "*.generated.*"

  # 默认忽略（用户可覆盖）
  - "test/**/fixtures/**"
  - "**/__mocks__/**"
  - "**/__tests__/**"    # 测试文件跟随源文件移动，不额外移动

  # 配置文件不自动移动
  - "*.config.*"
  - ".eslintrc*"
  - ".prettierrc*"
  - "tsconfig*.json"
  - "package.json"
  - "vite.config.*"
  - "next.config.*"
  - "tailwind.config.*"
  - "postcss.config.*"
```

---

## 执行偏好

```yaml
execution_preferences:
  # Preset 模式
  preset:
    # 默认目标目录
    default_target: "src"
    # 创建目录时是否同时创建 index.tsx 骨架
    create_entry_stubs: false  # false = 只创建空目录 + .gitkeep

  # Review 模式
  review:
    # 文件移动策略：copy_delete / git_mv / dry_run
    move_strategy: "copy_delete"
    # 是否启用备份
    backup_enabled: true
    backup_dir: ".restructure-backup"
    # 引用更新范围
    reference_scope: "project"  # project / changed_only / manual
    # 默认映射模式（用户未指定时）
    default_mode: "layer"
    # 入口文件保护
    protected_paths:
      - "src/App.tsx"
      - "src/main.tsx"
      - "src/index.ts"
      - "src/router.tsx"
      - "pages/**"  # Next.js pages
      - "app/**"    # Next.js App Router
```

---

## 别名配置偏好

```yaml
alias_preferences:
  tsconfig_paths:
    - alias: "@"
      target: "src/"
    - alias: "@components"
      target: "src/components/"
    - alias: "@utils"
      target: "src/utils/"
    - alias: "@hooks"
      target: "src/hooks/"
    - alias: "@services"
      target: "src/services/"
    - alias: "@types"
      target: "src/types/"
    - alias: "@constants"
      target: "src/constants/"

  # 构建工具 resolve.alias
  build_alias_resolution:
    - alias: "@components"
      target: "src/components/"
    - alias: "@utils"
      target: "src/utils/"
```
