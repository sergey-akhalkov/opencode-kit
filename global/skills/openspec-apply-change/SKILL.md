---
name: openspec-apply-change
description: Implement tasks from an OpenSpec change. Use ONLY when the user names OpenSpec or an active OpenSpec change. Do not use for ordinary application implementation.
allowed-tools: Bash(openspec:*)
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.0"
  generatedBy: "1.6.0"
---

Implement tasks from an OpenSpec change.

Use this skill when the user asks to start or continue implementation of one OpenSpec change. Apply the Universal Development Loop: prove the smallest happy path before broader risk-driven testing and never mark work complete from edits alone.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Infer from conversation context if the user mentioned a change
   - Auto-select if only one active change exists
   - If ambiguous, run `openspec list --json` to get available changes and use the **AskUserQuestion tool** to let the user select

   Always announce: "Using change: <name>" and how to override (e.g., `/opsx-apply <other>`).

2. **Run the apply operation gate before mutation**

   Resolve the current project root and active kit global source explicitly. Use `OPENCODE_CONFIG_DIR` first when it is non-empty and contains the exact `bin/openspec-operation-gate.ts` helper. Otherwise inspect the supported host-default source and privacy-safe runtime-source/collision evidence. Never strip a final `global` segment or guess a repository-parent `bin`. Run the portable gate from the verified source; do not require a target-project package script.
   Run `node "<global-source>/bin/openspec-operation-gate.ts" --root "<project-root>" --operation apply --change "<name>"`.

   Stop on a non-zero exit. Preserve the exact gate output instead of entering the
   implementation loop with missing required artifacts.

3. **Check status to understand the schema**
   Run `openspec status --change "<name>" --json`.
   Parse the JSON to understand:
   - `schemaName`: The workflow being used (e.g., "spec-driven")
   - `planningHome`, `changeRoot`, and `actionContext`: planning scope and edit constraints
   - Which artifact contains the tasks (typically "tasks" for spec-driven, check status for others)

4. **Get apply instructions**

   Run `openspec instructions apply --change "<name>" --json`.

   This returns:
   - `contextFiles`: artifact ID -> array of concrete file paths (varies by schema - could be proposal/specs/design/tasks or spec/tests/implementation/docs)
   - Progress (total, complete, remaining)
   - Task list with status
   - Dynamic instruction based on current state

   **Handle states:**
   - If `state: "blocked"` (missing artifacts): show message, suggest using openspec-continue-change
   - If `state: "all_done"`: treat it as provisional until the accepted outcome and its required observable proof are reconciled; route missing outcome work back to ordinary apply tasks
   - Otherwise: proceed to implementation

5. **Read context files**

   Read every file path listed under `contextFiles` from the apply instructions output.
   The files depend on the schema being used:
   - **spec-driven**: proposal, specs, design, tasks
   - Other schemas: follow the contextFiles from CLI output

   Read `<changeRoot>/history.md` before substantial work. If it is missing, create it with `# Strategy History` and no invented attempts. Reconcile any `Pending Strategy History` entries from compaction before continuing.

    Before accepting `all_done`, map the proposal outcome and current human requirement to their required observable proof. If proof is absent, `Development-Stage` remains `development`, or another explicit outcome fact is unmet, reopen or add the smallest ordinary task and continue. A change is complete only when its accepted outcome is achieved or the owner explicitly selects a supported incomplete/abandoned disposition. Optional retrospective or workflow feedback stays outside the product task graph.

    Read the change-level Claim And Evidence Scope once. Before mutating a declared broad class, require its structured evidence-index record; incomplete `blocked` or `unknown` closure may remain during development, but it cannot be promoted to accepted completion. Exact-case work keeps its concise proposal line and existing proof path.

    If that record claims skipped, omitted, suppressed, cached, replayed, emulated, replaced, or optimized-bypass behavior preserves an existing result, load `behavioral-substitution-qualification` for the detailed closure workflow rather than duplicating it here.

6. **Show current progress**

   Display:
   - Schema being used
   - Progress: "N/M tasks complete"
   - Remaining tasks overview
   - Dynamic instruction from CLI

7. **Implement tasks (loop until done or owner-blocked)**

   For each pending task in dependency-valid order:
   - Show which task is being worked on
   - Make the code changes required
   - Keep changes minimal and focused
   - Run the task's stated observable proof on the current candidate
   - Run its applicable focused validation, or record the exact reasoned manual/external gate
   - Mark the task complete only after required proof and validation pass: `- [ ]` → `- [x]`
   - Continue to next task

   **If proof or validation fails:**
   - Leave the task unchecked
   - Preserve the command, representative input, exit status, stdout/stderr, relevant logs/exceptions, side effects, and artifact paths
   - Treat the raw tool result as authoritative; never substitute an expected exit code. If only generic non-zero status is observable, record the precise process exit code as `unknown`
   - Inspect those diagnostics and continue local run-observe-correct when the failure is resolvable inside the accepted scope
   - Before another materially distinct attempt, append objective, approach, evidence, outcome, reason, do-not-repeat condition, and retry condition to `history.md`
   - After two materially similar attempts without observable progress, stop repeating and use a different causal mechanism; flags, wording, timeout, prompt details, or retry count alone are not a new strategy
   - Repeat a recorded strategy only after appending new evidence that satisfies its retry condition or invalidates the prior result
   - Pause only for an exact user-owned blocker; do not convert an ordinary failure into a routine approval question

   **Pause only if:**
   - A task's accepted behavior or protected semantics are materially ambiguous and no evidence-backed safe reversible interpretation exists → ask one exact clarification question
   - Progress requires an exact user-owned decision or action under the active global owner-boundary contract → provide the required self-contained owner handoff
   - The user interrupts

   A progress checkpoint, locally resolvable error, or blocked live/external gate is not by itself a reason to ask whether to continue. With clear accepted semantics, autonomously update proposal/design/spec/tasks/history, candidate/revision labels, attempt limits, `no successor` rules, and stop lines after causal correction and a satisfied retry/`Live-Attempt Gate`; never ask whether to expand the change for those controls. This does not authorize the underlying protected action.

8. **On completion or owner-blocked pause, show status**

   Display:
   - Tasks completed this session
   - Overall progress: "N/M tasks complete"
   - If all done after accepted-outcome reconciliation: report that implementation tasks are complete and archive checks are next
   - If owner-blocked: explain the exact owner boundary and wait for the required decision or action

**Output During Implementation**

```
## Implementing: <change-name> (schema: <schema-name>)

Working on task 3/7: <task description>
[...implementation happening...]
✓ Task complete

Working on task 4/7: <task description>
[...implementation happening...]
✓ Task complete
```

**Output On Completion**

## Output Contract

Return the change/schema identity, completed and remaining task counts, current Runtime Proof and validation evidence, exact owner blocker or `none`, and ordinary `Outcome` or qualification-only `Development-Stage` without inferring RC/stable from checkboxes.

```
## Implementation Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Progress:** 7/7 tasks complete ✓

### Completed This Session
- [x] Task 1
- [x] Task 2
...

All implementation tasks have current evidence. Run `/opsx-archive` for separate sync, validation, and archive checks.
Do not emit an RC or stable claim from this command. If current runtime proof supports a lifecycle report, apply output is capped at `Development-Stage: MVP` until the separate qualification and handoff checks complete.
```

**Output On Owner Blocker**

```
## Owner Action Required

**Change:** <change-name>
**Schema:** <schema-name>
**Progress:** 4/7 tasks complete

### Exact Blocker
<why only the owner can decide or act>

**Decision:**
<exact requested decision or action, with real alternatives only when they exist>

**Preserved State:** <current candidate and evidence>
```

**Guardrails**
- If the proposal declares a required Automation Dividend, keep exactly one `N.N [automation-dividend]` task and inspect Git state with `node global/bin/repo-candidate-snapshot.ts`.
- Choose smallest dependency-valid pending slice to the earliest real boundary; continue until done unless the user bounded this request, interrupts, or an exact owner boundary stops it
- Always read context files before starting (from the apply instructions output)
- If a task's accepted behavior or protected semantics are materially ambiguous and lack a safe reversible interpretation, pause and ask one exact question
- If implementation reveals an artifact or design mismatch with already resolved semantics, update the affected artifact and continue
- Keep code changes minimal and scoped to each task. In a disposable fixture, skip glob.
- Update a task checkbox only after its required observable proof and focused validation pass
- Treat `all_done` as structural evidence only; reconcile accepted outcome proof before completion or archive routing
- Keep optional retrospective and workflow-improvement ideas outside the product task graph; add only ordinary corrections required for the accepted outcome
- Do not infer RC/stable from completed task checkboxes; this command does not complete the separate archive and stable-handoff boundary
- Diagnose and correct ordinary errors and locally resolvable blockers without asking whether to continue; do not guess across an exact owner boundary
- Use contextFiles from CLI output, don't assume specific file names
- Reference claim ids in implementation tasks and evidence; do not duplicate unchanged population/path/oracle fields or infer claim class from prose.

**Fluid Workflow Integration**

This skill supports the "actions on a change" model:

- **Can be invoked anytime**: Before all artifacts are done (if tasks exist), after partial implementation, interleaved with other actions
- **Allows artifact updates**: If implementation reveals an artifact or design mismatch, update the affected artifacts, tasks, revisions, attempt limits, and stop lines when accepted semantics are already clear; ask only for changed accepted semantics or the exact underlying protected action
