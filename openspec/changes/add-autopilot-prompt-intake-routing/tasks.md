# Tasks: Add Autopilot Prompt Intake Routing

## Tests First

- [ ] Add TypeScript tests for scope resolution covering empty arguments, whitespace arguments, exact `changeId`, exact `taskId`, combined exact scopes, ambiguous scopes, and free-form prompt text.
- [ ] Add tests proving free-form prompt text is never passed to `autopilot_run_next` as `changeId` or `taskId`.
- [ ] Add tests proving free-form prompt intake does not start or advance unrelated ready queue work when existing ledgers or active changes are present.
- [ ] Add tests for bugfix, feature, research/planning, docs/typo, tooling/config, performance, protocol, and unclear prompt-family routing evidence.
- [ ] Add instruction drift tests covering `/autopilot <free-form prompt>` behavior in `opencode.json`, `openspec-autopilot`, and README routing.

## Implementation

- [ ] Add a deterministic TypeScript prompt-intake helper or equivalent command/runtime contract with explicit inputs, stable outputs, exact scope matching, and no fuzzy prompt-to-change matching.
- [ ] Wire the intake helper or contract into the `/autopilot` command path so non-empty arguments are resolved before `autopilot_run_next` is called.
- [ ] Ensure claim-capable Autopilot advancement is not used for unresolved free-form prompts; use read-only status/intake evidence until a scope is selected.
- [ ] Add structured next-action evidence for free-form prompts: existing exact scope, unscheduled prompt, ambiguous scope, direct small-edit handoff, `openspec-explore`, `openspec-propose`, or `openspec-apply-change`.
- [ ] Keep active-change fallback and ledger-backed precedence unchanged for exact scopes and empty arguments.
- [ ] Ensure helper/tool output avoids raw prompt persistence by default and uses derived intake fields for automation.

## Documentation And Routing

- [ ] Update `openspec-autopilot` skill eligibility, first-action, and escape-hatch guidance for free-form prompt intake.
- [ ] Update `/autopilot` command wording in `opencode.json` so natural-language arguments are not treated as scope ids.
- [ ] Update README Routing Map and Skill Catalog guidance to distinguish empty Autopilot, scoped Autopilot, active-change handoff, and free-form prompt handoff.
- [ ] Review relevant artifact frontmatter and command descriptions for discoverability after wording changes.

## Review Gates

- [ ] Run `instruction-artifact-reviewer` after skill, command, or README wording changes.
- [ ] Run `code-quality-reviewer` if TypeScript helper/control-plane changes are non-trivial.
- [ ] Run `test-coverage-reviewer` for prompt-intake scenario coverage before acceptance.
- [ ] Run `openspec-consistency-review` before archive because this changes Autopilot/OpenSpec lifecycle routing.

## Validation

- [ ] `npm run validate`
- [ ] `npm test`
- [ ] `npm run openspec:validate`
- [ ] `openspec validate --all`
- [ ] `npm run autopilot:validate -- <task-ledger.json>` for any new or modified Autopilot ledger fixtures, or record not-applicable when no ledger fixtures changed.

## Acceptance Criteria

- [ ] `/autopilot <free-form bug prompt>` routes to reproduction/exploration/proposal evidence instead of `no_ledgers` dead-end or unrelated queue advancement.
- [ ] `/autopilot <free-form feature prompt>` routes to OpenSpec proposal/exploration or direct small-edit handoff according to existing workflow boundaries.
- [ ] `/autopilot <free-form research prompt>` routes to research/planning workflow and does not start product-code implementation without accepted scope.
- [ ] Exact `changeId` and `taskId` behavior remains backward-compatible and covered by tests.
- [ ] Existing ledger-backed and active-change fallback flows remain unchanged for empty or exact-scope invocations.
- [ ] Command, skill, README, and tests agree on prompt-intake behavior.

## Retrospective Before Archive

- [ ] Review the completed change context, validation, reviewer gates, blockers, repeated work, wait time, and token-heavy steps.
- [ ] Write `retrospective.md` with evidence, problems, improvements, and archive gate decision.
- [ ] Create or update project-local OpenSpec follow-up changes for project-local findings.
- [ ] For reusable findings, create or update `opencode-dev-kit` OpenSpec proposals/changes only when the current repository owns them; otherwise record a local handoff and do not write cross-repo without explicit approval.
- [ ] Run `npm run openspec:retro-followups -- add-autopilot-prompt-intake-routing` when available so actionable retrospective findings create or update follow-up OpenSpec changes before archive.
- [ ] Confirm archive is allowed only after the retro gate passes or an approved skip reason is recorded.
