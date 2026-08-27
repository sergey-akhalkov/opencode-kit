import fs from "node:fs";
import path from "node:path";
import {
  asArray,
  asRecord,
  assertDeepEqual,
  assertEqual,
  assertFailure,
  assertOutputContains,
  assertOutputExcludes,
  assertSuccess,
  findBucket,
  invokeInstructionInventory,
  invokeProjectInventory,
  isolatedOpenCodeEnv,
  libraryRoot,
  newTempDir,
  parseJsonOutput,
  type TestCase,
  writeText,
  lines,
} from "../test-helpers/library.ts";

const countKeys = ["scanned", "ignored", "generated", "evidence", "vendor", "unreadable", "unsupported", "unknown"];

function inventoryReport(args: string[]): Record<string, unknown> {
  const result = invokeProjectInventory(args);
  assertSuccess(result, "Project inventory should succeed.");
  return asRecord(parseJsonOutput(result), "Project inventory JSON root should be an object.");
}

function assertCountShape(report: Record<string, unknown>): Record<string, unknown> {
  const counts = asRecord(report.counts, "Project inventory counts should be an object.");
  assertDeepEqual(Object.keys(counts), countKeys, "Project inventory count keys must stay in stable order.");
  for (const key of countKeys) {
    if (typeof counts[key] !== "number") {
      throw new Error(`Count ${key} must be a number.\nCounts:\n${JSON.stringify(counts, null, 2)}`);
    }
  }
  return counts;
}

function rootPaths(report: Record<string, unknown>, key: string): string[] {
  return asArray(report[key], `Project inventory ${key} should be an array.`).map((row) => String(row.path));
}

function assertNoSharedRoots(report: Record<string, unknown>): void {
  const sources = new Set(rootPaths(report, "sourceRoots"));
  for (const testPath of rootPaths(report, "testRoots")) {
    if (sources.has(testPath)) {
      throw new Error(`Root ${testPath} was classified as both source and test.`);
    }
  }
}

export const inventoryTests: TestCase[] = [
  {
    name: "project inventory reports deterministic project signals",
    run: () => {
      const project = newTempDir("project-inventory");
      writeText(path.join(project, "package.json"), lines([
        "{",
        "  \"scripts\": {",
        "    \"test\": \"npm test -- --runInBand\",",
        "    \"build\": \"tsc -p tsconfig.json\"",
        "  }",
        "}",
      ]));
      writeText(path.join(project, "src", "index.ts"), "export const value = 1;\n");
      writeText(path.join(project, "tests", "index.test.ts"), "test('value', () => {});\n");
      writeText(path.join(project, "tsconfig.json"), "{}\n");
      const result = invokeProjectInventory(["--root", project, "--format", "json"]);
      assertSuccess(result, "Project inventory should read a small fixture project.");
      const report = asRecord(parseJsonOutput(result), "Project inventory JSON root should be an object.");
      assertEqual(report.root, "<redacted>", "Project inventory should redact root by default.");
      const scripts = asArray(report.packageScripts, "Project inventory scripts should be an array.");
      findBucket(scripts, "name", "test");
      const buildFiles = asArray(report.buildFiles, "Project inventory build files should be an array.");
      findBucket(buildFiles, "path", "package.json");
      const sourceRoots = asArray(report.sourceRoots, "Project inventory source roots should be an array.");
      findBucket(sourceRoots, "path", "src");
      findBucket(asArray(report.testRoots, "Project inventory test roots should be an array."), "path", "tests");
      assertNoSharedRoots(report);
      assertCountShape(report);
    },
  },
  {
    name: "project inventory classifies kit-like tools tests and production owners",
    run: () => {
      const project = newTempDir("project-inventory-self");
      writeText(path.join(project, "package.json"), lines([
        "{",
        "  \"scripts\": {",
        "    \"test\": \"node tools/test-app.ts\",",
        "    \"app\": \"node tools/app.ts\"",
        "  }",
        "}",
      ]));
      writeText(path.join(project, "tools", "app.ts"), "export const app = 1;\n");
      writeText(path.join(project, "tools", "test-app.ts"), "export const testApp = 1;\n");
      writeText(path.join(project, "tools", "proofs", "lib", "helper.ts"), "export const helper = 1;\n");
      const report = inventoryReport(["--root", project, "--format", "json"]);
      const sourceRoots = asArray(report.sourceRoots, "Self-layout source roots should be an array.");
      findBucket(sourceRoots, "path", "tools");
      assertEqual(findBucket(sourceRoots, "path", "tools").reason, "maintained-tool-root", "tools should be a maintained production owner.");
      const sourcePaths = rootPaths(report, "sourceRoots");
      if (sourcePaths.includes(".")) {
        throw new Error("Self-layout inventory must not treat nested tools files as root-level source.");
      }
      if (sourcePaths.length === 1 && sourcePaths[0] === "tools/proofs/lib") {
        throw new Error("Self-layout inventory must not classify only tools/proofs/lib as source.");
      }
      const testRoot = findBucket(asArray(report.testRoots, "Self-layout test roots should be an array."), "path", "tools/test*.ts");
      assertEqual(testRoot.reason, "maintained-test-pattern", "tools/test*.ts should be maintained test ownership.");
      assertEqual(report.testRootEvidence, "classified", "Self-layout tests must have classified evidence.");
      assertNoSharedRoots(report);
      assertCountShape(report);
    },
  },
  {
    name: "project inventory keeps mixed conventional and tools roots distinct",
    run: () => {
      const project = newTempDir("project-inventory-mixed");
      writeText(path.join(project, "package.json"), "{}\n");
      writeText(path.join(project, "src", "index.ts"), "export const value = 1;\n");
      writeText(path.join(project, "lib", "util.ts"), "export const util = 1;\n");
      writeText(path.join(project, "tests", "index.test.ts"), "test('value', () => {});\n");
      writeText(path.join(project, "tools", "app.ts"), "export const app = 1;\n");
      writeText(path.join(project, "tools", "test-app.ts"), "export const testApp = 1;\n");
      writeText(path.join(project, "index.ts"), "export const root = 1;\n");
      writeText(path.join(project, "test-root.ts"), "export const rootTest = 1;\n");
      const report = inventoryReport(["--root", project, "--format", "json"]);
      const sourceRoots = asArray(report.sourceRoots, "Mixed source roots should be an array.");
      findBucket(sourceRoots, "path", "src");
      findBucket(sourceRoots, "path", "lib");
      findBucket(sourceRoots, "path", "tools");
      findBucket(sourceRoots, "path", ".");
      const testRoots = asArray(report.testRoots, "Mixed test roots should be an array.");
      findBucket(testRoots, "path", "tests");
      findBucket(testRoots, "path", "tools/test*.ts");
      findBucket(testRoots, "path", "test*.ts");
      assertNoSharedRoots(report);
    },
  },
  {
    name: "project inventory excludes evidence vendor and generated test-like files",
    run: () => {
      const project = newTempDir("project-inventory-evidence");
      writeText(path.join(project, "src", "index.ts"), "export const value = 1;\n");
      writeText(path.join(project, "tests", "index.test.ts"), "test('value', () => {});\n");
      writeText(path.join(project, "evidence", "archived.test.ts"), "test('archived', () => {});\n");
      writeText(path.join(project, "implementation-evidence", "nested.test.ts"), "test('nested', () => {});\n");
      writeText(path.join(project, ".review-evidence", "hidden.test.ts"), "test('hidden', () => {});\n");
      writeText(path.join(project, "vendor", "pkg", "ignored.test.ts"), "test('vendor', () => {});\n");
      writeText(path.join(project, "node_modules", "pkg", "dep.test.ts"), "test('dep', () => {});\n");
      writeText(path.join(project, "dist", "generated.test.ts"), "test('generated', () => {});\n");
      const report = inventoryReport(["--root", project, "--format", "json"]);
      const testPaths = rootPaths(report, "testRoots");
      assertDeepEqual(testPaths, ["tests"], "Evidence vendor and generated trees must not become test roots.");
      const counts = assertCountShape(report);
      if (Number(counts.evidence) < 3) {
        throw new Error(`Expected at least three evidence exclusions.\nCounts:\n${JSON.stringify(counts, null, 2)}`);
      }
      if (Number(counts.vendor) < 2) {
        throw new Error(`Expected vendor and node_modules exclusions.\nCounts:\n${JSON.stringify(counts, null, 2)}`);
      }
      if (Number(counts.generated) < 1) {
        throw new Error(`Expected a generated exclusion.\nCounts:\n${JSON.stringify(counts, null, 2)}`);
      }
      const notes = report.notes;
      if (!Array.isArray(notes) || !notes.includes("Exclusions are not proof of absence.")) {
        throw new Error(`Exclusion note must remain explicit.\nNotes:\n${JSON.stringify(notes, null, 2)}`);
      }
    },
  },
  {
    name: "project inventory reports no tests from documentation-only trees",
    run: () => {
      const project = newTempDir("project-inventory-empty");
      writeText(path.join(project, "README.md"), "Run the tests in tests/ after cloning.\n");
      const report = inventoryReport(["--root", project, "--format", "json"]);
      assertDeepEqual(rootPaths(report, "testRoots"), [], "Documentation must not invent a test root.");
      assertDeepEqual(rootPaths(report, "sourceRoots"), [], "Documentation must not invent a source root.");
      assertEqual(report.testRootEvidence, "no-matching-test-files", "Empty projects must keep the no-test evidence basis.");
      const markdown = invokeProjectInventory(["--root", project]);
      assertSuccess(markdown, "Empty-project markdown inventory should succeed.");
      assertOutputContains(markdown, "none (no-matching-test-files)", "Markdown must keep the no-test evidence basis.");
    },
  },
  {
    name: "project inventory fails closed on unreadable roots",
    run: () => {
      const missing = path.join(newTempDir("project-inventory-missing-parent"), "missing-root");
      const missingResult = invokeProjectInventory(["--root", missing, "--format", "json"]);
      assertFailure(missingResult, "Missing root must fail closed.");
      assertOutputContains(missingResult, "Root is unreadable: <redacted>", "Missing root must keep a redacted identity.");
      assertOutputContains(missingResult, "ENOENT", "Missing root must preserve the original cause.");
      assertOutputExcludes(missingResult, missing, "Missing root must not leak the absolute path.");
      assertOutputExcludes(missingResult, "opencode-dev-kit-project-inventory", "Unreadable roots must not emit a complete success map.");

      const fileRoot = path.join(newTempDir("project-inventory-file-root"), "not-a-dir.txt");
      writeText(fileRoot, "not a directory\n");
      const fileResult = invokeProjectInventory(["--root", fileRoot, "--format", "json"]);
      assertFailure(fileResult, "File root must fail closed.");
      assertOutputContains(fileResult, "Root is not a directory: <redacted>", "File root must keep a redacted identity.");
      assertOutputExcludes(fileResult, fileRoot, "File root must not leak the absolute path.");
    },
  },
  {
    name: "project inventory reports this repository production and tools tests",
    run: () => {
      const json = inventoryReport(["--root", libraryRoot, "--format", "json"]);
      findBucket(asArray(json.sourceRoots, "Kit source roots should be an array."), "path", "tools");
      findBucket(asArray(json.testRoots, "Kit test roots should be an array."), "path", "tools/test*.ts");
      const sourcePaths = rootPaths(json, "sourceRoots");
      if (sourcePaths.includes(".")) {
        throw new Error("Kit inventory must not treat nested production files as root-level source.");
      }
      if (sourcePaths.length === 1 && sourcePaths[0] === "tools/proofs/lib") {
        throw new Error("Kit inventory must not classify only tools/proofs/lib as source.");
      }
      assertEqual(json.root, "<redacted>", "Kit inventory must redact the root.");
      assertEqual(json.testRootEvidence, "classified", "Kit tests must be classified.");
      assertNoSharedRoots(json);
      assertCountShape(json);
      assertOutputExcludes(
        { exitCode: 0, output: JSON.stringify(json) },
        libraryRoot,
        "Kit JSON must not include the absolute root.",
      );

      const markdown = invokeProjectInventory(["--root", libraryRoot]);
      assertSuccess(markdown, "Kit markdown inventory should succeed.");
      assertOutputContains(markdown, "tools/test*.ts", "Kit markdown must report tools/test*.ts ownership.");
      assertOutputExcludes(markdown, "Test Roots: none", "Kit markdown must not claim there are no tests.");
      if (/## Test Roots\r?\n\r?\nnone(?:\r?\n|$)/.test(markdown.output)) {
        throw new Error(`Kit markdown must not report Test Roots none.\nOutput:\n${markdown.output}`);
      }
      assertOutputExcludes(markdown, libraryRoot, "Kit markdown must redact the absolute root.");
    },
  },
  {
    name: "instruction inventory reports token-cost artifact metrics",
    run: () => {
      const result = invokeInstructionInventory(["--format", "json"]);
      assertSuccess(result, "Instruction inventory should scan repository artifacts.");
      const report = asRecord(parseJsonOutput(result), "Instruction inventory JSON root should be an object.");
      assertEqual(report.root, "<redacted>", "Instruction inventory should redact root by default.");
      const totals = asRecord(report.totals, "Instruction inventory totals should be an object.");
      if (typeof totals.artifacts !== "number" || totals.artifacts < 1) {
        throw new Error(`Instruction inventory should count artifacts.\nTotals:\n${JSON.stringify(totals, null, 2)}`);
      }
      const artifacts = asArray(report.artifacts, "Instruction inventory artifacts should be an array.");
      findBucket(artifacts, "path", "instructions/universal-development-loop.md");
    },
  },
  {
    name: "default catalog inventory stays version 3 compatible with explicit catalog scope",
    run: () => {
      const catalog = newTempDir("catalog-compat");
      writeText(path.join(catalog, "README.md"), "root doc\n");
      writeText(path.join(catalog, "global", "AGENTS.md"), "authority\n");
      writeText(path.join(catalog, "instructions", "example.md"), "instruction\n");
      const maintainedContextQuality = JSON.parse(
        fs.readFileSync(path.join(libraryRoot, "config", "instruction-context-quality.json"), "utf8"),
      ) as { rules: unknown[]; schemaVersion: number };
      writeText(
        path.join(catalog, "config", "instruction-context-quality.json"),
        `${JSON.stringify({
          schemaVersion: maintainedContextQuality.schemaVersion,
          rules: maintainedContextQuality.rules,
          duplicateExceptions: [],
        }, null, 2)}\n`,
      );
      const defaultResult = invokeInstructionInventory(["--root", catalog, "--format", "json"]);
      const explicitResult = invokeInstructionInventory([
        "--root",
        catalog,
        "--source-scope",
        "catalog",
        "--format",
        "json",
      ]);
      assertSuccess(defaultResult, "Default inventory must keep catalog scope without --project.");
      assertSuccess(explicitResult, "Explicit catalog scope must remain invocable.");
      const defaultReport = asRecord(parseJsonOutput(defaultResult), "Default catalog JSON root should be an object.");
      const explicitReport = asRecord(parseJsonOutput(explicitResult), "Explicit catalog JSON root should be an object.");
      assertEqual(defaultReport.version, 3, "Default inventory must expose catalog context-quality schema version 3.");
      assertEqual(defaultReport.sourceScope, "catalog", "Default catalog output must identify catalog scope.");
      assertEqual(defaultReport.categories, undefined, "Default catalog output must not emit loader-visible categories.");
      asRecord(defaultReport.contextQuality, "Default catalog output should include context quality.");
      assertDeepEqual(defaultReport, explicitReport, "Default catalog output must match explicit --source-scope catalog.");
      findBucket(asArray(defaultReport.artifacts, "Catalog artifacts should be an array."), "path", "instructions/example.md");
    },
  },
  {
    name: "loader-visible inventory redacts content, ignores vendor trees, and keeps unknowns null",
    run: () => {
      const fixture = newTempDir("loader-visible-critical");
      const hostHome = path.join(fixture, "host-home");
      const customGlobal = path.join(fixture, "custom-global");
      const workspace = path.join(fixture, "workspace");
      const project = path.join(workspace, "project");
      const external = path.join(fixture, "external", "private.md");
      const privateMarker = "SYNTHETIC_PRIVATE_INSTRUCTION_MARKER";
      const vendorMarker = "SYNTHETIC_VENDOR_MARKER";
      const secretValue = "SYNTHETIC_PROVIDER_SECRET";

      writeText(path.join(workspace, ".git", "HEAD"), "ref: refs/heads/main\n");
      writeText(path.join(hostHome, ".config", "opencode", "AGENTS.md"), "Host authority.\n");
      writeText(path.join(customGlobal, "AGENTS.md"), "Custom authority.\n");
      writeText(path.join(customGlobal, "skills", "global-skill", "SKILL.md"), lines([
        "---",
        "description: Global synthetic skill.",
        "---",
        "",
        "Global on-demand body.",
        "",
      ]));
      writeText(path.join(project, "AGENTS.md"), `Project authority with ${privateMarker}.\n`);
      writeText(path.join(project, "project-extra.md"), `Project config instruction ${privateMarker}.\n`);
      writeText(external, `External synthetic instruction ${privateMarker}.\n`);
      writeText(path.join(project, "vendor", "ignored.md"), `${vendorMarker}\n`);
      writeText(path.join(project, ".opencode", "opencode.jsonc"), "{ invalid jsonc\n");
      writeText(path.join(project, "opencode.json"), `${JSON.stringify({
        provider: { apiKey: secretValue },
        model: "synthetic/model",
        instructions: [
          "project-extra.md",
          external.replaceAll("\\", "/"),
          "docs/*.md",
          "https://example.invalid/rules.md",
          "missing.md",
          37,
        ],
      }, null, 2)}\n`);

      const env = isolatedOpenCodeEnv(hostHome, {
        OPENCODE_CONFIG_DIR: customGlobal,
        OPENCODE_CONFIG_CONTENT: `{"instructions":["dynamic.md"],"provider":{"apiKey":"${secretValue}"}}`,
      });
      const args = ["--source-scope", "loader-visible", "--project", project];
      const jsonResult = invokeInstructionInventory([...args, "--format", "json"], env);
      const markdownResult = invokeInstructionInventory(args, env);
      assertSuccess(jsonResult, "Loader-visible JSON inventory should succeed on a synthetic consumer.");
      assertSuccess(markdownResult, "Loader-visible markdown inventory should succeed on a synthetic consumer.");

      for (const result of [jsonResult, markdownResult]) {
        assertOutputExcludes(result, privateMarker, "Instruction text must not appear in loader-visible output.");
        assertOutputExcludes(result, vendorMarker, "Vendor markdown must not be walked or emitted.");
        assertOutputExcludes(result, secretValue, "Secret-bearing config values must not be emitted.");
        assertOutputExcludes(result, fixture, "External absolute fixture paths must not appear.");
        assertOutputExcludes(
          result,
          fixture.replaceAll("\\", "/"),
          "External absolute fixture paths must not appear with forward slashes.",
        );
      }

      const report = asRecord(parseJsonOutput(jsonResult), "Loader-visible JSON root should be an object.");
      assertEqual(report.version, 2, "Loader-visible output must be versioned separately from catalog v1.");
      assertEqual(report.sourceScope, "loader-visible", "Loader-visible scope must be explicit in the report.");
      assertEqual(report.project, "<redacted>", "Loader-visible project path must be redacted by default.");
      const sources = asArray(report.sources, "Loader-visible sources should be an array.");
      const unknowns = sources.filter((source) => source.status === "unknown");
      if (unknowns.length < 4) {
        throw new Error(`Expected at least four unknown sources.\nSources:\n${JSON.stringify(sources, null, 2)}`);
      }
      for (const unknown of unknowns) {
        assertEqual(unknown.metrics, null, "Unknown sources must keep null metrics instead of a zero-sized measurement.");
      }
      const categories = asRecord(report.categories, "Loader-visible categories should be an object.");
      for (const name of ["startupVisibleCandidates", "discoveryMetadata", "onDemandBodies"]) {
        asRecord(categories[name], `Category ${name} must remain a separate total.`);
      }
      if (sources.some((source) => String(source.identity).includes("vendor") || String(source.identity).includes(vendorMarker))) {
        throw new Error("Vendor tree entries must not appear as loader-visible sources.");
      }
      findBucket(sources, "evidenceClass", "config-declared");
    },
  },
];
