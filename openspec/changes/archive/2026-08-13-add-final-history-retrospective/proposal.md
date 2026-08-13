## Why

Compaction already turns evidence from one session into concrete `Session-Derived Improvements`, but an OpenSpec change can span several sessions and accumulate additional evidence in `history.md`. Without one explicit end-of-change pass over that complete journal, useful change-wide improvements can remain unexamined even though the existing compaction analysis and task-persistence mechanism can execute them.

## Outcome Capsule

- **Outcome**: Every newly proposed OpenSpec change receives exactly one initially-last `tasks.md` item that, after the preceding planned work, applies the existing compaction improvement analysis to the complete change `history.md`, appends every admitted concrete small improvement to `tasks.md`, and immediately continues apply work until those additions are implemented and proven.
- **Operating Envelope**: OpenSpec changes created through the maintained propose command or skill, with a writable `tasks.md` and `history.md`, the existing compaction matrix (`Quality`, `Cycle Speed`, and `Token Economy` across `Working Repository` and `opencode-kit`), the existing improvement admission gate, and the existing `Session-Derived Improvements` task format.
- **Non-Goals**: Do not create a second retrospective algorithm, add new admission criteria, require an improvement when evidence supports `none`, re-run the final history analysis after generated tasks, analyze the current session instead of `history.md`, retrofit archived changes, build a semantic classifier, or authorize cross-repository/protected operations.
- **Non-Deferrable Invariants**: The final analysis task is inserted once only when the change is created; it is initially the last task; it cannot complete before all earlier planned tasks; it uses the same matrix, admission gate, task fields, target ownership, and authority boundaries as compaction; every admitted improvement remains unchecked until implementation, observable proof, and validation; `none` is an honest successful result; archive cannot bypass an incomplete analysis or generated task.
- **Observable Proof**: A fresh loaded `/opsx-propose` workflow creates a synthetic change whose final initial task is the history analysis. A fresh loaded `/opsx-apply` workflow given a representative `history.md` applies the same six-cell compaction contract, persists every admitted improvement in the existing format, starts that work, and does not create a second analysis task; a no-evidence history records `none`. Static contracts and strict OpenSpec validation preserve the same behavior across maintained skill/command mirrors.
- **Material Residual Risks**: Instruction-only analysis remains model-sensitive and cannot guarantee discovery of every useful improvement. A weak journal can legitimately yield `none`, while a false admission can add unnecessary work; existing evidence, causal-link, locality, reversibility, low-cost, no-scope-expansion, ownership, and proof gates contain but do not eliminate that judgment risk.
- **Stop Line**: Stop when propose creates the one final task, apply executes it from `history.md` through the existing compaction contract and immediately processes admitted tasks or `none`, archive refuses incomplete retrospective scope, maintained mirrors and normative specs agree, fresh loaded runtime proof is green, Material critical SDET is terminal, and applicable validation plus local handoff are complete. No archive, commit, push, install, activation, deployment, release, or retrospective algorithm replacement is authorized.

## What Changes

- Require OpenSpec task generation to append exactly one initially-last final `history.md` analysis item to each new change.
- Require the final item to reuse the existing compaction improvement matrix, admission gate, target ownership, and `Session-Derived Improvements` persistence format, with `history.md` as the evidence source.
- Require apply to execute admitted additions immediately and to accept an evidence-backed `none` result without inventing work or scheduling another history analysis.
- Require archive and completion routing to reject a change whose final history analysis or resulting improvement tasks are incomplete.
- Align maintained propose/apply/archive skill and command mirrors, project OpenSpec task-authoring rules, normative specs, and focused deterministic contracts.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `library-instruction-artifacts`: Require the loaded OpenSpec author/apply/archive surfaces to generate and execute one final history-based instance of the existing compaction improvement analysis.
- `library-spec-workflow-integrity`: Require every new change to own the final task and prevent completion or archive before its analysis result and generated tasks are complete.

## Impact

Affected surfaces include `.opencode/skills/openspec-{propose,apply,archive}-change/SKILL.md`, their `.opencode/commands/opsx-*.md` mirrors, OpenSpec project task-authoring rules, current normative specs, and focused instruction-contract tests. The change adds no dependency, public product API, persisted-data migration, credential, remote action, or deterministic semantic classifier. Running OpenCode sessions will continue using previously loaded instruction artifacts until restarted; runtime proof uses fresh processes.
