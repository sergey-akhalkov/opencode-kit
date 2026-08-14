# Local Qualification Handoff

## Outcome

- Profile: `Material`
- Candidate: `roadmap-current-6b4-marker`
- Development-Stage: `stable`
- Stable Candidate: `RC1`
- Outcome: one explicit project-contained roadmap mission can serialize bounded
  OpenSpec slices, persist restart-safe transitions and recovery budgets, archive
  only after deterministic gates, checkpoint without remote delivery, and stop
  before an unavailable protected effect.
- Operating envelope: local disposable or explicitly configured repositories with
  complete validation argv, canonical global workflow identity, one writer,
  supported checkpoint policy, and separately authorized configured inference.

## Candidate And Architecture

- Exact source/evidence identity is frozen in `candidate-reference.md` and
  `evidence/roadmap-provider-r4/raw.json`.
- Portable entrypoint: `global/bin/roadmap-mission.ts`.
- Cohesive owners: `contracts.ts` owns definition/schema facts; `preflight.ts` owns
  provider-free eligibility and loaded workflow identity; `state.ts` owns immutable
  transitions/projection/leases/replay; `controller.ts` composes sessions, archive,
  checkpoint, and successor transitions.
- Split-or-justify: `state.ts` remains above the inventory split-candidate band but
  owns one coupled persisted-state responsibility whose schema, digest, lease, and
  replay invariants change together. Controller/preflight/contracts are already
  separate. Further splitting is parked rather than performed after qualification.
- `tools/test-install-opencode-global.ts` remains a large single installer-boundary
  suite; the new fixture/oracles stay in that existing responsibility. The staged
  portable-process wrapper oracle remains in its established split test owner.

## Runtime Proof

- Configured-provider boundary: `evidence/roadmap-provider-r4/`.
- Provider-free current preflight: `evidence/roadmap-provider-preflight-r5/`.
- Real-OpenSpec deterministic simulation:
  `evidence/roadmap-provider-simulate-r3/`.
- Fake/no-model controller/checkpoint lane: `evidence/roadmap-controller-r16/`.
- Guard/readiness lanes: `guard-long-run-r6`, `guard-restart-r17`,
  `project-readiness-r4`, and current `guard-permissions-r3`.
- Observed integrated result: three successful configured-provider commands in two
  deleted sessions; one local recoverable failure; A/B archived exactly once with
  distinct checkpoints; 17 valid hash-correlated transitions; recovery attempts
  `1 -> 2`; writer clear; protected C blocked before executor; complete cleanup.

## Critical Challenge

- Fresh terminal SDET session: `ses_0011ab859ffem3YUYhY7WE136V`.
- Effective Model: `xai/grok-4.6`.
- Terminal action: `no-critical-risk`.
- Critical risk matrix: none.
- Test-only I1/I3 changes update copied portable owners and distinguish literal
  direct-native argv from fail-closed shell fallback. The preceding blocked SDET
  attempt is non-terminal and retained in `history.md`.

## Validation

- `npm test`: passed, 11 suites.
- Focused tests: library 148, contracts 67, completion guard 28, init 3,
  installer 27, OpenSpec operation gate 11.
- `npm run validate:strict`: passed with zero warnings and two expected top-level
  permission infos.
- `npm run code-quality:inventory`: completed; pre-existing split/attention files
  are reported, with no fail-on-split gate requested.
- `openspec validate add-unattended-roadmap-orchestration --strict`: passed.
- `openspec validate --all --strict`: 14 passed, 0 failed.
- Apply operation gate, current permission proof, and `git diff --check`: passed.

## Diagnostics And Limits

- Process errors preserve status/stdout/stderr paths and owning argv; mission state
  preserves failure class, attempt limits, transition/checkpoint/evidence refs, and
  writer status.
- Guard diagnostics preserve bounded request/evidence bytes, retry/wait/restart
  state, retained-child ownership, and terminal error class without prompt or
  credential output.
- Provider/host availability can pause a mission; arbitrary legacy same-name
  overlays block until explicitly migrated; repository-specific validation cost is
  not bounded by this kit; no target project mission has been exercised.
- Direct native Windows argv is literal under `shell:false`; only shell fallback
  applies shell-metacharacter rejection. Current tests cover both boundaries.

## Migration And Rollback

- No installation, activation, target mutation, commit, push, deployment, release,
  publication, hardware, credential, or remote-state action occurred.
- Before target use, the owner must separately authorize installation/activation,
  start a new OpenCode process, provide a contained mission definition and complete
  validation adapter argv, resolve same-name project overlays, select an authorized
  checkpoint policy, and satisfy every live/protected effect gate.
- Rollback stops proof/controller processes, preserves mission/evidence state,
  restores the prior version-controlled kit and any explicit project overlays or
  adapters, reinstalls the prior global source only under separate authorization,
  and starts a new process. A partial mission remains paused, never complete.

## Remaining External Gate

- The final complete-history retrospective admitted no current-change improvement
  and preserved one non-blocking deferred inventory candidate in `history.md`.
- Archive is a separate owner-requested operation and has not run.
