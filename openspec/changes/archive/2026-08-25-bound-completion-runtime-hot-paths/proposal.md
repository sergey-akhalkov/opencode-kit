## Why

Completion audit currently materializes the whole session table before request bounds, status persistence can loop without a deadline, arbiter concurrency is bounded only per root, and roadmap sync commands can omit timeouts. In a shared OpenCode process, one large or stuck project can delay unrelated roots.

## Outcome Capsule

- **Outcome**: Completion and unattended runtime work is bounded at query, convergence, global scheduling, and child-process boundaries so overload fails visibly without starving unrelated roots or weakening completion safety.
- **Operating Envelope**: One OpenCode process with up to 32 queued guarded roots, two concurrent arbiter prompts by default, SQLite fixtures up to 100,000 unrelated sessions, injected non-convergence, and disposable roadmap commands; no provider call is required for load/timeout proof.
- **Non-Goals**: Changing verdict semantics, completion evidence fields, user-visible workflow policy, model routing, workstation behavior, or implementing roadmap product scope beyond process bounds.
- **Non-Deferrable Invariants**: No evidence needed by a current root is silently dropped; unknown query/liveness/cleanup remains fail-closed; cancellation frees capacity; queue fairness is root-isolated; timeout termination preserves cause/stdout/stderr and cannot kill unrelated processes.
- **Observable Proof**: A large unrelated database does not produce a full-table scan for one root; status convergence terminates within 8 passes or 2 seconds; a 33rd queued audit is rejected with bounded diagnostics; two slots are never exceeded; every maintained sync command has a finite timeout and hung fixtures terminate cleanly.
- **Material Residual Risks**: SQLite query plans vary by version; two concurrent prompts may not suit every provider; process-tree termination differs by OS; active guard/roadmap changes can invalidate the planned ownership.
- **Stop Line**: Finish indexed/bounded evidence acquisition, convergence bound, global scheduler/backpressure, finite process timeouts, load/cancellation diagnostics, and focused integration proof. Do not alter completion product semantics.

## What Changes

- Replace whole-session materialization with root/descendant-correlated bounded queries and verified indexes/query plans.
- Bound status convergence to eight passes and two seconds with a terminal privacy-safe diagnostic.
- Add one process-wide FIFO arbiter scheduler with configurable finite concurrency and queue capacity; default to two active prompts and 32 queued roots.
- Require finite timeout values for every roadmap/controller synchronous child command and preserve process termination evidence.
- Add large-database, concurrent-root, cancellation, non-convergence, queue-overflow, and hung-child provider-free tests plus latency/resource observations.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `session-completion-guard`: Adds bounded convergence and process-wide arbiter backpressure behavior.
- `library-plugin-architecture`: Adds bounded/indexed session evidence acquisition before projection.
- `unattended-roadmap-orchestration`: Requires finite child-process timeout and termination behavior.

## Impact

- Session-delivery database/query modules, completion controller/status/config/types, shared scheduler ownership, roadmap controller/process helpers, diagnostics, tests, and performance/reliability proof fixtures.
- Implementation waits until current changes modifying `session-completion-guard` and `unattended-roadmap-orchestration` have closed or explicitly transferred ownership.

## Implementation Dependencies

- `reduce-workflow-ceremony` must restore strict validity and archive or transfer `session-completion-guard` requirements plus `global/extensions/session-completion-guard/**` and session-delivery evidence files.
- `add-autonomous-roadmap-mission-runtime` must archive or transfer `unattended-roadmap-orchestration` and `global/bin/roadmap-mission/**`.
- `reconcile-openspec-ownership-and-evidence` ownership enforcement must be active before this change becomes mutation-enabled; checkboxes or RC labels alone never satisfy transfer.
