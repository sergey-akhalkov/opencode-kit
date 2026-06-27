import path from "node:path";
import {
  IMPLEMENTATION_WORKER_HANDOFF_FIELDS,
  IMPLEMENTATION_WORKER_ROUTING_REQUIRED_TEXT,
} from "../contracts/implementation-worker.ts";
import { SESSION_DELIVERY_BINDING_HANDOFF_TOKENS } from "../contracts/reviewer-binding.ts";
import type { ValidationContext } from "./context.ts";
import { fileExists, readText, requireTextContains } from "./context.ts";

export function validateImplementationWorkerRouting(
  ctx: ValidationContext,
  root: string,
  agentNames: string[],
): void {
  if (!agentNames.includes("implementation-worker")) {
    return;
  }

  for (const relative of [
    "REPO_AGENTS.md",
    "global/AGENTS.md",
    "instructions/reusable-project-agent-instructions.md",
    "templates/project/AGENTS.md",
  ]) {
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

  const orchestratorPath = path.join(root, "global", "skills", "orchestrator", "SKILL.md");
  if (fileExists(orchestratorPath)) {
    const text = readText(orchestratorPath);
    requireTextContains(
      ctx,
      text,
      "implementation-worker",
      "orchestrator implementation-worker routing",
      orchestratorPath,
    );
    requireTextContains(
      ctx,
      text,
      "IMPLEMENTATION_WORKER_REPORT",
      "orchestrator implementation-worker report contract",
      orchestratorPath,
    );
    requireTextContains(
      ctx,
      text,
      "Run",
      "orchestrator implementation-worker report contract",
      orchestratorPath,
    );
    requireTextContains(
      ctx,
      text,
      "Worker",
      "orchestrator implementation-worker report contract",
      orchestratorPath,
    );
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

  for (const relative of [
    "REPO_AGENTS.md",
    "global/AGENTS.md",
    "instructions/reusable-project-agent-instructions.md",
    "instructions/universal-development-loop.md",
    "templates/project/AGENTS.md",
  ]) {
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
}
