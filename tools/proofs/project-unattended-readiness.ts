#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runPortableCommand } from "../../global/bin/portable-process.ts";

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

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

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

function invoke(root: string, entrypoint: string, args: string[]): CommandEvidence {
  const result = runPortableCommand(root, [process.execPath, path.join(sourceRoot, entrypoint), ...args], {
    capture: true,
    env: { ...process.env, OPENCODE_CONFIG_DIR: path.join(sourceRoot, "global") },
  });
  if (result.error != null) throw result.error;
  const redact = (value: string): string => value
    .replaceAll(root, "<fixture>")
    .replaceAll(root.replaceAll("\\", "/"), "<fixture>");
  return {
    argv: ["node", entrypoint, ...args.map((arg) => path.isAbsolute(arg) ? "<fixture>" : arg)],
    exitCode: result.status,
    stderr: redact(result.stderr).slice(0, 5_000),
    stdout: redact(result.stdout).slice(0, 20_000),
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
  };
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
  legacyPreview: CommandEvidence,
  legacyWrite: CommandEvidence,
  legacyDoctor: CommandEvidence,
  sourceInventory: CommandEvidence,
  freshManifest: Array<{ path: string; sha256: string }>,
  overlayHash: string,
  legacyOverlay: string,
  legacyOverlayRelative: string,
  legacyBackup: string,
  legacyAgentsHash: string,
): void {
  for (const command of [freshPreview, freshWrite, freshDoctor, legacyPreview, legacyWrite, legacyDoctor, sourceInventory]) {
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
  if (fresh.qualificationStatus !== "pass" || fresh.unattendedMissionStatus !== "pass") {
    throw new Error(`Fresh doctor did not separate ordinary and unattended readiness: ${stableJson(fresh)}`);
  }
  const legacy = selectedDoctor(legacyDoctor.stdout);
  const collision = (legacy.unattendedChecks as Array<{ name: string; status: string }>).find((check) =>
    check.name === "unattended canonical workflow"
  );
  if (collision?.status !== "blocked") throw new Error("Legacy doctor did not block the canonical workflow collision");
  const sources = selectedSources(sourceInventory.stdout);
  if (sources.collisionStatus !== "blocked") throw new Error("Runtime source inventory did not report unattended collision status");
}

function run(options: Options): void {
  if (fs.existsSync(options.evidenceRoot)) throw new Error("Evidence root already exists");
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "project-unattended-proof-"));
  let cleanupError: string | null = null;
  try {
    const fresh = path.join(fixture, "fresh-non-js");
    const legacy = path.join(fixture, "legacy-non-js");
    fs.mkdirSync(fresh);
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
    const freshDoctor = invoke(fixture, "tools/doctor.ts", [
      "--project",
      fresh,
      "--mission",
      "mission.json",
      "--format",
      "json",
    ]);

    const legacyPreview = invoke(fixture, "tools/init-project.ts", ["--target", legacy, "--mode", "preview"]);
    if (sha256(fs.readFileSync(legacyAgents)) !== legacyAgentsHash) throw new Error("Preview changed existing AGENTS.md bytes");
    const legacyWrite = invoke(fixture, "tools/init-project.ts", ["--target", legacy, "--mode", "write", "--overwrite"]);
    const backupRoot = path.join(legacy, ".backups", "opencode-dev-kit");
    const backupDirectories = fs.readdirSync(backupRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
    if (backupDirectories.length !== 1) throw new Error("Explicit overwrite did not create exactly one backup directory");
    const legacyBackup = path.join(backupRoot, backupDirectories[0].name, "AGENTS.md");
    fs.writeFileSync(path.join(legacy, "opencode-dev-kit", "adapter.json"), configuredAdapter(), "utf8");
    const legacyDoctor = invoke(fixture, "tools/doctor.ts", ["--project", legacy, "--format", "json"]);
    const sourceInventory = invoke(fixture, "tools/opencode-runtime-sources.ts", ["--root", legacy]);
    const freshManifest = files(fresh);

    assertEvidence(
      freshPreview,
      freshWrite,
      freshDoctor,
      legacyPreview,
      legacyWrite,
      legacyDoctor,
      sourceInventory,
      freshManifest,
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
        "templates/project/AGENTS.md",
        "templates/project/adapter.json",
        "templates/project/validation.md",
      ].map((relative) => ({ path: relative, sha256: sha256(fs.readFileSync(path.join(sourceRoot, relative))) })),
      runtimeSources: selectedSources(sourceInventory.stdout),
      schemaVersion: 1,
    }));
    writeNew(path.join(options.evidenceRoot, "evaluation.json"), stableJson({
      candidateId: options.candidateId,
      cleanup: "pending",
      legacyOverlay: "reported-and-preserved",
      newProjectWorkflowCopies: 0,
      ordinaryQualification: "pass",
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

try {
  run(parseArgs(process.argv.slice(2)));
} catch (error) {
  console.error(stableJson({ error: error instanceof Error ? error.message : String(error), status: "blocked" }).trimEnd());
  process.exitCode = 1;
}
