---
description: Implement tasks from an OpenSpec change (Experimental)
---

Implement tasks from an OpenSpec change.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Input**: Optionally specify a change name (e.g., `/opsx-apply add-auth`). If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Infer from conversation context if the user mentioned a change
   - Auto-select if only one active change exists
   - If ambiguous, run `openspec list --json` to get available changes and use the **AskUserQuestion tool** to let the user select

   Always announce: "Using change: <name>" and how to override (e.g., `/opsx-apply <other>`).

2. **Run the apply operation gate before mutation**

   ```bash
   npm run openspec:gate -- --operation apply --change "<name>"
   ```

   Stop on a non-zero exit. Preserve the exact gate output instead of entering the
   implementation loop with missing required artifacts.

3. **Check status to understand the schema**
   ```bash
   openspec status --change "<name>" --json
   ```
   Parse the JSON to understand:
   - `schemaName`: The workflow being used (e.g., "spec-driven")
   - `planningHome`, `changeRoot`, and `actionContext`: planning scope and edit constraints
   - Which artifact contains the tasks (typically "tasks" for spec-driven, check status for others)

4. **Get apply instructions**

   ```bash
   openspec instructions apply --change "<name>" --json
   ```

   This returns:
   - `contextFiles`: artifact ID -> array of concrete file paths (varies by schema)
   - Progress (total, complete, remaining)
   - Task list with status
   - Dynamic instruction based on current state

   **Handle states:**
   - If `state: "blocked"` (missing artifacts): show message, suggest using `/opsx-continue`
   - If `state: "all_done"`: treat it as provisional until session-derived improvements are reconciled; suggest archive only when none must be added
   - Otherwise: proceed to implementation

5. **Read context files**

   Read every file path listed under `contextFiles` from the apply instructions output.
   The files depend on the schema being used:
   - **spec-driven**: proposal, specs, design, tasks
   - Other schemas: follow the contextFiles from CLI output

   Read `<changeRoot>/history.md` before substantial work. If it is missing, create it with `# Strategy History` and no invented attempts. Reconcile any `Pending Strategy History` entries from compaction before continuing.

   Reconcile every admitted candidate from the current session and `Pending Improvement Tasks` before substantial work. Append every still-admissible owned item as an unchecked task under `## Session-Derived Improvements` in the active `tasks.md`; never retain only the highest-ROI item. Each task must state `Trigger/Evidence`, `Why`, `Prerequisites`, `Scope/Non-Goals`, `Implementation`, `Observable Proof`, and `Validation`, plus `Owner Blocker` only when applicable. If a candidate belongs to another repository, expands accepted outcome, or crosses a protected boundary, record that exact blocker without mutating across it. Do not silently drop the candidate or call the change complete.

6. **Show current progress**

   Display:
   - Schema being used
   - Progress: "N/M tasks complete"
   - Remaining tasks overview
   - Dynamic instruction from CLI

7. **Implement tasks (loop until done or owner-blocked)**

   For each pending task:
   - Show which task is being worked on
   - Make the code changes required
   - Keep changes minimal and focused
   - Run the task's stated observable proof on the current candidate
   - Run its applicable focused validation, or record the exact reasoned manual/external gate
   - Mark the task complete only after required proof and validation pass: `- [ ]` → `- [x]`
   - Continue to next task

   When an improvement candidate becomes admissible during implementation, append it immediately using the same section and fields. It is accepted completion scope; implement and prove it before normal completion while preserving dependency and safety-gate order.

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
   - A task is materially ambiguous and no evidence-backed safe reversible interpretation exists → ask one exact clarification question
   - Progress requires an exact user-owned decision or action under the active global owner-boundary contract → provide the required self-contained owner handoff
   - The user interrupts

   A progress checkpoint, completed work cycle, green validation pass, still-open task, locally resolvable error, or blocked live/external gate is not by itself a reason to ask whether to continue. Continue safe local/offline required work, and stop only the affected action at its exact owner boundary. If implementation exposes an artifact or design mismatch but the accepted semantics are already clear, update the affected OpenSpec artifact as the smallest necessary dependency closure and continue.

8. **On completion or owner-blocked pause, show status**

   Display:
   - Tasks completed this session
   - Overall progress: "N/M tasks complete"
   - If all done after a final session-derived improvement reconciliation: report that implementation tasks are complete and archive checks are next
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
- Keep going through tasks until done, interrupted, or stopped by an exact owner boundary
- Always read context files before starting (from the apply instructions output)
- If a task is materially ambiguous and lacks a safe reversible interpretation, pause and ask one exact question
- If implementation reveals an artifact or design mismatch with already resolved semantics, update the affected artifact and continue
- Keep code changes minimal and scoped to each task
- Update a task checkbox only after its required observable proof and focused validation pass
- Persist every admitted session-derived improvement immediately and complete all such tasks before archive; never leave a non-selected candidate only in summary prose
- Do not infer RC/stable from completed task checkboxes; this command does not complete the separate archive and stable-handoff boundary
- Diagnose and correct ordinary errors and locally resolvable blockers without asking whether to continue; do not guess across an exact owner boundary
- Use contextFiles from CLI output, don't assume specific file names

**Fluid Workflow Integration**

This skill supports the "actions on a change" model:

- **Can be invoked anytime**: Before all artifacts are done (if tasks exist), after partial implementation, interleaved with other actions
- **Allows artifact updates**: If implementation reveals an artifact or design mismatch, update the affected artifacts when accepted semantics are already clear; ask only for an exact owner-owned decision
