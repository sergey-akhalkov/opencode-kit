#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatBoundedFalsificationReview,
  inspectBoundedFalsificationReview,
  runOpenSpecOperationGate,
  type BoundedFalsificationReview,
} from "./openspec-operation-gate.ts";
import { parseOpenSpecArtifactMetadata } from "../global/bin/openspec-change/manifest.ts";

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
const COMPACT_OUTCOME_CAPSULE = OUTCOME_CAPSULE.filter((field) => field !== "Material Residual Risks");

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
  return `# Proposal\n\n## Why\n\nNeed change.\n\n### Outcome Capsule\n\n${fields}\n- **Delivery Horizon:** none - fixture is unrelated to a tracked delivery horizon.\n- **Automation Dividend**: exempt - fixture does not introduce repeated automation.\n- **Bounded Falsification Review**: exempt - exact Ordinary Small fixture.\n\n## Claim And Evidence Scope\n\n- **Claim And Evidence Scope**: Exact fixture claim at the fixture-boundary proof.\n${extra}`;
}

function compactProposal(extra = ""): string {
  const fields = COMPACT_OUTCOME_CAPSULE.map((field) => `- **${field}**: compact fixture value for ${field}.`).join("\n");
  return `# Proposal\n\n## Why\n\nNeed compact change.\n\n### Outcome Capsule\n\n${fields}\n${extra}`;
}

function writeArtifactMetadata(repo: string, changeId: string, artifactProfile: "compact" | "full", kind: "material" | "ordinary-small-exact" | "unknown"): void {
  writeText(path.join(repo, "openspec", "changes", changeId, ".openspec.yaml"), `schema: spec-driven\nartifactProfile: ${artifactProfile}\nriskDisposition:\n  kind: ${kind}\n`);
}

function writeCompactChange(repo: string, changeId: string, tasks = "- [ ] Do work.", proposal = compactProposal()): void {
  const changeRoot = path.join(repo, "openspec", "changes", changeId);
  writeArtifactMetadata(repo, changeId, "compact", "ordinary-small-exact");
  writeText(path.join(changeRoot, "proposal.md"), proposal);
  writeText(path.join(changeRoot, "tasks.md"), `# Tasks\n\n${tasks}\n`);
  writeText(path.join(changeRoot, "specs", "demo", "spec.md"), "# Demo\n");
}

function validFalsificationReview(overrides: Partial<BoundedFalsificationReview> = {}): BoundedFalsificationReview {
  const candidateRef = overrides.candidateRef ?? "candidate:demo-r1";
  const originalRequestRef = overrides.originalRequestRef ?? "event:request-r1";
  return {
    originalRequestRef,
    reviewedRequestRef: overrides.reviewedRequestRef ?? originalRequestRef,
    acceptedOutcomeRef: "outcome:proposal-capsule-r1",
    candidateRef,
    reviewedCandidateRef: overrides.reviewedCandidateRef ?? candidateRef,
    decisionSurface: "fixture-decision-surface",
    reviewerAgent: "implementation-readiness-reviewer",
    reviewerSessionRef: "session:review-r1",
    effectiveModel: "provider/model/variant",
    challengeCount: 1,
    attackClasses: [
      { id: "coherent-wrong-outcome", status: "attempted" },
      { id: "silent-owner-decision", status: "attempted" },
      { id: "missing-observable-oracle", status: "attempted" },
      { id: "late-implementation-invalidation", status: "attempted" },
      { id: "internal-contradiction", status: "attempted" },
      { id: "unnecessary-scope", status: "attempted" },
    ],
    materialFindings: [],
    mainDispositions: [],
    correctionRef: "none",
    invalidatedSurfaces: [],
    terminalReason: "no-material-finding",
    terminalState: "closed",
    unresolvedEvidence: [],
    ...overrides,
  };
}

function writeRequiredFalsificationReview(repo: string, changeId: string, review = validFalsificationReview()): void {
  const changeRoot = path.join(repo, "openspec", "changes", changeId);
  writeText(path.join(changeRoot, "proposal.md"), proposalWithCapsule().replace("exempt - exact Ordinary Small fixture.", "required - fixture-decision-surface"));
  writeText(path.join(changeRoot, "falsification-review.md"), formatBoundedFalsificationReview(review));
}

function broadClaimScope(omit?: string): string {
  const fields: Record<string, string> = {
    "Claim ID": "claim-fixture",
    "Claim Class": "finite-population",
    Population: "item-a and item-b",
    "Coverage Basis": "complete finite population",
    "Production Path": "production-path",
    "Comparison Paths": "none",
    Environment: "demo-env",
    "Real Oracle": "not required for this fixture",
    "Unresolved Observations": "none",
    "Maximum Claim": "the declared two-member population in demo-env",
  };
  return `\n${Object.entries(fields).filter(([name]) => name !== omit).map(([name, value]) => `- **${name}**: ${value}.`).join("\n")}\n`;
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
    name: "OpenSpec artifact metadata keeps profile and risk as independent explicit axes",
    run: () => {
      assertEqual(
        parseOpenSpecArtifactMetadata({ schema: "spec-driven" }),
        { ok: true, value: { artifactProfile: "legacy", riskDispositionKind: null } },
        "Both fields absent must normalize to legacy without inferring risk.",
      );
      for (const [artifactProfile, kind] of [
        ["compact", "ordinary-small-exact"],
        ["full", "ordinary-small-exact"],
        ["full", "material"],
        ["full", "unknown"],
      ] as const) {
        assertEqual(
          parseOpenSpecArtifactMetadata({ artifactProfile, riskDisposition: { kind } }),
          { ok: true, value: { artifactProfile, riskDispositionKind: kind } },
          `${artifactProfile}/${kind} must preserve both reviewed facts.`,
        );
      }
    },
  },
  {
    name: "OpenSpec artifact metadata rejects partial malformed conflicting and extra risk facts",
    run: () => {
      const cases = [
        [{ artifactProfile: "compact" }, ".openspec.yaml.riskDisposition"],
        [{ riskDisposition: { kind: "ordinary-small-exact" } }, ".openspec.yaml.artifactProfile"],
        [{ artifactProfile: "small", riskDisposition: { kind: "ordinary-small-exact" } }, ".openspec.yaml.artifactProfile"],
        [{ artifactProfile: "full", riskDisposition: "material" }, ".openspec.yaml.riskDisposition"],
        [{ artifactProfile: "full", riskDisposition: { kind: "maybe" } }, ".openspec.yaml.riskDisposition.kind"],
        [{ artifactProfile: "compact", riskDisposition: { kind: "ordinary-small-exact", evidence: "reviewed in proposal" } }, ".openspec.yaml.riskDisposition"],
        [{ artifactProfile: "compact", riskDisposition: { kind: "material" } }, ".openspec.yaml.artifactProfile"],
        [{ artifactProfile: "compact", riskDisposition: { kind: "unknown" } }, ".openspec.yaml.artifactProfile"],
      ] as const;
      for (const [metadata, issuePath] of cases) {
        const parsed = parseOpenSpecArtifactMetadata(metadata);
        assert(!parsed.ok && parsed.issues.some((issue) => issue.path === issuePath), `Expected exact metadata issue at ${issuePath}.`);
      }
    },
  },
  {
    name: "compact exact gates accept six-field artifacts without no-op mechanism records",
    run: () => withTempRepo("compact-exact", (repo) => {
      writeCompactChange(repo, "compact-open");
      for (const operation of ["propose", "apply"] as const) {
        const output = runOpenSpecOperationGate(repo, { operation, changeId: "compact-open", generatedAt });
        assert(output.exitCode === 0 && output.status !== "failed" && output.status !== "blocked" && output.status !== "unknown", `Expected compact ${operation} readiness, got ${output.status}: ${JSON.stringify(output.checks)}.`);
        for (const id of ["artifact:proposal-claim-scope", "artifact:strategy-history", "artifact:delivery-horizon", "artifact:automation-dividend", "artifact:bounded-falsification-declaration"]) {
          assert(output.checks.some((item) => item.id === id && item.status === "not-applicable"), `Compact ${operation} must report ${id} as not applicable.`);
        }
      }
      writeCompactChange(repo, "compact-done", "- [x] Done.");
      const archived = runOpenSpecOperationGate(repo, { operation: "archive", changeId: "compact-done", generatedAt });
      assert(archived.exitCode === 0 && archived.status === "passed", `Expected compact archive pass, got ${archived.status}.`);
    }),
  },
  {
    name: "full profile preserves ordinary and material behavior while unknown blocks mutation",
    run: () => withTempRepo("full-risk", (repo) => {
      for (const kind of ["ordinary-small-exact", "material"] as const) {
        const changeId = `full-${kind}`;
        writeChange(repo, changeId);
        writeArtifactMetadata(repo, changeId, "full", kind);
        const output = runOpenSpecOperationGate(repo, { operation: "apply", changeId, generatedAt });
        assert(output.exitCode === 0 && output.status === "passed", `Expected full/${kind} apply pass, got ${output.status}.`);
      }
      writeChange(repo, "full-unknown");
      writeArtifactMetadata(repo, "full-unknown", "full", "unknown");
      const proposed = runOpenSpecOperationGate(repo, { operation: "propose", changeId: "full-unknown", generatedAt });
      assert(proposed.exitCode === 0 && proposed.status === "warning", "Full/unknown proposal should preserve structural authoring with semantic warning.");
      const applied = runOpenSpecOperationGate(repo, { operation: "apply", changeId: "full-unknown", generatedAt });
      assert(applied.exitCode === 1 && applied.status === "blocked", "Full/unknown apply must block mutation.");
      const archived = runOpenSpecOperationGate(repo, { operation: "archive", changeId: "full-unknown", generatedAt });
      assert(archived.exitCode === 1 && archived.status === "blocked", "Full/unknown archive must block completion mutation.");
    }),
  },
  {
    name: "operation gates preserve exact metadata diagnostics and reject stale compact",
    run: () => withTempRepo("profile-negative", (repo) => {
      writeCompactChange(repo, "partial");
      writeText(path.join(repo, "openspec", "changes", "partial", ".openspec.yaml"), "schema: spec-driven\nartifactProfile: compact\n");
      const partial = runOpenSpecOperationGate(repo, { operation: "apply", changeId: "partial", generatedAt });
      assert(partial.exitCode === 1 && partial.checks.some((item) => item.id === "artifact:profile-risk-metadata" && item.summary.includes("riskDisposition is required")), "Partial metadata must fail for the exact missing counterpart.");

      writeCompactChange(repo, "conflict");
      writeArtifactMetadata(repo, "conflict", "compact", "material");
      const conflict = runOpenSpecOperationGate(repo, { operation: "apply", changeId: "conflict", generatedAt });
      assert(conflict.exitCode === 1 && conflict.checks.some((item) => item.id === "artifact:profile-risk-metadata" && item.summary.includes("conflicts")), "Compact/material must fail before artifact checks.");

      writeCompactChange(repo, "compact-unknown");
      writeArtifactMetadata(repo, "compact-unknown", "compact", "unknown");
      const compactUnknown = runOpenSpecOperationGate(repo, { operation: "apply", changeId: "compact-unknown", generatedAt });
      assert(compactUnknown.exitCode === 1 && compactUnknown.checks.some((item) => item.id === "artifact:profile-risk-metadata" && item.summary.includes("conflicts")), "Compact/unknown must fail before artifact checks.");

      writeCompactChange(repo, "malformed");
      writeText(path.join(repo, "openspec", "changes", "malformed", ".openspec.yaml"), "schema: spec-driven\nartifactProfile: compact\nriskDisposition: unknown\n");
      const malformed = runOpenSpecOperationGate(repo, { operation: "apply", changeId: "malformed", generatedAt });
      assert(malformed.exitCode === 1 && malformed.checks.some((item) => item.id === "artifact:profile-risk-metadata" && item.summary.includes("riskDisposition must be an object")), "Malformed risk metadata must preserve its exact structural cause.");

      writeCompactChange(repo, "stale", "- [ ] Do work.", compactProposal("\n- **Claim Class**: finite-population\n"));
      const stale = runOpenSpecOperationGate(repo, { operation: "apply", changeId: "stale", generatedAt });
      assert(stale.exitCode === 1 && stale.checks.some((item) => item.id === "artifact:compact-stale" && item.summary.includes("broad Claim Class")), "An explicit broad claim must make compact readiness stale.");
    }),
  },
  {
    name: "compact explicit mechanisms retain correlation and reject synthetic exemptions",
    run: () => withTempRepo("compact-mechanism", (repo) => {
      writeCompactChange(repo, "required-dividend", "- [ ] 1.1 [automation-dividend] Build helper.", compactProposal("\n- **Automation Dividend**: required - build helper\n"));
      const required = runOpenSpecOperationGate(repo, { operation: "apply", changeId: "required-dividend", generatedAt });
      assert(required.exitCode === 0 && required.checks.some((item) => item.id === "artifact:automation-dividend-task" && item.status === "passed"), "Explicit compact required dividend must retain task correlation.");

      writeCompactChange(repo, "synthetic-exempt", "- [ ] Do work.", compactProposal("\n- **Automation Dividend**: exempt - no repetition\n"));
      const exempt = runOpenSpecOperationGate(repo, { operation: "apply", changeId: "synthetic-exempt", generatedAt });
      assert(exempt.exitCode === 1 && exempt.checks.some((item) => item.id === "artifact:automation-dividend" && item.summary.includes("omit")), `Compact no-op exemptions must be rejected: ${JSON.stringify(exempt.checks)}.`);
    }),
  },
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
    name: "claim scope keeps exact proposals concise and validates only declared broad fields",
    run: () => withTempRepo("claim-scope", (repo) => {
      writeChange(repo, "exact-change");
      const exact = runOpenSpecOperationGate(repo, { operation: "propose", changeId: "exact-change", generatedAt });
      assert(exact.exitCode === 0 && exact.checks.some((item) => item.id === "artifact:proposal-claim-scope" && item.status === "passed" && item.summary.includes("no semantic breadth")), "Exact one-line claim scope must pass without prose classification.");

      writeChange(repo, "broad-change");
      writeText(path.join(repo, "openspec", "changes", "broad-change", "proposal.md"), proposalWithCapsule(broadClaimScope()));
      const broad = runOpenSpecOperationGate(repo, { operation: "propose", changeId: "broad-change", generatedAt });
      assert(broad.exitCode === 0 && broad.checks.some((item) => item.id === "artifact:proposal-claim-scope" && item.status === "passed"), "Complete explicit broad fields must pass proposal authoring.");

      writeChange(repo, "missing-real-oracle");
      writeText(path.join(repo, "openspec", "changes", "missing-real-oracle", "proposal.md"), proposalWithCapsule(broadClaimScope("Real Oracle")));
      const missing = runOpenSpecOperationGate(repo, { operation: "propose", changeId: "missing-real-oracle", generatedAt });
      const scope = missing.checks.find((item) => item.id === "artifact:proposal-claim-scope");
      assert(missing.exitCode === 1 && scope?.status === "failed", "A missing declared broad field must fail proposal readiness.");
      assert(scope.summary.includes("Real Oracle") && !scope.summary.includes("Population,"), "Broad-field diagnostic must name only the missing explicit field.");
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
  {
    name: "propose rejects missing, duplicate, and malformed automation dividends",
    run: () => withTempRepo("dividend-propose", (repo) => {
      writeChange(repo, "missing-div");
      writeText(path.join(repo, "openspec", "changes", "missing-div", "proposal.md"), proposalWithCapsule().replace("- **Automation Dividend**: exempt - fixture does not introduce repeated automation.\n", ""));
      const missing = runOpenSpecOperationGate(repo, { operation: "propose", changeId: "missing-div", generatedAt });
      assert(missing.exitCode === 1 && missing.checks.some((item) => item.id === "artifact:automation-dividend" && item.summary.includes("missing")), "Propose must reject a missing dividend.");

      writeChange(repo, "dup-div");
      writeText(path.join(repo, "openspec", "changes", "dup-div", "proposal.md"), `${proposalWithCapsule()}\n- **Automation Dividend**: required - another.\n`);
      const duplicate = runOpenSpecOperationGate(repo, { operation: "propose", changeId: "dup-div", generatedAt });
      assert(duplicate.exitCode === 1 && duplicate.checks.some((item) => item.id === "artifact:automation-dividend" && item.summary.includes("2")), "Propose must reject duplicate dividends.");

      writeChange(repo, "bad-div");
      writeText(path.join(repo, "openspec", "changes", "bad-div", "proposal.md"), proposalWithCapsule().replace("exempt - fixture does not introduce repeated automation.", "maybe later"));
      const malformed = runOpenSpecOperationGate(repo, { operation: "propose", changeId: "bad-div", generatedAt });
      assert(malformed.exitCode === 1 && malformed.checks.some((item) => item.id === "artifact:automation-dividend" && item.status === "failed"), "Propose must reject a malformed dividend.");
    }),
  },
  {
    name: "apply correlates one required dividend task and rejects exempt tagged tasks",
    run: () => withTempRepo("dividend-apply", (repo) => {
      writeChange(repo, "required-ok", "- [ ] 1.1 [automation-dividend] Snapshot.");
      writeText(path.join(repo, "openspec", "changes", "required-ok", "proposal.md"), proposalWithCapsule().replace("exempt - fixture does not introduce repeated automation.", "required - snapshot helper"));
      const ready = runOpenSpecOperationGate(repo, { operation: "apply", changeId: "required-ok", generatedAt });
      assert(ready.exitCode === 0 && ready.checks.some((item) => item.id === "artifact:automation-dividend-task" && item.status === "passed"), `Apply must accept one required dividend task, got ${ready.status}.`);

      writeChange(repo, "required-none", "- [ ] Product work.");
      writeText(path.join(repo, "openspec", "changes", "required-none", "proposal.md"), proposalWithCapsule().replace("exempt - fixture does not introduce repeated automation.", "required - snapshot helper"));
      const none = runOpenSpecOperationGate(repo, { operation: "apply", changeId: "required-none", generatedAt });
      assert(none.exitCode === 1 && none.checks.some((item) => item.id === "artifact:automation-dividend-task" && item.summary.includes("exactly one")), "Apply must reject a required declaration with zero tagged tasks.");

      writeChange(repo, "exempt-tagged", "- [ ] 1.1 [automation-dividend] Snapshot.");
      const exempt = runOpenSpecOperationGate(repo, { operation: "apply", changeId: "exempt-tagged", generatedAt });
      assert(exempt.exitCode === 1 && exempt.checks.some((item) => item.id === "artifact:automation-dividend-task" && item.summary.includes("Exempt")), "Apply must reject an exempt declaration with a tagged task.");
    }),
  },
  {
    name: "bounded falsification declaration rejects missing duplicate and malformed values",
    run: () => withTempRepo("falsification-declaration", (repo) => {
      writeChange(repo, "missing-review-declaration");
      const proposalPath = path.join(repo, "openspec", "changes", "missing-review-declaration", "proposal.md");
      writeText(proposalPath, proposalWithCapsule().replace("- **Bounded Falsification Review**: exempt - exact Ordinary Small fixture.\n", ""));
      const missing = runOpenSpecOperationGate(repo, { operation: "propose", changeId: "missing-review-declaration", generatedAt });
      assert(missing.exitCode === 1 && missing.checks.some((item) => item.id === "artifact:bounded-falsification-declaration" && item.summary.includes("missing")), "Propose must reject a missing bounded-falsification declaration.");

      writeChange(repo, "duplicate-review-declaration");
      const duplicatePath = path.join(repo, "openspec", "changes", "duplicate-review-declaration", "proposal.md");
      writeText(duplicatePath, `${proposalWithCapsule()}\n- **Bounded Falsification Review**: required - another surface.\n`);
      const duplicate = runOpenSpecOperationGate(repo, { operation: "propose", changeId: "duplicate-review-declaration", generatedAt });
      assert(duplicate.exitCode === 1 && duplicate.checks.some((item) => item.id === "artifact:bounded-falsification-declaration" && item.summary.includes("2")), "Propose must reject duplicate bounded-falsification declarations.");

      writeChange(repo, "malformed-review-declaration");
      const malformedPath = path.join(repo, "openspec", "changes", "malformed-review-declaration", "proposal.md");
      writeText(malformedPath, proposalWithCapsule().replace("exempt - exact Ordinary Small fixture.", "maybe later"));
      const malformed = runOpenSpecOperationGate(repo, { operation: "propose", changeId: "malformed-review-declaration", generatedAt });
      assert(malformed.exitCode === 1 && malformed.checks.some((item) => item.id === "artifact:bounded-falsification-declaration" && item.summary.includes("required - <decision surface>")), "Propose must reject malformed bounded-falsification declarations for the exact shape cause.");
    }),
  },
  {
    name: "bounded falsification record round-trips explicit facts and keeps semantics unknown",
    run: () => withTempRepo("falsification-roundtrip", (repo) => {
      const review = validFalsificationReview();
      const text = formatBoundedFalsificationReview(review);
      const inspected = inspectBoundedFalsificationReview(text);
      assert(inspected.status === "ok" && inspected.semanticReadiness === "unknown", "Structurally valid review must round-trip without deterministic semantic inference.");
      if (inspected.status !== "ok") return;
      assertEqual(inspected.value, review, "Bounded-falsification review readback must preserve every explicit fact.");

      writeChange(repo, "required-current");
      writeRequiredFalsificationReview(repo, "required-current", review);
      const current = runOpenSpecOperationGate(repo, { operation: "apply", changeId: "required-current", generatedAt });
      const record = current.checks.find((item) => item.id === "artifact:bounded-falsification-record");
      assert(current.exitCode === 0 && record?.status === "passed" && record.summary.includes("semantic readiness remains unknown"), `Current structural record must pass without a semantic verdict, got ${current.status}.`);

      writeChange(repo, "required-missing");
      writeText(path.join(repo, "openspec", "changes", "required-missing", "proposal.md"), proposalWithCapsule().replace("exempt - exact Ordinary Small fixture.", "required - fixture-decision-surface"));
      const missing = runOpenSpecOperationGate(repo, { operation: "apply", changeId: "required-missing", generatedAt });
      assert(missing.status === "warning" && missing.checks.some((item) => item.id === "artifact:bounded-falsification-record" && item.summary.includes("semantic readiness is unknown")), "Missing required record must preserve structural apply with semantic readiness unknown.");

      writeChange(repo, "exempt-with-record");
      writeText(path.join(repo, "openspec", "changes", "exempt-with-record", "falsification-review.md"), text);
      const exempt = runOpenSpecOperationGate(repo, { operation: "apply", changeId: "exempt-with-record", generatedAt });
      assert(exempt.exitCode === 1 && exempt.checks.some((item) => item.id === "artifact:bounded-falsification-record" && item.summary.includes("must not create")), "Exempt declaration must reject a synthetic review record.");
    }),
  },
  {
    name: "bounded falsification record rejects stale private over-budget missing and semantic inference facts",
    run: () => withTempRepo("falsification-negative", (repo) => {
      const cases = [
        ["stale-candidate", formatBoundedFalsificationReview(validFalsificationReview({ reviewedCandidateRef: "candidate:stale-r0" })), "stale for Candidate Ref"],
        ["over-budget", formatBoundedFalsificationReview(validFalsificationReview({ challengeCount: 3 })), "two-challenge ceiling"],
        ["private-request", formatBoundedFalsificationReview(validFalsificationReview()).replace("event:request-r1", "Please transfer the private production data"), "privacy-safe reference"],
        ["missing-terminal", formatBoundedFalsificationReview(validFalsificationReview()).replace(/^- \*\*Terminal State\*\*:.*\n/mu, ""), "missing required field(s): Terminal State"],
        ["semantic-inference", `${formatBoundedFalsificationReview(validFalsificationReview())}- **Semantic Materiality**: material\n`, "semantic materiality and task fit remain unknown"],
      ] as const;
      for (const [changeId, text, cause] of cases) {
        writeChange(repo, changeId);
        writeRequiredFalsificationReview(repo, changeId);
        writeText(path.join(repo, "openspec", "changes", changeId, "falsification-review.md"), text);
        const output = runOpenSpecOperationGate(repo, { operation: "apply", changeId, generatedAt });
        const record = output.checks.find((item) => item.id === "artifact:bounded-falsification-record");
        assert(output.exitCode === 1 && record?.status === "failed" && record.summary.includes(cause), `${changeId} must fail for exact cause '${cause}', got '${record?.summary ?? "missing check"}'.`);
      }
    }),
  },
  {
    name: "bounded falsification record covers terminal disposition correction and reuse states",
    run: () => {
      const inspect = (overrides: Partial<BoundedFalsificationReview>) =>
        inspectBoundedFalsificationReview(formatBoundedFalsificationReview(validFalsificationReview(overrides)));

      assert(inspect({}).status === "ok", "No-material-finding must remain a valid closed terminal state.");
      for (const status of ["falsified", "unreachable", "optional", "polish"] as const) {
        const parked = inspect({
          materialFindings: ["F1"],
          mainDispositions: [{ findingId: "F1", status }],
          terminalReason: `${status}-without-work`,
        });
        assert(parked.status === "ok", `${status} must not require correction or successor-review state.`);
      }

      const confirmedCorrection = {
        materialFindings: ["F1"],
        mainDispositions: [{ findingId: "F1", status: "confirmed" as const }],
        correctionRef: "correction:fixture-r2",
      };
      assert(inspect({
        ...confirmedCorrection,
        invalidatedSurfaces: ["outcome"],
        terminalReason: "corrected-surface-awaits-rereview",
        terminalState: "unknown",
        unresolvedEvidence: ["corrected-rereview"],
      }).status === "ok", "A first correction may await re-review only after recording challenged-surface invalidation.");
      assert(inspect({
        ...confirmedCorrection,
        challengeCount: 2,
        invalidatedSurfaces: ["outcome"],
        terminalReason: "corrected-rereview-closed",
      }).status === "ok", "One corrected-candidate re-review must close with challenge count two.");

      const unknownAttacks = validFalsificationReview().attackClasses.map((item) => ({ ...item, status: "unknown" as const }));
      assert(inspect({
        reviewerSessionRef: "none",
        effectiveModel: "unknown",
        challengeCount: 0,
        attackClasses: unknownAttacks,
        terminalReason: "reviewer-unavailable",
        terminalState: "unknown",
        unresolvedEvidence: ["reviewer-unavailable"],
      }).status === "ok", "Unavailable review must remain an explicit unknown state.");

      const unchanged = formatBoundedFalsificationReview(validFalsificationReview());
      assertEqual(
        inspectBoundedFalsificationReview(unchanged),
        inspectBoundedFalsificationReview(unchanged),
        "An unchanged candidate record must be reusable without changing its terminal state.",
      );
    },
  },
  {
    name: "bounded falsification record rejects impossible lifecycle transitions with exact causes",
    run: () => {
      const unknownAttacks = validFalsificationReview().attackClasses.map((item) => ({ ...item, status: "unknown" as const }));
      const cases: Array<{ review: BoundedFalsificationReview; reason: string }> = [
        {
          review: validFalsificationReview({
            materialFindings: ["F1"],
            mainDispositions: [{ findingId: "F1", status: "confirmed" }],
          }),
          reason: "A confirmed material finding requires a Correction Ref.",
        },
        {
          review: validFalsificationReview({ correctionRef: "correction:fixture-r2" }),
          reason: "Correction Ref requires at least one confirmed material finding.",
        },
        {
          review: validFalsificationReview({ invalidatedSurfaces: ["outcome"] }),
          reason: "Invalidated Surfaces require a Correction Ref.",
        },
        {
          review: validFalsificationReview({
            challengeCount: 2,
            materialFindings: ["F1"],
            mainDispositions: [{ findingId: "F1", status: "confirmed" }],
            correctionRef: "correction:fixture-r2",
          }),
          reason: "Challenge Count 2 requires a confirmed correction that invalidated a challenged surface.",
        },
        {
          review: validFalsificationReview({
            reviewerSessionRef: "none",
            effectiveModel: "unknown",
            challengeCount: 0,
            attackClasses: unknownAttacks,
            materialFindings: ["F1"],
            mainDispositions: [{ findingId: "F1", status: "falsified" }],
            terminalReason: "reviewer-unavailable",
            terminalState: "unknown",
            unresolvedEvidence: ["reviewer-unavailable"],
          }),
          reason: "Challenge Count 0 cannot contain findings, dispositions, correction, or invalidation.",
        },
        {
          review: validFalsificationReview({ terminalState: "unknown" }),
          reason: "Terminal State unknown requires Unresolved Evidence.",
        },
      ];

      for (const testCase of cases) {
        const inspected = inspectBoundedFalsificationReview(formatBoundedFalsificationReview(testCase.review));
        assert(inspected.status === "invalid", `Expected invalid transition: ${testCase.reason}`);
        if (inspected.status === "invalid") {
          assertEqual(inspected.reason, testCase.reason, "Impossible transition must preserve its exact cause.");
        }
      }
    },
  },
  {
    name: "CLI help is effect-free",
    run: () => {
      const result = spawnSync("node", [gate, "--help"], { cwd: root, encoding: "utf8", shell: false });
      if (result.error) throw result.error;
      assert(result.status === 0 && (result.stdout ?? "").includes("Usage: openspec-operation-gate"), `Help must exit zero without project or provider state, stderr=${result.stderr ?? ""}.`);
    },
  },
  {
    name: "archive fails incomplete required dividend facts and allows current exempt",
    run: () => withTempRepo("dividend-archive", (repo) => {
      writeChange(repo, "exempt-done", "- [x] Product work.");
      const exempt = runOpenSpecOperationGate(repo, { operation: "archive", changeId: "exempt-done", generatedAt });
      assert(exempt.checks.some((item) => item.id === "artifact:automation-dividend-task" && item.status === "passed"), "Exempt archive must accept no tagged task.");

      writeChange(repo, "required-unchecked", "- [ ] 1.1 [automation-dividend] Snapshot.\n- [x] Product work.");
      writeText(path.join(repo, "openspec", "changes", "required-unchecked", "proposal.md"), proposalWithCapsule().replace("exempt - fixture does not introduce repeated automation.", "required - snapshot helper"));
      const unchecked = runOpenSpecOperationGate(repo, { operation: "archive", changeId: "required-unchecked", generatedAt });
      assert(unchecked.exitCode === 1 && unchecked.checks.some((item) => item.id === "archive:automation-dividend" && item.summary.includes("unchecked")), "Archive must fail an unchecked required dividend.");

      writeChange(repo, "required-current", "- [x] 1.1 [automation-dividend] Snapshot.\n- [x] Product work.");
      writeText(path.join(repo, "openspec", "changes", "required-current", "proposal.md"), proposalWithCapsule().replace("exempt - fixture does not introduce repeated automation.", "required - snapshot helper"));
      const current = runOpenSpecOperationGate(repo, { operation: "archive", changeId: "required-current", generatedAt });
      assert(current.checks.some((item) => item.id === "archive:automation-dividend" && item.status === "passed"), `Checked required dividend must pass archive, got ${current.status} ${current.checks.find((item) => item.id === "archive:automation-dividend")?.summary ?? ""}`);
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
