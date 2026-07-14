#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as jsoncParse } from "jsonc-parser";
import {
  agentsAuthorityProblem,
  skillAuthorityProblem,
} from "./validators/active-authority.ts";
import { inspectOpenCodeConfigText, sameConfigPath } from "./validators/opencode-config.ts";

type OutputFormat = "json" | "markdown";

type Options = {
  format: OutputFormat;
  project: string;
  showProject: boolean;
};

type CheckStatus = "pass" | "warn" | "blocked";
type QualificationStatus = "pass" | "blocked";

type Check = {
  blocksQualification: boolean;
  detail: string;
  name: string;
  status: CheckStatus;
};

type DoctorReport = {
  checks: Check[];
  project: string;
  qualificationStatus: QualificationStatus;
  status: CheckStatus;
  tool: "opencode-dev-kit-doctor";
  version: 2;
};

function defaultProject(): string {
  return process.cwd();
}

function repoRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

function configFileLabel(file: string): string {
  const base = path.basename(file);
  const parent = path.basename(path.dirname(file));
  return parent === "global" ? `global/${base}` : base;
}

function configFileProblem(file: string): string | null {
  const label = configFileLabel(file);
  try {
    const inspection = inspectOpenCodeConfigText(fs.readFileSync(file, "utf8"));
    if (inspection.code === "parse_error" || inspection.code === "non_object_root") {
      return `${label} is not a valid OpenCode JSON/JSONC object.`;
    }
    if (inspection.code === "unsupported_machine_override") {
      return `${label} contains unsupported field 'machineOverride'; remove it before restarting OpenCode.`;
    }
    return null;
  } catch {
    return `${label} could not be read or parsed.`;
  }
}

function inspectRequiredAuthorityFile(
  dir: string,
  relative: string,
): { ok: true } | { ok: false; problem: string } {
  const file = path.join(dir, relative);
  try {
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      return { ok: false, problem: `${relative} is missing or not a regular file` };
    }
    const text = fs.readFileSync(file, "utf8");
    if (relative === "AGENTS.md") {
      const problem = agentsAuthorityProblem(text);
      return problem == null ? { ok: true } : { ok: false, problem };
    }
    const problem = skillAuthorityProblem(text);
    return problem == null ? { ok: true } : { ok: false, problem };
  } catch {
    return { ok: false, problem: `${relative} could not be read` };
  }
}

function printUsage(): void {
  console.log(`Usage:
  npm run doctor -- [options]

Options:
  --project <path>          Project directory to inspect. Default: current directory.
  --format <json|markdown>  Output format. Default: markdown.
  --show-project            Include the absolute project path. Hidden by default for privacy-safe output.
  --help                   Show this help.
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
  const options: Options = { format: "markdown", project: defaultProject(), showProject: false };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else if (arg === "--project") {
      options.project = readValue(args, index, arg);
      index++;
    } else if (arg.startsWith("--project=")) {
      const value = arg.slice("--project=".length);
      if (value.trim() === "") {
        throw new Error("Missing value for --project.");
      }
      options.project = value;
    } else if (arg === "--format") {
      options.format = parseFormat(readValue(args, index, arg));
      index++;
    } else if (arg.startsWith("--format=")) {
      options.format = parseFormat(arg.slice("--format=".length));
    } else if (arg === "--show-project") {
      options.showProject = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  options.project = path.resolve(options.project);
  return options;
}

function formatProjectForOutput(project: string, showProject: boolean): string {
  return showProject ? project : "<redacted>";
}

function fileContains(file: string, needle: string): boolean {
  return fs.existsSync(file) && fs.statSync(file).isFile() && fs.readFileSync(file, "utf8").includes(needle);
}

function pathIsFile(file: string): boolean {
  return fs.existsSync(file) && fs.statSync(file).isFile();
}

function addCheck(
  checks: Check[],
  name: string,
  status: CheckStatus,
  detail: string,
  blocksQualification: boolean,
): void {
  checks.push({ name, status, detail, blocksQualification });
}

const ADAPTER_VALIDATION_PURPOSES = ["focusedTest", "test", "typecheck", "lint", "build"] as const;

const VALIDATION_DOC_PURPOSES = [
  { purpose: "focusedTest", label: "Focused test" },
  { purpose: "test", label: "Full test" },
  { purpose: "typecheck", label: "Typecheck" },
  { purpose: "lint", label: "Lint" },
  { purpose: "build", label: "Build" },
] as const;

type ValidationSourceState =
  | { kind: "complete" }
  | { kind: "missing" }
  | { kind: "malformed" }
  | { kind: "unresolved"; purposes: string[] };

/** Explicit unresolved template placeholders (case-insensitive exact match after trim). */
const UNRESOLVED_VALIDATION_PLACEHOLDERS = new Set([
  "unknown",
  "n/a",
  "tbd",
  "todo",
  "replace-me",
  "replace after discovery",
  "replace-after-discovery",
  "<command>",
  "<validation-command>",
]);

function isUnresolvedValidationPlaceholder(value: string): boolean {
  const trimmed = value.trim().replace(/[.]+$/u, "").trim();
  if (trimmed === "") {
    return true;
  }
  const lower = trimmed.toLowerCase();
  if (UNRESOLVED_VALIDATION_PLACEHOLDERS.has(lower)) {
    return true;
  }
  // Template-style notes that only restate discovery placeholders remain unresolved.
  if (/^replace after discovery\b/i.test(lower) || /^replace-me\b/i.test(lower)) {
    return true;
  }
  return false;
}

/**
 * Resolved means a concrete non-placeholder command, or explicit reasoned non-applicability:
 * adapter JSON string `N/A - <nonempty reason>`; validation.md may use Command `N/A - <reason>`
 * or Command `N/A` plus nonempty non-placeholder Notes reason (handled by callers).
 */
function isResolvedValidationCommand(value: string, notesReason?: string): boolean {
  const trimmed = value.trim();
  if (trimmed === "") {
    return false;
  }
  const naDash = /^N\/A\s*-\s*(\S[\s\S]*)$/i.exec(trimmed);
  if (naDash) {
    return naDash[1].trim() !== "" && !isUnresolvedValidationPlaceholder(naDash[1]);
  }
  if (/^N\/A$/i.test(trimmed)) {
    if (notesReason == null) {
      return false;
    }
    const notes = notesReason.trim();
    return notes !== "" && !isUnresolvedValidationPlaceholder(notes);
  }
  return !isUnresolvedValidationPlaceholder(trimmed);
}

function adapterValidationState(adapterPath: string): ValidationSourceState {
  if (!pathIsFile(adapterPath)) {
    return { kind: "missing" };
  }
  try {
    const errors: jsoncParse.ParseError[] = [];
    const parsed = jsoncParse(fs.readFileSync(adapterPath, "utf8"), errors, {
      allowTrailingComma: true,
      disallowComments: false,
    });
    if (errors.length > 0 || typeof parsed !== "object" || parsed == null || Array.isArray(parsed)) {
      return { kind: "malformed" };
    }
    const validation = (parsed as { validation?: unknown }).validation;
    if (validation == null || typeof validation !== "object" || Array.isArray(validation)) {
      return { kind: "unresolved", purposes: [...ADAPTER_VALIDATION_PURPOSES] };
    }
    const record = validation as Record<string, unknown>;
    const unresolved: string[] = [];
    for (const purpose of ADAPTER_VALIDATION_PURPOSES) {
      const value = record[purpose];
      if (typeof value !== "string" || !isResolvedValidationCommand(value)) {
        unresolved.push(purpose);
      }
    }
    return unresolved.length === 0 ? { kind: "complete" } : { kind: "unresolved", purposes: unresolved };
  } catch {
    return { kind: "malformed" };
  }
}

function extractBacktickedCommand(cell: string): string {
  const match = cell.match(/`([^`]*)`/);
  return match ? match[1] : cell.trim();
}

/** Split a Markdown table row while preserving blank interior cells; drop only outer pipe sentinels. */
function splitMarkdownTableCells(row: string): string[] {
  const parts = row.split("|");
  if (parts.length > 0 && parts[0].trim() === "") {
    parts.shift();
  }
  if (parts.length > 0 && parts[parts.length - 1].trim() === "") {
    parts.pop();
  }
  return parts.map((cell) => cell.trim());
}

function validationDocState(validationPath: string): ValidationSourceState {
  if (!pathIsFile(validationPath)) {
    return { kind: "missing" };
  }
  try {
    const text = fs.readFileSync(validationPath, "utf8");
    const unresolved: string[] = [];
    for (const entry of VALIDATION_DOC_PURPOSES) {
      const row = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => line.startsWith(`| ${entry.label} |`) || line.startsWith(`|${entry.label}|`));
      if (row == null) {
        unresolved.push(entry.purpose);
        continue;
      }
      const cells = splitMarkdownTableCells(row);
      if (cells.length < 2 || cells[0] !== entry.label) {
        unresolved.push(entry.purpose);
        continue;
      }
      const command = extractBacktickedCommand(cells[1] ?? "");
      const notes = cells[2] ?? "";
      if (!isResolvedValidationCommand(command, notes)) {
        unresolved.push(entry.purpose);
      }
    }
    return unresolved.length === 0 ? { kind: "complete" } : { kind: "unresolved", purposes: unresolved };
  } catch {
    return { kind: "malformed" };
  }
}

function resolveActiveGlobalConfigDir(): { dir: string; fromOverride: boolean } {
  const override = process.env.OPENCODE_CONFIG_DIR;
  if (override != null && override.trim() !== "") {
    return { dir: path.resolve(override), fromOverride: true };
  }
  return { dir: path.join(os.homedir(), ".config", "opencode"), fromOverride: false };
}

function describeValidationSource(label: string, state: ValidationSourceState): string {
  switch (state.kind) {
    case "complete":
      return `${label} complete`;
    case "missing":
      return `${label} missing`;
    case "malformed":
      return `${label} malformed`;
    case "unresolved":
      return `${label} unresolved (${state.purposes.join(", ")})`;
  }
}

/** Required active runtime authority only. Optional kit default role files are checked separately. */
const ACTIVE_REQUIRED_AUTHORITY_FILES = [
  "AGENTS.md",
  path.join("skills", "change-ready-sdlc", "SKILL.md"),
] as const;

const ACTIVE_OPTIONAL_DEFAULT_ROLE_FILES = [
  path.join("agents", "implementation-worker.md"),
  path.join("agents", "sdet-quality-engineer.md"),
  path.join("agents", "final-candidate-reviewer.md"),
] as const;

function nodeMajor(): number {
  const match = process.versions.node.match(/^(\d+)\./);
  return match ? Number(match[1]) : 0;
}

function buildReport(project: string, showProject: boolean): DoctorReport {
  const checks: Check[] = [];
  const root = repoRoot();

  if (!fs.existsSync(project) || !fs.statSync(project).isDirectory()) {
    addCheck(checks, "project directory", "blocked", "Project path is missing or is not a directory.", true);
  } else {
    addCheck(checks, "project directory", "pass", "Project path exists.", false);
  }

  const nodeOk = nodeMajor() >= 24;
  addCheck(
    checks,
    "node version",
    nodeOk ? "pass" : "blocked",
    `Node ${process.versions.node}; opencode-dev-kit tooling requires Node >=24.`,
    !nodeOk,
  );

  const hasLoop = fs.existsSync(path.join(root, "instructions", "universal-development-loop.md"));
  addCheck(
    checks,
    "universal loop source",
    hasLoop ? "pass" : "blocked",
    "Kit has the Universal Development Loop instruction artifact.",
    !hasLoop,
  );

  const hasProfile = fs.existsSync(path.join(root, "profiles", "all.json"));
  addCheck(
    checks,
    "profile manifest",
    hasProfile ? "pass" : "blocked",
    "Kit has the all-artifacts install profile.",
    !hasProfile,
  );

  const agentsPath = path.join(project, "AGENTS.md");
  const agentsOk =
    fileContains(agentsPath, "Runtime Authority") ||
    fileContains(agentsPath, "Universal Development Loop") ||
    fileContains(agentsPath, "change-ready-sdlc");
  addCheck(
    checks,
    "project AGENTS.md",
    agentsOk ? "pass" : "warn",
    "Project AGENTS.md should document runtime authority or the Universal Development Loop.",
    !agentsOk,
  );

  const adapterPath = path.join(project, "opencode-dev-kit", "adapter.json");
  const validationPath = path.join(project, "opencode-dev-kit", "validation.md");
  const adapterState = adapterValidationState(adapterPath);
  const docState = validationDocState(validationPath);
  const adapterComplete = adapterState.kind === "complete";
  const docComplete = docState.kind === "complete";
  const validationSourceComplete = adapterComplete || docComplete;

  if (adapterState.kind === "missing") {
    addCheck(
      checks,
      "project adapter",
      "warn",
      "Project should have opencode-dev-kit/adapter.json for technology-specific commands, or a complete opencode-dev-kit/validation.md Purpose/Command table.",
      false,
    );
  } else {
    addCheck(checks, "project adapter", "pass", "Project has opencode-dev-kit/adapter.json.", false);
  }

  if (docState.kind === "missing") {
    addCheck(
      checks,
      "project validation doc",
      "warn",
      "Project should have opencode-dev-kit/validation.md or a complete opencode-dev-kit/adapter.json validation object.",
      false,
    );
  } else {
    addCheck(
      checks,
      "project validation doc",
      "pass",
      "Project has opencode-dev-kit/validation.md.",
      false,
    );
  }

  if (validationSourceComplete) {
    const sources = [
      adapterComplete ? "opencode-dev-kit/adapter.json" : null,
      docComplete ? "opencode-dev-kit/validation.md" : null,
    ]
      .filter((value): value is string => value != null)
      .join(" and ");
    const incompleteNotes = [
      !adapterComplete ? describeValidationSource("adapter.json", adapterState) : null,
      !docComplete ? describeValidationSource("validation.md", docState) : null,
    ]
      .filter((value): value is string => value != null)
      .join("; ");
    addCheck(
      checks,
      "project adapter validation",
      "pass",
      incompleteNotes.length > 0
        ? `At least one complete validation adapter source is present (${sources}). Non-blocking incomplete source: ${incompleteNotes}.`
        : `Validation adapter sources are complete (${sources}).`,
      false,
    );
  } else {
    addCheck(
      checks,
      "project adapter validation",
      "warn",
      `No complete validation adapter source. ${describeValidationSource("adapter.json", adapterState)}; ${describeValidationSource("validation.md", docState)}. Provide concrete opencode-dev-kit/adapter.json validation entries or a complete opencode-dev-kit/validation.md Purpose/Command table for Focused test, Full test, Typecheck, Lint, and Build before Change-Ready qualification.`,
      true,
    );
  }

  const feedbackLedgerPath = path.join(project, "docs", "feedbacks", "README.md");
  const hasFeedback = fs.existsSync(feedbackLedgerPath);
  addCheck(
    checks,
    "project feedback ledger",
    hasFeedback ? "pass" : "warn",
    "Project should have docs/feedbacks/README.md so complain feedback can be appended safely.",
    false,
  );

  const opencodeConfig = path.join(project, "opencode.json");
  const hasProjectConfig = fs.existsSync(opencodeConfig);
  addCheck(
    checks,
    "project opencode config",
    hasProjectConfig ? "pass" : "warn",
    "Project opencode.json is optional but recommended for explicit instructions/config.",
    false,
  );

  const { dir: resolvedGlobalDir, fromOverride } = resolveActiveGlobalConfigDir();
  const isRepoGlobal = sameConfigPath(resolvedGlobalDir, path.resolve(root, "global"));
  const localPath = path.join(resolvedGlobalDir, "opencode.json");
  const templatePath = path.join(resolvedGlobalDir, "opencode.json.template");
  const dirExists = fs.existsSync(resolvedGlobalDir) && fs.statSync(resolvedGlobalDir).isDirectory();
  const authorityProblems = dirExists
    ? ACTIVE_REQUIRED_AUTHORITY_FILES.flatMap((relative) => {
        const result = inspectRequiredAuthorityFile(resolvedGlobalDir, relative);
        return result.ok ? [] : [result.problem];
      })
    : ACTIVE_REQUIRED_AUTHORITY_FILES.map((relative) => `${relative} is missing or not a regular file`);
  const hasRequiredAuthority = authorityProblems.length === 0;

  if (!dirExists) {
    addCheck(
      checks,
      "opencode config layering",
      "warn",
      fromOverride
        ? "OPENCODE_CONFIG_DIR points at a missing directory; set it to a complete active global config or install with npm run install:global."
        : "OPENCODE_CONFIG_DIR is unset and the host default ~/.config/opencode is missing; install with npm run install:global or provision a complete default global config.",
      true,
    );
  } else if (fs.existsSync(localPath)) {
    const problem = configFileProblem(localPath);
    addCheck(
      checks,
      "opencode config layering",
      problem == null ? "pass" : "blocked",
      problem ??
        (isRepoGlobal
          ? "Active layer: gitignored global/opencode.json machine-local config."
          : "Active layer: existing machine-local opencode.json under the resolved active global config directory."),
      problem != null,
    );
  } else {
    const templateNote = fs.existsSync(templatePath)
      ? " The template is an inactive provisioning seed when present."
      : " opencode.json.template is optional and is not required authority.";
    const sourceNote = isRepoGlobal
      ? ""
      : fromOverride
        ? " Resolved OPENCODE_CONFIG_DIR is not this repository's global/; that is informational when required authority files are present."
        : " Using host default ~/.config/opencode because OPENCODE_CONFIG_DIR is unset; that is informational when required authority files are present.";
    addCheck(
      checks,
      "opencode config layering",
      "warn",
      `No active opencode.json exists under the resolved active global config directory.${templateNote}${sourceNote} Missing machine-local config is advisory when required active authority files are present.`,
      false,
    );
  }

  if (!hasRequiredAuthority) {
    const sourceLabel = fromOverride ? "OPENCODE_CONFIG_DIR" : "host default ~/.config/opencode";
    addCheck(
      checks,
      "active kit required runtime authority",
      "warn",
      dirExists
        ? `Resolved active global config (${sourceLabel}) has incomplete required runtime authority: ${authorityProblems.join("; ")}. Structurally incomplete AGENTS.md or change-ready-sdlc blocks behavior-changing Change-Ready work.`
        : `Resolved active global config (${sourceLabel}) is missing; cannot verify AGENTS.md or change-ready-sdlc. Missing required authority blocks behavior-changing Change-Ready work.`,
      true,
    );
  } else {
    addCheck(
      checks,
      "active kit required runtime authority",
      "pass",
      fromOverride
        ? "Resolved active global config contains structurally conforming required runtime authority: AGENTS.md and change-ready-sdlc."
        : "Host default ~/.config/opencode contains structurally conforming required runtime authority: AGENTS.md and change-ready-sdlc.",
      false,
    );
  }

  if (!dirExists) {
    addCheck(
      checks,
      "active kit optional default role files",
      "warn",
      fromOverride
        ? "Cannot verify optional kit default role files while OPENCODE_CONFIG_DIR points at a missing directory; missing optional defaults do not block when alternate conforming adapters can be discovered."
        : "Cannot verify optional kit default role files while the host default global config directory is missing; missing optional defaults do not block when alternate conforming adapters can be discovered.",
      false,
    );
  } else {
    const missingOptionalRoles = ACTIVE_OPTIONAL_DEFAULT_ROLE_FILES.filter(
      (relative) => !pathIsFile(path.join(resolvedGlobalDir, relative)),
    );
    if (missingOptionalRoles.length > 0) {
      addCheck(
        checks,
        "active kit optional default role files",
        "warn",
        `Resolved active global config is missing optional default role files: ${missingOptionalRoles.join(", ")}. Missing optional defaults do not block when alternate conforming adapters can be discovered.`,
        false,
      );
    } else {
      addCheck(
        checks,
        "active kit optional default role files",
        "pass",
        "Resolved active global config contains optional default production/SDET/final role files.",
        false,
      );
    }
  }

  const explicitConfig = process.env.OPENCODE_CONFIG;
  if (explicitConfig != null && explicitConfig.trim() !== "") {
    const resolvedExplicitConfig = path.resolve(explicitConfig);
    let explicitProblem: string | null = null;
    try {
      if (!fs.existsSync(resolvedExplicitConfig) || !fs.statSync(resolvedExplicitConfig).isFile()) {
        explicitProblem = `OPENCODE_CONFIG is not an existing regular file: ${resolvedExplicitConfig}`;
      } else {
        explicitProblem = configFileProblem(resolvedExplicitConfig);
      }
    } catch {
      explicitProblem = `OPENCODE_CONFIG could not be inspected: ${resolvedExplicitConfig}`;
    }
    addCheck(
      checks,
      "explicit opencode config",
      explicitProblem == null ? "pass" : "blocked",
      explicitProblem ?? `OPENCODE_CONFIG loads an additional explicit config: ${resolvedExplicitConfig}`,
      explicitProblem != null,
    );
  }

  let status: CheckStatus = "pass";
  if (checks.some((check) => check.status === "blocked")) {
    status = "blocked";
  } else if (checks.some((check) => check.status === "warn")) {
    status = "warn";
  }

  const qualificationStatus: QualificationStatus = checks.some((check) => check.blocksQualification)
    ? "blocked"
    : "pass";

  return {
    checks,
    project: formatProjectForOutput(project, showProject),
    qualificationStatus,
    status,
    tool: "opencode-dev-kit-doctor",
    version: 2,
  };
}

function renderMarkdown(report: DoctorReport): string {
  return [
    "# opencode-dev-kit Doctor",
    "",
    `Project: ${report.project}`,
    `Status: ${report.status}`,
    `Qualification Status: ${report.qualificationStatus}`,
    "",
    "| Check | Status | Blocks Qualification | Detail |",
    "| --- | --- | --- | --- |",
    ...report.checks.map(
      (check) =>
        `| ${check.name} | ${check.status} | ${check.blocksQualification ? "yes" : "no"} | ${check.detail.replace(/\|/g, "\\|")} |`,
    ),
    "",
  ].join("\n");
}

try {
  const options = parseArgs(process.argv.slice(2));
  const report = buildReport(options.project, options.showProject);
  console.log(options.format === "json" ? JSON.stringify(report, null, 2) : renderMarkdown(report));
  if (report.status === "blocked") {
    process.exitCode = 2;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
