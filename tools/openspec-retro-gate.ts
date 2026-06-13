#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type RetroGateResult = {
  valid: boolean;
  changeId: string;
  errors: string[];
  warnings: string[];
  archiveAllowed: boolean;
};

export type RetroEvidence = {
  kind: "command" | "file" | "review" | "tool-output" | "manual-gate" | "unknown";
  source: string;
  status: "passed" | "failed" | "blocked" | "unknown" | "not-applicable";
  summary: string;
};

export type RetroProblem = {
  problem: string;
  evidence: string;
  impact: string;
  rootCause: string;
  recommendation: string;
  confidence: "low" | "medium" | "high";
  target: "project-local" | "opencode-dev-kit" | "none";
  followUpChangeId: string | null;
  noFollowUpReason: string | null;
};

export type RetroArtifact = {
  schemaVersion: 1;
  changeId: string;
  generatedAt: string;
  evidenceReviewed: RetroEvidence[];
  problems: RetroProblem[];
  outputs: {
    projectFollowUpChanges: string[];
    opencodeDevKitChanges: string[];
    noFindingsReason: string | null;
  };
  archiveGate: {
    decision: "passed" | "blocked" | "approved-skip";
    reason: string;
    approver: string | null;
  };
};

export type RetroMigrationResult = {
  migrated: boolean;
  changeId: string;
  path: string;
  errors: string[];
  warnings: string[];
  artifact?: RetroArtifact;
};

type ProblemRow = {
  problem: string;
  evidence: string;
  impact: string;
  rootCause: string;
  recommendation: string;
  confidence: string;
  target: string;
};

type CliOptions = {
  root: string;
  format: "json" | "text";
  changeId?: string;
  migrateLegacy: boolean;
  dryRun: boolean;
};

const decisionValues = new Set(["passed", "blocked", "approved-skip"]);
const evidenceKinds = new Set(["command", "file", "review", "tool-output", "manual-gate", "unknown"]);
const evidenceStatuses = new Set(["passed", "failed", "blocked", "unknown", "not-applicable"]);
const confidenceValues = new Set(["low", "medium", "high"]);
const findingTargets = new Set(["project-local", "opencode-dev-kit", "none"]);
const emptyValues = new Set(["", "none", "n/a", "na", "unknown", "unavailable", "-"]);
const unknownRootCauseValues = new Set(["unknown"]);
const retroTopLevelKeys = ["schemaVersion", "changeId", "generatedAt", "evidenceReviewed", "problems", "outputs", "archiveGate"];
const evidenceKeys = ["kind", "source", "status", "summary"];
const problemKeys = ["problem", "evidence", "impact", "rootCause", "recommendation", "confidence", "target", "followUpChangeId", "noFollowUpReason"];
const outputsKeys = ["projectFollowUpChanges", "opencodeDevKitChanges", "noFindingsReason"];
const archiveGateKeys = ["decision", "reason", "approver"];

function normalizeText(text: string): string {
  return text.replace(/\r\n/g, "\n");
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value != null && !Array.isArray(value);
}

function isMeaningful(value: string | null | undefined): boolean {
  return value != null && !emptyValues.has(value.trim().toLowerCase().replace(/[.。]+$/, ""));
}

function normalizedCell(value: string | undefined | null): string {
  return value?.trim().toLowerCase().replace(/[.。]+$/, "") ?? "";
}

function isUnknownRootCause(value: string | undefined | null): boolean {
  return unknownRootCauseValues.has(normalizedCell(value));
}

function routesUnknownRootCauseInvestigation(row: Pick<RetroProblem | ProblemRow, "recommendation">): boolean {
  return /\b(investigat\w*|instrument\w*|diagnos\w*|gather evidence|collect evidence)\b/i.test(row.recommendation);
}

function safeChangeId(changeId: string): boolean {
  return /^[a-z0-9][a-z0-9._-]*$/i.test(changeId) && !changeId.includes("..") && !changeId.includes("/") && !changeId.includes("\\");
}

function slug(value: string): string {
  const slugged = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slugged.length > 0 ? slugged.slice(0, 48).replace(/-+$/g, "") : "finding";
}

export function expectedFollowUpId(sourceChangeId: string, finding: Pick<RetroProblem | ProblemRow, "problem">, actionableIndex: number): string {
  return `retro-${slug(sourceChangeId)}-${String(actionableIndex + 1).padStart(2, "0")}-${slug(finding.problem)}`.slice(0, 96).replace(/-+$/g, "");
}

function fileText(filePath: string): string | null {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return null;
  }
  return normalizeText(fs.readFileSync(filePath, "utf8"));
}

function section(text: string, heading: string): string | null {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`^##\\s+${escaped}\\s*$\\n(?<body>[\\s\\S]*?)(?=^##\\s+|(?![\\s\\S]))`, "m"));
  return match?.groups?.body ?? null;
}

function hasFinalRetroSection(tasks: string): boolean {
  const headings = Array.from(tasks.matchAll(/^##\s+(.+?)\s*$/gm), (match) => match[1].trim());
  return headings.length > 0 && headings[headings.length - 1] === "Retrospective Before Archive";
}

function lineValue(body: string, marker: string): string | undefined {
  const line = body.split("\n").find((candidate) => candidate.toLowerCase().includes(marker.toLowerCase()));
  if (line == null) {
    return undefined;
  }
  const colonIndex = line.indexOf(":");
  return colonIndex >= 0 ? line.slice(colonIndex + 1).trim() : undefined;
}

function nullableLineValue(body: string, marker: string): string | null {
  const value = lineValue(body, marker);
  return isMeaningful(value) ? value?.replace(/[.。]+$/, "") ?? null : null;
}

function parseDecision(decisionSection: string): string | undefined {
  const value = lineValue(decisionSection, "Decision");
  return value?.trim().toLowerCase();
}

function parseProblemRows(problemSection: string | null): { rows: ProblemRow[]; malformedRows: number } {
  if (problemSection == null) {
    return { rows: [], malformedRows: 0 };
  }
  let malformedRows = 0;
  const rows = problemSection
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"))
    .filter((line) => !/^\|\s*-+\s*\|/.test(line) && !/^\|\s*Problem\s*\|/i.test(line))
    .flatMap((line): ProblemRow[] => {
      const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
      if (cells.length !== 7) {
        malformedRows++;
        return [];
      }
      return [{ problem: cells[0], evidence: cells[1], impact: cells[2], rootCause: cells[3], recommendation: cells[4], confidence: cells[5], target: cells[6] }];
    });
  return { rows, malformedRows };
}

function outputChangeIds(outputs: string | null, marker: string): string[] {
  if (outputs == null) {
    return [];
  }
  const value = lineValue(outputs, marker);
  if (!isMeaningful(value)) {
    return [];
  }
  return Array.from(value.matchAll(/`([^`]+)`/g), (match) => match[1].trim()).filter((id) => id.length > 0);
}

function parseEvidence(evidenceSection: string | null): RetroEvidence[] {
  if (evidenceSection == null) {
    return [];
  }
  return evidenceSection
    .split("\n")
    .map((line) => line.trim().replace(/^[-*]\s+/, ""))
    .filter((line) => isMeaningful(line))
    .map((line) => ({ kind: "unknown", source: line, status: "unknown", summary: line }));
}

function fileIncludesAll(filePath: string, values: string[]): boolean {
  const text = fileText(filePath);
  return text != null && values.every((value) => text.includes(value));
}

function validateFollowUpChange(root: string, changeId: string, finding: Pick<RetroProblem | ProblemRow, "problem" | "evidence" | "impact" | "rootCause" | "recommendation">): string[] {
  if (!safeChangeId(changeId)) {
    return [`${changeId} is not a safe follow-up change id.`];
  }
  const changeRoot = path.join(root, "openspec", "changes", changeId);
  const proposalPath = path.join(changeRoot, "proposal.md");
  const tasksPath = path.join(changeRoot, "tasks.md");
  const specPath = path.join(changeRoot, "specs", changeId, "spec.md");
  const errors: string[] = [];
  if (!fs.existsSync(proposalPath) || !fs.existsSync(tasksPath) || !fs.existsSync(specPath)) {
    errors.push(`${changeId} must exist with proposal.md, tasks.md, and a spec delta before archive.`);
    return errors;
  }
  if (!fileIncludesAll(proposalPath, [finding.problem, finding.evidence, finding.impact, finding.rootCause, finding.recommendation])) {
    errors.push(`${changeId} proposal.md must preserve the retrospective problem, evidence, impact, root cause, and recommendation.`);
  }
  const taskRootCauseFragment = isUnknownRootCause(finding.rootCause) ? "Investigate and document the root cause" : finding.rootCause;
  const specRootCauseFragment = isUnknownRootCause(finding.rootCause) ? "discovered root cause" : finding.rootCause;
  if (!fileIncludesAll(tasksPath, [taskRootCauseFragment, finding.recommendation])) {
    errors.push(`${changeId} tasks.md must preserve the retrospective root cause and recommendation.`);
  }
  if (!fileIncludesAll(specPath, ["## ADDED Requirements", "#### Scenario:", specRootCauseFragment, finding.recommendation])) {
    errors.push(`${changeId} spec delta must preserve the retrospective root cause.`);
  }
  return errors;
}

function defaultRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

function exactKeys(value: Record<string, unknown>, keys: string[], label: string, errors: string[]): void {
  const allowed = new Set(keys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      errors.push(`Unknown field '${key}' in ${label}.`);
    }
  }
  for (const key of keys) {
    if (!(key in value)) {
      errors.push(`${label} missing required field '${key}'.`);
    }
  }
}

function stringArray(value: unknown, label: string, errors: string[]): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !isMeaningful(item))) {
    errors.push(`${label} must be an array of non-empty strings.`);
    return [];
  }
  return value;
}

function nullableString(value: unknown, label: string, errors: string[]): string | null {
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    errors.push(`${label} must be a string or null.`);
    return null;
  }
  return value;
}

function requireString(value: unknown, label: string, errors: string[], options: { allowUnknown?: boolean } = {}): string {
  if (typeof value !== "string" || (!isMeaningful(value) && !(options.allowUnknown === true && isUnknownRootCause(value)))) {
    errors.push(`${label} must be a non-empty string.`);
    return "";
  }
  return value;
}

function requireEnumString(value: unknown, label: string, errors: string[]): string {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${label} must be a non-empty string.`);
    return "";
  }
  return value;
}

function parseRetroArtifact(raw: unknown, changeId: string, errors: string[]): RetroArtifact | null {
  if (!isPlainRecord(raw)) {
    errors.push("automation/retro.json must contain a JSON object.");
    return null;
  }
  exactKeys(raw, retroTopLevelKeys, "retro artifact", errors);
  if (raw.schemaVersion !== 1) {
    errors.push("automation/retro.json schemaVersion must be 1.");
  }
  if (raw.changeId !== changeId) {
    errors.push(`automation/retro.json changeId must be '${changeId}'.`);
  }
  const generatedAt = requireString(raw.generatedAt, "automation/retro.json generatedAt", errors);
  if (generatedAt !== "" && Number.isNaN(Date.parse(generatedAt))) {
    errors.push("automation/retro.json generatedAt must be an ISO timestamp.");
  }

  const evidenceReviewed: RetroEvidence[] = [];
  if (!Array.isArray(raw.evidenceReviewed) || raw.evidenceReviewed.length === 0) {
    errors.push("automation/retro.json evidenceReviewed must include at least one evidence item.");
  } else {
    raw.evidenceReviewed.forEach((item, index) => {
      if (!isPlainRecord(item)) {
        errors.push(`evidenceReviewed[${index}] must be an object.`);
        return;
      }
      exactKeys(item, evidenceKeys, `evidenceReviewed[${index}]`, errors);
      const kind = requireEnumString(item.kind, `evidenceReviewed[${index}].kind`, errors);
      const status = requireEnumString(item.status, `evidenceReviewed[${index}].status`, errors);
      const source = requireString(item.source, `evidenceReviewed[${index}].source`, errors);
      const summary = requireString(item.summary, `evidenceReviewed[${index}].summary`, errors);
      if (!evidenceKinds.has(kind)) {
        errors.push(`evidenceReviewed[${index}].kind must be one of ${Array.from(evidenceKinds).join(", ")}.`);
      }
      if (!evidenceStatuses.has(status)) {
        errors.push(`evidenceReviewed[${index}].status must be one of ${Array.from(evidenceStatuses).join(", ")}.`);
      }
      evidenceReviewed.push({ kind: kind as RetroEvidence["kind"], source, status: status as RetroEvidence["status"], summary });
    });
  }

  const problems: RetroProblem[] = [];
  if (!Array.isArray(raw.problems)) {
    errors.push("automation/retro.json problems must be an array.");
  } else {
    raw.problems.forEach((item, index) => {
      if (!isPlainRecord(item)) {
        errors.push(`problems[${index}] must be an object.`);
        return;
      }
      exactKeys(item, problemKeys, `problems[${index}]`, errors);
      const problem = requireString(item.problem, `problems[${index}].problem`, errors);
      const evidence = requireString(item.evidence, `problems[${index}].evidence`, errors);
      const impact = requireString(item.impact, `problems[${index}].impact`, errors);
      const rootCause = requireString(item.rootCause, `problems[${index}].rootCause`, errors, { allowUnknown: true });
      const recommendation = requireString(item.recommendation, `problems[${index}].recommendation`, errors);
      const confidence = requireEnumString(item.confidence, `problems[${index}].confidence`, errors);
      const target = requireEnumString(item.target, `problems[${index}].target`, errors);
      const followUpChangeId = nullableString(item.followUpChangeId, `problems[${index}].followUpChangeId`, errors);
      const noFollowUpReason = nullableString(item.noFollowUpReason, `problems[${index}].noFollowUpReason`, errors);
      if (!confidenceValues.has(confidence)) {
        errors.push(`problems[${index}].confidence must be one of low, medium, high.`);
      }
      if (!findingTargets.has(target)) {
        errors.push(`problems[${index}].target must be one of project-local, opencode-dev-kit, none.`);
      }
      problems.push({ problem, evidence, impact, rootCause, recommendation, confidence: confidence as RetroProblem["confidence"], target: target as RetroProblem["target"], followUpChangeId, noFollowUpReason });
    });
  }

  const outputsRecord = isPlainRecord(raw.outputs) ? raw.outputs : null;
  if (outputsRecord == null) {
    errors.push("automation/retro.json outputs must be an object.");
  } else {
    exactKeys(outputsRecord, outputsKeys, "outputs", errors);
  }
  const outputs = {
    projectFollowUpChanges: stringArray(outputsRecord?.projectFollowUpChanges, "outputs.projectFollowUpChanges", errors),
    opencodeDevKitChanges: stringArray(outputsRecord?.opencodeDevKitChanges, "outputs.opencodeDevKitChanges", errors),
    noFindingsReason: nullableString(outputsRecord?.noFindingsReason, "outputs.noFindingsReason", errors),
  };

  const archiveGateRecord = isPlainRecord(raw.archiveGate) ? raw.archiveGate : null;
  if (archiveGateRecord == null) {
    errors.push("automation/retro.json archiveGate must be an object.");
  } else {
    exactKeys(archiveGateRecord, archiveGateKeys, "archiveGate", errors);
  }
  const decision = requireEnumString(archiveGateRecord?.decision, "archiveGate.decision", errors);
  const reason = requireString(archiveGateRecord?.reason, "archiveGate.reason", errors);
  const approver = nullableString(archiveGateRecord?.approver, "archiveGate.approver", errors);
  if (!decisionValues.has(decision)) {
    errors.push("Archive gate decision must be one of: passed, blocked, approved-skip.");
  }

  return {
    schemaVersion: 1,
    changeId,
    generatedAt,
    evidenceReviewed,
    problems,
    outputs,
    archiveGate: { decision: decision as RetroArtifact["archiveGate"]["decision"], reason, approver },
  };
}

function validateTasks(root: string, changeId: string, errors: string[]): void {
  const tasksPath = path.join(root, "openspec", "changes", changeId, "tasks.md");
  const tasks = fileText(tasksPath);
  if (tasks == null) {
    errors.push(`Missing tasks.md for ${changeId}.`);
    return;
  }
  const retroTasks = section(tasks, "Retrospective Before Archive");
  if (!hasFinalRetroSection(tasks)) {
    errors.push(`tasks.md must end with ## Retrospective Before Archive for ${changeId}.`);
  }
  for (const required of ["automation/retro.json", "project-local OpenSpec", "opencode-dev-kit", "archive gate"]) {
    if (retroTasks == null || !retroTasks.toLowerCase().includes(required.toLowerCase())) {
      errors.push(`tasks.md Retrospective Before Archive section must mention ${required}.`);
    }
  }
}

function validateArtifactSemantics(root: string, changeId: string, artifact: RetroArtifact, errors: string[]): void {
  const projectIds = new Set(artifact.outputs.projectFollowUpChanges);
  const devKitIds = new Set(artifact.outputs.opencodeDevKitChanges);
  if (artifact.problems.length === 0 && !isMeaningful(artifact.outputs.noFindingsReason)) {
    errors.push("No-findings retrospectives must record outputs.noFindingsReason with evidence reviewed.");
  }
  for (const [index, problem] of artifact.problems.entries()) {
    if (![problem.problem, problem.evidence, problem.impact, problem.recommendation, problem.confidence].every(isMeaningful) || (!isMeaningful(problem.rootCause) && !isUnknownRootCause(problem.rootCause))) {
      errors.push("Retrospective problem entries must include problem, evidence, impact, root cause, recommendation, and confidence.");
    }
    if (isUnknownRootCause(problem.rootCause) && !routesUnknownRootCauseInvestigation(problem)) {
      errors.push(`Retrospective finding '${problem.problem}' has unknown root cause and must route investigation or instrumentation before remediation.`);
    }
    if (problem.target === "none") {
      if (problem.followUpChangeId != null) {
        errors.push(`Retrospective finding '${problem.problem}' target none must not set followUpChangeId.`);
      }
      if (!isMeaningful(problem.noFollowUpReason)) {
        errors.push(`Retrospective finding '${problem.problem}' target none must include noFollowUpReason.`);
      }
      continue;
    }
    if (!isMeaningful(problem.followUpChangeId) && !isMeaningful(problem.noFollowUpReason)) {
      errors.push(`Retrospective finding '${problem.problem}' must include followUpChangeId or noFollowUpReason.`);
      continue;
    }
    if (!isMeaningful(problem.followUpChangeId)) {
      continue;
    }
    const followUpId = problem.followUpChangeId as string;
    const outputIds = problem.target === "project-local" ? projectIds : devKitIds;
    if (!outputIds.has(followUpId)) {
      errors.push(`Retrospective finding '${problem.problem}' followUpChangeId must be listed in outputs for ${problem.target}.`);
    }
    for (const followUpError of validateFollowUpChange(root, followUpId, problem)) {
      errors.push(`${problem.target} retrospective follow-up '${followUpId}' ${followUpError}`);
    }
    if (index < 0) {
      errors.push("Unreachable problem index.");
    }
  }
  if (artifact.archiveGate.decision === "blocked") {
    errors.push("Archive Gate Decision is blocked.");
  } else if (artifact.archiveGate.decision === "approved-skip") {
    if (!isMeaningful(artifact.archiveGate.reason) || !isMeaningful(artifact.archiveGate.approver)) {
      errors.push("Archive Gate Decision approved skip requires a reason and approver.");
    }
  }
}

export function readRetroArtifact(root: string, changeId: string): RetroArtifact {
  if (!safeChangeId(changeId)) {
    throw new Error(`Invalid change id '${changeId}'.`);
  }
  const retroPath = path.join(root, "openspec", "changes", changeId, "automation", "retro.json");
  const text = fileText(retroPath);
  if (text == null) {
    throw new Error(`Missing automation/retro.json for ${changeId}.`);
  }
  const parseErrors: string[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid automation/retro.json for ${changeId}: ${message}`);
  }
  const artifact = parseRetroArtifact(parsed, changeId, parseErrors);
  if (artifact == null || parseErrors.length > 0) {
    throw new Error(`Invalid automation/retro.json for ${changeId}: ${parseErrors.join("; ")}`);
  }
  return artifact;
}

export function writeRetroArtifact(root: string, artifact: RetroArtifact): void {
  if (!safeChangeId(artifact.changeId)) {
    throw new Error(`Invalid change id '${artifact.changeId}'.`);
  }
  const retroPath = path.join(root, "openspec", "changes", artifact.changeId, "automation", "retro.json");
  fs.mkdirSync(path.dirname(retroPath), { recursive: true });
  fs.writeFileSync(retroPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
}

export function evaluateRetroGate(root: string, changeId: string): RetroGateResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let archiveAllowed = false;

  if (!safeChangeId(changeId)) {
    errors.push(`Invalid change id '${changeId}'.`);
    return { valid: false, changeId, errors, warnings, archiveAllowed };
  }

  validateTasks(root, changeId, errors);
  const changeRoot = path.join(root, "openspec", "changes", changeId);
  const retroPath = path.join(changeRoot, "automation", "retro.json");
  const legacyPath = path.join(changeRoot, "retrospective.md");
  const retroText = fileText(retroPath);
  if (retroText == null) {
    const legacyHint = fileText(legacyPath) != null ? ` Legacy retrospective.md is transitional only; run npm run openspec:retro-gate -- ${changeId} --migrate-legacy or create automation/retro.json.` : "";
    errors.push(`Missing automation/retro.json for ${changeId}.${legacyHint}`);
    return { valid: false, changeId, errors, warnings, archiveAllowed };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(retroText);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`Invalid automation/retro.json for ${changeId}: ${message}`);
    return { valid: false, changeId, errors, warnings, archiveAllowed };
  }

  const artifact = parseRetroArtifact(parsed, changeId, errors);
  if (artifact != null) {
    validateArtifactSemantics(root, changeId, artifact, errors);
  }

  archiveAllowed = errors.length === 0;
  return { valid: errors.length === 0, changeId, errors, warnings, archiveAllowed };
}

function legacyRowsToProblems(changeId: string, rows: ProblemRow[], outputs: string | null): RetroProblem[] {
  const actionableRows = rows.filter((row) => row.target === "project-local" || row.target === "opencode-dev-kit");
  const projectIds = outputChangeIds(outputs, "Project follow-up changes");
  const devKitIds = outputChangeIds(outputs, "opencode-dev-kit");
  return rows.map((row) => {
    const actionableIndex = actionableRows.indexOf(row);
    const target = findingTargets.has(row.target) ? row.target as RetroProblem["target"] : "none";
    const outputIds = target === "project-local" ? projectIds : target === "opencode-dev-kit" ? devKitIds : [];
    const expectedId = actionableIndex >= 0 ? expectedFollowUpId(changeId, row, actionableIndex) : null;
    const followUpChangeId = expectedId != null && outputIds.includes(expectedId) ? expectedId : outputIds[0] ?? null;
    return {
      problem: row.problem,
      evidence: row.evidence,
      impact: row.impact,
      rootCause: row.rootCause,
      recommendation: row.recommendation,
      confidence: confidenceValues.has(row.confidence) ? row.confidence as RetroProblem["confidence"] : "low",
      target,
      followUpChangeId: target === "none" ? null : followUpChangeId,
      noFollowUpReason: target === "none" ? row.recommendation || "No follow-up needed." : null,
    };
  });
}

function parseLegacyRetrospective(changeId: string, retrospective: string, generatedAt: string): { artifact?: RetroArtifact; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const evidence = section(retrospective, "Evidence Reviewed");
  const problems = section(retrospective, "Problems Found");
  const outputs = section(retrospective, "Outputs");
  const archiveDecision = section(retrospective, "Archive Gate Decision");
  if (evidence == null) {
    errors.push("retrospective.md must include ## Evidence Reviewed.");
  }
  if (problems == null) {
    errors.push("retrospective.md must include ## Problems Found.");
  }
  if (outputs == null) {
    errors.push("retrospective.md must include ## Outputs.");
  }
  if (archiveDecision == null) {
    errors.push("retrospective.md must include ## Archive Gate Decision.");
  }
  const parsedProblems = parseProblemRows(problems);
  if (parsedProblems.malformedRows > 0) {
    errors.push("Retrospective problem rows must have exactly seven columns: Problem, Evidence, Impact, Root Cause, Recommendation, Confidence, Target.");
  }
  const decision = archiveDecision != null ? parseDecision(archiveDecision) : undefined;
  const archiveGate = {
    decision: decisionValues.has(decision ?? "") ? decision as RetroArtifact["archiveGate"]["decision"] : "blocked" as const,
    reason: archiveDecision != null ? nullableLineValue(archiveDecision, "Reason") ?? "Legacy migration missing archive reason." : "Legacy migration missing archive decision.",
    approver: archiveDecision != null ? nullableLineValue(archiveDecision, "Approver") : null,
  };
  const artifact: RetroArtifact = {
    schemaVersion: 1,
    changeId,
    generatedAt,
    evidenceReviewed: parseEvidence(evidence),
    problems: legacyRowsToProblems(changeId, parsedProblems.rows, outputs),
    outputs: {
      projectFollowUpChanges: outputChangeIds(outputs, "Project follow-up changes"),
      opencodeDevKitChanges: outputChangeIds(outputs, "opencode-dev-kit"),
      noFindingsReason: outputs != null ? nullableLineValue(outputs, "No findings reason") : null,
    },
    archiveGate,
  };
  return { artifact, errors, warnings };
}

function migrateLegacyTaskTail(root: string, changeId: string): void {
  const tasksPath = path.join(root, "openspec", "changes", changeId, "tasks.md");
  const tasks = fileText(tasksPath);
  if (tasks == null) {
    return;
  }
  let updated = tasks.replace(/`retrospective\.md`/g, `\`openspec/changes/${changeId}/automation/retro.json\``);
  updated = updated.replace(/after the retro gate passes/g, "after the JSON retro gate passes");
  updated = updated.replace(/after the JSON retro gate passes or an approved skip reason is recorded(?! in `automation\/retro\.json`)/g, "after the JSON retro gate passes or an approved skip reason is recorded in `automation/retro.json`");
  if (updated !== tasks) {
    fs.writeFileSync(tasksPath, updated, "utf8");
  }
}

export function migrateLegacyRetrospective(root: string, changeId: string, options: { dryRun?: boolean; generatedAt?: string } = {}): RetroMigrationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!safeChangeId(changeId)) {
    errors.push(`Invalid change id '${changeId}'.`);
    return { migrated: false, changeId, path: "", errors, warnings };
  }
  const changeRoot = path.join(root, "openspec", "changes", changeId);
  const legacyPath = path.join(changeRoot, "retrospective.md");
  const retroPath = path.join(changeRoot, "automation", "retro.json");
  const retrospective = fileText(legacyPath);
  if (retrospective == null) {
    errors.push(`Missing retrospective.md for ${changeId}; create automation/retro.json directly.`);
    return { migrated: false, changeId, path: retroPath, errors, warnings };
  }
  const parsed = parseLegacyRetrospective(changeId, retrospective, options.generatedAt ?? new Date().toISOString());
  errors.push(...parsed.errors);
  warnings.push(...parsed.warnings);
  if (parsed.artifact == null || errors.length > 0) {
    return { migrated: false, changeId, path: retroPath, errors, warnings, artifact: parsed.artifact };
  }
  if (options.dryRun !== true) {
    writeRetroArtifact(root, parsed.artifact);
    migrateLegacyTaskTail(root, changeId);
  }
  return { migrated: true, changeId, path: retroPath, errors, warnings, artifact: parsed.artifact };
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = { root: process.cwd(), format: "json", migrateLegacy: false, dryRun: false };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--root") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("Missing value for --root.");
      }
      options.root = path.resolve(value);
      index++;
    } else if (arg === "--format") {
      const value = args[index + 1];
      if (value !== "json" && value !== "text") {
        throw new Error("--format must be json or text.");
      }
      options.format = value;
      index++;
    } else if (arg === "--migrate-legacy") {
      options.migrateLegacy = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    } else if (options.changeId == null) {
      options.changeId = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }
  return options;
}

function renderText(result: RetroGateResult): string {
  const lines = [
    `changeId: ${result.changeId}`,
    `valid: ${String(result.valid)}`,
    `archiveAllowed: ${String(result.archiveAllowed)}`,
  ];
  for (const error of result.errors) {
    lines.push(`error: ${error}`);
  }
  for (const warning of result.warnings) {
    lines.push(`warning: ${warning}`);
  }
  return `${lines.join("\n")}\n`;
}

function renderMigrationText(result: RetroMigrationResult): string {
  const lines = [`changeId: ${result.changeId}`, `migrated: ${String(result.migrated)}`, `path: ${result.path}`];
  for (const error of result.errors) {
    lines.push(`error: ${error}`);
  }
  for (const warning of result.warnings) {
    lines.push(`warning: ${warning}`);
  }
  return `${lines.join("\n")}\n`;
}

function runCli(): void {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.changeId == null) {
      throw new Error("Usage: node tools/openspec-retro-gate.ts <change-id> [--root <repo>] [--format json|text] [--migrate-legacy] [--dry-run]");
    }
    if (options.migrateLegacy) {
      const migration = migrateLegacyRetrospective(options.root || defaultRoot(), options.changeId, { dryRun: options.dryRun });
      if (!migration.migrated) {
        process.stdout.write(options.format === "json" ? `${JSON.stringify(migration, null, 2)}\n` : renderMigrationText(migration));
        process.exitCode = 1;
        return;
      }
      if (options.dryRun) {
        process.stdout.write(options.format === "json" ? `${JSON.stringify(migration, null, 2)}\n` : renderMigrationText(migration));
        return;
      }
    }
    const result = evaluateRetroGate(options.root || defaultRoot(), options.changeId);
    process.stdout.write(options.format === "json" ? `${JSON.stringify(result, null, 2)}\n` : renderText(result));
    if (!result.valid) {
      process.exitCode = 1;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli();
}
