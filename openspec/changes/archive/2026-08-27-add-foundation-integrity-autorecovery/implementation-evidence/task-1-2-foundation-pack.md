# Task 1.2 Foundation Pack Evidence

Date: 2026-08-26

Candidate Reference: `foundation-integrity-pack-task-1-2-r1`

## Boundary And Identities

- Product candidate: existing consumer-outcome proof owner extended with pack `foundation-integrity-r1`; no loaded foundation owner or recovery instruction exists yet.
- Proof Runner: `tools/proofs/consumer-outcome-regression.ts` with the existing capture, immutable-bundle, privacy, permission, cleanup, and replay owners.
- Evaluator: `tools/proofs/consumer-outcome/evaluate.ts`; preflight scenario digest `540f8a18ce6a2c3db5617e5b55919c455b745371b3b087258ad45c9aec2ddaa6`.
- Environment/source: working-tree governed digest `98c9db0db053ee2f072ee93084fcdece0d85d49138e935e465cbe6b251713468`; profile `quality-independent`.
- Population: seven configured-session scenarios and twelve explicit baseline/candidate terminal members from `foundation-integrity-partitions-v1`.
- Permission envelope: exact `foundation-integrity-reviewer` task and `foundation-integrity-recovery` skill access plus fixture-local read/edit; bash, questions, external directories, unrelated tools, credentials, installs, remote, destructive, and protected effects remain denied or forbidden.

## Provider-Free Runtime Proof

`npm run proof:consumer-outcome -- --mode preflight --pack foundation-integrity --source-ref working-tree`

- Exit: `0`
- Status: `ready`
- Model calls: `0`
- Scenario count: `7`
- Terminal rows per arm: `12`
- Configured-provider bound: `1` per scenario, `14` across matched arms
- Fixture root: versioned owner path `tools/proofs/fixtures/consumer-outcome/foundation-integrity-v1`

`node tools/test-consumer-outcome.ts`

- Exit: `0`
- Result: `OK: consumer outcome tests=26`
- The foundation pack tests copied every fixture into disposable roots, read back explicit artifact state hashes for all fourteen arm observations, rejected a missing terminal member and malformed hash, evaluated fourteen scenario oracles and twenty-four terminal rows, replayed the same preserved baseline/candidate bytes twice with zero live calls and identical terminal digests, and verified exact failure attribution for a wrong candidate artifact hash.
- Every disposable test root was removed in `finally`.

## Validation

- `npm run test:focused:consumer-outcome` -> `OK: consumer outcome tests=26`
- `npm run validate:strict` -> `OK: skills=31 agents=20 markdown=781 warnings=0 infos=2`
- Node syntax checks for the four proof modules, focused test, and disposable fixture checker -> exit `0`
- `git diff --check` -> exit `0`; existing LF/CRLF notices only
- OpenSpec apply gate remains non-blocking `warning` only because runtime claim observations are intentionally absent before tasks 1.3 and 2.x-3.x.

## Architecture And Review

- Reuse decision: `extend`. The current consumer-outcome contracts, capture, evaluator, CLI, and focused-test owners remain the single implementation path; no second runner, proof client, semantic classifier, or generic extension layer was added.
- Split-or-justify: keep task 1.2 in the named existing owners. Although `contracts.ts`, `evaluate.ts`, and `test-consumer-outcome.ts` are navigation split-candidates, extracting a fourth-pack wrapper would add a concept while leaving the pack dispatch branches in place. The added code stays on the existing focused-pack responsibility axis.
- Fresh read-only code-quality review: task `ses_fc02c5b60ffe5vd9JFIM3l2puk`, Effective Model `xai/grok-4.6`, Candidate `foundation-integrity-pack-task-1-2-r1`; no safe reduction found. Its only concrete drift finding, the fixture root missing the owned `-v1` suffix, was corrected and the affected preflight/focused proof rerun green.

## Claim Ceiling

This evidence proves only provider-free schema, fixture, permission, state-hash, evaluator, cleanup, and deterministic replay readiness for the reviewed pack. It does not prove loaded baseline or candidate workflow behavior, provider/model generalization, consumer-project behavior, or autonomous authority over a protected product decision.

Live-Attempt Gate: `clear` for the provider-free foundation pack lane. The configured baseline lane has not started and remains the next real boundary, not a failed or reusable attempt.

External Operations: none. No configured provider, consumer project, install, activation, commit, remote, credential, destructive, or protected action occurred.
