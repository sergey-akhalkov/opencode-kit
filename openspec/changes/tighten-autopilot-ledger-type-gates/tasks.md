# Tasks: Tighten Autopilot Ledger Type Gates

## Tests First

- [ ] Add invalid bugfix fixture that lacks reproduction/characterization evidence and must fail.
- [ ] Add valid bugfix fixture with reproduction or characterization evidence.
- [ ] Add invalid tooling fixture that lacks fixture/schema/validator gate evidence and must fail.
- [ ] Add invalid config fixture that lacks fixture/schema/validator gate evidence and must fail.
- [ ] Add valid tooling/config fixtures with deterministic gate evidence.
- [ ] Add invalid performance fixture that lacks benchmark/profile evidence and must fail.
- [ ] Add valid performance fixture with benchmark/profile evidence or explicit infeasible reason.
- [ ] Add invalid protocol fixture that lacks golden/negative protocol evidence and must fail.
- [ ] Add valid protocol fixture with golden/negative evidence or explicit infeasible reason.

## Implementation

- [ ] Extend `tools/autopilot-ledger.ts` with task-type-specific evidence checks.
- [ ] Keep evidence fields deterministic and explicit; do not infer from free-form prose alone when a structured field is practical.
- [ ] Update fixture docs or examples if new structured fields are introduced.
- [ ] Ensure reviewer routing remains explicit for all affected task types.

## Review

- [ ] Run `test-coverage-reviewer` for the validator fixture matrix.
- [ ] Run `code-quality-reviewer` for non-trivial validator changes.
- [ ] Run `deployment-config-reviewer` if config validation semantics change materially.

## Validation

- [ ] `npm run validate`
- [ ] `npm test`
- [ ] `npm run autopilot:validate -- <new-or-updated-ledger-fixtures>`
- [ ] `openspec validate --all`
