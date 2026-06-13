# Tasks: Add OpenSpec Autopilot Contract Gates

## Tests First: Retro Status

- [ ] Add fixtures for `missing-tasks`, `missing-retro`, `retro-invalid`, `followups-required`, `followups-stale`, `approved-skip`, `archive-ready`, and `blocked` states.
- [ ] Add tests proving `openspec:retro-status` is read-only and reports required mutations without applying them.
- [ ] Add tests for stable JSON ordering, safe change id validation, and redacted paths.
- [ ] Add tests reusing existing retro-gate and follow-up id logic without diverging behavior.

## Tests First: Legacy Retrospective Markdown

- [ ] Add inventory tests for active and archived `retrospective.md` files.
- [ ] Add validator tests for new active `retrospective.md` wrappers failing or warning according to explicit enforcement policy.
- [ ] Add migration tests from supported legacy retrospective tables to `automation/retro.json`.
- [ ] Add negative migration tests where unsupported legacy content reports `blocked` instead of guessed conversion.

## Tests First: Autopilot Docs Drift

- [ ] Add tests for generated reason-code, status, task-type, trigger-mode, public-tool, and protected-path fragments.
- [ ] Add negative tests for stale README fragments.
- [ ] Add negative tests for stale `openspec-autopilot` skill fragments.
- [ ] Add tests proving unmarked human prose is not rewritten or treated as contract source.

## Implementation

- [ ] Add `tools/openspec-retro-status.ts` or extend existing retro helpers with a read-only status command.
- [ ] Add package script `openspec:retro-status`.
- [ ] Factor shared retro parsing/status helpers from `tools/openspec-retro-gate.ts` and `tools/openspec-retro-followups.ts` where needed.
- [ ] Extend `tools/validate-library.ts` with explicit active/archive `retrospective.md` policy.
- [ ] Add or extend explicit migration mode for supported legacy retrospectives.
- [ ] Add `tools/autopilot-docs-check.ts` or extend `tools/test-autopilot-instruction-drift.ts` for marked contract fragments.
- [ ] Add package script `autopilot:docs-check` if separate from existing tests.

## Documentation And Skill Updates

- [ ] Update `README.md` retro/archive sections to reference `openspec:retro-status`, `openspec:retro-followups`, and `openspec:retro-gate`.
- [ ] Update `README.md` Autopilot contract fragments to use generated/checked markers.
- [ ] Update `.opencode/skills/openspec-archive-change/SKILL.md` to consume retro-status output.
- [ ] Update `.opencode/skills/openspec-apply-change/SKILL.md` to hand off archive readiness through retro-status.
- [ ] Update `.opencode/skills/openspec-autopilot/SKILL.md` to keep routing prose but move finite contract tables into checked fragments.
- [ ] Update `AGENTS.md` or validation docs only if the enforcement policy changes materially.

## Review Gates

- [ ] Run `instruction-artifact-reviewer` after README and skill updates.
- [ ] Run `code-quality-reviewer` on retro-status/docs-check helpers.
- [ ] Run `test-coverage-reviewer` for state fixtures and docs drift tests.

## Validation

- [ ] `npm run validate`
- [ ] `npm test`
- [ ] `npm run openspec:validate`
- [ ] `npm run openspec:retro-status -- <fixture-change>`
- [ ] `npm run autopilot:docs-check` or the equivalent instruction drift test command.

## Retrospective Before Archive

- [ ] Review the completed change context, validation, reviewer gates, blockers, repeated work, wait time, token-heavy steps, and likely root causes.
- [ ] Write `openspec/changes/add-openspec-autopilot-contract-gates/automation/retro.json` with evidence, problems, root causes, improvements, follow-up ids, and archive gate decision.
- [ ] Create or update project-local OpenSpec follow-up changes for project-local findings.
- [ ] For reusable findings, create or update `opencode-dev-kit` OpenSpec proposals/changes only when the current repository owns them; otherwise record a local handoff and do not write cross-repo without explicit approval.
- [ ] Run `npm run openspec:retro-followups -- add-openspec-autopilot-contract-gates` when available so actionable retrospective findings create or update follow-up OpenSpec changes before archive.
- [ ] Confirm archive is allowed only after the JSON retro gate passes or an approved skip reason is recorded in `automation/retro.json`.
