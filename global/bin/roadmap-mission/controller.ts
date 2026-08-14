import fs from "node:fs";
import path from "node:path";
import { runPortableCommand } from "../portable-process.ts";
import {
  loadMissionDefinition,
  missionDefinitionDigest,
  RoadmapMissionError,
} from "./contracts.ts";
import type {
  RoadmapMissionDefinition,
  RoadmapMissionSlice,
} from "./contracts.ts";
import { preflightMission } from "./preflight.ts";
import {
  readMissionStateProjection,
  recordMissionTransitionWithLease,
  replayMissionState,
  withMissionWriterLease,
} from "./state.ts";
import type {
  MissionDisposition,
  MissionIdentity,
  MissionTransitionDescriptor,
  MissionTransitionKind,
  WriterLease,
} from "./state.ts";

type ControllerAdapter = {
  executorArgv: string[];
  maxAttemptsPerSlice: number;
  maxWallClockMsPerSlice: number;
  schemaVersion: 1;
};

type ProcessEvidence = {
  argv: string[];
  exitCode: number | null;
  signal: string | null;
  stderr: string;
  stdout: string;
};

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
  status: "blocked" | "complete" | "paused";
  tool: "roadmap-mission";
};

function record(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function safeRelative(root: string, value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "" || /[\r\n\0]/.test(value)) {
    throw new RoadmapMissionError(`${field} must be a non-empty single-line project-relative path`, 2);
  }
  const normalized = value.trim().replaceAll("\\", "/").replace(/^\.\//, "");
  if (path.isAbsolute(normalized) || normalized.split("/").some((part) => part === "" || part === "." || part === "..")) {
    throw new RoadmapMissionError(`${field} must be a contained project-relative path`, 2);
  }
  const resolved = path.resolve(root, normalized);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new RoadmapMissionError(`${field} escaped the project root`, 2);
  return normalized;
}

function archiveRelativePath(root: string, value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new RoadmapMissionError("OpenSpec archive returned no path", 1);
  }
  const absolute = path.isAbsolute(value) ? path.resolve(value) : path.resolve(root, value);
  const relative = safeRelative(root, path.relative(root, absolute).replaceAll("\\", "/"), "archive path");
  if (!relative.startsWith("openspec/changes/archive/")) {
    throw new RoadmapMissionError("OpenSpec archive path is outside the project archive root", 1);
  }
  return relative;
}

function requiredArgv(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 100) {
    throw new RoadmapMissionError(`${field} must contain between 1 and 100 argv items`, 2);
  }
  return value.map((item, index) => {
    if (typeof item !== "string" || item.trim() === "" || /[\r\n\0]/.test(item)) {
      throw new RoadmapMissionError(`${field}[${index}] must be a non-empty single-line argv item`, 2);
    }
    return item;
  });
}

function integer(value: unknown, field: string, min: number, max: number): number {
  if (!Number.isSafeInteger(value) || (value as number) < min || (value as number) > max) {
    throw new RoadmapMissionError(`${field} must be an integer between ${min} and ${max}`, 2);
  }
  return value as number;
}

function loadControllerAdapter(root: string, relative: string): ControllerAdapter {
  const normalized = safeRelative(root, relative, "controller adapter");
  const file = path.resolve(root, normalized);
  let parsed: unknown;
  try {
    const stat = fs.lstatSync(file);
    if (stat.isSymbolicLink() || !stat.isFile()) throw new Error("not a regular file");
    parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new RoadmapMissionError("controller adapter must be a readable regular JSON file", 2, { cause: error });
  }
  const input = record(parsed);
  if (input == null) throw new RoadmapMissionError("controller adapter must be an object", 2);
  const expected = ["schemaVersion", "executorArgv", "maxAttemptsPerSlice", "maxWallClockMsPerSlice"];
  const missing = expected.filter((field) => !(field in input));
  const extras = Object.keys(input).filter((field) => !expected.includes(field));
  if (missing.length > 0 || extras.length > 0) throw new RoadmapMissionError("controller adapter fields are invalid", 2);
  if (input.schemaVersion !== 1) throw new RoadmapMissionError("controller adapter schemaVersion must be 1", 2);
  return {
    executorArgv: requiredArgv(input.executorArgv, "controller adapter executorArgv"),
    maxAttemptsPerSlice: integer(input.maxAttemptsPerSlice, "maxAttemptsPerSlice", 1, 20),
    maxWallClockMsPerSlice: integer(input.maxWallClockMsPerSlice, "maxWallClockMsPerSlice", 1_000, 86_400_000),
    schemaVersion: 1,
  };
}

function expandArgv(argv: string[], slice: RoadmapMissionSlice): string[] {
  return argv.map((value) => value
    .replaceAll("{changeId}", slice.changeId)
    .replaceAll("{operation}", slice.operation)
    .replaceAll("{sliceId}", slice.id));
}

function bounded(value: string, max = 20_000): string {
  return value.length <= max ? value : `${value.slice(0, max)}\n<truncated>`;
}

function redacted(value: string, roots: string[]): string {
  return roots.reduce((text, root, index) => text
    .replaceAll(root, index === 0 ? "<project-root>" : "<global-source>")
    .replaceAll(root.replaceAll("\\", "/"), index === 0 ? "<project-root>" : "<global-source>"), value);
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

function execute(options: RunOptions, operation: "run" | "resume"): MissionControllerReport {
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

  return withMissionWriterLease(options.root, definition, new Date().toISOString(), (writerLease) =>
    executeOwned(options, operation, definition, adapter, processEvidence, identities, current, cursor, writerLease)
  );
}

function executeOwned(
  options: RunOptions,
  operation: "run" | "resume",
  definition: RoadmapMissionDefinition,
  adapter: ControllerAdapter,
  processEvidence: ProcessEvidence[],
  identities: MissionIdentity,
  current: ReturnType<typeof readMissionStateProjection>,
  initialCursor: number,
  writerLease: WriterLease,
): MissionControllerReport {
  let cursor = initialCursor;
  const attributedArchivePaths: string[] = [];
  const recordTransition = (value: MissionTransitionDescriptor): void => {
    recordMissionTransitionWithLease(options.root, definition, value, writerLease);
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
      attempts++;
      const recovery = { attempts, sliceStartedAt };
      const argv = expandArgv(adapter.executorArgv, slice);
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
      const executor = invoke(options.root, argv, Math.max(1, remainingMs));
      processEvidence.push(executor);
      recordTransition(descriptor(
        definition,
        cursor,
        "session-completion",
        executor.exitCode === 0 ? "ready" : "paused",
        identities,
        [definition.evidencePath],
        { recovery },
      ));
      if (executor.exitCode !== 0) continue;

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

export function runMissionController(options: RunOptions): MissionControllerReport {
  return execute(options, "run");
}

export function resumeMissionController(options: RunOptions): MissionControllerReport {
  return execute(options, "resume");
}
