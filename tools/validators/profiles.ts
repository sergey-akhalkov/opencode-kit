import path from "node:path";
import type { ValidationContext } from "./context.ts";
import { directoryExists } from "./context.ts";
import {
  inspectRuntimeSurfaceProfiles,
  listCommandNames,
} from "../runtime-surface-profile.ts";

export function validateStringArray(
  ctx: ValidationContext,
  value: unknown,
  file: string,
  key: string,
): string[] {
  if (value == null) {
    return [];
  }
  if (
    !Array.isArray(value) ||
    value.some((item) => typeof item !== "string" || item.trim() === "")
  ) {
    ctx.addError(`Profile field '${key}' must be an array of non-empty strings: ${file}`);
    return [];
  }
  return value;
}

export function findDuplicateStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }
  return [...duplicates].sort((left, right) => left.localeCompare(right));
}

export function validateProfiles(
  ctx: ValidationContext,
  root: string,
  skillNames: string[],
  agentNames: string[],
): void {
  const profilesDir = path.join(root, "profiles");
  if (!directoryExists(profilesDir)) {
    return;
  }
  const inspection = inspectRuntimeSurfaceProfiles(
    root,
    skillNames,
    agentNames,
    listCommandNames(root),
  );
  for (const error of inspection.errors) {
    ctx.addError(error);
  }
}
