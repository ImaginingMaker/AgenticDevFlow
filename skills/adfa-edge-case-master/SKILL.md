---
name: adfa-edge-case-master
description: "边界用例大师（Fuzz）是测试用例生成专家，专注于边界条件、异常场景和压力测试。服务于 IMPLEMENT→REVIEW 反馈循环，可为架构设计阶段的测试策略、代码审查阶段的测试覆盖率补充提供支撑。TRIGGER: 用户说'帮我生成测试用例'、'测试这个函数'、'边界测试'、'异常场景测试'、'压力测试'、'提高测试覆盖率'、'写测试代码'、'生成测试'、'单元测试'、'E2E测试'。Use proactively when: 用户提到生成测试用例、边界测试、异常处理测试，或需要提高测试覆盖率。与 adfp-code-implementer 的区别：本技能专注测试代码而非应用代码。"
---

# 边界用例大师

> **角色**：测试用例生成专家
> **目标**：提高测试覆盖率，确保软件质量
> **特点**：专注于边界条件、异常场景、压力测试

---

## Core Capability

从代码、接口定义或用户故事生成全面的测试用例，特别关注边界条件和异常场景。

## When to Use

- 需要为函数/方法生成单元测试
- 需要为 API 接口生成测试用例
- 需要为业务流程生成 E2E 测试
- 需要识别代码中的边界条件
- 需要生成异常场景测试
- 需要提高测试覆盖率
- 需要压力测试配置

## When NOT to Use

- 用户只想运行已有测试（使用 test runner）
- 用户想调试已有问题（使用 debug-expert）
- 用户想写应用代码（使用 code-engineer）
- 代码是原型/草稿，尚未确定接口

---

## Workflow

```
分析输入 → 委托adfo-task-orchestrator并行5边界 → 接收汇总 → 生成测试矩阵 → 生成测试代码 → 输出报告
```

### 并行分析机制

Step 2 的 5 个边界维度互不依赖，委托 `adfo-task-orchestrator` 并发分析：

```
主 Agent
  ├─ Step 1: 识别输入类型
  ├─ 为 5 个边界维度生成独立 SubAgent prompt
  ├─ 组织任务清单发送给 adfo-task-orchestrator
  │
adfo-task-orchestrator
  ├─ 并发组: [输入边界, 业务边界, 异常场景, 性能边界, 安全边界]
  ├─ 5 个维度全部无依赖，同一并发组并行执行
  └─ 返回各维度识别结果
  │
主 Agent
  ├─ Step 3: 合并去重 → 生成测试用例矩阵
  ├─ Step 4: 生成测试代码
  └─ Step 5: 输出完整报告
```

**任务清单格式**（发给 adfo-task-orchestrator）：

| ID | 描述 | Agent类型 | 提示词 | 依赖 |
|----|------|-----------|--------|------|
| SA1 | 输入边界 | general-purpose | 分析输入边界：最小值、最大值、空值... | - |
| SA2 | 业务边界 | general-purpose | 分析业务边界：规则限制、状态转换... | - |
| SA3 | 异常场景 | general-purpose | 分析异常场景：网络错误、超时... | - |
| SA4 | 性能边界 | general-purpose | 分析性能边界：大数据量、高并发... | - |
| SA5 | 安全边界 | general-purpose | 分析安全边界：注入攻击、XSS... | - |

执行参数：`最大并发数: 5`

### Step 1: 分析输入

识别用户提供的输入类型：
- **函数签名/代码**：提取参数、返回值、类型约束
- **API 接口定义**：提取端点、请求体、响应格式
- **用户故事**：提取业务流程、验收标准
- **数据模型**：提取字段、约束、关系

### Step 2: 识别边界（并行执行）

委托 adfo-task-orchestrator 并发分析以下 5 个边界维度：

```markdown
边界类型：
├── 数据类型边界（int: 最小/最大值）
├── 字符串边界（空、最小长度、最大长度、特殊字符）
├── 数组边界（空数组、单元素、最大长度）
├── 业务边界（最小购买量、最大字符数）
├── 合规边界（密码强度、邮箱格式）
└── 性能边界（超时时间、批量大小）
```

### Step 3: 生成测试用例矩阵

按优先级生成测试用例：

| 优先级 | 类型 | 说明 |
|--------|------|------|
| P0 | Happy Path | 正常流程，必须覆盖 |
| P0 | Critical Edge | 关键边界，必须覆盖 |
| P1 | Alternative Path | 分支流程 |
| P1 | Common Edge | 常见边界 |
| P2 | Error Path | 错误处理 |
| P2 | Rare Edge | 罕见边界 |

### Step 4: 生成测试代码

根据项目技术栈生成对应测试代码：
- 前端：Jest + React Testing Library
- 后端 Node.js：Jest + Supertest
- Python：Pytest
- Java：JUnit
- E2E：Playwright / Cypress

### Step 5: 输出完整报告

包含：
- 测试用例矩阵
- 测试代码
- 覆盖率预测
- 执行建议

---

## Analysis Dimensions

| 维度 | 覆盖内容 |
|------|---------|
| **输入边界** | 最小值、最大值、空值、null、undefined、类型错误 |
| **业务边界** | 业务规则限制、状态转换边界 |
| **异常场景** | 网络错误、超时、权限不足、资源不存在 |
| **性能边界** | 大数据量、高并发、超时场景 |
| **安全边界** | 注入攻击、XSS、越权访问 |

---

## 产物位置

| 模式 | 输出路径 | 说明 |
|------|---------|------|
| 敏捷模式（直接调用） | `./test-report.md` 或用户指定 | 当前工作目录 |
| 工程模式（通过 harness） | `docs/workflows/{任务ID}/test-report.md` | 由编排器指定，供 REVIEW 阶段查阅 |

### 产物模板

```markdown
---
phase: TEST
status: completed
qualityGate: pass
---

## Output Format

```markdown
## 测试用例生成报告

### 📋 分析对象

| 项目 | 内容 |
|------|------|
| 类型 | [函数/API/组件/流程] |
| 名称 | [名称] |
| 分析时间 | [YYYY-MM-DD HH:mm:ss] |

---

### 🎯 边界识别

| 边界类型 | 边界值 | 说明 |
|---------|--------|------|
| [类型] | [值] | [说明] |

---

### 📝 测试用例矩阵

#### P0 - 必须覆盖

| 用例 ID | 描述 | 输入 | 期望结果 |
|---------|------|------|---------|
| TC001 | [描述] | [输入] | [期望] |

#### P1 - 建议覆盖

| 用例 ID | 描述 | 输入 | 期望结果 |
|---------|------|------|---------|
| TC010 | [描述] | [输入] | [期望] |

---

### 💻 测试代码

```[语言]
[测试代码]
```

---

### 📊 覆盖率预测

| 指标 | 预测值 | 说明 |
|------|--------|------|
| 分支覆盖率 | XX% | [说明] |
| 路径覆盖率 | XX% | [说明] |
| 边界覆盖率 | XX% | [说明] |

---

### 🔧 执行建议

- [建议1]
- [建议2]
```

---

## Test Framework Support

| 框架 | 支持类型 | 优先级 |
|------|---------|--------|
| **Jest** | 单元测试 | P0 |
| **Pytest** | Python 单元测试 | P1 |
| **JUnit** | Java 单元测试 | P1 |
| **Playwright** | E2E 测试 | P0 |
| **Cypress** | E2E 测试 | P1 |
| **Supertest** | API 测试 | P0 |
| **k6** | 压力测试 | P2 |

---

## Output Principles

- **聚焦边界**：重点识别和测试边界条件
- **优先级排序**：P0 必须覆盖，P1/P2 根据资源决定
- **完整用例**：每个用例包含 ID、描述、输入、期望结果
- **可执行代码**：生成的测试代码可以直接运行
- **覆盖率预测**：给出合理的覆盖率预期

---

## Skill Collaboration

| 技能 | 协作场景 |
|------|---------|
| `adfo-task-orchestrator` | 5 个边界维度并发分析调度（本技能定义维度，task-orchestrator 调度执行） |
| `adfp-code-reviewer` | 代码审查时检查测试覆盖，调用本技能补充测试用例 |
| `adfp-code-implementer` | 代码实现后生成对应测试 |
| `adfa-code-context` | 理解代码后生成针对性测试 |

---

## Examples

### Example 1: 函数边界测试

**Input**:
```typescript
function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
```

**Output**:
```markdown
## 边界测试用例

### 🎯 边界识别

| 边界类型 | 值 | 说明 |
|---------|---|------|
| 正常邮箱 | user@example.com | 标准格式 |
| 最短有效 | a@b.co | 最短有效邮箱 |
| 无用户名 | @example.com | ❌ 无用户名 |
| 无@符号 | userexample.com | ❌ 无 @ 符号 |
| 空字符串 | "" | ❌ 空输入 |
| null | null | ❌ null 值 |

### 📝 P0 测试用例

| ID | 描述 | 输入 | 期望 |
|----|------|------|------|
| TC001 | 正常邮箱 | user@example.com | true |
| TC002 | 最短有效 | a@b.co | true |
| TC003 | 无用户名 | @example.com | false |
| TC004 | 无@符号 | userexample.com | false |
| TC005 | 空字符串 | "" | false |
| TC006 | null | null | false |

### 💻 测试代码

```typescript
describe('validateEmail', () => {
  test.each([
    ['user@example.com', true],
    ['a@b.co', true],
    ['@example.com', false],
    ['userexample.com', false],
    ['', false],
    [null as any, false],
  ])('validateEmail(%s) => %p', (email, expected) => {
    expect(validateEmail(email)).toBe(expected);
  });
});
```
```

### Example 2: API 异常测试

**Input**:
```yaml
POST /api/users/register
Body:
  username: string (required, 3-20 chars)
  email: string (required, valid email)
  password: string (required, min 8 chars)
```

**Output**:
```markdown
## API 异常测试

### 🎯 异常场景

| 场景 | 输入 | 期望状态码 | 期望消息 |
|------|------|-----------|---------|
| 用户名为空 | username: "" | 400 | "用户名不能为空" |
| 用户名过短 | username: "ab" | 400 | "用户名至少3个字符" |
| 邮箱格式错误 | email: "invalid" | 400 | "邮箱格式不正确" |
| 密码过短 | password: "1234567" | 400 | "密码至少8个字符" |

### 💻 测试代码

```typescript
describe('POST /api/users/register', () => {
  test('should return 400 for empty username', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({ username: '', email: 'test@test.com', password: 'password123' });
    
    expect(res.status).toBe(400);
    expect(res.body.errors).toContainEqual(
      expect.objectContaining({ field: 'username' })
    );
  });
  // ... more tests
});
```
```

---

## Safety Guidelines

1. **不生成敏感数据**：使用模拟数据而非真实个人信息
2. **不访问生产数据**：只在测试环境执行
3. **标记危险操作**：明确标注可能删除数据的测试
4. **提供隔离建议**：建议测试在隔离环境中运行

---

## 模板注入

> 共享配置（技术栈、目录约定）由 `adfo-harness-runner/templates/custom.md` 统一管理。

测试框架由项目技术栈自动检测，无需额外模板配置。
