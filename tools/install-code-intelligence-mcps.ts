#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Mode = "install" | "check";

type Options = {
  mode: Mode;
  dryRun: boolean;
};

type McpPackage = {
  name: string;
  command: string;
  versionArgs: string[];
  installCommand: string;
  installArgs: string[];
  initializeArgs?: string[];
  prerequisite?: {
    command: string;
    args: string[];
    guidance: string;
  };
};

type ProbeResult =
  | { available: true; version: string }
  | { available: false; reason: string };

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const packages: McpPackage[] = [
  {
    name: "Serena",
    command: "serena",
    versionArgs: ["--version"],
    installCommand: "uv",
    installArgs: ["tool", "install", "-p", "3.13", "serena-agent"],
    initializeArgs: ["init"],
    prerequisite: {
      command: "uv",
      args: ["--version"],
      guidance: "Install uv from https://docs.astral.sh/uv/getting-started/installation/ and retry.",
    },
  },
  {
    name: "Codebase Memory",
    command: "codebase-memory-mcp",
    versionArgs: ["--version"],
    installCommand: npmCommand,
    installArgs: ["install", "--global", "codebase-memory-mcp"],
  },
];

function printUsage(): void {
  console.log(`Usage:
  npm run install:mcps -- [options]

Install the Serena and Codebase Memory MCP executables used by the global
OpenCode config. Existing working installations are preserved and are not
upgraded automatically.

Options:
  (default)             Install missing MCP executables, then verify both.
  --check, --audit      Verify both executables without changing anything.
  --dry-run, --what-if  Show missing-package install commands without running them.
  --help, -h            Show this help.
`);
}

function parseArgs(args: string[]): Options {
  const options: Options = { mode: "install", dryRun: false };
  let explicitMode = false;

  for (const arg of args) {
    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }
    if (arg === "--check" || arg === "--audit") {
      if (explicitMode) {
        throw new Error("Conflicting installer modes: --check/--audit may be specified only once.");
      }
      explicitMode = true;
      options.mode = "check";
      continue;
    }
    if (arg === "--dry-run" || arg === "--what-if") {
      if (options.dryRun) {
        throw new Error("Conflicting installer modes: --dry-run/--what-if may be specified only once.");
      }
      options.dryRun = true;
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }

  if (options.mode === "check" && options.dryRun) {
    throw new Error("--dry-run cannot be combined with --check/--audit.");
  }
  return options;
}

function renderCommand(command: string, args: string[]): string {
  return [command, ...args].map((part) => (/\s/.test(part) ? JSON.stringify(part) : part)).join(" ");
}

function probe(command: string, args: string[]): ProbeResult {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.error) {
    const code = (result.error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return { available: false, reason: `${command} was not found on PATH` };
    }
    return { available: false, reason: `${command} could not start: ${result.error.message}` };
  }
  if (result.status !== 0) {
    const detail = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
    return {
      available: false,
      reason: `${renderCommand(command, args)} exited ${result.status}${detail ? `: ${detail}` : ""}`,
    };
  }
  const version = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim().split(/\r?\n/, 1)[0];
  return { available: true, version: version || `${command} available` };
}

function runRequired(command: string, args: string[], purpose: string): void {
  console.log(`running: ${renderCommand(command, args)}`);
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.error) {
    throw new Error(`${purpose} could not start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`${purpose} failed (exit ${result.status}).`);
  }
}

function installPackage(spec: McpPackage): ProbeResult {
  if (spec.prerequisite) {
    const prerequisite = probe(spec.prerequisite.command, spec.prerequisite.args);
    if (!prerequisite.available) {
      throw new Error(`${spec.name} prerequisite missing: ${prerequisite.reason}. ${spec.prerequisite.guidance}`);
    }
  }

  runRequired(spec.installCommand, spec.installArgs, `${spec.name} installation`);
  let installed = probe(spec.command, spec.versionArgs);
  if (!installed.available) {
    throw new Error(
      `${spec.name} was installed but is not usable: ${installed.reason}. Ensure the package-manager bin directory is on PATH, restart the shell, and run npm run install:mcps -- --check.`,
    );
  }

  if (spec.initializeArgs) {
    runRequired(spec.command, spec.initializeArgs, `${spec.name} initialization`);
    installed = probe(spec.command, spec.versionArgs);
  }
  return installed;
}

function run(options: Options): void {
  let failed = false;

  for (const spec of packages) {
    const current = probe(spec.command, spec.versionArgs);
    if (current.available) {
      console.log(`configured: ${spec.name}: ${current.version}`);
      continue;
    }

    if (options.mode === "check") {
      console.error(`missing: ${spec.name}: ${current.reason}`);
      failed = true;
      continue;
    }

    if (options.dryRun) {
      console.log(`missing: ${spec.name}: ${current.reason}`);
      console.log(`would run: ${renderCommand(spec.installCommand, spec.installArgs)}`);
      if (spec.initializeArgs) {
        console.log(`would run: ${renderCommand(spec.command, spec.initializeArgs)}`);
      }
      continue;
    }

    const installed = installPackage(spec);
    if (!installed.available) {
      console.error(`missing: ${spec.name}: ${installed.reason}`);
      failed = true;
      continue;
    }
    console.log(`installed: ${spec.name}: ${installed.version}`);
  }

  if (failed) {
    process.exitCode = 1;
    return;
  }
  if (options.dryRun) {
    console.log("Dry run complete. No package was installed or initialized.");
    return;
  }
  console.log("Serena and Codebase Memory are available. Restart OpenCode after global config activation.");
}

function main(): void {
  try {
    run(parseArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

const executedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (executedPath === fileURLToPath(import.meta.url)) {
  main();
}
