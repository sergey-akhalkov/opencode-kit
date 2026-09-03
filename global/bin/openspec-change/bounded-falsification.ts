export type BoundedFalsificationMode = "required" | "exempt";

export type BoundedFalsificationDeclaration =
  | { status: "missing" }
  | { status: "duplicate"; count: number }
  | { status: "malformed"; reason: string }
  | { status: "ok"; mode: BoundedFalsificationMode; text: string };

export const BOUNDED_FALSIFICATION_ATTACK_CLASSES = [
  "coherent-wrong-outcome",
  "silent-owner-decision",
  "missing-observable-oracle",
  "late-implementation-invalidation",
  "internal-contradiction",
  "unnecessary-scope",
] as const;

export type BoundedFalsificationAttackClass = typeof BOUNDED_FALSIFICATION_ATTACK_CLASSES[number];
export type BoundedFalsificationAttackState = "attempted" | "not-applicable" | "unknown";
export type BoundedFalsificationDisposition =
  | "confirmed"
  | "falsified"
  | "unreachable"
  | "unknown"
  | "owner-boundary"
  | "unproven"
  | "future-scope"
  | "optional"
  | "polish";
export type BoundedFalsificationProtocolMode = "single-stage" | "pre-authoring-separated";
export type BoundedFalsificationCandidateState = "absent" | "present" | "unknown";
export type BoundedFalsificationContinuity = "not-applicable" | "verified" | "unknown";

export type BoundedFalsificationReview = {
  originalRequestRef: string;
  reviewedRequestRef: string;
  acceptedOutcomeRef: string;
  candidateRef: string;
  reviewedCandidateRef: string;
  decisionSurface: string;
  reviewerAgent: "implementation-readiness-reviewer";
  reviewerSessionRef: string;
  effectiveModel: string;
  protocolMode: BoundedFalsificationProtocolMode;
  contextReconstructionRef: string;
  candidateStateAtReconstruction: BoundedFalsificationCandidateState;
  initialComparisonContinuity: BoundedFalsificationContinuity;
  correctedReviewFreshness: BoundedFalsificationContinuity;
  challengeCount: number;
  attackClasses: Array<{ id: BoundedFalsificationAttackClass; status: BoundedFalsificationAttackState }>;
  materialFindings: string[];
  mainDispositions: Array<{ findingId: string; status: BoundedFalsificationDisposition }>;
  correctionRef: string;
  invalidatedSurfaces: string[];
  terminalReason: string;
  terminalState: "closed" | "unknown";
  unresolvedEvidence: string[];
};

export type BoundedFalsificationReviewInspection =
  | { status: "ok"; value: BoundedFalsificationReview; protocolFields: "declared" | "legacy-projected"; semanticReadiness: "unknown" }
  | { status: "invalid"; reason: string; semanticReadiness: "unknown" };

const DECLARATION = /^\s*-\s+\*\*Bounded Falsification Review\*\*:\s*(.*)$/gmu;
const DECLARATION_VALUE = /^(required|exempt)\s+-\s+(\S.*)$/u;
const FIELD = /^\s*-\s+\*\*([^*]+)\*\*:\s*(.*)$/u;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/u;
const SAFE_REF = /^(?:artifact|candidate|correction|event|evidence|outcome|session):[A-Za-z0-9][A-Za-z0-9._/#-]*$/u;
const MODEL_REF = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/u;
const ATTACK_STATES = new Set<BoundedFalsificationAttackState>(["attempted", "not-applicable", "unknown"]);
const PROTOCOL_MODES = new Set<BoundedFalsificationProtocolMode>(["single-stage", "pre-authoring-separated"]);
const CANDIDATE_STATES = new Set<BoundedFalsificationCandidateState>(["absent", "present", "unknown"]);
const CONTINUITY_STATES = new Set<BoundedFalsificationContinuity>(["not-applicable", "verified", "unknown"]);
const DISPOSITIONS = new Set<BoundedFalsificationDisposition>([
  "confirmed",
  "falsified",
  "unreachable",
  "unknown",
  "owner-boundary",
  "unproven",
  "future-scope",
  "optional",
  "polish",
]);

function attackField(id: BoundedFalsificationAttackClass): string {
  return `Attack Class ${id}`;
}

const BASE_REVIEW_FIELDS = [
  "Original Request Ref",
  "Reviewed Request Ref",
  "Accepted Outcome Ref",
  "Candidate Ref",
  "Reviewed Candidate Ref",
  "Decision Surface",
  "Reviewer Agent",
  "Reviewer Session Ref",
  "Effective Model",
  "Challenge Count",
  ...BOUNDED_FALSIFICATION_ATTACK_CLASSES.map(attackField),
  "Material Findings",
  "Main Dispositions",
  "Correction Ref",
  "Invalidated Surfaces",
  "Terminal Reason",
  "Terminal State",
  "Unresolved Evidence",
] as const;
const PROTOCOL_REVIEW_FIELDS = [
  "Protocol Mode",
  "Context Reconstruction Ref",
  "Candidate State At Reconstruction",
  "Initial Comparison Continuity",
  "Corrected Review Freshness",
] as const;
const REVIEW_FIELDS = new Set([...BASE_REVIEW_FIELDS, ...PROTOCOL_REVIEW_FIELDS]);

export function parseBoundedFalsificationDeclaration(proposalText: string): BoundedFalsificationDeclaration {
  const matches = [...proposalText.matchAll(DECLARATION)].map((match) => (match[1] ?? "").trim());
  if (matches.length === 0) return { status: "missing" };
  if (matches.length > 1) return { status: "duplicate", count: matches.length };
  const parsed = DECLARATION_VALUE.exec(matches[0] ?? "");
  if (parsed == null) {
    return { status: "malformed", reason: "Declaration must be 'required - <decision surface>' or 'exempt - <Ordinary Small reason>'." };
  }
  return { status: "ok", mode: parsed[1] as BoundedFalsificationMode, text: parsed[2] ?? "" };
}

function parseFields(text: string): { status: "ok"; fields: Map<string, string>; protocolFieldsDeclared: boolean } | { status: "invalid"; reason: string } {
  if (!/^# Bounded Falsification Review\s*$/mu.test(text)) {
    return { status: "invalid", reason: "falsification-review.md must contain the '# Bounded Falsification Review' heading." };
  }
  const fields = new Map<string, string>();
  for (const line of text.split(/\r?\n/u)) {
    const match = FIELD.exec(line);
    if (match == null) continue;
    const name = (match[1] ?? "").trim();
    if (!REVIEW_FIELDS.has(name)) {
      return { status: "invalid", reason: `Unsupported deterministic field '${name}'; semantic materiality and task fit remain unknown.` };
    }
    if (fields.has(name)) {
      return { status: "invalid", reason: `Duplicate falsification-review field '${name}'.` };
    }
    const value = (match[2] ?? "").trim();
    if (value === "") {
      return { status: "invalid", reason: `Falsification-review field '${name}' must not be empty.` };
    }
    fields.set(name, value);
  }
  const missing = BASE_REVIEW_FIELDS.filter((field) => !fields.has(field));
  if (missing.length > 0) {
    return { status: "invalid", reason: `falsification-review.md is missing required field(s): ${missing.join(", ")}.` };
  }
  const declaredProtocolFields = PROTOCOL_REVIEW_FIELDS.filter((field) => fields.has(field));
  if (declaredProtocolFields.length !== 0 && declaredProtocolFields.length !== PROTOCOL_REVIEW_FIELDS.length) {
    const missingProtocolFields = PROTOCOL_REVIEW_FIELDS.filter((field) => !fields.has(field));
    return { status: "invalid", reason: `Protocol fields must be all present or all omitted for legacy readback; missing: ${missingProtocolFields.join(", ")}.` };
  }
  return { status: "ok", fields, protocolFieldsDeclared: declaredProtocolFields.length === PROTOCOL_REVIEW_FIELDS.length };
}

function parseRef(value: string, field: string, allowNone = false): string | { reason: string } {
  if (allowNone && value === "none") return value;
  return SAFE_REF.test(value)
    ? value
    : { reason: `${field} must be a privacy-safe reference, not raw request or review text.` };
}

function parseList(value: string, field: string): string[] | { reason: string } {
  if (value === "none") return [];
  const values = value.split(",").map((item) => item.trim());
  if (values.some((item) => !SAFE_ID.test(item)) || new Set(values).size !== values.length) {
    return { reason: `${field} must be 'none' or a unique comma-separated list of stable ids.` };
  }
  return values;
}

function formatList(values: string[]): string {
  return values.length === 0 ? "none" : values.join(", ");
}

export function inspectBoundedFalsificationReview(text: string): BoundedFalsificationReviewInspection {
  const parsed = parseFields(text);
  if (parsed.status === "invalid") return { ...parsed, semanticReadiness: "unknown" };
  const value = (field: string): string => parsed.fields.get(field) ?? "";

  const originalRequestRef = parseRef(value("Original Request Ref"), "Original Request Ref");
  if (typeof originalRequestRef !== "string") return { status: "invalid", reason: originalRequestRef.reason, semanticReadiness: "unknown" };
  const reviewedRequestRef = parseRef(value("Reviewed Request Ref"), "Reviewed Request Ref");
  if (typeof reviewedRequestRef !== "string") return { status: "invalid", reason: reviewedRequestRef.reason, semanticReadiness: "unknown" };
  if (reviewedRequestRef !== originalRequestRef) {
    return { status: "invalid", reason: "Reviewed Request Ref does not match Original Request Ref.", semanticReadiness: "unknown" };
  }
  const acceptedOutcomeRef = parseRef(value("Accepted Outcome Ref"), "Accepted Outcome Ref");
  if (typeof acceptedOutcomeRef !== "string") return { status: "invalid", reason: acceptedOutcomeRef.reason, semanticReadiness: "unknown" };
  const candidateRef = parseRef(value("Candidate Ref"), "Candidate Ref");
  if (typeof candidateRef !== "string") return { status: "invalid", reason: candidateRef.reason, semanticReadiness: "unknown" };
  const reviewedCandidateRef = parseRef(value("Reviewed Candidate Ref"), "Reviewed Candidate Ref");
  if (typeof reviewedCandidateRef !== "string") return { status: "invalid", reason: reviewedCandidateRef.reason, semanticReadiness: "unknown" };
  if (reviewedCandidateRef !== candidateRef) {
    return { status: "invalid", reason: "Reviewed Candidate Ref is stale for Candidate Ref.", semanticReadiness: "unknown" };
  }

  const reviewerAgent = value("Reviewer Agent");
  if (reviewerAgent !== "implementation-readiness-reviewer") {
    return { status: "invalid", reason: "Reviewer Agent must be implementation-readiness-reviewer.", semanticReadiness: "unknown" };
  }
  const reviewerSessionRef = parseRef(value("Reviewer Session Ref"), "Reviewer Session Ref", true);
  if (typeof reviewerSessionRef !== "string" || (reviewerSessionRef !== "none" && !reviewerSessionRef.startsWith("session:"))) {
    return { status: "invalid", reason: typeof reviewerSessionRef === "string" ? "Reviewer Session Ref must be 'none' or a session reference." : reviewerSessionRef.reason, semanticReadiness: "unknown" };
  }
  const effectiveModel = value("Effective Model");
  if (effectiveModel !== "unknown" && !MODEL_REF.test(effectiveModel)) {
    return { status: "invalid", reason: "Effective Model must be 'unknown' or a provider/model identity.", semanticReadiness: "unknown" };
  }

  let protocolMode: BoundedFalsificationProtocolMode = "single-stage";
  let contextReconstructionRef = "none";
  let candidateStateAtReconstruction: BoundedFalsificationCandidateState = "unknown";
  let initialComparisonContinuity: BoundedFalsificationContinuity = "not-applicable";
  let correctedReviewFreshness: BoundedFalsificationContinuity = "not-applicable";
  if (parsed.protocolFieldsDeclared) {
    protocolMode = value("Protocol Mode") as BoundedFalsificationProtocolMode;
    if (!PROTOCOL_MODES.has(protocolMode)) {
      return { status: "invalid", reason: "Protocol Mode must be single-stage or pre-authoring-separated.", semanticReadiness: "unknown" };
    }
    const parsedReconstructionRef = parseRef(value("Context Reconstruction Ref"), "Context Reconstruction Ref", true);
    if (typeof parsedReconstructionRef !== "string") {
      return { status: "invalid", reason: parsedReconstructionRef.reason, semanticReadiness: "unknown" };
    }
    contextReconstructionRef = parsedReconstructionRef;
    candidateStateAtReconstruction = value("Candidate State At Reconstruction") as BoundedFalsificationCandidateState;
    if (!CANDIDATE_STATES.has(candidateStateAtReconstruction)) {
      return { status: "invalid", reason: "Candidate State At Reconstruction must be absent, present, or unknown.", semanticReadiness: "unknown" };
    }
    initialComparisonContinuity = value("Initial Comparison Continuity") as BoundedFalsificationContinuity;
    if (!CONTINUITY_STATES.has(initialComparisonContinuity)) {
      return { status: "invalid", reason: "Initial Comparison Continuity must be not-applicable, verified, or unknown.", semanticReadiness: "unknown" };
    }
    correctedReviewFreshness = value("Corrected Review Freshness") as BoundedFalsificationContinuity;
    if (!CONTINUITY_STATES.has(correctedReviewFreshness)) {
      return { status: "invalid", reason: "Corrected Review Freshness must be not-applicable, verified, or unknown.", semanticReadiness: "unknown" };
    }
  }

  const challengeText = value("Challenge Count");
  if (!/^\d+$/u.test(challengeText)) {
    return { status: "invalid", reason: "Challenge Count must be an integer from 0 through 2.", semanticReadiness: "unknown" };
  }
  const challengeCount = Number(challengeText);
  if (challengeCount > 2) {
    return { status: "invalid", reason: "Challenge Count must not exceed the two-challenge ceiling.", semanticReadiness: "unknown" };
  }

  const attackClasses: BoundedFalsificationReview["attackClasses"] = [];
  for (const id of BOUNDED_FALSIFICATION_ATTACK_CLASSES) {
    const status = value(attackField(id)) as BoundedFalsificationAttackState;
    if (!ATTACK_STATES.has(status)) {
      return { status: "invalid", reason: `${attackField(id)} must be attempted, not-applicable, or unknown.`, semanticReadiness: "unknown" };
    }
    attackClasses.push({ id, status });
  }

  const materialFindings = parseList(value("Material Findings"), "Material Findings");
  if (!Array.isArray(materialFindings)) return { status: "invalid", reason: materialFindings.reason, semanticReadiness: "unknown" };
  const dispositionText = value("Main Dispositions");
  const mainDispositions: BoundedFalsificationReview["mainDispositions"] = [];
  if (dispositionText !== "none") {
    for (const item of dispositionText.split(",").map((entry) => entry.trim())) {
      const match = /^([A-Za-z0-9][A-Za-z0-9._-]*)=(.+)$/u.exec(item);
      const status = match?.[2] as BoundedFalsificationDisposition | undefined;
      if (match == null || status == null || !DISPOSITIONS.has(status)) {
        return { status: "invalid", reason: "Main Dispositions must be 'none' or unique finding-id=disposition rows.", semanticReadiness: "unknown" };
      }
      mainDispositions.push({ findingId: match[1] ?? "", status });
    }
  }
  const dispositionIds = mainDispositions.map((item) => item.findingId);
  if (new Set(dispositionIds).size !== dispositionIds.length || JSON.stringify(dispositionIds.slice().sort()) !== JSON.stringify(materialFindings.slice().sort())) {
    return { status: "invalid", reason: "Main Dispositions must correlate exactly with Material Findings.", semanticReadiness: "unknown" };
  }

  const correctionRef = parseRef(value("Correction Ref"), "Correction Ref", true);
  if (typeof correctionRef !== "string") return { status: "invalid", reason: correctionRef.reason, semanticReadiness: "unknown" };
  const invalidatedSurfaces = parseList(value("Invalidated Surfaces"), "Invalidated Surfaces");
  if (!Array.isArray(invalidatedSurfaces)) return { status: "invalid", reason: invalidatedSurfaces.reason, semanticReadiness: "unknown" };
  const terminalReason = value("Terminal Reason");
  if (!SAFE_ID.test(terminalReason)) {
    return { status: "invalid", reason: "Terminal Reason must be a stable id.", semanticReadiness: "unknown" };
  }
  const terminalState = value("Terminal State");
  if (terminalState !== "closed" && terminalState !== "unknown") {
    return { status: "invalid", reason: "Terminal State must be closed or unknown.", semanticReadiness: "unknown" };
  }
  const unresolvedEvidence = parseList(value("Unresolved Evidence"), "Unresolved Evidence");
  if (!Array.isArray(unresolvedEvidence)) return { status: "invalid", reason: unresolvedEvidence.reason, semanticReadiness: "unknown" };

  if (challengeCount === 0 && (reviewerSessionRef !== "none" || effectiveModel !== "unknown" || attackClasses.some((item) => item.status !== "unknown"))) {
    return { status: "invalid", reason: "A zero-challenge record must retain unknown reviewer evidence and attack-class states.", semanticReadiness: "unknown" };
  }
  if (challengeCount > 0 && (reviewerSessionRef === "none" || effectiveModel === "unknown")) {
    return { status: "invalid", reason: "A completed challenge requires reviewer session and effective model identities.", semanticReadiness: "unknown" };
  }
  if (terminalState === "closed" && challengeCount === 0) {
    return { status: "invalid", reason: "A closed required episode must contain at least one challenge.", semanticReadiness: "unknown" };
  }

  const hasConfirmedFinding = mainDispositions.some((item) => item.status === "confirmed");
  const hasCorrection = correctionRef !== "none";
  if (hasConfirmedFinding && !hasCorrection) {
    return { status: "invalid", reason: "A confirmed material finding requires a Correction Ref.", semanticReadiness: "unknown" };
  }
  if (hasCorrection && !hasConfirmedFinding) {
    return { status: "invalid", reason: "Correction Ref requires at least one confirmed material finding.", semanticReadiness: "unknown" };
  }
  if (invalidatedSurfaces.length > 0 && !hasCorrection) {
    return { status: "invalid", reason: "Invalidated Surfaces require a Correction Ref.", semanticReadiness: "unknown" };
  }
  if (challengeCount === 2 && (!hasCorrection || invalidatedSurfaces.length === 0)) {
    return {
      status: "invalid",
      reason: "Challenge Count 2 requires a confirmed correction that invalidated a challenged surface.",
      semanticReadiness: "unknown",
    };
  }
  if (challengeCount === 0 && (materialFindings.length > 0 || mainDispositions.length > 0 || hasCorrection || invalidatedSurfaces.length > 0)) {
    return {
      status: "invalid",
      reason: "Challenge Count 0 cannot contain findings, dispositions, correction, or invalidation.",
      semanticReadiness: "unknown",
    };
  }
  if (terminalState === "unknown" && unresolvedEvidence.length === 0) {
    return { status: "invalid", reason: "Terminal State unknown requires Unresolved Evidence.", semanticReadiness: "unknown" };
  }
  if (parsed.protocolFieldsDeclared) {
    if (protocolMode === "single-stage" && contextReconstructionRef !== "none") {
      return { status: "invalid", reason: "Protocol Mode single-stage requires Context Reconstruction Ref none.", semanticReadiness: "unknown" };
    }
    if (protocolMode === "single-stage" && initialComparisonContinuity !== "not-applicable") {
      return { status: "invalid", reason: "Protocol Mode single-stage requires Initial Comparison Continuity not-applicable.", semanticReadiness: "unknown" };
    }
    if (protocolMode === "pre-authoring-separated" && terminalState === "closed" && contextReconstructionRef === "none") {
      return { status: "invalid", reason: "A closed pre-authoring-separated record requires a non-none Context Reconstruction Ref.", semanticReadiness: "unknown" };
    }
    if (protocolMode === "pre-authoring-separated" && terminalState === "closed" && candidateStateAtReconstruction !== "absent") {
      return { status: "invalid", reason: "A closed pre-authoring-separated record requires Candidate State At Reconstruction absent.", semanticReadiness: "unknown" };
    }
    if (protocolMode === "pre-authoring-separated" && terminalState === "closed" && initialComparisonContinuity !== "verified") {
      return { status: "invalid", reason: "A closed pre-authoring-separated record requires Initial Comparison Continuity verified.", semanticReadiness: "unknown" };
    }
    if (challengeCount < 2 && correctedReviewFreshness === "verified") {
      return { status: "invalid", reason: "Corrected Review Freshness verified requires Challenge Count 2.", semanticReadiness: "unknown" };
    }
    if (challengeCount === 2 && terminalState === "closed" && correctedReviewFreshness !== "verified") {
      return { status: "invalid", reason: "A closed Challenge Count 2 record requires Corrected Review Freshness verified.", semanticReadiness: "unknown" };
    }
  }

  return {
    status: "ok",
    semanticReadiness: "unknown",
    protocolFields: parsed.protocolFieldsDeclared ? "declared" : "legacy-projected",
    value: {
      originalRequestRef,
      reviewedRequestRef,
      acceptedOutcomeRef,
      candidateRef,
      reviewedCandidateRef,
      decisionSurface: value("Decision Surface"),
      reviewerAgent,
      reviewerSessionRef,
      effectiveModel,
      protocolMode,
      contextReconstructionRef,
      candidateStateAtReconstruction,
      initialComparisonContinuity,
      correctedReviewFreshness,
      challengeCount,
      attackClasses,
      materialFindings,
      mainDispositions,
      correctionRef,
      invalidatedSurfaces,
      terminalReason,
      terminalState,
      unresolvedEvidence,
    },
  };
}

export function formatBoundedFalsificationReview(review: BoundedFalsificationReview): string {
  const lines = [
    "# Bounded Falsification Review",
    "",
    `- **Original Request Ref**: ${review.originalRequestRef}`,
    `- **Reviewed Request Ref**: ${review.reviewedRequestRef}`,
    `- **Accepted Outcome Ref**: ${review.acceptedOutcomeRef}`,
    `- **Candidate Ref**: ${review.candidateRef}`,
    `- **Reviewed Candidate Ref**: ${review.reviewedCandidateRef}`,
    `- **Decision Surface**: ${review.decisionSurface}`,
    `- **Reviewer Agent**: ${review.reviewerAgent}`,
    `- **Reviewer Session Ref**: ${review.reviewerSessionRef}`,
    `- **Effective Model**: ${review.effectiveModel}`,
    `- **Protocol Mode**: ${review.protocolMode}`,
    `- **Context Reconstruction Ref**: ${review.contextReconstructionRef}`,
    `- **Candidate State At Reconstruction**: ${review.candidateStateAtReconstruction}`,
    `- **Initial Comparison Continuity**: ${review.initialComparisonContinuity}`,
    `- **Corrected Review Freshness**: ${review.correctedReviewFreshness}`,
    `- **Challenge Count**: ${review.challengeCount}`,
    ...review.attackClasses.map((item) => `- **${attackField(item.id)}**: ${item.status}`),
    `- **Material Findings**: ${formatList(review.materialFindings)}`,
    `- **Main Dispositions**: ${review.mainDispositions.length === 0 ? "none" : review.mainDispositions.map((item) => `${item.findingId}=${item.status}`).join(", ")}`,
    `- **Correction Ref**: ${review.correctionRef}`,
    `- **Invalidated Surfaces**: ${formatList(review.invalidatedSurfaces)}`,
    `- **Terminal Reason**: ${review.terminalReason}`,
    `- **Terminal State**: ${review.terminalState}`,
    `- **Unresolved Evidence**: ${formatList(review.unresolvedEvidence)}`,
    "",
  ];
  return lines.join("\n");
}
