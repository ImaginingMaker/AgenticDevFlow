# adft-agent-browser - 评估用例

## 核心场景

| # | 场景 | 预期行为 | 验证方式 |
|---|------|---------|---------|
| 1 | macOS 浏览器登录态获取 | 使用 `--profile Default --executable-path <真Chrome路径>` 后 Cookie 可解密，页面显示已登录状态 | `snapshot -i` 检查页面元素，不存在 "Sign in" / "登录" 链接 |
| 2 | 浏览器核心工作循环 | `open url → snapshot -i → click @eN → snapshot -i` 顺序执行成功 | 每次点击后重新 snapshot 且 ref 更新 |
| 3 | 会话持久化 | `state save` 后，关闭浏览器再 `--state` 启动，保持登录态 | 再次打开页面后续 snapshot 显示已登录元素 |
| 4 | 数据提取 | 使用 `get text / html / value` 提取页面元素内容 | 返回值与页面显示一致 |
| 5 | 语义化定位器 | 使用 `find text/role/label` 定位并操作元素 | 操作成功后页面状态符合预期 |
| 6 | 截图 | `screenshot [path]` 生成指定路径的 PNG 图片 | 文件存在且非空 |
| 7 | 多标签页管理 | `tab new url → tab N → tab close` 流程执行正确 | 标签页切换和关闭成功 |

## 边界测试

| # | 边界情况 | 预期处理 |
|---|---------|---------|
| 1 | macOS 上未传 `--executable-path` 直接 `--profile` | 页面显示未登录（Cookie 解密失败） |
| 2 | 页面变化后使用旧 ref 点击 | 操作失败，提示 ref 失效，应重新 snapshot |
| 3 | iframe 内元素操作 | snapshot 自动内联 iframe，ref 可直接使用 |
| 4 | `open` 不带 URL | 浏览器启动但停留在 about:blank，可后续设置路由 |
| 5 | 使用不存在的 profile | `--profile nonexistent` 报错提示 profile 不存在 |
| 6 | 同时打开 10+ 标签页 | 标签页列表正确显示所有 tabId |
| 7 | HAR 导出包含敏感信息 | 文件包含请求头/Cookie，提示用户安全处理 |

## 集成测试

| # | 上下游技能 | 集成点 | 预期 |
|---|----------|--------|------|
| 1 | adft-page-wiki-generator | 浏览器截图作为 Wiki 素材 | 截图路径正确传递 |
| 2 | adfo-harness-runner | 作为工具技能被编排器调度 | 不接入流水线阶段，独立使用 |
| 3 | adfa-dev-helper | 被索引为可用工具技能 | dev-helper 推荐列表中含 adft-agent-browser |
