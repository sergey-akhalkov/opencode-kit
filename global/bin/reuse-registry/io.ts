import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { z } from "zod";

export class ReuseRegistryError extends Error {
  readonly exitCode: number;
  readonly status: "blocked" | "conflict" | "degraded" | "invalid";

  constructor(message: string, status: ReuseRegistryError["status"] = "invalid", exitCode = 2, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ReuseRegistryError";
    this.exitCode = exitCode;
    this.status = status;
  }
}

export function sha256(value: string | Uint8Array): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value != null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, stableValue(child)]));
  }
  return value;
}

export function stableJson(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

export function canonicalPath(value: string): string {
  const resolved = path.resolve(value);
  try {
    return fs.realpathSync(resolved);
  } catch (error) {
    throw new ReuseRegistryError("Configured path is missing or unreadable", "degraded", 3, { cause: error });
  }
}

export function samePath(left: string, right: string): boolean {
  const a = path.resolve(left);
  const b = path.resolve(right);
  return process.platform === "win32" ? a.toLowerCase() === b.toLowerCase() : a === b;
}

export function assertRealDirectory(value: string, label: string): string {
  const resolved = canonicalPath(value);
  let stat: fs.Stats;
  try {
    stat = fs.lstatSync(resolved);
  } catch (error) {
    throw new ReuseRegistryError(`${label} is unavailable`, "degraded", 3, { cause: error });
  }
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new ReuseRegistryError(`${label} must be a real directory`);
  return resolved;
}

export function assertContained(root: string, candidate: string, label: string): string {
  const resolvedRoot = path.resolve(root);
  const resolvedCandidate = path.resolve(candidate);
  const relative = path.relative(resolvedRoot, resolvedCandidate);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new ReuseRegistryError(`${label} escapes its configured root`);
  return resolvedCandidate;
}

export function readJson<T>(file: string, schema: z.ZodType<T>, label: string): T {
  let value: unknown;
  try {
    const stat = fs.lstatSync(file);
    if (stat.isSymbolicLink() || !stat.isFile()) throw new Error("not a regular file");
    value = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new ReuseRegistryError(`${label} is missing, unreadable, or malformed`, "invalid", 2, { cause: error });
  }
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ReuseRegistryError(`${label} failed schema validation at ${issue?.path.join(".") || "root"}: ${issue?.message || "invalid"}`);
  }
  return parsed.data;
}

export function readOptionalBytes(file: string): Buffer | null {
  if (!fs.existsSync(file)) return null;
  const stat = fs.lstatSync(file);
  if (stat.isSymbolicLink() || !stat.isFile()) throw new ReuseRegistryError("Write target must be a regular file");
  return fs.readFileSync(file);
}

export function replaceFileAtomically(file: string, next: string, expected: Buffer | null): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = path.join(path.dirname(file), `.${path.basename(file)}.${process.pid}.${Date.now()}.tmp`);
  let descriptor: number | null = null;
  try {
    descriptor = fs.openSync(temporary, "wx");
    fs.writeFileSync(descriptor, next, "utf8");
    fs.fsyncSync(descriptor);
    fs.closeSync(descriptor);
    descriptor = null;
    const current = readOptionalBytes(file);
    if ((expected == null) !== (current == null) || (expected != null && current != null && !expected.equals(current))) {
      throw new ReuseRegistryError("Concurrent file change detected before atomic replacement", "conflict", 4);
    }
    fs.renameSync(temporary, file);
  } catch (error) {
    if (descriptor != null) {
      try { fs.closeSync(descriptor); } catch { /* cleanup below reports the owning error */ }
    }
    try { if (fs.existsSync(temporary)) fs.rmSync(temporary, { force: true }); } catch { /* preserve original cause */ }
    if (error instanceof ReuseRegistryError) throw error;
    throw new ReuseRegistryError("Atomic file replacement failed", "blocked", 5, { cause: error });
  }
}

export function replaceFilesAtomically(changes: Array<{ file: string; next: string }>): void {
  const preimages = changes.map((change) => ({ ...change, before: readOptionalBytes(change.file) }));
  const installed: typeof preimages = [];
  try {
    for (const change of preimages) {
      replaceFileAtomically(change.file, change.next, change.before);
      installed.push(change);
    }
  } catch (error) {
    const rollbackErrors: string[] = [];
    for (const change of [...installed].reverse()) {
      try {
        const current = readOptionalBytes(change.file);
        if (change.before == null) {
          if (current != null) fs.rmSync(change.file, { force: true });
        } else {
          replaceFileAtomically(change.file, change.before.toString("utf8"), current);
        }
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError instanceof Error ? rollbackError.message : String(rollbackError));
      }
    }
    if (rollbackErrors.length > 0) {
      throw new ReuseRegistryError(`Atomic multi-file rollback failed: ${rollbackErrors.join("; ")}`, "blocked", 5, { cause: error });
    }
    throw error;
  }
}

export function redactText(text: string, roots: Array<[string, string]>): string {
  let output = text;
  for (const [root, label] of roots) {
    for (const variant of [root, root.replaceAll("\\", "/")]) {
      const escaped = variant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      output = output.replace(new RegExp(escaped, process.platform === "win32" ? "gi" : "g"), label);
    }
  }
  return output;
}
