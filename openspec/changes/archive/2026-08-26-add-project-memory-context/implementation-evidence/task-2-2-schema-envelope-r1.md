# Task 2.2 Schema And Envelope Proof

- Recorded at: `2026-08-25T21:00:45.5012631Z`
- Product Candidate: `609bc96eb40c1be21f693edf0cfe124a0db50c640ac0955d86c9e7d9467f7a55`
- Candidate derivation: SHA-256 of the sorted five-file production manifest. Current hashes: `store.ts=7fa4e046ac748daefcf8b5c72404a312e41b21c35cd8565c4754dd9e48285d92`; `recall.ts=a149693f234f9b22c9adf822659ca736c751cd8c549907aafe7ad1f0b5d1cfb9`.
- Environment: `windows-node24.18.1-schema-envelope-r1`
- Invocation: `node tools/test-project-memory.ts`
- Exit status: `0`
- Focused result: `8/8` PASS.
- Schema oracle: repository-unsafe parent, drive-qualified, and UNC selectors are rejected; unexpected metadata and unsupported schema versions are rejected; over-16-KiB candidates and over-4-KiB lifecycle events fail before consuming a slot.
- Corpus oracle: the task `2.1` final-slot cases retain the exact 2,000-card/8,000-lifecycle/10,000-total limits. An externally materialized 8,001-event store rejects candidate, promotion, and recall with `corpus-envelope`, creates no card directory, and therefore remains read-only.
- Freshness oracle: a promoted card remains automatically eligible exactly 180 days after verification and is excluded one millisecond later; explicit recall reports `stale-verification`.
- Evidence oracle: promotion stores the SHA-256 of the repository-relative evidence file. Changed content produces `fingerprint-mismatch`; removal produces `missing-evidence`; both are visible in explicit recall and absent from automatic recall.
- Quarantine oracle: malformed matching records produce only privacy-safe `malformed:record_*` warnings, contribute no card, and do not enter automatic context.
- Population guard: fixed sub-envelope counts are checked before a candidate write and before any population is ranked, so over-limit enumeration cannot silently produce partial results.
- Additional validation: `node --check` passed for `store.ts`, `recall.ts`, and `tools/test-project-memory.ts`; code-quality inventory reports 595, 308, and 729 lines respectively, with no touched split-candidate.
- Effects and cleanup: provider-free disposable filesystem/process activity only; all child processes exited and fixture roots were removed in `finally`; no installed, remote, or worktree state was changed.
- Claim ceiling: task `2.2` exact schema/envelope/exclusion cases plus the retained task `2.1` lifecycle cases. Loaded-plugin evidence remains stale until the final current-candidate proof under task `4.1`.
