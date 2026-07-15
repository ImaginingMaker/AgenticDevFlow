# 常见工作流、网络控制与 Iframe/对话框/文件

## 常见工作流

### 登录

```bash
agent-browser open https://app.example.com/login
agent-browser snapshot -i

# 从快照找到邮箱/密码 ref，然后：
agent-browser fill @e3 "user@example.com"
agent-browser fill @e4 "hunter2"
agent-browser click @e5
agent-browser wait --url "**/dashboard"
agent-browser snapshot -i
```

> Shell 历史中会暴露凭据，敏感信息使用 auth vault 或 `--password-stdin`。

### Auth Vault（凭据安全存储）

```bash
# 保存凭据（推荐 --password-stdin 避免 shell 历史）
agent-browser auth save my-app --url https://app.example.com/login \
  --username user@example.com --password-stdin

# 登录
agent-browser auth login my-app           # 自动填充 + 点击 + 等待

# 管理
agent-browser auth list
agent-browser auth show my-app
agent-browser auth delete my-app
```

### 会话持久化（跨重启保留登录态）

```bash
# 登录一次，保存 cookies + localStorage
agent-browser state save ./auth.json

# 后续直接以登录态启动
agent-browser --state ./auth.json open https://app.example.com

# 给已启动的会话加载
agent-browser state load ./auth.json
agent-browser open https://app.example.com/dashboard
```

#### 自动保存/恢复（--restore）

```bash
SESSION="$(agent-browser session id --scope worktree --prefix myapp)"
agent-browser --session "$SESSION" --restore open https://twitter.com

# 登录一次后，状态自动保存
# 浏览器关闭时保存，运行时每 30 秒自动保存
# 后续带相同 --session 和 --restore 即自动恢复

# 可选：恢复时验证
agent-browser --session "$SESSION" --restore --restore-check-text "Dashboard" open twitter.com
```

状态文件可加密：

```bash
# 生成 256 位密钥
openssl rand -hex 32

# 设置加密密钥
export AGENT_BROWSER_ENCRYPTION_KEY=<64位十六进制密钥>

# 此后状态文件自动 AES-256-GCM 加密
```

状态自动过期清理：

```bash
export AGENT_BROWSER_STATE_EXPIRE_DAYS=7    # 7 天后自动删除旧状态
agent-browser state clean --older-than 7    # 手动清理
```

### 提取数据

```bash
# 结构化快照（推荐 AI 解析）
agent-browser snapshot -i --json > page.json

# 定位提取特定元素
agent-browser snapshot -i
agent-browser get text @e5

# 用 JS 提取任意结构化数据（推荐 heredoc 方式）
cat <<'EOF' | agent-browser eval --stdin
const rows = document.querySelectorAll("table tbody tr");
Array.from(rows).map(r => ({
  name: r.cells[0].innerText,
  price: r.cells[1].innerText,
}));
EOF
```

> 推荐用 `eval --stdin`（heredoc）或 `eval -b <base64>` 传递复杂 JS。内联 `eval "..."` 仅适用于简单表达式。

### 截图

```bash
agent-browser screenshot                        # 临时路径，stdout 打印路径
agent-browser screenshot page.png               # 指定路径
agent-browser screenshot --full full.png        # 全页面高度
agent-browser screenshot --annotate map.png     # 标注截图：[N] 对应 @eN

# JPEG 格式 + 质量
agent-browser screenshot --screenshot-format jpeg --screenshot-quality 80 ./page.jpg

# 全局默认配置
export AGENT_BROWSER_SCREENSHOT_DIR="./screenshots"
export AGENT_BROWSER_SCREENSHOT_FORMAT="png"
```

### PDF 导出

```bash
agent-browser pdf page.pdf
```

### 视频录制

```bash
agent-browser open https://example.com
agent-browser record start ./demo.webm
agent-browser snapshot -i
agent-browser click @e3
agent-browser record stop
```

也可以启动录制时直接导航：`agent-browser record start ./demo.webm https://example.com`

CI 中录制证据：

```bash
#!/bin/bash
set -e
cleanup() {
  agent-browser record stop 2>/dev/null || true
  agent-browser close 2>/dev/null || true
}
trap cleanup EXIT

agent-browser open https://app.example.com/login
agent-browser record start "./artifacts/login-flow.webm"
agent-browser snapshot -i
agent-browser fill @e1 "demo@example.com"
agent-browser fill @e2 "password"
agent-browser click @e3
agent-browser wait --url "**/dashboard"
```

输出为 WebM 容器格式，视口使用当前浏览器视口设置，Cookie 从当前会话自动复制。录制会增加自动化开销，长时间录制占用大量磁盘。

### 多标签页管理

```bash
agent-browser tab                     # 列出所有标签页（含稳定 tabId: t1, t2, t3...）
agent-browser tab new https://docs... # 新建标签页（并切换）
agent-browser tab new --label docs https://docs...  # 新建带自定义标签的标签页
agent-browser tab 2                   # 按 ID 切换到标签页 2
agent-browser tab docs                # 按标签切换到 docs
agent-browser tab close 2             # 按 ID 关闭
agent-browser tab close docs          # 按标签关闭
agent-browser window new              # 打开新浏览器窗口
```

`tabId`（如 t1, t2）稳定不变，不在会话内重用。切换标签页后上一标签的快照 ref 不再有效——必须重新 snapshot。

### 多会话并行

每个 `--session <name>` 是独立的浏览器实例，拥有各自的 cookies、标签页和 ref：

```bash
agent-browser --session a open https://app.example.com
agent-browser --session b open https://app.example.com
agent-browser --session a fill @e1 "alice@test.com"
agent-browser --session b fill @e1 "bob@test.com"

# 列出活动会话
agent-browser session list
agent-browser session                    # 当前会话名
```

`AGENT_BROWSER_SESSION=myapp` 可设置当前 shell 默认会话。

### 批量执行（Batch）

```bash
# 参数模式
agent-browser batch "open https://example.com" "snapshot -i" "screenshot"

# JSON 模式（支持 stdin）
echo '[
  ["open", "https://example.com"],
  ["snapshot", "-i"],
  ["click", "@e1"],
  ["screenshot", "result.png"]
]' | agent-browser batch --json

# --bail 选项：首个错误停止
agent-browser batch --bail "open https://example.com" "click @e1" "screenshot"
```

### 命令链

用 `&&` 在单个 shell 调用中链接多条命令：

```bash
agent-browser open example.com && agent-browser wait --load networkidle && agent-browser snapshot -i
agent-browser fill @e1 "user" && agent-browser fill @e2 "pass" && agent-browser click @e3
```

### 预导航设置

在首次导航前准备好路由、Cookie 或初始化脚本：

```bash
agent-browser batch \
  '["open"]' \
  '["network","route","*","--abort","--resource-type","script"]' \
  '["cookies","set","--curl","cookies.curl","--domain","localhost"]' \
  '["navigate","http://localhost:3000/target"]'
```

> `open` 不带 URL 时停留在 `about:blank`，可在首次导航前注册网络路由、注入 Cookie。

## 网络控制

### 请求路由（在请求发送前生效）

```bash
# 拦截特定 URL（需要在导航前设置）
agent-browser open
agent-browser network route "**/analytics/**" --abort           # 阻止
agent-browser network route "**/api/users" --body '{"users":[]}'  # 模拟响应
agent-browser network route "*" --resource-type script --abort  # 仅阻止脚本
agent-browser navigate https://app.example.com                  # 然后导航

# 移除路由
agent-browser network unroute "**/analytics/**"   # 移除特定规则
agent-browser network unroute                      # 移除全部规则
```

> 路由规则在匹配的请求**发送之前**生效。如需要影响首次页面加载，在导航之前设置路由。

### 请求日志

```bash
agent-browser network requests
agent-browser network requests --filter api               # 按 URL 模式过滤
agent-browser network requests --type xhr,fetch           # 按资源类型过滤
agent-browser network requests --method POST              # 按 HTTP 方法过滤
agent-browser network requests --status 2xx               # 按状态码过滤（精确/族/范围）
agent-browser network request <requestId>                 # 查看完整请求/响应详情
agent-browser network requests --clear                    # 清除日志
```

### HAR 导出

```bash
agent-browser network har start
agent-browser open https://app.example.com
agent-browser click @e4
agent-browser network har stop ./trace.har
```

> ⚠️ HAR 文件可能包含请求头、响应体、Cookie、Bearer Token 和 API Key，应作为敏感文件处理。

### SSR / 禁用 JS 调试

```bash
agent-browser batch \
  '["open"]' \
  '["network","route","*","--abort","--resource-type","script"]' \
  '["navigate","http://localhost:3000"]' \
  '["snapshot","-i"]'
```

## Iframe、对话框与文件

### Iframe 处理

Iframe 在快照中自动内联，其 ref 可直接使用（无需手动切换帧）：

```bash
agent-browser snapshot -i
# @e3 [Iframe] "payment-frame"
#   @e4 [input] "Card number"
#   @e5 [button] "Pay"

agent-browser fill @e4 "4111111111111111"    # 直接操作 iframe 内元素
agent-browser click @e5
```

切换到 iframe 以聚焦或处理深度嵌套：

```bash
agent-browser frame @e3          # 按 ref 切换到 iframe
agent-browser frame "#pay"       # 按 CSS 选择器切换
agent-browser snapshot -i        # 仅显示该 iframe 内元素
agent-browser frame main         # 返回主框架
```

> 跨域 iframe 如果屏蔽无障碍树访问会被静默跳过。仅展开一层 iframe 嵌套。

### 弹窗处理

`alert` 和 `beforeunload` 默认自动接受，不会阻塞 Agent。`confirm` 和 `prompt` 需手动处理：

```bash
agent-browser dialog status            # 是否有待处理弹窗（含 warning 字段标注类型和消息）
agent-browser dialog accept             # 接受（确认）
agent-browser dialog accept "text"      # 接受并带 prompt 输入
agent-browser dialog dismiss            # 取消
```

禁用自动处理：`--no-auto-dialog` 或 `AGENT_BROWSER_NO_AUTO_DIALOG=1`

### 文件下载

```bash
agent-browser download @e5 ./report.csv                  # 点击元素触发下载
agent-browser wait --download ./archive.zip --timeout 30000  # 等待异步下载

# 设置默认下载目录
agent-browser --download-path ./downloads open https://app.example.com
# 或 AGENT_BROWSER_DOWNLOAD_PATH=./downloads
```

> 不指定 `--download-path` 时，下载文件存入临时目录，浏览器关闭后清理。

### 本地文件访问

```bash
agent-browser --allow-file-access open file:///path/to/document.pdf
agent-browser --allow-file-access open file:///path/to/page.html
agent-browser screenshot output.png
```

> `--allow-file-access` 仅 Chromium 支持。
