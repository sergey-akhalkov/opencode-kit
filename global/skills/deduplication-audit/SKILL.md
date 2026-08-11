---
name: deduplication-audit
description: Use ONLY for explicit /dedup, scoped duplication audits, or clone analysis; finds candidates with jscpd and proves ownership before recommending reduction.
license: MIT
---

# Deduplication Audit

Use this skill only when the user explicitly invokes `/dedup`, requests a scoped deduplication audit, or asks for clone analysis. Keep it unloaded for trivial owner-local fixes, ordinary implementation, general maintainability review, and broad exhaustive audits. Use `codebase-audit-loop` only when the user separately requests exhaustive coverage.

This workflow is read-only. It discovers and classifies candidates; it never edits production, removes tests, installs dependencies, or authorizes a refactor.

## Scope And Tool Gate

1. Interpret the complete command argument as scope intent. Resolve one explicit path or bounded path set inside the current repository. If it is missing, ambiguous, or escapes the repository, ask one precise scope question and do not scan yet.
2. Record the repository root, resolved scope, and exclusions. Preserve default `.gitignore` behavior; never pass `--no-gitignore`.
3. Run `jscpd --version`. Require major version 5. If unavailable or incompatible, report the tool layer blocked; do not install it or add a target-repository dependency.
4. Start with this read-only compact scan, adapting only the final scope path:

```sh
jscpd --reporters ai --no-colors --no-tips --min-tokens 50 --min-lines 5 --mode mild --ignore "**/node_modules/**,**/vendor/**,**/generated/**,**/dist/**,**/build/**,**/coverage/**,**/.cache/**,**/out/**,**/target/**" <scope>
```

5. For a narrow scope where smaller clones materially affect the request, one targeted follow-up may use `--min-tokens 20`; label the changed sensitivity. Do not broaden scope merely because the first scan has no match.

Do not write `.jscpd.json` or use file reporters in the target repository. A non-zero process exit is a failed scan, not "no duplicates". Exact and near textual clones are candidate locations only: `jscpd` output, token counts, and similarity never prove semantic equivalence, safe deletion, or safe extraction.

## Semantic Evidence

For every material candidate, inspect both source blocks and gather bounded evidence inside the selected scope and direct relationships:

- declarations, symbols, exports, and owning modules;
- callers, importers, adapters, and actual integration paths;
- tests, fixtures, snapshots, protocol vectors, and compatibility contracts;
- input/output contract and validation differences;
- errors, status mapping, fallback, and recovery differences;
- side effects, mutation, I/O, persistence, timing, concurrency, cleanup, activation, and lifecycle differences.

Prefer graph or LSP symbol/caller relationships only when they resolve the exact current repository. Never enumerate unrelated indexed projects. Use targeted source search when graph/LSP evidence is unavailable. Missing evidence remains `unknown` and normally yields `not proven`; do not infer an owner or contract.

Choose a canonical owner only when current callers, module responsibility, and the complete reachable contract support it. The oldest or shortest copy is not automatically canonical.

## Classification And Recommendation

Assign exactly one classification:

- `exact duplicate`: text/token duplicate with no observed contract, error, effect, or lifecycle difference after evidence review;
- `near duplicate`: materially similar implementation with explicit differences still suitable for comparison;
- `overlapping responsibility`: different code owns intersecting behavior that should have one current owner;
- `redundant wrapper`: pass-through layer with no unique current contract, effect, lifecycle, or compatibility role;
- `keep separate by design`: similarity is intentional because contracts, effects, ownership, lifecycle, or compatibility differ;
- `not proven`: available evidence cannot establish safe equivalence or ownership.

Recommend exactly one of `remove | reuse | extract | parameterize | keep separate`.

Prefer `remove`, then `reuse`. Recommend `extract` or `parameterize` only when it reduces total current concepts or branches and does not increase coupling, public surface, lifecycle states, or navigation cost. Line reduction alone is insufficient. When differences require flags that recreate both implementations inside a generic helper, prefer `keep separate`.

Preserve every unique critical or compatibility test oracle. Propose a test for removal only when a named retained test proves the same externally meaningful behavior and no critical or compatibility signal is lost.

## Existing Reviewer

After source/caller/test enrichment, invoke the existing `code-quality-reviewer` once when at least one material `remove`, `reuse`, `extract`, or `parameterize` candidate remains. Give it the exact candidate reference and source/test locations; request its normal Reduction Matrix. Do not create or invoke a `deduplicator` agent.

The reviewer is independent read-only evidence. Main reconciles its matrix with the clone and semantic evidence. Reviewer absence or disagreement is an evidence gap, not refactoring authority. Do not launch it for a no-match result, candidates already classified `keep separate by design`, or a trivial-fix request.

## Production Boundary

End the audit before mutation. If a later accepted task selects one recommendation, main implements the smallest bounded production slice, retains named critical/compatibility oracles, and proves affected callers at a representative runtime boundary. Clone disappearance is never Runtime Proof.

## Output

Return:

- `Scope`: repository-relative paths, exclusions, and whether coverage was bounded or truncated.
- `Tool Evidence`: exact `jscpd` version/invocation, exit status, clone count, stdout/stderr summary, and sensitivity changes.
- `Candidate Matrix`: one row per material candidate with:
  - classification and exact locations;
  - canonical owner or `unknown`;
  - contract, error, effect, and lifecycle differences;
  - callers and tests inspected;
  - retained critical/compatibility test oracles;
  - `remove | reuse | extract | parameterize | keep separate`;
  - estimated net line delta and net concept delta;
  - coupling/public-surface effect;
  - confidence and evidence gaps;
  - required Runtime Proof before any later production change.
- `Reviewer Evidence`: inspected candidate reference and reduction rows, or `not run` with reason.
- `No Safe Reduction`: explicit evidence when every result is `keep separate by design`, `not proven`, or no clone matched.
- `Audit Effects`: confirm production source/tests were unchanged and list any disposable evidence cleanup.

Do not return an automatic edit plan, semantic-equivalence claim, exhaustive-audit claim, or permission to delete a unique test oracle.
