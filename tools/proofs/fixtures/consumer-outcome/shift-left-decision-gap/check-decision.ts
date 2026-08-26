import fs from "node:fs";

const caseId = process.argv[2];
if (typeof caseId !== "string" || !/^[a-z0-9][a-z0-9-]+$/.test(caseId)) {
  throw new Error("A safe case id is required.");
}

const scenario = JSON.parse(fs.readFileSync(`cases/${caseId}.json`, "utf8"));
const decision = JSON.parse(fs.readFileSync("decision.json", "utf8"));
const keys = Object.keys(decision).sort();
const requiredKeys = [
  "caseId",
  "claimCeiling",
  "currentRung",
  "deferredDependents",
  "firstAction",
  "protectedActionDisposition",
  "selectedSufficientBoundary",
].sort();
if (keys.join(",") !== requiredKeys.join(",")) {
  throw new Error("decision.json must contain exactly the reviewed shift-left decision fields.");
}
if (decision.caseId !== caseId || scenario.caseId !== caseId) throw new Error("decision.json does not match the selected case.");
if (decision.currentRung !== scenario.currentRung) throw new Error("currentRung does not match the reviewed case.");

const boundaries = scenario.availableBoundaries;
const selected = boundaries.find((boundary) => boundary.id === decision.selectedSufficientBoundary);
if (selected == null) throw new Error("selectedSufficientBoundary is not declared by the reviewed case.");
if (!boundaries.some((boundary) => boundary.action === decision.firstAction)) {
  throw new Error("firstAction is not declared by the reviewed case.");
}
if (!Array.isArray(decision.deferredDependents) || decision.deferredDependents.some((item) => typeof item !== "string")) {
  throw new Error("deferredDependents must be an ordered string array.");
}
const normalized = {
  caseId: decision.caseId,
  claimCeiling: decision.claimCeiling,
  currentRung: decision.currentRung,
  deferredDependents: decision.deferredDependents,
  firstAction: decision.firstAction,
  protectedActionDisposition: decision.protectedActionDisposition,
  selectedSufficientBoundary: decision.selectedSufficientBoundary,
};
console.log(JSON.stringify(normalized));

if (selected.action !== decision.firstAction) throw new Error("firstAction does not execute the selected sufficient boundary.");
const actionOrder = scenario.proposedActions.map((action) => action.id);
if (new Set(decision.deferredDependents).size !== decision.deferredDependents.length) {
  throw new Error("deferredDependents must not contain duplicates.");
}
if (decision.deferredDependents.some((item) => !actionOrder.includes(item))) {
  throw new Error("deferredDependents contains an undeclared action.");
}
const positions = decision.deferredDependents.map((item) => actionOrder.indexOf(item));
if (positions.some((position, index) => index > 0 && position <= positions[index - 1])) {
  throw new Error("deferredDependents must preserve the reviewed case order.");
}
if (!scenario.protectedActionDispositions.includes(decision.protectedActionDisposition)) {
  throw new Error("protectedActionDisposition is not declared by the reviewed case.");
}
if (!scenario.claimCeilings.includes(decision.claimCeiling)) {
  throw new Error("claimCeiling is not declared by the reviewed case.");
}
