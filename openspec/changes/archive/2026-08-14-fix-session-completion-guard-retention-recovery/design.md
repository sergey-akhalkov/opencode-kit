## Context

The guard retains a bounded number of child sessions per root. Rotation currently accepts only children whose runtime status is `idle` and whose metadata status is already terminal. If OpenCode exits while a child metadata status is `auditing`, no later controller owns that epoch, but the child remains non-terminal forever. Two such children fill the configured limit and cause every startup settle pass to fail before the next arbiter call.

The retained-child owner already lives in `arbiter-child.ts`; startup recovery and ordinary later epochs both pass through it. OpenCode 1.18.18 stores only active statuses in the list returned by `session.status`: setting idle deletes the id, while per-id lookup maps absence to idle. The correction must preserve fail-closed liveness and cross-process safety because more than one OpenCode process can observe the same project session store.

## Goals / Non-Goals

**Goals:**

- Make provably abandoned, guard-owned audit children eligible for normal finite retention rotation.
- Require canonical idle liveness plus an age grace period before an interrupted `auditing` child can become terminal `stale`.
- Re-check ownership, metadata, and runtime status immediately before quarantine.
- Preserve all existing arbiter verdict, retry, question, retention, and unrelated-child behavior.

**Non-Goals:**

- Recovering or guessing an interrupted verdict.
- Quarantining a busy, unknown, young, current-epoch, retrying, ownership-invalid, or unrelated child.
- Adding a new lease service, persistence format, configuration option, or model call.
- Increasing or disabling the finite retention limit.

## Decisions

### Quarantine in the retention owner

`enforceRetention` will quarantine an eligible interrupted child before selecting terminal children for deletion. This keeps lifecycle mutation and deletion under one ownership check and covers startup recovery plus later audit epochs without a second cleanup subsystem.

Alternative: mutate all interrupted children during `reconcileRoots`. Rejected because it duplicates child ownership and retention policy in the controller and performs writes even when no slot is needed.

### Require canonical idle status and timeout-plus-settle-aged metadata

A candidate must be guard-owned by the exact root, differ from the current epoch child, retain metadata status `auditing`, have `time.updated` no newer than the configured arbiter prompt timeout plus `max(settleMs, 1000)`, and be canonically idle. Canonical idle means either an explicit `idle` entry or absence from the successfully read active-status map after the child itself was successfully re-fetched. An explicit `busy`/`retry` entry or an unreadable status request remains unknown and blocks quarantine. The implementation will re-fetch the child and status map immediately before changing metadata to terminal `stale`.

The timeout bounds how long the owning controller may wait for an arbiter prompt; the settle margin protects timer and verdict-persistence ordering around that boundary. No new configuration surface is needed. A recently idle child remains fail-closed.

Alternative: treat every idle `auditing` child as stale. Rejected because an active controller can briefly observe its completed prompt as idle before applying the verdict.

Alternative: delete an old `auditing` child directly. Rejected because the retained-audit contract permits rotation only after a child is terminal; explicit `stale` metadata preserves why the child became eligible.

### Preserve terminal failure for unresolved liveness

If retention is full after safe quarantine and no terminal idle child is available, the existing `input-state` failure remains. Unknown or active ownership is a non-deferrable boundary and must not become an automatic destructive retry.

### Architecture

The touched production file already owns arbiter child identity, metadata lifecycle, and retention. The change adds no responsibility to the controller and no new top-level mechanism. `split-or-justify`: keep the bounded quarantine step in `arbiter-child.ts` because extracting a separate recovery service would split one lifecycle transaction and increase navigation cost.

## Risks / Trade-offs

- [A crashed child younger than the grace period still blocks one audit] -> Preserve safety; a later startup or audit after the timeout can recover it.
- [Runtime status is process-local and changes after the final check] -> Require timeout-plus-settle age, re-fetch child and active-status map immediately before mutation, and never touch explicitly active or status-unreadable children. The remaining cross-process race is bounded beyond the configured maximum arbiter wait plus settle margin.
- [Process exits after marking `stale` but before deletion] -> The next retention pass recognizes the terminal child and completes normal rotation.
- [OpenCode omits an existing child from the active-status map] -> Treat it as canonical idle per the current runtime source; a failed status request or failed child re-fetch remains fail-closed.
- [Existing terminal children are rotated in a different order] -> Keep the existing oldest-updated deterministic ordering after quarantine.

## Migration Plan

1. Load the corrected plugin in a disposable OpenCode environment and reproduce a root with two old idle `auditing` children.
2. Confirm only eligible guard-owned children become `stale` and normal retention creates the next audit child.
3. Restart against the same disposable state and confirm no retention-limit loop recurs.
4. Run the corrected loaded plugin against the affected local project state. Preserve unrelated sessions and capture logs/state before and after.

Rollback is code-only: restoring the prior plugin leaves any already quarantined child in the existing terminal `stale` state, which the prior retention implementation already understands. No schema downgrade is required.

## Fidelity Ladder

1. Deterministic preserved-log replay and component reproduction of the exact two-child state.
2. Local proof runner with real guard modules and disposable session state.
3. Loaded OpenCode plugin in a disposable local runtime and restart.
4. Corrected loaded plugin against the affected local project session store.

The next real boundary is rung 2 immediately, then rung 3 before systematic test work. Local model inference is authorized; safeguards are exact root ownership, idle/age checks, disposable proof roots, no unrelated deletion, captured before/after state, and deterministic cleanup. The affected local store is used only at rung 4 after all offline/disposable evidence is green.

## Open Questions

None for this increment.
