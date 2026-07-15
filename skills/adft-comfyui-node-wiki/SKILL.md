---
name: adft-comfyui-node-wiki
description: |
  ComfyUI 全节点 Wiki 自动生成技能。通过索引控制机制，分批并发分析所有节点类型的源码，
  生成包含节点名称、功能描述、输入参数、输出参数的完整节点百科文档。支持断点续传，
  可在多会话间渐进式完成。

  TRIGGER when: 用户说"生成节点Wiki"、"生成节点文档"、"节点百科"、"node wiki"、
  "分析所有节点"、"生成ComfyUI节点说明"、"节点参数文档"、"批量分析节点"；
  用户需要了解节点的输入输出参数；用户需要完整的节点参考手册。

  适用场景：ComfyUI 项目节点盘点、节点参数查阅、新人上手参考、API 文档生成。
---

# ComfyUI 全节点 Wiki 生成技能

> 入口页。详细的节点分析规则见 `references/node-analysis-rules.md`，输出格式规范见 `references/wiki-output-format.md`。

## 概述

本技能采用 **索引控制 + Main Agent 调度 + 多 SubAgent 并发** 架构，读取 ComfyUI 项目中所有节点类型的源码，自动分析每个节点的名称、功能描述、输入参数、输出参数，生成标准化的节点百科文档。

核心技术特点：
- **索引控制**：通过 `_index.json` 进度文件管理所有节点的分析状态，支持分批执行、断点续传
- **100% AI 分析**：不使用任何脚本，所有节点参数和描述均由 SubAgent 阅读源码后推断
- **并发调度**：多个 SubAgent 并行分析不同批次的节点，大幅缩短总耗时

## 索引控制机制

### 索引文件 `_index.json`

在项目 `docs/nodes-wiki/_index.json` 维护一个全局进度文件，是技能的核心状态控制器：

```json
{
  "version": "0.27.0",
  "generated_at": "2026-07-14T10:30:00",
  "updated_at": "2026-07-14T12:00:00",
  "total_nodes": 312,
  "analyzed_nodes": 150,
  "nodes": [
    {
      "index": 1,
      "node_id": "KSampler",
      "source_file": "nodes.py",
      "category": "sampling",
      "subcategory": "sampling",
      "status": "done"
    },
    {
      "index": 51,
      "node_id": "LatentAdd",
      "source_file": "comfy_extras/nodes_latent.py",
      "category": "内置扩展",
      "subcategory": "latent/advanced",
      "status": "pending"
    }
  ]
}
```

### 索引控制工作流

```
用户指令："从第1个节点开始，分析50个"
  │
  ▼
Main Agent 读取 _index.json
  │  ├─ 存在 → 加载现有进度，从指定 index 继续
  │  └─ 不存在 → Phase 0 发现阶段，构建全新索引
  │
  ▼
筛选 status=pending 的节点，取前 N 个（N=用户指定或默认50）
  │
  ▼
按 source_file 分组，每 5-10 个节点分配一个 SubAgent
  │
  ▼
SubAgent 并发分析 → 返回节点参数文档
  │
  ▼
Main Agent 合并结果 → 写入 Wiki 文件 → 更新 _index.json
```

### 断点续传示例

```
# 第一次运行
用户："开始生成节点Wiki，先分析前50个节点"
→ 索引中 1-50 标记为 done

# 第二次运行（可能在新会话中）
用户："继续生成节点Wiki，接下来50个"
→ 索引中 51-100 标记为 done

# 增量更新
用户："更新节点Wiki，只分析 comfy_extras/ 中新增的节点"
→ Phase 0 重新扫描，发现新节点补充进索引，仅分析新增项
```

## 核心架构

```
┌──────────────────────────────────────────────────────────────┐
│                       Main Agent                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Phase 0: 节点发现与索引构建                              │ │
│  │ Phase 1: 读取版本元数据                                  │ │
│  │ Phase 2: 批次节点分析调度 → 委托 SubAgent 并发执行        │ │
│  │ Phase 3: 结果汇总合并                                    │ │
│  │ Phase 4: Wiki 文件写入 + 索引更新                        │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
  ┌───────────┐        ┌───────────┐        ┌───────────┐
  │ SubAgent  │        │ SubAgent  │        │ SubAgent  │
  │ 批次 1-10 │        │ 批次 11-20│        │ 批次 N-M  │
  │ (V1节点)  │        │ (V3节点)  │        │ (API节点) │
  └───────────┘        └───────────┘        └───────────┘
```

## 执行流程

### Phase 0: 节点发现与索引构建

Main Agent 使用 `task` 工具启动 **code-explorer** SubAgent，扫描项目所有节点定义源文件，构建完整的节点清单。

#### 0.1 扫描范围

必须覆盖以下目录和文件：

| 来源 | 路径 | 注册方式 |
|------|------|----------|
| 核心节点 | `nodes.py` | V1: `NODE_CLASS_MAPPINGS` 字典 |
| 内置扩展 V1 | `comfy_extras/nodes_model_advanced.py` 等 9 个文件 | V1: `NODE_CLASS_MAPPINGS` |
| 内置扩展 V3 | `comfy_extras/` 下其余 ~115 个文件 | V3: `comfy_entrypoint()` |
| API 节点 | `comfy_api_nodes/nodes_*.py` 全部文件 | V3: `comfy_entrypoint()` |
| 自定义节点 | `custom_nodes/` 下全部目录 | V1 或 V3 |

#### 0.2 扫描方式

通过搜索以下模式识别节点定义文件：

- 搜索关键字：`NODE_CLASS_MAPPINGS`、`comfy_entrypoint`、`class.*ComfyNode`、`class.*ComfyNodeABC`
- 对每个匹配文件，提取其中定义的**所有**节点 ID（V1 从字典 key 获取，V3 从 `node_id` 字段获取）

#### 0.3 构建初始索引

扫描完成后，在 `docs/nodes-wiki/_index.json` 写入初始索引。每个节点记录的初始状态为 `"status": "pending"`。

按来源模块自动分配 `category` 和 `subcategory`：
- 从 V3 节点的 `schema.category` 字段提取
- 从 V1 节点的 `CATEGORY` 类属性提取
- 来源为 `nodes.py` 的归入 `"category": "核心节点"`

### Phase 1: 读取版本元数据

1. 读取 `comfyui_version.py` 获取 `__version__`
2. 记录当前时间戳
3. 写入 `docs/nodes-wiki/_metadata.md`

### Phase 2: 批次节点分析调度

这是技能的核心阶段。根据用户指令确定分析范围：

| 用户指令模式 | 分析范围 |
|-------------|---------|
| "分析前N个" / "从第1个开始" | 索引中 index 1 到 N |
| "继续分析N个" / "接下来N个" | 从第一个 status=pending 的 index 开始，取 N 个 |
| "分析全部" | 所有 status=pending 的节点 |
| "分析 {category} 分类" | 仅该 category 下的节点 |
| "重新分析 {节点名}" | 重置该节点的 status 为 pending，纳入本次批次 |

#### 2.1 批次分组策略

将待分析节点按 source_file 分组，每组控制在 **5-8 个节点**，分配给一个 SubAgent：

- **单文件多节点**（如 `nodes.py` 含 62 个节点）→ 拆分为多个批次，每个批次 6-10 个节点
- **单文件少节点**（如 `nodes_webcam.py` 仅 1 个节点）→ 与同目录其他少节点文件合并为一个批次
- **V1 和 V3 混合** → V1 节点与 V3 节点分开分析，不混在同一批次

#### 2.2 SubAgent 调度

使用 `task` 工具并发启动多个 code-explorer 或 general-purpose SubAgent。

每个 SubAgent 接收以下上下文：

```
## 任务
分析以下 ComfyUI 节点类型的源码，提取节点参数信息。

## 节点列表
1. 节点ID: "KSampler" | 源文件: nodes.py | 类型: V1
2. 节点ID: "KSamplerAdvanced" | 源文件: nodes.py | 类型: V1
...

## 分析要求
对每个节点提取：
1. 功能描述（从代码逻辑和命名推断，1-3句话）
2. 输入参数（名称、类型、是否必填、默认值、描述）
3. 输出参数（名称、类型、描述）

## V1 节点分析要点
- 读取类的 INPUT_TYPES() 方法获取入参定义
- 读取 RETURN_TYPES / RETURN_NAMES 获取出参定义
- 阅读 FUNCTION 指向的方法理解功能
- 从 CATEGORY 获取分类

## V3 节点分析要点
- 读取 define_schema() 中的 io.Schema 获取完整参数定义
- 阅读 execute() 方法理解功能
- 从 node_id、category、search_aliases 字段提取元信息

## 输出格式
参考 `references/node-analysis-rules.md` 中的输出模板
```

#### 2.3 并发策略

- 最多同时启动 **6 个** SubAgent
- 优先将同 source_file 的节点放入同一批次（减少重复读文件）
- 大型文件（如 `nodes.py`）的批次可以与其他小文件批次并行

### Phase 3: 结果汇总合并

Main Agent 收集所有 SubAgent 的分析结果，执行以下操作：

1. **去重校验**：检查同一 node_id 是否被重复分析
2. **完整性检查**：确认每个节点都包含 name / description / inputs / outputs 四个字段
3. **格式统一**：确保所有节点输出格式一致
4. **按分类组织**：将节点文档按 category → subcategory 分组

### Phase 4: Wiki 文件写入与索引更新

将分析结果写入 `docs/nodes-wiki/` 目录，按分类拆分为独立的 Markdown 文件。

#### 4.1 目录结构

```
docs/nodes-wiki/
├── _index.json                    # 进度索引文件（核心控制器）
├── _metadata.md                   # 元数据（版本、日期、统计）
├── README.md                      # Wiki 总目录与导航
├── 核心节点/
│   ├── sampling.md                # KSampler、KSamplerAdvanced
│   ├── model-loading.md           # CheckpointLoader 系列
│   ├── vae.md                     # VAE 编解码节点
│   ├── latent.md                  # Latent 操作节点
│   ├── conditioning.md            # Conditioning 操作节点
│   ├── image.md                   # 图像节点
│   ├── clip.md                    # CLIP 文本编码
│   └── controlnet.md              # ControlNet 节点
├── 内置扩展/
│   ├── latent-advanced.md         # Latent 高级操作
│   ├── image-processing.md        # 图像处理
│   ├── model-advanced.md          # 模型高级配置
│   ├── model-merging.md           # 模型合并
│   ├── sampling-custom.md         # 自定义采样
│   ├── flux.md                    # Flux 模型族
│   ├── sd3.md                     # SD3 模型
│   ├── hunyuan.md                 # 混元模型
│   ├── wan.md                     # Wan 模型
│   ├── video.md                   # 视频处理
│   ├── audio.md                   # 音频处理
│   ├── 3d.md                      # 3D 模型
│   ├── logic-math.md              # 逻辑与数学
│   └── ...                        # 按需扩展
└── API节点/
    ├── openai.md                  # OpenAI 节点
    ├── gemini.md                  # Gemini 节点
    ├── bfl.md                     # BFL Flux API
    ├── luma.md                    # Luma AI
    ├── kling.md                   # Kling 视频
    └── ...                        # 按需扩展
```

#### 4.2 单节点条目格式

每个节点按以下模板输出（详见 `references/wiki-output-format.md`）：

```markdown
### CheckpointLoaderSimple

- **分类**：`model/checkpoints`
- **来源文件**：`nodes.py` (V1)
- **功能描述**：加载 Stable Diffusion 主 checkpoint 模型文件，同时输出 MODEL、CLIP 和 VAE 三个组件。
- **输入参数**：

| 参数名 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|------|--------|------|
| ckpt_name | `COMBO` | 是 | - | 从 checkpoints 目录中选取模型文件 |

- **输出参数**：

| 参数名 | 类型 | 描述 |
|--------|------|------|
| MODEL | `MODEL` | 加载的扩散模型 |
| CLIP | `CLIP` | 加载的 CLIP 文本编码器 |
| VAE | `VAE` | 加载的 VAE 图像编解码器 |
```

#### 4.3 索引更新

每批节点分析完成后，立即更新 `_index.json`：
- 将已分析节点的 `status` 改为 `"done"`
- 更新 `updated_at` 时间戳
- 更新 `analyzed_nodes` 计数

---

## 节点分析规则

详见 `references/node-analysis-rules.md`，核心要点：

### V1 节点（ComfyNodeABC 子类）

从以下类属性/方法提取信息：
- `CATEGORY` → 分类路径
- `INPUT_TYPES()` → 输入参数定义（required / optional）
- `RETURN_TYPES` → 输出类型元组
- `RETURN_NAMES` → 输出名称元组
- `FUNCTION` → 执行函数名
- `OUTPUT_NODE` → 是否为输出节点
- 源码中的 `RETURN_TYPES` 元组格式如 `("LATENT",)` 需展示为 `LATENT`，括号和引号在文档中去除

### V3 节点（io.ComfyNode 子类）

从以下方法提取信息：
- `define_schema()` → `io.Schema` 对象：
  - `node_id` → 节点唯一标识
  - `display_name` → 显示名称
  - `category` → 分类路径
  - `search_aliases` → 搜索别名
  - `inputs` → 输入参数列表（`io.XXX.Input("name")`）
  - `outputs` → 输出参数列表（`io.XXX.Output()`）
- `execute()` → 执行逻辑，用于理解功能
- 输入参数类型映射见 `references/node-analysis-rules.md`

### 功能描述推断原则

优先级从高到低：
1. 源码中的 docstring 或注释
2. `search_aliases`（V3）中的关键词
3. 节点 ID 的语义推断
4. execute() 方法的逻辑分析
5. 同文件内相邻节点的命名模式

## 输出格式规范

详见 `references/wiki-output-format.md`，核心要点：

- 文件头部包含元数据块（生成日期、版本、节点数量）
- 每个分类文件包含该分类下所有节点的详细说明
- README.md 作为总导航，以表格列出所有分类及节点数量
- 参数表格使用标准 Markdown 表格格式
- 对于复杂类型（如 `Conditioning` 的嵌套结构），在注释中简要说明

## 触发词与使用示例

### 触发词

用户说出以下任一关键词时，加载此技能：

- "生成节点Wiki" / "节点Wiki"
- "生成节点文档" / "节点文档"
- "节点百科" / "node wiki"
- "分析所有节点" / "分析ComfyUI节点"
- "生成节点参数文档" / "节点参考手册"
- "批量分析节点"
- "继续生成节点Wiki"（断点续传）

### 使用示例

```
# 首次启动 - 发现并开始分析
用户："帮我生成 ComfyUI 的完整节点 Wiki"

# Main Agent 执行：
# Phase 0 → 扫描发现 312 个节点，构建 _index.json
# Phase 1 → 读取版本号 v0.27.0
# Phase 2 → 启动 6 个 SubAgent 并发分析前 50 个节点
# Phase 3 → 汇总、写入文件
# Phase 4 → 更新索引，提示剩余 262 个待分析

# 断点续传
用户："继续生成节点Wiki，再分析50个"
# Main Agent → 读取 _index.json，找到第 51 个开始，继续分析

# 指定分类
用户："只生成内置扩展中 Flux 相关的节点Wiki"
# Main Agent → 筛选 category=内置扩展 且 subcategory 含 flux 的节点

# 全部生成
用户："一次性生成全部节点Wiki"
# Main Agent → 全部 pending 节点分批次并发，直到全部完成
```

## 注意事项

1. **不用脚本，纯 AI 分析**：不允许编写 Python 脚本来提取节点信息，所有分析必须由 SubAgent 阅读源码完成
2. **索引文件是唯一状态源**：所有进度信息仅存储在 `_index.json`，不依赖外部数据库或内存状态
3. **分批策略自适应**：根据节点数量和文件分布自动调整批次大小
4. **V1/V3 分别处理**：两种节点类型的分析规则不同，SubAgent 需根据节点类型使用对应的分析策略
5. **参数类型保留原始表示**：如 `io.Latent.Input(...)` 展示为 `LATENT`，`io.String.Input(...)` 展示为 `STRING`
6. **错误容忍**：单个节点分析失败不应阻塞其他节点，记录错误信息到索引的 error 字段
7. **去重保护**：已完成的节点（status=done）默认跳过，除非用户明确要求重新分析
8. **分类目录随需创建**：根据实际发现的 subcategory 动态创建分类文件，不预设固定分类

---

## 模板注入

> 本技能为独立工具（adft-），不接入 harness 流水线。

`references/` — 节点分析规则 / Wiki 输出格式规范
`test/` — 评估测试用例
