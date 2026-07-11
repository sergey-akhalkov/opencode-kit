import fs from "node:fs";
import path from "node:path";

export type FrontmatterValue = string | Record<string, never>;
export type FrontmatterMap = Map<string, FrontmatterValue>;

export type ValidationContext = {
  errors: string[];
  warnings: string[];
  infos: string[];
  addError: (message: string) => void;
  addWarning: (message: string) => void;
  addInfo: (message: string) => void;
};

export function createContext(): ValidationContext {
  const errors: string[] = [];
  const warnings: string[] = [];
  const infos: string[] = [];
  return {
    errors,
    warnings,
    infos,
    addError: (message) => errors.push(message),
    addWarning: (message) => warnings.push(message),
    addInfo: (message) => infos.push(message),
  };
}

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value != null && !Array.isArray(value);
}

export function readText(filePath: string): string {
  return fs.readFileSync(filePath, "utf8");
}

export function fileExists(target: string): boolean {
  return fs.existsSync(target) && fs.statSync(target).isFile();
}

export function directoryExists(target: string): boolean {
  return fs.existsSync(target) && fs.statSync(target).isDirectory();
}

export function listDirectories(root: string): string[] {
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(root, entry.name))
    .sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
}

export function listFiles(root: string, extension: string): string[] {
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(extension))
    .map((entry) => path.join(root, entry.name))
    .sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
}

export function toPosixPath(value: string): string {
  return value.split(path.sep).join("/");
}

export function walkMarkdownFiles(root: string, current = root, result: string[] = []): string[] {
  const entries = fs
    .readdirSync(current, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const entryPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      if ([".git", "node_modules"].includes(entry.name)) {
        continue;
      }
      walkMarkdownFiles(root, entryPath, result);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      result.push(entryPath);
    }
  }
  return result;
}

export function walkRepositoryFiles(root: string, current = root, result: string[] = []): string[] {
  const entries = fs
    .readdirSync(current, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const entryPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      if ([".git", "node_modules"].includes(entry.name)) {
        continue;
      }
      walkRepositoryFiles(root, entryPath, result);
    } else if (entry.isFile()) {
      result.push(entryPath);
    }
  }
  return result;
}

export function getRequiredScalar(
  ctx: ValidationContext,
  frontmatter: FrontmatterMap,
  key: string,
  file: string,
): string | null {
  if (!frontmatter.has(key)) {
    return null;
  }
  const value = frontmatter.get(key);
  if (typeof value !== "string") {
    ctx.addError(`Frontmatter field must be a scalar: ${file}:${key}`);
    return null;
  }
  return value;
}

export function requireFile(ctx: ValidationContext, root: string, relativePath: string, label: string): void {
  const target = path.join(root, ...relativePath.split("/"));
  if (!fileExists(target)) {
    ctx.addError(`Missing ${label}: ${relativePath}`);
  }
}

export function requireDirectory(ctx: ValidationContext, root: string, relativePath: string, label: string): void {
  const target = path.join(root, ...relativePath.split("/"));
  if (!directoryExists(target)) {
    ctx.addError(`Missing ${label}: ${relativePath}`);
  }
}

export function requireTextContains(
  ctx: ValidationContext,
  text: string,
  needle: string,
  label: string,
  file: string,
): void {
  if (!text.includes(needle)) {
    ctx.addError(`${label} must include '${needle}': ${file}`);
  }
}

export function validateTextContracts(
  ctx: ValidationContext,
  file: string,
  text: string,
  contracts: { fileName: string; label: string; requiredText: string[] }[],
): void {
  const fileName = path.basename(file);
  for (const contract of contracts) {
    if (contract.fileName !== fileName) {
      continue;
    }
    for (const requiredText of contract.requiredText) {
      requireTextContains(ctx, text, requiredText, contract.label, file);
    }
  }
}

export function readJsonRecord(ctx: ValidationContext, file: string): Record<string, unknown> | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readText(file));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ctx.addError(`Invalid JSON: ${file}: ${message}`);
    return null;
  }
  if (!isPlainRecord(parsed)) {
    ctx.addError(`JSON file must contain an object: ${file}`);
    return null;
  }
  return parsed;
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getCatalogEntries(
  readmeText: string,
  startHeading: string,
  endHeading: string,
  readmePath: string,
): string[] {
  const pattern = new RegExp(
    `^##\\s+${escapeRegExp(startHeading)}\\s*$\\r?\\n(?<body>.*?)^##\\s+${escapeRegExp(endHeading)}\\s*$`,
    "ms",
  );
  const match = readmeText.match(pattern);
  if (!match?.groups?.body) {
    return [];
  }
  return Array.from(match.groups.body.matchAll(/^-\s+`([^`]+)`:/gm), (entry) => entry[1]);
}

export function getRequiredHeadingSection(
  ctx: ValidationContext,
  readmeText: string,
  heading: string,
  readmePath: string,
): string {
  const pattern = new RegExp(
    `^##\\s+${escapeRegExp(heading)}\\s*$\\r?\\n(?<body>.*?)(?=^##\\s+|(?![\\s\\S]))`,
    "ms",
  );
  const match = readmeText.match(pattern);
  if (!match?.groups?.body) {
    ctx.addError(`Missing README section '${heading}': ${readmePath}`);
    return "";
  }
  return match.groups.body;
}

export function requireBulletedSection(ctx: ValidationContext, body: string, label: string, file: string): void {
  if (!/^-\s+\S/m.test(body)) {
    ctx.addError(`${label} must include at least one bullet: ${file}`);
  }
}

export function compareStringSets(
  actual: string[],
  expected: string[],
): { extra: string[]; missing: string[] } {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  return {
    extra: [...actualSet]
      .filter((value) => !expectedSet.has(value))
      .sort((left, right) => left.localeCompare(right)),
    missing: [...expectedSet]
      .filter((value) => !actualSet.has(value))
      .sort((left, right) => left.localeCompare(right)),
  };
}

export function compareCatalog(
  ctx: ValidationContext,
  label: string,
  expected: string[],
  actual: string[],
  readmePath: string,
): void {
  const actualCounts = new Map<string, number>();
  for (const name of actual) {
    actualCounts.set(name, (actualCounts.get(name) ?? 0) + 1);
  }
  for (const [name, count] of actualCounts) {
    if (count > 1) {
      ctx.addError(`${label} catalog has duplicate '${name}': ${readmePath}`);
    }
  }
  const expectedSorted = [...expected].sort();
  const actualSorted = [...actual].sort();
  for (const name of expectedSorted) {
    if (!actualSorted.includes(name)) {
      ctx.addError(`${label} catalog missing '${name}': ${readmePath}`);
    }
  }
  for (const name of actualSorted) {
    if (!expectedSorted.includes(name)) {
      ctx.addError(`${label} catalog references missing artifact '${name}': ${readmePath}`);
    }
  }
}
