#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolvePortableCommand, runPortableCommand } from "../global/bin/portable-process.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

type ProcessCheck = {
  name: string;
  run: () => void;
};

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "oc-portable-process-"));
}

function rmTempDir(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function terminateTestPid(pid: number): void {
  if (!pidAlive(pid)) return;
  if (process.platform === "win32") {
    spawnSync("taskkill.exe", ["/PID", String(pid), "/T", "/F"], { shell: false, stdio: "ignore", timeout: 10_000 });
    return;
  }
  try {
    process.kill(pid, "SIGKILL");
  } catch {
    // The proof-owned process is already terminal.
  }
}

function writeHungTreeProbe(dir: string): { pidFile: string; probe: string } {
  const pidFile = path.join(dir, "pids.json");
  const probe = path.join(dir, "hung-tree.mjs");
  fs.writeFileSync(probe, [
    'import { spawn } from "node:child_process";',
    'import fs from "node:fs";',
    'const child = spawn(process.execPath, ["-e", "setTimeout(() => {}, 60000)"], { stdio: "ignore" });',
    'fs.writeFileSync(process.argv[2], JSON.stringify({ child: child.pid, parent: process.pid }));',
    'setTimeout(() => {}, 60000);',
    '',
  ].join("\n"), "utf8");
  return { pidFile, probe };
}

function writeWindowsShimPair(dir: string): { binDir: string; argvLog: string; ps1Log: string } {
  const binDir = path.join(dir, "bin with spaces");
  fs.mkdirSync(binDir, { recursive: true });
  const argvLog = path.join(dir, "argv.json");
  const ps1Log = path.join(dir, "ps1.log");
  const echoArgv = path.join(dir, "echo-argv.mjs");
  fs.writeFileSync(echoArgv, "import fs from \"node:fs\";\nfs.writeFileSync(process.env.ARGV_LOG, JSON.stringify(process.argv.slice(2)));\n", "utf8");
  fs.writeFileSync(
    path.join(binDir, "openspec.cmd"),
    `@echo off\r\n"${process.execPath}" "${echoArgv}" %*\r\n`,
    "utf8",
  );
  fs.writeFileSync(
    path.join(binDir, "openspec.ps1"),
    `Set-Content -Path $env:PS1_LOG -Value "PS1_RAN"\r\n`,
    "utf8",
  );
  return { binDir, argvLog, ps1Log };
}

function isolatedWindowsEnv(binDir: string, extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    ...process.env,
    PATH: binDir,
    Path: binDir,
    PATHEXT: ".COM;.EXE;.BAT;.CMD;.VBS;.JS;.MSC",
    ARGV_LOG: extra.ARGV_LOG ?? "",
    PS1_LOG: extra.PS1_LOG ?? "",
    ...extra,
  };
}

const tests: ProcessCheck[] = [
  {
    name: "Windows resolver selects .cmd and never .ps1 or a shell string",
    run: () => {
      if (process.platform !== "win32") return;
      const dir = makeTempDir();
      try {
        const { binDir } = writeWindowsShimPair(dir);
        const resolution = resolvePortableCommand(
          ["openspec", "status"],
          isolatedWindowsEnv(binDir),
        );
        assert(resolution.ok, `Expected .cmd resolution to succeed.\n${resolution.ok ? "" : resolution.reason}`);
        if (!resolution.ok) return;
        assert(resolution.kind === "cmd", `Expected cmd kind, got ${resolution.kind}`);
        assert(resolution.selected.toLowerCase().endsWith("openspec.cmd"), `Selected ${resolution.selected}`);
        assert(!resolution.selected.toLowerCase().endsWith(".ps1"), "Resolver must not select a .ps1 shim.");
        assert(resolution.args[0] === "/d", "cmd wrapper must use /d.");
        assert(resolution.args[1] === "/c", "cmd wrapper must use /c.");
        assert(resolution.args[2] === "call", "cmd wrapper must use call with argv, not a joined shell string.");
        assert(!resolution.args.some((value) => value.includes(" && ") || value.includes(" | ")), "Resolved argv must not be a shell string.");
      } finally {
        rmTempDir(dir);
      }
    },
  },
  {
    name: "Windows prefers .cmd over blocked .ps1 and keeps exact argv including spaces",
    run: () => {
      if (process.platform !== "win32") return;
      const dir = makeTempDir();
      try {
        const { binDir, argvLog, ps1Log } = writeWindowsShimPair(dir);
        const spaced = "hello world";
        const result = runPortableCommand(dir, ["openspec", "status", spaced], {
          capture: true,
          env: isolatedWindowsEnv(binDir, { ARGV_LOG: argvLog, PS1_LOG: ps1Log }),
        });
        assert((result.status ?? 1) === 0, `Expected .cmd shim to exit 0.\nstatus=${result.status}\nstderr=${result.stderr}\nstdout=${result.stdout}\nerror=${result.error?.message ?? ""}`);
        assert(fs.existsSync(argvLog), "Selected Windows invocation must run the .cmd shim.");
        assert(!fs.existsSync(ps1Log), "Blocked .ps1 shim must not run.");
        const recorded = JSON.parse(fs.readFileSync(argvLog, "utf8")) as string[];
        assert(recorded[0] === "status", `Exact argv must start with status, got ${JSON.stringify(recorded)}`);
        assert(recorded[1] === spaced, `Spaced argument must remain one argv element, got ${JSON.stringify(recorded)}`);
      } finally {
        rmTempDir(dir);
      }
    },
  },
  {
    name: "Windows .cmd resolution accepts literal metacharacter argv without a shell string",
    run: () => {
      if (process.platform !== "win32") return;
      const dir = makeTempDir();
      try {
        const { binDir, argvLog, ps1Log } = writeWindowsShimPair(dir);
        const literal = "evil&echo";
        let thrown: unknown;
        let result: ReturnType<typeof runPortableCommand> | undefined;
        try {
          result = runPortableCommand(dir, ["openspec", literal], {
            capture: true,
            env: isolatedWindowsEnv(binDir, { ARGV_LOG: argvLog, PS1_LOG: ps1Log }),
          });
        } catch (error) {
          thrown = error;
        }
        assert(
          thrown == null,
          `Platform .cmd resolution must not reject argv through a shell string.\nerror=${thrown instanceof Error ? thrown.message : String(thrown ?? "")}`,
        );
        assert((result?.status ?? 1) === 0, `Expected .cmd shim to accept literal argv.\nstatus=${result?.status}\nstderr=${result?.stderr ?? ""}\nerror=${result?.error?.message ?? ""}`);
        assert(!fs.existsSync(ps1Log), "Metacharacter argv must not execute the .ps1 shim.");
        const recorded = JSON.parse(fs.readFileSync(argvLog, "utf8")) as string[];
        assert(recorded[0] === literal, `Literal argv must reach the .cmd child, got ${JSON.stringify(recorded)}`);
      } finally {
        rmTempDir(dir);
      }
    },
  },
  {
    name: "missing Windows executable fails before mutation with PATH-safe command identity",
    run: () => {
      if (process.platform !== "win32") return;
      const dir = makeTempDir();
      try {
        const binDir = path.join(dir, "empty bin");
        fs.mkdirSync(binDir, { recursive: true });
        const marker = path.join(dir, "must-not-exist.txt");
        const command = "missing-openspec-fixture";
        let thrown: unknown;
        let result: ReturnType<typeof runPortableCommand> | undefined;
        try {
          result = runPortableCommand(dir, [command, "--help"], {
            capture: true,
            env: isolatedWindowsEnv(binDir),
          });
        } catch (error) {
          thrown = error;
        }
        assert(thrown == null, `Missing command must return a result, not throw.\nerror=${thrown instanceof Error ? thrown.message : String(thrown ?? "")}`);
        assert((result?.status ?? 0) !== 0, "Missing command must exit non-zero.");
        const combined = `${result?.stdout ?? ""}${result?.stderr ?? ""}${result?.error?.message ?? ""}`;
        assert(combined.includes(command), "Missing-command diagnostic must name the command identity.");
        assert(
          combined.includes("Unable to resolve command"),
          "Missing command must use the structured resolver diagnostic, not a shell fallback.",
        );
        assert(
          !/is not recognized/i.test(combined),
          "Missing command must not fall back to a cmd.exe shell parse error.",
        );
        assert(
          !combined.includes(os.homedir()),
          "Missing-command diagnostic must not include the user home path.",
        );
        assert(!fs.existsSync(marker), "Missing command must not create side-effect files.");
      } finally {
        rmTempDir(dir);
      }
    },
  },
  {
    name: "direct Node argv remains unsplit on every platform",
    run: () => {
      const dir = makeTempDir();
      try {
        const probe = path.join(dir, "echo-argv.mjs");
        fs.writeFileSync(probe, "console.log(JSON.stringify(process.argv.slice(2)));\n", "utf8");
        const literal = "keep together";
        const result = runPortableCommand(dir, [process.execPath, probe, literal], { capture: true });
        assert((result.status ?? 1) === 0, `Direct Node must succeed.\nstderr=${result.stderr}`);
        assert(result.stdout.includes(JSON.stringify(literal)), "Direct Node must keep the spaced argument intact.");
      } finally {
        rmTempDir(dir);
      }
    },
  },
  {
    name: "bounded capture terminates the owned process tree and preserves timeout evidence",
    run: () => {
      const dir = makeTempDir();
      let pids: { child: number; parent: number } | null = null;
      try {
        const { pidFile, probe } = writeHungTreeProbe(dir);
        const result = runPortableCommand(dir, [process.execPath, probe, pidFile], { capture: true, timeoutMs: 750 });
        assert(result.timedOut === true, "Bounded command must report its timeout.");
        assert(result.cleanupState === "terminal", `Owned tree cleanup must be terminal, got ${String(result.cleanupState)}`);
        assert((result.error as NodeJS.ErrnoException | undefined)?.code === "ETIMEDOUT", "Timeout cause must retain ETIMEDOUT.");
        assert(fs.existsSync(pidFile), "Hung fixture must publish exact owned process ids.");
        pids = JSON.parse(fs.readFileSync(pidFile, "utf8")) as { child: number; parent: number };
        assert(!pidAlive(pids.parent), "Timed-out parent must be terminal before return.");
        assert(!pidAlive(pids.child), "Timed-out descendant must be terminal before return.");
      } finally {
        if (pids != null) {
          terminateTestPid(pids.child);
          terminateTestPid(pids.parent);
        }
        rmTempDir(dir);
      }
    },
  },
  {
    name: "failed tree attestation reports cleanup unknown",
    run: () => {
      if (process.platform !== "win32") return;
      const dir = makeTempDir();
      let pids: { child: number; parent: number } | null = null;
      try {
        const { pidFile, probe } = writeHungTreeProbe(dir);
        const result = runPortableCommand(dir, [process.execPath, probe, pidFile], {
          capture: true,
          env: { ...process.env, ComSpec: path.join(dir, "missing-system32", "cmd.exe") },
          timeoutMs: 750,
        });
        assert(
          result.timedOut === true,
          `Unknown cleanup fixture must still retain the timeout cause: ${JSON.stringify({ cleanupState: result.cleanupState, error: result.error?.message, signal: result.signal, status: result.status, stderr: result.stderr })}`,
        );
        assert(result.cleanupState === "unknown", `Failed tree attestation must be unknown, got ${String(result.cleanupState)}`);
        pids = fs.existsSync(pidFile) ? JSON.parse(fs.readFileSync(pidFile, "utf8")) as { child: number; parent: number } : null;
      } finally {
        if (pids != null) {
          terminateTestPid(pids.child);
          terminateTestPid(pids.parent);
        }
        rmTempDir(dir);
      }
    },
  },
  {
    name: "documented Windows CI package commands resolve to .cmd or Node without policy mutation",
    run: () => {
      if (process.platform !== "win32") return;
      const commands = [
        ["npm", "ci"],
        ["npm", "run", "validate:strict"],
        ["npm", "test"],
        ["npm", "run", "openspec:validate"],
        ["openspec", "validate", "--all"],
        [process.execPath, "tools/install-code-intelligence-mcps.ts", "--help"],
        [process.execPath, "tools/install-opencode-global.ts", "--help"],
      ];
      for (const argv of commands) {
        const resolution = resolvePortableCommand(argv);
        assert(resolution.ok, `Documented command must resolve: ${argv.join(" ")}\n${resolution.ok ? "" : resolution.reason}`);
        if (!resolution.ok) continue;
        assert(
          resolution.kind === "native" || resolution.selected.toLowerCase().endsWith(".cmd"),
          `Documented command must use .cmd or direct Node, got ${resolution.selected}`,
        );
        assert(!resolution.selected.toLowerCase().endsWith(".ps1"), `Documented command must not select .ps1: ${argv[0]}`);
      }
    },
  },
  {
    name: "POSIX keeps the provided executable and does not introduce cmd.exe",
    run: () => {
      if (process.platform === "win32") return;
      const dir = makeTempDir();
      try {
        const probe = path.join(dir, "echo-argv.mjs");
        fs.writeFileSync(probe, "console.log(JSON.stringify(process.argv.slice(2)));\n", "utf8");
        const result = runPortableCommand(dir, ["node", probe, "posix-ok"], {
          capture: true,
          env: { ...process.env, PATH: path.dirname(process.execPath) },
        });
        assert((result.status ?? 1) === 0, `POSIX node invocation must succeed.\nstderr=${result.stderr}\nerror=${result.error?.message ?? ""}`);
        assert(result.stdout.includes("\"posix-ok\""), "POSIX invocation must pass exact argv.");
        assert(
          !`${result.stdout}${result.stderr}`.toLowerCase().includes("cmd.exe"),
          "POSIX path must not introduce cmd.exe.",
        );
      } finally {
        rmTempDir(dir);
      }
    },
  },
];

void root;

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

console.log(`OK: portable process tests=${tests.length}`);
