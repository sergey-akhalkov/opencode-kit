import crypto from "node:crypto";

export const STRUCTURAL_SECRET_KEYS = new Set([
  "cwd",
  "directory",
  "id",
  "message_id",
  "parent_id",
  "path",
  "project_id",
  "root",
  "session_id",
  "sessionid",
  "share_url",
  "workspace_id",
  "worktree",
]);

const REDACTED_VALUE = "<redacted>";
const sensitiveAssignmentPattern = /(\b(?:access[_-]?token|api[_-]?key|authorization|cookie|password|secret|token)\b\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi;
const credentialTokenPattern = /\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g;
const bearerTokenPattern = /\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi;
const windowsHomePathPattern = /\b[A-Za-z]:\\Users\\[^\s"'<>|]+/g;
const posixHomePathPattern = /\/(?:Users|home)\/[^\s/"']+(?:\/[^\s"']*)?/g;

function redactSensitiveText(value: string): string {
  return value
    .replace(bearerTokenPattern, `Bearer ${REDACTED_VALUE}`)
    .replace(credentialTokenPattern, REDACTED_VALUE)
    .replace(sensitiveAssignmentPattern, `$1${REDACTED_VALUE}`)
    .replace(windowsHomePathPattern, "<home-path>")
    .replace(posixHomePathPattern, "<home-path>");
}

function redactSensitiveStrings(value: unknown): unknown {
  if (typeof value === "string") {
    return redactSensitiveText(value);
  }
  if (Array.isArray(value)) {
    return value.map(redactSensitiveStrings);
  }
  if (value == null || typeof value !== "object") {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
      key,
      redactSensitiveStrings(nested),
    ]),
  );
}

export function hashRef(prefix: string, value: string | null | undefined): string {
  const normalized = value == null || value === "" ? "<missing>" : value;
  const digest = crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 12);
  return `${prefix}_${digest}`;
}

function redactKnownSessionId(value: unknown, rawSessionId: string): unknown {
  const sessionRef = hashRef("session", rawSessionId);
  if (typeof value === "string") {
    return value.replaceAll(rawSessionId, sessionRef);
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactKnownSessionId(item, rawSessionId));
  }
  if (value == null || typeof value !== "object") {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
      key,
      redactKnownSessionId(nested, rawSessionId),
    ]),
  );
}

function redactSessionTokens(value: unknown, allowedRefs: Set<string>): unknown {
  if (typeof value === "string") {
    return value.replace(
      /session_[A-Za-z0-9][A-Za-z0-9_-]{5,}/g,
      (token) => (allowedRefs.has(token) ? token : hashRef("session", token)),
    );
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactSessionTokens(item, allowedRefs));
  }
  if (value == null || typeof value !== "object") {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
      key,
      redactSessionTokens(nested, allowedRefs),
    ]),
  );
}

function redactStructuralSecrets(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactStructuralSecrets);
  }
  if (value == null || typeof value !== "object") {
    return value;
  }
  const result: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (STRUCTURAL_SECRET_KEYS.has(key.toLowerCase())) {
      continue;
    }
    result[key] = redactStructuralSecrets(nested);
  }
  return result;
}

function transcriptContent(value: unknown, rawSessionId: string): unknown {
  return redactSensitiveStrings(
    redactSessionTokens(
      redactKnownSessionId(redactStructuralSecrets(value), rawSessionId),
      new Set([hashRef("session", rawSessionId)]),
    ),
  );
}

export function sanitizeText(value: string, rawSessionId: string): string {
  return transcriptContent(value, rawSessionId) as string;
}
