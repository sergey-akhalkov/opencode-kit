import fs from "node:fs";
import path from "node:path";
import {
  asArray,
  asRecord,
  assertEqual,
  assertFailure,
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

function newIsolatedDoctorFixture(name: string, localConfig: string): IsolatedDoctorFixture {
  const fixtureRoot = newTempDir(`doctor-${name}`);
  const doctorPath = path.join(fixtureRoot, "tools", "doctor.ts");
  const globalDir = path.join(fixtureRoot, "global");
  const project = path.join(fixtureRoot, "project");
  const doctorSource = fs.readFileSync(path.join(root, "tools", "doctor.ts"), "utf8")
    .replace('from "jsonc-parser"', `from "${import.meta.resolve("jsonc-parser")}"`);
  writeText(doctorPath, doctorSource);
  writeText(path.join(fixtureRoot, "instructions", "universal-development-loop.md"), "# Universal Development Loop\n");
  writeText(path.join(fixtureRoot, "profiles", "all.json"), "{}\n");
  writeText(path.join(globalDir, "opencode.json.template"), "{\n  \"$schema\": \"https://opencode.ai/config.json\"\n}\n");
  writeText(path.join(globalDir, "opencode.json"), localConfig);
  writeText(path.join(project, "AGENTS.md"), "# Universal Development Loop\n");
  writeText(path.join(project, "opencode-dev-kit", "adapter.json"), "{}\n");
  writeText(path.join(project, "opencode-dev-kit", "validation.md"), "# Validation\n");
  writeText(path.join(project, "docs", "feedbacks", "README.md"), "# Feedback\n");
  writeText(path.join(project, "opencode.json"), "{}\n");
  return { doctorPath, globalDir, project, root: fixtureRoot };
}

function invokeIsolatedDoctor(
  fixture: IsolatedDoctorFixture,
  env: Record<string, string | undefined> = {},
) {
  return invokeProcessCapture(
    process.execPath,
    [fixture.doctorPath, "--project", fixture.project, "--format", "json"],
    fixture.root,
    { OPENCODE_CONFIG: undefined, OPENCODE_CONFIG_DIR: fixture.globalDir, ...env },
  );
}

export const doctorTests: TestCase[] = [
  {
    name: "doctor reports bootstrapped project readiness",
    run: () => {
      const project = newTempDir("doctor-project");
      assertSuccess(invokeInitProject(["--target", project, "--mode", "write"]), "Bootstrap should prepare the doctor fixture.");
      const repoGlobalDir = path.join(root, "global");
      const result = invokeDoctor(["--project", project, "--format", "json"], { OPENCODE_CONFIG_DIR: repoGlobalDir });
      assertSuccess(result, "Doctor should pass for a bootstrapped project.");
      const report = asRecord(parseJsonOutput(result), "Doctor JSON root should be an object.");
      assertEqual(report.project, "<redacted>", "Doctor should redact project paths by default.");
      const checks = asArray(report.checks, "Doctor checks should be an array.");
      const projectChecks = checks.filter((check) => !check.name.startsWith("opencode config layering"));
      const projectFails = projectChecks.filter((check) => check.status !== "pass");
      if (projectFails.length > 0) {
        throw new Error(`All non-layering project checks should pass for a bootstrapped project.\nFailures:\n${JSON.stringify(projectFails, null, 2)}`);
      }
    },
  },
  {
    name: "doctor reports warnings for unbootstrapped project",
    run: () => {
      const project = newTempDir("doctor-warning-project");
      const result = invokeDoctor(["--project", project, "--format", "json"], { OPENCODE_CONFIG_DIR: undefined });
      assertSuccess(result, "Doctor warning status should remain machine-readable with exit 0.");
      const report = asRecord(parseJsonOutput(result), "Doctor JSON root should be an object.");
      assertEqual(report.status, "warn", "Doctor should report warn for a project missing bootstrap files.");
      const checks = asArray(report.checks, "Doctor checks should be an array.");
      const agentsCheck = findBucket(checks, "name", "project AGENTS.md");
      assertEqual(agentsCheck.status, "warn", "Doctor should warn when project AGENTS.md is missing the loop.");
      const adapterCheck = findBucket(checks, "name", "project adapter");
      assertEqual(adapterCheck.status, "warn", "Doctor should warn when project adapter is missing.");
      const feedbackCheck = findBucket(checks, "name", "project feedback ledger");
      assertEqual(feedbackCheck.status, "warn", "Doctor should warn when project feedback ledger is missing.");
    },
  },
  {
    name: "doctor surfaces opencode config layering state",
    run: () => {
      const project = newTempDir("doctor-layering-project");
      const result = invokeDoctor(["--project", project, "--format", "json"], { OPENCODE_CONFIG_DIR: undefined });
      assertSuccess(result, "Doctor should run for layering check.");
      const report = asRecord(parseJsonOutput(result), "Doctor JSON root should be an object.");
      const checks = asArray(report.checks, "Doctor checks should be an array.");
      const layerCheck = findBucket(checks, "name", "opencode config layering");
      assertEqual(layerCheck.status, "warn", "Layering check should warn when OPENCODE_CONFIG_DIR is unset.");
      if (!String(layerCheck.detail).includes("OPENCODE_CONFIG_DIR")) {
        throw new Error(`Layering detail should mention OPENCODE_CONFIG_DIR; got: ${layerCheck.detail}`);
      }
    },
  },
  ...[
    {
      name: "unsupported marker",
      localConfig: "{\n  \"machineOverride\": true,\n  \"provider\": \"private-value\"\n}\n",
      expected: "unsupported field 'machineOverride'",
    },
    {
      name: "invalid JSONC",
      localConfig: "{\n  /* unterminated comment\n",
      expected: "not valid OpenCode JSON/JSONC",
    },
  ].map(({ name, localConfig, expected }): TestCase => ({
    name: `doctor blocks existing ${name} local config`,
    run: () => {
      const fixture = newIsolatedDoctorFixture(name.replace(/\s+/g, "-"), localConfig);
      const result = invokeIsolatedDoctor(fixture);
      assertFailure(result, `Doctor must block an existing ${name} config.`);
      const report = asRecord(parseJsonOutput(result), "Doctor JSON root should be an object.");
      assertEqual(report.status, "blocked", `Doctor report should be blocked for ${name}.`);
      const checks = asArray(report.checks, "Doctor checks should be an array.");
      const layerCheck = findBucket(checks, "name", "opencode config layering");
      assertEqual(layerCheck.status, "blocked", `Layering check should block ${name}.`);
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
      const report = asRecord(parseJsonOutput(result), "Doctor JSON root should be an object.");
      const checks = asArray(report.checks, "Doctor checks should be an array.");
      assertEqual(findBucket(checks, "name", "opencode config layering").status, "pass", "Case-only path differences should preserve the active layer.");
    },
  },
  {
    name: "doctor reports explicit OPENCODE_CONFIG existence",
    run: () => {
      const fixture = newIsolatedDoctorFixture("explicit-config", "{\n  \"permission\": \"ask\"\n}\n");
      const explicitConfig = path.join(fixture.root, "explicit.jsonc");
      writeText(explicitConfig, "{\n  // Explicit overlay\n}\n");
      const existingResult = invokeIsolatedDoctor(fixture, { OPENCODE_CONFIG: explicitConfig });
      assertSuccess(existingResult, "Doctor should pass when explicit OPENCODE_CONFIG exists.");
      const existingReport = asRecord(parseJsonOutput(existingResult), "Doctor JSON root should be an object.");
      const existingChecks = asArray(existingReport.checks, "Doctor checks should be an array.");
      assertEqual(findBucket(existingChecks, "name", "explicit opencode config").status, "pass", "Existing explicit config should report pass.");

      const missingConfig = path.join(fixture.root, "missing.jsonc");
      const missingResult = invokeIsolatedDoctor(fixture, { OPENCODE_CONFIG: missingConfig });
      assertFailure(missingResult, "Doctor should block when OPENCODE_CONFIG points to a missing file.");
      const missingReport = asRecord(parseJsonOutput(missingResult), "Doctor JSON root should be an object.");
      const missingChecks = asArray(missingReport.checks, "Doctor checks should be an array.");
      const explicitCheck = findBucket(missingChecks, "name", "explicit opencode config");
      assertEqual(explicitCheck.status, "blocked", "Missing explicit config should report blocked.");
      if (!String(explicitCheck.detail).includes("points to a missing file")) {
        throw new Error(`Missing explicit config diagnostic should be actionable, got: ${String(explicitCheck.detail)}`);
      }
    },
  },
];
