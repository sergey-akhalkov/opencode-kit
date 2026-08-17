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

Use this skill when implementation and evidence are complete and the user asks to archive one OpenSpec change through the canonical complete-archive path.

## Resolve Scope

- If the change name is missing and multiple active changes exist, run `openspec list --json` and ask the user to select. Never guess.
- Preserve an explicit registered `--store <id>` selector when applicable.
- Resolve the target project root and active kit global source. Use `OPENCODE_CONFIG_DIR` first when it is non-empty and contains the exact `bin/openspec-archive.ts` helper. Otherwise inspect the supported host-default source and privacy-safe runtime-source/collision evidence. Never strip a final `global` segment or guess a repository-parent `bin`.
- Resolve one trusted aggregate project-validation argv from the project adapter or repository-native validation entrypoint. Never guess npm, a shell, or a command. A genuinely non-applicable validation boundary requires a concrete reason.

## Reconcile Accepted Outcome

- Treat all-checked tasks as structural evidence, not outcome proof. Map the accepted outcome and current human requirement to their required observable proof immediately before archive.
- If required proof is absent, `Development-Stage` remains `development`, or another explicit outcome fact is unmet, do not invoke complete archive. Reopen or add the smallest ordinary task and return to apply without asking for owner scope expansion.
- A finalized failed invocation, exhausted agent-authored attempt count, or process stop line does not complete the change when a safe causally distinct route remains. Preserve the attempt and revise only the necessary process controls.
- Complete archive may proceed only when the accepted outcome is achieved. An unmet outcome requires the distinct owner-selected incomplete/abandoned preservation flow, which never claims completion or synchronizes undelivered requirements.
- Optional retrospective or workflow feedback stays outside the product task graph and never blocks complete archive.

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

## Output Contract

Return the change and archive identities, operation totals, spec-update result, exact validation argv/outcomes, helper identity, remaining blocker or `none`, and external operations performed (`none` unless separately authorized).
