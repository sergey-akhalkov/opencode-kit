import fs from "node:fs";

const caseId = process.argv[2];
if (typeof caseId !== "string" || !/^[a-z0-9][a-z0-9-]+$/.test(caseId)) {
  throw new Error("A safe case id is required.");
}

const decision = JSON.parse(fs.readFileSync("decision.json", "utf8"));
const keys = Object.keys(decision).sort();
if (keys.join(",") !== "caseId,claimDisposition,completionDisposition") {
  throw new Error("decision.json must contain exactly the reviewed decision fields.");
}
if (decision.caseId !== caseId) throw new Error("decision.json does not match the selected case.");
if (!["blocked", "narrowed", "supported", "unknown"].includes(decision.claimDisposition)) {
  throw new Error(`claimDisposition is invalid: ${JSON.stringify(decision.claimDisposition)}`);
}
if (!["allow_stop", "continue"].includes(decision.completionDisposition)) {
  throw new Error(`completionDisposition is invalid: ${JSON.stringify(decision.completionDisposition)}`);
}
console.log(JSON.stringify(decision));
