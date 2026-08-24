import { spawnSync } from "node:child_process";
import type { ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";

export async function stopProofProcessTree(
  child: ChildProcessWithoutNullStreams,
  timeoutMs = 10_000,
): Promise<void> {
  if (child.exitCode == null && child.signalCode == null) {
    const exited = new Promise<void>((resolve) => child.once("exit", () => resolve()));
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { shell: false, stdio: "ignore" });
    } else {
      child.kill();
    }
    const stopped = await Promise.race([
      exited.then(() => true),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), timeoutMs)),
    ]);
    if (!stopped) throw new Error(`Proof process tree did not stop within ${timeoutMs}ms`);
  }
  child.stdin.destroy();
  child.stdout.destroy();
  child.stderr.destroy();
  await new Promise((resolve) => setTimeout(resolve, 250));
}

export function stopProofProcessesByFragment(fragment: string): void {
  if (fragment.trim() === "" || process.platform !== "win32") return;
  const escaped = fragment.replace(/'/g, "''");
  spawnSync("powershell.exe", [
    "-NoProfile",
    "-NonInteractive",
    "-Command",
    `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*${escaped}*' -and $_.ProcessId -ne ${process.pid} } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`,
  ], { shell: false, stdio: "ignore", timeout: 15_000 });
}

export function removeProofFixture(fixture: string): void {
  stopProofProcessesByFragment(fixture);
  fs.rmSync(fixture, { recursive: true, force: true, maxRetries: 50, retryDelay: 200 });
  if (fs.existsSync(fixture)) throw new Error("Proof fixture still exists after bounded cleanup");
}
