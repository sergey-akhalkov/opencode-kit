# Tasks: Improve Autopilot Runtime E2E Harness

## Tests First

- [ ] Add a plugin-owned runtime harness or deterministic in-memory fixture path that does not require agents to write `.autopilot/**` or `openspec/changes/*/automation/**` manually.
- [ ] Add tests proving `autopilot_run_next` handles valid Ready ledgers without ambiguous idle/no-progress UX.
- [ ] Add tests proving `autopilot_collect` consumes plugin-owned worker reports and advances only legal transitions.
- [ ] Add tests proving `autopilot_answer_blocker` rejects unknown question IDs and accepts only pending plugin-owned blocker questions.
- [ ] Add tests proving MR wait states stop without auto-merge and expose MR status/URL evidence.
- [ ] Add tests proving `autopilot_stop` is non-destructive and reports whether any active runtime state was changed.

## Implementation

- [ ] Define the minimal persistent or in-memory runtime state model for MVP-vNext.
- [ ] Implement Ready-ledger claiming/advancement behavior with protected-path ownership preserved.
- [ ] Implement worker dispatch/collect placeholders or real worker report ingestion with legal transition checks.
- [ ] Implement blocker question storage and answer validation.
- [ ] Implement MR-wait detection and no-auto-merge stop behavior with explicit evidence.
- [ ] Add parallel-ready queue visibility for independent task ledgers.

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
