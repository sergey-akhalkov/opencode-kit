#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createDefaultMcpEffects,
  mcpPackages,
  parseArgs,
  renderCommand,
  run,
  type McpEffects,
  type McpProcessResult,
  type ProbeResult,
} from "./install-code-intelligence-mcps.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const installer = path.join(root, "tools", "install-code-intelligence-mcps.ts");

type RecordedCall = { kind: "probe" | "run"; command: string; args: readonly string[] };

type FixtureState = {
  probes: Record<string, ProbeResult | ProbeResult[]>;
  runs?: Record<string, McpProcessResult | McpProcessResult[]>;
};

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function keyOf(command: string, args: readonly string[]): string {
  return `${command} ${args.join(" ")}`;
}

function takeResult<T>(store: Record<string, T | T[]> | undefined, command: string, args: readonly string[], fallback: T): T {
  if (store == null) {
    return fallback;
  }
  const key = keyOf(command, args);
  const value = store[key] ?? store[command];
  if (Array.isArray(value)) {
    return value.length > 0 ? value.shift() as T : fallback;
  }
  return value ?? fallback;
}

function createFixture(state: FixtureState): { effects: McpEffects; calls: RecordedCall[]; logs: string[]; errors: string[] } {
  const calls: RecordedCall[] = [];
  const logs: string[] = [];
  const errors: string[] = [];
  const effects: McpEffects = {
    probe(command, args) {
      calls.push({ kind: "probe", command, args: [...args] });
      return takeResult(state.probes, command, args, { available: false, reason: `${command} missing` });
    },
    run(command, args) {
      calls.push({ kind: "run", command, args: [...args] });
      if (/setx|Start-Process|msiexec|schtasks/i.test(command) || args.some((value) => /setx|Start-Process/i.test(value))) {
        throw new Error(`Blocked effect class: ${command}`);
      }
      return takeResult(state.runs, command, args, { status: 0, stdout: "", stderr: "" });
    },
    log(line) {
      logs.push(line);
    },
    error(line) {
      errors.push(line);
    },
  };
  return { effects, calls, logs, errors };
}

function invokeCli(args: string[]): { status: number | null; output: string } {
  const result = spawnSync(process.execPath, [installer, ...args], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env },
  });
  return { status: result.status, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

const tests = [
  {
    name: "both present: default mode installs nothing",
    run: () => {
      const fixture = createFixture({
        probes: {
          "serena --version": { available: true, version: "serena 1.0" },
          "codebase-memory-mcp --version": { available: true, version: "cbm 1.0" },
        },
      });
      const code = run({ mode: "install", dryRun: false }, fixture.effects);
      assert(code === 0, `Expected exit 0, got ${code}`);
      assert(fixture.calls.every((call) => call.kind === "probe"), "Present tools must not run a package manager.");
      assert(fixture.logs.some((line) => line.includes("configured: Serena: serena 1.0")), "Serena must be reported configured.");
      assert(fixture.logs.some((line) => line.includes("configured: Codebase Memory: cbm 1.0")), "Codebase Memory must be reported configured.");
    },
  },
  {
    name: "both missing: default installs each missing tool and re-probes before success",
    run: () => {
      const fixture = createFixture({
        probes: {
          "serena --version": [
            { available: false, reason: "serena missing" },
            { available: true, version: "serena 1.1" },
            { available: true, version: "serena 1.1" },
          ],
          "uv --version": { available: true, version: "uv 0.1" },
          "codebase-memory-mcp --version": [
            { available: false, reason: "cbm missing" },
            { available: true, version: "cbm 2.0" },
          ],
        },
        runs: {
          "uv tool install -p 3.13 serena-agent": { status: 0, stdout: "", stderr: "" },
          "serena init": { status: 0, stdout: "", stderr: "" },
          [`${mcpPackages[1].installCommand} install --global codebase-memory-mcp`]: { status: 0, stdout: "", stderr: "" },
        },
      });
      const code = run({ mode: "install", dryRun: false }, fixture.effects);
      assert(code === 0, `Expected exit 0, got ${code}\n${fixture.errors.join("\n")}`);
      const runs = fixture.calls.filter((call) => call.kind === "run").map((call) => `${call.command} ${call.args.join(" ")}`);
      assert(runs[0] === "uv tool install -p 3.13 serena-agent", `Install order must start with Serena, got ${JSON.stringify(runs)}`);
      assert(runs.includes(`${mcpPackages[1].installCommand} install --global codebase-memory-mcp`), "Both missing tools must be installed.");
      assert(fixture.logs.some((line) => line.includes("installed: Serena")), "Serena install must be reported.");
      assert(fixture.logs.some((line) => line.includes("installed: Codebase Memory")), "Codebase Memory install must be reported.");
    },
  },
  {
    name: "one MCP missing: default installs only that tool and re-probes",
    run: () => {
      const fixture = createFixture({
        probes: {
          "serena --version": [
            { available: false, reason: "serena missing" },
            { available: true, version: "serena 1.1" },
            { available: true, version: "serena 1.1" },
          ],
          "uv --version": { available: true, version: "uv 0.1" },
          "codebase-memory-mcp --version": { available: true, version: "cbm 1.0" },
        },
        runs: {
          "uv tool install -p 3.13 serena-agent": { status: 0, stdout: "", stderr: "" },
          "serena init": { status: 0, stdout: "", stderr: "" },
        },
      });
      const code = run({ mode: "install", dryRun: false }, fixture.effects);
      assert(code === 0, `Expected exit 0, got ${code}\n${fixture.errors.join("\n")}`);
      const runs = fixture.calls.filter((call) => call.kind === "run");
      assert(runs.length === 2, `Expected uv install plus serena init, got ${JSON.stringify(runs)}`);
      assert(runs[0].command === "uv" && runs[0].args.join(" ") === "tool install -p 3.13 serena-agent", "Missing Serena must use the documented uv installer.");
      assert(runs[1].command === "serena" && runs[1].args.join(" ") === "init", "Serena must be initialized after install.");
      assert(!runs.some((call) => call.command.includes("npm")), "Present Codebase Memory must not be installed.");
      const serenaProbes = fixture.calls.filter((call) => call.kind === "probe" && call.command === "serena");
      assert(serenaProbes.length >= 3, "Default success must re-probe Serena after install and init.");
      assert(fixture.logs.some((line) => line.includes("installed: Serena: serena 1.1")), "Installed Serena version must be reported.");
    },
  },
  {
    name: "partial Codebase Memory missing installs only npm package",
    run: () => {
      const fixture = createFixture({
        probes: {
          "serena --version": { available: true, version: "serena 1.0" },
          "codebase-memory-mcp --version": [
            { available: false, reason: "cbm missing" },
            { available: true, version: "cbm 2.0" },
          ],
        },
        runs: {
          [`${mcpPackages[1].installCommand} install --global codebase-memory-mcp`]: { status: 0, stdout: "", stderr: "" },
        },
      });
      const code = run({ mode: "install", dryRun: false }, fixture.effects);
      assert(code === 0, `Expected exit 0, got ${code}`);
      const runs = fixture.calls.filter((call) => call.kind === "run");
      assert(runs.length === 1, `Expected one npm install, got ${JSON.stringify(runs)}`);
      assert(runs[0].args.join(" ") === "install --global codebase-memory-mcp", "Missing Codebase Memory must use the documented npm install.");
      assert(!runs.some((call) => call.command === "uv" || call.command === "serena"), "Present Serena must not be installed or initialized.");
    },
  },
  {
    name: "failed probe in check mode reports each executable independently",
    run: () => {
      const fixture = createFixture({
        probes: {
          "serena --version": { available: false, reason: "serena probe failed" },
          "codebase-memory-mcp --version": { available: true, version: "cbm 1.0" },
        },
      });
      const code = run({ mode: "check", dryRun: false }, fixture.effects);
      assert(code === 1, `Check with a missing MCP must exit 1, got ${code}`);
      assert(fixture.calls.every((call) => call.kind === "probe"), "Check mode must not run a package manager.");
      assert(fixture.errors.some((line) => line.includes("missing: Serena: serena probe failed")), "Check must report Serena independently.");
      assert(fixture.logs.some((line) => line.includes("configured: Codebase Memory: cbm 1.0")), "Check must report the present MCP independently.");
    },
  },
  {
    name: "install failure stops later package-manager work",
    run: () => {
      const fixture = createFixture({
        probes: {
          "serena --version": { available: false, reason: "serena missing" },
          "uv --version": { available: true, version: "uv 0.1" },
          "codebase-memory-mcp --version": { available: false, reason: "cbm missing" },
        },
        runs: {
          "uv tool install -p 3.13 serena-agent": { status: 7, stdout: "", stderr: "uv failed" },
        },
      });
      let thrown: unknown;
      try {
        run({ mode: "install", dryRun: false }, fixture.effects);
      } catch (error) {
        thrown = error;
      }
      assert(thrown instanceof Error && thrown.message.includes("Serena installation failed"), `Install failure must stop with the original purpose.\n${thrown instanceof Error ? thrown.message : String(thrown ?? "")}`);
      const runs = fixture.calls.filter((call) => call.kind === "run");
      assert(runs.length === 1, "Later installs must not run after package-manager failure.");
      assert(!runs.some((call) => call.command.includes("npm")), "Codebase Memory must not install after Serena failure.");
    },
  },
  {
    name: "path-with-spaces argv stays unsplit through adapters",
    run: () => {
      const spaced = path.join("C:", "Program Files", "uv.exe");
      const calls: RecordedCall[] = [];
      const effects: McpEffects = {
        probe(command, args) {
          calls.push({ kind: "probe", command, args: [...args] });
          if (command === "serena") {
            return { available: false, reason: "serena missing" };
          }
          if (command === spaced) {
            return { available: true, version: "uv spaced" };
          }
          return { available: true, version: "cbm 1.0" };
        },
        run(command, args) {
          calls.push({ kind: "run", command, args: [...args] });
          return { status: 0, stdout: "", stderr: "" };
        },
        log() {},
        error() {},
      };
      const original = mcpPackages[0].installCommand;
      mcpPackages[0].installCommand = spaced;
      try {
        const serenaProbes: ProbeResult[] = [
          { available: false, reason: "serena missing" },
          { available: true, version: "serena 1.2" },
          { available: true, version: "serena 1.2" },
        ];
        effects.probe = (command, args) => {
          calls.push({ kind: "probe", command, args: [...args] });
          if (command === "serena") {
            return serenaProbes.shift() ?? { available: true, version: "serena 1.2" };
          }
          if (command === spaced) {
            assert(!command.split(" ").includes("Program") || command.includes("Program Files"), "Spaced path must remain one command token.");
            return { available: true, version: "uv spaced" };
          }
          return { available: true, version: "cbm 1.0" };
        };
        const code = run({ mode: "install", dryRun: false }, effects);
        assert(code === 0, `Expected exit 0, got ${code}`);
        const install = calls.find((call) => call.kind === "run" && call.command === spaced);
        assert(install != null, "Install must use the spaced executable path as one argv element.");
        assert(renderCommand(spaced, install?.args ?? []).includes(JSON.stringify(spaced)), "Rendered planned argv must quote the spaced path.");
      } finally {
        mcpPackages[0].installCommand = original;
      }
    },
  },
  {
    name: "invalid option fails before any probe or install",
    run: () => {
      let thrown: unknown;
      try {
        parseArgs(["--explode"]);
      } catch (error) {
        thrown = error;
      }
      assert(thrown instanceof Error && thrown.message.includes("Unknown option: --explode"), "Invalid option must be named.");
    },
  },
  {
    name: "--help is effect-free and exits 0",
    run: () => {
      const result = invokeCli(["--help"]);
      assert(result.status === 0, `--help must exit 0, got ${result.status}\n${result.output}`);
      assert(result.output.includes("--check"), "Help must describe --check.");
      assert(result.output.includes("--dry-run"), "Help must describe --dry-run.");
    },
  },
  {
    name: "--check missing MCP exits non-zero with zero package-manager effect",
    run: () => {
      const fixture = createFixture({
        probes: {
          "serena --version": { available: false, reason: "serena missing" },
          "codebase-memory-mcp --version": { available: false, reason: "cbm missing" },
        },
      });
      const code = run(parseArgs(["--check"]), fixture.effects);
      assert(code === 1, `Missing --check must exit 1, got ${code}`);
      assert(fixture.calls.every((call) => call.kind === "probe"), "--check must not run a package manager.");
      assert(fixture.errors.some((line) => line.includes("missing: Serena")), "--check must report Serena.");
      assert(fixture.errors.some((line) => line.includes("missing: Codebase Memory")), "--check must report Codebase Memory.");
    },
  },
  {
    name: "--dry-run prints planned argv and has zero install effect",
    run: () => {
      const fixture = createFixture({
        probes: {
          "serena --version": { available: false, reason: "serena missing" },
          "codebase-memory-mcp --version": { available: false, reason: "cbm missing" },
        },
      });
      const code = run(parseArgs(["--dry-run"]), fixture.effects);
      assert(code === 0, `--dry-run must exit 0, got ${code}`);
      assert(fixture.calls.every((call) => call.kind === "probe"), "--dry-run must not run a package manager.");
      assert(fixture.logs.some((line) => line.includes("would run: uv tool install -p 3.13 serena-agent")), "Dry-run must print Serena planned argv.");
      assert(fixture.logs.some((line) => line.includes("would run: serena init")), "Dry-run must print Serena init argv.");
      assert(fixture.logs.some((line) => line.includes(`would run: ${mcpPackages[1].installCommand} install --global codebase-memory-mcp`)), "Dry-run must print Codebase Memory planned argv.");
      assert(fixture.logs.some((line) => line.includes("Dry run complete. No package was installed or initialized.")), "Dry-run must state that nothing was installed.");
    },
  },
  {
    name: "default effects refuse setx and other blocked Windows mutation classes",
    run: () => {
      const effects = createDefaultMcpEffects();
      let thrown: unknown;
      try {
        effects.run("setx", ["OPENCODE_CONFIG_DIR", "C:\\tmp"]);
      } catch (error) {
        thrown = error;
      }
      assert(thrown instanceof Error && thrown.message.includes("Blocked effect class"), "Default effects must refuse setx.");
    },
  },
];

let failed = 0;
for (const test of tests) {
  try {
    test.run();
    console.log(`PASS ${test.name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${test.name}`);
    console.error(error instanceof Error ? error.message : String(error));
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log(`OK: install code intelligence mcps tests=${tests.length}`);
