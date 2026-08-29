# Task 1.3 Team-Advising Preflight R1

## Scope

- Proof Runner: `tools/proofs/consumer-outcome-regression.ts --pack team-advising`.
- Pack: `tools/proofs/fixtures/consumer-outcome/team-advising-r1.json`.
- Population: all nine `STA-001` members; ten root turns per arm; twenty configured requests maximum across matched baseline/candidate.
- Product Candidate: none. Preflight materialized the current `core` profile only in a temporary root and made zero model/provider calls.

## Provider-Free Preflight

```text
node tools/proofs/consumer-outcome-regression.ts --mode preflight --pack team-advising --source-ref working-tree --opencode <private-home>/.bun/bin/opencode.exe
```

Exit status: `0`.

Observed facts:

- status: `ready`
- model calls: `0`
- generated core entries: `31`
- loaded agent catalog: `true`
- loaded skill catalog: `true`
- scenario count: `9`
- turn count per arm: `10`
- configured request bound: `20`
- governed digest: `7e0654af9e11d8099f4e9c5b1e7aeb6bf57a220448935dbddf950e04225c7f27`
- pack digest: `7cad8bec084c94337d529729ff88cea995d8b2e65558d4649a8a725bd79390bc`
- temporary root removed: `true`

The preflight emitted one exact permission row for every member. `trivial-owner-local-direct` permits no task or skill; the remaining scenarios permit only `specialist-team-advisor` plus their reviewed conditional/specialist roles; only `procedural-skill-no-fresh-agent` permits `reuse-discovery`.

## Focused Validation

```text
npm.cmd run test:focused:consumer-outcome
```

Exit status: `0`; stdout ended with `OK: consumer outcome tests=38`.

The focused tests load all nine scenario records, verify ten turns and the twenty-request bound, perform provider-free replay over a sealed nine-member baseline, and prove that a stale bundle digest is rejected.

```text
node --check tools/proofs/fixtures/consumer-outcome/team-advising-v1/check-result.ts
```

Exit status: `0`; stdout/stderr empty.

`git diff --check` over the runner, pack, fixture, test, and proof inventory exited `0`; only existing line-ending conversion warnings were emitted.

## Failure And Correction

The first generated-core preflight failed before loader readback. A diagnostic rerun preserved exact statuses and reported `unable to open database file` for config, agent, and skill commands. The Proof Runner had selected an isolated `OPENCODE_DB` path without creating its parent. The runner now creates only its proof-owned cache/config/data/state parents before startup. The next preflight passed and removed the temporary root.

## Disposition

Task 1.3 is satisfied. Help and preflight are effect-free with respect to sessions/providers/product state; capture owns exact source/model/profile, task/skill/catalog, changed-path, writer-closure, stdout/stderr, privacy, proof, and cleanup facts; replay/evaluate make zero configured calls and reject stale identities. Semantic team quality remains in reviewed scenario expectations and later main disposition, not deterministic scoring.
