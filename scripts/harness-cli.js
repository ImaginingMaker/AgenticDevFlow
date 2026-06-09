#!/usr/bin/env node

/**
 * harness-cli — 项目级 CLI 入口（shim）
 *
 * 此文件是项目根目录的 CLI 入口，委托到 skill 目录下的实际实现。
 * 所有 `node scripts/harness-cli.js` 的命令都会通过此处路由到
 * skills/adfo-harness-runner/scripts/harness-cli.js。
 *
 * 这样设计的好处：
 * 1. SKILL.md 中的 `node scripts/harness-cli.js` 路径可以正常工作
 * 2. CLI 实现与技能打包在一起，保持内聚
 * 3. 外部使用时只有根目录入口暴露，不暴露技能内部结构
 */

require("../skills/adfo-harness-runner/scripts/harness-cli.js");
