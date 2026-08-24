#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const PRACTICE_OWNER_SCHEMA_VERSION = 1;
export const PRACTICE_OWNER_COUNT = 15;
export const CORE_NON_OWNER_AGENTS = ["implementation-worker", "sdet-quality-engineer"] as const;
export const OPTIONAL_FINAL_REVIEW_AGENT = "final-candidate-reviewer";

export type PracticeClass = "core" | "domain";

export type PracticeAnchor = {
  marker: string;
  path: string;
};

export type PracticeOwnerRecord = {
  anchors: PracticeAnchor[];
  class: PracticeClass;
  exclusions: string[];
  id: string;
  maintenanceSurfaces: string[];
  owner: string;
  profiles: string[];
};

export type PracticeOwnerSeed = {
  practices: PracticeOwnerRecord[];
  schemaVersion: typeof PRACTICE_OWNER_SCHEMA_VERSION;
};

const PRACTICE_KEYS = ["anchors", "class", "exclusions", "id", "maintenanceSurfaces", "owner", "profiles"] as const;
const ANCHOR_KEYS = ["marker", "path"] as const;
const SAFE_ID = /^[a-z][a-z0-9-]{1,63}$/;
const SAFE_PATH = /^(?:global|instructions|profiles|config|tools)\/[A-Za-z0-9._/-]+$/;

function isObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown, pathName: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`Invalid string at ${pathName}`);
  return value;
}

function readStringArray(value: unknown, pathName: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.trim() === "")) {
    throw new Error(`Invalid string array at ${pathName}`);
  }
  return value as string[];
}

function extraKeys(record: Record<string, unknown>, allowed: readonly string[], pathName: string): void {
  const unexpected = Object.keys(record).filter((key) => !allowed.includes(key));
  if (unexpected.length > 0) throw new Error(`Unexpected keys at ${pathName}: ${unexpected.join(",")}`);
}

export function defaultPracticeOwnerSeedPath(root: string): string {
  return path.join(root, "config", "practice-owners.json");
}

export function defaultPracticeOwnerViewPath(root: string): string {
  return path.join(root, "config", "practice-owners.view.md");
}

export function parsePracticeOwnerSeed(value: unknown): PracticeOwnerSeed {
  if (!isObject(value)) throw new Error("Practice owner seed must be an object.");
  extraKeys(value, ["practices", "schemaVersion"], "<root>");
  if (value.schemaVersion !== PRACTICE_OWNER_SCHEMA_VERSION) throw new Error("Unsupported practice-owner schemaVersion.");
  if (!Array.isArray(value.practices) || value.practices.length !== PRACTICE_OWNER_COUNT) {
    throw new Error(`Practice owner seed must contain exactly ${PRACTICE_OWNER_COUNT} practices.`);
  }
  const practices: PracticeOwnerRecord[] = [];
  for (const [index, item] of value.practices.entries()) {
    if (!isObject(item)) throw new Error(`Practice ${index} must be an object.`);
    extraKeys(item, PRACTICE_KEYS, `practices.${index}`);
    const id = readString(item.id, `practices.${index}.id`);
    const owner = readString(item.owner, `practices.${index}.owner`);
    const practiceClass = readString(item.class, `practices.${index}.class`);
    if (!SAFE_ID.test(id) || !SAFE_ID.test(owner)) throw new Error(`Unsafe practice or owner id at practices.${index}.`);
    if (practiceClass !== "core" && practiceClass !== "domain") throw new Error(`Invalid class at practices.${index}.`);
    const profiles = readStringArray(item.profiles, `practices.${index}.profiles`);
    const exclusions = readStringArray(item.exclusions, `practices.${index}.exclusions`);
    const maintenanceSurfaces = readStringArray(item.maintenanceSurfaces, `practices.${index}.maintenanceSurfaces`);
    if (!Array.isArray(item.anchors) || item.anchors.length === 0) throw new Error(`Missing anchors at practices.${index}.`);
    const anchors: PracticeAnchor[] = [];
    for (const [anchorIndex, anchor] of item.anchors.entries()) {
      if (!isObject(anchor)) throw new Error(`Anchor ${anchorIndex} at practices.${index} must be an object.`);
      extraKeys(anchor, ANCHOR_KEYS, `practices.${index}.anchors.${anchorIndex}`);
      const anchorPath = readString(anchor.path, `practices.${index}.anchors.${anchorIndex}.path`);
      const marker = readString(anchor.marker, `practices.${index}.anchors.${anchorIndex}.marker`);
      if (!SAFE_PATH.test(anchorPath)) throw new Error(`Unsafe anchor path at practices.${index}.anchors.${anchorIndex}.`);
      anchors.push({ marker, path: anchorPath });
    }
    for (const surface of maintenanceSurfaces) {
      if (!SAFE_PATH.test(surface)) throw new Error(`Unsafe maintenance surface at practices.${index}.`);
    }
    if (practiceClass === "core" && !profiles.includes("core")) throw new Error(`Core practice ${id} must bind core.`);
    if (practiceClass === "domain" && profiles.includes("core")) throw new Error(`Domain practice ${id} must not bind core.`);
    if (!profiles.includes("all")) throw new Error(`Practice ${id} must bind all.`);
    practices.push({ anchors, class: practiceClass, exclusions, id, maintenanceSurfaces, owner, profiles });
  }
  const ids = practices.map((row) => row.id);
  const owners = practices.map((row) => row.owner);
  if (new Set(ids).size !== ids.length) throw new Error("Duplicate practice ids.");
  if (new Set(owners).size !== owners.length) throw new Error("Duplicate practice owners.");
  const expectedOrder = [...ids].sort((left, right) => left.localeCompare(right));
  if (ids.join("\n") !== expectedOrder.join("\n")) throw new Error("Practice ids must be stably sorted.");
  return { practices, schemaVersion: PRACTICE_OWNER_SCHEMA_VERSION };
}

export function loadPracticeOwnerSeed(root: string, seedPath = defaultPracticeOwnerSeedPath(root)): PracticeOwnerSeed {
  return parsePracticeOwnerSeed(JSON.parse(fs.readFileSync(seedPath, "utf8")));
}

export function coreOwnerAgents(seed: PracticeOwnerSeed): string[] {
  return seed.practices.filter((row) => row.class === "core").map((row) => row.owner);
}

export function allOwnerAgents(seed: PracticeOwnerSeed): string[] {
  return seed.practices.map((row) => row.owner);
}

export function expectedCoreAgents(seed: PracticeOwnerSeed): string[] {
  return [...coreOwnerAgents(seed), ...CORE_NON_OWNER_AGENTS].sort((left, right) => left.localeCompare(right));
}

export function seedDigest(seed: PracticeOwnerSeed): string {
  return crypto.createHash("sha256").update(`${JSON.stringify(seed)}\n`).digest("hex");
}

export function renderPracticeOwnerView(seed: PracticeOwnerSeed): string {
  const rows = seed.practices.map((row) => `| \`${row.id}\` | \`${row.owner}\` | ${row.class} | ${row.profiles.join(", ")} |`);
  return [
    "# Practice Ownership",
    "",
    "Generated from `config/practice-owners.json`. Do not edit by hand.",
    "",
    "| Practice ID | Owner | Class | Profiles |",
    "| --- | --- | --- | --- |",
    ...rows,
    "",
  ].join("\n");
}

export function materializePracticeOwnerView(root: string, seed = loadPracticeOwnerSeed(root)): string {
  const view = renderPracticeOwnerView(seed);
  const target = defaultPracticeOwnerViewPath(root);
  fs.writeFileSync(target, view);
  return target;
}

function usage(): string {
  return [
    "Usage:",
    "  node tools/practice-owners.ts --help",
    "  node tools/practice-owners.ts --digest [--root <path>]",
    "  node tools/practice-owners.ts --materialize [--root <path>]",
  ].join("\n");
}

function main(args: string[]): number {
  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }
  const rootIndex = args.indexOf("--root");
  const root = rootIndex >= 0 ? args[rootIndex + 1] ?? process.cwd() : process.cwd();
  const seed = loadPracticeOwnerSeed(root);
  if (args.includes("--digest")) {
    process.stdout.write(`${JSON.stringify({ digest: seedDigest(seed), practices: seed.practices.length }, null, 2)}\n`);
    return 0;
  }
  if (args.includes("--materialize")) {
    const target = materializePracticeOwnerView(root, seed);
    process.stdout.write(`${JSON.stringify({ digest: seedDigest(seed), view: path.relative(root, target).replaceAll("\\\\", "/") }, null, 2)}\n`);
    return 0;
  }
  throw new Error(usage());
}

if (process.argv[1] != null && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
