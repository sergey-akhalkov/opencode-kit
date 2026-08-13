# Implementation Inventory

## Disposition

- Decision: `reuse`.
- Existing owner reused: `global/AGENTS.md` compaction reflection and `Session-Derived Improvements` contract.
- Reason: the accepted outcome changes invocation timing and evidence source only. It does not require another matrix, admission gate, task schema, classifier, helper, dependency, or state store.
- Cross-project reuse search: not applicable. No reusable implementation is introduced; all behavior is additive routing to an existing repository mechanism.

## Requirement Ownership

| Requirement | Production owner | Mirror / evidence owner |
|---|---|---|
| Create one initially-last task for every newly authored change | `global/AGENTS.md` portable authority plus `.opencode/skills/openspec-propose/SKILL.md` | `.opencode/commands/opsx-propose.md`; `openspec/config.yaml` task-authoring rule |
| Analyze complete `history.md` through the existing compaction contract | `global/AGENTS.md` plus `.opencode/skills/openspec-apply-change/SKILL.md` | `.opencode/commands/opsx-apply.md` |
| Persist all admitted tasks or `none`, continue immediately, never reschedule analysis | existing `Session-Derived Improvements` owner in `global/AGENTS.md` and apply surfaces | focused contract evidence and loaded command proof |
| Block incomplete completion/archive | existing unchecked-task helper plus archive skill | `.opencode/commands/opsx-archive.md` and normative workflow spec |
| Normative behavior | `openspec/specs/library-instruction-artifacts/spec.md` and `openspec/specs/library-spec-workflow-integrity/spec.md` | this change's complete delta specs |

## Preserved Concurrent Work

Before this change, the target surfaces already contained uncommitted edits from `make-plan-attempt-limits-autonomous`, including autonomous plan/task/attempt-limit handling. This change preserves those lines and adds only orthogonal final-history-retrospective clauses. It does not rewrite active or archived changes owned by another workstream.

## Planning Validation

- `npm run openspec:gate -- --operation propose --change add-final-history-retrospective`: exit `0`, status `passed`.
- `openspec validate add-final-history-retrospective --strict`: exit `0`.
- `npm run openspec:gate -- --operation apply --change add-final-history-retrospective`: exit `0`, six unchecked tasks reported before implementation.
- `openspec status --change add-final-history-retrospective --json`: all planning artifacts `done`.
- `git diff --check -- openspec/changes/add-final-history-retrospective`: exit `0`.
