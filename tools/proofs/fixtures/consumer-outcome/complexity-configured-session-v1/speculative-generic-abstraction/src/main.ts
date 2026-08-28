import { createFormatter } from "./factory.ts";

process.stdout.write(`OK: ${createFormatter()("value")}\n`);
