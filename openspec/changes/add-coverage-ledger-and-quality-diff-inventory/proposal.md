# Proposal: Add Coverage Ledger And Quality Diff Inventory

## Why

Documentation hardening, file review, codebase audits, and code-quality reviews currently ask agents to maintain Markdown ledgers and manually map changed files to file-size/navigation signals. These are mechanical tasks: line range coverage, changed-block invalidation, finding field presence, and changed-file line-count deltas can be proven by deterministic tooling.

Manual coverage bookkeeping is easy to skip during long audits, and full-repo line inventory forces reviewers to manually distinguish new risk from pre-existing large files. A JSON coverage ledger and diff-aware code-quality inventory would make the evidence explicit while leaving final quality judgment to reviewers.

## What Changes

- Add a `coverage:ledger` helper for explicit file/block coverage ledgers with interval validation, block hashes, required finding fields, and changed-block invalidation.
- Update documentation and codebase audit ledger skills to use JSON ledgers for mechanical coverage proof.
- Extend `code-quality:inventory` with changed-file mode, base ref support, old/new band deltas, and new split-candidate gates.
- Add schema/version metadata to relevant inventory outputs so downstream agents can trust the output shape.

## Goals

- Prove audit/review coverage without relying on memory or Markdown checklist discipline.
- Detect stale reviews when scoped files or blocks change after review.
- Make code-quality reviewer handoffs focus on touched-file risk instead of full-repo noise.
- Keep all helpers deterministic: intervals, hashes, line counts, git file sets, and enum statuses only.

## Non-Goals

- Do not infer logical risk, severity, responsibility ownership, or root cause from source text.
- Do not automatically choose semantic block boundaries with fuzzy heuristics.
- Do not fail on old split-candidate files unless a command option explicitly requests that behavior.
- Do not replace reviewer judgment about whether a large file is cohesive or harmful.

## Impact

- `documentation-block-ledger`, `codebase-audit-ledger`, `codebase-audit-loop`, `documentation-hardening-loop`, and `file-review-quest` can rely on a shared ledger validator.
- `code-quality-audit` and `code-quality-reviewer` can request changed-file inventory evidence instead of broad all-repo scans for every review.
- Large audit/review sessions get smaller, more reliable final reports because mechanical coverage is machine-checkable.

## Validation

- Add fixture tests before implementation for interval gaps, overlaps, stale hashes, missing finding fields, and changed-file git deltas.
- Run `npm run validate`.
- Run `npm test`.
- Run `npm run openspec:validate`.
- Run `npm run code-quality:inventory -- --format json` and the new changed-file mode.
