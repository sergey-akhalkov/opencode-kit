#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { automationDividendTasks, parseAutomationDividend } from "./openspec-change/automation-dividend.ts";
import { inspectBoundedFalsificationReview, parseBoundedFalsificationDeclaration } from "./openspec-change/bounded-falsification.ts";
import { loadDeliveryHorizon, parseDeliveryHorizonDeclaration } from "./openspec-change/delivery-horizon.ts";
import { ownershipGateChecks } from "./openspec-change/gate.ts";

export { formatBoundedFalsificationReview, inspectBoundedFalsificationReview } from "./openspec-change/bounded-falsification.ts";
export type { BoundedFalsificationReview } from "./openspec-change/bounded-falsification.ts";

export type OpenSpecOperationGateStatus = "passed" | "warning" | "failed" | "blocked" | "unknown" | "not-applicable";

export type OpenSpecOperationGateCheck = {
  id: string;
  label: string;
  status: OpenSpecOperationGateStatus;
  blocking: boolean;
  source: string;
  summary: string;
};

export type OpenSpecOperationGateOutput = {
  schemaVersion: 1;
  operation: string;
  changeId?: string;
  generatedAt: string;
  status: Exclude<OpenSpecOperationGateStatus, "not-applicable">;
  exitCode: number;
  checks: OpenSpecOperationGateCheck[];
  nextActions: Array<{ label: string; reason: string }>;
  persistedPath?: string;
};

export type OpenSpecOperationGateOptions = {
  operation: string;
  changeId?: string;
  generatedAt?: string;
  persist?: boolean;
  enforcement?: "advisory" | "blocking";
};

type CliOptions = OpenSpecOperationGateOptions & { root: string };

const knownOperations = new Set([
  "propose",
  "apply",
  "task-update",
  "review",
  "acceptance",
  "archive",
  "post-archive",
]);

const changeScopedOperations = new Set([...knownOperations]);

const specCapsuleFields = [
  "Outcome",
  "Operating Envelope",
  "Non-Goals",
  "Non-Deferrable Invariants",
  "Observable Proof",
  "Material Residual Risks",
  "Stop Line",
] as const;

const broadClaimScopeFields = [
  "Claim ID",
  "Claim Class",
  "Population",
  "Coverage Basis",
  "Production Path",
  "Comparison Paths",
  "Environment",
  "Real Oracle",
  "Unresolved Observations",
  "Maximum Claim",
] as const;

function normalizePath(value: string): string {
  return value.replaceAll("\\", "/");
}

function safeChangeId(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value) && value !== "." && value !== "..";
}

function redactRoot(root: string, text: string): string {
  return text.replaceAll(root, "<repo>").replaceAll(normalizePath(root), "<repo>");
}

function check(id: string, label: string, status: OpenSpecOperationGateStatus, blocking: boolean, source: string, summary: string): OpenSpecOperationGateCheck {
  return { id, label, status, blocking, source, summary };
}

function countMarkdownChecklistItems(text: string): { checked: number; unchecked: number; total: number } {
  let checked = 0;
  let unchecked = 0;
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*[-*]\s+\[([ xX])\]\s+/.exec(line);
    if (match == null) {
      continue;
    }
    if (match[1] === " ") {
      unchecked++;
    } else {
      checked++;
    }
  }
  return { checked, unchecked, total: checked + unchecked };
}

function changeRoot(root: string, changeId: string): string {
  return path.join(root, "openspec", "changes", changeId);
}

function changePath(root: string, changeId: string, ...parts: string[]): string {
  return path.join(changeRoot(root, changeId), ...parts);
}

function requiredChangeChecks(root: string, operation: string, changeId: string | undefined): OpenSpecOperationGateCheck[] {
  if (!changeScopedOperations.has(operation)) {
    return [];
  }
  if (changeId == null || changeId.trim().length === 0) {
    return [check("scope:change:required", "OpenSpec change scope", "blocked", true, "cli", `Operation ${operation} requires --change <change-id>.`)];
  }
  if (!safeChangeId(changeId)) {
    return [check("scope:change:safe-id", "OpenSpec safe change id", "blocked", true, changeId, "Change id must be a safe relative OpenSpec change id.")];
  }
  const rootPath = changeRoot(root, changeId);
  if (!fs.existsSync(rootPath) || !fs.statSync(rootPath).isDirectory()) {
    return [check("scope:change:exists", "OpenSpec change directory", "failed", true, `openspec/changes/${changeId}`, "Scoped change directory is missing.")];
  }
  return [check("scope:change:exists", "OpenSpec change directory", "passed", false, `openspec/changes/${changeId}`, "Scoped change directory exists.")];
}

function artifactChecks(root: string, operation: string, changeId: string | undefined): OpenSpecOperationGateCheck[] {
  if (changeId == null || !safeChangeId(changeId) || !fs.existsSync(changeRoot(root, changeId))) {
    return [];
  }
  const checks: OpenSpecOperationGateCheck[] = [];
  const proposalPath = changePath(root, changeId, "proposal.md");
  const tasksPath = changePath(root, changeId, "tasks.md");
  const historyPath = changePath(root, changeId, "history.md");
  const specsPath = changePath(root, changeId, "specs");
  if (["propose", "apply", "review", "acceptance", "archive"].includes(operation)) {
    const hasProposal = fs.existsSync(proposalPath) && fs.statSync(proposalPath).isFile();
    checks.push(hasProposal
      ? check("artifact:proposal", "OpenSpec proposal", "passed", false, `openspec/changes/${changeId}/proposal.md`, "proposal.md exists.")
      : check("artifact:proposal", "OpenSpec proposal", "failed", true, `openspec/changes/${changeId}/proposal.md`, "proposal.md is required."));
    if (hasProposal) {
      const proposalText = fs.readFileSync(proposalPath, "utf8");
      const missingFields = specCapsuleFields.filter((field) => !proposalText.includes(field));
      checks.push(missingFields.length === 0
        ? check("artifact:proposal-capsule", "OpenSpec proposal outcome capsule", "passed", false, `openspec/changes/${changeId}/proposal.md`, "proposal.md contains every required current-increment Outcome Capsule field.")
        : check("artifact:proposal-capsule", "OpenSpec proposal outcome capsule", "failed", true, `openspec/changes/${changeId}/proposal.md`, `proposal.md is missing required Outcome Capsule field(s): ${missingFields.join(", ")}.`));
      const hasClaimScope = proposalText.includes("Claim And Evidence Scope");
      const broadDeclared = proposalText.includes("**Claim Class**");
      const missingClaimFields = broadDeclared
        ? broadClaimScopeFields.filter((field) => !proposalText.includes(`**${field}**`))
        : [];
      const requireClaimScope = operation === "propose" || hasClaimScope;
      if (requireClaimScope) {
        checks.push(!hasClaimScope
          ? check("artifact:proposal-claim-scope", "OpenSpec proposal claim scope", "failed", true, `openspec/changes/${changeId}/proposal.md`, "proposal.md is missing Claim And Evidence Scope.")
          : missingClaimFields.length > 0
            ? check("artifact:proposal-claim-scope", "OpenSpec proposal claim scope", "failed", true, `openspec/changes/${changeId}/proposal.md`, `Declared broad Claim And Evidence Scope is missing field(s): ${missingClaimFields.join(", ")}.`)
            : check("artifact:proposal-claim-scope", "OpenSpec proposal claim scope", "passed", false, `openspec/changes/${changeId}/proposal.md`, broadDeclared
              ? "Declared broad Claim And Evidence Scope contains every explicit field; values remain reviewed author input."
              : "Concise exact-case Claim And Evidence Scope is present; no semantic breadth was inferred from prose."));
      }
    }
  }
  if (["apply", "task-update", "review", "acceptance", "archive"].includes(operation)) {
    if (!fs.existsSync(tasksPath) || !fs.statSync(tasksPath).isFile()) {
      checks.push(check("artifact:tasks", "OpenSpec tasks", "failed", true, `openspec/changes/${changeId}/tasks.md`, "tasks.md is required."));
    } else {
      const counts = countMarkdownChecklistItems(fs.readFileSync(tasksPath, "utf8"));
      checks.push(check("artifact:tasks", "OpenSpec tasks", "passed", false, `openspec/changes/${changeId}/tasks.md`, `tasks.md exists with ${counts.unchecked}/${counts.total} unchecked task(s).`));
      if (operation === "archive" && counts.total === 0) {
        checks.push(check("archive:tasks-empty", "OpenSpec complete archive task evidence", "failed", true, `openspec/changes/${changeId}/tasks.md`, "Complete archive requires at least one trackable task."));
      } else if (operation === "archive" && counts.unchecked > 0) {
        checks.push(check("archive:tasks-incomplete", "OpenSpec complete archive task evidence", "failed", true, `openspec/changes/${changeId}/tasks.md`, `Complete archive is blocked by ${counts.unchecked} unchecked task(s).`));
      }
      if (counts.total > 0 && counts.unchecked === 0 && operation === "task-update") {
        checks.push(check("task-update:all-checked", "OpenSpec task update freshness", "warning", false, `openspec/changes/${changeId}/tasks.md`, "tasks.md is all checked; active change may need archive or stale-state reconciliation."));
      }
    }
  }
  if (["propose", "apply", "task-update", "review", "acceptance", "archive"].includes(operation)) {
    const hasHistory = fs.existsSync(historyPath) && fs.statSync(historyPath).isFile();
    checks.push(hasHistory
      ? check("artifact:strategy-history", "OpenSpec strategy history", "passed", false, `openspec/changes/${changeId}/history.md`, "history.md exists for strategy continuity.")
      : check("artifact:strategy-history", "OpenSpec strategy history", "failed", true, `openspec/changes/${changeId}/history.md`, "history.md is required for strategy continuity."));
    if (hasHistory && !/^# Strategy History\s*$/m.test(fs.readFileSync(historyPath, "utf8"))) {
      checks.push(check("artifact:strategy-history-heading", "OpenSpec strategy history format", "failed", true, `openspec/changes/${changeId}/history.md`, "history.md must contain the '# Strategy History' heading."));
    }
  }
  if (operation === "propose" || operation === "apply") {
    const hasSpecDelta = fs.existsSync(specsPath) && fs.statSync(specsPath).isDirectory() && fs.readdirSync(specsPath, { recursive: true }).some((entry) => String(entry).endsWith("spec.md"));
    checks.push(hasSpecDelta
      ? check("artifact:spec-delta", "OpenSpec spec delta", "passed", false, `openspec/changes/${changeId}/specs`, "Spec delta artifact exists.")
      : check("artifact:spec-delta", "OpenSpec spec delta", "warning", false, `openspec/changes/${changeId}/specs`, "No spec delta was found; confirm this operation is docs/tooling-only or add spec coverage."));
  }
  return checks;
}

function dividendChecks(root: string, operation: string, changeId: string | undefined): OpenSpecOperationGateCheck[] {
  if (changeId == null || !safeChangeId(changeId) || !fs.existsSync(changeRoot(root, changeId))) return [];
  if (!["propose", "apply", "archive"].includes(operation)) return [];
  const proposalPath = changePath(root, changeId, "proposal.md");
  if (!fs.existsSync(proposalPath)) return [];
  const parsed = parseAutomationDividend(fs.readFileSync(proposalPath, "utf8"));
  const source = `openspec/changes/${changeId}/proposal.md`;
  if (parsed.status === "missing") {
    return operation === "propose"
      ? [check("artifact:automation-dividend", "OpenSpec automation dividend", "failed", true, source, "proposal.md is missing Automation Dividend: required - <candidate> or exempt - <reason>.")]
      : [];
  }
  if (parsed.status === "duplicate") {
    return [check("artifact:automation-dividend", "OpenSpec automation dividend", "failed", true, source, `proposal.md has ${parsed.count} Automation Dividend declarations.`)];
  }
  if (parsed.status === "malformed") {
    return [check("artifact:automation-dividend", "OpenSpec automation dividend", "failed", true, source, parsed.reason)];
  }
  const checks = [check("artifact:automation-dividend", "OpenSpec automation dividend", "passed", false, source, `Automation Dividend is ${parsed.mode}.`)];
  if (operation === "propose") return checks;
  const tasksPath = changePath(root, changeId, "tasks.md");
  if (!fs.existsSync(tasksPath)) return checks;
  const tagged = automationDividendTasks(fs.readFileSync(tasksPath, "utf8"));
  const tasksSource = `openspec/changes/${changeId}/tasks.md`;
  if (parsed.mode === "exempt") {
    checks.push(tagged.length === 0
      ? check("artifact:automation-dividend-task", "OpenSpec automation dividend task", "passed", false, tasksSource, "Exempt declaration has no [automation-dividend] task.")
      : check("artifact:automation-dividend-task", "OpenSpec automation dividend task", "failed", true, tasksSource, `Exempt declaration must not include an [automation-dividend] task; found ${tagged.length}.`));
    return checks;
  }
  if (tagged.length !== 1) {
    checks.push(check("artifact:automation-dividend-task", "OpenSpec automation dividend task", "failed", true, tasksSource, `Required declaration needs exactly one [automation-dividend] task; found ${tagged.length}.`));
    return checks;
  }
  const dividend = tagged[0];
  if (dividend == null) return checks;
  checks.push(check("artifact:automation-dividend-task", "OpenSpec automation dividend task", "passed", false, tasksSource, "Required declaration has exactly one [automation-dividend] task."));
  if (operation !== "archive") return checks;
  if (!dividend.checked) {
    checks.push(check("archive:automation-dividend", "OpenSpec automation dividend archive", "failed", true, tasksSource, "Required automation dividend task is unchecked."));
    return checks;
  }
  checks.push(check("archive:automation-dividend", "OpenSpec automation dividend archive", "passed", false, tasksSource, "Required automation dividend task is checked."));
  return checks;
}

function falsificationChecks(root: string, operation: string, changeId: string | undefined): OpenSpecOperationGateCheck[] {
  if (changeId == null || !safeChangeId(changeId) || !fs.existsSync(changeRoot(root, changeId))) return [];
  if (!["propose", "apply", "review", "acceptance", "archive"].includes(operation)) return [];
  const proposalPath = changePath(root, changeId, "proposal.md");
  if (!fs.existsSync(proposalPath)) return [];
  const declaration = parseBoundedFalsificationDeclaration(fs.readFileSync(proposalPath, "utf8"));
  const proposalSource = `openspec/changes/${changeId}/proposal.md`;
  if (declaration.status === "missing") {
    const blocking = operation === "propose" || operation === "archive";
    return [check("artifact:bounded-falsification-declaration", "OpenSpec bounded falsification declaration", blocking ? "failed" : "warning", blocking, proposalSource, "proposal.md is missing Bounded Falsification Review: required - <decision surface> or exempt - <Ordinary Small reason>.")];
  }
  if (declaration.status === "duplicate") {
    return [check("artifact:bounded-falsification-declaration", "OpenSpec bounded falsification declaration", "failed", true, proposalSource, `proposal.md has ${declaration.count} Bounded Falsification Review declarations.`)];
  }
  if (declaration.status === "malformed") {
    return [check("artifact:bounded-falsification-declaration", "OpenSpec bounded falsification declaration", "failed", true, proposalSource, declaration.reason)];
  }

  const checks = [check("artifact:bounded-falsification-declaration", "OpenSpec bounded falsification declaration", "passed", false, proposalSource, `Bounded Falsification Review is ${declaration.mode}; applicability remains reviewed semantic input.`)];
  const reviewPath = changePath(root, changeId, "falsification-review.md");
  const reviewSource = `openspec/changes/${changeId}/falsification-review.md`;
  if (declaration.mode === "exempt") {
    checks.push(fs.existsSync(reviewPath)
      ? check("artifact:bounded-falsification-record", "OpenSpec bounded falsification record", "failed", true, reviewSource, "An exempt declaration must not create a synthetic falsification-review.md record.")
      : check("artifact:bounded-falsification-record", "OpenSpec bounded falsification record", "passed", false, proposalSource, "Reviewed exemption has no synthetic review record; exemption correctness remains semantic input."));
    return checks;
  }
  if (!fs.existsSync(reviewPath)) {
    const blocking = operation === "archive";
    checks.push(check("artifact:bounded-falsification-record", "OpenSpec bounded falsification record", blocking ? "failed" : "warning", blocking, reviewSource, "Required falsification-review.md is missing; structural artifacts may remain valid while semantic readiness is unknown."));
    return checks;
  }
  const review = inspectBoundedFalsificationReview(fs.readFileSync(reviewPath, "utf8"));
  if (review.status === "invalid") {
    checks.push(check("artifact:bounded-falsification-record", "OpenSpec bounded falsification record", "failed", true, reviewSource, review.reason));
    return checks;
  }
  if (review.value.decisionSurface !== declaration.text) {
    checks.push(check("artifact:bounded-falsification-record", "OpenSpec bounded falsification record", "failed", true, reviewSource, "Decision Surface does not match the proposal declaration."));
    return checks;
  }
  checks.push(check("artifact:bounded-falsification-record", "OpenSpec bounded falsification record", "passed", false, reviewSource, `Record is structurally valid for ${review.value.candidateRef}; deterministic semantic readiness remains ${review.semanticReadiness}.`));
  return checks;
}

function deliveryHorizonChecks(root: string, operation: string, changeId: string | undefined): OpenSpecOperationGateCheck[] {
  if (changeId == null || !safeChangeId(changeId) || !fs.existsSync(changeRoot(root, changeId))) return [];
  if (!["propose", "apply", "task-update", "review", "acceptance", "archive"].includes(operation)) return [];
  const proposalPath = changePath(root, changeId, "proposal.md");
  const source = `openspec/changes/${changeId}/proposal.md`;
  if (!fs.existsSync(proposalPath)) {
    return operation === "propose"
      ? [check("artifact:delivery-horizon", "OpenSpec Delivery Horizon declaration", "failed", true, source, "proposal.md is missing the required Delivery Horizon declaration.")]
      : [];
  }
  let proposalText: string;
  try {
    proposalText = fs.readFileSync(proposalPath, "utf8");
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return [check("artifact:delivery-horizon", "OpenSpec Delivery Horizon declaration", "failed", true, source, `Delivery Horizon declaration is unreadable: ${reason}`)];
  }
  const declaration = parseDeliveryHorizonDeclaration(proposalText);
  if (declaration.status === "legacy-unlinked") {
    return operation === "propose"
      ? [check("artifact:delivery-horizon", "OpenSpec Delivery Horizon declaration", "failed", true, source, "New proposals require exactly one Delivery Horizon declaration.")]
      : [check("artifact:delivery-horizon", "OpenSpec Delivery Horizon declaration", "passed", false, source, "Proposal has no Delivery Horizon declaration and remains legacy-unlinked.")];
  }
  if (declaration.status === "duplicate") {
    return [check("artifact:delivery-horizon", "OpenSpec Delivery Horizon declaration", "failed", true, source, `proposal.md has ${declaration.count} Delivery Horizon declarations.`)];
  }
  if (declaration.status === "malformed") {
    return [check("artifact:delivery-horizon", "OpenSpec Delivery Horizon declaration", "failed", true, source, declaration.reason)];
  }
  if (declaration.status === "none") {
    return [check("artifact:delivery-horizon", "OpenSpec Delivery Horizon declaration", "passed", false, source, "Delivery Horizon is none with a non-empty reviewed reason.")];
  }
  try {
    loadDeliveryHorizon(root, declaration.horizonId);
    return [check("artifact:delivery-horizon", "OpenSpec Delivery Horizon declaration", "passed", false, source, `Delivery Horizon '${declaration.horizonId}' exists and has valid contained references.`)];
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return [check("artifact:delivery-horizon", "OpenSpec Delivery Horizon declaration", "failed", true, source, `Delivery Horizon '${declaration.horizonId}' is invalid: ${reason}`)];
  }
}

function operationChecks(root: string, operation: string, changeId: string | undefined, enforcement?: "advisory" | "blocking"): OpenSpecOperationGateCheck[] {
  if (!knownOperations.has(operation)) {
    return [check("operation:known", "OpenSpec operation registry", "unknown", true, operation, `Unknown OpenSpec operation ${operation}.`)];
  }
  return [
    ...requiredChangeChecks(root, operation, changeId),
    ...artifactChecks(root, operation, changeId),
    ...deliveryHorizonChecks(root, operation, changeId),
    ...dividendChecks(root, operation, changeId),
    ...falsificationChecks(root, operation, changeId),
    ...ownershipGateChecks({ root, operation, changeId, enforcement }),
  ];
}

function statusFor(checks: OpenSpecOperationGateCheck[]): Exclude<OpenSpecOperationGateStatus, "not-applicable"> {
  if (checks.some((item) => item.status === "blocked")) {
    return "blocked";
  }
  if (checks.some((item) => item.status === "failed")) {
    return "failed";
  }
  if (checks.some((item) => item.status === "unknown")) {
    return "unknown";
  }
  if (checks.some((item) => item.status === "warning")) {
    return "warning";
  }
  return "passed";
}

function nextActionsFor(status: Exclude<OpenSpecOperationGateStatus, "not-applicable">): Array<{ label: string; reason: string }> {
  if (status === "passed") {
    return [{ label: "Continue operation", reason: "Operation gate passed for available cheap read-only checks." }];
  }
  if (status === "warning") {
    return [{ label: "Review warning evidence", reason: "Warnings are non-blocking but should be reconciled before sensitive lifecycle operations." }];
  }
  if (status === "blocked") {
    return [{ label: "Resolve operation blocker", reason: "Required operation scope or safety evidence is missing." }];
  }
  if (status === "unknown") {
    return [{ label: "Use supported operation", reason: "Operation is not in the deterministic gate registry." }];
  }
  return [{ label: "Fix failed gate", reason: "A blocking operation gate failed and must be fixed before continuing." }];
}

function persistReport(root: string, output: OpenSpecOperationGateOutput): string | undefined {
  if (output.changeId == null || !safeChangeId(output.changeId)) {
    return undefined;
  }
  if (!knownOperations.has(output.operation)) {
    return undefined;
  }
  const relative = normalizePath(path.join("openspec", "changes", output.changeId, "automation", "operation-gates", `${output.operation}.json`));
  const filePath = path.join(root, relative);
  const operationGatesRoot = path.resolve(root, "openspec", "changes", output.changeId, "automation", "operation-gates");
  const resolvedFile = path.resolve(filePath);
  const relativeToGateRoot = path.relative(operationGatesRoot, resolvedFile);
  if (relativeToGateRoot.startsWith("..") || path.isAbsolute(relativeToGateRoot)) {
    return undefined;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const persisted = { ...output, persistedPath: relative };
  fs.writeFileSync(filePath, `${JSON.stringify(persisted, null, 2)}\n`, "utf8");
  return relative;
}

export function runOpenSpecOperationGate(root: string, options: OpenSpecOperationGateOptions): OpenSpecOperationGateOutput {
  const resolvedRoot = path.resolve(root);
  const operation = options.operation?.trim() || "unknown";
  const changeId = options.changeId?.trim() || undefined;
  const checks = operationChecks(resolvedRoot, operation, changeId, options.enforcement).sort((left, right) => left.id.localeCompare(right.id));
  const status = statusFor(checks);
  const output: OpenSpecOperationGateOutput = {
    schemaVersion: 1,
    operation,
    ...(changeId == null ? {} : { changeId }),
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    status,
    exitCode: status === "passed" || status === "warning" ? 0 : 1,
    checks: checks.map((item) => ({ ...item, summary: redactRoot(resolvedRoot, item.summary), source: redactRoot(resolvedRoot, item.source) })),
    nextActions: nextActionsFor(status),
  };
  if (options.persist === true) {
    const persistedPath = persistReport(resolvedRoot, output);
    if (persistedPath != null) {
      output.persistedPath = persistedPath;
    }
  }
  return output;
}

function parseArgs(args: string[]): CliOptions {
  const parsed: CliOptions = { root: "", operation: "" };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--root") {
      parsed.root = args[++index] ?? "";
    } else if (arg === "--operation") {
      parsed.operation = args[++index] ?? "";
    } else if (arg === "--change") {
      parsed.changeId = args[++index] ?? "";
    } else if (arg === "--persist") {
      parsed.persist = true;
    } else if (arg === "--enforcement") {
      const value = args[++index] ?? "";
      if (value !== "advisory" && value !== "blocking") {
        throw new Error("--enforcement must be advisory or blocking.");
      }
      parsed.enforcement = value;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (!parsed.operation) {
    throw new Error("Missing required --operation <operation>.");
  }
  if (!parsed.root) {
    throw new Error("Missing required --root <project-root>.");
  }
  return parsed;
}

export function runOpenSpecOperationGateCli(args: string[]): number {
  try {
    if (args.includes("--help") || args.includes("-h")) {
      console.log("Usage: openspec-operation-gate --root <project-root> --operation <operation> --change <change-id> [--persist] [--enforcement advisory|blocking]");
      return 0;
    }
    const options = parseArgs(args);
    const output = runOpenSpecOperationGate(options.root, options);
    console.log(JSON.stringify(output, null, 2));
    return output.exitCode;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 2;
  }
}

if (process.argv[1] != null && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = runOpenSpecOperationGateCli(process.argv.slice(2));
}
