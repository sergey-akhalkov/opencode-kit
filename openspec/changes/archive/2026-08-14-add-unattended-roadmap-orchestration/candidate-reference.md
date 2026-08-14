# Candidate Reference

## Identity

- Candidate: `roadmap-current-6b4-marker`
- Development stage at freeze: `MVP`
- Environment: Windows, Node `v24.18.0`, OpenCode `1.18.18`, OpenSpec
  `1.6`-compatible CLI, profile `quality-independent`, model
  `openai/gpt-5.6-sol`, variant `xhigh`.
- Shared process boundary: `global/bin/portable-process.ts`, SHA-256
  `6b4bd770a56c6e3dbaba5586358e9683eec1c08451f7444c0351abbf62f7769b`.
- Mission/archive/workflow source hashes are frozen in
  `evidence/roadmap-provider-r4/raw.json:124-137`.

## Integrated Runtime Proof

- Configured-provider raw bundle:
  `evidence/roadmap-provider-r4/raw.json`, SHA-256
  `3e7c192cc3f182fbf1f9f9bcd22dd3819bc242d243593d70ccee8a618d40e947`.
- Terminal evaluator:
  `evidence/roadmap-provider-r4/evaluation.json`, SHA-256
  `ddecac295ac8e5829bdb6351407935df8c731668e7a4bd01b3a56c165cf2a785`.
- Current provider-free loader/preflight:
  `evidence/roadmap-provider-preflight-r5/`.
- Current real-OpenSpec deterministic simulation:
  `evidence/roadmap-provider-simulate-r3/`.
- Current fake/no-model controller/checkpoint proof:
  `evidence/roadmap-controller-r16/`.
- Guard/readiness/permission dependencies:
  `evidence/guard-long-run-r6/`, `evidence/guard-restart-r17/`,
  `evidence/guard-permissions-r2/`, and `evidence/project-readiness-r4/`.

## Observed Result

- Three configured-provider commands completed in two sessions; both sessions were
  deleted with exit `0`.
- One local recoverable failure occurred before inference; persisted recovery
  advanced attempts `1 -> 2` without resetting across controller processes.
- Changes A and B were authored, validated, archived exactly once, and checkpointed
  with distinct identities.
- State replay is current and valid at sequence/transition count `17`, with writer
  status clear.
- Change C remained absent because its protected effect blocked before executor.
- Provider, controller, session, and disposable fixture cleanup are complete.

## Test-Only Challenge Scope

- Fresh SDET owns current critical challenge and the already-admitted test-only
  migrations `I1` and `I3`.
- Allowed test writes are limited to
  `tools/test-contracts-change-ready-delivery.ts`,
  `tools/test-helpers/library.ts`,
  `tools/test-session-completion-guard.ts`, and
  `tools/test-install-opencode-global.ts`, plus the actual portable-process oracle
  owner `tools/test-library/portable-workflow-tools.ts`.
- Production, proof runners, configuration, OpenSpec, evidence, package scripts,
  and instructions are frozen during the challenge.

## Boundaries

- No install, activation, target-project mutation, push, remote state, credential
  change, hardware contact, deployment, release, or publication occurred.
- Target mission selection and execution require a new process plus separate owner
  authorization after local qualification.
