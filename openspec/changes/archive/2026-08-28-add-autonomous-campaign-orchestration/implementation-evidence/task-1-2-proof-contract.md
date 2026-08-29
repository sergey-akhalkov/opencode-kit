# Task 1.2 Provider-Free Proof Contract

- Candidate: `autonomous-work-campaign-provider-free-r2`
- Environment: Windows, Node `v24.18.1`, provider-free local execution
- Effects: disposable fixture files and create-new immutable evidence only; zero provider, process, source, OpenSpec, Git, host, remote, credential, installation, or protected effect.
- Cleanup: complete for every retained preflight and focused-test fixture.

## Ownership Decision

The existing `tools/proofs/roadmap-mission.ts` owner is mission-specific: it binds `MISSION_SOURCE_PATHS`, mission definitions, mission projects, and mission preflight/replay. Campaign seed, state, report, semantic, composition, and host lanes have a separate invalidation boundary. The selected `build-minimal` sibling `tools/proofs/work-campaign.ts` therefore extends the same proof family and conventions without adding a second process, provider, Git, OpenSpec, redaction, or capture framework. `history.md` records the required locality decision.

## Reviewed Population

The versioned `work-campaign-provider-free-v1` pack contains one valid base record and seven explicit scenario operations:

| Scenario | Expected result | Observed result |
| --- | --- | --- |
| `valid` | complete | complete |
| `extra-field` | blocked at `definition:exact-fields` | blocked with expected check |
| `missing-field` | blocked at `definition:exact-fields` | blocked with expected check |
| `path-escape` | blocked at `definition:paths-contained` | blocked with expected check |
| `stale-digest` | blocked at `definition:digest-current` | blocked with expected check |
| `p2-in-wave` | blocked at `wave:eligible-items` | blocked with expected check |
| `report-drift` | blocked at `report:totals-current` | blocked with expected check |

The helper validates only explicit schema fields, ids, enums, paths, digests, refs, counts, and wave/report projections. It does not classify prose, severity, materiality, reachability, grouping, or completion.

## Runtime Proof

- `node tools/proofs/work-campaign.ts --help`: exit `0`; exact inputs, effects, evidence, and cleanup are documented without writes.
- R1 preflight and two replays: terminal `complete`; retained as the pre-static-diagnostic source identity.
- `node tools/proofs/work-campaign.ts --mode preflight --candidate-id autonomous-work-campaign-provider-free-r2 --evidence-root <task-1-2-preflight-r2>`: exit `0`, `status=complete`, `liveCalls=0`.
- Two R2 replay invocations from the same immutable input: exit `0`, `status=complete`, `liveCalls=0`, and byte-identical evaluations.
- `npm run test:focused:work-campaign`: exit `0`, `tests=19`, including help, full population, cleanup/source invariants, two byte-stable replays, and tampered provider-effect failure.
- `openspec validate add-autonomous-campaign-orchestration --strict`: exit `0`.
- Apply gate: exit `0`, bounded falsification record passed; only the expected unimplemented broad runtime-claim warning remains.

Static diagnostics have no runner-specific type-narrowing or language-level finding. The remaining diagnostics are the repository-wide absent ambient Node typings (`node:*`, `process`, and `Buffer`), while actual Node `--check` and focused execution are green.

## Claim Ceiling

The current evidence proves the reviewed provider-free proof contract, explicit negative-policy checks, create-new evidence, zero-effect accounting, terminal cleanup, and byte-stable evaluator replay. It does not prove production campaign contracts, state, report materialization, semantic classification, mission handoff, configured inference, Windows supervision, or campaign completion.
