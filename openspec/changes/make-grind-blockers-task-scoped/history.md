# Strategy History

## 2026-08-29 - Add Another Instruction Override

- **Objective:** Stop main from treating process, access, and path-local gates as global owner blockers.
- **Approach:** Add stronger always-loaded wording requiring independent work to continue and process controls to remain autonomous.
- **Evidence:** Current `global/AGENTS.md`, Change-Ready, OpenSpec apply, and the hidden arbiter already contain versions of those rules, while the runtime still accepts one global `owner_required` verdict and pauses the root. The archived `replace-fixed-attempt-stops-with-outcome-continuation` evidence also showed that stronger nearby stop wording can dominate a general autonomy rule.
- **Outcome:** Rejected as insufficient.
- **Reason:** Prompt-only tuning cannot let the controller distinguish a blocked dependency cone from a non-empty runnable frontier or reject a structurally false global stop.
- **Do Not Repeat Condition:** Do not add another override paragraph without a machine-readable frontier and installed partial-block oracle.
- **Evidence-Based Retry Condition:** Reconsider only if current runtime protocol enforcement is present and a loaded failure proves one concise missing semantic rule rather than representation or retrieval conflict.

## 2026-08-29 - Reuse The Full Autonomous Campaign Scheduler For Every Root

- **Objective:** Obtain durable work items, dependencies, gates, and sibling scheduling without inventing another model.
- **Approach:** Make every grind-enabled ordinary root execute as an autonomous work campaign.
- **Evidence:** The campaign already models durable items, waves, checkpoints, restart recovery, reports, and writer ownership, but its accepted playbook is audit/remediate and its lifecycle is materially broader than ordinary interactive and OpenSpec roots.
- **Outcome:** Rejected.
- **Reason:** Importing campaign lifecycle into every root would add a workflow database, checkpoint/report obligations, and coordination cost unrelated to the narrow completion question.
- **Do Not Repeat Condition:** Do not make campaign state the ordinary-root source of truth or duplicate its complete ledger in completion metadata.
- **Evidence-Based Retry Condition:** Reconsider only if a future accepted outcome explicitly unifies ordinary roots and campaigns under one durable mission runtime and proves migration plus overhead acceptable.

## 2026-08-29 - Extend Completion Guard With A Compact Frontier

- **Objective:** Enforce task-scoped blocking and mandatory independent continuation at the runtime boundary that currently applies global verdicts.
- **Approach:** Persist a bounded versioned ordinary-root frontier, derive readiness deterministically, keep product/dependency semantics model-owned, reject product-decision stop while runnable work exists, and project durable roadmap/campaign readiness without taking over their state.
- **Evidence:** The completion guard already owns idle audits, structured verdict parsing, question reply/reject capabilities, continuation injection, status, restart metadata, and terminal decisions. The missing information is a bounded item/dependency/gate relation that the controller can validate.
- **Outcome:** Selected.
- **Reason:** It extends the current lifecycle owner, removes the exact global-verdict gap, permits deterministic cross-field enforcement, and avoids a second scheduler.
- **Do Not Repeat Condition:** Do not move semantic product classification into deterministic code or let the frontier become a second authoritative OpenSpec/campaign ledger.
- **Evidence-Based Retry Condition:** Replace this strategy only if installed evidence shows the supported OpenCode runtime cannot safely persist, audit, and correlate a bounded frontier or defer a question through its official APIs.

## 2026-08-29 - Remove All Retry And Cycle Limits

- **Objective:** Ensure no process budget can stop grind before the accepted outcome is complete.
- **Approach:** Set continuation, arbiter retry, wait, and retention limits to unlimited values.
- **Evidence:** Current finite limits bound provider errors, malformed verdicts, request pressure, no-progress loops, and retained child ownership. The defect is specifically that `maxCycles` exhaustion becomes an owner handoff, not that every bounded invocation is invalid.
- **Outcome:** Rejected.
- **Reason:** Unlimited attempts weaken cost, reliability, liveness, and recovery containment while still providing no task-scoped progress model.
- **Do Not Repeat Condition:** Do not equate unlimited individual attempts with mission persistence.
- **Evidence-Based Retry Condition:** Reconsider a specific limit only after measured current behavior proves it prevents a safe causally advancing epoch and a narrower rollover or progress-reset mechanism cannot solve it.

## 2026-08-29 - Leave Product Question Open And Continue In Another Root

- **Objective:** Preserve the original pending question while independent work proceeds concurrently.
- **Approach:** Keep the suspended root/tool call open and start a second root for runnable siblings.
- **Evidence:** The existing question path intentionally leaves owner-required requests open, while roadmap/campaign writer rules require exact ownership and ordinary roots can share one worktree without isolated write authority.
- **Outcome:** Rejected.
- **Reason:** It introduces concurrent ownership, stale decision races, duplicate context, and writer hazards instead of safely resuming the original root.
- **Do Not Repeat Condition:** Do not use a second root to evade a pending question in the same mutable workspace.
- **Evidence-Based Retry Condition:** Reconsider only for a separately accepted isolated fan-out design with disjoint workspaces, exact writer closure, and a defined decision/result merge protocol.

## 2026-08-29 - GRIND-S06

- **Strategy ID:** `GRIND-S06`
- **Hypothesis:** Pausing the active Kaizen writer, assigning grind to the existing completion-guard owner, and preserving roadmap/campaign ledger ownership can create an exact non-overlapping first fixture slice without a second scheduler or general runner.
- **Mechanism:** Record a versioned ownership manifest, transfer shared roots back to Kaizen only after grind archive, capture current source identities, and select the completion-guard proof family as the first provider-free extension seam.
- **Candidate:** `grind-task-scoped-ownership-r1`.
- **Environment:** `windows-node-24.18.1-opencode-1.18.25-ownership-r1`.
- **Evidence:** `evidence/task-1-1-ownership-r1.md`; `ownership.json`; read-only owner map task `ses_fb17cf69fffed9usEdZ6H33wHZ`.
- **Outcome:** Succeeded.
- **What Was Learned:** Completion guard, session-delivery projection, roadmap mission, and campaign already own every durable lifecycle layer; only the bounded frontier/tool/fixture seams lack current owners. Current source confirms global `owner_required`, reply-only autonomous questions, and cycle-budget owner handoff as the exact replacement surface.
- **Supersedes:** None. This executes the accepted design after the terminal `GRIND-R2` review.
- **Do Not Repeat Condition:** Do not add a second scheduler, general runner, or deterministic semantic classifier.
- **Evidence-Based Retry Condition:** Re-run task 1.1 only if current source identity, writer topology, or owner-selected serial order changes before task 1.2.
- **Eligibility:** Task 1.2 may proceed only after ownership inventory and change validation accept this record.

## 2026-08-29 - GRIND-S07

- **Strategy ID:** `GRIND-S07`
- **Hypothesis:** One reviewed seed plus a completion-guard-local materialize/replay CLI can make graph and migration expectations deterministic before production frontier code exists, without inferring product semantics or creating a general runner.
- **Mechanism:** Add ten explicit valid/rejected/reconcile scenarios, strict field/ref/bound/cycle checks, deterministic runnable derivation, create-new evidence, offline replay, one package entrypoint, one proof-inventory row, and one focused guard test.
- **Candidate:** `grind-task-scoped-frontier-fixture-r1`.
- **Environment:** `windows-node-24.18.1-provider-free-frontier-r1`.
- **Evidence:** `evidence/task-1-2-frontier-fixture-r1.md`; `evidence/frontier-fixture-r1/{raw,evaluation}.json`; `evidence/frontier-fixture-replay-r1/{raw,evaluation}.json`.
- **Outcome:** Succeeded.
- **What Was Learned:** Explicit seed facts are sufficient to derive one independent runnable item under a product block and to distinguish product-only, waiting, complete, stale, cyclic, malformed, bounded, and migration states. Node strip-only mode requires explicit class fields rather than TypeScript parameter properties.
- **Supersedes:** None. This executes the task-1.2 automation dividend under selected strategy `GRIND-S06`.
- **Do Not Repeat Condition:** Do not turn the fixture helper into the production parser, add semantic scoring, duplicate the seed in code, or rerun unchanged materialization for confidence.
- **Evidence-Based Retry Condition:** Re-run only after the reviewed seed, fixture schema, runner, or production parser integration changes.
- **Eligibility:** Task 2.1 may consume this seed through the production frontier parser/tool boundary; no installed or claim-level conclusion follows from task 1.2.

## 2026-08-29 - GRIND-S08

- **Strategy ID:** `GRIND-S08`
- **Hypothesis:** Extending the completion guard with one bounded production frontier owner and persisting a self-contained delivery projection can close task 2.1 without a second scheduler, parser, or cross-profile import.
- **Mechanism:** Reuse the reviewed task-1.2 seed through `frontier.ts`; register one parentless-root-only `grind_frontier` tool; derive human/task basis in the controller; serialize optimistic-generation writes; fail closed on invalid or stale state; preserve malformed bytes; project a byte-aligned assessment beside the frontier for the core-profile delivery reader; quarantine retained schema-v1 audits on restart.
- **Candidate:** `grind-task-scoped-frontier-production-r1`.
- **Environment:** `windows-node-24.18.1-bun-1.4.0-provider-free-r1`.
- **Evidence:** `evidence/task-2-1-frontier-production-r1.md`; `evidence/frontier-production-materialize-r1/{raw,evaluation}.json`; `evidence/frontier-production-replay-r1/{raw,evaluation}.json`; focused guard and session-plugin suites.
- **Outcome:** Succeeded for task 2.1.
- **What Was Learned:** The production parser can consume all ten reviewed seed cases directly; the controller can preserve the last valid generation across every rejected candidate; and session-delivery must validate a persisted projection rather than import `global/extensions/**` because core profile copies omit that directory. Bun is required for controller oracles, while the proof CLI remains Node strip-only compatible.
- **Supersedes:** None. It advances `GRIND-S07` from reviewed seed to production parser/tool/persistence/projection.
- **Do Not Repeat Condition:** Do not add a second frontier parser, scheduler, caller-supplied root/human identity, delivery import from `global/extensions/**`, or automatic rewrite of invalid persisted bytes.
- **Evidence-Based Retry Condition:** Re-run task 2.1 only if the frontier schema, bounds, parser, tool ingress, persistence, restart reconciliation, delivery projection, reviewed seed, or source identity changes.
- **Claim Ceiling:** Provider-free task-2.1 production behavior only. No installed OpenCode, verdict-v2, question-deferral, roadmap/campaign, SDET, archive, or `GRIND-TSB-001` population conclusion follows.

## 2026-08-29 - GRIND-S09

- **Strategy ID:** `GRIND-S09`
- **Hypothesis:** One frontier-correlated verdict-v2 parser plus controller-owned product, wait, pause, continuation, and execution-epoch effects can remove global `owner_required` and cycle-budget handoff without adding another scheduler or semantic classifier.
- **Mechanism:** Require exact schema-version-2 root/revision/frontier correlation and cross-field controls; reject stop/product/wait while work is runnable; persist mission-incomplete waits; reset continuation cycles only on changed progress fingerprint; roll over advancing epochs and wait repeated exhausted epochs; retain task-2.3 question rejection as an explicit fail-closed seam.
- **Candidate:** `grind-task-scoped-verdict-v2-r1`.
- **Environment:** `windows-node-24.18.1-bun-1.4.0-provider-free-r1`.
- **Evidence:** `evidence/task-2-2-verdict-v2-r1.md`; 52 focused guard tests; 18 session-plugin tests; provider-free frontier replay; fresh reduction review `ses_fb106b52effekCbPo7UAOgi63S`.
- **Outcome:** Succeeded for task 2.2.
- **What Was Learned:** Exact frontier correlation is sufficient to reject premature global handoff deterministically; product decisions and non-product waits require distinct controller states; finite cycle limits remain useful when exhaustion becomes rollover or budget waiting rather than owner scope. New audit child metadata must use schema version 2 so restart can distinguish it from retained legacy audits.
- **Supersedes:** The verdict-v1 global `owner_required` and `maxCycles` owner-handoff behavior only. It does not supersede protected owner authority, human pause, question effect ownership, roadmap/campaign ledgers, or task-2.1 frontier semantics.
- **Do Not Repeat Condition:** Do not restore global `owner_required`, translate finite process budgets into owner scope, infer product/dependency semantics deterministically, implement question rejection outside task 2.3, or add a second scheduler/parser/general runner.
- **Evidence-Based Retry Condition:** Re-run task 2.2 only if verdict fields/cross-field legality, frontier correlation, controller transition effects, progress fingerprint semantics, audit metadata schema, or a retained unique focused oracle changes.
- **Claim Ceiling:** Provider-free task-2.2 parser/controller behavior only. No official question deferral, loaded instruction/arbiter compatibility, installed OpenCode effect, roadmap/campaign composition, or `GRIND-TSB-001` population conclusion follows.

## 2026-08-29 - GRIND-S10

- **Strategy ID:** `GRIND-S10`
- **Hypothesis:** Persist-before-effect provenance plus the official question rejection API and a post-rejection idle gate can defer one scoped blocker without recording a human answer or racing a concurrent human reply.
- **Mechanism:** Persist one bounded pending blocker relation; invoke `client.question.reject`; promote it to confirmed provenance only on success; retain uncertain rejection as fail-closed; apply the validated continue/wait disposition only after idle; invalidate the frontier and suppress continuation when a human reply wins.
- **Candidate:** `grind-task-scoped-question-deferral-r1`.
- **Environment:** `windows-node-24.18.1-bun-1.4.0-provider-free-r1`.
- **Evidence:** `evidence/task-2-3-question-deferral-r1.md`; 54 focused guard tests; 18 session-plugin tests; fresh reduction review `ses_fb0e87d39ffeSsNwwZfTCUZU0M`.
- **Outcome:** Succeeded for task 2.3 at the provider-free official-SDK controller boundary.
- **What Was Learned:** Pending provenance must precede rejection, successful rejection is not sufficient to continue while the root remains busy, and a human reply must clear synthetic provenance plus stale the audited frontier. A write-only rejection-observation flag added no safety and was removed.
- **Supersedes:** The task-2.2 fail-closed `questionAction=defer` placeholder only. It does not supersede offered-label answers, true empty-frontier product questions, protected owner authority, or installed proof requirements.
- **Do Not Repeat Condition:** Do not leave a deferred request open, reconstruct a human answer, continue before idle, clear uncertain pending provenance, add a second question lifecycle owner, or repeat component evidence as installed proof.
- **Evidence-Based Retry Condition:** Re-run task 2.3 only if question reply/reject SDK semantics, deferral provenance, post-rejection idle correlation, human precedence, restart handling, or a retained unique oracle changes.
- **Claim Ceiling:** Provider-free task-2.3 official-SDK controller behavior only. No loaded OpenCode question lifecycle, roadmap/campaign composition, installed authorization containment, or `GRIND-TSB-001` population conclusion follows.

## 2026-08-29 - GRIND-S11

- **Strategy ID:** `GRIND-S11`
- **Hypothesis:** Replacing the remaining schema-v1/global-stop instruction transport with one global task-scoped rule, exact arbiter verdict-v2 output, and concise role deltas can align loaded source without weakening protected-action or ordinary non-grind authority.
- **Mechanism:** Make `global/AGENTS.md` the complete grind contract; update the hidden arbiter to the production v2 fields and cross-field dispositions; keep Change-Ready, OpenSpec apply, project/reusable, and compaction surfaces as role-specific deltas; retarget deterministic contracts and the agent validator to reject `owner_required`, optional `MAY continue`, missing frontier fields, and process-budget handoff.
- **Candidate:** `grind-task-scoped-instruction-alignment-r1`.
- **Environment:** `windows-node-24.18.1-bun-1.4.0-provider-free-instruction-r1`.
- **Evidence:** `evidence/task-3-1-instruction-alignment-r1.md`; 73 contract tests; 15 instruction-context tests; 54 guard tests; 18 session-plugin tests; strict source validation; fresh corrected-candidate instruction review `ses_fb0c0f30dffeVJuwiErEwq7bDp`.
- **Outcome:** Succeeded for task 3.1 at the provider-free loaded-source and deterministic-contract boundary.
- **What Was Learned:** The exact production v2 transport can be expressed without a second policy owner: global authority owns readiness semantics, the arbiter owns machine JSON legality, and mirrors need only routing deltas. Finite cycle limits remain containment when budget exhaustion is a non-product wait rather than owner scope.
- **Supersedes:** Loaded schema-v1 arbiter output, global `owner_required` routing, and their stale deterministic markers only. It does not supersede protected owner authority, ordinary non-grind handoff, human pause, installed proof, or mission/campaign ledgers.
- **Do Not Repeat Condition:** Do not append another override paragraph, restore global `owner_required`, make independent work optional, copy the complete grind policy into mirrors, remove finite limits, or treat structural markers as installed proof.
- **Evidence-Based Retry Condition:** Re-run task 3.1 only if verdict/frontier fields, loaded authority routing, compaction continuity, a retained unique contract oracle, or installed task-4.1 evidence identifies a current instruction defect.
- **Claim Ceiling:** Current source alignment and provider-free deterministic/component compatibility only. No installed main/arbiter, question lifecycle, compaction, roadmap/campaign, authorization-containment, or `GRIND-TSB-001` conclusion follows.

## 2026-08-30 - GRIND-S12

- **Strategy ID:** `GRIND-S12`
- **Hypothesis:** Projecting task-scoped completion and blocker refs through the existing roadmap parent handoff and consuming them in the existing campaign ledger can drain independent siblings without adding a scheduler, parser, or ledger.
- **Mechanism:** Extend roadmap terminal handoffs with disjoint frozen-wave completed/blocked refs; preserve product-decision and waiting blockers; park blocked/dependent slices while draining independent slices; consume the terminal handoff exactly once in campaign state; retain blocked items as unresolved; and derive report claims from actual completion/checkpoint evidence.
- **Candidate:** `grind-task-scoped-roadmap-campaign-r1` (`grind-roadmap-worker-r16` plus `grind-campaign-worker-r7`).
- **Environment:** `windows-node-24.18.1-provider-free-roadmap-campaign-r1`.
- **Evidence:** `evidence/task-3-2-roadmap-campaign-r1.md`; `evidence/roadmap-controller-r16`; `evidence/roadmap-controller-replay-r16`; `evidence/roadmap-state-r16`; `evidence/campaign-controller-r7`; `evidence/campaign-controller-replay-r7`; architecture reviews `ses_fb03b5b77ffeYwEPKkNB2UXLpo`, `ses_fb001438dfferU4YxFXQ76HQKT`, and reduction review `ses_fafe52152ffe9KhRFeoPR38fgR`.
- **Outcome:** Succeeded for task 3.2 at the provider-free roadmap/campaign composition boundary.
- **What Was Learned:** A legal scoped stop may complete zero siblings, so `completedWorkItemRefs=[]` must remain valid when blocked refs are non-empty; item truth alone is insufficient if durable report prose still claims completion. Distinct structured investigation blockers are required to keep product decisions separate from technical/safety waits. Expanded composed proof needs a 300-second internal capture bound and cause-preserving timeout diagnostics on this Windows host.
- **Supersedes:** Campaign/roadmap projection of scoped blockers through legacy `owner-required` only. It does not supersede either ledger, campaign definition/order, roadmap wave ownership, protected-action authority, or installed proof requirements.
- **Do Not Repeat Condition:** Do not import the ordinary-root frontier as a second mission/campaign scheduler, reject empty completed refs, mark blocked/dependent items fixed, claim sibling completion without effect/checkpoint evidence, collapse waits into product decisions, or treat provider-free r16/r7 replay as installed proof.
- **Evidence-Based Retry Condition:** Re-run task 3.2 only if parent-handoff fields/defaults, mission slice scheduling, campaign investigation/consume/report semantics, exact-once restart handling, retained unique fixture oracles, or source identity changes.
- **Claim Ceiling:** Current provider-free roadmap scheduling and campaign consumption only. No installed OpenCode question lifecycle, installed composed mission/campaign behavior, authorization containment, compaction, `GRIND-TSB-001` population, SDET, archive, or stable conclusion follows.
