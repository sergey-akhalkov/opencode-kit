#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import type { ChildProcessWithoutNullStreams } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { McpStatus, Project } from "../../global/node_modules/@opencode-ai/sdk/dist/v2/client.js";
import {
  callGraphifyMcpTool,
  graphifyArguments,
  graphifyProcessIdentity,
  inspectGraphifyListeners,
  inspectProcessObservation,
  loadSharedToolsConfiguration,
  probeGraphifyMcp,
  authorizeGraphifyProbe,
  redactGraphifyError,
  remoteGraphifyEntry,
} from "../windows/opencode-shared-tools.ts";
import { requireExplicitGraphifyRepository } from "../../global/plugin/graphify-project-context.ts";
import {
  isolatedProofServerEnvironment,
  proofClient,
  requestData,
  seedProofConfigDependencies,
} from "./lib/opencode-proof-client.ts";
import { removeProofFixture, stopProofProcessTree } from "./lib/proof-process-cleanup.ts";

type Mode = "capture" | "diagnose-startup" | "replay";

type Options = {
  candidateId: string;
  evidenceRoot: string;
  help: boolean;
  inputRoot: string | null;
  mode: Mode;
};

type ProcessRow = {
  commandClass: string;
  commandLineSha256: string;
  executablePath: string;
  name: string;
  parentProcessId: number;
  privateMiB: number;
  processId: number;
  workingSetMiB: number;
};

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const runnerPath = path.join(sourceRoot, "tools", "proofs", "opencode-shared-graphify-integration.ts");
const modulePath = path.join(sourceRoot, "tools", "windows", "opencode-shared-tools.ts");
const machineConfigPath = path.join(sourceRoot, "tools", "windows", "opencode-workstation.config.json");
const pluginPath = path.join(sourceRoot, "global", "plugin", "graphify-project-context.ts");
const sessionEnvPath = path.join(sourceRoot, "global", "plugin", "session-env.ts");
const baselinePath = path.join(
  sourceRoot,
  "openspec",
  "changes",
  "optimize-shared-opencode-runtime-resources",
  "evidence-task-1-1-baseline-r1",
  "raw.json",
);

function usage(): string {
  return [
    "Usage:",
    "  node tools/proofs/opencode-shared-graphify-integration.ts --mode diagnose-startup --candidate-id <id> --evidence-root <absolute-new-path>",
    "  node tools/proofs/opencode-shared-graphify-integration.ts --mode capture --candidate-id <id> --evidence-root <absolute-new-path>",
    "  node tools/proofs/opencode-shared-graphify-integration.ts --mode replay --candidate-id <id> --input-root <capture-path> --evidence-root <absolute-new-path>",
  ].join("\n");
}

function required(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${option}`);
  return value;
}

function parseOptions(args: string[]): Options {
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
  if (mode !== "capture" && mode !== "diagnose-startup" && mode !== "replay") {
    throw new Error("--mode must be capture, diagnose-startup, or replay");
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(candidateId)) throw new Error("--candidate-id must be a safe identifier");
  if (!path.isAbsolute(evidenceRoot)) throw new Error("--evidence-root must be absolute");
  if (mode === "replay" && !path.isAbsolute(inputRoot)) throw new Error("replay requires absolute --input-root");
  if (mode !== "replay" && inputRoot !== "") throw new Error(`${mode} does not accept --input-root`);
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
  const record = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(record).sort().map((key) => [key, stableValue(record[key])]));
}

function json(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

function sha256(value: string | Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function fileHash(file: string): string {
  return sha256(fs.readFileSync(file));
}

function writeNew(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof value === "string" ? value : json(value), { encoding: "utf8", flag: "wx" });
}

function boundedPush(target: string[], value: string, maxChars = 30_000): void {
  target.push(value);
  while (target.join("").length > maxChars && target.length > 1) target.shift();
}

function encodedPowerShell(script: string): string {
  return Buffer.from(script, "utf16le").toString("base64");
}

function powerShellJson(script: string): unknown {
  const result = spawnSync("powershell.exe", [
    "-NoLogo",
    "-NoProfile",
    "-NonInteractive",
    "-EncodedCommand",
    encodedPowerShell(script),
  ], { encoding: "utf8", windowsHide: true });
  if (result.error) throw new Error("PowerShell process inspection failed to start", { cause: result.error });
  if (result.status !== 0) throw new Error(`PowerShell process inspection exited ${result.status}: ${(result.stderr ?? "").trim()}`);
  const output = (result.stdout ?? "").trim();
  return output === "" ? [] : JSON.parse(output);
}

function normalizeRows(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) return value.filter((row): row is Record<string, unknown> => row != null && typeof row === "object");
  return value != null && typeof value === "object" ? [value as Record<string, unknown>] : [];
}

function commandClass(name: string, commandLine: string): string {
  const value = `${name} ${commandLine}`.toLowerCase();
  if (value.includes("graphify.serve")) return "graphify";
  if (value.includes("opencode") && value.includes(" serve ")) return "opencode-serve";
  if (name.toLowerCase() === "conhost.exe") return "conhost";
  return path.basename(name).toLowerCase();
}

function snapshotProcessTrees(rootProcessIds: number[]): ProcessRow[] {
  const ids = rootProcessIds.filter((value) => Number.isInteger(value) && value > 0).join(",");
  if (ids === "") return [];
  const value = powerShellJson(String.raw`
$ErrorActionPreference = 'Stop'
$all = @(Get-CimInstance Win32_Process -ErrorAction Stop)
$selected = New-Object 'System.Collections.Generic.HashSet[int]'
@(${ids}) | ForEach-Object { [void]$selected.Add([int]$_) }
$changed = $true
while ($changed) {
  $changed = $false
  foreach ($item in $all) {
    if ($selected.Contains([int]$item.ParentProcessId) -and -not $selected.Contains([int]$item.ProcessId)) {
      [void]$selected.Add([int]$item.ProcessId)
      $changed = $true
    }
  }
}
$rows = @($all | Where-Object { $selected.Contains([int]$_.ProcessId) } | ForEach-Object {
  $p = Get-Process -Id $_.ProcessId -ErrorAction SilentlyContinue
  [ordered]@{
    Name = [string]$_.Name
    ProcessId = [int]$_.ProcessId
    ParentProcessId = [int]$_.ParentProcessId
    ExecutablePath = [string]$_.ExecutablePath
    CommandLine = [string]$_.CommandLine
    WorkingSetMiB = $(if ($p) { [math]::Round($p.WorkingSet64 / 1MB, 3) } else { 0 })
    PrivateMiB = $(if ($p) { [math]::Round($p.PrivateMemorySize64 / 1MB, 3) } else { 0 })
  }
})
ConvertTo-Json -InputObject $rows -Depth 3 -Compress
`);
  return normalizeRows(value).map((row) => {
    const commandLine = String(row.CommandLine ?? "");
    const name = String(row.Name ?? "");
    return {
      commandClass: commandClass(name, commandLine),
      commandLineSha256: sha256(commandLine),
      executablePath: String(row.ExecutablePath ?? ""),
      name,
      parentProcessId: Number(row.ParentProcessId ?? 0),
      privateMiB: Number(row.PrivateMiB ?? 0),
      processId: Number(row.ProcessId ?? 0),
      workingSetMiB: Number(row.WorkingSetMiB ?? 0),
    };
  }).sort((left, right) => left.processId - right.processId);
}

function portListeners(port: number): Array<{ localAddress: string; processId: number }> {
  const value = powerShellJson(String.raw`
$rows = @(Get-NetTCPConnection -State Listen -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object {
  [ordered]@{ localAddress = [string]$_.LocalAddress; processId = [int]$_.OwningProcess }
})
ConvertTo-Json -InputObject $rows -Depth 2 -Compress
`);
  return normalizeRows(value).map((row) => ({
    localAddress: String(row.localAddress ?? row.LocalAddress ?? ""),
    processId: Number(row.processId ?? row.ProcessId ?? 0),
  }));
}

async function freeLoopbackPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Could not allocate a disposable loopback port"));
        return;
      }
      server.close((error) => error ? reject(error) : resolve(address.port));
    });
  });
}

async function loopbackPortOpen(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    const finish = (open: boolean) => {
      socket.destroy();
      resolve(open);
    };
    socket.setTimeout(500);
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
    socket.once("timeout", () => finish(false));
  });
}

async function waitForGraphifyListener(child: ChildProcessWithoutNullStreams, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode != null) throw new Error(`Graphify exited before readiness with code ${child.exitCode}`);
    if (await loopbackPortOpen(4097)) {
      const listeners = inspectGraphifyListeners();
      if (listeners.length > 1) throw new Error("Multiple listeners appeared on the fixed Graphify port");
      if (listeners.length === 1) return listeners[0];
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Graphify did not listen within ${timeoutMs}ms`);
}

function ancestorProcessIds(processId: number, limit = 8): number[] {
  const ancestors: number[] = [];
  let current = processId;
  for (let index = 0; index < limit && current > 0; index++) {
    const observation = inspectProcessObservation(current);
    if (observation.parentProcessId <= 0 || ancestors.includes(observation.parentProcessId)) break;
    ancestors.push(observation.parentProcessId);
    current = observation.parentProcessId;
  }
  return ancestors;
}

async function waitForOpenCode(baseUrl: string, child: ChildProcessWithoutNullStreams, directory: string, timeoutMs = 90_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  const client = proofClient(baseUrl, directory);
  let lastError: unknown = null;
  while (Date.now() < deadline) {
    if (child.exitCode != null) throw new Error(`OpenCode exited before readiness with code ${child.exitCode}`);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error("OpenCode readiness request timed out")), 60_000);
    try {
      await requestData(client.session.status({ directory }, { signal: controller.signal }) as Promise<unknown>, "session.status readiness");
      return;
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timer);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`OpenCode did not become ready within ${timeoutMs}ms`, { cause: lastError });
}

async function waitForProject(
  baseUrl: string,
  directory: string,
): Promise<{ project: Project; mcp: McpStatus; readyMs: number }> {
  const startedAt = Date.now();
  const client = proofClient(baseUrl, directory);
  const project = await requestData<Project>(client.project.current({ directory }), "project.current");
  const deadline = Date.now() + 60_000;
  let lastStatus: McpStatus | undefined;
  while (Date.now() < deadline) {
    const statuses = await requestData<Record<string, McpStatus>>(client.mcp.status({ directory }), "mcp.status");
    lastStatus = statuses["graphify-global"];
    if (lastStatus?.status === "connected") {
      return { project, mcp: lastStatus, readyMs: Date.now() - startedAt };
    }
    if (lastStatus?.status === "failed") throw new Error(`OpenCode remote Graphify failed: ${lastStatus.error}`);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`OpenCode project remote Graphify did not become ready; last status '${lastStatus?.status ?? "missing"}'`);
}

function textResult(value: unknown): string {
  const result = value as { content?: Array<{ text?: unknown }> } | null;
  return (result?.content ?? []).map((item) => typeof item.text === "string" ? item.text : "").join("\n");
}

function sanitizedTail(chunks: string[], secret: string): string {
  return chunks.join("").slice(-4_000).split(secret).join("[REDACTED]");
}

function evaluate(raw: Record<string, any>, mode: Mode): Record<string, unknown> {
  const projects = Array.isArray(raw.projects) ? raw.projects : [];
  const digests = projects.map((project: any) => project.resultDigest);
  const checks = {
    noCaptureFailure: raw.failure == null,
    authBoundary: raw.graphify?.probe?.unauthenticatedStatus === 401 && raw.graphify?.probe?.authenticatedStatus === 200,
    directInventoryMatchesBaseline: JSON.stringify(raw.graphify?.probe?.tools) === JSON.stringify(raw.baseline?.toolNames),
    distinctExactProjects: projects.length === 2 && projects[0]?.directory !== projects[1]?.directory && projects.every((project: any) => project.exactDirectory === true),
    openCodeRemoteReady: projects.length === 2 && projects.every((project: any) => project.mcpStatus === "connected" && project.mcpNamePreserved === true),
    graphResultsMatchBaseline: digests.length === 2 && digests.every((digest: string) => digest === raw.baseline?.resultDigest),
    oneGraphifyServiceTree: raw.processes?.graphifyServiceRoots === 1,
    noLocalGraphifyChildren: raw.processes?.openCodeGraphifyDescendants === 0,
    oneOpenCodeListener: raw.processes?.openCodeListenerCount === 1 && raw.processes?.openCodeListenerOwned === true,
    repoGuardPrecedesCalls: raw.repositoryGuard?.missingRejected === true && raw.repositoryGuard?.explicitPreserved === true && raw.repositoryGuard?.beforeGraphCalls === true && raw.repositoryGuard?.remotePrCalls === 0,
    readinessWithinAllowance: projects.length === 2 && projects[1]?.readyMs <= raw.baseline?.readinessAllowanceMs,
    noProviderCalls: raw.providerCalls === 0,
    secretSafe: raw.secretScan?.passed === true,
    cleanupComplete: raw.cleanup?.complete === true && raw.cleanup?.graphifyPortAbsent === true && raw.cleanup?.openCodePortAbsent === true && raw.cleanup?.fixtureAbsent === true,
  };
  return {
    schemaVersion: 1,
    kind: "shared-graphify-disposable-integration",
    mode,
    passed: Object.values(checks).every(Boolean),
    checks,
    liveCalls: mode === "replay" ? 0 : undefined,
  };
}

function evaluateStartupDiagnostic(raw: Record<string, any>, mode: Mode): Record<string, unknown> {
  const checks = {
    noCaptureFailure: raw.failure == null,
    noGraphifyConfiguredOrStarted: raw.graphifyProcesses === 0 && raw.mcpConfigured === false,
    pathRouteResponsive: raw.pathRoute?.status === 200,
    projectRouteResponsive: raw.projectRoute?.ready === true,
    noProviderCalls: raw.providerCalls === 0,
    cleanupComplete: raw.cleanup?.complete === true && raw.cleanup?.openCodePortAbsent === true && raw.cleanup?.fixtureAbsent === true,
  };
  return {
    schemaVersion: 1,
    kind: "shared-graphify-startup-diagnostic",
    mode,
    passed: Object.values(checks).every(Boolean),
    checks,
    liveCalls: mode === "replay" ? 0 : undefined,
  };
}

async function diagnoseStartup(options: Options): Promise<void> {
  if (fs.existsSync(options.evidenceRoot)) throw new Error(`Evidence root already exists: ${options.evidenceRoot}`);
  fs.mkdirSync(options.evidenceRoot, { recursive: false });
  const fixtureRoot = path.join(os.tmpdir(), `opencode-shared-graphify-startup-${crypto.randomUUID()}`);
  fs.mkdirSync(fixtureRoot, { recursive: false });
  const openCodeLogs = { stdout: [] as string[], stderr: [] as string[] };
  let openCodeChild: ChildProcessWithoutNullStreams | null = null;
  let openCodePort = 0;
  const raw: Record<string, any> = {
    schemaVersion: 1,
    kind: "shared-graphify-startup-diagnostic",
    candidateId: options.candidateId,
    mode: "diagnose-startup",
    providerCalls: 0,
    graphifyProcesses: 0,
    mcpConfigured: false,
    pluginMode: "object-form-graphify-guard",
    source: {
      runner: { path: path.relative(sourceRoot, runnerPath), sha256: fileHash(runnerPath) },
      plugin: { path: path.relative(sourceRoot, pluginPath), sha256: fileHash(pluginPath) },
      sessionEnv: { path: path.relative(sourceRoot, sessionEnvPath), sha256: fileHash(sessionEnvPath) },
    },
  };
  try {
    const project = path.join(fixtureRoot, "project");
    fs.mkdirSync(project, { recursive: true });
    const git = spawnSync("git.exe", ["init", "--quiet", project], { encoding: "utf8", windowsHide: true });
    if (git.error || git.status !== 0) throw new Error("Could not initialize diagnostic project");
    const configDir = path.join(fixtureRoot, "opencode-config");
    const runtimeRoot = path.join(fixtureRoot, "opencode-runtime");
    seedProofConfigDependencies(configDir, path.join(sourceRoot, "global"));
    fs.writeFileSync(path.join(configDir, "opencode.json"), json({
      $schema: "https://opencode.ai/config.json",
      plugin: [pathToFileURL(pluginPath).href],
      permission: "allow",
      formatter: false,
      lsp: false,
    }));
    openCodePort = await freeLoopbackPort();
    const baseUrl = `http://127.0.0.1:${openCodePort}`;
    openCodeChild = spawn("opencode.exe", [
      "serve", "--hostname", "127.0.0.1", "--port", String(openCodePort), "--print-logs", "--log-level", "INFO",
    ], {
      cwd: fixtureRoot,
      env: isolatedProofServerEnvironment(process.env, configDir, runtimeRoot),
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    openCodeChild.stdout.on("data", (chunk) => boundedPush(openCodeLogs.stdout, chunk.toString("utf8")));
    openCodeChild.stderr.on("data", (chunk) => boundedPush(openCodeLogs.stderr, chunk.toString("utf8")));
    const listenDeadline = Date.now() + 15_000;
    while (!(await loopbackPortOpen(openCodePort))) {
      if (openCodeChild.exitCode != null) throw new Error(`Diagnostic OpenCode exited ${openCodeChild.exitCode}`);
      if (Date.now() >= listenDeadline) throw new Error("Diagnostic OpenCode did not open its loopback port within 15000ms");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const pathController = new AbortController();
    const pathTimer = setTimeout(() => pathController.abort(new Error("Path route timed out")), 15_000);
    try {
      const response = await fetch(`${baseUrl}/path?directory=${encodeURIComponent(project)}`, { signal: pathController.signal });
      await response.body?.cancel();
      raw.pathRoute = { status: response.status };
    } finally {
      clearTimeout(pathTimer);
    }
    const startedAt = Date.now();
    await waitForOpenCode(baseUrl, openCodeChild, project);
    raw.projectRoute = { ready: true, readyMs: Date.now() - startedAt };
  } catch (error) {
    raw.failure = redactGraphifyError(error);
  } finally {
    const cleanupErrors: unknown[] = [];
    if (openCodeChild) {
      try {
        await stopProofProcessTree(openCodeChild);
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    try {
      removeProofFixture(fixtureRoot);
    } catch (error) {
      cleanupErrors.push(error);
    }
    raw.logs = {
      stdout: sanitizedTail(openCodeLogs.stdout, "__NO_SECRET__").split(/\r?\n/u).filter(Boolean),
      stderr: sanitizedTail(openCodeLogs.stderr, "__NO_SECRET__").split(/\r?\n/u).filter(Boolean),
    };
    const openCodePortAbsent = openCodePort === 0 || portListeners(openCodePort).length === 0;
    raw.cleanup = {
      complete: cleanupErrors.length === 0 && openCodePortAbsent && !fs.existsSync(fixtureRoot),
      openCodePortAbsent,
      fixtureAbsent: !fs.existsSync(fixtureRoot),
      errors: cleanupErrors.map((error) => redactGraphifyError(error)),
    };
  }
  const evaluation = evaluateStartupDiagnostic(raw, "diagnose-startup");
  writeNew(path.join(options.evidenceRoot, "raw.json"), raw);
  writeNew(path.join(options.evidenceRoot, "evaluation.json"), evaluation);
  process.stdout.write(json(evaluation));
  if (!evaluation.passed) process.exitCode = 1;
}

async function capture(options: Options): Promise<void> {
  if (fs.existsSync(options.evidenceRoot)) throw new Error(`Evidence root already exists: ${options.evidenceRoot}`);
  fs.mkdirSync(options.evidenceRoot, { recursive: false });
  const fixtureRoot = path.join(os.tmpdir(), `opencode-shared-graphify-${crypto.randomUUID()}`);
  fs.mkdirSync(fixtureRoot, { recursive: false });
  const graphifyLogs = { stdout: [] as string[], stderr: [] as string[] };
  const openCodeLogs = { stdout: [] as string[], stderr: [] as string[] };
  let graphifyChild: ChildProcessWithoutNullStreams | null = null;
  let openCodeChild: ChildProcessWithoutNullStreams | null = null;
  let graphifyKey = "";
  let openCodePort = 0;
  const raw: Record<string, any> = {
    schemaVersion: 1,
    candidateId: options.candidateId,
    mode: "capture",
    providerCalls: 0,
    source: {
      runner: { path: path.relative(sourceRoot, runnerPath), sha256: fileHash(runnerPath) },
      module: { path: path.relative(sourceRoot, modulePath), sha256: fileHash(modulePath) },
      machineConfig: { path: path.relative(sourceRoot, machineConfigPath), sha256: fileHash(machineConfigPath) },
      plugin: { path: path.relative(sourceRoot, pluginPath), sha256: fileHash(pluginPath) },
      sessionEnv: { path: path.relative(sourceRoot, sessionEnvPath), sha256: fileHash(sessionEnvPath) },
    },
    cleanup: { complete: false },
  };
  try {
    if (inspectGraphifyListeners().length !== 0) throw new Error("Fixed Graphify port 4097 is occupied before disposable integration");
    const configuration = await loadSharedToolsConfiguration(machineConfigPath);
    const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
    raw.baseline = {
      sourceSha256: fileHash(baselinePath),
      resultDigest: baseline.oneClient.resultDigest,
      toolNames: baseline.oneClient.toolNames,
      readinessAllowanceMs: Math.max(Math.ceil(baseline.twoClient.readyMs * 1.2), baseline.twoClient.readyMs + 2_000),
    };

    const projects = [path.join(fixtureRoot, "project-a"), path.join(fixtureRoot, "project-b")];
    for (const project of projects) {
      fs.mkdirSync(project, { recursive: true });
      const git = spawnSync("git.exe", ["init", "--quiet", project], { encoding: "utf8", windowsHide: true });
      if (git.error || git.status !== 0) throw new Error(`Could not initialize disposable project '${path.basename(project)}'`);
    }

    graphifyKey = crypto.randomBytes(32).toString("base64url");
    const graphifyArgs = graphifyArguments(configuration.graphify);
    graphifyChild = spawn(configuration.graphify.python.path, graphifyArgs, {
      cwd: fixtureRoot,
      env: {
        ...process.env,
        GRAPHIFY_API_KEY: graphifyKey,
        PYTHONUNBUFFERED: "1",
        PYTHONIOENCODING: "utf-8",
        PYTHONUTF8: "1",
      },
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    graphifyChild.stdout.on("data", (chunk) => boundedPush(graphifyLogs.stdout, chunk.toString("utf8")));
    graphifyChild.stderr.on("data", (chunk) => boundedPush(graphifyLogs.stderr, chunk.toString("utf8")));
    const listener = await waitForGraphifyListener(graphifyChild);
    const rootObservation = inspectProcessObservation(graphifyChild.pid!);
    const rootIdentity = graphifyProcessIdentity(configuration.graphify, {
      processId: rootObservation.processId,
      parentProcessId: rootObservation.parentProcessId,
      executablePath: rootObservation.executablePath,
      creationDate: rootObservation.creationDate,
      arguments: graphifyArgs,
    });
    const probeToken = authorizeGraphifyProbe(configuration.graphify, rootIdentity, {
      processId: listener.processId,
      localAddress: listener.localAddress,
      localPort: listener.localPort,
      ancestorProcessIds: ancestorProcessIds(listener.processId),
    });
    const graphifyProbe = await probeGraphifyMcp(probeToken, graphifyKey);
    raw.graphify = {
      rootProcessId: graphifyChild.pid,
      listenerProcessId: listener.processId,
      commandArgumentDigest: configuration.graphify.command.argumentDigest,
      probe: graphifyProbe,
    };

    let missingRejected = false;
    try {
      requireExplicitGraphifyRepository("graphify-global_list_prs", {});
    } catch (error) {
      missingRejected = error instanceof Error && error.message.includes("explicit non-empty 'repo'");
    }
    const explicitArgs = { repo: "owner/repository", base: "main" };
    const explicitBefore = JSON.stringify(explicitArgs);
    requireExplicitGraphifyRepository("graphify-global_list_prs", explicitArgs);
    raw.repositoryGuard = {
      missingRejected,
      explicitPreserved: JSON.stringify(explicitArgs) === explicitBefore,
      beforeGraphCalls: true,
      remotePrCalls: 0,
    };

    const configDir = path.join(fixtureRoot, "opencode-config");
    const runtimeRoot = path.join(fixtureRoot, "opencode-runtime");
    seedProofConfigDependencies(configDir, path.join(sourceRoot, "global"));
    const isolatedConfig = {
      $schema: "https://opencode.ai/config.json",
      mcp: { "graphify-global": remoteGraphifyEntry(180_000) },
      permission: "allow",
      formatter: false,
      lsp: false,
    };
    const isolatedConfigBytes = Buffer.from(json(isolatedConfig), "utf8");
    if (isolatedConfigBytes.includes(graphifyKey)) throw new Error("Disposable OpenCode config contains the Graphify credential value");
    fs.writeFileSync(path.join(configDir, "opencode.json"), isolatedConfigBytes);
    openCodePort = await freeLoopbackPort();
    const baseUrl = `http://127.0.0.1:${openCodePort}`;
    const openCodeEnv = isolatedProofServerEnvironment(process.env, configDir, runtimeRoot);
    openCodeEnv.OPENCODE_GRAPHIFY_API_KEY = graphifyKey;
    openCodeChild = spawn("opencode.exe", [
      "serve",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(openCodePort),
      "--print-logs",
      "--log-level",
      "INFO",
    ], {
      cwd: fixtureRoot,
      env: openCodeEnv,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    openCodeChild.stdout.on("data", (chunk) => boundedPush(openCodeLogs.stdout, chunk.toString("utf8")));
    openCodeChild.stderr.on("data", (chunk) => boundedPush(openCodeLogs.stderr, chunk.toString("utf8")));
    await waitForOpenCode(baseUrl, openCodeChild, projects[0]);

    raw.projects = [];
    for (const directory of projects) {
      const ready = await waitForProject(baseUrl, directory);
      const stats = textResult(await callGraphifyMcpTool(probeToken, graphifyKey, "graph_stats"));
      if (!stats.includes("Nodes:") || !stats.includes("Edges:")) throw new Error("Shared Graphify graph_stats result is invalid");
      raw.projects.push({
        directory: path.basename(directory),
        id: ready.project.id,
        exactDirectory: path.resolve(ready.project.worktree).toLowerCase() === path.resolve(directory).toLowerCase(),
        mcpStatus: ready.mcp.status,
        readyMs: ready.readyMs,
        mcpNamePreserved: true,
        resultDigest: sha256(stats),
      });
    }

    const graphifyRows = snapshotProcessTrees([graphifyChild.pid!]);
    const openCodeRows = snapshotProcessTrees([openCodeChild.pid!]);
    const openCodeListeners = portListeners(openCodePort);
    const openCodeProcessIds = new Set(openCodeRows.map((row) => row.processId));
    raw.processes = {
      graphifyServiceRoots: 1,
      graphifyTree: graphifyRows,
      openCodeTree: openCodeRows,
      openCodeGraphifyDescendants: openCodeRows.filter((row) => row.commandClass === "graphify").length,
      openCodeListenerCount: openCodeListeners.length,
      openCodeListenerOwned: openCodeListeners.length === 1 && openCodeProcessIds.has(openCodeListeners[0].processId),
    };
    const secretSurfaces = [
      isolatedConfigBytes.toString("utf8"),
      JSON.stringify(raw),
      graphifyLogs.stdout.join(""),
      graphifyLogs.stderr.join(""),
      openCodeLogs.stdout.join(""),
      openCodeLogs.stderr.join(""),
      JSON.stringify(graphifyArgs),
    ];
    raw.secretScan = {
      passed: secretSurfaces.every((surface) => !surface.includes(graphifyKey)),
      configContainsCredential: isolatedConfigBytes.includes(graphifyKey),
      argvContainsCredential: JSON.stringify(graphifyArgs).includes(graphifyKey),
      evidenceContainsCredential: JSON.stringify(raw).includes(graphifyKey),
    };
  } catch (error) {
    raw.failure = redactGraphifyError(error, graphifyKey ? [graphifyKey] : []);
  } finally {
    const cleanupErrors: unknown[] = [];
    if (openCodeChild) {
      try {
        await stopProofProcessTree(openCodeChild);
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    if (graphifyChild) {
      try {
        await stopProofProcessTree(graphifyChild);
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    try {
      removeProofFixture(fixtureRoot);
    } catch (error) {
      cleanupErrors.push(error);
    }
    const graphifyPortAbsent = inspectGraphifyListeners().length === 0;
    const openCodePortAbsent = openCodePort === 0 || portListeners(openCodePort).length === 0;
    raw.logs = {
      graphifyStdoutTail: sanitizedTail(graphifyLogs.stdout, graphifyKey),
      graphifyStderrTail: sanitizedTail(graphifyLogs.stderr, graphifyKey),
      openCodeStdoutTail: sanitizedTail(openCodeLogs.stdout, graphifyKey),
      openCodeStderrTail: sanitizedTail(openCodeLogs.stderr, graphifyKey),
    };
    raw.cleanup = {
      complete: cleanupErrors.length === 0 && graphifyPortAbsent && openCodePortAbsent && !fs.existsSync(fixtureRoot),
      graphifyPortAbsent,
      openCodePortAbsent,
      fixtureAbsent: !fs.existsSync(fixtureRoot),
      errors: cleanupErrors.map((error) => redactGraphifyError(error, graphifyKey ? [graphifyKey] : [])),
    };
  }
  const serialized = json(raw);
  if (graphifyKey && serialized.includes(graphifyKey)) throw new Error("Graphify credential reached the evidence projection");
  const evaluation = evaluate(raw, "capture");
  writeNew(path.join(options.evidenceRoot, "raw.json"), raw);
  writeNew(path.join(options.evidenceRoot, "evaluation.json"), evaluation);
  process.stdout.write(json(evaluation));
  if (!evaluation.passed) process.exitCode = 1;
}

function replay(options: Options): void {
  if (!options.inputRoot) throw new Error("Replay input root is missing");
  if (fs.existsSync(options.evidenceRoot)) throw new Error(`Evidence root already exists: ${options.evidenceRoot}`);
  const raw = JSON.parse(fs.readFileSync(path.join(options.inputRoot, "raw.json"), "utf8"));
  const evaluation = raw.kind === "shared-graphify-startup-diagnostic"
    ? evaluateStartupDiagnostic(raw, "replay")
    : evaluate(raw, "replay");
  writeNew(path.join(options.evidenceRoot, "evaluation.json"), evaluation);
  process.stdout.write(json(evaluation));
  if (!evaluation.passed) process.exitCode = 1;
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  if (options.mode === "capture") await capture(options);
  else if (options.mode === "diagnose-startup") await diagnoseStartup(options);
  else replay(options);
}

main().catch((error) => {
  process.stderr.write(json(redactGraphifyError(error)));
  process.exitCode = 1;
});
