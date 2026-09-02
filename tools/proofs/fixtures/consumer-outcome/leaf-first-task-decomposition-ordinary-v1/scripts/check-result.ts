import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const readJson = (relative: string): unknown => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const read = (relative: string): string => fs.readFileSync(path.join(root, relative), "utf8").trim();

const expectedEvents = [
  "leaf-a-proof:passed",
  "leaf-b-proof:passed",
  "parent-integration-proof:passed",
  "cohesive-direct-proof:passed",
  "same-leaf-local-failure:observed",
  "same-leaf-corrected",
  "same-leaf-proof:passed",
  "grouped-mechanical-proof:passed",
  "integration-only-failure:observed",
  "integration-parent-corrected",
  "integration-parent-proof:passed",
];
assert.deepEqual(readJson("result/events.json"), expectedEvents);
assert.deepEqual(readJson("result/leaf-a.json"), { id: "leaf-a", oracle: "work/leaf-a.txt", status: "passed" });
assert.deepEqual(readJson("result/leaf-b.json"), { id: "leaf-b", oracle: "work/leaf-b.txt", status: "passed" });
assert.deepEqual(readJson("result/parent.json"), { dependencies: ["leaf-a", "leaf-b"], id: "release-bundle", oracle: "distinct-integration", status: "passed" });
assert.deepEqual(readJson("result/cohesive.json"), { id: "cohesive", mode: "direct", status: "passed" });
assert.deepEqual(readJson("result/same-leaf.json"), { id: "same-leaf", mode: "direct-correct", status: "passed" });
assert.deepEqual(readJson("result/grouped-mechanical.json"), { id: "grouped-mechanical", mode: "grouped-direct", owners: 2, status: "passed" });
assert.deepEqual(readJson("result/integration-only.json"), { id: "integration-only", leafEvidencePreserved: true, mode: "parent-local-correct", status: "passed" });
assert.equal(read("work/leaf-a.txt"), "alpha-ready");
assert.equal(read("work/leaf-b.txt"), "beta-ready");
assert.equal(read("work/cohesive.txt"), "cohesive-ready");
assert.equal(read("work/same-leaf.txt"), "local-fixed");
assert.equal(read("work/mechanical-a.txt"), "mechanical-ready");
assert.equal(read("work/mechanical-b.txt"), "mechanical-ready");
assert.equal(read("work/integration-left.txt"), "left-ready");
assert.equal(read("work/integration-right.txt"), "right-ready");
assert.equal(read("work/integration-parent.txt"), "integrated-fixed");

const forbidden = [".tasks", "checkpoint.md", "history.md", "plan.md", "proposal.md", "tasks.md"];
const taskArtifactCount = forbidden.filter((relative) => fs.existsSync(path.join(root, relative))).length;
assert.equal(taskArtifactCount, 0, "ordinary controls must not create task or checkpoint artifacts");
assert.deepEqual(fs.readdirSync(path.join(root, "result")).sort(), ["cohesive.json", "events.json", "grouped-mechanical.json", "integration-only.json", "leaf-a.json", "leaf-b.json", "parent.json", "same-leaf.json"]);

console.log(JSON.stringify({
  cohesiveMode: "direct",
  eventCount: expectedEvents.length,
  integrationMode: "parent-local-correct",
  leafProofCount: 2,
  mechanicalMode: "grouped-direct",
  parentAfterLeaves: true,
  parentProof: "distinct",
  sameLeafMode: "direct-correct",
  status: "passed",
  taskArtifactCount,
}));
