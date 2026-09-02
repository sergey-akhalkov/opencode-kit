#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { runPortableCommand } from "../global/bin/portable-process.ts";
import { BEADS_BRIDGE_REGISTRATION_FILE, createBeadsBridgeRegistration, inspectBeadsBridgeCoordination, loadBeadsBridgeRegistration } from "./windows/beads-bridge-registration.ts";
import { BeadsProjectLifecycleError, runBeadsProjectLifecycle } from "./windows/beads-project-lifecycle.ts";
import type { BeadsProjectLifecycleDependencies } from "./windows/beads-project-lifecycle.ts";
import { loadBeadsReleaseManifest } from "./windows/beads-release.ts";

type Mode = "success" | "tracked" | "hook" | "remote" | "external" | "config-multi";
type Fixture = {
  root: string;
  project: string;
  protectedRoot: string;
  registrationFile: string;
  argvLog: string;
  external: string;
  baselineExclude: Buffer;
  setMode: (mode: Mode) => void;
  dependencies: BeadsProjectLifecycleDependencies;
};

function run(root: string, executable: string, args: string[]): string {
  const result = spawnSync(executable, args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${executable} ${args[0] ?? ""} failed: ${result.stderr}`);
  return result.stdout;
}

function fileIdentity(file: string) {
  const content = fs.readFileSync(file);
  return { bytes: content.length, sha256: crypto.createHash("sha256").update(content).digest("hex") };
}

function directoryIdentity(directory: string): string {
  const rows = fs.existsSync(directory)
    ? fs.readdirSync(directory, { withFileTypes: true }).map((entry) => ({ name: entry.name, directory: entry.isDirectory() })).sort((left, right) => left.name.localeCompare(right.name))
    : [];
  return crypto.createHash("sha256").update(JSON.stringify(rows)).digest("hex");
}

function fixture(): Fixture {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "beads-project-lifecycle-test-"));
  const project = path.join(root, "project");
  const protectedRoot = path.join(root, "protected");
  const external = path.join(root, "external");
  fs.mkdirSync(project);
  fs.mkdirSync(path.join(protectedRoot, "bin"), { recursive: true });
  fs.mkdirSync(path.join(protectedRoot, "adapter"), { recursive: true });
  fs.mkdirSync(external);
  run(project, "git", ["init", "--quiet"]);
  run(project, "git", ["config", "user.name", "Fixture"]);
  run(project, "git", ["config", "user.email", "fixture@example.invalid"]);
  const ignoreFile = path.join(project, ".gitignore");
  const baselineIgnore = Buffer.from("fixture-only\n", "utf8");
  fs.writeFileSync(ignoreFile, baselineIgnore);
  run(project, "git", ["add", ".gitignore"]);
  run(project, "git", ["commit", "--quiet", "-m", "fixture"]);
  const baselineExclude = fs.readFileSync(path.join(project, ".git", "info", "exclude"));

  const binary = path.join(protectedRoot, "bin", "bd.exe");
  const adapter = path.join(protectedRoot, "adapter", "beads-vendor-adapter.mjs");
  const fake = path.join(root, "fake-bd.mjs");
  const argvLog = path.join(root, "argv.jsonl");
  fs.writeFileSync(binary, "binary fixture", "utf8");
  fs.writeFileSync(adapter, "adapter fixture", "utf8");
  fs.writeFileSync(fake, `
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
const argv = process.argv.slice(2);
fs.appendFileSync(process.env.FAKE_ARGV_LOG, JSON.stringify(argv) + "\\n");
const git = (...args) => {
  const result = spawnSync("git", args, { cwd: process.cwd(), encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr);
};
if (argv.includes("init")) {
  fs.mkdirSync(path.join(process.cwd(), ".beads"));
  fs.writeFileSync(path.join(process.cwd(), ".beads", "store.json"), "{\\"initialized\\":true}\\n");
  git("config", "--local", "beads.role", "maintainer");
  fs.appendFileSync(path.join(process.cwd(), ".git", "info", "exclude"), ".beads/\\n");
  if (process.env.FAKE_MODE === "tracked") fs.appendFileSync(path.join(process.cwd(), ".gitignore"), "unexpected\\n");
  if (process.env.FAKE_MODE === "hook") fs.writeFileSync(path.join(process.cwd(), ".git", "hooks", "pre-commit"), "unexpected\\n");
  if (process.env.FAKE_MODE === "remote") git("remote", "add", "origin", "https://example.invalid/repo.git");
  if (process.env.FAKE_MODE === "external") fs.writeFileSync(path.join(process.env.FAKE_EXTERNAL, "unexpected.txt"), "unexpected\\n");
  if (process.env.FAKE_MODE === "config-multi") git("config", "--local", "--add", "beads.role", "unexpected");
  process.stdout.write("{}\\n");
} else if (argv.includes("where")) {
  process.stdout.write(JSON.stringify({ path: process.env.BEADS_DIR, prefix: "BPB" }) + "\\n");
} else if (argv.includes("status")) {
  process.stdout.write(JSON.stringify({ summary: { total_issues: 0, open_issues: 0, in_progress_issues: 0, blocked_issues: 0, deferred_issues: 0, closed_issues: 0, ready_issues: 0 } }) + "\\n");
} else {
  process.stderr.write("unsupported fixture command\\n");
  process.exit(2);
}
`, "utf8");

  const manifest = loadBeadsReleaseManifest();
  const registrationFile = path.join(protectedRoot, BEADS_BRIDGE_REGISTRATION_FILE);
  createBeadsBridgeRegistration(registrationFile, {
    enabled: false,
    projectRoot: project,
    ownerClass: "opencode-kit",
    prefix: "BPB",
    binaryPath: binary,
    binarySha256: manifest.release.executable.sha256,
    adapterPath: adapter,
    adapterSha256: fileIdentity(adapter).sha256,
    profileSha256: crypto.createHash("sha256").update("core-beads fixture").digest("hex"),
  });
  let mode: Mode = "success";
  const dependencies: BeadsProjectLifecycleDependencies = {
    fileIdentity: (file) => {
      if (path.resolve(file) === path.resolve(binary)) return { bytes: manifest.release.executable.bytes, sha256: manifest.release.executable.sha256 };
      if (path.resolve(file) === path.resolve(ignoreFile) && fs.readFileSync(file).equals(baselineIgnore)) {
        return { bytes: baselineIgnore.length, sha256: manifest.initialization.requiredTrackedFiles[0].sha256 };
      }
      return fileIdentity(file);
    },
    captureExternalBoundary: () => directoryIdentity(external),
    adapter: {
      inspectExecutable: () => ({ bytes: manifest.release.executable.bytes, sha256: manifest.release.executable.sha256 }),
      inspectTrackedFile: (file) => ({ sha256: dependencies.fileIdentity!(file).sha256 }),
      runCommand: (cwd, argv, options) => runPortableCommand(cwd, [process.execPath, fake, ...argv.slice(1)], {
        ...options,
        env: { ...options.env, FAKE_ARGV_LOG: argvLog, FAKE_MODE: mode, FAKE_EXTERNAL: external },
      }),
    },
  };
  return { root, project, protectedRoot, registrationFile, argvLog, external, baselineExclude, setMode: (value) => { mode = value; }, dependencies };
}

function cleanup(item: Fixture): void {
  fs.rmSync(item.root, { recursive: true, force: true });
}

function identity(ref: string) {
  return {
    pid: process.pid,
    processRef: ref,
    executableSha256: crypto.createHash("sha256").update(process.execPath.toLowerCase()).digest("hex"),
    startedAt: new Date().toISOString(),
  };
}

function errorCode(runOperation: () => unknown): string {
  let thrown: unknown;
  try {
    runOperation();
  } catch (error) {
    thrown = error;
  }
  assert.ok(thrown instanceof BeadsProjectLifecycleError);
  return (thrown as BeadsProjectLifecycleError).code;
}

test("previews exact reviewed init without creating project or bridge state", () => {
  const item = fixture();
  try {
    const before = fs.readdirSync(item.project);
    const preview = runBeadsProjectLifecycle({ operation: "preview", registrationFile: item.registrationFile }, item.dependencies);
    assert.deepEqual(preview.invocation?.argv, [
      "init", "--prefix", "BPB", "--non-interactive", "--skip-agents", "--skip-hooks", "--setup-exclude", "--json", "--sandbox",
    ]);
    assert.equal(preview.status, "preview");
    assert.equal(preview.registrationEnabled, false);
    assert.equal(preview.observation.processCleanup, "not-run");
    assert.deepEqual(fs.readdirSync(item.project), before);
    assert.equal(fs.existsSync(path.join(item.protectedRoot, "beads-bridge")), false);
    assert.equal(fs.existsSync(item.argvLog), false);
  } finally {
    cleanup(item);
  }
});

test("rejects unsupported operations and extra request fields before effects", () => {
  const item = fixture();
  try {
    assert.equal(errorCode(() => runBeadsProjectLifecycle({ operation: "prime", registrationFile: item.registrationFile }, item.dependencies)), "unsupported-operation");
    assert.equal(errorCode(() => runBeadsProjectLifecycle({ operation: "check", registrationFile: item.registrationFile, argv: ["init"] }, item.dependencies)), "invalid-request");
    assert.equal(fs.existsSync(path.join(item.protectedRoot, "beads-bridge")), false);
    assert.equal(fs.existsSync(item.argvLog), false);
  } finally {
    cleanup(item);
  }
});

test("enables, checks, disables, and rolls back only matching effects while preserving the store", () => {
  const item = fixture();
  try {
    const enabled = runBeadsProjectLifecycle({ operation: "enable", registrationFile: item.registrationFile, processIdentity: identity("process:enable") }, item.dependencies);
    assert.equal(enabled.status, "enabled");
    assert.equal(enabled.registrationEnabled, true);
    assert.equal(enabled.observation.processCleanup, "terminal");
    assert.equal(fs.existsSync(path.join(item.project, ".beads", "store.json")), true);
    assert.equal(run(item.project, "git", ["config", "--local", "--get", "beads.role"]).trim(), "maintainer");
    assert.match(fs.readFileSync(path.join(item.project, ".git", "info", "exclude"), "utf8"), /\.beads\//u);

    const checked = runBeadsProjectLifecycle({ operation: "check", registrationFile: item.registrationFile }, item.dependencies);
    assert.equal(checked.status, "current");
    assert.equal(checked.registrationEnabled, true);
    const disabled = runBeadsProjectLifecycle({ operation: "disable", registrationFile: item.registrationFile, processIdentity: identity("process:disable") }, item.dependencies);
    assert.equal(disabled.status, "disabled");
    assert.equal(disabled.registrationEnabled, false);
    assert.equal(disabled.storePreserved, true);

    const rolledBack = runBeadsProjectLifecycle({ operation: "rollback", registrationFile: item.registrationFile, processIdentity: identity("process:rollback") }, item.dependencies);
    assert.equal(rolledBack.status, "rolled-back");
    assert.equal(rolledBack.storePreserved, true);
    assert.equal(spawnSync("git", ["config", "--local", "--get", "beads.role"], { cwd: item.project }).status, 1);
    assert.deepEqual(fs.readFileSync(path.join(item.project, ".git", "info", "exclude")), item.baselineExclude);
    assert.equal(fs.existsSync(path.join(item.project, ".beads", "store.json")), true);
    assert.equal(loadBeadsBridgeRegistration(item.registrationFile).enabled, false);
    assert.equal(run(item.project, "git", ["diff", "--binary", "--no-ext-diff"]), "");
    assert.equal(run(item.project, "git", ["status", "--porcelain=v1"]).trim(), "?? .beads/");
    assert.equal(runBeadsProjectLifecycle({ operation: "check", registrationFile: item.registrationFile }, item.dependencies).status, "current");
    const invocations = fs.readFileSync(item.argvLog, "utf8").trim().split(/\r?\n/u).map((row) => JSON.parse(row) as string[]);
    assert.equal(invocations.filter((argv) => argv.includes("init")).length, 1);
    assert.equal(invocations.some((argv) => argv.includes("--stealth") || argv.includes("--ignore-schema-skew")), false);
  } finally {
    cleanup(item);
  }
});

for (const mode of ["tracked", "hook", "remote", "external", "config-multi"] as const) {
  test(`rejects ${mode} mutation before claiming enablement`, () => {
    const item = fixture();
    try {
      item.setMode(mode);
      assert.equal(
        errorCode(() => runBeadsProjectLifecycle({ operation: "enable", registrationFile: item.registrationFile, processIdentity: identity(`process:red-${mode}`) }, item.dependencies)),
        "enable-failed",
      );
      assert.equal(loadBeadsBridgeRegistration(item.registrationFile).enabled, false);
      assert.equal(fs.existsSync(path.join(item.project, ".beads")), true, "failed init evidence must be preserved");
      if (mode === "external") assert.equal(fs.existsSync(path.join(item.external, "unexpected.txt")), true);
    } finally {
      cleanup(item);
    }
  });
}

test("returns partial unknown and preserves drift instead of rolling back over it", () => {
  const item = fixture();
  try {
    runBeadsProjectLifecycle({ operation: "enable", registrationFile: item.registrationFile, processIdentity: identity("process:enable-drift") }, item.dependencies);
    runBeadsProjectLifecycle({ operation: "disable", registrationFile: item.registrationFile, processIdentity: identity("process:disable-drift") }, item.dependencies);
    fs.appendFileSync(path.join(item.project, ".git", "info", "exclude"), "user-drift/\n");
    const rollback = runBeadsProjectLifecycle({ operation: "rollback", registrationFile: item.registrationFile, processIdentity: identity("process:rollback-drift") }, item.dependencies);
    assert.equal(rollback.status, "partial-unknown");
    assert.ok(rollback.drift.includes("exclude"));
    assert.match(fs.readFileSync(path.join(item.project, ".git", "info", "exclude"), "utf8"), /user-drift\//u);
    assert.equal(fs.existsSync(path.join(item.project, ".beads", "store.json")), true);
    assert.equal(loadBeadsBridgeRegistration(item.registrationFile).enabled, false);
  } finally {
    cleanup(item);
  }
});

test("rejects a drifted lifecycle record before rollback mutation", () => {
  const item = fixture();
  try {
    const enabled = runBeadsProjectLifecycle({ operation: "enable", registrationFile: item.registrationFile, processIdentity: identity("process:enable-record-drift") }, item.dependencies);
    runBeadsProjectLifecycle({ operation: "disable", registrationFile: item.registrationFile, processIdentity: identity("process:disable-record-drift") }, item.dependencies);
    const lifecycleFile = path.join(item.protectedRoot, "beads-bridge", enabled.projectRef.slice("project_".length), "project-lifecycle.json");
    const record = JSON.parse(fs.readFileSync(lifecycleFile, "utf8")) as Record<string, unknown>;
    fs.writeFileSync(lifecycleFile, `${JSON.stringify({ ...record, extra: true }, null, 2)}\n`, "utf8");
    assert.equal(
      errorCode(() => runBeadsProjectLifecycle({ operation: "rollback", registrationFile: item.registrationFile, processIdentity: identity("process:rollback-record-drift") }, item.dependencies)),
      "lifecycle-record-invalid",
    );
    assert.equal(run(item.project, "git", ["config", "--local", "--get", "beads.role"]).trim(), "maintainer");
    assert.equal(fs.existsSync(path.join(item.project, ".beads", "store.json")), true);
  } finally {
    cleanup(item);
  }
});

test("does not execute a drifted registered binary during read-only check", () => {
  const item = fixture();
  try {
    const enabled = runBeadsProjectLifecycle({ operation: "enable", registrationFile: item.registrationFile, processIdentity: identity("process:enable-binary-drift") }, item.dependencies);
    const beforeInvocations = fs.readFileSync(item.argvLog, "utf8");
    const baseIdentity = item.dependencies.fileIdentity!;
    const driftedDependencies: BeadsProjectLifecycleDependencies = {
      ...item.dependencies,
      fileIdentity: (file) => path.resolve(file) === path.resolve(loadBeadsBridgeRegistration(item.registrationFile).binaryPath)
        ? { bytes: 1, sha256: "0".repeat(64) }
        : baseIdentity(file),
    };
    const checked = runBeadsProjectLifecycle({ operation: "check", registrationFile: item.registrationFile }, driftedDependencies);
    assert.equal(checked.status, "partial-unknown");
    assert.ok(checked.drift.includes("installed"));
    assert.equal(fs.readFileSync(item.argvLog, "utf8"), beforeInvocations);
    assert.equal(enabled.registrationEnabled, true);
  } finally {
    cleanup(item);
  }
});

test("keeps the writer lock when adapter cleanup liveness is unknown", () => {
  const item = fixture();
  try {
    const unknownDependencies: BeadsProjectLifecycleDependencies = {
      ...item.dependencies,
      adapter: {
        ...item.dependencies.adapter,
        runCommand: () => ({
          status: null,
          signal: null,
          cleanupState: "unknown",
          timedOut: true,
          error: new Error("fixture timeout"),
          stdout: "",
          stderr: "",
        }),
      },
    };
    assert.equal(
      errorCode(() => runBeadsProjectLifecycle({ operation: "enable", registrationFile: item.registrationFile, processIdentity: identity("process:unknown-cleanup") }, unknownDependencies)),
      "enable-failed",
    );
    const coordination = inspectBeadsBridgeCoordination(item.registrationFile);
    assert.equal(coordination.writer, "unknown");
    assert.equal(coordination.preserveManagedMaterial, true);
    assert.equal(loadBeadsBridgeRegistration(item.registrationFile).enabled, false);
    assert.equal(fs.existsSync(path.join(item.project, ".beads")), false);
  } finally {
    cleanup(item);
  }
});
