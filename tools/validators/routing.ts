import path from "node:path";
import {
  IMPLEMENTATION_WORKER_CONTINUATION_REQUIRED_TEXT,
  IMPLEMENTATION_WORKER_FILE,
  IMPLEMENTATION_WORKER_HANDOFF_FIELDS,
  IMPLEMENTATION_WORKER_ROUTING_REQUIRED_TEXT,
} from "../contracts/implementation-worker.ts";
import {
  FINAL_CANDIDATE_REVIEWER_FILE,
  REVIEWER_SDET_FORBIDDEN_ACTION_FIELDS,
} from "../contracts/agents.ts";
import {
  CHANGE_READY_SDLC_DUPLICATE_MARKER_THRESHOLD,
  CHANGE_READY_SDLC_LIFECYCLE_MARKERS,
  CHANGE_READY_SDLC_OUTCOME_AUTHORITY_MARKERS,
  CHANGE_READY_SDLC_PILOT_READY_MARKERS,
  CHANGE_READY_SDLC_SKILL_RELATIVE_PATH,
  FORBIDDEN_PRODUCTION_ROUTING_PATTERNS,
  FORBIDDEN_PRODUCTION_ROUTING_SCAN_FILES,
  GLOBAL_AGENTS_FANOUT_CONTINUATION_TOKENS,
  GLOBAL_AGENTS_OUTCOME_AUTHORITY_MARKERS,
  GLOBAL_AGENTS_OUTCOME_FIRST_MARKERS,
  GLOBAL_AGENTS_TRIGGER_TOKENS,
  LIFECYCLE_ROLE_ROUTES,
  MAINTENANCE_ROUTING_FILES,
  OUTCOME_FIRST_COMPLETE_POLICY_DUPLICATE_THRESHOLD,
  OUTCOME_FIRST_COMPLETE_POLICY_MARKERS,
  OUTCOME_FIRST_ROLE_DELTA_SURFACES,
} from "../contracts/skills.ts";
import {
  MATERIAL_DELIVERY_ROUTING_SURFACES,
  MATERIAL_DELIVERY_ROUTING_TOKENS,
  OUTCOME_AUTHORITY_FORBIDDEN_PATTERNS,
  OUTCOME_AUTHORITY_SCOPE_MARKERS,
  OUTCOME_AUTHORITY_SCOPE_SURFACES,
  PREVENTION_FEEDBACK_REVIEWER_FILES,
  SESSION_DELIVERY_BINDING_HANDOFF_TOKENS,
  SESSION_DELIVERY_BINDING_SURFACES,
} from "../contracts/reviewer-binding.ts";
import { SDET_QUALITY_ENGINEER_FILE } from "../contracts/sdet-quality-engineer.ts";
import type { ValidationContext } from "./context.ts";
import {
  directoryExists,
  fileExists,
  readText,
  requireTextContains,
  toPosixPath,
  walkMarkdownFiles,
} from "./context.ts";
import {
  fencedCodeLineMask,
  isAtxH1OrH2BoundaryLine,
  scanModelFacingMarkdownBody,
  scanOperativeTextOutsideFences,
} from "./active-authority.ts";

const GLOBAL_AGENTS_RELATIVE = "global/AGENTS.md";
/** POSIX-relative prefix for role agent Markdown surfaces. */
const GLOBAL_AGENTS_DIR_PREFIX = "global/agents/";

/**
 * Exact ordered labels of the normative Universal Task Briefing Contract schema
 * (single top-level ```text block under ## Universal Task Briefing Contract in global AGENTS).
 */
const NORMATIVE_BRIEFING_SCHEMA_LABELS: readonly string[] = [
  "Role:",
  "Objective:",
  "Business/System Context:",
  "Current State and Evidence:",
  "Required Deliverables:",
  "In Scope:",
  "Out of Scope / Non-Goals:",
  "Read Scope:",
  "Write Scope:",
  "Forbidden Actions:",
  "Requirements and Invariants:",
  "Resolved Decisions and Rationale:",
  "Inputs and Source of Truth:",
  "Dependencies and Preconditions:",
  "Acceptance Criteria:",
  "Verification:",
  "Return Contract:",
  "Blocker and Escalation Policy:",
];

/**
 * Read a markdown authority surface, reject unsupported non-top-level fence syntax,
 * and return operative text only. Returns null when the file is missing or unsupported
 * (error already recorded). Never returns raw text for policy consumers.
 * Fence-only: no frontmatter strip and no indented-code exclusion (general authority).
 */
function readOperativeAuthorityText(
  ctx: ValidationContext,
  file: string,
): string | null {
  if (!fileExists(file)) {
    return null;
  }
  const scan = scanOperativeTextOutsideFences(readText(file));
  if (scan.unsupportedFenceLine != null) {
    ctx.addError(
      `unsupported non-top-level fenced-code syntax at line ${scan.unsupportedFenceLine}: ${file}`,
    );
    return null;
  }
  return scan.operativeText;
}

/** True for actual `global/agents/*.md` role files (not leaf contracts or other surfaces). */
function isGlobalRoleAgentRelative(relative: string): boolean {
  const posix = relative.replace(/\\/g, "/");
  return (
    posix.startsWith(GLOBAL_AGENTS_DIR_PREFIX) &&
    posix.endsWith(".md") &&
    !posix.slice(GLOBAL_AGENTS_DIR_PREFIX.length).includes("/")
  );
}

/**
 * Model-facing operative text for role agent Markdown: strip leading frontmatter,
 * exclude supported fences and CommonMark indented code, fail closed on unsupported
 * fence syntax with original-file line numbers. Returns null when missing/unsupported.
 */
function readModelFacingRoleAgentText(
  ctx: ValidationContext,
  file: string,
): string | null {
  if (!fileExists(file)) {
    return null;
  }
  const scan = scanModelFacingMarkdownBody(readText(file));
  if (scan.unsupportedFenceLine != null) {
    ctx.addError(
      `unsupported non-top-level fenced-code syntax at line ${scan.unsupportedFenceLine}: ${file}`,
    );
    return null;
  }
  return scan.operativeBody;
}

/**
 * Authority surface reader: role agents use model-facing boundary; all other
 * surfaces keep general fence-only semantics.
 */
function readRoutingSurfaceOperativeText(
  ctx: ValidationContext,
  root: string,
  file: string,
): string | null {
  const relative = toPosixPath(path.relative(root, file));
  if (isGlobalRoleAgentRelative(relative)) {
    return readModelFacingRoleAgentText(ctx, file);
  }
  return readOperativeAuthorityText(ctx, file);
}

/** Byte-exact normative briefing H2; whitespace/indent drift is rejected. */
const EXACT_NORMATIVE_BRIEFING_H2 = "## Universal Task Briefing Contract";
/** Byte-exact top-level opener for the normative briefing schema fence. */
const EXACT_NORMATIVE_BRIEFING_OPEN = "```text";
/** Byte-exact top-level closer for the normative briefing schema fence. */
const EXACT_NORMATIVE_BRIEFING_CLOSE = "```";

/**
 * Body of the single exact normative ```text briefing schema under
 * ## Universal Task Briefing Contract, or null when the shape is not exact.
 * Deterministic line scan only: one byte-exact H2, section ends at next unfenced
 * H1/H2, one top-level byte-exact ```text / ``` fence, 18 ordered labels with
 * no blank or extra lines, no indent/delimiter/trailing-whitespace drift.
 */
function extractExactNormativeBriefingSchemaBody(text: string): string | null {
  const lines = text.split(/\r?\n/);
  const fenced = fencedCodeLineMask(lines);

  let sectionStart = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (!fenced[i] && lines[i] === EXACT_NORMATIVE_BRIEFING_H2) {
      if (sectionStart >= 0) {
        return null;
      }
      sectionStart = i;
    }
  }
  if (sectionStart < 0) {
    return null;
  }

  // Ownership ends at the next unfenced supported ATX H1/H2 boundary
  // (0-3 leading spaces; space/tab or EOL after the hash run).
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
  if (lines[open] !== EXACT_NORMATIVE_BRIEFING_OPEN) {
    return null;
  }

  let close = open;
  while (close + 1 < sectionEnd && fenced[close + 1]) {
    close += 1;
  }
  if (close === open || lines[close] !== EXACT_NORMATIVE_BRIEFING_CLOSE) {
    return null;
  }

  // Keep every interior line (including blanks); blanks make the shape non-exact.
  const body: string[] = [];
  for (let i = open + 1; i < close; i += 1) {
    body.push(lines[i]!);
  }
  if (body.length !== NORMATIVE_BRIEFING_SCHEMA_LABELS.length) {
    return null;
  }
  for (let i = 0; i < body.length; i += 1) {
    if (body[i] !== NORMATIVE_BRIEFING_SCHEMA_LABELS[i]) {
      return null;
    }
  }
  return body.join("\n");
}

function countExactLifecycleMarkers(text: string): number {
  let count = 0;
  for (const marker of CHANGE_READY_SDLC_LIFECYCLE_MARKERS) {
    if (text.includes(marker)) {
      count += 1;
    }
  }
  return count;
}

function validateGlobalAgentsTriggerTopology(
  ctx: ValidationContext,
  root: string,
): void {
  const file = path.join(root, GLOBAL_AGENTS_RELATIVE);
  const operative = readOperativeAuthorityText(ctx, file);
  if (operative == null) {
    return;
  }
  for (const token of GLOBAL_AGENTS_TRIGGER_TOKENS) {
    requireTextContains(ctx, operative, token, "global AGENTS Change-Ready trigger", file);
  }
  for (const role of LIFECYCLE_ROLE_ROUTES) {
    requireTextContains(ctx, operative, role, "global AGENTS lifecycle role route", file);
  }
  for (const token of GLOBAL_AGENTS_FANOUT_CONTINUATION_TOKENS) {
    requireTextContains(
      ctx,
      operative,
      token,
      "global AGENTS fan-out and specialist continuation",
      file,
    );
  }
  for (const token of GLOBAL_AGENTS_OUTCOME_AUTHORITY_MARKERS) {
    requireTextContains(
      ctx,
      operative,
      token,
      "global AGENTS outcome-authority scope contract",
      file,
    );
  }
  for (const token of GLOBAL_AGENTS_OUTCOME_FIRST_MARKERS) {
    requireTextContains(
      ctx,
      operative,
      token,
      "global AGENTS outcome-first and Pilot-Ready policy",
      file,
    );
  }
}

function validateOutcomeFirstPilotReadyAuthority(ctx: ValidationContext, root: string): void {
  const skillFile = path.join(root, ...CHANGE_READY_SDLC_SKILL_RELATIVE_PATH.split("/"));
  const skillOperative = readOperativeAuthorityText(ctx, skillFile);
  if (skillOperative != null) {
    for (const token of CHANGE_READY_SDLC_PILOT_READY_MARKERS) {
      requireTextContains(
        ctx,
        skillOperative,
        token,
        "change-ready-sdlc Pilot-Ready qualification policy",
        skillFile,
      );
    }
  }

  for (const relative of OUTCOME_FIRST_ROLE_DELTA_SURFACES) {
    const file = path.join(root, relative);
    // Role agents: model-facing; skill delta surfaces remain fence-only.
    const operative = readRoutingSurfaceOperativeText(ctx, root, file);
    if (operative == null) {
      continue;
    }
    let completePolicyHits = 0;
    for (const marker of OUTCOME_FIRST_COMPLETE_POLICY_MARKERS) {
      if (operative.includes(marker)) {
        completePolicyHits += 1;
      }
    }
    if (completePolicyHits >= OUTCOME_FIRST_COMPLETE_POLICY_DUPLICATE_THRESHOLD) {
      ctx.addError(
        `outcome-first complete policy duplication: ${relative} contains ${completePolicyHits} canonical policy markers (threshold >=${OUTCOME_FIRST_COMPLETE_POLICY_DUPLICATE_THRESHOLD}); keep role-specific deltas only`,
      );
    }
  }
}

function validateOutcomeAuthorityScope(ctx: ValidationContext, root: string): void {
  const skillFile = path.join(root, ...CHANGE_READY_SDLC_SKILL_RELATIVE_PATH.split("/"));
  const skillOperative = readOperativeAuthorityText(ctx, skillFile);
  if (skillOperative != null) {
    for (const token of CHANGE_READY_SDLC_OUTCOME_AUTHORITY_MARKERS) {
      requireTextContains(
        ctx,
        skillOperative,
        token,
        "change-ready-sdlc outcome-authority scope contract",
        skillFile,
      );
    }
  }

  for (const relative of OUTCOME_AUTHORITY_SCOPE_SURFACES) {
    const file = path.join(root, relative);
    const operative = readOperativeAuthorityText(ctx, file);
    if (operative == null) {
      continue;
    }
    for (const marker of OUTCOME_AUTHORITY_SCOPE_MARKERS) {
      requireTextContains(ctx, operative, marker, "outcome-authority scope contract", file);
    }
    for (const pattern of OUTCOME_AUTHORITY_FORBIDDEN_PATTERNS) {
      if (operative.includes(pattern.needle)) {
        ctx.addError(`${pattern.diagnostic}: ${file}`);
      }
    }
  }

  const roleFiles = [
    ...PREVENTION_FEEDBACK_REVIEWER_FILES.map((name) => path.join(root, "global", "agents", name)),
    path.join(root, "global", "agents", FINAL_CANDIDATE_REVIEWER_FILE),
    path.join(root, "global", "agents", SDET_QUALITY_ENGINEER_FILE),
    path.join(root, "instructions", "leaf-reviewer-agent-contract.md"),
  ];
  for (const file of roleFiles) {
    // Role agents: model-facing (frontmatter + fence + indent). Leaf contract: fence-only.
    const operative = readRoutingSurfaceOperativeText(ctx, root, file);
    if (operative == null) {
      continue;
    }
    for (const field of REVIEWER_SDET_FORBIDDEN_ACTION_FIELDS) {
      if (operative.includes(field)) {
        ctx.addError(`superseded reviewer/SDET action-list field ${field}: ${file}`);
      }
    }
  }
}

function validateImplementationWorkerContinuation(
  ctx: ValidationContext,
  root: string,
): void {
  const file = path.join(root, "global", "agents", IMPLEMENTATION_WORKER_FILE);
  // Role agent: model-facing boundary (frontmatter + fence + indent).
  const operative = readRoutingSurfaceOperativeText(ctx, root, file);
  if (operative == null) {
    return;
  }
  for (const token of IMPLEMENTATION_WORKER_CONTINUATION_REQUIRED_TEXT) {
    requireTextContains(
      ctx,
      operative,
      token,
      "implementation-worker same-slice continuation",
      file,
    );
  }
}

function validateDuplicateLifecycleMarkers(
  ctx: ValidationContext,
  root: string,
): void {
  const globalDir = path.join(root, "global");
  if (!directoryExists(globalDir)) {
    return;
  }
  const canonicalSkill = path.join(root, ...CHANGE_READY_SDLC_SKILL_RELATIVE_PATH.split("/"));
  for (const file of walkMarkdownFiles(globalDir)) {
    if (path.resolve(file) === path.resolve(canonicalSkill)) {
      continue;
    }
    // Role agents under global/agents: model-facing; other global Markdown stays fence-only.
    const operative = readRoutingSurfaceOperativeText(ctx, root, file);
    if (operative == null) {
      continue;
    }
    const count = countExactLifecycleMarkers(operative);
    if (count >= CHANGE_READY_SDLC_DUPLICATE_MARKER_THRESHOLD) {
      const relative = toPosixPath(path.relative(root, file));
      ctx.addError(
        `Lifecycle marker drift: ${relative} contains ${count} exact D13 markers (threshold >=${CHANGE_READY_SDLC_DUPLICATE_MARKER_THRESHOLD})`,
      );
    }
  }
}

/**
 * Reject exact unsafe production-routing anti-patterns on active policy surfaces
 * (maintenance files, canonical skill, UDL, and affected role prompts).
 * Runs only when the canonical Change-Ready skill is present so generic fixtures stay clean.
 * Worker handoff-field validation still uses MAINTENANCE_ROUTING_FILES only.
 */
function validateForbiddenProductionRouting(ctx: ValidationContext, root: string): void {
  for (const relative of FORBIDDEN_PRODUCTION_ROUTING_SCAN_FILES) {
    const file = path.join(root, relative);
    // Role agents use model-facing boundary; maintenance/skill/UDL stay fence-only.
    const operative = isGlobalRoleAgentRelative(relative)
      ? readModelFacingRoleAgentText(ctx, file)
      : readOperativeAuthorityText(ctx, file);
    if (operative == null) {
      continue;
    }
    for (const pattern of FORBIDDEN_PRODUCTION_ROUTING_PATTERNS) {
      if (operative.includes(pattern.needle)) {
        // Absolute path keeps platform separators so SDET path.join assertions match.
        ctx.addError(`${pattern.diagnostic}: ${file}`);
      }
    }
  }
}

export function validateImplementationWorkerRouting(
  ctx: ValidationContext,
  root: string,
  agentNames: string[],
): void {
  // D13 topology applies only when the canonical skill is installed in this tree.
  // Generic fixtures without the skill keep unrelated validator behavior.
  const canonicalSkill = path.join(root, ...CHANGE_READY_SDLC_SKILL_RELATIVE_PATH.split("/"));
  if (fileExists(canonicalSkill)) {
    validateGlobalAgentsTriggerTopology(ctx, root);
    validateOutcomeAuthorityScope(ctx, root);
    validateOutcomeFirstPilotReadyAuthority(ctx, root);
    validateDuplicateLifecycleMarkers(ctx, root);
    validateForbiddenProductionRouting(ctx, root);
  }

  if (!agentNames.includes("implementation-worker")) {
    return;
  }

  validateImplementationWorkerContinuation(ctx, root);

  for (const relative of MAINTENANCE_ROUTING_FILES) {
    const file = path.join(root, relative);
    // Syntax gate first: unsupported non-top-level fences record an error and skip all checks.
    const operative = readOperativeAuthorityText(ctx, file);
    if (operative == null) {
      continue;
    }
    requireTextContains(
      ctx,
      operative,
      "implementation-worker",
      "implementation-worker routing",
      file,
    );
    for (const required of IMPLEMENTATION_WORKER_ROUTING_REQUIRED_TEXT) {
      if (required === "implementation-worker") continue;
      requireTextContains(ctx, operative, required, "implementation-worker routing", file);
    }
    // Handoff schema labels: operative on every surface. Only global/AGENTS.md may also
    // use the exact complete normative ```text briefing schema under the exact H2.
    let handoffSurface = operative;
    if (relative === GLOBAL_AGENTS_RELATIVE) {
      const schemaBody = extractExactNormativeBriefingSchemaBody(readText(file));
      if (schemaBody != null) {
        handoffSurface = `${operative}\n${schemaBody}`;
      }
    }
    for (const field of IMPLEMENTATION_WORKER_HANDOFF_FIELDS) {
      requireTextContains(
        ctx,
        handoffSurface,
        field,
        "implementation-worker handoff fields",
        file,
      );
    }
  }
}

export function validateSessionDeliveryBinding(
  ctx: ValidationContext,
  root: string,
  agentNames: string[],
): void {
  if (!agentNames.includes("session-delivery-reviewer")) {
    return;
  }

  for (const relative of SESSION_DELIVERY_BINDING_SURFACES) {
    const file = path.join(root, relative);
    const operative = readOperativeAuthorityText(ctx, file);
    if (operative == null) {
      continue;
    }
    requireTextContains(
      ctx,
      operative,
      "session-delivery-reviewer",
      "session-delivery-reviewer binding handoff",
      file,
    );
    for (const token of SESSION_DELIVERY_BINDING_HANDOFF_TOKENS) {
      requireTextContains(
        ctx,
        operative,
        token,
        "session-delivery-reviewer binding handoff",
        file,
      );
    }
  }

  for (const relative of MATERIAL_DELIVERY_ROUTING_SURFACES) {
    const file = path.join(root, relative);
    const operative = readOperativeAuthorityText(ctx, file);
    if (operative == null) {
      continue;
    }
    for (const token of MATERIAL_DELIVERY_ROUTING_TOKENS) {
      requireTextContains(ctx, operative, token, "Material delivery routing", file);
    }
  }
}
