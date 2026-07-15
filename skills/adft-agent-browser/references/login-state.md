# 获取浏览器登录态

## 问题背景

agent-browser 默认使用 **Chrome for Testing** 作为浏览器引擎。在 macOS 上，这会导致 Cookie 解密失败：

- 真 Google Chrome 的 Bundle ID 为 `com.google.Chrome`，Keychain 条目使用 `Chrome Safe Storage`
- Chrome for Testing 的 Bundle ID 为 `com.google.chrome.for.testing`，Keychain 条目使用 `Chromium Safe Storage`
- 两者使用不同的解密密钥，即使通过 `--profile` 指向真 Chrome 的用户数据目录，Cookie 也无法解密

**即使通过 `--profile` 指向真 Chrome 的用户数据目录，Cookie 也无法解密，页面表现为未登录状态。**

## 标准解决流程

### 步骤 1：关闭已运行的 Chrome

真 Chrome 的用户数据目录同一时间只能被一个进程占用：

```bash
osascript -e 'quit app "Google Chrome"'
```

> 如果不想关闭正在运行的 Chrome，可复制 profile 目录使用（见备选方案 A）。

### 步骤 2：使用 --profile + --executable-path 启动

```bash
agent-browser \
  --profile Default \
  --executable-path "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  open https://www.google.com
```

| 参数 | 含义 |
|------|------|
| `--profile Default` | 使用真 Chrome 的 Default 用户配置目录，创建只读快照，原始文件不会被修改 |
| `--executable-path <path>` | 指定真 Chrome 的二进制路径，确保 Keychain 条目匹配（macOS 必传） |

> `--profile` 会自动创建配置文件的**只读快照**（排除缓存以加速），原始文件永不修改，浏览器关闭时临时副本自动删除。

### 步骤 3：验证登录态

```bash
agent-browser snapshot -i
```

| 快照内容 | 登录态 |
|----------|--------|
| `link "登录"` 或 `link "Sign in"` | ❌ 未登录 |
| `button "Google 账号： XXX (...@gmail.com)"` | ✅ 已登录 |
| 目标网站的账户名/头像/登出按钮 | ✅ 已登录 |

### 步骤 4：使用完毕关闭

```bash
agent-browser close --all
```

## 环境变量持久化（推荐）

```bash
# 添加到 ~/.zshrc
export AGENT_BROWSER_PROFILE="Default"
export AGENT_BROWSER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

设置后一行启动即可：

```bash
agent-browser open https://www.google.com
```

## 跨平台说明

| 平台 | 是否需要 --executable-path | 原因 |
|------|---------------------------|------|
| **macOS** | **必须** | Keychain 条目不匹配，Chrome for Testing 无法解密真 Chrome 的 Cookie |
| **Linux** | 通常不需要 | Cookie 使用不同加密方式（GNOME Keyring / KWallet） |
| **Windows** | 通常不需要 | Chrome for Testing 与真 Chrome 在同一用户下 DPAPI 密钥互通 |

### macOS

- Chrome 路径：`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- Profile 路径：`~/Library/Application Support/Google/Chrome/`

### Linux

```bash
agent-browser --profile Default open https://www.example.com
```

### Windows / WSL

```bash
agent-browser --profile Default \
  --executable-path "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" \
  open https://www.google.com
```

## 备选方案

### 方案 A：复制 Profile 目录（不关闭 Chrome）

```bash
cp -r ~/Library/Application\ Support/Google/Chrome /tmp/chrome-profile-copy

agent-browser \
  --profile /tmp/chrome-profile-copy/Default \
  --executable-path "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  open https://www.google.com
```

> 复制 profile 需要时间（通常几百 MB），Cookie 修改不会同步回原 profile。

### 方案 B：手动注入 Cookie

```bash
agent-browser cookies set --file ./cookies.json
agent-browser open https://www.example.com
```

### 方案 C：手动登录并保存 Auth State

```bash
agent-browser open https://example.com/login
# ... 手动完成登录流程 ...
agent-browser state save ./auth.json

# 后续恢复
agent-browser --state ./auth.json open https://example.com/dashboard
```

### 方案 D：从运行中浏览器导入认证状态（最快绕过登录）

```bash
# 1. 真 Chrome 开启远程调试端口
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --remote-debugging-port=9222

# 2. 在此窗口中登录目标网站

# 3. agent-browser 连接并保存认证状态
agent-browser --auto-connect state save ./my-auth.json

# 4. 关闭远程调试 Chrome（安全风险！）

# 5. 使用已保存的状态
agent-browser --state ./my-auth.json open https://app.example.com/dashboard
```

> ⚠️ `--remote-debugging-port` 暴露完整浏览器控制权，仅限本地可信环境，使用后立即关闭 Chrome。

### 方案 E：持久化配置文件（跨重启保留状态）

```bash
# 使用自定义路径作为持久化配置目录
agent-browser --profile ~/.myapp-profile open https://myapp.com
# 一次登录后，后续可复用（Cookie、localStorage、IndexedDB 等全部保留）
agent-browser --profile ~/.myapp-profile open https://myapp.com/dashboard
```

## 常见问题

**Q: SingletonLock: File exists** — Chrome 正在运行，关闭后重试或使用方案 A。

**Q: 登录态仍然丢失** — 检查 Keychain 中 `Chrome Safe Storage` 条目是否存在；在真 Chrome 中重新登录刷新 Cookie。

**Q: 如何查看可用的 Chrome 配置文件** — `agent-browser profiles` 列出所有可用配置文件。

**Q: --profile 支持哪些浏览器** — Chrome、Chrome Canary、Chromium、Brave。
