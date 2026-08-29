# Task 2.1 Campaign Contracts

- Candidate: `autonomous-work-campaign-contracts-r1`
- Product Candidate: `global/bin/work-campaign.ts` and `global/bin/work-campaign/contracts.ts`
- Environment: Windows, Node `v24.18.1`
- Raw bundle: `implementation-evidence/task-2-1-contract-preflight/raw.json`
- Evaluator: `implementation-evidence/task-2-1-contract-preflight/evaluation.json`

## Scope

Implemented one versioned exact campaign definition and adapter plus exact `inventory-block`, `partition-result`, `work-item`, `reconciliation-result`, `investigation-result`, `wave-manifest`, `closure-matrix`, and `campaign-result` contracts. The owner normalizes stable ids/order, validates project-relative paths, finite budgets, explicit argv, effect classes, protected-effect references, wave DAGs, typed refs, and lowercase SHA-256 identities. JSON read failures preserve the original parse cause.

`work-campaign preflight` is intentionally contract-only at this rung. It reads contained definition/adapter files, emits their stable digests and first `inventory` phase, and performs no state, semantic, source, OpenSpec, Git, process-child, host, remote, credential, installation, or protected effect.

## Reuse

Disposition: `build-minimal` campaign owner with reuse of roadmap `EffectClass`, `PROTECTED_EFFECTS`, `safeId`, and `stableJson`. Current repository and Node standard-library sources were sufficient; Zod was rejected as a second runtime contract style. Cross-project discovery was `degraded` because no configured source/scope was available. `history.md` preserves the full compact disposition.

## Proof

- `npm run work:campaign -- --help`: exit `0`, effect-free contract documented.
- `npm run work:campaign -- preflight --root <generic-fixture> --definition definition.valid.json`: exit `0`, `status=contract-valid`, `phase=inventory`, all six checks passed.
- `npm run test:focused:work-campaign`: exit `0`, `tests=60`.
- Ten production-entrypoint cases cover valid, extra/missing definition fields, unsupported playbook, path escape, zero budget, unsupported effect, missing protected authorization, non-vector argv, and malformed adapter.
- Malformed JSON exits `2`, identifies `definitionPath`, and retains the parser cause.
- All eight campaign record types pass through the shared exact dispatcher; an extra field fails with attributed `WorkCampaignError`.
- `node --check` passes for production and focused test files.
- Source diagnostics contain only the repository-wide absent ambient Node typings; no candidate-specific diagnostic remains.

## Claim Ceiling

This proves the production contract-only boundary for the reviewed generic fixtures. It does not prove durable state, report materialization, semantic classification, mission handoff, configured inference, supervisor recovery, or campaign completion.
