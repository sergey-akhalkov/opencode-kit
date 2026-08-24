# Task 1.1 Ownership And Baseline

## Ownership / path matrix

| Writer | mutationEnabled | Shared with harvest | Concurrent writer | Disposition |
| --- | --- | --- | --- | --- |
| harvest-repeated-agent-workflows | false | self | none | planning owner |
| improve-change-locality-guidance | false | `global/AGENTS.md`, contracts, proofs README, test-contracts | none live | serialize instruction mutation until CLC archives or transfers |
| add-autonomous-roadmap-mission-runtime | false | `global/bin/roadmap-mission.ts` only | none | no overlap with a new `global/bin/repo-candidate-snapshot.ts` |
| bound-completion-runtime-hot-paths | false | `global/plugins` | none | no overlap |
| optimize-shared-opencode-runtime-resources | false | workstation | none | no overlap |
| fix-workstation-restart-reliability | true | workstation | none vs harvest | no overlap |

Ownership inventory: harvest/CLC overlaps are planning-only and `unresolved: false`. No unknown overlapping writer liveness on harvest 2.1's first path (`global/bin/repo-candidate-snapshot.ts`).

## Baseline identity

- Accepted pointer `config/consumer-outcome-baseline.json` sourceDigest `669af62ac54df36f78d84e99b7bbef388e10d5227d25fd45eae56ce86320a3e5`
- Preflight `--source-ref HEAD` governedDigest matches that sourceDigest; scenarioDigest `f8ea029257ce14a3cbbba22ee9e21acf0469f70998685ed488fea4a76af61c1c` matches; modelCalls 0; status ready
- Replay/evaluate of `tools/proofs/fixtures/consumer-outcome/evidence/baseline-accepted/bundle.json` with `baseline-establishment`: status `baseline-established`, reasons `[]`, liveCalls 0
- Current-candidate gate `--source-ref HEAD` remains `blocked` / `stale-evaluator`. Source identity is current; evaluator staleness is a pre-existing Known Limitation, not a missing baseline identity. No new baseline capture.

## Recurrence

Repeated manual sequence remains `git status` + `git diff` + `git log` for candidate inspection. This change's Automation Dividend still names that sequence.

## Cleanup

Provider-free only. No sessions, processes, or fixtures created. UTF-16 r1 redirects are unused; r2 UTF-8 captures are the evidence.
