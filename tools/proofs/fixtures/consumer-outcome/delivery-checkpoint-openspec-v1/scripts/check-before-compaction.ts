import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = path.resolve(import.meta.dirname, "..");
const changeRoot = path.join(root, "openspec", "changes", "checkpoint-route");
const fixture = JSON.parse(fs.readFileSync(path.join(root, "case.json"), "utf8"));
for (const [relative, expected] of Object.entries(fixture.expectedPlanning)) {
  const actual = fs.readFileSync(path.join(changeRoot, relative), "utf8");
  if (actual !== expected) throw new Error(`planning mismatch before compaction: ${relative}`);
}
const history = fs.readFileSync(path.join(changeRoot, "history.md"), "utf8");
if (history.split("route-checkpoint-r1").length - 1 !== 2) throw new Error("checkpoint history identity is missing or duplicated");
const resumeToken = crypto.randomBytes(12).toString("hex");
const result = {
  checkpointRef: fixture.checkpoint.checkpointRef,
  nextAction: `${fixture.checkpoint.nextActionPrefix}${resumeToken}`,
  resumeToken,
  status: "ready-for-compaction",
  suppressionCondition: fixture.checkpoint.suppressionCondition,
};
fs.writeFileSync(path.join(root, "precompaction-result.json"), `${JSON.stringify(result)}\n`, { encoding: "utf8", flag: "wx" });
console.log(JSON.stringify(result));
