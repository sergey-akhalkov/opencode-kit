#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspectOpenCodeConfigText, sameConfigPath } from "./validators/opencode-config.ts";
import {
  GENERATED_RUNTIME_PROFILES_RELATIVE,
  PORTABLE_WORKFLOW_RUNTIME_FILES,
  ROADMAP_MISSION_PLUGIN_FILES,
  ROADMAP_MISSION_RUNTIME_FILES,
  inspectRuntimeSurfaceInstall,
  materializeRuntimeSurfaceTemplate,
  materializeRuntimeSurfaceProfile,
} from "./runtime-surface-profile.ts";

type Mode = "set" | "check" | "print" | "unset" | "persist-script" | "unset-script" | "preview-profile" | "plan-migration";

type Options = {
  mode: Mode;
  dryRun: boolean;
  scriptFile: string | null;
  profileName: string;
  explicitProfile: boolean;
};

const ENV_VAR = "OPENCODE_CONFIG_DIR";
const GLOBAL_DIR_NAME = "global";
export const SETX_SAFE_LIMIT = 900;

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const globalDir = path.resolve(repoRoot, GLOBAL_DIR_NAME);

function printUsage(): void {
  console.log(`Usage:
  npm run install:global -- [options]

Point OpenCode at this repository as a custom global configuration source. A fresh
install materializes the generated core profile and sets OPENCODE_CONFIG_DIR to
that generated root. Existing kit installs are left unchanged unless --profile is
explicit. Host-default, project, managed, explicit, or inline sources may remain
loader-visible according to current precedence.

Source: ${globalDir}
Fresh default: ${path.join(globalDir, ".runtime-profiles", "core")}

Options:
  (default)              Fresh install: materialize core and persist/print that generated path.
                         Existing kit install: leave the current path unchanged.
                         Windows persists via setx. macOS/Linux prints a safe export line only.
  --check, --audit       Exit 0 if OPENCODE_CONFIG_DIR already points at this kit global/ or a generated profile; 1 otherwise.
                         Also reports the current runtime-surface profile without changing files or env.
  --preview-profile      Preview the proposed runtime-surface profile (default core). No mutation.
  --plan-migration       Show current vs proposed profile additions/removals. No mutation.
  --profile <name>       Proposed profile for preview/plan/check (core or all). Default: core.
  --print                Preview the target path and platform command only (no mutation; not a recovery path).
  --unset                Remove the persisted OPENCODE_CONFIG_DIR value.
  --persist-script <file>  Ensure <file> contains exactly one desired "export OPENCODE_CONFIG_DIR=..." line.
                          Add --profile <name> to materialize and persist that generated profile.
  --unset-script <file>    Remove every matching "export OPENCODE_CONFIG_DIR=..." line from <file>.
  --dry-run, --what-if   Show what the default mode would do without setting anything.
  --help, -h             Show this help.

  Mode flags (--check/--audit, --print, --unset, --persist-script, --unset-script, --preview-profile,
  --plan-migration) are mutually exclusive (including aliases and repeats). --dry-run applies only to
  the default set mode. Preview, plan, and check never change config, environment, or files.

Platform behavior:
  Windows: default mode runs "setx OPENCODE_CONFIG_DIR <path>" (writes HKCU\\Environment)
    when the measured value is within ${SETX_SAFE_LIMIT} chars. Over-limit paths fail before setx;
    relocate or clone the kit to a shorter path, re-run, then verify with --check.
    Do not run setx manually for over-limit values. --print is preview-only.
  macOS/Linux: default mode prints a safe export line and does not persist.
    Use --persist-script <file> for profile convergence; verify with --check after shell restart.

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
  const options: Options = { mode: "set", dryRun: false, scriptFile: null, profileName: "core", explicitProfile: false };
  let explicitModeCount = 0;
  const assignMode = (mode: Mode): void => {
    explicitModeCount += 1;
    if (explicitModeCount > 1) {
      throw new Error(
        "Conflicting installer modes: only one of --check/--audit, --print, --unset, --persist-script, --unset-script, --preview-profile, --plan-migration is allowed (including aliases and repeats).",
      );
    }
    options.mode = mode;
  };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else if (arg === "--dry-run" || arg === "--what-if") {
      options.dryRun = true;
    } else if (arg === "--check" || arg === "--audit") {
      assignMode("check");
    } else if (arg === "--preview-profile") {
      assignMode("preview-profile");
    } else if (arg === "--plan-migration") {
      assignMode("plan-migration");
    } else if (arg === "--profile") {
      options.explicitProfile = true;
      options.profileName = readValue(args, index, arg);
      index++;
    } else if (arg.startsWith("--profile=")) {
      options.explicitProfile = true;
      options.profileName = arg.slice("--profile=".length);
    } else if (arg === "--print") {
      assignMode("print");
    } else if (arg === "--unset") {
      assignMode("unset");
    } else if (arg === "--persist-script") {
      assignMode("persist-script");
      options.scriptFile = readValue(args, index, arg);
      index++;
    } else if (arg.startsWith("--persist-script=")) {
      assignMode("persist-script");
      options.scriptFile = arg.slice("--persist-script=".length);
    } else if (arg === "--unset-script") {
      assignMode("unset-script");
      options.scriptFile = readValue(args, index, arg);
      index++;
    } else if (arg.startsWith("--unset-script=")) {
      assignMode("unset-script");
      options.scriptFile = arg.slice("--unset-script=".length);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (options.dryRun && options.mode !== "set") {
    throw new Error("--dry-run only applies to the default (set) mode.");
  }
  if (
    (options.mode === "persist-script" || options.mode === "unset-script") &&
    (options.scriptFile == null || options.scriptFile.trim() === "")
  ) {
    throw new Error(`${options.mode} requires a <file> argument.`);
  }
  if (options.profileName !== "core" && options.profileName !== "all") {
    throw new Error("--profile must be core or all.");
  }
  return options;
}

export function measuredValueLength(value: string): number {
  return value.length + ENV_VAR.length + 1;
}

/** Reject path values that cannot be represented safely on a single POSIX profile line. */
function assertSafeExportPathValue(value: string): void {
  if (value.includes("\0") || value.includes("\r") || value.includes("\n")) {
    throw new Error(`${ENV_VAR} path must not contain NUL, CR, or LF characters.`);
  }
}

/**
 * Deterministic POSIX shell-safe standalone export assignment using single-quote literal encoding.
 * Embedded single quotes use the standard close-quote, escaped-quote, reopen-quote sequence.
 */
export function buildExportLine(value: string): string {
  assertSafeExportPathValue(value);
  const encoded = value.replace(/'/g, `'\\''`);
  return `export ${ENV_VAR}='${encoded}'`;
}

/** Unquoted path tokens accepted as supported standalone assignment values (no shell metacharacters). */
const SAFE_UNQUOTED_EXPORT_VALUE = /^[A-Za-z0-9_./:@%+=-]+$/;

type ExportLineClassification = "supported" | "unrelated" | "ambiguous";

/**
 * Classify a profile line relative to `export <envName>=...`.
 * Supported: common unquoted safe token, single-quoted fragments (including generated quote-escape),
 * or double-quoted legacy form, with reasonable leading/trailing whitespace and no trailing shell content.
 * Ambiguous: starts as this env export assignment but has unsupported/unterminated/trailing content.
 */
export function classifyExportLine(line: string, envName: string): ExportLineClassification {
  const trimmed = line.trim();
  if (trimmed.includes("\n") || trimmed.includes("\r")) {
    return "unrelated";
  }
  const prefix = `export ${envName}=`;
  if (!trimmed.startsWith(prefix)) {
    // Fail closed when the line clearly targets this env export with unsupported spacing/syntax.
    if (/^export\s+/.test(trimmed)) {
      const afterExport = trimmed.slice("export".length).trimStart();
      if (afterExport === envName || afterExport.startsWith(`${envName}=`) || afterExport.startsWith(`${envName} `)) {
        return "ambiguous";
      }
    }
    return "unrelated";
  }

  let i = prefix.length;
  if (i >= trimmed.length) {
    return "ambiguous";
  }

  const first = trimmed[i];
  if (first === "'") {
    // Single-quoted fragments, including the generated close/escape/reopen sequence: '\''
    i += 1;
    let closed = false;
    while (i < trimmed.length) {
      if (trimmed.startsWith(`'\\''`, i)) {
        i += 4;
        continue;
      }
      if (trimmed[i] === "'") {
        i += 1;
        closed = true;
        break;
      }
      i += 1;
    }
    if (!closed || i !== trimmed.length) {
      return "ambiguous";
    }
    return "supported";
  }

  if (first === '"') {
    i += 1;
    let closed = false;
    while (i < trimmed.length) {
      if (trimmed[i] === "\\" && i + 1 < trimmed.length) {
        i += 2;
        continue;
      }
      if (trimmed[i] === '"') {
        i += 1;
        closed = true;
        break;
      }
      i += 1;
    }
    if (!closed || i !== trimmed.length) {
      return "ambiguous";
    }
    return "supported";
  }

  // Unquoted token: entire remainder must be a safe path token with no trailing shell syntax.
  const remainder = trimmed.slice(prefix.length);
  if (remainder === "" || /\s/.test(remainder) || !SAFE_UNQUOTED_EXPORT_VALUE.test(remainder)) {
    return "ambiguous";
  }
  return "supported";
}

export function isExportLineFor(line: string, envName: string): boolean {
  return classifyExportLine(line, envName) === "supported";
}

type LineRecord = {
  /** Line body without its terminator. */
  text: string;
  /** Exact original terminator: "\n", "\r\n", or "" when the final line has no terminator. */
  ending: string;
};

/** Split profile text into records that preserve each line's exact terminator bytes. */
function splitLineRecords(content: string): LineRecord[] {
  const records: LineRecord[] = [];
  let start = 0;
  let index = 0;
  while (index < content.length) {
    if (content[index] === "\r" && content[index + 1] === "\n") {
      records.push({ text: content.slice(start, index), ending: "\r\n" });
      index += 2;
      start = index;
      continue;
    }
    if (content[index] === "\n") {
      records.push({ text: content.slice(start, index), ending: "\n" });
      index += 1;
      start = index;
      continue;
    }
    index += 1;
  }
  if (start < content.length) {
    records.push({ text: content.slice(start), ending: "" });
  }
  return records;
}

function joinLineRecords(records: LineRecord[]): string {
  let out = "";
  for (const record of records) {
    out += record.text + record.ending;
  }
  return out;
}

/** First observed CRLF/LF terminator in the file; default LF when none observed. */
function preferredLineEnding(records: LineRecord[]): string {
  for (const record of records) {
    if (record.ending === "\r\n" || record.ending === "\n") {
      return record.ending;
    }
  }
  return "\n";
}

function assertNoAmbiguousExportLines(records: LineRecord[], envName: string, file: string): void {
  for (const record of records) {
    if (classifyExportLine(record.text, envName) === "ambiguous") {
      throw new Error(
        `Refusing to modify ${path.basename(file)}: found an ambiguous ${envName} assignment line; fix or remove it manually before re-running.`,
      );
    }
  }
}

/** Strict UTF-8 decode; invalid sequences fail before any target mutation. */
function decodeUtf8Strict(bytes: Buffer, label: string): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`Refusing to modify ${label}: file is not valid UTF-8.`);
  }
}

/**
 * Failure-atomic same-directory replacement for profiles and local config provisioning:
 * exclusive temp create → full write → fsync → close → raw preimage/absence re-check → rename.
 * Rejects symlink/non-regular targets. Preserves original bytes on failure and cleans temp.
 * Residual: unavoidable narrow race between final preimage check and rename.
 */
function replaceFileAtomically(
  file: string,
  nextBytes: Buffer,
  expectedPreimage: Buffer | null,
): void {
  const label = path.basename(file);
  let existingMode: number | undefined;
  if (expectedPreimage == null) {
    if (fs.existsSync(file)) {
      throw new Error(`Refusing to create ${label}: target appeared before write.`);
    }
  } else {
    let st: fs.Stats;
    try {
      st = fs.lstatSync(file);
    } catch {
      throw new Error(`Refusing to modify ${label}: target disappeared before write.`);
    }
    if (st.isSymbolicLink()) {
      throw new Error(`Refusing to modify ${label}: target is a symbolic link.`);
    }
    if (!st.isFile()) {
      throw new Error(`Refusing to modify ${label}: target is not a regular file.`);
    }
    existingMode = st.mode;
  }

  const directory = path.dirname(path.resolve(file));
  const temporary = path.join(
    directory,
    `.${path.basename(file)}.${process.pid}.${Date.now()}.${Math.floor(Math.random() * 1e9)}.tmp`,
  );
  let fd: number | undefined;
  try {
    fd = fs.openSync(temporary, "wx");
    fs.writeFileSync(fd, nextBytes);
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = undefined;

    if (expectedPreimage == null) {
      if (fs.existsSync(file)) {
        throw new Error(`Refusing to create ${label}: target appeared before replacement.`);
      }
    } else {
      let current: Buffer;
      try {
        const st = fs.lstatSync(file);
        if (st.isSymbolicLink() || !st.isFile()) {
          throw new Error(`Refusing to modify ${label}: target is no longer a regular file.`);
        }
        current = fs.readFileSync(file);
      } catch (error) {
        if (error instanceof Error && error.message.startsWith("Refusing to modify")) {
          throw error;
        }
        throw new Error(`Refusing to modify ${label}: target disappeared or became unreadable before replacement.`);
      }
      if (!current.equals(expectedPreimage)) {
        throw new Error(`Refusing to modify ${label}: concurrent change detected before replacement.`);
      }
    }

    fs.renameSync(temporary, file);
    if (existingMode != null) {
      try {
        fs.chmodSync(file, existingMode);
      } catch {
        // Best-effort mode preservation; replacement already succeeded.
      }
    }
  } catch (error) {
    if (fd != null) {
      try {
        fs.closeSync(fd);
      } catch {
        // ignore close errors during cleanup
      }
    }
    try {
      if (fs.existsSync(temporary)) {
        fs.rmSync(temporary, { force: true });
      }
    } catch {
      // best-effort temp cleanup
    }
    throw error;
  }
}

export function appendExportLine(file: string, envLine: string, envName: string): { appended: boolean; totalLines: number } {
  let preimage: Buffer | null = null;
  let existingText = "";
  if (fs.existsSync(file)) {
    const st = fs.lstatSync(file);
    if (st.isSymbolicLink()) {
      throw new Error(`Refusing to modify ${path.basename(file)}: target is a symbolic link.`);
    }
    if (!st.isFile()) {
      throw new Error(`Refusing to modify ${path.basename(file)}: target is not a regular file.`);
    }
    preimage = fs.readFileSync(file);
    existingText = decodeUtf8Strict(preimage, path.basename(file));
  }
  const records = splitLineRecords(existingText);
  assertNoAmbiguousExportLines(records, envName, file);

  const supportedIndexes: number[] = [];
  for (let index = 0; index < records.length; index++) {
    if (isExportLineFor(records[index].text, envName)) {
      supportedIndexes.push(index);
    }
  }
  if (supportedIndexes.length === 1 && records[supportedIndexes[0]].text === envLine) {
    return { appended: false, totalLines: records.length };
  }

  const kept: LineRecord[] = [];
  let placed = false;
  for (let index = 0; index < records.length; index++) {
    const record = records[index];
    if (isExportLineFor(record.text, envName)) {
      if (!placed) {
        // Replace first supported assignment text; keep that record's exact terminator.
        kept.push({ text: envLine, ending: record.ending });
        placed = true;
      }
      // Drop duplicate supported assignment records entirely (including their endings).
      continue;
    }
    kept.push(record);
  }

  if (!placed) {
    const ending = preferredLineEnding(records);
    if (kept.length > 0 && kept[kept.length - 1].ending === "") {
      // File lacks a trailing separator; add one only so the new line can follow.
      kept[kept.length - 1] = { text: kept[kept.length - 1].text, ending };
    }
    kept.push({ text: envLine, ending });
  }

  const nextBytes = Buffer.from(joinLineRecords(kept), "utf8");
  replaceFileAtomically(file, nextBytes, preimage);
  return { appended: true, totalLines: kept.length };
}

export function removeExportLine(file: string, envName: string): { removed: boolean; totalLines: number } {
  if (!fs.existsSync(file)) {
    return { removed: false, totalLines: 0 };
  }
  const st = fs.lstatSync(file);
  if (st.isSymbolicLink()) {
    throw new Error(`Refusing to modify ${path.basename(file)}: target is a symbolic link.`);
  }
  if (!st.isFile()) {
    throw new Error(`Refusing to modify ${path.basename(file)}: target is not a regular file.`);
  }
  const preimage = fs.readFileSync(file);
  const existingText = decodeUtf8Strict(preimage, path.basename(file));
  const records = splitLineRecords(existingText);
  assertNoAmbiguousExportLines(records, envName, file);
  const kept: LineRecord[] = [];
  let removed = false;
  for (const record of records) {
    if (isExportLineFor(record.text, envName)) {
      removed = true;
      continue;
    }
    kept.push(record);
  }
  const totalLines = kept.length;
  if (!removed) {
    return { removed: false, totalLines };
  }
  replaceFileAtomically(file, Buffer.from(joinLineRecords(kept), "utf8"), preimage);
  return { removed: true, totalLines };
}

function runPersistScript(file: string, profileName: string, explicitProfile: boolean): void {
  const errors = validateGlobalDir(globalDir);
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(error);
    }
    process.exit(1);
  }
  const targetDir = explicitProfile ? generatedProfileRoot(profileName) : globalDir;
  if (explicitProfile) {
    if (!fs.existsSync(targetDir)) {
      assertSupportedTemplate(path.join(globalDir, "opencode.json.template"));
      materializeRuntimeSurfaceProfile({ profileName, root: repoRoot, targetRoot: targetDir });
      ensureLocalInstructions(targetDir);
    }
    const generatedErrors = validateGeneratedProfile(targetDir, profileName as "all" | "core");
    if (generatedErrors.length > 0) throw new Error(generatedErrors.join("\n"));
  }
  const envLine = buildExportLine(targetDir);
  const result = appendExportLine(file, envLine, ENV_VAR);
  if (result.appended) {
    console.log(`persisted: ensured exactly one ${envLine} in ${file}`);
  } else {
    console.log(`persisted: ${file} already contains exactly one desired ${ENV_VAR} export line; no change.`);
  }
  console.log("Restart your shell so the new env var is loaded.");
}

function runUnsetScript(file: string): void {
  const result = removeExportLine(file, ENV_VAR);
  if (result.removed) {
    console.log(`unset: removed every matching ${ENV_VAR} export line from ${file}`);
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
  for (const required of ["skills", "agents", "bin", "AGENTS.md", "principles-of-work.md", "package.json", "opencode.json.template", "opencode.local.instructions.example.md"]) {
    const candidate = path.join(target, required);
    if (!fs.existsSync(candidate)) {
      errors.push(`Missing global/${required}: the OPENCODE_CONFIG_DIR target must contain it.`);
    }
  }
  for (const required of PORTABLE_WORKFLOW_RUNTIME_FILES) {
    const candidate = path.join(target, ...required.split("/"));
    if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) {
      errors.push(`Missing global/${required}: portable project workflow tooling is incomplete.`);
    }
  }
  return errors;
}

function validateGeneratedProfile(target: string, profileName: "all" | "core"): string[] {
  const errors: string[] = [];
  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
    return [`Missing generated ${profileName} profile: ${target}`];
  }
  for (const required of [".runtime-surface.json", "opencode.json", "opencode.local.instructions.md"]) {
    const candidate = path.join(target, required);
    if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) {
      errors.push(`Missing generated ${profileName}/${required}.`);
    }
  }
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(target, ".runtime-surface.json"), "utf8")) as Record<string, unknown>;
    if (manifest.profile !== profileName || manifest.schemaVersion !== 1 || !Array.isArray(manifest.entries)) {
      errors.push(`Generated ${profileName} manifest identity is invalid.`);
    }
  } catch {
    errors.push(`Generated ${profileName} manifest is unreadable or invalid.`);
  }
  let config: Record<string, unknown> | null = null;
  try {
    config = assertSupportedLocalConfig(path.join(target, "opencode.json"));
    const rendered = JSON.stringify(config);
    if (rendered.includes("__OPENCODE_") || rendered.includes(".staging-")) {
      errors.push(`Generated ${profileName} config contains an unresolved or staging path.`);
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : `Generated ${profileName} config is invalid.`);
  }
  if (profileName === "all") {
    for (const relative of ROADMAP_MISSION_RUNTIME_FILES) {
      const candidate = path.join(target, ...relative.split("/"));
      if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) {
        errors.push(`Missing generated all/${relative}.`);
      }
    }
    const plugins = Array.isArray(config?.plugin) ? config.plugin : [];
    for (const relative of ROADMAP_MISSION_PLUGIN_FILES) {
      const expected = path.join(target, ...relative.split("/"));
      const exact = plugins.filter((entry) => {
        const source = typeof entry === "string" ? entry : Array.isArray(entry) && typeof entry[0] === "string" ? entry[0] : null;
        if (source == null || !source.startsWith("file:")) return false;
        try {
          return sameConfigPath(fileURLToPath(source), expected);
        } catch {
          return false;
        }
      });
      if (exact.length !== 1) errors.push(`Generated all config must load ${relative} exactly once.`);
    }
  }
  return errors;
}

function assertSupportedLocalConfig(file: string): Record<string, unknown> {
  let text: string;
  try {
    text = decodeUtf8Strict(fs.readFileSync(file), "opencode.json");
  } catch {
    throw new Error(`Existing global/opencode.json is not valid UTF-8; fix or remove it before reinstalling.`);
  }
  const inspection = inspectOpenCodeConfigText(text);
  if (inspection.code === "parse_error" || inspection.code === "non_object_root") {
    throw new Error(`Existing global/opencode.json is invalid; fix or remove it before reinstalling.`);
  }
  if (inspection.code === "unsupported_machine_override") {
    throw new Error(
      `Existing global/opencode.json contains unsupported field 'machineOverride'; remove it before restarting OpenCode or reinstalling.`,
    );
  }
  return inspection.value;
}

function assertSupportedTemplate(templatePath: string): Buffer {
  if (!fs.existsSync(templatePath) || !fs.statSync(templatePath).isFile()) {
    throw new Error(`Missing global/opencode.json.template; cannot provision local config.`);
  }
  const templateBytes = fs.readFileSync(templatePath);
  let templateText: string;
  try {
    templateText = decodeUtf8Strict(templateBytes, "opencode.json.template");
  } catch {
    throw new Error(`global/opencode.json.template is not valid UTF-8; fix or remove it before reinstalling.`);
  }
  const inspection = inspectOpenCodeConfigText(templateText);
  if (inspection.code === "parse_error" || inspection.code === "non_object_root") {
    throw new Error(`global/opencode.json.template is invalid; fix or remove it before reinstalling.`);
  }
  if (inspection.code === "unsupported_machine_override") {
    throw new Error(
      `global/opencode.json.template contains unsupported field 'machineOverride'; remove it before reinstalling.`,
    );
  }
  // Return original bytes so provisioning preserves exact template encoding.
  return templateBytes;
}

function materializeTemplate(templateBytes: Buffer, target: string): Buffer {
  const templateText = decodeUtf8Strict(templateBytes, "opencode.json.template");
  return Buffer.from(materializeRuntimeSurfaceTemplate(templateText, target), "utf8");
}

function inspectExistingSourceConfig(): void {
  const local = path.join(globalDir, "opencode.json");
  if (!fs.existsSync(local)) {
    return;
  }
  const config = assertSupportedLocalConfig(local);
  const expectedPrinciples = path.join(globalDir, "principles-of-work.md");
  const expected = path.join(globalDir, "opencode.local.instructions.md");
  const instructions = Array.isArray(config.instructions) ? config.instructions : [];
  const principlesConfigured = instructions.some(
    (instruction) => typeof instruction === "string" && path.isAbsolute(instruction) && sameConfigPath(instruction, expectedPrinciples),
  );
  if (!principlesConfigured) {
    console.log(
      `note: preserved existing global/opencode.json; its instructions do not reference ${expectedPrinciples}. Add that absolute path to load the canonical working principles.`,
    );
  }
  const configured = instructions.some(
    (instruction) => typeof instruction === "string" && path.isAbsolute(instruction) && sameConfigPath(instruction, expected),
  );
  if (!configured) {
    console.log(
      `note: preserved existing global/opencode.json; its instructions do not reference ${expected}. Add that absolute path to load machine-local preferences.`,
    );
  }
}

function ensureLocalConfig(target: string): void {
  const local = path.join(target, "opencode.json");
  const template = path.join(target, "opencode.json.template");
  if (fs.existsSync(local)) {
    const config = assertSupportedLocalConfig(local);
    const expectedPrinciples = path.join(target, "principles-of-work.md");
    const expected = path.join(target, "opencode.local.instructions.md");
    const instructions = Array.isArray(config.instructions) ? config.instructions : [];
    const principlesConfigured = instructions.some(
      (instruction) => typeof instruction === "string" && path.isAbsolute(instruction) && sameConfigPath(instruction, expectedPrinciples),
    );
    if (!principlesConfigured) {
      console.log(
        `note: preserved existing global/opencode.json; its instructions do not reference ${expectedPrinciples}. Add that absolute path to load the canonical working principles.`,
      );
    }
    const configured = instructions.some(
      (instruction) => typeof instruction === "string" && path.isAbsolute(instruction) && sameConfigPath(instruction, expected),
    );
    if (!configured) {
      console.log(
        `note: preserved existing global/opencode.json; its instructions do not reference ${expected}. Add that absolute path to load machine-local preferences.`,
      );
    }
    return;
  }
  if (!fs.existsSync(template)) {
    return;
  }
  const templateBytes = materializeTemplate(assertSupportedTemplate(template), target);
  replaceFileAtomically(local, templateBytes, null);
  console.log(`provisioned: global/opencode.json from the materialized opencode.json.template default.`);
  console.log(`Edit global/opencode.json for machine-specific provider/MCP overrides; it is gitignored.`);
}

function ensureLocalInstructions(target: string): void {
  const local = path.join(target, "opencode.local.instructions.md");
  const example = path.join(target, "opencode.local.instructions.example.md");
  if (fs.existsSync(local)) {
    const stat = fs.lstatSync(local);
    if (!stat.isFile() || stat.isSymbolicLink()) {
      throw new Error("Existing global/opencode.local.instructions.md must be a regular non-symlink file.");
    }
    return;
  }
  if (!fs.existsSync(example) || !fs.statSync(example).isFile()) {
    throw new Error("Missing global/opencode.local.instructions.example.md; cannot provision personal instructions.");
  }
  replaceFileAtomically(local, fs.readFileSync(example), null);
  console.log("provisioned: global/opencode.local.instructions.md from the portable example.");
  console.log("Edit the gitignored file for personal language, coordination, and local model preferences.");
}

function isWindows(): boolean {
  return process.platform === "win32";
}

function currentValue(): string | undefined {
  return process.env[ENV_VAR];
}

function renderRuntimeSurfacePlan(profileName: string): ReturnType<typeof inspectRuntimeSurfaceInstall> {
  return inspectRuntimeSurfaceInstall({
    configDir: currentValue(),
    proposedName: profileName,
    root: repoRoot,
  });
}

function printRuntimeSurfacePlan(plan: ReturnType<typeof inspectRuntimeSurfaceInstall>, detail: "owners" | "diff"): void {
  console.log(`current profile: ${plan.currentKind}`);
  if (plan.currentRoot != null) {
    console.log(`current root: ${plan.currentRoot}`);
  }
  console.log(`proposed profile: ${plan.proposedName}`);
  if (detail === "owners") {
    console.log(`proposed owners (${plan.proposedOwners.length}): ${plan.proposedOwners.join(", ") || "none"}`);
  } else {
    console.log(`additions (${plan.additions.length}): ${plan.additions.join(", ") || "none"}`);
    console.log(`removals (${plan.removals.length}): ${plan.removals.join(", ") || "none"}`);
  }
  console.log("No file or environment value was changed.");
}

function runPreviewProfile(profileName: string): void {
  printRuntimeSurfacePlan(renderRuntimeSurfacePlan(profileName), "owners");
}

function runPlanMigration(profileName: string): void {
  printRuntimeSurfacePlan(renderRuntimeSurfacePlan(profileName), "diff");
}

function runCheck(profileName: string): void {
  const current = currentValue();
  if (current === undefined || current.trim() === "") {
    console.log(`${ENV_VAR} is not set.`);
    console.log(`Run "npm run install:global" to point it at ${globalDir}`);
    printRuntimeSurfacePlan(renderRuntimeSurfacePlan(profileName), "diff");
    process.exit(1);
  }
  if (
    sameConfigPath(current, globalDir) ||
    sameConfigPath(current, generatedProfileRoot("core")) ||
    sameConfigPath(current, generatedProfileRoot("all"))
  ) {
    const generatedProfile = sameConfigPath(current, generatedProfileRoot("all"))
      ? "all"
      : sameConfigPath(current, generatedProfileRoot("core")) ? "core" : null;
    if (generatedProfile != null) {
      const errors = validateGeneratedProfile(path.resolve(current), generatedProfile);
      if (errors.length > 0) {
        for (const error of errors) console.error(error);
        process.exit(1);
      }
    }
    const local = path.join(globalDir, "opencode.json");
    if (fs.existsSync(local)) {
      try {
        assertSupportedLocalConfig(local);
      } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    }
    console.log(`configured: ${ENV_VAR}=${current}`);
    printRuntimeSurfacePlan(renderRuntimeSurfacePlan(profileName), "diff");
    process.exit(0);
  }
  console.log(`mismatch: ${ENV_VAR}=${current}`);
  console.log(`expected: ${ENV_VAR}=${globalDir}`);
  console.log(`Run "npm run install:global" to repoint it at this repository.`);
  printRuntimeSurfacePlan(renderRuntimeSurfacePlan(profileName), "diff");
  process.exit(1);
}

function runPrint(profileName: string, explicitProfile: boolean): void {
  const targetDir = explicitProfile ? generatedProfileRoot(profileName) : globalDir;
  console.log(targetDir);
  console.log(`command (windows): setx ${ENV_VAR} "${targetDir}"`);
  console.log(`command (posix):   ${buildExportLine(targetDir)}`);
}

function generatedProfileRoot(profileName: string): string {
  return path.join(repoRoot, ...GENERATED_RUNTIME_PROFILES_RELATIVE.split("/"), profileName);
}

function isExistingKitInstall(value: string | undefined): boolean {
  if (value == null || value.trim() === "") {
    return false;
  }
  if (sameConfigPath(value, globalDir)) {
    return true;
  }
  return sameConfigPath(value, generatedProfileRoot("core")) || sameConfigPath(value, generatedProfileRoot("all"));
}

function resolveSetTarget(profileName: string, explicitProfile: boolean): {
  keepExisting: boolean;
  materialize: boolean;
  profileName: string;
  targetDir: string;
} {
  const previous = currentValue();
  if (explicitProfile) {
    return {
      keepExisting: false,
      materialize: true,
      profileName,
      targetDir: generatedProfileRoot(profileName),
    };
  }
  if (isExistingKitInstall(previous)) {
    return {
      keepExisting: true,
      materialize: false,
      profileName: "core",
      targetDir: path.resolve(previous!),
    };
  }
  return {
    keepExisting: false,
    materialize: true,
    profileName: "core",
    targetDir: generatedProfileRoot("core"),
  };
}

function runSet(dryRun: boolean, profileName: string, explicitProfile: boolean): void {
  const errors = validateGlobalDir(globalDir);
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(error);
    }
    process.exit(1);
  }
  const resolved = resolveSetTarget(profileName, explicitProfile);
  const targetDir = resolved.targetDir;
  if (!dryRun) {
    assertSupportedTemplate(path.join(globalDir, "opencode.json.template"));
    inspectExistingSourceConfig();
    ensureLocalInstructions(globalDir);
  }
  if (resolved.materialize && !dryRun) {
    materializeRuntimeSurfaceProfile({
      profileName: resolved.profileName,
      root: repoRoot,
      targetRoot: targetDir,
    });
    ensureLocalInstructions(targetDir);
  }

  const previous = currentValue();
  if (!resolved.keepExisting && previous !== undefined && previous.trim() !== "" && !sameConfigPath(previous, targetDir)) {
    console.log(`note: ${ENV_VAR} was previously ${previous}; repointing at this repository.`);
  }

  if (resolved.keepExisting) {
    console.log(`keeping existing: ${ENV_VAR}=${targetDir}`);
    console.log("No file or environment value was changed.");
    return;
  }

  if (dryRun) {
    if (resolved.materialize) {
      console.log(`would materialize profile ${resolved.profileName} at ${targetDir}`);
    }
    console.log(`would set: ${ENV_VAR}=${targetDir}`);
    if (isWindows()) {
      console.log(`would run:  setx ${ENV_VAR} "${targetDir}"`);
    } else {
      console.log(`would print: ${buildExportLine(targetDir)}`);
    }
    console.log("Dry run complete. No environment variable was changed.");
    return;
  }

  if (isWindows()) {
    const measured = measuredValueLength(targetDir);
    if (measured > SETX_SAFE_LIMIT) {
      console.error(
        `error: ${ENV_VAR} value is ${measured} chars; setx truncates user env vars at 1024 chars (safety limit ${SETX_SAFE_LIMIT}).`,
      );
      console.error(
        "Relocate or clone this kit to a shorter path, re-run install:global, then verify with --check. Do not run setx manually with this over-limit path.",
      );
      console.error("--print is preview-only and is not a safe recovery path for over-limit values.");
      process.exit(2);
    }
    const result = spawnSync("setx", [ENV_VAR, targetDir], { encoding: "utf8" });
    if (result.status !== 0) {
      console.error(`setx failed (exit ${result.status}).`);
      if (result.stderr) {
        console.error(result.stderr);
      }
      process.exit(1);
    }
    console.log(`set: ${ENV_VAR}=${targetDir}`);
  } else {
    console.log(`Default mode on macOS/Linux does not persist. Safe export line (preview only):`);
    console.log(`  ${buildExportLine(targetDir)}`);
    console.log(`To persist, run with --persist-script <file> --profile ${resolved.profileName} (for example ~/.bashrc or ~/.zshrc), restart the shell, then verify with --check.`);
  }

  console.log("");
  console.log("Restart OpenCode so it loads the kit custom config directory alongside other documented sources.");
  if (isWindows()) {
    console.log("Windows GUI apps launched from Explorer may require logoff/logon to inherit the change.");
  }
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
  try {
    const options = parseArgs(process.argv.slice(2));
    switch (options.mode) {
      case "check":
        runCheck(options.profileName);
        break;
      case "preview-profile":
        runPreviewProfile(options.profileName);
        break;
      case "plan-migration":
        runPlanMigration(options.profileName);
        break;
      case "print":
        runPrint(options.profileName, options.explicitProfile);
        break;
      case "unset":
        runUnset();
        break;
      case "persist-script":
        runPersistScript(options.scriptFile ?? "", options.profileName, options.explicitProfile);
        break;
      case "unset-script":
        runUnsetScript(options.scriptFile ?? "");
        break;
      case "set":
        runSet(options.dryRun, options.profileName, options.explicitProfile);
        break;
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

const executedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (executedPath === fileURLToPath(import.meta.url)) {
  main();
}
