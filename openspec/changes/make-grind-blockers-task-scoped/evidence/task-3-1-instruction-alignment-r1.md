# Task 3.1 Instruction Alignment Evidence R1

## Outcome

- Task: `3.1`
- Result: `complete` at the provider-free loaded-source and deterministic-contract boundary only.
- Candidate: `grind-task-scoped-instruction-alignment-r1`
- Environment: `windows-node-24.18.1-bun-1.4.0-provider-free-instruction-r1`
- Required boundary: `loaded-instruction-source-contract`
- Installed OpenCode proof: not run and not implied; task `4.1` remains the next installed boundary.
- Claim disposition: `GRIND-TSB-001` remains `unknown` with `0/20` installed population observations.

## Canonical Owner And Deltas

| Surface | Task 3.1 disposition |
|---|---|
| `global/AGENTS.md` | Complete canonical grind rule: controller-derived runnable accepted items are mandatory before a product decision or waiting; non-product gates remain scoped; ordinary non-grind handoff remains unchanged. |
| `global/agents/session-completion-arbiter.md` | Hidden-role delta and exact verdict-v2 JSON transport; removed schema-v1/global `owner_required` wording. |
| `global/skills/change-ready-sdlc/SKILL.md` | Qualification delta pointing to the canonical global rule while retaining separate protected-action authority. |
| `global/skills/openspec-apply-change/SKILL.md` | Apply delta requiring drain outside a blocked dependency cone. |
| `templates/project/AGENTS.md`; `instructions/reusable-project-agent-instructions.md` | Concise global-authority pointers only. |
| `global/opencode.json.template` | Compaction delta preserving frontier generation, runnable items, scoped gates, parked decisions, and the exact next disposition. Finite `maxCycles: 100` remains unchanged. |

## Observable Proof

- The arbiter contract emits schema version `2`, exact frontier correlation, and the enforced `allow_stop | continue | product_decision_required | user_paused | waiting` vocabulary.
- Contract mutation checks reject the superseded arbiter `owner_required`, optional `MAY continue` on canonical/delta surfaces, missing runnable-item selection, and missing v2 frontier fields.
- The runtime template contract retains finite `maxCycles: 100` while compaction preserves task-scoped state; no process budget is presented as owner scope.
- The canonical global rule keeps product decisions empty-frontier-only, routes exhausted non-product gates to question-free waiting, and states that no protected action receives authority from process continuation.
- Ordinary non-grind self-contained owner handoff and human interruption remain explicit.

## Validation

- `node tools/test-contracts.ts` -> exit `0`, `OK: contracts tests=73`.
- `npm run test:focused:instruction-context` -> exit `0`, `OK: instruction context quality tests=15`.
- `npm run test:focused:session-completion-guard` -> exit `0`, `OK: session completion guard tests=54`.
- `npm run test:focused:session-plugin` -> exit `0`, `OK: session env plugin tests=18`.
- `npm run validate:strict` -> exit `0`, `OK: skills=34 agents=22 markdown=1029 warnings=0 infos=2`.
- `npm run instruction:inventory -- --format json` -> exit `0`; context quality `status=passed`, `safeFixes=[]`, `deterministicErrors=[]`, `artifacts=79`, `tokenProxy=111143`.
- Installed OpenSpec JavaScript entry `validate make-grind-blockers-task-scoped --strict` -> exit `0`, `Change 'make-grind-blockers-task-scoped' is valid`.
- `npm run openspec:gate -- --operation apply --change make-grind-blockers-task-scoped` -> exit `0`, `status=warning` only because broad installed claim closure remains intentionally unknown.
- `git diff --check` -> exit `0`; Windows line-ending conversion notices only.
- `git diff --quiet -- global/opencode.json` -> exit `0`; the active gitignored machine config was not edited.

## Fresh Corrected-Candidate Review

- Instruction artifact review `ses_fb0c0f30dffeVJuwiErEwq7bDp`, Effective Model `xai/grok-4.6`, Candidate `grind-task-scoped-instruction-alignment-r1`, returned `no-material-finding`.
- Main disposition: no correction authorized. The reviewer confirmed canonical-versus-delta placement, exact v2 transport, product/non-product separation, ordinary-mode preservation, finite cycle containment, synthetic-answer prohibition, and static-evidence ceiling.
- Residual evidence gaps remain task-scoped: installed task `4.1` is unobserved; structural markers do not prove loaded model behavior; the compaction prompt remains a long JSON string but its required tokens are checked deterministically.

## External Effects And Cleanup

- Provider calls: `0`.
- Network requests: `0`.
- OpenCode install, activation, start, or restart performed by task 3.1: `0`.
- Repository commit, push, release, deployment, or remote effects: `0`.
- No disposable runtime state was created.

## Claim Ceiling And Next Boundary

This evidence supports task `3.1` only for current source alignment, deterministic mutation-sensitive contracts, strict schema validation, and provider-free component compatibility. It does not prove loaded main/arbiter behavior, installed compaction behavior, an installed OpenCode question lifecycle, roadmap/campaign composition, authorization containment, any `GRIND-TSB-001` member, SDET, or archive readiness. The next implementation task is `3.2`; the next installed root boundary remains task `4.1`.
