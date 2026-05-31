# adfp-code-implementer

> React + TypeScript 代码实现专家。根据组件设计方案编写可运行的前端代码，严格遵循项目开发规范。支持修复模式：代码审查后发现的问题可精准定位修复。TRIGGER: 用户说'实现代码'、'写代码'、'implement'、'开发'、'帮我写'、'生成代码'、'实现这个组件'。Use proactively when: 用户已有组件设计方案或明确的功能需求描述，需要生成实际代码。

---

## 基本信息

| 属性 | 值 |
|------|-----|
| **名称** | adfp-code-implementer |
| **类型** | 流水线 |
| **阶段** | IMPLEMENT（在 DESIGN 和 REVIEW 之间） |
| **前缀** | adfp- |
| **触发词** | `实现代码`、`写代码`、`implement`、`开发`、`帮我写`、`生成代码`、`实现这个组件` |
| **文件位置** | `.claude/skills/adfp-code-implementer/SKILL.md` |

---

## 核心特性

### 1. 双模式运行

| 模式 | 输入 | 说明 |
|------|------|------|
| 敏捷模式 | 用户描述 | 从功能需求直接实现，无需设计文档 |
| 工程模式 | `design.md` | 严格按设计方案实现，承接上游设计产物 |

### 2. 代码生成顺序

```
类型定义 → 工具函数 → 自定义 Hooks → 子组件（叶子→容器→页面）→ 入口文件
```

### 3. 前端美学实现规范（6 大维度）

| 维度 | 要求 |
|------|------|
| **字体排印** | 选择独特有辨识度的字体（非 Inter/Roboto/Arial） |
| **色彩与主题** | 承诺统一美学方向，主导色+锐利强调色 |
| **动效** | 高影响力时刻优先：页面加载动画、staggered reveals |
| **空间构成** | 打破预期布局：不对称、重叠、对角线流动 |
| **背景与视觉细节** | 创造氛围和深度：渐变网格、噪点纹理、几何图案 |
| **严禁模板化** | 拒绝紫色渐变+白背景、居中卡片、通用设计 |

### 4. 修复模式

从审查报告回退时：
- 只修改与 blockers 相关的文件
- 优先修复 severity: critical/high
- 修复记录写入实现报告

### 5. 代码规范

- 函数组件 + Hooks
- Props 导出 interface
- 事件处理函数以 `handle` 开头
- 不写注释（除非逻辑不显而易见）
- 单一职责，避免巨型组件（>200 行拆分）

---

## 使用方式

```
# 敏捷模式
"帮我写一个带有搜索和分页的用户列表页面"

# 工程模式（配合 harness）
"根据这份组件设计文档实现代码"

# 修复模式（从 adfp-code-reviewer 回退）
"修复审查报告中的 critical 问题"
```

---

## 依赖关系

### 上游依赖（本技能依赖谁）

| 技能 | 关系类型 | 输入产物 | 说明 |
|------|---------|---------|------|
| `adfp-component-designer` | 前置输入 | `design.md` | 接收组件设计方案（组件树+Props+状态+视觉方向） |
| `adfp-architecture-designer` | 可选输入 | `architecture.md` | 快速原型模式下直接基于架构分析实现 |
| `adfo-harness-runner` | 编排调度 | 调度信号 | 工程模式下由 harness 在 IMPLEMENT 阶段调度（唯一不可跳过阶段） |

### 下游消费（谁依赖本技能）

| 技能 | 关系类型 | 消费产物 | 说明 |
|------|---------|---------|------|
| `adfp-code-reviewer` | 后置消费 | 源码（`src/`） | 实现的代码进入 7 维度审查 |
| `adfp-code-reviewer` | 修复循环 | blockers 清单 | 审查 FAIL 后回退到本技能修复模式 |
| `adfa-edge-case-master` | 后置消费 | 源码（`src/`） | 基于实现代码生成测试用例 |

---

## 流程生命周期

### 触发条件

- **自动触发**：harness 在 DESIGN 通过后自动进入 IMPLEMENT 阶段（不可跳过）
- **手动触发**："实现代码"、"写代码"、"帮我写"、"生成代码"
- **修复回调**：adfp-code-reviewer FAIL 后回退，附 blockers 清单

### 生命周期图

```
上游输入
  ├─ adfp-component-designer → design.md
  ├─ adfp-architecture-designer → architecture.md
  └─ adfo-harness-runner → 调度信号
        ↓
本技能：读取上下文 → 加载规范 → 生成类型 → 生成Hooks → 生成组件 → 应用美学规范 → 输出报告
        ↓
下游消费
  ├─ adfp-code-reviewer → 源码（src/）+ implementation.md
  └─ adfa-edge-case-master → 源码（src/）
        ↑                    │
        └── 修复循环（FAIL）──┘

异常路径：
  ├─ 设计冲突 → 建议回退 DESIGN / ARCHITECTURE
  └─ 缺失依赖 → 标注，等待补充后再实现
```

### 在完整流水线中的位置

```
INIT → ANALYZE → PRD → SPEC → ARCHITECTURE → DESIGN → 【IMPLEMENT】 → REVIEW → DONE
                                                   ↑ 不可跳过
```

### 产物状态

| 产物 | 路径 | 状态流转 |
|------|------|---------|
| 源代码 | `src/` | 创建 → REVIEW 审查 → 合并 |
| 实现报告 | `./implementation.md` / `docs/workflows/{任务ID}/implementation.md` | 创建 → REVIEW 消费 → 归档 |

---

## 工作流程

### 内部流程

```
读取上下文 → 加载规范 → 生成类型 → 生成Hooks → 生成组件 → 应用美学规范 → 输出报告
```

### 详细步骤

| 步骤 | 输入 | 输出 | 说明 |
|------|------|------|------|
| 1. 读取上下文 | design.md / architecture.md / 用户描述 | 需求理解 | 解析设计方案、架构约束、功能需求 |
| 2. 加载规范 | 项目规范、美学标准 | 规范配置 | 加载技术栈约定、目录结构、代码风格 |
| 3. 生成类型 | 组件 Props 定义 | TypeScript interfaces | 为所有 Props 生成 interface 定义 |
| 4. 生成 Hooks | 状态逻辑、副作用 | 自定义 Hooks | 提取可复用的状态逻辑 |
| 5. 生成组件 | 组件树、Props | React 组件 | 按叶子→容器→页面顺序生成 |
| 6. 应用美学规范 | 视觉设计方向 | 样式实现 | 应用 6 大美学维度 |
| 7. 输出报告 | 实现记录 | implementation.md | 记录实现决策、文件清单、注意事项 |

---

## 与现有技能的职责边界

### 与 adfp-component-designer 的边界

| 技能 | 职责 | 产物 |
|------|------|------|
| adfp-component-designer | **设计**组件结构、Props 接口、状态方案 | design.md（设计文档） |
| adfp-code-implementer | **实现**设计文档中的组件，生成可运行代码 | src/（源码）+ implementation.md |

**边界原则**：设计者不写代码，实现者不改变设计。如发现设计问题，回退到设计阶段。

### 与 adfp-code-reviewer 的边界

| 技能 | 职责 | 产物 |
|------|------|------|
| adfp-code-implementer | **生成**符合规范的代码 | 源码（src/） |
| adfp-code-reviewer | **审查**已生成的代码 | review.md（审查报告） |

**边界原则**：实现者负责"写对"，审查者负责"查错"。审查发现问题后回退到实现者修复。

### 与 adfa-edge-case-master 的边界

| 技能 | 职责 | 产物 |
|------|------|------|
| adfp-code-implementer | **实现**功能代码 | 源码（src/） |
| adfa-edge-case-master | **生成**测试用例 | 测试代码（test/） |

**边界原则**：实现者写功能代码，测试专家写测试代码。两者互补，不重叠。

### 与 adfp-architecture-designer 的边界

| 技能 | 职责 | 产物 |
|------|------|------|
| adfp-architecture-designer | **规划**文件层级、模块边界、依赖拓扑 | architecture.md |
| adfp-code-implementer | **填充**架构规划中的具体实现 | 源码（src/） |

**边界原则**：架构师定骨架，实现者填血肉。实现者遵循架构约束，不擅自改变文件结构。

---

## 约束规则

### 必须遵守

1. **严格按设计方案实现**（含视觉设计方向）
2. **所有 Props 必须有 TypeScript interface**
3. **不引入设计文档中未提及的第三方依赖**
4. **样式实现必须遵循美学规范**
5. **不生成注释**（除非解释非显而易见的 WHY）

### 禁止行为

- 禁止跳过设计阶段直接实现（敏捷模式除外）
- 禁止擅自修改组件结构（发现问题应回退设计）
- 禁止使用模板化设计（紫色渐变+白背景等）
- 禁止生成超过 200 行的巨型组件

### 修复模式约束

- 只修改与 blockers 相关的文件
- 不修改与问题无关的代码
- 修复记录必须写入 implementation.md

---

## 模板注入

### 共享配置

技术栈、目录约定由 `adfo-harness-runner/templates/custom.md` 统一管理。

### 技能特有模板

代码风格、自定义规则见 `.claude/skills/adfp-code-implementer/templates/custom.md`。

### 模板优先级

```
技能特有模板 > 共享配置 > 默认规范
```

---

## 测试用例

### 测试场景

| 场景 | 输入 | 预期输出 | 验证点 |
|------|------|---------|--------|
| 敏捷模式实现 | 用户功能描述 | 源码 + implementation.md | 功能完整、类型安全 |
| 工程模式实现 | design.md | 源码 + implementation.md | 严格遵循设计 |
| 修复模式 | blockers 清单 | 修复后的源码 | 问题已解决 |
| 美学规范应用 | 视觉设计方向 | 样式实现 | 符合 6 大维度 |

### 测试文件位置

详见 `.claude/skills/adfp-code-implementer/test/`。

### 验收标准

- [ ] 所有 Props 有 TypeScript interface
- [ ] 无巨型组件（>200 行）
- [ ] 样式符合美学规范
- [ ] 无未声明的第三方依赖
- [ ] implementation.md 记录完整
