## Context

The global compaction contract already produces an evidence-based six-cell improvement matrix, but its follow-up contract selects at most one action and leaves other candidates in prose. `history.md` durably records failed strategies, while `tasks.md` is the existing executable and archive-enforced source of implementation completion. The smallest coherent change is therefore to route admitted improvements into `tasks.md`, not add another backlog or state store.

The admission gate remains strict: observed evidence, a direct causal link to the original goal, local and reversible implementation, low cost, and no scope expansion. This distinguishes required session-derived work from speculative polish and unrelated debt.

## Goals / Non-Goals

**Goals:**

- Persist every admitted improvement in the active change before substantial work continues.
- Make each entry understandable without reconstructing the chat or compaction summary.
- Use the existing unchecked-task archive gate to prevent false completion.
- Preserve candidates across compaction when the compactor cannot write.
- Keep exact owner decisions and protected boundaries fail-closed.

**Non-Goals:**

- Build a semantic recommendation classifier or a second task database.
- Auto-admit generic best practices, reviewer preferences, or unrelated `opencode-kit` ideas.
- Let a working-repository change mutate another repository or cross a protected boundary without authority.
- Retroactively rewrite unrelated active or archived changes that have no admitted improvement.

## Decisions

### 1. `tasks.md` is the single durable execution owner

An admitted improvement becomes an unchecked item under `## Session-Derived Improvements`. The entry carries `Trigger/Evidence`, `Why`, `Prerequisites`, `Scope/Non-Goals`, `Implementation`, `Observable Proof`, and `Validation`; add `Owner Blocker` only when the active change cannot legally or technically own the work.

Alternative: keep the matrix as a continuation backlog. Rejected because it reproduces the observed loss: candidates remain visible but are not execution-owned or archive-blocking.

Alternative: create `improvements.md`. Rejected because the current archive path already enforces `tasks.md`, and a second lifecycle ledger would require synchronization and another gate.

### 2. Persistence happens at admission, with a compaction fallback

The main session appends the task as soon as a candidate passes admission. Automatic compaction cannot call tools, so it emits `Pending Improvement Tasks` with the same fields. The next active session persists all entries before substantial work and removes no pending candidate without evidence.

### 3. Admission does not grant new authority

If the candidate targets another repository, changes accepted outcome, or crosses a protected boundary, the active change records the exact ownership/decision blocker. It cannot silently implement or discard that candidate, and normal completion waits for the owner to authorize a scoped implementation path or explicitly change the accepted scope.

### 4. Existing task completion is the deterministic close gate

Once persisted, an improvement stays unchecked until implementation, observable proof, and validation are current. The existing archive helper already fails on unchecked tasks. Instruction contracts additionally require a final reconciliation before apply completion and archive invocation because no deterministic parser can infer unrecorded semantic recommendations from chat.

### 5. Behavior proof uses the real fresh-session loader

Use one identical non-sensitive synthetic continuation before and after the instruction change through `opencode run`, with tools denied. The oracle checks whether the response requires all admitted candidates to be persisted as structured unchecked tasks and completed before archive. Static contract tests check exact required/forbidden policy markers but do not claim model compliance.

**Fidelity ladder:** Rung 1 is static contract/OpenSpec validation; Rung 2 is a fresh loaded OpenCode session over a synthetic active-change continuation; Rung 3 would be observation during a later real project change and is outside this bounded implementation.

**Current Rung:** Rung 1 plus pre-change Rung 2 baseline.

**Next Real Boundary:** Candidate Rung 2 fresh session with the identical model, prompt, tool denial, and repository loader.

**Blocker/Unblocker:** No external blocker. A red baseline/candidate route or inability to distinguish task-persistence behavior blocks retention of the policy edit.

**Authorization:** One baseline and one candidate configured-provider call under standing bounded synthetic-model authorization.

**Safeguards:** Non-sensitive synthetic change, all mutation/question/shell/task tools denied, no remote or repository effects, exact invocation preserved.

**Restoration/Cleanup:** The session writes no project files; the OpenCode session may remain as local runtime evidence and can be deleted after capture if the CLI exposes safe correlation.

**Expected Immutable Evidence:** Baseline and candidate invocation, route, exit status, assistant output, source diff/hash, focused contract results, OpenSpec validation, and final task checkoff.

## Risks / Trade-offs

- [Instruction-only discovery can miss a candidate] -> Require explicit compaction fallback fields and validate the model-facing contract through a fresh loaded session; report this residual limitation honestly.
- [Mandatory improvements could create endless polish] -> Keep the existing strict admission gate and prohibit speculative, scope-expanding, unrelated, or high-cost entries.
- [Cross-repository recommendation lacks an owning change] -> Record an exact owner/target blocker; do not mutate another repository or falsely complete the current change.
- [Long task entries increase context] -> Use one fixed compact field set and references to evidence instead of copying full logs.
- [Concurrent dirty edits overlap global/apply surfaces] -> Preserve the existing owner-only pause changes and add only orthogonal policy text.
