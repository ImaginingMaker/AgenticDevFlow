# agent-browser 完整命令速查表

## 全局选项

| 选项 | 说明 |
|------|------|
| `--session <name>` | 隔离的浏览器会话 |
| `--restore [name]` | 自动保存/恢复会话状态 |
| `--profile <path>` | 持久浏览器配置文件目录或 Chrome profile 名 |
| `--state <path>` | 从 JSON 文件加载存储状态 |
| `--headers <json>` | 作用于 URL 来源的 HTTP 头 |
| `--executable-path <path>` | 自定义浏览器可执行文件（macOS 登录态必传） |
| `--extension <path>` | 加载浏览器扩展（可重复） |
| `--init-script <path>` | 注册页面初始化脚本（可重复） |
| `--enable <feature>` | 内置功能（如 react-devtools） |
| `--args <args>` | 浏览器启动参数（逗号分隔） |
| `--user-agent <ua>` | 自定义 User-Agent |
| `--proxy <url>` | 代理服务器 URL |
| `--ignore-https-errors` | 忽略 HTTPS 证书错误 |
| `--allow-file-access` | 允许 file:// URL |
| `--hide-scrollbars <bool>` | 无头模式隐藏原生滚动条 |
| `--device <name>` | 设备模拟（如 "iPhone 15 Pro"） |
| `--json` | JSON 输出 |
| `--headed` | 显示浏览器窗口 |
| `--webgpu` | 启用 WebGPU |
| `--cdp port/url` | 通过 CDP 连接 |
| `--auto-connect` | 自动发现并连接运行中的 Chrome |
| `--color-scheme <scheme>` | dark / light / no-preference |
| `--download-path <path>` | 默认下载目录 |
| `--content-boundaries` | 页面输出加边界标记 |
| `--max-output <chars>` | 页面输出截断至 N 字符 |
| `--allowed-domains <list>` | 域名白名单（逗号分隔） |
| `--action-policy <path>` | 操作策略 JSON 文件 |
| `--confirm-actions <list>` | 需确认的操作类别 |
| `--idle-timeout <time>` | 守护进程空闲自动关闭（10s, 3m, 1h） |
| `--no-auto-dialog` | 禁用对话框自动接受 |

## 核心命令

| 命令 | 说明 |
|------|------|
| `open <url>` | 打开并导航（别名：goto, navigate） |
| `open` | 启动但不导航（停留在 about:blank） |
| `read [url]` | Agent 友好的页面文本读取 |
| `snapshot [-i] [-c] [-d N] [-s sel] [-u]` | 无障碍树快照 |
| `click <@ref\|sel>` | 点击（`--new-tab` 新标签页打开） |
| `dblclick <@ref>` | 双击 |
| `fill <@ref> <text>` | 清空并填入 |
| `type <@ref> <text>` | 追加文本 |
| `press <key>` | 按键 |
| `keydown/keyup <key>` | 按住/释放键 |
| `keyboard type/inserttext <text>` | 键盘级别输入 |
| `hover <@ref>` | 悬停 |
| `focus <@ref>` | 聚焦 |
| `select <@ref> <val>` | 下拉选择 |
| `check <@ref>` / `uncheck <@ref>` | 选中/取消 |
| `upload <@ref> <files>` | 上传文件 |
| `scroll <dir> [px]` | 滚动 |
| `scrollintoview <@ref>` | 滚动到可见 |
| `drag <src> <dst>` | 拖拽 |
| `download <@ref> <path>` | 下载文件 |
| `screenshot [path]` | 截图（`--full` / `--annotate`） |
| `pdf <path>` | 导出 PDF |
| `back` / `forward` / `reload` | 导航 |
| `pushstate <url>` | SPA 客户端导航 |
| `eval <js>` | 运行 JavaScript |
| `close [--all]` | 关闭浏览器（别名：quit, exit） |
| `connect port/url` | 通过 CDP 连接 |
| `batch <cmds...>` | 批量执行 |

## 获取信息

| 命令 | 说明 |
|------|------|
| `get text <sel>` | 获取文本 |
| `get html <sel>` | 获取 innerHTML |
| `get value <sel>` | 获取输入值 |
| `get attr <sel> <name>` | 获取属性 |
| `get styles <sel>` | 获取计算样式 |
| `get title` / `get url` / `get cdp-url` | 标题 / URL / CDP URL |
| `get count <sel>` | 匹配元素计数 |
| `get box <sel>` | 元素边界框 |

## 查找元素

| 命令 | 说明 |
|------|------|
| `find role <role> <action>` | 按 ARIA 角色定位（`--name` 过滤） |
| `find text <text> <action>` | 按文本定位（`--exact` 精确） |
| `find label <label> <action>` | 按标签定位 |
| `find placeholder <ph> <action>` | 按占位符定位 |
| `find testid <id> <action>` | 按 data-testid 定位 |
| `find first/last/nth <sel> <action>` | CSS 选择器定位 |

## 等待

| 命令 | 说明 |
|------|------|
| `wait <@ref\|ms>` | 等待元素/时间 |
| `wait --text <text>` | 等待文本 |
| `wait --url <glob>` | 等待 URL |
| `wait --load networkidle` | 等待网络空闲 |
| `wait --fn <js>` | 等待 JS 条件 |
| `wait "#spinner" --state hidden` | 等待元素消失 |
| `wait --download [path]` | 等待下载 |

## 标签页与框架

| 命令 | 说明 |
|------|------|
| `tab` | 列出所有标签页 |
| `tab new [url]` | 新建标签页 |
| `tab <id\|label>` | 切换标签页 |
| `tab close <id\|label>` | 关闭标签页 |
| `window new` | 新浏览器窗口 |
| `frame <sel\|@ref>` / `frame main` | 切换/返回框架 |

## 调试

| 命令 | 说明 |
|------|------|
| `console [--json\|--clear]` | 控制台消息 |
| `errors [--clear]` | 页面错误 |
| `dialog accept/dismiss/status` | 对话框处理 |
| `highlight <sel>` | 高亮元素 |
| `inspect` | 打开 Chrome DevTools |
| `trace start/stop` | Chrome 追踪 |
| `profiler start/stop` | 性能分析 |
| `record start/stop/restart` | 视频录制 |
| `doctor [--fix\|--json]` | 诊断 |

## 设置

| 命令 | 说明 |
|------|------|
| `set viewport <w> <h> [s]` | 设置视口 |
| `set device <name>` | 模拟设备 |
| `set geo <lat> <lng>` | 地理位置 |
| `set offline on/off` | 离线模式 |
| `set headers <json>` | 额外 HTTP 头 |
| `set credentials <u> <p>` | HTTP 基本认证 |
| `set media dark/light` | 颜色方案 |

## 认证与状态

| 命令 | 说明 |
|------|------|
| `auth save/list/show/delete` | 认证保险库 |
| `state save/load/list` | 状态管理 |
| `cookies [set/clear]` | Cookie 管理 |
| `storage local/session` | 本地/会话存储 |
| `session/list` | 会话管理 |
| `profiles` | 列出可用 Chrome 配置文件 |

## 网络

| 命令 | 说明 |
|------|------|
| `network route/unroute` | 请求路由 |
| `network requests` | 请求日志 |
| `network request <id>` | 请求详情 |
| `network har start/stop` | HAR 录制 |

## 流式传输

| 命令 | 说明 |
|------|------|
| `stream enable/disable/status` | WebSocket 流管理 |

## 差异对比

| 命令 | 说明 |
|------|------|
| `diff snapshot` | 快照差异 |
| `diff screenshot --baseline <file>` | 截图差异 |
| `diff url <url1> <url2>` | URL 差异 |

## React / Web Vitals

| 命令 | 说明 |
|------|------|
| `react tree/inspect/renders/suspense` | React 检查 |
| `vitals [url]` | Web Vitals |

## 诊断

| 命令 | 说明 |
|------|------|
| `doctor [--fix\|--offline\|--json]` | 环境诊断 |
| `close [--all]` | 关闭浏览器 |
