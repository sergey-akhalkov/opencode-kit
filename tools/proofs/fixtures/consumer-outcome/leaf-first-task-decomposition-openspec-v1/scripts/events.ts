import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

export const root = path.resolve(import.meta.dirname, "..");
const resultRoot = path.join(root, "result");
const eventsFile = path.join(resultRoot, "events.json");

export function readEvents(): string[] {
  return fs.existsSync(eventsFile) ? JSON.parse(fs.readFileSync(eventsFile, "utf8")) as string[] : [];
}

export function append(expected: string[], event: string): void {
  assert.deepEqual(readEvents(), expected, `event order before ${event}`);
  fs.mkdirSync(resultRoot, { recursive: true });
  fs.writeFileSync(eventsFile, `${JSON.stringify([...expected, event], null, 2)}\n`, "utf8");
}

export function writeResult(name: string, value: Record<string, unknown>): void {
  fs.mkdirSync(resultRoot, { recursive: true });
  fs.writeFileSync(path.join(resultRoot, name), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
