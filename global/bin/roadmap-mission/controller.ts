import fs from "node:fs";
import path from "node:path";
import { runPortableCommand } from "../portable-process.ts";
import {
  loadMissionDefinition,
  missionDefinitionDigest,
  RoadmapMissionError,
} from "./contracts.ts";
import type {
  MissionExecutorResult,
  RoadmapMissionDefinition,
  RoadmapMissionSlice,
} from "./contracts.ts";
import { loadControllerAdapter, safeProjectRelative } from "./controller-adapter.ts";
import type { ControllerAdapter } from "./controller-adapter.ts";
import {
  bounded,
  invokeMissionExecutor,
  missionStopRequested,
  redacted,
} from "./controller-process.ts";
import type { ProcessEvidence } from "./controller-process.ts";
import { expandExecutorArgv, readExecutorResult } from "./controller-result.ts";
import { preflightMission } from "./preflight.ts";
import {
  readMissionStateProjection,
  recordMissionTransitionWithLease,
  acquireWriterLease,
  releaseWriterLease,
  replayMissionState,
} from "./state.ts";
import type {
  MissionDisposition,
  MissionIdentity,
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
  cursor: number;
  definitionDigest: string;
  exitCode: number;
  missionId: string;
  operation: "run" | "resume";
  processEvidence: ProcessEvidence[];
  schemaVersion: 1;
  status: "blocked" | "complete" | "paused" | "paused-unknown";
  tool: "roadmap-mission";
};

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

function invoke(root: string, argv: string[], timeoutMs?: number, additionalRedactions: string[] = []): ProcessEvidence {
  const result = runPortableCommand(root, argv, { capture: true, timeoutMs });
  const roots = [root, ...additionalRedactions];
  return {
    argv: argv.map((value) => redacted(value, roots)),
    exitCode: result.status,
    signal: result.signal,
    stderr: bounded(redacted(result.stderr, roots)),
    stdout: bounded(redacted(result.stdout, roots)),
  };
}

function requireSuccess(evidence: ProcessEvidence, label: string): void {
  if (evidence.exitCode !== 0) {
    throw new RoadmapMissionError(`${label} failed with exit ${String(evidence.exitCode)}: ${evidence.stderr || evidence.stdout}`, 1);
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
    checkpointIdentity?: string | null;
    recovery?: MissionTransitionDescriptor["recovery"];
  } = {},
): MissionTransitionDescriptor {
  return {
    activeOperation: input.activeOperation ?? null,
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
  ], undefined, [globalSource]);
}

function openSpecList(root: string): { evidence: ProcessEvidence; names: string[] } {
  const evidence = invoke(root, ["openspec", "list", "--json"]);
  requireSuccess(evidence, "OpenSpec list readback");
  const parsed = parseJson(evidence.stdout, "OpenSpec list readback");
  const names = Array.isArray(parsed.changes)
    ? parsed.changes.map(record).filter((item): item is Record<string, unknown> => item != null)
      .map((item) => item.name).filter((name): name is string => typeof name === "string").sort()
    : [];
  return { evidence, names };
}

function pathOverlaps(file: string, owned: string): boolean {
  return file === owned || file.startsWith(`${owned}/`) || owned.startsWith(`${file}/`);
}

function gitDirtyPaths(root: string, processEvidence: ProcessEvidence[]): string[] {
  const commands = [
    ["git", "diff", "--no-renames", "--name-only", "-z"],
    ["git", "diff", "--cached", "--no-renames", "--name-only", "-z"],
    ["git", "ls-files", "--others", "--exclude-standard", "-z"],
  ];
  const dirty = new Set<string>();
  for (const argv of commands) {
    const evidence = invoke(root, argv);
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
  const commitSubject = `roadmap-mission(${definition.missionId}): checkpoint ${slice.id}`;
  const existingHead = invoke(root, ["git", "rev-parse", "HEAD"]);
  const existingCommit = invoke(root, ["git", "cat-file", "commit", "HEAD"]);
  processEvidence.push(existingHead, existingCommit);
  requireSuccess(existingHead, "Existing local checkpoint identity readback");
  requireSuccess(existingCommit, "Existing local checkpoint subject readback");
  const existingMessage = existingCommit.stdout.split(/\r?\n\r?\n/, 2)[1] ?? "";
  const existingSubject = existingMessage.split(/\r?\n/, 1)[0];
  if (existingSubject === commitSubject) {
    const runtimeRoot = `.opencode-dev-kit/runtime/roadmap-missions/${definition.missionId}`;
    const dirtyAfterPriorCommit = gitDirtyPaths(root, processEvidence).filter((file) => !pathOverlaps(file, runtimeRoot));
    if (dirtyAfterPriorCommit.length === 0) return existingHead.stdout.trim();
  }
  const allowed = [
    ...definition.slices.slice(0, cursor + 1).flatMap((slice) => slice.ownedPaths),
    definition.evidencePath,
    `.opencode-dev-kit/runtime/roadmap-missions/${definition.missionId}`,
    archivePath,
  ];
  const dirty = gitDirtyPaths(root, processEvidence);
  const writerLock = `.opencode-dev-kit/runtime/roadmap-missions/${definition.missionId}/writer.lock`;
  const committable = dirty.filter((file) => file !== writerLock);
  const unattributed = committable.filter((file) => !allowed.some((owned) => pathOverlaps(file, owned)));
  if (unattributed.length > 0) {
    throw new RoadmapMissionError(`local-commit checkpoint has unattributed dirty paths: ${unattributed.join(", ")}`, 1);
  }
  if (committable.length === 0) throw new RoadmapMissionError("local-commit checkpoint has no mission-owned changes", 1);
  const stage = invoke(root, ["git", "add", "--", ...committable]);
  processEvidence.push(stage);
  requireSuccess(stage, "Scoped checkpoint staging");
  const staged = invoke(root, ["git", "diff", "--cached", "--no-renames", "--name-only", "-z"]);
  processEvidence.push(staged);
  requireSuccess(staged, "Scoped checkpoint staged readback");
  const stagedPaths = staged.stdout.split("\0").filter(Boolean).map((file) => file.replaceAll("\\", "/")).sort();
  if (stableList(stagedPaths) !== stableList(committable)) {
    throw new RoadmapMissionError(
      `staged checkpoint paths differ from the attributed dirty set (attributed: ${committable.join(", ")}; staged: ${stagedPaths.join(", ")})`,
      1,
    );
  }
  const commit = invoke(root, ["git", "commit", "-m", commitSubject]);
  processEvidence.push(commit);
  requireSuccess(commit, "Local checkpoint commit and hooks");
  const head = invoke(root, ["git", "rev-parse", "HEAD"]);
  processEvidence.push(head);
  requireSuccess(head, "Local checkpoint identity readback");
  const identity = head.stdout.trim();
  if (!/^[0-9a-f]{40,64}$/i.test(identity)) throw new RoadmapMissionError("local checkpoint identity is invalid", 1);
  const remaining = gitDirtyPaths(root, processEvidence).filter((file) => file !== writerLock);
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
  const head = invoke(root, ["git", "rev-parse", "HEAD"]);
  processEvidence.push(head);
  requireSuccess(head, "External checkpoint identity readback");
  if (head.stdout.trim().toLowerCase() !== supplied.toLowerCase()) {
    throw new RoadmapMissionError("external checkpoint identity does not match the current Git HEAD", 1);
  }
  const runtimeRoot = `.opencode-dev-kit/runtime/roadmap-missions/${definition.missionId}`;
  const dirty = gitDirtyPaths(root, processEvidence).filter((file) => !pathOverlaps(file, runtimeRoot));
  if (dirty.length > 0) {
    throw new RoadmapMissionError(`external checkpoint does not contain current mission paths: ${dirty.join(", ")}`, 1);
  }
  return supplied.toLowerCase();
}

function runArchive(root: string, globalSource: string, definition: RoadmapMissionDefinition, slice: RoadmapMissionSlice): ProcessEvidence {
  return invoke(root, [
    process.execPath,
    path.join(globalSource, "bin", "openspec-archive.ts"),
    "--root",
    root,
    "--change",
    slice.changeId,
    "--",
    ...definition.validationArgv,
  ], undefined, [globalSource]);
}

function finishReport(
  operation: "run" | "resume",
  definition: RoadmapMissionDefinition,
  cursor: number,
  attempts: number,
  processEvidence: ProcessEvidence[],
  status: MissionControllerReport["status"],
): MissionControllerReport {
  return {
    attempts,
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
  let cursor = current?.cursor ?? 0;
  if (current?.disposition === "complete") {
    return finishReport(operation, definition, cursor, 0, processEvidence, "complete");
  }

  if (current?.disposition !== "awaiting-checkpoint") {
    const initialPreflight = preflightMission(options.root, options.globalSource, options.missionPath, cursor);
    if (initialPreflight.status !== "eligible") return finishReport(operation, definition, cursor, 0, processEvidence, "blocked");
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
  const attributedArchivePaths: string[] = [];
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
    const checkpoint = checkpointIdentity(options, definition, cursor, archivePath, processEvidence, options.checkpointIdentity);
    if (checkpoint == null) {
      if (current.lastTransitionKind !== "pause") {
        recordTransition(descriptor(
          definition,
          cursor,
          "pause",
          "awaiting-checkpoint",
          identities,
          current.evidenceRefs,
          { recovery: current.recovery },
        ));
      }
      return finishReport(operation, definition, cursor, 0, processEvidence, "paused");
    }
    recordTransition(descriptor(
      definition,
      cursor,
      "checkpoint",
      "ready",
      identities,
      current.evidenceRefs,
      { checkpointIdentity: checkpoint, recovery: current.recovery },
    ));
    if (cursor + 1 >= definition.slices.length) {
      recordTransition(descriptor(
        definition,
        cursor,
        "terminal-stop",
        "complete",
        identities,
        current.evidenceRefs,
        { checkpointIdentity: checkpoint, recovery: current.recovery },
      ));
      return finishReport(operation, definition, cursor, 0, processEvidence, "complete");
    }
    cursor++;
    const nextPreflight = preflightMission(options.root, options.globalSource, options.missionPath, cursor, {
      attributedPaths: [archivePath],
      writerLeaseOwned: true,
    });
    if (nextPreflight.status !== "eligible") {
      recordTransition(descriptor(
        definition,
        cursor - 1,
        "terminal-stop",
        "blocked",
        identities,
        current.evidenceRefs,
        { checkpointIdentity: checkpoint, recovery: current.recovery },
      ));
      return finishReport(operation, definition, cursor, 0, processEvidence, "blocked");
    }
    recordTransition(descriptor(
      definition,
      cursor,
      "successor-activation",
      "ready",
      identities,
      current.evidenceRefs,
      { checkpointIdentity: checkpoint },
    ));
  }

  while (cursor < definition.slices.length) {
    const slice = definition.slices[cursor];
    if (current == null && cursor === 0) {
      const preflight = preflightMission(options.root, options.globalSource, options.missionPath, cursor, {
        writerLeaseOwned: true,
      });
      if (preflight.status !== "eligible") return finishReport(operation, definition, cursor, 0, processEvidence, "blocked");
      recordTransition(descriptor(
        definition,
        cursor,
        "preflight",
        "ready",
        identities,
        [definition.evidencePath],
      ));
      if (missionStopRequested(options.root, definition, signalRequested())) return finishStop(0);
    }

    if (slice.operation === "continue") {
      const applyGate = operationGate(options.root, options.globalSource, "apply", slice.changeId);
      processEvidence.push(applyGate);
      requireSuccess(applyGate, "Apply operation gate");
      const applyGateOutput = parseJson(applyGate.stdout, "Apply operation gate");
      if (applyGateOutput.status !== "passed" && applyGateOutput.status !== "warning") {
        return finishReport(operation, definition, cursor, 0, processEvidence, "blocked");
      }
    }

    let attempts = current?.cursor === cursor ? current.recovery.attempts : 0;
    const persistedStartedAt = current?.cursor === cursor ? current.recovery.sliceStartedAt : null;
    const startedAt = persistedStartedAt == null ? Date.now() : Date.parse(persistedStartedAt);
    const sliceStartedAt = persistedStartedAt ?? new Date(startedAt).toISOString();
    if (attempts >= adapter.maxAttemptsPerSlice || Date.now() - startedAt >= adapter.maxWallClockMsPerSlice) {
      return finishReport(operation, definition, cursor, attempts, processEvidence, "paused");
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
      recordTransition(descriptor(
        definition,
        cursor,
        "session-launch",
        "running",
        identities,
        [definition.evidencePath],
        { activeOperation: { kind: "session", processRef: `attempt-${attempts}`, sessionRef: null }, recovery },
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
          { recovery },
        ));
        return finishStop(attempts);
      }
      let executorResult: MissionExecutorResult;
      try {
        executorResult = readExecutorResult(options.root, definition, slice, attempts, executorResultPath);
        executor.executorDisposition = executorResult.disposition;
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
            recovery,
          },
        ));
        return finishReport(operation, definition, cursor, attempts, processEvidence, "paused-unknown");
      }
      const executorEvidenceRefs = [...new Set([definition.evidencePath, executorResultPath, ...executorResult.evidenceRefs])].sort();
      const writerUnknown = executorResult.writerClosure === "unknown" || executorResult.cleanup === "unknown";
      recordTransition(descriptor(
        definition,
        cursor,
        "session-completion",
        writerUnknown
          ? "paused-unknown"
          : executorResult.disposition === "completed"
          ? "ready"
          : executorResult.disposition === "terminal"
          ? "blocked"
          : "paused",
        identities,
        executorEvidenceRefs,
        {
          ...(writerUnknown ? { activeOperation: { kind: "session" as const, processRef: `attempt-${attempts}`, sessionRef: null } } : {}),
          recovery,
        },
      ));
      if (writerUnknown) return finishReport(operation, definition, cursor, attempts, processEvidence, "paused-unknown");
      if (executorResult.disposition === "transient") continue;
      if (executorResult.disposition === "owner-required" || executorResult.disposition === "paused") {
        recordTransition(descriptor(
          definition,
          cursor,
          "pause",
          "paused",
          identities,
          executorEvidenceRefs,
          { recovery },
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
          { recovery },
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
        { activeOperation: { kind: "archive", processRef: `archive-${slice.id}`, sessionRef: null }, recovery },
      ));
      const archive = runArchive(options.root, options.globalSource, definition, slice);
      processEvidence.push(archive);
      requireSuccess(archive, "OpenSpec complete archive");
      const archiveOutput = parseJson(archive.stdout, "OpenSpec complete archive");
      if (archiveOutput.status !== "archived" || archiveOutput.change !== slice.changeId) {
        throw new RoadmapMissionError("OpenSpec archive returned no matching archived result", 1);
      }
      const archivePath = archiveRelativePath(options.root, archiveOutput.path);
      const readback = openSpecList(options.root);
      processEvidence.push(readback.evidence);
      if (readback.names.includes(slice.changeId)) throw new RoadmapMissionError("Archived change remains active after readback", 1);
      recordTransition(descriptor(
        definition,
        cursor,
        "archive",
        "awaiting-checkpoint",
        identities,
        [definition.evidencePath, archivePath],
        { recovery },
      ));
      attributedArchivePaths.push(archivePath);
      const checkpoint = checkpointIdentity(options, definition, cursor, archivePath, processEvidence);
      if (checkpoint == null) {
        recordTransition(descriptor(
          definition,
          cursor,
          "pause",
          "awaiting-checkpoint",
          identities,
          [definition.evidencePath, archivePath],
          { recovery },
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

      if (cursor + 1 >= definition.slices.length) {
        recordTransition(descriptor(
          definition,
          cursor,
          "terminal-stop",
          "complete",
          identities,
          [definition.evidencePath, archivePath],
          { checkpointIdentity: checkpoint, recovery },
        ));
        return finishReport(operation, definition, cursor, attempts, processEvidence, "complete");
      }

      cursor++;
      const nextPreflight = preflightMission(options.root, options.globalSource, options.missionPath, cursor, {
        attributedPaths: attributedArchivePaths,
        writerLeaseOwned: true,
      });
      if (nextPreflight.status !== "eligible") {
        recordTransition(descriptor(
          definition,
          cursor - 1,
          "terminal-stop",
          "blocked",
          identities,
          [definition.evidencePath],
          { checkpointIdentity: checkpoint, recovery },
        ));
        return finishReport(operation, definition, cursor, attempts, processEvidence, "blocked");
      }
      recordTransition(descriptor(
        definition,
        cursor,
        "successor-activation",
        "ready",
        identities,
        [definition.evidencePath],
        { checkpointIdentity: checkpoint },
      ));
      break;
    }
    if (attempts >= adapter.maxAttemptsPerSlice || Date.now() - startedAt >= adapter.maxWallClockMsPerSlice) {
      recordTransition(descriptor(
        definition,
        cursor,
        "pause",
        "paused",
        identities,
        [definition.evidencePath],
        { recovery: { attempts, sliceStartedAt } },
      ));
      return finishReport(operation, definition, cursor, attempts, processEvidence, "paused");
    }
  }
  return finishReport(operation, definition, cursor, 0, processEvidence, "blocked");
}

async function executeWithSignals(options: RunOptions, operation: "run" | "resume"): Promise<MissionControllerReport> {
  let signalRequested = false;
  const onSignal = (): void => {
    signalRequested = true;
  };
  process.on("SIGINT", onSignal);
  process.on("SIGTERM", onSignal);
  try {
    return await execute(options, operation, () => signalRequested);
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
