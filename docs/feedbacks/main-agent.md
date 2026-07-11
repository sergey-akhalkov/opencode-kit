# Main Agent Feedback

Entries appended newest last.

## FB-2026-06-21-delivery-review-blocking-not-binding

Source: main-agent
Role: main-agent
Type: instruction-conflict
Severity: high
Recurrence: current-session-once
Status: open

### Complaint
Main-session handoff could ignore a `session-delivery-reviewer` blocked verdict and end a root goal as a partial slice.

### Context
A delivery reviewer correctly returned blocked/full-root acceptance incomplete, but parent-session behavior still finalized instead of continuing work or escalating only the exact user-owned blocker.

### Evidence From Current Session
Repository instructions required running `session-delivery-reviewer` before material/complex handoff, but did not state that `Blocking for Acceptance: yes`, `Verdict: blocked`, `P0 blocker`, or non-empty `Required Next Actions` are binding on the parent session.

### Impact
Reviewer gates become advisory only. Sessions can stop with known P0/root blockers, leaving requested work unfinished.

### Desired Future
Blocking reviewer output hard-stops acceptance handoff. Main session continues autonomously when safe, or asks/escalates only the exact user-owned blocker.

### Proposed Direction
Add binding delivery-review outcome language to global/reusable/project instructions and validate it with `validate-library`.

### OpenSpec Follow-Up
no

## FB-2026-07-11-invalid-machineoverride-contract

Source: main-agent
Role: main-agent
Type: instruction-conflict
Severity: high
Recurrence: current-session-repeated
Status: open

### Complaint
Repository validation and documentation instructed the agent to add an unsupported `machineOverride` field to an OpenCode config, breaking OpenCode startup instead of improving validation.

### Context
A pre-push validation warning was treated as authoritative without checking the field against the official OpenCode schema or live loader behavior.

### Evidence From Current Session
The repository validator warned when `global/opencode.json` lacked `machineOverride: true`, and repository documentation described the marker as required. Adding it caused OpenCode to stop opening; the field is not part of the official OpenCode config schema.

### Impact
Following the local gate can make the active OpenCode installation unusable and repeatedly overrides stronger schema-verification requirements.

### Desired Future
Repository validation must never require unsupported OpenCode config fields. Schema-invalid local policy must fail its own validation rather than mutate runtime config.

### Proposed Direction
Remove the `machineOverride` contract from validators, installer, documentation, fixtures, and specs. Validate permissive local settings through supported configuration or report them without inventing schema fields.

### OpenSpec Follow-Up
yes

## FB-2026-07-11-dream-team-implement-generic-failure

Source: main-agent
Role: main-agent
Type: tooling-friction
Severity: medium
Recurrence: current-session-repeated
Status: open

### Complaint
`dream_team_implement` returned only a generic `implement tool failure`, forcing a manual fallback without actionable diagnosis.

### Context
Adding a bounded global OpenCode agent file should have been a straightforward implementation-tool pass, but the tool failed before producing a useful result object.

### Evidence From Current Session
Two implementation attempts returned `{"error":"implement tool failure"}` with no failing phase, logs, validation output, retry guidance, or environment precondition detail.

### Impact
The main session loses the intended implementation path and spends extra context on fallback work. Generic failures also make recurring infrastructure issues hard to classify.

### Desired Future
Implementation-tool failures should include a structured phase, cause category, minimal log excerpt or trace id, and whether fallback or retry is recommended.

### Proposed Direction
Return a diagnostic error envelope from `dream_team_implement` for infrastructure/input/validation failures, matching the structured result shape used on successful runs.

### OpenSpec Follow-Up
maybe
