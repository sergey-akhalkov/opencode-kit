---
description: Deterministically validate, synchronize, and archive a completed OpenSpec change
---

Archive a completed OpenSpec change through the portable deterministic archive tool.

**Input**: Optionally specify a change name after `/opsx-archive` (for example, `/opsx-archive add-auth`). If omitted and more than one active change exists, run `openspec list --json` and ask the user to select. Never guess among multiple changes.

**Store selection**: If the user names a registered OpenSpec store or the work resolves to one, run `openspec store list --json` and retain its exact `--store <id>` selector. Otherwise use the nearest local OpenSpec root.

## Resolve Portable Inputs

1. Resolve the target project root explicitly.
2. Resolve the active kit global source. Use `OPENCODE_CONFIG_DIR` first when it is non-empty and contains the exact `bin/openspec-archive.ts` helper. Otherwise inspect the supported host-default source and privacy-safe runtime-source/collision evidence. Never strip a final `global` segment or guess a repository-parent `bin`. Use an equivalent project-installed adapter only when its behavior is already trusted and documented; otherwise stop as blocked after supported resolution is exhausted.
3. Resolve one existing trusted aggregate project-validation argv from project configuration such as `opencode-dev-kit/adapter.json`, `opencode-dev-kit/validation.md`, or a repository-native validation script. Do not guess a package manager or invent a shell expression. If project validation is genuinely not applicable, retain a concrete reason for `--validation-not-applicable`.

## Reconcile Accepted Outcome

- Treat all-checked tasks as structural evidence, not outcome proof. Map the accepted outcome and current human requirement to their required observable proof immediately before archive.
- If required proof is absent, `Development-Stage` remains `development`, or another explicit outcome fact is unmet, do not invoke complete archive. Reopen or add the smallest ordinary task and return to apply without asking for owner scope expansion.
- A finalized failed invocation, exhausted agent-authored attempt count, or process stop line does not complete the change when a safe causally distinct route remains. Preserve the attempt and revise only the necessary process controls.
- Complete archive may proceed only when the accepted outcome is achieved. An unmet outcome requires the distinct owner-selected incomplete/abandoned preservation flow, which never claims completion or synchronizes undelivered requirements.
- Optional retrospective or workflow feedback stays outside the product task graph and never blocks complete archive.

## Execute

Run exactly one portable archive invocation:

```text
node "<global-source>/bin/openspec-archive.ts" --root "<project-root>" --change "<name>" [--store "<id>"] -- <validation-executable> [validation-args...]
```

For a reasoned non-applicable validation boundary:

```text
node "<global-source>/bin/openspec-archive.ts" --root "<project-root>" --change "<name>" [--store "<id>"] --validation-not-applicable "<reason>"
```

The helper owns the complete operation:

- machine-readable OpenSpec status and all-artifact completion check;
- non-empty, all-checked task gate that cannot be waived by `--yes`;
- strict change validation and project validation before mutation;
- official `openspec archive <name> --yes --json` spec merge and archive move;
- post-archive OpenSpec and project validation;
- machine-readable archive identity and operation totals.

Stop on any non-zero result and preserve stdout, stderr, exit status, and any archive path reported. Never edit main specs manually, invoke an agent-driven sync skill, deep-import OpenSpec internals, use `--skip-specs`, or move the change directory yourself.

If the official deterministic merge rejects a partial `MODIFIED` delta, report that exact limitation and update the delta to the accepted complete requirement shape only when the intended semantics are already clear. Do not fall back to model-authored merge behavior.

## Success Output

Report the change, archived path, whether specs changed, operation totals, validation commands, and exact portable helper path. Success requires the helper's final `status: archived` output and zero exit.

## Guardrails

- Incomplete work uses the distinct abandoned-incomplete preservation flow; complete archive never confirms past a blocking gate.
- Project-specific commands belong in project adapters, not in this reusable command.
- No archive lifecycle result authorizes commit, push, merge, release, installation, or deployment.
