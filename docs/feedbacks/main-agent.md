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
