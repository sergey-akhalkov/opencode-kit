#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const PERMISSION_KINDS = [
  "bash",
  "doom_loop",
  "edit",
  "external_directory",
  "glob",
  "grep",
  "list",
  "lsp",
  "question",
  "read",
  "skill",
  "task",
  "todowrite",
  "webfetch",
  "websearch",
] as const;

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : null;
}

function runJson(args: string[]): JsonRecord {
  const result = spawnSync("opencode", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    env: process.env,
    maxBuffer: 16 * 1024 * 1024,
    shell: false,
  });
  if (result.error != null) {
    const error = new Error(`Failed to launch opencode ${args.join(" ")}`) as Error & { cause?: unknown };
    error.cause = result.error;
    throw error;
  }
  if (result.status !== 0) {
    throw new Error(
      `opencode ${args.join(" ")} exited with status ${result.status ?? "unknown"}; stderr suppressed to avoid leaking resolved configuration`,
    );
  }
  try {
    const parsed = JSON.parse(result.stdout) as unknown;
    const output = record(parsed);
    if (output == null) throw new Error("output is not a JSON object");
    return output;
  } catch (error) {
    const wrapped = new Error(`opencode ${args.join(" ")} returned invalid JSON`) as Error & { cause?: unknown };
    wrapped.cause = error;
    throw wrapped;
  }
}

function allowsEverything(value: unknown): boolean {
  return value === "allow" || record(value)?.["*"] === "allow";
}

function effectiveAction(rules: unknown, permission: string): string | null {
  if (!Array.isArray(rules)) return null;
  let action: string | null = null;
  for (const value of rules) {
    const rule = record(value);
    if (
      (rule?.permission === "*" || rule?.permission === permission) &&
      rule.pattern === "*" &&
      typeof rule.action === "string"
    ) {
      action = rule.action;
    }
  }
  return action;
}

const versionResult = spawnSync("opencode", ["--version"], {
  cwd: process.cwd(),
  encoding: "utf8",
  env: process.env,
  shell: false,
});
if (versionResult.error != null || versionResult.status !== 0) {
  const error = new Error("Installed opencode version probe failed") as Error & { cause?: unknown };
  error.cause = versionResult.error;
  throw error;
}

const config = runJson(["debug", "config"]);
if (!allowsEverything(config.permission)) {
  throw new Error("Resolved top-level OpenCode permission is not allow-all");
}

const agents = record(config.agent);
if (agents == null || Object.keys(agents).length === 0) {
  throw new Error("Resolved OpenCode config contains no agents");
}

const agentNames = Object.keys(agents).sort();
for (const name of agentNames) {
  const configured = record(agents[name]);
  if (configured == null || !allowsEverything(configured.permission)) {
    throw new Error(`Resolved agent permission is not allow-all: ${name}`);
  }

  const effective = runJson(["debug", "agent", name]);
  for (const permission of PERMISSION_KINDS) {
    const action = effectiveAction(effective.permission, permission);
    if (action !== "allow") {
      throw new Error(`Effective agent permission is not allow: agent=${name} permission=${permission} action=${action ?? "missing"}`);
    }
  }
}

console.log(JSON.stringify({
  schemaVersion: 1,
  boundary: "installed-opencode-resolved-agent-permissions",
  opencodeVersion: versionResult.stdout.trim(),
  agentCount: agentNames.length,
  agents: agentNames,
  permissionKinds: PERMISSION_KINDS,
  outcome: "pass",
}, null, 2));
