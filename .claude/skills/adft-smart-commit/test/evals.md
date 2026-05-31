# adft-smart-commit - 评估用例

## 核心场景

| # | 场景 | 预期行为 | 验证方式 |
|---|------|---------|---------|
| 1 | 1-3个同类文件（同一功能） | Quick Commit，单提交，Conventional Commits 格式 | 检查提交数和消息格式 |
| 2 | 15+文件跨多个类别 | Batch Commit，按分类分组生成多个提交 | 检查分组逻辑和提交数 |
| 3 | 用户说"分类提交" | 强制 Batch Commit，忽略 Quick Commit 条件 | 检查策略覆盖 |
| 4 | 组件+CSS+测试一起变更 | 组件聚合：三文件归入同一提交 | 检查是否合并为一个提交 |

## 边界测试

| # | 边界情况 | 预期处理 |
|---|---------|---------|
| 1 | 无未提交文件 | 提示"工作区干净，无需提交" |
| 2 | 仅一个文件变更 | Quick Commit，自动推断 type/scope |
| 3 | diff > 500 行的大文件 | 添加详细 body，建议拆分 |
| 4 | 无法自动推断类别 | 列出文件让用户指定分类 |
| 5 | 包含敏感文件（.env 等） | 警告不提交敏感文件 |

## 集成测试

| # | 上下游技能 | 集成点 | 预期 |
|---|----------|--------|------|
| 1 | adfo-harness-runner → adft-smart-commit | 流水线 REVIEW 通过后组织提交 | harness 管理阶段，smart-commit 组织 Git 提交 |
| 2 | adfp-code-reviewer → adft-smart-commit | 代码审查通过后提交 | code-reviewer 确认通过，smart-commit 生成提交 |
| 3 | adft-smart-commit → 独立使用 | 用户直接触发提交 | 独立分析未提交文件，生成提交 |
