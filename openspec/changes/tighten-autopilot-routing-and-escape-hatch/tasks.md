# Tasks: Tighten Autopilot Routing And Escape Hatch

## Tests First

- [ ] Add instruction/routing drift tests proving `openspec-autopilot`, README routing, and `/autopilot` command text describe eligibility and non-eligibility cases.
- [ ] Add tests or fixtures proving no-progress/deferred reason codes document stop or handoff behavior instead of repeated equivalent `autopilot_run_next` calls.
- [ ] Add tests or fixtures for stale evidence/evidence-conflict wording so the agent must stop and report mismatch rather than continuing the ritual.
- [ ] Add tests for any new public handoff target values if they are introduced.

## Implementation

- [ ] Update `openspec-autopilot` skill with an explicit eligibility section near the top.
- [ ] Update `openspec-autopilot` skill with an explicit escape-hatch section for `ready_runtime_deferred`, `no_ledgers`, `no_actionable_tasks`, stale evidence, and evidence conflicts.
- [ ] Update README routing so `next-step`, `openspec-apply-change`, direct work, and `orchestrator` boundaries are explicit.
- [ ] Update `opencode.json` `/autopilot` command wording only if command-level routing text needs to reference the new contract.
- [ ] If a structured `handoffTarget` is added to Autopilot output, update public contract validation fixtures in `harden-autopilot-contract-validation`.

## Documentation And Review

- [ ] Run `instruction-artifact-reviewer` after skill, README, command, or routing wording changes.
- [ ] Run `test-coverage-reviewer` for routing/escape-hatch fixture coverage if new tests are non-trivial.
- [ ] Update Autopilot live-regression prompt/report expectations after routing wording changes land.

## Validation

- [ ] `npm run validate`
- [ ] `npm test`
- [ ] `openspec validate --all`
- [ ] `npm run autopilot:validate -- <task-ledger.json>` when an Autopilot ledger is in scope

## Retrospective Before Archive

- [ ] Review completed routing work, validation, reviewer gates, repeated manual checks, and any token-heavy evidence gathering.
- [ ] Write `retrospective.md` with findings, improvement ideas, and archive gate decision if the retrospective gate is active for this repository.
- [ ] Route any remaining Autopilot, skill, README, command, validator, or live-regression findings to OpenSpec follow-up changes.
- [ ] Confirm archive is allowed only after the retro gate passes or an approved skip reason is recorded.
