# adfa-ux-interaction-checker - 自定义模板

> 编辑此文件注入项目特定的交互规范和检查维度开关。

## 环境检测配置

```yaml
detection:
  # 默认模式: smart | manual
  default-mode: smart

  # 手动指定环境: mini-program | web | universal | auto
  # auto 表示自动检测
  override: auto

  # 通用核心维度（无法检测时默认加载）
  core-dimensions:
    - navigation-tabs
    - form-validation
    - user-feedback
    - layout-display
    - data-consistency

  # 当检测到小程序时额外加载的可选维度
  optional-for-mini-program:
    - timing-race
    - component-consistency
```

## 检查维度开关

默认全部开启，设为 `false` 可跳过该维度：

```yaml
dimensions:
  navigation-tabs: true      # 维度 1：导航与 Tab 切换
  form-validation: true      # 维度 2：表单与输入校验
  user-feedback: true        # 维度 3：用户操作反馈
  layout-display: true       # 维度 4：布局与显示
  data-consistency: true     # 维度 5：数据与状态一致性
  timing-race: true          # 维度 6：时序与竞态
  mouse-keyboard: true       # 维度 7：鼠标与键盘交互
  page-routing: true         # 维度 8：页面加载与路由
  component-consistency: true # 维度 9：组件级交互一致性
  network-errors: true       # 维度 10：网络与异常场景
  mini-program: true         # 维度 11：微信小程序特有场景
  web-compatibility: true    # 维度 12：跨平台与 Web 兼容
```

## 组织级交互规范

在此添加团队/项目特有的交互规范，检查时自动追加检查项：

```yaml
custom-rules:
  - description: "项目特有规范描述"
    severity: P1
    dimension: navigation-tabs
```

## 检查策略

```yaml
strategy:
  # 默认检查模式
  default-mode: scenario     # scenario | full-scan | code-level
  # 跳过已确认的检查项（避免重复报告）
  skip-confirmed: true
```
