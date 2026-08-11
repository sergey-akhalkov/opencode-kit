#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runPortableCommand } from "../../global/bin/portable-process.ts";
import { loadModelProfile } from "../model-profile.ts";

type CaptureKind = "baseline" | "candidate";
type RunnerMode = "capture" | "cli-proof" | "evaluate" | "preflight" | "sanitize" | "scenario-preflight";
type ScenarioId =
  | "local-owner"
  | "exact-clone"
  | "semantic-near-clone"
  | "unique-compatibility-test"
  | "no-match-helper"
  | "trivial-fix";

type Arguments = {
  baselineOverrideRoot: string | null;
  baselineRoot: string | null;
  candidateId: string;
  candidateOverrideRoot: string | null;
  candidateRoot: string | null;
  captureKind: CaptureKind;
  evidenceRoot: string;
  mode: RunnerMode;
  profile: string;
  scenarios: ScenarioId[];
};

type FileFact = { hash: string; path: string };
type ToolCall = { input: unknown; name: string; status: string | null };

type ScenarioBundle = {
  schemaVersion: 1;
  candidate: {
    id: string;
    kind: CaptureKind;
    sourceHashes: Record<string, string | null>;
  };
  cleanup: {
    error: string | null;
    removed: boolean;
    sessionDeleteStatuses: Array<{ sessionID: string; status: number | null }>;
  };
  command: {
    argv: string[];
    status: number | null;
    stderr: string;
    stdout: string;
  };
  environment: {
    agent: string;
    model: string;
    profile: string;
    route: string;
    toolPolicy: string[];
    variant: string;
  };
  facts: {
    assistantText: string;
    costs: number[];
    elapsedMs: number;
    eventCount: number;
    modelIds: string[];
    sessionIds: string[];
    tokens: unknown[];
    toolCalls: ToolCall[];
  };
  input: {
    command: string | null;
    message: string;
    scenario: ScenarioId;
  };
  sideEffects: {
    after: FileFact[];
    before: FileFact[];
  };
};

const SCENARIOS: readonly ScenarioId[] = [
  "local-owner",
  "exact-clone",
  "semantic-near-clone",
  "unique-compatibility-test",
  "no-match-helper",
  "trivial-fix",
];

const TOOL_POLICY = [
  "bash: jscpd only; shell metacharacters denied last",
  "edit: deny",
  "external_directory: deny",
  "glob: allow",
  "grep: allow",
  "question: deny",
  "read: allow",
  "skill: allow",
  "task: code-quality-reviewer only",
  "webfetch: deny",
];

const PROOF_PERMISSION = {
  "*": "deny",
  bash: {
    "*": "deny",
    "jscpd *": "allow",
    "jscpd.exe *": "allow",
    "*;*": "deny",
    "*&&*": "deny",
    "*|*": "deny",
    "*>*": "deny",
    "*<*": "deny",
  },
  edit: "deny",
  external_directory: "deny",
  glob: "allow",
  grep: "allow",
  question: "deny",
  read: "allow",
  skill: "allow",
  task: {
    "*": "deny",
    "code-quality-reviewer": "allow",
  },
  webfetch: "deny",
} as const;

const BASELINE_COMMAND = `---
description: Perform a bounded read-only duplication review without a specialized workflow.
agent: build
---

Audit code duplication only inside this repository-contained scope:

$ARGUMENTS

Use available read-only evidence. Do not edit files, install anything, or expand into an exhaustive audit. Return candidate locations, meaningful differences, a reduction recommendation, and proof needed before any later change.
Do not load or use a specialized deduplication skill; this disposable command is the baseline instruction.
`;

const TRIVIAL_PROMPT = "Planning only: fix the one owner-local punctuation defect described in task.md. Do not edit files. State the smallest correction and nearest proof. Do not perform a duplication audit, invoke jscpd, load a deduplication skill, or dispatch a reviewer.";

const SHARED_BLOCK = [
  "  const normalized = input.trim().toLowerCase();",
  "  if (normalized.length === 0) throw new Error(\"empty input\");",
  "  const parts = normalized.split(\"/\").filter(Boolean);",
  "  const selected = parts.map((part) => part.replace(/[^a-z0-9-]/g, \"\"));",
  "  if (selected.some((part) => part.length === 0)) throw new Error(\"invalid segment\");",
  "  return selected.join(\"/\");",
];

function repositoryRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
}

function argumentValue(name: string): string | null {
  const index = process.argv.indexOf(name);
  return index < 0 ? null : process.argv[index + 1] ?? null;
}

function parseScenarioList(value: string | null): ScenarioId[] {
  if (value == null || value === "all") return [...SCENARIOS];
  const raw = value.split(",");
  const selected = raw.filter((item): item is ScenarioId => SCENARIOS.includes(item as ScenarioId));
  if (selected.length === 0 || selected.length !== raw.length) {
    throw new Error(`Invalid --scenarios value; expected all or comma-separated ${SCENARIOS.join(",")}`);
  }
  return [...new Set(selected)];
}

function argumentsFromCli(): Arguments {
  const mode = argumentValue("--mode");
  if (mode !== "capture" && mode !== "cli-proof" && mode !== "evaluate" && mode !== "preflight" && mode !== "sanitize" && mode !== "scenario-preflight") {
    throw new Error("Usage: node tools/proofs/deduplication-audit.ts --mode preflight|scenario-preflight|capture|cli-proof|evaluate|sanitize --evidence-root <path> [--capture-kind baseline|candidate] [--candidate-id <id>] [--profile quality-independent] [--scenarios all|id,...] [--baseline-root <path> --candidate-root <path> --baseline-override-root <path> --candidate-override-root <path>]");
  }
  const captureKind = argumentValue("--capture-kind") ?? "baseline";
  if (captureKind !== "baseline" && captureKind !== "candidate") {
    throw new Error("--capture-kind must be baseline or candidate");
  }
  const evidenceRoot = argumentValue("--evidence-root");
  if (evidenceRoot == null || evidenceRoot.trim() === "") throw new Error("--evidence-root is required");
  return {
    baselineOverrideRoot: argumentValue("--baseline-override-root"),
    baselineRoot: argumentValue("--baseline-root"),
    candidateId: argumentValue("--candidate-id") ?? `${captureKind}-working-tree`,
    candidateOverrideRoot: argumentValue("--candidate-override-root"),
    candidateRoot: argumentValue("--candidate-root"),
    captureKind,
    evidenceRoot: path.resolve(evidenceRoot),
    mode,
    profile: argumentValue("--profile") ?? "quality-independent",
    scenarios: parseScenarioList(argumentValue("--scenarios")),
  };
}

function sha256(value: string | Uint8Array): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hashFile(file: string): string | null {
  try {
    return sha256(fs.readFileSync(file));
  } catch {
    return null;
  }
}

function writeText(file: string, value: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value, "utf8");
}

function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(temporary, file);
}

function safeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function redact(text: string, roots: Array<[string, string]>): string {
  let redacted = text;
  for (const [root, label] of roots) {
    if (root === "") continue;
    for (const value of [root, root.replaceAll("\\", "\\\\"), root.replaceAll("\\", "/")]) {
      const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      redacted = redacted.replace(new RegExp(escaped, process.platform === "win32" ? "gi" : "g"), label);
    }
  }
  return redacted;
}

function redactEvidenceString(text: string, kitRoot: string, proofRoot: string): string {
  let redacted = redact(text, [
    [proofRoot, "<proof-root>"],
    [kitRoot, "<kit-root>"],
    [os.homedir(), "<home>"],
  ]);
  const temporaryRoots = [os.tmpdir(), os.tmpdir().replaceAll("\\", "\\\\"), os.tmpdir().replaceAll("\\", "/")];
  temporaryRoots.push(...temporaryRoots.map((temp) => redact(temp, [[os.homedir(), "<home>"]])));
  for (const temp of temporaryRoots) {
    for (const separator of ["\\", "\\\\", "/"]) {
      const prefix = `${temp}${separator}deduplication-audit-`;
      let index = redacted.toLowerCase().indexOf(prefix.toLowerCase());
      while (index >= 0) {
        let end = index + prefix.length;
        while (end < redacted.length && !/[\\/"\s]/.test(redacted[end])) end++;
        redacted = `${redacted.slice(0, index)}<proof-root>${redacted.slice(end)}`;
        index = redacted.toLowerCase().indexOf(prefix.toLowerCase());
      }
    }
  }
  redacted = redact(redacted, [[path.basename(os.homedir()), "<user>"]]);
  return redacted;
}

function redactEvidenceValue(value: unknown, kitRoot: string): unknown {
  if (typeof value === "string") return redactEvidenceString(value, kitRoot, "");
  if (Array.isArray(value)) return value.map((item) => redactEvidenceValue(item, kitRoot));
  if (value != null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, redactEvidenceValue(item, kitRoot)]));
  }
  return value;
}

function credentialCount(output: string): number | null {
  const match = output.match(/(\d+)\s+credentials?/i);
  return match == null ? null : Number.parseInt(match[1], 10);
}

function visit(value: unknown, callback: (record: Record<string, unknown>) => void): void {
  if (Array.isArray(value)) {
    for (const item of value) visit(item, callback);
    return;
  }
  if (value != null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    callback(record);
    for (const child of Object.values(record)) visit(child, callback);
  }
}

function parseEventFacts(stdout: string): ScenarioBundle["facts"] {
  const events = stdout.split(/\r?\n/).flatMap((line) => {
    if (!line.trim().startsWith("{")) return [];
    try {
      return [JSON.parse(line) as unknown];
    } catch {
      return [];
    }
  });
  const assistantText: string[] = [];
  const costs: number[] = [];
  const modelIds = new Set<string>();
  const sessionIds = new Set<string>();
  const tokens: unknown[] = [];
  const toolCalls: ToolCall[] = [];
  for (const event of events) {
    visit(event, (record) => {
      if (typeof record.sessionID === "string") sessionIds.add(record.sessionID);
      if (typeof record.modelID === "string") modelIds.add(record.modelID);
      if (typeof record.model === "string" && record.model.includes("/")) modelIds.add(record.model);
      if (typeof record.cost === "number") costs.push(record.cost);
      if (record.tokens != null && typeof record.tokens === "object") tokens.push(record.tokens);
      if (record.type === "text" && typeof record.text === "string") assistantText.push(record.text);
      if (typeof record.tool === "string") {
        const state = record.state as Record<string, unknown> | undefined;
        toolCalls.push({
          input: state?.input ?? record.input ?? null,
          name: record.tool,
          status: typeof state?.status === "string" ? state.status : null,
        });
      }
    });
  }
  return {
    assistantText: assistantText.join(""),
    costs,
    elapsedMs: 0,
    eventCount: events.length,
    modelIds: [...modelIds].sort(),
    sessionIds: [...sessionIds].sort(),
    tokens,
    toolCalls,
  };
}

function sourceManifest(root: string): FileFact[] {
  const sourceRoot = path.join(root, "src");
  if (!fs.existsSync(sourceRoot)) return [];
  const files: string[] = [];
  const visitDirectory = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) visitDirectory(full);
      else if (entry.isFile()) files.push(full);
    }
  };
  visitDirectory(sourceRoot);
  return files.map((file) => ({
    hash: sha256(fs.readFileSync(file)),
    path: path.relative(root, file).replaceAll("\\", "/"),
  }));
}

function candidateSourceHashes(root: string): Record<string, string | null> {
  return Object.fromEntries([
    "global/agents/code-quality-reviewer.md",
    "global/commands/dedup.md",
    "global/skills/deduplication-audit/SKILL.md",
    "profiles/all.json",
    "README.md",
    "tools/proofs/deduplication-audit.ts",
  ].map((relative) => [relative, hashFile(path.join(root, relative))]));
}

function proofEnvironment(root: string, proofRoot: string, profile: string): NodeJS.ProcessEnv {
  const loaded = loadModelProfile(root, profile);
  return {
    ...process.env,
    OPENCODE_CONFIG_CONTENT: JSON.stringify({
      ...loaded.profile,
      agent: {
        ...loaded.profile.agent,
        build: { ...loaded.profile.agent.build, steps: 24 },
      },
      permission: PROOF_PERMISSION,
    }),
    OPENCODE_CONFIG_DIR: path.join(root, "global"),
    OPENCODE_PURE: "1",
    XDG_CACHE_HOME: path.join(proofRoot, "xdg-cache"),
    XDG_STATE_HOME: path.join(proofRoot, "xdg-state"),
  };
}

function functionFile(exported: string, block: string[] = SHARED_BLOCK): string {
  return [`export function ${exported}(input: string): string {`, ...block, "}", ""].join("\n");
}

function setupScenario(proofRoot: string, scenario: ScenarioId, kind: CaptureKind): string {
  const project = path.join(proofRoot, "project");
  writeJson(path.join(project, "package.json"), {
    name: `dedup-proof-${scenario}`,
    private: true,
    type: "module",
    ...(scenario === "local-owner" ? { exports: { "./route": "./src/canonical-owner.ts" } } : {}),
  });
  writeText(path.join(project, ".gitignore"), ["node_modules/", "dist/", "build/", "coverage/", "vendor/", "generated/", ""].join("\n"));
  writeText(path.join(project, "task.md"), `Synthetic scenario: ${scenario}. Audit scope is src. Source must remain unchanged.\n`);
  if (kind === "baseline" && scenario !== "trivial-fix") {
    writeText(path.join(project, ".opencode", "command", "dedup.md"), BASELINE_COMMAND);
  }

  if (scenario === "local-owner") {
    writeText(path.join(project, "src", "canonical-owner.ts"), functionFile("normalizeRoute"));
    writeText(path.join(project, "src", "duplicate.ts"), functionFile("copyNormalizeRoute"));
    writeText(path.join(project, "src", "consumer.ts"), "import { normalizeRoute } from './canonical-owner.js';\nexport const route = normalizeRoute(' A/B ');\n");
    writeText(path.join(project, "src", "duplicate-consumer.ts"), "import { copyNormalizeRoute } from './duplicate.js';\nexport const copiedRoute = copyNormalizeRoute(' C/D ');\n");
  } else if (scenario === "exact-clone") {
    writeText(path.join(project, "src", "owner.ts"), functionFile("normalizeOwner"));
    writeText(path.join(project, "src", "copy.ts"), functionFile("normalizeCopy"));
    writeText(path.join(project, "src", "owner.test.ts"), "import { normalizeOwner } from './owner.js';\nif (normalizeOwner(' A/B ') !== 'a/b') throw new Error('owner oracle');\n");
  } else if (scenario === "semantic-near-clone") {
    writeText(path.join(project, "src", "request-path.ts"), functionFile("normalizeRequest", [
      "  const normalized = input.trim().toLowerCase();",
      "  if (normalized.length === 0) throw new Error(\"empty input\");",
      "  const parts = normalized.split(\"/\").filter(Boolean);",
      "  const selected = parts.map((part) => part.replace(/[^a-z0-9-]/g, \"\"));",
      "  const joined = selected.join(\"/\");",
      "  const segments = selected.length;",
      "  const key = `${segments}:${joined}`;",
      "  if (selected.some((part) => part.length === 0)) throw new Error(\"invalid segment\");",
      "  return key;",
    ]));
    writeText(path.join(project, "src", "audit-path.ts"), functionFile("normalizeAudit", [
      "  const normalized = input.trim().toLowerCase();",
      "  if (normalized.length === 0) return \"<legacy-invalid>\";",
      "  const parts = normalized.split(\"/\").filter(Boolean);",
      "  const selected = parts.map((part) => part.replace(/[^a-z0-9-]/g, \"\"));",
      "  const joined = selected.join(\"/\");",
      "  const segments = selected.length;",
      "  const key = `${segments}:${joined}`;",
      "  if (selected.some((part) => part.length === 0)) return \"<legacy-invalid>\";",
      "  auditEvents.push({ raw: input, key, at: Date.now() });",
      "  return `audit:${key}`;",
    ]).replace("export function", "const auditEvents: Array<{ raw: string; key: string; at: number }> = [];\nexport function"));
    writeText(path.join(project, "src", "SEMANTICS.md"), "request-path throws invalid input; audit-path records an event, preserves a legacy sentinel, and prefixes successful output. Keep these lifecycle/effect contracts separate unless equivalence is proved.\n");
  } else if (scenario === "unique-compatibility-test") {
    writeText(path.join(project, "src", "modern.ts"), functionFile("normalizeModern"));
    writeText(path.join(project, "src", "legacy.ts"), functionFile("normalizeLegacy"));
    writeText(path.join(project, "src", "legacy-client-compatibility.test.ts"), "import { normalizeLegacy } from './legacy.js';\n// Unique shipped-client oracle: uppercase and repeated separators must retain the v1 result.\nif (normalizeLegacy(' A//B ') !== 'a/b') throw new Error('v1 compatibility regression');\n");
  } else if (scenario === "no-match-helper") {
    writeText(path.join(project, "src", "one-use-helper.ts"), "export function fixtureOnlyGlyph(value: string): string {\n  return value.replaceAll('::glyph::', '#').trim();\n}\n");
  } else {
    writeText(path.join(project, "src", "greeting.ts"), "export function greeting(name: string): string {\n  return `Hello ${name}.`;\n}\n");
    writeText(path.join(project, "task.md"), "The owner-local punctuation defect is the final period in greeting.ts. Planning only; no deduplication audit is requested.\n");
  }

  const ignoredClone = functionFile("ignoredNormalize");
  writeText(path.join(project, "generated", "ignored.ts"), ignoredClone);
  writeText(path.join(project, "vendor", "ignored.ts"), ignoredClone);
  return project;
}

function captureScenario(args: Arguments, scenario: ScenarioId): ScenarioBundle {
  const root = repositoryRoot();
  const proofRoot = fs.mkdtempSync(path.join(os.tmpdir(), `deduplication-audit-${scenario}-`));
  const evidenceFile = path.join(args.evidenceRoot, `${scenario}.bundle.json`);
  let bundle: ScenarioBundle | null = null;
  let cleanupError: string | null = null;
  let cleanupEnvironment: NodeJS.ProcessEnv | null = null;
  let sessionIds: string[] = [];
  const sessionDeleteStatuses: Array<{ sessionID: string; status: number | null }> = [];
  try {
    const project = setupScenario(proofRoot, scenario, args.captureKind);
    const before = sourceManifest(project);
    const loaded = loadModelProfile(root, args.profile);
    const route = loaded.profile.agent.build;
    const argv = [
      "opencode", "run", "--pure", "--agent", "build", "--model", route.model,
      "--variant", route.variant, "--format", "json", "--dir", project,
      "--title", `dedup-${args.captureKind}-${scenario}`,
    ];
    let command: string | null = null;
    let message: string;
    if (scenario === "trivial-fix") {
      message = TRIVIAL_PROMPT;
      argv.push(message);
    } else {
      command = "dedup";
      message = "src";
      argv.push("--command", command, message);
    }
    const environment = proofEnvironment(root, proofRoot, args.profile);
    cleanupEnvironment = environment;
    const started = Date.now();
    const result = runPortableCommand(root, argv, { capture: true, env: environment });
    const stdout = redactEvidenceString(result.stdout, root, proofRoot);
    const stderr = redactEvidenceString(result.stderr, root, proofRoot);
    const facts = parseEventFacts(stdout);
    facts.elapsedMs = Date.now() - started;
    sessionIds = facts.sessionIds;
    bundle = {
      schemaVersion: 1,
      candidate: { id: args.candidateId, kind: args.captureKind, sourceHashes: candidateSourceHashes(root) },
      cleanup: { error: null, removed: false, sessionDeleteStatuses: [] },
      command: { argv: argv.map((value) => redactEvidenceString(value, root, proofRoot)), status: result.status, stderr, stdout },
      environment: {
        agent: "build", model: route.model, profile: args.profile,
        route: `${route.model}/${route.variant}`, toolPolicy: TOOL_POLICY, variant: route.variant,
      },
      facts,
      input: { command, message, scenario },
      sideEffects: { after: sourceManifest(project), before },
    };
    writeJson(evidenceFile, bundle);
    if (result.status !== 0) {
      const error = new Error(`Scenario ${scenario} returned non-zero status ${result.status ?? "unknown"}`) as Error & { cause?: unknown };
      error.cause = result.error ?? result.stderr;
      throw error;
    }
    return bundle;
  } finally {
    if (cleanupEnvironment != null) {
      for (const sessionID of sessionIds) {
        const deletion = runPortableCommand(root, ["opencode", "session", "delete", sessionID, "--pure"], { capture: true, env: cleanupEnvironment });
        sessionDeleteStatuses.push({ sessionID, status: deletion.status });
        if (deletion.status !== 0) cleanupError ??= `session deletion failed for ${sessionID}`;
      }
    }
    try {
      fs.rmSync(proofRoot, { force: true, recursive: true });
    } catch (error) {
      cleanupError = safeError(error);
    }
    if (bundle != null) {
      bundle.cleanup = { error: cleanupError, removed: !fs.existsSync(proofRoot), sessionDeleteStatuses };
      writeJson(evidenceFile, bundle);
    }
    if (cleanupError != null || fs.existsSync(proofRoot)) throw new Error(`Scenario ${scenario} cleanup is unknown: ${cleanupError ?? "proof root still exists"}`);
  }
}

function preflight(args: Arguments): void {
  const root = repositoryRoot();
  const loaded = loadModelProfile(root, args.profile);
  const route = loaded.profile.agent.build;
  if (route.model !== loaded.profile.model) throw new Error("Build route differs from selected profile primary model");
  const proofRoot = fs.mkdtempSync(path.join(os.tmpdir(), "deduplication-audit-preflight-"));
  const evidenceFile = path.join(args.evidenceRoot, "preflight.json");
  const record: Record<string, unknown> = {
    candidateId: args.candidateId,
    captureKind: args.captureKind,
    cleanup: "pending",
    failure: null,
    modelCalls: 0,
    profile: args.profile,
    route: `${route.model}/${route.variant}`,
    scenarios: args.scenarios,
    sourceHashes: candidateSourceHashes(root),
    toolPolicy: TOOL_POLICY,
    version: 1,
  };
  let failure: string | null = null;
  let cleanupError: string | null = null;
  writeJson(evidenceFile, record);
  try {
    const project = setupScenario(proofRoot, "exact-clone", args.captureKind);
    const environment = proofEnvironment(root, proofRoot, args.profile);
    const opencode = runPortableCommand(root, ["opencode", "--version"], { capture: true });
    const credentials = runPortableCommand(project, ["opencode", "auth", "list", "--pure"], { capture: true, env: environment });
    const configDebug = runPortableCommand(project, ["opencode", "debug", "config", "--pure"], { capture: true, env: environment });
    const agentDebug = runPortableCommand(project, ["opencode", "debug", "agent", "build", "--pure"], { capture: true, env: environment });
    const skillDebug = runPortableCommand(project, ["opencode", "debug", "skill", "--pure"], { capture: true, env: environment });
    if (opencode.status !== 0) throw new Error("OpenCode executable preflight failed");
    let resolvedConfig: Record<string, unknown>;
    let resolvedAgent: Record<string, unknown>;
    try {
      resolvedConfig = JSON.parse(configDebug.stdout) as Record<string, unknown>;
      resolvedAgent = JSON.parse(agentDebug.stdout) as Record<string, unknown>;
    } catch {
      throw new Error("OpenCode resolved config or agent output is not JSON");
    }
    const dedupSkillLoaded = skillDebug.stdout.includes("deduplication-audit");
    const expectedSkillLoaded = fs.existsSync(path.join(root, "global", "skills", "deduplication-audit", "SKILL.md"));
    record.credentials = { count: credentialCount(credentials.stdout), status: credentials.status };
    record.loader = { agentStatus: agentDebug.status, configStatus: configDebug.status, dedupSkillLoaded, expectedSkillLoaded, skillStatus: skillDebug.status };
    record.permission = { exactFinalPolicy: JSON.stringify(resolvedConfig.permission) === JSON.stringify(PROOF_PERMISSION) };
    record.agentEnvelope = { steps: resolvedAgent.steps };
    record.opencodeVersion = opencode.stdout.trim();
    if (credentials.status !== 0 || credentialCount(credentials.stdout) == null || credentialCount(credentials.stdout) === 0) throw new Error("Configured credential store is unavailable to capture");
    if (configDebug.status !== 0 || agentDebug.status !== 0 || skillDebug.status !== 0) throw new Error("OpenCode loader preflight failed");
    if (JSON.stringify(resolvedConfig.permission) !== JSON.stringify(PROOF_PERMISSION)) throw new Error("OpenCode resolved permission differs from the bounded proof policy");
    if (resolvedAgent.steps !== 24) throw new Error("OpenCode resolved build agent does not enforce 24 steps");
    if (dedupSkillLoaded !== expectedSkillLoaded) throw new Error(`deduplication-audit loader state mismatch for ${args.captureKind}`);
  } catch (error) {
    failure = safeError(error);
    throw error;
  } finally {
    try {
      fs.rmSync(proofRoot, { force: true, recursive: true });
    } catch (error) {
      cleanupError = safeError(error);
    }
    record.cleanup = cleanupError == null && !fs.existsSync(proofRoot) ? "removed" : `unknown:${cleanupError ?? "root-exists"}`;
    record.failure = failure;
    writeJson(evidenceFile, record);
    if (cleanupError != null || fs.existsSync(proofRoot)) throw new Error(`Preflight cleanup failed: ${cleanupError ?? "root exists"}`);
  }
  console.log(JSON.stringify({ captureKind: args.captureKind, cleanup: "removed", mode: "preflight", modelCalls: 0, scenarios: args.scenarios.length }));
}

function capture(args: Arguments): void {
  fs.mkdirSync(args.evidenceRoot, { recursive: true });
  const completed: ScenarioId[] = [];
  for (const scenario of args.scenarios) {
    captureScenario(args, scenario);
    completed.push(scenario);
  }
  writeJson(path.join(args.evidenceRoot, "manifest.json"), {
    candidateId: args.candidateId, captureKind: args.captureKind, completed, profile: args.profile, schemaVersion: 1,
  });
  console.log(JSON.stringify({ candidateId: args.candidateId, cleanup: "removed", mode: "capture", scenarios: completed.length }));
}

function readBundles(root: string): Map<ScenarioId, ScenarioBundle> {
  const bundles = new Map<ScenarioId, ScenarioBundle>();
  for (const scenario of SCENARIOS) {
    const file = path.join(root, `${scenario}.bundle.json`);
    if (fs.existsSync(file)) bundles.set(scenario, JSON.parse(fs.readFileSync(file, "utf8")) as ScenarioBundle);
  }
  return bundles;
}

function toolFacts(bundle: ScenarioBundle): { auditLoop: boolean; jscpd: boolean; reviewer: boolean; skill: boolean } {
  let auditLoop = false;
  let jscpd = false;
  let reviewer = false;
  let skill = false;
  for (const call of bundle.facts.toolCalls) {
    const input = JSON.stringify(call.input).toLowerCase();
    if (call.name === "bash" && input.includes("jscpd")) jscpd = true;
    if (call.name === "skill" && input.includes("deduplication-audit")) skill = true;
    if (call.name === "skill" && input.includes("codebase-audit-loop")) auditLoop = true;
    if (call.name === "task" && input.includes("code-quality-reviewer")) reviewer = true;
  }
  return { auditLoop, jscpd, reviewer, skill };
}

function candidateOracle(scenario: ScenarioId, bundle: ScenarioBundle): Record<string, boolean> {
  const text = bundle.facts.assistantText.toLowerCase();
  const tools = toolFacts(bundle);
  const sourceUnchanged = JSON.stringify(bundle.sideEffects.before) === JSON.stringify(bundle.sideEffects.after);
  if (scenario === "local-owner") return { sourceUnchanged, usesReuse: text.includes("reuse"), ...tools };
  if (scenario === "exact-clone") return {
    exactClassification: text.includes("exact duplicate"),
    hasCanonicalOwner: text.includes("canonical owner"),
    hasRuntimeProof: text.includes("runtime proof"),
    reviewerUsed: tools.reviewer,
    sourceUnchanged,
    ...tools,
  };
  if (scenario === "semantic-near-clone") return { cautiousClassification: text.includes("keep separate") || text.includes("not proven"), sourceUnchanged, ...tools };
  if (scenario === "unique-compatibility-test") return {
    namesUniqueOracle: text.includes("legacy-client-compatibility.test.ts"),
    retainsOracle: text.includes("retain") || text.includes("keep separate"),
    sourceUnchanged,
    ...tools,
  };
  if (scenario === "no-match-helper") return {
    noReviewerCeremony: !tools.reviewer,
    noSpeculativeExtraction: !text.includes("extract a shared") && !text.includes("create a shared"),
    sourceUnchanged,
    ...tools,
  };
  return { noAuditLoop: !tools.auditLoop, noJscpd: !tools.jscpd, noReviewer: !tools.reviewer, noSkill: !tools.skill, sourceUnchanged };
}

function candidateOraclePass(scenario: ScenarioId, facts: Record<string, boolean>): boolean {
  const required: Record<ScenarioId, string[]> = {
    "local-owner": ["sourceUnchanged", "usesReuse", "jscpd", "reviewer", "skill"],
    "exact-clone": ["exactClassification", "hasCanonicalOwner", "hasRuntimeProof", "reviewerUsed", "sourceUnchanged", "jscpd", "skill"],
    "semantic-near-clone": ["cautiousClassification", "sourceUnchanged", "jscpd", "skill"],
    "unique-compatibility-test": ["namesUniqueOracle", "retainsOracle", "sourceUnchanged", "jscpd", "skill"],
    "no-match-helper": ["noReviewerCeremony", "noSpeculativeExtraction", "sourceUnchanged", "jscpd", "skill"],
    "trivial-fix": ["noAuditLoop", "noJscpd", "noReviewer", "noSkill", "sourceUnchanged"],
  };
  return required[scenario].every((name) => facts[name] === true) && facts.auditLoop !== true;
}

function evaluate(args: Arguments): void {
  if (args.baselineRoot == null) throw new Error("evaluate requires --baseline-root");
  const baseline = readBundles(path.resolve(args.baselineRoot));
  const candidate = args.candidateRoot == null ? null : readBundles(path.resolve(args.candidateRoot));
  if (args.baselineOverrideRoot != null) {
    for (const [scenario, bundle] of readBundles(path.resolve(args.baselineOverrideRoot))) baseline.set(scenario, bundle);
  }
  if (candidate != null && args.candidateOverrideRoot != null) {
    for (const [scenario, bundle] of readBundles(path.resolve(args.candidateOverrideRoot))) candidate.set(scenario, bundle);
  }
  const rows = SCENARIOS.map((scenario) => {
    const before = baseline.get(scenario) ?? null;
    const after = candidate?.get(scenario) ?? null;
    const facts = (bundle: ScenarioBundle | null) => bundle == null ? null : {
      assistantChars: bundle.facts.assistantText.length,
      cleanup: bundle.cleanup.removed,
      elapsedMs: bundle.facts.elapsedMs,
      sourceUnchanged: JSON.stringify(bundle.sideEffects.before) === JSON.stringify(bundle.sideEffects.after),
      status: bundle.command.status,
      toolFacts: toolFacts(bundle),
      tokenFacts: bundle.facts.tokens,
    };
    const candidateOracleFacts = after == null ? null : candidateOracle(scenario, after);
    return {
      baseline: facts(before),
      candidate: facts(after),
      candidateOracleFacts,
      candidateOraclePass: candidateOracleFacts == null ? null : candidateOraclePass(scenario, candidateOracleFacts),
      scenario,
    };
  });
  const candidateComplete = candidate == null ? null : candidate.size === SCENARIOS.length;
  const candidateOraclesPass = candidate == null ? null : rows.every((row) => row.candidateOraclePass === true);
  const result = {
    baselineComplete: baseline.size === SCENARIOS.length,
    candidateComplete,
    candidateOraclesPass,
    note: "Explicit observed facts only. No similarity, semantic-equivalence, confidence, or aggregate quality score is inferred.",
    rows,
    schemaVersion: 1,
  };
  writeJson(path.join(args.evidenceRoot, "evaluation.json"), result);
  console.log(JSON.stringify({ baselineComplete: result.baselineComplete, candidateComplete, candidateOraclesPass, mode: "evaluate", rows: rows.length }));
  if (!result.baselineComplete || candidateComplete === false || candidateOraclesPass === false) process.exitCode = 1;
}

function cliProof(args: Arguments): void {
  const root = repositoryRoot();
  const proofRoot = fs.mkdtempSync(path.join(os.tmpdir(), "deduplication-audit-cli-"));
  const evidenceFile = path.join(args.evidenceRoot, "cli-proof.json");
  let cleanupError: string | null = null;
  const record: Record<string, unknown> = { cleanup: "pending", schemaVersion: 1 };
  writeJson(evidenceFile, record);
  try {
    const fixture = path.join(proofRoot, "fixture");
    writeText(path.join(fixture, ".gitignore"), "generated/\nvendor/\nnode_modules/\ndist/\nbuild/\ncoverage/\n");
    writeText(path.join(fixture, "src", "one.ts"), functionFile("normalizeOne"));
    writeText(path.join(fixture, "src", "two.ts"), functionFile("normalizeTwo"));
    writeText(path.join(fixture, "generated", "ignored.ts"), functionFile("normalizeIgnored"));
    const before = sourceManifest(fixture);
    const version = runPortableCommand(root, ["jscpd", "--version"], { capture: true });
    const help = runPortableCommand(root, ["jscpd", "--help"], { capture: true });
    const ignore = "**/node_modules/**,**/vendor/**,**/generated/**,**/dist/**,**/build/**,**/coverage/**,**/.cache/**,**/out/**,**/target/**";
    const fixtureArgv = [
      "jscpd", "--reporters", "ai", "--no-colors", "--no-tips", "--min-tokens", "20", "--min-lines", "5", "--mode", "mild", "--ignore", ignore, "src",
    ];
    const boundedArgv = [
      "jscpd", "--reporters", "ai", "--no-colors", "--no-tips", "--min-tokens", "50", "--min-lines", "5", "--mode", "mild", "--ignore", ignore, "tools/validators",
    ];
    const fixtureScan = runPortableCommand(fixture, fixtureArgv, { capture: true });
    const boundedScan = runPortableCommand(root, boundedArgv, { capture: true });
    record.environment = {
      command: "jscpd",
      helpHasGitignoreDefault: /gitignore/i.test(help.stdout),
      helpHasIgnore: /--ignore\b/.test(help.stdout),
      version: version.stdout.trim(),
      versionStatus: version.status,
    };
    record.fixture = {
      after: sourceManifest(fixture),
      before,
      cloneLocationsPresent: /(?:^|[\\/\s])one\.ts:/im.test(fixtureScan.stdout) && /(?:^|[\\/\s])two\.ts:/im.test(fixtureScan.stdout),
      ignoredLocationsAbsent: !/generated|vendor|node_modules/i.test(fixtureScan.stdout),
      invocation: fixtureArgv,
      status: fixtureScan.status,
      stderr: redactEvidenceString(fixtureScan.stderr, root, proofRoot),
      stdout: redactEvidenceString(fixtureScan.stdout, root, proofRoot),
    };
    record.repository = {
      invocation: boundedArgv,
      scope: "tools/validators",
      status: boundedScan.status,
      stderr: redactEvidenceString(boundedScan.stderr, root, proofRoot),
      stdout: redactEvidenceString(boundedScan.stdout, root, proofRoot),
    };
    if (version.status !== 0 || !/(?:^|\s)5\.0\.14$/.test(version.stdout.trim())) throw new Error(`Expected jscpd 5.0.14, got ${version.stdout.trim() || "unavailable"}`);
    if (help.status !== 0 || !/--ignore\b/.test(help.stdout)) throw new Error("Installed jscpd does not expose the required --ignore option");
    if (fixtureScan.status !== 0 || !(record.fixture as { cloneLocationsPresent: boolean }).cloneLocationsPresent) throw new Error("Disposable jscpd scan did not report the controlled clone");
    if (JSON.stringify(before) !== JSON.stringify(sourceManifest(fixture))) throw new Error("Disposable jscpd scan changed fixture source");
    if (boundedScan.status !== 0) throw new Error(`Bounded repository scan failed with ${boundedScan.status ?? "unknown"}`);
  } finally {
    try {
      fs.rmSync(proofRoot, { force: true, recursive: true });
    } catch (error) {
      cleanupError = safeError(error);
    }
    record.cleanup = cleanupError == null && !fs.existsSync(proofRoot) ? "removed" : `unknown:${cleanupError ?? "root-exists"}`;
    writeJson(evidenceFile, record);
    if (cleanupError != null || fs.existsSync(proofRoot)) throw new Error(`CLI proof cleanup failed: ${cleanupError ?? "root exists"}`);
  }
  console.log(JSON.stringify({ cleanup: "removed", mode: "cli-proof", version: (record.environment as { version?: string }).version }));
}

function sanitize(args: Arguments): void {
  const root = repositoryRoot();
  let files = 0;
  const visitDirectory = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) visitDirectory(full);
      else if (entry.isFile() && entry.name.endsWith(".json")) {
        const parsed = JSON.parse(fs.readFileSync(full, "utf8")) as unknown;
        writeJson(full, redactEvidenceValue(parsed, root));
        files++;
      }
    }
  };
  visitDirectory(args.evidenceRoot);
  console.log(JSON.stringify({ files, mode: "sanitize", providerCalls: 0 }));
}

function scenarioPreflight(args: Arguments): void {
  const root = repositoryRoot();
  const proofRoot = fs.mkdtempSync(path.join(os.tmpdir(), "deduplication-audit-scenario-preflight-"));
  const record: Record<string, unknown> = { cleanup: "pending", modelCalls: 0, rows: [], schemaVersion: 1 };
  let cleanupError: string | null = null;
  const evidenceFile = path.join(args.evidenceRoot, "scenario-preflight.json");
  try {
    const rows: Array<Record<string, unknown>> = [];
    for (const scenario of args.scenarios.filter((item) => item !== "trivial-fix")) {
      const scenarioRoot = path.join(proofRoot, scenario);
      const project = setupScenario(scenarioRoot, scenario, args.captureKind);
      const before = sourceManifest(project);
      const scan = runPortableCommand(project, [
        "jscpd", "--reporters", "ai", "--no-colors", "--no-tips", "--min-tokens", "20", "--min-lines", "5", "--mode", "mild",
        "--ignore", "**/node_modules/**,**/vendor/**,**/generated/**,**/dist/**,**/build/**,**/coverage/**,**/.cache/**,**/out/**,**/target/**", "src",
      ], { capture: true });
      rows.push({
        cloneCount: Number.parseInt(scan.stdout.match(/---\s*(\d+) clones?/s)?.[1] ?? "0", 10),
        scenario,
        sourceUnchanged: JSON.stringify(before) === JSON.stringify(sourceManifest(project)),
        status: scan.status,
        stderr: redactEvidenceString(scan.stderr, root, proofRoot),
        stdout: redactEvidenceString(scan.stdout, root, proofRoot),
      });
      if (scan.status !== 0) throw new Error(`Scenario preflight failed for ${scenario}`);
    }
    record.rows = rows;
  } finally {
    try {
      fs.rmSync(proofRoot, { force: true, recursive: true });
    } catch (error) {
      cleanupError = safeError(error);
    }
    record.cleanup = cleanupError == null && !fs.existsSync(proofRoot) ? "removed" : `unknown:${cleanupError ?? "root-exists"}`;
    writeJson(evidenceFile, record);
    if (cleanupError != null || fs.existsSync(proofRoot)) throw new Error(`Scenario preflight cleanup failed: ${cleanupError ?? "root exists"}`);
  }
  console.log(JSON.stringify({ cleanup: "removed", mode: "scenario-preflight", rows: (record.rows as unknown[]).length }));
}

function main(): void {
  const args = argumentsFromCli();
  fs.mkdirSync(args.evidenceRoot, { recursive: true });
  if (args.mode === "preflight") preflight(args);
  else if (args.mode === "scenario-preflight") scenarioPreflight(args);
  else if (args.mode === "capture") capture(args);
  else if (args.mode === "evaluate") evaluate(args);
  else if (args.mode === "sanitize") sanitize(args);
  else cliProof(args);
}

main();
