# Task 5.1 Critical SDET - R2

## Candidate

- Candidate: `grind-task-scoped-population-r2`.
- Environment: `windows-opencode-1.18.25-grind-population-r2`.
- Base: HEAD `1ac04a5aaad9b5e01ccb5ea7806d490756bc5b73` plus the current grind worktree candidate.
- Corrected frontier source SHA-256: `e05375fbb793ee5f15193eb3958606fcdd0c7d7ec70f9ff02bb177492b61b49c`.
- SDET effective model: `xai/grok-4.6`.

## Initial Critical Finding

- Fresh SDET: `ses_fac829becffeCwJ6RXXC2JFb0M`.
- Terminal status: `critical-risks-reported`.
- Risk `CR-TSB-001`: `assess()` could classify a frontier `complete` when every item was complete/deferred but an open safety or product-decision gate or parked product decision remained.
- Main reproduction: the SDET-authored test `critical: complete item status cannot allow_stop while open safety or parked product gates remain` failed because `allow_stop` parsed on both complete-item/open-safety and complete-item/parked-product fixtures.
- Main disposition: reachable non-deferrable false-completion and gate-loss defect.

## Correction And Re-Proof

- Correction: `frontierState=complete` now additionally requires `openGateRefs.length === 0` and `parkedDecisionRefs.length === 0` in `global/extensions/session-completion-guard/frontier.ts`.
- Focused guard: `55/55` passed, including the retained SDET regression.
- Contracts: `73/73` passed.
- Work-campaign proof/controller/executor/playbook/supervisor suites passed.
- Strict validation: warnings `0`.
- Installed default R2: suite `failure=null`; product, non-product, and technical capture/replay status `0`; every replay has `candidateOraclePass=true`, `cleanupOraclePass=true`, and `replayComplete=true`; cleanup and liveness closed.
- Installed autonomous R2: suite `failure=null`; complete frontier had no open gate or parked decision, used exact `allow_stop + answer`, later reached `passed`, replay passed, and cleanup/liveness closed.
- External effects: synthetic configured inference only; no target-project, protected, credential, remote, install, activation, destructive, deploy, or release effect.

## Corrected-Candidate SDET

- Fresh corrected-candidate SDET: `ses_fac643e8affe940rh35khDv4fC`.
- Terminal status: `no-critical-risk`.
- `CR-TSB-001`: fixed and not reachable on R2 at the exercised provider-free boundary.
- `CR-TSB-002`: runnable-work false completion disproved by current cross-field and installed product oracles.
- `CR-TSB-003`: authorization escape, credential/privacy disclosure, and protected effect disproved at the authorized provider-free and inspected installed-evidence boundaries.
- `CR-TSB-004`: human-authority loss, stale/malformed mutation, manufactured owner authority, and invalid autonomous pairing disproved by current focused oracles.
- Test changes on corrected pass: none.

## Claim Ceiling

The critical test gate supports only the exact R2 source, provider-free checks, and inspected installed R2 bundles. `GRIND-TSB-001` remains `narrowed` mixed fidelity; installed roadmap/campaign composition and unreviewed populations remain outside the claim.
