#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import {
  captureKaizenSignal,
  readKaizenInbox,
  readKaizenSignal,
  recordKaizenDecision,
  resolveKaizenStore,
  transitionKaizenSignal,
} from "../global/plugin/kaizen/store.ts";
import type { KaizenDecisionKind, KaizenOwnerClass, KaizenStore } from "../global/plugin/kaizen/store.ts";
import { runPortableCommand } from "../global/bin/portable-process.ts";
import { BEADS_BRIDGE_REGISTRATION_FILE, createBeadsBridgeRegistration, loadBeadsBridgeRegistration } from "./windows/beads-bridge-registration.ts";
import { BeadsKaizenPromotionError, promoteKaizenSignalToBeads } from "./windows/beads-kaizen-orchestrator.ts";
import type { BeadsKaizenPromotionDependencies } from "./windows/beads-kaizen-orchestrator.ts";
import { loadBeadsReleaseManifest } from "./windows/beads-release.ts";

type Fixture = {
  root: string;
  project: string;
  consumer: string;
  data: string;
  registrationFile: string;
  store: KaizenStore;
  dependencies: BeadsKaizenPromotionDependencies;
  issuesFile: string;
  argvLog: string;
};

function git(root: string, args: string[]): void {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr);
}

function fileSha256(file: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function fixture(ownerClass: "current-project" | "opencode-kit" = "current-project", signalFromConsumer = false): Fixture {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "beads-kaizen-orchestrator-test-"));
  const project = path.join(root, "project");
  const consumer = path.join(root, "consumer");
  const protectedRoot = path.join(root, "protected");
  const data = path.join(root, "data");
  for (const selected of [project, consumer]) {
    fs.mkdirSync(selected, { recursive: true });
    git(selected, ["init", "--quiet"]);
  }
  fs.mkdirSync(path.join(project, ".beads"));
  fs.mkdirSync(path.join(protectedRoot, "bin"), { recursive: true });
  fs.mkdirSync(path.join(protectedRoot, "adapter"), { recursive: true });
  const binary = path.join(protectedRoot, "bin", "bd.exe");
  const adapter = path.join(protectedRoot, "adapter", "beads-vendor-adapter.mjs");
  const fake = path.join(root, "fake-bd.mjs");
  const issuesFile = path.join(project, ".beads", "issues.json");
  const argvLog = path.join(root, "argv.jsonl");
  fs.writeFileSync(binary, "binary fixture", "utf8");
  fs.writeFileSync(adapter, "adapter fixture", "utf8");
  fs.writeFileSync(issuesFile, "[]\n", "utf8");
  fs.writeFileSync(fake, `
import fs from "node:fs";
const argv = process.argv.slice(2);
fs.appendFileSync(process.env.FAKE_ARGV_LOG, JSON.stringify(argv) + "\\n");
const read = () => JSON.parse(fs.readFileSync(process.env.FAKE_ISSUES, "utf8"));
const write = (rows) => fs.writeFileSync(process.env.FAKE_ISSUES, JSON.stringify(rows, null, 2) + "\\n");
const at = (name) => argv[argv.indexOf(name) + 1];
if (argv.includes("list")) {
  const filters = argv.flatMap((value, index) => value === "--metadata-field" ? [argv[index + 1]] : []).map((row) => row.split("="));
  const rows = read().filter((item) => filters.every(([key, value]) => String(item.metadata[key]) === value));
  process.stdout.write(JSON.stringify(rows) + "\\n");
} else if (argv.includes("create")) {
  const rows = read();
  const metadata = JSON.parse(at("--metadata"));
  const issue = {
    id: "BPB-" + String(rows.length + 1).padStart(3, "0"),
    title: at("--title"),
    description: "",
    status: "open",
    priority: 2,
    issue_type: "feature",
    assignee: "",
    external_ref: at("--external-ref"),
    spec_id: "",
    metadata,
    dependency_count: 0,
    dependent_count: 0,
    dependencies: []
  };
  rows.push(issue);
  write(rows);
  process.stdout.write(JSON.stringify(issue) + "\\n");
} else {
  process.stderr.write("unsupported fixture command\\n");
  process.exit(2);
}
`, "utf8");
  const manifest = loadBeadsReleaseManifest();
  const registrationFile = path.join(protectedRoot, BEADS_BRIDGE_REGISTRATION_FILE);
  createBeadsBridgeRegistration(registrationFile, {
    enabled: true,
    projectRoot: project,
    ownerClass,
    prefix: "BPB",
    binaryPath: binary,
    binarySha256: manifest.release.executable.sha256,
    adapterPath: adapter,
    adapterSha256: fileSha256(adapter),
    profileSha256: crypto.createHash("sha256").update("core-beads fixture").digest("hex"),
  });
  const store = resolveKaizenStore({ worktree: signalFromConsumer ? consumer : project, environment: { OPENCODE_DATA_DIR: data } });
  assert.ok(store);
  const dependencies: BeadsKaizenPromotionDependencies = {
    adapter: {
      inspectExecutable: () => ({ bytes: manifest.release.executable.bytes, sha256: manifest.release.executable.sha256 }),
      runCommand: (cwd, argv, options) => runPortableCommand(cwd, [process.execPath, fake, ...argv.slice(1)], {
        ...options,
        env: { ...options.env, FAKE_ARGV_LOG: argvLog, FAKE_ISSUES: issuesFile },
      }),
    },
  };
  return { root, project, consumer, data, registrationFile, store, dependencies, issuesFile, argvLog };
}

function cleanup(item: Fixture): void {
  fs.rmSync(item.root, { recursive: true, force: true });
}

function context(ref: string) {
  return { sourceEventRef: ref, sessionRef: `session_${crypto.createHash("sha256").update(ref).digest("hex").slice(0, 32)}` };
}

function processIdentity(ref: string) {
  return {
    pid: process.pid,
    processRef: ref,
    executableSha256: crypto.createHash("sha256").update(process.execPath.toLowerCase()).digest("hex"),
    startedAt: new Date().toISOString(),
  };
}

async function candidate(
  item: Fixture,
  decision: KaizenDecisionKind,
  ownerClass: KaizenOwnerClass,
  summary = `Promote bounded work from ${item.project}`,
) {
  const captured = await captureKaizenSignal(item.store, {
    kind: "process-gap",
    summary,
    observedEvidence: "A bounded project change is ready for portfolio coordination.",
    impact: "The accepted project work remains undiscoverable without one portfolio item.",
    likelyCause: "No current Beads correlation exists.",
    doNotRepeat: "Do not create a second uncorrelated portfolio item.",
    scopeHint: ownerClass === "opencode-kit" ? "opencode-kit" : "current-project",
    evidenceRefs: ["tools/test-beads-kaizen-orchestrator.ts"],
  }, "explicit", context(`capture:${crypto.randomUUID()}`));
  const selected = await recordKaizenDecision(item.store, {
    signalRef: captured.signalRef,
    decision,
    evidenceRefs: ["tools/test-beads-kaizen-orchestrator.ts"],
    ownerClass,
    nextBoundaryOrTerminalReason: "Create one exact Beads feature after eligibility and readback.",
  }, context(`decision:${crypto.randomUUID()}`));
  await transitionKaizenSignal(item.store, { signalRef: captured.signalRef, status: "triaged", note: "Evidence triage complete." });
  return { signalRef: captured.signalRef, decisionRef: selected.decisionRef };
}

function issues(item: Fixture): Array<Record<string, unknown>> {
  return JSON.parse(fs.readFileSync(item.issuesFile, "utf8")) as Array<Record<string, unknown>>;
}

function promotionErrorCode(error: unknown): boolean {
  return error instanceof BeadsKaizenPromotionError;
}

test("promotes one current-project signal and appends only one transition", async () => {
  const item = fixture();
  try {
    const selected = await candidate(item, "project-change", "current-project");
    const before = await readKaizenInbox(item.store);
    const promoted = await promoteKaizenSignalToBeads(item.store, {
      registrationFile: item.registrationFile,
      ...selected,
      processIdentity: processIdentity("process:project-promotion"),
    }, item.dependencies);
    assert.equal(promoted.status, "promoted");
    assert.equal(promoted.created, true);
    assert.equal(promoted.kaizenTransitionAppended, true);
    assert.equal(issues(item).length, 1);
    assert.equal((await readKaizenSignal(item.store, selected.signalRef)).status, "promoted");
    const after = await readKaizenInbox(item.store);
    assert.equal(after.counts.lifecycleEvents, before.counts.lifecycleEvents + 1);
    const repeated = await promoteKaizenSignalToBeads(item.store, {
      registrationFile: item.registrationFile,
      ...selected,
      processIdentity: processIdentity("process:project-promotion-replay"),
    }, item.dependencies);
    assert.equal(repeated.status, "already-promoted");
    assert.equal(repeated.created, false);
    assert.equal(repeated.kaizenTransitionAppended, false);
    assert.equal(issues(item).length, 1);
    assert.equal((await readKaizenInbox(item.store)).counts.lifecycleEvents, after.counts.lifecycleEvents);
    const argv = fs.readFileSync(item.argvLog, "utf8");
    assert.equal(argv.includes(item.project), false);
    assert.equal(argv.includes("observedEvidence"), false);
  } finally {
    cleanup(item);
  }
});

test("recovers one post-create interruption without duplicate feature", async () => {
  const item = fixture();
  try {
    const selected = await candidate(item, "project-change", "current-project");
    await assert.rejects(promoteKaizenSignalToBeads(item.store, {
      registrationFile: item.registrationFile,
      ...selected,
      processIdentity: processIdentity("process:create-interrupted"),
    }, { ...item.dependencies, afterCreate: () => { throw new Error("injected response loss"); } }), promotionErrorCode);
    assert.equal(issues(item).length, 1);
    assert.equal((await readKaizenSignal(item.store, selected.signalRef)).status, "triaged");
    const resumed = await promoteKaizenSignalToBeads(item.store, {
      registrationFile: item.registrationFile,
      ...selected,
      processIdentity: processIdentity("process:create-resume"),
    }, item.dependencies);
    assert.equal(resumed.created, false);
    assert.equal(resumed.kaizenTransitionAppended, true);
    assert.equal(issues(item).length, 1);
  } finally {
    cleanup(item);
  }
});

test("routes kit-candidate by semantic kit owner rather than triage project", async () => {
  const item = fixture("opencode-kit", true);
  try {
    const selected = await candidate(item, "kit-candidate", "opencode-kit");
    assert.notEqual(item.store.projectRef, loadBeadsBridgeRegistration(item.registrationFile).projectRef);
    const promoted = await promoteKaizenSignalToBeads(item.store, {
      registrationFile: item.registrationFile,
      ...selected,
      processIdentity: processIdentity("process:kit-promotion"),
    }, item.dependencies);
    assert.equal(promoted.status, "promoted");
    assert.equal(promoted.projectRef, loadBeadsBridgeRegistration(item.registrationFile).projectRef);
    assert.equal(issues(item).length, 1);
  } finally {
    cleanup(item);
  }
});

test("rejects zero-owner, wrong-project, wrong-owner, and unsafe title before Beads create", async () => {
  const wrongProject = fixture();
  const wrongOwner = fixture("current-project", true);
  const noOwner = fixture();
  const unsafe = fixture();
  try {
    const wrongProjectDecision = await candidate(wrongProject, "project-change", "current-project");
    const different = resolveKaizenStore({ worktree: wrongProject.consumer, environment: { OPENCODE_DATA_DIR: wrongProject.data } });
    assert.ok(different);
    const differentCapture = await captureKaizenSignal(different, {
      kind: "process-gap",
      summary: "Consumer-only project change",
      observedEvidence: "The origin differs.",
      impact: "Wrong routing would cross project ownership.",
      likelyCause: "Origin mismatch.",
      doNotRepeat: "Do not substitute triage identity.",
      scopeHint: "current-project",
      evidenceRefs: ["tools/test-beads-kaizen-orchestrator.ts"],
    }, "explicit", context("capture:different-project"));
    assert.notEqual(differentCapture.signalRef, wrongProjectDecision.signalRef);
    const differentDecision = await recordKaizenDecision(different, {
      signalRef: differentCapture.signalRef,
      decision: "project-change",
      evidenceRefs: ["tools/test-beads-kaizen-orchestrator.ts"],
      ownerClass: "current-project",
      nextBoundaryOrTerminalReason: "Must stay in the consumer project.",
    }, context("decision:different-project"));
    await transitionKaizenSignal(different, { signalRef: differentCapture.signalRef, status: "triaged" });
    await assert.rejects(promoteKaizenSignalToBeads(different, {
      registrationFile: wrongProject.registrationFile,
      signalRef: differentCapture.signalRef,
      decisionRef: differentDecision.decisionRef,
      processIdentity: processIdentity("process:wrong-project"),
    }, wrongProject.dependencies), (error: unknown) => error instanceof BeadsKaizenPromotionError && error.code === "wrong-project");

    const wrongOwnerDecision = await candidate(wrongOwner, "kit-candidate", "opencode-kit");
    await assert.rejects(promoteKaizenSignalToBeads(wrongOwner.store, {
      registrationFile: wrongOwner.registrationFile,
      ...wrongOwnerDecision,
      processIdentity: processIdentity("process:wrong-owner"),
    }, wrongOwner.dependencies), (error: unknown) => error instanceof BeadsKaizenPromotionError && error.code === "wrong-owner");

    const captured = await captureKaizenSignal(noOwner.store, {
      kind: "process-gap",
      summary: "No owner decision",
      observedEvidence: "No triage decision exists.",
      impact: "Promotion would be unauthorized.",
      likelyCause: "Missing owner.",
      doNotRepeat: "Do not promote without owner triage.",
      scopeHint: "current-project",
      evidenceRefs: ["tools/test-beads-kaizen-orchestrator.ts"],
    }, "explicit", context("capture:no-owner"));
    await transitionKaizenSignal(noOwner.store, { signalRef: captured.signalRef, status: "triaged" });
    await assert.rejects(promoteKaizenSignalToBeads(noOwner.store, {
      registrationFile: noOwner.registrationFile,
      signalRef: captured.signalRef,
      decisionRef: `decision_${"0".repeat(32)}`,
      processIdentity: processIdentity("process:no-owner"),
    }, noOwner.dependencies), (error: unknown) => error instanceof BeadsKaizenPromotionError && error.code === "zero-owner");

    const unsafeDecision = await candidate(unsafe, "project-change", "current-project", "x".repeat(201));
    await assert.rejects(promoteKaizenSignalToBeads(unsafe.store, {
      registrationFile: unsafe.registrationFile,
      ...unsafeDecision,
      processIdentity: processIdentity("process:unsafe-title"),
    }, unsafe.dependencies), (error: unknown) => error instanceof BeadsKaizenPromotionError && error.code === "unsafe-payload");
    for (const current of [wrongProject, wrongOwner, noOwner, unsafe]) assert.equal(issues(current).length, 0);
  } finally {
    for (const current of [wrongProject, wrongOwner, noOwner, unsafe]) cleanup(current);
  }
});

test("treats multiple exact correlations as a repair gate", async () => {
  const item = fixture();
  try {
    const selected = await candidate(item, "project-change", "current-project");
    const signal = await readKaizenSignal(item.store, selected.signalRef);
    const registration = loadBeadsBridgeRegistration(item.registrationFile);
    const metadata = { bridgeSchemaVersion: 1, kaizenSignalRef: signal.signalRef, decisionRef: selected.decisionRef, projectRef: registration.projectRef, ownerClass: "current-project" };
    fs.writeFileSync(item.issuesFile, `${JSON.stringify([1, 2].map((index) => ({
      id: `BPB-00${index}`,
      title: signal.summary,
      description: "",
      status: "open",
      priority: 2,
      issue_type: "feature",
      assignee: "",
      external_ref: signal.signalRef,
      spec_id: "",
      metadata,
      dependency_count: 0,
      dependent_count: 0,
      dependencies: [],
    })), null, 2)}\n`, "utf8");
    await assert.rejects(promoteKaizenSignalToBeads(item.store, {
      registrationFile: item.registrationFile,
      ...selected,
      processIdentity: processIdentity("process:duplicates"),
    }, item.dependencies), (error: unknown) => error instanceof BeadsKaizenPromotionError && error.code === "duplicate-correlation");
    assert.equal(issues(item).length, 2);
    assert.equal((await readKaizenSignal(item.store, selected.signalRef)).status, "triaged");
  } finally {
    cleanup(item);
  }
});
