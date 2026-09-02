import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { append, readEvents, root, writeResult } from "./events.ts";

const changeRoot = path.join(root, "openspec/changes/leaf-first-fixture");
for (const [actual, markers] of [
  ["design.md", ["leaf-schema-prerequisite", "leaf-schema", "leaf-transport", "parent-client", "evidence-transport"]],
  ["history.md", ["leaf-schema-prerequisite", "evidence-transport", "Selected route", "Retry condition"]],
  ["tasks.md", ["[leaf-schema-prerequisite]", "[leaf-schema]", "[leaf-transport]", "[parent-client]", "Dependencies", "Observable Proof"]],
] as const) {
  const text = fs.readFileSync(path.join(changeRoot, actual), "utf8");
  const normalized = text.toLowerCase();
  for (const marker of markers) assert(normalized.includes(marker.toLowerCase()), `${actual} must contain ${marker}`);
}
const tasks = fs.readFileSync(path.join(changeRoot, "tasks.md"), "utf8");
assert.equal((tasks.match(/- \[ \]/g) ?? []).length, 4, "recursive correction must keep child, leaves, and parent open");
assert(!tasks.includes("- [x]"), "recursive correction must not restore the checked coarse parent");
assert.equal(fs.readFileSync(path.join(root, "work/same-leaf.txt"), "utf8").trim(), "local-fixed");
assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, "result/hidden-prerequisite.json"), "utf8")), {
  affectedLeaf: "leaf-schema",
  parent: "parent-client",
  preservedEvidence: ["evidence-transport"],
  prerequisite: "leaf-schema-prerequisite",
  status: "observed",
});
assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, "result/same-leaf.json"), "utf8")), { id: "same-leaf", mode: "direct-correct", status: "passed" });

const prefix = ["proactive-task-tree:passed", "hidden-prerequisite:observed", "same-leaf-local-failure:observed", "same-leaf-corrected", "same-leaf-proof:passed"];
const complete = [...prefix, "recursive-task-delta:passed", "parent-integration-still-open", "passing-evidence-preserved"];
const events = readEvents();
if (events.length === prefix.length) {
  assert.deepEqual(events, prefix);
  append(prefix, "recursive-task-delta:passed");
  append([...prefix, "recursive-task-delta:passed"], "parent-integration-still-open");
  append([...prefix, "recursive-task-delta:passed", "parent-integration-still-open"], "passing-evidence-preserved");
} else {
  assert.deepEqual(events, complete);
}
assert.deepEqual(readEvents(), complete);
const result = {
  changedPlanningPaths: ["design.md", "history.md", "tasks.md"],
  coarseParentReopened: true,
  dependencyRefCount: 3,
  eventCount: 8,
  historyAppendCount: 1,
  parentState: "open",
  proposalChanged: false,
  sameLeafMode: "direct-correct",
  scopeChanged: false,
  status: "passed",
  taskRefCount: 4,
};
writeResult("final.json", result);
console.log(JSON.stringify(result));
