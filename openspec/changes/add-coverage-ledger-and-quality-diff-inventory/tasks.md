# Tasks: Add Coverage Ledger And Quality Diff Inventory

## Tests First: Coverage Ledger Contract

- [ ] Add fixture tests for valid continuous line coverage across one file and multiple files.
- [ ] Add negative tests for line gaps, overlaps, reversed ranges, ranges outside file length, duplicate block ids, and unknown statuses.
- [ ] Add tests for deleted, unreadable, binary, generated, and too-large file exception statuses with required reasons.
- [ ] Add tests for stable JSON output and redacted root paths.

## Tests First: Changed-Block Invalidation

- [ ] Add fixture tests where unchanged reviewed block hashes stay valid.
- [ ] Add fixture tests where changed reviewed block hashes produce `needs-rereview`.
- [ ] Add tests proving a changed file cannot be final-complete while affected blocks need re-review.

## Tests First: Finding Fields

- [ ] Add tests for complete finding entries.
- [ ] Add negative tests for missing evidence, impact, root cause, recommendation, confidence, or status.
- [ ] Add tests that `rootCause: "unknown"` requires investigation/instrumentation/evidence-gathering routing.

## Tests First: Changed Code-Quality Inventory

- [ ] Add temp git fixture tests for changed-file inventory against a base ref.
- [ ] Add tests for added, modified, deleted, and renamed code files.
- [ ] Add tests for files crossing attention and split-candidate bands.
- [ ] Add tests for `--fail-on-new-split-candidates` and unchanged pre-existing split candidates.
- [ ] Add tests for non-git or unresolved-base output reporting `unsupported`.

## Implementation

- [ ] Add `tools/coverage-ledger.ts` with `init`, `validate`, and `report` modes.
- [ ] Add package script `coverage:ledger`.
- [ ] Add JSON schema/version metadata to coverage ledger output.
- [ ] Extend `tools/code-quality-inventory.ts` with `schemaVersion`, `tool`, and `scope` fields.
- [ ] Add `--changed`, `--base <ref>`, and `--fail-on-new-split-candidates` support to `code-quality:inventory`.
- [ ] Normalize Windows/git paths to POSIX paths in outputs.
- [ ] Update `tools/test-code-quality-inventory.ts` and add coverage ledger tests.

## Documentation And Skill Updates

- [ ] Update `README.md` Validate and code-quality sections with new commands.
- [ ] Update `documentation-block-ledger` to use JSON ledger validation for mechanical coverage proof.
- [ ] Update `codebase-audit-ledger` to use JSON ledger validation for file/block coverage and re-review state.
- [ ] Update `codebase-audit-loop`, `documentation-hardening-loop`, and `file-review-quest` to call or recommend `coverage:ledger` for exhaustive scopes.
- [ ] Update `code-quality-audit` and `code-quality-reviewer` to prefer changed-file inventory for diff reviews.

## Review Gates

- [ ] Run `code-quality-reviewer` on new tooling and inventory output boundaries.
- [ ] Run `test-coverage-reviewer` for ledger/diff fixture coverage.
- [ ] Run `instruction-artifact-reviewer` after skill and README updates.

## Validation

- [ ] `npm run validate`
- [ ] `npm test`
- [ ] `npm run openspec:validate`
- [ ] `npm run code-quality:inventory -- --format json`
- [ ] Run changed-file code-quality inventory against a controlled git fixture.
- [ ] Run coverage ledger validation against valid and invalid fixtures.

## Retrospective Before Archive

- [ ] Review the completed change context, validation, reviewer gates, blockers, repeated work, wait time, token-heavy steps, and likely root causes.
- [ ] Write `openspec/changes/add-coverage-ledger-and-quality-diff-inventory/retro.md` with evidence, problems, root causes, improvements, follow-up ids, and archive gate decision.
- [ ] Run `npm run openspec:retro-followups -- add-coverage-ledger-and-quality-diff-inventory` when available so actionable retrospective findings create or update follow-up OpenSpec changes before archive.
- [ ] If the helper is unavailable, manually create or update project-local OpenSpec follow-up changes for project-local findings; for reusable `opencode-dev-kit` findings, write only when the current repository owns the reusable artifact and current write scope includes it, otherwise record a local handoff and do not write cross-repo without explicit approval.
- [ ] Confirm archive is allowed only after the retro gate passes or an approved skip reason is recorded in `retro.md`.
