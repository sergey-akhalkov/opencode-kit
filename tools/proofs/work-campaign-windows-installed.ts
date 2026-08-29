#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { loadWorkCampaignDefinition } from "../../global/bin/work-campaign/contracts.ts";
import {
  OPENCODE_WORKSTATION_PROTECTED_ROOT,
  OPENCODE_WORKSTATION_SERVER_CREDENTIAL_PATH,
  WORK_CAMPAIGN_SUPERVISOR_PROTECTED_ROOT,
  WORK_CAMPAIGN_SUPERVISOR_TASK_NAME,
} from "../windows/opencode-workstation-layout.ts";
import { loadModelProfile } from "../model-profile.ts";
import {
  captureConfiguredPlaybook,
  evaluateConfiguredPlaybookScenario,
  type ConfiguredPlaybookRuntime,
} from "./work-campaign-playbook.ts";
import {
  assertProofRouteAvailable,
  installedOpenCodeIdentity,
  proofClient,
  proofErrorFacts,
  proofRuntimeSurface,
  proofServerLogs,
  proofServerStartupFailure,
  startProofServer,
  stopProofServer,
  waitForProofRoute,
  type ProofRuntimeSurface,
  type ProofServerHandle,
} from "./lib/opencode-proof-client.ts";
import { removeProofFixture } from "./lib/proof-process-cleanup.ts";

type JsonRecord = Record<string, unknown>;

type Options = {
  allowHostMutation: boolean;
  candidateId: string;
  credentialTarget: string;
  environmentId: string;
  evidenceRoot: string;
  help: boolean;
  inputRoot: string | null;
  mode: "capture" | "operator-capture" | "operator-preflight" | "replay";
  opencodePath: string | null;
  preflightInputRoot: string | null;
  profile: string | null;
};

const sourceRoot = path.resolve(import.meta.dirname, "..", "..");
const installedWorkstationController = path.join(OPENCODE_WORKSTATION_PROTECTED_ROOT, "opencode-workstation.ts");
const workstationManifest = path.join(OPENCODE_WORKSTATION_PROTECTED_ROOT, "manifest.json");
const installer = path.join(sourceRoot, "tools", "windows", "work-campaign-supervisor-install.ts");
const installedHost = path.join(WORK_CAMPAIGN_SUPERVISOR_PROTECTED_ROOT, "tools", "windows", "work-campaign-supervisor-host.ts");
const installedResult = path.join(WORK_CAMPAIGN_SUPERVISOR_PROTECTED_ROOT, "runtime", "host-result.json");
const safeId = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/u;
const sourcePaths = [
  "global/bin/work-campaign/supervisor.ts",
  "tools/proofs/work-campaign-windows-installed.ts",
  "tools/test-work-campaign-controller.ts",
  "tools/windows/opencode-workstation-layout.ts",
  "tools/windows/work-campaign-supervisor-host.ts",
  "tools/windows/work-campaign-supervisor-install.ts",
  "tools/windows/work-campaign-supervisor.ts",
].sort();
const operatorSourcePaths = [
  ...sourcePaths,
  "global/bin/work-campaign/semantic-executor.ts",
  "global/bin/work-campaign/semantic-playbook.ts",
  "tools/model-profile.ts",
  "tools/proofs/lib/opencode-proof-client.ts",
  "tools/proofs/lib/proof-process-cleanup.ts",
  "tools/proofs/work-campaign-playbook.ts",
].filter((value, index, rows) => rows.indexOf(value) === index).sort();
const operatorExtensionFiles = [".serena/.gitignore", ".serena/project.yml"] as const;
const operatorExtensionTransientFiles = [".serena/project.local.yml"] as const;

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value == null || typeof value !== "object") return value;
  const record = value as JsonRecord;
  return Object.fromEntries(Object.keys(record).sort().map((key) => [key, stableValue(record[key])]));
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

function sha256(value: string | Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function isRecord(value: unknown): value is JsonRecord {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function usage(): string {
  return [
    "Usage:",
    "  node tools/proofs/work-campaign-windows-installed.ts --mode capture --allow-host-mutation --candidate-id <id> --environment-id <id> --evidence-root <absolute-new-path>",
    "  node tools/proofs/work-campaign-windows-installed.ts --mode operator-preflight --candidate-id <id> --environment-id <id> --evidence-root <absolute-new-path> --opencode <absolute-file> --profile <profile> [--credential-target <absolute-file>]",
    "  node tools/proofs/work-campaign-windows-installed.ts --mode operator-capture --allow-host-mutation --candidate-id <id> --environment-id <id> --preflight-input-root <operator-preflight-path> --evidence-root <absolute-new-path> --opencode <absolute-file> --profile <profile> [--credential-target <absolute-file>]",
    "  node tools/proofs/work-campaign-windows-installed.ts --mode replay --candidate-id <id> --environment-id <id> --input-root <capture-path> --evidence-root <absolute-new-path>",
    "",
    "Capture effects: creates one disposable Git/OpenSpec fixture, starts the existing stopped workstation runtime when needed, installs and invokes one protected Scheduled Task, rolls it back, restores the workstation runtime pre-state, deletes the fixture, and writes one immutable privacy-safe bundle.",
    "Operator-capture effects: reads the protected credential into child-process memory, starts one proof-owned authenticated installed OpenCode server, performs the fixed configured two-wave campaign, routes the first durable mission resume through the installed Scheduled Task exactly once, removes the task/server/fixture, restores runtime pre-state, and writes one immutable bundle.",
    "Operator-preflight effects: makes zero configured model calls and no host mutation; it starts one proof-owned authenticated installed OpenCode server over a disposable Git fixture, inspects the current managed plugin/MCP surface, creates/deletes one session, proves empty porcelain, stops the server, restores runtime pre-state, removes the fixture, and writes one immutable bundle.",
    "Replay effects: reads one preserved raw bundle and writes one privacy-safe projected raw plus evaluation. Host, process, provider, OpenCode, Git, and source effects are zero.",
  ].join("\n");
}

function required(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value == null || value.trim() === "" || value.startsWith("--")) throw new Error(`Missing value for ${option}.`);
  return value;
}

function parseArgs(args: string[]): Options {
  if (args.length === 1 && (args[0] === "--help" || args[0] === "-h")) {
    return { allowHostMutation: false, candidateId: "help", credentialTarget: OPENCODE_WORKSTATION_SERVER_CREDENTIAL_PATH, environmentId: "help", evidenceRoot: sourceRoot, help: true, inputRoot: null, mode: "replay", opencodePath: null, preflightInputRoot: null, profile: null };
  }
  let allowHostMutation = false;
  let candidateId = "";
  let credentialTarget = OPENCODE_WORKSTATION_SERVER_CREDENTIAL_PATH;
  let environmentId = "";
  let evidenceRoot = "";
  let inputRoot: string | null = null;
  let mode = "";
  let opencodePath: string | null = null;
  let preflightInputRoot: string | null = null;
  let profile: string | null = null;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]!;
    if (arg === "--allow-host-mutation") allowHostMutation = true;
    else if (arg === "--candidate-id") { candidateId = required(args, index, arg); index++; }
    else if (arg === "--credential-target") { credentialTarget = path.resolve(required(args, index, arg)); index++; }
    else if (arg === "--environment-id") { environmentId = required(args, index, arg); index++; }
    else if (arg === "--evidence-root") { evidenceRoot = required(args, index, arg); index++; }
    else if (arg === "--input-root") { inputRoot = path.resolve(required(args, index, arg)); index++; }
    else if (arg === "--mode") { mode = required(args, index, arg); index++; }
    else if (arg === "--opencode") { opencodePath = path.resolve(required(args, index, arg)); index++; }
    else if (arg === "--preflight-input-root") { preflightInputRoot = path.resolve(required(args, index, arg)); index++; }
    else if (arg === "--profile") { profile = required(args, index, arg); index++; }
    else throw new Error(`Unknown option: ${arg}`);
  }
  if (mode !== "capture" && mode !== "operator-capture" && mode !== "operator-preflight" && mode !== "replay") throw new Error("--mode must be capture, operator-capture, operator-preflight, or replay.");
  if (!safeId.test(candidateId) || !safeId.test(environmentId)) throw new Error("Candidate and environment ids must be safe identifiers.");
  if (!path.isAbsolute(evidenceRoot)) throw new Error("--evidence-root must be absolute.");
  if ((mode === "capture" || mode === "operator-capture") && !allowHostMutation) throw new Error("Capture requires explicit --allow-host-mutation.");
  if (mode === "operator-preflight" && allowHostMutation) throw new Error("Operator preflight rejects --allow-host-mutation.");
  if (mode === "replay" && (allowHostMutation || inputRoot == null)) throw new Error("Replay requires --input-root and rejects --allow-host-mutation.");
  if (mode !== "replay" && inputRoot != null) throw new Error("Capture does not accept --input-root.");
  if ((mode === "operator-capture" || mode === "operator-preflight") && (opencodePath == null || !path.isAbsolute(opencodePath) || profile == null || profile.trim() === "")) {
    throw new Error("Operator modes require --opencode and --profile.");
  }
  if (mode !== "operator-capture" && mode !== "operator-preflight" && (opencodePath != null || profile != null || credentialTarget !== OPENCODE_WORKSTATION_SERVER_CREDENTIAL_PATH)) {
    throw new Error("--opencode, --profile, and --credential-target are supported only for operator modes.");
  }
  if (mode === "operator-capture" && preflightInputRoot == null) throw new Error("Operator capture requires --preflight-input-root.");
  if (mode !== "operator-capture" && preflightInputRoot != null) throw new Error("--preflight-input-root is supported only for operator-capture.");
  if (!path.isAbsolute(credentialTarget)) throw new Error("--credential-target must be absolute.");
  return { allowHostMutation, candidateId, credentialTarget, environmentId, evidenceRoot: path.resolve(evidenceRoot), help: false, inputRoot, mode, opencodePath, preflightInputRoot, profile };
}

function redact(value: string, proofRoot: string): string {
  let result = value;
  for (const [selected, replacement] of [
    [sourceRoot, "<source-root>"],
    [proofRoot, "<proof-root>"],
    [process.env.USERPROFILE ?? "", "<user-profile>"],
    [OPENCODE_WORKSTATION_PROTECTED_ROOT, "<workstation-root>"],
    [WORK_CAMPAIGN_SUPERVISOR_PROTECTED_ROOT, "<campaign-host-root>"],
  ] as const) {
    if (selected !== "") result = result.replaceAll(selected, replacement).replaceAll(selected.replaceAll("\\", "/"), replacement);
  }
  return result.slice(0, 8_000);
}

function projectedOperatorFailure(error: unknown, secret: string, proofRoot: string): JsonRecord {
  const sanitize = (value: string): string => redact(value.replaceAll(secret, "<credential>"), proofRoot);
  return {
    facts: proofErrorFacts(error).map((fact) => Object.fromEntries(Object.entries(fact).map(([key, value]) => [
      key,
      typeof value === "string" ? sanitize(value) : value,
    ]))),
    message: sanitize(error instanceof Error ? error.message : "Installed operator operation failed."),
    type: error instanceof Error ? error.name : "Error",
  };
}

function projectedOperatorLog(value: string, secret: string, proofRoot: string): string {
  return redact(value.slice(-8_000).replaceAll(secret, "<credential>"), proofRoot)
    .replace(/[A-Za-z]:[\\/][^\s"'<>]+/gu, "<absolute-path>");
}

function readCredentialSecret(target: string): string {
  const stat = fs.lstatSync(target, { throwIfNoEntry: false });
  if (stat == null || !stat.isFile() || stat.isSymbolicLink() || stat.size < 1 || stat.size > 4_096) {
    throw new Error("Credential target must be one regular non-empty file no larger than 4096 bytes.");
  }
  const secret = fs.readFileSync(target, "utf8").trim();
  if (secret === "" || /[\r\n\0]/u.test(secret)) throw new Error("Credential target contains an invalid secret.");
  return secret;
}

function prepareManagedOperatorEnvironment(runtimeRoot: string, secret: string): NodeJS.ProcessEnv {
  fs.mkdirSync(path.join(runtimeRoot, "data", "opencode"), { recursive: true });
  fs.mkdirSync(path.join(runtimeRoot, "state"), { recursive: true });
  const inheritedPath = Object.entries(process.env).find(([key]) => key.toLocaleUpperCase() === "PATH")?.[1] ?? "";
  const environment: NodeJS.ProcessEnv = {
    ...process.env,
    OPENCODE_CONFIG_DIR: path.join(sourceRoot, "global"),
    OPENCODE_DB: path.join(runtimeRoot, "data", "opencode", "opencode.db"),
    OPENCODE_DISABLE_AUTOUPDATE: "1",
    OPENCODE_DISABLE_EMBEDDED_WEB_UI: "1",
    OPENCODE_DISABLE_LSP_DOWNLOAD: "1",
    OPENCODE_DISABLE_MODELS_FETCH: "1",
    OPENCODE_SERVER_PASSWORD: secret,
    PATH: inheritedPath,
    XDG_STATE_HOME: path.join(runtimeRoot, "state"),
  };
  for (const key of Object.keys(environment)) {
    if (key !== "PATH" && key.toLocaleUpperCase() === "PATH") delete environment[key];
  }
  delete environment.OPENCODE_CONFIG;
  delete environment.OPENCODE_CONFIG_CONTENT;
  delete environment.OPENCODE_DISABLE_DEFAULT_PLUGINS;
  delete environment.OPENCODE_DISABLE_EXTERNAL_SKILLS;
  delete environment.OPENCODE_DISABLE_PROJECT_CONFIG;
  delete environment.OPENCODE_PID;
  delete environment.OPENCODE_PURE;
  delete environment.OPENCODE_SESSION_ID;
  return environment;
}

function gitFixtureCommand(root: string, args: string[]): void {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", shell: false, windowsHide: true });
  if (result.status !== 0) throw new Error(`Disposable operator Git command failed: git ${args.join(" ")}`);
}

function initializeOperatorPreflightFixture(root: string): void {
  fs.mkdirSync(root, { recursive: true });
  gitFixtureCommand(root, ["init", "-b", "main"]);
  fs.writeFileSync(path.join(root, "preflight.txt"), "installed operator zero-call preflight\n", "utf8");
  gitFixtureCommand(root, ["add", "--all"]);
  gitFixtureCommand(root, [
    "-c", "user.name=Campaign Proof",
    "-c", "user.email=campaign-proof@example.invalid",
    "-c", "commit.gpgsign=false",
    "commit", "-m", "installed operator preflight fixture",
  ]);
}

function operatorPorcelain(root: string, stage: string): JsonRecord {
  const result = spawnSync("git", ["status", "--porcelain=v1", "--untracked-files=all"], {
    cwd: root,
    encoding: "utf8",
    shell: false,
    windowsHide: true,
  });
  if (result.status !== 0) throw new Error("Disposable operator worktree status failed.");
  return { paths: result.stdout.split(/\r?\n/u).filter((line) => line !== "").sort(), stage };
}

function projectOperatorRuntimeSurface(surface: ProofRuntimeSurface): ProofRuntimeSurface {
  return {
    configDigest: surface.configDigest,
    mcpIds: [...surface.mcpIds],
    pluginIds: surface.pluginIds.map((value) => `sha256:${sha256(value)}`),
  };
}

export function operatorExtensionSurfaceMatches(left: unknown, right: unknown): boolean {
  if (!isRecord(left) || !isRecord(right)
    || typeof left.configDigest !== "string" || typeof right.configDigest !== "string"
    || !Array.isArray(left.mcpIds) || !Array.isArray(right.mcpIds)
    || !Array.isArray(left.pluginIds) || !Array.isArray(right.pluginIds)) return false;
  return stableJson(left.mcpIds) === stableJson(right.mcpIds)
    && stableJson(left.pluginIds) === stableJson(right.pluginIds);
}

function operatorExtensionFileIdentities(root: string): Array<{ bytes: number; digest: string; path: string }> {
  return operatorExtensionFiles.map((relative) => {
    const absolute = path.join(root, relative);
    const stat = fs.lstatSync(absolute, { throwIfNoEntry: false });
    if (stat == null || !stat.isFile() || stat.isSymbolicLink() || stat.size > 65_536) {
      throw new Error(`Managed extension fixture file is missing or unsafe: ${relative}`);
    }
    return { bytes: stat.size, digest: sha256(fs.readFileSync(absolute)), path: relative };
  });
}

function operatorExtensionMaterial(root: string): Array<{ bytes: number; digest: string; path: string }> {
  const serenaRoot = path.join(root, ".serena");
  const rows: Array<{ bytes: number; digest: string; path: string }> = [];
  const visit = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error("Managed extension material contains a symbolic link.");
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) {
        const stat = fs.lstatSync(absolute);
        rows.push({ bytes: stat.size, digest: sha256(fs.readFileSync(absolute)), path: path.relative(root, absolute).replaceAll("\\", "/") });
      } else throw new Error("Managed extension material contains unsupported material.");
    }
  };
  visit(serenaRoot);
  rows.sort((left, right) => left.path.localeCompare(right.path));
  if (rows.length > 512 || rows.reduce((total, row) => total + row.bytes, 0) > 50 * 1024 * 1024) {
    throw new Error("Managed extension material exceeds the reviewed count or byte envelope.");
  }
  return rows;
}

function operatorExtensionMaterialContained(value: unknown): boolean {
  if (!Array.isArray(value) || value.length < operatorExtensionFiles.length + operatorExtensionTransientFiles.length || value.length > 512) return false;
  const rows = value.filter(isRecord);
  const paths = new Set(rows.map((row) => row.path));
  return rows.length === value.length
    && paths.size === rows.length
    && [...operatorExtensionFiles, ...operatorExtensionTransientFiles].every((relative) => paths.has(relative))
    && rows.reduce((total, row) => total + (typeof row.bytes === "number" ? row.bytes : 50 * 1024 * 1024 + 1), 0) <= 50 * 1024 * 1024
    && rows.every((row) => typeof row.path === "string"
      && (operatorExtensionFiles.includes(row.path as typeof operatorExtensionFiles[number])
        || operatorExtensionTransientFiles.includes(row.path as typeof operatorExtensionTransientFiles[number])
        || row.path.startsWith(".serena/cache/"))
      && typeof row.bytes === "number" && row.bytes >= 0
      && typeof row.digest === "string" && /^[a-f0-9]{64}$/u.test(row.digest));
}

function operatorFixtureFiles(root: string): string[] {
  const files: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (directory === root && entry.name === ".git" && entry.isDirectory()) continue;
      if (entry.isSymbolicLink()) throw new Error("Managed extension fixture contains a symbolic link.");
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) files.push(path.relative(root, absolute).replaceAll("\\", "/"));
      else throw new Error("Managed extension fixture contains unsupported material.");
    }
  };
  visit(root);
  return files.sort();
}

async function provisionOperatorExtensions(client: ReturnType<typeof proofClient>, root: string): Promise<JsonRecord> {
  const response = await client.mcp.status({ directory: root }) as { data?: unknown; error?: unknown };
  if (response.error != null || !isRecord(response.data)) throw new Error("Managed MCP status failed during extension provisioning.");
  await waitFor(
    () => operatorExtensionFiles.every((relative) => fs.existsSync(path.join(root, relative))),
    30_000,
    "Managed extension fixture files were not materialized.",
  );
  const statuses = Object.fromEntries(Object.entries(response.data).map(([id, value]) => [
    id,
    isRecord(value) && typeof value.status === "string" ? value.status : "unknown",
  ]));
  if (statuses.serena !== "connected") throw new Error("Serena did not connect during managed extension provisioning.");
  return { files: operatorExtensionFileIdentities(root), material: operatorExtensionMaterial(root), statuses };
}

function runCommand(name: string, executable: string, args: string[], proofRoot: string, timeout = 300_000): {
  argv: string[];
  exitCode: number | null;
  name: string;
  output: unknown;
  signal: NodeJS.Signals | null;
  stderr: string;
  stdout: string;
} {
  const result = spawnSync(executable, args, { cwd: sourceRoot, encoding: "utf8", shell: false, timeout, windowsHide: true });
  let output: unknown = null;
  for (const text of [result.stdout, result.stderr]) {
    if (typeof text !== "string" || text.trim() === "") continue;
    try { output = JSON.parse(text); break; } catch {}
  }
  return {
    argv: [path.basename(executable), ...args.map((arg) => redact(arg, proofRoot))],
    exitCode: result.status,
    name,
    output,
    signal: result.signal,
    stderr: redact(result.stderr ?? (result.error?.message ?? ""), proofRoot),
    stdout: redact(result.stdout ?? "", proofRoot),
  };
}

function projectedWorkstationStatus(value: unknown): JsonRecord | null {
  if (!isRecord(value) || !isRecord(value.managed) || !isRecord(value.environment)) return null;
  const managed = value.managed;
  const environment = value.environment;
  const manifest = isRecord(managed.manifest) ? managed.manifest : {};
  const task = isRecord(managed.task) ? managed.task : {};
  const trayTask = isRecord(managed.trayTask) ? managed.trayTask : {};
  const port = isRecord(environment.port) ? environment.port : {};
  const graphifyPort = isRecord(environment.graphifyPort) ? environment.graphifyPort : {};
  const health = isRecord(value.health) ? value.health : null;
  return {
    candidate: manifest.candidate ?? null,
    graphifyListeners: graphifyPort.listenerCount ?? null,
    health: health?.healthy ?? false,
    installed: managed.installed ?? false,
    integrity: managed.integrity ?? null,
    listeners: port.listenerCount ?? null,
    taskExists: task.exists ?? false,
    taskState: task.state ?? null,
    trayTaskExists: trayTask.exists ?? false,
    trayTaskState: trayTask.state ?? null,
  };
}

function projectRaw(raw: JsonRecord, derivation?: JsonRecord): JsonRecord {
  const projected = JSON.parse(stableJson(raw)) as JsonRecord;
  const operations = isRecord(projected.operations) ? projected.operations : {};
  projected.operations = Object.fromEntries(Object.entries(operations).map(([name, value]) => {
    const operation = isRecord(value) ? value : {};
    const output = isRecord(operation.output) && typeof operation.output.status === "string"
      ? { status: operation.output.status }
      : null;
    const stdout = typeof operation.stdout === "string" && /^sha256:[a-f0-9]{64}$/u.test(operation.stdout)
      ? operation.stdout
      : `sha256:${sha256(typeof operation.stdout === "string" ? operation.stdout : "")}`;
    return [name, { ...operation, output, stdout }];
  }));
  if (derivation != null) projected.derivation = derivation;
  return projected;
}

function projectRows(value: unknown): JsonRecord[] {
  if (!isRecord(value) || !isRecord(value.report) || !Array.isArray(value.report.rows)) return [];
  return value.report.rows.filter(isRecord).map((row) => ({
    attempts: row.attempts ?? null,
    id: row.id ?? null,
    reason: row.reason ?? null,
    state: row.state ?? null,
    supervision: isRecord(row.campaign) && isRecord(row.campaign.supervision) ? row.campaign.supervision : null,
  }));
}

function projectOperatorRows(value: unknown): JsonRecord[] {
  if (!isRecord(value) || !isRecord(value.report) || !Array.isArray(value.report.rows)) return [];
  return value.report.rows.filter(isRecord).map((row) => ({
    attempts: row.attempts ?? null,
    campaign: isRecord(row.campaign) ? {
      disposition: row.campaign.disposition ?? null,
      phase: row.campaign.phase ?? null,
      supervision: row.campaign.supervision ?? null,
      writerClosure: row.campaign.writerClosure ?? null,
    } : null,
    id: row.id ?? null,
    reason: row.reason ?? null,
    state: row.state ?? null,
  }));
}

function writeNew(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, stableJson(value), { encoding: "utf8", flag: "wx" });
}

function treeDigest(root: string): string {
  const rows: Array<{ digest: string; path: string }> = [];
  const visit = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const absolute = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error("Disposable installed proof fixture contains a symbolic link.");
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) rows.push({ digest: sha256(fs.readFileSync(absolute)), path: path.relative(root, absolute).replaceAll("\\", "/") });
      else throw new Error("Disposable installed proof fixture contains unsafe material.");
    }
  };
  visit(root);
  return sha256(JSON.stringify(rows));
}

function taskState(): { exists: boolean; state: string | null } {
  const payload = Buffer.from(JSON.stringify({ name: WORK_CAMPAIGN_SUPERVISOR_TASK_NAME }), "utf8").toString("base64");
  const command = String.raw`$p=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${payload}'))|ConvertFrom-Json;$t=Get-ScheduledTask -TaskName ([string]$p.name) -ErrorAction SilentlyContinue;[ordered]@{exists=$null -ne $t;state=if($null -ne $t){[string]$t.State}else{$null}}|ConvertTo-Json -Compress`;
  const result = spawnSync("pwsh.exe", ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", command], { encoding: "utf8", shell: false, windowsHide: true });
  if (result.status !== 0) throw new Error("Scheduled Task state inspection failed.");
  return JSON.parse(result.stdout) as { exists: boolean; state: string | null };
}

async function waitFor(predicate: () => boolean, timeoutMs: number, message: string): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(message);
}

function killProcessTree(pid: number): void {
  spawnSync("taskkill.exe", ["/PID", String(pid), "/T", "/F"], { encoding: "utf8", shell: false, windowsHide: true });
}

function fileDigest(file: string): string | null {
  return fs.existsSync(file) ? sha256(fs.readFileSync(file)) : null;
}

function secretLeakDetected(root: string, commandTexts: string[], credentialTarget = OPENCODE_WORKSTATION_SERVER_CREDENTIAL_PATH): boolean {
  const credential = fs.readFileSync(credentialTarget);
  if (credential.length === 0) return true;
  const normalized = Buffer.from(credential.toString("utf8").trim(), "utf8");
  if (normalized.length === 0) return true;
  if (commandTexts.some((text) => Buffer.from(text, "utf8").indexOf(normalized) >= 0)) return true;
  if (!fs.existsSync(root)) return false;
  const pending = [root];
  while (pending.length > 0) {
    const directory = pending.pop()!;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) pending.push(absolute);
      else if (entry.isFile() && fs.readFileSync(absolute).indexOf(normalized) >= 0) return true;
    }
  }
  return false;
}

function evaluate(raw: JsonRecord, candidateId: string, environmentId: string): JsonRecord {
  const operations = isRecord(raw.operations) ? raw.operations : {};
  const before = isRecord(raw.before) ? raw.before : {};
  const after = isRecord(raw.after) ? raw.after : {};
  const taskRunRows = Array.isArray(raw.taskRunRows) ? raw.taskRunRows.filter(isRecord) : [];
  const preTaskRows = Array.isArray(raw.preTaskRows) ? raw.preTaskRows.filter(isRecord) : [];
  const postStopRows = Array.isArray(raw.postStopRows) ? raw.postStopRows.filter(isRecord) : [];
  const stopRows = Array.isArray(raw.stopRows) ? raw.stopRows.filter(isRecord) : [];
  const serializedRaw = stableJson(raw).toLocaleLowerCase();
  const privateRoots = [sourceRoot, process.env.USERPROFILE ?? ""]
    .filter((value) => value !== "")
    .flatMap((value) => [value, value.replaceAll("\\", "/")])
    .flatMap((value) => [value, JSON.stringify(value).slice(1, -1)])
    .map((value) => value.toLocaleLowerCase());
  const row = (rows: JsonRecord[], id: string): JsonRecord | null => rows.find((candidate) => candidate.id === id) ?? null;
  const checks: Record<string, boolean> = {
    candidateMatched: raw.candidateId === candidateId,
    cleanupComplete: raw.cleanup === "complete",
    environmentMatched: raw.environmentId === environmentId,
    hostInitiallyAbsent: before.campaignRootExists === false && isRecord(before.task) && before.task.exists === false,
    installCompleted: isRecord(operations.install) && operations.install.exitCode === 0 && isRecord(operations.install.output) && operations.install.output.status === "installed",
    installedCheckCurrent: isRecord(operations.check) && operations.check.exitCode === 0 && isRecord(operations.check.output) && operations.check.output.status === "current",
    preTaskResumeReady: row(preTaskRows, "resume-fixture")?.state === "ready" && row(preTaskRows, "resume-fixture")?.reason === "runtime-interruption-ready",
    taskActionResumedOnce: row(taskRunRows, "resume-fixture")?.state === "resumed" && row(taskRunRows, "resume-fixture")?.attempts === 1,
    unknownWriterSuppressed: row(taskRunRows, "unknown-writer-fixture")?.state !== "resumed",
    gracefulStopObserved: row(stopRows, "resume-fixture")?.state === "stopped",
    explicitStopSuppressed: row(postStopRows, "resume-fixture")?.state !== "resumed" && row(postStopRows, "resume-fixture")?.reason === "explicit-stop",
    rollbackCompleted: isRecord(operations.rollback) && operations.rollback.exitCode === 0 && isRecord(operations.rollback.output) && operations.rollback.output.status === "removed",
    hostRemoved: after.campaignRootExists === false && isRecord(after.task) && after.task.exists === false,
    projectEvidencePreserved: raw.projectDigestBeforeRollback === raw.projectDigestAfterRollback,
    workstationIdentityPreserved: isRecord(before.workstation) && isRecord(after.workstation) && before.workstation.candidate === after.workstation.candidate && before.workstation.integrity === "complete" && after.workstation.integrity === "complete",
    workstationPrestateRestored: isRecord(before.workstation) && isRecord(after.workstation) && before.workstation.listeners === after.workstation.listeners && before.workstation.graphifyListeners === after.workstation.graphifyListeners,
    secretSafe: raw.secretLeakDetected === false && privateRoots.every((value) => !serializedRaw.includes(value)),
    sourceCurrent: Array.isArray(raw.sourceCandidate) && raw.sourceCandidate.length === sourcePaths.length && raw.sourceCandidate.every((entry) => isRecord(entry) && typeof entry.digest === "string" && /^[a-f0-9]{64}$/u.test(entry.digest)),
  };
  return {
    candidateId,
    checks,
    environmentId,
    failedChecks: Object.entries(checks).flatMap(([name, passed]) => passed ? [] : [name]),
    proofKind: "campaign-windows-installed-host",
    schemaVersion: 1,
    status: Object.values(checks).every(Boolean) ? "complete" : "blocked",
  };
}

export function evaluateInstalledOperator(raw: JsonRecord, candidateId: string, environmentId: string): JsonRecord {
  const configuredRaw = isRecord(raw.configured) ? raw.configured : {};
  const configuredEvaluation = evaluateConfiguredPlaybookScenario(configuredRaw, candidateId, environmentId);
  const configuredChecks = isRecord(configuredEvaluation.checks) ? configuredEvaluation.checks as Record<string, boolean> : {};
  const host = isRecord(raw.host) ? raw.host : {};
  const preflight = isRecord(raw.preflight) ? raw.preflight : {};
  const extensionProvisioning = isRecord(raw.extensionProvisioning) ? raw.extensionProvisioning : {};
  const operations = isRecord(host.operations) ? host.operations : {};
  const before = isRecord(raw.before) ? raw.before : {};
  const after = isRecord(raw.after) ? raw.after : {};
  const preTaskRows = Array.isArray(host.preTaskRows) ? host.preTaskRows.filter(isRecord) : [];
  const taskRunRows = Array.isArray(host.taskRunRows) ? host.taskRunRows.filter(isRecord) : [];
  const selectedRow = (rows: JsonRecord[]): JsonRecord | null => rows.find((row) => row.id === "configured-campaign") ?? null;
  const resumed = selectedRow(taskRunRows);
  const resumedCampaign = isRecord(resumed?.campaign) ? resumed.campaign : {};
  const serializedRaw = stableJson(raw).toLocaleLowerCase();
  const privateRoots = [sourceRoot, process.env.USERPROFILE ?? ""]
    .filter((value) => value !== "")
    .flatMap((value) => [value, value.replaceAll("\\", "/")])
    .flatMap((value) => [value, JSON.stringify(value).slice(1, -1)])
    .map((value) => value.toLocaleLowerCase());
  const checks: Record<string, boolean> = {
    ...configuredChecks,
    candidateMatched: raw.candidateId === candidateId && configuredChecks.candidateMatched === true,
    cleanupComplete: raw.cleanup === "complete",
    configuredScenarioComplete: configuredEvaluation.status === "complete" && configuredEvaluation.proofKind === "campaign-configured-scenario",
    environmentMatched: raw.environmentId === environmentId && configuredChecks.environmentMatched === true,
    extensionMaterialContained: operatorExtensionMaterialContained(extensionProvisioning.material)
      && operatorExtensionMaterialContained(raw.extensionFinalMaterial),
    failureAbsent: raw.failure == null && configuredRaw.captureError == null,
    firstMissionRoutedOnce: host.firstMissionHookCalls === 1 && host.firstMissionDirectResumes === 0,
    fixtureRemoved: raw.fixtureRemoved === true,
    hostInitiallyAbsent: before.campaignRootExists === false && isRecord(before.task) && before.task.exists === false,
    hostRemoved: after.campaignRootExists === false && isRecord(after.task) && after.task.exists === false,
    installedCheckCurrent: isRecord(operations.check) && operations.check.exitCode === 0 && isRecord(operations.check.output) && operations.check.output.status === "current",
    installCompleted: isRecord(operations.install) && operations.install.exitCode === 0 && isRecord(operations.install.output) && operations.install.output.status === "installed",
    preTaskResumeReady: selectedRow(preTaskRows)?.state === "ready" && selectedRow(preTaskRows)?.reason === "runtime-interruption-ready",
    preflightBound: typeof preflight.evaluationDigest === "string" && /^[a-f0-9]{64}$/u.test(preflight.evaluationDigest)
      && typeof preflight.rawDigest === "string" && /^[a-f0-9]{64}$/u.test(preflight.rawDigest)
      && operatorExtensionSurfaceMatches(preflight.runtimeSurface, raw.runtimeSurface)
      && stableJson(preflight.extensionProvisioning) === stableJson(extensionProvisioning.files),
    rollbackCompleted: isRecord(operations.rollback) && operations.rollback.exitCode === 0 && isRecord(operations.rollback.output) && operations.rollback.output.status === "removed",
    scheduledTaskResumedFirstMission: resumed?.state === "resumed" && resumed?.attempts === 1
      && resumedCampaign.phase === "verify" && resumedCampaign.disposition === "paused-external",
    secretSafe: raw.secretLeakDetected === false && privateRoots.every((value) => !serializedRaw.includes(value)),
    serverTerminal: raw.serverTerminal === true,
    sourceCurrent: Array.isArray(raw.sourceBefore) && Array.isArray(raw.sourceAfter)
      && raw.sourceBefore.length === operatorSourcePaths.length && stableJson(raw.sourceBefore) === stableJson(raw.sourceAfter),
    surfaceCurrent: stableJson(configuredRaw.runtimeSurface) === stableJson(raw.runtimeSurface),
    workstationIdentityPreserved: isRecord(before.workstation) && isRecord(after.workstation)
      && before.workstation.candidate === after.workstation.candidate
      && before.workstation.integrity === "complete" && after.workstation.integrity === "complete",
    workstationPrestateRestored: isRecord(before.workstation) && isRecord(after.workstation)
      && before.workstation.listeners === after.workstation.listeners
      && before.workstation.graphifyListeners === after.workstation.graphifyListeners,
    windowsSupervisorReentryObserved: resumed?.state === "resumed" && resumed?.attempts === 1,
  };
  const effects = isRecord(raw.effects) ? raw.effects : {};
  return {
    candidateId,
    checks,
    environmentId,
    failedChecks: Object.entries(checks).flatMap(([name, passed]) => passed ? [] : [name]),
    hostEffects: typeof effects.hostEffects === "number" ? effects.hostEffects : 0,
    liveCalls: configuredEvaluation.liveCalls ?? 0,
    modelCalls: configuredEvaluation.liveCalls ?? 0,
    proofKind: "campaign-installed-operator",
    schemaVersion: 1,
    sourceWrites: 0,
    status: Object.values(checks).every(Boolean) ? "complete" : "blocked",
  };
}

export function evaluateInstalledOperatorPreflight(raw: JsonRecord, candidateId: string, environmentId: string): JsonRecord {
  const before = isRecord(raw.before) ? raw.before : {};
  const after = isRecord(raw.after) ? raw.after : {};
  const effects = isRecord(raw.effects) ? raw.effects : {};
  const route = isRecord(raw.route) ? raw.route : {};
  const routeModel = isRecord(route.model) ? route.model : {};
  const surface = isRecord(raw.runtimeSurface) ? raw.runtimeSurface : {};
  const provisioning = isRecord(raw.extensionProvisioning) ? raw.extensionProvisioning : {};
  const statuses = Array.isArray(raw.worktreeStatuses) ? raw.worktreeStatuses.filter(isRecord) : [];
  const provisionedStatus = statuses.find((status) => status.stage === "extension-provisioned");
  const provisioningFiles = Array.isArray(provisioning.files) ? provisioning.files.filter(isRecord) : [];
  const serializedRaw = stableJson(raw).toLocaleLowerCase();
  const privateRoots = [sourceRoot, process.env.USERPROFILE ?? ""]
    .filter((value) => value !== "")
    .flatMap((value) => [value, value.replaceAll("\\", "/")])
    .flatMap((value) => [value, JSON.stringify(value).slice(1, -1)])
    .map((value) => value.toLocaleLowerCase());
  const checks: Record<string, boolean> = {
    candidateMatched: raw.candidateId === candidateId,
    cleanupComplete: raw.cleanup === "complete" && raw.fixtureRemoved === true && raw.serverTerminal === true,
    configuredModelCallsZero: effects.configuredModelCalls === 0,
    environmentMatched: raw.environmentId === environmentId,
    extensionProvisioningExact: provisioningFiles.length === operatorExtensionFiles.length
      && stableJson(provisioningFiles.map((file) => file.path)) === stableJson(operatorExtensionFiles)
      && provisioningFiles.every((file) => typeof file.bytes === "number" && file.bytes > 0 && typeof file.digest === "string" && /^[a-f0-9]{64}$/u.test(file.digest))
      && operatorExtensionMaterialContained(provisioning.material)
      && isRecord(provisioning.statuses) && provisioning.statuses.serena === "connected",
    failureAbsent: raw.failure == null,
    hostStatePreserved: before.campaignRootExists === false && after.campaignRootExists === false
      && isRecord(before.task) && before.task.exists === false && isRecord(after.task) && after.task.exists === false,
    installedIdentityCaptured: isRecord(raw.installedOpenCode)
      && typeof raw.installedOpenCode.sha256 === "string" && typeof raw.installedOpenCode.version === "string",
    routeMatched: typeof raw.expectedModel === "string"
      && `${String(routeModel.providerID ?? "")}/${String(routeModel.modelID ?? "")}` === raw.expectedModel,
    runtimeSurfaceCaptured: typeof surface.configDigest === "string"
      && Array.isArray(surface.mcpIds) && Array.isArray(surface.pluginIds),
    secretSafe: raw.secretLeakDetected === false && privateRoots.every((value) => !serializedRaw.includes(value)),
    sessionLifecycleComplete: isRecord(raw.session) && raw.session.created === true && raw.session.deleted === true,
    subsequentExtensionWritesAbsent: statuses.length >= 5
      && Array.isArray(provisionedStatus?.paths)
      && stableJson(provisionedStatus.paths) === stableJson(operatorExtensionFiles.map((relative) => `?? ${relative}`).sort())
      && statuses.filter((status) => status !== provisionedStatus).every((status) => Array.isArray(status.paths) && status.paths.length === 0),
    sourceCurrent: Array.isArray(raw.sourceBefore) && Array.isArray(raw.sourceAfter)
      && raw.sourceBefore.length === operatorSourcePaths.length && stableJson(raw.sourceBefore) === stableJson(raw.sourceAfter),
    workstationIdentityPreserved: isRecord(before.workstation) && isRecord(after.workstation)
      && before.workstation.candidate === after.workstation.candidate
      && before.workstation.integrity === "complete" && after.workstation.integrity === "complete",
    workstationPrestateRestored: isRecord(before.workstation) && isRecord(after.workstation)
      && before.workstation.listeners === after.workstation.listeners
      && before.workstation.graphifyListeners === after.workstation.graphifyListeners,
  };
  return {
    candidateId,
    checks,
    environmentId,
    failedChecks: Object.entries(checks).flatMap(([name, passed]) => passed ? [] : [name]),
    hostEffects: 0,
    liveCalls: 0,
    modelCalls: 0,
    proofKind: "campaign-installed-operator-preflight",
    schemaVersion: 1,
    sourceWrites: 0,
    status: Object.values(checks).every(Boolean) ? "complete" : "blocked",
  };
}

function operatorSourceIdentity(): Array<{ digest: string; path: string }> {
  return operatorSourcePaths.map((relative) => ({ digest: sha256(fs.readFileSync(path.join(sourceRoot, relative))), path: relative }));
}

function projectedOperation(operation: ReturnType<typeof runCommand> | undefined): JsonRecord | null {
  if (operation == null) return null;
  const status = isRecord(operation.output) && typeof operation.output.status === "string" ? operation.output.status : null;
  return {
    argv: operation.argv,
    exitCode: operation.exitCode,
    output: status == null ? null : { status },
    signal: operation.signal,
    stderr: operation.stderr,
    stdout: `sha256:${sha256(operation.stdout)}`,
  };
}

async function preflightInstalledOperator(options: Options): Promise<void> {
  if (process.platform !== "win32") throw new Error("Installed operator preflight requires win32.");
  if (options.opencodePath == null || options.profile == null) throw new Error("Installed operator runtime inputs are missing.");
  if (!fs.existsSync(options.opencodePath)) throw new Error("Installed OpenCode executable is missing.");
  if (fs.existsSync(options.evidenceRoot)) throw new Error("Evidence root already exists.");
  const secret = readCredentialSecret(options.credentialTarget);
  const proofRoot = fs.mkdtempSync(path.join(os.tmpdir(), "work-campaign-installed-operator-preflight-"));
  const fixtureRoot = path.join(proofRoot, "fixture");
  const runtimeRoot = path.join(proofRoot, "runtime");
  const environment = prepareManagedOperatorEnvironment(runtimeRoot, secret);
  const profile = loadModelProfile(sourceRoot, options.profile).profile;
  const configured = profile.agent?.general as { model?: string } | undefined;
  if (typeof configured?.model !== "string") throw new Error("Configured general model route is unavailable.");
  const beforeTask = taskState();
  const beforeRoot = fs.existsSync(WORK_CAMPAIGN_SUPERVISOR_PROTECTED_ROOT);
  const beforeStatus = runCommand("operator-preflight-workstation-before", process.execPath, [installedWorkstationController, "status"], proofRoot, 180_000);
  const beforeWorkstation = projectedWorkstationStatus(beforeStatus.output);
  const sourceBefore = operatorSourceIdentity();
  const worktreeStatuses: JsonRecord[] = [];
  let server: ProofServerHandle | null = null;
  let serverTerminal = false;
  let runtimeSurface: ProofRuntimeSurface | null = null;
  let route: JsonRecord | null = null;
  let extensionProvisioning: JsonRecord | null = null;
  let sessionCreated = false;
  let sessionDeleted = false;
  let failure: JsonRecord | null = null;
  let logs = { stderr: "", stdout: "" };
  try {
    if (beforeRoot || beforeTask.exists) throw new Error("Campaign supervisor host state is not initially absent.");
    if (beforeWorkstation?.integrity !== "complete") throw new Error("Installed workstation identity is not complete.");
    initializeOperatorPreflightFixture(fixtureRoot);
    worktreeStatuses.push(operatorPorcelain(fixtureRoot, "fixture-created"));
    server = await startProofServer(options.opencodePath, fixtureRoot, environment);
    const client = proofClient(server.url, fixtureRoot, environment);
    const resolved = await waitForProofRoute(client, fixtureRoot, "general", 30_000);
    await assertProofRouteAvailable(client, fixtureRoot, resolved);
    route = resolved as unknown as JsonRecord;
    runtimeSurface = projectOperatorRuntimeSurface(await proofRuntimeSurface(client, fixtureRoot));
    worktreeStatuses.push(operatorPorcelain(fixtureRoot, "managed-surface-loaded"));
    extensionProvisioning = await provisionOperatorExtensions(client, fixtureRoot);
    const provisionedStatus = operatorPorcelain(fixtureRoot, "extension-provisioned");
    const provisionedPaths = Array.isArray(provisionedStatus.paths) ? provisionedStatus.paths : [];
    if (stableJson(provisionedPaths) !== stableJson(operatorExtensionFiles.map((relative) => `?? ${relative}`).sort())) {
      throw new Error("Managed extensions wrote outside the reviewed fixture baseline.");
    }
    worktreeStatuses.push(provisionedStatus);
    gitFixtureCommand(fixtureRoot, ["add", "-f", ...operatorExtensionFiles]);
    gitFixtureCommand(fixtureRoot, [
      "-c", "user.name=Campaign Proof",
      "-c", "user.email=campaign-proof@example.invalid",
      "-c", "commit.gpgsign=false",
      "commit", "-m", "checkpoint managed extension fixture baseline",
    ]);
    worktreeStatuses.push(operatorPorcelain(fixtureRoot, "extension-baseline-committed"));
    const created = await client.session.create({ directory: fixtureRoot, title: "installed operator zero-call preflight" }) as { data?: { id?: string }; error?: unknown };
    if (created.error != null || typeof created.data?.id !== "string") throw new Error("Installed operator preflight session creation failed.");
    sessionCreated = true;
    const deleted = await client.session.delete({ directory: fixtureRoot, sessionID: created.data.id }) as { error?: unknown };
    if (deleted.error != null) throw new Error("Installed operator preflight session cleanup failed.");
    sessionDeleted = true;
    worktreeStatuses.push(operatorPorcelain(fixtureRoot, "session-cleaned"));
  } catch (error) {
    const startup = proofServerStartupFailure(error);
    if (startup != null) {
      logs = proofServerLogs(startup.server);
      if (startup.terminal != null) serverTerminal = true;
      else server = startup.server;
    }
    failure = projectedOperatorFailure(error, secret, proofRoot);
  } finally {
    if (server != null) {
      logs = proofServerLogs(server);
      try {
        await stopProofServer(server);
        serverTerminal = true;
      } catch (error) {
        failure ??= projectedOperatorFailure(error, secret, proofRoot);
      }
    }
    if (fs.existsSync(path.join(fixtureRoot, ".git"))) {
      try { worktreeStatuses.push(operatorPorcelain(fixtureRoot, "server-stopped")); } catch {}
    }
  }
  const afterTask = taskState();
  const afterRoot = fs.existsSync(WORK_CAMPAIGN_SUPERVISOR_PROTECTED_ROOT);
  const afterStatus = runCommand("operator-preflight-workstation-after", process.execPath, [installedWorkstationController, "status"], proofRoot, 180_000);
  const afterWorkstation = projectedWorkstationStatus(afterStatus.output);
  const sourceAfter = operatorSourceIdentity();
  const leak = secretLeakDetected(proofRoot, [logs.stdout, logs.stderr], options.credentialTarget);
  try { removeProofFixture(proofRoot); } catch {}
  const fixtureRemoved = !fs.existsSync(proofRoot);
  const cleanup = fixtureRemoved && serverTerminal && !afterRoot && !afterTask.exists
    && beforeWorkstation?.listeners === afterWorkstation?.listeners
    && beforeWorkstation?.graphifyListeners === afterWorkstation?.graphifyListeners
    ? "complete" : "unknown";
  const raw: JsonRecord = {
    after: { campaignRootExists: afterRoot, task: afterTask, workstation: afterWorkstation },
    before: { campaignRootExists: beforeRoot, task: beforeTask, workstation: beforeWorkstation },
    candidateId: options.candidateId,
    cleanup,
    credential: { persistedInEvidence: false, source: "protected-file" },
    effects: { configuredModelCalls: 0, hostMutations: 0, sourceWrites: 0 },
    environmentId: options.environmentId,
    expectedModel: configured.model,
    extensionProvisioning,
    failure,
    fixtureRemoved,
    installedOpenCode: installedOpenCodeIdentity(options.opencodePath),
    proofKind: "campaign-installed-operator-preflight",
    route,
    runtimeSurface,
    schemaVersion: 1,
    secretLeakDetected: leak,
    serverDiagnostics: {
      stderrDigest: sha256(logs.stderr),
      stderrTail: projectedOperatorLog(logs.stderr, secret, proofRoot),
      stdoutDigest: sha256(logs.stdout),
    },
    serverTerminal,
    session: { created: sessionCreated, deleted: sessionDeleted },
    sourceAfter,
    sourceBefore,
    worktreeStatuses,
  };
  const evaluation = evaluateInstalledOperatorPreflight(raw, options.candidateId, options.environmentId);
  writeNew(path.join(options.evidenceRoot, "raw.json"), raw);
  writeNew(path.join(options.evidenceRoot, "evaluation.json"), evaluation);
  console.log(stableJson({ candidateId: options.candidateId, evidenceRoot: "<evidence-root>", liveCalls: 0, mode: "operator-preflight", status: evaluation.status }).trimEnd());
  if (evaluation.status !== "complete") process.exitCode = 1;
}

async function captureInstalledOperator(options: Options): Promise<void> {
  if (process.platform !== "win32") throw new Error("Installed operator capture requires win32.");
  if (options.opencodePath == null || options.profile == null || options.preflightInputRoot == null) throw new Error("Installed operator runtime inputs are missing.");
  if (!fs.existsSync(options.opencodePath)) throw new Error("Installed OpenCode executable is missing.");
  if (fs.existsSync(options.evidenceRoot)) throw new Error("Evidence root already exists.");
  const preflightRawText = fs.readFileSync(path.join(options.preflightInputRoot, "raw.json"), "utf8");
  const preflightEvaluationText = fs.readFileSync(path.join(options.preflightInputRoot, "evaluation.json"), "utf8");
  const preflightRaw = JSON.parse(preflightRawText) as JsonRecord;
  const preflightEvaluation = JSON.parse(preflightEvaluationText) as JsonRecord;
  const currentPreflight = evaluateInstalledOperatorPreflight(preflightRaw, options.candidateId, options.environmentId);
  if (preflightEvaluation.proofKind !== "campaign-installed-operator-preflight" || preflightEvaluation.status !== "complete"
    || stableJson(preflightEvaluation) !== stableJson(currentPreflight)
    || stableJson(preflightRaw.sourceAfter) !== stableJson(operatorSourceIdentity())) {
    throw new Error("Installed operator preflight is stale, blocked, or identity-mismatched.");
  }
  const secret = readCredentialSecret(options.credentialTarget);
  const proofRoot = fs.mkdtempSync(path.join(os.tmpdir(), "work-campaign-installed-operator-"));
  const fixtureRoot = path.join(proofRoot, "fixture");
  const runtimeRoot = path.join(proofRoot, "runtime");
  const registry = path.join(proofRoot, "registry.json");
  const environment = prepareManagedOperatorEnvironment(runtimeRoot, secret);
  const profile = loadModelProfile(sourceRoot, options.profile).profile;
  const configuredRoute = profile.agent?.general as { model?: string } | undefined;
  if (typeof configuredRoute?.model !== "string") throw new Error("Configured general model route is unavailable.");
  const openCodeIdentity = installedOpenCodeIdentity(options.opencodePath);
  const operations: Record<string, ReturnType<typeof runCommand>> = {};
  const beforeTask = taskState();
  const beforeRoot = fs.existsSync(WORK_CAMPAIGN_SUPERVISOR_PROTECTED_ROOT);
  const beforeStatusCommand = runCommand("workstation-before", process.execPath, [installedWorkstationController, "status"], proofRoot, 180_000);
  const beforeWorkstation = projectedWorkstationStatus(beforeStatusCommand.output);
  const sourceBefore = operatorSourceIdentity();
  let configuredRaw: JsonRecord = {};
  let extensionProvisioning: JsonRecord | null = null;
  let extensionFinalMaterial: JsonRecord[] = [];
  let runtimeSurface: ProofRuntimeSurface | null = null;
  let server: ProofServerHandle | null = null;
  let serverTerminal = false;
  let serverLogs = { stderr: "", stdout: "" };
  let firstMissionHookCalls = 0;
  let installed = false;
  let cleanup = "unknown";
  let preTaskRows: JsonRecord[] = [];
  let taskRunRows: JsonRecord[] = [];
  let failure: JsonRecord | null = null;
  let leak = false;
  try {
    if (beforeRoot || beforeTask.exists) throw new Error("Campaign supervisor host state is not initially absent.");
    if (beforeWorkstation?.integrity !== "complete") throw new Error("Installed workstation identity is not complete.");
    fs.mkdirSync(fixtureRoot, { recursive: true });
    gitFixtureCommand(fixtureRoot, ["init", "-b", "main"]);
    server = await startProofServer(options.opencodePath, fixtureRoot, environment);
    const client = proofClient(server.url, fixtureRoot, environment);
    const route = await waitForProofRoute(client, fixtureRoot, "general", 30_000);
    await assertProofRouteAvailable(client, fixtureRoot, route);
    if (`${route.model.providerID}/${route.model.modelID}` !== configuredRoute.model) {
      throw new Error("Installed operator route differs from selected profile.");
    }
    runtimeSurface = projectOperatorRuntimeSurface(await proofRuntimeSurface(client, fixtureRoot));
    if (!operatorExtensionSurfaceMatches(runtimeSurface, preflightRaw.runtimeSurface)) {
      throw new Error("Installed operator runtime surface differs from the accepted zero-call preflight.");
    }
    extensionProvisioning = await provisionOperatorExtensions(client, fixtureRoot);
    const preflightProvisioning = isRecord(preflightRaw.extensionProvisioning) ? preflightRaw.extensionProvisioning : {};
    if (stableJson(extensionProvisioning.files) !== stableJson(preflightProvisioning.files)
      || !operatorExtensionMaterialContained(extensionProvisioning.material)
      || !operatorFixtureFiles(fixtureRoot).every((relative) => relative.startsWith(".serena/"))) {
      throw new Error("Installed operator extension fixture baseline differs from the accepted zero-call preflight.");
    }
    const created = await client.session.create({ directory: fixtureRoot, title: "installed operator live guard" }) as { data?: { id?: string }; error?: unknown };
    if (created.error != null || typeof created.data?.id !== "string") throw new Error("Installed operator live guard session creation failed.");
    const deleted = await client.session.delete({ directory: fixtureRoot, sessionID: created.data.id }) as { error?: unknown };
    if (deleted.error != null) throw new Error("Installed operator live guard session cleanup failed.");
    if (!operatorExtensionMaterialContained(operatorExtensionMaterial(fixtureRoot))
      || !operatorFixtureFiles(fixtureRoot).every((relative) => relative.startsWith(".serena/"))) {
      throw new Error("Installed operator extension surface wrote outside the reviewed live fixture baseline.");
    }
    const runtime: ConfiguredPlaybookRuntime = {
      environment,
      expectedModel: configuredRoute.model,
      installedOpenCode: openCodeIdentity,
      runtimeSurface,
      serverUrl: server.url,
    };
    configuredRaw = await captureConfiguredPlaybook({
      candidateId: options.candidateId,
      environmentId: options.environmentId,
      evidenceRoot: options.evidenceRoot,
      inputRoot: null,
      mode: "capture",
      opencode: options.opencodePath,
      profile: options.profile,
    }, {
      firstMissionResume: async (context) => {
        firstMissionHookCalls++;
        if (firstMissionHookCalls !== 1) throw new Error("Installed operator first-mission handoff was invoked more than once.");
        writeNew(registry, {
          policy: { backoffMs: [10], commandTimeoutMs: 120_000, healthPollMs: 100, healthTimeoutMs: 30_000, logBytes: 16_384, logGenerations: 2, maxRestarts: 1 },
          registrations: [{ definitionDigest: context.definitionDigest, definitionPath: "definition.json", enabled: true, id: "configured-campaign", root: context.fixtureRoot }],
          runtime: { endpoint: context.runtimeEndpoint, expectedVersion: context.runtimeVersion },
          schemaVersion: 1,
          workCampaignDigest: sha256(fs.readFileSync(path.join(sourceRoot, "global", "bin", "work-campaign.ts"))),
        });
        const commonArgs = [
          "--kit-root", sourceRoot,
          "--registry", registry,
          "--workstation-manifest", workstationManifest,
          "--workstation-root", path.dirname(options.credentialTarget),
        ];
        operations.install = runCommand("operator-install", process.execPath, [installer, "install", ...commonArgs], proofRoot, 300_000);
        if (operations.install.exitCode !== 0) throw new Error("Installed operator supervisor install failed.");
        installed = true;
        operations.check = runCommand("operator-check", process.execPath, [installer, "check", ...commonArgs], proofRoot, 180_000);
        if (operations.check.exitCode !== 0) throw new Error("Installed operator supervisor check failed.");
        operations.preTaskStatus = runCommand("operator-pre-task-status", process.execPath, [installedHost, "status"], proofRoot, 180_000);
        preTaskRows = projectOperatorRows(operations.preTaskStatus.output);
        const ready = preTaskRows.find((row) => row.id === "configured-campaign");
        if (ready?.state !== "ready" || ready.reason !== "runtime-interruption-ready") {
          throw new Error("Installed operator first mission was not durably ready before task invocation.");
        }
        const resultBefore = fileDigest(installedResult);
        operations.taskRun = runCommand("operator-run-task", process.execPath, [installer, "run-task", ...commonArgs], proofRoot, 180_000);
        if (operations.taskRun.exitCode !== 0) throw new Error("Installed operator Scheduled Task did not start.");
        await waitFor(
          () => fileDigest(installedResult) != null && fileDigest(installedResult) !== resultBefore && taskState().state?.toLocaleLowerCase() !== "running",
          180_000,
          "Installed operator Scheduled Task did not reach a terminal result.",
        );
        taskRunRows = projectOperatorRows(JSON.parse(fs.readFileSync(installedResult, "utf8")) as unknown);
        const resumed = taskRunRows.find((row) => row.id === "configured-campaign");
        const campaign = isRecord(resumed?.campaign) ? resumed.campaign : {};
        if (resumed?.state !== "resumed" || resumed.attempts !== 1 || campaign.phase !== "verify" || campaign.disposition !== "paused-external") {
          throw new Error("Installed operator Scheduled Task did not consume the first mission exactly once.");
        }
        return { ...campaign, exitCode: 3 };
      },
      fixtureRoot,
      hostResume: true,
      runtime,
      writeEvidence: false,
    });
    extensionFinalMaterial = operatorExtensionMaterial(fixtureRoot);
  } catch (error) {
    const startup = proofServerStartupFailure(error);
    if (startup != null) {
      serverLogs = proofServerLogs(startup.server);
      if (startup.terminal != null) serverTerminal = true;
      else server = startup.server;
    }
    failure = projectedOperatorFailure(error, secret, proofRoot);
  } finally {
    const hostLeak = secretLeakDetected(
      WORK_CAMPAIGN_SUPERVISOR_PROTECTED_ROOT,
      [...Object.values(operations).flatMap((operation) => [operation.stdout, operation.stderr]), stableJson(configuredRaw)],
      options.credentialTarget,
    );
    if (installed && fs.existsSync(registry)) {
      const commonArgs = [
        "--kit-root", sourceRoot,
        "--registry", registry,
        "--workstation-manifest", workstationManifest,
        "--workstation-root", path.dirname(options.credentialTarget),
      ];
      operations.rollback = runCommand("operator-rollback", process.execPath, [installer, "rollback", ...commonArgs], proofRoot, 180_000);
      installed = operations.rollback.exitCode !== 0;
    }
    if (server != null) {
      serverLogs = proofServerLogs(server);
      try {
        await stopProofServer(server);
        serverTerminal = true;
      } catch (error) {
        failure ??= projectedOperatorFailure(error, secret, proofRoot);
      }
    }
    leak = hostLeak || secretLeakDetected(
      proofRoot,
      [serverLogs.stdout, serverLogs.stderr, stableJson(configuredRaw)],
      options.credentialTarget,
    );
  }
  const afterTask = taskState();
  const afterRoot = fs.existsSync(WORK_CAMPAIGN_SUPERVISOR_PROTECTED_ROOT);
  const afterStatusCommand = runCommand("workstation-after", process.execPath, [installedWorkstationController, "status"], proofRoot, 180_000);
  const afterWorkstation = projectedWorkstationStatus(afterStatusCommand.output);
  const sourceAfter = operatorSourceIdentity();
  try { removeProofFixture(proofRoot); } catch {}
  const fixtureRemoved = !fs.existsSync(proofRoot);
  cleanup = !afterRoot && !afterTask.exists && fixtureRemoved && serverTerminal
    && beforeWorkstation?.listeners === afterWorkstation?.listeners
    && beforeWorkstation?.graphifyListeners === afterWorkstation?.graphifyListeners
    ? "complete" : "unknown";
  const hostOperations = Object.fromEntries(Object.entries(operations).map(([name, operation]) => [name, projectedOperation(operation)]));
  const raw: JsonRecord = {
    after: { campaignRootExists: afterRoot, task: afterTask, workstation: afterWorkstation },
    before: { campaignRootExists: beforeRoot, task: beforeTask, workstation: beforeWorkstation },
    candidateId: options.candidateId,
    cleanup,
    configured: configuredRaw,
    credential: { persistedInEvidence: false, source: "protected-file" },
    effects: {
      hostEffects: ["install", "taskRun", "rollback"].filter((name) => operations[name]?.exitCode === 0).length,
      remoteEffects: 0,
      sourceWrites: 0,
    },
    environmentId: options.environmentId,
    extensionFinalMaterial,
    extensionProvisioning,
    failure,
    fixtureRemoved,
    host: { firstMissionDirectResumes: 0, firstMissionHookCalls, operations: hostOperations, preTaskRows, taskRunRows },
    installedOpenCode: openCodeIdentity,
    preflight: {
      evaluationDigest: sha256(preflightEvaluationText),
      inputBundle: path.basename(options.preflightInputRoot),
      rawDigest: sha256(preflightRawText),
      extensionProvisioning: isRecord(preflightRaw.extensionProvisioning) ? preflightRaw.extensionProvisioning.files : null,
      runtimeSurface: preflightRaw.runtimeSurface,
    },
    proofKind: "campaign-installed-operator",
    runtimeSurface,
    schemaVersion: 1,
    secretLeakDetected: leak,
    serverDiagnostics: {
      stderrDigest: sha256(serverLogs.stderr),
      stderrTail: projectedOperatorLog(serverLogs.stderr, secret, proofRoot),
      stdoutDigest: sha256(serverLogs.stdout),
    },
    serverTerminal,
    sourceAfter,
    sourceBefore,
  };
  const evaluation = evaluateInstalledOperator(raw, options.candidateId, options.environmentId);
  writeNew(path.join(options.evidenceRoot, "raw.json"), raw);
  writeNew(path.join(options.evidenceRoot, "evaluation.json"), evaluation);
  console.log(stableJson({ candidateId: options.candidateId, cleanup, evidenceRoot: "<evidence-root>", hostEffects: evaluation.hostEffects, mode: "operator-capture", status: evaluation.status }).trimEnd());
  if (evaluation.status !== "complete") process.exitCode = 1;
}

async function capture(options: Options): Promise<void> {
  if (process.platform !== "win32") throw new Error("Installed Windows capture requires win32.");
  if (fs.existsSync(options.evidenceRoot)) throw new Error("Evidence root already exists.");
  const proofRoot = fs.mkdtempSync(path.join(os.tmpdir(), "work-campaign-windows-installed-"));
  const resumeProject = path.join(proofRoot, "resume-project");
  const unknownProject = path.join(proofRoot, "unknown-project");
  const registry = path.join(proofRoot, "registry.json");
  const operations: Record<string, ReturnType<typeof runCommand>> = {};
  const beforeTask = taskState();
  const beforeRoot = fs.existsSync(WORK_CAMPAIGN_SUPERVISOR_PROTECTED_ROOT);
  let writerProcess: ReturnType<typeof spawn> | null = null;
  let runtimeStarted = false;
  let installed = false;
  let cleanup = "unknown";
  let projectDigestBeforeRollback: string | null = null;
  let projectDigestAfterRollback: string | null = null;
  let preTaskRows: JsonRecord[] = [];
  let taskRunRows: JsonRecord[] = [];
  let stopRows: JsonRecord[] = [];
  let postStopRows: JsonRecord[] = [];
  let failure: JsonRecord | null = null;
  let leakBeforeRollback = false;
  const beforeStatusCommand = runCommand("workstation-before", process.execPath, [installedWorkstationController, "status"], proofRoot, 180_000);
  const beforeWorkstation = projectedWorkstationStatus(beforeStatusCommand.output);
  const preexistingRuntime = beforeWorkstation?.listeners === 1;
  try {
    if (beforeRoot || beforeTask.exists) throw new Error("Campaign supervisor host state is not initially absent.");
    if (beforeWorkstation?.integrity !== "complete") throw new Error("Installed workstation identity is not complete.");
    const generated = spawnSync(process.execPath, [path.join(sourceRoot, "tools", "test-work-campaign-controller.ts")], {
      cwd: sourceRoot,
      encoding: "utf8",
      env: { ...process.env, WORK_CAMPAIGN_WINDOWS_INSTALLED_FIXTURE_ROOT: resumeProject },
      shell: false,
      timeout: 600_000,
      windowsHide: true,
    });
    operations.fixture = {
      argv: ["node", "tools/test-work-campaign-controller.ts"],
      exitCode: generated.status,
      name: "fixture",
      output: null,
      signal: generated.signal,
      stderr: redact(generated.stderr ?? "", proofRoot),
      stdout: redact(generated.stdout ?? "", proofRoot),
    };
    if (operations.fixture.exitCode !== 0 || !fs.existsSync(resumeProject)) throw new Error("Provider-free installed fixture generation failed.");
    fs.cpSync(resumeProject, unknownProject, { recursive: true });
    const definition = loadWorkCampaignDefinition(resumeProject, "campaign.json");
    const unknownDefinition = loadWorkCampaignDefinition(unknownProject, "campaign.json");
    const writerLock = path.join(unknownProject, ".opencode-dev-kit", "runtime", "work-campaigns", "fixture-campaign", "writer.lock");
    const stateUrl = pathToFileURL(path.join(sourceRoot, "global", "bin", "work-campaign", "state.ts")).href;
    const contractsUrl = pathToFileURL(path.join(sourceRoot, "global", "bin", "work-campaign", "contracts.ts")).href;
    const writerScript = [
      `import crypto from 'node:crypto'; import fs from 'node:fs';`,
      `import { loadWorkCampaignDefinition } from ${JSON.stringify(contractsUrl)};`,
      `import { acquireCampaignWriterLease } from ${JSON.stringify(stateUrl)};`,
      `const project=${JSON.stringify(unknownProject)}; const definition=loadWorkCampaignDefinition(project,'campaign.json').definition;`,
      `const executableDigest=crypto.createHash('sha256').update(fs.readFileSync(process.execPath)).digest('hex');`,
      `acquireCampaignWriterLease(project,definition,{createdAt:new Date().toISOString(),executableDigest,pid:process.pid,processRef:'process:installed-unknown-'+process.pid});`,
      `setInterval(()=>{},1000);`,
    ].join("\n");
    writerProcess = spawn(process.execPath, ["--input-type=module", "--eval", writerScript], { cwd: sourceRoot, shell: false, stdio: ["ignore", "ignore", "pipe"], windowsHide: true });
    await waitFor(() => fs.existsSync(writerLock), 10_000, "Proof-owned unknown writer lease was not created.");
    const opencodeVersion = runCommand("opencode-version", "opencode.exe", ["--version"], proofRoot, 120_000);
    operations.opencodeVersion = opencodeVersion;
    const version = opencodeVersion.stdout.trim();
    if (opencodeVersion.exitCode !== 0 || version === "") throw new Error("OpenCode version identity is unavailable.");
    writeNew(registry, {
      policy: { backoffMs: [10], commandTimeoutMs: 120_000, healthPollMs: 100, healthTimeoutMs: 30_000, logBytes: 16_384, logGenerations: 2, maxRestarts: 1 },
      registrations: [
        { definitionDigest: definition.definitionDigest, definitionPath: "campaign.json", enabled: true, id: "resume-fixture", root: resumeProject },
        { definitionDigest: unknownDefinition.definitionDigest, definitionPath: "campaign.json", enabled: true, id: "unknown-writer-fixture", root: unknownProject },
      ],
      runtime: { endpoint: "http://127.0.0.1:4096", expectedVersion: version },
      schemaVersion: 1,
      workCampaignDigest: sha256(fs.readFileSync(path.join(sourceRoot, "global", "bin", "work-campaign.ts"))),
    });
    if (!preexistingRuntime) {
      operations.workstationStart = runCommand("workstation-start", process.execPath, [installedWorkstationController, "start"], proofRoot, 300_000);
      if (operations.workstationStart.exitCode !== 0) throw new Error("Existing workstation runtime failed to start.");
      runtimeStarted = true;
    }
    const commonArgs = ["--kit-root", sourceRoot, "--registry", registry, "--workstation-manifest", workstationManifest];
    operations.install = runCommand("install", process.execPath, [installer, "install", ...commonArgs], proofRoot, 300_000);
    if (operations.install.exitCode !== 0) throw new Error("Campaign supervisor install failed.");
    installed = true;
    operations.check = runCommand("check", process.execPath, [installer, "check", ...commonArgs], proofRoot, 180_000);
    if (operations.check.exitCode !== 0) throw new Error("Campaign supervisor installed check failed.");
    operations.preTaskStatus = runCommand("pre-task-status", process.execPath, [installedHost, "status"], proofRoot, 180_000);
    preTaskRows = projectRows(operations.preTaskStatus.output);
    const firstResultBefore = fileDigest(installedResult);
    operations.taskRun = runCommand("run-task", process.execPath, [installer, "run-task", ...commonArgs], proofRoot, 180_000);
    if (operations.taskRun.exitCode !== 0) throw new Error("Scheduled Task action did not start.");
    await waitFor(() => fileDigest(installedResult) != null && fileDigest(installedResult) !== firstResultBefore && taskState().state?.toLocaleLowerCase() !== "running", 180_000, "Scheduled Task action did not reach terminal result.");
    taskRunRows = projectRows(JSON.parse(fs.readFileSync(installedResult, "utf8")) as unknown);
    operations.status = runCommand("status", process.execPath, [installedHost, "status"], proofRoot, 180_000);
    operations.stop = runCommand("stop", process.execPath, [installedHost, "stop"], proofRoot, 180_000);
    stopRows = projectRows(operations.stop.output);
    const secondResultBefore = fileDigest(installedResult);
    operations.postStopTaskRun = runCommand("post-stop-run-task", process.execPath, [installer, "run-task", ...commonArgs], proofRoot, 180_000);
    if (operations.postStopTaskRun.exitCode !== 0) throw new Error("Post-stop Scheduled Task action did not start.");
    await waitFor(() => fileDigest(installedResult) != null && fileDigest(installedResult) !== secondResultBefore && taskState().state?.toLocaleLowerCase() !== "running", 180_000, "Post-stop Scheduled Task action did not reach terminal result.");
    postStopRows = projectRows(JSON.parse(fs.readFileSync(installedResult, "utf8")) as unknown);
    if (writerProcess.pid != null) killProcessTree(writerProcess.pid);
    await waitFor(() => writerProcess?.exitCode != null || writerProcess?.signalCode != null, 10_000, "Proof-owned writer did not terminate.");
    projectDigestBeforeRollback = sha256(`${treeDigest(resumeProject)}:${treeDigest(unknownProject)}`);
    leakBeforeRollback = secretLeakDetected(WORK_CAMPAIGN_SUPERVISOR_PROTECTED_ROOT, Object.values(operations).flatMap((operation) => [operation.stdout, operation.stderr]));
    operations.rollback = runCommand("rollback", process.execPath, [installer, "rollback", ...commonArgs], proofRoot, 180_000);
    if (operations.rollback.exitCode !== 0) throw new Error("Campaign supervisor rollback failed.");
    installed = false;
    projectDigestAfterRollback = sha256(`${treeDigest(resumeProject)}:${treeDigest(unknownProject)}`);
  } catch (error) {
    failure = { message: error instanceof Error ? redact(error.message, proofRoot) : "Installed host capture failed.", type: error instanceof Error ? error.name : "Error" };
  } finally {
    if (writerProcess?.pid != null && writerProcess.exitCode == null && writerProcess.signalCode == null) killProcessTree(writerProcess.pid);
    if (installed && fs.existsSync(registry)) {
      const commonArgs = ["--kit-root", sourceRoot, "--registry", registry, "--workstation-manifest", workstationManifest];
      operations.recoveryRollback = runCommand("recovery-rollback", process.execPath, [installer, "rollback", ...commonArgs], proofRoot, 180_000);
      installed = operations.recoveryRollback.exitCode !== 0;
    }
    if (runtimeStarted) operations.workstationStop = runCommand("workstation-stop", process.execPath, [installedWorkstationController, "stop"], proofRoot, 180_000);
    const afterTask = taskState();
    const afterRoot = fs.existsSync(WORK_CAMPAIGN_SUPERVISOR_PROTECTED_ROOT);
    const afterStatus = runCommand("workstation-after", process.execPath, [installedWorkstationController, "status"], proofRoot, 180_000);
    const afterWorkstation = projectedWorkstationStatus(afterStatus.output);
    const commandTexts = Object.values(operations).flatMap((operation) => [operation.stdout, operation.stderr]);
    const leak = leakBeforeRollback || secretLeakDetected(WORK_CAMPAIGN_SUPERVISOR_PROTECTED_ROOT, commandTexts);
    try { fs.rmSync(proofRoot, { recursive: true, force: true }); } catch {}
    cleanup = !afterRoot && !afterTask.exists && !fs.existsSync(proofRoot)
      && (!runtimeStarted || (afterWorkstation?.listeners === 0 && afterWorkstation?.graphifyListeners === 0))
      ? "complete" : "unknown";
    const raw: JsonRecord = {
      after: { campaignRootExists: afterRoot, task: afterTask, workstation: afterWorkstation },
      before: { campaignRootExists: beforeRoot, task: beforeTask, workstation: beforeWorkstation },
      candidateId: options.candidateId,
      cleanup,
      effects: {
        configuredModelCalls: 0,
        hostMutations: ["install", "preTaskStatus", "taskRun", "status", "stop", "postStopTaskRun", "rollback", "workstationStart", "workstationStop"]
          .filter((name) => operations[name]?.exitCode === 0).length,
        providerCalls: 0,
        remoteEffects: 0,
      },
      environmentId: options.environmentId,
      failure,
      operations: Object.fromEntries(Object.entries(operations).map(([name, operation]) => [name, {
        argv: operation.argv,
        exitCode: operation.exitCode,
        output: name.startsWith("workstation") ? projectedWorkstationStatus(operation.output)
          : name === "fixture" || name === "opencodeVersion" ? null : operation.output,
        signal: operation.signal,
        stderr: operation.stderr,
        stdout: name === "fixture" || name.startsWith("workstation") ? `sha256:${sha256(operation.stdout)}` : operation.stdout,
      }])),
      postStopRows,
      preTaskRows,
      projectDigestAfterRollback,
      projectDigestBeforeRollback,
      proofKind: "campaign-windows-installed-host",
      schemaVersion: 1,
      secretLeakDetected: leak,
      sourceCandidate: sourcePaths.map((relative) => ({ digest: sha256(fs.readFileSync(path.join(sourceRoot, relative))), path: relative })),
      stopRows,
      taskRunRows,
    };
    const projectedRaw = projectRaw(raw);
    const evaluation = evaluate(projectedRaw, options.candidateId, options.environmentId);
    writeNew(path.join(options.evidenceRoot, "raw.json"), projectedRaw);
    writeNew(path.join(options.evidenceRoot, "evaluation.json"), evaluation);
    console.log(stableJson({ candidateId: options.candidateId, cleanup, evidenceRoot: "<evidence-root>", hostMutations: (projectedRaw.effects as JsonRecord).hostMutations, mode: "capture", status: evaluation.status }).trimEnd());
    if (evaluation.status !== "complete") process.exitCode = 1;
  }
}

function replay(options: Options): void {
  if (options.inputRoot == null || !fs.existsSync(path.join(options.inputRoot, "raw.json"))) throw new Error("Replay input root has no raw.json.");
  if (fs.existsSync(options.evidenceRoot)) throw new Error("Evidence root already exists.");
  const sourceRaw = fs.readFileSync(path.join(options.inputRoot, "raw.json"), "utf8");
  const raw = projectRaw(JSON.parse(sourceRaw) as JsonRecord, {
    kind: "privacy-safe-projection",
    liveCalls: 0,
    sourceRawDigest: sha256(sourceRaw),
  });
  const sourceEvaluation = JSON.parse(fs.readFileSync(path.join(options.inputRoot, "evaluation.json"), "utf8")) as JsonRecord;
  const operator = raw.proofKind === "campaign-installed-operator";
  const operatorPreflight = raw.proofKind === "campaign-installed-operator-preflight";
  const evaluation = operator
    ? evaluateInstalledOperator(raw, options.candidateId, options.environmentId)
    : operatorPreflight
      ? evaluateInstalledOperatorPreflight(raw, options.candidateId, options.environmentId)
      : evaluate(raw, options.candidateId, options.environmentId);
  const sourceEvaluationCurrent = stableJson(sourceEvaluation) === stableJson(evaluation);
  if (operator || operatorPreflight) {
    (evaluation.checks as Record<string, boolean>).sourceEvaluationCurrent = sourceEvaluationCurrent;
    evaluation.liveCalls = 0;
    evaluation.status = Object.values(evaluation.checks as Record<string, boolean>).every(Boolean) ? "complete" : "blocked";
  } else if (!sourceEvaluationCurrent) {
    (evaluation.checks as Record<string, boolean>).sourceEvaluationCurrent = false;
    evaluation.status = "blocked";
  }
  writeNew(path.join(options.evidenceRoot, "raw.json"), raw);
  writeNew(path.join(options.evidenceRoot, "evaluation.json"), evaluation);
  console.log(stableJson({ candidateId: options.candidateId, evidenceRoot: "<evidence-root>", liveCalls: 0, mode: "replay", status: evaluation.status }).trimEnd());
  if (evaluation.status !== "complete") process.exitCode = 1;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) console.log(usage());
  else if (options.mode === "replay") replay(options);
  else if (options.mode === "operator-preflight") await preflightInstalledOperator(options);
  else if (options.mode === "operator-capture") await captureInstalledOperator(options);
  else await capture(options);
}

function isMainModule(): boolean {
  const entrypoint = process.argv[1];
  return entrypoint != null && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href;
}

if (isMainModule()) {
  void main().catch((error: unknown) => {
    console.error(stableJson({ error: error instanceof Error ? error.message : String(error), status: "blocked" }).trimEnd());
    process.exitCode = 1;
  });
}
