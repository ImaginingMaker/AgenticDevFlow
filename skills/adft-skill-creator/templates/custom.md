# adft-skill-creator 技能特有配置

> 本技能为独立工具（adft-），不接入 harness 流水线。
> 此文件定义本技能特有的配置项。

---

## 技能类型预设

```yaml
skillTypes:
  - prefix: "adfp-"
    type: "流水线技能"
    description: "参与正向交付流水线（PRD→SPEC→DESIGN→IMPLEMENT→REVIEW）"
    harnessIntegration: true
  - prefix: "adfo-"
    type: "编排技能"
    description: "流程调度与任务管理"
    harnessIntegration: true
  - prefix: "adfa-"
    type: "辅助技能"
    description: "辅助分析、建议、审查，可在多阶段调用"
    harnessIntegration: true
  - prefix: "adft-"
    type: "工具技能"
    description: "独立工具，不参与前端开发流水线"
    harnessIntegration: false
```

## 新技能文件结构模板

```yaml
structure:
  mandatory:
    - "SKILL.md"
    - "test/evals.md"
  optional:
    - "references/"
    - "templates/custom.md"
    - "scripts/"
    - "agents/"
    - "assets/"
```

## 文档同步目标

```yaml
syncTargets:
  - "docs/skills/adf<type>-<name>.md"
  - "docs/skills/README.md"
  - "skills/README.md"
```

## 触发词要求

```yaml
triggerRequirements:
  minCount: 3
  language: "中英文混合"
  format: "以列表形式定义，每个触发词用引号包裹"
```

## 质量门默认检查项

```yaml
qualityGates:
  - "命名符合 adfp-/adfo-/adfa-/adft- 规范"
  - "description 含 TRIGGER 和 Use proactively when"
  - "SKILL.md < 500 行"
  - "有 test/evals.md"
  - "共享配置引用 harness-runner（adfp/adfo/adfa）"
  - "templates/custom.md 仅含技能特有配置"
  - "职责边界清晰，无功能重叠"
  - "docs/skills/ 对应文档已同步"
```
