# ComfyUI 节点 Wiki 输出格式规范

> 本文档定义节点 Wiki 的最终产物文件格式、目录组织、元数据规范。

---

## 一、元数据文件 `_metadata.md`

生成在 `docs/nodes-wiki/_metadata.md`，包含 Wiki 全局元信息：

```markdown
# ComfyUI 节点百科 - 元数据

| 属性 | 值 |
|------|-----|
| **ComfyUI 版本** | 0.27.0 |
| **Wiki 版本** | 1.0 |
| **首次生成时间** | 2026-07-14 10:30:00 UTC+8 |
| **最后更新时间** | 2026-07-14 14:30:00 UTC+8 |
| **节点总数** | 312 |
| **已分析节点** | 312 |
| **分析覆盖率** | 100% |
| **技能版本** | adft-comfyui-node-wiki v1.0 |
```

---

## 二、进度索引文件 `_index.json`

```json
{
  "version": "0.27.0",
  "generated_at": "2026-07-14T10:30:00+08:00",
  "updated_at": "2026-07-14T14:30:00+08:00",
  "total_nodes": 312,
  "analyzed_nodes": 312,
  "nodes": [
    {
      "index": 1,
      "node_id": "KSampler",
      "display_name": "KSampler",
      "source_file": "nodes.py",
      "paradigm": "V1",
      "category": "核心节点",
      "subcategory": "sampling",
      "status": "done",
      "error": null
    },
    {
      "index": 63,
      "node_id": "LatentAdd",
      "display_name": "Latent Add",
      "source_file": "comfy_extras/nodes_latent.py",
      "paradigm": "V3",
      "category": "内置扩展",
      "subcategory": "latent/advanced",
      "status": "pending",
      "error": null
    }
  ]
}
```

字段说明：

| 字段 | 类型 | 说明 |
|------|------|------|
| `index` | int | 全局唯一序号，按发现顺序递增 |
| `node_id` | str | 节点唯一标识（V1: 注册key, V3: schema.node_id） |
| `display_name` | str | 显示名称 |
| `source_file` | str | 源文件相对路径 |
| `paradigm` | str | 节点范式：`V1` 或 `V3` |
| `category` | str | 一级分类（核心节点 / 内置扩展 / API节点 / 自定义节点） |
| `subcategory` | str | 二级分类路径（如 `sampling`, `latent/advanced`） |
| `status` | str | `pending` / `done` / `error` |
| `error` | str\|null | 分析错误信息 |

---

## 三、总导航文件 `README.md`

生成在 `docs/nodes-wiki/README.md`，作为 Wiki 入口与导航：

```markdown
# ComfyUI 节点百科

> **版本**: 0.27.0 | **节点总数**: 312 | **最后更新**: 2026-07-14

## 分类索引

### 核心节点 (62)

| 分类文件 | 节点数 | 说明 |
|----------|--------|------|
| [sampling](核心节点/sampling.md) | 2 | KSampler、KSamplerAdvanced |
| [model-loading](核心节点/model-loading.md) | 12 | Checkpoint 加载、UNET 加载、CLIP 加载、LoRA 加载 |
| [vae](核心节点/vae.md) | 6 | VAE 编解码、瓦片编解码、Inpaint 编码 |
| [latent](核心节点/latent.md) | 12 | Latent 创建、缩放、裁剪、合成、旋转 |
| [conditioning](核心节点/conditioning.md) | 14 | 条件平均、区域设置、遮罩、时间步控制 |
| [image](核心节点/image.md) | 12 | 图像加载/保存、缩放、批处理、反色 |
| [controlnet](核心节点/controlnet.md) | 4 | ControlNet 加载与应用 |
| [gligen](核心节点/gligen.md) | 2 | GLIGEN 加载与文本框应用 |

### 内置扩展 (180+)

| 分类文件 | 节点数 | 说明 |
|----------|--------|------|
| ... | ... | ... |

### API 节点 (70+)

| 分类文件 | 节点数 | 说明 |
|----------|--------|------|
| ... | ... | ... |
```

**生成规则**：
- 每行一个分类文件，链接到对应的 `.md` 文件
- 节点数列出该分类下的节点数量
- 说明列列出该分类下的代表性节点（不超过 5 个）

---

## 四、分类文件格式

每个分类文件（如 `核心节点/sampling.md`）的标准格式：

```markdown
# 采样器节点

> **分类路径**: `sampling` | **节点数**: 2 | **来源**: `nodes.py`

## 节点列表

### KSampler

- **分类**：`sampling`
- **来源文件**：`nodes.py` (V1)
- **显示名称**：KSampler
- **功能描述**：使用给定的模型、条件信息和 Latent 输入执行扩散采样，按照指定的采样器和调度器策略生成新的 Latent 输出。这是 ComfyUI 最核心的采样节点。

- **输入参数**：

| 参数名 | 类型 | 必填 | 默认值 | 约束 | 描述 |
|--------|------|------|--------|------|------|
| model | MODEL | 是 | - | - | 用于采样的扩散模型 |
| seed | INT | 是 | 0 | min: 0, max: 18446744073709551615 | 随机种子，控制生成的随机性。相同种子可复现结果 |
| steps | INT | 是 | 20 | min: 1, max: 10000 | 采样步数，步数越多细节越丰富，耗时也越长 |
| cfg | FLOAT | 是 | 8.0 | min: 0.0, max: 100.0, step: 0.1 | Classifier-Free Guidance 强度，值越大越遵循提示词 |
| sampler_name | COMBO | 是 | - | euler/... (动态) | 采样器算法，从内置采样器列表中选择 |
| scheduler | COMBO | 是 | - | normal/... (动态) | 噪声调度器，控制每一步的噪声水平 |
| positive | CONDITIONING | 是 | - | - | 正向提示词条件，来自 CLIPTextEncode 输出 |
| negative | CONDITIONING | 是 | - | - | 负向提示词条件，来自 CLIPTextEncode 输出 |
| latent_image | LATENT | 是 | - | - | 输入 Latent 图像，通常来自 EmptyLatentImage |
| denoise | FLOAT | 是 | 1.0 | min: 0.0, max: 1.0, step: 0.01 | 去噪强度，1.0 表示完全重绘，小于 1.0 则保留部分原图 |

- **输出参数**：

| 参数名 | 类型 | 描述 |
|--------|------|------|
| LATENT | LATENT | 采样后的 Latent 张量，可传入 VAEDecode 生成图像 |

---

### KSamplerAdvanced

...
```

### 格式规则

1. **文件标题**：使用中文描述性标题，对应 subcategory 的人类可读名称
2. **文件头部信息块**：分类路径、节点数、来源文件
3. **节点条目**：每个节点以 `### 节点ID` 开始
4. **参数表格**：始终使用 `| 参数名 | 类型 | 必填 | 默认值 | 约束 | 描述 |` 格式
5. **节点之间**：用 `---` 分隔线分隔
6. **文件末尾**：追加一行 `> *本文档由 adft-comfyui-node-wiki 技能自动生成*`

---

## 五、参数表格列说明

| 列名 | 必填 | 说明 |
|------|------|------|
| 参数名 | ✅ | 参数标识名，通常与源码中的参数名一致 |
| 类型 | ✅ | 展示类型，如 `STRING`、`INT`、`MODEL`、`LATENT` 等 |
| 必填 | ✅ | `是` 或 `否` |
| 默认值 | ✅ | 数值或文本，无默认值时填 `-` |
| 约束 | 否 | 数值范围、枚举值、文件扩展名等限制，无约束时填 `-` |
| 描述 | 否 | 参数的中文描述，无信息时填 `-` |

---

## 六、类型展示统一规范

所有类型标识符在 Wiki 中使用**大写字母**表示，统一映射：

| 源码中的表示 | Wiki 展示 |
|-------------|----------|
| `io.Latent.Input(...)` | `LATENT` |
| `io.Image.Input(...)` | `IMAGE` |
| `io.String.Input(...)` | `STRING` |
| `"MODEL"` (元组) | `MODEL` |
| `("STRING", {...})` | `STRING` |
| `folder_paths.get_filename_list("checkpoints")` | `COMBO` |
| `io.Combo.Input(values=[...])` | `COMBO` |
| `io.File.Input(accept="image/*")` | `IMAGE` |

---

## 七、目录创建规则

Main Agent 根据节点实际分类动态创建目录：

1. 从 `_index.json` 读取所有节点的 `category` 值
2. 对每个唯一 `category`，在 `docs/nodes-wiki/` 下创建同名子目录
3. 对每个唯一的 `subcategory` 路径（取第一段，如 `latent/advanced` → `latent`），在对应子目录下创建 `.md` 文件
4. 若同一路径下的节点数超过 30 个，按 subcategory 第二段拆分为多个文件

**示例映射**：

```
category=核心节点, subcategory=sampling          → 核心节点/sampling.md
category=内置扩展, subcategory=latent/advanced     → 内置扩展/latent.md
category=内置扩展, subcategory=latent/basic        → 内置扩展/latent.md  (合并到同文件)
category=API节点,    subcategory=openai             → API节点/openai.md
```
