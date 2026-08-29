#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseOwnershipManifest, findOwnershipCycles } from "./contracts/openspec-ownership.ts";
import { evaluateClaimEvidence, inspectEvidenceDocument, parseEvidenceIndex, proofEnvelopeState, taskTextDigest } from "./contracts/openspec-evidence.ts";
import { inventoryOpenSpecChanges, parseInventoryArgs, runOpenSpecChangeInventoryCli } from "./openspec-change-inventory.ts";
import { changeStateInputFromInventory, decideEvidenceAction, evaluateChangeState } from "./openspec-change-state.ts";
import { archiveEvidenceBlocker, doctorOwnershipEvidenceChecks, ownershipEvidenceGateChecks } from "./openspec-change-gate.ts";
import { runOpenSpecOperationGate } from "./openspec-operation-gate.ts";
import { invokeProcessCapture } from "./test-helpers/process.ts";
import { runTests, type TestCase } from "./test-helpers/library.ts";
import { withTempDir, writeText } from "./test-helpers/temp.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inventoryCli = path.join(root, "tools", "openspec-change-inventory.ts");
const fixtureRoot = path.join(root, "tools", "fixtures", "openspec-change-inventory", "current-violations");
const claimFixtureFile = path.join(root, "tools", "fixtures", "openspec-claim-evidence", "cases.json");

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

function validEvidence(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 2,
    changeId: "demo-change",
    candidateId: "demo-r1",
    environmentId: "demo-env",
    retention: { maxFiles: 64, maxBytes: 26214400, exception: null },
    tasks: [],
    lanes: [],
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
        writeRoots: ["tools/contracts/openspec-evidence.ts"],
        dependencies: [{
          changeId: "change-a",
          kind: "planning-only",
          owners: [{ type: "requirement", capability: "library-spec-workflow-integrity", requirement: "Active changes have one mutation owner" }],
          transferCondition: "archive",
        }],
      }));
      assert(a.ok && b.ok, "Cyclic pair manifests must parse individually.");
      const cycles = findOwnershipCycles([a.value, b.value]);
      assert(cycles.some((cycle) => cycle.includes("change-a") && cycle.includes("change-b")), "Cross-change dependency cycle must be reported.");
    },
  },
  {
    name: "evidence rejects missing, extra, escape, and unknown cases",
    run: () => {
      const missing = parseEvidenceIndex({ schemaVersion: 2, changeId: "demo-change" });
      assert(!missing.ok && missing.issues.some((issue) => issue.code === "missing"), "Missing evidence fields must fail as missing.");
      const extra = parseEvidenceIndex(validEvidence({ inferredQuality: "high" }));
      assert(!extra.ok && extra.issues.some((issue) => issue.code === "extra"), "Extra evidence field must fail as extra.");
      const escape = parseEvidenceIndex(validEvidence({
        tasks: [{
          taskId: "1.1",
          taskTextDigest: taskTextDigest("1.1 Demo"),
          result: "incomplete",
          candidateId: "demo-r1",
          environmentId: "demo-env",
          requiredBoundary: { kind: "named-entrypoint", name: "cli", effects: ["read-only"] },
          boundary: { kind: "named-entrypoint", name: "cli", effects: ["read-only"] },
          invocation: null,
          artifacts: ["../escape.json"],
          cleanup: "none",
          manualGate: null,
        }],
      }));
      assert(!escape.ok && escape.issues.some((issue) => issue.code === "escape"), "Escaping artifact path must fail as escape.");
      const unknown = inspectEvidenceDocument({ schemaVersion: 1, lanes: [] });
      assert(!unknown.ok && unknown.issues.some((issue) => issue.code === "unknown"), "Legacy evidence schema must be unknown for task proof.");
      const valid = parseEvidenceIndex(validEvidence());
      assert(valid.ok && valid.value.claims.length === 0, "Valid evidence index without triggered claims must parse with an empty claim set.");
    },
  },
  {
    name: "claim fixtures preserve explicit closure outcomes without scoring or inference",
    run: () => {
      const fixture = JSON.parse(fs.readFileSync(claimFixtureFile, "utf8")) as {
        lanes: unknown[];
        baseClaim: Record<string, unknown>;
        cases: Array<{
          id: string;
          replace: Record<string, unknown>;
          expected: { parse: "valid" | "invalid"; state?: string; reasonCodes?: string[]; issueText?: string };
        }>;
      };
      for (const scenario of fixture.cases) {
        const claim = { ...fixture.baseClaim, ...scenario.replace };
        const parsed = parseEvidenceIndex(validEvidence({ lanes: fixture.lanes, claims: [claim] }));
        if (scenario.expected.parse === "invalid") {
          assert(!parsed.ok, `${scenario.id} must fail schema parsing.`);
          if (!parsed.ok && scenario.expected.issueText != null) {
            assert(parsed.issues.some((issue) => issue.message.includes(scenario.expected.issueText!)), `${scenario.id} must preserve its duplicate diagnostic.`);
          }
          continue;
        }
        assert(parsed.ok, `${scenario.id} must parse.`);
        if (!parsed.ok) continue;
        const result = evaluateClaimEvidence(
          parsed.value.claims[0],
          parsed.value.candidateId,
          parsed.value.environmentId,
          new Set(parsed.value.lanes.map((lane) => lane.name)),
        );
        assert(result.state === scenario.expected.state, `${scenario.id} expected ${scenario.expected.state}, observed ${result.state}.`);
        for (const code of scenario.expected.reasonCodes ?? []) {
          assert(result.reasons.some((reason) => reason.code === code), `${scenario.id} must report ${code}.`);
        }
        const serialized = JSON.stringify(result);
        assert(!serialized.includes("score") && !serialized.includes("inferred"), `${scenario.id} output must contain no score or inferred semantic field.`);
      }
    },
  },
  {
    name: "compact partition claims inherit only the identical material member set",
    run: () => {
      const fixture = JSON.parse(fs.readFileSync(claimFixtureFile, "utf8")) as {
        baseClaim: Record<string, unknown>;
        cases: Array<{ id: string; replace: Record<string, unknown> }>;
      };
      const selected = fixture.cases.find((scenario) => scenario.id === "partition-without-rule");
      assert(selected != null, "Partition fixture must exist.");
      if (selected == null) return;
      const claim = { ...fixture.baseClaim, ...selected.replace };
      const expanded = parseEvidenceIndex(validEvidence({ claims: [claim] }));
      const population = { ...(claim.population as Record<string, unknown>) };
      delete population.materialClasses;
      const compact = parseEvidenceIndex(validEvidence({ claims: [{ ...claim, population }] }));
      assert(expanded.ok && compact.ok, "Expanded and compact partition claims must both parse.");
      if (!expanded.ok || !compact.ok) return;
      assert(JSON.stringify(expanded.value.claims[0].population) === JSON.stringify(compact.value.claims[0].population), "Compact material classes must resolve to the exact declared member set.");

      const mismatched = parseEvidenceIndex(validEvidence({
        claims: [{ ...claim, population: { ...population, materialClasses: ["different-member"] } }],
      }));
      assert(mismatched.ok, "Explicit material-class mismatch must remain readable for claim evaluation.");
      if (!mismatched.ok) return;
      const result = evaluateClaimEvidence(mismatched.value.claims[0], "demo-r1", "demo-env", new Set());
      assert(result.reasons.some((reason) => reason.code === "partition-class-mismatch"), "Explicit material-class mismatch must remain visible.");
    },
  },
  {
    name: "compact claim observations inherit only exact containing claim facts",
    run: () => {
      const fixture = JSON.parse(fs.readFileSync(claimFixtureFile, "utf8")) as { baseClaim: Record<string, unknown> };
      const expanded = parseEvidenceIndex(validEvidence({ claims: [fixture.baseClaim] }));
      const compactClaim = {
        ...fixture.baseClaim,
        observations: [["observation", "item-a", "supported", true, ["product"]]],
      };
      const compact = parseEvidenceIndex(validEvidence({ claims: [compactClaim] }));
      assert(expanded.ok && compact.ok, "Expanded and compact observations must both parse.");
      if (!expanded.ok || !compact.ok) return;
      assert(JSON.stringify(expanded.value.claims[0].observations) === JSON.stringify(compact.value.claims[0].observations), "Compact observation must resolve to the exact expanded row.");

      const mismatchedObservation = {
        ...(fixture.baseClaim.observations as Record<string, unknown>[])[0],
        candidateId: "other-r1",
      };
      const mismatched = parseEvidenceIndex(validEvidence({ claims: [{ ...fixture.baseClaim, observations: [mismatchedObservation] }] }));
      assert(mismatched.ok, "Explicit observation mismatch must remain readable.");
      if (mismatched.ok) {
        const result = evaluateClaimEvidence(mismatched.value.claims[0], "demo-r1", "demo-env", new Set(["product"]));
        assert(result.reasons.some((reason) => reason.code === "stale-row-candidate"), "Explicit observation identity mismatch must remain visible.");
      }
      const malformed = parseEvidenceIndex(validEvidence({ claims: [{ ...fixture.baseClaim, observations: [["observation", "item-a"]] }] }));
      assert(!malformed.ok && malformed.issues.some((issue) => issue.message.includes("exact observation tuple")), "Malformed compact observation must fail closed.");
    },
  },
  {
    name: "compact task evidence inherits only exact redundant envelope fields",
    run: () => {
      const digest = taskTextDigest("1.1 Demo");
      const boundary = { kind: "named-entrypoint", name: "cli", effects: ["read-only"] };
      const common = {
        taskId: "1.1",
        taskTextDigest: digest,
        result: "complete",
        boundary,
        invocation: { command: "cli", status: 0, recordedAt: "2026-08-28" },
        artifacts: [],
        cleanup: "none",
        manualGate: null,
      };
      const expanded = parseEvidenceIndex(validEvidence({
        tasks: [{ ...common, candidateId: "demo-r1", environmentId: "demo-env", requiredBoundary: boundary }],
      }));
      const { artifacts: _artifacts, ...compactCommon } = common;
      const compact = parseEvidenceIndex(validEvidence({ tasks: [compactCommon] }));
      const tuple = parseEvidenceIndex(validEvidence({ tasks: [[
        "entrypoint", "1.1", digest, "complete", "cli", ["read-only"], "cli", 0, "2026-08-28", "none",
      ]] }));
      assert(expanded.ok && compact.ok && tuple.ok, "Expanded, inherited, and tuple task evidence must all parse.");
      if (!expanded.ok || !compact.ok || !tuple.ok) return;
      assert(JSON.stringify(expanded.value.tasks[0]) === JSON.stringify(compact.value.tasks[0]), "Inherited task evidence must materialize the exact expanded row.");
      assert(JSON.stringify(expanded.value.tasks[0]) === JSON.stringify(tuple.value.tasks[0]), "Tuple task evidence must materialize the exact expanded row.");

      const explicitIdentity = parseEvidenceIndex(validEvidence({ tasks: [{ ...common, candidateId: "other-r1" }] }));
      assert(explicitIdentity.ok && proofEnvelopeState(explicitIdentity.value.tasks[0], "demo-r1", "demo-env", digest) === "stale", "Explicit candidate mismatch must remain stale.");
      const explicitBoundary = parseEvidenceIndex(validEvidence({
        tasks: [{ ...common, requiredBoundary: { ...boundary, name: "strong-cli" } }],
      }));
      assert(explicitBoundary.ok && proofEnvelopeState(explicitBoundary.value.tasks[0], "demo-r1", "demo-env", digest) === "mismatch", "Explicit boundary mismatch must remain visible.");
      const missingBoundary = parseEvidenceIndex(validEvidence({ tasks: [{ ...common, boundary: undefined }] }));
      assert(!missingBoundary.ok && missingBoundary.issues.some((issue) => issue.path.includes("requiredBoundary")), "Compact task evidence without an explicit boundary must fail inheritance.");
      const malformedTuple = parseEvidenceIndex(validEvidence({ tasks: [["entrypoint", "1.1"]] }));
      assert(!malformedTuple.ok && malformedTuple.issues.some((issue) => issue.message.includes("exact entrypoint tuple")), "Malformed task tuple must fail closed.");
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
      try {
        parseInventoryArgs([]);
        throw new Error("Missing --root must fail.");
      } catch (error) {
        assert(error instanceof Error && error.message.includes("Missing required --root"), "CLI must require --root.");
      }
    },
  },
  {
    name: "current-violation fixtures reproduce AUD-001/006/007/008 without a winner or rewrite",
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
      assert(inventory.findings.some((finding) => finding.id === "AUD-001" && finding.winner === null && finding.changeIds.includes("ceremony-invalid-complete")), "AUD-001 must be reported.");
      assert(inventory.findings.some((finding) => finding.id === "AUD-006" && finding.winner === null && finding.changeIds.includes("mission-unindexed")), "AUD-006 must be reported.");
      const overlap = inventory.findings.find((finding) => finding.id === "AUD-007");
      assert(overlap != null && overlap.winner === null && overlap.changeIds.includes("restart-a") && overlap.changeIds.includes("restart-b"), "AUD-007 must name both owners and no winner.");
      assert(inventory.findings.some((finding) => finding.id === "AUD-008" && finding.changeIds.includes("weaker-desktop-restart")), "AUD-008 must be reported.");
      assert(!JSON.stringify(inventory).includes("winner\":\"restart"), "Inventory must not select a restart winner.");
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
    name: "over-limit retained files block completion facts without deletion",
    run: () => {
      withTempDir("openspec-inventory-overlimit", (dir) => {
        const change = path.join(dir, "openspec", "changes", "heavy-change");
        writeText(path.join(change, "tasks.md"), "# Tasks\n\n- [x] 1.1 Index evidence\n");
        writeText(path.join(change, "ownership.json"), `${JSON.stringify(validOwnership({ changeId: "heavy-change" }), null, 2)}\n`);
        writeText(path.join(change, "evidence-index.json"), `${JSON.stringify(validEvidence({ changeId: "heavy-change" }), null, 2)}\n`);
        for (let index = 0; index < 65; index++) {
          writeText(path.join(change, "evidence", `file-${String(index).padStart(3, "0")}.txt`), "x");
        }
        const beforeCount = fs.readdirSync(path.join(change, "evidence")).length;
        const inventory = inventoryOpenSpecChanges(dir);
        const row = inventory.changes.find((item) => item.changeId === "heavy-change");
        assert(row != null && row.retainedFiles === 65 && row.overLimit, "65 retained files must be over the default limit.");
        assert(inventory.findings.some((finding) => finding.id === "AUD-006" && finding.changeIds.includes("heavy-change")), "Over-limit must emit AUD-006.");
        assert(fs.readdirSync(path.join(change, "evidence")).length === beforeCount, "Inventory must not delete evidence files.");
      });
    },
  },
  {
    name: "state evaluator returns exact local and repository states for required fixtures",
    run: () => {
      const inventory = inventoryOpenSpecChanges(fixtureRoot);
      const invalid = evaluateChangeState(changeStateInputFromInventory(
        inventory,
        "ceremony-invalid-complete",
        { scope: "selected-strict", status: "fail", diagnostic: "MODIFIED requirement missing scenarios", attributableChangeId: "ceremony-invalid-complete" },
        { scope: "repository", status: "fail", diagnostic: "MODIFIED requirement missing scenarios", attributableChangeId: "ceremony-invalid-complete" },
      ));
      assert(invalid.localStatus === "incomplete" && invalid.completeClaimAllowed === false, "Invalid-complete must not allow a complete claim.");
      assert(invalid.reasons.some((reason) => reason.code === "invalid-complete" && reason.message.includes("MODIFIED")), "Invalid-complete must preserve the delta diagnostic.");

      const stale = evaluateChangeState({
        changeId: "stale-change",
        selectedStrict: { scope: "selected-strict", status: "pass", diagnostic: "ok", attributableChangeId: "stale-change" },
        repositoryValidation: { scope: "repository", status: "pass", diagnostic: "ok", attributableChangeId: null },
        artifacts: { requiredArtifactsCurrent: true, checkedTasks: 1, totalTasks: 1, uncheckedTasks: 0, incompleteTaskIds: ["2.1"], staleTaskIds: ["2.1"], envelopeMismatchTaskIds: [] },
        ownership: { conflictFree: true, overlappingChangeIds: [], cycles: [] },
        evidence: { overLimit: false, unindexedFiles: [], retainedFiles: 1, retainedBytes: 10 },
      });
      assert(stale.localStatus === "incomplete" && stale.reasons.some((reason) => reason.code === "stale-task"), "Stale task must stay incomplete.");

      const weaker = evaluateChangeState(changeStateInputFromInventory(
        inventory,
        "weaker-desktop-restart",
        { scope: "selected-strict", status: "pass", diagnostic: "ok", attributableChangeId: "weaker-desktop-restart" },
        { scope: "repository", status: "pass", diagnostic: "ok", attributableChangeId: null },
      ));
      assert(weaker.completeClaimAllowed === false && weaker.reasons.some((reason) => reason.code === "weaker-entrypoint"), "Weaker entrypoint must block completion.");

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
        repositoryValidation: { scope: "repository", status: "fail", diagnostic: "unrelated delta invalid", attributableChangeId: "ceremony-invalid-complete" },
        artifacts: { requiredArtifactsCurrent: true, checkedTasks: 1, totalTasks: 1, uncheckedTasks: 0, incompleteTaskIds: [], staleTaskIds: [], envelopeMismatchTaskIds: [] },
        ownership: { conflictFree: true, overlappingChangeIds: [], cycles: [] },
        evidence: { overLimit: false, unindexedFiles: [], retainedFiles: 1, retainedBytes: 10 },
      });
      assert(unrelated.localStatus === "ready" && unrelated.repositoryStatus === "blocked" && unrelated.qualificationAllowed === false, "Unrelated failure must keep local facts and block repository qualification.");
      assert(unrelated.reasons.some((reason) => reason.code === "unrelated-failure" && reason.changeId === "ceremony-invalid-complete"), "Unrelated failure must name the other owner.");
    },
  },
  {
    name: "retention exception stays finite and evaluator-only failure routes replay without deletion",
    run: () => {
      const exception = parseEvidenceIndex(validEvidence({
        retention: {
          maxFiles: 64,
          maxBytes: 26214400,
          exception: { maxFiles: 80, maxBytes: 30_000_000, reason: "one material proof tree", cleanupRule: "owner archives lanes", validation: "inventory readback" },
        },
      }));
      assert(exception.ok, "Finite retention exception must parse.");
      const infinite = parseEvidenceIndex(validEvidence({
        retention: { maxFiles: 64, maxBytes: 26214400, exception: { maxFiles: 0, maxBytes: 1, reason: "x", cleanupRule: "y", validation: "z" } },
      }));
      assert(!infinite.ok, "Non-positive exception maxima must fail.");
      withTempDir("openspec-replay-route", (dir) => {
        const bundle = path.join(dir, "raw.json");
        writeText(bundle, "{\"ok\":true}");
        const before = fs.readFileSync(bundle, "utf8");
        const blocked = decideEvidenceAction({ overLimit: true, unindexed: false, evaluatorFailed: false, rawBundleTrustworthy: true, rawBundlePath: "raw.json" });
        assert(blocked.action === "block-capture" && blocked.deleted === false, "Over-limit must block capture and delete nothing.");
        const replay = decideEvidenceAction({ overLimit: false, unindexed: false, evaluatorFailed: true, rawBundleTrustworthy: true, rawBundlePath: "raw.json" });
        assert(replay.action === "replay" && replay.bundle === "raw.json" && replay.deleted === false, "Evaluator-only failure must route replay.");
        assert(!fs.existsSync(path.join(dir, "raw-replay")), "Replay must not create a duplicate capture directory.");
        assert(fs.readFileSync(bundle, "utf8") === before, "Replay routing must not delete the raw bundle.");
      });
    },
  },
  {
    name: "propose reports ownership and apply/qualification/archive block under enforcement",
    run: () => {
      const propose = ownershipEvidenceGateChecks({ root: fixtureRoot, operation: "propose", changeId: "restart-a", enforcement: "advisory" });
      assert(propose.some((check) => check.id === "ownership:report" && check.summary.includes("mutationEnabled=true")), "Propose must report ownership.");
      const apply = runOpenSpecOperationGate(fixtureRoot, { operation: "apply", changeId: "restart-a", generatedAt: "2026-08-21T00:00:00.000Z", enforcement: "blocking" });
      assert(apply.exitCode !== 0 && apply.checks.some((check) => check.id === "ownership:overlap" && check.blocking), "Apply must block unresolved overlap before mutation.");
      const qualification = ownershipEvidenceGateChecks({
        root: fixtureRoot,
        operation: "acceptance",
        changeId: "ceremony-invalid-complete",
        enforcement: "blocking",
        selectedStrict: { scope: "selected-strict", status: "fail", diagnostic: "MODIFIED requirement missing scenarios", attributableChangeId: "ceremony-invalid-complete" },
        repositoryValidation: { scope: "repository", status: "fail", diagnostic: "MODIFIED requirement missing scenarios", attributableChangeId: "ceremony-invalid-complete" },
      });
      assert(qualification.some((check) => check.id === "qualification:complete-claim" && check.blocking && check.status === "failed"), "Qualification must block a false complete claim.");
      const archive = archiveEvidenceBlocker(fixtureRoot, "weaker-desktop-restart", "blocking");
      assert(archive != null && archive.includes("weaker-desktop-restart"), "Archive must block stale or mismatched evidence before official archive.");
    },
  },
  {
    name: "advisory enforcement leaves archives untouched and unknown facts stay unknown",
    run: () => {
      withTempDir("openspec-enforcement-unknown", (dir) => {
        const archiveDir = path.join(dir, "openspec", "changes", "archive", "historical");
        writeText(path.join(archiveDir, "kept.md"), "historical");
        const before = fs.readFileSync(path.join(archiveDir, "kept.md"), "utf8");
        const advisory = doctorOwnershipEvidenceChecks(fixtureRoot, "advisory");
        assert(advisory[0]?.status === "warn" && advisory[0]?.blocksQualification === false, "Live default must remain advisory.");
        const unknown = ownershipEvidenceGateChecks({
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
