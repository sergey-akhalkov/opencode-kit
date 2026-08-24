#!/usr/bin/env node
import path from "node:path";
import { pathToFileURL } from "node:url";

import { runPortableCommand } from "./portable-process.ts";

export const SNAPSHOT_SCHEMA_VERSION = 1;
export const SNAPSHOT_PATCH_CEILING = 131072;

type Options = {
  help: boolean;
  maxBytes: number;
  root: string;
  summary: boolean;
};

export type SnapshotPathRecord = {
  path: string;
  status: string;
};

export type SnapshotCommit = {
  authorTimestamp: string;
  objectId: string;
  parentIds: string[];
  subject: string;
};

export type RepoCandidateSnapshot = {
  branch: string | null;
  detached: boolean;
  head: string | null;
  history: SnapshotCommit[];
  paths: {
    conflict: SnapshotPathRecord[];
    staged: SnapshotPathRecord[];
    unstaged: SnapshotPathRecord[];
    untracked: SnapshotPathRecord[];
  };
  patches: {
    staged: string;
    unstaged: string;
  };
  root: string;
  schemaVersion: typeof SNAPSHOT_SCHEMA_VERSION;
  truncation: { omittedBytes: number; section: string | null };
  upstream: { ahead: number | null; behind: number | null; present: boolean; ref: string | null };
};

function usage(): string {
  return [
    "Usage:",
    "  node global/bin/repo-candidate-snapshot.ts --help",
    "  node global/bin/repo-candidate-snapshot.ts -h",
    "  node global/bin/repo-candidate-snapshot.ts [--root <path>] [--summary] [--max-bytes <n>]",
    "",
    "Read-only Git candidate snapshot. No repository mutation. Combined patch ceiling 131072 bytes.",
  ].join("\n");
}

function parseArgs(args: string[]): Options {
  const options: Options = { help: false, maxBytes: SNAPSHOT_PATCH_CEILING, root: process.cwd(), summary: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--summary") options.summary = true;
    else if (arg === "--root") {
      const value = args[index + 1];
      if (value == null || value.startsWith("--")) throw new Error("Missing value for --root");
      options.root = path.resolve(value);
      index += 1;
    } else if (arg === "--max-bytes") {
      const value = args[index + 1];
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed < 0 || parsed > SNAPSHOT_PATCH_CEILING) {
        throw new Error(`--max-bytes must be an integer 0..${SNAPSHOT_PATCH_CEILING}`);
      }
      options.maxBytes = parsed;
      index += 1;
    } else if (arg.startsWith("--")) throw new Error(`Unsupported argument ${arg}`);
  }
  return options;
}

function git(root: string, argv: string[]): { status: number | null; stdout: string; stderr: string } {
  const result = runPortableCommand(root, ["git", "-c", "diff.external=", "-c", "diff.mnemonicprefix=false", ...argv], {
    capture: true,
    env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" },
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

function requireGit(root: string, argv: string[]): string {
  const result = git(root, argv);
  if (result.status !== 0) {
    const error = new Error(`git ${argv.join(" ")} failed: ${(result.stderr || result.stdout).trim() || `exit ${result.status ?? "unknown"}`}`);
    throw error;
  }
  return result.stdout;
}

function parsePorcelain(stdout: string): RepoCandidateSnapshot["paths"] {
  const paths: RepoCandidateSnapshot["paths"] = { conflict: [], staged: [], unstaged: [], untracked: [] };
  const records = stdout.split("\0").filter((row) => row.length > 0);
  for (const record of records) {
    if (record.startsWith("?")) {
      paths.untracked.push({ path: record.slice(3) || record.slice(1), status: "??" });
      continue;
    }
    const status = record.slice(0, 2);
    const filePath = record.slice(3);
    const staged = status[0] !== " " && status[0] !== "?";
    const unstaged = status[1] !== " " && status[1] !== "?";
    const conflict = ["DD", "AU", "UD", "UA", "DU", "AA", "UU"].includes(status);
    if (conflict) paths.conflict.push({ path: filePath, status });
    if (staged) paths.staged.push({ path: filePath, status });
    if (unstaged) paths.unstaged.push({ path: filePath, status });
  }
  for (const key of ["conflict", "staged", "unstaged", "untracked"] as const) {
    paths[key].sort((left, right) => left.path.localeCompare(right.path));
  }
  return paths;
}

function parseHistory(stdout: string): SnapshotCommit[] {
  return stdout.split("\n").filter((line) => line.trim() !== "").map((line) => {
    const [objectId, parents, authorTimestamp, ...subject] = line.split("\t");
    return {
      authorTimestamp: authorTimestamp ?? "",
      objectId: objectId ?? "",
      parentIds: (parents ?? "").split(" ").filter((item) => item.length > 0),
      subject: subject.join("\t"),
    };
  });
}

function boundPatch(text: string, budget: { remaining: number }): { omittedBytes: number; text: string } {
  if (text.length <= budget.remaining) {
    budget.remaining -= text.length;
    return { omittedBytes: 0, text };
  }
  const kept = text.slice(0, budget.remaining);
  const omittedBytes = text.length - kept.length;
  budget.remaining = 0;
  return { omittedBytes, text: kept };
}

export function captureRepoCandidateSnapshot(options: Options): RepoCandidateSnapshot {
  const toplevel = requireGit(options.root, ["rev-parse", "--show-toplevel"]).trim();
  const headResult = git(toplevel, ["rev-parse", "HEAD"]);
  const head = headResult.status === 0 ? headResult.stdout.trim() : null;
  const branchResult = git(toplevel, ["rev-parse", "--abbrev-ref", "HEAD"]);
  const branchName = branchResult.status === 0 ? branchResult.stdout.trim() : "HEAD";
  const detached = branchName === "HEAD";
  const porcelain = requireGit(options.root, ["status", "--porcelain=v1", "-z"]);
  const paths = parsePorcelain(porcelain);
  const budget = { remaining: options.maxBytes };
  const stagedPatch = options.summary ? { omittedBytes: 0, text: "" } : boundPatch(git(toplevel, ["diff", "--cached", "--no-ext-diff", "--no-textconv"]).stdout, budget);
  const unstagedPatch = options.summary ? { omittedBytes: 0, text: "" } : boundPatch(git(toplevel, ["diff", "--no-ext-diff", "--no-textconv"]).stdout, budget);
  const upstreamResult = git(toplevel, ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"]);
  const upstreamRef = upstreamResult.status === 0 ? upstreamResult.stdout.trim() : null;
  let ahead: number | null = null;
  let behind: number | null = null;
  if (upstreamRef != null) {
    const counts = git(toplevel, ["rev-list", "--left-right", "--count", `${upstreamRef}...HEAD`]).stdout.trim().split(/\s+/);
    behind = Number.parseInt(counts[0] ?? "", 10);
    ahead = Number.parseInt(counts[1] ?? "", 10);
    if (!Number.isFinite(ahead)) ahead = null;
    if (!Number.isFinite(behind)) behind = null;
  }
  const history = parseHistory(requireGit(toplevel, ["log", "-n", "8", "--format=%H\t%P\t%aI\t%s"]));
  const omittedBytes = stagedPatch.omittedBytes + unstagedPatch.omittedBytes;
  return {
    branch: detached ? null : branchName,
    detached,
    head,
    history,
    paths,
    patches: { staged: stagedPatch.text, unstaged: unstagedPatch.text },
    root: toplevel.replaceAll("\\", "/"),
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    truncation: { omittedBytes, section: omittedBytes > 0 ? "patches" : null },
    upstream: { ahead, behind, present: upstreamRef != null, ref: upstreamRef },
  };
}

function main(args: string[]): number {
  const options = parseArgs(args);
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }
  process.stdout.write(`${JSON.stringify(captureRepoCandidateSnapshot(options), null, 2)}\n`);
  return 0;
}

if (process.argv[1] != null && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
