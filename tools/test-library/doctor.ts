import fs from "node:fs";
import path from "node:path";
import {
  asArray,
  asRecord,
  assert,
  assertEqual,
  assertFailure,
  assertOutputContains,
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

const conformingAgentsAuthority = `# Independent Active Authority
## Change-Ready SDLC Routing
Ordinary Small is the default and reports Change-Ready: not requested. Main may directly author Ordinary Small production changes.
Profiles remain Ordinary Small | Material. Pilot-Ready: yes | no | not requested is a disposition inside a technically enforced operating envelope. Neither disposition authorizes deployment, release, installation, activation, credentials, or remote-state mutation.
Path: prove it observably before inspecting realistic requirement-linked edge cases.
Unrequested scope expansion requires explicit user approval.
After freeze, post-freeze scope may only shrink. Findings may block readiness but never authorize scope expansion. Qualification permits one correction wave.
Before the first mutation, load change-ready-sdlc for an explicit Change-Ready request, project-required qualification, or a concrete Material risk: ${namedMaterialRiskFixtureText}.
High-risk behavior must not be downgraded merely because the diff is small.
Before Pilot-Ready: yes, require a bounded outcome and non-goals, real-boundary happy-path proof, focused project-native validation, critical safety/data/authorization protection, sufficient material failure visibility, and proportional disable/rollback/containment.
## Universal Task Briefing Contract
Provide an execution-ready brief before specialist dispatch.
## Autonomous Work Contract
The primary orchestrator owns lifecycle state and bounded validation.
## Shared Reviewer Runtime Invariants
Reviewers are read-only leaf specialists and never self-approve readiness.
`;

const conformingSkillAuthority = `---
name: change-ready-sdlc
description: Independently copied lifecycle authority for fixture validation.
---
# Change-Ready SDLC
## When To Load
Ordinary Small does **not** load this skill.
Load before mutation for a concrete Material risk: ${namedMaterialRiskFixtureText}.
High-risk behavior must not be downgraded merely because the diff is small.
## Profile
Classify the change before mutation and record a project-specific scope lock. Expansion requires explicit owner approval.
After freeze, post-freeze scope may only shrink; expansion requires a new revision or separate change. Findings use Blocking Evidence and non-authorizing Follow-up Candidates and never authorize scope expansion. Qualification permits one correction wave for a frozen acceptance criterion, with no persistent evidence infrastructure. Final review uses approved | approved_with_notes | rejected | blocked.
## Adapter Discovery
## Authoritative Brief
## Orchestrator ownership
## Lifecycle transitions
### 1. Classify and prepare
### 2. Production path or test-only N/A
### 3. Candidate Reference
### 4. Applicable Proof
### 5. Fresh SDET
### 6. Project-Native Validation
### 7. Correction routing and replay
### 8. Final Candidate Review
### 9. Change-Ready Decision
### 10. Pilot-Ready Decision
Pilot-Ready: yes | no | not requested is not a third lifecycle profile; profiles remain Ordinary Small | Material. The complete Pilot safety floor is authoritative only in always-loaded global AGENTS.md; this skill does not restate that floor. Neither disposition authorizes deployment, release, installation, activation, credentials, or remote-state mutation.
## Compact orchestration output
`;

function writeConformingAuthority(globalDir: string): void {
  writeText(path.join(globalDir, "AGENTS.md"), conformingAgentsAuthority);
  writeText(path.join(globalDir, "skills", "change-ready-sdlc", "SKILL.md"), conformingSkillAuthority);
}

function newIsolatedDoctorFixture(name: string, localConfig: string): IsolatedDoctorFixture {
  const fixtureRoot = newTempDir(`doctor-${name}`);
  const doctorPath = path.join(fixtureRoot, "tools", "doctor.ts");
  const globalDir = path.join(fixtureRoot, "global");
  const project = path.join(fixtureRoot, "project");
  const doctorSource = fs.readFileSync(path.join(root, "tools", "doctor.ts"), "utf8")
    .replace('from "jsonc-parser"', `from "${import.meta.resolve("jsonc-parser")}"`);
  assert(doctorSource.includes('from "./validators/active-authority.ts"'), "Isolated doctor must retain its active-authority module edge.");
  assert(!doctorSource.includes('from "js-yaml"'), "Doctor must not import js-yaml directly after active-authority extraction.");
  writeText(doctorPath, doctorSource);
  const authoritySource = fs.readFileSync(path.join(root, "tools", "validators", "active-authority.ts"), "utf8");
  assert(authoritySource.includes('from "js-yaml"'), "Active-authority must retain its real js-yaml parser edge.");
  const isolatedAuthoritySource = authoritySource
    .replace('from "js-yaml"', `from "${import.meta.resolve("js-yaml")}"`);
  assert(!isolatedAuthoritySource.includes('from "js-yaml"'), "Isolated active-authority must resolve the real installed js-yaml module.");
  writeText(path.join(fixtureRoot, "tools", "validators", "active-authority.ts"), isolatedAuthoritySource);
  const configPolicy = fs.readFileSync(path.join(root, "tools", "validators", "opencode-config.ts"), "utf8")
    .replace('from "jsonc-parser"', `from "${import.meta.resolve("jsonc-parser")}"`);
  writeText(path.join(fixtureRoot, "tools", "validators", "opencode-config.ts"), configPolicy);
  writeText(path.join(fixtureRoot, "tools", "validators", "context.ts"), fs.readFileSync(path.join(root, "tools", "validators", "context.ts"), "utf8"));
  writeText(path.join(fixtureRoot, "instructions", "universal-development-loop.md"), "# Universal Development Loop\n");
  writeText(path.join(fixtureRoot, "profiles", "all.json"), "{}\n");
  writeText(path.join(globalDir, "opencode.json.template"), "{\n  \"$schema\": \"https://opencode.ai/config.json\"\n}\n");
  fs.writeFileSync(path.join(globalDir, "opencode.json"), Buffer.from(localConfig, "utf8"));
  writeConformingAuthority(globalDir);
  for (const relative of [
    path.join("agents", "implementation-worker.md"),
    path.join("agents", "sdet-quality-engineer.md"),
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
  checks: Array<Record<string, unknown>>;
  report: Record<string, unknown>;
} {
  const report = asRecord(parseJsonOutput(result), "Doctor JSON root should be an object.");
  assertEqual(report.tool, "opencode-dev-kit-doctor", "Doctor tool id drifted.");
  assertEqual(report.version, 2, "Doctor report version must be 2.");
  assert(report.status === "pass" || report.status === "warn" || report.status === "blocked", "Doctor structural status is invalid.");
  assert(report.qualificationStatus === "pass" || report.qualificationStatus === "blocked", "Doctor qualificationStatus is invalid.");
  const checks = asArray(report.checks, "Doctor checks should be an array.");
  for (const check of checks) {
    assert(typeof check.name === "string", "Every doctor check must have a name.");
    assert(typeof check.detail === "string", "Every doctor check must have detail.");
    assert(check.status === "pass" || check.status === "warn" || check.status === "blocked", "Every doctor check must have a valid structural status.");
    assert(typeof check.blocksQualification === "boolean", "Every doctor check must expose blocksQualification.");
  }
  assertEqual(
    report.qualificationStatus,
    checks.some((check) => check.blocksQualification === true) ? "blocked" : "pass",
    "Top-level qualificationStatus must derive from per-check blocksQualification fields.",
  );
  return { checks, report };
}

export const doctorTests: TestCase[] = [
  {
    name: "doctor delegates active-authority parsing to a side-effect-free module",
    run: () => {
      const doctorSource = fs.readFileSync(path.join(root, "tools", "doctor.ts"), "utf8");
      const authoritySource = fs.readFileSync(path.join(root, "tools", "validators", "active-authority.ts"), "utf8");
      assert(doctorSource.includes('from "./validators/active-authority.ts"'), "Doctor must import the active-authority policy module.");
      assertEqual([...authoritySource.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]).join(","), "js-yaml", "Active-authority must import only its real YAML parser dependency.");
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
      const repoGlobalDir = path.join(root, "global");
      const result = invokeDoctor(["--project", project, "--format", "json"], { OPENCODE_CONFIG: undefined, OPENCODE_CONFIG_DIR: repoGlobalDir });
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
      assertEqual(validation.detail, "No complete validation adapter source. adapter.json unresolved (focusedTest, test, typecheck, lint, build); validation.md unresolved (focusedTest, test, typecheck, lint, build). Provide concrete opencode-dev-kit/adapter.json validation entries or a complete opencode-dev-kit/validation.md Purpose/Command table for Focused test, Full test, Typecheck, Lint, and Build before Change-Ready qualification.", "Doctor must report both unresolved sources and all five purposes in stable order.");
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
      assertEqual(report.status, "pass", "Fully concrete bootstrapped fixture should have structural pass status.");
      assertEqual(report.qualificationStatus, "pass", "Fully concrete complete authority should pass qualification diagnostics.");
      assertEqual(findBucket(checks, "name", "project adapter validation").status, "pass", "Concrete adapter validation entries should pass their check.");
      assertEqual(findBucket(checks, "name", "active kit required runtime authority").status, "pass", "Current required active kit authority should pass.");
      assertEqual(findBucket(checks, "name", "active kit optional default role files").status, "pass", "Present optional default roles should pass their advisory check.");
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
      for (const role of ["implementation-worker.md", "sdet-quality-engineer.md", "final-candidate-reviewer.md"]) {
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
      assertEqual(findBucket(checks, "name", "active kit required runtime authority").status, "pass", "Required authority remains AGENTS.md plus change-ready-sdlc.");
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
      assertOutputContains(result, "| Check | Status | Blocks Qualification | Detail |", "Markdown must display the qualification-impact column.");
      assertOutputContains(result, "| project opencode config | warn | no |", "Markdown must render advisory warning impact as no.");
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
        "No complete validation adapter source. adapter.json unresolved (focusedTest, test, typecheck, lint, build); validation.md unresolved (focusedTest, test, typecheck, lint, build). Provide concrete opencode-dev-kit/adapter.json validation entries or a complete opencode-dev-kit/validation.md Purpose/Command table for Focused test, Full test, Typecheck, Lint, and Build before Change-Ready qualification.",
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
      assertSuccess(result, "Doctor warning status should remain machine-readable with exit 0.");
      const { checks, report } = parseDoctorV2(result);
      assertEqual(report.status, "warn", "Doctor should report warn for a project missing bootstrap files.");
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
      if (!detail.includes("skills/change-ready-sdlc/SKILL.md") || !detail.includes("blocks behavior-changing Change-Ready work")) {
        throw new Error(`Missing-authority diagnostic must block lifecycle claims, got: ${String(authority.detail)}`);
      }

      const isolatedHome = path.join(fixture.root, "missing-default-home");
      const defaultResult = invokeIsolatedDoctor(fixture, {
        OPENCODE_CONFIG_DIR: undefined,
        HOME: isolatedHome,
        USERPROFILE: isolatedHome,
      });
      assertSuccess(defaultResult, "Missing default authority should remain a machine-readable warning.");
      const defaultAuthority = findBucket(parseDoctorV2(defaultResult).checks, "name", "active kit required runtime authority");
      assertEqual(defaultAuthority.status, "warn", "Missing isolated default authority should warn structurally.");
      assertEqual(defaultAuthority.blocksQualification, true, "Missing isolated default authority must block qualification.");
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
      assertEqual(authority.status, "pass", "Copied AGENTS.md plus change-ready-sdlc must satisfy active authority.");
      assertEqual(authority.blocksQualification, false, "Complete copied authority must not block qualification.");
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
        assertEqual(authority.status, "pass", "Default AGENTS.md plus change-ready-sdlc must satisfy active authority.");
        assert(String(authority.detail).includes("Host default ~/.config/opencode"), "Authority diagnostic must identify default-home resolution.");
      }
    },
  },
  {
    name: "doctor blocks adversarial active authority shapes without requiring source equality",
    run: () => {
      const cases = [
        { name: "agents-missing-direct-main", relative: "AGENTS.md", text: conformingAgentsAuthority.replace("Main may directly author Ordinary Small production changes", "Ordinary Small production changes use the normal author"), expected: "missing direct-main Ordinary Small production authorship" },
        { name: "agents-missing-proof", relative: "AGENTS.md", text: conformingAgentsAuthority.replace("prove it observably", "inspect the implementation"), expected: "missing observable happy-path proof marker" },
        { name: "agents-missing-edge", relative: "AGENTS.md", text: conformingAgentsAuthority.replace("realistic requirement-linked edge cases", "practical edge cases"), expected: "missing realistic requirement-linked edge inspection marker" },
        { name: "agents-proof-after-edge", relative: "AGENTS.md", text: conformingAgentsAuthority.replace("prove it observably before inspecting realistic requirement-linked edge cases", "inspect realistic requirement-linked edge cases before we prove it observably"), expected: "must order observable proof before realistic requirement-linked edge inspection" },
        { name: "agents-missing-user-approval", relative: "AGENTS.md", text: conformingAgentsAuthority.replace("explicit user approval", "later consideration"), expected: "missing explicit owner approval before unrequested scope expansion" },
        { name: "agents-missing-explicit-change-ready", relative: "AGENTS.md", text: conformingAgentsAuthority.replace("explicit Change-Ready", "owner-requested qualification"), expected: "missing explicit Change-Ready qualification trigger" },
        { name: "agents-missing-project-qualification", relative: "AGENTS.md", text: conformingAgentsAuthority.replace("project-required qualification", "project guidance"), expected: "missing project-required qualification trigger" },
        ...namedMaterialRiskFixtureCases.map(([name, marker, replacement, diagnostic]) => ({ name: `agents-risk-${name}`, relative: "AGENTS.md", text: conformingAgentsAuthority.replace(marker, replacement), expected: `missing named Material risk class: ${diagnostic}` })),
        { name: "agents-missing-no-downgrade", relative: "AGENTS.md", text: conformingAgentsAuthority.replace("must not be downgraded merely because the diff is small", "should usually remain cautious"), expected: "missing no high-risk downgrade for small diffs" },
        { name: "agents-missing-post-freeze-shrink", relative: "AGENTS.md", text: conformingAgentsAuthority.replace("post-freeze scope may only shrink", "scope remains bounded after freeze"), expected: "missing closed-world post-freeze shrink rule" },
        { name: "agents-missing-non-authorizing-blocker", relative: "AGENTS.md", text: conformingAgentsAuthority.replace("never authorize scope expansion", "do not normally expand scope"), expected: "missing non-authorizing blocker rule" },
        { name: "agents-missing-one-correction-wave", relative: "AGENTS.md", text: conformingAgentsAuthority.replace("one correction wave", "bounded corrections"), expected: "missing finite one-correction-wave marker" },
        { name: "skill-missing-ordinary-nonload", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("does **not** load this skill", "uses a compact path"), expected: "missing Ordinary Small non-load/default boundary" },
        { name: "skill-missing-scope-lock", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("project-specific scope lock", "task boundary"), expected: "missing project-specific scope-lock control" },
        { name: "skill-missing-owner-approval", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("explicit owner approval", "later review"), expected: "missing explicit owner approval expansion rule" },
        ...namedMaterialRiskFixtureCases.map(([name, marker, replacement, diagnostic]) => ({ name: `skill-risk-${name}`, relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace(marker, replacement), expected: `missing named Material risk class: ${diagnostic}` })),
        { name: "skill-missing-no-downgrade", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("must not be downgraded merely because the diff is small", "should usually remain cautious"), expected: "missing no high-risk downgrade for small diffs" },
        { name: "skill-missing-post-freeze-shrink", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("post-freeze scope may only shrink", "scope remains bounded after freeze"), expected: "missing closed-world post-freeze shrink rule" },
        { name: "skill-missing-non-authorizing-blocker", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("never authorize scope expansion", "do not normally expand scope"), expected: "missing non-authorizing blocker rule" },
        { name: "skill-missing-one-correction-wave", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("one correction wave", "bounded corrections"), expected: "missing finite one-correction-wave marker" },
        { name: "skill-missing-blocking-evidence", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("Blocking Evidence", "Readiness Evidence"), expected: "missing Blocking Evidence output field" },
        { name: "skill-missing-follow-up-candidates", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("Follow-up Candidates", "Future Work"), expected: "missing Follow-up Candidates output field" },
        { name: "skill-missing-final-verdict-enum", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("approved | approved_with_notes | rejected | blocked", "accepted or rejected"), expected: "missing final-review rejected verdict enum" },
        { name: "skill-missing-global-floor-authority", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("complete Pilot safety floor is authoritative only in always-loaded global", "Pilot safety floor is documented elsewhere"), expected: "missing complete Pilot safety-floor authority reference to always-loaded global AGENTS" },
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
        { name: "skill-incomplete-lifecycle", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("### 3. Candidate Reference", "### 3. Candidate Snapshot"), expected: "missing ordered heading: Candidate Reference" },
        { name: "skill-misordered-lifecycle", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: conformingSkillAuthority.replace("## Profile", "## SWAP").replace("## Adapter Discovery", "## Profile").replace("## SWAP", "## Adapter Discovery"), expected: "out-of-order heading: Adapter Discovery" },
        { name: "skill-duplicate-lifecycle", relative: path.join("skills", "change-ready-sdlc", "SKILL.md"), text: `${conformingSkillAuthority}\n### 5. Fresh SDET\nDuplicate marker.\n`, expected: "duplicate heading: Fresh SDET" },
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
];
