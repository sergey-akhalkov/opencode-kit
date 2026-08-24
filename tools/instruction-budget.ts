#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { buildMaintainedInstructionBudgetMetrics, extractDescriptionChars } from "./instruction-artifacts-inventory.ts";
import {
  loadRuntimeSurfaceProfile,
  resolveRuntimeSurfaceProfile,
  serializeRuntimeSurfaceProfile,
} from "./runtime-surface-profile.ts";
import crypto from "node:crypto";

type OutputFormat = "json" | "markdown";

type BudgetSeed = {
  limits: {
    discoveryMetadataTokenProxy: number;
    globalStartupTokenProxy: number;
    onDemandBodiesTokenProxy: number;
  };
  schemaVersion: 2;
};

export const CORE_STARTUP_TOKEN_PROXY_CEILING = 12000;
export const CORE_DISCOVERY_TOKEN_PROXY_CEILING = 1200;

type BudgetBoundary = {
  actual: number;
  maximum: number;
  name: string;
  status: "failed" | "passed";
};

export type InstructionBudgetReport = {
  boundaries: BudgetBoundary[];
  core: {
    boundaries: BudgetBoundary[];
    identity: { profileDigest: string; profileName: string };
  } | null;
  materializationCommand: "npm run instruction:budget -- --materialize-seed";
  root: "<redacted>";
  schemaVersion: 2;
  seed: "<root>/config/instruction-budget.json" | "<external-seed>";
  status: "failed" | "passed";
  tool: "opencode-dev-kit-instruction-budget";
};

type Options = {
  format: OutputFormat;
  materializeSeed: boolean;
  root: string;
  seed: string | null;
};

const MATERIALIZATION_COMMAND = "npm run instruction:budget -- --materialize-seed" as const;

function repositoryRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

function defaultSeed(root: string): string {
  return path.join(root, "config", "instruction-budget.json");
}

function usage(): string {
  return [
    "Usage:",
    "  npm run instruction:budget -- [options]",
    "",
    "Options:",
    "  --root <path>          Kit root. Default: this repository.",
    "  --seed <path>          Budget seed. Default: config/instruction-budget.json.",
    "  --format <format>      json (default) or markdown.",
    "  --materialize-seed     Lower or retain every selected reviewed maximum; never increase one.",
    "  --help, -h             Show this help without reading or writing budget data.",
  ].join("\n");
}

function requiredValue(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${option}.`);
  return value;
}

function parseArgs(args: string[]): Options | null {
  if (args.includes("--help") || args.includes("-h")) return null;
  const options: Options = { format: "json", materializeSeed: false, root: repositoryRoot(), seed: null };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--root") {
      options.root = requiredValue(args, index, arg);
      index++;
    } else if (arg.startsWith("--root=")) {
      options.root = arg.slice("--root=".length);
    } else if (arg === "--seed") {
      options.seed = requiredValue(args, index, arg);
      index++;
    } else if (arg.startsWith("--seed=")) {
      options.seed = arg.slice("--seed=".length);
    } else if (arg === "--format") {
      const format = requiredValue(args, index, arg);
      if (format !== "json" && format !== "markdown") throw new Error("--format must be json or markdown.");
      options.format = format;
      index++;
    } else if (arg.startsWith("--format=")) {
      const format = arg.slice("--format=".length);
      if (format !== "json" && format !== "markdown") throw new Error("--format must be json or markdown.");
      options.format = format;
    } else if (arg === "--materialize-seed") {
      options.materializeSeed = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  options.root = path.resolve(options.root);
  options.seed = options.seed == null ? null : path.resolve(options.seed);
  return options;
}

function exactKeys(value: Record<string, unknown>, expected: string[]): boolean {
  const actual = Object.keys(value).sort();
  return actual.length === expected.length && actual.every((key, index) => key === [...expected].sort()[index]);
}

function nonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function parseSeed(seedPath: string): BudgetSeed {
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  } catch {
    throw new Error("Instruction budget seed is unreadable or malformed; review it directly because materialization cannot repair or increase limits.");
  }
  if (typeof parsed !== "object" || parsed == null || Array.isArray(parsed)) {
    throw new Error("Instruction budget seed must be an object with schemaVersion=2 and reviewed limits.");
  }
  const record = parsed as Record<string, unknown>;
  const limits = record.limits;
  if (!exactKeys(record, ["limits", "schemaVersion"]) || record.schemaVersion !== 2) {
    throw new Error("Instruction budget seed must contain only schemaVersion=2 and limits; update it through a reviewed direct edit.");
  }
  if (typeof limits !== "object" || limits == null || Array.isArray(limits)) {
    throw new Error("Instruction budget seed limits must be an object.");
  }
  const limitRecord = limits as Record<string, unknown>;
  if (
    !exactKeys(limitRecord, ["discoveryMetadataTokenProxy", "globalStartupTokenProxy", "onDemandBodiesTokenProxy"]) ||
    !nonNegativeInteger(limitRecord.discoveryMetadataTokenProxy) ||
    !nonNegativeInteger(limitRecord.globalStartupTokenProxy) ||
    !nonNegativeInteger(limitRecord.onDemandBodiesTokenProxy)
  ) {
    throw new Error("Instruction budget limits must be non-negative integers for the three named boundaries.");
  }
  return {
    limits: {
      discoveryMetadataTokenProxy: limitRecord.discoveryMetadataTokenProxy,
      globalStartupTokenProxy: limitRecord.globalStartupTokenProxy,
      onDemandBodiesTokenProxy: limitRecord.onDemandBodiesTokenProxy,
    },
    schemaVersion: 2,
  };
}

function measurements(root: string): BudgetSeed["limits"] {
  return buildMaintainedInstructionBudgetMetrics(root);
}

function seedIdentity(root: string, seed: string): InstructionBudgetReport["seed"] {
  return path.resolve(seed) === path.resolve(defaultSeed(root))
    ? "<root>/config/instruction-budget.json"
    : "<external-seed>";
}

function tokenProxy(text: string): number {
  return Math.ceil(text.length / 4);
}

function measureCoreSurface(root: string): InstructionBudgetReport["core"] {
  const corePath = path.join(root, "profiles", "core.json");
  if (!fs.existsSync(corePath)) {
    return null;
  }
  const loaded = loadRuntimeSurfaceProfile(root, "core");
  if (loaded.profile == null || loaded.errors.length > 0) {
    throw new Error(loaded.errors.join("\n") || "Core runtime-surface profile is missing or unreadable.");
  }
  const resolved = resolveRuntimeSurfaceProfile(root, loaded.profile, corePath);
  if (resolved.errors.length > 0) {
    throw new Error(resolved.errors.join("\n"));
  }
  let globalStartupTokenProxy = 0;
  let discoveryMetadataTokenProxy = 0;
  for (const entry of resolved.entries) {
    const source = path.join(root, ...entry.source.split("/"));
    if (entry.destination === "AGENTS.md" || entry.destination === "principles-of-work.md") {
      globalStartupTokenProxy += tokenProxy(fs.readFileSync(source, "utf8"));
    }
    if (entry.kind === "skill" || entry.kind === "agent" || entry.kind === "command") {
      const artifact = entry.kind === "skill" ? path.join(source, "SKILL.md") : source;
      if (!fs.existsSync(artifact)) {
        throw new Error(`Core budget source is missing: ${entry.source}`);
      }
      const descriptionChars = extractDescriptionChars(fs.readFileSync(artifact, "utf8"));
      discoveryMetadataTokenProxy += descriptionChars == null ? 0 : Math.ceil(descriptionChars / 4);
    }
  }
  const boundaries: BudgetBoundary[] = [
    {
      actual: globalStartupTokenProxy,
      maximum: CORE_STARTUP_TOKEN_PROXY_CEILING,
      name: "coreStartupTokenProxy",
      status: globalStartupTokenProxy <= CORE_STARTUP_TOKEN_PROXY_CEILING ? "passed" : "failed",
    },
    {
      actual: discoveryMetadataTokenProxy,
      maximum: CORE_DISCOVERY_TOKEN_PROXY_CEILING,
      name: "coreDiscoveryMetadataTokenProxy",
      status: discoveryMetadataTokenProxy <= CORE_DISCOVERY_TOKEN_PROXY_CEILING ? "passed" : "failed",
    },
  ];
  return {
    boundaries,
    identity: {
      profileDigest: crypto.createHash("sha256").update(serializeRuntimeSurfaceProfile(loaded.profile)).digest("hex"),
      profileName: "core",
    },
  };
}

export function validateInstructionBudget(root: string, seedPath = defaultSeed(root)): InstructionBudgetReport {
  const resolvedRoot = path.resolve(root);
  const seed = parseSeed(seedPath);
  const actual = measurements(resolvedRoot);
  const boundaries = (Object.keys(seed.limits) as Array<keyof BudgetSeed["limits"]>).map((name) => ({
    actual: actual[name],
    maximum: seed.limits[name],
    name,
    status: actual[name] <= seed.limits[name] ? "passed" as const : "failed" as const,
  }));
  const core = measureCoreSurface(resolvedRoot);
  const coreFailed = core != null && core.boundaries.some((boundary) => boundary.status === "failed");
  return {
    boundaries,
    core,
    materializationCommand: MATERIALIZATION_COMMAND,
    root: "<redacted>",
    schemaVersion: 2,
    seed: seedIdentity(resolvedRoot, seedPath),
    status: boundaries.every((boundary) => boundary.status === "passed") && !coreFailed ? "passed" : "failed",
    tool: "opencode-dev-kit-instruction-budget",
  };
}

function materializeSeed(root: string, seedPath: string): void {
  const seed = parseSeed(seedPath);
  const actual = measurements(root);
  const growth = (Object.keys(seed.limits) as Array<keyof BudgetSeed["limits"]>)
    .filter((name) => actual[name] > seed.limits[name]);
  if (growth.length > 0) {
    const details = growth.map((name) => `${name} actual=${actual[name]} maximum=${seed.limits[name]}`).join(", ");
    throw new Error(`Instruction budget materialization refuses to increase reviewed maxima: ${details}. Use an explicit reviewed seed edit with rationale.`);
  }
  const next: BudgetSeed = { limits: actual, schemaVersion: 2 };
  const temporary = `${seedPath}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  fs.renameSync(temporary, seedPath);
}

function renderMarkdown(report: InstructionBudgetReport): string {
  return [
    "# Instruction Budget",
    "",
    `Status: ${report.status}`,
    "",
    "| Boundary | Actual | Maximum | Status |",
    "| --- | ---: | ---: | --- |",
    ...report.boundaries.map((boundary) =>
      `| ${boundary.name} | ${boundary.actual} | ${boundary.maximum} | ${boundary.status} |`
    ),
    "",
    ...(report.core == null
      ? []
      : [
          `Core profile: ${report.core.identity.profileName} digest ${report.core.identity.profileDigest}`,
          "",
          "| Core boundary | Actual | Maximum | Status |",
          "| --- | ---: | ---: | --- |",
          ...report.core.boundaries.map((boundary) =>
            `| ${boundary.name} | ${boundary.actual} | ${boundary.maximum} | ${boundary.status} |`
          ),
          "",
        ]),
    `Lower or retain reviewed maxima: \`${report.materializationCommand}\``,
    "",
  ].join("\n");
}

function isMainModule(): boolean {
  const entrypoint = process.argv[1];
  return Boolean(entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href);
}

if (isMainModule()) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options == null) {
      console.log(usage());
    } else {
      const seedPath = options.seed ?? defaultSeed(options.root);
      if (options.materializeSeed) materializeSeed(options.root, seedPath);
      const report = validateInstructionBudget(options.root, seedPath);
      console.log(options.format === "json" ? JSON.stringify(report, null, 2) : renderMarkdown(report));
      if (report.status === "failed") process.exitCode = 1;
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
