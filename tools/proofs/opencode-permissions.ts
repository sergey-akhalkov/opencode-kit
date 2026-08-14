#!/usr/bin/env node
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

type Options = {
  candidateId: string | null;
  evidenceRoot: string | null;
};

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const proofEnv = { ...process.env, OPENCODE_CONFIG_DIR: path.join(sourceRoot, "global") };

function parseArgs(args: string[]): Options {
  let candidateId: string | null = null;
  let evidenceRoot: string | null = null;
  for (let index = 0; index < args.length; index++) {
    const value = args[index + 1];
    if (args[index] === "--candidate-id" && value != null) {
      candidateId = value;
      index++;
    } else if (args[index] === "--evidence-root" && value != null) {
      evidenceRoot = path.resolve(value);
      index++;
    } else {
      throw new Error(`Unknown or incomplete option: ${args[index]}`);
    }
  }
  if ((candidateId == null) !== (evidenceRoot == null)) {
    throw new Error("--candidate-id and --evidence-root must be supplied together");
  }
  if (candidateId != null && !/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(candidateId)) {
    throw new Error("--candidate-id must be a safe identifier");
  }
  if (evidenceRoot != null && !path.isAbsolute(evidenceRoot)) {
    throw new Error("--evidence-root must be absolute");
  }
  return { candidateId, evidenceRoot };
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value == null || typeof value !== "object") return value;
  const input = value as JsonRecord;
  return Object.fromEntries(Object.keys(input).sort().map((key) => [key, stableValue(input[key])]));
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

function sha256(value: string | Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function writeNew(file: string, value: unknown): void {
  fs.writeFileSync(file, stableJson(value), { encoding: "utf8", flag: "wx" });
}

function record(value: unknown): JsonRecord | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : null;
}

function runJson(args: string[]): JsonRecord {
  const result = spawnSync("opencode", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    env: proofEnv,
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

function configuredAction(value: unknown, permission: string): string {
  if (typeof value === "string") return value;
  const rules = record(value);
  const exact = rules?.[permission];
  if (typeof exact === "string") return exact;
  const exactPattern = record(exact)?.["*"];
  if (typeof exactPattern === "string") return exactPattern;
  const wildcard = rules?.["*"];
  if (typeof wildcard === "string") return wildcard;
  return "allow";
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
  env: proofEnv,
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
let explicitDeniedPermissions = 0;
const specialistDeniedPermissions: Array<{ agent: string; permissions: string[] }> = [];
let arbiterToolsAllFalse = false;
let arbiterDisabledToolCount = 0;
let sdetEditPermission: string | null = null;
for (const name of agentNames) {
  const configured = record(agents[name]);
  if (configured == null) throw new Error(`Resolved agent config is invalid: ${name}`);

  const effective = runJson(["debug", "agent", name]);
  const deniedPermissions: string[] = [];
  for (const permission of PERMISSION_KINDS) {
    const expected = configuredAction(configured.permission, permission);
    const action = effectiveAction(effective.permission, permission);
    if (name === "sdet-quality-engineer" && permission === "edit") sdetEditPermission = action;
    if (expected === "deny") {
      explicitDeniedPermissions += 1;
      deniedPermissions.push(permission);
    }
    if (action !== expected) {
      throw new Error(`Effective agent permission differs from configured policy: agent=${name} permission=${permission} expected=${expected} action=${action ?? "missing"}`);
    }
  }
  if (deniedPermissions.length > 0) specialistDeniedPermissions.push({ agent: name, permissions: deniedPermissions });
  if (name === "session-completion-arbiter") {
    const tools = record(effective.tools);
    if (tools == null || Object.keys(tools).length === 0 || Object.values(tools).some((value) => value !== false)) {
      throw new Error("Effective hidden arbiter tool map is not all-false");
    }
    arbiterToolsAllFalse = true;
    arbiterDisabledToolCount = Object.keys(tools).length;
  }
}
if (explicitDeniedPermissions === 0) throw new Error("Resolved agents contain no explicit denied specialist permissions");
if (!arbiterToolsAllFalse) throw new Error("Resolved agents contain no hidden completion arbiter");
if (sdetEditPermission !== "allow") {
  throw new Error(`Resolved SDET edit permission is not unattended: ${sdetEditPermission ?? "missing"}`);
}

const options = parseArgs(process.argv.slice(2));
const summary = {
  schemaVersion: 1,
  boundary: "installed-opencode-resolved-agent-permissions",
  opencodeVersion: versionResult.stdout.trim(),
  agentCount: agentNames.length,
  agents: agentNames,
  explicitDeniedPermissions,
  specialistDeniedPermissions,
  arbiter: {
    disabledToolCount: arbiterDisabledToolCount,
    toolsAllFalse: arbiterToolsAllFalse,
  },
  sdet: {
    editPermission: sdetEditPermission,
  },
  permissionKinds: PERMISSION_KINDS,
  outcome: "pass",
};

if (options.evidenceRoot != null && options.candidateId != null) {
  if (fs.existsSync(options.evidenceRoot)) throw new Error("Evidence root already exists");
  fs.mkdirSync(options.evidenceRoot, { recursive: false });
  writeNew(path.join(options.evidenceRoot, "raw.json"), {
    ...summary,
    candidateId: options.candidateId,
    environment: { node: process.version, platform: process.platform },
    invocation: ["npm", "run", "proof:permissions", "--", "--evidence-root", "<evidence-root>", "--candidate-id", options.candidateId],
    productionSources: [
      "global/extensions/session-completion-guard/runtime-support.ts",
      "global/extensions/session-completion-guard/arbiter-route.ts",
      "global/agents/session-completion-arbiter.md",
      "global/agents/sdet-quality-engineer.md",
    ].map((relative) => ({ path: relative, sha256: sha256(fs.readFileSync(path.join(sourceRoot, relative))) })),
    runnerSource: {
      path: "tools/proofs/opencode-permissions.ts",
      sha256: sha256(fs.readFileSync(fileURLToPath(import.meta.url))),
    },
  });
  writeNew(path.join(options.evidenceRoot, "evaluation.json"), {
    candidateId: options.candidateId,
    hiddenArbiterTools: "all-false",
    mainDefault: "permissive",
    schemaVersion: 1,
    specialistRestrictions: "preserved",
    status: "complete",
  });
}

console.log(stableJson(options.evidenceRoot == null
  ? summary
  : { candidateId: options.candidateId, evidenceRoot: "<evidence-root>", status: "complete" }).trimEnd());
