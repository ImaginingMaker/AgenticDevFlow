# adfa-code-scanner 技能特有配置

## 扫描路径映射（按框架默认值）

| 资产类型 | React | Vue 3 | 微信小程序 | Taro/uni-app |
|---------|-------|-------|-----------|-------------|
| 组件 | `src/components/` | `src/components/` | `components/` | `src/components/` |
| 页面 | `src/pages/` `src/views/` | `src/views/` `src/pages/` | `pages/` | `src/pages/` |
| Hooks/逻辑 | `src/hooks/` `src/utils/` `src/lib/` | `src/composables/` `src/utils/` | `utils/` | `src/hooks/` `src/utils/` |
| API/Service | `src/services/` `src/api/` | `src/api/` `src/services/` | `services/` | `src/services/` `src/api/` |

## 原子化评级阈值

| 评级 | Props 数 | 行数 | 说明 |
|------|---------|------|------|
| 原子（Atom） | ≤ 3 | ≤ 100 行 | 单一职责基础组件 |
| 分子（Molecule） | ≤ 5 | ≤ 200 行 | 2-5 个原子组合 |
| 组织（Organism） | — | > 200 行 | 建议拆分 |
| 候选拆分 | — | > 300 行 | 必须拆分 |

## 忽略模式

默认忽略：
- `node_modules/`
- `dist/` `build/` `.next/` 等构建产物
- 测试文件（`*.test.*` `*.spec.*` `__tests__/`）
- 类型定义文件（`*.d.ts`）
- 第三方库源码

## 相似度评分权重

| 维度 | 权重 | 说明 |
|------|------|------|
| 功能关键词命中 | 40% | 文件名/组件名/函数名与用户描述关键词的重叠度 |
| 结构相似度 | 30% | Props 结构、依赖模式、返回类型的相似性 |
| 导入依赖模式 | 20% | 相同的外部库/工具函数引用 |
| 文件命名模式 | 10% | 目录结构命名风格的匹配度 |
