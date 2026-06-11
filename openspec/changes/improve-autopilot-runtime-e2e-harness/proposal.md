# Proposal: Improve Autopilot Runtime E2E Harness

## Why

The live regression confirmed that the Autopilot MVP tools load and inspect ledgers, but runtime behavior remains a safe no-op: `autopilot_run_next` reports `idle` for a valid `Ready` ledger, `autopilot_collect` defers worker report collection and legal mutation, and `.autopilot/prototype/tasks/*.json` is absent. This blocks true P1/P2 e2e coverage for worker dispatch, blocker questions, MR waits, and parallel workstreams.

The same regression found a state-validation UX gap: `autopilot_answer_blocker` accepts an arbitrary answer envelope without proving that a matching plugin-owned blocker question exists. It does not mutate state, but it can create false confidence that a blocker was applied.

The runtime design also needs a safer concurrency contract before implementation. Autopilot should not automatically start several OpenSpec changes just because multiple ledgers are `Ready`; parallel implementation increases conflict, review, and recovery risk. The default should be one deterministic primary task, with parallelism used for read-only analysis, validation, and review unless an explicit guarded parallel mode proves independent scopes.

## What Changes

- Add a plugin-owned e2e harness for Autopilot runtime states, including safe prototype ledgers or equivalent in-memory fixtures for tests.
- Implement runtime tests for `autopilot_run_next`, `autopilot_status`, `autopilot_collect`, `autopilot_answer_blocker`, `autopilot_stop`, MR wait, and no-auto-merge behavior.
- Make `autopilot_answer_blocker` verify a pending blocker question before accepting an answer, or return a clear blocked/failed result when no matching question exists.
- Define deterministic Ready-ledger selection so `autopilot_run_next` chooses one primary task by explicit scope, dependency readiness, normalized priority, write-scope size, and stable tie-breakers instead of model preference.
- Define the first non-MVP runtime slice for Ready-ledger advancement, worker dispatch/collect, blocker questions, MR wait, and parallel-ready queue visibility.
- Make parallel implementation opt-in and guarded by independence checks, lock ownership, separate branches or worktrees, WIP limits, and explicit output explaining why each non-primary task was or was not started.

## Evidence

- Turn 1 `/autopilot`: `autopilot_run_next` returned `outcome: "idle"`, empty `tasksStarted`, empty `tasksAdvanced`, empty blockers/questions, and summary `MVP autopilot inspected 1 task ledger(s). Worker dispatch, MR sync, and ledger mutation are intentionally deferred; use autopilot_status for details.`
- `autopilot_status` found one valid `Ready` `research` ledger and recommended `autopilot_run_next`, but `autopilot_run_next` still did not advance it.
- `autopilot_collect` summary: `Runtime worker report collection and legal state mutation are deferred.`
- `autopilot_stop` summary: `No active MVP runtime state was changed for stop target task.`
- Source evidence: `.opencode/plugins/openspec-autopilot.ts` returns no-op outputs for run/collect/stop and accepts blocker answer envelopes without checking stored blocker state.
- Ledger discovery evidence: only `openspec/changes/autopilot-live-regression/automation/task.json` exists; no `.autopilot/prototype/tasks/*.json` state exists.

## Impact

- Small feature workflows cannot be meaningfully advanced by runtime Autopilot yet; direct `openspec-apply-change` remains more useful unless a future runtime can claim/dispatch work.
- Large epic and parallel-workstream scenarios cannot be evaluated beyond static policy until a plugin-owned harness and dispatch/collect behavior exist.
- Default single-task selection keeps normal `/autopilot` runs reviewable and recoverable; it should improve usability without surprising users with multiple simultaneous changes.
- Blocker and MR scenarios remain partially blocked because safe state seeding is unavailable without writing protected paths manually.

## Validation

- Add focused runtime/plugin tests before implementation.
- Keep `npm run validate`, `npm test`, `npm run autopilot:validate -- <task-ledger.json>`, and `openspec validate --all` green.
