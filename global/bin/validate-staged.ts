#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { commandExitCode, formatArgv, runPortableCommand, type PortableCommandResult } from "./portable-process.ts";

type Options = {
  root: string;
  git: string;
  tempParent: string;
  reuse: string[];
  validationArgv: string[];
};

class StagedValidationFailure extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode = 1) {
    super(message);
    this.name = "StagedValidationFailure";
    this.exitCode = exitCode;
  }
}

function usage(): string {
  return [
    "Usage:",
    "  node validate-staged.ts --root <git-root> [--git <executable>] [--temp-parent <dir>] [--reuse <ignored-relative-dir>]... -- <validation-command> [args...]",
  ].join("\n");
}

function requiredValue(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value == null || value.trim() === "" || value === "--") {
    throw new StagedValidationFailure(`Missing value for ${option}.`, 2);
  }
  return value;
}

function safeRelative(value: string, label: string): string {
  const normalized = value.replaceAll("\\", "/").replace(/^\.\//, "");
  if (normalized === "" || path.isAbsolute(normalized)) {
    throw new StagedValidationFailure(`${label} must be a non-empty relative path.`, 2);
  }
  const segments = normalized.split("/");
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    throw new StagedValidationFailure(`${label} must not contain empty, current, or parent segments: ${value}`, 2);
  }
  return normalized;
}

function parseArgs(args: string[]): Options {
  let root = "";
  let git = "git";
  let tempParent = os.tmpdir();
  const reuse: string[] = [];
  let validationArgv: string[] = [];

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--") {
      validationArgv = args.slice(index + 1);
      break;
    }
    if (arg === "--root") {
      root = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--git") {
      git = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--temp-parent") {
      tempParent = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--reuse") {
      reuse.push(safeRelative(requiredValue(args, index, arg), "Reuse path"));
      index++;
    } else if (arg === "--help" || arg === "-h") {
      console.log(usage());
      process.exit(0);
    } else {
      throw new StagedValidationFailure(`Unknown option: ${arg}`, 2);
    }
  }

  if (root.trim() === "") throw new StagedValidationFailure("Missing required --root <git-root>.", 2);
  if (validationArgv.length === 0 || validationArgv[0].trim() === "") {
    throw new StagedValidationFailure("Missing validation argv after --.", 2);
  }

  return {
    root: path.resolve(root),
    git,
    tempParent: path.resolve(tempParent),
    reuse: [...new Set(reuse)].sort(),
    validationArgv,
  };
}

function printCaptured(result: PortableCommandResult): void {
  if (result.stdout !== "") process.stdout.write(result.stdout);
  if (result.stderr !== "") process.stderr.write(result.stderr);
}

function runGitCaptured(options: Options, args: string[], label: string, input?: string): string {
  const argv = [options.git, ...args];
  const result = runPortableCommand(options.root, argv, { capture: true, ...(input == null ? {} : { input }) });
  if (result.error != null) {
    throw new StagedValidationFailure(`Failed to start ${label}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    printCaptured(result);
    throw new StagedValidationFailure(`${label} failed with exit ${String(result.status)}.`, commandExitCode(result));
  }
  return result.stdout.trim();
}

function isIgnored(options: Options, relative: string): boolean {
  const result = runPortableCommand(options.root, [options.git, "check-ignore", "--quiet", "--", relative], { capture: true });
  if (result.error != null) {
    throw new StagedValidationFailure(`Failed to check ignored reuse path ${relative}: ${result.error.message}`);
  }
  return result.status === 0;
}

function assertDirectory(file: string, label: string): void {
  let stat: fs.Stats;
  try {
    stat = fs.lstatSync(file);
  } catch {
    throw new StagedValidationFailure(`${label} is missing: ${file}`, 2);
  }
  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    throw new StagedValidationFailure(`${label} must be a real directory: ${file}`, 2);
  }
}

function assertExactGitRoot(options: Options): void {
  assertDirectory(options.root, "Git root");
  assertDirectory(options.tempParent, "Temporary parent");
  const actual = path.resolve(runGitCaptured(options, ["rev-parse", "--show-toplevel"], "Git root resolution"));
  if (actual.toLocaleLowerCase() !== options.root.toLocaleLowerCase()) {
    throw new StagedValidationFailure(`--root must be the exact Git worktree root. Resolved: ${actual}`, 2);
  }
}

function createCandidateCommit(options: Options): { tree: string; commit: string; head: string } {
  runGitCaptured(options, ["diff", "--cached", "--check"], "Staged whitespace validation");
  const unmerged = runGitCaptured(options, ["diff", "--cached", "--name-only", "--diff-filter=U"], "Unmerged index check");
  if (unmerged !== "") {
    throw new StagedValidationFailure(`Index contains unresolved paths:\n${unmerged}`);
  }
  const tree = runGitCaptured(options, ["write-tree"], "Staged tree creation");
  const head = runGitCaptured(options, ["rev-parse", "HEAD"], "HEAD resolution");
  const identityEnv = {
    ...process.env,
    GIT_AUTHOR_NAME: "Portable Staged Validation",
    GIT_AUTHOR_EMAIL: "staged-validation@example.invalid",
    GIT_AUTHOR_DATE: "2000-01-01T00:00:00Z",
    GIT_COMMITTER_NAME: "Portable Staged Validation",
    GIT_COMMITTER_EMAIL: "staged-validation@example.invalid",
    GIT_COMMITTER_DATE: "2000-01-01T00:00:00Z",
  };
  const result = runPortableCommand(options.root, [options.git, "commit-tree", tree, "-p", head], {
    capture: true,
    env: identityEnv,
    input: "portable staged validation candidate\n",
  });
  if (result.error != null || result.status !== 0) {
    printCaptured(result);
    throw new StagedValidationFailure(result.error == null ? `Candidate commit creation failed with exit ${String(result.status)}.` : `Failed to create candidate commit: ${result.error.message}`);
  }
  return { tree, commit: result.stdout.trim(), head };
}

function attachReusePaths(options: Options, candidate: string, attached: string[]): void {
  for (const relative of options.reuse) {
    const source = path.resolve(options.root, relative);
    const sourceRelative = path.relative(options.root, source);
    if (sourceRelative.startsWith("..") || path.isAbsolute(sourceRelative)) {
      throw new StagedValidationFailure(`Reuse path escapes the Git root: ${relative}`, 2);
    }
    assertDirectory(source, `Reuse path ${relative}`);
    if (!isIgnored(options, relative)) {
      throw new StagedValidationFailure(`Reuse path must be ignored by Git: ${relative}`, 2);
    }
    const destination = path.resolve(candidate, relative);
    const destinationRelative = path.relative(candidate, destination);
    if (destinationRelative.startsWith("..") || path.isAbsolute(destinationRelative)) {
      throw new StagedValidationFailure(`Reuse destination escapes the candidate: ${relative}`, 2);
    }
    if (fs.existsSync(destination)) {
      throw new StagedValidationFailure(`Reuse destination already exists in the staged candidate: ${relative}`);
    }
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.symlinkSync(source, destination, process.platform === "win32" ? "junction" : "dir");
    attached.push(destination);
  }
}

function cleanup(options: Options, temporaryRoot: string | undefined, candidate: string | undefined, attached: string[]): string[] {
  const errors: string[] = [];
  for (const link of [...attached].reverse()) {
    try {
      if (fs.existsSync(link)) fs.unlinkSync(link);
    } catch (error) {
      errors.push(`Failed to remove reuse link ${link}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (candidate != null) {
    const result = runPortableCommand(options.root, [options.git, "worktree", "remove", "--force", candidate], { capture: true });
    if (result.error != null || result.status !== 0) {
      printCaptured(result);
      errors.push(result.error == null ? `git worktree remove failed with exit ${String(result.status)}: ${candidate}` : `Failed to start git worktree remove: ${result.error.message}`);
    }
  }
  const prune = runPortableCommand(options.root, [options.git, "worktree", "prune"], { capture: true });
  if (prune.error != null || prune.status !== 0) {
    printCaptured(prune);
    errors.push(prune.error == null ? `git worktree prune failed with exit ${String(prune.status)}.` : `Failed to start git worktree prune: ${prune.error.message}`);
  }
  if (errors.length === 0 && temporaryRoot != null && fs.existsSync(temporaryRoot)) {
    try {
      fs.rmSync(temporaryRoot, { recursive: true, force: true });
    } catch (error) {
      errors.push(`Failed to remove temporary root ${temporaryRoot}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return errors;
}

function run(options: Options): void {
  assertExactGitRoot(options);
  const identity = createCandidateCommit(options);
  let temporaryRoot: string | undefined;
  let candidate: string | undefined;
  const attached: string[] = [];
  let validationFailure: StagedValidationFailure | undefined;

  try {
    temporaryRoot = fs.mkdtempSync(path.join(options.tempParent, "opencode-staged-"));
    const candidatePath = path.join(temporaryRoot, "candidate");
    console.error(`==> Staged candidate: tree=${identity.tree} commit=${identity.commit}`);
    const add = runPortableCommand(options.root, [options.git, "worktree", "add", "--detach", candidatePath, identity.commit], { capture: true });
    if (add.error != null || add.status !== 0) {
      printCaptured(add);
      throw new StagedValidationFailure(add.error == null ? `git worktree add failed with exit ${String(add.status)}.` : `Failed to start git worktree add: ${add.error.message}`);
    }
    candidate = candidatePath;
    attachReusePaths(options, candidate, attached);
    console.error(`==> Staged validation: ${formatArgv(options.validationArgv)}`);
    const result = runPortableCommand(candidate, options.validationArgv);
    if (result.error != null) {
      throw new StagedValidationFailure(`Failed to start staged validation: ${result.error.message}`);
    }
    if (result.status !== 0) {
      const signal = result.signal == null ? "" : ` (signal ${result.signal})`;
      throw new StagedValidationFailure(`Staged validation failed with exit ${String(result.status)}${signal}.`, commandExitCode(result));
    }
  } catch (error) {
    validationFailure = error instanceof StagedValidationFailure
      ? error
      : new StagedValidationFailure(error instanceof Error ? error.message : String(error));
  }

  const cleanupErrors = cleanup(options, temporaryRoot, candidate, attached);
  if (cleanupErrors.length > 0) {
    throw new StagedValidationFailure(`Staged candidate cleanup failed. Preserved path: ${candidate ?? temporaryRoot ?? "unknown"}. ${cleanupErrors.join(" ")}`);
  }
  if (validationFailure != null) throw validationFailure;

  console.log(JSON.stringify({
    schemaVersion: 1,
    status: "passed",
    sourceRoot: "<project-root>",
    head: identity.head,
    tree: identity.tree,
    candidateCommit: identity.commit,
    reusedPaths: options.reuse,
    validationArgv: options.validationArgv,
    cleanup: "complete",
  }, null, 2));
}

if (process.argv[1] != null && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    run(parseArgs(process.argv.slice(2)));
  } catch (error) {
    const failure = error instanceof StagedValidationFailure ? error : new StagedValidationFailure(error instanceof Error ? error.message : String(error));
    console.error(`Staged validation failed: ${failure.message}`);
    process.exitCode = failure.exitCode;
  }
}
