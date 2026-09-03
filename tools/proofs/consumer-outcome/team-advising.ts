import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { runPortableCommand } from "../../../global/bin/portable-process.ts";
import { loadModelProfile } from "../../model-profile.ts";
import { materializeRuntimeSurfaceProfile } from "../../runtime-surface-profile.ts";
import { configuredProofServerEnvironment, installedOpenCodeIdentity, seedProofModelsCatalog } from "../lib/opencode-proof-client.ts";
import { assertPrivacySafe, containsPrivatePath, digestOf, redactPrivacyMarkers, sha256, stableJson, writeNewFile } from "./contracts.ts";

const PACK_PATH = "tools/proofs/fixtures/consumer-outcome/team-advising-r1.json";
const FIXTURE_PATH = "tools/proofs/fixtures/consumer-outcome/team-advising-v1";
const ADVISOR = "specialist-team-advisor";
const CATALOG_TOOL = "specialist_catalog";
const MEMBER_ORDER = [
  "trivial-owner-local-direct",
  "non-trivial-complete-direct",
  "competing-maintained-routes",
  "unique-independent-evidence",
  "unresolved-isolation-delegation",
  "exact-practice-owner-direct",
  "direct-contracts-non-bypass",
  "unavailable-required-capability",
  "catalog-outage-scoped",
  "overstaffing-negative-control",
] as const;

type TeamArm = "baseline" | "candidate";
type AdviceState = "main-alone" | "team-recommended" | "unknown";
type MainDisposition = "direct" | AdviceState;
type ForbiddenEffectName = "credential-read" | "destructive-action" | "external-directory" | "install" | "remote" | "target-worktree-write";
type AdvisorUncertainty = "catalog-unavailable" | "competing-maintained-routes" | "none" | "unique-independent-evidence" | "unavailable-required-capability" | "unresolved-isolation-delegation";
type TeamCatalogFault = "api-unavailable" | "none";
type TeamCatalogObservation = {
  agentCount: number;
  catalogRefPresent: boolean;
  cause: string | null;
  skillCount: number;
  status: "denied" | "ok" | "unknown";
};

type DirectRouteFacts = {
  current: boolean;
  delegationIsolationResolved: boolean;
  executionRouteSelected: boolean;
  independentEvidenceSelectionResolved: boolean;
  maintainedRouteChoiceResolved: boolean;
  proofBoundaryKnown: boolean;
  requiredCapabilityAvailable: boolean;
  semanticOwnerKnown: boolean;
};

type TeamExpectation = {
  acceptedPackageCount?: number;
  acceptedPackages?: string[];
  advisorCalls: number;
  adviceStates?: AdviceState[];
  catalogCalls: number;
  mainDisposition?: MainDisposition;
  specialistAgents?: string[];
  skillIds?: string[];
  unavailableCapabilities?: string[];
};

type TeamScenario = {
  advisorUncertainty: AdvisorUncertainty;
  catalogFault: TeamCatalogFault;
  caseFacts: string[];
  directRouteFacts: DirectRouteFacts;
  expected: {
    baseline: TeamExpectation;
    candidate: TeamExpectation;
    changedPaths: string[];
    rootProofRequired: boolean;
    workerCompletedBeforeProof: boolean;
  };
  id: string;
  objective: string;
  permissions: { skills: string[]; taskAgents: string[] };
  requiredRoutes: string[];
  turns: string[];
};

export type TeamAdvisingPack = {
  configuredProviderRequestBound: number;
  governedSourcePaths: string[];
  id: string;
  maximumClaim: string;
  memberOrder: string[];
  profile: string;
  runtimeProfile: "core";
  scenarios: TeamScenario[];
  schemaVersion: 1;
};

type SourcePathIdentity = {
  path: string;
  sha256: string | null;
  status: "absent" | "present";
};

export type TeamSourceIdentity = {
  gitRef: string;
  governedDigest: string;
  kind: "staged-ref" | "working-tree";
  pathDigests: SourcePathIdentity[];
};

type ToolEvent = {
  agent: string | null;
  argumentDigest: string;
  childRef: string | null;
  index: number;
  model: string | null;
  name: string;
  output: string | null;
  parentRef: string | null;
  status: string | null;
  subject: string | null;
  turn: number;
};

type TeamCommandEvidence = {
  argv: string[];
  elapsedMs: number;
  status: number | null;
  stderr: string;
  stdout: string;
  turn: number;
};

type TeamResult = {
  acceptedPackages: string[];
  caseId: string;
  mainDisposition: MainDisposition;
  missionOutcome: "complete";
  reconsultationCondition: string;
  schemaVersion: 1;
  unavailableCapabilities: string[];
};

export type TeamSampleEvidence = {
  adviceStates: AdviceState[];
  arm: TeamArm;
  catalogCalls: number;
  catalogFault: TeamCatalogFault;
  catalogObservations: TeamCatalogObservation[];
  childExports: Array<{ childRef: string; status: number | null; toolNames: string[] }>;
  cleanup: {
    complete: boolean;
    error: string | null;
    fixtureRemoved: boolean;
    processesRemoved: boolean;
    remainingSessions: number | null;
    sessionsRemoved: boolean;
  };
  commands: TeamCommandEvidence[];
  configuredProviderRequestCount: number;
  files: Array<{ path: string; sha256: string }>;
  fixtureDigest: string;
  forbiddenEffects: Array<{ name: ForbiddenEffectName; observed: boolean; oracle?: "git-status-digest" | "tool-input-sentinel" | "tool-path-envelope" }>;
  hashes: { sample: string };
  privacyRedactions: Record<string, number>;
  proof: { argv: string[]; status: number | null; stderr: string; stdout: string };
  result: TeamResult | null;
  rootRef: string | null;
  scenarioId: string;
  sourceUnchanged: boolean;
  taskEvents: ToolEvent[];
  toolEvents: ToolEvent[];
  workerCompletedBeforeProof: boolean;
};

export type TeamBundle = {
  arm: TeamArm;
  bundleDigest: string;
  byteLength: number;
  candidateId: string;
  derivation?: { kind: "privacy-redaction"; sourceBundleDigest: string };
  environment: {
    installedOpenCode: { sha256: string; version: string };
    model: string;
    node: string;
    platform: string;
    profile: string;
    runtimeProfile: string;
    variant: string;
  };
  packDigest: string;
  samples: TeamSampleEvidence[];
  schemaVersion: 1;
  sourceIdentity: TeamSourceIdentity;
};

export type TeamEvaluation = {
  bundleDigests: { baseline: string | null; candidate: string | null };
  evaluationDigest: string;
  maximumClaim: string;
  modelCalls: number;
  rows: Array<{
    arm: TeamArm;
    failures: string[];
    passed: boolean;
    scenarioId: string;
  }>;
  status: "blocked" | "failed" | "passed";
};

export type TeamSampleSummary = {
  adviceStates: AdviceState[];
  advisorCalls: number;
  catalogCalls: number;
  catalogFault: TeamCatalogFault;
  catalogObservations: TeamCatalogObservation[];
  cleanup: TeamSampleEvidence["cleanup"];
  commands: Array<Omit<TeamCommandEvidence, "stdout"> & { stdoutTail: string }>;
  configuredProviderRequestCount: number;
  directRouteFacts: DirectRouteFacts;
  files: TeamSampleEvidence["files"];
  forbiddenEffects: TeamSampleEvidence["forbiddenEffects"];
  proof: TeamSampleEvidence["proof"];
  requiredRoutes: string[];
  result: TeamResult | null;
  scenarioId: string;
  sourceUnchanged: boolean;
  toolEvents: Array<Pick<ToolEvent, "agent" | "index" | "name" | "status" | "subject" | "turn">>;
};

type CaptureOptions = {
  arm: TeamArm;
  candidateId: string;
  diagnostic?: boolean;
  evidenceRoot: string;
  executable: string;
  gitRef: string;
  repoRoot: string;
  scenarioIds?: string[];
};

function record(value: unknown, label: string): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value as Record<string, unknown>;
}

function strings(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) throw new Error(`${label} must be a string array`);
  return value as string[];
}

function integer(value: unknown, label: string): number {
  if (!Number.isInteger(value) || (value as number) < 0) throw new Error(`${label} must be a non-negative integer`);
  return value as number;
}

function string(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${label} must be a non-empty string`);
  return value;
}

function parseExpectation(value: unknown, label: string): TeamExpectation {
  const source = record(value, label);
  const parsed: TeamExpectation = {
    advisorCalls: integer(source.advisorCalls, `${label}.advisorCalls`),
    catalogCalls: integer(source.catalogCalls, `${label}.catalogCalls`),
  };
  if (source.acceptedPackageCount != null) parsed.acceptedPackageCount = integer(source.acceptedPackageCount, `${label}.acceptedPackageCount`);
  if (source.acceptedPackages != null) parsed.acceptedPackages = strings(source.acceptedPackages, `${label}.acceptedPackages`);
  if (parsed.acceptedPackageCount != null && parsed.acceptedPackages != null) throw new Error(`${label} cannot define acceptedPackageCount and acceptedPackages together`);
  if (source.adviceStates != null) parsed.adviceStates = strings(source.adviceStates, `${label}.adviceStates`) as AdviceState[];
  if (source.mainDisposition != null) parsed.mainDisposition = string(source.mainDisposition, `${label}.mainDisposition`) as MainDisposition;
  if (source.specialistAgents != null) parsed.specialistAgents = strings(source.specialistAgents, `${label}.specialistAgents`);
  if (source.skillIds != null) parsed.skillIds = strings(source.skillIds, `${label}.skillIds`);
  if (source.unavailableCapabilities != null) parsed.unavailableCapabilities = strings(source.unavailableCapabilities, `${label}.unavailableCapabilities`);
  return parsed;
}

function parseDirectRouteFacts(value: unknown, label: string): DirectRouteFacts {
  const source = record(value, label);
  const keys = [
    "current",
    "delegationIsolationResolved",
    "executionRouteSelected",
    "independentEvidenceSelectionResolved",
    "maintainedRouteChoiceResolved",
    "proofBoundaryKnown",
    "requiredCapabilityAvailable",
    "semanticOwnerKnown",
  ];
  assert.deepEqual(Object.keys(source).sort(), keys);
  for (const key of keys) assert.equal(typeof source[key], "boolean", `${label}.${key} must be boolean`);
  return {
    current: source.current as boolean,
    delegationIsolationResolved: source.delegationIsolationResolved as boolean,
    executionRouteSelected: source.executionRouteSelected as boolean,
    independentEvidenceSelectionResolved: source.independentEvidenceSelectionResolved as boolean,
    maintainedRouteChoiceResolved: source.maintainedRouteChoiceResolved as boolean,
    proofBoundaryKnown: source.proofBoundaryKnown as boolean,
    requiredCapabilityAvailable: source.requiredCapabilityAvailable as boolean,
    semanticOwnerKnown: source.semanticOwnerKnown as boolean,
  };
}

function parsePack(value: unknown): TeamAdvisingPack {
  const source = record(value, "teamAdvisingPack");
  assert.equal(source.schemaVersion, 1);
  assert.equal(source.id, "team-advising-r1");
  assert.equal(source.profile, "quality-independent");
  assert.equal(source.runtimeProfile, "core");
  const memberOrder = strings(source.memberOrder, "teamAdvisingPack.memberOrder");
  assert.deepEqual(memberOrder, [...MEMBER_ORDER]);
  const rawScenarios = source.scenarios;
  if (!Array.isArray(rawScenarios) || rawScenarios.length !== MEMBER_ORDER.length) throw new Error("teamAdvisingPack.scenarios must contain ten records");
  const scenarios = rawScenarios.map((value, index): TeamScenario => {
    const row = record(value, `scenarios[${index}]`);
    const permissions = record(row.permissions, `scenarios[${index}].permissions`);
    const expected = record(row.expected, `scenarios[${index}].expected`);
    const scenario: TeamScenario = {
      advisorUncertainty: string(row.advisorUncertainty, `scenarios[${index}].advisorUncertainty`) as AdvisorUncertainty,
      catalogFault: string(row.catalogFault, `scenarios[${index}].catalogFault`) as TeamCatalogFault,
      caseFacts: strings(row.caseFacts, `scenarios[${index}].caseFacts`),
      directRouteFacts: parseDirectRouteFacts(row.directRouteFacts, `scenarios[${index}].directRouteFacts`),
      expected: {
        baseline: parseExpectation(expected.baseline, `scenarios[${index}].expected.baseline`),
        candidate: parseExpectation(expected.candidate, `scenarios[${index}].expected.candidate`),
        changedPaths: strings(expected.changedPaths, `scenarios[${index}].expected.changedPaths`),
        rootProofRequired: expected.rootProofRequired === true,
        workerCompletedBeforeProof: expected.workerCompletedBeforeProof === true,
      },
      id: string(row.id, `scenarios[${index}].id`),
      objective: string(row.objective, `scenarios[${index}].objective`),
      permissions: {
        skills: strings(permissions.skills, `scenarios[${index}].permissions.skills`),
        taskAgents: strings(permissions.taskAgents, `scenarios[${index}].permissions.taskAgents`),
      },
      requiredRoutes: strings(row.requiredRoutes, `scenarios[${index}].requiredRoutes`),
      turns: strings(row.turns, `scenarios[${index}].turns`),
    };
    assert.equal(scenario.id, MEMBER_ORDER[index]);
    assert.equal(scenario.turns.length, 1);
    assert.ok(["catalog-unavailable", "competing-maintained-routes", "none", "unique-independent-evidence", "unavailable-required-capability", "unresolved-isolation-delegation"].includes(scenario.advisorUncertainty));
    assert.ok(["api-unavailable", "none"].includes(scenario.catalogFault));
    assert.equal(new Set(scenario.permissions.taskAgents).size, scenario.permissions.taskAgents.length);
    assert.equal(new Set(scenario.permissions.skills).size, scenario.permissions.skills.length);
    return scenario;
  });
  const requestBound = integer(source.configuredProviderRequestBound, "teamAdvisingPack.configuredProviderRequestBound");
  assert.equal(requestBound, scenarios.reduce((sum, scenario) => sum + scenario.turns.length, 0) * 2);
  return {
    configuredProviderRequestBound: requestBound,
    governedSourcePaths: strings(source.governedSourcePaths, "teamAdvisingPack.governedSourcePaths"),
    id: "team-advising-r1",
    maximumClaim: string(source.maximumClaim, "teamAdvisingPack.maximumClaim"),
    memberOrder,
    profile: "quality-independent",
    runtimeProfile: "core",
    scenarios,
    schemaVersion: 1,
  };
}

export function loadTeamAdvisingPack(repoRoot: string): { digest: string; pack: TeamAdvisingPack } {
  const pack = parsePack(JSON.parse(fs.readFileSync(path.join(repoRoot, PACK_PATH), "utf8")));
  for (const relative of ["check-result.ts", "note.txt"]) {
    if (!fs.statSync(path.join(repoRoot, FIXTURE_PATH, relative)).isFile()) throw new Error(`Team advising fixture is missing: ${relative}`);
  }
  return { digest: digestOf(pack), pack };
}

function listFiles(root: string): string[] {
  const output: string[] = [];
  const walk = (current: string): void => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) output.push(path.relative(root, full).replaceAll("\\", "/"));
    }
  };
  if (fs.existsSync(root)) walk(root);
  return output;
}

function pathIdentities(repoRoot: string, gitRef: string, governed: string[]): TeamSourceIdentity {
  const workingTree = gitRef === "working-tree";
  const identities: SourcePathIdentity[] = [];
  for (const relative of governed) {
    if (workingTree) {
      const full = path.join(repoRoot, relative);
      if (!fs.existsSync(full)) {
        identities.push({ path: relative, sha256: null, status: "absent" });
      } else if (fs.statSync(full).isDirectory()) {
        for (const child of listFiles(full)) {
          const item = `${relative}/${child}`.replaceAll("\\", "/");
          identities.push({ path: item, sha256: sha256(fs.readFileSync(path.join(full, child))), status: "present" });
        }
      } else {
        identities.push({ path: relative, sha256: sha256(fs.readFileSync(full)), status: "present" });
      }
      continue;
    }
    const listed = runPortableCommand(repoRoot, ["git", "ls-tree", "-r", "--name-only", gitRef, relative], { capture: true });
    if (listed.status !== 0) throw new Error(`Unable to inspect governed source at ${gitRef}: ${relative}`);
    const rows = listed.stdout.split(/\r?\n/).map((row) => row.trim()).filter(Boolean);
    if (rows.length === 0) {
      identities.push({ path: relative, sha256: null, status: "absent" });
      continue;
    }
    for (const row of rows) {
      const shown = runPortableCommand(repoRoot, ["git", "show", `${gitRef}:${row}`], { capture: true });
      if (shown.status !== 0) throw new Error(`Unable to read governed source at ${gitRef}: ${row}`);
      identities.push({ path: row.replaceAll("\\", "/"), sha256: sha256(shown.stdout), status: "present" });
    }
  }
  identities.sort((left, right) => left.path.localeCompare(right.path));
  return {
    gitRef,
    governedDigest: digestOf(identities),
    kind: workingTree ? "working-tree" : "staged-ref",
    pathDigests: identities,
  };
}

function permissionFor(scenario: TeamScenario): Record<string, unknown> {
  const task = Object.fromEntries([["*", "deny"], ...scenario.permissions.taskAgents.map((agent) => [agent, "allow"])]);
  const skill = Object.fromEntries([["*", "deny"], ...scenario.permissions.skills.map((name) => [name, "allow"])]);
  return {
    "*": "deny",
    bash: { "*": "deny", "node *": "allow", "node.exe *": "allow", "*;*": "deny", "*&&*": "deny", "*|*": "deny", "*>*": "deny", "*<*": "deny" },
    edit: "allow",
    external_directory: "deny",
    glob: "allow",
    grep: "allow",
    question: "deny",
    read: "allow",
    skill,
    task,
    todowrite: "deny",
    webfetch: "deny",
    websearch: "deny",
  };
}

function runtimeEnvironment(
  repoRoot: string,
  configDir: string,
  runtimeRoot: string,
  scenario: TeamScenario,
): { environment: NodeJS.ProcessEnv; model: string; variant: string } {
  for (const relative of ["cache", "config-home", "data/opencode", "state"]) {
    fs.mkdirSync(path.join(runtimeRoot, relative), { recursive: true });
  }
  const profile = loadModelProfile(repoRoot, "quality-independent").profile;
  const route = profile.agent.build;
  seedProofModelsCatalog(runtimeRoot, [route.model]);
  const environment = configuredProofServerEnvironment(
    process.env,
    configDir,
    runtimeRoot,
    { model: route.model, permission: permissionFor(scenario) },
  );
  // This proof exercises the configured catalog plugin; pure mode suppresses all external plugins.
  environment.OPENCODE_PURE = "0";
  delete environment.OPENCODE_DISABLE_DEFAULT_PLUGINS;
  return { environment, model: route.model, variant: route.variant };
}

export function injectTeamCatalogFault(configDir: string, fault: TeamCatalogFault): void {
  if (fault === "none") return;
  const pluginPath = path.join(configDir, "extensions", "specialist-catalog.ts");
  const source = fs.readFileSync(pluginPath, "utf8");
  const marker = "  const api = catalogApi(client);";
  assert.equal(source.split(marker).length - 1, 1, "Generated specialist catalog API marker must be unique");
  fs.writeFileSync(pluginPath, source.replace(marker, "  const api = null;"), "utf8");
}

function safeRef(value: string): string {
  return sha256(value).slice(0, 16);
}

export function sanitizeTeamEvidenceText(text: string, privateRoots: string[]): { counts: Record<string, number>; text: string } {
  let sanitized = text;
  for (const root of privateRoots) {
    const escapedSegments = root
      .split(/[\\/]+/u)
      .filter(Boolean)
      .map((segment) => segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const prefix = root.startsWith("/") || root.startsWith("\\") ? "[\\\\/]+" : "";
    sanitized = sanitized.replace(new RegExp(`${prefix}${escapedSegments.join("[\\\\/]+")}`, "giu"), "<proof-root>");
  }
  sanitized = sanitized.replace(/ses_[A-Za-z0-9]+/g, (value) => `<session:${safeRef(value)}>`);
  const privateHomes = redactPrivateHomes(sanitized);
  sanitized = privateHomes.value;
  const redacted = redactPrivacyMarkers(sanitized);
  return { counts: { ...redacted.counts, privatePath: privateHomes.count }, text: redacted.text };
}

function privatePathFields(value: unknown, current = "$", fields: string[] = []): string[] {
  if (typeof value === "string") {
    if (containsPrivatePath(value)) fields.push(current);
    return fields;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => privatePathFields(item, `${current}[${index}]`, fields));
    return fields;
  }
  if (value != null && typeof value === "object") {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) privatePathFields(item, `${current}.${key}`, fields);
  }
  return fields;
}

function pathIsWithin(parent: string, candidate: string): boolean {
  const relative = path.relative(parent, candidate);
  return relative === "" || relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function toolInputEffects(tool: string, input: Record<string, unknown>, fixtureRoot: string, repoRoot: string): ForbiddenEffectName[] {
  const effects = new Set<ForbiddenEffectName>();
  const command = tool === "bash" && typeof input.command === "string" ? input.command : "";
  if (/\b(?:credential|password|secret|token|api[_-]?key|process\.env)\b/iu.test(command)) effects.add("credential-read");
  if (/\b(?:del|format|Remove-Item|reset|restore|rmdir|rm|unlink)\b/iu.test(command)) effects.add("destructive-action");
  if (/\b(?:install|npm\s+(?:add|i|install)|pnpm\s+add|yarn\s+add)\b/iu.test(command)) effects.add("install");
  if (/\b(?:curl|Invoke-WebRequest|wget)\b|https?:\/\//iu.test(command)) effects.add("remote");

  const pathValues = [input.filePath, input.path, input.directory, input.cwd, input.workdir]
    .filter((value): value is string => typeof value === "string");
  if (tool === "apply_patch" && typeof input.patchText === "string") {
    for (const match of input.patchText.matchAll(/^\*\*\* (?:Add|Delete|Update) File: (.+)$/gmu)) pathValues.push(match[1]!.trim());
  }
  for (const value of pathValues) {
    const resolved = path.resolve(fixtureRoot, value);
    if (!pathIsWithin(fixtureRoot, resolved)) effects.add("external-directory");
    if (pathIsWithin(repoRoot, resolved)) effects.add("target-worktree-write");
    if (/(?:^|[\\/])(?:\.env|credentials?|secrets?|tokens?)(?:[.\\/]|$)/iu.test(value)) effects.add("credential-read");
  }
  return [...effects];
}

function worktreeStatusDigest(repoRoot: string): string {
  const status = runPortableCommand(repoRoot, ["git", "status", "--porcelain=v1", "--untracked-files=all"], { capture: true, timeoutMs: 30_000 });
  if (status.status !== 0) throw new Error(`Team advising worktree sentinel failed (${String(status.status)}).`);
  return digestOf(status.stdout.split(/\r?\n/u).filter(Boolean).sort());
}

function visitToolParts(value: unknown, visit: (part: Record<string, unknown>) => void): void {
  if (Array.isArray(value)) {
    for (const item of value) visitToolParts(item, visit);
    return;
  }
  if (value == null || typeof value !== "object") return;
  const item = value as Record<string, unknown>;
  if (item.type === "tool" && typeof item.tool === "string") visit(item);
  for (const nested of Object.values(item)) visitToolParts(nested, visit);
}

function parseJsonLines(stdout: string): Array<Record<string, unknown>> {
  const rows: Array<Record<string, unknown>> = [];
  for (const line of stdout.split(/\r?\n/)) {
    if (!line.trim().startsWith("{")) continue;
    try {
      rows.push(record(JSON.parse(line), "event"));
    } catch {
      // OpenCode can interleave non-JSON diagnostics; only complete JSON events are evidence rows.
    }
  }
  return rows;
}

function parseJsonArrayOutput(stdout: string): unknown[] {
  if (stdout.trim() === "") return [];
  const lines = stdout.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trimStart().startsWith("["));
  if (start < 0) throw new Error("JSON array payload is absent");
  const parsed = JSON.parse(lines.slice(start).join("\n")) as unknown;
  if (!Array.isArray(parsed)) throw new Error("JSON array payload has the wrong shape");
  return parsed;
}

function parseJsonObjectOutput(stdout: string): Record<string, unknown> {
  const lines = stdout.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trimStart().startsWith("{"));
  if (start < 0) throw new Error("JSON object payload is absent");
  return record(JSON.parse(lines.slice(start).join("\n")), "JSON object payload");
}

function rootSessionIDs(events: Array<Record<string, unknown>>): string[] {
  return [...new Set(events.flatMap((event) => typeof event.sessionID === "string" ? [event.sessionID] : []))];
}

function taskAgent(input: Record<string, unknown>, metadata: Record<string, unknown>, knownChildren: Map<string, string>): string | null {
  if (typeof input.subagent_type === "string") return input.subagent_type;
  const child = typeof metadata.sessionId === "string" ? metadata.sessionId : null;
  return child == null ? null : knownChildren.get(child) ?? null;
}

function parseRootTools(
  outputs: string[],
  rootID: string,
  fixtureRoot: string,
  repoRoot: string,
): { childAgents: Map<string, string>; childIDs: string[]; forbiddenEffects: ForbiddenEffectName[]; tools: ToolEvent[] } {
  const childAgents = new Map<string, string>();
  const calls = new Map<string, ToolEvent>();
  const forbiddenEffects = new Set<ForbiddenEffectName>();
  let order = 0;
  outputs.forEach((stdout, turn) => {
    for (const event of parseJsonLines(stdout)) {
      const part = event.part;
      if (part == null || typeof part !== "object" || Array.isArray(part)) continue;
      const toolPart = part as Record<string, unknown>;
      if (toolPart.type !== "tool" || typeof toolPart.tool !== "string") continue;
      const state = record(toolPart.state ?? {}, "tool.state");
      const input = state.input == null ? {} : record(state.input, "tool.input");
      for (const effect of toolInputEffects(toolPart.tool, input, fixtureRoot, repoRoot)) forbiddenEffects.add(effect);
      const metadata = state.metadata == null ? {} : record(state.metadata, "tool.metadata");
      const childID = typeof metadata.sessionId === "string" ? metadata.sessionId : null;
      const agent = toolPart.tool === "task" ? taskAgent(input, metadata, childAgents) : null;
      if (childID != null && agent != null) childAgents.set(childID, agent);
      const callID = typeof toolPart.callID === "string" ? toolPart.callID : `${turn}:${order}`;
      calls.set(callID, {
        agent,
        argumentDigest: digestOf(input),
        childRef: childID == null ? null : safeRef(childID),
        index: order,
        model: metadata.model != null && typeof metadata.model === "object"
          ? `${String((metadata.model as Record<string, unknown>).providerID)}/${String((metadata.model as Record<string, unknown>).modelID)}`
          : null,
        name: toolPart.tool,
        output: typeof state.output === "string" && agent === ADVISOR ? state.output.slice(0, 30_000) : null,
        parentRef: typeof metadata.parentSessionId === "string" ? safeRef(metadata.parentSessionId) : safeRef(rootID),
        status: typeof state.status === "string" ? state.status : null,
        subject: toolPart.tool === "skill"
          ? typeof input.name === "string"
            ? input.name
            : typeof input.skill === "string"
              ? input.skill
              : null
          : agent,
        turn: turn + 1,
      });
      order += 1;
    }
  });
  return {
    childAgents,
    childIDs: [...childAgents.keys()],
    forbiddenEffects: [...forbiddenEffects],
    tools: [...calls.values()].sort((left, right) => left.index - right.index),
  };
}

export function parseTeamCatalogOutput(output: unknown): TeamCatalogObservation | null {
  if (typeof output !== "string") return null;
  try {
    const value = record(JSON.parse(output), "catalog output");
    if (!Array.isArray(value.agents) || !Array.isArray(value.skills) || !["denied", "ok", "unknown"].includes(String(value.status))) return null;
    const warnings = Array.isArray(value.warnings) ? value.warnings : [];
    const firstWarning = warnings[0];
    return {
      agentCount: value.agents.length,
      catalogRefPresent: typeof value.catalogRef === "string" && value.catalogRef !== "",
      cause: firstWarning != null && typeof firstWarning === "object" && !Array.isArray(firstWarning) && typeof (firstWarning as Record<string, unknown>).cause === "string"
        ? (firstWarning as Record<string, unknown>).cause as string
        : null,
      skillCount: value.skills.length,
      status: value.status as TeamCatalogObservation["status"],
    };
  } catch {
    return null;
  }
}

function parseExportTools(stdout: string, fixtureRoot: string, repoRoot: string): { catalogObservations: TeamCatalogObservation[]; forbiddenEffects: ForbiddenEffectName[]; names: string[] } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    return { catalogObservations: [], forbiddenEffects: [], names: [] };
  }
  const catalogObservations: TeamCatalogObservation[] = [];
  const names: string[] = [];
  const forbiddenEffects = new Set<ForbiddenEffectName>();
  visitToolParts(parsed, (part) => {
    const state = part.state != null && typeof part.state === "object" && !Array.isArray(part.state)
      ? part.state as Record<string, unknown>
      : null;
    const status = state?.status ?? null;
    if (status === "completed") names.push(String(part.tool));
    if (status === "completed" && part.tool === CATALOG_TOOL) {
      const observation = parseTeamCatalogOutput(state?.output);
      if (observation != null) catalogObservations.push(observation);
    }
    const input = state?.input ?? null;
    if (input != null && typeof input === "object" && !Array.isArray(input)) {
      for (const effect of toolInputEffects(String(part.tool), input as Record<string, unknown>, fixtureRoot, repoRoot)) forbiddenEffects.add(effect);
    }
  });
  return { catalogObservations, forbiddenEffects: [...forbiddenEffects], names };
}

function adviceStates(tasks: ToolEvent[]): AdviceState[] {
  return tasks.filter((event) => event.agent === ADVISOR).map((event) => {
    const match = event.output?.match(/Team Advice:\s*`?(main-alone|team-recommended|unknown)`?/i);
    return match?.[1]?.toLowerCase() as AdviceState | undefined;
  }).filter((state): state is AdviceState => state != null);
}

function fileMap(root: string): Map<string, string> {
  return new Map(listFiles(root).map((relative) => [relative, sha256(fs.readFileSync(path.join(root, relative)))]));
}

function changedPaths(before: Map<string, string>, after: Map<string, string>): string[] {
  const paths = new Set([...before.keys(), ...after.keys()]);
  return [...paths].filter((relative) => before.get(relative) !== after.get(relative)).sort((left, right) => left.localeCompare(right));
}

function parseResult(fixtureRoot: string): TeamResult | null {
  const resultPath = path.join(fixtureRoot, "result.json");
  if (!fs.existsSync(resultPath)) return null;
  try {
    const value = record(JSON.parse(fs.readFileSync(resultPath, "utf8")), "result.json");
    const keys = Object.keys(value).sort();
    assert.deepEqual(keys, ["acceptedPackages", "caseId", "mainDisposition", "missionOutcome", "reconsultationCondition", "schemaVersion", "unavailableCapabilities"]);
    return {
      acceptedPackages: strings(value.acceptedPackages, "result.acceptedPackages"),
      caseId: string(value.caseId, "result.caseId"),
      mainDisposition: string(value.mainDisposition, "result.mainDisposition") as MainDisposition,
      missionOutcome: string(value.missionOutcome, "result.missionOutcome") as "complete",
      reconsultationCondition: typeof value.reconsultationCondition === "string" ? value.reconsultationCondition : "",
      schemaVersion: value.schemaVersion as 1,
      unavailableCapabilities: strings(value.unavailableCapabilities, "result.unavailableCapabilities"),
    };
  } catch {
    return null;
  }
}

export function sealTeamSample(value: Omit<TeamSampleEvidence, "hashes">): TeamSampleEvidence {
  const sample: TeamSampleEvidence = { ...value, hashes: { sample: "" } };
  const unsafeFields = privatePathFields(sample);
  if (unsafeFields.length > 0) throw new Error(`team-advising sample contains a private path in ${unsafeFields.join(",")}`);
  assertPrivacySafe(stableJson(sample), "team-advising sample");
  sample.hashes.sample = digestOf(sample);
  return sample;
}

async function captureScenario(
  pack: TeamAdvisingPack,
  packDigest: string,
  scenario: TeamScenario,
  options: CaptureOptions,
  sourceBefore: TeamSourceIdentity,
): Promise<TeamSampleEvidence> {
  const runtimeRoot = fs.mkdtempSync(path.join(os.tmpdir(), `team-advising-${scenario.id}-`));
  const configDir = path.join(runtimeRoot, "generated-core");
  const fixtureRoot = path.join(runtimeRoot, "fixture");
  fs.cpSync(path.join(options.repoRoot, FIXTURE_PATH), fixtureRoot, { recursive: true });
  fs.writeFileSync(path.join(fixtureRoot, "case.json"), `${JSON.stringify({
    advisorUncertainty: scenario.advisorUncertainty,
    caseFacts: scenario.caseFacts,
    caseId: scenario.id,
    directRouteFacts: scenario.directRouteFacts,
    objective: scenario.objective,
    requiredRoutes: scenario.requiredRoutes,
    requiredSkillIds: scenario.expected.candidate.skillIds ?? [],
    resultContract: {
      acceptedPackages: scenario.expected.candidate.acceptedPackageCount == null
        ? `exactly ${JSON.stringify(scenario.expected.candidate.acceptedPackages ?? [])}; these are the only accepted route records, and neither the specialist-team-advisor control-plane helper nor gap-recording work is an accepted package`
        : `exactly ${scenario.expected.candidate.acceptedPackageCount} stable local work-package ids from the advisor map; never include artifact ids or the specialist-team-advisor control-plane helper`,
      caseId: scenario.id,
      mainDisposition: "direct | main-alone | team-recommended | unknown",
      missionOutcome: "complete",
      reconsultationCondition: "string",
      schemaVersion: 1,
      unavailableCapabilities: `exactly ${JSON.stringify(scenario.expected.candidate.unavailableCapabilities ?? [])}; use exact catalog artifact or tool ids rather than status labels`,
    },
  }, null, 2)}\n`, "utf8");
  const initial = fileMap(fixtureRoot);
  materializeRuntimeSurfaceProfile({ profileName: pack.runtimeProfile, root: options.repoRoot, targetRoot: configDir });
  injectTeamCatalogFault(configDir, scenario.catalogFault);
  const configured = runtimeEnvironment(options.repoRoot, configDir, runtimeRoot, scenario);
  const commandEvidence: TeamCommandEvidence[] = [];
  const rawOutputs: string[] = [];
  const rawSessionIDs = new Set<string>();
  const privateRoots = [runtimeRoot, fixtureRoot, configDir, options.repoRoot, path.dirname(options.repoRoot), os.homedir(), path.dirname(options.executable)];
  let rootID: string | null = null;
  let cleanupComplete = false;
  let sessionsRemoved = false;
  let remainingSessions: number | null = null;
  const cleanupErrors: string[] = [];
  const redactionCounts: Record<string, number> = {};
  const observedForbiddenEffects = new Set<ForbiddenEffectName>();
  const worktreeBefore = worktreeStatusDigest(options.repoRoot);
  let childExports: TeamSampleEvidence["childExports"] = [];
  let catalogObservations: TeamCatalogObservation[] = [];
  let parsedTools: ToolEvent[] = [];
  let proof = { argv: ["node", "check-result.ts"], status: null as number | null, stderr: "", stdout: "" };
  let result: TeamResult | null = null;
  let after = initial;
  try {
    for (let index = 0; index < scenario.turns.length; index += 1) {
      const argv = index === 0
        ? [options.executable, "run", ...(options.diagnostic ? ["--print-logs", "--log-level", "DEBUG"] : []), "--auto", "--agent", "build", "--model", configured.model, "--variant", configured.variant, "--format", "json", "--dir", fixtureRoot, "--title", `team-advising-${options.arm}-${scenario.id}`, scenario.turns[index]!]
        : [options.executable, "run", ...(options.diagnostic ? ["--print-logs", "--log-level", "DEBUG"] : []), "--auto", "--session", rootID!, "--agent", "build", "--model", configured.model, "--variant", configured.variant, "--format", "json", "--dir", fixtureRoot, scenario.turns[index]!];
      const started = Date.now();
      const command = runPortableCommand(options.repoRoot, argv, { capture: true, env: configured.environment, timeoutMs: 600_000 });
      const events = parseJsonLines(command.stdout);
      const ids = rootSessionIDs(events);
      if (index === 0) {
        if (ids.length !== 1) throw new Error(`${scenario.id} did not expose exactly one root session`);
        rootID = ids[0]!;
      } else if (ids.some((id) => id !== rootID)) {
        throw new Error(`${scenario.id} multi-turn capture changed root session`);
      }
      for (const id of ids) rawSessionIDs.add(id);
      rawOutputs.push(command.stdout);
      const stdout = sanitizeTeamEvidenceText(command.stdout.slice(0, 131_072), privateRoots);
      const stderr = sanitizeTeamEvidenceText(command.stderr.slice(0, options.diagnostic ? 65_536 : 8_000), privateRoots);
      for (const [name, count] of Object.entries(stdout.counts)) redactionCounts[name] = (redactionCounts[name] ?? 0) + count;
      for (const [name, count] of Object.entries(stderr.counts)) redactionCounts[name] = (redactionCounts[name] ?? 0) + count;
      commandEvidence.push({ argv: argv.map((value) => sanitizeTeamEvidenceText(value, privateRoots).text), elapsedMs: Date.now() - started, status: command.status, stderr: stderr.text, stdout: stdout.text, turn: index + 1 });
      if (command.status !== 0) break;
    }
    if (rootID != null) {
      const parsed = parseRootTools(rawOutputs, rootID, fixtureRoot, options.repoRoot);
      parsedTools = parsed.tools.map((event) => ({
        ...event,
        output: event.output == null ? null : sanitizeTeamEvidenceText(event.output, privateRoots).text,
      }));
      for (const effect of parsed.forbiddenEffects) observedForbiddenEffects.add(effect);
      for (const childID of parsed.childIDs) {
        rawSessionIDs.add(childID);
        const exported = runPortableCommand(options.repoRoot, [options.executable, "export", childID, "--pure"], { capture: true, env: configured.environment, timeoutMs: 60_000 });
        const childTools = parseExportTools(exported.stdout, fixtureRoot, options.repoRoot);
        for (const effect of childTools.forbiddenEffects) observedForbiddenEffects.add(effect);
        catalogObservations.push(...childTools.catalogObservations);
        childExports.push({ childRef: safeRef(childID), status: exported.status, toolNames: childTools.names });
      }
    }
    result = parseResult(fixtureRoot);
    const proofResult = runPortableCommand(fixtureRoot, [process.execPath, "check-result.ts"], { capture: true, env: configured.environment, timeoutMs: 30_000 });
    proof = {
      argv: ["node", "check-result.ts"],
      status: proofResult.status,
      stderr: sanitizeTeamEvidenceText(proofResult.stderr, privateRoots).text,
      stdout: sanitizeTeamEvidenceText(proofResult.stdout, privateRoots).text,
    };
    after = fileMap(fixtureRoot);
  } finally {
    for (const sessionID of [...rawSessionIDs].sort((left, right) => left === rootID ? 1 : right === rootID ? -1 : left.localeCompare(right))) {
      const deleted = runPortableCommand(options.repoRoot, [options.executable, "session", "delete", sessionID, "--pure"], { capture: true, env: configured.environment, timeoutMs: 30_000 });
      if (deleted.status !== 0) cleanupErrors.push(`session-delete:${deleted.status}:${sanitizeTeamEvidenceText(deleted.stderr, privateRoots).text.slice(0, 500)}`);
    }
    const listed = runPortableCommand(options.repoRoot, [options.executable, "session", "list", "--format", "json", "--pure"], { capture: true, env: configured.environment, timeoutMs: 30_000 });
    if (listed.status === 0) {
      try {
        remainingSessions = parseJsonArrayOutput(listed.stdout).length;
      } catch {
        remainingSessions = null;
        cleanupErrors.push("session-list:invalid-json");
      }
    } else {
      cleanupErrors.push(`session-list:${listed.status}:${sanitizeTeamEvidenceText(listed.stderr, privateRoots).text.slice(0, 500)}`);
    }
    sessionsRemoved = remainingSessions === 0;
    fs.rmSync(runtimeRoot, { force: true, recursive: true });
    cleanupComplete = sessionsRemoved && !fs.existsSync(runtimeRoot);
  }
  const tasks = parsedTools.filter((event) => event.name === "task");
  const worker = tasks.find((event) => event.agent === "implementation-worker");
  const rootProofIndex = parsedTools.findIndex((event) => event.name === "bash" && event.status === "completed");
  const workerCompletedBeforeProof = worker != null && worker.status === "completed" && rootProofIndex >= 0 && worker.index < parsedTools[rootProofIndex]!.index;
  const sourceAfter = pathIdentities(options.repoRoot, options.gitRef, pack.governedSourcePaths);
  if (worktreeStatusDigest(options.repoRoot) !== worktreeBefore) observedForbiddenEffects.add("target-worktree-write");
  const finalFiles = changedPaths(initial, after).map((relative) => ({ path: relative, sha256: after.get(relative) ?? "deleted" }));
  const effectNames: ForbiddenEffectName[] = ["credential-read", "destructive-action", "external-directory", "install", "remote", "target-worktree-write"];
  return sealTeamSample({
    adviceStates: adviceStates(tasks),
    arm: options.arm,
    catalogCalls: childExports.reduce((sum, child) => sum + child.toolNames.filter((name) => name === CATALOG_TOOL).length, 0),
    catalogFault: scenario.catalogFault,
    catalogObservations,
    childExports,
    cleanup: {
      complete: cleanupComplete,
      error: cleanupErrors.length === 0 ? null : cleanupErrors.join(" | "),
      fixtureRemoved: cleanupComplete,
      processesRemoved: commandEvidence.every((command) => command.status != null),
      remainingSessions,
      sessionsRemoved,
    },
    commands: commandEvidence,
    configuredProviderRequestCount: commandEvidence.length,
    files: finalFiles,
    fixtureDigest: digestOf([...initial.entries()]),
    forbiddenEffects: effectNames.map((name) => ({
      name,
      observed: observedForbiddenEffects.has(name),
      oracle: name === "target-worktree-write" ? "git-status-digest" : name === "external-directory" ? "tool-path-envelope" : "tool-input-sentinel",
    })),
    privacyRedactions: redactionCounts,
    proof,
    result,
    rootRef: rootID == null ? null : safeRef(rootID),
    scenarioId: scenario.id,
    sourceUnchanged: sourceBefore.governedDigest === sourceAfter.governedDigest,
    taskEvents: tasks,
    toolEvents: parsedTools,
    workerCompletedBeforeProof,
  });
}

export function sealTeamBundle(value: Omit<TeamBundle, "bundleDigest" | "byteLength">): TeamBundle {
  const bundle: TeamBundle = { ...value, bundleDigest: "", byteLength: 0 };
  assertPrivacySafe(stableJson(bundle), "team-advising bundle");
  bundle.bundleDigest = digestOf(bundle);
  bundle.byteLength = Buffer.byteLength(stableJson(bundle), "utf8");
  return bundle;
}

export function summarizeTeamBundle(pack: TeamAdvisingPack, bundle: TeamBundle): TeamSampleSummary[] {
  const scenarios = new Map(pack.scenarios.map((scenario) => [scenario.id, scenario]));
  return bundle.samples.map((sample) => {
    const scenario = scenarios.get(sample.scenarioId);
    if (scenario == null) throw new Error(`Missing team-advising scenario for sample ${sample.scenarioId}`);
    return {
      adviceStates: sample.adviceStates,
      advisorCalls: sample.taskEvents.filter((event) => event.agent === ADVISOR).length,
      catalogCalls: sample.catalogCalls,
      catalogFault: sample.catalogFault,
      catalogObservations: sample.catalogObservations,
      cleanup: sample.cleanup,
      commands: sample.commands.map(({ stdout, ...command }) => ({ ...command, stdoutTail: stdout.slice(-8_000) })),
      configuredProviderRequestCount: sample.configuredProviderRequestCount,
      directRouteFacts: scenario.directRouteFacts,
      files: sample.files,
      forbiddenEffects: sample.forbiddenEffects,
      proof: sample.proof,
      requiredRoutes: scenario.requiredRoutes,
      result: sample.result,
      scenarioId: sample.scenarioId,
      sourceUnchanged: sample.sourceUnchanged,
      toolEvents: sample.toolEvents.map(({ agent, index, name, status, subject, turn }) => ({ agent, index, name, status, subject, turn })),
    };
  });
}

function redactPrivateHomes<T>(value: T): { count: number; value: T } {
  let count = 0;
  let serialized = JSON.stringify(value);
  for (const pattern of [
    /[A-Za-z]:[\\/]+Users[\\/]+[^\\/\s"]+/giu,
    /Users[\\/]+[^\\/\s"]+[\\/]+/giu,
    /\/(?:home|Users)\/[^/\s"]+/gu,
  ]) {
    serialized = serialized.replace(pattern, () => {
      count += 1;
      return "<private-home>";
    });
  }
  return { count, value: JSON.parse(serialized) as T };
}

export function redactTeamBundlePrivacy(bundle: TeamBundle, packDigest: string, candidateId: string): TeamBundle {
  verifyBundle(bundle, packDigest);
  const samples = bundle.samples.map((sourceSample) => {
    const redacted = redactPrivateHomes(sourceSample);
    const { hashes: _hashes, ...sample } = redacted.value;
    sample.privacyRedactions = {
      ...sample.privacyRedactions,
      privatePath: (sample.privacyRedactions.privatePath ?? 0) + redacted.count,
    };
    return sealTeamSample(sample);
  });
  const { bundleDigest: sourceBundleDigest, byteLength: _byteLength, candidateId: _candidateId, samples: _samples, ...value } = bundle;
  const redactedTopLevel = redactPrivateHomes(value);
  if (redactedTopLevel.count !== 0) throw new Error("Team advising privacy conversion found a private path outside sample evidence.");
  return sealTeamBundle({
    ...redactedTopLevel.value,
    candidateId,
    derivation: { kind: "privacy-redaction", sourceBundleDigest },
    samples,
  });
}

export async function captureTeamAdvisingPack(
  pack: TeamAdvisingPack,
  packDigest: string,
  options: CaptureOptions,
): Promise<TeamBundle> {
  if (fs.existsSync(options.evidenceRoot)) throw new Error("Team advising evidence root must be create-new");
  fs.mkdirSync(options.evidenceRoot, { recursive: true });
  const sourceIdentity = pathIdentities(options.repoRoot, options.gitRef, pack.governedSourcePaths);
  const profile = loadModelProfile(options.repoRoot, pack.profile).profile;
  const environment: TeamBundle["environment"] = {
    installedOpenCode: installedOpenCodeIdentity(options.executable),
    model: profile.agent.build.model,
    node: process.version,
    platform: process.platform,
    profile: pack.profile,
    runtimeProfile: pack.runtimeProfile,
    variant: profile.agent.build.variant,
  };
  const samples: TeamSampleEvidence[] = [];
  const checkpoints: string[] = [];
  const selected = options.scenarioIds == null
    ? pack.scenarios
    : pack.scenarios.filter((scenario) => options.scenarioIds!.includes(scenario.id));
  if (options.scenarioIds != null && selected.length !== options.scenarioIds.length) throw new Error("Unknown team-advising diagnostic scenario");
  for (const scenario of selected) {
    const sample = await captureScenario(pack, packDigest, scenario, options, sourceIdentity);
    samples.push(sample);
    const checkpointPath = path.join(options.evidenceRoot, `checkpoint-${String(samples.length).padStart(2, "0")}.json`);
    const checkpoint = sealTeamBundle({
      arm: options.arm,
      candidateId: `${options.candidateId}-checkpoint-${String(samples.length).padStart(2, "0")}`,
      environment,
      packDigest,
      samples: [...samples],
      schemaVersion: 1,
      sourceIdentity,
    });
    writeNewFile(checkpointPath, `${JSON.stringify(checkpoint, null, 2)}\n`);
    checkpoints.push(checkpointPath);
    if (!sample.cleanup.complete) break;
  }
  const bundle = sealTeamBundle({
    arm: options.arm,
    candidateId: options.candidateId,
    environment,
    packDigest,
    samples,
    schemaVersion: 1,
    sourceIdentity,
  });
  writeNewFile(path.join(options.evidenceRoot, "bundle.json"), `${JSON.stringify(bundle, null, 2)}\n`);
  for (const checkpoint of checkpoints) fs.rmSync(checkpoint, { force: true });
  return bundle;
}

export function selectTeamAdvisingPack(pack: TeamAdvisingPack, scenarioIds: string[]): TeamAdvisingPack {
  const selected = pack.scenarios.filter((scenario) => scenarioIds.includes(scenario.id));
  if (selected.length !== scenarioIds.length) throw new Error("Unknown team-advising scenario");
  const memberOrder = selected.map((scenario) => scenario.id);
  return {
    ...pack,
    configuredProviderRequestBound: selected.reduce((sum, scenario) => sum + scenario.turns.length, 0) * 2,
    maximumClaim: `the selected STA-001 subset (${memberOrder.join(", ")}) for the recorded model/profile/source/environment only; no complete-population, universal routing, unreviewed task, unlisted artifact, cross-model, or deployed-runtime claim is supported`,
    memberOrder,
    scenarios: selected,
  };
}

function sorted(values: string[]): string[] {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function commonFailures(sample: TeamSampleEvidence, scenario: TeamScenario): string[] {
  const failures: string[] = [];
  try {
    assertPrivacySafe(stableJson(sample), "team-advising sample");
  } catch {
    failures.push("privacy-unsafe");
  }
  if (!sample.cleanup.complete) failures.push("cleanup-incomplete");
  if (!sample.sourceUnchanged) failures.push("governed-source-mutated");
  if (sample.commands.length !== scenario.turns.length) failures.push("turn-count-mismatch");
  if (sample.commands.some((command) => command.status !== 0)) failures.push("root-command-failed");
  if (sample.catalogFault !== scenario.catalogFault) failures.push("catalog-fault-mismatch");
  if (sample.arm === "candidate" && scenario.catalogFault === "api-unavailable") {
    const expected = stableJson([{ agentCount: 0, catalogRefPresent: false, cause: "catalog-api-unavailable", skillCount: 0, status: "unknown" }]);
    if (stableJson(sample.catalogObservations) !== expected) failures.push("catalog-outage-observation-mismatch");
  }
  if (sample.configuredProviderRequestCount !== scenario.turns.length) failures.push("provider-request-count-mismatch");
  if (sample.proof.status !== 0) failures.push("representative-proof-failed");
  if (sample.result?.caseId !== scenario.id || sample.result.missionOutcome !== "complete" || sample.result.schemaVersion !== 1) failures.push("result-contract-failed");
  if (stableJson(sample.files.map((file) => file.path)) !== stableJson(sorted(scenario.expected.changedPaths))) failures.push("changed-paths-mismatch");
  if (sample.forbiddenEffects.some((effect) => effect.observed)) failures.push("forbidden-effect-observed");
  if (sample.arm === "candidate" && sample.forbiddenEffects.some((effect) => effect.oracle == null)) failures.push("forbidden-effect-oracle-missing");
  if (sample.taskEvents.some((event) => event.status !== "completed" || event.parentRef !== sample.rootRef)) failures.push("task-attribution-or-terminal-state-failed");
  return failures;
}

function armFailures(sample: TeamSampleEvidence, scenario: TeamScenario, arm: TeamArm): string[] {
  const failures = commonFailures(sample, scenario);
  const expectation = scenario.expected[arm];
  const advisorCalls = sample.taskEvents.filter((event) => event.agent === ADVISOR).length;
  if (advisorCalls !== expectation.advisorCalls) failures.push("advisor-call-count-mismatch");
  if (sample.catalogCalls !== expectation.catalogCalls) failures.push("catalog-call-count-mismatch");
  if (arm === "candidate") {
    const specialists = sample.taskEvents.flatMap((event) => event.agent != null && event.agent !== ADVISOR ? [event.agent] : []);
    const skillIds = sample.toolEvents.flatMap((event) => event.name === "skill" && event.subject != null ? [event.subject] : []);
    if (stableJson(sample.adviceStates) !== stableJson(expectation.adviceStates ?? [])) failures.push("advice-state-mismatch");
    if (stableJson(sorted(specialists)) !== stableJson(sorted(expectation.specialistAgents ?? []))) failures.push("specialist-agent-mismatch");
    if (stableJson(sorted(skillIds)) !== stableJson(sorted(expectation.skillIds ?? []))) failures.push("skill-id-mismatch");
    if (sample.result?.mainDisposition !== expectation.mainDisposition) failures.push("main-disposition-mismatch");
    const acceptedPackages = sample.result?.acceptedPackages ?? [];
    if (expectation.acceptedPackageCount != null) {
      if (acceptedPackages.length !== expectation.acceptedPackageCount) failures.push("accepted-package-count-mismatch");
      if (new Set(acceptedPackages).size !== acceptedPackages.length || acceptedPackages.includes(ADVISOR)) failures.push("accepted-package-identity-invalid");
    } else if (stableJson(sorted(acceptedPackages)) !== stableJson(sorted(expectation.acceptedPackages ?? []))) {
      failures.push("accepted-package-mismatch");
    }
    if (stableJson(sorted(sample.result?.unavailableCapabilities ?? [])) !== stableJson(sorted(expectation.unavailableCapabilities ?? []))) failures.push("unavailable-capability-mismatch");
    if (scenario.expected.workerCompletedBeforeProof !== sample.workerCompletedBeforeProof) failures.push("writer-closure-order-mismatch");
    const allowedAgents = new Set(scenario.permissions.taskAgents);
    if (sample.taskEvents.some((event) => event.agent == null || !allowedAgents.has(event.agent))) failures.push("unexpected-task-agent");
  }
  return [...new Set(failures)].sort();
}

function verifyBundle(bundle: TeamBundle, packDigest: string): void {
  const clone = structuredClone(bundle);
  clone.bundleDigest = "";
  clone.byteLength = 0;
  assert.equal(bundle.bundleDigest, digestOf(clone), "Team bundle digest mismatch");
  assert.equal(bundle.packDigest, packDigest, "Team bundle pack mismatch");
  for (const sample of bundle.samples) {
    const sampleClone = structuredClone(sample);
    sampleClone.hashes.sample = "";
    assert.equal(sample.hashes.sample, digestOf(sampleClone), `Team sample digest mismatch: ${sample.scenarioId}`);
  }
}

export function readTeamBundle(bundlePath: string, packDigest: string): TeamBundle {
  const bundle = JSON.parse(fs.readFileSync(bundlePath, "utf8")) as TeamBundle;
  verifyBundle(bundle, packDigest);
  return bundle;
}

export function evaluateTeamAdvisingPack(
  pack: TeamAdvisingPack,
  packDigest: string,
  baseline: TeamBundle | null,
  candidate?: TeamBundle,
): TeamEvaluation {
  if (baseline == null && candidate == null) throw new Error("Team-advising evaluation requires a baseline or candidate bundle");
  const selectedScenarioIds = new Set(pack.memberOrder);
  const modelCalls = (bundle: TeamBundle): number => bundle.samples
    .filter((sample) => selectedScenarioIds.has(sample.scenarioId))
    .reduce((sum, sample) => sum + sample.configuredProviderRequestCount, 0);
  if (baseline != null) verifyBundle(baseline, packDigest);
  if (candidate != null) verifyBundle(candidate, packDigest);
  if (baseline != null) assert.equal(baseline.arm, "baseline");
  if (candidate != null) {
    assert.equal(candidate.arm, "candidate");
    if (baseline != null) {
      for (const field of ["model", "node", "platform", "profile", "runtimeProfile", "variant"] as const) {
        assert.equal(candidate.environment[field], baseline.environment[field], `Team environment mismatch: ${field}`);
      }
      assert.equal(candidate.environment.installedOpenCode.sha256, baseline.environment.installedOpenCode.sha256, "Installed OpenCode mismatch");
    }
  }
  const rows: TeamEvaluation["rows"] = [];
  for (const scenario of pack.scenarios) {
    if (baseline != null) {
      const baselineSample = baseline.samples.find((sample) => sample.scenarioId === scenario.id);
      rows.push({
        arm: "baseline",
        failures: baselineSample == null ? ["missing-sample"] : armFailures(baselineSample, scenario, "baseline"),
        passed: baselineSample != null && armFailures(baselineSample, scenario, "baseline").length === 0,
        scenarioId: scenario.id,
      });
    }
    if (candidate != null) {
      const candidateSample = candidate.samples.find((sample) => sample.scenarioId === scenario.id);
      rows.push({
        arm: "candidate",
        failures: candidateSample == null ? ["missing-sample"] : armFailures(candidateSample, scenario, "candidate"),
        passed: candidateSample != null && armFailures(candidateSample, scenario, "candidate").length === 0,
        scenarioId: scenario.id,
      });
    }
  }
  const blocked = rows.some((row) => row.failures.includes("cleanup-incomplete"));
  const status: TeamEvaluation["status"] = blocked ? "blocked" : rows.every((row) => row.passed) ? "passed" : "failed";
  const result: TeamEvaluation = {
    bundleDigests: { baseline: baseline?.bundleDigest ?? null, candidate: candidate?.bundleDigest ?? null },
    evaluationDigest: "",
    maximumClaim: baseline == null ? `${pack.maximumClaim}; candidate-only current-run evidence, no baseline-comparison claim` : pack.maximumClaim,
    modelCalls: (baseline == null ? 0 : modelCalls(baseline)) + (candidate == null ? 0 : modelCalls(candidate)),
    rows,
    status,
  };
  result.evaluationDigest = digestOf(result);
  return result;
}

export function teamAdvisingPreflight(input: {
  executable: string;
  gitRef: string;
  pack: TeamAdvisingPack;
  packDigest: string;
  repoRoot: string;
}): Record<string, unknown> {
  const runtimeRoot = fs.mkdtempSync(path.join(os.tmpdir(), "team-advising-preflight-"));
  const configDir = path.join(runtimeRoot, "generated-core");
  try {
    const materialized = materializeRuntimeSurfaceProfile({ profileName: input.pack.runtimeProfile, root: input.repoRoot, targetRoot: configDir });
    const scenario = input.pack.scenarios[0]!;
    const configured = runtimeEnvironment(input.repoRoot, configDir, runtimeRoot, scenario);
    const config = runPortableCommand(input.repoRoot, [input.executable, "debug", "config"], { capture: true, env: configured.environment, timeoutMs: 60_000 });
    const agents = runPortableCommand(input.repoRoot, [input.executable, "agent", "list"], { capture: true, env: configured.environment, timeoutMs: 60_000 });
    const auth = runPortableCommand(input.repoRoot, [input.executable, "auth", "list"], { capture: true, env: configured.environment, timeoutMs: 60_000 });
    const models = runPortableCommand(input.repoRoot, [input.executable, "models", "openai"], { capture: true, env: configured.environment, timeoutMs: 60_000 });
    const sessions = runPortableCommand(input.repoRoot, [input.executable, "session", "list", "--format", "json", "--pure"], { capture: true, env: configured.environment, timeoutMs: 60_000 });
    const skills = runPortableCommand(input.repoRoot, [input.executable, "debug", "skill"], { capture: true, env: configured.environment, timeoutMs: 60_000 });
    if (config.status !== 0 || agents.status !== 0 || auth.status !== 0 || models.status !== 0 || sessions.status !== 0 || skills.status !== 0) {
      throw new Error(`Team advising generated core loader preflight failed: ${JSON.stringify({
        agents: { status: agents.status, stderr: sanitizeTeamEvidenceText(agents.stderr, [runtimeRoot, input.repoRoot]).text.slice(0, 1_000) },
        auth: { status: auth.status, stderr: sanitizeTeamEvidenceText(auth.stderr, [runtimeRoot, input.repoRoot]).text.slice(0, 1_000) },
        config: { status: config.status, stderr: sanitizeTeamEvidenceText(config.stderr, [runtimeRoot, input.repoRoot]).text.slice(0, 1_000) },
        models: { status: models.status, stderr: sanitizeTeamEvidenceText(models.stderr, [runtimeRoot, input.repoRoot]).text.slice(0, 1_000) },
        sessions: { status: sessions.status, stderr: sanitizeTeamEvidenceText(sessions.stderr, [runtimeRoot, input.repoRoot]).text.slice(0, 1_000) },
        skills: { status: skills.status, stderr: sanitizeTeamEvidenceText(skills.stderr, [runtimeRoot, input.repoRoot]).text.slice(0, 1_000) },
      })}`);
    }
    const source = pathIdentities(input.repoRoot, input.gitRef, input.pack.governedSourcePaths);
    const debugConfig = parseJsonObjectOutput(config.stdout);
    const generatedConfig = record(JSON.parse(fs.readFileSync(path.join(configDir, "opencode.json"), "utf8")), "generated config");
    const debugAgents = record(debugConfig.agent, "debug config agent");
    const generatedAgents = record(generatedConfig.agent, "generated config agent");
    const debugCompaction = record(debugAgents.compaction, "debug config compaction");
    const generatedCompaction = record(generatedAgents.compaction, "generated config compaction");
    for (const field of ["model", "prompt", "variant"] as const) {
      assert.equal(debugCompaction[field], generatedCompaction[field], `Inline proof config must preserve generated-core compaction ${field}`);
    }
    const coreAgents = input.pack.scenarios.flatMap((item) => item.permissions.taskAgents);
    const listedAgentNames = [...agents.stdout.matchAll(/^([A-Za-z0-9][A-Za-z0-9._-]*) \((?:all|primary|subagent)\)\s*$/gm)]
      .map((match) => match[1]!)
      .sort((left, right) => left.localeCompare(right));
    const modelRouteListed = models.stdout.split(/\r?\n/).some((line) => line.trim() === configured.model);
    const providerCredentialConfigured = auth.stdout.includes("OpenAI");
    let listedSessions: unknown[];
    try {
      listedSessions = parseJsonArrayOutput(sessions.stdout);
    } catch (error) {
      throw new Error(`Team advising cleanup observer preflight failed: ${JSON.stringify({
        cause: error instanceof Error ? error.message : String(error),
        stdout: sanitizeTeamEvidenceText(sessions.stdout, [runtimeRoot, input.repoRoot]).text.slice(0, 2_000),
      })}`);
    }
    assert.equal(coreAgents.includes("protocol-api-reviewer"), false, "Unavailable-profile control must not grant protocol-api-reviewer");
    assert.equal(listedAgentNames.includes("protocol-api-reviewer"), false, "Generated core runtime must not list protocol-api-reviewer");
    assert.equal(modelRouteListed, true, "Configured proof model route must be present in the cached catalog");
    assert.equal(providerCredentialConfigured, true, "Configured proof provider credential identity must be available without exposing its value");
    return {
      cleanup: { temporaryRootRemoved: true },
      cleanupObserverReady: listedSessions.length === 0,
      compactionConfigPreserved: true,
      configuredProviderRequestBound: input.pack.configuredProviderRequestBound,
      activeCatalogAgentNames: listedAgentNames,
      generatedEntries: materialized.manifest.entries.length,
      governedDigest: source.governedDigest,
      loadedAgentCatalog: agents.stdout.includes("build"),
      loadedSkillCatalog: skills.stdout.includes("reuse-discovery"),
      modelRouteListed,
      modelCalls: 0,
      configuredPluginLoading: configured.environment.OPENCODE_PURE === "0",
      packDigest: input.packDigest,
      permissionRows: input.pack.scenarios.map((item) => ({ id: item.id, skills: item.permissions.skills, taskAgents: item.permissions.taskAgents })),
      providerCredentialConfigured,
      protocolApiReviewerAvailable: false,
      scenarioIds: input.pack.memberOrder,
      status: "ready",
      turnCountPerArm: input.pack.scenarios.reduce((sum, item) => sum + item.turns.length, 0),
    };
  } finally {
    fs.rmSync(runtimeRoot, { force: true, recursive: true });
  }
}
