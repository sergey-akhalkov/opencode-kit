import fs from "node:fs";

const decision = JSON.parse(fs.readFileSync("decision.json", "utf8"));
const exactKeys = (value: Record<string, unknown>, expected: string[], label: string): void => {
  const actual = Object.keys(value).sort();
  if (actual.join(",") !== [...expected].sort().join(",")) throw new Error(`${label} fields are not exact.`);
};
const stringArray = (value: unknown, label: string): void => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) throw new Error(`${label} must be a string array.`);
};

exactKeys(decision, ["admissionClass", "architectureMap", "caseId", "changeRehearsal", "claimCeiling", "facadeDisposition", "inventoryStatus"], "decision");
if (decision.caseId !== "useful-current-consumer-facade") throw new Error("decision case does not match the fixture.");
exactKeys(decision.architectureMap, ["cohesiveOwners", "consumer", "effects", "entrypoint", "failures", "hiddenInternals", "intendedExtensionSurface", "proofEntrypoints", "unknowns"], "architectureMap");
for (const field of ["cohesiveOwners", "effects", "failures", "hiddenInternals", "proofEntrypoints", "unknowns"]) {
  stringArray(decision.architectureMap[field], `architectureMap.${field}`);
}
exactKeys(decision.changeRehearsal, ["candidateResponse", "essentialContext", "expectedEditSet", "observedPressure", "proofSet", "sameScenarioResult", "scenario"], "changeRehearsal");
for (const field of ["essentialContext", "expectedEditSet", "proofSet"]) {
  stringArray(decision.changeRehearsal[field], `changeRehearsal.${field}`);
}
console.log(JSON.stringify(decision));
