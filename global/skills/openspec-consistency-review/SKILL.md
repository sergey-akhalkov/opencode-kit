---
name: openspec-consistency-review
description: Review OpenSpec proposal/design/specs/tasks/docs/tests for synchronization and readiness at implementation, archive, release, or merge gates.
license: MIT
---

# OpenSpec Consistency Review

Use this skill for a focused read-only or fix-enabled consistency pass over OpenSpec artifacts and their source/test evidence.

## Checks

- Proposal, design, spec deltas, tasks, and traceability describe the same next-increment scope.
- For broad read-only consistency reviews across independent artifacts, consider bounded workers with exact ranges or tracks; keep focused reviews serial.
- Every behavior-changing current-increment requirement has an acceptance scenario and planned or existing verification; unreachable future requirements stay non-blocking residual.
- Behavior-changing tasks order minimal happy-path implementation and observable proof first. Material/explicit qualification then requires separate fresh-context SDET/risk discovery and test-only acceptance, negative, and end-to-end authoring. Ordinary Small reuses focused validation and optional smallest post-proof regression. Group mechanical mirror edits that share owner/validation.
- Task completion claims have evidence.
- Docs do not claim behavior that the spec excludes or leaves future-scope.
- Source/tests do not implement behavior outside accepted scope unless explicitly documented.
- Terminology, capability names, IDs, and links are consistent.
- Open questions, blockers, and manual gates stay visible. Stop when remaining findings are future-scope, unreachable, optional, or polish-only.

## Output

Return:

- `Verdict`: consistent | minor issues | material findings | blocked.
- `Findings`: severity, evidence, impact, likely root cause, recommendation, confidence.
- `Requirement-To-Test Matrix`: existing/planned/missing.
- `Task Evidence Review`: completed tasks with proof or gaps.
- `Archive/Implementation Readiness`: yes/no for the next working increment and why; future-scope gaps alone must not force `no`.
- `Validation`: commands run or skipped with reason.
