# Tasks: Improve Autopilot Runtime E2E Harness

## Tests First

- [ ] Add a plugin-owned runtime harness or deterministic in-memory fixture path that does not require agents to write `.autopilot/**` or `openspec/changes/*/automation/**` manually.
- [ ] Add tests proving `autopilot_run_next` handles valid Ready ledgers without ambiguous idle/no-progress UX.
- [ ] Add tests proving multiple Ready ledgers select one deterministic primary task by default and emit top-level `selection` evidence for non-selected candidates.
- [ ] Add tests proving explicit `taskId`/`changeId` scope affects selection without bypassing blockers, invalid ledgers, MR waits, or dependency gates.
- [ ] Add tests proving `autopilot_collect` consumes plugin-owned worker reports and advances only legal transitions.
- [ ] Add tests proving `autopilot_answer_blocker` rejects unknown question IDs and accepts only pending plugin-owned blocker questions.
- [ ] Add tests proving runtime evidence conflicts stop advancement and do not mutate protected state.
- [ ] Add tests proving MR wait states stop without auto-merge and expose MR status/URL evidence.
- [ ] Add tests proving `autopilot_stop` is non-destructive and reports whether any active runtime state was changed.
- [ ] Add tests proving parallel-ready candidates are visible but not implementation-started in default serial mode.
- [ ] Add tests proving guarded parallel implementation rejects overlapping or unknown write scopes and enforces the WIP limit when explicit parallel mode is enabled.

## Implementation

- [ ] Define the minimal persistent or in-memory runtime state model for MVP-vNext.
- [ ] Implement deterministic Ready-ledger ranking with top-level `selection` evidence for selected and non-selected candidates.
- [ ] Implement default single-primary Ready-ledger claiming/advancement behavior with protected-path ownership preserved.
- [ ] Implement worker dispatch/collect placeholders or real worker report ingestion with legal transition checks.
- [ ] Implement blocker question storage and answer validation.
- [ ] Implement evidence-conflict classification before claim, dispatch, collect, or transition writes; update the public output contract if a new reason code is introduced.
- [ ] Implement MR-wait detection and no-auto-merge stop behavior with explicit evidence.
- [ ] Add parallel-ready queue visibility for independent task ledgers without starting extra implementation workers by default.
- [ ] Add explicit guarded parallel implementation mode only after dependency checks, conservative write-scope overlap checks, runtime locks, isolated branch/worktree naming, and `maxImplementationClaims` enforcement exist.
- [ ] Update public output contract and contract-validation fixtures if selection evidence or parallel-decision fields are added.

## Documentation And Review

- [ ] Update Autopilot skill/README routing only after runtime behavior changes are implemented.
- [ ] Run `instruction-artifact-reviewer` if skill/README wording changes.
- [ ] Run `test-coverage-reviewer` for runtime behavior and regression coverage.
- [ ] Run `code-quality-reviewer` for non-trivial plugin/runtime code changes.

## Validation

- [ ] `npm run validate`
- [ ] `npm test`
- [ ] `npm run autopilot:validate -- <task-ledger.json>`
- [ ] `openspec validate --all`
