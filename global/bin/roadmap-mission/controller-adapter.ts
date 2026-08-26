import fs from "node:fs";
import path from "node:path";
import { RoadmapMissionError } from "./contracts.ts";

export type ControllerAdapter = {
  executorArgv: string[];
  maxAttemptsPerSlice: number;
  maxWallClockMsPerSlice: number;
  schemaVersion: 1;
  validationTimeoutMs: number;
};

export const ROADMAP_COMMAND_TIMEOUT_MS = {
  gitMutation: 120_000,
  inspection: 30_000,
  openSpec: 120_000,
  validation: 600_000,
} as const;

function record(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export function safeProjectRelative(root: string, value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "" || /[\r\n\0]/.test(value)) {
    throw new RoadmapMissionError(`${field} must be a non-empty single-line project-relative path`, 2);
  }
  const normalized = value.trim().replaceAll("\\", "/").replace(/^\.\//, "");
  if (path.isAbsolute(normalized) || normalized.split("/").some((part) => part === "" || part === "." || part === "..")) {
    throw new RoadmapMissionError(`${field} must be a contained project-relative path`, 2);
  }
  const resolved = path.resolve(root, normalized);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new RoadmapMissionError(`${field} escaped the project root`, 2);
  return normalized;
}

function requiredArgv(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 100) {
    throw new RoadmapMissionError(`${field} must contain between 1 and 100 argv items`, 2);
  }
  return value.map((item, index) => {
    if (typeof item !== "string" || item.trim() === "" || /[\r\n\0]/.test(item)) {
      throw new RoadmapMissionError(`${field}[${index}] must be a non-empty single-line argv item`, 2);
    }
    return item;
  });
}

function integer(value: unknown, field: string, min: number, max: number): number {
  if (!Number.isSafeInteger(value) || (value as number) < min || (value as number) > max) {
    throw new RoadmapMissionError(`${field} must be an integer between ${min} and ${max}`, 2);
  }
  return value as number;
}

export function loadControllerAdapter(root: string, relative: string): ControllerAdapter {
  const normalized = safeProjectRelative(root, relative, "controller adapter");
  const file = path.resolve(root, normalized);
  let parsed: unknown;
  try {
    const stat = fs.lstatSync(file);
    if (stat.isSymbolicLink() || !stat.isFile()) throw new Error("not a regular file");
    parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new RoadmapMissionError("controller adapter must be a readable regular JSON file", 2, { cause: error });
  }
  const input = record(parsed);
  if (input == null) throw new RoadmapMissionError("controller adapter must be an object", 2);
  const expected = ["schemaVersion", "executorArgv", "maxAttemptsPerSlice", "maxWallClockMsPerSlice"];
  const allowed = [...expected, "validationTimeoutMs"];
  const missing = expected.filter((field) => !(field in input));
  const extras = Object.keys(input).filter((field) => !allowed.includes(field));
  if (missing.length > 0 || extras.length > 0) throw new RoadmapMissionError("controller adapter fields are invalid", 2);
  if (input.schemaVersion !== 1) throw new RoadmapMissionError("controller adapter schemaVersion must be 1", 2);
  return {
    executorArgv: requiredArgv(input.executorArgv, "controller adapter executorArgv"),
    maxAttemptsPerSlice: integer(input.maxAttemptsPerSlice, "maxAttemptsPerSlice", 1, 20),
    maxWallClockMsPerSlice: integer(input.maxWallClockMsPerSlice, "maxWallClockMsPerSlice", 1_000, 86_400_000),
    schemaVersion: 1,
    validationTimeoutMs: input.validationTimeoutMs == null
      ? ROADMAP_COMMAND_TIMEOUT_MS.validation
      : integer(input.validationTimeoutMs, "validationTimeoutMs", 1_000, 1_800_000),
  };
}
