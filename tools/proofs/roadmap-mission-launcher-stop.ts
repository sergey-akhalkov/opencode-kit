#!/usr/bin/env bun
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { proofClient } from "./lib/opencode-proof-client.ts";
import { removeProofFixture } from "./lib/proof-process-cleanup.ts";
import { createRoadmapMissionLauncher } from "../../global/extensions/roadmap-mission-launcher.ts";
import { SHARED_PTY_MANAGER } from "../../global/extensions/opencode-pty-bridge.ts";

type Mode = "capture" | "replay";
type Options = {
  candidateId: string;
  evidenceRoot: string;
  help: boolean;
  inputRoot: string | null;
  mode: Mode;
};

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function usage(): string {
  return [
    "Usage:",
    "  bun tools/proofs/roadmap-mission-launcher-stop.ts --mode capture --candidate-id <id> --evidence-root <absolute-new-path>",
    "  bun tools/proofs/roadmap-mission-launcher-stop.ts --mode replay --candidate-id <id> --input-root <capture-path> --evidence-root <absolute-new-path>",
  ].join("\n");
}

function required(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value == null || value.trim() === "" || value.startsWith("--")) throw new Error(`Missing value for ${option}`);
  return value;
}

function options(args: string[]): Options {
  if (args.length === 1 && (args[0] === "--help" || args[0] === "-h")) {
    return { candidateId: "help", evidenceRoot: sourceRoot, help: true, inputRoot: null, mode: "capture" };
  }
  let candidateId = "";
  let evidenceRoot = "";
  let inputRoot = "";
  let mode = "";
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--candidate-id") {
      candidateId = required(args, index, arg);
      index++;
    } else if (arg === "--evidence-root") {
      evidenceRoot = required(args, index, arg);
      index++;
    } else if (arg === "--input-root") {
      inputRoot = required(args, index, arg);
      index++;
    } else if (arg === "--mode") {
      mode = required(args, index, arg);
      index++;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (mode !== "capture" && mode !== "replay") throw new Error("--mode must be capture or replay");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(candidateId)) throw new Error("--candidate-id must be a safe identifier");
  if (!path.isAbsolute(evidenceRoot)) throw new Error("--evidence-root must be absolute");
  if (mode === "replay" && !path.isAbsolute(inputRoot)) throw new Error("replay requires absolute --input-root");
  if (mode === "capture" && inputRoot !== "") throw new Error("capture does not accept --input-root");
  return {
    candidateId,
    evidenceRoot: path.resolve(evidenceRoot),
    help: false,
    inputRoot: inputRoot === "" ? null : path.resolve(inputRoot),
    mode,
  };
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value == null || typeof value !== "object") return value;
  const input = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(input).sort().map((key) => [key, stableValue(input[key])]));
}

function json(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

function record(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function writeNew(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, { encoding: "utf8", flag: "wx" });
}

function hash(file: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function redact(text: string, replacements: Array<[string, string]>): string {
  return replacements.reduce((result, [value, placeholder]) => result
    .replaceAll(value, placeholder)
    .replaceAll(value.replaceAll("\\", "/"), placeholder), text);
}

function writeFakeOpenSpec(bin: string): void {
  writeNew(path.join(bin, "fake-openspec.mjs"), [
    "const args = process.argv.slice(2);",
    "if (args[0] === '--version') { console.log('1.6.0'); process.exit(0); }",
    "if (args[0] === 'list' && args.includes('--json')) { console.log(JSON.stringify({ changes: [] })); process.exit(0); }",
    "console.error(`unsupported openspec fixture args: ${args.join(' ')}`);",
    "process.exit(1);",
    "",
  ].join("\n"));
  if (process.platform === "win32") {
    writeNew(path.join(bin, "openspec.cmd"), `@echo off\r\n"${process.execPath}" "%~dp0fake-openspec.mjs" %*\r\n`);
  } else {
    const executable = path.join(bin, "openspec");
    writeNew(executable, `#!/bin/sh\nexec "${process.execPath}" "$(dirname "$0")/fake-openspec.mjs" "$@"\n`);
    fs.chmodSync(executable, 0o755);
  }
}

function git(root: string, args: string[]): void {
  const result = Bun.spawnSync(["git", ...args], { cwd: root, stdout: "pipe", stderr: "pipe" });
  if (result.exitCode !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr.toString() || result.stdout.toString()}`);
}

function writeProject(project: string): void {
  const mission = (missionId: string) => ({
    allowedEffects: ["local-read", "local-write"],
    authorizationRefs: {},
    checkpoint: { localCommitAuthorized: false, mode: "evidence-only", workspace: "disposable" },
    evidencePath: "evidence/mission",
    missionId,
    roadmapPath: "docs/roadmap.md",
    schemaVersion: 1,
    slices: [{
      changeId: "change-a",
      dependsOn: [],
      effectClasses: ["local-read", "local-write"],
      id: "slice-a",
      operation: "propose",
      outcome: "Run the harmless visible-controller fixture.",
      ownedPaths: ["openspec/changes/change-a"],
    }],
    stopPolicy: { onExternalBlocked: true, onOwnerRequired: true, onUnknown: true },
    validationArgv: ["node", "tools/validate.mjs"],
    workflowOwner: { mode: "global-canonical" },
  });
  writeNew(path.join(project, "AGENTS.md"), "# Disposable Launcher Stop Proof\n\n## Runtime Authority\n");
  writeNew(path.join(project, "docs", "roadmap.md"), "# Disposable Roadmap\n");
  writeNew(path.join(project, "opencode-dev-kit", "missions", "launcher-loss.json"), json(mission("launcher-loss")));
  writeNew(path.join(project, "opencode-dev-kit", "missions", "launcher-proof.json"), json(mission("launcher-proof")));
  writeNew(path.join(project, "opencode-dev-kit", "controller-adapter.json"), json({
    executorArgv: ["node", "tools/harmless-executor.mjs"],
    maxAttemptsPerSlice: 2,
    maxWallClockMsPerSlice: 60_000,
    schemaVersion: 1,
  }));
  writeNew(path.join(project, "opencode-dev-kit", "adapter.json"), json({
    schemaVersion: 1,
    validation: {
      build: "node tools/validate.mjs",
      focusedTest: "node tools/validate.mjs",
      lint: "node tools/validate.mjs",
      test: "node tools/validate.mjs",
      typecheck: "node tools/validate.mjs",
    },
  }));
  writeNew(path.join(project, "tools", "validate.mjs"), "process.exit(0);\n");
  writeNew(path.join(project, "tools", "harmless-executor.mjs"), [
    "console.log('launcher stop proof stdout');",
    "console.error('launcher stop proof stderr');",
    "await new Promise((resolve) => setTimeout(resolve, 30000));",
    "process.exit(1);",
    "",
  ].join("\n"));
  git(project, ["init"]);
  git(project, ["config", "user.email", "launcher-stop-proof@example.invalid"]);
  git(project, ["config", "user.name", "Launcher Stop Proof"]);
  git(project, ["add", "--", "."]);
  git(project, ["commit", "-m", "fixture"]);
}

async function waitFor(predicate: () => boolean, label: string, timeoutMs = 20_000): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (predicate()) return;
    await Bun.sleep(100);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

function statusText(requests: Array<Record<string, unknown>>): string {
  for (let index = requests.length - 1; index >= 0; index--) {
    const parts = record(requests[index].body)?.parts;
    if (!Array.isArray(parts)) continue;
    const text = parts.map((part) => record(part)?.text).find((value): value is string => typeof value === "string");
    if (text != null) return text;
  }
  return "";
}

function evaluate(raw: Record<string, unknown>, candidateId: string): Record<string, unknown> {
  const graceful = record(raw.graceful);
  const hardKill = record(raw.hardKill);
  const runtimeLoss = record(raw.runtimeLoss);
  const running = record(raw.running);
  const requests = record(raw.requests);
  const checks = {
    candidateMatched: raw.candidateId === candidateId,
    cleanupComplete: raw.cleanup === "complete",
    cockpitOpenedBeforeSpawn: requests?.cockpit === 3 && requests?.firstCockpitRequest === 0,
    gracefulActiveCleared: graceful?.activeOperation === null,
    gracefulPaused: graceful?.durableDisposition === "paused",
    gracefulTerminal: record(graceful?.pty)?.status === "exited",
    hardKillActivePreserved: hardKill?.activeOperation === "session",
    hardKillReconciled: hardKill?.durableDisposition === "paused-unknown" && hardKill?.reconciliation === "paused-unknown",
    hardKillTerminal: record(hardKill?.pty)?.status === "killed",
    noProviderCalls: raw.providerCalls === 0,
    notifyDisabled: record(running?.pty)?.notifyOnExit === false,
    runtimeLossActivePreserved: runtimeLoss?.activeOperation === "session",
    runtimeLossReconciled: runtimeLoss?.durableDisposition === "paused-unknown" && runtimeLoss?.reconciliation === "paused-unknown",
    runtimeLossPtyForgotten: runtimeLoss?.pty === null,
    streamsVisible: Number(record(running?.streamPrefixCounts)?.stderr) >= 1 && Number(record(running?.streamPrefixCounts)?.stdout) >= 1,
    stopIntentRecorded: graceful?.stopRequested === true,
  };
  return {
    candidateId,
    checks,
    liveCalls: 0,
    schemaVersion: 1,
    status: Object.values(checks).every(Boolean) ? "complete" : "blocked",
  };
}

async function command(
  hooks: Awaited<ReturnType<typeof createRoadmapMissionLauncher>>,
  name: string,
  missionId = "launcher-proof",
): Promise<void> {
  const handler = hooks["command.execute.before"];
  if (handler == null) throw new Error("launcher command hook is unavailable");
  try {
    await handler({ arguments: missionId, command: name, sessionID: "launcher-stop-root" }, {} as never);
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "Command handled by roadmap mission launcher") throw error;
  }
}

async function capture(opts: Options): Promise<void> {
  if (fs.existsSync(opts.evidenceRoot)) throw new Error("Evidence root already exists");
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "roadmap-launcher-stop-direct-"));
  const bin = path.join(fixture, "bin");
  const lossProject = path.join(fixture, "loss-project");
  const project = path.join(fixture, "project");
  const requests: Array<Record<string, unknown>> = [];
  let providerCalls = 0;
  let hooks: Awaited<ReturnType<typeof createRoadmapMissionLauncher>> | null = null;
  let raw: Record<string, unknown> | null = null;
  let cleanup = "pending";
  let failure: unknown = null;
  let failurePtys: unknown[] = [];
  fs.mkdirSync(opts.evidenceRoot, { recursive: false });
  const previousPath = process.env.PATH;
  const api = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    async fetch(request) {
      const url = new URL(request.url);
      let body: unknown = null;
      try {
        body = request.method === "GET" ? null : await request.json();
      } catch {
        body = null;
      }
      requests.push({ body, method: request.method, path: url.pathname });
      if (url.pathname.includes("chat/completions")) providerCalls++;
      if (url.pathname.endsWith("/tui/execute-command")) return Response.json(true);
      if (url.pathname.endsWith("/tui/show-toast")) return Response.json(true);
      return Response.json({});
    },
  });
  try {
    writeFakeOpenSpec(bin);
    writeProject(lossProject);
    writeProject(project);
    process.env.PATH = `${bin}${path.delimiter}${previousPath ?? ""}`;
    const client = proofClient(api.url.href, project);
    const launcherInput = {
      client: { _client: (client as unknown as { client: unknown }).client },
      directory: project,
      project: { id: "launcher-stop-proof" },
      serverUrl: api.url,
      worktree: project,
    } as never;
    hooks = await createRoadmapMissionLauncher(launcherInput, { scriptRuntime: process.execPath });

    await command(hooks, "mission-run");
    await waitFor(() => {
      const pty = SHARED_PTY_MANAGER.list().find((item) => item.title === "Roadmap mission: launcher-proof");
      return pty?.status === "running"
        && (SHARED_PTY_MANAGER.search(pty.id, /\/session\/stdout\]/)?.totalMatches ?? 0) >= 1
        && (SHARED_PTY_MANAGER.search(pty.id, /\/session\/stderr\]/)?.totalMatches ?? 0) >= 1;
    }, "running controller streams");
    await command(hooks, "mission-status");
    const running = JSON.parse(statusText(requests)) as Record<string, unknown>;

    await command(hooks, "mission-stop");
    await waitFor(() => SHARED_PTY_MANAGER.list().some((item) => item.title === "Roadmap mission: launcher-proof" && item.status === "exited"), "graceful controller exit");
    await command(hooks, "mission-status");
    const graceful = JSON.parse(statusText(requests)) as Record<string, unknown>;

    await command(hooks, "mission-resume");
    await waitFor(() => {
      const rows = SHARED_PTY_MANAGER.list().filter((item) => item.title === "Roadmap mission: launcher-proof");
      const pty = rows.at(-1);
      return pty?.status === "running" && (SHARED_PTY_MANAGER.search(pty.id, /\/session\/stdout\]/)?.totalMatches ?? 0) >= 1;
    }, "resumed controller");
    const active = SHARED_PTY_MANAGER.list().filter((item) => item.title === "Roadmap mission: launcher-proof").at(-1);
    if (active == null || !SHARED_PTY_MANAGER.kill(active.id)) throw new Error("proof-owned PTY hard kill failed");
    await waitFor(() => SHARED_PTY_MANAGER.get(active.id)?.status === "killed", "hard-killed controller closure");
    await command(hooks, "mission-status");
    const hardKill = JSON.parse(statusText(requests)) as Record<string, unknown>;

    await hooks.dispose?.();
    hooks = null;
    const lossClient = proofClient(api.url.href, lossProject);
    const lossLauncherInput = {
      client: { _client: (lossClient as unknown as { client: unknown }).client },
      directory: lossProject,
      project: { id: "launcher-loss-proof" },
      serverUrl: api.url,
      worktree: lossProject,
    } as never;
    hooks = await createRoadmapMissionLauncher(lossLauncherInput, { scriptRuntime: process.execPath });
    await command(hooks, "mission-run", "launcher-loss");
    await waitFor(() => {
      const pty = SHARED_PTY_MANAGER.list().find((item) => item.title === "Roadmap mission: launcher-loss" && item.status === "running");
      return pty != null && (SHARED_PTY_MANAGER.search(pty.id, /\/session\/stdout\]/)?.totalMatches ?? 0) >= 1;
    }, "runtime-loss mission controller");
    await hooks.dispose?.();
    hooks = null;
    const lossPty = SHARED_PTY_MANAGER.list().find((item) => item.title === "Roadmap mission: launcher-loss" && item.status === "running");
    if (lossPty == null || !SHARED_PTY_MANAGER.kill(lossPty.id)) throw new Error("runtime-loss PTY termination failed");
    await waitFor(() => SHARED_PTY_MANAGER.get(lossPty.id)?.status === "killed", "runtime-loss controller closure");
    hooks = await createRoadmapMissionLauncher(lossLauncherInput, { scriptRuntime: process.execPath });
    await command(hooks, "mission-status", "launcher-loss");
    const runtimeLoss = JSON.parse(statusText(requests)) as Record<string, unknown>;
    const requestPaths = requests.map((item) => String(item.path));
    raw = {
      candidateId: opts.candidateId,
      cleanup: "pending",
      fixture: {
        adapterSha256: hash(path.join(project, "opencode-dev-kit", "controller-adapter.json")),
        lossMissionSha256: hash(path.join(lossProject, "opencode-dev-kit", "missions", "launcher-loss.json")),
        missionSha256: hash(path.join(project, "opencode-dev-kit", "missions", "launcher-proof.json")),
      },
      graceful,
      hardKill,
      mode: "capture",
      providerCalls,
      requests: {
        cockpit: requestPaths.filter((value) => value.endsWith("/tui/execute-command")).length,
        firstCockpitRequest: requestPaths.findIndex((value) => value.endsWith("/tui/execute-command")),
        prompts: requestPaths.filter((value) => value.includes("/message")).length,
        toasts: requestPaths.filter((value) => value.endsWith("/tui/show-toast")).length,
      },
      runtimeLoss,
      running,
      schemaVersion: 1,
    };
  } catch (error) {
    failure = error;
    const replacements: Array<[string, string]> = [
      [fixture, "<fixture>"],
      [sourceRoot, "<source-root>"],
      [os.homedir(), "<home>"],
    ];
    failurePtys = SHARED_PTY_MANAGER.list().map((pty) => ({
      ...pty,
      args: pty.args.map((value) => redact(value, replacements)),
      command: redact(pty.command, replacements),
      output: redact(SHARED_PTY_MANAGER.getRawBuffer(pty.id)?.raw.slice(-8_000) ?? "", replacements),
      workdir: redact(pty.workdir, replacements),
    }));
  } finally {
    try {
      if (hooks?.dispose != null) await hooks.dispose();
      SHARED_PTY_MANAGER.clearAllSessions();
      api.stop(true);
      process.env.PATH = previousPath;
      removeProofFixture(fixture);
      cleanup = "complete";
    } catch (error) {
      cleanup = "failed";
      failure ??= error;
    }
  }
  if (raw != null) {
    raw.cleanup = cleanup;
    writeNew(path.join(opts.evidenceRoot, "raw.json"), json(raw));
    const evaluation = evaluate(raw, opts.candidateId);
    writeNew(path.join(opts.evidenceRoot, "evaluation.json"), json(evaluation));
    console.log(json({ candidateId: opts.candidateId, evidenceRoot: "<evidence-root>", mode: "capture", status: evaluation.status }).trimEnd());
    if (evaluation.status !== "complete") process.exitCode = 1;
  }
  if (failure != null || raw == null) {
    writeNew(path.join(opts.evidenceRoot, "failure.json"), json({
      candidateId: opts.candidateId,
      cleanup,
      deliveredText: statusText(requests).slice(0, 4_000),
      error: failure instanceof Error ? failure.message.slice(0, 4_000) : String(failure),
      ptys: failurePtys,
      providerCalls,
      requestPaths: requests.map((item) => item.path),
      schemaVersion: 1,
      status: "failed",
    }));
    throw failure instanceof Error ? failure : new Error(String(failure));
  }
}

function replay(opts: Options): void {
  if (opts.inputRoot == null) throw new Error("replay requires --input-root");
  if (fs.existsSync(opts.evidenceRoot)) throw new Error("Evidence root already exists");
  const raw = JSON.parse(fs.readFileSync(path.join(opts.inputRoot, "raw.json"), "utf8")) as Record<string, unknown>;
  const evaluation = evaluate(raw, opts.candidateId);
  fs.mkdirSync(opts.evidenceRoot, { recursive: false });
  writeNew(path.join(opts.evidenceRoot, "evaluation.json"), json(evaluation));
  console.log(json({ candidateId: opts.candidateId, evidenceRoot: "<evidence-root>", liveCalls: 0, mode: "replay", status: evaluation.status }).trimEnd());
  if (evaluation.status !== "complete") process.exitCode = 1;
}

const parsed = options(process.argv.slice(2));
const execution = parsed.help
  ? Promise.resolve().then(() => console.log(usage()))
  : parsed.mode === "replay"
    ? Promise.resolve().then(() => replay(parsed))
    : capture(parsed);
execution.catch((error) => {
  console.error(json({ error: error instanceof Error ? error.message : String(error), status: "blocked" }).trimEnd());
  process.exitCode = 1;
});
