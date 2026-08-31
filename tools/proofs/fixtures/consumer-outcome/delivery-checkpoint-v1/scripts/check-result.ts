import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const result = JSON.parse(fs.readFileSync(path.join(root, "checkpoint-result.json"), "utf8"));
const canary = JSON.parse(fs.readFileSync(path.join(root, "canary-result.json"), "utf8"));
const expected = {
  schemaVersion: 1,
  checkpointId: "late-validation-manifest-cache-r1",
  checkpointStatus: "recorded",
  triggerRef: "materially-different-failures-same-costly-late-boundary",
  selectedRoute: "earlier-manifest-cache-canary",
  nextOracle: "canary-result.json:passed",
  outcomeRef: "twelve-reviewed-local-reports",
  envelopeRef: "disposable-local-fixture",
  oracleRef: "unchanged-twelve-report-late-validation",
  populationRef: "twelve-report-population-r1",
  nonDeferrableInvariants: ["no-population-reduction", "no-proof-weakening", "no-protected-action"],
  checkpointCount: 1,
  costlyActionRepeatCount: 0,
  productQuestionCount: 0,
  protectedActionCount: 0,
  duplicateDisposition: "suppressed-unchanged-evidence",
  events: [
    "trigger-detected:different-failures-same-costly-late-boundary",
    "checkpoint-recorded:late-validation-manifest-cache-r1",
    "route-selected:earlier-manifest-cache-canary",
    "scope-oracle-population:unchanged",
    "costly-action-repeat-count:0",
    "protected-boundary:unchanged",
    "autonomous-continuation:canary",
    "duplicate-suppressed:unchanged-evidence",
    "cleanup-ready:proof-owned-fixture"
  ]
};
if (JSON.stringify(result) !== JSON.stringify(expected)) throw new Error("checkpoint result does not match the exact reviewed contract");
if (JSON.stringify(canary) !== JSON.stringify({
  boundary: "manifest-and-cache-preflight",
  preservedPopulation: "twelve-report-population-r1",
  status: "passed",
})) throw new Error("earlier canary result does not preserve the reviewed population");
console.log(JSON.stringify({
  canary: canary.status,
  checkpointCount: result.checkpointCount,
  costlyActionRepeatCount: result.costlyActionRepeatCount,
  duplicateDisposition: result.duplicateDisposition,
  eventCount: result.events.length,
  productQuestionCount: result.productQuestionCount,
  protectedActionCount: result.protectedActionCount,
  scopeOraclePopulation: "unchanged"
}));
