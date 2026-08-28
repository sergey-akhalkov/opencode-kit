import { middleValue } from "./middle.ts";

function outerValue() {
  return middleValue();
}

process.stdout.write(`OK: ${outerValue()}\n`);
