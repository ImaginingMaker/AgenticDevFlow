# adft-directory-restructurer 特有配置

## 目录结构映射规则

### 内置模式（用户可选）

```yaml
# 按层模式映射规则（Layer-based）
layer_based_mappings:
  default_source_path: "src"

  # 目录判别规则：文件名/路径模式 → 目标目录
  rules:
    # 页面组件
    - patterns:
        - "**/Page.tsx"
        - "**/pages/**/*.tsx"
        - "**/views/**/*.tsx"
      target: "pages/{originalDir}/index.tsx"
      reason: "页面组件应归入 pages/"

    # 通用 UI 组件
    - patterns:
        - "**/Button/**"
        - "**/Input/**"
        - "**/Modal/**"
        - "**/ui/**/*.tsx"
        - "**/components/**/base/**"
        - "**/common/**/*.tsx"
        - "**/components/**/[A-Z]*.tsx"  # PascalCase 文件，可能是组件
      target: "components/ui/{originalName}"
      reason: "通用 UI 组件归入 components/ui/"

    # 业务组件
    - patterns:
        - "**/Card/**"
        - "**/Table/**"
        - "**/business/**"
        - "**/components/**/feature/**"
        - "**/containers/**/*.tsx"
      target: "components/business/{originalName}"
      reason: "业务组件归入 components/business/"

    # API 服务
    - patterns:
        - "**/api/**/*.ts"
        - "**/services/**/*.ts"
        - "**/api/**"
      target: "services/{originalName}"
      reason: "API 调用层应归入 services/"

    # 自定义 Hooks
    - patterns:
        - "**/hooks/**"
        - "**/*/use*.ts"
        - "**/*/use*.tsx"
      target: "hooks/{originalName}"
      reason: "自定义 Hooks 应归入 hooks/"

    # 状态管理
    - patterns:
        - "**/store*/**/*.ts"
        - "**/state/**"
      target: "stores/{originalName}"
      reason: "状态管理应归入 stores/"

    # 类型定义
    - patterns:
        - "**/types/**"
        - "**/interfaces/**"
        - "**/*.d.ts"
        - "**/type.ts"
      target: "types/{originalName}"
      reason: "类型定义应归入 types/"

    # 工具函数
    - patterns:
        - "**/utils/**"
        - "**/helpers/**"
        - "**/lib/**"
      target: "utils/{originalName}"
      reason: "工具函数应归入 utils/"

    # 常量
    - patterns:
        - "**/constants/**"
        - "**/config/**"
        - "**/constant*.ts"
      target: "constants/{originalName}"
      reason: "常量定义应归入 constants/"

    # 全局样式
    - patterns:
        - "**/styles/**/*.css"
        - "**/styles/**/*.scss"
        - "**/themes/**"
      target: "styles/{originalName}"
      reason: "全局样式应归入 styles/"

    # 静态资源
    - patterns:
        - "**/assets/**"
        - "**/images/**"
        - "**/fonts/**"
        - "**/public/**"
        - "*.png"
        - "*.svg"
        - "*.jpg"
        - "*.ico"
      target: "assets/{originalName}"
      reason: "静态资源应归入 assets/"
```

### 按功能模式映射规则（预留配置结构）

```yaml
feature_based_mappings:
  default_source_path: "src"

  # 用户可在执行时提供模块名称列表
  feature_detection:
    # 按目录名推断功能模块
    - patterns:
        - "src/**/profile/**/*.tsx"
        - "src/**/profile/**/*.ts"
      feature: "profile"
    - patterns:
        - "src/**/dashboard/**/*.tsx"
        - "src/**/dashboard/**/*.ts"
      feature: "dashboard"
    - patterns:
        - "src/**/auth/**/*.tsx"
        - "src/**/auth/**/*.ts"
        - "src/**/login/**"
        - "src/**/register/**"
      feature: "auth"
```

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

## 别名配置偏好

```yaml
# 用户在项目中常用的别名映射（执行时使用实际检测值）
alias_preferences:
  # tsconfig paths 类型
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

  # 构建工具 resolve.alias 类型
  build_alias_resolution:
    - alias: "@components"
      target: "src/components/"
    - alias: "@utils"
      target: "src/utils/"
```

## 执行偏好

```yaml
execution_preferences:
  # 文件移动策略：copy_delete / git_mv / dry_run
  move_strategy: "copy_delete"

  # 是否启用备份
  backup_enabled: true
  backup_dir: ".restructure-backup"

  # 引用更新范围
  reference_scope: "project"  # project / changed_only / manual

  # 入口文件保护
  protected_paths:
    - "src/App.tsx"
    - "src/main.tsx"
    - "src/index.ts"
    - "src/router.tsx"
    - "pages/**"  # Next.js pages
    - "app/**"    # Next.js App Router
```
