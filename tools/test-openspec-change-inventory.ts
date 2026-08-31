#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findOwnershipCycles, parseOwnershipManifest } from "./contracts/openspec-ownership.ts";
import { archiveOwnershipBlocker, doctorOwnershipChecks, ownershipGateChecks } from "./openspec-change-gate.ts";
import { inventoryOpenSpecChanges, parseInventoryArgs, runOpenSpecChangeInventoryCli } from "./openspec-change-inventory.ts";
import { changeStateInputFromInventory, evaluateChangeState } from "./openspec-change-state.ts";
import { runOpenSpecOperationGate } from "./openspec-operation-gate.ts";
import { invokeProcessCapture } from "./test-helpers/process.ts";
import { runTests, type TestCase } from "./test-helpers/library.ts";
import { withTempDir, writeText } from "./test-helpers/temp.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inventoryCli = path.join(root, "tools", "openspec-change-inventory.ts");
const fixtureRoot = path.join(root, "tools", "fixtures", "openspec-change-inventory", "current-violations");

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function validOwnership(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    changeId: "demo-change",
    mutationEnabled: true,
    capabilities: [{ capability: "library-spec-workflow-integrity", requirements: ["Active changes have one mutation owner"] }],
    writeRoots: ["tools/contracts/openspec-ownership.ts"],
    dependencies: [],
    transfers: [],
    ...overrides,
  };
}

function captureHelp(flag: string): { status: number | null; stdout: string; stderr: string; files: string[] } {
  return withTempDir("openspec-inventory-help", (dir) => {
    const before = new Set(fs.readdirSync(dir));
    const result = invokeProcessCapture(process.execPath, [inventoryCli, flag], { cwd: dir });
    const after = fs.readdirSync(dir);
    return { ...result, files: after.filter((name) => !before.has(name)) };
  });
}

const tests: TestCase[] = [
  {
    name: "ownership rejects missing, extra, escape, cycle, and unknown cases",
    run: () => {
      const missing = parseOwnershipManifest({ schemaVersion: 1, changeId: "demo-change" });
      assert(!missing.ok && missing.issues.some((issue) => issue.code === "missing"), "Missing fields must fail as missing.");
      const extra = parseOwnershipManifest(validOwnership({ winner: "demo-change" }));
      assert(!extra.ok && extra.issues.some((issue) => issue.code === "extra" && issue.message.includes("winner")), "Extra winner field must fail as extra.");
      const escape = parseOwnershipManifest(validOwnership({ writeRoots: ["../secrets"] }));
      assert(!escape.ok && escape.issues.some((issue) => issue.code === "escape"), "Escaping write root must fail as escape.");
      const absolute = parseOwnershipManifest(validOwnership({ writeRoots: ["D:/tmp/out"] }));
      assert(!absolute.ok && absolute.issues.some((issue) => issue.code === "escape"), "Absolute write root must fail as escape.");
      const self = parseOwnershipManifest(validOwnership({
        dependencies: [{
          changeId: "demo-change",
          kind: "planning-only",
          owners: [{ type: "write-root", path: "tools/contracts/openspec-ownership.ts" }],
          transferCondition: "archive",
        }],
      }));
      assert(!self.ok && self.issues.some((issue) => issue.code === "cycle"), "Self-dependency must fail as cycle.");

      const a = parseOwnershipManifest(validOwnership({
        changeId: "change-a",
        dependencies: [{
          changeId: "change-b",
          kind: "planning-only",
          owners: [{ type: "requirement", capability: "library-spec-workflow-integrity", requirement: "Active changes have one mutation owner" }],
          transferCondition: "archive",
        }],
      }));
      const b = parseOwnershipManifest(validOwnership({
        changeId: "change-b",
        writeRoots: ["tools/contracts/openspec-change-state.ts"],
        dependencies: [{
          changeId: "change-a",
          kind: "planning-only",
          owners: [{ type: "requirement", capability: "library-spec-workflow-integrity", requirement: "Active changes have one mutation owner" }],
          transferCondition: "archive",
        }],
      }));
      if (!a.ok || !b.ok) throw new Error("Cyclic pair manifests must parse individually.");
      const cycles = findOwnershipCycles([a.value, b.value]);
      assert(cycles.some((cycle) => cycle.includes("change-a") && cycle.includes("change-b")), "Cross-change dependency cycle must be reported.");
    },
  },
  {
    name: "inventory help is effect-free",
    run: () => {
      for (const flag of ["--help", "-h"]) {
        const result = captureHelp(flag);
        assert(result.status === 0, `${flag} must exit 0.`);
        assert(result.stdout.includes("does not choose a winner"), `${flag} must describe read-only behavior.`);
        assert(result.files.length === 0, `${flag} must not write files.`);
      }
      assert(
        (() => {
          try {
            parseInventoryArgs([]);
            return false;
          } catch (error) {
            return error instanceof Error && error.message.includes("Missing required --root");
          }
        })(),
        "CLI must require --root.",
      );
    },
  },
  {
    name: "inventory reports ownership overlap without selecting a winner or rewriting files",
    run: () => {
      const before = new Map<string, string>();
      const walk = (directory: string): void => {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
          const absolute = path.join(directory, entry.name);
          if (entry.isDirectory()) walk(absolute);
          else before.set(absolute, fs.readFileSync(absolute, "utf8"));
        }
      };
      walk(fixtureRoot);
      const inventory = inventoryOpenSpecChanges(fixtureRoot);
      assert(inventory.writes === false && inventory.filesRewritten.length === 0, "Inventory must declare no writes.");
      const overlap = inventory.findings.find((finding) => finding.id === "AUD-007");
      assert(overlap != null && overlap.winner === null && overlap.changeIds.includes("restart-a") && overlap.changeIds.includes("restart-b"), "AUD-007 must name both owners and no winner.");
      const cli = invokeProcessCapture(process.execPath, [inventoryCli, "--root", fixtureRoot], { cwd: root });
      assert(cli.status === 0, `Inventory CLI should stay advisory, stderr=${cli.stderr}`);
      const parsed = JSON.parse(cli.stdout) as { findings: Array<{ id: string; winner: null }> };
      assert(parsed.findings.some((finding) => finding.id === "AUD-007" && finding.winner === null), "CLI must echo overlap without a winner.");
      for (const [file, text] of before) {
        assert(fs.readFileSync(file, "utf8") === text, `Inventory must not rewrite ${file}.`);
      }
    },
  },
  {
    name: "state evaluator preserves local, ownership, and repository status",
    run: () => {
      const inventory = inventoryOpenSpecChanges(fixtureRoot);
      const invalid = evaluateChangeState(changeStateInputFromInventory(
        inventory,
        "ceremony-invalid-complete",
        { scope: "selected-strict", status: "fail", diagnostic: "MODIFIED requirement missing scenarios", attributableChangeId: "ceremony-invalid-complete" },
        { scope: "repository", status: "fail", diagnostic: "MODIFIED requirement missing scenarios", attributableChangeId: "ceremony-invalid-complete" },
      ));
      assert(invalid.localStatus === "incomplete" && !invalid.completeClaimAllowed, "Invalid complete state must not allow a complete claim.");
      assert(invalid.reasons.some((reason) => reason.code === "invalid-complete" && reason.message.includes("MODIFIED")), "Invalid state must preserve the validator diagnostic.");

      const stale = evaluateChangeState({
        changeId: "stale-change",
        selectedStrict: { scope: "selected-strict", status: "pass", diagnostic: "ok", attributableChangeId: "stale-change" },
        repositoryValidation: { scope: "repository", status: "pass", diagnostic: "ok", attributableChangeId: null },
        artifacts: { requiredArtifactsCurrent: false, checkedTasks: 1, totalTasks: 1, uncheckedTasks: 0 },
        ownership: { conflictFree: true, overlappingChangeIds: [], cycles: [] },
      });
      assert(stale.localStatus === "incomplete" && stale.reasons.some((reason) => reason.code === "artifacts-stale"), "Stale required artifacts must stay incomplete.");

      const overlap = evaluateChangeState(changeStateInputFromInventory(
        inventory,
        "restart-a",
        { scope: "selected-strict", status: "pass", diagnostic: "ok", attributableChangeId: "restart-a" },
        { scope: "repository", status: "pass", diagnostic: "ok", attributableChangeId: null },
      ));
      assert(overlap.localStatus === "blocked" && overlap.reasons.some((reason) => reason.code === "overlap"), "Overlap must block mutation-ready state.");

      const unrelated = evaluateChangeState({
        changeId: "healthy-change",
        selectedStrict: { scope: "selected-strict", status: "pass", diagnostic: "ok", attributableChangeId: "healthy-change" },
        repositoryValidation: { scope: "repository", status: "fail", diagnostic: "unrelated delta invalid", attributableChangeId: "other-change" },
        artifacts: { requiredArtifactsCurrent: true, checkedTasks: 1, totalTasks: 1, uncheckedTasks: 0 },
        ownership: { conflictFree: true, overlappingChangeIds: [], cycles: [] },
      });
      assert(unrelated.localStatus === "ready" && unrelated.repositoryStatus === "blocked" && !unrelated.qualificationAllowed, "Unrelated failure must keep local facts and block repository qualification.");
      assert(unrelated.reasons.some((reason) => reason.code === "unrelated-failure" && reason.changeId === "other-change"), "Unrelated failure must name the other owner.");
    },
  },
  {
    name: "ownership gates protect propose, apply, qualification, and archive",
    run: () => {
      const propose = ownershipGateChecks({ root: fixtureRoot, operation: "propose", changeId: "restart-a", enforcement: "advisory" });
      assert(propose.some((check) => check.id === "ownership:report" && check.summary.includes("mutationEnabled=true")), "Propose must report ownership.");
      const apply = runOpenSpecOperationGate(fixtureRoot, { operation: "apply", changeId: "restart-a", generatedAt: "2026-08-21T00:00:00.000Z", enforcement: "blocking" });
      assert(apply.exitCode !== 0 && apply.checks.some((check) => check.id === "ownership:overlap" && check.blocking), "Apply must block unresolved overlap before mutation.");
      const qualification = ownershipGateChecks({
        root: fixtureRoot,
        operation: "acceptance",
        changeId: "ceremony-invalid-complete",
        enforcement: "blocking",
        selectedStrict: { scope: "selected-strict", status: "fail", diagnostic: "MODIFIED requirement missing scenarios", attributableChangeId: "ceremony-invalid-complete" },
        repositoryValidation: { scope: "repository", status: "fail", diagnostic: "MODIFIED requirement missing scenarios", attributableChangeId: "ceremony-invalid-complete" },
      });
      assert(qualification.some((check) => check.id === "qualification:complete-claim" && check.blocking && check.status === "failed"), "Qualification must block a false complete claim.");
      const archive = archiveOwnershipBlocker(fixtureRoot, "restart-a", "blocking");
      assert(archive != null && archive.includes("restart-a"), "Archive must block unresolved ownership overlap.");
    },
  },
  {
    name: "advisory enforcement leaves archives untouched and unknown facts stay unknown",
    run: () => {
      withTempDir("openspec-enforcement-unknown", (dir) => {
        const archiveDir = path.join(dir, "openspec", "changes", "archive", "historical");
        writeText(path.join(archiveDir, "kept.md"), "historical");
        const before = fs.readFileSync(path.join(archiveDir, "kept.md"), "utf8");
        const advisory = doctorOwnershipChecks(fixtureRoot, "advisory");
        assert(advisory[0]?.status === "warn" && !advisory[0]?.blocksQualification, "Live default must remain advisory.");
        const unknown = ownershipGateChecks({
          root: fixtureRoot,
          operation: "acceptance",
          changeId: "ceremony-invalid-complete",
          enforcement: "blocking",
          selectedStrict: { scope: "selected-strict", status: "unknown", diagnostic: "official output unavailable", attributableChangeId: null },
        });
        assert(unknown.some((check) => check.status === "unknown"), "Unsupported official facts must be unknown.");
        inventoryOpenSpecChanges(dir);
        assert(fs.readFileSync(path.join(archiveDir, "kept.md"), "utf8") === before, "Historical archives must remain untouched.");
      });
    },
  },
];

if (process.argv.includes("--cli-probe")) {
  process.exitCode = runOpenSpecChangeInventoryCli(process.argv.filter((arg) => arg !== "--cli-probe"));
} else {
  runTests(tests, "openspec-change-inventory");
}
