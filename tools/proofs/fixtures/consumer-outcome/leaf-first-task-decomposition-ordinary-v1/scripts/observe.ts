import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const resultRoot = path.join(root, "result");
const eventsFile = path.join(resultRoot, "events.json");

function read(relative: string): string {
  return fs.readFileSync(path.join(root, relative), "utf8").trim();
}

function events(): string[] {
  return fs.existsSync(eventsFile) ? JSON.parse(fs.readFileSync(eventsFile, "utf8")) as string[] : [];
}

function append(expected: string[], event: string): void {
  assert.deepEqual(events(), expected, `event order before ${event}`);
  fs.mkdirSync(resultRoot, { recursive: true });
  fs.writeFileSync(eventsFile, `${JSON.stringify([...expected, event], null, 2)}\n`, "utf8");
}

function write(name: string, value: Record<string, unknown>): void {
  fs.mkdirSync(resultRoot, { recursive: true });
  fs.writeFileSync(path.join(resultRoot, name), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

const action = process.argv[2];
if (action === "leaf-a") {
  assert.equal(read("work/leaf-a.txt"), "alpha-ready", "leaf-a requires work/leaf-a.txt=alpha-ready");
  append([], "leaf-a-proof:passed");
  write("leaf-a.json", { id: "leaf-a", oracle: "work/leaf-a.txt", status: "passed" });
} else if (action === "leaf-b") {
  assert.equal(read("work/leaf-b.txt"), "beta-ready", "leaf-b requires work/leaf-b.txt=beta-ready");
  append(["leaf-a-proof:passed"], "leaf-b-proof:passed");
  write("leaf-b.json", { id: "leaf-b", oracle: "work/leaf-b.txt", status: "passed" });
} else if (action === "parent") {
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(resultRoot, "leaf-a.json"), "utf8")), { id: "leaf-a", oracle: "work/leaf-a.txt", status: "passed" });
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(resultRoot, "leaf-b.json"), "utf8")), { id: "leaf-b", oracle: "work/leaf-b.txt", status: "passed" });
  append(["leaf-a-proof:passed", "leaf-b-proof:passed"], "parent-integration-proof:passed");
  write("parent.json", { dependencies: ["leaf-a", "leaf-b"], id: "release-bundle", oracle: "distinct-integration", status: "passed" });
} else if (action === "cohesive") {
  assert.equal(read("work/cohesive.txt"), "cohesive-ready", "cohesive control requires work/cohesive.txt=cohesive-ready");
  append(["leaf-a-proof:passed", "leaf-b-proof:passed", "parent-integration-proof:passed"], "cohesive-direct-proof:passed");
  write("cohesive.json", { id: "cohesive", mode: "direct", status: "passed" });
} else if (action === "same-leaf") {
  const prefix = ["leaf-a-proof:passed", "leaf-b-proof:passed", "parent-integration-proof:passed", "cohesive-direct-proof:passed"];
  if (read("work/same-leaf.txt") !== "local-fixed") {
    append(prefix, "same-leaf-local-failure:observed");
    throw new Error("same-leaf actionable local cause: work/same-leaf.txt must equal local-fixed");
  }
  append([...prefix, "same-leaf-local-failure:observed"], "same-leaf-corrected");
  append([...prefix, "same-leaf-local-failure:observed", "same-leaf-corrected"], "same-leaf-proof:passed");
  write("same-leaf.json", { id: "same-leaf", mode: "direct-correct", status: "passed" });
} else if (action === "grouped-mechanical") {
  assert.equal(read("work/mechanical-a.txt"), "mechanical-ready", "grouped mechanical control requires work/mechanical-a.txt=mechanical-ready");
  assert.equal(read("work/mechanical-b.txt"), "mechanical-ready", "grouped mechanical control requires work/mechanical-b.txt=mechanical-ready");
  append([
    "leaf-a-proof:passed", "leaf-b-proof:passed", "parent-integration-proof:passed", "cohesive-direct-proof:passed",
    "same-leaf-local-failure:observed", "same-leaf-corrected", "same-leaf-proof:passed",
  ], "grouped-mechanical-proof:passed");
  write("grouped-mechanical.json", { id: "grouped-mechanical", mode: "grouped-direct", owners: 2, status: "passed" });
} else if (action === "integration-only") {
  const prefix = [
    "leaf-a-proof:passed", "leaf-b-proof:passed", "parent-integration-proof:passed", "cohesive-direct-proof:passed",
    "same-leaf-local-failure:observed", "same-leaf-corrected", "same-leaf-proof:passed", "grouped-mechanical-proof:passed",
  ];
  assert.equal(read("work/integration-left.txt"), "left-ready", "left integration leaf must remain current");
  assert.equal(read("work/integration-right.txt"), "right-ready", "right integration leaf must remain current");
  if (read("work/integration-parent.txt") !== "integrated-fixed") {
    append(prefix, "integration-only-failure:observed");
    throw new Error("integration-only actionable parent cause: work/integration-parent.txt must equal integrated-fixed");
  }
  append([...prefix, "integration-only-failure:observed"], "integration-parent-corrected");
  append([...prefix, "integration-only-failure:observed", "integration-parent-corrected"], "integration-parent-proof:passed");
  write("integration-only.json", { id: "integration-only", leafEvidencePreserved: true, mode: "parent-local-correct", status: "passed" });
} else {
  throw new Error("usage: node scripts/observe.ts leaf-a|leaf-b|parent|cohesive|same-leaf|grouped-mechanical|integration-only");
}

console.log(JSON.stringify({ action, status: "passed" }));
