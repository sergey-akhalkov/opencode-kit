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
};

export type OwnershipFact = {
  conflictFree: boolean;
  overlappingChangeIds: string[];
  cycles: string[][];
};

export type EvaluateChangeStateInput = {
  changeId: string;
  selectedStrict: OfficialValidationFact;
  repositoryValidation: OfficialValidationFact;
  artifacts: ArtifactTaskFact;
  ownership: OwnershipFact;
};

export type ChangeStateReason = {
  code: "invalid-complete" | "overlap" | "unrelated-failure" | "selected-unknown" | "repository-unknown" | "artifacts-stale" | "tasks-open";
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
  if (!input.ownership.conflictFree) {
    reasons.push({
      code: "overlap",
      message: `Unresolved ownership overlap: ${input.ownership.overlappingChangeIds.join(", ")}.`,
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
    || reason.code === "overlap"
    || reason.code === "artifacts-stale"
    || reason.code === "tasks-open"
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
      },
      ownership: { conflictFree: false, overlappingChangeIds: [], cycles: inventory.cycles },
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
    },
    ownership: {
      conflictFree: overlappingChangeIds.length === 0,
      overlappingChangeIds,
      cycles: inventory.cycles,
    },
  };
}
