#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import type { ChildProcessWithoutNullStreams } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { removeProofFixture, stopProofProcessTree } from "./lib/proof-process-cleanup.ts";

type Mode = "capture" | "replay";

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

type GraphifyConnection = {
  child: ChildProcessWithoutNullStreams;
  close: () => Promise<void>;
  readyMs: number;
  resultDigest: string;
  stderr: string[];
  toolNames: string[];
};

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const runnerPath = path.join(sourceRoot, "tools", "proofs", "opencode-workstation-resources.ts");

function usage(): string {
  return [
    "Usage:",
    "  node tools/proofs/opencode-workstation-resources.ts --mode capture --candidate-id <id> --evidence-root <absolute-new-path>",
    "  node tools/proofs/opencode-workstation-resources.ts --mode replay --candidate-id <id> --input-root <capture-path> --evidence-root <absolute-new-path>",
  ].join("\n");
}

function required(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value == null || value.trim() === "" || value.startsWith("--")) throw new Error(`Missing value for ${option}`);
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
  const row = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(row).sort().map((key) => [key, stableValue(row[key])]));
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

function commandClass(name: string, commandLine: string): string {
  const value = `${name} ${commandLine}`.toLowerCase();
  if (value.includes("graphify.serve")) return "graphify";
  if (value.includes("--cbm-daemon-internal")) return "codebase-memory-daemon";
  if (value.includes("codebase-memory-mcp")) return "codebase-memory-frontend";
  if (value.includes("serena") && value.includes("start-mcp-server")) return "serena";
  if (value.includes("rust-analyzer")) return "rust-lsp";
  if (value.includes("language-server") || value.includes("tsserver")) return "node-lsp";
  if (value.includes("opencode-workstation") && value.includes("launch")) return "workstation-launcher";
  if (value.includes("opencode") && value.includes(" attach ")) return "opencode-attach";
  if (value.includes("opencode") && value.includes(" serve ")) return "opencode-serve";
  return path.basename(name).toLowerCase();
}

function normalizeRows(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) return value.filter((row): row is Record<string, unknown> => row != null && typeof row === "object");
  return value != null && typeof value === "object" ? [value as Record<string, unknown>] : [];
}

function processRows(value: unknown): ProcessRow[] {
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

function snapshotProcessTrees(rootProcessIds: number[]): ProcessRow[] {
  const ids = rootProcessIds.filter((value) => Number.isInteger(value) && value > 0).join(",");
  if (ids === "") return [];
  return processRows(powerShellJson(String.raw`
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
`));
}

function snapshotRelevantHost(): ProcessRow[] {
  return processRows(powerShellJson(String.raw`
$ErrorActionPreference = 'Stop'
$rows = @(Get-CimInstance Win32_Process -ErrorAction Stop | Where-Object {
  $line = [string]$_.CommandLine
  $name = [string]$_.Name
  $line -match 'graphify\.serve|serena|codebase-memory|language-server|tsserver|rust-analyzer|opencode-workstation|opencode(.exe)?"? (serve|attach)' -or
  $name -in @('wscript.exe','alacritty.exe')
} | ForEach-Object {
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
`));
}

function totals(rows: ProcessRow[]): { privateMiB: number; processCount: number; workingSetMiB: number } {
  return {
    privateMiB: Number(rows.reduce((sum, row) => sum + row.privateMiB, 0).toFixed(3)),
    processCount: rows.length,
    workingSetMiB: Number(rows.reduce((sum, row) => sum + row.workingSetMiB, 0).toFixed(3)),
  };
}

async function samples(rootProcessIds: number[], count = 3): Promise<Array<{ rows: ProcessRow[]; totals: ReturnType<typeof totals> }>> {
  const output: Array<{ rows: ProcessRow[]; totals: ReturnType<typeof totals> }> = [];
  for (let index = 0; index < count; index++) {
    const rows = snapshotProcessTrees(rootProcessIds);
    output.push({ rows, totals: totals(rows) });
    if (index + 1 < count) await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return output;
}

function loadGraphifyCommand(): { configPath: string; graphPath: string; command: string[] } {
  const configDir = process.env.OPENCODE_CONFIG_DIR;
  if (configDir == null || configDir.trim() === "") throw new Error("OPENCODE_CONFIG_DIR is required");
  const configPath = path.join(configDir, "opencode.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as {
    mcp?: Record<string, { command?: unknown; type?: unknown }>;
  };
  const entry = config.mcp?.["graphify-global"];
  if (entry?.type !== "local" || !Array.isArray(entry.command) || !entry.command.every((item) => typeof item === "string")) {
    throw new Error("Current graphify-global MCP entry is not the expected local command");
  }
  const command = entry.command as string[];
  const graphFlag = command.indexOf("--graph");
  if (graphFlag < 0 || typeof command[graphFlag + 1] !== "string") throw new Error("Graphify command has no --graph path");
  const graphPath = path.resolve(command[graphFlag + 1]);
  if (!fs.statSync(command[0]).isFile()) throw new Error("Graphify Python executable is unavailable");
  if (!fs.statSync(graphPath).isFile()) throw new Error("Configured Graphify graph is unavailable");
  return { command, configPath, graphPath };
}

class StdioMcpClient {
  readonly child: ChildProcessWithoutNullStreams;
  readonly stderr: string[] = [];
  #buffer = "";
  #nextId = 1;
  #pending = new Map<number, { reject: (error: Error) => void; resolve: (value: unknown) => void }>();

  constructor(command: string[], cwd: string) {
    this.child = spawn(command[0], command.slice(1), { cwd, env: process.env, shell: false, stdio: "pipe", windowsHide: true });
    this.child.stdout.setEncoding("utf8");
    this.child.stdout.on("data", (chunk) => this.#consume(String(chunk)));
    this.child.stderr.setEncoding("utf8");
    this.child.stderr.on("data", (chunk) => boundedPush(this.stderr, String(chunk)));
    this.child.once("exit", (code, signal) => {
      for (const pending of this.#pending.values()) pending.reject(new Error(`Graphify exited ${code ?? signal ?? "unknown"}`));
      this.#pending.clear();
    });
  }

  #consume(chunk: string): void {
    this.#buffer += chunk;
    while (true) {
      const newline = this.#buffer.indexOf("\n");
      if (newline < 0) return;
      const line = this.#buffer.slice(0, newline).trim();
      this.#buffer = this.#buffer.slice(newline + 1);
      if (line === "") continue;
      let message: Record<string, unknown>;
      try {
        message = JSON.parse(line) as Record<string, unknown>;
      } catch (error) {
        for (const pending of this.#pending.values()) pending.reject(new Error("Graphify emitted invalid MCP JSON", { cause: error }));
        this.#pending.clear();
        continue;
      }
      const id = typeof message.id === "number" ? message.id : null;
      if (id == null) continue;
      const pending = this.#pending.get(id);
      if (pending == null) continue;
      this.#pending.delete(id);
      if (message.error != null) pending.reject(new Error(`Graphify MCP error: ${JSON.stringify(message.error)}`));
      else pending.resolve(message.result);
    }
  }

  notify(method: string, params: Record<string, unknown> = {}): void {
    this.child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method, params })}\n`);
  }

  request(method: string, params: Record<string, unknown> = {}, timeoutMs = 90_000): Promise<unknown> {
    const id = this.#nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.#pending.delete(id);
        reject(new Error(`Graphify MCP ${method} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      this.#pending.set(id, {
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
      });
      this.child.stdin.write(`${JSON.stringify({ id, jsonrpc: "2.0", method, params })}\n`);
    });
  }
}

function textResult(value: unknown): string {
  const result = value as { content?: Array<{ text?: unknown }> } | null;
  return (result?.content ?? []).map((item) => typeof item.text === "string" ? item.text : "").join("\n");
}

async function startGraphify(command: string[], cwd: string): Promise<GraphifyConnection> {
  const startedAt = Date.now();
  const client = new StdioMcpClient(command, cwd);
  await client.request("initialize", {
    capabilities: {},
    clientInfo: { name: "opencode-workstation-resource-proof", version: "1" },
    protocolVersion: "2025-03-26",
  });
  client.notify("notifications/initialized");
  const list = await client.request("tools/list") as { tools?: Array<{ name?: unknown }> };
  const toolNames = (list.tools ?? []).flatMap((tool) => typeof tool.name === "string" ? [tool.name] : []).sort();
  if (toolNames.length === 0) throw new Error("Graphify returned an empty tool inventory");
  const stats = await client.request("tools/call", { arguments: {}, name: "graph_stats" });
  const result = textResult(stats);
  if (!result.includes("Nodes:") || !result.includes("Edges:")) throw new Error("Graphify graph_stats returned an unexpected result");
  return {
    child: client.child,
    close: () => stopProofProcessTree(client.child),
    readyMs: Date.now() - startedAt,
    resultDigest: sha256(result),
    stderr: client.stderr,
    toolNames,
  };
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function evaluate(raw: Record<string, unknown>, candidateId: string): Record<string, unknown> {
  const one = raw.oneClient as Record<string, unknown> | undefined;
  const two = raw.twoClient as Record<string, unknown> | undefined;
  const cleanup = raw.cleanup as Record<string, unknown> | undefined;
  const oneTools = Array.isArray(one?.toolNames) ? one.toolNames.map(String) : [];
  const twoTools = Array.isArray(two?.toolNames) ? two.toolNames as unknown[][] : [];
  const twoDigests = Array.isArray(two?.resultDigests) ? two.resultDigests.map(String) : [];
  const oneSamples = Array.isArray(one?.samples) ? one.samples as Array<{ totals?: { privateMiB?: number } }> : [];
  const twoSamples = Array.isArray(two?.samples) ? two.samples as Array<{ totals?: { privateMiB?: number } }> : [];
  const checks = {
    candidateMatches: raw.candidateId === candidateId,
    cleanupComplete: cleanup?.complete === true,
    graphResultsMatch: typeof one?.resultDigest === "string" && twoDigests.length === 2 && twoDigests.every((value) => value === one.resultDigest),
    oneServiceTree: one?.serviceTreeCount === 1,
    noCaptureFailure: raw.failure == null,
    toolInventoriesMatch: oneTools.length > 0 && twoTools.length === 2 && twoTools.every((value) => JSON.stringify(value) === JSON.stringify(oneTools)),
    twoServiceTrees: two?.serviceTreeCount === 2,
  };
  const status = Object.values(checks).every(Boolean) ? "passed" : "failed";
  return {
    candidateId,
    checks,
    kind: "local-graphify-baseline",
    resourceSummary: {
      oneClientPrivateMedianMiB: median(oneSamples.flatMap((sample) => typeof sample.totals?.privateMiB === "number" ? [sample.totals.privateMiB] : [])),
      oneClientReadyMs: one?.readyMs ?? null,
      twoClientPrivateMedianMiB: median(twoSamples.flatMap((sample) => typeof sample.totals?.privateMiB === "number" ? [sample.totals.privateMiB] : [])),
      twoClientReadyMs: two?.readyMs ?? null,
    },
    schemaVersion: 1,
    status,
  };
}

async function capture(options: Options): Promise<void> {
  if (fs.existsSync(options.evidenceRoot)) throw new Error("--evidence-root must not already exist");
  fs.mkdirSync(options.evidenceRoot, { recursive: false });
  const fixture = path.join(os.tmpdir(), `opencode-workstation-resources-${crypto.randomUUID()}`);
  fs.mkdirSync(path.join(fixture, "project-a", ".git"), { recursive: true });
  fs.mkdirSync(path.join(fixture, "project-b", ".git"), { recursive: true });
  const graphify = loadGraphifyCommand();
  const raw: Record<string, unknown> = {
    candidateId: options.candidateId,
    captureKind: "baseline",
    cleanup: { complete: false },
    environment: {
      graphPathSha256: fileHash(graphify.graphPath),
      graphifyExecutableSha256: fileHash(graphify.command[0]),
      graphifyHelpStatus: spawnSync(graphify.command[0], ["-m", "graphify.serve", "--help"], { encoding: "utf8", windowsHide: true }).status,
      node: process.version,
      platform: `${process.platform}-${process.arch}`,
    },
    hostBefore: snapshotRelevantHost(),
    schemaVersion: 1,
    source: {
      globalConfigSha256: fileHash(graphify.configPath),
      runnerSha256: fileHash(runnerPath),
      workstationSourceSha256: fileHash(path.join(sourceRoot, "tools", "windows", "opencode-workstation.ts")),
    },
  };
  let first: GraphifyConnection | null = null;
  let second: GraphifyConnection | null = null;
  let failure: unknown = null;
  try {
    raw.idle = { samples: await samples([]), serviceTreeCount: 0 };
    first = await startGraphify(graphify.command, path.join(fixture, "project-a"));
    raw.oneClient = {
      readyMs: first.readyMs,
      resultDigest: first.resultDigest,
      samples: await samples([first.child.pid!]),
      serviceTreeCount: 1,
      stderrChars: first.stderr.join("").length,
      toolNames: first.toolNames,
    };
    const secondStartedAt = Date.now();
    second = await startGraphify(graphify.command, path.join(fixture, "project-b"));
    raw.twoClient = {
      readyMs: Date.now() - secondStartedAt,
      resultDigests: [first.resultDigest, second.resultDigest],
      samples: await samples([first.child.pid!, second.child.pid!]),
      serviceTreeCount: 2,
      stderrChars: [first.stderr.join("").length, second.stderr.join("").length],
      toolNames: [first.toolNames, second.toolNames],
    };
  } catch (error) {
    failure = error;
    raw.failure = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
  } finally {
    const cleanupErrors: string[] = [];
    for (const connection of [second, first]) {
      if (connection == null) continue;
      try {
        await connection.close();
      } catch (error) {
        cleanupErrors.push(error instanceof Error ? error.message : String(error));
      }
    }
    try {
      removeProofFixture(fixture);
    } catch (error) {
      cleanupErrors.push(error instanceof Error ? error.message : String(error));
    }
    raw.hostAfter = snapshotRelevantHost();
    raw.cleanup = { complete: cleanupErrors.length === 0, errors: cleanupErrors, fixtureRemoved: !fs.existsSync(fixture) };
  }
  const evaluation = evaluate(raw, options.candidateId);
  writeNew(path.join(options.evidenceRoot, "raw.json"), raw);
  writeNew(path.join(options.evidenceRoot, "evaluation.json"), evaluation);
  if (failure != null || evaluation.status !== "passed") {
    throw new Error(`Resource baseline capture failed; evidence=${options.evidenceRoot}`);
  }
  console.log(json({ candidateId: options.candidateId, cleanup: "complete", evidenceRoot: options.evidenceRoot, status: "complete" }).trimEnd());
}

function replay(options: Options): void {
  if (options.inputRoot == null) throw new Error("replay requires --input-root");
  if (fs.existsSync(options.evidenceRoot)) throw new Error("--evidence-root must not already exist");
  const input = path.join(options.inputRoot, "raw.json");
  const raw = JSON.parse(fs.readFileSync(input, "utf8")) as Record<string, unknown>;
  const evaluation = evaluate(raw, options.candidateId);
  writeNew(path.join(options.evidenceRoot, "evaluation.json"), {
    ...evaluation,
    inputRawSha256: fileHash(input),
    replay: true,
  });
  if (evaluation.status !== "passed") throw new Error(`Resource baseline replay failed; evidence=${options.evidenceRoot}`);
  console.log(json({ candidateId: options.candidateId, evidenceRoot: options.evidenceRoot, liveCalls: 0, status: "complete" }).trimEnd());
}

const options = parseOptions(process.argv.slice(2));
if (options.help) {
  console.log(usage());
} else if (options.mode === "capture") {
  await capture(options);
} else {
  replay(options);
}
