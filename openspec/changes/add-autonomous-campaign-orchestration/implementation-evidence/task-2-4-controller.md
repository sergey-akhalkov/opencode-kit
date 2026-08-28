# Task 2.4 Provider-Free Campaign Controller Evidence

## Outcome And Scope

- Candidate `autonomous-work-campaign-controller-r1` composes the campaign contracts,
  transition state, reviewed ledger, deterministic report, and fake-semantic phase
  input through the portable `work-campaign` entrypoint.
- The controller performs read-only Git/OpenSpec readiness checks, validates reviewed
  phase records, advances inventory/discovery/synthesis, freezes one eligible wave,
  and stops at `paused-external` before mission integration.
- `missionRef` remains `null`. No semantic provider, OpenCode session, mission launch,
  source mutation, archive, checkpoint, host registration, or host action is enabled.

## Architecture

- **Lifecycle owner:** `global/bin/work-campaign/controller.ts` composes campaign
  transitions and stop/status/replay behavior.
- **Readiness owner:** `global/bin/work-campaign/preflight.ts` performs read-only
  Git/OpenSpec/source/state checks and constructs current runtime identities.
- **Admission owner:** `global/bin/work-campaign/phase-input.ts` parses the explicit
  fake-semantic result envelope and validates exact inventory, reconciliation, report,
  path/effect, and frozen-wave correlations without inferring severity or grouping.
- The first 868-line implementation was split at these observed change axes before
  evidence capture. The project-native inventory no longer flags the controller; no
  public entrypoint, package, generic engine, or campaign/mission state coupling was
  added.

## Runtime Proof

- **Product Candidate:** the nine source files and SHA-256 values in
  `task-2-4-controller-r1/raw.json`, including the portable CLI, campaign contracts,
  controller, preflight, phase-input, materializer, state, proof runner, and focused
  controller test.
- **Proof Runner:** `npm run proof:work-campaign -- --mode controller --candidate-id
  autonomous-work-campaign-controller-r1 --evidence-root
  <task-2-4-controller-r1>`; it invokes the actual CLI in disposable Git/OpenSpec
  projects and removes the fixture before sealing evidence.
- **Environment:** Windows `win32`, Node `v24.18.1`, OpenSpec `1.11.0`.
- **Observed happy path:** clean preflight exited `0`; `run` exited `3` at the expected
  `paused-external` boundary; report readback, status, and state replay exited `0`;
  rerunning was idempotently paused; stop appended exactly two transitions and reached
  `paused-stop` with terminal writer closure.
- **Transition chain:** exactly `preflight`, `phase-start`, `phase-complete`,
  `phase-start`, `findings-freeze`, `phase-start`, `report-materialized`,
  `wave-admitted`, `pause`; stop changed the transition count from `9` to `11`.
- **Frozen wave:** `wave-1` retained exact partition/reconciliation refs, admitted the
  confirmed P1, retained the P2 as report-only, produced report digest
  `faefea91b461eb9d9f2bf6a4dbb23e285624d7edcfab51856a520321ae80ab23`,
  and paused with no mission reference.
- **Negative controls:** invalid definition exited `2`; dirty worktree and active
  OpenSpec change exited `1` as blocked; an unknown campaign writer exited `1` as
  `paused-unknown` before semantic or source work.
- **Effects and cleanup:** 23 proof-observed process starts; controller Git mutation,
  controller OpenSpec mutation, provider, OpenCode, mission, host, and source-write
  counts were all `0`. Fixture setup Git/OpenSpec calls were recorded separately.
  Source manifests were unchanged and fixture cleanup was `complete`.

## Immutable Evidence

- Capture: `implementation-evidence/task-2-4-controller-r1/{raw,evaluation}.json`.
- Offline replay:
  `implementation-evidence/task-2-4-controller-replay-r1/evaluation.json`.
- Capture and replay evaluations are byte-identical with Git object hash
  `1648e431e3bc159ccf77c80abb9ddfe9aa47495e`.
- Replay reported terminal `complete` with replay live calls `0`; it performed no Git,
  OpenSpec, process, provider, source, host, or remote action.

## Validation

- `npm run test:focused:work-campaign`: exit `0`; proof-contract, materializer,
  state-replay, and provider-free controller suites green.
- `node --check` on the portable CLI, controller, preflight, phase-input, focused test,
  and proof runner: exit `0`.
- `npm run code-quality:inventory -- --format markdown`: exit `0`; the controller is
  below the configured attention threshold after the responsibility split.
- `git diff --check` on task 2.4 source, tests, proof, and history: no whitespace error;
  the repository line-ending warning remains informational.
- Controller capture and offline replay: terminal `complete`; replay live calls `0`.

## Claim Ceiling And External State

- Maximum supported claim: one disposable Windows/Node Git/OpenSpec project can run
  the provider-free production controller through deterministic inventory, reviewed
  findings freeze, report materialization, frozen-wave admission, safe pre-mission
  pause, status/replay/idempotent-run/stop, the listed fail-closed controls, unchanged
  source bytes, and complete cleanup.
- This does not establish real mission execution, source remediation, semantic
  discovery/classification, configured inference, archive/checkpoint behavior,
  changed-block re-review, Windows supervision, campaign convergence, or broad-claim
  population closure.
- Live-Attempt Gate for the Windows supervisor lane remains `unknown`; no host preview,
  install, activation, Scheduled Task action, or rollback occurred.
- External operations: none.
