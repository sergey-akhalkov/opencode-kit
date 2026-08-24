import type { OpenSpecChangeInventory } from "./inventory.ts";

export type ValidationStatus = "pass" | "fail" | "unknown";

export type OfficialValidationFact = {
  scope: "selected-strict" | "repository";
  status: ValidationStatus;
  diagnostic: string;
  attributableChangeId: string | null;
};

export type ArtifactTaskFact = {
  requiredArtifactsCurrent: boolean;
  checkedTasks: number;
  totalTasks: number;
  uncheckedTasks: number;
  incompleteTaskIds: string[];
  staleTaskIds: string[];
  envelopeMismatchTaskIds: string[];
};

export type OwnershipFact = {
  conflictFree: boolean;
  overlappingChangeIds: string[];
  cycles: string[][];
};

export type EvidenceEnvelopeFact = {
  overLimit: boolean;
  unindexedFiles: string[];
  retainedFiles: number;
  retainedBytes: number;
};

export type ClaimEvidenceFact = {
  claimId: string;
  state: "supported" | "narrowed" | "blocked" | "unknown" | "stale";
  maximumSupportedClaim: string;
  requiredMembers: number;
  supportedMembers: number;
  reasons: Array<{ code: string; path: string; message: string }>;
};

export type EvaluateChangeStateInput = {
  changeId: string;
  selectedStrict: OfficialValidationFact;
  repositoryValidation: OfficialValidationFact;
  artifacts: ArtifactTaskFact;
  ownership: OwnershipFact;
  evidence: EvidenceEnvelopeFact;
  claims?: ClaimEvidenceFact[];
};

export type ChangeStateReason = {
  code: "invalid-complete" | "stale-task" | "weaker-entrypoint" | "overlap" | "unrelated-failure" | "selected-unknown" | "repository-unknown" | "evidence-unbounded" | "artifacts-stale" | "tasks-open" | "claim-evidence-gap";
  message: string;
  changeId?: string;
};

export type ChangeStateEvaluation = {
  changeId: string;
  localStatus: "incomplete" | "blocked" | "ready" | "unknown";
  repositoryStatus: "pass" | "blocked" | "unknown";
  completeClaimAllowed: boolean;
  qualificationAllowed: boolean;
  reasons: ChangeStateReason[];
};

export type CaptureDecision = {
  action: "allow-capture" | "block-capture" | "replay";
  reason: string;
  bundle: string | null;
  deleted: false;
};

export function evaluateChangeState(input: EvaluateChangeStateInput): ChangeStateEvaluation {
  const reasons: ChangeStateReason[] = [];
  if (input.selectedStrict.scope !== "selected-strict") {
    reasons.push({ code: "selected-unknown", message: "Selected validation fact has an unknown scope." });
  }
  if (input.selectedStrict.status === "unknown") {
    reasons.push({ code: "selected-unknown", message: "Selected strict validation is unknown." });
  } else if (input.selectedStrict.status === "fail") {
    reasons.push({
      code: "invalid-complete",
      message: input.selectedStrict.diagnostic,
      changeId: input.changeId,
    });
  }
  if (!input.artifacts.requiredArtifactsCurrent) {
    reasons.push({ code: "artifacts-stale", message: "Required artifacts are not current." });
  }
  if (input.artifacts.uncheckedTasks > 0) {
    reasons.push({ code: "tasks-open", message: `${input.artifacts.uncheckedTasks} unchecked task(s) remain.` });
  }
  if (input.artifacts.staleTaskIds.length > 0) {
    reasons.push({
      code: "stale-task",
      message: `Stale task evidence: ${input.artifacts.staleTaskIds.join(", ")}.`,
      changeId: input.changeId,
    });
  }
  if (input.artifacts.envelopeMismatchTaskIds.length > 0) {
    reasons.push({
      code: "weaker-entrypoint",
      message: `Proof-envelope mismatch: ${input.artifacts.envelopeMismatchTaskIds.join(", ")}.`,
      changeId: input.changeId,
    });
  }
  if (input.artifacts.incompleteTaskIds.length > 0 && input.artifacts.checkedTasks > 0 && input.artifacts.uncheckedTasks === 0) {
    if (!reasons.some((reason) => reason.code === "invalid-complete" || reason.code === "stale-task" || reason.code === "weaker-entrypoint")) {
      reasons.push({
        code: "invalid-complete",
        message: `Checked tasks lack evidence: ${input.artifacts.incompleteTaskIds.join(", ")}.`,
        changeId: input.changeId,
      });
    }
  }
  if (!input.ownership.conflictFree) {
    reasons.push({
      code: "overlap",
      message: `Unresolved ownership overlap: ${input.ownership.overlappingChangeIds.join(", ")}.`,
    });
  }
  if (input.evidence.overLimit || input.evidence.unindexedFiles.length > 0) {
    reasons.push({
      code: "evidence-unbounded",
      message: `Evidence retention is unbounded or unindexed (${input.evidence.retainedFiles} files, ${input.evidence.retainedBytes} bytes, ${input.evidence.unindexedFiles.length} unindexed).`,
      changeId: input.changeId,
    });
  }
  for (const claim of input.claims ?? []) {
    if (claim.state === "supported" || claim.state === "narrowed") continue;
    const details = claim.reasons.map((reason) => `${reason.code} at ${reason.path}: ${reason.message}`).join(" | ");
    reasons.push({
      code: "claim-evidence-gap",
      message: `Claim ${claim.claimId} is ${claim.state}; observed ${claim.supportedMembers}/${claim.requiredMembers}; maximum: ${claim.maximumSupportedClaim}.${details ? ` ${details}` : ""}`,
      changeId: input.changeId,
    });
  }

  let repositoryStatus: ChangeStateEvaluation["repositoryStatus"] = "pass";
  if (input.repositoryValidation.status === "unknown") {
    repositoryStatus = "unknown";
    reasons.push({ code: "repository-unknown", message: "Repository OpenSpec validation is unknown." });
  } else if (input.repositoryValidation.status === "fail") {
    const other = input.repositoryValidation.attributableChangeId;
    if (other != null && other !== input.changeId) {
      repositoryStatus = "blocked";
      reasons.push({
        code: "unrelated-failure",
        message: input.repositoryValidation.diagnostic,
        changeId: other,
      });
    } else {
      repositoryStatus = "blocked";
      reasons.push({
        code: "invalid-complete",
        message: input.repositoryValidation.diagnostic,
        changeId: input.changeId,
      });
    }
  }

  const selectedBlocks = input.selectedStrict.status !== "pass";
  const localDefect = reasons.some((reason) =>
    reason.code === "invalid-complete"
    || reason.code === "stale-task"
    || reason.code === "weaker-entrypoint"
    || reason.code === "overlap"
    || reason.code === "evidence-unbounded"
    || reason.code === "artifacts-stale"
    || reason.code === "tasks-open"
    || reason.code === "claim-evidence-gap"
  );
  const unknown = reasons.some((reason) => reason.code === "selected-unknown");
  const localStatus: ChangeStateEvaluation["localStatus"] = unknown
    ? "unknown"
    : localDefect || selectedBlocks
      ? (input.ownership.conflictFree ? "incomplete" : "blocked")
      : "ready";
  const completeClaimAllowed = localStatus === "ready" && repositoryStatus === "pass";
  const qualificationAllowed = completeClaimAllowed;
  return {
    changeId: input.changeId,
    localStatus,
    repositoryStatus,
    completeClaimAllowed,
    qualificationAllowed,
    reasons,
  };
}

export function changeStateInputFromInventory(
  inventory: OpenSpecChangeInventory,
  changeId: string,
  selectedStrict: OfficialValidationFact,
  repositoryValidation: OfficialValidationFact,
  artifactsCurrent = true,
): EvaluateChangeStateInput {
  const row = inventory.changes.find((item) => item.changeId === changeId);
  if (row == null) {
    return {
      changeId,
      selectedStrict,
      repositoryValidation,
      artifacts: {
        requiredArtifactsCurrent: false,
        checkedTasks: 0,
        totalTasks: 0,
        uncheckedTasks: 0,
        incompleteTaskIds: [],
        staleTaskIds: [],
        envelopeMismatchTaskIds: [],
      },
      ownership: { conflictFree: false, overlappingChangeIds: [], cycles: inventory.cycles },
      evidence: { overLimit: true, unindexedFiles: [], retainedFiles: 0, retainedBytes: 0 },
      claims: [],
    };
  }
  const overlappingChangeIds = [...new Set(
    inventory.overlaps.filter((item) => item.unresolved && (item.leftChangeId === changeId || item.rightChangeId === changeId))
      .flatMap((item) => [item.leftChangeId, item.rightChangeId]),
  )].sort((left, right) => left.localeCompare(right));
  return {
    changeId,
    selectedStrict,
    repositoryValidation,
    artifacts: {
      requiredArtifactsCurrent: artifactsCurrent,
      checkedTasks: row.checkedTasks,
      totalTasks: row.checkedTasks + row.uncheckedTasks,
      uncheckedTasks: row.uncheckedTasks,
      incompleteTaskIds: row.incompleteTasks,
      staleTaskIds: row.staleTasks,
      envelopeMismatchTaskIds: row.envelopeMismatches,
    },
    ownership: {
      conflictFree: overlappingChangeIds.length === 0,
      overlappingChangeIds,
      cycles: inventory.cycles,
    },
    evidence: {
      overLimit: row.overLimit,
      unindexedFiles: row.unindexedFiles,
      retainedFiles: row.retainedFiles,
      retainedBytes: row.retainedBytes,
    },
    claims: row.claims,
  };
}

export function decideEvidenceAction(input: {
  overLimit: boolean;
  unindexed: boolean;
  evaluatorFailed: boolean;
  rawBundleTrustworthy: boolean;
  rawBundlePath: string | null;
}): CaptureDecision {
  if (input.overLimit || input.unindexed) {
    return {
      action: "block-capture",
      reason: input.overLimit ? "Active evidence exceeds the retained file or byte limit." : "Unindexed evidence files are present.",
      bundle: null,
      deleted: false,
    };
  }
  if (input.evaluatorFailed && input.rawBundleTrustworthy && input.rawBundlePath != null) {
    return {
      action: "replay",
      reason: "Raw capture is trustworthy; route evaluator replay over the preserved bundle.",
      bundle: input.rawBundlePath,
      deleted: false,
    };
  }
  if (input.evaluatorFailed && (input.rawBundlePath == null || !input.rawBundleTrustworthy)) {
    return {
      action: "block-capture",
      reason: "Evaluator failed without a trustworthy indexed raw bundle.",
      bundle: null,
      deleted: false,
    };
  }
  return {
    action: "allow-capture",
    reason: "Retention is inside bounds and no evaluator-only failure is pending replay.",
    bundle: null,
    deleted: false,
  };
}
