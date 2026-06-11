# Tasks: Improve Autopilot Actionable Output

## Tests First

- [ ] Add output contract tests for `reasonCode` on no-ledger, invalid-ledger, Ready-runtime-deferred, MR-wait, collect-deferred, and stop-no-active-state cases.
- [ ] Add tests for `taskSummaries[]` actionability values.
- [ ] Add tests proving `nextActions[]` avoids repeated no-progress recommendations.
- [ ] Add tests proving compact output excludes full raw ledger bodies.

## Implementation

- [ ] Extend Autopilot plugin output types with `reasonCode`, `taskSummaries`, `nextActions`, and `loopGuard`.
- [ ] Populate reason codes from ledger discovery, validation, MR wait, blockers, collect, and stop paths.
- [ ] Keep existing top-level fields while making `nextActions[]` the preferred guidance surface.
- [ ] Update `/autopilot` command or skill wording only after output behavior is implemented and validated.

## Review

- [ ] Run `test-coverage-reviewer` for output contract coverage.
- [ ] Run `code-quality-reviewer` if plugin code changes are non-trivial.
- [ ] Run `instruction-artifact-reviewer` if command or skill wording changes.

## Validation

- [ ] `npm run validate`
- [ ] `npm test`
- [ ] `npm run autopilot:validate -- <task-ledger.json>`
- [ ] `openspec validate --all`
