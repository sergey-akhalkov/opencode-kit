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
  invokeInstructionBudget,
  invokeInstructionInventory,
  invokeProjectInventory,
  invokeValidator,
  isolatedOpenCodeEnv,
  newTempDir,
  parseJsonOutput,
  type TestCase,
  writeText,
  lines,
} from "../test-helpers/library.ts";

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
    name: "default catalog inventory stays version 1 compatible with explicit catalog scope",
    run: () => {
      const catalog = newTempDir("catalog-compat");
      writeText(path.join(catalog, "README.md"), "root doc\n");
      writeText(path.join(catalog, "global", "AGENTS.md"), "authority\n");
      writeText(path.join(catalog, "instructions", "example.md"), "instruction\n");
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
      assertEqual(defaultReport.version, 1, "Default inventory must remain catalog version 1.");
      assertEqual(defaultReport.sourceScope, undefined, "Default catalog output must not switch to loader-visible.");
      assertEqual(defaultReport.categories, undefined, "Default catalog output must not emit loader-visible categories.");
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
  {
    name: "instruction budget fails closed and does not assign kit maxima to consumers",
    run: () => {
      const kit = newTempDir("budget-kit");
      writeText(path.join(kit, "README.md"), "aaaaa");
      writeText(path.join(kit, "global", "AGENTS.md"), "bbbb");
      const seed = path.join(kit, "config", "instruction-budget.json");
      const materialized = invokeInstructionBudget([
        "--root",
        kit,
        "--seed",
        seed,
        "--format",
        "json",
        "--materialize-seed",
      ]);
      assertSuccess(materialized, "Reviewed budget seed materialization should pass on a disposable kit.");

      writeText(path.join(kit, "README.md"), "aaaaaaaaa");
      const growth = invokeInstructionBudget(["--root", kit, "--seed", seed, "--format", "json"]);
      assertFailure(growth, "Token-proxy growth beyond the reviewed maximum must fail closed.");
      const growthReport = asRecord(parseJsonOutput(growth), "Failed budget JSON root should be an object.");
      assertEqual(growthReport.status, "failed", "Over-budget status must be failed.");
      const catalog = findBucket(
        asArray(growthReport.boundaries, "Budget boundaries should be an array."),
        "name",
        "catalogTokenProxy",
      );
      assertEqual(catalog.status, "failed", "Catalog boundary must fail when actual exceeds maximum.");
      if (Number(catalog.actual) <= Number(catalog.maximum)) {
        throw new Error(`Growth failure must report actual above maximum.\nBoundary:\n${JSON.stringify(catalog, null, 2)}`);
      }
      assertEqual(
        growthReport.regenerationCommand,
        "npm run instruction:budget -- --materialize-seed",
        "Budget failure must name the regeneration command.",
      );

      writeText(seed, "{ malformed\n");
      const malformed = invokeInstructionBudget(["--root", kit, "--seed", seed, "--format", "json"]);
      assertFailure(malformed, "Malformed budget seed must fail closed.");
      assertOutputContains(malformed, "unreadable or malformed", "Malformed seed must keep a cause-preserving error.");
      assertOutputContains(malformed, "--materialize-seed", "Malformed seed must name the regeneration command.");

      const consumer = newTempDir("budget-consumer");
      writeText(path.join(consumer, "package.json"), lines([
        "{",
        "  \"name\": \"consumer-app\"",
        "}",
        "",
      ]));
      const validated = invokeValidator(consumer);
      assertOutputExcludes(
        validated,
        "Instruction budget",
        "Consumer roots without a project-owned budget must not be assigned kit maxima.",
      );
    },
  },
];
