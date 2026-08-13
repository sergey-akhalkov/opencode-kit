# Accepted-Scope Edge Cases

| Case | Enforced owner | Evidence / disposition |
|---|---|---|
| Exactly one retrospective | Propose skill/command and global authority | Fresh disposable `tasks.md` has one ordinary task and one retrospective; source forbids later creation. |
| Initially last physical task | Propose skill/command | Fresh disposable `tasks.md` line 7 is the second and last checkbox. |
| Later compaction-derived work | Apply skill/command | Retrospective remains ineligible until every other currently known task is complete, regardless of later insertion order. |
| Every admitted candidate retained | Existing compaction admission and task-persistence owner | Same-model two-candidate apply proof retained both and required immediate implementation/proof/validation. |
| No evidence | Existing compaction matrix `none` semantics | Same-model no-evidence apply proof emitted six `none` cells and created no task. |
| Target ownership / protected boundary | Existing compaction owner/blocker contract | Candidate text reuses target ownership, no-scope-expansion, protected-boundary, and instruction-comparison gates; no new authority is introduced. |
| No recursive scheduling | Global authority and apply/propose clauses | Apply, archive, compaction, generated tasks, and the retrospective itself are forbidden to create another copy or rerun it. |
| No retrofit | Global authority and propose/apply/archive clauses | Only initial change authoring creates the task; older active/archived changes remain unchanged. |
| Incomplete archive | Existing deterministic unchecked-task helper plus archive routing | Retrospective and generated work are ordinary unchecked tasks; archive returns them to apply and cannot confirm past the gate. |
| Compaction unchanged | Hidden compaction config | `global/opencode.json.template` and machine-local `global/opencode.json` had no candidate diff. |
| Fresh-load boundary | OpenCode loader | All candidate behavior evidence used fresh `opencode run`; the current chat retains instructions loaded before these source edits and must be restarted before using the retained candidate. |

## Validation

- `npm run validate:strict`: exit `0`, `skills=26 agents=18 markdown=317 warnings=0 infos=2`.
- `openspec validate add-final-history-retrospective --strict`: exit `0`.
- `git diff --check`: exit `0`.
- Candidate Runtime Proof remains current because no loaded/model-facing source changed after `implementation-evidence/runtime-proof.md` was captured.
