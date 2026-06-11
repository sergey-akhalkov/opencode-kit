# Tasks: Require OpenSpec Change Retrospective Gate

## OpenSpec Design

- [ ] Confirm the retrospective gate scope covers mandatory archive gating, final task-list retro, evidence review, token/workflow analysis, finding routing, `opencode-dev-kit` proposal flow, and deterministic helper design.
- [ ] Validate the OpenSpec change with `openspec validate --all`.

## Tests First For Future Implementation

- [ ] Add focused tests or fixtures proving new `tasks.md` templates include a final retrospective section.
- [ ] Add tests for a future `openspec:retro-gate` helper that fail when `retrospective.md` is missing.
- [ ] Add tests for approved skip handling with reason and approver.
- [ ] Add tests for project-local finding routing and `opencode-dev-kit` finding routing.
- [ ] Add tests that Autopilot no-progress, runtime-deferred, stale-evidence, and routing/escape-hatch friction are captured as retrospective evidence when present.
- [ ] Add tests for concise `No findings` retrospectives.

## Future Implementation

- [ ] Update `openspec-archive-change` so archive is blocked until the retrospective gate passes or an approved skip is recorded.
- [ ] Update `openspec-propose` so every new `tasks.md` includes a final retrospective section.
- [ ] Update `openspec-apply-change` so completed changes hand off to retrospective before archive.
- [ ] Update `openspec-autopilot` so acceptance/archive flow treats missing retro as a blocker and asks only returned blocker questions.
- [ ] Update `next-step` so completed-but-not-retroed OpenSpec changes appear as available work.
- [ ] Add `retrospective.md` template guidance to OpenSpec documentation or README after implementation is ready.
- [ ] Add the deterministic TypeScript retro-gate helper and package script if test coverage proves the contract.
- [ ] Integrate retrospective evidence sections into the future Autopilot evidence-pack workflow.
- [ ] Integrate Autopilot routing/escape-hatch outcomes into retrospective templates and evidence-pack generated sections.

## Apply To Existing Active Changes

- [ ] Add final retrospective tasks to existing active OpenSpec changes when implementation of this gate is approved.
- [ ] Before archiving any currently active change, write `retrospective.md` and route findings according to this policy.

## Review Gates For Future Implementation

- [ ] Run `instruction-artifact-reviewer` for skill, template, README, or instruction changes.
- [ ] Run `test-coverage-reviewer` for helper/template validation coverage.
- [ ] Run `code-quality-reviewer` for non-trivial TypeScript helper changes.
- [ ] Run `openspec-consistency-review` before archive because this changes OpenSpec lifecycle policy.

## Validation

- [ ] `npm run validate`
- [ ] `npm test`
- [ ] `openspec validate --all`
- [ ] `npm run autopilot:validate -- <task-ledger.json>` when an Autopilot ledger is in scope.

## Retrospective Before Archive

- [ ] Review the completed work on this retrospective-gate change, including validation, reviewer gates, repeated operations, wait time, and token-heavy steps.
- [ ] Write `retrospective.md` for this change with evidence, problems, improvement ideas, and archive gate decision.
- [ ] Create or update project-local OpenSpec follow-up changes for project-local findings.
- [ ] Create or update reusable `opencode-dev-kit` OpenSpec proposals/changes for Autopilot, skill, agent, instruction, validator, or evidence-pack findings.
- [ ] Confirm archive is allowed only after the retro gate passes or an approved skip reason is recorded.
