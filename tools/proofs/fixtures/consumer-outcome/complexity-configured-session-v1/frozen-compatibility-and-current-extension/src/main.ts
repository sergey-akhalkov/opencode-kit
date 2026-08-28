import { currentValue } from "./current.ts";
import { legacyValue } from "./legacy.ts";

process.stdout.write(`OK: ${legacyValue()},${currentValue()}\n`);
