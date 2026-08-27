#!/usr/bin/env node
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseComplexityForagingRecord, type ComplexityForagingOutput } from "../global/bin/complexity-foraging-contract.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "global", "bin", "complexity-foraging-inventory.ts");
const fixtureRoot = path.join(root, "tools", "proofs", "fixtures", "complexity-foraging");

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function run(args: string[]): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: "utf8" });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

function treeDigest(directory: string): string {
  const hash = crypto.createHash("sha256");
  const walk = (current: string): void => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const fullPath = path.join(current, entry.name);
      const relative = path.relative(directory, fullPath).replaceAll("\\", "/");
      hash.update(`${entry.isDirectory() ? "d" : "f"}:${relative}\0`);
      if (entry.isDirectory()) walk(fullPath);
      else if (entry.isFile()) hash.update(fs.readFileSync(fullPath));
    }
  };
  walk(directory);
  return hash.digest("hex");
}

function output(result: ReturnType<typeof run>, label: string): ComplexityForagingOutput {
  assert(result.status === 0, `${label} failed: ${result.stderr}`);
  assert(result.stderr === "", `${label} wrote stderr`);
  const parsed = parseComplexityForagingRecord(JSON.parse(result.stdout));
  assert(parsed.recordType === "output", `${label} did not emit an output record`);
  return parsed;
}

const sourceProjects = path.join(fixtureRoot, "projects");
const fixtureBefore = treeDigest(fixtureRoot);
for (const flag of ["--help", "-h"]) {
  const help = run([flag]);
  assert(help.status === 0 && help.stderr === "", `${flag} must exit 0 without stderr`);
  for (const marker of ["Read-only", "reviewed scope", "SHA-256 root identity", "fallback states", "creates no files", "exits 0"]) {
    assert(help.stdout.includes(marker), `${flag} missing help marker ${marker}`);
  }
}
assert(treeDigest(fixtureRoot) === fixtureBefore, "help must not mutate fixtures");

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "complexity-foraging-"));
try {
  const cohesiveRoot = path.join(temp, "cohesive");
  const noisyRoot = path.join(temp, "noisy");
  fs.cpSync(path.join(sourceProjects, "cohesive"), cohesiveRoot, { recursive: true });
  fs.cpSync(path.join(sourceProjects, "noisy"), noisyRoot, { recursive: true });
  const before = treeDigest(temp);

  const cohesiveResult = run(["--root", cohesiveRoot, "--format", "json"]);
  const cohesive = output(cohesiveResult, "cohesive scan");
  assert(cohesive.support.state === "complete", `cohesive support was ${cohesive.support.state}`);
  for (const kind of ["component", "entrypoint", "manifest", "proof", "public-surface", "source", "test"] as const) {
    assert(cohesive.candidates.some((candidate) => candidate.kind === kind), `cohesive scan missing ${kind}`);
  }
  assert(cohesive.root.kind === "sha256" && cohesive.root.digest.length === 64, "cohesive root identity");
  assert(!cohesiveResult.stdout.includes(cohesiveRoot), "cohesive output exposed absolute root");

  const scopePath = path.join(fixtureRoot, "noisy.scope.json");
  const noisyArgs = ["--root", noisyRoot, "--scope", scopePath, "--format", "json"];
  const noisyResult = run(noisyArgs);
  const noisy = output(noisyResult, "noisy scan");
  assert(noisy.support.state === "complete", `noisy support was ${noisy.support.state}`);
  assert(noisy.counts.corpus === 2 && noisy.counts.evidence === 1, "noisy exclusions must retain classified counts");
  assert(noisy.candidates.every((candidate) => !candidate.path.startsWith("docs/corpus/") && !candidate.path.startsWith("runs/")), "excluded roots produced candidates");
  assert(noisy.diagnostics.filter((row) => row.cause.code === "EXCLUSION_NOT_ABSENCE").length === 2, "noisy scan must retain absence warnings");
  assert(!noisyResult.stdout.includes(noisyRoot) && !noisyResult.stderr.includes(noisyRoot), "noisy output exposed absolute root");
  assert(run(noisyArgs).stdout === noisyResult.stdout, "noisy output must be stable across identical scans");
  assert(treeDigest(temp) === before, "inventory scans must not mutate disposable projects");
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

assert(!fs.existsSync(temp), "disposable fixture root must be removed after child closure");
assert(treeDigest(fixtureRoot) === fixtureBefore, "inventory proof must not mutate source fixtures");
process.stdout.write("OK: complexity-foraging-inventory help=2 cohesive=1 noisy=2 cleanup=complete\n");
