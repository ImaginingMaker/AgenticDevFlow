# 安装与环境

> agent-browser 安装、更新、诊断与自定义浏览器配置。

## 安装方式

```bash
# 推荐：全局安装
npm install -g agent-browser
agent-browser install                     # 首次下载 Chrome for Testing

# 快速试用（无需安装）
npx agent-browser install
npx agent-browser open example.com

# 项目本地依赖
npm install agent-browser
npx agent-browser install

# macOS Homebrew
brew install agent-browser
agent-browser install

# Rust Cargo
cargo install agent-browser
agent-browser install

# 从源码构建
git clone https://github.com/vercel-labs/agent-browser
cd agent-browser && pnpm install && pnpm build && pnpm build:native
./bin/agent-browser install
```

## Linux 依赖

```bash
agent-browser install --with-deps          # 自动安装系统浏览器库依赖
```

## 更新

```bash
agent-browser upgrade                      # 自动检测安装方式并更新
```

## Doctor 诊断

升级后或遇到异常时运行：

```bash
agent-browser doctor                       # 完整诊断（环境、Chrome、守护进程、配置、网络、启动测试）
agent-browser doctor --offline --quick     # 仅本地，最快 <1s
agent-browser doctor --fix                 # 修复性诊断（重装 Chrome、清理旧状态、修复版本不匹配）
agent-browser doctor --webgpu              # 含 WebGPU 渲染探测
agent-browser doctor --json                # 结构化输出
```

`doctor` 每次运行自动清理僵尸 socket/pid/版本文件。破坏性操作需 `--fix`。

## 自定义浏览器

```bash
agent-browser --executable-path /path/to/chromium open example.com
# 或环境变量
AGENT_BROWSER_EXECUTABLE_PATH=/path/to/chromium agent-browser open example.com
```

## AI 编码助手集成

```bash
npx skills add vercel-labs/agent-browser    # 为 Claude Code / Cursor / Copilot 等安装技能
```
