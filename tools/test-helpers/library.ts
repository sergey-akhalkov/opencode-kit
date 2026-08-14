import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

export type ProcessResult = {
  exitCode: number;
  output: string;
};

export type TestCase = {
  name: string;
  run: () => void;
};

const helperRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const libraryRoot = helperRoot;
export const validator = path.join(helperRoot, "tools", "validate-library.ts");
export const installer = path.join(helperRoot, "tools", "install-opencode-global.ts");
export const initProject = path.join(helperRoot, "tools", "init-project.ts");
export const doctor = path.join(helperRoot, "tools", "doctor.ts");
export const projectInventory = path.join(helperRoot, "tools", "project-inventory.ts");
export const instructionInventory = path.join(helperRoot, "tools", "instruction-artifacts-inventory.ts");

const FIXTURE_MODEL_PROFILE_SCHEMA = "https://opencode.ai/config.json";
const FIXTURE_SOL_MODEL = "openai/gpt-5.6-sol";
const FIXTURE_GROK_MODEL = "xai/grok-4.6";
const FIXTURE_QUALITY_CREATORS = new Set([
  "build",
  "compaction",
  "general",
  "implementation-worker",
  "plan",
  "troubleshooter",
]);
export const FIXTURE_MODEL_PROFILE_AGENTS = [
  "build",
  "compaction",
  "demo-reviewer",
  "explore",
  "general",
  "plan",
  "summary",
  "title",
] as const;

export function newTempDir(name: string): string {
  const parent = path.join(os.tmpdir(), "agents-and-skills-tests");
  fs.mkdirSync(parent, { recursive: true });
  const dir = path.join(parent, `${name}-${crypto.randomUUID().replace(/-/g, "")}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function writeText(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content.replace(/\r?\n/g, os.EOL), "utf8");
  syncFixtureModelProfilesForAgent(filePath);
}

export function writeFixtureModelProfileBaseline(fixture: string): void {
  writeText(path.join(fixture, ".gitignore"), "/global/model-profiles/local/*.json\n");
  for (const profileName of ["grok-only", "quality-independent", "sol-only"] as const) {
    const agents = Object.fromEntries(
      [...FIXTURE_MODEL_PROFILE_AGENTS]
        .sort((left, right) => left.localeCompare(right))
        .map((agentName) => [agentName, fixtureRoute(profileName, agentName)]),
    );
    const model = profileName === "grok-only" ? FIXTURE_GROK_MODEL : FIXTURE_SOL_MODEL;
    const smallModel = profileName === "quality-independent" ? FIXTURE_GROK_MODEL : model;
    writeText(
      path.join(fixture, "global", "model-profiles", `${profileName}.json`),
      `${JSON.stringify({
        $schema: FIXTURE_MODEL_PROFILE_SCHEMA,
        model,
        small_model: smallModel,
        agent: agents,
      }, null, 2)}\n`,
    );
  }
}

export function addFixtureAgentToModelProfiles(fixture: string, agentName: string): void {
  const profilesDir = path.join(fixture, "global", "model-profiles");
  for (const profileName of ["grok-only", "quality-independent", "sol-only"] as const) {
    const profilePath = path.join(profilesDir, `${profileName}.json`);
    if (!fs.existsSync(profilePath)) return;
    const profile = JSON.parse(fs.readFileSync(profilePath, "utf8")) as {
      agent: Record<string, { model: string; variant: string }>;
    };
    if (profile.agent[agentName] != null) continue;
    profile.agent[agentName] = fixtureRoute(profileName, agentName);
    profile.agent = Object.fromEntries(
      Object.entries(profile.agent).sort(([left], [right]) => left.localeCompare(right)),
    );
    fs.writeFileSync(
      profilePath,
      `${JSON.stringify(profile, null, 2).replace(/\n/g, os.EOL)}${os.EOL}`,
      "utf8",
    );
  }
}

function fixtureRoute(
  profileName: "grok-only" | "quality-independent" | "sol-only",
  agentName: string,
): { model: string; variant: string } {
  const useSol = profileName === "sol-only" ||
    (profileName === "quality-independent" && FIXTURE_QUALITY_CREATORS.has(agentName));
  return useSol
    ? { model: FIXTURE_SOL_MODEL, variant: "xhigh" }
    : { model: FIXTURE_GROK_MODEL, variant: "high" };
}

function syncFixtureModelProfilesForAgent(filePath: string): void {
  if (path.extname(filePath) !== ".md" || path.basename(path.dirname(filePath)) !== "agents") return;
  const fixture = path.dirname(path.dirname(path.dirname(path.resolve(filePath))));
  if (path.resolve(path.dirname(filePath)) !== path.join(fixture, "global", "agents")) return;
  const fixtureParent = path.join(os.tmpdir(), "agents-and-skills-tests");
  const relative = path.relative(fixtureParent, fixture);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return;
  addFixtureAgentToModelProfiles(fixture, path.basename(filePath, ".md"));
}

export function lines(values: string[]): string {
  return values.join("\n");
}

function writePortableFixtureEntrypoint(file: string): void {
  writeText(file, lines([
    "#!/usr/bin/env node",
    'import path from "node:path";',
    'import { pathToFileURL } from "node:url";',
    'const rootFlag = "--root";',
    "if (process.argv[1] != null && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {",
    '  console.log("main-executed");',
    "}",
    "",
  ]));
}

export function appendReadmeAgentCatalogEntry(fixture: string, entry: string): void {
  const readmePath = path.join(fixture, "README.md");
  const readmeText = fs.readFileSync(readmePath, "utf8");
  const marker = "- `demo-reviewer`: Demo reviewer.";
  if (!readmeText.includes(marker)) {
    throw new Error(`Fixture README missing agent catalog marker: ${marker}`);
  }
  writeText(readmePath, readmeText.replace(marker, `${marker}\n${entry}`));
}

export function addRegisteredReviewerFixture(fixture: string, reviewer: "code-quality-reviewer"): string {
  const reviewerPath = path.join(fixture, "global", "agents", `${reviewer}.md`);
  writeText(reviewerPath, fs.readFileSync(path.join(helperRoot, "global", "agents", `${reviewer}.md`), "utf8"));
  const profilePath = path.join(fixture, "profiles", "all.json");
  const profile = fs.readFileSync(profilePath, "utf8");
  writeText(profilePath, profile.replace('"demo-reviewer"]', `"demo-reviewer", "${reviewer}"]`));
  appendReadmeAgentCatalogEntry(fixture, `- \`${reviewer}\`: Registered reviewer fixture.`);
  return reviewerPath;
}

export function addQwenLocalWorkerFixture(fixture: string): string {
  const workerName = "qwen-local-worker";
  const workerPath = path.join(fixture, "global", "agents", `${workerName}.md`);
  writeText(workerPath, fs.readFileSync(path.join(helperRoot, "global", "agents", `${workerName}.md`), "utf8"));

  const profilePath = path.join(fixture, "profiles", "all.json");
  const profile = JSON.parse(fs.readFileSync(profilePath, "utf8")) as { agents: string[] };
  profile.agents.push(workerName);
  writeText(profilePath, `${JSON.stringify(profile, null, 2)}\n`);
  appendReadmeAgentCatalogEntry(fixture, `- \`${workerName}\`: Non-registered local worker fixture.`);
  return workerPath;
}

export function newLibraryFixture(name: string): string {
  const dir = newTempDir(name);
  writeText(path.join(dir, "global", "skills", "demo-skill", "SKILL.md"), lines([
    "---",
    "name: demo-skill",
    "description: Use when testing a demo reusable skill.",
    "license: MIT",
    "---",
    "",
    "# Demo Skill",
    "",
    "Use this skill when testing reusable skill validation fixtures.",
    "",
    "## Output",
    "",
    "Return fixture validation evidence.",
    "",
  ]));
  writeText(path.join(dir, "global", "skills", "complain", "SKILL.md"), fs.readFileSync(path.join(helperRoot, "global", "skills", "complain", "SKILL.md"), "utf8"));
  writeText(path.join(dir, "docs", "feedbacks", "README.md"), fs.readFileSync(path.join(helperRoot, "docs", "feedbacks", "README.md"), "utf8"));
  writeText(
    path.join(dir, "instructions", "leaf-reviewer-agent-contract.md"),
    fs.readFileSync(path.join(helperRoot, "instructions", "leaf-reviewer-agent-contract.md"), "utf8"),
  );
  writeText(
    path.join(dir, "instructions", "reusable-project-agent-instructions.md"),
    fs.readFileSync(path.join(helperRoot, "instructions", "reusable-project-agent-instructions.md"), "utf8"),
  );
  writeText(path.join(dir, "global", "agents", "demo-reviewer.md"), lines([
    "---",
    "description: Reviews demo fixture behavior.",
    "mode: subagent",
    "permission:",
    "  read: allow",
    "  glob: allow",
    "  grep: allow",
    "  bash: deny",
    "  edit:",
    "    \"*\": deny",
    "    \"docs/feedbacks/**\": allow",
    "  task: deny",
    "  question: deny",
    "  skill:",
    "    \"*\": deny",
    "    complain: allow",
    "  webfetch: deny",
    "  websearch: deny",
    "  todowrite: deny",
    "  external_directory: deny",
    "  lsp: deny",
    "  doom_loop: deny",
    "---",
    "",
    "You are a read-only demo reviewer.",
    "",
    "## Contract Reference",
    "",
    "`instructions/leaf-reviewer-agent-contract.md`",
    "",
    "## Output",
    "",
    "Return:",
    "",
    "- `Candidate Reference / RC`: exact candidate inspected.",
    "- `Effective Model`: effective model id or `unknown`.",
    "- `Risk Matrix`: stable `Risk ID`, requirement/invariant, reachable scenario and enforced envelope, evidence, business consequence, likelihood or `unknown`, confidence, reproduction procedure when feasible, and smallest mitigation note.",
    "- `Evidence Gaps And Residual Risks`: missing evidence, unknown model provenance, or `none`.",
    "",
  ]));
  writeFixtureModelProfileBaseline(dir);
  writeText(path.join(dir, "instructions", "example.md"), lines(["# Example", ""]));
  writeText(
    path.join(dir, "instructions", "universal-development-loop.md"),
    fs.readFileSync(path.join(helperRoot, "instructions", "universal-development-loop.md"), "utf8"),
  );
  writeText(path.join(dir, "templates", "project", "AGENTS.md"), lines([
    "# Project Agent Instructions",
    "",
    "## Universal Development Loop",
    "",
    "- Shared runtime lifecycle authority comes from active global `AGENTS.md` and `change-ready-sdlc`; the Universal Development Loop is conceptual guidance, not a target-relative runtime dependency.",
    "- Implement and observably prove the smallest complete happy path. Ordinary Small may add the smallest focused post-proof regression test; Material automated-test authorship belongs to fresh test-only SDET.",
    "- User-owned scope is the accepted outcome and protected-boundary decisions; necessary local reversible dependency closure is autonomous. Reviewer/SDET evidence must never authorize mutation. Optional reviewers may run after MVP for concrete risk, project policy, or owner request, return a risk matrix, and never gate a stage. Fresh Material SDET returns exactly `critical-risks-reported | no-critical-risk | blocked`; another attempt requires an immediately-prior main-confirmed critical defect, production fix, and new proof, and the first valid no-confirmed-critical attempt permanently stops SDET for the root. Non-critical findings are parked. A partial slice handoff must not end an unfinished root goal.",
    "- Report `Development-Stage: development | MVP | RC<n> | stable` and `Stable Candidate: RC<n>` only for stable; no stage authorizes external operations.",
    "- Do not commit, push, merge, delete source artifacts, or alter remote state unless explicitly requested and allowed by repository policy.",
    "",
  ]));
  writeText(path.join(dir, "templates", "project", "opencode.json"), lines(["{", "  \"$schema\": \"https://opencode.ai/config.json\"", "}", ""]));
  writeText(path.join(dir, "templates", "project", "validation.md"), lines(["# Project Validation", "", "- Record observable happy-path proof, risk discovery, negative suites, hardening, and final validation.", ""]));
  writeText(path.join(dir, "templates", "project", "adapter.json"), lines([
    "{",
    "  \"schemaVersion\": 1,",
    "  \"validation\": {",
    "    \"focusedTest\": \"unknown\",",
    "    \"test\": \"unknown\"",
    "  },",
    "  \"unattended\": {",
    "    \"validationArgv\": [],",
    "    \"workflowOwner\": \"global-canonical\",",
    "    \"checkpointModes\": [",
    "      \"evidence-only\",",
    "      \"external\",",
    "      \"local-commit\"",
    "    ],",
    "    \"localCommitRequiresAuthorization\": true",
    "  }",
    "}",
    "",
  ]));
  writeText(path.join(dir, "templates", "ci", "github-actions.yml"), lines(["name: validate", "", "jobs:", "  validate:", "    steps:", "      - run: <validation-command>", ""]));
  writeText(path.join(dir, "profiles", "all.json"), lines([
    "{",
    "  \"name\": \"all\",",
    "  \"description\": \"Fixture all profile.\",",
    "  \"skills\": [\"complain\", \"demo-skill\"],",
    "  \"agents\": [\"demo-reviewer\"]",
    "}",
    "",
  ]));
  for (const tool of ["init-project.ts", "doctor.ts", "project-inventory.ts", "instruction-artifacts-inventory.ts", "pre-push-validate.ts"]) {
    writeText(path.join(dir, "tools", tool), lines(["#!/usr/bin/env node", "", ""]));
  }
  writePortableFixtureEntrypoint(path.join(dir, "global", "bin", "openspec-operation-gate.ts"));
  writePortableFixtureEntrypoint(path.join(dir, "global", "bin", "openspec-archive.ts"));
  writeText(path.join(dir, "global", "bin", "portable-process.ts"), "export function noop(): void {}\n");
  writePortableFixtureEntrypoint(path.join(dir, "global", "bin", "roadmap-mission.ts"));
  writeText(path.join(dir, "global", "bin", "roadmap-mission", "contracts.ts"), "export {}\n");
  writeText(path.join(dir, "global", "bin", "roadmap-mission", "preflight.ts"), "export {}\n");
  writePortableFixtureEntrypoint(path.join(dir, "global", "bin", "validate-staged.ts"));
  writeText(path.join(dir, ".githooks", "pre-push"), lines(["#!/bin/sh", "node tools/pre-push-validate.ts", ""]));
  writeText(path.join(dir, "package.json"), lines([
    "{",
    "  \"name\": \"opencode-dev-kit-fixture\",",
    "  \"private\": true,",
    "  \"type\": \"module\",",
    "  \"scripts\": {",
    "    \"setup:global\": \"node tools/install-code-intelligence-mcps.ts && node tools/install-opencode-global.ts\",",
    "    \"install:global\": \"node tools/install-opencode-global.ts\",",
    "    \"install:mcps\": \"node tools/install-code-intelligence-mcps.ts\",",
    "    \"init:project\": \"node tools/init-project.ts\",",
    "    \"doctor\": \"node tools/doctor.ts\",",
    "    \"project:inventory\": \"node tools/project-inventory.ts\",",
    "    \"instruction:inventory\": \"node tools/instruction-artifacts-inventory.ts\",",
    "    \"code-quality:inventory\": \"node tools/code-quality-inventory.ts\",",
    "    \"openspec:validate\": \"openspec validate --all\",",
    "    \"openspec:gate\": \"node global/bin/openspec-operation-gate.ts --root .\",",
    "    \"prepush:validate\": \"node tools/pre-push-validate.ts\",",
    "    \"validate\": \"node tools/validate-library.ts\",",
    "    \"validate:strict\": \"node tools/validate-library.ts --fail-on-warnings\",",
    "    \"test\": \"node tools/test-library.ts && node tools/test-install-opencode-global.ts\"",
    "  }",
    "}",
    "",
  ]));
  writeText(path.join(dir, "REPO_AGENTS.md"), lines([
    "# Repository Instructions",
    "",
    "## Portability Contract",
    "",
    "- Every workflow tool shipped into project context SHALL have a project-neutral reusable core with explicit root/config/argv inputs.",
    "- Keep package managers and validation commands in thin project adapters.",
    "- Before calling a tool reusable, prove it in an unrelated disposable project.",
    "- Repository-maintenance-only validators may target the kit schema when not distributed as generic project tools.",
    "",
    "## TypeScript Development",
    "",
    "- Use TypeScript for all repository automation and implementation code.",
    "- Do not add PowerShell, Python, or JavaScript source files; rewrite any such code to TypeScript instead.",
    "- For behavior changes, prove the smallest complete happy path before a separate fresh-context testing subagent authors risk-driven tests.",
    "- Run repository tooling through npm scripts or `node` against `.ts` entrypoints.",
    "",
    "## Deterministic Helper Automation",
    "",
    "- For repetitive, evidence-heavy, or token-heavy work, first consider whether a small deterministic helper could gather, count, validate, redact, diff, inventory, or enforce explicit rules more efficiently than manual inspection.",
    "- When writing helper code for agent workflow, use explicit inputs, explicit outputs, schemas or fixtures, stable ordering, privacy-safe output, and no hidden heuristics.",
    "- Do not encode fuzzy scoring, probabilistic classification, model-like summarization, or unstated inference in helper code.",
    "- If deterministic helper code cannot answer from inputs, report unknown, unreadable, unsupported, or blocked instead.",
    "",
    "## Completion Handoff",
    "",
    "- Ask the user only for real blockers, remote/destructive actions, scope or risk decisions, credentials, and MR/PR outcomes.",
    "- When asking, offer 2-4 self-contained next actions via `question` when available.",
    "- Put the recommended option first and end its label with `(Recommended)`.",
    "- In read-only, no-question, or subagent contexts, return a `Risk Matrix`, `Residual Risks`, or non-authorizing residual notes instead of asking the user directly.",
    "",
    "## Autonomous Work Contract",
    "",
    "- The main session owns skill selection, decomposition, validation, reviewer gates, and ready-to-land handoff.",
    "- User-owned scope is the accepted outcome and protected-boundary decisions; necessary local reversible dependency closure is autonomous. Reviewer/SDET evidence must never authorize mutation. Optional reviewers may run after MVP for concrete risk, project policy, or owner request, return a risk matrix, and never gate a stage. Fresh Material SDET returns exactly `critical-risks-reported | no-critical-risk | blocked`; another attempt requires an immediately-prior main-confirmed critical defect, production fix, and new proof, and the first valid no-confirmed-critical attempt permanently stops SDET for the root. Non-critical findings are parked. Never ask solely to approve an internal revision. Decision-ready handoff names the exact blocker. A partial slice handoff must not end an unfinished root goal.",
    "",
  ]));
  writeText(path.join(dir, "README.md"), lines([
    "# Fixture",
    "",
    "## What This Is",
    "",
    "This is an opencode-dev-kit fixture.",
    "",
    "## Universal Development Loop",
    "",
    "Use one canonical development process.",
    "",
    "## Install",
    "",
    "Install with npm scripts.",
    "",
    "## Bootstrap A Project",
    "",
    "Run init:project.",
    "",
    "## Token Economy",
    "",
    "Use deterministic inventories before broad reads.",
    "",
    "## Validate",
    "",
    "Run validate and test.",
    "",
    "## Routing Map",
    "",
    "- Demo work -> `demo-skill`.",
    "- Instruction artifacts -> `instruction-artifact-tuning`; broad audits -> `instruction-artifact-audit-runbook.md`.",
    "",
    "## Reviewer Gate Map",
    "",
    "- Instruction artifacts -> `instruction-artifact-reviewer`.",
    "",
    "## Skill Catalog",
    "",
    "- `complain`: Feedback ledger capture skill.",
    "- `demo-skill`: Demo skill.",
    "",
    "## Agent Catalog",
    "",
    "- `demo-reviewer`: Demo reviewer.",
    "",
    "## Instruction Templates",
    "",
    "- `example.md`: Demo instruction.",
    "- `leaf-reviewer-agent-contract.md`: Shared leaf-reviewer contract.",
    "- `reusable-project-agent-instructions.md`: Reusable project instructions.",
    "- `universal-development-loop.md`: Universal loop.",
    "",
    "## Porting Notes",
    "",
    "- Reviewer reports use non-authorizing `Follow-up Candidates` for separate work.",
    "",
  ]));
  return dir;
}

export function invokeProcessCapture(command: string, args: string[], workingDirectory: string, envOverride?: Record<string, string | undefined>): ProcessResult {
  const options: { cwd: string; encoding: BufferEncoding; shell: boolean; env?: NodeJS.ProcessEnv } = {
    cwd: workingDirectory,
    encoding: "utf8",
    shell: false,
  };
  if (envOverride) {
    const env = { ...process.env, ...envOverride };
    for (const [key, value] of Object.entries(envOverride)) {
      if (value === undefined) {
        delete (env as Record<string, string | undefined>)[key];
      }
    }
    options.env = env;
  }
  const result = spawnSync(command, args, options);
  if (result.error) {
    throw result.error;
  }
  return {
    exitCode: result.status ?? 0,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}

export function invokeValidator(fixtureRoot: string): ProcessResult {
  return invokeProcessCapture("node", [validator, "--root", fixtureRoot], helperRoot);
}

export function invokeInstaller(args: string[]): ProcessResult {
  return invokeProcessCapture("node", [installer, ...args], helperRoot);
}

export function invokeInitProject(args: string[]): ProcessResult {
  return invokeProcessCapture("node", [initProject, ...args], helperRoot);
}

export function invokeDoctor(args: string[], envOverride?: Record<string, string | undefined>): ProcessResult {
  return invokeProcessCapture("node", [doctor, ...args], helperRoot, envOverride);
}

export function invokeProjectInventory(args: string[]): ProcessResult {
  return invokeProcessCapture("node", [projectInventory, ...args], helperRoot);
}

export function invokeInstructionInventory(args: string[]): ProcessResult {
  return invokeProcessCapture("node", [instructionInventory, ...args], helperRoot);
}

export function assertSuccess(result: ProcessResult, message: string): void {
  if (result.exitCode !== 0) {
    throw new Error(`${message}\nExitCode: ${result.exitCode}\nOutput:\n${result.output}`);
  }
}

export function assertFailure(result: ProcessResult, message: string): void {
  if (result.exitCode === 0) {
    throw new Error(`${message}\nExpected failure but command succeeded.\nOutput:\n${result.output}`);
  }
}

export function assertOutputContains(result: ProcessResult, needle: string, message: string): void {
  if (!result.output.includes(needle)) {
    throw new Error(`${message}\nExpected output to contain: ${needle}\nOutput:\n${result.output}`);
  }
}

export function assertOutputExcludes(result: ProcessResult, needle: string, message: string): void {
  if (result.output.includes(needle)) {
    throw new Error(`${message}\nOutput must not contain: ${needle}\nOutput:\n${result.output}`);
  }
}

export function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

export function assertDeepEqual(actual: unknown, expected: unknown, message: string): void {
  const actualJson = JSON.stringify(actual, null, 2);
  const expectedJson = JSON.stringify(expected, null, 2);
  if (actualJson !== expectedJson) {
    throw new Error(`${message}\nExpected: ${expectedJson}\nActual: ${actualJson}`);
  }
}

export function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

export function sectionBetween(text: string, start: string, end: string): string {
  const startIndex = text.indexOf(start);
  assert(startIndex >= 0, `Missing section start: ${start}`);
  const endIndex = text.indexOf(end, startIndex + start.length);
  assert(endIndex >= 0, `Missing section end after ${start}: ${end}`);
  return text.slice(startIndex, endIndex);
}

/** Locate an exact ordered task item while allowing only its three OpenSpec checkbox states. */
export function taskSectionBetween(text: string, startTaskText: string, endTaskText: string): string {
  const locate = (taskText: string): number => {
    const id = /^(\d+\.\d+)\b/.exec(taskText)?.[1];
    assert(id != null, `Task lookup requires a leading numeric task ID: ${taskText}`);
    const matches = [...text.matchAll(/^- \[([^\]\r\n]*)\] (.*)$/gm)]
      .filter((match) => match[2] === id || match[2]!.startsWith(`${id} `));
    assert(matches.length === 1, `Expected exactly one task item for ${id}; found ${matches.length}.`);
    const match = matches[0]!;
    assert(match[1] === " " || match[1] === "x" || match[1] === "X", `Task ${id} has unsupported marker [${match[1]}].`);
    const item = match[2]!;
    assert(item === taskText || item.startsWith(`${taskText} `), `Task ${id} wording drifted; expected prefix: ${taskText}`);
    return match.index!;
  };
  const startIndex = locate(startTaskText);
  const endIndex = locate(endTaskText);
  assert(startIndex < endIndex, `Task order drifted: ${startTaskText} must precede ${endTaskText}.`);
  return text.slice(startIndex, endIndex);
}

export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

export function parseJsonOutput(result: ProcessResult): unknown {
  const start = result.output.indexOf("{");
  const end = result.output.lastIndexOf("}");
  if (start < 0 || end < start) {
    throw new Error(`Expected JSON object output.\nOutput:\n${result.output}`);
  }
  return JSON.parse(result.output.slice(start, end + 1)) as unknown;
}

export function asRecord(value: unknown, message: string): Record<string, unknown> {
  if (typeof value !== "object" || value == null || Array.isArray(value)) {
    throw new Error(message);
  }
  return value as Record<string, unknown>;
}

export function asArray(value: unknown, message: string): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) {
    throw new Error(message);
  }
  return value.map((item) => asRecord(item, message));
}

export function findBucket(rows: Array<Record<string, unknown>>, keyName: string, keyValue: string): Record<string, unknown> {
  const found = rows.find((row) => row[keyName] === keyValue);
  if (!found) {
    throw new Error(`Missing bucket ${keyName}=${keyValue}.\nRows:\n${JSON.stringify(rows, null, 2)}`);
  }
  return found;
}

export function anyPathWithBasename(rootPath: string, basename: string): boolean {
  return findPathWithBasename(rootPath, basename) != null;
}

export function findPathWithBasename(rootPath: string, basename: string): string | null {
  if (!fs.existsSync(rootPath)) {
    return null;
  }
  for (const entry of fs.readdirSync(rootPath, { withFileTypes: true })) {
    const entryPath = path.join(rootPath, entry.name);
    if (entry.name === basename) {
      return entryPath;
    }
    if (entry.isDirectory()) {
      const found = findPathWithBasename(entryPath, basename);
      if (found != null) {
        return found;
      }
    }
  }
  return null;
}

export function addImplementationWorkerFixture(fixture: string): string {
  const workerPath = path.join(fixture, "global", "agents", "implementation-worker.md");
  const sourcePath = path.join(helperRoot, "global", "agents", "implementation-worker.md");
  writeText(workerPath, fs.readFileSync(sourcePath, "utf8"));

  const profilePath = path.join(fixture, "profiles", "all.json");
  const profile = fs.readFileSync(profilePath, "utf8");
  writeText(profilePath, profile.replace("\"demo-reviewer\"]", "\"demo-reviewer\", \"implementation-worker\"]"));

  const workerRoutingLines = [
    "- Main is the default production author for Ordinary Small and Material.",
    "- Optional `implementation-worker` only for evidenced isolated production-only bounded slices with exact non-overlapping write scope, representative proof boundary, clear Acceptance Criteria, evidenced benefit, and a focused validation gate; post-proof automated-test evidence routes to `sdet-quality-engineer`.",
    "- When delegating to `implementation-worker`, pass a Universal Task Briefing Contract production brief with Acceptance Criteria and Verification.",
  ].join("\n");

  const agentsPath = path.join(fixture, "REPO_AGENTS.md");
  const agents = fs.readFileSync(agentsPath, "utf8");
  writeText(agentsPath, agents.replace(
    "- The main session owns skill selection, decomposition, validation, reviewer gates, and ready-to-land handoff.",
    `- The main session owns skill selection, decomposition, validation, reviewer gates, and ready-to-land handoff.\n${workerRoutingLines}`,
  ));

  const templatePath = path.join(fixture, "templates", "project", "AGENTS.md");
  const template = fs.readFileSync(templatePath, "utf8");
  writeText(templatePath, `${template}${workerRoutingLines}\n`);

  const readmePath = path.join(fixture, "README.md");
  const readme = fs.readFileSync(readmePath, "utf8");
  writeText(readmePath, readme.replace("- `demo-reviewer`: Demo reviewer.", "- `demo-reviewer`: Demo reviewer.\n- `implementation-worker`: Bounded production-only implementation worker."));
  return workerPath;
}

export const optionalReviewRoutingTokens = [
  "Development-Stage",
  "after MVP",
  "optional",
] as const;

export const optionalReviewRoutingText =
  "Optional final-candidate, code-quality, and domain reviewers may run after MVP for concrete risk, project policy, or owner request. Missing or unusable optional output is not itself a stage blocker. Reviewer evidence must never authorize mutation. Development-Stage remains main-owned, and a partial slice handoff must not end an unfinished root goal.";

/** @deprecated Use addSessionCompletionArbiterFixture; kept name alias only for migration clarity in focused suites. */
export const sessionDeliveryBindingTokens = optionalReviewRoutingTokens;

export function addSessionCompletionArbiterFixture(fixture: string): string {
  const arbiterPath = path.join(fixture, "global", "agents", "session-completion-arbiter.md");
  writeText(arbiterPath, fs.readFileSync(path.join(helperRoot, "global", "agents", "session-completion-arbiter.md"), "utf8"));
  appendReadmeAgentCatalogEntry(fixture, "- `session-completion-arbiter`: Hidden completion adjudicator.");
  const profilePath = path.join(fixture, "profiles", "all.json");
  const profile = fs.readFileSync(profilePath, "utf8");
  writeText(profilePath, profile.replace('"demo-reviewer"]', '"demo-reviewer", "session-completion-arbiter"]'));
  return arbiterPath;
}

export function addOptionalReviewRoutingFixture(fixture: string): void {
  for (const relative of ["REPO_AGENTS.md", path.join("instructions", "universal-development-loop.md"), path.join("templates", "project", "AGENTS.md")]) {
    const file = path.join(fixture, relative);
    writeText(file, `${fs.readFileSync(file, "utf8")}\n${optionalReviewRoutingText}\n`);
  }
}

/** @deprecated Prefer addSessionCompletionArbiterFixture + addOptionalReviewRoutingFixture. */
export function addSessionDeliveryBindingFixture(fixture: string): void {
  addSessionCompletionArbiterFixture(fixture);
  addOptionalReviewRoutingFixture(fixture);
}

export function runTests(tests: TestCase[], suiteLabel: string): void {
  let failed = 0;
  for (const test of tests) {
    try {
      test.run();
      console.log(`PASS: ${test.name}`);
    } catch (error) {
      failed++;
      const message = error instanceof Error ? error.message : String(error);
      console.log(`FAIL: ${test.name}`);
      console.log(message);
    }
  }

  if (failed > 0) {
    throw new Error(`${failed} ${suiteLabel} test(s) failed.`);
  }

  console.log(`OK: ${suiteLabel} tests=${tests.length}`);
}
