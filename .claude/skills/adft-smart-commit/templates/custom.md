# adft-smart-commit 特有配置

## 项目路径映射

### Source Code 路径（按项目结构调整）

```yaml
# 示例：Electron 项目
source_mappings:
  - pattern: "src/main/**"
    scope: backend
  - pattern: "src/renderer/components/modules/**"
    scope: "<module-name>"
  - pattern: "src/renderer/components/base/**"
    scope: ui-base
  - pattern: "src/renderer/store/**"
    scope: store
  - pattern: "src/renderer/hooks/**"
    scope: hooks
  - pattern: "src/renderer/styles/**"
    scope: style
  - pattern: "src/shared/**"
    scope: shared

# 示例：Next.js 项目
# source_mappings:
#   - pattern: "app/**"
#     scope: "<route>"
#   - pattern: "components/**"
#     scope: ui
#   - pattern: "lib/**"
#     scope: shared
```

### 特殊 Artifact 规则（BMad 等）

```yaml
artifact_mappings:
  enabled: false  # 是否启用特殊 artifact 检测
  rules:
    - pattern: "_bmad-output/planning-artifacts/**"
      type: docs
      scope: planning
    - pattern: "_bmad-output/implementation-artifacts/stories/**"
      type: feat
      scope: story
    - pattern: "_bmad-output/implementation-artifacts/*.yaml"
      type: chore
      scope: sprint
    - pattern: "_bmad-output/implementation-artifacts/*-retro-*.md"
      type: docs
      scope: retro
```

## 分类优先级

默认优先级（按顺序）：

1. Infrastructure（配置、依赖、构建工具）
2. Core Source（业务逻辑、服务、stores）
3. Components（UI 组件，按模块分组）
4. Styles（CSS、主题文件）
5. Tests（测试文件）
6. Documentation（README、文档）
7. Project Artifacts（规划/实现 artifacts）

## 策略参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| quick_commit_max_files | 5 | Quick Commit 最大文件数 |
| quick_commit_max_diff_lines | 300 | Quick Commit 最大 diff 行数 |
| batch_commit_min_categories | 2 | 触发 Batch Commit 的最小类别数 |
| large_diff_threshold | 500 | 大型 diff 警告阈值 |
| 组件聚合 | 启用 | 组件 + CSS Module + 测试 → 同一提交 |
