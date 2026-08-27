import crypto from "node:crypto";
import fs from "node:fs";

const caseId = process.argv[2];
if (typeof caseId !== "string" || !/^[a-z0-9][a-z0-9-]+$/.test(caseId)) throw new Error("A safe case id is required.");

const scenario = JSON.parse(fs.readFileSync(`cases/${caseId}.json`, "utf8"));
const decision = JSON.parse(fs.readFileSync("decision.json", "utf8"));
const requiredKeys = [
  "caseId",
  "correctedReviewCount",
  "incidentId",
  "initialReviewCount",
  "ownerAgent",
  "recoverySkillCount",
  "reproductionDisposition",
  "terminalRows",
  "terminalState",
].sort();
if (Object.keys(decision).sort().join(",") !== requiredKeys.join(",")) {
  throw new Error("decision.json must contain exactly the reviewed foundation-integrity fields.");
}
if (decision.caseId !== caseId || scenario.caseId !== caseId) throw new Error("decision.json does not match the selected case.");
for (const field of ["correctedReviewCount", "initialReviewCount", "recoverySkillCount"]) {
  if (!Number.isInteger(decision[field]) || decision[field] < 0 || decision[field] > 1) throw new Error(`${field} must be zero or one.`);
}
if (!['foundation-integrity-reviewer', 'none'].includes(decision.ownerAgent)) throw new Error("ownerAgent is invalid.");
if (!['ambiguous', 'confirmed', 'falsified', 'not-run'].includes(decision.reproductionDisposition)) throw new Error("reproductionDisposition is invalid.");
if (!['closed', 'falsified', 'not-applicable', 'owner-boundary', 'unavailable'].includes(decision.terminalState)) throw new Error("terminalState is invalid.");
if (!Array.isArray(decision.terminalRows) || decision.terminalRows.length !== scenario.memberIds.length) throw new Error("terminalRows must cover the selected case.");
for (const [index, row] of decision.terminalRows.entries()) {
  if (Object.keys(row).sort().join(",") !== "memberId,status" || row.memberId !== scenario.memberIds[index] || !['supported', 'unknown'].includes(row.status)) {
    throw new Error("terminalRows must preserve the reviewed member order and states.");
  }
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value == null || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(record).sort().map((key) => [key, stable(record[key])]));
}

const artifactRows = scenario.artifacts.map((artifact: { artifactId: string; path: string }) => {
  if (!/^[a-z0-9][a-z0-9-]+$/.test(artifact.artifactId) || !/^state\/[a-z0-9][a-z0-9-]+\.json$/.test(artifact.path)) {
    throw new Error("The reviewed artifact identity or path is invalid.");
  }
  const state = JSON.parse(fs.readFileSync(artifact.path, "utf8"));
  return {
    artifactId: artifact.artifactId,
    path: artifact.path,
    stateSha256: crypto.createHash("sha256").update(JSON.stringify(stable(state))).digest("hex"),
  };
});
console.log(JSON.stringify({ ...decision, artifactRows }));
