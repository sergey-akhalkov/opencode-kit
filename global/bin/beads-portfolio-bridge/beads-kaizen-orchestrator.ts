import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  readKaizenSignal,
  transitionKaizenSignal,
} from "../../plugin/kaizen/store.ts";
import type { KaizenDecision, KaizenSignal, KaizenStore } from "../../plugin/kaizen/store.ts";
import { inventoryOpenSpecChanges, parseTaskCheckboxes } from "../openspec-change/inventory.ts";
import {
  acquireBeadsBridgeWriterLease,
  loadBeadsBridgeRegistration,
  releaseBeadsBridgeWriterLease,
} from "./beads-bridge-registration.ts";
import type { BeadsBridgeProcessIdentity, BeadsBridgeRegistration, BeadsBridgeWriterLease } from "./beads-bridge-registration.ts";
import { BeadsAdapterError, runBeadsAdapter } from "./beads-vendor-adapter.ts";
import type { BeadsAdapterDependencies, BeadsIssueFact, BeadsRelationType } from "./beads-vendor-adapter.ts";

type BeadsKaizenPromotionInput = {
  registrationFile: string;
  signalRef: string;
  decisionRef: string;
  processIdentity: BeadsBridgeProcessIdentity;
};

export type BeadsKaizenPromotionDependencies = {
  adapter?: BeadsAdapterDependencies;
  afterCreate?: () => void;
  afterUpdate?: () => void;
  afterClose?: () => void | Promise<void>;
};

export type BeadsKaizenPromotionResult = {
  schemaVersion: 1;
  signalRef: string;
  decisionRef: string;
  projectRef: string;
  beadsId: string;
  created: boolean;
  kaizenTransitionAppended: boolean;
  status: "promoted" | "already-promoted";
};

type PortfolioBoundary = {
  advisoryOnly: true;
  productionClaimAvailable: false;
  countsAuthoritative: false;
  sourceExecution: "independent-writer-authority-required";
};

export type BeadsPortfolioReadResult = PortfolioBoundary & {
  schemaVersion: 1;
  projectRef: string;
  items: BeadsIssueFact[];
  truncated: boolean;
};

export type BeadsPortfolioRelationResult = PortfolioBoundary & {
  schemaVersion: 1;
  projectRef: string;
  issueId: string;
  dependsOnId: string;
  relationType: BeadsRelationType;
  changed: boolean;
};

export type BeadsPortfolioAssignmentResult = PortfolioBoundary & {
  schemaVersion: 1;
  projectRef: string;
  issueId: string;
  assignee: string;
  taskRef: string;
  sessionRef: string;
  changed: boolean;
};

export type BeadsOpenSpecLinkResult = PortfolioBoundary & {
  schemaVersion: 1;
  projectRef: string;
  issueId: string;
  changeRef: string;
  specId: string;
  changed: boolean;
};

export type BeadsTerminalReconciliationResult = PortfolioBoundary & {
  schemaVersion: 1;
  projectRef: string;
  issueId: string;
  changeRef: string;
  archiveRef: string;
  candidateRef: string;
  terminalRef: string;
  featureClosed: boolean;
  signalResolved: boolean;
  changed: boolean;
};

export class BeadsKaizenPromotionError extends Error {
  readonly code: string;

  constructor(message: string, code: string, options: { cause?: unknown } = {}) {
    super(message);
    this.name = "BeadsKaizenPromotionError";
    this.code = code;
    if (options.cause != null) Object.defineProperty(this, "cause", { configurable: true, value: options.cause });
  }
}

const SIGNAL_REF = /^signal_[a-f0-9]{32}$/u;
const DECISION_REF = /^decision_[a-f0-9]{32}$/u;
const ISSUE_REF = /^[A-Za-z][A-Za-z0-9_-]{0,63}(?:\.[A-Za-z0-9_-]{1,32})*$/u;
const SAFE_REF = /^[A-Za-z][A-Za-z0-9:._-]{0,127}$/u;
const CHANGE_REF = /^[A-Za-z0-9][A-Za-z0-9._-]*$/u;
const ARCHIVE_REF = /^openspec\/changes\/archive\/([A-Za-z0-9][A-Za-z0-9._-]*)$/u;
const RELATION_TYPES = new Set<BeadsRelationType>(["blocks", "parent-child", "supersedes"]);
const PORTFOLIO_BOUNDARY: PortfolioBoundary = {
  advisoryOnly: true,
  productionClaimAvailable: false,
  countsAuthoritative: false,
  sourceExecution: "independent-writer-authority-required",
};

function exactKeys(value: Record<string, unknown>, keys: string[], label: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) throw new BeadsKaizenPromotionError(`${label} fields are invalid.`, "invalid-request");
}

function parseInput(value: unknown): BeadsKaizenPromotionInput {
  if (value == null || typeof value !== "object" || Array.isArray(value)) throw new BeadsKaizenPromotionError("Promotion input must be an object.", "invalid-request");
  const source = value as Record<string, unknown>;
  exactKeys(source, ["registrationFile", "signalRef", "decisionRef", "processIdentity"], "Promotion input");
  if (typeof source.registrationFile !== "string" || source.registrationFile.trim() === "") throw new BeadsKaizenPromotionError("registrationFile is invalid.", "invalid-request");
  if (typeof source.signalRef !== "string" || !SIGNAL_REF.test(source.signalRef)) throw new BeadsKaizenPromotionError("signalRef is invalid.", "invalid-request");
  if (typeof source.decisionRef !== "string" || !DECISION_REF.test(source.decisionRef)) throw new BeadsKaizenPromotionError("decisionRef is invalid.", "invalid-request");
  return {
    registrationFile: source.registrationFile,
    signalRef: source.signalRef,
    decisionRef: source.decisionRef,
    processIdentity: source.processIdentity as BeadsBridgeProcessIdentity,
  };
}

function decision(signal: KaizenSignal, decisionRef: string): KaizenDecision {
  const selected = signal.decision;
  if (selected == null) throw new BeadsKaizenPromotionError("Signal has no current triage decision.", "zero-owner");
  if (selected.decisionRef !== decisionRef) throw new BeadsKaizenPromotionError("Current signal decision does not match the requested decision.", "decision-mismatch");
  if (selected.decision !== "project-change" && selected.decision !== "kit-candidate") {
    throw new BeadsKaizenPromotionError("Current decision is not eligible for Beads promotion.", "ineligible-decision");
  }
  return selected;
}

function title(signal: KaizenSignal): string {
  if (signal.summary.length < 1 || signal.summary.length > 200) throw new BeadsKaizenPromotionError("Kaizen summary is outside the bounded feature-title envelope.", "unsafe-payload");
  return signal.summary;
}

function exactItem(item: BeadsIssueFact, metadata: ReturnType<typeof bridgeMetadata>, signalRef: string): boolean {
  return item.externalRef === signalRef
    && item.metadata.bridgeSchemaVersion === metadata.bridgeSchemaVersion
    && item.metadata.kaizenSignalRef === metadata.kaizenSignalRef
    && item.metadata.decisionRef === metadata.decisionRef
    && item.metadata.projectRef === metadata.projectRef
    && item.metadata.ownerClass === metadata.ownerClass;
}

function bridgeMetadata(selected: KaizenDecision, projectRef: string) {
  return {
    bridgeSchemaVersion: 1 as const,
    kaizenSignalRef: selected.signalRef,
    decisionRef: selected.decisionRef,
    projectRef,
    ownerClass: selected.ownerClass as "current-project" | "opencode-kit",
  };
}

function terminalClosure(lease: BeadsBridgeWriterLease, evidence: string) {
  return {
    schemaVersion: 1 as const,
    status: "terminal" as const,
    observedAt: new Date().toISOString(),
    processRef: lease.processRef,
    childProcessRefs: [],
    evidenceRefs: [evidence],
  };
}

function releaseOnError(error: unknown, registrationFile: string, lease: BeadsBridgeWriterLease): void {
  if (error instanceof BeadsAdapterError && error.failure?.process.cleanupState === "unknown") return;
  releaseBeadsBridgeWriterLease(
    registrationFile,
    loadBeadsBridgeRegistration(registrationFile),
    lease,
    terminalClosure(lease, "evidence:kaizen-promotion-failure-terminal"),
  );
}

function issueItems(response: ReturnType<typeof runBeadsAdapter>): { items: BeadsIssueFact[]; truncated: boolean } {
  if (response.result.kind !== "issues") throw new BeadsKaizenPromotionError("Adapter did not return issue facts.", "invalid-adapter-result");
  return response.result;
}

function inputRecord(value: unknown, label: string): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) throw new BeadsKaizenPromotionError(`${label} must be an object.`, "invalid-request");
  return value as Record<string, unknown>;
}

function enabledRegistration(file: unknown): { file: string; registration: BeadsBridgeRegistration } {
  if (typeof file !== "string" || file.trim() === "") throw new BeadsKaizenPromotionError("registrationFile is invalid.", "invalid-request");
  const registration = loadBeadsBridgeRegistration(file);
  if (!registration.enabled) throw new BeadsKaizenPromotionError("Beads registration is disabled.", "registration-disabled");
  return { file, registration };
}

function issueRef(value: unknown, label: string): string {
  if (typeof value !== "string" || !ISSUE_REF.test(value)) throw new BeadsKaizenPromotionError(`${label} is invalid.`, "invalid-request");
  return value;
}

function coordinationRef(value: unknown, label: string): string {
  if (typeof value !== "string" || !SAFE_REF.test(value)) throw new BeadsKaizenPromotionError(`${label} is invalid.`, "invalid-request");
  return value;
}

function admittedIssue(item: BeadsIssueFact, registration: BeadsBridgeRegistration, expectedId?: string): BeadsIssueFact {
  if (expectedId != null && item.id !== expectedId) throw new BeadsKaizenPromotionError("Beads item identity does not match the request.", "portfolio-identity-mismatch");
  if (item.metadata.bridgeSchemaVersion !== 1
    || item.metadata.projectRef !== registration.projectRef
    || item.metadata.ownerClass !== registration.ownerClass
    || item.metadata.kaizenSignalRef == null
    || item.metadata.decisionRef == null
    || item.externalRef !== item.metadata.kaizenSignalRef) {
    throw new BeadsKaizenPromotionError("Beads item is outside the enabled admitted portfolio.", "portfolio-identity-mismatch");
  }
  return item;
}

function exactCorrelation(registration: BeadsBridgeRegistration, item: BeadsIssueFact, adapter?: BeadsAdapterDependencies): void {
  const result = issueItems(runBeadsAdapter({
    operation: "list",
    executablePath: registration.binaryPath,
    projectRoot: registration.projectRoot,
    limit: 100,
    correlation: {
      bridgeSchemaVersion: 1,
      kaizenSignalRef: item.metadata.kaizenSignalRef,
      decisionRef: item.metadata.decisionRef,
      projectRef: registration.projectRef,
      ownerClass: registration.ownerClass,
    },
  }, adapter));
  if (result.truncated || result.items.length !== 1 || result.items[0].id !== item.id) {
    throw new BeadsKaizenPromotionError("Beads correlation is missing, duplicated, or ambiguous.", "duplicate-correlation");
  }
  admittedIssue(result.items[0], registration, item.id);
}

type TerminalFact = {
  status: string;
  candidateRef: string;
  evidenceRef: string;
};

type TerminalEvidence = {
  candidateRef: string;
  archiveRef: string;
  archiveStatus: "archived";
  truncated: false;
  runtimeProof: TerminalFact;
  validation: TerminalFact;
  externalEffects: TerminalFact;
  sourceWriter: TerminalFact;
  cleanup: TerminalFact;
};

function terminalEvidence(value: unknown): TerminalEvidence {
  try {
    const input = inputRecord(value, "terminalEvidence");
    exactKeys(input, ["schemaVersion", "candidateRef", "archiveRef", "archiveStatus", "truncated", "runtimeProof", "validation", "externalEffects", "sourceWriter", "cleanup"], "terminalEvidence");
    if (input.schemaVersion !== 1 || input.archiveStatus !== "archived" || input.truncated !== false) throw new Error("Terminal evidence identity is unsupported or truncated.");
    const candidateRef = coordinationRef(input.candidateRef, "terminalEvidence.candidateRef");
    const fact = (name: "runtimeProof" | "validation" | "externalEffects" | "sourceWriter" | "cleanup", status: string): TerminalFact => {
      const row = inputRecord(input[name], `terminalEvidence.${name}`);
      exactKeys(row, ["status", "candidateRef", "evidenceRef"], `terminalEvidence.${name}`);
      if (row.status !== status) throw new Error(`terminalEvidence.${name}.status is not terminal.`);
      const factCandidateRef = coordinationRef(row.candidateRef, `terminalEvidence.${name}.candidateRef`);
      if (factCandidateRef !== candidateRef) throw new Error(`terminalEvidence.${name} is stale for the candidate.`);
      return { status, candidateRef: factCandidateRef, evidenceRef: coordinationRef(row.evidenceRef, `terminalEvidence.${name}.evidenceRef`) };
    };
    if (typeof input.archiveRef !== "string" || input.archiveRef !== input.archiveRef.trim() || input.archiveRef.length === 0 || input.archiveRef.length > 256) {
      throw new Error("terminalEvidence.archiveRef must be bounded text.");
    }
    const archiveRef = input.archiveRef;
    if (!ARCHIVE_REF.test(archiveRef)) throw new Error("terminalEvidence.archiveRef is not a canonical archive reference.");
    return {
      candidateRef,
      archiveRef,
      archiveStatus: "archived",
      truncated: false,
      runtimeProof: fact("runtimeProof", "passed"),
      validation: fact("validation", "passed"),
      externalEffects: fact("externalEffects", "declared-only"),
      sourceWriter: fact("sourceWriter", "terminal"),
      cleanup: fact("cleanup", "terminal"),
    };
  } catch (cause) {
    if (cause instanceof BeadsKaizenPromotionError && cause.code === "terminal-evidence-incomplete") throw cause;
    throw new BeadsKaizenPromotionError("Terminal evidence is missing, stale, conflicting, or unknown.", "terminal-evidence-incomplete", { cause });
  }
}

function verifyArchivedChange(registration: BeadsBridgeRegistration, changeRef: string, evidence: TerminalEvidence): string {
  const match = ARCHIVE_REF.exec(evidence.archiveRef);
  const archiveId = match?.[1] ?? "";
  const archiveDate = archiveId.slice(0, 10);
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/u.test(archiveDate) ? new Date(`${archiveDate}T00:00:00.000Z`) : null;
  const exactArchiveId = parsedDate != null && !Number.isNaN(parsedDate.valueOf())
    && parsedDate.toISOString().slice(0, 10) === archiveDate && archiveId === `${archiveDate}-${changeRef}`;
  if (!exactArchiveId) {
    throw new BeadsKaizenPromotionError("Archive identity does not match the linked OpenSpec change.", "terminal-evidence-stale");
  }
  if (inventoryOpenSpecChanges(registration.projectRoot).changes.some((change) => change.changeId === changeRef)) {
    throw new BeadsKaizenPromotionError("The linked OpenSpec change is still active.", "terminal-evidence-stale");
  }
  const archiveDirectory = path.join(registration.projectRoot, "openspec", "changes", "archive");
  try {
    const matches = fs.readdirSync(archiveDirectory, { withFileTypes: true }).filter((entry) => {
      const date = entry.name.slice(0, 10);
      return /^\d{4}-\d{2}-\d{2}$/u.test(date) && entry.name === `${date}-${changeRef}`;
    });
    if (matches.length !== 1 || matches[0].name !== archiveId || !matches[0].isDirectory() || matches[0].isSymbolicLink()) {
      throw new BeadsKaizenPromotionError("OpenSpec archive identity is missing, duplicated, or ambiguous.", "terminal-evidence-stale");
    }
  } catch (cause) {
    if (cause instanceof BeadsKaizenPromotionError) throw cause;
    throw new BeadsKaizenPromotionError("OpenSpec archive inventory is unreadable.", "terminal-evidence-incomplete", { cause });
  }
  const archiveRoot = path.resolve(registration.projectRoot, ...evidence.archiveRef.split("/"));
  const relative = path.relative(registration.projectRoot, archiveRoot);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new BeadsKaizenPromotionError("Archive identity escapes the registered project root.", "terminal-evidence-stale");
  }
  const tasksFile = path.join(archiveRoot, "tasks.md");
  try {
    let current = registration.projectRoot;
    for (const segment of evidence.archiveRef.split("/")) {
      current = path.join(current, segment);
      const stat = fs.lstatSync(current);
      if (stat.isSymbolicLink()) throw new Error("Archive identity contains a symbolic-link path.");
    }
    const archiveStat = fs.lstatSync(archiveRoot);
    const tasksStat = fs.lstatSync(tasksFile);
    if (archiveStat.isSymbolicLink() || !archiveStat.isDirectory() || tasksStat.isSymbolicLink() || !tasksStat.isFile() || tasksStat.size > 1_000_000) throw new Error("Archive or tasks identity is not an ordinary bounded path.");
    const tasks = parseTaskCheckboxes(fs.readFileSync(tasksFile, "utf8"));
    if (tasks.length === 0 || tasks.some((task) => !task.checked)) throw new Error("Archived accepted tasks are incomplete.");
  } catch (cause) {
    throw new BeadsKaizenPromotionError("Canonical archived tasks are absent, unsafe, or incomplete.", "terminal-evidence-incomplete", { cause });
  }
  return archiveId;
}

function terminalSignal(signal: KaizenSignal, item: BeadsIssueFact, registration: BeadsBridgeRegistration): void {
  const decision = signal.decision;
  if (decision == null || decision.decisionRef !== item.metadata.decisionRef || decision.ownerClass !== item.metadata.ownerClass
    || signal.signalRef !== item.metadata.kaizenSignalRef || !["promoted", "resolved"].includes(signal.status)) {
    throw new BeadsKaizenPromotionError("Kaizen signal does not match the admitted terminal projection.", "terminal-correlation-mismatch");
  }
  if (decision.decision === "project-change" && !signal.projectRefs.includes(registration.projectRef)) {
    throw new BeadsKaizenPromotionError("Kaizen project decision no longer matches the enabled registration.", "terminal-correlation-mismatch");
  }
  if (decision.decision === "kit-candidate" && registration.ownerClass !== "opencode-kit") {
    throw new BeadsKaizenPromotionError("Kaizen kit decision no longer matches the enabled semantic owner.", "terminal-correlation-mismatch");
  }
}

function showAdmittedIssue(registration: BeadsBridgeRegistration, id: string, adapter?: BeadsAdapterDependencies): BeadsIssueFact {
  const result = issueItems(runBeadsAdapter({
    operation: "show",
    executablePath: registration.binaryPath,
    projectRoot: registration.projectRoot,
    id,
  }, adapter));
  if (result.truncated || result.items.length !== 1) throw new BeadsKaizenPromotionError("Beads show result is missing or ambiguous.", "portfolio-read-mismatch");
  return admittedIssue(result.items[0], registration, id);
}

export function readReadyBeadsPortfolio(value: unknown, dependencies: Pick<BeadsKaizenPromotionDependencies, "adapter"> = {}): BeadsPortfolioReadResult {
  const input = inputRecord(value, "Ready input");
  exactKeys(input, ["registrationFile", "limit"], "Ready input");
  const { registration } = enabledRegistration(input.registrationFile);
  if (!Number.isInteger(input.limit) || (input.limit as number) < 1 || (input.limit as number) > 100) {
    throw new BeadsKaizenPromotionError("limit is invalid.", "invalid-request");
  }
  const result = issueItems(runBeadsAdapter({
    operation: "ready",
    executablePath: registration.binaryPath,
    projectRoot: registration.projectRoot,
    limit: input.limit as number,
    correlation: { bridgeSchemaVersion: 1, projectRef: registration.projectRef },
  }, dependencies.adapter));
  return {
    schemaVersion: 1,
    projectRef: registration.projectRef,
    items: result.items.map((item) => admittedIssue(item, registration)),
    truncated: result.truncated,
    ...PORTFOLIO_BOUNDARY,
  };
}

export function showBeadsPortfolioFeature(value: unknown, dependencies: Pick<BeadsKaizenPromotionDependencies, "adapter"> = {}): BeadsPortfolioReadResult {
  const input = inputRecord(value, "Show input");
  exactKeys(input, ["registrationFile", "id"], "Show input");
  const { registration } = enabledRegistration(input.registrationFile);
  const item = showAdmittedIssue(registration, issueRef(input.id, "id"), dependencies.adapter);
  return { schemaVersion: 1, projectRef: registration.projectRef, items: [item], truncated: false, ...PORTFOLIO_BOUNDARY };
}

export function projectBeadsPortfolioRelation(value: unknown, dependencies: Pick<BeadsKaizenPromotionDependencies, "adapter"> = {}): BeadsPortfolioRelationResult {
  const input = inputRecord(value, "Relation input");
  const relationType = coordinationRef(input.relationType, "relationType") as BeadsRelationType;
  if (!RELATION_TYPES.has(relationType)) throw new BeadsKaizenPromotionError("relationType is outside the closed portfolio set.", "invalid-request");
  exactKeys(input, relationType === "supersedes"
    ? ["registrationFile", "id", "dependsOnId", "relationType", "semanticIdentityConfirmed", "processIdentity"]
    : ["registrationFile", "id", "dependsOnId", "relationType", "processIdentity"], "Relation input");
  if (relationType === "supersedes" && input.semanticIdentityConfirmed !== true) {
    throw new BeadsKaizenPromotionError("Supersedes requires explicit confirmed semantic identity.", "semantic-identity-unconfirmed");
  }
  const { file, registration } = enabledRegistration(input.registrationFile);
  const id = issueRef(input.id, "id");
  const dependsOnId = issueRef(input.dependsOnId, "dependsOnId");
  if (id === dependsOnId) throw new BeadsKaizenPromotionError("A portfolio item cannot depend on itself.", "invalid-request");
  const lease = acquireBeadsBridgeWriterLease(file, registration, "add-dependency", input.processIdentity as BeadsBridgeProcessIdentity);
  try {
    const item = showAdmittedIssue(registration, id, dependencies.adapter);
    const dependency = showAdmittedIssue(registration, dependsOnId, dependencies.adapter);
    if (item.status !== "open" || dependency.status !== "open") throw new BeadsKaizenPromotionError("Relations can be added only between open admitted items.", "portfolio-state");
    const existing = item.dependencies.filter((edge) => edge.id === dependsOnId);
    if (existing.some((edge) => edge.dependencyType !== relationType)) throw new BeadsKaizenPromotionError("A competing relation already exists.", "relation-conflict");
    let changed = false;
    if (!existing.some((edge) => edge.dependencyType === relationType)) {
      const mutation = runBeadsAdapter({
        operation: "add-dependency",
        executablePath: registration.binaryPath,
        projectRoot: registration.projectRoot,
        id,
        dependsOnId,
        relationType,
      }, dependencies.adapter);
      if (mutation.result.kind !== "dependency" || mutation.result.status !== "added") {
        throw new BeadsKaizenPromotionError("Beads did not confirm the exact relation mutation.", "invalid-adapter-result");
      }
      changed = true;
    }
    const readback = showAdmittedIssue(registration, id, dependencies.adapter);
    if (!readback.dependencies.some((edge) => edge.id === dependsOnId && edge.dependencyType === relationType)) {
      throw new BeadsKaizenPromotionError("Beads relation readback does not match the requested relation.", "relation-readback-mismatch");
    }
    releaseBeadsBridgeWriterLease(file, registration, lease, terminalClosure(lease, "evidence:beads-relation-readback-terminal"));
    return { schemaVersion: 1, projectRef: registration.projectRef, issueId: id, dependsOnId, relationType, changed, ...PORTFOLIO_BOUNDARY };
  } catch (cause) {
    releaseOnError(cause, file, lease);
    if (cause instanceof BeadsKaizenPromotionError) throw cause;
    throw new BeadsKaizenPromotionError("Beads relation projection failed before ordered completion.", "relation-failed", { cause });
  }
}

export function assignBeadsPortfolioFeature(value: unknown, dependencies: Pick<BeadsKaizenPromotionDependencies, "adapter"> = {}): BeadsPortfolioAssignmentResult {
  const input = inputRecord(value, "Assignment input");
  exactKeys(input, ["registrationFile", "id", "assignee", "taskRef", "sessionRef", "processIdentity"], "Assignment input");
  const { file, registration } = enabledRegistration(input.registrationFile);
  const id = issueRef(input.id, "id");
  const assignee = coordinationRef(input.assignee, "assignee");
  const taskRef = coordinationRef(input.taskRef, "taskRef");
  const sessionRef = coordinationRef(input.sessionRef, "sessionRef");
  const lease = acquireBeadsBridgeWriterLease(file, registration, "assign-feature", input.processIdentity as BeadsBridgeProcessIdentity);
  try {
    const item = showAdmittedIssue(registration, id, dependencies.adapter);
    if (item.status !== "open") throw new BeadsKaizenPromotionError("Only an open admitted feature can be assigned.", "portfolio-state");
    const existing = { assignee: item.assignee, taskRef: item.metadata.taskRef ?? null, sessionRef: item.metadata.sessionRef ?? null };
    const exact = existing.assignee === assignee && existing.taskRef === taskRef && existing.sessionRef === sessionRef;
    if (!exact && (existing.assignee != null || existing.taskRef != null || existing.sessionRef != null)) {
      throw new BeadsKaizenPromotionError("A competing advisory assignment already exists.", "assignment-conflict");
    }
    if (!exact) {
      runBeadsAdapter({
        operation: "assign-feature",
        executablePath: registration.binaryPath,
        projectRoot: registration.projectRoot,
        id,
        assignee,
        taskRef,
        sessionRef,
      }, dependencies.adapter);
    }
    const readback = showAdmittedIssue(registration, id, dependencies.adapter);
    if (readback.assignee !== assignee || readback.metadata.taskRef !== taskRef || readback.metadata.sessionRef !== sessionRef) {
      throw new BeadsKaizenPromotionError("Beads assignment readback does not match the requested child refs.", "assignment-readback-mismatch");
    }
    releaseBeadsBridgeWriterLease(file, registration, lease, terminalClosure(lease, "evidence:beads-assignment-readback-terminal"));
    return { schemaVersion: 1, projectRef: registration.projectRef, issueId: id, assignee, taskRef, sessionRef, changed: !exact, ...PORTFOLIO_BOUNDARY };
  } catch (cause) {
    releaseOnError(cause, file, lease);
    if (cause instanceof BeadsKaizenPromotionError) throw cause;
    throw new BeadsKaizenPromotionError("Beads advisory assignment failed before ordered completion.", "assignment-failed", { cause });
  }
}

export function linkBeadsPortfolioFeatureToOpenSpec(value: unknown, dependencies: Pick<BeadsKaizenPromotionDependencies, "adapter" | "afterUpdate"> = {}): BeadsOpenSpecLinkResult {
  const input = inputRecord(value, "OpenSpec link input");
  exactKeys(input, ["registrationFile", "id", "changeRef", "specId", "processIdentity"], "OpenSpec link input");
  const { file, registration } = enabledRegistration(input.registrationFile);
  const id = issueRef(input.id, "id");
  const changeRef = coordinationRef(input.changeRef, "changeRef");
  if (!CHANGE_REF.test(changeRef)) throw new BeadsKaizenPromotionError("changeRef is not a safe OpenSpec change id.", "invalid-request");
  const specId = coordinationRef(input.specId, "specId");
  const inventory = inventoryOpenSpecChanges(registration.projectRoot);
  if (!inventory.changes.some((change) => change.changeId === changeRef)) {
    throw new BeadsKaizenPromotionError("OpenSpec change is absent from the registered project root.", "change-not-found");
  }
  const lease = acquireBeadsBridgeWriterLease(file, registration, "update-feature", input.processIdentity as BeadsBridgeProcessIdentity);
  try {
    const item = showAdmittedIssue(registration, id, dependencies.adapter);
    exactCorrelation(registration, item, dependencies.adapter);
    const currentChangeRef = item.metadata.changeRef ?? null;
    const exact = item.specId === specId && currentChangeRef === changeRef;
    if (!exact && (item.specId != null || currentChangeRef != null)) {
      throw new BeadsKaizenPromotionError("Feature already has a different or partial OpenSpec link.", "link-conflict");
    }
    if (!exact) {
      runBeadsAdapter({
        operation: "update-feature",
        executablePath: registration.binaryPath,
        projectRoot: registration.projectRoot,
        id,
        specId,
        changeRef,
      }, dependencies.adapter);
      dependencies.afterUpdate?.();
    }
    const readback = showAdmittedIssue(registration, id, dependencies.adapter);
    exactCorrelation(registration, readback, dependencies.adapter);
    if (readback.specId !== specId || readback.metadata.changeRef !== changeRef) {
      throw new BeadsKaizenPromotionError("Beads OpenSpec link readback does not match the request.", "link-readback-mismatch");
    }
    releaseBeadsBridgeWriterLease(file, registration, lease, terminalClosure(lease, "evidence:beads-openspec-link-readback-terminal"));
    return { schemaVersion: 1, projectRef: registration.projectRef, issueId: id, changeRef, specId, changed: !exact, ...PORTFOLIO_BOUNDARY };
  } catch (cause) {
    releaseOnError(cause, file, lease);
    if (cause instanceof BeadsKaizenPromotionError) throw cause;
    throw new BeadsKaizenPromotionError("Beads OpenSpec link failed before ordered completion.", "link-failed", { cause });
  }
}

export async function reconcileBeadsPortfolioTerminal(
  store: KaizenStore,
  value: unknown,
  dependencies: Pick<BeadsKaizenPromotionDependencies, "adapter" | "afterClose"> = {},
): Promise<BeadsTerminalReconciliationResult> {
  const input = inputRecord(value, "terminal reconciliation input");
  exactKeys(input, ["registrationFile", "id", "changeRef", "specId", "terminalEvidence", "processIdentity"], "terminal reconciliation input");
  const { file, registration } = enabledRegistration(input.registrationFile);
  if (path.resolve(store.canonicalRoot) !== path.resolve(registration.projectRoot) || store.projectRef !== registration.projectRef) {
    throw new BeadsKaizenPromotionError("Kaizen store does not match the registered project identity.", "wrong-project");
  }
  const id = issueRef(input.id, "id");
  const changeRef = coordinationRef(input.changeRef, "changeRef");
  if (!CHANGE_REF.test(changeRef)) throw new BeadsKaizenPromotionError("changeRef is not a safe OpenSpec change id.", "invalid-request");
  const specId = coordinationRef(input.specId, "specId");
  const evidence = terminalEvidence(input.terminalEvidence);
  const archiveId = verifyArchivedChange(registration, changeRef, evidence);
  const terminalDigest = crypto.createHash("sha256").update(JSON.stringify({
    archiveRef: evidence.archiveRef,
    candidateRef: evidence.candidateRef,
    changeRef,
    cleanupRef: evidence.cleanup.evidenceRef,
    externalEffectsRef: evidence.externalEffects.evidenceRef,
    issueId: id,
    runtimeProofRef: evidence.runtimeProof.evidenceRef,
    sourceWriterRef: evidence.sourceWriter.evidenceRef,
    specId,
    validationRef: evidence.validation.evidenceRef,
  })).digest("hex");
  const terminalRef = `terminal:${terminalDigest}`;
  const closeReason = `bpb-${terminalRef}`;
  const lease = acquireBeadsBridgeWriterLease(file, registration, "close-feature", input.processIdentity as BeadsBridgeProcessIdentity);
  let featureClosed = false;
  let signalResolved = false;
  try {
    let item = showAdmittedIssue(registration, id, dependencies.adapter);
    exactCorrelation(registration, item, dependencies.adapter);
    if (item.specId !== specId || item.metadata.changeRef !== changeRef) {
      throw new BeadsKaizenPromotionError("Beads feature does not match the exact linked OpenSpec change.", "terminal-link-mismatch");
    }
    let signal = await readKaizenSignal(store, item.metadata.kaizenSignalRef!);
    terminalSignal(signal, item, registration);
    if (signal.status === "resolved" && item.status !== "closed") {
      throw new BeadsKaizenPromotionError("Kaizen is resolved while the correlated Beads feature remains open.", "terminal-order-conflict");
    }
    if (item.status === "closed") {
      if (item.closeReason !== closeReason) {
        throw new BeadsKaizenPromotionError("Closed Beads feature lacks the exact terminal evidence marker.", "terminal-close-conflict");
      }
    } else {
      runBeadsAdapter({
        operation: "close-feature",
        executablePath: registration.binaryPath,
        projectRoot: registration.projectRoot,
        id,
        reason: closeReason,
      }, dependencies.adapter);
      item = showAdmittedIssue(registration, id, dependencies.adapter);
      exactCorrelation(registration, item, dependencies.adapter);
      if (item.status !== "closed" || item.closeReason !== closeReason) {
        throw new BeadsKaizenPromotionError("Beads terminal close readback does not match the verified evidence.", "terminal-close-readback-mismatch");
      }
      featureClosed = true;
      await dependencies.afterClose?.();
    }
    verifyArchivedChange(registration, changeRef, evidence);
    if (signal.status !== "resolved") {
      signal = await transitionKaizenSignal(store, {
        signalRef: signal.signalRef,
        status: "resolved",
        note: `beads:${id} archive:${archiveId} ${terminalRef}`,
      });
      if (signal.status !== "resolved") {
        throw new BeadsKaizenPromotionError("Kaizen terminal transition readback is not resolved.", "terminal-resolution-readback-mismatch");
      }
      signalResolved = true;
    }
    releaseBeadsBridgeWriterLease(file, registration, lease, terminalClosure(lease, "evidence:beads-terminal-reconciliation-readback"));
    return {
      schemaVersion: 1,
      projectRef: registration.projectRef,
      issueId: id,
      changeRef,
      archiveRef: evidence.archiveRef,
      candidateRef: evidence.candidateRef,
      terminalRef,
      featureClosed,
      signalResolved,
      changed: featureClosed || signalResolved,
      ...PORTFOLIO_BOUNDARY,
    };
  } catch (cause) {
    releaseOnError(cause, file, lease);
    if (cause instanceof BeadsKaizenPromotionError) throw cause;
    throw new BeadsKaizenPromotionError("Beads terminal reconciliation failed before ordered completion.", "terminal-reconciliation-failed", { cause });
  }
}

export async function promoteKaizenSignalToBeads(
  store: KaizenStore,
  inputValue: unknown,
  dependencies: BeadsKaizenPromotionDependencies = {},
): Promise<BeadsKaizenPromotionResult> {
  const input = parseInput(inputValue);
  const registration = loadBeadsBridgeRegistration(input.registrationFile);
  if (!registration.enabled) throw new BeadsKaizenPromotionError("Beads registration is disabled.", "registration-disabled");
  const signal = await readKaizenSignal(store, input.signalRef);
  const selected = decision(signal, input.decisionRef);
  if (signal.status !== "triaged" && signal.status !== "promoted") throw new BeadsKaizenPromotionError("Signal is not in a promotable state.", "signal-state");
  if (selected.decision === "project-change") {
    if (selected.ownerClass !== "current-project" || registration.ownerClass !== "current-project" || !signal.projectRefs.includes(registration.projectRef)) {
      throw new BeadsKaizenPromotionError("Project-change decision does not match the enabled registration.", "wrong-project");
    }
  } else if (selected.ownerClass !== "opencode-kit" || registration.ownerClass !== "opencode-kit") {
    throw new BeadsKaizenPromotionError("Kit-candidate decision does not match an enabled kit-owner registration.", "wrong-owner");
  }
  const featureTitle = title(signal);
  const metadata = bridgeMetadata(selected, registration.projectRef);
  const lease = acquireBeadsBridgeWriterLease(input.registrationFile, registration, "create-feature", input.processIdentity);
  let item: BeadsIssueFact;
  let created = false;
  try {
    const lookup = issueItems(runBeadsAdapter({
      operation: "list",
      executablePath: registration.binaryPath,
      projectRoot: registration.projectRoot,
      limit: 100,
      correlation: metadata,
    }, dependencies.adapter));
    if (lookup.truncated || lookup.items.length > 1) throw new BeadsKaizenPromotionError("Multiple or truncated Beads correlation is a repair gate.", "duplicate-correlation");
    if (lookup.items.length === 1) {
      item = lookup.items[0];
      if (!exactItem(item, metadata, signal.signalRef)) throw new BeadsKaizenPromotionError("Beads correlation does not match the Kaizen owner identity.", "competing-portfolio-state");
    } else {
      if (signal.status === "promoted") throw new BeadsKaizenPromotionError("Promoted Kaizen signal has no canonical Beads correlation.", "competing-portfolio-state");
      const create = issueItems(runBeadsAdapter({
        operation: "create-feature",
        executablePath: registration.binaryPath,
        projectRoot: registration.projectRoot,
        title: featureTitle,
        externalRef: signal.signalRef,
        metadata,
      }, dependencies.adapter));
      if (create.items.length !== 1 || !exactItem(create.items[0], metadata, signal.signalRef)) throw new BeadsKaizenPromotionError("Atomic Beads create did not return the exact correlation.", "invalid-adapter-result");
      item = create.items[0];
      created = true;
      dependencies.afterCreate?.();
      const readback = issueItems(runBeadsAdapter({
        operation: "list",
        executablePath: registration.binaryPath,
        projectRoot: registration.projectRoot,
        limit: 100,
        correlation: metadata,
      }, dependencies.adapter));
      if (readback.truncated || readback.items.length !== 1 || readback.items[0].id !== item.id || !exactItem(readback.items[0], metadata, signal.signalRef)) {
        throw new BeadsKaizenPromotionError("Atomic Beads create readback is missing or ambiguous.", "create-readback-mismatch");
      }
      item = readback.items[0];
    }
    const current = await readKaizenSignal(store, signal.signalRef);
    if (current.decision?.decisionRef !== selected.decisionRef) throw new BeadsKaizenPromotionError("Kaizen decision changed after Beads readback.", "decision-mismatch");
    let output: BeadsKaizenPromotionResult;
    if (current.status === "promoted") {
      output = { schemaVersion: 1, signalRef: signal.signalRef, decisionRef: selected.decisionRef, projectRef: registration.projectRef, beadsId: item.id, created, kaizenTransitionAppended: false, status: "already-promoted" };
    } else {
      if (current.status !== "triaged") throw new BeadsKaizenPromotionError("Kaizen signal state changed after Beads readback.", "signal-state");
      await transitionKaizenSignal(store, { signalRef: signal.signalRef, status: "promoted", note: `beads:${item.id}` });
      output = { schemaVersion: 1, signalRef: signal.signalRef, decisionRef: selected.decisionRef, projectRef: registration.projectRef, beadsId: item.id, created, kaizenTransitionAppended: true, status: "promoted" };
    }
    releaseBeadsBridgeWriterLease(input.registrationFile, registration, lease, terminalClosure(lease, "evidence:beads-create-readback-kaizen-transition-terminal"));
    return output;
  } catch (cause) {
    releaseOnError(cause, input.registrationFile, lease);
    if (cause instanceof BeadsKaizenPromotionError) throw cause;
    throw new BeadsKaizenPromotionError("Kaizen-to-Beads promotion failed before ordered completion.", "promotion-failed", { cause });
  }
}
