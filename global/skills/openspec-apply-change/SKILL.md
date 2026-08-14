---
name: openspec-apply-change
description: Implement tasks from an OpenSpec change. Use when the user wants to start implementing, continue implementation, or work through tasks.
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

   Resolve the current project root and the active kit global source explicitly. Run the portable gate from that source; do not require a target-project package script.
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
   - If `state: "all_done"`: treat it as provisional until session-derived improvements are reconciled; suggest archive only when none must be added
   - Otherwise: proceed to implementation

5. **Read context files**

   Read every file path listed under `contextFiles` from the apply instructions output.
   The files depend on the schema being used:
   - **spec-driven**: proposal, specs, design, tasks
   - Other schemas: follow the contextFiles from CLI output

   Read `<changeRoot>/history.md` before substantial work. If it is missing, create it with `# Strategy History` and no invented attempts. Reconcile any `Pending Strategy History` entries from compaction before continuing.

   Reconcile every record from the current session, `Pending Improvement Tasks`, and `Deferred Improvement Candidates` before substantial work. An admitted item needs an exact remaining current-change consumer; append every such owned item as an unchecked task under `## Session-Derived Improvements`. Persist evidence-backed no-current-consumer items as non-checkbox `Deferred Improvement Candidate` records in `history.md`; they are not accepted scope and do not block completion. Never retain only the highest-ROI item or silently drop another valid record.

   Every admitted or deferred record must state `Impact Horizon`, `Concrete Consumers`, `Execution Class`, `Earliest Safe Point`, `Invalidated Evidence`, `Observable Payback`, `Trigger/Evidence`, `Why`, `Prerequisites`, `Scope/Non-Goals`, `Implementation`, `Observable Proof`, and `Validation`, plus `Owner Blocker` only when applicable. `Impact Horizon: Working Repository` is admissible only when this change consumes and proves an existing shared owner and at least one other exact repository consumer is evidenced; name but do not mutate that other consumer. If a required current dependency belongs to another repository, expands accepted outcome, or crosses a protected boundary, record the exact blocker and stop only that dependency chain.

   If `tasks.md` contains the creation-authored final-history-retrospective task, keep it ineligible until every other currently known task is complete. Its absence in an older change does not authorize apply or archive to retrofit it.

6. **Show current progress**

   Display:
   - Schema being used
   - Progress: "N/M tasks complete"
   - Remaining tasks overview
   - Dynamic instruction from CLI

7. **Implement tasks (loop until done or owner-blocked)**

   After live-attempt and non-deferrable safety blockers, order admitted improvements by `Execution Class`: `gate-closer`, `do-now`, `before-task-<id>` before its first named consumer, and `before-freeze` before qualification. Dependency, authority, and `Invalidated Evidence` facts may delay execution; physical placement under `## Session-Derived Improvements` may not. `separate-change` records stay deferred.

   For each pending task in that effective order:
   - Show which task is being worked on
   - Make the code changes required
   - Keep changes minimal and focused
   - Run the task's stated observable proof on the current candidate
   - Run its applicable focused validation, or record the exact reasoned manual/external gate
   - Mark the task complete only after required proof and validation pass: `- [ ]` → `- [x]`
   - Continue to next task

   When an improvement candidate becomes admissible during implementation, append it immediately using the same section and fields. It is accepted completion scope; implement and prove it at its earliest safe consumer boundary. Preserve a no-current-consumer candidate in `history.md` instead of adding a checkbox.

   When the creation-authored final-history-retrospective task becomes the only remaining task:
   - Analyze the complete change `history.md` exactly through the canonical compaction improvement contract: rows `Quality`, `Cycle Speed`, and `Token Economy`; columns `Working Repository` and `opencode-kit`; each cell contains evidence, smallest cheap improvement, expected benefit, and cost/risk, or `none`.
   - Use the accepted change outcome as `Original User Goal` and use the complete journal, not the current session, as evidence. Apply the existing observed-evidence, causal-link, local/reversible, low-cost, no-scope-expansion, target ownership, protected-boundary, and instruction-workflow-comparison rules without adding another algorithm.
   - Classify each evidence-backed candidate with the canonical impact, consumer, execution, safe-point, invalidation, and payback fields. Append every admitted current-consumer candidate under `## Session-Derived Improvements`; preserve every no-current-consumer candidate as a non-checkbox deferred history record. Record generated task IDs and deferred record IDs in the retrospective evidence, mark the analysis complete once its result is persisted, and immediately continue the normal apply loop until every generated admitted task is implemented and proven.
   - If no admitted or deferred candidate passes, record `none`, mark the task complete, and create no improvement. Never create another final-history-retrospective task or rerun this analysis after generated work.

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

   A progress checkpoint, completed work cycle, green validation pass, still-open task, locally resolvable error, or blocked live/external gate is not by itself a reason to ask whether to continue. Continue safe local/offline required work, and stop only the affected action at its exact owner boundary. If implementation exposes an artifact or design mismatch but the accepted semantics are already clear, update the smallest coherent proposal/design/spec/tasks/history set and continue. This includes reopening or adding tasks and changing agent-authored candidate/revision labels, attempt limits, `no successor` rules, and process stop lines after causal correction and a satisfied retry/`Live-Attempt Gate`; never ask whether to expand the change for those controls. Updating them does not authorize the underlying protected action.

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

## Output Contract

Return the change/schema identity, completed and remaining task counts, current Runtime Proof and validation evidence, exact owner blocker or `none`, and the current `Development-Stage` without inferring RC/stable from checkboxes.

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
- Execute a creation-authored final-history retrospective exactly once from complete `history.md`; accept `none`, immediately process admitted tasks, and never synthesize the task for a pre-policy change
- Do not infer RC/stable from completed task checkboxes; this command does not complete the separate archive and stable-handoff boundary
- Diagnose and correct ordinary errors and locally resolvable blockers without asking whether to continue; do not guess across an exact owner boundary
- Use contextFiles from CLI output, don't assume specific file names

**Fluid Workflow Integration**

This skill supports the "actions on a change" model:

- **Can be invoked anytime**: Before all artifacts are done (if tasks exist), after partial implementation, interleaved with other actions
- **Allows artifact updates**: If implementation reveals an artifact or design mismatch, update the affected artifacts, tasks, revisions, attempt limits, and stop lines when accepted semantics are already clear; ask only for changed accepted semantics or the exact underlying protected action
