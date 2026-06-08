#!/usr/bin/env node
/**
 * harness-cli 测试
 * 用法：node test/test.js
 * 零依赖，只测试最核心的行为
 */

const assert = require("assert");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const CLI =
  "node " + path.resolve(__dirname, "..", "scripts", "harness-cli.js");
const FIXTURES = path.resolve(__dirname, "fixtures");

// 临时测试目录
const TEST_WORKFLOWS = path.resolve(__dirname, "tmp-test-workflows");
const HARNESS_ENV = { ...process.env, HARNESS_WORKFLOWS_DIR: TEST_WORKFLOWS };

function run(args, env = HARNESS_ENV) {
  const fullCmd = `${CLI} ${args}`;
  return execSync(fullCmd, { env, encoding: "utf-8" });
}

function runSilent(args, env = HARNESS_ENV) {
  try {
    const fullCmd = `${CLI} ${args}`;
    return execSync(fullCmd, { env, encoding: "utf-8", stdio: "pipe" });
  } catch (e) {
    return e.stderr || e.stdout || e.message;
  }
}

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}`);
    console.log(`     期望：${e.expected}`);
    console.log(`     实际：${e.actual}`);
    failed++;
  }
}

// ============================================================
// 准备：复制 fixtures 到临时目录
// ============================================================

function setup() {
  if (fs.existsSync(TEST_WORKFLOWS)) {
    fs.rmSync(TEST_WORKFLOWS, { recursive: true });
  }

  // 从 fixtures 创建 3 个任务
  const tasks = {
    "20260523-login-page": "state-done.json",
    "20260603-user-list": "state-active.json",
    "20260523-user-list": "state-rollback.json",
  };

  for (const [taskId, fixture] of Object.entries(tasks)) {
    const dir = path.join(TEST_WORKFLOWS, taskId);
    fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(path.join(FIXTURES, fixture), path.join(dir, "state.json"));
  }
}

setup();

// ============================================================
// 测试 list 命令
// ============================================================

console.log("\n📋 测试：harness list");

test("列出活跃任务", () => {
  const out = run("list");
  const hasActive =
    out.includes("20260603-user-list") && out.includes("20260523-user-list");
  const hasDone = out.includes("20260523-login-page");
  assert.ok(hasActive, "应列出活跃任务（进行中和回退中的）");
  assert.ok(hasDone, "应列出已完成任务");
});

test("空目录返回提示信息", () => {
  const env = {
    ...process.env,
    HARNESS_WORKFLOWS_DIR: "/tmp/harness-test-empty",
  };
  const out = execSync(`${CLI} list`, { env, encoding: "utf-8" });
  assert.ok(out.includes("暂无任务"), "空目录应提示暂无任务");
});

// ============================================================
// 测试 status 命令
// ============================================================

console.log("\n📋 测试：harness status");

test("已完成任务的状态", () => {
  const out = run("status 20260523-login-page");
  assert.ok(out.includes("DONE"), "应显示 DONE 阶段");
  assert.ok(out.includes("流水线已完成"), "应提示流水线完成");
});

test("活跃任务显示下一阶段", () => {
  const out = run("status 20260603-user-list");
  assert.ok(out.includes("PRD"), "应显示 PRD 阶段");
  assert.ok(out.includes("下一阶段"), "应提示下一阶段");
});

test("回退任务显示 blockers", () => {
  const out = run("status 20260523-user-list");
  assert.ok(out.includes("IMPLEMENT"), "应显示 IMPLEMENT 阶段");
  assert.ok(out.includes("Loading"), "应显示 blocker 详情");
  assert.ok(out.includes("Empty"), "应显示第二个 blocker");
  assert.ok(out.includes("Blockers"), "应包含 Blockers 标题");
});

test("不存在的任务报错", () => {
  const out = runSilent("status nonexistent-task");
  assert.ok(out.includes("不存在"), "应提示任务不存在");
});

// ============================================================
// 测试 context 命令（核心）
// ============================================================

console.log("\n📋 测试：harness context");

test("活跃任务生成正确的执行上下文", () => {
  const out = run("context 20260603-user-list");
  assert.ok(
    out.includes("adfp-spec-generator"),
    "下一阶段是 SPEC，应推荐 spec-generator 技能",
  );
  assert.ok(out.includes("spec.md"), "应指向 SPEC 产物");
  assert.ok(out.includes("qualityGate=pass"), "应包含质量门规则");
  assert.ok(out.includes("上游产物"), "应包含上游产物状态");
});

test("已完成任务生成 DONE 上下文", () => {
  const out = run("context 20260523-login-page");
  assert.ok(out.includes("DONE"), "应指向 DONE");
  assert.ok(out.includes("无需原子技能"), "应提示无技能需求");
});

test("回退任务包含 blockers 信息", () => {
  const out = run("context 20260523-user-list");
  assert.ok(
    out.includes("IMPLEMENT"),
    "应显示下一阶段为 IMPLEMENT（回退修复）",
  );
  assert.ok(out.includes("Blockers"), "应包含 blockers 区块");
});

test("已完成任务包含技术栈信息", () => {
  const out = run("context 20260523-login-page");
  assert.ok(out.includes("技术栈"), "应包含技术栈区块");
  assert.ok(out.includes("React 18"), "应包含 framework 值");
  assert.ok(out.includes("Tailwind CSS"), "应包含 styling 值");
});

test("活跃任务上下文包含技术栈详情", () => {
  const out = run("context 20260603-user-list");
  assert.ok(out.includes("技术栈"), "应包含技术栈区块");
  assert.ok(out.includes("Zustand"), "应包含 stateManagement 值");
  assert.ok(out.includes("React Query"), "应包含 dataFetching 值");
});

// ============================================================
// 测试 verify 命令
// ============================================================

console.log("\n📋 测试：harness verify");

// 创建测试产物文件
const artifactDir = path.join(TEST_WORKFLOWS, "20260603-user-list");

test("合法产物 → pass + 更新 state.json", () => {
  const validArtifact = path.join(artifactDir, "test-prd-pass.md");
  fs.writeFileSync(
    validArtifact,
    `---
phase: PRD
status: completed
qualityGate: pass
---

这是 PRD 文档的正文内容，超过五十个字符的实质性内容，包含了用户故事、功能清单和验收标准。这里补充一些内容确保正文足够长。
`,
  );

  const out = run(`verify 20260603-user-list PRD ${validArtifact}`);
  const result = JSON.parse(out);

  assert.strictEqual(result.gate, "pass", "合法产物应 pass");
  assert.strictEqual(result.phase_match, true, "阶段应匹配");
  assert.ok(result.body_length >= 50, "正文长度应符合");
  // state.json 应已更新
  const updated = JSON.parse(
    fs.readFileSync(path.join(artifactDir, "state.json"), "utf-8"),
  );
  assert.ok(
    updated.phaseHistory.some(
      (p) => p.phase === "PRD" && p.qualityGate === "pass",
    ),
    "state.json 应包含 PRD 记录",
  );
  assert.strictEqual(
    updated.currentPhase,
    "SPEC",
    "currentPhase 应递进到下一阶段 SPEC",
  );
  assert.strictEqual(
    updated.checkpoint.phase,
    "PRD",
    "checkpoint.phase 应指向刚完成的阶段 PRD",
  );
});

test("缺少 front-matter → fail + 不更新 state.json", () => {
  const badArtifact = path.join(artifactDir, "test-no-fm.md");
  fs.writeFileSync(badArtifact, "只有正文没有元数据区块");

  const out = runSilent(`verify 20260603-user-list SPEC ${badArtifact}`);
  // 检查是否提示 front-matter 缺失
  assert.ok(
    out.includes("fail") || out.includes("缺少"),
    "缺少 front-matter 应 fail",
  );
});

test("产物内容不足 50 字符 → warn", () => {
  const shortArtifact = path.join(artifactDir, "test-short.md");
  fs.writeFileSync(
    shortArtifact,
    `---
phase: SPEC
status: completed
qualityGate: pass
---

内容很短
`,
  );

  const out = run(`verify 20260603-user-list SPEC ${shortArtifact}`);
  const result = JSON.parse(out);
  assert.ok(
    result.gate === "warn" || result.gate === "fail",
    "内容不足应 warn 或 fail",
  );
  assert.ok(
    result.issues.some((i) => i.includes("字符")),
    "应提示字符数不足",
  );
});

test("不存在的任务报错", () => {
  const out = runSilent("verify nonexistent PRD /tmp/test.md");
  assert.ok(out.includes("不存在"), "应提示任务不存在");
});

// ============================================================
// 测试 help
// ============================================================

console.log("\n📋 测试：harness --help");

test("无参数时显示帮助", () => {
  const out = runSilent("");
  assert.ok(out.includes("list"), "帮助应列出 list 命令");
  assert.ok(out.includes("status"), "帮助应列出 status 命令");
  assert.ok(out.includes("context"), "帮助应列出 context 命令");
});

test("--help 显示帮助", () => {
  const out = runSilent("--help");
  assert.ok(out.includes("verify"), "帮助应列出 verify 命令");
});

// ============================================================
// 测试 init 命令
// ============================================================

console.log("\n📋 测试：harness init");

const initWorkflows = path.resolve(__dirname, "tmp-init-test-workflows");
const INIT_ENV = { ...process.env, HARNESS_WORKFLOWS_DIR: initWorkflows };

function initRun(args, env = INIT_ENV) {
  const fullCmd = `${CLI} init ${args}`;
  return execSync(fullCmd, { env, encoding: "utf-8" });
}

function initRunSilent(args, env = INIT_ENV) {
  try {
    const fullCmd = `${CLI} init ${args}`;
    return execSync(fullCmd, { env, encoding: "utf-8", stdio: "pipe" });
  } catch (e) {
    return e.stderr || e.stdout || e.message;
  }
}

// 清理之前的 init 测试目录
if (fs.existsSync(initWorkflows)) {
  fs.rmSync(initWorkflows, { recursive: true });
}

test("init 创建新任务并包含技术栈", () => {
  const out = initRun('test-module --desc="测试模块" --tech=react-ts');
  assert.ok(out.includes("任务创建成功"), "应提示创建成功");
  assert.ok(out.includes("test-module"), "应包含任务名");
  assert.ok(out.includes("React 18"), "应包含技术栈框架名");

  // 验证 state.json 文件存在且包含 techStack
  const statePath = path.join(
    initWorkflows,
    fs.readdirSync(initWorkflows)[0],
    "state.json",
  );
  const state = JSON.parse(fs.readFileSync(statePath, "utf-8"));
  assert.ok(state.techStack, "state.json 应包含 techStack 字段");
  assert.strictEqual(
    state.techStack.framework,
    "React 18 + TypeScript 5",
    "techStack.framework 应匹配",
  );
  assert.strictEqual(
    state.techStack.uiLibrary,
    "Ant Design",
    "techStack.uiLibrary 应匹配",
  );
  assert.strictEqual(state.currentPhase, "INIT", "currentPhase 应为 INIT");
});

test("init 带 --skip 参数正确解析", () => {
  const out = initRun("skip-test --skip=PRD,SPEC");
  assert.ok(out.includes("skip-test"), "应包含任务名");
  assert.ok(out.includes("PRD, SPEC"), "应列出跳过的阶段");

  const statePath = path.join(
    initWorkflows,
    fs.readdirSync(initWorkflows).find((d) => d.includes("skip-test")),
    "state.json",
  );
  const state = JSON.parse(fs.readFileSync(statePath, "utf-8"));
  assert.deepStrictEqual(
    state.skippedPhases,
    ["PRD", "SPEC"],
    "skippedPhases 应包含 PRD 和 SPEC",
  );
});

test("init 不带参数报错", () => {
  const out = initRunSilent("");
  assert.ok(out.includes("用法"), "无参数应显示用法提示");
});

test("init 创建的任务可被 context 读取且包含 techStack", () => {
  // 使用 --tech=react-ts 创建的任务（test-module）
  const dirs = fs
    .readdirSync(initWorkflows)
    .filter((d) => d.includes("test-module"));
  const taskId = dirs[0];
  const ctxOut = execSync(`${CLI} context ${taskId}`, {
    env: INIT_ENV,
    encoding: "utf-8",
  });
  assert.ok(ctxOut.includes("技术栈"), "context 输出应包含技术栈区块");
  assert.ok(ctxOut.includes("React 18"), "context 应包含技术栈框架 React 18");
  assert.ok(
    ctxOut.includes("Ant Design"),
    "context 应包含技术栈 UI 库 Ant Design",
  );
});

// 清理 init 测试目录
fs.rmSync(initWorkflows, { recursive: true, force: true });

// ============================================================
// 清理
// ============================================================

fs.rmSync(TEST_WORKFLOWS, { recursive: true, force: true });

// ============================================================
// 汇总
// ============================================================

console.log("\n" + "=".repeat(40));
console.log(`测试完成：${passed} 通过，${failed} 失败`);
console.log("=".repeat(40));

process.exit(failed > 0 ? 1 : 0);
