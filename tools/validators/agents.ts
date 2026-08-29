import path from "node:path";
import {
  ALLOWED_COMPLAIN_SKILL_RULES,
  ALLOWED_REVIEWER_BASH_RULES,
  ALLOWED_REVIEWER_EDIT_RULES,
  CODE_QUALITY_REVIEWER_FILE,
  CODE_QUALITY_REVIEWER_REQUIRED_TEXT,
  FINAL_CANDIDATE_REVIEWER_FILE,
  FINAL_CANDIDATE_REVIEWER_REQUIRED_TEXT,
  IMPLEMENTATION_READINESS_REVIEWER_FILE,
  IMPLEMENTATION_READINESS_REVIEWER_REQUIRED_TEXT,
  LEAF_REVIEWER_AGENT_CONTRACT_RELATIVE_PATH,
  LEAF_REVIEWER_SHARED_EFFECTIVE_MODEL_REQUIRED_TEXT,
  REVIEW_DELIVERY_AGENT_FILES,
  REUSABLE_REVIEWER_FORBIDDEN_BOILERPLATE,
  REUSABLE_REVIEWER_FORBIDDEN_INLINE_BLOCKS,
  REUSABLE_REVIEWER_LEAF_CONTRACT_TEXT,
  REVIEWER_SDET_FORBIDDEN_ACTION_FIELDS,
  REVIEWER_DENIED_PERMISSION_KEYS,
  REVIEWER_OBSOLETE_PERMISSION_KEYS,
  STANDALONE_CONTRACT_REFERENCE_PATH,
} from "../contracts/agents.ts";
import {
  AGENT_TEXT_CONTRACTS,
  PREVENTION_FEEDBACK_REVIEWER_FILES,
} from "../contracts/reviewer-binding.ts";
import {
  ALLOWED_IMPLEMENTATION_WORKER_BASH_RULES,
  IMPLEMENTATION_WORKER_DENIED_PERMISSION_KEYS,
  IMPLEMENTATION_WORKER_FILE,
  IMPLEMENTATION_WORKER_REQUIRED_TEXT,
} from "../contracts/implementation-worker.ts";
import {
  ALLOWED_SDET_QUALITY_ENGINEER_BASH_RULES,
  ALLOWED_SDET_QUALITY_ENGINEER_EDIT_RULES,
  SDET_QUALITY_ENGINEER_DENIED_PERMISSION_KEYS,
  SDET_QUALITY_ENGINEER_FILE,
  SDET_QUALITY_ENGINEER_REQUIRED_TEXT,
} from "../contracts/sdet-quality-engineer.ts";
import {
  TROUBLESHOOTER_FILE,
  TROUBLESHOOTER_PERMISSION,
  TROUBLESHOOTER_REQUIRED_TEXT,
} from "../contracts/troubleshooter.ts";
import {
  fencedCodeLineMask,
  isAtxH1OrH2BoundaryLine,
  scanModelFacingMarkdownBody,
} from "./active-authority.ts";
import type { FrontmatterMap, ValidationContext } from "./context.ts";
import {
  directoryExists,
  getRequiredScalar,
  listFiles,
  readText,
  requireTextContains,
  validateTextContracts,
} from "./context.ts";
import { getFrontmatterMap } from "./frontmatter.ts";

/** Byte-exact Output heading that owns each intentional report-envelope schema. */
const EXACT_OUTPUT_H2 = "## Output";
/** Byte-exact top-level opener for intentional role report envelopes. */
const EXACT_REPORT_MARKDOWN_OPEN = "```markdown";
/** Byte-exact top-level closer for intentional role report envelopes. */
const EXACT_REPORT_MARKDOWN_CLOSE = "```";
const SESSION_COMPLETION_ARBITER_FILE = "session-completion-arbiter.md";
const SPECIALIST_TEAM_ADVISOR_FILE = "specialist-team-advisor.md";
const SPECIALIST_TEAM_ADVISOR_DESCRIPTION = "Use before deciding to select or omit maintained routes in a new non-trivial parentless root mission; returns the smallest sufficient team. Stay quiet only for one already-selected existing-owner action with known proof.";

/**
 * Markers that may be certified only from the intentional ## Output report
 * envelope for implementation-worker. Behavioral/safety markers stay operative-only.
 */
const IMPLEMENTATION_WORKER_REPORT_SCHEMA_ONLY_MARKERS: readonly string[] = [
  "Blockers",
  "Residual Risks",
  "Effective Model",
  "Execution Request",
];

/**
 * Markers that may be certified only from the intentional ## Output report
 * envelope for sdet-quality-engineer.
 */
const SDET_QUALITY_ENGINEER_REPORT_SCHEMA_ONLY_MARKERS: readonly string[] = [
  "Action: critical-risks-reported | no-critical-risk | blocked",
  "SDET_QUALITY_REPORT",
  "Effective Model:",
  "Critical Risk Matrix",
  "Risk ID",
  "Incident Consequence",
  "Reachability And Envelope",
  "Raw Evidence",
  "Reproduction Procedure",
  "Test Evidence",
  "Test Changes",
  "Evidence Gaps And Residual Risks",
];

/**
 * Markers that may be certified only from the intentional ## Output report
 * envelope for final-candidate-reviewer.
 */
const FINAL_CANDIDATE_REVIEWER_REPORT_SCHEMA_ONLY_MARKERS: readonly string[] = [
  "Risk Matrix",
  "Risk ID",
  "Requirement/Invariant",
  "Reachable Scenario And Enforced Envelope",
  "Business Consequence",
  "Likelihood",
  "Confidence",
  "Reproduction Procedure",
  "Smallest Mitigation Note",
  "Evidence Gaps And Residual Risks",
  "FINAL_CANDIDATE_REVIEW_REPORT",
  "Effective Model",
  "exact candidate assessed",
];

/**
 * Markers that may be certified only from the intentional ## Output report
 * envelope for troubleshooter.
 */
const TROUBLESHOOTER_REPORT_SCHEMA_ONLY_MARKERS: readonly string[] = [
  "TROUBLESHOOTER_REPORT",
  "Missing Decision-Changing Evidence",
  "Best Goal-Preserving Route",
  "Rejected Routes",
  "Continuation Items",
];

/** Model-facing agent body after frontmatter strip and fence/indent filtering. */
type AgentModelFacingSurfaces = {
  /** Raw body after YAML frontmatter removal (fences retained). */
  rawBody: string;
  /** Operative instructions: no frontmatter, supported fences, or indented code. */
  operativeBody: string;
};

/**
 * Build model-facing surfaces for agent contract checks via the shared scanner.
 * Missing frontmatter returns null (frontmatter map validation already recorded).
 * Unsupported non-top-level fence syntax records a path-specific error and returns
 * null so callers skip opposite-polarity cascades on that file.
 */
function readAgentModelFacingSurfaces(
  ctx: ValidationContext,
  text: string,
  file: string,
): AgentModelFacingSurfaces | null {
  const scan = scanModelFacingMarkdownBody(text);
  if (!scan.hasFrontmatter) {
    return null;
  }
  if (scan.unsupportedFenceLine != null) {
    ctx.addError(
      `unsupported non-top-level fenced-code syntax at line ${scan.unsupportedFenceLine}: ${file}`,
    );
    return null;
  }
  return {
    rawBody: scan.rawBody,
    operativeBody: scan.operativeBody,
  };
}

/**
 * Exact intentional report-envelope body under one ## Output section, or null.
 * Requires exactly one top-level ```markdown fence whose first/last body lines are
 * the role's opening/closing report tags.
 */
function extractExactReportSchemaBody(
  body: string,
  openTag: string,
  closeTag: string,
): string | null {
  const lines = body.split(/\r?\n/);
  const fenced = fencedCodeLineMask(lines);

  let sectionStart = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (!fenced[i] && lines[i] === EXACT_OUTPUT_H2) {
      if (sectionStart >= 0) {
        return null;
      }
      sectionStart = i;
    }
  }
  if (sectionStart < 0) {
    return null;
  }

  let sectionEnd = lines.length;
  for (let i = sectionStart + 1; i < lines.length; i += 1) {
    if (!fenced[i] && isAtxH1OrH2BoundaryLine(lines[i]!)) {
      sectionEnd = i;
      break;
    }
  }

  const openers: number[] = [];
  for (let i = sectionStart + 1; i < sectionEnd; i += 1) {
    if (fenced[i] && (i === 0 || !fenced[i - 1])) {
      openers.push(i);
    }
  }
  if (openers.length !== 1) {
    return null;
  }

  const open = openers[0]!;
  if (lines[open] !== EXACT_REPORT_MARKDOWN_OPEN) {
    return null;
  }

  let close = open;
  while (close + 1 < sectionEnd && fenced[close + 1]) {
    close += 1;
  }
  if (close === open || lines[close] !== EXACT_REPORT_MARKDOWN_CLOSE) {
    return null;
  }

  const schemaBody: string[] = [];
  for (let i = open + 1; i < close; i += 1) {
    schemaBody.push(lines[i]!);
  }
  if (schemaBody.length < 2) {
    return null;
  }
  if (schemaBody[0] !== openTag || schemaBody[schemaBody.length - 1] !== closeTag) {
    return null;
  }
  return schemaBody.join("\n");
}

/**
 * Require an exact ## Output report envelope and return its body, or record an error.
 */
function requireExactReportSchemaBody(
  ctx: ValidationContext,
  body: string,
  openTag: string,
  closeTag: string,
  file: string,
): string | null {
  const schemaBody = extractExactReportSchemaBody(body, openTag, closeTag);
  if (schemaBody == null) {
    ctx.addError(
      `Agent must contain exactly one exact ## Output top-level \`\`\`markdown report envelope (${openTag}...${closeTag}): ${file}`,
    );
    return null;
  }
  return schemaBody;
}

function rejectForbiddenReportSchemaFields(
  ctx: ValidationContext,
  reportSchemaBody: string | null,
  file: string,
): void {
  if (reportSchemaBody == null) return;
  for (const field of REVIEWER_SDET_FORBIDDEN_ACTION_FIELDS) {
    if (reportSchemaBody.includes(field)) {
      ctx.addError(`superseded reviewer/SDET action-list field ${field}: ${file}`);
    }
  }
}

/**
 * Require contract markers from operative body, with an explicit schema-only allowlist
 * satisfied only from the intentional report envelope. No dynamic missing-marker fallback.
 */
function requireOperativeOrAllowlistedReportMarkers(
  ctx: ValidationContext,
  operativeBody: string,
  reportSchemaBody: string | null,
  schemaOnlyAllowlist: readonly string[],
  required: readonly string[],
  label: string,
  file: string,
): void {
  const allowlist = new Set(schemaOnlyAllowlist);
  for (const marker of required) {
    if (operativeBody.includes(marker)) {
      continue;
    }
    if (
      allowlist.has(marker) &&
      reportSchemaBody != null &&
      reportSchemaBody.includes(marker)
    ) {
      continue;
    }
    requireTextContains(ctx, operativeBody, marker, label, file);
  }
}

function validateReviewerBashPermission(
  ctx: ValidationContext,
  frontmatter: FrontmatterMap,
  file: string,
): void {
  for (const [key, expected] of ALLOWED_REVIEWER_BASH_RULES) {
    if (frontmatter.get(key) !== expected) {
      ctx.addError(
        `Agent permission must set ${key.replace("permission.", "")}: ${expected}: ${file}`,
      );
    }
  }
}

function validateSessionDeliveryContextPermission(
  ctx: ValidationContext,
  frontmatter: FrontmatterMap,
  file: string,
): void {
  if (frontmatter.has("permission.session_delivery_context")) {
    ctx.addError(
      `No active agent may set session_delivery_context permission: ${file}`,
    );
  }
}

function validateSessionCompletionArbiter(
  ctx: ValidationContext,
  frontmatter: FrontmatterMap,
  surfaces: AgentModelFacingSurfaces,
  file: string,
): void {
  if (![true, "true"].includes(frontmatter.get("hidden") as true | "true")) {
    ctx.addError(`session-completion-arbiter must set hidden: true: ${file}`);
  }
  if (frontmatter.get("permission.*") !== "deny") {
    ctx.addError(`session-completion-arbiter must set wildcard permission deny: ${file}`);
  }
  if (frontmatter.get("steps") !== "6") {
    ctx.addError(`session-completion-arbiter must set steps: 6: ${file}`);
  }
  for (const permission of [
    "bash",
    "edit",
    "task",
    "question",
    "skill",
    "webfetch",
    "websearch",
    "todowrite",
    "external_directory",
    "lsp",
    "doom_loop",
  ]) {
    if (frontmatter.get(`permission.${permission}`) !== "deny") {
      ctx.addError(`session-completion-arbiter must set ${permission}: deny: ${file}`);
    }
  }
  for (const required of [
    "schemaVersion",
    "auditID",
    "rootSessionRef",
    "inspectedRevision",
    "allow_stop | continue | owner_required | user_paused",
    "questionAnswers",
    "one JSON object",
    "Do not wrap it in Markdown",
    "never run as an optional reviewer",
    "never approves `Development-Stage`",
    "technical/evidence blocker",
    "supported claim ceiling",
    "smallest remaining safe causally distinct probe",
    "return `continue`",
  ]) {
    requireTextContains(
      ctx,
      surfaces.rawBody,
      required,
      "session-completion-arbiter machine verdict contract",
      file,
    );
  }
}

function validateSpecialistTeamAdvisor(
  ctx: ValidationContext,
  frontmatter: FrontmatterMap,
  surfaces: AgentModelFacingSurfaces,
  file: string,
): void {
  if (frontmatter.get("description") !== SPECIALIST_TEAM_ADVISOR_DESCRIPTION) {
    ctx.addError(`specialist-team-advisor must use the exact discovery description: ${file}`);
  }
  const allowed = new Map<string, string>([
    ["permission.*", "deny"],
    ["permission.glob", "allow"],
    ["permission.grep", "allow"],
    ["permission.read", "allow"],
    ["permission.specialist_catalog", "allow"],
  ]);
  for (const [key, expected] of allowed) {
    if (frontmatter.get(key) !== expected) {
      ctx.addError(`specialist-team-advisor must set ${key}: ${expected}: ${file}`);
    }
  }
  for (const [key, value] of frontmatter) {
    if (key.startsWith("permission.") && value === "allow" && allowed.get(key) !== "allow") {
      ctx.addError(`specialist-team-advisor has unsupported allow '${key}': ${file}`);
    }
  }
  if (frontmatter.has("hidden")) {
    ctx.addError(`specialist-team-advisor must remain discoverable: ${file}`);
  }
  for (const required of [
    "read-only specialist team advisor",
    "Call `specialist_catalog` exactly once",
    "You never dispatch",
    "Do not embed a static roster",
    "does not satisfy or suppress a matched Practice Owner trigger",
  ]) {
    requireTextContains(
      ctx,
      surfaces.operativeBody,
      required,
      "specialist-team-advisor non-reviewer contract",
      file,
    );
  }
  for (const required of [
    "Team Advice: main-alone | team-recommended | unknown",
    "Effective Model",
    "Mission Spine Retained By Main",
    "Work Packages",
    "Considered Omissions",
    "Evidence Gaps",
    "Reconsultation Condition",
  ]) {
    requireTextContains(
      ctx,
      surfaces.rawBody,
      required,
      "specialist-team-advisor output contract",
      file,
    );
  }
}

function validateComplainSkillPermission(
  ctx: ValidationContext,
  frontmatter: FrontmatterMap,
  file: string,
  owner: string,
): void {
  for (const [key, expected] of ALLOWED_COMPLAIN_SKILL_RULES) {
    if (frontmatter.get(key) !== expected) {
      ctx.addError(`${owner} must set ${key.replace("permission.", "")}: ${expected}: ${file}`);
    }
  }
  for (const [key, value] of frontmatter) {
    if (
      key.startsWith("permission.skill.") &&
      ALLOWED_COMPLAIN_SKILL_RULES.get(key) !== value
    ) {
      ctx.addError(
        `${owner} has unsupported skill permission '${key.replace("permission.skill.", "")}: ${String(value)}': ${file}`,
      );
    }
  }
  if (frontmatter.has("permission.skill") && typeof frontmatter.get("permission.skill") !== "object") {
    ctx.addError(
      `${owner} must use scoped skill permissions, not skill: ${String(frontmatter.get("permission.skill"))}: ${file}`,
    );
  }
}

function validateReviewerFeedbackEditPermission(
  ctx: ValidationContext,
  frontmatter: FrontmatterMap,
  file: string,
): void {
  for (const [key, expected] of ALLOWED_REVIEWER_EDIT_RULES) {
    if (frontmatter.get(key) !== expected) {
      ctx.addError(
        `Agent permission must set ${key.replace("permission.", "")}: ${expected}: ${file}`,
      );
    }
  }
  for (const [key, value] of frontmatter) {
    if (
      key.startsWith("permission.edit.") &&
      ALLOWED_REVIEWER_EDIT_RULES.get(key) !== value
    ) {
      ctx.addError(
        `Agent has unsupported edit permission '${key.replace("permission.edit.", "")}: ${String(value)}': ${file}`,
      );
    }
  }
  if (frontmatter.has("permission.edit") && typeof frontmatter.get("permission.edit") !== "object") {
    ctx.addError(
      `Agent permission must use scoped edit permissions, not edit: ${String(frontmatter.get("permission.edit"))}: ${file}`,
    );
  }
}

function validateImplementationWorker(
  ctx: ValidationContext,
  frontmatter: FrontmatterMap,
  surfaces: AgentModelFacingSurfaces,
  file: string,
): void {
  if (frontmatter.get("permission.edit") !== "allow") {
    ctx.addError(`Implementation worker must set edit: allow: ${file}`);
  }
  for (const [key, expected] of ALLOWED_IMPLEMENTATION_WORKER_BASH_RULES) {
    if (frontmatter.get(key) !== expected) {
      ctx.addError(
        `Implementation worker must set ${key.replace("permission.", "")}: ${expected}: ${file}`,
      );
    }
  }
  for (const [key, value] of frontmatter) {
    if (
      key.startsWith("permission.bash.") &&
      ALLOWED_IMPLEMENTATION_WORKER_BASH_RULES.get(key) !== value
    ) {
      ctx.addError(
        `Implementation worker has unsupported bash permission '${key.replace("permission.bash.", "")}: ${String(value)}': ${file}`,
      );
    }
  }
  if (
    frontmatter.has("permission.bash") &&
    typeof frontmatter.get("permission.bash") === "object"
  ) {
    ctx.addError(
      `Implementation worker must use scalar bash: deny, not nested bash rules: ${file}`,
    );
  }
  validateComplainSkillPermission(ctx, frontmatter, file, "Implementation worker");
  for (const permission of IMPLEMENTATION_WORKER_DENIED_PERMISSION_KEYS) {
    const key = `permission.${permission}`;
    if (frontmatter.get(key) !== "deny") {
      ctx.addError(`Implementation worker must set ${permission}: deny: ${file}`);
    }
  }
  const reportSchemaBody = requireExactReportSchemaBody(
    ctx,
    surfaces.rawBody,
    "<IMPLEMENTATION_WORKER_REPORT>",
    "</IMPLEMENTATION_WORKER_REPORT>",
    file,
  );
  requireOperativeOrAllowlistedReportMarkers(
    ctx,
    surfaces.operativeBody,
    reportSchemaBody,
    IMPLEMENTATION_WORKER_REPORT_SCHEMA_ONLY_MARKERS,
    IMPLEMENTATION_WORKER_REQUIRED_TEXT,
    "Implementation worker contract",
    file,
  );
}

function validateSdetQualityEngineer(
  ctx: ValidationContext,
  frontmatter: FrontmatterMap,
  surfaces: AgentModelFacingSurfaces,
  file: string,
): void {
  for (const [key, expected] of ALLOWED_SDET_QUALITY_ENGINEER_BASH_RULES) {
    if (frontmatter.get(key) !== expected) {
      ctx.addError(
        `SDET quality engineer must set ${key.replace("permission.", "")}: ${expected}: ${file}`,
      );
    }
  }
  for (const [key, expected] of ALLOWED_SDET_QUALITY_ENGINEER_EDIT_RULES) {
    if (frontmatter.get(key) !== expected) {
      ctx.addError(
        `SDET quality engineer must set ${key.replace("permission.", "")}: ${expected}: ${file}`,
      );
    }
  }
  for (const [key, value] of frontmatter) {
    if (key.startsWith("permission.bash.")) {
      ctx.addError(
        `SDET quality engineer has unsupported nested bash permission '${key.replace("permission.bash.", "")}: ${String(value)}': ${file}`,
      );
    }
    if (key.startsWith("permission.edit.")) {
      ctx.addError(
        `SDET quality engineer has unsupported nested edit permission '${key.replace("permission.edit.", "")}: ${String(value)}': ${file}`,
      );
    }
    if (key.startsWith("permission.skill.")) {
      ctx.addError(
        `SDET quality engineer has unsupported nested skill permission '${key.replace("permission.skill.", "")}: ${String(value)}': ${file}`,
      );
    }
  }
  if (
    frontmatter.has("permission.bash") &&
    typeof frontmatter.get("permission.bash") === "object"
  ) {
    ctx.addError(`SDET quality engineer must use scalar bash: deny, not nested bash rules: ${file}`);
  }
  if (
    frontmatter.has("permission.edit") &&
    typeof frontmatter.get("permission.edit") === "object"
  ) {
    ctx.addError(`SDET quality engineer must use scalar edit: allow, not nested edit rules: ${file}`);
  }
  for (const permission of SDET_QUALITY_ENGINEER_DENIED_PERMISSION_KEYS) {
    const key = `permission.${permission}`;
    if (frontmatter.get(key) !== "deny") {
      ctx.addError(`SDET quality engineer must set ${permission}: deny: ${file}`);
    }
  }
  const reportSchemaBody = requireExactReportSchemaBody(
    ctx,
    surfaces.rawBody,
    "<SDET_QUALITY_REPORT>",
    "</SDET_QUALITY_REPORT>",
    file,
  );
  rejectForbiddenReportSchemaFields(ctx, reportSchemaBody, file);
  requireOperativeOrAllowlistedReportMarkers(
    ctx,
    surfaces.operativeBody,
    reportSchemaBody,
    SDET_QUALITY_ENGINEER_REPORT_SCHEMA_ONLY_MARKERS,
    SDET_QUALITY_ENGINEER_REQUIRED_TEXT,
    "SDET quality engineer contract",
    file,
  );
}

/** Byte-exact allowed Contract Reference heading (cardinality + shape gate). */
const EXACT_CONTRACT_REFERENCE_HEADING = "## Contract Reference";
/**
 * ATX heading-like lines for title "Contract Reference": optional 0-3 leading
 * ASCII spaces (CommonMark ATX; four spaces is a code block, not a heading),
 * levels 1-6, spaces/tabs before the title, optional closing hash run, trailing
 * horizontal whitespace only. Anchored so ordinary prose/identifiers containing
 * the title are not headings. Sole allowed form remains byte-exact unindented
 * `## Contract Reference` via the exact-syntax gate after cardinality.
 */
const CONTRACT_REFERENCE_HEADING_LIKE =
  /^ {0,3}#{1,6}[ \t]+Contract Reference(?:[ \t]+#+)?[ \t]*$/;

/**
 * Exact standalone Contract Reference form for registered reusable reviewers and
 * final-candidate-reviewer: exactly one heading-like occurrence that is byte-exact
 * `## Contract Reference`, blank line, sole backticked path line, blank line, then
 * next ## heading or EOF. Line-ending tolerant; rejects zero, duplicate, or
 * malformed heading-like lines and verbose explanatory lines.
 * Applies only to the named set so non-reviewer agents (e.g. qwen-local-worker) are untouched.
 */
function validateStandaloneContractReference(
  ctx: ValidationContext,
  text: string,
  file: string,
): void {
  const lines = text.split(/\r?\n/);
  // Fenced examples must not count toward Contract Reference heading cardinality.
  const fenced = fencedCodeLineMask(lines);
  const headingIndexes: number[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (fenced[i]) {
      continue;
    }
    if (CONTRACT_REFERENCE_HEADING_LIKE.test(lines[i]!)) {
      headingIndexes.push(i);
    }
  }
  // Cardinality over all unfenced heading-like forms (wrong level, trailing space, closing #, etc.).
  if (headingIndexes.length !== 1) {
    ctx.addError(
      `Reusable reviewer agent must contain exactly one ## Contract Reference heading: ${file}`,
    );
    return;
  }
  const headingIndex = headingIndexes[0]!;
  const headingLine = lines[headingIndex]!;
  // Sole occurrence must be the exact allowed syntax before section shape is read.
  if (headingLine !== EXACT_CONTRACT_REFERENCE_HEADING) {
    ctx.addError(
      `Reusable reviewer agent Contract Reference heading must be exactly "${EXACT_CONTRACT_REFERENCE_HEADING}": ${file}`,
    );
    return;
  }
  const blankAfterHeading = lines[headingIndex + 1];
  const pathLine = lines[headingIndex + 2];
  const blankAfterPath = lines[headingIndex + 3];
  if (blankAfterHeading !== "") {
    ctx.addError(
      `Contract Reference must be followed by a blank line then standalone backticked path: ${file}`,
    );
    return;
  }
  if (pathLine !== STANDALONE_CONTRACT_REFERENCE_PATH) {
    ctx.addError(
      `Contract Reference path line must be exactly ${STANDALONE_CONTRACT_REFERENCE_PATH} (no verbose explanatory sentence): ${file}`,
    );
    return;
  }
  if (blankAfterPath !== undefined && blankAfterPath !== "") {
    ctx.addError(
      `Contract Reference standalone path must be followed by a blank line then next ## heading or EOF: ${file}`,
    );
    return;
  }
  // blankAfterPath is "" or undefined (EOF after path with trailing newline only).
  // Scan any remainder: first non-empty line must be a ## heading; blank-only remainder is EOF.
  if (blankAfterPath === undefined) {
    return;
  }
  let firstNonEmpty: string | undefined;
  for (let i = headingIndex + 4; i < lines.length; i += 1) {
    if (lines[i] !== "") {
      firstNonEmpty = lines[i];
      break;
    }
  }
  if (firstNonEmpty === undefined) {
    return;
  }
  if (!firstNonEmpty.startsWith("## ")) {
    ctx.addError(
      `Contract Reference must be followed by blank line then next ## heading or EOF: ${file}`,
    );
  }
}

function validateFinalCandidateReviewerExtras(
  ctx: ValidationContext,
  frontmatter: FrontmatterMap,
  surfaces: AgentModelFacingSurfaces,
  file: string,
): void {
  const reportSchemaBody = requireExactReportSchemaBody(
    ctx,
    surfaces.rawBody,
    "<FINAL_CANDIDATE_REVIEW_REPORT>",
    "</FINAL_CANDIDATE_REVIEW_REPORT>",
    file,
  );
  rejectForbiddenReportSchemaFields(ctx, reportSchemaBody, file);
  requireOperativeOrAllowlistedReportMarkers(
    ctx,
    surfaces.operativeBody,
    reportSchemaBody,
    FINAL_CANDIDATE_REVIEWER_REPORT_SCHEMA_ONLY_MARKERS,
    FINAL_CANDIDATE_REVIEWER_REQUIRED_TEXT,
    "Final candidate reviewer contract",
    file,
  );
}

function validateTroubleshooter(
  ctx: ValidationContext,
  frontmatter: FrontmatterMap,
  surfaces: AgentModelFacingSurfaces,
  file: string,
): void {
  if (frontmatter.get("permission") !== TROUBLESHOOTER_PERMISSION) {
    ctx.addError(`Troubleshooter must set permission: ${TROUBLESHOOTER_PERMISSION}: ${file}`);
  }
  for (const [key, value] of frontmatter) {
    if (key.startsWith("permission.")) {
      ctx.addError(
        `Troubleshooter must use scalar permission: ${TROUBLESHOOTER_PERMISSION}, not '${key.replace("permission.", "")}: ${String(value)}': ${file}`,
      );
    }
  }
  const reportSchemaBody = requireExactReportSchemaBody(
    ctx,
    surfaces.rawBody,
    "<TROUBLESHOOTER_REPORT>",
    "</TROUBLESHOOTER_REPORT>",
    file,
  );
  requireOperativeOrAllowlistedReportMarkers(
    ctx,
    surfaces.operativeBody,
    reportSchemaBody,
    TROUBLESHOOTER_REPORT_SCHEMA_ONLY_MARKERS,
    TROUBLESHOOTER_REQUIRED_TEXT,
    "Troubleshooter contract",
    file,
  );
}

function validateLeafReviewerSharedEffectiveModelContract(
  ctx: ValidationContext,
  root: string,
): void {
  const file = path.join(root, ...LEAF_REVIEWER_AGENT_CONTRACT_RELATIVE_PATH.split("/"));
  let text: string;
  try {
    text = readText(file);
  } catch {
    ctx.addError(`Missing shared leaf reviewer contract: ${file}`);
    return;
  }
  for (const marker of LEAF_REVIEWER_SHARED_EFFECTIVE_MODEL_REQUIRED_TEXT) {
    requireTextContains(
      ctx,
      text,
      marker,
      "shared leaf-reviewer Effective Model output contract",
      file,
    );
  }
}

export function validateAgents(ctx: ValidationContext, root: string): string[] {
  const agentsDir = path.join(root, "global", "agents");
  if (!directoryExists(agentsDir)) {
    ctx.addError(`Missing agents directory: ${agentsDir}`);
    return [];
  }

  validateLeafReviewerSharedEffectiveModelContract(ctx, root);

  const agentNames: string[] = [];
  for (const file of listFiles(agentsDir, ".md")) {
    const agentName = path.basename(file, ".md");
    const agentFileName = path.basename(file);
    const text = readText(file);
    const frontmatter = getFrontmatterMap(ctx, text, file);
    agentNames.push(agentName);
    const description = getRequiredScalar(ctx, frontmatter, "description", file);
    const mode = getRequiredScalar(ctx, frontmatter, "mode", file);
    if (!description || description.trim() === "") {
      ctx.addError(`Missing agent description: ${file}`);
    }
    if (mode !== "subagent") {
      ctx.addError(`Reusable reviewer agent must use mode: subagent: ${file}`);
    }
    for (const inheritedField of ["model", "variant"]) {
      if (frontmatter.has(inheritedField)) {
        ctx.addError(
          `Reusable agent must inherit the invoking primary model; remove frontmatter '${inheritedField}': ${file}`,
        );
      }
    }
    const allowsAllPermissions = frontmatter.get("permission") === "allow";
    if (agentFileName !== SESSION_COMPLETION_ARBITER_FILE && !allowsAllPermissions) {
      for (const permission of ["read", "glob", "grep"]) {
        const key = `permission.${permission}`;
        if (frontmatter.get(key) !== "allow") {
          ctx.addError(`Agent permission must set ${permission}: allow: ${file}`);
        }
      }
    }
    for (const obsolete of REVIEWER_OBSOLETE_PERMISSION_KEYS) {
      const key = `permission.${obsolete}`;
      if (frontmatter.has(key)) {
        ctx.addError(
          `Agent permission must not set obsolete permission.${obsolete}; directory listing is covered by read: ${file}`,
        );
      }
    }
    validateSessionDeliveryContextPermission(ctx, frontmatter, file);
    // Model-facing body surface: exclude frontmatter, supported fences, indented code.
    // Unsupported fence syntax fails closed once; skip remaining body checks on this file.
    const surfaces = readAgentModelFacingSurfaces(ctx, text, file);
    if (agentFileName === IMPLEMENTATION_WORKER_FILE) {
      if (surfaces != null) {
        validateImplementationWorker(ctx, frontmatter, surfaces, file);
      }
      continue;
    }
    if (agentFileName === TROUBLESHOOTER_FILE) {
      if (surfaces != null) {
        validateTroubleshooter(ctx, frontmatter, surfaces, file);
      }
      continue;
    }
    // Write-capable SDET must use dedicated contract before generic read-only reviewer rules.
    if (agentFileName === SDET_QUALITY_ENGINEER_FILE) {
      if (surfaces != null) {
        validateSdetQualityEngineer(ctx, frontmatter, surfaces, file);
      }
      continue;
    }
    if (agentFileName === SESSION_COMPLETION_ARBITER_FILE) {
      if (surfaces != null) {
        validateSessionCompletionArbiter(ctx, frontmatter, surfaces, file);
      }
      continue;
    }
    if (agentFileName === SPECIALIST_TEAM_ADVISOR_FILE) {
      if (surfaces != null) {
        validateSpecialistTeamAdvisor(ctx, frontmatter, surfaces, file);
      }
      continue;
    }
    validateReviewerBashPermission(ctx, frontmatter, file);
    validateReviewerFeedbackEditPermission(ctx, frontmatter, file);
    validateComplainSkillPermission(ctx, frontmatter, file, "Agent permission");
    for (const permission of REVIEWER_DENIED_PERMISSION_KEYS) {
      const key = `permission.${permission}`;
      if (frontmatter.get(key) !== "deny") {
        ctx.addError(`Agent permission must set ${permission}: deny: ${file}`);
      }
    }
    if (surfaces == null) {
      continue;
    }
    if (agentFileName === FINAL_CANDIDATE_REVIEWER_FILE) {
      // Final reviewer keeps generic reviewer permissions + Contract Reference path,
      // but uses its dedicated structured-report text (not the shared Findings boilerplate).
      validateFinalCandidateReviewerExtras(ctx, frontmatter, surfaces, file);
      // Structural Contract Reference gate keeps its dedicated full-text scanner.
      validateStandaloneContractReference(ctx, text, file);
    } else if (
      (REVIEW_DELIVERY_AGENT_FILES as readonly string[]).includes(agentFileName)
    ) {
      for (const required of REUSABLE_REVIEWER_LEAF_CONTRACT_TEXT) {
        requireTextContains(
          ctx,
          surfaces.operativeBody,
          required,
          "Reusable reviewer leaf contract",
          file,
        );
      }
      if ((PREVENTION_FEEDBACK_REVIEWER_FILES as readonly string[]).includes(agentFileName)) {
        validateStandaloneContractReference(ctx, text, file);
      }
      if (agentFileName === CODE_QUALITY_REVIEWER_FILE) {
        for (const required of CODE_QUALITY_REVIEWER_REQUIRED_TEXT) {
          requireTextContains(
            ctx,
            surfaces.operativeBody,
            required,
            "Code quality reduction-only contract",
            file,
          );
        }
      }
      if (agentFileName === IMPLEMENTATION_READINESS_REVIEWER_FILE) {
        for (const required of IMPLEMENTATION_READINESS_REVIEWER_REQUIRED_TEXT) {
          requireTextContains(
            ctx,
            surfaces.operativeBody,
            required,
            "Implementation readiness bounded-falsification contract",
            file,
          );
        }
      }
    }
    if (
      REUSABLE_REVIEWER_FORBIDDEN_BOILERPLATE.some((pattern) =>
        pattern.test(surfaces.operativeBody),
      )
    ) {
      ctx.addError(
        `Reusable reviewer agent must use the compact Leaf Contract instead of old boilerplate: ${file}`,
      );
    }
    if (
      REUSABLE_REVIEWER_FORBIDDEN_INLINE_BLOCKS.some((pattern) =>
        pattern.test(surfaces.operativeBody),
      )
    ) {
      ctx.addError(
        `Reusable reviewer agent must reference the shared contract via ## Contract Reference, not inline the Leaf Contract, Feedback Ledger, or Prevention Feedback body: ${file}`,
      );
    }
    validateTextContracts(ctx, file, surfaces.operativeBody, AGENT_TEXT_CONTRACTS);
  }

  return agentNames;
}
