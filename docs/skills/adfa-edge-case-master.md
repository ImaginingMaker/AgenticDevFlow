# adfa-edge-case-master

> 边界用例大师（Fuzz）— 测试用例生成专家，专注于边界条件、异常场景和压力测试。服务于 IMPLEMENT→REVIEW 反馈循环，可为架构设计阶段的测试策略、代码审查阶段的测试覆盖率补充提供支撑。

---

## 基本信息

| 属性 | 值 |
|------|-----|
| **名称** | adfa-edge-case-master |
| **类型** | 辅助 |
| **前缀** | adfa- |
| **触发词** | `帮我生成测试用例`、`测试这个函数`、`边界测试`、`异常场景测试`、`压力测试`、`提高测试覆盖率`、`写测试代码` |
| **文件位置** | skills/adfa-edge-case-master/SKILL.md |
| **代码行数** | 327 行 |

---

## 核心特性

### 5 维边界分析

| 维度 | 覆盖内容 |
|------|---------|
| 输入边界 | 最小值、最大值、空值、null、undefined、类型错误 |
| 业务边界 | 业务规则限制、状态转换边界 |
| 异常场景 | 网络错误、超时、权限不足、资源不存在 |
| 性能边界 | 大数据量、高并发、超时场景 |
| 安全边界 | 注入攻击、XSS、越权访问 |

### 多框架支持

Jest / Pytest / JUnit / Playwright / Cypress / Supertest / k6

### 测试矩阵分级

| 优先级 | 类型 | 说明 |
|--------|------|------|
| P0 | Happy Path | 正常流程，核心功能验证 |
| P1 | Common Edge | 常见边界，空值/极值处理 |
| P2 | Rare Edge | 罕见场景，极端异常处理 |

---

## 使用方式

```
# 函数测试
"为这个函数生成边界测试用例"

# API 测试
"为 POST /api/users/register 生成异常测试"

# E2E 测试
"为登录流程生成 E2E 测试"

# 架构测试策略
"为这个架构设计生成测试策略"
```

---

## 依赖关系

### 上游依赖（本技能依赖谁）

| 技能 | 关系类型 | 说明 |
|------|---------|------|
| `adfp-code-implementer` | 代码输入 | 为已实现的代码生成测试用例 |
| `adfp-architecture-designer` | 架构输入 | 为架构设计生成测试策略 |
| 用户 | 手动触发 | "帮我生成测试用例"、"边界测试"、"异常场景测试" |

### 下游消费（谁依赖本技能）

| 技能 | 关系类型 | 说明 |
|------|---------|------|
| 无 | - | 测试代码直接输出，由用户或 adfp-code-implementer 集成到项目中 |

---

## 流程生命周期

### 触发条件

- **手动触发**："帮我生成测试用例"、"测试这个函数"、"边界测试"、"压力测试"
- **上游触发**：adfp-code-implementer 完成代码实现后、adfp-architecture-designer 完成架构设计后
- **建议触发**：adfp-code-reviewer 发现测试覆盖不足时建议

### 生命周期图

```
adfp-code-implementer（代码实现完成）
        或
adfp-architecture-designer（架构设计完成）
        或
adfp-code-reviewer（发现测试不足）/ 用户触发
        ↓
本技能：分析输入 → 委托 adfo-task-orchestrator 并行 5 边界分析
        → 生成测试矩阵 → 生成测试代码 → 输出报告
        ↓
测试代码直接输出（用户或 adfp-code-implementer 集成）
```

### 产物状态

#### 产物位置

| 模式 | 输出路径 | 说明 |
|------|---------|------|
| 敏捷模式（直接调用） | `./test-report.md` 或用户指定 | 当前工作目录 |
| 工程模式（通过 harness） | `docs/workflows/{任务ID}/test-report.md` | 由编排器指定，供 REVIEW 阶段查阅 |

产物包含 front-matter 模板：

```markdown
---
phase: TEST
status: completed
qualityGate: pass
---
```

| 产物 | 路径 | 状态流转 |
|------|------|---------|
| 测试用例矩阵 | 对话内输出 | 输出 → 用户确认 → 丢弃 |
| 测试代码 | 对话内输出 | 输出 → 集成到项目 → 持久化 |

---

## 工作流程

### 内部流程

```
Step 1: 分析输入
        - 识别输入类型：函数签名 / API 定义 / 用户故事 / 数据模型 / 架构设计
        - 提取关键信息：参数类型、返回值、业务规则、依赖关系

Step 2: 委托 adfo-task-orchestrator 并行 5 边界分析
        - 输入边界：最小值、最大值、空值、null、undefined、类型错误
        - 业务边界：业务规则限制、状态转换边界
        - 异常场景：网络错误、超时、权限不足、资源不存在
        - 性能边界：大数据量、高并发、超时场景
        - 安全边界：注入攻击、XSS、越权访问

Step 3: 生成测试矩阵
        - P0 Happy Path：核心功能验证
        - P1 Common Edge：常见边界处理
        - P2 Rare Edge：极端异常处理

Step 4: 生成测试代码
        - 自动检测项目技术栈
        - 选择对应测试框架（Jest / Pytest / JUnit / Playwright / Supertest / k6）
        - 生成可执行测试代码

Step 5: 输出报告
        - 测试用例矩阵
        - 测试代码
        - 覆盖率预测
        - 执行建议
```

---

## 与现有技能的职责边界

| 技能 | 职责 | 边界说明 |
|------|------|---------|
| `adfa-edge-case-master` | 测试用例生成 | 专注于边界条件、异常场景、压力测试的用例生成 |
| `adfp-code-implementer` | 代码实现 | 负责功能代码实现，可集成测试代码但不负责测试设计 |
| `adfp-code-reviewer` | 代码审查 | 发现测试覆盖不足时建议调用本技能，不生成测试 |
| `adfp-architecture-designer` | 架构设计 | 提供架构输入，本技能基于架构生成测试策略 |

---

## 约束规则

1. **数据安全**
   - 不生成敏感数据（使用模拟数据）
   - 不访问生产数据（仅测试环境）
   - 标记危险操作（可能删除数据的测试）

2. **执行建议**
   - 提供隔离建议（建议在隔离环境中运行）
   - 标注需要 Mock 的外部依赖
   - 提供测试前置条件说明

3. **代码规范**
   - 遵循项目现有测试代码风格
   - 测试命名遵循 `should_xxx_when_xxx` 规范
   - 每个测试用例独立，不依赖执行顺序

---

## 模板注入

> 共享配置由 `adfo-harness-runner/templates/custom.md` 统一管理。

测试框架由项目技术栈自动检测，无需额外模板配置。

### 框架检测规则

| 技术栈 | 测试框架 |
|--------|---------|
| React + TypeScript | Jest + React Testing Library |
| Vue + TypeScript | Jest + Vue Test Utils |
| Node.js + Express | Jest + Supertest |
| Python + FastAPI | Pytest |
| Java + Spring | JUnit |
| E2E 测试 | Playwright / Cypress |
| 性能测试 | k6 |

---

## 测试用例

详见 `skills/adfa-edge-case-master/test/evals.md`。

### 示例场景

#### 场景 1：函数边界测试

输入：
```typescript
function divide(a: number, b: number): number {
  return a / b;
}
```

输出测试矩阵：
| 优先级 | 场景 | 输入 | 预期结果 |
|--------|------|------|---------|
| P0 | 正常除法 | a=10, b=2 | 5 |
| P1 | 除数为零 | a=10, b=0 | Infinity 或抛出错误 |
| P1 | 被除数为零 | a=0, b=5 | 0 |
| P2 | 极大值 | a=Number.MAX_VALUE, b=1 | Number.MAX_VALUE |
| P2 | 极小值 | a=Number.MIN_VALUE, b=1 | Number.MIN_VALUE |

#### 场景 2：API 异常测试

输入：
```
POST /api/users/register
Body: { username: string, password: string, email: string }
```

输出测试矩阵：
| 优先级 | 场景 | 输入 | 预期结果 |
|--------|------|------|---------|
| P0 | 正常注册 | 有效数据 | 201 Created |
| P1 | 用户名已存在 | 已注册用户名 | 409 Conflict |
| P1 | 邮箱格式错误 | 无效邮箱 | 400 Bad Request |
| P1 | 密码强度不足 | 弱密码 | 400 Bad Request |
| P2 | SQL 注入尝试 | 恶意输入 | 400 Bad Request |
| P2 | XSS 攻击尝试 | 脚本标签 | 400 Bad Request |
