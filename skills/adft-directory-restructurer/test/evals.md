# adft-directory-restructurer - 评估用例

## 核心场景

| # | 场景 | 预期行为 | 验证方式 |
|---|------|---------|---------|
| 1 | 单文件移动（将 src/api/user.ts → src/services/user.ts，且 other.ts 引用它） | user.ts 移动到 services/，other.ts 的 import 路径更新为新相对路径 | 文件存在性验证 + other.ts 中 import 路径校验 |
| 2 | 批量目录重塑（按层模式：混合目录 → 规范的 components/pages/hooks/services） | 文件按规则分配到对应目录，所有跨文件引用更新 | 新旧目录树对比 + 全局引用扫描 |
| 3 | 无变化项目（目录已符合按层规范） | 报告"无需变更"，不执行任何文件移动 | 文件列表 md5 对比无变化 |
| 4 | 别名路径项目（tsconfig paths 含 @utils -> src/utils） | 文件移动后，别名引用保持不变（@utils/xxx 仍正确），或同步更新 tsconfig | tsconfig paths 检查 |
| 5 | 用户自定义映射规则（"把 helpers/ 归入 utils/, api/ 归入 services/"） | 按用户规则覆盖默认映射 | 映射表检验 |

## 边界测试

| # | 边界情况 | 预期处理 |
|---|---------|---------|
| 1 | 目标目录不存在 | 自动创建目标目录 |
| 2 | 重名文件冲突（两个目录各有一个 Button.tsx） | 检测冲突并提示用户选择：保留两者 / 合并 / 重命名 |
| 3 | 跨仓库引用（import 引用 outside project 的路径） | 不做 reference 更新，记录到报告 ⚠️ 项 |
| 4 | 循环依赖（A → B → C → A） | 不影响文件移动（只变路径不变内容），引用路径正确解析 |
| 5 | 目标目录是空目录或只有无关文件 | 报告"无明显可优化项"，询问用户是否继续 |
| 6 | 用户指定了不存在的目录 | 提示目录不存在，列出当前项目可用目录 |
| 7 | 项目没有 package.json | 询问确认是否为前端项目，若不是则建议中止 |
| 8 | 文件内容中包含字符串形式的旧路径（如注释、字符串常量） | 仅更新 import/require 语句，不修改注释和字符串常量中的路径 |
| 9 | CSS 中引用相对路径图片 | 重新计算 CSS 中的 url() 相对路径 |
| 10 | 入口文件（package.json main 配置）被匹配到移动规则 | 不自动移动入口文件，标注为 protected 并询问用户 |

## 集成测试

| # | 上下游技能 | 集成点 | 预期 |
|---|----------|--------|------|
| 1 | adfp-architecture-designer → adft-directory-restructurer | architecture 输出的文件层级蓝图作为本技能的输入规范 | 本技能读取 architecture.md 的目录蓝图作为映射规则 |
| 2 | adft-directory-restructurer → adft-smart-commit | 目录重塑完成后建议用户提交 | 报告末尾推荐使用 adft-smart-commit 组织提交 |
| 3 | adft-directory-restructurer → adfp-code-reviewer | 目录重塑后建议代码审查 | 报告末尾推荐运行 adfp-code-reviewer 检查引用完整性 |

## 测试数据要求

测试验证需提供一个最小项目作为测试夹具（fixture）：

```
test-fixture/
├── src/
│   ├── api/
│   │   └── user.ts          # 应 → services/user.ts
│   ├── common/
│   │   ├── Header.tsx       # 应 → components/ui/Header/index.tsx
│   │   └── Button.tsx       # 应 → components/ui/Button/index.tsx
│   ├── pages/
│   │   ├── index.tsx
│   │   └── about.tsx
│   ├── hooks/
│   │   └── useAuth.ts
│   ├── utils/
│   │   ├── format.ts
│   │   └── helpers.ts
│   ├── styles/
│   │   └── global.css
│   ├── config.ts            # 应 → constants/config.ts
│   └── types.ts             # 应 → types/index.ts
├── tsconfig.json
└── package.json
```

### 引用关系测试数据

```typescript
// src/pages/index.tsx
import { fetchUsers } from '../api/user';           // 应更新为 '../services/user'
import Header from '../common/Header';               // 应更新为 '../components/ui/Header'
import { useAuth } from '../hooks/useAuth';          // 保持不变
import { formatDate } from '../utils/format';        // 保持不变
import '../styles/global.css';                        // 保持不变

// src/common/Header.tsx
import Button from './Button';                        // 应更新为 './Button'（同目录）
// 注意：Button 也移到 components/ui/Button/，相对路径不变

// src/api/user.ts
import { apiClient } from '../utils/http';           // 移动到 services/ 后应更新为 '../utils/http'
```
