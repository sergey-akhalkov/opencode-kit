# Task 1.2 Provider-Free Contract Evidence

- Candidate: `roadmap-delivery-trajectory-routing-r2`
- Environment: Windows, Node `v24.18.1`, provider-free working-tree source
- Pack: `roadmap-delivery-trajectory-v1`, 13 reviewed members
- Governed source digest: `92e619024b11d4565208448438524d6e2a55cb695b923e83f625a7724c4e3d1d`
- Seed digest: `599ce034ddab8b074bf84e5a7fe1d348f5f29a8d5ff0063ffc1f6a85523041a9`
- Baseline bundle digest: `5bdc3f1367ac6b4dc98d96570b365fa90241234aa1a04cbbebb0132c319d3c1d`
- Candidate bundle digest: `816de5c04f849def4a662494932cfe31c5c177e169224fd46905c108e5b2978d`
- Evaluator digest: `cc5a29af2cb529d58ecfd299a43120cd7b79057bbb160eeabc3b2de6a061355a`
- Replay A/B: byte-identical, `liveCalls=0`, `modelCalls=0`, `providerCalls=0`
- Input difference: baseline `candidateArtifactAvailability=absent`; candidate `candidateArtifactAvailability=available`; `matchedExceptNamedDifference=true`
- Fail-closed controls: malformed JSON, stale bundle/source identity, private path, configured session, and existing evidence root rejected with non-zero exit.
- Focused validation: `npm.cmd run test:focused:consumer-outcome` exited 0 with `OK: consumer outcome tests=40`; current-candidate focused contract/library/instruction tests also exited 0.
- Cleanup: disposable smoke roots and malformed/private-path controls removed; retained evidence contains no private paths or source payloads.
- Claim ceiling: provider-free proof-contract evidence only. No configured semantic behavior, trajectory disposition, forecast, successor, or population-member claim is supported.
