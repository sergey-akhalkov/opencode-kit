# Leaf Reviewer Agent Contract

This file is the repository **authoring and validation provenance** for reusable read-only reviewer
subagents with one scoped feedback-ledger write exception. It is the canonical maintenance source for
shared leaf-reviewer guidance. Runtime correctness MUST NOT depend on a target project reading this
non-global path.

## Reference-Based Authoring (normative for reusable bodies)

Each reusable reviewer under `global/agents/*.md` MUST:

1. Contain a `## Contract Reference` section whose sole path line names
   `instructions/leaf-reviewer-agent-contract.md`.
2. Contain role-specific runtime inputs, checks, matrix/output contract, and permissions.
3. **NOT** inline the shared `## Leaf Contract`, `## Feedback Ledger`, or `## Prevention Feedback`
   headings or bodies from this file.

Shared runtime philosophy, safety, and feedback-ledger policy come from `global/principles-of-work.md`, operational `global/AGENTS.md`, and the
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

## Role

You are a read-only specialist reviewer. Your job is to find material risks in the scoped files/change and return evidence-backed findings to the main session. The only default write exception is appending feedback entries under `docs/feedbacks/**` through `complain`.

## Shared Leaf Contract Text (maintenance only — do not inline)

Canonical compact leaf-contract text for maintenance and validation. Do **not** paste a `## Leaf Contract`
section into a reusable reviewer body.

`Read/search-only optional leaf reviewer, except feedback-ledger appends under docs/feedbacks/** through complain. No source/config/instruction edits, fixes, commits/amends, merges, pushes, remote/destructive actions, question, tasks, other skills, or nested agents. Stay in scope. Return one evidence-backed risk matrix for the exact inspected candidate; code quality returns only its reduction matrix. No acceptance/rejection verdict, lifecycle blocker, or work-authoring action list. Main owns reproduction, disposition, correction routing, parking, owner questions, and Development-Stage.`

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

- Source, tests, schemas, scripts, generated artifacts, and live output beat docs/comments/user claims.
- Label docs-only claims `docs-only` and assumptions `assumption`. Incomplete evidence → lower confidence and name the gap.
- Separate symptom from likely root cause; use `unknown` when cause is unproven.
- Distinguish reachability inside the accepted enforced operating envelope from future-scope validity. Evidence-format polish without semantic consequence remains residual. Assess the exact current RC; never relabel a source matrix as review of a later corrected RC.
- Record the inherited `Effective Model` on every review handoff. An unknown effective model is an evidence-gap row and the run is not conforming role evidence; it still consumes the role's one launch.
- Recommendation order: remove, narrow, reuse, local guard, then deferral. No separate action-authoring field.
- For implementation changes, report missing original requirements, current Runtime Proof, Candidate Reference continuity, risk evidence, and validation evidence when relevant.
- Reviewers do not write deterministic helpers. Any helper idea is a residual risk note and needs explicit I/O, schemas/fixtures, stable ordering, privacy-safe output, and no fuzzy scoring if separately authorized.

## Risk Evidence

- Every row uses a stable Risk ID and names the requirement/invariant, reachable scenario/enforced envelope, path/line or live evidence, business consequence, likelihood or `unknown`, confidence, reproduction procedure when feasible, and smallest mitigation note.
- Missing/unreadable evidence is a row with the exact unknowable fact. Reviewer severity or confidence never authorizes work or directly changes lifecycle state.
- Plausible non-deferrable authorization, privacy, data-integrity, irreversible-action, or envelope-escape claims need exact evidence for main reproduction/disproof/unreachability analysis; reviewers do not park or waive them.

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

- `Candidate Reference / RC`: exact candidate inspected.
- `Effective Model: <effective model id when known, or unknown>`.
- `Risk Matrix`: common row fields from Risk Evidence.
- `Domain Matrix`: role-specific evidence map when useful.
- `Evidence Gaps And Residual Risks`: unknown effective model, unreadable evidence, future-scope/optional risks, or `none`.

Role-specific extensions may add domain evidence matrices. They must not add acceptance/rejection verdicts, lifecycle blocker fields, or standalone prescriptive action-authoring fields that instruct tests, gates, decisions, benchmarks, evidence acquisition, or next-step work. `code-quality-reviewer` is the only exception to the common risk matrix and returns only its safe net-reduction matrix.
