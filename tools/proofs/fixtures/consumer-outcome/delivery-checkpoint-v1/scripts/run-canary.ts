import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const resultPath = path.join(root, "checkpoint-result.json");
if (!fs.existsSync(resultPath)) throw new Error("checkpoint-result.json must exist before the earlier canary runs");
const result = JSON.parse(fs.readFileSync(resultPath, "utf8"));
if (result.checkpointId !== "late-validation-manifest-cache-r1" || result.checkpointCount !== 1) {
  throw new Error("the required checkpoint was not recorded exactly once");
}
if (result.selectedRoute !== "earlier-manifest-cache-canary" || result.costlyActionRepeatCount !== 0) {
  throw new Error("the route did not shift before repeating the costly action");
}
if (result.productQuestionCount !== 0 || result.protectedActionCount !== 0) {
  throw new Error("the checkpoint crossed a product-question or protected-action boundary");
}
fs.writeFileSync(path.join(root, "canary-result.json"), `${JSON.stringify({
  boundary: "manifest-and-cache-preflight",
  preservedPopulation: "twelve-report-population-r1",
  status: "passed",
})}\n`, { encoding: "utf8", flag: "wx" });
console.log(JSON.stringify({ boundary: "manifest-and-cache-preflight", status: "passed" }));
