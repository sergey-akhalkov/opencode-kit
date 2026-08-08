#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targetArg = process.argv[2];

if (!targetArg) {
  console.error("Usage: node tools/run-focused-test.ts <test-file> [args...]");
  process.exit(2);
}

const target = path.resolve(root, targetArg);
const relative = path.relative(root, target);
if (relative.startsWith("..") || path.isAbsolute(relative) || !fs.existsSync(target) || !fs.statSync(target).isFile()) {
  console.error(`Focused test target must be a repository file: ${targetArg}`);
  process.exit(2);
}

const result = spawnSync(process.execPath, [target, ...process.argv.slice(3)], {
  cwd: root,
  encoding: "utf8",
  shell: false,
});

if (result.error) {
  console.error(`Failed to start focused test ${relative}: ${result.error.message}`);
  process.exit(1);
}

const stdout = result.stdout ?? "";
const stderr = result.stderr ?? "";
if (result.status !== 0) {
  process.stdout.write(stdout);
  process.stderr.write(stderr);
  if (result.signal) {
    console.error(`Focused test ${relative} terminated by signal ${result.signal}.`);
  }
  process.exit(result.status ?? 1);
}

const summary = stdout
  .trimEnd()
  .split(/\r?\n/)
  .reverse()
  .find((line) => line.startsWith("OK:"));
console.log(summary ?? `OK: focused test ${relative.replaceAll("\\", "/")}`);
