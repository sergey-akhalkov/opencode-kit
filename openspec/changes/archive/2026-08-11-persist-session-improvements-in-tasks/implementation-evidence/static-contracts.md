# Static Contract Evidence

## Candidate Surfaces

- `global/AGENTS.md`: immediate all-candidate persistence, fixed task fields, compaction fallback, safety-order preservation, and pre-archive completion.
- `.opencode/skills/openspec-apply-change/SKILL.md` and `.opencode/commands/opsx-apply.md`: provisional `all_done`, pre-work reconciliation, immediate in-session append, and final reconciliation.
- `.opencode/skills/openspec-archive-change/SKILL.md`: pre-helper reconciliation and return-to-apply behavior.
- `global/skills/change-ready-sdlc/SKILL.md`: admitted improvements are accepted active-change scope.
- `openspec/config.yaml`: task-authoring field contract.

## Validation

- `npm run test:focused:contracts`: final pre-SDET exit `0`, `OK: contracts tests=64`; the production-authored session-improvement test was removed before this run because Material automated-test authorship belongs to fresh SDET. Existing contract coverage remains the focused regression boundary.
- `npm run validate:strict`: exit `0`, `OK: skills=26 agents=18 markdown=284 warnings=0 infos=2`.
- `openspec validate persist-session-improvements-in-tasks --strict`: exit `0`, change valid.
- `git diff --check`: exit `0`.

The first strict run correctly rejected an OpenSpec-specific token in the portable `change-ready-sdlc` skill. The candidate was narrowed to the project-neutral phrase `active change's tasks.md`; the validator and existing focused contracts then passed without weakening the portability check.
