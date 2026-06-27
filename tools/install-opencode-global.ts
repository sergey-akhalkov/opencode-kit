#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Mode = "set" | "check" | "print" | "unset" | "persist-script" | "unset-script";

type Options = {
  mode: Mode;
  dryRun: boolean;
  scriptFile: string | null;
};

const ENV_VAR = "OPENCODE_CONFIG_DIR";
const GLOBAL_DIR_NAME = "global";
export const SETX_SAFE_LIMIT = 900;

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const globalDir = path.resolve(repoRoot, GLOBAL_DIR_NAME);

function printUsage(): void {
  console.log(`Usage:
  npm run install:global -- [options]

Point OpenCode at this repository as its single source of truth for global
configuration. Instead of copying skills/agents/AGENTS.md into ~/.config/opencode,
the installer sets the OPENCODE_CONFIG_DIR environment variable to the repository
"global/" directory. OpenCode loads skills, agents, AGENTS.md, plugins, and
opencode.json directly from there.

Target: ${globalDir}

Options:
  (default)              Set OPENCODE_CONFIG_DIR persistently to the repo global/ dir.
  --check, --audit       Exit 0 if OPENCODE_CONFIG_DIR already points at global/; 1 otherwise.
  --print                Print the target path and the platform command without changing anything.
  --unset                Remove the persisted OPENCODE_CONFIG_DIR value.
  --persist-script <file>  Append an idempotent "export OPENCODE_CONFIG_DIR=..." line to <file>.
  --unset-script <file>    Remove the matching "export OPENCODE_CONFIG_DIR=..." line from <file>.
  --dry-run, --what-if   Show what the default mode would do without setting anything.
  --help, -h             Show this help.

Platform behavior:
  Windows: default mode runs "setx OPENCODE_CONFIG_DIR <path>" (writes HKCU\\Environment).
    Values longer than ${SETX_SAFE_LIMIT} chars are rejected with a warning that points
    at \`--print\` so the user can run \`setx\` manually.
  macOS/Linux: default mode prints the export line to add to your shell profile
  (~/.zshrc or ~/.bashrc); use --persist-script to append it idempotently.

Restart OpenCode after installing; the running process keeps the old environment
until restarted. On Windows, GUI apps launched from Explorer may require logoff/logon
to inherit the new user environment variable.
`);
}

function readValue(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (!value || value.trim() === "" || value.startsWith("--")) {
    throw new Error(`Missing value for ${option}.`);
  }
  return value;
}

function parseArgs(args: string[]): Options {
  const options: Options = { mode: "set", dryRun: false, scriptFile: null };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else if (arg === "--dry-run" || arg === "--what-if") {
      options.dryRun = true;
    } else if (arg === "--check" || arg === "--audit") {
      options.mode = "check";
    } else if (arg === "--print") {
      options.mode = "print";
    } else if (arg === "--unset") {
      options.mode = "unset";
    } else if (arg === "--persist-script") {
      options.mode = "persist-script";
      options.scriptFile = readValue(args, index, arg);
      index++;
    } else if (arg.startsWith("--persist-script=")) {
      options.mode = "persist-script";
      options.scriptFile = arg.slice("--persist-script=".length);
    } else if (arg === "--unset-script") {
      options.mode = "unset-script";
      options.scriptFile = readValue(args, index, arg);
      index++;
    } else if (arg.startsWith("--unset-script=")) {
      options.mode = "unset-script";
      options.scriptFile = arg.slice("--unset-script=".length);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (options.dryRun && options.mode !== "set") {
    throw new Error("--dry-run only applies to the default (set) mode.");
  }
  if ((options.mode === "persist-script" || options.mode === "unset-script") && (options.scriptFile == null || options.scriptFile.trim() === "")) {
    throw new Error(`${options.mode} requires a <file> argument.`);
  }
  return options;
}

export function measuredValueLength(value: string): number {
  return value.length + ENV_VAR.length + 1;
}

export function buildExportLine(value: string): string {
  return `export ${ENV_VAR}="${value}"`;
}

export function isExportLineFor(line: string, envName: string): boolean {
  const trimmed = line.trim();
  const prefix = `export ${envName}=`;
  if (!trimmed.startsWith(prefix)) {
    return false;
  }
  const remainder = trimmed.slice(prefix.length);
  if (!remainder.startsWith('"') || !remainder.endsWith('"')) {
    return false;
  }
  if (remainder.includes("\n")) {
    return false;
  }
  return true;
}

export function appendExportLine(file: string, envLine: string, envName: string): { appended: boolean; totalLines: number } {
  let existing = "";
  if (fs.existsSync(file)) {
    existing = fs.readFileSync(file, "utf8");
  }
  const lines = existing.split(/\r?\n/);
  const totalLines = lines.length;
  for (const line of lines) {
    if (isExportLineFor(line, envName)) {
      return { appended: false, totalLines };
    }
  }
  const separator = existing.length === 0 || existing.endsWith("\n") ? "" : "\n";
  const block = `${separator}${envLine}\n`;
  fs.writeFileSync(file, existing + block);
  return { appended: true, totalLines };
}

export function removeExportLine(file: string, envName: string): { removed: boolean; totalLines: number } {
  if (!fs.existsSync(file)) {
    return { removed: false, totalLines: 0 };
  }
  const existing = fs.readFileSync(file, "utf8");
  const lines = existing.split(/\r?\n/);
  const kept: string[] = [];
  let removed = false;
  for (const line of lines) {
    if (!removed && isExportLineFor(line, envName)) {
      removed = true;
      continue;
    }
    kept.push(line);
  }
  const totalLines = kept.length;
  if (!removed) {
    return { removed: false, totalLines };
  }
  const joined = kept.join("\n");
  fs.writeFileSync(file, joined);
  return { removed: true, totalLines };
}

function runPersistScript(file: string): void {
  const errors = validateGlobalDir(globalDir);
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(error);
    }
    process.exit(1);
  }
  const envLine = buildExportLine(globalDir);
  const result = appendExportLine(file, envLine, ENV_VAR);
  if (result.appended) {
    console.log(`persisted: appended ${envLine} to ${file}`);
  } else {
    console.log(`persisted: ${file} already contains an ${ENV_VAR} export line; no change.`);
  }
  console.log("Restart your shell so the new env var is loaded.");
}

function runUnsetScript(file: string): void {
  const result = removeExportLine(file, ENV_VAR);
  if (result.removed) {
    console.log(`unset: removed ${ENV_VAR} export line from ${file}`);
  } else if (!fs.existsSync(file)) {
    console.log(`unset: ${file} did not exist; no change.`);
  } else {
    console.log(`unset: no ${ENV_VAR} export line found in ${file}; no change.`);
  }
  console.log("Restart your shell so the env var change takes effect.");
}

function validateGlobalDir(target: string): string[] {
  const errors: string[] = [];
  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
    errors.push(`Missing global config directory: ${target}`);
    return errors;
  }
  for (const required of ["skills", "agents", "AGENTS.md", "opencode.json.template"]) {
    const candidate = path.join(target, required);
    if (!fs.existsSync(candidate)) {
      errors.push(`Missing global/${required}: the OPENCODE_CONFIG_DIR target must contain it.`);
    }
  }
  return errors;
}

function ensureLocalConfig(target: string): void {
  const local = path.join(target, "opencode.json");
  const template = path.join(target, "opencode.json.template");
  if (!fs.existsSync(local) && fs.existsSync(template)) {
    const templateText = fs.readFileSync(template, "utf8");
    const provisioned = writeProvisionedLocalConfig(templateText);
    fs.writeFileSync(local, provisioned);
    console.log(`provisioned: global/opencode.json from opencode.json.template (portable default).`);
    console.log(`Marked machineOverride: true so validators treat local provider/MCP/permission overrides as intentional.`);
    console.log(`Edit global/opencode.json for machine-specific provider/MCP overrides; it is gitignored.`);
  }
}

function writeProvisionedLocalConfig(templateText: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(templateText);
  } catch {
    return templateText;
  }
  if (typeof parsed !== "object" || parsed == null || Array.isArray(parsed)) {
    return templateText;
  }
  const record = parsed as Record<string, unknown>;
  if (record.machineOverride === true) {
    return templateText;
  }
  record.machineOverride = true;
  return JSON.stringify(record, null, 2) + "\n";
}

function isWindows(): boolean {
  return process.platform === "win32";
}

function legacyPluginPath(): string {
  return path.join(os.homedir(), ".config", "opencode", "plugin", "session-env.ts");
}

function warnLegacyPlugin(): void {
  const legacy = legacyPluginPath();
  if (fs.existsSync(legacy)) {
    console.log("");
    console.log(`note: a legacy copy of session-env.ts exists at ${legacy}`);
    console.log("It was left by the previous copy-based installer and is still auto-discovered,");
    console.log("so it duplicates the plugin now loaded from global/plugin/. Remove it to avoid a duplicate registration:");
    console.log(`  rm "${legacy}"`);
  }
}

function samePath(a: string, b: string): boolean {
  if (isWindows()) {
    return path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();
  }
  return path.resolve(a) === path.resolve(b);
}

function currentValue(): string | undefined {
  return process.env[ENV_VAR];
}

function runCheck(): void {
  const current = currentValue();
  if (current === undefined || current.trim() === "") {
    console.log(`${ENV_VAR} is not set.`);
    console.log(`Run "npm run install:global" to point it at ${globalDir}`);
    process.exit(1);
  }
  if (samePath(current, globalDir)) {
    console.log(`configured: ${ENV_VAR}=${current}`);
    warnLegacyPlugin();
    process.exit(0);
  }
  console.log(`mismatch: ${ENV_VAR}=${current}`);
  console.log(`expected: ${ENV_VAR}=${globalDir}`);
  console.log(`Run "npm run install:global" to repoint it at this repository.`);
  process.exit(1);
}

function runPrint(): void {
  console.log(globalDir);
  console.log(`command (windows): setx ${ENV_VAR} "${globalDir}"`);
  console.log(`command (posix):   export ${ENV_VAR}="${globalDir}"`);
}

function runSet(dryRun: boolean): void {
  const errors = validateGlobalDir(globalDir);
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(error);
    }
    process.exit(1);
  }
  if (!dryRun) {
    ensureLocalConfig(globalDir);
  }

  const previous = currentValue();
  if (previous !== undefined && previous.trim() !== "" && !samePath(previous, globalDir)) {
    console.log(`note: ${ENV_VAR} was previously ${previous}; repointing at this repository.`);
  }

  if (dryRun) {
    console.log(`would set: ${ENV_VAR}=${globalDir}`);
    if (isWindows()) {
      console.log(`would run:  setx ${ENV_VAR} "${globalDir}"`);
    } else {
      console.log(`would print: export ${ENV_VAR}="${globalDir}"`);
    }
    console.log("Dry run complete. No environment variable was changed.");
    return;
  }

  if (isWindows()) {
    const measured = measuredValueLength(globalDir);
    if (measured > SETX_SAFE_LIMIT) {
      console.error(`warning: ${ENV_VAR} value is ${measured} chars; setx truncates user env vars at 1024 chars (safety limit ${SETX_SAFE_LIMIT}).`);
      console.error(`Run \`node tools/install-opencode-global.ts --print\` and apply the setx command manually.`);
      process.exit(2);
    }
    const result = spawnSync("setx", [ENV_VAR, globalDir], { encoding: "utf8" });
    if (result.status !== 0) {
      console.error(`setx failed (exit ${result.status}).`);
      if (result.stderr) {
        console.error(result.stderr);
      }
      process.exit(1);
    }
    console.log(`set: ${ENV_VAR}=${globalDir}`);
  } else {
    console.log(`Add the following line to your shell profile (~/.zshrc or ~/.bashrc):`);
    console.log(`  export ${ENV_VAR}="${globalDir}"`);
    console.log(`Then restart your shell.`);
  }

  console.log("");
  console.log("Restart OpenCode so it loads the new global config directory.");
  if (isWindows()) {
    console.log("Windows GUI apps launched from Explorer may require logoff/logon to inherit the change.");
  }
  warnLegacyPlugin();
}

function runUnset(): void {
  if (isWindows()) {
    const result = spawnSync("reg", ["delete", "HKCU\\Environment", "/F", "/V", ENV_VAR], { encoding: "utf8" });
    if (result.status === 0) {
      console.log(`removed: ${ENV_VAR} (HKCU\\Environment)`);
    } else {
      const out = `${result.stdout}${result.stderr}`;
      if (/unable to find|no such|cannot find/i.test(out)) {
        console.log(`${ENV_VAR} was not set in HKCU\\Environment.`);
      } else {
        console.error(`reg delete failed (exit ${result.status}).`);
        if (out) {
          console.error(out);
        }
        process.exit(1);
      }
    }
  } else {
    console.log(`Remove the following line from your shell profile (~/.zshrc or ~/.bashrc):`);
    console.log(`  export ${ENV_VAR}=...`);
    console.log(`Then restart your shell.`);
  }
  console.log("");
  console.log("Restart OpenCode so it stops using the repository global config directory.");
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  switch (options.mode) {
    case "check":
      runCheck();
      break;
    case "print":
      runPrint();
      break;
    case "unset":
      runUnset();
      break;
    case "persist-script":
      runPersistScript(options.scriptFile ?? "");
      break;
    case "unset-script":
      runUnsetScript(options.scriptFile ?? "");
      break;
    case "set":
      runSet(options.dryRun);
      break;
  }
}

const executedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (executedPath === fileURLToPath(import.meta.url)) {
  main();
}
