import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const result = spawnSync(process.execPath, ["src/greet.ts"], { encoding: "utf8" });
assert.equal(result.status, 0);
assert.match(result.stdout ?? "", /hello/);
console.log("OK: greet");
