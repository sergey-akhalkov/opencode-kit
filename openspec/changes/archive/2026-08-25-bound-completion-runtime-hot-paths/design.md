## Context

The audit traced the full session query into every arbiter audit, confirmed an unbounded status loop, and found optional sync-command timeouts. Guard and roadmap specs are currently modified by active changes, so production implementation remains blocked until those owners archive or explicitly transfer the relevant files/requirements.

## Goals / Non-Goals

**Goals:** bound work before materialization, guarantee finite convergence/process waits, and isolate shared provider capacity across roots.

**Non-Goals:** change verdicts, evidence semantics, model routing, mission product behavior, or workstation lifecycle.

## Decisions

### Query the selected root graph with existing indexes

Use parameterized root lookup plus recursive descendant traversal that selects only required columns. Preflight `EXPLAIN QUERY PLAN` in maintained fixtures and runtime capability checks; if the OpenCode schema lacks a usable parent/root index, report capability-blocked rather than creating an index in a foreign database or scanning every row. Apply row/depth bounds before message/event projection.

Alternative rejected: scanning all IDs into memory still scales with unrelated database size and hides the same bottleneck.

### Bound status convergence locally

Replace `while (true)` with a maximum of eight compare/update/readback passes and a monotonic two-second deadline. On exhaustion, log/persist one terminal convergence diagnostic and return a typed failure to the owning controller; no background retry loop is created.

### Share one scheduler singleton per plugin graph

Create a small scheduler module next to the completion guard. Each controller submits a root/audit epoch key; the scheduler enforces active=2, queued=32 defaults, FIFO order, duplicate suppression, and abort-signal removal. Capacity is released in `finally`. Options remain finite and validated in the plugin tuple.

### Classify roadmap command timeouts

Use 30 seconds for read-only inspection, 120 seconds for Git mutation/OpenSpec, and 600 seconds for validation/finalization, with explicit adapter validation/finalization values bounded to 1..1800 seconds. All calls pass an explicit value to portable process execution; timeout cleanup uses the existing owned process-tree mechanism.

## Performance And Proof

Use provider-free SQLite fixtures with 100,000 unrelated sessions, wide/deep selected trees, and malformed/missing rows. Capture selected rows, query plan, wall time, heap delta, and output identity. Concurrency fixtures enqueue 33 roots and exercise cancellation/fairness. Hung process fixtures validate timeout/cleanup. Timing is environment-attributed and secondary to row/query-plan/capacity invariants.

## Failure Boundaries And Diagnostics

- Missing index/query capability: block audit with schema/query-plan evidence.
- Projection bound exceeded: preserve omitted counts and fail closed if completion-relevant.
- Convergence exhausted: one diagnostic, no spin.
- Queue full: bounded overload state, no model call.
- Timeout cleanup unknown: hold writer ownership and stop mission progress.

## Fidelity And Authorization

- Current rung: source-level reproduced hot paths and component tests.
- Next real boundary: provider-free large DB/concurrency/hung-process integration in disposable roots.
- No provider or external operation is needed; installed guard smoke proof follows only after active owner closure.

## Risks / Trade-offs

- [Required DB index absent] -> fail closed and route an upstream/API alternative instead of mutating foreign schema.
- [Scheduler lowers throughput] -> expose queue/active metrics and allow finite configured values after load evidence.
- [Timeout kills legitimate work] -> command classes and bounded adapter override with preserved diagnostics.

## Migration Plan

1. Wait for or record explicit transfer from current guard/roadmap owners.
2. Add failing large-DB/convergence/scheduler/timeout fixtures.
3. Implement each bound independently and prove its first real boundary.
4. Run installed multi-root guard and roadmap smoke proof, then full validation.
