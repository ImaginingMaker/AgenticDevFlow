---
name: adft-skill-creator
description: '创建以 adf 为前缀的 Claude Code 技能。当用户想要创建新技能、定义技能工作流程、或需要技能开发指导时使用此技能。TRIGGER: "创建一个技能"、"帮我写个技能"、"new skill"、"make a skill"、"adf-开头的技能"。'
---

# ADF Skill Creator

> 入口页。详细的技能创建和校验流程见 `references/creation-flow.md`。

创建符合 ADF 命名规范的 Claude Code 技能。

## 核心流程

**第一步：调用 skill-creator:skill-creator**

使用 Skill 工具调用官方技能创建器：

```
Skill(skill="skill-creator:skill-creator", args="<用户的需求描述>")
```

这会启动完整的技能创建流程（意图捕获 → 起草 → 测试 → 评估 → 改进 → 打包）。

**第二步：应用 ADF 命名约束**

在 skill-creator 返回草稿后，应用以下约束：

### 命名规范

| 规则 | 说明 |
|------|------|
| 项目前缀 | 所有技能名称必须以 `adf`（AgenticDevFlow）开头 |
| 类型字母 | 按技能类型选择：`p`(流水线) / `o`(编排) / `a`(辅助) / `t`(工具) |
| 格式 | `adf<type>-<功能描述>`，使用小写字母和连字符 |
| 示例 | `adfp-data-extractor`、`adfa-report-generator`、`adft-api-client` |

**类型选择判断：**

| 类型 | 前缀 | 适用场景 |
|------|------|---------|
| 流水线 | `adfp-` | 参与正向交付流水线（PRD→SPEC→DESIGN→IMPLEMENT→REVIEW） |
| 编排 | `adfo-` | 流程调度与任务管理 |
| 辅助 | `adfa-` | 辅助分析、建议、审查，可在多阶段调用 |
| 工具 | `adft-` | 独立工具，不参与前端开发流水线 |

**禁止的命名：**

- 无 `adf` 前缀：`data-extractor` ❌
- 旧 `pi-` 前缀：`pi-data-extractor` ❌
- 大写/驼峰：`adfp-DataExtractor` ❌
- 下划线：`adfp_data_extractor` ❌
- 空格：`adfp data extractor` ❌

### 文件结构规范

```
adf<type>-<skill-name>/
├── SKILL.md          # 主文件 (<500行)
├── references/       # 参考文档 (>300行需目录)
├── test/
│   └── evals.md      # 评估用例（必须）
├── templates/
│   └── custom.md     # 技能特有配置（可选）
├── scripts/          # 可执行脚本（可选）
├── agents/           # 子代理指令（可选）
└── assets/           # 静态资源（可选）
```

**体积拆分原则：**

- SKILL.md 保持 <500 行
- 大型参考文档放入 `references/`
- 重复逻辑抽取为 `scripts/`
- 子代理指令放入 `agents/`

### 模板配置规范

| 配置类型 | 管理方式 |
|---------|---------|
| 共享配置（技术栈、目录约定） | 引用 `adfo-harness-runner/templates/custom.md` |
| 技能特有配置 | 写入本技能的 `templates/custom.md` |

### 测试规范

**测试目录：** 所有技能测试必须放在 `test/` 文件夹内。

```
test/
├── evals.md          # 评估测试用例
└── integration/      # 集成测试（可选）
```

**测试原则：**

- 新建技能时，在 `test/` 目录下创建对应测试文件
- 评估用例使用 `evals.md` 格式
- 集成测试验证技能端到端流程

**第三步：职责去重检查**

新建技能前必须检查与现有技能的 5 维度重叠：

| 维度 | 检查方式 |
|------|---------|
| 触发词 | 是否被现有技能覆盖？ |
| 输入 | 接受相同输入类型？ |
| 输出产物 | 产出相同类型的文件/结果？ |
| 目标阶段 | 服务同一开发阶段？ |
| 核心动作 | 执行相同关键操作？ |

**第四步：文档同步**

完成技能创建后，必须同步以下文档：

1. 创建 `docs/skills/adf<type>-<name>.md` 详情文档
2. 更新 `docs/skills/README.md` 技能索引
3. 更新 `skills/README.md` 注册中心（新技能在此注册）

**第五步：验证并交付**

确认技能符合规范后，返回给用户。

---

## 快速参考

需要详细规范时，读取以下文件：

- `references/naming-conventions.md` — 完整命名规范
- `AGENTS.md` — 完整技能基准规范
- `skills/README.md` — 技能注册中心（所有现有技能清单）
