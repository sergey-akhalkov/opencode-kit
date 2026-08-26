import fs from "node:fs";

const expectedIds = [
  "known-resource-path-unknown",
  "resource-unknown-negative-control",
  "compaction-roundtrip-mixed-status",
];
const factKeys = [
  "acceptedOutcomeState",
  "actionAuthority",
  "evidenceState",
  "operationalConsequence",
  "proofPathReadiness",
  "resourceAvailability",
];
const parsed = JSON.parse(fs.readFileSync("cases.json", "utf8")) as Record<string, unknown>;
if (Object.keys(parsed).sort().join(",") !== "members,schemaVersion" || parsed.schemaVersion !== 1 || !Array.isArray(parsed.members)) {
  throw new Error("status-scope fixture schema mismatch");
}
const ids = parsed.members.map((value, index) => {
  if (value == null || typeof value !== "object" || Array.isArray(value)) throw new Error(`members[${index}] must be an object`);
  const member = value as Record<string, unknown>;
  if (Object.keys(member).sort().join(",") !== "facts,id" || typeof member.id !== "string") throw new Error(`members[${index}] schema mismatch`);
  if (member.facts == null || typeof member.facts !== "object" || Array.isArray(member.facts)) throw new Error(`members[${index}].facts must be an object`);
  const facts = member.facts as Record<string, unknown>;
  if (Object.keys(facts).sort().join(",") !== factKeys.join(",") || Object.values(facts).some((entry) => typeof entry !== "string" || entry.trim() === "")) {
    throw new Error(`members[${index}].facts schema mismatch`);
  }
  return member.id;
});
if (ids.join(",") !== expectedIds.join(",")) throw new Error("status-scope member order mismatch");
console.log(JSON.stringify({ memberIds: ids, schemaVersion: 1 }));
