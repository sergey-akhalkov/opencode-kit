# Task 4.2 GRIND-TSB-001 Reuse-First Population Map R1

## Scope

- Candidate target: `grind-task-scoped-population-r2`.
- Environment target: Windows, OpenCode `1.18.25`, installed primary `xai/grok-4.6/high`, hidden arbiter `xai/grok-4.6/high`, current working-tree production source.
- Reviewed population: exactly 20 members.
- Current disposition: `unknown`; this map is the pre-capture inventory, not claim closure.
- Maximum claim: the exact `GRIND-TSB-001` maximum in `proposal.md`; no universal, compatibility, protected-effect, or unbounded-progress inference.

## Canonical ID Note

This pre-capture map used exploratory row aliases. They are not a second population. The final claim seed and `task-4-2-population-r1.md` use only the existing canonical `evidence-index.json` population IDs. Product partial/final map to `partial-product-decision` / `all-remaining-product-decision`; credential plus capability controls combine under `missing-credential-capability`; non-product waiting/no-effect maps to `safety-protected-gate`; the technical capture supports both `circular-process-stop-line` and `technical-blocker`; autonomous maps to `autonomous-offered-label-question`; stale/cycle and both malformed controls map to `stale-frontier`, `cyclic-frontier`, and one `malformed-frontier`; unchanged/budget rollover map to `unchanged-failed-strategy` and `execution-epoch-exhaustion`; interruption/restart/completion map to `explicit-interruption`, `restart-legacy-reconciliation`, and `completed-outcome`; the installed product and non-product question paths map separately to `premature-pending-product-question` and `premature-pending-non-product-question`; blocked-proof, roadmap, and campaign IDs were already canonical. The human-reply race remains a supporting safety oracle for pending-question members, not an additional population member.

## Matrix

| # | Member ID | Required Oracle | Reused Evidence | R1 Status | Missing Current Proof |
| -: | --- | --- | --- | --- | --- |
| 1 | `product-partial-independent-first` | premature product question rejected; independent marker before any product handoff | task-4.1 r10 product capture/replay | unknown | Current S25/S27 arbiter and runner identity recapture. |
| 2 | `product-all-remaining-decision` | empty runnable frontier leaves exactly one product decision; no invented answer | task-4.1 r10 product capture/replay | unknown | Current S25/S27 arbiter and runner identity recapture. |
| 3 | `credential-safety-independent-first` | protected question rejected; independent marker runs without protected effect | task-4.1 r10 non-product capture/replay | unknown | Current S25/S27 arbiter and runner identity recapture. |
| 4 | `non-product-wait-after-drain` | empty non-product frontier enters question-free safety waiting, never completion | task-4.1 r10 non-product capture/replay | unknown | Current S25/S27 arbiter and runner identity recapture. |
| 5 | `technical-circular-reconciliation` | one diagnostic continuation; exact marker; complete frontier; later pass | task-4.1 r10/S22 technical capture/replay | unknown | Current S25/S27 arbiter and runner identity recapture. |
| 6 | `blocked-proof-lane-independent-route` | blocked lane remains scoped while one eligible sibling completes; no owner question | task-3.2 roadmap/campaign evidence | unknown | Fresh current-candidate roadmap/campaign focused readback. |
| 7 | `autonomous-offered-label` | complete frontier uses official reply with exact offered safe label and no human reply | installed-suite-autonomous-s27 capture/replay | supported | None; retain current source/environment identity. |
| 8 | `frontier-stale-generation` | stale generation rejected with no persistence and last valid generation retained | task-2.1 frontier evidence; focused guard oracle | supported | None; current focused guard suite passed 54 tests. |
| 9 | `frontier-cycle-rejected` | dependency cycle rejected with no persistence | task-2.1 frontier evidence; focused guard oracle | supported | None; current focused guard suite passed 54 tests. |
| 10 | `frontier-malformed-input` | invalid item status rejected with cause and no persistence | task-2.1 frontier evidence; focused guard oracle | supported | None; current focused guard suite passed 54 tests. |
| 11 | `frontier-malformed-persisted` | unreadable persisted frontier remains byte-preserved and fail-closed | focused guard oracle at `tools/test-session-completion-guard.ts:3836` | supported | None; current focused guard suite passed 54 tests. |
| 12 | `unchanged-strategy-waits-budget` | repeated exhausted work reaches budget wait, not owner scope or retry | focused guard cross-field/controller oracles | supported | None; current focused guard suite passed 54 tests. |
| 13 | `execution-epoch-rollover` | finite exhaustion with new progress rolls epoch; no owner handoff | focused guard cross-field/controller oracles | supported | None; current focused guard suite passed 54 tests. |
| 14 | `explicit-human-interruption` | explicit human stop/pause suspends guard; negated/synthetic text does not | focused guard interruption oracles | supported | None; current focused guard suite passed 54 tests. |
| 15 | `capability-route-exhaustion` | unavailable hidden route ends capability-blocked with last cause and no child | focused guard route-settle oracle at `tools/test-session-completion-guard.ts:3215` | supported | None; current focused guard suite passed 54 tests. |
| 16 | `human-reply-race-precedence` | in-flight official reply cannot apply after disable/human lifecycle change | focused guard question-race oracle at `tools/test-session-completion-guard.ts:2192` | supported | None; current focused guard suite passed 54 tests. |
| 17 | `roadmap-independent-sibling` | dependency-valid roadmap sibling executes before terminal product/wait result | task-3.2 roadmap evidence | unknown | Fresh current-candidate roadmap focused readback. |
| 18 | `campaign-independent-sibling` | campaign consumes completed sibling/checkpoint without clearing blocked slice | task-3.2 campaign evidence | unknown | Fresh current-candidate campaign focused readback. |
| 19 | `restart-legacy-migration` | retained schema-v1 audit becomes stale before any new effect | focused guard restart oracle at `tools/test-session-completion-guard.ts:4023` | supported | None; current focused guard suite passed 54 tests. |
| 20 | `completed-outcome-pass` | complete frontier answers safely, resumes, and later completion audit passes | installed-suite-autonomous-s27 capture/replay | supported | None; retain current source/environment identity. |

## Next Boundary

1. Run one current-source default installed suite for members 1-5; every capture must replay terminally before the next scenario.
2. Run fresh provider-free roadmap/campaign focused validation for members 6, 17, and 18.
3. Materialize a final 20-row matrix and claim seed; run the existing evidence-index materializer, schema/readback, then the required fresh evidence-sufficiency challenge.

No other configured population call is authorized by this map.
