# 架构设计规范

> **共享配置**：技术栈和目录约定由 `adfo-harness-runner/templates/custom.md` 统一管理，本文件只定义架构特有的规范。

---

## 原子化标准

```yaml
atomicThresholds:
  maxLinesPerFile: 200        # 单文件行数上限
  maxResponsibilities: 1      # 单组件职责数上限
  maxProps: 8                 # Props 数量上限（超过建议拆分）
```

## 禁止项

```yaml
forbidden:
  - ""   # 如："页面组件之间互相引用"
  - ""   # 如："业务组件依赖其他业务模块的私有内容"
  - ""   # 如："components/ 引用 pages/"
```

## SubAgent 配置

```yaml
subAgents:
  enabled: [1, 2, 3, 4, 5]  # 启用的 SubAgent 编号，可选择性关闭部分
  maxConcurrency: 5          # 最大并发数
```
