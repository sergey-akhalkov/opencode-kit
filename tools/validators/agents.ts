import path from "node:path";
import {
  ALLOWED_COMPLAIN_SKILL_RULES,
  ALLOWED_REVIEWER_BASH_RULES,
  ALLOWED_REVIEWER_EDIT_RULES,
  REUSABLE_REVIEWER_FORBIDDEN_BOILERPLATE,
  REUSABLE_REVIEWER_FORBIDDEN_INLINE_BLOCKS,
  REUSABLE_REVIEWER_LEAF_CONTRACT_TEXT,
  REVIEWER_DENIED_PERMISSION_KEYS,
  REVIEWER_OBSOLETE_PERMISSION_KEYS,
} from "../contracts/agents.ts";
import { AGENT_TEXT_CONTRACTS } from "../contracts/reviewer-binding.ts";
import {
  ALLOWED_IMPLEMENTATION_WORKER_BASH_RULES,
  IMPLEMENTATION_WORKER_DENIED_PERMISSION_KEYS,
  IMPLEMENTATION_WORKER_FILE,
  IMPLEMENTATION_WORKER_REQUIRED_TEXT,
} from "../contracts/implementation-worker.ts";
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
    if (path.basename(file) === IMPLEMENTATION_WORKER_FILE) {
      validateImplementationWorker(ctx, frontmatter, text, file);
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
    for (const required of REUSABLE_REVIEWER_LEAF_CONTRACT_TEXT) {
      requireTextContains(ctx, text, required, "Reusable reviewer leaf contract", file);
    }
    if (REUSABLE_REVIEWER_FORBIDDEN_BOILERPLATE.some((pattern) => pattern.test(text))) {
      ctx.addError(
        `Reusable reviewer agent must use the compact Leaf Contract instead of old boilerplate: ${file}`,
      );
    }
    if (REUSABLE_REVIEWER_FORBIDDEN_INLINE_BLOCKS.some((pattern) => pattern.test(text))) {
      ctx.addError(
        `Reusable reviewer agent must reference the shared contract via ## Contract Reference, not inline the Leaf Contract or Prevention Feedback body: ${file}`,
      );
    }
    validateTextContracts(ctx, file, text, AGENT_TEXT_CONTRACTS);
  }

  return agentNames;
}
