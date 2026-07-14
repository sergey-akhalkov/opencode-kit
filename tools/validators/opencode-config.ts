import path from "node:path";
import { parse as jsoncParse } from "jsonc-parser";
import type { ValidationContext } from "./context.ts";
import {
  isPlainRecord,
  readText,
  walkRepositoryFiles,
} from "./context.ts";

const mutationCapablePermissionKeys = new Set([
  "bash",
  "edit",
  "task",
  "external_directory",
]);

/**
 * Stable pure inspection outcomes for OpenCode JSON/JSONC config text.
 * No IO. Callers map codes to consumer-specific diagnostics.
 */
export type OpenCodeConfigInspection =
  | { code: "parse_error"; detail: string }
  | { code: "non_object_root"; detail: string }
  | { code: "unsupported_machine_override"; detail: string; value: Record<string, unknown> }
  | { code: "valid"; value: Record<string, unknown> };

/** Platform-aware path equality for config directory / file comparisons. */
export function sameConfigPath(left: string, right: string): boolean {
  const resolvedLeft = path.resolve(left);
  const resolvedRight = path.resolve(right);
  return process.platform === "win32"
    ? resolvedLeft.toLowerCase() === resolvedRight.toLowerCase()
    : resolvedLeft === resolvedRight;
}

/**
 * Pure JSONC root-shape and machineOverride policy for OpenCode config.
 * Does not perform IO and does not validate permission policy.
 */
export function inspectOpenCodeConfigText(text: string): OpenCodeConfigInspection {
  const errors: jsoncParse.ParseError[] = [];
  let parsed: unknown;
  try {
    parsed = jsoncParse(text, errors, {
      allowTrailingComma: true,
      disallowComments: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { code: "parse_error", detail: message };
  }
  if (errors.length > 0) {
    const message = errors.map((e) => `offset ${e.offset}: ${e.error}`).join("; ");
    return { code: "parse_error", detail: message };
  }
  if (!isPlainRecord(parsed)) {
    const kind =
      parsed === null
        ? "null"
        : Array.isArray(parsed)
          ? "array"
          : typeof parsed;
    return {
      code: "non_object_root",
      detail: `root must be a plain object (got ${kind})`,
    };
  }
  if ("machineOverride" in parsed) {
    return {
      code: "unsupported_machine_override",
      detail: "unsupported field 'machineOverride'",
      value: parsed,
    };
  }
  return { code: "valid", value: parsed };
}

function validateOpenCodePermissionRules(
  ctx: ValidationContext,
  config: Record<string, unknown>,
  file: string,
  root: string,
): void {
  const isMachineLocalConfig = sameConfigPath(file, path.join(root, "global", "opencode.json"));
  const notePermission = isMachineLocalConfig
    ? (message: string): void => {
        ctx.addInfo(message);
      }
    : (message: string): void => {
        ctx.addWarning(message);
      };
  const permission = config.permission;
  if (permission === "allow") {
    notePermission(
      `OpenCode permission config uses top-level allow; this allows all tools by default: ${file}`,
    );
    return;
  }
  if (!isPlainRecord(permission)) {
    return;
  }
  if (permission["*"] === "allow") {
    notePermission(
      `OpenCode permission config permission.* uses wildcard allow; all otherwise-unmatched tools are allowed: ${file}`,
    );
  }
  for (const [permissionKey, value] of Object.entries(permission)) {
    if (!mutationCapablePermissionKeys.has(permissionKey)) {
      continue;
    }
    if (value === "allow") {
      notePermission(
        `OpenCode permission config permission.${permissionKey} uses tool-wide allow; unmatched operations are allowed: ${file}`,
      );
      continue;
    }
    if (!isPlainRecord(value)) {
      continue;
    }
    const entries = Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    );
    const wildcardAllowIndex = entries.findIndex(
      ([pattern, action]) => pattern === "*" && action === "allow",
    );
    if (wildcardAllowIndex < 0) {
      continue;
    }
    const protectiveIndex = entries.findIndex(
      ([pattern, action]) => pattern !== "*" && (action === "ask" || action === "deny"),
    );
    if (protectiveIndex < 0) {
      notePermission(
        `OpenCode permission config permission.${permissionKey} uses wildcard allow; unmatched operations are allowed: ${file}`,
      );
    } else if (wildcardAllowIndex > protectiveIndex) {
      notePermission(
        `OpenCode permission config permission.${permissionKey} places wildcard allow after narrower ask/deny rules; last matching permission rule can override protections: ${file}`,
      );
    } else {
      notePermission(
        `OpenCode permission config permission.${permissionKey} uses wildcard allow with narrower ask/deny rules; unmatched operations are allowed: ${file}`,
      );
    }
  }
}

export function validateOpenCodeConfigFiles(ctx: ValidationContext, root: string): void {
  for (const file of walkRepositoryFiles(root)) {
    if (path.basename(file) !== "opencode.json" && path.basename(file) !== "opencode.jsonc") {
      continue;
    }
    let text: string;
    try {
      text = readText(file);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.addError(`Invalid OpenCode config JSON: ${file}: ${message}`);
      continue;
    }
    const inspection = inspectOpenCodeConfigText(text);
    if (inspection.code === "parse_error") {
      ctx.addError(`Invalid OpenCode config JSON: ${file}: ${inspection.detail}`);
      continue;
    }
    if (inspection.code === "non_object_root") {
      ctx.addError(`Invalid OpenCode config root: ${file}: ${inspection.detail}`);
      continue;
    }
    if (inspection.code === "unsupported_machine_override") {
      ctx.addError(
        `Unsupported OpenCode config field 'machineOverride' can prevent OpenCode startup; remove it: ${file}`,
      );
      validateOpenCodePermissionRules(ctx, inspection.value, file, root);
      continue;
    }
    validateOpenCodePermissionRules(ctx, inspection.value, file, root);
  }
}
