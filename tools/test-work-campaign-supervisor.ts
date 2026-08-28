#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import { stableJson } from "../global/bin/roadmap-mission/contracts.ts";
import { loadWorkCampaignDefinition } from "../global/bin/work-campaign/contracts.ts";
import {
  loadCampaignSupervisorRegistry,
  runCampaignSupervisor,
} from "../global/bin/work-campaign/supervisor.ts";

const root = path.resolve(import.meta.dirname, "..");
const supervisorCli = path.join(root, "global", "bin", "work-campaign-supervisor.ts");
const workCampaignCli = path.join(root, "global", "bin", "work-campaign.ts");

function sha256(file: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, stableJson(value), "utf8");
}

function command(cwd: string, executable: string, args: string[], environment: NodeJS.ProcessEnv = process.env): ReturnType<typeof spawnSync> {
  return spawnSync(executable, args, { cwd, encoding: "utf8", env: environment, shell: false, timeout: 60_000 });
}

function git(project: string, args: string[]): void {
  const result = command(project, "git", args);
  assert.equal(result.status, 0, result.stderr || `git ${args.join(" ")} failed`);
}

function fixture(): { definitionDigest: string; project: string; registry: string; supervisorRoot: string } {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "work-campaign-supervisor-test-"));
  const project = path.join(directory, "project");
  const supervisorRoot = path.join(directory, "supervisor");
  fs.mkdirSync(path.join(project, "src"), { recursive: true });
  fs.mkdirSync(supervisorRoot, { recursive: true });
  git(project, ["init", "-b", "main"]);
  git(project, ["config", "user.name", "Campaign Supervisor Proof"]);
  git(project, ["config", "user.email", "campaign-supervisor@example.invalid"]);
  git(project, ["config", "commit.gpgsign", "false"]);
  fs.mkdirSync(path.join(project, "openspec"), { recursive: true });
  fs.writeFileSync(path.join(project, "openspec", "config.yaml"), "schema: spec-driven\n", "utf8");
  fs.writeFileSync(path.join(project, "src", "index.ts"), "export const ready = true;\n", "utf8");
  fs.writeFileSync(path.join(project, ".gitignore"), ".opencode-dev-kit/\n.work-campaign/\n", "utf8");
  writeJson(path.join(project, "adapter.json"), {
    adapterId: "supervisor-fixture",
    inventoryArgv: [process.execPath, "--version"],
    realBoundaryProofArgv: [process.execPath, "--version"],
    schemaVersion: 1,
  });
  writeJson(path.join(project, "campaign.json"), {
    adapterPath: "adapter.json",
    allowedEffects: ["local-read"],
    authorizationRefs: {},
    budgets: { evidenceBytes: 1_048_576, modelCalls: 1, processAttempts: 2, wallClockSeconds: 300, waves: 1 },
    campaignId: "supervisor-fixture",
    checkpoint: { localCommitAuthorized: false, mode: "evidence-only", workspace: "persistent" },
    evidencePath: ".work-campaign/evidence",
    exclusions: [".work-campaign/evidence"],
    hostResume: { enabled: false, supervisorRequired: false },
    outcome: "Inspect one provider-free supervisor fixture.",
    playbook: "audit-remediate",
    protectedDecisionPolicy: "owner-required",
    reportPath: ".work-campaign/report.md",
    schemaVersion: 1,
    scopeRoots: ["src"],
    statePath: ".opencode-dev-kit/runtime/work-campaigns/supervisor-fixture",
    stopPolicy: { onBudgetExhausted: true, onExplicitStop: true, onOwnerRequired: true, onProtected: true, onUnknown: true },
    validationArgv: [process.execPath, "--version"],
  });
  git(project, ["add", ".gitignore", "adapter.json", "campaign.json", "openspec/config.yaml", "src/index.ts"]);
  git(project, ["commit", "-m", "configure supervisor fixture"]);
  const definitionDigest = loadWorkCampaignDefinition(project, "campaign.json").definitionDigest;
  const registry = path.join(supervisorRoot, "registry.json");
  writeRegistry(registry, project, definitionDigest, "http://127.0.0.1:9");
  return { definitionDigest, project, registry, supervisorRoot };
}

function writeRegistry(file: string, project: string, definitionDigest: string, endpoint: string): void {
  writeJson(file, {
    policy: {
      backoffMs: [10],
      commandTimeoutMs: 10_000,
      healthPollMs: 10,
      healthTimeoutMs: 100,
      logBytes: 16_384,
      logGenerations: 2,
      maxRestarts: 1,
    },
    registrations: [{ definitionDigest, definitionPath: "campaign.json", enabled: true, id: "supervisor-fixture", root: project }],
    runtime: { endpoint, expectedVersion: "1.18.23" },
    schemaVersion: 1,
    workCampaignDigest: sha256(workCampaignCli),
  });
}

function startHealthServer(directory: string, password: string): { endpoint: string; pid: number } {
  const endpointFile = path.join(directory, "endpoint.txt");
  const script = path.join(directory, "server.mjs");
  const authorization = `Basic ${Buffer.from(`opencode:${password}`, "utf8").toString("base64")}`;
  fs.writeFileSync(script, [
    'import fs from "node:fs";',
    'import http from "node:http";',
    `const authorization = ${JSON.stringify(authorization)};`,
    `const endpointFile = ${JSON.stringify(endpointFile)};`,
    'const server = http.createServer((request, response) => {',
    '  if (request.url !== "/global/health" || request.headers.authorization !== authorization) { response.writeHead(401); response.end(); return; }',
    '  response.setHeader("content-type", "application/json");',
    '  response.end(JSON.stringify({ healthy: true, version: "1.18.23" }));',
    '});',
    'server.listen(0, "127.0.0.1", () => fs.writeFileSync(endpointFile, `http://127.0.0.1:${server.address().port}`, "utf8"));',
  ].join("\n"), "utf8");
  const child = spawn(process.execPath, [script], { cwd: directory, shell: false, stdio: "ignore" });
  assert.ok(child.pid != null);
  for (let attempt = 0; attempt < 100 && !fs.existsSync(endpointFile); attempt++) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 25);
  assert.ok(fs.existsSync(endpointFile));
  return { endpoint: fs.readFileSync(endpointFile, "utf8"), pid: child.pid };
}

function stopOwned(pid: number): void {
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { shell: false, timeout: 10_000 });
  } else {
    try { process.kill(pid, "SIGTERM"); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error; }
  }
}

test("supervisor status and unavailable runtime remain effect-free and independent", async () => {
  const current = fixture();
  const privatePassword = "supervisor-private-password-proof";
  const environment = { ...process.env, OPENCODE_SERVER_PASSWORD: privatePassword };
  try {
    const help = command(root, process.execPath, [supervisorCli, "--help"], environment);
    assert.equal(help.status, 0, help.stderr);
    assert.match(help.stdout, /run\|status\|stop/u);
    const relativeRegistry = command(root, process.execPath, [supervisorCli, "status", "--registry", "registry.json"], environment);
    assert.equal(relativeRegistry.status, 2);
    assert.equal(JSON.parse(relativeRegistry.stderr).field, "registry");
    const before = command(current.project, "git", ["status", "--porcelain=v1", "--untracked-files=all"]);
    assert.equal(before.stdout, "");
    const status = command(root, process.execPath, [supervisorCli, "status", "--registry", current.registry], environment);
    assert.equal(status.status, 0, status.stderr);
    const report = JSON.parse(status.stdout);
    assert.equal(report.runtime.healthy, false);
    assert.equal(report.rows[0].reason, "not-started");
    assert.equal(report.rows[0].campaign.supervision.action, "suppress");
    assert.equal(fs.existsSync(path.join(current.supervisorRoot, "runtime")), false);
    const run = command(root, process.execPath, [supervisorCli, "run", "--registry", current.registry], environment);
    assert.equal(run.status, 0, run.stderr);
    assert.equal(JSON.parse(run.stdout).rows[0].reason, "runtime-not-ready");
    assert.equal(fs.existsSync(path.join(current.supervisorRoot, "runtime")), false);
    const stop = command(root, process.execPath, [supervisorCli, "stop", "--registry", current.registry, "--registration", "supervisor-fixture"], environment);
    assert.equal(stop.status, 0, stop.stderr);
    assert.equal(JSON.parse(stop.stdout).rows[0].state, "stopped");
    assert.equal(`${help.stdout}${status.stdout}${run.stdout}${stop.stdout}${fs.readFileSync(current.registry, "utf8")}`.includes(privatePassword), false);
    const after = command(current.project, "git", ["status", "--porcelain=v1", "--untracked-files=all"]);
    assert.equal(after.stdout, "");
  } finally {
    fs.rmSync(path.dirname(current.project), { recursive: true, force: true });
  }
});

test("supervisor registry rejects drift, unsafe paths, and unknown fields", () => {
  const current = fixture();
  try {
    const source = JSON.parse(fs.readFileSync(current.registry, "utf8"));
    for (const [name, mutate] of [
      ["entrypoint drift", (value: any) => { value.workCampaignDigest = "f".repeat(64); }],
      ["definition escape", (value: any) => { value.registrations[0].definitionPath = "../campaign.json"; }],
      ["arbitrary argv", (value: any) => { value.registrations[0].argv = ["node", "unsafe.mjs"]; }],
    ] as const) {
      const candidate = structuredClone(source);
      mutate(candidate);
      const file = path.join(current.supervisorRoot, `${name.replaceAll(" ", "-")}.json`);
      writeJson(file, candidate);
      assert.throws(() => loadCampaignSupervisorRegistry(file), /invalid|differs|contained/u);
    }
  } finally {
    fs.rmSync(path.dirname(current.project), { recursive: true, force: true });
  }
});

test("supervisor live lease suppresses a duplicate without clearing ownership", async () => {
  const current = fixture();
  const password = "duplicate-supervisor-proof-password";
  const health = startHealthServer(current.supervisorRoot, password);
  try {
    writeRegistry(current.registry, current.project, current.definitionDigest, health.endpoint);
    const runtime = path.join(current.supervisorRoot, "runtime", "supervisor-fixture");
    fs.mkdirSync(runtime, { recursive: true });
    writeJson(path.join(runtime, "supervisor.lock"), {
      executableDigest: sha256(process.execPath),
      owner: "campaign-supervisor",
      pid: process.pid,
      processRef: "process:existing-supervisor",
      registrationId: "supervisor-fixture",
      registryDigest: "a".repeat(64),
      schemaVersion: 1,
      startedAt: "2026-08-28T00:00:00.000Z",
    });
    const report = await runCampaignSupervisor({
      environment: { ...process.env, OPENCODE_SERVER_PASSWORD: password },
      operation: "run",
      registryPath: current.registry,
    });
    assert.equal(report.runtime.healthy, true);
    assert.equal(report.rows[0].state, "unknown");
    assert.equal(report.rows[0].reason, "duplicate-supervisor");
    assert.equal(fs.existsSync(path.join(runtime, "supervisor.lock")), true);
  } finally {
    stopOwned(health.pid);
    fs.rmSync(path.dirname(current.project), { recursive: true, force: true });
  }
});
