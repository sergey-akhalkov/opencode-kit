## Why

The audit reproduced an active change that reports complete/RC while strict delta validation fails, two changes that own incompatible Restart requirements, checked tasks whose history admits a weaker proof path, and evidence trees that dominate repository navigation. Current gates validate pieces but do not compose ownership, candidate identity, task proof envelope, and bounded evidence into one truthful state.

## Outcome Capsule

- **Outcome**: OpenSpec operations expose one deterministic current-state result that blocks overlapping active owners, stale or invalid completed claims, unsupported task checkoff, and unindexed/unbounded active evidence before apply, qualification, or archive can claim readiness.
- **Operating Envelope**: Repo-local active changes under the spec-driven schema; exact capability/requirement/task/path metadata; provider-free operation gates; grandfathered archived evidence remains read-only. After explicit owner authorization, this change MAY apply mechanical integrity, ownership, evidence-index, and omitted-scenario restorations to other active OpenSpec artifacts without changing their product behavior.
- **Non-Goals**: Deciding product priority, merging semantic Restart conflicts by choosing a winner, implementing another change's unfinished live/Desktop/tray/provider work, deleting historical evidence, replacing official OpenSpec validation/archive, or inferring proof quality from prose.
- **Non-Deferrable Invariants**: One mutation owner per overlapping capability/requirement/write path; selected strict validation is current; every checked behavior task has candidate-correlated evidence matching its named boundary; unknown/conflict fails closed; owner decisions remain limited to changed product semantics/protected actions.
- **Observable Proof**: Fixtures reproduce invalid-complete, overlapping Restart, weaker-proof checkbox, stale candidate, missing evidence index, and excess active evidence; propose/apply/qualification/archive return stable blocking facts; a valid dependency-ordered pair and a bounded indexed change pass.
- **Material Residual Risks**: Path overlap can be conservative; requirement names can change; existing large changes require manual migration; evidence byte/file limits cannot prove semantic sufficiency.
- **Stop Line**: Finish active ownership inventory, task evidence index, bounded evidence topology, composed operation/doctor gates, existing-change migration report, and current repository reconciliation. Do not auto-resolve product conflicts or rewrite archives.

## What Changes

- Add active-change capability/requirement/write-path ownership manifests and conflict checks, with explicit dependency/transfer support but one live mutator.
- Add a versioned `evidence-index.json` mapping checked task IDs to candidate, proof boundary, command/status, artifacts, and cleanup/manual gate facts.
- Require selected strict delta validation and evidence index freshness before completed/RC/qualification/archive claims.
- Add a bounded active evidence contract: one index, stable lanes, maximum 64 retained files and 25 MiB per active change unless its proposal declares and validates a narrower/explicit material exception.
- Compose the checks into shipped propose/apply/archive gates, doctor qualification, tests, and live status without reimplementing official OpenSpec merge behavior.
- After owner authorization, restore current invalid/conflicting OpenSpec artifacts from this change: omitted selected-strict scenarios, honest completion claims, one mutation-enabled Restart writer, and indexed/bounded mission evidence.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `library-spec-workflow-integrity`: Adds active ownership, candidate-correlated task evidence, bounded evidence, and truthful completed/qualification requirements.
- `library-tools-architecture`: Adds deterministic ownership/evidence indexes and caller integration without semantic inference.

## Impact

- OpenSpec operation gates, doctor, validators/contracts/tests, propose/apply/archive instructions, active change metadata/evidence indexes, proof inventory, and audit/quality-gate documentation.
- `reduce-workflow-ceremony`, the two workstation changes, and evidence-heavy mission work keep product/live implementation ownership; this change may only restore mechanical integrity and manifests.

## Implementation Dependencies

- Consumer gate package/CI edits land before reconcile integrates shared callers.
- Owner authorization now permits this change to restore omitted selected-strict scenarios, publish owner-local manifests/indexes, declare one Restart mutator, and index/bound existing evidence. It still SHALL NOT implement another change's unfinished live product work or delete evidence.
- Blocking enforcement activates only after those mechanical restorations pass readback.
