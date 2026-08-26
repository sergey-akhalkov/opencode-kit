# SLBE-001 Evidence Sufficiency Challenge

- Candidate Reference: `strengthen-shift-left-behavior-evidence-working-tree-r1`
- Effective Model: `xai/grok-4.6`
- Review Mode: fresh read-only runtime evidence challenge
- Claim: The captured candidate satisfies the two reviewed shift-left sequencing decisions under the recorded environment.
- Conclusion: No evidence gap prevents representing that exact finite-population statement as supported. The ceiling remains two fixed cases, one sample per arm, and bundle-recorded identities only.

## Risk Matrix

| Risk ID | Requirement / invariant | Reachable scenario and evidence | Consequence | Likelihood | Confidence | Reproduction | Smallest mitigation |
|---|---|---|---|---|---|---|---|
| `SLBE-ENV-001` | Environment identity must not claim an unrecorded OpenCode version. | `capture.ts` records `opencodeVersion: "opencode"`; r2 bundles do not record `1.18.22`. | A reader could treat the version label as oracle-qualified. | High for label mismatch; host version otherwise separately observed. | High | Compare r2 `environmentIdentity.opencodeVersion` with `evidence-index.json`. | Remove the version from the structured environment ID and keep the claim on bundle-recorded fields. |
| `SLBE-SRC-001` | Baseline/candidate source identity must not imply staged-load or byte-equality that was not observed. | Baseline and candidate governed digests differ across `HEAD` versus Windows working-tree hashing; both commands loaded the same `global` path and Git reported no governed-source diff. | Hash inequality can be misread as instruction change; same-path loading can be misread as staged isolation. | High for representation mismatch; semantic difference unknown from hashes alone. | High | Compare r2 source identities and `governedSourceIdentity` with `OPENCODE_CONFIG_DIR` selection. | Retain the material exclusion; claim neither staged isolation nor byte-identical raw files. |
| `SLBE-ORA-001` | The oracle is a checked decision, not later execution, causation, or safety. | Reviewed cases and request name the decision vocabulary; checker/evaluator compare exact tuples. The r1 failed decision remains non-proof. | Passing can reflect fixture following and cannot authorize broader behavior. | High | High | Compare cases, pack expectations, checker, evaluator, and r2 proof stdout. | Keep the finite-population ceiling and explicit exclusions. |
| `SLBE-RPL-001` | Claimed repeated replay should have inspectable artifacts. | The indexed candidate evaluation is terminal, but the two replay runs were previously history-only. | A reader could not independently distinguish the two replay invocations. | Medium | High | Inspect indexed lanes for replay artifacts. | Preserve two provider-free replay outputs and bind them to the terminal lane. |
| `SLBE-TOL-001` | Failed tool calls must not be mistaken for a clean path or Product Candidate defect. | R2 samples record one or two failed bash calls, followed by green validation/proof, passing decision oracles, no permission violations, and complete cleanup. | Unclassified tool noise could be overinterpreted. | Unknown | Medium | Inspect r2 `toolCalls` and `friction` blocks without expanding private provider text. | Record the counts as observation-path noise outside the semantic claim. |

## Maximum Claim

The candidate produced terminal passing checked-decision oracles for exactly `reachable-characterization-first` and `sufficient-lower-rung`, one sample per baseline and candidate arm, under the bundle-recorded model, variant, profile, OS, Node, prompt, fixture, permission, scenario, and evaluator identities. The complete pair used four configured requests, cleanup was complete, and no hard-gate fact was weaker than baseline.

No reliability, later execution, productivity, general safety, higher-rung, other-model, instruction-causation, staged-source-isolation, raw-byte-equivalence, or OpenCode-version claim is supported.
