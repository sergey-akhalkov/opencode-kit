import { spawnSync } from "node:child_process";

export type PortableCommandResult = {
  status: number | null;
  signal: NodeJS.Signals | null;
  error?: Error;
  stdout: string;
  stderr: string;
};

export type PortableCommandOptions = {
  capture?: boolean;
  env?: NodeJS.ProcessEnv;
  input?: string;
};

function quoteWindowsArg(value: string): string {
  if (/[\r\n"&|<>^%!]/.test(value)) {
    throw new Error(`Windows command argument contains unsupported shell metacharacters: ${JSON.stringify(value)}`);
  }
  return /^[A-Za-z0-9._/:\\=@+-]+$/.test(value) ? value : `"${value}"`;
}

export function formatArgv(argv: readonly string[]): string {
  return argv.map((value) => (/^[A-Za-z0-9._/:\\=@+-]+$/.test(value) ? value : JSON.stringify(value))).join(" ");
}

export function runPortableCommand(root: string, argv: readonly string[], options: PortableCommandOptions = {}): PortableCommandResult {
  if (argv.length === 0 || argv[0].trim() === "") {
    throw new Error("Command argv must contain a non-empty executable.");
  }

  const stdio = options.capture === true ? "pipe" : "inherit";
  const common = {
    cwd: root,
    encoding: "utf8" as const,
    env: options.env ?? process.env,
    ...(options.input == null ? {} : { input: options.input }),
    shell: false,
    stdio,
  };
  const isWindowsNativeExecutable = process.platform === "win32" && /\.(?:exe|com)$/i.test(argv[0]);
  const windowsCommandLine = process.platform === "win32" ? argv.map(quoteWindowsArg).join(" ") : "";
  const windowsShellCommand = /\s/.test(argv[0]) ? `"${windowsCommandLine}"` : windowsCommandLine;
  const result = process.platform === "win32" && !isWindowsNativeExecutable
    ? spawnSync(
        process.env.ComSpec ?? "cmd.exe",
        ["/d", "/s", "/c", windowsShellCommand],
        common,
      )
    : spawnSync(argv[0], argv.slice(1), common);

  return {
    status: result.status,
    signal: result.signal,
    ...(result.error == null ? {} : { error: result.error }),
    stdout: typeof result.stdout === "string" ? result.stdout : "",
    stderr: typeof result.stderr === "string" ? result.stderr : "",
  };
}

export function commandExitCode(result: Pick<PortableCommandResult, "status" | "signal" | "error">): number {
  return result.status ?? 1;
}
