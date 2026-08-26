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
  removeExportLine,
} from "./install-opencode-global.ts";
import { PORTABLE_WORKFLOW_RUNTIME_FILES } from "./runtime-surface-profile.ts";
import { runPortableCommand } from "../global/bin/portable-process.ts";
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

function copyConfigPolicyGraph(target: string): void {
  const validators = path.join(path.dirname(target), "validators");
  fs.mkdirSync(validators, { recursive: true });
  const policy = fs.readFileSync(path.join(root, "tools", "validators", "opencode-config.ts"), "utf8")
    .replace('from "jsonc-parser"', `from "${import.meta.resolve("jsonc-parser")}"`);
  fs.writeFileSync(path.join(validators, "opencode-config.ts"), policy, "utf8");
  fs.copyFileSync(path.join(root, "tools", "validators", "context.ts"), path.join(validators, "context.ts"));
  fs.copyFileSync(
    path.join(root, "tools", "runtime-surface-profile.ts"),
    path.join(path.dirname(target), "runtime-surface-profile.ts"),
  );
}

function writeCopiedInstaller(target: string): void {
  const installerText = fs.readFileSync(installer, "utf8");
  const portableText = installerText
    .replace('return process.platform === "win32";', "return false;");
  copyConfigPolicyGraph(target);
  fs.writeFileSync(target, portableText, "utf8");
}

type FakeProcessCall = { command: string; args: string[] };

function writeFakeWindowsInstaller(target: string, safeLimit = SETX_SAFE_LIMIT): void {
  const installerText = fs.readFileSync(installer, "utf8");
  const isolatedText = installerText
    .replace('import { spawnSync } from "node:child_process";', 'import { spawnSync } from "./fake-child-process.mjs";')
    .replace(`export const SETX_SAFE_LIMIT = ${SETX_SAFE_LIMIT};`, `export const SETX_SAFE_LIMIT = ${safeLimit};`)
    .replace('return process.platform === "win32";', "return true;");
  if (isolatedText.includes('from "node:child_process"') || !isolatedText.includes('from "./fake-child-process.mjs"')) {
    throw new Error("Refusing fake-Windows test setup because the real child-process import was not isolated.");
  }
  copyConfigPolicyGraph(target);
  fs.writeFileSync(target, isolatedText, "utf8");
  fs.writeFileSync(path.join(path.dirname(target), "fake-child-process.mjs"), `
import fs from "node:fs";
export function spawnSync(command, args) {
  const log = process.env.FAKE_PROCESS_LOG;
  if (log) fs.appendFileSync(log, JSON.stringify({ command, args }) + "\\n");
  return {
    status: Number(process.env.FAKE_PROCESS_STATUS ?? "0"),
    stdout: process.env.FAKE_PROCESS_STDOUT ?? "",
    stderr: process.env.FAKE_PROCESS_STDERR ?? "",
  };
}
`, "utf8");
}

function writeFailureInjectedInstaller(target: string, fakeWindows = false): void {
  if (fakeWindows) writeFakeWindowsInstaller(target);
  else writeCopiedInstaller(target);
  const isolated = fs.readFileSync(target, "utf8").replace('import fs from "node:fs";', 'import fs from "./fake-fs.mjs";');
  assert(isolated.includes('from "./fake-fs.mjs"'), "Failure-injection fixture must isolate the installer fs boundary.");
  fs.writeFileSync(target, isolated, "utf8");
  fs.writeFileSync(path.join(path.dirname(target), "fake-fs.mjs"), `import fs from "node:fs";
import path from "node:path";
let reads = 0, exists = 0;
const failure = process.env.FAKE_FS_FAILURE;
const profile = process.env.FAKE_FS_TARGET;
const same = (file) => profile && path.resolve(String(file)) === path.resolve(profile);
export default new Proxy(fs, { get(base, key) {
  if (key === "writeFileSync") return (file, ...args) => { if (failure === "write" && typeof file === "number") throw new Error("injected temp write failure"); return fs.writeFileSync(file, ...args); };
  if (key === "fsyncSync") return (...args) => { if (failure === "fsync") throw new Error("injected fsync failure"); return fs.fsyncSync(...args); };
  if (key === "renameSync") return (...args) => { if (failure === "rename") throw new Error("injected rename failure"); return fs.renameSync(...args); };
  if (key === "readFileSync") return (file, ...args) => { if (failure === "concurrent" && same(file) && ++reads === 2) fs.writeFileSync(file, Buffer.from(process.env.FAKE_FS_CONCURRENT_HEX ?? "", "hex")); return fs.readFileSync(file, ...args); };
  if (key === "existsSync") return (file) => { if (failure === "concurrent-appearance" && same(file) && ++exists === 3) fs.writeFileSync(file, Buffer.from(process.env.FAKE_FS_CONCURRENT_HEX ?? "", "hex")); return fs.existsSync(file); };
  const value = Reflect.get(base, key); return typeof value === "function" ? value.bind(base) : value;
}});
`, "utf8");
}

function replacementTemps(file: string): string[] {
  return fs.readdirSync(path.dirname(file)).filter((name) => name.startsWith(`.${path.basename(file)}.`) && name.endsWith(".tmp"));
}

const PRINCIPLES_PLACEHOLDER = "__OPENCODE_CONFIG_DIR__/principles-of-work.md";
const LOCAL_INSTRUCTIONS_PLACEHOLDER = "__OPENCODE_CONFIG_DIR__/opencode.local.instructions.md";
const LOCAL_INSTRUCTIONS_EXAMPLE = "# Machine-Local OpenCode Preferences\n\nFixture personal instructions example.\n";

function writeFixturePortableTools(fixtureGlobal: string): void {
  for (const name of PORTABLE_WORKFLOW_RUNTIME_FILES) {
    const target = path.join(fixtureGlobal, ...name.split("/"));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, `// fixture portable tool ${name}\n`, "utf8");
  }
  fs.writeFileSync(path.join(fixtureGlobal, "package.json"), '{\n  "private": true,\n  "type": "module"\n}\n', "utf8");
}

function writeFixtureRuntimeProfiles(repoDir: string): void {
  const profilesDir = path.join(repoDir, "profiles");
  fs.mkdirSync(profilesDir, { recursive: true });
  const core = {
    schemaVersion: 1,
    name: "core",
    description: "Fixture core profile.",
    configMode: "ask",
    agents: [],
    commands: [],
    directories: [],
    files: [
      "global/AGENTS.md",
      "global/opencode.json.template",
      "global/opencode.local.instructions.example.md",
      "global/principles-of-work.md",
    ],
    skills: [],
  };
  fs.writeFileSync(path.join(profilesDir, "core.json"), `${JSON.stringify(core, null, 2)}\n`);
  fs.writeFileSync(path.join(profilesDir, "all.json"), `${JSON.stringify({
    ...core,
    configMode: "all-compatibility",
    description: "Fixture all profile.",
    directories: ["global/bin", "global/extensions", "global/plugin", "global/plugins"],
    name: "all",
  }, null, 2)}\n`);
}

function writeFixtureGlobalSkeleton(fixtureGlobal: string, templateText = "{}\n"): void {
  fs.mkdirSync(path.join(fixtureGlobal, "skills"), { recursive: true });
  fs.mkdirSync(path.join(fixtureGlobal, "agents"), { recursive: true });
  fs.mkdirSync(path.join(fixtureGlobal, "plugin"), { recursive: true });
  fs.mkdirSync(path.join(fixtureGlobal, "plugins"), { recursive: true });
  fs.writeFileSync(path.join(fixtureGlobal, "AGENTS.md"), "# Fixture\n", "utf8");
  fs.writeFileSync(path.join(fixtureGlobal, "principles-of-work.md"), "# Fixture Principles\n", "utf8");
  fs.writeFileSync(path.join(fixtureGlobal, "opencode.json.template"), templateText, "utf8");
  fs.writeFileSync(path.join(fixtureGlobal, "opencode.local.instructions.example.md"), LOCAL_INSTRUCTIONS_EXAMPLE, "utf8");
  writeFixturePortableTools(fixtureGlobal);
  writeFixtureRuntimeProfiles(path.dirname(fixtureGlobal));
}

function expectedMaterializedLocalInstructionsPath(fixtureGlobal: string): string {
  return path.join(fixtureGlobal, "opencode.local.instructions.md").replaceAll("\\", "/");
}

function expectedMaterializedPrinciplesPath(fixtureGlobal: string): string {
  return path.join(fixtureGlobal, "principles-of-work.md").replaceAll("\\", "/");
}

function prepareCopiedInstaller(name: string, fakeWindows = false, safeLimit = SETX_SAFE_LIMIT): {
  copiedInstaller: string;
  dir: string;
  fixtureGlobal: string;
  log: string;
} {
  const dir = path.join(makeTempDir(), name);
  const toolsDir = path.join(dir, "tools");
  const fixtureGlobal = path.join(dir, "global");
  fs.mkdirSync(toolsDir, { recursive: true });
  writeFixtureGlobalSkeleton(fixtureGlobal);
  const copiedInstaller = path.join(toolsDir, "install-opencode-global.ts");
  if (fakeWindows) writeFakeWindowsInstaller(copiedInstaller, safeLimit);
  else writeCopiedInstaller(copiedInstaller);
  return { copiedInstaller, dir, fixtureGlobal, log: path.join(dir, "fake-process.log") };
}

function invokeCopiedInstaller(
  copiedInstaller: string,
  dir: string,
  args: string[],
  envOverride: Record<string, string | undefined> = {},
): ProcessResult {
  const env: Record<string, string | undefined> = { ...process.env, [ENV_VAR]: undefined, ...envOverride };
  for (const [key, value] of Object.entries(env)) if (value === undefined) delete env[key];
  const result = spawnSync(process.execPath, [copiedInstaller, ...args], { cwd: dir, encoding: "utf8", env: env as NodeJS.ProcessEnv });
  return { exitCode: result.status ?? 0, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

function readFakeProcessCalls(log: string): FakeProcessCall[] {
  if (!fs.existsSync(log)) return [];
  return fs.readFileSync(log, "utf8").trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as FakeProcessCall);
}

const tests: { name: string; run: () => void }[] = [
  {
    name: "installer materializes and checks a complete mission-capable all profile",
    run: () => {
      const { copiedInstaller, dir, fixtureGlobal } = prepareCopiedInstaller("materialize-all-profile");
      try {
        fs.writeFileSync(path.join(fixtureGlobal, "opencode.json.template"), `${JSON.stringify({
          $schema: "https://opencode.ai/config.json",
          instructions: [PRINCIPLES_PLACEHOLDER, LOCAL_INSTRUCTIONS_PLACEHOLDER],
          model: "openai/gpt-5.6-sol",
          permission: "allow",
          plugin: [
            "__OPENCODE_CONFIG_DIR__/extensions/opencode-pty-bridge.ts",
            ["__OPENCODE_CONFIG_DIR__/extensions/roadmap-mission-launcher.ts", { scriptRuntime: "__OPENCODE_SCRIPT_RUNTIME__" }],
            ["__OPENCODE_CONFIG_DIR__/extensions/session-completion-guard.ts", { certificateIssuers: ["roadmap-mission-session-executor"] }],
          ],
        }, null, 2)}\n`, "utf8");
        const install = invokeCopiedInstaller(copiedInstaller, dir, ["--profile", "all"]);
        assertSuccess(install, "Copied installer must materialize the all profile.");
        const generated = path.join(dir, "global", ".runtime-profiles", "all");
        const config = JSON.parse(fs.readFileSync(path.join(generated, "opencode.json"), "utf8")) as Record<string, unknown>;
        assert(config.model === "openai/gpt-5.6-sol", "Generated all profile must retain the pinned model.");
        assert(!JSON.stringify(config).includes("__OPENCODE_"), "Generated all profile must materialize every placeholder.");
        const check = invokeCopiedInstaller(copiedInstaller, dir, ["--check"], { [ENV_VAR]: generated });
        assertSuccess(check, "Installer check must accept the complete generated all profile.");
        const printed = invokeCopiedInstaller(copiedInstaller, dir, ["--print", "--profile", "all"]);
        assertSuccess(printed, "Explicit all-profile print must succeed.");
        assertOutputContains(printed, buildExportLine(generated), "Explicit all-profile print must use the generated target.");
        const profileFile = path.join(dir, ".profile");
        const persisted = invokeCopiedInstaller(copiedInstaller, dir, ["--persist-script", profileFile, "--profile", "all"]);
        assertSuccess(persisted, "Explicit all-profile persistence must succeed.");
        assert(fs.readFileSync(profileFile, "utf8") === `${buildExportLine(generated)}\n`, "Explicit all-profile persistence must target the generated root.");
        fs.rmSync(path.join(generated, "extensions", "roadmap-mission-launcher.ts"));
        const missing = invokeCopiedInstaller(copiedInstaller, dir, ["--check"], { [ENV_VAR]: generated });
        assertFailure(missing, "Installer check must reject a generated all profile with a missing launcher.");
        assertOutputContains(missing, "Missing generated all/extensions/roadmap-mission-launcher.ts", "Generated-profile check must identify the missing launcher.");
      } finally {
        rmTempDir(path.dirname(dir));
      }
    },
  },
  {
    name: "installer rejects missing portable global bin tools without exposing machine-local config contents",
    run: () => {
      const dir = makeTempDir();
      try {
        const toolsDir = path.join(dir, "tools");
        const fixtureGlobal = path.join(dir, "global");
        fs.mkdirSync(toolsDir, { recursive: true });
        writeFixtureGlobalSkeleton(fixtureGlobal);
        fs.rmSync(path.join(fixtureGlobal, "bin"), { recursive: true, force: true });
        fs.rmSync(path.join(fixtureGlobal, "package.json"), { force: true });
        const secret = "owner-private-config-value-must-not-leak";
        fs.writeFileSync(path.join(fixtureGlobal, "opencode.json"), `{ "provider": "${secret}" }\n`, "utf8");
        const copiedInstaller = path.join(toolsDir, "install-opencode-global.ts");
        writeCopiedInstaller(copiedInstaller);
        const captured = invokeCopiedInstaller(copiedInstaller, dir, ["--dry-run"]);
        assertFailure(captured, "Installer must fail before activation when portable tools are missing.");
        assertOutputContains(captured, "Missing global/bin", "Missing bin directory must be named.");
        assertOutputContains(captured, "Missing global/package.json", "Missing package.json must be named.");
        assertOutputContains(captured, "Missing global/bin/openspec-archive.ts", "Missing archive tool must be named.");
        assertOutputContains(captured, "Missing global/bin/openspec-operation-gate.ts", "Missing operation-gate tool must be named.");
        assertOutputContains(captured, "Missing global/bin/roadmap-mission.ts", "Missing roadmap-mission tool must be named.");
        assertOutputContains(captured, "Missing global/bin/roadmap-mission/contracts.ts", "Missing roadmap-mission contracts must be named.");
        assertOutputContains(captured, "Missing global/bin/roadmap-mission/preflight.ts", "Missing roadmap-mission preflight must be named.");
        assertOutputContains(captured, "Missing global/bin/validate-staged.ts", "Missing staged tool must be named.");
        assert(!captured.output.includes(secret), "Missing-tool diagnostics must not expose machine-local config contents.");
      } finally {
        rmTempDir(dir);
      }
    },
  },
  {
    name: "portable process delivers literal native argv including metacharacters without a second shell",
    run: () => {
      if (process.platform !== "win32") return;
      const dir = makeTempDir();
      try {
        const probe = path.join(dir, "echo-argv.mjs");
        fs.writeFileSync(probe, "console.log(JSON.stringify(process.argv.slice(2)));\n", "utf8");
        const literal = "evil&echo\nSHELL_RAN";
        for (const executable of [process.execPath, "node"]) {
          const result = runPortableCommand(dir, [executable, probe, literal], { capture: true });
          const combined = `${result.stdout}${result.stderr}`;
          assert((result.status ?? 1) === 0, `Direct native ${executable} must succeed.\nstderr: ${result.stderr}\nstdout: ${result.stdout}`);
          assert(
            result.stdout.includes(JSON.stringify(literal)),
            `Direct native ${executable} must pass the exact metacharacter/multiline argv to the child.`,
          );
          assert(
            !combined.includes("unsupported shell metacharacters"),
            `Direct native ${executable} must not apply shell-fallback rejection.`,
          );
          assert(
            !/^SHELL_RAN$/m.test(combined),
            `Direct native ${executable} must not launch a second shell command from the literal argv.`,
          );
        }
      } finally {
        rmTempDir(dir);
      }
    },
  },
  {
    name: "portable process runs resolved .cmd with literal metacharacter argv and no shell-string rejection",
    run: () => {
      if (process.platform !== "win32") return;
      const dir = makeTempDir();
      try {
        const marker = path.join(dir, "shell-ran.txt");
        const command = path.join(dir, "mark.cmd");
        fs.writeFileSync(command, `@echo off\r\necho ran>"${marker}"\r\n`, "utf8");
        let error: unknown;
        let result: ReturnType<typeof runPortableCommand> | undefined;
        try {
          result = runPortableCommand(dir, [command, "evil&echo"], { capture: true });
        } catch (caught) {
          error = caught;
        }
        assert(error == null, `Resolved .cmd must not use shell-string rejection.\nerror=${error instanceof Error ? error.message : String(error ?? "")}`);
        assert((result?.status ?? 1) === 0, `Resolved .cmd must run.\nstderr=${result?.stderr ?? ""}`);
        assert(fs.existsSync(marker), "Resolved .cmd child must execute with literal argv.");
      } finally {
        rmTempDir(dir);
      }
    },
  },
  {
    name: "installer materializes global instruction placeholders and provisions the portable example",
    run: () => {
      const dir = makeTempDir();
      try {
        const toolsDir = path.join(dir, "tools");
        const fixtureGlobal = path.join(dir, "global");
        fs.mkdirSync(toolsDir, { recursive: true });
        const templateBytes = fs.readFileSync(path.join(root, "global", "opencode.json.template"));
        writeFixtureGlobalSkeleton(fixtureGlobal, templateBytes.toString("utf8"));
        assert(templateBytes.toString("utf8").includes(PRINCIPLES_PLACEHOLDER), "Source template fixture must retain the canonical-principles placeholder.");
        assert(templateBytes.toString("utf8").includes(LOCAL_INSTRUCTIONS_PLACEHOLDER), "Source template fixture must retain the documented local-instructions placeholder.");

        const copiedInstaller = path.join(toolsDir, "install-opencode-global.ts");
        writeCopiedInstaller(copiedInstaller);
        const captured = invokeCopiedInstaller(copiedInstaller, dir, []);
        assertSuccess(captured, "Copied installer should provision a machine-local config without altering host environment state.");
        const generatedCore = path.join(dir, "global", ".runtime-profiles", "core");
        const local = path.join(generatedCore, "opencode.json");
        const localText = fs.readFileSync(local, "utf8");
        const expectedPrinciplesPath = expectedMaterializedPrinciplesPath(generatedCore);
        const expectedPath = expectedMaterializedLocalInstructionsPath(generatedCore);
        assert(localText.includes("principles-of-work.md"), "Generated core config must reference principles.");
        assert(!localText.includes("machineOverride"), "Provisioned config must not contain unsupported marker fields.");
        assert(localText.includes('"permission": "ask"'), "Fresh core config must be ask-level.");
        const localInstructions = path.join(fixtureGlobal, "opencode.local.instructions.md");
        assert(fs.existsSync(localInstructions), "Installer must provision gitignored local instructions from the portable example.");
        assert(fs.readFileSync(localInstructions, "utf8") === LOCAL_INSTRUCTIONS_EXAMPLE, "Provisioned local instructions must match the portable example bytes.");
        const temporaryArtifacts = replacementTemps(local);
        assert(temporaryArtifacts.length === 0, `Successful provisioning must not leave temporary artifacts: ${temporaryArtifacts.join(", ")}`);
      } finally {
        rmTempDir(dir);
      }
    },
  },
  {
    name: "installer preserves existing gitignored config bytes and reports missing instruction migration guidance",
    run: () => {
      const dir = makeTempDir();
      try {
        const toolsDir = path.join(dir, "tools");
        const fixtureGlobal = path.join(dir, "global");
        fs.mkdirSync(toolsDir, { recursive: true });
        writeFixtureGlobalSkeleton(fixtureGlobal);
        const local = path.join(fixtureGlobal, "opencode.json");
        const originalBytes = Buffer.from('{ "permission": "allow", "provider": "owner-local-value" }\n');
        fs.writeFileSync(local, originalBytes);
        const copiedInstaller = path.join(toolsDir, "install-opencode-global.ts");
        writeCopiedInstaller(copiedInstaller);
        const captured = invokeCopiedInstaller(copiedInstaller, dir, []);
        assertSuccess(captured, "Installer must succeed while preserving an existing supported local config.");
        assert(fs.readFileSync(local).equals(originalBytes), "Existing gitignored opencode.json must remain byte-for-byte preserved.");
        const principlesPath = path.join(fixtureGlobal, "principles-of-work.md");
        const guidancePath = path.join(fixtureGlobal, "opencode.local.instructions.md");
        assertOutputContains(captured, "preserved existing global/opencode.json", "Installer must report that existing local config was preserved.");
        assertOutputContains(captured, principlesPath, "Migration guidance must name the absolute canonical-principles path to add.");
        assertOutputContains(captured, "load the canonical working principles", "Migration guidance must identify the canonical-principles purpose.");
        assertOutputContains(captured, guidancePath, "Migration guidance must name the absolute local-instructions path to add.");
        assertOutputContains(captured, "Add that absolute path", "Migration guidance must be actionable without automatic rewrite.");
        assert(!captured.output.includes("owner-local-value"), "Preservation diagnostics must not expose machine-local config content.");
        assert(fs.existsSync(guidancePath), "Missing local instructions should still be provisioned from the portable example.");
        assert(replacementTemps(local).length === 0, "Preservation path must leave no config temp.");
      } finally {
        rmTempDir(dir);
      }
    },
  },
  {
    name: "installer set, check, and audit reject shared-policy root shapes and machineOverride safely",
    run: () => {
      const dir = makeTempDir();
      try {
        const toolsDir = path.join(dir, "tools");
        const fixtureGlobal = path.join(dir, "global");
        fs.mkdirSync(toolsDir, { recursive: true });
        writeFixtureGlobalSkeleton(fixtureGlobal, fs.readFileSync(path.join(root, "global", "opencode.json.template"), "utf8"));
        const local = path.join(fixtureGlobal, "opencode.json");
        const secretSentinel = "private-config-value-must-not-leak";
        const copiedInstaller = path.join(toolsDir, "install-opencode-global.ts");
        writeCopiedInstaller(copiedInstaller);

        for (const item of [
          { label: "scalar", content: `\"${secretSentinel}\"\n`, expected: "is invalid; fix or remove" },
          { label: "array", content: `[\"${secretSentinel}\"]\n`, expected: "is invalid; fix or remove" },
          { label: "null", content: "null\n", expected: "is invalid; fix or remove" },
          ...[true, false, null].map((value) => ({ label: `machineOverride=${String(value)}`, content: `{ \"machineOverride\": ${String(value)}, \"provider\": \"${secretSentinel}\" }\n`, expected: "unsupported field 'machineOverride'" })),
        ]) {
          const originalBytes = Buffer.from(item.content); fs.writeFileSync(local, originalBytes);
          for (const invocation of [{ args: [] as string[], envValue: undefined, label: "set" }, { args: ["--check"], envValue: fixtureGlobal, label: "check" }, { args: ["--audit"], envValue: fixtureGlobal, label: "audit" }]) {
            const captured = invokeCopiedInstaller(copiedInstaller, dir, invocation.args, { [ENV_VAR]: invocation.envValue });
            assertFailure(captured, `Installer ${invocation.label} must reject ${item.label}.`);
            assertOutputContains(captured, item.expected, `Installer ${invocation.label} should report the shared policy problem class.`);
            assert(!captured.output.includes(secretSentinel), `Installer ${invocation.label} diagnostics must not expose config content.`);
            assert(fs.readFileSync(local).equals(originalBytes), `Installer ${invocation.label} must preserve rejected config bytes.`);
            assert(replacementTemps(local).length === 0, `Rejected ${invocation.label} must leave no config temp.`);
          }
        }
      } finally {
        rmTempDir(dir);
      }
    },
  },
  {
    name: "buildExportLine emits exact POSIX single-quote encoding and rejects line-breaking values",
    run: () => {
      const value = "/tmp/a b$HOME`tick`\"double\"\\backslash'single";
      const expected = "export OPENCODE_CONFIG_DIR='/tmp/a b$HOME`tick`\"double\"\\backslash'\\''single'";
      assert(buildExportLine(value) === expected, `POSIX export encoding drifted.\nExpected: ${expected}\nActual: ${buildExportLine(value)}`);
      for (const unsafe of ["/tmp/nul\0value", "/tmp/cr\rvalue", "/tmp/lf\nvalue"]) {
        let error: unknown;
        try {
          buildExportLine(unsafe);
        } catch (caught) {
          error = caught;
        }
        assert(error instanceof Error && error.message.includes("must not contain NUL, CR, or LF"), "NUL/CR/LF export values must fail with the unsafe-value diagnostic.");
      }
    },
  },
  {
    name: "isExportLineFor recognizes supported standalone assignment forms only",
    run: () => {
      for (const line of [
        `export ${ENV_VAR}=/some/path`,
        `export ${ENV_VAR}='/some path'`,
        buildExportLine("/some/path/with'a-quote"),
        `export ${ENV_VAR}="/legacy path"`,
        `  export ${ENV_VAR}='/some path'   `,
      ]) assert(isExportLineFor(line, ENV_VAR), `Must recognize supported standalone export form: ${line}`);
      assert(!isExportLineFor(`export OTHER="/some/path"`, ENV_VAR), "Must reject lines for a different env var.");
      assert(!isExportLineFor(`# export ${ENV_VAR}="/some/path"`, ENV_VAR), "Must reject comment-prefixed lines.");
      assert(!isExportLineFor(`export ${ENV_VAR}='/some/path'; echo unsafe`, ENV_VAR), "Must reject a trailing shell command.");
      assert(!isExportLineFor(`export ${ENV_VAR}='/some/path' # unsafe`, ENV_VAR), "Must reject a trailing comment.");
      assert(!isExportLineFor("", ENV_VAR), "Empty line is not a match.");
    },
  },
  {
    name: "appendExportLine converges wrong and duplicate exports to one exact persisted final state",
    run: () => {
      const dir = makeTempDir();
      try {
        const file = path.join(dir, ".bashrc");
        const envLine = buildExportLine("/tmp/desired");
        fs.writeFileSync(file, [
          "# unrelated header",
          ` export ${ENV_VAR}=/tmp/wrong `,
          "alias keep='yes'",
          `export ${ENV_VAR}='/tmp/duplicate'`,
          buildExportLine("/tmp/duplicate'quote"),
          `export ${ENV_VAR}="/tmp/legacy duplicate"`,
          "",
        ].join("\n"));
        const first = appendExportLine(file, envLine, ENV_VAR);
        assert(first.appended === true, "Convergence must report a changed persisted state.");
        const expected = Buffer.from(`# unrelated header\n${envLine}\nalias keep='yes'\n`);
        const firstBytes = fs.readFileSync(file);
        assert(firstBytes.equals(expected), "First convergence must persist one desired export in place while preserving unrelated lines.");

        const second = appendExportLine(file, envLine, ENV_VAR);
        assert(second.appended === false, "Second convergence must report no persisted change.");
        const secondBytes = fs.readFileSync(file);
        assert(secondBytes.equals(firstBytes), "Second convergence must be byte-for-byte idempotent.");
        assert(secondBytes.toString("utf8").split(envLine).length - 1 === 1, "Exactly one desired export must remain.");
      } finally {
        rmTempDir(dir);
      }
    },
  },
  {
    name: "appendExportLine preserves CRLF bytes while converging supported exports",
    run: () => {
      const dir = makeTempDir();
      try {
        const file = path.join(dir, ".bashrc");
        const envLine = buildExportLine("/tmp/desired");
        const original = Buffer.from([
          "# unrelated header",
          `export ${ENV_VAR}='/tmp/wrong'`,
          "alias keep='yes'",
          "",
        ].join("\r\n"));
        fs.writeFileSync(file, original);
        if (process.platform !== "win32") fs.chmodSync(file, 0o640);
        const originalMode = fs.statSync(file).mode & 0o777;

        const result = appendExportLine(file, envLine, ENV_VAR);
        assert(result.appended === true, "CRLF convergence must report a changed persisted state.");
        const expected = Buffer.from(`# unrelated header\r\n${envLine}\r\nalias keep='yes'\r\n`);
        assert(fs.readFileSync(file).equals(expected), "Convergence must replace only supported export lines without rewriting unrelated CRLF bytes.");
        if (process.platform !== "win32") assert((fs.statSync(file).mode & 0o777) === originalMode, "Atomic replacement must preserve profile mode where supported.");
        assert(replacementTemps(file).length === 0, "Successful atomic replacement must not leave a temp file.");
      } finally {
        rmTempDir(dir);
      }
    },
  },
  {
    name: "removeExportLine preserves CRLF bytes while removing supported exports",
    run: () => {
      const dir = makeTempDir();
      try {
        const file = path.join(dir, ".bashrc");
        const original = Buffer.from([
          "# unrelated header",
          buildExportLine("/tmp/remove-me"),
          "alias keep='yes'",
          "",
        ].join("\r\n"));
        fs.writeFileSync(file, original);

        const result = removeExportLine(file, ENV_VAR);
        assert(result.removed === true, "CRLF removal must report that a supported export was removed.");
        const expected = Buffer.from("# unrelated header\r\nalias keep='yes'\r\n");
        assert(fs.readFileSync(file).equals(expected), "Removal must delete only supported export lines without rewriting unrelated CRLF bytes.");
      } finally {
        rmTempDir(dir);
      }
    },
  },
  {
    name: "ambiguous profile assignments fail closed before append or remove and preserve exact bytes",
    run: () => {
      const ambiguous = [
        `export ${ENV_VAR}='/tmp/path'; echo unsafe`,
        `export ${ENV_VAR}='/tmp/path' # unsafe`,
        `export ${ENV_VAR}='/tmp/unterminated`,
        `export ${ENV_VAR} = '/tmp/unsupported-spacing'`,
      ];
      for (const [caseIndex, line] of ambiguous.entries()) {
        for (const operation of ["append", "remove"] as const) {
          const dir = makeTempDir();
          try {
            const file = path.join(dir, `.profile-${caseIndex}-${operation}`);
            const original = Buffer.from(`# exact header\r\n${line}\r\nalias keep='yes'\r\n`);
            fs.writeFileSync(file, original);
            let error: unknown;
            try {
              if (operation === "append") appendExportLine(file, buildExportLine("/tmp/desired"), ENV_VAR);
              else removeExportLine(file, ENV_VAR);
            } catch (caught) {
              error = caught;
            }
            assert(error instanceof Error && error.message.includes("ambiguous OPENCODE_CONFIG_DIR assignment line"), `${operation} must reject ambiguous profile case ${caseIndex}.`);
            assert(fs.readFileSync(file).equals(original), `${operation} refusal must preserve every byte for ambiguous profile case ${caseIndex}.`);
          } finally {
            rmTempDir(dir);
          }
        }
      }
    },
  },
  {
    name: "ambiguous profile CLI failure is concise and preserves exact bytes",
    run: () => {
      const dir = makeTempDir();
      try {
        const file = path.join(dir, ".bashrc");
        const original = Buffer.from(`export ${ENV_VAR}='/tmp/path'; echo unsafe\n`);
        fs.writeFileSync(file, original);
        for (const args of [["--persist-script", file], ["--unset-script", file]]) {
          const result = invokeInstaller(args);
          assertFailure(result, `${args[0]} must fail for an ambiguous assignment.`);
          assertOutputContains(result, "Refusing to modify", "CLI should report the safe refusal reason.");
          assert(!result.output.includes("\n    at "), "CLI refusal must not expose an internal stack trace.");
          assert(fs.readFileSync(file).equals(original), `${args[0]} must preserve exact profile bytes on refusal.`);
        }
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
    name: "removeExportLine removes every matching export while preserving unrelated persisted lines",
    run: () => {
      const dir = makeTempDir();
      try {
        const file = path.join(dir, ".bashrc");
        fs.writeFileSync(file, [
          "# unrelated header",
          buildExportLine("/tmp/desired'quote"),
          "alias keep='yes'",
          `  export ${ENV_VAR}=/tmp/unquoted  `,
          `export ${ENV_VAR}='/tmp/single quoted'`,
          `export ${ENV_VAR}="/tmp/wrong"`,
          "",
        ].join("\n"));
        const first = removeExportLine(file, ENV_VAR);
        assert(first.removed === true, "First remove must report that matching exports were removed.");
        const firstBytes = fs.readFileSync(file);
        assert(firstBytes.equals(Buffer.from("# unrelated header\nalias keep='yes'\n")), "Remove must delete all matching exports and preserve unrelated lines exactly.");
        assert(!firstBytes.toString("utf8").includes(`export ${ENV_VAR}=`), "No matching export may remain after removal.");

        const second = removeExportLine(file, ENV_VAR);
        assert(second.removed === false, "Second remove must report removed=false.");
        assert(fs.readFileSync(file).equals(firstBytes), "Second remove must preserve the exact first-run bytes.");
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
    name: "--persist-script converges persisted wrong and duplicate values and is byte-idempotent",
    run: () => {
      const dir = makeTempDir();
      try {
        const file = path.join(dir, ".bashrc");
        fs.writeFileSync(file, [
          "# unrelated header",
          `export ${ENV_VAR}="/tmp/wrong"`,
          "alias keep='yes'",
          `export ${ENV_VAR}="/tmp/duplicate"`,
          "",
        ].join("\n"));
        const first = invokeInstaller(["--persist-script", file]);
        assertSuccess(first, "--persist-script must exit 0 on first run.");
        assertOutputContains(first, buildExportLine(globalPath), "First persist output must report the exact safe export line.");
        const firstBytes = fs.readFileSync(file);
        const expected = Buffer.from(`# unrelated header\n${buildExportLine(globalPath)}\nalias keep='yes'\n`);
        assert(firstBytes.equals(expected), "First subprocess run must persist one exact desired export and preserve unrelated lines.");

        const second = invokeInstaller(["--persist-script", file]);
        assertSuccess(second, "--persist-script must exit 0 on second run.");
        const secondBytes = fs.readFileSync(file);
        assert(secondBytes.equals(firstBytes), "Second subprocess run must preserve the exact first-run bytes.");
        assert(secondBytes.toString("utf8").split(`export ${ENV_VAR}=`).length - 1 === 1, "Exactly one export line must remain after two runs.");
        assertOutputContains(second, "already contains", "Second run must report the line is already present.");
      } finally {
        rmTempDir(dir);
      }
    },
  },
  {
    name: "copied POSIX print, dry-run, and persistence use the exact buildExportLine representation",
    run: () => {
      const fixture = prepareCopiedInstaller("posix-output");
      try {
        const generatedCore = path.join(fixture.dir, "global", ".runtime-profiles", "core");
        const expected = buildExportLine(generatedCore);
        const defaultResult = invokeCopiedInstaller(fixture.copiedInstaller, fixture.dir, []);
        assertSuccess(defaultResult, "Copied POSIX default mode should succeed without persistence.");
        for (const token of ["does not persist", expected, "--persist-script <file>"]) assertOutputContains(defaultResult, token, `POSIX default mode must explain print-only activation: ${token}`);
        const printed = invokeCopiedInstaller(fixture.copiedInstaller, fixture.dir, ["--print"]);
        assertSuccess(printed, "Copied POSIX --print should succeed.");
        assertOutputContains(printed, `command (posix):   ${buildExportLine(fixture.fixtureGlobal)}`, "--print must use the exact safe export line.");

        const dryRun = invokeCopiedInstaller(fixture.copiedInstaller, fixture.dir, ["--dry-run"]);
        assertSuccess(dryRun, "Copied POSIX --dry-run should succeed.");
        assertOutputContains(dryRun, `would print: ${expected}`, "--dry-run must use the exact safe export line.");

        const profile = path.join(fixture.dir, ".profile");
        const persisted = invokeCopiedInstaller(fixture.copiedInstaller, fixture.dir, ["--persist-script", profile]);
        assertSuccess(persisted, "Copied POSIX persistence should succeed.");
        const persistExpected = buildExportLine(fixture.fixtureGlobal);
        assertOutputContains(persisted, persistExpected, "Persistence output must use the exact safe export line.");
        assert(fs.readFileSync(profile).equals(Buffer.from(`${persistExpected}\n`)), "Persistence must write the exact safe export line bytes.");
      } finally {
        rmTempDir(path.dirname(fixture.dir));
      }
    },
  },
  {
    name: "isolated fake Windows process boundary asserts setx and reg argv and outcome propagation",
    run: () => {
      const fixture = prepareCopiedInstaller("fake-windows", true);
      try {
        const invokeFake = (args: string[], status: number, stdout = "", stderr = "") => invokeCopiedInstaller(
          fixture.copiedInstaller,
          fixture.dir,
          args,
          {
            FAKE_PROCESS_LOG: fixture.log,
            FAKE_PROCESS_STATUS: String(status),
            FAKE_PROCESS_STDOUT: stdout,
            FAKE_PROCESS_STDERR: stderr,
          },
        );

        const generatedCore = path.join(fixture.dir, "global", ".runtime-profiles", "core");
        const setSuccess = invokeFake([], 0);
        assertSuccess(setSuccess, "Fake Windows setx success should propagate exit 0.");
        let calls = readFakeProcessCalls(fixture.log);
        assert(JSON.stringify(calls.at(-1)) === JSON.stringify({ command: "setx", args: [ENV_VAR, generatedCore] }), "Windows set must invoke only setx with exact generated-core argv.");

        const setFailure = invokeFake([], 7, "", "fake setx failure");
        assertFailure(setFailure, "Fake Windows setx failure should propagate as installer failure.");
        assertOutputContains(setFailure, "setx failed (exit 7)", "setx failure should expose the process exit status.");
        assertOutputContains(setFailure, "fake setx failure", "setx failure should expose fake process diagnostics.");

        const unsetSuccess = invokeFake(["--unset"], 0);
        assertSuccess(unsetSuccess, "Fake Windows reg success should propagate exit 0.");
        calls = readFakeProcessCalls(fixture.log);
        assert(JSON.stringify(calls.at(-1)) === JSON.stringify({ command: "reg", args: ["delete", "HKCU\\Environment", "/F", "/V", ENV_VAR] }), "Windows unset must invoke only reg delete with exact argv.");

        const notFound = invokeFake(["--unset"], 1, "ERROR: The system was unable to find the specified registry value.");
        assertSuccess(notFound, "Registry not-found should be an idempotent unset success.");
        assertOutputContains(notFound, `${ENV_VAR} was not set`, "Registry not-found should report the no-op state.");

        const regFailure = invokeFake(["--unset"], 5, "", "fake access denied");
        assertFailure(regFailure, "Other registry failures must propagate as installer failures.");
        assertOutputContains(regFailure, "reg delete failed (exit 5)", "Registry failure should expose the process exit status.");
        assertOutputContains(regFailure, "fake access denied", "Registry failure should expose fake process diagnostics.");
      } finally {
        rmTempDir(path.dirname(fixture.dir));
      }
    },
  },
  {
    name: "isolated fake Windows set path refuses values beyond the safety limit without calling setx",
    run: () => {
      const fixture = prepareCopiedInstaller("fake-windows-limit", true, 1);
      try {
        const result = invokeCopiedInstaller(fixture.copiedInstaller, fixture.dir, [], {
          FAKE_PROCESS_LOG: fixture.log,
          FAKE_PROCESS_STATUS: "0",
        });
        assert(result.exitCode === 2, "Over-limit fake Windows set must exit 2.");
        assertOutputContains(result, "safety limit 1", "Over-limit diagnostic should report the enforced limit.");
        for (const token of ["shorter path", "--check", "Do not run setx manually", "--print is preview-only", "not a safe recovery path"]) assertOutputContains(result, token, `Over-limit guidance must fail safely: ${token}`);
        assert(readFakeProcessCalls(fixture.log).length === 0, "Over-limit set must not invoke fake or real setx.");
      } finally {
        rmTempDir(path.dirname(fixture.dir));
      }
    },
  },
  {
    name: "conflicting repeated and alias installer modes fail before every side effect boundary",
    run: () => {
      const fixture = prepareCopiedInstaller("mode-conflicts", true);
      try {
        const profile = path.join(fixture.dir, ".profile");
        const local = path.join(fixture.fixtureGlobal, "opencode.json");
        const profileBytes = Buffer.from("# profile owner bytes\r\n");
        const localBytes = Buffer.from("{ \"provider\": \"local-owner\" }\n");
        fs.writeFileSync(profile, profileBytes); fs.writeFileSync(local, localBytes);
        for (const args of [["--check", "--unset"], ["--check", "--audit"], ["--print", "--print"], ["--unset", "--audit"], ["--persist-script", profile, "--unset-script", profile], [`--persist-script=${profile}`, `--persist-script=${profile}`]]) {
          const result = invokeCopiedInstaller(fixture.copiedInstaller, fixture.dir, args, { FAKE_PROCESS_LOG: fixture.log });
          assertFailure(result, `Mode conflict must fail: ${args.join(" ")}`);
          assertOutputContains(result, "Conflicting installer modes", "Mode conflict must be rejected during argument parsing.");
          assert(!result.output.includes("\n    at "), "Mode conflict diagnostic must not expose a stack.");
          assert(readFakeProcessCalls(fixture.log).length === 0, "Mode conflicts must not invoke fake setx/reg.");
          assert(fs.readFileSync(profile).equals(profileBytes) && fs.readFileSync(local).equals(localBytes), "Mode conflicts must preserve profile and config bytes.");
          assert(replacementTemps(profile).length === 0 && replacementTemps(local).length === 0, "Mode conflicts must leave no replacement temp.");
        }
      } finally { rmTempDir(path.dirname(fixture.dir)); }
    },
  },
  {
    name: "invalid UTF-8 profiles fail direct and CLI append/remove without byte or temp mutation",
    run: () => {
      const dir = makeTempDir();
      try {
        const profile = path.join(dir, ".profile");
        const invalid = Buffer.from([0x23, 0x20, 0x6f, 0x77, 0x6e, 0x65, 0x72, 0x0a, 0xff, 0xfe]);
        for (const operation of ["append", "remove"] as const) {
          fs.writeFileSync(profile, invalid); let error: unknown;
          try { operation === "append" ? appendExportLine(profile, buildExportLine("/tmp/desired"), ENV_VAR) : removeExportLine(profile, ENV_VAR); } catch (caught) { error = caught; }
          assert(error instanceof Error && error.message.includes("not valid UTF-8"), `Direct ${operation} must reject invalid UTF-8 concisely.`);
          assert(fs.readFileSync(profile).equals(invalid) && replacementTemps(profile).length === 0, `Direct ${operation} must preserve bytes and leave no temp.`);
        }
        for (const flag of ["--persist-script", "--unset-script"]) {
          fs.writeFileSync(profile, invalid);
          const result = invokeInstaller([flag, profile]);
          assertFailure(result, `${flag} must reject invalid UTF-8.`); assertOutputContains(result, "not valid UTF-8", `${flag} must report the safe failure class.`);
          assert(!result.output.includes("\n    at "), `${flag} diagnostic must not expose a stack.`);
          assert(fs.readFileSync(profile).equals(invalid) && replacementTemps(profile).length === 0, `${flag} must preserve exact bytes and leave no temp.`);
        }
      } finally { rmTempDir(dir); }
    },
  },
  {
    name: "template preflight and concurrent local-config appearance preserve state before process activation",
    run: () => {
      const fixture = prepareCopiedInstaller("template-preflight", true);
      try {
        const template = path.join(fixture.fixtureGlobal, "opencode.json.template");
        const local = path.join(fixture.fixtureGlobal, "opencode.json");
        const secret = "private-template-value-must-not-leak";
        const variants = [
          { label: "invalid UTF-8", bytes: Buffer.from([0xff, 0xfe]), diagnostic: "template is not valid UTF-8" },
          { label: "malformed JSONC", bytes: Buffer.from(`{ \"provider\": \"${secret}\",`), diagnostic: "template is invalid" },
          ...[["scalar", `\"${secret}\"`], ["array", `[\"${secret}\"]`], ["null", "null"]].map(([label, text]) => ({ label, bytes: Buffer.from(text), diagnostic: "template is invalid" })),
          ...[true, false, null].map((value) => ({ label: `machineOverride=${String(value)}`, bytes: Buffer.from(`{ \"machineOverride\": ${String(value)}, \"provider\": \"${secret}\" }`), diagnostic: "unsupported field 'machineOverride'" })),
        ];
        for (const item of variants) {
          fs.rmSync(local, { force: true }); fs.rmSync(fixture.log, { force: true }); fs.writeFileSync(template, item.bytes);
          const result = invokeCopiedInstaller(fixture.copiedInstaller, fixture.dir, [], { FAKE_PROCESS_LOG: fixture.log });
          assertFailure(result, `Invalid ${item.label} template must fail.`); assertOutputContains(result, item.diagnostic, `Invalid ${item.label} template must report its problem class.`);
          assert(!result.output.includes(secret) && !result.output.includes("\n    at "), `Invalid ${item.label} diagnostics must be privacy-safe and concise.`);
          assert(fs.readFileSync(template).equals(item.bytes) && !fs.existsSync(local), `Invalid ${item.label} template must preserve source bytes and not create local config.`);
          assert(replacementTemps(local).length === 0 && readFakeProcessCalls(fixture.log).length === 0, `Invalid ${item.label} template must leave no temp or process call.`);
        }
        fs.writeFileSync(template, "{}\n"); fs.rmSync(local, { force: true }); fs.rmSync(fixture.log, { force: true });
        const valid = invokeCopiedInstaller(fixture.copiedInstaller, fixture.dir, [], { FAKE_PROCESS_LOG: fixture.log, FAKE_PROCESS_STATUS: "0" });
        assertSuccess(valid, "A valid source template must allow a fresh generated-core install.");
        assert(!fs.existsSync(local), "Fresh core install must not create source global/opencode.json.");
      } finally { rmTempDir(path.dirname(fixture.dir)); }
    },
  },
  {
    name: "profile replacement rejects unsafe targets and preserves preimages across injected atomic failures",
    run: () => {
      const fixture = prepareCopiedInstaller("atomic-profile-failures");
      writeFailureInjectedInstaller(fixture.copiedInstaller);
      try {
        const directoryTarget = path.join(fixture.dir, "directory-profile");
        const symlinkDestination = path.join(fixture.dir, "symlink-destination");
        const symlinkTarget = path.join(fixture.dir, "symlink-profile");
        fs.mkdirSync(directoryTarget); fs.mkdirSync(symlinkDestination);
        fs.symlinkSync(symlinkDestination, symlinkTarget, process.platform === "win32" ? "junction" : "dir");
        for (const [target, diagnostic] of [[symlinkTarget, "symbolic link"], [directoryTarget, "not a regular file"]]) {
          for (const operation of ["append", "remove"] as const) {
            let error: unknown;
            try {
              if (operation === "append") appendExportLine(target, buildExportLine("/tmp/desired"), ENV_VAR);
              else removeExportLine(target, ENV_VAR);
            } catch (caught) { error = caught; }
            assert(error instanceof Error && error.message.includes(diagnostic), `${operation} must reject ${diagnostic} targets before mutation.`);
            assert(target === symlinkTarget ? fs.lstatSync(target).isSymbolicLink() : fs.statSync(target).isDirectory(), `${operation} refusal must preserve the original unsafe target.`);
            assert(replacementTemps(target).length === 0, `${operation} ${diagnostic} refusal must leave no temp file.`);
          }
        }

        const profile = path.join(fixture.dir, ".profile");
        const original = Buffer.from(`# original\r\nexport ${ENV_VAR}='/tmp/old'\r\n`);
        for (const failure of ["write", "fsync", "rename"]) {
          fs.writeFileSync(profile, original);
          const result = invokeCopiedInstaller(fixture.copiedInstaller, fixture.dir, ["--persist-script", profile], { FAKE_FS_FAILURE: failure, FAKE_FS_TARGET: profile });
          assertFailure(result, `Injected ${failure} must fail profile persistence.`);
          assertOutputContains(result, `injected ${failure === "write" ? "temp write" : failure} failure`, `Injected ${failure} diagnostic must be concise.`);
          assert(!result.output.includes("\n    at "), `Injected ${failure} failure must not expose a stack.`);
          assert(fs.readFileSync(profile).equals(original), `Injected ${failure} must preserve original bytes.`);
          assert(replacementTemps(profile).length === 0, `Injected ${failure} must clean the same-directory temp file.`);
        }

        const concurrent = Buffer.from("# concurrent owner bytes\r\nalias keep='yes'\r\n");
        fs.writeFileSync(profile, original);
        const result = invokeCopiedInstaller(fixture.copiedInstaller, fixture.dir, ["--persist-script", profile], { FAKE_FS_FAILURE: "concurrent", FAKE_FS_TARGET: profile, FAKE_FS_CONCURRENT_HEX: concurrent.toString("hex") });
        assertFailure(result, "Concurrent preimage drift must fail profile persistence.");
        assertOutputContains(result, "concurrent change detected", "Concurrent drift diagnostic must identify the safe refusal.");
        assert(!result.output.includes("\n    at "), "Concurrent drift failure must not expose a stack.");
        assert(fs.readFileSync(profile).equals(concurrent), "Concurrent owner bytes must not be overwritten.");
        assert(replacementTemps(profile).length === 0, "Concurrent drift refusal must clean the same-directory temp file.");
      } finally {
        rmTempDir(path.dirname(fixture.dir));
      }
    },
  },
  {
    name: "--unset-script removes all matching exports and preserves unrelated lines",
    run: () => {
      const dir = makeTempDir();
      try {
        const file = path.join(dir, ".bashrc");
        fs.writeFileSync(file, [
          "# unrelated header",
          buildExportLine(globalPath),
          "alias keep='yes'",
          `export ${ENV_VAR}="/tmp/wrong"`,
          "",
        ].join("\n"));
        const unset = invokeInstaller(["--unset-script", file]);
        assertSuccess(unset, "--unset-script must exit 0.");
        const bytes = fs.readFileSync(file);
        assert(bytes.equals(Buffer.from("# unrelated header\nalias keep='yes'\n")), "--unset-script must remove every matching export and preserve unrelated lines.");
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
    name: "explicit profile dry-run plans core and all without changing the existing install",
    run: () => {
      const machineConfig = path.join(root, "global", "opencode.json");
      const before = fs.existsSync(machineConfig) ? fs.readFileSync(machineConfig) : null;
      const generatedHome = path.join(root, "global", ".runtime-profiles");
      const generatedBefore = fs.existsSync(generatedHome) ? fs.readdirSync(generatedHome).sort() : [];
      const core = invokeInstaller(["--dry-run", "--profile", "core"]);
      const all = invokeInstaller(["--dry-run", "--profile", "all"]);
      const allPreview = invokeInstaller(["--preview-profile", "--profile", "all"], { [ENV_VAR]: globalPath });
      const preview = invokeInstaller(["--plan-migration", "--profile", "core"], { [ENV_VAR]: globalPath });
      const existing = invokeInstaller(["--dry-run"], { [ENV_VAR]: globalPath });
      const fresh = invokeInstaller(["--dry-run"], { [ENV_VAR]: undefined });
      assertSuccess(core, "Explicit core dry-run must succeed.");
      assertSuccess(all, "Explicit all dry-run must succeed.");
      assertSuccess(allPreview, "Explicit all profile preview must succeed.");
      assertSuccess(preview, "Migration preview must succeed.");
      assertSuccess(existing, "Existing-install dry-run must succeed.");
      assertSuccess(fresh, "Fresh-install dry-run must succeed.");
      assertOutputContains(core, "would materialize profile core", "Core dry-run must plan generated core.");
      assertOutputContains(all, "would materialize profile all", "All dry-run must plan generated all.");
      assertOutputContains(allPreview, "proposed profile: all", "All preview must select the requested profile.");
      assertOutputContains(preview, "No file or environment value was changed.", "Migration preview must remain effect-free.");
      assertOutputContains(existing, "keeping existing:", "Existing kit install must stay on the current path.");
      assertOutputContains(fresh, "would materialize profile core", "Fresh install must default to generated core.");
      const after = fs.existsSync(machineConfig) ? fs.readFileSync(machineConfig) : null;
      assert(
        (before == null && after == null) || (before != null && after != null && before.equals(after)),
        "Existing machine config must stay unchanged.",
      );
      const generatedAfter = fs.existsSync(generatedHome) ? fs.readdirSync(generatedHome).sort() : [];
      assert(JSON.stringify(generatedAfter) === JSON.stringify(generatedBefore), "Dry-run must not create generated roots.");
    },
  },
  {
    name: "profile help preview check and plan are effect-free for an unprofiled install",
    run: () => {
      const watched = [
        path.join(root, "global", "AGENTS.md"),
        path.join(root, "global", "opencode.json"),
        path.join(root, "global", "opencode.json.template"),
        path.join(root, "profiles", "all.json"),
        path.join(root, "profiles", "core.json"),
      ];
      const snapshot = Object.fromEntries(watched.map((file) => [
        file,
        fs.existsSync(file) ? fs.readFileSync(file) : null,
      ]));
      const envBefore = process.env[ENV_VAR];
      const generatedHome = path.join(root, "global", ".runtime-profiles");
      const generatedBefore = fs.existsSync(generatedHome) ? fs.readdirSync(generatedHome).sort() : [];
      const envOverride = { [ENV_VAR]: globalPath };
      const help = invokeInstaller(["--help"], envOverride);
      const preview = invokeInstaller(["--preview-profile"], envOverride);
      const plan = invokeInstaller(["--plan-migration"], envOverride);
      const check = invokeInstaller(["--check"], envOverride);
      assertSuccess(help, "--help must exit 0.");
      assertSuccess(preview, "--preview-profile must exit 0.");
      assertSuccess(plan, "--plan-migration must exit 0.");
      assertSuccess(check, "--check of the current unprofiled global dir must exit 0.");
      for (const token of ["--preview-profile", "--plan-migration", "--check", "never change config, environment, or files"]) {
        assertOutputContains(help, token, `Help must document effect-free ${token}.`);
      }
      assertOutputContains(preview, "current profile: unprofiled", "Preview must report the existing unprofiled install.");
      assertOutputContains(preview, "proposed profile: core", "Preview must propose core.");
      assertOutputContains(preview, "No file or environment value was changed.", "Preview must declare zero mutation.");
      assertOutputContains(plan, "current profile: unprofiled", "Plan must report the existing unprofiled install.");
      assertOutputContains(plan, "removals (", "Plan must report removals from the full catalog.");
      assertOutputContains(check, "current profile: unprofiled", "Check must report the existing unprofiled install.");
      assert(process.env[ENV_VAR] === envBefore, "Profile inspection must not change the parent environment.");
      for (const file of watched) {
        const before = snapshot[file];
        const after = fs.existsSync(file) ? fs.readFileSync(file) : null;
        assert(
          (before == null && after == null) || (before != null && after != null && before.equals(after)),
          `Profile inspection must not change ${file}.`,
        );
      }
      const generatedAfter = fs.existsSync(generatedHome) ? fs.readdirSync(generatedHome).sort() : [];
      assert(JSON.stringify(generatedAfter) === JSON.stringify(generatedBefore), "Profile inspection must not create generated profile roots.");
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
