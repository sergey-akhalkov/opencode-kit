# Task 1.2 Current Direct Production-Module Proof

- Recorded at: `2026-08-25T20:36:25.9551148Z`
- Product Candidate: `b3bcf25f67bf7b9bf0f444362041571eee167bc85c058ca2e2d75d533fb1975d`
- Environment: `windows-node24.18.1-opencode1.18.23-loaded-r8`
- Invocation: `node tools/test-project-memory.ts`
- Exit status: `0`
- Stdout:
  - `PASS disabled plugin input registers no project-memory surface`
  - `PASS disabled mode performs no project-memory IO`
  - `PASS candidate promote and recall stays bounded redacted and outside the worktree`
  - `PASS session env composes root-only tools and message-before-transform context`
- Additional validation: `node --check` passed for `session-env.ts`, all four project-memory production modules, and the maintained proof runner.
- Observed result: the current composed production candidate retains the direct disabled/no-write and candidate-promote-recall exact cases with bounded redaction and no worktree or fetch-egress effect.
- Cleanup: disposable project and data roots were removed by the test.
- Claim ceiling: current direct-module exact cases only; this artifact does not prove the complete lifecycle or `PMC-001` population.
