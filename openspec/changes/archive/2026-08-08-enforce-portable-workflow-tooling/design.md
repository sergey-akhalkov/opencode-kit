# Design: Portable Workflow Tooling

## Context

Baseline complete archive follows the user request through the OpenCode archive command, completion gate, model comparison and manual edits of delta/main specs, repository validation, and a model-authored directory move. The candidate keeps selection, completion, validation, and final reporting but substitutes only spec merge and archive movement with the installed official OpenSpec CLI.

Baseline staged validation runs the dirty working repository, so unrelated unstaged changes can hide defects in the intended index. The candidate creates a deterministic commit from `git write-tree`, checks it out as a disposable worktree, attaches only explicit ignored reuse paths, runs one explicit argv command, and removes the disposable worktree.

## Decisions

### 1. Install portable entrypoints with the global kit source

Reusable tools live under explicit non-loader `global/bin/`. They are available wherever the kit global source is available and do not require copying repository-maintenance `tools/` into each project. Each accepts an explicit target root, derives no project identity from this checkout, and uses an import-safe main guard.

### 2. Use official OpenSpec archive rather than private imports

The archive tool invokes `openspec archive <change> --yes --json`. Before that call it independently reads `openspec status --json`, requires every artifact done, requires a non-empty all-checked task list, runs strict change validation, and runs the explicit project validation argv. The official CLI prepares and validates every rebuilt spec before writing, then returns machine-readable archive identity and operation totals.

Deep-importing `dist/core/specs-apply.js` was rejected because the package exports do not expose it as public API. Reimplementing delta semantics was rejected because it would create a second parser/merge owner.

### 3. Keep project commands as argv adapters

Both tools accept the project validation command after `--` and execute it without a shell. This supports any package manager or native executable and avoids shell-expression injection. Projects needing pipes or compound commands provide their own wrapper executable as the thin adapter.

### 4. Treat official deterministic delta semantics as the envelope

OpenSpec 1.6 deterministic merge preserves existing scenarios only when the `MODIFIED` requirement includes them; partial scenario-only deltas fail closed. The tool reports the original OpenSpec diagnostic and does not fall back to model edits.

### 5. Materialize staged content through Git objects

The staged tool requires a Git repository, no unresolved index entries, and at least one explicit validation command. It writes the current index tree, creates a deterministic temporary commit with the current HEAD as parent, adds a detached temporary worktree, and runs validation there. `--reuse <relative-path>` creates a junction/symlink only for an existing ignored source path absent from the candidate. Cleanup removes links and the worktree even after validation failure; cleanup failure is itself non-zero and reports the preserved path.

### 6. Portability is enforced at maintainer authority

`REPO_AGENTS.md` owns the repository rule: reusable core first, explicit root/config/argv inputs, project-specific thin adapters, no hardcoded package manager/OS/checkout identity in core, and proof in an unrelated disposable fixture. Repository-maintenance-only validators may target the documented kit schema but must not be presented or installed as generic project tools.

### 7. Compaction must switch a stalled strategy

Stagnation is present when at least two materially similar attempts since the last observable progress produce no new accepted artifact, runtime evidence, resolved blocker, or downstream boundary advancement. Changing only flags, wording, timeout, or retry count is the same strategy unless it changes the causal mechanism.

When stagnation is observed, the current session records the attempted strategy in the active OpenSpec change `history.md` before another attempt and selects a different mechanism. If automatic compaction occurs before a file write, the compaction summary emits structured pending history entries; the next session persists them before substantial work, reads existing history, and states the distinct next strategy. Repeating a recorded strategy requires new evidence that invalidates its prior result or satisfies its explicit retry condition.

The rule does not turn an owner-only protected boundary into an agent-resolvable path. When another local reversible mechanism exists, the agent switches rather than declaring itself blocked.

## Failure Model

- Unsafe or missing root/change/reuse input: fail before mutation.
- Incomplete artifact/task state: fail before project validation or OpenSpec archive.
- Project validation failure: preserve exact child exit/stdout/stderr and leave the change active.
- OpenSpec archive failure: preserve machine diagnostic and leave official side effects as reported; never fall back to model edits.
- Post-archive validation failure: return non-zero with the successful archive identity and red validation result; do not claim completion.
- Staged worktree/reuse setup failure: clean every created path and return non-zero.
- Validation command failure: preserve child diagnostics/status, then clean the disposable worktree.
- Repeated strategy without new evidence: stop that attempt before execution, append/reconcile `history.md`, and select a different mechanism.

## Validation

- Disposable unrelated OpenSpec repositories for complete, incomplete, invalid-delta, and no-delta archive paths.
- Disposable Git repository with staged green content and conflicting unstaged red content.
- Reuse-path fixture for a project-local ignored dependency directory.
- Current repository strict validation, complete tests, OpenSpec validation, and pre-push validation.
- Same-model compaction baseline/candidate workflow showing strategy-history capture and a mechanism-level strategy switch.
