# Strategy History

## Strategy KZG-S1: Repeat Manual Triage Until Empty

- **Objective:** Remove the current pending backlog without adding another process owner.
- **Approach:** Re-run `/kaizen-triage` in pages of 25 and let the operator decide when to invoke proposal/apply.
- **Evidence:** `global/commands/kaizen-triage.md` and the canonical Kaizen spec bound one invocation to 25; direct store readback on 2026-09-01 reported 218 pending signals. The command intentionally creates at most one kit-rooted proposal and performs no autonomous implementation.
- **Outcome:** rejected.
- **Reason:** It preserves the exact manual babysitting and proposal-only stop that the accepted outcome removes, and has no durable cycle cursor, scheduler, project routing, writer correlation, or restart recovery.
- **Do-Not-Repeat Condition:** Do not propose a loop around the existing command as complete automation while its authority and lifecycle remain manual/proposal-only.
- **Evidence-Based Retry Condition:** Reconsider only if the command itself becomes the durable controller with complete watermark, scheduling, project execution, recovery, and disable semantics, which would make it the selected architecture rather than this strategy.

## Strategy KZG-S2: Permanent Watcher Or Service

- **Objective:** Observe signals continuously and launch work as soon as possible.
- **Approach:** Keep one always-running daemon or Windows service that polls the inbox and owns processing.
- **Evidence:** The requested cadence is approximately daily; the existing workstation already owns protected Scheduled Task installation and the campaign supervisor already demonstrates finite resume processes, leases, status, stop, backoff, and recovery. No accepted requirement needs an always-live process or service account.
- **Outcome:** rejected.
- **Reason:** It adds service lifecycle, shutdown, account, resource, and writer-liveness complexity without improving the daily bounded-snapshot outcome.
- **Do-Not-Repeat Condition:** Do not convert the finite controller into a permanent service solely for scheduling convenience.
- **Evidence-Based Retry Condition:** Reconsider only after observed requirements demand sub-task-latency event handling that Task Scheduler plus bounded continuations cannot satisfy.

## Strategy KZG-S3: Extend Fixed-Slot JSON Or Add Segments

- **Objective:** Preserve the current store implementation while moving it to D:.
- **Approach:** Raise fixed limits or add directory segments for signals, events, claims, cursors, cycles, work items, and recovery state.
- **Evidence:** The current store already holds 257 signal records and 109 lifecycle events, while its fixed envelope is 2,000/8,000. Continuous scheduling needs atomic claim, high-water membership, relationship, cursor, lease, migration, and replay semantics. The repository supports both Node and Bun SQLite loading.
- **Outcome:** rejected in favor of one SQLite v2 lifecycle.
- **Reason:** Segmented files would recreate transactional and indexing behavior through custom file protocols while retaining directory pollution and capacity/scan complexity.
- **Do-Not-Repeat Condition:** Do not add another slot/segment mechanism unless direct installed runtime evidence falsifies SQLite compatibility.
- **Evidence-Based Retry Condition:** Reconsider an append-only segmented fallback only if the task 1.1 installed Node/Bun spike proves no safe supported SQLite write/locking envelope.

## Strategy KZG-S4: Let Grind Write Projects Directly

- **Objective:** Minimize layers between a signal and its implementation.
- **Approach:** Have the central Grind controller create OpenSpec changes and edit registered repositories itself.
- **Evidence:** Work Campaign already owns semantic campaign recovery and Roadmap Mission already owns serialized propose/apply/archive/checkpoint/local-commit mutation with writer liveness. The current Kaizen design intentionally treats signals as evidence rather than mutation authority.
- **Outcome:** rejected.
- **Reason:** It creates a second multi-project source writer, duplicates established recovery/validation ownership, and makes disable/takeover safety materially harder.
- **Do-Not-Repeat Condition:** Do not grant source/OpenSpec mutation tools to the Grind controller while campaign/mission owners remain available.
- **Evidence-Based Retry Condition:** Reconsider only if current source and direct proof show the existing campaign/mission contract cannot accept one frozen Kaizen work item without violating the accepted project-local lifecycle.

## Strategy KZG-S5: Reuse The Campaign-Supervisor Registry For Grind Projects

- **Objective:** Avoid another machine-local project registry by routing Kaizen work through existing campaign rows.
- **Approach:** Treat each campaign-supervisor v1 registration and its `definitionPath` as the complete Grind project/effect policy.
- **Evidence:** Frozen-draft review confirmed the current registry has exact schema-v1 row keys `definitionDigest`, `definitionPath`, `enabled`, `id`, and `root`, while one definition has one immutable playbook identity. Adding Kaizen-specific definition/effect/provider/hook fields would make the existing supervisor reject the file, and reusing an audit definition would fail `kaizen-remediate` preflight.
- **Outcome:** rejected in favor of a distinct protected Grind registry referencing one standing project-contained Kaizen definition per enabled root.
- **Reason:** The shared file would create schema drift, ambiguous audit/Kaizen resume ownership, and inherited effect authority.
- **Do-Not-Repeat Condition:** Do not add optional Grind keys to campaign-supervisor schema v1 or register a Kaizen definition with the logon supervisor.
- **Evidence-Based Retry Condition:** Reconsider unification only through a separately reviewed versioned registry owner that can represent multiple playbooks and one unambiguous resume host without breaking existing rows.

## Strategy KZG-S6: Schedule Continuations From Controller Prose

- **Objective:** Continue an unfinished watermark after 15 minutes while keeping one daily task and a finite controller.
- **Approach:** Persist `nextEligibleAt` and leave the concrete wake mechanism to implementation.
- **Evidence:** Frozen-draft architecture and deployment reviews showed that a finite exited process cannot wake itself, the current campaign task requires one different AtLogon trigger, and no caller of run-now had been named.
- **Outcome:** corrected to one separately frozen daily trigger with 15-minute repetition for 24 hours; each wake checks disabled generation, `nextEligibleAt`, daily budget, and lease and exits provider-free when ineligible.
- **Reason:** An unnamed wake owner made automatic continuation unimplementable and allowed disable/task identity bypass.
- **Do-Not-Repeat Condition:** Do not describe a persisted retry/continuation timestamp as scheduled unless one exact protected wake owner consumes it.
- **Evidence-Based Retry Condition:** Reconsider one-shot continuation tasks only if direct Windows proof shows the single repeating task cannot satisfy finite wake, non-overlap, disable, and repair invariants.
