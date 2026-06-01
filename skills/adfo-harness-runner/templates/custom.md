# 流水线自定义配置（共享配置主文件）

> **此文件是技术栈、目录约定、质量门规则的唯一配置源。**其他技能的 `templates/custom.md` 只定义技能特有配置，共享项统一从此文件读取。

在此文件中覆盖默认的流水线行为。所有配置项均为可选，未配置则使用默认值。

---

## 阶段配置

### 默认跳过的阶段

如果用户通常已准备好需求文档，可以默认跳过 PRD 和/或 SPEC 阶段：

```yaml
defaultSkip:
  - PRD     # 用户提供 PRD 文档
  - SPEC    # 用户提供技术规格
  # - DESIGN  # 很少跳过——组件设计通常需要
  # - REVIEW  # 不推荐跳过代码审查
```

### 最大重试次数

单阶段回退修复的最大重试次数（默认 3）：

```yaml
maxRetries: 3
```

### 自动推进

以下阶段完成后无需用户确认，自动进入下一阶段预览：

```yaml
autoAdvance:
  - INIT     # INIT 是编排器内置，建议自动推进
  # - PRD    # 其他阶段默认需确认
```

---

## 技术栈约定

**已有项目**：编排器启动时自动从 `package.json`、`tsconfig.json`、框架配置文件检测实际技术栈，无需在此填写。

**新项目**：INIT 阶段由用户指定，编排器询问以下选项：

```yaml
techStack:
  framework: ""           # 用户指定，如 "React 18 + TypeScript 5"
  uiLibrary: ""           # 用户指定，如 "Ant Design" / "MUI" / "shadcn/ui" / 无
  styling: ""             # 用户指定，如 "Tailwind CSS" / "CSS Modules" / "styled-components"
  stateManagement: ""     # 用户指定，如 "Zustand" / "Redux Toolkit" / "Jotai" / "Context"
  router: ""              # 用户指定，如 "React Router v6" / "TanStack Router"
  dataFetching: ""        # 用户指定，如 "React Query" / "SWR" / "axios"
  buildTool: ""           # 用户指定，如 "Vite" / "Next.js" / "CRA"
  packageManager: ""      # 自动检测 npm/pnpm/yarn/bun
```

此配置会注入到所有原子技能的上下文中。

---

## 目录约定

**已有项目**：自动从项目目录结构检测，无需配置。

**新项目**：INIT 阶段根据用户指定的技术栈推断或由用户直接指定：

```yaml
directories:
  pages: ""         # 按实际项目结构填写，如 "src/pages/"
  components: ""    # 如 "src/components/"
  hooks: ""         # 如 "src/hooks/"
  services: ""      # 如 "src/services/"
  stores: ""        # 如 "src/stores/"
  types: ""         # 如 "src/types/"
  utils: ""         # 如 "src/utils/"
  workflows: "docs/workflows/"  # 流水线产物固定位置
```

---

## 质量门自定义

### REVIEW 阶段额外检查项

除默认 5 维度审查外，增加项目特定检查：

```yaml
reviewExtraChecks:
  - "所有 API 调用通过 services/ 层封装"
  - "所有表单使用 zod 校验"
  - "无 console.log 残留"
  - "无 hardcoded 中文文案（需走 i18n）"
```

### 自定义 qualityGate 规则

```yaml
qualityGateRules:
  # critical ≥ 1 → FAIL
  # high ≥ 3 → FAIL
  # high ≥ 1 → WARN
  # 其他 → PASS
  failOn:
    critical: 1
    high: 3
  warnOn:
    high: 1
    medium: 5
```

---

## 产物 Front-matter 约定

每个阶段产物的 front-matter 格式：

```yaml
---
phase: PRD              # 阶段名
status: completed       # completed / in_progress / failed
qualityGate: pass       # pass / warn / fail
---
```

编排器通过解析 front-matter 自动判断质量门结果。

---

## 自定义阶段

如需在标准流水线中插入额外阶段：

```yaml
customPhases:
  - name: "I18N"
    after: "IMPLEMENT"
    before: "REVIEW"
    skill: "adfp-i18n-generator"
    output: "i18n-report.md"
    skippable: true
    description: "国际化文案提取与翻译"
```

自定义阶段会自动插入到 `after` 和 `before` 之间，遵守标准的三步模式。

---

## 通知与 Hook

```yaml
hooks:
  onPhaseComplete: null     # 阶段完成后的 shell 命令
  onPipelineDone: null      # 流水线完成后的 shell 命令
  onPipelineFailed: null    # 流水线失败后的 shell 命令
```
