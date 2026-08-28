import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runPortableCommand } from "../portable-process.ts";
import { WorkCampaignError, campaignDigest } from "./contracts.ts";
import type { WorkCampaignDefinition } from "./contracts.ts";
import { readCampaignReport } from "./materializer.ts";
import { replayCampaignState } from "./state.ts";
import type { CampaignRuntimeIdentities } from "./state.ts";

type JsonRecord = Record<string, unknown>;

export type CampaignPreflightCheck = {
  id: string;
  status: "blocked" | "passed" | "unknown";
  summary: string;
};

export type CampaignPreflightReport = {
  adapterDigest: string;
  campaignId: string;
  candidateDigest: string | null;
  checks: CampaignPreflightCheck[];
  definitionDigest: string;
  exitCode: 0 | 1;
  identities: CampaignRuntimeIdentities | null;
  operation: "preflight";
  phase: "inventory";
  schemaVersion: 1;
  status: "blocked" | "eligible";
  tool: "work-campaign";
};

const commandTimeoutMs = 30_000;

function passed(id: string, summary: string): CampaignPreflightCheck {
  return { id, status: "passed", summary };
}

function blocked(id: string, summary: string, unknown = false): CampaignPreflightCheck {
  return { id, status: unknown ? "unknown" : "blocked", summary };
}

function object(value: unknown, field: string): JsonRecord {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new WorkCampaignError(`${field} must be a JSON object`, 2, { field });
  }
  return value as JsonRecord;
}

function samePath(left: string, right: string): boolean {
  const normalizedLeft = path.resolve(left).replaceAll("\\", "/");
  const normalizedRight = path.resolve(right).replaceAll("\\", "/");
  return process.platform === "win32"
    ? normalizedLeft.toLocaleLowerCase() === normalizedRight.toLocaleLowerCase()
    : normalizedLeft === normalizedRight;
}

function overlaps(left: string, right: string): boolean {
  return left === right || left.startsWith(`${right}/`) || right.startsWith(`${left}/`);
}

function containedSourceFile(root: string, relative: string): string {
  const candidate = path.resolve(root, relative);
  const lexical = path.relative(path.resolve(root), candidate);
  if (lexical.startsWith("..") || path.isAbsolute(lexical)) throw new WorkCampaignError("scope path escapes the project root", 2, { field: "scopeRoots" });
  let canonical: string;
  try {
    canonical = fs.realpathSync(candidate);
  } catch (error) {
    throw new WorkCampaignError("scope path is unreadable", 2, { cause: error, field: "scopeRoots" });
  }
  const actual = path.relative(fs.realpathSync(root), canonical);
  const stat = fs.lstatSync(canonical);
  if (actual.startsWith("..") || path.isAbsolute(actual) || !stat.isFile() || stat.isSymbolicLink()) {
    throw new WorkCampaignError("scope path must be a contained regular non-symlink file", 2, { field: "scopeRoots" });
  }
  return canonical;
}

function capture(root: string, argv: readonly string[]): { error: string | null; stdout: string } {
  const result = runPortableCommand(root, argv, { capture: true, timeoutMs: commandTimeoutMs });
  if (result.error != null) return { error: result.error.message, stdout: "" };
  if (result.status !== 0) {
    const detail = result.stderr.trim().slice(0, 1_000);
    return { error: `${argv[0]} exited ${String(result.status)}${detail === "" ? "" : `: ${detail}`}`, stdout: "" };
  }
  if (Buffer.byteLength(result.stdout) > 5_000_000) return { error: `${argv[0]} output exceeded 5000000 bytes`, stdout: "" };
  return { error: null, stdout: result.stdout };
}

function sourceDigest(root: string, definition: WorkCampaignDefinition): { check: CampaignPreflightCheck; digest: string | null } {
  const listed = capture(root, ["git", "ls-files", "-z", "--", ...definition.scopeRoots]);
  if (listed.error != null) return { check: blocked("candidate:source", `Tracked source inspection failed: ${listed.error}.`, true), digest: null };
  const files = listed.stdout.split("\0").filter(Boolean).map((value) => value.replaceAll("\\", "/")).filter((file) =>
    !definition.exclusions.some((excluded) => overlaps(file, excluded))
  ).sort();
  if (files.length === 0) return { check: blocked("candidate:source", "The declared scope contains no tracked source files."), digest: null };
  const rows: Array<{ path: string; sha256: string }> = [];
  try {
    for (const relative of files) {
      const file = containedSourceFile(root, relative);
      rows.push({ path: relative, sha256: crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex") });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { check: blocked("candidate:source", `Declared source is unreadable: ${message}.`, true), digest: null };
  }
  return { check: passed("candidate:source", `${files.length} tracked source file(s) define the current candidate digest.`), digest: campaignDigest(rows) };
}

export function readCampaignCandidateDigest(root: string, definition: WorkCampaignDefinition): string {
  const candidate = sourceDigest(root, definition);
  if (candidate.digest == null) throw new WorkCampaignError(candidate.check.summary, 1, { field: "candidate:source" });
  return candidate.digest;
}

function gitChecks(root: string, definition: WorkCampaignDefinition): { candidateDigest: string | null; checks: CampaignPreflightCheck[]; repository: string | null } {
  const checks: CampaignPreflightCheck[] = [];
  const top = capture(root, ["git", "rev-parse", "--show-toplevel"]);
  if (top.error != null) {
    checks.push(blocked("project:git-root", `Git root inspection failed: ${top.error}.`, true));
    return { candidateDigest: null, checks, repository: null };
  }
  if (!samePath(top.stdout.trim(), root)) {
    checks.push(blocked("project:git-root", "--root is not the exact Git worktree root."));
    return { candidateDigest: null, checks, repository: null };
  }
  checks.push(passed("project:git-root", "The exact canonical Git worktree root is selected."));
  const head = capture(root, ["git", "rev-parse", "HEAD"]);
  if (head.error != null) checks.push(blocked("project:checkpoint", `Git checkpoint inspection failed: ${head.error}.`, true));
  else checks.push(passed("project:checkpoint", `Current checkpoint is ${head.stdout.trim()}.`));
  const dirty = capture(root, ["git", "status", "--porcelain=v1", "-z", "--untracked-files=all"]);
  if (dirty.error != null) checks.push(blocked("project:worktree", `Git worktree inspection failed: ${dirty.error}.`, true));
  else if (dirty.stdout !== "") checks.push(blocked("project:worktree", "Unattributed dirty or untracked paths block campaign execution."));
  else checks.push(passed("project:worktree", "Git worktree and index are clean."));
  const candidate = sourceDigest(root, definition);
  checks.push(candidate.check);
  return { candidateDigest: candidate.digest, checks, repository: head.error == null ? `git:${head.stdout.trim()}` : null };
}

function openSpecChecks(root: string): { checks: CampaignPreflightCheck[]; identity: string | null } {
  const version = capture(root, ["openspec", "--version"]);
  if (version.error != null) return { checks: [blocked("project:openspec-version", `OpenSpec version inspection failed: ${version.error}.`, true)], identity: null };
  const match = version.stdout.trim().match(/^(\d+)\.(\d+)\.(\d+)/u);
  if (match == null || Number(match[1]) !== 1 || Number(match[2]) < 6) {
    return { checks: [blocked("project:openspec-version", `OpenSpec version is unsupported: ${version.stdout.trim() || "unknown"}.`)], identity: null };
  }
  const checks = [passed("project:openspec-version", `OpenSpec ${match[0]} is supported.`)];
  const listed = capture(root, ["openspec", "list", "--json"]);
  if (listed.error != null) {
    checks.push(blocked("project:active-changes", `OpenSpec list failed: ${listed.error}.`, true));
    return { checks, identity: match[0] };
  }
  try {
    const output = object(JSON.parse(listed.stdout), "OpenSpec list");
    const changes = Array.isArray(output.changes) ? output.changes.map((value) => object(value, "OpenSpec change")) : [];
    const names = changes.flatMap((change) => typeof change.name === "string" ? [change.name] : []).sort();
    checks.push(names.length === 0
      ? passed("project:active-changes", "No active OpenSpec change is present.")
      : blocked("project:active-changes", `Unowned active OpenSpec changes block campaign execution: ${names.join(", ")}.`));
  } catch (error) {
    checks.push(blocked("project:active-changes", `OpenSpec list is unreadable: ${error instanceof Error ? error.message : String(error)}.`, true));
  }
  return { checks, identity: match[0] };
}

function kitIdentity(): string {
  const directory = path.dirname(fileURLToPath(import.meta.url));
  const files = [
    path.resolve(directory, "..", "work-campaign.ts"),
    path.join(directory, "contracts.ts"),
    path.join(directory, "controller.ts"),
    path.join(directory, "materializer.ts"),
    path.join(directory, "phase-input.ts"),
    path.join(directory, "preflight.ts"),
    path.join(directory, "state.ts"),
  ];
  const hash = crypto.createHash("sha256");
  for (const file of files) hash.update(fs.readFileSync(file));
  return `sha256:${hash.digest("hex")}`;
}

function stateCheck(root: string, definition: WorkCampaignDefinition): CampaignPreflightCheck {
  try {
    const replay = replayCampaignState(root, definition);
    if (replay.writerStatus === "unknown") return blocked("campaign:writer", "A campaign writer lease exists; terminal or isolated evidence is required.", true);
    if (replay.sequence === 0 && replay.projectionStatus === "missing") return passed("campaign:state", "No prior campaign state exists.");
    if (replay.status !== "valid") return blocked("campaign:state", "Existing campaign state is not current and replay-valid.", true);
    try {
      readCampaignReport(root, definition);
      return passed("campaign:state", `Existing campaign state sequence ${replay.sequence} and report are current.`);
    } catch (error) {
      return blocked("campaign:state", `Existing campaign report is not current: ${error instanceof Error ? error.message : String(error)}.`, true);
    }
  } catch (error) {
    return blocked("campaign:state", `Campaign state integrity is unknown: ${error instanceof Error ? error.message : String(error)}.`, true);
  }
}

export function preflightCampaign(
  root: string,
  definition: WorkCampaignDefinition,
  definitionDigest: string,
  adapterDigest: string,
): CampaignPreflightReport {
  const git = gitChecks(root, definition);
  const openSpec = openSpecChecks(root);
  const checks = [
    passed("definition:schema", "Campaign definition and adapter schemas are valid."),
    passed("definition:effects", "Effect classes and protected-effect authority are explicit."),
    passed("definition:budgets", "Campaign process, model, evidence, time, and wave budgets are finite."),
    passed("definition:paths", "Campaign adapter, state, evidence, and report paths are contained and non-overlapping."),
    ...git.checks,
    ...openSpec.checks,
    stateCheck(root, definition),
  ].sort((left, right) => left.id.localeCompare(right.id));
  const eligible = checks.every((check) => check.status === "passed");
  const identities = git.repository == null || openSpec.identity == null ? null : {
    kit: kitIdentity(),
    node: process.version,
    openCode: "not-used-provider-free",
    openSpec: openSpec.identity,
    repository: git.repository,
  };
  return {
    adapterDigest,
    campaignId: definition.campaignId,
    candidateDigest: git.candidateDigest,
    checks,
    definitionDigest,
    exitCode: eligible ? 0 : 1,
    identities,
    operation: "preflight",
    phase: "inventory",
    schemaVersion: 1,
    status: eligible ? "eligible" : "blocked",
    tool: "work-campaign",
  };
}
