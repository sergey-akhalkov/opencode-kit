#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  acquireBeadsBridgeWriterLease,
  createBeadsBridgeRegistration,
  loadBeadsBridgeRegistration,
  releaseBeadsBridgeWriterLease,
} from "../global/bin/beads-portfolio-bridge/beads-bridge-registration.ts";
import type {
  BeadsBridgeWriterClosure,
  BeadsBridgeWriterLease,
} from "../global/bin/beads-portfolio-bridge/beads-bridge-registration.ts";
import { loadBeadsReleaseManifest } from "../global/bin/beads-portfolio-bridge/beads-release.ts";
import {
  BeadsWorkstationLifecycleError,
  provisionBeadsBridgeWriterStorage,
  runBeadsWorkstationLifecycle,
} from "./windows/beads-workstation-lifecycle.ts";
import { loadBeadsPortfolioBridgePack } from "./proofs/consumer-outcome/beads-portfolio-bridge.ts";

const BPB_POPULATION = loadBeadsPortfolioBridgePack(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")).pack;
import type {
  BeadsWorkstationLifecycleDependencies,
  BeadsWorkstationLifecycleResult,
} from "./windows/beads-workstation-lifecycle.ts";

type Fixture = {
  dependencies: BeadsWorkstationLifecycleDependencies;
  executableSource: string;
  project: string;
  root: string;
  target: string;
};

function fileIdentity(file: string) {
  const content = fs.readFileSync(file);
  return { bytes: content.length, sha256: crypto.createHash("sha256").update(content).digest("hex") };
}

function fixture(): Fixture {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "beads-workstation-lifecycle-test-"));
  const target = path.join(root, "protected");
  const project = path.join(root, "project");
  const executableSource = path.join(root, "source-bd.exe");
  fs.mkdirSync(target);
  fs.mkdirSync(project);
  const init = spawnSync("git", ["init", "--quiet"], { cwd: project, encoding: "utf8" });
  if (init.status !== 0) throw new Error(init.stderr);
  fs.writeFileSync(executableSource, "executable fixture", "utf8");
  const manifest = loadBeadsReleaseManifest();
  const dependencies: BeadsWorkstationLifecycleDependencies = {
    architecture: () => "x64",
    platform: () => "win32",
    fileIdentity: (file) => path.resolve(file) === path.resolve(executableSource) || path.basename(file).toLowerCase() === "bd.exe"
      ? { bytes: manifest.release.executable.bytes, sha256: manifest.release.executable.sha256 }
      : fileIdentity(file),
  };
  return { dependencies, executableSource, project, root, target };
}

function cleanup(item: Fixture): void {
  fs.rmSync(item.root, { recursive: true, force: true });
}

function processIdentity(ref: string) {
  return {
    pid: process.pid,
    processRef: ref,
    executableSha256: crypto.createHash("sha256").update(process.execPath.toLowerCase()).digest("hex"),
    startedAt: new Date().toISOString(),
  };
}

function closure(lease: BeadsBridgeWriterLease): BeadsBridgeWriterClosure {
  return {
    schemaVersion: 1,
    status: "terminal",
    observedAt: new Date().toISOString(),
    processRef: lease.processRef,
    childProcessRefs: [],
    evidenceRefs: ["evidence:fixture-writer-terminal"],
  };
}

function install(item: Fixture): BeadsWorkstationLifecycleResult {
  return runBeadsWorkstationLifecycle({
    operation: "install",
    targetRoot: item.target,
    executableSourcePath: item.executableSource,
  }, item.dependencies);
}

function lifecycleErrorCode(run: () => unknown): string {
  let thrown: unknown;
  try {
    run();
  } catch (error) {
    thrown = error;
  }
  assert.ok(thrown instanceof BeadsWorkstationLifecycleError);
  return (thrown as BeadsWorkstationLifecycleError).code;
}

test("previews one exact protected plan without creating target state", () => {
  const item = fixture();
  try {
    const previewTarget = path.join(item.root, "preview-only");
    const preview = runBeadsWorkstationLifecycle({ operation: "preview", targetRoot: previewTarget }, item.dependencies);
    assert.equal(preview.status, BPB_POPULATION.workstation.previewStatus);
    assert.equal(preview.installed, false);
    assert.equal(preview.paths.executable, path.join(previewTarget, "beads", "bin", "bd.exe"));
    assert.equal(preview.paths.registration, path.join(previewTarget, "beads-bridge-registration.json"));
    assert.deepEqual(preview.plan?.inheritedAcl, ["SYSTEM:F", "BUILTIN\\Administrators:F", "BUILTIN\\Users:RX"]);
    for (const nonEffect of BPB_POPULATION.workstation.nonEffects) assert.ok((preview.plan?.nonEffects as string[]).includes(nonEffect));
    assert.equal(fs.existsSync(previewTarget), false);
  } finally {
    cleanup(item);
  }
});

test("rejects platform, manifest, executable, and source-path mismatches before install effects", () => {
  const item = fixture();
  try {
    assert.equal(lifecycleErrorCode(() => runBeadsWorkstationLifecycle({ operation: "install", targetRoot: item.target, executableSourcePath: item.executableSource }, {
      ...item.dependencies,
      platform: () => "linux",
    })), "unsupported-platform");

    assert.equal(lifecycleErrorCode(() => runBeadsWorkstationLifecycle({ operation: "install", targetRoot: item.target, executableSourcePath: item.executableSource }, {
      ...item.dependencies,
      fileIdentity,
    })), "executable-identity-mismatch");

    const manifestPath = path.join(item.root, "wrong-platform.manifest.json");
    const manifest = JSON.parse(fs.readFileSync(path.join("global", "bin", "beads-portfolio-bridge", "beads-release.manifest.json"), "utf8")) as Record<string, unknown>;
    fs.writeFileSync(manifestPath, `${JSON.stringify({ ...manifest, release: { ...(manifest.release as Record<string, unknown>), platform: "linux" } }, null, 2)}\n`, "utf8");
    assert.throws(() => runBeadsWorkstationLifecycle({ operation: "install", targetRoot: item.target, executableSourcePath: item.executableSource, manifestPath }, item.dependencies), /Failed to load Beads release manifest/u);

    const unsafeSource = path.join(item.target, "source-bd.exe");
    fs.writeFileSync(unsafeSource, "unsafe source fixture", "utf8");
    assert.equal(lifecycleErrorCode(() => runBeadsWorkstationLifecycle({ operation: "install", targetRoot: item.target, executableSourcePath: unsafeSource }, item.dependencies)), "unsafe-source-path");
    assert.deepEqual(fs.readdirSync(item.target), ["source-bd.exe"], "failed preflights must create no managed target state");
  } finally {
    cleanup(item);
  }
});

test("installs and checks exact files without selecting a profile or registering a project", () => {
  const item = fixture();
  try {
    const installed = install(item);
    assert.equal(installed.status, BPB_POPULATION.workstation.installStatus);
    assert.equal(fs.existsSync(installed.paths.executable), true);
    assert.equal(fs.existsSync(installed.paths.adapter), true);
    assert.equal(fs.existsSync(installed.paths.releaseManifest), true);
    assert.equal(fs.existsSync(installed.paths.bridgeRoot), true);
    assert.equal(fs.existsSync(installed.paths.registration), false);
    assert.deepEqual(fs.readdirSync(installed.paths.bridgeRoot), []);
    const checked = runBeadsWorkstationLifecycle({ operation: "check", targetRoot: item.target }, item.dependencies);
    assert.equal(checked.status, BPB_POPULATION.workstation.checkStatus);
    assert.equal(checked.writer, "not-registered");
    assert.deepEqual(fs.readdirSync(item.project), [".git"]);
  } finally {
    cleanup(item);
  }
});

test("cleans a destination whose post-copy identity check fails so install can retry", () => {
  const item = fixture();
  try {
    const manifest = loadBeadsReleaseManifest();
    const failedIdentity: BeadsWorkstationLifecycleDependencies = {
      ...item.dependencies,
      fileIdentity: (file) => path.resolve(file) === path.resolve(item.executableSource)
        ? { bytes: manifest.release.executable.bytes, sha256: manifest.release.executable.sha256 }
        : fileIdentity(file),
    };
    assert.equal(lifecycleErrorCode(() => runBeadsWorkstationLifecycle({
      operation: "install",
      targetRoot: item.target,
      executableSourcePath: item.executableSource,
    }, failedIdentity)), "install-failed");
    assert.deepEqual(fs.readdirSync(item.target), [], "failed copy verification must remove its file and created parent directories");
    assert.equal(install(item).status, "installed", "a cleaned target must remain retryable");
  } finally {
    cleanup(item);
  }
});

test("preserves every referenced managed item when a bridge writer is active or unknown", () => {
  const item = fixture();
  try {
    const installed = install(item);
    const manifest = loadBeadsReleaseManifest();
    const adapterSha256 = fileIdentity(installed.paths.adapter).sha256;
    createBeadsBridgeRegistration(installed.paths.registration, {
      enabled: false,
      projectRoot: item.project,
      ownerClass: "opencode-kit",
      prefix: "BPB",
      binaryPath: installed.paths.executable,
      binarySha256: manifest.release.executable.sha256,
      adapterPath: installed.paths.adapter,
      adapterSha256,
      profileSha256: crypto.createHash("sha256").update("core-beads fixture").digest("hex"),
    });
    const registrationBeforeProvision = loadBeadsBridgeRegistration(installed.paths.registration);
    const unownedState = path.join(installed.paths.bridgeRoot, registrationBeforeProvision.projectRef.slice("project_".length));
    fs.mkdirSync(unownedState);
    fs.writeFileSync(path.join(unownedState, "foreign.json"), "{}\n", "utf8");
    assert.equal(lifecycleErrorCode(() => provisionBeadsBridgeWriterStorage(item.target, item.dependencies)), "writer-storage-unsafe");
    fs.rmSync(unownedState, { recursive: true });
    const provisioned = provisionBeadsBridgeWriterStorage(item.target, item.dependencies);
    assert.equal(fs.existsSync(provisioned.writerStatePath), true);
    const registration = loadBeadsBridgeRegistration(installed.paths.registration);
    const lease = acquireBeadsBridgeWriterLease(installed.paths.registration, registration, "rollback", processIdentity("process:held-writer"));
    const lock = path.join(provisioned.writerStatePath, "writer.lock");

    const partial = runBeadsWorkstationLifecycle({
      operation: "rollback",
      targetRoot: item.target,
      processIdentity: processIdentity("process:competing-rollback"),
    }, item.dependencies);
    assert.equal(partial.status, BPB_POPULATION.workstation.activeWriterRollbackStatus);
    assert.equal(partial.reason, BPB_POPULATION.workstation.activeWriterRollbackReason);
    for (const retained of [installed.paths.executable, installed.paths.adapter, installed.paths.registration, installed.paths.installRecord, lock]) {
      assert.equal(fs.existsSync(retained), true, `${retained} must be retained`);
    }

    releaseBeadsBridgeWriterLease(installed.paths.registration, registration, lease, closure(lease));
    const rolledBack = runBeadsWorkstationLifecycle({
      operation: "rollback",
      targetRoot: item.target,
      processIdentity: processIdentity("process:terminal-rollback"),
    }, item.dependencies);
    assert.equal(rolledBack.status, BPB_POPULATION.workstation.terminalRollbackStatus);
    assert.equal(fs.existsSync(installed.paths.executable), false);
    assert.equal(fs.existsSync(installed.paths.adapter), false);
    assert.equal(fs.existsSync(installed.paths.registration), false);
    assert.equal(fs.existsSync(installed.paths.bridgeRoot), false);
    assert.equal(fs.existsSync(installed.paths.installRecord), false);
    assert.equal(fs.existsSync(path.join(item.project, ".git")), true, "project evidence must remain outside workstation rollback");
  } finally {
    cleanup(item);
  }
});

test("rejects installed drift and preserves all attributable material", () => {
  const item = fixture();
  try {
    const installed = install(item);
    fs.appendFileSync(installed.paths.adapter, "\nfixture drift\n", "utf8");
    const checked = runBeadsWorkstationLifecycle({ operation: "check", targetRoot: item.target }, item.dependencies);
    assert.equal(checked.status, "partial-unknown");
    assert.equal(checked.reason, "identity-drift");
    assert.ok(checked.drift.includes("managed:adapter"));
    assert.match(checked.diagnostics?.find((item) => item.drift === "managed:adapter")?.cause ?? "", /identity differs/u);
    const rollback = runBeadsWorkstationLifecycle({ operation: "rollback", targetRoot: item.target }, item.dependencies);
    assert.equal(rollback.status, "partial-unknown");
    assert.equal(rollback.eligible, false);
    assert.equal(fs.existsSync(installed.paths.adapter), true);
    assert.equal(fs.existsSync(installed.paths.executable), true);
    assert.equal(fs.existsSync(installed.paths.installRecord), true);
  } finally {
    cleanup(item);
  }
});
