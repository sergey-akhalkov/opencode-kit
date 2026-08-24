#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { inspectWorkflowContracts } from "../validators/workflow-contracts.ts";

type Options = {
  candidateId: string;
  evidenceRoot: string;
};

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function usage(): string {
  return [
    "Usage:",
    "  node tools/proofs/workflow-contract-consistency.ts --help",
    "  node tools/proofs/workflow-contract-consistency.ts --candidate-id <id> --evidence-root <absolute-new-path>",
    "",
    "Runs provider-free unresolved and active-delta-resolved workflow contract fixtures.",
  ].join("\n");
}

function value(args: string[], index: number, option: string): string {
  const result = args[index + 1];
  if (!result || result.startsWith("--")) throw new Error(`Missing value for ${option}`);
  return result;
}

function parseArgs(args: string[]): Options | null {
  if (args.includes("--help") || args.includes("-h")) return null;
  let candidateId = "";
  let evidenceRoot = "";
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--candidate-id") {
      candidateId = value(args, index, arg);
      index++;
    } else if (arg === "--evidence-root") {
      evidenceRoot = path.resolve(value(args, index, arg));
      index++;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(candidateId)) {
    throw new Error("--candidate-id must be a safe identifier");
  }
  if (!path.isAbsolute(evidenceRoot)) throw new Error("--evidence-root must be absolute");
  return { candidateId, evidenceRoot };
}

function stableValue(input: unknown): unknown {
  if (Array.isArray(input)) return input.map(stableValue);
  if (input == null || typeof input !== "object") return input;
  const value = input as Record<string, unknown>;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
}

function stableJson(input: unknown): string {
  return `${JSON.stringify(stableValue(input), null, 2)}\n`;
}

function sha256(input: string | Buffer): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function writeNew(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, { encoding: "utf8", flag: "wx" });
}

function run(options: Options): void {
  if (fs.existsSync(options.evidenceRoot)) throw new Error("Evidence root already exists");
  fs.mkdirSync(options.evidenceRoot, { recursive: true });
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-contract-proof-"));
  let cleanup = "blocked";
  try {
    writeNew(
      path.join(fixture, "openspec/specs/library-instruction-artifacts/spec.md"),
      "### Requirement: New OpenSpec changes schedule one final history retrospective\nThe workflow SHALL require it.\n\n### Requirement: Existing requirement is revised\nThe base SHALL exist.\n",
    );
    writeNew(
      path.join(fixture, "global/skills/openspec-propose/SKILL.md"),
      "Do not append a mandatory final retrospective.\n",
    );
    const unresolved = inspectWorkflowContracts(fixture);

    writeNew(
      path.join(fixture, "openspec/changes/remove-ceremony/specs/library-instruction-artifacts/spec.md"),
      [
        "## ADDED Requirements",
        "",
        "### Requirement: Shared proof envelope is compact",
        "The workflow SHALL use one shared envelope.",
        "",
        "## MODIFIED Requirements",
        "",
        "### Requirement: Existing requirement is revised",
        "The revised behavior SHALL remain effective.",
        "",
        "## REMOVED Requirements",
        "",
        "### Requirement: New OpenSpec changes schedule one final history retrospective",
        "**Reason**: Product completion is direct.",
        "",
      ].join("\n"),
    );
    const resolved = inspectWorkflowContracts(fixture);
    const names = new Set(resolved.effectiveRequirements.map((item) => item.name));
    const facts = {
      additionEffective: names.has("Shared proof envelope is compact"),
      conflictNamesBothSources:
        unresolved.conflicts.length === 1 &&
        unresolved.conflicts[0].requireSources.length === 1 &&
        unresolved.conflicts[0].forbidSources.length === 1,
      modificationEffective: names.has("Existing requirement is revised"),
      removalEffective: !names.has("New OpenSpec changes schedule one final history retrospective"),
      resolvedPassed: resolved.status === "passed" && resolved.conflicts.length === 0,
      unresolvedFailedClosed: unresolved.status === "blocked" && unresolved.conflicts.length === 1,
      operationKindsObserved:
        resolved.operationCounts.added === 1 &&
        resolved.operationCounts.modified === 1 &&
        resolved.operationCounts.removed === 1,
    };
    const raw = {
      candidateId: options.candidateId,
      facts,
      productionSources: [
        "tools/validators/workflow-contracts.ts",
        "tools/validators/devkit-contract.ts",
        "tools/doctor.ts",
      ].map((relative) => ({
        path: relative,
        sha256: sha256(fs.readFileSync(path.join(sourceRoot, relative))),
      })),
      resolved,
      schemaVersion: 1,
      unresolved,
    };
    writeNew(path.join(options.evidenceRoot, "raw.json"), stableJson(raw));
    cleanup = "complete";
    const evaluation = {
      candidateId: options.candidateId,
      cleanup,
      inputRawSha256: sha256(stableJson(raw)),
      pass: Object.values(facts).every((fact) => fact === true),
      schemaVersion: 1,
    };
    writeNew(path.join(options.evidenceRoot, "evaluation.json"), stableJson(evaluation));
    if (!evaluation.pass) throw new Error("Workflow contract fixture evaluation failed");
    console.log(stableJson({ candidateId: options.candidateId, cleanup, status: "complete" }).trimEnd());
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
    if (fs.existsSync(fixture)) throw new Error("Workflow contract fixture cleanup failed");
  }
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options == null) console.log(usage());
  else run(options);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
