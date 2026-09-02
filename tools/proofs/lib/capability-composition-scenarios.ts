import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runPortableCommand } from "../../../global/bin/portable-process.ts";

export type CapabilityCompositionScenarioId =
  | "owner-local-extraction"
  | "cohesive-direct"
  | "mixed-owner-non-expansion"
  | "delegated-boundary-preservation"
  | "leaf-module-independence"
  | "duplicate-sibling-rejection"
  | "wrapper-only-rejection"
  | "integration-only";

export type CapabilityCompositionReuseScenarioId =
  | "verified-current-capability"
  | "established-verified-fit"
  | "popular-contract-mismatch"
  | "ecosystem-unavailable";

export type CapabilityCompositionObservation = {
  contractFit: "verified" | "mismatch" | "unknown";
  crossProject: "verified" | "degraded" | "not-applicable";
  disposition: "reuse" | "extend" | "build-minimal";
  popularityOnly: "yes" | "no";
  selectedCandidate: string;
  totalCost: "lower" | "higher" | "unknown";
};

export type CapabilityCompositionOracle = {
  facts: Record<string, boolean | number | string | null>;
  pass: boolean;
  postCommands: Array<{ argv: string[]; status: number | null; stderr: string; stdout: string }>;
};

type AuthoringScenario = {
  baselineExpectation: "gap-or-pass" | "control-pass";
  class: string;
  id: CapabilityCompositionScenarioId;
  prompt: string;
  requiredFacts: string[];
};

type ReuseScenario = {
  acceptedPopularityOnly: Array<CapabilityCompositionObservation["popularityOnly"]>;
  class: string;
  expectedObservation: CapabilityCompositionObservation;
  id: CapabilityCompositionReuseScenarioId;
  prompt: string;
};

export type CapabilityCompositionRedControl = {
  expectedFailure: string;
  id: "malformed-seed" | "duplicate-owner" | "component-as-parent" | "wrapper-only" | "popularity-only";
  owner: "shared" | "authoring" | "reuse";
  scenario: CapabilityCompositionScenarioId | CapabilityCompositionReuseScenarioId | "none";
};

export type CapabilityCompositionSeed = {
  authoringScenarios: AuthoringScenario[];
  claimId: "CCO-001";
  pack: "capability-composition";
  redControls: CapabilityCompositionRedControl[];
  reuseScenarios: ReuseScenario[];
  schemaVersion: 1;
};

const AUTHORING_IDS: readonly CapabilityCompositionScenarioId[] = [
  "owner-local-extraction",
  "cohesive-direct",
  "mixed-owner-non-expansion",
  "delegated-boundary-preservation",
  "leaf-module-independence",
  "duplicate-sibling-rejection",
  "wrapper-only-rejection",
  "integration-only",
];

const REUSE_IDS: readonly CapabilityCompositionReuseScenarioId[] = [
  "verified-current-capability",
  "established-verified-fit",
  "popular-contract-mismatch",
  "ecosystem-unavailable",
];

const RED_CONTROL_IDS = ["malformed-seed", "duplicate-owner", "component-as-parent", "wrapper-only", "popularity-only"] as const;
const SEED_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../fixtures/capability-composition/scenarios.json");

function record(value: unknown, label: string): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  return value as Record<string, unknown>;
}

function exactIds(actual: unknown, expected: readonly string[], label: string): void {
  if (!Array.isArray(actual)) throw new Error(`${label} must be an array.`);
  const ids = actual.map((row, index) => String(record(row, `${label}[${index}]`).id ?? ""));
  if (JSON.stringify(ids) !== JSON.stringify(expected)) throw new Error(`${label} must preserve the reviewed stable id order.`);
}

function observation(value: unknown, label: string): CapabilityCompositionObservation {
  const row = record(value, label);
  const parsed = {
    contractFit: row.contractFit,
    crossProject: row.crossProject,
    disposition: row.disposition,
    popularityOnly: row.popularityOnly,
    selectedCandidate: row.selectedCandidate,
    totalCost: row.totalCost,
  };
  if (!(["verified", "mismatch", "unknown"] as unknown[]).includes(parsed.contractFit)) throw new Error(`${label}.contractFit is invalid.`);
  if (!(["verified", "degraded", "not-applicable"] as unknown[]).includes(parsed.crossProject)) throw new Error(`${label}.crossProject is invalid.`);
  if (!(["reuse", "extend", "build-minimal"] as unknown[]).includes(parsed.disposition)) throw new Error(`${label}.disposition is invalid.`);
  if (!(["yes", "no"] as unknown[]).includes(parsed.popularityOnly)) throw new Error(`${label}.popularityOnly is invalid.`);
  if (typeof parsed.selectedCandidate !== "string" || parsed.selectedCandidate.trim() === "") throw new Error(`${label}.selectedCandidate is invalid.`);
  if (!(["lower", "higher", "unknown"] as unknown[]).includes(parsed.totalCost)) throw new Error(`${label}.totalCost is invalid.`);
  return parsed as CapabilityCompositionObservation;
}

export function parseCapabilityCompositionSeed(value: unknown): CapabilityCompositionSeed {
  const seed = record(value, "Capability-composition seed");
  if (seed.schemaVersion !== 1 || seed.pack !== "capability-composition" || seed.claimId !== "CCO-001") {
    throw new Error("Capability-composition seed identity is invalid.");
  }
  exactIds(seed.authoringScenarios, AUTHORING_IDS, "authoringScenarios");
  exactIds(seed.reuseScenarios, REUSE_IDS, "reuseScenarios");
  exactIds(seed.redControls, RED_CONTROL_IDS, "redControls");
  for (const [index, raw] of (seed.authoringScenarios as unknown[]).entries()) {
    const row = record(raw, `authoringScenarios[${index}]`);
    if (typeof row.prompt !== "string" || row.prompt.trim() === "") throw new Error(`authoringScenarios[${index}].prompt is invalid.`);
    if (row.baselineExpectation !== "gap-or-pass" && row.baselineExpectation !== "control-pass") throw new Error(`authoringScenarios[${index}].baselineExpectation is invalid.`);
    if (!Array.isArray(row.requiredFacts) || row.requiredFacts.length === 0 || row.requiredFacts.some((fact) => typeof fact !== "string" || fact.trim() === "")) {
      throw new Error(`authoringScenarios[${index}].requiredFacts is invalid.`);
    }
  }
  for (const [index, raw] of (seed.reuseScenarios as unknown[]).entries()) {
    const row = record(raw, `reuseScenarios[${index}]`);
    if (typeof row.prompt !== "string" || row.prompt.trim() === "") throw new Error(`reuseScenarios[${index}].prompt is invalid.`);
    if (!Array.isArray(row.acceptedPopularityOnly)
      || row.acceptedPopularityOnly.length === 0
      || new Set(row.acceptedPopularityOnly).size !== row.acceptedPopularityOnly.length
      || row.acceptedPopularityOnly.some((value) => value !== "yes" && value !== "no")) {
      throw new Error(`reuseScenarios[${index}].acceptedPopularityOnly is invalid.`);
    }
    observation(row.expectedObservation, `reuseScenarios[${index}].expectedObservation`);
  }
  return seed as CapabilityCompositionSeed;
}

export function loadCapabilityCompositionSeed(): CapabilityCompositionSeed {
  return parseCapabilityCompositionSeed(JSON.parse(fs.readFileSync(SEED_PATH, "utf8")) as unknown);
}

export function capabilityCompositionScenarioIds(): CapabilityCompositionScenarioId[] {
  return loadCapabilityCompositionSeed().authoringScenarios.map((row) => row.id);
}

export function isCapabilityCompositionScenario(value: string): value is CapabilityCompositionScenarioId {
  return capabilityCompositionScenarioIds().includes(value as CapabilityCompositionScenarioId);
}

export function capabilityCompositionBaselineExpectation(
  scenario: CapabilityCompositionScenarioId,
): AuthoringScenario["baselineExpectation"] {
  const row = loadCapabilityCompositionSeed().authoringScenarios.find((candidate) => candidate.id === scenario);
  if (row == null) throw new Error(`Unknown capability-composition authoring scenario: ${scenario}`);
  return row.baselineExpectation;
}

export function capabilityCompositionPrompts(): Record<CapabilityCompositionScenarioId, string> {
  return Object.fromEntries(loadCapabilityCompositionSeed().authoringScenarios.map((row) => [row.id, row.prompt])) as Record<CapabilityCompositionScenarioId, string>;
}

export function capabilityCompositionReuseScenarioIds(): CapabilityCompositionReuseScenarioId[] {
  return loadCapabilityCompositionSeed().reuseScenarios.map((row) => row.id);
}

export function isCapabilityCompositionReuseScenario(value: string): value is CapabilityCompositionReuseScenarioId {
  return capabilityCompositionReuseScenarioIds().includes(value as CapabilityCompositionReuseScenarioId);
}

export function capabilityCompositionReusePrompts(): Record<CapabilityCompositionReuseScenarioId, string> {
  return Object.fromEntries(loadCapabilityCompositionSeed().reuseScenarios.map((row) => [row.id, row.prompt])) as Record<CapabilityCompositionReuseScenarioId, string>;
}

export function capabilityCompositionRedControls(owner?: CapabilityCompositionRedControl["owner"]): CapabilityCompositionRedControl[] {
  return loadCapabilityCompositionSeed().redControls.filter((row) => owner == null || row.owner === owner || row.owner === "shared");
}

function writeText(file: string, value: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value, "utf8");
}

function writeJson(file: string, value: unknown): void {
  writeText(file, `${JSON.stringify(value, null, 2)}\n`);
}

function runNode(project: string, ...args: string[]): { argv: string[]; status: number | null; stderr: string; stdout: string } {
  const result = runPortableCommand(project, [process.execPath, ...args], { capture: true });
  return { argv: ["node", ...args], status: result.status, stderr: result.stderr, stdout: result.stdout };
}

function sourceFiles(project: string): string[] {
  if (!fs.existsSync(project)) return [];
  return fs.readdirSync(project, { recursive: true })
    .map(String)
    .map((value) => value.replaceAll("\\", "/"))
    .filter((value) => /\.(?:c?js|mjs|ts)$/u.test(value))
    .sort();
}

function text(file: string): string {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

export function setupCapabilityCompositionScenario(project: string, scenario: CapabilityCompositionScenarioId): void {
  writeJson(path.join(project, "package.json"), { name: `cco-${scenario}`, private: true, type: "module" });
  if (scenario === "owner-local-extraction") writeText(path.join(project, "src", "app.mjs"), "console.log('parent:raw');\n");
  else if (scenario === "cohesive-direct") writeText(path.join(project, "src", "greet.mjs"), "console.log('Hello');\n");
  else if (scenario === "mixed-owner-non-expansion") writeText(path.join(project, "src", "mixed.mjs"), "console.log('hello'); console.log('name');\n");
  else if (scenario === "delegated-boundary-preservation") writeText(path.join(project, "src", "owner.mjs"), "console.log('parent:missing');\n");
  else if (scenario === "leaf-module-independence") writeText(path.join(project, "tasks.md"), "- leaf-a: text\n- leaf-b: json\n- parent: report\n");
  else if (scenario === "duplicate-sibling-rejection") writeText(path.join(project, "src", "status.mjs"), "console.log('OK');\n");
  else if (scenario === "wrapper-only-rejection") writeText(path.join(project, "src", "value.mjs"), "console.log('value:missing');\n");
  else writeText(path.join(project, "src", "app.mjs"), "console.log('integrated:missing');\n");
}

export function createCompliantCapabilityCompositionFixture(project: string, scenario: CapabilityCompositionScenarioId): void {
  if (scenario === "owner-local-extraction") {
    writeText(path.join(project, "src", "normalize.mjs"), "export function normalize(value) { return value.trim().toUpperCase(); }\n");
    writeText(path.join(project, "scripts", "run-normalize.mjs"), "import { normalize } from '../src/normalize.mjs';\nconsole.log(`capability:${normalize(' alpha ')}`);\n");
    writeText(path.join(project, "src", "app.mjs"), "import { normalize } from './normalize.mjs';\nconsole.log(`parent:${normalize(' alpha ')}`);\n");
  } else if (scenario === "cohesive-direct") {
    writeText(path.join(project, "src", "greet.mjs"), "const name = process.argv[2] ?? '';\nconsole.log(`Hello, ${name}`);\n");
  } else if (scenario === "mixed-owner-non-expansion") {
    fs.rmSync(path.join(project, "src", "mixed.mjs"), { force: true });
    writeText(path.join(project, "src", "greet.mjs"), "console.log('hello');\n");
    writeText(path.join(project, "src", "report.mjs"), "console.log('name status');\n");
  } else if (scenario === "delegated-boundary-preservation") {
    writeText(path.join(project, "src", "capability.mjs"), "import { pathToFileURL } from 'node:url';\nexport function capability() { return 'ready'; }\nif (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) console.log(`capability:${capability()}`);\n");
    writeText(path.join(project, "src", "owner.mjs"), "import { capability } from './capability.mjs';\nconsole.log(`parent:${capability()}`);\n");
    writeText(path.join(project, "brief.md"), "Semantic owner: src/owner.mjs\nPrivate capability: src/capability.mjs\nWorker write scope: src/capability.mjs, src/owner.mjs\nForbidden: public API or sibling owner.\n");
  } else if (scenario === "leaf-module-independence") {
    writeText(path.join(project, "src", "format.mjs"), "export function format(kind) { return kind === 'json' ? 'json:{\"status\":\"ok\"}' : 'text:ok'; }\n");
    writeText(path.join(project, "scripts", "run-format.mjs"), "import { format } from '../src/format.mjs';\nconsole.log(format(process.argv[2] ?? 'text'));\n");
    writeText(path.join(project, "src", "report.mjs"), "import { format } from './format.mjs';\nconsole.log(`parent:${format('text')}`);\n");
  } else if (scenario === "duplicate-sibling-rejection") {
    writeText(path.join(project, "src", "status.mjs"), "const code = process.argv[2] ?? 'ok';\nconsole.log(code === 'error' ? 'ERROR' : 'OK');\n");
  } else if (scenario === "wrapper-only-rejection") {
    writeText(path.join(project, "src", "value.mjs"), "console.log('value:ready');\n");
  } else {
    writeText(path.join(project, "src", "app.mjs"), "console.log('integrated:ready');\n");
  }
}

export function applyCapabilityCompositionAuthoringControl(project: string, control: CapabilityCompositionRedControl["id"]): void {
  if (control === "duplicate-owner") {
    writeText(path.join(project, "src", "app.mjs"), "import { normalize } from './normalize.mjs';\nconst input = ' alpha ';\nconst duplicated = input.trim().toUpperCase();\nconsole.log(`parent:${normalize(input) || duplicated}`);\n");
  } else if (control === "component-as-parent") {
    writeText(path.join(project, "src", "app.mjs"), "console.log('parent:missing');\n");
  } else if (control === "wrapper-only") {
    writeText(path.join(project, "src", "value-wrapper.mjs"), "import './value.mjs';\n");
  } else {
    throw new Error(`Unsupported authoring red control: ${control}`);
  }
}

export function evaluateCapabilityCompositionScenario(project: string, scenario: CapabilityCompositionScenarioId): CapabilityCompositionOracle {
  const commands: CapabilityCompositionOracle["postCommands"] = [];
  const files = sourceFiles(project);
  const facts: Record<string, boolean | number | string | null> = {};
  if (scenario === "owner-local-extraction") {
    const direct = runNode(project, "scripts/run-normalize.mjs");
    const parent = runNode(project, "src/app.mjs");
    commands.push(direct, parent);
    const owner = text(path.join(project, "src", "app.mjs"));
    facts.privateCapabilityExists = files.some((file) => /^src\/[^/]*normalize[^/]*\.mjs$/u.test(file));
    facts.ownerDelegates = /import\s+\{\s*normalize\s*\}\s+from\s+'\.\/[^']*normalize[^']*\.mjs'/u.test(owner);
    facts.noDuplicateImplementation = !/\.trim\(\)\.toUpperCase\(\)/u.test(owner);
    facts.directOutput = direct.status === 0 && direct.stdout.trim() === "capability:ALPHA";
    facts.parentOutput = parent.status === 0 && parent.stdout.trim() === "parent:ALPHA";
    facts.distinctOracles = direct.argv.join(" ") !== parent.argv.join(" ");
  } else if (scenario === "cohesive-direct") {
    const run = runNode(project, "src/greet.mjs", "Ada");
    commands.push(run);
    facts.outputCorrect = run.status === 0 && run.stdout.trim() === "Hello, Ada";
    facts.singleImplementationFile = files.filter((file) => file.startsWith("src/")).length === 1;
    facts.noSpeculativeSurface = !files.some((file) => /wrapper|interface|factory|plugin/u.test(file));
  } else if (scenario === "mixed-owner-non-expansion") {
    const greet = runNode(project, "src/greet.mjs");
    const report = runNode(project, "src/report.mjs");
    commands.push(greet, report);
    facts.greetingWorks = greet.status === 0 && greet.stdout.trim() === "hello";
    facts.reportWorks = report.status === 0 && report.stdout.trim() === "name status";
    facts.mixedOwnerRemoved = !files.includes("src/mixed.mjs");
    facts.separateCurrentOwners = files.includes("src/greet.mjs") && files.includes("src/report.mjs");
  } else if (scenario === "delegated-boundary-preservation") {
    const direct = runNode(project, "src/capability.mjs");
    const parent = runNode(project, "src/owner.mjs");
    commands.push(direct, parent);
    const owner = text(path.join(project, "src", "owner.mjs"));
    const brief = text(path.join(project, "brief.md"));
    facts.capabilityOutput = direct.status === 0 && direct.stdout.trim() === "capability:ready";
    facts.parentOutput = parent.status === 0 && parent.stdout.trim() === "parent:ready";
    facts.ownerDelegates = owner.includes("from './capability.mjs'");
    facts.briefPreservesBoundary = /semantic owner/iu.test(brief)
      && /private capability/iu.test(brief)
      && /(?:write scope|writable)/iu.test(brief)
      && brief.includes("src/owner.mjs")
      && brief.includes("src/capability.mjs");
    facts.noPublicSibling = /public API/iu.test(brief) && /sibling owner/iu.test(brief);
  } else if (scenario === "leaf-module-independence") {
    const textRun = runNode(project, "scripts/run-format.mjs", "text");
    const jsonRun = runNode(project, "scripts/run-format.mjs", "json");
    const parent = runNode(project, "src/report.mjs");
    commands.push(textRun, jsonRun, parent);
    facts.textLeafWorks = textRun.status === 0 && textRun.stdout.trim() === "text:ok";
    facts.jsonLeafWorks = jsonRun.status === 0 && jsonRun.stdout.trim() === "json:{\"status\":\"ok\"}";
    facts.parentWorks = parent.status === 0 && parent.stdout.trim() === "parent:text:ok";
    facts.sharedCapability = files.includes("src/format.mjs");
    facts.noTaskShapedModules = !files.some((file) => /leaf-[ab]|task-/u.test(file));
  } else if (scenario === "duplicate-sibling-rejection") {
    const ok = runNode(project, "src/status.mjs", "ok");
    const error = runNode(project, "src/status.mjs", "error");
    commands.push(ok, error);
    facts.okStatus = ok.status === 0 && ok.stdout.trim() === "OK";
    facts.errorStatus = error.status === 0 && error.stdout.trim() === "ERROR";
    facts.singleStatusOwner = files.filter((file) => /status/u.test(file)).length === 1;
    facts.noDuplicateSibling = !files.includes("src/error-status.mjs");
  } else if (scenario === "wrapper-only-rejection") {
    const run = runNode(project, "src/value.mjs");
    commands.push(run);
    facts.valueOutput = run.status === 0 && run.stdout.trim() === "value:ready";
    facts.singleValueOwner = files.filter((file) => /value/u.test(file)).length === 1;
    facts.noWrapperOnly = !files.some((file) => /wrapper/u.test(file));
  } else {
    const run = runNode(project, "src/app.mjs");
    commands.push(run);
    facts.parentOutput = run.status === 0 && run.stdout.trim() === "integrated:ready";
    facts.singleIntegrationOwner = files.filter((file) => file.startsWith("src/")).length === 1;
    facts.noFakeComponentOracle = !files.some((file) => /capability|component|wrapper/u.test(file));
  }
  const required = loadCapabilityCompositionSeed().authoringScenarios.find((row) => row.id === scenario)?.requiredFacts ?? [];
  return { facts, pass: required.length > 0 && required.every((fact) => facts[fact] === true), postCommands: commands };
}

export function setupCapabilityCompositionReuseScenario(project: string, scenario: CapabilityCompositionReuseScenarioId): void {
  writeJson(path.join(project, "package.json"), { name: `cco-reuse-${scenario}`, private: true, type: "module" });
  writeText(path.join(project, "task.md"), `${capabilityCompositionReusePrompts()[scenario]}\n`);
  if (scenario === "verified-current-capability") {
    writeText(path.join(project, "src", "current-normalizer.ts"), "export function normalize(value: string): string { return value.trim().toUpperCase(); }\n");
    writeJson(path.join(project, "evidence", "candidates.json"), [{ id: "current-normalizer", sourceVerified: true, contractFit: "verified", effects: "none", totalCost: "lower" }]);
  } else if (scenario === "established-verified-fit") {
    writeText(path.join(project, "candidates", "maintained-parser", "source.ts"), "export function parse(value: string): unknown { return JSON.parse(value); }\n");
    writeJson(path.join(project, "evidence", "candidates.json"), [{ id: "maintained-parser", sourceVerified: true, provenance: "reviewed", maintained: true, adoption: "established", licenseSecurity: "compatible", contractFit: "verified", totalCost: "lower" }]);
  } else if (scenario === "popular-contract-mismatch") {
    writeText(path.join(project, "candidates", "popular-parser", "source.ts"), "export function parse(value: string): unknown { try { return JSON.parse(value); } catch { return null; } }\n");
    writeJson(path.join(project, "evidence", "candidates.json"), [{ id: "popular-parser", sourceVerified: true, adoption: "very-high", errorContract: "returns-null", requiredErrorContract: "throws-coded-error", contractFit: "mismatch", totalCost: "higher" }, { id: "local-minimal", contractFit: "current-build", totalCost: "lower" }]);
  } else {
    writeJson(path.join(project, "evidence", "candidates.json"), [{ id: "local-minimal", contractFit: "unknown-until-built", totalCost: "lower" }]);
    writeJson(path.join(project, "evidence", "research-status.json"), { publicEcosystem: "unavailable", crossProject: "degraded", universalClaimAllowed: false });
  }
}

export function expectedCapabilityCompositionReuseObservation(scenario: CapabilityCompositionReuseScenarioId): CapabilityCompositionObservation {
  const row = loadCapabilityCompositionSeed().reuseScenarios.find((candidate) => candidate.id === scenario);
  if (row == null) throw new Error(`Unknown capability-composition reuse scenario: ${scenario}`);
  return { ...row.expectedObservation };
}

export function parseCapabilityCompositionObservation(textValue: string): CapabilityCompositionObservation | null {
  const field = (label: string): string | null => {
    const match = new RegExp(`(?:^|[\\r\\n.!?])\\s*${label}:\\s*(\\S(?:[^\\r\\n]*\\S)?)\\s*$`, "imu").exec(textValue);
    return match?.[1]?.trim() ?? null;
  };
  const parsed = {
    contractFit: field("Contract fit"),
    crossProject: field("Cross-project"),
    disposition: field("Disposition"),
    popularityOnly: field("Popularity only"),
    selectedCandidate: field("Selected candidate"),
    totalCost: field("Total cost"),
  };
  try {
    return observation(parsed, "Assistant observation");
  } catch {
    return null;
  }
}

export function evaluateCapabilityCompositionReuseObservation(
  scenario: CapabilityCompositionReuseScenarioId,
  actual: CapabilityCompositionObservation | null,
): { facts: Record<string, boolean | string | null>; pass: boolean } {
  const row = loadCapabilityCompositionSeed().reuseScenarios.find((candidate) => candidate.id === scenario);
  if (row == null) throw new Error(`Unknown capability-composition reuse scenario: ${scenario}`);
  const expected = row.expectedObservation;
  const popularityLabelAccepted = actual != null && row.acceptedPopularityOnly.includes(actual.popularityOnly);
  const matchesReviewedObservation = actual != null
    && actual.disposition === expected.disposition
    && actual.selectedCandidate === expected.selectedCandidate
    && actual.contractFit === expected.contractFit
    && actual.totalCost === expected.totalCost
    && popularityLabelAccepted
    && actual.crossProject === expected.crossProject;
  const noPopularityOnlySelection = actual != null
    && popularityLabelAccepted
    && actual.disposition === expected.disposition
    && actual.selectedCandidate === expected.selectedCandidate;
  const facts = {
    contractFit: actual?.contractFit ?? null,
    crossProject: actual?.crossProject ?? null,
    disposition: actual?.disposition ?? null,
    matchesReviewedObservation,
    noPopularityOnlySelection,
    popularityLabelAccepted,
    selectedCandidate: actual?.selectedCandidate ?? null,
    totalCost: actual?.totalCost ?? null,
  };
  return { facts, pass: facts.matchesReviewedObservation && facts.noPopularityOnlySelection };
}

export function applyCapabilityCompositionReuseControl(
  scenario: CapabilityCompositionReuseScenarioId,
  control: CapabilityCompositionRedControl["id"],
): CapabilityCompositionObservation {
  const current = expectedCapabilityCompositionReuseObservation(scenario);
  if (control !== "popularity-only") throw new Error(`Unsupported reuse red control: ${control}`);
  return { ...current, disposition: "reuse", selectedCandidate: "popular-parser", popularityOnly: "yes" };
}
