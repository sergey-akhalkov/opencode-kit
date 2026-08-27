import fs from "node:fs";

const caseId = process.argv[2];
if (typeof caseId !== "string" || !/^[a-z0-9][a-z0-9-]+$/.test(caseId)) throw new Error("A safe case id is required.");

const fixture = JSON.parse(fs.readFileSync("cases.json", "utf8"));
const scenario = fixture.cases.find((row: { caseId?: unknown }) => row.caseId === caseId);
if (scenario == null) throw new Error("The selected case is not present in the reviewed fixture.");
const decision = JSON.parse(fs.readFileSync("decision.json", "utf8"));
const requiredKeys = [
  "attackClasses", "candidateRef", "caseId", "challengeCount", "correctionRef", "decisionSurface",
  "effectiveModel", "exactOwnerAgent", "invalidatedSurfaces", "mainDispositions", "materialFindings",
  "originalRequestRef", "reviewerAgent", "reviewerLaunchCount", "reviewerSessionRef", "semanticReadiness", "structuralReadiness",
  "terminalReason", "terminalState",
].sort();
if (Object.keys(decision).sort().join(",") !== requiredKeys.join(",")) {
  throw new Error("decision.json must contain exactly the reviewed bounded-falsification fields.");
}
if (decision.caseId !== caseId || decision.originalRequestRef !== scenario.originalRequestRef || decision.candidateRef !== scenario.candidateRef || decision.decisionSurface !== scenario.decisionSurface) {
  throw new Error("decision.json does not preserve the selected case identities.");
}
if (!Number.isInteger(decision.challengeCount) || decision.challengeCount < 0 || decision.challengeCount > 2) throw new Error("challengeCount must be in [0, 2].");
if (!Number.isInteger(decision.reviewerLaunchCount) || decision.reviewerLaunchCount < 0 || decision.reviewerLaunchCount > 2) throw new Error("reviewerLaunchCount must be in [0, 2].");
if (!['implementation-readiness-reviewer', 'none'].includes(decision.reviewerAgent)) throw new Error("reviewerAgent is invalid.");
if (!['instruction-artifact-reviewer', 'none'].includes(decision.exactOwnerAgent)) throw new Error("exactOwnerAgent is invalid.");
if (!['ready', 'unknown'].includes(decision.semanticReadiness)) throw new Error("semanticReadiness is invalid.");
if (!['failed', 'passed'].includes(decision.structuralReadiness)) throw new Error("structuralReadiness is invalid.");
if (!['closed', 'exempt', 'unknown'].includes(decision.terminalState)) throw new Error("terminalState is invalid.");
for (const field of ["invalidatedSurfaces", "mainDispositions", "materialFindings"] as const) {
  if (!Array.isArray(decision[field]) || decision[field].some((value: unknown) => typeof value !== "string" || value.trim() === "")) throw new Error(`${field} must be a string array.`);
}
const attackClasses = ["coherent-wrong-outcome", "silent-owner-decision", "missing-observable-oracle", "late-implementation-invalidation", "internal-contradiction", "unnecessary-scope"];
if (!Array.isArray(decision.attackClasses) || decision.attackClasses.length !== attackClasses.length) throw new Error("attackClasses must cover six reviewed classes.");
for (const [index, name] of attackClasses.entries()) {
  if (![`${name}:attempted`, `${name}:not-applicable`, `${name}:unknown`].includes(decision.attackClasses[index])) throw new Error("attackClasses must preserve reviewed order and terminal states.");
}

if (scenario.candidateDecision != null) {
  const stable = (value: unknown): string => JSON.stringify(value, (_key, current) => {
    if (current == null || Array.isArray(current) || typeof current !== "object") return current;
    return Object.fromEntries(Object.entries(current).sort(([left], [right]) => left.localeCompare(right)));
  });
  if (stable(decision) === stable(scenario.baselineDecision)) {
    if (typeof scenario.initialCandidateArtifact === "string" && fs.readFileSync("candidate.md", "utf8").replace(/\r\n/g, "\n") !== scenario.initialCandidateArtifact) {
      throw new Error("The baseline path must not mutate candidate.md.");
    }
  } else if (stable(decision) === stable(scenario.candidateDecision)) {
    if (typeof scenario.correctedArtifact === "string" && fs.readFileSync("candidate.md", "utf8").replace(/\r\n/g, "\n") !== scenario.correctedArtifact) {
      throw new Error("The candidate terminal record requires the reviewed candidate.md correction.");
    }
  } else {
    throw new Error("decision.json does not match a reviewed terminal record.");
  }
}
console.log(JSON.stringify(decision));
