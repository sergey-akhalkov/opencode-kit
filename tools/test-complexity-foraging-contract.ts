#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ComplexityForagingContractError,
  parseComplexityForagingRecord,
  stableComplexityForagingJson,
} from "../global/bin/complexity-foraging-contract.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureRoot = path.join(root, "tools", "proofs", "fixtures", "complexity-foraging");

type ValidCase = { id: string; record: unknown };
type InvalidCase = { id: string; expectedField: string; record: unknown };

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function readFixture<T>(name: string): T {
  const filePath = path.join(fixtureRoot, name);
  const stat = fs.statSync(filePath);
  assert(stat.isFile() && stat.size <= 65_536, `${name} must be a bounded regular file`);
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

const validCases = readFixture<ValidCase[]>("schema-v1.valid.json");
const invalidCases = readFixture<InvalidCase[]>("schema-v1.invalid.json");
assert(validCases.length === 8, "expected eight reviewed valid records");
assert(invalidCases.length === 7, "expected seven reviewed invalid records");

const recordTypes = new Set<string>();
for (const item of validCases) {
  const parsed = parseComplexityForagingRecord(item.record);
  recordTypes.add(parsed.recordType);
  const canonical = stableComplexityForagingJson(parsed);
  assert(canonical === `${JSON.stringify(item.record, null, 2)}\n`, `${item.id} fixture must already use canonical order`);
  assert(stableComplexityForagingJson(JSON.parse(canonical)) === canonical, `${item.id} must round-trip exactly`);
}
assert(recordTypes.has("scope") && recordTypes.has("input") && recordTypes.has("output"), "valid fixtures must cover scope, input, and output records");

for (const item of invalidCases) {
  try {
    parseComplexityForagingRecord(item.record);
    throw new Error(`${item.id} unexpectedly passed`);
  } catch (error) {
    assert(error instanceof ComplexityForagingContractError, `${item.id} must fail with the contract error`);
    assert(error.field === item.expectedField, `${item.id} failed at ${error.field}, expected ${item.expectedField}`);
  }
}

process.stdout.write(`OK: complexity-foraging-contract valid=${validCases.length} invalid=${invalidCases.length}\n`);
