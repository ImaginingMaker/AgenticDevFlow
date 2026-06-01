# 技能文件结构规范

## 目录结构

```
adf<type>-<skill-name>/
├── SKILL.md              # 主文件 (必需, <500行)
├── test/
│   └── evals.md          # 评估用例（必须）
├── templates/
│   └── custom.md         # 技能特有配置（可选）
├── references/           # 参考文档 (>300行需目录)
├── scripts/              # 可执行脚本（可选）
├── agents/               # 子代理指令（可选）
└── assets/               # 静态资源（可选）
```

## 文件体积原则

### SKILL.md

**目标：<500 行**

- 包含核心工作流程
- 引用其他文件而非内联
- 保持指令简洁

**超过 500 行时：**
1. 提取详细说明到 `references/`
2. 提取重复逻辑到 `scripts/`
3. 提取子任务到 `agents/`

### references/

**何时使用：**
- 文档 >300 行需要目录
- 多领域/框架变体
- 详细配置说明

**加载方式：**
```markdown
详见 `references/advanced-config.md`
```

### scripts/

**何时使用：**
- 确定性/重复任务
- 复杂计算逻辑
- 文件转换操作

**示例：**
```python
# scripts/validate.py
def validate_skill_name(name: str) -> bool:
    return name.startswith('adf') and name[3] in 'poat' and name[4] == '-'
```

## 渐进式加载

技能采用三层加载：

1. **元数据层** — name + description（~100 词）
2. **主体层** — SKILL.md 内容（<500 行）
3. **资源层** — 按需加载（无限制）

## 检查清单

- [ ] SKILL.md < 500 行
- [ ] 命名符合 `adf<type>-<name>` 规范
- [ ] 前缀选择正确（p=流水线 / o=编排 / a=辅助 / t=工具）
- [ ] 大文档在 references/ 中有目录
- [ ] test/evals.md 存在
- [ ] 共享配置引用 `adfo-harness-runner/templates/custom.md`
- [ ] 文件引用路径清晰
