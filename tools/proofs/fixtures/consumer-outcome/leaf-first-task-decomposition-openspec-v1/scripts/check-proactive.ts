import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { append, root, writeResult } from "./events.ts";

const tasks = fs.readFileSync(path.join(root, "openspec/changes/leaf-first-fixture/tasks.md"), "utf8");
const requiredMarkers = ["[leaf-schema]", "[leaf-transport]", "[parent-client]", "Dependencies", "Observable Proof"];
requiredMarkers.forEach((marker) => {
  assert(tasks.includes(marker), `proactive tasks must contain ${marker}`);
});
assert.equal((tasks.match(/- \[ \]/g) ?? []).length, 3, "proactive tasks must contain two open leaves and one open parent");
assert(!tasks.includes("- [x]"), "the checked coarse parent must be reopened");
assert(tasks.includes("parent-client") && tasks.includes("1.1 and 1.2"), "the parent must depend on both leaves");
assert(!fs.existsSync(path.join(root, "result/hidden-prerequisite.json")), "hidden prerequisite must not be exposed before proactive authoring proof");
append([], "proactive-task-tree:passed");
writeResult("proactive.json", { dependencyRefs: ["leaf-schema:parent-client", "leaf-transport:parent-client"], parentState: "open", status: "passed" });
console.log(JSON.stringify({ coarseParentReopened: true, parentState: "open", status: "passed", taskRefCount: 3 }));
