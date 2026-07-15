# ComfyUI 节点分析规则

> 本文档定义 SubAgent 分析 ComfyUI 节点源码时的详细规则，覆盖 V1 和 V3 两种节点范式。

---

## 一、识别的两种节点范式

### V1 节点（经典模式）

V1 节点继承自 `ComfyNodeABC`，通过类属性声明接口：

```python
class CheckpointLoaderSimple(ComfyNodeABC):
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "ckpt_name": (folder_paths.get_filename_list("checkpoints"), {"tooltip": "The name of the checkpoint (model) to load."}),
            },
            "optional": {
                "config_name": ("STRING", {"default": "Default"}),
            }
        }
    RETURN_TYPES = ("MODEL", "CLIP", "VAE")
    RETURN_NAMES = ("模型", "CLIP", "VAE")
    FUNCTION = "load_checkpoint"
    CATEGORY = "model/checkpoints"
    OUTPUT_NODE = False
```

**分析要点：**

| 属性 | 提取方式 | 说明 |
|------|----------|------|
| 节点 ID | `NODE_CLASS_MAPPINGS` 字典的 key 或 `__name__` | 全局唯一标识 |
| 分类 | `CATEGORY` 类属性 | 如 `"model/checkpoints"` |
| 显示名称 | `NODE_DISPLAY_NAME_MAPPINGS` 中的映射值 | 若无映射则使用节点 ID |
| 输入参数 | `INPUT_TYPES()` 返回的 dict | 分 `required` 和 `optional` 两组 |
| 输出参数 | `RETURN_TYPES` + `RETURN_NAMES` | 两者按位置对应 |
| 执行函数 | `FUNCTION` | 指向类方法名 |
| 是否输出节点 | `OUTPUT_NODE` | 若为 True 则在描述中注明 |

**输入参数解析子规则：**

`INPUT_TYPES()` 返回值结构：
```python
{
    "required": { "param_name": (type_spec, options_dict) },
    "optional": { "param_name": (type_spec, options_dict) },
    "hidden": { "param_name": type_spec }
}
```

- `type_spec` 是类型标识符，如 `"STRING"`、`"INT"`、`"FLOAT"`、`"LATENT"`、`"MODEL"`、`"CLIP"`、`"VAE"`、`"CONDITIONING"`、`"IMAGE"`、`"MASK"`、`"CONTROL_NET"` 等
- 特殊类型 `(folder_paths.get_filename_list("checkpoints"),)` → 类型标注为 `COMBO`（下拉选择），值为文件列表
- 整数范围：`("INT", {"default": 20, "min": 1, "max": 10000})` → 分别提取 type、default、min、max
- 浮点范围：`("FLOAT", {"default": 1.0, "min": 0.0, "max": 10.0, "step": 0.1})` → 提取 step
- 布尔：`("BOOLEAN", {"default": False})` → 布尔开关
- `tooltip` 字段 → 提取为参数描述
- `image_upload` / `audio_upload` / `video_upload` / `model_upload` 字段 → 标注可上传媒体类型
- `image_generate_*` / `video_generate_*` 等 → 标注可生成媒体类型
- `lazy=True` → 标注该参数支持懒加载

### V3 节点（新版 API）

V3 节点继承自 `io.ComfyNode`，通过 `define_schema()` 声明接口：

```python
class LatentAdd(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return io.Schema(
            node_id="LatentAdd",
            display_name="Latent Add",
            search_aliases=["combine latents", "sum latents"],
            category="model/latent/advanced",
            inputs=[
                io.Latent.Input("samples1"),
                io.Latent.Input("samples2"),
            ],
            outputs=[
                io.Latent.Output(),
            ],
            deprecation=io.DeprecationInfo(replacement="LatentBlend"),
        )

    @classmethod
    def execute(cls, samples1, samples2) -> io.NodeOutput:
        ...
```

**分析要点：**

| 属性 | 提取方式 | 说明 |
|------|----------|------|
| 节点 ID | `schema.node_id` 或 `schema.node_type` | 全局唯一标识 |
| 显示名称 | `schema.display_name` | 若无则为 `node_id` |
| 分类 | `schema.category` | 如 `"model/latent/advanced"` |
| 描述 | `schema.description` | 节点用途说明（如存在） |
| 搜索别名 | `schema.search_aliases` | 辅助搜索关键词 |
| 输入参数 | `schema.inputs` 列表 | 每个是 `io.XXX.Input("name", **kwargs)` |
| 输出参数 | `schema.outputs` 列表 | 每个是 `io.XXX.Output(**kwargs)` |
| 弃用信息 | `schema.deprecation` | 如存在，标注 replacement |
| 实验性 | `schema.experimental` | 如存在，标注为实验性节点 |

**V3 输入参数类型映射：**

| io 类型 | Wiki 展示类型 | 说明 |
|---------|-------------|------|
| `io.String.Input(...)` | `STRING` | 文本输入 |
| `io.Int.Input(...)` | `INT` | 整数输入 |
| `io.Float.Input(...)` | `FLOAT` | 浮点数输入 |
| `io.Boolean.Input(...)` | `BOOLEAN` | 布尔开关 |
| `io.Latent.Input(...)` | `LATENT` | 潜在空间张量 |
| `io.Image.Input(...)` | `IMAGE` | 图像张量 |
| `io.Mask.Input(...)` | `MASK` | 遮罩张量 |
| `io.Model.Input(...)` | `MODEL` | 模型 |
| `io.Clip.Input(...)` | `CLIP` | CLIP 文本编码器 |
| `io.Vae.Input(...)` | `VAE` | VAE 编解码器 |
| `io.Conditioning.Input(...)` | `CONDITIONING` | 条件向量 |
| `io.ControlNet.Input(...)` | `CONTROL_NET` | ControlNet |
| `io.Audio.Input(...)` | `AUDIO` | 音频 |
| `io.StyleModel.Input(...)` | `STYLE_MODEL` | 风格模型 |
| `io.Guider.Input(...)` | `GUIDER` | 引导器 |
| `io.Sigmas.Input(...)` | `SIGMAS` | 噪声调度 |
| `io.Any.Input(...)` | `ANY` | 任意类型 |
| `io.Combo.Input(...)` | `COMBO` | 下拉选择（从 values 提取选项） |
| `io.File.Input(...)` | `FILE` / `IMAGE` | 文件上传，按 accept 属性细分 |
| `io.Json.Input(...)` | `JSON` | JSON 数据 |

**V3 输入参数额外属性提取：**

- `default=` → 默认值
- `min=` / `max=` / `step=` → 数值约束
- `tooltip=` → 参数描述
- `required=True/False` → 是否必填（默认必填）
- `lazy=True` → 懒加载
- `control_after_generate=True` → 生成后控制参数
- `image_upload=True` / `image_generate=True` → 图像能力
- `video_upload=True` / `video_generate=True` → 视频能力

---

## 二、功能描述推断规则

### 优先级排序（从高到低）

1. **显式文档字段**
   - V3: `schema.description` 字段 → 直接使用
   - V1: 类或 `FUNCTION` 方法的 docstring → 直接使用

2. **搜索别名语义**（V3）
   - `search_aliases` 中的关键词 → 辅助理解节点用途
   - 例：`search_aliases=["combine latents", "sum latents"]` → 推断该节点是"将两个 Latent 相加合并"

3. **节点 ID 语义推断**
   - 拆解驼峰/下划线命名：
     - `VAEDecode` → VAE + Decode → "使用 VAE 将 Latent 解码为图像"
     - `CheckpointLoaderSimple` → Checkpoint + Loader + Simple → "简化版 checkpoint 加载器"
     - `LatentBlend` → Latent + Blend → "混合两个 Latent"
   - 常见模式映射：
     - `*Loader` → 加载器
     - `*Saver` / `*Save` → 保存器
     - `*Encode` → 编码器
     - `*Decode` → 解码器
     - `*Apply` → 应用器
     - `*Merge` → 合并器
     - `*Blend` → 混合器
     - `*Crop` → 裁剪
     - `*Scale` → 缩放
     - `*Batch` → 批次操作

4. **execute() 方法逻辑分析**
   - 阅读核心逻辑推断功能
   - 注意关键操作：`torch.cat`（拼接）、`+`（相加）、`reshape`（变换）、`upscale`（放大）
   - 关键库调用：`comfy.sample.sample()` → 采样，`comfy.sd.load_checkpoint()` → 加载模型

5. **同文件上下文推断**
   - 相邻节点的命名模式 → 理解同类操作的不同变体
   - 例：`LatentAdd`、`LatentSubtract`、`LatentMultiply` 在同一文件 → 一系列数学操作

### 功能描述模板

```
{核心动作}，{作用对象/数据}，{目的/效果}。
```

示例：
- "将两个 Latent 张量逐元素相加，用于组合不同来源的潜在空间表示。"
- "加载 Stable Diffusion checkpoint 模型文件，分离并输出 MODEL、CLIP 和 VAE 组件。"
- "使用 ControlNet 对模型的条件信号施加空间控制，支持遮罩和强度调节。"

---

## 三、输出参数类型映射

### V1 输出类型

`RETURN_TYPES` 元组中的类型字符串直接映射：

| RETURN_TYPES 值 | Wiki 展示类型 |
|-----------------|-------------|
| `"MODEL"` | `MODEL` |
| `"CLIP"` | `CLIP` |
| `"VAE"` | `VAE` |
| `"LATENT"` | `LATENT` |
| `"IMAGE"` | `IMAGE` |
| `"MASK"` | `MASK` |
| `"CONDITIONING"` | `CONDITIONING` |
| `"CONTROL_NET"` | `CONTROL_NET` |
| `"STYLE_MODEL"` | `STYLE_MODEL` |
| `"CLIP_VISION"` | `CLIP_VISION` |
| `"GLIGEN"` | `GLIGEN` |
| `"AUDIO"` | `AUDIO` |
| `"VHS_AUDIO"` | `AUDIO` |
| `"STRING"` | `STRING` |
| `"INT"` | `INT` |
| `"FLOAT"` | `FLOAT` |

### V3 输出类型

`io.XXX.Output()` 的 XXX 部分映射为展示类型，规则同输入的类型映射表（见上文 V3 输入参数类型映射）。

---

## 四、SubAgent 输出模板

每个 SubAgent 在分析完分配给它的节点后，必须按以下格式输出：

```markdown
## 批次分析结果: {source_file} (节点 {start_index}-{end_index})

### 节点ID（如 KSampler）

- **分类**：`sampling`
- **来源文件**：`nodes.py` (V1)
- **显示名称**：KSampler
- **功能描述**：使用给定的模型、条件信息和 Latent 输入执行扩散采样，生成新的 Latent 输出。
- **输入参数**：

| 参数名 | 类型 | 必填 | 默认值 | 约束 | 描述 |
|--------|------|------|--------|------|------|
| model | MODEL | 是 | - | - | 用于采样的扩散模型 |
| seed | INT | 是 | 0 | min: 0, max: 0xffffffffffffffff | 随机种子，控制生成的随机性 |
| steps | INT | 是 | 20 | min: 1, max: 10000 | 采样步数，越多质量越高但更慢 |
| cfg | FLOAT | 是 | 8.0 | min: 0.0, max: 100.0, step: 0.1 | CFG 引导强度 |
| sampler_name | COMBO | 是 | - | - | 采样器算法选择 |
| scheduler | COMBO | 是 | - | - | 噪声调度器选择 |
| positive | CONDITIONING | 是 | - | - | 正向提示词条件 |
| negative | CONDITIONING | 是 | - | - | 负向提示词条件 |
| latent_image | LATENT | 是 | - | - | 输入 Latent 图像 |
| denoise | FLOAT | 是 | 1.0 | min: 0.0, max: 1.0, step: 0.01 | 去噪强度 |

- **输出参数**：

| 参数名 | 类型 | 描述 |
|--------|------|------|
| LATENT | LATENT | 采样后的 Latent 输出 |

---

### 下一个节点ID（如 LatentAdd）

...
```

### 输出要求

1. 每个节点条目之间用 `---` 分隔
2. 若某字段无信息（如无默认值、无约束），填写 `-`
3. hidden 参数若包含 `prompt` 或 `extra_pnginfo` 等元数据参数，可省略（它们是框架内部使用）
4. 仅在参数确实存在 `tooltip` 或可从上下文推断时才填写描述列
5. 对于 COMBO 类型参数，在约束列注明可选的枚举值（若枚举值不超过 5 个），或注明"从目录动态读取"
