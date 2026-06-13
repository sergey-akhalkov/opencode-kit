# Tasks: Activate Autopilot Runtime Liveness

## Tests First: Queue Liveness

- [x] Add a focused fixture where `tasks.md` is fully checked but `automation/task.json` is non-terminal `Ready`; assert Autopilot does not select it as a live primary task.
- [x] Add a fixture where one stale ledger exists and another active OpenSpec change has unchecked tasks; assert unfinished active work is still visible and not hidden by the stale ledger.
- [x] Add an `autopilot:check --level cheap` test for stale ledger diagnostics and decide whether the result is warning-level or blocking.

## Implementation: Queue Liveness

- [x] Teach ledger summary reading to attach sibling `tasks.md` checklist counts for real `openspec/changes/<change>/automation/task.json` ledgers.
- [x] Classify all-checked `tasks.md` plus non-terminal ledger status as stale completed-change evidence.
- [x] Update queue selection so stale ledgers cannot be selected as `Ready` primary work.
- [x] Update active-change fallback so unfinished active changes are considered when existing ledgers are stale or non-actionable.
- [x] Add clear next actions for stale completed ledgers: archive, reconcile ledger status, or remove stale automation state through an approved path.

## Tests First: Prompt Intake Runtime

- [x] Add plugin/contract tests for a read-only prompt-intake surface that calls `planAutopilotPromptIntake()`.
- [x] Add tests proving exact `changeId` and `taskId` arguments produce scoped `autopilot_run_next` guidance.
- [x] Add tests proving free-form prompts use read-only `autopilot_intake` first, allow `autopilot_status` only as helper-requested status, and never call `autopilot_run_next` with prompt text.
- [x] Add tests proving ambiguous scopes block without advancement.
- [x] Add tests proving raw free-form prompt text is not echoed or persisted by default.

## Implementation: Prompt Intake Runtime

- [x] Add public read-only plugin-owned `autopilot_intake` prompt-intake action.
- [x] Wire the action to `tools/autopilot-prompt-intake.ts` and safe queue inventory evidence.
- [x] Update shared Autopilot contract/tool-name tests if a public tool is added.
- [x] Update `/autopilot` command text to call the prompt-intake action for non-empty arguments before any claim-capable action.
- [x] Update README and `openspec-autopilot` skill guidance so prompt intake is code-backed rather than prose-only.

## Tests First: Live Worker Dispatch Bundle

- [x] Add installer dry-run tests for an opt-in Autopilot live bundle that includes plugin, command, dependency/package guidance, and nested plugin options.
- [x] Add tests proving skill-only install still warns or documents missing plugin tool surface for Autopilot.
- [x] Add config-shape tests for `workerDispatch.enabled`, nested `triggers`, and explicit plugin tuple/path behavior.
- [x] Add backup/no-overwrite tests for bundle installation into a temp OpenCode config directory.

## Implementation: Live Worker Dispatch Bundle

- [x] Add an explicit installer option or profile for the Autopilot live runtime bundle.
- [x] Package or copy the server plugin and required helper closure consistently with README bundle guidance.
- [x] Install or generate the `/autopilot` command only when the plugin tool surface will be available.
- [x] Emit or merge explicit plugin config options for `workerDispatch.enabled` and safe `triggerMode` defaults.
- [x] Preserve dry-run, backup, no-prune, and restart guidance behavior.
- [x] Document single OpenCode server/runtime ownership before enabling live dispatch.

## Tests First: Durable Trigger Evidence

- [ ] Add runtime-store schema tests for persisted blocker questions, pending permissions, workspace waits, worktree waits, and last run-next output evidence.
- [ ] Add migration or recovery tests for old runtime snapshots and invalid new fields.
- [ ] Add controlled event tests that use durable evidence rather than injected-only `runtimeState`.
- [ ] Add autonomous run-next tests proving persisted loop-guard evidence is required and refreshed.

## Implementation: Durable Trigger Evidence

- [ ] Extend or version the durable runtime snapshot schema for controlled/autonomous trigger evidence.
- [ ] Persist plugin-owned blocker, permission, workspace/worktree wait, and last-run-next evidence only when ownership is proven.
- [ ] Update plugin durable evidence merge logic to read the new persisted fields.
- [ ] Revalidate runtime-owned trigger jobs immediately before execution with the expanded durable evidence.
- [ ] Keep unknown sessions, questions, permissions, workspaces, and worktrees ignored.

## Tests First: Dead And Dormant API Cleanup

- [ ] Add or update symbol/reachability tests for Autopilot helper exports with no production consumer.
- [ ] Add tests proving the TUI plugin either uses `classifyAutopilotTuiCommand()` or that the classifier is removed without behavior loss.
- [ ] Add worker-session adapter tests after removing or reclassifying the unused `dispatch()` wrapper.
- [ ] Add a regression or inventory check for the unrelated dead helper `safeSelectSessionCount()` before deleting it.

## Implementation: Dead And Dormant API Cleanup

- [ ] Remove or wire `classifyAutopilotTuiCommand()`.
- [ ] Remove `AutopilotWorkerSessionAdapter.dispatch()` from the production interface unless a safe production consumer is introduced.
- [ ] Use `summarizeSchedulerSnapshot()` in diagnostics or remove it.
- [ ] Move, mark, or centralize `autopilotLedgerPolicy`, `autopilotOutputContract`, and `createInMemoryAutopilotRuntimeStore` as contract/test utilities if they remain non-production exports.
- [ ] Delete `safeSelectSessionCount()` if no live caller is added.

## Documentation, Discovery, And Routing

- [x] Update README routing so Autopilot live runtime, prompt intake, queue-liveness, and install modes are discoverable.
- [ ] Add a compact domain-skill routing bullet if technical domain skills remain under-routed.
- [x] Add validator checks for profile coverage and Autopilot bundle dependency or explicitly document skill-only behavior.
- [ ] Decide whether repo-local `opencode.json` top-level `permission: "allow"` remains intentional; remove the validation warning or document the exception.

## Review Gates

- [ ] Run `code-quality-reviewer` after queue, prompt-intake, runtime-store, installer, and cleanup changes.
- [ ] Run `test-coverage-reviewer` after behavior-changing Autopilot tests land.
- [ ] Run `instruction-artifact-reviewer` after README, skill, command, profile, or routing changes.
- [ ] Run `deployment-config-reviewer` after installer/config/plugin-option changes.
- [ ] Run `performance-reliability-reviewer` if autonomous trigger scheduling or cooldown semantics change materially.

## Validation

- [x] `npm run validate`
- [x] `npm test`
- [x] `npm run openspec:validate`
- [x] `npm run autopilot:check -- --level cheap`
- [ ] `npm run autopilot:check -- --level prepush`
- [ ] `npm run prepush:validate`

## Retrospective Before Archive

- [ ] Review the completed change context, validation, reviewer gates, blockers, repeated work, wait time, token-heavy steps, and likely root causes.
- [ ] Write `openspec/changes/activate-autopilot-runtime-liveness/automation/retro.json` with evidence, problems, root causes, improvements, follow-up ids, and archive gate decision.
- [ ] Create or update project-local OpenSpec follow-up changes for project-local findings.
- [ ] For reusable findings, create or update `opencode-dev-kit` OpenSpec proposals/changes only when the current repository owns them; otherwise record a local handoff and do not write cross-repo without explicit approval.
- [ ] Run `npm run openspec:retro-followups -- activate-autopilot-runtime-liveness` when available so actionable retrospective findings create or update follow-up OpenSpec changes before archive.
- [ ] Confirm archive is allowed only after the JSON retro gate passes or an approved skip reason is recorded in `automation/retro.json`.
