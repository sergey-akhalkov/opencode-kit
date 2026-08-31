#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  collectDeliveryTrajectoryContext,
  DeliveryTrajectoryContextError,
  formatDeliveryTrajectoryContextJson,
  formatDeliveryTrajectoryContextMarkdown,
} from "../global/bin/delivery-trajectory-context.ts";
import { deliveryHorizonRelativePath, type DeliveryHorizon } from "../global/bin/openspec-change/delivery-horizon.ts";

type TestCase = { name: string; run: () => void };

const cli = path.resolve(import.meta.dirname, "../global/bin/delivery-trajectory-context.ts");

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function writeText(filePath: string, text: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text.replaceAll("\r\n", "\n"), "utf8");
}

function tempProject(name: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), `delivery-trajectory-context-${name}-`));
}

function horizon(id = "phase-one"): DeliveryHorizon {
  return {
    schemaVersion: 1,
    id,
    windowStart: "2026-08-01T00:00:00Z",
    usefulBy: "2026-10-01T00:00:00Z",
    outcomeRefs: ["docs/outcome.md"],
    exitPredicateRefs: ["docs/exit.md"],
    nonDeferrableInvariantRefs: ["docs/invariants.md"],
    nonGoalRefs: ["docs/non-goals.md"],
  };
}

function seedHorizon(root: string, value = horizon()): void {
  writeText(path.join(root, "docs/outcome.md"), "PRIVATE OUTCOME PAYLOAD\n");
  writeText(path.join(root, "docs/exit.md"), "PRIVATE EXIT PAYLOAD\n");
  writeText(path.join(root, "docs/invariants.md"), "PRIVATE INVARIANT PAYLOAD\n");
  writeText(path.join(root, "docs/non-goals.md"), "PRIVATE NON-GOAL PAYLOAD\n");
  writeText(path.join(root, deliveryHorizonRelativePath(value.id)), `${JSON.stringify(value, null, 2)}\n`);
}

function seedArchive(
  root: string,
  archiveId: string,
  declaration: string | null,
  optionalFiles = false,
): void {
  const archive = path.join(root, "openspec/changes/archive", archiveId);
  const line = declaration == null ? "" : `- **Delivery Horizon:** ${declaration}\n`;
  writeText(path.join(archive, "proposal.md"), `# Archived Fixture\n\n${line}PRIVATE PROPOSAL PAYLOAD\n`);
  if (optionalFiles) {
    writeText(path.join(archive, "tasks.md"), "# Tasks\n\n- [x] PRIVATE TASK PAYLOAD\n");
    writeText(path.join(archive, "history.md"), "# History\n\nPRIVATE HISTORY PAYLOAD\n");
  }
}

function seedArchiveWindow(root: string): void {
  seedArchive(root, "2026-08-01-legacy", null);
  seedArchive(root, "2026-08-02-first", "phase-one", true);
  seedArchive(root, "2026-08-03-unrelated", "phase-two");
  seedArchive(root, "2026-08-04-current", "phase-one");
  seedArchive(root, "2026-08-05-later", "phase-one", true);
}

function expectError(
  run: () => unknown,
  code: DeliveryTrajectoryContextError["code"],
  message: string,
): DeliveryTrajectoryContextError {
  let captured: unknown;
  try {
    run();
  } catch (error) {
    captured = error;
  }
  assert(captured instanceof DeliveryTrajectoryContextError && captured.code === code, `${message}: ${String(captured)}`);
  return captured;
}

function snapshot(root: string): string {
  const entries: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name, "en"))) {
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(root, absolute).replaceAll(path.sep, "/");
      if (entry.isSymbolicLink()) {
        entries.push(`link:${relative}:${fs.readlinkSync(absolute)}`);
      } else if (entry.isDirectory()) {
        entries.push(`dir:${relative}`);
        visit(absolute);
      } else {
        entries.push(`file:${relative}:${crypto.createHash("sha256").update(fs.readFileSync(absolute)).digest("hex")}`);
      }
    }
  };
  visit(root);
  return entries.join("\n");
}

function runCli(root: string, ...args: string[]) {
  return spawnSync(process.execPath, [cli, "--root", root, ...args], {
    cwd: os.tmpdir(),
    encoding: "utf8",
    shell: false,
    timeout: 30_000,
  });
}

const tests: TestCase[] = [
  {
    name: "help is effect-free and usable outside a repository",
    run() {
      for (const flag of ["--help", "-h"]) {
        const result = spawnSync(process.execPath, [cli, flag], {
          cwd: os.tmpdir(),
          encoding: "utf8",
          shell: false,
          timeout: 30_000,
        });
        assert(result.status === 0, `${flag} exit: ${result.stderr}`);
        assert(result.stdout.includes("Inputs:") || result.stdout.includes("Required inputs:"), `${flag} inputs`);
        assert(result.stdout.includes("Effects:") && result.stdout.includes("Cleanup:"), `${flag} effects and cleanup`);
        assert(result.stdout.includes("No semantic progress"), `${flag} inference boundary`);
      }
    },
  },
  {
    name: "core and CLI emit stable bounded current and predecessor facts without effects",
    run() {
      const root = tempProject("happy");
      try {
        seedHorizon(root);
        seedArchiveWindow(root);
        const before = snapshot(root);
        const options = { root, horizonId: "phase-one", archiveId: "2026-08-04-current" };
        const first = collectDeliveryTrajectoryContext(options);
        const second = collectDeliveryTrajectoryContext(options);
        const firstJson = formatDeliveryTrajectoryContextJson(first);
        assert(firstJson === formatDeliveryTrajectoryContextJson(second), "unchanged core JSON must be byte-stable");
        assert(first.archives.map((archive) => archive.archiveId).join(",") === "2026-08-02-first,2026-08-04-current", "linked predecessor/current order");
        assert(first.archives[0]?.files.tasks.support === "present", "present predecessor metadata");
        assert(first.archives[1]?.files.tasks.support === "missing", "explicit optional missing support");
        assert(first.archives[1]?.current === true && first.archives[0]?.current === false, "current identity");
        assert(first.horizon.requirements.length === 4 && first.bounds.used.filesRead >= 9, "bounded horizon/archive reads");
        assert(first.effects.writes === 0 && first.effects.modelCalls === 0 && first.effects.openSpecOperations === 0, "zero effects");

        const markdown = formatDeliveryTrajectoryContextMarkdown(first);
        for (const output of [firstJson, markdown]) {
          assert(!output.includes(root), "private absolute root must not be emitted");
          assert(!output.includes("PRIVATE"), "source payloads must not be emitted");
          assert(!output.includes("2026-08-03-unrelated") && !output.includes("2026-08-05-later"), "unrelated and later archives excluded");
        }

        const cliJsonA = runCli(root, "--horizon", "phase-one", "--archive", "2026-08-04-current", "--format", "json");
        const cliJsonB = runCli(root, "--horizon", "phase-one", "--archive", "2026-08-04-current", "--format", "json");
        const cliMarkdown = runCli(root, "--horizon", "phase-one", "--archive", "2026-08-04-current", "--format", "markdown");
        assert(cliJsonA.status === 0 && cliJsonB.status === 0 && cliMarkdown.status === 0, `CLI exits: ${cliJsonA.stderr}${cliMarkdown.stderr}`);
        assert(cliJsonA.stdout === cliJsonB.stdout && cliJsonA.stdout === firstJson, "CLI JSON must be stable and match core");
        assert(cliMarkdown.stdout === markdown, "CLI Markdown must match core");
        assert(snapshot(root) === before, "helper and CLI must not mutate the fixture");
      } finally {
        fs.rmSync(root, { force: true, recursive: true });
      }
    },
  },
  {
    name: "schema linkage containment and source failures stay distinct and fail closed",
    run() {
      const root = tempProject("failure");
      const parent = path.dirname(root);
      try {
        seedHorizon(root);
        seedArchiveWindow(root);
        const collect = () => collectDeliveryTrajectoryContext({ root, horizonId: "phase-one", archiveId: "2026-08-04-current" });
        const horizonPath = path.join(root, deliveryHorizonRelativePath("phase-one"));

        writeText(horizonPath, `${JSON.stringify({ ...horizon(), schemaVersion: 2 })}\n`);
        expectError(collect, "unsupported", "unsupported horizon");
        writeText(horizonPath, "{ malformed\n");
        expectError(collect, "invalid", "malformed horizon JSON");
        writeText(horizonPath, `${JSON.stringify({ ...horizon(), outcomeRefs: ["../outside.md"] })}\n`);
        expectError(collect, "path-escape", "escaping horizon reference");
        writeText(horizonPath, `${JSON.stringify({ ...horizon(), outcomeRefs: ["docs/missing.md"] })}\n`);
        expectError(collect, "missing", "missing horizon reference");

        seedHorizon(root);
        writeText(path.join(root, "openspec/changes/archive/2026-08-04-current/proposal.md"), "- **Delivery Horizon:** phase-two\n");
        expectError(collect, "current-archive-link-mismatch", "current archive mismatch");
        seedArchive(root, "2026-08-04-current", "phase-one");
        expectError(
          () => collectDeliveryTrajectoryContext({ root, horizonId: "phase-one", archiveId: "2026-08-04-missing" }),
          "missing",
          "missing current archive",
        );

        writeText(path.join(root, "openspec/changes/archive/2026-08-03-unrelated/proposal.md"), "- **Delivery Horizon:** none\n");
        expectError(collect, "invalid", "malformed inspected predecessor declaration");
        seedArchive(root, "2026-08-03-unrelated", "phase-two");

        const outside = tempProject("outside");
        try {
          writeText(path.join(outside, "outcome.md"), "OUTSIDE\n");
          fs.rmSync(path.join(root, "docs/outcome.md"));
          fs.symlinkSync(outside, path.join(root, "linked-docs"), process.platform === "win32" ? "junction" : "dir");
          writeText(horizonPath, `${JSON.stringify({ ...horizon(), outcomeRefs: ["linked-docs/outcome.md"] })}\n`);
          expectError(collect, "path-escape", "symlink reference");
        } finally {
          fs.rmSync(outside, { force: true, recursive: true });
        }

        const child = path.join(root, "child-project");
        fs.mkdirSync(child);
        expectError(
          () => collectDeliveryTrajectoryContext({ root: child, horizonId: "phase-one", archiveId: "2026-08-04-current" }),
          "missing",
          "must not fall back to a parent project",
        );

        seedHorizon(root);
        const descriptor = Object.getOwnPropertyDescriptor(fs, "openSync");
        assert(descriptor != null, "fs.openSync descriptor");
        Object.defineProperty(fs, "openSync", {
          configurable: true,
          value: (target: fs.PathLike, ...args: unknown[]) => {
            if (String(target).endsWith(`${path.sep}docs${path.sep}outcome.md`)) {
              throw Object.assign(new Error("denied"), { code: "EACCES" });
            }
            return (descriptor.value as (...values: unknown[]) => number)(target, ...args);
          },
        });
        try {
          expectError(collect, "unreadable", "unreadable reference");
        } finally {
          Object.defineProperty(fs, "openSync", descriptor);
        }

        assert(parent !== root, "fixture parent identity control");
      } finally {
        fs.rmSync(root, { force: true, recursive: true });
      }
    },
  },
  {
    name: "archive byte timeout cancellation and CLI failure bounds do not emit clean output",
    run() {
      const root = tempProject("bounds");
      try {
        seedHorizon(root);
        seedArchiveWindow(root);
        const base = { root, horizonId: "phase-one", archiveId: "2026-08-04-current" };
        expectError(() => collectDeliveryTrajectoryContext({ ...base, maxArchives: 1 }), "archive-limit", "linked archive bound");
        expectError(() => collectDeliveryTrajectoryContext({ ...base, maxBytes: 1 }), "byte-limit", "aggregate byte bound");

        const controller = new AbortController();
        controller.abort(new Error("test cancellation"));
        const aborted = expectError(() => collectDeliveryTrajectoryContext({ ...base, signal: controller.signal }), "aborted", "pre-aborted collection");
        assert((aborted as DeliveryTrajectoryContextError & { cause?: unknown }).cause instanceof Error, "aborted cause must be preserved");

        let now = 0;
        Object.defineProperty(performance, "now", { configurable: true, value: () => (now += 1_000) });
        try {
          expectError(() => collectDeliveryTrajectoryContext({ ...base, timeoutMs: 1 }), "timeout", "timeout bound");
        } finally {
          Reflect.deleteProperty(performance, "now");
        }

        const failed = runCli(root, "--horizon", "phase-one", "--archive", "2026-08-04-current", "--max-archives", "1");
        assert(failed.status === 1 && failed.stdout === "", `CLI failure output: ${failed.stdout}`);
        assert(failed.stderr.includes("archive-limit") && !failed.stderr.includes(root), "privacy-safe CLI bound diagnostic");
        const invalidArg = spawnSync(process.execPath, [cli, "--root", root, "--root", root], { cwd: os.tmpdir(), encoding: "utf8", shell: false });
        assert(invalidArg.status === 1 && invalidArg.stdout === "" && invalidArg.stderr.includes("invalid-argument"), "duplicate args fail closed");
      } finally {
        fs.rmSync(root, { force: true, recursive: true });
      }
    },
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
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  }
}

if (failed > 0) throw new Error(`${failed} Delivery trajectory context test(s) failed.`);
console.log(`OK: Delivery trajectory context tests=${tests.length}`);
