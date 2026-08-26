import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runPortableCommand } from "../portable-process.ts";
import { ROADMAP_COMMAND_TIMEOUT_MS } from "./controller-adapter.ts";
import {
  loadMissionDefinition,
  missionDefinitionDigest,
  PROTECTED_EFFECTS,
  RoadmapMissionError,
} from "./contracts.ts";
import type {
  MissionCheck,
  RoadmapMissionDefinition,
  RoadmapMissionPreflight,
  RoadmapMissionSlice,
} from "./contracts.ts";

const CANONICAL_SKILLS = [
  "openspec-apply-change",
  "openspec-archive-change",
  "openspec-propose",
] as const;

const CANONICAL_COMMANDS = [
  "opsx-apply",
  "opsx-archive",
  "opsx-propose",
] as const;

const VALIDATION_PURPOSES = ["focusedTest", "test", "typecheck", "lint", "build"] as const;

export const MISSION_SOURCE_PATHS = [
  "bin/roadmap-mission.ts",
  "bin/roadmap-mission-session-executor.ts",
  "bin/roadmap-mission/contracts.ts",
  "bin/roadmap-mission/controller.ts",
  "bin/roadmap-mission/preflight.ts",
  "bin/roadmap-mission/session-executor.ts",
  "bin/roadmap-mission/state.ts",
  "bin/portable-process-supervisor.ts",
  "extensions/session-completion-guard/terminal-certificate.ts",
] as const;

function passed(id: string, summary: string): MissionCheck {
  return { blocking: false, id, status: "passed", summary };
}

function blocked(id: string, summary: string, status: "blocked" | "unknown" = "blocked"): MissionCheck {
  return { blocking: true, id, status, summary };
}

function record(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function fileDigest(file: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function pathExistsAsFile(file: string): boolean {
  try {
    return fs.lstatSync(file).isFile() && !fs.lstatSync(file).isSymbolicLink();
  } catch {
    return false;
  }
}

function pathExistsAsDirectory(directory: string): boolean {
  try {
    return fs.lstatSync(directory).isDirectory() && !fs.lstatSync(directory).isSymbolicLink();
  } catch {
    return false;
  }
}

function samePath(left: string, right: string): boolean {
  const leftResolved = path.resolve(left);
  const rightResolved = path.resolve(right);
  return process.platform === "win32"
    ? leftResolved.toLocaleLowerCase() === rightResolved.toLocaleLowerCase()
    : leftResolved === rightResolved;
}

function relativeOutput(root: string, target: string): string {
  const relative = path.relative(root, target).replaceAll("\\", "/");
  return relative === "" ? "." : relative;
}

function artifactBody(file: string): string {
  const source = fs.readFileSync(file, "utf8").replaceAll("\r\n", "\n");
  if (!source.startsWith("---\n")) return source.trim();
  const end = source.indexOf("\n---\n", 4);
  if (end === -1) throw new RoadmapMissionError(`Canonical artifact has invalid frontmatter: ${path.basename(file)}`, 2);
  return source.slice(end + 5).trim();
}

function normalizedArtifactText(value: string): string {
  return value.replaceAll("\r\n", "\n").trim();
}

function runCaptured(
  root: string,
  argv: string[],
  timeoutMs: number,
  environment?: NodeJS.ProcessEnv,
): { stdout: string; error: string | null } {
  const result = runPortableCommand(root, argv, {
    capture: true,
    timeoutMs,
    ...(environment == null ? {} : { env: environment }),
  });
  if (result.error != null) return { error: result.error.message, stdout: "" };
  if (result.status !== 0) return { error: `${argv[0]} exited ${String(result.status)}`, stdout: "" };
  if (result.stdout.length > 5_000_000) return { error: `${argv[0]} output exceeded 5000000 bytes`, stdout: "" };
  return { error: null, stdout: result.stdout };
}

function parseJsonOutput(value: string, label: string): unknown {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new RoadmapMissionError(`${label} returned invalid JSON`, 1, { cause: error });
  }
}

function commandExists(root: string, executable: string): boolean {
  if (executable.includes("/") || executable.includes("\\")) {
    const resolved = path.isAbsolute(executable) ? executable : path.resolve(root, executable);
    return pathExistsAsFile(resolved);
  }
  const extensions = process.platform === "win32"
    ? (process.env.PATHEXT ?? ".COM;.EXE;.BAT;.CMD").split(";").filter(Boolean)
    : [""];
  const candidates = process.platform === "win32" && path.extname(executable) !== ""
    ? [executable]
    : extensions.map((extension) => `${executable}${extension.toLocaleLowerCase()}`)
      .concat(extensions.map((extension) => `${executable}${extension.toLocaleUpperCase()}`));
  return (process.env.PATH ?? "").split(path.delimiter).filter(Boolean).some((directory) =>
    candidates.some((candidate) => pathExistsAsFile(path.join(directory, candidate)))
  );
}

function resolvedValidationValue(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const normalized = value.trim();
  if (normalized === "") return false;
  if (/^(?:unknown|tbd|todo|replace(?:-me| after discovery)?)$/i.test(normalized)) return false;
  if (/^n\/?a$/i.test(normalized)) return false;
  return !/^n\/?a\s*-\s*(?:unknown|tbd|todo|replace-me)?\s*$/i.test(normalized);
}

function projectAuthorityCheck(root: string): MissionCheck {
  const file = path.join(root, "AGENTS.md");
  if (!pathExistsAsFile(file)) return blocked("project:runtime-authority", "Project AGENTS.md is missing.");
  const text = fs.readFileSync(file, "utf8");
  return ["Runtime Authority", "Universal Development Loop", "change-ready-sdlc"].some((marker) => text.includes(marker))
    ? passed("project:runtime-authority", "Project runtime authority marker is present.")
    : blocked("project:runtime-authority", "Project AGENTS.md has no runtime authority marker.");
}

function projectAdapterCheck(root: string, validationArgv: string[]): MissionCheck {
  const file = path.join(root, "opencode-dev-kit", "adapter.json");
  if (!pathExistsAsFile(file)) return blocked("project:validation-adapter", "Project validation adapter is missing.");
  try {
    const input = record(JSON.parse(fs.readFileSync(file, "utf8")));
    const validation = record(input?.validation);
    const unresolved = VALIDATION_PURPOSES.filter((purpose) => !resolvedValidationValue(validation?.[purpose]));
    if (unresolved.length > 0) {
      return blocked("project:validation-adapter", `Project validation adapter has unresolved purposes: ${unresolved.join(", ")}.`);
    }
  } catch {
    return blocked("project:validation-adapter", "Project validation adapter is malformed.");
  }
  if (!commandExists(root, validationArgv[0])) {
    return blocked("project:validation-adapter", `Validation executable is unavailable: ${validationArgv[0]}.`);
  }
  return passed("project:validation-adapter", "Project validation adapter and aggregate validation executable are resolved.");
}

function canonicalWorkflowPaths(globalSource: string): string[] {
  return [
    ...CANONICAL_SKILLS.map((name) => path.join(globalSource, "skills", name, "SKILL.md")),
    ...CANONICAL_COMMANDS.map((name) => path.join(globalSource, "commands", `${name}.md`)),
    path.join(globalSource, "AGENTS.md"),
    path.join(globalSource, "skills", "change-ready-sdlc", "SKILL.md"),
    path.join(globalSource, "bin", "openspec-operation-gate.ts"),
    ...MISSION_SOURCE_PATHS.map((source) => path.join(globalSource, source)),
    path.join(globalSource, "bin", "openspec-archive.ts"),
    path.join(globalSource, "bin", "portable-process.ts"),
  ];
}

function canonicalWorkflowCheck(globalSource: string): MissionCheck {
  if (!pathExistsAsDirectory(globalSource)) return blocked("workflow:canonical-source", "Global source is missing or not a real directory.");
  const missing = canonicalWorkflowPaths(globalSource).filter((file) => !pathExistsAsFile(file));
  if (missing.length > 0) {
    return blocked(
      "workflow:canonical-source",
      `Canonical global workflow is incomplete: ${missing.map((file) => relativeOutput(globalSource, file)).join(", ")}.`,
    );
  }
  const runningGlobal = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  for (const [index, source] of MISSION_SOURCE_PATHS.entries()) {
    const runningSource = path.join(runningGlobal, source);
    const canonicalSource = path.join(globalSource, source);
    if (fileDigest(runningSource) !== fileDigest(canonicalSource)) {
      const summary = index === 0
        ? "Running mission entrypoint does not match the selected global source."
        : "Running mission implementation does not match the selected global source.";
      return blocked("workflow:canonical-source", summary);
    }
  }
  return passed("workflow:canonical-source", "Canonical global workflow files and running mission entrypoint match.");
}

function projectOverlayCheck(root: string): MissionCheck {
  const collisions = [
    ...["skill", "skills"].flatMap((directory) =>
      CANONICAL_SKILLS.map((name) => path.join(root, ".opencode", directory, name, "SKILL.md"))
    ),
    ...["command", "commands"].flatMap((directory) =>
      CANONICAL_COMMANDS.map((name) => path.join(root, ".opencode", directory, `${name}.md`))
    ),
  ].filter(pathExistsAsFile);
  return collisions.length === 0
    ? passed("workflow:project-overlays", "Project has no same-name standard OpenSpec workflow overlays.")
    : blocked(
        "workflow:project-overlays",
        `Project shadows canonical workflow: ${collisions.map((file) => relativeOutput(root, file)).sort().join(", ")}.`,
      );
}

function inspectLoadedWorkflow(root: string, globalSource: string): MissionCheck {
  const environment = { ...process.env, OPENCODE_CONFIG_DIR: globalSource };
  const skillResult = runCaptured(root, ["opencode", "debug", "skill", "--pure"], ROADMAP_COMMAND_TIMEOUT_MS.inspection, environment);
  if (skillResult.error != null) return blocked("workflow:loaded-identity", `OpenCode skill inspection failed: ${skillResult.error}.`, "unknown");
  const configResult = runCaptured(root, ["opencode", "debug", "config", "--pure"], ROADMAP_COMMAND_TIMEOUT_MS.inspection, environment);
  if (configResult.error != null) return blocked("workflow:loaded-identity", `OpenCode config inspection failed: ${configResult.error}.`, "unknown");
  try {
    const skills = parseJsonOutput(skillResult.stdout, "OpenCode skill inspection");
    if (!Array.isArray(skills)) throw new RoadmapMissionError("OpenCode skill inspection did not return an array");
    const skillRows = skills.map(record).filter((value): value is Record<string, unknown> => value != null);
    for (const name of CANONICAL_SKILLS) {
      const expected = path.join(globalSource, "skills", name, "SKILL.md");
      const selected = skillRows.find((row) => row.name === name);
      if (selected == null || typeof selected.location !== "string" || !samePath(selected.location, expected)) {
        return blocked("workflow:loaded-identity", `Loaded skill ${name} does not resolve to the canonical global source.`);
      }
      if (
        typeof selected.content !== "string" ||
        !normalizedArtifactText(selected.content).startsWith(artifactBody(expected))
      ) {
        return blocked("workflow:loaded-identity", `Loaded skill ${name} content differs from the canonical global source.`);
      }
    }
    const config = record(parseJsonOutput(configResult.stdout, "OpenCode config inspection"));
    const commands = record(config?.command);
    for (const name of CANONICAL_COMMANDS) {
      const selected = record(commands?.[name]);
      const expected = path.join(globalSource, "commands", `${name}.md`);
      if (
        typeof selected?.template !== "string" ||
        normalizedArtifactText(selected.template) !== artifactBody(expected)
      ) {
        return blocked("workflow:loaded-identity", `Loaded command ${name} differs from the canonical global source.`);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return blocked("workflow:loaded-identity", `OpenCode workflow identity is unreadable: ${message}.`, "unknown");
  }
  return passed("workflow:loaded-identity", "Loaded standard OpenSpec skills and commands match the canonical global source.");
}

export function loadedWorkflowCheck(root: string, globalSource: string): MissionCheck {
  const marker = path.join(root, ".git", "opencode");
  const existed = fs.existsSync(marker);
  let originalDigest: string | null = null;
  if (existed) {
    if (!pathExistsAsFile(marker)) {
      return blocked("workflow:loaded-identity", "Existing OpenCode Git marker is not a regular file.", "unknown");
    }
    originalDigest = fileDigest(marker);
  }

  let result: MissionCheck;
  try {
    result = inspectLoadedWorkflow(root, globalSource);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    result = blocked("workflow:loaded-identity", `OpenCode workflow inspection failed: ${message}.`, "unknown");
  }

  if (existed) {
    if (!pathExistsAsFile(marker) || fileDigest(marker) !== originalDigest) {
      return blocked("workflow:loaded-identity", "OpenCode workflow inspection changed a pre-existing Git marker.", "unknown");
    }
    return result;
  }
  if (!fs.existsSync(marker)) return result;
  if (!pathExistsAsFile(marker)) {
    return blocked("workflow:loaded-identity", "OpenCode workflow inspection created an unsafe Git marker.", "unknown");
  }
  try {
    fs.unlinkSync(marker);
  } catch {
    return blocked("workflow:loaded-identity", "OpenCode workflow inspection marker cleanup failed.", "unknown");
  }
  return result;
}

function overlapsOwnedPath(file: string, ownedPaths: string[]): boolean {
  return ownedPaths.some((owned) =>
    file === owned || file.startsWith(`${owned}/`) || owned.startsWith(`${file}/`)
  );
}

function gitCheck(root: string, blockingPaths: string[], attributedPaths: string[]): MissionCheck {
  const top = runCaptured(root, ["git", "rev-parse", "--show-toplevel"], ROADMAP_COMMAND_TIMEOUT_MS.inspection);
  if (top.error != null) return blocked("project:git-state", `Git root inspection failed: ${top.error}.`, "unknown");
  if (!samePath(top.stdout.trim(), root)) return blocked("project:git-state", "--root is not the exact Git worktree root.");
  const commands = [
    ["git", "diff", "--name-only", "-z"],
    ["git", "diff", "--cached", "--name-only", "-z"],
    ["git", "ls-files", "--others", "--exclude-standard", "-z"],
  ];
  const dirty = new Set<string>();
  for (const argv of commands) {
    const result = runCaptured(root, argv, ROADMAP_COMMAND_TIMEOUT_MS.inspection);
    if (result.error != null) return blocked("project:git-state", `Git state inspection failed: ${result.error}.`, "unknown");
    for (const file of result.stdout.split("\0").filter(Boolean)) dirty.add(file.replaceAll("\\", "/"));
  }
  if (dirty.size === 0) return passed("project:git-state", "Git worktree and index are clean.");
  const overlaps = [...dirty].filter((file) => overlapsOwnedPath(file, blockingPaths));
  const attributed = [...dirty].filter((file) => !overlaps.includes(file) && overlapsOwnedPath(file, attributedPaths));
  const unattributed = [...dirty].filter((file) => !overlaps.includes(file) && !attributed.includes(file));
  if (overlaps.length === 0 && unattributed.length === 0) {
    return passed("project:git-state", `Dirty paths are fully attributed to prior mission state: ${attributed.sort().join(", ")}.`);
  }
  const detail = [
    overlaps.length > 0 ? `next-slice-overlap=${overlaps.sort().join(", ")}` : null,
    unattributed.length > 0 ? `unattributed=${unattributed.sort().join(", ")}` : null,
  ].filter((value): value is string => value != null).join("; ");
  return blocked("project:git-state", `Uncheckpointed dirty paths block mission start: ${detail}.`);
}

function openSpecCheck(
  root: string,
  definition: RoadmapMissionDefinition,
  cursor: number,
): MissionCheck {
  const slice = definition.slices[cursor];
  const version = runCaptured(root, ["openspec", "--version"], ROADMAP_COMMAND_TIMEOUT_MS.openSpec);
  if (version.error != null) return blocked("project:openspec-state", `OpenSpec version inspection failed: ${version.error}.`, "unknown");
  const match = version.stdout.trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  if (match == null || Number(match[1]) !== 1 || Number(match[2]) < 6) {
    return blocked("project:openspec-state", `OpenSpec version is unsupported: ${version.stdout.trim() || "unknown"}.`);
  }
  const listed = runCaptured(root, ["openspec", "list", "--json"], ROADMAP_COMMAND_TIMEOUT_MS.openSpec);
  if (listed.error != null) return blocked("project:openspec-state", `OpenSpec list failed: ${listed.error}.`, "unknown");
  try {
    const output = record(parseJsonOutput(listed.stdout, "OpenSpec list"));
    const changes = Array.isArray(output?.changes) ? output.changes.map(record).filter((value): value is Record<string, unknown> => value != null) : [];
    const names = changes.map((change) => change.name).filter((name): name is string => typeof name === "string").sort();
    const expected = definition.slices.slice(cursor)
      .filter((remaining) => remaining.operation === "continue")
      .map((remaining) => remaining.changeId)
      .sort();
    if (names.length !== expected.length || names.some((name, index) => name !== expected[index])) {
      return blocked(
        "project:openspec-state",
        `Active changes must exactly match remaining continue slices: expected ${expected.join(", ") || "none"}; found ${names.join(", ") || "none"}.`,
      );
    }
    for (const changeId of expected) {
      const status = runCaptured(root, ["openspec", "status", "--change", changeId, "--json"], ROADMAP_COMMAND_TIMEOUT_MS.openSpec);
      if (status.error != null) return blocked("project:openspec-state", `OpenSpec status failed for ${changeId}: ${status.error}.`, "unknown");
      const statusOutput = record(parseJsonOutput(status.stdout, `OpenSpec status for ${changeId}`));
      if (statusOutput?.isComplete !== true) return blocked("project:openspec-state", `Active change ${changeId} is not apply-ready.`);
    }
    const nextSummary = slice.operation === "propose"
      ? `proposed change ${slice.changeId}`
      : `continued change ${slice.changeId}`;
    return passed(
      "project:openspec-state",
      `OpenSpec ${match[0]} is ready for ${nextSummary}; exact queued active set is ${expected.join(", ") || "empty"}.`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return blocked("project:openspec-state", `OpenSpec state is unreadable: ${message}.`, "unknown");
  }
}

function writerLeaseCheck(root: string, missionId: string, owned: boolean): MissionCheck {
  if (owned) return passed("mission:writer-lease", "The current controller owns the mission writer lease.");
  const lock = path.join(root, ".opencode-dev-kit", "runtime", "roadmap-missions", missionId, "writer.lock");
  return fs.existsSync(lock)
    ? blocked("mission:writer-lease", "A mission writer lease already exists; liveness is unknown.", "unknown")
    : passed("mission:writer-lease", "No prior mission writer lease exists.");
}

function nextEffectCheck(definition: RoadmapMissionDefinition, cursor: number): MissionCheck {
  const slice = definition.slices[cursor];
  const ownerControlled = slice.effectClasses.filter((effect) =>
    PROTECTED_EFFECTS.has(effect) && effect !== "provider-inference" && effect !== "local-commit"
  );
  return ownerControlled.length === 0
    ? passed("mission:next-effects", "Next slice requires no unsupported owner-controlled effect.")
    : blocked("mission:next-effects", `Next slice stops before owner-controlled effects: ${ownerControlled.join(", ")}.`);
}

export function preflightMissionDefinition(root: string, missionPath: string): RoadmapMissionPreflight {
  const definition = loadMissionDefinition(root, missionPath);
  const checks = [
    passed("definition:schema", "Mission schema and explicit fields are valid."),
    passed("definition:serial-order", `Mission has ${definition.slices.length} explicitly ordered slice(s).`),
    passed("definition:effects", "Every slice effect is explicitly allowed and protected effects carry an authority reference."),
    passed("definition:checkpoint", `Checkpoint policy ${definition.checkpoint.mode} is valid for this mission envelope.`),
    passed("definition:contained", "Mission, roadmap, and evidence paths are project-contained."),
  ].sort((left, right) => left.id.localeCompare(right.id));
  const first = definition.slices[0];
  return {
    checks,
    definitionDigest: missionDefinitionDigest(definition),
    eligibleSlice: { changeId: first.changeId, id: first.id, operation: first.operation },
    exitCode: 0,
    missionId: definition.missionId,
    operation: "preflight",
    schemaVersion: 1,
    status: "eligible",
    tool: "roadmap-mission",
  };
}

export function preflightMission(
  root: string,
  globalSource: string,
  missionPath: string,
  cursor = 0,
  options: { allowCurrentSliceDirty?: boolean; attributedPaths?: string[]; writerLeaseOwned?: boolean } = {},
): RoadmapMissionPreflight {
  const definition = loadMissionDefinition(root, missionPath);
  const slice = definition.slices[cursor];
  if (slice == null) throw new RoadmapMissionError(`Mission cursor ${cursor} is outside the definition`, 2);
  const checks = [
    passed("definition:schema", "Mission schema and explicit fields are valid."),
    passed("definition:serial-order", `Mission has ${definition.slices.length} explicitly ordered slice(s).`),
    passed("definition:effects", "Every slice effect is explicitly allowed and protected effects carry an authority reference."),
    passed("definition:checkpoint", `Checkpoint policy ${definition.checkpoint.mode} is valid for this mission envelope.`),
    passed("definition:contained", "Mission, roadmap, and evidence paths are project-contained."),
    projectAuthorityCheck(root),
    projectAdapterCheck(root, definition.validationArgv),
    canonicalWorkflowCheck(globalSource),
    projectOverlayCheck(root),
    gitCheck(root, options.allowCurrentSliceDirty === true ? [] : slice.ownedPaths, [
      ...(options.allowCurrentSliceDirty === true ? slice.ownedPaths : []),
      ...definition.slices.slice(0, cursor).flatMap((missionSlice) => missionSlice.ownedPaths),
      definition.evidencePath,
      `.opencode-dev-kit/runtime/roadmap-missions/${definition.missionId}`,
      ...(options.attributedPaths ?? []),
    ]),
    openSpecCheck(root, definition, cursor),
    writerLeaseCheck(root, definition.missionId, options.writerLeaseOwned === true),
    nextEffectCheck(definition, cursor),
  ];
  if (checks.every((check) => !check.blocking && check.status === "passed")) {
    checks.push(loadedWorkflowCheck(root, globalSource));
  } else {
    checks.push(blocked("workflow:loaded-identity", "Loaded workflow inspection was not run because deterministic prerequisites failed.", "unknown"));
  }
  checks.sort((left, right) => left.id.localeCompare(right.id));
  const eligible = checks.every((check) => !check.blocking && check.status === "passed");
  return {
    checks,
    definitionDigest: missionDefinitionDigest(definition),
    eligibleSlice: eligible ? { changeId: slice.changeId, id: slice.id, operation: slice.operation } : null,
    exitCode: eligible ? 0 : 1,
    missionId: definition.missionId,
    operation: "preflight",
    schemaVersion: 1,
    status: eligible ? "eligible" : "blocked",
    tool: "roadmap-mission",
  };
}
