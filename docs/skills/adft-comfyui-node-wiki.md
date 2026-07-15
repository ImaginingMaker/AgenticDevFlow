# adft-comfyui-node-wiki
> ComfyUI 全节点 Wiki 自动生成技能。通过索引控制机制，分批并发分析所有节点类型的源码，生成包含节点名称、功能描述、输入输出参数的完整节点百科文档。

## 基本信息

| 属性 | 值 |
|------|-----|
| **名称** | adft-comfyui-node-wiki |
| **类型** | 工具 |
| **前缀** | adft- |
| **触发词** | 生成节点Wiki、节点文档、节点百科、node wiki、分析所有节点、生成ComfyUI节点说明、节点参数文档、批量分析节点、继续生成节点Wiki |
| **文件位置** | skills/adft-comfyui-node-wiki/SKILL.md |

## 核心特性

- **索引控制 + 断点续传**：通过 `_index.json` 管理进度，支持分批执行和多会话渐进式完成
- **100% AI 分析**：所有节点参数和描述均由 SubAgent 阅读源码后推断，不依赖任何脚本
- **多 SubAgent 并发**：同时启动最多 6 个 SubAgent 并行分析不同批次节点
- **支持 V1/V3 双范式**：能分析 ComfyNodeABC 子类（V1）和 `io.ComfyNode` 子类（V3）两种节点定义
- **增量更新**：重新扫描可发现新增节点，仅分析新增项，不重复分析已完成的节点
- **错误容忍**：单节点分析失败记录 error，不影响同批次其他节点
- **分类目录动态生成**：根据实际发现的 subcategory 动态创建分类文件

## 使用方式

```bash
# 首次启动 - 发现并开始分析
用户："帮我生成 ComfyUI 的完整节点 Wiki"

# 断点续传
用户："继续生成节点Wiki，再分析50个"

# 指定分类
用户："只生成内置扩展中 Flux 相关的节点Wiki"

# 全部生成
用户："一次性生成全部节点Wiki"
```

## 核心架构

```
Main Agent
  ├─ Phase 0: 节点发现与索引构建
  ├─ Phase 1: 读取版本元数据
  ├─ Phase 2: 批次节点分析调度 → SubAgent 并发
  ├─ Phase 3: 结果汇总合并
  └─ Phase 4: Wiki 文件写入 + 索引更新
         │
    ┌────┼────┐
    ▼    ▼    ▼
 SubAgent 批次（V1/V3 分别处理）
```

## 依赖关系

| 关系类型 | 说明 |
|---------|------|
| `前置输入` | ComfyUI 项目源码（扫描 `nodes.py`、`comfy_extras/`、`comfy_api_nodes/`、`custom_nodes/`） |
| `后置消费` | 生成的 Wiki 文档供开发者查阅节点参数；`adfa-dev-helper` 可推荐本技能 |
| `编排调度` | 无（独立工具技能，不接入 harness-runner 流水线阶段） |

## 流程生命周期

### 触发条件

- **手动触发**：用户输入触发词（"生成节点Wiki"、"分析所有节点" 等）

### 生命周期图

```
用户触发
   │
   ▼
Phase 0: 扫描节点定义文件 → 构建/更新 _index.json
   │
   ▼
Phase 1: 读取 __version__ → 写入 _metadata.md
   │
   ▼
Phase 2: 筛选 pending 节点 → 按 source_file 分组 → SubAgent 并发分析
   │
   ▼
Phase 3: 去重校验 → 完整性检查 → 格式统一 → 按分类组织
   │
   ▼
Phase 4: 写入分类 .md 文件 → 更新 _index.json 状态
   │
   └─ 异常路径: 节点分析失败 → status=error → 可后续重新分析
```

### 在完整流水线中的位置

独立工具技能，不参与 `PRD → SPEC → DESIGN → IMPLEMENT → REVIEW` 正向交付流水线。

### 产物状态

| 产物 | 路径 | 状态流转 |
|------|------|---------|
| 进度索引 | `docs/nodes-wiki/_index.json` | 持续更新：pending → done / error |
| 元数据 | `docs/nodes-wiki/_metadata.md` | 首次生成后每次更新 version + timestamp |
| 分类 Wiki | `docs/nodes-wiki/{category}/{subcategory}.md` | 逐节点追加，增量更新时追加新节点 |
| 总导航 | `docs/nodes-wiki/README.md` | 每次批次完成后重建索引统计 |

## 与现有技能的职责边界

本技能与现有所有技能**无职责重叠**：

| 技能 | 关系说明 | 重叠判定 |
|------|---------|---------|
| `adft-page-wiki-generator` | 前者生成 ComfyUI 节点 Wiki（代码分析驱动），后者生成通用代码→Wiki（页面链路驱动） | 低度（用户场景不同，输入源不同） |
| 其余所有技能 | 无任何交集 | 无重叠 |

## 工作流程

### Phase 0：节点发现与索引构建

扫描范围：`nodes.py`、`comfy_extras/`、`comfy_api_nodes/`、`custom_nodes/`

识别方式：搜索 `NODE_CLASS_MAPPINGS`（V1）、`comfy_entrypoint`（V3）

输出：`docs/nodes-wiki/_index.json`，所有节点 status=pending

### Phase 2：批次节点分析调度

| 指令模式 | 分析范围 |
|---------|---------|
| "分析前N个" | index 1 到 N |
| "继续分析N个" | 从第一个 pending 的 index 开始，取 N 个 |
| "分析全部" | 所有 pending 节点 |
| "分析 {category}" | 仅该 category 下节点 |
| "重新分析 {节点名}" | 重置该节点为 pending，纳入本次批次 |

### Phase 4：Wiki 文件写入

```
docs/nodes-wiki/
├── _index.json           # 进度索引（核心控制器）
├── _metadata.md          # 版本、日期、统计
├── README.md             # 总目录与导航
├── 核心节点/
│   ├── sampling.md       # KSampler, KSamplerAdvanced
│   ├── model-loading.md  # CheckpointLoader 系列
│   └── ...
├── 内置扩展/
│   ├── flux.md
│   └── ...
└── API节点/
    └── ...
```

## 约束规则

1. **纯 AI 分析**：不允许编写脚本提取节点信息，必须由 SubAgent 阅读源码完成
2. **索引文件是唯一状态源**：不依赖外部数据库或内存状态
3. **V1/V3 分别处理**：两种节点范式使用不同的分析策略
4. **错误不阻塞**：单节点失败记录 error，不影响同批次其他节点
5. **去重保护**：status=done 的节点默认跳过，除非用户明确要求重新分析
6. **分类目录随需创建**：不预设固定分类
7. **参数类型保留原始表示**：如 `io.Latent.Input(...)` 展示为 `LATENT`
8. **并发上限 6 个**：最多同时启动 6 个 SubAgent

## 模板注入

> 共享配置由 `adfo-harness-runner/templates/custom.md` 统一管理。本技能为独立工具技能，无特有模板配置。

## 测试用例

详见 `skills/adft-comfyui-node-wiki/test/evals.md`：

- **用例 1**：首次启动 - 节点发现与索引构建
- **用例 2-3**：V1/V3 节点分析准确性
- **用例 4-5**：索引控制（分批处理 + 断点续传）
- **用例 6**：输出格式校验
- **用例 7**：错误容忍
- **用例 8**：参数类型映射完整性
- **用例 9**：全量生成完整性
- **用例 10**：增量更新
