# 快照机制与浏览器核心操作

## 快照机制

### 什么是快照

`snapshot` 命令返回紧凑的**无障碍树（Accessibility Tree）**，每个可交互元素带有 `@eN` ref 标识符。这比解析完整 DOM 的 token 消耗低一个数量级。

```bash
agent-browser snapshot                    # 完整无障碍树
agent-browser snapshot -i                 # 仅可交互元素（推荐，约 200-400 tokens）
agent-browser snapshot -i -c              # 紧凑模式，移除空结构元素
agent-browser snapshot -d 3               # 限制深度为 3 层
agent-browser snapshot -s "#main"         # 限定 CSS 选择器范围
agent-browser snapshot -i -u              # 链接中包含 href URL
agent-browser snapshot --json             # JSON 格式（token 消耗更大，推荐默认文本格式）
```

### Ref 生命周期（关键）

> ⚠️ **Ref 会在页面变化后立即失效。** 每次导航、DOM 更新、弹窗打开后，必须重新 snapshot 获取新 ref。

```bash
agent-browser click @e4                  # 点击链接，导航到新页面
agent-browser snapshot -i                # 重新快照获取新 ref
agent-browser click @e1                  # 使用新 ref
```

### 标注截图（Annotated Screenshots）

`--annotate` 截图专为多模态模型设计，每个标注 `[N]` 映射到快照 ref `@eN`：

```bash
agent-browser screenshot --annotate ./page.png
# -> [1] @e1 button "Submit"
# -> [2] @e2 link "Home"
# -> [3] @e3 textbox "Email"

agent-browser click @e2                  # 直接使用对应的 ref
```

> 标注截图目前仅 CDP 后端（Chromium/Lightpanda）支持。

### 最佳实践

1. **始终使用 `-i`**：将输出缩减为仅可操作元素
2. **页面变化后立即重新快照**：ref 失效是最高频的交互失败原因
3. **使用 `-s` 限定范围**：聚焦特定页面区域
4. **使用 `-d` 限制深度**：控制复杂页面的输出层级
5. **配合标注截图使用**：当文本快照不足以描述无标签图标、Canvas 内容或视觉布局时

## 核心工作循环

```bash
agent-browser open <url>        # 1. 打开页面
agent-browser snapshot -i       # 2. 获取可交互元素快照
agent-browser click @e3         # 3. 根据快照中的 ref 操作
agent-browser snapshot -i       # 4. 页面变化后重新快照
```

**关键规则：** `@e1`、`@e2` 等 ref 在每次 snapshot 时重新分配。页面一旦发生变化（点击跳转、表单提交、动态渲染、弹窗打开），ref 即失效。**任何交互前必须先重新 snapshot。**

## 读取页面

```bash
agent-browser snapshot                    # 完整无障碍树（详细）
agent-browser snapshot -i                 # 仅可交互元素（推荐，紧凑）

# 获取信息
agent-browser get text @e5               # 提取特定元素文本
agent-browser get text body              # 提取 body 内所有文本
agent-browser get html @e5               # 获取 innerHTML
agent-browser get html body              # 提取 HTML（回退方案）
agent-browser get value @e5              # 获取输入值
agent-browser get attr @e10 href         # 提取属性值
agent-browser get styles @e5             # 获取计算样式
agent-browser get title                   # 页面标题
agent-browser get url                     # 当前 URL
agent-browser get cdp-url                # CDP WebSocket URL
agent-browser get count "a"              # 元素数量
agent-browser get box @e5                # 元素边界框坐标

# Agent 友好的页面读取
agent-browser read                        # 读取当前标签页渲染 DOM
agent-browser read https://example.com    # 直接读取 URL 为 Agent 友好文本
agent-browser read https://example.com --outline    # 紧凑标题大纲
agent-browser read https://docs.example.com --llms index --filter auth  # llms.txt
agent-browser read https://example.com --require-md   # 仅服务端返回 text/markdown 时成功
agent-browser read https://example.com --filter overview  # 按文本筛选章节
```

## 页面导航与状态

```bash
agent-browser open <url>          # 导航到 URL（自动补全 https://）
agent-browser open                # 不传 URL：启动但停留在 about:blank（用于预导航设置）
agent-browser back                 # 后退
agent-browser forward              # 前进
agent-browser reload               # 刷新
agent-browser pushstate /dashboard # SPA 客户端导航（自动检测 Next.js router）
```

## 元素交互

### 鼠标操作

```bash
agent-browser click @e1              # 普通点击
agent-browser click @e1 --new-tab    # 在新标签页中打开链接
agent-browser dblclick @e1           # 双击
agent-browser hover @e1              # 悬停
agent-browser focus @e1              # 聚焦（键盘输入前使用）
agent-browser drag @e1 @e2           # 拖拽
```

### 鼠标细粒度控制

```bash
agent-browser mouse move 100 200     # 移动鼠标到坐标
agent-browser mouse down left        # 按下鼠标按钮
agent-browser mouse up left          # 释放鼠标按钮
agent-browser mouse wheel 100 0      # 滚轮（dy, dx）
```

### 输入操作

```bash
agent-browser fill @e2 "hello"               # 清空后输入
agent-browser type @e2 " world"              # 不清空追加
agent-browser press Enter                     # 在当前焦点按键
agent-browser press Control+a                 # 组合键
agent-browser keydown Shift                   # 按住键
agent-browser keyup Shift                     # 释放键
agent-browser keyboard type "text"            # 原生键盘输入（无选择器，绕过自定义组件拦截）
agent-browser keyboard inserttext "text"      # 注入文本不触发键盘事件
```

### 表单组件

```bash
agent-browser check @e3                  # 选中复选框
agent-browser uncheck @e3                # 取消选中
agent-browser select @e4 "option-value"  # 下拉选择（单选）
agent-browser select @e4 "a" "b"         # 下拉选择（多选）
agent-browser upload @e5 file1.pdf       # 文件上传
agent-browser upload @e5 ./a.png ./b.png # 多文件上传
```

> 元素选择器必须定位到 `<input type="file">` 元素。支持 `multiple` 属性的多文件上传。

### 滚动

```bash
agent-browser scroll down 500            # 向下滚动 500px
agent-browser scroll up 300              # 向上滚动
agent-browser scroll left 200            # 向左滚动
agent-browser scroll right 200           # 向右滚动
agent-browser scroll down 500 --selector "#list"  # 限定元素内滚动
agent-browser scrollintoview @e1         # 滚动到元素可见
```

## 语义化定位器（不依赖快照）

当不想先 snapshot 时，使用语义化定位器：

```bash
agent-browser find role button click --name "Submit"
agent-browser find text "Sign In" click
agent-browser find text "Sign In" click --exact      # 精确匹配
agent-browser find label "Email" fill "user@test.com"
agent-browser find placeholder "Search" type "query"
agent-browser find testid "submit-btn" click
agent-browser find alt "Logo" click
agent-browser find title "Tooltip" click
agent-browser find first ".card" click
agent-browser find last ".item" check
agent-browser find nth 2 ".card" hover
```

以及原始 CSS 选择器（回退方案）：

```bash
agent-browser click "#submit"
agent-browser fill "input[name=email]" "user@test.com"
agent-browser click "button.primary"
```

**优先级：** `snapshot + @eN ref` > `find role/text/label` > CSS 选择器

> 点击失败时如果目标被覆盖，错误会指出覆盖元素名称，例如 `covered by <div#consent-banner>`。

## 等待策略（重要）

Agent 失败的原因中，等待不当比选择器错误更多：

```bash
agent-browser wait @e1                     # 等待元素出现
agent-browser wait 2000                    # 固定等待（最后手段）
agent-browser wait --text "Success"        # 等待文本出现（子串匹配）
agent-browser wait --url "**/dashboard"    # 等待 URL 匹配 glob 模式
agent-browser wait --load networkidle      # 等待网络空闲（导航后推荐）
agent-browser wait --load domcontentloaded # 等待 DOMContentLoaded
agent-browser wait --fn "window.myApp.ready === true"  # 等待 JS 条件
agent-browser wait "#spinner" --state hidden  # 等待元素消失
agent-browser wait --download ./file.zip   # 等待下载完成
```

每次页面变化后，选一个合适的等待：
- 等待特定元素：`wait @ref` 或 `wait --text "..."`
- 等待 URL 变化：`wait --url "**/new-page"`
- SPA 导航通用兜底：`wait --load networkidle`

**避免裸 `wait 2000`**，除非调试中——它会让脚本变慢且不稳定。超时默认 25 秒。

## 元素状态检查

```bash
agent-browser is visible @e5     # 元素是否可见
agent-browser is enabled @e5     # 元素是否可用
agent-browser is checked @e5     # 复选框是否选中
```

## 剪贴板操作

```bash
agent-browser clipboard read             # 读取剪贴板文本
agent-browser clipboard write "Hello"    # 写入文本到剪贴板
agent-browser clipboard copy             # 模拟 Ctrl+C（复制当前选中内容）
agent-browser clipboard paste            # 模拟 Ctrl+V（粘贴到焦点元素）
```

> `copy`/`paste` 发送操作系统快捷键，`write` 直接设置剪贴板内容。
