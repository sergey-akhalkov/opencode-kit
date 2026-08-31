import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const seed = JSON.parse(fs.readFileSync(path.join(root, "case.json"), "utf8"));
const result = JSON.parse(fs.readFileSync(path.join(root, "population-result.json"), "utf8"));

assert.deepStrictEqual(result, seed.expectedResult, "population result does not match the reviewed member contract");
assert.deepStrictEqual(
  result.rows.map((row: { memberId: string }) => row.memberId),
  seed.cases.map((scenario: { memberId: string }) => scenario.memberId),
  "population result member order drifted",
);

console.log(JSON.stringify({
  memberCount: result.memberCount,
  ownerQuestionCount: result.ownerQuestionCount,
  protectedActionCount: result.protectedActionCount,
  repositoryClass: result.repositoryClass,
  scopeOraclePopulation: result.scopeOraclePopulation,
}));
