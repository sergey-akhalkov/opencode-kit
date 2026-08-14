#!/usr/bin/env node
import path from "node:path";
import { pathToFileURL } from "node:url";

import { runOpenSpecOperationGateCli } from "../global/bin/openspec-operation-gate.ts";

export * from "../global/bin/openspec-operation-gate.ts";

if (process.argv[1] != null && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = runOpenSpecOperationGateCli(process.argv.slice(2));
}
