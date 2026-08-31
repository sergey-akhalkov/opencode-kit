#!/usr/bin/env node
import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseJsonc, type ParseError } from "jsonc-parser";
import { resolvePortableCommand, runPortableCommand } from "../../global/bin/portable-process.ts";
import { inspectRuntimeSourceInventory } from "../opencode-runtime-sources.ts";
import { removeProofFixture, stopProofProcessTree } from "./lib/proof-process-cleanup.ts";
import {
  configuredProofServerEnvironment,
  installedOpenCodeIdentity,
  proofClient,
  proofServerLogs,
  proofServerStartupFacts,
  requestData,
  seedProofModelsCatalog,
  startProofServer,
  stopProofServer,
  type ProofServerHandle,
} from "./lib/opencode-proof-client.ts";

type Mode = "absent" | "config" | "direct" | "loaded" | "notepad-act" | "notepad-cleanup" | "notepad-prepare" | "perceive" | "preflight" | "replay";

type Options = {
  candidateId: string;
  configDir: string | null;
  evidenceRoot: string;
  help: boolean;
  inputRoot: string | null;
  mode: Mode;
  stateRoot: string | null;
};

type FileIdentity = {
  bytes: number;
  exists: boolean;
  id: string;
  sha256: string | null;
};

type CommandResult = {
  status: number | null;
  stderrSha256: string;
  stdout: string;
};

type RpcResponse = {
  error?: { code?: number; message?: string };
  id?: number | string | null;
  jsonrpc?: string;
  result?: unknown;
};

type NotepadState = {
  afterScreenshot: string | null;
  beforeScreenshot: string;
  createdAt: string;
  file: string;
  hwnd: number;
  marker: string;
  phase: "acted" | "prepared";
  pid: number;
  stateRoot: string;
  title: string;
};

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const runnerPath = path.join(sourceRoot, "tools", "proofs", "nuphus-desktop.ts");
const requiredTools = [
  "desktop_input",
  "desktop_mouse",
  "desktop_perceive",
  "desktop_screen_size",
  "desktop_screenshot",
  "desktop_window_activate",
  "desktop_window_info",
  "desktop_window_screenshot",
  "desktop_windows_list",
] as const;
const visionKeys = [
  "NUPHUS_MCP_VISION_API_KEY",
  "NUPHUS_MCP_VISION_BASE_URL",
  "NUPHUS_MCP_VISION_MODEL",
  "NUPHUS_MCP_VISION_PROVIDER",
  "NUPHUS_MCP_VISION_MAX_TOKENS",
] as const;

function usage(): string {
  return [
    "Usage:",
    "  node tools/proofs/nuphus-desktop.ts --mode preflight --candidate-id <id> --config-dir <absolute-path> --evidence-root <absolute-new-path>",
    "  node tools/proofs/nuphus-desktop.ts --mode direct --candidate-id <id> --config-dir <absolute-path> --evidence-root <absolute-new-path>",
    "  node tools/proofs/nuphus-desktop.ts --mode config --candidate-id <id> --config-dir <absolute-path> --input-root <preflight-path> --evidence-root <absolute-new-path>",
    "  node tools/proofs/nuphus-desktop.ts --mode loaded --candidate-id <id> --config-dir <absolute-path> --input-root <config-capture-path> --evidence-root <absolute-new-path>",
    "  node tools/proofs/nuphus-desktop.ts --mode absent --candidate-id <id> --config-dir <absolute-path> --input-root <config-capture-path> --evidence-root <absolute-new-path>",
    "  node tools/proofs/nuphus-desktop.ts --mode notepad-prepare|notepad-act|notepad-cleanup --candidate-id <id> --config-dir <absolute-path> --state-root <absolute-path> --evidence-root <absolute-new-path>",
    "  node tools/proofs/nuphus-desktop.ts --mode perceive --candidate-id <id> --config-dir <absolute-path> --evidence-root <absolute-new-path>",
    "  node tools/proofs/nuphus-desktop.ts --mode replay --candidate-id <id> --input-root <capture-path> --evidence-root <absolute-new-path>",
  ].join("\n");
}

function required(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value == null || value.trim() === "" || value.startsWith("--")) throw new Error(`Missing value for ${option}`);
  return value;
}

function parseOptions(args: string[]): Options {
  if (args.length === 1 && (args[0] === "--help" || args[0] === "-h")) {
    return { candidateId: "help", configDir: null, evidenceRoot: sourceRoot, help: true, inputRoot: null, mode: "preflight", stateRoot: null };
  }
  let candidateId = "";
  let configDir = "";
  let evidenceRoot = "";
  let inputRoot = "";
  let mode = "";
  let stateRoot = "";
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--candidate-id") {
      candidateId = required(args, index, arg);
      index++;
    } else if (arg === "--config-dir") {
      configDir = required(args, index, arg);
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
    } else if (arg === "--state-root") {
      stateRoot = required(args, index, arg);
      index++;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (mode !== "preflight" && mode !== "direct" && mode !== "config" && mode !== "loaded" && mode !== "absent" && mode !== "notepad-prepare" && mode !== "notepad-act" && mode !== "notepad-cleanup" && mode !== "perceive" && mode !== "replay") {
    throw new Error("--mode must be preflight, direct, config, loaded, absent, notepad-prepare, notepad-act, notepad-cleanup, perceive, or replay");
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(candidateId)) throw new Error("--candidate-id must be a safe identifier");
  if (!path.isAbsolute(evidenceRoot)) throw new Error("--evidence-root must be absolute");
  if (mode === "replay") {
    if (!path.isAbsolute(inputRoot)) throw new Error("replay requires an absolute --input-root");
    if (configDir !== "") throw new Error("replay does not accept --config-dir");
    if (stateRoot !== "") throw new Error("replay does not accept --state-root");
  } else if (mode === "config" || mode === "loaded" || mode === "absent") {
    if (!path.isAbsolute(configDir)) throw new Error(`${mode} requires an absolute --config-dir`);
    if (!path.isAbsolute(inputRoot)) throw new Error(`${mode} requires an absolute --input-root`);
    if (stateRoot !== "") throw new Error(`${mode} does not accept --state-root`);
  } else if (mode === "notepad-prepare" || mode === "notepad-act" || mode === "notepad-cleanup") {
    if (!path.isAbsolute(configDir)) throw new Error(`${mode} requires an absolute --config-dir`);
    if (!path.isAbsolute(stateRoot)) throw new Error(`${mode} requires an absolute --state-root`);
    if (inputRoot !== "") throw new Error(`${mode} does not accept --input-root`);
  } else {
    if (!path.isAbsolute(configDir)) throw new Error(`${mode} requires an absolute --config-dir`);
    if (inputRoot !== "") throw new Error(`${mode} does not accept --input-root`);
  }
  return {
    candidateId,
    configDir: configDir === "" ? null : path.resolve(configDir),
    evidenceRoot: path.resolve(evidenceRoot),
    help: false,
    inputRoot: inputRoot === "" ? null : path.resolve(inputRoot),
    mode,
    stateRoot: stateRoot === "" ? null : path.resolve(stateRoot),
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

function fileIdentity(id: string, file: string): FileIdentity {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return { bytes: 0, exists: false, id, sha256: null };
  const bytes = fs.readFileSync(file);
  return { bytes: bytes.length, exists: true, id, sha256: sha256(bytes) };
}

function writeNew(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof value === "string" ? value : json(value), { encoding: "utf8", flag: "wx" });
}

function command(argv: readonly string[], timeoutMs = 60_000, env: NodeJS.ProcessEnv = process.env): CommandResult {
  const result = runPortableCommand(sourceRoot, argv, { capture: true, env, timeoutMs });
  if (result.status !== 0) {
    const detail = result.stderr.trim() || result.error?.message || "no stderr";
    throw new Error(`${path.basename(argv[0])} exited ${result.status ?? "unknown"}: ${detail}`);
  }
  return { status: result.status, stderrSha256: sha256(result.stderr), stdout: result.stdout.trim() };
}

function pathToken(value: string): { basename: string; pathSha256: string } {
  return { basename: path.basename(value), pathSha256: sha256(path.resolve(value).toLowerCase()) };
}

function parseObject(text: string): { parseErrorCount: number; value: Record<string, unknown> | null } {
  const errors: ParseError[] = [];
  const parsed = parseJsonc(text, errors, { allowTrailingComma: true, disallowComments: false });
  return {
    parseErrorCount: errors.length,
    value: errors.length === 0 && parsed != null && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null,
  };
}

function mcpProjection(text: string): { mcpCount: number; nuphusDefined: boolean; parseErrorCount: number } {
  const parsed = parseObject(text);
  const mcp = parsed.value?.mcp;
  const entries = mcp != null && typeof mcp === "object" && !Array.isArray(mcp) ? Object.keys(mcp) : [];
  return {
    mcpCount: entries.length,
    nuphusDefined: entries.includes("nuphus"),
    parseErrorCount: parsed.parseErrorCount,
  };
}

function configFacts(configDir: string): Record<string, unknown> {
  const candidates: Array<{ file: string; id: string }> = [];
  const seen = new Set<string>();
  const add = (file: string, id: string): void => {
    const resolved = path.resolve(file);
    const key = process.platform === "win32" ? resolved.toLowerCase() : resolved;
    if (seen.has(key) || !fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) return;
    seen.add(key);
    candidates.push({ file: resolved, id });
  };
  for (const name of ["opencode.json", "opencode.jsonc"]) add(path.join(configDir, name), `active:${name}`);
  const host = path.join(os.homedir(), ".config", "opencode");
  for (const name of ["opencode.json", "opencode.jsonc"]) add(path.join(host, name), `host-default:${name}`);
  const explicit = process.env.OPENCODE_CONFIG?.trim();
  if (explicit) add(explicit, "explicit:config");
  let root = sourceRoot;
  let depth = 0;
  for (;;) {
    for (const name of ["opencode.json", "opencode.jsonc"]) {
      add(path.join(root, name), `project:${depth}:${name}`);
      add(path.join(root, ".opencode", name), `project:${depth}:.opencode:${name}`);
    }
    const parent = path.dirname(root);
    if (parent === root) break;
    root = parent;
    depth++;
  }
  const files = candidates.map(({ file, id }) => {
    const bytes = fs.readFileSync(file);
    return { id, sha256: sha256(bytes), ...mcpProjection(bytes.toString("utf8")) };
  }).sort((left, right) => left.id.localeCompare(right.id));
  const inline = process.env.OPENCODE_CONFIG_CONTENT?.trim();
  const inlineProjection = inline
    ? { present: true, sha256: sha256(inline), ...mcpProjection(inline) }
    : { present: false, sha256: null, mcpCount: 0, nuphusDefined: false, parseErrorCount: 0 };
  const inventory = inspectRuntimeSourceInventory(sourceRoot);
  return {
    activeConfigDir: {
      matchesRepositoryGlobal: path.resolve(configDir) === path.join(sourceRoot, "global"),
      ...pathToken(configDir),
    },
    candidates: files,
    collisionCount: inventory.collisions.filter((row) => row.kind === "config").length,
    inline: inlineProjection,
    runtimeSources: inventory.sources
      .filter((row) => row.kind === "config")
      .map((row) => ({ locationSha256: sha256(row.location), name: row.name, source: row.source })),
  };
}

function packageJsonVersion(file: string): string | null {
  if (!fs.existsSync(file)) return null;
  const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as { version?: unknown };
  return typeof parsed.version === "string" ? parsed.version : null;
}

function packageFacts(): Record<string, unknown> {
  const prefix = command(["npm", "prefix", "--global"]).stdout;
  const npmRoot = command(["npm", "root", "--global"]).stdout;
  const metaRoot = path.join(npmRoot, "@nuphus", "nuphus-mcp");
  const platformCandidates = [
    { layout: "top-level", root: path.join(npmRoot, "@nuphus", "nuphus-mcp-win32-x64") },
    { layout: "nested", root: path.join(metaRoot, "node_modules", "@nuphus", "nuphus-mcp-win32-x64") },
  ];
  const platform = platformCandidates.find((row) => fs.existsSync(path.join(row.root, "package.json"))) ?? null;
  const resolution = resolvePortableCommand(["nuphus-mcp"], process.env);
  const selected = resolution.ok ? fileIdentity("command-shim", resolution.selected) : fileIdentity("command-shim", "");
  return {
    command: resolution.ok
      ? { found: true, kind: resolution.kind, selected }
      : { found: false, kind: null, selected },
    meta: {
      packageJson: fileIdentity("meta-package-json", path.join(metaRoot, "package.json")),
      version: packageJsonVersion(path.join(metaRoot, "package.json")),
    },
    npmRoot: pathToken(npmRoot),
    platform: platform == null
      ? { binary: fileIdentity("platform-binary", ""), layout: null, packageJson: fileIdentity("platform-package-json", ""), version: null }
      : {
          binary: fileIdentity("platform-binary", path.join(platform.root, "bin", "nuphus-mcp.exe")),
          layout: platform.layout,
          packageJson: fileIdentity("platform-package-json", path.join(platform.root, "package.json")),
          version: packageJsonVersion(path.join(platform.root, "package.json")),
        },
    prefix: pathToken(prefix),
  };
}

function modelFacts(): Record<string, unknown> {
  const override = process.env.NUPHUS_MODELS_DIR?.trim();
  const modelsRoot = override || path.join(process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"), "Nuphus", "models");
  const files: Array<{ bytes: number; relative: string; sha256: string }> = [];
  const visit = (root: string): void => {
    if (!fs.existsSync(root)) return;
    for (const entry of fs.readdirSync(root, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const full = path.join(root, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile()) {
        if (files.length >= 200) throw new Error("Nuphus model inventory exceeds the 200-file evidence bound");
        const bytes = fs.readFileSync(full);
        files.push({ bytes: bytes.length, relative: path.relative(modelsRoot, full).replaceAll("\\", "/"), sha256: sha256(bytes) });
      }
    }
  };
  visit(modelsRoot);
  return {
    exists: fs.existsSync(modelsRoot),
    files,
    path: pathToken(modelsRoot),
    selectedByEnvironment: Boolean(override),
  };
}

function encodedPowerShell(script: string): string {
  return Buffer.from(script, "utf16le").toString("base64");
}

function hostFacts(): Record<string, unknown> {
  const script = String.raw`
$ErrorActionPreference = 'Stop'
function FileHash([string]$File) {
  if ([string]::IsNullOrWhiteSpace($File) -or -not (Test-Path -LiteralPath $File -PathType Leaf)) { return $null }
  try { return (Get-FileHash -LiteralPath $File -Algorithm SHA256 -ErrorAction Stop).Hash.ToLowerInvariant() } catch { return $null }
}
$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [Security.Principal.WindowsPrincipal]::new($identity)
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
$os = Get-CimInstance Win32_OperatingSystem -ErrorAction Stop
$all = @(Get-CimInstance Win32_Process -ErrorAction Stop)
$relevant = @($all | Where-Object { $_.Name -match '^(opencode|notepad).*\.exe$' } | ForEach-Object {
  [ordered]@{
    name = [string]$_.Name
    pid = [int]$_.ProcessId
    parentPid = [int]$_.ParentProcessId
    createdAt = $(if ($_.CreationDate) { ([datetime]$_.CreationDate).ToUniversalTime().ToString('o') } else { $null })
    executableSha256 = FileHash ([string]$_.ExecutablePath)
  }
})
$listeners = @(Get-NetTCPConnection -State Listen -ErrorAction Stop | Where-Object { $_.LocalPort -in @(4096,4097) } | ForEach-Object {
  $row = $_
  $owner = $all | Where-Object { [int]$_.ProcessId -eq [int]$row.OwningProcess } | Select-Object -First 1
  [ordered]@{
    address = [string]$row.LocalAddress
    port = [int]$row.LocalPort
    pid = [int]$row.OwningProcess
    name = $(if ($owner) { [string]$owner.Name } else { '' })
    createdAt = $(if ($owner -and $owner.CreationDate) { ([datetime]$owner.CreationDate).ToUniversalTime().ToString('o') } else { $null })
    executableSha256 = $(if ($owner) { FileHash ([string]$owner.ExecutablePath) } else { $null })
  }
})
$sessionId = (Get-Process -Id $PID -ErrorAction Stop).SessionId
$interactive = @((Get-Process explorer -ErrorAction SilentlyContinue) | Where-Object { $_.SessionId -eq $sessionId }).Count -gt 0
[ordered]@{
  isAdmin = [bool]$isAdmin
  userSid = [string]$identity.User.Value
  osVersion = [string]$os.Version
  osBuild = [string]$os.BuildNumber
  sessionId = [int]$sessionId
  interactiveDesktop = [bool]$interactive
  relevantProcesses = $relevant
  managedListeners = $listeners
} | ConvertTo-Json -Compress -Depth 6
`;
  const output = command(["powershell.exe", "-NoLogo", "-NoProfile", "-NonInteractive", "-EncodedCommand", encodedPowerShell(script)], 120_000).stdout;
  const parsed = JSON.parse(output) as Record<string, unknown>;
  const sid = String(parsed.userSid ?? "");
  delete parsed.userSid;
  parsed.userSidSha256 = sha256(sid);
  return parsed;
}

function repoFacts(): Record<string, unknown> {
  const snapshot = command([process.execPath, path.join(sourceRoot, "global", "bin", "repo-candidate-snapshot.ts"), "--root", sourceRoot, "--summary"], 120_000);
  const parsed = JSON.parse(snapshot.stdout) as Record<string, unknown>;
  const paths = parsed.paths as Record<string, unknown[]> | undefined;
  return {
    branch: parsed.branch,
    detached: parsed.detached,
    head: parsed.head,
    pathCounts: {
      conflict: paths?.conflict?.length ?? 0,
      staged: paths?.staged?.length ?? 0,
      unstaged: paths?.unstaged?.length ?? 0,
      untracked: paths?.untracked?.length ?? 0,
    },
    snapshotSha256: sha256(snapshot.stdout),
  };
}

function candidateFiles(configDir: string): FileIdentity[] {
  const relativeFiles = [
    "global/opencode.json.template",
    "package.json",
    "tools/install-code-intelligence-mcps.ts",
    "tools/proofs/README.md",
    "tools/proofs/lib/opencode-proof-client.ts",
    "tools/proofs/lib/proof-process-cleanup.ts",
    "global/bin/portable-process.ts",
    "openspec/changes/install-nuphus-windows-desktop-mcp/proposal.md",
    "openspec/changes/install-nuphus-windows-desktop-mcp/design.md",
    "openspec/changes/install-nuphus-windows-desktop-mcp/tasks.md",
    "openspec/changes/install-nuphus-windows-desktop-mcp/history.md",
    "openspec/changes/install-nuphus-windows-desktop-mcp/falsification-review.md",
    "openspec/changes/install-nuphus-windows-desktop-mcp/specs/local-opencode-workstation/spec.md",
    "tools/proofs/nuphus-desktop.ts",
  ];
  const result = relativeFiles.map((relative) => fileIdentity(relative, path.join(sourceRoot, relative)));
  result.push(fileIdentity("active:opencode.json", path.join(configDir, "opencode.json")));
  result.push(fileIdentity("active:opencode.local.instructions.md", path.join(configDir, "opencode.local.instructions.md")));
  return result.sort((left, right) => left.id.localeCompare(right.id));
}

function relevantEnvironment(): Array<{ name: string; present: boolean; valueSha256: string | null }> {
  return Object.keys(process.env)
    .filter((name) => name.startsWith("NUPHUS_") || ["OPENCODE_CONFIG", "OPENCODE_CONFIG_CONTENT", "OPENCODE_CONFIG_DIR"].includes(name))
    .sort()
    .map((name) => {
      const value = process.env[name] ?? "";
      return { name, present: value !== "", valueSha256: value === "" ? null : sha256(value) };
    });
}

function privacySafe(value: unknown, extraPaths: string[] = []): boolean {
  const projected = JSON.stringify(value);
  const forbiddenPaths = [sourceRoot, os.homedir(), os.tmpdir(), process.env.APPDATA ?? "", ...extraPaths]
    .filter((entry) => entry !== "");
  const sensitiveValues = Object.entries(process.env)
    .filter(([name, entry]) => entry != null && entry.length >= 8 && /(KEY|PASSWORD|SECRET|TOKEN|CREDENTIAL)/i.test(name))
    .map(([, entry]) => entry as string);
  return !forbiddenPaths.some((entry) => projected.includes(entry) || projected.includes(entry.replaceAll("\\", "/")))
    && !sensitiveValues.some((entry) => projected.includes(entry))
    && !projected.includes("data:image")
    && !projected.includes("iVBORw0KGgo");
}

function safeFailure(error: unknown, extraPaths: string[] = []): Record<string, unknown> {
  const original = error instanceof Error ? error : new Error(String(error));
  let message = original.message;
  for (const entry of [sourceRoot, os.homedir(), os.tmpdir(), ...extraPaths].filter((value) => value !== "")) {
    message = message.replaceAll(entry, "<redacted-path>").replaceAll(entry.replaceAll("\\", "/"), "<redacted-path>");
  }
  message = message.replace(/[A-Za-z]:[\\/][^\s"']+/g, "<redacted-path>");
  return { class: original.name, message: message.slice(0, 2_000), stackSha256: sha256(original.stack ?? original.message) };
}

function preflightRaw(options: Options): Record<string, unknown> {
  const configDir = options.configDir as string;
  const packages = packageFacts() as {
    command: { found: boolean };
    meta: { version: string | null };
    platform: { version: string | null };
  };
  const configs = configFacts(configDir) as {
    candidates: Array<{ nuphusDefined: boolean; parseErrorCount: number }>;
    inline: { nuphusDefined: boolean; parseErrorCount: number };
  };
  const unexpectedOwner = packages.command.found
    || packages.meta.version != null
    || packages.platform.version != null
    || configs.inline.nuphusDefined
    || configs.candidates.some((row) => row.nuphusDefined);
  const raw: Record<string, unknown> = {
    candidate: { files: candidateFiles(configDir), repository: repoFacts() },
    candidateId: options.candidateId,
    capture: { completedAt: new Date().toISOString(), screenCaptureCount: 0 },
    cleanup: { state: "not-needed", synchronousChildrenTerminal: true },
    configs,
    environment: {
      arch: process.arch,
      nodeVersion: process.version,
      npmVersion: command(["npm", "--version"]).stdout,
      opencodeVersion: command(["opencode", "--version"]).stdout,
      platform: process.platform,
      relevantVariables: relevantEnvironment(),
    },
    host: hostFacts(),
    models: modelFacts(),
    mode: "preflight",
    packages,
    proofKind: "nuphus-desktop-preflight",
    runner: fileIdentity("tools/proofs/nuphus-desktop.ts", runnerPath),
    schemaVersion: 1,
    unexpectedOwner,
  };
  raw.privacySafe = privacySafe(raw, [configDir]);
  return raw;
}

function normalizeArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  return value == null ? [] : [value];
}

function requiredBaselineHash(raw: Record<string, any>, id: string): string {
  const row = normalizeArray(raw.candidate?.files).find((entry: any) => entry?.id === id) as Record<string, unknown> | undefined;
  if (typeof row?.sha256 !== "string") throw new Error(`Preflight evidence has no ${id} hash`);
  return row.sha256;
}

function exactBlock(content: string, lfBlock: string, name: string): { block: string; occurrences: number } {
  const variants = [lfBlock, lfBlock.replaceAll("\n", "\r\n")];
  for (const block of variants) {
    const occurrences = content.split(block).length - 1;
    if (occurrences > 0) return { block, occurrences };
  }
  throw new Error(`Current files do not contain the exact ${name} block`);
}

function rollbackProjection(content: string, block: string, expectedSha256: string): { sha256: string; strategy: string } {
  const removed = content.replace(block, "");
  const candidates = [
    { content: removed, strategy: "exact-block-removal" },
    { content: removed.replace(/(?<!\r)\n/g, "\r\n"), strategy: "exact-block-removal-and-restore-crlf" },
    { content: removed.replaceAll("\r\n", "\n"), strategy: "exact-block-removal-and-restore-lf" },
  ];
  const match = candidates.find((row) => sha256(row.content) === expectedSha256) ?? candidates[0];
  return { sha256: sha256(match.content), strategy: match.strategy };
}

function guardedRollback(content: string, expectedCurrentSha256: string, block: string, expectedRollbackSha256: string): string {
  if (sha256(content) !== expectedCurrentSha256) throw new Error("Rollback refused because the current identity drifted");
  const removed = content.replace(block, "");
  const candidates = [removed, removed.replace(/(?<!\r)\n/g, "\r\n"), removed.replaceAll("\r\n", "\n")];
  const restored = candidates.find((candidate) => sha256(candidate) === expectedRollbackSha256);
  if (restored == null) throw new Error("Rollback refused because exact block removal does not restore the recorded preimage");
  return restored;
}

function configRaw(options: Options): Record<string, unknown> {
  const configDir = options.configDir as string;
  const baselineFile = path.join(options.inputRoot as string, "raw.json");
  if (!fs.existsSync(baselineFile)) throw new Error("Config capture input does not contain raw.json");
  const baseline = JSON.parse(fs.readFileSync(baselineFile, "utf8")) as Record<string, any>;
  if (baseline.proofKind !== "nuphus-desktop-preflight" && baseline.proofKind !== "nuphus-desktop-config") {
    throw new Error("Config capture requires Nuphus preflight or prior config evidence");
  }
  const configFile = path.join(configDir, "opencode.json");
  const instructionsFile = path.join(configDir, "opencode.local.instructions.md");
  const config = fs.readFileSync(configFile, "utf8");
  const instructions = fs.readFileSync(instructionsFile, "utf8");
  const configInsertion = exactBlock(config, `,
    "nuphus": {
      "type": "local",
      "command": [
        "nuphus-mcp"
      ],
      "enabled": true,
      "timeout": 60000,
      "environment": {
        "NUPHUS_MCP_CONFIRM_WRITE": "0"
      }
    }`, "Nuphus config");
  const instructionInsertion = exactBlock(instructions, `
### Nuphus Desktop Control

- During UI development or debugging, use Nuphus when the required fact or effect is visible only in the running interface: inspect the identified app or window, perform the minimum input, and verify the visible result. Do not replace source, logs, tests, or application-native diagnostics when they directly establish a non-visual fact.
- Before desktop input, observe the current windows, identify and activate the intended target, then observe it again. Abort before input when the target identity is stale or ambiguous, and verify the visible result after every action.
- When the model must inspect screen pixels, save the identified window with \`desktop_window_screenshot\` (or use an explicit region) to a proof-owned PNG and read that file with OpenCode's image-capable Read tool; never Read a full-desktop image containing unrelated windows. Do not treat Nuphus text/base64 output or a successful input RPC as visual proof. Use \`desktop_perceive\` only when its required local OCR models are complete; if perception is degraded, use screenshot-to-Read, do not retry it unchanged, and never guess coordinates. Do not call or configure \`desktop_vision\`. Remove temporary screenshots after inspection.
- Use full local write authority only within the accepted task boundary. Never target unrelated windows, expose private screen content in retained evidence, or stop processes that are not proven proof-owned.
`, "Nuphus instruction");
  const configBaselineSha256 = baseline.proofKind === "nuphus-desktop-preflight"
    ? requiredBaselineHash(baseline, "active:opencode.json")
    : String(baseline.baseline?.configSha256 ?? "");
  const instructionsBaselineSha256 = baseline.proofKind === "nuphus-desktop-preflight"
    ? requiredBaselineHash(baseline, "active:opencode.local.instructions.md")
    : String(baseline.baseline?.instructionsSha256 ?? "");
  if (configBaselineSha256 === "" || instructionsBaselineSha256 === "") throw new Error("Config evidence has no rollback baseline hashes");
  const referenceInstallerSha256 = baseline.proofKind === "nuphus-desktop-preflight"
    ? requiredBaselineHash(baseline, "tools/install-code-intelligence-mcps.ts")
    : String(baseline.protectedFiles?.currentInstaller?.sha256 ?? "");
  const referenceTemplateSha256 = baseline.proofKind === "nuphus-desktop-preflight"
    ? requiredBaselineHash(baseline, "global/opencode.json.template")
    : String(baseline.protectedFiles?.currentTemplate?.sha256 ?? "");
  if (referenceInstallerSha256 === "" || referenceTemplateSha256 === "") throw new Error("Config evidence has no protected-file reference hashes");
  const configRollback = rollbackProjection(config, configInsertion.block, configBaselineSha256);
  const instructionsRollback = rollbackProjection(instructions, instructionInsertion.block, instructionsBaselineSha256);
  const parsed = parseObject(config);
  if (parsed.value == null) throw new Error("Active OpenCode config is not valid JSON/JSONC");
  const sourceMcp = parsed.value.mcp as Record<string, unknown> | undefined;
  const debug = command(["opencode", "debug", "config", "--pure"], 180_000, { ...process.env, OPENCODE_CONFIG_DIR: configDir });
  const resolved = JSON.parse(debug.stdout) as Record<string, any>;
  const resolvedMcp = resolved.mcp as Record<string, unknown> | undefined;
  const raw: Record<string, unknown> = {
    baseline: {
      candidateId: baseline.candidateId,
      configSha256: configBaselineSha256,
      instructionsSha256: instructionsBaselineSha256,
      rawSha256: sha256(fs.readFileSync(baselineFile)),
    },
    candidateId: options.candidateId,
    config: {
      currentSha256: sha256(config),
      insertionOccurrences: configInsertion.occurrences,
      nuphus: sourceMcp?.nuphus ?? null,
      parseErrorCount: parsed.parseErrorCount,
      rollbackSha256: configRollback.sha256,
      rollbackStrategy: configRollback.strategy,
    },
    instructions: {
      currentSha256: sha256(instructions),
      insertionOccurrences: instructionInsertion.occurrences,
      rollbackSha256: instructionsRollback.sha256,
      rollbackStrategy: instructionsRollback.strategy,
    },
    mode: "config",
    proofKind: "nuphus-desktop-config",
    protectedFiles: {
      currentInstaller: fileIdentity("tools/install-code-intelligence-mcps.ts", path.join(sourceRoot, "tools", "install-code-intelligence-mcps.ts")),
      currentTemplate: fileIdentity("global/opencode.json.template", path.join(sourceRoot, "global", "opencode.json.template")),
      referenceCandidateId: baseline.candidateId,
      referenceInstallerSha256,
      referenceTemplateSha256,
    },
    resolved: {
      mcpNames: Object.keys(resolvedMcp ?? {}).sort(),
      nuphus: resolvedMcp?.nuphus ?? null,
      stderrSha256: debug.stderrSha256,
    },
    schemaVersion: 1,
  };
  raw.privacySafe = privacySafe(raw, [configDir, options.inputRoot as string]);
  return raw;
}

function exactNuphus(value: unknown): boolean {
  const row = value as Record<string, any> | null;
  return row?.type === "local"
    && Array.isArray(row.command)
    && row.command.length === 1
    && row.command[0] === "nuphus-mcp"
    && row.enabled === true
    && row.timeout === 60000
    && row.environment != null
    && Object.keys(row.environment).length === 1
    && row.environment.NUPHUS_MCP_CONFIRM_WRITE === "0";
}

function evaluateConfig(raw: Record<string, any>): Record<string, unknown> {
  const protectedInstaller = raw.protectedFiles?.currentInstaller?.sha256;
  const protectedTemplate = raw.protectedFiles?.currentTemplate?.sha256;
  const referenceInstaller = raw.protectedFiles?.referenceInstallerSha256 ?? raw.protectedFiles?.preflightInstallerSha256;
  const referenceTemplate = raw.protectedFiles?.referenceTemplateSha256 ?? raw.protectedFiles?.preflightTemplateSha256;
  const checks = {
    exactInsertions: raw.config?.insertionOccurrences === 1 && raw.instructions?.insertionOccurrences === 1,
    officialReadback: exactNuphus(raw.resolved?.nuphus) && normalizeArray(raw.resolved?.mcpNames).includes("nuphus"),
    privacySafe: raw.privacySafe === true,
    protectedFiles: typeof protectedInstaller === "string"
      && typeof protectedTemplate === "string"
      && typeof referenceInstaller === "string"
      && typeof referenceTemplate === "string"
      && protectedInstaller === referenceInstaller
      && protectedTemplate === referenceTemplate,
    rollbackPreimages: typeof raw.config?.rollbackSha256 === "string"
      && typeof raw.baseline?.configSha256 === "string"
      && typeof raw.instructions?.rollbackSha256 === "string"
      && typeof raw.baseline?.instructionsSha256 === "string"
      && raw.config.rollbackSha256 === raw.baseline.configSha256
      && raw.instructions.rollbackSha256 === raw.baseline.instructionsSha256,
    schema: raw.schemaVersion === 1 && raw.proofKind === "nuphus-desktop-config" && raw.mode === "config",
    sourceReadback: raw.config?.parseErrorCount === 0 && exactNuphus(raw.config?.nuphus),
  };
  return {
    candidateId: raw.candidateId,
    checks,
    passed: Object.values(checks).every(Boolean),
    proofKind: raw.proofKind,
    schemaVersion: 1,
  };
}

function redactedText(text: string, paths: string[]): string {
  let result = text;
  for (const entry of [sourceRoot, os.homedir(), os.tmpdir(), ...paths].filter((value) => value !== "")) {
    result = result.replaceAll(entry, "<redacted-path>").replaceAll(entry.replaceAll("\\", "/"), "<redacted-path>");
  }
  for (const [name, value] of Object.entries(process.env)) {
    if (value != null && value.length >= 8 && /(KEY|PASSWORD|SECRET|TOKEN|CREDENTIAL)/i.test(name)) result = result.replaceAll(value, "<redacted-secret>");
  }
  return result.replace(/[A-Za-z]:[\\/][^\s"']+/g, "<redacted-path>").slice(-8_000);
}

function processTreeFacts(rootPid: number): Record<string, unknown> {
  const script = String.raw`
$ErrorActionPreference = 'Stop'
function FileHash([string]$File) {
  if ([string]::IsNullOrWhiteSpace($File) -or -not (Test-Path -LiteralPath $File -PathType Leaf)) { return $null }
  try { return (Get-FileHash -LiteralPath $File -Algorithm SHA256 -ErrorAction Stop).Hash.ToLowerInvariant() } catch { return $null }
}
$all = @(Get-CimInstance Win32_Process -ErrorAction Stop)
$ids = @(${rootPid})
do {
  $children = @($all | Where-Object { [int]$_.ParentProcessId -in $ids -and [int]$_.ProcessId -notin $ids })
  $before = $ids.Count
  $ids = @($ids + @($children | ForEach-Object { [int]$_.ProcessId }) | Sort-Object -Unique)
} while ($ids.Count -gt $before)
$rows = @($all | Where-Object { [int]$_.ProcessId -in $ids } | Sort-Object ProcessId | ForEach-Object {
  [ordered]@{
    name = [string]$_.Name
    pid = [int]$_.ProcessId
    parentPid = [int]$_.ParentProcessId
    createdAt = $(if ($_.CreationDate) { ([datetime]$_.CreationDate).ToUniversalTime().ToString('o') } else { $null })
    executableSha256 = FileHash ([string]$_.ExecutablePath)
    requestedConfirmation = [bool]([string]$_.CommandLine -match '(?i)(--confirm-write|confirm_write)')
  }
})
[ordered]@{
  rows = $rows
  nuphusCount = @($rows | Where-Object { $_.name -match '(?i)nuphus' }).Count
  siblingMcpCount = @($rows | Where-Object { $_.name -match '(?i)(serena|codebase-memory|graphify|python)' }).Count
  confirmationRequested = @($rows | Where-Object { $_.requestedConfirmation }).Count -gt 0
} | ConvertTo-Json -Compress -Depth 6
`;
  return JSON.parse(command(["powershell.exe", "-NoLogo", "-NoProfile", "-NonInteractive", "-EncodedCommand", encodedPowerShell(script)], 120_000).stdout) as Record<string, unknown>;
}

function copyProofCredentials(runtimeRoot: string): void {
  const source = path.join(os.homedir(), ".local", "share", "opencode", "auth.json");
  if (!fs.existsSync(source) || !fs.statSync(source).isFile()) throw new Error("Configured OpenCode credential store is unavailable");
  const destinations = [
    path.join(runtimeRoot, "data", "opencode", "auth.json"),
    path.join(runtimeRoot, "home", ".local", "share", "opencode", "auth.json"),
  ];
  for (const destination of destinations) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL);
  }
}

function projectStatuses(value: Record<string, any>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([name, row]) => [name, {
    errorSha256: typeof row?.error === "string" ? sha256(row.error) : null,
    status: row?.status ?? null,
  }]));
}

function dimensionsFrom(value: unknown): { height: number; width: number } | null {
  if (value == null) return null;
  if (typeof value === "string") {
    try {
      return dimensionsFrom(JSON.parse(value));
    } catch {
      const width = value.match(/(?:"width"|width)\s*[:=]\s*(\d+)/i);
      const height = value.match(/(?:"height"|height)\s*[:=]\s*(\d+)/i);
      return width != null && height != null ? { height: Number(height[1]), width: Number(width[1]) } : null;
    }
  }
  if (Array.isArray(value)) {
    for (const row of value) {
      const found = dimensionsFrom(row);
      if (found != null) return found;
    }
    return null;
  }
  if (typeof value === "object") {
    const row = value as Record<string, unknown>;
    if (Number(row.width) > 0 && Number(row.height) > 0) return { height: Number(row.height), width: Number(row.width) };
    for (const nested of Object.values(row)) {
      const found = dimensionsFrom(nested);
      if (found != null) return found;
    }
  }
  return null;
}

function promptProjection(value: Record<string, any>, screenTool: string): Record<string, unknown> {
  const parts = normalizeArray(value.parts) as Array<Record<string, any>>;
  const toolCalls = parts.filter((part) => part.type === "tool").map((part) => ({
    dimensions: dimensionsFrom(part.state?.output ?? part.state?.result ?? part),
    name: part.tool ?? part.name ?? null,
    outputSha256: sha256(JSON.stringify(stableValue(part.state?.output ?? part.state?.result ?? null))),
    status: part.state?.status ?? null,
  }));
  const text = parts.filter((part) => part.type === "text" && typeof part.text === "string").map((part) => part.text).join("\n").trim();
  return {
    model: {
      modelID: value.info?.modelID ?? value.info?.model?.modelID ?? null,
      providerID: value.info?.providerID ?? value.info?.model?.providerID ?? null,
    },
    screenTool,
    text: redactedText(text, []).slice(0, 500),
    toolCalls,
  };
}

function transcriptToolProjection(messages: unknown[], screenTool: string): Array<Record<string, unknown>> {
  const result: Array<Record<string, unknown>> = [];
  for (const message of messages) {
    if (message == null || typeof message !== "object") continue;
    const parts = normalizeArray((message as Record<string, unknown>).parts) as Array<Record<string, any>>;
    for (const part of parts) {
      if (part?.type !== "tool" || part.tool !== screenTool) continue;
      const output = part.state?.output ?? part.state?.result ?? null;
      const serialized = JSON.stringify(stableValue(output)) ?? "null";
      result.push({
        dimensions: dimensionsFrom(output),
        name: part.tool,
        outputBytes: typeof output === "string" ? Buffer.byteLength(output) : Buffer.byteLength(serialized),
        outputSha256: sha256(serialized),
        status: part.state?.status ?? null,
      });
    }
  }
  return result;
}

async function waitForNuphus(client: ReturnType<typeof proofClient>, directory: string): Promise<Record<string, any>> {
  const deadline = Date.now() + 60_000;
  let last: Record<string, any> = {};
  while (Date.now() < deadline) {
    last = await requestData<Record<string, any>>(client.mcp.status({ directory }) as Promise<unknown>, "nuphus mcp.status");
    if (last.nuphus?.status === "connected") return last;
    if (last.nuphus?.status === "failed") throw new Error(`OpenCode Nuphus failed: ${last.nuphus.error ?? "unknown error"}`);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`OpenCode Nuphus did not connect; last status '${last.nuphus?.status ?? "missing"}'`);
}

async function boundedRequest<T>(request: Promise<T>, label: string, timeoutMs: number): Promise<T> {
  return await Promise.race([
    request,
    new Promise<never>((_resolve, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)),
  ]);
}

async function loadedRaw(options: Options, expectAbsent = false): Promise<Record<string, unknown>> {
  const configDir = options.configDir as string;
  const configEvidenceFile = path.join(options.inputRoot as string, "raw.json");
  if (!fs.existsSync(configEvidenceFile)) throw new Error("Loaded capture input does not contain raw.json");
  const configEvidence = JSON.parse(fs.readFileSync(configEvidenceFile, "utf8")) as Record<string, any>;
  if (configEvidence.proofKind !== "nuphus-desktop-config") throw new Error("Loaded capture requires Nuphus config evidence");
  const activeConfig = path.join(configDir, "opencode.json");
  const activeConfigBytes = fs.readFileSync(activeConfig);
  const expectedConfigSha256 = expectAbsent ? configEvidence.config?.rollbackSha256 : configEvidence.config?.currentSha256;
  if (sha256(activeConfigBytes) !== expectedConfigSha256) throw new Error(expectAbsent ? "Active OpenCode config does not match the rollback preimage" : "Active OpenCode config drifted after config capture");
  const activeInstructions = fs.readFileSync(path.join(configDir, "opencode.local.instructions.md"));
  const expectedInstructionsSha256 = expectAbsent ? configEvidence.baseline?.instructionsSha256 : configEvidence.instructions?.currentSha256;
  if (sha256(activeInstructions) !== expectedInstructionsSha256) throw new Error(expectAbsent ? "Active local instructions do not match the rollback preimage" : "Active local instructions drifted after config capture");
  const parsedConfig = parseObject(activeConfigBytes.toString("utf8"));
  if (parsedConfig.value == null) throw new Error("Active OpenCode config is invalid");
  const model = String(parsedConfig.value.model ?? "");
  if (!model.includes("/")) throw new Error("Active OpenCode model route is missing");
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "nuphus-loaded-"));
  const runtimeRoot = path.join(fixture, "runtime");
  const projectRoot = path.join(fixture, "project");
  fs.mkdirSync(projectRoot, { recursive: true });
  command(["git", "init", "--quiet", projectRoot], 30_000);
  const overlay = {
    mcp: {
      "codebase-memory-mcp": { enabled: false },
      "graphify-global": { enabled: false },
      serena: { enabled: false },
    },
  };
  const beforeHost = hostFacts() as Record<string, any>;
  const raw: Record<string, any> = {
    active: {
      configSha256: sha256(activeConfigBytes),
      instructionsSha256: sha256(activeInstructions),
      model,
      nuphus: (parsedConfig.value.mcp as Record<string, unknown> | undefined)?.nuphus ?? null,
    },
    candidateId: options.candidateId,
    cleanup: { fixture: "unknown", server: "unknown", session: "not-created" },
    isolation: {
      credentialCopies: 2,
      rootsDistinct: true,
      testHomeConfigured: true,
      xdgDataConfigured: true,
    },
    managedBefore: beforeHost.managedListeners ?? [],
    mode: expectAbsent ? "absent" : "loaded",
    modelsBefore: modelFacts(),
    overlay,
    packages: packageFacts(),
    proofKind: expectAbsent ? "nuphus-desktop-absent" : "nuphus-desktop-loaded",
    schemaVersion: 1,
    screenCaptureCount: 0,
  };
  let client: ReturnType<typeof proofClient> | null = null;
  let server: ProofServerHandle | null = null;
  let sessionId: string | null = null;
  let serverTerminal: { signal: NodeJS.Signals | null; status: number | null } | null = null;
  try {
    seedProofModelsCatalog(runtimeRoot, [model]);
    copyProofCredentials(runtimeRoot);
    const environment = configuredProofServerEnvironment(process.env, configDir, runtimeRoot, overlay);
    environment.OPENCODE_TEST_HOME = path.join(runtimeRoot, "home");
    environment.XDG_DATA_HOME = path.join(runtimeRoot, "data");
    for (const key of visionKeys) delete environment[key];
    const resolvedOutput = command(["opencode", "debug", "config", "--pure"], 180_000, environment);
    const resolved = JSON.parse(resolvedOutput.stdout) as Record<string, any>;
    raw.resolved = {
      mcpNames: Object.keys(resolved.mcp ?? {}).sort(),
      nuphus: resolved.mcp?.nuphus ?? null,
      siblingStatuses: Object.fromEntries(["codebase-memory-mcp", "graphify-global", "serena"].map((name) => [name, resolved.mcp?.[name]?.enabled ?? null])),
    };
    const resolution = resolvePortableCommand(["opencode"], environment);
    if (!resolution.ok || resolution.kind !== "native") throw new Error(resolution.ok ? "OpenCode proof requires a native executable" : resolution.reason);
    raw.openCode = installedOpenCodeIdentity(resolution.selected);
    server = await startProofServer(resolution.selected, projectRoot, environment, 90_000);
    raw.server = { baseUrl: server.url, pid: server.child.pid };
    client = proofClient(server.url, projectRoot, environment);
    const statuses = expectAbsent
      ? await requestData<Record<string, any>>(client.mcp.status({ directory: projectRoot }) as Promise<unknown>, "absent mcp.status")
      : await waitForNuphus(client, projectRoot);
    raw.mcpStatuses = projectStatuses(statuses);
    raw.processTree = processTreeFacts(server.child.pid as number);
    if (!expectAbsent) {
      const toolIds = await requestData<string[]>(client.tool.ids({ directory: projectRoot }) as Promise<unknown>, "nuphus tool.ids");
      const [provider, ...modelParts] = model.split("/");
      const listedTools = await requestData<Array<{ description?: string; id: string; parameters?: unknown }>>(client.tool.list({
        directory: projectRoot,
        model: modelParts.join("/"),
        provider,
      }) as Promise<unknown>, "nuphus tool.list");
      const listedIds = listedTools.map((row) => row.id).sort();
      const screenTool = "nuphus_desktop_screen_size";
      raw.tools = {
        canonicalSource: "McpCatalog.toolName(clientName, toolName)",
        idsEndpoint: [...toolIds].sort(),
        listEndpoint: listedIds,
        screenTool,
      };
      const created = await requestData<Record<string, unknown>>(client.session.create({ directory: projectRoot, title: "Nuphus screen-size proof" }) as Promise<unknown>, "Nuphus proof session create");
      if (typeof created.id !== "string") throw new Error("Nuphus proof session has no id");
      sessionId = created.id;
      raw.cleanup.session = "open";
      const toolSelection = Object.fromEntries([...new Set([...toolIds, ...listedIds, screenTool])].map((id) => [id, id === screenTool]));
      const response = await boundedRequest(requestData<Record<string, any>>(client.session.prompt({
        agent: "build",
        directory: projectRoot,
        parts: [{
          type: "text",
          text: "Bounded synthetic proof: call the enabled Nuphus screen-size tool exactly once. Do not capture a screenshot, inspect screen content, move the mouse, send keyboard input, use a browser, ask a question, or call any other tool. Then reply only WIDTHxHEIGHT using the returned numeric dimensions.",
        }],
        sessionID: sessionId,
        tools: toolSelection,
      }) as Promise<unknown>, "Nuphus configured-provider prompt"), "Nuphus configured-provider prompt", 180_000);
      raw.prompt = promptProjection(response, screenTool);
      const messages = await boundedRequest(requestData<unknown[]>(client.session.messages({
        directory: projectRoot,
        limit: 100,
        sessionID: sessionId,
      }) as Promise<unknown>, "Nuphus proof messages"), "Nuphus proof messages", 30_000);
      raw.prompt.transcriptToolCalls = transcriptToolProjection(messages, screenTool);
      raw.processTree = processTreeFacts(server.child.pid as number);
    }
  } catch (error) {
    raw.failure = safeFailure(error, [fixture, configDir, options.inputRoot as string]);
  } finally {
    if (client != null && sessionId != null) {
      try {
        await requestData(client.session.delete({ directory: projectRoot, sessionID: sessionId }) as Promise<unknown>, "Nuphus proof session cleanup");
        raw.cleanup.session = "deleted";
      } catch (error) {
        raw.cleanup.session = "failed";
        raw.cleanup.sessionFailure = safeFailure(error, [fixture, configDir]);
      }
    }
    if (server != null) {
      const logs = proofServerLogs(server);
      raw.logs = {
        startup: proofServerStartupFacts(logs.stdout, logs.stderr, configDir, [fixture, runtimeRoot, projectRoot]),
        stderr: { bytes: Buffer.byteLength(logs.stderr), sha256: sha256(logs.stderr), tail: redactedText(logs.stderr, [fixture, configDir]) },
        stdout: { bytes: Buffer.byteLength(logs.stdout), sha256: sha256(logs.stdout), tail: redactedText(logs.stdout, [fixture, configDir]) },
      };
      try {
        serverTerminal = await stopProofServer(server);
        raw.cleanup.server = "terminal";
        raw.cleanup.serverTerminal = serverTerminal;
      } catch (error) {
        raw.cleanup.server = "failed";
        raw.cleanup.serverFailure = safeFailure(error, [fixture, configDir]);
      }
    }
    const afterHost = hostFacts() as Record<string, any>;
    raw.modelsAfter = modelFacts();
    raw.managedAfter = afterHost.managedListeners ?? [];
    raw.managedUnchanged = JSON.stringify(stableValue(raw.managedBefore)) === JSON.stringify(stableValue(raw.managedAfter));
    try {
      removeProofFixture(fixture);
      raw.cleanup.fixture = fs.existsSync(fixture) ? "present" : "removed";
    } catch (error) {
      raw.cleanup.fixture = "failed";
      raw.cleanup.fixtureFailure = safeFailure(error, [fixture, configDir]);
    }
  }
  raw.privacySafe = privacySafe(raw, [fixture, configDir, options.inputRoot as string]);
  return raw;
}

function evaluateLoaded(raw: Record<string, any>): Record<string, unknown> {
  const toolCalls = normalizeArray(raw.prompt?.transcriptToolCalls) as Array<Record<string, any>>;
  const call = toolCalls[0];
  const [providerID, ...modelParts] = String(raw.active?.model ?? "").split("/");
  const checks = {
    activeConfigBinding: exactNuphus(raw.active?.nuphus) && exactNuphus(raw.resolved?.nuphus),
    cleanup: raw.cleanup?.server === "terminal" && raw.cleanup?.fixture === "removed" && raw.cleanup?.session === "deleted",
    configuredProvider: raw.prompt?.model?.providerID === providerID && raw.prompt?.model?.modelID === modelParts.join("/"),
    connected: raw.mcpStatuses?.nuphus?.status === "connected",
    exactBaseUrl: /^http:\/\/127\.0\.0\.1:\d+$/.test(String(raw.server?.baseUrl ?? "")) && Number(raw.server?.pid) > 0,
    isolated: raw.isolation?.rootsDistinct === true && raw.isolation?.testHomeConfigured === true && raw.isolation?.xdgDataConfigured === true,
    managedUnchanged: raw.managedUnchanged === true,
    noCaptureOrInput: raw.screenCaptureCount === 0 && toolCalls.length === 1 && call?.name === raw.tools?.screenTool,
    noFailure: raw.failure == null && raw.cleanup?.serverFailure == null && raw.cleanup?.fixtureFailure == null && raw.cleanup?.sessionFailure == null,
    noSiblingMcp: raw.processTree?.siblingMcpCount === 0,
    overlay: Object.keys(raw.overlay?.mcp ?? {}).sort().join(",") === "codebase-memory-mcp,graphify-global,serena"
      && raw.overlay?.mcp?.nuphus == null
      && Object.values(raw.resolved?.siblingStatuses ?? {}).every((value) => value === false),
    privacySafe: raw.privacySafe === true,
    processAttribution: raw.processTree?.nuphusCount >= 1 && raw.processTree?.confirmationRequested === false,
    schema: raw.schemaVersion === 1 && raw.proofKind === "nuphus-desktop-loaded" && raw.mode === "loaded",
    screenSizeResult: call?.status === "completed"
      && call?.dimensions?.width > 0
      && call?.dimensions?.height > 0
      && raw.prompt?.text === `${call.dimensions.width}x${call.dimensions.height}`,
    toolInventory: raw.tools?.screenTool === "nuphus_desktop_screen_size"
      && raw.tools?.canonicalSource === "McpCatalog.toolName(clientName, toolName)",
  };
  return {
    candidateId: raw.candidateId,
    checks,
    passed: Object.values(checks).every(Boolean),
    proofKind: raw.proofKind,
    schemaVersion: 1,
  };
}

function evaluateAbsent(raw: Record<string, any>): Record<string, unknown> {
  const checks = {
    activeConfigBinding: raw.active?.nuphus == null && raw.resolved?.nuphus == null && !normalizeArray(raw.resolved?.mcpNames).includes("nuphus"),
    cleanup: raw.cleanup?.server === "terminal" && raw.cleanup?.fixture === "removed" && raw.cleanup?.session === "not-created",
    exactBaseUrl: /^http:\/\/127\.0\.0\.1:\d+$/.test(String(raw.server?.baseUrl ?? "")) && Number(raw.server?.pid) > 0,
    isolated: raw.isolation?.rootsDistinct === true && raw.isolation?.testHomeConfigured === true && raw.isolation?.xdgDataConfigured === true,
    managedUnchanged: raw.managedUnchanged === true,
    modelsUnchanged: JSON.stringify(stableValue(raw.modelsBefore)) === JSON.stringify(stableValue(raw.modelsAfter)),
    noFailure: raw.failure == null && raw.cleanup?.serverFailure == null && raw.cleanup?.fixtureFailure == null && raw.cleanup?.sessionFailure == null,
    noNuphusPackage: raw.packages?.meta?.version == null && raw.packages?.platform?.version == null && raw.packages?.command?.found === false,
    noNuphusStatus: raw.mcpStatuses?.nuphus == null,
    noNuphusProcess: raw.processTree?.nuphusCount === 0 && raw.processTree?.siblingMcpCount === 0,
    noProviderOrScreenEffect: raw.prompt == null && raw.screenCaptureCount === 0,
    overlay: Object.keys(raw.overlay?.mcp ?? {}).sort().join(",") === "codebase-memory-mcp,graphify-global,serena"
      && raw.overlay?.mcp?.nuphus == null
      && Object.values(raw.resolved?.siblingStatuses ?? {}).every((value) => value === false),
    privacySafe: raw.privacySafe === true,
    schema: raw.schemaVersion === 1 && raw.proofKind === "nuphus-desktop-absent" && raw.mode === "absent",
  };
  return {
    candidateId: raw.candidateId,
    checks,
    passed: Object.values(checks).every(Boolean),
    proofKind: raw.proofKind,
    schemaVersion: 1,
  };
}

function evaluatePreflight(raw: Record<string, any>): Record<string, unknown> {
  const candidates = normalizeArray(raw.configs?.candidates) as Array<Record<string, unknown>>;
  const checks = {
    admin: raw.host?.isAdmin === true,
    candidateRecorded: typeof raw.candidate?.repository?.head === "string" && normalizeArray(raw.candidate?.files).length >= 10,
    cleanup: raw.cleanup?.state === "not-needed" && raw.cleanup?.synchronousChildrenTerminal === true,
    configParseClean: candidates.every((row) => row.parseErrorCount === 0) && raw.configs?.inline?.parseErrorCount === 0,
    currentEnvelope: raw.environment?.platform === "win32"
      && raw.environment?.arch === "x64"
      && raw.environment?.nodeVersion === "v24.18.1"
      && raw.environment?.npmVersion === "11.16.0"
      && raw.environment?.opencodeVersion === "1.18.25",
    interactiveDesktop: raw.host?.interactiveDesktop === true,
    noExistingOwner: raw.unexpectedOwner === false,
    noScreenContent: raw.capture?.screenCaptureCount === 0,
    preimagesRecorded: normalizeArray(raw.candidate?.files).some((row: any) => row.id === "active:opencode.json" && row.exists === true)
      && normalizeArray(raw.candidate?.files).some((row: any) => row.id === "active:opencode.local.instructions.md" && row.exists === true),
    privacySafe: raw.privacySafe === true,
    schema: raw.schemaVersion === 1 && raw.proofKind === "nuphus-desktop-preflight" && raw.mode === "preflight",
  };
  return {
    candidateId: raw.candidateId,
    checks,
    passed: Object.values(checks).every(Boolean),
    proofKind: raw.proofKind,
    schemaVersion: 1,
  };
}

function mcpClient(child: ChildProcessWithoutNullStreams): {
  notify: (method: string, params?: unknown) => void;
  request: (method: string, params?: unknown, timeoutMs?: number) => Promise<RpcResponse>;
} {
  let buffer = "";
  let nextId = 1;
  const pending = new Map<number, { reject: (reason: unknown) => void; resolve: (value: RpcResponse) => void; timer: NodeJS.Timeout }>();
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (chunk: string) => {
    buffer += chunk;
    for (;;) {
      const index = buffer.indexOf("\n");
      if (index < 0) break;
      const line = buffer.slice(0, index).trim();
      buffer = buffer.slice(index + 1);
      if (line === "") continue;
      let message: RpcResponse;
      try {
        message = JSON.parse(line) as RpcResponse;
      } catch (error) {
        for (const row of pending.values()) row.reject(new Error("Nuphus emitted invalid JSON-RPC", { cause: error }));
        pending.clear();
        continue;
      }
      if (typeof message.id !== "number") continue;
      const row = pending.get(message.id);
      if (row == null) continue;
      clearTimeout(row.timer);
      pending.delete(message.id);
      if (message.error != null) row.reject(new Error(`Nuphus JSON-RPC ${message.error.code ?? "unknown"}: ${message.error.message ?? "unknown error"}`));
      else row.resolve(message);
    }
  });
  child.once("exit", (code, signal) => {
    for (const row of pending.values()) {
      clearTimeout(row.timer);
      row.reject(new Error(`Nuphus exited before response (code ${code ?? "unknown"}, signal ${signal ?? "none"})`));
    }
    pending.clear();
  });
  return {
    notify(method, params = {}): void {
      child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method, params })}\n`);
    },
    request(method, params = {}, timeoutMs = 60_000): Promise<RpcResponse> {
      const id = nextId++;
      return new Promise<RpcResponse>((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`Nuphus ${method} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
        pending.set(id, { reject, resolve, timer });
        child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
      });
    },
  };
}

function toolValue(response: RpcResponse): unknown {
  const result = response.result as { content?: Array<{ text?: string; type?: string }>; isError?: boolean } | undefined;
  const text = result?.content?.find((row) => row.type === "text")?.text;
  if (result?.isError === true) throw new Error(`Nuphus tool failed: ${text ?? "missing error text"}`);
  if (typeof text !== "string") throw new Error("Nuphus tool response has no text content");
  return JSON.parse(text);
}

function toolJson(response: RpcResponse): Record<string, any> {
  const parsed = toolValue(response);
  if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Nuphus tool text is not a JSON object");
  return parsed as Record<string, any>;
}

async function withDirectNuphus<T>(cwd: string, action: (client: ReturnType<typeof mcpClient>) => Promise<T>): Promise<{ result: T; stderr: { bytes: number; sha256: string } }> {
  const resolution = resolvePortableCommand(["nuphus-mcp"], process.env);
  if (!resolution.ok) throw new Error(resolution.reason);
  const environment = { ...process.env, NUPHUS_MCP_CONFIRM_WRITE: "0" };
  for (const key of visionKeys) delete environment[key];
  const child = spawn(resolution.executable, [...resolution.args], {
    cwd,
    env: environment,
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
    ...(resolution.kind === "cmd" ? { windowsVerbatimArguments: true } : {}),
  });
  child.stderr.setEncoding("utf8");
  let stderr = "";
  child.stderr.on("data", (chunk: string) => {
    stderr = `${stderr}${chunk}`.slice(-30_000);
  });
  const client = mcpClient(child);
  try {
    await client.request("initialize", {
      capabilities: {},
      clientInfo: { name: "opencode-kit-nuphus-notepad-proof", version: "1" },
      protocolVersion: "2024-11-05",
    });
    client.notify("notifications/initialized");
    return { result: await action(client), stderr: { bytes: Buffer.byteLength(stderr), sha256: sha256(stderr) } };
  } finally {
    await stopProofProcessTree(child);
    if (child.exitCode == null && child.signalCode == null) throw new Error("Nuphus Notepad proof process did not terminate");
  }
}

async function callTool(client: ReturnType<typeof mcpClient>, name: string, args: Record<string, unknown>, timeoutMs = 60_000): Promise<unknown> {
  return toolValue(await client.request("tools/call", { arguments: args, name }, timeoutMs));
}

function notepadProcess(pid: number): Record<string, any> | null {
  const script = String.raw`
$ErrorActionPreference = 'Stop'
$row = Get-CimInstance Win32_Process -Filter "ProcessId = ${pid}" -ErrorAction Stop
if (-not $row -or $row.Name -ine 'Notepad.exe') { 'null'; exit 0 }
[ordered]@{
  pid = [int]$row.ProcessId
  parentPid = [int]$row.ParentProcessId
  name = [string]$row.Name
  createdAt = $(if ($row.CreationDate) { ([datetime]$row.CreationDate).ToUniversalTime().ToString('o') } else { $null })
} | ConvertTo-Json -Compress
`;
  const output = command(["powershell.exe", "-NoLogo", "-NoProfile", "-NonInteractive", "-EncodedCommand", encodedPowerShell(script)], 60_000).stdout;
  const parsed = JSON.parse(output) as Record<string, any> | null;
  return parsed;
}

function sameNotepadIdentity(row: Record<string, any> | null, pid: number, createdAt: string): boolean {
  return row != null && Number(row.pid) === pid && String(row.name ?? "").toLowerCase() === "notepad.exe" && row.createdAt === createdAt;
}

function sameNotepadWindow(row: Record<string, any>, state: Pick<NotepadState, "hwnd" | "pid" | "title">): boolean {
  return Number(row.hwnd) === state.hwnd && Number(row.process_id) === state.pid && String(row.title ?? "") === state.title;
}

function stopExactNotepad(pid: number, createdAt: string): void {
  const expected = createdAt.replaceAll("'", "''");
  const script = String.raw`
$ErrorActionPreference = 'Stop'
$row = Get-CimInstance Win32_Process -Filter "ProcessId = ${pid}" -ErrorAction Stop
if (-not $row -or $row.Name -ine 'Notepad.exe') { throw 'Proof-owned Notepad identity is absent' }
$created = $(if ($row.CreationDate) { ([datetime]$row.CreationDate).ToUniversalTime().ToString('o') } else { '' })
if ($created -ne '${expected}') { throw 'Proof-owned Notepad creation identity drifted' }
Stop-Process -Id ${pid} -Force -ErrorAction Stop
`;
  command(["powershell.exe", "-NoLogo", "-NoProfile", "-NonInteractive", "-EncodedCommand", encodedPowerShell(script)], 60_000);
}

function windowsFrom(value: unknown): Array<Record<string, any>> {
  if (Array.isArray(value)) return value.filter((row) => row != null && typeof row === "object") as Array<Record<string, any>>;
  if (value != null && typeof value === "object" && Array.isArray((value as Record<string, unknown>).windows)) {
    return (value as { windows: Array<Record<string, any>> }).windows;
  }
  throw new Error("Nuphus window list has an unexpected shape");
}

async function findNewNotepadWindow(
  client: ReturnType<typeof mcpClient>,
  titleToken: string,
  baselinePids: Set<number>,
): Promise<{ info: Record<string, any>; window: Record<string, any> }> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const windows = windowsFrom(await callTool(client, "desktop_windows_list", {}));
    const matching = windows.filter((row) => String(row.title ?? "").toLowerCase().includes(titleToken.toLowerCase()));
    const candidates: Array<{ info: Record<string, any>; window: Record<string, any> }> = [];
    for (const window of matching) {
      const hwnd = Number(window.hwnd);
      if (!Number.isInteger(hwnd) || hwnd <= 0) continue;
      const info = await callTool(client, "desktop_window_info", { hwnd }) as Record<string, any>;
      const pid = Number(info.process_id);
      if (String(info.process_name ?? "").toLowerCase() === "notepad.exe" && Number.isInteger(pid) && !baselinePids.has(pid)) candidates.push({ info, window });
    }
    if (candidates.length === 1) return candidates[0];
    if (candidates.length > 1) throw new Error("Proof-owned Notepad window identity is ambiguous");
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Proof-owned Notepad window did not appear");
}

function readNotepadState(stateRoot: string): NotepadState {
  const stateFile = path.join(stateRoot, "state.json");
  if (!fs.existsSync(stateFile)) throw new Error("Notepad proof state is missing");
  const state = JSON.parse(fs.readFileSync(stateFile, "utf8")) as NotepadState;
  if (path.resolve(state.stateRoot) !== path.resolve(stateRoot)) throw new Error("Notepad proof state root drifted");
  return state;
}

function screenshotFact(id: string, file: string, toolResult: Record<string, any>): Record<string, unknown> {
  const identity = fileIdentity(id, file);
  if (!identity.exists) throw new Error("Nuphus screenshot file is missing");
  const bytes = fs.readFileSync(file);
  return {
    ...identity,
    height: Number(toolResult.height ?? 0),
    pngSignature: bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    width: Number(toolResult.width ?? 0),
  };
}

async function notepadPrepareRaw(options: Options): Promise<Record<string, unknown>> {
  const stateRoot = options.stateRoot as string;
  if (fs.existsSync(stateRoot)) throw new Error("notepad-prepare requires a new --state-root");
  fs.mkdirSync(stateRoot, { recursive: true });
  const marker = `NUPHUS_PROOF_${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
  const titleToken = `nuphus-proof-${crypto.randomUUID()}.txt`;
  const file = path.join(stateRoot, titleToken);
  const beforeScreenshot = path.join(stateRoot, "before.png");
  fs.writeFileSync(file, "", { encoding: "utf8", flag: "wx" });
  const beforeHost = hostFacts() as Record<string, any>;
  const baselinePids = new Set<number>(normalizeArray(beforeHost.relevantProcesses)
    .filter((row: any) => String(row?.name ?? "").toLowerCase() === "notepad.exe")
    .map((row: any) => Number(row.pid)));
  const raw: Record<string, any> = {
    candidateId: options.candidateId,
    cleanup: { nuphus: "unknown", notepad: "unknown", state: "present" },
    inputCount: 0,
    marker,
    mode: "notepad-prepare",
    proofKind: "nuphus-desktop-notepad-prepare",
    schemaVersion: 1,
  };
  let launchPid: number | null = null;
  let targetPid: number | null = null;
  let targetCreatedAt: string | null = null;
  try {
    const resolution = resolvePortableCommand(["notepad.exe"], process.env);
    if (!resolution.ok || resolution.kind !== "native") throw new Error(resolution.ok ? "Notepad proof requires a native executable" : resolution.reason);
    const child = spawn(resolution.executable, [...resolution.args, file], { detached: true, stdio: "ignore", windowsHide: false });
    launchPid = child.pid ?? null;
    child.unref();
    if (launchPid == null) throw new Error("Notepad launch returned no PID");
    const nuphus = await withDirectNuphus(stateRoot, async (client) => {
      const found = await findNewNotepadWindow(client, titleToken, baselinePids);
      const hwnd = Number(found.info.hwnd ?? found.window.hwnd);
      targetPid = Number(found.info.process_id);
      const identity = notepadProcess(targetPid);
      if (identity == null || baselinePids.has(targetPid)) throw new Error("Notepad target is not a new proof-owned process");
      targetCreatedAt = String(identity.createdAt ?? "");
      if (targetCreatedAt === "") throw new Error("Notepad target has no creation identity");
      await callTool(client, "desktop_window_activate", { hwnd });
      const activated = await callTool(client, "desktop_window_info", { hwnd }) as Record<string, any>;
      if (Number(activated.process_id) !== targetPid || !String(activated.title ?? "").toLowerCase().includes(titleToken.toLowerCase())) {
        throw new Error("Notepad target identity changed after activation");
      }
      const screenshot = await callTool(client, "desktop_window_screenshot", { hwnd, path: beforeScreenshot }, 120_000) as Record<string, any>;
      return { activated, hwnd, screenshot };
    });
    raw.cleanup.nuphus = "terminal";
    raw.nuphusStderr = nuphus.stderr;
    const state: NotepadState = {
      afterScreenshot: null,
      beforeScreenshot,
      createdAt: targetCreatedAt as string,
      file,
      hwnd: nuphus.result.hwnd,
      marker,
      phase: "prepared",
      pid: targetPid as number,
      stateRoot,
      title: String(nuphus.result.activated.title ?? titleToken),
    };
    fs.writeFileSync(path.join(stateRoot, "state.json"), json(state), { encoding: "utf8", flag: "wx" });
    raw.cleanup.notepad = "retained-for-visual-read";
    raw.screenshot = screenshotFact("before.png", beforeScreenshot, nuphus.result.screenshot);
    raw.target = { createdAt: state.createdAt, hwnd: state.hwnd, newProcess: !baselinePids.has(state.pid), pid: state.pid, title: state.title };
  } catch (error) {
    raw.failure = safeFailure(error, [stateRoot]);
    const cleanupPid = targetPid ?? launchPid;
    if (cleanupPid != null) {
      const identity = notepadProcess(cleanupPid);
      if (identity != null && !baselinePids.has(cleanupPid)) {
        try {
          stopExactNotepad(cleanupPid, String(identity.createdAt));
          raw.cleanup.notepad = "terminal-after-failure";
        } catch (cleanupError) {
          raw.cleanup.notepad = "failed";
          raw.cleanup.notepadFailure = safeFailure(cleanupError, [stateRoot]);
        }
      }
    }
    try {
      removeProofFixture(stateRoot);
      raw.cleanup.state = fs.existsSync(stateRoot) ? "present" : "removed-after-failure";
    } catch (cleanupError) {
      raw.cleanup.state = "failed";
      raw.cleanup.stateFailure = safeFailure(cleanupError, [stateRoot]);
    }
  }
  raw.privacySafe = privacySafe(raw, [stateRoot]);
  return raw;
}

async function notepadActRaw(options: Options): Promise<Record<string, unknown>> {
  const stateRoot = options.stateRoot as string;
  const state = readNotepadState(stateRoot);
  if (state.phase !== "prepared") throw new Error("Notepad proof is not in prepared phase");
  const raw: Record<string, any> = {
    candidateId: options.candidateId,
    cleanup: { nuphus: "unknown", notepad: "retained-for-visual-read", state: "present" },
    inputCount: 0,
    marker: state.marker,
    mode: "notepad-act",
    proofKind: "nuphus-desktop-notepad-act",
    schemaVersion: 1,
  };
  const current = notepadProcess(state.pid);
  if (!sameNotepadIdentity(current, state.pid, state.createdAt)) throw new Error("Proof-owned Notepad process identity is stale before input");
  const beforeIdentity = fileIdentity("before.png", state.beforeScreenshot);
  if (!beforeIdentity.exists) throw new Error("Before screenshot is unavailable for Notepad act phase");
  const afterScreenshot = path.join(stateRoot, "after.png");
  try {
    const nuphus = await withDirectNuphus(stateRoot, async (client) => {
      const windows = windowsFrom(await callTool(client, "desktop_windows_list", {}));
      const exact = windows.filter((row) => Number(row.hwnd) === state.hwnd && String(row.title ?? "").toLowerCase().includes(path.basename(state.file).toLowerCase()));
      if (exact.length !== 1) throw new Error("Proof-owned Notepad HWND/title identity is stale or ambiguous before input");
      const before = await callTool(client, "desktop_window_info", { hwnd: state.hwnd }) as Record<string, any>;
      if (!sameNotepadWindow(before, state)) throw new Error("Proof-owned Notepad info identity drifted before input");
      await callTool(client, "desktop_window_activate", { hwnd: state.hwnd });
      const activated = await callTool(client, "desktop_window_info", { hwnd: state.hwnd }) as Record<string, any>;
      if (!sameNotepadWindow(activated, state)) throw new Error("Proof-owned Notepad identity drifted after activation");
      const input = await callTool(client, "desktop_input", { hwnd: state.hwnd, mode: "type", send: "none", text: state.marker });
      raw.inputCount = 1;
      const screenshot = await callTool(client, "desktop_window_screenshot", { hwnd: state.hwnd, path: afterScreenshot }, 120_000) as Record<string, any>;
      return { activated, input, screenshot };
    });
    raw.cleanup.nuphus = "terminal";
    raw.nuphusStderr = nuphus.stderr;
    raw.inputResultSha256 = sha256(JSON.stringify(stableValue(nuphus.result.input)));
    raw.screenshot = screenshotFact("after.png", afterScreenshot, nuphus.result.screenshot);
    raw.target = { createdAt: state.createdAt, hwnd: state.hwnd, pid: state.pid, revalidated: true, title: state.title };
    state.afterScreenshot = afterScreenshot;
    state.phase = "acted";
    fs.writeFileSync(path.join(stateRoot, "state.json"), json(state), "utf8");
  } catch (error) {
    raw.failure = safeFailure(error, [stateRoot]);
  }
  raw.privacySafe = privacySafe(raw, [stateRoot]);
  return raw;
}

function notepadCleanupRaw(options: Options): Record<string, unknown> {
  const stateRoot = options.stateRoot as string;
  const state = readNotepadState(stateRoot);
  const raw: Record<string, any> = {
    candidateId: options.candidateId,
    cleanup: { notepad: "unknown", state: "present" },
    mode: "notepad-cleanup",
    proofKind: "nuphus-desktop-notepad-cleanup",
    schemaVersion: 1,
    screenshots: {
      after: state.afterScreenshot == null ? null : fileIdentity("after.png", state.afterScreenshot),
      before: fileIdentity("before.png", state.beforeScreenshot),
    },
    target: { createdAt: state.createdAt, hwnd: state.hwnd, phase: state.phase, pid: state.pid, title: state.title },
  };
  try {
    const current = notepadProcess(state.pid);
    if (!sameNotepadIdentity(current, state.pid, state.createdAt)) throw new Error("Proof-owned Notepad identity is stale before cleanup");
    stopExactNotepad(state.pid, state.createdAt);
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline && notepadProcess(state.pid) != null) {
      spawnSync("powershell.exe", ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", "Start-Sleep -Milliseconds 100"], { windowsHide: true });
    }
    if (notepadProcess(state.pid) != null) throw new Error("Proof-owned Notepad remained alive after cleanup");
    raw.cleanup.notepad = "terminal";
    removeProofFixture(stateRoot);
    raw.cleanup.state = fs.existsSync(stateRoot) ? "present" : "removed";
  } catch (error) {
    raw.failure = safeFailure(error, [stateRoot]);
  }
  raw.privacySafe = privacySafe(raw, [stateRoot]);
  return raw;
}

function normalizedProofText(value: unknown): string {
  return typeof value === "string" ? value.replace(/[^A-Za-z0-9]/g, "").toUpperCase() : "";
}

async function perceiveRaw(options: Options): Promise<Record<string, unknown>> {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "nuphus-perceive-"));
  const marker = `NUPHUS_PERCEIVE_${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
  const titleToken = `nuphus-perceive-${crypto.randomUUID()}.txt`;
  const file = path.join(fixture, titleToken);
  const screenshotPath = path.join(fixture, "perceive.png");
  const beforeHost = hostFacts() as Record<string, any>;
  const baselinePids = new Set<number>(normalizeArray(beforeHost.relevantProcesses)
    .filter((row: any) => String(row?.name ?? "").toLowerCase() === "notepad.exe")
    .map((row: any) => Number(row.pid)));
  const raw: Record<string, any> = {
    candidateId: options.candidateId,
    cleanup: { fixture: "present", notepad: "unknown", nuphus: "unknown" },
    cloudVision: {
      configuredKeys: visionKeys.filter((key) => Boolean(process.env[key])),
      credentialsUsed: false,
      requestsMade: 0,
    },
    fallback: {
      evidence: "evidence/notepad-r1-visual/read-oracle.json",
      oracle: "OpenCode image-capable Read",
      result: "marker-visibly-confirmed-in-attributed-window",
    },
    marker,
    mode: "perceive",
    modelSources: [
      "https://hf-mirror.com/SWHL/RapidOCR/resolve/main/PP-OCRv4/ch_PP-OCRv4_det_infer.onnx",
      "https://huggingface.co/SWHL/RapidOCR/resolve/main/PP-OCRv4/ch_PP-OCRv4_det_infer.onnx",
      "https://hf-mirror.com/SWHL/RapidOCR/resolve/main/PP-OCRv4/ch_PP-OCRv4_rec_infer.onnx",
      "https://huggingface.co/SWHL/RapidOCR/resolve/main/PP-OCRv4/ch_PP-OCRv4_rec_infer.onnx",
      "https://gitee.com/paddlepaddle/PaddleOCR/raw/main/ppocr/utils/ppocr_keys_v1.txt",
      "https://hf-mirror.com/onnx-community/OmniParser-icon_detect_640x640/resolve/main/onnx/model.onnx",
      "https://huggingface.co/onnx-community/OmniParser-icon_detect_640x640/resolve/main/onnx/model.onnx",
    ],
    modelsBefore: modelFacts(),
    proofKind: "nuphus-desktop-perceive",
    schemaVersion: 1,
  };
  let launchPid: number | null = null;
  let targetPid: number | null = null;
  let targetCreatedAt: string | null = null;
  try {
    fs.writeFileSync(file, marker, { encoding: "utf8", flag: "wx" });
    const resolution = resolvePortableCommand(["notepad.exe"], process.env);
    if (!resolution.ok || resolution.kind !== "native") throw new Error(resolution.ok ? "Perception proof requires native Notepad" : resolution.reason);
    const child = spawn(resolution.executable, [...resolution.args, file], { detached: true, stdio: "ignore", windowsHide: false });
    launchPid = child.pid ?? null;
    child.unref();
    if (launchPid == null) throw new Error("Perception Notepad launch returned no PID");

    const nuphus = await withDirectNuphus(fixture, async (client) => {
      const found = await findNewNotepadWindow(client, titleToken, baselinePids);
      const hwnd = Number(found.info.hwnd ?? found.window.hwnd);
      targetPid = Number(found.info.process_id);
      const identity = notepadProcess(targetPid);
      if (identity == null || baselinePids.has(targetPid)) throw new Error("Perception Notepad is not a new proof-owned process");
      targetCreatedAt = String(identity.createdAt ?? "");
      if (targetCreatedAt === "") throw new Error("Perception Notepad has no creation identity");
      await callTool(client, "desktop_window_activate", { hwnd });
      const activated = await callTool(client, "desktop_window_info", { hwnd }) as Record<string, any>;
      if (Number(activated.process_id) !== targetPid || !String(activated.title ?? "").toLowerCase().includes(titleToken.toLowerCase())) {
        throw new Error("Perception Notepad identity changed after activation");
      }
      const screenshot = await callTool(client, "desktop_window_screenshot", { hwnd, path: screenshotPath }, 120_000) as Record<string, any>;
      let perception: Record<string, unknown>;
      try {
        const perceived = await callTool(client, "desktop_perceive", { path: screenshotPath }, 300_000) as Record<string, any>;
        const elements = normalizeArray(perceived.elements) as Array<Record<string, any>>;
        const projectedElements = elements.slice(0, 100).map((element) => ({
          bbox: element.bbox ?? element.box ?? null,
          center: element.center ?? null,
          confidence: element.confidence ?? null,
          text: typeof element.text === "string" ? element.text : null,
          type: element.type ?? null,
        }));
        const markerNormalized = normalizedProofText(marker);
        const markerSuffix = markerNormalized.slice(-10);
        const markerElement = projectedElements.find((element) => normalizedProofText(element.text).includes(markerSuffix)) ?? null;
        const allText = normalizedProofText(projectedElements.map((element) => element.text ?? "").join(" "));
        perception = {
          elementCount: elements.length,
          markerElement,
          markerFound: allText.includes(markerNormalized) || allText.includes(markerSuffix),
          markerSuffix,
          projectedElements,
          reportedIconCount: perceived.icon_count ?? null,
          reportedOcrCount: perceived.ocr_count ?? null,
          status: "available",
        };
      } catch (error) {
        perception = { cause: safeFailure(error, [fixture]), status: "degraded" };
      }
      return { activated, hwnd, perception, screenshot };
    });
    raw.cleanup.nuphus = "terminal";
    raw.nuphusStderr = nuphus.stderr;
    raw.perception = nuphus.result.perception;
    raw.screenshot = screenshotFact("perceive.png", screenshotPath, nuphus.result.screenshot);
    raw.target = {
      createdAt: targetCreatedAt,
      hwnd: nuphus.result.hwnd,
      newProcess: !baselinePids.has(targetPid as number),
      pid: targetPid,
      title: String(nuphus.result.activated.title ?? titleToken),
    };
  } catch (error) {
    raw.failure = safeFailure(error, [fixture]);
  } finally {
    raw.modelsAfter = modelFacts();
    const cleanupPid = targetPid ?? launchPid;
    if (cleanupPid != null) {
      const identity = notepadProcess(cleanupPid);
      if (identity == null) raw.cleanup.notepad = "already-terminal";
      else if (baselinePids.has(cleanupPid)) raw.cleanup.notepad = "identity-unavailable-retained";
      else {
        try {
          stopExactNotepad(cleanupPid, String(identity.createdAt));
          raw.cleanup.notepad = "terminal";
        } catch (error) {
          raw.cleanup.notepad = "failed";
          raw.cleanup.notepadFailure = safeFailure(error, [fixture]);
        }
      }
    }
    try {
      removeProofFixture(fixture);
      raw.cleanup.fixture = fs.existsSync(fixture) ? "present" : "removed";
    } catch (error) {
      raw.cleanup.fixture = "failed";
      raw.cleanup.fixtureFailure = safeFailure(error, [fixture]);
    }
  }
  raw.privacySafe = privacySafe(raw, [fixture]);
  return raw;
}

function evaluateNotepadPrepare(raw: Record<string, any>): Record<string, unknown> {
  const checks = {
    beforeImage: raw.screenshot?.exists === true && raw.screenshot?.pngSignature === true && raw.screenshot?.width > 0 && raw.screenshot?.height > 0,
    noInput: raw.inputCount === 0,
    noFailure: raw.failure == null,
    ownedTarget: raw.target?.newProcess === true && raw.target?.pid > 0 && raw.target?.hwnd > 0,
    phaseBoundary: raw.cleanup?.notepad === "retained-for-visual-read" && raw.cleanup?.state === "present",
    privacySafe: raw.privacySafe === true,
    protocolCleanup: raw.cleanup?.nuphus === "terminal",
    schema: raw.schemaVersion === 1 && raw.proofKind === "nuphus-desktop-notepad-prepare" && raw.mode === "notepad-prepare",
  };
  return { candidateId: raw.candidateId, checks, passed: Object.values(checks).every(Boolean), proofKind: raw.proofKind, schemaVersion: 1 };
}

function evaluateNotepadAct(raw: Record<string, any>): Record<string, unknown> {
  const checks = {
    afterImage: raw.screenshot?.exists === true && raw.screenshot?.pngSignature === true && raw.screenshot?.width > 0 && raw.screenshot?.height > 0,
    exactInput: raw.inputCount === 1 && typeof raw.inputResultSha256 === "string",
    noFailure: raw.failure == null,
    phaseBoundary: raw.cleanup?.notepad === "retained-for-visual-read" && raw.cleanup?.state === "present",
    privacySafe: raw.privacySafe === true,
    protocolCleanup: raw.cleanup?.nuphus === "terminal",
    schema: raw.schemaVersion === 1 && raw.proofKind === "nuphus-desktop-notepad-act" && raw.mode === "notepad-act",
    targetRevalidated: raw.target?.revalidated === true && raw.target?.pid > 0 && raw.target?.hwnd > 0,
  };
  return { candidateId: raw.candidateId, checks, passed: Object.values(checks).every(Boolean), proofKind: raw.proofKind, schemaVersion: 1 };
}

function evaluateNotepadCleanup(raw: Record<string, any>): Record<string, unknown> {
  const checks = {
    imagesObservedBeforeRemoval: raw.screenshots?.before?.exists === true && raw.screenshots?.after?.exists === true,
    noFailure: raw.failure == null,
    ownedTargetTerminal: raw.cleanup?.notepad === "terminal" && raw.target?.pid > 0,
    privacySafe: raw.privacySafe === true,
    schema: raw.schemaVersion === 1 && raw.proofKind === "nuphus-desktop-notepad-cleanup" && raw.mode === "notepad-cleanup",
    stateRemoved: raw.cleanup?.state === "removed",
  };
  return { candidateId: raw.candidateId, checks, passed: Object.values(checks).every(Boolean), proofKind: raw.proofKind, schemaVersion: 1 };
}

function evaluatePerceive(raw: Record<string, any>): Record<string, unknown> {
  const available = raw.perception?.status === "available"
    && raw.perception?.markerFound === true
    && raw.perception?.markerElement != null;
  const degraded = raw.perception?.status === "degraded"
    && typeof raw.perception?.cause?.message === "string"
    && raw.perception.cause.message.length > 0;
  const checks = {
    cleanup: raw.cleanup?.notepad === "terminal" && raw.cleanup?.nuphus === "terminal" && raw.cleanup?.fixture === "removed",
    fallbackRecorded: raw.fallback?.oracle === "OpenCode image-capable Read",
    localCoordinates: available ? Boolean(raw.perception?.markerElement?.center || raw.perception?.markerElement?.bbox) : degraded,
    modelInventory: Array.isArray(raw.modelSources)
      && raw.modelSources.length >= 3
      && typeof raw.modelsAfter?.path?.pathSha256 === "string"
      && Array.isArray(raw.modelsAfter?.files),
    noCloudVision: normalizeArray(raw.cloudVision?.configuredKeys).length === 0
      && raw.cloudVision?.credentialsUsed === false
      && raw.cloudVision?.requestsMade === 0,
    noFailure: raw.failure == null && raw.cleanup?.notepadFailure == null && raw.cleanup?.fixtureFailure == null,
    ownedTarget: raw.target?.newProcess === true && raw.target?.pid > 0 && raw.target?.hwnd > 0,
    perceptionOutcome: available || degraded,
    privacySafe: raw.privacySafe === true,
    schema: raw.schemaVersion === 1 && raw.proofKind === "nuphus-desktop-perceive" && raw.mode === "perceive",
    screenshotCaptured: raw.screenshot?.exists === true && raw.screenshot?.pngSignature === true,
  };
  return { candidateId: raw.candidateId, checks, passed: Object.values(checks).every(Boolean), proofKind: raw.proofKind, schemaVersion: 1 };
}

async function directRaw(options: Options): Promise<Record<string, unknown>> {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "nuphus-direct-"));
  const packages = packageFacts();
  const resolution = resolvePortableCommand(["nuphus-mcp"], process.env);
  if (!resolution.ok) {
    removeProofFixture(fixture);
    throw new Error(resolution.reason);
  }
  const environment = { ...process.env, NUPHUS_MCP_CONFIRM_WRITE: "0" };
  for (const key of visionKeys) delete environment[key];
  const child = spawn(resolution.executable, [...resolution.args], {
    cwd: fixture,
    env: environment,
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
    ...(resolution.kind === "cmd" ? { windowsVerbatimArguments: true } : {}),
  });
  child.stderr.setEncoding("utf8");
  let stderr = "";
  child.stderr.on("data", (chunk: string) => {
    stderr = `${stderr}${chunk}`.slice(-30_000);
  });
  const client = mcpClient(child);
  const raw: Record<string, any> = {
    candidateId: options.candidateId,
    cleanup: { process: "unknown", screenshotFixture: "unknown" },
    environment: { arch: process.arch, confirmWrite: "0", platform: process.platform, visionConfigured: false },
    mode: "direct",
    packages,
    proofKind: "nuphus-desktop-direct",
    runner: fileIdentity("tools/proofs/nuphus-desktop.ts", runnerPath),
    schemaVersion: 1,
  };
  try {
    const initialize = await client.request("initialize", {
      capabilities: {},
      clientInfo: { name: "opencode-kit-nuphus-proof", version: "1" },
      protocolVersion: "2024-11-05",
    });
    client.notify("notifications/initialized");
    const listed = await client.request("tools/list");
    const tools = normalizeArray((listed.result as Record<string, unknown> | undefined)?.tools) as Array<Record<string, unknown>>;
    const screen = toolJson(await client.request("tools/call", { arguments: {}, name: "desktop_screen_size" }));
    const requestedScreenshot = path.join(fixture, "direct-screen.png");
    const screenshot = toolJson(await client.request("tools/call", { arguments: { path: requestedScreenshot }, name: "desktop_screenshot" }, 120_000));
    const screenshotFile = [requestedScreenshot, `${requestedScreenshot}.png`].find((file) => fs.existsSync(file));
    if (screenshotFile == null) throw new Error("Nuphus reported screenshot success without a PNG file");
    const bytes = fs.readFileSync(screenshotFile);
    raw.mcp = {
      initialize: {
        protocolVersion: (initialize.result as Record<string, unknown> | undefined)?.protocolVersion ?? null,
        serverName: ((initialize.result as Record<string, any> | undefined)?.serverInfo as Record<string, unknown> | undefined)?.name ?? null,
      },
      screen: { height: Number(screen.height ?? 0), width: Number(screen.width ?? 0) },
      screenshot: {
        bytes: bytes.length,
        format: screenshot.format ?? null,
        height: Number(screenshot.height ?? 0),
        pngSignature: bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
        sha256: sha256(bytes),
        width: Number(screenshot.width ?? 0),
      },
      toolNames: tools.map((row) => String(row.name ?? "")).filter(Boolean).sort(),
    };
  } finally {
    await stopProofProcessTree(child);
    raw.cleanup.process = child.exitCode != null || child.signalCode != null ? "terminal" : "unknown";
    raw.cleanup.exitCode = child.exitCode;
    raw.cleanup.signalCode = child.signalCode;
    removeProofFixture(fixture);
    raw.cleanup.screenshotFixture = fs.existsSync(fixture) ? "present" : "removed";
    raw.stderr = { bytes: Buffer.byteLength(stderr), sha256: sha256(stderr) };
  }
  raw.privacySafe = privacySafe(raw, [options.configDir as string, fixture]);
  return raw;
}

function evaluateDirect(raw: Record<string, any>): Record<string, unknown> {
  const toolNames = normalizeArray(raw.mcp?.toolNames).map(String);
  const checks = {
    cleanup: raw.cleanup?.process === "terminal" && raw.cleanup?.screenshotFixture === "removed",
    currentPlatform: raw.environment?.platform === "win32" && raw.environment?.arch === "x64",
    fullAuthority: raw.environment?.confirmWrite === "0",
    noCloudVision: raw.environment?.visionConfigured === false,
    packageVersions: raw.packages?.meta?.version === "0.2.2" && raw.packages?.platform?.version === "0.2.2",
    privacySafe: raw.privacySafe === true,
    protocol: raw.mcp?.initialize?.protocolVersion === "2024-11-05",
    schema: raw.schemaVersion === 1 && raw.proofKind === "nuphus-desktop-direct" && raw.mode === "direct",
    screen: raw.mcp?.screen?.width > 0 && raw.mcp?.screen?.height > 0,
    screenshot: raw.mcp?.screenshot?.pngSignature === true
      && raw.mcp?.screenshot?.bytes > 0
      && raw.mcp?.screenshot?.width > 0
      && raw.mcp?.screenshot?.height > 0,
    toolInventory: toolNames.length === 38 && requiredTools.every((name) => toolNames.includes(name)),
  };
  return {
    candidateId: raw.candidateId,
    checks,
    passed: Object.values(checks).every(Boolean),
    proofKind: raw.proofKind,
    schemaVersion: 1,
  };
}

function evaluate(raw: Record<string, any>): Record<string, unknown> {
  if (raw.proofKind === "nuphus-desktop-preflight") return evaluatePreflight(raw);
  if (raw.proofKind === "nuphus-desktop-direct") return evaluateDirect(raw);
  if (raw.proofKind === "nuphus-desktop-config") return evaluateConfig(raw);
  if (raw.proofKind === "nuphus-desktop-loaded") return evaluateLoaded(raw);
  if (raw.proofKind === "nuphus-desktop-absent") return evaluateAbsent(raw);
  if (raw.proofKind === "nuphus-desktop-notepad-prepare") return evaluateNotepadPrepare(raw);
  if (raw.proofKind === "nuphus-desktop-notepad-act") return evaluateNotepadAct(raw);
  if (raw.proofKind === "nuphus-desktop-notepad-cleanup") return evaluateNotepadCleanup(raw);
  if (raw.proofKind === "nuphus-desktop-perceive") return evaluatePerceive(raw);
  return { candidateId: raw.candidateId ?? null, checks: { knownProofKind: false }, passed: false, proofKind: raw.proofKind ?? null, schemaVersion: 1 };
}

async function capture(options: Options): Promise<void> {
  if (fs.existsSync(options.evidenceRoot)) throw new Error("A new --evidence-root is required");
  fs.mkdirSync(options.evidenceRoot, { recursive: true });
  let raw: Record<string, unknown>;
  try {
    raw = options.mode === "preflight"
      ? preflightRaw(options)
      : options.mode === "config"
        ? configRaw(options)
        : options.mode === "loaded"
          ? await loadedRaw(options)
          : options.mode === "absent"
            ? await loadedRaw(options, true)
          : options.mode === "notepad-prepare"
            ? await notepadPrepareRaw(options)
            : options.mode === "notepad-act"
              ? await notepadActRaw(options)
             : options.mode === "notepad-cleanup"
                ? notepadCleanupRaw(options)
                : options.mode === "perceive"
                  ? await perceiveRaw(options)
                  : await directRaw(options);
  } catch (error) {
    raw = {
      candidateId: options.candidateId,
      failure: safeFailure(error, [options.configDir ?? "", options.evidenceRoot]),
      mode: options.mode,
      proofKind: `nuphus-desktop-${options.mode}`,
      schemaVersion: 1,
    };
    raw.privacySafe = privacySafe(raw, [options.configDir ?? "", options.evidenceRoot, options.inputRoot ?? "", options.stateRoot ?? ""]);
  }
  const evaluation = evaluate(raw as Record<string, any>);
  writeNew(path.join(options.evidenceRoot, "raw.json"), raw);
  writeNew(path.join(options.evidenceRoot, "evaluation.json"), evaluation);
  process.stdout.write(json(evaluation));
  process.exitCode = evaluation.passed === true ? 0 : 1;
}

function replay(options: Options): void {
  if (fs.existsSync(options.evidenceRoot)) throw new Error("A new --evidence-root is required");
  const input = path.join(options.inputRoot as string, "raw.json");
  if (!fs.existsSync(input)) throw new Error("Replay input does not contain raw.json");
  const bytes = fs.readFileSync(input);
  const raw = JSON.parse(bytes.toString("utf8")) as Record<string, any>;
  const evaluation = evaluate(raw);
  fs.mkdirSync(options.evidenceRoot, { recursive: true });
  writeNew(path.join(options.evidenceRoot, "replay.json"), {
    candidateId: options.candidateId,
    inputRawSha256: sha256(bytes),
    noLiveCalls: true,
    sourceCandidateId: raw.candidateId ?? null,
  });
  writeNew(path.join(options.evidenceRoot, "evaluation.json"), evaluation);
  process.stdout.write(json(evaluation));
  process.exitCode = evaluation.passed === true ? 0 : 1;
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  if (options.mode === "replay") replay(options);
  else await capture(options);
}

export { exactBlock, guardedRollback, mcpClient, privacySafe, sameNotepadIdentity, sameNotepadWindow, screenshotFact, toolValue };

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
