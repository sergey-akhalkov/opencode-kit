# Task 4.1 Static Topology Evidence

## Result

`passed` for the five selected static-topology `STA-001` members under one governed source identity.

## Identity

- Governed source digest: `fa86fe3e438ae108154323226df3230a55c90a645d3cc2fc1f2f6f527641d690`
- Baseline bundle digest: `154cf9e49b72ca18e835e8a3b6c34ecf654c9276244b57fc87f082d1bc4c0665`
- Installed OpenCode: `1.18.25`
- Active installed-config SHA-256 before capture and after replay: `0050d9de6b28e9b5574b57a519c5a3c09766910dc97afd0dcaf2b4a778628144`
- Configured calls: `5` sessions / `10` model calls, split as one-member then four-member bounded captures
- External or protected effects: none

## Preserved Bundles

| Bundle | Members | Candidate Digest | Evaluation Digest | Capture | Replay |
|---|---|---|---|---|---|
| `evidence/team-advising-candidate-r4-task-4-1-overstaffing/bundle.json` | `overstaffing-negative-control` | `0eb92dd510f7fe1f75967325dbec2b7578037adf2b27ea405281270ec23be3df` | `d9a9aadba8afc87503180177bbbefec6eec5e4772f41b4914d6dad64415afa61` | passed, `liveCalls=1` | passed, `liveCalls=0` |
| `evidence/team-advising-candidate-r4-task-4-1-complement/bundle.json` | `multi-domain-bounded-team`, `procedural-skill-no-fresh-agent`, `conditional-later-specialist`, `active-profile-capability-unavailable` | `6cb0cd7717026c526994e950a29aad3ceae923ed78b16c59cd7f573bc409fa55` | `80ec68823c6a04807614527ea31ab61be23cdbd5dbb079a66e5300a8790d194d` | passed, `liveCalls=4` | passed, `liveCalls=0` |

## Main Disposition

| Scenario | Disposition |
|---|---|
| `multi-domain-bounded-team` | The advisor selected only the distinct available architecture and execution-safety owners; main retained integration and outcome ownership. |
| `procedural-skill-no-fresh-agent` | The advisor selected `reuse-discovery` without a fresh specialist child. |
| `conditional-later-specialist` | The conditional test-coverage role remained dormant and main recorded its activation condition. |
| `active-profile-capability-unavailable` | The unavailable exact catalog id remained explicit and main kept the disposition `unknown` without checkout/static fallback. |
| `overstaffing-negative-control` | The advisor returned `main-alone`; main dispatched no generic reviewer fan-out. |

## Claim Ceiling

This evidence supports only these five `STA-001` members for the recorded source, model route, generated core profile, installed OpenCode, and configured proof environment. It does not support a complete-population, universal-routing, cross-model, or deployed-runtime claim.
