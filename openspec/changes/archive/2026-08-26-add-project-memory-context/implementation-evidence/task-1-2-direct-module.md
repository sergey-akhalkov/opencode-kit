# Task 1.2 Direct Production-Module Proof

- Recorded at: `2026-08-25T18:45:35.824Z`
- Product Candidate: `0cd63d980257b424fc2544ba7c1a6ae1e4ba827a6acb4d12fb3cd38ba442e18a`
- Environment: `windows-node24.18.1-direct-r1`
- Invocation: `node tools/test-project-memory.ts`
- Exit status: `0`
- Stdout:
  - `PASS disabled mode performs no project-memory IO`
  - `PASS candidate promote and recall stays bounded redacted and outside the worktree`
- Stderr: empty
- Representative input: one disabled startup, then one enabled disposable Git project with isolated `OPENCODE_DATA_DIR`, a procedure candidate, explicit promotion, exact path/symbol selectors, a supported credential shape, and canonical project-root text.
- Observed result: disabled startup created no store; enabled candidate folded to active after promotion; relevant recall returned exactly one result with exact-path evidence; the rendered capsule stayed within 8 KiB and carried the precedence header.
- Privacy/safety observations: persisted records omitted the raw project root and credential, the project `git status --porcelain` was unchanged, the store remained outside the worktree, and the fetch egress canary observed zero calls.
- Navigation: `store.ts` is 569 lines (`attention`, not `split-candidate`) and remains cohesive around root/store/fold operations; record parsing/serialization is isolated in `records.ts`, scoring/rendering in `recall.ts`, and public construction in `index.ts`.
- Cleanup: disposable project and data roots removed in `finally`.
- Claim ceiling: direct production-module exact cases only. Loaded plugin tools/hooks, root-session verification, compaction, curated Serena, complete lifecycle/error population, full envelope performance, and cross-process invalidation remain unproved.
