## Context

Current OpenSpec status is assembled from independent task, delta, doctor, and operation checks. Existing changes have no common machine-readable owner or task-evidence index. The rollout must diagnose current violations before blocking all workflows, and must continue using official OpenSpec validation/archive for delta semantics.

## Goals / Non-Goals

**Goals:** one truthful composed state, single-writer ownership, candidate-correlated task evidence, and bounded indexed active evidence.

**Non-Goals:** decide semantic Restart winners, implement unfinished live product work for another change, delete evidence, or replace official OpenSpec commands.

## Decisions

### Add explicit per-change ownership and evidence files

Use `ownership.json` and `evidence-index.json` under each active change. Ownership records capability paths, exact requirement names, write roots, mutation-enabled flag, dependencies, and transfer conditions. Evidence rows bind task id/text digest to candidate/environment, boundary, invocation/status, artifacts, cleanup, and manual/external disposition. Exact JSON schemas live under existing contracts/validators, not inside operation orchestration.

### Derive only mechanical facts

The inventory may compare exact requirement names and normalized path overlap, validate DAGs, count files/bytes, and correlate hashes. It cannot decide that two requirements are semantically equivalent, choose a winner, or infer that prose proves a task. Unsupported facts remain unknown and block only dependent gates.

### Roll out advisory migration before blocking enforcement

First generate a read-only migration report for every active change. After explicit owner authorization, this change restores omitted selected-strict scenarios, publishes manifests/indexes, declares one Restart mutator plus planning-only dependents, and indexes/bounds existing evidence. It does not implement unfinished live Desktop/tray/provider work. Blocking apply/qualification/archive begins only after that mechanical readback is green.

### Compose gates at existing callers

Extend the portable operation gate and doctor using focused owner/evidence modules. Propose checks ownership declarations; apply checks no conflicting mutation owner and current prerequisites; qualification composes selected strict validation/task evidence/repository state; archive adds official archive prerequisites. Official diagnostics remain verbatim evidence.

### Bound evidence without automatic deletion

The index computes active file/byte totals and lane topology. Over-limit state blocks new capture/completion and returns a reduction plan; the owning change decides what trustworthy evidence can be archived or removed. Evaluator-only failures route replay over indexed raw bundles.

## Failure Boundaries And Diagnostics

- Missing/invalid manifest: planning remains visible, mutation gate blocked.
- Dependency cycle or ambiguous transfer: all overlapping owners remain disabled.
- Checked task stale/missing evidence: task treated incomplete.
- Official validation failure: preserved exactly; no fallback merge.
- Evidence over limit: no new capture and no auto-deletion.

## Fidelity And Authorization

- Current rung: reproduced violations and official validation output.
- Next real boundary: read-only inventory over current active changes, then operation-gate fixtures, then apply/qualification dry runs.
- No protected external action; file ownership transfer changes process control only and cannot change product semantics.

## Risks / Trade-offs

- [Path overlap is conservative] -> explicit transfer/dependency, never semantic guessing.
- [Migration adds work to active changes] -> bounded report and owner-local manifests; no archive rewrite.
- [Evidence index becomes ceremony] -> smallest exact schema and generation/readback helpers for mechanical fields.
- [Limits are too small for one material proof] -> explicit proposal exception with finite maximum and reason.

## Migration Plan

1. Build read-only inventory and fixtures from current violations.
2. Add manifests/indexes to this change and migrate active changes under their owners.
3. Restore `reduce-workflow-ceremony` strict validity and reconcile workstation ownership before enabling blocking mode.
4. Integrate callers, run dry-run gates, then enable enforcement.
