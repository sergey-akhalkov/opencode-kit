# Strategy History

## 2026-08-27 - Permanent Per-Project Improvement Spec

- **Objective**: Give every project an obvious durable place where agents can accumulate irritants and eventually implement them in batches.
- **Approach**: Keep one long-lived OpenSpec change or special spec in each project and route cross-project entries into a corresponding `opencode-kit` change.
- **Evidence**: OpenSpec changes require bounded outcomes, proof, tasks, and an archive boundary. A mixed evergreen backlog has no natural completion, combines unrelated owners and proof surfaces, increases writer conflicts, and cannot use entry count as implementation readiness.
- **Outcome**: Rejected.
- **Reason**: It turns a signal inbox into an unarchivable product change and repeats the capture-without-closure problem at a larger scope.
- **Do Not Repeat Until**: OpenSpec adds a separately governed durable issue-inbox primitive whose lifecycle is not a change lifecycle.
- **Evidence-Based Retry Condition**: A maintained OpenSpec store API proves append-only issue intake, independent per-outcome promotion, cross-project identity, and closure without keeping one active change open.

## 2026-08-27 - Mandatory Final Retrospective

- **Objective**: Guarantee that every completed task produces workflow-learning artifacts.
- **Approach**: Require a final retrospective, ledger update, and follow-up task before handoff or archive.
- **Evidence**: Repository history removed the earlier mandatory self-improving instruction loop and final retrospective because it added completion ceremony and optional work to the product graph. Current specs explicitly allow complete handoff/archive without final-history analysis.
- **Outcome**: Rejected.
- **Reason**: It blocks product completion on process output, encourages proxy compliance, and recreates a previously removed design.
- **Do Not Repeat Until**: The accepted product outcome itself requires a retrospective artifact rather than optional workflow learning.
- **Evidence-Based Retry Condition**: A concrete project requirement names the retrospective as delivered behavior with its own consumer and proof boundary.

## 2026-08-27 - Compaction-Only Reflection

- **Objective**: Reuse the existing compaction `Session Reflection` with no extra provider calls or completion-stage ceremony.
- **Approach**: Emit structured signals only during compaction and persist them afterward.
- **Evidence**: Compaction is valuable for long-running sessions but may never occur before a short task or OpenSpec change completes. It also requires a proven post-compaction summary identity before the plugin can persist only the signal envelope safely.
- **Outcome**: Rejected as the sole capture mechanism; retained as a first-class periodic lane.
- **Reason**: It leaves short completed changes and immediately recognized irritants uncovered.
- **Do Not Repeat Until**: Every supported task is guaranteed to compact before completion, which is neither current nor desirable behavior.
- **Evidence-Based Retry Condition**: Current OpenCode lifecycle evidence proves mandatory pre-completion compaction for the complete supported task population without extra cost or context damage.

## 2026-08-27 - Unified Local Inbox With Periodic And Terminal Harvest

- **Objective**: Preserve explicitly observed irritants across projects, capture long-session and completed-change reflections, and promote only cohesive evidence-backed work.
- **Approach**: Extend the existing loaded plugin with one machine-local append-only signal lifecycle; use explicit report, mandatory compaction envelope, and non-blocking archive checkpoint lanes; retarget `complain`; keep manual triage and proposal creation root-contained.
- **Evidence**: `session-env` already composes custom tools and hooks; project memory proves platform data-root, fixed-slot append, redaction, copied-plugin, and cross-process patterns; current plugin docs expose compaction events and session message lookup; canonical archive already separates deterministic movement from optional reflection; no new dependency or service is required.
- **Outcome**: Selected for proposal and implementation planning.
- **Reason**: It is the smallest design that closes the observed intake/continuity gap without a permanent spec, transcript store, remote service, autonomous writer, or product-completion gate.
- **Do Not Repeat Until**: N/A - selected strategy.
- **Evidence-Based Retry Condition**: Re-evaluate if task 1.2 disproves safe post-compaction summary correlation, fixed-slot global storage cannot meet the bounded population, or manual triage cannot create one contained proposal without cross-repository mutation.

## 2026-08-27 - Immediate Autonomous Cross-Project Campaign

- **Objective**: Drain the queue automatically and implement recurring fixes without operator initiation.
- **Approach**: Add a scheduler or connect intake directly to the planned autonomous campaign, allowing consumer sessions to launch or write into `opencode-kit`.
- **Evidence**: The active campaign design is not implemented, supports exactly one single-project audit-remediate playbook, excludes multi-repository transactions, and already has overlapping plugin/orchestration ownership. The current feedback population has not yet proved scheduler value, cadence, grouping, or safe worktree coordination.
- **Outcome**: Deferred outside the current increment.
- **Reason**: Capture, lifecycle, and one manual proposal path must work before a scheduler can be specified from observed queue behavior.
- **Do Not Repeat Until**: The installed inbox has current usage evidence and the campaign owner exposes a verified non-overlapping intake/playbook contract.
- **Evidence-Based Retry Condition**: At least one maintained population shows recurring pending work that manual triage cannot drain, and a current campaign proof supports the required root, writer-isolation, budget, and recovery semantics.
