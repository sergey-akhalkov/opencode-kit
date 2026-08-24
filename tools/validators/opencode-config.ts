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
  const isIntentionalGlobalConfig =
    sameConfigPath(file, path.join(root, "global", "opencode.json")) ||
    sameConfigPath(file, path.join(root, "global", "opencode.json.template"));
  const notePermission = isIntentionalGlobalConfig
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

const KIT_GLOBAL_OPENCODE_TEMPLATE = path.join("global", "opencode.json.template");
const KIT_DEFAULT_MODEL = "openai/gpt-5.6-sol";
const KIT_PLUGIN_SOURCES = [
  "__OPENCODE_CONFIG_DIR__/plugins/notify.ts",
  "__OPENCODE_CONFIG_DIR__/plugin/session-env.ts",
  "__OPENCODE_CONFIG_DIR__/extensions/opencode-pty-bridge.ts",
  "__OPENCODE_CONFIG_DIR__/extensions/roadmap-mission-launcher.ts",
  "__OPENCODE_CONFIG_DIR__/extensions/session-completion-guard.ts",
] as const;
const GUARD_SOURCE_SUFFIX = "/extensions/session-completion-guard.ts";
const LAUNCHER_SOURCE_SUFFIX = "/extensions/roadmap-mission-launcher.ts";
const AUDIT_WINDOW_KEYS = new Set([
  "closePassedAfterMs",
  "enabled",
  "mode",
  "scope",
  "terminal",
]);

function pluginSource(entry: unknown): string | null {
  return typeof entry === "string"
    ? entry
    : Array.isArray(entry) && typeof entry[0] === "string"
      ? entry[0]
      : null;
}

function validateAuditWindowOptions(
  ctx: ValidationContext,
  config: Record<string, unknown>,
  file: string,
  portableTemplate: boolean,
): void {
  if (!Array.isArray(config.plugin)) return;
  const guardEntry = config.plugin.find((entry) => pluginSource(entry)?.replaceAll("\\", "/").endsWith(GUARD_SOURCE_SUFFIX));
  if (!Array.isArray(guardEntry) || !isPlainRecord(guardEntry[1])) {
    ctx.addError(`Completion guard plugin must use a tuple with options: ${file}`);
    return;
  }
  const auditWindow = guardEntry[1].auditWindow;
  if (!isPlainRecord(auditWindow)) {
    ctx.addError(`Completion guard options must define auditWindow: ${file}`);
    return;
  }
  const unknown = Object.keys(auditWindow).filter((key) => !AUDIT_WINDOW_KEYS.has(key));
  if (unknown.length > 0) {
    ctx.addError(`Completion guard auditWindow has unsupported option(s) ${unknown.join(", ")}: ${file}`);
  }
  if (typeof auditWindow.enabled !== "boolean") {
    ctx.addError(`Completion guard auditWindow.enabled must be boolean: ${file}`);
  } else if (portableTemplate && auditWindow.enabled !== false) {
    ctx.addError(`Portable completion guard auditWindow.enabled must default to false: ${file}`);
  }
  if (auditWindow.mode !== "read-only-monitor") {
    ctx.addError(`Completion guard auditWindow.mode must be 'read-only-monitor': ${file}`);
  }
  if (auditWindow.scope !== "per-root") {
    ctx.addError(`Completion guard auditWindow.scope must be 'per-root': ${file}`);
  }
  if (auditWindow.terminal !== "powershell-shell") {
    ctx.addError(`Completion guard auditWindow.terminal must be 'powershell-shell': ${file}`);
  }
  if (
    typeof auditWindow.closePassedAfterMs !== "number" ||
    !Number.isInteger(auditWindow.closePassedAfterMs) ||
    auditWindow.closePassedAfterMs < 0
  ) {
    ctx.addError(`Completion guard auditWindow.closePassedAfterMs must be a non-negative integer: ${file}`);
  }
  const issuers = guardEntry[1].certificateIssuers;
  if (
    portableTemplate &&
    (!Array.isArray(issuers) || issuers.length !== 1 || issuers[0] !== "roadmap-mission-session-executor")
  ) {
    ctx.addError(`Portable completion guard certificateIssuers must select only roadmap-mission-session-executor: ${file}`);
  }
  if (
    guardEntry[1].certificateWaitMs != null &&
    (typeof guardEntry[1].certificateWaitMs !== "number" ||
      !Number.isInteger(guardEntry[1].certificateWaitMs) ||
      guardEntry[1].certificateWaitMs < 0)
  ) {
    ctx.addError(`Completion guard certificateWaitMs must be a non-negative integer: ${file}`);
  }
}

function validateLauncherOptions(ctx: ValidationContext, config: Record<string, unknown>, file: string): void {
  if (!Array.isArray(config.plugin)) return;
  const launcherEntry = config.plugin.find((entry) => pluginSource(entry)?.replaceAll("\\", "/").endsWith(LAUNCHER_SOURCE_SUFFIX));
  if (!Array.isArray(launcherEntry) || !isPlainRecord(launcherEntry[1])) {
    ctx.addError(`Roadmap mission launcher plugin must use a tuple with options: ${file}`);
    return;
  }
  if (launcherEntry[1].scriptRuntime !== "__OPENCODE_SCRIPT_RUNTIME__") {
    ctx.addError(`Portable roadmap mission launcher must use the script runtime placeholder: ${file}`);
  }
}

function validateKitGlobalModelSource(
  ctx: ValidationContext,
  config: Record<string, unknown>,
  file: string,
  root: string,
): void {
  if (!sameConfigPath(file, path.join(root, KIT_GLOBAL_OPENCODE_TEMPLATE))) {
    return;
  }
  if (config.model !== KIT_DEFAULT_MODEL) {
    ctx.addError(
      `Kit global OpenCode config template must set portable top-level model: ${KIT_DEFAULT_MODEL}: ${file}`,
    );
  }
}

function validateKitPluginSources(
  ctx: ValidationContext,
  config: Record<string, unknown>,
  file: string,
  root: string,
): void {
  if (!sameConfigPath(file, path.join(root, KIT_GLOBAL_OPENCODE_TEMPLATE))) return;
  if (!Array.isArray(config.plugin)) {
    ctx.addError(`Kit global OpenCode config template must define a plugin inventory: ${file}`);
    return;
  }
  const sources = config.plugin.map((entry) =>
    typeof entry === "string"
      ? entry
      : Array.isArray(entry) && typeof entry[0] === "string"
        ? entry[0]
        : null
  );
  if (sources.some((source) => source == null)) {
    ctx.addError(`Kit global OpenCode config template has an invalid plugin source entry: ${file}`);
    return;
  }
  for (const expected of KIT_PLUGIN_SOURCES) {
    const count = sources.filter((source) => source === expected).length;
    if (count !== 1) {
      ctx.addError(`Kit global OpenCode config template must include exactly one '${expected}' source: ${file}`);
    }
  }
  if (sources.some((source) => source === "opencode-pty" || source?.startsWith("opencode-pty@"))) {
    ctx.addError(`Kit global OpenCode config template must not enable package/cache opencode-pty: ${file}`);
  }
  validateAuditWindowOptions(ctx, config, file, true);
  validateLauncherOptions(ctx, config, file);
}

export function validateOpenCodeConfigFiles(ctx: ValidationContext, root: string): void {
  for (const file of walkRepositoryFiles(root)) {
    if (
      path.basename(file) !== "opencode.json" &&
      path.basename(file) !== "opencode.jsonc" &&
      path.basename(file) !== "opencode.json.template"
    ) {
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
    validateKitGlobalModelSource(ctx, inspection.value, file, root);
    validateKitPluginSources(ctx, inspection.value, file, root);
    if (sameConfigPath(file, path.join(root, "global", "opencode.json"))) {
      validateAuditWindowOptions(ctx, inspection.value, file, false);
    }
  }
}
