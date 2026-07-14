import path from "node:path";
import {
  ALLOWED_COMPLAIN_SKILL_RULES,
  ALLOWED_REVIEWER_BASH_RULES,
  ALLOWED_REVIEWER_EDIT_RULES,
  FINAL_CANDIDATE_REVIEWER_FILE,
  FINAL_CANDIDATE_REVIEWER_REQUIRED_TEXT,
  REUSABLE_REVIEWER_FORBIDDEN_BOILERPLATE,
  REUSABLE_REVIEWER_FORBIDDEN_INLINE_BLOCKS,
  REUSABLE_REVIEWER_LEAF_CONTRACT_TEXT,
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
  ALLOWED_TROUBLESHOOTER_BASH_RULES,
  ALLOWED_TROUBLESHOOTER_EDIT_RULES,
  TROUBLESHOOTER_ALLOWED_PERMISSION_KEYS,
  TROUBLESHOOTER_DENIED_PERMISSION_KEYS,
  TROUBLESHOOTER_FILE,
  TROUBLESHOOTER_REQUIRED_TEXT,
} from "../contracts/troubleshooter.ts";
import { fencedCodeLineMask } from "./active-authority.ts";
import type { FrontmatterMap, ValidationContext } from "./context.ts";
import {
  directoryExists,
  fileExists,
  getRequiredScalar,
  listFiles,
  readText,
  requireTextContains,
  validateTextContracts,
} from "./context.ts";
import { getFrontmatterMap } from "./frontmatter.ts";

const DREAM_TEAM_RUNTIME_AGENT_PREFIX = "dream-team-";
const DREAM_TEAM_IMPLEMENTER_AGENT = "dream-team-implementer";

function isDreamTeamRuntimeAgent(agentName: string, frontmatter: FrontmatterMap): boolean {
  return agentName.startsWith(DREAM_TEAM_RUNTIME_AGENT_PREFIX) && frontmatter.get("hidden") === "true";
}

function validateDreamTeamRuntimeAgent(
  ctx: ValidationContext,
  frontmatter: FrontmatterMap,
  file: string,
): void {
  if (frontmatter.get("permission.dream_team_*") !== "deny") {
    ctx.addError(`Dream Team runtime agent must deny dream_team_* tools: ${file}`);
  }
}

function validateDreamTeamImplementer(
  ctx: ValidationContext,
  frontmatter: FrontmatterMap,
  file: string,
): void {
  if (frontmatter.get("permission.bash") !== "deny") {
    ctx.addError(`Dream Team implementer must set bash: deny: ${file}`);
  }
  if (frontmatter.get("permission.edit") !== "allow") {
    ctx.addError(`Dream Team implementer must set edit: allow: ${file}`);
  }
  if (frontmatter.get("permission.skill") !== "deny") {
    ctx.addError(`Dream Team implementer must set skill: deny: ${file}`);
  }
  for (const permission of IMPLEMENTATION_WORKER_DENIED_PERMISSION_KEYS) {
    const key = `permission.${permission}`;
    if (frontmatter.get(key) !== "deny") {
      ctx.addError(`Dream Team implementer must set ${permission}: deny: ${file}`);
    }
  }
  validateDreamTeamRuntimeAgent(ctx, frontmatter, file);
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
  const isSessionDeliveryReviewer = path.basename(file) === "session-delivery-reviewer.md";
  if (
    isSessionDeliveryReviewer &&
    frontmatter.get("permission.session_delivery_context") !== "allow"
  ) {
    ctx.addError(
      `session-delivery-reviewer must allow session_delivery_context custom tool: ${file}`,
    );
  }
  if (!isSessionDeliveryReviewer && frontmatter.has("permission.session_delivery_context")) {
    ctx.addError(
      `Only session-delivery-reviewer may set session_delivery_context permission: ${file}`,
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
  text: string,
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
  for (const required of IMPLEMENTATION_WORKER_REQUIRED_TEXT) {
    requireTextContains(ctx, text, required, "Implementation worker contract", file);
  }
}

function validateSdetQualityEngineer(
  ctx: ValidationContext,
  frontmatter: FrontmatterMap,
  text: string,
  file: string,
): void {
  if (frontmatter.has("model") || frontmatter.has("variant")) {
    ctx.addError(
      `SDET quality engineer must not set model or variant (inherit session model): ${file}`,
    );
  }
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
  for (const required of SDET_QUALITY_ENGINEER_REQUIRED_TEXT) {
    requireTextContains(ctx, text, required, "SDET quality engineer contract", file);
  }
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
  text: string,
  file: string,
): void {
  if (frontmatter.has("model") || frontmatter.has("variant")) {
    ctx.addError(
      `Final candidate reviewer must not set model or variant (inherit session model): ${file}`,
    );
  }
  for (const required of FINAL_CANDIDATE_REVIEWER_REQUIRED_TEXT) {
    requireTextContains(ctx, text, required, "Final candidate reviewer contract", file);
  }
}

function validateTroubleshooterRuleMap(
  ctx: ValidationContext,
  frontmatter: FrontmatterMap,
  file: string,
  permission: "bash" | "edit",
  rules: ReadonlyMap<string, string>,
): void {
  for (const [key, expected] of rules) {
    if (frontmatter.get(key) !== expected) {
      ctx.addError(
        `Troubleshooter must set ${key.replace("permission.", "")}: ${expected}: ${file}`,
      );
    }
  }
  for (const [key, value] of frontmatter) {
    if (key.startsWith(`permission.${permission}.`) && !rules.has(key)) {
      ctx.addError(
        `Troubleshooter has unsupported ${permission} permission '${key.replace(`permission.${permission}.`, "")}: ${String(value)}': ${file}`,
      );
    }
  }
  const permissionKey = `permission.${permission}`;
  if (frontmatter.has(permissionKey) && typeof frontmatter.get(permissionKey) !== "object") {
    ctx.addError(
      `Troubleshooter must use scoped ${permission} permissions, not ${permission}: ${String(frontmatter.get(permissionKey))}: ${file}`,
    );
  }
  const actualRuleKeys = [...frontmatter.keys()].filter((key) =>
    key.startsWith(`permission.${permission}.`),
  );
  const expectedRuleKeys = [...rules.keys()];
  if (
    actualRuleKeys.length !== expectedRuleKeys.length ||
    actualRuleKeys.some((key, index) => key !== expectedRuleKeys[index])
  ) {
    ctx.addError(
      `Troubleshooter ${permission} permission rule order drifted; reorder rules to match the contract because OpenCode resolves rules last-match-wins: ${file}`,
    );
  }
}

function validateTroubleshooterSkillRuleOrder(
  ctx: ValidationContext,
  frontmatter: FrontmatterMap,
  file: string,
): void {
  const actualRuleKeys = [...frontmatter.keys()].filter((key) =>
    key.startsWith("permission.skill."),
  );
  const expectedRuleKeys = ["permission.skill.*", "permission.skill.complain"];
  if (
    actualRuleKeys.length !== expectedRuleKeys.length ||
    actualRuleKeys.some((key, index) => key !== expectedRuleKeys[index])
  ) {
    ctx.addError(
      `Troubleshooter skill permission rule order drifted; place permission.skill.* before permission.skill.complain because OpenCode resolves rules last-match-wins: ${file}`,
    );
  }
}

function validateTroubleshooter(
  ctx: ValidationContext,
  frontmatter: FrontmatterMap,
  text: string,
  file: string,
): void {
  if (frontmatter.get("model") !== "openai/gpt-5.6-sol") {
    ctx.addError(`Troubleshooter must use model: openai/gpt-5.6-sol: ${file}`);
  }
  if (frontmatter.get("variant") !== "xhigh") {
    ctx.addError(`Troubleshooter must use variant: xhigh: ${file}`);
  }
  validateTroubleshooterRuleMap(ctx, frontmatter, file, "bash", ALLOWED_TROUBLESHOOTER_BASH_RULES);
  validateTroubleshooterRuleMap(ctx, frontmatter, file, "edit", ALLOWED_TROUBLESHOOTER_EDIT_RULES);
  validateComplainSkillPermission(ctx, frontmatter, file, "Troubleshooter");
  validateTroubleshooterSkillRuleOrder(ctx, frontmatter, file);
  const allowedTopLevelPermissions = new Set([
    "permission.read",
    "permission.glob",
    "permission.grep",
    "permission.bash",
    "permission.edit",
    "permission.skill",
    ...TROUBLESHOOTER_ALLOWED_PERMISSION_KEYS.keys(),
    ...TROUBLESHOOTER_DENIED_PERMISSION_KEYS.map((permission) => `permission.${permission}`),
  ]);
  for (const [key, value] of frontmatter) {
    if (
      key.startsWith("permission.") &&
      !key.startsWith("permission.bash.") &&
      !key.startsWith("permission.edit.") &&
      !key.startsWith("permission.skill.") &&
      !allowedTopLevelPermissions.has(key)
    ) {
      ctx.addError(
        `Troubleshooter has unsupported permission '${key.replace("permission.", "")}: ${String(value)}': ${file}`,
      );
    }
  }
  for (const [key, expected] of TROUBLESHOOTER_ALLOWED_PERMISSION_KEYS) {
    if (frontmatter.get(key) !== expected) {
      ctx.addError(`Troubleshooter must set ${key.replace("permission.", "")}: ${expected}: ${file}`);
    }
  }
  for (const permission of TROUBLESHOOTER_DENIED_PERMISSION_KEYS) {
    const key = `permission.${permission}`;
    if (frontmatter.get(key) !== "deny") {
      ctx.addError(`Troubleshooter must set ${permission}: deny: ${file}`);
    }
  }
  for (const required of TROUBLESHOOTER_REQUIRED_TEXT) {
    requireTextContains(ctx, text, required, "Troubleshooter contract", file);
  }
}

export function validateAgents(ctx: ValidationContext, root: string): string[] {
  const agentsDir = path.join(root, "global", "agents");
  if (!directoryExists(agentsDir)) {
    ctx.addError(`Missing agents directory: ${agentsDir}`);
    return [];
  }

  const agentNames: string[] = [];
  for (const file of listFiles(agentsDir, ".md")) {
    const agentName = path.basename(file, ".md");
    const text = readText(file);
    const frontmatter = getFrontmatterMap(ctx, text, file);
    const isDreamTeamRuntime = isDreamTeamRuntimeAgent(agentName, frontmatter);
    if (!isDreamTeamRuntime) agentNames.push(agentName);
    const description = getRequiredScalar(ctx, frontmatter, "description", file);
    const mode = getRequiredScalar(ctx, frontmatter, "mode", file);
    if (!description || description.trim() === "") {
      ctx.addError(`Missing agent description: ${file}`);
    }
    if (mode !== "subagent") {
      ctx.addError(`Reusable reviewer agent must use mode: subagent: ${file}`);
    }
    for (const permission of ["read", "glob", "grep"]) {
      const key = `permission.${permission}`;
      if (frontmatter.get(key) !== "allow") {
        ctx.addError(`Agent permission must set ${permission}: allow: ${file}`);
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
    const agentFileName = path.basename(file);
    if (agentFileName === IMPLEMENTATION_WORKER_FILE) {
      validateImplementationWorker(ctx, frontmatter, text, file);
      continue;
    }
    if (agentFileName === TROUBLESHOOTER_FILE) {
      validateTroubleshooter(ctx, frontmatter, text, file);
      continue;
    }
    if (isDreamTeamRuntime && agentName === DREAM_TEAM_IMPLEMENTER_AGENT) {
      validateDreamTeamImplementer(ctx, frontmatter, file);
      continue;
    }
    // Write-capable SDET must use dedicated contract before generic read-only reviewer rules.
    if (agentFileName === SDET_QUALITY_ENGINEER_FILE) {
      validateSdetQualityEngineer(ctx, frontmatter, text, file);
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
    if (isDreamTeamRuntime) {
      validateDreamTeamRuntimeAgent(ctx, frontmatter, file);
      continue;
    }
    if (agentFileName === FINAL_CANDIDATE_REVIEWER_FILE) {
      // Final reviewer keeps generic reviewer permissions + Contract Reference path,
      // but uses its dedicated structured-report text (not the shared Findings boilerplate).
      validateFinalCandidateReviewerExtras(ctx, frontmatter, text, file);
      validateStandaloneContractReference(ctx, text, file);
    } else {
      for (const required of REUSABLE_REVIEWER_LEAF_CONTRACT_TEXT) {
        requireTextContains(ctx, text, required, "Reusable reviewer leaf contract", file);
      }
      if ((PREVENTION_FEEDBACK_REVIEWER_FILES as readonly string[]).includes(agentFileName)) {
        validateStandaloneContractReference(ctx, text, file);
      }
    }
    if (REUSABLE_REVIEWER_FORBIDDEN_BOILERPLATE.some((pattern) => pattern.test(text))) {
      ctx.addError(
        `Reusable reviewer agent must use the compact Leaf Contract instead of old boilerplate: ${file}`,
      );
    }
    if (REUSABLE_REVIEWER_FORBIDDEN_INLINE_BLOCKS.some((pattern) => pattern.test(text))) {
      ctx.addError(
        `Reusable reviewer agent must reference the shared contract via ## Contract Reference, not inline the Leaf Contract, Feedback Ledger, or Prevention Feedback body: ${file}`,
      );
    }
    validateTextContracts(ctx, file, text, AGENT_TEXT_CONTRACTS);
  }

  return agentNames;
}
