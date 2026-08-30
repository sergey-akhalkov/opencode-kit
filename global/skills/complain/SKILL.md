---
name: complain
description: Use when current-session workflow friction, instruction conflict, tooling pain, missing automation, or reusable process feedback should enter the Kaizen inbox or its Markdown fallback.
---

# Complain

Use this skill when current-session workflow friction, instruction conflict, tooling pain, missing automation, confusing handoff, validation noise, permission friction, or a reusable process improvement opportunity appears.

Do not wait for proof that the issue is recurring. If recurrence is unknown, write `Recurrence: unknown`. Prefer capturing a compact useful signal over suppressing it.

## Capture Routing

- When `kaizen_report` is available, call it once with one closed-schema signal derived from the entry fields below. A successful tool result is authoritative: do not create or edit `docs/feedbacks/**` for that complaint.
- Map `Type: complaint` to `kind: friction`; `tooling-friction` or `automation-candidate` to `tooling-gap`; and the remaining types to `process-gap`. Use the complaint as `summary`, current evidence as `observedEvidence`, impact as `impact`, `unknown` when likely cause is unknown, desired future plus proposed direction as `doNotRepeat`, the narrowest supported `scopeHint`, and one to eight repository-relative `evidenceRefs`.
- Advertised tools are the current session truth. `OPENCODE_KAIZEN=0` applies only after OpenCode restart; do not infer disabled capture from an environment change while `kaizen_report` remains advertised.
- Use Markdown fallback only when `kaizen_report` is absent or definitively unavailable before persistence. If a tool call may have persisted before failing, do not create a second record or return a Markdown candidate; return only `Feedback: capture-unknown`, `Signal Ref: none`, `Target File: none`, and `Reason: kaizen-capture-unknown`.
- Kaizen capture is non-authorizing and must not block the main task. After capture, resume or return the assigned report.

## Markdown Fallback Contract

- If fallback is required and edit permission allows `docs/feedbacks/**`, append the entry yourself to `docs/feedbacks/<source>.md`.
- If the feedback directory, parent directories, or source file do not exist, create them through the edit/add-file path under `docs/feedbacks/**`; no shell command or project bootstrap is required.
- If feedback write is denied by explicit read-only/no-edit mode, missing permission, or missing write surface, return a `Feedback Candidate` block instead.
- Identify the result as `written-fallback`; Markdown is degraded-mode transport for later idempotent `FB-*` import, not a second lifecycle authority.
- Feedback write must stay small and must not block the main task. Capture the fallback, then resume or return the assigned report.
- Do not edit source, config, instructions, specs, code, or task artifacts through this skill unless the user separately approved that work.

## Source File Naming

- Main session: `docs/feedbacks/main-agent.md`.
- Subagent: `docs/feedbacks/<agent-name>.md`.
- Skill-specific friction: `docs/feedbacks/<skill-name>.md`.
- Unknown or mixed source: `docs/feedbacks/general.md`.

Use lowercase hyphen-separated names. Keep one source file per agent or skill when possible.

## What To Capture

Capture any current-session signal about process, tooling, instruction, or autonomy friction:

- Instruction, skill, or agent contract made the work slower, noisier, unsafe, or awkward.
- Required input was missing because handoff/context contract was weak.
- Permission/tooling forced avoidable manual work.
- Validation was too noisy, too broad, too weak, or poorly diagnostic.
- A repeated-looking smell appears, even if you cannot prove history.
- A useful automation, helper, fixture, validator, or routing improvement is visible but outside current scope.
- Something irritates the agent and the better workflow is not yet known.

## What Not To Capture

- Secrets, credentials, tokens, raw private prompts, or unnecessary private paths.
- large logs, transcript dumps, or raw user data.
- personal blame toward the user or other agents. Describe workflow and artifact friction.
- On the Markdown fallback path only, avoid exact duplicate entries; add an occurrence note when cheap, otherwise create a new fallback entry. When `kaizen_report` is advertised, call it once and let inbox idempotency handle recurrence without consulting Markdown status.

## Entry Template

For Markdown fallback, append entries newest last:

```md
## FB-YYYY-MM-DD-short-title

Source: <agent-or-skill-name>
Role: main-agent | reviewer | worker | skill
Type: complaint | suggestion | automation-candidate | instruction-conflict | tooling-friction | context-friction
Severity: low | medium | high
Recurrence: current-session-once | current-session-repeated | ledger-match | unknown
Status: open

### Complaint
Blunt agent voice. What felt wrong, annoying, slow, unsafe, or wasteful.

### Context
What task or step exposed this. Keep it privacy-safe.

### Evidence From Current Session
Concrete facts observed now. Commands/files/patterns if useful. No raw secrets or log dumps.

### Impact
How this hurts delivery: time, missed bugs, context bloat, repeated work, weak validation, or bad autonomy.

### Desired Future
What better workflow would feel like.

### Proposed Direction
Concrete idea if known. Otherwise: `unknown` or `needs analysis`.

### OpenSpec Follow-Up
yes | no | maybe

### Related Entries
- <optional links>
```

## Feedback Candidate Fallback

Return this only when Markdown fallback is required but its direct ledger write is blocked. Never use this block for an inbox call with unknown persistence:

```md
Feedback Candidate:
Target File: docs/feedbacks/<source>.md
Reason Direct Write Blocked: <mode|permission|missing-path|other>

<entry following the template>
```

## Output

After the capture or fallback attempt, return compact evidence:

- `Feedback`: inbox | written-fallback | fallback-candidate | capture-unknown.
- `Signal Ref`: privacy-safe Kaizen ref or `none`.
- `Target File`: fallback path or `none`.
- `Reason`: short reason for `fallback-candidate` or `capture-unknown`; otherwise `none`.
