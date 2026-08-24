# Strategy History

## 2026-08-21 - Reject inferred semantic ownership

- **Objective:** Prevent active change overlap and false completion without adding model judgment to deterministic gates.
- **Approach:** Consider inferring owners/proof from delta/task/history prose, then select explicit ownership and evidence-index schemas plus exact mechanical comparison and official validation composition.
- **Evidence:** The audit found semantically conflicting Restart deltas and checked tasks whose prose/history disagreed; deterministic helpers cannot choose the true product owner or infer proof quality safely.
- **Outcome:** Explicit manifests/indexes selected; semantic inference rejected.
- **Reason:** It makes conflicts and evidence freshness reproducible while preserving owner authority for semantic resolution.
- **Do-Not-Repeat Condition:** Do not rank changes, infer a winner, or treat task/history prose as machine proof.
- **Evidence-Based Retry Condition:** Revise the schemas only when a current migrated change exposes a required mechanical fact that cannot be represented without semantic inference.

## 2026-08-21 - Portable readers without zod or doctor static import

- **Objective:** Ship ownership/evidence schemas, inventory, evaluator, and advisory gate readers without breaking installed/fixture doctor loads.
- **Approach:** Hand-written portable parsers under `global/bin/openspec-change/`; doctor optionally spawns inventory when that CLI exists.
- **Evidence:** Focused inventory/gate/library suites green; `openspec validate --strict` passes this change; `openspec validate --all` fails only on `reduce-workflow-ceremony`.
- **Outcome:** Selected behavior works; enforcement stays advisory; task 3.2 remains owner-blocked.
- **Reason:** Zod in the portable gate would fail outside this checkout; a static doctor import crashed isolated fixtures after `global/bin` deletion.
- **Do-Not-Repeat Condition:** Do not statically import new `global/bin` modules from `tools/doctor.ts`, and do not put zod in portable OpenSpec readers.
- **Evidence-Based Retry Condition:** Revisit only if a portable runtime must parse these schemas without the sibling `openspec-change` directory.

## 2026-08-22 - Owner-authorized mechanical restoration

- **Objective:** Close task 3.2 by restoring current invalid/conflicting OpenSpec artifacts from this change.
- **Approach:** Copy omitted selected-strict scenarios, add owner-local manifests/indexes, declare one Restart mutator, index/bound existing evidence, and reopen only checked tasks whose named live envelope is weaker than recorded evidence.
- **Evidence:** Owner asked to expand this spec and implement those restorations.
- **Outcome:** `openspec validate --all` 23/23; inventory findings empty; Restart overlap resolved with one mutator.
- **Reason:** Previous no-cross-edit rule was owner scope; the owner changed it.
- **Do-Not-Repeat Condition:** Do not implement another change's unfinished Desktop/tray/provider live work or delete evidence to satisfy file limits.
- **Evidence-Based Retry Condition:** Stop if a remaining defect requires live product behavior rather than mechanical OpenSpec integrity.
