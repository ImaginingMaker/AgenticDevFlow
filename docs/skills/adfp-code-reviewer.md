# adfp-code-reviewer

> React 代码审查专家。对前端代码进行 7 维度审查：类型安全、React规范、性能与体积、边界处理、代码质量与复用、视觉美学、副作用分析。支持 Git 模式（--commit/--staged/--path/--file），加权评分系统，高频问题模式识别，发现问题后可直接修复。

---

## 1. 基本信息

| 属性 | 值 |
|------|-----|
| **名称** | adfp-code-reviewer |
| **类型** | 流水线技能 |
| **阶段** | REVIEW（在 IMPLEMENT 和 DONE 之间） |
| **前缀** | adfp- |
| **触发词** | 审查代码、code review、帮我review、检查代码、代码质量、看看这段代码、提交前检查、PR审查 |
| **文件位置** | `skills/adfp-code-reviewer/SKILL.md` |

---

## 2. 核心特性

### 2.1 审查模式选择

| 参数 | 用途 |
|------|------|
| `--commit=<hash>` | 审查指定 commit |
| `--staged` | 审查暂存区 |
| `--path=<path>` | 审查指定目录 |
| `--file=<file>` | 审查指定文件 |
| `--focus=<维度>` | 聚焦审查（basic/quality/perf/side-effect） |

### 2.2 七维度审查

| 维度 | 权重 | 检查要点 |
|------|------|---------|
| 类型安全 | 15% | any 类型滥用、类型断言风险、泛型约束缺失、类型定义不完整 |
| React 规范 | 15% | Hooks 规则违反、组件命名规范、Props 类型定义、状态更新方式 |
| 性能与体积 | 15% | 不必要重渲染、内存泄漏风险、bundle 体积优化、懒加载机会 |
| 边界处理 | 15% | 空值/undefined 处理、错误边界、异常捕获、兜底逻辑 |
| 代码质量与复用 | 15% | 重复代码、可提取模式、命名清晰度、职责单一性 |
| 视觉美学 | 10% | 代码格式一致性、注释质量、可读性、结构清晰度 |
| 副作用分析 | 15% | 外部依赖影响、全局状态修改、API 调用影响、事件监听清理 |

### 2.3 加权评分系统

| 等级 | 分数范围 | 质量门状态 | 处理方式 |
|------|---------|-----------|---------|
| 优秀 | 90-100 | PASS | 直接通过，可选优化建议 |
| 良好 | 70-89 | WARN | 通过但建议优化，可选择性修复 |
| 需改进 | <70 | FAIL | 阻塞，必须修复后重新审查 |

### 2.4 高频问题模式识别

自动识别以下高频问题模式：
- 内存泄漏（未清理的订阅、定时器、事件监听）
- 敏感信息泄露（硬编码密钥、日志输出敏感数据）
- 错误被吞（空 catch、未处理的 Promise rejection）
- 竞态条件（异步状态竞争、闭包陷阱）
- 类型安全（any 滥用、类型断言过度）
- 缺少兜底（未处理 null/undefined、边界条件缺失）
- N+1 查询（循环中的异步请求）
- 过宽操作（过度的权限请求、过大的状态更新范围）
- 重复造轮子（已有工具库却手写实现）

### 2.5 直接修复能力

对确定性代码问题自动修复：
- 删除调试遗留（console.log、debugger、注释掉的代码）
- 替换硬编码常量（提取为常量或配置）
- 补充缺失类型（自动推断并添加类型注解）
- 删除不必要嵌套（简化条件判断结构）

---

## 3. 使用方式

```
# 基础审查
"审查代码：src/pages/UserList/"

# Git 模式
"review --staged"                    # 审查暂存区
"帮我 review --commit=HEAD~1"       # 审查最近提交
"审查代码 --path=src/components"    # 审查指定目录
"检查代码 --file=src/utils/helper.ts"  # 审查指定文件

# 聚焦审查
"检查代码质量 --focus=perf"         # 只看性能
"审查代码 --focus=side-effect"      # 只看副作用

# 提交前检查
"提交前帮我检查代码"
"PR审查"
```

---

## 4. 依赖关系

### 4.1 上游依赖（本技能依赖谁）

| 技能 | 关系类型 | 说明 |
|------|---------|------|
| `adfp-code-implementer` | 前置输入 | 接收实现产出的源码作为审查对象 |
| `adfo-harness-runner` | 编排调度 | 工程模式下由 harness 在 REVIEW 阶段调度本技能 |

### 4.2 下游消费（谁依赖本技能）

| 技能 | 关系类型 | 说明 |
|------|---------|------|
| `adfp-code-implementer` | 修复循环 | 审查 FAIL 后回退到 implementer 修复模式，附 blockers 清单 |
| `adfa-refactor-advisor` | 建议下游 | 发现结构性问题时建议调用，输出重构方案 |
| `adfa-code-analysis`（mode:extract） | 建议下游 | 发现可提取 Hook 时建议调用，提取自定义 Hook |
| `adfa-edge-case-master` | 建议下游 | 测试覆盖不足时建议调用，生成边界测试用例 |

---

## 5. 流程生命周期

### 5.1 触发条件

- **自动触发**：harness 在 IMPLEMENT 完成后自动进入 REVIEW 阶段
- **手动触发**："审查代码"、"code review"、"帮我review"、"检查代码"、"提交前检查"、"PR审查"
- **Git 触发**：`review --staged`、`review --commit=HEAD~1`

### 5.2 生命周期图

```
adfp-code-implementer（实现代码）
      ↓
本技能：读取代码 → 委托 adfo-task-orchestrator 并行 7 维度 → 高频模式识别 → 问题分级 → 加权评分 → 直接修复 → 生成报告
      ↓
   ┌─ PASS（≥90，无 critical）→ DONE
   ├─ WARN（≥70）→ 建议优化 → DONE / 可选修复
   └─ FAIL（<70）→ blockers 清单 → adfp-code-implementer 修复模式
                                              ↑                    │
                                              └── 修复循环 ────────┘

异常路径：
  ├─ 空文件/无变更 → 如实告知无需审查
  └─ >10 文件变更 → 标注「简要审查」，优先核心逻辑
```

### 5.3 在完整流水线中的位置

```
INIT → ANALYZE → PRD → SPEC → ARCHITECTURE → DESIGN → IMPLEMENT → 【REVIEW】 → DONE
```

### 5.4 产物状态

| 产物 | 路径 | 内容 | 状态流转 |
|------|------|------|---------|
| 审查报告 | `review-report.md` 或 `docs/workflows/{任务ID}/review-report.md` | 含 qualityGate: pass/warn/fail、问题清单、评分、修复建议 | 创建 → qualityGate 判定 → 归档 / 触发修复 |

---

## 6. 工作流程

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           adfp-code-reviewer 工作流程                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. 读取代码                                                                 │
│     ├─ Git 模式：git diff/diff --staged/show <commit>                       │
│     └─ 文件模式：直接读取指定路径文件                                          │
│                                                                             │
│  2. 委托 adfo-task-orchestrator 并行 7 维度审查                                │
│     ├─ 构建 7 个维度审查任务（无依赖，可并行）                                  │
│     ├─ 每个维度独立 SubAgent 执行                                            │
│     └─ 汇总各维度审查结果                                                    │
│                                                                             │
│  3. 高频模式识别                                                             │
│     ├─ 扫描已知高频问题模式库                                                 │
│     └─ 标记匹配的问题模式                                                    │
│                                                                             │
│  4. 问题分级                                                                 │
│     ├─ critical：阻塞发布，必须修复                                          │
│     ├─ major：影响质量，建议修复                                             │
│     └─ minor：优化建议，可选修复                                             │
│                                                                             │
│  5. 加权评分                                                                 │
│     ├─ 各维度得分 × 权重 = 总分                                              │
│     └─ 根据 critical 数量调整最终等级                                        │
│                                                                             │
│  6. 直接修复                                                                 │
│     ├─ 识别确定性可修复问题                                                  │
│     └─ 自动应用修复（需用户确认）                                             │
│                                                                             │
│  7. 生成报告                                                                 │
│     ├─ 输出 review-report.md                                                │
│     └─ 设置 qualityGate 状态                                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. 与现有技能的职责边界

| 技能 | 职责 | 与本技能边界 |
|------|------|-------------|
| `adfp-code-implementer` | 代码实现与修复 | 本技能审查其产出，FAIL 时回退修复 |
| `adfa-refactor-advisor` | 重构方案设计 | 本技能发现结构性问题后委托，不直接重构 |
| `adfa-code-analysis`（mode:extract） | Hook 提取 | 本技能识别可提取模式后委托，不直接提取 |
| `adfa-edge-case-master` | 测试用例生成 | 本技能发现测试覆盖不足后委托 |
| `adfa-code-analysis`（mode:context） | 代码理解 | 本技能审查质量，code-context 理解逻辑 |
| `adfa-critical-explorer` | 方案批判性分析 | 本技能审查已实现代码，explorer 分析设计方案 |

---

## 8. 约束规则

### 8.1 审查规范

- 不确定的信息标注「待确认」
- 每项检查必须有具体文件/行号引用
- 副作用分析必须追踪下游调用方
- 中文输出

### 8.2 修复规范

- 直接修复仅限确定性修改（无歧义、无副作用）
- 修复前需用户确认
- 修复后更新审查报告

### 8.3 报告规范

- FAIL 时必须输出阻塞项清单和修复建议
- 每个问题包含：文件路径、行号、问题描述、严重级别、修复建议
- 报告末尾包含评分汇总和质量门状态

### 8.4 边界情况

- 空文件/无变更 → 如实告知无需审查
- >10 文件变更 → 标注「简要审查」，优先核心逻辑
- 无法解析的文件 → 跳过并记录原因

---

## 9. 模板注入

### 9.1 共享配置

由 `adfo-harness-runner/templates/custom.md` 统一管理。

### 9.2 特有配置

路径：`skills/adfp-code-reviewer/templates/custom.md`

```yaml
# 审查模式偏好
review_mode: standard  # standard / strict / relaxed

# 阻塞规则
block_on:
  - critical_issues: true
  - security_issues: true
  - type_errors: false

# 忽略规则
ignore_patterns:
  - "**/*.test.ts"
  - "**/*.spec.ts"
  - "**/types/**/*.ts"

# 严重度调整
severity_overrides:
  console_log: minor  # 默认 major，调整为 minor

# 自动修复偏好
auto_fix:
  enabled: true
  require_confirmation: true
  max_fixes_per_run: 10
```

---

## 10. 测试用例

### 10.1 基础审查场景

| 用例 | 输入 | 预期输出 |
|------|------|---------|
| 审查单个文件 | `--file=src/App.tsx` | 单文件审查报告，含评分 |
| 审查目录 | `--path=src/components` | 目录下所有文件审查报告 |
| 审查暂存区 | `--staged` | 暂存文件审查报告 |
| 审查指定提交 | `--commit=abc123` | 该提交变更审查报告 |

### 10.2 评分场景

| 用例 | 条件 | 预期等级 |
|------|------|---------|
| 优秀代码 | 无问题，各维度满分 | PASS（90-100） |
| 良好代码 | 仅 minor 问题 | WARN（70-89） |
| 需改进代码 | 存在 critical 问题 | FAIL（<70） |

### 10.3 高频模式识别场景

| 用例 | 代码特征 | 预期识别 |
|------|---------|---------|
| 内存泄漏 | useEffect 无清理函数 | 标记「内存泄漏」模式 |
| 敏感信息泄露 | 硬编码 API Key | 标记「敏感信息泄露」模式 |
| 错误被吞 | 空 catch 块 | 标记「错误被吞」模式 |
| 类型安全 | any 类型使用 | 标记「类型安全」模式 |

### 10.4 直接修复场景

| 用例 | 输入代码 | 预期修复 |
|------|---------|---------|
| 调试遗留 | `console.log('debug')` | 删除该行 |
| 硬编码常量 | `const timeout = 5000` | 提取为常量 |
| 缺失类型 | `function add(a, b)` | 添加类型注解 |
| 不必要嵌套 | 多层 if 嵌套 | 简化结构 |

### 10.5 下游委托场景

| 用例 | 触发条件 | 预期委托 |
|------|---------|---------|
| 结构性问题 | 重复代码 >3 处 | 委托 `adfa-refactor-advisor` |
| Hook 提取机会 | 可复用状态逻辑 | 委托 `adfa-code-analysis`（mode:extract） |
| 测试覆盖不足 | 无边界测试 | 委托 `adfa-edge-case-master` |

### 10.6 异常处理场景

| 用例 | 输入 | 预期行为 |
|------|------|---------|
| 空文件 | 无代码内容 | 告知「无需审查」 |
| 无变更 | git diff 为空 | 告知「无变更需审查」 |
| 大批量变更 | >10 文件 | 标注「简要审查」，优先核心 |
| 解析失败 | 二进制文件 | 跳过并记录原因 |

---

## 附录：审查报告模板

```markdown
# Code Review Report

## 概览

| 项目 | 值 |
|------|-----|
| 审查范围 | [文件/目录/commit] |
| 文件数量 | N |
| 总评分 | XX/100 |
| 质量门 | PASS / WARN / FAIL |

## 维度评分

| 维度 | 得分 | 权重 | 加权分 |
|------|------|------|--------|
| 类型安全 | XX | 15% | XX |
| React 规范 | XX | 15% | XX |
| 性能与体积 | XX | 15% | XX |
| 边界处理 | XX | 15% | XX |
| 代码质量与复用 | XX | 15% | XX |
| 视觉美学 | XX | 10% | XX |
| 副作用分析 | XX | 15% | XX |

## 问题清单

### Critical（阻塞）

| # | 文件 | 行号 | 问题 | 修复建议 |
|---|------|------|------|---------|
| 1 | ... | ... | ... | ... |

### Major（建议修复）

| # | 文件 | 行号 | 问题 | 修复建议 |
|---|------|------|------|---------|
| 1 | ... | ... | ... | ... |

### Minor（可选优化）

| # | 文件 | 行号 | 问题 | 修复建议 |
|---|------|------|------|---------|
| 1 | ... | ... | ... | ... |

## 高频模式识别

| 模式 | 出现次数 | 涉及文件 |
|------|---------|---------|
| 内存泄漏 | N | file1.tsx, file2.tsx |
| ... | ... | ... |

## 自动修复

以下问题已自动修复：
- [x] 删除 console.log（file.ts:10）
- [x] 提取硬编码常量（file.ts:20）

## 下游建议

- [ ] 建议调用 `adfa-refactor-advisor` 处理结构性问题
- [ ] 建议调用 `adfa-code-analysis`（mode:extract）提取可复用 Hook
- [ ] 建议调用 `adfa-edge-case-master` 补充测试覆盖

---
审查时间：YYYY-MM-DD HH:mm
```

---

### 工程模式调用（Harness 调度）

当被 `adfo-harness-runner` 调度时，遵循两阶模式（context → execute → verify）：

#### 执行前
LLM 已从 `harness-cli context <taskId>` 获取编译上下文，包括：
- **技术栈**：从 `state.json.techStack` 读取的完整技术栈信息
- **产物路径**：`docs/workflows/{taskId}/review-report.md`
- **上游产物**：已完成阶段的产物引用（如 implementation.md）
- **跳过信息**：已跳过阶段的列表及原因

直接按上下文指令执行，**不需要自行读取 state.json**。

#### 执行后
运行 `harness-cli verify <taskId> REVIEW <artifact>` 校验产物：

```bash
node scripts/harness-cli.js verify <taskId> REVIEW docs/workflows/<taskId>/review-report.md
```

LLM 不能跳过此步骤——状态更新由 verify 命令原子写入，包括：
1. 解析 front-matter 的 phase/status/qualityGate
2. 三判定校验：阶段一致性、内容实质性（≥50字符）、qualityGate 值
3. 原子写入 state.json（先写 tmp → mv）
4. 更新 checkpoint（文件 SHA-256 快照）
