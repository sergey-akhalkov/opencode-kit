# Bound Completion Before/After Summary

Candidate: `bound-completion-runtime-hot-paths-r1`

Environment: `windows-node24`

| Boundary | Baseline | Candidate | Result |
|---|---:|---:|---|
| Session rows materialized for one root projection | 100,004 | 3 | Indexed root/child lookup; no full scan |
| Query heap delta | 27,610,984 bytes | 22,264 bytes | 99.92% lower in the retained exact case |
| Query elapsed time | 1,539 ms | 1,073 ms | 30.28% lower in the retained exact case |
| Process-wide arbiter active bound | Absent | 2 | Enforced |
| Process-wide arbiter queue bound | Absent | 32 | Enforced with terminal overload |
| Synchronous command timeout defaults | Optional/unbounded | 30s / 120s / 120s / 600s | Enforced by command class |
| Installed 35-root guard saturation | Not enforced | 2 active, 32 queued, 1 overload | Overload isolated; 31 cancellations terminal; retained queued healthy root passed |
| Installed guard startup | Not measured in baseline | 81,316 ms | Within the existing 180,000 ms readiness bound |
| Installed guard workload | Not measured in baseline | 33,726 ms | Within the 120,000 ms workload bound |
| External provider calls | 0 | 0 | No regression |

## Coordination And Failure Results

- All four timeout command-class fixtures returned `ETIMEDOUT` with terminal descendant cleanup.
- Cleanup-unknown remained terminally visible, did not mutate mission state, and was not retried.
- The source-current roadmap controller simulation preserved bounded retry counts, pause/resume state, protected-action stop behavior, local checkpoint isolation, archive sequencing, and complete cleanup.
- Focused guard, graph, session-delivery, portable-process, and roadmap-controller checks remained green at their owning boundaries.

## Claim Ceiling

The retained evidence establishes the exact Windows/Node 24 query, scheduler, process-tree, installed local-provider guard, and provider-free roadmap-controller cases named above. It does not claim configured-provider population coverage, cross-platform process cleanup equivalence, or an installed multi-plugin OpenCode workload.
