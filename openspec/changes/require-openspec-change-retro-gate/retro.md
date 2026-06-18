# Retro: require-openspec-change-retro-gate

## Evidence Reviewed

- OpenSpec artifacts: proposal, design, specs, traceability, tasks, helper tests, and workflow skill updates.
- Tool outputs / validation: `npm run validate:strict`, `npm test`, `npm run openspec:validate`, `npm run openspec:retro-followups -- require-openspec-change-retro-gate --dry-run`, `npm run openspec:retro-gate -- require-openspec-change-retro-gate`, and `npm run openspec:gate -- --operation prepush` passed on 2026-06-18.
- Reviewer gates: `instruction-artifact-reviewer`, `test-coverage-reviewer`, `code-quality-reviewer`, and architecture consistency checks passed after fixes; second-pass instruction/code/test reviewers were clean after final fixes on 2026-06-18.
- Runtime events: active completed changes include final retrospective sections and completed retrospectives.

## What Worked

- Deterministic helper tests made the archive gate checkable instead of relying on prose only.
- Reviewer gates found wording and task-drift issues before archive.
- Existing OpenSpec artifacts made the policy easy to validate against explicit requirements.

## Problems Found

| Problem | Evidence | Impact | Root Cause | Recommendation | Confidence | Target | Follow-up Change | No Follow-up Reason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Reusable task tail implied cross-repo writes | Instruction review found mandatory `opencode-dev-kit` wording lacked approval guard | Agents in other repositories could write or imply writes across repos | The reusable template named a shared artifact owner without an explicit current-repository ownership guard | Keep the route but require current-repo ownership or local handoff without explicit cross-repo approval | high | none | none | Fixed in scope. |
| Evidence-pack determinism wording overclaimed | Instruction review found README said deterministic output while timestamps are generated | Reviewers could expect byte-identical output across runs | Documentation conflated stable schema/order with byte-identical output despite generated timestamps | Reword to stable schema and ordering plus generated timestamp | medium | none | none | Fixed in scope. |
| Active task checkboxes drifted behind evidence | Instruction review found validation and reviewer items unchecked after passing gates | Archive and next-step could surface completed work as incomplete | Task status updates were not synchronized immediately after validation and reviewer evidence was recorded | Synchronize tasks with validation and reviewer evidence | high | none | none | Fixed in scope. |
| Follow-up creation was not algorithmically enforced | User review caught that `retro.md` could be written without creating OpenSpec changes for actionable findings | Practical retro conclusions could remain prose and be forgotten before archive | The retrospective gate checked for prose evidence before a helper existed to materialize actionable follow-ups | Add `openspec:retro-followups` helper and make `openspec:retro-gate` verify referenced follow-up changes exist | high | none | none | Fixed in scope. |
| Stale machine-readable retro wording remained after Markdown rename | Instruction reviewer found `openspec/project.md` and operation-gate artifacts still referenced the old machine-readable retrospective format | Agents could recreate obsolete machine-readable retrospective requirements | Rename touched skills/README first and missed related OpenSpec docs | Synchronize root OpenSpec guide, operation-gate specs/tasks, and active task tails around `retro.md` | high | none | none | Fixed in scope. |
| Unsafe follow-up ids were not batch-preflighted | Code/test reviewers found a later unsafe follow-up id could fail after earlier safe writes | Helper failure could leave partial generated follow-up changes | Helper mixed validation, planning, and writes in one loop | Split prepare/preflight from writes and add unsafe-batch regression coverage | high | none | none | Fixed in scope. |
| Malformed Markdown findings could be silently dropped | Code reviewer found non-table prose in `Problems Found` was filtered out before validation | Actionable findings could disappear and look like no findings | Parser filtered table rows before validating section content | Require table header/separator, flag prose or malformed rows, and add missing-section/prose tests | high | none | none | Fixed in scope. |

## Token And Command Efficiency

- Repeated reads/searches: bounded by targeted `grep` and file reads after the policy gap was found.
- Large outputs: no large raw logs were required for the final gate.
- Manual synthesis: follow-up generation and gate validation now have deterministic helpers.
- Candidate automation: none beyond the implemented `openspec:retro-followups` and `openspec:retro-gate` helpers.

## Outputs

- Project follow-up changes: none.
- `opencode-dev-kit` proposals/changes: none.
- No findings reason: n/a.

## Archive Gate Decision

- Decision: passed
- Reason: Evidence reviewed, workflow wording and checklist drift fixed, reviewer rechecks clean, and validation passed.
- Approver, if skipped: none
