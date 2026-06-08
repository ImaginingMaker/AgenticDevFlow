#!/usr/bin/env node

/**
 * harness-cli — 前端开发 Harness 编译器
 *
 * 编译架构：代码在 LLM 执行前/后处理机械操作，
 * LLM 只负责内容生成。
 *
 * 用法：
 *   harness-cli list                                   列出所有任务
 *   harness-cli status <taskId>                        查看任务状态
 *   harness-cli context <taskId>                       编译上下文（核心）
 *   harness-cli verify <taskId> <phase> <file>         校验产物
 *   harness-cli init <name> [options]                  创建新任务
 *   harness-cli rollback <taskId> <targetPhase> [--reason=..]  回退到指定阶段
 *   harness-cli validate <taskId>                      校验 state.json 完整性
 */

// ============================================================
// 常量与配置
// ============================================================

const WORKFLOWS_DIR = process.env.HARNESS_WORKFLOWS_DIR || "docs/workflows";
const DEFAULT_MAX_RETRIES = 3;

// 阶段枚举（编译自 phase-registry.md §一）
const PHASES = [
  "INIT",
  "ANALYZE",
  "PRD",
  "SPEC",
  "ARCHITECTURE",
  "DESIGN",
  "IMPLEMENT",
  "REVIEW",
  "DONE",
  "FAILED",
];

const TERMINAL_PHASES = ["DONE", "FAILED"];

// 阶段 → 技能映射（编译自 phase-registry.md §二）
const PHASE_SKILL_MAP = {
  ANALYZE: {
    skill: "adfp-requirement-analyzer",
    artifact: "requirement-analysis.md",
  },
  PRD: { skill: "adfp-prd-generator", artifact: "prd.md" },
  SPEC: { skill: "adfp-spec-generator", artifact: "spec.md" },
  ARCHITECTURE: {
    skill: "adfp-architecture-designer",
    artifact: "architecture.md",
  },
  DESIGN: { skill: "adfp-component-designer", artifact: "design.md" },
  IMPLEMENT: { skill: "adfp-code-implementer", artifact: "implementation.md" },
  REVIEW: { skill: "adfp-code-reviewer", artifact: "review-report.md" },
};

// 正向流转规则（编译自 phase-registry.md §三 → next）
const FORWARD_TRANSITIONS = {
  INIT: "ANALYZE",
  ANALYZE: "PRD",
  PRD: "SPEC",
  SPEC: "ARCHITECTURE",
  ARCHITECTURE: "DESIGN",
  DESIGN: "IMPLEMENT",
  IMPLEMENT: "REVIEW",
};

// 可跳过目标（编译自 phase-registry.md §三 → canSkipTo）
const SKIP_TARGETS = {
  INIT: ["PRD", "SPEC", "ARCHITECTURE", "DESIGN", "IMPLEMENT"],
  ANALYZE: ["SPEC", "ARCHITECTURE"],
  PRD: ["SPEC", "ARCHITECTURE", "DESIGN"],
  SPEC: ["ARCHITECTURE", "DESIGN"],
  ARCHITECTURE: ["DESIGN"],
  DESIGN: ["IMPLEMENT"],
  REVIEW: ["DONE"],
};

// ============================================================
// 工具函数
// ============================================================

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function readJSON(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function writeJSON(filePath, data) {
  // 原子写入：先写 tmp，再 mv
  // renameSync 在同一文件系统上是原子操作，写入中断不会损坏目标文件
  const tmpPath = filePath + ".tmp";
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmpPath, filePath);
}

function iconForPhase(phase) {
  const icons = {
    INIT: "⚪",
    ANALYZE: "🔍",
    PRD: "📋",
    SPEC: "📐",
    ARCHITECTURE: "🏗️",
    DESIGN: "🎨",
    IMPLEMENT: "⚡",
    REVIEW: "🔎",
    DONE: "✅",
    FAILED: "❌",
  };
  return icons[phase] || "❓";
}

function statusIcon(status) {
  const icons = {
    completed: "✅",
    failed: "❌",
    skipped: "⏭️",
    retrying: "🔄",
    in_progress: "▶️",
    pending: "⬜",
  };
  return icons[status] || "❓";
}

// ============================================================
// 命令：list — 列出所有任务
// ============================================================

function cmdList() {
  const workflowDir = path.resolve(WORKFLOWS_DIR);

  if (!fs.existsSync(workflowDir)) {
    console.log("📂 暂无任务（workflows 目录不存在）");
    return;
  }

  const entries = fs.readdirSync(workflowDir, { withFileTypes: true });
  const tasks = entries
    .filter((e) => e.isDirectory())
    .map((dir) => {
      const statePath = path.join(workflowDir, dir.name, "state.json");
      if (!fs.existsSync(statePath)) return null;
      try {
        return readJSON(statePath);
      } catch {
        return {
          id: dir.name,
          name: dir.name,
          currentPhase: "FAILED",
          _corrupted: true,
        };
      }
    })
    .filter(Boolean);

  const active = tasks.filter((t) => !TERMINAL_PHASES.includes(t.currentPhase));
  const done = tasks.filter((t) => t.currentPhase === "DONE");
  const failed = tasks.filter((t) => t.currentPhase === "FAILED");

  if (active.length > 0) {
    console.log("🔵 活跃任务");
    console.log("─".repeat(70));
    console.log(
      "  ID                         名称            阶段   Blockers  更新于",
    );
    console.log(
      "  ──                         ──             ──   ───────   ──────",
    );
    for (const t of active) {
      const id = t.id.padEnd(28);
      const name = (t.name || "").substring(0, 14).padEnd(14);
      const phase = `${iconForPhase(t.currentPhase)} ${t.currentPhase}`.padEnd(
        10,
      );
      const blockers =
        `${t.blockers?.filter((b) => !b.resolved).length || 0}`.padEnd(8);
      const updated = (t.updatedAt || "").substring(0, 16);
      console.log(`  ${id} ${name} ${phase} ${blockers} ${updated}`);
    }
  }

  if (done.length > 0) {
    console.log("\n✅ 已完成");
    console.log("─".repeat(50));
    for (const t of done) {
      console.log(
        `  ${t.id.padEnd(28)} ${(t.name || "").substring(0, 18).padEnd(18)} ${t.updatedAt?.substring(0, 10) || ""}`,
      );
    }
  }

  if (failed.length > 0) {
    console.log("\n❌ 失败（需人工介入）");
    console.log("─".repeat(50));
    for (const t of failed) {
      console.log(
        `  ${t.id.padEnd(28)} ${(t.name || "").substring(0, 18).padEnd(18)}`,
      );
    }
  }

  if (tasks.length === 0) {
    console.log("📂 暂无任务");
  }
}

// ============================================================
// 命令：status — 查看单个任务状态
// ============================================================

function cmdStatus(taskId) {
  const statePath = path.resolve(WORKFLOWS_DIR, taskId, "state.json");
  if (!fs.existsSync(statePath)) {
    console.error(`❌ 任务不存在：${taskId}`);
    console.error(`   期望路径：${statePath}`);
    process.exit(1);
  }

  const state = readJSON(statePath);

  console.log(
    `\n${iconForPhase(state.currentPhase)}  ${state.name || state.id}`,
  );
  console.log("═".repeat(60));
  console.log(`  ID：          ${state.id}`);
  console.log(`  描述：        ${state.description || "—"}`);
  console.log(`  当前阶段：    ${state.currentPhase}`);
  console.log(
    `  重试：        ${state.retryCount}/${state.maxRetries || DEFAULT_MAX_RETRIES}`,
  );
  console.log(`  产物目录：    ${state.outputDir}`);
  console.log(`  创建：        ${state.createdAt || "—"}`);
  console.log(`  更新：        ${state.updatedAt || "—"}`);

  // Blockers
  const unresolved = (state.blockers || []).filter((b) => !b.resolved);
  if (unresolved.length > 0) {
    console.log(`\n  🚧 Blockers（${unresolved.length} 条未解决）：`);
    for (const b of unresolved) {
      const severityIcon = {
        critical: "🔴",
        high: "🟡",
        medium: "🟠",
        low: "🟢",
      };
      console.log(
        `    ${severityIcon[b.severity] || "⚪"} [${b.severity}] ${b.issue}`,
      );
      if (b.source) console.log(`       来源：${b.source}`);
    }
  }

  // 阶段历史
  console.log(`\n  阶段历史：`);
  console.log(`  ─${"─".repeat(55)}`);
  for (const record of state.phaseHistory || []) {
    const icon = statusIcon(record.status);
    const phase = record.phase.padEnd(14);
    const qg = record.qualityGate ? ` qualityGate=${record.qualityGate}` : "";
    const skip = record.skipEvidence
      ? ` ⏭️ ${record.skipEvidence.substring(0, 30)}`
      : "";
    const errors = record.errors
      ? ` 🔴 ${record.errors.map((e) => e.message.substring(0, 40)).join("; ")}`
      : "";
    let outputCount = "";
    if (record.outputFiles && record.outputFiles.length > 0) {
      outputCount = ` 📄 ${record.outputFiles.length} 个文件`;
    }
    const phaseIcon = iconForPhase(record.phase);
    console.log(
      `  ${icon} ${phaseIcon} ${phase}${qg}${skip}${errors}${outputCount}`,
    );
  }

  // 跳过阶段
  if (state.skippedPhases && state.skippedPhases.length > 0) {
    console.log(`\n  ⏭️ 已跳过阶段：${state.skippedPhases.join(", ")}`);
  }

  // 断点信息
  if (state.checkpoint) {
    const fileCount = Object.keys(state.checkpoint.filesSnapshot || {}).length;
    console.log(
      `\n  📍 Checkpoint：${state.checkpoint.phase}（${fileCount} 个文件，${state.checkpoint.timestamp || "—"}）`,
    );
  }

  // 下一步建议
  console.log(`\n  下一步：`);
  if (state.currentPhase === "DONE") {
    console.log(`  ✅ 流水线已完成`);
  } else if (state.currentPhase === "FAILED") {
    console.log(`  ❌ 需人工介入，重置后可用 recover 恢复`);
  } else {
    const next = getNextPhase(state);
    console.log(`  ➡️  下一阶段：${next.to}（${next.reason}）`);

    const available = getAvailableTargets(state);
    if (available.length > 1) {
      console.log(
        `  🔀 也可跳过到：${available.filter((p) => p !== next.to).join(", ")}`,
      );
    }

    console.log(
      `  💡 运行 \`node harness-cli.js context ${taskId}\` 获取完整执行上下文`,
    );
  }
}

// ============================================================
// 状态机决策（编译自 phase-registry.md §三 + §四）
// ============================================================

/**
 * 获取下一阶段（含回退判断）
 */
function getNextPhase(state) {
  const { currentPhase, retryCount, maxRetries, phaseHistory, blockers } =
    state;
  const mr = maxRetries || DEFAULT_MAX_RETRIES;

  // 终态处理
  if (currentPhase === "DONE") return { to: "DONE", reason: "流水线已完成" };
  if (currentPhase === "FAILED") return { to: "FAILED", reason: "需人工介入" };

  // REVIEW 特殊处理：判断 qualityGate
  if (currentPhase === "REVIEW") {
    const reviewRecord = phaseHistory.find((p) => p.phase === "REVIEW");
    const qg = reviewRecord?.qualityGate;

    if (qg === "pass") {
      return { to: "DONE", reason: "REVIEW qualityGate=pass → DONE" };
    }
    if (qg === "warn") {
      return {
        to: "DONE",
        reason: "REVIEW qualityGate=warn + 用户确认 → DONE",
      };
    }
    if (qg === "fail" && retryCount < mr) {
      return {
        to: "IMPLEMENT",
        reason: `REVIEW qualityGate=fail 且 retryCount=${retryCount} < maxRetries=${mr} → 回退到 IMPLEMENT 修复`,
      };
    }
    if (qg === "fail" && retryCount >= mr) {
      return {
        to: "FAILED",
        reason: `REVIEW qualityGate=fail 且 retryCount=${retryCount} >= maxRetries=${mr} → FAILED`,
      };
    }
  }

  // 检查是否有 critical blockers 需要回退
  if (currentPhase === "IMPLEMENT") {
    const criticalBlockers = blockers?.filter(
      (b) =>
        b.phase === "IMPLEMENT" && b.severity === "critical" && !b.resolved,
    );
    if (criticalBlockers && criticalBlockers.length > 0) {
      return {
        to: "DESIGN",
        reason: "IMPLEMENT 发现设计冲突（critical blocker）→ 回退到 DESIGN",
      };
    }
  }

  if (currentPhase === "DESIGN") {
    const archBlockers = blockers?.filter(
      (b) => b.phase === "DESIGN" && b.severity === "critical" && !b.resolved,
    );
    if (archBlockers && archBlockers.length > 0) {
      return {
        to: "ARCHITECTURE",
        reason: "DESIGN 发现架构偏离 → 回退到 ARCHITECTURE",
      };
    }
  }

  // retryCount 超限
  if (retryCount >= mr && !TERMINAL_PHASES.includes(currentPhase)) {
    return {
      to: "FAILED",
      reason: `retryCount=${retryCount} >= maxRetries=${mr} → FAILED`,
    };
  }

  // 正向流转
  const next = FORWARD_TRANSITIONS[currentPhase];
  if (next) {
    return { to: next, reason: `正向流转：${currentPhase} → ${next}` };
  }

  return { to: "FAILED", reason: `未知阶段 ${currentPhase}，无法确定下一阶段` };
}

/**
 * 获取所有可用目标（含跳过路径）
 */
function getAvailableTargets(state) {
  const targets = new Set();
  const next = getNextPhase(state);
  if (next) targets.add(next.to);

  const skips = SKIP_TARGETS[state.currentPhase] || [];
  for (const s of skips) targets.add(s);

  return Array.from(targets).filter(
    (p) => !TERMINAL_PHASES.includes(p) || p === next?.to,
  );
}

/**
 * 验证手动指定的跳转是否合法
 */
function validateTransition(from, to, state) {
  // IMPLEMENT 不可跳过
  if (from !== "IMPLEMENT" && to === "IMPLEMENT") return { valid: true };
  if (
    from !== "DESIGN" &&
    from !== "INIT" &&
    to === "IMPLEMENT" &&
    state.currentPhase !== "IMPLEMENT"
  ) {
    // 允许从 INIT 或 DESIGN 跳到 IMPLEMENT
    if (from === "INIT" || from === "DESIGN") return { valid: true };
  }

  if (
    to === "IMPLEMENT" &&
    from !== "DESIGN" &&
    from !== "REVIEW" &&
    from !== "INIT"
  ) {
    return { valid: false, reason: "IMPLEMENT 只能从 DESIGN/REVIEW/INIT 进入" };
  }

  // 跳过路径只能在 SKIP_TARGETS 中
  const skips = SKIP_TARGETS[from] || [];
  if (to !== getNextPhase(state)?.to && !skips.includes(to)) {
    return { valid: false, reason: `${from} 不能直接跳到 ${to}` };
  }

  return { valid: true };
}

// ============================================================
// 命令：context — 编译执行上下文（核心）
// ============================================================

function cmdContext(taskId) {
  const statePath = path.resolve(WORKFLOWS_DIR, taskId, "state.json");
  if (!fs.existsSync(statePath)) {
    console.error(`❌ 任务不存在：${taskId}`);
    console.error(`   期望路径：${statePath}`);
    process.exit(1);
  }

  const state = readJSON(statePath);

  const outputDir = path.resolve(WORKFLOWS_DIR, taskId);
  const next = getNextPhase(state);
  const available = getAvailableTargets(state);
  const phaseInfo = PHASE_SKILL_MAP[next.to];

  // 检查上游产物
  const upstreamRecords =
    state.phaseHistory?.filter(
      (r) => r.status === "completed" || r.status === "skipped",
    ) || [];

  const artifactLines = upstreamRecords
    .map((r) => {
      const icon = r.status === "completed" ? "✅" : "⏭️";
      const files = r.outputFiles?.join(", ") || "—";
      return `  ${icon} ${r.phase.padEnd(14)} ${files}`;
    })
    .join("\n");
  // 技术栈信息
  const ts = state.techStack || {};
  const techStackLines = [
    "framework",
    "platform",
    "uiLibrary",
    "styling",
    "stateManagement",
    "router",
    "dataFetching",
    "buildTool",
    "packageManager",
  ]
    .filter((k) => ts[k])
    .map((k) => {
      const label =
        k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, " $1");
      return `  | **${label}** | ${ts[k]} |`;
    })
    .join("\n");

  const techStackSection =
    techStackLines.length > 0
      ? `\n## 技术栈\n\n| 属性 | 值 |\n|------|-----|\n${techStackLines}\n`
      : `\n## 技术栈\n\n> 尚未配置。可通过 \`harness-cli init\` 或在 state.json 中手动添加 techStack 字段配置。
`;
  const unresolved = (state.blockers || []).filter((b) => !b.resolved);
  const blockerSection =
    unresolved.length > 0
      ? unresolved
          .map(
            (b) =>
              `  🔴 [${b.severity}] ${b.issue}${b.source ? `（${b.source}）` : ""}`,
          )
          .join("\n")
      : "  无";

  // 编译输出
  const output = `# 📋 任务执行上下文（编译产物）
> 由 harness-cli 自动生成。LLM 直接消费此上下文执行内容生成。

---

## 当前状态

| 属性 | 值 |
|------|-----|
| **任务** | ${state.id} |
| **名称** | ${state.name || "—"} |
| **当前阶段** | ${iconForPhase(state.currentPhase)} ${state.currentPhase} |
| **下一阶段** | ${iconForPhase(next.to)} **${next.to}** |
| **决策原因** | ${next.reason} |
| **重试** | ${state.retryCount}/${state.maxRetries || DEFAULT_MAX_RETRIES} |
| **Blockers** | ${unresolved.length} 条未解决 |

## 可用跳转

| 目标阶段 | 说明 |
|---------|------|
${available.map((p) => `| ${p} | ${p === next.to ? "← 推荐" : ""} |`).join("\n")}

## 上游产物状态

${artifactLines}

${techStackSection}
## 未解决 Blockers

${blockerSection}

${
  phaseInfo
    ? `## 执行指令

| 属性 | 值 |
|------|-----|
| **调用技能** | \`${phaseInfo.skill}\` |
| **产物路径** | \`${outputDir}/${phaseInfo.artifact}\` |
| **产物格式** | 包含 front-matter（phase, status, qualityGate） |
| **正文要求** | ≥ 50 字符实质性内容 |

### 阶段流转规则（已编译）

**当前阶段 ${state.currentPhase} 的流转决策：**

| 条件 | → 下一阶段 |
|------|-----------|
| 正常执行完成，qualityGate=pass | 进入 **${next.to}** |
| 执行失败，qualityGate=fail | 回退修复 |
| 跳过此阶段 | 跳到 ${available.filter((p) => p !== next.to).join(" / ") || "无"} |

### 执行后校验命令

\`\`\`bash
node harness-cli.js verify ${taskId} ${next.to} ${outputDir}/${phaseInfo.artifact}
\`\`\`

请完成该阶段的内容生成后运行此命令校验产物。`
    : `## ⚠️ 当前阶段（${next.to}）无需原子技能

此阶段由 Harness 内置处理，无需调用外部技能。

${next.to === "DONE" ? "### 流水线已完成，运行 `harness-cli list` 查看最终状态。" : ""}
${next.to === "FAILED" ? "### 到达最大重试次数，需人工介入修复。" : ""}
`
}

---

> 生成时间：${new Date().toISOString()}
`;

  console.log(output);
}

// ============================================================
// 命令：verify — 校验产物（骨架）
// ============================================================

function cmdVerify(taskId, phase, artifactPath) {
  const resolvedPath = path.resolve(artifactPath);
  const statePath = path.resolve(WORKFLOWS_DIR, taskId, "state.json");

  if (!fs.existsSync(statePath)) {
    console.error(`❌ 任务不存在：${taskId}`);
    process.exit(1);
  }
  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ 产物文件不存在：${resolvedPath}`);
    process.exit(1);
  }

  const state = readJSON(statePath);
  const content = fs.readFileSync(resolvedPath, "utf-8");
  const FRONT_MATTER_RE = /^---\n([\s\S]*?)\n---\n?/;
  const match = content.match(FRONT_MATTER_RE);

  const issues = [];

  // ① front-matter 存在性
  if (!match) {
    issues.push("❌ 缺少 front-matter 元数据区块");
  }

  // ② 解析 front-matter（简易 YAML 解析）
  let fm = {};
  if (match) {
    const lines = match[1].split("\n");
    for (const line of lines) {
      const sep = line.indexOf(":");
      if (sep > 0) {
        const key = line.substring(0, sep).trim();
        const val = line.substring(sep + 1).trim();
        fm[key] = val;
      }
    }
  }

  // ③ 阶段一致性
  if (fm.phase && fm.phase !== phase) {
    issues.push(`⚠️ 阶段标识不匹配：期望 ${phase}，实际 ${fm.phase}`);
  }

  // ④ 必填字段
  const requiredFields = ["phase", "status", "qualityGate"];
  for (const field of requiredFields) {
    if (!(field in fm)) {
      issues.push(`❌ 缺少必填字段：${field}`);
    }
  }

  // ⑤ 内容实质性
  const body = content.replace(FRONT_MATTER_RE, "").trim();
  if (body.length < 50) {
    issues.push(`⚠️ 正文内容不足 50 字符（实际 ${body.length}）`);
  }

  // ⑥ qualityGate 值
  const validGates = ["pass", "warn", "fail"];
  if (fm.qualityGate && !validGates.includes(fm.qualityGate)) {
    issues.push(
      `❌ qualityGate 值非法：${fm.qualityGate}，允许值：${validGates.join(", ")}`,
    );
  }

  // 综合判定
  let gate = fm.qualityGate || "fail";
  if (issues.some((i) => i.startsWith("❌"))) {
    gate = "fail";
  } else if (issues.length > 0) {
    gate = "warn";
  }

  // 输出校验报告
  const result = {
    gate,
    phase_match: fm.phase === phase,
    body_length: body.length,
    qualityGate: fm.qualityGate || "missing",
    issues,
  };

  console.log(JSON.stringify(result, null, 2));

  // 如果通过，更新 state.json
  if (gate !== "fail") {
    // 记录相对路径（相对 WORKFLOWS_DIR/taskId）
    const relativePath = path.relative(
      path.resolve(WORKFLOWS_DIR, taskId),
      resolvedPath,
    );

    state.phaseHistory.push({
      phase,
      status: "completed",
      qualityGate: gate,
      completedAt: new Date().toISOString(),
      outputFiles: [relativePath],
    });
    // 递进到下一阶段
    const next = getNextPhase(state);
    state.currentPhase = next.to;
    state.retryCount = 0;

    // 更新 checkpoint
    state.checkpoint = {
      phase,
      timestamp: new Date().toISOString(),
      filesSnapshot: {},
    };
    for (const record of state.phaseHistory || []) {
      for (const f of record.outputFiles || []) {
        const fullPath = path.isAbsolute(f)
          ? f
          : path.resolve(WORKFLOWS_DIR, taskId, f);
        if (fs.existsSync(fullPath)) {
          state.checkpoint.filesSnapshot[f] = crypto
            .createHash("sha256")
            .update(fs.readFileSync(fullPath))
            .digest("hex");
        }
      }
    }

    state.updatedAt = new Date().toISOString();
    writeJSON(statePath, state);

    // 单独输出 JSON，不混入多余行（保持机器可解析）
  }
}

// ============================================================
// 命令：rollback — 回退到指定阶段
// ============================================================

/**
 * 校验回退是否合法（根据 phase-registry.md §四）
 */
const ROLLBACK_RULES = {
  REVIEW: ["IMPLEMENT"],
  IMPLEMENT: ["DESIGN", "ARCHITECTURE"],
  DESIGN: ["ARCHITECTURE", "SPEC"],
  ARCHITECTURE: ["SPEC"],
  PRD: ["ANALYZE"],
};

function cmdRollback(taskId, targetPhase, extraArgs) {
  const statePath = path.resolve(WORKFLOWS_DIR, taskId, "state.json");
  if (!fs.existsSync(statePath)) {
    console.error(`❌ 任务不存在：${taskId}`);
    console.error(`   期望路径：${statePath}`);
    process.exit(1);
  }

  const state = readJSON(statePath);

  // 解析 --reason
  let reason = "";
  for (const arg of extraArgs) {
    if (arg.startsWith("--reason=")) {
      reason = arg.substring(9);
    }
  }

  const currentPhase = state.currentPhase;

  // 校验：终态不可回退
  if (TERMINAL_PHASES.includes(currentPhase)) {
    console.error(`❌ 终态任务（${currentPhase}）不可回退`);
    process.exit(1);
  }

  // 校验回退路径是否合法
  const allowedTargets = ROLLBACK_RULES[currentPhase];
  if (!allowedTargets || !allowedTargets.includes(targetPhase)) {
    console.error(`❌ 从 ${currentPhase} 回退到 ${targetPhase} 不合法`);
    console.error(
      `   从 ${currentPhase} 允许的回退目标：${allowedTargets ? allowedTargets.join(", ") : "无"}`,
    );
    process.exit(1);
  }

  // 计算需要清理的阶段（targetPhase 之后的所有阶段）
  const currentIdx = PHASES.indexOf(currentPhase);
  const targetIdx = PHASES.indexOf(targetPhase);
  const phasesToClean = PHASES.filter(
    (_, i) => i > targetIdx && i <= currentIdx,
  );

  // 添加 blocker
  const blockerEntry = {
    phase: targetPhase,
    issue: reason || `从 ${currentPhase} 回退到 ${targetPhase} 修复`,
    severity: "high",
    source: "harness-cli rollback",
    resolved: false,
  };
  if (!state.blockers) state.blockers = [];
  state.blockers.push(blockerEntry);

  // 清理 targetPhase 之后的产物文件
  const outputDir = path.resolve(WORKFLOWS_DIR, taskId);
  for (const phase of phasesToClean) {
    const phaseInfo = PHASE_SKILL_MAP[phase];
    if (phaseInfo && phaseInfo.artifact) {
      const artifactPath = path.join(outputDir, phaseInfo.artifact);
      if (fs.existsSync(artifactPath)) {
        fs.unlinkSync(artifactPath);
        console.log(`  🗑️ 已清理：${phaseInfo.artifact}`);
      }
    }
  }

  // 回退 currentPhase
  state.currentPhase = targetPhase;

  // 重置 retryCount（回退后给一次完整重试机会）
  state.retryCount = 0;

  // 标记 phaseHistory 中清扫的阶段为 retrying
  for (const record of state.phaseHistory || []) {
    if (phasesToClean.includes(record.phase)) {
      record.status = "retrying";
      delete record.qualityGate;
    }
  }

  // 更新 timestamp
  state.updatedAt = new Date().toISOString();

  // 原子写入
  writeJSON(statePath, state);

  console.log(`\n✅ 已回退到 ${targetPhase}`);
  if (reason) console.log(`   原因：${reason}`);
  console.log(`   运行以下命令查看上下文：`);
  console.log(`   node harness-cli.js context ${taskId}\n`);
}

// ============================================================
// 命令：validate — 校验 state.json 完整性
// ============================================================

function cmdValidate(taskId) {
  const statePath = path.resolve(WORKFLOWS_DIR, taskId, "state.json");
  if (!fs.existsSync(statePath)) {
    console.error(`❌ 任务不存在：${taskId}`);
    console.error(`   期望路径：${statePath}`);
    process.exit(1);
  }

  const issues = [];
  let state;

  // ① JSON 解析
  try {
    state = readJSON(statePath);
  } catch (e) {
    issues.push(`❌ JSON 解析失败：${e.message}`);
    console.log(`\n📋 state.json 校验报告（${taskId}）`);
    console.log("═".repeat(50));
    for (const issue of issues) console.log(issue);
    console.log(`\n  建议：检查文件并重新 init 任务`);
    process.exit(1);
  }

  // ② 必填字段
  const requiredFields = [
    "id",
    "currentPhase",
    "phaseHistory",
    "retryCount",
    "createdAt",
    "updatedAt",
  ];
  for (const field of requiredFields) {
    if (!(field in state)) {
      issues.push(`❌ 缺少必填字段：${field}`);
    }
  }

  // ③ currentPhase 合法性
  if (state.currentPhase && !PHASES.includes(state.currentPhase)) {
    issues.push(
      `❌ 非法阶段值：${state.currentPhase}，允许值：${PHASES.join(", ")}`,
    );
  }

  // ④ phaseHistory 校验
  if (state.phaseHistory && Array.isArray(state.phaseHistory)) {
    for (const record of state.phaseHistory) {
      if (record.phase && !PHASES.includes(record.phase)) {
        issues.push(`❌ phaseHistory 包含非法阶段：${record.phase}`);
      }
      if (
        record.status &&
        ![
          "pending",
          "in_progress",
          "completed",
          "skipped",
          "failed",
          "retrying",
        ].includes(record.status)
      ) {
        issues.push(
          `⚠️ phaseHistory 包含非法状态：${record.phase} → ${record.status}`,
        );
      }
    }
  } else {
    issues.push(`❌ phaseHistory 缺失或不是数组`);
  }

  // ⑤ retryCount 类型
  if (typeof state.retryCount !== "number") {
    issues.push(`❌ retryCount 不是数字：${typeof state.retryCount}`);
  }

  // ⑥ 产物文件存在性
  if (state.phaseHistory && Array.isArray(state.phaseHistory)) {
    const outputDir = path.resolve(WORKFLOWS_DIR, taskId);
    for (const record of state.phaseHistory) {
      if (record.outputFiles && record.status === "completed") {
        for (const f of record.outputFiles) {
          const fullPath = path.resolve(outputDir, f);
          if (!fs.existsSync(fullPath)) {
            issues.push(
              `⚠️ phaseHistory 记录的产物不存在：${f}（阶段 ${record.phase}）`,
            );
          }
        }
      }
    }
  }

  // ⑧ 终态一致性
  if (TERMINAL_PHASES.includes(state.currentPhase)) {
    const activeRecords = (state.phaseHistory || []).filter(
      (r) => r.status === "in_progress" || r.status === "pending",
    );
    if (activeRecords.length > 0 && state.currentPhase === "DONE") {
      issues.push(`⚠️ 状态为 DONE 但仍有 ${activeRecords.length} 个未完成阶段`);
    }
  }

  // 输出报告
  const errorCount = issues.filter((i) => i.startsWith("❌")).length;
  const warnCount = issues.filter((i) => i.startsWith("⚠️")).length;

  console.log(`\n📋 state.json 校验报告（${taskId}）`);
  console.log("═".repeat(50));
  console.log(`  当前阶段：${state.currentPhase || "—"}`);
  console.log(`  阶段记录：${state.phaseHistory?.length || 0} 条`);
  console.log(
    `  Blockers：${state.blockers?.filter((b) => !b.resolved).length || 0} 条未解决`,
  );

  if (issues.length === 0) {
    console.log(`\n  ✅ state.json 通过校验`);
  } else {
    console.log(`\n  发现 ${errorCount} 个错误，${warnCount} 个警告：`);
    for (const issue of issues) console.log(`  ${issue}`);
  }

  if (errorCount > 0) {
    console.log(`\n  建议：修复后重新运行 validate，或重新 init 任务`);
    process.exit(1);
  }
}

// ============================================================
// 命令：init — 创建新任务
// ============================================================

/**
 * 简易技术栈别名 → 全称映射
 */
const TECH_ALIASES = {
  "react-ts": {
    framework: "React 18 + TypeScript 5",
    platform: "web",
    uiLibrary: "Ant Design",
    styling: "Tailwind CSS",
    stateManagement: "Zustand",
    router: "React Router v6",
    dataFetching: "React Query",
    buildTool: "Vite",
    packageManager: "",
  },
  vue3: {
    framework: "Vue 3 + TypeScript",
    platform: "web",
    uiLibrary: "Element Plus",
    styling: "UnoCSS",
    stateManagement: "Pinia",
    router: "Vue Router",
    dataFetching: "Vue Query",
    buildTool: "Vite",
    packageManager: "",
  },
  "react-next": {
    framework: "Next.js 14 + TypeScript",
    platform: "web",
    uiLibrary: "shadcn/ui",
    styling: "Tailwind CSS",
    stateManagement: "Zustand",
    router: "Next.js Router",
    dataFetching: "React Query",
    buildTool: "Next.js",
    packageManager: "",
  },
  miniapp: {
    framework: "微信小程序",
    platform: "miniapp",
    uiLibrary: "微信原生组件",
    styling: "WXSS",
    stateManagement: "",
    router: "微信原生路由",
    dataFetching: "wx.request",
    buildTool: "微信开发者工具",
    packageManager: "",
  },
  taro: {
    framework: "Taro",
    platform: "cross-platform",
    uiLibrary: "Taro UI",
    styling: "CSS Modules",
    stateManagement: "Zustand",
    router: "Taro Router",
    dataFetching: "axios",
    buildTool: "Taro CLI",
    packageManager: "",
  },
};

function cmdInit(args) {
  // 解析参数
  const taskName = args[1];
  if (!taskName) {
    console.error(
      "❌ 用法：harness-cli init <taskName> [--desc=...] [--tech=...] [--skip=...]",
    );
    process.exit(1);
  }

  // 注意：args[1] 是任务名，args[2..] 是选项
  const nameArgs = args.slice(2);
  let description = "";
  let techAlias = "";
  let skipStr = "";

  for (const arg of nameArgs) {
    if (arg.startsWith("--desc=")) {
      description = arg.substring(7);
    } else if (arg.startsWith("--tech=")) {
      techAlias = arg.substring(7);
    } else if (arg.startsWith("--skip=")) {
      skipStr = arg.substring(7);
    }
  }

  // 生成任务 ID
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const taskId = `${y}${m}${d}-${taskName}`;

  // 创建目录
  const taskDir = path.resolve(WORKFLOWS_DIR, taskId);
  if (fs.existsSync(taskDir)) {
    console.error(`❌ 任务已存在：${taskId}`);
    console.error(`   目录：${taskDir}`);
    process.exit(1);
  }
  fs.mkdirSync(taskDir, { recursive: true });

  // 构建 techStack（从别名或空）
  let techStack = {
    framework: "",
    platform: "",
    uiLibrary: "",
    styling: "",
    stateManagement: "",
    router: "",
    dataFetching: "",
    buildTool: "",
    packageManager: "",
  };
  if (techAlias && TECH_ALIASES[techAlias]) {
    techStack = { ...techStack, ...TECH_ALIASES[techAlias] };
  } else if (techAlias) {
    console.warn(`⚠️ 未知技术栈别名：${techAlias}，将创建空的技术栈配置`);
  }

  // 解析跳过的阶段
  const skippedPhases = skipStr
    ? skipStr
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s)
    : [];

  // 构建初始 state.json
  const timestamp = now.toISOString();
  const state = {
    id: taskId,
    name: taskName,
    description,
    currentPhase: "INIT",
    phaseHistory: [
      {
        phase: "INIT",
        status: "completed",
        qualityGate: "pass",
        startedAt: timestamp,
        completedAt: timestamp,
        outputFiles: ["state.json"],
      },
    ],
    retryCount: 0,
    maxRetries: DEFAULT_MAX_RETRIES,
    blockers: [],
    skippedPhases,
    techStack,
    outputDir: `docs/workflows/${taskId}/`,
    checkpoint: {
      phase: "INIT",
      timestamp,
      filesSnapshot: {},
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  writeJSON(path.join(taskDir, "state.json"), state);

  console.log(`✅ 任务创建成功：${taskId}`);
  console.log(`   名称：${taskName}`);
  console.log(`   目录：${taskDir}`);
  if (techAlias && TECH_ALIASES[techAlias]) {
    console.log(`   技术栈：${techStack.framework}`);
  }
  if (skippedPhases.length > 0) {
    console.log(`   跳过阶段：${skippedPhases.join(", ")}`);
  }
  console.log(`   状态：已初始化，运行以下命令查看上下文：`);
  console.log(`   node harness-cli.js context ${taskId}`);
}

// ============================================================
// 主入口

function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (!cmd || cmd === "--help" || cmd === "-h") {
    console.log(`
harness-cli — 前端开发 Harness 编译器

用法：
  harness-cli list                       列出所有任务
  harness-cli status <taskId>            查看任务详细状态
  harness-cli context <taskId>           编译执行上下文供 LLM 使用
  harness-cli verify <taskId> <phase> <file>  校验产物并更新状态
  harness-cli init <taskName> [--desc=...] [--tech=...] [--skip=...]  创建新任务
  harness-cli rollback <taskId> <targetPhase> [--reason=...]  回退到指定阶段
  harness-cli validate <taskId>          校验 state.json 完整性

环境变量：
  HARNESS_WORKFLOWS_DIR   workflows 目录路径（默认：docs/workflows）

示例：
  node harness-cli.js list
  node harness-cli.js status 20260603-user-list
  node harness-cli.js context 20260603-user-list
  node harness-cli.js verify 20260603-user-list PRD docs/workflows/20260603-user-list/prd.md
  node harness-cli.js init user-module --desc="用户管理模块" --tech=react-ts --skip=PRD,SPEC
  node harness-cli.js rollback 20260603-user-list DESIGN --reason="设计冲突"
  node harness-cli.js validate 20260603-user-list
`);
    return;
  }

  switch (cmd) {
    case "list":
      cmdList();
      break;

    case "status":
      if (!args[1]) {
        console.error("❌ 用法：harness-cli status <taskId>");
        process.exit(1);
      }
      cmdStatus(args[1]);
      break;

    case "context":
      if (!args[1]) {
        console.error("❌ 用法：harness-cli context <taskId>");
        process.exit(1);
      }
      cmdContext(args[1]);
      break;

    case "verify":
      if (!args[1] || !args[2] || !args[3]) {
        console.error("❌ 用法：harness-cli verify <taskId> <phase> <file>");
        process.exit(1);
      }
      cmdVerify(args[1], args[2], args[3]);
      break;

    case "init":
      cmdInit(args);
      break;

    case "rollback":
      if (!args[1] || !args[2]) {
        console.error(
          "❌ 用法：harness-cli rollback <taskId> <targetPhase> [--reason=...]",
        );
        process.exit(1);
      }
      cmdRollback(args[1], args[2], args.slice(3));
      break;

    case "validate":
      if (!args[1]) {
        console.error("❌ 用法：harness-cli validate <taskId>");
        process.exit(1);
      }
      cmdValidate(args[1]);
      break;

    default:
      console.error(`❌ 未知命令：${cmd}`);
      console.error(
        "   可用命令：list, status, context, verify, init, rollback, validate",
      );
      process.exit(1);
  }
}

main();
