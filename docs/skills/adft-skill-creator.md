# adft-skill-creator

> 创建以 adf 为前缀的 Claude Code 技能。当用户想要创建新技能、定义技能工作流程、或需要技能开发指导时使用此技能。TRIGGER: "创建一个技能"、"帮我写个技能"、"new skill"、"make a skill"、"adf-开头的技能"。

## 基本信息

| 属性 | 值 |
|------|-----|
| **名称** | adft-skill-creator |
| **类型** | 工具 |
| **前缀** | adft-（独立工具） |
| **触发词** | `创建一个技能`、`帮我写个技能`、`new skill`、`make a skill`、`创建技能`、`定义技能工作流程` |
| **文件位置** | `skills/adft-skill-creator/SKILL.md` |

---

## 核心特性

### 技能创建全流程

```
用户需求 → 调用 skill-creator:skill-creator → 应用 ADF 命名约束 → 验证并交付
```

### ADF 命名约束系统

| 前缀 | 类型 | 说明 |
|------|------|------|
| `adfp-` | 流水线技能 | 参与正向交付流水线（PRD→SPEC→DESIGN→IMPLEMENT→REVIEW） |
| `adfo-` | 编排技能 | 流程调度与任务管理 |
| `adfa-` | 辅助技能 | 辅助分析、建议、审查，可在多阶段调用 |
| `adft-` | 工具技能 | 独立工具，不参与前端开发流水线 |

### 技能结构生成

自动生成符合技能基准规范的目录结构：

```
skills/adf<type>-<name>/
├── SKILL.md          # 技能主文件（<500行）
├── references/       # 参考文档（>300行需目录）
├── templates/
│   └── custom.md     # 技能特有配置
├── test/
│   └── evals.md      # 评估用例（必须）
├── scripts/          # 可执行脚本（可选）
├── agents/           # 子代理指令（可选）
└── assets/           # 静态资源（可选）
```

### 与官方 skill-creator 的协作

本技能作为官方 `skill-creator:skill-creator` 的前端封装，负责：
1. 接收用户需求并转化为技能定义
2. 应用 ADF 命名规范和约束
3. 调用官方 skill-creator 执行创建
4. 验证产物并交付

---

## 使用方式

```
# 创建流水线技能
"创建一个 adfp- 开头的技能，用于处理数据提取"

# 创建编排技能
"帮我写个 adfo- 开头的技能，用于任务编排"

# 创建辅助技能
"new skill: adfa-xxx，用于代码分析"

# 指定详细需求
"创建一个技能：
- 名称：adfp-data-processor
- 功能：处理前端数据
- 触发词：处理数据、数据处理
- 上游：adfp-spec-generator
- 下游：adfp-component-designer"
```

---

## 依赖关系

### 上游依赖（本技能依赖谁）

| 技能 | 关系类型 | 说明 |
|------|---------|------|
| 用户 | 手动触发 | "创建一个技能"、"帮我写个技能"、"new skill" |
| `adfa-dev-helper` | 建议下游 | dev-helper 在场景分析时可能推荐本技能 |

### 下游消费（谁依赖本技能）

| 技能 | 关系类型 | 说明 |
|------|---------|------|
| `skill-creator:skill-creator` | 核心依赖 | 官方技能创建器，执行实际创建工作 |

---

## 流程生命周期

### 触发条件

- **手动触发**："创建一个技能"、"帮我写个技能"、"new skill"、"make a skill"
- **任意阶段可用**：作为独立工具，不限开发阶段

### 生命周期图

```
用户提出技能创建需求
        ↓
本技能：
  Phase 1: 需求澄清 → 确认技能类型（adfp-/adfo-/adfa-/adft-）
  Phase 2: 调用 skill-creator:skill-creator
  Phase 3: 应用 ADF 命名约束 → 验证产物结构
  Phase 4: 交付技能文件 → 用户确认
```

### 产物状态

| 产物 | 路径 | 状态流转 |
|------|------|---------|
| 技能主文件 | `skills/{skill-name}/SKILL.md` | 创建 → 测试 → 迭代优化 |
| SubAgent 指令 | `skills/{skill-name}/agents/` | 按需创建 |
| 参考文档 | `skills/{skill-name}/references/` | 按需创建 |
| 测试用例 | `skills/{skill-name}/test/evals.md` | 创建 → 执行验证 |

---

## 工作流程

### Phase 1: 需求澄清

```
1. 确认技能名称和前缀（adfp-/adfo-/adfa-/adft-）
2. 确认技能功能描述
3. 确认触发词列表
4. 确认上游/下游依赖关系
5. 确认是否需要 SubAgent 架构
```

### Phase 2: 调用官方 skill-creator

```
调用 skill-creator:skill-creator，传入：
- 技能名称（已应用 ADF 命名约束）
- 功能描述
- 触发词
- 依赖关系
- 其他配置
```

### Phase 3: 应用 ADF 命名约束

```
验证规则：
1. 前缀必须为 adfp-/adfo-/adfa-/adft- 之一
2. 名称格式：adf<type>-<feature-name>
3. feature-name 使用 kebab-case
4. 触发词必须包含中英文混合
5. 必须定义依赖关系（上游/下游）
```

### Phase 4: 验证并交付

```
1. 检查 SKILL.md 文件结构完整性
2. 检查触发词配置正确性
3. 检查依赖关系声明
4. 生成测试用例模板
5. 交付给用户确认
```

---

## 与现有技能的职责边界

| 维度 | skill-creator:skill-creator | adft-skill-creator |
|------|----------------------------|------------------|
| 核心职责 | 通用技能创建 | ADF 命名规范 + 前端技能创建 |
| 命名约束 | 无特定约束 | 强制 adfp-/adfo-/adfa-/adft- 前缀 |
| 依赖管理 | 无特定要求 | 强制定义上游/下游 |
| 触发词 | 无特定要求 | 要求中英文混合 |
| 适用范围 | 所有 Claude Code 技能 | 前端开发技能体系 |

---

## 约束规则

### 命名约束

1. 前缀必须是 `adfp-`、`adfo-`、`adfa-`、`adft-` 之一
2. 名称格式：`adf<type>-<name>`，使用小写字母和连字符
3. 禁止使用 camelCase、下划线或空格
4. 禁止使用旧 `pi-`、`pu-`、`pc-` 前缀

### 结构约束

1. 必须包含 SKILL.md 主文件（<500 行）
2. 必须包含 test/evals.md 评估用例
3. 必须定义触发词（至少 3 个）
4. 必须声明依赖关系（上游/下游）
5. 共享配置引用 `adfo-harness-runner/templates/custom.md`
6. 特有配置写入本技能的 `templates/custom.md`

### 文档同步约束

新建技能后必须同步：
1. 创建 `docs/skills/adf<type>-<name>.md` 详情文档
2. 更新 `docs/skills/README.md` 技能索引
3. 更新 `skills/README.md` 注册中心
4. 更新 `docs/` 索引文档

---

## 快速参考

创建技能时需读取以下文件：
- `AGENTS.md` — 完整技能基准规范总纲（质量门、职责去重、文档同步规则）
- `skills/README.md` — 技能注册中心（所有现有技能清单）
- `docs/skills/README.md` — 技能分类索引
