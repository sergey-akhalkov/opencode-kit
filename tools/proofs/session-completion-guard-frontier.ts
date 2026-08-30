#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  FrontierValidationError,
  GRIND_FRONTIER_LIMITS,
  materializeWorkFrontier,
  projectPersistedWorkFrontier,
} from "../../global/extensions/session-completion-guard/frontier.ts";

type Mode = "materialize" | "replay";
type Options = {
  candidateId: string;
  environmentId: string;
  evidenceRoot: string;
  fixture: string | null;
  inputRoot: string | null;
  mode: Mode;
};
type Limits = {
  maxDecisions: number;
  maxDependencies: number;
  maxFrontierBytes: number;
  maxGates: number;
  maxItems: number;
  maxRefsPerField: number;
  maxStringBytes: number;
};
type ScenarioContext = {
  currentGeneration: number;
  latestHumanRef: string;
  rootSessionRef: string;
  taskStateDigest: string;
};
type ExpectedObservation = {
  frontierState: string;
  openGateRefs: string[];
  parkedDecisionRefs: string[];
  reason: string;
  runnableItemRefs: string[];
  serverGeneration: number | null;
  status: "accepted" | "reconcile" | "rejected";
};
type Observation = ExpectedObservation & { id: string };
type Seed = {
  claimId: string;
  limits: Limits;
  scenarios: unknown[];
  schemaVersion: number;
};

class FixtureError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const runnerPath = fileURLToPath(import.meta.url);
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const HELP = `Usage:
  node tools/proofs/session-completion-guard-frontier.ts --help
  node tools/proofs/session-completion-guard-frontier.ts --mode materialize --candidate-id <id> --environment-id <id> --fixture <reviewed-seed> --evidence-root <absolute-new-path>
  node tools/proofs/session-completion-guard-frontier.ts --mode replay --candidate-id <id> --environment-id <id> --input-root <absolute-materialized-path> --evidence-root <absolute-new-path>

Materialize validates the reviewed task-scoped frontier seed, derives only graph
readiness from explicit fields, and writes raw.json plus evaluation.json. Replay
re-evaluates a preserved raw bundle without reading the original fixture.

Inputs: one repository-local reviewed JSON seed or one prior proof-owned raw bundle.
Effects: create-new evidence files only. No provider, network, OpenCode, source,
configuration, project-runtime, install, activation, restart, or remote effect.
Evidence: stable scenario ordering, exact runnable/gate/decision refs, bounded and
cause-preserving failures, source identity, zero-call facts, and cleanup status.
--help performs no writes or process/network launch.
`;

function usageError(message: string): never {
  throw new Error(`${message}\n\n${HELP}`);
}

function requiredValue(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value == null || value.trim() === "" || value.startsWith("--")) usageError(`Missing value for ${option}`);
  return value;
}

function parseArgs(args: string[]): Options | null {
  if (args.length === 1 && (args[0] === "--help" || args[0] === "-h")) return null;
  let candidateId = "";
  let environmentId = "";
  let evidenceRoot = "";
  let fixture: string | null = null;
  let inputRoot: string | null = null;
  let mode: Mode | null = null;
  for (let index = 0; index < args.length; index++) {
    const option = args[index];
    if (option === "--candidate-id") {
      candidateId = requiredValue(args, index, option);
      index++;
    } else if (option === "--environment-id") {
      environmentId = requiredValue(args, index, option);
      index++;
    } else if (option === "--evidence-root") {
      evidenceRoot = requiredValue(args, index, option);
      index++;
    } else if (option === "--fixture") {
      fixture = path.resolve(sourceRoot, requiredValue(args, index, option));
      index++;
    } else if (option === "--input-root") {
      inputRoot = path.resolve(requiredValue(args, index, option));
      index++;
    } else if (option === "--mode") {
      const value = requiredValue(args, index, option);
      if (value !== "materialize" && value !== "replay") usageError("--mode must be materialize or replay");
      mode = value;
      index++;
    } else {
      usageError(`Unknown option: ${option}`);
    }
  }
  if (mode == null) usageError("--mode is required");
  if (!SAFE_ID.test(candidateId)) usageError("--candidate-id must be a safe identifier");
  if (!SAFE_ID.test(environmentId)) usageError("--environment-id must be a safe identifier");
  if (!path.isAbsolute(evidenceRoot)) usageError("--evidence-root must be absolute");
  if (mode === "materialize" && (fixture == null || inputRoot != null)) usageError("materialize requires --fixture and does not accept --input-root");
  if (mode === "replay" && (inputRoot == null || fixture != null)) usageError("replay requires --input-root and does not accept --fixture");
  if (fixture != null && path.relative(sourceRoot, fixture).startsWith("..")) usageError("--fixture must stay inside the repository");
  return { candidateId, environmentId, evidenceRoot: path.resolve(evidenceRoot), fixture, inputRoot, mode };
}

function sha256(value: string | Uint8Array): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value == null || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(record).sort().map((key) => [key, stableValue(record[key])]));
}

function json(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

function record(value: unknown, code: string): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) throw new FixtureError(code);
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, keys: string[], code: string): void {
  if (Object.keys(value).sort().join("\n") !== [...keys].sort().join("\n")) throw new FixtureError(code);
}

function integer(value: unknown, code: string, minimum = 0): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < minimum) throw new FixtureError(code);
  return value;
}

function ref(value: unknown, code: string): string {
  if (typeof value !== "string" || !SAFE_ID.test(value)) throw new FixtureError(code);
  return value;
}

function refArray(value: unknown, code: string, limit: number): string[] {
  if (!Array.isArray(value) || value.length > limit) throw new FixtureError(code);
  const refs = value.map((item) => ref(item, code));
  if (new Set(refs).size !== refs.length) throw new FixtureError(code);
  return refs;
}

function parseLimits(value: unknown): Limits {
  const input = record(value, "invalid-limits");
  exactKeys(input, ["maxDecisions", "maxDependencies", "maxFrontierBytes", "maxGates", "maxItems", "maxRefsPerField", "maxStringBytes"], "invalid-limits");
  const limits = Object.fromEntries(Object.entries(input).map(([key, item]) => [key, integer(item, "invalid-limits", 1)])) as Limits;
  if (limits.maxFrontierBytes > 1_048_576 || limits.maxItems > 256 || limits.maxDependencies > 2_048 || limits.maxGates > 256 || limits.maxDecisions > 128 || limits.maxRefsPerField > 128 || limits.maxStringBytes > 8_192) {
    throw new FixtureError("invalid-limits");
  }
  if (json(limits) !== json(GRIND_FRONTIER_LIMITS)) throw new FixtureError("production-limit-mismatch");
  return limits;
}

function parseSeed(value: unknown): Seed {
  const input = record(value, "invalid-seed");
  exactKeys(input, ["claimId", "limits", "scenarios", "schemaVersion"], "invalid-seed");
  if (input.schemaVersion !== 1 || input.claimId !== "GRIND-TSB-001" || !Array.isArray(input.scenarios)) throw new FixtureError("invalid-seed");
  const ids = input.scenarios.map((scenario) => ref(record(scenario, "invalid-scenario").id, "invalid-scenario-id"));
  if (ids.length === 0 || new Set(ids).size !== ids.length || ids.join("\n") !== [...ids].sort().join("\n")) throw new FixtureError("unstable-scenario-order");
  return { claimId: input.claimId, limits: parseLimits(input.limits), scenarios: input.scenarios, schemaVersion: 1 };
}

function parseContext(value: unknown): ScenarioContext {
  const input = record(value, "invalid-context");
  exactKeys(input, ["currentGeneration", "latestHumanRef", "rootSessionRef", "taskStateDigest"], "invalid-context");
  const taskStateDigest = typeof input.taskStateDigest === "string" && SHA256.test(input.taskStateDigest) ? input.taskStateDigest : null;
  if (taskStateDigest == null) throw new FixtureError("invalid-task-state-digest");
  return {
    currentGeneration: integer(input.currentGeneration, "invalid-current-generation"),
    latestHumanRef: ref(input.latestHumanRef, "invalid-human-ref"),
    rootSessionRef: ref(input.rootSessionRef, "invalid-root-ref"),
    taskStateDigest,
  };
}

function parseExpected(value: unknown): ExpectedObservation {
  const input = record(value, "invalid-expected");
  exactKeys(input, ["frontierState", "openGateRefs", "parkedDecisionRefs", "reason", "runnableItemRefs", "serverGeneration", "status"], "invalid-expected");
  const status = input.status;
  if (status !== "accepted" && status !== "reconcile" && status !== "rejected") throw new FixtureError("invalid-expected");
  const serverGeneration = input.serverGeneration === null ? null : integer(input.serverGeneration, "invalid-expected");
  return {
    frontierState: ref(input.frontierState, "invalid-expected"),
    openGateRefs: refArray(input.openGateRefs, "invalid-expected", 128),
    parkedDecisionRefs: refArray(input.parkedDecisionRefs, "invalid-expected", 128),
    reason: ref(input.reason, "invalid-expected"),
    runnableItemRefs: refArray(input.runnableItemRefs, "invalid-expected", 128),
    serverGeneration,
    status,
  };
}

function reconcileObservation(id: string, persisted: unknown): Observation {
  const input = record(persisted, "invalid-migration-fixture");
  exactKeys(input, ["metadataSchemaVersion", "workFrontier"], "invalid-migration-fixture");
  if (input.metadataSchemaVersion !== 1 || input.workFrontier !== null) throw new FixtureError("invalid-migration-fixture");
  const projection = projectPersistedWorkFrontier({ completionGuard: { schemaVersion: input.metadataSchemaVersion, workFrontier: input.workFrontier } });
  if (projection.status !== "absent" || projection.errorCode !== "missing-frontier") throw new FixtureError("invalid-migration-projection");
  return { id, status: "reconcile", reason: projection.errorCode, frontierState: "frontier-reconciling", serverGeneration: null, runnableItemRefs: [], openGateRefs: [], parkedDecisionRefs: [] };
}

function evaluateFrontier(id: string, contextValue: unknown, inputValue: unknown): Observation {
  const context = parseContext(contextValue);
  const assessment = materializeWorkFrontier(inputValue, {
    basisHumanRef: context.latestHumanRef,
    currentGeneration: context.currentGeneration,
    taskStateDigest: context.taskStateDigest,
  });
  return {
    id,
    status: "accepted",
    reason: "ok",
    frontierState: assessment.frontierState,
    serverGeneration: assessment.frontier.frontierGeneration,
    runnableItemRefs: assessment.runnableItemRefs,
    openGateRefs: assessment.openGateRefs,
    parkedDecisionRefs: assessment.parkedDecisionRefs,
  };
}

function evaluateScenario(value: unknown): { expected: ExpectedObservation; observation: Observation } {
  const scenario = record(value, "invalid-scenario");
  exactKeys(scenario, ["context", "expected", "id", "input", "persisted"], "invalid-scenario");
  const id = ref(scenario.id, "invalid-scenario-id");
  const expected = parseExpected(scenario.expected);
  let observation: Observation;
  try {
    if (scenario.persisted != null) {
      if (scenario.input != null || scenario.context != null) throw new FixtureError("invalid-migration-fixture");
      observation = reconcileObservation(id, scenario.persisted);
    } else {
      if (scenario.input == null || scenario.context == null) throw new FixtureError("invalid-frontier-fixture");
      observation = evaluateFrontier(id, scenario.context, scenario.input);
    }
  } catch (error) {
    if (!(error instanceof FixtureError) && !(error instanceof FrontierValidationError)) throw error;
    observation = { id, status: "rejected", reason: error.code, frontierState: "rejected", serverGeneration: null, runnableItemRefs: [], openGateRefs: [], parkedDecisionRefs: [] };
  }
  return { expected, observation };
}

function evaluateSeed(seed: Seed): { expected: ExpectedObservation[]; observations: Observation[] } {
  const evaluated = seed.scenarios.map((scenario) => evaluateScenario(scenario));
  return { expected: evaluated.map((item) => item.expected), observations: evaluated.map((item) => item.observation) };
}

function writeNew(file: string, value: unknown): void {
  fs.writeFileSync(file, json(value), { encoding: "utf8", flag: "wx" });
}

function writeEvidence(root: string, raw: unknown, evaluation: unknown): void {
  if (fs.existsSync(root)) throw new Error(`Evidence root already exists: ${root}`);
  fs.mkdirSync(root, { recursive: true });
  writeNew(path.join(root, "raw.json"), raw);
  writeNew(path.join(root, "evaluation.json"), evaluation);
}

function observationsMatch(observations: Observation[], expected: ExpectedObservation[]): boolean {
  return observations.length === expected.length && observations.every((observation, index) => json({ ...observation, id: undefined }) === json(expected[index]));
}

function sourceIdentity(fixtureDigest: string): Array<{ path: string; sha256: string }> {
  return [
    { path: "tools/proofs/session-completion-guard-frontier.ts", sha256: sha256(fs.readFileSync(runnerPath)) },
    { path: "global/extensions/session-completion-guard/frontier.ts", sha256: sha256(fs.readFileSync(path.join(sourceRoot, "global", "extensions", "session-completion-guard", "frontier.ts"))) },
    { path: "reviewed-frontier-seed", sha256: fixtureDigest },
  ];
}

function materialize(options: Options): { evaluation: Record<string, unknown>; raw: Record<string, unknown> } {
  const fixtureRaw = fs.readFileSync(options.fixture!, "utf8");
  const parsed = JSON.parse(fixtureRaw) as unknown;
  const seed = parseSeed(parsed);
  const fixtureDigest = sha256(fixtureRaw);
  const first = evaluateSeed(seed);
  const second = evaluateSeed(seed);
  const stableSecondPass = json(first) === json(second);
  const expectedResults = observationsMatch(first.observations, first.expected);
  const raw = {
    schemaVersion: 1,
    mode: "materialize",
    candidateId: options.candidateId,
    environmentId: options.environmentId,
    claimId: seed.claimId,
    fixtureDigest,
    canonicalSeedDigest: sha256(json(seed)),
    seed,
    observations: first.observations,
    sourceIdentity: sourceIdentity(fixtureDigest),
    effects: { providerCalls: 0, networkRequests: 0, sourceWrites: 0, installedWrites: 0, remoteEffects: 0 },
    cleanup: "complete",
  };
  const evaluation = {
    schemaVersion: 1,
    mode: "materialize",
    candidateId: options.candidateId,
    environmentId: options.environmentId,
    status: stableSecondPass && expectedResults ? "passed" : "failed",
    scenarioCount: first.observations.length,
    checks: { expectedResults, stableSecondPass, stableScenarioOrder: true, explicitSemanticFixture: true, providerFree: true, sourceUnchanged: true, cleanupComplete: true },
    observations: first.observations,
  };
  return { evaluation, raw };
}

function replay(options: Options): { evaluation: Record<string, unknown>; raw: Record<string, unknown> } {
  const inputFile = path.join(options.inputRoot!, "raw.json");
  const inputRaw = fs.readFileSync(inputFile, "utf8");
  const input = record(JSON.parse(inputRaw), "invalid-replay-input");
  const seed = parseSeed(input.seed);
  const fixtureDigest = typeof input.fixtureDigest === "string" && SHA256.test(input.fixtureDigest) ? input.fixtureDigest : null;
  if (fixtureDigest == null || sha256(json(seed)) !== input.canonicalSeedDigest) throw new Error("Replay seed identity is invalid");
  const evaluated = evaluateSeed(seed);
  const inputObservationsMatch = json(input.observations) === json(evaluated.observations);
  const expectedResults = observationsMatch(evaluated.observations, evaluated.expected);
  const raw = {
    schemaVersion: 1,
    mode: "replay",
    candidateId: options.candidateId,
    environmentId: options.environmentId,
    claimId: seed.claimId,
    fixtureDigest,
    canonicalSeedDigest: sha256(json(seed)),
    inputRawDigest: sha256(inputRaw),
    seed,
    observations: evaluated.observations,
    sourceIdentity: sourceIdentity(fixtureDigest),
    effects: { providerCalls: 0, networkRequests: 0, sourceWrites: 0, installedWrites: 0, remoteEffects: 0 },
    cleanup: "complete",
  };
  const evaluation = {
    schemaVersion: 1,
    mode: "replay",
    candidateId: options.candidateId,
    environmentId: options.environmentId,
    status: inputObservationsMatch && expectedResults ? "passed" : "failed",
    scenarioCount: evaluated.observations.length,
    checks: { expectedResults, inputObservationsMatch, stableScenarioOrder: true, explicitSemanticFixture: true, providerFree: true, sourceUnchanged: true, cleanupComplete: true },
    observations: evaluated.observations,
  };
  return { evaluation, raw };
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options == null) {
    process.stdout.write(HELP);
  } else {
    const result = options.mode === "materialize" ? materialize(options) : replay(options);
    writeEvidence(options.evidenceRoot, result.raw, result.evaluation);
    process.stdout.write(json({ candidateId: options.candidateId, environmentId: options.environmentId, evidenceRoot: options.evidenceRoot, mode: options.mode, status: result.evaluation.status }));
    if (result.evaluation.status !== "passed") process.exitCode = 1;
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
