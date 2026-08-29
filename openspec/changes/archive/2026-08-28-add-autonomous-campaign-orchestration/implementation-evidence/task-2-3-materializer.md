# Task 2.3 Campaign Materializer Evidence

## Outcome And Scope

- Candidate `autonomous-work-campaign-materializer-r1` adds a separate
  `global/bin/work-campaign/materializer.ts` owner for append-only normalized reviewed
  seeds, current seed indexes, deterministic inventory and closure totals, atomic
  Markdown report generation, and ledger-backed readback.
- `ledger-append`, `report-materialize`, and `report-readback` are exposed through the
  portable production CLI. Definition-owned evidence/report paths are bounded,
  non-overlapping, non-symlink paths; retained bytes and individual seed input bytes
  are finite.
- The materializer validates explicit fields, identities, refs, enum statuses, scope,
  and closure conjunctions. It does not infer severity, materiality, scenario
  reachability, remediation grouping, semantic summaries, or campaign completion.
- Campaign transition state and roadmap mission state remain separate owners and roots.

## Architecture

- **Current owner:** no prior ledger/report owner; disposition `extend` within the
  existing `global/bin/work-campaign` family by adding one cohesive materializer.
- Reused contracts: campaign record parsers, `stableJson`, `campaignDigest`,
  `WorkCampaignError`, and Node filesystem/crypto operations. The evidence-index,
  project-inventory, campaign-state, and mission-state owners were inspected and do
  not satisfy the reviewed-seed/current-report contract.
- **Split-or-justify:** the 915-line materializer is a split-candidate by inventory but
  remains one append/replay/materialize transaction owner. Separating ledger replay,
  current-record validation, closure projection, report rendering, or drift readback
  would export internal seed/index contracts and add cross-file transaction
  coordination without removing a second responsibility.
- Read-only reduction review found no safe beneficial reduction: session
  `ses_fbbf861d7ffeOB3ER6BC6yK7kk`, `code-quality-reviewer`, Effective Model
  `xai/grok-4.6`.
- Reuse discovery: current repository and standard library reached; cross-project
  discovery degraded because no configured source/scope exists; public ecosystem
  research stopped because no package is needed for this local deterministic owner.

## Runtime Proof

- **Product Candidate:** `global/bin/work-campaign.ts`,
  `global/bin/work-campaign/contracts.ts`, and
  `global/bin/work-campaign/materializer.ts` at the source hashes in
  `task-2-3-materializer-r1/raw.json`.
- **Proof Runner:** `tools/proofs/work-campaign.ts --mode materializer`, invoking the
  actual CLI through `tools/test-work-campaign.ts` in one disposable project.
- **Evaluator:** provider-free `campaign-ledger-report-materializer`; replay reads the
  preserved raw bundle and starts no process/provider/host action.
- **Environment:** Windows `win32`, Node `v24.18.1`; no configured model, mission,
  OpenSpec operation, Git mutation, or host installation.
- **Representative input:** two reviewed source blocks, one confirmed P1, one
  report-only P2, two reconciliation rows, one frozen wave, explicit validation/proof/
  checkpoint facts, all three report matrices, one limitation, and a bounded maximum
  claim.
- **Observed happy path:** eight initial seeds produced report digest
  `d2d25ee3ea2f956166593bb5fce166cc367ffc1897ad0c7aea96ac270680725f`;
  unchanged regeneration was identical. Appending the same P1 id as
  `fixed-and-verified` created exactly entry `9`, an exact retry returned
  `seed-current`, unresolved P0/P1 became `0`, fixed-and-verified became `1`, the P2
  remained report-only, and the report digest became
  `910e2b031c926a5aa9a900d625cd8348f2b40f087e851ede5c4b59f7db07bc10`.
- **Negative controls:** manual Markdown drift exits `2` with `field=reportPath` and
  cannot change ledger/state; a record-digest-corrupt ledger entry exits `2` before
  regeneration. Overlapping definition owners also fail preflight before effects.
- **Effects and cleanup:** 37 proof-observed local process starts, zero source/OpenSpec/
  Git/provider/host effects, definition/adapter/source digests unchanged, disposable
  fixture removed, cleanup `complete`.

## Immutable Evidence

- Capture:
  `implementation-evidence/task-2-3-materializer-r1/{raw,evaluation}.json`.
- Replays:
  `implementation-evidence/task-2-3-materializer-replay-r1-{a,b}/evaluation.json`.
- Capture and both replay evaluations are byte-identical with Git object hash
  `098d4df3f97c1bbced20b3cacef5a349a94309b2`.
- Refreshed state dependency:
  `implementation-evidence/task-2-2-state-r3/{raw,evaluation}.json` and
  `task-2-2-state-replay-r3-{a,b}/evaluation.json`; all three state evaluations have
  Git object hash `e8ef0c389ded29ad48a8a19d8e9267db1be91779`.

## Validation

- `npm run test:focused:work-campaign`: exit `0`; contract, materializer, and state
  suites green.
- `node --check` on the production CLI, contracts, materializer, proof runner, and
  focused test: exit `0`.
- `npm run code-quality:inventory -- --format markdown`: exit `0`; split-or-justify
  recorded above.
- Materializer capture plus two offline replays: `complete`; replay live calls `0`.
- Refreshed state capture plus two offline replays: `complete`; replay live calls `0`.

## Claim Ceiling And External State

- Maximum supported claim: one disposable Windows/Node project can append and replay
  explicit reviewed campaign seeds, derive current inventory/index/closure/report
  projections, update one P1 to fixed-and-verified without dropping a P2, reject manual
  report drift and corrupt ledger bytes, regenerate byte-stably, and clean up.
- This does not establish semantic discovery/classification, campaign phase control,
  a real mission handoff, configured inference, archive/checkpoint execution, Windows
  supervision, terminal campaign completion, or any broad-claim population member.
- Live-Attempt Gate for the Windows supervisor lane remains `unknown`; no host preview,
  install, activation, Scheduled Task action, or rollback occurred.
- External operations: none.
