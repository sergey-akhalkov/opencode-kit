import assert from "node:assert/strict";
import fs from "node:fs";

const caseRecord = JSON.parse(fs.readFileSync("case.json", "utf8")) as Record<string, unknown>;
const result = JSON.parse(fs.readFileSync("result.json", "utf8")) as Record<string, unknown>;
const expectedKeys = [
  "acceptedPackages",
  "caseId",
  "mainDisposition",
  "missionOutcome",
  "reconsultationCondition",
  "schemaVersion",
  "unavailableCapabilities",
];

assert.deepEqual(Object.keys(result).sort(), expectedKeys);
assert.equal(result.schemaVersion, 1);
assert.equal(result.caseId, caseRecord.caseId);
assert.equal(result.missionOutcome, "complete");
assert.ok(["direct", "main-alone", "team-recommended", "unknown"].includes(String(result.mainDisposition)));
assert.ok(Array.isArray(result.acceptedPackages));
assert.ok(Array.isArray(result.unavailableCapabilities));
assert.equal(typeof result.reconsultationCondition, "string");

if (caseRecord.caseId === "trivial-owner-local-direct") {
  assert.equal(fs.readFileSync("note.txt", "utf8"), "the local note\n");
}
if (caseRecord.caseId === "unresolved-isolation-delegation") {
  assert.equal(fs.readFileSync("worker/output.txt", "utf8"), "worker-ok\n");
}

console.log(`OK: ${String(caseRecord.caseId)}`);
