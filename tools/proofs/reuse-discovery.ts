#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runPortableCommand } from "../../global/bin/portable-process.ts";
import { loadModelProfile } from "../model-profile.ts";

type Mode = "capture" | "evaluate" | "preflight";
type Scenario = "local-owner" | "trivial-fix" | "extend-existing-owner";
type CaptureKind = "baseline" | "candidate";

type Arguments = {
  baselineRoot: string | null;
  candidateId: string;
  candidateRoot: string | null;
  captureKind: CaptureKind;
  evidenceRoot: string;
  mode: Mode;
  profile: string;
  scenarios: Scenario[];
};

type ToolCall = {
  input: unknown;
  name: string;
  status: string | null;
};

type Bundle = {
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
    agent: "build";
    model: string;
    profile: string;
    route: string;
    toolPolicy: string[];
    variant: string;
  };
  facts: {
    assistantText: string;
    elapsedMs: number;
    eventCount: number;
    sessionIds: string[];
    tokens: unknown[];
    toolCalls: ToolCall[];
  };
  input: {
    prompt: string;
    scenario: Scenario;
  };
  sideEffects: {
    after: Record<string, string | null>;
    before: Record<string, string | null>;
  };
};

const SCENARIOS: readonly Scenario[] = ["local-owner", "trivial-fix", "extend-existing-owner"];

const PROMPTS: Record<Scenario, string> = {
  "local-owner": "Prepare the implementation decision for adding JSONC parsing to the consumer configuration loader. Do not modify files. Inspect only selected local workspace sources when useful. Return a compact implementation disposition and proof plan. Do not install dependencies, use remote tools, clone, fetch, pull, commit, or push.",
  "trivial-fix": "Fix planning only. The existing greeting function has one owner local punctuation defect described in task.md. Do not modify files. State the smallest correction and nearest proof. Do not perform cross-project discovery, install dependencies, use remote tools, clone, fetch, pull, commit, or push.",
  "extend-existing-owner": "Prepare the implementation decision for adding an error-status case to the existing formatStatus owner in src/status.ts. The accepted feature is a new case of that current same-responsibility owner. Do not modify files. Inspect only selected local workspace sources when useful. Return a compact implementation disposition that names the current owner. Do not add a sibling module or new file. Do not install dependencies, use remote tools, clone, fetch, pull, commit, or push.",
};

const PROOF_PERMISSION = {
  "*": "deny",
  bash: "deny",
  edit: "deny",
  external_directory: "deny",
  glob: "allow",
  grep: "allow",
  question: "deny",
  read: "allow",
  skill: "allow",
  task: "deny",
  webfetch: "deny",
} as const;

const TOOL_POLICY = [
  "bash: deny",
  "edit: deny",
  "external_directory: deny",
  "glob: allow",
  "grep: allow",
  "question: deny",
  "read: allow",
  "skill: allow",
  "task: deny",
  "webfetch: deny",
];

function usage(): string {
  return [
    "Usage:",
    "  node tools/proofs/reuse-discovery.ts --mode preflight|capture --evidence-root <new-path> --capture-kind baseline|candidate --candidate-id <id> [--profile quality-independent] [--scenarios local-owner,trivial-fix,extend-existing-owner]",
    "  node tools/proofs/reuse-discovery.ts --mode evaluate --evidence-root <new-path> --baseline-root <path> --candidate-root <path>",
    "",
    "preflight and evaluate make zero model calls. Each capture scenario makes one configured-provider call in a disposable no-product-mutation workspace.",
  ].join("\n");
}

function repositoryRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
}

function argumentValue(name: string): string | null {
  const index = process.argv.indexOf(name);
  return index < 0 ? null : process.argv[index + 1] ?? null;
}

function parseScenarios(value: string | null): Scenario[] {
  if (value == null || value === "all") return [...SCENARIOS];
  const values = value.split(",");
  const selected = values.filter((item): item is Scenario => SCENARIOS.includes(item as Scenario));
  if (selected.length !== values.length || selected.length === 0) {
    throw new Error(`--scenarios must be all or comma-separated ${SCENARIOS.join(",")}`);
  }
  return [...new Set(selected)];
}

function parseArguments(): Arguments {
  const first = process.argv[2];
  if (first === "--help" || first === "-h") {
    console.log(usage());
    process.exit(0);
  }
  const mode = argumentValue("--mode");
  if (mode !== "preflight" && mode !== "capture" && mode !== "evaluate") throw new Error(usage());
  const evidenceRoot = argumentValue("--evidence-root");
  if (evidenceRoot == null || evidenceRoot.trim() === "") throw new Error("--evidence-root is required");
  const captureKind = argumentValue("--capture-kind") ?? "candidate";
  if (captureKind !== "baseline" && captureKind !== "candidate") throw new Error("--capture-kind must be baseline or candidate");
  return {
    baselineRoot: argumentValue("--baseline-root"),
    candidateId: argumentValue("--candidate-id") ?? `${captureKind}-working-tree`,
    candidateRoot: argumentValue("--candidate-root"),
    captureKind,
    evidenceRoot: path.resolve(evidenceRoot),
    mode,
    profile: argumentValue("--profile") ?? "quality-independent",
    scenarios: parseScenarios(argumentValue("--scenarios")),
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

function stableJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function createEvidenceRoot(root: string): void {
  if (fs.existsSync(root)) throw new Error(`Evidence root already exists: ${root}`);
  const parent = path.dirname(root);
  if (!fs.existsSync(parent) || !fs.statSync(parent).isDirectory()) throw new Error(`Evidence parent is unavailable: ${parent}`);
  fs.mkdirSync(root);
}

function createDisposableRoot(parent: string, prefix: string): string {
  return fs.mkdtempSync(path.join(parent, prefix));
}

function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, stableJson(value), "utf8");
  fs.renameSync(temporary, file);
}

function writeText(file: string, value: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value, "utf8");
}

function runGit(root: string, args: string[], env: NodeJS.ProcessEnv = process.env): string {
  const result = runPortableCommand(root, ["git", ...args], { capture: true, env });
  if (result.status !== 0) {
    const error = new Error(`Disposable Git command failed: git ${args.join(" ")}`) as Error & { cause?: unknown };
    error.cause = result.error ?? result.stderr;
    throw error;
  }
  return result.stdout.trim();
}

function commitFixture(root: string): void {
  runGit(root, ["init", "--quiet"]);
  runGit(root, ["add", "--all"]);
  const tree = runGit(root, ["write-tree"]);
  const commit = runGit(root, ["commit-tree", tree, "-m", "fixture"], {
    ...process.env,
    GIT_AUTHOR_DATE: "2000-01-01T00:00:00Z",
    GIT_AUTHOR_EMAIL: "proof@example.invalid",
    GIT_AUTHOR_NAME: "Proof Fixture",
    GIT_COMMITTER_DATE: "2000-01-01T00:00:00Z",
    GIT_COMMITTER_EMAIL: "proof@example.invalid",
    GIT_COMMITTER_NAME: "Proof Fixture",
  });
  runGit(root, ["update-ref", "refs/heads/main", commit]);
  runGit(root, ["symbolic-ref", "HEAD", "refs/heads/main"]);
}

function createProducer(root: string, id: "alpha" | "beta"): void {
  writeJson(path.join(root, "package.json"), {
    name: `synthetic-${id}`,
    private: true,
    type: "module",
    exports: id === "alpha" ? { ".": "./src/jsonc.ts" } : { ".": "./src/text.ts" },
  });
  if (id === "alpha") {
    writeText(path.join(root, "src", "jsonc.ts"), [
      "export function parseJsonc(value: string): unknown {",
      "  const withoutComments = value.replace(/\\/\\*[\\s\\S]*?\\*\\//g, \"\").replace(/(^|\\s)\\/\\/.*$/gm, \"$1\");",
      "  return JSON.parse(withoutComments.replace(/,(\\s*[}\\]])/g, \"$1\"));",
      "}",
      "",
    ].join("\n"));
    writeText(path.join(root, "proofs", "jsonc.md"), "# JSONC proof\n\nThe exported parser handles line/block comments and trailing commas without I/O.\n");
  } else {
    writeText(path.join(root, "src", "text.ts"), "export function normalizeText(value: string): string {\n  return value.trim();\n}\n");
  }
  commitFixture(root);
}

function setupScenario(root: string, scenario: Scenario): string {
  const workspace = path.join(root, "workspace");
  fs.mkdirSync(workspace, { recursive: true });
  createProducer(path.join(workspace, "projects", "alpha"), "alpha");
  createProducer(path.join(workspace, "projects", "beta"), "beta");
  writeJson(path.join(workspace, "opencode.json"), {
    $schema: "https://opencode.ai/config.json",
    permission: PROOF_PERMISSION,
  });
  writeText(path.join(workspace, "task.md"), `${PROMPTS[scenario]}\n`);
  if (scenario === "local-owner") {
    writeText(path.join(workspace, "src", "loader.ts"), "export function loadConfig(value: string): unknown {\n  return JSON.parse(value);\n}\n");
  } else if (scenario === "extend-existing-owner") {
    writeText(path.join(workspace, "src", "status.ts"), "export function formatStatus(code: \"ok\" | \"warn\"): string {\n  if (code === \"ok\") return \"OK\";\n  return \"WARN\";\n}\n");
  } else {
    writeText(path.join(workspace, "src", "greeting.ts"), "export function greeting(name: string): string {\n  return `Hello, ${name}.`;\n}\n");
  }
  commitFixture(workspace);
  return workspace;
}

function sourceHashes(root: string): Record<string, string | null> {
  return Object.fromEntries([
    "global/AGENTS.md",
    "global/commands/reuse-inventory.md",
    "global/skills/reuse-discovery/SKILL.md",
    "global/bin/reuse-registry.ts",
    "README.md",
    "package.json",
    "tools/proofs/reuse-discovery.ts",
  ].map((relative) => [relative, hashFile(path.join(root, relative))]));
}

function fixtureHashes(workspace: string): Record<string, string | null> {
  return Object.fromEntries([
    "task.md",
    "src/jsonc.ts",
    "src/loader.ts",
    "src/greeting.ts",
    "src/status.ts",
    "projects/alpha/package.json",
    "projects/alpha/src/jsonc.ts",
    "projects/alpha/proofs/jsonc.md",
    "projects/beta/package.json",
    "projects/beta/src/text.ts",
  ].map((relative) => [relative, hashFile(path.join(workspace, relative))]));
}

function proofEnvironment(root: string, proofRoot: string, profile: string): NodeJS.ProcessEnv {
  const loaded = loadModelProfile(root, profile);
  return {
    ...process.env,
    OPENCODE_CONFIG_CONTENT: JSON.stringify({
      ...loaded.profile,
      agent: {
        ...loaded.profile.agent,
        build: { ...loaded.profile.agent.build, steps: 12 },
      },
      permission: PROOF_PERMISSION,
    }),
    OPENCODE_CONFIG_DIR: path.join(root, "global"),
    OPENCODE_PURE: "1",
    XDG_CACHE_HOME: path.join(proofRoot, "xdg-cache"),
    XDG_STATE_HOME: path.join(proofRoot, "xdg-state"),
  };
}

function replaceInsensitive(text: string, value: string, replacement: string): string {
  if (value === "") return text;
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(escaped, process.platform === "win32" ? "gi" : "g"), replacement);
}

function redact(text: string, proofRoot: string, kitRoot: string): string {
  let result = text;
  for (const [value, label] of [[proofRoot, "<proof-root>"], [kitRoot, "<kit-root>"], [os.homedir(), "<home>"]] as const) {
    for (const variant of [value, value.replaceAll("\\", "\\\\"), value.replaceAll("\\", "/")]) {
      result = replaceInsensitive(result, variant, label);
    }
  }
  return replaceInsensitive(result, path.basename(os.homedir()), "<user>");
}

function visit(value: unknown, callback: (record: Record<string, unknown>) => void): void {
  if (Array.isArray(value)) {
    for (const item of value) visit(item, callback);
  } else if (value != null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    callback(record);
    for (const child of Object.values(record)) visit(child, callback);
  }
}

function eventFacts(stdout: string): Bundle["facts"] {
  const events = stdout.split(/\r?\n/).flatMap((line) => {
    if (!line.trim().startsWith("{")) return [];
    try {
      return [JSON.parse(line) as unknown];
    } catch {
      return [];
    }
  });
  const assistantText: string[] = [];
  const sessionIds = new Set<string>();
  const tokens: unknown[] = [];
  const toolCalls: ToolCall[] = [];
  for (const event of events) {
    visit(event, (record) => {
      if (typeof record.sessionID === "string") sessionIds.add(record.sessionID);
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
    elapsedMs: 0,
    eventCount: events.length,
    sessionIds: [...sessionIds].sort(),
    tokens,
    toolCalls,
  };
}

function captureScenario(args: Arguments, scenario: Scenario): Bundle {
  const root = repositoryRoot();
  const proofRoot = createDisposableRoot(args.evidenceRoot, `workspace-${scenario}-`);
  const evidenceFile = path.join(args.evidenceRoot, `${scenario}.bundle.json`);
  const sessionDeleteStatuses: Array<{ sessionID: string; status: number | null }> = [];
  let bundle: Bundle | null = null;
  let cleanupError: string | null = null;
  let environment: NodeJS.ProcessEnv | null = null;
  try {
    const workspace = setupScenario(proofRoot, scenario);
    const before = fixtureHashes(workspace);
    const loaded = loadModelProfile(root, args.profile);
    const route = loaded.profile.agent.build;
    const argv = [
      "opencode", "run", "--pure", "--agent", "build", "--model", route.model,
      "--variant", route.variant, "--format", "json", "--dir", workspace,
      "--title", `reuse-${args.captureKind}-${scenario}`, PROMPTS[scenario],
    ];
    environment = proofEnvironment(root, proofRoot, args.profile);
    const started = Date.now();
    const result = runPortableCommand(root, argv, { capture: true, env: environment });
    const stdout = redact(result.stdout, proofRoot, root);
    const stderr = redact(result.stderr, proofRoot, root);
    const facts = eventFacts(stdout);
    facts.elapsedMs = Date.now() - started;
    bundle = {
      schemaVersion: 1,
      candidate: { id: args.candidateId, kind: args.captureKind, sourceHashes: sourceHashes(root) },
      cleanup: { error: null, removed: false, sessionDeleteStatuses: [] },
      command: { argv: argv.map((item) => redact(item, proofRoot, root)), status: result.status, stderr, stdout },
      environment: {
        agent: "build",
        model: route.model,
        profile: args.profile,
        route: `${route.model}/${route.variant}`,
        toolPolicy: TOOL_POLICY,
        variant: route.variant,
      },
      facts,
      input: { prompt: PROMPTS[scenario], scenario },
      sideEffects: { after: fixtureHashes(workspace), before },
    };
    writeJson(evidenceFile, bundle);
    if (result.status !== 0) throw new Error(`Scenario ${scenario} returned non-zero status ${result.status ?? "unknown"}`);
    return bundle;
  } finally {
    if (bundle != null && environment != null) {
      for (const sessionID of bundle.facts.sessionIds) {
        const deletion = runPortableCommand(root, ["opencode", "session", "delete", sessionID, "--pure"], { capture: true, env: environment });
        sessionDeleteStatuses.push({ sessionID, status: deletion.status });
        if (deletion.status !== 0) cleanupError ??= `session deletion failed for ${sessionID}`;
      }
    }
    try {
      fs.rmSync(proofRoot, { force: true, recursive: true });
    } catch (error) {
      cleanupError = error instanceof Error ? error.message : String(error);
    }
    if (bundle != null) {
      bundle.cleanup = { error: cleanupError, removed: !fs.existsSync(proofRoot), sessionDeleteStatuses };
      writeJson(evidenceFile, bundle);
    }
    if (cleanupError != null || fs.existsSync(proofRoot)) throw new Error(`Scenario cleanup is unknown: ${cleanupError ?? proofRoot}`);
  }
}

function credentialCount(output: string): number | null {
  const match = output.match(/(\d+)\s+credentials?/i);
  return match == null ? null : Number.parseInt(match[1], 10);
}

function collectNames(value: unknown): string[] {
  const names = new Set<string>();
  visit(value, (record) => {
    if (typeof record.name === "string") names.add(record.name);
  });
  return [...names].sort();
}

function preflight(args: Arguments): void {
  createEvidenceRoot(args.evidenceRoot);
  const root = repositoryRoot();
  const proofRoot = createDisposableRoot(args.evidenceRoot, "workspace-preflight-");
  const outputFile = path.join(args.evidenceRoot, "preflight.json");
  const record: Record<string, unknown> = {
    candidateId: args.candidateId,
    cleanup: "pending",
    failure: null,
    modelCalls: 0,
    profile: args.profile,
    scenarios: args.scenarios,
    sourceHashes: sourceHashes(root),
    toolPolicy: TOOL_POLICY,
    version: 2,
  };
  writeJson(outputFile, record);
  let cleanupError: string | null = null;
  try {
    const workspace = setupScenario(proofRoot, "local-owner");
    const loaded = loadModelProfile(root, args.profile);
    const route = loaded.profile.agent.build;
    record.route = `${route.model}/${route.variant}`;
    const environment = proofEnvironment(root, proofRoot, args.profile);
    const version = runPortableCommand(root, ["opencode", "--version"], { capture: true });
    const auth = runPortableCommand(workspace, ["opencode", "auth", "list", "--pure"], { capture: true, env: environment });
    const config = runPortableCommand(workspace, ["opencode", "debug", "config", "--pure"], { capture: true, env: environment });
    const agent = runPortableCommand(workspace, ["opencode", "debug", "agent", "build", "--pure"], { capture: true, env: environment });
    const skills = runPortableCommand(workspace, ["opencode", "debug", "skill", "--pure"], { capture: true, env: environment });
    if (version.status !== 0 || auth.status !== 0 || config.status !== 0 || agent.status !== 0 || skills.status !== 0) {
      throw new Error("OpenCode loader or credential preflight failed");
    }
    const parsedConfig = JSON.parse(config.stdout) as Record<string, unknown>;
    let parsedSkills: unknown = null;
    try {
      parsedSkills = JSON.parse(skills.stdout) as unknown;
    } catch {
      parsedSkills = skills.stdout;
    }
    const commandNames = Object.keys(parsedConfig.command != null && typeof parsedConfig.command === "object" ? parsedConfig.command as Record<string, unknown> : {}).sort();
    const skillNames = typeof parsedSkills === "string" ? [] : collectNames(parsedSkills);
    record.credentials = { count: credentialCount(auth.stdout), valuesCaptured: false };
    record.loader = {
      agentStatus: agent.status,
      commandNames,
      configStatus: config.status,
      hasReuseDiscovery: skillNames.includes("reuse-discovery") || skills.stdout.includes('"name":"reuse-discovery"') || skills.stdout.includes('"name": "reuse-discovery"'),
      hasReuseInventory: commandNames.includes("reuse-inventory"),
      permissionExact: JSON.stringify(parsedConfig.permission) === JSON.stringify(PROOF_PERMISSION),
      skillStatus: skills.status,
    };
    record.opencodeVersion = version.stdout.trim();
    if (credentialCount(auth.stdout) == null || credentialCount(auth.stdout) === 0) throw new Error("Configured credential store is unavailable");
    if (!(record.loader as Record<string, unknown>).hasReuseDiscovery) throw new Error("reuse-discovery is absent from loaded skill inventory");
    if (!(record.loader as Record<string, unknown>).permissionExact) throw new Error("Resolved permission envelope differs from the proof policy");
  } catch (error) {
    record.failure = error instanceof Error ? error.message : String(error);
    throw error;
  } finally {
    try {
      fs.rmSync(proofRoot, { force: true, recursive: true });
    } catch (error) {
      cleanupError = error instanceof Error ? error.message : String(error);
    }
    record.cleanup = cleanupError == null && !fs.existsSync(proofRoot) ? "removed" : "unknown";
    record.cleanupError = cleanupError;
    writeJson(outputFile, record);
    if (cleanupError != null || fs.existsSync(proofRoot)) throw new Error(`Preflight cleanup is unknown: ${cleanupError ?? proofRoot}`);
  }
  console.log(stableJson({ cleanup: record.cleanup, mode: "preflight", modelCalls: 0, route: record.route, scenarios: args.scenarios.length }).trimEnd());
}

function toolCalled(bundle: Bundle, name: string): boolean {
  return bundle.facts.toolCalls.some((call) => call.name === name);
}

function registryCall(bundle: Bundle): boolean {
  return bundle.facts.toolCalls.some((call) => JSON.stringify(call.input).includes("reuse-registry"));
}

function disposition(text: string): boolean {
  return /\b(reuse|extend|build-minimal)\b/i.test(text);
}

function namesCurrentOwner(text: string): boolean {
  return /\bformatStatus\b/.test(text) || /src\/status\.ts/.test(text);
}

function proposesSiblingModule(text: string): boolean {
  return /\b(add|create|new)\s+(a\s+)?(sibling\s+)?(file|module)\b/i.test(text)
    || /\bformatErrorStatus\b/.test(text)
    || /\berror-status\.ts\b/.test(text);
}

function crossProjectState(text: string): boolean {
  return /cross-project[^\n]*(verified|degraded|not-applicable)/i.test(text)
    || /кросс-проект[^\n]*(verified|degraded|not-applicable)/i.test(text)
    || /межпроект[^\n]*(verified|degraded|not-applicable)/i.test(text);
}

function readBundle(root: string, scenario: Scenario): Bundle {
  const file = path.join(root, `${scenario}.bundle.json`);
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as Bundle;
  } catch (error) {
    const wrapped = new Error(`Unable to read ${scenario} bundle: ${file}`) as Error & { cause?: unknown };
    wrapped.cause = error;
    throw wrapped;
  }
}

function evaluate(args: Arguments): void {
  if (args.baselineRoot == null || args.candidateRoot == null) throw new Error("evaluate requires --baseline-root and --candidate-root");
  const baselineRoot = path.resolve(args.baselineRoot);
  const candidateRoot = path.resolve(args.candidateRoot);
  const baselineLocal = readBundle(baselineRoot, "local-owner");
  const baselineTrivial = readBundle(baselineRoot, "trivial-fix");
  const baselineExtend = readBundle(baselineRoot, "extend-existing-owner");
  const candidateLocal = readBundle(candidateRoot, "local-owner");
  const candidateTrivial = readBundle(candidateRoot, "trivial-fix");
  const candidateExtend = readBundle(candidateRoot, "extend-existing-owner");
  if (
    candidateLocal.environment.model !== baselineLocal.environment.model
    || candidateLocal.environment.profile !== baselineLocal.environment.profile
    || candidateLocal.environment.route !== baselineLocal.environment.route
  ) {
    throw new Error(
      `Source/environment mismatch: baseline ${baselineLocal.environment.route} candidate ${candidateLocal.environment.route}`,
    );
  }
  createEvidenceRoot(args.evidenceRoot);
  const facts = {
    baseline: {
      extendElapsedMs: baselineExtend.facts.elapsedMs,
      localElapsedMs: baselineLocal.facts.elapsedMs,
      localLoadedSkill: toolCalled(baselineLocal, "skill"),
      localRegistryCall: registryCall(baselineLocal),
      trivialElapsedMs: baselineTrivial.facts.elapsedMs,
      trivialLoadedSkill: toolCalled(baselineTrivial, "skill"),
      trivialRegistryCall: registryCall(baselineTrivial),
    },
    candidate: {
      extendCleanup: candidateExtend.cleanup.removed && candidateExtend.cleanup.error == null,
      extendDisposition: /\bextend\b/i.test(candidateExtend.facts.assistantText),
      extendNamesOwner: namesCurrentOwner(candidateExtend.facts.assistantText),
      extendNoBashCall: !toolCalled(candidateExtend, "bash"),
      extendNoSibling: !proposesSiblingModule(candidateExtend.facts.assistantText),
      extendSourceStable: JSON.stringify(candidateExtend.sideEffects.before) === JSON.stringify(candidateExtend.sideEffects.after),
      extendStatus: candidateExtend.command.status,
      localCleanup: candidateLocal.cleanup.removed && candidateLocal.cleanup.error == null,
      localDisposition: disposition(candidateLocal.facts.assistantText),
      localLoadedReuseSkill: candidateLocal.facts.toolCalls.some((call) => call.name === "skill" && JSON.stringify(call.input).includes("reuse-discovery")),
      localNoBashCall: !toolCalled(candidateLocal, "bash"),
      localNoRegistryCall: !registryCall(candidateLocal),
      localSourceStable: JSON.stringify(candidateLocal.sideEffects.before) === JSON.stringify(candidateLocal.sideEffects.after),
      localStatus: candidateLocal.command.status,
      localCrossProjectState: crossProjectState(candidateLocal.facts.assistantText),
      trivialCleanup: candidateTrivial.cleanup.removed && candidateTrivial.cleanup.error == null,
      trivialNoBashCall: !toolCalled(candidateTrivial, "bash"),
      trivialNoCrossProjectTool: !candidateTrivial.facts.toolCalls.some((call) => call.name.startsWith("graphify-global")),
      trivialNoReuseSkill: !candidateTrivial.facts.toolCalls.some((call) => call.name === "skill" && JSON.stringify(call.input).includes("reuse-discovery")),
      trivialNoRegistryCall: !registryCall(candidateTrivial),
      trivialSourceStable: JSON.stringify(candidateTrivial.sideEffects.before) === JSON.stringify(candidateTrivial.sideEffects.after),
      trivialStatus: candidateTrivial.command.status,
    },
  };
  const candidateComplete = Object.entries(facts.candidate).every(([key, value]) => key.endsWith("Status") ? value === 0 : value === true);
  const result = {
    baselineRoot: "<baseline-root>",
    candidateComplete,
    candidateRoot: "<candidate-root>",
    facts,
    modelCalls: 0,
    schemaVersion: 1,
  };
  writeJson(path.join(args.evidenceRoot, "evaluation.json"), result);
  if (!candidateComplete) throw new Error("Candidate reuse behavior evaluation is incomplete");
  console.log(stableJson({ candidateComplete, mode: "evaluate", modelCalls: 0 }).trimEnd());
}

function main(): void {
  const args = parseArguments();
  if (args.mode === "preflight") {
    preflight(args);
    return;
  }
  if (args.mode === "evaluate") {
    evaluate(args);
    return;
  }
  createEvidenceRoot(args.evidenceRoot);
  for (const scenario of args.scenarios) captureScenario(args, scenario);
  console.log(stableJson({ candidateId: args.candidateId, cleanup: "removed", mode: "capture", profile: args.profile, scenarios: args.scenarios.length }).trimEnd());
}

main();
