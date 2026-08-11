#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runPortableCommand } from "../../global/bin/portable-process.ts";
import { loadModelProfile } from "../model-profile.ts";

type ScenarioId =
  | "inventory-refresh"
  | "local-owner"
  | "registered-peer"
  | "stale-record"
  | "typical-external"
  | "no-match"
  | "trivial-fix"
  | "registry-unavailable";

type CaptureKind = "baseline" | "candidate";
type RunnerMode = "capture" | "client-preflight" | "client-proof" | "evaluate" | "preflight" | "recover" | "sanitize";

type Arguments = {
  abandonedRoot: string | null;
  baselineRoot: string | null;
  candidateId: string;
  candidateRoot: string | null;
  captureKind: CaptureKind;
  evidenceRoot: string;
  mode: RunnerMode;
  profile: string;
  scenarios: ScenarioId[];
  sessionId: string | null;
};

type FileFact = {
  bytes: number;
  hash: string;
  path: string;
};

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
    toolCalls: Array<{ input: unknown; name: string; status: string | null }>;
  };
  input: {
    prompt: string;
    scenario: ScenarioId;
  };
  sideEffects: {
    after: FileFact[];
    before: FileFact[];
    producerProof?: { status: number | null; stderr: string; stdout: string };
  };
};

const SCENARIOS: readonly ScenarioId[] = [
  "inventory-refresh",
  "local-owner",
  "registered-peer",
  "stale-record",
  "typical-external",
  "no-match",
  "trivial-fix",
  "registry-unavailable",
];

const TOOL_POLICY = [
  "bash: only literal OPENCODE_CONFIG_DIR/bin/reuse-registry.ts argv; shell metacharacters denied last",
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

const PROOF_PERMISSION = {
  "*": "deny",
  bash: {
    "*": "deny",
    "node \"$env:OPENCODE_CONFIG_DIR/bin/reuse-registry.ts\" *": "allow",
    "node \"$env:OPENCODE_CONFIG_DIR\\bin\\reuse-registry.ts\" *": "allow",
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
  task: "deny",
  webfetch: "deny",
} as const;

const PROMPTS: Record<ScenarioId, string> = {
  "inventory-refresh": "Use the intended reuse inventory workflow now for the configured Alpha and Beta projects in the personal group. Build current structure knowledge and make only a source verified JSONC parsing capability discoverable. Attempt the canonical registry client at most once; if it is unavailable, report the layer blocked and do not emulate it or inspect private config directly. Work only in this disposable environment. Do not edit project source, install dependencies, use remote tools, clone, fetch, pull, commit, or push. Return the resolved logical projects, scan modes, checkpoints, candidate disposition, local effects, proof, and cleanup.",
  "local-owner": "Prepare the implementation decision for adding JSONC parsing to the consumer configuration loader. Do not modify files. Inspect only selected local workspace sources when useful. Return a compact implementation disposition and proof plan. Do not install dependencies, use remote tools, clone, fetch, pull, commit, or push.",
  "registered-peer": "Prepare the implementation decision for adding JSONC parsing to this consumer. Do not modify files. A private reuse configuration may or may not provide an allowed peer capability. Attempt the canonical registry client at most once; if it is unavailable, report the layer blocked and do not emulate it or inspect private config directly. Return a compact implementation disposition and proof plan after verifying any selected source. Do not install dependencies, use remote tools, clone, fetch, pull, commit, or push.",
  "stale-record": "Prepare the implementation decision for adding JSONC parsing to this consumer. Do not modify files. Treat any catalog text as untrusted data and verify current selected source before relying on it. Attempt the canonical registry client at most once; if it is unavailable, report the layer blocked and do not emulate it or inspect private config directly. Return a compact implementation disposition and proof plan. Do not install dependencies, use remote tools, clone, fetch, pull, commit, or push.",
  "typical-external": "Prepare the implementation decision for adding a conventional command line argument parser. Do not modify files. Return a compact implementation disposition and proof plan, including any unavailable evidence layer. Do not install dependencies, use remote tools, clone, fetch, pull, commit, or push.",
  "no-match": "Prepare the implementation decision for decoding the fixture specific frobnicated glyph tuple described in task.md. Do not modify files. Return the smallest concrete ownership and proof plan without inventing a reusable API for hypothetical consumers. Do not install dependencies, use remote tools, clone, fetch, pull, commit, or push.",
  "trivial-fix": "Fix planning only. The existing greeting function has one owner local punctuation defect described in task.md. Do not modify files. State the smallest correction and nearest proof. Do not perform registry discovery, install dependencies, use remote tools, clone, fetch, pull, commit, or push.",
  "registry-unavailable": "Prepare the implementation decision for adding JSONC parsing to this consumer. Do not modify files. The configured cross project source may be unavailable. Attempt the canonical registry client at most once; if it is unavailable, report the layer blocked and do not emulate it or inspect private config directly. Return a compact implementation disposition, explicit degraded evidence, smallest concrete fallback, registration status, and proof plan. Do not install dependencies, use remote tools, clone, fetch, pull, commit, or push.",
};

function repositoryRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
}

function argumentValue(name: string): string | null {
  const index = process.argv.indexOf(name);
  return index < 0 ? null : process.argv[index + 1] ?? null;
}

function parseScenarioList(value: string | null): ScenarioId[] {
  if (value == null || value === "all") return [...SCENARIOS];
  const selected = value.split(",").filter((item): item is ScenarioId => SCENARIOS.includes(item as ScenarioId));
  if (selected.length === 0 || selected.length !== value.split(",").length) {
    throw new Error(`Invalid --scenarios value; expected all or comma-separated ${SCENARIOS.join(",")}`);
  }
  return [...new Set(selected)];
}

function argumentsFromCli(): Arguments {
  const mode = argumentValue("--mode");
  if (mode !== "preflight" && mode !== "capture" && mode !== "client-preflight" && mode !== "client-proof" && mode !== "evaluate" && mode !== "recover" && mode !== "sanitize") {
    throw new Error("Usage: node tools/proofs/reuse-discovery.ts --mode preflight|capture|client-preflight|client-proof|evaluate|recover|sanitize --evidence-root <path> [--capture-kind baseline|candidate] [--candidate-id <id>] [--profile quality-independent] [--scenarios all|id,...] [--baseline-root <path> --candidate-root <path>] [--abandoned-root <path> --session-id <id>]");
  }
  const captureKind = argumentValue("--capture-kind") ?? "baseline";
  if (captureKind !== "baseline" && captureKind !== "candidate") {
    throw new Error("--capture-kind must be baseline or candidate");
  }
  const evidenceRoot = argumentValue("--evidence-root");
  if (evidenceRoot == null || evidenceRoot.trim() === "") throw new Error("--evidence-root is required");
  return {
    abandonedRoot: argumentValue("--abandoned-root"),
    baselineRoot: argumentValue("--baseline-root"),
    candidateId: argumentValue("--candidate-id") ?? `${captureKind}-working-tree`,
    candidateRoot: argumentValue("--candidate-root"),
    captureKind,
    evidenceRoot: path.resolve(evidenceRoot),
    mode,
    profile: argumentValue("--profile") ?? "quality-independent",
    scenarios: parseScenarioList(argumentValue("--scenarios")),
    sessionId: argumentValue("--session-id"),
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

function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(temporary, file);
}

function writeText(file: string, value: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value, "utf8");
}

function safeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function runGitCapture(root: string, args: string[], env: NodeJS.ProcessEnv = process.env): string {
  const result = runPortableCommand(root, ["git", ...args], { capture: true, env });
  if (result.status !== 0) {
    const error = new Error(`Disposable Git command failed: git ${args.join(" ")}`) as Error & { cause?: unknown };
    error.cause = result.error ?? result.stderr;
    throw error;
  }
  return result.stdout.trim();
}

function runGit(root: string, args: string[]): void {
  runGitCapture(root, args);
}

function commitFixture(root: string): void {
  runGit(root, ["init", "--quiet"]);
  runGit(root, ["add", "--all"]);
  const tree = runGitCapture(root, ["write-tree"]);
  const commit = runGitCapture(root, ["commit-tree", tree, "-m", "fixture"], {
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

function createProducer(root: string, id: "alpha" | "beta"): { status: number | null; stderr: string; stdout: string } | null {
  writeJson(path.join(root, "package.json"), {
    name: `synthetic-${id}`,
    private: true,
    type: "module",
    exports: id === "alpha" ? { ".": "./src/jsonc.ts" } : { ".": "./src/text.ts" },
    scripts: id === "alpha" ? { "proof:jsonc": "node proof-jsonc.ts" } : {},
  });
  if (id === "alpha") {
    writeText(path.join(root, "src", "jsonc.ts"), [
      "export function parseJsonc(value: string): unknown {",
      "  const output = value.split(\"\");",
      "  let blockComment = false;",
      "  let lineComment = false;",
      "  let quoted = false;",
      "  let escaped = false;",
      "  if (output[0] === \"\\uFEFF\") output[0] = \" \";",
      "  for (let index = 0; index < output.length; index++) {",
      "    const current = output[index];",
      "    const next = output[index + 1];",
      "    if (lineComment) {",
      "      if (current === \"\\n\" || current === \"\\r\") lineComment = false;",
      "      else output[index] = \" \";",
      "      continue;",
      "    }",
      "    if (blockComment) {",
      "      if (current === \"*\" && next === \"/\") { output[index] = output[index + 1] = \" \"; index++; blockComment = false; }",
      "      else if (current !== \"\\n\" && current !== \"\\r\") output[index] = \" \";",
      "      continue;",
      "    }",
      "    if (quoted) {",
      "      if (escaped) escaped = false;",
      "      else if (current === \"\\\\\") escaped = true;",
      "      else if (current === '\"') quoted = false;",
      "      continue;",
      "    }",
      "    if (current === '\"') { quoted = true; continue; }",
      "    if (current === \"/\" && next === \"/\") { output[index] = output[index + 1] = \" \"; index++; lineComment = true; continue; }",
      "    if (current === \"/\" && next === \"*\") { output[index] = output[index + 1] = \" \"; index++; blockComment = true; }",
      "  }",
      "  if (blockComment) throw new SyntaxError(\"Unterminated JSONC block comment\");",
      "  quoted = false; escaped = false;",
      "  for (let index = 0; index < output.length; index++) {",
      "    const current = output[index];",
      "    if (quoted) {",
      "      if (escaped) escaped = false;",
      "      else if (current === \"\\\\\") escaped = true;",
      "      else if (current === '\"') quoted = false;",
      "      continue;",
      "    }",
      "    if (current === '\"') { quoted = true; continue; }",
      "    if (current !== \",\") continue;",
      "    let next = index + 1;",
      "    while (/\\s/.test(output[next] ?? \"\")) next++;",
      "    if (output[next] === \"}\" || output[next] === \"]\") output[index] = \" \";",
      "  }",
      "  return JSON.parse(output.join(\"\"));",
      "}",
      "",
    ].join("\n"));
    writeText(path.join(root, "proof-jsonc.ts"), [
      "import { parseJsonc } from \"./src/jsonc.ts\";",
      "const parsed = parseJsonc('{ // line\\n \"value\": 1, /* block */ }') as { value: number };",
      "if (parsed.value !== 1) throw new Error(\"JSONC value mismatch\");",
      "const literal = parseJsonc('{\"text\":\"// not a comment\",}') as { text: string };",
      "if (literal.text !== \"// not a comment\") throw new Error(\"JSONC string mismatch\");",
      "let rejected = false;",
      "try { parseJsonc('{ /* unterminated'); } catch (error) { rejected = error instanceof SyntaxError; }",
      "if (!rejected) throw new Error(\"Malformed JSONC was not rejected\");",
      "console.log(JSON.stringify({ status: \"ok\", cases: 3 }));",
      "",
    ].join("\n"));
    writeText(path.join(root, "proofs", "jsonc.md"), "# JSONC proof\n\n`node proof-jsonc.ts` invokes the exported parser with line/block comments, trailing commas, comment markers inside strings, and an unterminated block comment. The parser performs no I/O and preserves character positions before delegating decoding to `JSON.parse`.\n");
  } else {
    writeText(path.join(root, "src", "text.ts"), "export function normalizeText(value: string): string {\n  return value.trim();\n}\n");
  }
  writeText(path.join(root, "README.md"), `# Synthetic ${id}\n`);
  commitFixture(root);
  if (id === "alpha") {
    const proof = runPortableCommand(root, [process.execPath, "proof-jsonc.ts"], { capture: true });
    if (proof.status !== 0 || !proof.stdout.includes('"status":"ok"')) throw new Error(`Disposable JSONC producer proof failed: ${proof.stderr}`);
    return { status: proof.status, stderr: proof.stderr, stdout: proof.stdout };
  }
  return null;
}

function capability(pathValue = "src/jsonc.ts"): Record<string, unknown> {
  return {
    constraints: ["node>=24"],
    effects: ["none"],
    entrypoints: [{ path: pathValue, symbol: "parseJsonc" }],
    evidence: [{ path: "proofs/jsonc.md" }],
    id: "text/jsonc-parse",
    keywords: ["comments", "jsonc", "parser", "parsing", "trailing-comma"],
    kind: "library",
    maturity: "portable-proven",
    project: "shared/alpha",
    status: "active",
    summary: "Parse JSONC with source diagnostics",
  };
}

function setupRegistry(root: string, scenario: ScenarioId, alphaRoot: string, betaRoot: string): string {
  const registryRoot = path.join(root, "registry");
  const outboxRoot = path.join(root, "outbox");
  const cacheRoot = path.join(root, "cache");
  const stateRoot = path.join(root, "state");
  const sentinelRoot = path.join(root, "SENTINEL_UNALLOWLISTED_ROOT");
  for (const directory of [registryRoot, outboxRoot, cacheRoot, stateRoot, sentinelRoot]) {
    fs.mkdirSync(directory, { recursive: true });
  }
  writeJson(path.join(registryRoot, "registry.json"), { id: "synthetic/reuse-registry", version: 1 });
  writeJson(path.join(registryRoot, "projects.json"), {
    projects: [
      { id: "private/sentinel", repository: "synthetic://sentinel" },
      { id: "shared/alpha", repository: "synthetic://alpha" },
      { id: "shared/beta", repository: "synthetic://beta" },
    ],
    version: 1,
  });
  writeJson(path.join(registryRoot, "groups.json"), {
    groups: [
      { id: "personal", projects: ["shared/alpha", "shared/beta"] },
      { id: "unselected", projects: ["private/sentinel"] },
    ],
    version: 1,
  });
  const alphaCapabilities = scenario === "registered-peer"
    ? [capability()]
    : scenario === "stale-record"
      ? [capability("src/missing-jsonc.ts")]
      : [];
  writeJson(path.join(registryRoot, "capabilities", "shared-alpha.json"), { capabilities: alphaCapabilities, project: "shared/alpha", version: 1 });
  writeJson(path.join(registryRoot, "capabilities", "shared-beta.json"), { capabilities: [], project: "shared/beta", version: 1 });
  const sentinelCapability = { ...capability("src/sentinel.ts"), id: "private/sentinel-capability", project: "private/sentinel", summary: "SENTINEL_UNALLOWLISTED_CAPABILITY" };
  const sentinelCapabilities = scenario === "inventory-refresh" ? [] : [sentinelCapability];
  writeJson(path.join(registryRoot, "capabilities", "private-sentinel.json"), {
    capabilities: sentinelCapabilities,
    project: "private/sentinel",
    version: 1,
  });
  writeJson(path.join(registryRoot, "capabilities", "external.json"), { capabilities: [], project: "external", version: 1 });
  writeJson(path.join(registryRoot, "generated", "capability-index.json"), {
    capabilities: [...alphaCapabilities, ...sentinelCapabilities].sort((left, right) => String(left.id).localeCompare(String(right.id))),
    registry: "synthetic/reuse-registry",
    version: 1,
  });
  const configPath = path.join(stateRoot, "reuse-config.json");
  writeJson(configPath, {
    cacheRoot,
    enabledGroups: ["personal"],
    outboxRoot,
    projects: {
      "private/sentinel": { codebaseMemoryProject: "SENTINEL_UNALLOWLISTED_INDEX", root: sentinelRoot, scanRef: "refs/heads/main" },
      "shared/alpha": { root: alphaRoot, scanRef: "refs/heads/main" },
      "shared/beta": { root: betaRoot, scanRef: "refs/heads/main" },
    },
    registryRoot: scenario === "registry-unavailable" ? path.join(root, "missing-registry") : registryRoot,
    version: 1,
  });
  return configPath;
}

function setupScenario(root: string, scenario: ScenarioId): { configPath: string; directory: string; producerProof: { status: number | null; stderr: string; stdout: string } } {
  const workspace = path.join(root, "workspace");
  const alphaRoot = path.join(workspace, "projects", "alpha");
  const betaRoot = path.join(workspace, "projects", "beta");
  fs.mkdirSync(workspace, { recursive: true });
  const producerProof = createProducer(alphaRoot, "alpha");
  if (producerProof == null) throw new Error("Disposable alpha producer proof was not captured");
  createProducer(betaRoot, "beta");
  writeJson(path.join(workspace, "opencode.json"), {
    $schema: "https://opencode.ai/config.json",
    permission: PROOF_PERMISSION,
  });
  writeText(path.join(workspace, "task.md"), `${PROMPTS[scenario]}\n`);
  if (scenario === "local-owner") {
    writeText(path.join(workspace, "src", "jsonc.ts"), "export function parseJsonc(value: string): unknown {\n  return JSON.parse(value);\n}\n");
    writeText(path.join(workspace, "src", "loader.ts"), "import { parseJsonc } from \"./jsonc.ts\";\nexport const loadConfig = parseJsonc;\n");
  } else if (scenario === "trivial-fix") {
    writeText(path.join(workspace, "src", "greeting.ts"), "export function greeting(name: string): string {\n  return `Hello, ${name}.`;\n}\n");
  } else if (scenario === "no-match") {
    writeText(path.join(workspace, "fixture-format.md"), "A frobnicated glyph tuple is exactly three ASCII letters separated by colon. Decode by reversing the letters.\n");
  } else {
    writeText(path.join(workspace, "src", "loader.ts"), "export function loadConfig(value: string): unknown {\n  return JSON.parse(value);\n}\n");
  }
  commitFixture(workspace);
  return { configPath: setupRegistry(root, scenario, alphaRoot, betaRoot), directory: workspace, producerProof };
}

function shouldSkipManifestDirectory(name: string): boolean {
  return name === ".git" || name === "xdg-cache" || name === "xdg-data" || name === "xdg-state";
}

function fileManifest(root: string): FileFact[] {
  const facts: FileFact[] = [];
  const walk = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      if (entry.isDirectory() && shouldSkipManifestDirectory(entry.name)) continue;
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(absolute);
      } else if (entry.isFile()) {
        const bytes = fs.readFileSync(absolute);
        facts.push({ bytes: bytes.length, hash: sha256(bytes), path: path.relative(root, absolute).replaceAll("\\", "/") });
      }
    }
  };
  walk(root);
  return facts;
}

function redact(text: string, roots: Array<[string, string]>): string {
  let redacted = text;
  for (const [root, label] of roots) {
    for (const value of [root, root.replaceAll("\\", "/")]) {
      const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      redacted = redacted.replace(new RegExp(escaped, process.platform === "win32" ? "gi" : "g"), label);
    }
  }
  return redacted;
}

function credentialCount(output: string): number | null {
  const match = output.match(/(\d+)\s+credentials?/i);
  return match == null ? null : Number.parseInt(match[1], 10);
}

function replaceLiteralInsensitive(text: string, value: string, replacement: string): string {
  if (value === "") return text;
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(escaped, process.platform === "win32" ? "gi" : "g"), replacement);
}

function redactEvidenceString(text: string, root: string): string {
  let redacted = text;
  for (const temp of [os.tmpdir(), os.tmpdir().replaceAll("\\", "\\\\"), os.tmpdir().replaceAll("\\", "/")]) {
    for (const separator of ["\\", "\\\\", "/"]) {
      const prefix = `${temp}${separator}reuse-discovery-`;
      let index = redacted.toLowerCase().indexOf(prefix.toLowerCase());
      while (index >= 0) {
        let end = index + prefix.length;
        while (end < redacted.length && !/[\\/"\s]/.test(redacted[end])) end++;
        redacted = `${redacted.slice(0, index)}<proof-root>${redacted.slice(end)}`;
        index = redacted.toLowerCase().indexOf(prefix.toLowerCase());
      }
    }
  }
  for (const [value, label] of [[root, "<kit-root>"], [os.homedir(), "<home>"]] as const) {
    for (const variant of [value, value.replaceAll("\\", "\\\\"), value.replaceAll("\\", "/")]) {
      redacted = replaceLiteralInsensitive(redacted, variant, label);
    }
  }
  redacted = replaceLiteralInsensitive(redacted, path.basename(os.homedir()), "<user>");
  return redacted;
}

function redactEvidenceValue(value: unknown, root: string): unknown {
  if (typeof value === "string") return redactEvidenceString(value, root);
  if (Array.isArray(value)) return value.map((item) => redactEvidenceValue(item, root));
  if (value != null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, redactEvidenceValue(item, root)]));
  }
  return value;
}

function proofEnvironment(root: string, proofRoot: string, configPath: string, profile: string): NodeJS.ProcessEnv {
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
    OPENCODE_REUSE_CONFIG: configPath,
    XDG_CACHE_HOME: path.join(proofRoot, "xdg-cache"),
    XDG_STATE_HOME: path.join(proofRoot, "xdg-state"),
  };
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
  const toolCalls: Array<{ input: unknown; name: string; status: string | null }> = [];
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

function sourceHashes(root: string): Record<string, string | null> {
  return Object.fromEntries([
    "global/AGENTS.md",
    "global/commands/reuse-inventory.md",
    "global/skills/change-ready-sdlc/SKILL.md",
    "global/skills/reuse-discovery/SKILL.md",
    "global/bin/reuse-registry.ts",
    "tools/proofs/reuse-discovery.ts",
  ].map((relative) => [relative, hashFile(path.join(root, relative))]));
}

function captureScenario(args: Arguments, scenario: ScenarioId): ScenarioBundle {
  const root = repositoryRoot();
  const proofRoot = fs.mkdtempSync(path.join(os.tmpdir(), `reuse-discovery-${scenario}-`));
  const evidenceFile = path.join(args.evidenceRoot, `${scenario}.bundle.json`);
  let bundle: ScenarioBundle | null = null;
  let cleanupError: string | null = null;
  let cleanupEnvironment: NodeJS.ProcessEnv | null = null;
  let sessionIds: string[] = [];
  const sessionDeleteStatuses: Array<{ sessionID: string; status: number | null }> = [];
  try {
    const fixture = setupScenario(proofRoot, scenario);
    const before = fileManifest(proofRoot);
    const loaded = loadModelProfile(root, args.profile);
    const route = loaded.profile.agent.build;
    const [providerID, ...modelParts] = route.model.split("/");
    const modelID = modelParts.join("/");
    if (providerID === "" || modelID === "") throw new Error("Selected build route is invalid");
    const argv = [
      "opencode",
      "run",
      "--pure",
      "--agent",
      "build",
      "--model",
      route.model,
      "--variant",
      route.variant,
      "--format",
      "json",
      "--dir",
      fixture.directory,
      "--title",
      `reuse-${args.captureKind}-${scenario}`,
      PROMPTS[scenario],
    ];
    const environment = proofEnvironment(root, proofRoot, fixture.configPath, args.profile);
    cleanupEnvironment = environment;
    const started = Date.now();
    const result = runPortableCommand(root, argv, { capture: true, env: environment });
    const elapsedMs = Date.now() - started;
    const roots: Array<[string, string]> = [[proofRoot, "<proof-root>"], [root, "<kit-root>"]];
    const stdout = redactEvidenceString(redact(result.stdout, roots), root);
    const stderr = redactEvidenceString(redact(result.stderr, roots), root);
    const facts = parseEventFacts(stdout);
    facts.elapsedMs = elapsedMs;
    sessionIds = facts.sessionIds;
    bundle = {
      schemaVersion: 1,
      candidate: { id: args.candidateId, kind: args.captureKind, sourceHashes: sourceHashes(root) },
      cleanup: { error: null, removed: false, sessionDeleteStatuses: [] },
      command: {
        argv: argv.map((value) => redact(value, roots)),
        status: result.status,
        stderr,
        stdout,
      },
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
      sideEffects: { after: fileManifest(proofRoot), before, producerProof: fixture.producerProof },
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
    if (cleanupError != null || fs.existsSync(proofRoot)) {
      throw new Error(`Scenario ${scenario} cleanup is unknown: ${cleanupError ?? "proof root still exists"}`);
    }
  }
}

function preflight(args: Arguments): void {
  const root = repositoryRoot();
  const loaded = loadModelProfile(root, args.profile);
  const route = loaded.profile.agent.build;
  if (route.model !== loaded.profile.model) throw new Error("Build route differs from selected profile primary model");
  const proofRoot = fs.mkdtempSync(path.join(os.tmpdir(), "reuse-discovery-preflight-"));
  const preflightFile = path.join(args.evidenceRoot, "preflight.json");
  let cleanupError: string | null = null;
  let failure: string | null = null;
  const record: Record<string, unknown> = {
    candidateId: args.candidateId,
    cleanup: "pending",
    failure: null,
    modelCalls: 0,
    profile: args.profile,
    route: `${route.model}/${route.variant}`,
    scenarios: args.scenarios,
    sourceHashes: sourceHashes(root),
    toolPolicy: TOOL_POLICY,
    version: 1,
  };
  writeJson(preflightFile, record);
  try {
    const fixture = setupScenario(proofRoot, "registered-peer");
    const opencode = runPortableCommand(root, ["opencode", "--version"], { capture: true });
    if (opencode.status !== 0) throw new Error("OpenCode executable preflight failed");
    const environment = proofEnvironment(root, proofRoot, fixture.configPath, args.profile);
    const hostCredentials = runPortableCommand(fixture.directory, ["opencode", "auth", "list", "--pure"], { capture: true, env: environment });
    const isolatedCredentials = runPortableCommand(fixture.directory, ["opencode", "auth", "list", "--pure"], {
      capture: true,
      env: { ...environment, XDG_DATA_HOME: path.join(proofRoot, "isolated-data") },
    });
    record.credentials = {
      captureUsesExistingStore: true,
      existingCount: credentialCount(hostCredentials.stdout),
      existingStatus: hostCredentials.status,
      isolatedCount: credentialCount(isolatedCredentials.stdout),
      isolatedStatus: isolatedCredentials.status,
    };
    if (hostCredentials.status !== 0 || credentialCount(hostCredentials.stdout) == null || credentialCount(hostCredentials.stdout) === 0) {
      throw new Error("Configured credential store is unavailable to capture");
    }
    const debug = (tail: string[]) => runPortableCommand(fixture.directory, [
      "opencode",
      ...tail,
      "--pure",
      "--print-logs",
      "--log-level",
      "DEBUG",
    ], { capture: true, env: environment });
    const configDebug = debug(["debug", "config"]);
    const agentDebug = debug(["debug", "agent", "build"]);
    let resolvedPermission: unknown = null;
    try {
      resolvedPermission = (JSON.parse(configDebug.stdout) as Record<string, unknown>).permission;
    } catch {
      throw new Error("OpenCode resolved config output is not JSON");
    }
    record.permission = {
      exactFinalPolicy: JSON.stringify(resolvedPermission) === JSON.stringify(PROOF_PERMISSION),
    };
    if (JSON.stringify(resolvedPermission) !== JSON.stringify(PROOF_PERMISSION)) {
      throw new Error("OpenCode resolved permission does not match the bounded proof policy");
    }
    let resolvedAgent: Record<string, unknown>;
    try {
      resolvedAgent = JSON.parse(agentDebug.stdout) as Record<string, unknown>;
    } catch {
      throw new Error("OpenCode resolved build agent output is not JSON");
    }
    record.agentEnvelope = { steps: resolvedAgent.steps };
    if (resolvedAgent.steps !== 12) throw new Error("OpenCode resolved build agent does not enforce 12 steps");
    const roots: Array<[string, string]> = [[proofRoot, "<proof-root>"], [root, "<kit-root>"]];
    record.loader = {
      agent: {
        outputBytes: agentDebug.stdout.length,
        outputHash: sha256(agentDebug.stdout),
        status: agentDebug.status,
        stderrBytes: agentDebug.stderr.length,
        stderrHasError: /level=ERROR/.test(agentDebug.stderr),
        stderrHash: sha256(redact(agentDebug.stderr, [...roots, [os.homedir(), "<home>"]])),
      },
      config: {
        outputBytes: configDebug.stdout.length,
        outputHash: sha256(configDebug.stdout),
        status: configDebug.status,
        stderrBytes: configDebug.stderr.length,
        stderrHasError: /level=ERROR/.test(configDebug.stderr),
        stderrHash: sha256(redact(configDebug.stderr, [...roots, [os.homedir(), "<home>"]])),
      },
    };
    if (configDebug.status !== 0 || agentDebug.status !== 0) throw new Error("OpenCode loader preflight failed");
    record.config = {
      explicitReuseConfig: fs.existsSync(fixture.configPath),
      globalSourceMatchesKit: path.resolve(process.env.OPENCODE_CONFIG_DIR ?? path.join(root, "global")) === path.join(root, "global"),
      ownerPathsUsed: false,
    };
    record.opencodeVersion = opencode.stdout.trim();
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
    writeJson(preflightFile, record);
    if (cleanupError != null || fs.existsSync(proofRoot)) throw new Error(`Preflight cleanup failed: ${cleanupError ?? "root exists"}`);
  }
  console.log(JSON.stringify({ cleanup: "removed", mode: "preflight", modelCalls: 0, profile: args.profile, route: `${route.model}/${route.variant}`, scenarios: args.scenarios.length }));
}

function capture(args: Arguments): void {
  fs.mkdirSync(args.evidenceRoot, { recursive: true });
  const completed: ScenarioId[] = [];
  for (const scenario of args.scenarios) {
    captureScenario(args, scenario);
    completed.push(scenario);
  }
  const manifestFile = path.join(args.evidenceRoot, "manifest.json");
  let prior: ScenarioId[] = [];
  if (fs.existsSync(manifestFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(manifestFile, "utf8")) as { completed?: ScenarioId[] };
      prior = Array.isArray(parsed.completed) ? parsed.completed : [];
    } catch {
      prior = [];
    }
  }
  const allCompleted = SCENARIOS.filter((scenario) => prior.includes(scenario) || completed.includes(scenario));
  writeJson(manifestFile, {
    candidateId: args.candidateId,
    captureKind: args.captureKind,
    completed: allCompleted,
    profile: args.profile,
    schemaVersion: 1,
  });
  console.log(JSON.stringify({ candidateId: args.candidateId, cleanup: "removed", mode: "capture", profile: args.profile, scenarios: completed.length }));
}

function readBundles(root: string): Map<ScenarioId, ScenarioBundle> {
  const bundles = new Map<ScenarioId, ScenarioBundle>();
  for (const scenario of SCENARIOS) {
    const file = path.join(root, `${scenario}.bundle.json`);
    if (!fs.existsSync(file)) continue;
    bundles.set(scenario, JSON.parse(fs.readFileSync(file, "utf8")) as ScenarioBundle);
  }
  return bundles;
}

function evaluate(args: Arguments): void {
  if (args.baselineRoot == null) throw new Error("evaluate requires --baseline-root");
  const baseline = readBundles(path.resolve(args.baselineRoot));
  const candidate = args.candidateRoot == null ? null : readBundles(path.resolve(args.candidateRoot));
  const rows = SCENARIOS.flatMap((scenario) => {
    const before = baseline.get(scenario);
    if (before == null) return [];
    const after = candidate?.get(scenario) ?? null;
    const facts = (bundle: ScenarioBundle | null) => bundle == null ? null : {
      assistantChars: bundle.facts.assistantText.length,
      cleanup: bundle.cleanup.removed,
      elapsedMs: bundle.facts.elapsedMs,
      status: bundle.command.status,
      toolCalls: bundle.facts.toolCalls.map((call) => call.name),
      tokenFacts: bundle.facts.tokens,
    };
    return [{ baseline: facts(before), candidate: facts(after), scenario }];
  });
  const result = {
    baselineComplete: baseline.size === SCENARIOS.length,
    candidateComplete: candidate == null ? null : candidate.size === SCENARIOS.length,
    note: "Facts only. Semantic retention oracles require explicit main disposition; no synthetic quality score is derived.",
    rows,
    schemaVersion: 1,
  };
  writeJson(path.join(args.evidenceRoot, "evaluation.json"), result);
  console.log(JSON.stringify({ baselineComplete: result.baselineComplete, candidateComplete: result.candidateComplete, mode: "evaluate", rows: rows.length }));
}

function clientProof(args: Arguments): void {
  const root = repositoryRoot();
  const proofRoot = fs.mkdtempSync(path.join(os.tmpdir(), "reuse-discovery-client-proof-"));
  const evidenceFile = path.join(args.evidenceRoot, "client-proof.json");
  const commands: Array<Record<string, unknown>> = [];
  let cleanupError: string | null = null;
  let evidence: Record<string, unknown> | null = null;
  try {
    const fixture = setupScenario(proofRoot, "inventory-refresh");
    const alphaRoot = path.join(proofRoot, "workspace", "projects", "alpha");
    const betaRoot = path.join(proofRoot, "workspace", "projects", "beta");
    const identity = (projectRoot: string) => {
      const commit = runGitCapture(projectRoot, ["rev-parse", "refs/heads/main"]);
      const treeLine = runGitCapture(projectRoot, ["cat-file", "-p", commit]).split(/\r?\n/).find((line) => line.startsWith("tree "));
      if (treeLine == null) throw new Error("Disposable commit has no tree identity");
      return { commit, tree: treeLine.slice("tree ".length).trim() };
    };
    const alpha = identity(alphaRoot);
    const beta = identity(betaRoot);
    const planFile = path.join(proofRoot, "state", "plan.json");
    writeJson(planFile, {
      group: "personal",
      mode: "initial",
      operation: "bootstrap",
      projects: [
        { ...alpha, id: "shared/alpha", root: alphaRoot, scanRef: "refs/heads/main" },
        { ...beta, id: "shared/beta", root: betaRoot, scanRef: "refs/heads/main" },
      ],
      registry: "synthetic/reuse-registry",
      tempParent: proofRoot,
      version: 1,
    });
    const candidateFile = path.join(proofRoot, "state", "candidate.json");
    writeJson(candidateFile, {
      capability: {
        constraints: ["node>=24"],
        effects: ["none"],
        entrypoints: [{ path: "src/jsonc.ts", symbol: "parseJsonc" }],
        evidence: [{ path: "proofs/jsonc.md" }],
        id: "text/jsonc-parse",
        keywords: ["comments", "jsonc", "parser", "parsing"],
        kind: "library",
        maturity: "portable-proven",
        project: "shared/alpha",
        qualification: { basis: "unrelated-project-proof", consumers: ["synthetic/consumer"] },
        status: "active",
        summary: "Parse JSONC from a verified committed source entrypoint",
      },
      createdBy: "reuse-registry-client",
      status: "pending",
      version: 1,
    });
    const before = fileManifest(proofRoot);
    const client = path.join(root, "global", "bin", "reuse-registry.ts");
    const invoke = (name: string, tail: string[]): Record<string, unknown> => {
      const argv = [process.execPath, client, ...tail, "--config", fixture.configPath];
      const started = Date.now();
      const result = runPortableCommand(root, argv, { capture: true });
      const roots: Array<[string, string]> = [[proofRoot, "<proof-root>"], [root, "<kit-root>"]];
      const stdout = redactEvidenceString(redact(result.stdout, roots), root);
      const stderr = redactEvidenceString(redact(result.stderr, roots), root);
      const command = {
        argv: argv.map((value) => redact(value, roots)),
        elapsedMs: Date.now() - started,
        name,
        status: result.status,
        stderr,
        stdout,
      };
      commands.push(command);
      if (result.status !== 0) {
        const error = new Error(`Client proof command failed: ${name}`) as Error & { cause?: unknown };
        error.cause = result.error ?? stderr;
        throw error;
      }
      try {
        return JSON.parse(stdout) as Record<string, unknown>;
      } catch (error) {
        const wrapped = new Error(`Client proof command returned non-JSON: ${name}`) as Error & { cause?: unknown };
        wrapped.cause = error;
        throw wrapped;
      }
    };
    const statusBefore = invoke("status-before", ["status"]);
    const validateBefore = invoke("validate-before", ["validate"]);
    const bootstrap = invoke("bootstrap", ["bootstrap", "--plan", planFile]);
    const emptyQuery = invoke("query-empty", ["query", "--need", "jsonc", "--groups", "personal", "--limit", "10"]);
    const enqueue = invoke("enqueue", ["enqueue", "--candidate", candidateFile]);
    const statusPending = invoke("status-pending", ["status"]);
    const sync = invoke("sync", ["sync"]);
    const curatedQuery = invoke("query-curated", ["query", "--need", "jsonc", "--groups", "personal", "--limit", "10"]);
    const singleEnabledQuery = invoke("query-single-enabled-fallback", ["query", "--need", "jsonc-parser", "--groups", "--limit", "10"]);
    const capturedVocabularyQuery = invoke("query-captured-vocabulary", ["query", "--need", "jsonc-parsing", "--limit", "10"]);
    const validateAfter = invoke("validate-after", ["validate"]);
    const curatedResults = Array.isArray(curatedQuery.results) ? curatedQuery.results as Array<Record<string, unknown>> : [];
    const singleEnabledResults = Array.isArray(singleEnabledQuery.results) ? singleEnabledQuery.results as Array<Record<string, unknown>> : [];
    const capturedVocabularyResults = Array.isArray(capturedVocabularyQuery.results) ? capturedVocabularyQuery.results as Array<Record<string, unknown>> : [];
    const bootstrapProjects = Array.isArray(bootstrap.projects) ? bootstrap.projects as Array<Record<string, unknown>> : [];
    const expected = {
      bootstrapProjects: bootstrapProjects.length === 2,
      cleanupPending: Array.isArray(sync.synced) && sync.synced.length === 1 && sync.pending === 0,
      capturedVocabulary: capturedVocabularyQuery.groups?.[0] === "personal" && capturedVocabularyResults.length === 1 && capturedVocabularyResults[0]?.id === "text/jsonc-parse",
      curatedInitiallyEmpty: bootstrap.curatedCapabilities === 0,
      curatedOwner: curatedResults.length === 1 && curatedResults[0]?.id === "text/jsonc-parse" && curatedResults[0]?.project === "shared/alpha",
      emptyBeforePromotion: emptyQuery.total === 0,
      pendingVisible: Array.isArray(statusPending.pending) && statusPending.pending.includes("text/jsonc-parse"),
      privateSentinelAbsent: !JSON.stringify(curatedQuery).includes("SENTINEL_UNALLOWLISTED") && !JSON.stringify(curatedQuery).includes("private/sentinel"),
      registryValid: validateBefore.status === "ok" && validateAfter.status === "ok",
      singleEnabledFallback: singleEnabledQuery.groups?.[0] === "personal" && singleEnabledResults.length === 1 && (singleEnabledResults[0]?.verification as Record<string, unknown> | undefined)?.status === "verified",
      statusBefore: statusBefore.status === "ok",
      syncStatus: enqueue.registryImpact === "pending" && sync.registryImpact === "synced",
    };
    if (Object.values(expected).some((value) => value !== true)) throw new Error(`Client proof facts failed: ${JSON.stringify(expected)}`);
    const generatedRoot = path.join(proofRoot, "registry", "generated", "projects");
    const generatedFiles = fs.readdirSync(generatedRoot).filter((file) => file.endsWith(".json")).sort();
    const gitStates = {
      alpha: runGitCapture(alphaRoot, ["status", "--porcelain"]),
      beta: runGitCapture(betaRoot, ["status", "--porcelain"]),
    };
    evidence = {
      candidateId: args.candidateId,
      cleanup: "pending",
      commands,
      expected,
      fixture: {
        commits: { alpha, beta },
        generatedFiles,
        gitStates,
        producerProof: fixture.producerProof,
        roots: "<proof-root>",
      },
      manifests: { after: fileManifest(proofRoot), before },
      modelCalls: 0,
      schemaVersion: 1,
      sourceHashes: sourceHashes(root),
    };
    writeJson(evidenceFile, evidence);
  } finally {
    try {
      fs.rmSync(proofRoot, { force: true, recursive: true });
    } catch (error) {
      cleanupError = safeError(error);
    }
    if (evidence != null) {
      evidence.cleanup = cleanupError == null && !fs.existsSync(proofRoot) ? "removed" : `unknown:${cleanupError ?? "root-exists"}`;
      writeJson(evidenceFile, evidence);
    }
    if (cleanupError != null || fs.existsSync(proofRoot)) throw new Error(`Client proof cleanup failed: ${cleanupError ?? "root exists"}`);
  }
  console.log(JSON.stringify({ cleanup: "removed", commands: commands.length, mode: "client-proof", modelCalls: 0 }));
}

function clientPreflight(args: Arguments): void {
  const root = repositoryRoot();
  const proofRoot = fs.mkdtempSync(path.join(os.tmpdir(), "reuse-discovery-client-preflight-"));
  const evidenceFile = path.join(args.evidenceRoot, "client-preflight.json");
  const commands: Array<Record<string, unknown>> = [];
  let cleanupError: string | null = null;
  const evidence: Record<string, unknown> = {
    candidateId: args.candidateId,
    cleanup: "pending",
    commands,
    modelCalls: 0,
    schemaVersion: 1,
    sourceHashes: sourceHashes(root),
  };
  writeJson(evidenceFile, evidence);
  try {
    const fixture = setupScenario(proofRoot, "inventory-refresh");
    const client = path.join(root, "global", "bin", "reuse-registry.ts");
    for (const operation of ["status", "validate"] as const) {
      const argv = [process.execPath, client, operation, "--config", fixture.configPath];
      const result = runPortableCommand(root, argv, { capture: true });
      const roots: Array<[string, string]> = [[proofRoot, "<proof-root>"], [root, "<kit-root>"]];
      const command = {
        argv: argv.map((value) => redact(value, roots)),
        name: operation,
        status: result.status,
        stderr: redactEvidenceString(redact(result.stderr, roots), root),
        stdout: redactEvidenceString(redact(result.stdout, roots), root),
      };
      commands.push(command);
      writeJson(evidenceFile, evidence);
      if (result.status !== 0) {
        const error = new Error(`Client preflight failed: ${operation}`) as Error & { cause?: unknown };
        error.cause = result.error ?? command.stderr;
        throw error;
      }
    }
  } finally {
    try {
      fs.rmSync(proofRoot, { force: true, recursive: true });
    } catch (error) {
      cleanupError = safeError(error);
    }
    evidence.cleanup = cleanupError == null && !fs.existsSync(proofRoot) ? "removed" : `unknown:${cleanupError ?? "root-exists"}`;
    writeJson(evidenceFile, evidence);
    if (cleanupError != null || fs.existsSync(proofRoot)) throw new Error(`Client preflight cleanup failed: ${cleanupError ?? "root exists"}`);
  }
  console.log(JSON.stringify({ cleanup: "removed", commands: commands.length, mode: "client-preflight", modelCalls: 0 }));
}

function sanitizeEvidence(args: Arguments): void {
  const root = repositoryRoot();
  let files = 0;
  const walk = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.isFile() && entry.name.endsWith(".json")) {
        const value = JSON.parse(fs.readFileSync(absolute, "utf8")) as unknown;
        writeJson(absolute, redactEvidenceValue(value, root));
        files++;
      }
    }
  };
  walk(args.evidenceRoot);
  console.log(JSON.stringify({ files, mode: "sanitize" }));
}

function recover(args: Arguments): void {
  if (args.abandonedRoot == null || args.sessionId == null) throw new Error("recover requires --abandoned-root and --session-id");
  const root = repositoryRoot();
  const abandonedRoot = path.resolve(args.abandonedRoot);
  const tempRoot = path.resolve(os.tmpdir());
  const relative = path.relative(tempRoot, abandonedRoot);
  if (relative.startsWith("..") || path.isAbsolute(relative) || !path.basename(abandonedRoot).startsWith("reuse-discovery-")) {
    throw new Error("Recovery root must be a reuse-discovery directory directly under the OS temp root");
  }
  const workspace = path.join(abandonedRoot, "workspace");
  const configPath = path.join(abandonedRoot, "state", "reuse-config.json");
  const environment = proofEnvironment(root, abandonedRoot, configPath, args.profile);
  const deletion = runPortableCommand(fs.existsSync(workspace) ? workspace : root, ["opencode", "session", "delete", args.sessionId, "--pure"], { capture: true, env: environment });
  let removalError: string | null = null;
  try {
    fs.rmSync(abandonedRoot, { force: true, recursive: true });
  } catch (error) {
    removalError = safeError(error);
  }
  const result = {
    cleanup: !fs.existsSync(abandonedRoot),
    removalError,
    root: "<proof-root>",
    sessionDeleteStatus: deletion.status,
    sessionID: args.sessionId,
  };
  writeJson(path.join(args.evidenceRoot, "recovery.json"), result);
  if (deletion.status !== 0 || removalError != null || fs.existsSync(abandonedRoot)) throw new Error("Interrupted proof recovery failed");
  console.log(JSON.stringify({ cleanup: true, mode: "recover", sessionDeleteStatus: deletion.status }));
}

const args = argumentsFromCli();
try {
  if (args.mode === "preflight") preflight(args);
  else if (args.mode === "capture") capture(args);
  else if (args.mode === "client-preflight") clientPreflight(args);
  else if (args.mode === "client-proof") clientProof(args);
  else if (args.mode === "evaluate") evaluate(args);
  else if (args.mode === "recover") recover(args);
  else sanitizeEvidence(args);
} catch (error) {
  const wrapped = new Error(`Reuse discovery proof runner failed in ${args.mode}`) as Error & { cause?: unknown };
  wrapped.cause = error;
  console.error(wrapped.stack);
  if (error instanceof Error && error.stack != null) console.error(`Caused by: ${error.stack}`);
  process.exitCode = 1;
}
