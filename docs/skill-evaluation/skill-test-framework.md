# ADF 技能测试框架

## 一、评估维度定义

### 1. 可靠性 (Reliability)
技能能否稳定产出预期结果。

| 子维度 | 权重 | 评估标准 |
|--------|------|----------|
| 触发精准度 | 25% | 触发词能否准确匹配预期场景，无误触发/漏触发 |
| 产物完整性 | 30% | 是否产出声明文件（如 `prd.md`、`spec.md`） |
| 执行稳定性 | 25% | 是否无崩溃/报错/超时 |
| 边界容错 | 20% | 异常输入是否有合理处理 |

### 2. 可控性 (Controllability)
技能是否支持参数控制和行为干预。

| 子维度 | 权重 | 评估标准 |
|--------|------|----------|
| 参数支持 | 30% | 是否接受输入参数（如文件路径、模式选择） |
| 模式切换 | 25% | 是否支持多种运行模式（如 quick/full） |
| 输入边界 | 25% | 是否明确定义输入要求 |
| 输出规范 | 20% | 是否有固定的输出路径/格式 |

### 3. 质量 (Quality)
产物是否达到可用标准。

| 子维度 | 权重 | 评估标准 |
|--------|------|----------|
| 结构完整性 | 30% | 产物是否包含所有必需章节 |
| 内容准确性 | 30% | 内容是否正确、无逻辑错误 |
| 格式规范性 | 20% | 是否符合 Markdown 规范、项目风格 |
| 可操作性 | 20% | 产物是否可直接用于下一阶段 |

---

## 二、评分体系

每个技能总分 100 分，按三个维度加权：

```
总分 = 可靠性得分 × 0.35 + 可控性得分 × 0.30 + 质量得分 × 0.35
```

### 分数等级
- **优秀 (A)**: 90-100 分
- **良好 (B)**: 80-89 分
- **合格 (C)**: 70-79 分
- **待改进 (D)**: 60-69 分
- **不合格 (F)**: < 60 分

---

## 三、测试场景类型

### 1. 正向测试 (Positive)
使用典型输入验证技能核心功能。

**示例**：`adfp-prd-generator`
- 输入：清晰的功能需求描述
- 验证：是否生成结构化 PRD 文档

### 2. 边界测试 (Boundary)
使用极限或临界输入测试边界处理。

**示例**：`adfp-code-reviewer`
- 输入：空文件 / 无代码
- 验证：是否有合理提示而非崩溃

### 3. 异常测试 (Negative)
使用错误输入测试容错能力。

**示例**：`adfp-component-designer`
- 输入：模糊描述（如"做一个按钮"）
- 验证：是否主动澄清而非盲目输出

---

## 四、测试执行流程

```
1. SubAgent 加载技能 SKILL.md
2. SubAgent 按测试场景执行技能
3. SubAgent 检查产物文件
4. SubAgent 按评估维度评分
5. SubAgent 输出测试报告 JSON
```

### 测试报告格式

```json
{
  "skill": "adfp-prd-generator",
  "test_type": "positive",
  "input": "实现一个用户登录页面",
  "reliability": {
    "trigger_precision": 25,
    "output_completeness": 30,
    "execution_stability": 25,
    "boundary_tolerance": 20,
    "score": 100
  },
  "controllability": {
    "parameter_support": 30,
    "mode_switch": 25,
    "input_boundary": 25,
    "output_spec": 20,
    "score": 80
  },
  "quality": {
    "structure": 30,
    "content": 30,
    "format": 20,
    "actionable": 20,
    "score": 85
  },
  "total_score": 88.5,
  "grade": "B",
  "issues": ["缺少参数说明", "产物路径不固定"],
  "improvements": ["增加 --output 参数", "规范产物路径为 docs/prd.md"]
}
```

---

## 五、待测试技能清单

共 16 个 adf 前缀技能：

| # | 技能名称 | 类型 | 测试重点 |
|---|----------|------|----------|
| 1 | adfp-requirement-analyzer | 流水线 | 模糊需求澄清 |
| 2 | adfp-prd-generator | 流水线 | 结构化输出 |
| 3 | adfp-spec-generator | 流水线 | 技术规格完整性 |
| 4 | adfp-architecture-designer | 流水线 | SubAgent 并发 |
| 5 | adfp-component-designer | 流水线 | 组件拆分合理性 |
| 6 | adfp-code-implementer | 流水线 | 代码可运行性 |
| 7 | adfp-code-reviewer | 流水线 | 7 维度审查 |
| 8 | adfo-harness-runner | 编排 | 流水线调度 |
| 9 | adfo-task-orchestrator | 编排 | DAG 并发 |
| 10 | adfa-brainstorm | 辅助 | 创意发散 |
| 11 | adfa-code-context | 辅助 | 调用链追踪 |
| 12 | adfa-critical-explorer | 辅助 | 6 维度批判 |
| 13 | adfa-dev-helper | 辅助 | 场景推荐 |
| 14 | adfa-edge-case-master | 辅助 | 测试用例生成 |
| 15 | adfa-hooks-extractor | 辅助 | Hook 提取 |
| 16 | adfa-refactor-advisor | 辅助 | 重构方案 |