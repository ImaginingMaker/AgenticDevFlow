# adfp-spec-generator

> 技术规格文档（SPEC）生成器。从 PRD 出发，生成前端技术规格——是 PRD 到代码实现之间的技术桥梁。

---

## 1. 基本信息

| 属性 | 值 |
|------|-----|
| **名称** | adfp-spec-generator |
| **类型** | 流水线技能 |
| **前缀** | adfp- |
| **阶段** | SPEC（在 PRD 和 ARCHITECTURE 之间） |
| **触发词** | `生成SPEC`、`技术规格`、`spec`、`technical spec`、`技术方案`、`写技术文档`、`技术设计` |
| **文件位置** | `.claude/skills/adfp-spec-generator/SKILL.md` |

---

## 2. 核心特性

### 2.1 职责边界（关键）

SPEC **只定义**「有什么页面、用什么数据、调什么接口、怎么路由、状态怎么管」：

| SPEC 负责 | 不负责（归其他技能） |
|-----------|---------------------|
| 页面→区块映射 | 详细组件树（→ adfp-component-designer） |
| 数据模型定义 | 文件层级规划（→ adfp-architecture-designer） |
| API 契约 | 组件 Props 接口（→ adfp-component-designer） |
| 状态管理策略 | 具体状态变量名/初始值（→ adfp-component-designer） |
| 路由设计 | 代码实现（→ adfp-code-implementer） |

### 2.2 六大产出章节

1. **功能模块划分**：PRD 功能 → 前端模块映射
2. **页面架构**：页面清单 + 页面→区块映射（不展开叶子组件）
3. **数据模型**：核心实体接口定义 + 枚举
4. **API 契约**：接口清单（方法/路径/请求体/响应体/使用页面）
5. **状态管理策略**：数据分层策略（全局/页面/组件/服务端缓存）
6. **路由设计**：路径/页面/权限/懒加载

### 2.3 状态处理约定

每个 API 调用强制三种状态：loading → empty → error + retry

### 2.4 双模式输出

| 模式 | 输入 | 输出路径 |
|------|------|---------|
| 敏捷模式 | PRD / 用户需求 | `./spec.md` |
| 工程模式 | harness 调度 | `docs/workflows/{任务ID}/spec.md` |

---

## 3. 使用方式

```
# 从PRD生成SPEC
"生成SPEC：基于这份PRD"

# 直接描述技术需求
"写技术方案：用户管理后台，列表+详情+表单"
```

---

## 4. 依赖关系

### 4.1 上游依赖（本技能依赖谁）

| 技能 | 关系类型 | 说明 |
|------|---------|------|
| `adfp-prd-generator` | 前置输入 | 接收 PRD 文档（prd.md）作为技术规格设计基础 |
| `adfo-harness-runner` | 编排调度 | 工程模式下由 harness 在 SPEC 阶段调度本技能 |

### 4.2 下游消费（谁依赖本技能）

| 技能 | 关系类型 | 说明 |
|------|---------|------|
| `adfp-architecture-designer` | 后置消费 | 基于 SPEC（spec.md）的页面架构和数据模型规划文件层级 |
| `adfa-critical-explorer` | 建议下游 | 可对 SPEC 方案进行 6 维度批判性评审 |

---

## 5. 流程生命周期

### 5.1 触发条件

- **自动触发**：harness 在 PRD 通过后自动进入 SPEC 阶段
- **手动触发**：`生成SPEC`、`技术规格`、`spec`、`technical spec`、`技术方案`、`写技术文档`、`技术设计`
- **跳过条件**：快速原型时可跳过 SPEC（harness 允许 SPEC 可跳过）

### 5.2 生命周期图

```
adfp-prd-generator（PRD 文档 prd.md）
      ↓
本技能：读取PRD → 功能模块划分 → 页面架构 → 数据模型 → API契约 → 状态策略 → 路由设计 → 输出SPEC
      ↓
adfp-architecture-designer（接收 spec.md）/ adfa-critical-explorer（评审技术规格）

异常路径：
  ├─ PRD 信息不足 → 标注「待确认」，不猜测
  └─ 技术决策不确定 → 列出选项+建议，标注「待决策」
```

### 5.3 在完整流水线中的位置

```
INIT → ANALYZE → PRD → 【SPEC】 → ARCHITECTURE → DESIGN → IMPLEMENT → REVIEW → DONE
```

### 5.4 产物状态

| 产物 | 路径 | 状态流转 |
|------|------|---------|
| SPEC 文档 | `./spec.md` / `docs/workflows/{任务ID}/spec.md` | 创建 → ARCHITECTURE/DESIGN 消费 → 归档 |

---

## 6. 工作流程

```
读取PRD → 功能模块划分 → 页面架构 → 数据模型 → API契约 → 状态策略 → 路由设计 → 输出SPEC
```

### 6.1 详细步骤

| 步骤 | 输入 | 处理 | 输出 |
|------|------|------|------|
| 1. 读取PRD | prd.md | 解析功能清单、用户故事、交互流程 | 功能需求列表 |
| 2. 功能模块划分 | 功能需求列表 | 按业务域/技术域分组 | 模块清单 |
| 3. 页面架构 | 模块清单 | 定义页面→区块映射 | 页面架构图 |
| 4. 数据模型 | 页面架构 | 提取核心实体，定义接口 | 数据模型定义 |
| 5. API契约 | 数据模型 | 设计接口规范 | API接口清单 |
| 6. 状态策略 | API契约 | 确定数据分层策略 | 状态管理方案 |
| 7. 路由设计 | 页面架构 | 定义路由规则 | 路由配置表 |
| 8. 输出SPEC | 以上所有 | 汇总生成文档 | spec.md |

---

## 7. 与现有技能的职责边界

### 7.1 与 adfp-component-designer 的边界

| 本技能（SPEC） | adfp-component-designer |
|---------------|----------------------|
| 页面→区块映射 | 区块→组件树展开 |
| 数据模型定义 | 组件 Props 接口 |
| 状态分层策略 | 具体状态变量/初始值 |

### 7.2 与 adfp-architecture-designer 的边界

| 本技能（SPEC） | adfp-architecture-designer |
|---------------|-------------------------|
| 页面架构 | 文件层级规划 |
| 模块划分 | 可复用模块识别 |
| API契约 | 依赖拓扑分析 |

### 7.3 协作流程

```
PRD (adfp-prd-generator)
    ↓
SPEC (本技能) —— 页面架构、数据模型、API、路由、状态策略
    ↓
ARCHITECTURE (adfp-architecture-designer) —— 可复用模块、依赖图、文件层级
    ↓
DESIGN (adfp-component-designer) —— 展开详细组件树、Props、状态变量
```

---

## 8. 约束规则

1. **基于 PRD 生成**：不凭空设计，每个技术决策可回溯到 PRD 功能
2. **不确定标注**：技术决策不确定时标注「待确认」，列出选项+建议
3. **页面架构边界**：止于页面→区块映射，不展开叶子组件树
4. **状态管理边界**：只定义分层策略，不列具体状态变量
5. **不规划文件目录**：文件层级规划归 adfp-architecture-designer
6. **API 契约标注**：每个接口必须标注使用页面
7. **状态处理约定**：每个 API 调用强制三种状态：loading → empty → error + retry

---

## 9. 模板注入

共享配置由 `adfo-harness-runner/templates/custom.md` 统一管理。

技能特有模板见 `.claude/skills/adfp-spec-generator/templates/custom.md`。

---

## 10. 测试用例

### 10.1 基础场景

| 用例ID | 场景描述 | 输入 | 预期输出 |
|--------|---------|------|---------|
| TC-001 | 从完整PRD生成SPEC | prd.md（含功能清单、用户故事） | spec.md（含6大章节） |
| TC-002 | PRD信息不足 | prd.md（功能描述模糊） | spec.md 标注「待确认」项 |
| TC-003 | 敏捷模式输出 | 用户需求描述 | `./spec.md` |
| TC-004 | 工程模式输出 | harness调度 | `docs/workflows/{任务ID}/spec.md` |

### 10.2 边界场景

| 用例ID | 场景描述 | 预期行为 |
|--------|---------|---------|
| TC-101 | 无PRD直接生成SPEC | 提示需要PRD或需求描述 |
| TC-102 | 技术决策有多个选项 | 列出选项+建议，标注「待决策」 |
| TC-103 | API契约无使用页面 | 强制要求标注使用页面 |

### 10.3 测试文件位置

详见 `.claude/skills/adfp-spec-generator/test/`。
