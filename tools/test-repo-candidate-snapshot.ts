#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SNAPSHOT_PATCH_CEILING, SNAPSHOT_SCHEMA_VERSION } from "../global/bin/repo-candidate-snapshot.ts";
import { runPortableCommand } from "../global/bin/portable-process.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "global", "bin", "repo-candidate-snapshot.ts");

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function runCli(args: string[], cwd = root): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8" });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

function git(cwd: string, args: string[]): void {
  const result = runPortableCommand(cwd, ["git", ...args], {
    capture: true,
    env: {
      ...process.env,
      GIT_AUTHOR_DATE: "2000-01-01T00:00:00Z",
      GIT_AUTHOR_EMAIL: "proof@example.invalid",
      GIT_AUTHOR_NAME: "Proof",
      GIT_COMMITTER_DATE: "2000-01-01T00:00:00Z",
      GIT_COMMITTER_EMAIL: "proof@example.invalid",
      GIT_COMMITTER_NAME: "Proof",
    },
  });
  if (result.status !== 0) throw new Error(result.stderr || `git ${args.join(" ")} failed`);
}

function makeMixedRepo(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "repo-snapshot-"));
  git(dir, ["init", "--quiet"]);
  fs.writeFileSync(path.join(dir, "tracked.txt"), "one\n");
  git(dir, ["add", "tracked.txt"]);
  git(dir, ["commit", "-m", "init"]);
  fs.writeFileSync(path.join(dir, "tracked.txt"), "two\n");
  fs.writeFileSync(path.join(dir, "staged.txt"), "staged\n");
  git(dir, ["add", "staged.txt"]);
  fs.writeFileSync(path.join(dir, "untracked.txt"), "loose\n");
  return dir;
}

function main(): void {
  const help = runCli(["--help"]);
  const short = runCli(["-h"]);
  assert(help.status === 0 && short.status === 0, "help must exit 0");
  assert(help.stdout.includes("Read-only Git candidate snapshot"), "help must describe the tool");
  assert(!help.stdout.includes("fatal:"), "help must not invoke Git");

  const fixture = makeMixedRepo();
  const before = fs.statSync(path.join(fixture, "tracked.txt")).mtimeMs;
  try {
    const captured = runCli(["--root", fixture]);
    assert(captured.status === 0, captured.stderr || "mixed snapshot failed");
    const snapshot = JSON.parse(captured.stdout) as {
      paths: { staged: Array<{ path: string }>; unstaged: Array<{ path: string }>; untracked: Array<{ path: string }> };
      patches: { staged: string; unstaged: string };
      schemaVersion: number;
      truncation: { omittedBytes: number };
    };
    assert(snapshot.schemaVersion === SNAPSHOT_SCHEMA_VERSION, "schema version");
    assert(snapshot.paths.staged.some((row) => row.path === "staged.txt"), "staged path");
    assert(snapshot.paths.unstaged.some((row) => row.path === "tracked.txt"), "unstaged path");
    assert(snapshot.paths.untracked.some((row) => row.path === "untracked.txt"), "untracked path");
    assert(snapshot.patches.staged.includes("staged"), "staged patch");
    assert(snapshot.patches.unstaged.includes("two"), "unstaged patch");
    assert(snapshot.truncation.omittedBytes === 0, "happy path is not truncated");
    assert(fs.statSync(path.join(fixture, "tracked.txt")).mtimeMs === before, "snapshot must not mutate files");
    assert(SNAPSHOT_PATCH_CEILING === 131072, "hard ceiling");
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }

  const clean = fs.mkdtempSync(path.join(os.tmpdir(), "repo-snapshot-clean-"));
  try {
    git(clean, ["init", "--quiet"]);
    fs.writeFileSync(path.join(clean, "a.txt"), "a\n");
    git(clean, ["add", "a.txt"]);
    git(clean, ["commit", "-m", "clean"]);
    const snapshot = JSON.parse(runCli(["--root", clean, "--summary"]).stdout) as { paths: { staged: unknown[]; unstaged: unknown[]; untracked: unknown[] }; detached: boolean };
    assert(snapshot.paths.staged.length + snapshot.paths.unstaged.length + snapshot.paths.untracked.length === 0, "clean worktree");
    assert(snapshot.detached === false, "clean is on a branch");
  } finally {
    fs.rmSync(clean, { recursive: true, force: true });
  }

  const detached = fs.mkdtempSync(path.join(os.tmpdir(), "repo-snapshot-detach-"));
  try {
    git(detached, ["init", "--quiet"]);
    fs.writeFileSync(path.join(detached, "a.txt"), "a\n");
    git(detached, ["add", "a.txt"]);
    git(detached, ["commit", "-m", "base"]);
    git(detached, ["checkout", "--detach", "--quiet"]);
    const snapshot = JSON.parse(runCli(["--root", detached, "--summary"]).stdout) as { detached: boolean; branch: string | null; upstream: { present: boolean } };
    assert(snapshot.detached === true && snapshot.branch == null, "detached HEAD");
    assert(snapshot.upstream.present === false, "missing upstream");
  } finally {
    fs.rmSync(detached, { recursive: true, force: true });
  }

  const truncated = makeMixedRepo();
  try {
    const snapshot = JSON.parse(runCli(["--root", truncated, "--max-bytes", "8"]).stdout) as { truncation: { omittedBytes: number; section: string | null }; patches: { staged: string; unstaged: string } };
    assert(snapshot.truncation.omittedBytes > 0 && snapshot.truncation.section === "patches", "truncation is not complete review");
    assert(snapshot.patches.staged.length + snapshot.patches.unstaged.length <= 8, "hard ceiling honored");
  } finally {
    fs.rmSync(truncated, { recursive: true, force: true });
  }

  const missing = runCli(["--root", os.tmpdir(), "--summary"]);
  assert(missing.status !== 0 && missing.stderr.length > 0, "non-worktree root fails closed");
  const badArg = runCli(["--unknown"]);
  assert(badArg.status !== 0 && badArg.stderr.includes("Unsupported argument"), "unsupported arguments fail closed");

  const binary = fs.mkdtempSync(path.join(os.tmpdir(), "repo-snapshot-bin-"));
  try {
    git(binary, ["init", "--quiet"]);
    fs.writeFileSync(path.join(binary, "blob.bin"), Buffer.from([0, 1, 2, 255, 0]));
    git(binary, ["add", "blob.bin"]);
    git(binary, ["commit", "-m", "bin"]);
    fs.writeFileSync(path.join(binary, "blob.bin"), Buffer.from([0, 9, 2, 255, 0]));
    const snapshot = JSON.parse(runCli(["--root", binary]).stdout) as { paths: { unstaged: Array<{ path: string }> } };
    assert(snapshot.paths.unstaged.some((row) => row.path === "blob.bin"), "binary unstaged path");
  } finally {
    fs.rmSync(binary, { recursive: true, force: true });
  }

  const sentinel = fs.mkdtempSync(path.join(os.tmpdir(), "repo-snapshot-ext-"));
  try {
    git(sentinel, ["init", "--quiet"]);
    fs.writeFileSync(path.join(sentinel, "a.txt"), "a\n");
    git(sentinel, ["add", "a.txt"]);
    git(sentinel, ["commit", "-m", "base"]);
    fs.writeFileSync(path.join(sentinel, "a.txt"), "b\n");
    const marker = path.join(sentinel, "external-ran.txt");
    const hook = path.join(sentinel, "external.cmd");
    fs.writeFileSync(hook, `@echo ran> "${marker}"\n`);
    git(sentinel, ["config", "diff.external", hook]);
    const captured = runCli(["--root", sentinel]);
    assert(captured.status === 0, captured.stderr || "external-diff snapshot failed");
    assert(!fs.existsSync(marker), "malicious diff.external must not execute");
  } finally {
    fs.rmSync(sentinel, { recursive: true, force: true });
  }

  const conflicted = fs.mkdtempSync(path.join(os.tmpdir(), "repo-snapshot-conflict-"));
  try {
    git(conflicted, ["init", "--quiet"]);
    fs.writeFileSync(path.join(conflicted, "a.txt"), "base\n");
    git(conflicted, ["add", "a.txt"]);
    git(conflicted, ["commit", "-m", "base"]);
    const first = runPortableCommand(conflicted, ["git", "rev-parse", "--abbrev-ref", "HEAD"], { capture: true }).stdout.trim();
    git(conflicted, ["checkout", "-b", "other"]);
    fs.writeFileSync(path.join(conflicted, "a.txt"), "other\n");
    git(conflicted, ["commit", "-am", "other"]);
    git(conflicted, ["checkout", first]);
    fs.writeFileSync(path.join(conflicted, "a.txt"), "main\n");
    git(conflicted, ["commit", "-am", "main"]);
    const merge = runPortableCommand(conflicted, ["git", "merge", "--no-ff", "other"], {
      capture: true,
      env: {
        ...process.env,
        GIT_AUTHOR_DATE: "2000-01-01T00:00:00Z",
        GIT_AUTHOR_EMAIL: "proof@example.invalid",
        GIT_AUTHOR_NAME: "Proof",
        GIT_COMMITTER_DATE: "2000-01-01T00:00:00Z",
        GIT_COMMITTER_EMAIL: "proof@example.invalid",
        GIT_COMMITTER_NAME: "Proof",
      },
    });
    const statusNow = runPortableCommand(conflicted, ["git", "status", "--porcelain=v1", "-z"], { capture: true });
    assert((statusNow.stdout || "").includes("UU"), `expected UU porcelain, got ${JSON.stringify(statusNow.stdout)} merge=${merge.status}`);
    const captured = runCli(["--root", conflicted, "--summary"]);
    const snapshot = JSON.parse(captured.stdout) as { paths: { conflict: Array<{ path: string }>; staged: Array<{ path: string }>; unstaged: Array<{ path: string }> }; root: string };
    assert(snapshot.paths.conflict.some((row) => row.path === "a.txt"), `conflict path: ${JSON.stringify(snapshot.paths)} root=${snapshot.root} err=${captured.stderr}`);
  } finally {
    fs.rmSync(conflicted, { recursive: true, force: true });
  }

  process.stdout.write("OK: repo-candidate-snapshot tests=11\n");
}

main();
