# implementation-worker Feedback

Entries appended newest last.

## FB-2026-07-11-verification-command-permission-gap

Source: implementation-worker
Role: worker
Type: tooling-friction
Severity: medium
Recurrence: current-session-once
Status: open

### Complaint
The worker was required to run the exact verification command supplied by the parent, but its bash allowlist rejected the repository's code-quality inventory command.

### Context
A fresh-context testing worker had to prove that its test-module split stayed below the repository's enforced 800-line threshold.

### Evidence From Current Session
The prompt required `npm run code-quality:inventory -- --root . --format markdown --fail-on-split-candidates --attention-lines 400 --split-lines 800`, while the worker permission profile allowed generic validation/test/lint/typecheck commands but not that repository-native verification command. The main session had to run it instead.

### Impact
Worker reports cannot fully satisfy their verification contract even when the requested command is safe, deterministic, local, and directly tied to acceptance.

### Desired Future
Bounded workers can execute the exact safe verification command supplied by the parent without gaining broad shell access.

### Proposed Direction
Add a narrowly scoped permission route for repository-native inventory commands or a parent-executed verification mechanism that records the result in the worker handoff.

### OpenSpec Follow-Up
maybe
