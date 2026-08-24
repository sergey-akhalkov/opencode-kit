---
name: openspec-consistency-review
description: Review OpenSpec proposal/design/specs/tasks/docs/tests for synchronization and evidence gaps. Use ONLY for OpenSpec artifacts. Do not use for ordinary code review.
license: MIT
---

# OpenSpec Consistency Review

Use this skill for a focused read-only or fix-enabled consistency pass over OpenSpec artifacts and their source/test evidence.

This skill returns evidence only. It does not authorize mutation, set or block a lifecycle stage, or replace main-owned reproduction and disposition.

## Checks

- Proposal, design, spec deltas, tasks, and traceability describe the same next-increment scope.
- For broad read-only consistency reviews across independent artifacts, consider bounded workers with exact ranges or tracks; keep focused reviews serial.
- Every behavior-changing current-increment requirement has an acceptance scenario and planned or existing verification; unreachable future requirements stay non-blocking residual.
- Behavior-changing tasks order minimal happy-path implementation and observable proof first. Main may add the smallest focused regression after proof; separate fresh test-only SDET/risk discovery is required only for a reachable named critical consequence or explicit project/owner requirement. Group mechanical mirror edits that share owner/validation.
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
- `Evidence Gaps`: missing current-increment proof, synchronization, validation, or owner decisions; future-scope gaps stay non-blocking.
- `Validation`: commands run or skipped with reason.
