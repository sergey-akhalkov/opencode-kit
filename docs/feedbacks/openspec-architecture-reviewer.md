# openspec-architecture-reviewer Feedback

Entries appended newest last.

## FB-2026-07-17-cross-repo-review-cannot-read-second-repository

Source: openspec-architecture-reviewer
Role: reviewer
Type: tooling-friction
Severity: medium
Recurrence: current-session-once
Status: open

### Complaint
A cross-repository architecture review was assigned with exact read-only paths, but the reviewer could inspect only the caller repository because its fixed `external_directory: deny` permission blocked the second repository.

### Context
Two coordinated OpenSpec changes required one consistency review across their wire contract, ownership boundary, task order, and safety rules.

### Evidence From Current Session
The reviewer returned `blocked` for the second change while the main session could read both repositories. The review therefore mixed evidence-backed findings for one change with unverified status for the other.

### Impact
The main session must either duplicate a large planning bundle into the prompt, use a less specialized reviewer, or run disconnected reviews that cannot validate cross-repository consistency.

### Desired Future
A read-only architecture reviewer can receive narrowly scoped explicit external repository roots from the primary orchestrator without gaining general external write or mutation authority.

### Proposed Direction
Add a runtime-supported scoped read grant or a deterministic cross-repository artifact-bundle adapter for reviewer tasks. Keep writes, user questions, nested orchestration, credentials, and remote operations denied.

### OpenSpec Follow-Up
maybe
