import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const caseId = process.argv[2];
const cases = JSON.parse(fs.readFileSync(path.join(root, "cases.json"), "utf8")).cases;
const selected = cases.find((item) => item.id === caseId);
if (selected == null) throw new Error(`unknown configured case: ${String(caseId)}`);
const archive = JSON.parse(fs.readFileSync(path.join(root, "archive-result.json"), "utf8"));
if (archive.status !== "archived" || typeof archive.archivedAs !== "string") throw new Error("canonical archive result is not terminal archived");
if (fs.existsSync(path.join(root, "openspec", "changes", "trajectory-current"))) throw new Error("active current change remains after archive");
const archiveRoot = path.join(root, "openspec", "changes", "archive", archive.archivedAs);
if (!fs.statSync(archiveRoot).isDirectory()) throw new Error("archived change directory is missing");

const before = JSON.parse(fs.readFileSync(path.join(root, "archive-before.json"), "utf8"));
for (const row of before) {
  const current = path.join(archiveRoot, ...row.path.split("/"));
  if (!fs.statSync(current).isFile()) throw new Error(`archived file is missing: ${row.path}`);
  const digest = crypto.createHash("sha256").update(fs.readFileSync(current)).digest("hex");
  if (digest !== row.sha256) throw new Error(`archived file changed: ${row.path}`);
}

const context = JSON.parse(fs.readFileSync(path.join(root, "trajectory-context.json"), "utf8"));
if (context.status !== "complete" || context.semanticInference !== false) throw new Error("trajectory context is not complete fact-only output");
const result = JSON.parse(fs.readFileSync(path.join(root, "trajectory-result.json"), "utf8"));
for (const field of ["archive", "trajectory", "disposition"]) {
  if (result[field] !== selected.expected[field]) throw new Error(`trajectory result mismatch for ${field}`);
}
if (result.archiveId !== archive.archivedAs || result.horizonId !== "phase-fixture") throw new Error("trajectory result identity mismatch");

const reviewsRoot = path.join(root, "openspec", "delivery-horizons", "phase-fixture", "reviews");
const reviewFiles = fs.existsSync(reviewsRoot) ? fs.readdirSync(reviewsRoot).filter((entry) => entry.endsWith(".json")) : [];
const successorRoot = path.join(root, "openspec", "changes", "trajectory-successor");
if (selected.expected.receipt) {
  if (reviewFiles.length !== 1 || !fs.existsSync(path.join(root, "receipt-result.json"))) throw new Error("expected one materialized review receipt");
  const receipt = JSON.parse(fs.readFileSync(path.join(reviewsRoot, reviewFiles[0]), "utf8"));
  if (receipt.disposition !== selected.expected.disposition || receipt.successorRef !== "openspec/changes/trajectory-successor/proposal.md") throw new Error("receipt disposition or successor mismatch");
} else if (reviewFiles.length !== 0 || fs.existsSync(path.join(root, "receipt-result.json"))) {
  throw new Error("no-trigger case created a durable receipt");
}
if (selected.expected.successor) {
  const proposal = fs.readFileSync(path.join(successorRoot, "proposal.md"), "utf8");
  if (!proposal.includes("- **Delivery Horizon:** phase-fixture")) throw new Error("successor is not linked to the same Horizon");
  for (const relative of ["design.md", "tasks.md", "specs/fixture-capability/spec.md"]) {
    if (!fs.statSync(path.join(successorRoot, relative)).isFile()) throw new Error(`successor artifact is missing: ${relative}`);
  }
} else if (fs.existsSync(successorRoot)) {
  throw new Error("no-trigger case created a successor");
}

const configDir = process.env.OPENCODE_CONFIG_DIR;
if (configDir == null || configDir.trim() === "") throw new Error("OPENCODE_CONFIG_DIR is unavailable");
const { runPortableCommand } = await import(pathToFileURL(path.join(configDir, "bin", "portable-process.ts")).href);
const strict = runPortableCommand(root, ["openspec", "validate", "--all", "--strict", "--json"], { capture: true, env: process.env });
if (strict.status !== 0) {
  throw new Error(`strict OpenSpec validation failed (${String(strict.status)}): ${strict.stderr || strict.stdout || strict.error?.message || "no diagnostic output"}`);
}
console.log(JSON.stringify({
  archive: archive.status,
  archiveId: archive.archivedAs,
  archiveBytesPreserved: true,
  caseId,
  contextStatus: context.status,
  disposition: result.disposition,
  receiptCount: reviewFiles.length,
  strictStatus: strict.status,
  successor: fs.existsSync(successorRoot),
  trajectory: result.trajectory
}));
