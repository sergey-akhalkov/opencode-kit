# Candidate Evaluation R2 Failure

Both attempts were provider-free and made zero model calls. Baseline and candidate raw bundles were not modified.

## Attempt 1

```text
npm run proof:reuse-discovery -- --mode evaluate --evidence-root openspec/changes/simplify-reuse-first-discovery/implementation-evidence/candidate-evaluation-r2 --baseline-root openspec/changes/simplify-reuse-first-discovery/implementation-evidence/baseline-sessions-r1 --candidate-root openspec/changes/simplify-reuse-first-discovery/implementation-evidence/candidate-sessions-r2 --candidate-id simplify-r2-proof-r2
```

Exit: non-zero. Cause: `ENOENT` for the inferred but nonexistent `baseline-sessions-r1/local-owner.bundle.json`. The evaluator had already created the output root.

## Attempt 2

```text
npm run proof:reuse-discovery -- --mode evaluate --evidence-root openspec/changes/simplify-reuse-first-discovery/implementation-evidence/candidate-evaluation-r2 --baseline-root openspec/changes/simplify-reuse-first-discovery/implementation-evidence/baseline-sessions --candidate-root openspec/changes/simplify-reuse-first-discovery/implementation-evidence/candidate-sessions-r2 --candidate-id simplify-r2-proof-r2
```

Exit: non-zero. Cause: fail-closed `Evidence root already exists` after attempt 1. No evaluation verdict was written.

## Unlock Condition

Read every immutable input before creating output, use the verified baseline path, and write a new output root once through the terminal verdict.
