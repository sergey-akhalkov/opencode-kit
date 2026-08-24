## Context

The current project inventory only recognizes conventional directory names and therefore misreports this repository. The reduction matrix also identifies zero-consumer and exact-helper candidates, but graph/reference absence alone is insufficient for plugin/dynamic-loader deletion.

## Goals / Non-Goals

**Goals:** accurate deterministic inventory for real repository layouts and the smallest proven deletion/reuse set.

**Non-Goals:** generic language inference, clone scoring, broad abstractions, or large behavior-owner refactors.

## Decisions

### Extend the current inventory instead of adding a framework

Add explicit classifiers for root-level analyzable files, `tools/test*.ts`, package/build manifest paths, and maintained source/test patterns. Continue stable traversal and existing ignore policy; add generated/evidence/vendor counts and classification reasons to output without changing the CLI entrypoint.

Alternative rejected: a generic repository-analysis framework would duplicate code intelligence and still require project-specific semantics.

### Use self-representative fixtures

Add a fixture matching the kit layout plus conventional, mixed, evidence-heavy, unreadable, and empty projects. Assert exact roots, file counts, exclusions, redaction, output schema, and failure status. The kit's own inventory output becomes a checked snapshot of facts, not a golden prose report.

### Delete only named zero-consumer primitives

For each `kdco-primitives` candidate, combine literal import/config search, graph references, OpenCode runtime/plugin source inventory, package exports, and dynamic-resolution search. Any unknown keeps the file. Delete the complete candidate set only when installed plugin inventory and tests remain unchanged.

### Reuse helpers only on exact contracts

Start with the reviewer's named exact helper pairs. Compare signatures, errors, redaction, ordering, side effects, and unique tests. Reuse an existing owner only when net concepts decrease; otherwise record `keep separate`. Do not create a generic proof utility layer.

### Park unrelated large files

Inventory records workstation/guard/doctor sizes and responsibility maps. This change does not edit them unless its own inventory/reduction work touches the same owner and requires one cohesive extraction.

## Failure Boundaries And Diagnostics

- Unreadable root: non-zero with original cause and redacted path.
- Ambiguous file class: explicit `unknown`, not guessed source/test.
- Dynamic loader uncertainty: deletion blocked.
- Reuse changes an oracle/error: revert candidate and keep separate.

## Fidelity And Authorization

- Current rung: reproduced false inventory and source-level reduction evidence.
- Next real boundary: run corrected inventory on this checkout and disposable layouts; then copied-source installed plugin proof after deletion.
- No external/provider/host mutation.

## Risks / Trade-offs

- [Broader patterns misclassify fixtures] -> explicit precedence and reason fields.
- [Deletion misses dynamic load] -> runtime source inventory and copied-source load proof.
- [Helper reuse increases coupling] -> require concept reduction and exact contract equivalence.

## Migration Plan

1. Add failing self-layout fixtures and classification reasons.
2. Correct inventory and prove output on this repository.
3. Re-run zero-consumer evidence, delete only proven primitives, and prove installed loading.
4. Evaluate named helper reuse one cluster at a time, retain unique oracles, and run full validation.
