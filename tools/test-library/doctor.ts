import path from "node:path";
import {
  asArray,
  asRecord,
  assertEqual,
  assertSuccess,
  findBucket,
  invokeDoctor,
  invokeInitProject,
  newTempDir,
  parseJsonOutput,
  type TestCase,
  libraryRoot,
} from "../test-helpers/library.ts";

const root = libraryRoot;

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
      const result = invokeDoctor(["--project", project, "--format", "json"]);
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
      const result = invokeDoctor(["--project", project, "--format", "json"]);
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
];
