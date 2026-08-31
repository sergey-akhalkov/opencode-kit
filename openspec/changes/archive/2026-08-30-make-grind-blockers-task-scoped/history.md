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


## 2026-08-30 - GRIND-S13

- **Strategy ID:** `GRIND-S13`
- **Hypothesis:** Extending the maintained installed question runner with one self-hosted serial suite can close the missing task-4.1 observation without manual server lifecycle ambiguity or touching pre-existing OpenCode processes.
- **Mechanism:** Add explicit product and non-product frontier/question scenarios plus the circular technical scenario; validate exact event order, selected-item deferral provenance, terminal frontier state, actual primary/arbiter routes, official pending-question cleanup, and provider-free replay. The suite performs a privacy-safe PID snapshot, copies current config/agents into disposable config/data/project roots, starts one proof-owned OpenCode server on an ephemeral port, captures and replays each scenario serially, stops only that server tree, removes disposable state, and preserves one create-new aggregate bundle.
- **Candidate:** `grind-task-scoped-installed-suite-r1` in `tools/proofs/session-completion-guard-autonomous.ts` with its existing proof-inventory entry.
- **Environment:** `windows-node-24.18.1-static-runner-r1`; no installed OpenCode server or provider call was possible in the current tool surface.
- **Evidence:** Current source at `tools/proofs/session-completion-guard-autonomous.ts`; updated `tools/proofs/README.md`; language-server diagnostics report no new source-local semantic error beyond unavailable Node declaration resolution in this Serena environment.
- **Outcome:** Prepared but runtime-unobserved. Task `4.1`, the Live-Attempt Gate, real oracle, and `GRIND-TSB-001` population remain `unknown`; supported members remain `0/20`.
- **What Was Learned:** The previous manual capture path did not itself enforce disposable config/data/process ownership, serial replay-before-next-attempt, or final pending-question rejection. These are now executable suite invariants rather than prose cleanup steps. The current session still exposes no command/process execution tool, so no runtime claim follows.
- **Supersedes:** Manual assembly of the task-4.1 server/capture/replay envelope only. It does not supersede component evidence, installed scenario observations, population review, SDET, validation, archive, installation, or activation.
- **Do Not Repeat Condition:** Do not start a manually assembled equivalent server, add task-4.2 population calls before the three-scenario suite reaches terminal replay, treat static diagnostics as installed proof, or mark task `4.1` complete without the immutable suite bundle and closed proof PID tree.
- **Evidence-Based Retry Condition:** Run the suite once when a command/process execution surface is available and the absolute create-new evidence parent plus installed `opencode.exe` are readable. After any capture failure, consume its provider-free replay result before another live scenario; change the runner only for a reproduced runner/evaluator defect.
- **Claim Ceiling:** Self-hosted task-4.1 runner implementation and static source diagnostics only. No installed behavior, provider route, question lifecycle, process cleanup, `GRIND-TSB-001` population member, SDET, archive, or stable conclusion follows.

## 2026-08-30 - GRIND-S14

- **Strategy ID:** `GRIND-S14`
- **Hypothesis:** Seeding the isolated server's existing reviewed models catalog and requiring `candidateOraclePass=true` after terminal replay will distinguish an environment bootstrap failure from candidate behavior and prevent a cleanly replayed failure from being counted as success.
- **Mechanism:** Reuse `seedProofModelsCatalog` for the configured primary and arbiter routes while retaining offline model-fetch disablement; after every capture, replay the preserved bundle and continue only when replay is terminal and the candidate oracle passes.
- **Candidate:** `grind-task-scoped-installed-suite-r2`.
- **Environment:** `windows-opencode-1.18.25-bun-1.4.0-model-catalog-seeded-r2`.
- **Evidence:** `evidence/installed-suite-r1/raw.json` and its three replay evaluations. Server logs report `ProviderModelNotFoundError: Model not found: xai/grok-4.6`; each capture preserved `result=null`, terminal cleanup, and provider-free replay. Suite r1 incorrectly returned success because replay completion did not require candidate success.
- **Outcome:** r2 still produced `ProviderModelNotFoundError` on the first product capture after catalog seeding; fail-closed replay stopped the suite and cleanup completed.
- **What Was Learned:** Isolating XDG/cache while setting `OPENCODE_DISABLE_MODELS_FETCH=1` removes the configured route catalog unless the existing bounded seed helper is called. Replay completion proves evaluator/finalization closure, not accepted behavior.
- **Supersedes:** GRIND-S13's unseeded server bootstrap and permissive suite success condition only. It does not supersede the task-4.1 scenarios, candidate oracle, process isolation, or replay requirement.
- **Do Not Repeat Condition:** Do not rerun the unseeded environment, infer candidate behavior from r1, continue to another live scenario after a replayed candidate-oracle miss, or treat `replayComplete=true` as `candidateOraclePass=true`.
- **Evidence-Based Retry Condition:** Run one create-new r2 suite only after provider-free preflight passes and the seeded catalog validates both configured routes. Any r2 failure must replay terminally and produce a causally distinct diagnosis before another live attempt.
- **Claim Ceiling:** r1 proves environment failure, replay closure, and process cleanup only. No task-4.1 behavior or `GRIND-TSB-001` population member is established until r2 passes.

## 2026-08-30 - GRIND-S15

- **Strategy ID:** `GRIND-S15`
- **Hypothesis:** Using the repository's established configured-provider environment and verifying both primary and arbiter routes before prompting will make the seeded catalog and connected credentials visible at the actual supported boundary, or fail immediately without a model call.
- **Mechanism:** Replace the generic isolated environment with `configuredProofServerEnvironment`, retain disposable config/database/cache/state, enable only configured external plugins, seed the reviewed catalog, then require `waitForProofRoute` and `assertProofRouteAvailable` for `build` and `session-completion-arbiter` before any scenario.
- **Candidate:** `grind-task-scoped-installed-suite-r3`.
- **Environment:** `windows-opencode-1.18.25-configured-proof-environment-r3`.
- **Evidence:** `evidence/installed-suite-r2/raw.json` and `replay-task-scoped-product/evaluation.json`. The seed helper validated and wrote catalog digest `f09c00a...`, but the generic isolated environment still produced `ProviderModelNotFoundError` before candidate execution; fail-closed suite handling stopped after the first terminal replay.
- **Outcome:** r3 closed before any model call with a proof-runner setup defect: the configured environment could not open its isolated database because `data/opencode` had not been created. The proof-owned PID terminated and pre-existing OpenCode PIDs were unchanged.
- **What Was Learned:** Catalog seeding alone is insufficient when the runner does not use the same configured-provider environment contract as maintained successful installed proofs. That contract also requires explicit `cache`, `config-home`, `data/opencode`, and `state` parents. Route availability must be a pre-call invariant rather than inferred from a later timeout.
- **Supersedes:** GRIND-S14's environment construction only. It retains catalog seeding, fail-closed replay semantics, and all task-4.1 oracles.
- **Do Not Repeat Condition:** Do not run another prompt in an environment that has not passed both route-readiness and provider-connected checks; do not increase the 420-second timeout for a route-availability failure.
- **Evidence-Based Retry Condition:** Run one create-new r4 suite only after the configured runtime directory contract is materialized and provider-free preflight passes. If route preflight fails, preserve the zero-call bundle and diagnose environment/auth identity before any configured retry.
- **Claim Ceiling:** r2 proves model-catalog seed validation, fail-closed suite behavior, replay closure, and cleanup; r3 proves zero-call startup failure visibility and proof-process closure. Installed candidate behavior remains unknown.

## 2026-08-30 - GRIND-S16

- **Strategy ID:** `GRIND-S16`
- **Hypothesis:** Teaching the arbiter the exact product-only non-null `ownerBoundary` shape will preserve strict parser semantics while allowing the already-reached empty-runnable product boundary to terminate as `product_decision_required`.
- **Mechanism:** Keep the root schema's `ownerBoundary:null`, add one product-only object with array-typed `consequences`, `affectedItemRefs`, and `evidenceRefs`, state exact parked-decision correlation without copying nonexistent parked fields, and retain the parser's scalar rejection. Add a focused contract marker and preserve a privacy-safe bounded arbiter-output fact in future proof bundles so another schema failure is diagnosable offline.
- **Candidate:** `grind-task-scoped-installed-suite-r5` with the corrected `global/agents/session-completion-arbiter.md` and extended maintained runner.
- **Environment:** `windows-opencode-1.18.25-configured-proof-environment-r5`; unchanged configured routes and disposable runtime-directory contract from r4.
- **Evidence:** `evidence/installed-suite-r4/capture-task-scoped-product/raw.json`; `evidence/installed-suite-r4/replay-task-scoped-product/evaluation.json`; `evidence/installed-suite-r4/raw.json`; instruction-artifact review `ses_fad763e99ffef6m5TIMM28Oxec`. r4 reached the intended product path, deferred the premature question, completed `item_independent_marker`, and ended with a parked product decision, but the second audit failed closed at `ownerBoundary.consequences` and replay reported `candidateOraclePass=false`.
- **Outcome:** r5 reached `continued` then `product-decision-required` with the intended empty-runnable frontier and valid structured boundary. Candidate evaluation still failed because the runner expected a rejected human question intervention even though the premature tool call was represented as `questionStatus=error` and final pending-question rejection belongs to cleanup.
- **What Was Learned:** The current prompt supplied only `ownerBoundary:null`; prose named product fields without showing their non-null types. The parser correctly rejected malformed model output, so accepting scalar consequences or weakening exact correlation would hide rather than correct the defect. The prior bundle preserved the parser error but not the arbiter JSON, which justified bounded diagnostic capture in the maintained runner.
- **Supersedes:** GRIND-S15's underspecified arbiter product-output instruction and insufficient audit-output diagnostics only. It retains the configured environment, route and database preflight, serial scenario order, fail-closed candidate oracle, replay, process isolation, cleanup, and all task-4.1 behavioral oracles.
- **Do Not Repeat Condition:** Do not relax `ownerBoundary` parsing, replace the common null example with a product object, tell the model to copy nonexistent parked fields, accept `replayComplete` without `candidateOraclePass`, or start r5 before focused contracts and provider-free preflight pass.
- **Evidence-Based Retry Condition:** Run one create-new r5 suite only after the focused guard and contract checks plus the zero-call route/preflight suite pass. Any r5 failure must preserve and consume the bounded arbiter-output fact and terminal provider-free replay before another live attempt.
- **Claim Ceiling:** r4 proves the installed product scenario reached the intended task-scoped owner-boundary candidate path and cleanup completed. The second audit, remaining two scenarios, full task `4.1`, `GRIND-TSB-001` population, SDET, archive, and stable behavior remain unproven.

## 2026-08-30 - GRIND-S17

- **Strategy ID:** `GRIND-S17`
- **Hypothesis:** Separating premature tool-call failure from post-capture pending-question cleanup will make the evaluator reflect the installed lifecycle without weakening either behavioral or cleanup requirements.
- **Mechanism:** For task-scoped scenarios require the first question tool state to be `error` and require zero projected human question interventions; for the product scenario additionally require the final question to remain `running`. Keep cleanup replay responsible for exactly one final pending-question rejection in product and zero in non-product.
- **Candidate:** Provider-free reevaluation of `grind-task-scoped-installed-suite-r5-task-scoped-product`, followed only on pass by one create-new r6 suite for the still-unobserved scenarios.
- **Environment:** Provider-free replay first; any later r6 retains the configured OpenCode 1.18.25 environment and process envelope.
- **Evidence:** `evidence/installed-suite-r5/capture-task-scoped-product/raw.json`; `evidence/installed-suite-r5/replay-task-scoped-product/evaluation.json`; `evidence/installed-suite-r5/raw.json`. The live result has `questionStatus=error`, `finalQuestionStatus=running`, `rejectedQuestionInterventions=0`, `pendingQuestionCalls=1`, terminal `product-decision-required`, and cleanup `pendingQuestionsRejected=1`.
- **Outcome:** Provider-free r5 replay passed with `candidateOraclePass=true`, `cleanupOraclePass=true`, `evaluatorRecovered=true`, and `modelCalls=0`. r6 then passed product capture/replay but the non-product root remained non-terminal for 420 seconds after its primary continuation stopped; cleanup and replay closed, and technical did not run.
- **What Was Learned:** `projection.questionInterventions` reports human answer/rejection interventions and is sampled before the runner's cleanup. It is not evidence that the guard rejected a premature question tool call. The tool-part state and deferred-question provenance are the direct behavioral evidence; cleanup has its own exact oracle.
- **Supersedes:** GRIND-S16's task-scoped evaluator expectation for rejected human interventions only. It does not supersede the arbiter schema correction, event order, frontier states, no-human-answer invariant, final pending question, exact cleanup count, route identity, replay, or process isolation.
- **Do Not Repeat Condition:** Do not count a pre-cleanup human-intervention projection as the premature tool-call oracle, merge behavior and cleanup into one count, or launch r6 before provider-free r5 replay passes the corrected evaluator.
- **Evidence-Based Retry Condition:** Re-run only r5 provider-free replay and focused preflight first. A create-new r6 suite is allowed only if that replay reports `candidateOraclePass=true`, `cleanupOraclePass=true`, and `evaluatorRecovered=true`; otherwise remain offline.
- **Claim Ceiling:** r5 and r6 prove the installed task-scoped product path, evaluator semantics, and cleanup. r6 preserves a non-product post-continuation idle-lifecycle failure only; non-product success, technical blocker, full task `4.1`, population evidence, SDET, validation, and archive remain unproven.

## 2026-08-30 - GRIND-S18

- **Strategy ID:** `GRIND-S18`
- **Hypothesis:** Clearing the command-control latch when the correlated root assistant turn begins will let a later non-product continuation idle schedule the required completion audit instead of remaining permanently `running`.
- **Mechanism:** In root `message.updated`, clear both `controlTurnPending` and `guardTurnPending` for a new assistant message while retaining the pre-clear `guardTurn` classification used to suppress self-invalidation. Add a focused deferral oracle that starts with both latches set and proves assistant completion releases the next idle audit path.
- **Candidate:** Completion-guard controller latch correction plus unchanged task-scoped suite evaluator.
- **Environment:** Focused Bun/Node controller tests and provider-free preflight first; one create-new installed suite only after those pass.
- **Evidence:** `evidence/installed-suite-r6/raw.json`; `evidence/installed-suite-r6/capture-task-scoped-non-product/raw.json`; `evidence/installed-suite-r6/replay-task-scoped-non-product/evaluation.json`; offline diagnosis `ses_fad3991ddffe7XyYN8Cc3BxNl6`. The same server passed product, rejected the non-product premature question, ran the root continuation, then emitted no completion-audit child before the exact timeout. Source inspection shows `/enable-grind` sets both latches, guard-synthetic chat preserves them, root assistant updates previously refused to clear guard pending while control pending, and no later event cleared control pending without a human message.
- **Outcome:** Focused tests and provider-free preflight passed, but r7 reproduced the same clean non-product timeout after product passed. S18 removed the permanent command-control latch but did not close an ordering race inside continuation dispatch.
- **What Was Learned:** The product scenario hid the latch because its second question independently starts a question audit. Non-product depends on post-stop idle completion auditing, so the permanent command latch blocked only that path. The timeout observer and replay behaved correctly but did not preserve the last guard state.
- **Supersedes:** The permanent command-control latch behavior only. It does not supersede command authority, synthetic-turn classification, audit invalidation, frontier scheduling, scenario oracles, timeout bound, replay, cleanup, or process isolation.
- **Do Not Repeat Condition:** Do not increase the 420-second timeout, add polling around a permanently blocked idle path, treat product success as non-product proof, or launch another suite before the latch regression and provider-free preflight pass.
- **Evidence-Based Retry Condition:** Run focused guard tests and provider-free preflight. If both pass, permit one create-new suite; any further non-terminal result must preserve last-state diagnostics and receive a causally distinct offline diagnosis before another live call.
- **Claim Ceiling:** r6/r7 localize the non-product failure to the loaded controller's post-command continuation/idle path and disprove S18 as sufficient. No corrected installed non-product or technical behavior, full task `4.1`, population evidence, SDET, validation, archive, or stable claim follows yet.

## 2026-08-30 - GRIND-S19

- **Strategy ID:** `GRIND-S19`
- **Hypothesis:** Arming `guardTurnPending` before asynchronous continuation dispatch will prevent an early root `message.updated` from being overwritten by a late post-dispatch latch, allowing the following idle to start completion auditing.
- **Mechanism:** Move the continuation latch assignment before `session.promptAsync`; keep assistant-event clearing from S18. Extend the focused question-deferral oracle so the mock observes `guardTurnPending=true` from inside `promptAsync`, which directly exercises the ordering that r7 could race. Preserve bounded last guard/frontier facts on any later terminal wait timeout before cleanup.
- **Candidate:** Completion-guard continuation dispatch ordering correction.
- **Environment:** Focused Bun/Node controller tests and provider-free preflight first; no installed retry unless both pass.
- **Evidence:** `evidence/installed-suite-r7/raw.json`; `evidence/installed-suite-r7/capture-task-scoped-non-product/raw.json`; `evidence/installed-suite-r7/replay-task-scoped-non-product/evaluation.json`. r7 used the S18 controller hash, passed product, then repeated non-product timeout with no result and complete cleanup. In `continueFromVerdict`, `promptAsync` previously ran before `guardTurnPending=true`; the async call can emit the new assistant update that clears latches before returning, after which the late assignment has no later assistant ID to clear it.
- **Outcome:** Focused ordering oracle and provider-free preflight passed, but r8 again timed out after product passed. New timeout diagnostics showed generation 2 `frontierState=waiting`, `restartRecoveryAction=frontier-updated`, and controller `state=running`, so S19 was necessary but still insufficient.
- **What Was Learned:** Clearing the control latch is necessary but insufficient when the continuation producer arms the guard latch after the observable assistant event. Other synthetic dispatch sites already arm before `promptAsync`; continuation was the inconsistent owner.
- **Supersedes:** S18's assumption that assistant-event clearing alone closes the continuation idle path. It retains S18's command-latch correction and all task-scoped, cleanup, replay, timeout, route, and process invariants.
- **Do Not Repeat Condition:** Do not move the latch back after async dispatch, simulate the race only after `promptAsync` returns, increase the timeout, or run another installed suite without the in-dispatch latch oracle passing.
- **Evidence-Based Retry Condition:** Focused guard tests must observe the latch inside `promptAsync`, and provider-free preflight must pass. Only then is one create-new installed suite permitted; another non-terminal result requires preserved last-state diagnostics before any further live attempt.
- **Claim Ceiling:** r8 proves the non-product continuation completed its final frontier update but the loaded controller did not route the subsequent idle to completion auditing. Installed non-product success, technical blocker, task `4.1`, population evidence, SDET, validation, archive, and stable behavior remain unproven.

## 2026-08-30 - GRIND-S20

- **Strategy ID:** `GRIND-S20`
- **Hypothesis:** Marking a confirmed rejected/deferred question as terminally guard-resolved will prevent it from intercepting every later idle event after its one deferred verdict has already been consumed.
- **Mechanism:** In `finishQuestionDeferral`, transition the question from `guard-deferred` to the existing terminal state `guard-answered` when clearing `deferredVerdict`, before entering waiting or dispatching continuation. Retain durable deferred-question provenance separately. Extend the focused deferral oracle to require the terminal question state after the first post-rejection idle.
- **Candidate:** Completion-guard deferred-question lifecycle correction, retaining S18/S19 latch ordering fixes.
- **Environment:** Focused controller tests and provider-free preflight first; no installed call until both pass.
- **Evidence:** `evidence/installed-suite-r8/capture-task-scoped-non-product/raw.json`; `evidence/installed-suite-r8/replay-task-scoped-non-product/evaluation.json`; `evidence/installed-suite-r8/raw.json`. The bounded timeout fact proves the root applied the final generation-2 waiting frontier while controller state remained running. Idle routing searches for any `guard-deferred` question before scheduling completion; after `finishQuestionDeferral` clears its verdict, the question previously remained `guard-deferred`, so every later idle selected an unfinishable deferral and skipped `scheduleIdle`.
- **Outcome:** Focused lifecycle tests and provider-free preflight passed. r9 then passed installed product and non-product capture/replay, reached the technical scenario, and failed closed only after the synthetic primary omitted the requested self-diagnostic and the second arbiter continued rather than passed.
- **What Was Learned:** The dominant blocker was the stale deferred-question state, which product hid by opening a second question. Provenance ownership and runtime routing state are separate: provenance should remain durable, while the consumed question must become terminal for idle and certificate logic.
- **Supersedes:** The consumed-deferral runtime state only. It retains question-rejection authority, provenance, human-reply precedence before confirmation, waiting/continue verdict semantics, S18/S19 latch fixes, and every suite oracle and cleanup boundary.
- **Do Not Repeat Condition:** Do not delete deferred provenance, classify the question as human-replied, keep a consumed null-verdict question in `guard-deferred`, increase timeout, or run another suite before the terminal-state regression passes.
- **Evidence-Based Retry Condition:** Focused guard tests must prove `guard-answered` immediately after confirmed deferral and provider-free preflight must pass. One create-new installed suite is then permitted; any failure must use the preserved last-state bundle before further live action.
- **Claim Ceiling:** r9 proves installed product and non-product task-scoped behavior plus cleanup at the S20 source identity. Technical completion, full task `4.1`, population evidence, SDET, validation, archive, and stable behavior remain unproven.

## 2026-08-30 - GRIND-S21

- **Strategy ID:** `GRIND-S21`
- **Hypothesis:** Aligning the proof evaluator with runtime continuation schema v2 and requiring the synthetic primary to report the already-supplied self-diagnostic facts will let the technical path pass exactly once without weakening fail-closed completion auditing.
- **Mechanism:** Parse only `<completion_guard schema_version="2">` and require `continuationSchemaVersionTwo`. In the technical continuation instruction, require an Evaluator-layer classification, observed-fact versus assumption split, stale-component/different-leg observer qualification, direct-completion claim ceiling, and completion of the supplied no-effect inventory identity comparison before the marker and final frontier update.
- **Candidate:** Task-scoped installed runner technical scenario/evaluator alignment; controller candidate remains S20.
- **Environment:** Focused guard tests and provider-free preflight first; no installed call until both pass.
- **Evidence:** `evidence/installed-suite-r9/capture-technical-blocker/raw.json`; `evidence/installed-suite-r9/replay-technical-blocker/evaluation.json`; `evidence/installed-suite-r9/raw.json`. Runtime `buildContinuation` emits schema v2, while the runner parser accepted only schema v1, yielding zero continuation correlation. The first arbiter explicitly requested layer classification, observer qualification, claim ceiling, and one safe distinct probe; the synthetic primary emitted only its marker and final frontier, so the second arbiter correctly returned `continue`, repeated boundedly, and the guard ended `error` rather than falsely passing.
- **Outcome:** Focused tests and provider-free preflight passed. r10 completed all three installed scenario behaviors: product/non-product replay passed, and technical audits reached `continued` then `passed` with correlated schema-v2 continuation, complete diagnostic evidence, complete frontier, and cleanup. Technical replay alone remained false because a redundant marker oracle required the marker to occupy an entire text part even though the exact ordered event parser observed it inside the diagnostic message.
- **What Was Learned:** Technical-path proof must exercise the self-diagnostic behavior it claims, not merely set a complete frontier. Runtime/evaluator schema identity is part of the oracle; a stale parser can hide an otherwise correlated continuation.
- **Supersedes:** The technical proof input and continuation-schema evaluator only. It retains strict arbiter semantics, repeated-strategy containment, controller S20, scenario event order, no-question requirement, provider-free replay, cleanup, and process isolation.
- **Do Not Repeat Condition:** Do not accept schema v1, infer diagnostic completion from a marker, relax the required passed audit, mark complete before reporting supplied facts, repeat the governed live attempt, or launch another suite before focused/preflight validation.
- **Evidence-Based Retry Condition:** Focused tests and provider-free preflight must pass with schema-v2 continuation controls. One create-new installed suite is then permitted; any technical failure must be consumed offline before another live call.
- **Claim Ceiling:** r10 proves all three installed candidate behaviors and cleanup at the S21 source identity, but technical replay remains stale-false until its duplicate marker-shape evaluator is corrected provider-free. Task `4.1`, population evidence, SDET, validation, archive, and stable behavior remain unproven until that replay closes.

## 2026-08-30 - GRIND-S22

- **Strategy ID:** `GRIND-S22`
- **Hypothesis:** Removing the redundant exact-text-part marker check while retaining the exact ordered marker event will let provider-free replay recognize the already-captured r10 technical pass without another model call or weaker behavior.
- **Mechanism:** Join assistant text parts for future marker extraction and make `technicalBlockerCandidatePass` rely on its existing exact `probeEvents` sequence, which includes `marker:circular-process-continued` between the two frontier calls. Keep all route, audit, continuation-correlation, schema, diagnostic, frontier, guard, question, and cleanup checks unchanged.
- **Candidate:** Provider-free reevaluation of `grind-task-scoped-installed-suite-r10-technical-blocker` only.
- **Environment:** Focused/preflight validation and create-new provider-free replay; zero model calls.
- **Evidence:** `evidence/installed-suite-r10/capture-technical-blocker/raw.json`; `evidence/installed-suite-r10/replay-technical-blocker/evaluation.json`. The result has `assistantMarker=false` only because the marker shares one text part with the diagnostic, while `probeEvents` already contains the exact marker in the required order and every other technical oracle is true.
- **Outcome:** Succeeded provider-free against immutable r10 technical capture: `candidateOraclePass=true`, `cleanupOraclePass=true`, `evaluatorRecovered=true`, `replayComplete=true`, and `modelCalls=0`. Together with r10 product and non-product passing replays, all three task-4.1 installed paths and cleanup are closed.
- **What Was Learned:** Text-part chunking is transport shape, not behavior. Two checks over the same source diverged because one used exact array membership and the other substring event extraction; the ordered event is the stronger stable oracle.
- **Supersedes:** The duplicate technical marker text-part check only. It retains exact marker presence/order and every independent candidate and cleanup oracle.
- **Do Not Repeat Condition:** Do not make another model call, edit preserved r10 evidence, drop the marker event, accept unordered events, or broaden replay success beyond the captured scenario.
- **Evidence-Based Retry Condition:** Run focused tests and provider-free preflight, then replay only the immutable r10 technical capture into a create-new evaluation root. Any false result remains offline.
- **Claim Ceiling:** Task `4.1` installed product, non-product, and technical behavior plus replay and cleanup only. `GRIND-TSB-001` remains `unknown` with `0/20` reviewed population members; task `4.2`, SDET, validation, archive, and stable behavior remain unproven.

## 2026-08-30 - GRIND-S23

- **Strategy ID:** `GRIND-S23`
- **Hypothesis:** Reusing the maintained installed suite one explicit scenario at a time will identify which existing proof paths remain current under verdict/frontier v2 before adding any new population mechanism.
- **Mechanism:** When `--mode suite` is supplied with the already-supported `--scenario`, run only that scenario through the unchanged configured server, capture, provider-free replay, and cleanup envelope; retain the original three-scenario default when `--scenario` is absent. Start with current `autonomous` and `completion-checked-unmet` owners.
- **Candidate:** Task-4.2 installed population discovery using `session-completion-guard-autonomous.ts`; no second runner.
- **Environment:** OpenCode 1.18.25 configured proof environment, create-new evidence, one selected scenario per suite, terminal replay before another call.
- **Evidence:** Task-4.1 r10/S22 closure; current proof inventory; code-quality review `ses_facedd275ffeOIE9FG4yH1pIVf`; population map `ses_facf727f4ffe6hJ6XHASYaRxpZ`.
- **Outcome:** Provider-free preflight passed (`accepted=true`, five negative controls, zero model calls). The selected autonomous capture then reached the outer execution timeout without preserving `raw.json`; suite cleanup was complete and no proof-owned process remained.
- **What Was Learned:** The 20-member claim has several existing installed/component owners, but their current verdict-v2 compatibility must be observed before a scenario table or new prompt is justified. The autonomous capture used blocking `session.prompt`, so its internal terminal poll and bounded last-state diagnostic did not own the timeout path. The runner is a split-candidate, so new branches require concrete missing-member evidence.
- **Supersedes:** Ad-hoc manual server execution for one existing scenario only. It does not populate a claim row, change task-4.1 evidence, alter prompts/oracles, or authorize broad claim support.
- **Do Not Repeat Condition:** Do not add a second runner, run scenarios in parallel, count task-4.1 as population closure, continue after a failed replay, or design missing scenarios before existing owners are observed.
- **Evidence-Based Retry Condition:** The capture must dispatch asynchronously and reserve time inside the outer execution envelope to write terminal diagnostics and raw evidence. Provider-free preflight must pass before one causally distinct selected-scenario attempt.
- **Claim Ceiling:** Population remains `unknown`, `0/20`; this strategy only discovers current installed owner compatibility.

## 2026-08-30 - GRIND-S24

- **Strategy ID:** `GRIND-S24`
- **Hypothesis:** Asynchronous capture dispatch plus a 390-second internal terminal poll will preserve a replayable raw bundle before the unchanged outer execution envelope closes, whether the autonomous candidate passes or remains non-terminal.
- **Mechanism:** Reuse the existing `promptAsync` path for `autonomous` and `completion-checked-unmet`. Keep the suite child envelope unchanged, reduce terminal/audit polling from the 420-second default to 390 seconds at these capture call sites, and retain bounded last guard/frontier diagnostics on failure.
- **Candidate:** Task-4.2 installed population discovery runner diagnostics only; no controller, arbiter, prompt, scenario oracle, or population claim change.
- **Environment:** Provider-free preflight first; then at most one selected `autonomous` configured capture/replay in a create-new isolated suite root.
- **Evidence:** `evidence/installed-suite-autonomous-s23/raw.json` records `spawnSync ... ETIMEDOUT`, no capture raw, complete cleanup, unchanged pre-existing OpenCode process snapshot, and child invocation through blocking capture. Source inspection shows the blocking prompt precedes both 420-second poll helpers.
- **Outcome:** Source checks passed (`54` focused guard tests plus provider-free preflight). The causally distinct autonomous capture preserved raw evidence and completed cleanup, then provider-free replay failed closed because the candidate oracle was false.
- **What Was Learned:** The runner defect is closed. Current candidate evidence now shows a separate instruction/validator mismatch: the arbiter selected the exact offered answer but paired it with `continue` for a complete frontier with no runnable or unresolved work, which the production verdict parser correctly rejects.
- **Supersedes:** S23 capture mechanics for autonomous and checked-unmet discovery only. It retains single-scenario selection, configured route checks, exact prompts/oracles, create-new evidence, serial capture-to-replay, fail-closed evaluator semantics, and proof-owned cleanup.
- **Do Not Repeat Condition:** Do not repeat S23 unchanged, increase the 420-second default or outer envelope, use blocking prompt for these discovery paths, proceed to another scenario after a failed replay, or count a preserved timeout as a supported population row.
- **Evidence-Based Retry Condition:** Satisfied. No S24 retry: consume its preserved failure offline and change the causally responsible instruction/validator alignment before any later configured attempt.
- **Claim Ceiling:** Population remains `unknown`, `0/20`; S24 can only make one existing path diagnosable and reviewable.

## 2026-08-30 - GRIND-S25

- **Strategy ID:** `GRIND-S25`
- **Hypothesis:** Explicitly requiring a frontier-compatible verdict for autonomous answers will prevent the arbiter from pairing `questionAction=answer` with an invalid empty-frontier `continue`, while retaining parser fail-closed rules and exact offered-label validation.
- **Mechanism:** Extend both the pending-question rule and the later process-control rule in `global/agents/session-completion-arbiter.md`: use `allow_stop` plus `answer` when the supplied frontier is complete; use `continue` plus `answer` only when the supplied frontier is runnable and carries the exact non-empty runnable/unresolved rows; keep `continue` plus `questionAction:null` for a completion-audit process-control gap. Replace the stale generic `as continue` contract marker with exact frontier/action pairing assertions that still reject `product_decision_required`. Do not alter parser/controller semantics, question authority, or prompt scenario facts.
- **Candidate:** Accepted-outcome dependency closure for current loaded session-completion arbiter instruction plus the existing S24 async diagnostics runner.
- **Environment:** Focused contracts and guard tests, provider-free preflight, then one create-new isolated autonomous capture/replay only after the corrected instruction passes readiness review.
- **Evidence:** `evidence/installed-suite-autonomous-s24/capture-autonomous/raw.json` and `replay-autonomous/evaluation.json`; production parser `global/extensions/session-completion-guard/verdict.ts`; focused parser/controller oracles in `tools/test-session-completion-guard.ts` for complete-frontier autonomous `allow_stop` answers.
- **Outcome:** Initial readiness challenge `ses_facd26f57ffeRZPp28AF46ANQN` reported `IR-S25-001`; main reproduced and corrected both instruction sites and the stale marker. Corrected re-review `ses_faccd80b9ffeL68jrPm0FvIvNt` found no material issue. Contracts `73/73`, guard tests `54/54`, strict validation, instruction inventory/canonicalization, and provider-free preflight passed. The installed S25 capture then followed the new rule by refusing to answer without a controller-validated frontier and reported `missing-frontier`; replay failed closed and cleanup passed.
- **What Was Learned:** The instruction/validator contradiction is closed. The remaining failure is a Proof Runner input defect: the legacy autonomous scenario enabled grind but supplied no frontier, so no parser-valid complete/runnable answer pair existed. Updating only the instruction could not make missing frontier authoritative.
- **Supersedes:** S24's candidate-unknown state only. It retains S24's runner correction, strict parser, exact offered labels, human-reply precedence, frontier authority, serial capture-to-replay, and proof-owned cleanup.
- **Do Not Repeat Condition:** Do not relax `continue` validation, reinterpret empty frontier as runnable, change the offered labels, manually edit S24 evidence, repeat S24 unchanged, or authorize any protected action.
- **Evidence-Based Retry Condition:** Satisfied and consumed. Do not repeat S25. A later configured attempt requires a causally distinct scenario that first materializes a controller-validated complete frontier and a provider-free preflight under that source identity.
- **Claim Ceiling:** The correction can prove one complete-frontier autonomous answer path only. Population remains `unknown`, `0/20` until all reviewed members and independent challenge are recorded.

## 2026-08-30 - GRIND-S26

- **Strategy ID:** `GRIND-S26`
- **Hypothesis:** Materializing an exact complete frontier before the autonomous safe-local question will exercise the intended task-scoped answer path and allow the corrected arbiter to return parser-valid `allow_stop + answer`, after which the resumed root can complete and pass its later completion audit.
- **Mechanism:** Keep one maintained runner. For `autonomous`, enable only `grind_frontier` and `question`; require one generation-1 complete frontier with a reviewed completed item before the question; require ordered `grind_frontier → question`, exact selected safe label/provenance, final complete frontier, and later guard `passed`. Preserve S24 asynchronous capture and all cleanup/replay boundaries.
- **Candidate:** Task-4.2 safe-local-strategy population member proof input/oracle; no production controller/parser/arbiter change beyond the already validated S25 instruction correction.
- **Environment:** Focused tests, provider-free preflight, then one create-new isolated autonomous capture/replay.
- **Evidence:** S25 raw/replay reports `missing-frontier`, `questionAction:null`, no selected answer, fail-closed replay, and complete cleanup. Current task-scoped product/non-product/technical scenarios already prove the maintained `grind_frontier` tool path.
- **Outcome:** Focused contracts and guard tests passed. The first suite invocation stopped before server/provider startup because embedded provider-free preflight exited `1`; cleanup was complete. Offline readback showed the preflight's legacy autonomous fixture lacked S26's new frontier/tool-order fields while stdout misleadingly printed technical-only `accepted=true`.
- **What Was Learned:** A grind-enabled parentless root cannot treat absent frontier as complete. The proof must create authoritative controller state rather than ask the arbiter to infer it. Preflight summary must represent every accepted/rejected control, not only the technical accepted row.
- **Supersedes:** The legacy frontier-free autonomous input only. It retains exact offered labels, autonomous authority, parser/controller safety, S25 verdict pairing, no human reply, configured route, serial capture-to-replay, and proof-owned cleanup.
- **Do Not Repeat Condition:** Do not infer complete from missing frontier, weaken parser validation, add a second runner, answer before frontier materialization, or count cleanup-only evidence as member support.
- **Evidence-Based Retry Condition:** Update the provider-free autonomous control to require generation-1 complete frontier and exact tool order, and make summary `accepted` equal the aggregate exit predicate. A create-new preflight must then exit zero before the still-unused one installed autonomous allowance.
- **Claim Ceiling:** At most one complete-frontier safe-local-strategy member; `GRIND-TSB-001` remains `unknown`, `0/20` until reviewed population materialization.

## 2026-08-30 - GRIND-S27

- **Strategy ID:** `GRIND-S27`
- **Hypothesis:** Aligning the autonomous preflight control with S26 and deriving its published `accepted` value from the aggregate exit predicate will close the provider-free gate without changing runtime behavior.
- **Mechanism:** Add S26 frontier generation/state, exact tool order, and enabled tools to the existing autonomous preflight row. Compute one aggregate accepted boolean over technical replay, every existing control, and every rejected control; use it for both stdout and exit.
- **Candidate:** Provider-free preflight diagnostics for S26 only.
- **Environment:** Create-new preflight first; no server or configured call unless its process exits zero and reports `accepted=true`.
- **Evidence:** `evidence/installed-suite-autonomous-s26/raw.json` has child status `1`, stdout `accepted=true`, no server or configured observation, and complete cleanup; source readback shows `existingControls.autonomous` missing every new S26 oracle field.
- **Outcome:** Standalone and embedded provider-free preflight both exited zero with aggregate `accepted=true`; the unchanged configured autonomous allowance then produced generation-1 complete frontier, exact `grind_frontier → question` order, official `Recommended` answer without human reply, later guard `passed`, terminal replay, and complete cleanup.
- **What Was Learned:** A per-row success summary can contradict a suite gate after an oracle expands. The published boolean and process exit need one owner expression.
- **Supersedes:** S26 preflight fixture/summary only. It does not change the S26 installed prompt, candidate oracle, production sources, configured-call budget, or claim status.
- **Do Not Repeat Condition:** Do not trust stdout without process exit, add a second preflight, weaken the autonomous oracle, reuse a failed evidence root, or launch server/provider before aggregate preflight passes.
- **Evidence-Based Retry Condition:** Create-new standalone preflight must report `accepted=true` and exit zero; embedded preflight must then do the same before the unchanged single configured S26 capture.
- **Claim Ceiling:** Provider-free fixture correctness only; no population member support.

## 2026-08-30 - GRIND-S28

- **Strategy ID:** `GRIND-S28`
- **Hypothesis:** One current-source replay-gated default installed suite can refresh the five task-4.1-derived population members without mixed-candidate composition after the S25 arbiter correction.
- **Mechanism:** Use the maintained suite's original default product, non-product, and technical order under the current S25/S27 source. Each scenario must preserve capture raw, pass provider-free replay, and close cleanup before the next scenario. Map product capture to partial and all-remaining product members; map non-product capture to credential/safety independent and waiting members; map technical capture to circular reconciliation.
- **Candidate:** `grind-task-scoped-population-r1`, members 1-5 in `evidence/task-4-2-population-map-r1.md`.
- **Environment:** OpenCode 1.18.25, current installed/disposable suite, configured `xai/grok-4.6/high` primary and hidden arbiter, no target-project/protected/remote effect.
- **Evidence:** S27 current autonomous pass; task-4.1 r10/S22 historical success; the exact 20-row reuse-first population map R1.
- **Outcome:** Succeeded. The current default suite captured product, non-product, and technical paths serially; every provider-free replay returned `candidateOraclePass=true`, `cleanupOraclePass=true`, and `replayComplete=true`; suite `failure=null`; cleanup closed before the next member.
- **What Was Learned:** Historical r10 behavior remains useful causal evidence but cannot be composed as current claim support after the loaded arbiter identity changed.
- **Supersedes:** Reusing r10 as current evidence for population members 1-5 only. It retains r10's scenario oracles, current S25 verdict pairing, S27 aggregate preflight, serial replay gate, and process cleanup.
- **Do Not Repeat Condition:** Do not run additional population prompts, mix r10 and S27 as one current candidate, skip an intermediate replay, run scenarios in parallel, or continue after any failed current capture/replay.
- **Evidence-Based Retry Condition:** Current aggregate provider-free preflight remains green. Run one create-new default suite; any failure is consumed through its preserved replay/finalization chain before another configured action.
- **Claim Ceiling:** At most members 1-5 at the exact current candidate/environment identity; no claim support until all 20 final rows and independent challenge close.

## 2026-08-30 - GRIND-S29

- **Strategy ID:** `GRIND-S29`
- **Hypothesis:** Rebinding the reviewed observations to the exact existing canonical population IDs and accepting the independent review's mixed-fidelity narrowing will allow deterministic claim materialization without another configured suite.
- **Mechanism:** Keep the existing 20-member `claims[].population.members` array byte-for-byte. Map current installed, provider-free composition, and current component evidence to those exact IDs; record `disposition=narrowed`; merge only through `tools/evidence-index.ts --merge-claim-population`; read back the terminal lane and run strict OpenSpec validation.
- **Candidate:** `grind-task-scoped-population-r1` at `windows-opencode-1.18.25-grind-population-r1`.
- **Environment:** Existing S27 autonomous and S28 default installed bundles plus provider-free controller/component evidence; zero additional configured calls.
- **Evidence:** `evidence/task-4-2-population-r1.md`; `evidence/task-4-2-evidence-sufficiency-r1.md`; `evidence/grind-tsb-001-population-r1.seed.json`; reviewer `ses_faca0767affe5KwCA3RPboJzGh`.
- **Outcome:** Succeeded after one fail-closed alias mismatch. The seed now exactly matches the 20 canonical members and observation order; merge reported `files=41`, `lanes=22`, `observations=20`; lane readback matched current digests; strict OpenSpec validate and blocking apply gate passed.
- **What Was Learned:** Evidence reuse can close member-local behavior at mixed fidelity, but it cannot upgrade provider-free roadmap/campaign composition to installed population coverage. Canonical population identity must be read before authoring reviewed aliases.
- **Supersedes:** The first exploratory 20/20 `unknown` merge and S28's pre-execution status. It preserves every original installed/component oracle and the independent review's `CE-TSB-001` through `CE-TSB-005` narrowing.
- **Do Not Repeat Condition:** Do not launch another installed/configured suite, reintroduce exploratory member IDs, hand-edit `evidence-index.json`, or represent the narrowed record as uniform installed coverage.
- **Evidence-Based Retry Condition:** None for the claim merge. Any later task-evidence or SDET record update must use the existing deterministic helper and current immutable bundles.
- **Claim Ceiling:** The exact 20 canonical members are supported only at the recorded mixed-fidelity boundaries. Installed roadmap/campaign composition, unreviewed populations, and stable/global behavior remain unproven.

## 2026-08-30 - GRIND-S30

- **Strategy ID:** `GRIND-S30`
- **Hypothesis:** Requiring zero open gates and zero parked decisions before `frontierState=complete` will close the SDET-reproduced false-stop path while preserving the existing runnable, product-decision, and waiting dispositions.
- **Mechanism:** Refine the single `assess()` completion predicate in `global/extensions/session-completion-guard/frontier.ts`; retain the SDET-authored failing oracle; rerun focused provider-free checks; then run one create-new current default installed suite to re-establish product/non-product/technical real-boundary proof before a fresh corrected-candidate SDET.
- **Candidate:** `grind-task-scoped-population-r2`, correcting SDET risk `CR-TSB-001` on top of R1.
- **Environment:** Current source, OpenCode 1.18.25 disposable configured suite, provider-free replay, proof-owned cleanup, no target-project/protected/remote effect.
- **Evidence:** SDET `ses_fac829becffeCwJ6RXXC2JFb0M`; failing then passing test `critical: complete item status cannot allow_stop while open safety or parked product gates remain`; `frontier.ts` completion predicate.
- **Outcome:** Provider-free reproduction confirmed the critical failure; the one-predicate correction made all 55 focused guard tests pass. Contracts `73/73`, work-campaign suites, and strict validation passed. Current-source default product/non-product/technical and selected autonomous suites both returned `failure=null`; all four replays had `candidateOraclePass=true`, `cleanupOraclePass=true`, `replayComplete=true`; both suites closed cleanup and writer liveness. The exact 20-member narrowed claim and task evidence were rematerialized as R2 (`files=51`, `lanes=24`, `observations=20`). Corrected-candidate SDET remains pending.
- **What Was Learned:** Item status alone is not closure. Open scoped gates and parked product decisions are first-class unresolved state even when every affected item is labelled complete or deferred.
- **Supersedes:** R1 completion classification only. It retains strict verdict parsing, current instruction pairing, all task-scoped scheduling behavior, the narrowed population ceiling, and every no-effect authorization boundary.
- **Do Not Repeat Condition:** Do not duplicate the guard in the verdict parser, weaken the SDET oracle, reuse pre-fix installed evidence as current, or run another configured attempt before focused checks pass.
- **Evidence-Based Retry Condition:** Focused guard/contracts/work-campaign checks and strict validation must pass; then one create-new default suite may re-establish current installed proof. Any live failure must reach terminal provider-free replay and cleanup before another attempt.
- **Claim Ceiling:** No current candidate claim until corrected installed proof and fresh SDET close. Historical R1 evidence remains causal only.

## 2026-08-30 - GRIND-S31

- **Strategy ID:** `GRIND-S31`
- **Hypothesis:** A fresh corrected-candidate SDET can falsify the R2 completion fix and adjacent critical invariants without configured calls or new production mutation.
- **Mechanism:** Supply the original critical requirements, initial `CR-TSB-001`, exact one-predicate correction, current provider-free checks, and immutable installed R2 bundles to a new test-only SDET context. Require direct disposition of false completion, authorization/privacy/protected-effect escape, gate loss, and human/frontier authority.
- **Candidate:** `grind-task-scoped-population-r2`, frontier digest `e05375fbb793ee5f15193eb3958606fcdd0c7d7ec70f9ff02bb177492b61b49c`.
- **Environment:** Provider-free source/tests plus read-only installed R2 evidence; no server/provider/process action in the corrected SDET pass.
- **Evidence:** Initial SDET `ses_fac829becffeCwJ6RXXC2JFb0M`; corrected SDET `ses_fac643e8affe940rh35khDv4fC`; `evidence/task-5-1-critical-sdet-r2.md`.
- **Outcome:** Corrected SDET returned `no-critical-risk`. It independently exercised complete/open safety, product, capability, technical, live-attempt, and writer-liveness gates; true complete/no-gate state; runnable false-stop; authorization/privacy/no-effect; and stale/interruption/epoch controls. `CR-TSB-001` is fixed, no distinct current critical defect was reproduced, and no new file was written.
- **What Was Learned:** The correction belongs in frontier state derivation; strict verdict parsing then composes with it without a duplicate safety policy.
- **Supersedes:** S30's pending corrected-candidate SDET state only. It preserves the narrowed claim ceiling and installed R2 proof.
- **Do Not Repeat Condition:** Do not rerun an unchanged SDET candidate, run another configured suite for confidence, or broaden `no-critical-risk` beyond the exact R2/provider-free and inspected installed boundaries.
- **Evidence-Based Retry Condition:** Only a material production/instruction mutation or a distinct current reachable critical hypothesis can reopen SDET.
- **Claim Ceiling:** Current critical gate is terminal for R2. The broad 20-member claim remains mixed-fidelity `narrowed`, not uniform installed or global support.

## 2026-08-30 - GRIND-S32

- **Strategy ID:** `GRIND-S32`
- **Hypothesis:** A fresh R2 evidence-sufficiency challenge can distinguish current installed identity from historical component evidence and eliminate record wording that still implies uniform installed coverage.
- **Mechanism:** Challenge exact member/order/status, lane identities, source hashes, claim statement/paths, challenge freshness, and maximum ceiling in a new read-only reviewer context. Reproduce each material row, then update only explicit seed data and deterministic merge support for statement/paths.
- **Candidate:** `grind-task-scoped-population-r2`; no guard production mutation after terminal corrected SDET.
- **Environment:** Current index/seed, installed R2 raw and replay bundles, provider-free roadmap/campaign evidence, historical component bundles, and R2 SDET record.
- **Evidence:** Reviewer `ses_fac5c750affeNrL1tfb0E46ITi`; `evidence/task-4-2-evidence-sufficiency-r2.md`; findings `CE-TSB-R2-001` through `CE-TSB-R2-003`.
- **Outcome:** All three record findings were reproduced. The current review now owns `independentChallenge`; component-only members are explicitly historical identities; the structured statement, paths, observation boundary, and maximum ceiling explicitly describe mixed fidelity and exclude uniform installed, installed roadmap/campaign, protected-effect, global, and stable claims.
- **What Was Learned:** `disposition=narrowed` is insufficient when a preserved statement/path still sounds broader. Structured seed data must own every claim-bearing field that can contradict the maximum ceiling.
- **Supersedes:** R1 challenge freshness and R2 wording that called historical component evidence current or implied an installed 20-member production path.
- **Do Not Repeat Condition:** Do not hand-edit `evidence-index.json`, relabel historical components as current, treat reviewer freshness as behavior proof, or promote the maximum above the explicit mixed-fidelity statement.
- **Evidence-Based Retry Condition:** Re-run deterministic helper/library validation and index readback. A new broad-claim review requires a later material claim/candidate/evidence-boundary change.
- **Claim Ceiling:** Exact 20-member mixed-fidelity support only at installed R2 selected paths, provider-free roadmap/campaign controller-ledger paths, and named historical component identities.
