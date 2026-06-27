#!/usr/bin/env node
import { runTests } from "./test-helpers/library.ts";
import { validatorTests1 } from "./test-library/validator-1.ts";
import { validatorTests2 } from "./test-library/validator-2.ts";
import { initTests } from "./test-library/init.ts";
import { doctorTests } from "./test-library/doctor.ts";
import { inventoryTests } from "./test-library/inventory.ts";

runTests(
  [
    ...validatorTests1,
    ...validatorTests2,
    ...initTests,
    ...doctorTests,
    ...inventoryTests,
  ],
  "library",
);
