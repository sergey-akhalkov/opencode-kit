#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runPortableCommand, type PortableCommandResult } from "../../global/bin/portable-process.ts";

type Mode = "capture" | "replay";

type Options = {
  candidateId: string;
  evidenceRoot: string;
  inputRoot: string | null;
  mode: Mode;
  sourceRoot: string;
};

type CommandFact = {
  argv: string[];
  error: string | null;
  signal: NodeJS.Signals | null;
  status: number | null;
  stderr: string;
  stdout: string;
};

type RawBundle = {
  candidate: {
    id: string;
    sourceHashes: Record<string, string>;
  };
  cleanup: {
    error: string | null;
    removed: boolean;
  };
  commands: Record<string, CommandFact>;
  environment: {
    node: string;
    platform: NodeJS.Platform;
  };
  expected: {
    discoveryChars: number;
    onDemandChars: number;
    onDemandTokenProxy: number;
    startupChars: number;
    startupTokenProxy: number;
    loweredSeedHash: string;
    rejectedSeedHash: string;
    syntheticPrivateMarker: string;
    syntheticVendorMarker: string;
  };
  fixtureManifests: {
    after: Record<string, string>;
    before: Record<string, string>;
  };
  schemaVersion: 1;
};

type Evaluation = {
  candidateId: string;
  facts: Record<string, boolean | number | string>;
  inputRawSha256: string;
  pass: boolean;
  schemaVersion: 1;
};

const PRIVATE_MARKER = "SYNTHETIC_PRIVATE_INSTRUCTION_MARKER";
const VENDOR_MARKER = "SYNTHETIC_VENDOR_MARKER";

function repositoryRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
}

function usage(): string {
  return [
    "Usage:",
    "  node tools/proofs/instruction-inventory-budget.ts --help",
    "  node tools/proofs/instruction-inventory-budget.ts --mode capture --candidate-id <id> --evidence-root <new-path> [--source-root <path>]",
    "  node tools/proofs/instruction-inventory-budget.ts --mode replay --candidate-id <id> --input-root <capture-path> --evidence-root <new-path>",
    "",
    "Capture is provider-free and creates only a disposable fixture plus an immutable evidence bundle.",
    "Replay evaluates preserved raw evidence without invoking inventory or budget commands.",
  ].join("\n");
}

function required(args: string[], index: number, name: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}.`);
  return value;
}

function parseArgs(args: string[]): Options | null {
  if (args.includes("--help") || args.includes("-h")) return null;
  let mode: Mode | null = null;
  let candidateId: string | null = null;
  let evidenceRoot: string | null = null;
  let inputRoot: string | null = null;
  let sourceRoot = repositoryRoot();
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--mode") {
      const value = required(args, index, arg);
      if (value !== "capture" && value !== "replay") throw new Error("--mode must be capture or replay.");
      mode = value;
      index++;
    } else if (arg === "--candidate-id") {
      candidateId = required(args, index, arg);
      index++;
    } else if (arg === "--evidence-root") {
      evidenceRoot = required(args, index, arg);
      index++;
    } else if (arg === "--input-root") {
      inputRoot = required(args, index, arg);
      index++;
    } else if (arg === "--source-root") {
      sourceRoot = required(args, index, arg);
      index++;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (mode == null || candidateId == null || evidenceRoot == null) {
    throw new Error("--mode, --candidate-id, and --evidence-root are required.");
  }
  if (mode === "replay" && inputRoot == null) throw new Error("--input-root is required for replay.");
  if (mode === "capture" && inputRoot != null) throw new Error("--input-root is only valid for replay.");
  return {
    candidateId,
    evidenceRoot: path.resolve(evidenceRoot),
    inputRoot: inputRoot == null ? null : path.resolve(inputRoot),
    mode,
    sourceRoot: path.resolve(sourceRoot),
  };
}

function sha256(value: string | Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function writeText(file: string, text: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, "utf8");
}

function writeJson(file: string, value: unknown): void {
  writeText(file, `${JSON.stringify(value, null, 2)}\n`);
}

function createEvidenceRoot(root: string): void {
  if (fs.existsSync(root)) throw new Error("Evidence root already exists; use a new path.");
  fs.mkdirSync(root, { recursive: true });
}

function manifest(root: string, current = root, result: Record<string, string> = {}): Record<string, string> {
  if (!fs.existsSync(current)) return result;
  for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const target = path.join(current, entry.name);
    if (entry.isDirectory()) manifest(root, target, result);
    else if (entry.isFile()) result[path.relative(root, target).replaceAll("\\", "/")] = sha256(fs.readFileSync(target));
  }
  return result;
}

function redactText(value: string, replacements: Array<[string, string]>): string {
  return replacements.reduce((text, [actual, replacement]) => {
    const variants = [actual, actual.replaceAll("\\", "/")].sort((a, b) => b.length - a.length);
    return variants.reduce((result, variant) => result.split(variant).join(replacement), text);
  }, value);
}

function commandFact(
  argv: string[],
  result: PortableCommandResult,
  replacements: Array<[string, string]>,
): CommandFact {
  return {
    argv: argv.map((arg) => redactText(arg, replacements)),
    error: result.error == null ? null : redactText(result.error.message, replacements),
    signal: result.signal,
    status: result.status,
    stderr: redactText(result.stderr, replacements),
    stdout: redactText(result.stdout, replacements),
  };
}

function packageCommand(
  sourceRoot: string,
  script: string,
  args: string[],
  env: NodeJS.ProcessEnv,
  replacements: Array<[string, string]>,
): CommandFact {
  const argv = ["npm", "run", script, "--", ...args];
  return commandFact(argv, runPortableCommand(sourceRoot, argv, { capture: true, env }), replacements);
}

function instruction(text: string): string {
  return `${text}\n`;
}

function artifact(description: string, body: string): string {
  return `---\ndescription: ${description}\n---\n\n${body}\n`;
}

function tokenProxy(texts: string[]): number {
  return texts.reduce((total, text) => total + Math.ceil(text.length / 4), 0);
}

function buildFixture(fixture: string): RawBundle["expected"] & {
  budgetRoot: string;
  customGlobal: string;
  explicitConfig: string;
  hostHome: string;
  project: string;
} {
  const hostHome = path.join(fixture, "host-home");
  const hostGlobal = path.join(hostHome, ".config", "opencode");
  const customGlobal = path.join(fixture, "custom-global");
  const workspace = path.join(fixture, "workspace");
  const project = path.join(workspace, "project");
  const external = path.join(fixture, "external", "private.md");
  const explicitConfig = path.join(fixture, "explicit", "opencode.json");
  const budgetRoot = path.join(fixture, "budget-kit");

  const hostAgents = instruction("Host global authority.");
  const customAgents = instruction("Custom global authority.");
  const customPrinciples = instruction("Custom working principles.");
  const customLocal = instruction(`Private synthetic global detail: ${PRIVATE_MARKER}.`);
  const parentAgents = instruction("Parent authority.");
  const parentExtra = instruction("Parent config instruction.");
  const projectAgents = instruction("Project authority.");
  const projectExtra = instruction("Project config instruction.");
  const opencodeAgents = instruction("Project .opencode authority.");
  const externalInstruction = instruction(`External synthetic instruction: ${PRIVATE_MARKER}.`);
  const globalSkillDescription = "Global synthetic skill.";
  const projectSkillDescription = "Project synthetic skill.";
  const globalSkill = artifact(globalSkillDescription, "Global on-demand body.");
  const projectSkill = artifact(projectSkillDescription, "Project on-demand body.");

  writeText(path.join(workspace, ".git", "HEAD"), "ref: refs/heads/main\n");
  writeText(path.join(hostGlobal, "AGENTS.md"), hostAgents);
  writeText(path.join(customGlobal, "AGENTS.md"), customAgents);
  writeText(path.join(customGlobal, "principles-of-work.md"), customPrinciples);
  writeText(path.join(customGlobal, "opencode.local.instructions.md"), customLocal);
  writeText(path.join(customGlobal, "opencode.json"), `${JSON.stringify({ instructions: ["principles-of-work.md", "opencode.local.instructions.md"] }, null, 2)}\n`);
  writeText(path.join(customGlobal, "skills", "global-skill", "SKILL.md"), globalSkill);
  writeText(path.join(workspace, "AGENTS.md"), parentAgents);
  writeText(path.join(workspace, "parent-extra.md"), parentExtra);
  writeText(path.join(workspace, "opencode.json"), `${JSON.stringify({ instructions: ["parent-extra.md"] }, null, 2)}\n`);
  writeText(path.join(project, "AGENTS.md"), projectAgents);
  writeText(path.join(project, "project-extra.md"), projectExtra);
  writeText(path.join(project, ".opencode", "AGENTS.md"), opencodeAgents);
  writeText(path.join(project, ".opencode", "skills", "project-skill", "SKILL.md"), projectSkill);
  writeText(path.join(project, ".opencode", "opencode.jsonc"), "{ invalid jsonc\n");
  writeText(path.join(project, "vendor", "ignored.md"), VENDOR_MARKER.repeat(1000));
  writeText(external, externalInstruction);
  writeText(path.join(project, "opencode.json"), `${JSON.stringify({
    instructions: ["project-extra.md", "docs/*.md", "https://example.invalid/rules.md", "missing.md", 37],
  }, null, 2)}\n`);
  writeText(explicitConfig, `${JSON.stringify({ instructions: [external] }, null, 2)}\n`);

  writeText(path.join(budgetRoot, "README.md"), "kit\n");
  writeText(path.join(budgetRoot, "global", "AGENTS.md"), "authority\n");
  writeText(path.join(budgetRoot, "global", "principles-of-work.md"), "principles\n");
  writeText(path.join(budgetRoot, "config", "instruction-budget.json"), `${JSON.stringify({
    limits: {
      discoveryMetadataTokenProxy: 100,
      globalStartupTokenProxy: 100,
      onDemandBodiesTokenProxy: 100,
    },
    schemaVersion: 2,
  }, null, 2)}\n`);

  const startupTexts = [
    hostAgents,
    customAgents,
    customPrinciples,
    customLocal,
    parentAgents,
    parentExtra,
    projectAgents,
    projectExtra,
    opencodeAgents,
    externalInstruction,
  ];
  return {
    budgetRoot,
    customGlobal,
    discoveryChars: globalSkillDescription.length + projectSkillDescription.length,
    explicitConfig,
    hostHome,
    loweredSeedHash: "",
    onDemandChars: globalSkill.length + projectSkill.length,
    onDemandTokenProxy: tokenProxy([globalSkill, projectSkill]),
    project,
    rejectedSeedHash: "",
    startupChars: startupTexts.reduce((total, text) => total + text.length, 0),
    startupTokenProxy: tokenProxy(startupTexts),
    syntheticPrivateMarker: PRIVATE_MARKER,
    syntheticVendorMarker: VENDOR_MARKER,
  };
}

function sourceHashes(sourceRoot: string): Record<string, string> {
  const files = [
    "config/instruction-budget.json",
    "global/bin/portable-process.ts",
    "tools/instruction-artifacts-inventory.ts",
    "tools/instruction-budget.ts",
    "tools/opencode-runtime-sources.ts",
    "tools/proofs/instruction-inventory-budget.ts",
  ];
  return Object.fromEntries(files.map((relative) => [relative, sha256(fs.readFileSync(path.join(sourceRoot, relative)))]));
}

function jsonOutput(command: CommandFact): Record<string, unknown> {
  const start = command.stdout.indexOf("{");
  if (start < 0) throw new Error(`Command did not emit JSON: ${command.argv.join(" ")}`);
  const parsed = JSON.parse(command.stdout.slice(start));
  if (typeof parsed !== "object" || parsed == null || Array.isArray(parsed)) throw new Error("Command JSON root must be an object.");
  return parsed as Record<string, unknown>;
}

function object(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value == null || Array.isArray(value)) throw new Error("Expected object in proof output.");
  return value as Record<string, unknown>;
}

function evaluate(raw: RawBundle): Evaluation {
  const commands = raw.commands;
  const catalogDefault = jsonOutput(commands.catalogDefault);
  const catalogExplicit = jsonOutput(commands.catalogExplicit);
  const loaderFirst = jsonOutput(commands.loaderFirst);
  const loaderSecond = jsonOutput(commands.loaderSecond);
  const loaderText = `${commands.loaderFirst.stdout}\n${commands.loaderFirst.stderr}`;
  const categories = object(loaderFirst.categories);
  const startup = object(categories.startupVisibleCandidates);
  const metadata = object(categories.discoveryMetadata);
  const onDemand = object(categories.onDemandBodies);
  const evidence = object(loaderFirst.evidenceClasses);
  const sources = Array.isArray(loaderFirst.sources) ? loaderFirst.sources : [];
  const currentBudget = jsonOutput(commands.currentBudget);
  const fixtureBudget = jsonOutput(commands.fixtureBudget);
    const growthBudget = jsonOutput(commands.growthBudget);
  const growthBoundaries = Array.isArray(growthBudget.boundaries) ? growthBudget.boundaries.map(object) : [];
  const failedGrowth = growthBoundaries.find((boundary) => boundary.status === "failed");
  const facts = {
    budgetCurrentPassed: commands.currentBudget.status === 0 && currentBudget.status === "passed",
    budgetFixturePassed: commands.fixtureBudget.status === 0 && fixtureBudget.status === "passed",
    budgetGrowthFailedClosed:
      commands.growthBudget.status !== 0 &&
      growthBudget.status === "failed" &&
      failedGrowth != null &&
      failedGrowth.actual === Number(failedGrowth.maximum) + 1 &&
      growthBudget.materializationCommand === "npm run instruction:budget -- --materialize-seed",
    budgetMaterializerGrowthRejected:
      commands.growthMaterialize.status !== 0 &&
      commands.growthMaterialize.stderr.includes("refuses to increase reviewed maxima") &&
      raw.expected.loweredSeedHash === raw.expected.rejectedSeedHash,
    budgetMalformedFailedClosed:
      commands.malformedBudget.status !== 0 &&
      commands.malformedBudget.stderr.includes("unreadable or malformed") &&
      commands.malformedBudget.stderr.includes("review it directly"),
    catalogCompatibility:
      commands.catalogDefault.status === 0 &&
      commands.catalogExplicit.status === 0 &&
      JSON.stringify(catalogDefault) === JSON.stringify(catalogExplicit) &&
      catalogDefault.version === 1,
    cleanupPassed: raw.cleanup.removed && raw.cleanup.error == null,
    configDeclaredEvidence: Number(evidence["config-declared"] ?? 0) > 0,
    conventionalEvidence: Number(evidence.conventional ?? 0) > 0,
    deterministicLoaderRerun:
      commands.loaderFirst.status === 0 &&
      commands.loaderSecond.status === 0 &&
      JSON.stringify(loaderFirst) === JSON.stringify(loaderSecond),
    discoveryMetadataSeparated:
      metadata.chars === raw.expected.discoveryChars &&
      Number(metadata.tokenProxy) > 0,
    loaderSchemaSeparated:
      loaderFirst.version === 2 &&
      loaderFirst.sourceScope === "loader-visible" &&
      !Object.hasOwn(loaderFirst, "repeatedLines") &&
      !Object.hasOwn(loaderFirst, "artifacts"),
    noContentDisclosure:
      !loaderText.includes(raw.expected.syntheticPrivateMarker) &&
      !loaderText.includes(raw.expected.syntheticVendorMarker) &&
      !loaderText.includes("fixture-") &&
      sources.every((source) => !Object.hasOwn(object(source), "file")),
    noVendorWalk:
      startup.chars === raw.expected.startupChars &&
      onDemand.chars === raw.expected.onDemandChars,
    onDemandSeparated:
      onDemand.chars === raw.expected.onDemandChars &&
      onDemand.tokenProxy === raw.expected.onDemandTokenProxy,
    runtimeObservedEvidence: Number(evidence["runtime-observed"] ?? 0) > 0,
    startupSeparated:
      startup.chars === raw.expected.startupChars &&
      startup.tokenProxy === raw.expected.startupTokenProxy,
    unknownsPreserved:
      Number(object(loaderFirst.totals).unknownSources) >= 6 &&
      Number(evidence.unknown ?? 0) >= 6 &&
      sources.filter((source) => object(source).status === "unknown").every((source) => object(source).metrics === null),
  };
  return {
    candidateId: raw.candidate.id,
    facts,
    inputRawSha256: sha256(`${JSON.stringify(raw, null, 2)}\n`),
    pass: Object.values(facts).every((value) => value === true),
    schemaVersion: 1,
  };
}

function capture(options: Options): Evaluation {
  createEvidenceRoot(options.evidenceRoot);
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "instruction-inventory-proof-"));
  const replacements: Array<[string, string]> = [
    [fixture, "<fixture>"],
    [options.sourceRoot, "<source-root>"],
    [options.evidenceRoot, "<evidence-root>"],
  ];
  const commands: Record<string, CommandFact> = {};
  let expected: ReturnType<typeof buildFixture> | null = null;
  let before: Record<string, string> = {};
  let after: Record<string, string> = {};
  let cleanupError: string | null = null;
  let removed = false;
  try {
    expected = buildFixture(fixture);
    before = manifest(fixture);
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      HOME: expected.hostHome,
      OPENCODE_CONFIG: expected.explicitConfig,
      OPENCODE_CONFIG_CONTENT: "{\"instructions\":[\"dynamic.md\"]}",
      OPENCODE_CONFIG_DIR: expected.customGlobal,
      USERPROFILE: expected.hostHome,
    };

    commands.catalogDefault = packageCommand(options.sourceRoot, "instruction:inventory", ["--format", "json"], env, replacements);
    commands.catalogExplicit = packageCommand(options.sourceRoot, "instruction:inventory", ["--source-scope", "catalog", "--format", "json"], env, replacements);
    const loaderArgs = ["--source-scope", "loader-visible", "--project", expected.project, "--format", "json"];
    commands.loaderFirst = packageCommand(options.sourceRoot, "instruction:inventory", loaderArgs, env, replacements);
    commands.loaderSecond = packageCommand(options.sourceRoot, "instruction:inventory", loaderArgs, env, replacements);
    commands.currentBudget = packageCommand(options.sourceRoot, "instruction:budget", ["--format", "json"], env, replacements);
    const fixtureSeed = path.join(expected.budgetRoot, "config", "instruction-budget.json");
    const budgetArgs = ["--root", expected.budgetRoot, "--seed", fixtureSeed, "--format", "json"];
    commands.fixtureBudget = packageCommand(options.sourceRoot, "instruction:budget", [...budgetArgs, "--materialize-seed"], env, replacements);
    expected.loweredSeedHash = sha256(fs.readFileSync(fixtureSeed));
    fs.appendFileSync(path.join(expected.budgetRoot, "global", "AGENTS.md"), "grow", "utf8");
    commands.growthBudget = packageCommand(options.sourceRoot, "instruction:budget", budgetArgs, env, replacements);
    commands.growthMaterialize = packageCommand(options.sourceRoot, "instruction:budget", [...budgetArgs, "--materialize-seed"], env, replacements);
    expected.rejectedSeedHash = sha256(fs.readFileSync(fixtureSeed));
    writeText(fixtureSeed, "{ malformed\n");
    commands.malformedBudget = packageCommand(options.sourceRoot, "instruction:budget", budgetArgs, env, replacements);
    after = manifest(fixture);
  } finally {
    try {
      fs.rmSync(fixture, { force: true, recursive: true });
      removed = !fs.existsSync(fixture);
    } catch (error) {
      cleanupError = error instanceof Error ? redactText(error.message, replacements) : String(error);
    }
  }
  if (expected == null) throw new Error("Fixture setup failed before proof capture.");
  const {
    budgetRoot: _budgetRoot,
    customGlobal: _customGlobal,
    explicitConfig: _explicitConfig,
    hostHome: _hostHome,
    project: _project,
    ...publicExpected
  } = expected;
  const raw: RawBundle = {
    candidate: { id: options.candidateId, sourceHashes: sourceHashes(options.sourceRoot) },
    cleanup: { error: cleanupError, removed },
    commands,
    environment: { node: process.version, platform: process.platform },
    expected: publicExpected,
    fixtureManifests: { after, before },
    schemaVersion: 1,
  };
  writeJson(path.join(options.evidenceRoot, "raw.json"), raw);
  const evaluation = evaluate(raw);
  writeJson(path.join(options.evidenceRoot, "evaluation.json"), evaluation);
  return evaluation;
}

function replay(options: Options): Evaluation {
  createEvidenceRoot(options.evidenceRoot);
  const rawPath = path.join(options.inputRoot!, "raw.json");
  const raw = JSON.parse(fs.readFileSync(rawPath, "utf8")) as RawBundle;
  if (raw.candidate.id !== options.candidateId) throw new Error("Replay candidate id does not match raw evidence.");
  const evaluation = evaluate(raw);
  writeJson(path.join(options.evidenceRoot, "evaluation.json"), evaluation);
  return evaluation;
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options == null) {
    console.log(usage());
  } else {
    const evaluation = options.mode === "capture" ? capture(options) : replay(options);
    console.log(JSON.stringify(evaluation, null, 2));
    if (!evaluation.pass) process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
