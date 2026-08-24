import fs from "node:fs";
import path from "node:path";
import {
  evaluateClaimEvidence,
  inspectEvidenceDocument,
  type ClaimEvidenceRecord,
} from "../../bin/openspec-change/evidence.ts";
import { MAX_MANIFEST_BYTES, SAFE_ID } from "../../bin/openspec-change/manifest.ts";
import type {
  DeliveryContextClaimEvidence,
  DeliveryContextClaimEvidenceProjection,
  DeliveryContextClaimOmission,
} from "../../plugin/session-delivery-context/projection.ts";
import { hashRef } from "../../plugin/session-delivery-context/redaction.ts";

const CLAIM_LIMIT = 32;
const CHANGE_LIMIT = 32;

function record(value: unknown): Record<string, unknown> | null {
  if (value != null && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed != null && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function safeChangeId(value: unknown): string | null {
  return typeof value === "string" && SAFE_ID.test(value) ? value : null;
}

export function selectedClaimChangeIds(metadata: unknown): string[] {
  const mission = record(record(metadata)?.roadmapMission);
  const changeId = safeChangeId(mission?.changeId);
  return changeId == null ? [] : [changeId];
}

function omission(
  changeId: string | null,
  code: DeliveryContextClaimOmission["code"],
  detail: string,
  omitted = 0,
): DeliveryContextClaimOmission {
  return {
    changeRef: changeId == null ? null : hashRef("change", changeId),
    code,
    detail,
    omitted,
  };
}

function regularFile(filePath: string): { exists: boolean; valid: boolean } {
  try {
    const stat = fs.lstatSync(filePath);
    return {
      exists: true,
      valid: stat.isFile() && !stat.isSymbolicLink() && stat.size <= MAX_MANIFEST_BYTES,
    };
  } catch {
    return { exists: false, valid: false };
  }
}

function declaresBroadClaim(changeRoot: string): boolean {
  const proposalPath = path.join(changeRoot, "proposal.md");
  const source = regularFile(proposalPath);
  if (!source.valid) return false;
  try {
    const text = fs.readFileSync(proposalPath, "utf8");
    return text.includes("Claim And Evidence Scope") && text.includes("**Claim Class**");
  } catch {
    return false;
  }
}

function activeChangeIds(projectRoot: string): string[] {
  const changesRoot = path.join(projectRoot, "openspec", "changes");
  try {
    const stat = fs.lstatSync(changesRoot);
    if (!stat.isDirectory() || stat.isSymbolicLink()) return [];
    return fs.readdirSync(changesRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name !== "archive" && SAFE_ID.test(entry.name))
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right));
  } catch {
    return [];
  }
}

function projectClaim(
  changeId: string,
  claim: ClaimEvidenceRecord,
  currentCandidateId: string,
  currentEnvironmentId: string,
  availableEvidenceRefs: Set<string>,
): DeliveryContextClaimEvidence {
  const closure = evaluateClaimEvidence(
    claim,
    currentCandidateId,
    currentEnvironmentId,
    availableEvidenceRefs,
  );
  const value = claim;
  return {
    candidateId: value.candidateId,
    changeRef: hashRef("change", changeId),
    claimClass: value.claimClass,
    claimId: value.claimId,
    closureState: closure.state,
    coverageBasis: value.coverageBasis,
    disposition: value.disposition,
    environmentId: value.environmentId,
    evidenceRefs: value.evidenceRefs,
    independentChallenge: value.independentChallenge,
    materialExclusions: value.materialExclusions,
    maximumSupportedClaim: value.maximumSupportedClaim,
    observationBoundary: value.observationBoundary,
    outcomeRef: value.outcomeRef,
    paths: value.paths,
    population: {
      id: value.population.id,
      members: value.population.members,
      requiredMembers: closure.requiredMembers,
      supportedMembers: closure.supportedMembers,
    },
    realOracle: value.realOracle,
    statement: value.statement,
    unresolvedObservations: closure.reasons.map((reason) => ({
      code: reason.code,
      detail: reason.message,
      path: reason.path,
    })),
  };
}

export function readClaimEvidence(
  projectRoot: string | undefined,
  selectedChangeIds: readonly string[] = [],
): DeliveryContextClaimEvidenceProjection {
  const selection = selectedChangeIds.length > 0 ? "explicit" : projectRoot == null ? "none" : "all-active";
  if (projectRoot == null) {
    return { claims: [], complete: true, omissions: [], selection };
  }
  const root = path.resolve(projectRoot);
  const requested = selectedChangeIds.length > 0
    ? [...new Set(selectedChangeIds.filter((changeId) => SAFE_ID.test(changeId)))].sort((left, right) => left.localeCompare(right))
    : activeChangeIds(root);
  const omissions: DeliveryContextClaimOmission[] = [];
  const selected = requested.slice(0, CHANGE_LIMIT);
  if (requested.length > selected.length) {
    omissions.push(omission(null, "change-limit", "Active claim sources exceed the bounded change limit.", requested.length - selected.length));
  }
  const claims: DeliveryContextClaimEvidence[] = [];
  for (const changeId of selected) {
    const changeRoot = path.join(root, "openspec", "changes", changeId);
    const evidencePath = path.join(changeRoot, "evidence-index.json");
    const source = regularFile(evidencePath);
    if (!source.exists) {
      if (declaresBroadClaim(changeRoot)) {
        omissions.push(omission(changeId, "evidence-index-missing", "Declared broad claim has no evidence index."));
      }
      continue;
    }
    if (!source.valid) {
      omissions.push(omission(changeId, "evidence-index-oversized", "Evidence index is not a bounded regular file."));
      continue;
    }
    let parsed: ReturnType<typeof inspectEvidenceDocument>;
    try {
      parsed = inspectEvidenceDocument(JSON.parse(fs.readFileSync(evidencePath, "utf8")) as unknown);
    } catch {
      omissions.push(omission(changeId, "evidence-index-malformed", "Evidence index is unreadable or malformed."));
      continue;
    }
    if (!parsed.ok) {
      const detail = parsed.issues.slice(0, 8).map((issue) => `${issue.code}:${issue.path}`).join(", ");
      omissions.push(omission(changeId, "evidence-index-invalid", detail || "Evidence index schema is invalid."));
      continue;
    }
    const availableEvidenceRefs = new Set(parsed.value.lanes.map((lane) => lane.name));
    for (const claim of [...parsed.value.claims].sort((left, right) => left.claimId.localeCompare(right.claimId))) {
      claims.push(projectClaim(
        changeId,
        claim,
        parsed.value.candidateId,
        parsed.value.environmentId,
        availableEvidenceRefs,
      ));
    }
  }
  const boundedClaims = claims.slice(0, CLAIM_LIMIT);
  if (claims.length > boundedClaims.length) {
    omissions.push(omission(null, "claim-limit", "Claim records exceed the bounded projection limit.", claims.length - boundedClaims.length));
  }
  return {
    claims: boundedClaims,
    complete: omissions.length === 0,
    omissions,
    selection,
  };
}

export function terminalClaimBindings(
  projection: DeliveryContextClaimEvidenceProjection,
):
  | { acceptedClaimIds: string[]; claimEvidenceRefs: string[]; reason: null }
  | { acceptedClaimIds: []; claimEvidenceRefs: []; reason: "claim-closure-omitted" | "claim-selection-unresolved" | "claim-closure-incomplete" } {
  if (!projection.complete) {
    return { acceptedClaimIds: [], claimEvidenceRefs: [], reason: "claim-closure-omitted" };
  }
  if (projection.selection === "all-active" && projection.claims.length > 0) {
    return { acceptedClaimIds: [], claimEvidenceRefs: [], reason: "claim-selection-unresolved" };
  }
  if (projection.claims.some((claim) => claim.closureState !== "supported")) {
    return { acceptedClaimIds: [], claimEvidenceRefs: [], reason: "claim-closure-incomplete" };
  }
  return {
    acceptedClaimIds: projection.claims.map((claim) => claim.claimId).sort(),
    claimEvidenceRefs: [...new Set(projection.claims.flatMap((claim) => claim.evidenceRefs))].sort(),
    reason: null,
  };
}
