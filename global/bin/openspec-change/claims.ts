import {
  SAFE_ID,
  SAFE_TOKEN,
  extraKeys,
  failIssues,
  readArray,
  readBoolean,
  readObject,
  readString,
  type ParseResult,
  type SchemaIssue,
} from "./manifest.ts";

const MAX_CLAIMS = 32;
const MAX_MEMBERS = 128;
const MAX_REFS = 64;

export type ClaimClass =
  | "exact-case"
  | "finite-population"
  | "partitioned-domain"
  | "real-system-equivalence"
  | "compatibility-interchangeability"
  | "safety"
  | "phase-milestone";
export type ClaimCoverageBasis = "exact-case" | "finite-population" | "partitioned-domain";
export type ClaimDisposition = "supported" | "narrowed" | "blocked" | "unknown";
export type ClaimObservationStatus = ClaimDisposition;
export type ClaimRealOracleStatus = "observed" | "unavailable" | "unknown" | "not-required";
export type ClaimChallengeStatus = "complete" | "missing" | "unusable" | "not-required";
export type ClaimClosureState = ClaimDisposition | "stale";

export type ClaimPaths = {
  production: string;
  baseline: string | null;
  candidate: string | null;
};
export type ClaimPopulation = {
  id: string;
  members: string[];
  partitionRule: string | null;
  materialClasses: string[];
  residualSpace: string | null;
};
export type ClaimObservation = {
  memberId: string;
  candidateId: string;
  environmentId: string;
  paths: ClaimPaths;
  observationBoundary: string;
  status: ClaimObservationStatus;
  terminal: boolean;
  evidenceRefs: string[];
  unresolvedObservations: string[];
};
export type ClaimRealOracle = {
  required: boolean;
  status: ClaimRealOracleStatus;
  evidenceRefs: string[];
};
export type ClaimIndependentChallenge = {
  required: boolean;
  status: ClaimChallengeStatus;
  evidenceRefs: string[];
};
export type ClaimEvidenceRecord = {
  claimId: string;
  outcomeRef: string;
  statement: string;
  claimClass: ClaimClass;
  candidateId: string;
  environmentId: string;
  coverageBasis: ClaimCoverageBasis;
  population: ClaimPopulation;
  paths: ClaimPaths;
  observationBoundary: string;
  realOracle: ClaimRealOracle;
  observations: ClaimObservation[];
  evidenceRefs: string[];
  materialExclusions: string[];
  unknowns: string[];
  independentChallenge: ClaimIndependentChallenge;
  maximumSupportedClaim: string;
  narrowingAccepted: boolean;
  disposition: ClaimDisposition;
};
export type ClaimClosureReason = {
  code: string;
  path: string;
  message: string;
};
export type ClaimClosureResult = {
  claimId: string;
  state: ClaimClosureState;
  requiredMembers: number;
  supportedMembers: number;
  reasons: ClaimClosureReason[];
};

function collect(issues: SchemaIssue[], result: ParseResult<unknown>): void {
  if (!result.ok) issues.push(...result.issues);
}

function readNullableString(value: unknown, path: string, pattern?: RegExp): ParseResult<string | null> {
  if (value === null) return { ok: true, value: null };
  return readString(value, path, pattern);
}

function readStringList(value: unknown, path: string, max: number, pattern?: RegExp): ParseResult<string[]> {
  const raw = readArray(value, path);
  if (!raw.ok) return raw;
  const issues: SchemaIssue[] = [];
  const values: string[] = [];
  const seen = new Set<string>();
  if (raw.value.length > max) {
    issues.push({ code: "invalid", path, message: `Array cannot exceed ${max} entries.` });
  }
  for (const [index, item] of raw.value.entries()) {
    const parsed = readString(item, `${path}.${index}`, pattern);
    collect(issues, parsed);
    if (!parsed.ok) continue;
    if (seen.has(parsed.value)) {
      issues.push({ code: "invalid", path: `${path}.${index}`, message: `Duplicate value: ${parsed.value}.` });
      continue;
    }
    seen.add(parsed.value);
    values.push(parsed.value);
  }
  return issues.length > 0 ? failIssues(issues) : { ok: true, value: values };
}

function parsePaths(value: unknown, path: string): ParseResult<ClaimPaths> {
  const object = readObject(value, path);
  if (!object.ok) return object;
  const issues = extraKeys(object.value, ["production", "baseline", "candidate"], path);
  const production = readString(object.value.production, `${path}.production`, SAFE_TOKEN);
  const baseline = readNullableString(object.value.baseline, `${path}.baseline`, SAFE_TOKEN);
  const candidate = readNullableString(object.value.candidate, `${path}.candidate`, SAFE_TOKEN);
  collect(issues, production);
  collect(issues, baseline);
  collect(issues, candidate);
  if (issues.length > 0 || !production.ok || !baseline.ok || !candidate.ok) return failIssues(issues);
  return { ok: true, value: { production: production.value, baseline: baseline.value, candidate: candidate.value } };
}

function parsePopulation(value: unknown, path: string): ParseResult<ClaimPopulation> {
  const object = readObject(value, path);
  if (!object.ok) return object;
  const issues = extraKeys(object.value, ["id", "members", "partitionRule", "materialClasses", "residualSpace"], path);
  const id = readString(object.value.id, `${path}.id`, SAFE_ID);
  const members = readStringList(object.value.members, `${path}.members`, MAX_MEMBERS, SAFE_TOKEN);
  const partitionRule = readNullableString(object.value.partitionRule, `${path}.partitionRule`);
  const materialClasses = readStringList(object.value.materialClasses, `${path}.materialClasses`, MAX_MEMBERS, SAFE_TOKEN);
  const residualSpace = readNullableString(object.value.residualSpace, `${path}.residualSpace`);
  collect(issues, id);
  collect(issues, members);
  collect(issues, partitionRule);
  collect(issues, materialClasses);
  collect(issues, residualSpace);
  if (issues.length > 0 || !id.ok || !members.ok || !partitionRule.ok || !materialClasses.ok || !residualSpace.ok) return failIssues(issues);
  return {
    ok: true,
    value: {
      id: id.value,
      members: members.value,
      partitionRule: partitionRule.value,
      materialClasses: materialClasses.value,
      residualSpace: residualSpace.value,
    },
  };
}

function parseRealOracle(value: unknown, path: string): ParseResult<ClaimRealOracle> {
  const object = readObject(value, path);
  if (!object.ok) return object;
  const issues = extraKeys(object.value, ["required", "status", "evidenceRefs"], path);
  const required = readBoolean(object.value.required, `${path}.required`);
  const status = object.value.status;
  const evidenceRefs = readStringList(object.value.evidenceRefs, `${path}.evidenceRefs`, MAX_REFS, SAFE_TOKEN);
  collect(issues, required);
  collect(issues, evidenceRefs);
  if (status !== "observed" && status !== "unavailable" && status !== "unknown" && status !== "not-required") {
    issues.push(status === undefined
      ? { code: "missing", path: `${path}.status`, message: "Invalid input: expected string, received undefined" }
      : { code: "invalid", path: `${path}.status`, message: "Invalid real-oracle status." });
  }
  if (issues.length > 0 || !required.ok || !evidenceRefs.ok || status !== "observed" && status !== "unavailable" && status !== "unknown" && status !== "not-required") return failIssues(issues);
  return { ok: true, value: { required: required.value, status, evidenceRefs: evidenceRefs.value } };
}

function parseChallenge(value: unknown, path: string): ParseResult<ClaimIndependentChallenge> {
  const object = readObject(value, path);
  if (!object.ok) return object;
  const issues = extraKeys(object.value, ["required", "status", "evidenceRefs"], path);
  const required = readBoolean(object.value.required, `${path}.required`);
  const status = object.value.status;
  const evidenceRefs = readStringList(object.value.evidenceRefs, `${path}.evidenceRefs`, MAX_REFS, SAFE_TOKEN);
  collect(issues, required);
  collect(issues, evidenceRefs);
  if (status !== "complete" && status !== "missing" && status !== "unusable" && status !== "not-required") {
    issues.push(status === undefined
      ? { code: "missing", path: `${path}.status`, message: "Invalid input: expected string, received undefined" }
      : { code: "invalid", path: `${path}.status`, message: "Invalid independent-challenge status." });
  }
  if (issues.length > 0 || !required.ok || !evidenceRefs.ok || status !== "complete" && status !== "missing" && status !== "unusable" && status !== "not-required") return failIssues(issues);
  return { ok: true, value: { required: required.value, status, evidenceRefs: evidenceRefs.value } };
}

function parseObservation(value: unknown, path: string): ParseResult<ClaimObservation> {
  const object = readObject(value, path);
  if (!object.ok) return object;
  const issues = extraKeys(object.value, [
    "memberId",
    "candidateId",
    "environmentId",
    "paths",
    "observationBoundary",
    "status",
    "terminal",
    "evidenceRefs",
    "unresolvedObservations",
  ], path);
  const memberId = readString(object.value.memberId, `${path}.memberId`, SAFE_TOKEN);
  const candidateId = readString(object.value.candidateId, `${path}.candidateId`, SAFE_ID);
  const environmentId = readString(object.value.environmentId, `${path}.environmentId`, SAFE_ID);
  const paths = parsePaths(object.value.paths, `${path}.paths`);
  const observationBoundary = readString(object.value.observationBoundary, `${path}.observationBoundary`, SAFE_TOKEN);
  const status = object.value.status;
  const terminal = readBoolean(object.value.terminal, `${path}.terminal`);
  const evidenceRefs = readStringList(object.value.evidenceRefs, `${path}.evidenceRefs`, MAX_REFS, SAFE_TOKEN);
  const unresolvedObservations = readStringList(object.value.unresolvedObservations, `${path}.unresolvedObservations`, MAX_REFS);
  collect(issues, memberId);
  collect(issues, candidateId);
  collect(issues, environmentId);
  collect(issues, paths);
  collect(issues, observationBoundary);
  collect(issues, terminal);
  collect(issues, evidenceRefs);
  collect(issues, unresolvedObservations);
  if (status !== "supported" && status !== "narrowed" && status !== "blocked" && status !== "unknown") {
    issues.push(status === undefined
      ? { code: "missing", path: `${path}.status`, message: "Invalid input: expected string, received undefined" }
      : { code: "invalid", path: `${path}.status`, message: "Invalid observation status." });
  }
  if (issues.length > 0 || !memberId.ok || !candidateId.ok || !environmentId.ok || !paths.ok || !observationBoundary.ok || !terminal.ok || !evidenceRefs.ok || !unresolvedObservations.ok || status !== "supported" && status !== "narrowed" && status !== "blocked" && status !== "unknown") return failIssues(issues);
  return {
    ok: true,
    value: {
      memberId: memberId.value,
      candidateId: candidateId.value,
      environmentId: environmentId.value,
      paths: paths.value,
      observationBoundary: observationBoundary.value,
      status,
      terminal: terminal.value,
      evidenceRefs: evidenceRefs.value,
      unresolvedObservations: unresolvedObservations.value,
    },
  };
}

function parseClaim(value: unknown, path: string): ParseResult<ClaimEvidenceRecord> {
  const object = readObject(value, path);
  if (!object.ok) return object;
  const issues = extraKeys(object.value, [
    "claimId",
    "outcomeRef",
    "statement",
    "claimClass",
    "candidateId",
    "environmentId",
    "coverageBasis",
    "population",
    "paths",
    "observationBoundary",
    "realOracle",
    "observations",
    "evidenceRefs",
    "materialExclusions",
    "unknowns",
    "independentChallenge",
    "maximumSupportedClaim",
    "narrowingAccepted",
    "disposition",
  ], path);
  const claimId = readString(object.value.claimId, `${path}.claimId`, SAFE_ID);
  const outcomeRef = readString(object.value.outcomeRef, `${path}.outcomeRef`, SAFE_TOKEN);
  const statement = readString(object.value.statement, `${path}.statement`);
  const claimClass = object.value.claimClass;
  const candidateId = readString(object.value.candidateId, `${path}.candidateId`, SAFE_ID);
  const environmentId = readString(object.value.environmentId, `${path}.environmentId`, SAFE_ID);
  const coverageBasis = object.value.coverageBasis;
  const population = parsePopulation(object.value.population, `${path}.population`);
  const paths = parsePaths(object.value.paths, `${path}.paths`);
  const observationBoundary = readString(object.value.observationBoundary, `${path}.observationBoundary`, SAFE_TOKEN);
  const realOracle = parseRealOracle(object.value.realOracle, `${path}.realOracle`);
  const observationsRaw = readArray(object.value.observations, `${path}.observations`);
  const evidenceRefs = readStringList(object.value.evidenceRefs, `${path}.evidenceRefs`, MAX_REFS, SAFE_TOKEN);
  const materialExclusions = readStringList(object.value.materialExclusions, `${path}.materialExclusions`, MAX_REFS);
  const unknowns = readStringList(object.value.unknowns, `${path}.unknowns`, MAX_REFS);
  const independentChallenge = parseChallenge(object.value.independentChallenge, `${path}.independentChallenge`);
  const maximumSupportedClaim = readString(object.value.maximumSupportedClaim, `${path}.maximumSupportedClaim`);
  const narrowingAccepted = readBoolean(object.value.narrowingAccepted, `${path}.narrowingAccepted`);
  const disposition = object.value.disposition;
  collect(issues, claimId);
  collect(issues, outcomeRef);
  collect(issues, statement);
  collect(issues, candidateId);
  collect(issues, environmentId);
  collect(issues, population);
  collect(issues, paths);
  collect(issues, observationBoundary);
  collect(issues, realOracle);
  collect(issues, observationsRaw);
  collect(issues, evidenceRefs);
  collect(issues, materialExclusions);
  collect(issues, unknowns);
  collect(issues, independentChallenge);
  collect(issues, maximumSupportedClaim);
  collect(issues, narrowingAccepted);
  const validClasses: ClaimClass[] = ["exact-case", "finite-population", "partitioned-domain", "real-system-equivalence", "compatibility-interchangeability", "safety", "phase-milestone"];
  if (!validClasses.includes(claimClass as ClaimClass)) {
    issues.push(claimClass === undefined
      ? { code: "missing", path: `${path}.claimClass`, message: "Invalid input: expected string, received undefined" }
      : { code: "invalid", path: `${path}.claimClass`, message: "Invalid claim class." });
  }
  if (coverageBasis !== "exact-case" && coverageBasis !== "finite-population" && coverageBasis !== "partitioned-domain") {
    issues.push(coverageBasis === undefined
      ? { code: "missing", path: `${path}.coverageBasis`, message: "Invalid input: expected string, received undefined" }
      : { code: "invalid", path: `${path}.coverageBasis`, message: "Invalid coverage basis." });
  }
  if (disposition !== "supported" && disposition !== "narrowed" && disposition !== "blocked" && disposition !== "unknown") {
    issues.push(disposition === undefined
      ? { code: "missing", path: `${path}.disposition`, message: "Invalid input: expected string, received undefined" }
      : { code: "invalid", path: `${path}.disposition`, message: "Invalid claim disposition." });
  }
  const observations: ClaimObservation[] = [];
  const observationMembers = new Set<string>();
  if (observationsRaw.ok) {
    if (observationsRaw.value.length > MAX_MEMBERS) issues.push({ code: "invalid", path: `${path}.observations`, message: `Array cannot exceed ${MAX_MEMBERS} entries.` });
    for (const [index, item] of observationsRaw.value.entries()) {
      const observation = parseObservation(item, `${path}.observations.${index}`);
      collect(issues, observation);
      if (!observation.ok) continue;
      if (observationMembers.has(observation.value.memberId)) {
        issues.push({ code: "invalid", path: `${path}.observations.${index}.memberId`, message: `Duplicate observation member: ${observation.value.memberId}.` });
        continue;
      }
      observationMembers.add(observation.value.memberId);
      observations.push(observation.value);
    }
  }
  if (issues.length > 0 || !claimId.ok || !outcomeRef.ok || !statement.ok || !candidateId.ok || !environmentId.ok || !population.ok || !paths.ok || !observationBoundary.ok || !realOracle.ok || !evidenceRefs.ok || !materialExclusions.ok || !unknowns.ok || !independentChallenge.ok || !maximumSupportedClaim.ok || !narrowingAccepted.ok || !validClasses.includes(claimClass as ClaimClass) || coverageBasis !== "exact-case" && coverageBasis !== "finite-population" && coverageBasis !== "partitioned-domain" || disposition !== "supported" && disposition !== "narrowed" && disposition !== "blocked" && disposition !== "unknown") return failIssues(issues);
  return {
    ok: true,
    value: {
      claimId: claimId.value,
      outcomeRef: outcomeRef.value,
      statement: statement.value,
      claimClass: claimClass as ClaimClass,
      candidateId: candidateId.value,
      environmentId: environmentId.value,
      coverageBasis,
      population: population.value,
      paths: paths.value,
      observationBoundary: observationBoundary.value,
      realOracle: realOracle.value,
      observations,
      evidenceRefs: evidenceRefs.value,
      materialExclusions: materialExclusions.value,
      unknowns: unknowns.value,
      independentChallenge: independentChallenge.value,
      maximumSupportedClaim: maximumSupportedClaim.value,
      narrowingAccepted: narrowingAccepted.value,
      disposition,
    },
  };
}

export function parseClaimRecords(value: unknown, path = "claims"): ParseResult<ClaimEvidenceRecord[]> {
  const raw = readArray(value, path);
  if (!raw.ok) return raw;
  const issues: SchemaIssue[] = [];
  const claims: ClaimEvidenceRecord[] = [];
  const claimIds = new Set<string>();
  if (raw.value.length > MAX_CLAIMS) issues.push({ code: "invalid", path, message: `Array cannot exceed ${MAX_CLAIMS} entries.` });
  for (const [index, item] of raw.value.entries()) {
    const claim = parseClaim(item, `${path}.${index}`);
    collect(issues, claim);
    if (!claim.ok) continue;
    if (claimIds.has(claim.value.claimId)) {
      issues.push({ code: "invalid", path: `${path}.${index}.claimId`, message: `Duplicate claimId: ${claim.value.claimId}.` });
      continue;
    }
    claimIds.add(claim.value.claimId);
    claims.push(claim.value);
  }
  return issues.length > 0 ? failIssues(issues) : { ok: true, value: claims };
}

function samePaths(left: ClaimPaths, right: ClaimPaths): boolean {
  return left.production === right.production && left.baseline === right.baseline && left.candidate === right.candidate;
}

function hasMissingRef(refs: string[], available: Set<string>): boolean {
  return refs.some((ref) => !available.has(ref));
}

export function evaluateClaimEvidence(record: ClaimEvidenceRecord, currentCandidateId: string, currentEnvironmentId: string, availableEvidenceRefs: Set<string>): ClaimClosureResult {
  const reasons: ClaimClosureReason[] = [];
  const add = (code: string, path: string, message: string): void => {
    reasons.push({ code, path, message });
  };
  if (record.candidateId !== currentCandidateId) add("stale-candidate", "candidateId", `Expected ${currentCandidateId}, observed ${record.candidateId}.`);
  if (record.environmentId !== currentEnvironmentId) add("stale-environment", "environmentId", `Expected ${currentEnvironmentId}, observed ${record.environmentId}.`);
  if (record.population.members.length === 0) add("missing-population", "population.members", "Claim population is empty.");
  if (record.coverageBasis === "exact-case" && record.population.members.length !== 1) add("exact-case-cardinality", "population.members", "Exact-case coverage requires one declared member.");
  if (record.coverageBasis === "partitioned-domain") {
    if (record.population.partitionRule == null) add("partition-rule-missing", "population.partitionRule", "Reviewed partition rule is absent.");
    if (record.population.materialClasses.length === 0) add("partition-classes-missing", "population.materialClasses", "Material classes are absent.");
    if (record.population.residualSpace == null) add("partition-residual-missing", "population.residualSpace", "Residual-space statement is absent.");
    const members = new Set(record.population.members);
    if (record.population.materialClasses.some((value) => !members.has(value)) || record.population.materialClasses.length !== members.size) {
      add("partition-class-mismatch", "population.materialClasses", "Material classes do not match the declared partition members.");
    }
  }
  if (hasMissingRef(record.evidenceRefs, availableEvidenceRefs)) add("evidence-ref-missing", "evidenceRefs", "Claim references an unavailable evidence lane.");
  if (record.realOracle.required) {
    if (record.realOracle.status === "unavailable" || record.realOracle.status === "not-required") add("real-oracle-unavailable", "realOracle.status", "Required real oracle is unavailable.");
    if (record.realOracle.status === "unknown") add("real-oracle-unknown", "realOracle.status", "Required real oracle state is unknown.");
    if (record.realOracle.status === "observed" && record.realOracle.evidenceRefs.length === 0) add("real-oracle-evidence-missing", "realOracle.evidenceRefs", "Observed real oracle has no evidence reference.");
  }
  if (hasMissingRef(record.realOracle.evidenceRefs, availableEvidenceRefs)) add("real-oracle-ref-missing", "realOracle.evidenceRefs", "Real-oracle evidence lane is unavailable.");
  if (record.realOracle.evidenceRefs.some((ref) => !record.evidenceRefs.includes(ref))) add("real-oracle-ref-unbound", "realOracle.evidenceRefs", "Real-oracle evidence is not bound by the claim.");
  const broadClaim = record.claimClass !== "exact-case"
    || record.coverageBasis !== "exact-case"
    || record.population.members.length !== 1
    || record.paths.baseline != null
    || record.paths.candidate != null
    || record.realOracle.required;
  if (broadClaim && !record.independentChallenge.required) add("challenge-not-required", "independentChallenge.required", "Broad claim does not require independent challenge.");
  if (record.independentChallenge.required && record.independentChallenge.status !== "complete") add("challenge-incomplete", "independentChallenge.status", "Required independent challenge is not complete.");
  if (record.independentChallenge.status === "complete" && record.independentChallenge.evidenceRefs.length === 0) add("challenge-evidence-missing", "independentChallenge.evidenceRefs", "Completed independent challenge has no evidence reference.");
  if (hasMissingRef(record.independentChallenge.evidenceRefs, availableEvidenceRefs)) add("challenge-ref-missing", "independentChallenge.evidenceRefs", "Independent-challenge evidence lane is unavailable.");
  if (record.independentChallenge.evidenceRefs.some((ref) => !record.evidenceRefs.includes(ref))) add("challenge-ref-unbound", "independentChallenge.evidenceRefs", "Independent-challenge evidence is not bound by the claim.");
  if (record.disposition === "narrowed" && !record.narrowingAccepted) add("narrowing-not-accepted", "narrowingAccepted", "The narrower outcome is not recorded as accepted scope.");
  for (const [index, unknown] of record.unknowns.entries()) add("claim-unknown", `unknowns.${index}`, unknown);

  const observations = new Map(record.observations.map((row) => [row.memberId, row]));
  const members = new Set(record.population.members);
  for (const [index, row] of record.observations.entries()) {
    if (!members.has(row.memberId)) add("unexpected-member", `observations.${index}.memberId`, `Observation member ${row.memberId} is outside the declared population.`);
  }
  let supportedMembers = 0;
  for (const [index, member] of record.population.members.entries()) {
    const row = observations.get(member);
    if (row == null) {
      add("missing-member", `population.members.${index}`, `No observation row for ${member}.`);
      continue;
    }
    let rowSupports = true;
    if (row.candidateId !== currentCandidateId || row.candidateId !== record.candidateId) {
      add("stale-row-candidate", `observations.${index}.candidateId`, `Observation candidate does not match ${currentCandidateId}.`);
      rowSupports = false;
    }
    if (row.environmentId !== currentEnvironmentId || row.environmentId !== record.environmentId) {
      add("stale-row-environment", `observations.${index}.environmentId`, `Observation environment does not match ${currentEnvironmentId}.`);
      rowSupports = false;
    }
    if (!samePaths(row.paths, record.paths)) {
      add("path-mismatch", `observations.${index}.paths`, `Observation path identities do not match claim ${record.claimId}.`);
      rowSupports = false;
    }
    if (row.observationBoundary !== record.observationBoundary) {
      add("observation-boundary-mismatch", `observations.${index}.observationBoundary`, "Observation boundary does not match the claim.");
      rowSupports = false;
    }
    if (!row.terminal) {
      add("non-terminal-member", `observations.${index}.terminal`, `Observation for ${member} is not terminal.`);
      rowSupports = false;
    }
    if (row.status !== "supported") {
      add(row.status === "unknown" ? "member-unknown" : "member-not-supported", `observations.${index}.status`, `Observation for ${member} is ${row.status}.`);
      rowSupports = false;
    }
    for (const [unknownIndex, unknown] of row.unresolvedObservations.entries()) {
      add("unresolved-observation", `observations.${index}.unresolvedObservations.${unknownIndex}`, unknown);
      rowSupports = false;
    }
    if (row.evidenceRefs.length === 0 || hasMissingRef(row.evidenceRefs, availableEvidenceRefs) || row.evidenceRefs.some((ref) => !record.evidenceRefs.includes(ref))) {
      add("member-evidence-missing", `observations.${index}.evidenceRefs`, `Observation evidence for ${member} is absent or not bound by the claim.`);
      rowSupports = false;
    }
    if (rowSupports) supportedMembers++;
  }

  const stale = reasons.some((reason) => reason.code.startsWith("stale-"));
  const unknown = reasons.some((reason) => reason.code === "claim-unknown" || reason.code === "member-unknown" || reason.code === "unresolved-observation" || reason.code === "real-oracle-unknown" || reason.code.startsWith("partition-"));
  let state: ClaimClosureState;
  if (stale) state = "stale";
  else if (record.disposition === "narrowed" && record.narrowingAccepted && supportedMembers > 0) state = "narrowed";
  else if (record.disposition === "unknown" || unknown) state = "unknown";
  else if (record.disposition === "blocked" || reasons.length > 0) state = "blocked";
  else state = "supported";
  return {
    claimId: record.claimId,
    state,
    requiredMembers: record.population.members.length,
    supportedMembers,
    reasons: reasons.sort((left, right) => left.path.localeCompare(right.path) || left.code.localeCompare(right.code)),
  };
}
