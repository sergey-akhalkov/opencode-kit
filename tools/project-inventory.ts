#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

type OutputFormat = "json" | "markdown";
type SkipClass = "ignored" | "generated" | "evidence" | "vendor";

type Options = {
  format: OutputFormat;
  root: string;
  showRoot: boolean;
};

type FileEntry = {
  path: string;
  lines?: number;
  reason?: string;
};

type PackageScript = {
  command: string;
  name: string;
};

type InventoryCounts = {
  scanned: number;
  ignored: number;
  generated: number;
  evidence: number;
  vendor: number;
  unreadable: number;
  unsupported: number;
  unknown: number;
};

type ProjectInventory = {
  buildFiles: FileEntry[];
  configFiles: FileEntry[];
  counts: InventoryCounts;
  largeFiles: FileEntry[];
  notes: string[];
  packageScripts: PackageScript[];
  root: string;
  sourceRoots: FileEntry[];
  testRootEvidence: string;
  testRoots: FileEntry[];
  tool: "opencode-dev-kit-project-inventory";
  version: 1;
};

const conventionalSourceNames = new Set(["src", "app", "lib", "packages", "crates"]);
const conventionalTestNames = new Set(["test", "tests", "__tests__", "spec"]);
const codeExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mts", ".cts", ".go", ".rs", ".py", ".java", ".cs", ".cpp", ".c", ".h", ".rb", ".php", ".swift", ".kt", ".kts", ".vue", ".svelte"]);
const buildFileNames = new Set(["package.json", "Cargo.toml", "pyproject.toml", "go.mod", "pom.xml", "build.gradle", "build.gradle.kts", "Makefile", "CMakeLists.txt", "deno.json", "bun.lockb", "pnpm-lock.yaml", "package-lock.json", "yarn.lock"]);
const configFileNames = new Set(["opencode.json", "opencode.jsonc", "tsconfig.json", "eslint.config.js", "eslint.config.mjs", "biome.json", "prettier.config.js", "prettier.config.mjs", "vitest.config.ts", "jest.config.ts", "Dockerfile"]);
const skipDirectoryNames: Record<SkipClass, Set<string>> = {
  ignored: new Set([".git"]),
  generated: new Set([".next", ".nuxt", "build", "coverage", "dist", "graphify-out", "out", "target"]),
  evidence: new Set([".review-evidence", "evidence", "implementation-evidence"]),
  vendor: new Set(["node_modules", "vendor"]),
};
const testPrefixPattern = /^test.*\.(cjs|cts|js|jsx|mjs|mts|ts|tsx)$/i;
const testSuffixPattern = /\.(spec|test)\.(cjs|cts|js|jsx|mjs|mts|ts|tsx)$/i;
const exclusionNote = "Exclusions are not proof of absence.";

function printUsage(): void {
  console.log(`Usage:
  npm run project:inventory -- [options]

Options:
  --root <path>             Project root. Default: current directory.
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

function parseArgs(args: string[]): Options {
  const options: Options = { format: "markdown", root: process.cwd(), showRoot: false };
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
  return options;
}

function toRelative(root: string, value: string): string {
  const relative = path.relative(root, value).replace(/\\/g, "/");
  return relative === "" ? "." : relative;
}

function rootIdentity(options: Options): string {
  return options.showRoot ? options.root : "<redacted>";
}

function errorCode(error: unknown): string {
  if (typeof error === "object" && error != null && "code" in error && typeof (error as { code: unknown }).code === "string") {
    return (error as { code: string }).code;
  }
  return "unknown";
}

function redactPathText(text: string, root: string): string {
  const variants = [root, root.replaceAll("\\", "/"), root.replaceAll("/", "\\")];
  let result = text;
  for (const variant of variants) {
    if (variant.length > 0) {
      result = result.split(variant).join("<redacted>");
    }
  }
  return result;
}

function unreadableRootError(error: unknown, options: Options): Error {
  const identity = rootIdentity(options);
  const raw = error instanceof Error ? error.message : String(error);
  return new Error(`Root is unreadable: ${identity} (${errorCode(error)}: ${redactPathText(raw, options.root)})`);
}

function assertReadableRoot(options: Options): void {
  try {
    const stat = fs.statSync(options.root);
    if (!stat.isDirectory()) {
      throw new Error(`Root is not a directory: ${rootIdentity(options)}`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Root is not a directory:")) {
      throw error;
    }
    throw unreadableRootError(error, options);
  }
  try {
    fs.readdirSync(options.root);
  } catch (error) {
    throw unreadableRootError(error, options);
  }
}

function countLines(file: string): number {
  const text = fs.readFileSync(file, "utf8");
  if (text.length === 0) {
    return 0;
  }
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const newlineCount = normalized.split("\n").length - 1;
  return normalized.endsWith("\n") ? newlineCount : newlineCount + 1;
}

function skipClassFor(name: string): SkipClass | null {
  for (const key of ["ignored", "generated", "evidence", "vendor"] as const) {
    if (skipDirectoryNames[key].has(name)) {
      return key;
    }
  }
  return null;
}

function emptyCounts(): InventoryCounts {
  return {
    scanned: 0,
    ignored: 0,
    generated: 0,
    evidence: 0,
    vendor: 0,
    unreadable: 0,
    unsupported: 0,
    unknown: 0,
  };
}

function walk(root: string, current: string, files: string[], dirs: string[], counts: InventoryCounts): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(current, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name));
  } catch {
    counts.unreadable += 1;
    return;
  }
  for (const entry of entries) {
    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      const skipped = skipClassFor(entry.name);
      if (skipped != null) {
        counts[skipped] += 1;
        continue;
      }
      dirs.push(fullPath);
      walk(root, fullPath, files, dirs, counts);
    } else if (entry.isFile()) {
      files.push(fullPath);
      counts.scanned += 1;
    } else {
      counts.unsupported += 1;
    }
  }
}

function readPackageScripts(root: string): PackageScript[] {
  const packagePath = path.join(root, "package.json");
  if (!fs.existsSync(packagePath)) {
    return [];
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(packagePath, "utf8")) as { scripts?: Record<string, unknown> };
    return Object.entries(parsed.scripts ?? {})
      .filter((entry): entry is [string, string] => typeof entry[1] === "string")
      .map(([name, command]) => ({ name, command }))
      .sort((left, right) => left.name.localeCompare(right.name));
  } catch {
    return [];
  }
}

function isCodeFile(file: string): boolean {
  return codeExtensions.has(path.extname(file).toLowerCase());
}

function pathSegments(relativePath: string): string[] {
  return relativePath === "." ? [] : relativePath.split("/");
}

function isTestFile(relativePath: string): boolean {
  const base = path.posix.basename(relativePath);
  const dir = path.posix.dirname(relativePath);
  if (pathSegments(dir).some((segment) => conventionalTestNames.has(segment))) {
    return true;
  }
  if (dir === "tools" && testPrefixPattern.test(base)) {
    return true;
  }
  if (dir === "." && (testPrefixPattern.test(base) || testSuffixPattern.test(base))) {
    return true;
  }
  return false;
}

function isUnder(relativePath: string, rootPath: string): boolean {
  if (rootPath === ".") {
    return !relativePath.includes("/");
  }
  return relativePath === rootPath || relativePath.startsWith(`${rootPath}/`);
}

function hasProductionCode(root: string, files: string[], relativeDir: string): boolean {
  return files.some((file) => {
    if (!isCodeFile(file)) {
      return false;
    }
    const relativePath = toRelative(root, file);
    return !isTestFile(relativePath) && isUnder(relativePath, relativeDir);
  });
}

function addRoot(roots: Map<string, string>, relativePath: string, reason: string): void {
  if (!roots.has(relativePath)) {
    roots.set(relativePath, reason);
  }
}

function scriptDirectoryRoots(scripts: PackageScript[], root: string, dirs: string[]): string[] {
  const existing = new Set(dirs.map((dir) => toRelative(root, dir)));
  const found = new Set<string>();
  for (const script of scripts) {
    for (const token of script.command.split(/\s+/)) {
      const normalized = token.replace(/\\/g, "/").replace(/^\.\//, "");
      if (!normalized.includes("/") || normalized.startsWith("-") || normalized.includes("://")) {
        continue;
      }
      const first = normalized.split("/")[0];
      if (first == null || first === "" || first === ".") {
        continue;
      }
      if (existing.has(first)) {
        found.add(first);
      }
    }
  }
  return [...found].sort((left, right) => left.localeCompare(right));
}

function toRootEntries(roots: Map<string, string>): FileEntry[] {
  return [...roots.entries()]
    .map(([relativePath, reason]) => ({ path: relativePath, reason }))
    .sort((left, right) => left.path.localeCompare(right.path));
}

function classifyRoots(root: string, files: string[], dirs: string[], scripts: PackageScript[]): {
  sourceRoots: FileEntry[];
  testRoots: FileEntry[];
  testRootEvidence: string;
  unknown: number;
} {
  const sourceRoots = new Map<string, string>();
  const testRoots = new Map<string, string>();

  for (const dir of dirs) {
    const relativePath = toRelative(root, dir);
    const base = path.basename(dir);
    if (conventionalSourceNames.has(base)) {
      addRoot(sourceRoots, relativePath, "conventional-directory");
    }
    if (conventionalTestNames.has(base)) {
      addRoot(testRoots, relativePath, "conventional-directory");
    }
  }

  if (dirs.some((dir) => toRelative(root, dir) === "tools") && hasProductionCode(root, files, "tools")) {
    addRoot(sourceRoots, "tools", "maintained-tool-root");
  }

  for (const relativeDir of scriptDirectoryRoots(scripts, root, dirs)) {
    if (hasProductionCode(root, files, relativeDir)) {
      addRoot(sourceRoots, relativeDir, relativeDir === "tools" ? "maintained-tool-root" : "package-manifest-path");
    }
  }

  if (hasProductionCode(root, files, ".")) {
    addRoot(sourceRoots, ".", "root-level-source");
  }

  if (files.some((file) => {
    const relativePath = toRelative(root, file);
    return path.posix.dirname(relativePath) === "tools" && testPrefixPattern.test(path.posix.basename(relativePath));
  })) {
    addRoot(testRoots, "tools/test*.ts", "maintained-test-pattern");
  }

  const rootLevelNames = files
    .map((file) => toRelative(root, file))
    .filter((relativePath) => path.posix.dirname(relativePath) === ".");
  if (rootLevelNames.some((relativePath) => testPrefixPattern.test(path.posix.basename(relativePath)))) {
    addRoot(testRoots, "test*.ts", "root-level-test-pattern");
  } else if (rootLevelNames.some((relativePath) => testSuffixPattern.test(path.posix.basename(relativePath)))) {
    addRoot(testRoots, "*.test.ts", "root-level-test-pattern");
  }

  for (const testPath of testRoots.keys()) {
    sourceRoots.delete(testPath);
  }

  const classifiedSources = [...sourceRoots.keys()];
  let unknown = 0;
  for (const file of files) {
    if (!isCodeFile(file)) {
      continue;
    }
    const relativePath = toRelative(root, file);
    if (isTestFile(relativePath) || classifiedSources.some((sourcePath) => isUnder(relativePath, sourcePath))) {
      continue;
    }
    unknown += 1;
  }

  const testEntries = toRootEntries(testRoots);
  return {
    sourceRoots: toRootEntries(sourceRoots),
    testRoots: testEntries,
    testRootEvidence: testEntries.length > 0 ? "classified" : "no-matching-test-files",
    unknown,
  };
}

function buildInventory(options: Options): ProjectInventory {
  assertReadableRoot(options);
  const files: string[] = [];
  const dirs: string[] = [];
  const counts = emptyCounts();
  walk(options.root, options.root, files, dirs, counts);

  const packageScripts = readPackageScripts(options.root);
  const classified = classifyRoots(options.root, files, dirs, packageScripts);
  counts.unknown = classified.unknown;

  const buildFiles = files.filter((file) => buildFileNames.has(path.basename(file))).map((file) => ({ path: toRelative(options.root, file) }));
  const configFiles = files.filter((file) => configFileNames.has(path.basename(file)) || toRelative(options.root, file).startsWith(".github/workflows/")).map((file) => ({ path: toRelative(options.root, file) }));
  const largeFiles: FileEntry[] = [];
  for (const file of files) {
    if (!isCodeFile(file)) {
      continue;
    }
    try {
      const lines = countLines(file);
      if (lines >= 400) {
        largeFiles.push({ path: toRelative(options.root, file), lines });
      }
    } catch {
      counts.unreadable += 1;
    }
  }
  largeFiles.sort((left, right) => (right.lines ?? 0) - (left.lines ?? 0) || left.path.localeCompare(right.path));

  const notes = counts.ignored + counts.generated + counts.evidence + counts.vendor > 0 ? [exclusionNote] : [];

  return {
    buildFiles: buildFiles.sort((left, right) => left.path.localeCompare(right.path)),
    configFiles: configFiles.sort((left, right) => left.path.localeCompare(right.path)),
    counts,
    largeFiles: largeFiles.slice(0, 20),
    notes,
    packageScripts,
    root: rootIdentity(options),
    sourceRoots: classified.sourceRoots,
    testRootEvidence: classified.testRootEvidence,
    testRoots: classified.testRoots,
    tool: "opencode-dev-kit-project-inventory",
    version: 1,
  };
}

function renderList<T>(items: T[], render: (item: T) => string): string {
  return items.length === 0 ? "none" : items.map(render).join("\n");
}

function renderRoot(file: FileEntry): string {
  return file.reason == null ? `- ${file.path}` : `- ${file.path} (${file.reason})`;
}

function renderMarkdown(inventory: ProjectInventory): string {
  const countLinesOut = Object.entries(inventory.counts).map(([name, value]) => `- ${name}: ${value}`);
  return [
    "# Project Inventory",
    "",
    `Root: ${inventory.root}`,
    "",
    "## Counts",
    "",
    countLinesOut.join("\n"),
    "",
    "## Build Files",
    "",
    renderList(inventory.buildFiles, (file) => `- ${file.path}`),
    "",
    "## Package Scripts",
    "",
    renderList(inventory.packageScripts, (script) => `- ${script.name}: \`${script.command}\``),
    "",
    "## Source Roots",
    "",
    renderList(inventory.sourceRoots, renderRoot),
    "",
    "## Test Roots",
    "",
    inventory.testRoots.length === 0 ? `none (${inventory.testRootEvidence})` : inventory.testRoots.map(renderRoot).join("\n"),
    "",
    "## Config Files",
    "",
    renderList(inventory.configFiles, (file) => `- ${file.path}`),
    "",
    "## Large Files",
    "",
    inventory.largeFiles.length === 0 ? "none" : ["| File | Lines |", "| --- | ---: |", ...inventory.largeFiles.map((file) => `| ${file.path} | ${file.lines ?? 0} |`)].join("\n"),
    "",
    "## Notes",
    "",
    renderList(inventory.notes, (note) => `- ${note}`),
    "",
  ].join("\n");
}

try {
  const options = parseArgs(process.argv.slice(2));
  const inventory = buildInventory(options);
  console.log(options.format === "json" ? JSON.stringify(inventory, null, 2) : renderMarkdown(inventory));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
