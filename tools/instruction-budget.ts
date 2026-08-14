#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { buildCatalogInventory } from "./instruction-artifacts-inventory.ts";

type OutputFormat = "json" | "markdown";

type BudgetSeed = {
  limits: {
    catalogTokenProxy: number;
    globalAuthorityTokenProxy: number;
  };
  schemaVersion: 1;
};

export type InstructionBudgetReport = {
  boundaries: Array<{
    actual: number;
    maximum: number;
    name: keyof BudgetSeed["limits"];
    status: "failed" | "passed";
  }>;
  regenerationCommand: "npm run instruction:budget -- --materialize-seed";
  root: "<redacted>";
  schemaVersion: 1;
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

const REGENERATION_COMMAND = "npm run instruction:budget -- --materialize-seed" as const;

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
    "  --materialize-seed     Replace the selected seed with current reviewed maxima.",
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

function positiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function parseSeed(seedPath: string): BudgetSeed {
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  } catch {
    throw new Error(`Instruction budget seed is unreadable or malformed. Regenerate with: ${REGENERATION_COMMAND}`);
  }
  if (typeof parsed !== "object" || parsed == null || Array.isArray(parsed)) {
    throw new Error(`Instruction budget seed must be an object. Regenerate with: ${REGENERATION_COMMAND}`);
  }
  const record = parsed as Record<string, unknown>;
  const limits = record.limits;
  if (!exactKeys(record, ["limits", "schemaVersion"]) || record.schemaVersion !== 1) {
    throw new Error(`Instruction budget seed must contain only schemaVersion=1 and limits. Regenerate with: ${REGENERATION_COMMAND}`);
  }
  if (typeof limits !== "object" || limits == null || Array.isArray(limits)) {
    throw new Error(`Instruction budget seed limits must be an object. Regenerate with: ${REGENERATION_COMMAND}`);
  }
  const limitRecord = limits as Record<string, unknown>;
  if (
    !exactKeys(limitRecord, ["catalogTokenProxy", "globalAuthorityTokenProxy"]) ||
    !positiveInteger(limitRecord.catalogTokenProxy) ||
    !positiveInteger(limitRecord.globalAuthorityTokenProxy)
  ) {
    throw new Error(`Instruction budget limits must be positive integers for both named boundaries. Regenerate with: ${REGENERATION_COMMAND}`);
  }
  return {
    limits: {
      catalogTokenProxy: limitRecord.catalogTokenProxy,
      globalAuthorityTokenProxy: limitRecord.globalAuthorityTokenProxy,
    },
    schemaVersion: 1,
  };
}

function measurements(root: string): BudgetSeed["limits"] {
  const authority = path.join(root, "global", "AGENTS.md");
  let authorityText: string;
  try {
    authorityText = fs.readFileSync(authority, "utf8");
  } catch {
    throw new Error("Committed global startup authority is unreadable: global/AGENTS.md");
  }
  return {
    catalogTokenProxy: buildCatalogInventory(root).totals.tokenProxy,
    globalAuthorityTokenProxy: Math.ceil(authorityText.length / 4),
  };
}

function seedIdentity(root: string, seed: string): InstructionBudgetReport["seed"] {
  return path.resolve(seed) === path.resolve(defaultSeed(root))
    ? "<root>/config/instruction-budget.json"
    : "<external-seed>";
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
  return {
    boundaries,
    regenerationCommand: REGENERATION_COMMAND,
    root: "<redacted>",
    schemaVersion: 1,
    seed: seedIdentity(resolvedRoot, seedPath),
    status: boundaries.every((boundary) => boundary.status === "passed") ? "passed" : "failed",
    tool: "opencode-dev-kit-instruction-budget",
  };
}

function materializeSeed(root: string, seedPath: string): void {
  const seed: BudgetSeed = { limits: measurements(root), schemaVersion: 1 };
  fs.mkdirSync(path.dirname(seedPath), { recursive: true });
  const temporary = `${seedPath}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(seed, null, 2)}\n`, "utf8");
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
    `Regenerate reviewed maxima: \`${report.regenerationCommand}\``,
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
