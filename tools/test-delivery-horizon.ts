#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  DeliveryHorizonError,
  deliveryHorizonRelativePath,
  loadDeliveryHorizon,
  materializeTrajectoryReviewReceipt,
  parseDeliveryHorizon,
  parseDeliveryHorizonDeclaration,
  parseTrajectoryReviewReceipt,
  readTrajectoryReferenceIdentities,
  readTrajectoryReferenceIdentity,
  readTrajectoryReviewReceipt,
  trajectoryDecisionContextDigest,
  trajectoryReviewReceiptKey,
  trajectoryTriggerEvidenceDigest,
  type DeliveryHorizon,
  type TrajectoryReviewReceipt,
} from "../global/bin/openspec-change/delivery-horizon.ts";
import { runOpenSpecOperationGate } from "./openspec-operation-gate.ts";

type TestCase = { name: string; run: () => void };

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function writeText(filePath: string, text: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text.replaceAll("\r\n", "\n"), "utf8");
}

function tempProject(name: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), `delivery-horizon-${name}-`));
}

function horizon(id = "phase-one"): DeliveryHorizon {
  return {
    schemaVersion: 1,
    id,
    windowStart: "2026-08-01T00:00:00Z",
    usefulBy: "2026-10-01T00:00:00.000Z",
    outcomeRefs: ["docs/outcome.md"],
    exitPredicateRefs: ["docs/exit.md"],
    nonDeferrableInvariantRefs: ["docs/invariants.md"],
    nonGoalRefs: ["docs/non-goals.md"],
  };
}

function seedHorizon(root: string, value = horizon()): void {
  writeText(path.join(root, "docs/outcome.md"), "# Outcome\n");
  writeText(path.join(root, "docs/exit.md"), "# Exit\n");
  writeText(path.join(root, "docs/invariants.md"), "# Invariants\n");
  writeText(path.join(root, "docs/non-goals.md"), "# Non-Goals\n");
  writeText(path.join(root, deliveryHorizonRelativePath(value.id)), `${JSON.stringify(value, null, 2)}\n`);
}

function proposal(declaration?: string): string {
  const fields = [
    "Outcome",
    "Operating Envelope",
    "Non-Goals",
    "Non-Deferrable Invariants",
    "Observable Proof",
    "Material Residual Risks",
    "Stop Line",
  ].map((field) => `- **${field}**: fixture ${field}.`).join("\n");
  const horizonLine = declaration == null ? "" : `${declaration}\n`;
  return `# Proposal\n\n## Why\n\nFixture.\n\n### Outcome Capsule\n\n${fields}\n${horizonLine}- **Automation Dividend**: exempt - one-off fixture.\n- **Bounded Falsification Review**: exempt - exact Ordinary Small fixture.\n\n## Claim And Evidence Scope\n\n- **Claim And Evidence Scope**: Exact fixture claim at the local gate boundary.\n`;
}

function seedChange(root: string, changeId: string, declaration?: string): void {
  const changeRoot = path.join(root, "openspec/changes", changeId);
  writeText(path.join(changeRoot, "proposal.md"), proposal(declaration));
  writeText(path.join(changeRoot, "tasks.md"), "# Tasks\n\n- [ ] 1.1 Fixture task.\n");
  writeText(path.join(changeRoot, "history.md"), "# Strategy History\n");
  writeText(path.join(changeRoot, "specs/demo/spec.md"), "## ADDED Requirements\n\n### Requirement: Demo\n");
}

function expectDeliveryError(run: () => unknown, code: DeliveryHorizonError["code"], message: string): void {
  let captured: unknown;
  try {
    run();
  } catch (error) {
    captured = error;
  }
  assert(captured instanceof DeliveryHorizonError && captured.code === code, `${message}: ${String(captured)}`);
}

function receipt(root: string): TrajectoryReviewReceipt {
  writeText(path.join(root, "openspec/changes/archive/2026-08-29-demo/proposal.md"), "# Archived Demo\n");
  writeText(path.join(root, "docs/trigger.md"), "# Trigger Evidence\n");
  const decisionContext = readTrajectoryReferenceIdentities(root, [
    deliveryHorizonRelativePath("phase-one"),
    "docs/outcome.md",
  ]);
  const triggerEvidence = readTrajectoryReferenceIdentities(root, ["docs/trigger.md"]);
  const decisionContextDigest = trajectoryDecisionContextDigest(decisionContext);
  const triggerEvidenceDigest = trajectoryTriggerEvidenceDigest(triggerEvidence);
  return {
    schemaVersion: 1,
    horizonId: "phase-one",
    archiveIdentity: {
      archiveId: "2026-08-29-demo",
      archiveRef: "openspec/changes/archive/2026-08-29-demo/proposal.md",
      contentDigest: readTrajectoryReferenceIdentity(root, "openspec/changes/archive/2026-08-29-demo/proposal.md").contentDigest,
    },
    reviewedAt: "2026-08-29T03:00:00Z",
    decisionContext,
    triggerEvidence,
    decisionContextDigest,
    triggerEvidenceDigest,
    receiptKey: trajectoryReviewReceiptKey("phase-one", decisionContextDigest, triggerEvidenceDigest),
    triggerClass: "repeated-item-touch",
    costObservations: {
      engineeringSetup: "Repeated setup is available.",
      proofValidation: "Per-member proof remains required.",
      externalRuntime: "External runtime is unknown.",
      coordinationRecovery: "No recovery cost observed.",
      contextComprehension: "Shared context owner is available.",
    },
    forecast: {
      status: "unknown",
      assumptions: [],
      uncertainty: "Duration evidence is unavailable.",
    },
    disposition: "replan-outcome-preserving",
    successorRef: "openspec/changes/trajectory-successor/proposal.md",
    uncertainty: "One reviewed fixture only.",
    doNotRepeatCondition: "Do not repeat for unchanged reviewed evidence.",
    retryCondition: "Retry after materially changed trigger evidence.",
  };
}

const tests: TestCase[] = [
  {
    name: "horizon schema loads exact contained references and rejects invalid variants",
    run() {
      const root = tempProject("schema");
      try {
        seedHorizon(root);
        const loaded = loadDeliveryHorizon(root, "phase-one");
        assert(loaded.id === "phase-one" && loaded.outcomeRefs[0] === "docs/outcome.md", "valid horizon roundtrip");

        expectDeliveryError(() => parseDeliveryHorizon({ ...horizon(), schemaVersion: 2 }), "unsupported", "unsupported schema");
        expectDeliveryError(() => parseDeliveryHorizon({ ...horizon(), id: "other" }, "phase-one"), "conflict", "contradictory path id");
        expectDeliveryError(() => parseDeliveryHorizon({ ...horizon(), usefulBy: horizon().windowStart }), "conflict", "contradictory window");
        expectDeliveryError(() => parseDeliveryHorizon({ ...horizon(), outcomeRefs: ["../outside.md"] }), "escape", "escaping reference");
        expectDeliveryError(() => parseDeliveryHorizon({ ...horizon(), outcomeRefs: ["docs/outcome.md"], exitPredicateRefs: ["docs/outcome.md"] }), "conflict", "duplicate reference");

        writeText(path.join(root, deliveryHorizonRelativePath("phase-one")), "{ malformed\n");
        expectDeliveryError(() => loadDeliveryHorizon(root, "phase-one"), "invalid", "malformed JSON");
        writeText(path.join(root, deliveryHorizonRelativePath("phase-one")), `${JSON.stringify({ ...horizon(), outcomeRefs: ["docs/missing.md"] })}\n`);
        expectDeliveryError(() => loadDeliveryHorizon(root, "phase-one"), "unreadable", "missing reference");

        const outside = path.join(root, "linked-source");
        fs.mkdirSync(outside);
        writeText(path.join(outside, "outcome.md"), "# Linked\n");
        const link = path.join(root, "linked-docs");
        fs.symlinkSync(outside, link, process.platform === "win32" ? "junction" : "dir");
        writeText(path.join(root, deliveryHorizonRelativePath("phase-one")), `${JSON.stringify({ ...horizon(), outcomeRefs: ["linked-docs/outcome.md"] })}\n`);
        expectDeliveryError(() => loadDeliveryHorizon(root, "phase-one"), "escape", "symlink reference");
      } finally {
        fs.rmSync(root, { force: true, recursive: true });
      }
    },
  },
  {
    name: "proposal linkage distinguishes linked none legacy duplicate and malformed declarations",
    run() {
      assert(parseDeliveryHorizonDeclaration("- **Delivery Horizon:** phase-one\n").status === "linked", "linked declaration");
      assert(parseDeliveryHorizonDeclaration("- **Delivery Horizon:** none - unrelated local work\n").status === "none", "none declaration");
      assert(parseDeliveryHorizonDeclaration("# Legacy\n").status === "legacy-unlinked", "legacy declaration");
      assert(parseDeliveryHorizonDeclaration("- **Delivery Horizon:** phase-one\n- **Delivery Horizon:** phase-two\n").status === "duplicate", "duplicate declaration");
      assert(parseDeliveryHorizonDeclaration("- **Delivery Horizon:** none\n").status === "malformed", "malformed none declaration");
      assert(parseDeliveryHorizonDeclaration("- **Delivery Horizon** phase-one\n").status === "malformed", "malformed shape declaration");
    },
  },
  {
    name: "operation gate requires new linkage and preserves legacy apply readback",
    run() {
      const root = tempProject("gate");
      try {
        seedHorizon(root);
        seedChange(root, "linked", "- **Delivery Horizon:** phase-one");
        seedChange(root, "none", "- **Delivery Horizon:** none - unrelated fixture");
        seedChange(root, "legacy");
        seedChange(root, "unknown", "- **Delivery Horizon:** absent-horizon");
        seedChange(root, "duplicate", "- **Delivery Horizon:** phase-one\n- **Delivery Horizon:** phase-one");
        seedChange(root, "malformed", "- **Delivery Horizon:** none");

        const horizonCheck = (changeId: string, operation: "propose" | "apply") => runOpenSpecOperationGate(root, {
          changeId,
          generatedAt: "2026-08-29T03:00:00Z",
          operation,
        }).checks.find((check) => check.id === "artifact:delivery-horizon");
        assert(horizonCheck("linked", "propose")?.status === "passed", "linked proposal gate");
        assert(horizonCheck("none", "propose")?.status === "passed", "none proposal gate");
        assert(horizonCheck("legacy", "apply")?.status === "passed" && horizonCheck("legacy", "apply")?.summary.includes("legacy-unlinked"), "legacy apply gate");
        assert(horizonCheck("legacy", "propose")?.status === "failed", "legacy propose gate");
        assert(horizonCheck("unknown", "propose")?.status === "failed", "unknown horizon gate");
        assert(horizonCheck("duplicate", "propose")?.status === "failed", "duplicate horizon gate");
        assert(horizonCheck("malformed", "propose")?.status === "failed", "malformed horizon gate");
      } finally {
        fs.rmSync(root, { force: true, recursive: true });
      }
    },
  },
  {
    name: "review receipt key excludes volatile metadata and immutable readback survives later source drift",
    run() {
      const root = tempProject("receipt");
      try {
        seedHorizon(root);
        const current = receipt(root);
        const parsed = parseTrajectoryReviewReceipt(current);
        assert(parsed.receiptKey === current.receiptKey, "receipt parse roundtrip");

        writeText(path.join(root, "openspec/changes/archive/2026-08-30-demo/proposal.md"), "# Later Archive\n");
        const laterArchive = readTrajectoryReferenceIdentity(root, "openspec/changes/archive/2026-08-30-demo/proposal.md");
        const volatile = parseTrajectoryReviewReceipt({
          ...current,
          archiveIdentity: { archiveId: "2026-08-30-demo", archiveRef: laterArchive.ref, contentDigest: laterArchive.contentDigest },
          reviewedAt: "2026-08-30T03:00:00Z",
          triggerClass: "shared-owner-fan-out",
          uncertainty: "Changed model prose only.",
        });
        assert(volatile.receiptKey === current.receiptKey, "volatile metadata must not change receipt identity");

        writeText(path.join(root, "docs/trigger-2.md"), "# Changed Trigger Evidence\n");
        const changedEvidence = readTrajectoryReferenceIdentities(root, ["docs/trigger.md", "docs/trigger-2.md"]);
        const changedTriggerDigest = trajectoryTriggerEvidenceDigest(changedEvidence);
        const changedKey = trajectoryReviewReceiptKey(current.horizonId, current.decisionContextDigest, changedTriggerDigest);
        assert(changedKey !== current.receiptKey, "changed trigger evidence must change receipt identity");

        const materialized = materializeTrajectoryReviewReceipt(root, current);
        assert(materialized.relativePath.endsWith(`${current.receiptKey}.json`), "receipt key filename");
        assert(!fs.existsSync(path.join(root, current.successorRef!)), "receipt must not require a not-yet-authored successor");
        expectDeliveryError(() => materializeTrajectoryReviewReceipt(root, current), "exists", "immutable create-new receipt");

        writeText(path.join(root, "docs/trigger.md"), "# Trigger Evidence Changed Later\n");
        const historical = readTrajectoryReviewReceipt(root, current.horizonId, current.receiptKey);
        assert(historical.receiptKey === current.receiptKey, "historical receipt readback must not depend on current mutable source bytes");
        const staleCandidate = { ...current, receiptKey: crypto.createHash("sha256").update("stale-candidate").digest("hex") };
        expectDeliveryError(() => materializeTrajectoryReviewReceipt(root, staleCandidate), "conflict", "stale current evidence");

        expectDeliveryError(() => parseTrajectoryReviewReceipt({ ...current, schemaVersion: 2 }), "unsupported", "unsupported receipt schema");
        expectDeliveryError(() => parseTrajectoryReviewReceipt({ ...current, triggerClass: "none" }), "conflict", "no-trigger receipt");
        expectDeliveryError(() => parseTrajectoryReviewReceipt({ ...current, disposition: "continue", successorRef: "openspec/changes/next/proposal.md" }), "conflict", "contradictory successor");
        expectDeliveryError(() => parseTrajectoryReviewReceipt({ ...current, successorRef: null }), "conflict", "missing planned successor");
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

if (failed > 0) throw new Error(`${failed} Delivery Horizon test(s) failed.`);
console.log(`OK: Delivery Horizon tests=${tests.length}`);
