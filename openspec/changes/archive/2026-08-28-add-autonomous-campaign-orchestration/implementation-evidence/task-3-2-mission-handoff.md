# Task 3.2 Campaign-To-Mission Handoff Evidence

## Outcome And Scope

- Candidate `task-3-2-final-r2` binds environment
  `node-24.18.1-windows-local-proof-r2` and composes one deterministic frozen
  campaign wave through the existing roadmap mission entrypoint.
- `global/bin/work-campaign/mission-handoff.ts` privately owns deterministic mission
  materialization, exact parent correlation, portable child invocation, terminal
  observation, stop-intent propagation, and typed evidence refs. The roadmap mission
  remains the sole source/OpenSpec/archive/checkpoint writer.
- Campaign and mission state roots and schemas remain separate. The campaign records
  `wave-admitted` and `mission-launch`, releases its lease, and invokes the mission only
  after that release. A fresh `resume` is the only handoff-consumption path.

## Runtime Proof

- **Integrated capture:** `npm run proof:work-campaign -- --mode controller
  --candidate-id task-3-2-final-r2 --environment-id
  node-24.18.1-windows-local-proof-r2 --evidence-root
  <task-3-2-controller-r2>` completed with `32` proof-owned local process starts,
  cleanup complete, no provider/OpenCode model/host/remote call, and no repository
  source write outside disposable fixtures.
- The capture verified exact transition order through `wave-admitted` then
  `mission-launch`, absence of the campaign lease during mission execution, one
  completed mission, terminal writer/cleanup closure, and no campaign consumption
  during read-only status.
- Fresh resume appended exactly `mission-terminal` and `verification`, changed the
  admitted P1 to `fixed-and-verified`, marked its source block `needs-rereview`,
  advanced the partition inventory digest, linked archive/checkpoint/evidence refs,
  regenerated/read back the report, and paused before any successor.
- Parent-wave mismatch exited `2` before a campaign transition; duplicate resume kept
  the transition count at `11`; terminal mission stop produced `paused-stop` and a
  mission-owned stop intent with source `campaign`.
- **Offline replay:** `task-3-2-controller-replay-r2/evaluation.json` recomputed the
  same complete capture evaluation while replay invocation stdout reported
  `liveCalls: 0`. The evaluation's retained `liveCalls` and `processStarts` fields both
  describe original-capture process starts and are not replay-effect oracles.

## Foundation And Source Identity

- The corrected capture directly records candidate and environment ids and verifies
  the exact sorted `WORK_CAMPAIGN_CONTROLLER_SOURCE_PATHS` set rather than a file-count
  proxy. The set includes the campaign owners, roadmap mission entrypoint/controller/
  parent/state owners, portable process boundary, operation/archive gates, proof runner,
  and focused test. `foundation-fi-camp-002-source-readback.json` separately recomputes
  the current bytes and matches all `28/28` capture hashes.
- Historical `task-3-2-final-r1` and `task-3-1-final-r1` bundles remain unchanged and
  retain only their exact historical/component ceilings. They are not relabeled.
- Foundation incident `FI-CAMP-002` records the common-candidate recapture and rebind
  required by schema-v2 exact candidate/environment equality.

## Validation And Locality

- `npm run test:focused:work-campaign` is green after the integrated path and source/
  environment correction. Syntax checks passed for the changed CLI, controller,
  mission handoff, proof inventory, proof runner, and focused test.
- The Bun `v26.3.0` runtime-continue regression is retained only as cross-profile
  component evidence; it is not cited as part of the Node-24 task-row aggregate.
- Fresh reduction review on candidate `task-3-2-r2` found no safe deletion, reuse,
  collapse, or public-surface narrowing. The private handoff owner is normal-sized;
  controller and focused test are attention-sized but cohesive.
- Split-or-justify: the pre-existing multi-mode `tools/proofs/work-campaign.ts`,
  campaign materializer, and roadmap mission state owners remain split candidates.
  This task adds only evaluator predicates, one read-only seed query, and one stop-source
  literal there; splitting those established replay surfaces inside this task would
  enlarge invalidation and is not required for the accepted handoff outcome.

## Claim Ceiling And External State

- Maximum supported claim: one seeded disposable Windows/Node P1 wave can be frozen,
  launched through the existing mission, completed with one source writer, observed
  through a terminal-clear correlated handoff, consumed once after parent restart,
  projected into current fixed/re-review/report facts, stopped safely, and replayed
  offline.
- Semantic discovery, configured campaign inference, additional waves, changed-block
  re-review completion, campaign convergence/completion, Windows supervision,
  population closure, deployment, release, and remote/protected effects remain unproved
  or out of scope.
- No host install, activation, Scheduled Task action, commit, push, release, or remote
  mutation occurred.
