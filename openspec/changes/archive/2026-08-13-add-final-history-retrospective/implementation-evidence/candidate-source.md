# Candidate Source Evidence

## Product Candidate

The candidate adds final-history-retrospective routing to:

- `global/AGENTS.md` as the portable authority used across projects;
- `.opencode/skills/openspec-propose/SKILL.md` and `.opencode/commands/opsx-propose.md` as creation owners;
- `.opencode/skills/openspec-apply-change/SKILL.md` and `.opencode/commands/opsx-apply.md` as execution owners;
- `.opencode/skills/openspec-archive-change/SKILL.md` and `.opencode/commands/opsx-archive.md` as incomplete-work routing;
- `openspec/config.yaml` as this repository's task-authoring rule;
- `openspec/specs/library-instruction-artifacts/spec.md` and `openspec/specs/library-spec-workflow-integrity/spec.md` as current normative owners.

No hidden compaction prompt, helper, dependency, automated test, archived change, or another project's file was changed.

## Structural Readback

- Propose creates exactly one unchecked initially-last task during new-change authoring and forbids later retrofit/duplication.
- Apply waits for every other known task, applies the canonical six-cell matrix to complete `history.md`, retains every admitted candidate with existing fields, immediately resumes work, accepts `none`, and forbids repeat scheduling.
- Archive performs no semantic analysis and relies on the existing checked-task gate after routing incomplete retrospective work back to apply.
- `global/opencode.json.template` and machine-local `global/opencode.json` have no candidate diff; compaction behavior is unchanged.

## Diagnostics

- `npm run validate:strict`: exit `0`, `skills=26 agents=18 markdown=314 warnings=0 infos=2`.
- `openspec validate add-final-history-retrospective --strict`: exit `0`.
- `git diff --check` over all candidate production/normative surfaces: exit `0`.
- `npm run test:focused:contracts`: one unrelated concurrent-candidate failure; all retrospective-adjacent existing contracts passed. Exact disposition is in `history.md`.
