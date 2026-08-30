import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createOpencodeClient } from "@opencode-ai/sdk/v2";
import {
  parseTerminalCertificateChallenge,
  ROADMAP_MISSION_CERTIFICATE_ISSUER,
} from "../../extensions/session-completion-guard/terminal-certificate.ts";
import type {
  TerminalCertificate,
  TerminalCertificateChallenge,
} from "../../extensions/session-completion-guard/terminal-certificate.ts";
import { runPortableCommand } from "../portable-process.ts";
import { ROADMAP_COMMAND_TIMEOUT_MS } from "./controller-adapter.ts";
import {
  loadMissionDefinition,
  missionDefinitionDigest,
  parseMissionBlocker,
  parseMissionExecutorResult,
  RoadmapMissionError,
  stableJson,
} from "./contracts.ts";
import type {
  MissionBlocker,
  MissionExecutorResult,
  RoadmapMissionDefinition,
  RoadmapMissionSlice,
} from "./contracts.ts";

export type SessionExecutorOptions = {
  attempt: number;
  missionPath: string;
  parentSessionRef: string | null;
  resultPath: string;
  root: string;
  serverUrl: string;
  sliceId: string;
  timeoutMs: number;
};

type RuntimeInspection = {
  activeSessionRefs: string[];
  commandNames: string[];
  expectedActiveChanges: string[];
  observedSessions: Array<{
    changeId: string | null;
    guardState: string;
    missionId: string | null;
    sessionRef: string | null;
    status: string;
  }>;
  pendingQuestionRefs: string[];
  status: "clear";
};

function record(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

async function requestData<T>(request: Promise<unknown>, label: string): Promise<T> {
  const response = await request as { data?: T; error?: unknown };
  if (response.error != null) {
    throw new RoadmapMissionError(`${label} failed`, 1, { cause: response.error });
  }
  if (!("data" in response)) throw new RoadmapMissionError(`${label} returned no data`, 1);
  return response.data as T;
}

function boundedSingleLine(value: unknown, label: string, max = 1_000): string {
  if (typeof value !== "string" || value.trim() === "" || value.length > max || /[\r\n\0]/.test(value)) {
    throw new RoadmapMissionError(`${label} must be a non-empty single-line string of at most ${max} characters`, 2);
  }
  return value.trim();
}

function safeRelative(root: string, value: string, label: string): string {
  const normalized = boundedSingleLine(value, label, 500).replaceAll("\\", "/").replace(/^\.\//, "");
  if (path.isAbsolute(normalized) || normalized.split("/").some((part) => part === "" || part === "." || part === "..")) {
    throw new RoadmapMissionError(`${label} must be a contained project-relative path`, 2);
  }
  const resolved = path.resolve(root, normalized);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new RoadmapMissionError(`${label} escaped the project root`, 2);
  return normalized;
}

function ensureDirectory(root: string, directory: string): void {
  const relative = path.relative(root, directory);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new RoadmapMissionError("executor evidence directory escaped the project root", 2);
  let current = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    if (!fs.existsSync(current)) {
      fs.mkdirSync(current);
      continue;
    }
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new RoadmapMissionError("executor evidence directory is unsafe", 2);
  }
}

function writeNew(root: string, relative: string, value: unknown): string {
  const normalized = safeRelative(root, relative, "executor evidence path");
  const file = path.resolve(root, normalized);
  ensureDirectory(root, path.dirname(file));
  fs.writeFileSync(file, stableJson(value), { encoding: "utf8", flag: "wx" });
  return normalized;
}

export function runtimeUrl(value: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch (error) {
    throw new RoadmapMissionError("executor server URL is invalid", 2, { cause: error });
  }
  if (
    (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
    !["127.0.0.1", "::1", "localhost"].includes(parsed.hostname) ||
    parsed.username !== "" ||
    parsed.password !== "" ||
    (parsed.pathname !== "" && parsed.pathname !== "/") ||
    parsed.search !== "" ||
    parsed.hash !== ""
  ) {
    throw new RoadmapMissionError("executor server URL must be an uncredentialed loopback origin", 2);
  }
  return parsed;
}

export function runtimeRef(server: URL, root: string): string {
  return crypto.createHash("sha256").update(`${server.origin}\0${path.resolve(root)}`).digest("hex");
}

function samePath(left: string, right: string): boolean {
  const leftResolved = path.resolve(left);
  const rightResolved = path.resolve(right);
  return process.platform === "win32"
    ? leftResolved.toLocaleLowerCase() === rightResolved.toLocaleLowerCase()
    : leftResolved === rightResolved;
}

function rows(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) return value.map(record).filter((entry): entry is Record<string, unknown> => entry != null);
  const input = record(value);
  if (Array.isArray(input?.data)) return input.data.map(record).filter((entry): entry is Record<string, unknown> => entry != null);
  const nested = record(input?.data);
  return Array.isArray(nested?.data)
    ? nested.data.map(record).filter((entry): entry is Record<string, unknown> => entry != null)
    : [];
}

function commandNames(value: unknown): string[] {
  return rows(value).flatMap((entry) => {
    const name = typeof entry.name === "string" ? entry.name : typeof entry.id === "string" ? entry.id : null;
    return name == null ? [] : [name];
  }).sort();
}

function statusType(value: unknown): string {
  return typeof record(value)?.type === "string" ? String(record(value)?.type) : "unknown";
}

function sessionRef(value: Record<string, unknown>): string | null {
  return typeof value.id === "string" ? value.id : null;
}

function expectedActiveChanges(definition: RoadmapMissionDefinition, sliceIndex: number): string[] {
  return definition.slices.slice(sliceIndex)
    .filter((slice) => slice.operation === "continue")
    .map((slice) => slice.changeId)
    .sort();
}

export async function inspectRuntime(
  client: ReturnType<typeof createOpencodeClient>,
  root: string,
  expectedChanges: string[],
  parentSessionRef: string | null,
): Promise<RuntimeInspection> {
  const paths = record(await requestData<unknown>(client.path.get({ directory: root }), "OpenCode path inspection"));
  const observedDirectory = typeof paths?.directory === "string"
    ? paths.directory
    : typeof paths?.worktree === "string"
      ? paths.worktree
      : null;
  if (observedDirectory == null || !samePath(observedDirectory, root)) {
    throw new RoadmapMissionError("OpenCode runtime directory does not match the mission project", 1);
  }
  const commands = commandNames(await requestData<unknown>(client.command.list({ directory: root }), "OpenCode command inspection"));
  for (const required of ["opsx-apply", "opsx-propose"]) {
    if (!commands.includes(required)) throw new RoadmapMissionError(`OpenCode runtime is missing canonical command ${required}`, 1);
  }
  const statusMap = record(await requestData<unknown>(client.session.status({ directory: root }), "OpenCode session status")) ?? {};
  const listedSessions = rows(await requestData<unknown>(
    client.v2.session.list({ directory: root, roots: true, limit: 500 }),
    "OpenCode root session list",
  ));
  const pendingQuestions = rows(await requestData<unknown>(client.question.list({ directory: root }), "OpenCode pending question list"));
  const ignored = new Set(parentSessionRef == null ? [] : [parentSessionRef]);
  const sessions: Record<string, unknown>[] = [];
  for (const listed of listedSessions) {
    const id = sessionRef(listed);
    if (id == null || ignored.has(id)) continue;
    sessions.push(await requestData<Record<string, unknown>>(
      client.session.get({ sessionID: id, directory: root }),
      "OpenCode root session detail",
    ));
  }
  const activeSessionRefs: string[] = [];
  const observedSessions: RuntimeInspection["observedSessions"] = [];
  for (const session of sessions) {
    const id = sessionRef(session);
    if (id == null) continue;
    const status = statusType(statusMap[id]);
    const mission = record(record(session.metadata)?.roadmapMission);
    const changeId = typeof mission?.changeId === "string" ? mission.changeId : null;
    const guardState = String(record(record(session.metadata)?.completionGuard)?.state ?? "unknown");
    observedSessions.push({
      changeId,
      guardState,
      missionId: typeof mission?.missionId === "string" ? mission.missionId : null,
      sessionRef: id,
      status,
    });
    if (status === "busy" || status === "retry") activeSessionRefs.push(id);
    if (changeId != null && expectedChanges.includes(changeId) && guardState !== "passed") {
      activeSessionRefs.push(id);
    }
  }
  const pendingQuestionRefs = pendingQuestions.flatMap((question) => {
    const sessionID = typeof question.sessionID === "string" ? question.sessionID : null;
    if (sessionID != null && ignored.has(sessionID)) return [];
    return typeof question.id === "string" ? [question.id] : typeof question.requestID === "string" ? [question.requestID] : ["unknown"];
  });
  const uniqueActive = [...new Set(activeSessionRefs)].sort();
  if (uniqueActive.length > 0 || pendingQuestionRefs.length > 0) {
    throw new RoadmapMissionError(
      `OpenCode runtime dormancy is not clear: activeSessions=${uniqueActive.length} pendingQuestions=${pendingQuestionRefs.length}`,
      1,
    );
  }
  return {
    activeSessionRefs: uniqueActive,
    commandNames: commands,
    expectedActiveChanges: expectedChanges,
    observedSessions,
    pendingQuestionRefs,
    status: "clear",
  };
}

function guardMetadata(root: Record<string, unknown>): Record<string, unknown> {
  return record(record(root.metadata)?.completionGuard) ?? {};
}

function completionGuardBlocker(
  guard: Record<string, unknown>,
  guardState: "frontier-reconciling" | "product-decision-required" | "waiting",
  slice: RoadmapMissionSlice,
  rootSessionRef: string,
): MissionBlocker {
  const frontier = record(guard.workFrontier);
  const projection = record(guard.workFrontierProjection);
  const frontierState = typeof projection?.frontierState === "string" ? projection.frontierState : null;
  const openGateRefs = Array.isArray(projection?.openGateRefs)
    ? projection.openGateRefs.filter((value): value is string => typeof value === "string")
    : [];
  const rawGates = Array.isArray(frontier?.gates) ? frontier.gates.map(record).filter((value): value is Record<string, unknown> => value != null) : [];
  const relevantGates = rawGates.filter((gate) => {
    if (gate.status !== "open" || typeof gate.kind !== "string") return false;
    if (openGateRefs.length > 0 && (typeof gate.id !== "string" || !openGateRefs.includes(gate.id))) return false;
    return guardState === "product-decision-required" ? gate.kind === "product-decision" : gate.kind !== "product-decision";
  });
  const gates = relevantGates.map((gate) => ({
    affectedItemRefs: Array.isArray(gate.affectedItemRefs) ? gate.affectedItemRefs : [],
    evidenceRefs: Array.isArray(gate.evidenceRefs) ? gate.evidenceRefs : [],
    id: gate.id,
    kind: gate.kind,
    resumeCondition: gate.resumeCondition,
  }));
  const rawDecisions = guardState === "product-decision-required" && Array.isArray(frontier?.parkedDecisions)
    ? frontier.parkedDecisions.map(record).filter((value): value is Record<string, unknown> => value != null)
    : [];
  const decisions = rawDecisions.map((decision) => ({
    affectedItemRefs: Array.isArray(decision.affectedItemRefs) ? decision.affectedItemRefs : [],
    decisionPoint: decision.decisionPoint,
    evidenceRefs: Array.isArray(decision.evidenceRefs) ? decision.evidenceRefs : [],
    id: decision.id,
    optionInvariantItemRefs: Array.isArray(decision.optionInvariantItemRefs) ? decision.optionInvariantItemRefs : [],
    questionRef: decision.questionRef,
  }));
  if (guardState === "product-decision-required" && frontierState !== "product-decision") {
    throw new RoadmapMissionError("completion guard product decision has no matching persisted frontier projection", 1);
  }
  const waitKinds = new Set(["budget", "capability", "external", "live-attempt", "process", "safety", "technical", "writer-liveness"]);
  const waitReason = typeof guard.waitReason === "string" && guard.waitReason.trim() !== "" ? guard.waitReason.trim() : null;
  const reasonKind = waitReason?.split(":", 1)[0] ?? null;
  const gateKind = relevantGates.find((gate) => typeof gate.kind === "string")?.kind;
  const waitKind = guardState === "product-decision-required"
    ? null
    : waitKinds.has(String(reasonKind))
      ? reasonKind
      : waitKinds.has(String(gateKind))
        ? gateKind
        : "technical";
  const resumeCondition = relevantGates.find((gate) => typeof gate.resumeCondition === "string")?.resumeCondition
    ?? waitReason
    ?? (guardState === "frontier-reconciling"
      ? `completion-guard frontier reconciliation ${String(guard.frontierReconciliationRef ?? guard.frontierError ?? "required")}`
      : null);
  if (typeof resumeCondition !== "string" || resumeCondition.trim() === "") {
    throw new RoadmapMissionError("completion guard blocker has no resume condition", 1);
  }
  const affectedItemRefs = [...new Set([
    ...gates.flatMap((gate) => Array.isArray(gate.affectedItemRefs) ? gate.affectedItemRefs.filter((value): value is string => typeof value === "string") : []),
    ...decisions.flatMap((decision) => Array.isArray(decision.affectedItemRefs) ? decision.affectedItemRefs.filter((value): value is string => typeof value === "string") : []),
  ])];
  const evidenceRefs = [...new Set([
    ...gates.flatMap((gate) => Array.isArray(gate.evidenceRefs) ? gate.evidenceRefs.filter((value): value is string => typeof value === "string") : []),
    ...decisions.flatMap((decision) => Array.isArray(decision.evidenceRefs) ? decision.evidenceRefs.filter((value): value is string => typeof value === "string") : []),
    ...(typeof guard.frontierReconciliationRef === "string" ? [guard.frontierReconciliationRef] : []),
  ])];
  const frontierFacts = frontier == null ? null : {
    acceptedOutcomeRef: frontier.acceptedOutcomeRef,
    basisHumanRef: frontier.basisHumanRef,
    frontierGeneration: frontier.frontierGeneration,
    progressFingerprint: frontier.progressFingerprint,
    taskStateDigest: frontier.taskStateDigest,
  };
  return parseMissionBlocker({
    affectedItemRefs: affectedItemRefs.length === 0 ? slice.workItemRefs ?? [slice.id] : affectedItemRefs,
    decisions,
    disposition: guardState === "product-decision-required" ? "product-decision-required" : "waiting",
    evidenceRefs,
    frontier: guardState === "frontier-reconciling" ? null : frontierFacts,
    gates,
    resumeCondition,
    rootSessionRef,
    source: "completion-guard",
    waitKind,
  }, "completion guard blocker");
}

async function waitForTerminalGuard(
  client: ReturnType<typeof createOpencodeClient>,
  root: string,
  sessionID: string,
  timeoutMs: number,
  previousRevision: string | null,
): Promise<{ guard: Record<string, unknown>; session: Record<string, unknown> }> {
  const deadline = Date.now() + timeoutMs;
  let lastState = "unknown";
  let certificateStatus = "unknown";
  let certificateReason = "none";
  while (Date.now() < deadline) {
    const session = await requestData<Record<string, unknown>>(
      client.session.get({ sessionID, directory: root }),
      "executor root status",
    );
    const guard = guardMetadata(session);
    lastState = String(guard.state ?? "unknown");
    const certificate = record(guard.terminalCertificate);
    certificateStatus = String(certificate?.status ?? "unknown");
    certificateReason = String(certificate?.reason ?? "none").slice(0, 200);
    const revision = typeof guard.lastAuditedRevision === "string" ? guard.lastAuditedRevision : null;
    if (["error", "frontier-reconciling", "owner-required", "paused", "product-decision-required", "waiting"].includes(lastState)) return { guard, session };
    if (lastState === "passed" && revision != null && revision !== previousRevision) return { guard, session };
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new RoadmapMissionError(
    `completion guard did not reach a terminal state; last=${lastState} certificate=${certificateStatus}:${certificateReason}`,
    1,
  );
}

async function boundedRequest<T>(
  label: string,
  timeoutMs: number,
  action: (signal: AbortSignal) => Promise<unknown>,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  try {
    return await requestData<T>(action(controller.signal), label);
  } finally {
    clearTimeout(timer);
  }
}

async function closeOwnership(
  client: ReturnType<typeof createOpencodeClient>,
  root: string,
  sessionID: string,
): Promise<"terminal" | "unknown"> {
  try {
    const pending = rows(await requestData<unknown>(client.question.list({ directory: root }), "executor pending question cleanup"));
    for (const question of pending) {
      if (question.sessionID !== sessionID) continue;
      const requestID = typeof question.id === "string" ? question.id : typeof question.requestID === "string" ? question.requestID : null;
      if (requestID != null) await requestData(client.question.reject({ requestID, directory: root }), "executor question reject");
    }
    await requestData(client.session.abort({ sessionID, directory: root }), "executor session abort");
    const statusMap = record(await requestData<unknown>(client.session.status({ directory: root }), "executor post-abort status")) ?? {};
    const status = statusType(statusMap[sessionID]);
    return status === "busy" || status === "retry" ? "unknown" : "terminal";
  } catch {
    return "unknown";
  }
}

function errorText(error: unknown): string {
  const parts: string[] = [];
  let current = error;
  for (let depth = 0; depth < 4 && current != null; depth++) {
    if (current instanceof Error) {
      parts.push(current.message);
      current = current.cause;
    } else {
      try {
        parts.push(typeof current === "string" ? current : JSON.stringify(current));
      } catch {
        parts.push(String(current));
      }
      break;
    }
  }
  return parts.filter(Boolean).join(": ");
}

function errorMessage(error: unknown, root: string, server: URL): string {
  const text = errorText(error);
  return text
    .replaceAll(root, "<project-root>")
    .replaceAll(root.replaceAll("\\", "/"), "<project-root>")
    .replaceAll(server.origin, "<runtime-origin>")
    .replace(/[\r\n\0]+/g, " ")
    .slice(0, 1_000);
}

function transientFailure(error: unknown): boolean {
  const message = errorText(error);
  return /(?:429|502|503|504|ECONNRESET|ECONNREFUSED|fetch failed|temporar|timed?\s*out|unavailable)/i.test(message);
}

function phaseArguments(slice: RoadmapMissionSlice, command: "opsx-apply" | "opsx-propose"): string {
  return command === "opsx-apply" ? slice.changeId : `${slice.changeId}: ${slice.outcome}`;
}

type PhaseVerification = {
  eligible: boolean;
  facts: Record<string, unknown>;
  reason: string;
  requirementIds: string[];
};

function runOpenSpec(root: string, args: string[]): { status: number | null; stderr: string; stdout: string } {
  const result = runPortableCommand(root, ["openspec", ...args], {
    capture: true,
    timeoutMs: ROADMAP_COMMAND_TIMEOUT_MS.openSpec,
  });
  return {
    status: result.status,
    stderr: result.cleanupState === "unknown"
      ? "OpenSpec process cleanup state is unknown"
      : result.error == null
      ? result.stderr
      : `${result.error.message}${result.stderr ? `\n${result.stderr}` : ""}`,
    stdout: result.stdout,
  };
}

function parsedJson(result: ReturnType<typeof runOpenSpec>): Record<string, unknown> | null {
  if (result.status !== 0) return null;
  try {
    return record(JSON.parse(result.stdout));
  } catch {
    return null;
  }
}

function applyRequirementIds(root: string, changeId: string): string[] {
  const output = parsedJson(runOpenSpec(root, ["instructions", "apply", "--change", changeId, "--json"]));
  if (!Array.isArray(output?.tasks)) return [];
  const ids = output.tasks.flatMap((task) => typeof record(task)?.id === "string" ? [String(record(task)?.id)] : []).sort();
  return ids.length === output.tasks.length && ids.length > 0 && new Set(ids).size === ids.length ? ids : [];
}

function phaseRequirementIds(root: string, changeId: string, command: "opsx-apply" | "opsx-propose"): string[] {
  return command === "opsx-propose"
    ? ["artifact:design", "artifact:proposal", "artifact:specs", "artifact:tasks"]
    : applyRequirementIds(root, changeId);
}

function verifyPhase(
  root: string,
  changeId: string,
  command: "opsx-apply" | "opsx-propose",
  expectedRequirementIds: string[],
): PhaseVerification {
  const validation = runOpenSpec(root, ["validate", changeId, "--strict"]);
  if (command === "opsx-propose") {
    const status = parsedJson(runOpenSpec(root, ["status", "--change", changeId, "--json"]));
    const artifacts = Array.isArray(status?.artifacts) ? status.artifacts.map(record).filter(Boolean) : [];
    const complete = status?.isComplete === true && artifacts.length >= 4 && artifacts.every((artifact) => artifact?.status === "done");
    const eligible = complete && validation.status === 0;
    return {
      eligible,
      facts: { artifactCount: artifacts.length, artifactsComplete: complete, validationStatus: validation.status },
      reason: eligible ? "terminal" : "proposal-artifacts-incomplete",
      requirementIds: expectedRequirementIds,
    };
  }
  const apply = parsedJson(runOpenSpec(root, ["instructions", "apply", "--change", changeId, "--json"]));
  const tasks = Array.isArray(apply?.tasks) ? apply.tasks.map(record).filter(Boolean) : [];
  const observedIds = tasks.flatMap((task) => typeof task?.id === "string" ? [String(task.id)] : []).sort();
  const allDone = tasks.length > 0 && tasks.every((task) => task?.done === true) &&
    (apply?.state === "all_done" || record(apply?.progress)?.remaining === 0);
  const requirementsMatch = JSON.stringify(observedIds) === JSON.stringify(expectedRequirementIds);
  const eligible = allDone && requirementsMatch && validation.status === 0;
  return {
    eligible,
    facts: {
      remaining: record(apply?.progress)?.remaining ?? null,
      requirementCount: observedIds.length,
      requirementsMatch,
      state: apply?.state ?? "unknown",
      validationStatus: validation.status,
    },
    reason: eligible ? "terminal" : requirementsMatch ? "requirements-incomplete" : "requirements-changed",
    requirementIds: observedIds,
  };
}

async function updateMissionMetadata(
  client: ReturnType<typeof createOpencodeClient>,
  root: string,
  sessionID: string,
  patch: Record<string, unknown>,
  current?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const session = current ?? await requestData<Record<string, unknown>>(
    client.session.get({ sessionID, directory: root }),
    "executor mission metadata read",
  );
  const metadata = record(session.metadata) ?? {};
  const mission = record(metadata.roadmapMission) ?? {};
  return requestData<Record<string, unknown>>(client.session.update({
    sessionID,
    directory: root,
    metadata: {
      ...metadata,
      roadmapMission: { ...mission, ...patch },
    },
  }), "executor mission metadata update");
}

async function issueTerminalCertificate(input: {
  client: ReturnType<typeof createOpencodeClient>;
  evidenceRefs: string[];
  requirementIds: string[];
  root: string;
  sessionID: string;
  timeoutMs: number;
}): Promise<TerminalCertificate | null> {
  const deadline = Date.now() + Math.min(input.timeoutMs, 10_000);
  while (Date.now() < deadline) {
    const session = await requestData<Record<string, unknown>>(
      input.client.session.get({ sessionID: input.sessionID, directory: input.root }),
      "executor certificate challenge read",
    );
    const guard = guardMetadata(session);
    const certificateState = record(guard.terminalCertificate);
    if (certificateState?.challenge != null) {
      let challenge: TerminalCertificateChallenge;
      try {
        challenge = parseTerminalCertificateChallenge(certificateState.challenge);
      } catch {
        await updateMissionMetadata(input.client, input.root, input.sessionID, {
          certificateReason: "challenge-invalid",
          certificateStatus: "declined",
          terminalCertificate: null,
        }, session);
        return null;
      }
      if (
        challenge.issuer !== ROADMAP_MISSION_CERTIFICATE_ISSUER ||
        JSON.stringify(challenge.requirementIds) !== JSON.stringify([...input.requirementIds].sort())
      ) {
        await updateMissionMetadata(input.client, input.root, input.sessionID, {
          certificateReason: "challenge-mismatch",
          certificateStatus: "declined",
          terminalCertificate: null,
        }, session);
        return null;
      }
      const pending = rows(await requestData<unknown>(
        input.client.question.list({ directory: input.root }),
        "executor certificate pending question check",
      )).some((question) => question.sessionID === input.sessionID);
      if (pending) {
        await updateMissionMetadata(input.client, input.root, input.sessionID, {
          certificateReason: "pending-question",
          certificateStatus: "declined",
          terminalCertificate: null,
        }, session);
        return null;
      }
      const certificate: TerminalCertificate = {
        ...challenge,
        disposition: "allow_stop",
        evidenceRefs: [...input.evidenceRefs].sort(),
      };
      await updateMissionMetadata(input.client, input.root, input.sessionID, {
        certificateReason: null,
        certificateStatus: "issued",
        terminalCertificate: certificate,
      }, session);
      return certificate;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  await updateMissionMetadata(input.client, input.root, input.sessionID, {
    certificateReason: "challenge-timeout",
    certificateStatus: "declined",
    terminalCertificate: null,
  });
  return null;
}

export async function executeMissionSession(options: SessionExecutorOptions): Promise<MissionExecutorResult> {
  const root = path.resolve(options.root);
  const definition = loadMissionDefinition(root, options.missionPath);
  const sliceIndex = definition.slices.findIndex((slice) => slice.id === options.sliceId);
  if (sliceIndex < 0) throw new RoadmapMissionError(`mission slice is unknown: ${options.sliceId}`, 2);
  const slice = definition.slices[sliceIndex];
  const digest = missionDefinitionDigest(definition);
  const resultRelative = safeRelative(root, options.resultPath, "executor result path");
  if (!resultRelative.startsWith(`${definition.evidencePath}/`) || path.posix.extname(resultRelative) !== ".json") {
    throw new RoadmapMissionError("executor result path must remain under the mission evidencePath", 2);
  }
  const server = runtimeUrl(options.serverUrl);
  const runtime = runtimeRef(server, root);
  const client = createOpencodeClient({ baseUrl: server.origin, directory: root });
  const evidenceRefs: string[] = [];
  const phases: MissionExecutorResult["phases"] = [];
  let blocker: MissionBlocker | null = null;
  let rootSessionRef: string | null = null;
  let guardState: MissionExecutorResult["guardState"] = "unknown";
  let questionDisposition: MissionExecutorResult["questionDisposition"] = "none";
  let writerClosure: MissionExecutorResult["writerClosure"] = "terminal";
  let cleanup: MissionExecutorResult["cleanup"] = "not-required";
  let disposition: MissionExecutorResult["disposition"] = "terminal";
  let errorClass: MissionExecutorResult["errorClass"] = "none";
  let failureMessage: string | null = null;
  let terminalCertificate: TerminalCertificate | null = null;
  try {
    const inspection = await inspectRuntime(
      client,
      root,
      expectedActiveChanges(definition, sliceIndex),
      options.parentSessionRef,
    );
    const evidenceBase = path.posix.dirname(resultRelative);
    const evidenceStem = path.posix.basename(resultRelative, ".json");
    const inspectionRef = writeNew(root, `${evidenceBase}/${evidenceStem}.runtime-inspection.json`, {
      ...inspection,
      runtimeRef: runtime,
      schemaVersion: 1,
    });
    evidenceRefs.push(inspectionRef);
    const commands: Array<"opsx-apply" | "opsx-propose"> = slice.operation === "propose"
      ? ["opsx-propose", "opsx-apply"]
      : ["opsx-apply"];
    const initialRequirementIds = phaseRequirementIds(root, slice.changeId, commands[0]);
    const created = await requestData<Record<string, unknown>>(client.session.create({
      directory: root,
      title: `roadmap mission ${definition.missionId}/${slice.id}/attempt-${options.attempt}`,
      metadata: {
        completionGuard: { grindEnabled: true, state: "running" },
        roadmapMission: {
          attempt: options.attempt,
          changeId: slice.changeId,
          acceptedRequirementIds: initialRequirementIds,
          certificateIssuer: ROADMAP_MISSION_CERTIFICATE_ISSUER,
          certificateReason: initialRequirementIds.length === 0 ? "requirements-unavailable" : null,
          certificateStatus: initialRequirementIds.length === 0 ? "declined" : "pending",
          definitionDigest: digest,
          missionId: definition.missionId,
          schemaVersion: 1,
          sliceId: slice.id,
          terminalCertificate: null,
        },
      },
    }), "executor root create");
    rootSessionRef = boundedSingleLine(created.id, "executor root session id", 200);
    cleanup = "unknown";
    writerClosure = "unknown";
    let terminal: { guard: Record<string, unknown>; session: Record<string, unknown> } | null = null;
    let previousRevision: string | null = null;
    for (const command of commands) {
      terminalCertificate = null;
      guardState = "unknown";
      const acceptedRequirementIds = phaseRequirementIds(root, slice.changeId, command);
      await updateMissionMetadata(client, root, rootSessionRef, {
        acceptedRequirementIds,
        certificateReason: acceptedRequirementIds.length === 0 ? "requirements-unavailable" : null,
        certificateStatus: acceptedRequirementIds.length === 0 ? "declined" : "pending",
        command,
        terminalCertificate: null,
      });
      process.stderr.write(`[roadmap-mission-executor ${slice.id}/${command}] starting\n`);
      let phaseStatus: MissionExecutorResult["phases"][number]["status"] = "failed";
      let response: Record<string, unknown> | null = null;
      let phaseRef: string | null = null;
      try {
        response = await boundedRequest<Record<string, unknown>>(
          `executor ${command}`,
          options.timeoutMs,
          (signal) => client.session.command({
            arguments: phaseArguments(slice, command),
            command,
            directory: root,
            sessionID: rootSessionRef!,
          }, { signal }) as Promise<unknown>,
        );
        const info = record(response.info);
        if (info?.error != null) {
          throw new RoadmapMissionError(`executor ${command} returned an assistant error: ${errorMessage(info.error, root, server)}`, 1);
        }
        phaseStatus = "completed";
      } finally {
        const info = record(response?.info);
        phaseRef = writeNew(root, `${evidenceBase}/${evidenceStem}.${command}.json`, {
          command,
          error: info?.error == null ? null : errorMessage(info.error, root, server),
          messageRef: typeof info?.id === "string" ? info.id : null,
          partTypes: Array.isArray(response?.parts)
            ? response.parts.flatMap((part) => typeof record(part)?.type === "string" ? [record(part)?.type] : [])
            : [],
          schemaVersion: 1,
          status: phaseStatus,
        });
        evidenceRefs.push(phaseRef);
        phases.push({ command, evidenceRef: phaseRef, status: phaseStatus });
      }
      if (phaseRef == null) throw new RoadmapMissionError(`executor ${command} produced no phase evidence`, 1);
      const verification = verifyPhase(root, slice.changeId, command, acceptedRequirementIds);
      const verificationRef = writeNew(root, `${evidenceBase}/${evidenceStem}.${command}.verification.json`, {
        command,
        eligible: verification.eligible,
        facts: verification.facts,
        reason: verification.reason,
        requirementIds: verification.requirementIds,
        schemaVersion: 1,
      });
      evidenceRefs.push(verificationRef);
      if (verification.eligible) {
        terminalCertificate = await issueTerminalCertificate({
          client,
          evidenceRefs: [phaseRef, verificationRef],
          requirementIds: verification.requirementIds,
          root,
          sessionID: rootSessionRef,
          timeoutMs: options.timeoutMs,
        });
      } else {
        await updateMissionMetadata(client, root, rootSessionRef, {
          certificateReason: verification.reason,
          certificateStatus: "declined",
          terminalCertificate: null,
        });
      }
      terminal = await waitForTerminalGuard(client, root, rootSessionRef, options.timeoutMs, previousRevision);
      guardState = String(terminal.guard.state ?? "unknown") as MissionExecutorResult["guardState"];
      previousRevision = typeof terminal.guard.lastAuditedRevision === "string"
        ? terminal.guard.lastAuditedRevision
        : previousRevision;
      process.stderr.write(`[roadmap-mission-executor ${slice.id}/${command}] guard=${guardState}\n`);
      if (guardState !== "passed") break;
    }
    if (terminal == null) throw new RoadmapMissionError("executor command phases produced no terminal guard evidence", 1);
    guardState = String(terminal.guard.state ?? "unknown") as MissionExecutorResult["guardState"];
    if (guardState === "product-decision-required" || guardState === "waiting" || guardState === "frontier-reconciling") {
      blocker = completionGuardBlocker(terminal.guard, guardState, slice, rootSessionRef);
      questionDisposition = guardState === "product-decision-required" ? "product-decision-required" : "none";
      writerClosure = await closeOwnership(client, root, rootSessionRef);
      cleanup = writerClosure === "unknown" ? "unknown" : "complete";
      if (writerClosure === "unknown") {
        blocker = null;
        disposition = "paused";
        errorClass = "unknown";
        failureMessage = "Mission blocker was observed but executor ownership closure is unknown";
      } else {
        disposition = blocker.disposition;
        errorClass = blocker.disposition;
        failureMessage = blocker.resumeCondition;
      }
    } else if (guardState === "passed") {
      writerClosure = "terminal";
      cleanup = "complete";
      disposition = "completed";
      errorClass = "none";
    } else if (guardState === "paused" || guardState === "owner-required") {
      writerClosure = await closeOwnership(client, root, rootSessionRef);
      cleanup = writerClosure === "unknown" ? "unknown" : "complete";
      disposition = "paused";
      errorClass = writerClosure === "unknown" ? "unknown" : "paused";
      failureMessage = guardState === "owner-required"
        ? "Legacy owner-required guard state remains paused and was not reinterpreted as a product decision"
        : "Mission root paused before terminal completion";
    } else {
      throw new RoadmapMissionError(`completion guard ended in ${guardState}`, 1);
    }
  } catch (error) {
    if (rootSessionRef != null && writerClosure !== "terminal") {
      writerClosure = await closeOwnership(client, root, rootSessionRef);
      cleanup = writerClosure === "unknown" ? "unknown" : "complete";
    }
    if (errorClass === "none") {
      const transient = transientFailure(error);
      disposition = transient ? "transient" : writerClosure === "unknown" ? "paused" : "terminal";
      errorClass = transient ? "transient" : writerClosure === "unknown" ? "unknown" : "terminal";
      failureMessage = errorMessage(error, root, server);
    }
  }
  const result = parseMissionExecutorResult({
    attempt: options.attempt,
    blocker,
    changeId: slice.changeId,
    cleanup,
    definitionDigest: digest,
    disposition,
    errorClass,
    errorMessage: failureMessage,
    evidenceRefs,
    guardState,
    missionId: definition.missionId,
    phases,
    questionDisposition,
    rootSessionRef,
    runtimeRef: runtime,
    schemaVersion: 1,
    sliceId: slice.id,
    terminalCertificate,
    tool: "roadmap-mission-session-executor",
    writerClosure,
  }, {
    attempt: options.attempt,
    definitionDigest: digest,
    missionId: definition.missionId,
    slice,
  });
  if (result.disposition === "owner-required") {
    throw new RoadmapMissionError("executor attempted to emit a legacy owner-required disposition", 1);
  }
  writeNew(root, resultRelative, result);
  return result;
}
