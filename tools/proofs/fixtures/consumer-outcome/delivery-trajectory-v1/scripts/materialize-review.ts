import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const configDir = process.env.OPENCODE_CONFIG_DIR;
if (configDir == null || configDir.trim() === "") throw new Error("OPENCODE_CONFIG_DIR is unavailable");
const caseId = process.argv[2];
if (caseId !== "configured-repeated-touch-successor") throw new Error("receipt materialization is allowed only for the repeated-touch case");
const api = await import(pathToFileURL(path.join(configDir, "bin", "openspec-change", "delivery-horizon.ts")).href);
const archive = JSON.parse(fs.readFileSync(path.join(root, "archive-result.json"), "utf8"));
const archiveRef = `openspec/changes/archive/${archive.archivedAs}/proposal.md`;
const decisionContext = api.readTrajectoryReferenceIdentities(root, [
  "openspec/delivery-horizons/phase-fixture/horizon.json",
  "docs/outcome.md",
  "docs/exit.md",
  "docs/invariants.md",
  "docs/non-goals.md"
]);
const triggerEvidence = api.readTrajectoryReferenceIdentities(root, ["docs/repeated-touch.md"]);
const decisionContextDigest = api.trajectoryDecisionContextDigest(decisionContext);
const triggerEvidenceDigest = api.trajectoryTriggerEvidenceDigest(triggerEvidence);
const receipt = {
  schemaVersion: 1,
  horizonId: "phase-fixture",
  archiveIdentity: {
    archiveId: archive.archivedAs,
    archiveRef,
    contentDigest: api.readTrajectoryReferenceIdentity(root, archiveRef).contentDigest,
  },
  reviewedAt: "2026-08-29T00:00:00.000Z",
  decisionContext,
  triggerEvidence,
  decisionContextDigest,
  triggerEvidenceDigest,
  receiptKey: api.trajectoryReviewReceiptKey("phase-fixture", decisionContextDigest, triggerEvidenceDigest),
  triggerClass: "repeated-item-touch",
  costObservations: {
    engineeringSetup: "Repeated item-specific setup is available around one shared fixture mechanism.",
    proofValidation: "Per-item proof remains irreducible and unchanged.",
    externalRuntime: "No external runtime work exists in this disposable case.",
    coordinationRecovery: "One same-Horizon successor owns the setup change.",
    contextComprehension: "The shared fixture mechanism is explicitly named in current evidence."
  },
  forecast: {
    status: "at-risk",
    assumptions: ["Repeated setup continues unchanged for the remaining fixture item."],
    uncertainty: "This synthetic case does not establish a calendar duration."
  },
  disposition: "replan-outcome-preserving",
  successorRef: "openspec/changes/trajectory-successor/proposal.md",
  uncertainty: "Evidence is bounded to one reviewed disposable repeated-touch case.",
  doNotRepeatCondition: "Do not repeat for unchanged decision and trigger evidence.",
  retryCondition: "Retry only after materially changed trigger evidence."
};
const materialized = api.materializeTrajectoryReviewReceipt(root, receipt);
fs.writeFileSync(path.join(root, "receipt-result.json"), `${JSON.stringify(materialized, null, 2)}\n`, "utf8");
console.log(JSON.stringify(materialized));
