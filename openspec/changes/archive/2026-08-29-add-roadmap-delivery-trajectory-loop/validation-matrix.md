# Validation Matrix

- **Candidate**: `roadmap-delivery-trajectory-routing-r5`
- **Environment**: `windows-opencode-1.18.25-routing-r5`
- **OpenCode**: `1.18.25`, sha256 `59b379b53354da72d2c5262119fe70c44b4e473826ebbaa94d47a2d58a359b1a`
- **Active config sha256**: `0050d9de6b28e9b5574b57a519c5a3c09766910dc97afd0dcaf2b4a778628144` (unchanged)
- **External operations**: none

## Runtime Proof

| Boundary | Result | Evidence |
| --- | --- | --- |
| Configured linked archive with no trigger | passed; one configured request; `archive=archived`; `trajectory=none`; no receipt or successor; cleanup complete | `evidence/task-4-2-configured-no-trigger-r3/**` |
| Configured repeated-touch successor | passed; one configured request; one receipt; `trajectory=review-required`; `replan-outcome-preserving`; one same-Horizon successor; cleanup complete | `evidence/task-4-3-configured-repeated-touch-r1/**` |
| Provider-free 13-member contract | passed; 13 baseline and 13 candidate rows; zero model/provider calls; replay A/B byte-identical | `evidence/task-5-1-*/**` |
| Generated `core` and `all` loader | passed; trajectory and archive-helper closure resolved; no fallback or missing closure | `evidence/task-3-2-loader-{core,all}-r5/**` |
| PMAC diagnostic | passed at read-only boundary; HEAD and status identity unchanged; no controller/provider/source write | `evidence/task-5-2-pmac-diagnostic-r1.md` |

## Command Results

| Command / check | Result |
| --- | --- |
| `npm run test:focused:consumer-outcome` | passed, 42 tests |
| `npm run test:focused:contracts` | passed, 72 tests |
| `npm run test:focused:library` | passed, 188 tests |
| `npm run test:focused:delivery-horizon` | passed, 4 tests |
| `npm run test:focused:delivery-trajectory-context` | passed, 4 tests |
| `npm run test:focused:roadmap-delivery-trajectory` | passed, 4 tests |
| `npm run test:focused:openspec-gate` | passed, 23 tests |
| `npm run test:focused:openspec-change-inventory` | passed, 13 tests |
| `npm test` | passed, exit 0 |
| `npm run validate:strict` | passed; skills=34, agents=22, markdown=1001, warnings=0, infos=2 |
| `openspec validate add-roadmap-delivery-trajectory-loop --strict` | passed |
| `npm run openspec:validate` | passed, 27/27 items |
| `npm run openspec:gate -- --operation apply --change add-roadmap-delivery-trajectory-loop` | passed, exit 0; narrowed claim observed 4/13 |
| `npm run opencode:profile -- quality-independent --check` | passed; committed profile, 26 agents |
| `npm run opencode:sources` | resolved canonical custom helpers; expected additive config collision and stale active compaction prompt remain diagnostic only |
| `npm run instruction:inventory` | context quality passed; zero safe fixes, deterministic errors, or review-only findings |
| `npm run doctor` | qualification passed; expected Kaizen evidence warning and unrelated unattended/campaign capability blocks remain outside this candidate |
| `node tools/evidence-index.ts ... --materialize` | passed; 62 retained files before this matrix, 17 lanes, no retention exception |
| `node global/bin/openspec-change/inventory.ts --root . --mode evidence` | current tasks complete; zero stale/mismatched/unknown rows; zero unindexed files; claim narrowed 4/13 |
| `git diff --check` | exit 0; line-ending warnings only |

## Independent Reviews

| Review | Result | Reference |
| --- | --- | --- |
| Broad claim evidence sufficiency | `no-material-finding`; current maximum claim does not exceed the exercised four-member semantic boundary; nine members remain unknown | `evidence-sufficiency-review.md`, session `ses_fb3a1df7affelYw27Mo1Rk4zhq`, effective model `xai/grok-4.6` |
| Changed-code reduction review | no safe reduction; net 0 lines / 0 concepts; current split-candidate owners are cohesive and preserve distinct bounds, privacy, error, cancellation, and proof oracles | session `ses_fb392faecffeTjiZj7DvdpbsBy`, effective model `xai/grok-4.6` |

## Split-Or-Justify

- `global/bin/delivery-trajectory-context.ts`: keep as one fact-only core plus CLI owner. Its contained bounded reads, partial-state distinctions, privacy, cancellation, JSON/Markdown rendering, and effect-free help share one boundary; extraction would add wrapper navigation or collapse tested failure distinctions.
- `global/bin/openspec-change/delivery-horizon.ts`: keep as one Horizon/linkage/immutable-receipt contract owner.
- `tools/proofs/consumer-outcome/delivery-trajectory.ts`: keep as one maintained trajectory pack owner for the 13-member provider-free contract and two configured archive lanes; it already reuses `captureConfiguredDiagnostic`.
- Existing consumer-outcome dispatcher, contracts, capture, profile, and tests were extended rather than duplicated. Their existing large-file debt is not a trajectory-specific mixed responsibility and is not expanded by another abstraction.

## Limitations

- Semantic support remains exact to four members in the exercised Windows/OpenCode environment. Nine named members, universal trigger behavior, forecast accuracy, other models/providers/hosts, and cross-project population behavior remain `unknown`.
- The PMAC diagnostic supports only its read-only unit-of-work observation and supplies no generic member credit.
- The running user session predates candidate instructions; no install, activation, restart, consumer adoption, remote mutation, deployment, release, commit, or push was performed.
- Unrelated campaign-orchestration and other pre-existing worktree changes were left untouched.
