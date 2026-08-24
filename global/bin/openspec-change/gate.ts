import fs from "node:fs";
import path from "node:path";
import type { OpenSpecOperationGateCheck, OpenSpecOperationGateStatus } from "../openspec-operation-gate.ts";
import { inventoryOpenSpecChanges } from "./inventory.ts";
import {
  changeStateInputFromInventory,
  evaluateChangeState,
  type OfficialValidationFact,
} from "./state.ts";

export type OwnershipEnforcement = "advisory" | "blocking";

export type GateReaderOptions = {
  root: string;
  operation: string;
  changeId?: string;
  enforcement?: OwnershipEnforcement;
  selectedStrict?: OfficialValidationFact;
  repositoryValidation?: OfficialValidationFact;
};

const ENFORCEMENT_FILE = path.join("openspec", "ownership-enforcement.json");

function proposalClaimDeclaration(root: string, changeId: string): { declared: boolean; broad: boolean } {
  const proposal = path.join(root, "openspec", "changes", changeId, "proposal.md");
  if (!fs.existsSync(proposal) || !fs.statSync(proposal).isFile()) return { declared: false, broad: false };
  const text = fs.readFileSync(proposal, "utf8");
  return {
    declared: text.includes("Claim And Evidence Scope"),
    broad: text.includes("**Claim Class**"),
  };
}

export function resolveOwnershipEnforcement(root: string, explicit?: OwnershipEnforcement): OwnershipEnforcement {
  if (explicit != null) return explicit;
  const filePath = path.join(root, ENFORCEMENT_FILE);
  if (!fs.existsSync(filePath)) return "advisory";
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as { mode?: unknown };
    return parsed.mode === "blocking" ? "blocking" : "advisory";
  } catch {
    return "advisory";
  }
}

function check(
  id: string,
  label: string,
  status: OpenSpecOperationGateStatus,
  blocking: boolean,
  source: string,
  summary: string,
): OpenSpecOperationGateCheck {
  return { id, label, status, blocking, source, summary };
}

export function ownershipEvidenceGateChecks(options: GateReaderOptions): OpenSpecOperationGateCheck[] {
  const enforcement = resolveOwnershipEnforcement(options.root, options.enforcement);
  if (!["propose", "apply", "review", "acceptance", "archive"].includes(options.operation)) {
    return [];
  }
  const inventory = inventoryOpenSpecChanges(options.root);
  const checks: OpenSpecOperationGateCheck[] = [];
  const changeId = options.changeId;
  if (options.operation === "propose") {
    if (changeId == null) {
      checks.push(check("ownership:report", "OpenSpec ownership declaration", "unknown", enforcement === "blocking", "ownership.json", "Propose ownership report requires --change."));
      return checks;
    }
    const row = inventory.changes.find((item) => item.changeId === changeId);
    if (row == null) {
      checks.push(check("ownership:report", "OpenSpec ownership declaration", "unknown", false, `openspec/changes/${changeId}/ownership.json`, "Change is not in the active inventory."));
      return checks;
    }
    const status: OpenSpecOperationGateStatus = row.ownership.status === "present" ? "passed" : enforcement === "blocking" ? "failed" : "warning";
    checks.push(check(
      "ownership:report",
      "OpenSpec ownership declaration",
      status,
      enforcement === "blocking" && status !== "passed",
      `openspec/changes/${changeId}/ownership.json`,
      row.ownership.status === "present"
        ? `Ownership manifest present; mutationEnabled=${String(row.mutationEnabled)}.`
        : `Ownership manifest is ${row.ownership.status}.`,
    ));
  }
  if (options.operation === "apply" && changeId != null) {
    const overlap = inventory.overlaps.filter((item) => item.unresolved && (item.leftChangeId === changeId || item.rightChangeId === changeId));
    if (overlap.length > 0) {
      const owners = [...new Set(overlap.flatMap((item) => [item.leftChangeId, item.rightChangeId]))].sort((left, right) => left.localeCompare(right));
      const transfer = overlap.map((item) => item.transfer?.condition ?? item.dependency?.transferCondition ?? "unresolved").sort();
      checks.push(check(
        "ownership:overlap",
        "OpenSpec active ownership overlap",
        enforcement === "blocking" ? "failed" : "warning",
        enforcement === "blocking",
        owners.map((id) => `openspec/changes/${id}/ownership.json`).join(", "),
        `Unresolved overlap between ${owners.join(" and ")}; transfer=${transfer.join(",") || "none"}.`,
      ));
    }
  }
  if (changeId != null && ["propose", "apply", "review", "acceptance", "archive"].includes(options.operation)) {
    const declaration = proposalClaimDeclaration(options.root, changeId);
    const row = inventory.changes.find((item) => item.changeId === changeId);
    if (declaration.declared && row != null) {
      if (declaration.broad && row.claimRows === 0) {
        const mutationOperation = options.operation !== "propose";
        checks.push(check(
          "claim-evidence:records",
          "OpenSpec broad claim records",
          mutationOperation ? "failed" : "warning",
          mutationOperation,
          `openspec/changes/${changeId}/evidence-index.json`,
          "Declared broad Claim And Evidence Scope has no structured claim record; propose may retain this planning gap, but mutation and complete archive require the reviewed record.",
        ));
      } else if (row.claimRows === 0) {
        checks.push(check(
          "claim-evidence:exact-line",
          "OpenSpec exact-case claim scope",
          "passed",
          false,
          `openspec/changes/${changeId}/proposal.md`,
          "Concise exact-case scope is present; no broad structured closure was declared.",
        ));
      } else {
        const gaps = row.claims.filter((claim) => claim.state !== "supported" && claim.state !== "narrowed");
        const completionOperation = options.operation === "archive" || options.operation === "acceptance";
        const status: OpenSpecOperationGateStatus = gaps.length === 0 ? "passed" : completionOperation ? "failed" : "warning";
        const summaries = row.claims.map((claim) => {
          const reasons = claim.reasons.map((reason) => `${reason.code} at ${reason.path}: ${reason.message}`).join(" | ");
          return `${claim.claimId}=${claim.state}; observed=${claim.supportedMembers}/${claim.requiredMembers}; maximum=${claim.maximumSupportedClaim}${reasons ? `; ${reasons}` : ""}`;
        });
        checks.push(check(
          "claim-evidence:closure",
          "OpenSpec claim-evidence closure",
          status,
          completionOperation && gaps.length > 0,
          `openspec/changes/${changeId}/evidence-index.json`,
          summaries.join(" || "),
        ));
      }
    }
  }
  if ((options.operation === "archive" || options.operation === "acceptance") && changeId != null) {
    const row = inventory.changes.find((item) => item.changeId === changeId);
    if (row != null && (row.staleTasks.length > 0 || row.envelopeMismatches.length > 0 || row.incompleteTasks.length > 0)) {
      const candidate = options.selectedStrict?.attributableChangeId ?? changeId;
      checks.push(check(
        "evidence:stale",
        "OpenSpec task evidence freshness",
        enforcement === "blocking" ? "failed" : "warning",
        enforcement === "blocking",
        `openspec/changes/${changeId}/evidence-index.json`,
        `Checked task evidence is stale or mismatched for ${changeId}; current candidate ${candidate}; tasks=${[...row.staleTasks, ...row.envelopeMismatches, ...row.incompleteTasks].join(",")}.`,
      ));
    }
  }
  if (options.selectedStrict != null && changeId != null) {
    const evaluation = evaluateChangeState(changeStateInputFromInventory(
      inventory,
      changeId,
      options.selectedStrict,
      options.repositoryValidation ?? { scope: "repository", status: "unknown", diagnostic: "Repository validation was not supplied.", attributableChangeId: null },
    ));
    if (!evaluation.completeClaimAllowed) {
      const unknown = evaluation.localStatus === "unknown" || evaluation.repositoryStatus === "unknown";
      checks.push(check(
        "qualification:complete-claim",
        "OpenSpec truthful completion state",
        unknown ? "unknown" : enforcement === "blocking" ? "failed" : "warning",
        enforcement === "blocking" && !unknown,
        `openspec/changes/${changeId}`,
        evaluation.reasons.map((reason) => `${reason.code}: ${reason.message}`).join(" | ") || "Complete claim is not allowed.",
      ));
    }
  }
  return checks;
}

export function doctorOwnershipEvidenceChecks(root: string, enforcement?: OwnershipEnforcement): Array<{
  name: string;
  status: "pass" | "warn" | "blocked";
  detail: string;
  blocksQualification: boolean;
}> {
  const mode = resolveOwnershipEnforcement(root, enforcement);
  if (!fs.existsSync(path.join(root, "openspec", "changes"))) {
    return [];
  }
  const inventory = inventoryOpenSpecChanges(root);
  const findings = inventory.findings;
  if (findings.length === 0) {
    return [{
      name: "openspec ownership and evidence",
      status: "pass",
      detail: "Active OpenSpec ownership and evidence inventory has no advisory findings.",
      blocksQualification: false,
    }];
  }
  const blocking = mode === "blocking";
  return [{
    name: "openspec ownership and evidence",
    status: blocking ? "blocked" : "warn",
    detail: findings.map((finding) => `${finding.id} ${finding.code} [${finding.changeIds.join(",")}]: ${finding.fact}`).join(" | "),
    blocksQualification: blocking,
  }];
}

export function archiveEvidenceBlocker(root: string, changeId: string, enforcement?: OwnershipEnforcement): string | null {
  const checks = ownershipEvidenceGateChecks({ root, operation: "archive", changeId, enforcement });
  const blocking = checks.find((item) => item.blocking && item.status !== "passed" && item.status !== "warning");
  return blocking == null ? null : blocking.summary;
}

export function officialValidationUnknown(scope: OfficialValidationFact["scope"], reason: string): OfficialValidationFact {
  return { scope, status: "unknown", diagnostic: reason, attributableChangeId: null };
}
