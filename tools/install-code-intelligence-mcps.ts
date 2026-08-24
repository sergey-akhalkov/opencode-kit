#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runPortableCommand } from "../global/bin/portable-process.ts";

export type Mode = "install" | "check";

export type Options = {
  mode: Mode;
  dryRun: boolean;
};

export type McpPackage = {
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

export type ProbeResult =
  | { available: true; version: string }
  | { available: false; reason: string };

export type McpProcessResult = {
  status: number | null;
  error?: Error;
  stdout: string;
  stderr: string;
};

export type McpEffects = {
  probe(command: string, args: readonly string[]): ProbeResult;
  run(command: string, args: readonly string[]): McpProcessResult;
  log(line: string): void;
  error(line: string): void;
};

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

export const mcpPackages: McpPackage[] = [
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

const blockedEffectPattern = /\b(setx|Start-Process|msiexec|schtasks|sc\.exe|net\.exe)\b/i;

export function printUsage(): void {
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

export function parseArgs(args: string[]): Options {
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

export function renderCommand(command: string, args: readonly string[]): string {
  return [command, ...args].map((part) => (/\s/.test(part) ? JSON.stringify(part) : part)).join(" ");
}

function mapProbeResult(command: string, args: readonly string[], result: McpProcessResult): ProbeResult {
  if (result.error) {
    const code = (result.error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return { available: false, reason: `${command} was not found on PATH` };
    }
    return { available: false, reason: `${command} could not start: ${result.error.message}` };
  }
  if (result.status !== 0) {
    const detail = `${result.stdout}${result.stderr}`.trim();
    return {
      available: false,
      reason: `${renderCommand(command, args)} exited ${result.status}${detail ? `: ${detail}` : ""}`,
    };
  }
  const version = `${result.stdout}${result.stderr}`.trim().split(/\r?\n/, 1)[0];
  return { available: true, version: version || `${command} available` };
}

export function createDefaultMcpEffects(): McpEffects {
  return {
    probe(command, args) {
      const result = runPortableCommand(process.cwd(), [command, ...args], { capture: true });
      return mapProbeResult(command, args, result);
    },
    run(command, args) {
      if (blockedEffectPattern.test(command) || args.some((value) => blockedEffectPattern.test(value))) {
        throw new Error(`Blocked effect class: refusing to invoke ${renderCommand(command, args)}`);
      }
      return runPortableCommand(process.cwd(), [command, ...args]);
    },
    log(line) {
      console.log(line);
    },
    error(line) {
      console.error(line);
    },
  };
}

function runRequired(effects: McpEffects, command: string, args: readonly string[], purpose: string): void {
  effects.log(`running: ${renderCommand(command, args)}`);
  const result = effects.run(command, args);
  if (result.error) {
    throw new Error(`${purpose} could not start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`${purpose} failed (exit ${result.status}).`);
  }
}

function installPackage(spec: McpPackage, effects: McpEffects): ProbeResult {
  if (spec.prerequisite) {
    const prerequisite = effects.probe(spec.prerequisite.command, spec.prerequisite.args);
    if (!prerequisite.available) {
      throw new Error(`${spec.name} prerequisite missing: ${prerequisite.reason}. ${spec.prerequisite.guidance}`);
    }
  }

  runRequired(effects, spec.installCommand, spec.installArgs, `${spec.name} installation`);
  let installed = effects.probe(spec.command, spec.versionArgs);
  if (!installed.available) {
    throw new Error(
      `${spec.name} was installed but is not usable: ${installed.reason}. Ensure the package-manager bin directory is on PATH, restart the shell, and run npm run install:mcps -- --check.`,
    );
  }

  if (spec.initializeArgs) {
    runRequired(effects, spec.command, spec.initializeArgs, `${spec.name} initialization`);
    installed = effects.probe(spec.command, spec.versionArgs);
  }
  return installed;
}

export function run(options: Options, effects: McpEffects = createDefaultMcpEffects()): number {
  let failed = false;

  for (const spec of mcpPackages) {
    const current = effects.probe(spec.command, spec.versionArgs);
    if (current.available) {
      effects.log(`configured: ${spec.name}: ${current.version}`);
      continue;
    }

    if (options.mode === "check") {
      effects.error(`missing: ${spec.name}: ${current.reason}`);
      failed = true;
      continue;
    }

    if (options.dryRun) {
      effects.log(`missing: ${spec.name}: ${current.reason}`);
      effects.log(`would run: ${renderCommand(spec.installCommand, spec.installArgs)}`);
      if (spec.initializeArgs) {
        effects.log(`would run: ${renderCommand(spec.command, spec.initializeArgs)}`);
      }
      continue;
    }

    const installed = installPackage(spec, effects);
    if (!installed.available) {
      effects.error(`missing: ${spec.name}: ${installed.reason}`);
      failed = true;
      continue;
    }
    effects.log(`installed: ${spec.name}: ${installed.version}`);
  }

  if (failed) {
    return 1;
  }
  if (options.dryRun) {
    effects.log("Dry run complete. No package was installed or initialized.");
    return 0;
  }
  effects.log("Serena and Codebase Memory are available. Restart OpenCode after global config activation.");
  return 0;
}

function main(): void {
  try {
    process.exitCode = run(parseArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

const executedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (executedPath === fileURLToPath(import.meta.url)) {
  main();
}
