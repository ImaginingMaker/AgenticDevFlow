# ADF 技能命名规范

## 基本规则

### 1. 前缀要求

本项目技能统一以 `adf`（AgenticDevFlow）开头，按类型选择二级前缀：

```
✅ adfp-data-extractor        # 流水线技能
✅ adfa-report-generator      # 辅助技能  
✅ adft-api-client            # 工具技能
✅ adfo-harness-runner        # 编排技能
❌ data-extractor
❌ pi-data-extractor
❌ my-skill
```

### 2. 命名格式

```
adf<type>-<功能描述>
```

- 全小写字母
- 类型字母：`p`(流水线) / `o`(编排) / `a`(辅助) / `t`(工具)
- 单词间用连字符 `-` 连接
- 简洁、描述性、可读性强

### 3. 禁止的格式

| 格式 | 示例 | 状态 |
|------|------|------|
| 无 `adf` 前缀 | `data-extractor` | ❌ |
| 驼峰命名 | `adfp-DataExtractor` | ❌ |
| 下划线 | `adfp_data_extractor` | ❌ |
| 空格 | `adfp data extractor` | ❌ |
| 数字开头 | `adfp-123-extractor` | ❌ |
| 特殊字符 | `adfp-extractor!` | ❌ |

## 命名模式

### 功能描述模式

```
adf<type>-<动词>-<名词>
adf<type>-<名词>-<修饰词>
adf<type>-<领域>-<功能>
```

**示例：**

| 模式 | 技能名 | 用途 |
|------|--------|------|
| 动词-名词 | `adfp-extract-data` | 数据提取 |
| 名词-修饰词 | `adfa-report-daily` | 日报生成 |
| 领域-功能 | `adft-api-auth` | API 认证 |

### 组合命名

多词组合时，按重要性排序：

```
adfp-data-extractor              # 数据 > 提取
adfa-user-auth-validator         # 用户 > 认证 > 验证
adft-log-analyzer-realtime       # 日志 > 分析 > 实时
```

## 命名检查清单

创建技能前检查：

- [ ] 以 `adf` 开头，包含类型字母（p/o/a/t）
- [ ] 全小写字母
- [ ] 使用连字符分隔
- [ ] 无特殊字符
- [ ] 简洁且描述性强
- [ ] 与功能匹配
- [ ] 类型选择正确（流水线/编排/辅助/工具）
