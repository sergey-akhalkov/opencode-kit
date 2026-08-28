import fs from "node:fs";
import path from "node:path";
import {
  GLOBAL_AGENTS_NON_WAIVABLE_RISK_CLAUSE,
  GLOBAL_AGENTS_PROTECTED_BOUNDARY_CATEGORIES,
} from "../contracts/skills.ts";
import { GLOBAL_ENGINEERING_QUALITY_MARKERS } from "../contracts/engineering-quality.ts";
import { materializeEvidenceIndex, resolveEvidenceLane } from "../evidence-index.ts";
import { inspectManagedPromptDrift } from "../opencode-runtime-sources.ts";
import { PORTABLE_WORKFLOW_RUNTIME_FILES } from "../runtime-surface-profile.ts";
import {
  asArray,
  asRecord,
  assert,
  assertDeepEqual,
  assertEqual,
  assertFailure,
  assertOutputContains,
  assertOutputExcludes,
  assertSuccess,
  findBucket,
  invokeDoctor,
  invokeInitProject,
  invokeProcessCapture,
  newTempDir,
  parseJsonOutput,
  type TestCase,
  libraryRoot,
  writeText,
} from "../test-helpers/library.ts";

const root = libraryRoot;

type IsolatedDoctorFixture = {
  doctorPath: string;
  globalDir: string;
  project: string;
  root: string;
};

const concreteAdapter = `{
  "validation": {
    "focusedTest": "project focused test",
    "test": "project full test",
    "typecheck": "project typecheck",
    "lint": "project lint",
    "build": "project build"
  }
}
`;

const concreteValidationDoc = `# Project Validation

| Purpose | Command | Notes |
| --- | --- | --- |
| Focused test | \`project focused test\` | Focused boundary. |
| Full test | \`project full test\` | Complete suite. |
| Typecheck | \`project typecheck\` | Types. |
| Lint | \`project lint\` | Lint. |
| Build | \`project build\` | Build. |
`;

const namedMaterialRiskFixtureCases = [
  ["public API protocol compatibility", "public API/protocol/compatibility", "public interfaces", "public API/protocol/compatibility"],
  ["persisted data migration", "persisted data or migration", "stored records", "persisted data/migration"],
  ["security privacy authorization", "security/privacy/authorization", "sensitive access", "security/privacy/authorization"],
  ["destructive remote", "destructive or remote", "state-changing operations", "destructive/remote"],
  ["concurrency correctness", "concurrency correctness", "parallel execution", "concurrency correctness"],
  ["deployment release", "deployment/release", "shipping changes", "deployment/release"],
  ["loaded instruction configuration lifecycle safety", "loaded instruction/configuration change that alters lifecycle or safety policy", "runtime guidance changes", "loaded instruction/config lifecycle/safety"],
] as const;
const namedMaterialRiskFixtureText = namedMaterialRiskFixtureCases.map(([, marker]) => marker).join(", ");
const protectedBoundaryAuthorityFixtureText = GLOBAL_AGENTS_PROTECTED_BOUNDARY_CATEGORIES.map(({ marker }) => marker).join("; ");

const globalAuthorityMinimumFixtureCases = [
  ...GLOBAL_AGENTS_PROTECTED_BOUNDARY_CATEGORIES.map(({ label, marker }) => ({
    name: `protected-boundary-${label}`,
    marker,
    diagnostic: `AGENTS.md missing protected-boundary category: ${label}`,
  })),
  {
    name: "non-waivable-critical-risk-clause",
    marker: GLOBAL_AGENTS_NON_WAIVABLE_RISK_CLAUSE,
    diagnostic: "AGENTS.md missing non-waivable critical-risk clause",
  },
];

const conformingAgentsAuthority = `# Independent Active Authority
## Change-Ready SDLC Routing
Ordinary Small is the default. Main is the default production author for Ordinary Small and Material.
Profiles remain Ordinary Small | Material. Ordinary work reports Outcome: working | blocked | unknown. Development-Stage: development | MVP | RC<n> | stable applies only inside qualification and a technically enforced operating envelope. Neither MVP, RC, nor stable authorizes deployment, release, installation, activation, credentials, or remote-state mutation.
Path: run-observe-correct before inspecting realistic requirement-linked edge cases.
The accepted outcome and protected boundaries define scope; expansion requires explicit user approval. Necessary local reversible work uses the smallest sufficient dependency closure. Reviewer/SDET/validation evidence never authorizes mutation.
Optional reviewers may run after current proof for concrete risk, project policy, or owner request; their absence is not a stage blocker. Triggered fresh SDET returns critical-risks-reported | no-critical-risk | blocked. The failed invocation remains finalized and non-reusable, but it does not impose a fixed mission-wide attempt ceiling. No SDET attempt count permanently prohibits future risk assessment of a materially changed candidate.
Before the first mutation, load change-ready-sdlc for an explicit stable request, project-required qualification, or a concrete Material risk: ${namedMaterialRiskFixtureText}.
High-risk behavior must not be downgraded merely because the diff is small.
Before stable, require a bounded accepted outcome and non-goals, real-boundary happy-path proof, complete accepted scope, green applicable project-native validation, protection of critical safety/data/authorization invariants, sufficient failure visibility, and no known reachable critical or non-deferrable defect.
Engineering quality authority: ${GLOBAL_ENGINEERING_QUALITY_MARKERS.join("; ")}.
Protected-boundary owner authority includes: ${protectedBoundaryAuthorityFixtureText}.
${GLOBAL_AGENTS_NON_WAIVABLE_RISK_CLAUSE}
## Universal Task Briefing Contract
Provide an execution-ready brief before specialist dispatch.
## Autonomous Work Contract
The primary orchestrator owns lifecycle state and bounded validation.
## Shared Reviewer Runtime Invariants
Reviewer invocation is optional and risk-driven, not a lifecycle gate. Return an evidence-backed risk matrix with stable \`Risk ID\` and \`Effective Model\`. Do not return an acceptance/rejection verdict. \`code-quality-reviewer\` returns only a reduction matrix. Main alone reproduces, classifies, fixes, parks, asks the owner, and changes lifecycle state.
`;

const conformingSkillAuthority = `---
name: change-ready-sdlc
description: Independently copied lifecycle authority for fixture validation.
---
# Change-Ready SDLC
## When To Load
Do not load for Ordinary Small.
Load before mutation for a concrete Material risk: ${namedMaterialRiskFixtureText}.
High-risk behavior must not be downgraded merely because the diff is small.
## Profiles And Stage
Development-Stage: development | MVP | RC<n> | stable. Profiles remain Ordinary Small | Material. Neither MVP, RC, nor stable authorizes external operations.
## Authoritative Brief
Freeze the accepted outcome capsule around the accepted outcome and protected boundaries. Scope expansion requires explicit owner approval. Necessary local reversible work uses the smallest sufficient dependency closure. Findings never authorize mutation.
## Outcome-First Stop Line
Runtime Proof is required. Non-critical findings are parked.
## Orchestrator And Writer Safety
Concurrent writers require terminal closure or write isolation.
## Qualification Flow
### 1. Implement And Prove MVP
Runtime Proof establishes MVP; candidate mutation returns to \`development\`.
### 2. Optional Risk Discovery
Reviewer absence, timeout, malformed output, or disagreement is not itself a stage blocker.
### 3. Critical SDET
SDET returns Action: critical-risks-reported | no-critical-risk | blocked. The failed invocation remains finalized and non-reusable, but it does not impose a fixed mission-wide attempt ceiling. No SDET attempt count permanently prohibits future risk assessment of a materially changed candidate.
### 4. Validate And Freeze RC
Validation and completed scope freeze the next RC.
### 5. Stable Handoff
Stable Candidate: RC<n> records the same RC at stable.
## Output
Report Development-Stage and Runtime Proof.
`;

function writePortableWorkflowTools(globalDir: string): void {
  for (const entry of PORTABLE_WORKFLOW_RUNTIME_FILES) {
    const relative = path.join(...entry.split("/"));
    writeText(path.join(globalDir, relative), fs.readFileSync(path.join(root, "global", relative), "utf8"));
  }
  writeText(path.join(globalDir, "package.json"), "{\n  \"private\": true,\n  \"type\": \"module\"\n}\n");
}

function writeConformingAuthority(globalDir: string): void {
  writeText(path.join(globalDir, "principles-of-work.md"), "# Principles of Work\n\n## Order Of Precedence\n\nFixture principles.\n");
  writeText(path.join(globalDir, "AGENTS.md"), conformingAgentsAuthority);
  writeText(path.join(globalDir, "skills", "change-ready-sdlc", "SKILL.md"), conformingSkillAuthority);
  writeText(
    path.join(globalDir, "skills", "behavioral-substitution-qualification", "SKILL.md"),
    fs.readFileSync(path.join(root, "global", "skills", "behavioral-substitution-qualification", "SKILL.md"), "utf8"),
  );
  writePortableWorkflowTools(globalDir);
}

function newIsolatedDoctorFixture(name: string, localConfig: string): IsolatedDoctorFixture {
  const fixtureRoot = newTempDir(`doctor-${name}`);
  const doctorPath = path.join(fixtureRoot, "tools", "doctor.ts");
  const globalDir = path.join(fixtureRoot, "global");
  const project = path.join(fixtureRoot, "project");
  const doctorSource = fs.readFileSync(path.join(root, "tools", "doctor.ts"), "utf8")
    .replace('from "jsonc-parser"', `from "${import.meta.resolve("jsonc-parser")}"`);
  assert(doctorSource.includes('from "./validators/active-authority.ts"'), "Isolated doctor must retain its active-authority module edge.");
  assert(doctorSource.includes('from "./validators/workflow-contracts.ts"'), "Isolated doctor must retain its workflow-contract module edge.");
  assert(doctorSource.includes('from "./opencode-runtime-sources.ts"'), "Isolated doctor must retain its runtime-source inspector module edge.");
  assert(!doctorSource.includes('from "js-yaml"'), "Doctor must not import js-yaml directly after active-authority extraction.");
  writeText(doctorPath, doctorSource);
  writeText(
    path.join(fixtureRoot, "tools", "runtime-surface-profile.ts"),
    fs.readFileSync(path.join(root, "tools", "runtime-surface-profile.ts"), "utf8"),
  );
  const runtimeSourcesSource = fs.readFileSync(path.join(root, "tools", "opencode-runtime-sources.ts"), "utf8")
    .replace('from "jsonc-parser"', `from "${import.meta.resolve("jsonc-parser")}"`);
  assert(!runtimeSourcesSource.includes('from "jsonc-parser"'), "Isolated runtime-sources must resolve the real installed jsonc-parser module.");
  writeText(path.join(fixtureRoot, "tools", "opencode-runtime-sources.ts"), runtimeSourcesSource);
  const authoritySource = fs.readFileSync(path.join(root, "tools", "validators", "active-authority.ts"), "utf8");
  assert(authoritySource.includes('from "js-yaml"'), "Active-authority must retain its real js-yaml parser edge.");
  const isolatedAuthoritySource = authoritySource
    .replace('from "js-yaml"', `from "${import.meta.resolve("js-yaml")}"`);
  assert(!isolatedAuthoritySource.includes('from "js-yaml"'), "Isolated active-authority must resolve the real installed js-yaml module.");
  writeText(path.join(fixtureRoot, "tools", "validators", "active-authority.ts"), isolatedAuthoritySource);
  writeText(path.join(fixtureRoot, "tools", "validators", "workflow-contracts.ts"), fs.readFileSync(path.join(root, "tools", "validators", "workflow-contracts.ts"), "utf8"));
  writeText(path.join(fixtureRoot, "tools", "contracts", "skills.ts"), fs.readFileSync(path.join(root, "tools", "contracts", "skills.ts"), "utf8"));
  writeText(path.join(fixtureRoot, "tools", "contracts", "engineering-quality.ts"), fs.readFileSync(path.join(root, "tools", "contracts", "engineering-quality.ts"), "utf8"));
  writeText(path.join(fixtureRoot, "tools", "validators", "engineering-quality.ts"), fs.readFileSync(path.join(root, "tools", "validators", "engineering-quality.ts"), "utf8"));
  const configPolicy = fs.readFileSync(path.join(root, "tools", "validators", "opencode-config.ts"), "utf8")
    .replace('from "jsonc-parser"', `from "${import.meta.resolve("jsonc-parser")}"`);
  writeText(path.join(fixtureRoot, "tools", "validators", "opencode-config.ts"), configPolicy);
  writeText(path.join(fixtureRoot, "tools", "validators", "context.ts"), fs.readFileSync(path.join(root, "tools", "validators", "context.ts"), "utf8"));
  const changeModules = path.join(root, "global", "bin", "openspec-change");
  for (const name of fs.readdirSync(changeModules).sort()) {
    if (!name.endsWith(".ts")) continue;
    writeText(path.join(globalDir, "bin", "openspec-change", name), fs.readFileSync(path.join(changeModules, name), "utf8"));
  }
  writeText(path.join(fixtureRoot, "instructions", "universal-development-loop.md"), "# Universal Development Loop\n");
  writeText(path.join(fixtureRoot, "profiles", "all.json"), "{}\n");
  writeText(path.join(globalDir, "opencode.json.template"), "{\n  \"$schema\": \"https://opencode.ai/config.json\"\n}\n");
  fs.writeFileSync(path.join(globalDir, "opencode.json"), Buffer.from(localConfig, "utf8"));
  writeConformingAuthority(globalDir);
  for (const relative of [
    path.join("agents", "implementation-worker.md"),
    path.join("agents", "sdet-quality-engineer.md"),
    path.join("agents", "evidence-sufficiency-reviewer.md"),
    path.join("agents", "final-candidate-reviewer.md"),
  ]) {
    writeText(path.join(globalDir, relative), `# Fixture authority: ${relative}\n`);
  }
  writeText(path.join(project, "AGENTS.md"), "# Project Agent Instructions\n\n## Runtime Authority\n");
  writeText(path.join(project, "opencode-dev-kit", "adapter.json"), "{}\n");
  writeText(path.join(project, "opencode-dev-kit", "validation.md"), "# Validation\n");
  writeText(path.join(project, "docs", "feedbacks", "README.md"), "# Feedback\n");
  writeText(path.join(project, "opencode.json"), "{}\n");
  return { doctorPath, globalDir, project, root: fixtureRoot };
}

function invokeIsolatedDoctor(
  fixture: IsolatedDoctorFixture,
  env: Record<string, string | undefined> = {},
  format: "json" | "markdown" = "json",
) {
  return invokeIsolatedDoctorArgs(
    fixture,
    ["--project", fixture.project, "--format", format],
    env,
    fixture.root,
  );
}

function invokeIsolatedDoctorArgs(
  fixture: IsolatedDoctorFixture,
  args: string[],
  env: Record<string, string | undefined> = {},
  workingDirectory = fixture.root,
) {
  return invokeProcessCapture(
    process.execPath,
    [fixture.doctorPath, ...args],
    workingDirectory,
    { OPENCODE_CONFIG: undefined, OPENCODE_CONFIG_DIR: fixture.globalDir, ...env },
  );
}

function parseDoctorV2(result: { output: string }): {
  campaignChecks: Array<Record<string, unknown>>;
  checks: Array<Record<string, unknown>>;
  report: Record<string, unknown>;
  unattendedChecks: Array<Record<string, unknown>>;
} {
  const report = asRecord(parseJsonOutput(result), "Doctor JSON root should be an object.");
  assertEqual(report.tool, "opencode-dev-kit-doctor", "Doctor tool id drifted.");
  assertEqual(report.version, 3, "Doctor report version must be 3.");
  assert(report.status === "pass" || report.status === "warn" || report.status === "blocked", "Doctor structural status is invalid.");
  assert(report.qualificationStatus === "pass" || report.qualificationStatus === "blocked", "Doctor qualificationStatus is invalid.");
  assert(report.unattendedMissionStatus === "pass" || report.unattendedMissionStatus === "blocked", "Doctor unattendedMissionStatus is invalid.");
  assert(report.campaignStatus === "pass" || report.campaignStatus === "blocked", "Doctor campaignStatus is invalid.");
  const checks = asArray(report.checks, "Doctor checks should be an array.");
  for (const check of checks) {
    assert(typeof check.name === "string", "Every doctor check must have a name.");
    assert(typeof check.detail === "string", "Every doctor check must have detail.");
    assert(check.status === "pass" || check.status === "warn" || check.status === "blocked", "Every doctor check must have a valid structural status.");
    assert(typeof check.blocksQualification === "boolean", "Every doctor check must expose blocksQualification.");
    assert(!String(check.name).startsWith("unattended "), "Ordinary qualification checks must not include unattended readiness rows.");
  }
  const unattendedChecks = asArray(report.unattendedChecks, "Doctor unattendedChecks should be an array.");
  for (const check of unattendedChecks) {
    assert(typeof check.name === "string", "Every unattended check must have a name.");
    assert(typeof check.detail === "string", "Every unattended check must have detail.");
    assert(check.status === "pass" || check.status === "warn" || check.status === "blocked", "Every unattended check must have a valid status.");
  }
  for (const name of [
    "unattended runtime authority",
    "unattended mission definition",
    "unattended aggregate validation argv",
    "unattended checkpoint support",
    "unattended canonical workflow",
    "unattended installed binaries",
    "unattended mission runtime",
    "unattended long-run guard limits",
  ]) {
    findBucket(unattendedChecks, "name", name);
  }
  const campaignChecks = asArray(report.campaignChecks, "Doctor campaignChecks should be an array.");
  for (const check of campaignChecks) {
    assert(typeof check.name === "string", "Every campaign check must have a name.");
    assert(typeof check.detail === "string", "Every campaign check must have detail.");
    assert(check.status === "pass" || check.status === "blocked", "Every campaign check must have a valid status.");
    assertEqual(check.blocksQualification, false, "Campaign readiness must not block ordinary qualification.");
  }
  for (const name of [
    "campaign definition and adapter",
    "campaign contained paths",
    "campaign validation and checkpoint",
    "campaign provider budget",
    "campaign runtime and workflow",
    "campaign project state",
    "campaign writer and mission",
    "campaign supervisor",
  ]) {
    findBucket(campaignChecks, "name", name);
  }
  assertEqual(
    report.qualificationStatus,
    checks.some((check) => check.blocksQualification === true) ? "blocked" : "pass",
    "Top-level qualificationStatus must derive from ordinary per-check blocksQualification fields only.",
  );
  assertEqual(
    report.unattendedMissionStatus,
    unattendedChecks.some((check) => check.status !== "pass") ? "blocked" : "pass",
    "unattendedMissionStatus must derive from unattendedChecks only.",
  );
  assertEqual(
    report.campaignStatus,
    campaignChecks.some((check) => check.status !== "pass") ? "blocked" : "pass",
    "campaignStatus must derive from campaignChecks only.",
  );
  return { campaignChecks, checks, report, unattendedChecks };
}

function namedBlockers(report: Record<string, unknown>, gate: "campaign" | "qualification" | "structural" | "unattended"): string[] {
  const blockers = asRecord(report.blockers, "Doctor blockers should be an object.");
  const selected = blockers[gate];
  assert(
    Array.isArray(selected) && selected.every((item) => typeof item === "string"),
    `Doctor ${gate} blockers must be a string array.`,
  );
  return selected as string[];
}

function writeReadyCampaign(project: string, hostResume = false): void {
  writeText(path.join(project, "src", "index.ts"), "export const ready = true;\n");
  writeText(path.join(project, "openspec", "config.yaml"), "schema: spec-driven\n");
  writeText(path.join(project, "opencode-dev-kit", "work-campaign-adapter.json"), `${JSON.stringify({
    adapterId: "doctor-campaign-adapter",
    inventoryArgv: [process.execPath, "--version"],
    realBoundaryProofArgv: [process.execPath, "--version"],
    schemaVersion: 1,
  }, null, 2)}\n`);
  writeText(path.join(project, "opencode-dev-kit", "work-campaign.json"), `${JSON.stringify({
    adapterPath: "opencode-dev-kit/work-campaign-adapter.json",
    allowedEffects: ["local-read"],
    authorizationRefs: {},
    budgets: {
      evidenceBytes: 1_048_576,
      modelCalls: 1,
      processAttempts: 2,
      wallClockSeconds: 300,
      waves: 1,
    },
    campaignId: "doctor-campaign",
    checkpoint: {
      localCommitAuthorized: false,
      mode: "evidence-only",
      workspace: "disposable",
    },
    evidencePath: ".work-campaign/evidence",
    exclusions: [".work-campaign/evidence"],
    hostResume: { enabled: hostResume, supervisorRequired: hostResume },
    outcome: "Prove campaign doctor readiness without project mutation.",
    playbook: "audit-remediate",
    protectedDecisionPolicy: "owner-required",
    reportPath: ".work-campaign/report.md",
    schemaVersion: 1,
    scopeRoots: ["src/index.ts"],
    statePath: ".opencode-dev-kit/runtime/work-campaigns/doctor-campaign",
    stopPolicy: {
      onBudgetExhausted: true,
      onExplicitStop: true,
      onOwnerRequired: true,
      onProtected: true,
      onUnknown: true,
    },
    validationArgv: [process.execPath, "--version"],
  }, null, 2)}\n`);
}

function commitFixture(project: string, message: string): void {
  const commands = [
    ["init"],
    ["add", "--all"],
    ["-c", "user.name=Doctor Fixture", "-c", "user.email=doctor@example.invalid", "commit", "-m", message],
  ];
  for (const args of commands) {
    const result = invokeProcessCapture("git", args, project);
    assertSuccess(result, `Git fixture command failed: git ${args.join(" ")}`);
  }
}

export const doctorTests: TestCase[] = [
  {
    name: "evidence index resolves one named lane without reading unrelated bundles",
    run: () => {
      const fixture = newTempDir("evidence-index");
      writeText(path.join(fixture, "selected", "failure.json"), "private failure evidence");
      writeText(path.join(fixture, "selected", "unlock.json"), "private unlock evidence");
      writeText(path.join(fixture, "selected", "terminal.json"), "private terminal evidence");
      const index = path.join(fixture, "evidence-index.json");
      writeText(index, JSON.stringify({
        schemaVersion: 1,
        lanes: [
          {
            candidateId: "candidate-r1",
            currentTerminalBundle: "selected/terminal.json",
            firstCausalFailure: "selected/failure.json",
            name: "selected-lane",
            retryCondition: "Retry only after the selected terminal evaluator changes.",
            successorUnlockEvidence: "selected/unlock.json",
            terminalStatus: "complete",
          },
          {
            candidateId: "unrelated-r1",
            currentTerminalBundle: "unrelated-does-not-exist/raw.json",
            firstCausalFailure: null,
            name: "unrelated-lane",
            retryCondition: "Unrelated lane remains unresolved.",
            successorUnlockEvidence: null,
            terminalStatus: "unknown",
          },
        ],
      }));

      const selected = resolveEvidenceLane(index, "selected-lane");
      assertEqual(selected.lane, "selected-lane", "Resolver must select the requested lane.");
      assertEqual(selected.terminalStatus, "complete", "Resolver must preserve terminal status.");
      assertDeepEqual(
        selected.references.map((reference) => reference.role),
        ["first-causal-failure", "successor-unlock", "current-terminal"],
        "Resolver must return the bounded causal and terminal references.",
      );
      const serialized = JSON.stringify(selected);
      for (const raw of ["private failure evidence", "private unlock evidence", "private terminal evidence", "Unrelated lane remains unresolved."]) {
        assert(!serialized.includes(raw), "Resolver must not print retry or referenced evidence content.");
      }

      let missingFailed = false;
      try {
        resolveEvidenceLane(index, "unrelated-lane");
      } catch {
        missingFailed = true;
      }
      assert(missingFailed, "A missing reference must fail only the affected selected lane.");
    },
  },
  {
    name: "evidence index resolves schema 2 hashed lanes without inferring terminal status",
    run: () => {
      const fixture = newTempDir("evidence-index-v2");
      writeText(path.join(fixture, "selected", "terminal.json"), "private terminal evidence");
      const index = path.join(fixture, "evidence-index.json");
      writeText(index, JSON.stringify({
        schemaVersion: 2,
        lanes: [
          {
            files: [{
              bytes: 25,
              digest: "a".repeat(64),
              path: "terminal.json",
            }],
            kind: "terminal",
            name: "selected-lane",
            pathPrefix: "selected",
          },
          {
            files: [{
              bytes: 1,
              digest: "b".repeat(64),
              path: "unrelated-does-not-exist/raw.json",
            }],
            kind: "runner",
            name: "unrelated-lane",
          },
        ],
      }));

      const selected = resolveEvidenceLane(index, "selected-lane");
      assertEqual(selected.schemaVersion, 2, "Resolver must preserve schema 2.");
      assertEqual(selected.lane, "selected-lane", "Resolver must select the requested hashed lane.");
      assertDeepEqual(selected.references.map((reference) => reference.role), ["indexed-file"], "Resolver must return only selected files.");
      assertEqual(selected.references[0].path, "selected/terminal.json", "Resolver must expand the lane path prefix.");
      assert(!("terminalStatus" in selected), "Schema 2 lane kind must not infer a terminal status.");
      assert(!JSON.stringify(selected).includes("private terminal evidence"), "Resolver must not print referenced evidence content.");

      let missingFailed = false;
      try {
        resolveEvidenceLane(index, "unrelated-lane");
      } catch {
        missingFailed = true;
      }
      assert(missingFailed, "A missing schema 2 reference must fail only the affected selected lane.");
    },
  },
  {
    name: "evidence index materialization preserves compact bounded schema 2 output",
    run: () => {
      const fixture = newTempDir("evidence-index-v2-materialize");
      writeText(path.join(fixture, "terminal.json"), "terminal evidence");
      const index = path.join(fixture, "evidence-index.json");
      writeText(index, JSON.stringify({
        schemaVersion: 2,
        lanes: [{
          files: [{ bytes: 0, digest: "a".repeat(64), path: "terminal.json" }],
          kind: "terminal",
          name: "selected-lane",
        }],
      }, null, 2));

      const materialized = materializeEvidenceIndex(index);
      const text = fs.readFileSync(index, "utf8");
      assertDeepEqual(materialized, { files: 1, lanes: 1 }, "Materializer must report the exact bounded inventory.");
      assert(!text.includes("\n  "), "Materializer must not expand bounded indexes with pretty-print whitespace.");
      assert(text.endsWith("\n"), "Materializer must retain one terminal newline.");
      assertEqual(resolveEvidenceLane(index, "selected-lane").references[0].indexedBytes, 17, "Materialized bytes must match the current file.");
    },
  },
  {
    name: "runtime-source diagnostics classify managed prompt drift without disclosing prompt text",
    run: () => {
      const fixture = newTempDir("managed-prompt-drift");
      const template = path.join(fixture, "opencode.json.template");
      const active = path.join(fixture, "opencode.json");
      const prompt = "Original User Goal Session Reflection Live-Attempt Gate Next-Session Action Pending Strategy History private-template-sentinel";
      const writePrompt = (file: string, value: string): void => writeText(file, JSON.stringify({ agent: { compaction: { prompt: value } } }));

      writePrompt(template, prompt);
      writePrompt(active, prompt);
      const same = inspectManagedPromptDrift(template, active)[0];
      assertEqual(same.status, "same", "Matching prompt digests and markers must classify as same.");
      assertEqual(same.restartBoundary, "none", "Matching prompts need no restart boundary.");
      assertDeepEqual(
        same.template?.markers,
        ["live-attempt-gate", "next-session-action", "original-user-goal", "pending-strategy-history", "session-reflection"],
        "Diagnostics must expose only stable semantic marker IDs.",
      );

      writePrompt(active, "Original User Goal removed-workflow-matrix private-active-sentinel");
      const different = inspectManagedPromptDrift(template, active)[0];
      assertEqual(different.status, "different", "Known compaction prompt drift must classify as different.");
      assertEqual(different.restartBoundary, "synchronize-active-copy-and-restart", "Drift must name the explicit synchronization and restart boundary.");
      const serialized = JSON.stringify(different);
      assert(!serialized.includes("private-template-sentinel"), "Template prompt text must not appear in diagnostics.");
      assert(!serialized.includes("private-active-sentinel"), "Active prompt text must not appear in diagnostics.");

      writeText(active, "{}\n");
      assertEqual(inspectManagedPromptDrift(template, active)[0].status, "missing", "Absent active managed prompt must classify as missing.");
      writeText(active, "{ malformed\n");
      assertEqual(inspectManagedPromptDrift(template, active)[0].status, "unknown", "Unreadable active config must classify as unknown.");
    },
  },
  {
    name: "doctor distinguishes the self-hosted kit contract from a similarly named consumer",
    run: () => {
      const fixture = newIsolatedDoctorFixture("repository-contract", "{\n  \"permission\": \"ask\"\n}\n");
      const kit = path.join(fixture.root, "kit-checkout");
      fs.mkdirSync(kit);
      writeText(path.join(kit, "package.json"), JSON.stringify({
        name: "opencode-dev-kit",
        scripts: { test: "node test.mjs", "validate:strict": "node validate.mjs" },
      }, null, 2));
      writeText(path.join(kit, "REPO_AGENTS.md"), "# Maintainer authority\n");
      writeConformingAuthority(path.join(kit, "global"));
      const kitResult = invokeIsolatedDoctorArgs(
        fixture,
        ["--project", kit, "--format", "json", "--require", "qualification"],
      );
      assertSuccess(kitResult, "Exact self-hosted kit contract must pass qualification without consumer files.");
      const kitReport = parseDoctorV2(kitResult);
      assertEqual(kitReport.report.qualificationStatus, "pass", "Self-hosted kit contract must pass qualification.");
      assertOutputContains(kitResult, "Self-hosted kit checkout selected", "Kit diagnostic must disclose the selected repository contract.");
      assertEqual(findBucket(kitReport.checks, "name", "project AGENTS.md").status, "pass", "REPO_AGENTS.md plus global authority must replace consumer AGENTS only for the kit.");
      assertEqual(findBucket(kitReport.checks, "name", "project adapter validation").status, "pass", "Concrete package scripts must replace consumer adapter validation only for the kit.");

      const consumer = path.join(fixture.root, "opencode-dev-kit");
      fs.mkdirSync(consumer);
      writeText(path.join(consumer, "package.json"), "{\n  \"name\": \"ordinary-consumer\"\n}\n");
      const consumerResult = invokeIsolatedDoctorArgs(
        fixture,
        ["--project", consumer, "--format", "json", "--require", "qualification"],
      );
      assertFailure(consumerResult, "A similarly named unbootstrapped consumer must remain qualification-blocked.");
      const consumerReport = parseDoctorV2(consumerResult);
      assertEqual(consumerReport.report.qualificationStatus, "blocked", "Directory name must not activate the kit exception.");
      assertOutputContains(consumerResult, "Consumer project rules selected", "Consumer diagnostic must disclose its safe classification.");
      assertEqual(findBucket(consumerReport.checks, "name", "project AGENTS.md").blocksQualification, true, "Consumer AGENTS absence must still block qualification.");
      assertEqual(findBucket(consumerReport.checks, "name", "project adapter validation").blocksQualification, true, "Consumer validation absence must still block qualification.");

      writeText(
        path.join(fixture.root, "openspec", "specs", "library-instruction-artifacts", "spec.md"),
        "### Requirement: Final history retrospective is an evidence-bound completion task\n",
      );
      writeText(
        path.join(fixture.root, "global", "skills", "openspec-apply-change", "SKILL.md"),
        "Optional retrospective or workflow feedback stays outside the product task graph\n",
      );
      for (const [label, project] of [["kit", kit], ["consumer", consumer]] as const) {
        const conflictResult = invokeIsolatedDoctorArgs(
          fixture,
          ["--project", project, "--format", "json", "--require", "qualification"],
        );
        assertFailure(conflictResult, `A real workflow conflict must block the ${label} qualification report.`);
        const conflictReport = parseDoctorV2(conflictResult);
        assert(
          namedBlockers(conflictReport.report, "qualification").includes("workflow contract consistency"),
          `Workflow conflict must appear in the ${label} qualification blockers.`,
        );
        const workflow = findBucket(conflictReport.checks, "name", "workflow contract consistency");
        assertEqual(workflow.status, "blocked", `Workflow conflict must be visible in the ${label} check.`);
        assertOutputContains(conflictResult, "final-history-retrospective", `Workflow contract id must be reported for the ${label}.`);
      }
    },
  },
  {
    name: "doctor delegates active-authority parsing to a side-effect-free module",
    run: () => {
      const doctorSource = fs.readFileSync(path.join(root, "tools", "doctor.ts"), "utf8");
      const authoritySource = fs.readFileSync(path.join(root, "tools", "validators", "active-authority.ts"), "utf8");
      assert(doctorSource.includes('from "./validators/active-authority.ts"'), "Doctor must import the active-authority policy module.");
      assertEqual(
        [...authoritySource.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]).join(","),
        "js-yaml,../contracts/skills.ts",
        "Active-authority imports must remain limited to the real YAML parser and canonical authority marker groups.",
      );
      for (const symbol of ["agentsAuthorityProblem", "skillAuthorityProblem"]) {
        assert(authoritySource.includes(`export function ${symbol}(`), `Active-authority must export ${symbol}.`);
        assert(!new RegExp(`(?:export\\s+)?function\\s+${symbol}\\s*\\(`).test(doctorSource), `Doctor must not duplicate ${symbol}.`);
      }
    },
  },
  {
    name: "doctor reports honest warnings for the default project bootstrap",
    run: () => {
      const project = newTempDir("doctor-project");
      assertSuccess(invokeInitProject(["--target", project, "--mode", "write"]), "Bootstrap should prepare the doctor fixture.");
      // Keep the real init-project bootstrap project, but resolve authority from an
      // independently conforming copy. Production AGENTS/skill fidelity is owned by
      // active-authority contract tests; this oracle isolates bootstrap validation honesty.
      const fixture = newIsolatedDoctorFixture("default-bootstrap-authority", "{\n  \"permission\": \"ask\"\n}\n");
      const result = invokeIsolatedDoctorArgs(
        fixture,
        ["--project", project, "--format", "json"],
        { OPENCODE_CONFIG: undefined, OPENCODE_CONFIG_DIR: fixture.globalDir },
        fixture.root,
      );
      assertSuccess(result, "Doctor warnings should remain machine-readable with exit 0 for the default bootstrap.");
      const { checks, report } = parseDoctorV2(result);
      assertEqual(report.project, "<redacted>", "Doctor should redact project paths by default.");
      assertEqual(report.status, "warn", "Default unknown validation entries must keep doctor status at warn.");
      assertEqual(report.qualificationStatus, "blocked", "Unresolved default validation must block qualification without changing structural exit behavior.");
      for (const name of ["project AGENTS.md", "project adapter", "project validation doc", "project feedback ledger", "active kit required runtime authority", "active kit optional default role files"]) {
        assertEqual(findBucket(checks, "name", name).status, "pass", `Default bootstrap structural check should pass: ${name}`);
      }
      const validation = findBucket(checks, "name", "project adapter validation");
      assertEqual(validation.status, "warn", "Default bootstrap validation commands must remain unresolved.");
      assertEqual(validation.blocksQualification, true, "Unresolved validation commands must block qualification.");
      assertEqual(validation.detail, "No complete validation adapter source. adapter.json unresolved (focusedTest, test, typecheck, lint, build); validation.md unresolved (focusedTest, test, typecheck, lint, build). Provide concrete opencode-dev-kit/adapter.json validation entries or a complete opencode-dev-kit/validation.md Purpose/Command table for Focused test, Full test, Typecheck, Lint, and Build before RC qualification.", "Doctor must report both unresolved sources and all five purposes in stable order.");
      if (fs.existsSync(path.join(project, "instructions", "universal-development-loop.md"))) {
        throw new Error("Doctor/bootstrap must not require or create a target-relative UDL file.");
      }
    },
  },
  {
    name: "doctor accepts concrete adapter validation entries structurally",
    run: () => {
      const fixture = newIsolatedDoctorFixture("concrete-validation", "{\n  \"permission\": \"ask\"\n}\n");
      writeText(path.join(fixture.project, "opencode-dev-kit", "adapter.json"), concreteAdapter);
      const result = invokeIsolatedDoctor(fixture);
      assertSuccess(result, "Concrete adapter entries should pass structural doctor checks.");
      const { checks, report } = parseDoctorV2(result);
      assertEqual(report.status, "warn", "Unknown managed prompt drift should remain advisory for an otherwise complete fixture.");
      assertEqual(report.qualificationStatus, "pass", "Fully concrete complete authority should pass qualification diagnostics.");
      assertEqual(findBucket(checks, "name", "project adapter validation").status, "pass", "Concrete adapter validation entries should pass their check.");
      assertEqual(findBucket(checks, "name", "active kit required runtime authority").status, "pass", "Current required active kit authority should pass.");
      assertEqual(findBucket(checks, "name", "portable project workflow tools").status, "pass", "Present portable archive and staged tools should pass.");
      assertEqual(findBucket(checks, "name", "active kit optional default role files").status, "pass", "Present optional default roles should pass their advisory check.");
      assertEqual(findBucket(checks, "name", "managed compaction prompt drift").status, "warn", "A fixture without the managed prompt must report unknown drift without blocking qualification.");
    },
  },
  {
    name: "doctor blocks qualification when portable workflow tools are missing",
    run: () => {
      const fixture = newIsolatedDoctorFixture("missing-portable-tools", "{\n  \"permission\": \"ask\"\n}\n");
      writeText(path.join(fixture.project, "opencode-dev-kit", "adapter.json"), concreteAdapter);
      fs.rmSync(path.join(fixture.globalDir, "bin"), { recursive: true, force: true });
      const result = invokeIsolatedDoctor(fixture);
      assertFailure(result, "Missing portable tools must produce a blocked doctor report.");
      assertEqual(result.exitCode, 2, "Blocked portable-tool inventory must use exit code 2.");
      const { checks, report } = parseDoctorV2(result);
      assertEqual(report.status, "blocked", "Missing portable tools must set structural blocked status.");
      assertEqual(report.qualificationStatus, "blocked", "Missing portable tools must block qualification.");
      const portable = findBucket(checks, "name", "portable project workflow tools");
      assertEqual(portable.status, "blocked", "Missing portable tools check must be blocked.");
      assertEqual(portable.blocksQualification, true, "Missing portable tools must expose blocksQualification=true.");
      const detail = String(portable.detail).replaceAll("\\", "/");
      assert(detail.includes("bin/openspec-archive.ts"), "Portable-tool diagnostic must name the archive entrypoint.");
      assert(detail.includes("bin/validate-staged.ts"), "Portable-tool diagnostic must name the staged entrypoint.");
      assert(!result.output.includes(fixture.root), "Portable-tool diagnostics must not expose absolute fixture paths.");
    },
  },
  {
    name: "doctor accepts a complete validation document when adapter.json is absent",
    run: () => {
      const fixture = newIsolatedDoctorFixture("validation-doc-only", "{\n  \"permission\": \"ask\"\n}\n");
      fs.rmSync(path.join(fixture.project, "opencode-dev-kit", "adapter.json"));
      writeText(path.join(fixture.project, "opencode-dev-kit", "validation.md"), concreteValidationDoc);
      const result = invokeIsolatedDoctor(fixture);
      assertSuccess(result, "A complete template-compatible validation document should qualify without adapter.json.");
      const { checks, report } = parseDoctorV2(result);
      assertEqual(report.status, "warn", "Missing optional adapter.json should remain structurally visible.");
      assertEqual(report.qualificationStatus, "pass", "One complete documented validation source must be sufficient.");
      const validation = findBucket(checks, "name", "project adapter validation");
      assertEqual(validation.status, "pass", "Complete validation.md commands should pass validation-source diagnostics.");
      assertEqual(validation.blocksQualification, false, "Complete validation.md must not block qualification.");
      assert(String(validation.detail).includes("opencode-dev-kit/validation.md"), "Validation diagnostics should identify the complete source.");
    },
  },
  ...[
    {
      name: "malformed adapter with complete validation document",
      adapter: "{ \"validation\": ",
      validationDoc: concreteValidationDoc,
      expectedNote: "adapter.json malformed",
    },
    {
      name: "unresolved validation document with complete adapter",
      adapter: concreteAdapter,
      validationDoc: concreteValidationDoc.replace("`project build`", "`UNKNOWN`"),
      expectedNote: "validation.md unresolved (build)",
    },
  ].map(({ name, adapter, validationDoc, expectedNote }): TestCase => ({
    name: `doctor accepts ${name}`,
    run: () => {
      const fixture = newIsolatedDoctorFixture(name.replace(/\s+/g, "-"), "{\n  \"permission\": \"ask\"\n}\n");
      writeText(path.join(fixture.project, "opencode-dev-kit", "adapter.json"), adapter);
      writeText(path.join(fixture.project, "opencode-dev-kit", "validation.md"), validationDoc);
      const result = invokeIsolatedDoctor(fixture);
      assertSuccess(result, `${name} should remain non-blocking because the alternate source is complete.`);
      const { checks, report } = parseDoctorV2(result);
      assertEqual(report.qualificationStatus, "pass", `${name} must pass qualification.`);
      const validation = findBucket(checks, "name", "project adapter validation");
      assertEqual(validation.status, "pass", `${name} should pass the combined validation-source check.`);
      assertEqual(validation.blocksQualification, false, `${name} must not block qualification.`);
      assert(String(validation.detail).includes(expectedNote), `${name} should disclose the non-blocking alternate-source state.`);
    },
  })),
  {
    name: "doctor blocks qualification when both validation sources are missing",
    run: () => {
      const fixture = newIsolatedDoctorFixture("validation-sources-missing", "{\n  \"permission\": \"ask\"\n}\n");
      fs.rmSync(path.join(fixture.project, "opencode-dev-kit", "adapter.json"));
      fs.rmSync(path.join(fixture.project, "opencode-dev-kit", "validation.md"));
      const result = invokeIsolatedDoctor(fixture);
      assertSuccess(result, "Missing validation sources should remain a warning-level structural result.");
      const { checks, report } = parseDoctorV2(result);
      assertEqual(report.status, "warn", "Missing validation sources should be structurally warn, not process failure.");
      assertEqual(report.qualificationStatus, "blocked", "Neither validation source being complete must block qualification.");
      const validation = findBucket(checks, "name", "project adapter validation");
      assertEqual(validation.status, "warn", "Combined missing-source check should warn structurally.");
      assertEqual(validation.blocksQualification, true, "Combined missing-source check must block qualification.");
      assert(String(validation.detail).includes("adapter.json missing; validation.md missing"), "Missing-source diagnostic should identify both boundaries.");
    },
  },
  {
    name: "doctor preserves blank Markdown cells so Notes cannot satisfy a blank Command",
    run: () => {
      const fixture = newIsolatedDoctorFixture("blank-command-cell", "{\n  \"permission\": \"ask\"\n}\n");
      fs.rmSync(path.join(fixture.project, "opencode-dev-kit", "adapter.json"));
      writeText(
        path.join(fixture.project, "opencode-dev-kit", "validation.md"),
        concreteValidationDoc.replace("| Focused test | `project focused test` | Focused boundary. |", "| Focused test |  | Documented notes must stay in Notes. |"),
      );
      const result = invokeIsolatedDoctor(fixture);
      assertSuccess(result, "A blank validation Command should remain a structural warning.");
      const { checks, report } = parseDoctorV2(result);
      assertEqual(report.qualificationStatus, "blocked", "A nonempty Notes cell must not rescue a blank Command cell.");
      const validation = findBucket(checks, "name", "project adapter validation");
      assertEqual(validation.blocksQualification, true, "Blank Command must block qualification.");
      assert(String(validation.detail).includes("validation.md unresolved (focusedTest)"), "Blank-cell diagnostic must preserve the Focused test column mapping.");
    },
  },
  {
    name: "doctor rejects bare and placeholder validation values in adapter and Markdown sources",
    run: () => {
      for (const placeholder of ["N/A", "TBD", "TODO", "unknown", "replace-me", "Replace after discovery."]) {
        const adapterFixture = newIsolatedDoctorFixture(`adapter-placeholder-${placeholder.replace(/[^a-z]+/gi, "-")}`, "{}\n");
        writeText(path.join(adapterFixture.project, "opencode-dev-kit", "adapter.json"), concreteAdapter.replace('"project build"', JSON.stringify(placeholder)));
        const adapterResult = invokeIsolatedDoctor(adapterFixture);
        assertSuccess(adapterResult, `Adapter placeholder ${placeholder} should remain a structural warning.`);
        const adapterValidation = findBucket(parseDoctorV2(adapterResult).checks, "name", "project adapter validation");
        assertEqual(adapterValidation.blocksQualification, true, `Adapter placeholder ${placeholder} must block qualification.`);
        assert(String(adapterValidation.detail).includes("adapter.json unresolved (build)"), `Adapter placeholder ${placeholder} must identify build as unresolved.`);

        const tableFixture = newIsolatedDoctorFixture(`table-placeholder-${placeholder.replace(/[^a-z]+/gi, "-")}`, "{}\n");
        fs.rmSync(path.join(tableFixture.project, "opencode-dev-kit", "adapter.json"));
        const tableDoc = placeholder === "N/A"
          ? concreteValidationDoc.replace("| Build | `project build` | Build. |", "| Build | `N/A` |  |")
          : concreteValidationDoc.replace("`project build`", `\`${placeholder}\``);
        writeText(path.join(tableFixture.project, "opencode-dev-kit", "validation.md"), tableDoc);
        const tableResult = invokeIsolatedDoctor(tableFixture);
        assertSuccess(tableResult, `Table placeholder ${placeholder} should remain a structural warning.`);
        const tableValidation = findBucket(parseDoctorV2(tableResult).checks, "name", "project adapter validation");
        assertEqual(tableValidation.blocksQualification, true, `Table placeholder ${placeholder} must block qualification.`);
        assert(String(tableValidation.detail).includes("validation.md unresolved (build)"), `Table placeholder ${placeholder} must identify build as unresolved.`);
      }
    },
  },
  {
    name: "doctor accepts explicit reasoned validation non-applicability in each supported form",
    run: () => {
      const cases = [
        { name: "adapter-dash", adapter: concreteAdapter.replace('"project build"', '"N/A - project has no build artifact"'), doc: null },
        { name: "table-dash", adapter: null, doc: concreteValidationDoc.replace("`project build`", "`N/A - project has no build artifact`") },
        { name: "table-notes", adapter: null, doc: concreteValidationDoc.replace("| Build | `project build` | Build. |", "| Build | `N/A` | Project has no build artifact. |") },
      ];
      for (const item of cases) {
        const fixture = newIsolatedDoctorFixture(`reasoned-na-${item.name}`, "{}\n");
        if (item.adapter == null) fs.rmSync(path.join(fixture.project, "opencode-dev-kit", "adapter.json"));
        else writeText(path.join(fixture.project, "opencode-dev-kit", "adapter.json"), item.adapter);
        if (item.doc != null) writeText(path.join(fixture.project, "opencode-dev-kit", "validation.md"), item.doc);
        const result = invokeIsolatedDoctor(fixture);
        assertSuccess(result, `Reasoned N/A form ${item.name} should pass doctor.`);
        const { checks, report } = parseDoctorV2(result);
        assertEqual(report.qualificationStatus, "pass", `Reasoned N/A form ${item.name} must satisfy validation qualification.`);
        assertEqual(findBucket(checks, "name", "project adapter validation").blocksQualification, false, `Reasoned N/A form ${item.name} must not block qualification.`);
      }
    },
  },
  {
    name: "doctor v2 keeps missing optional default roles advisory when alternate adapters are available",
    run: () => {
      const fixture = newIsolatedDoctorFixture("alternate-adapters", "{\n  \"permission\": \"ask\"\n}\n");
      writeText(path.join(fixture.project, "opencode-dev-kit", "adapter.json"), concreteAdapter);
      writeText(path.join(fixture.project, "AGENTS.md"), "# Project Agent Instructions\n\n## Runtime Authority\n\nAlternate conforming production, SDET, and final-review adapters are discovered by this project.\n");
      for (const role of ["implementation-worker.md", "sdet-quality-engineer.md", "evidence-sufficiency-reviewer.md", "final-candidate-reviewer.md"]) {
        fs.rmSync(path.join(fixture.globalDir, "agents", role));
      }
      const result = invokeIsolatedDoctor(fixture);
      assertSuccess(result, "Missing optional kit role defaults must retain structural warning exit 0.");
      const { checks, report } = parseDoctorV2(result);
      assertEqual(report.status, "warn", "Missing optional kit role defaults should be structurally visible.");
      assertEqual(report.qualificationStatus, "pass", "Missing optional defaults must not block alternate conforming adapters.");
      const optionalRoles = findBucket(checks, "name", "active kit optional default role files");
      assertEqual(optionalRoles.status, "warn", "Missing optional default roles should warn.");
      assertEqual(optionalRoles.blocksQualification, false, "Optional default roles must be advisory.");
      assertEqual(findBucket(checks, "name", "active kit required runtime authority").status, "pass", "Required authority remains principles, AGENTS.md, and focused claim/lifecycle skills.");
    },
  },
  {
    name: "doctor v2 keeps optional project config, validation docs, and feedback advisory",
    run: () => {
      const fixture = newIsolatedDoctorFixture("optional-project-files", "{\n  \"permission\": \"ask\"\n}\n");
      writeText(path.join(fixture.project, "opencode-dev-kit", "adapter.json"), concreteAdapter);
      for (const relative of ["opencode.json", path.join("opencode-dev-kit", "validation.md"), path.join("docs", "feedbacks", "README.md")]) {
        fs.rmSync(path.join(fixture.project, relative));
      }
      const result = invokeIsolatedDoctor(fixture);
      assertSuccess(result, "Missing optional project files should remain structural warnings with exit 0.");
      const { checks, report } = parseDoctorV2(result);
      assertEqual(report.status, "warn", "Missing optional project files should remain visible structurally.");
      assertEqual(report.qualificationStatus, "pass", "Optional project files alone must not block qualification.");
      for (const name of ["project opencode config", "project validation doc", "project feedback ledger"]) {
        const check = findBucket(checks, "name", name);
        assertEqual(check.status, "warn", `${name} should warn when absent.`);
        assertEqual(check.blocksQualification, false, `${name} must remain advisory.`);
      }
    },
  },
  {
    name: "doctor v2 markdown displays structural and qualification dimensions",
    run: () => {
      const fixture = newIsolatedDoctorFixture("markdown-v2", "{\n  \"permission\": \"ask\"\n}\n");
      writeText(path.join(fixture.project, "opencode-dev-kit", "adapter.json"), concreteAdapter);
      fs.rmSync(path.join(fixture.project, "opencode.json"));
      const result = invokeIsolatedDoctor(fixture, {}, "markdown");
      assertSuccess(result, "Advisory-only markdown report should retain exit 0.");
      assertOutputContains(result, "Status: warn", "Markdown must display structural status.");
      assertOutputContains(result, "Qualification Status: pass", "Markdown must display qualification status independently.");
      assertOutputContains(result, "Unattended Mission Status: blocked", "Markdown must display unattended readiness independently of ordinary qualification.");
      assertOutputContains(result, "| Check | Status | Blocks Qualification | Detail |", "Markdown must display the qualification-impact column.");
      assertOutputContains(result, "| project opencode config | warn | no |", "Markdown must render advisory warning impact as no.");
      assertOutputContains(result, "## Unattended Mission", "Markdown must keep unattended checks in a separate section.");
    },
  },
  {
    name: "doctor recognizes an active markerless gitignored local config",
    run: () => {
      const fixture = newIsolatedDoctorFixture("markerless-local-config", "{\n  \"permission\": \"ask\"\n}\n");
      const result = invokeIsolatedDoctor(fixture);
      assertSuccess(result, "Doctor should recognize the path-defined local config without marker fields.");
      const { checks, report } = parseDoctorV2(result);
      assertEqual(report.status, "warn", "Unresolved adapter validation should keep the markerless fixture at warn.");
      assertEqual(report.qualificationStatus, "blocked", "Unresolved markerless fixture validation must block qualification.");
      const validation = findBucket(checks, "name", "project adapter validation");
      const layering = findBucket(checks, "name", "opencode config layering");
      assertEqual(validation.status, "warn", "Markerless config acceptance must not hide unresolved adapter validation.");
      assertEqual(
        validation.detail,
        "No complete validation adapter source. adapter.json unresolved (focusedTest, test, typecheck, lint, build); validation.md unresolved (focusedTest, test, typecheck, lint, build). Provide concrete opencode-dev-kit/adapter.json validation entries or a complete opencode-dev-kit/validation.md Purpose/Command table for Focused test, Full test, Typecheck, Lint, and Build before RC qualification.",
        "Doctor must retain the exact dual-source unresolved-validation diagnostic.",
      );
      assertEqual(layering.status, "pass", "The active markerless machine-local config layer should pass.");
      if (!String(layering.detail).includes("gitignored global/opencode.json machine-local config")) {
        throw new Error(`Doctor should identify global/opencode.json as the machine-local layer; got: ${String(layering.detail)}`);
      }
      if (fs.readFileSync(path.join(fixture.globalDir, "opencode.json"), "utf8").includes("machineOverride")) {
        throw new Error("Doctor fixture must prove no unsupported marker field is required.");
      }
    },
  },
  {
    name: "doctor reports warnings for unbootstrapped project",
    run: () => {
      const project = newTempDir("doctor-warning-project");
      const isolatedHome = path.join(project, "isolated-home");
      const result = invokeDoctor(["--project", project, "--format", "json"], {
        OPENCODE_CONFIG: undefined,
        OPENCODE_CONFIG_DIR: undefined,
        HOME: isolatedHome,
        USERPROFILE: isolatedHome,
      });
      // Missing host-default portable tools are structural blocked (exit 2); project bootstrap gaps remain visible.
      assertFailure(result, "Unbootstrapped project with missing host-default portable tools must remain machine-readable.");
      assertEqual(result.exitCode, 2, "Missing portable tools in the host-default kit source must use blocked exit 2.");
      const { checks, report } = parseDoctorV2(result);
      assertEqual(report.status, "blocked", "Missing portable tools force structural blocked status.");
      assertEqual(report.qualificationStatus, "blocked", "Missing project bootstrap and active config must block qualification.");
      const agentsCheck = findBucket(checks, "name", "project AGENTS.md");
      assertEqual(agentsCheck.status, "warn", "Doctor should warn when project AGENTS.md is missing the loop.");
      assertEqual(agentsCheck.blocksQualification, true, "Missing project AGENTS.md must block qualification.");
      const adapterCheck = findBucket(checks, "name", "project adapter");
      assertEqual(adapterCheck.status, "warn", "Doctor should warn when project adapter is missing.");
      assertEqual(adapterCheck.blocksQualification, false, "Missing adapter.json alone must be advisory because validation.md may be equivalent.");
      const validationCheck = findBucket(checks, "name", "project adapter validation");
      assertEqual(validationCheck.blocksQualification, true, "Neither complete validation source must block qualification.");
      const feedbackCheck = findBucket(checks, "name", "project feedback ledger");
      assertEqual(feedbackCheck.status, "warn", "Doctor should warn when project feedback ledger is missing.");
      assertEqual(feedbackCheck.blocksQualification, false, "Missing project feedback ledger must remain advisory.");
      const portable = findBucket(checks, "name", "portable project workflow tools");
      assertEqual(portable.status, "blocked", "Missing host-default portable tools must block.");
      assertEqual(portable.blocksQualification, true, "Missing host-default portable tools must block qualification.");
    },
  },
  ...[
    {
      name: "blank validation entry",
      adapter: concreteAdapter.replace('"project lint"', '"   "'),
      expected: "adapter.json unresolved (lint); validation.md unresolved (focusedTest, test, typecheck, lint, build)",
    },
    {
      name: "unknown validation entry",
      adapter: concreteAdapter.replace('"project build"', '"unknown"'),
      expected: "adapter.json unresolved (build); validation.md unresolved (focusedTest, test, typecheck, lint, build)",
    },
    {
      name: "missing validation object",
      adapter: "{}\n",
      expected: "adapter.json unresolved (focusedTest, test, typecheck, lint, build); validation.md unresolved (focusedTest, test, typecheck, lint, build)",
    },
    {
      name: "malformed adapter",
      adapter: "{ \"validation\": ",
      expected: "adapter.json malformed; validation.md unresolved (focusedTest, test, typecheck, lint, build)",
    },
  ].map(({ name, adapter, expected }): TestCase => ({
    name: `doctor warns for ${name}`,
    run: () => {
      const fixture = newIsolatedDoctorFixture(name.replace(/\s+/g, "-"), "{\n  \"permission\": \"ask\"\n}\n");
      writeText(path.join(fixture.project, "opencode-dev-kit", "adapter.json"), adapter);
      const result = invokeIsolatedDoctor(fixture);
      assertSuccess(result, `Doctor ${name} should warn without turning a structural uncertainty into process failure.`);
      const { checks, report } = parseDoctorV2(result);
      assertEqual(report.status, "warn", `Doctor should report warn for ${name}.`);
      assertEqual(report.qualificationStatus, "blocked", `${name} must block qualification despite warning-level structural status.`);
      const validation = findBucket(checks, "name", "project adapter validation");
      assertEqual(validation.status, "warn", `${name} should warn in the adapter-validation check.`);
      assertEqual(validation.blocksQualification, true, `${name} must expose blocksQualification=true.`);
      if (!String(validation.detail).includes(expected)) {
        throw new Error(`${name} diagnostic should include '${expected}', got: ${String(validation.detail)}`);
      }
    },
  })),
  {
    name: "doctor blocks when override or isolated default active authority is missing",
    run: () => {
      const fixture = newIsolatedDoctorFixture("missing-active-authority", "{\n  \"permission\": \"ask\"\n}\n");
      writeText(path.join(fixture.project, "opencode-dev-kit", "adapter.json"), concreteAdapter);
      fs.rmSync(path.join(fixture.globalDir, "principles-of-work.md"));
      fs.rmSync(path.join(fixture.globalDir, "skills", "behavioral-substitution-qualification", "SKILL.md"));
      fs.rmSync(path.join(fixture.globalDir, "skills", "change-ready-sdlc", "SKILL.md"));
      const result = invokeIsolatedDoctor(fixture);
      assertSuccess(result, "Missing active authority should be a warning-level structural result with exit 0.");
      const { checks, report } = parseDoctorV2(result);
      assertEqual(report.status, "warn", "Missing active kit authority must prevent a pass status.");
      assertEqual(report.qualificationStatus, "blocked", "Missing required active authority must block qualification.");
      const authority = findBucket(checks, "name", "active kit required runtime authority");
      assertEqual(authority.status, "warn", "Missing active kit authority should warn.");
      assertEqual(authority.blocksQualification, true, "Missing required active authority must expose blocksQualification=true.");
      const detail = String(authority.detail).replace(/\\/g, "/");
      if (!detail.includes("principles-of-work.md") || !detail.includes("skills/behavioral-substitution-qualification/SKILL.md") || !detail.includes("skills/change-ready-sdlc/SKILL.md") || !detail.includes("blocks RC/stable qualification work")) {
        throw new Error(`Missing-authority diagnostic must block lifecycle claims, got: ${String(authority.detail)}`);
      }

      const isolatedHome = path.join(fixture.root, "missing-default-home");
      const defaultResult = invokeIsolatedDoctor(fixture, {
        OPENCODE_CONFIG_DIR: undefined,
        HOME: isolatedHome,
        USERPROFILE: isolatedHome,
      });
      // Empty host-default kit source is missing portable tools as well as authority; portable tools force exit 2.
      assertFailure(defaultResult, "Missing default authority/portable tools should remain machine-readable.");
      assertEqual(defaultResult.exitCode, 2, "Missing host-default portable tools must use blocked exit 2.");
      const defaultChecks = parseDoctorV2(defaultResult).checks;
      const defaultAuthority = findBucket(defaultChecks, "name", "active kit required runtime authority");
      assertEqual(defaultAuthority.status, "warn", "Missing isolated default authority should warn structurally.");
      assertEqual(defaultAuthority.blocksQualification, true, "Missing isolated default authority must block qualification.");
      const defaultPortable = findBucket(defaultChecks, "name", "portable project workflow tools");
      assertEqual(defaultPortable.status, "blocked", "Missing isolated default portable tools must block.");
      assertEqual(defaultPortable.blocksQualification, true, "Missing isolated default portable tools must block qualification.");
    },
  },
  {
    name: "doctor accepts complete copied override authority without source or template equality",
    run: () => {
      const fixture = newIsolatedDoctorFixture("copied-active-global", "{\n  \"permission\": \"ask\"\n}\n");
      writeText(path.join(fixture.project, "opencode-dev-kit", "adapter.json"), concreteAdapter);
      const copied = path.join(fixture.root, "copied-active-global");
      writeConformingAuthority(copied);
      writeText(path.join(copied, "opencode.json"), "{}\n");
      const result = invokeIsolatedDoctor(fixture, { OPENCODE_CONFIG_DIR: copied });
      assertSuccess(result, "Complete copied active authority should pass without matching repository source bytes.");
      const { checks, report } = parseDoctorV2(result);
      assertEqual(report.qualificationStatus, "pass", "Complete copied override authority must pass qualification diagnostics.");
      assertEqual(findBucket(checks, "name", "opencode config layering").status, "pass", "Copied active local config should pass layering checks.");
      const authority = findBucket(checks, "name", "active kit required runtime authority");
      assertEqual(authority.status, "pass", "Copied principles, AGENTS.md, and focused claim/lifecycle skills must satisfy active authority.");
      assertEqual(authority.blocksQualification, false, "Complete copied authority must not block qualification.");
    },
  },
  {
    name: "doctor blocks copied AGENTS heading drift, duplicate cardinality, and cross-section marker ownership",
    run: () => {
      const cases = [
        {
          name: "routing-target-tab-separator",
          text: conformingAgentsAuthority.replace(
            "## Change-Ready SDLC Routing",
            "##\tChange-Ready SDLC Routing",
          ),
          problem: "AGENTS.md missing exact heading ## Change-Ready SDLC Routing",
        },
        {
          name: "routing-markers-below-indented-h2",
          text: conformingAgentsAuthority.replace(
            "## Change-Ready SDLC Routing\n",
            "## Change-Ready SDLC Routing\n  ## Other\n",
          ),
          problem: "AGENTS.md Change-Ready SDLC Routing section is empty",
        },
        {
          name: "routing-duplicate-exact-heading",
          text: `${conformingAgentsAuthority}\n## Change-Ready SDLC Routing\nprivate-routing-duplicate-body\n`,
          problem: "AGENTS.md duplicate exact heading ## Change-Ready SDLC Routing",
          privateSentinel: "private-routing-duplicate-body",
        },
        {
          name: "reviewer-duplicate-exact-heading",
          text: `${conformingAgentsAuthority}\n## Shared Reviewer Runtime Invariants\nprivate-reviewer-duplicate-body\n`,
          problem: "AGENTS.md duplicate exact heading ## Shared Reviewer Runtime Invariants",
          privateSentinel: "private-reviewer-duplicate-body",
        },
      ] as const;

      for (const item of cases) {
        const fixture = newIsolatedDoctorFixture(item.name, "{}\n");
        writeText(path.join(fixture.project, "opencode-dev-kit", "adapter.json"), concreteAdapter);
        writeText(path.join(fixture.globalDir, "AGENTS.md"), item.text);

        const result = invokeIsolatedDoctor(fixture);
        assertSuccess(result, `${item.name} must remain a successful machine-readable doctor command.`);
        const { checks, report } = parseDoctorV2(result);
        assertEqual(report.status, "warn", `${item.name} must remain a structural warning rather than a process crash.`);
        assertEqual(report.qualificationStatus, "blocked", `${item.name} must block qualification.`);
        const authority = findBucket(checks, "name", "active kit required runtime authority");
        assertEqual(authority.status, "warn", `${item.name} must warn at the active-authority boundary.`);
        assertEqual(authority.blocksQualification, true, `${item.name} must expose blocksQualification=true.`);
        assertEqual(
          authority.detail,
          `Inspected kit source (OPENCODE_CONFIG_DIR) has incomplete required runtime authority: ${item.problem}. Missing principles-of-work.md or structurally incomplete AGENTS.md/claim/lifecycle skill blocks RC/stable qualification work.`,
          `${item.name} must return the exact privacy-safe structural detail.`,
        );
        if ("privateSentinel" in item) {
          assert(!result.output.includes(item.privateSentinel), `${item.name} doctor output must not expose duplicate-section body content.`);
        }
      }
    },
  },
  {
    name: "doctor blocks copied authority missing each protected boundary, non-waivable risk, or owner-handoff marker",
    run: () => {
      for (const item of globalAuthorityMinimumFixtureCases) {
        const fixture = newIsolatedDoctorFixture(`copied-authority-${item.name.replace(/[^a-z0-9]+/gi, "-")}`, "{\n  \"permission\": \"ask\"\n}\n");
        writeText(path.join(fixture.project, "opencode-dev-kit", "adapter.json"), concreteAdapter);
        const copied = path.join(fixture.root, "copied-active-global");
        writeConformingAuthority(copied);
        writeText(path.join(copied, "opencode.json"), "{}\n");
        const agentsPath = path.join(copied, "AGENTS.md");
        const complete = fs.readFileSync(agentsPath, "utf8");
        const incomplete = complete.replaceAll(item.marker, `[removed-${item.name.replace(/[^a-z0-9]+/gi, "-")}]`);
        assert(incomplete !== complete, `Copied authority fixture must contain ${item.name}.`);
        assert(!incomplete.includes(item.marker), `Copied authority fixture must remove every occurrence of ${item.name}.`);
        writeText(agentsPath, incomplete);

        const result = invokeIsolatedDoctor(fixture, { OPENCODE_CONFIG_DIR: copied });
        assertSuccess(result, `${item.name} must remain a machine-readable structural warning.`);
        const { checks, report } = parseDoctorV2(result);
        assertEqual(report.qualificationStatus, "blocked", `${item.name} must block qualification.`);
        const authority = findBucket(checks, "name", "active kit required runtime authority");
        assertEqual(authority.status, "warn", `${item.name} must fail copied active-authority certification.`);
        assertEqual(authority.blocksQualification, true, `${item.name} must expose blocksQualification=true.`);
        assert(String(authority.detail).includes(item.diagnostic), `${item.name} diagnostic must identify '${item.diagnostic}', got: ${String(authority.detail)}`);
      }
    },
  },
  {
    name: "doctor blocks qualification for unsupported blockquote and list-container authority fences",
    run: () => {
      const cases = [
        {
          name: "agents-blockquote-fence",
          relative: "AGENTS.md",
          text: conformingAgentsAuthority.replace(
            "# Independent Active Authority\n",
            "# Independent Active Authority\n> ``` private-agents-authority-content\n",
          ),
          expected: "AGENTS.md contains unsupported non-top-level fenced-code syntax at line 2",
          privateSentinel: "private-agents-authority-content",
        },
        {
          name: "skill-list-container-fence",
          relative: path.join("skills", "change-ready-sdlc", "SKILL.md"),
          text: conformingSkillAuthority.replace(
            "---\n# Change-Ready SDLC",
            "---\n> - ~~~ private-skill-authority-content\n# Change-Ready SDLC",
          ),
          expected: "skills/change-ready-sdlc/SKILL.md contains unsupported non-top-level fenced-code syntax at line 5",
          privateSentinel: "private-skill-authority-content",
        },
        {
          name: "agents-later-delimiter-run",
          relative: "AGENTS.md",
          text: conformingAgentsAuthority.replace(
            "# Independent Active Authority\n",
            "# Independent Active Authority\n``` invalid opener prose > ``` private-later-doctor-content\n",
          ),
          expected: "AGENTS.md contains unsupported non-top-level fenced-code syntax at line 2",
          privateSentinel: "private-later-doctor-content",
        },
      ] as const;

      for (const item of cases) {
        const fixture = newIsolatedDoctorFixture(item.name, "{}\n");
        writeText(path.join(fixture.project, "opencode-dev-kit", "adapter.json"), concreteAdapter);
        writeText(path.join(fixture.globalDir, item.relative), item.text);
        const result = invokeIsolatedDoctor(fixture);
        assertSuccess(result, `${item.name} should remain a machine-readable structural warning.`);
        const { checks, report } = parseDoctorV2(result);
        assertEqual(report.qualificationStatus, "blocked", `${item.name} must block qualification.`);
        const authority = findBucket(checks, "name", "active kit required runtime authority");
        assertEqual(authority.status, "warn", `${item.name} must fail active-authority certification.`);
        assertEqual(authority.blocksQualification, true, `${item.name} must expose blocksQualification=true.`);
        assert(String(authority.detail).includes(item.expected), `${item.name} must report the exact privacy-safe line diagnostic.`);
        assert(!result.output.includes(item.privateSentinel), `${item.name} doctor output must not expose source-line content.`);
      }
    },
  },
  {
    name: "doctor resolves an unset override to a deterministic isolated default home",
    run: () => {
      const fixture = newIsolatedDoctorFixture("default-active-global", "{\n  \"permission\": \"ask\"\n}\n");
      writeText(path.join(fixture.project, "opencode-dev-kit", "adapter.json"), concreteAdapter);
      const isolatedHome = path.join(fixture.root, "isolated-home");
      const defaultGlobal = path.join(isolatedHome, ".config", "opencode");
      writeConformingAuthority(defaultGlobal);
      writeText(path.join(defaultGlobal, "opencode.json"), "{}\n");
      for (const override of [undefined, "", " \t "]) {
        const result = invokeIsolatedDoctor(fixture, { OPENCODE_CONFIG_DIR: override, HOME: isolatedHome, USERPROFILE: isolatedHome });
        assertSuccess(result, "Unset, blank, and whitespace OPENCODE_CONFIG_DIR should resolve the isolated host default.");
        const { checks, report } = parseDoctorV2(result);
        assertEqual(report.qualificationStatus, "pass", "Complete isolated default authority must pass qualification diagnostics.");
        const layerCheck = findBucket(checks, "name", "opencode config layering");
        assertEqual(layerCheck.status, "pass", "Existing default opencode.json should pass layering checks.");
        assertEqual(layerCheck.blocksQualification, false, "Complete default layering must not block qualification.");
        const authority = findBucket(checks, "name", "active kit required runtime authority");
        assertEqual(authority.status, "pass", "Default principles, AGENTS.md, and focused claim/lifecycle skills must satisfy active authority.");
        assert(String(authority.detail).includes("Host default ~/.config/opencode"), "Authority diagnostic must identify default-home resolution.");
      }
    },
  },
  {
    name: "doctor blocks adversarial active authority shapes without requiring source equality",
    run: () => {
      const cases = [
        { name: "agents-missing-direct-main", relative: "AGENTS.md", text: conformingAgentsAuthority.replace("Main is the default production author for Ordinary Small and Material", "Ordinary Small production changes use the normal author"), expected: "missing main-default production authorship" },
        { name: "agents-missing-proof", relative: "AGENTS.md", text: conformingAgentsAuthority.replace("run-observe-correct", "inspect the implementation"), expected: "missing run-observe-correct proof marker" },
        { name: "agents-missing-edge", relative: "AGENTS.md", text: conformingAgentsAuthority.replace("realistic requirement-linked edge cases", "practical edge cases"), expected: "missing realistic requirement-linked edge inspection marker" },
        { name: "agents-proof-after-edge", relative: "AGENTS.md", text: conformingAgentsAuthority.replace("run-observe-correct before inspecting realistic requirement-linked edge cases", "inspect realistic requirement-linked edge cases before run-observe-correct"), expected: "must order runtime proof before realistic requirement-linked edge inspection" },
        { name: "agents-missing-user-approval", relative: "AGENTS.md", text: conformingAgentsAuthority.replace("explicit user approval", "later consideration"), expected: "missing explicit owner approval before unrequested scope expansion" },
        { name: "agents-missing-explicit-stable", relative: "AGENTS.md", text: conformingAgentsAuthority.replace("explicit stable", "owner-requested qualification"), expected: "missing explicit stable qualification trigger" },
        { name: "agents-missing-project-qualification", relative: "AGENTS.md", text: conformingAgentsAuthority.replace("project-required qualification", "project guidance"), expected: "missing project-required qualification trigger" },
        ...namedMaterialRiskFixtureCases.map(([name, marker, replacement, diagnostic]) => ({ name: `agents-risk-${name}`, relative: "AGENTS.md", text: conformingAgentsAuthority.replaceAll(marker, replacement), expected: `missing named Material risk class: ${diagnostic}` })),
        { name: "agents-missing-no-downgrade", relative: "AGENTS.md", text: conformingAgentsAuthority.replace("must not be downgraded merely because the diff is small", "should usually remain cautious"), expected: "missing no high-risk downgrade for small diffs" },
        { name: "agents-missing-accepted-outcome", relative: "AGENTS.md", text: conformingAgentsAuthority.replaceAll("accepted outcome", "planned work"), expected: "missing accepted-outcome authority marker" },
        { name: "agents-missing-protected-boundaries", relative: "AGENTS.md", text: conformingAgentsAuthority.replace("protected boundaries", "special cases"), expected: "missing protected-boundaries authority marker" },
        { name: "agents-missing-dependency-closure", relative: "AGENTS.md", text: conformingAgentsAuthority.replace("smallest sufficient dependency closure", "small local repair"), expected: "missing local reversible dependency-closure marker" },
        { name: "agents-missing-non-authorizing-findings", relative: "AGENTS.md", text: conformingAgentsAuthority.replace("evidence never authorizes mutation", "evidence usually does not authorize mutation"), expected: "missing non-authorizing findings rule" },
        { name: "agents-missing-critical-sdet-action", relative: "AGENTS.md", text: conformingAgentsAuthority.replace("critical-risks-reported | no-critical-risk | blocked", "pass | fail | blocked"), expected: "missing critical-only SDET action marker" },
        { name: "agents-missing-invocation-safety", relative: "AGENTS.md", text: conformingAgentsAuthority.replace("invocation remains finalized and non-reusable", "invocation may be reused"), expected: "missing finalized invocation safety marker" },
        { name: "agents-missing-mission-continuation", relative: "AGENTS.md", text: conformingAgentsAuthority.replace("does not impose a fixed mission-wide attempt ceiling", "imposes a fixed mission-wide attempt ceiling"), expected: "missing evidence-gated mission continuation marker" },
        { name: "agents-missing-sdet-continuation", relative: "AGENTS.md", text: conformingAgentsAuthority.replace("No SDET attempt count permanently prohibits future risk assessment of a materially changed candidate", "SDET may stop after one attempt"), expected: "missing changed-candidate SDET continuation marker" },
        { name: "skill-missing-ordinary-nonload", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("Do not load for Ordinary Small", "Ordinary Small may load this skill"), expected: "missing Ordinary Small non-load/default boundary" },
        { name: "skill-missing-scope-lock", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("accepted outcome capsule", "task boundary"), expected: "missing project-specific scope-lock control" },
        { name: "skill-missing-owner-approval", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("explicit owner approval", "later review"), expected: "missing explicit owner approval expansion rule" },
        ...namedMaterialRiskFixtureCases.map(([name, marker, replacement, diagnostic]) => ({ name: `skill-risk-${name}`, relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replaceAll(marker, replacement), expected: `missing named Material risk class: ${diagnostic}` })),
        { name: "skill-missing-no-downgrade", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("must not be downgraded merely because the diff is small", "should usually remain cautious"), expected: "missing no high-risk downgrade for small diffs" },
        { name: "skill-missing-protected-boundaries", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("protected boundaries", "special cases"), expected: "missing protected-boundaries authority marker" },
        { name: "skill-missing-dependency-closure", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("smallest sufficient dependency closure", "small local repair"), expected: "missing local reversible dependency-closure marker" },
        { name: "skill-missing-non-authorizing-findings", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("never authorize mutation", "usually do not authorize mutation"), expected: "missing non-authorizing findings rule" },
        { name: "skill-missing-optional-reviewer-boundary", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("Reviewer absence, timeout, malformed output, or disagreement is not itself a stage blocker", "Reviewer evidence is considered"), expected: "missing optional-reviewer non-blocking marker" },
        { name: "skill-missing-critical-sdet-action", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("Action: critical-risks-reported | no-critical-risk | blocked", "Action: pass | fail | blocked"), expected: "missing critical-only SDET action marker" },
        { name: "skill-missing-invocation-safety", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("invocation remains finalized and non-reusable", "invocation may be reused"), expected: "missing finalized invocation safety marker" },
        { name: "skill-missing-mission-continuation", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("does not impose a fixed mission-wide attempt ceiling", "imposes a fixed mission-wide attempt ceiling"), expected: "missing evidence-gated mission continuation marker" },
        { name: "skill-missing-sdet-continuation", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("No SDET attempt count permanently prohibits future risk assessment of a materially changed candidate", "SDET may stop after one attempt"), expected: "missing changed-candidate SDET continuation marker" },
        { name: "empty-agents", relative: "AGENTS.md", text: "", expected: "AGENTS.md is empty" },
        { name: "stub-agents", relative: "AGENTS.md", text: "# Stub authority\n", expected: "missing exact heading ## Change-Ready SDLC Routing" },
        { name: "token-packed-agents", relative: "AGENTS.md", text: "Change-Ready SDLC Routing Before the first mutation load change-ready-sdlc Universal Task Briefing Contract Autonomous Work Contract Shared Reviewer Runtime Invariants\n", expected: "missing exact heading ## Change-Ready SDLC Routing" },
        { name: "skill-empty", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: "", expected: "SKILL.md is empty" },
        { name: "skill-no-frontmatter", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace(/^---[\s\S]*?---\n/, ""), expected: "missing leading frontmatter" },
        { name: "skill-empty-frontmatter", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("name: change-ready-sdlc\ndescription: Independently copied lifecycle authority for fixture validation.", "{}"), expected: "frontmatter missing name" },
        { name: "skill-malformed-yaml", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("description: Independently copied lifecycle authority for fixture validation.", "description: malformed: colon"), expected: "frontmatter is not valid YAML" },
        { name: "skill-conflicting-name-keys", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("name: change-ready-sdlc", "name: change-ready-sdlc\nname: conflicting"), expected: "frontmatter is not valid YAML" },
        { name: "skill-nonscalar-name", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("name: change-ready-sdlc", "name:\n  nested: change-ready-sdlc"), expected: "name must be a scalar string" },
        { name: "skill-nonscalar-description", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("description: Independently copied lifecycle authority for fixture validation.", "description:\n  - fixture authority"), expected: "description must be a scalar string" },
        { name: "skill-missing-name", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("name: change-ready-sdlc\n", ""), expected: "missing name" },
        { name: "skill-missing-description", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("description: Independently copied lifecycle authority for fixture validation.\n", ""), expected: "missing description" },
        { name: "skill-empty-description", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("description: Independently copied lifecycle authority for fixture validation.", "description: '   '"), expected: "description must be nonempty" },
        { name: "skill-wrong-name", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("name: change-ready-sdlc", "name: other-skill"), expected: "exact name" },
        { name: "skill-incomplete-lifecycle", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("### 1. Implement And Prove MVP", "### 1. Candidate Snapshot"), expected: "missing ordered heading: Implement And Prove MVP" },
        { name: "skill-duplicate-lifecycle", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: `${conformingSkillAuthority}\n### 6. Critical SDET\nDuplicate marker.\n`, expected: "duplicate heading: Critical SDET" },
      ];
      for (const item of cases) {
        const fixture = newIsolatedDoctorFixture(item.name, "{}\n");
        writeText(path.join(fixture.project, "opencode-dev-kit", "adapter.json"), concreteAdapter);
        writeText(path.join(fixture.globalDir, item.relative), item.text);
        const result = invokeIsolatedDoctor(fixture);
        assertSuccess(result, `${item.name} should remain a machine-readable structural warning.`);
        const { checks, report } = parseDoctorV2(result);
        assertEqual(report.qualificationStatus, "blocked", `${item.name} must block qualification.`);
        const authority = findBucket(checks, "name", "active kit required runtime authority");
        assertEqual(authority.status, "warn", `${item.name} must not pass structural authority.`);
        assertEqual(authority.blocksQualification, true, `${item.name} must block qualification.`);
        assert(String(authority.detail).includes(item.expected), `${item.name} diagnostic should identify '${item.expected}', got: ${String(authority.detail)}`);
      }
    },
  },
  ...[
    {
      name: "scalar root",
      localConfig: '"private-value"\n',
      expected: "not a valid OpenCode JSON/JSONC object",
    },
    {
      name: "array root",
      localConfig: '["private-value"]\n',
      expected: "not a valid OpenCode JSON/JSONC object",
    },
    {
      name: "null root",
      localConfig: "null\n",
      expected: "not a valid OpenCode JSON/JSONC object",
    },
    ...[true, false, null].map((value) => ({
      name: `unsupported marker=${String(value)}`,
      localConfig: `{\n  \"machineOverride\": ${String(value)},\n  \"provider\": \"private-value\"\n}\n`,
      expected: "unsupported field 'machineOverride'",
    })),
    {
      name: "invalid JSONC",
      localConfig: "{\n  /* unterminated comment\n",
      expected: "not a valid OpenCode JSON/JSONC object",
    },
  ].map(({ name, localConfig, expected }): TestCase => ({
    name: `doctor blocks existing ${name} local config`,
    run: () => {
      const fixture = newIsolatedDoctorFixture(name.replace(/\s+/g, "-"), localConfig);
      writeText(path.join(fixture.project, "opencode-dev-kit", "adapter.json"), concreteAdapter);
      assert(fs.readFileSync(path.join(fixture.globalDir, "opencode.json")).equals(Buffer.from(localConfig, "utf8")), `${name} fixture must preserve intended raw local-config bytes.`);
      const result = invokeIsolatedDoctor(fixture);
      assertFailure(result, `Doctor must block an existing ${name} config.`);
      const { checks, report } = parseDoctorV2(result);
      assertEqual(report.status, "blocked", `Doctor report should be blocked for ${name}.`);
      assertEqual(report.qualificationStatus, "blocked", `Doctor qualification must be blocked for ${name}.`);
      const layerCheck = findBucket(checks, "name", "opencode config layering");
      assertEqual(layerCheck.status, "blocked", `Layering check should block ${name}.`);
      assertEqual(layerCheck.blocksQualification, true, `Layering check must expose blocksQualification=true for ${name}.`);
      if (!String(layerCheck.detail).includes(expected)) {
        throw new Error(`Layering diagnostic should include '${expected}', got: ${String(layerCheck.detail)}`);
      }
      if (result.output.includes("private-value")) {
        throw new Error("Doctor diagnostics must not expose local config contents.");
      }
    },
  })),
  {
    name: "doctor accepts Windows case variants of the same config directory",
    run: () => {
      if (process.platform !== "win32") return;
      const fixture = newIsolatedDoctorFixture("windows-case-variant", "{\n  \"permission\": \"ask\"\n}\n");
      const result = invokeIsolatedDoctor(fixture, { OPENCODE_CONFIG_DIR: fixture.globalDir.toUpperCase() });
      assertSuccess(result, "Windows path comparison should accept casing variants of the same directory.");
      const { checks } = parseDoctorV2(result);
      assertEqual(findBucket(checks, "name", "opencode config layering").status, "pass", "Case-only path differences should preserve the active layer.");
    },
  },
  {
    name: "doctor reports explicit OPENCODE_CONFIG existence",
    run: () => {
      const fixture = newIsolatedDoctorFixture("explicit-config", "{\n  \"permission\": \"ask\"\n}\n");
      writeText(path.join(fixture.project, "opencode-dev-kit", "adapter.json"), concreteAdapter);
      for (const blank of ["", " \t "]) {
        const blankResult = invokeIsolatedDoctor(fixture, { OPENCODE_CONFIG: blank });
        assertSuccess(blankResult, "Blank or whitespace OPENCODE_CONFIG should retain absent-override semantics.");
        assert(!parseDoctorV2(blankResult).checks.some((check) => check.name === "explicit opencode config"), "Blank OPENCODE_CONFIG must not create an explicit-config check.");
        assert(!blankResult.output.includes(fixture.root), "Blank OPENCODE_CONFIG diagnostics must not expose fixture paths.");
      }
      const explicitConfig = path.join(fixture.root, "explicit.jsonc");
      writeText(explicitConfig, "{\n  // Explicit overlay\n}\n");
      const existingResult = invokeIsolatedDoctor(fixture, { OPENCODE_CONFIG: explicitConfig });
      assertSuccess(existingResult, "Doctor should pass when explicit OPENCODE_CONFIG exists.");
      const { checks: existingChecks, report: existingReport } = parseDoctorV2(existingResult);
      assertEqual(existingReport.qualificationStatus, "pass", "Existing explicit config must preserve complete qualification diagnostics.");
      assertEqual(findBucket(existingChecks, "name", "explicit opencode config").status, "pass", "Existing explicit config should report pass.");

      const missingConfig = path.join(fixture.root, "missing.jsonc");
      const missingResult = invokeIsolatedDoctor(fixture, { OPENCODE_CONFIG: missingConfig });
      assertFailure(missingResult, "Doctor should block when OPENCODE_CONFIG points to a missing file.");
      const { checks: missingChecks, report: missingReport } = parseDoctorV2(missingResult);
      assertEqual(missingReport.qualificationStatus, "blocked", "Missing explicit config must block qualification.");
      const explicitCheck = findBucket(missingChecks, "name", "explicit opencode config");
      assertEqual(explicitCheck.status, "blocked", "Missing explicit config should report blocked.");
      assertEqual(explicitCheck.blocksQualification, true, "Missing explicit config must expose blocksQualification=true.");
      if (!String(explicitCheck.detail).includes("not an existing regular file")) {
        throw new Error(`Missing explicit config diagnostic should be actionable, got: ${String(explicitCheck.detail)}`);
      }
    },
  },
  {
    name: "doctor blocks unsafe explicit OPENCODE_CONFIG shapes with exit 2 and privacy-safe diagnostics",
    run: () => {
      const fixture = newIsolatedDoctorFixture("explicit-config-shapes", "{\n  \"permission\": \"ask\"\n}\n");
      writeText(path.join(fixture.project, "opencode-dev-kit", "adapter.json"), concreteAdapter);
      const secretSentinel = "private-config-content-must-not-leak";
      const cases = [
        { name: "directory", content: null, expected: "not an existing regular file" },
        { name: "malformed.jsonc", content: `{ \"provider\": \"${secretSentinel}\",`, expected: "not a valid OpenCode JSON/JSONC object" },
        { name: "scalar.json", content: `\"${secretSentinel}\"\n`, expected: "not a valid OpenCode JSON/JSONC object" },
        { name: "array.json", content: `[\"${secretSentinel}\"]\n`, expected: "not a valid OpenCode JSON/JSONC object" },
        { name: "null.json", content: "null\n", expected: "not a valid OpenCode JSON/JSONC object" },
        ...[true, false, null].map((value) => ({ name: `machine-override-${String(value)}.json`, content: `{\n  \"machineOverride\": ${String(value)},\n  \"provider\": \"${secretSentinel}\"\n}\n`, expected: "unsupported field 'machineOverride'" })),
      ];
      for (const item of cases) {
        const explicit = path.join(fixture.root, item.name);
        if (item.content == null) fs.mkdirSync(explicit, { recursive: true });
        else writeText(explicit, item.content);
        const result = invokeIsolatedDoctor(fixture, { OPENCODE_CONFIG: explicit });
        assertEqual(result.exitCode, 2, `Explicit ${item.name} must use blocked-report exit code 2.`);
        const { checks, report } = parseDoctorV2(result);
        assertEqual(report.status, "blocked", `Explicit ${item.name} must be structurally blocked.`);
        assertEqual(report.qualificationStatus, "blocked", `Explicit ${item.name} must block qualification.`);
        const explicitCheck = findBucket(checks, "name", "explicit opencode config");
        assertEqual(explicitCheck.status, "blocked", `Explicit ${item.name} check must be blocked.`);
        assertEqual(explicitCheck.blocksQualification, true, `Explicit ${item.name} must expose blocksQualification=true.`);
        assert(String(explicitCheck.detail).includes(item.expected), `Explicit ${item.name} diagnostic should identify the safe failure class.`);
        assert(!result.output.includes(secretSentinel), `Explicit ${item.name} diagnostics must not expose config content.`);
      }
    },
  },
  {
    name: "doctor rejects empty --project and defaults to a redacted cwd unless explicitly shown",
    run: () => {
      const fixture = newIsolatedDoctorFixture("project-cli-privacy", "{\n  \"permission\": \"ask\"\n}\n");
      writeText(path.join(fixture.project, "opencode-dev-kit", "adapter.json"), concreteAdapter);

      for (const projectArgs of [["--project="], ["--project", " \t "], ["--project= \t "]]) {
        const emptyProject = invokeIsolatedDoctorArgs(fixture, [...projectArgs, "--format", "json"]);
        assertEqual(emptyProject.exitCode, 1, "Empty or whitespace --project forms must be CLI usage failures.");
        assertOutputContains(emptyProject, "Missing value for --project.", "Empty or whitespace --project should return an actionable diagnostic.");
        assert(!emptyProject.output.includes(fixture.root), "Rejected --project diagnostics must not expose fixture paths.");
      }

      const hidden = invokeIsolatedDoctorArgs(fixture, ["--format", "json"], {}, fixture.project);
      assertSuccess(hidden, "Doctor should use cwd when --project is omitted.");
      const hiddenReport = parseDoctorV2(hidden).report;
      assertEqual(hiddenReport.project, "<redacted>", "Default cwd project must remain redacted.");

      const shown = invokeIsolatedDoctorArgs(fixture, ["--format", "json", "--show-project"], {}, fixture.project);
      assertSuccess(shown, "Doctor should expose the cwd only through --show-project.");
      const shownReport = parseDoctorV2(shown).report;
      assertEqual(shownReport.project, path.resolve(fixture.project), "--show-project must expose the exact default cwd project.");
    },
  },
  {
    name: "doctor selected gates fail closed and retain every named blocker",
    run: () => {
      const fixture = newIsolatedDoctorFixture("require-gate-blockers", "{\n  \"permission\": \"ask\"\n}\n");
      writeText(path.join(fixture.project, "AGENTS.md"), "# Project Agent Instructions\n");
      const expectedQualification = ["project AGENTS.md", "project adapter validation"];
      const expectedUnattended = [
        "unattended runtime authority",
        "unattended aggregate validation argv",
        "unattended checkpoint support",
        "unattended canonical workflow",
      ];

      const informational = invokeIsolatedDoctor(fixture);
      assertEqual(informational.exitCode, 0, "Default informational doctor must keep the structural-exit contract when only qualification is blocked.");
      const informationalReport = parseDoctorV2(informational);
      assertEqual(informationalReport.report.qualificationStatus, "blocked", "Missing project authority and validation must block qualification.");
      assertDeepEqual(namedBlockers(informationalReport.report, "qualification"), expectedQualification, "Informational output must retain every qualification blocker in stable order.");
      assertDeepEqual(namedBlockers(informationalReport.report, "unattended").slice(0, expectedUnattended.length), expectedUnattended, "Informational output must retain every unattended blocker without truncating to the first reason.");

      const qualification = invokeIsolatedDoctorArgs(fixture, ["--project", fixture.project, "--format", "json", "--require", "qualification"]);
      assertEqual(qualification.exitCode, 2, "Selected qualification gate must fail closed when qualificationStatus is blocked.");
      const qualificationReport = parseDoctorV2(qualification);
      assertEqual(qualificationReport.report.requiredGate, "qualification", "Selected qualification gate must be recorded on the report.");
      assertEqual(qualificationReport.report.qualificationStatus, "blocked", "Selected qualification gate must remain blocked.");
      assertDeepEqual(namedBlockers(qualificationReport.report, "qualification"), expectedQualification, "Selected qualification gate must name every qualification blocker.");

      const unattended = invokeIsolatedDoctorArgs(fixture, ["--project", fixture.project, "--format", "json", "--require", "unattended"]);
      assertEqual(unattended.exitCode, 2, "Selected unattended gate must fail closed when unattendedMissionStatus is blocked.");
      const unattendedReport = parseDoctorV2(unattended);
      assertEqual(unattendedReport.report.requiredGate, "unattended", "Selected unattended gate must be recorded on the report.");
      assertEqual(unattendedReport.report.unattendedMissionStatus, "blocked", "Selected unattended gate must remain blocked.");
      const unattendedBlockers = namedBlockers(unattendedReport.report, "unattended");
      for (const name of expectedUnattended) {
        assert(unattendedBlockers.includes(name), `Selected unattended gate must retain blocker ${name}.`);
      }
      assert(unattendedBlockers.length >= expectedUnattended.length, "Selected unattended gate must not truncate the blocker list.");

      const structural = invokeIsolatedDoctorArgs(fixture, ["--project", fixture.project, "--format", "json", "--require", "structural"]);
      assertEqual(structural.exitCode, 0, "Selected structural gate must still pass advisory-only structural warnings.");
      assertEqual(parseDoctorV2(structural).report.status, "warn", "Advisory qualification blockers must remain structurally visible.");
    },
  },
  {
    name: "doctor campaign gate uses production preflight and blocks selected host recovery without mutation",
    run: () => {
      const fixture = newIsolatedDoctorFixture("campaign-readiness", "{\n  \"permission\": \"ask\"\n}\n");
      const isolatedHome = path.join(fixture.root, "isolated-home");
      writeText(path.join(fixture.project, "opencode-dev-kit", "adapter.json"), concreteAdapter);
      writeReadyCampaign(fixture.project);
      commitFixture(fixture.project, "campaign ready");
      const env = { HOME: isolatedHome, USERPROFILE: isolatedHome };
      const before = invokeProcessCapture("git", ["status", "--porcelain=v1", "--untracked-files=all"], fixture.project);
      assertSuccess(before, "Campaign fixture status must be readable before doctor.");
      assertEqual(before.output.trim(), "", "Campaign fixture must start clean.");

      const ready = invokeIsolatedDoctorArgs(
        fixture,
        ["--project", fixture.project, "--format", "json", "--require", "campaign"],
        env,
      );
      assertSuccess(ready, "A complete provider-free campaign fixture should pass the selected campaign gate.");
      const readyReport = parseDoctorV2(ready);
      assertEqual(readyReport.report.campaignStatus, "pass", "Complete campaign readiness must pass.");
      assertDeepEqual(namedBlockers(readyReport.report, "campaign"), [], "Passing campaign readiness must have no campaign blockers.");
      assertEqual(readyReport.report.unattendedMissionStatus, "blocked", "Campaign readiness must remain independent from unattended readiness.");

      writeReadyCampaign(fixture.project, true);
      commitFixture(fixture.project, "select protected host recovery");
      const missingSupervisor = invokeIsolatedDoctorArgs(
        fixture,
        ["--project", fixture.project, "--format", "json", "--require", "campaign"],
        env,
      );
      assertEqual(missingSupervisor.exitCode, 2, "Selected host recovery without an installed supervisor must fail the campaign gate.");
      const blockedReport = parseDoctorV2(missingSupervisor);
      assertEqual(blockedReport.report.campaignStatus, "blocked", "Missing supervisor must block campaign readiness.");
      assertDeepEqual(namedBlockers(blockedReport.report, "campaign"), ["campaign supervisor"], "Only the selected missing supervisor should block the otherwise-ready fixture.");
      const supervisor = findBucket(blockedReport.campaignChecks, "name", "campaign supervisor");
      assert(String(supervisor.detail).includes("no checked installed supervisor registration"), "Missing supervisor diagnostics must be actionable.");

      const after = invokeProcessCapture("git", ["status", "--porcelain=v1", "--untracked-files=all"], fixture.project);
      assertSuccess(after, "Campaign fixture status must be readable after doctor.");
      assertEqual(after.output.trim(), "", "Doctor must not mutate, register, start, or resume the campaign fixture.");
    },
  },
  {
    name: "doctor keeps static unattended readiness passing when campaign configuration is absent",
    run: () => {
      const fixture = newIsolatedDoctorFixture("unattended-without-campaign", "{\n  \"permission\": \"ask\"\n}\n");
      const isolatedHome = path.join(fixture.root, "isolated-home");
      for (const relative of [
        "skills/openspec-apply-change/SKILL.md",
        "skills/openspec-archive-change/SKILL.md",
        "skills/openspec-propose/SKILL.md",
        "commands/opsx-apply.md",
        "commands/opsx-archive.md",
        "commands/opsx-propose.md",
      ]) {
        writeText(path.join(fixture.globalDir, ...relative.split("/")), fs.readFileSync(path.join(root, "global", ...relative.split("/")), "utf8"));
      }
      writeText(path.join(fixture.project, "opencode-dev-kit", "adapter.json"), `${JSON.stringify({
        unattended: {
          checkpointModes: ["evidence-only", "external", "local-commit"],
          localCommitRequiresAuthorization: true,
          validationArgv: [process.execPath, "--version"],
          workflowOwner: "global-canonical",
        },
        validation: {
          build: "node --version",
          focusedTest: "node --version",
          lint: "node --version",
          test: "node --version",
          typecheck: "node --version",
        },
      }, null, 2)}\n`);
      const plugin = (relative: string) => path.join(fixture.globalDir, ...relative.split("/"));
      writeText(path.join(fixture.globalDir, "opencode.json"), `${JSON.stringify({
        $schema: "https://opencode.ai/config.json",
        model: "openai/gpt-5.6-sol",
        permission: "ask",
        plugin: [
          plugin("extensions/opencode-pty-bridge.ts"),
          [plugin("extensions/roadmap-mission-launcher.ts"), { scriptRuntime: process.execPath }],
          [plugin("extensions/session-completion-guard.ts"), {
            arbiterPromptTimeoutMs: 1,
            certificateIssuers: ["roadmap-mission-session-executor"],
            certificateWaitMs: 1,
            maxCycles: 1,
            maxRequestBytes: 1,
            maxRetryAttempts: 1,
            maxWaitRechecks: 1,
            retainAuditSessions: 1,
            waitRecheckMs: 1,
          }],
        ],
      }, null, 2)}\n`);
      const env = { HOME: isolatedHome, USERPROFILE: isolatedHome };

      const unattended = invokeIsolatedDoctorArgs(
        fixture,
        ["--project", fixture.project, "--format", "json", "--require", "unattended"],
        env,
      );
      assertSuccess(unattended, "Static unattended readiness should pass without campaign configuration.");
      const unattendedReport = parseDoctorV2(unattended);
      assertEqual(unattendedReport.report.unattendedMissionStatus, "pass", "Static unattended status must pass independently.");
      assertEqual(unattendedReport.report.campaignStatus, "blocked", "Absent campaign configuration must remain separately blocked.");

      const campaign = invokeIsolatedDoctorArgs(
        fixture,
        ["--project", fixture.project, "--format", "json", "--require", "campaign"],
        env,
      );
      assertEqual(campaign.exitCode, 2, "Absent campaign configuration must fail only the selected campaign gate.");
      const campaignReport = parseDoctorV2(campaign);
      assertEqual(campaignReport.report.unattendedMissionStatus, "pass", "Selecting campaign must not alter passing static unattended readiness.");
      assert(namedBlockers(campaignReport.report, "campaign").includes("campaign definition and adapter"), "Campaign blockers must name the missing definition.");
    },
  },
  {
    name: "doctor rejects canonical project/global workflow collisions without leaking private content or running validation",
    run: () => {
      const fixture = newIsolatedDoctorFixture("canonical-collision-privacy", "{\n  \"permission\": \"ask\"\n}\n");
      const isolatedHome = path.join(fixture.root, "isolated-home");
      const marker = path.join(fixture.project, ".validation-command-executed");
      const validationScript = path.join(fixture.project, "validation-must-not-run.mjs");
      const privateSentinels = [
        "private-config-content-must-not-leak",
        "private-instruction-content-must-not-leak",
        "private-project-skill-content-must-not-leak",
        "private-global-skill-content-must-not-leak",
      ];
      writeText(
        path.join(fixture.project, "opencode-dev-kit", "adapter.json"),
        `${JSON.stringify({
          unattended: {
            checkpointModes: ["evidence-only", "external", "local-commit"],
            localCommitRequiresAuthorization: true,
            validationArgv: [process.execPath, validationScript, marker],
            workflowOwner: "global-canonical",
          },
          validation: {
            build: `node validation-must-not-run.mjs ${marker}`,
            focusedTest: `node validation-must-not-run.mjs ${marker}`,
            lint: `node validation-must-not-run.mjs ${marker}`,
            test: `node validation-must-not-run.mjs ${marker}`,
            typecheck: `node validation-must-not-run.mjs ${marker}`,
          },
        }, null, 2)}\n`,
      );
      writeText(validationScript, "import fs from 'node:fs';\nfs.writeFileSync(process.argv[2], 'executed');\n");
      writeText(path.join(fixture.project, "opencode.json"), `{\n  "provider": "${privateSentinels[0]}"\n}\n`);
      writeText(path.join(fixture.project, "AGENTS.md"), `# Project Agent Instructions\n\n## Runtime Authority\n\n${privateSentinels[1]}\n`);
      writeText(path.join(fixture.globalDir, "skills", "openspec-apply-change", "SKILL.md"), `${privateSentinels[3]}\n`);
      writeText(path.join(fixture.project, ".opencode", "skills", "openspec-apply-change", "SKILL.md"), `${privateSentinels[2]}\n`);
      const env = { HOME: isolatedHome, USERPROFILE: isolatedHome };

      const qualification = invokeIsolatedDoctorArgs(
        fixture,
        ["--project", fixture.project, "--format", "json", "--require", "qualification"],
        env,
      );
      assertEqual(qualification.exitCode, 2, "Canonical apply-skill collision must fail the selected qualification gate.");
      const qualificationParsed = parseDoctorV2(qualification);
      const identity = findBucket(qualificationParsed.checks, "name", "canonical runtime-source identity");
      assertEqual(identity.status, "warn", "Canonical collision must stay structurally visible rather than crash.");
      assertEqual(identity.blocksQualification, true, "Canonical collision must block qualification.");
      assert(namedBlockers(qualificationParsed.report, "qualification").includes("canonical runtime-source identity"), "Qualification blockers must include canonical runtime-source identity.");
      const identityDetail = String(identity.detail);
      assert(identityDetail.includes("openspec-apply-change"), "Collision detail must name the canonical apply skill.");
      assert(identityDetail.includes(".opencode/skills/openspec-apply-change/SKILL.md"), "Collision detail must name the project overlay location.");
      assert(identityDetail.includes("/global/skills/openspec-apply-change/SKILL.md"), "Collision detail must name the privacy-safe global source location.");

      const unattended = invokeIsolatedDoctorArgs(
        fixture,
        ["--project", fixture.project, "--format", "json", "--require", "unattended"],
        env,
      );
      assertEqual(unattended.exitCode, 2, "Canonical apply-skill collision must fail the selected unattended gate.");
      const unattendedParsed = parseDoctorV2(unattended);
      assert(namedBlockers(unattendedParsed.report, "unattended").includes("unattended canonical workflow"), "Unattended blockers must include unattended canonical workflow.");
      const workflow = findBucket(unattendedParsed.unattendedChecks, "name", "unattended canonical workflow");
      assertEqual(workflow.status, "blocked", "Unattended canonical workflow must be blocked by unknown precedence.");
      assert(String(workflow.detail).includes("openspec-apply-change"), "Unattended workflow detail must name the colliding canonical skill.");

      for (const result of [qualification, unattended]) {
        for (const sentinel of privateSentinels) {
          assertOutputExcludes(result, sentinel, "Doctor must not disclose private config, instruction, or skill content.");
        }
        assertOutputExcludes(result, fixture.root, "Doctor must not leak the absolute fixture path.");
        assertOutputExcludes(result, fixture.project, "Doctor must not leak the absolute project path.");
        assertOutputExcludes(result, fixture.globalDir, "Doctor must not leak the absolute global source path.");
      }
      assert(!fs.existsSync(marker), "Doctor must not execute project validation argv or create a validation marker.");
    },
  },
];
