import path from "node:path";
import {
  IMPLEMENTATION_WORKER_CONTINUATION_REQUIRED_TEXT,
  IMPLEMENTATION_WORKER_FILE,
  IMPLEMENTATION_WORKER_HANDOFF_FIELDS,
  IMPLEMENTATION_WORKER_ROUTING_REQUIRED_TEXT,
} from "../contracts/implementation-worker.ts";
import {
  CHANGE_READY_SDLC_DUPLICATE_MARKER_THRESHOLD,
  CHANGE_READY_SDLC_LIFECYCLE_MARKERS,
  CHANGE_READY_SDLC_SKILL_RELATIVE_PATH,
  FORBIDDEN_PRODUCTION_ROUTING_PATTERNS,
  FORBIDDEN_PRODUCTION_ROUTING_SCAN_FILES,
  GLOBAL_AGENTS_FANOUT_CONTINUATION_TOKENS,
  GLOBAL_AGENTS_TRIGGER_TOKENS,
  LIFECYCLE_ROLE_ROUTES,
  MAINTENANCE_ROUTING_FILES,
} from "../contracts/skills.ts";
import {
  MATERIAL_DELIVERY_ROUTING_SURFACES,
  MATERIAL_DELIVERY_ROUTING_TOKENS,
  SESSION_DELIVERY_BINDING_HANDOFF_TOKENS,
  SESSION_DELIVERY_BINDING_SURFACES,
} from "../contracts/reviewer-binding.ts";
import type { ValidationContext } from "./context.ts";
import {
  directoryExists,
  fileExists,
  readText,
  requireTextContains,
  toPosixPath,
  walkMarkdownFiles,
} from "./context.ts";

const GLOBAL_AGENTS_RELATIVE = "global/AGENTS.md";

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
  if (!fileExists(file)) {
    return;
  }
  const text = readText(file);
  for (const token of GLOBAL_AGENTS_TRIGGER_TOKENS) {
    requireTextContains(ctx, text, token, "global AGENTS Change-Ready trigger", file);
  }
  for (const role of LIFECYCLE_ROLE_ROUTES) {
    requireTextContains(ctx, text, role, "global AGENTS lifecycle role route", file);
  }
  for (const token of GLOBAL_AGENTS_FANOUT_CONTINUATION_TOKENS) {
    requireTextContains(
      ctx,
      text,
      token,
      "global AGENTS fan-out and specialist continuation",
      file,
    );
  }
}

function validateImplementationWorkerContinuation(
  ctx: ValidationContext,
  root: string,
): void {
  const file = path.join(root, "global", "agents", IMPLEMENTATION_WORKER_FILE);
  if (!fileExists(file)) {
    return;
  }
  const text = readText(file);
  for (const token of IMPLEMENTATION_WORKER_CONTINUATION_REQUIRED_TEXT) {
    requireTextContains(
      ctx,
      text,
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
    const text = readText(file);
    const count = countExactLifecycleMarkers(text);
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
    if (!fileExists(file)) {
      continue;
    }
    const text = readText(file);
    for (const pattern of FORBIDDEN_PRODUCTION_ROUTING_PATTERNS) {
      if (text.includes(pattern.needle)) {
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
    validateDuplicateLifecycleMarkers(ctx, root);
    validateForbiddenProductionRouting(ctx, root);
  }

  if (!agentNames.includes("implementation-worker")) {
    return;
  }

  validateImplementationWorkerContinuation(ctx, root);

  for (const relative of MAINTENANCE_ROUTING_FILES) {
    const file = path.join(root, relative);
    if (!fileExists(file)) {
      continue;
    }
    const text = readText(file);
    requireTextContains(ctx, text, "implementation-worker", "implementation-worker routing", file);
    for (const required of IMPLEMENTATION_WORKER_ROUTING_REQUIRED_TEXT) {
      if (required === "implementation-worker") continue;
      requireTextContains(ctx, text, required, "implementation-worker routing", file);
    }
    for (const field of IMPLEMENTATION_WORKER_HANDOFF_FIELDS) {
      requireTextContains(ctx, text, field, "implementation-worker handoff fields", file);
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
    if (!fileExists(file)) {
      continue;
    }
    const text = readText(file);
    requireTextContains(
      ctx,
      text,
      "session-delivery-reviewer",
      "session-delivery-reviewer binding handoff",
      file,
    );
    for (const token of SESSION_DELIVERY_BINDING_HANDOFF_TOKENS) {
      requireTextContains(ctx, text, token, "session-delivery-reviewer binding handoff", file);
    }
  }

  for (const relative of MATERIAL_DELIVERY_ROUTING_SURFACES) {
    const file = path.join(root, relative);
    if (!fileExists(file)) {
      continue;
    }
    const text = readText(file);
    for (const token of MATERIAL_DELIVERY_ROUTING_TOKENS) {
      requireTextContains(ctx, text, token, "Material delivery routing", file);
    }
  }
}
