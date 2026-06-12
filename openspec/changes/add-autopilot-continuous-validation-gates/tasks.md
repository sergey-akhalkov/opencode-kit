# Tasks: Add Autopilot Continuous Validation Gates

## Tests First

- [ ] Add planner tests for active change and ledger discovery, including no ledgers, one active ledger, multiple active ledgers, archived ledgers, prototype ledgers, scoped change, and scoped ledger paths.
- [ ] Add tests proving missing explicitly scoped ledgers fail while unscoped no-ledger runs are not-applicable instead of failing.
- [ ] Add tests for `cheap`, `standard`, `prepush`, and `final` level expansion.
- [ ] Add tests proving heavy commands are deduplicated when evidence planning and pre-push planning both request the same command.
- [ ] Add tests proving pre-push includes `Autopilot ledger validation` in deterministic order when active ledgers exist.
- [ ] Add tests proving pre-push short-circuits on invalid active ledger validation and preserves clear gate labels.
- [ ] Add tests proving changed report/task/ledger artifacts trigger freshness checks at the appropriate levels.
- [ ] Add tests proving final validation plans or runs retro follow-ups before the retro gate.
- [ ] Add JSON output contract tests for status, exit code, check ids, blocking flags, next actions, redaction, warning handling, and `--fail-on-warnings` behavior.
- [ ] Add README/instruction drift tests if new command names or Autopilot checkpoint guidance are documented.

## Implementation

- [ ] Add a TypeScript validation planner module that inventories active changes, active ledgers, changed files, scoped changes, scoped ledgers, and gate level.
- [ ] Add a TypeScript CLI for Autopilot checks and expose it through `package.json` as an executable script.
- [ ] Implement `cheap` level checks with active ledger validation, no-ledger not-applicable reporting, scoped-ledger failures, and compact task/actionability summaries.
- [ ] Implement `standard` level checks with evidence-pack collect integration, advisory freshness checks, and reviewer plan surfacing.
- [ ] Implement `prepush` level planning with repository validation, active ledger validation, tests, OpenSpec validation, blocking freshness checks, and command deduplication.
- [ ] Implement `final` level planning with archive-strict freshness, retro follow-up generation, retro gate, and final reviewer/validation reconciliation.
- [ ] Refactor `tools/pre-push-validate.ts` to consume the shared planner while preserving current fail-fast behavior and existing gate labels where possible.
- [ ] Ensure the checker never writes `.autopilot/**` or `openspec/changes/*/automation/**` and never reads secrets or invokes remote-state commands.
- [ ] Ensure output is deterministic, compact, redacted by default, and usable by future plugin wrappers.

## Documentation And Instruction Updates

- [ ] Update README validation guidance with the new Autopilot check command, levels, and recommended trigger points.
- [ ] Update pre-push documentation to state that active Autopilot ledgers and relevant freshness checks are included.
- [ ] Update `openspec-autopilot` skill guidance so agents run cheap/standard/final executable checkpoints instead of relying on prose reminders.
- [ ] Update OpenSpec project guidance if the new final gate changes archive-readiness expectations.
- [ ] Review relevant artifact frontmatter and README catalog if any skills, agents, or commands are added or renamed.

## Reviewer Gates

- [ ] Run `code-quality-reviewer` for the new TypeScript planner/checker and pre-push refactor.
- [ ] Run `test-coverage-reviewer` for the validation-level, pre-push, and freshness coverage.
- [ ] Run `instruction-artifact-reviewer` if README, skill, command, or instruction wording changes.
- [ ] Run `implementation-readiness-reviewer` before implementation if scope expands beyond local validation and pre-push gates.

## Validation

- [ ] `npm run validate`
- [ ] `npm test`
- [ ] `npm run openspec:validate`
- [ ] `npm run autopilot:check -- --level cheap`
- [ ] `npm run autopilot:check -- --level standard --change add-autopilot-continuous-validation-gates`
- [ ] `npm run autopilot:check -- --level prepush`
- [ ] `npm run autopilot:check -- --level final --change <completed-change-id>` when an archive-ready fixture or completed change is available
- [ ] `npm run autopilot:validate -- <task-ledger.json>` for any new or modified Autopilot ledger fixtures

## Acceptance Criteria

- [ ] A developer can run a cheap Autopilot check repeatedly without triggering the full repository test suite.
- [ ] Pre-push fails if any active Autopilot ledger is invalid.
- [ ] Pre-push continues cleanly when no active Autopilot ledgers exist.
- [ ] Final validation blocks archive-ready claims when retrospective, freshness, or follow-up gates fail.
- [ ] The new checks are deterministic, TypeScript-only, and covered by tests.
- [ ] Documentation explains when to use cheap, standard, prepush, and final levels.

## Retrospective Before Archive

- [ ] Review the completed change context, validation, reviewer gates, blockers, repeated work, wait time, and token-heavy steps.
- [ ] Write `retrospective.md` with evidence, problems, improvements, and archive gate decision.
- [ ] Create or update project-local OpenSpec follow-up changes for project-local findings.
- [ ] For reusable findings, create or update `opencode-dev-kit` OpenSpec proposals/changes only when the current repository owns them; otherwise record a local handoff and do not write cross-repo without explicit approval.
- [ ] Run `npm run openspec:retro-followups -- <change-id>` when available so actionable retrospective findings create or update follow-up OpenSpec changes before archive.
- [ ] Confirm archive is allowed only after the retro gate passes or an approved skip reason is recorded.
