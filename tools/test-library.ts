#!/usr/bin/env node
import { runTests } from "./test-helpers/library.ts";
import { validatorTests1 } from "./test-library/validator-1.ts";
import { validatorTests2 } from "./test-library/validator-2.ts";
import { agentPermissionTests } from "./test-library/agent-permissions.ts";
import { initTests } from "./test-library/init.ts";
import { doctorTests } from "./test-library/doctor.ts";
import { inventoryTests } from "./test-library/inventory.ts";
import { modelProfileTests } from "./test-library/model-profiles.ts";
import { engineeringQualityTests } from "./test-library/engineering-quality.ts";
import { portableWorkflowToolTests } from "./test-library/portable-workflow-tools.ts";
import { runtimeSurfaceProfileTests } from "./test-library/runtime-surface-profiles.ts";

runTests(
  [
    ...validatorTests1,
    ...validatorTests2,
    ...agentPermissionTests,
    ...initTests,
    ...doctorTests,
    ...inventoryTests,
    ...modelProfileTests,
    ...engineeringQualityTests,
    ...portableWorkflowToolTests,
    ...runtimeSurfaceProfileTests,
  ],
  "library",
);
