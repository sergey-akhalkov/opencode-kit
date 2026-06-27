import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function newTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), `${prefix}-`));
}

export function withTempDir<T>(prefix: string, run: (dir: string) => T): T {
  const dir = newTempDir(prefix);
  try {
    return run(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export function writeText(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

export function writeFile(filePath: string, lines: string[]): void {
  writeText(filePath, lines.join("\n"));
}

export function lines(parts: string[]): string {
  return parts.join("\n");
}
