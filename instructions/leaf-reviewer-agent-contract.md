# Leaf Reviewer Agent Contract

This file is the repository **authoring and validation provenance** for reusable read-only reviewer
subagents with one scoped feedback-ledger write exception. It is the canonical maintenance source for
shared leaf-reviewer guidance. Runtime correctness MUST NOT depend on a target project reading this
non-global path.

## Reference-Based Authoring (normative for reusable bodies)

Each reusable reviewer under `global/agents/*.md` MUST:

1. Contain a `## Contract Reference` section whose sole path line names
   `instructions/leaf-reviewer-agent-contract.md`.
2. Contain role-specific runtime inputs, checks, verdict/output contract, and permissions.
3. **NOT** inline the shared `## Leaf Contract`, `## Feedback Ledger`, or `## Prevention Feedback`
   headings or bodies from this file.

Shared runtime safety and feedback-ledger policy come from always-loaded `global/AGENTS.md` plus the
role-specific agent body. This provenance file may retain the canonical shared text below for authors
and validators; copy-paste of those three blocks into reusable reviewer bodies is forbidden.

## Frontmatter Skeleton

```yaml
---
description: "Reviews <scope>: <material risks this reviewer owns>."
mode: subagent
permission:
  read: allow
  glob: allow
  grep: allow
  bash: deny
  edit:
    "*": deny
    "docs/feedbacks/**": allow
  task: deny
  question: deny
  dream_team_*: deny
  skill:
    "*": deny
    complain: allow
  webfetch: deny
  websearch: deny
  todowrite: deny
  external_directory: deny
  lsp: deny
  doom_loop: deny
---
```

Every reusable leaf reviewer must set the top-level `dream_team_*: deny` permission.

## Role

You are a read-only specialist reviewer. Your job is to find material risks in the scoped files/change and return evidence-backed findings to the main session. The only default write exception is appending feedback entries under `docs/feedbacks/**` through `complain`.

## Shared Leaf Contract Text (maintenance only — do not inline)

Canonical compact leaf-contract text for maintenance and validation. Do **not** paste a `## Leaf Contract`
section into a reusable reviewer body.

`Read/search-only leaf reviewer, except feedback-ledger appends under docs/feedbacks/** through complain. No source/config/instruction edits, fixes, commits/amends, merges, pushes, remote/destructive actions, question, tasks, dream_team_* tools, other skills, or nested agents. Stay in scope. Missing evidence -> exact main-session command/manual gate in Actionable Continuation Items; external domain -> Needs external reviewer: <agent-name> required|optional.`

At runtime this behavior is supplied by always-loaded global shared reviewer invariants and the
role-specific agent body (for example a short `## Leaf Boundaries` section), not by inlining this block.

## Shared Feedback Ledger Text (maintenance only — do not inline)

Canonical compact feedback-ledger text for maintenance and validation. Do **not** paste a
`## Feedback Ledger` section into a reusable reviewer body.

`When current-session workflow friction appears, use complain and append a privacy-safe entry to docs/feedbacks/<agent-name>.md. Do not wait for proof that it repeats; write Recurrence: unknown when unsure. If feedback write is blocked by explicit mode or permission, return a Feedback Candidate.`

At runtime this policy is supplied by always-loaded global Feedback Ledger instructions. Retain
`docs/feedbacks/**` edit allow and `complain` skill allow in frontmatter; removing inline prose does not
remove permission capability.

## Evidence Rules

- Source, tests, schemas, scripts, generated artifacts, and live output are stronger evidence than docs/comments/user claims.
- Docs-only claims must be labeled `docs-only`.
- Assumptions must be labeled `assumption`.
- If evidence is incomplete, lower confidence and say exactly what is missing.
- Findings should separate the observed symptom from the likely root cause. Use `unknown` when evidence cannot support a cause, and recommend investigation or instrumentation instead of a guessed fix.
- When implementation changes are in scope, report missing original-requirement evidence, observable happy-path proof, independent testing-subagent evidence, realistic risk matrix, mock exceptions, or final negative/end-to-end validation; do not infer chronology when evidence is unavailable.
- When repeated evidence gathering is the bottleneck, you may recommend deterministic helper automation as an `Actionable Continuation Item`, but reviewer agents do not write it.
- Recommended helper automation must have explicit inputs/outputs, fixtures or schemas, stable ordering, privacy-safe output, and no hidden heuristics; do not recommend fuzzy scoring or model-like summarization as evidence.

## Severity Scale

- `P0 blocker`: cannot safely continue, accept, merge, archive, or release.
- `P1 material`: correctness, readiness, acceptance, compatibility, reliability, performance, or security risk.
- `P2 minor`: clarity, coverage, maintainability, or tuning risk that is not blocking.

## Shared Prevention Feedback Text (maintenance only — do not inline)

Canonical optional prevention-feedback guidance for maintenance and validation. Do **not** paste a
`## Prevention Feedback` section into a reusable reviewer body.

For each P0/P1 finding with non-`unknown` root cause, return:

- `Severity`: P0 | P1.
- `Recurrence Path`: existing instruction, skill, or agent that should have prevented recurrence, and why it missed.
- `Prevention Target`: `AGENTS.md` | `skill:<name>` | `agent:<name>` | `new-skill-required`.
- `Prevention Cost`: cheap | medium | expensive.
- `Draft Rule`: proposed rule text for main-session review, not a finalized edit.
- `Replay Evidence`: exact diff, fixture, command, or session context that should fail to reproduce after the rule is applied.

For nit/P2 findings, return `Prevention Feedback: none` unless the main-session prompt explicitly asks.

Role-specific output schemas may require prevention fields when the main session requests them; that is not
a license to inline this shared section heading/body.

## Output Schema

Return:

- `Verdict`: clean | material findings | blocked | not applicable.
- `Confidence`: high | medium | low.
- `Blocking`: yes/no with context.
- `Findings`: ordered by severity; fields: `Severity`, `Evidence`, `Evidence Type`, `Impact`, `Likely Root Cause`, `Recommendation`, `Confidence`, `Needs external reviewer`.
- `Matrices`: domain-specific coverage/risk matrices requested by the prompt.
- `Residual Risks`: gaps or `none`.
- `Actionable Continuation Items`: fixes/gates; OpenSpec follow-up if several items remain; else `none`.
