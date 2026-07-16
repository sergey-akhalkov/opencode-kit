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

## FB-2026-07-13-direct-subagent-cli-fallback

Source: main-agent
Role: main-agent
Type: instruction-conflict
Severity: high
Recurrence: current-session-once
Status: open

### Complaint
The evaluation contract prescribed direct CLI continuation with `--agent sdet-quality-engineer`, but OpenCode silently replaced that subagent with the default primary agent.

### Context
Fresh-process role and SDET-continuation acceptance for the Change-Ready SDLC.

### Evidence From Current Session
OpenCode 1.17.15 emitted `agent "<name>" is a subagent, not a primary agent. Falling back to default agent` for the production, SDET, and final-review subagent names. The resulting sessions used primary-agent tools and behavior instead of the requested leaf roles.

### Impact
Role-refusal and same-SDET continuity evidence can be falsely attributed to the wrong agent, invalidating lifecycle qualification and cross-repository confidence.

### Desired Future
Runtime evaluation must dispatch subagents through the primary orchestrator's supported task adapter and verify both parent and child session/role identity. Unsupported direct CLI invocation must fail closed.

### Proposed Direction
Replace the direct subagent `opencode run --agent ...` recipe with primary-session continuation plus explicit child-session resume through the discovered runtime continuation adapter, and add a regression oracle for CLI fallback.

### OpenSpec Follow-Up
yes

## FB-2026-07-16-strict-validation-baseline-noise

Source: main-agent
Role: main-agent
Type: tooling-friction
Severity: medium
Recurrence: unknown
Status: open

### Complaint
A one-file instruction change was blocked by strict validation warnings in three unrelated, unchanged files.

### Context
The Change-Ready brief locked `npm run validate:strict` before mutation without first checking whether the repository baseline already passed that command.

### Evidence From Current Session
`npm run validate:strict` failed on warnings in three `.opencode/skills/**/SKILL.md` files outside the candidate scope. `npm run validate` completed successfully with the same warnings, and the scoped candidate identity remained unchanged.

### Impact
Candidate readiness becomes blocked by unrelated repository debt, and the original small task cannot finish without an owner-approved scope expansion.

### Desired Future
Validation adapter discovery should run a read-only baseline preflight before locking a strict gate. Existing failures should be separated from candidate regressions without weakening genuinely mandatory project policy.

### Proposed Direction
Add a pre-mutation strict-validation preflight or a deterministic baseline-versus-candidate warning comparison. If the baseline already fails, require an explicit owner decision before selecting a gate that demands a clean repository.

### OpenSpec Follow-Up
maybe
