import fs from "node:fs";
import path from "node:path";
import { append, root, writeResult } from "./events.ts";

if (!fs.existsSync(path.join(root, "result/proactive.json"))) throw new Error("proactive task-tree proof is required before revealing the hidden prerequisite");
append(["proactive-task-tree:passed"], "hidden-prerequisite:observed");
writeResult("hidden-prerequisite.json", {
  affectedLeaf: "leaf-schema",
  parent: "parent-client",
  preservedEvidence: ["evidence-transport"],
  prerequisite: "leaf-schema-prerequisite",
  status: "observed",
});
console.log(JSON.stringify({ prerequisite: "leaf-schema-prerequisite", status: "observed" }));
