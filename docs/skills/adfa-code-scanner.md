# adfa-code-scanner
> 前端代码扫描与资产盘点专家

## 基本信息

| 属性 | 值 |
|------|-----|
| **名称** | adfa-code-scanner |
| **类型** | 辅助 |
| **前缀** | adfa- |
| **触发词** | 扫描代码、代码扫描、扫描组件、盘点代码、分析项目代码、项目中有哪些组件、找组件、代码审计、代码资产盘点、项目中有什么 |
| **文件位置** | `skills/adfa-code-scanner/SKILL.md` |

## 核心特性

- **双模式运行**：全量扫描（3 SA 并发） + 快速相似匹配（2 SA 并发）
- **代码资产盘点**：组件清单 + 原子化评级、Hooks/Util 清单 + 引用分析、Service/API 调用清单 + 封装评估
- **快速相似匹配**：给定功能描述，Top-5 相似组件/逻辑 + 相似度评分 + 复用建议
- **平台感知**：自动检测框架（React/Vue/小程序/跨端），路由到对应扫描策略
- **只读不写**：只分析代码，不修改任何文件

## 使用方式

```bash
# 全量扫描
"扫描一下项目中有哪些组件"
"盘点项目的代码资产"
"分析项目代码结构"

# 快速相似匹配
"项目中有没有类似的搜索功能"
"找一下用户列表的实现"
"参考一下已有的表单组件"
```

## 依赖关系

| 关系类型 | 技能 | 说明 |
|---------|------|------|
| `上游消费` | `adfp-architecture-designer` | scanner 输出清单作为架构决策的输入（替代原 SA1-SA3） |
| `上游消费` | `adfp-code-implementer` | IMPLEMENT 前扫描可复用资产，避免重复造轮子 |
| `上游消费` | `adfa-refactor-advisor` | 扫描发现混乱模式，refactor-advisor 出重构方案 |
| `互补` | `adfa-code-context` | scanner 宏观编目，code-context 微观追踪单文件 |
| `互补` | `adfa-hooks-extractor` | scanner 盘点所有已有逻辑，hooks-extractor 识别可提取候选 |
| `建议下游` | `adfa-edge-case-master` | scanner 发现 API 封装不完整时推荐 |
| `编排调度` | `adfo-harness-runner` | IMPLEMENT 前可调度本技能扫描现有代码 |
| `委托调度` | `adfo-task-orchestrator` | SA1-SA3（全量模式）或 SA1-快速/SA2-快速（快速模式）通过 orchestrator 并发执行 |

## 流程生命周期

### 全量扫描模式

```
用户触发 → 模式判定(全量) → 平台感知(检测框架)
    → 并发 3 SA(组件/逻辑/API) → 汇总整合(去重+分组) → 输出扫描报告 → 下游推荐
```

### 快速匹配模式

```
用户触发 → 模式判定(快速) → 平台感知(检测框架)
    → 并发 2 SA(组件匹配/逻辑匹配) → 相似度评分 → Top-5 → 输出匹配报告 + 复用建议
```

### 产物状态

| 产物 | 路径（敏捷模式） | 路径（工程模式） |
|------|-----------------|-----------------|
| 全量扫描报告 | `./code-scan-report.md` | `docs/workflows/{任务ID}/code-scan-report.md` |
| 快速匹配报告 | `./component-match.md` | `docs/workflows/{任务ID}/component-match.md` |

### 在流水线中的位置

```
ANALYZE → SPEC → ARCHITECTURE → DESIGN → 【scanner(扫描现有资产)】 → IMPLEMENT → REVIEW
                                            └── 实施前扫描可复用资产
```

## 与现有技能的职责边界

| 技能 | 边界 |
|------|------|
| `adfp-architecture-designer` | scanner **扫描盘点**代码资产，architecture-designer **规划决策**架构方案。architecture-designer 原 SA1-SA3 的扫描任务由本技能替代 |
| `adfa-code-context` | code-context 追踪**单个文件/模块**内部的调用链（微观），scanner 扫描**整个项目**做编目汇总（宏观） |
| `adfa-hooks-extractor` | hooks-extractor 从**给定代码**中识别可提取的逻辑单元，scanner 盘点**所有已有**的逻辑单元及其引用模式 |

## 约束规则

1. 只读不写，不修改任何文件
2. 快速模式仅在已有代码项目适用
3. 全量扫描 3 SA 必须通过 `adfo-task-orchestrator` 并发调度
4. 产物 front-matter：全量扫描 `phase: CODE_SCAN`，快速匹配 `phase: QUICK_MATCH`

## 模板注入

> 共享配置由 `adfo-harness-runner/templates/custom.md` 统一管理。
> `templates/custom.md` — 扫描路径映射、原子化评级阈值、忽略模式、相似度评分权重。

## 测试用例

详见 `test/evals.md`。
