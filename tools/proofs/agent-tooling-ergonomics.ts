#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runPortableCommand } from "../../global/bin/portable-process.ts";
import { loadModelProfile } from "../model-profile.ts";
import {
  applyCapabilityCompositionAuthoringControl,
  capabilityCompositionBaselineExpectation,
  capabilityCompositionPrompts,
  capabilityCompositionRedControls,
  capabilityCompositionScenarioIds,
  createCompliantCapabilityCompositionFixture,
  evaluateCapabilityCompositionScenario,
  isCapabilityCompositionScenario,
  parseCapabilityCompositionSeed,
  setupCapabilityCompositionScenario,
  type CapabilityCompositionScenarioId,
} from "./lib/capability-composition-scenarios.ts";
import {
  changeLocalityFollowUps,
  changeLocalityPrompts,
  changeLocalityScenarioIds,
  createCompliantChangeLocalityFixture,
  evaluateChangeLocalityScenario,
  isChangeLocalityScenario,
  setupChangeLocalityScenario,
  type ChangeLocalityScenarioId,
} from "./lib/change-locality-scenarios.ts";

type CaptureKind = "baseline" | "candidate";
type RunnerMode = "capture" | "evaluate" | "preflight" | "replay";
type ProofPack = "tooling" | "change-locality" | "capability-composition";
type ToolingScenarioId = "mechanical-artifact" | "repeated-cli" | "source-placement";
type ScenarioId = ToolingScenarioId | ChangeLocalityScenarioId | CapabilityCompositionScenarioId;

type Arguments = {
  baselineRoot: string | null;
  candidateId: string;
  candidateRoot: string | null;
  captureKind: CaptureKind;
  evidenceRoot: string;
  help: boolean;
  mode: RunnerMode | null;
  pack: ProofPack;
  profile: string;
  scenarios: ScenarioId[];
  sourceRoot: string;
};

type CommandFact = {
  argv: string[];
  status: number | null;
  stderr: string;
  stdout: string;
};

type FileFact = {
  bytes: number;
  content: string | null;
  path: string;
  sha256: string;
};

type ToolCall = {
  input: unknown;
  name: string;
  status: string | null;
};

type ScenarioOracle = {
  facts: Record<string, boolean | number | string | null>;
  pass: boolean;
  postCommands: CommandFact[];
};

type ScenarioBundle = {
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
  command: CommandFact;
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
  filesAfterOracle: FileFact[];
  filesBeforeOracle: FileFact[];
  input: {
    message: string;
    promptSha256: string;
    scenario: ScenarioId;
  };
  oracle: ScenarioOracle;
  schemaVersion: 1;
};

const TOOLING_SCENARIOS: readonly ToolingScenarioId[] = [
  "repeated-cli",
  "mechanical-artifact",
  "source-placement",
];

function scenariosForPack(pack: ProofPack): ScenarioId[] {
  if (pack === "change-locality") return changeLocalityScenarioIds();
  if (pack === "capability-composition") return capabilityCompositionScenarioIds();
  return [...TOOLING_SCENARIOS];
}

function promptsFor(pack: ProofPack): Record<string, string> {
  if (pack === "change-locality") return changeLocalityPrompts();
  if (pack === "capability-composition") return capabilityCompositionPrompts();
  return TOOLING_PROMPTS;
}

const TOOLING_PROMPTS: Record<ToolingScenarioId, string> = {
  "repeated-cli": [
    "Implement the smallest complete local change. Create a dependency-free repository-owned CLI at tools/report.mjs.",
    "It will be used repeatedly by operators and later agents. Its required product command is:",
    "  node tools/report.mjs scan --input sample.txt",
    "The scan command must print one compact JSON object containing input=sample.txt and bytes=6 for the existing file.",
    "Do not add tests, a package dependency, or a framework. Run the nearest representative command and inspect its output.",
  ].join("\n"),
  "mechanical-artifact": [
    "Implement the smallest complete local change. Produce authoritative data/artifacts.json for inputs/a.txt and inputs/b.txt.",
    "The JSON is an ordinally sorted array with ids variant-a and variant-b, ordinals 1 and 2, source paths, exact byteLength, and uppercase SHA-256 for each source.",
    "These artifacts will be regenerated after input changes and more variants are expected later. Keep semantic ids, source paths, and ordinals reviewable.",
    "Do not add tests, a package dependency, or a generic framework. If automation is needed, use tools/materialize.mjs. Run the nearest proof and inspect the output.",
  ].join("\n"),
  "source-placement": [
    "Implement the smallest complete local change. target/ is ignored and is the required output root for three generated challenge cases named alpha, beta, and gamma.",
    "Create a dependency-free generator intended for repeated later runs. Each target/cases/<id>.json contains exactly {\"case\":\"<id>\"} plus a newline.",
    "Also create the tiny one-off semantic record config/one-off.json containing exactly {\"message\":\"ready\"} plus a newline.",
    "Do not add tests, a package dependency, or a generic framework. Run the generator and inspect its outputs.",
  ].join("\n"),
};

const TOOL_POLICY = [
  "bash: node only; shell metacharacters denied last",
  "edit: allow inside disposable project",
  "external_directory: deny",
  "glob: allow",
  "grep: allow",
  "question: deny",
  "read: allow",
  "skill: deny",
  "task: deny",
  "webfetch: deny",
];

const PROOF_PERMISSION = {
  "*": "deny",
  bash: {
    "*": "deny",
    "node *": "allow",
    "node.exe *": "allow",
    "*;*": "deny",
    "*&&*": "deny",
    "*|*": "deny",
    "*>*": "deny",
    "*<*": "deny",
  },
  edit: "allow",
  external_directory: "deny",
  glob: "allow",
  grep: "allow",
  question: "deny",
  read: "allow",
  skill: "deny",
  task: "deny",
  webfetch: "deny",
} as const;

function usage(): string {
  return [
    "Usage:",
    "  node tools/proofs/agent-tooling-ergonomics.ts --help",
    "  node tools/proofs/agent-tooling-ergonomics.ts --mode preflight --evidence-root <new-path> [--pack tooling|change-locality|capability-composition] [--source-root <path>] [--profile quality-independent] [--capture-kind baseline|candidate] [--candidate-id <id>]",
    "  node tools/proofs/agent-tooling-ergonomics.ts --mode capture --evidence-root <new-path> --capture-kind baseline|candidate --candidate-id <id> [--pack tooling|change-locality|capability-composition] [--source-root <path>] [--profile quality-independent] [--scenarios all|id,...]",
    "  node tools/proofs/agent-tooling-ergonomics.ts --mode evaluate|replay --evidence-root <new-path> --baseline-root <path> [--candidate-root <path>] [--pack tooling|change-locality|capability-composition]",
    "",
    "Pack tooling keeps the original three authoring scenarios. Pack change-locality uses the seven CLC-001 scenarios.",
    "Pack capability-composition uses the eight CCO-001 authoring scenarios; preflight and replay make zero model calls.",
    "All evidence roots are create-new. Help performs no writes or model calls.",
  ].join("\n");
}

function repositoryRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
}

function argumentValue(name: string): string | null {
  const index = process.argv.indexOf(name);
  return index < 0 ? null : process.argv[index + 1] ?? null;
}

function parseScenarioList(value: string | null, pack: ProofPack): ScenarioId[] {
  const available = scenariosForPack(pack);
  if (value == null || value === "all") return [...available];
  const raw = value.split(",");
  const selected = raw.filter((item): item is ScenarioId => available.includes(item as ScenarioId));
  if (selected.length === 0 || selected.length !== raw.length) {
    throw new Error(`Invalid --scenarios value; expected all or comma-separated ${available.join(",")}`);
  }
  return [...new Set(selected)];
}

function argumentsFromCli(): Arguments {
  const help = process.argv.includes("--help") || process.argv.includes("-h");
  const packValue = argumentValue("--pack") ?? "tooling";
  if (packValue !== "tooling" && packValue !== "change-locality" && packValue !== "capability-composition") {
    throw new Error("--pack must be tooling, change-locality, or capability-composition");
  }
  if (help) {
    return {
      baselineRoot: null,
      candidateId: "help",
      candidateRoot: null,
      captureKind: "baseline",
      evidenceRoot: "",
      help,
      mode: null,
      pack: packValue,
      profile: "quality-independent",
      scenarios: scenariosForPack(packValue),
      sourceRoot: repositoryRoot(),
    };
  }
  const mode = argumentValue("--mode");
  if (mode !== "preflight" && mode !== "capture" && mode !== "evaluate" && mode !== "replay") {
    throw new Error(usage());
  }
  const captureKind = argumentValue("--capture-kind") ?? "baseline";
  if (captureKind !== "baseline" && captureKind !== "candidate") {
    throw new Error("--capture-kind must be baseline or candidate");
  }
  const evidenceRoot = argumentValue("--evidence-root");
  if (evidenceRoot == null || evidenceRoot.trim() === "") throw new Error("--evidence-root is required");
  return {
    baselineRoot: argumentValue("--baseline-root"),
    candidateId: argumentValue("--candidate-id") ?? `${captureKind}-working-tree`,
    candidateRoot: argumentValue("--candidate-root"),
    captureKind,
    evidenceRoot: path.resolve(evidenceRoot),
    help: false,
    mode,
    pack: packValue,
    profile: argumentValue("--profile") ?? "quality-independent",
    scenarios: parseScenarioList(argumentValue("--scenarios"), packValue),
    sourceRoot: path.resolve(argumentValue("--source-root") ?? repositoryRoot()),
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

function safeError(error: unknown): string {
  if (error instanceof Error) {
    const cause = "cause" in error && error.cause != null ? `; cause=${safeError(error.cause)}` : "";
    return `${error.message}${cause}`;
  }
  return String(error);
}

function createEvidenceRoot(root: string): void {
  if (fs.existsSync(root)) throw new Error(`Evidence root already exists: ${root}`);
  const parent = path.dirname(root);
  if (!fs.existsSync(parent) || !fs.statSync(parent).isDirectory()) {
    throw new Error(`Evidence parent is unavailable: ${parent}`);
  }
  fs.mkdirSync(root);
}

function writeText(file: string, value: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value, { encoding: "utf8", flag: "wx" });
}

function writeJson(file: string, value: unknown): void {
  writeText(file, `${JSON.stringify(value, null, 2)}\n`);
}

function allFiles(root: string): string[] {
  const files: string[] = [];
  const visitDirectory = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) visitDirectory(full);
      else if (entry.isFile()) files.push(full);
    }
  };
  if (fs.existsSync(root)) visitDirectory(root);
  return files;
}

function fileManifest(root: string): FileFact[] {
  return allFiles(root).map((file) => {
    const bytes = fs.readFileSync(file);
    const relative = path.relative(root, file).replaceAll("\\", "/");
    const textEligible = bytes.length <= 65_536 && /\.(cjs|js|json|md|mjs|txt)$/i.test(relative);
    return {
      bytes: bytes.length,
      content: textEligible ? bytes.toString("utf8") : null,
      path: relative,
      sha256: sha256(bytes),
    };
  });
}

function writeManifest(root: string, role: string): void {
  const files = fileManifest(root).filter((fact) => fact.path !== "manifest.json").map(({ bytes, path: relative, sha256: hash }) => ({
    bytes,
    path: relative,
    sha256: hash,
  }));
  writeJson(path.join(root, "manifest.json"), { files, role, schemaVersion: 1 });
}

function verifyManifest(root: string): void {
  const manifestPath = path.join(root, "manifest.json");
  if (!fs.existsSync(manifestPath)) throw new Error(`Missing manifest: ${root}`);
  const parsed = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
    files?: Array<{ bytes?: unknown; path?: unknown; sha256?: unknown }>;
  };
  if (!Array.isArray(parsed.files)) throw new Error(`Invalid manifest files: ${root}`);
  const actual = fileManifest(root).filter((fact) => fact.path !== "manifest.json").map(({ bytes, path: relative, sha256: hash }) => ({
    bytes,
    path: relative,
    sha256: hash,
  }));
  if (JSON.stringify(actual) !== JSON.stringify(parsed.files)) throw new Error(`Manifest mismatch: ${root}`);
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

function redactEvidence(text: string, kitRoot: string, proofRoot: string): string {
  return redact(text, [
    [proofRoot, "<proof-root>"],
    [kitRoot, "<kit-root>"],
    [os.homedir(), "<home>"],
  ]);
}

function visit(value: unknown, callback: (record: Record<string, unknown>) => void): void {
  if (Array.isArray(value)) {
    for (const child of value) visit(child, callback);
    return;
  }
  if (value == null || typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  callback(record);
  for (const child of Object.values(record)) visit(child, callback);
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

function candidateSourceHashes(sourceRoot: string): Record<string, string | null> {
  return Object.fromEntries([
    "global/AGENTS.md",
    "global/agents/implementation-worker.md",
    "global/agents/instruction-artifact-reviewer.md",
    "global/agents/sdet-quality-engineer.md",
    "global/skills/instruction-artifact-tuning/SKILL.md",
    "README.md",
    "package.json",
    "tools/proofs/agent-tooling-ergonomics.ts",
    "tools/proofs/lib/capability-composition-scenarios.ts",
    "tools/proofs/fixtures/capability-composition/scenarios.json",
  ].map((relative) => [relative, hashFile(path.join(sourceRoot, relative))]));
}

function instructionInventory(sourceRoot: string): Record<string, unknown> {
  const result = runPortableCommand(sourceRoot, [
    process.execPath,
    path.join(sourceRoot, "tools", "instruction-artifacts-inventory.ts"),
    "--root",
    sourceRoot,
    "--format",
    "json",
  ], { capture: true });
  if (result.status !== 0) {
    const error = new Error("Instruction inventory failed") as Error & { cause?: unknown };
    error.cause = result.stderr;
    throw error;
  }
  return JSON.parse(result.stdout) as Record<string, unknown>;
}

function proofPermission(pack: ProofPack): typeof PROOF_PERMISSION {
  return pack === "change-locality" || pack === "capability-composition" ? { ...PROOF_PERMISSION, task: "allow" } : PROOF_PERMISSION;
}

function toolPolicy(pack: ProofPack): string[] {
  return TOOL_POLICY.map((row) => (pack === "change-locality" || pack === "capability-composition") && row === "task: deny"
    ? "task: allow to observe Practice Owner launches"
    : row);
}

function proofEnvironment(kitRoot: string, sourceRoot: string, proofRoot: string, profile: string, pack: ProofPack): NodeJS.ProcessEnv {
  const loaded = loadModelProfile(kitRoot, profile);
  return {
    ...process.env,
    OPENCODE_CONFIG_CONTENT: JSON.stringify({
      ...loaded.profile,
      agent: {
        ...loaded.profile.agent,
        build: { ...loaded.profile.agent.build, steps: 24 },
      },
      permission: proofPermission(pack),
    }),
    OPENCODE_CONFIG_DIR: path.join(sourceRoot, "global"),
    OPENCODE_PURE: "1",
    XDG_CACHE_HOME: path.join(proofRoot, "xdg-cache"),
    XDG_STATE_HOME: path.join(proofRoot, "xdg-state"),
  };
}

function setupScenario(proofRoot: string, scenario: ScenarioId): string {
  const project = path.join(proofRoot, "project");
  writeJson(path.join(project, "package.json"), {
    name: `tooling-ergonomics-${scenario}`,
    private: true,
    type: "module",
  });
  writeText(path.join(project, ".gitignore"), "target/\nnode_modules/\n");
  if (isChangeLocalityScenario(scenario)) {
    setupChangeLocalityScenario(project, scenario);
    return project;
  }
  if (isCapabilityCompositionScenario(scenario)) {
    setupCapabilityCompositionScenario(project, scenario);
    return project;
  }
  if (scenario === "repeated-cli") {
    writeText(path.join(project, "sample.txt"), "sample");
  } else if (scenario === "mechanical-artifact") {
    writeText(path.join(project, "inputs", "a.txt"), "alpha\n");
    writeText(path.join(project, "inputs", "b.txt"), "beta-data\n");
  }
  return project;
}

function runNode(project: string, ...args: string[]): CommandFact {
  const result = runPortableCommand(project, [process.execPath, ...args], { capture: true });
  return {
    argv: ["node", ...args.map((arg) => arg.replaceAll("\\", "/"))],
    status: result.status,
    stderr: result.stderr,
    stdout: result.stdout,
  };
}

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(file, "utf8")) as unknown;
}

function evaluateRepeatedCli(project: string): ScenarioOracle {
  const cli = path.join(project, "tools", "report.mjs");
  const sourceExists = fs.existsSync(cli);
  const before = fileManifest(project);
  const help = sourceExists ? runNode(project, "tools/report.mjs", "--help") : null;
  const shortHelp = sourceExists ? runNode(project, "tools/report.mjs", "-h") : null;
  const after = fileManifest(project);
  const scan = sourceExists ? runNode(project, "tools/report.mjs", "scan", "--input", "sample.txt") : null;
  let scanExact = false;
  try {
    const parsed = JSON.parse(scan?.stdout.trim() ?? "") as { bytes?: unknown; input?: unknown };
    scanExact = parsed.bytes === 6 && parsed.input === "sample.txt";
  } catch {
    scanExact = false;
  }
  const helpComplete = (value: CommandFact | null): boolean => value != null && value.status === 0 &&
    value.stdout.includes("scan") && value.stdout.includes("--input");
  const facts = {
    effectFreeHelp: JSON.stringify(before) === JSON.stringify(after),
    helpComplete: helpComplete(help),
    scanExact,
    shortHelpComplete: helpComplete(shortHelp),
    sourceExists,
  };
  return {
    facts,
    pass: Object.values(facts).every(Boolean),
    postCommands: [help, shortHelp, scan].filter((value): value is CommandFact => value != null),
  };
}

const EXPECTED_SEMANTIC_ROWS = [
  { id: "variant-a", ordinal: 1, source: "inputs/a.txt" },
  { id: "variant-b", ordinal: 2, source: "inputs/b.txt" },
] as const;

function normalizedArtifactRows(value: unknown, derived: boolean): Array<Record<string, unknown>> | null {
  if (!Array.isArray(value)) return null;
  const normalized: Array<Record<string, unknown>> = [];
  for (const item of value) {
    if (item == null || typeof item !== "object" || Array.isArray(item)) return null;
    const row = item as Record<string, unknown>;
    const sourceKey = typeof row.source === "string" ? "source" : typeof row.sourcePath === "string" ? "sourcePath" : null;
    if (sourceKey == null || typeof row.id !== "string" || typeof row.ordinal !== "number") return null;
    const expectedKeys = derived
      ? ["byteLength", "id", "ordinal", "sha256", sourceKey]
      : ["id", "ordinal", sourceKey];
    if (JSON.stringify(Object.keys(row).sort()) !== JSON.stringify(expectedKeys.sort())) return null;
    if (derived && (typeof row.byteLength !== "number" || typeof row.sha256 !== "string")) return null;
    normalized.push({
      id: row.id,
      ordinal: row.ordinal,
      source: row[sourceKey],
      ...(derived ? { byteLength: row.byteLength, sha256: row.sha256 } : {}),
    });
  }
  return normalized;
}

function mechanicalArtifactFacts(files: FileFact[]): Pick<ScenarioOracle["facts"], "outputExact" | "seedExists" | "seedSemanticOnly"> {
  const byPath = new Map(files.map((fact) => [fact.path, fact]));
  let outputRows: Array<Record<string, unknown>> | null = null;
  try {
    outputRows = normalizedArtifactRows(JSON.parse(byPath.get("data/artifacts.json")?.content ?? ""), true);
  } catch {
    outputRows = null;
  }
  const expectedOutput = EXPECTED_SEMANTIC_ROWS.map((row) => {
    const input = byPath.get(row.source);
    return {
      ...row,
      byteLength: input?.bytes ?? null,
      sha256: input?.sha256.toUpperCase() ?? null,
    };
  });
  const seeds = files.flatMap((fact) => {
    if (!/^data\/[^/]+\.json$/.test(fact.path) || fact.path === "data/artifacts.json" || fact.content == null) return [];
    try {
      const rows = normalizedArtifactRows(JSON.parse(fact.content), false);
      return rows == null ? [] : [{ path: fact.path, rows }];
    } catch {
      return [];
    }
  });
  return {
    outputExact: JSON.stringify(outputRows) === JSON.stringify(expectedOutput),
    seedExists: seeds.length === 1,
    seedSemanticOnly: seeds.length === 1 && JSON.stringify(seeds[0].rows) === JSON.stringify(EXPECTED_SEMANTIC_ROWS),
  };
}

function evaluateMechanicalArtifact(project: string): ScenarioOracle {
  const generator = path.join(project, "tools", "materialize.mjs");
  const output = path.join(project, "data", "artifacts.json");
  const generatorExists = fs.existsSync(generator);
  const first = generatorExists ? runNode(project, "tools/materialize.mjs") : null;
  const firstHash = hashFile(output);
  const second = generatorExists ? runNode(project, "tools/materialize.mjs") : null;
  const secondHash = hashFile(output);
  const artifact = mechanicalArtifactFacts(fileManifest(project));
  const facts = {
    generatorExists,
    outputExact: artifact.outputExact,
    regenerationStable: firstHash != null && firstHash === secondHash,
    runsExitZero: first?.status === 0 && second?.status === 0,
    seedExists: artifact.seedExists,
    seedSemanticOnly: artifact.seedSemanticOnly,
  };
  return {
    facts,
    pass: Object.values(facts).every(Boolean),
    postCommands: [first, second].filter((value): value is CommandFact => value != null),
  };
}

function sourcePlacementGenerator(project: string): string | null {
  const preferred = "tools/challenge-generator.mjs";
  if (fs.existsSync(path.join(project, preferred))) return preferred;
  try {
    const packageJson = readJson(path.join(project, "package.json")) as { scripts?: Record<string, unknown> };
    const command = packageJson.scripts?.["generate:cases"];
    const match = typeof command === "string" ? /^node ([A-Za-z0-9._/-]+\.(?:cjs|js|mjs))$/.exec(command) : null;
    if (match == null || match[1].split("/").includes("..")) return null;
    return fs.existsSync(path.join(project, match[1])) ? match[1] : null;
  } catch {
    return null;
  }
}

function evaluateSourcePlacement(project: string): ScenarioOracle {
  const generator = sourcePlacementGenerator(project);
  const oneOff = path.join(project, "config", "one-off.json");
  const sourceMaintained = generator != null && !generator.startsWith("target/");
  const first = generator == null ? null : runNode(project, generator);
  const firstHashes = ["alpha", "beta", "gamma"].map((id) => hashFile(path.join(project, "target", "cases", `${id}.json`)));
  const second = generator == null ? null : runNode(project, generator);
  const secondHashes = ["alpha", "beta", "gamma"].map((id) => hashFile(path.join(project, "target", "cases", `${id}.json`)));
  const casesExact = ["alpha", "beta", "gamma"].every((id) => {
    const file = path.join(project, "target", "cases", `${id}.json`);
    return fs.existsSync(file) && fs.readFileSync(file, "utf8") === `${JSON.stringify({ case: id })}\n`;
  });
  const oneOffExact = fs.existsSync(oneOff) && fs.readFileSync(oneOff, "utf8") === `${JSON.stringify({ message: "ready" })}\n`;
  const oneOffHelpers = fileManifest(project).filter((fact) => fact.path.startsWith("tools/") && fact.path.toLowerCase().includes("one-off"));
  const facts = {
    casesExact,
    generatorRunsExitZero: first?.status === 0 && second?.status === 0,
    generatedOutputsStable: firstHashes.every((hash) => hash != null) && JSON.stringify(firstHashes) === JSON.stringify(secondHashes),
    oneOffExact,
    oneOffRemainsManual: oneOffHelpers.length === 0,
    sourceMaintained,
  };
  return {
    facts,
    pass: Object.values(facts).every(Boolean),
    postCommands: [first, second].filter((value): value is CommandFact => value != null),
  };
}

function evaluateProject(project: string, scenario: ScenarioId): ScenarioOracle {
  if (isChangeLocalityScenario(scenario)) return evaluateChangeLocalityScenario(project, scenario);
  if (isCapabilityCompositionScenario(scenario)) return evaluateCapabilityCompositionScenario(project, scenario);
  if (scenario === "repeated-cli") return evaluateRepeatedCli(project);
  if (scenario === "mechanical-artifact") return evaluateMechanicalArtifact(project);
  return evaluateSourcePlacement(project);
}

function createCompliantFixture(project: string, scenario: ScenarioId): void {
  if (isChangeLocalityScenario(scenario)) {
    createCompliantChangeLocalityFixture(project, scenario);
    return;
  }
  if (isCapabilityCompositionScenario(scenario)) {
    createCompliantCapabilityCompositionFixture(project, scenario);
    return;
  }
  if (scenario === "repeated-cli") {
    writeText(path.join(project, "tools", "report.mjs"), [
      "const args = process.argv.slice(2);",
      "if (args[0] === '--help' || args[0] === '-h') { console.log('Usage: report scan --input <path>'); process.exit(0); }",
      "if (args[0] !== 'scan' || args[1] !== '--input' || !args[2]) throw new Error('Usage: report scan --input <path>');",
      "const fs = await import('node:fs');",
      "console.log(JSON.stringify({ input: args[2], bytes: fs.readFileSync(args[2]).length }));",
      "",
    ].join("\n"));
  } else if (scenario === "mechanical-artifact") {
    writeJson(path.join(project, "data", "seed.json"), [
      { id: "variant-a", ordinal: 1, source: "inputs/a.txt" },
      { id: "variant-b", ordinal: 2, source: "inputs/b.txt" },
    ]);
    writeText(path.join(project, "tools", "materialize.mjs"), [
      "import crypto from 'node:crypto';",
      "import fs from 'node:fs';",
      "const seed = JSON.parse(fs.readFileSync('data/seed.json', 'utf8'));",
      "const rows = seed.sort((a, b) => a.ordinal - b.ordinal).map((row) => {",
      "  const bytes = fs.readFileSync(row.source);",
      "  return { ...row, byteLength: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase() };",
      "});",
      "fs.writeFileSync('data/artifacts.json', `${JSON.stringify(rows, null, 2)}\\n`);",
      "",
    ].join("\n"));
  } else {
    writeText(path.join(project, "config", "one-off.json"), `${JSON.stringify({ message: "ready" })}\n`);
    writeText(path.join(project, "tools", "challenge-generator.mjs"), [
      "import fs from 'node:fs';",
      "fs.mkdirSync('target/cases', { recursive: true });",
      "for (const id of ['alpha', 'beta', 'gamma']) fs.writeFileSync(`target/cases/${id}.json`, `${JSON.stringify({ case: id })}\\n`);",
      "",
    ].join("\n"));
  }
}

function diffIdentity(root: string): Record<string, unknown> {
  if (!fs.existsSync(path.join(root, ".git"))) return { sha256: null, statusEntries: null };
  const diff = runPortableCommand(root, ["git", "diff", "--binary"], { capture: true });
  const status = runPortableCommand(root, ["git", "status", "--short"], { capture: true });
  if (diff.status !== 0 || status.status !== 0) return { sha256: null, statusEntries: null };
  return {
    sha256: sha256(diff.stdout),
    statusEntries: status.stdout.split(/\r?\n/).filter(Boolean).length,
  };
}

function preflight(args: Arguments): void {
  createEvidenceRoot(args.evidenceRoot);
  const kitRoot = repositoryRoot();
  const proofRoot = fs.mkdtempSync(path.join(os.tmpdir(), "agent-tooling-ergonomics-preflight-"));
  const loaded = loadModelProfile(kitRoot, args.profile);
  const route = loaded.profile.agent.build;
  let cleanupError: string | null = null;
  let failure: string | null = null;
  const rows: Array<Record<string, unknown>> = [];
  try {
    if (route.model !== loaded.profile.model) throw new Error("Build route differs from selected profile primary model");
    const environment = proofEnvironment(kitRoot, args.sourceRoot, proofRoot, args.profile, args.pack);
    const opencode = runPortableCommand(kitRoot, ["opencode", "--version"], { capture: true });
    const config = runPortableCommand(kitRoot, ["opencode", "debug", "config", "--pure"], { capture: true, env: environment });
    if (opencode.status !== 0 || config.status !== 0) throw new Error("Installed OpenCode loader preflight failed");
    const resolved = JSON.parse(config.stdout) as { permission?: unknown };
    if (JSON.stringify(resolved.permission) !== JSON.stringify(proofPermission(args.pack))) {
      throw new Error("Resolved proof permission differs from bounded policy");
    }
    const nativeArgument = `line-one\n${JSON.stringify({ probe: "<native>" })}`;
    const nativeArgumentProbe = runPortableCommand(kitRoot, [
      process.execPath,
      "-e",
      "process.stdout.write(process.argv[1])",
      nativeArgument,
    ], { capture: true });
    if (nativeArgumentProbe.status !== 0 || nativeArgumentProbe.stdout !== nativeArgument) {
      throw new Error("Native executable argument boundary preflight failed");
    }
    for (const scenario of args.scenarios) {
      const scenarioRoot = path.join(proofRoot, scenario);
      const project = setupScenario(scenarioRoot, scenario);
      const rejected = evaluateProject(project, scenario);
      createCompliantFixture(project, scenario);
      const accepted = evaluateProject(project, scenario);
      if (rejected.pass || !accepted.pass) throw new Error(`Provider-free oracle preflight failed for ${scenario}`);
      rows.push({ accepted: accepted.facts, rejected: rejected.facts, scenario });
    }
    if (args.pack === "capability-composition") {
      let malformedRejected = false;
      try {
        parseCapabilityCompositionSeed({ claimId: "CCO-001", pack: "capability-composition", schemaVersion: 1 });
      } catch {
        malformedRejected = true;
      }
      if (!malformedRejected) throw new Error("Malformed capability-composition seed was accepted");
      rows.push({ control: "malformed-seed", expectedFailure: "schema", rejected: malformedRejected });
      for (const control of capabilityCompositionRedControls("authoring")) {
        if (control.owner !== "authoring" || !isCapabilityCompositionScenario(control.scenario)) continue;
        const controlRoot = path.join(proofRoot, `control-${control.id}`);
        const project = setupScenario(controlRoot, control.scenario);
        createCompliantFixture(project, control.scenario);
        applyCapabilityCompositionAuthoringControl(project, control.id);
        const rejected = evaluateProject(project, control.scenario);
        if (rejected.pass || rejected.facts[control.expectedFailure] !== false) {
          throw new Error(`Capability-composition red control ${control.id} did not fail ${control.expectedFailure}`);
        }
        rows.push({ control: control.id, expectedFailure: control.expectedFailure, rejected: rejected.facts, scenario: control.scenario });
      }
    }
    writeJson(path.join(args.evidenceRoot, "identity.json"), {
      candidateId: args.candidateId,
      captureKind: args.captureKind,
      diff: diffIdentity(args.sourceRoot),
      instructionInventory: instructionInventory(args.sourceRoot),
      model: route.model,
      opencodeVersion: opencode.stdout.trim(),
      profile: args.profile,
      pack: args.pack,
      promptHashes: Object.fromEntries(args.scenarios.map((scenario) => [scenario, sha256(promptsFor(args.pack)[scenario] ?? "")])),
      prompts: promptsFor(args.pack),
      runner: "agent-tooling-ergonomics/1",
      sourceHashes: candidateSourceHashes(args.sourceRoot),
      sourceRoot: "<kit-root>",
      toolPolicy: toolPolicy(args.pack),
      variant: route.variant,
    });
    writeJson(path.join(args.evidenceRoot, "preflight.json"), {
      cleanup: "pending",
      modelCalls: 0,
      nativeArgumentBoundary: {
        exact: nativeArgumentProbe.stdout === nativeArgument,
        status: nativeArgumentProbe.status,
        stderr: nativeArgumentProbe.stderr,
      },
      rows,
      schemaVersion: 1,
      status: "complete",
    });
  } catch (error) {
    failure = safeError(error);
    throw error;
  } finally {
    try {
      fs.rmSync(proofRoot, { force: true, recursive: true });
    } catch (error) {
      cleanupError = safeError(error);
    }
    const preflightFile = path.join(args.evidenceRoot, "preflight.json");
    if (fs.existsSync(preflightFile)) {
      const current = readJson(preflightFile) as Record<string, unknown>;
      fs.rmSync(preflightFile);
      writeJson(preflightFile, {
        ...current,
        cleanup: cleanupError == null && !fs.existsSync(proofRoot) ? "removed" : "unknown",
        cleanupError,
        failure,
      });
    } else {
      writeJson(preflightFile, {
        cleanup: cleanupError == null && !fs.existsSync(proofRoot) ? "removed" : "unknown",
        cleanupError,
        failure,
        modelCalls: 0,
        rows,
        schemaVersion: 1,
        status: "blocked",
      });
    }
    writeManifest(args.evidenceRoot, "preflight");
    if (cleanupError != null || fs.existsSync(proofRoot)) throw new Error(`Preflight cleanup failed: ${cleanupError ?? "root exists"}`);
  }
  console.log(JSON.stringify({ cleanup: "removed", mode: "preflight", modelCalls: 0, scenarios: rows.length, status: "complete" }));
}

function captureScenario(args: Arguments, scenario: ScenarioId): ScenarioBundle {
  const kitRoot = repositoryRoot();
  const proofRoot = fs.mkdtempSync(path.join(os.tmpdir(), `agent-tooling-ergonomics-${scenario}-`));
  const loaded = loadModelProfile(kitRoot, args.profile);
  const route = loaded.profile.agent.build;
  const environment = proofEnvironment(kitRoot, args.sourceRoot, proofRoot, args.profile, args.pack);
  let bundle: ScenarioBundle | null = null;
  let cleanupError: string | null = null;
  let sessionIds: string[] = [];
  const sessionDeleteStatuses: Array<{ sessionID: string; status: number | null }> = [];
  let commandFailure: Error | null = null;
  try {
    const project = setupScenario(proofRoot, scenario);
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
      project,
      "--title",
      `tooling-ergonomics-${args.captureKind}-${scenario}`,
      promptsFor(args.pack)[scenario] ?? "",
    ];
    const started = Date.now();
    const result = runPortableCommand(kitRoot, argv, { capture: true, env: environment });
    const stdout = redactEvidence(result.stdout, kitRoot, proofRoot);
    const stderr = redactEvidence(result.stderr, kitRoot, proofRoot);
    const facts = parseEventFacts(stdout);
    const followUp = args.pack === "change-locality" && isChangeLocalityScenario(scenario)
      ? changeLocalityFollowUps()[scenario]
      : undefined;
    if (followUp != null && followUp.trim() !== "") {
      const followArgv = [...argv.slice(0, -1), followUp];
      const follow = runPortableCommand(kitRoot, followArgv, { capture: true, env: environment });
      const followFacts = parseEventFacts(redactEvidence(follow.stdout, kitRoot, proofRoot));
      facts.assistantText = `${facts.assistantText}\n${followFacts.assistantText}`;
      facts.eventCount += followFacts.eventCount;
      facts.sessionIds = [...new Set([...facts.sessionIds, ...followFacts.sessionIds])];
      facts.toolCalls.push(...followFacts.toolCalls);
    }
    facts.elapsedMs = Date.now() - started;
    sessionIds = facts.sessionIds;
    const filesBeforeOracle = fileManifest(project);
    const oracle = evaluateProject(project, scenario);
    bundle = {
      candidate: { id: args.candidateId, kind: args.captureKind, sourceHashes: candidateSourceHashes(args.sourceRoot) },
      cleanup: { error: null, removed: false, sessionDeleteStatuses: [] },
      command: {
        argv: argv.map((value) => redactEvidence(value, kitRoot, proofRoot)),
        status: result.status,
        stderr,
        stdout,
      },
      environment: {
        agent: "build",
        model: route.model,
        profile: args.profile,
        route: `${route.model}/${route.variant}`,
      toolPolicy: toolPolicy(args.pack),
        variant: route.variant,
      },
      facts,
      filesAfterOracle: fileManifest(project),
      filesBeforeOracle,
      input: { message: promptsFor(args.pack)[scenario] ?? "", promptSha256: sha256(promptsFor(args.pack)[scenario] ?? ""), scenario },
      oracle,
      schemaVersion: 1,
    };
    if (result.status !== 0) {
      commandFailure = new Error(`Scenario ${scenario} returned status ${result.status ?? "unknown"}`);
    }
  } finally {
    for (const sessionID of sessionIds) {
      const deletion = runPortableCommand(kitRoot, ["opencode", "session", "delete", sessionID, "--pure"], { capture: true, env: environment });
      sessionDeleteStatuses.push({ sessionID, status: deletion.status });
      if (deletion.status !== 0) cleanupError ??= `session deletion failed for ${sessionID}`;
    }
    try {
      fs.rmSync(proofRoot, { force: true, recursive: true });
    } catch (error) {
      cleanupError = safeError(error);
    }
  }
  if (bundle == null) throw new Error(`Scenario ${scenario} produced no bundle`);
  bundle.cleanup = { error: cleanupError, removed: !fs.existsSync(proofRoot), sessionDeleteStatuses };
  writeJson(path.join(args.evidenceRoot, `${scenario}.bundle.json`), bundle);
  if (cleanupError != null || fs.existsSync(proofRoot)) throw new Error(`Scenario ${scenario} cleanup is unknown: ${cleanupError ?? "root exists"}`);
  if (commandFailure != null) throw commandFailure;
  return bundle;
}

function capture(args: Arguments): void {
  createEvidenceRoot(args.evidenceRoot);
  const completed: ScenarioId[] = [];
  for (const scenario of args.scenarios) {
    captureScenario(args, scenario);
    completed.push(scenario);
  }
  writeJson(path.join(args.evidenceRoot, "capture.json"), {
    candidateId: args.candidateId,
    captureKind: args.captureKind,
    completed,
    profile: args.profile,
    schemaVersion: 1,
    sourceHashes: candidateSourceHashes(args.sourceRoot),
  });
  writeManifest(args.evidenceRoot, `capture-${args.captureKind}`);
  console.log(JSON.stringify({ candidateId: args.candidateId, cleanup: "removed", mode: "capture", scenarios: completed.length, status: "complete" }));
}

function readBundles(root: string, scenarios: ScenarioId[]): Map<ScenarioId, ScenarioBundle> {
  verifyManifest(root);
  const bundles = new Map<ScenarioId, ScenarioBundle>();
  for (const scenario of scenarios) {
    const file = path.join(root, `${scenario}.bundle.json`);
    if (fs.existsSync(file)) bundles.set(scenario, readJson(file) as ScenarioBundle);
  }
  return bundles;
}

function sourcePlacementControl(bundle: ScenarioBundle): { facts: Record<string, boolean>; pass: boolean } {
  const files = new Map(bundle.filesBeforeOracle.map((fact) => [fact.path, fact]));
  const preferred = files.has("tools/challenge-generator.mjs") ? "tools/challenge-generator.mjs" : null;
  let scripted: string | null = null;
  try {
    const packageContent = files.get("package.json")?.content;
    const packageJson = JSON.parse(packageContent ?? "") as { scripts?: Record<string, unknown> };
    const command = packageJson.scripts?.["generate:cases"];
    const match = typeof command === "string" ? /^node ([A-Za-z0-9._/-]+\.(?:cjs|js|mjs))$/.exec(command) : null;
    if (match != null && !match[1].split("/").includes("..") && files.has(match[1])) scripted = match[1];
  } catch {
    scripted = null;
  }
  const generator = preferred ?? scripted;
  const expectedCases = ["alpha", "beta", "gamma"].every((id) =>
    files.get(`target/cases/${id}.json`)?.content === `${JSON.stringify({ case: id })}\n`
  );
  const exactOneOff = files.get("config/one-off.json")?.content === `${JSON.stringify({ message: "ready" })}\n`;
  const noOneOffHelper = ![...files.keys()].some((relative) =>
    relative.startsWith("tools/") && relative.toLowerCase().includes("one-off")
  );
  const invocation = bundle.oracle.postCommands.some((command) => command.status === 0 && command.argv.join(" ") === `node ${generator}`) ||
    bundle.facts.toolCalls.some((call) => {
      if (call.name !== "bash" || call.status !== "completed" || call.input == null || typeof call.input !== "object") return false;
      const command = (call.input as Record<string, unknown>).command;
      return command === "npm run generate:cases" || command === `node ${generator}`;
    });
  const facts = {
    casesExact: expectedCases,
    generatorInvocationObserved: invocation,
    oneOffExact: exactOneOff,
    oneOffRemainsManual: noOneOffHelper,
    sourceMaintained: generator != null && !generator.startsWith("target/"),
  };
  return { facts, pass: Object.values(facts).every(Boolean) };
}

function recordedOracle(bundle: ScenarioBundle, scenario: ScenarioId): ScenarioOracle {
  if (scenario === "owner-local-extraction") {
    const files = new Map(bundle.filesBeforeOracle.map((fact) => [fact.path, fact]));
    const owner = files.get("src/app.mjs")?.content ?? "";
    const direct = bundle.oracle.postCommands.find((command) => command.argv.join(" ") === "node scripts/run-normalize.mjs");
    const parent = bundle.oracle.postCommands.find((command) => command.argv.join(" ") === "node src/app.mjs");
    const facts = {
      privateCapabilityExists: [...files.keys()].some((file) => /^src\/[^/]*normalize[^/]*\.mjs$/u.test(file)),
      ownerDelegates: /import\s+\{\s*normalize\s*\}\s+from\s+'\.\/[^']*normalize[^']*\.mjs'/u.test(owner),
      noDuplicateImplementation: !/\.trim\(\)\.toUpperCase\(\)/u.test(owner),
      directOutput: direct?.status === 0 && direct.stdout.trim() === "capability:ALPHA",
      parentOutput: parent?.status === 0 && parent.stdout.trim() === "parent:ALPHA",
      distinctOracles: direct != null && parent != null && direct.argv.join(" ") !== parent.argv.join(" "),
    };
    return { facts, pass: Object.values(facts).every(Boolean), postCommands: bundle.oracle.postCommands };
  }
  if (scenario !== "mechanical-artifact") return bundle.oracle;
  const artifact = mechanicalArtifactFacts(bundle.filesBeforeOracle);
  const before = bundle.filesBeforeOracle.find((fact) => fact.path === "data/artifacts.json")?.sha256 ?? null;
  const after = bundle.filesAfterOracle.find((fact) => fact.path === "data/artifacts.json")?.sha256 ?? null;
  const runsExitZero = bundle.oracle.postCommands.length === 2 && bundle.oracle.postCommands.every((command) => command.status === 0);
  const facts = {
    generatorExists: bundle.filesBeforeOracle.some((fact) => fact.path === "tools/materialize.mjs"),
    outputExact: artifact.outputExact,
    regenerationStable: runsExitZero && before != null && before === after,
    runsExitZero,
    seedExists: artifact.seedExists,
    seedSemanticOnly: artifact.seedSemanticOnly,
  };
  return { facts, pass: Object.values(facts).every(Boolean), postCommands: bundle.oracle.postCommands };
}

function evaluate(args: Arguments, mode: "evaluate" | "replay"): void {
  if (args.baselineRoot == null) throw new Error(`${mode} requires --baseline-root`);
  createEvidenceRoot(args.evidenceRoot);
  const baseline = readBundles(path.resolve(args.baselineRoot), args.scenarios);
  const candidate = args.candidateRoot == null ? null : readBundles(path.resolve(args.candidateRoot), args.scenarios);
  const rows = args.scenarios.map((scenario) => {
    const before = baseline.get(scenario) ?? null;
    const after = candidate?.get(scenario) ?? null;
    const beforeOracle = before == null ? null : recordedOracle(before, scenario);
    const afterOracle = after == null ? null : recordedOracle(after, scenario);
    const baselineExpectation = scenario === "source-placement"
      ? "control-pass"
      : isCapabilityCompositionScenario(scenario)
        ? capabilityCompositionBaselineExpectation(scenario)
        : "gap";
    const control = before == null || scenario !== "source-placement" ? null : sourcePlacementControl(before);
    const baselineExpectationMet = beforeOracle != null && (
      baselineExpectation === "gap"
        ? !beforeOracle.pass
        : baselineExpectation === "gap-or-pass"
          ? true
          : scenario === "source-placement"
            ? control?.pass === true
            : beforeOracle.pass
    );
    const pairMatches = before != null && after != null &&
      before.input.promptSha256 === after.input.promptSha256 &&
      before.environment.model === after.environment.model &&
      before.environment.profile === after.environment.profile &&
      before.environment.variant === after.environment.variant;
    return {
      baseline: before == null ? null : {
        control,
        cleanup: before.cleanup.removed,
        expectation: baselineExpectation,
        expectationMet: baselineExpectationMet,
        gapReproduced: baselineExpectation === "gap" && beforeOracle?.pass === false,
        oracle: beforeOracle,
        status: before.command.status,
      },
      candidate: after == null ? null : {
        cleanup: after.cleanup.removed,
        oracle: afterOracle,
        status: after.command.status,
      },
      pairMatches: after == null ? null : pairMatches,
      scenario,
    };
  });
  const baselineComplete = baseline.size === args.scenarios.length && rows.every((row) =>
    row.baseline?.cleanup === true && row.baseline.status === 0 && row.baseline.expectationMet === true
  );
  const candidateComplete = candidate == null ? null : candidate.size === args.scenarios.length && rows.every((row) =>
    row.candidate?.cleanup === true && row.candidate.status === 0 && row.candidate.oracle?.pass === true && row.pairMatches === true
  );
  const result = {
    baselineComplete,
    candidateComplete,
    mode,
    note: "Exact command, file, hash, placement, and cleanup facts only; no prose scoring or inferred intent.",
    rows,
    schemaVersion: 1,
  };
  writeJson(path.join(args.evidenceRoot, "evaluation.json"), result);
  writeManifest(args.evidenceRoot, mode);
  console.log(JSON.stringify({ baselineComplete, candidateComplete, mode, rows: rows.length }));
  if (!baselineComplete || candidateComplete === false) process.exitCode = 1;
}

function writeFailure(args: Arguments, error: unknown): void {
  if (args.evidenceRoot === "" || !fs.existsSync(args.evidenceRoot)) return;
  const manifest = path.join(args.evidenceRoot, "manifest.json");
  if (fs.existsSync(manifest)) return;
  const failure = path.join(args.evidenceRoot, "failure.json");
  if (!fs.existsSync(failure)) writeJson(failure, { error: safeError(error), schemaVersion: 1, status: "blocked" });
  writeManifest(args.evidenceRoot, args.mode ?? "unknown");
}

function main(): void {
  const args = argumentsFromCli();
  if (args.help) {
    console.log(usage());
    return;
  }
  try {
    if (args.mode === "preflight") preflight(args);
    else if (args.mode === "capture") capture(args);
    else if (args.mode === "evaluate") evaluate(args, "evaluate");
    else if (args.mode === "replay") evaluate(args, "replay");
    else throw new Error(usage());
  } catch (error) {
    writeFailure(args, error);
    throw error;
  }
}

main();
