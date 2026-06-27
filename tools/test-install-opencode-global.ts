#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SETX_SAFE_LIMIT,
  appendExportLine,
  buildExportLine,
  isExportLineFor,
  measuredValueLength,
  removeExportLine,
} from "./install-opencode-global.ts";

type ProcessResult = {
  exitCode: number;
  output: string;
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const installer = path.join(root, "tools", "install-opencode-global.ts");
const globalPath = path.resolve(root, "global");
const ENV_VAR = "OPENCODE_CONFIG_DIR";

function invokeInstaller(args: string[], envOverride?: Record<string, string | undefined>): ProcessResult {
  const env = { ...process.env, ...(envOverride ?? {}) };
  if (envOverride && envOverride[ENV_VAR] === undefined) {
    delete env[ENV_VAR];
  }
  const result = spawnSync(process.execPath, [installer, ...args], { cwd: root, encoding: "utf8", env });
  return { exitCode: result.status ?? 0, output: `${result.stdout}${result.stderr}` };
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertSuccess(result: ProcessResult, message: string): void {
  if (result.exitCode !== 0) {
    throw new Error(`${message}\nExitCode: ${result.exitCode}\nOutput:\n${result.output}`);
  }
}

function assertFailure(result: ProcessResult, message: string): void {
  if (result.exitCode === 0) {
    throw new Error(`${message}\nExpected failure but command succeeded.\nOutput:\n${result.output}`);
  }
}

function assertOutputContains(result: ProcessResult, needle: string, message: string): void {
  if (!result.output.includes(needle)) {
    throw new Error(`${message}\nExpected output to contain: ${needle}\nOutput:\n${result.output}`);
  }
}

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "oc-install-test-"));
}

function rmTempDir(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

const tests: { name: string; run: () => void }[] = [
  {
    name: "help documents the config-dir pointing model",
    run: () => {
      const result = invokeInstaller(["--help"]);
      assertSuccess(result, "Help should exit successfully.");
      assertOutputContains(result, ENV_VAR, "Help should name OPENCODE_CONFIG_DIR.");
      assertOutputContains(result, "global/", "Help should reference the global/ target directory.");
      assertOutputContains(result, "setx", "Help should document the Windows setx mechanism.");
    },
  },
  {
    name: "print outputs the repo global path and platform commands",
    run: () => {
      const result = invokeInstaller(["--print"]);
      assertSuccess(result, "--print should exit successfully.");
      assertOutputContains(result, globalPath, "--print should output the resolved global/ path.");
      assertOutputContains(result, `setx ${ENV_VAR}`, "--print should show the Windows command.");
      assertOutputContains(result, `export ${ENV_VAR}`, "--print should show the posix command.");
    },
  },
  {
    name: "dry-run does not change the environment and previews the set",
    run: () => {
      const result = invokeInstaller(["--dry-run"], { [ENV_VAR]: undefined });
      assertSuccess(result, "Dry-run should exit successfully.");
      assertOutputContains(result, `would set: ${ENV_VAR}=${globalPath}`, "Dry-run should preview the value.");
      assertOutputContains(result, "No environment variable was changed.", "Dry-run must state no-write outcome.");
    },
  },
  {
    name: "check passes when env var points at repo global",
    run: () => {
      const result = invokeInstaller(["--check"], { [ENV_VAR]: globalPath });
      assertSuccess(result, "--check should pass when OPENCODE_CONFIG_DIR matches repo global/.");
      assertOutputContains(result, "configured:", "--check should report configured status.");
    },
  },
  {
    name: "check fails when env var is unset",
    run: () => {
      const result = invokeInstaller(["--check"], { [ENV_VAR]: undefined });
      assertFailure(result, "--check should fail when OPENCODE_CONFIG_DIR is unset.");
      assertOutputContains(result, "not set", "--check should report the unset state.");
    },
  },
  {
    name: "check fails on mismatched env var value",
    run: () => {
      const result = invokeInstaller(["--check"], { [ENV_VAR]: path.join(root, "some-other-dir") });
      assertFailure(result, "--check should fail when OPENCODE_CONFIG_DIR points elsewhere.");
      assertOutputContains(result, "mismatch:", "--check should report the mismatch.");
      assertOutputContains(result, globalPath, "--check should show the expected repo global/ path.");
    },
  },
  {
    name: "installer source keeps config-dir pointing model guards",
    run: () => {
      const installerText = fs.readFileSync(installer, "utf8") as string;
      assert(installerText.includes(ENV_VAR), "Installer must reference OPENCODE_CONFIG_DIR.");
      assert(installerText.includes('"global"'), "Installer must target the global/ directory.");
      assert(installerText.includes("setx"), "Installer must use setx on Windows.");
      assert(!installerText.includes("collectDrift"), "Installer must not retain legacy copy/drift logic.");
    },
  },
  {
    name: "installer source marks provisioned config with machineOverride",
    run: () => {
      const installerText = fs.readFileSync(installer, "utf8") as string;
      assert(installerText.includes("machineOverride"), "Installer must mark the provisioned local config with the machineOverride field.");
      assert(/machineOverride:\s*true/.test(installerText), "Installer must write machineOverride: true into the provisioned local config.");
      const provisionMatch = installerText.match(/ensureLocalConfig[\s\S]{0,1500}/);
      assert(provisionMatch != null, "Installer must define ensureLocalConfig.");
      assert(provisionMatch[0].includes("machineOverride"), "ensureLocalConfig must set the machineOverride marker on the provisioned local config.");
    },
  },
  {
    name: "measuredValueLength adds env var name length and equals sign",
    run: () => {
      assert(measuredValueLength("/short/path") === "/short/path".length + ENV_VAR.length + 1, "measuredValueLength must add ENV_VAR length and 1 separator.");
      assert(SETX_SAFE_LIMIT === 900, "SETX_SAFE_LIMIT must be 900 to keep headroom under the 1024-char setx limit.");
      const longPath = "D:\\" + "a".repeat(SETX_SAFE_LIMIT);
      assert(measuredValueLength(longPath) > SETX_SAFE_LIMIT, "A long path must exceed the safety limit.");
      const shortPath = "D:\\" + "a".repeat(SETX_SAFE_LIMIT - 50);
      assert(measuredValueLength(shortPath) <= SETX_SAFE_LIMIT, "A short path must be under the safety limit.");
    },
  },
  {
    name: "installer guards long paths with the setx safety limit before invoking setx",
    run: () => {
      const installerText = fs.readFileSync(installer, "utf8") as string;
      assert(installerText.includes("measuredValueLength"), "runSet must call measuredValueLength before setx.");
      assert(installerText.includes("SETX_SAFE_LIMIT"), "runSet must compare against SETX_SAFE_LIMIT.");
      assert(/measuredValueLength\(globalDir\)\s*>\s*SETX_SAFE_LIMIT/.test(installerText) || /measured\s*>\s*SETX_SAFE_LIMIT/.test(installerText), "runSet must guard the setx call with the safety limit check.");
      assert(/process\.exit\(2\)/.test(installerText), "Guard must exit with code 2 on long-path detection.");
      assert(installerText.includes("--print"), "Long-path warning must point users at --print for manual setx.");
    },
  },
  {
    name: "isExportLineFor only matches well-formed quoted export lines for the given env var",
    run: () => {
      assert(isExportLineFor(`export ${ENV_VAR}="/some/path"`, ENV_VAR), "Must match a quoted export line for the env var.");
      assert(!isExportLineFor(`export ${ENV_VAR}=/some/path`, ENV_VAR), "Must reject unquoted export lines.");
      assert(!isExportLineFor(`export OTHER="/some/path"`, ENV_VAR), "Must reject lines for a different env var.");
      assert(!isExportLineFor(`# export ${ENV_VAR}="/some/path"`, ENV_VAR), "Must reject comment-prefixed lines.");
      assert(!isExportLineFor("", ENV_VAR), "Empty line is not a match.");
    },
  },
  {
    name: "appendExportLine appends once and stays idempotent on subsequent calls",
    run: () => {
      const dir = makeTempDir();
      try {
        const file = path.join(dir, ".bashrc");
        const envLine = buildExportLine("/tmp/foo");
        const first = appendExportLine(file, envLine, ENV_VAR);
        assert(first.appended === true, "First append must report appended=true.");
        const text = fs.readFileSync(file, "utf8");
        assert(text.includes(envLine), "File must contain the exported line after first append.");

        const second = appendExportLine(file, envLine, ENV_VAR);
        assert(second.appended === false, "Second append must report appended=false.");
        const occurrences = text.split(envLine).length - 1;
        assert(occurrences === 1, "Exactly one occurrence of the export line must remain after re-running.");

        const withOther = appendExportLine(file, `export OTHER="/tmp/bar"`, "OTHER");
        assert(withOther.appended === true, "Append of a different env var must succeed.");
        const textAfterOther = fs.readFileSync(file, "utf8");
        assert(textAfterOther.includes(envLine), "Original env var line must still be present.");
        assert(textAfterOther.includes("export OTHER="), "New env var line must be appended.");
      } finally {
        rmTempDir(dir);
      }
    },
  },
  {
    name: "appendExportLine creates the file when it does not exist",
    run: () => {
      const dir = makeTempDir();
      try {
        const file = path.join(dir, ".zshrc");
        const envLine = buildExportLine("/tmp/abc");
        const result = appendExportLine(file, envLine, ENV_VAR);
        assert(result.appended === true, "Append to a missing file must report appended=true.");
        const text = fs.readFileSync(file, "utf8");
        assert(text.trim() === envLine, "New file must contain only the export line.");
      } finally {
        rmTempDir(dir);
      }
    },
  },
  {
    name: "removeExportLine removes the matching export line and is idempotent",
    run: () => {
      const dir = makeTempDir();
      try {
        const file = path.join(dir, ".bashrc");
        const envLine = buildExportLine("/tmp/foo");
        appendExportLine(file, envLine, ENV_VAR);
        const first = removeExportLine(file, ENV_VAR);
        assert(first.removed === true, "First remove must report removed=true.");
        const text = fs.readFileSync(file, "utf8");
        assert(!text.includes(envLine), "File must not contain the export line after remove.");

        const second = removeExportLine(file, ENV_VAR);
        assert(second.removed === false, "Second remove must report removed=false.");
      } finally {
        rmTempDir(dir);
      }
    },
  },
  {
    name: "removeExportLine reports no-op when the file does not exist",
    run: () => {
      const dir = makeTempDir();
      try {
        const file = path.join(dir, "missing.sh");
        const result = removeExportLine(file, ENV_VAR);
        assert(result.removed === false, "Remove on missing file must report removed=false.");
      } finally {
        rmTempDir(dir);
      }
    },
  },
  {
    name: "--persist-script appends and is idempotent across subprocess invocations",
    run: () => {
      const dir = makeTempDir();
      try {
        const file = path.join(dir, ".bashrc");
        const first = invokeInstaller(["--persist-script", file]);
        assertSuccess(first, "--persist-script must exit 0 on first run.");
        const text1 = fs.readFileSync(file, "utf8");
        assert(text1.includes(`export ${ENV_VAR}="`), "File must contain the export line after first run.");

        const second = invokeInstaller(["--persist-script", file]);
        assertSuccess(second, "--persist-script must exit 0 on second run.");
        const text2 = fs.readFileSync(file, "utf8");
        const occurrences = text2.split(`export ${ENV_VAR}="`).length - 1;
        assert(occurrences === 1, "Exactly one export line must remain after two runs (idempotent).");
        assertOutputContains(second, "already contains", "Second run must report the line is already present.");
      } finally {
        rmTempDir(dir);
      }
    },
  },
  {
    name: "--unset-script removes the matching export line",
    run: () => {
      const dir = makeTempDir();
      try {
        const file = path.join(dir, ".bashrc");
        invokeInstaller(["--persist-script", file]);
        const unset = invokeInstaller(["--unset-script", file]);
        assertSuccess(unset, "--unset-script must exit 0.");
        const text = fs.readFileSync(file, "utf8");
        assert(!text.includes(`export ${ENV_VAR}="`), "File must no longer contain the export line.");
      } finally {
        rmTempDir(dir);
      }
    },
  },
  {
    name: "--persist-script without a file argument is rejected",
    run: () => {
      const result = invokeInstaller(["--persist-script"]);
      assertFailure(result, "--persist-script without a file must fail.");
    },
  },
  {
    name: "--unset-script on a missing file exits 0 without writing",
    run: () => {
      const dir = makeTempDir();
      try {
        const file = path.join(dir, "missing.sh");
        const result = invokeInstaller(["--unset-script", file]);
        assertSuccess(result, "--unset-script on a missing file must exit 0.");
      } finally {
        rmTempDir(dir);
      }
    },
  },
  {
    name: "help documents --persist-script and --unset-script",
    run: () => {
      const result = invokeInstaller(["--help"]);
      assertSuccess(result, "Help should exit successfully.");
      assertOutputContains(result, "--persist-script", "Help should document --persist-script.");
      assertOutputContains(result, "--unset-script", "Help should document --unset-script.");
      assertOutputContains(result, `${SETX_SAFE_LIMIT}`, "Help should mention the setx safety limit.");
    },
  },
];

let failed = 0;
for (const test of tests) {
  try {
    test.run();
    console.log(`PASS ${test.name}`);
  } catch (error) {
    failed++;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL ${test.name}`);
    console.error(message);
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log(`OK: install opencode global tests=${tests.length}`);
