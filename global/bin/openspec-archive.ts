#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { commandExitCode, formatArgv, runPortableCommand, type PortableCommandResult } from "./portable-process.ts";
import { archiveEvidenceBlocker, resolveOwnershipEnforcement } from "./openspec-change/gate.ts";

type Options = {
  root: string;
  change: string;
  openspec: string;
  store?: string;
  validationArgv?: string[];
  validationNotApplicable?: string;
};

type OpenSpecStatus = {
  changeRoot?: unknown;
  artifacts?: Array<{ id?: unknown; status?: unknown }>;
  artifactPaths?: {
    tasks?: { existingOutputPaths?: unknown };
  };
};

type ArchiveResult = {
  archive?: {
    change?: unknown;
    archivedAs?: unknown;
    path?: unknown;
    specsUpdated?: unknown;
    totals?: unknown;
  } | null;
  status?: Array<{ severity?: unknown; code?: unknown; message?: unknown; fix?: unknown }>;
};

class ArchiveFailure extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode = 1) {
    super(message);
    this.name = "ArchiveFailure";
    this.exitCode = exitCode;
  }
}

function usage(): string {
  return [
    "Usage:",
    "  node openspec-archive.ts --root <project> --change <id> [--store <id>] [--openspec <executable>] -- <validation-command> [args...]",
    "  node openspec-archive.ts --root <project> --change <id> --validation-not-applicable <reason>",
  ].join("\n");
}

function requiredValue(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value == null || value.trim() === "" || value === "--") {
    throw new ArchiveFailure(`Missing value for ${option}.`, 2);
  }
  return value;
}

function safeId(value: string, label: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value) || value === "." || value === "..") {
    throw new ArchiveFailure(`${label} must be a safe identifier.`, 2);
  }
  return value;
}

function parseArgs(args: string[]): Options {
  let root = "";
  let change = "";
  let openspec = "openspec";
  let store: string | undefined;
  let validationNotApplicable: string | undefined;
  let validationArgv: string[] | undefined;

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--") {
      validationArgv = args.slice(index + 1);
      break;
    }
    if (arg === "--root") {
      root = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--change") {
      change = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--store") {
      store = safeId(requiredValue(args, index, arg), "Store id");
      index++;
    } else if (arg === "--openspec") {
      openspec = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--validation-not-applicable") {
      validationNotApplicable = requiredValue(args, index, arg).trim();
      index++;
    } else if (arg === "--help" || arg === "-h") {
      console.log(usage());
      process.exit(0);
    } else {
      throw new ArchiveFailure(`Unknown option: ${arg}`, 2);
    }
  }

  if (root.trim() === "") throw new ArchiveFailure("Missing required --root <project>.", 2);
  if (change.trim() === "") throw new ArchiveFailure("Missing required --change <id>.", 2);
  if (validationArgv != null && validationNotApplicable != null) {
    throw new ArchiveFailure("Use either validation argv after -- or --validation-not-applicable, not both.", 2);
  }
  if ((validationArgv == null || validationArgv.length === 0) && validationNotApplicable == null) {
    throw new ArchiveFailure("Project validation is required; provide argv after -- or an explicit --validation-not-applicable reason.", 2);
  }
  if (validationNotApplicable != null && validationNotApplicable.length < 8) {
    throw new ArchiveFailure("--validation-not-applicable requires a concrete reason of at least 8 characters.", 2);
  }

  return {
    root: path.resolve(root),
    change: safeId(change, "Change id"),
    openspec,
    ...(store == null ? {} : { store }),
    ...(validationArgv == null ? {} : { validationArgv }),
    ...(validationNotApplicable == null ? {} : { validationNotApplicable }),
  };
}

function printFailureOutput(result: PortableCommandResult): void {
  if (result.stdout !== "") process.stdout.write(result.stdout);
  if (result.stderr !== "") process.stderr.write(result.stderr);
}

function runCaptured(root: string, argv: string[], label: string): string {
  console.error(`==> ${label}: ${formatArgv(argv)}`);
  const result = runPortableCommand(root, argv, { capture: true });
  if (result.error != null) {
    throw new ArchiveFailure(`Failed to start ${label}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    printFailureOutput(result);
    const signal = result.signal == null ? "" : ` (signal ${result.signal})`;
    throw new ArchiveFailure(`${label} failed with exit ${String(result.status)}${signal}.`, commandExitCode(result));
  }
  return result.stdout;
}

function parseJson<T>(text: string, label: string): T {
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new ArchiveFailure(`${label} returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function assertRegularContainedFile(file: string, container: string, label: string): void {
  const resolved = path.resolve(file);
  const relative = path.relative(path.resolve(container), resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new ArchiveFailure(`${label} escapes the resolved change root.`);
  }
  let stat: fs.Stats;
  try {
    stat = fs.lstatSync(resolved);
  } catch {
    throw new ArchiveFailure(`${label} is missing: ${resolved}`);
  }
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new ArchiveFailure(`${label} must be a regular non-symlink file: ${resolved}`);
  }
}

function taskCounts(text: string): { checked: number; unchecked: number; total: number } {
  let checked = 0;
  let unchecked = 0;
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*[-*]\s+\[([ xX])\]\s+/.exec(line);
    if (match == null) continue;
    if (match[1] === " ") unchecked++;
    else checked++;
  }
  return { checked, unchecked, total: checked + unchecked };
}

function storeArgs(options: Options): string[] {
  return options.store == null ? [] : ["--store", options.store];
}

function assertCompleteStatus(status: OpenSpecStatus): void {
  if (typeof status.changeRoot !== "string" || !path.isAbsolute(status.changeRoot)) {
    throw new ArchiveFailure("OpenSpec status did not return an absolute changeRoot.");
  }
  if (!Array.isArray(status.artifacts) || status.artifacts.length === 0) {
    throw new ArchiveFailure("OpenSpec status returned no artifact completion records.");
  }
  const incomplete = status.artifacts
    .filter(
      (artifact) =>
        artifact.status !== "done" && !(artifact.id === "specs" && artifact.status === "skipped"),
    )
    .map((artifact) => String(artifact.id ?? "unknown"));
  if (incomplete.length > 0) {
    throw new ArchiveFailure(`Complete archive blocked by incomplete artifact(s): ${incomplete.join(", ")}.`);
  }
  const taskPaths = status.artifactPaths?.tasks?.existingOutputPaths;
  if (!Array.isArray(taskPaths) || taskPaths.length !== 1 || typeof taskPaths[0] !== "string") {
    throw new ArchiveFailure("Complete archive requires exactly one resolved tasks artifact.");
  }
  assertRegularContainedFile(taskPaths[0], status.changeRoot, "tasks artifact");
  const counts = taskCounts(fs.readFileSync(taskPaths[0], "utf8"));
  if (counts.total === 0) {
    throw new ArchiveFailure("Complete archive requires at least one trackable task.");
  }
  if (counts.unchecked > 0) {
    throw new ArchiveFailure(`Complete archive blocked by ${counts.unchecked} unchecked task(s).`);
  }
  console.error(`==> Completion gate: artifacts=${status.artifacts.length} tasks=${counts.checked}/${counts.total}`);
}

function runProjectValidation(options: Options, phase: "before" | "after"): void {
  if (options.validationArgv == null) {
    console.error(`==> Project validation ${phase} archive: not-applicable - ${options.validationNotApplicable}`);
    return;
  }
  console.error(`==> Project validation ${phase} archive: ${formatArgv(options.validationArgv)}`);
  const result = runPortableCommand(options.root, options.validationArgv);
  if (result.error != null) {
    throw new ArchiveFailure(`Failed to start project validation ${phase} archive: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const signal = result.signal == null ? "" : ` (signal ${result.signal})`;
    throw new ArchiveFailure(`Project validation ${phase} archive failed with exit ${String(result.status)}${signal}.`, commandExitCode(result));
  }
}

function run(options: Options): void {
  if (!fs.existsSync(options.root) || !fs.statSync(options.root).isDirectory()) {
    throw new ArchiveFailure(`Project root is not a directory: ${options.root}`, 2);
  }
  const selectedStore = storeArgs(options);
  const statusText = runCaptured(options.root, [options.openspec, "status", "--change", options.change, "--json", ...selectedStore], "OpenSpec status");
  assertCompleteStatus(parseJson<OpenSpecStatus>(statusText, "OpenSpec status"));
  const evidenceBlocker = archiveEvidenceBlocker(options.root, options.change, resolveOwnershipEnforcement(options.root));
  if (evidenceBlocker != null) {
    throw new ArchiveFailure(`Complete archive blocked before official archive: ${evidenceBlocker}`);
  }

  runCaptured(options.root, [options.openspec, "validate", options.change, "--strict", ...selectedStore], "Strict change validation");
  runProjectValidation(options, "before");

  const archiveText = runCaptured(options.root, [options.openspec, "archive", options.change, "--yes", "--json", ...selectedStore], "Official OpenSpec archive");
  const archiveResult = parseJson<ArchiveResult>(archiveText, "Official OpenSpec archive");
  if (archiveResult.archive == null || archiveResult.archive.change !== options.change || typeof archiveResult.archive.path !== "string") {
    const diagnostic = archiveResult.status?.map((item) => `${String(item.code ?? "archive_error")}: ${String(item.message ?? "unknown archive failure")}`).join("; ");
    throw new ArchiveFailure(`Official OpenSpec archive returned no successful archive result${diagnostic ? `: ${diagnostic}` : "."}`);
  }

  try {
    runCaptured(options.root, [options.openspec, "validate", "--all", ...selectedStore], "Post-archive OpenSpec validation");
    runProjectValidation(options, "after");
  } catch (error) {
    throw new ArchiveFailure(`Archive moved to ${archiveResult.archive.path}, but post-archive validation failed: ${error instanceof Error ? error.message : String(error)}`, error instanceof ArchiveFailure ? error.exitCode : 1);
  }

  console.log(JSON.stringify({ schemaVersion: 1, status: "archived", ...archiveResult.archive }, null, 2));
}

if (process.argv[1] != null && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    run(parseArgs(process.argv.slice(2)));
  } catch (error) {
    const failure = error instanceof ArchiveFailure ? error : new ArchiveFailure(error instanceof Error ? error.message : String(error));
    console.error(`Archive failed: ${failure.message}`);
    process.exitCode = failure.exitCode;
  }
}
