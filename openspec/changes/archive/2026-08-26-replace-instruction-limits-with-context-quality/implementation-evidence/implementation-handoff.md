# Implementation Handoff

Date: 2026-08-26
Change: `replace-instruction-limits-with-context-quality`
Candidate ID: `instruction-context-52a1467ae666-r1`
Loaded-source digest: `52a1467ae66645b3ac14f7ae46c34722c904f5f69dcab7cda9a7fee61fdc244e`

## Outcome

The maintained instruction pipeline no longer rejects candidates because they exceed a
historical numeric token-proxy ceiling. It retains separate startup, discovery, and
on-demand diagnostics; deterministic exact operative-block ownership; reviewed
independent-loader exceptions; protected Markdown canonicalization; strict read-only
validation; and behavior-based no-regression checks.

## Owner Migration

Removed owners:

- `config/instruction-budget.json`
- `tools/instruction-budget.ts`
- `tools/proofs/instruction-inventory-budget.ts`
- package commands `instruction:budget` and `proof:instruction-budget`
- budget-specific validator, test-helper, fixture, documentation, and proof-inventory
  ownership

Replacement owners:

- `tools/instruction-artifacts-inventory.ts` owns maintained source classification,
  separate measurements, privacy-safe reporting, and context-quality projection.
- `tools/instruction-context-quality.ts` owns one shared Markdown parser/evaluator,
  exact duplicate and exception checks, reviewed safe fixes, protected spans, atomic
  write staging, and fixed-point verification.
- `config/instruction-context-quality.json` owns reviewed canonicalization rules and
  independent-loader exceptions without derived hashes or measurements.
- `tools/validate-library.ts` invokes check-only context quality and never rewrites
  maintained source.

Canonical requirement deltas and all other active changes were reconciled so no current
executable task can restore the removed budget path. Historical archive and strategy
evidence remain unchanged.

## Runtime Proof

- The actual inventory and canonicalization package entries passed on the maintained
  71-file model-facing population; two canonicalization checks were byte-stable with
  zero changes and 26/26 active exceptions.
- The installed OpenCode loader accepted a disposable generated `core` profile with all
  required owners, source and permission checks, and complete cleanup. It did not
  activate or install the candidate globally.
- Matched baseline/candidate consumer runs for `ordinary-small-greeting` and
  `openspec-add-json-output` produced `passed-no-regression` under the recorded
  `openai/gpt-5.6-sol` `xhigh` route and `quality-independent` profile. Provider-free
  terminal replay reproduced the result.
- Full evidence and claim ceilings are in
  `implementation-evidence/task-4-1-disposable-core-loader.md`,
  `implementation-evidence/task-4-2-loaded-no-regression.md`, and
  `implementation-evidence/task-5-1-final-validation.md`.

## Validation

Selected and all-current strict OpenSpec validation, focused instruction-context,
library, validation, model-profile, and consumer tests, the complete `npm test` suite,
`npm run validate:strict`, actual inventory, two canonicalization checks, proof
inventory readback, and `git diff --check` all exited zero. The final strict validator
reported zero warnings.

## Diagnostics And Limitations

Current diagnostics report 71 model-facing artifacts, 372,655 characters, token proxy
93,186, 26 active reviewed duplicate exceptions, and no deterministic or review-only
finding. These are scoped diagnostics, not quality maxima or one claimed prompt size.

Known non-critical limitation: deterministic tooling cannot establish semantic
duplication or contradiction for differently worded natural-language instructions.
Those cases remain review-only and require source and affected-consumer evidence.
Results are bounded to the maintained category population, recorded loader identity,
and captured consumer scenarios; they do not claim universal context safety or semantic
equivalence.

## Rollback, Restart, And Cleanup

Before activation, rollback is the scoped repository diff and lockfile reversal. If the
changed global source is later installed or activated, use the project installer and a
fresh OpenCode process because instruction/config artifacts load at startup. No active
installation, activation, restart, credential, consumer-project mutation, commit, push,
release, deployment, or remote operation was performed. Proof-owned fixtures, sessions,
generated config roots, and processes were cleaned up.

Outcome: working. The accepted local implementation outcome is complete and ready for
the separately requested deterministic OpenSpec archive; this handoff does not claim
RC, stable, archive completion, activation, or behavior outside the recorded evidence.
