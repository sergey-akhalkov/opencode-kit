# Task 6.2 Portable Supervisor Evidence

- Candidate: `task-6-2-portable-supervisor-r1`
- Environment: `node-24.18.1-windows-task-6-2-r1`
- Capture: `task-6-2-controller-r1` (`complete`, 98 local process starts)
- Replay A: `task-6-2-controller-replay-r1a` (`complete`, `liveCalls: 0`)
- Replay B: `task-6-2-controller-replay-r1b` (`complete`, `liveCalls: 0`)
- Effects: zero provider calls, OpenCode calls, host effects, and source writes
- Cleanup: complete

The production portable supervisor resumed one exact terminal campaign mission handoff, reached
durable verification, suppressed unsafe/non-resumable states, held an exclusive identity-aware
lease, bounded one process-level successor after re-reconciliation, rotated external logs, and
propagated signal and explicit stop intent. Registry validation rejects drift, containment escape,
arbitrary command fields, and unknown fields. Credentials remain environment-only and absent from
diagnostics and logs.

This evidence does not support Windows registration, Scheduled Task installation, host re-entry,
configured composition, broad population closure, critical SDET, RC/stable, deployment, release,
or remote effects.
