#!/usr/bin/env node
export * from "../global/bin/openspec-change/inventory.ts";
import { runOpenSpecChangeInventoryCli } from "../global/bin/openspec-change/inventory.ts";
import { pathToFileURL } from "node:url";
import path from "node:path";

if (process.argv[1] != null && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = runOpenSpecChangeInventoryCli(process.argv.slice(2));
}
