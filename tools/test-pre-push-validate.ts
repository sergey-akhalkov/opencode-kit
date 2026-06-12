#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { buildPrePushValidationPlan, exitCodeFromSpawnResult, runPrePushValidation, type ValidationCommand, type ValidationCommandResult } from "./pre-push-validate.ts";

type TestCase = {
  name: string;
  run: () => void;
};

function newTempDir(name: string): string {
  const parent = path.join(os.tmpdir(), "agents-and-skills-prepush-tests");
  fs.mkdirSync(parent, { recursive: true });
  const dir = path.join(parent, `${name}-${crypto.randomUUID().replace(/-/g, "")}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function withTempDir(name: string, run: (root: string) => void): void {
  const root = newTempDir(name);
  try {
    run(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

function assertArrayEqual(actual: string[], expected: string[], message: string): void {
  if (actual.length !== expected.length || actual.some((value, index) => value !== expected[index])) {
    throw new Error(`${message}\nExpected: ${expected.join(" ")}\nActual: ${actual.join(" ")}`);
  }
}

function withOpenSpecRoot(name: string, run: (root: string) => void): void {
  withTempDir(name, (root) => {
    fs.mkdirSync(path.join(root, "openspec"), { recursive: true });
    run(root);
  });
}

function validLedger(taskId: string): Record<string, unknown> {
  const fixtureRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "fixtures", "autopilot-ledger");
  const ledger = JSON.parse(fs.readFileSync(path.join(fixtureRoot, "valid-research.json"), "utf8")) as Record<string, unknown>;
  ledger.id = taskId;
  return ledger;
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeActiveChange(root: string, changeId: string): void {
  const changeRoot = path.join(root, "openspec", "changes", changeId);
  fs.mkdirSync(changeRoot, { recursive: true });
  fs.writeFileSync(path.join(changeRoot, "tasks.md"), `# Tasks: ${changeId}\n\n- [ ] Do work.\n`, "utf8");
}

function writeLedger(root: string, changeId: string, taskId: string): void {
  writeActiveChange(root, changeId);
  writeJson(path.join(root, "openspec", "changes", changeId, "automation", "task.json"), validLedger(taskId));
}

function writeInvalidLedger(root: string, changeId: string): void {
  writeJson(path.join(root, "openspec", "changes", changeId, "automation", "task.json"), { schemaVersion: 1, id: "invalid-ledger" });
}

function commandKey(command: ValidationCommand): string {
  return `${command.label}:${command.command} ${command.args.join(" ")}`;
}

function normalizePath(value: string): string {
  return value.replaceAll("\\", "/");
}

function writePackageJson(root: string, scripts: Record<string, string>): void {
  fs.writeFileSync(path.join(root, "package.json"), `${JSON.stringify({ name: "prepush-fixture", private: true, type: "module", scripts }, null, 2)}\n`, "utf8");
}

const tests: TestCase[] = [
  {
    name: "pre-push plan includes repository gates without OpenSpec",
    run: () => withTempDir("no-openspec", (root) => {
      const plan = buildPrePushValidationPlan(root);
      assertEqual(plan.length, 2, "Plan without OpenSpec should include two gates.");
      assertArrayEqual(plan[0].args, ["run", "validate"], "First gate should run repository validation.");
      assertArrayEqual(plan[1].args, ["test"], "Second gate should run repository tests.");
    }),
  },
  {
    name: "pre-push plan includes OpenSpec validation when present",
    run: () => withOpenSpecRoot("with-openspec", (root) => {
      const plan = buildPrePushValidationPlan(root);
      assertEqual(plan.length, 4, "Plan with OpenSpec should include repository gates, Autopilot ledger gate, and OpenSpec validation.");
      assertEqual(plan[1].label, "Autopilot ledger validation", "Second gate should be Autopilot ledger validation.");
      assertEqual(plan[1].skipReason, "No active Autopilot ledgers discovered.", "No-ledger gate should be not-applicable.");
      assertEqual(plan[3].command, "openspec", "Fourth gate should use OpenSpec CLI.");
      assertArrayEqual(plan[3].args, ["validate", "--all"], "Fourth gate should validate all OpenSpec changes.");
    }),
  },
  {
    name: "pre-push plan includes active Autopilot ledgers in deterministic order",
    run: () => withOpenSpecRoot("with-ledgers", (root) => {
      writeLedger(root, "change-b", "task-b");
      writeLedger(root, "change-a", "task-a");
      const plan = buildPrePushValidationPlan(root);
      const ledgerGate = plan.find((command) => command.label === "Autopilot ledger validation");

      assertEqual(ledgerGate?.skipReason, undefined, "Active ledger gate should not be skipped.");
      assertArrayEqual(ledgerGate?.args ?? [], [
        "run",
        "autopilot:validate",
        "--",
        "openspec/changes/change-a/automation/task.json",
        "openspec/changes/change-b/automation/task.json",
      ], "Active ledger gate should validate every active ledger in sorted order.");
      assertArrayEqual(plan.map((command) => command.label), [
        "Repository validation",
        "Autopilot ledger validation",
        "Repository tests",
        "OpenSpec validation",
      ], "Autopilot ledger validation should run before repository tests.");
    }),
  },
  {
    name: "pre-push plan includes freshness gate for changed active artifacts",
    run: () => withOpenSpecRoot("with-freshness", (root) => {
      writeActiveChange(root, "change-a");
      const plan = buildPrePushValidationPlan(root, { changedFiles: ["openspec/changes/change-a/tasks.md"] });

      assertArrayEqual(plan.map((command) => command.label), [
        "Repository validation",
        "Autopilot ledger validation",
        "Repository tests",
        "OpenSpec validation",
        "Autopilot evidence freshness",
      ], "Freshness gate should run after OpenSpec validation for changed active artifacts.");
      assertArrayEqual(plan[4].args, ["tools/autopilot-report-freshness.ts", "change-a", "--mode", "archive-strict"], "Freshness gate should run archive-strict report freshness for changed active change.");
    }),
  },
  {
    name: "pre-push exit code treats killed commands as failure",
    run: () => {
      assertEqual(exitCodeFromSpawnResult({ status: null, signal: "SIGTERM" }), 1, "Signal-terminated command should fail.");
      assertEqual(exitCodeFromSpawnResult({ status: 0, signal: null }), 0, "Status 0 should pass.");
      assertEqual(exitCodeFromSpawnResult({ status: 2, signal: null }), 2, "Non-zero status should propagate.");
    },
  },
  {
    name: "pre-push fake runner executes gates in deterministic order",
    run: () => withOpenSpecRoot("runner-order", (root) => {
      const calls: string[] = [];
      const exitCode = runPrePushValidation(root, {
        runner: (_root: string, command: ValidationCommand): ValidationCommandResult => {
          calls.push(commandKey(command));
          return { status: 0, signal: null };
        },
        output: { log: () => undefined, error: () => undefined },
      });

      assertEqual(exitCode, 0, "Successful fake runner should return zero.");
      assertArrayEqual(calls, [
        "Repository validation:npm run validate",
        "Repository tests:npm test",
        "OpenSpec validation:openspec validate --all",
      ], "Fake runner should execute gates in deterministic order.");
    }),
  },
  {
    name: "pre-push fake runner reports no active ledgers as not-applicable",
    run: () => withOpenSpecRoot("runner-no-ledgers", (root) => {
      const logs: string[] = [];
      const exitCode = runPrePushValidation(root, {
        runner: () => ({ status: 0, signal: null }),
        output: { log: (message: string) => logs.push(message), error: () => undefined },
      });

      assertEqual(exitCode, 0, "No active Autopilot ledgers should not fail pre-push.");
      assertEqual(logs.some((message) => message.includes("Autopilot ledger validation") && message.includes("not-applicable")), true, "Pre-push output should report no-ledger Autopilot gate as not-applicable.");
    }),
  },
  {
    name: "pre-push fake runner short-circuits on invalid active ledger validation",
    run: () => withOpenSpecRoot("runner-invalid-ledger", (root) => {
      writeInvalidLedger(root, "change-a");
      const calls: string[] = [];
      const exitCode = runPrePushValidation(root, {
        runner: (_root: string, command: ValidationCommand): ValidationCommandResult => {
          calls.push(commandKey(command));
          return command.label === "Autopilot ledger validation" ? { status: 9, signal: null } : { status: 0, signal: null };
        },
        output: { log: () => undefined, error: () => undefined },
      });

      assertEqual(exitCode, 9, "Autopilot ledger validation failure should propagate.");
      assertArrayEqual(calls, [
        "Repository validation:npm run validate",
        "Autopilot ledger validation:npm run autopilot:validate -- openspec/changes/change-a/automation/task.json",
      ], "Invalid active ledger should stop pre-push before repository tests and OpenSpec validation.");
    }),
  },
  {
    name: "pre-push fake runner short-circuits on freshness failure",
    run: () => withOpenSpecRoot("runner-freshness-fails", (root) => {
      writeActiveChange(root, "change-a");
      const calls: string[] = [];
      const exitCode = runPrePushValidation(root, {
        changedFiles: ["openspec/changes/change-a/live-regression-report.md"],
        runner: (_root: string, command: ValidationCommand): ValidationCommandResult => {
          calls.push(commandKey(command));
          return command.label === "Autopilot evidence freshness" ? { status: 5, signal: null } : { status: 0, signal: null };
        },
        output: { log: () => undefined, error: () => undefined },
      });

      assertEqual(exitCode, 5, "Freshness gate failure should propagate.");
      assertArrayEqual(calls, [
        "Repository validation:npm run validate",
        "Repository tests:npm test",
        "OpenSpec validation:openspec validate --all",
        "Autopilot evidence freshness:node tools/autopilot-report-freshness.ts change-a --mode archive-strict",
      ], "Freshness failure should stop after the labeled freshness gate.");
    }),
  },
  {
    name: "pre-push real runner propagates invalid Autopilot ledger validation",
    run: () => withOpenSpecRoot("runner-real-invalid-ledger", (root) => {
      writeInvalidLedger(root, "change-a");
      writePackageJson(root, {
        validate: "node -e \"process.exit(0)\"",
        "autopilot:validate": `node ${normalizePath(path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), "tools", "autopilot-ledger.ts"))}`,
        test: "node -e \"process.exit(99)\"",
      });
      const errors: string[] = [];
      const logs: string[] = [];
      const exitCode = runPrePushValidation(root, { output: { log: (message: string) => logs.push(message), error: (message: string) => errors.push(message) } });

      assertEqual(exitCode, 1, "Real invalid Autopilot ledger validation command should fail with validator exit code.");
      assertEqual(logs.some((message) => message.includes("Autopilot ledger validation") && message.includes("npm run autopilot:validate")), true, "Real run should invoke npm autopilot:validate gate.");
      assertEqual(logs.some((message) => message.includes("Repository tests")), false, "Real invalid ledger run should stop before repository tests.");
      assertEqual(errors.includes("Pre-push validation failed at Autopilot ledger validation."), true, "Real run should name the failed Autopilot ledger gate.");
    }),
  },
  {
    name: "pre-push fake runner short-circuits after first failure",
    run: () => withOpenSpecRoot("runner-short-circuit", (root) => {
      const calls: string[] = [];
      const exitCode = runPrePushValidation(root, {
        runner: (_root: string, command: ValidationCommand): ValidationCommandResult => {
          calls.push(commandKey(command));
          return { status: 7, signal: null };
        },
        output: { log: () => undefined, error: () => undefined },
      });

      assertEqual(exitCode, 7, "First command failure code should propagate.");
      assertArrayEqual(calls, ["Repository validation:npm run validate"], "Runner must not execute later gates after first failure.");
    }),
  },
  {
    name: "pre-push fake runner propagates OpenSpec validation failure",
    run: () => withOpenSpecRoot("runner-openspec-fails", (root) => {
      const calls: string[] = [];
      const errors: string[] = [];
      const exitCode = runPrePushValidation(root, {
        runner: (_root: string, command: ValidationCommand): ValidationCommandResult => {
          calls.push(commandKey(command));
          return command.label === "OpenSpec validation" ? { status: 42, signal: null } : { status: 0, signal: null };
        },
        output: { log: () => undefined, error: (message: string) => errors.push(message) },
      });

      assertEqual(exitCode, 42, "OpenSpec failure code should propagate.");
      assertArrayEqual(calls, [
        "Repository validation:npm run validate",
        "Repository tests:npm test",
        "OpenSpec validation:openspec validate --all",
      ], "OpenSpec failure should occur after earlier gates pass.");
      assertEqual(errors.includes("Pre-push validation failed at OpenSpec validation."), true, "Failure output should name OpenSpec validation gate.");
    }),
  },
  {
    name: "pre-push fake runner reports missing OpenSpec CLI as startup failure",
    run: () => withOpenSpecRoot("runner-missing-openspec", (root) => {
      const errors: string[] = [];
      const exitCode = runPrePushValidation(root, {
        runner: (_root: string, command: ValidationCommand): ValidationCommandResult => {
          if (command.label === "OpenSpec validation") {
            return { status: null, signal: null, error: new Error("spawn openspec ENOENT") };
          }
          return { status: 0, signal: null };
        },
        output: { log: () => undefined, error: (message: string) => errors.push(message) },
      });

      assertEqual(exitCode, 1, "Missing OpenSpec CLI should return startup failure code 1.");
      assertEqual(errors.includes("Failed to start OpenSpec validation: spawn openspec ENOENT"), true, "Missing CLI output should name the failed OpenSpec command startup.");
      assertEqual(errors.includes("Pre-push validation failed at OpenSpec validation."), true, "Missing CLI output should name the failed gate.");
    }),
  },
];

let failed = 0;
for (const test of tests) {
  try {
    test.run();
    console.log(`PASS: ${test.name}`);
  } catch (error) {
    failed++;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL: ${test.name}\n${message}`);
  }
}

if (failed > 0) {
  console.error(`${failed} pre-push validation test(s) failed.`);
  process.exit(1);
}

console.log(`OK: pre-push validation tests=${tests.length}`);
