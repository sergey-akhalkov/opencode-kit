#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse } from "@textlint/markdown-to-ast";
import { walkMarkdownFiles } from "./validators/context.ts";

const TOOL = "opencode-dev-kit-instruction-context-quality" as const;
const SCHEMA_VERSION = 1 as const;
const ROOT_HEADING = "<root>";

type AstNode = {
  children?: readonly AstNode[];
  depth?: number;
  range: readonly [number, number];
  raw: string;
  type: string;
};

type OutputFormat = "json" | "markdown";
type Mode = "check" | "write";

export type InstructionContextCategory =
  | "agent"
  | "command"
  | "instruction"
  | "openspec-instruction"
  | "root-instruction"
  | "skill"
  | "template";

type Options = {
  format: OutputFormat;
  mode: Mode;
  root: string;
  seedPath: string;
  showRoot: boolean;
  target: string;
};

type Rule = {
  canonical: string;
  id: string;
  rationale: string;
  scope: "prose";
  source: string;
};

type Locator = {
  heading: string;
  path: string;
};

type DuplicateException = {
  consumers: Locator[];
  id: string;
  owner: Locator;
  reason: string;
};

type Seed = {
  duplicateExceptions: DuplicateException[];
  rules: Rule[];
  schemaVersion: 1;
};

type ContextQualityLocation = {
  endLine: number;
  heading: string;
  path: string;
  startLine: number;
};

export type ContextQualityFinding = {
  code: string;
  digest?: string;
  exceptionId?: string;
  locations: ContextQualityLocation[];
  message: string;
  ruleId?: string;
  semanticStatus?: "unknown";
};

export type InstructionContextQualityReport = {
  changedFiles: string[];
  deterministicErrors: ContextQualityFinding[];
  duplicateExceptions: {
    active: number;
    total: number;
  };
  files: {
    afterChars: number;
    beforeChars: number;
    path: string;
    safeFixes: number;
  }[];
  measurements: {
    afterChars: number;
    beforeChars: number;
    files: number;
  };
  mode: Mode;
  reviewOnly: ContextQualityFinding[];
  root: string;
  safeFixes: ContextQualityFinding[];
  status: "failed" | "needs-fixes" | "passed";
  tool: typeof TOOL;
  version: typeof SCHEMA_VERSION;
};

type TextFile = {
  absolute: string;
  path: string;
  text: string;
};

type Block = {
  digest: string;
  location: ContextQualityLocation;
  normalized: string;
};

type Fix = {
  canonical: string;
  end: number;
  location: ContextQualityLocation;
  ruleId: string;
  source: string;
  start: number;
};

type ProtectedValue = {
  end: number;
  kind: string;
  start: number;
  value: string;
};

type FileAnalysis = {
  blocks: Block[];
  fixes: Fix[];
  headingCounts: Map<string, number>;
  protectedValues: ProtectedValue[];
  reviewOnly: ContextQualityFinding[];
};

class ContextQualityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContextQualityError";
  }
}

function defaultRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

function printUsage(): void {
  console.log(`Usage:
  npm run instruction:canonicalize -- [options]

Options:
  --check [path]            Check a maintained Markdown root or file (default).
  --write [path]            Apply reviewed safe fixes after fixed-point validation.
  --root <path>             Repository root that owns the seed. Default: this repository.
  --seed <path>             Reviewed seed. Default: config/instruction-context-quality.json.
  --format <json|markdown>  Output format. Default: markdown.
  --show-root               Include the absolute root path. Default redacts it.
  --help, -h                Show this effect-free help.
`);
}

function readValue(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith("-")) throw new Error(`Missing value for ${option}.`);
  return value;
}

function parseFormat(value: string): OutputFormat {
  if (value === "json" || value === "markdown") return value;
  throw new Error("--format must be json or markdown.");
}

function optionalPath(args: string[], index: number): string | null {
  const value = args[index + 1];
  return value && !value.startsWith("-") ? value : null;
}

function parseArgs(args: string[]): Options {
  if (args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }
  let root = defaultRoot();
  let seedPath: string | null = null;
  let target: string | null = null;
  let mode: Mode = "check";
  let modeSeen = false;
  let format: OutputFormat = "markdown";
  let showRoot = false;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--root") {
      root = readValue(args, index, arg);
      index++;
    } else if (arg.startsWith("--root=")) {
      root = arg.slice("--root=".length);
    } else if (arg === "--seed") {
      seedPath = readValue(args, index, arg);
      index++;
    } else if (arg.startsWith("--seed=")) {
      seedPath = arg.slice("--seed=".length);
    } else if (arg === "--format") {
      format = parseFormat(readValue(args, index, arg));
      index++;
    } else if (arg.startsWith("--format=")) {
      format = parseFormat(arg.slice("--format=".length));
    } else if (arg === "--show-root") {
      showRoot = true;
    } else if (arg === "--check" || arg === "--write") {
      if (modeSeen) throw new Error("Choose exactly one of --check or --write.");
      modeSeen = true;
      mode = arg === "--write" ? "write" : "check";
      const value = optionalPath(args, index);
      if (value != null) {
        target = value;
        index++;
      }
    } else if (arg.startsWith("--check=") || arg.startsWith("--write=")) {
      if (modeSeen) throw new Error("Choose exactly one of --check or --write.");
      modeSeen = true;
      mode = arg.startsWith("--write=") ? "write" : "check";
      target = arg.slice(arg.indexOf("=") + 1);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  root = path.resolve(root);
  return {
    format,
    mode,
    root,
    seedPath: path.resolve(seedPath ?? path.join(root, "config", "instruction-context-quality.json")),
    showRoot,
    target: path.resolve(target ?? root),
  };
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function exactKeys(record: Record<string, unknown>, expected: string[], label: string): void {
  const actual = Object.keys(record).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    throw new Error(`${label} keys must be exactly: ${wanted.join(", ")}.`);
  }
}

function requiredString(record: Record<string, unknown>, key: string, label: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label}.${key} must be a non-empty string.`);
  }
  return value;
}

function parseLocator(value: unknown, label: string): Locator {
  const record = asRecord(value, label);
  exactKeys(record, ["heading", "path"], label);
  const relative = requiredString(record, "path", label).replaceAll("\\", "/");
  if (path.posix.isAbsolute(relative) || relative.split("/").includes("..")) {
    throw new Error(`${label}.path must be a repository-relative path.`);
  }
  return { heading: requiredString(record, "heading", label), path: relative };
}

function validateSortedIds(rows: { id: string }[], label: string): void {
  const ids = rows.map((row) => row.id);
  if (new Set(ids).size !== ids.length) throw new Error(`${label} ids must be unique.`);
  const sorted = [...ids].sort((left, right) => left.localeCompare(right));
  if (JSON.stringify(ids) !== JSON.stringify(sorted)) throw new Error(`${label} must be stably sorted by id.`);
}

function validateRuleCycles(rules: Rule[]): void {
  const bySource = new Map(rules.map((rule) => [rule.source, rule]));
  for (const rule of rules) {
    const seen = new Set<string>([rule.source]);
    let next = rule.canonical;
    while (bySource.has(next)) {
      if (seen.has(next)) throw new Error(`Canonicalization rule cycle includes ${[...seen, next].join(" -> ")}.`);
      seen.add(next);
      next = bySource.get(next)!.canonical;
    }
  }
}

function loadSeed(seedPath: string): Seed {
  try {
    const root = asRecord(JSON.parse(fs.readFileSync(seedPath, "utf8")), "Context-quality seed");
    exactKeys(root, ["duplicateExceptions", "rules", "schemaVersion"], "Context-quality seed");
    if (root.schemaVersion !== SCHEMA_VERSION) throw new Error(`Context-quality seed schemaVersion must be ${SCHEMA_VERSION}.`);
    if (!Array.isArray(root.rules)) throw new Error("Context-quality seed.rules must be an array.");
    if (!Array.isArray(root.duplicateExceptions)) throw new Error("Context-quality seed.duplicateExceptions must be an array.");
    const rules = root.rules.map((value, index): Rule => {
      const label = `Context-quality seed.rules[${index}]`;
      const record = asRecord(value, label);
      exactKeys(record, ["canonical", "id", "rationale", "scope", "source"], label);
      const scope = requiredString(record, "scope", label);
      if (scope !== "prose") throw new Error(`${label}.scope must be prose.`);
      const rule = {
        canonical: requiredString(record, "canonical", label),
        id: requiredString(record, "id", label),
        rationale: requiredString(record, "rationale", label),
        scope,
        source: requiredString(record, "source", label),
      };
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(rule.id)) throw new Error(`${label}.id must be lowercase hyphen-separated.`);
      if (rule.source === rule.canonical) throw new Error(`${label} must change its exact source form.`);
      if (/\r|\n/.test(rule.source) || /\r|\n/.test(rule.canonical)) throw new Error(`${label} forms must be single-line.`);
      return rule;
    });
    const duplicateExceptions = root.duplicateExceptions.map((value, index): DuplicateException => {
      const label = `Context-quality seed.duplicateExceptions[${index}]`;
      const record = asRecord(value, label);
      exactKeys(record, ["consumers", "id", "owner", "reason"], label);
      if (!Array.isArray(record.consumers) || record.consumers.length === 0) {
        throw new Error(`${label}.consumers must be a non-empty array.`);
      }
      const consumers = record.consumers.map((item, consumerIndex) => parseLocator(item, `${label}.consumers[${consumerIndex}]`));
      const sorted = [...consumers].sort((left, right) => left.path.localeCompare(right.path) || left.heading.localeCompare(right.heading));
      if (JSON.stringify(consumers) !== JSON.stringify(sorted)) throw new Error(`${label}.consumers must be stably sorted.`);
      const exception = {
        consumers,
        id: requiredString(record, "id", label),
        owner: parseLocator(record.owner, `${label}.owner`),
        reason: requiredString(record, "reason", label),
      };
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(exception.id)) throw new Error(`${label}.id must be lowercase hyphen-separated.`);
      const locators = [exception.owner, ...exception.consumers].map(locatorKey);
      if (new Set(locators).size !== locators.length) throw new Error(`${label} owner and consumers must be unique locations.`);
      return exception;
    });
    validateSortedIds(rules, "Context-quality rules");
    validateSortedIds(duplicateExceptions, "Context-quality duplicate exceptions");
    if (new Set(rules.map((rule) => rule.source)).size !== rules.length) {
      throw new Error("Context-quality rule source forms must be unique.");
    }
    validateRuleCycles(rules);
    return { duplicateExceptions, rules, schemaVersion: SCHEMA_VERSION };
  } catch (error) {
    throw new ContextQualityError(`Context-quality seed is unreadable or malformed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function instructionContextCategory(relative: string): InstructionContextCategory | null {
  const normalized = relative.replaceAll("\\", "/");
  if (/^(?:global|\.opencode)\/agents?\/[^/]+\.md$/.test(normalized)) return "agent";
  if (/^(?:global|\.opencode)\/commands?\/[^/]+\.md$/.test(normalized)) return "command";
  if (/^(?:global|\.opencode)\/skills?\/[^/]+\/SKILL\.md$/.test(normalized)) return "skill";
  if (normalized === "global/AGENTS.md" || normalized === "global/principles-of-work.md") return "instruction";
  if (normalized === "AGENTS.md" || normalized === "REPO_AGENTS.md") return "root-instruction";
  if (/^instructions\/.+\.md$/.test(normalized)) return "instruction";
  if (/^templates\/.+\.md$/.test(normalized)) return "template";
  if (normalized === "openspec/project.md" || /^openspec\/(?:instructions|rules|templates)\/.+\.md$/.test(normalized)) {
    return "openspec-instruction";
  }
  return null;
}

function selectionFiles(root: string, target: string): TextFile[] {
  let stat: fs.Stats;
  try {
    stat = fs.statSync(target);
  } catch (error) {
    throw new ContextQualityError(`Target is unreadable: ${error instanceof Error && "code" in error ? String((error as NodeJS.ErrnoException).code) : String(error)}`);
  }
  const selectionRoot = stat.isDirectory() ? target : path.dirname(target);
  const candidates = stat.isDirectory() ? walkMarkdownFiles(target) : [target];
  const files: TextFile[] = [];
  for (const absolute of candidates) {
    if (!fs.statSync(absolute).isFile() || path.extname(absolute).toLowerCase() !== ".md") continue;
    const rootRelative = path.relative(root, absolute).replaceAll("\\", "/");
    const selectionRelative = path.relative(selectionRoot, absolute).replaceAll("\\", "/");
    const categoryPath = rootRelative.startsWith("../") || path.isAbsolute(rootRelative) ? selectionRelative : rootRelative;
    if (stat.isDirectory() && instructionContextCategory(categoryPath) == null) continue;
    files.push({ absolute, path: categoryPath || path.basename(absolute), text: fs.readFileSync(absolute, "utf8") });
  }
  return files.sort((left, right) => left.path.localeCompare(right.path));
}

function digest(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function lineAt(text: string, offset: number): number {
  return text.slice(0, Math.max(0, offset)).split(/\r?\n/).length;
}

function location(file: TextFile, heading: string, start: number, end: number): ContextQualityLocation {
  return { endLine: lineAt(file.text, end), heading, path: file.path, startLine: lineAt(file.text, start) };
}

function normalizeBlock(raw: string): string {
  return raw.replace(/\r\n?/g, "\n").trim();
}

function isQuotedBlock(value: string): boolean {
  return (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"));
}

function isStructuralLabel(value: string): boolean {
  if (/^[A-Z][A-Za-z0-9/-]{0,30}:$/.test(value)) return true;
  return /^(?:\*\*|__)[A-Z][A-Za-z0-9 /&-]{0,40}:?(?:\*\*|__)$/.test(value);
}

function hasUnprotectedText(node: AstNode, protectedAncestor = false): boolean {
  const protectedHere = protectedAncestor || ["Code", "CodeBlock", "Link", "LinkReference"].includes(node.type);
  if (node.type === "Str" && !protectedHere && node.raw.trim() !== "") return true;
  return (node.children ?? []).some((child) => hasUnprotectedText(child, protectedHere));
}

function intersects(start: number, end: number, range: { start: number; end: number }): boolean {
  return start < range.end && end > range.start;
}

function regexProtectedValues(text: string): ProtectedValue[] {
  const patterns: [string, RegExp][] = [
    ["url", /\bhttps?:\/\/[^\s)>]+/gu],
    ["command-or-flag", /(?:^|\s)(?:--?[a-z][a-z0-9-]*|npm\s+run\s+[a-z0-9:_-]+)(?=\s|$)/gimu],
    ["path", /(?:[A-Za-z]:[\\/]|(?:^|\s)(?:\.{0,2}[\\/]|[A-Za-z0-9_.-]+[\\/]))[^\s`"']+/gmu],
    ["number", /\b\d+(?:[.,]\d+)?\b/gu],
    ["modal", /\b(?:MUST|SHALL|SHOULD|MAY|REQUIRED|NEVER)(?:\s+NOT)?\b/gu],
    ["negation", /\b(?:no|not|never|without)\b/giu],
    ["condition", /\b(?:if|when|unless|otherwise|except|excluding)\b/giu],
    ["identifier", /\b(?:[a-z]+[A-Z][A-Za-z0-9]*|[A-Za-z][A-Za-z0-9]*_[A-Za-z0-9_]+)\b/gu],
    ["quoted-requirement", /"[^"\r\n]+"/gu],
  ];
  const values: ProtectedValue[] = [];
  for (const [kind, pattern] of patterns) {
    for (const match of text.matchAll(pattern)) {
      const start = match.index ?? 0;
      values.push({ end: start + match[0].length, kind, start, value: match[0] });
    }
  }
  if (/^---\r?\n/.test(text)) {
    const match = text.match(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/);
    if (!match) throw new ContextQualityError("Markdown frontmatter is not terminated.");
    values.push({ end: match[0].length, kind: "frontmatter", start: 0, value: match[0] });
  }
  return values;
}

function protectedSignature(values: ProtectedValue[]): string[] {
  return values.map((value) => `${value.kind}:${value.value}`).sort((left, right) => left.localeCompare(right));
}

function analyzeFile(file: TextFile, rules: Rule[]): FileAnalysis {
  let ast: AstNode;
  try {
    ast = parse(file.text) as unknown as AstNode;
  } catch (error) {
    throw new ContextQualityError(`Markdown parse failed for ${file.path}: ${error instanceof Error ? error.message : String(error)}`);
  }
  const blocks: Block[] = [];
  const fixes: Fix[] = [];
  const reviewOnly: ContextQualityFinding[] = [];
  const protectedValues = regexProtectedValues(file.text);
  const headingCounts = new Map<string, number>();
  const headingStack: string[] = [];
  const currentHeading = (): string => headingStack.filter(Boolean).join(" > ") || ROOT_HEADING;

  const visit = (node: AstNode, ancestors: string[]): void => {
    if (node.type === "Header") {
      const depth = node.depth ?? 1;
      headingStack.length = depth - 1;
      headingStack[depth - 1] = node.raw.replace(/^#{1,6}\s+/, "").trim();
      headingCounts.set(currentHeading(), (headingCounts.get(currentHeading()) ?? 0) + 1);
    }
    if (node.type === "Paragraph" && !ancestors.some((type) => ["BlockQuote", "Table", "TableCell"].includes(type))) {
      const normalized = normalizeBlock(file.text.slice(node.range[0], node.range[1]));
      if (normalized !== "" && hasUnprotectedText(node) && !isQuotedBlock(normalized) && !isStructuralLabel(normalized)) {
        const here = location(file, currentHeading(), node.range[0], node.range[1]);
        blocks.push({ digest: digest(normalized), location: here, normalized });
      }
    }
    if (["Code", "CodeBlock", "Link", "LinkReference"].includes(node.type)) {
      protectedValues.push({
        end: node.range[1],
        kind: node.type === "Code" || node.type === "CodeBlock" ? "code" : "link",
        start: node.range[0],
        value: file.text.slice(node.range[0], node.range[1]),
      });
    }
    if (node.type === "Str" && !ancestors.some((type) => ["BlockQuote", "Code", "CodeBlock", "Header", "Link", "LinkReference", "Table", "TableCell"].includes(type))) {
      for (const rule of rules) {
        let from = 0;
        while (from <= node.raw.length - rule.source.length) {
          const relative = node.raw.indexOf(rule.source, from);
          if (relative < 0) break;
          const start = node.range[0] + relative;
          const end = start + rule.source.length;
          const here = location(file, currentHeading(), start, end);
          if (protectedValues.some((value) => intersects(start, end, value))) {
            reviewOnly.push({
              code: "protected-approved-form",
              locations: [here],
              message: `Rule ${rule.id} intersects a protected value and remains review-only.`,
              ruleId: rule.id,
              semanticStatus: "unknown",
            });
          } else {
            fixes.push({ canonical: rule.canonical, end, location: here, ruleId: rule.id, source: rule.source, start });
          }
          from = relative + Math.max(1, rule.source.length);
        }
      }
    }
    for (const child of node.children ?? []) visit(child, [...ancestors, node.type]);
  };
  visit(ast, []);
  return { blocks, fixes, headingCounts, protectedValues, reviewOnly };
}

function findingOrder(left: ContextQualityFinding, right: ContextQualityFinding): number {
  return left.code.localeCompare(right.code) ||
    (left.locations[0]?.path ?? "").localeCompare(right.locations[0]?.path ?? "") ||
    (left.locations[0]?.startLine ?? 0) - (right.locations[0]?.startLine ?? 0) ||
    (left.ruleId ?? "").localeCompare(right.ruleId ?? "");
}

function applyFixes(file: TextFile, analysis: FileAnalysis): { errors: ContextQualityFinding[]; text: string } {
  const fixes = [...analysis.fixes].sort((left, right) => left.start - right.start || left.end - right.end || left.ruleId.localeCompare(right.ruleId));
  const errors: ContextQualityFinding[] = [];
  for (let index = 1; index < fixes.length; index++) {
    if (fixes[index].start < fixes[index - 1].end) {
      errors.push({
        code: "overlapping-fixes",
        locations: [fixes[index - 1].location, fixes[index].location],
        message: `Rules ${fixes[index - 1].ruleId} and ${fixes[index].ruleId} overlap.`,
      });
    }
  }
  if (errors.length > 0) return { errors, text: file.text };
  let candidate = file.text;
  for (const fix of fixes.reverse()) {
    candidate = `${candidate.slice(0, fix.start)}${fix.canonical}${candidate.slice(fix.end)}`;
  }
  return { errors, text: candidate };
}

function locatorKey(locator: Locator): string {
  return `${locator.path}\u0000${locator.heading}`;
}

function evaluateDuplicates(
  analyses: Map<string, FileAnalysis>,
  exceptions: DuplicateException[],
  completePopulation: boolean,
): { activeExceptions: number; errors: ContextQualityFinding[] } {
  const allBlocks = [...analyses.values()].flatMap((analysis) => analysis.blocks);
  const selectedPaths = new Set(analyses.keys());
  const byLocator = new Map<string, Block[]>();
  for (const block of allBlocks) {
    const key = locatorKey({ path: block.location.path, heading: block.location.heading });
    byLocator.set(key, [...(byLocator.get(key) ?? []), block]);
  }
  const covered = new Map<string, string>();
  const errors: ContextQualityFinding[] = [];
  let activeExceptions = 0;
  for (const exception of exceptions) {
    const locators = [exception.owner, ...exception.consumers];
    const selected = locators.filter((locator) => selectedPaths.has(locator.path));
    if (selected.length === 0 && !completePopulation) continue;
    activeExceptions++;
    if (selected.length !== locators.length) {
      const missing = locators.filter((locator) => !selectedPaths.has(locator.path));
      errors.push({
        code: "orphaned-duplicate-exception",
        exceptionId: exception.id,
        locations: [],
        message: `Exception ${exception.id} names paths outside the maintained population: ${missing.map((locator) => locator.path).join(", ")}.`,
      });
      continue;
    }
    const groups = locators.map((locator) => byLocator.get(locatorKey(locator)) ?? []);
    const duplicateHeading = locators.find((locator) => (analyses.get(locator.path)?.headingCounts.get(locator.heading) ?? 0) > 1);
    if (duplicateHeading) {
      errors.push({ code: "ambiguous-exception-heading", exceptionId: exception.id, locations: [], message: `Exception ${exception.id} points to duplicate heading ${duplicateHeading.heading} in ${duplicateHeading.path}.` });
      continue;
    }
    const shared = groups.reduce<Set<string>>((intersection, group, index) => {
      const values = new Set(group.map((block) => block.normalized));
      return index === 0 ? values : new Set([...intersection].filter((value) => values.has(value)));
    }, new Set<string>());
    if (shared.size === 0) {
      errors.push({ code: "stale-duplicate-exception", exceptionId: exception.id, locations: [], message: `Exception ${exception.id} must resolve to exactly one shared operative block.` });
      continue;
    }
    const expectedKeys = locators.map(locatorKey).sort();
    const exactMatches = [...shared].filter((normalized) => {
      const blockDigest = digest(normalized);
      const actualKeys = allBlocks
        .filter((block) => block.digest === blockDigest)
        .map((block) => locatorKey({ path: block.location.path, heading: block.location.heading }))
        .sort();
      return JSON.stringify(expectedKeys) === JSON.stringify(actualKeys);
    });
    if (exactMatches.length !== 1) {
      const code = exactMatches.length === 0 ? "broad-duplicate-exception" : "ambiguous-duplicate-exception";
      errors.push({ code, exceptionId: exception.id, locations: [], message: `Exception ${exception.id} must resolve to exactly one shared operative block with every and only the named occurrences.` });
      continue;
    }
    const blockDigest = digest(exactMatches[0]);
    const actual = allBlocks.filter((block) => block.digest === blockDigest);
    if (covered.has(blockDigest)) {
      errors.push({ code: "duplicate-exception-owner", digest: blockDigest, exceptionId: exception.id, locations: actual.map((block) => block.location), message: `Exceptions ${covered.get(blockDigest)} and ${exception.id} cover the same block.` });
      continue;
    }
    covered.set(blockDigest, exception.id);
  }

  const byDigest = new Map<string, Block[]>();
  for (const block of allBlocks) byDigest.set(block.digest, [...(byDigest.get(block.digest) ?? []), block]);
  for (const [blockDigest, blocks] of byDigest) {
    if (blocks.length < 2) continue;
    const byPath = new Map<string, Block[]>();
    for (const block of blocks) byPath.set(block.location.path, [...(byPath.get(block.location.path) ?? []), block]);
    for (const sameFileBlocks of byPath.values()) {
      if (sameFileBlocks.length < 2) continue;
      errors.push({ code: "same-file-duplicate", digest: blockDigest, locations: sameFileBlocks.map((block) => block.location), message: "An exact operative block repeats inside one maintained file." });
    }
    if (byPath.size > 1 && !covered.has(blockDigest)) {
      errors.push({ code: "cross-file-duplicate", digest: blockDigest, locations: blocks.map((block) => block.location), message: "An exact operative block repeats across maintained files without one reviewed loader exception." });
    }
  }
  return { activeExceptions, errors: errors.sort(findingOrder) };
}

function safeFixFindings(analyses: Map<string, FileAnalysis>): ContextQualityFinding[] {
  return [...analyses.values()].flatMap((analysis) => analysis.fixes.map((fix) => ({
    code: "approved-safe-fix",
    locations: [fix.location],
    message: `Reviewed rule ${fix.ruleId} has one applicable prose occurrence.`,
    ruleId: fix.ruleId,
  }))).sort(findingOrder);
}

function writeAtomically(staged: { file: TextFile; text: string }[]): void {
  const changed = staged.filter((entry) => entry.text !== entry.file.text);
  const tempFiles: string[] = [];
  const written: typeof changed = [];
  try {
    for (const entry of changed) {
      const temporary = path.join(path.dirname(entry.file.absolute), `.${path.basename(entry.file.absolute)}.instruction-context-quality-${process.pid}-${crypto.randomUUID()}.tmp`);
      fs.writeFileSync(temporary, entry.text, "utf8");
      tempFiles.push(temporary);
    }
    for (let index = 0; index < changed.length; index++) {
      fs.renameSync(tempFiles[index], changed[index].file.absolute);
      written.push(changed[index]);
    }
  } catch (error) {
    const rollbackErrors: string[] = [];
    for (const entry of written.reverse()) {
      try {
        const temporary = `${entry.file.absolute}.instruction-context-quality-rollback-${process.pid}`;
        fs.writeFileSync(temporary, entry.file.text, "utf8");
        fs.renameSync(temporary, entry.file.absolute);
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError instanceof Error ? rollbackError.message : String(rollbackError));
      }
    }
    throw new ContextQualityError(`Atomic write failed: ${error instanceof Error ? error.message : String(error)}${rollbackErrors.length > 0 ? `; rollback failed: ${rollbackErrors.join("; ")}` : ""}`);
  } finally {
    for (const temporary of tempFiles) {
      try {
        if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
      } catch {
        // The original failure remains the owning diagnostic.
      }
    }
  }
}

export function evaluateInstructionContextQuality(input: {
  mode?: Mode;
  root?: string;
  seedPath?: string;
  showRoot?: boolean;
  target?: string;
} = {}): InstructionContextQualityReport {
  const root = path.resolve(input.root ?? defaultRoot());
  const target = path.resolve(input.target ?? root);
  const mode = input.mode ?? "check";
  const seedPath = path.resolve(input.seedPath ?? path.join(root, "config", "instruction-context-quality.json"));
  const seed = loadSeed(seedPath);
  const files = selectionFiles(root, target);
  const originalAnalyses = new Map<string, FileAnalysis>();
  const staged: { file: TextFile; text: string }[] = [];
  const deterministicErrors: ContextQualityFinding[] = [];
  for (const file of files) {
    const analysis = analyzeFile(file, seed.rules);
    originalAnalyses.set(file.path, analysis);
    const applied = applyFixes(file, analysis);
    deterministicErrors.push(...applied.errors);
    staged.push({ file, text: applied.text });
  }

  const stagedAnalyses = new Map<string, FileAnalysis>();
  for (const entry of staged) {
    const stagedFile = { ...entry.file, text: entry.text };
    const analysis = analyzeFile(stagedFile, seed.rules);
    stagedAnalyses.set(entry.file.path, analysis);
    if (entry.text !== entry.file.text && analysis.fixes.length > 0) {
      deterministicErrors.push({ code: "non-idempotent-output", locations: analysis.fixes.map((fix) => fix.location), message: `Second pass still changes ${entry.file.path}.` });
    }
    const before = protectedSignature(originalAnalyses.get(entry.file.path)!.protectedValues);
    const after = protectedSignature(analysis.protectedValues);
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      deterministicErrors.push({ code: "protected-value-change", locations: [], message: `Protected values changed in ${entry.file.path}.` });
    }
  }

  const duplicateInput = mode === "write" ? stagedAnalyses : originalAnalyses;
  const completePopulation = fs.statSync(target).isDirectory() && path.resolve(target) === root;
  const duplicateResult = evaluateDuplicates(duplicateInput, seed.duplicateExceptions, completePopulation);
  deterministicErrors.push(...duplicateResult.errors);
  deterministicErrors.sort(findingOrder);
  const fixes = safeFixFindings(originalAnalyses);
  const reviewOnly = [...originalAnalyses.values()].flatMap((analysis) => analysis.reviewOnly).sort(findingOrder);
  const changedFiles = staged.filter((entry) => entry.text !== entry.file.text).map((entry) => entry.file.path);
  if (mode === "write" && deterministicErrors.length === 0) writeAtomically(staged);
  const status = deterministicErrors.length > 0 ? "failed" : mode === "check" && fixes.length > 0 ? "needs-fixes" : "passed";
  return {
    changedFiles: mode === "write" && status === "passed" ? changedFiles : [],
    deterministicErrors,
    duplicateExceptions: { active: duplicateResult.activeExceptions, total: seed.duplicateExceptions.length },
    files: staged.map((entry) => ({
      afterChars: entry.text.length,
      beforeChars: entry.file.text.length,
      path: entry.file.path,
      safeFixes: originalAnalyses.get(entry.file.path)!.fixes.length,
    })),
    measurements: {
      afterChars: staged.reduce((sum, entry) => sum + entry.text.length, 0),
      beforeChars: files.reduce((sum, file) => sum + file.text.length, 0),
      files: files.length,
    },
    mode,
    reviewOnly,
    root: input.showRoot ? root : "<redacted>",
    safeFixes: fixes,
    status,
    tool: TOOL,
    version: SCHEMA_VERSION,
  };
}

function renderLocations(locations: ContextQualityLocation[]): string {
  return locations.map((item) => `${item.path}:${item.startLine}-${item.endLine} [${item.heading}]`).join("; ");
}

function renderMarkdown(report: InstructionContextQualityReport): string {
  const findings = (title: string, rows: ContextQualityFinding[]): string[] => [
    `## ${title}`,
    "",
    rows.length === 0 ? "none" : rows.map((row) => `- ${row.code}${row.ruleId ? ` (${row.ruleId})` : ""}: ${row.message}${row.locations.length > 0 ? ` ${renderLocations(row.locations)}` : ""}`).join("\n"),
    "",
  ];
  return [
    "# Instruction Context Quality",
    "",
    `Status: ${report.status}`,
    `Mode: ${report.mode}`,
    `Root: ${report.root}`,
    `Files: ${report.measurements.files}`,
    `Chars: ${report.measurements.beforeChars} -> ${report.measurements.afterChars}`,
    `Changed files: ${report.changedFiles.length}`,
    `Duplicate exceptions: ${report.duplicateExceptions.active}/${report.duplicateExceptions.total} active`,
    "",
    ...findings("Safe Fixes", report.safeFixes),
    ...findings("Deterministic Errors", report.deterministicErrors),
    ...findings("Review Only", report.reviewOnly),
  ].join("\n");
}

function redactError(error: unknown, options: Options): string {
  const message = error instanceof Error ? error.message : String(error);
  if (options.showRoot) return message;
  return message.replaceAll(options.root, "<root>").replaceAll(options.root.replaceAll("\\", "/"), "<root>")
    .replaceAll(options.target, "<target>").replaceAll(options.target.replaceAll("\\", "/"), "<target>")
    .replaceAll(options.seedPath, "<seed>").replaceAll(options.seedPath.replaceAll("\\", "/"), "<seed>");
}

function isMainModule(): boolean {
  const entrypoint = process.argv[1];
  return Boolean(entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href);
}

if (isMainModule()) {
  let options: Options | null = null;
  try {
    options = parseArgs(process.argv.slice(2));
    const report = evaluateInstructionContextQuality(options);
    console.log(options.format === "json" ? JSON.stringify(report, null, 2) : renderMarkdown(report));
    if (report.status !== "passed") process.exitCode = 1;
  } catch (error) {
    const fallback: Options = options ?? {
      format: "markdown",
      mode: "check",
      root: defaultRoot(),
      seedPath: path.join(defaultRoot(), "config", "instruction-context-quality.json"),
      showRoot: false,
      target: defaultRoot(),
    };
    console.error(`ERROR: ${redactError(error, fallback)}`);
    process.exitCode = 1;
  }
}
