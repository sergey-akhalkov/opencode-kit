import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const success = spawnSync(process.execPath, ["src/run-order.ts", "ok"], { encoding: "utf8" });
assert.equal(success.status, 0, success.stderr);
assert.deepEqual(JSON.parse(success.stdout.trim()), {
  effects: [
    "inventory:reserve:book",
    "payment:charge:1250",
    "receipt:record:reservation-1:payment-1",
  ],
  receiptId: "receipt-1",
  status: "ok",
});

const declined = spawnSync(process.execPath, ["src/run-order.ts", "declined"], { encoding: "utf8" });
assert.equal(declined.status, 2, declined.stdout);
assert.deepEqual(JSON.parse(declined.stderr.trim()), {
  effects: ["inventory:reserve:book", "payment:charge:1250"],
  error: "PaymentDeclinedError: payment declined",
});

console.log("OK: order scenario effects=3 failure=PaymentDeclinedError");
