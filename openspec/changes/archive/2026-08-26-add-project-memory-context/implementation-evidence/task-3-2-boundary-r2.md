# Task 3.2 Full-Envelope Direct Scan Proof

- Recorded at: `2026-08-25T21:52:06.6626605Z`
- Product Candidate: `29ba3b07623d31065236053e30d9d488650e900651d868b63d60b96d73aeed8b`
- Proof Runner: `tools/proofs/project-memory-context.ts`, SHA-256 `f562eb474b24e70d38ea7b41c717ce87f52c689f881e0bfaeda2dc2ebf187fc4`.
- Environment: `windows-node24.18.1-pmc-boundary-r2`
- Invocation: `node tools/proofs/project-memory-context.ts --mode boundary --evidence-dir openspec/changes/add-project-memory-context/implementation-evidence/task-3-2-boundary-r2`.
- Exit status: `0`; evaluation `status=complete`; `failed=[]`.
- Population oracle: exactly `2,000` valid candidate files plus `8,000` valid lifecycle files were enumerated. Folding produced `1` active, `1,999` invalidated, and `0` candidate cards with no warnings.
- Representative sizes: candidate `15,683` bytes, promotion `3,841` bytes, invalidation `3,781` bytes. These exercise near-limit members of each declared 16-KiB/4-KiB class.
- Rendering oracle: automatic recall returned the deterministic active ref, rendered exactly `8,192` capsule bytes, reported truncation, and remained warning-free.
- Performance observations: `r1` scan `4,235.50 ms`, recall `2,122.48 ms`, post-recall RSS `344,363,008` bytes. `r2` scan `4,428.06 ms`, recall `2,281.67 ms`, post-recall RSS `340,676,608` bytes. These are captured-environment observations, not cross-platform SLO claims.
- Determinism oracle: both runs share fixture SHA-256 `3f07399db9fc1c694c2ffaed232608a04c165da6a7ebd390c4ed734d07626241` and projection SHA-256 `81abbde99e98790865be230c6fbe0223d36a0da0590796c7205d8edda29468a0`.
- Effects and cleanup: provider-free disposable Git/data fixtures only; external fetch canary count `0`; Git status unchanged; cleanup completed before evidence write; no installed, remote, provider, transcript, worktree-memory, or Serena effect.
- Decision: retain the direct scan. The complete declared boundary reached the next proof rung reliably in two runs; a derived index, database, embeddings, or design/history bottleneck revision is not justified.
- Claim ceiling: full-envelope direct-scan behavior on the captured Windows/Node environment. Current loaded OpenCode and broader cross-platform performance remain outside this task.
