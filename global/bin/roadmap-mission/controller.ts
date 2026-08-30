import path from "node:path";
import { runPortableCommand } from "../portable-process.ts";
import {
  loadMissionDefinition,
  missionDefinitionDigest,
  parseMissionBlocker,
  RoadmapMissionError,
  stableJson,
} from "./contracts.ts";
import type {
  MissionBlocker,
  MissionParentHandoff,
  RoadmapMissionDefinition,
  RoadmapMissionPreflight,
  RoadmapMissionSlice,
} from "./contracts.ts";
import {
  loadControllerAdapter,
  ROADMAP_COMMAND_TIMEOUT_MS,
  safeProjectRelative,
} from "./controller-adapter.ts";
import type { ControllerAdapter } from "./controller-adapter.ts";
import {
  bounded,
  invokeMissionExecutor,
  missionStopRequested,
  redacted,
} from "./controller-process.ts";
import type { ProcessEvidence } from "./controller-process.ts";
import { expandExecutorArgv, readExecutorResult } from "./controller-result.ts";
import { buildMissionParentHandoff } from "./parent-correlation.ts";
import { preflightMission } from "./preflight.ts";
import {
  readMissionStateProjection,
  readMissionSchedulingFacts,
  readMissionResultFacts,
  ownedPathsOverlap,
  recordMissionTransitionWithLease,
  acquireWriterLease,
  releaseWriterLease,
  replayMissionState,
  selectMissionFrontierStop,
} from "./state.ts";
import type {
  MissionDisposition,
  MissionIdentity,
  MissionParkedSlice,
  MissionSchedulingFacts,
  MissionTransitionDescriptor,
  MissionTransitionKind,
  WriterLease,
} from "./state.ts";

type RunOptions = {
  adapterPath: string;
  checkpointIdentity?: string;
  globalSource: string;
  missionPath: string;
  root: string;
};

export type MissionControllerReport = {
  attempts: number;
  blocker: MissionBlocker | null;
  cursor: number;
  definitionDigest: string;
  exitCode: number;
  missionId: string;
  operation: "run" | "resume";
  parentHandoff?: MissionParentHandoff;
  processEvidence: ProcessEvidence[];
  schemaVersion: 1;
  status: "blocked" | "complete" | "paused" | "paused-unknown" | "product-decision-required" | "waiting";
  tool: "roadmap-mission";
};

class ProcessCleanupUnknownError extends RoadmapMissionError {}

function record(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function archiveRelativePath(root: string, value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new RoadmapMissionError("OpenSpec archive returned no path", 1);
  }
  const absolute = path.isAbsolute(value) ? path.resolve(value) : path.resolve(root, value);
  const relative = safeProjectRelative(root, path.relative(root, absolute).replaceAll("\\", "/"), "archive path");
  if (!relative.startsWith("openspec/changes/archive/")) {
    throw new RoadmapMissionError("OpenSpec archive path is outside the project archive root", 1);
  }
  return relative;
}

function invoke(root: string, argv: string[], timeoutMs: number, additionalRedactions: string[] = []): ProcessEvidence {
  const result = runPortableCommand(root, argv, { capture: true, timeoutMs });
  const roots = [root, ...additionalRedactions];
  return {
    argv: argv.map((value) => redacted(value, roots)),
    cleanupState: result.cleanupState,
    exitCode: result.status,
    signal: result.signal,
    stderr: bounded(redacted(result.stderr, roots)),
    stdout: bounded(redacted(result.stdout, roots)),
    timedOut: result.timedOut,
  };
}

function requireSuccess(evidence: ProcessEvidence, label: string): void {
  if (evidence.cleanupState === "unknown") {
    throw new ProcessCleanupUnknownError(`${label} left process cleanup unknown`, 1);
  }
  if (evidence.exitCode !== 0) {
    const timeout = evidence.timedOut ? " after timeout" : "";
    throw new RoadmapMissionError(`${label} failed${timeout} with exit ${String(evidence.exitCode)}: ${evidence.stderr || evidence.stdout}`, 1);
  }
}

function parseJson(text: string, label: string): Record<string, unknown> {
  try {
    const parsed = record(JSON.parse(text));
    if (parsed == null) throw new Error("JSON root is not an object");
    return parsed;
  } catch (error) {
    throw new RoadmapMissionError(`${label} returned invalid JSON`, 1, { cause: error });
  }
}

function identity(globalSource: string): MissionIdentity {
  return {
    kit: path.basename(path.resolve(globalSource)),
    node: process.version,
    openCode: "executor-adapter",
    openSpec: "cli-readback",
    repository: "project-root",
  };
}

function descriptor(
  definition: RoadmapMissionDefinition,
  cursor: number,
  kind: MissionTransitionKind,
  disposition: MissionDisposition,
  identities: MissionIdentity,
  evidenceRefs: string[],
  input: {
    activeOperation?: MissionTransitionDescriptor["activeOperation"];
    blocker?: MissionBlocker;
    checkpointIdentity?: string | null;
    recovery?: MissionTransitionDescriptor["recovery"];
  } = {},
): MissionTransitionDescriptor {
  return {
    activeOperation: input.activeOperation ?? null,
    ...(input.blocker == null ? {} : { blocker: input.blocker }),
    checkpoint: { identity: input.checkpointIdentity ?? null, mode: definition.checkpoint.mode },
    createdAt: new Date().toISOString(),
    cursor,
    disposition,
    evidenceRefs,
    identities,
    kind,
    recovery: input.recovery ?? { attempts: 0, sliceStartedAt: null },
    schemaVersion: 1,
    sliceId: definition.slices[cursor]?.id ?? null,
  };
}

function operationGate(root: string, globalSource: string, operation: "apply" | "archive", changeId: string): ProcessEvidence {
  return invoke(root, [
    process.execPath,
    path.join(globalSource, "bin", "openspec-operation-gate.ts"),
    "--root",
    root,
    "--operation",
    operation,
    "--change",
    changeId,
  ], ROADMAP_COMMAND_TIMEOUT_MS.openSpec, [globalSource]);
}

function openSpecList(root: string): { evidence: ProcessEvidence; names: string[] } {
  const evidence = invoke(root, ["openspec", "list", "--json"], ROADMAP_COMMAND_TIMEOUT_MS.openSpec);
  requireSuccess(evidence, "OpenSpec list readback");
  const parsed = parseJson(evidence.stdout, "OpenSpec list readback");
  const names = Array.isArray(parsed.changes)
    ? parsed.changes.map(record).filter((item): item is Record<string, unknown> => item != null)
      .map((item) => item.name).filter((name): name is string => typeof name === "string").sort()
    : [];
  return { evidence, names };
}

function parkedOwnedPaths(root: string, definition: RoadmapMissionDefinition): string[] {
  const facts = readMissionSchedulingFacts(root, definition);
  return facts.parkedSlices.flatMap((entry) => definition.slices[entry.cursor].ownedPaths);
}

function gitDirtyPaths(root: string, processEvidence: ProcessEvidence[]): string[] {
  const commands = [
    ["git", "diff", "--no-renames", "--name-only", "-z"],
    ["git", "diff", "--cached", "--no-renames", "--name-only", "-z"],
    ["git", "ls-files", "--others", "--exclude-standard", "-z"],
  ];
  const dirty = new Set<string>();
  for (const argv of commands) {
    const evidence = invoke(root, argv, ROADMAP_COMMAND_TIMEOUT_MS.inspection);
    processEvidence.push(evidence);
    requireSuccess(evidence, "Git checkpoint inventory");
    for (const file of evidence.stdout.split("\0").filter(Boolean)) dirty.add(file.replaceAll("\\", "/"));
  }
  return [...dirty].sort();
}

function localCommitCheckpoint(
  root: string,
  definition: RoadmapMissionDefinition,
  cursor: number,
  archivePath: string,
  processEvidence: ProcessEvidence[],
): string {
  if (!definition.checkpoint.localCommitAuthorized || !definition.allowedEffects.includes("local-commit")) {
    throw new RoadmapMissionError("local-commit checkpoint is not explicitly authorized by the mission", 2);
  }
  const slice = definition.slices[cursor];
  const parkedPaths = parkedOwnedPaths(root, definition);
  const commitSubject = `roadmap-mission(${definition.missionId}): checkpoint ${slice.id}`;
  const existingHead = invoke(root, ["git", "rev-parse", "HEAD"], ROADMAP_COMMAND_TIMEOUT_MS.inspection);
  const existingCommit = invoke(root, ["git", "cat-file", "commit", "HEAD"], ROADMAP_COMMAND_TIMEOUT_MS.inspection);
  processEvidence.push(existingHead, existingCommit);
  requireSuccess(existingHead, "Existing local checkpoint identity readback");
  requireSuccess(existingCommit, "Existing local checkpoint subject readback");
  const existingMessage = existingCommit.stdout.split(/\r?\n\r?\n/, 2)[1] ?? "";
  const existingSubject = existingMessage.split(/\r?\n/, 1)[0];
  if (existingSubject === commitSubject) {
    const runtimeRoot = `.opencode-dev-kit/runtime/roadmap-missions/${definition.missionId}`;
    const dirtyAfterPriorCommit = gitDirtyPaths(root, processEvidence).filter((file) =>
      !ownedPathsOverlap([file], [runtimeRoot, ...parkedPaths])
    );
    if (dirtyAfterPriorCommit.length === 0) return existingHead.stdout.trim();
  }
  const allowed = [
    ...slice.ownedPaths,
    definition.evidencePath,
    `.opencode-dev-kit/runtime/roadmap-missions/${definition.missionId}`,
    archivePath,
  ];
  const dirty = gitDirtyPaths(root, processEvidence);
  const writerLock = `.opencode-dev-kit/runtime/roadmap-missions/${definition.missionId}/writer.lock`;
  const committable = dirty.filter((file) =>
    file !== writerLock && !ownedPathsOverlap([file], parkedPaths)
  );
  const unattributed = committable.filter((file) => !ownedPathsOverlap([file], allowed));
  if (unattributed.length > 0) {
    throw new RoadmapMissionError(`local-commit checkpoint has unattributed dirty paths: ${unattributed.join(", ")}`, 1);
  }
  if (committable.length === 0) throw new RoadmapMissionError("local-commit checkpoint has no mission-owned changes", 1);
  const stage = invoke(root, ["git", "add", "--", ...committable], ROADMAP_COMMAND_TIMEOUT_MS.gitMutation);
  processEvidence.push(stage);
  requireSuccess(stage, "Scoped checkpoint staging");
  const staged = invoke(root, ["git", "diff", "--cached", "--no-renames", "--name-only", "-z"], ROADMAP_COMMAND_TIMEOUT_MS.inspection);
  processEvidence.push(staged);
  requireSuccess(staged, "Scoped checkpoint staged readback");
  const stagedPaths = staged.stdout.split("\0").filter(Boolean).map((file) => file.replaceAll("\\", "/")).sort();
  if (stableList(stagedPaths) !== stableList(committable)) {
    throw new RoadmapMissionError(
      `staged checkpoint paths differ from the attributed dirty set (attributed: ${committable.join(", ")}; staged: ${stagedPaths.join(", ")})`,
      1,
    );
  }
  const commit = invoke(root, ["git", "commit", "-m", commitSubject], ROADMAP_COMMAND_TIMEOUT_MS.gitMutation);
  processEvidence.push(commit);
  requireSuccess(commit, "Local checkpoint commit and hooks");
  const head = invoke(root, ["git", "rev-parse", "HEAD"], ROADMAP_COMMAND_TIMEOUT_MS.inspection);
  processEvidence.push(head);
  requireSuccess(head, "Local checkpoint identity readback");
  const identity = head.stdout.trim();
  if (!/^[0-9a-f]{40,64}$/i.test(identity)) throw new RoadmapMissionError("local checkpoint identity is invalid", 1);
  const remaining = gitDirtyPaths(root, processEvidence).filter((file) =>
    file !== writerLock && !ownedPathsOverlap([file], parkedPaths)
  );
  if (remaining.length > 0) {
    throw new RoadmapMissionError(`local-commit checkpoint left dirty paths: ${remaining.join(", ")}`, 1);
  }
  return identity;
}

function checkpointIdentity(
  options: RunOptions,
  definition: RoadmapMissionDefinition,
  cursor: number,
  archivePath: string,
  processEvidence: ProcessEvidence[],
  externalIdentity?: string,
): string | null {
  if (definition.checkpoint.mode === "evidence-only") {
    return `evidence:${definition.missionId}:${definition.slices[cursor].id}`;
  }
  if (definition.checkpoint.mode === "local-commit") {
    return localCommitCheckpoint(options.root, definition, cursor, archivePath, processEvidence);
  }
  return verifyExternalCheckpoint(options.root, definition, externalIdentity, processEvidence);
}

function stableList(values: string[]): string {
  return JSON.stringify([...values].sort());
}

function verifyExternalCheckpoint(
  root: string,
  definition: RoadmapMissionDefinition,
  supplied: string | undefined,
  processEvidence: ProcessEvidence[],
): string | null {
  if (supplied == null || supplied.trim() === "") return null;
  if (!/^[0-9a-f]{40,64}$/i.test(supplied)) {
    throw new RoadmapMissionError("external checkpoint identity must be a full Git commit id", 2);
  }
  const head = invoke(root, ["git", "rev-parse", "HEAD"], ROADMAP_COMMAND_TIMEOUT_MS.inspection);
  processEvidence.push(head);
  requireSuccess(head, "External checkpoint identity readback");
  if (head.stdout.trim().toLowerCase() !== supplied.toLowerCase()) {
    throw new RoadmapMissionError("external checkpoint identity does not match the current Git HEAD", 1);
  }
  const runtimeRoot = `.opencode-dev-kit/runtime/roadmap-missions/${definition.missionId}`;
  const parkedPaths = parkedOwnedPaths(root, definition);
  const dirty = gitDirtyPaths(root, processEvidence).filter((file) =>
    !ownedPathsOverlap([file], [runtimeRoot, ...parkedPaths])
  );
  if (dirty.length > 0) {
    throw new RoadmapMissionError(`external checkpoint does not contain current mission paths: ${dirty.join(", ")}`, 1);
  }
  return supplied.toLowerCase();
}

function runArchive(
  root: string,
  globalSource: string,
  definition: RoadmapMissionDefinition,
  slice: RoadmapMissionSlice,
  timeoutMs: number,
): ProcessEvidence {
  return invoke(root, [
    process.execPath,
    path.join(globalSource, "bin", "openspec-archive.ts"),
    "--root",
    root,
    "--change",
    slice.changeId,
    "--",
    ...definition.validationArgv,
  ], timeoutMs, [globalSource]);
}

function finishReport(
  operation: "run" | "resume",
  definition: RoadmapMissionDefinition,
  cursor: number,
  attempts: number,
  processEvidence: ProcessEvidence[],
  status: MissionControllerReport["status"],
  blocker: MissionBlocker | null = null,
): MissionControllerReport {
  if ((status === "product-decision-required" || status === "waiting") !== (blocker != null)) {
    throw new RoadmapMissionError("controller terminal frontier status and blocker differ", 1);
  }
  return {
    attempts,
    blocker,
    cursor,
    definitionDigest: missionDefinitionDigest(definition),
    exitCode: status === "complete" ? 0 : 1,
    missionId: definition.missionId,
    operation,
    processEvidence,
    schemaVersion: 1,
    status,
    tool: "roadmap-mission",
  };
}

function preflightBlocker(
  definition: RoadmapMissionDefinition,
  cursor: number,
  preflight: RoadmapMissionPreflight,
): MissionBlocker {
  const slice = definition.slices[cursor];
  const failed = preflight.checks.filter((check) => check.blocking || check.status !== "passed");
  if (failed.length === 0) throw new RoadmapMissionError("blocked preflight exposed no blocking check", 1);
  const protectedEffects = slice.effectClasses.filter((effect) =>
    !["local-read", "local-write", "provider-inference", "local-commit"].includes(effect)
  );
  const effectWaitKind = protectedEffects.some((effect) => effect === "cost")
    ? "budget"
    : protectedEffects.some((effect) => effect === "credentials")
      ? "capability"
      : protectedEffects.some((effect) => effect === "external" || effect === "remote")
        ? "external"
        : protectedEffects.length > 0
          ? "safety"
          : null;
  const waitKind: NonNullable<MissionBlocker["waitKind"]> = failed.some((check) => check.id === "mission:writer-lease")
    ? "writer-liveness"
    : effectWaitKind ?? "technical";
  const affectedItemRefs = slice.workItemRefs ?? [slice.id];
  const resumeCondition = `mission preflight checks pass: ${failed.map((check) => check.id).sort().join(",")}`;
  return parseMissionBlocker({
    affectedItemRefs,
    decisions: [],
    disposition: "waiting",
    evidenceRefs: [definition.evidencePath],
    frontier: null,
    gates: failed.map((check) => ({
      affectedItemRefs,
      evidenceRefs: [definition.evidencePath],
      id: check.id,
      kind: check.id === "mission:writer-lease" ? "writer-liveness" : waitKind,
      resumeCondition: `mission preflight check passes: ${check.id}`,
    })),
    resumeCondition,
    rootSessionRef: null,
    source: "mission-preflight",
    waitKind,
  }, "mission preflight blocker");
}

function waitingSliceBlocker(
  definition: RoadmapMissionDefinition,
  cursor: number,
  gateRef: string,
  resumeCondition: string,
  waitKind: NonNullable<MissionBlocker["waitKind"]>,
): MissionBlocker {
  const slice = definition.slices[cursor];
  const affectedItemRefs = slice.workItemRefs ?? [slice.id];
  return parseMissionBlocker({
    affectedItemRefs,
    decisions: [],
    disposition: "waiting",
    evidenceRefs: [definition.evidencePath],
    frontier: null,
    gates: [{
      affectedItemRefs,
      evidenceRefs: [definition.evidencePath],
      id: gateRef,
      kind: waitKind,
      resumeCondition,
    }],
    resumeCondition,
    rootSessionRef: null,
    source: "mission-preflight",
    waitKind,
  }, "mission waiting blocker");
}

function runnableSliceIndex(
  definition: RoadmapMissionDefinition,
  facts: MissionSchedulingFacts,
): number | null {
  const completed = new Set(facts.completedSliceIds);
  const parkedIds = new Set(facts.parkedSlices.map((entry) => definition.slices[entry.cursor].id));
  for (const [index, slice] of definition.slices.entries()) {
    if (completed.has(slice.id) || parkedIds.has(slice.id)) continue;
    if (!slice.dependsOn.every((dependency) => completed.has(dependency))) continue;
    if (facts.parkedSlices.some((parked) => ownedPathsOverlap(slice.ownedPaths, definition.slices[parked.cursor].ownedPaths))) continue;
    return index;
  }
  return null;
}

function resumableParkedSlice(
  definition: RoadmapMissionDefinition,
  facts: MissionSchedulingFacts,
  resumableTransitionDigests: Set<string>,
  consumedTransitionDigests: Set<string>,
): MissionParkedSlice | null {
  const completed = new Set(facts.completedSliceIds);
  return facts.parkedSlices.find((parked) => {
    const slice = definition.slices[parked.cursor];
    return resumableTransitionDigests.has(parked.transitionDigest)
      && !consumedTransitionDigests.has(parked.transitionDigest)
      && slice.dependsOn.every((dependency) => completed.has(dependency))
      && !facts.parkedSlices.some((other) =>
        other.cursor !== parked.cursor && ownedPathsOverlap(slice.ownedPaths, definition.slices[other.cursor].ownedPaths)
      );
  }) ?? null;
}

async function execute(
  options: RunOptions,
  operation: "run" | "resume",
  signalRequested: () => boolean,
): Promise<MissionControllerReport> {
  const definition = loadMissionDefinition(options.root, options.missionPath);
  const adapter = loadControllerAdapter(options.root, options.adapterPath);
  const processEvidence: ProcessEvidence[] = [];
  const identities = identity(options.globalSource);
  const replay = replayMissionState(options.root, options.missionPath);
  if (replay.status !== "valid") throw new RoadmapMissionError("mission state replay is blocked", 1);
  const current = readMissionStateProjection(options.root, definition);
  if (current?.activeOperation != null) throw new RoadmapMissionError("mission has an unknown active operation", 1);
  if (current?.disposition === "paused-unknown") {
    throw new RoadmapMissionError("mission is paused-unknown; reconcile writer liveness before resume", 1);
  }
  const cursor = current?.cursor ?? 0;
  if (current?.disposition === "complete") {
    return finishReport(operation, definition, cursor, 0, processEvidence, "complete");
  }
  const writerLease = acquireWriterLease(options.root, definition, new Date().toISOString());
  try {
    return await executeOwned(options, operation, definition, adapter, processEvidence, identities, current, cursor, writerLease, signalRequested);
  } finally {
    releaseWriterLease(options.root, writerLease);
  }
}

async function executeOwned(
  options: RunOptions,
  operation: "run" | "resume",
  definition: RoadmapMissionDefinition,
  adapter: ControllerAdapter,
  processEvidence: ProcessEvidence[],
  identities: MissionIdentity,
  current: ReturnType<typeof readMissionStateProjection>,
  initialCursor: number,
  writerLease: WriterLease,
  signalRequested: () => boolean,
): Promise<MissionControllerReport> {
  let cursor = initialCursor;
  const attributedArchivePaths = [...readMissionResultFacts(options.root, definition).archiveRefs];
  const initialScheduling = readMissionSchedulingFacts(options.root, definition);
  const resumableTransitionDigests = new Set(
    operation === "resume" ? initialScheduling.parkedSlices.map((entry) => entry.transitionDigest) : [],
  );
  const consumedTransitionDigests = new Set<string>();
  const recordTransition = (value: MissionTransitionDescriptor): void => {
    recordMissionTransitionWithLease(options.root, definition, value, writerLease);
  };
  const finishStop = (attempts: number): MissionControllerReport => {
    const projection = readMissionStateProjection(options.root, definition);
    if (projection == null) throw new RoadmapMissionError("cannot stop a mission before its preflight transition", 1);
    const disposition: MissionDisposition = projection.activeOperation == null ? "paused" : "paused-unknown";
    recordTransition({
      activeOperation: projection.activeOperation,
      checkpoint: projection.checkpoint,
      createdAt: new Date().toISOString(),
      cursor: projection.cursor,
      disposition,
      evidenceRefs: projection.evidenceRefs,
      identities: projection.identities,
      kind: "pause",
      recovery: projection.recovery,
      schemaVersion: 1,
      sliceId: projection.sliceId,
    });
    return finishReport(operation, definition, projection.cursor, attempts, processEvidence, disposition);
  };

  if (current?.disposition === "awaiting-checkpoint") {
    const archivePath = current.evidenceRefs.find((reference) => reference.startsWith("openspec/changes/archive/"));
    if (archivePath == null) throw new RoadmapMissionError("awaiting-checkpoint state has no archived path evidence", 1);
    let checkpoint: string | null;
    try {
      checkpoint = checkpointIdentity(options, definition, current.cursor, archivePath, processEvidence, options.checkpointIdentity);
    } catch (error) {
      if (error instanceof ProcessCleanupUnknownError) {
        recordTransition(descriptor(
          definition,
          current.cursor,
          "pause",
          "paused-unknown",
          identities,
          current.evidenceRefs,
          {
            activeOperation: { kind: "checkpoint", processRef: `checkpoint-${definition.slices[current.cursor].id}`, sessionRef: null },
            recovery: current.recovery,
          },
        ));
      }
      throw error;
    }
    if (checkpoint == null) {
      if (current.lastTransitionKind !== "pause") {
        recordTransition(descriptor(
          definition,
          current.cursor,
          "pause",
          "awaiting-checkpoint",
          identities,
          current.evidenceRefs,
          { recovery: current.recovery },
        ));
      }
      return finishReport(operation, definition, current.cursor, current.recovery.attempts, processEvidence, "paused");
    }
    recordTransition(descriptor(
      definition,
      current.cursor,
      "checkpoint",
      "ready",
      identities,
      current.evidenceRefs,
      { checkpointIdentity: checkpoint, recovery: current.recovery },
    ));
    if (!attributedArchivePaths.includes(archivePath)) attributedArchivePaths.push(archivePath);
  }

  missionLoop: while (true) {
    const facts = readMissionSchedulingFacts(options.root, definition);
    if (facts.completedSliceIds.length === definition.slices.length) {
      const projection = readMissionStateProjection(options.root, definition);
      if (projection == null) throw new RoadmapMissionError("completed scheduling facts have no mission projection", 1);
      if (projection.disposition !== "complete") {
        recordTransition(descriptor(
          definition,
          projection.cursor,
          "terminal-stop",
          "complete",
          identities,
          projection.evidenceRefs,
          { checkpointIdentity: projection.checkpoint.identity, recovery: projection.recovery },
        ));
      }
      return finishReport(operation, definition, projection.cursor, projection.recovery.attempts, processEvidence, "complete");
    }
    const stopProjection = readMissionStateProjection(options.root, definition);
    if (stopProjection != null && missionStopRequested(options.root, definition, signalRequested())) {
      return finishStop(stopProjection.recovery.attempts);
    }

    const resumable = resumableParkedSlice(
      definition,
      facts,
      resumableTransitionDigests,
      consumedTransitionDigests,
    );
    const runnable = resumable == null ? runnableSliceIndex(definition, facts) : null;
    if (resumable == null && runnable == null) {
      const parked = selectMissionFrontierStop(facts);
      if (parked == null) {
        return finishReport(operation, definition, cursor, 0, processEvidence, "blocked");
      }
      cursor = parked.cursor;
      const projection = readMissionStateProjection(options.root, definition);
      if (projection == null) throw new RoadmapMissionError("parked scheduling facts have no mission projection", 1);
      if (
        projection.lastTransitionKind !== "frontier-stop" ||
        projection.cursor !== parked.cursor ||
        projection.disposition !== parked.blocker.disposition ||
        stableJson(projection.blocker ?? null) !== stableJson(parked.blocker)
      ) {
        recordTransition(descriptor(
          definition,
          parked.cursor,
          "frontier-stop",
          parked.blocker.disposition,
          identities,
          [...new Set([...projection.evidenceRefs, definition.evidencePath])].sort(),
          {
            blocker: parked.blocker,
            checkpointIdentity: projection.checkpoint.identity,
            recovery: parked.recovery,
          },
        ));
      }
      return finishReport(
        operation,
        definition,
        parked.cursor,
        parked.recovery.attempts,
        processEvidence,
        parked.blocker.disposition,
        parked.blocker,
      );
    }

    const selectedParked = resumable;
    cursor = selectedParked?.cursor ?? runnable!;
    const slice = definition.slices[cursor];
    let projection = readMissionStateProjection(options.root, definition);
    if (selectedParked != null) {
      recordTransition(descriptor(
        definition,
        cursor,
        "slice-resume",
        "ready",
        identities,
        [...new Set([...(projection?.evidenceRefs ?? []), definition.evidencePath])].sort(),
        {
          blocker: selectedParked.blocker,
          checkpointIdentity: projection?.checkpoint.identity ?? null,
          recovery: {
            attempts: selectedParked.recovery.attempts,
            sliceStartedAt: selectedParked.recovery.attempts === 0 ? null : new Date().toISOString(),
          },
        },
      ));
      consumedTransitionDigests.add(selectedParked.transitionDigest);
      projection = readMissionStateProjection(options.root, definition);
    } else if (projection != null && projection.cursor !== cursor) {
      recordTransition(descriptor(
        definition,
        cursor,
        "successor-activation",
        "ready",
        identities,
        [...new Set([...projection.evidenceRefs, definition.evidencePath])].sort(),
        { checkpointIdentity: projection.checkpoint.identity },
      ));
      projection = readMissionStateProjection(options.root, definition);
    }

    const attributedSliceIds = [...new Set([
      ...facts.completedSliceIds,
      ...facts.parkedSlices.map((entry) => definition.slices[entry.cursor].id),
    ])];
    const retryingCurrentSlice = selectedParked != null
      || (projection?.cursor === cursor && projection.recovery.attempts > 0);
    const preflight = preflightMission(options.root, options.globalSource, options.missionPath, cursor, {
      allowCurrentSliceDirty: retryingCurrentSlice,
      attributedPaths: attributedArchivePaths,
      attributedSliceIds,
      completedSliceIds: facts.completedSliceIds,
      writerLeaseOwned: true,
    });
    if (projection == null) {
      recordTransition(descriptor(
        definition,
        cursor,
        "preflight",
        preflight.status === "eligible" ? "ready" : "blocked",
        identities,
        [definition.evidencePath],
      ));
      projection = readMissionStateProjection(options.root, definition);
    }
    if (preflight.status !== "eligible") {
      const blocker = preflightBlocker(definition, cursor, preflight);
      const recovery = projection?.cursor === cursor
        ? projection.recovery
        : { attempts: 0, sliceStartedAt: null };
      recordTransition(descriptor(
        definition,
        cursor,
        "slice-blocked",
        "waiting",
        identities,
        [...new Set([...(projection?.evidenceRefs ?? []), definition.evidencePath])].sort(),
        { blocker, checkpointIdentity: projection?.checkpoint.identity ?? null, recovery },
      ));
      continue missionLoop;
    }

    if (slice.operation === "continue") {
      const applyGate = operationGate(options.root, options.globalSource, "apply", slice.changeId);
      processEvidence.push(applyGate);
      if (applyGate.cleanupState === "unknown") {
        throw new ProcessCleanupUnknownError("Apply operation gate left process cleanup unknown", 1);
      }
      let applyReady = applyGate.exitCode === 0;
      if (applyReady) {
        const applyGateOutput = parseJson(applyGate.stdout, "Apply operation gate");
        applyReady = applyGateOutput.status === "passed" || applyGateOutput.status === "warning";
      }
      if (!applyReady) {
        const blocker = waitingSliceBlocker(
          definition,
          cursor,
          `operation-gate:${slice.id}`,
          `OpenSpec apply operation gate passes for ${slice.changeId}`,
          "technical",
        );
        const latest = readMissionStateProjection(options.root, definition);
        recordTransition(descriptor(
          definition,
          cursor,
          "slice-blocked",
          "waiting",
          identities,
          [...new Set([...(latest?.evidenceRefs ?? []), definition.evidencePath])].sort(),
          {
            blocker,
            checkpointIdentity: latest?.checkpoint.identity ?? null,
            recovery: latest?.recovery ?? { attempts: 0, sliceStartedAt: null },
          },
        ));
        continue missionLoop;
      }
    }

    projection = readMissionStateProjection(options.root, definition);
    let attempts = projection?.cursor === cursor ? projection.recovery.attempts : 0;
    const persistedStartedAt = projection?.cursor === cursor ? projection.recovery.sliceStartedAt : null;
    const startedAt = persistedStartedAt == null ? Date.now() : Date.parse(persistedStartedAt);
    const sliceStartedAt = persistedStartedAt ?? new Date(startedAt).toISOString();
    if (attempts >= adapter.maxAttemptsPerSlice || Date.now() - startedAt >= adapter.maxWallClockMsPerSlice) {
      const resumeCondition = attempts >= adapter.maxAttemptsPerSlice
        ? `mission attempt limit permits another attempt for ${slice.id}`
        : `mission wall-clock limit permits another attempt for ${slice.id}`;
      const blocker = waitingSliceBlocker(
        definition,
        cursor,
        `execution-budget:${slice.id}`,
        resumeCondition,
        "budget",
      );
      recordTransition(descriptor(
        definition,
        cursor,
        "slice-blocked",
        "waiting",
        identities,
        [definition.evidencePath],
        {
          blocker,
          checkpointIdentity: projection?.checkpoint.identity ?? null,
          recovery: attempts === 0 ? { attempts: 0, sliceStartedAt: null } : { attempts, sliceStartedAt },
        },
      ));
      continue missionLoop;
    }

    while (attempts < adapter.maxAttemptsPerSlice && Date.now() - startedAt < adapter.maxWallClockMsPerSlice) {
      if (missionStopRequested(options.root, definition, signalRequested())) return finishStop(attempts);
      attempts++;
      const recovery = { attempts, sliceStartedAt };
      const executorResultPath = `${definition.evidencePath}/${slice.id}/attempt-${attempts}/result.json`;
      const argv = expandExecutorArgv(
        adapter.executorArgv,
        definition,
        slice,
        attempts,
        options.globalSource,
        options.missionPath,
        options.root,
        executorResultPath,
      );
      const beforeLaunch = readMissionStateProjection(options.root, definition);
      recordTransition(descriptor(
        definition,
        cursor,
        "session-launch",
        "running",
        identities,
        [definition.evidencePath],
        {
          activeOperation: { kind: "session", processRef: `attempt-${attempts}`, sessionRef: null },
          checkpointIdentity: beforeLaunch?.checkpoint.identity ?? null,
          recovery,
        },
      ));
      const remainingMs = adapter.maxWallClockMsPerSlice - (Date.now() - startedAt);
      const executor = await invokeMissionExecutor(
        options.root,
        options.globalSource,
        definition,
        slice,
        argv,
        Math.max(1, remainingMs),
        signalRequested,
      );
      processEvidence.push(executor);
      if (missionStopRequested(options.root, definition, signalRequested())) {
        recordTransition(descriptor(
          definition,
          cursor,
          "session-completion",
          "paused",
          identities,
          [definition.evidencePath],
          { checkpointIdentity: beforeLaunch?.checkpoint.identity ?? null, recovery },
        ));
        return finishStop(attempts);
      }
      let executorResult: ReturnType<typeof readExecutorResult>;
      try {
        executorResult = readExecutorResult(options.root, definition, slice, attempts, executorResultPath);
        if (executorResult.disposition !== "owner-required") {
          executor.executorDisposition = executorResult.disposition;
        }
        executor.executorResultPath = executorResultPath;
        const expectedExit = executorResult.disposition === "completed"
          ? 0
          : executorResult.disposition === "owner-required" || executorResult.disposition === "paused"
          ? 3
          : 1;
        if (executor.exitCode !== expectedExit) {
          throw new RoadmapMissionError("executor process exit does not match its structured disposition", 1);
        }
      } catch (error) {
        executor.resultError = bounded(error instanceof Error ? error.message : String(error), 1_000);
        recordTransition(descriptor(
          definition,
          cursor,
          "pause",
          "paused-unknown",
          identities,
          [definition.evidencePath],
          {
            activeOperation: { kind: "session", processRef: `attempt-${attempts}`, sessionRef: null },
            checkpointIdentity: beforeLaunch?.checkpoint.identity ?? null,
            recovery,
          },
        ));
        return finishReport(operation, definition, cursor, attempts, processEvidence, "paused-unknown");
      }
      const executorEvidenceRefs = [...new Set([definition.evidencePath, executorResultPath, ...executorResult.evidenceRefs])].sort();
      const writerUnknown = executorResult.writerClosure === "unknown" || executorResult.cleanup === "unknown";
      const completionDisposition: MissionDisposition = writerUnknown
        ? "paused-unknown"
        : executorResult.disposition === "completed"
          ? "ready"
          : executorResult.disposition === "product-decision-required" || executorResult.disposition === "waiting"
            ? executorResult.disposition
            : executorResult.disposition === "terminal"
              ? "blocked"
              : "paused";
      recordTransition(descriptor(
        definition,
        cursor,
        "session-completion",
        completionDisposition,
        identities,
        executorEvidenceRefs,
        {
          ...(executorResult.blocker == null ? {} : { blocker: executorResult.blocker }),
          ...(writerUnknown ? { activeOperation: { kind: "session" as const, processRef: `attempt-${attempts}`, sessionRef: null } } : {}),
          checkpointIdentity: beforeLaunch?.checkpoint.identity ?? null,
          recovery,
        },
      ));
      if (writerUnknown) return finishReport(operation, definition, cursor, attempts, processEvidence, "paused-unknown");
      if (executorResult.disposition === "transient") continue;
      if (executorResult.disposition === "product-decision-required" || executorResult.disposition === "waiting") {
        if (executorResult.blocker == null) throw new RoadmapMissionError("executor blocker result omitted blocker facts", 1);
        continue missionLoop;
      }
      if (executorResult.disposition === "owner-required" || executorResult.disposition === "paused") {
        recordTransition(descriptor(
          definition,
          cursor,
          "pause",
          "paused",
          identities,
          executorEvidenceRefs,
          { checkpointIdentity: beforeLaunch?.checkpoint.identity ?? null, recovery },
        ));
        return finishReport(operation, definition, cursor, attempts, processEvidence, "paused");
      }
      if (executorResult.disposition === "terminal") {
        recordTransition(descriptor(
          definition,
          cursor,
          "terminal-stop",
          "blocked",
          identities,
          executorEvidenceRefs,
          { checkpointIdentity: beforeLaunch?.checkpoint.identity ?? null, recovery },
        ));
        return finishReport(operation, definition, cursor, attempts, processEvidence, "blocked");
      }

      const postExecutorApplyGate = operationGate(options.root, options.globalSource, "apply", slice.changeId);
      processEvidence.push(postExecutorApplyGate);
      if (postExecutorApplyGate.exitCode !== 0) continue;
      const postExecutorApplyGateOutput = parseJson(postExecutorApplyGate.stdout, "Post-executor apply operation gate");
      if (postExecutorApplyGateOutput.status !== "passed" && postExecutorApplyGateOutput.status !== "warning") continue;

      const archiveGate = operationGate(options.root, options.globalSource, "archive", slice.changeId);
      processEvidence.push(archiveGate);
      if (archiveGate.exitCode !== 0) continue;
      const archiveGateOutput = parseJson(archiveGate.stdout, "Archive operation gate");
      if (archiveGateOutput.status !== "passed" && archiveGateOutput.status !== "warning") continue;

      recordTransition(descriptor(
        definition,
        cursor,
        "archive-launch",
        "running",
        identities,
        [definition.evidencePath],
        {
          activeOperation: { kind: "archive", processRef: `archive-${slice.id}`, sessionRef: null },
          checkpointIdentity: beforeLaunch?.checkpoint.identity ?? null,
          recovery,
        },
      ));
      let archivePath: string;
      try {
        const archive = runArchive(options.root, options.globalSource, definition, slice, adapter.validationTimeoutMs);
        processEvidence.push(archive);
        requireSuccess(archive, "OpenSpec complete archive");
        const archiveOutput = parseJson(archive.stdout, "OpenSpec complete archive");
        if (archiveOutput.status !== "archived" || archiveOutput.change !== slice.changeId) {
          throw new RoadmapMissionError("OpenSpec archive returned no matching archived result", 1);
        }
        archivePath = archiveRelativePath(options.root, archiveOutput.path);
        const readback = openSpecList(options.root);
        processEvidence.push(readback.evidence);
        if (readback.names.includes(slice.changeId)) throw new RoadmapMissionError("Archived change remains active after readback", 1);
      } catch (error) {
        recordTransition(descriptor(
          definition,
          cursor,
          error instanceof ProcessCleanupUnknownError ? "pause" : "terminal-stop",
          error instanceof ProcessCleanupUnknownError ? "paused-unknown" : "blocked",
          identities,
          [definition.evidencePath],
          {
            ...(error instanceof ProcessCleanupUnknownError
              ? { activeOperation: { kind: "archive" as const, processRef: `archive-${slice.id}`, sessionRef: null } }
              : {}),
            checkpointIdentity: beforeLaunch?.checkpoint.identity ?? null,
            recovery,
          },
        ));
        throw error;
      }
      recordTransition(descriptor(
        definition,
        cursor,
        "archive",
        "awaiting-checkpoint",
        identities,
        [definition.evidencePath, archivePath],
        { checkpointIdentity: beforeLaunch?.checkpoint.identity ?? null, recovery },
      ));
      if (!attributedArchivePaths.includes(archivePath)) attributedArchivePaths.push(archivePath);
      let checkpoint: string | null;
      try {
        checkpoint = checkpointIdentity(options, definition, cursor, archivePath, processEvidence);
      } catch (error) {
        if (error instanceof ProcessCleanupUnknownError) {
          recordTransition(descriptor(
            definition,
            cursor,
            "pause",
            "paused-unknown",
            identities,
            [definition.evidencePath, archivePath],
            {
              activeOperation: { kind: "checkpoint", processRef: `checkpoint-${slice.id}`, sessionRef: null },
              checkpointIdentity: beforeLaunch?.checkpoint.identity ?? null,
              recovery,
            },
          ));
        }
        throw error;
      }
      if (checkpoint == null) {
        recordTransition(descriptor(
          definition,
          cursor,
          "pause",
          "awaiting-checkpoint",
          identities,
          [definition.evidencePath, archivePath],
          { checkpointIdentity: beforeLaunch?.checkpoint.identity ?? null, recovery },
        ));
        return finishReport(operation, definition, cursor, attempts, processEvidence, "paused");
      }
      recordTransition(descriptor(
        definition,
        cursor,
        "checkpoint",
        "ready",
        identities,
        [definition.evidencePath, archivePath],
        { checkpointIdentity: checkpoint, recovery },
      ));
      continue missionLoop;
    }

    const blocker = waitingSliceBlocker(
      definition,
      cursor,
      `execution-budget:${slice.id}`,
      `mission execution budget permits another attempt for ${slice.id}`,
      "budget",
    );
    recordTransition(descriptor(
      definition,
      cursor,
      "slice-blocked",
      "waiting",
      identities,
      [definition.evidencePath],
      {
        blocker,
        checkpointIdentity: readMissionStateProjection(options.root, definition)?.checkpoint.identity ?? null,
        recovery: { attempts, sliceStartedAt },
      },
    ));
    continue missionLoop;
  }
}

async function executeWithSignals(options: RunOptions, operation: "run" | "resume"): Promise<MissionControllerReport> {
  let signalRequested = false;
  const onSignal = (): void => {
    signalRequested = true;
  };
  process.on("SIGINT", onSignal);
  process.on("SIGTERM", onSignal);
  try {
    const report = await execute(options, operation, () => signalRequested);
    const definition = loadMissionDefinition(options.root, options.missionPath);
    return definition.parent == null
      ? report
      : {
          ...report,
          parentHandoff: buildMissionParentHandoff(
            options.root,
            options.missionPath,
            definition,
            report.status,
            report.processEvidence,
          ),
        };
  } finally {
    process.off("SIGINT", onSignal);
    process.off("SIGTERM", onSignal);
  }
}

export async function runMissionController(options: RunOptions): Promise<MissionControllerReport> {
  return await executeWithSignals(options, "run");
}

export async function resumeMissionController(options: RunOptions): Promise<MissionControllerReport> {
  return await executeWithSignals(options, "resume");
}
