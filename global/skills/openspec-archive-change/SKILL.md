---
name: openspec-archive-change
description: Deterministically validate, synchronize, and archive a completed OpenSpec change. Use ONLY when the owner requests OpenSpec archive. Do not use for ordinary completion or git archive.
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
- Optional retrospective or workflow feedback stays outside the product task graph and never blocks complete archive. This does not skip the bounded non-blocking Kaizen harvest attempt when the loaded checkpoint tool is available.
- A required Automation Dividend needs its one tagged task checked; an exempt declaration must have no tagged task.
- Reconcile broad claims against the current real-boundary result and project validation. Archive only the exact scope those observations support; do not create or require a retained claim record.

## Open Harvest Checkpoint

After reconciliation passes and before invoking the deterministic helper, attempt exactly one loaded `kaizen_checkpoint` call with:

```json
{"input":{"changeRef":"<change-id>","status":"harvest-pending"}}
```

- Retain the returned `checkpointRef`; every closure in this archive attempt must use that exact ref. A repeated pending call for the same open project/change returns the existing ref; never open another pending while one remains open.
- Missing/disabled tools, an unsupported change id, or checkpoint failure sets harvest to non-persisted `unavailable`. Continue to the helper without a user question and do not claim a durable repair gap.
- The checkpoint is evidence only. It does not alter accepted scope, archive readiness, helper arguments, validation, movement authority, or archive status.

## Execute One Owner

```text
node "<global-source>/bin/openspec-archive.ts" --root "<project-root>" --change "<name>" [--store "<id>"] -- <validation-executable> [validation-args...]
```

Or, only when project validation is genuinely not applicable:

```text
node "<global-source>/bin/openspec-archive.ts" --root "<project-root>" --change "<name>" [--store "<id>"] --validation-not-applicable "<reason>"
```

The helper checks machine-readable artifact and claim-closure status, requires a non-empty all-checked task file, runs strict and project validation, delegates spec merge and movement to `openspec archive <name> --yes --json`, and validates the archived result. `--yes` cannot waive the independent completion gate.

## Close Or Preserve Harvest

Treat helper output and harvest as independent dimensions:

- If the helper does not return zero exit with final `status: archived`, preserve its failure unchanged. When a checkpoint is open, attempt one closure using its exact ref and `status: archive-failed`; report harvest `archive-failed` only when that write succeeds, otherwise `unavailable`. Never report `repair-gap` for a failed archive.
- If the helper returns `status: archived` and no checkpoint opened, report archive `archived` and harvest `unavailable`; write nothing after the fact to manufacture a gap.
- If the helper returns `status: archived` with an open checkpoint, form one strict zero-to-three array of evidence-backed archive-reflection signals using only `kind`, `summary`, `observedEvidence`, `impact`, `likelyCause`, `doNotRepeat`, `scopeHint`, and repository-relative `evidenceRefs`. Do not retain a transcript, raw task/proposal text, credentials, absolute roots, or another retrospective artifact.
- For a valid empty array, close with `{"input":{"changeRef":"<change-id>","checkpointRef":"<returned-ref>","status":"no-signal"}}` and report harvest `no-signal`.
- For one to three valid signals, close with `{"input":{"changeRef":"<change-id>","checkpointRef":"<returned-ref>","status":"captured","signals":[...]}}`. The tool appends them with archive source identity and closes with their refs; report harvest `captured` only after that call succeeds.
- If post-archive reflection is missing, invalid, interrupted, or cannot close the open checkpoint, leave it open and report derived harvest `repair-gap`. Never write `repair-gap` as a checkpoint status.
- A later explicit repair must independently establish that the matching change is already archived, must not invoke the archive helper or repeat movement, and may close only that still-open checkpoint as `captured` or `no-signal`.

`unavailable` and `repair-gap` are report states, not persisted checkpoint statuses. Handoffs retain only bounded refs and state, not signal text.

## Post-Success Trajectory Routing

- Run this route only after the helper exits zero and reports final `status: archived`; a failed archive or post-validation emits no success-based trajectory signal.
- Read the archived proposal's exact `Delivery Horizon` declaration. Report `trajectory: not-applicable` for legacy-unlinked or `none - <reason>` work without inferring membership.
- For a linked archive, invoke the exact active `delivery-trajectory-context.ts` helper with the project root, Horizon id, archive id, and bounded JSON output. Main evaluates one compact signal from that output and selected current evidence. Report `trajectory: none` without a durable receipt when no material trigger exists.
- When the current signal is `review-required`, load `roadmap-delivery-trajectory` once for that evidence tuple. Any resulting receipt or same-Horizon successor is future planning evidence, not archive completion credit. If context, semantic evaluation, or capability resolution fails, report `trajectory: unknown` with the original cause and no adjacent-skill or alternate-source fallback.
- Preserve independent operation dimensions exactly: `archive: archived` and `trajectory: not-applicable | none | review-required | unknown`. Trajectory processing must not change archive exit status, reopen the change, append tasks, rewrite archived bytes/specs, or block unrelated work.

## Failure Contract

- Preserve raw stdout, stderr, exit status, and reported side effects.
- Never edit main specs manually, invoke agent-driven sync, deep-import OpenSpec `dist/`, pass `--skip-specs`, or move the change directory yourself.
- Official deterministic merge rejection is a fail-closed compatibility result. Update a partial `MODIFIED` delta to the complete accepted requirement only when semantics are already known; never substitute model judgment.
- If post-archive validation is red, report the archive path and red candidate; do not claim archive completion.
- A harvest failure after `status: archived` does not make archive red, while a helper failure never becomes an archive success because a checkpoint closed.
- Incomplete work uses the distinct abandoned-incomplete flow and never receives completion language.

## Success Contract

Archive success requires zero exit and final `status: archived`. Report change, archive path, spec-update status/totals, validation argv, helper identity, the separate harvest state, and the separate trajectory state. Archive does not authorize commit, push, merge, release, installation, or deployment.

## Output Contract

Return the change and archive identities, operation totals, spec-update result, exact validation argv/outcomes, helper identity, `archive: archived`, `harvest: captured | no-signal | archive-failed | repair-gap | unavailable` plus checkpoint ref or `none`, `trajectory: not-applicable | none | review-required | unknown`, remaining blocker or `none`, and external operations performed (`none` unless separately authorized).
