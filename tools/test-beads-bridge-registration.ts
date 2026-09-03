#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  BEADS_BRIDGE_REGISTRATION_FILE,
  BeadsBridgeRegistrationError,
  acquireBeadsBridgeWriterLease,
  createBeadsBridgeRegistration,
  inspectBeadsBridgeCoordination,
  loadBeadsBridgeRegistration,
  releaseBeadsBridgeWriterLease,
  setBeadsBridgeRegistrationEnabled,
} from "../global/bin/beads-portfolio-bridge/beads-bridge-registration.ts";
import type {
  BeadsBridgeRegistration,
  BeadsBridgeRegistrationInput,
  BeadsBridgeWriterClosure,
  BeadsBridgeWriterLease,
} from "../global/bin/beads-portfolio-bridge/beads-bridge-registration.ts";
import { loadBeadsReleaseManifest } from "../global/bin/beads-portfolio-bridge/beads-release.ts";

const thisFile = fileURLToPath(import.meta.url);
const workerMode = process.argv[2]?.startsWith("--bridge-registration-worker-") === true;

function processIdentity(ref = "process:test-parent") {
  return {
    pid: process.pid,
    processRef: ref,
    executableSha256: crypto.createHash("sha256").update(process.execPath.toLowerCase()).digest("hex"),
    startedAt: new Date().toISOString(),
  };
}

function closure(lease: BeadsBridgeWriterLease, status: "terminal" | "write-isolated" | "unknown"): BeadsBridgeWriterClosure {
  return {
    schemaVersion: 1,
    status,
    observedAt: new Date().toISOString(),
    processRef: lease.processRef,
    childProcessRefs: [],
    evidenceRefs: status === "unknown" ? [] : ["evidence:test-process-terminal"],
  };
}

async function workerMain(): Promise<void> {
  const mode = process.argv[2];
  const file = process.argv[3];
  const marker = process.argv[4];
  if (file == null || marker == null) process.exit(90);
  try {
    const registration = loadBeadsBridgeRegistration(file);
    const lease = acquireBeadsBridgeWriterLease(file, registration, "create-feature", processIdentity(`process:worker-${process.pid}`));
    fs.writeFileSync(marker, `${JSON.stringify(lease)}\n`, "utf8");
    if (mode === "--bridge-registration-worker-hold") {
      setInterval(() => {}, 60_000);
      return;
    }
    releaseBeadsBridgeWriterLease(file, registration, lease, closure(lease, "terminal"));
    process.exit(0);
  } catch (error) {
    const code = error instanceof BeadsBridgeRegistrationError ? error.code : "unexpected";
    fs.writeFileSync(marker, `${JSON.stringify({ code })}\n`, "utf8");
    process.exit(code === "writer-liveness-unknown" ? 17 : 91);
  }
}

if (workerMode) {
  await workerMain();
} else {
  type Fixture = {
    root: string;
    project: string;
    protectedRoot: string;
    registrationFile: string;
    input: BeadsBridgeRegistrationInput;
  };

  function fixture(enabled = true): Fixture {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "beads-bridge-registration-test-"));
    const project = path.join(root, "project-a");
    const protectedRoot = path.join(root, "protected");
    fs.mkdirSync(path.join(project, ".git"), { recursive: true });
    fs.mkdirSync(path.join(protectedRoot, "bin"), { recursive: true });
    fs.mkdirSync(path.join(protectedRoot, "adapter"), { recursive: true });
    fs.writeFileSync(path.join(protectedRoot, "bin", "bd.exe"), "binary fixture", "utf8");
    fs.writeFileSync(path.join(protectedRoot, "adapter", "beads-vendor-adapter.mjs"), "adapter fixture", "utf8");
    const manifest = loadBeadsReleaseManifest();
    return {
      root,
      project,
      protectedRoot,
      registrationFile: path.join(protectedRoot, BEADS_BRIDGE_REGISTRATION_FILE),
      input: {
        enabled,
        projectRoot: project,
        ownerClass: "opencode-kit",
        prefix: "BPB",
        binaryPath: path.join(protectedRoot, "bin", "bd.exe"),
        binarySha256: manifest.release.executable.sha256,
        adapterPath: path.join(protectedRoot, "adapter", "beads-vendor-adapter.mjs"),
        adapterSha256: crypto.createHash("sha256").update("adapter fixture").digest("hex"),
        profileSha256: crypto.createHash("sha256").update("core-beads fixture").digest("hex"),
      },
    };
  }

  function installWriterState(item: Fixture, registration: BeadsBridgeRegistration): void {
    fs.mkdirSync(path.join(item.protectedRoot, "beads-bridge", registration.projectRef.slice("project_".length)), { recursive: true });
  }

  function cleanup(item: Fixture): void {
    fs.rmSync(item.root, { recursive: true, force: true });
  }

  function errorCode(run: () => unknown): string {
    let thrown: unknown;
    try {
      run();
    } catch (error) {
      thrown = error;
    }
    assert.ok(thrown instanceof BeadsBridgeRegistrationError);
    return (thrown as BeadsBridgeRegistrationError).code;
  }

  async function waitForFile(file: string, timeoutMs = 5_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (!fs.existsSync(file)) {
      if (Date.now() >= deadline) throw new Error(`Timed out waiting for fixture file ${path.basename(file)}.`);
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }

  test("admits one canonical Git project with exact reviewed identities", () => {
    const item = fixture();
    try {
      const registration = createBeadsBridgeRegistration(item.registrationFile, item.input);
      const raw = JSON.parse(fs.readFileSync(item.registrationFile, "utf8")) as Record<string, unknown>;
      assert.equal(registration.projectRoot, fs.realpathSync.native(item.project));
      assert.match(registration.projectRef, /^project_[a-f0-9]{32}$/u);
      assert.equal(
        registration.projectRef,
        `project_${crypto.createHash("sha256").update(fs.realpathSync.native(item.project)).digest("hex").slice(0, 32)}`,
        "registration must reuse the existing Kaizen v1 canonical project identity",
      );
      assert.equal(registration.projectRef.includes(item.project), false);
      assert.equal(registration.releaseVersion, "1.2.2");
      assert.equal(registration.profileName, "core-beads");
      assert.equal(registration.binarySha256, loadBeadsReleaseManifest().release.executable.sha256);
      assert.match(registration.effectPolicySha256, /^[a-f0-9]{64}$/u);
      assert.deepEqual(createBeadsBridgeRegistration(item.registrationFile, item.input), registration, "same registration is idempotent");
      assert.equal(Object.keys(raw).length, 14, "registration has a closed schema");

      const secondProject = path.join(item.root, "project-b");
      fs.mkdirSync(path.join(secondProject, ".git"), { recursive: true });
      assert.equal(
        errorCode(() => createBeadsBridgeRegistration(item.registrationFile, { ...item.input, projectRoot: secondProject })),
        "registration-conflict",
      );
      assert.deepEqual(loadBeadsBridgeRegistration(item.registrationFile), registration, "conflict must not replace the admitted project");
    } finally {
      cleanup(item);
    }
  });

  test("rejects wrong roots, unsafe managed paths, identity drift, and broadened schema", () => {
    const wrongRoot = fixture();
    const unsafePath = fixture();
    const drift = fixture();
    try {
      const notGit = path.join(wrongRoot.root, "not-git");
      fs.mkdirSync(notGit);
      assert.equal(errorCode(() => createBeadsBridgeRegistration(wrongRoot.registrationFile, { ...wrongRoot.input, projectRoot: notGit })), "registration-invalid");
      assert.equal(
        errorCode(() => createBeadsBridgeRegistration(wrongRoot.registrationFile, { ...wrongRoot.input, ownerClass: "other" as BeadsBridgeRegistrationInput["ownerClass"] })),
        "registration-invalid",
      );
      assert.equal(errorCode(() => createBeadsBridgeRegistration(wrongRoot.registrationFile, { ...wrongRoot.input, prefix: "bad-prefix" })), "registration-invalid");
      assert.equal(
        errorCode(() => createBeadsBridgeRegistration(unsafePath.registrationFile, { ...unsafePath.input, adapterPath: path.join(unsafePath.project, "adapter.mjs") })),
        "registration-invalid",
      );

      createBeadsBridgeRegistration(drift.registrationFile, drift.input);
      const raw = JSON.parse(fs.readFileSync(drift.registrationFile, "utf8")) as Record<string, unknown>;
      fs.writeFileSync(drift.registrationFile, `${JSON.stringify({ ...raw, adapterSha256: "0".repeat(64) }, null, 2)}\n`, "utf8");
      assert.equal(errorCode(() => loadBeadsBridgeRegistration(drift.registrationFile)), "registration-invalid");
      fs.writeFileSync(drift.registrationFile, `${JSON.stringify({ ...raw, binarySha256: "0".repeat(64) }, null, 2)}\n`, "utf8");
      assert.equal(errorCode(() => loadBeadsBridgeRegistration(drift.registrationFile)), "registration-invalid");
      fs.writeFileSync(drift.registrationFile, `${JSON.stringify({ ...raw, extra: true }, null, 2)}\n`, "utf8");
      assert.equal(errorCode(() => loadBeadsBridgeRegistration(drift.registrationFile)), "registration-invalid");
    } finally {
      cleanup(wrongRoot);
      cleanup(unsafePath);
      cleanup(drift);
    }
  });

  test("keeps read queries available while serializing writes and preserving rollback material", () => {
    const item = fixture();
    try {
      const registration = createBeadsBridgeRegistration(item.registrationFile, item.input);
      installWriterState(item, registration);
      const projectBefore = fs.readdirSync(item.project);
      const lease = acquireBeadsBridgeWriterLease(item.registrationFile, registration, "create-feature", processIdentity());
      const lock = path.join(item.protectedRoot, "beads-bridge", registration.projectRef.slice("project_".length), "writer.lock");
      assert.equal(fs.existsSync(lock), true);
      assert.equal(path.relative(path.join(item.project, ".beads"), lock).startsWith(".."), true, "workstation lock must stay outside vendor data");
      const state = inspectBeadsBridgeCoordination(item.registrationFile);
      assert.equal(state.writes, "blocked");
      assert.equal(state.writer, "unknown");
      assert.equal(state.preserveManagedMaterial, true);
      assert.equal(state.reason, "writer-lease-present");
      assert.deepEqual(state.lease, { operation: "create-feature", processRef: lease.processRef, startedAt: lease.startedAt });
      assert.equal(errorCode(() => acquireBeadsBridgeWriterLease(item.registrationFile, registration, "update-feature", processIdentity("process:contender"))), "writer-liveness-unknown");
      assert.equal(errorCode(() => releaseBeadsBridgeWriterLease(item.registrationFile, registration, lease, closure(lease, "unknown"))), "writer-liveness-unknown");
      assert.equal(inspectBeadsBridgeCoordination(item.registrationFile).preserveManagedMaterial, true);

      const archive = releaseBeadsBridgeWriterLease(item.registrationFile, registration, lease, closure(lease, "terminal"));
      assert.match(archive, /^beads-bridge\/[a-f0-9]{32}\/leases\/terminal-[a-f0-9]{16}\.json$/u);
      assert.equal(inspectBeadsBridgeCoordination(item.registrationFile).writer, "clear");
      assert.deepEqual(fs.readdirSync(item.project), projectBefore, "coordination state must not write the source project");
    } finally {
      cleanup(item);
    }
  });

  test("preserves a drifted writer lease as an unknown repair gate", () => {
    const item = fixture();
    try {
      const registration = createBeadsBridgeRegistration(item.registrationFile, item.input);
      installWriterState(item, registration);
      const lease = acquireBeadsBridgeWriterLease(item.registrationFile, registration, "create-feature", processIdentity());
      const lock = path.join(item.protectedRoot, "beads-bridge", registration.projectRef.slice("project_".length), "writer.lock");
      fs.writeFileSync(lock, `${JSON.stringify({ ...lease, adapterSha256: "0".repeat(64) }, null, 2)}\n`, "utf8");
      assert.deepEqual(inspectBeadsBridgeCoordination(item.registrationFile), {
        schemaVersion: 1,
        projectRef: registration.projectRef,
        registrationSha256: inspectBeadsBridgeCoordination(item.registrationFile).registrationSha256,
        writes: "blocked",
        writer: "unknown",
        preserveManagedMaterial: true,
        reason: "writer-lease-unsafe",
        lease: null,
      });
      assert.equal(errorCode(() => releaseBeadsBridgeWriterLease(item.registrationFile, registration, { ...lease, adapterSha256: "0".repeat(64) }, closure(lease, "terminal"))), "lease-drift");
      assert.equal(fs.existsSync(lock), true, "drifted lock must remain for explicit repair");
      fs.writeFileSync(lock, `${JSON.stringify(lease, null, 2)}\n`, "utf8");
      releaseBeadsBridgeWriterLease(item.registrationFile, registration, lease, closure(lease, "terminal"));
    } finally {
      cleanup(item);
    }
  });

  test("serializes two disposable adapter processes for one project", () => {
    const item = fixture();
    try {
      const registration = createBeadsBridgeRegistration(item.registrationFile, item.input);
      installWriterState(item, registration);
      const lease = acquireBeadsBridgeWriterLease(item.registrationFile, registration, "create-feature", processIdentity());
      const blockedMarker = path.join(item.root, "blocked.json");
      const blocked = spawnSync(process.execPath, [thisFile, "--bridge-registration-worker-once", item.registrationFile, blockedMarker], { encoding: "utf8" });
      assert.equal(blocked.status, 17, blocked.stderr);
      assert.deepEqual(JSON.parse(fs.readFileSync(blockedMarker, "utf8")), { code: "writer-liveness-unknown" });
      releaseBeadsBridgeWriterLease(item.registrationFile, registration, lease, closure(lease, "terminal"));

      const admittedMarker = path.join(item.root, "admitted.json");
      const admitted = spawnSync(process.execPath, [thisFile, "--bridge-registration-worker-once", item.registrationFile, admittedMarker], { encoding: "utf8" });
      assert.equal(admitted.status, 0, admitted.stderr);
      assert.match((JSON.parse(fs.readFileSync(admittedMarker, "utf8")) as BeadsBridgeWriterLease).token, /^[a-f0-9-]{36}$/u);
      assert.equal(inspectBeadsBridgeCoordination(item.registrationFile).writer, "clear");
    } finally {
      cleanup(item);
    }
  });

  test("does not infer stale takeover after a live writer is terminated", async () => {
    const item = fixture();
    let child: ReturnType<typeof spawn> | null = null;
    try {
      const registration = createBeadsBridgeRegistration(item.registrationFile, item.input);
      installWriterState(item, registration);
      const marker = path.join(item.root, "held-lease.json");
      child = spawn(process.execPath, [thisFile, "--bridge-registration-worker-hold", item.registrationFile, marker], { stdio: "ignore" });
      await waitForFile(marker);
      const lease = JSON.parse(fs.readFileSync(marker, "utf8")) as BeadsBridgeWriterLease;
      assert.equal(inspectBeadsBridgeCoordination(item.registrationFile).writer, "unknown");
      assert.equal(errorCode(() => releaseBeadsBridgeWriterLease(item.registrationFile, registration, lease, closure(lease, "unknown"))), "writer-liveness-unknown");
      assert.equal(child.kill(), true);
      await new Promise<void>((resolve) => child?.once("exit", () => resolve()));
      child = null;

      assert.equal(inspectBeadsBridgeCoordination(item.registrationFile).writer, "unknown", "process exit alone must not steal the lease");
      assert.equal(
        errorCode(() => acquireBeadsBridgeWriterLease(item.registrationFile, registration, "close-feature", processIdentity("process:after-exit"))),
        "writer-liveness-unknown",
      );
      releaseBeadsBridgeWriterLease(item.registrationFile, registration, lease, {
        ...closure(lease, "terminal"),
        childProcessRefs: [lease.processRef],
        evidenceRefs: ["evidence:test-owned-child-exit"],
      });
      assert.equal(inspectBeadsBridgeCoordination(item.registrationFile).writer, "clear");
    } finally {
      if (child != null) {
        child.kill();
        await new Promise<void>((resolve) => child?.once("exit", () => resolve()));
      }
      cleanup(item);
    }
  });

  test("keeps disabled registration readable while refusing project-local writes", () => {
    const item = fixture(false);
    try {
      const registration = createBeadsBridgeRegistration(item.registrationFile, item.input);
      const bridgeState = path.join(item.protectedRoot, "beads-bridge");
      assert.equal(fs.existsSync(bridgeState), false);
      assert.deepEqual(inspectBeadsBridgeCoordination(item.registrationFile), {
        schemaVersion: 1,
        projectRef: registration.projectRef,
        registrationSha256: inspectBeadsBridgeCoordination(item.registrationFile).registrationSha256,
        writes: "blocked",
        writer: "clear",
        preserveManagedMaterial: false,
        reason: "registration-disabled",
        lease: null,
      });
      assert.equal(fs.existsSync(bridgeState), false, "read-only coordination inspection must create no state");
      assert.equal(errorCode(() => acquireBeadsBridgeWriterLease(item.registrationFile, registration, "create-feature", processIdentity())), "registration-state");
      installWriterState(item, registration);
      const enableLease = acquireBeadsBridgeWriterLease(item.registrationFile, registration, "project-enable", processIdentity("process:enable"));
      const enabled = setBeadsBridgeRegistrationEnabled(item.registrationFile, registration, enableLease, true);
      assert.equal(enabled.enabled, true);
      assert.equal(inspectBeadsBridgeCoordination(item.registrationFile).writes, "blocked", "lease remains authoritative across registration transition");
      releaseBeadsBridgeWriterLease(item.registrationFile, enabled, enableLease, closure(enableLease, "write-isolated"));
      const disableLease = acquireBeadsBridgeWriterLease(item.registrationFile, enabled, "project-disable", processIdentity("process:disable"));
      const disabled = setBeadsBridgeRegistrationEnabled(item.registrationFile, enabled, disableLease, false);
      releaseBeadsBridgeWriterLease(item.registrationFile, disabled, disableLease, closure(disableLease, "terminal"));
      assert.equal(inspectBeadsBridgeCoordination(item.registrationFile).reason, "registration-disabled");
    } finally {
      cleanup(item);
    }
  });

  test("fails closed instead of creating missing workstation writer storage", () => {
    const item = fixture();
    try {
      const registration = createBeadsBridgeRegistration(item.registrationFile, item.input);
      const bridgeState = path.join(item.protectedRoot, "beads-bridge");
      assert.equal(errorCode(() => acquireBeadsBridgeWriterLease(item.registrationFile, registration, "create-feature", processIdentity())), "writer-liveness-unknown");
      assert.deepEqual(inspectBeadsBridgeCoordination(item.registrationFile), {
        schemaVersion: 1,
        projectRef: registration.projectRef,
        registrationSha256: inspectBeadsBridgeCoordination(item.registrationFile).registrationSha256,
        writes: "blocked",
        writer: "unknown",
        preserveManagedMaterial: true,
        reason: "writer-lease-unsafe",
        lease: null,
      });
      assert.equal(fs.existsSync(bridgeState), false, "lease acquisition must not instantiate workstation-owned storage");
    } finally {
      cleanup(item);
    }
  });
}
