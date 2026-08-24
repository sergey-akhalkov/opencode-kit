#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const change = path.join(root, "openspec", "changes", "optimize-shared-opencode-runtime-resources");
const baseline = JSON.parse(fs.readFileSync(path.join(change, "evidence-task-1-1-baseline-r1", "raw.json"), "utf8"));
const candidates = ["evidence-task-2-2-integration-r10", "evidence-task-2-2-integration-r11"].map((name) => ({ name, raw: JSON.parse(fs.readFileSync(path.join(change, name, "raw.json"), "utf8")) }));
const evidenceIndex = process.argv.indexOf("--evidence-root");
const evidenceRoot = evidenceIndex >= 0 ? path.resolve(process.argv[evidenceIndex + 1]) : null;
if (!evidenceRoot || fs.existsSync(evidenceRoot)) throw new Error("new --evidence-root required");
const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const baselineSamples = baseline.twoClient.samples.map((sample: any) => sample.totals.privateMiB);
const candidateSamples = candidates.map(({ raw }) => raw.processes.graphifyTree.reduce((sum: number, row: any) => sum + row.privateMiB, 0));
const raw = {
  schemaVersion: 1,
  baseline: { source: "evidence-task-1-1-baseline-r1", samplesMiB: baselineSamples, medianMiB: median(baselineSamples) },
  candidate: { sources: candidates.map(({ name }) => name), samplesMiB: candidateSamples, medianMiB: median(candidateSamples) },
  readiness: { baselineMs: baseline.twoClient.readyMs, candidateMs: Math.max(...candidates.flatMap(({ raw }) => raw.projects.map((project: any) => project.readyMs))) },
};
const improvement = 1 - raw.candidate.medianMiB / raw.baseline.medianMiB;
const allowance = Math.max(Math.ceil(raw.readiness.baselineMs * 1.2), raw.readiness.baselineMs + 2000);
const checks = { resourceImprovement35Percent: improvement >= 0.35, readinessWithinAllowance: raw.readiness.candidateMs <= allowance, twoEquivalentCaptures: candidates.every(({ raw }) => raw.projects.length === 2 && raw.projects.every((project: any) => project.exactDirectory) && raw.cleanup.complete) };
const evaluation = { schemaVersion: 1, passed: Object.values(checks).every(Boolean), checks, improvement, allowanceMs: allowance };
fs.mkdirSync(evidenceRoot); fs.writeFileSync(path.join(evidenceRoot, "raw.json"), `${JSON.stringify(raw, null, 2)}\n`, { flag: "wx" }); fs.writeFileSync(path.join(evidenceRoot, "evaluation.json"), `${JSON.stringify(evaluation, null, 2)}\n`, { flag: "wx" }); process.stdout.write(`${JSON.stringify(evaluation, null, 2)}\n`); if (!evaluation.passed) process.exitCode = 1;
