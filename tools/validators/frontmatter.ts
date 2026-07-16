import { z } from "zod";
import * as yaml from "js-yaml";
import type { FrontmatterMap, FrontmatterValue, ValidationContext } from "./context.ts";

const FrontmatterScalarSchema = z.string();

function addError(ctx: ValidationContext, message: string): void {
  ctx.addError(message);
}

function flattenYamlMap(
  source: Record<string, unknown>,
  prefix: string,
  target: FrontmatterMap,
  ctx: ValidationContext,
  file: string,
): void {
  for (const [key, value] of Object.entries(source)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value == null) {
      continue;
    }
    if (typeof value === "object" && !Array.isArray(value)) {
      target.set(fullKey, {});
      flattenYamlMap(value as Record<string, unknown>, fullKey, target, ctx, file);
      continue;
    }
    if (Array.isArray(value)) {
      addError(
        ctx,
        `Frontmatter list value not supported for '${fullKey}': ${file}. Use a scalar string.`,
      );
      continue;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      target.set(fullKey, String(value));
      continue;
    }
    if (typeof value !== "string") {
      addError(
        ctx,
        `Frontmatter value must be a string for '${fullKey}': ${file}`,
      );
      continue;
    }
    const result = FrontmatterScalarSchema.safeParse(value);
    if (!result.success) {
      addError(ctx, `Frontmatter scalar validation failed for '${fullKey}': ${file}`);
      continue;
    }
    target.set(fullKey, result.data as FrontmatterValue);
  }
}

export function getFrontmatterMap(
  ctx: ValidationContext,
  text: string,
  file: string,
): FrontmatterMap {
  const match = text.match(/^---\r?\n(?<body>[\s\S]*?)\r?\n---(?:\r?\n|$)/);
  const values: FrontmatterMap = new Map();
  if (!match?.groups?.body) {
    addError(ctx, `Missing leading frontmatter block: ${file}`);
    return values;
  }

  let parsed: unknown;
  try {
    parsed = yaml.load(match.groups.body);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    addError(ctx, `Invalid YAML frontmatter: ${file}: ${message}`);
    return values;
  }

  if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
    addError(ctx, `Frontmatter must be a YAML mapping: ${file}`);
    return values;
  }

  flattenYamlMap(parsed as Record<string, unknown>, "", values, ctx, file);
  return values;
}

/**
 * Side-effect-free read of a nested string from leading YAML frontmatter.
 * Requires an actual parent mapping and child property; literal dotted top-level
 * keys (e.g. `metadata.generatedBy`) do not match. Emits no diagnostics.
 */
export function getNestedFrontmatterString(
  text: string,
  parentKey: string,
  childKey: string,
): string | null {
  const match = text.match(/^---\r?\n(?<body>[\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match?.groups?.body) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = yaml.load(match.groups.body);
  } catch {
    return null;
  }

  if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  const root = parsed as Record<string, unknown>;
  const parent = root[parentKey];
  if (parent == null || typeof parent !== "object" || Array.isArray(parent)) {
    return null;
  }

  const child = (parent as Record<string, unknown>)[childKey];
  if (typeof child !== "string") {
    return null;
  }

  const trimmed = child.trim();
  return trimmed !== "" ? trimmed : null;
}
