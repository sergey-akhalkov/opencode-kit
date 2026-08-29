# Task 2.2 Campaign State Evidence

## Outcome And Scope

- Candidate `autonomous-work-campaign-state-r3` retains one project-contained campaign
  transition owner with append-before-projection persistence, atomic current-state
  replacement, exact event idempotency, campaign-only writer lease and attestation,
  monotonic budget accounting/revision, durable stop intent, deterministic replay,
  stale-projection reconciliation, and low-level state CLI operations.
- Campaign and roadmap-mission roots, schemas, leases, and transition types remain
  separate. The campaign does not invoke semantic roots, OpenSpec, Git, mission source
  mutation, checkpoints, a provider, or a host supervisor.
- Unknown writer state is not cleared from PID absence, process exit, or elapsed time.
  The proof-owned killed process remained `unknown` until an exact token-correlated
  terminal attestation was durably archived.

## Architecture

- **Current owner:** `global/bin/work-campaign/state.ts`; disposition `extend` inside
  the declared `global/bin/work-campaign` owner.
- Mission canonical JSON/digest primitives are reused because their contracts are
  identical. Mission state parsing, roots, leases, stale-PID policy, and schemas are
  not reused because their contracts differ and campaign liveness forbids PID-only
  clearance.
- **Split-or-justify:** `global/bin/work-campaign/state.ts` is a 948-line
  split-candidate by the repository inventory, but remains one cohesive state-machine
  owner: exact state schema parsing, evolution guards, immutable-chain replay,
  projection replacement, campaign lease reconciliation, and stop intent all share
  one hash-chain contract and failure boundary. Splitting now would export internal
  parser/durability surfaces or create a mission-coupled shared I/O module without a
  third consumer. The post-proof reduction review instead removed unused wrappers,
  narrowed internal exports, reused the canonical digest and projection mapper, and
  removed a dead branch.
- Read-only reduction review: `code-quality-reviewer`, session
  `ses_fbc1f3d2dffeagcoLSrIkVt2fi`, Effective Model `xai/grok-4.6`.

## Runtime Proof

- **Product Candidate:** `global/bin/work-campaign.ts`,
  `global/bin/work-campaign/contracts.ts`, and
  `global/bin/work-campaign/state.ts` at the source hashes preserved in
  `task-2-2-state-r3/raw.json`. The CLI now also imports the separate materializer
  owner, whose source hash is preserved without merging its ledger into campaign state.
- **Proof Runner:** `tools/proofs/work-campaign.ts --mode state`, which invokes the
  focused production-CLI suite and owns one disposable campaign project/process tree.
- **Evaluator:** provider-free `campaign-state-restart` evaluation in
  `tools/proofs/work-campaign.ts`; replay reads preserved bytes only.
- **Environment:** Windows `win32`, Node `v24.18.1`; no configured model or host
  installation.
- **Representative input:** valid generic `audit-remediate` definition, preflight,
  inventory phase-start, restart-reconciliation, pause, budget-revision, and stop
  records plus malformed state controls.
- **Observed happy path:** preflight sequence `1`, idempotent duplicate still `1`,
  phase-start `2`, exact pre/post-kill state digest
  `93ea2b6d24009d989513a014262273c27b53b9fe6795dbc3b9c1d5493bae69c7`,
  restart-reconciliation `3`, idempotent duplicate still `3`, pause `4`, budget
  revision `5`, terminal replay `valid` with current stop intent and clear writer.
- **Crash windows:** an archive-before-unlock writer reconciliation was completed
  idempotently, and a second exact reconciliation returned the same archive. A stale
  projection was rebuilt from the immutable chain before the restart event was
  appended.
- **Negative controls:** live and killed-but-unattested writers block; budget
  consumption regression and conflicting stop facts exit `2`; stale projection exits
  `1`; missing, corrupt, reordered, and changed-definition chains exit `2`.
- **Effects and cleanup:** 23 proof-owned local process starts, zero source/OpenSpec/
  Git/provider/host effects, input source/definition/adapter digests unchanged, one
  proof-owned child terminated, disposable fixture removed, cleanup `complete`.

## Immutable Evidence

- Current capture: `implementation-evidence/task-2-2-state-r3/{raw,evaluation}.json`.
- State replays:
  `implementation-evidence/task-2-2-state-replay-r3-{a,b}/evaluation.json`.
- Provider-free contract capture:
  `implementation-evidence/task-2-2-preflight-r2/{raw,evaluation}.json`.
- Contract replays:
  `implementation-evidence/task-2-2-preflight-replay-r2-{a,b}/evaluation.json`.
- Current state capture and both state replay evaluations have identical Git object
  hash `e8ef0c389ded29ad48a8a19d8e9267db1be91779`.
- Contract capture and both contract replay evaluations have identical Git object hash
  `dbff757b8e4bb95362e975a75822cc250c9532f7`.

## Validation

- `npm run test:focused:work-campaign`: exit `0`, proof-contract, materializer, and
  state-replay suites green.
- `node --check global/bin/work-campaign.ts`: exit `0`.
- `node --check global/bin/work-campaign/state.ts`: exit `0`.
- `node --check tools/proofs/work-campaign.ts`: exit `0`.
- `node --check tools/test-work-campaign.ts`: exit `0`.
- `openspec validate add-autonomous-campaign-orchestration --strict`: exit `0`.
- `npm run code-quality:inventory -- --format markdown`: exit `0`; split-or-justify
  disposition recorded above.
- `git diff --check` on the task paths: no whitespace error; repository line-ending
  warning remains informational.

## Claim Ceiling And External State

- Maximum supported claim: the exercised provider-free production CLI persists,
  replays, repairs, stops, and safely reconciles one disposable campaign state chain
  across one proof-owned process kill, with the listed controls and complete cleanup.
- This state lane does not itself establish phase control, inventory/report semantics,
  a real mission handoff, configured provider, checkpoint, Windows supervisor,
  campaign completion, or a declared broad-claim population member.
- Live-Attempt Gate for the later Windows supervisor lane remains `unknown`; no host
  preview/install/activation/task action was attempted.
- External operations: none.
