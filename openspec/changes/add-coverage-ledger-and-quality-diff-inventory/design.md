# Design: Coverage Ledger And Quality Diff Inventory

## Coverage Ledger Contract

Add `tools/coverage-ledger.ts` with read-only validation and optional initialization.

Modes:

- `init`: reads an explicit scope file and emits a starter JSON ledger.
- `validate`: validates an existing ledger against current files.
- `report`: emits compact Markdown or JSON summary from a valid or partially valid ledger.

The default mode is read-only. `init` writes only when `--out` is provided and refuses to overwrite existing files without `--overwrite`.

## Ledger Schema

```json
{
  "schemaVersion": 1,
  "tool": "opencode-dev-kit-coverage-ledger",
  "scope": { "root": "<redacted>", "paths": [] },
  "files": [],
  "blocks": [],
  "findings": [],
  "validation": { "status": "pass", "errors": [], "warnings": [] }
}
```

File entries include `path`, `lineCount`, `sha256`, `status`, and optional `unreadableReason`.

Block entries include `id`, `path`, `startLine`, `endLine`, `hash`, `status`, `reviewer`, and `findingIds`.

Allowed block statuses:

- `unreviewed`
- `reviewed-no-finding`
- `finding`
- `blocked`
- `needs-rereview`
- `polish-only`

Finding entries require `id`, `severity`, `evidence`, `impact`, `rootCause`, `recommendation`, `confidence`, and `status`.

## Coverage Rules

- Ordinary readable text files must be covered by intervals that exactly cover line range `[1..N]`.
- Intervals must not overlap.
- Deleted, binary, unreadable, generated, or too-large files may use a special file status with reason.
- If current file hash differs from ledger file hash, all blocks for that file are invalid unless the block hash still matches the current line range.
- A reviewed block with changed hash becomes `needs-rereview` in validation output.
- Material findings must include evidence, impact, root cause or `unknown`, recommendation, confidence, and status.

## Block Boundary Policy

To avoid hidden heuristics, block boundaries are one of:

- Explicit ranges supplied in the ledger or scope file.
- Deterministic fixed-size chunks with documented chunk size.
- Deterministic Markdown heading sections where heading parsing is exact.

The tool must not infer semantic purpose or risk from block contents.

## Diff-Aware Code Quality Inventory

Extend `tools/code-quality-inventory.ts`:

```sh
npm run code-quality:inventory -- --changed --base <ref> --format json
```

Additional output fields:

- `schemaVersion`
- `tool`
- `scope: "all" | "changed"`
- `base`
- `files[].changeStatus`
- `files[].oldLines`
- `files[].newLines`
- `files[].oldBand`
- `files[].newBand`
- `files[].deltaLines`
- `requiresSplitDecision[]`

If git is unavailable or the base ref cannot be resolved, the tool reports `unsupported` and exits according to the selected strictness flag instead of guessing.

## Risks

- Ledger size for large audits: mitigate with stable summaries and optional external JSON output.
- Generated/binary files: require explicit status and reason rather than forcing line ranges.
- Git variance on Windows: normalize paths to POSIX form and test with temp git fixtures.
