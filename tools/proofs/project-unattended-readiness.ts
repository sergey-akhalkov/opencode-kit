#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runPortableCommand } from "../../global/bin/portable-process.ts";
import { materializeRuntimeSurfaceProfile, ROADMAP_MISSION_PLUGIN_FILES, ROADMAP_MISSION_RUNTIME_FILES } from "../runtime-surface-profile.ts";

type Options = {
  candidateId: string;
  evidenceRoot: string;
};

type CommandEvidence = {
  argv: string[];
  exitCode: number | null;
  stderr: string;
  stdout: string;
};

type InstalledMissionProfile = {
  configSha256: string;
  manifestSha256: string;
  model: unknown;
  missionSourceDigests: Record<string, string>;
  pluginPaths: string[];
  scriptRuntimeAvailable: boolean;
  unresolvedPlaceholderCount: number;
};

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const HELP = `Usage:
  node tools/proofs/project-unattended-readiness.ts --candidate-id <id> --evidence-root <new-absolute-path>

Options:
  --candidate-id <id>      Candidate identity recorded in evidence
  --evidence-root <path>   Create-new immutable evidence directory
  --help, -h               Show help without creating files or running commands`;

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value == null || typeof value !== "object") return value;
  const input = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(input).sort().map((key) => [key, stableValue(input[key])]));
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

function sha256(value: string | Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function requiredValue(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value == null || value.trim() === "" || value.startsWith("--")) throw new Error(`Missing value for ${option}`);
  return value;
}

function parseArgs(args: string[]): Options {
  let candidateId = "";
  let evidenceRoot = "";
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--candidate-id") {
      candidateId = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--evidence-root") {
      evidenceRoot = requiredValue(args, index, arg);
      index++;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(candidateId)) throw new Error("--candidate-id must be a safe identifier");
  if (!path.isAbsolute(evidenceRoot)) throw new Error("--evidence-root must be absolute");
  return { candidateId, evidenceRoot: path.resolve(evidenceRoot) };
}

function writeNew(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, { encoding: "utf8", flag: "wx" });
}

function invoke(root: string, entrypoint: string, args: string[], env: NodeJS.ProcessEnv = {}): CommandEvidence {
  const result = runPortableCommand(root, [process.execPath, path.join(sourceRoot, entrypoint), ...args], {
    capture: true,
    env: { ...process.env, OPENCODE_CONFIG_DIR: path.join(sourceRoot, "global"), ...env },
  });
  if (result.error != null) throw result.error;
  const redact = (value: string): string => value
    .replaceAll(root, "<fixture>")
    .replaceAll(root.replaceAll("\\", "/"), "<fixture>");
  return {
    argv: ["node", entrypoint, ...args.map((arg) => path.isAbsolute(arg) ? "<fixture>" : arg)],
    exitCode: result.status,
    stderr: redact(result.stderr),
    stdout: redact(result.stdout),
  };
}

function files(root: string): Array<{ path: string; sha256: string }> {
  const rows: Array<{ path: string; sha256: string }> = [];
  const visit = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) rows.push({
        path: path.relative(root, absolute).replaceAll("\\", "/"),
        sha256: sha256(fs.readFileSync(absolute)),
      });
    }
  };
  visit(root);
  return rows;
}

function configuredAdapter(): string {
  return stableJson({
    name: "project-adapter",
    quality: { broadValidationBeforeHandoff: true, focusedValidationFirst: true },
    schemaVersion: 1,
    unattended: {
      checkpointModes: ["evidence-only", "external", "local-commit"],
      localCommitRequiresAuthorization: true,
      validationArgv: ["git", "status", "--short"],
      workflowOwner: "global-canonical",
    },
    validation: {
      build: "N/A - fixture has no build artifact",
      focusedTest: "git status --short",
      lint: "N/A - fixture has no lint source",
      test: "git status --short",
      typecheck: "N/A - fixture contains no typed source",
    },
  });
}

function selectedDoctor(output: string): Record<string, unknown> {
  const report = JSON.parse(output) as {
    qualificationStatus: string;
    status: string;
    unattendedChecks: Array<{ detail: string; name: string; status: string }>;
    unattendedMissionStatus: string;
  };
  return {
    qualificationStatus: report.qualificationStatus,
    status: report.status,
    unattendedChecks: report.unattendedChecks.map((check) => ({ name: check.name, status: check.status })),
    unattendedMissionStatus: report.unattendedMissionStatus,
  };
}

function selectedSources(output: string): Record<string, unknown> {
  const report = JSON.parse(output) as {
    unattended: {
      canonicalWorkflow: Array<{ kind: string; name: string; source: string }>;
      collisionStatus: string;
      guard: { capabilityStatus: string; limits: Record<string, number | null>; origin: string | null };
      helperResolution: Array<{
        attempts: Array<{ exists: boolean; helper: string; source: string }>;
        collisionStatus: string;
        relativePath: string;
        selected: { helper: string; source: string } | null;
        status: string;
      }>;
      helpers: Array<{ path: string; sha256: string }>;
    };
  };
  const safeLocation = (location: string): string => {
    const normalized = location.replaceAll("\\", "/");
    const globalMarker = "/global/";
    const globalIndex = normalized.lastIndexOf(globalMarker);
    if (globalIndex >= 0) return `<global-source>/${normalized.slice(globalIndex + globalMarker.length)}`;
    const projectMarker = "/.opencode/";
    const projectIndex = normalized.lastIndexOf(projectMarker);
    if (projectIndex >= 0) return `<fixture>/.opencode/${normalized.slice(projectIndex + projectMarker.length)}`;
    return "<external-source>";
  };
  return {
    ...report.unattended,
    canonicalWorkflow: report.unattended.canonicalWorkflow.map((source) => ({
      ...source,
      location: safeLocation((source as { location: string }).location),
    })),
    guard: {
      ...report.unattended.guard,
      origin: report.unattended.guard.origin == null ? null : safeLocation(report.unattended.guard.origin),
    },
    helperResolution: report.unattended.helperResolution.map((resolution) => ({
      ...resolution,
      attempts: resolution.attempts.map((attempt) => ({ ...attempt, helper: safeLocation(attempt.helper) })),
      selected: resolution.selected == null
        ? null
        : { ...resolution.selected, helper: safeLocation(resolution.selected.helper) },
    })),
  };
}

function installedMissionProfile(profileRoot: string): InstalledMissionProfile {
  const configFile = path.join(profileRoot, "opencode.json");
  const config = JSON.parse(fs.readFileSync(configFile, "utf8")) as Record<string, unknown>;
  const plugins = Array.isArray(config.plugin) ? config.plugin : [];
  const pluginPaths = plugins.flatMap((entry) => {
    const source = typeof entry === "string" ? entry : Array.isArray(entry) && typeof entry[0] === "string" ? entry[0] : null;
    if (source == null || !source.startsWith("file:")) return [];
    const relative = path.relative(profileRoot, fileURLToPath(source)).replaceAll("\\", "/");
    return relative.startsWith("../") ? [] : [relative];
  });
  const launcher = plugins.find((entry) =>
    Array.isArray(entry) && typeof entry[0] === "string" && entry[0].endsWith("/extensions/roadmap-mission-launcher.ts")
  );
  const launcherOptions = Array.isArray(launcher) && typeof launcher[1] === "object" && launcher[1] != null
    ? launcher[1] as Record<string, unknown>
    : {};
  return {
    configSha256: sha256(fs.readFileSync(configFile)),
    manifestSha256: sha256(fs.readFileSync(path.join(profileRoot, ".runtime-surface.json"))),
    model: config.model,
    missionSourceDigests: Object.fromEntries(ROADMAP_MISSION_RUNTIME_FILES.map((relative) => [
      relative,
      sha256(fs.readFileSync(path.join(profileRoot, ...relative.split("/")))),
    ])),
    pluginPaths,
    scriptRuntimeAvailable: typeof launcherOptions.scriptRuntime === "string" && fs.existsSync(launcherOptions.scriptRuntime),
    unresolvedPlaceholderCount: JSON.stringify(config).split("__OPENCODE_").length - 1,
  };
}

function setupGateChange(project: string): void {
  writeNew(path.join(project, "openspec", "changes", "helper-proof", "proposal.md"), [
    "## Outcome Capsule",
    "",
    "- **Outcome:** Prove portable helper invocation.",
    "- **Operating Envelope:** Disposable local project.",
    "- **Non-Goals:** External effects.",
    "- **Non-Deferrable Invariants:** No target mutation.",
    "- **Observable Proof:** Operation gate returns passed.",
    "- **Material Residual Risks:** None.",
    "- **Stop Line:** Stop after local gate output.",
    "",
  ].join("\n"));
  writeNew(path.join(project, "openspec", "changes", "helper-proof", "tasks.md"), "- [ ] 1.1 Prove helper invocation.\n");
  writeNew(path.join(project, "openspec", "changes", "helper-proof", "history.md"), "# Strategy History\n");
  writeNew(path.join(project, "openspec", "changes", "helper-proof", "specs", "helper-proof", "spec.md"), [
    "## ADDED Requirements",
    "",
    "### Requirement: Disposable helper proof",
    "",
    "The local operation gate SHALL report its status.",
    "",
    "#### Scenario: Gate runs",
    "",
    "- **WHEN** the disposable change invokes the verified helper",
    "- **THEN** the gate reports `passed`.",
    "",
  ].join("\n"));
}

function missionDefinition(): string {
  return stableJson({
    allowedEffects: ["local-read", "local-write"],
    authorizationRefs: {},
    checkpoint: { localCommitAuthorized: false, mode: "evidence-only", workspace: "disposable" },
    evidencePath: "evidence/mission",
    missionId: "bootstrap-proof",
    roadmapPath: "docs/roadmap.md",
    schemaVersion: 1,
    slices: [{
      changeId: "change-a",
      dependsOn: [],
      effectClasses: ["local-read", "local-write"],
      id: "slice-a",
      operation: "propose",
      outcome: "Complete one bounded disposable local change.",
      ownedPaths: ["src/a.txt", "openspec/changes/change-a"],
    }],
    stopPolicy: { onExternalBlocked: true, onOwnerRequired: true, onUnknown: true },
    validationArgv: ["git", "status", "--short"],
    workflowOwner: { mode: "global-canonical" },
  });
}

function assertEvidence(
  freshPreview: CommandEvidence,
  freshWrite: CommandEvidence,
  freshDoctor: CommandEvidence,
  installedDoctor: CommandEvidence,
  legacyPreview: CommandEvidence,
  legacyWrite: CommandEvidence,
  legacyDoctor: CommandEvidence,
  freshSourceInventory: CommandEvidence,
  installedSourceInventory: CommandEvidence,
  missingSourceInventory: CommandEvidence,
  legacySourceInventory: CommandEvidence,
  operationGate: CommandEvidence,
  freshManifest: Array<{ path: string; sha256: string }>,
  installedProfile: InstalledMissionProfile,
  overlayHash: string,
  legacyOverlay: string,
  legacyOverlayRelative: string,
  legacyBackup: string,
  legacyAgentsHash: string,
): void {
  for (const command of [
    freshPreview,
    freshWrite,
    freshDoctor,
    installedDoctor,
    legacyPreview,
    legacyWrite,
    legacyDoctor,
    freshSourceInventory,
    installedSourceInventory,
    missingSourceInventory,
    legacySourceInventory,
    operationGate,
  ]) {
    if (command.exitCode !== 0) throw new Error(`Command failed: ${command.argv.join(" ")}\n${command.stderr || command.stdout}`);
  }
  const forbidden = freshManifest.filter((row) =>
    /^\.opencode\/(?:skills\/openspec-(?:apply-change|archive-change|propose)|commands\/opsx-(?:apply|archive|propose)\.md)/.test(row.path)
  );
  if (forbidden.length > 0) throw new Error(`Bootstrap created canonical workflow copies: ${forbidden.map((row) => row.path).join(", ")}`);
  if (!freshPreview.stdout.includes("Unattended workflow overlays: none")) throw new Error("Fresh preview omitted unattended overlay status");
  if (
    !legacyPreview.stdout.includes(legacyOverlayRelative) ||
    !legacyWrite.stdout.includes(legacyOverlayRelative) ||
    !legacyWrite.stdout.includes("backup: .backups/opencode-dev-kit/")
  ) {
    throw new Error("Legacy bootstrap did not report the exact preserved overlay");
  }
  if (sha256(fs.readFileSync(legacyOverlay)) !== overlayHash) throw new Error("Legacy overlay changed during bootstrap");
  if (!fs.existsSync(legacyBackup) || sha256(fs.readFileSync(legacyBackup)) !== legacyAgentsHash) {
    throw new Error("Explicit overwrite did not preserve the existing AGENTS.md bytes in a backup");
  }
  const fresh = selectedDoctor(freshDoctor.stdout);
  if (fresh.qualificationStatus !== "pass") {
    throw new Error(`Fresh project did not pass ordinary qualification: ${stableJson(fresh)}`);
  }
  const installed = selectedDoctor(installedDoctor.stdout);
  if (installed.qualificationStatus !== "pass" || installed.unattendedMissionStatus !== "pass") {
    throw new Error(`Installed all-profile doctor did not pass unattended readiness: ${stableJson(installed)}`);
  }
  for (const relative of ROADMAP_MISSION_PLUGIN_FILES) {
    if (installedProfile.pluginPaths.filter((entry) => entry === relative).length !== 1) {
      throw new Error(`Installed all profile did not load ${relative} exactly once`);
    }
  }
  if (
    installedProfile.model !== "openai/gpt-5.6-sol"
    || !installedProfile.scriptRuntimeAvailable
    || installedProfile.unresolvedPlaceholderCount !== 0
  ) {
    throw new Error("Installed all profile did not retain the pinned mission model, executable scriptRuntime, and materialized paths");
  }
  const legacy = selectedDoctor(legacyDoctor.stdout);
  const collision = (legacy.unattendedChecks as Array<{ name: string; status: string }>).find((check) =>
    check.name === "unattended canonical workflow"
  );
  if (collision?.status !== "blocked") throw new Error("Legacy doctor did not block the canonical workflow collision");
  const freshSources = selectedSources(freshSourceInventory.stdout);
  const freshGate = (freshSources.helperResolution as Array<{ relativePath: string; selected: unknown; status: string }>).find((row) =>
    row.relativePath === "bin/openspec-operation-gate.ts"
  );
  if (freshSources.collisionStatus !== "clear" || freshGate?.status !== "resolved" || freshGate.selected == null) {
    throw new Error("Configured-global helper resolution did not select the exact operation gate");
  }
  const installedSources = selectedSources(installedSourceInventory.stdout);
  const installedExecutor = (installedSources.helperResolution as Array<{ relativePath: string; selected: unknown; status: string }>).find((row) =>
    row.relativePath === "bin/roadmap-mission-session-executor.ts"
  );
  if (installedSources.collisionStatus !== "clear" || installedExecutor?.status !== "resolved" || installedExecutor.selected == null) {
    throw new Error("Installed all-profile source inventory did not resolve the mission session executor");
  }
  const missingSources = selectedSources(missingSourceInventory.stdout);
  const missingGate = (missingSources.helperResolution as Array<{ relativePath: string; selected: unknown; status: string }>).find((row) =>
    row.relativePath === "bin/openspec-operation-gate.ts"
  );
  if (missingGate?.status !== "missing" || missingGate.selected != null) {
    throw new Error("Missing configured-global helper did not retain an actionable missing result");
  }
  const legacySources = selectedSources(legacySourceInventory.stdout);
  const blockedGate = (legacySources.helperResolution as Array<{ relativePath: string; selected: unknown; status: string }>).find((row) =>
    row.relativePath === "bin/openspec-operation-gate.ts"
  );
  if (legacySources.collisionStatus !== "blocked" || blockedGate?.status !== "blocked" || blockedGate.selected != null) {
    throw new Error("Runtime source inventory did not block helper selection on canonical workflow collision");
  }
  const gateResult = JSON.parse(operationGate.stdout) as { status?: unknown };
  if (gateResult.status !== "passed") {
    throw new Error(`Configured-global operation gate did not pass from the unrelated project: ${operationGate.stdout}`);
  }
}

function run(options: Options): void {
  if (fs.existsSync(options.evidenceRoot)) throw new Error("Evidence root already exists");
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "project-unattended-proof-"));
  let cleanupError: string | null = null;
  try {
    const fresh = path.join(fixture, "fresh-non-js");
    const legacy = path.join(fixture, "legacy-non-js");
    const missingGlobal = path.join(fixture, "missing-global");
    const isolatedHome = path.join(fixture, "isolated-home");
    const installedGlobal = path.join(fixture, "installed-all");
    fs.mkdirSync(fresh);
    fs.mkdirSync(missingGlobal);
    fs.mkdirSync(isolatedHome);
    fs.mkdirSync(path.join(legacy, ".opencode", "skills", "openspec-apply-change"), { recursive: true });
    const legacyAgents = path.join(legacy, "AGENTS.md");
    writeNew(legacyAgents, "# Existing Project Authority\n");
    const legacyAgentsHash = sha256(fs.readFileSync(legacyAgents));
    const legacyOverlay = path.join(legacy, ".opencode", "skills", "openspec-apply-change", "SKILL.md");
    const legacyOverlayRelative = ".opencode/skills/openspec-apply-change/SKILL.md";
    writeNew(legacyOverlay, "# Preserved Legacy Overlay\n");
    const overlayHash = sha256(fs.readFileSync(legacyOverlay));

    const freshPreview = invoke(fixture, "tools/init-project.ts", ["--target", fresh, "--mode", "preview"]);
    const freshWrite = invoke(fixture, "tools/init-project.ts", ["--target", fresh, "--mode", "write"]);
    fs.writeFileSync(path.join(fresh, "opencode-dev-kit", "adapter.json"), configuredAdapter(), "utf8");
    fs.mkdirSync(path.join(fresh, "docs"), { recursive: true });
    fs.writeFileSync(path.join(fresh, "docs", "roadmap.md"), "# Disposable Roadmap\n", "utf8");
    fs.writeFileSync(path.join(fresh, "mission.json"), missionDefinition(), "utf8");
    materializeRuntimeSurfaceProfile({ profileName: "all", root: sourceRoot, targetRoot: installedGlobal });
    fs.copyFileSync(
      path.join(installedGlobal, "opencode.local.instructions.example.md"),
      path.join(installedGlobal, "opencode.local.instructions.md"),
    );
    const installedEnv = {
      HOME: isolatedHome,
      OPENCODE_CONFIG_DIR: installedGlobal,
      USERPROFILE: isolatedHome,
      XDG_CONFIG_HOME: path.join(isolatedHome, ".config"),
    };
    const installedDoctor = invoke(fixture, "tools/doctor.ts", [
      "--project",
      fresh,
      "--mission",
      "mission.json",
      "--require",
      "unattended",
      "--format",
      "json",
    ], installedEnv);
    const installedSourceInventory = invoke(
      fixture,
      "tools/opencode-runtime-sources.ts",
      ["--root", fresh],
      installedEnv,
    );
    const installedProfile = installedMissionProfile(installedGlobal);
    const freshDoctor = invoke(fixture, "tools/doctor.ts", [
      "--project",
      fresh,
      "--mission",
      "mission.json",
      "--format",
      "json",
    ]);
    setupGateChange(fresh);
    const operationGate = invoke(fixture, "global/bin/openspec-operation-gate.ts", [
      "--root",
      fresh,
      "--operation",
      "apply",
      "--change",
      "helper-proof",
    ]);
    const freshSourceInventory = invoke(fixture, "tools/opencode-runtime-sources.ts", ["--root", fresh]);
    const missingSourceInventory = invoke(
      fixture,
      "tools/opencode-runtime-sources.ts",
      ["--root", fresh],
      { HOME: isolatedHome, OPENCODE_CONFIG_DIR: missingGlobal, USERPROFILE: isolatedHome },
    );

    const legacyPreview = invoke(fixture, "tools/init-project.ts", ["--target", legacy, "--mode", "preview"]);
    if (sha256(fs.readFileSync(legacyAgents)) !== legacyAgentsHash) throw new Error("Preview changed existing AGENTS.md bytes");
    const legacyWrite = invoke(fixture, "tools/init-project.ts", ["--target", legacy, "--mode", "write", "--overwrite"]);
    const backupRoot = path.join(legacy, ".backups", "opencode-dev-kit");
    const backupDirectories = fs.readdirSync(backupRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
    if (backupDirectories.length !== 1) throw new Error("Explicit overwrite did not create exactly one backup directory");
    const legacyBackup = path.join(backupRoot, backupDirectories[0].name, "AGENTS.md");
    fs.writeFileSync(path.join(legacy, "opencode-dev-kit", "adapter.json"), configuredAdapter(), "utf8");
    const legacyDoctor = invoke(fixture, "tools/doctor.ts", ["--project", legacy, "--format", "json"]);
    const legacySourceInventory = invoke(fixture, "tools/opencode-runtime-sources.ts", ["--root", legacy]);
    const freshManifest = files(fresh);

    assertEvidence(
      freshPreview,
      freshWrite,
      freshDoctor,
      installedDoctor,
      legacyPreview,
      legacyWrite,
      legacyDoctor,
      freshSourceInventory,
      installedSourceInventory,
      missingSourceInventory,
      legacySourceInventory,
      operationGate,
      freshManifest,
      installedProfile,
      overlayHash,
      legacyOverlay,
      legacyOverlayRelative,
      legacyBackup,
      legacyAgentsHash,
    );

    fs.mkdirSync(options.evidenceRoot, { recursive: false });
    writeNew(path.join(options.evidenceRoot, "raw.json"), stableJson({
      candidateId: options.candidateId,
      commands: {
        freshPreview,
        freshWrite,
        legacyPreview,
        legacyWrite,
      },
      environment: { node: process.version, platform: process.platform },
      freshDoctor: selectedDoctor(freshDoctor.stdout),
      freshManifest,
      installedDoctor: selectedDoctor(installedDoctor.stdout),
      installedProfile,
      legacyDoctor: selectedDoctor(legacyDoctor.stdout),
      legacyOverlay: {
        path: legacyOverlayRelative,
        preservedSha256: overlayHash,
      },
      legacyOverwriteBackup: {
        path: ".backups/opencode-dev-kit/<stamp>/AGENTS.md",
        sha256: legacyAgentsHash,
      },
      productionSources: [
        "tools/init-project.ts",
        "tools/doctor.ts",
        "tools/opencode-runtime-sources.ts",
        "tools/runtime-surface-profile.ts",
        "templates/project/AGENTS.md",
        "templates/project/adapter.json",
        "templates/project/validation.md",
      ].map((relative) => ({ path: relative, sha256: sha256(fs.readFileSync(path.join(sourceRoot, relative))) })),
      runtimeSources: {
        collision: selectedSources(legacySourceInventory.stdout),
        configured: selectedSources(freshSourceInventory.stdout),
        installedAll: selectedSources(installedSourceInventory.stdout),
        missing: selectedSources(missingSourceInventory.stdout),
      },
      operationGate: JSON.parse(operationGate.stdout),
      schemaVersion: 1,
    }));
    writeNew(path.join(options.evidenceRoot, "evaluation.json"), stableJson({
      candidateId: options.candidateId,
      cleanup: "pending",
      legacyOverlay: "reported-and-preserved",
      newProjectWorkflowCopies: 0,
      ordinaryQualification: "pass",
      runtimeSurfaceInstall: "all-profile-pass",
      schemaVersion: 1,
      status: "complete",
      unattendedReadiness: "pass",
    }));
  } finally {
    try {
      fs.rmSync(fixture, { recursive: true, force: true });
    } catch (error) {
      cleanupError = error instanceof Error ? error.message : String(error);
    }
  }
  if (cleanupError != null) throw new Error(`Fixture cleanup failed: ${cleanupError}`);
  const evaluationPath = path.join(options.evidenceRoot, "evaluation.json");
  const evaluation = JSON.parse(fs.readFileSync(evaluationPath, "utf8")) as Record<string, unknown>;
  evaluation.cleanup = "complete";
  fs.writeFileSync(evaluationPath, stableJson(evaluation), "utf8");
  console.log(stableJson({ candidateId: options.candidateId, evidenceRoot: "<evidence-root>", status: "complete" }).trimEnd());
}

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(HELP);
} else {
  try {
    run(parseArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(stableJson({ error: error instanceof Error ? error.message : String(error), status: "blocked" }).trimEnd());
    process.exitCode = 1;
  }
}
