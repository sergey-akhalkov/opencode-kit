# Task 1.1 - Provider-Free Fixture And Inventory

## Outcome

The maintained `pre-escalation-recovery.ts` proof owner now includes the exact
checked-but-unmet outcome scenario plus achieved-outcome, explicit-pause, true
owner-only, and unchanged-live-repetition controls. The checked scenario owns two
exact local commands: one reopens the synthetic checked task and one resolves
`bin/openspec-operation-gate.ts` from `OPENCODE_CONFIG_DIR`. No product, external,
protected, provider, or target-repository effect occurs in preflight.

## Inventory

- Canonical mission/attempt authority: `global/AGENTS.md`.
- Material detail: `global/skills/change-ready-sdlc/SKILL.md`.
- Completion arbitration: `global/agents/session-completion-arbiter.md` and the
  existing completion-guard owners recorded in `preflight.json`.
- OpenSpec lifecycle mirrors: canonical propose/apply/archive skills and commands.
- Portable helper: `global/bin/openspec-operation-gate.ts`.
- Active source identity: `OPENCODE_CONFIG_DIR=<kit>/global`.
- Existing primary behavior runner: `tools/proofs/pre-escalation-recovery.ts`.
- Existing installed guard runner: `tools/proofs/session-completion-guard-autonomous.ts`.
- Structural marker owners: `tools/validators/active-authority.ts`,
  `tools/validators/devkit-contract.ts`, and focused contract/library tests.
- Current instruction inventory: 58 artifacts, 4,671 lines, 401,435 characters,
  100,380 token proxy; `global/AGENTS.md` is the largest loaded instruction source
  at 329 lines and 16,642 token proxy.

## Proof

- `node tools/proofs/pre-escalation-recovery.ts --help`: exit `0`; lists all 13
  scenario ids and effect-free modes.
- Provider-free preflight command used create-new root
  `evidence/task-1-1-preflight-r1`: exit `0`, `modelCalls=0`, `scenarios=13`,
  `cleanup=removed`, `failure=null`.
- `preflight.json` records exact prompt, fixture, permission, tool-policy, source,
  model/profile, loader, credential-count, MCP-disablement, and cleanup facts.
- Checked-unmet fixture records both exact commands allowed, a non-null task hash,
  and active helper/source hashes.
- `npm run test:focused:contracts`: passed, `68/68`.
- `openspec validate replace-fixed-attempt-stops-with-outcome-continuation --strict`:
  passed.

## Limits

This task proves fixture/oracle preparation only. It does not prove current model
behavior, completion-guard continuation, or candidate improvement. Those remain
tasks 1.2 and 3.1-3.2.
