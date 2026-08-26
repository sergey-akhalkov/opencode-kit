#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const help = spawnSync(process.execPath, ["tools/proofs/bound-completion-baseline.ts", "--help"], { cwd: root, encoding: "utf8" });
assert(help.status === 0 && help.stdout.includes("Provider-free baseline"), "help must exit 0");

const evaluationPath = path.join(root, "openspec/changes/bound-completion-runtime-hot-paths/evidence/task-1-2-baseline-r1/evaluation.json");
const evaluation = JSON.parse(fs.readFileSync(evaluationPath, "utf8")) as {
  largeDb: { selectedAllRows: number; queryPlanHasFullScan: boolean; unrelatedInserted: number };
  hungChild: { timedOut: boolean };
  providerCalls: number;
  source: { statusHasUnboundedLoop: boolean; sessionQueryPresent: boolean };
};
assert(evaluation.providerCalls === 0, "baseline is provider-free");
assert(evaluation.largeDb.unrelatedInserted === 100000, "100k unrelated sessions");
assert(evaluation.largeDb.selectedAllRows === 100004, "current query selects the full table");
assert(evaluation.largeDb.queryPlanHasFullScan === true, "current plan is a full scan");
assert(evaluation.hungChild.timedOut === true, "hung child times out");
assert(evaluation.source.statusHasUnboundedLoop && evaluation.source.sessionQueryPresent, "current source inventory");

const queryRoot = path.join(os.tmpdir(), `bound-completion-query-${process.pid}-${Date.now()}`);
try {
  const query = spawnSync(
    process.execPath,
    ["tools/proofs/bound-completion-baseline.ts", "--mode", "query", "--evidence-root", queryRoot],
    { cwd: root, encoding: "utf8" },
  );
  assert(query.status === 0, `query mode must exit 0: ${query.stderr}`);
  const querySummary = JSON.parse(query.stdout) as {
    queryPlanHasFullScan: boolean;
    selectedRootRows: number;
    wideComplete: boolean;
    providerCalls: number;
  };
  assert(querySummary.providerCalls === 0, "query mode is provider-free");
  assert(querySummary.queryPlanHasFullScan === false, "indexed parent/id lookups must not full-scan");
  assert(querySummary.selectedRootRows === 3, "unrelated growth must not change selected rows");
  assert(querySummary.wideComplete === false, "wide graphs must report omission");
  const queryEvaluation = JSON.parse(fs.readFileSync(path.join(queryRoot, "evaluation.json"), "utf8")) as {
    query: {
      large: { ids: string[] };
      small: { ids: string[] };
      missingIndex: { reason: string };
    };
  };
  assert(JSON.stringify(queryEvaluation.query.large.ids) === JSON.stringify(queryEvaluation.query.small.ids), "small and large selected ids must match");
  assert(queryEvaluation.query.missingIndex.reason === "capability-blocked", "missing parent index must fail closed");
} finally {
  fs.rmSync(queryRoot, { recursive: true, force: true });
}

const processRoot = path.join(os.tmpdir(), `bound-completion-process-${process.pid}-${Date.now()}`);
try {
  const processProof = spawnSync(
    process.execPath,
    ["tools/proofs/bound-completion-baseline.ts", "--mode", "process", "--evidence-root", processRoot],
    { cwd: root, encoding: "utf8", timeout: 120_000 },
  );
  assert(processProof.status === 0, `process mode must exit 0: ${processProof.stderr}`);
  const summary = JSON.parse(processProof.stdout) as {
    cleanup: { complete: boolean; fixtureRemoved: boolean };
    commandClasses: number;
    missionStateUnchanged: boolean;
    providerCalls: number;
    unknownCleanup: { cleanupState: string; retryCount: number; timedOut: boolean };
  };
  assert(summary.providerCalls === 0, "process mode is provider-free");
  assert(summary.commandClasses === 4, "all four command classes must be exercised");
  assert(summary.cleanup.complete && summary.cleanup.fixtureRemoved, "process fixtures must clean up");
  assert(summary.missionStateUnchanged, "hung commands must not advance mission state");
  if (process.platform === "win32") {
    assert(summary.unknownCleanup.cleanupState === "unknown", "failed cleanup attestation must remain unknown");
    assert(summary.unknownCleanup.timedOut && summary.unknownCleanup.retryCount === 0, "unknown cleanup must not retry");
  }
} finally {
  fs.rmSync(processRoot, { recursive: true, force: true });
}

const integratedRoot = path.join(os.tmpdir(), `bound-completion-integrated-${process.pid}-${Date.now()}`);
try {
  const integrated = spawnSync(
    process.execPath,
    ["tools/proofs/bound-completion-baseline.ts", "--mode", "integrated", "--evidence-root", integratedRoot],
    { cwd: root, encoding: "utf8", timeout: 180_000 },
  );
  assert(integrated.status === 0, `integrated mode must exit 0: ${integrated.stderr}`);
  const summary = JSON.parse(integrated.stdout) as {
    cleanup: { largeDbRemoved: boolean; processFixtures: boolean; scheduler: string };
    fullScan: boolean;
    maxActive: number;
    providerCalls: number;
    queued: number;
    selectedRows: number;
  };
  assert(summary.providerCalls === 0, "integrated mode is provider-free");
  assert(summary.selectedRows === 3 && !summary.fullScan, "integrated query remains root-correlated");
  assert(summary.maxActive === 2 && summary.queued === 32, "integrated scheduler remains bounded");
  assert(summary.cleanup.largeDbRemoved && summary.cleanup.processFixtures && summary.cleanup.scheduler === "complete", "integrated cleanup must complete");
} finally {
  fs.rmSync(integratedRoot, { recursive: true, force: true });
}
process.stdout.write("OK: bound-completion-baseline tests=23\n");
