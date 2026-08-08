#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runOpenSpecOperationGate } from "./openspec-operation-gate.ts";

type TestCase = { name: string; run: () => void };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gate = path.join(root, "tools", "openspec-operation-gate.ts");
const generatedAt = "2026-06-12T00:00:00.000Z";

const OUTCOME_CAPSULE = [
  "Outcome",
  "Operating Envelope",
  "Non-Goals",
  "Non-Deferrable Invariants",
  "Observable Proof",
  "Material Residual Risks",
  "Stop Line",
] as const;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual: unknown, expected: unknown, message: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

function withTempRepo(name: string, run: (repo: string) => void): void {
  const repo = path.join(os.tmpdir(), `openspec-operation-gate-${name}-${crypto.randomUUID().replace(/-/g, "")}`);
  fs.mkdirSync(repo, { recursive: true });
  try {
    run(repo);
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
}

function writeText(filePath: string, text: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text.replace(/\r\n/g, "\n"), "utf8");
}

function proposalWithCapsule(extra = ""): string {
  const fields = OUTCOME_CAPSULE.map((field) => `- **${field}**: fixture value for ${field}.`).join("\n");
  return `# Proposal\n\n## Why\n\nNeed change.\n\n### Outcome Capsule\n\n${fields}\n${extra}`;
}

function writeStrategyHistory(changeRoot: string): void {
  writeText(path.join(changeRoot, "history.md"), "# Strategy History\n\n");
}

function writeChange(repo: string, changeId: string, tasks = "- [ ] Do work."): void {
  const changeRoot = path.join(repo, "openspec", "changes", changeId);
  writeText(path.join(changeRoot, "proposal.md"), proposalWithCapsule());
  writeText(path.join(changeRoot, "tasks.md"), `# Tasks\n\n${tasks}\n`);
  writeStrategyHistory(changeRoot);
  writeText(path.join(changeRoot, "specs", "demo", "spec.md"), `# Demo Spec\n\n## ADDED Requirements\n\n### Requirement: Demo\n\n#### Scenario: Works\n\n- **WHEN** work runs\n- **THEN** result is visible\n`);
}

function writeIncompleteChange(repo: string, changeId: string): void {
  const changeRoot = path.join(repo, "openspec", "changes", changeId);
  writeText(path.join(changeRoot, "proposal.md"), proposalWithCapsule());
  writeStrategyHistory(changeRoot);
}

function spawnGate(repo: string, args: string[]): { status: number; stdout: string; stderr: string } {
  const result = spawnSync("node", [gate, "--root", repo, ...args], { cwd: root, encoding: "utf8", shell: false });
  if (result.error) {
    throw result.error;
  }
  return { status: result.status ?? 0, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

const tests: TestCase[] = [
  {
    name: "unknown operation without openspec reports unknown and stable JSON",
    run: () => withTempRepo("unknown-empty", (repo) => {
      const output = runOpenSpecOperationGate(repo, { operation: "prepush" as never, generatedAt });
      assert(output.schemaVersion === 1, "Gate output must use schemaVersion=1.");
      assert(output.operation === "prepush", "Gate output should echo the requested operation.");
      assert(output.status === "unknown" && output.exitCode === 1, `Expected unknown for removed prepush operation, got ${output.status}.`);
      assert(output.checks.some((check) => check.id === "operation:known" && check.status === "unknown"), "Removed prepush must surface operation:known unknown.");
      assertEqual(output.checks.map((check) => check.id), [...output.checks.map((check) => check.id)].sort(), "Checks should be deterministically sorted by id.");
    }),
  },
  {
    name: "apply gate passes ready change and warning for all checked tasks",
    run: () => withTempRepo("apply-ready", (repo) => {
      writeChange(repo, "change-a");
      const passed = runOpenSpecOperationGate(repo, { operation: "apply", changeId: "change-a", generatedAt });
      assert(passed.status === "passed" && passed.exitCode === 0, `Expected apply pass, got ${passed.status}.`);
      assert(passed.checks.some((check) => check.id === "artifact:proposal-capsule" && check.status === "passed"), "Ready apply fixture must pass Outcome Capsule check.");
      writeChange(repo, "done-change", "- [x] Done.");
      const warning = runOpenSpecOperationGate(repo, { operation: "task-update", changeId: "done-change", generatedAt });
      assert(warning.status === "warning" && warning.exitCode === 0, `Expected task-update warning, got ${warning.status}.`);
      assert(warning.checks.some((check) => check.summary.includes("all checked")), "All-checked warning should explain stale-active risk.");
    }),
  },
  {
    name: "propose and apply fail closed when Outcome Capsule fields are missing",
    run: () => withTempRepo("missing-capsule", (repo) => {
      const changeRoot = path.join(repo, "openspec", "changes", "change-a");
      writeText(path.join(changeRoot, "proposal.md"), "# Proposal\n\n## Why\n\nNeed change.\n");
      writeText(path.join(changeRoot, "tasks.md"), "# Tasks\n\n- [ ] Do work.\n");
      writeStrategyHistory(changeRoot);
      writeText(path.join(changeRoot, "specs", "demo", "spec.md"), "# Demo\n");
      for (const operation of ["propose", "apply"] as const) {
        const failed = runOpenSpecOperationGate(repo, { operation, changeId: "change-a", generatedAt });
        assert(failed.status === "failed" && failed.exitCode === 1, `Expected ${operation} capsule failure, got ${failed.status}.`);
        const capsule = failed.checks.find((check) => check.id === "artifact:proposal-capsule");
        assert(capsule?.status === "failed" && capsule.blocking, `${operation} must block on missing Outcome Capsule.`);
        for (const field of OUTCOME_CAPSULE) {
          assert(capsule.summary.includes(field), `${operation} capsule failure must name missing field ${field}.`);
        }
      }
    }),
  },
  {
    name: "archive gate blocks missing change, unsafe change id, and unchecked tasks",
    run: () => withTempRepo("archive-blocked", (repo) => {
      const missing = runOpenSpecOperationGate(repo, { operation: "archive", generatedAt });
      const unsafe = runOpenSpecOperationGate(repo, { operation: "archive", changeId: "../escape", generatedAt });
      assert(missing.status === "blocked" && missing.exitCode === 1, "Archive without change should block.");
      assert(unsafe.status === "blocked" && unsafe.exitCode === 1, "Unsafe change id should block.");
      assert(unsafe.checks.some((check) => check.id === "scope:change:safe-id"), "Unsafe change id should produce safe-id check.");

      writeChange(repo, "open-change", "- [x] Done.\n- [ ] Still open.");
      const incomplete = runOpenSpecOperationGate(repo, { operation: "archive", changeId: "open-change", generatedAt });
      assert(incomplete.status === "failed" && incomplete.exitCode === 1, `Expected incomplete archive failure, got ${incomplete.status}.`);
      assert(incomplete.checks.some((check) => check.id === "archive:tasks-incomplete" && check.blocking), "Complete archive must fail closed on unchecked tasks.");
    }),
  },
  {
    name: "apply gate fails missing tasks and unknown operation reports unknown",
    run: () => withTempRepo("failed-unknown", (repo) => {
      writeIncompleteChange(repo, "change-a");
      const failed = runOpenSpecOperationGate(repo, { operation: "apply", changeId: "change-a", generatedAt });
      const unknown = runOpenSpecOperationGate(repo, { operation: "unsupported" as never, changeId: "change-a", generatedAt });
      assert(failed.status === "failed" && failed.exitCode === 1, `Expected missing tasks failure, got ${failed.status}.`);
      assert(failed.checks.some((check) => check.id === "artifact:tasks" && check.status === "failed"), "Missing tasks should produce failed tasks artifact check.");
      assert(unknown.status === "unknown" && unknown.exitCode === 1, `Expected unknown operation, got ${unknown.status}.`);
    }),
  },
  {
    name: "propose and apply fail closed when strategy history is missing",
    run: () => withTempRepo("missing-history", (repo) => {
      const changeRoot = path.join(repo, "openspec", "changes", "change-a");
      writeText(path.join(changeRoot, "proposal.md"), proposalWithCapsule());
      writeText(path.join(changeRoot, "tasks.md"), "# Tasks\n\n- [ ] Do work.\n");
      writeText(path.join(changeRoot, "specs", "demo", "spec.md"), "# Demo\n");
      for (const operation of ["propose", "apply"] as const) {
        const failed = runOpenSpecOperationGate(repo, { operation, changeId: "change-a", generatedAt });
        assert(failed.status === "failed" && failed.exitCode === 1, `Expected ${operation} history failure, got ${failed.status}.`);
        assert(
          failed.checks.some((check) => check.id === "artifact:strategy-history" && check.status === "failed" && check.blocking),
          `${operation} must block when history.md is missing.`,
        );
      }
    }),
  },
  {
    name: "propose and apply fail closed when strategy history heading is missing",
    run: () => withTempRepo("history-heading", (repo) => {
      writeChange(repo, "change-a");
      writeText(path.join(repo, "openspec", "changes", "change-a", "history.md"), "# Notes\n\n- prior attempt\n");
      for (const operation of ["propose", "apply"] as const) {
        const failed = runOpenSpecOperationGate(repo, { operation, changeId: "change-a", generatedAt });
        assert(failed.status === "failed" && failed.exitCode === 1, `Expected ${operation} history-heading failure, got ${failed.status}.`);
        assert(
          failed.checks.some((check) => check.id === "artifact:strategy-history-heading" && check.status === "failed" && check.blocking),
          `${operation} must block when history.md lacks the Strategy History heading.`,
        );
      }
    }),
  },
  {
    name: "persist writes JSON report under operation-gates only when requested",
    run: () => withTempRepo("persist", (repo) => {
      writeChange(repo, "change-a");
      const noPersist = runOpenSpecOperationGate(repo, { operation: "apply", changeId: "change-a", generatedAt });
      const reportPath = path.join(repo, "openspec", "changes", "change-a", "automation", "operation-gates", "apply.json");
      assert(!fs.existsSync(reportPath), "Gate should not persist report by default.");
      const persisted = runOpenSpecOperationGate(repo, { operation: "apply", changeId: "change-a", generatedAt, persist: true });
      assert(persisted.persistedPath === "openspec/changes/change-a/automation/operation-gates/apply.json", `Unexpected persisted path ${String(persisted.persistedPath)}.`);
      assert(fs.existsSync(reportPath), "Persisted gate report should exist under operation-gates.");
      const parsed = JSON.parse(fs.readFileSync(reportPath, "utf8")) as Record<string, unknown>;
      assert(parsed.operation === "apply" && parsed.changeId === "change-a", "Persisted report should be the gate JSON envelope.");
      assert(noPersist.persistedPath == null, "Non-persisted output should not claim a persisted path.");
    }),
  },
  {
    name: "persist refuses unknown operation filenames",
    run: () => withTempRepo("persist-unknown", (repo) => {
      writeChange(repo, "change-a");
      const output = runOpenSpecOperationGate(repo, { operation: "../escape" as never, changeId: "change-a", generatedAt, persist: true });
      assert(output.status === "unknown", `Expected unknown operation, got ${output.status}.`);
      assert(output.persistedPath == null, "Unknown operations must not produce persistedPath.");
      assert(!fs.existsSync(path.join(repo, "openspec", "changes", "change-a", "automation", "escape.json")), "Unknown operation must not write escaped report path.");
    }),
  },
  {
    name: "CLI emits JSON and redacts absolute root path",
    run: () => withTempRepo("cli", (repo) => {
      writeChange(repo, "change-a");
      const result = spawnGate(repo, ["--operation", "apply", "--change", "change-a"]);
      const parsed = JSON.parse(result.stdout) as Record<string, unknown>;
      assert(result.status === 0, `Expected CLI pass, stderr=${result.stderr}.`);
      assert(parsed.operation === "apply", "CLI JSON should include operation.");
      assert(!result.stdout.includes(repo), "CLI output should not expose absolute temp repo path.");
    }),
  },
  {
    name: "CLI reports blocked and failed operation gates",
    run: () => withTempRepo("cli-negative", (repo) => {
      writeIncompleteChange(repo, "change-a");
      const blocked = spawnGate(repo, ["--operation", "archive"]);
      const blockedParsed = JSON.parse(blocked.stdout) as Record<string, unknown>;
      assert(blocked.status === 1, `Blocked archive CLI should exit 1, stderr=${blocked.stderr}.`);
      assert(blockedParsed.status === "blocked", `Expected blocked status, got ${String(blockedParsed.status)}.`);

      const failed = spawnGate(repo, ["--operation", "apply", "--change", "change-a"]);
      const failedParsed = JSON.parse(failed.stdout) as Record<string, unknown>;
      assert(failed.status === 1, `Missing tasks CLI should exit 1, stderr=${failed.stderr}.`);
      assert(failedParsed.status === "failed", `Expected failed status, got ${String(failedParsed.status)}.`);
    }),
  },
];

let failed = 0;
for (const test of tests) {
  try {
    test.run();
    console.log(`PASS ${test.name}`);
  } catch (error) {
    failed++;
    console.error(`FAIL ${test.name}`);
    console.error(error instanceof Error ? error.message : String(error));
  }
}

if (failed > 0) {
  throw new Error(`${failed} operation gate test(s) failed.`);
}
console.log(`OK: OpenSpec operation gate tests=${tests.length}`);
