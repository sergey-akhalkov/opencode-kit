import { reserve } from "./inventory.ts";
import { charge } from "./payments.ts";
import { receipt } from "./receipts.ts";

const effects = [];
reserve(effects);
charge(effects, "approved");
receipt(effects);
process.stdout.write(`OK: ${effects.join(",")}\n`);
