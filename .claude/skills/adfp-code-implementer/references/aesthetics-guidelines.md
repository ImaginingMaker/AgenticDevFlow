# 前端美学共享规范

`adfp-component-designer`（设计端）和 `adfp-code-implementer`（实现端）共享的美学标准。设计师定义方向，实现者遵循规范。

---

## 一、字体排印（Typography）

- **选择独特、有趣、美丽的字体**，避免通用字体如 Arial、Inter、Roboto、系统默认字体
- **展示字体 + 正文字体配对**：用有辨识度的展示字体做标题，用精致的正文字体做正文
- 通过 `@font-face`、Google Fonts 或 `next/font` 引入字体
- 字体选择应服务于组件设计方案中确定的美学方向

```css
/* 有辨识度的字体选择 */
--font-display: 'Playfair Display', serif;
--font-body: 'Source Serif 4', serif;

/* 避免通用 AI 字体 */
--font-display: 'Inter', sans-serif;  /* 过于常见 */
```

## 二、色彩与主题（Color & Theme）

- **承诺一个统一的美学方向**，使用 CSS 变量保持一致性
- **主导色 + 锐利强调色** 胜过均匀分布的调色板
- 深色主题和浅色主题都可以，但必须一致
- 避免陈词滥调的配色（如紫色渐变配白色背景）

```css
:root {
  --color-primary: /* 主导色 */;
  --color-accent: /* 锐利强调色 */;
  --color-bg: /* 背景 */;
  --color-surface: /* 表面 */;
  --color-text: /* 文本 */;
}
```

## 三、动效（Motion）

- **高影响力时刻优先**：一次精心编排的页面加载动画（带 staggered reveals 和 `animation-delay`）比零散的微交互更能制造愉悦感
- 优先使用 CSS-only 方案（`@keyframes`、`transition`）
- React 项目中可用 `framer-motion` 库
- 使用滚动触发和令人惊喜的悬停状态

```css
/* staggered reveal 示例 */
.card {
  opacity: 0;
  animation: fadeInUp 0.6s ease forwards;
}
.card:nth-child(1) { animation-delay: 0.1s; }
.card:nth-child(2) { animation-delay: 0.2s; }
.card:nth-child(3) { animation-delay: 0.3s; }
```

## 四、空间构成（Spatial Composition）

- **打破预期的布局**：不对称、重叠、对角线流动、跨网格元素
- 宽裕的负空间（极简方向）或受控的密度（极繁方向）
- 不要默认居中排版——考虑偏移、不对称的视觉重心

## 五、背景与视觉细节（Backgrounds & Visual Details）

- **创造氛围和深度**，而非默认纯色背景
- 适当运用：渐变网格、噪点纹理、几何图案、分层透明度、戏剧性阴影、装饰性边框、自定义光标、颗粒叠加
- 细节应与整体美学方向一致，不为加而加

## 六、禁止 AI 模板化美学

以下模式必须避免，它们是 AI 生成代码的典型标志：
- Inter / Roboto / Arial / 系统默认字体
- 紫色渐变 + 白色背景的配色方案
- 可预测的居中卡片布局
- 千篇一律的圆角按钮 + 模糊阴影
- 缺乏上下文特定性的"通用设计"

## 七、复杂度匹配原则

**实现复杂度必须匹配美学愿景：**
- 极繁主义设计 → 需要复杂的代码、大量动画和效果
- 极简/精致设计 → 需要克制、精准、对间距/字体/微妙细节的极致关注
- 优雅来自于把愿景执行到位，而非代码量的多少

---

## 设计端 vs 实现端

| 阶段 | 技能 | 关注点 |
|------|------|--------|
| 设计端 | `adfp-component-designer` | 美学方向声明：风格基调、字体/色彩/空间策略、记忆点、方向如何影响组件拆分 |
| 实现端 | `adfp-code-implementer` | 将美学方向转化为具体 CSS/动画代码，严格遵循本规范，避免 AI 模板化 |

---

## 使用方式

### adfp-component-designer

在 SKILL.md 的「视觉设计方向」章节中引用：
```markdown
> 实现标准见 `adfp-code-implementer/references/aesthetics-guidelines.md`
```

### adfp-code-implementer

在 SKILL.md 的代码生成章节中引用：
```markdown
> 美学实现规范见 `references/aesthetics-guidelines.md`
```
