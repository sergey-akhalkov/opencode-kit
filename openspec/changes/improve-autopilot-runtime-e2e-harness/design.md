# Design: Improve Autopilot Runtime E2E Harness

## Goals

- Prove real Autopilot runtime behavior without agents manually writing protected state.
- Make worker dispatch, worker collection, blocker questions, MR wait, and stop behavior testable before expanding autonomy.
- Preserve the plugin as the only owner of `.autopilot/**` and `openspec/changes/*/automation/**` mutations.
- Keep the first implementation slice small enough to validate locally without provider credentials.

## Runtime State Model

Autopilot runtime state should be explicit and plugin-owned. The minimal model is:

```ts
type RunState = {
  runId: string;
  createdAt: string;
  updatedAt: string;
  scope: { changeId?: string; taskId?: string };
  claimedTasks: ClaimedTask[];
  workerReports: WorkerReport[];
  blockerQuestions: BlockerQuestion[];
  mrWaits: MrWait[];
};
```

`ClaimedTask` records the ledger path, task id, status at claim time, worker assignment if any, and the legal next phase. `WorkerReport` records worker id, task id, phase, changed files or no-op reason, validation summary, secret-scan status, reviewer outputs, and errors. `BlockerQuestion` records question id, task id, options, recommended label, requested action, and whether it has been answered. `MrWait` records task id, MR status, URL when available, and the reason Autopilot stopped.

## Harness Modes

Use two deterministic harness modes so tests do not depend on real provider state:

| Mode | Purpose | State Location |
| --- | --- | --- |
| In-memory | Fast unit tests for classification, transitions, blockers, and MR waits. | Process memory only. |
| Temp-worktree | Integration tests against real ledger files and plugin APIs. | OS temp directory outside the repository, copied from fixtures. |

Both modes must create state through plugin or test-harness code, not by asking an agent to edit protected paths. The harness may copy fixture ledgers into a temp directory because that directory is owned by the test process, not the user repository.

## First Runtime Slice

The first non-MVP slice should avoid broad worker orchestration. It should implement enough behavior to remove ambiguous no-op UX:

- Discover valid ledgers and classify each as actionable, blocked, waiting for MR, terminal, or runtime-deferred.
- Claim one Ready ledger only when the plugin can produce a legal next action.
- Produce a plugin-owned worker instruction or deterministic placeholder report for tests.
- Collect a worker report and advance only if `validateTaskLedger` accepts the resulting ledger state.
- Stop at MR wait and user blockers without mutating unrelated state.
- Return explicit no-progress reason codes when runtime capability is still deferred.

## Blocker Answers

`autopilot_answer_blocker` should require a pending `BlockerQuestion` match by `questionId` and task id when present. Unknown question ids should return a clear failed or blocked output and should not recommend continuing as if state changed.

The accepted answer should record the selected label, action, timestamp, and actor. If an answer option is stale or no longer legal for the task state, the tool should return a blocker explaining the mismatch.

## MR Wait

MR wait handling must be read-only unless explicit user approval and provider credentials are available. The runtime may read MR status, but it must not merge. If provider access is missing, the output should distinguish missing credentials from no MR work.

## Test Strategy

- Unit-test classification from fixture ledgers.
- Unit-test legal transition checks before writing state.
- Integration-test tool outputs through the plugin server with temp-worktree ledgers.
- Test unknown blocker answer rejection before testing accepted answers.
- Test MR wait output with fake MR metadata, not real provider credentials.
- Test stop behavior for no active run, active run, active task, and all-target pause.

## Risks

- A test harness that writes real repository protected paths would normalize unsafe behavior. Keep harness writes outside the real worktree or behind plugin-owned APIs.
- A broad worker implementation could outgrow MVP scope. Keep the first slice to one claim/collect path plus explicit deferred states.
- Provider-backed MR tests can become flaky. Use fake MR metadata for local tests and reserve provider checks for P2.
