# Pre-Change Baseline

Captured: 2026-07-21

## Candidate And Overlap

- Git branch: `main`
- Git HEAD: `0aed9fb7d485be755621a6dce560a3e9d523127e`
- HEAD summary: `feat(workflow): make Change-Ready outcome-first`
- Tracked runtime/support diff before implementation: none.
- Untracked scope before implementation: `openspec/changes/make-main-author-runtime-proof-first/` only.
- Active changes: `make-main-author-runtime-proof-first` (`0/53`) and `integrate-continuous-sdlc-learning` (`0/41`).
- Confirmed overlap: `global/AGENTS.md`, `global/skills/change-ready-sdlc/SKILL.md`, SDET/reviewer roles, instruction validators, and focused tests.
- No task in `integrate-continuous-sdlc-learning` was checked and no overlapping tracked mutation was present. No concurrent writer was dispatched by this session.
- Serial integration order: implement `make-main-author-runtime-proof-first` first. Mutation for `integrate-continuous-sdlc-learning` remains blocked until this writer is terminal and that change is revised against a fresh readable post-change Candidate Reference.
- Migration authority: this active session continues to obey the pre-change loaded Material policy. Main-first authorship is not self-authorized and becomes testable only in a fresh isolated process loading the post-change candidate.

## Instruction Inventory

Command: `npm run instruction:inventory -- --format markdown`

- All inventoried artifacts: 55
- All lines: 4,507
- All characters: 368,626
- All token proxy: 92,176
- Runtime artifacts (`agent | skill | instruction`): 51
- Runtime characters: 307,184
- Runtime token proxy: 76,815
- `global/AGENTS.md`: 48,289 characters; token proxy 12,073
- Prospective changed runtime corpus: 25 artifacts; 204,270 characters; token proxy 51,079

Prospective changed runtime paths:

- `global/AGENTS.md`
- `global/agents/code-quality-reviewer.md`
- `global/agents/deployment-config-reviewer.md`
- `global/agents/dream-team-implementer.md`
- `global/agents/dream-team-reviewer.md`
- `global/agents/final-candidate-reviewer.md`
- `global/agents/implementation-readiness-reviewer.md`
- `global/agents/implementation-worker.md`
- `global/agents/instruction-artifact-reviewer.md`
- `global/agents/legacy-client-compatibility-reviewer.md`
- `global/agents/legacy-evidence-reviewer.md`
- `global/agents/openspec-architecture-reviewer.md`
- `global/agents/performance-reliability-reviewer.md`
- `global/agents/protocol-api-reviewer.md`
- `global/agents/rust-concurrency-reviewer.md`
- `global/agents/sdet-quality-engineer.md`
- `global/agents/session-delivery-reviewer.md`
- `global/agents/test-coverage-reviewer.md`
- `global/agents/wire-protocol-reviewer.md`
- `global/skills/change-ready-sdlc/SKILL.md`
- `global/skills/merge-request-author/SKILL.md`
- `instructions/leaf-reviewer-agent-contract.md`
- `instructions/porting-checklist.md`
- `instructions/reusable-project-agent-instructions.md`
- `instructions/universal-development-loop.md`

## Validation Baseline

- `npm run validate`: passed; `skills=24 agents=18 markdown=163 warnings=0 infos=1`.
- `npm test`: passed; library tests 323 plus every subsequent project test suite passed.
- `npm run openspec:validate`: passed; 9 items, 0 failures.
- Existing non-blocking runtime warning: Node reparses copied plugin TypeScript as ESM because `global/package.json` does not declare `type: module`.

## Execution Capability Baseline

| Role/adapter | Direct local execution | Resumable raw-output parent route | Baseline classification |
| --- | --- | --- | --- |
| Main | yes | N/A | eligible for direct runtime proof, but pre-change Material policy does not authorize main as this attempt's production author |
| `implementation-worker` | no (`permission.bash: deny`) | task continuation is mechanically available, but the current prompt requires a one-way proof-procedure handoff | ineligible for complete runtime-proven behavior until its prompt/route changes |
| `dream-team-implementer` | no (`permission.bash: deny`) | Temporal parent runs a configured validation command after edits, but current kit contract does not return raw proof and resume the same author | provisional implementation checkpoint only |
| `sdet-quality-engineer` | no (`permission.bash: deny`) | current prompt requests procedures for main and has no raw-output continuation contract | ineligible for independent black-box execution |
| Dream Team review parent | validation/review workflow only | not a production-author runtime-proof continuation in current kit evidence | not a substitute for author-owned proof |

## Effective Model Baseline

- Active main session: `openai/gpt-5.6-sol` (session evidence); `global/opencode.json` has no top-level default model.
- `implementation-worker`: `xai/grok-4.5`, `high`.
- `dream-team-implementer`: `xai/grok-4.5`, `high`.
- Fifteen explicit read-only reviewer/delivery roles: `openai/gpt-5.6-sol`, `xhigh`.
- `sdet-quality-engineer` and `final-candidate-reviewer`: inherit session model; fixed model/variant is currently rejected by validators.
- Dream Team review environment: `openai/gpt-5.6-sol`, `xhigh`.
- `troubleshooter`: `openai/gpt-5.6-sol`, `xhigh`.
- `qwen-local-worker`: `qwen-local/Qwen3.6-35B-A3B-UD-IQ4_XS.gguf`.
- Current qualification handoffs expose an effective-model field for SDET but do not deterministically prove the complete requested matrix or reject every silent runtime fallback. This is a baseline capability gap.

## Production Adapter Attempt

- Attempted the local `dream_team_implement` adapter with explicit `openai/gpt-5.6-sol`, `variant: xhigh`, exact target files, no test scope, and `npm run validate` parent validation.
- Adapter result: generic `implement tool failure`; no workflow/task identity or implementation report was returned.
- Immediate workspace inspection found no tracked mutation.
- `temporal workflow list --address localhost:7233 --namespace default --query 'ExecutionStatus="Running"' --output json` returned an empty list.
- Writer closure: terminal/no running Temporal workflow and no attributed tracked mutation. A fallback writer may proceed safely.
- Bootstrap fallback: use the pre-change configured `implementation-worker` even though its current fixed model is Grok/high. This does not count as post-change model evidence; fresh post-change execution must prove GPT production routing before RC assignment.
