# mode:scan → submode:full — 全量代码扫描

并发 3 个 SubAgent 扫描整个项目，输出组件/逻辑/API 资产清单。

---

## 流程概述

```
接收指令 → 平台检测 → 生成 3 SA 任务清单 → 委托 adfo-task-orchestrator 并发执行 → 汇总整合 → 输出 code-scan-report.md
```

## 3 个 SubAgent

通过 `adfo-task-orchestrator` 并发执行（全部无依赖，最大并发 3）：

| ID | 职责 | 扫描范围 | 产出 |
|----|------|---------|------|
| SA1 | 组件扫描器 | `components/` `pages/` 下的 `.tsx`/`.vue`/`.wxml` 等 | 组件清单 + 原子化评级 + 可复用候选 |
| SA2 | Hooks/逻辑盘点器 | `hooks/` `composables/` `utils/` `lib/` 下的 `.ts`/`.js` | Hook/Util 清单 + 引用次数 + 重复实现检测 |
| SA3 | Service/API 扫描器 | `services/` `api/` `utils/request` 等 API 调用代码 | API 调用清单 + 封装完整性评估 + 改进建议 |

> 各 SA 的详细提示词见 `references/sub-agents-full.md`

### 汇总流程

```
接收 3 SA 结果 → 去重 → 冲突校验 → 按资产类型分组 → 输出扫描报告
```

## 输出产物

```markdown
---
phase: CODE_SCAN
status: completed
qualityGate: pass
---

# {项目名} - 代码资产扫描报告

## 一、组件资产
### 组件清单
| 组件名 | 路径 | 行数 | Props 数 | 原子化评级 | 复用次数 |

### 可复用候选
### 拆分建议

## 二、逻辑资产
### Hook/Util 清单
| 名称 | 路径 | 类型 | 引用次数 | 使用组件 |

### 引用模式分析
### 重复实现检测

## 三、API 资产
### API 调用清单
| 方法 | 端点 | 使用页面/组件 | 封装方式 | 错误处理 |

### 封装完整性评估
### 改进建议
```

## 约束规则

1. **只读不写** — 只分析代码，不修改任何文件
2. 必须通过 `adfo-task-orchestrator` 调度 3 个 SubAgent
3. 原子化评级标准：原子（≤100行, Props≤3）、分子（≤200行, Props≤5）、组织（>200行, 建议拆分）
4. 不输出架构建议（归 adfp-architecture-designer）、不输出重构方案（归 adfa-refactor-advisor）
5. 汇总时标记 SA 间发现的重叠项
