---
name: merge-then-openspec-roi
description: "One-shot loop: batch-merge all open MRs on the default branch (with conflict resolution), refresh trunk, pick the highest-ROI OpenSpec change, drive it to archive plus MR, and emit worktree prompts for safe parallel changes."
license: MIT
---

# Merge Then OpenSpec ROI

Use this skill when the user wants a single chained loop with three goals: land every open MR/PR on the default branch, refresh the trunk, then implement the highest-ROI accepted OpenSpec change to archive plus MR, while spawning separate worktree prompts for other changes that can run in parallel.

Do not use it for a single MR follow-up (use `merge-request-review-loop`), for a single OpenSpec implementation (use `openspec-apply-change`), for "what next?" discovery alone (use `next-step`), or for new proposal authoring (use `openspec-propose`). This skill orchestrates those skills; it does not replace their contracts.

## Safety

- Treat merge, branch delete, force-push, remote state change, and trunk rewrite as destructive: require explicit user request or a pre-approved batch command before performing them. If only approval to "merge all open MRs" was given, do not close, reopen, approve, dismiss reviewers, change labels, or edit remote state beyond the merge itself.
- Resolve conflicts locally on a clean checkout; never force-push someone else's branch to resolve a merge.
- For behavior-changing slices inside the selected OpenSpec change, add or update the focused failing, acceptance, or characterization test before implementation; if infeasible, state why and substitute the closest reproducible evidence.
- Keep TDD proportional: smallest useful test/gate per scoped requirement.
- If provider credentials, network, merge permissions, or destructive-action approval are missing, stop and surface the blocker instead of guessing.

## MR/PR Provider Detection

Resolve `<mr-provider>` from evidence, then ask only if evidence is ambiguous.

- Inspect `git remote -v` for the default remote.
- Map host patterns to a provider and a CLI/API path:
  - `gitflic.*` -> GitFlic: `gitflic`/`gf` CLI or REST API.
  - `github.com` / GitHub Enterprise -> GitHub: `gh` CLI or REST API.
  - `gitlab.com` / self-hosted GitLab -> GitLab: `glab` CLI or REST API.
  - `bitbucket.org` -> Bitbucket: REST API.
- If the remote is ambiguous or no CLI/API is available, ask the user for `<mr-provider>` plus access method once; keep that decision for the rest of the run.
- Use the provider's native list/merge API. If only a web UI is available, return the candidate MRs and a manual-merge checklist as the blocker.

## Workflow

### Phase 1: Inventory Open MRs

- List every open MR/PR whose target is the default branch (`main`/`master` or repository default).
- For each MR, capture: id, title, source branch, target branch, mergeable state, conflicts, draft state, required checks, and approvals.
- Group by target branch. Anything not targeting the default branch is out of scope for this loop unless the user asked for it; report it as `Adjacent MRs` and stop.

### Phase 2: Batch Merge

- Order MRs by lowest-conflict, lowest-risk first to keep the queue healthy; record the chosen order.
- For each MR, in order:
  1. Refresh the source branch against the default branch.
  2. If mergeable, perform the merge through the provider API/CLI. Prefer merge strategies that preserve history only if repository policy says so; otherwise use the repository default.
  3. If conflicts exist, resolve them on a clean local checkout, push the resolution to the source branch (only when repository policy allows pushes to that branch), then merge. If push is not allowed, surface the MR as `blocked: conflicts, push not permitted`.
  4. After a successful merge, delete the source branch only when repository policy and the MR allow it.
- Stop the batch on the first MR that needs a user-owned decision (destructive resolution, ownership/security/legal scope, or merge-strategy override). Report `Batch Halt` with the exact decision.
- Re-run focused validation after the batch when local integration occurred.

### Phase 3: Refresh Trunk

- Check out the default branch, fast-forward to the remote tip, and confirm the working tree is clean.
- Re-run the repository's validation command once on the refreshed trunk to establish a green baseline before selecting an OpenSpec change. If it fails, stop and report the regression; do not start new implementation on a red baseline.

### Phase 4: OpenSpec ROI Inventory

- Inventory every active OpenSpec change under `openspec/changes/`: proposal, design, specs, tasks, traceability, archive readiness, and validation evidence.
- Build a compact ROI table for each change. Do not invent numbers; use evidence and label estimates as estimates.

### Phase 5: Parallelism Decision

- For each pair of candidate changes, classify write scope as disjoint, overlapping, or unknown by inspecting affected files, specs, capabilities, generated artifacts, lockfiles, migrations, and tests named in `tasks.md`.
- Two changes are parallelizable only when write scopes are disjoint and neither blocks the other's acceptance.
- Changes that overlap or block each other stay serial; they are queued behind the selected change in dependency order.

### Phase 6: Confirmation Gate

This gate exists because parallel worktrees run as separate sessions and the user owns when they start.

- If exactly one candidate change exists, skip the gate and proceed directly to Phase 7.
- If two or more candidates exist and at least one can run in parallel, ask the user once via `question` with self-contained options, recommended first and labeled `(Recommended)`:
  - `All parallel worktree prompts launched - proceed with selected change (Recommended)`: user confirms they started every parallel worktree prompt, then the main session continues.
  - `Hold selected change until I launch each prompt`: main session waits for explicit per-prompt confirmation; emit prompts in order and pause.
  - `Serial only - drop parallel worktree prompts`: ignore parallel candidates, run only the highest-ROI change serially.
- Do not start implementation of the selected change until the user picks an option that authorizes continuation.
- In no-question or read-only mode, return `Suggested Next Options` with the same recommended-first ordering and stop.

### Phase 7: Implement Selected Change

- Hand off to `openspec-apply-change` and keep its TDD-first, smallest-correct-change, focused-validation, and reviewer-gate rules authoritative.
- Run `openspec-consistency-review` before implementation for material changes.
- Update `tasks.md` so it ends with `Retrospective Before Archive`; add the section when continuing an older active change.
- Continue until every scoped task has implementation evidence or an explicit blocker.

### Phase 8: Archive Plus MR

- Write or update `openspec/changes/<change-id>/retro.md` with evidence, problems, root causes, follow-up ids, and archive-gate decision; route `unknown` causes as investigations, not guesses.
- Run the repository-configured retrospective follow-up command when available, e.g. `npm run openspec:retro-followups -- <change-id>`, to create/update follow-up OpenSpec changes; otherwise create in-scope follow-ups by hand and return out-of-scope ones as `Actionable Continuation Items`.
- Run the repository-configured retrospective gate when available, e.g. `npm run openspec:retro-gate -- <change-id>`; otherwise apply the same checks manually and lower confidence.
- Hand off to `openspec-archive-change` to move the change to the archive using the repository's OpenSpec CLI/process.
- Author the MR with `merge-request-author`, then run `merge-request-review-loop` for checks, reviewer feedback, and outcome handling. Merge only when the user pre-approved merges or explicitly approves this MR.

### Phase 9: Stop Conditions

End the loop when any of the following is true:

- Selected change is archived and its MR is open or merged under prior approval, and every parallel worktree prompt has been emitted with its target change and entry instruction.
- A real blocker remains that the user must resolve: provider credentials, destructive-action approval, ownership/product/security/legal decision, or remote-state decision. Stop and surface the blocker with `Suggested Next Options`.

## ROI Heuristic

Use the table as a deterministic evidence summary. Where a field cannot be derived from the change artifacts, mark `unknown` rather than guessing.

| Factor | Signal | Notes |
| --- | --- | --- |
| Impact | Number of affected capabilities, scenarios, or specs; downstream changes unblocked | Higher is better |
| Effort | Open tasks remaining, complexity band from `tasks.md` | Lower is better |
| Risk | Cross-cutting scope, migration, API/protocol/deployment change, lockfile/global artifacts | Lower is better |
| Blocker Lift | Other active changes that depend on this one | Bonus multiplier when > 0 |
| Readiness | Has accepted proposal/design, stable specs, TDD entry point known | Required; otherwise demote |
| Reversibility | Test coverage, rollback path, feature-flag availability | Higher is better |

Compute a relative score as `(Impact * Blocker Lift multiplier) / (Effort * Risk)`. Pick the highest score. Tie-break by readiness, then by lowest change id for stable ordering. Show the table to the user before Phase 6 so the choice is auditable.

## Parallelism Detection

- Source of truth for write scope: `tasks.md`, `specs/<capability>/spec.md`, and any `design.md` for each change.
- Disjoint write scopes (different files, different capability specs, different test trees) -> parallelizable.
- Shared files, shared capability specs, shared lockfile/generated artifacts, shared migration, or shared global config -> serial.
- Unknown write scope -> serial by default; do not parallelize on hope.

## Worktree Prompt Contract

For each parallel candidate, emit one self-contained prompt the user can paste into a fresh worktree/workspace session. Each prompt must contain, in this order:

1. `Sync To Trunk First`: the worktree may have been created before the batch-merge and trunk refresh in Phases 2-3, so its branch can lag the new trunk tip. The worker's first action is to reconcile its branch with the latest commit on the repository default branch (`main`/`master` or repository default):
   - Resolve the default branch from `git remote show <origin>` or `git symbolic-ref refs/remotes/<origin>/HEAD`.
   - Fetch the latest trunk (`git fetch <origin> <default-branch>`).
   - Either create the worktree's feature branch from `origin/<default-branch>` at the freshly fetched tip, or rebase/reset the existing worktree branch onto `origin/<default-branch>`. Prefer the repository's normal integration flow; never force-push another contributor's branch.
   - If rebase produces conflicts the worker cannot resolve from its own change's write scope, stop and return `Status: blocked` with `sync-to-trunk conflict` and the exact paths; do not start OpenSpec work on a divergent base.
   - Re-run the repository's validation command on the synced tree to establish a green baseline. If it fails, stop and return `Status: blocked` with `trunk baseline red`.
   - Only after the green baseline proceed to step 2.
2. The target change id and the path to its `proposal.md`/`tasks.md`/`specs/`.
3. A bounded mission: implement the change to archive plus MR using `openspec-apply-change` and `openspec-archive-change`.
4. Write scope: explicit paths inside that change's spec/test/source tree; forbid edits outside it.
5. Verification: the repository's validation command plus the change's acceptance scenarios.
6. Hard rules: do not edit outside the change's write scope; do not merge, push, force-push, or change remote state without explicit user approval; do not ask the user routine questions; return `Status: blocked` with the exact decision when blocked; TDD-first for behavior changes.
7. Output contract: `Sync Status` (default branch, before/after tip, baseline validation result), changed files, completed tasks, validation results, MR id when opened, blockers with the exact user decision required, and `Suggested Next Options` when blocked.

Deliver the prompts in the final response as a copy-paste list with one prompt per parallel change.

## Output

Return:

- `Merged MRs`: per-MR id, title, outcome (`merged` / `conflicts-resolved-merged` / `blocked`), and conflict-resolution summary.
- `Batch Halt`: the first MR that stopped the batch and the exact user decision required, or `none`.
- `Trunk Refresh`: default branch, before/after commit, validation result.
- `ROI Table`: every candidate change with Impact/Effort/Risk/Blocker Lift/Readiness/Reversibility/Score.
- `Selected Change`: id and one-line rationale referencing the ROI table.
- `Parallel Worktree Prompts`: one copy-paste prompt per parallel change, or `none`.
- `Implementation Status`: tasks completed / in progress / blocked, with evidence.
- `Archive`: archived yes/no with retro-gate evidence; follow-up change ids created.
- `MR`: id, target branch, checks/approvals state, and merge outcome.
- `Blockers`: each blocker with the exact user decision required, or `none`.
- `Suggested Next Options`: use when `question` is unavailable or in no-question/read-only mode.

## Hard Rules

- Never merge, close, reopen, approve, dismiss reviewers, push, force-push, branch-delete, or change remote state without explicit user approval or a pre-approved batch command.
- Never start Phase 7 implementation while the Phase 6 confirmation gate is unresolved when parallel candidates exist.
- Never mark a change archived without retro-gate evidence.
- Never widen scope silently after the user confirms a lane, change, or worktree prompt set.
- Never run parallel edits with unsafe write overlap; route overlaps to serial execution.
- Never claim a parallel worktree prompt succeeded; the worktree session owns its own outcome.
