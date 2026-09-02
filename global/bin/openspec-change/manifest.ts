import crypto from "node:crypto";

export const OPENSPEC_MANIFEST_SCHEMA_VERSION = 1;
export const OPENSPEC_EVIDENCE_SCHEMA_VERSION = 2;
export const OPENSPEC_EVIDENCE_LEGACY_SCHEMA_VERSION = 1;
export const DEFAULT_EVIDENCE_MAX_FILES = 64;
export const DEFAULT_EVIDENCE_MAX_BYTES = 25 * 1024 * 1024;
export const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/;
export const SAFE_TOKEN = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,199}$/;
export const MAX_MANIFEST_BYTES = 65_536;
export const MAX_TEXT = 1_000;
export const MAX_OWNERS = 64;
export const MAX_TASKS = 128;
export const MAX_LANES = 64;

export type SchemaIssueCode = "missing" | "extra" | "escape" | "cycle" | "unknown" | "invalid";
export type SchemaIssue = { code: SchemaIssueCode; path: string; message: string };
export type ParseResult<T> = { ok: true; value: T } | { ok: false; issues: SchemaIssue[] };
export type OpenSpecArtifactProfile = "compact" | "full" | "legacy";
export type OpenSpecRiskDispositionKind = "material" | "ordinary-small-exact" | "unknown";
export type OpenSpecArtifactMetadata = {
  artifactProfile: OpenSpecArtifactProfile;
  riskDispositionKind: OpenSpecRiskDispositionKind | null;
};

export function digestText(value: string): string {
  return crypto.createHash("sha256").update(value.replaceAll("\r\n", "\n"), "utf8").digest("hex");
}

export function failIssues(issues: SchemaIssue[]): ParseResult<never> {
  return { ok: false, issues: [...issues].sort((left, right) => left.path.localeCompare(right.path) || left.code.localeCompare(right.code)) };
}

export function plainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value != null && !Array.isArray(value);
}

export function extraKeys(value: Record<string, unknown>, allowed: readonly string[], path: string): SchemaIssue[] {
  return Object.keys(value)
    .filter((key) => !allowed.includes(key))
    .sort((left, right) => left.localeCompare(right))
    .map((key) => ({ code: "extra" as const, path, message: `Unrecognized key(s): ${key}.` }));
}

export function readString(value: unknown, path: string, pattern?: RegExp): ParseResult<string> {
  if (value === undefined) return failIssues([{ code: "missing", path, message: `Invalid input: expected string, received undefined` }]);
  if (typeof value !== "string" || value.trim() === "" || value.length > MAX_TEXT || (pattern != null && !pattern.test(value))) {
    return failIssues([{ code: "invalid", path, message: `Invalid ${path}.` }]);
  }
  return { ok: true, value };
}

export function readBoolean(value: unknown, path: string): ParseResult<boolean> {
  if (value === undefined) return failIssues([{ code: "missing", path, message: `Invalid input: expected boolean, received undefined` }]);
  if (typeof value !== "boolean") return failIssues([{ code: "invalid", path, message: `Invalid input: expected boolean, received ${typeof value}` }]);
  return { ok: true, value };
}

export function readArray(value: unknown, path: string): ParseResult<unknown[]> {
  if (value === undefined) return failIssues([{ code: "missing", path, message: `Invalid input: expected array, received undefined` }]);
  if (!Array.isArray(value)) return failIssues([{ code: "invalid", path, message: `Invalid input: expected array, received ${typeof value}` }]);
  return { ok: true, value };
}

export function readObject(value: unknown, path: string): ParseResult<Record<string, unknown>> {
  if (value === undefined) return failIssues([{ code: "missing", path, message: `Invalid input: expected object, received undefined` }]);
  if (!plainRecord(value)) return failIssues([{ code: "invalid", path, message: `Invalid input: expected object, received ${typeof value}` }]);
  return { ok: true, value };
}

export function parseOpenSpecArtifactMetadata(value: unknown): ParseResult<OpenSpecArtifactMetadata> {
  const rootPath = ".openspec.yaml";
  const artifactPath = `${rootPath}.artifactProfile`;
  const riskPath = `${rootPath}.riskDisposition`;
  if (!plainRecord(value)) {
    return failIssues([{ code: "invalid", path: rootPath, message: "OpenSpec change metadata must be an object." }]);
  }

  const hasArtifactProfile = Object.hasOwn(value, "artifactProfile");
  const hasRiskDisposition = Object.hasOwn(value, "riskDisposition");
  if (!hasArtifactProfile && !hasRiskDisposition) {
    return { ok: true, value: { artifactProfile: "legacy", riskDispositionKind: null } };
  }

  const issues: SchemaIssue[] = [];
  if (!hasArtifactProfile) {
    issues.push({ code: "missing", path: artifactPath, message: "artifactProfile is required when riskDisposition is present." });
  }
  if (!hasRiskDisposition) {
    issues.push({ code: "missing", path: riskPath, message: "riskDisposition is required when artifactProfile is present." });
  }

  const artifactProfile = value.artifactProfile;
  if (hasArtifactProfile && artifactProfile !== "compact" && artifactProfile !== "full") {
    issues.push({ code: "invalid", path: artifactPath, message: "artifactProfile must be compact or full." });
  }

  let riskDispositionKind: OpenSpecRiskDispositionKind | undefined;
  if (hasRiskDisposition) {
    if (!plainRecord(value.riskDisposition)) {
      issues.push({ code: "invalid", path: riskPath, message: "riskDisposition must be an object with exactly one kind field." });
    } else {
      issues.push(...extraKeys(value.riskDisposition, ["kind"], riskPath));
      if (!Object.hasOwn(value.riskDisposition, "kind")) {
        issues.push({ code: "missing", path: `${riskPath}.kind`, message: "riskDisposition.kind is required." });
      } else if (value.riskDisposition.kind !== "ordinary-small-exact" && value.riskDisposition.kind !== "material" && value.riskDisposition.kind !== "unknown") {
        issues.push({ code: "invalid", path: `${riskPath}.kind`, message: "riskDisposition.kind must be ordinary-small-exact, material, or unknown." });
      } else {
        riskDispositionKind = value.riskDisposition.kind;
      }
    }
  }

  if (artifactProfile === "compact" && (riskDispositionKind === "material" || riskDispositionKind === "unknown")) {
    issues.push({ code: "invalid", path: artifactPath, message: `artifactProfile compact conflicts with riskDisposition.kind ${riskDispositionKind}; use full artifacts.` });
  }
  if (issues.length > 0 || (artifactProfile !== "compact" && artifactProfile !== "full") || riskDispositionKind == null) {
    return failIssues(issues.length > 0 ? issues : [{ code: "invalid", path: rootPath, message: "OpenSpec artifact metadata is incomplete." }]);
  }
  return { ok: true, value: { artifactProfile, riskDispositionKind } };
}

export function safeRelativePath(value: string, label: string): SchemaIssue | undefined {
  const normalized = value.replaceAll("\\", "/");
  if (normalized !== value) return { code: "invalid", path: label, message: "Paths must use forward slashes." };
  if (normalized.startsWith("/") || /^[A-Za-z]:/.test(normalized)) return { code: "escape", path: label, message: "Path must be a safe relative path." };
  if (normalized.split("/").some((part) => part === "" || part === "." || part === "..")) {
    return { code: "escape", path: label, message: "Path must not contain empty, '.', or '..' segments." };
  }
  if (normalized.length > MAX_TEXT) return { code: "invalid", path: label, message: `Path exceeds ${MAX_TEXT} characters.` };
  return undefined;
}

export function normalizeWriteRoot(value: string): string {
  return value.replaceAll("\\", "/").replace(/\/+$/u, "");
}

export function writeRootsOverlap(left: string, right: string): boolean {
  const a = normalizeWriteRoot(left);
  const b = normalizeWriteRoot(right);
  return a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`);
}

export function isSha256(value: string): boolean {
  return /^[a-f0-9]{64}$/.test(value);
}
