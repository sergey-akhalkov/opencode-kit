import fs from "node:fs";
import path from "node:path";
import { root } from "./events.ts";

const changeRoot = path.join(root, "openspec/changes/leaf-first-fixture");
const expectedRoot = path.join(root, "expected");
const phase = process.argv[2];

if (phase === "proactive") {
  fs.copyFileSync(path.join(expectedRoot, "proactive-tasks.md"), path.join(changeRoot, "tasks.md"));
} else if (phase === "recursive") {
  for (const [source, target] of [
    ["final-design.md", "design.md"],
    ["final-history.md", "history.md"],
    ["final-tasks.md", "tasks.md"],
  ] as const) {
    fs.copyFileSync(path.join(expectedRoot, source), path.join(changeRoot, target));
  }
} else {
  throw new Error("usage: node scripts/materialize-task-shape.ts proactive|recursive");
}

console.log(JSON.stringify({ phase, status: "materialized" }));
