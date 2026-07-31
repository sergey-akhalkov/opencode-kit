import path from "node:path";

import {
  ENGINEERING_QUALITY_SURFACES,
  GLOBAL_ENGINEERING_QUALITY_MARKERS,
} from "../contracts/engineering-quality.ts";
import type { ValidationContext } from "./context.ts";
import { fileExists, readText, requireTextContains } from "./context.ts";
import { scanOperativeTextOutsideFences } from "./active-authority.ts";

function operativeText(text: string): { text: string } | { problem: string } {
  const scan = scanOperativeTextOutsideFences(text);
  if (scan.unsupportedFenceLine != null) {
    return { problem: `unsupported non-top-level fenced-code syntax at line ${scan.unsupportedFenceLine}` };
  }
  return { text: scan.operativeText };
}

export function engineeringQualityAuthorityProblem(text: string): string | null {
  const operative = operativeText(text);
  if ("problem" in operative) {
    return `AGENTS.md architecture/diagnostic authority contains ${operative.problem}`;
  }
  for (const marker of GLOBAL_ENGINEERING_QUALITY_MARKERS) {
    if (!operative.text.includes(marker)) {
      return `AGENTS.md missing architecture/diagnostic authority marker: ${marker}`;
    }
  }
  return null;
}

export function validateEngineeringQualityContracts(
  ctx: ValidationContext,
  root: string,
): void {
  const globalAgents = path.join(root, "global", "AGENTS.md");
  const canonicalSkill = path.join(root, "global", "skills", "change-ready-sdlc", "SKILL.md");
  if (!fileExists(globalAgents) || !fileExists(canonicalSkill)) {
    return;
  }

  const globalProblem = engineeringQualityAuthorityProblem(readText(globalAgents));
  if (globalProblem != null) {
    ctx.addError(`${globalProblem}: ${globalAgents}`);
  }

  for (const surface of ENGINEERING_QUALITY_SURFACES) {
    const file = path.join(root, ...surface.relative.split("/"));
    if (!fileExists(file)) {
      continue;
    }
    const operative = operativeText(readText(file));
    if ("problem" in operative) {
      ctx.addError(`${surface.relative} architecture/diagnostic contract contains ${operative.problem}: ${file}`);
      continue;
    }
    for (const marker of surface.markers) {
      requireTextContains(ctx, operative.text, marker, "architecture/diagnostic contract", file);
    }
  }
}
