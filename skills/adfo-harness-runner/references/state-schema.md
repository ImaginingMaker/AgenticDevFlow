# state.json 完整结构定义

`docs/workflows/{YYYYMMDD-任务名}/state.json` — 前端开发任务的唯一状态源。

---

## JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "adfo-harness-runner-task-state",
  "title": "Harness 编排器任务状态",
  "description": "adfo-harness-runner 工程化开发流水线的唯一状态源",

  "type": "object",
  "required": ["id", "name", "currentPhase", "phaseHistory", "outputDir", "createdAt", "updatedAt"],
  "properties": {
    "id": {
      "type": "string",
      "description": "任务唯一标识，格式 YYYYMMDD-任务名",
      "pattern": "^\\d{8}-[a-z0-9-]+$"
    },
    "name": {
      "type": "string",
      "description": "任务可读名称"
    },
    "description": {
      "type": "string",
      "description": "任务简要描述（一句话）"
    },
    "currentPhase": {
      "type": "string",
      "description": "当前所处阶段",
      "enum": ["INIT", "ANALYZE", "PRD", "SPEC", "ARCHITECTURE", "DESIGN", "IMPLEMENT", "REVIEW", "DONE", "FAILED"]
    },
    "phaseHistory": {
      "type": "array",
      "description": "阶段执行历史，按时间顺序排列",
      "items": { "$ref": "#/definitions/PhaseRecord" }
    },
    "retryCount": {
      "type": "integer",
      "description": "当前阶段重试次数，阶段前进时归零",
      "default": 0,
      "minimum": 0
    },
    "maxRetries": {
      "type": "integer",
      "description": "单阶段最大重试次数，超过后进入 FAILED",
      "default": 3,
      "minimum": 1
    },
    "blockers": {
      "type": "array",
      "description": "当前阻塞项列表",
      "items": { "$ref": "#/definitions/Blocker" }
    },
    "skippedPhases": {
      "type": "array",
      "description": "被跳过的阶段列表（快速查询），从 phaseHistory 中 status=skipped 的阶段派生。下游技能读取此字段判断哪些上游产物不可用",
      "items": {
        "type": "string",
        "enum": ["ANALYZE", "PRD", "SPEC", "ARCHITECTURE", "DESIGN", "REVIEW"]
      }
    },
    "techStack": {
      "type": "object",
      "description": "项目技术栈信息，由 INIT 阶段填充（自动检测或用户指定）",
      "properties": {
        "framework": { "type": "string", "description": "框架，如 React 18 + TypeScript 5 / Vue 3 / 微信小程序" },
        "platform": { "type": "string", "description": "运行平台：web / miniapp / mobile / cross-platform" },
        "uiLibrary": { "type": "string", "description": "UI 库，如 Ant Design / MUI / shadcn/ui / Element Plus" },
        "styling": { "type": "string", "description": "样式方案，如 Tailwind CSS / CSS Modules / styled-components" },
        "stateManagement": { "type": "string", "description": "状态管理，如 Zustand / Redux Toolkit / Pinia" },
        "router": { "type": "string", "description": "路由方案，如 React Router v6 / Vue Router" },
        "dataFetching": { "type": "string", "description": "数据请求，如 React Query / SWR / axios" },
        "buildTool": { "type": "string", "description": "构建工具，如 Vite / Next.js / Nuxt / Taro" },
        "packageManager": { "type": "string", "description": "包管理器，npm / pnpm / yarn / bun" }
      },
      "required": ["framework", "platform"]
    },
    "references": {
      "type": "array",
      "description": "用户提供的参考资料列表，INIT/ANALYZE 阶段收集，供后续阶段作为上下文",
      "items": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": ["design", "code", "doc", "competitor", "ui-library", "other"],
            "description": "资料类型：design=设计稿, code=项目代码, doc=文档, competitor=竞品, ui-library=UI库, other=其他"
          },
          "description": { "type": "string", "description": "资料的简要描述" },
          "path": { "type": "string", "description": "本地路径（如 ./docs/ui-guidelines.md）" },
          "url": { "type": "string", "description": "URL链接（如 Figma/竞品/文档链接）" }
        },
        "required": ["type", "description"]
      }
    },
    "outputDir": {
      "type": "string",
      "description": "产物目录，相对于项目根目录"
    },
    "checkpoint": {
      "type": ["object", "null"],
      "description": "最近完成阶段的快照，用于断点恢复",
      "properties": {
        "phase": {
          "type": "string",
          "enum": ["INIT", "PRD", "SPEC", "ARCHITECTURE", "DESIGN", "IMPLEMENT", "REVIEW", "DONE"]
        },
        "timestamp": {
          "type": "string",
          "format": "date-time"
        },
        "filesSnapshot": {
          "type": "object",
          "description": "产物文件 → SHA-256 映射",
          "additionalProperties": { "type": "string" }
        }
      },
      "required": ["phase", "timestamp", "filesSnapshot"]
    },
    "createdAt": {
      "type": "string",
      "format": "date-time",
      "description": "任务创建时间（ISO 8601）"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time",
      "description": "最后更新时间（ISO 8601）"
    }
  },

  "definitions": {
    "PhaseRecord": {
      "type": "object",
      "required": ["phase", "status"],
      "properties": {
        "phase": {
          "type": "string",
          "enum": ["INIT", "ANALYZE", "PRD", "SPEC", "ARCHITECTURE", "DESIGN", "IMPLEMENT", "REVIEW", "DONE", "FAILED"]
        },
        "status": {
          "type": "string",
          "enum": ["pending", "in_progress", "completed", "skipped", "failed", "retrying"],
          "description": "pending=尚未开始, in_progress=执行中, completed=已完成, skipped=用户跳过, failed=执行失败, retrying=回退重试中"
        },
        "startedAt": {
          "type": "string",
          "format": "date-time"
        },
        "completedAt": {
          "type": "string",
          "format": "date-time"
        },
        "qualityGate": {
          "type": "string",
          "enum": ["pass", "warn", "fail"],
          "description": "该阶段的质量门结果"
        },
        "skipEvidence": {
          "type": "string",
          "description": "跳过原因（status=skipped 时必填）"
        },
        "skillUsed": {
          "type": "string",
          "description": "该阶段调用的技能名"
        },
        "outputFiles": {
          "type": "array",
          "items": { "type": "string" },
          "description": "该阶段产出的文件列表"
        },
        "errors": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "code": { "type": "string" },
              "message": { "type": "string" },
              "timestamp": { "type": "string", "format": "date-time" }
            }
          }
        }
      }
    },
    "Blocker": {
      "type": "object",
      "required": ["phase", "issue", "severity", "resolved"],
      "properties": {
        "phase": {
          "type": "string",
          "description": "发现问题的阶段"
        },
        "issue": {
          "type": "string",
          "description": "阻塞项描述"
        },
        "severity": {
          "type": "string",
          "enum": ["critical", "high", "medium", "low"],
          "description": "严重程度"
        },
        "source": {
          "type": "string",
          "description": "问题来源（审查报告引用、文件路径:行号）"
        },
        "resolved": {
          "type": "boolean",
          "description": "是否已修复",
          "default": false
        },
        "resolvedAt": {
          "type": "string",
          "format": "date-time"
        },
        "resolution": {
          "type": "string",
          "description": "修复说明"
        }
      }
    }
  }
}
```

---

## 阶段枚举详解

> 阶段枚举的完整定义和流转规则见 `references/phase-registry.md`。以下为 state.json 中的存储格式。

### currentPhase 状态流转

```
INIT → ANALYZE → PRD → SPEC → ARCHITECTURE → DESIGN → IMPLEMENT → REVIEW → DONE
  └                                                             ┘
  └──────────────────── 任一回退路径 ───────────────────────────┘
                                                           ↓
                                                     FAILED（retryCount ≥ maxRetries）
```

### PhaseRecord.status 含义

| status | 含义 | 何时使用 |
|--------|------|---------|
| `pending` | 尚未开始 | 流水线到达该阶段前的初始状态 |
| `in_progress` | 执行中 | 用户调用原子技能期间 |
| `completed` | 已完成 | 质量门 pass/warn 后 |
| `skipped` | 已跳过 | 用户选择跳过或提供已有产物 |
| `failed` | 执行失败 | 产物缺失或质量门 fail |
| `retrying` | 回退重试中 | 从后续阶段回退到该阶段 |

---

## 完整示例

### 正常完成的任务

```json
{
  "id": "20260523-login-page",
  "name": "登录页面",
  "description": "手机号+验证码登录，支持微信OAuth",
  "currentPhase": "DONE",
  "phaseHistory": [
    {
      "phase": "INIT",
      "status": "completed",
      "startedAt": "2026-05-23T10:00:00+08:00",
      "completedAt": "2026-05-23T10:00:05+08:00",
      "qualityGate": "pass",
      "skillUsed": "adfo-harness-runner",
      "outputFiles": ["state.json"]
    },
    {
      "phase": "PRD",
      "status": "completed",
      "startedAt": "2026-05-23T10:01:00+08:00",
      "completedAt": "2026-05-23T10:06:30+08:00",
      "qualityGate": "pass",
      "skillUsed": "adfp-prd-generator",
      "outputFiles": ["prd.md"]
    },
    {
      "phase": "SPEC",
      "status": "skipped",
      "skipEvidence": "用户提供了已有的技术方案文档",
      "qualityGate": "pass"
    },
    {
      "phase": "DESIGN",
      "status": "completed",
      "startedAt": "2026-05-23T10:07:00+08:00",
      "completedAt": "2026-05-23T10:12:00+08:00",
      "qualityGate": "pass",
      "skillUsed": "adfp-component-designer",
      "outputFiles": ["design.md"]
    },
    {
      "phase": "IMPLEMENT",
      "status": "completed",
      "startedAt": "2026-05-23T10:13:00+08:00",
      "completedAt": "2026-05-23T10:45:00+08:00",
      "qualityGate": "pass",
      "skillUsed": "adfp-code-implementer",
      "outputFiles": [
        "src/pages/LoginPage/index.tsx",
        "src/components/LoginForm/index.tsx",
        "src/hooks/useLogin.ts",
        "implementation.md"
      ]
    },
    {
      "phase": "REVIEW",
      "status": "completed",
      "startedAt": "2026-05-23T10:46:00+08:00",
      "completedAt": "2026-05-23T10:48:30+08:00",
      "qualityGate": "pass",
      "skillUsed": "adfp-code-reviewer",
      "outputFiles": ["review-report.md"]
    }
  ],
  "retryCount": 0,
  "maxRetries": 3,
  "blockers": [],
  "skippedPhases": ["SPEC"],
  "techStack": {
    "framework": "React 18 + TypeScript 5",
    "platform": "web",
    "uiLibrary": "Ant Design",
    "styling": "Tailwind CSS",
    "stateManagement": "Zustand",
    "router": "React Router v6",
    "dataFetching": "React Query",
    "buildTool": "Vite",
    "packageManager": "pnpm"
  },
  "references": [
    {
      "type": "design",
      "description": "登录页Figma设计稿",
      "url": "https://figma.com/file/abc123/login-page"
    },
    {
      "type": "ui-library",
      "description": "Ant Design 组件库",
      "url": "https://ant.design/components/overview/"
    }
  ],
  "outputDir": "docs/workflows/20260523-login-page/",
  "checkpoint": {
    "phase": "REVIEW",
    "timestamp": "2026-05-23T10:48:30+08:00",
    "filesSnapshot": {
      "prd.md": "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "design.md": "sha256:a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a",
      "implementation.md": "sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
      "review-report.md": "sha256:2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae"
    }
  },
  "createdAt": "2026-05-23T10:00:00+08:00",
  "updatedAt": "2026-05-23T10:48:30+08:00"
}
```

### 有回退记录的任务

```json
{
  "id": "20260523-user-list",
  "name": "用户列表页",
  "currentPhase": "IMPLEMENT",
  "phaseHistory": [
    {"phase": "INIT", "status": "completed", "qualityGate": "pass"},
    {"phase": "PRD", "status": "completed", "qualityGate": "pass"},
    {"phase": "DESIGN", "status": "completed", "qualityGate": "pass"},
    {
      "phase": "IMPLEMENT",
      "status": "completed",
      "startedAt": "2026-05-23T09:00:00+08:00",
      "completedAt": "2026-05-23T09:30:00+08:00",
      "qualityGate": "pass",
      "outputFiles": ["src/pages/UserList/index.tsx", "implementation.md"]
    },
    {
      "phase": "REVIEW",
      "status": "failed",
      "startedAt": "2026-05-23T09:31:00+08:00",
      "completedAt": "2026-05-23T09:33:00+08:00",
      "qualityGate": "fail",
      "errors": [
        {
          "code": "CRITICAL_MISSING_LOADING",
          "message": "列表页缺少 Loading 状态处理",
          "timestamp": "2026-05-23T09:33:00+08:00"
        }
      ]
    },
    {
      "phase": "IMPLEMENT",
      "status": "retrying",
      "startedAt": "2026-05-23T09:35:00+08:00"
    }
  ],
  "techStack": {
    "framework": "Vue 3 + TypeScript",
    "platform": "web",
    "uiLibrary": "Element Plus",
    "styling": "UnoCSS",
    "stateManagement": "Pinia",
    "router": "Vue Router",
    "dataFetching": "axios",
    "buildTool": "Vite",
    "packageManager": "npm"
  },
  "retryCount": 1,
  "maxRetries": 3,
  "blockers": [
    {
      "phase": "REVIEW",
      "issue": "列表页缺少 Loading 状态处理",
      "severity": "critical",
      "source": "review-report.md:L15",
      "resolved": false
    },
    {
      "phase": "REVIEW",
      "issue": "空列表无 Empty 状态引导",
      "severity": "high",
      "source": "review-report.md:L22",
      "resolved": false
    }
  ],
  "skippedPhases": [],
  "outputDir": "docs/workflows/20260523-user-list/",
  "checkpoint": {
    "phase": "DESIGN",
    "timestamp": "2026-05-23T08:55:00+08:00",
    "filesSnapshot": {
      "prd.md": "sha256:xxx",
      "design.md": "sha256:yyy"
    }
  },
  "createdAt": "2026-05-23T08:50:00+08:00",
  "updatedAt": "2026-05-23T09:35:00+08:00"
}
```

---

## 状态迁移规则

### 合法状态迁移

| 从 | 到 | 条件 |
|----|-----|------|
| INIT | ANALYZE | 自动（state.json 创建完成） |
| ANALYZE | PRD | ANALYZE qualityGate = pass |
| INIT | PRD | 自动（state.json 创建完成）+ 用户跳过 ANALYZE |
| PRD | SPEC | PRD qualityGate = pass |
| PRD | ARCHITECTURE | PRD qualityGate = pass + 用户跳过 SPEC |
| PRD | DESIGN | PRD qualityGate = pass + 用户跳过 SPEC + 用户跳过 ARCHITECTURE |
| SPEC | ARCHITECTURE | SPEC qualityGate = pass |
| SPEC | DESIGN | SPEC qualityGate = pass + 用户跳过 ARCHITECTURE |
| ARCHITECTURE | DESIGN | ARCHITECTURE qualityGate = pass |
| DESIGN | IMPLEMENT | DESIGN qualityGate = pass |
| IMPLEMENT | REVIEW | IMPLEMENT qualityGate = pass |
| REVIEW | DONE | REVIEW qualityGate = pass |
| REVIEW | DONE | REVIEW qualityGate = warn + 用户确认继续 |
| REVIEW | IMPLEMENT | REVIEW qualityGate = fail + retryCount < maxRetries |
| IMPLEMENT | DESIGN | 实现过程中发现设计冲突 + retryCount < maxRetries |
| IMPLEMENT | ARCHITECTURE | 实现过程中发现架构规划不合理 + retryCount < maxRetries |
| DESIGN | ARCHITECTURE | 设计过程中发现架构偏离 + retryCount < maxRetries |
| DESIGN | SPEC | 设计过程中发现需求不明确 + ARCHITECTURE 已跳过 + retryCount < maxRetries |
| ARCHITECTURE | SPEC | 架构分析发现 SPEC 设计不合理 + retryCount < maxRetries |
| PRD | ANALYZE | PRD 生成发现需求背景不清晰 + retryCount < maxRetries |
| 任意 | FAILED | retryCount ≥ maxRetries |

### 非法状态迁移（编排器必须阻止）

- 跳过 IMPLEMENT → 直接到 REVIEW（IMPLEMENT 不可跳过）
- 从 INIT 跳过所有阶段 → 直接到 DONE
- FAILED 后自动进入任何阶段（需人工介入）
- DONE 后进入任何阶段（终态不可变）
- 从未定义阶段进入（phaseWhitelist 外）
