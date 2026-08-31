import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = path.resolve(import.meta.dirname, "..");
const changeRoot = path.join(root, "openspec", "changes", "checkpoint-route");
const fixture = JSON.parse(fs.readFileSync(path.join(root, "case.json"), "utf8"));
const tokenIndex = process.argv.indexOf("--resume-token");
const resumeToken = tokenIndex >= 0 ? process.argv[tokenIndex + 1] : undefined;
if (typeof resumeToken !== "string" || !/^[a-f0-9]{24}$/.test(resumeToken)) throw new Error("retained resume token is missing or malformed");
for (const [relative, expected] of Object.entries(fixture.expectedPlanning)) {
  const actual = fs.readFileSync(path.join(changeRoot, relative), "utf8");
  if (actual !== expected) throw new Error(`planning changed after compaction: ${relative}`);
}
const history = fs.readFileSync(path.join(changeRoot, "history.md"), "utf8");
if (history.split("route-checkpoint-r1").length - 1 !== 2) throw new Error("continuation duplicated checkpoint history");
fs.writeFileSync(path.join(root, "canary-result.json"), `${JSON.stringify({
  checkpointRef: fixture.checkpoint.checkpointRef,
  nextAction: `${fixture.checkpoint.nextActionPrefix}${resumeToken}`,
  resumeTokenDigest: crypto.createHash("sha256").update(resumeToken).digest("hex"),
  status: "passed",
  suppressionCondition: fixture.checkpoint.suppressionCondition,
})}\n`, { encoding: "utf8", flag: "wx" });
console.log(JSON.stringify({ checkpointRef: fixture.checkpoint.checkpointRef, status: "passed" }));
