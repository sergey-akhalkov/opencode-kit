import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const title = fs.readFileSync(path.join(root, "notes", "title.txt"), "utf8").trim();
assert.equal(title, "Ready");
console.log(JSON.stringify({ status: "passed", title }));
