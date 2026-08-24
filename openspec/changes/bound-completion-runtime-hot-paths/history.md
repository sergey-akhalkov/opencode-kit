# Strategy History

## 2026-08-21 - Select boundary-first local bounds

- **Objective:** Prevent one root/database/process from starving shared OpenCode runtime work.
- **Approach:** Consider adding only later projection/request caps, then select query-before-materialization, finite convergence, one process-wide scheduler, and explicit child-process timeouts.
- **Evidence:** Audit traces show full session materialization occurs before request caps, status uses an unbounded loop, arbiter limits are per root, and production sync callers can omit timeouts.
- **Outcome:** Boundary-first bounds selected; output-only caps rejected.
- **Reason:** Later caps do not constrain database, CPU, queue, or hung-process work already incurred.
- **Do-Not-Repeat Condition:** Do not claim the hot paths are bounded solely because final JSON, retry count, or request bytes are finite.
- **Evidence-Based Retry Condition:** Revisit the selected mechanisms only if query-plan/load evidence proves the runtime schema lacks the required index/API or scheduler evidence shows a different bounded owner is necessary.

## 2026-08-23 - Transferred Shared Runtime Ownership To Claim Closure

- **Objective:** Preserve the planned hot-path work while the owner prioritizes universal claim-evidence closure.
- **Approach:** Set this change `mutationEnabled=false` and transfer only `global/plugins` to `enforce-claim-evidence-closure`; retain the bounded-query requirement and all planning artifacts for later resumption.
- **Evidence:** Owner decision on 2026-08-23 requires the claim-evidence change to complete before other active work. Process reconciliation found no non-shell process for this change, and no implementation task has started.
- **Outcome:** Planning-paused with an explicit incoming-owner transfer; no production or evidence bytes changed.
- **Reason:** One current mutation owner prevents runtime proof invalidation while preserving the later performance scope.
- **Do-Not-Repeat Condition:** Do not mutate `global/plugins` or start load evidence while the transferred owner is active.
- **Evidence-Based Retry Condition:** Resume after terminal claim-evidence handoff/archive and explicit ownership transfer back, then recapture query/runtime identities before task 1.1.

## 2026-08-24 - Resume query bounds after claim-evidence archive

- **Objective:** Resume the first unblocked production slice after `enforce-claim-evidence-closure` archived.
- **Approach:** Re-enable mutation for session-delivery and guard write roots, keep roadmap-mission planning-only, and implement indexed root/descendant acquisition without a full session scan.
- **Evidence:** Claim-evidence is archived. Active roadmap write root remains `global/bin/roadmap-mission.ts` and does not overlap. Host OpenCode schema already has `session_parent_idx`.
- **Outcome:** Selected. Production query/projection work proceeds; roadmap timeout tasks stay blocked.
- **Reason:** The pause existed only while claim-evidence owned shared semantics.
- **Do-Not-Repeat Condition:** Do not mutate `global/bin/roadmap-mission.ts` while the mission-runtime change is active.
- **Evidence-Based Retry Condition:** Implement roadmap process bounds only after that change archives or transfers those files.
