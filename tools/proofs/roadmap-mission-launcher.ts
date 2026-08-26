#!/usr/bin/env bun
import { spawn, spawnSync } from "node:child_process";
import type { ChildProcessWithoutNullStreams } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  isolatedProofServerEnvironment,
  probeProofServer,
  proofClient,
  proofErrorFacts,
  PROOF_SERVER_CONFIG_LOAD_MS,
  PROOF_SERVER_PLUGIN_READY_MS,
  proofServerStartupFacts,
  requestData,
  seedProofConfigDependencies,
} from "./lib/opencode-proof-client.ts";
import { removeProofFixture, stopProofProcessTree } from "./lib/proof-process-cleanup.ts";

type Options = {
  candidateId: string;
  evidenceRoot: string;
  help: boolean;
  inputRoot: string | null;
  mode: "capture" | "diagnose" | "launch-diagnose" | "preflight-capture" | "recover" | "reject-capture" | "replay" | "stop-capture";
};

type ServerProcess = {
  child: ChildProcessWithoutNullStreams;
  readyMs: number;
  commandNames: string[];
  launcherReady: boolean;
  stderr: string[];
  stdout: string[];
  url: string;
};

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function usage(): string {
  return [
    "Usage:",
    "  bun tools/proofs/roadmap-mission-launcher.ts --mode capture --candidate-id <id> --evidence-root <absolute-new-path>",
    "  bun tools/proofs/roadmap-mission-launcher.ts --mode diagnose --candidate-id <id> --evidence-root <absolute-new-path>",
    "  bun tools/proofs/roadmap-mission-launcher.ts --mode launch-diagnose --candidate-id <id> --evidence-root <absolute-new-path>",
    "  bun tools/proofs/roadmap-mission-launcher.ts --mode preflight-capture --candidate-id <id> --evidence-root <absolute-new-path>",
    "  bun tools/proofs/roadmap-mission-launcher.ts --mode recover --candidate-id <id> --input-root <proof-fixture-path> --evidence-root <absolute-new-path>",
    "  bun tools/proofs/roadmap-mission-launcher.ts --mode reject-capture --candidate-id <id> --evidence-root <absolute-new-path>",
    "  bun tools/proofs/roadmap-mission-launcher.ts --mode stop-capture --candidate-id <id> --evidence-root <absolute-new-path>",
    "  bun tools/proofs/roadmap-mission-launcher.ts --mode replay --candidate-id <id> --input-root <capture-path> --evidence-root <absolute-new-path>",
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
  if (mode !== "capture" && mode !== "diagnose" && mode !== "launch-diagnose" && mode !== "preflight-capture" && mode !== "recover" && mode !== "reject-capture" && mode !== "replay" && mode !== "stop-capture") {
    throw new Error("--mode must be capture, diagnose, launch-diagnose, preflight-capture, recover, reject-capture, replay, or stop-capture");
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(candidateId)) throw new Error("--candidate-id must be a safe identifier");
  if (!path.isAbsolute(evidenceRoot)) throw new Error("--evidence-root must be absolute");
  if ((mode === "recover" || mode === "replay") && !path.isAbsolute(inputRoot)) throw new Error(`${mode} requires absolute --input-root`);
  if (mode !== "recover" && mode !== "replay" && inputRoot !== "") throw new Error("capture and diagnose do not accept --input-root");
  return {
    candidateId,
    evidenceRoot: path.resolve(evidenceRoot),
    help: false,
    inputRoot: inputRoot === "" ? null : path.resolve(inputRoot),
    mode: mode as Options["mode"],
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

function redactedLog(text: string, replacements: Array<[string, string]>): string {
  return replacements.reduce((result, [value, placeholder]) => result
    .replaceAll(value, placeholder)
    .replaceAll(value.replaceAll("\\", "\\\\"), placeholder), text);
}

function stage(evidenceRoot: string, name: string, detail: Record<string, unknown> = {}): void {
  fs.appendFileSync(path.join(evidenceRoot, "progress.jsonl"), `${JSON.stringify({ at: new Date().toISOString(), name, ...detail })}\n`, "utf8");
}

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address != null ? address.port : 0;
      server.close((error) => error == null ? resolve(port) : reject(error));
    });
  });
}

function providerSimulator(): { calls: () => number; server: ReturnType<typeof Bun.serve> } {
  let calls = 0;
  const server = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    async fetch(request) {
      const url = new URL(request.url);
      if (url.pathname !== "/v1/chat/completions") return new Response("not found", { status: 404 });
      calls++;
      return Response.json({
        id: `launcher-proof-${calls}`,
        object: "chat.completion",
        created: 1,
        model: "proof-model",
        choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: "Unexpected provider call." } }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      });
    },
  });
  return { calls: () => calls, server };
}

function writeConfig(configDir: string): void {
  const bridge = pathToFileURL(path.join(sourceRoot, "global", "extensions", "opencode-pty-bridge.ts")).href;
  const launcher = pathToFileURL(path.join(sourceRoot, "global", "extensions", "roadmap-mission-launcher.ts")).href;
  writeNew(path.join(configDir, "opencode.json"), json({
    $schema: "https://opencode.ai/config.json",
    permission: "allow",
    plugin: [bridge, [launcher, { scriptRuntime: process.execPath }]],
  }));
  seedProofConfigDependencies(configDir, path.join(sourceRoot, "global"));
}

function mission(): string {
  return json({
    allowedEffects: ["local-read", "local-write"],
    authorizationRefs: {},
    checkpoint: { localCommitAuthorized: false, mode: "evidence-only", workspace: "disposable" },
    evidencePath: "evidence/mission",
    missionId: "launcher-proof",
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
    const file = path.join(bin, "openspec");
    writeNew(file, `#!/bin/sh\nexec "${process.execPath}" "$(dirname "$0")/fake-openspec.mjs" "$@"\n`);
    fs.chmodSync(file, 0o755);
  }
}

function git(root: string, args: string[]): void {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", shell: false });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
}

function writeProject(project: string): void {
  writeNew(path.join(project, "AGENTS.md"), "# Disposable Launcher Proof\n\n## Runtime Authority\n");
  writeNew(path.join(project, "docs", "roadmap.md"), "# Disposable Roadmap\n");
  writeNew(path.join(project, "opencode-dev-kit", "missions", "launcher-proof.json"), mission());
  writeNew(path.join(project, "opencode-dev-kit", "controller-adapter.json"), json({
    executorArgv: ["node", "tools/harmless-executor.mjs"],
    maxAttemptsPerSlice: 1,
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
  writeNew(path.join(project, "tools", "harmless-executor.mjs"), "console.log('harmless launcher proof stdout');\nconsole.error('harmless launcher proof stderr');\nawait new Promise((resolve) => setTimeout(resolve, 30000));\nprocess.exit(1);\n");
  git(project, ["init"]);
  git(project, ["config", "user.email", "launcher-proof@example.invalid"]);
  git(project, ["config", "user.name", "Launcher Proof"]);
  git(project, ["add", "--", "."]);
  git(project, ["commit", "-m", "fixture"]);
}

async function startOpenCode(
  configDir: string,
  runtimeRoot: string,
  project: string,
  bin: string,
  diagnosticOnly: boolean,
): Promise<ServerProcess> {
  const startedAt = Date.now();
  const port = await freePort();
  const environment = isolatedProofServerEnvironment(process.env, configDir, runtimeRoot);
  environment.PATH = `${bin}${path.delimiter}${environment.PATH ?? ""}`;
  const child = spawn("opencode", ["serve", "--hostname", "127.0.0.1", "--port", String(port), "--print-logs", "--log-level", "INFO"], {
    cwd: project,
    env: environment,
    shell: false,
    stdio: "pipe",
  });
  const stdout: string[] = [];
  const stderr: string[] = [];
  child.stdout.on("data", (chunk) => stdout.push(String(chunk)));
  child.stderr.on("data", (chunk) => stderr.push(String(chunk)));
  const url = `http://127.0.0.1:${port}`;
  const client = proofClient(url, project);
  const configDeadline = startedAt + PROOF_SERVER_CONFIG_LOAD_MS;
  let pluginDeadline: number | null = null;
  let lastError: unknown = null;
  let commandNames: string[] = [];
  while (true) {
    const now = Date.now();
    const startup = proofServerStartupFacts(stdout.join(""), stderr.join(""), configDir);
    if (startup.isolatedConfigLoaded && pluginDeadline == null) pluginDeadline = now + PROOF_SERVER_PLUGIN_READY_MS;
    if ((!startup.isolatedConfigLoaded && now >= configDeadline) || (pluginDeadline != null && now >= pluginDeadline)) break;
    if (child.exitCode != null) throw new Error(`OpenCode server exited ${child.exitCode}: ${stderr.join("").slice(-1_000)}`);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(new Error("Launcher command inventory timed out")), 5_000);
      let commands: Array<{ id?: string; name?: string }>;
      try {
        commands = await requestData<Array<{ id?: string; name?: string }>>(
          client.command.list({ directory: project }, { signal: controller.signal }) as Promise<unknown>,
          "launcher command inventory",
        );
      } finally {
        clearTimeout(timer);
      }
      commandNames = commands.flatMap((row) => typeof row.name === "string" ? [row.name] : typeof row.id === "string" ? [row.id] : []).sort();
      if (["mission-run", "mission-resume", "mission-status", "mission-stop"].every((name) => commandNames.includes(name))) {
        return { child, commandNames, launcherReady: true, readyMs: Date.now() - startedAt, stderr, stdout, url };
      }
      lastError = new Error("Launcher commands are not loaded yet");
    } catch (error) {
      lastError = error;
    }
    await Bun.sleep(100);
  }
  const diagnostics = {
    commandNames,
    errorChain: proofErrorFacts(lastError),
    probes: await probeProofServer(url),
    startup: proofServerStartupFacts(stdout.join(""), stderr.join(""), configDir),
  };
  if (diagnosticOnly) {
    return { child, commandNames, launcherReady: false, readyMs: Date.now() - startedAt, stderr, stdout, url };
  }
  await stopProofProcessTree(child);
  throw new Error(`OpenCode launcher proof server was not ready: ${JSON.stringify(diagnostics)}`);
}

function commandFact(response: unknown): Record<string, unknown> {
  const value = response as { data?: unknown; error?: unknown };
  return {
    data: value?.data == null ? null : value.data,
    error: value?.error == null ? null : proofErrorFacts(value.error),
  };
}

async function messageText(client: ReturnType<typeof proofClient>, project: string, sessionID: string): Promise<string> {
  const messages = await requestData<Array<Record<string, unknown>>>(client.session.messages({
    directory: project,
    sessionID,
    limit: 100,
  }) as Promise<unknown>, "launcher proof messages");
  return messages.flatMap((message) => {
    const parts = Array.isArray(message.parts) ? message.parts : [];
    return parts.flatMap((part) => typeof record(part)?.text === "string" ? [String(record(part)!.text)] : []);
  }).join("\n");
}

async function waitForStatus(
  client: ReturnType<typeof proofClient>,
  project: string,
  sessionID: string,
  predicate: (text: string) => boolean,
  timeoutMs: number,
): Promise<{ response: unknown; text: string }> {
  const deadline = Date.now() + timeoutMs;
  let text = "";
  let response: unknown = null;
  do {
    response = await client.session.command({
      arguments: "launcher-proof",
      command: "mission-status",
      directory: project,
      sessionID,
    }) as unknown;
    text = await messageText(client, project, sessionID);
    if (predicate(text)) return { response, text };
    await Bun.sleep(500);
  } while (Date.now() < deadline);
  const error = new Error(`Launcher status observation timed out; message chars=${text.length}`) as Error & { observedText?: string };
  error.observedText = text;
  throw error;
}

function evaluateRaw(raw: Record<string, unknown>, candidateId: string): Record<string, unknown> {
  const running = String(raw.runningStatus ?? "");
  const terminal = String(raw.terminalStatus ?? "");
  const server = record(raw.server);
  const checks = {
    candidateMatched: raw.candidateId === candidateId,
    cleanupComplete: raw.cleanup === "complete",
    cockpitOpened: running.includes('"visibility": "opened"'),
    currentRuntimeCorrelated: running.includes('"runtimeRef":') && running.includes('"rootSessionRef":'),
    fixedRuntime: running.includes('"runtimeExecutable": "bun.exe"') || running.includes('"runtimeExecutable": "bun"') || running.includes('"runtimeExecutable": "node.exe"') || running.includes('"runtimeExecutable": "node"'),
    noProviderCalls: raw.providerCalls === 0,
    notifyOnExitFalse: running.includes('"notifyOnExit": false'),
    ptyExited: terminal.includes('"status": "exited"'),
    ptyRunning: running.includes('"status": "running"'),
    serverIsolated: record(server?.startup)?.isolatedConfigLoaded === true && record(server?.startup)?.hostConfigLoaded === false,
    terminalCallbackObserved: terminal.includes('"terminalNotified": true'),
    terminalToastSent: terminal.includes('"terminalToast": "sent"'),
  };
  return {
    candidateId,
    checks,
    liveCalls: 0,
    schemaVersion: 1,
    status: Object.values(checks).every(Boolean) ? "complete" : "blocked",
  };
}

function evaluateDiagnostic(raw: Record<string, unknown>, candidateId: string): Record<string, unknown> {
  const server = record(raw.server);
  const stderr = String(server?.stderrTail ?? "");
  const commandNames = Array.isArray(raw.commandNames) ? raw.commandNames.map(String) : [];
  const ready = raw.launcherReady === true && ["mission-run", "mission-resume", "mission-status", "mission-stop"].every((name) => commandNames.includes(name));
  const exactFailure = raw.launcherReady === false && stderr.includes("failed to load plugin") && stderr.includes("OpenCode has no fixed colocated Node/Bun script runtime");
  const checks = {
    candidateMatched: raw.candidateId === candidateId,
    cleanupComplete: raw.cleanup === "complete",
    exactOutcomeCaptured: ready || exactFailure,
    isolatedConfigLoaded: record(server?.startup)?.isolatedConfigLoaded === true && record(server?.startup)?.hostConfigLoaded === false,
    noProviderCalls: raw.providerCalls === 0,
  };
  return {
    candidateId,
    checks,
    liveCalls: 0,
    proof: false,
    schemaVersion: 1,
    status: Object.values(checks).every(Boolean) ? "complete" : "blocked",
  };
}

function evaluateLaunchDiagnostic(raw: Record<string, unknown>, candidateId: string): Record<string, unknown> {
  const checks = {
    candidateMatched: raw.candidateId === candidateId,
    cleanupComplete: raw.cleanup === "complete",
    commandFactsCaptured: record(raw.commands) != null,
    firstStatusCaptured: typeof raw.observedStatus === "string" && raw.observedStatus.length > 0,
    launcherLoaded: raw.launcherReady === true,
    noProviderCalls: raw.providerCalls === 0,
  };
  return {
    candidateId,
    checks,
    liveCalls: 0,
    proof: false,
    schemaVersion: 1,
    status: Object.values(checks).every(Boolean) ? "complete" : "blocked",
  };
}

function evaluateRecovery(raw: Record<string, unknown>, candidateId: string): Record<string, unknown> {
  const checks = {
    candidateMatched: raw.candidateId === candidateId,
    cleanupComplete: raw.cleanup === "complete",
    configLoadOnly: raw.openCodeCreatedSession === false,
    fixtureWasProofOwned: raw.fixtureWasProofOwned === true,
    noMissionFiles: Array.isArray(raw.missionFiles) && raw.missionFiles.length === 0,
    projectClean: raw.projectGitStatus === "",
  };
  return {
    candidateId,
    checks,
    liveCalls: 0,
    proof: false,
    schemaVersion: 1,
    status: Object.values(checks).every(Boolean) ? "complete" : "blocked",
  };
}

function evaluateFailedCapture(raw: Record<string, unknown>, candidateId: string): Record<string, unknown> {
  const observed = String(raw.observedStatus ?? "");
  const checks = {
    candidateMatched: raw.candidateId === candidateId,
    cleanupComplete: raw.cleanup === "complete",
    exactOracleGapCaptured: observed.includes('"status": "running"') && observed.includes('"status": "exited"') && observed.includes('"disposition": "not-started"'),
    noProviderCalls: raw.providerCalls === 0,
  };
  return {
    candidateId,
    checks,
    liveCalls: 0,
    proof: false,
    schemaVersion: 1,
    status: Object.values(checks).every(Boolean) ? "complete" : "blocked",
  };
}

function evaluateRejectedInputs(raw: Record<string, unknown>, candidateId: string): Record<string, unknown> {
  const observed = String(raw.observedStatus ?? "");
  const blockedCount = observed.split("Mission command blocked: mission id must be a safe lowercase identifier").length - 1;
  const checks = {
    candidateMatched: raw.candidateId === candidateId,
    cleanupComplete: raw.cleanup === "complete",
    noMissionRuntime: raw.missionRuntimeCreated === false,
    noProviderCalls: raw.providerCalls === 0,
    noVisibilityMutation: !observed.includes('"visibility": "opened"'),
    threeInputsBlocked: blockedCount === 3,
  };
  return {
    candidateId,
    checks,
    liveCalls: 0,
    schemaVersion: 1,
    status: Object.values(checks).every(Boolean) ? "complete" : "blocked",
  };
}

function evaluateStopCapture(raw: Record<string, unknown>, candidateId: string): Record<string, unknown> {
  const running = String(raw.runningStatus ?? "");
  const stopped = String(raw.stoppedStatus ?? "");
  const checks = {
    candidateMatched: raw.candidateId === candidateId,
    cleanupComplete: raw.cleanup === "complete",
    gracefulPaused: stopped.includes('"disposition": "paused"') && stopped.includes('"activeOperation": null'),
    noProviderCalls: raw.providerCalls === 0,
    ptyExited: stopped.includes('"status": "exited"'),
    stopIntentObserved: stopped.includes('"stopRequested": true'),
    streamPrefixesObserved: running.includes('"stderr": 1') && running.includes('"stdout": 1'),
    terminalCallbackObserved: stopped.includes('"terminalNotified": true') && stopped.includes('"terminalToast": "sent"'),
  };
  return {
    candidateId,
    checks,
    liveCalls: 0,
    schemaVersion: 1,
    status: Object.values(checks).every(Boolean) ? "complete" : "blocked",
  };
}

function evaluatePreflightCapture(raw: Record<string, unknown>, candidateId: string): Record<string, unknown> {
  const report = record(raw.report);
  const checks = {
    candidateMatched: raw.candidateId === candidateId,
    cleanupComplete: raw.cleanup === "complete",
    eligible: raw.exitCode === 0 && report?.status === "eligible",
    projectClean: raw.projectGitStatus === "",
  };
  return {
    candidateId,
    checks,
    liveCalls: 0,
    schemaVersion: 1,
    status: Object.values(checks).every(Boolean) ? "complete" : "blocked",
  };
}

function replay(opts: Options): void {
  if (opts.inputRoot == null) throw new Error("Replay input root is missing");
  if (fs.existsSync(opts.evidenceRoot)) throw new Error("Evidence root already exists");
  const raw = JSON.parse(fs.readFileSync(path.join(opts.inputRoot, "raw.json"), "utf8")) as Record<string, unknown>;
  const evaluation = raw.mode === "diagnose"
    ? evaluateDiagnostic(raw, opts.candidateId)
    : raw.mode === "launch-diagnose"
      ? evaluateLaunchDiagnostic(raw, opts.candidateId)
      : raw.mode === "recover"
        ? evaluateRecovery(raw, opts.candidateId)
        : raw.mode === "failed-capture"
          ? evaluateFailedCapture(raw, opts.candidateId)
          : raw.mode === "reject-capture"
            ? evaluateRejectedInputs(raw, opts.candidateId)
            : raw.mode === "stop-capture"
              ? evaluateStopCapture(raw, opts.candidateId)
              : raw.mode === "preflight-capture"
                ? evaluatePreflightCapture(raw, opts.candidateId)
      : evaluateRaw(raw, opts.candidateId);
  fs.mkdirSync(opts.evidenceRoot, { recursive: false });
  writeNew(path.join(opts.evidenceRoot, "evaluation.json"), json(evaluation));
  console.log(json({ candidateId: opts.candidateId, evidenceRoot: "<evidence-root>", liveCalls: 0, mode: "replay", status: evaluation.status }).trimEnd());
  if (evaluation.status !== "complete") process.exitCode = 1;
}

function fileManifest(root: string, relative = ""): Array<Record<string, unknown>> {
  const directory = path.join(root, relative);
  const entries = fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name));
  return entries.flatMap((entry) => {
    const childRelative = path.join(relative, entry.name);
    const normalized = childRelative.replaceAll("\\", "/");
    if (entry.isDirectory() && (normalized === "config/node_modules" || normalized === "project/.git")) return [];
    if (entry.isDirectory()) return fileManifest(root, childRelative);
    const file = path.join(root, childRelative);
    if (entry.isSymbolicLink()) return [{ kind: "symlink", path: normalized }];
    const stat = fs.statSync(file);
    return [{ kind: "file", path: normalized, sha256: hash(file), size: stat.size }];
  });
}

function recover(opts: Options): void {
  if (opts.inputRoot == null) throw new Error("Recovery input root is missing");
  if (fs.existsSync(opts.evidenceRoot)) throw new Error("Evidence root already exists");
  const fixture = path.resolve(opts.inputRoot);
  const temp = path.resolve(os.tmpdir());
  if (path.dirname(fixture) !== temp || !path.basename(fixture).startsWith("roadmap-launcher-proof-")) {
    throw new Error("Recovery input must be a direct proof-owned roadmap launcher fixture");
  }
  const project = path.join(fixture, "project");
  const logFile = path.join(fixture, "runtime", "data", "opencode", "log", "opencode.log");
  const status = spawnSync("git", ["status", "--short"], { cwd: project, encoding: "utf8", shell: false });
  if (status.status !== 0) throw new Error(`Recovery git status failed: ${status.stderr || status.stdout}`);
  const log = fs.existsSync(logFile) ? fs.readFileSync(logFile, "utf8") : "";
  const manifest = fileManifest(fixture);
  const missionFiles = manifest.flatMap((entry) => {
    const value = String(entry.path ?? "");
    return value.startsWith("project/.opencode-dev-kit/") || value.startsWith("project/evidence/") ? [value] : [];
  });
  const raw: Record<string, unknown> = {
    candidateId: opts.candidateId,
    cleanup: "pending",
    fixtureManifest: manifest,
    fixtureWasProofOwned: true,
    missionFiles,
    mode: "recover",
    openCodeCreatedSession: /message=created id=ses_/.test(log),
    openCodeLog: redactedLog(log.slice(-20_000), [
      [fixture, "<fixture>"],
      [sourceRoot, "<source-root>"],
      [os.homedir(), "<home>"],
    ]),
    projectGitStatus: status.stdout.trim(),
    schemaVersion: 1,
  };
  fs.mkdirSync(opts.evidenceRoot, { recursive: false });
  removeProofFixture(fixture);
  raw.cleanup = fs.existsSync(fixture) ? "failed" : "complete";
  writeNew(path.join(opts.evidenceRoot, "raw.json"), json(raw));
  const evaluation = evaluateRecovery(raw, opts.candidateId);
  writeNew(path.join(opts.evidenceRoot, "evaluation.json"), json(evaluation));
  console.log(json({ candidateId: opts.candidateId, evidenceRoot: "<evidence-root>", liveCalls: 0, mode: "recover", status: evaluation.status }).trimEnd());
  if (evaluation.status !== "complete") process.exitCode = 1;
}

function preflightCapture(opts: Options): void {
  if (fs.existsSync(opts.evidenceRoot)) throw new Error("Evidence root already exists");
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "roadmap-launcher-preflight-proof-"));
  const project = path.join(fixture, "project");
  const bin = path.join(fixture, "bin");
  let raw: Record<string, unknown> | null = null;
  let failure: unknown = null;
  let cleanup = "pending";
  try {
    writeFakeOpenSpec(bin);
    writeProject(project);
    const startedAt = Date.now();
    const result = spawnSync(process.execPath, [
      path.join(sourceRoot, "global", "bin", "roadmap-mission.ts"),
      "preflight",
      "--root",
      project,
      "--global-source",
      path.join(sourceRoot, "global"),
      "--mission",
      "opencode-dev-kit/missions/launcher-proof.json",
    ], {
      cwd: project,
      encoding: "utf8",
      env: { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH ?? ""}` },
      shell: false,
      timeout: 60_000,
    });
    let report: unknown = null;
    try {
      report = JSON.parse(result.stdout);
    } catch {
      report = null;
    }
    const gitStatus = spawnSync("git", ["status", "--short"], { cwd: project, encoding: "utf8", shell: false });
    raw = {
      candidateId: opts.candidateId,
      cleanup: "pending",
      durationMs: Date.now() - startedAt,
      exitCode: result.status,
      mode: "preflight-capture",
      projectGitStatus: gitStatus.stdout.trim(),
      report,
      schemaVersion: 1,
      signal: result.signal,
      stderr: redactedLog(result.stderr.slice(-4_000), [[project, "<project>"], [sourceRoot, "<source-root>"]]),
    };
  } catch (error) {
    failure = error;
  } finally {
    try {
      removeProofFixture(fixture);
      cleanup = "complete";
    } catch (error) {
      cleanup = "failed";
      failure ??= error;
    }
  }
  fs.mkdirSync(opts.evidenceRoot, { recursive: false });
  if (raw != null) {
    raw.cleanup = cleanup;
    writeNew(path.join(opts.evidenceRoot, "raw.json"), json(raw));
    const evaluation = evaluatePreflightCapture(raw, opts.candidateId);
    writeNew(path.join(opts.evidenceRoot, "evaluation.json"), json(evaluation));
    console.log(json({ candidateId: opts.candidateId, evidenceRoot: "<evidence-root>", liveCalls: 0, mode: opts.mode, status: evaluation.status }).trimEnd());
    if (evaluation.status !== "complete") process.exitCode = 1;
  }
  if (failure != null || raw == null) throw failure instanceof Error ? failure : new Error(String(failure));
}

async function capture(opts: Options): Promise<void> {
  if (fs.existsSync(opts.evidenceRoot)) throw new Error("Evidence root already exists");
  fs.mkdirSync(opts.evidenceRoot, { recursive: false });
  stage(opts.evidenceRoot, "capture-start");
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "roadmap-launcher-proof-"));
  const configDir = path.join(fixture, "config");
  const runtimeRoot = path.join(fixture, "runtime");
  const project = path.join(fixture, "project");
  const bin = path.join(fixture, "bin");
  const provider = providerSimulator();
  let server: ServerProcess | null = null;
  let rootID: string | null = null;
  let raw: Record<string, unknown> | null = null;
  const partial: Record<string, unknown> = {};
  let failure: unknown = null;
  let cleanup = "pending";
  try {
    writeConfig(configDir);
    writeFakeOpenSpec(bin);
    writeProject(project);
    server = await startOpenCode(configDir, runtimeRoot, project, bin, opts.mode === "diagnose");
    stage(opts.evidenceRoot, "server-ready", { pid: server.child.pid });
    if (opts.mode === "diagnose") {
      const replacements: Array<[string, string]> = [
        [configDir, "<config-dir>"],
        [runtimeRoot, "<runtime-root>"],
        [project, "<project>"],
        [fixture, "<fixture>"],
        [sourceRoot, "<source-root>"],
        [os.homedir(), "<home>"],
      ];
      raw = {
        candidateId: opts.candidateId,
        cleanup: "pending",
        commandNames: server.commandNames,
        launcherReady: server.launcherReady,
        mode: "diagnose",
        providerCalls: provider.calls(),
        schemaVersion: 1,
        server: {
          readyMs: server.readyMs,
          startup: proofServerStartupFacts(server.stdout.join(""), server.stderr.join(""), configDir),
          stderrTail: redactedLog(server.stderr.join("").slice(-4_000), replacements),
          stdoutTail: redactedLog(server.stdout.join("").slice(-4_000), replacements),
        },
      };
      stage(opts.evidenceRoot, "diagnostic-raw-ready");
    } else if (opts.mode === "stop-capture") {
      const client = proofClient(server.url, project);
      const root = await requestData<Record<string, unknown>>(client.session.create({
        directory: project,
        title: "roadmap launcher stop root",
      }) as Promise<unknown>, "launcher stop root create");
      rootID = String(root.id);
      const runResponse = await client.session.command({
        arguments: "launcher-proof",
        command: "mission-run",
        directory: project,
        sessionID: rootID,
      }) as unknown;
      const running = await waitForStatus(
        client,
        project,
        rootID,
        (text) => text.includes('"status": "running"') && text.includes('"stderr": 1') && text.includes('"stdout": 1'),
        30_000,
      );
      const stopResponse = await client.session.command({
        arguments: "launcher-proof",
        command: "mission-stop",
        directory: project,
        sessionID: rootID,
      }) as unknown;
      const stopped = await waitForStatus(
        client,
        project,
        rootID,
        (text) => text.includes('"disposition": "paused"') && text.includes('"activeOperation": null') && text.includes('"status": "exited"') && text.includes('"terminalToast": "sent"'),
        20_000,
      );
      raw = {
        candidateId: opts.candidateId,
        cleanup: "pending",
        commands: {
          run: commandFact(runResponse),
          runningStatus: commandFact(running.response),
          stop: commandFact(stopResponse),
          stoppedStatus: commandFact(stopped.response),
        },
        mode: "stop-capture",
        providerCalls: provider.calls(),
        runningStatus: running.text,
        schemaVersion: 1,
        server: {
          readyMs: server.readyMs,
          startup: proofServerStartupFacts(server.stdout.join(""), server.stderr.join(""), configDir),
        },
        stoppedStatus: stopped.text,
      };
      stage(opts.evidenceRoot, "stop-raw-ready");
    } else if (opts.mode === "reject-capture") {
      const client = proofClient(server.url, project);
      const root = await requestData<Record<string, unknown>>(client.session.create({
        directory: project,
        title: "roadmap launcher rejection root",
      }) as Promise<unknown>, "launcher rejection root create");
      rootID = String(root.id);
      const commandFacts: Record<string, unknown> = {};
      for (const [name, argument] of Object.entries({ absolute: "C:\\escape", injected: "launcher-proof --adapter evil", traversal: "../escape" })) {
        commandFacts[name] = commandFact(await client.session.command({
          arguments: argument,
          command: "mission-run",
          directory: project,
          sessionID: rootID,
        }) as unknown);
      }
      const observedStatus = await messageText(client, project, rootID);
      raw = {
        candidateId: opts.candidateId,
        cleanup: "pending",
        commands: commandFacts,
        launcherReady: server.launcherReady,
        missionRuntimeCreated: fs.existsSync(path.join(project, ".opencode-dev-kit", "runtime", "roadmap-missions")),
        mode: "reject-capture",
        observedStatus,
        providerCalls: provider.calls(),
        schemaVersion: 1,
        server: {
          readyMs: server.readyMs,
          startup: proofServerStartupFacts(server.stdout.join(""), server.stderr.join(""), configDir),
        },
      };
      stage(opts.evidenceRoot, "rejection-raw-ready");
    } else if (opts.mode === "launch-diagnose") {
      const client = proofClient(server.url, project);
      const root = await requestData<Record<string, unknown>>(client.session.create({
        directory: project,
        title: "roadmap launcher diagnostic root",
      }) as Promise<unknown>, "launcher diagnostic root create");
      rootID = String(root.id);
      const runResponse = await client.session.command({
        arguments: "launcher-proof",
        command: "mission-run",
        directory: project,
        sessionID: rootID,
      }) as unknown;
      const statusResponse = await client.session.command({
        arguments: "launcher-proof",
        command: "mission-status",
        directory: project,
        sessionID: rootID,
      }) as unknown;
      await Bun.sleep(500);
      const observedStatus = await messageText(client, project, rootID);
      const replacements: Array<[string, string]> = [
        [configDir, "<config-dir>"],
        [runtimeRoot, "<runtime-root>"],
        [project, "<project>"],
        [fixture, "<fixture>"],
        [sourceRoot, "<source-root>"],
        [os.homedir(), "<home>"],
      ];
      raw = {
        candidateId: opts.candidateId,
        cleanup: "pending",
        commands: { run: commandFact(runResponse), status: commandFact(statusResponse) },
        commandNames: server.commandNames,
        launcherReady: server.launcherReady,
        mode: "launch-diagnose",
        observedStatus,
        providerCalls: provider.calls(),
        schemaVersion: 1,
        server: {
          readyMs: server.readyMs,
          startup: proofServerStartupFacts(server.stdout.join(""), server.stderr.join(""), configDir),
          stderrTail: redactedLog(server.stderr.join("").slice(-4_000), replacements),
          stdoutTail: redactedLog(server.stdout.join("").slice(-4_000), replacements),
        },
      };
      stage(opts.evidenceRoot, "launch-diagnostic-raw-ready");
    } else {
      const client = proofClient(server.url, project);
      const root = await requestData<Record<string, unknown>>(client.session.create({
      directory: project,
      title: "roadmap launcher proof root",
      }) as Promise<unknown>, "launcher proof root create");
      rootID = String(root.id);
      const runResponse = await client.session.command({
      arguments: "launcher-proof",
      command: "mission-run",
      directory: project,
      sessionID: rootID,
      }) as unknown;
      partial.run = commandFact(runResponse);
      stage(opts.evidenceRoot, "run-command-returned");
      const running = await waitForStatus(
      client,
      project,
      rootID,
      (text) => text.includes('"visibility": "opened"') && text.includes('"status": "running"'),
      5_000,
      );
      partial.runningStatus = running.text;
      const terminal = await waitForStatus(
      client,
      project,
      rootID,
      (text) => text.includes('"status": "exited"') && text.includes('"terminalNotified": true') && text.includes('"terminalToast": "sent"'),
      20_000,
      );
      raw = {
      candidateId: opts.candidateId,
      cleanup: "pending",
        commands: {
          run: commandFact(runResponse),
          runningStatus: commandFact(running.response),
          terminalStatus: commandFact(terminal.response),
      },
      environment: { bun: Bun.version, node: process.version, platform: process.platform },
      providerCalls: provider.calls(),
      runningStatus: running.text,
      schemaVersion: 1,
      server: {
        readyMs: server.readyMs,
        startup: proofServerStartupFacts(server.stdout.join(""), server.stderr.join(""), configDir),
        stderrChars: server.stderr.join("").length,
        stdoutChars: server.stdout.join("").length,
      },
      sources: [
        "global/bin/roadmap-mission.ts",
        "global/extensions/opencode-pty-bridge.ts",
        "global/extensions/roadmap-mission-launcher.ts",
      ].map((relative) => ({ path: relative, sha256: hash(path.join(sourceRoot, relative)) })),
      terminalStatus: terminal.text,
      };
      stage(opts.evidenceRoot, "raw-ready");
    }
  } catch (error) {
    failure = error;
    if (raw == null && server != null) {
      const replacements: Array<[string, string]> = [
        [configDir, "<config-dir>"],
        [runtimeRoot, "<runtime-root>"],
        [project, "<project>"],
        [fixture, "<fixture>"],
        [sourceRoot, "<source-root>"],
        [os.homedir(), "<home>"],
      ];
      raw = {
        candidateId: opts.candidateId,
        cleanup: "pending",
        error: error instanceof Error ? error.message : String(error),
        mode: "failed-capture",
        observedStatus: error instanceof Error && "observedText" in error
          ? String((error as Error & { observedText?: string }).observedText ?? "")
          : null,
        partial,
        providerCalls: provider.calls(),
        schemaVersion: 1,
        server: {
          commandNames: server.commandNames,
          readyMs: server.readyMs,
          startup: proofServerStartupFacts(server.stdout.join(""), server.stderr.join(""), configDir),
          stderrTail: redactedLog(server.stderr.join("").slice(-8_000), replacements),
          stdoutTail: redactedLog(server.stdout.join("").slice(-8_000), replacements),
        },
      };
    }
  } finally {
    try {
      if (server != null) {
        if (rootID != null) await requestData(proofClient(server.url, project).session.delete({ directory: project, sessionID: rootID }) as Promise<unknown>, "launcher proof root delete");
        await stopProofProcessTree(server.child);
        stage(opts.evidenceRoot, "server-stopped");
      }
      provider.server.stop(true);
      removeProofFixture(fixture);
      stage(opts.evidenceRoot, "fixture-removed");
      cleanup = "complete";
    } catch (error) {
      cleanup = "failed";
      failure ??= error;
    }
  }
  if (raw != null) {
    raw.cleanup = cleanup;
    writeNew(path.join(opts.evidenceRoot, "raw.json"), json(raw));
  }
  if (failure != null || raw == null) {
    writeNew(path.join(opts.evidenceRoot, "failure.json"), json({
      candidateId: opts.candidateId,
      cleanup,
      error: failure instanceof Error ? failure.message.slice(0, 4_000) : String(failure),
      providerCalls: provider.calls(),
      schemaVersion: 1,
      status: "failed",
    }));
    throw failure instanceof Error ? failure : new Error(String(failure));
  }
  if (opts.mode === "diagnose" || opts.mode === "launch-diagnose" || opts.mode === "reject-capture" || opts.mode === "stop-capture") {
    const evaluation = opts.mode === "diagnose"
      ? evaluateDiagnostic(raw, opts.candidateId)
      : opts.mode === "launch-diagnose"
        ? evaluateLaunchDiagnostic(raw, opts.candidateId)
        : opts.mode === "reject-capture"
          ? evaluateRejectedInputs(raw, opts.candidateId)
          : evaluateStopCapture(raw, opts.candidateId);
    writeNew(path.join(opts.evidenceRoot, "evaluation.json"), json(evaluation));
    console.log(json({ candidateId: opts.candidateId, evidenceRoot: "<evidence-root>", mode: opts.mode, status: evaluation.status }).trimEnd());
    if (evaluation.status !== "complete") process.exitCode = 1;
    return;
  }
  const evaluation = evaluateRaw(raw, opts.candidateId);
  writeNew(path.join(opts.evidenceRoot, "evaluation.json"), json(evaluation));
  console.log(json({ candidateId: opts.candidateId, evidenceRoot: "<evidence-root>", mode: "capture", status: evaluation.status }).trimEnd());
  if (evaluation.status !== "complete") process.exitCode = 1;
}

const parsed = options(process.argv.slice(2));
const execution = parsed.help
  ? Promise.resolve().then(() => console.log(usage()))
  : parsed.mode === "replay"
    ? Promise.resolve().then(() => replay(parsed))
  : parsed.mode === "recover"
      ? Promise.resolve().then(() => recover(parsed))
    : parsed.mode === "preflight-capture"
      ? Promise.resolve().then(() => preflightCapture(parsed))
    : capture(parsed);
execution.catch((error) => {
  console.error(json({ error: error instanceof Error ? error.message : String(error), status: "blocked" }).trimEnd());
  process.exitCode = 1;
});
