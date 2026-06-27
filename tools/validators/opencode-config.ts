import path from "node:path";
import { parse as jsoncParse } from "jsonc-parser";
import type { ValidationContext } from "./context.ts";
import {
  hasMachineOverride,
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

function validateOpenCodePermissionRules(
  ctx: ValidationContext,
  config: unknown,
  file: string,
): void {
  if (!isPlainRecord(config)) {
    return;
  }
  const machineOverride = hasMachineOverride(config);
  const notePermission = machineOverride
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
    let parsed: unknown;
    try {
      const errors: jsoncParse.ParseError[] = [];
      parsed = jsoncParse(readText(file), errors, {
        allowTrailingComma: true,
        disallowComments: false,
      });
      if (errors.length > 0) {
        const message = errors.map((e) => `offset ${e.offset}: ${e.error}`).join("; ");
        ctx.addError(`Invalid OpenCode config JSON: ${file}: ${message}`);
        continue;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.addError(`Invalid OpenCode config JSON: ${file}: ${message}`);
      continue;
    }
    validateOpenCodePermissionRules(ctx, parsed, file);
  }
}
