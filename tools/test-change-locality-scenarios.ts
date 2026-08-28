#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  changeLocalityFollowUps,
  changeLocalityScenarioIds,
  createCompliantChangeLocalityFixture,
  evaluateChangeLocalityScenario,
  loadChangeLocalitySeed,
  setupChangeLocalityScenario,
} from "./proofs/lib/change-locality-scenarios.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function main(): void {
  const seed = loadChangeLocalitySeed();
  const ids = changeLocalityScenarioIds();
  assert(ids.length === 7, "seed must have 7 scenarios");
  assert(JSON.stringify(ids) === JSON.stringify([...ids].sort((left, right) => ids.indexOf(left) - ids.indexOf(right))), "order is the reviewed seed order");
  const expected = [
    "one-off-local-fix",
    "accepted-second-variant",
    "external-integration-boundary",
    "non-trivial-state-transition",
    "mixed-owner-file",
    "delegated-production-ownership",
    "hypothetical-extension-negative-control",
  ];
  assert(JSON.stringify(ids) === JSON.stringify(expected), "stable reviewed order");
  const serialized = JSON.stringify(seed);
  assert(!serialized.includes(os.homedir()) && !serialized.includes("C:\\\\Users"), "seed must not contain private paths");

  const followUps = changeLocalityFollowUps();
  assert(followUps["accepted-second-variant"] != null && followUps["one-off-local-fix"] == null, "follow-up evidence is declared only for follow-up scenarios");

  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "clc-oracle-"));
  try {
    setupChangeLocalityScenario(fixture, "hypothetical-extension-negative-control");
    const rejected = evaluateChangeLocalityScenario(fixture, "hypothetical-extension-negative-control");
    assert(rejected.pass === false, "negative-control incomplete fixture must fail");
    createCompliantChangeLocalityFixture(fixture, "hypothetical-extension-negative-control");
    const accepted = evaluateChangeLocalityScenario(fixture, "hypothetical-extension-negative-control");
    assert(accepted.pass === true, "compliant negative-control fixture must pass");
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
    assert(!fs.existsSync(fixture), "cleanup must remove the fixture root");
  }

  const bundlePath = path.join(root, "openspec", "changes", "archive", "2026-08-24-improve-change-locality-guidance", "evidence", "task-1-3-baseline-r1", "one-off-local-fix.bundle.json");
  const bundle = JSON.parse(fs.readFileSync(bundlePath, "utf8")) as { candidate: { id: string }; environment: { model: string }; oracle: { pass: boolean } };
  assert(bundle.candidate.id === "improve-change-locality-guidance-planning-r1", "replayed bundle candidate identity");
  assert(bundle.environment.model.length > 0 && bundle.oracle.pass === true, "replayed one-off bundle is inspectable");

  let mismatch = false;
  try {
    loadChangeLocalitySeed();
    const other = JSON.parse(fs.readFileSync(path.join(root, "tools", "proofs", "fixtures", "change-locality-guidance", "scenarios.json"), "utf8")) as { scenarios: unknown[] };
    if (other.scenarios.length !== 7) mismatch = true;
  } catch {
    mismatch = true;
  }
  assert(mismatch === false, "current seed matches the 7-member envelope");
  process.stdout.write("OK: change-locality-scenarios tests=6\n");
}

main();
