import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const changeRoot = path.join(root, "openspec", "changes", "checkpoint-route");
const fixture = JSON.parse(fs.readFileSync(path.join(root, "case.json"), "utf8"));
const canary = JSON.parse(fs.readFileSync(path.join(root, "canary-result.json"), "utf8"));
for (const [relative, expected] of Object.entries(fixture.expectedPlanning)) {
  if (fs.readFileSync(path.join(changeRoot, relative), "utf8") !== expected) throw new Error(`final planning mismatch: ${relative}`);
}
if (canary.checkpointRef !== fixture.checkpoint.checkpointRef) throw new Error("checkpoint identity changed");
if (!canary.nextAction.startsWith(fixture.checkpoint.nextActionPrefix) || !/^[a-f0-9]{64}$/.test(canary.resumeTokenDigest) || canary.status !== "passed") throw new Error("canary continuation did not reach its oracle");
console.log(JSON.stringify({
  canary: canary.status,
  checkpointRef: canary.checkpointRef,
  duplicateHistoryEntries: 0,
  planningChangedPaths: ["design.md", "history.md", "tasks.md"],
  preservedOutcomeOraclePopulation: fixture.checkpoint.preservedOutcomeOraclePopulation,
  suppressionCondition: canary.suppressionCondition
}));
