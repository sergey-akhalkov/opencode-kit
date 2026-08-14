#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  inspectLoaderVisibleInstructionManifest,
  type InstructionEvidenceClass,
  type LoaderVisibleInstructionSource,
} from "./opencode-runtime-sources.ts";
import { walkMarkdownFiles } from "./validators/context.ts";

type OutputFormat = "json" | "markdown";
type SourceScope = "catalog" | "loader-visible";

type Options = {
  format: OutputFormat;
  project: string | null;
  root: string;
  showRoot: boolean;
  sourceScope: SourceScope;
};

type ArtifactKind = "agent" | "instruction" | "root" | "skill" | "template";

type Artifact = {
  chars: number;
  descriptionChars: number | null;
  kind: ArtifactKind;
  lines: number;
  path: string;
  tokenProxy: number;
};

type RepeatedLine = {
  count: number;
  line: string;
};

export type InstructionInventory = {
  artifacts: Artifact[];
  counts: Record<ArtifactKind, number>;
  repeatedLines: RepeatedLine[];
  root: string;
  totals: {
    artifacts: number;
    chars: number;
    lines: number;
    tokenProxy: number;
  };
  tool: "opencode-dev-kit-instruction-artifacts-inventory";
  version: 1;
};

type LoaderVisibleMetric = {
  chars: number;
  lines: number;
  tokenProxy: number;
};

type LoaderVisibleSourceReport = Omit<LoaderVisibleInstructionSource, "file"> & {
  discoveryMetadata: Omit<LoaderVisibleMetric, "lines"> | null;
  metrics: LoaderVisibleMetric | null;
  status: "measured" | "unknown";
};

type LoaderVisibleCategory = LoaderVisibleMetric & {
  artifacts: number;
  unknowns: number;
};

type LoaderVisibleInventory = {
  categories: {
    discoveryMetadata: LoaderVisibleCategory;
    onDemandBodies: LoaderVisibleCategory;
    startupVisibleCandidates: LoaderVisibleCategory;
  };
  evidenceClasses: Record<InstructionEvidenceClass, number>;
  project: string;
  sourceScope: "loader-visible";
  sources: LoaderVisibleSourceReport[];
  tool: "opencode-dev-kit-instruction-artifacts-inventory";
  totals: {
    measuredSources: number;
    unknownSources: number;
  };
  version: 2;
  warnings: string[];
};

function defaultRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

function printUsage(): void {
  console.log(`Usage:
  npm run instruction:inventory -- [options]

Options:
  --root <path>             Repository root. Default: this repository.
  --project <path>          Project to inspect. Required for loader-visible scope.
  --source-scope <scope>    catalog (default) or loader-visible.
  --format <json|markdown>  Output format. Default: markdown.
  --show-root               Include absolute root path. Default redacts it.
  --help                    Show this help.
`);
}

function readValue(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (!value || value.trim() === "" || value.startsWith("--")) {
    throw new Error(`Missing value for ${option}.`);
  }
  return value;
}

function parseFormat(value: string): OutputFormat {
  if (value === "json" || value === "markdown") {
    return value;
  }
  throw new Error("--format must be json or markdown.");
}

function parseSourceScope(value: string): SourceScope {
  if (value === "catalog" || value === "loader-visible") return value;
  throw new Error("--source-scope must be catalog or loader-visible.");
}

function parseArgs(args: string[]): Options {
  const options: Options = {
    format: "markdown",
    project: null,
    root: defaultRoot(),
    showRoot: false,
    sourceScope: "catalog",
  };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else if (arg === "--root") {
      options.root = readValue(args, index, arg);
      index++;
    } else if (arg.startsWith("--root=")) {
      options.root = arg.slice("--root=".length);
    } else if (arg === "--project") {
      options.project = readValue(args, index, arg);
      index++;
    } else if (arg.startsWith("--project=")) {
      options.project = arg.slice("--project=".length);
    } else if (arg === "--source-scope") {
      options.sourceScope = parseSourceScope(readValue(args, index, arg));
      index++;
    } else if (arg.startsWith("--source-scope=")) {
      options.sourceScope = parseSourceScope(arg.slice("--source-scope=".length));
    } else if (arg === "--format") {
      options.format = parseFormat(readValue(args, index, arg));
      index++;
    } else if (arg.startsWith("--format=")) {
      options.format = parseFormat(arg.slice("--format=".length));
    } else if (arg === "--show-root") {
      options.showRoot = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  options.root = path.resolve(options.root);
  options.project = options.project == null ? null : path.resolve(options.project);
  if (options.sourceScope === "loader-visible" && options.project == null) {
    throw new Error("--project is required for loader-visible scope.");
  }
  if (options.sourceScope === "catalog" && options.project != null) {
    throw new Error("--project requires --source-scope loader-visible.");
  }
  return options;
}

function toRelative(root: string, file: string): string {
  const relative = path.relative(root, file).replace(/\\/g, "/");
  return relative === "" ? "." : relative;
}

function countLines(text: string): number {
  if (text.length === 0) {
    return 0;
  }
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const newlineCount = normalized.split("\n").length - 1;
  return normalized.endsWith("\n") ? newlineCount : newlineCount + 1;
}

function classify(relative: string): ArtifactKind | null {
  if (/^global\/skills\/[^/]+\/SKILL\.md$/.test(relative)) {
    return "skill";
  }
  if (/^global\/agents\/[^/]+\.md$/.test(relative)) {
    return "agent";
  }
  if (relative === "global/AGENTS.md") {
    return "instruction";
  }
  if (/^instructions\/.+\.md$/.test(relative)) {
    return "instruction";
  }
  if (/^templates\/.+\.md$/.test(relative)) {
    return "template";
  }
  if (relative === "README.md" || relative === "AGENTS.md" || relative === "REPO_AGENTS.md") {
    return "root";
  }
  return null;
}

function extractDescriptionChars(text: string): number | null {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    return null;
  }
  const description = match[1].split(/\r?\n/).find((line) => line.startsWith("description:"));
  if (!description) {
    return null;
  }
  return description.slice("description:".length).trim().replace(/^['"]|['"]$/g, "").length;
}

function repeatedLines(artifacts: Array<{ text: string }>): RepeatedLine[] {
  const counts = new Map<string, number>();
  for (const artifact of artifacts) {
    const seenInFile = new Set<string>();
    for (const line of artifact.text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed.length < 40 || trimmed.startsWith("|") || trimmed.startsWith("---")) {
        continue;
      }
      seenInFile.add(trimmed);
    }
    for (const line of seenInFile) {
      counts.set(line, (counts.get(line) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 3)
    .map(([line, count]) => ({ line, count }))
    .sort((left, right) => right.count - left.count || left.line.localeCompare(right.line))
    .slice(0, 20);
}

function buildCatalogInventoryFromOptions(options: Pick<Options, "root" | "showRoot">): InstructionInventory {
  if (!fs.existsSync(options.root) || !fs.statSync(options.root).isDirectory()) {
    throw new Error(`Root is not a directory: ${options.showRoot ? options.root : "<redacted>"}`);
  }
  const files = walkMarkdownFiles(options.root);
  const artifactsWithText: Array<Artifact & { text: string }> = [];
  for (const file of files) {
    const relative = toRelative(options.root, file);
    const kind = classify(relative);
    if (!kind) {
      continue;
    }
    const text = fs.readFileSync(file, "utf8");
    const chars = text.length;
    const lines = countLines(text);
    artifactsWithText.push({
      chars,
      descriptionChars: extractDescriptionChars(text),
      kind,
      lines,
      path: relative,
      text,
      tokenProxy: Math.ceil(chars / 4),
    });
  }
  artifactsWithText.sort((left, right) => right.chars - left.chars || left.path.localeCompare(right.path));
  const artifacts = artifactsWithText.map(({ text: _text, ...artifact }) => artifact);
  const counts: Record<ArtifactKind, number> = { agent: 0, instruction: 0, root: 0, skill: 0, template: 0 };
  for (const artifact of artifacts) {
    counts[artifact.kind]++;
  }
  return {
    artifacts,
    counts,
    repeatedLines: repeatedLines(artifactsWithText),
    root: options.showRoot ? options.root : "<redacted>",
    totals: {
      artifacts: artifacts.length,
      chars: artifacts.reduce((sum, artifact) => sum + artifact.chars, 0),
      lines: artifacts.reduce((sum, artifact) => sum + artifact.lines, 0),
      tokenProxy: artifacts.reduce((sum, artifact) => sum + artifact.tokenProxy, 0),
    },
    tool: "opencode-dev-kit-instruction-artifacts-inventory",
    version: 1,
  };
}

export function buildCatalogInventory(root = defaultRoot(), showRoot = false): InstructionInventory {
  return buildCatalogInventoryFromOptions({ root: path.resolve(root), showRoot });
}

function metricForText(text: string): LoaderVisibleMetric {
  const chars = text.length;
  return { chars, lines: countLines(text), tokenProxy: Math.ceil(chars / 4) };
}

function sumMetrics(metrics: LoaderVisibleMetric[]): LoaderVisibleMetric {
  return metrics.reduce(
    (total, metric) => ({
      chars: total.chars + metric.chars,
      lines: total.lines + metric.lines,
      tokenProxy: total.tokenProxy + metric.tokenProxy,
    }),
    { chars: 0, lines: 0, tokenProxy: 0 },
  );
}

function category(
  sources: LoaderVisibleSourceReport[],
  select: (source: LoaderVisibleSourceReport) => LoaderVisibleMetric | null,
  isMember: (source: LoaderVisibleSourceReport) => boolean,
): LoaderVisibleCategory {
  const members = sources.filter(isMember);
  const metrics = members.map(select).filter((value): value is LoaderVisibleMetric => value != null);
  return {
    artifacts: metrics.length,
    ...sumMetrics(metrics),
    unknowns: members.length - metrics.length,
  };
}

function buildLoaderVisibleInventory(options: Options): LoaderVisibleInventory {
  const manifest = inspectLoaderVisibleInstructionManifest(options.project!);
  const sources: LoaderVisibleSourceReport[] = manifest.sources.map((source) => {
    if (source.file == null) {
      return {
        category: source.category,
        discoveryMetadata: null,
        evidenceClass: source.evidenceClass,
        identity: source.identity,
        kind: source.kind,
        metrics: null,
        reason: source.reason,
        source: source.source,
        status: "unknown",
      };
    }
    try {
      const text = fs.readFileSync(source.file, "utf8");
      const descriptionChars = source.category === "on-demand-body" ? extractDescriptionChars(text) : null;
      return {
        category: source.category,
        discoveryMetadata: descriptionChars == null
          ? null
          : { chars: descriptionChars, tokenProxy: Math.ceil(descriptionChars / 4) },
        evidenceClass: source.evidenceClass,
        identity: source.identity,
        kind: source.kind,
        metrics: metricForText(text),
        reason: null,
        source: source.source,
        status: "measured",
      };
    } catch {
      return {
        category: source.category,
        discoveryMetadata: null,
        evidenceClass: "unknown",
        identity: source.identity,
        kind: source.kind,
        metrics: null,
        reason: "instruction-unreadable",
        source: source.source,
        status: "unknown",
      };
    }
  });
  const evidenceClasses: Record<InstructionEvidenceClass, number> = {
    "config-declared": 0,
    conventional: 0,
    "runtime-observed": 0,
    unknown: 0,
  };
  for (const source of sources) evidenceClasses[source.evidenceClass]++;
  return {
    categories: {
      discoveryMetadata: category(
        sources,
        (source) => source.discoveryMetadata == null
          ? null
          : { ...source.discoveryMetadata, lines: 0 },
        (source) => source.category === "on-demand-body",
      ),
      onDemandBodies: category(
        sources,
        (source) => source.metrics,
        (source) => source.category === "on-demand-body",
      ),
      startupVisibleCandidates: category(
        sources,
        (source) => source.metrics,
        (source) => source.category === "startup-visible-candidate",
      ),
    },
    evidenceClasses,
    project: options.showRoot ? manifest.project : "<redacted>",
    sourceScope: "loader-visible",
    sources,
    tool: "opencode-dev-kit-instruction-artifacts-inventory",
    totals: {
      measuredSources: sources.filter((source) => source.status === "measured").length,
      unknownSources: sources.filter((source) => source.status === "unknown").length,
    },
    version: 2,
    warnings: [
      "Token proxies are deterministic character estimates, not provider token counts.",
      "Source presence or declaration does not prove final prompt inclusion or precedence.",
      "Unsupported, remote, dynamic, and unreadable sources remain unknown and are not assigned zero size.",
    ],
  };
}

function renderMarkdown(inventory: InstructionInventory): string {
  return [
    "# Instruction Artifacts Inventory",
    "",
    `Root: ${inventory.root}`,
    `Artifacts: ${inventory.totals.artifacts}`,
    `Lines: ${inventory.totals.lines}`,
    `Chars: ${inventory.totals.chars}`,
    `Token proxy: ${inventory.totals.tokenProxy}`,
    "",
    "## Counts By Kind",
    "",
    "| Kind | Count |",
    "| --- | ---: |",
    ...Object.entries(inventory.counts).map(([kind, count]) => `| ${kind} | ${count} |`),
    "",
    "## Top Artifacts",
    "",
    "| File | Kind | Lines | Chars | Token Proxy | Description Chars |",
    "| --- | --- | ---: | ---: | ---: | ---: |",
    ...inventory.artifacts.slice(0, 20).map((artifact) => `| ${artifact.path} | ${artifact.kind} | ${artifact.lines} | ${artifact.chars} | ${artifact.tokenProxy} | ${artifact.descriptionChars ?? 0} |`),
    "",
    "## Repeated Lines",
    "",
    inventory.repeatedLines.length === 0 ? "none" : ["| Count | Line |", "| ---: | --- |", ...inventory.repeatedLines.map((line) => `| ${line.count} | ${line.line.replace(/\|/g, "\\|")} |`)].join("\n"),
    "",
  ].join("\n");
}

function renderLoaderVisibleMarkdown(inventory: LoaderVisibleInventory): string {
  const categoryRows = Object.entries(inventory.categories).map(([name, value]) =>
    `| ${name} | ${value.artifacts} | ${value.lines} | ${value.chars} | ${value.tokenProxy} | ${value.unknowns} |`
  );
  return [
    "# Loader-Visible Instruction Inventory",
    "",
    `Project: ${inventory.project}`,
    `Measured sources: ${inventory.totals.measuredSources}`,
    `Unknown sources: ${inventory.totals.unknownSources}`,
    "",
    "## Categories",
    "",
    "| Category | Artifacts | Lines | Chars | Token Proxy | Unknowns |",
    "| --- | ---: | ---: | ---: | ---: | ---: |",
    ...categoryRows,
    "",
    "## Sources",
    "",
    "| Identity | Category | Kind | Evidence | Status | Reason |",
    "| --- | --- | --- | --- | --- | --- |",
    ...inventory.sources.map((source) =>
      `| ${source.identity} | ${source.category} | ${source.kind} | ${source.evidenceClass} | ${source.status} | ${source.reason ?? ""} |`
    ),
    "",
    "## Limits",
    "",
    ...inventory.warnings.map((warning) => `- ${warning}`),
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
    const inventory = options.sourceScope === "catalog"
      ? buildCatalogInventoryFromOptions(options)
      : buildLoaderVisibleInventory(options);
    const rendered = options.format === "json"
      ? JSON.stringify(inventory, null, 2)
      : inventory.version === 1
        ? renderMarkdown(inventory)
        : renderLoaderVisibleMarkdown(inventory);
    console.log(rendered);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
