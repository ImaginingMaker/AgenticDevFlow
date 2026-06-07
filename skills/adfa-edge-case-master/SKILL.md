---
name: adfa-edge-case-master
description: "边界用例大师（Fuzz）是测试用例生成专家，专注于边界条件、异常场景和压力测试。服务于 IMPLEMENT→REVIEW 反馈循环，可为架构设计阶段的测试策略、代码审查阶段的测试覆盖率补充提供支撑。TRIGGER: 用户说'帮我生成测试用例'、'测试这个函数'、'边界测试'、'异常场景测试'、'压力测试'、'提高测试覆盖率'、'写测试代码'、'生成测试'、'单元测试'、'E2E测试'。Use proactively when: 用户提到生成测试用例、边界测试、异常处理测试，或需要提高测试覆盖率。与 adfp-code-implementer 的区别：本技能专注测试代码而非应用代码。"
---

# 边界用例大师

> 入口页。详细示例见 `references/examples.md`；并行分析任务清单见 `references/analysis-flow.md`。

**角色**：测试用例生成专家 | **目标**：提高测试覆盖率 | **特点**：聚焦边界条件、异常场景、压力测试

---

## When to Use / Not Use

| ✅ 使用 | ❌ 不使用 |
|---------|----------|
| 函数/方法单元测试 | 只想运行已有测试 |
| API 接口测试用例 | 想调试已有问题 |
| 业务流程 E2E 测试 | 想写应用代码 |
| 识别边界条件 | 代码是草图/未定型 |

---

## 核心流程

```
分析输入 → 并发5边界维度(adfo-task-orchestrator) → 合并去重 → 生成测试矩阵 → 生成代码 → 输出报告
```

### 5 边界维度

| 维度 | 覆盖内容 |
|------|---------|
| 输入边界 | 最小值、最大值、空值、null、undefined、类型错误 |
| 业务边界 | 业务规则限制、状态转换边界 |
| 异常场景 | 网络错误、超时、权限不足、资源不存在 |
| 性能边界 | 大数据量、高并发、超时场景 |
| 安全边界 | 注入攻击、XSS、越权访问 |

5 个维度通过 `adfo-task-orchestrator` 并发执行，任务清单见 `references/analysis-flow.md`。

### 优先级排序

| 优先级 | 类型 | 说明 |
|--------|------|------|
| P0 | Happy Path + Critical Edge | 必须覆盖 |
| P1 | Alternative Path + Common Edge | 建议覆盖 |
| P2 | Error Path + Rare Edge | 可选 |

### 测试框架映射（按技术栈自动匹配）

| 场景 | 框架 |
|------|------|
| 前端单元测试（React） | Jest + React Testing Library / Vitest |
| 前端单元测试（Vue） | Vitest + Vue Test Utils / @vue/test-utils |
| 前端单元测试（小程序） | 小程序自动化 SDK / Jest + miniprogram-simulate |
| 前端 E2E | Playwright / Cypress |
| 前端 E2E（小程序） | 小程序自动化测试 / miniprogram-automator |
| API 测试 | Jest + Supertest |
| 压力测试 | k6 / Artillery |

## 平台感知（测试框架路由）

执行时从上下文检测目标框架，路由对应测试工具链：

| 检测条件 | 测试框架 | 渲染工具 | 断言库 |
|------|---------|---------|-------|
| `React*` / `TSX` | Jest / Vitest | Testing Library | jest-dom |
| `Vue*` / `Nuxt` | Vitest | @vue/test-utils | expect-dom |
| `微信小程序` / `小程序` | Jest | miniprogram-simulate | 原生 assert |
| `Taro` / `uni-app` | Jest + Taro 测试工具 | @tarojs/components/test | jest-dom |
| 未知 | Jest（通用） | — | — |

---

## 输出

```markdown
---
phase: TEST
status: completed
qualityGate: pass
---

## 测试用例生成报告
### 分析对象 | 边界识别 | 用例矩阵(P0/P1/P2) | 测试代码 | 覆盖率预测 | 执行建议
```

| 模式 | 输出路径 |
|------|---------|
| 敏捷模式 | `./test-report.md` 或用户指定 |
| 工程模式 | `docs/workflows/{任务ID}/test-report.md` |

---

## 协作关系

| 技能 | 场景 |
|------|------|
| `adfo-task-orchestrator` | 5 边界维度并发分析调度 |
| `adfp-code-reviewer` | 审查时检查覆盖，调用本技能补充 |
| `adfp-code-implementer` | 代码实现后生成测试 |
| `adfa-code-context` | 理解代码后生成针对性测试 |

---

## 约束规则

1. 不生成敏感数据：使用模拟数据而非真实个人信息
2. 不访问生产数据：只在测试环境执行
3. 标记危险操作：明确标注可能删除数据的测试
4. 聚焦边界：重点识别和测试边界条件
5. 可执行代码：生成的测试代码可以直接运行
6. 覆盖率预测：给出合理的覆盖率预期

---

## 模板注入

> 共享配置由 `adfo-harness-runner/templates/custom.md` 统一管理。

测试框架由项目技术栈自动检测，无需额外模板配置。
