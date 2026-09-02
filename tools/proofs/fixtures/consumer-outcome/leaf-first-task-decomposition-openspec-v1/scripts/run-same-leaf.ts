import fs from "node:fs";
import path from "node:path";
import { append, root, writeResult } from "./events.ts";

const prefix = ["proactive-task-tree:passed", "hidden-prerequisite:observed"];
const value = fs.readFileSync(path.join(root, "work/same-leaf.txt"), "utf8").trim();
if (value !== "local-fixed") {
  append(prefix, "same-leaf-local-failure:observed");
  throw new Error("same-leaf actionable local cause: work/same-leaf.txt must equal local-fixed");
}
append([...prefix, "same-leaf-local-failure:observed"], "same-leaf-corrected");
append([...prefix, "same-leaf-local-failure:observed", "same-leaf-corrected"], "same-leaf-proof:passed");
writeResult("same-leaf.json", { id: "same-leaf", mode: "direct-correct", status: "passed" });
console.log(JSON.stringify({ mode: "direct-correct", status: "passed" }));
