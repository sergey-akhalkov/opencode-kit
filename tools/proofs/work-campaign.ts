#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PORTABLE_WORKFLOW_RUNTIME_FILES } from "../runtime-surface-profile.ts";
import { WORK_CAMPAIGN_CONTROLLER_SOURCE_PATHS } from "./work-campaign-source-paths.ts";

type JsonRecord = Record<string, unknown>;

type Options = {
  candidateId: string;
  environmentId: string | null;
  evidenceRoot: string;
  fixturePath: string;
  help: boolean;
  hostInputRoot: string | null;
  inputRoot: string | null;
  mode: "controller" | "materializer" | "population" | "preflight" | "replay" | "state" | "windows";
};

type ScenarioResult = {
  checks: Record<string, boolean>;
  expected: { failedCheck: string | null; status: "blocked" | "complete" };
  failedChecks: string[];
  id: string;
  record: JsonRecord;
  status: "blocked" | "complete";
};

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const defaultFixturePath = path.join(
  sourceRoot,
  "tools",
  "proofs",
  "fixtures",
  "consumer-outcome",
  "work-campaign-v1",
  "seeds.json",
);
const runnerPath = fileURLToPath(import.meta.url);
const windowsSourcePaths = [
  ...PORTABLE_WORKFLOW_RUNTIME_FILES.map((relative) => `global/${relative}`),
  "tools/runtime-surface-profile.ts",
  "tools/proofs/work-campaign-windows-installed.ts",
  "tools/test-work-campaign-controller.ts",
  "tools/windows/opencode-workstation-layout.ts",
  "tools/windows/opencode-workstation.ts",
  "tools/windows/work-campaign-supervisor-host.ts",
  "tools/windows/work-campaign-supervisor-install.ts",
  "tools/windows/work-campaign-supervisor.ts",
  "tools/test-work-campaign-windows.ts",
  "tools/proofs/work-campaign.ts",
].filter((value, index, rows) => rows.indexOf(value) === index).sort();
const safeId = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/u;
const digestPattern = /^sha256:[a-f0-9]{64}$/u;
const expectedScenarioIds = [
  "valid",
  "extra-field",
  "missing-field",
  "path-escape",
  "stale-digest",
  "p2-in-wave",
  "report-drift",
] as const;
const populationMemberIds = [
  "valid-campaign-definition",
  "invalid-or-unsafe-definition",
  "complete-inventory",
  "isolated-read-only-discovery",
  "confirmed-p0",
  "confirmed-material-quality-p1",
  "p2-p3-report-only",
  "credible-unknown-p0-p1-investigation",
  "optional-polish-exclusion",
  "two-frozen-remediation-waves",
  "incomplete-or-failed-mission",
  "active-change-conflict",
  "dirty-path-conflict",
  "protected-effect",
  "controller-or-opencode-interruption",
  "windows-supervisor-reentry",
  "changed-block-rereview",
  "report-drift-prevention",
  "budget-exhaustion",
  "terminal-completion",
] as const;
const recordFields = ["definition", "definitionDigest", "reportProjection", "schemaVersion", "wave", "workItems"];
const definitionFields = [
  "allowedEffects",
  "authorizationRefs",
  "budgets",
  "campaignId",
  "checkpointPolicy",
  "exclusions",
  "hostResume",
  "outcome",
  "paths",
  "playbook",
  "protectedDecisionPolicy",
  "schemaVersion",
  "scopeRoots",
  "stopPolicy",
  "validationArgv",
];

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value == null || typeof value !== "object") return value;
  const input = value as JsonRecord;
  return Object.fromEntries(Object.keys(input).sort().map((key) => [key, stableValue(input[key])]));
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

function digestValue(value: unknown): string {
  return `sha256:${crypto.createHash("sha256").update(JSON.stringify(stableValue(value))).digest("hex")}`;
}

function digestBytes(value: string | Buffer): string {
  return `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;
}

function isRecord(value: unknown): value is JsonRecord {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function exactFields(value: unknown, fields: string[]): boolean {
  return isRecord(value)
    && JSON.stringify(Object.keys(value).sort()) === JSON.stringify(fields.slice().sort());
}

function nonEmptyStrings(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string" && item.trim() !== "");
}

function uniqueStrings(value: unknown): value is string[] {
  return nonEmptyStrings(value) && new Set(value).size === value.length;
}

function positiveInteger(value: unknown): boolean {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function containedRelativePath(value: unknown): boolean {
  if (typeof value !== "string" || value.trim() === "") return false;
  const portable = value.replace(/\\/gu, "/");
  if (path.posix.isAbsolute(portable) || path.win32.isAbsolute(value)) return false;
  const normalized = path.posix.normalize(portable);
  return normalized !== "." && normalized !== ".." && !normalized.startsWith("../");
}

function usage(): string {
  return [
    "Usage:",
    "  node tools/proofs/work-campaign.ts --mode preflight --candidate-id <id> --evidence-root <absolute-new-path> [--fixture <seed-pack.json>]",
    "  node tools/proofs/work-campaign.ts --mode controller --candidate-id <id> --environment-id <id> --evidence-root <absolute-new-path>",
    "  node tools/proofs/work-campaign.ts --mode materializer --candidate-id <id> --evidence-root <absolute-new-path>",
    "  node tools/proofs/work-campaign.ts --mode population --candidate-id <id> --environment-id <id> (--input-root <configured-capture-path> | --host-input-root <installed-operator-capture-path>) --evidence-root <absolute-new-path>",
    "  node tools/proofs/work-campaign.ts --mode state --candidate-id <id> --evidence-root <absolute-new-path>",
    "  node tools/proofs/work-campaign.ts --mode windows --candidate-id <id> --environment-id <id> --evidence-root <absolute-new-path>",
    "  node tools/proofs/work-campaign.ts --mode replay --candidate-id <id> [--environment-id <id>] --input-root <preflight-path> --evidence-root <absolute-new-path>",
    "",
    "Effects:",
    "  --help/-h: none.",
    "  preflight: reads reviewed seeds, creates/deletes one disposable local fixture, and writes one create-new immutable evidence bundle.",
    "  controller: exercises production preflight/run/status/stop/replay over disposable Git/OpenSpec fixtures, deletes them, and writes one create-new immutable evidence bundle.",
    "  materializer: starts only proof-owned local processes, exercises the production ledger/report CLI in a disposable project, deletes it, and writes one create-new immutable evidence bundle.",
    "  population: runs provider-free semantic/controller/state/materializer controls, composes one preserved configured capture, deletes disposable fixtures, and writes one create-new 20-member evidence bundle.",
    "  state: starts only proof-owned local processes, exercises the production state CLI in a disposable project, deletes it, and writes one create-new immutable evidence bundle.",
    "  windows: exercises source-only Windows supervisor preview/check/repair/rollback plans and the protected host boundary over disposable files; host mutation is zero.",
    "  replay: reads one preserved bundle and writes one create-new evaluation; provider, source, OpenSpec, Git, process, host, and remote calls are zero.",
    "",
    "Evidence and cleanup:",
    "  Capture modes write raw.json and evaluation.json; replay writes evaluation.json. Disposable fixture cleanup must be complete before evidence is sealed.",
  ].join("\n");
}

function requiredValue(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value == null || value.trim() === "" || value.startsWith("--")) throw new Error(`Missing value for ${option}`);
  return value;
}

function parseArgs(args: string[]): Options {
  if (args.length === 1 && (args[0] === "--help" || args[0] === "-h")) {
    return {
      candidateId: "help",
      environmentId: null,
      evidenceRoot: sourceRoot,
      fixturePath: defaultFixturePath,
      help: true,
      hostInputRoot: null,
      inputRoot: null,
      mode: "preflight",
    };
  }
  let candidateId = "";
  let evidenceRoot = "";
  let environmentId: string | null = null;
  let fixturePath = defaultFixturePath;
  let hostInputRoot: string | null = null;
  let inputRoot: string | null = null;
  let mode = "";
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--candidate-id") {
      candidateId = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--evidence-root") {
      evidenceRoot = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--environment-id") {
      environmentId = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--fixture") {
      fixturePath = path.resolve(requiredValue(args, index, arg));
      index++;
    } else if (arg === "--input-root") {
      inputRoot = path.resolve(requiredValue(args, index, arg));
      index++;
    } else if (arg === "--host-input-root") {
      hostInputRoot = path.resolve(requiredValue(args, index, arg));
      index++;
    } else if (arg === "--mode") {
      mode = requiredValue(args, index, arg);
      index++;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (mode !== "controller" && mode !== "materializer" && mode !== "population" && mode !== "preflight" && mode !== "replay" && mode !== "state" && mode !== "windows") throw new Error("--mode must be preflight, controller, materializer, population, state, windows, or replay");
  if (!safeId.test(candidateId)) throw new Error("--candidate-id must be a safe identifier");
  if (environmentId != null && !safeId.test(environmentId)) throw new Error("--environment-id must be a safe identifier");
  if ((mode === "controller" || mode === "population" || mode === "windows") && environmentId == null) throw new Error(`${mode} mode requires --environment-id`);
  if (environmentId != null && mode !== "controller" && mode !== "population" && mode !== "windows" && mode !== "replay") throw new Error("--environment-id is supported only for controller, population, windows, and replay");
  if (!path.isAbsolute(evidenceRoot)) throw new Error("--evidence-root must be absolute");
  if (mode === "population" && (inputRoot == null) === (hostInputRoot == null)) {
    throw new Error("population mode requires exactly one of --input-root or --host-input-root");
  }
  if (mode === "replay" && inputRoot == null) throw new Error("--input-root is required for replay");
  if (mode !== "population" && mode !== "replay" && inputRoot != null) throw new Error("--input-root is supported only for population and replay");
  if (mode !== "population" && hostInputRoot != null) throw new Error("--host-input-root is supported only for population");
  return {
    candidateId,
    environmentId,
    evidenceRoot: path.resolve(evidenceRoot),
    fixturePath,
    help: false,
    hostInputRoot,
    inputRoot,
    mode,
  };
}

function reportTotals(record: JsonRecord): JsonRecord | null {
  const workItems = record.workItems;
  const wave = record.wave;
  if (!Array.isArray(workItems) || !isRecord(wave) || !Array.isArray(wave.workItemIds)) return null;
  const counts = {
    all: workItems.length,
    p0: 0,
    p1: 0,
    p2: 0,
    p3: 0,
    confirmed: 0,
    reportOnly: 0,
    waveItems: wave.workItemIds.length,
  };
  for (const value of workItems) {
    if (!isRecord(value)) return null;
    if (value.severity === "P0") counts.p0++;
    else if (value.severity === "P1") counts.p1++;
    else if (value.severity === "P2") counts.p2++;
    else if (value.severity === "P3") counts.p3++;
    else return null;
    if (value.disposition === "confirmed") counts.confirmed++;
    else if (value.disposition === "report-only") counts.reportOnly++;
    else return null;
  }
  return counts;
}

function evaluateRecord(record: JsonRecord): { checks: Record<string, boolean>; failedChecks: string[]; status: "blocked" | "complete" } {
  const definition = isRecord(record.definition) ? record.definition : null;
  const paths = isRecord(definition?.paths) ? definition.paths : null;
  const budgets = isRecord(definition?.budgets) ? definition.budgets : null;
  const workItems = Array.isArray(record.workItems) ? record.workItems : [];
  const itemRows = workItems.filter(isRecord);
  const itemIds = itemRows.flatMap((item) => typeof item.id === "string" ? [item.id] : []);
  const itemById = new Map(itemRows.flatMap((item) => typeof item.id === "string" ? [[item.id, item] as const] : []));
  const wave = isRecord(record.wave) ? record.wave : null;
  const waveIds = Array.isArray(wave?.workItemIds) ? wave.workItemIds : [];
  const report = isRecord(record.reportProjection) ? record.reportProjection : null;
  const totals = reportTotals(record);
  const checks: Record<string, boolean> = {
    "record:exact-fields": exactFields(record, recordFields),
    "record:schema-version": record.schemaVersion === 1,
    "definition:exact-fields": exactFields(definition, definitionFields),
    "definition:schema-version": definition?.schemaVersion === 1,
    "definition:safe-id": typeof definition?.campaignId === "string" && safeId.test(definition.campaignId),
    "definition:outcome": typeof definition?.outcome === "string" && definition.outcome.trim() !== "",
    "definition:scope": uniqueStrings(definition?.scopeRoots) && definition.scopeRoots.every(containedRelativePath),
    "definition:exclusions": Array.isArray(definition?.exclusions) && definition.exclusions.every(containedRelativePath),
    "definition:playbook": definition?.playbook === "audit-remediate",
    "definition:paths-exact": exactFields(paths, ["evidence", "report", "state"]),
    "definition:paths-contained": paths != null && Object.values(paths).every(containedRelativePath),
    "definition:validation-argv": nonEmptyStrings(definition?.validationArgv),
    "definition:checkpoint-policy": definition?.checkpointPolicy === "local-git",
    "definition:allowed-effects": uniqueStrings(definition?.allowedEffects)
      && definition.allowedEffects.every((effect) => ["local-commit", "local-read", "local-write"].includes(effect)),
    "definition:authorization-refs": uniqueStrings(definition?.authorizationRefs),
    "definition:budgets-exact": exactFields(budgets, ["evidenceBytes", "modelCalls", "wallClockSeconds", "waves"]),
    "definition:budgets-finite": budgets != null && Object.values(budgets).every(positiveInteger),
    "definition:host-resume": definition?.hostResume === "disabled",
    "definition:stop-policy": definition?.stopPolicy === "explicit-or-terminal",
    "definition:protected-decision-policy": definition?.protectedDecisionPolicy === "owner-required",
    "definition:digest-current": definition != null && record.definitionDigest === digestValue(definition),
    "work-items:shape": workItems.length > 0 && itemRows.length === workItems.length
      && itemRows.every((item) => exactFields(item, ["disposition", "id", "severity"])),
    "work-items:ids": itemIds.length === itemRows.length && itemIds.every((id) => safeId.test(id))
      && new Set(itemIds).size === itemIds.length,
    "work-items:explicit-policy": itemRows.every((item) => (
      ((item.severity === "P0" || item.severity === "P1") && item.disposition === "confirmed")
      || ((item.severity === "P2" || item.severity === "P3") && item.disposition === "report-only")
    )),
    "wave:shape": exactFields(wave, ["id", "workItemIds"])
      && typeof wave?.id === "string" && safeId.test(wave.id) && uniqueStrings(wave.workItemIds),
    "wave:eligible-items": waveIds.every((id) => {
      if (typeof id !== "string") return false;
      const item = itemById.get(id);
      return item != null && (item.severity === "P0" || item.severity === "P1") && item.disposition === "confirmed";
    }),
    "report:shape": exactFields(report, ["sourceDigest", "totals"])
      && typeof report?.sourceDigest === "string" && digestPattern.test(report.sourceDigest),
    "report:source-current": report?.sourceDigest === digestValue({ workItems: record.workItems, wave: record.wave }),
    "report:totals-current": totals != null && stableJson(report?.totals) === stableJson(totals),
  };
  const failedChecks = Object.entries(checks).flatMap(([name, passed]) => passed ? [] : [name]);
  return { checks, failedChecks, status: failedChecks.length === 0 ? "complete" : "blocked" };
}

function validateOperation(value: unknown): asserts value is JsonRecord {
  if (!isRecord(value) || !["delete", "none", "set"].includes(String(value.kind))) {
    throw new Error("Scenario operation must be none, set, or delete");
  }
  if (value.kind === "none") {
    if (!exactFields(value, ["kind"])) throw new Error("A none operation accepts only kind");
    return;
  }
  const expected = value.kind === "set" ? ["kind", "path", "value"] : ["kind", "path"];
  if (!exactFields(value, expected) || !nonEmptyStrings(value.path)) throw new Error(`${String(value.kind)} operation has invalid fields`);
  if (value.path.some((part) => !safeId.test(part) || ["__proto__", "constructor", "prototype"].includes(part))) {
    throw new Error("Scenario operation path is unsafe");
  }
}

function validatePack(value: unknown): asserts value is JsonRecord {
  if (!isRecord(value) || !exactFields(value, ["baseRecord", "packId", "scenarios", "schemaVersion"])) {
    throw new Error("Seed pack fields are invalid");
  }
  if (value.schemaVersion !== 1 || value.packId !== "work-campaign-provider-free-v1" || !isRecord(value.baseRecord)) {
    throw new Error("Seed pack identity is invalid");
  }
  const base = evaluateRecord(value.baseRecord);
  if (base.status !== "complete") throw new Error(`Base seed record is invalid: ${base.failedChecks.join(", ")}`);
  if (!Array.isArray(value.scenarios) || value.scenarios.length !== expectedScenarioIds.length) {
    throw new Error("Seed pack scenario population is incomplete");
  }
  const ids: string[] = [];
  for (const scenario of value.scenarios) {
    if (!exactFields(scenario, ["expected", "id", "operation"]) || typeof scenario.id !== "string") {
      throw new Error("Seed scenario fields are invalid");
    }
    const expected = scenario.expected;
    if (!isRecord(expected) || !exactFields(expected, ["failedCheck", "status"])) {
      throw new Error(`Seed scenario '${scenario.id}' expectation is invalid`);
    }
    if (!["blocked", "complete"].includes(String(expected.status))) throw new Error(`Seed scenario '${scenario.id}' status is invalid`);
    if (expected.failedCheck !== null && typeof expected.failedCheck !== "string") {
      throw new Error(`Seed scenario '${scenario.id}' failed check is invalid`);
    }
    validateOperation(scenario.operation);
    ids.push(scenario.id);
  }
  if (JSON.stringify(ids) !== JSON.stringify(expectedScenarioIds)) throw new Error("Seed scenarios must use the reviewed stable order");
}

function applyOperation(baseRecord: JsonRecord, operation: JsonRecord): JsonRecord {
  const result = structuredClone(baseRecord) as JsonRecord;
  if (operation.kind === "none") return result;
  const parts = operation.path as string[];
  let parent = result;
  for (const part of parts.slice(0, -1)) {
    const child = parent[part];
    if (!isRecord(child)) throw new Error(`Scenario operation parent '${part}' does not exist`);
    parent = child;
  }
  const leaf = parts[parts.length - 1] ?? "";
  if (operation.kind === "delete") delete parent[leaf];
  else parent[leaf] = structuredClone(operation.value);
  return result;
}

function materializeScenarios(pack: JsonRecord): ScenarioResult[] {
  return (pack.scenarios as JsonRecord[]).map((scenario) => {
    const expected = scenario.expected as ScenarioResult["expected"];
    const record = applyOperation(pack.baseRecord as JsonRecord, scenario.operation as JsonRecord);
    const actual = evaluateRecord(record);
    return {
      checks: actual.checks,
      expected,
      failedChecks: actual.failedChecks,
      id: scenario.id as string,
      record,
      status: actual.status,
    };
  });
}

function scenarioExpectationsPassed(scenarios: ScenarioResult[]): boolean {
  return scenarios.every((scenario) => scenario.status === scenario.expected.status
    && (scenario.expected.failedCheck == null || scenario.failedChecks.includes(scenario.expected.failedCheck)));
}

function evaluateRaw(raw: JsonRecord, candidateId: string): JsonRecord {
  const pack = raw.fixturePack;
  let materialized: ScenarioResult[] = [];
  let packValid = false;
  try {
    validatePack(pack);
    materialized = materializeScenarios(pack);
    packValid = true;
  } catch {
    packValid = false;
  }
  const observedScenarios = Array.isArray(raw.scenarios) ? raw.scenarios : [];
  const effects = isRecord(raw.effects) ? raw.effects : null;
  const projectManifest = isRecord(raw.projectManifest) ? raw.projectManifest : null;
  const checks: Record<string, boolean> = {
    candidateMatched: raw.candidateId === candidateId,
    cleanupComplete: raw.cleanup === "complete",
    fixturePackValid: packValid,
    fixturePackDigestMatched: packValid && raw.fixturePackDigest === digestValue(pack),
    hostEffectsZero: effects?.hostEffects === 0,
    processStartsZero: effects?.processStarts === 0,
    providerCallsZero: effects?.providerCalls === 0,
    scenarioExpectationsPassed: packValid && scenarioExpectationsPassed(materialized),
    scenarioMaterializationMatched: packValid && stableJson(observedScenarios) === stableJson(materialized),
    sourceEvaluationCurrent: true,
    sourceUnchanged: projectManifest?.beforeDigest === projectManifest?.afterDigest && projectManifest?.sourceWrites === 0,
  };
  return {
    candidateId,
    checks,
    fixturePackDigest: typeof raw.fixturePackDigest === "string" ? raw.fixturePackDigest : "unknown",
    hostEffects: 0,
    liveCalls: 0,
    packId: isRecord(pack) && typeof pack.packId === "string" ? pack.packId : "unknown",
    processStarts: 0,
    schemaVersion: 1,
    sourceWrites: 0,
    status: Object.values(checks).every(Boolean) ? "complete" : "blocked",
  };
}

function evaluateStateRaw(raw: JsonRecord, candidateId: string): JsonRecord {
  const effects = isRecord(raw.effects) ? raw.effects : null;
  const invocation = isRecord(raw.invocation) ? raw.invocation : null;
  const negativeControls = isRecord(raw.negativeControls) ? raw.negativeControls : null;
  const restart = isRecord(raw.restart) ? raw.restart : null;
  const sourceManifest = isRecord(raw.sourceManifest) ? raw.sourceManifest : null;
  const commands = Array.isArray(raw.commands) ? raw.commands.filter(isRecord) : [];
  const commandNames = commands.flatMap((command) => typeof command.name === "string" ? [command.name] : []);
  const expectedCommands = [
    ["preflight", 0],
    ["duplicate-preflight", 0],
    ["phase-start", 0],
    ["before-kill-replay", 0],
    ["blocked-live-writer", 1],
    ["blocked-dead-writer", 1],
    ["writer-reconcile", 0],
    ["duplicate-writer-reconcile", 0],
    ["after-kill-replay", 0],
    ["stale-projection-replay", 1],
    ["state-reconcile", 0],
    ["duplicate-reconcile", 0],
    ["pause", 0],
    ["budget-revision", 0],
    ["budget-regression", 2],
    ["stop", 0],
    ["conflicting-stop", 2],
    ["terminal-replay", 0],
    ["missing-transition", 2],
    ["corrupt-transition", 2],
    ["reordered-transition", 2],
    ["stale-definition", 2],
  ] as const;
  const transitionFiles = Array.isArray(restart?.transitionFiles) ? restart.transitionFiles.filter(isRecord) : [];
  const sourceCandidate = Array.isArray(raw.sourceCandidate) ? raw.sourceCandidate.filter(isRecord) : [];
  const checks: Record<string, boolean> = {
    candidateMatched: raw.candidateId === candidateId,
    captureExitedZero: invocation?.exitCode === 0,
    cleanupComplete: raw.cleanup === "complete",
    commandPopulationComplete: stableJson(commandNames) === stableJson(expectedCommands.map(([name]) => name)),
    commandExitsMatched: commands.length === expectedCommands.length && expectedCommands.every(([name, exitCode], index) => (
      commands[index]?.name === name && commands[index]?.exitCode === exitCode
    )),
    corruptTransitionBlocked: negativeControls?.corruptTransition === 2,
    definitionDriftBlocked: negativeControls?.staleDefinition === 2,
    gitCallsZero: effects?.gitCalls === 0,
    hostEffectsZero: effects?.hostEffects === 0,
    missingTransitionBlocked: negativeControls?.missingTransition === 2,
    openSpecCallsZero: effects?.openSpecCalls === 0,
    processKillObserved: typeof restart?.childExitCode === "number" || typeof restart?.childSignal === "string",
    processStartsObserved: typeof effects?.processStarts === "number" && effects.processStarts > 0,
    projectionDriftBlocked: negativeControls?.staleProjection === 1,
    providerCallsZero: effects?.providerCalls === 0,
    reorderedTransitionBlocked: negativeControls?.reorderedTransition === 2,
    restartCursorExact: typeof restart?.beforeKillStateDigest === "string"
      && restart.beforeKillStateDigest === restart.afterKillStateDigest,
    sourceCandidateCurrent: sourceCandidate.length === 5 && sourceCandidate.every((row) => (
      typeof row.path === "string" && typeof row.sha256 === "string" && /^[a-f0-9]{64}$/u.test(row.sha256)
    )),
    sourceEvaluationCurrent: true,
    sourceUnchanged: sourceManifest?.sourceWrites === 0
      && stableJson(sourceManifest.beforeDigests) === stableJson(sourceManifest.afterDigests),
    stopIntentConflictBlocked: negativeControls?.conflictingStop === 2,
    terminalCursorExact: restart?.terminalSequence === 5,
    transitionChainExact: transitionFiles.length === 5 && transitionFiles.every((row, index) => (
      typeof row.name === "string"
      && row.name.startsWith(`${String(index + 1).padStart(8, "0")}-`)
      && typeof row.sha256 === "string"
      && /^[a-f0-9]{64}$/u.test(row.sha256)
    )),
    writerAttestationArchived: typeof restart?.reconciledArchivePath === "string"
      && restart.reconciledArchivePath.includes("/leases/terminal-"),
    writerRemainedUnknownAfterKill: restart?.deadWriterStatus === "unknown",
  };
  return {
    candidateId,
    checks,
    hostEffects: 0,
    liveCalls: typeof effects?.processStarts === "number" ? effects.processStarts : 0,
    processStarts: typeof effects?.processStarts === "number" ? effects.processStarts : 0,
    proofKind: "campaign-state-restart",
    schemaVersion: 1,
    sourceWrites: 0,
    status: Object.values(checks).every(Boolean) ? "complete" : "blocked",
  };
}

function evaluateMaterializerRaw(raw: JsonRecord, candidateId: string): JsonRecord {
  const effects = isRecord(raw.effects) ? raw.effects : null;
  const invocation = isRecord(raw.invocation) ? raw.invocation : null;
  const negativeControls = isRecord(raw.negativeControls) ? raw.negativeControls : null;
  const regeneration = isRecord(raw.regeneration) ? raw.regeneration : null;
  const sourceManifest = isRecord(raw.sourceManifest) ? raw.sourceManifest : null;
  const commands = Array.isArray(raw.commands) ? raw.commands.filter(isRecord) : [];
  const expectedCommands = [
    ["preflight", 0],
    ["append-block-a", 0],
    ["append-block-b", 0],
    ["append-item-p1", 0],
    ["append-item-p2", 0],
    ["append-reconcile-p1", 0],
    ["append-reconcile-p2", 0],
    ["append-wave-1", 0],
    ["append-report-seed", 0],
    ["materialize-initial", 0],
    ["readback-initial", 0],
    ["materialize-identical", 0],
    ["append-item-p1-fixed", 0],
    ["append-item-p1-fixed-duplicate", 0],
    ["materialize-fixed", 0],
    ["readback-fixed", 0],
    ["readback-drifted", 2],
    ["materialize-repaired", 0],
    ["readback-repaired", 0],
    ["materialize-corrupt-ledger", 2],
  ] as const;
  const sourceCandidate = Array.isArray(raw.sourceCandidate) ? raw.sourceCandidate.filter(isRecord) : [];
  const checks: Record<string, boolean> = {
    candidateMatched: raw.candidateId === candidateId,
    captureExitedZero: invocation?.exitCode === 0,
    cleanupComplete: raw.cleanup === "complete",
    commandExitsMatched: commands.length === expectedCommands.length && expectedCommands.every(([name, exitCode], index) => (
      commands[index]?.name === name && commands[index]?.exitCode === exitCode
    )),
    corruptLedgerBlocked: negativeControls?.corruptLedger === 2,
    gitCallsZero: effects?.gitCalls === 0,
    hostEffectsZero: effects?.hostEffects === 0,
    openSpecCallsZero: effects?.openSpecCalls === 0,
    p1FixedExactlyOnce: regeneration?.fixedAndVerified === 1 && regeneration?.unresolvedP0P1 === 0,
    p2Retained: regeneration?.p2Retained === true,
    processStartsObserved: typeof effects?.processStarts === "number" && effects.processStarts >= commands.length,
    providerCallsZero: effects?.providerCalls === 0,
    regenerationChangedCurrentFacts: typeof regeneration?.initialDigest === "string"
      && typeof regeneration?.fixedDigest === "string"
      && regeneration.initialDigest !== regeneration.fixedDigest,
    regenerationStable: regeneration?.initialDigest === regeneration?.unchangedDigest
      && regeneration?.fixedDigest === regeneration?.repairedDigest,
    reportDriftBlocked: negativeControls?.reportDrift === 2,
    sourceCandidateCurrent: sourceCandidate.length === 5 && sourceCandidate.every((row) => (
      typeof row.path === "string" && typeof row.sha256 === "string" && /^[a-f0-9]{64}$/u.test(row.sha256)
    )),
    sourceEvaluationCurrent: true,
    sourceUnchanged: sourceManifest?.sourceWrites === 0
      && stableJson(sourceManifest.beforeDigests) === stableJson(sourceManifest.afterDigests),
    sourceWritesZero: effects?.sourceWrites === 0,
    staleP1Removed: regeneration?.staleP1Removed === true,
  };
  return {
    candidateId,
    checks,
    hostEffects: 0,
    liveCalls: typeof effects?.processStarts === "number" ? effects.processStarts : 0,
    processStarts: typeof effects?.processStarts === "number" ? effects.processStarts : 0,
    proofKind: "campaign-ledger-report-materializer",
    reportDigest: typeof regeneration?.fixedDigest === "string" ? regeneration.fixedDigest : "unknown",
    schemaVersion: 1,
    sourceWrites: 0,
    status: Object.values(checks).every(Boolean) ? "complete" : "blocked",
  };
}

function evaluateControllerRaw(raw: JsonRecord, candidateId: string, environmentId: string | null): JsonRecord {
  const commands = Array.isArray(raw.commands) ? raw.commands.filter(isRecord) : [];
  const effects = isRecord(raw.effects) ? raw.effects : null;
  const invocation = isRecord(raw.invocation) ? raw.invocation : null;
  const negativeControls = isRecord(raw.negativeControls) ? raw.negativeControls : null;
  const missionIntegration = isRecord(raw.missionIntegration) ? raw.missionIntegration : null;
  const report = isRecord(raw.report) ? raw.report : null;
  const sourceManifest = isRecord(raw.sourceManifest) ? raw.sourceManifest : null;
  const supervisor = isRecord(raw.supervisor) ? raw.supervisor : null;
  const supervisorAdvice = isRecord(supervisor?.advice) ? supervisor.advice : null;
  const transitions = isRecord(raw.transitions) ? raw.transitions : null;
  const verification = isRecord(raw.verification) ? raw.verification : null;
  const sourceCandidate = Array.isArray(raw.sourceCandidate) ? raw.sourceCandidate.filter(isRecord) : [];
  const sourcePaths = sourceCandidate.flatMap((row) => typeof row.path === "string" ? [row.path] : []);
  const expectedCommands = [
    ["status-before", 1, "blocked"],
    ["preflight", 0, null],
    ["run", 3, "paused-external"],
    ["report-readback", 0, null],
    ["status-after", 0, "paused-external"],
    ["replay", 0, "paused-external"],
    ["idempotent-run", 3, "paused-external"],
    ["invalid-definition", 2, null],
    ["dirty-worktree", 1, "blocked"],
    ["active-change", 1, "blocked"],
    ["unknown-writer", 1, "paused-unknown"],
    ["stop", 0, "paused-stop"],
    ["stopped-status", 0, "paused-stop"],
  ] as const;
  const expectedKinds = [
    "preflight", "phase-start", "phase-complete", "phase-start", "findings-freeze", "phase-start", "report-materialized", "wave-admitted", "pause",
  ];
  const expectedTwoWaveKinds = [
    "preflight", "phase-start", "phase-complete", "phase-start", "findings-freeze", "phase-start", "report-materialized", "wave-admitted", "mission-launch",
    "mission-terminal", "verification", "rereview", "findings-freeze", "wave-admitted", "mission-launch", "mission-terminal", "verification", "rereview",
    "report-materialized", "terminal-complete",
  ];
  const admittedRefs = Array.isArray(transitions?.admittedEvidenceRefs) ? transitions.admittedEvidenceRefs : [];
  const checks: Record<string, boolean> = {
    activeChangeBlocked: negativeControls?.activeChange === 1,
    candidateMatched: raw.candidateId === candidateId,
    captureExitedZero: invocation?.exitCode === 0,
    cleanupComplete: raw.cleanup === "complete",
    commandExitsMatched: commands.length === expectedCommands.length && expectedCommands.every(([name, exitCode, disposition], index) => (
      commands[index]?.name === name
      && commands[index]?.exitCode === exitCode
      && (disposition == null || commands[index]?.disposition === disposition)
    )),
    dirtyWorktreeBlocked: negativeControls?.dirtyWorktree === 1,
    ...(environmentId == null ? {} : { environmentMatched: raw.environmentId === environmentId }),
    exactFakeRefsRetained: admittedRefs.includes("result:partition-1")
      && admittedRefs.includes("result:reconcile-p1")
      && admittedRefs.includes("result:reconcile-p2"),
    controllerGitMutationCallsZero: effects?.controllerGitMutationCalls === 0,
    controllerOpenSpecMutationCallsZero: effects?.controllerOpenSpecMutationCalls === 0,
    fixtureSetupObserved: typeof effects?.fixtureGitMutationCalls === "number" && effects.fixtureGitMutationCalls > 0
      && typeof effects?.fixtureOpenSpecMutationCalls === "number" && effects.fixtureOpenSpecMutationCalls > 0,
    hostEffectsZero: effects?.hostEffects === 0,
    invalidDefinitionBlocked: negativeControls?.invalidDefinition === 2,
    missionCallObserved: effects?.missionCalls === 2,
    providerFreeMissionCallsZero: transitions?.missionRef === null,
    openCodeCallsZero: effects?.openCodeCalls === 0,
    p1AdmittedAndP2ReportOnly: report?.p1Present === true && report?.p2ReportOnly === true,
    processStartsObserved: typeof effects?.processStarts === "number" && effects.processStarts > commands.length,
    providerCallsZero: effects?.providerCalls === 0,
    reportDigestCaptured: typeof report?.digest === "string" && /^[a-f0-9]{64}$/u.test(report.digest),
    missionDuplicateConsumptionBlocked: missionIntegration?.duplicateTransitionCount === 11,
    missionLaunchOrdered: stableJson(missionIntegration?.launchKinds) === stableJson([
      "preflight", "phase-start", "phase-complete", "phase-start", "findings-freeze", "phase-start", "report-materialized", "wave-admitted", "mission-launch",
    ]),
    missionParentMismatchBlocked: missionIntegration?.mismatchExitCode === 2,
    missionReportRegenerated: missionIntegration?.reportFixed === true && missionIntegration?.reportNeedsRereview === true,
    missionStopPropagated: missionIntegration?.stopDisposition === "paused-stop" && missionIntegration?.stopSource === "campaign",
    missionTerminalConsumed: missionIntegration?.missionDisposition === "complete"
      && missionIntegration?.resumeDisposition === "paused-external"
      && missionIntegration?.resumePhase === "verify"
      && stableJson(missionIntegration?.terminalKinds) === stableJson(["mission-terminal", "verification"]),
    missionWriterSeparated: missionIntegration?.writerLeaseAbsent === true,
    campaignVerificationCommandFailureClosed: verification?.commandFailureExitCode === 1
      && verification?.commandFailureTransitionCount === 11,
    campaignRereviewCurrent: verification?.rereviewDisposition === "paused-external"
      && verification?.rereviewValidationStatus === "complete"
      && verification?.rereviewProofStatus === "complete"
      && typeof verification?.rereviewCandidateDigest === "string"
      && /^[a-f0-9]{64}$/u.test(verification.rereviewCandidateDigest),
    campaignTerminalComplete: verification?.finalDisposition === "complete"
      && verification?.finalChallengeStatus === "complete"
      && verification?.finalTerminalState === "complete"
      && stableJson(verification?.finalTransitionKinds) === stableJson(["report-materialized", "terminal-complete"])
      && verification?.terminalIdempotentCount === 14,
    campaignTerminalHandoffCurrent: verification?.finalHandoffCandidateDigest === verification?.rereviewCandidateDigest
      && verification?.finalHandoffReportDigest === verification?.finalClosureReportDigest
      && verification?.finalHandoffMaximumClaim === "One disposable configured local campaign completed 1 fixed-and-verified P0/P1 item(s) across 1 archived and checkpointed wave(s) through current re-review, aggregate validation, real-boundary proof, and final challenge; population and host claims remain outside this result.",
    criticalP0RequiresSdet: verification?.criticalRereviewDisposition === "paused-external"
      && verification?.criticalSdetPending === true
      && verification?.criticalFinalDisposition === "paused-external",
    finalChallengeHasNoTerminalAuthority: verification?.unauthorizedTerminalExitCode === 2,
    p2RemainedReportOnly: verification?.p2ReportOnly === true,
    semanticProducerIdentityCorrelated: verification?.producerMismatchExitCode === 2,
    staleCurrentArtifactBlocksCompletion: verification?.staleArtifactDisposition === "paused-external"
      && verification?.staleArtifactHandoffAbsent === true,
    staleCurrentSourceBlocksCompletion: verification?.staleCandidateDisposition === "paused-external"
      && verification?.staleCandidateHandoffAbsent === true,
    terminalRecoveryRechecksCurrentEvidence: verification?.interruptedRecoveryDisposition === "paused-external"
      && verification?.interruptedRecoveryHandoffAbsent === true
      && verification?.interruptedRecoveryOperation === "resume"
      && verification?.interruptedRecoveryPausePersisted === true,
    terminalRecoveryCompletesAfterRestore: verification?.interruptedRecoveredDisposition === "complete"
      && verification?.interruptedRecoveredOperation === "resume",
    terminalRecoveryStateConsistent: verification?.interruptedStatusDisposition === "paused-external"
      && verification?.interruptedStatusOperation === "status"
      && verification?.interruptedReplayDisposition === "paused-external"
      && verification?.interruptedReplayOperation === "replay",
    terminalReplaySuppressesStaleHandoff: verification?.staleCompletedDisposition === "blocked"
      && verification?.staleCompletedHandoffAbsent === true,
    twoWaveCampaignComplete: verification?.twoWaveDisposition === "complete"
      && verification?.twoWaveArchived === 2
      && verification?.twoWaveCheckpointed === 2
      && stableJson(verification?.twoWaveTransitionKinds) === stableJson(expectedTwoWaveKinds),
    twoWaveMissionAuthorityRequired: verification?.twoWaveMissingMissionExitCode === 2,
    twoWaveSelfReconciliationBlocked: verification?.twoWaveSelfReconciliationExitCode === 2,
    sourceCandidateCurrent: stableJson(sourcePaths) === stableJson(WORK_CAMPAIGN_CONTROLLER_SOURCE_PATHS)
      && sourceCandidate.length === WORK_CAMPAIGN_CONTROLLER_SOURCE_PATHS.length && sourceCandidate.every((row) => (
      typeof row.path === "string" && typeof row.sha256 === "string" && /^[a-f0-9]{64}$/u.test(row.sha256)
    )),
    sourceEvaluationCurrent: true,
    sourceUnchanged: sourceManifest?.sourceWrites === 0
      && stableJson(sourceManifest?.beforeDigests) === stableJson(sourceManifest?.afterDigests),
    sourceWritesZero: effects?.sourceWrites === 0,
    stopAppendedExactlyOnce: transitions?.beforeStopCount === 9 && transitions?.finalCount === 11,
    supervisorAdviceComplete: supervisorAdvice?.budget === "budget"
      && supervisorAdvice?.complete === "complete"
      && supervisorAdvice?.drift === "definition-or-project-drift"
      && supervisorAdvice?.externalInput === "external-input-required"
      && supervisorAdvice?.notStarted === "not-started"
      && supervisorAdvice?.ownerProtected === "owner-protected"
      && supervisorAdvice?.restored === "terminal-evidence-restored"
      && supervisorAdvice?.stop === "explicit-stop"
      && supervisorAdvice?.terminalMission === "runtime-interruption-ready"
      && supervisorAdvice?.unknownWriter === "writer-or-cleanup-unknown",
    supervisorDuplicateSuppressed: supervisor?.duplicateSuppressed === true,
    supervisorLogsBoundedAndPrivate: supervisor?.logCount === 3
      && supervisor?.oldGenerationRemoved === true
      && supervisor?.passwordAbsent === true,
    supervisorResumeConsumedHandoff: supervisor?.resumeDisposition === "paused-external"
      && supervisor?.resumeReason === "runtime-interruption-ready"
      && supervisor?.resumeState === "resumed",
    supervisorRetryBackoffObserved: supervisor?.retryBackoffObserved === true,
    supervisorSignalAndStopPropagated: supervisor?.signalStopped === true
      && supervisor?.stopDisposition === "paused-stop"
      && supervisor?.stopSource === "campaign",
    transitionOrderExact: stableJson(transitions?.kinds) === stableJson(expectedKinds),
    unknownWriterBlocked: negativeControls?.unknownWriter === 1,
    waveFrozenBeforeMission: transitions?.admittedWaveId === "wave-1"
      && transitions?.pauseDisposition === "paused-external",
  };
  return {
    candidateId,
    checks,
    hostEffects: 0,
    liveCalls: typeof effects?.processStarts === "number" ? effects.processStarts : 0,
    processStarts: typeof effects?.processStarts === "number" ? effects.processStarts : 0,
    proofKind: "campaign-provider-free-controller",
    reportDigest: typeof report?.digest === "string" ? report.digest : "unknown",
    schemaVersion: 1,
    sourceWrites: 0,
    status: Object.values(checks).every(Boolean) ? "complete" : "blocked",
  };
}

function evaluateWindowsRaw(raw: JsonRecord, candidateId: string, environmentId: string | null): JsonRecord {
  const effects = isRecord(raw.effects) ? raw.effects : null;
  const invocation = isRecord(raw.invocation) ? raw.invocation : null;
  const sourceManifest = isRecord(raw.sourceManifest) ? raw.sourceManifest : null;
  const sourceCandidate = Array.isArray(raw.sourceCandidate) ? raw.sourceCandidate.filter(isRecord) : [];
  const sourcePaths = sourceCandidate.flatMap((row) => typeof row.path === "string" ? [row.path] : []);
  const completedOracles = Array.isArray(raw.completedOracles) ? raw.completedOracles : [];
  const expectedOracles = [
    "credential-private-host",
    "effect-free-preview",
    "fail-closed-plans",
    "identity-separated-check",
    "source-installed-drift-separation",
  ];
  const checks: Record<string, boolean> = {
    candidateMatched: raw.candidateId === candidateId,
    captureExitedZero: invocation?.exitCode === 0,
    cleanupComplete: raw.cleanup === "complete",
    environmentMatched: environmentId != null && raw.environmentId === environmentId,
    hostMutationsZero: effects?.hostMutations === 0,
    openCodeCallsZero: effects?.openCodeCalls === 0,
    oraclesComplete: stableJson(completedOracles) === stableJson(expectedOracles),
    privacySafeOutput: !String(invocation?.stdout ?? "").includes("private-host-password-proof")
      && !String(invocation?.stderr ?? "").includes("private-host-password-proof"),
    providerCallsZero: effects?.providerCalls === 0,
    sourceCandidateCurrent: stableJson(sourcePaths) === stableJson(windowsSourcePaths)
      && sourceCandidate.length === windowsSourcePaths.length
      && sourceCandidate.every((row) => typeof row.sha256 === "string" && /^[a-f0-9]{64}$/u.test(row.sha256)),
    sourceEvaluationCurrent: true,
    sourceUnchanged: stableJson(sourceManifest?.beforeDigests) === stableJson(sourceManifest?.afterDigests),
    sourceWritesZero: effects?.sourceWrites === 0,
  };
  return {
    candidateId,
    checks,
    hostEffects: 0,
    liveCalls: typeof effects?.processStarts === "number" ? effects.processStarts : 0,
    processStarts: typeof effects?.processStarts === "number" ? effects.processStarts : 0,
    proofKind: "campaign-windows-source-plan",
    schemaVersion: 1,
    sourceWrites: 0,
    status: Object.values(checks).every(Boolean) ? "complete" : "blocked",
  };
}

type PopulationRow = {
  boundary: string;
  candidateId: string;
  cleanup: "complete" | "not-required" | "unknown";
  disposition: string;
  effectCount: number | null;
  environmentId: string;
  evidenceRefs: string[];
  id: typeof populationMemberIds[number];
  observed: boolean;
  rowState: "terminal-observation";
  scenarios: string[];
  sourceWriterCount: number | null;
  support: "observed" | "unknown";
};

function nestedRecord(value: unknown, ...keys: string[]): JsonRecord | null {
  let current = value;
  for (const key of keys) {
    if (!isRecord(current)) return null;
    current = current[key];
  }
  return isRecord(current) ? current : null;
}

function commandByName(raw: JsonRecord, name: string): JsonRecord | null {
  if (!Array.isArray(raw.commands)) return null;
  return raw.commands.filter(isRecord).find((row) => row.name === name) ?? null;
}

export function classifyPopulationConfiguredInput(
  configured: JsonRecord,
  hostInput: boolean,
  candidateId: string,
  environmentId: string,
): { configuredCurrent: boolean; windowsReentryObserved: boolean } {
  const checks = isRecord(configured.checks) ? configured.checks : {};
  const configuredCurrent = configured.status === "complete"
    && configured.proofKind === (hostInput ? "campaign-installed-operator" : "campaign-configured-complete")
    && configured.candidateId === candidateId
    && configured.environmentId === environmentId
    && checks.candidateMatched === true
    && checks.environmentMatched === true;
  return {
    configuredCurrent,
    windowsReentryObserved: configuredCurrent
      && hostInput
      && checks.windowsSupervisorReentryObserved === true
      && typeof configured.hostEffects === "number"
      && configured.hostEffects > 0,
  };
}

export function buildPopulationRows(raw: JsonRecord, candidateId: string, environmentId: string): PopulationRow[] {
  const controller = isRecord(raw.controller) ? raw.controller : {};
  const semantic = isRecord(raw.semantic) ? raw.semantic : {};
  const configured = isRecord(raw.configured) ? raw.configured : {};
  const materializer = isRecord(raw.materializer) ? raw.materializer : {};
  const stateRaw = isRecord(raw.state) ? raw.state : {};
  const semanticEvidence = isRecord(semantic.evidence) ? semantic.evidence : {};
  const happy = isRecord(semanticEvidence.happyPath) ? semanticEvidence.happyPath : {};
  const noWave = isRecord(semanticEvidence.noWave) ? semanticEvidence.noWave : {};
  const investigations = isRecord(semanticEvidence.investigations) ? semanticEvidence.investigations : {};
  const protectedSplit = isRecord(semanticEvidence.protectedSplit) ? semanticEvidence.protectedSplit : {};
  const semanticControls = isRecord(semanticEvidence.controls) ? semanticEvidence.controls : {};
  const controllerControls = isRecord(controller.controlPartitions) ? controller.controlPartitions : {};
  const reportOnly = isRecord(controllerControls.reportOnly) ? controllerControls.reportOnly : {};
  const ownerOnly = isRecord(controllerControls.ownerOnly) ? controllerControls.ownerOnly : {};
  const ownerSibling = isRecord(controllerControls.ownerSibling) ? controllerControls.ownerSibling : {};
  const controllerVerification = isRecord(controller.verification) ? controller.verification : {};
  const controllerNegative = isRecord(controller.negativeControls) ? controller.negativeControls : {};
  const materializerNegative = isRecord(materializer.negativeControls) ? materializer.negativeControls : {};
  const stateNegative = isRecord(stateRaw.negativeControls) ? stateRaw.negativeControls : {};
  const configuredChecks = isRecord(configured.checks) ? configured.checks : {};
  const hostInput = raw.hostInput === true;
  const statuses = Array.isArray(happy.statuses) ? happy.statuses : [];
  const statusMatched = (itemId: string, status: string): boolean => statuses.some((row) => Array.isArray(row) && row[0] === itemId && row[1] === status);
  const investigationComplete = ["confirmed", "falsified", "owner-required", "still-unknown"]
    .every((key) => isRecord(investigations[key]));
  const { configuredCurrent, windowsReentryObserved } = classifyPopulationConfiguredInput(configured, hostInput, candidateId, environmentId);
  const row = (
    id: PopulationRow["id"],
    boundary: string,
    disposition: string,
    observed: boolean,
    sourceWriterCount: number | null,
    effectCount: number | null,
    cleanup: PopulationRow["cleanup"],
    scenarios: string[],
    evidenceRefs: string[],
    support: PopulationRow["support"] = "observed",
  ): PopulationRow => ({
    boundary,
    candidateId,
    cleanup,
    disposition,
    effectCount,
    environmentId,
    evidenceRefs,
    id,
    observed,
    rowState: "terminal-observation",
    scenarios,
    sourceWriterCount,
    support,
  });
  return [
    row("valid-campaign-definition", "definition-preflight", "complete", commandByName(controller, "preflight")?.exitCode === 0, 0, 0, "not-required", ["valid-definition"], ["proof:controller"]),
    row("invalid-or-unsafe-definition", "definition-preflight", "blocked", controllerNegative.invalidDefinition === 2, 0, 0, "not-required", ["invalid-definition", "immutable-input"], ["proof:controller"]),
    row("complete-inventory", "phase-input", "complete", reportOnly.transitionCount === 8, 0, 0, "complete", ["terminal-inventory", "no-wave-admission"], ["proof:controller"]),
    row("isolated-read-only-discovery", "semantic-playbook", "complete", happy.status === "complete" && semantic.effects != null, 0, 0, "complete", ["parallel-discovery", "serialized-integration"], ["proof:semantic"]),
    row("confirmed-p0", "critical-reconciliation-closure", "paused-external",
      controllerVerification.criticalRereviewDisposition === "paused-external"
        && controllerVerification.criticalSdetPending === true
        && controllerVerification.criticalFinalDisposition === "paused-external",
      0, 0, "complete", ["confirmed-p0", "critical-sdet-pending"], ["proof:controller"]),
    row("confirmed-material-quality-p1", "configured-mission", "complete", configuredCurrent && configuredChecks.missionOwnedCorrectionObserved === true, 1, 1, "complete", ["configured-p1", "mission-owned-correction"], ["proof:configured"]),
    row("p2-p3-report-only", "reconciliation-report", "complete", noWave.reportOnly === "complete" && configuredChecks.p2ExcludedFromWave === true, 0, 0, "complete", ["p2-report-only", "p3-report-only"], ["proof:semantic", "proof:configured"]),
    row("credible-unknown-p0-p1-investigation", "semantic-investigation", "complete", investigationComplete, 0, 0, "complete", ["confirmed", "falsified", "still-unknown", "owner-required"], ["proof:semantic"]),
    row("optional-polish-exclusion", "reconciliation-report", "complete", noWave.duplicate === "complete" && noWave.falsified === "complete" && configuredChecks.optionalP2SourceUnchanged === true, 0, 0, "complete", ["optional-polish", "duplicate", "falsified"], ["proof:semantic", "proof:configured"]),
    row("two-frozen-remediation-waves", "configured-controller", "complete", configuredCurrent && configuredChecks.secondWaveMissionConsumed === true, 2, 2, "complete", ["two-waves", "serialized-writers"], ["proof:configured"]),
    row("incomplete-or-failed-mission", "mission-observation", "blocked", controllerVerification.commandFailureExitCode === 1 && controllerVerification.twoWaveMissingMissionExitCode === 2, 0, 0, "complete", ["failed-command", "missing-mission", "parent-mismatch"], ["proof:controller"]),
    row("active-change-conflict", "campaign-preflight", "blocked", controllerNegative.activeChange === 1, 0, 0, "not-required", ["unlisted-active-change"], ["proof:controller"]),
    row("dirty-path-conflict", "campaign-preflight", "blocked", controllerNegative.dirtyWorktree === 1, 0, 0, "not-required", ["dirty-owned-path"], ["proof:controller"]),
    row("protected-effect", "playbook-phase-admission", "owner-required", protectedSplit.status === "owner-required" && ownerOnly.disposition === "owner-required" && ownerSibling.disposition === "paused-external", 0, 0, "complete", ["protected-only", "protected-plus-authorized"], ["proof:semantic", "proof:controller"]),
    row("controller-or-opencode-interruption", "state-semantic-control", "paused-unknown", semanticControls.transientStatus === "paused-transient" && semanticControls.retryAccepted === true && semanticControls.cleanupStatus === "paused-unknown" && controllerNegative.unknownWriter === 1, 0, 0, "unknown", ["transient", "retry-evidence", "cleanup-unknown", "unknown-writer"], ["proof:semantic", "proof:controller", "proof:state"]),
    windowsReentryObserved
      ? row("windows-supervisor-reentry", "windows-host-supervisor", "complete", true, 0, configured.hostEffects as number, "complete", ["installed-task-action", "safe-resume"], ["proof:installed-operator"])
      : row("windows-supervisor-reentry", "windows-host-supervisor", "unknown", true, null, null, "unknown", ["host-not-exercised"], ["gap:windows-supervisor"], "unknown"),
    row("changed-block-rereview", "controller-verification", "complete", configuredCurrent && configuredChecks.rereviewVerified === true && controllerVerification.rereviewValidationStatus === "complete", 0, 0, "complete", ["changed-block-rereview", "current-candidate"], ["proof:configured", "proof:controller"]),
    row("report-drift-prevention", "materializer-readback", "blocked", materializerNegative.reportDrift === 2, 0, 0, "not-required", ["report-drift", "readback"], ["proof:materializer"]),
    row("budget-exhaustion", "semantic-state-budget", "paused-budget", semanticControls.budgetStatus === "paused-budget" && stateNegative.budgetRegression === 2, 0, 0, "complete", ["semantic-budget", "budget-regression"], ["proof:semantic", "proof:state"]),
    row("terminal-completion", "final-challenge-controller", "complete", configuredCurrent && configuredChecks.campaignCompleted === true && controllerVerification.finalTerminalState === "complete" && controllerVerification.unauthorizedTerminalExitCode === 2, 2, 2, "complete", ["current-final-challenge", "overbroad-challenge-blocked"], ["proof:configured", "proof:controller"]),
  ];
}

function evaluatePopulationRaw(raw: JsonRecord, candidateId: string, environmentId: string | null): JsonRecord {
  const resolvedEnvironment = environmentId ?? "missing";
  const rows = buildPopulationRows(raw, candidateId, resolvedEnvironment);
  const observedRows = Array.isArray(raw.populationRows) ? raw.populationRows : [];
  const invocations = Array.isArray(raw.invocations) ? raw.invocations.filter(isRecord) : [];
  const missingCaptures = Array.isArray(raw.missingCaptures) ? raw.missingCaptures : [];
  const effects = isRecord(raw.effects) ? raw.effects : {};
  const controller = isRecord(raw.controller) ? raw.controller : {};
  const semantic = isRecord(raw.semantic) ? raw.semantic : {};
  const configured = isRecord(raw.configured) ? raw.configured : {};
  const hostInput = raw.hostInput === true;
  const configuredInput = classifyPopulationConfiguredInput(configured, hostInput, candidateId, resolvedEnvironment);
  const stateRaw = isRecord(raw.state) ? raw.state : {};
  const materializer = isRecord(raw.materializer) ? raw.materializer : {};
  const invocationFor = (name: string): JsonRecord => invocations.find((row) => row.name === name) ?? {};
  const withInvocation = (component: JsonRecord, name: string, argv: string[]): JsonRecord => ({
    ...component,
    invocation: {
      argv,
      exitCode: invocationFor(name).exitCode ?? null,
      stderr: invocationFor(name).stderr ?? "",
      stdout: invocationFor(name).stdout ?? "",
    },
  });
  const controllerEvaluation = evaluateControllerRaw(
    withInvocation(controller, "controller", ["node", "tools/test-work-campaign-controller.ts"]),
    candidateId,
    resolvedEnvironment,
  );
  const stateEvaluation = evaluateStateRaw(
    withInvocation(stateRaw, "state", ["node", "tools/test-work-campaign.ts"]),
    candidateId,
  );
  const materializerEvaluation = evaluateMaterializerRaw(
    withInvocation(materializer, "materializer", ["node", "tools/test-work-campaign.ts"]),
    candidateId,
  );
  const privacyText = stableJson(raw);
  const rowFields = ["boundary", "candidateId", "cleanup", "disposition", "effectCount", "environmentId", "evidenceRefs", "id", "observed", "rowState", "scenarios", "sourceWriterCount", "support"];
  const ids = rows.map((row) => row.id);
  const checks: Record<string, boolean> = {
    candidateMatched: raw.candidateId === candidateId,
    captureInputsComplete: missingCaptures.length === 0,
    cleanupComplete: raw.cleanup === "complete",
    configuredBaselineComplete: configuredInput.configuredCurrent,
    controllerCurrent: controllerEvaluation.status === "complete",
    environmentMatched: raw.environmentId === resolvedEnvironment,
    exactMemberOrder: stableJson(ids) === stableJson(populationMemberIds),
    hostEffectsZero: effects.hostEffects === 0,
    invocationsExitedZero: invocations.length === 4 && invocations.every((row) => row.exitCode === 0),
    materializerCurrent: materializerEvaluation.status === "complete",
    modelCallsZero: effects.modelCalls === 0,
    nonHostRowsObserved: rows.filter((row) => row.id !== "windows-supervisor-reentry").every((row) => row.observed && row.support === "observed"),
    populationRowsMatched: stableJson(observedRows) === stableJson(rows),
    privacySafe: !/(?:api[_-]?key|password|secret)\s*[:=]\s*\S+/iu.test(privacyText)
      && !/(?:[A-Za-z]:[\\/](?:Users|home)[\\/]|\/home\/)/u.test(privacyText),
    providerCallsZero: effects.providerCalls === 0 && nestedRecord(semantic, "effects")?.providerCalls === 0,
    rowFieldsExact: observedRows.length === populationMemberIds.length && observedRows.every((row) => exactFields(row, rowFields)),
    rowIdentitiesExact: rows.every((row) => row.candidateId === candidateId && row.environmentId === resolvedEnvironment),
    sourceEvaluationCurrent: true,
    sourceWritesZero: effects.sourceWrites === 0,
    stateCurrent: stateEvaluation.status === "complete",
    terminalRowsUnique: rows.length === populationMemberIds.length && new Set(ids).size === populationMemberIds.length
      && rows.every((row) => row.rowState === "terminal-observation" && row.evidenceRefs.length > 0 && row.scenarios.length > 0),
    ...(hostInput
      ? { windowsObserved: rows.find((row) => row.id === "windows-supervisor-reentry")?.support === "observed" }
      : { windowsExplicitUnknown: rows.find((row) => row.id === "windows-supervisor-reentry")?.support === "unknown" }),
  };
  return {
    candidateId,
    checks,
    environmentId: resolvedEnvironment,
    hostEffects: 0,
    liveCalls: typeof effects.processStarts === "number" ? effects.processStarts : 0,
    memberCount: rows.length,
    modelCalls: 0,
    processStarts: typeof effects.processStarts === "number" ? effects.processStarts : 0,
    proofKind: hostInput ? "campaign-composed-population" : "campaign-provider-free-population",
    schemaVersion: 1,
    sourceWrites: 0,
    status: Object.values(checks).every(Boolean) ? "complete" : "blocked",
    supportedMembers: rows.filter((row) => row.support === "observed" && row.observed).length,
  };
}

function writeBundle(root: string, files: Record<string, string>): void {
  if (fs.existsSync(root)) throw new Error("Evidence root already exists");
  fs.mkdirSync(root, { recursive: false });
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(root, name), content, { encoding: "utf8", flag: "wx" });
  }
}

function preflight(options: Options): void {
  const packText = fs.readFileSync(options.fixturePath, "utf8");
  const pack = JSON.parse(packText) as unknown;
  validatePack(pack);
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "work-campaign-proof-"));
  let cleanup = "unknown";
  let beforeDigest = "unknown";
  let afterDigest = "unknown";
  try {
    const sourceFile = path.join(fixtureRoot, "src", "fixture.txt");
    fs.mkdirSync(path.dirname(sourceFile), { recursive: true });
    fs.writeFileSync(sourceFile, "provider-free fixture\n", "utf8");
    beforeDigest = digestBytes(fs.readFileSync(sourceFile));
    const scenarios = materializeScenarios(pack);
    afterDigest = digestBytes(fs.readFileSync(sourceFile));
    if (!scenarioExpectationsPassed(scenarios)) throw new Error("Reviewed scenario expectation failed");
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
    cleanup = fs.existsSync(fixtureRoot) ? "unknown" : "complete";
  }
  if (cleanup !== "complete") throw new Error("Fixture cleanup failed");
  const scenarios = materializeScenarios(pack);
  const raw: JsonRecord = {
    candidateId: options.candidateId,
    cleanup,
    effects: {
      hostEffects: 0,
      processStarts: 0,
      providerCalls: 0,
    },
    environment: {
      node: process.version,
      platform: process.platform,
    },
    fixturePack: pack,
    fixturePackDigest: digestValue(pack),
    fixturePath: path.relative(sourceRoot, options.fixturePath).replace(/\\/gu, "/"),
    projectManifest: {
      afterDigest,
      beforeDigest,
      sourceWrites: 0,
    },
    runnerDigest: digestBytes(fs.readFileSync(runnerPath)),
    scenarios,
    schemaVersion: 1,
  };
  const evaluation = evaluateRaw(raw, options.candidateId);
  writeBundle(options.evidenceRoot, {
    "raw.json": stableJson(raw),
    "evaluation.json": stableJson(evaluation),
  });
  console.log(stableJson({
    candidateId: options.candidateId,
    evidenceRoot: "<evidence-root>",
    liveCalls: 0,
    mode: "preflight",
    status: evaluation.status,
  }).trimEnd());
  if (evaluation.status !== "complete") process.exitCode = 1;
}

function state(options: Options): void {
  if (fs.existsSync(options.evidenceRoot)) throw new Error("Evidence root already exists");
  const captureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "work-campaign-state-capture-"));
  const capturedRawPath = path.join(captureRoot, "raw.json");
  let capture: ReturnType<typeof spawnSync> | null = null;
  let capturedRaw: JsonRecord | null = null;
  try {
    capture = spawnSync(process.execPath, [path.join(sourceRoot, "tools", "test-work-campaign.ts")], {
      cwd: sourceRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        WORK_CAMPAIGN_STATE_CANDIDATE_ID: options.candidateId,
        WORK_CAMPAIGN_STATE_RAW_PATH: capturedRawPath,
      },
      shell: false,
      timeout: 120_000,
    });
    if (fs.existsSync(capturedRawPath)) capturedRaw = JSON.parse(fs.readFileSync(capturedRawPath, "utf8")) as JsonRecord;
  } finally {
    fs.rmSync(captureRoot, { recursive: true, force: true });
  }
  const raw: JsonRecord = capturedRaw ?? {
    candidateId: options.candidateId,
    cleanup: "unknown",
    commands: [],
    effects: { gitCalls: 0, hostEffects: 0, openSpecCalls: 0, processStarts: 0, providerCalls: 0, sourceWrites: 0 },
    negativeControls: {},
    proofKind: "campaign-state-restart",
    restart: {},
    schemaVersion: 1,
    sourceCandidate: [],
    sourceManifest: {},
  };
  raw.invocation = {
    argv: ["node", "tools/test-work-campaign.ts"],
    exitCode: capture?.status ?? null,
    stderr: (capture?.stderr ?? "capture did not start").slice(0, 5_000),
    stdout: (capture?.stdout ?? "").slice(0, 5_000),
  };
  const evaluation = evaluateStateRaw(raw, options.candidateId);
  writeBundle(options.evidenceRoot, {
    "raw.json": stableJson(raw),
    "evaluation.json": stableJson(evaluation),
  });
  console.log(stableJson({
    candidateId: options.candidateId,
    evidenceRoot: "<evidence-root>",
    mode: "state",
    processStarts: evaluation.processStarts,
    status: evaluation.status,
  }).trimEnd());
  if (evaluation.status !== "complete") process.exitCode = 1;
}

function materializer(options: Options): void {
  if (fs.existsSync(options.evidenceRoot)) throw new Error("Evidence root already exists");
  const captureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "work-campaign-materializer-capture-"));
  const capturedRawPath = path.join(captureRoot, "raw.json");
  let capture: ReturnType<typeof spawnSync> | null = null;
  let capturedRaw: JsonRecord | null = null;
  try {
    capture = spawnSync(process.execPath, [path.join(sourceRoot, "tools", "test-work-campaign.ts")], {
      cwd: sourceRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        WORK_CAMPAIGN_MATERIALIZER_CANDIDATE_ID: options.candidateId,
        WORK_CAMPAIGN_MATERIALIZER_RAW_PATH: capturedRawPath,
      },
      shell: false,
      timeout: 120_000,
    });
    if (fs.existsSync(capturedRawPath)) capturedRaw = JSON.parse(fs.readFileSync(capturedRawPath, "utf8")) as JsonRecord;
  } finally {
    fs.rmSync(captureRoot, { recursive: true, force: true });
  }
  const raw: JsonRecord = capturedRaw ?? {
    candidateId: options.candidateId,
    cleanup: "unknown",
    commands: [],
    effects: { gitCalls: 0, hostEffects: 0, openSpecCalls: 0, processStarts: 0, providerCalls: 0, sourceWrites: 0 },
    negativeControls: {},
    proofKind: "campaign-ledger-report-materializer",
    regeneration: {},
    schemaVersion: 1,
    sourceCandidate: [],
    sourceManifest: {},
  };
  raw.invocation = {
    argv: ["node", "tools/test-work-campaign.ts"],
    exitCode: capture?.status ?? null,
    stderr: (capture?.stderr ?? "capture did not start").slice(0, 5_000),
    stdout: (capture?.stdout ?? "").slice(0, 5_000),
  };
  const evaluation = evaluateMaterializerRaw(raw, options.candidateId);
  writeBundle(options.evidenceRoot, {
    "raw.json": stableJson(raw),
    "evaluation.json": stableJson(evaluation),
  });
  console.log(stableJson({
    candidateId: options.candidateId,
    evidenceRoot: "<evidence-root>",
    mode: "materializer",
    processStarts: evaluation.processStarts,
    status: evaluation.status,
  }).trimEnd());
  if (evaluation.status !== "complete") process.exitCode = 1;
}

function controller(options: Options): void {
  if (fs.existsSync(options.evidenceRoot)) throw new Error("Evidence root already exists");
  const captureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "work-campaign-controller-capture-"));
  const capturedRawPath = path.join(captureRoot, "raw.json");
  let capture: ReturnType<typeof spawnSync> | null = null;
  let capturedRaw: JsonRecord | null = null;
  try {
    capture = spawnSync(process.execPath, [path.join(sourceRoot, "tools", "test-work-campaign-controller.ts")], {
      cwd: sourceRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        WORK_CAMPAIGN_CONTROLLER_CANDIDATE_ID: options.candidateId,
        WORK_CAMPAIGN_CONTROLLER_ENVIRONMENT_ID: options.environmentId ?? "",
        WORK_CAMPAIGN_CONTROLLER_RAW_PATH: capturedRawPath,
      },
      shell: false,
      timeout: 180_000,
    });
    if (fs.existsSync(capturedRawPath)) capturedRaw = JSON.parse(fs.readFileSync(capturedRawPath, "utf8")) as JsonRecord;
  } finally {
    fs.rmSync(captureRoot, { recursive: true, force: true });
  }
  const raw: JsonRecord = capturedRaw ?? {
    candidateId: options.candidateId,
    cleanup: "unknown",
    ...(options.environmentId == null ? {} : { environmentId: options.environmentId }),
    commands: [],
    effects: { controllerGitMutationCalls: 0, controllerOpenSpecMutationCalls: 0, fixtureGitMutationCalls: 0, fixtureOpenSpecMutationCalls: 0, hostEffects: 0, missionCalls: 0, openCodeCalls: 0, processStarts: 0, providerCalls: 0, sourceWrites: 0 },
    negativeControls: {},
    proofKind: "campaign-provider-free-controller",
    report: {},
    schemaVersion: 1,
    sourceCandidate: [],
    sourceManifest: {},
    transitions: {},
  };
  raw.invocation = {
    argv: ["node", "tools/test-work-campaign-controller.ts"],
    exitCode: capture?.status ?? null,
    stderr: (capture?.stderr ?? "capture did not start").slice(0, 5_000),
    stdout: (capture?.stdout ?? "").slice(0, 5_000),
  };
  const evaluation = evaluateControllerRaw(raw, options.candidateId, options.environmentId);
  writeBundle(options.evidenceRoot, {
    "raw.json": stableJson(raw),
    "evaluation.json": stableJson(evaluation),
  });
  console.log(stableJson({
    candidateId: options.candidateId,
    evidenceRoot: "<evidence-root>",
    mode: "controller",
    processStarts: evaluation.processStarts,
    status: evaluation.status,
  }).trimEnd());
  if (evaluation.status !== "complete") process.exitCode = 1;
}

function windows(options: Options): void {
  if (options.environmentId == null) throw new Error("Windows source-plan capture requires --environment-id");
  if (fs.existsSync(options.evidenceRoot)) throw new Error("Evidence root already exists");
  const captureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "work-campaign-windows-capture-"));
  const capturedRawPath = path.join(captureRoot, "raw.json");
  const beforeDigests = windowsSourcePaths.map((relative) => digestBytes(fs.readFileSync(path.join(sourceRoot, relative))));
  let capture: ReturnType<typeof spawnSync> | null = null;
  let capturedRaw: JsonRecord | null = null;
  try {
    capture = spawnSync(process.execPath, [path.join(sourceRoot, "tools", "test-work-campaign-windows.ts")], {
      cwd: sourceRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        WORK_CAMPAIGN_WINDOWS_CANDIDATE_ID: options.candidateId,
        WORK_CAMPAIGN_WINDOWS_ENVIRONMENT_ID: options.environmentId,
        WORK_CAMPAIGN_WINDOWS_RAW_PATH: capturedRawPath,
      },
      shell: false,
      timeout: 180_000,
    });
    if (fs.existsSync(capturedRawPath)) capturedRaw = JSON.parse(fs.readFileSync(capturedRawPath, "utf8")) as JsonRecord;
  } finally {
    fs.rmSync(captureRoot, { recursive: true, force: true });
  }
  const afterDigests = windowsSourcePaths.map((relative) => digestBytes(fs.readFileSync(path.join(sourceRoot, relative))));
  const raw: JsonRecord = capturedRaw ?? {
    candidateId: options.candidateId,
    cleanup: "unknown",
    completedOracles: [],
    effects: { hostMutations: 0, openCodeCalls: 0, processStarts: 0, providerCalls: 0, sourceWrites: 0 },
    environmentId: options.environmentId,
    proofKind: "campaign-windows-source-plan",
    schemaVersion: 1,
  };
  const effects = isRecord(raw.effects) ? raw.effects : {};
  raw.effects = { ...effects, processStarts: 1 };
  raw.invocation = {
    argv: ["node", "tools/test-work-campaign-windows.ts"],
    exitCode: capture?.status ?? null,
    stderr: (capture?.stderr ?? "capture did not start").slice(0, 5_000),
    stdout: (capture?.stdout ?? "").slice(0, 5_000),
  };
  raw.sourceCandidate = windowsSourcePaths.map((relative) => ({
    path: relative,
    sha256: crypto.createHash("sha256").update(fs.readFileSync(path.join(sourceRoot, relative))).digest("hex"),
  }));
  raw.sourceManifest = { afterDigests, beforeDigests, sourceWrites: 0 };
  const evaluation = evaluateWindowsRaw(raw, options.candidateId, options.environmentId);
  writeBundle(options.evidenceRoot, { "raw.json": stableJson(raw), "evaluation.json": stableJson(evaluation) });
  console.log(stableJson({
    candidateId: options.candidateId,
    evidenceRoot: "<evidence-root>",
    mode: "windows",
    processStarts: evaluation.processStarts,
    status: evaluation.status,
  }).trimEnd());
  if (evaluation.status !== "complete") process.exitCode = 1;
}

function population(options: Options): void {
  const configuredInputRoot = options.hostInputRoot ?? options.inputRoot;
  if (configuredInputRoot == null || options.environmentId == null) throw new Error("Population inputs are missing");
  if (fs.existsSync(options.evidenceRoot)) throw new Error("Evidence root already exists");
  const configuredEvaluationPath = path.join(configuredInputRoot, "evaluation.json");
  if (!fs.existsSync(configuredEvaluationPath)) throw new Error("Population input root has no evaluation.json");
  const captureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "work-campaign-population-capture-"));
  const controllerPath = path.join(captureRoot, "controller.json");
  const semanticPath = path.join(captureRoot, "semantic.json");
  const statePath = path.join(captureRoot, "state.json");
  const materializerPath = path.join(captureRoot, "materializer.json");
  const invocations: Array<{ exitCode: number | null; name: string; stderr: string; stdout: string }> = [];
  let controllerRaw: JsonRecord = {};
  let semanticRaw: JsonRecord = {};
  let stateRaw: JsonRecord = {};
  let materializerRaw: JsonRecord = {};
  let cleanup = "unknown";
  let missingCaptures: string[] = [];
  const invoke = (name: string, script: string, env: NodeJS.ProcessEnv): ReturnType<typeof spawnSync> => {
    const result = spawnSync(process.execPath, [path.join(sourceRoot, script)], {
      cwd: sourceRoot,
      encoding: "utf8",
      env: { ...process.env, ...env },
      shell: false,
      timeout: 180_000,
    });
    invocations.push({
      exitCode: result.status,
      name,
      stderr: (result.stderr ?? "").slice(0, 5_000),
      stdout: (result.stdout ?? "").slice(0, 5_000),
    });
    return result;
  };
  try {
    invoke("controller", "tools/test-work-campaign-controller.ts", {
      WORK_CAMPAIGN_CONTROLLER_CANDIDATE_ID: options.candidateId,
      WORK_CAMPAIGN_CONTROLLER_ENVIRONMENT_ID: options.environmentId,
      WORK_CAMPAIGN_CONTROLLER_RAW_PATH: controllerPath,
    });
    invoke("semantic", "tools/test-work-campaign-semantic-playbook.ts", {
      WORK_CAMPAIGN_SEMANTIC_CANDIDATE_ID: options.candidateId,
      WORK_CAMPAIGN_SEMANTIC_RAW_PATH: semanticPath,
    });
    invoke("state", "tools/test-work-campaign.ts", {
      WORK_CAMPAIGN_STATE_CANDIDATE_ID: options.candidateId,
      WORK_CAMPAIGN_STATE_RAW_PATH: statePath,
    });
    invoke("materializer", "tools/test-work-campaign.ts", {
      WORK_CAMPAIGN_MATERIALIZER_CANDIDATE_ID: options.candidateId,
      WORK_CAMPAIGN_MATERIALIZER_RAW_PATH: materializerPath,
    });
    const captures = [
      ["controller", controllerPath],
      ["semantic", semanticPath],
      ["state", statePath],
      ["materializer", materializerPath],
    ] as const;
    missingCaptures = captures.flatMap(([name, file]) => fs.existsSync(file) ? [] : [name]);
    if (fs.existsSync(controllerPath)) controllerRaw = JSON.parse(fs.readFileSync(controllerPath, "utf8")) as JsonRecord;
    if (fs.existsSync(semanticPath)) semanticRaw = JSON.parse(fs.readFileSync(semanticPath, "utf8")) as JsonRecord;
    if (fs.existsSync(statePath)) stateRaw = JSON.parse(fs.readFileSync(statePath, "utf8")) as JsonRecord;
    if (fs.existsSync(materializerPath)) materializerRaw = JSON.parse(fs.readFileSync(materializerPath, "utf8")) as JsonRecord;
  } finally {
    fs.rmSync(captureRoot, { recursive: true, force: true });
    cleanup = fs.existsSync(captureRoot) ? "unknown" : "complete";
  }
  const configuredText = fs.readFileSync(configuredEvaluationPath, "utf8");
  const configured = JSON.parse(configuredText) as JsonRecord;
  const controllerEffects = isRecord(controllerRaw.effects) ? controllerRaw.effects : {};
  const stateEffects = isRecord(stateRaw.effects) ? stateRaw.effects : {};
  const materializerEffects = isRecord(materializerRaw.effects) ? materializerRaw.effects : {};
  const processStarts = invocations.length
    + (typeof controllerEffects.processStarts === "number" ? controllerEffects.processStarts : 0)
    + (typeof stateEffects.processStarts === "number" ? stateEffects.processStarts : 0)
    + (typeof materializerEffects.processStarts === "number" ? materializerEffects.processStarts : 0);
  const raw: JsonRecord = {
    candidateId: options.candidateId,
    cleanup,
    configured: {
      ...configured,
      evaluationDigest: digestBytes(configuredText),
      inputBundle: path.basename(configuredInputRoot),
    },
    controller: controllerRaw,
    effects: { hostEffects: 0, modelCalls: 0, processStarts, providerCalls: 0, sourceWrites: 0 },
    environment: { node: process.version, platform: process.platform },
    environmentId: options.environmentId,
    hostInput: options.hostInputRoot != null,
    invocations,
    materializer: materializerRaw,
    missingCaptures,
    populationRows: [],
    proofKind: options.hostInputRoot == null ? "campaign-provider-free-population" : "campaign-composed-population",
    runnerDigest: digestBytes(fs.readFileSync(runnerPath)),
    schemaVersion: 1,
    semantic: semanticRaw,
    state: stateRaw,
  };
  raw.populationRows = buildPopulationRows(raw, options.candidateId, options.environmentId);
  const evaluation = evaluatePopulationRaw(raw, options.candidateId, options.environmentId);
  writeBundle(options.evidenceRoot, {
    "raw.json": stableJson(raw),
    "evaluation.json": stableJson(evaluation),
  });
  console.log(stableJson({
    candidateId: options.candidateId,
    evidenceRoot: "<evidence-root>",
    memberCount: evaluation.memberCount,
    mode: "population",
    modelCalls: 0,
    processStarts: evaluation.processStarts,
    status: evaluation.status,
  }).trimEnd());
  if (evaluation.status !== "complete") process.exitCode = 1;
}

function replay(options: Options): void {
  if (options.inputRoot == null) throw new Error("Replay input root is missing");
  const raw = JSON.parse(fs.readFileSync(path.join(options.inputRoot, "raw.json"), "utf8")) as JsonRecord;
  const sourceEvaluation = JSON.parse(fs.readFileSync(path.join(options.inputRoot, "evaluation.json"), "utf8")) as JsonRecord;
  const evaluation = raw.proofKind === "campaign-provider-free-population" || raw.proofKind === "campaign-composed-population"
    ? evaluatePopulationRaw(raw, options.candidateId, options.environmentId)
    : raw.proofKind === "campaign-windows-source-plan"
    ? evaluateWindowsRaw(raw, options.candidateId, options.environmentId)
    : raw.proofKind === "campaign-state-restart"
    ? evaluateStateRaw(raw, options.candidateId)
    : raw.proofKind === "campaign-provider-free-controller"
      ? evaluateControllerRaw(raw, options.candidateId, options.environmentId)
    : raw.proofKind === "campaign-ledger-report-materializer"
      ? evaluateMaterializerRaw(raw, options.candidateId)
      : evaluateRaw(raw, options.candidateId);
  if (stableJson(sourceEvaluation) !== stableJson(evaluation)) {
    (evaluation.checks as Record<string, boolean>).sourceEvaluationCurrent = false;
    evaluation.status = "blocked";
  }
  writeBundle(options.evidenceRoot, { "evaluation.json": stableJson(evaluation) });
  console.log(stableJson({
    candidateId: options.candidateId,
    evidenceRoot: "<evidence-root>",
    liveCalls: 0,
    mode: "replay",
    status: evaluation.status,
  }).trimEnd());
  if (evaluation.status !== "complete") process.exitCode = 1;
}

function isMainModule(): boolean {
  const entrypoint = process.argv[1];
  return entrypoint != null && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href;
}

if (isMainModule()) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) console.log(usage());
    else if (options.mode === "replay") replay(options);
    else if (options.mode === "controller") controller(options);
    else if (options.mode === "materializer") materializer(options);
    else if (options.mode === "population") population(options);
    else if (options.mode === "state") state(options);
    else if (options.mode === "windows") windows(options);
    else preflight(options);
  } catch (error) {
    console.error(stableJson({
      error: error instanceof Error ? error.message : String(error),
      status: "blocked",
    }).trimEnd());
    process.exitCode = 1;
  }
}
