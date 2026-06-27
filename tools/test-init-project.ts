#!/usr/bin/env node
import { strict as assert } from "node:assert";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { backupExisting, backupStamp } from "./init-project.ts";

type TestCase = {
  name: string;
  run: () => void;
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "oc-init-test-"));
}

function rmTempDir(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

const tests: TestCase[] = [
  {
    name: "backupStamp has 14-char timestamp plus 8-hex suffix",
    run: () => {
      const stamp = backupStamp();
      assert.match(stamp, /^\d{14}-[0-9a-f]{8}$/, `Stamp must match YYYYMMDDHHMMSS-<8-hex>, got ${stamp}`);
    },
  },
  {
    name: "backupExisting twice within the same second produces different paths",
    run: () => {
      const dir = makeTempDir();
      try {
        const source = path.join(dir, "AGENTS.md");
        fs.writeFileSync(source, "first\n", "utf8");

        const first = backupExisting(source, dir);
        fs.writeFileSync(source, "second\n", "utf8");
        const second = backupExisting(source, dir);

        assert.notEqual(first, second, `Backup paths must differ within the same second; got ${first} twice.`);
        assert(fs.existsSync(first), "First backup must exist on disk.");
        assert(fs.existsSync(second), "Second backup must exist on disk.");
        assert.match(path.basename(path.dirname(first)), /^\d{14}-[0-9a-f]{8}$/, "Backup directory name must match new stamp format.");
      } finally {
        rmTempDir(dir);
      }
    },
  },
  {
    name: "init-project source uses randomUUID for backup collision resistance",
    run: () => {
      const source = fs.readFileSync(path.join(root, "tools", "init-project.ts"), "utf8");
      assert(source.includes("node:crypto"), "init-project must import node:crypto.");
      assert(source.includes("randomUUID"), "init-project must use randomUUID for the suffix.");
      assert(source.includes("slice(0, 14)"), "init-project must keep the 14-char YYYYMMDDHHMMSS prefix.");
      assert(source.includes("slice(0, 8)"), "init-project must use the first 8 hex chars of the random UUID as suffix.");
    },
  },
];

let passed = 0;
for (const test of tests) {
  test.run();
  passed += 1;
  console.log(`PASS ${test.name}`);
}

console.log(`OK: init project tests=${passed}`);
