#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  COMPLEXITY_FORAGING_DEFAULT_BOUNDS,
  COMPLEXITY_FORAGING_HARD_BOUNDS,
  type ComplexityForagingOutput,
  parseComplexityForagingRecord,
  stableComplexityForagingJson,
} from "../global/bin/complexity-foraging-contract.ts";
import { type Options, renderMarkdown, scan } from "../global/bin/complexity-foraging-inventory.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureRoot = path.join(root, "tools", "proofs", "fixtures", "complexity-foraging");
const projectRoot = path.join(fixtureRoot, "projects");
const cli = path.join(root, "global", "bin", "complexity-foraging-inventory.ts");

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function run(args: string[]) {
  return spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: "utf8" });
}

function parseOutput(stdout: string): ComplexityForagingOutput {
  return parseComplexityForagingRecord(JSON.parse(stdout)) as ComplexityForagingOutput;
}

function assertNoAbsolutePath(result: { stdout: string | null; stderr: string | null }, paths: string[], label: string): void {
  const text = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.toLowerCase();
  for (const absolutePath of paths) {
    assert(!text.includes(absolutePath.toLowerCase()), `${label} leaked ${absolutePath}`);
    assert(!text.includes(absolutePath.replaceAll("\\", "/").toLowerCase()), `${label} leaked normalized ${absolutePath}`);
  }
}

function diagnosticCode(output: ComplexityForagingOutput): string {
  return output.diagnostics.at(-1)?.cause.code ?? "";
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

const fixtureBefore = treeDigest(fixtureRoot);
for (const flag of ["--help", "-h"]) {
  const help = run([flag]);
  assert(help.status === 0, `${flag} must exit 0`);
  assert(help.stderr === "", `${flag} must not write stderr`);
  for (const marker of ["--scope", "--format <kind>", "--max-files", "--max-bytes", "--timeout-ms", "--cancel-file", "No repository files are modified"]) {
    assert(help.stdout.includes(marker), `${flag} missing ${marker}`);
  }
}
assert(treeDigest(fixtureRoot) === fixtureBefore, "help must not mutate source fixtures");

const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")) as { scripts?: Record<string, string> };
assert(packageJson.scripts?.["complexity:inventory"] === "node global/bin/complexity-foraging-inventory.ts", "package wrapper must invoke the installed global inventory owner");
assert(packageJson.scripts?.["test:focused:complexity-foraging"]?.includes("test-complexity-foraging-inventory.ts") === true, "focused package validation must include inventory behavior");

const fixtureCases = [
  { name: "cohesive", args: [], expectedState: "complete" },
  { name: "noisy", args: ["--scope", path.join(fixtureRoot, "noisy.scope.json")], expectedState: "complete" },
  { name: "unsupported", args: [], expectedState: "unsupported" },
  { name: "unknown", args: ["--scope", path.join(fixtureRoot, "unknown.scope.json")], expectedState: "unknown" },
  { name: "classes", args: ["--scope", path.join(fixtureRoot, "classes.scope.json")], expectedState: "complete" },
  { name: "nested-unreadable", args: [], expectedState: "complete" },
] as const;

for (const fixture of fixtureCases) {
  const fixturePath = path.join(projectRoot, fixture.name);
  const args = ["--root", fixturePath, ...fixture.args];
  const first = run(args);
  const second = run(args);
  assert(first.status === 0, `${fixture.name} scan failed: ${first.stderr}`);
  assert(first.stderr === "", `${fixture.name} scan wrote stderr`);
  assert(first.stdout === second.stdout, `${fixture.name} output must be stable`);
  const output = parseOutput(first.stdout);
  assert(output.support.state === fixture.expectedState, `${fixture.name} support=${output.support.state}`);
  assert(stableComplexityForagingJson(output) === first.stdout, `${fixture.name} output must use canonical contract order`);
  assert(output.root.kind === "sha256" && output.root.digest.length === 64, `${fixture.name} root identity missing`);
  assertNoAbsolutePath(first, [fixturePath, root], `${fixture.name} output`);
}

const cohesiveRoot = path.join(projectRoot, "cohesive");
const cohesive = parseOutput(run(["--root", cohesiveRoot]).stdout);
assert(cohesive.counts.files === 4, `cohesive files=${cohesive.counts.files}`);
assert(cohesive.counts.maintained === 4, `cohesive maintained=${cohesive.counts.maintained}`);
assert(cohesive.candidates.some((candidate) => candidate.kind === "manifest" && candidate.path === "package.json"), "cohesive manifest evidence missing");
assert(cohesive.candidates.some((candidate) => candidate.kind === "component" && candidate.path === "src"), "cohesive component evidence missing");
assert(!JSON.stringify(cohesive).includes("export function add"), "output leaked source payload");

const noisyRoot = path.join(projectRoot, "noisy");
const noisy = parseOutput(run(["--root", noisyRoot, "--scope", path.join(fixtureRoot, "noisy.scope.json")]).stdout);
assert(noisy.counts.maintained === 2, `noisy maintained=${noisy.counts.maintained}`);
assert(noisy.counts.evidence === 1, `noisy evidence=${noisy.counts.evidence}`);
assert(noisy.counts.corpus === 2, `noisy corpus=${noisy.counts.corpus}`);
assert(noisy.diagnostics.some((diagnostic) => diagnostic.stage === "scope" && diagnostic.cause.code === "EXCLUSION_NOT_ABSENCE"), "noisy reviewed exclusion diagnostic missing");

const classes = parseOutput(run(["--root", path.join(projectRoot, "classes"), "--scope", path.join(fixtureRoot, "classes.scope.json")]).stdout);
for (const scopeClass of ["maintained", "generated", "vendor", "evidence", "corpus", "dependency"] as const) {
  assert(classes.counts[scopeClass] >= 1, `reviewed ${scopeClass} classification missing`);
}
assert(classes.candidates.every((candidate) => candidate.path === "package.json" || candidate.path === "src" || candidate.path.startsWith("src/")), "excluded classes must not create maintained candidates");

const markdownFirst = run(["--root", cohesiveRoot, "--format", "markdown"]);
const markdownSecond = run(["--root", cohesiveRoot, "--format=markdown"]);
assert(markdownFirst.status === 0 && markdownFirst.stderr === "", "Markdown scan failed");
assert(markdownFirst.stdout === markdownSecond.stdout, "Markdown output must be stable across argument forms");
for (const marker of ["# Complexity Foraging Inventory", "## Counts", "## Reviewed Scope", "## Candidates", "## Diagnostics", "- Support: complete"]) {
  assert(markdownFirst.stdout.includes(marker), `Markdown output missing ${marker}`);
}
assertNoAbsolutePath(markdownFirst, [cohesiveRoot, root], "Markdown output");

const invalidScopeCases = [
  { file: "invalid-scope-version.json", field: "schemaVersion" },
  { file: "invalid-scope-path.json", field: "scope.includes[0].path" },
];
for (const invalid of invalidScopeCases) {
  const scopePath = path.join(fixtureRoot, invalid.file);
  const result = run(["--root", cohesiveRoot, "--scope", scopePath]);
  assert(result.status === 1, `${invalid.file} must exit nonzero`);
  assert(result.stdout === "", `${invalid.file} must not emit an inventory`);
  assert(result.stderr.includes(invalid.field), `${invalid.file} missing field diagnostic ${invalid.field}`);
  assertNoAbsolutePath(result, [cohesiveRoot, scopePath, root], invalid.file);
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "complexity-foraging-"));
try {
  const malformedScope = path.join(tempRoot, "malformed-scope.json");
  fs.writeFileSync(malformedScope, "{ not-json", "utf8");
  const malformed = run(["--root", cohesiveRoot, "--scope", malformedScope]);
  assert(malformed.status === 1 && malformed.stdout === "", "malformed scope must fail without output");
  assert(malformed.stderr.includes("Scope JSON could not be parsed"), "malformed scope must preserve safe cause context");
  assertNoAbsolutePath(malformed, [cohesiveRoot, malformedScope, root], "malformed scope");

  const missingRoot = path.join(tempRoot, "missing-root");
  const unreadable = run(["--root", missingRoot]);
  assert(unreadable.status === 1 && unreadable.stderr === "", "unreadable root must return structured nonzero output");
  const unreadableOutput = parseOutput(unreadable.stdout);
  assert(unreadableOutput.support.state === "unreadable", "missing root must report unreadable support");
  assert(diagnosticCode(unreadableOutput) === "ENOENT", `missing root cause=${diagnosticCode(unreadableOutput)}`);
  assert(unreadableOutput.diagnostics[0]?.path === null, "root diagnostic must not expose a path");
  assertNoAbsolutePath(unreadable, [missingRoot, tempRoot, root], "unreadable root");

  const rootFile = path.join(tempRoot, "root-file.txt");
  fs.writeFileSync(rootFile, "not a directory", "utf8");
  const notDirectory = run(["--root", rootFile]);
  assert(notDirectory.status === 1, "file root must exit nonzero");
  assert(diagnosticCode(parseOutput(notDirectory.stdout)) === "ROOT_NOT_DIRECTORY", "file root cause missing");
  assertNoAbsolutePath(notDirectory, [rootFile, tempRoot, root], "file root");

  const maxFiles = run(["--root", cohesiveRoot, "--max-files", "1"]);
  assert(maxFiles.status === 1 && maxFiles.stderr === "", "max-files must return structured nonzero output");
  const maxFilesOutput = parseOutput(maxFiles.stdout);
  assert(maxFilesOutput.support.state === "blocked" && diagnosticCode(maxFilesOutput) === "MAX_FILES", "max-files blocked state missing");
  assert(maxFilesOutput.counts.files === 1, `max-files exceeded hard cap: ${maxFilesOutput.counts.files}`);

  const maxBytes = run(["--root", cohesiveRoot, "--max-bytes", "1"]);
  assert(maxBytes.status === 1 && maxBytes.stderr === "", "max-bytes must return structured nonzero output");
  const maxBytesOutput = parseOutput(maxBytes.stdout);
  assert(maxBytesOutput.support.state === "blocked" && diagnosticCode(maxBytesOutput) === "MAX_BYTES", "max-bytes blocked state missing");
  assert(maxBytesOutput.largestMaintainedFiles.length === 0, "max-bytes must not read an over-bound source payload");

  const timeoutProject = path.join(tempRoot, "timeout-project");
  fs.mkdirSync(timeoutProject);
  for (let index = 0; index < 500; index += 1) {
    fs.writeFileSync(path.join(timeoutProject, `file-${String(index).padStart(3, "0")}.txt`), "bounded\n", "utf8");
  }
  const timeout = run(["--root", timeoutProject, "--timeout-ms", "1"]);
  assert(timeout.status === 1 && timeout.stderr === "", "timeout must return structured nonzero output");
  const timeoutOutput = parseOutput(timeout.stdout);
  assert(timeoutOutput.support.state === "blocked" && diagnosticCode(timeoutOutput) === "TIMEOUT", "timeout blocked state missing");
  assert(timeoutOutput.counts.files < 500, "timeout must stop traversal before completion");

  const cancelMarker = path.join(tempRoot, "cancel.marker");
  fs.writeFileSync(cancelMarker, "cancel", "utf8");
  const cancelled = run(["--root", cohesiveRoot, "--cancel-file", cancelMarker]);
  assert(cancelled.status === 1 && cancelled.stderr === "", "cancellation must return structured nonzero output");
  const cancelledOutput = parseOutput(cancelled.stdout);
  assert(cancelledOutput.support.state === "blocked" && diagnosticCode(cancelledOutput) === "CANCELLED", "cancellation blocked state missing");
  assert(cancelledOutput.counts.files === 0, "pre-existing cancellation marker must stop before traversal");
  assertNoAbsolutePath(cancelled, [cancelMarker, cohesiveRoot, tempRoot, root], "cancellation output");
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
assert(!fs.existsSync(tempRoot), "disposable test root must be removed after child closure");

const nestedRoot = path.join(projectRoot, "nested-unreadable");
const blockedDirectory = path.join(nestedRoot, "src", "blocked");
const originalReadDirectory = fs.readdirSync;
const mutableFs = fs as unknown as { readdirSync: (...args: unknown[]) => unknown };
mutableFs.readdirSync = (...args: unknown[]) => {
  if (path.resolve(String(args[0])) === blockedDirectory) {
    throw Object.assign(new Error("Permission denied"), { code: "EACCES" });
  }
  return Reflect.apply(originalReadDirectory, fs, args);
};
try {
  const options: Options = {
    bounds: { ...COMPLEXITY_FORAGING_DEFAULT_BOUNDS },
    cancelPath: null,
    format: "json",
    help: false,
    root: nestedRoot,
    scopePath: null,
  };
  const partial = scan(options);
  assert(partial.support.state === "partial", `nested unreadable support=${partial.support.state}`);
  assert(partial.counts.unreadable === 1, `nested unreadable count=${partial.counts.unreadable}`);
  assert(partial.diagnostics.some((diagnostic) => diagnostic.path === "src/blocked" && diagnostic.cause.code === "EACCES"), "nested unreadable cause/path missing");
  assert(partial.candidates.some((candidate) => candidate.path === "package.json"), "nested unreadable scan must preserve independently observed facts");

  mutableFs.readdirSync = (...args: unknown[]) => {
    if (path.resolve(String(args[0])) === nestedRoot) {
      throw Object.assign(new Error(`Permission denied at ${nestedRoot}`), { code: "EACCES" });
    }
    return Reflect.apply(originalReadDirectory, fs, args);
  };
  const rootUnreadable = scan(options);
  assert(rootUnreadable.support.state === "unreadable", `unreadable directory root support=${rootUnreadable.support.state}`);
  assert(rootUnreadable.diagnostics[0]?.path === null && rootUnreadable.diagnostics[0]?.cause.code === "EACCES", "unreadable directory root cause missing");
  assert(rootUnreadable.diagnostics[0]?.cause.message === "Directory could not be read", "unreadable directory root message must be privacy-safe");
  assert(!JSON.stringify(rootUnreadable).includes(nestedRoot), "unreadable directory root leaked an absolute path");
} finally {
  mutableFs.readdirSync = originalReadDirectory as unknown as (...args: unknown[]) => unknown;
}

for (const boundCase of [
  ["--max-files", String(COMPLEXITY_FORAGING_HARD_BOUNDS.maxFiles + 1)],
  ["--max-bytes", String(COMPLEXITY_FORAGING_HARD_BOUNDS.maxBytes + 1)],
  ["--timeout-ms", String(COMPLEXITY_FORAGING_HARD_BOUNDS.timeoutMs + 1)],
] as const) {
  const result = run(["--root", cohesiveRoot, ...boundCase]);
  assert(result.status === 1 && result.stdout === "", `${boundCase[0]} hard-cap violation must fail before scanning`);
  assert(result.stderr.includes("must be an integer from 1 through"), `${boundCase[0]} hard-cap diagnostic missing`);
  assertNoAbsolutePath(result, [cohesiveRoot, root], `${boundCase[0]} hard-cap output`);
}

const invalidFormat = run(["--root", cohesiveRoot, "--format", "yaml"]);
assert(invalidFormat.status === 1 && invalidFormat.stdout === "", "invalid format must fail before scanning");
assert(invalidFormat.stderr.includes("--format must be json or markdown"), "invalid format diagnostic missing");
assertNoAbsolutePath(invalidFormat, [cohesiveRoot, root], "invalid format output");

const rendered = renderMarkdown(cohesive);
assert(rendered === markdownFirst.stdout, "exported Markdown renderer must match the CLI projection");
assert(treeDigest(fixtureRoot) === fixtureBefore, "inventory proof must not mutate source fixtures");

process.stdout.write(`OK: complexity-foraging-inventory fixtures=${fixtureCases.length} bounds=3 cancellation=1 unreadable=3\n`);
