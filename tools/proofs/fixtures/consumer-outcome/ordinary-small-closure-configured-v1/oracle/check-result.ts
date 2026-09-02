import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const changeId = "compact-note-title";
const changeRoot = path.join(root, "openspec", "changes", changeId);
const planningArtifacts = [
  "openspec/changes/compact-note-title/.openspec.yaml",
  "openspec/changes/compact-note-title/design.md",
  "openspec/changes/compact-note-title/proposal.md",
  "openspec/changes/compact-note-title/specs/note-title/spec.md",
  "openspec/changes/compact-note-title/tasks.md",
];

function filesUnder(directory: string, prefix = ""): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
    return entry.isDirectory() ? filesUnder(path.join(directory, entry.name), relative) : [relative];
  });
}

const actualArtifacts = filesUnder(changeRoot).map((relative) => `openspec/changes/${changeId}/${relative}`).sort();
assert.deepEqual(actualArtifacts, [...planningArtifacts].sort());
assert.equal(fs.readFileSync(path.join(root, "notes", "title.txt"), "utf8").trim(), "Draft", "authoring must not implement the target change");

const metadata = fs.readFileSync(path.join(changeRoot, ".openspec.yaml"), "utf8");
assert.match(metadata, /^schema:\s*spec-driven\s*$/m);
assert.match(metadata, /^artifactProfile:\s*compact\s*$/m);
assert.match(metadata, /^riskDisposition:\s*\r?\n\s+kind:\s*ordinary-small-exact\s*$/m);

const proposal = fs.readFileSync(path.join(changeRoot, "proposal.md"), "utf8");
const capsuleFields = ["Outcome", "Operating Envelope", "Non-Goals", "Non-Deferrable Invariants", "Observable Proof", "Stop Line"];
for (const field of capsuleFields) {
  const listField = proposal.includes(`**${field}**:`) || proposal.includes(`**${field}:**`);
  const headingField = new RegExp(`^#{2,4} ${field}$`, "m").test(proposal);
  assert(listField || headingField, `proposal is missing ${field}`);
}
for (const forbidden of ["Material Residual Risks", "Delivery Horizon", "Automation Dividend", "Bounded Falsification Review", "Claim And Evidence Scope"]) {
  assert(!proposal.includes(forbidden), `proposal contains non-applicable ${forbidden}`);
}
assert(fs.readFileSync(path.join(changeRoot, "design.md"), "utf8").trim().length > 20, "design.md must be present and non-empty");
const specification = fs.readFileSync(path.join(changeRoot, "specs", "note-title", "spec.md"), "utf8");
for (const marker of ["## ADDED Requirements", "### Requirement:", "#### Scenario:", "- **WHEN**", "- **THEN**"]) assert(specification.includes(marker), `spec is missing ${marker}`);
const tasks = fs.readFileSync(path.join(changeRoot, "tasks.md"), "utf8");
assert(tasks.includes("- [ ]"), "tasks must remain unchecked");
assert(!tasks.includes("[automation-dividend]"), "compact fixture must not create an automation task");

const configRoot = process.env.OPENCODE_CONFIG_DIR;
assert(configRoot, "OPENCODE_CONFIG_DIR is required for production operation-gate proof");
const gate = path.join(configRoot, "bin", "openspec-operation-gate.ts");
assert(fs.existsSync(gate), `operation gate is unavailable: ${gate}`);
function operationGate(operation: "apply" | "propose"): { exitCode: number; status: string } {
  const command = spawnSync(process.execPath, [gate, "--root", root, "--operation", operation, "--change", changeId], {
    cwd: root,
    encoding: "utf8",
    shell: false,
    timeout: 60_000,
  });
  if (command.error) throw command.error;
  assert.equal(command.status, 0, command.stderr || command.stdout);
  const output = JSON.parse(command.stdout) as { exitCode: number; status: string };
  assert.equal(output.exitCode, 0);
  return output;
}

const propose = operationGate("propose");
const apply = operationGate("apply");
assert.equal(propose.status, "warning", "missing optional ownership is the only expected propose warning");
assert.equal(apply.status, "passed");

const forbiddenArtifactCount = ["falsification-review.md", "history.md", "ownership.json"].filter((relative) => fs.existsSync(path.join(changeRoot, relative))).length;
assert.equal(forbiddenArtifactCount, 0);
console.log(JSON.stringify({
  applyExitCode: apply.exitCode,
  applyStatus: apply.status,
  artifactProfile: "compact",
  forbiddenArtifactCount,
  planningArtifacts,
  proposalCapsuleFieldCount: capsuleFields.length,
  proposeExitCode: propose.exitCode,
  proposeStatus: propose.status,
  riskDispositionKind: "ordinary-small-exact",
  status: "passed",
}));
