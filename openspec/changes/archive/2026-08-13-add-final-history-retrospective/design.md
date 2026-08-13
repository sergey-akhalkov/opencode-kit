## Context

The kit already has one canonical semantic contract for continuous improvement. `global/AGENTS.md` requires a six-cell matrix with rows `Quality`, `Cycle Speed`, and `Token Economy` and columns `Working Repository` and `opencode-kit`; candidates use the observed-evidence, original-goal causal-link, local/reversible, low-cost, and no-scope-expansion admission gate; admitted work uses the existing `Session-Derived Improvements` fields and completion rules. The hidden compaction prompt mirrors that contract for a session and emits `Pending Improvement Tasks` because compaction cannot write files.

`history.md` has a different evidence horizon: it persists materially distinct strategies across the entire change, including sessions separated by compaction. The requested feature is not a second improvement process. It is one explicitly scheduled invocation of the existing process with the full change journal as evidence input.

OpenSpec itself scaffolds a change directory but does not author repository-specific task content. The maintained model-facing propose command/skill and loaded global authority therefore own generation of the task. Apply owns semantic analysis and task persistence. The existing unchecked-task archive gate already enforces generated work once it is on disk; archive routing only needs to preserve the final-analysis precondition and must not bypass it.

This is a loaded lifecycle-policy change and therefore follows the Material path. Current source has unrelated in-progress edits on the same instruction and normative-spec surfaces. This change adds orthogonal clauses and preserves those bytes rather than reverting or replacing them.

## Goals / Non-Goals

**Goals:**

- Add exactly one final history-retrospective task during creation of each new OpenSpec change.
- Reuse the existing compaction matrix, admission gate, task schema, ownership, and authority rules without defining another analysis algorithm.
- Run the task only after every other currently known task, including compaction-derived additions, is complete.
- Persist every admitted improvement and immediately continue the normal apply loop through implementation, proof, validation, and checkoff.
- Permit an evidence-backed `none` result without manufactured work.
- Keep incomplete analysis and generated tasks archive-blocking through existing task completion semantics.

**Non-Goals:**

- Modify the hidden compaction prompt or its analysis behavior.
- Add a semantic parser, classifier, score, recurrence counter, second ledger, cutoff protocol, sentinel, or periodic cross-change miner.
- Re-run the final history analysis after it adds tasks.
- Retrospectively insert the task into already active or archived changes.
- Change cross-repository ownership, protected-boundary authority, or the existing treatment of `opencode-kit` candidates discovered from another project.

## Decisions

### 1. Reference the canonical compaction contract instead of copying a new prompt

The final task names the exact existing matrix and says to apply the canonical compaction admission and persistence contract with `history.md` as the evidence source. The accepted change outcome remains the goal anchor. This keeps one algorithm owner while making the alternative input explicit.

Alternative: copy the complete hidden compaction prompt into propose/apply. Rejected because it would duplicate continuation, stagnation, live-attempt, and compaction-only behavior that is irrelevant to the requested history analysis and could drift independently.

Alternative: implement a TypeScript analyzer. Rejected because admission requires evidence-grounded semantic judgment, while project rules forbid deterministic helpers from inferring process effectiveness.

### 2. Propose creates one ordinary unchecked task as the initially last task

The propose skill/command must inspect the authored `tasks.md` before readiness checks and append exactly one unchecked final-history analysis item if it is not already present. The task is created only by new-change authoring; apply never creates another copy.

The task carries its own execution prerequisites and observable result. It is not a special file type or hidden state. This lets normal OpenSpec status and archive task counting remain authoritative.

Alternative: make archive synthesize the task. Rejected because that would violate the owner's creation-time requirement, hide accepted work until archive, and bypass normal apply ordering.

Alternative: change the installed OpenSpec CLI scaffold. Rejected because task content is schema/project-specific and the CLI is an external dependency rather than this kit's model-facing authoring owner.

### 3. Apply executes the final analysis once and immediately returns to generated work

Apply treats the task as eligible only when every other currently known task is complete. It reads the complete `history.md`, produces the same six-cell analysis as compaction, and uses the same candidate admission and `Session-Derived Improvements` record fields.

If candidates are admitted, apply appends every task, records their IDs in the final-analysis task evidence, checks the analysis task after persistence is complete, and immediately continues the normal loop over the new unchecked tasks. If no candidate is admitted, it records `none` and checks the analysis task. The analysis never adds another final-history analysis item and is not rerun after generated tasks.

This is sequential task expansion, not recursion: one pre-existing task performs one analysis and can create ordinary implementation tasks only.

### 4. Existing completion and archive mechanics remain the execution owner

Generated improvements use ordinary unchecked checkboxes. The deterministic archive helper already blocks any unchecked task, so it does not need semantic awareness of `history.md`. Archive skill/command clauses ensure a final-analysis task authored under this policy is not bypassed or treated as optional.

Changes created before this policy remain governed by their existing task inventory. No date parser, migration marker, or bulk edit is added.

### 5. Keep global and local loaded surfaces synchronized

The portable behavior owner is `global/AGENTS.md`, which applies while work occurs in other repositories even when those projects have generated/custom OpenSpec commands. The repository's maintained `.opencode` propose/apply/archive skill and command variants provide explicit operation-local instructions and must remain synchronized. `openspec/config.yaml` supplies the task-authoring rule for this repository and serves as the project-native example; normative specs define the reusable contract.

No other project's files are edited by this change. A running OpenCode session retains previously loaded artifacts; candidate proof therefore uses fresh processes.

### 6. Prove structure first, then loaded behavior

**Fidelity ladder:** exact source/mirror contracts and strict OpenSpec validation -> fresh loaded tool-denied baseline/candidate behavior with identical model/input/environment -> fresh loaded disposable OpenSpec workflow demonstrating generated task content and apply disposition -> later observation in another real project, outside this change.

**Current Rung:** source and current loaded command inspection before candidate mutation.

**Next Real Boundary:** same-model baseline through the actual installed `opencode run --command opsx-propose` and `opsx-apply` entry points, then candidate replay.

**Blocker/Unblocker:** no external blocker; the configured provider and fresh local OpenCode loader are available under standing bounded inference authorization. A red candidate, an invented improvement on a no-evidence journal, a missing task, or a second analysis task blocks retention.

**Authorization:** local repository edits, disposable local workflow state, and bounded non-sensitive configured-provider inference only.

**Safeguards:** deny remote/destructive/protected tools; use a disposable fixture or tool-denied scenario; preserve unrelated worktree changes; do not archive, install, activate, commit, push, or mutate another project.

**Restoration/Cleanup:** delete disposable sessions and fixture roots after preserving privacy-safe evidence; source rollback is limited to this candidate if the comparison regresses.

**Expected Immutable Evidence:** exact baseline/candidate prompts, model/loader identity, exit status, stdout/stderr, tool/effect record, generated task excerpt or structural facts, focused contract output, strict validation, and final candidate identity.

## Risks / Trade-offs

- [The model invents a task to satisfy the retrospective] -> Preserve `none` as an explicit successful result and validate a no-evidence scenario.
- [The final task runs before compaction-derived work] -> Require all other currently known tasks to be complete, regardless of physical section order.
- [Generated work causes a second history analysis] -> State that apply never creates another analysis task and that generated tasks are ordinary improvements only.
- [Instruction mirrors drift] -> Add focused exact structural contracts over global authority and all maintained propose/apply/archive skill/command surfaces.
- [Project-specific commands override the kit's local mirrors] -> Keep the portable rule in always-loaded global authority; project commands may add constraints but cannot remove the higher-level task requirement.
- [Existing active changes become unexpectedly blocked] -> Limit creation to newly authored changes and add no retroactive migration or deterministic absence gate.
- [Late admitted instruction work invalidates prior proof] -> Existing evidence-topology and Material rules apply to each generated task; mutation returns the affected candidate to `development` and generated work owns current proof/validation before archive.
- [Fresh model behavior is version-sensitive] -> Preserve the effective model and exact runtime evidence; deterministic source contracts remain the non-semantic drift guard.

## Open Questions

None. The user resolved the analysis algorithm, input source, creation timing, single invocation, immediate execution, and no-recursion semantics.
