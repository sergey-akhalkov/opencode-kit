# Task 2.1 Lifecycle And Capacity Proof

- Recorded at: `2026-08-25T20:54:10.1684662Z`
- Product Candidate: `d97e40a4ce0c238a406e69c52591a9746dd4cbb036abab41ecfc3b09c894901f`
- Candidate derivation: SHA-256 of the sorted five-file production manifest used by task `1.3`; current `store.ts` SHA-256 is `789b5d26b4d36dbe73016e863763d83f968188453712a7d556a279e5af439e4e`.
- Environment: `windows-node24.18.1-multiprocess-r1`
- Invocation: `node tools/test-project-memory.ts`
- Exit status: `0`
- Focused result: `7/7` PASS.
- Lifecycle oracle: repeated promotion and invalidation append no duplicate sequential event, return the original lifecycle event ref, and retain two immutable events; promotion after invalidation raises `invalid-transition`.
- Fold oracle: every permutation of two promotions and one invalidation folds to `invalidated`, retains the latest verification metadata, and preserves the deterministic invalidation reason.
- Crash oracle: empty matching card/event files are treated as privacy-safe malformed warnings, contribute no card, and do not disable valid records.
- Concurrency oracle: two synchronized independent Node processes raced for one remaining card slot and then one remaining lifecycle slot. In each race exactly one action completed, exactly one returned `capacity`, the final slot parsed as a valid production record, file count stopped at 2,000 or 8,000, and no next-slot file existed.
- Production correction: duplicate invalidation now returns its original invalidation event ref. Duplicate promotion/invalidation reuse the event map from the same population snapshot instead of rescanning the lifecycle directory; no public type or API was added.
- Additional validation: `node --check global/plugin/project-memory/store.ts && node --check tools/test-project-memory.ts` exited `0`.
- Code health: `store.ts` and the cohesive project-memory test owner remain in the repository's attention band, below the split-candidate band. A read-only reduction review identified the same-snapshot event-map reuse, which was applied and re-proved.
- Effects and cleanup: provider-free local filesystem/process activity only; all proof-owned child processes exited and disposable roots were removed in `finally`; no remote or installed runtime state was changed.
- Claim ceiling: the exact task `2.1` lifecycle/final-slot cases only. The prior loaded R8 claim is stale after this production mutation and remains scheduled for one final current-candidate loaded proof under task `4.1`.
