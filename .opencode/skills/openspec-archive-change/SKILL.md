---
name: openspec-archive-change
description: Deterministically validate, synchronize, and archive a completed OpenSpec change. Use when implementation and evidence are complete and the owner requests archive.
license: MIT
compatibility: Requires OpenSpec 1.6-compatible CLI, Node.js 24+, and the portable kit archive tool.
metadata:
  author: opencode-kit
  version: "2.0"
  generatedBy: opencode-kit
---

# Deterministic OpenSpec Archive

Archive a completed OpenSpec change through the portable deterministic archive tool.

## Resolve Scope

- If the change name is missing and multiple active changes exist, run `openspec list --json` and ask the user to select. Never guess.
- Preserve an explicit registered `--store <id>` selector when applicable.
- Resolve the target project root and the active kit global source. The helper is `<global-source>/bin/openspec-archive.ts`.
- Resolve one trusted aggregate project-validation argv from the project adapter or repository-native validation entrypoint. Never guess npm, a shell, or a command. A genuinely non-applicable validation boundary requires a concrete reason.

## Execute One Owner

```text
node "<global-source>/bin/openspec-archive.ts" --root "<project-root>" --change "<name>" [--store "<id>"] -- <validation-executable> [validation-args...]
```

Or, only when project validation is genuinely not applicable:

```text
node "<global-source>/bin/openspec-archive.ts" --root "<project-root>" --change "<name>" [--store "<id>"] --validation-not-applicable "<reason>"
```

The helper checks machine-readable artifact status, requires a non-empty all-checked task file, runs strict and project validation, delegates spec merge and movement to `openspec archive <name> --yes --json`, and validates the archived result. `--yes` cannot waive the independent completion gate.

## Failure Contract

- Preserve raw stdout, stderr, exit status, and reported side effects.
- Never edit main specs manually, invoke agent-driven sync, deep-import OpenSpec `dist/`, pass `--skip-specs`, or move the change directory yourself.
- Official deterministic merge rejection is a fail-closed compatibility result. Update a partial `MODIFIED` delta to the complete accepted requirement only when semantics are already known; never substitute model judgment.
- If post-archive validation is red, report the archive path and red candidate; do not claim archive completion.
- Incomplete work uses the distinct abandoned-incomplete flow and never receives completion language.

## Success Contract

Success requires zero exit and final `status: archived`. Report change, archive path, spec-update status/totals, validation argv, and helper identity. Archive does not authorize commit, push, merge, release, installation, or deployment.
