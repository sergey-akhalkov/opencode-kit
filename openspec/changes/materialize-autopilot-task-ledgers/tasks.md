# Tasks: Materialize Autopilot Task Ledgers

## Plan And Contract

- [ ] Add focused failing tests for materialization eligibility, including plain `/autopilot` selected active changes, prompt-resolved starts, internally resolved active changes, existing ledgers, missing changes, archived changes, completed changes, and unreadable `tasks.md`.
- [ ] Add output-contract tests for `ledger_materialized` or the final chosen reason code, `tasksAdvanced` creation evidence, selected task evidence, and safe next actions.
- [ ] Add read-only safety tests proving `autopilot_status`, `autopilot_collect`, blocker answer, stop, cheap checks, and passive triggers do not create `automation/task.json`.
- [ ] Add instruction-drift tests for README, `/autopilot` command guidance, and `openspec-autopilot` skill wording about who creates `task.json`.

## Ledger Builder

- [ ] Implement a deterministic TypeScript ledger builder for active OpenSpec changes without adding PowerShell, Python, or JavaScript tooling.
- [ ] Derive required schema fields from safe OpenSpec evidence and documented defaults: `id`, `taskType`, `status`, `priority`, `dependencies`, `scope`, `autonomy`, `validation`, `phaseProfile`, `phaseEvidence`, `testDecision`, `plan`, `reviewPolicy`, `mr`, `blockers`, `feedback`, `history`, and `revision`.
- [ ] Validate candidate ledgers with `validateTaskLedger` before any final protected-path publication.
- [ ] Add fixture tests that run `npm run autopilot:validate -- <materialized-ledger-fixture>` for at least one generated ledger fixture or document why fixture generation is not applicable.

## Plugin-Owned Publication

- [ ] Implement plugin/controller-owned publication to `openspec/changes/<change-id>/automation/task.json` with safe path normalization and no traversal or archive writes.
- [ ] Use temp-file write, read-back validation, final-path absence check, and atomic publish where supported.
- [ ] Ensure failures do not leave a final `task.json`; cleanup only materializer-owned temporary files.
- [ ] Ensure existing ledgers are never overwritten, regenerated, or migrated by this materialization path.

## Runtime Integration

- [ ] Wire plain `/autopilot` / unscoped explicit `autopilot_run_next()` to materialize the deterministic selected active change when no applicable ledger exists and preflight passes.
- [ ] Wire prompt-resolved `/autopilot + prompt` starts so the resolved or newly accepted change is materialized before Autopilot-controlled work begins.
- [ ] Keep internal resolved-`changeId` controller calls supported, but document plain `/autopilot` and `/autopilot + prompt` as the expected user materialization paths.
- [ ] After successful materialization, re-read ledger-backed state and return machine-readable creation evidence without claiming implementation work started.
- [ ] Preserve active-change handoff behavior for read-only discovery and unsupported materialization cases.
- [ ] Keep auto-parallel selection ledger-backed only; active changes must materialize before parallel claims are considered.

## Documentation And Instructions

- [ ] Update `.opencode/skills/openspec-autopilot/SKILL.md` to explain materialization, protected ownership, output evidence, and read-only paths.
- [ ] Update README Autopilot guidance so users know `task.json` is created by explicit plugin-owned materialization when Autopilot starts work on a selected change, not by normal OpenSpec change creation.
- [ ] Update any `/autopilot` command or prompt-intake wording that currently implies users must supply `<change-id>` or that active changes can only hand off manually.
- [ ] Review relevant artifact frontmatter or catalog entries so the new behavior remains discoverable.

## Validation And Review

- [ ] Run `npm run validate`.
- [ ] Run `npm test`.
- [ ] Run `npm run openspec:validate` or `openspec validate --all`.
- [ ] Run `npm run autopilot:validate -- <materialized-ledger-fixture>` for generated fixture ledgers, or record not-applicable with reason.
- [ ] Run `instruction-artifact-reviewer` after instruction, README, command, or skill changes.
- [ ] Run `test-coverage-reviewer` or record an explicit skip reason after the implementation diff is known.

## Retrospective Before Archive

- [ ] Review the completed change context, validation, reviewer gates, blockers, repeated work, wait time, and token-heavy steps.
- [ ] Write `retrospective.md` with evidence, problems, improvements, and archive gate decision.
- [ ] Create or update project-local OpenSpec follow-up changes for project-local findings.
- [ ] For reusable findings, create or update `opencode-dev-kit` OpenSpec proposals/changes only when the current repository owns them; otherwise record a local handoff and do not write cross-repo without explicit approval.
- [ ] Run `npm run openspec:retro-followups -- <change-id>` when available so actionable retrospective findings create or update follow-up OpenSpec changes before archive.
- [ ] Confirm archive is allowed only after the retro gate passes or an approved skip reason is recorded.
