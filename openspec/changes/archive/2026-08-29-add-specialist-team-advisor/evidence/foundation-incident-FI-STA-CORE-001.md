# Foundation Incident FI-STA-CORE-001

## Relation

- Accepted outcome/oracle: `STA-001`, including the core-profile unavailable-capability control
- Candidate at observation: `add-specialist-team-advisor-task-4-1-r1`
- Declared profile: generated `core`
- Contradictory configuration: complete `quality-independent.agent` map injected through `OPENCODE_CONFIG_CONTENT`
- Decision-changing evidence: task 4.1 r1 advisor catalog listed non-core `protocol-api-reviewer`
- Practice Owner task: `ses_fb586ca4affeBKFloQGvFhP6Yi`
- Effective Model: `openai/gpt-5.6-sol`

## Reproduction

Main traced `tools/proofs/consumer-outcome/team-advising.ts` from `materializeRuntimeSurfaceProfile(core)` through `runtimeEnvironment()`, which spread `global/model-profiles/quality-independent.json` into `configuredProofServerEnvironment()`. That profile defines `protocol-api-reviewer`. The preserved task 4.1 r1 bundle independently records the root-effective catalog conflict and the evaluator's unavailable-capability failure. This confirms a current Proof Runner profile binding defect rather than a product-policy choice.

## State

`observed -> confirmed -> correcting -> swept -> re-reviewed -> closed`

## Preserved Identities

- Archive tree at `HEAD`: `cf5fc8850535deb49239e9b1e760672d312f88b3`; archive diff empty
- Baseline r2 bundle SHA-256: `0c8a682c899ec79bc54821fd0bde4400c4c15e97bdc94903f22deaf5132fb94f`
- Task 3.2 r3 bundle SHA-256: `18614e386dd42546174721b27e3e7ba072ca7101051c5e8ce503257c83d42b5c`
- Task 3.3 r1 bundle SHA-256: `0d68acd35e2e2895e5f9b559941393a8390b46e067414441b308e1aa0403a799`
- Task 4.1 r1 bundle SHA-256: `1f5c380949a337abfccc72f4f1548bc52bc1b6d98e84a85a323fe719b6dc1d33`
- Active gitignored config SHA-256: `0050d9de6b28e9b5574b57a519c5a3c09766910dc97afd0dcaf2b4a778628144`

## Active Artifact Inventory

| Artifact | Disposition | Reason |
| --- | --- | --- |
| `add-specialist-team-advisor` source, proof runner, tasks, history, and active delta specs | `dependent-rebind` | Owns the incorrect proof profile binding and corrected `STA-001` proof. |
| Task 3.2/3.3 accepted reports and raw bundles | `dependent-narrow` | Preserve immutable historical hybrid observations; recapture for corrected core. |
| Task 4.1 r1 raw bundle/evaluation | `dependent-narrow` | Preserve the profile contradiction and separate routing observations; it is not accepted current evidence. |
| `add-specialist-team-advisor/evidence-index.json` | `dependent-rebind` | Final population index must use corrected-core rows only. |
| `add-roadmap-delivery-trajectory-loop` | `not-dependent` | Planning-only, mutation disabled, serialized after advisor archive. |
| `add-cross-project-kaizen-loop` | `not-dependent` | Separate later change; no current mutation is permitted. |
| Current canonical `openspec/specs/**` | `not-dependent` | Advisor behavior remains owned by the active delta until archive synchronization. |
| `openspec/changes/archive/**` | `not-dependent` | Historical and immutable. |
| Unrelated campaign-orchestration worktree changes | `not-dependent` | Separate owner; untouched. |

## Correction And Proof Plan

Pass only the CLI-selected top-level model and scenario permission inline. Generated core remains the sole agent/compaction owner; no `small_model` or inline agent map is needed. Provider-free preflight must expose the root-effective agent ids and prove `protocol-api-reviewer` absent. Recapture the invalidated task 3.2 and 3.3 lanes and the unavailable-capability control under one corrected source/profile/environment identity. Preserve all prior raw evidence, then obtain one fresh corrected-candidate foundation re-review before closing this incident.

## Terminal Recovery Result

- `terminalState=closed`
- `reproductionDisposition=confirmed`
- Corrected source digest: `571e0656fcd142ca10de3398b6677a88a05ba225f06b1b48bffc7bf76d0aa74c`
- Corrected task 3.2 bundle: `cd54cb4ba294871d4eccb0d03efcaf1d153849934279f1e9af3794769307e260`; evaluation `passed`
- Corrected task 3.3 bundle: `fa8dda36b761dfc6f4397d357d490626a4ccc8330fdc3624bc65f795368031c5`; evaluation `passed`
- Corrected unavailable-capability bundle: `6709e7f6358fafc14f1336ebe9323db5ec2c58eb5f7597eb2f6f322e318ac1cc`; exact capability absence passed, while separate routing disposition oracles remain open
- Corrected-candidate re-review: `ses_fb574f4b4ffeTKJs7cBNs54rSl`, Effective Model `openai/gpt-5.6-sol`, `Practice Observation: no-material-finding`

The corrected runtime has no inline agent map or `small_model`; generated core owns the catalog and compaction prompt/model/variant. Provider-free preflight observed the exact core agent list, `protocolApiReviewerAvailable=false`, zero model calls, and complete cleanup. Corrected task 3.2, task 3.3, and the unavailable-capability control share the corrected material identity tuple. Prior hybrid bundles and archive artifacts remain unchanged at their historical ceilings.

Known non-critical foundation limitations: child task events record inherited model id but not child variant; the exact corrected preflight stdout is recorded in session evidence rather than a standalone raw file. Neither supports a broader claim. Remaining `main-alone` versus `unknown` routing semantics are outside this closed foundation incident and return to task 4.1.
