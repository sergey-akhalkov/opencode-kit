# Validation Evidence

## Current Shared Worktree

- `npm run test:focused:contracts`: exit `0`, `OK: contracts tests=56`.
- Final `npm run validate:strict`: exit `0`, `OK: skills=24 agents=19 markdown=240 warnings=0 infos=2`.
- `npm run openspec:validate`: exit `0`, 10 items passed and 0 failed, including both active changes and all main specs.
- `npm run opencode:sources`: exit `0`; custom `global/AGENTS.md` and global skills were discovered. The tool reported the known host-default/custom/project config collision and explicitly did not claim precedence.
- `npm test`: shared-worktree diagnostic passed all 147 library tests and failed only `committed presets cover the exact current agent catalog` because the unrelated untracked `global/agents/session-completion-arbiter.md` is visible before its separate change has synchronized the expected profile baseline.
- Serena diagnostics: no diagnostics for `tools/contracts/skills.ts` or `tools/validators/active-authority.ts`; `routing.ts` and the SDET test reported only environment-level missing `node:` type declarations, while executable TypeScript validation/tests passed.

## Isolated Intended Candidate

Environment: disposable detached `HEAD` worktree under the approved temp root, with only this change's tracked runtime/instruction/validator/test diff applied. `README.md` was excluded because its live path also contains a concurrent unrelated agent-catalog hunk; the current shared-worktree strict validator already covered the README mirror. Dependencies were installed with `npm ci --ignore-scripts`.

- `npm run validate:strict`: exit `0`, `OK: skills=24 agents=18 markdown=215 warnings=0 infos=1`.
- `npm test`: exit `0`; the Node dot reporter printed ten green dots and no diagnostic fallback.
- Final `npm run instruction:inventory -- --format markdown`: exit `0`; 53 artifacts, 4,173 lines, 351,179 chars, token proxy 87,812. The pre-change shared baseline was 53 artifacts, 4,153 lines, 342,615 chars, token proxy 85,673. The isolated candidate delta excluding the concurrently edited README is +20 instruction lines and +2,139 token-proxy units; `global/AGENTS.md` changed from 14,575 to 14,846 token-proxy units. The canonical increase is limited because the shift-left cadence replaced the longer substitution section rather than duplicating it wholesale.
- Disposable cleanup: `git worktree remove --force <temp-worktree>` completed and the path no longer exists.

## Residual Validation Facts

- The shared worktree remains red only while the unrelated completion-arbiter catalog/profile change is incomplete; this candidate did not modify or absorb it.
- `npm ci --ignore-scripts` reported one high-severity dependency audit advisory in the existing lockfile. This change adds no dependency and did not run an unrequested audit/fix.
- The current main spec's historical instruction-context ceilings are already below the pre-change baseline. This change records the measured delta rather than claiming compliance with an already-red unautomated ceiling.
