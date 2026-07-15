# adft-comfyui-node-wiki 评估测试用例

## 测试目标

验证 ComfyUI 节点 Wiki 技能的各个阶段功能是否正确执行。

---

## 用例 1：首次启动 - 节点发现与索引构建

**输入**：用户首次触发技能，`docs/nodes-wiki/_index.json` 不存在

**期望行为**：
- [ ] Main Agent 启动 code-explorer SubAgent 扫描项目
- [ ] 搜索到 `nodes.py`、`comfy_extras/*.py`、`comfy_api_nodes/*.py`、`custom_nodes/` 下的所有节点定义文件
- [ ] 正确识别 V1 节点（从 `NODE_CLASS_MAPPINGS` 字典 key 中提取）
- [ ] 正确识别 V3 节点（从 `define_schema()` 的 `node_id` 提取）
- [ ] 生成 `_index.json`，包含所有节点，status 均为 `pending`
- [ ] `total_nodes` > 300
- [ ] 每个节点记录包含 index, node_id, source_file, paradigm, category, subcategory

**验收标准**：
- `_index.json` 文件存在且格式正确
- 至少包含 nodes.py 的 62 个核心节点
- 每个 source_file 至少有一个节点记录
- 索引按发现顺序连续递增

---

## 用例 2：V1 节点分析准确性

**输入**：SubAgent 接收 `nodes.py` 中的 CheckpointLoaderSimple 分析任务

**期望行为**：
- [ ] 正确提取 category = `model/checkpoints`
- [ ] 正确提取输入参数 ckpt_name (COMBO, 必填)
- [ ] 正确提取可选参数 config_name (STRING, 默认 "Default")
- [ ] 正确提取输出：MODEL, CLIP, VAE（共 3 个）
- [ ] 功能描述包含 "加载 checkpoint" 语义

**验收标准**：
- 输入参数列表中包含 `ckpt_name`
- 输出参数列表包含 3 项：`MODEL`, `CLIP`, `VAE`
- 必填/选填标注正确
- 功能描述不包含无意义的占位文字

---

## 用例 3：V3 节点分析准确性

**输入**：SubAgent 接收 `comfy_extras/nodes_latent.py` 中的 LatentAdd 分析任务

**期望行为**：
- [ ] 正确提取 node_id = `LatentAdd`
- [ ] 正确提取 category = `model/latent/advanced`
- [ ] 正确提取 search_aliases: ["combine latents", "sum latents"]
- [ ] 正确提取输入：samples1 (LATENT), samples2 (LATENT)
- [ ] 正确提取输出：1 个 LATENT
- [ ] 功能描述反映 "相加" 或 "combine" 语义

**验收标准**：
- 输入参数恰好 2 个，类型均为 LATENT
- 输出参数恰好 1 个，类型为 LATENT
- category 路径完整保留
- search_aliases 信息在描述中有所体现

---

## 用例 4：索引控制 - 分批处理

**输入**：
1. 用户首次执行 "分析前 10 个节点"
2. 用户继续执行 "再分析 10 个节点"

**期望行为**：
- [ ] 第一次：仅分析 index 1-10，11+ 仍为 pending
- [ ] 第二次：从 index 11 开始，分析 11-20
- [ ] 两次间 `_index.json` 的 `updated_at` 正确更新
- [ ] `analyzed_nodes` 计数从 10 → 20

**验收标准**：
- 第一批后 index 1-10 为 done，11+ 为 pending
- 第二批后 index 1-20 为 done，21+ 为 pending
- 不会重复分析已完成的节点
- `updated_at` 时间戳有变化

---

## 用例 5：断点续传

**输入**：模拟在已有部分进度的状态下重新触发技能

**前置条件**：`_index.json` 存在，前 50 个节点 status=done

**期望行为**：
- [ ] Main Agent 读取 `_index.json` 而非重新扫描
- [ ] 自动跳过 status=done 的节点
- [ ] 从第 51 个 pending 节点开始分析
- [ ] 不会丢失已有的分析结果

**验收标准**：
- Phase 0 发现阶段被跳过（使用现有索引）
- 分析的第一个节点 index = 51
- 不会重新写入已存在且正确的分类文件

---

## 用例 6：输出格式校验

**输入**：SubAgent 返回节点分析结果

**期望输出格式**：
- [ ] 每个节点条目以 `### 节点ID` 开始
- [ ] 包含功能描述段落（至少 1 句话）
- [ ] 输入参数表格包含：参数名 | 类型 | 必填 | 默认值 | 约束 | 描述
- [ ] 输出参数表格包含：参数名 | 类型 | 描述
- [ ] 节点间用 `---` 分隔
- [ ] 无未填充的模板占位符（如 `{name}`）
- [ ] COMBO 类型参数标注了选项来源

**验收标准**：
- 生成的 `.md` 文件可被标准 Markdown 解析器正确渲染
- 表格列数一致，无错位
- 所有必填列（参数名、类型、必填、默认值）均有值

---

## 用例 7：错误容忍

**输入**：模拟某个节点分析失败（如源码格式异常）

**期望行为**：
- [ ] 该节点的 status 标记为 `error`，而非阻塞整个批次
- [ ] `_index.json` 中记录 error 信息
- [ ] 同批次其他节点正常完成
- [ ] 用户可在后续会话中重新分析该节点

**验收标准**：
- error 节点的 status = "error"
- error 字段包含描述性错误信息
- 同批次其他节点正常写入 Wiki 文件
- 整体流程未被中断

---

## 用例 8：参数类型映射完整性

**输入**：验证所有常见参数类型能否正确映射到 Wiki 展示类型

**测试数据**：
| 源码类型 | 期望 Wiki 展示 |
|----------|--------------|
| `"INT"` | INT |
| `("FLOAT", {"default": 1.0})` | FLOAT |
| `io.String.Input("text")` | STRING |
| `io.Image.Input("image")` | IMAGE |
| `io.Latent.Input("samples")` | LATENT |
| `io.Model.Input("model")` | MODEL |
| `io.Combo.Input("mode", values=["A","B"])` | COMBO |
| `(folder_paths.get_filename_list("checkpoints"),)` | COMBO |
| `"BOOLEAN"` | BOOLEAN |
| `io.Audio.Input("audio")` | AUDIO |

**验收标准**：
- 所有映射与 `references/node-analysis-rules.md` 中的映射表一致

---

## 用例 9：全量生成完整性

**输入**：用户触发 "一次性生成全部节点Wiki"

**期望行为**：
- [ ] 所有节点 status 最终均为 `done`
- [ ] `analyzed_nodes` == `total_nodes`
- [ ] `README.md` 包含完整分类索引
- [ ] 每个分类文件的节点数与 `_index.json` 统计一致
- [ ] `_metadata.md` 显示覆盖率 100%

**验收标准**：
- 无遗漏节点
- 分类统计准确
- 导航链接可正确跳转到对应文件

---

## 用例 10：增量更新

**输入**：项目新增了节点（如在 `comfy_extras/` 新增了文件），用户触发增量更新

**期望行为**：
- [ ] Phase 0 重新扫描，发现新增节点
- [ ] 新节点追加到 `_index.json`，status = `pending`
- [ ] 已有节点（status=done）保持不变
- [ ] 仅分析新增节点
- [ ] 对应分类文件的节点计数更新

**验收标准**：
- `_index.json` 中新增节点有连续的 index
- 不会重新分析已有节点
- 新增节点的分类文件正确更新
