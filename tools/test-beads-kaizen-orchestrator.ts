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
  captureKaizenSignal,
  readKaizenInbox,
  readKaizenSignal,
  recordKaizenDecision,
  resolveKaizenStore,
  transitionKaizenSignal,
} from "../global/plugin/kaizen/store.ts";
import type { KaizenDecisionKind, KaizenOwnerClass, KaizenStore } from "../global/plugin/kaizen/store.ts";
import { runPortableCommand } from "../global/bin/portable-process.ts";
import { BEADS_BRIDGE_REGISTRATION_FILE, createBeadsBridgeRegistration, inspectBeadsBridgeCoordination, loadBeadsBridgeRegistration } from "../global/bin/beads-portfolio-bridge/beads-bridge-registration.ts";
import { runBeadsProjectLifecycle } from "../global/bin/beads-portfolio-bridge/beads-project-lifecycle.ts";
import type { BeadsProjectLifecycleDependencies } from "../global/bin/beads-portfolio-bridge/beads-project-lifecycle.ts";
import {
  assignBeadsPortfolioFeature,
  BeadsKaizenPromotionError,
  linkBeadsPortfolioFeatureToOpenSpec,
  projectBeadsPortfolioRelation,
  promoteKaizenSignalToBeads,
  readReadyBeadsPortfolio,
  reconcileBeadsPortfolioTerminal,
  showBeadsPortfolioFeature,
} from "../global/bin/beads-portfolio-bridge/beads-kaizen-orchestrator.ts";
import type { BeadsKaizenPromotionDependencies } from "../global/bin/beads-portfolio-bridge/beads-kaizen-orchestrator.ts";
import { loadBeadsReleaseManifest } from "../global/bin/beads-portfolio-bridge/beads-release.ts";
import { runBeadsAdapter } from "../global/bin/beads-portfolio-bridge/beads-vendor-adapter.ts";
import type { BeadsAdapterDependencies } from "../global/bin/beads-portfolio-bridge/beads-vendor-adapter.ts";
import { loadBeadsPortfolioBridgePack } from "./proofs/consumer-outcome/beads-portfolio-bridge.ts";

const BPB_POPULATION = loadBeadsPortfolioBridgePack(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")).pack;

type Fixture = {
  root: string;
  project: string;
  consumer: string;
  data: string;
  registrationFile: string;
  store: KaizenStore;
  dependencies: BeadsKaizenPromotionDependencies;
  lifecycleDependencies: BeadsProjectLifecycleDependencies;
  issuesFile: string;
  argvLog: string;
  external: string;
};

function git(root: string, args: string[]): void {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr);
}

function gitStatus(root: string): string {
  const result = spawnSync("git", ["status", "--short"], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout;
}

function fileSha256(file: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function directoryIdentity(directory: string): string {
  const rows = fs.existsSync(directory)
    ? fs.readdirSync(directory, { withFileTypes: true }).map((entry) => ({ name: entry.name, directory: entry.isDirectory() })).sort((left, right) => left.name.localeCompare(right.name))
    : [];
  return crypto.createHash("sha256").update(JSON.stringify(rows)).digest("hex");
}

function fixture(ownerClass: "current-project" | "opencode-kit" = "current-project", signalFromConsumer = false, lifecycle = false): Fixture {
  const manifest = loadBeadsReleaseManifest();
  const requiredIgnore = manifest.initialization.requiredTrackedFiles[0]?.content;
  if (requiredIgnore == null) throw new Error("Current Beads manifest must declare the tracked ignore prerequisite.");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "beads-kaizen-orchestrator-test-"));
  const project = path.join(root, "project");
  const consumer = path.join(root, "consumer");
  const protectedRoot = path.join(root, "protected");
  const data = path.join(root, "data");
  const external = path.join(root, "external");
  for (const selected of [project, consumer]) {
    fs.mkdirSync(selected, { recursive: true });
    git(selected, ["init", "--quiet"]);
  }
  fs.mkdirSync(external);
  if (lifecycle) {
    git(project, ["config", "user.name", "Fixture"]);
    git(project, ["config", "user.email", "fixture@example.invalid"]);
    fs.writeFileSync(path.join(project, ".gitignore"), `fixture-only\n${requiredIgnore}`, "utf8");
    git(project, ["add", ".gitignore"]);
    git(project, ["commit", "--quiet", "-m", "fixture"]);
    fs.appendFileSync(path.join(project, ".git", "info", "exclude"), "openspec/\n", "utf8");
  } else {
    fs.mkdirSync(path.join(project, ".beads"));
  }
  fs.mkdirSync(path.join(protectedRoot, "bin"), { recursive: true });
  fs.mkdirSync(path.join(protectedRoot, "adapter"), { recursive: true });
  const binary = path.join(protectedRoot, "bin", "bd.exe");
  const adapter = path.join(protectedRoot, "adapter", "beads-vendor-adapter.mjs");
  const fake = path.join(root, "fake-bd.mjs");
  const issuesFile = path.join(project, ".beads", "issues.json");
  const argvLog = path.join(root, "argv.jsonl");
  fs.writeFileSync(binary, "binary fixture", "utf8");
  fs.writeFileSync(adapter, "adapter fixture", "utf8");
  if (!lifecycle) fs.writeFileSync(issuesFile, "[]\n", "utf8");
  fs.writeFileSync(fake, `
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
const argv = process.argv.slice(2);
fs.appendFileSync(process.env.FAKE_ARGV_LOG, JSON.stringify(argv) + "\\n");
const read = () => JSON.parse(fs.readFileSync(process.env.FAKE_ISSUES, "utf8"));
const write = (rows) => fs.writeFileSync(process.env.FAKE_ISSUES, JSON.stringify(rows, null, 2) + "\\n");
const at = (name) => argv[argv.indexOf(name) + 1];
const git = (...args) => {
  const result = spawnSync("git", args, { cwd: process.cwd(), encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr);
};
const metadataFilters = () => argv.flatMap((value, index) => value === "--metadata-field" ? [argv[index + 1]] : []).map((row) => row.split("="));
const matchesMetadata = (item) => metadataFilters().every(([key, value]) => String(item.metadata[key]) === value);
if (argv.includes("init")) {
  fs.mkdirSync(path.join(process.cwd(), ".beads"));
  write([]);
  git("config", "--local", "beads.role", "maintainer");
  fs.appendFileSync(path.join(process.cwd(), ".git", "info", "exclude"), ".beads/\\n");
  process.stdout.write("{}\\n");
} else if (argv.includes("where")) {
  process.stdout.write(JSON.stringify({ path: process.env.BEADS_DIR, prefix: "BPB" }) + "\\n");
} else if (argv.includes("status")) {
  const rows = read();
  const count = (status) => rows.filter((item) => item.status === status).length;
  process.stdout.write(JSON.stringify({ summary: {
    total_issues: rows.length, open_issues: count("open"), in_progress_issues: count("in_progress"),
    blocked_issues: count("blocked"), deferred_issues: count("deferred"), closed_issues: count("closed"),
    ready_issues: rows.filter((item) => item.status === "open" && item.dependencies.every((edge) => edge.dependency_type !== "blocks" || edge.status === "closed")).length
  } }) + "\\n");
} else if (argv.includes("list")) {
  const rows = read().filter(matchesMetadata);
  process.stdout.write(JSON.stringify(rows) + "\\n");
} else if (argv.includes("ready")) {
  const all = read();
  const rows = all.filter((item) => item.status === "open" && matchesMetadata(item) && item.dependencies.every((edge) => edge.dependency_type !== "blocks" || edge.status === "closed"));
  process.stdout.write(JSON.stringify(rows.map((item) => ({
    ...item,
    dependencies: item.dependencies.map((edge) => ({ issue_id: item.id, depends_on_id: edge.id, type: edge.dependency_type })),
  }))) + "\\n");
} else if (argv.includes("show")) {
  const id = argv.find((value) => value.startsWith("--id="))?.slice(5);
  process.stdout.write(JSON.stringify(read().filter((item) => item.id === id)) + "\\n");
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
} else if (argv.includes("dep") && argv.includes("add")) {
  const rows = read();
  const addIndex = argv.indexOf("add");
  const issue = rows.find((item) => item.id === argv[addIndex + 1]);
  const dependency = rows.find((item) => item.id === argv[addIndex + 2]);
  const relationType = at("--type");
  if (issue == null || dependency == null) process.exit(3);
  issue.dependencies.push({ id: dependency.id, status: dependency.status, issue_type: dependency.issue_type, dependency_type: relationType });
  issue.dependency_count = issue.dependencies.length;
  dependency.dependent_count += 1;
  write(rows);
  process.stdout.write(JSON.stringify({ issue_id: issue.id, depends_on_id: dependency.id, type: relationType, status: "added", schema_version: 1 }) + "\\n");
} else if (argv.includes("update")) {
  const rows = read();
  const issue = rows.find((item) => item.id === argv[argv.indexOf("update") + 1]);
  if (issue == null) process.exit(3);
  if (argv.includes("--assignee")) issue.assignee = at("--assignee");
  if (argv.includes("--spec-id")) issue.spec_id = at("--spec-id");
  argv.forEach((value, index) => {
    if (value !== "--set-metadata") return;
    const [key, ...parts] = argv[index + 1].split("=");
    issue.metadata[key] = parts.join("=");
  });
  write(rows);
  process.stdout.write(JSON.stringify([issue]) + "\\n");
} else if (argv.includes("close")) {
  const rows = read();
  const issue = rows.find((item) => item.id === argv[argv.indexOf("close") + 1]);
  if (issue == null) process.exit(3);
  issue.status = "closed";
  issue.close_reason = at("--reason");
  for (const row of rows) for (const edge of row.dependencies) if (edge.id === issue.id) edge.status = "closed";
  write(rows);
  process.stdout.write(JSON.stringify([issue]) + "\\n");
} else {
  process.stderr.write("unsupported fixture command\\n");
  process.exit(2);
}
`, "utf8");
  const registrationFile = path.join(protectedRoot, BEADS_BRIDGE_REGISTRATION_FILE);
  const registration = createBeadsBridgeRegistration(registrationFile, {
    enabled: !lifecycle,
    projectRoot: project,
    ownerClass,
    prefix: BPB_POPULATION.repository.prefix,
    binaryPath: binary,
    binarySha256: manifest.release.executable.sha256,
    adapterPath: adapter,
    adapterSha256: fileSha256(adapter),
    profileSha256: crypto.createHash("sha256").update("core-beads fixture").digest("hex"),
  });
  fs.mkdirSync(path.join(protectedRoot, "beads-bridge", registration.projectRef.slice("project_".length)), { recursive: true });
  const resolvedStore = resolveKaizenStore({ worktree: signalFromConsumer ? consumer : project, environment: { OPENCODE_DATA_DIR: data } });
  if (resolvedStore == null) throw new Error("Kaizen store fixture did not resolve.");
  const store = resolvedStore;
  const actualFileIdentity = (file: string) => {
    const content = fs.readFileSync(file);
    return { bytes: content.length, sha256: crypto.createHash("sha256").update(content).digest("hex") };
  };
  const lifecycleFileIdentity = (file: string) => {
    if (path.resolve(file) === path.resolve(binary)) return { bytes: manifest.release.executable.bytes, sha256: manifest.release.executable.sha256 };
    return actualFileIdentity(file);
  };
  const adapterDependencies: BeadsAdapterDependencies = {
    inspectExecutable: () => ({ bytes: manifest.release.executable.bytes, sha256: manifest.release.executable.sha256 }),
    runCommand: (cwd, argv, options) => runPortableCommand(cwd, [process.execPath, fake, ...argv.slice(1)], {
      ...options,
      env: { ...options.env, FAKE_ARGV_LOG: argvLog, FAKE_ISSUES: issuesFile },
    }),
  };
  const dependencies: BeadsKaizenPromotionDependencies = {
    adapter: adapterDependencies,
  };
  const lifecycleDependencies: BeadsProjectLifecycleDependencies = {
    adapter: adapterDependencies,
    fileIdentity: lifecycleFileIdentity,
    captureExternalBoundary: () => directoryIdentity(external),
  };
  return { root, project, consumer, data, registrationFile, store, dependencies, lifecycleDependencies, issuesFile, argvLog, external };
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
    kind: BPB_POPULATION.kaizen.signalKind as "process-gap",
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

async function promotedFeature(item: Fixture, summary: string, processRef: string) {
  const selected = await candidate(
    item,
    BPB_POPULATION.kaizen.decision as "project-change",
    BPB_POPULATION.kaizen.ownerClass as "current-project",
    summary,
  );
  const promoted = await promoteKaizenSignalToBeads(item.store, {
    registrationFile: item.registrationFile,
    ...selected,
    processIdentity: processIdentity(processRef),
  }, item.dependencies);
  return { ...selected, beadsId: promoted.beadsId };
}

function writeOpenSpecChange(item: Fixture, changeRef: string): Record<string, string> {
  const root = path.join(item.project, "openspec", "changes", changeRef);
  fs.mkdirSync(root, { recursive: true });
  const files = {
    "proposal.md": `# ${changeRef}\n`,
    "tasks.md": "# Tasks\n\n- [ ] 1.1 Complete fixture behavior.\n",
  };
  for (const [relative, contents] of Object.entries(files)) fs.writeFileSync(path.join(root, relative), contents, "utf8");
  return files;
}

function readOpenSpecChange(item: Fixture, changeRef: string, files: Record<string, string>): Record<string, string> {
  const root = path.join(item.project, "openspec", "changes", changeRef);
  return Object.fromEntries(Object.keys(files).map((relative) => [relative, fs.readFileSync(path.join(root, relative), "utf8")]));
}

function archiveOpenSpecChange(item: Fixture, changeRef: string, complete = true): string {
  const source = path.join(item.project, "openspec", "changes", changeRef);
  if (complete) fs.writeFileSync(path.join(source, "tasks.md"), "# Tasks\n\n- [x] 1.1 Complete fixture behavior.\n", "utf8");
  const archiveId = `2026-09-02-${changeRef}`;
  const destination = path.join(item.project, "openspec", "changes", "archive", archiveId);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.renameSync(source, destination);
  return `openspec/changes/archive/${archiveId}`;
}

function terminalEvidence(archiveRef: string, evidenceId = "task34") {
  const candidateRef = `candidate:${evidenceId}-current`;
  const fact = (status: string, evidenceRef: string) => ({ status, candidateRef, evidenceRef });
  return {
    schemaVersion: 1,
    candidateRef,
    archiveRef,
    archiveStatus: BPB_POPULATION.terminal.archiveStatus,
    truncated: false,
    runtimeProof: fact(BPB_POPULATION.terminal.runtimeProofStatus, `proof:${evidenceId}-runtime`),
    validation: fact(BPB_POPULATION.terminal.validationStatus, `validation:${evidenceId}-current`),
    externalEffects: fact(BPB_POPULATION.terminal.externalEffectsStatus, `effects:${evidenceId}-declared`),
    sourceWriter: fact(BPB_POPULATION.terminal.sourceWriterStatus, `writer:${evidenceId}-terminal`),
    cleanup: fact(BPB_POPULATION.terminal.cleanupStatus, `cleanup:${evidenceId}-terminal`),
  };
}

function issues(item: Fixture): Array<Record<string, unknown>> {
  return JSON.parse(fs.readFileSync(item.issuesFile, "utf8")) as Array<Record<string, unknown>>;
}

function issueFixture(id: string, title: string, externalRef: string, metadata: Record<string, unknown>) {
  return {
    id,
    title,
    description: "",
    status: "open",
    priority: 2,
    issue_type: "feature",
    assignee: "",
    external_ref: externalRef,
    spec_id: "",
    metadata,
    dependency_count: 0,
    dependent_count: 0,
    dependencies: [],
  };
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
    if (different == null) throw new Error("Consumer Kaizen store fixture did not resolve.");
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
    fs.writeFileSync(item.issuesFile, `${JSON.stringify([1, 2].map((index) => issueFixture(`BPB-00${index}`, signal.summary, signal.signalRef, metadata)), null, 2)}\n`, "utf8");
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

test("rejects one competing portfolio correlation before create", async () => {
  const item = fixture();
  try {
    const selected = await candidate(item, "project-change", "current-project");
    const signal = await readKaizenSignal(item.store, selected.signalRef);
    const registration = loadBeadsBridgeRegistration(item.registrationFile);
    const metadata = { bridgeSchemaVersion: 1, kaizenSignalRef: signal.signalRef, decisionRef: selected.decisionRef, projectRef: registration.projectRef, ownerClass: "current-project" };
    fs.writeFileSync(item.issuesFile, `${JSON.stringify([
      issueFixture("BPB-001", signal.summary, `signal_${"f".repeat(32)}`, metadata),
    ], null, 2)}\n`, "utf8");
    await assert.rejects(promoteKaizenSignalToBeads(item.store, {
      registrationFile: item.registrationFile,
      ...selected,
      processIdentity: processIdentity("process:competing-correlation"),
    }, item.dependencies), (error: unknown) => error instanceof BeadsKaizenPromotionError && error.code === "competing-portfolio-state");
    assert.equal(issues(item).length, 1);
    assert.equal((await readKaizenSignal(item.store, selected.signalRef)).status, "triaged");
  } finally {
    cleanup(item);
  }
});

test("keeps the writer lease when adapter cleanup liveness is unknown", async () => {
  const item = fixture();
  try {
    const selected = await candidate(item, "project-change", "current-project");
    await assert.rejects(promoteKaizenSignalToBeads(item.store, {
      registrationFile: item.registrationFile,
      ...selected,
      processIdentity: processIdentity("process:unknown-cleanup"),
    }, {
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
    }), (error: unknown) => error instanceof BeadsKaizenPromotionError && error.code === "promotion-failed");
    const coordination = inspectBeadsBridgeCoordination(item.registrationFile);
    assert.equal(coordination.writer, "unknown");
    assert.equal(coordination.preserveManagedMaterial, true);
    assert.equal(issues(item).length, 0);
    assert.equal((await readKaizenSignal(item.store, selected.signalRef)).status, "triaged");
  } finally {
    cleanup(item);
  }
});

test("projects blocker readiness and advisory assignment without writer authority", async () => {
  const item = fixture();
  try {
    const blocker = await promotedFeature(item, "Task 3.2 blocker feature", "process:task32-blocker");
    const dependent = await promotedFeature(item, "Task 3.2 dependent feature", "process:task32-dependent");
    const sourceBefore = gitStatus(item.project);
    const relation = projectBeadsPortfolioRelation({
      registrationFile: item.registrationFile,
      id: dependent.beadsId,
      dependsOnId: blocker.beadsId,
      relationType: "blocks",
      processIdentity: processIdentity("process:task32-relation"),
    }, item.dependencies);
    assert.equal(relation.changed, true);
    assert.equal(relation.sourceExecution, "independent-writer-authority-required");
    assert.equal(relation.productionClaimAvailable, false);
    assert.equal(relation.countsAuthoritative, false);
    const repeatedRelation = projectBeadsPortfolioRelation({
      registrationFile: item.registrationFile,
      id: dependent.beadsId,
      dependsOnId: blocker.beadsId,
      relationType: "blocks",
      processIdentity: processIdentity("process:task32-relation-replay"),
    }, item.dependencies);
    assert.equal(repeatedRelation.changed, false);
    const beforeClose = readReadyBeadsPortfolio({ registrationFile: item.registrationFile, limit: 10 }, item.dependencies);
    assert.ok(beforeClose.items.some((feature) => feature.id === blocker.beadsId));
    assert.equal(beforeClose.items.some((feature) => feature.id === dependent.beadsId), false);
    const shownBeforeOccurrence = showBeadsPortfolioFeature({ registrationFile: item.registrationFile, id: dependent.beadsId }, item.dependencies);
    const signal = await readKaizenSignal(item.store, dependent.signalRef);
    const repeatedSignal = await captureKaizenSignal(item.store, {
      kind: signal.kind,
      summary: signal.summary,
      observedEvidence: signal.observedEvidence,
      impact: signal.impact,
      likelyCause: signal.likelyCause,
      doNotRepeat: signal.doNotRepeat,
      scopeHint: signal.scopeHint,
      evidenceRefs: signal.evidenceRefs,
    }, "explicit", context("capture:task32-recurrence"));
    assert.equal(repeatedSignal.signalRef, dependent.signalRef);
    assert.equal(repeatedSignal.occurrenceCount, signal.occurrenceCount + 1);
    assert.deepEqual(showBeadsPortfolioFeature({ registrationFile: item.registrationFile, id: dependent.beadsId }, item.dependencies), shownBeforeOccurrence);
    const registration = loadBeadsBridgeRegistration(item.registrationFile);
    runBeadsAdapter({
      operation: "close-feature",
      executablePath: registration.binaryPath,
      projectRoot: registration.projectRoot,
      id: blocker.beadsId,
      reason: "test-only blocker closure",
    }, item.dependencies.adapter);
    const afterClose = readReadyBeadsPortfolio({ registrationFile: item.registrationFile, limit: 10 }, item.dependencies);
    assert.ok(afterClose.items.some((feature) => feature.id === dependent.beadsId));
    assert.equal(afterClose.advisoryOnly, true);
    assert.equal(afterClose.sourceExecution, "independent-writer-authority-required");
    const assigned = assignBeadsPortfolioFeature({
      registrationFile: item.registrationFile,
      id: dependent.beadsId,
      assignee: "agent:task32",
      taskRef: "task:task32",
      sessionRef: "session:task32",
      processIdentity: processIdentity("process:task32-assignment"),
    }, item.dependencies);
    assert.equal(assigned.changed, true);
    assert.equal(assigned.sourceExecution, "independent-writer-authority-required");
    const assignmentReplay = assignBeadsPortfolioFeature({
      registrationFile: item.registrationFile,
      id: dependent.beadsId,
      assignee: "agent:task32",
      taskRef: "task:task32",
      sessionRef: "session:task32",
      processIdentity: processIdentity("process:task32-assignment-replay"),
    }, item.dependencies);
    assert.equal(assignmentReplay.changed, false);
    const shown = showBeadsPortfolioFeature({ registrationFile: item.registrationFile, id: dependent.beadsId }, item.dependencies);
    assert.equal(shown.items[0].assignee, "agent:task32");
    assert.equal(shown.items[0].metadata.taskRef, "task:task32");
    assert.equal(shown.items[0].metadata.sessionRef, "session:task32");
    assert.equal(gitStatus(item.project), sourceBefore);
  } finally {
    cleanup(item);
  }
});

test("projects only bounded parent-child and evidence-confirmed supersedes relations", async () => {
  const item = fixture();
  try {
    const child = await promotedFeature(item, "Task 3.2 child feature", "process:task32-child");
    const parent = await promotedFeature(item, "Task 3.2 parent feature", "process:task32-parent");
    const replaced = await promotedFeature(item, "Task 3.2 superseded feature", "process:task32-replaced");
    const parentRelation = projectBeadsPortfolioRelation({
      registrationFile: item.registrationFile,
      id: child.beadsId,
      dependsOnId: parent.beadsId,
      relationType: "parent-child",
      processIdentity: processIdentity("process:task32-parent-relation"),
    }, item.dependencies);
    assert.equal(parentRelation.changed, true);
    assert.throws(() => projectBeadsPortfolioRelation({
      registrationFile: item.registrationFile,
      id: child.beadsId,
      dependsOnId: replaced.beadsId,
      relationType: "supersedes",
      semanticIdentityConfirmed: false,
      processIdentity: processIdentity("process:task32-unconfirmed-supersedes"),
    }, item.dependencies), (error: unknown) => error instanceof BeadsKaizenPromotionError && error.code === "semantic-identity-unconfirmed");
    const supersedes = projectBeadsPortfolioRelation({
      registrationFile: item.registrationFile,
      id: child.beadsId,
      dependsOnId: replaced.beadsId,
      relationType: "supersedes",
      semanticIdentityConfirmed: true,
      processIdentity: processIdentity("process:task32-supersedes"),
    }, item.dependencies);
    assert.equal(supersedes.changed, true);
    assert.throws(() => projectBeadsPortfolioRelation({
      registrationFile: item.registrationFile,
      id: child.beadsId,
      dependsOnId: parent.beadsId,
      relationType: "blocks",
      processIdentity: processIdentity("process:task32-relation-conflict"),
    }, item.dependencies), (error: unknown) => error instanceof BeadsKaizenPromotionError && error.code === "relation-conflict");
    const shown = showBeadsPortfolioFeature({ registrationFile: item.registrationFile, id: child.beadsId }, item.dependencies);
    assert.ok(shown.items[0].dependencies.some((edge) => edge.id === parent.beadsId && edge.dependencyType === "parent-child"));
    assert.ok(shown.items[0].dependencies.some((edge) => edge.id === replaced.beadsId && edge.dependencyType === "supersedes"));
  } finally {
    cleanup(item);
  }
});

test("links one exact OpenSpec change and recovers a lost update response", async () => {
  const item = fixture();
  try {
    const feature = await promotedFeature(item, "Task 3.3 linked feature", "process:task33-feature");
    const firstFiles = writeOpenSpecChange(item, BPB_POPULATION.link.changeRef);
    const conflictingChangeRef = `${BPB_POPULATION.link.changeRef}-other`;
    writeOpenSpecChange(item, conflictingChangeRef);
    const before = readOpenSpecChange(item, BPB_POPULATION.link.changeRef, firstFiles);
    assert.equal(BPB_POPULATION.link.interruption, "after-update-response-loss");
    assert.throws(() => linkBeadsPortfolioFeatureToOpenSpec({
      registrationFile: item.registrationFile,
      id: feature.beadsId,
      changeRef: BPB_POPULATION.link.changeRef,
      specId: BPB_POPULATION.link.specId,
      processIdentity: processIdentity("process:task33-interrupted-link"),
    }, { ...item.dependencies, afterUpdate: () => { throw new Error("injected update response loss"); } }), (error: unknown) => error instanceof BeadsKaizenPromotionError && error.code === "link-failed");
    const linkedAfterInterruption = showBeadsPortfolioFeature({ registrationFile: item.registrationFile, id: feature.beadsId }, item.dependencies);
    assert.equal(linkedAfterInterruption.items[0].specId, BPB_POPULATION.link.specId);
    assert.equal(linkedAfterInterruption.items[0].metadata.changeRef, BPB_POPULATION.link.changeRef);
    assert.equal(BPB_POPULATION.link.readbackPersisted, true);
    assert.equal(inspectBeadsBridgeCoordination(item.registrationFile).writer, "clear");
    const resumed = linkBeadsPortfolioFeatureToOpenSpec({
      registrationFile: item.registrationFile,
      id: feature.beadsId,
      changeRef: BPB_POPULATION.link.changeRef,
      specId: BPB_POPULATION.link.specId,
      processIdentity: processIdentity("process:task33-resumed-link"),
    }, item.dependencies);
    assert.equal(resumed.changed, BPB_POPULATION.link.resumedChanged);
    assert.equal(resumed.sourceExecution, "independent-writer-authority-required");
    assert.equal(issues(item).length, 1);
    assert.deepEqual(readOpenSpecChange(item, BPB_POPULATION.link.changeRef, firstFiles), before);
    assert.throws(() => linkBeadsPortfolioFeatureToOpenSpec({
      registrationFile: item.registrationFile,
      id: feature.beadsId,
      changeRef: conflictingChangeRef,
      specId: `spec:${conflictingChangeRef}`,
      processIdentity: processIdentity("process:task33-mismatch"),
    }, item.dependencies), (error: unknown) => error instanceof BeadsKaizenPromotionError && error.code === "link-conflict");
    const unchanged = showBeadsPortfolioFeature({ registrationFile: item.registrationFile, id: feature.beadsId }, item.dependencies);
    assert.equal(unchanged.items[0].specId, BPB_POPULATION.link.specId);
    assert.equal(unchanged.items[0].metadata.changeRef, BPB_POPULATION.link.changeRef);
    assert.equal(BPB_POPULATION.link.conflictingLinkRejected, true);
  } finally {
    cleanup(item);
  }
});

test("rejects missing, partial, and duplicate OpenSpec correlations before overwrite", async () => {
  const item = fixture();
  try {
    const feature = await promotedFeature(item, "Task 3.3 conflict feature", "process:task33-conflict-feature");
    writeOpenSpecChange(item, "task33-change");
    assert.throws(() => linkBeadsPortfolioFeatureToOpenSpec({
      registrationFile: item.registrationFile,
      id: feature.beadsId,
      changeRef: "missing-change",
      specId: "spec:missing-change",
      processIdentity: processIdentity("process:task33-missing"),
    }, item.dependencies), (error: unknown) => error instanceof BeadsKaizenPromotionError && error.code === "change-not-found");
    const rows = issues(item);
    const metadata = rows[0].metadata as Record<string, unknown>;
    rows.push(issueFixture("BPB-999", rows[0].title as string, rows[0].external_ref as string, metadata));
    fs.writeFileSync(item.issuesFile, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
    assert.throws(() => linkBeadsPortfolioFeatureToOpenSpec({
      registrationFile: item.registrationFile,
      id: feature.beadsId,
      changeRef: "task33-change",
      specId: "spec:task33-change",
      processIdentity: processIdentity("process:task33-duplicate"),
    }, item.dependencies), (error: unknown) => error instanceof BeadsKaizenPromotionError && error.code === "duplicate-correlation");
    rows.pop();
    rows[0].spec_id = "spec:partial";
    fs.writeFileSync(item.issuesFile, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
    assert.throws(() => linkBeadsPortfolioFeatureToOpenSpec({
      registrationFile: item.registrationFile,
      id: feature.beadsId,
      changeRef: "task33-change",
      specId: "spec:task33-change",
      processIdentity: processIdentity("process:task33-partial"),
    }, item.dependencies), (error: unknown) => error instanceof BeadsKaizenPromotionError && error.code === "link-conflict");
    assert.equal(issues(item)[0].spec_id, "spec:partial");
  } finally {
    cleanup(item);
  }
});

test("closes Beads before Kaizen and repairs only the interrupted resolution", async () => {
  const item = fixture();
  try {
    const feature = await promotedFeature(item, "Task 3.4 terminal feature", "process:task34-feature");
    const files = writeOpenSpecChange(item, BPB_POPULATION.link.changeRef);
    linkBeadsPortfolioFeatureToOpenSpec({
      registrationFile: item.registrationFile,
      id: feature.beadsId,
      changeRef: BPB_POPULATION.link.changeRef,
      specId: BPB_POPULATION.link.specId,
      processIdentity: processIdentity("process:task34-link"),
    }, item.dependencies);
    const archiveRef = archiveOpenSpecChange(item, BPB_POPULATION.link.changeRef);
    const archivedTasks = path.join(item.project, ...archiveRef.split("/"), "tasks.md");
    const archivedBytes = fs.readFileSync(archivedTasks, "utf8");
    const request = {
      registrationFile: item.registrationFile,
      id: feature.beadsId,
      changeRef: BPB_POPULATION.link.changeRef,
      specId: BPB_POPULATION.link.specId,
      terminalEvidence: terminalEvidence(archiveRef),
      processIdentity: processIdentity("process:task34-interrupted-close"),
    };
    await assert.rejects(reconcileBeadsPortfolioTerminal(item.store, request, {
      ...item.dependencies,
      afterClose: async () => {
        const closed = showBeadsPortfolioFeature({ registrationFile: item.registrationFile, id: feature.beadsId }, item.dependencies);
        assert.equal(closed.items[0].status, "closed");
        assert.equal((await readKaizenSignal(item.store, feature.signalRef)).status, "promoted");
        throw new Error("injected post-close interruption");
      },
    }), (error: unknown) => error instanceof BeadsKaizenPromotionError && error.code === "terminal-reconciliation-failed");
    assert.equal(inspectBeadsBridgeCoordination(item.registrationFile).writer, "clear");
    const resumed = await reconcileBeadsPortfolioTerminal(item.store, {
      ...request,
      processIdentity: processIdentity("process:task34-resume"),
    }, item.dependencies);
    assert.equal(resumed.featureClosed, false);
    assert.equal(resumed.signalResolved, BPB_POPULATION.terminal.resumedSignalResolved);
    assert.equal(resumed.changed, true);
    assert.equal((await readKaizenSignal(item.store, feature.signalRef)).status, "resolved");
    assert.equal(showBeadsPortfolioFeature({ registrationFile: item.registrationFile, id: feature.beadsId }, item.dependencies).items[0].closeReason, `bpb-${resumed.terminalRef}`);
    const repeated = await reconcileBeadsPortfolioTerminal(item.store, {
      ...request,
      processIdentity: processIdentity("process:task34-repeat"),
    }, item.dependencies);
    assert.equal(repeated.changed, BPB_POPULATION.terminal.replayChanged);
    assert.equal(issues(item).length, 1);
    assert.equal(fs.readFileSync(archivedTasks, "utf8"), archivedBytes);
    assert.notEqual(files["tasks.md"], archivedBytes);
    const commands = fs.readFileSync(item.argvLog, "utf8").trim().split(/\r?\n/u).map((line) => JSON.parse(line) as string[]);
    assert.equal(commands.filter((argv) => argv.includes("close")).length, 1);
  } finally {
    cleanup(item);
  }
});

test("leaves feature and signal open for every incomplete terminal boundary", async () => {
  const item = fixture();
  try {
    const feature = await promotedFeature(item, "Task 3.4 incomplete feature", "process:task34-incomplete-feature");
    writeOpenSpecChange(item, "task34-change");
    linkBeadsPortfolioFeatureToOpenSpec({
      registrationFile: item.registrationFile,
      id: feature.beadsId,
      changeRef: "task34-change",
      specId: "spec:task34-change",
      processIdentity: processIdentity("process:task34-incomplete-link"),
    }, item.dependencies);
    const activeRequest = {
      registrationFile: item.registrationFile,
      id: feature.beadsId,
      changeRef: "task34-change",
      specId: "spec:task34-change",
      terminalEvidence: terminalEvidence("openspec/changes/archive/2026-09-02-task34-change"),
      processIdentity: processIdentity("process:task34-active-change"),
    };
    await assert.rejects(reconcileBeadsPortfolioTerminal(item.store, activeRequest, item.dependencies), (error: unknown) => error instanceof BeadsKaizenPromotionError && error.code === "terminal-evidence-stale");
    const archiveRef = archiveOpenSpecChange(item, "task34-change", false);
    const base = terminalEvidence(archiveRef);
    await assert.rejects(reconcileBeadsPortfolioTerminal(item.store, {
      ...activeRequest,
      terminalEvidence: base,
      processIdentity: processIdentity("process:task34-unchecked-tasks"),
    }, item.dependencies), (error: unknown) => error instanceof BeadsKaizenPromotionError && error.code === "terminal-evidence-incomplete");
    fs.writeFileSync(path.join(item.project, ...archiveRef.split("/"), "tasks.md"), "# Tasks\n\n- [x] 1.1 Complete fixture behavior.\n", "utf8");
    const variants: Array<{ name: string; mutate: (value: ReturnType<typeof terminalEvidence>) => void }> = [
      { name: "truncated", mutate: (value) => { value.truncated = true; } },
      { name: "runtime proof", mutate: (value) => { value.runtimeProof.status = "unknown"; } },
      { name: "validation currentness", mutate: (value) => { value.validation.candidateRef = "candidate:stale"; } },
      { name: "external effects", mutate: (value) => { value.externalEffects.status = "unknown"; } },
      { name: "source writer", mutate: (value) => { value.sourceWriter.status = "unknown"; } },
      { name: "cleanup", mutate: (value) => { value.cleanup.status = "unknown"; } },
    ];
    for (const [index, variant] of variants.entries()) {
      const evidence = structuredClone(base);
      variant.mutate(evidence);
      await assert.rejects(reconcileBeadsPortfolioTerminal(item.store, {
        ...activeRequest,
        terminalEvidence: evidence,
        processIdentity: processIdentity(`process:task34-incomplete-${index}`),
      }, item.dependencies), (error: unknown) => error instanceof BeadsKaizenPromotionError && error.code === "terminal-evidence-incomplete", variant.name);
    }
    assert.equal(showBeadsPortfolioFeature({ registrationFile: item.registrationFile, id: feature.beadsId }, item.dependencies).items[0].status, "open");
    assert.equal((await readKaizenSignal(item.store, feature.signalRef)).status, "promoted");
    assert.equal(inspectBeadsBridgeCoordination(item.registrationFile).writer, "clear");
  } finally {
    cleanup(item);
  }
});

test("rejects ambiguous archive, manual close, and resolved-open terminal projections", async () => {
  const item = fixture();
  try {
    const feature = await promotedFeature(item, "Task 3.4 order conflict feature", "process:task34-order-feature");
    writeOpenSpecChange(item, "task34-change");
    linkBeadsPortfolioFeatureToOpenSpec({
      registrationFile: item.registrationFile,
      id: feature.beadsId,
      changeRef: "task34-change",
      specId: "spec:task34-change",
      processIdentity: processIdentity("process:task34-order-link"),
    }, item.dependencies);
    const archiveRef = archiveOpenSpecChange(item, "task34-change");
    const request = {
      registrationFile: item.registrationFile,
      id: feature.beadsId,
      changeRef: "task34-change",
      specId: "spec:task34-change",
      terminalEvidence: terminalEvidence(archiveRef),
      processIdentity: processIdentity("process:task34-order"),
    };
    const archive = path.join(item.project, ...archiveRef.split("/"));
    const foreignArchiveRef = "openspec/changes/archive/2026-09-02-foreign-task34-change";
    const foreignArchive = path.join(item.project, ...foreignArchiveRef.split("/"));
    fs.renameSync(archive, foreignArchive);
    await assert.rejects(reconcileBeadsPortfolioTerminal(item.store, {
      ...request,
      terminalEvidence: terminalEvidence(foreignArchiveRef),
    }, item.dependencies), (error: unknown) => error instanceof BeadsKaizenPromotionError && error.code === "terminal-evidence-stale");
    fs.renameSync(foreignArchive, archive);
    const duplicate = path.join(item.project, "openspec", "changes", "archive", "2026-09-03-task34-change");
    fs.cpSync(archive, duplicate, { recursive: true });
    await assert.rejects(reconcileBeadsPortfolioTerminal(item.store, request, item.dependencies), (error: unknown) => error instanceof BeadsKaizenPromotionError && error.code === "terminal-evidence-stale");
    fs.rmSync(duplicate, { recursive: true });
    const rows = issues(item);
    rows[0].status = "closed";
    rows[0].close_reason = "manual close";
    fs.writeFileSync(item.issuesFile, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
    await assert.rejects(reconcileBeadsPortfolioTerminal(item.store, request, item.dependencies), (error: unknown) => error instanceof BeadsKaizenPromotionError && error.code === "terminal-close-conflict");
    assert.equal((await readKaizenSignal(item.store, feature.signalRef)).status, "promoted");
    rows[0].status = "open";
    rows[0].close_reason = "";
    fs.writeFileSync(item.issuesFile, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
    await transitionKaizenSignal(item.store, { signalRef: feature.signalRef, status: "resolved", note: "injected wrong order" });
    await assert.rejects(reconcileBeadsPortfolioTerminal(item.store, {
      ...request,
      processIdentity: processIdentity("process:task34-resolved-open"),
    }, item.dependencies), (error: unknown) => error instanceof BeadsKaizenPromotionError && error.code === "terminal-order-conflict");
    assert.equal(showBeadsPortfolioFeature({ registrationFile: item.registrationFile, id: feature.beadsId }, item.dependencies).items[0].status, "open");
  } finally {
    cleanup(item);
  }
});

test("keeps terminal projection stale-open when close writer liveness is unknown", async () => {
  const item = fixture();
  try {
    const feature = await promotedFeature(item, "Task 3.4 unknown writer feature", "process:task34-unknown-feature");
    writeOpenSpecChange(item, "task34-change");
    linkBeadsPortfolioFeatureToOpenSpec({
      registrationFile: item.registrationFile,
      id: feature.beadsId,
      changeRef: "task34-change",
      specId: "spec:task34-change",
      processIdentity: processIdentity("process:task34-unknown-link"),
    }, item.dependencies);
    const archiveRef = archiveOpenSpecChange(item, "task34-change");
    const runCommand = item.dependencies.adapter!.runCommand!;
    await assert.rejects(reconcileBeadsPortfolioTerminal(item.store, {
      registrationFile: item.registrationFile,
      id: feature.beadsId,
      changeRef: "task34-change",
      specId: "spec:task34-change",
      terminalEvidence: terminalEvidence(archiveRef),
      processIdentity: processIdentity("process:task34-unknown-close"),
    }, {
      adapter: {
        ...item.dependencies.adapter,
        runCommand: (cwd, argv, options) => argv.includes("close") ? {
          status: null,
          signal: null,
          cleanupState: "unknown",
          timedOut: true,
          error: new Error("fixture close timeout"),
          stdout: "",
          stderr: "",
        } : runCommand(cwd, argv, options),
      },
    }), (error: unknown) => error instanceof BeadsKaizenPromotionError && error.code === "terminal-reconciliation-failed");
    assert.equal(inspectBeadsBridgeCoordination(item.registrationFile).writer, "unknown");
    assert.equal(showBeadsPortfolioFeature({ registrationFile: item.registrationFile, id: feature.beadsId }, item.dependencies).items[0].status, "open");
    assert.equal((await readKaizenSignal(item.store, feature.signalRef)).status, "promoted");
  } finally {
    cleanup(item);
  }
});

test("completes one provider-free registered project lifecycle through production entrypoints", async () => {
  const item = fixture("current-project", false, true);
  const root = item.root;
  try {
    const trackedBefore = fileSha256(path.join(item.project, ".gitignore"));
    const hooksBefore = directoryIdentity(path.join(item.project, ".git", "hooks"));
    const externalBefore = directoryIdentity(item.external);
    const enabled = runBeadsProjectLifecycle({
      operation: "enable",
      registrationFile: item.registrationFile,
      processIdentity: processIdentity("process:task35-enable"),
    }, item.lifecycleDependencies);
    assert.equal(enabled.status, "enabled");
    assert.equal(enabled.registrationEnabled, true);
    assert.equal(enabled.observation.processCleanup, "terminal");

    const feature = await promotedFeature(item, "Task 3.5 canonical feature", "process:task35-promote");
    const registration = loadBeadsBridgeRegistration(item.registrationFile);
    const blockerMetadata = {
      bridgeSchemaVersion: 1,
      kaizenSignalRef: "signal:task35-blocker-fixture",
      decisionRef: "decision:task35-blocker-fixture",
      projectRef: registration.projectRef,
      ownerClass: "current-project",
    };
    const rows = issues(item);
    rows.push(issueFixture("BPB-900", "Task 3.5 prerequisite", blockerMetadata.kaizenSignalRef, blockerMetadata));
    fs.writeFileSync(item.issuesFile, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
    projectBeadsPortfolioRelation({
      registrationFile: item.registrationFile,
      id: feature.beadsId,
      dependsOnId: "BPB-900",
      relationType: BPB_POPULATION.dependency.relationType as "blocks",
      processIdentity: processIdentity("process:task35-block"),
    }, item.dependencies);
    assert.equal(readReadyBeadsPortfolio({ registrationFile: item.registrationFile, limit: 100 }, item.dependencies).items.some((issue) => issue.id === feature.beadsId), BPB_POPULATION.dependency.beforeReady);
    runBeadsAdapter({
      operation: "close-feature",
      executablePath: registration.binaryPath,
      projectRoot: registration.projectRoot,
      id: "BPB-900",
      reason: "provider-free prerequisite complete",
    }, item.dependencies.adapter);
    assert.equal(readReadyBeadsPortfolio({ registrationFile: item.registrationFile, limit: 100 }, item.dependencies).items.some((issue) => issue.id === feature.beadsId), BPB_POPULATION.dependency.afterReady);

    const assignment = assignBeadsPortfolioFeature({
      registrationFile: item.registrationFile,
      id: feature.beadsId,
      assignee: BPB_POPULATION.assignment.assignee,
      taskRef: BPB_POPULATION.assignment.taskRef,
      sessionRef: BPB_POPULATION.assignment.sessionRef,
      processIdentity: processIdentity("process:task35-assign"),
    }, item.dependencies);
    assert.equal(assignment.changed, BPB_POPULATION.assignment.changed);
    assert.equal(assignment.productionClaimAvailable, BPB_POPULATION.assignment.productionClaimAvailable);
    assert.equal(assignment.sourceExecution, "independent-writer-authority-required");
    writeOpenSpecChange(item, BPB_POPULATION.link.changeRef);
    const link = linkBeadsPortfolioFeatureToOpenSpec({
      registrationFile: item.registrationFile,
      id: feature.beadsId,
      changeRef: BPB_POPULATION.link.changeRef,
      specId: BPB_POPULATION.link.specId,
      processIdentity: processIdentity("process:task35-link"),
    }, item.dependencies);
    assert.equal(link.changed, BPB_POPULATION.assignment.changed);
    assert.equal(link.productionClaimAvailable, false);
    assert.equal(gitStatus(item.project), "");
    const validation = spawnSync("git", ["diff", "--check"], { cwd: item.project, encoding: "utf8" });
    assert.equal(validation.status, 0, validation.stderr);
    const archiveRef = archiveOpenSpecChange(item, BPB_POPULATION.link.changeRef);
    const terminal = await reconcileBeadsPortfolioTerminal(item.store, {
      registrationFile: item.registrationFile,
      id: feature.beadsId,
      changeRef: BPB_POPULATION.link.changeRef,
      specId: BPB_POPULATION.link.specId,
      terminalEvidence: terminalEvidence(archiveRef, "task35"),
      processIdentity: processIdentity("process:task35-terminal"),
    }, item.dependencies);
    assert.equal(terminal.featureClosed, BPB_POPULATION.terminal.closeBeforeResolve);
    assert.equal(terminal.signalResolved, BPB_POPULATION.terminal.resumedSignalResolved);
    assert.equal((await readKaizenSignal(item.store, feature.signalRef)).status, "resolved");
    assert.equal(issues(item).filter((issue) => issue.external_ref === feature.signalRef).length, 1);

    const disabled = runBeadsProjectLifecycle({
      operation: "disable",
      registrationFile: item.registrationFile,
      processIdentity: processIdentity("process:task35-disable"),
    }, item.lifecycleDependencies);
    assert.equal(disabled.status, "disabled");
    assert.equal(disabled.registrationEnabled, false);
    assert.equal(disabled.storePreserved, true);
    assert.equal(loadBeadsBridgeRegistration(item.registrationFile).enabled, false);
    assert.equal(inspectBeadsBridgeCoordination(item.registrationFile).writer, "clear");
    assert.equal(gitStatus(item.project), BPB_POPULATION.gitEffects.trackedStatusAfter);
    assert.equal(fileSha256(path.join(item.project, ".gitignore")), trackedBefore);
    assert.equal(directoryIdentity(path.join(item.project, ".git", "hooks")), hooksBefore);
    assert.equal(directoryIdentity(item.external), externalBefore);
    const remotes = spawnSync("git", ["remote", "-v"], { cwd: item.project, encoding: "utf8" });
    assert.equal(remotes.status, 0);
    assert.equal(remotes.stdout.trim() === "" ? 0 : remotes.stdout.trim().split(/\r?\n/u).length, BPB_POPULATION.gitEffects.remoteCount);
    assert.equal(fs.existsSync(path.join(item.project, "AGENTS.md")), BPB_POPULATION.gitEffects.agentInstructionCreated);
    assert.equal(fs.existsSync(path.join(item.project, ".beads")), true);
    assert.equal(fs.existsSync(path.join(item.project, ...archiveRef.split("/"))), true);
    const invocations = fs.readFileSync(item.argvLog, "utf8").trim().split(/\r?\n/u).map((line) => JSON.parse(line) as string[]);
    assert.equal(invocations.filter((argv) => argv.includes("init")).length, 1);
    assert.equal(invocations.some((argv) => argv.some((value) => ["prime", "server", "sync"].includes(value))), false);
  } finally {
    cleanup(item);
    assert.equal(fs.existsSync(root), false);
  }
});
