#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";
import assert from "node:assert/strict";

import { loadWorkCampaignDefinition } from "../global/bin/work-campaign/contracts.ts";
import {
  buildWorkCampaignSupervisorPreview,
  checkWorkCampaignSupervisorInstallation,
  planWorkCampaignSupervisorRepair,
  planWorkCampaignSupervisorRollback,
} from "./windows/work-campaign-supervisor.ts";
import type {
  WorkCampaignSupervisorObservation,
  WorkCampaignSupervisorPreview,
  WorkCampaignSupervisorTaskObservation,
} from "./windows/work-campaign-supervisor.ts";
import { runInstalledCampaignSupervisor } from "./windows/work-campaign-supervisor-host.ts";
import { campaignSupervisorInstallId } from "./windows/work-campaign-supervisor-host.ts";
import {
  installWorkCampaignSupervisor,
  observeWorkCampaignSupervisor,
  repairWorkCampaignSupervisor,
  rollbackWorkCampaignSupervisor,
  startWorkCampaignSupervisorTask,
} from "./windows/work-campaign-supervisor-install.ts";
import type { WorkCampaignSupervisorInstallDependencies } from "./windows/work-campaign-supervisor-install.ts";
import { WORK_CAMPAIGN_SUPERVISOR_TASK_NAME } from "./windows/opencode-workstation-layout.ts";

const root = path.resolve(import.meta.dirname, "..");
const planner = path.join(root, "tools", "windows", "work-campaign-supervisor.ts");
const workCampaign = path.join(root, "global", "bin", "work-campaign.ts");
const rawPath = process.env.WORK_CAMPAIGN_WINDOWS_RAW_PATH;
const candidateId = process.env.WORK_CAMPAIGN_WINDOWS_CANDIDATE_ID ?? "work-campaign-windows-focused";
const environmentId = process.env.WORK_CAMPAIGN_WINDOWS_ENVIRONMENT_ID ?? null;
const activeFixtures = new Set<string>();
const completedOracles = new Set<string>();

function sha256(value: string | Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function git(project: string, args: string[]): void {
  const result = spawnSync("git", args, { cwd: project, encoding: "utf8", shell: false });
  assert.equal(result.status, 0, result.stderr || `git ${args.join(" ")} failed`);
}

function fixture(): {
  project: string;
  protectedRoot: string;
  registry: string;
  root: string;
  workstationManifest: string;
  workstationRoot: string;
} {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "work-campaign-windows-test-"));
  activeFixtures.add(fixtureRoot);
  const project = path.join(fixtureRoot, "project");
  const workstationRoot = path.join(fixtureRoot, "workstation");
  const protectedRoot = path.join(fixtureRoot, "campaign-supervisor");
  fs.mkdirSync(path.join(project, "src"), { recursive: true });
  fs.mkdirSync(workstationRoot, { recursive: true });
  git(project, ["init", "-b", "main"]);
  git(project, ["config", "user.name", "Windows Campaign Proof"]);
  git(project, ["config", "user.email", "windows-campaign@example.invalid"]);
  git(project, ["config", "commit.gpgsign", "false"]);
  fs.mkdirSync(path.join(project, "openspec"));
  fs.writeFileSync(path.join(project, "openspec", "config.yaml"), "schema: spec-driven\n", "utf8");
  fs.writeFileSync(path.join(project, "src", "index.ts"), "export const fixture = true;\n", "utf8");
  fs.writeFileSync(path.join(project, ".gitignore"), ".opencode-dev-kit/\n.work-campaign/\n", "utf8");
  writeJson(path.join(project, "adapter.json"), {
    adapterId: "windows-supervisor-fixture",
    inventoryArgv: [process.execPath, "--version"],
    realBoundaryProofArgv: [process.execPath, "--version"],
    schemaVersion: 1,
  });
  writeJson(path.join(project, "campaign.json"), {
    adapterPath: "adapter.json",
    allowedEffects: ["local-read"],
    authorizationRefs: {},
    budgets: { evidenceBytes: 1_048_576, modelCalls: 1, processAttempts: 2, wallClockSeconds: 300, waves: 1 },
    campaignId: "windows-supervisor-fixture",
    checkpoint: { localCommitAuthorized: false, mode: "evidence-only", workspace: "persistent" },
    evidencePath: ".work-campaign/evidence",
    exclusions: [".work-campaign/evidence"],
    hostResume: { enabled: true, supervisorRequired: true },
    outcome: "Inspect one disposable Windows supervisor fixture.",
    playbook: "audit-remediate",
    protectedDecisionPolicy: "owner-required",
    reportPath: ".work-campaign/report.md",
    schemaVersion: 1,
    scopeRoots: ["src"],
    statePath: ".opencode-dev-kit/runtime/work-campaigns/windows-supervisor-fixture",
    stopPolicy: { onBudgetExhausted: true, onExplicitStop: true, onOwnerRequired: true, onProtected: true, onUnknown: true },
    validationArgv: [process.execPath, "--version"],
  });
  git(project, ["add", ".gitignore", "adapter.json", "campaign.json", "openspec/config.yaml", "src/index.ts"]);
  git(project, ["commit", "-m", "configure windows campaign fixture"]);
  const definitionDigest = loadWorkCampaignDefinition(project, "campaign.json").definitionDigest;
  const registry = path.join(fixtureRoot, "registry.json");
  writeJson(registry, {
    policy: { backoffMs: [10], commandTimeoutMs: 10_000, healthPollMs: 10, healthTimeoutMs: 100, logBytes: 16_384, logGenerations: 2, maxRestarts: 1 },
    registrations: [{ definitionDigest, definitionPath: "campaign.json", enabled: true, id: "windows-supervisor-fixture", root: project }],
    runtime: { endpoint: "http://127.0.0.1:4096", expectedVersion: "1.18.23" },
    schemaVersion: 1,
    workCampaignDigest: sha256(fs.readFileSync(workCampaign)),
  });
  const workstationManifest = path.join(workstationRoot, "manifest.json");
  writeJson(workstationManifest, { schemaVersion: 2, owner: { user: "fixture-owner" } });
  return { project, protectedRoot, registry, root: fixtureRoot, workstationManifest, workstationRoot };
}

function preview(current: ReturnType<typeof fixture>, kitRoot = root): WorkCampaignSupervisorPreview {
  return buildWorkCampaignSupervisorPreview({
    kitRoot,
    protectedRoot: current.protectedRoot,
    registryPath: current.registry,
    workstationManifestPath: current.workstationManifest,
    workstationRoot: current.workstationRoot,
  });
}

function stoppedObservation(current: WorkCampaignSupervisorPreview): WorkCampaignSupervisorObservation {
  return {
    runtime: { process: null, state: "stopped" },
    schemaVersion: 1,
    task: {
      arguments: current.task.arguments,
      execute: current.task.execute,
      exists: true,
      multipleInstances: current.task.policy.multipleInstances,
      runLevel: current.task.policy.runLevel,
      taskName: current.task.name,
      triggerCount: 1,
      user: current.task.user,
      workingDirectory: current.task.workingDirectory,
    },
  };
}

function materializeFixture(current: WorkCampaignSupervisorPreview): void {
  for (const [index, installed] of current.manifest.installedFiles.entries()) {
    const source = current.manifest.kitSource.files[index];
    assert.ok(source);
    fs.mkdirSync(path.dirname(installed.path), { recursive: true });
    fs.copyFileSync(source.path, installed.path);
  }
  fs.copyFileSync(current.registry.sourcePath, current.registry.installedPath);
  writeJson(path.join(current.manifest.protectedRoot, "manifest.json"), current.manifest);
}

function fakeInstallDependencies(): {
  dependencies: Partial<WorkCampaignSupervisorInstallDependencies>;
  failRegistration: () => void;
  processes: Array<{ executablePath: string; pid: number }>;
  resetTaskState: () => void;
  task: () => WorkCampaignSupervisorTaskObservation | null;
} {
  let task: WorkCampaignSupervisorTaskObservation | null = null;
  let state: string | null = null;
  let registrationFailure = false;
  const processes: Array<{ executablePath: string; pid: number }> = [];
  const useRealAcl = process.env.WORK_CAMPAIGN_WINDOWS_REAL_ACL === "1";
  return {
    dependencies: {
      ...(useRealAcl ? {} : { applyRootAcl: () => {}, rootAclCurrent: () => true }),
      isElevated: () => true,
      registerTask: (current) => {
        if (registrationFailure) throw new Error("synthetic task registration failure");
        task = {
          arguments: current.task.arguments,
          execute: current.task.execute,
          exists: true,
          multipleInstances: current.task.policy.multipleInstances,
          runLevel: current.task.policy.runLevel,
          taskName: current.task.name,
          triggerCount: 1,
          user: current.task.user,
          workingDirectory: current.task.workingDirectory,
        };
        state = "Ready";
      },
      snapshot: () => ({ processes: [...processes], task: { observation: task, state } }),
      startTask: () => { state = "Running"; },
      unregisterTask: () => { task = null; state = null; },
    },
    failRegistration: () => { registrationFailure = true; },
    processes,
    resetTaskState: () => { state = task == null ? null : "Ready"; },
    task: () => task,
  };
}

function copyKitSource(current: WorkCampaignSupervisorPreview, target: string): void {
  fs.mkdirSync(target, { recursive: true });
  for (const source of current.manifest.kitSource.files) {
    const relative = path.relative(current.manifest.kitSource.root, source.path);
    const destination = path.join(target, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source.path, destination);
  }
}

test("Windows supervisor preview is effect-free, protected, and independently reversible", () => {
  const current = fixture();
  try {
    const before = fs.readdirSync(current.root).sort();
    const result = preview(current);
    const after = fs.readdirSync(current.root).sort();
    assert.deepEqual(after, before);
    assert.equal(result.effects, "none");
    assert.equal(result.task.policy.runLevel, "Highest");
    assert.equal(result.task.policy.trigger, "AtLogon");
    assert.equal(result.task.policy.multipleInstances, "IgnoreNew");
    assert.equal(result.campaigns[0]?.id, "windows-supervisor-fixture");
    assert.equal(result.sourceFiles.some((file) => file.sourcePath.endsWith("global\\bin\\portable-process.ts") || file.sourcePath.endsWith("global/bin/portable-process.ts")), true);
    assert.equal(result.sourceFiles.some((file) => file.sourcePath.endsWith("global\\bin\\roadmap-mission\\contracts.ts") || file.sourcePath.endsWith("global/bin/roadmap-mission/contracts.ts")), true);
    assert.equal(result.sourceFiles.some((file) => file.sourcePath.endsWith("tools\\windows\\work-campaign-supervisor-host.ts") || file.sourcePath.endsWith("tools/windows/work-campaign-supervisor-host.ts")), true);
    assert.equal(result.manifest.protectedRoot.startsWith(`${current.workstationRoot}${path.sep}`), false);
    assert.equal(result.rollback.paths.every((selected) => selected === current.protectedRoot || selected.startsWith(`${current.protectedRoot}${path.sep}`)), true);
    assert.equal(result.rollback.preserves.includes(current.workstationRoot), true);
    assert.equal(JSON.stringify(result).includes("OPENCODE_SERVER_PASSWORD"), false);

    const command = spawnSync(process.execPath, [
      planner, "preview",
      "--kit-root", root,
      "--registry", current.registry,
      "--workstation-manifest", current.workstationManifest,
      "--workstation-root", current.workstationRoot,
      "--protected-root", current.protectedRoot,
    ], { cwd: root, encoding: "utf8", shell: false });
    assert.equal(command.status, 0, command.stderr);
    assert.equal(JSON.parse(command.stdout).effects, "none");
    assert.deepEqual(fs.readdirSync(current.root).sort(), before);
  } finally {
    fs.rmSync(current.root, { recursive: true, force: true });
    activeFixtures.delete(current.root);
  }
  completedOracles.add("effect-free-preview");
});

test("Windows supervisor check separates source, installed, task, and runtime identity", () => {
  const current = fixture();
  try {
    const candidate = preview(current);
    const missing = checkWorkCampaignSupervisorInstallation(candidate, { runtime: { process: null, state: "absent" }, schemaVersion: 1, task: null });
    assert.equal(missing.source.status, "current");
    assert.equal(missing.installed.status, "missing");
    assert.equal(missing.task.status, "missing");
    const installPlan = planWorkCampaignSupervisorRepair(candidate, { runtime: { process: null, state: "absent" }, schemaVersion: 1, task: null });
    assert.equal(installPlan.eligible, true);
    assert.equal(installPlan.actions.some((action) => action.kind === "register-task"), true);

    materializeFixture(candidate);
    const observation = stoppedObservation(candidate);
    const complete = checkWorkCampaignSupervisorInstallation(candidate, observation);
    assert.equal(complete.status, "current");
    const observationPath = path.join(current.root, "observation.json");
    writeJson(observationPath, observation);
    const command = spawnSync(process.execPath, [
      planner, "check",
      "--kit-root", root,
      "--registry", current.registry,
      "--workstation-manifest", current.workstationManifest,
      "--workstation-root", current.workstationRoot,
      "--protected-root", current.protectedRoot,
      "--observation", observationPath,
    ], { cwd: root, encoding: "utf8", shell: false });
    assert.equal(command.status, 0, command.stderr);
    assert.equal(JSON.parse(command.stdout).status, "current");

    const driftedFile = candidate.manifest.installedFiles[0];
    assert.ok(driftedFile);
    fs.appendFileSync(driftedFile.path, "drift", "utf8");
    const drifted = checkWorkCampaignSupervisorInstallation(candidate, observation);
    assert.equal(drifted.source.status, "current");
    assert.equal(drifted.installed.status, "drifted");
    assert.equal(planWorkCampaignSupervisorRollback(candidate, observation).eligible, false);
  } finally {
    fs.rmSync(current.root, { recursive: true, force: true });
    activeFixtures.delete(current.root);
  }
  completedOracles.add("identity-separated-check");
});

test("Windows supervisor plans block nested roots, untrusted registrations, task drift, and unknown runtime", () => {
  const current = fixture();
  try {
    assert.throws(() => buildWorkCampaignSupervisorPreview({
      kitRoot: root,
      protectedRoot: path.join(current.workstationRoot, "nested"),
      registryPath: current.registry,
      workstationManifestPath: current.workstationManifest,
      workstationRoot: current.workstationRoot,
    }), /independent/u);
    const registry = JSON.parse(fs.readFileSync(current.registry, "utf8"));
    registry.registrations[0].root = path.join(current.project, "src");
    const invalidRegistry = path.join(current.root, "invalid-registry.json");
    writeJson(invalidRegistry, registry);
    assert.throws(() => buildWorkCampaignSupervisorPreview({
      kitRoot: root,
      protectedRoot: current.protectedRoot,
      registryPath: invalidRegistry,
      workstationManifestPath: current.workstationManifest,
      workstationRoot: current.workstationRoot,
    }), /Git worktree root/u);

    const candidate = preview(current);
    materializeFixture(candidate);
    const unknownRuntime = stoppedObservation(candidate);
    unknownRuntime.runtime = { process: null, state: "unknown" };
    assert.deepEqual(planWorkCampaignSupervisorRepair(candidate, unknownRuntime).blockers, ["runtime-ownership-not-terminal"]);
    assert.deepEqual(planWorkCampaignSupervisorRollback(candidate, unknownRuntime).blockers, ["runtime-ownership-not-terminal"]);
    const taskDrift = stoppedObservation(candidate);
    assert.ok(taskDrift.task);
    taskDrift.task.arguments = "unsafe argv";
    assert.equal(planWorkCampaignSupervisorRepair(candidate, taskDrift).blockers.includes("task-identity-drift"), true);
    assert.equal(planWorkCampaignSupervisorRollback(candidate, taskDrift).blockers.includes("task-identity-drift"), true);

    const cleanRollback = planWorkCampaignSupervisorRollback(candidate, stoppedObservation(candidate));
    assert.equal(cleanRollback.eligible, true);
    assert.equal(cleanRollback.actions.every((action) => action.path == null || action.path === current.protectedRoot || action.path.startsWith(`${current.protectedRoot}${path.sep}`)), true);
    assert.equal(cleanRollback.actions.some((action) => action.taskName === "OpenCode Workstation Shared Server" || action.taskName === "OpenCode Workstation Tray"), false);
  } finally {
    fs.rmSync(current.root, { recursive: true, force: true });
    activeFixtures.delete(current.root);
  }
  completedOracles.add("fail-closed-plans");
});

test("Windows source drift is distinct from a current protected installation", () => {
  const current = fixture();
  try {
    const original = preview(current);
    const kitCopy = path.join(current.root, "kit-copy");
    copyKitSource(original, kitCopy);
    const candidate = preview(current, kitCopy);
    materializeFixture(candidate);
    const changedSource = candidate.manifest.kitSource.files[0];
    assert.ok(changedSource);
    fs.appendFileSync(changedSource.path, "source drift", "utf8");
    const check = checkWorkCampaignSupervisorInstallation(candidate, stoppedObservation(candidate));
    assert.equal(check.source.status, "drifted");
    assert.equal(check.installed.status, "current");
    assert.deepEqual(planWorkCampaignSupervisorRepair(candidate, stoppedObservation(candidate)).blockers, ["source-drift"]);
  } finally {
    fs.rmSync(current.root, { recursive: true, force: true });
    activeFixtures.delete(current.root);
  }
  completedOracles.add("source-installed-drift-separation");
});

test("protected host injects the credential only in memory after exact identity checks", async () => {
  const current = fixture();
  const password = "private-host-password-proof";
  try {
    const candidate = preview(current);
    materializeFixture(candidate);
    const credentialPath = candidate.manifest.credentialPath;
    fs.writeFileSync(credentialPath, `${password}\n`, "utf8");
    let receivedPassword: string | undefined;
    let receivedOperation: string | undefined;
    let written: unknown;
    const result = await runInstalledCampaignSupervisor(
      path.join(candidate.manifest.protectedRoot, "manifest.json"),
      { expectedCredentialPath: credentialPath, operation: "status" },
      {
        loadSupervisor: async () => ({
          runCampaignSupervisor: async (options) => {
            receivedPassword = options.environment.OPENCODE_SERVER_PASSWORD;
            receivedOperation = options.operation;
            return { rows: [], schemaVersion: 1, status: "provider-free-host-proof" };
          },
        }),
        writeResult: (_resultPath, value) => { written = value; },
      },
    );
    assert.equal(receivedPassword, password);
    assert.equal(receivedOperation, "status");
    assert.equal(JSON.stringify(result).includes(password), false);
    assert.equal(JSON.stringify(written).includes(password), false);
    assert.equal(fs.readFileSync(path.join(candidate.manifest.protectedRoot, "manifest.json"), "utf8").includes(password), false);
    assert.equal(fs.readFileSync(candidate.manifest.registry.path, "utf8").includes(password), false);

    const hostFile = candidate.manifest.installedFiles.find((file) => file.path.endsWith("work-campaign-supervisor-host.ts"));
    assert.ok(hostFile);
    fs.appendFileSync(hostFile.path, "drift", "utf8");
    await assert.rejects(() => runInstalledCampaignSupervisor(path.join(candidate.manifest.protectedRoot, "manifest.json"), { expectedCredentialPath: credentialPath }, {
      loadSupervisor: async () => { throw new Error("must not load drifted supervisor"); },
    }), /drifted/u);
  } finally {
    fs.rmSync(current.root, { recursive: true, force: true });
    activeFixtures.delete(current.root);
  }
  completedOracles.add("credential-private-host");
});

test("Windows installer creates, reads back, starts, and rolls back only attributable state", () => {
  const current = fixture();
  try {
    const candidate = preview(current);
    const fake = fakeInstallDependencies();
    const installed = installWorkCampaignSupervisor(candidate, fake.dependencies);
    assert.equal(installed.status, "installed");
    assert.equal(fake.task()?.taskName, candidate.task.name);
    assert.equal(checkWorkCampaignSupervisorInstallation(candidate, observeWorkCampaignSupervisor(candidate, fake.dependencies)).status, "current");
    assert.equal(repairWorkCampaignSupervisor(candidate, fake.dependencies).status, "current");
    assert.equal(startWorkCampaignSupervisorTask(candidate, fake.dependencies).status, "started");
    assert.equal(observeWorkCampaignSupervisor(candidate, fake.dependencies).runtime.state, "unknown");
    fake.resetTaskState();
    assert.equal(rollbackWorkCampaignSupervisor(candidate, fake.dependencies).status, "removed");
    assert.equal(fs.existsSync(candidate.manifest.protectedRoot), false);
    assert.equal(fake.task(), null);
  } finally {
    fs.rmSync(current.root, { recursive: true, force: true });
    activeFixtures.delete(current.root);
  }
});

test("Windows installer removes a failed fresh install and preserves exact failure cause", () => {
  const current = fixture();
  try {
    const candidate = preview(current);
    const fake = fakeInstallDependencies();
    fake.failRegistration();
    assert.throws(() => installWorkCampaignSupervisor(candidate, fake.dependencies), (error: unknown) => {
      assert.match(String((error as Error).cause), /synthetic task registration failure/u);
      return true;
    });
    assert.equal(fs.existsSync(candidate.manifest.protectedRoot), false);
    assert.equal(fake.task(), null);
  } finally {
    fs.rmSync(current.root, { recursive: true, force: true });
    activeFixtures.delete(current.root);
  }
});

test("Windows rollback blocks task, process, and protected-root drift", () => {
  const current = fixture();
  try {
    const candidate = preview(current);
    const fake = fakeInstallDependencies();
    installWorkCampaignSupervisor(candidate, fake.dependencies);
    const task = fake.task();
    assert.ok(task);
    task.arguments = "drifted";
    assert.throws(() => rollbackWorkCampaignSupervisor(candidate, fake.dependencies), /task-identity-drift/u);
    task.arguments = candidate.task.arguments;
    fake.processes.push({ executablePath: process.execPath, pid: process.pid });
    assert.throws(() => rollbackWorkCampaignSupervisor(candidate, fake.dependencies), /runtime-ownership-not-terminal/u);
    fake.processes.length = 0;
    fs.writeFileSync(path.join(candidate.manifest.protectedRoot, "foreign.txt"), "foreign\n", "utf8");
    assert.throws(() => rollbackWorkCampaignSupervisor(candidate, fake.dependencies), /unattributable file/u);
    fs.rmSync(path.join(candidate.manifest.protectedRoot, "foreign.txt"));
    rollbackWorkCampaignSupervisor(candidate, fake.dependencies);
  } finally {
    fs.rmSync(current.root, { recursive: true, force: true });
    activeFixtures.delete(current.root);
  }
});

if (process.env.WORK_CAMPAIGN_WINDOWS_REAL_TASK === "1") {
  test("Windows installer registers and reads back one proof-owned real task", () => {
    const current = fixture();
    const candidate = preview(current);
    const taskName = WORK_CAMPAIGN_SUPERVISOR_TASK_NAME;
    const installedWorkstationManifest = JSON.parse(fs.readFileSync(String.raw`C:\ProgramData\OpenCodeWorkstation\manifest.json`, "utf8")) as { owner?: { user?: unknown } };
    assert.equal(typeof installedWorkstationManifest.owner?.user, "string");
    const taskPreflight = spawnSync("pwsh.exe", ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", `if (Get-ScheduledTask -TaskName '${taskName}' -ErrorAction SilentlyContinue) { exit 1 }`], { encoding: "utf8", shell: false, windowsHide: true });
    assert.equal(taskPreflight.status, 0, "real campaign task probe requires the exact task to be absent");
    candidate.task.name = taskName;
    candidate.task.user = installedWorkstationManifest.owner!.user as string;
    candidate.manifest.task.name = taskName;
    candidate.manifest.task.user = candidate.task.user;
    const { installId: _priorInstallId, ...manifestPayload } = candidate.manifest;
    candidate.manifest.installId = campaignSupervisorInstallId(manifestPayload);
    const dependencies: Partial<WorkCampaignSupervisorInstallDependencies> = {
      applyRootAcl: () => {},
      isElevated: () => true,
      rootAclCurrent: () => true,
    };
    try {
      assert.equal(installWorkCampaignSupervisor(candidate, dependencies).status, "installed");
      assert.equal(checkWorkCampaignSupervisorInstallation(candidate, observeWorkCampaignSupervisor(candidate, dependencies)).status, "current");
      assert.equal(rollbackWorkCampaignSupervisor(candidate, dependencies).status, "removed");
    } finally {
      const payload = Buffer.from(JSON.stringify({ taskName }), "utf8").toString("base64");
      spawnSync("pwsh.exe", ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", `$p=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${payload}'))|ConvertFrom-Json; if (Get-ScheduledTask -TaskName ([string]$p.taskName) -ErrorAction SilentlyContinue) { Unregister-ScheduledTask -TaskName ([string]$p.taskName) -Confirm:$false }`], { encoding: "utf8", shell: false, windowsHide: true });
      fs.rmSync(current.root, { recursive: true, force: true });
      activeFixtures.delete(current.root);
    }
  });
}

after(() => {
  if (rawPath == null) return;
  writeJson(rawPath, {
    candidateId,
    cleanup: activeFixtures.size === 0 ? "complete" : "unknown",
    completedOracles: [...completedOracles].sort(),
    effects: { hostMutations: 0, openCodeCalls: 0, processStarts: 0, providerCalls: 0, sourceWrites: 0 },
    ...(environmentId == null ? {} : { environmentId }),
    proofKind: "campaign-windows-source-plan",
    schemaVersion: 1,
  });
});
