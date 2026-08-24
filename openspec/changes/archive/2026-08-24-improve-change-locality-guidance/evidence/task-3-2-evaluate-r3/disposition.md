# CLC 3.2 Semantic Disposition

Provider-free evaluate: 7/7 rows. `baselineComplete=false` because several baseline oracles already passed (tooling pack treats non-source-placement as expected gap). `candidateComplete=false` because three runtime oracles remain red.

| Scenario | Owner | Runtime oracle | Disposition |
| --- | --- | --- | --- |
| one-off-local-fix | none | pass | Keep. Negative control. |
| accepted-second-variant | openspec-architecture-reviewer | fail | Keep owner routing. Runtime format gap is non-critical vs baseline. |
| external-integration-boundary | openspec-architecture-reviewer | fail | Keep owner routing. Isolation oracle still red. |
| non-trivial-state-transition | none | fail | Parked: material trigger did not launch owner. No wording recapture this increment. |
| mixed-owner-file | openspec-architecture-reviewer | pass | Keep. |
| delegated-production-ownership | none | fail | Parked: no owner launch. |
| hypothetical-extension-negative-control | none | pass | Keep. No speculative owner. |

No AGENTS.md recapture. Maximum claim remains the captured seven-scenario population.
