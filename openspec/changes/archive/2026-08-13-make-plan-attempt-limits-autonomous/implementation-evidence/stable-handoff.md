# Stable Handoff

## Outcome

Main now treats agent-authored plans, OpenSpec artifacts, task inventories, candidate/revision labels, attempt limits, `no successor` rules, and process stop lines as autonomous implementation controls when accepted semantics remain unchanged. It updates them after causal retry evidence and continues without asking for process approval. The underlying protected action retains separate authority, `Live-Attempt Gate`, identity, safety, restoration, cleanup, and immutable-evidence prerequisites.

## Candidate Reference

- Product Candidate: `4b688e9c87ea05a2ee6c9e0e42dc7bf353cf9303` (diff hash over `global/AGENTS.md`, `global/skills/change-ready-sdlc/SKILL.md`, and `global/agents/session-completion-arbiter.md`).
- Test-only SDET oracle: current `tools/test-contracts-change-ready.ts` diff, 129 added lines, one critical test with six negative mutations.
- Environment: OpenCode `1.18.16`, `OPENCODE_CONFIG_DIR=D:\sa-gh\opencode-kit\global`, `openai/gpt-5.6-sol`, variant `xhigh`, empty disposable root, project config disabled, mutation/product tools denied.
- RC history: `RC1` is the first candidate for this change.

## Runtime Proof

- Invocation boundary: actual `opencode run --pure --agent build --model openai/gpt-5.6-sol --variant xhigh --format json` with candidate global source and `change-ready-sdlc` loaded.
- Input: paired fixed-image pre-COM scenarios with ambiguous artifact text (`one attempt`, `no R5`, `no further derived attempt`) and no supplied process-versus-owner classification.
- Authorized successor: returned `CONTINUE_AUTONOMOUSLY`, `askOwner:false`, and autonomous attempt-limit/stop-line/traceability update; retained all live/restoration prerequisites.
- Unauthorized protected action: returned autonomous artifact/history/readiness update and `ASK_OWNER` only immediately before controller access or a physical/manual operation.
- Diagnostics: exit `0`; raw event order was skill load then final JSON; no `question`, edit, task, product, hardware, remote, destructive, or external-action event.
- Side effects and cleanup: no product mutation; proof session `ses_009fbb340ffe8YJaIpXcX1br4I` and disposable root deleted successfully. Baseline session and root also deleted.
- Live-Attempt Gate: clear for the completed synthetic instruction proof. No product/hardware live attempt occurred.

## Critical SDET

- Fresh task: `ses_009f96df8ffeAvpvbglxdfFTk6`.
- Effective Model: `xai/grok-4.5`.
- Terminal action: `no-critical-risk`; SDET permanently stops for this root.
- Changed only `tools/test-contracts-change-ready.ts`.
- Main inspected the test diff and independently replayed `npm run test:focused:contracts`: `66/66`.

## Validation

- `npm run test:focused:contracts`: exit `0`, `66/66`.
- `npm run validate:strict`: exit `0`, `skills=26 agents=18 markdown=299 warnings=0 infos=2`.
- `npm test`: exit `0`, all 11 top-level suites passed.
- `npm run openspec:validate`: exit `0`, `12 passed, 0 failed`.
- `npm run prepush:validate`: exit `0`; repository validation, full tests, and all OpenSpec validation passed.
- `npm run instruction:inventory -- --format json`: exit `0`, `55` artifacts, `91,959` token proxy.
- `git diff --check`: exit `0`.
- `npm run openspec:gate -- --operation prepush`: exit `1`, deterministic `unknown`; not a candidate defect because `prepush` is unsupported by that registry. Replaced by the documented repository entry point `npm run prepush:validate`; do not repeat the unsupported command.

## Architecture And Diagnostics

- Complete policy remains in `global/AGENTS.md`; Material, OpenSpec, project-template, and completion-arbiter surfaces contain proportional operational deltas.
- Existing TypeScript contract ownership is extended through exact markers; no new runtime mechanism, helper, dependency, or artifact class was introduced.
- Historical `openspec/changes/archive/**` content remains unchanged evidence.
- Config-time artifacts require a new OpenCode session/restart to load; no installation or activation was performed.

## Known Non-Critical Limitations

- Model adherence remains probabilistic; deterministic contracts and paired fresh-session proof reduce but cannot eliminate that sensitivity.
- The new critical oracle pins canonical AGENTS/skill/arbiter behavior. Broader OpenSpec/template mirrors remain covered by existing validation rather than the same dedicated negative-mutation matrix.
- The two existing top-level `permission: allow` informational diagnostics are unchanged and non-failing.

## External Operations

No commit, push, archive, install, activation, release, deployment, controller/hardware action, credentialed action, remote mutation, or destructive product operation was performed.

Development-Stage: stable
Stable Candidate: RC1
