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
  fixturePathLeaked: boolean;
  id: string;
  privateContentLeaked: boolean;
  stderr: string;
  stdout: string;
};

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const privateSentinels = [
  "private-config-content-must-not-leak",
  "private-instruction-content-must-not-leak",
  "private-project-skill-content-must-not-leak",
];

function usage(): string {
  return [
    "Usage:",
    "  npm run proof:doctor-qualification -- --candidate-id <id> --evidence-root <absolute-new-path>",
    "",
    "Options:",
    "  --candidate-id <id>       Privacy-safe candidate identifier.",
    "  --evidence-root <path>    Absolute path that must not already exist.",
    "  --help, -h                Show this help without creating fixtures or evidence.",
  ].join("\n");
}

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
  if (value == null || value.trim() === "" || value.startsWith("--")) {
    throw new Error(`Missing value for ${option}`);
  }
  return value;
}

function parseArgs(args: string[]): Options | null {
  if (args.includes("--help") || args.includes("-h")) return null;
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
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(candidateId)) {
    throw new Error("--candidate-id must be a safe identifier");
  }
  if (!path.isAbsolute(evidenceRoot)) throw new Error("--evidence-root must be absolute");
  return { candidateId, evidenceRoot: path.resolve(evidenceRoot) };
}

function writeNew(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, { encoding: "utf8", flag: "wx" });
}

function fileManifest(root: string): Array<{ path: string; sha256: string }> {
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

function createReadyProject(project: string, collision: boolean): void {
  const validationMarker = path.join(project, ".validation-command-executed");
  writeNew(path.join(project, "AGENTS.md"), "# Project Instructions\n\n## Runtime Authority\n");
  writeNew(path.join(project, "opencode.json"), stableJson({ provider: privateSentinels[0] }));
  writeNew(path.join(project, "opencode-dev-kit", "adapter.json"), stableJson({
    unattended: {
      checkpointModes: ["evidence-only", "external", "local-commit"],
      localCommitRequiresAuthorization: true,
      validationArgv: [process.execPath, path.join(project, "validation-must-not-run.mjs")],
      workflowOwner: "global-canonical",
    },
    validation: {
      build: `node validation-must-not-run.mjs ${validationMarker}`,
      focusedTest: `node validation-must-not-run.mjs ${validationMarker}`,
      lint: `node validation-must-not-run.mjs ${validationMarker}`,
      test: `node validation-must-not-run.mjs ${validationMarker}`,
      typecheck: `node validation-must-not-run.mjs ${validationMarker}`,
    },
  }));
  writeNew(
    path.join(project, "validation-must-not-run.mjs"),
    "import fs from 'node:fs';\nfs.writeFileSync(process.argv[2], 'executed');\n",
  );
  if (collision) {
    writeNew(
      path.join(project, ".opencode", "skills", "openspec-apply-change", "SKILL.md"),
      `${privateSentinels[2]}\n`,
    );
  }
}

function evidenceText(value: string, fixture: string): string {
  return value
    .replaceAll(fixture, "<fixture>")
    .replaceAll(fixture.replaceAll("\\", "/"), "<fixture>")
    .replaceAll(sourceRoot, "<source-root>")
    .replaceAll(sourceRoot.replaceAll("\\", "/"), "<source-root>");
}

function invoke(
  id: string,
  script: "doctor" | "opencode:sources",
  args: string[],
  environment: NodeJS.ProcessEnv,
  fixture: string,
): CommandEvidence {
  const argv = ["npm", "--silent", "run", script, "--", ...args];
  const result = runPortableCommand(sourceRoot, argv, {
    capture: true,
    env: environment,
    timeoutMs: 120_000,
  });
  if (result.error != null) throw result.error;
  const combined = `${result.stdout}\n${result.stderr}`;
  const normalizedFixture = fixture.replaceAll("\\", "/");
  return {
    argv: argv.map((value) => evidenceText(value, fixture)),
    exitCode: result.status,
    fixturePathLeaked: combined.includes(fixture) || combined.includes(normalizedFixture),
    id,
    privateContentLeaked: privateSentinels.some((sentinel) => combined.includes(sentinel)),
    stderr: evidenceText(result.stderr, fixture),
    stdout: evidenceText(result.stdout, fixture),
  };
}

function doctorReport(command: CommandEvidence): Record<string, unknown> {
  return JSON.parse(command.stdout) as Record<string, unknown>;
}

function checkRows(report: Record<string, unknown>, field: "checks" | "unattendedChecks"): Array<Record<string, unknown>> {
  const rows = report[field];
  if (!Array.isArray(rows)) throw new Error(`Doctor report ${field} must be an array`);
  return rows as Array<Record<string, unknown>>;
}

function namedCheck(report: Record<string, unknown>, field: "checks" | "unattendedChecks", name: string): Record<string, unknown> {
  const row = checkRows(report, field).find((candidate) => candidate.name === name);
  if (row == null) throw new Error(`Doctor report omitted ${name}`);
  return row;
}

function blockers(report: Record<string, unknown>, gate: string): string[] {
  const all = report.blockers;
  if (all == null || typeof all !== "object" || Array.isArray(all)) throw new Error("Doctor report blockers must be an object");
  const selected = (all as Record<string, unknown>)[gate];
  if (!Array.isArray(selected) || selected.some((value) => typeof value !== "string")) {
    throw new Error(`Doctor report ${gate} blockers must be a string array`);
  }
  return selected as string[];
}

function assertEvidence(commands: Record<string, CommandEvidence>, work: string, before: unknown, after: unknown): void {
  const expectedExits: Record<string, number> = {
    canonicalQualification: 2,
    canonicalUnattended: 2,
    defaultBlocked: 0,
    doctorHelp: 0,
    qualificationBlocked: 2,
    qualificationReady: 0,
    runtimeHelp: 0,
    runtimeInventory: 0,
    runtimeInvalid: 1,
    structuralBlocked: 2,
    structuralReady: 0,
  };
  for (const [id, expected] of Object.entries(expectedExits)) {
    if (commands[id]?.exitCode !== expected) throw new Error(`${id} exited ${String(commands[id]?.exitCode)} instead of ${expected}`);
  }
  for (const command of Object.values(commands)) {
    if (command.fixturePathLeaked) throw new Error(`${command.id} exposed the disposable fixture path`);
    if (command.privateContentLeaked) throw new Error(`${command.id} exposed private fixture content`);
  }
  if (!commands.runtimeHelp.stdout.startsWith("Usage:") || commands.runtimeHelp.stdout.includes('"schemaVersion"')) {
    throw new Error("Runtime-source help performed or emitted inventory");
  }
  if (!commands.doctorHelp.stdout.startsWith("Usage:") || commands.doctorHelp.stdout.includes("Qualification Status:")) {
    throw new Error("Doctor help performed or emitted diagnostics");
  }
  if (commands.runtimeInvalid.stdout !== "" || !commands.runtimeInvalid.stderr.includes("Unknown option: --unsupported")) {
    throw new Error("Runtime-source invalid option did not fail before report output");
  }

  const inventory = JSON.parse(commands.runtimeInventory.stdout) as { root: string; unattended: { collisionStatus: string } };
  if (inventory.root !== "<home>/work/ready" || inventory.unattended.collisionStatus !== "clear") {
    throw new Error("Representative runtime-source inventory did not preserve --root or additive-only status");
  }

  const structuralReady = doctorReport(commands.structuralReady);
  if (structuralReady.status !== "warn" || structuralReady.requiredGate !== "structural" || blockers(structuralReady, "structural").length !== 0) {
    throw new Error("Structural gate did not pass advisory-only warnings");
  }
  const qualificationReady = doctorReport(commands.qualificationReady);
  const identityReady = namedCheck(qualificationReady, "checks", "canonical runtime-source identity");
  if (
    qualificationReady.qualificationStatus !== "pass" ||
    qualificationReady.requiredGate !== "qualification" ||
    blockers(qualificationReady, "qualification").length !== 0 ||
    identityReady.status !== "pass"
  ) {
    throw new Error("Qualification gate did not pass additive non-authority layering");
  }
  const runtimeSources = qualificationReady.runtimeSources as { collisions?: Array<{ kind: string }> } | undefined;
  const additiveKinds = new Set((runtimeSources?.collisions ?? []).map((collision) => collision.kind));
  if (!additiveKinds.has("config") || !additiveKinds.has("instruction")) {
    throw new Error("Doctor omitted additive config or instruction collision diagnostics");
  }

  const structuralBlocked = doctorReport(commands.structuralBlocked);
  if (!blockers(structuralBlocked, "structural").includes("project directory")) {
    throw new Error("Structural gate omitted the missing project blocker");
  }
  const qualificationBlocked = doctorReport(commands.qualificationBlocked);
  const multiple = blockers(qualificationBlocked, "qualification");
  if (!multiple.includes("project AGENTS.md") || !multiple.includes("project adapter validation") || multiple.length < 2) {
    throw new Error("Qualification gate truncated multiple blockers");
  }
  const defaultBlocked = doctorReport(commands.defaultBlocked);
  if (defaultBlocked.requiredGate !== null || defaultBlocked.status !== "warn" || defaultBlocked.qualificationStatus !== "blocked") {
    throw new Error("Default doctor contract no longer preserves informational structural exit");
  }

  const canonicalQualification = doctorReport(commands.canonicalQualification);
  const canonicalIdentity = namedCheck(canonicalQualification, "checks", "canonical runtime-source identity");
  if (
    !blockers(canonicalQualification, "qualification").includes("canonical runtime-source identity") ||
    canonicalIdentity.status !== "warn" ||
    !String(canonicalIdentity.detail).includes("<home>/work/collision/.opencode/skills/openspec-apply-change/SKILL.md") ||
    !String(canonicalIdentity.detail).includes("<source-root>/global/skills/openspec-apply-change/SKILL.md")
  ) {
    throw new Error("Qualification gate omitted canonical collision locations or blocker identity");
  }
  const canonicalUnattended = doctorReport(commands.canonicalUnattended);
  const unattendedWorkflow = namedCheck(canonicalUnattended, "unattendedChecks", "unattended canonical workflow");
  if (
    !blockers(canonicalUnattended, "unattended").includes("unattended canonical workflow") ||
    !String(unattendedWorkflow.detail).includes("<home>/work/collision/.opencode/skills/openspec-apply-change/SKILL.md") ||
    !String(unattendedWorkflow.detail).includes("<source-root>/global/skills/openspec-apply-change/SKILL.md")
  ) {
    throw new Error("Unattended gate omitted canonical collision locations or blocker identity");
  }
  if (stableJson(before) !== stableJson(after)) throw new Error("Doctor or runtime-source CLI mutated a disposable project");
  for (const project of ["ready", "collision"]) {
    if (fs.existsSync(path.join(work, project, ".validation-command-executed"))) {
      throw new Error(`Doctor executed project validation for ${project}`);
    }
  }
}

function run(options: Options): void {
  if (fs.existsSync(options.evidenceRoot)) throw new Error("Evidence root already exists");
  fs.mkdirSync(options.evidenceRoot, { recursive: false });
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "doctor-qualification-proof-"));
  let cleanupError: string | null = null;
  let failure: Error | null = null;
  let rawWritten = false;
  const evaluation: Record<string, unknown> = {
    candidateId: options.candidateId,
    cleanup: "pending",
    schemaVersion: 1,
    status: "blocked",
  };
  try {
    const home = path.join(fixture, "home");
    const work = path.join(home, "work");
    const ready = path.join(work, "ready");
    const collision = path.join(work, "collision");
    const blocked = path.join(work, "blocked");
    const missing = path.join(work, "missing");
    createReadyProject(ready, false);
    createReadyProject(collision, true);
    fs.mkdirSync(blocked, { recursive: true });
    writeNew(path.join(home, ".config", "opencode", "opencode.json"), stableJson({ provider: privateSentinels[0] }));
    writeNew(path.join(home, ".config", "opencode", "AGENTS.md"), `${privateSentinels[1]}\n`);
    const before = fileManifest(work);
    const environment = { ...process.env };
    delete environment.OPENCODE_CONFIG;
    delete environment.OPENCODE_CONFIG_CONTENT;
    Object.assign(environment, {
      HOME: home,
      NO_COLOR: "1",
      OPENCODE_CONFIG_DIR: path.join(sourceRoot, "global"),
      USERPROFILE: home,
      npm_config_cache: path.join(fixture, "npm-cache"),
      npm_config_update_notifier: "false",
    });

    const commandList = [
      invoke("runtimeHelp", "opencode:sources", ["--help"], environment, fixture),
      invoke("runtimeInvalid", "opencode:sources", ["--unsupported"], environment, fixture),
      invoke("runtimeInventory", "opencode:sources", ["--root", ready], environment, fixture),
      invoke("doctorHelp", "doctor", ["--help"], environment, fixture),
      invoke("structuralReady", "doctor", ["--project", ready, "--format", "json", "--require", "structural"], environment, fixture),
      invoke("qualificationReady", "doctor", ["--project", ready, "--format", "json", "--require", "qualification"], environment, fixture),
      invoke("structuralBlocked", "doctor", ["--project", missing, "--format", "json", "--require", "structural"], environment, fixture),
      invoke("qualificationBlocked", "doctor", ["--project", blocked, "--format", "json", "--require", "qualification"], environment, fixture),
      invoke("defaultBlocked", "doctor", ["--project", blocked, "--format", "json"], environment, fixture),
      invoke("canonicalQualification", "doctor", ["--project", collision, "--format", "json", "--require", "qualification"], environment, fixture),
      invoke("canonicalUnattended", "doctor", ["--project", collision, "--format", "json", "--require", "unattended"], environment, fixture),
    ];
    const commands = Object.fromEntries(commandList.map((command) => [command.id, command]));
    const after = fileManifest(work);
    writeNew(path.join(options.evidenceRoot, "raw.json"), stableJson({
      candidateId: options.candidateId,
      commands,
      environment: { node: process.version, platform: process.platform },
      projectManifest: { after, before },
      productionSources: [
        "tools/doctor.ts",
        "tools/opencode-runtime-sources.ts",
        "package.json",
      ].map((relative) => ({ path: relative, sha256: sha256(fs.readFileSync(path.join(sourceRoot, relative))) })),
      proofRunner: {
        path: "tools/proofs/doctor-qualification.ts",
        sha256: sha256(fs.readFileSync(fileURLToPath(import.meta.url))),
      },
      schemaVersion: 1,
      sideEffects: {
        projectValidationMarkers: ["ready", "collision"].filter((project) =>
          fs.existsSync(path.join(work, project, ".validation-command-executed"))
        ),
      },
    }));
    rawWritten = true;
    assertEvidence(commands, work, before, after);
    evaluation.status = "complete";
  } catch (error) {
    failure = error instanceof Error ? error : new Error(String(error));
    evaluation.error = evidenceText(failure.message, fixture);
    if (!rawWritten) {
      writeNew(path.join(options.evidenceRoot, "raw.json"), stableJson({
        candidateId: options.candidateId,
        captureError: evidenceText(failure.message, fixture),
        schemaVersion: 1,
      }));
    }
  } finally {
    try {
      fs.rmSync(fixture, { recursive: true, force: true });
      if (fs.existsSync(fixture)) cleanupError = "fixture still exists";
    } catch (error) {
      cleanupError = error instanceof Error ? error.message : String(error);
    }
  }
  evaluation.cleanup = cleanupError == null ? "complete" : "blocked";
  if (cleanupError != null) evaluation.cleanupError = cleanupError;
  writeNew(path.join(options.evidenceRoot, "evaluation.json"), stableJson(evaluation));
  if (failure != null) throw failure;
  if (cleanupError != null) throw new Error(`Fixture cleanup failed: ${cleanupError}`);
  console.log(stableJson({ candidateId: options.candidateId, cleanup: "complete", evidenceRoot: "<evidence-root>", status: "complete" }).trimEnd());
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options == null) console.log(usage());
  else run(options);
} catch (error) {
  console.error(stableJson({ error: error instanceof Error ? error.message : String(error), status: "blocked" }).trimEnd());
  process.exitCode = 1;
}
