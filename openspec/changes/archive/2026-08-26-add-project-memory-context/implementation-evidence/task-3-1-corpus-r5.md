# Task 3.1 Maintained Corpus Proof

- Recorded at: `2026-08-25T21:46:07.4991217Z`
- Product Candidate: `29ba3b07623d31065236053e30d9d488650e900651d868b63d60b96d73aeed8b`
- Proof Runner: `tools/proofs/project-memory-context.ts`, SHA-256 `e88b5e5e05e8a083836c3d1bea4d600655b811ca0dd49f08338ff14ed6573418`.
- Reviewed Seed: `tools/proofs/fixtures/project-memory/pmc-001.seed.json`, file-bytes SHA-256 `f4ef151ac404cf23edcca838aeadf7c8bbd5365abb0bf0ec44fccb73c5994d9d`; parsed insertion-order canonical JSON SHA-256 `0c40fce19101e9ce1338008c8dfd7d4364ecffdba1d5e504c441bb929cc6a986` as recorded in `raw.json`.
- Environment: `windows-node24.18.1-pmc-corpus-r5`
- Invocation: `node tools/proofs/project-memory-context.ts --mode corpus --fixture tools/proofs/fixtures/project-memory/pmc-001.seed.json --evidence-dir openspec/changes/add-project-memory-context/implementation-evidence/task-3-1-corpus-r5`.
- Exit status: `0`; evaluation `status=complete`; `failed=[]`; every `PMC-001` member row is `supported` at the provider-free boundary.
- Production-path oracle: reviewed records and lifecycle states are materialized through production manage APIs; queries use production eligibility, BM25/boost scoring, renderer, actual tool objects, and root hooks. The runner also executes the focused direct and hook process oracles named by the seed.
- Exact scoring oracle: the selector-boost case pins score `12.931807481447045`, BM25 `2.931807481447044`, one matched term, and true exact path/symbol signals; observed order starts with `exact-selector` and then `relevant-active`.
- Population oracle: relevant hit, weak miss, candidate, invalidated, age-stale, fingerprint mismatch, malformed quarantine, privacy, count/byte outputs, root isolation/injection, subagent, hook order/timeout, selected-ref revalidation, compaction, disabled mode, concurrency, Serena read-only, and no-side-effect checks are all supported.
- Determinism oracle: fixture schema/readback and two in-process materializations are stable. Independent corrected captures `r4` and `r5` are byte-identical and share normalized output SHA-256 `ffb89a1dac10c6f7db8dbb1b894e44ae74053ff255bd65f6685f2936dbb47e4c`.
- Predecessor evidence: `r1` proved the first population pass. `r2` and `r3` proved behavior but failed cross-run hash equality because curated fixture mtime remained variable. The runner now pins curated mtime to the reviewed clock and normalizes random card refs before hashing; do not reuse pre-`r4` output for determinism claims.
- Effects and cleanup: provider-free disposable Git/data/Serena fixtures and proof-owned child processes only; external fetch canary count `0`; disposable Git status unchanged; fixture cleanup completed before raw evidence was written; no installed, remote, provider, transcript, target-worktree-memory, or Serena mutation survived.
- Claim ceiling: current provider-free `PMC-001` maintained corpus only. The full 2,000-card/10,000-event resource boundary, current loaded OpenCode oracle, critical SDET, and independent evidence-sufficiency challenge remain later tasks.
