# Task 3.1 Mission Parent Correlation Evidence

## Outcome And Scope

- Candidate `task-3-1-final-r1` extends the existing roadmap mission with optional,
  omitted-when-absent campaign/wave/work-item correlation and a bounded terminal
  handoff. The immutable mission queue, single writer, certificate issuer, session,
  archive, checkpoint, retry, status, stop, and no-successor owners remain unchanged.
- `global/bin/roadmap-mission/parent-correlation.ts` privately owns frozen-wave
  readback, cycle-free wave digesting, exact correlation, and handoff validation.
  The mission does not import or read campaign state, ledger, or report data.
- Legacy definitions omit every new field and retain the established definition digest
  `51b2356dd6014779ffa7344f70b837c69fbaeec9ff6c8f128442ad53b5b46804`.

## Runtime Proof

- **Preflight capture:** `npm run proof:roadmap-mission -- --mode preflight
  --candidate-id task-3-1-final-r1 --evidence-root <task-3-1-preflight-r1>`
  completed in a disposable Windows/Node Git/OpenSpec fixture with cleanup complete
  and repository source mutation count `0`.
- **Preflight result:** exact parent correlation was eligible; ref, order, path,
  outcome, effect, and digest mismatches all blocked before session or source effects.
  Existing invalid, dirty, active-change, protected-effect, lease, and session controls
  retained their fail-closed outcomes. A closed-port pre-session probe remained
  retryable rather than being misreported as a terminal session.
- **Controller capture:** `npm run proof:roadmap-controller -- --mode campaign
  --candidate-id task-3-1-final-r1 --evidence-root <task-3-1-controller-r1>`
  completed one parent-correlated propose/archive/checkpoint mission in a disposable
  fixture. The emitted handoff was `complete-terminal-clear` only after the mission
  writer lease was released and validated replay, executor, cleanup, checkpoint,
  archive, process, and session evidence was available.
- **Offline replay:** both preserved captures replayed to `complete` with `liveCalls:
  0`; no Git, OpenSpec, provider, mission, source, host, or remote action was repeated.

## Compatibility Validation

- State restart/reconciliation: `task-3-1-compatibility-r1/state-evaluation.json`
  reports complete cleanup, duplicate-archive rejection, missing-transition rejection,
  unknown-writer blocking, and exact stop-intent behavior.
- Runtime continue: `runtime-evaluation.json` reports certified completion, passed guard,
  terminal root-session cleanup, no nested server, and the existing runtime owner.
- Launcher preflight: `launcher-evaluation.json` reports eligible, clean, complete, and
  `liveCalls: 0`.
- Integrated one-slice selftest: `integrated-evaluation.json` reports all existing
  mission/certificate/state/archive/validation oracles complete and `liveCalls: 0`.
- `node --check` passed for the CLI, contracts, controller, parent-correlation,
  preflight, state, and both changed proof runners. `git diff --check` reported no
  whitespace error; line-ending notices remain informational.

## Locality And Reduction

- Parent handoff parsing was moved from the general contract owner into the private
  parent-correlation owner. The project-native inventory now reports contracts and
  parent correlation as attention files rather than split candidates.
- Fresh reduction review `R-3.1-CQ-01` found one unnecessary CLI parser re-export; it
  was removed. The parser remains private to handoff construction and validation.
- Existing large state, controller, and proof files retain established responsibilities;
  this task adds one derived state-history read, one post-lease handoff attachment, and
  requirement-linked fixtures rather than another state/controller/proof mechanism.

## Immutable Evidence

- Preflight capture:
  `implementation-evidence/task-3-1-preflight-r1/{raw,evaluation}.json`.
- Preflight replay:
  `implementation-evidence/task-3-1-preflight-replay-r1/evaluation.json`.
- Controller capture:
  `implementation-evidence/task-3-1-controller-r1/{raw,evaluation}.json`.
- Controller replay:
  `implementation-evidence/task-3-1-controller-replay-r1/evaluation.json`.
- Compatibility evaluations:
  `implementation-evidence/task-3-1-compatibility-r1/*.json`.

## Claim Ceiling And External State

- Maximum supported claim: optional parent correlation and post-lease terminal handoff
  work at the exercised disposable Windows/Node mission boundaries, while legacy
  missions and the listed fail-closed controls remain compatible.
- Campaign launch/consumption, semantic discovery, configured campaign inference,
  Windows supervision, campaign convergence, population closure, deployment, release,
  and remote effects remain unproved or out of scope for task 3.1.
- Live-Attempt Gate for the Windows supervisor lane remains `unknown`; no host preview,
  install, activation, Scheduled Task action, or rollback occurred.
