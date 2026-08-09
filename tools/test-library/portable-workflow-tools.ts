import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  assert,
  assertEqual,
  assertFailure,
  assertOutputContains,
  assertSuccess,
  invokeProcessCapture,
  invokeValidator,
  libraryRoot,
  newLibraryFixture,
  runTests,
  type TestCase,
  writeText,
  lines,
} from "../test-helpers/library.ts";

const root = libraryRoot;
const archiveTool = path.join(root, "global", "bin", "openspec-archive.ts");
const stagedTool = path.join(root, "global", "bin", "validate-staged.ts");
const processHelper = path.join(root, "global", "bin", "portable-process.ts");

function withTempDir(name: string, run: (dir: string) => void): void {
  const dir = path.join(os.tmpdir(), `portable-workflow-${name}-${crypto.randomUUID().replace(/-/g, "")}`);
  fs.mkdirSync(dir, { recursive: true });
  try {
    run(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function git(cwd: string, args: string[]): string {
  const result = spawnSync("git", args, { cwd, encoding: "utf8", shell: false });
  if (result.error != null || (result.status ?? 1) !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr || result.stdout || result.error?.message}`);
  }
  return (result.stdout ?? "").trim();
}

function pathToImport(file: string): string {
  const resolved = path.resolve(file).replaceAll("\\", "/");
  return resolved.startsWith("/") ? `file://${resolved}` : `file:///${resolved}`;
}

function writeMinimalPortableEntrypoint(file: string, extra = ""): void {
  writeText(file, lines([
    "#!/usr/bin/env node",
    'import path from "node:path";',
    'import { pathToFileURL } from "node:url";',
    'const rootFlag = "--root";',
    extra,
    "if (process.argv[1] != null && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {",
    '  console.log("main-executed");',
    "}",
    "",
  ]));
}

function installPortableFixtureSurface(fixture: string): void {
  writeText(path.join(fixture, "tools", "install-opencode-global.ts"), lines([
    "#!/usr/bin/env node",
    'const target = "global";',
    'process.env.OPENCODE_CONFIG_DIR = target;',
    "",
  ]));
  writeText(path.join(fixture, "global", "AGENTS.md"), lines([
    "# Fixture Global Agents",
    "",
    "- ## Attempt control and stagnation",
    "- Treat the session as stagnant when retries stall; a later failure in the same chain is diagnosis, not outcome progress.",
    "- One evidence-only costly attempt immediately blocks another live attempt; the `unknown` gate state remains blocked.",
    "- Record strategy history in `openspec/changes/<change>/history.md`.",
    "- Emit `Pending Strategy History` when compaction cannot write files.",
    "- Choose a materially different local mechanism instead of repeating the same approach.",
    "",
  ]));
  writeText(path.join(fixture, "global", "opencode.json.template"), lines([
    "{",
    '  "$schema": "https://opencode.ai/config.json",',
    '  "model": "openai/gpt-5.6-sol",',
    '  "compaction": {',
    '    "prompt": "Emit Pending Strategy History and write history.md with Live-Attempt Gate: clear | blocked | unknown, Failure Chain, and Terminal Replay Result. Name the first gate-closing offline step and classify a live-only missing observation as bounded evidence capture rather than proof."',
    "  }",
    "}",
    "",
  ]));
  writeText(path.join(fixture, "global", "package.json"), "{\n  \"private\": true,\n  \"type\": \"module\"\n}\n");
  writeMinimalPortableEntrypoint(path.join(fixture, "global", "bin", "openspec-archive.ts"));
  writeText(path.join(fixture, "global", "bin", "portable-process.ts"), "export function noop(): void {}\n");
  writeMinimalPortableEntrypoint(path.join(fixture, "global", "bin", "validate-staged.ts"));
}

function writeFakeOpenspec(dir: string, changeRoot: string, tasksPath: string): string {
  const fake = path.join(dir, "fake-openspec.mjs");
  writeText(fake, lines([
    "#!/usr/bin/env node",
    "const args = process.argv.slice(2);",
    "if (args[0] === 'status' && args.includes('--json')) {",
    "  console.log(JSON.stringify({",
    `    changeRoot: ${JSON.stringify(changeRoot)},`,
    "    artifacts: [",
    "      { id: 'proposal', status: 'done' },",
    "      { id: 'design', status: 'done' },",
    "      { id: 'tasks', status: 'done' },",
    "      { id: 'specs', status: 'done' }",
    "    ],",
    `    artifactPaths: { tasks: { existingOutputPaths: [${JSON.stringify(tasksPath)}] } }`,
    "  }));",
    "  process.exit(0);",
    "}",
    "console.error('unexpected openspec invocation: ' + args.join(' '));",
    "process.exit(99);",
    "",
  ]));
  const wrapper = path.join(dir, process.platform === "win32" ? "openspec.cmd" : "openspec");
  if (process.platform === "win32") {
    writeText(wrapper, `@echo off\r\nnode "%~dp0fake-openspec.mjs" %*\r\n`);
  } else {
    writeText(wrapper, lines([
      "#!/usr/bin/env bash",
      'exec node "$(dirname "$0")/fake-openspec.mjs" "$@"',
      "",
    ]));
    fs.chmodSync(wrapper, 0o755);
  }
  return wrapper;
}

export const portableWorkflowToolTests: TestCase[] = [
  {
    name: "portable archive and staged entrypoints stay import-safe",
    run: () => {
      for (const tool of [archiveTool, stagedTool, processHelper]) {
        const imported = invokeProcessCapture(
          process.execPath,
          ["--input-type=module", "-e", `await import(${JSON.stringify(pathToImport(tool))})`],
          root,
        );
        assertSuccess(imported, `${path.basename(tool)} must import without executing CLI main.`);
        assert(!imported.output.includes("Usage:"), `${path.basename(tool)} import must not print CLI usage.`);
        assert(!imported.output.includes("Archive failed"), `${path.basename(tool)} import must not run archive main.`);
        assert(!imported.output.includes("Staged validation failed"), `${path.basename(tool)} import must not run staged main.`);
      }
    },
  },
  {
    name: "portable archive rejects missing validation argv before mutation",
    run: () => withTempDir("archive-missing-validation", (dir) => {
      const result = invokeProcessCapture(process.execPath, [archiveTool, "--root", dir, "--change", "demo-change"], dir);
      assertFailure(result, "Archive must require project validation argv or an explicit not-applicable reason.");
      assertOutputContains(result, "Project validation is required", "Archive must name the validation requirement.");
      assertEqual(result.exitCode, 2, "Missing validation should use usage/exit 2.");
    }),
  },
  {
    name: "portable archive rejects incomplete tasks before project validation",
    run: () => withTempDir("archive-incomplete", (dir) => {
      const changeRoot = path.resolve(dir, "openspec", "changes", "incomplete-change");
      const tasksPath = path.resolve(changeRoot, "tasks.md");
      writeText(path.join(changeRoot, "proposal.md"), "# Proposal\n");
      writeText(path.join(changeRoot, "design.md"), "# Design\n");
      writeText(tasksPath, "# Tasks\n\n- [x] Done\n- [ ] Open\n");
      writeText(path.join(changeRoot, "specs", "demo", "spec.md"), "# Spec\n");
      const openspec = writeFakeOpenspec(dir, changeRoot, tasksPath);
      const validationMarker = path.join(dir, "validation-ran.txt");
      const result = invokeProcessCapture(process.execPath, [
        archiveTool,
        "--root", dir,
        "--change", "incomplete-change",
        "--openspec", openspec,
        "--",
        process.execPath,
        "-e",
        `require('node:fs').writeFileSync(${JSON.stringify(validationMarker)}, 'ran');`,
      ], dir);
      assertFailure(result, "Incomplete tasks must block complete archive.");
      assertOutputContains(result, "unchecked task", "Incomplete archive must report unchecked tasks.");
      assert(!fs.existsSync(validationMarker), "Project validation must not run when tasks are incomplete.");
    }),
  },
  {
    name: "portable staged validation observes index bytes and cleans disposable worktree",
    run: () => withTempDir("staged-index", (dir) => {
      git(dir, ["init"]);
      git(dir, ["config", "user.email", "sdet@example.invalid"]);
      git(dir, ["config", "user.name", "SDET"]);
      writeText(path.join(dir, "check.txt"), "seed\n");
      writeText(path.join(dir, "validate.mjs"), lines([
        "import fs from 'node:fs';",
        "const text = fs.readFileSync('check.txt', 'utf8').trim();",
        "if (text !== 'green-index') {",
        "  console.error('candidate=' + text);",
        "  process.exit(3);",
        "}",
        "console.log('candidate=' + text);",
        "",
      ]));
      git(dir, ["add", "check.txt", "validate.mjs"]);
      git(dir, ["commit", "-m", "seed"]);
      // Stage green index content, then leave conflicting red bytes only in the worktree.
      fs.writeFileSync(path.join(dir, "check.txt"), "green-index\n", "utf8");
      git(dir, ["add", "check.txt"]);
      fs.writeFileSync(path.join(dir, "check.txt"), "red-worktree\n", "utf8");
      const tempParent = path.join(dir, "tmp-parent");
      fs.mkdirSync(tempParent, { recursive: true });
      const before = fs.readFileSync(path.join(dir, "check.txt"), "utf8");
      // Use PATH `node` (no spaces) for the accepted green-path oracle. Spaced absolute
      // executables are covered by the critical Windows argv reproducer below.
      const result = invokeProcessCapture(process.execPath, [
        stagedTool,
        "--root", dir,
        "--temp-parent", tempParent,
        "--",
        "node",
        "validate.mjs",
      ], dir);
      assertSuccess(result, "Staged validation should pass on green index content.");
      assertOutputContains(result, '"status": "passed"', "Staged validation must report passed status.");
      assertOutputContains(result, '"cleanup": "complete"', "Staged validation must report complete cleanup.");
      assertEqual(fs.readFileSync(path.join(dir, "check.txt"), "utf8"), before, "Source worktree bytes must remain unchanged.");
      const worktrees = git(dir, ["worktree", "list"]);
      assertEqual(worktrees.split(/\r?\n/).filter(Boolean).length, 1, "Only the source worktree should remain after cleanup.");
      assertEqual(fs.readdirSync(tempParent).length, 0, "Temporary parent must be empty after cleanup.");
    }),
  },
  {
    name: "portable staged validation preserves failing child diagnostics and still cleans up",
    run: () => withTempDir("staged-fail", (dir) => {
      git(dir, ["init"]);
      git(dir, ["config", "user.email", "sdet@example.invalid"]);
      git(dir, ["config", "user.name", "SDET"]);
      writeText(path.join(dir, "validate.mjs"), lines([
        "console.error('expected staged validation failure diagnostic');",
        "process.exit(7);",
        "",
      ]));
      git(dir, ["add", "validate.mjs"]);
      git(dir, ["commit", "-m", "seed"]);
      const tempParent = path.join(dir, "tmp-parent");
      fs.mkdirSync(tempParent, { recursive: true });
      const result = invokeProcessCapture(process.execPath, [
        stagedTool,
        "--root", dir,
        "--temp-parent", tempParent,
        "--",
        "node",
        "validate.mjs",
      ], dir);
      assertFailure(result, "Failing validation argv must fail the wrapper.");
      assertEqual(result.exitCode, 7, "Child exit status must propagate.");
      assertOutputContains(result, "expected staged validation failure diagnostic", "Child stderr must remain visible.");
      assertEqual(fs.readdirSync(tempParent).length, 0, "Failed staged validation must still clean the disposable worktree.");
    }),
  },
  {
    name: "CRITICAL: portable process accepts spaced absolute Windows .exe argv without shell parse",
    run: () => {
      if (process.platform !== "win32" || !process.execPath.includes(" ") || !/\.(?:exe|com)$/i.test(process.execPath)) {
        return;
      }
      withTempDir("staged-spaced-argv", (dir) => {
        git(dir, ["init"]);
        git(dir, ["config", "user.email", "sdet@example.invalid"]);
        git(dir, ["config", "user.name", "SDET"]);
        writeText(path.join(dir, "validate.mjs"), "console.log('spaced-exe-ok');\n");
        git(dir, ["add", "validate.mjs"]);
        git(dir, ["commit", "-m", "seed"]);
        const tempParent = path.join(dir, "tmp-parent");
        fs.mkdirSync(tempParent, { recursive: true });
        const result = invokeProcessCapture(process.execPath, [
          stagedTool,
          "--root", dir,
          "--temp-parent", tempParent,
          "--",
          process.execPath,
          "validate.mjs",
        ], dir);
        assertSuccess(result, "Spaced absolute Windows .exe validation argv must succeed after portable-process direct spawn.");
        assertOutputContains(result, '"status": "passed"', "Spaced absolute Node path must complete staged validation.");
        assertOutputContains(result, '"cleanup": "complete"', "Spaced absolute Node path must still clean disposable worktree.");
        assert(
          !result.output.includes("is not recognized"),
          "Spaced absolute .exe must not be cmd-joined into a mangled Program/Files token.",
        );
        assertEqual(fs.readdirSync(tempParent).length, 0, "Successful spaced-exe staged validation must clean temp parent.");
      });
    },
  },
  {
    name: "portable process rejects Windows shell metacharacters before execution",
    run: () => {
      if (process.platform !== "win32") {
        return;
      }
      withTempDir("portable-meta", (dir) => {
        git(dir, ["init"]);
        git(dir, ["config", "user.email", "sdet@example.invalid"]);
        git(dir, ["config", "user.name", "SDET"]);
        writeText(path.join(dir, "validate.mjs"), "console.log('should-not-run');\n");
        git(dir, ["add", "validate.mjs"]);
        git(dir, ["commit", "-m", "seed"]);
        const tempParent = path.join(dir, "tmp-parent");
        fs.mkdirSync(tempParent, { recursive: true });
        const result = invokeProcessCapture(process.execPath, [
          stagedTool,
          "--root", dir,
          "--temp-parent", tempParent,
          "--",
          "node",
          "validate.mjs",
          "evil&echo",
        ], dir);
        assertFailure(result, "Arguments with Windows shell metacharacters must fail closed.");
        assertOutputContains(result, "unsupported shell metacharacters", "Metacharacter rejection must be explicit before shell execution.");
        assert(!result.output.includes("should-not-run"), "Child must not execute when metacharacters are present.");
        assertEqual(fs.readdirSync(tempParent).length, 0, "Metacharacter rejection must still clean disposable worktree.");
      });
    },
  },
  {
    name: "validator rejects missing portability contract markers",
    run: () => {
      const fixture = newLibraryFixture("missing-portability-contract");
      const agentsPath = path.join(fixture, "REPO_AGENTS.md");
      const original = fs.readFileSync(agentsPath, "utf8");
      writeText(
        agentsPath,
        original
          .replace("## Portability Contract", "## Compatibility Notes")
          .replace("project-neutral reusable core", "shared helper")
          .replace("thin project adapters", "local wrappers")
          .replace("unrelated disposable project", "this repository")
          .replace("Repository-maintenance-only validators", "Optional validators"),
      );
      const result = invokeValidator(fixture);
      assertFailure(result, "Missing portability markers must fail deterministic validation.");
      assertOutputContains(result, "portable workflow tooling contract", "Portability contract failure must be named.");
    },
  },
  {
    name: "validator rejects missing portable bin tools and stagnation markers when installer is present",
    run: () => {
      const fixture = newLibraryFixture("missing-portable-bin-and-stagnation");
      installPortableFixtureSurface(fixture);
      assertSuccess(invokeValidator(fixture), "Complete portable fixture surface should pass validation.");

      fs.rmSync(path.join(fixture, "global", "bin", "openspec-archive.ts"));
      const missingTool = invokeValidator(fixture);
      assertFailure(missingTool, "Missing archive tool must fail validation.");
      assertOutputContains(missingTool, "portable project workflow tooling is incomplete", "Missing bin tool diagnostic must be explicit.");
      writeMinimalPortableEntrypoint(path.join(fixture, "global", "bin", "openspec-archive.ts"));

      const agentsPath = path.join(fixture, "global", "AGENTS.md");
      const completeAgents = fs.readFileSync(agentsPath, "utf8");
      writeText(agentsPath, completeAgents.replace("Treat the session as stagnant", "Treat retries carefully"));
      const missingStagnation = invokeValidator(fixture);
      assertFailure(missingStagnation, "Removed stagnation marker must fail validation.");
      assertOutputContains(missingStagnation, "global AGENTS stagnation strategy contract", "Stagnation contract failure must be named.");

      writeText(agentsPath, completeAgents.replace("immediately blocks another live attempt", "permits another live attempt"));
      const missingLiveAttemptGate = invokeValidator(fixture);
      assertFailure(missingLiveAttemptGate, "Removed live-attempt block marker must fail validation.");
      assertOutputContains(
        missingLiveAttemptGate,
        "global AGENTS stagnation strategy contract",
        "Live-attempt block contract failure must be named.",
      );
      writeText(agentsPath, completeAgents);

      const compactionPath = path.join(fixture, "global", "opencode.json.template");
      const completeCompaction = fs.readFileSync(compactionPath, "utf8");
      writeText(compactionPath, completeCompaction.replace("Terminal Replay Result", "Replay Result"));
      const missingTerminalReplay = invokeValidator(fixture);
      assertFailure(missingTerminalReplay, "Removed terminal replay marker must fail validation.");
      assertOutputContains(
        missingTerminalReplay,
        "compaction stagnation strategy contract",
        "Terminal replay contract failure must be named.",
      );
    },
  },
  {
    name: "validator rejects portable cores that embed package manager or repository identity",
    run: () => {
      const fixture = newLibraryFixture("portable-core-identity");
      installPortableFixtureSurface(fixture);
      writeMinimalPortableEntrypoint(
        path.join(fixture, "global", "bin", "openspec-archive.ts"),
        'const pm = "npm";\nconst repo = "opencode-kit";',
      );
      const result = invokeValidator(fixture);
      assertFailure(result, "Portable core identity leakage must fail validation.");
      assert(
        result.output.includes("package manager") || result.output.includes("repository identity"),
        `Expected package manager or repository identity diagnostic, got:\n${result.output}`,
      );
    },
  },
];

if (process.argv[1] != null && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  runTests(portableWorkflowToolTests, "portable");
}
