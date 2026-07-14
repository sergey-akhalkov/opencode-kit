---
name: change-ready-sdlc
description: Use this skill before any behavior-changing implementation, bug fix, refactor, loaded instruction or configuration change, generated-output change, or explicit Change-Ready request. Explicit Change-Ready overrides review-only exclusion. Stay quiet for pure research, ordinary review-only work, and proven inert content edits.
license: MIT
---

# Change-Ready SDLC

Canonical portable orchestration adapter for local Change-Ready work in any software project. The active primary user-session agent is the sole orchestrator. Nested general-purpose subagents are not orchestrators. Specialists return report-only handoffs and never claim lifecycle completion, ask the user, or perform external operations.

If this skill cannot be loaded for a behavior-changing task, block before mutation. Do not reconstruct a partial process from memory or import a foreign stack default.

## When To Load

Load before the first mutation when work can change runtime behavior, loaded instructions, routing, configuration, generated output, protocols, or other user-visible/system-observable outcomes, or when the user explicitly requests Change-Ready readiness.

Do not load for pure research, ordinary review-only questions, or content edits already proven inert for runtime, loading, routing, protocol, configuration, generation, and user-visible behavior—unless Change-Ready was explicitly requested.

## Profile: Small | Material

Initially classify exactly as `Small` or `Material`. A run may escalate only from Small to Material when new risk appears; never downgrade Material to Small or discard already-required evidence.

Small requires all of:

- clear requirements;
- local reversible scope;
- one affected boundary;
- known focused validation;
- no public-contract, persisted-data, migration, security, concurrency, deployment, or compatibility risk.

Any false or unknown condition selects Material.

Profile controls planning and delivery ceremony only. Every behavior change still receives fresh independent SDET assessment. SDET `N/A` is allowed only for evidence-backed non-behavioral work.

## Adapter Discovery

Before production or SDET authorship, discover project-native adapters from project instructions, validation configuration, existing automation, schemas, and explicit owner input:

- requirement source;
- production author;
- SDET / testing capability;
- validation procedures;
- candidate-capture mechanism;
- deterministic candidate identity-generation capability (part of candidate capture or a paired adapter);
- independent final reviewer;
- delivery / readiness gate;
- external-operation policy;
- native readiness label.

Missing mandatory capability is `unknown` or `blocked`. Missing reproducible candidate identity-generation capability blocks qualification. Never invent a language, package manager, build system, test framework, version-control product, CI/hosting provider, operating system, shell, review product, model, fixed command, or portable hash algorithm. Kit-local workers or tools are optional discovered adapters only, never portable requirements.

## Authoritative Brief

Use the complete shared field schema from the always-loaded Universal Task Briefing Contract in global `AGENTS.md`. Do not copy that schema here. Reference it and supply lifecycle-specific values, role views, and the cold-context dispatch gate.

Rules:

- Never delegate a raw user prompt or rely on hidden conversation context.
- Use `N/A - <reason>` for genuinely inapplicable fields; never omit silently.
- Small keeps field values concise; Material is complete for its risk.
- Material uses the project's accepted durable specification system when present; otherwise a complete session brief. Do not introduce a foreign specification product solely because the task is Material.
- Keep original sources, later owner decisions, and superseded statements traceable.
- Report missing domain expectations as `unknown`; do not invent thresholds.

### Lifecycle field values

Populate every Universal Task Briefing Contract field. Emphasize:

- Role and Objective as end state and value for the receiver.
- Current State and Evidence with labeled observations, assumptions, hypotheses, and recommendations.
- Requirements and Invariants plus independently checkable acceptance criteria and the observable happy path or test-only baseline boundary.
- Exact read scope, write scope, and forbidden actions for this role only.
- Resolved Decisions and Rationale including ownership, error model, compatibility, rollback, **accepted acceptance criteria**, **project-specific scope lock**, **planned gate waves**, **correction budget**, and **stop line** when the work is behavior-changing (record these before first candidate mutation; do not invent a second planning artifact).
- Verification as exact project-native procedures and success conditions already authorized by adapter discovery.
- Return Contract requiring evidence, changed artifacts, procedures/outcomes, blockers, and residual risks.
- Blocker and Escalation Policy distinguishing agent-resolvable unknowns from owner decisions.

## Acceptance scope lock and anti-polishing

Mandatory quality gates and serious-defect protection remain. This section prevents unbounded reviewer, evidence, test, and eval expansion after mutation.

### Pre-mutation record

Before the first behavior-changing candidate mutation, record in the Authoritative Brief (existing fields above): accepted acceptance criteria; project-specific scope lock; planned gate waves; correction budget; and stop line. Existing projects may predeclare stricter gates before mutation; they must not silently expand acceptance after mutation.

### Post-mutation expansion rule

After the first candidate mutation, a new blocking candidate correction or new acceptance criterion requires either:

1. explicit owner approval; or
2. a reproducible P0/P1 defect that affects behavior, CI, security, data integrity, or compatibility.

A severity label alone is insufficient. Missing or failed mandatory lifecycle gate, unsafe writer ownership/liveness, or unresolved owner decision still blocks Change-Ready, but must not justify speculative product or evidence scope.

### Blocking versus residual

Keep `Required Next Actions`, `Actionable Continuation Items` that request candidate correction, and final-review `changes_requested` binding—but restrict their contents to mandatory-gate failures or qualifying P0/P1 serious defects as defined above.

Route P2/note findings, coverage-only gaps, optional evidence, provenance/wording polish, and speculative hardening to Residual Risks or a separately approved follow-up. They must not populate blocking Required Next Actions, must not alone produce `changes_requested`, and must not trigger autonomous gate replay.

### Planned gate waves and replay

Plan one SDET qualification wave, one Final Candidate Review wave, and for Material one delivery/readiness wave. Replay only gates invalidated by a qualifying P0/P1 correction or a genuinely failed mandatory gate. Never replay merely to strengthen evidence wording or completeness polish.

### Representative evals and evidence tooling

Select behavioral evals and negative cases representatively from the accepted high-impact risk matrix, not as an exhaustive Cartesian product. Exhaustive work needs a concrete high-impact risk, project/regulatory mandate, or explicit owner approval.

Evidence tooling must not become a second product. Add it only when a mandatory gate cannot be reproduced without it, or a small deterministic helper demonstrably replaces more repeated work than it creates.

### Correction budget

There is no universal retry count. A predeclared project correction budget is a planning ceiling. When exhausted: nonblocking items become residual/follow-up; a remaining serious or mandatory blocker means `Change-Ready: no` plus owner escalation—not autonomous infinite looping and not false acceptance.

### Role views

- Production author: production write scope only; smallest complete happy path; no automated test artifacts; return changed artifacts, observable proof procedure, blockers, residual risks; report-only.
- SDET: fresh context that did not author production; test-only write scope (exact blocks/content when co-located); original requirements and current candidate; exact Input Semantic Candidate Identity, Input Package Identity, and Identity Recipe for the pre-SDET candidate covered by initial Applicable Proof; no production transcript, secrets, expected verdict, or external-operation authority; independent risk/oracle matrix; action exactly `authored-tests | assessed-existing-tests | blocked`; every phase records input/current identity fields and Identity Recipe.
- Final reviewer: fresh read-only context that authored neither production nor tests; complete current candidate; current Applicable Proof (including post-test proof after authored-tests); final SDET evidence or evidence-backed SDET `N/A` only for proven non-behavioral work; complete validation; corrections; residual risks; structured verdict only.
- Delivery/readiness reviewer (always for Material; for Small only when policy/risk/owner requires): local package and continuity evidence; no candidate authorship. Missing conforming Material delivery/readiness capability blocks.
- Diagnosis specialist: cause analysis only; route production fixes to production author and test fixes to fresh SDET.

### Cold-context dispatch gate

Before dispatch, verify a capable receiver with no prior conversation can state the required result, why it matters, what it may change, how success is proved, and what it must return. If not, repair the brief; do not dispatch.

## Orchestrator ownership

The active primary user-session agent owns:

- source-of-truth selection and Authoritative Brief;
- profile and task tracking;
- Adapter Discovery;
- specialist dispatch and fresh-session boundaries;
- serial writers unless scopes are proven isolated or exact non-overlapping;
- integration of all outputs;
- Candidate Freeze and recapture after any mutation;
- Applicable Proof execution;
- Project-Native Validation under authorized procedures only;
- failure batching and owner routing;
- Final Candidate Review dispatch;
- local handoff package and Change-Ready Decision.

The active primary remains orchestrator only: it dispatches the configured production author and fresh SDET; it must not use direct edit/write tools as the production author or as SDET for behavior-changing candidate production or automated-test artifacts. Main-owned planning notes, integration, validation orchestration, local handoff package text, and task-status checkbox updates remain allowed when they are not candidate production or test content.

Only the active primary orchestrator may create or resume specialist sessions. Leaf production, SDET, review, diagnosis, and delivery specialists must never dispatch or resume nested agents. Real parallelism uses one orchestrator-owned fan-out using the discovered runtime fan-out adapter and is limited to independent isolated or exact non-overlapping scopes proved before dispatch; single specialist dispatches remain serial. One blocking specialist call is serial; real concurrency requires one adapter-supported fan-out of independent dispatches. Reconcile and integrate every fan-out result before proof or qualification. For every specialist dispatch, record role, ownership scope, and available runtime session/task identity.

Accept specialist dispatch or resume evidence only when the discovered runtime adapter proves active primary parent identity, child session/task identity, and expected child role/context. Top-level/default-primary fallback is not specialist evidence. Unavailable or unverifiable child dispatch or continuation blocks the affected gate. Do not hard-code a concrete runtime mechanism, provider, model, OS, or product name in portable runtime text.

**Universal writer attempt closure (serial or fan-out):** every mutation-capable execution—including every writer dispatch/attempt and every mutation-capable validation, generator, or formatter command—remains open after timeout, cancel, missing report, partial mutation, or unknown liveness until a terminal report is received, adapter-proven terminal cessation is established (cancellation counts only after the writer or execution can no longer execute or mutate), or its workspace/write authority is isolated or revoked so it cannot mutate the candidate. Recorded timeout, cancel, or missing report alone is not closure. Cancellation request or acknowledgement alone is not closure. Unknown liveness or unisolated ownership blocks integration, freeze, proof, and qualification. Late output or late mutation after the attempt boundary invalidates the qualification attempt and does not close a still-live mutator. Prefer isolated workspaces for mutation-capable validation.

If any fan-out child or serial writer attempt blocks, times out, is cancelled, returns a missing report, or leaves a partial mutation, do not freeze, prove, or qualify. Apply **Universal writer attempt closure** to every open attempt: record each slice/attempt state and identity, recapture attributable mutations, quarantine unsafe ownership, integrate only after every result is accounted for, and route retry, resume, or fresh dispatch by continuity rules without erasing prior failure—only after the open attempt is closed or isolated. Do not invent a coordinator or durable orchestration state store.

No production or test mutation runs during qualification of a frozen candidate. Specialists do not delegate, ask the user, expand validation authority, or declare readiness.

## Lifecycle transitions

### 1. Classify and prepare

Restate requirements, constraints, non-goals, invariants, happy path or test-only baseline, and validation boundary. Initially classify exactly `Small` or `Material`; permit only Small-to-Material escalation later in the run, never a downgrade. Discover adapters. Build the complete cold-context Authoritative Brief (shared schema remains in global `AGENTS.md`; do not duplicate it here). Record profile, complete brief, and adapter discovery before any behavior-changing candidate mutation—not only before specialist dispatch. For behavior-changing work, do not mutate until this skill is loaded and that record exists.

### 2. Production path or test-only N/A

Production work: the active primary remains orchestrator and must dispatch the configured production author for the smallest complete happy path only. It must not use direct edit/write tools as the production author for behavior-changing candidate artifacts. No test, fixture, snapshot, fake, simulator, harness, or golden artifact edits by production or by the orchestrator acting as production. Main-owned planning notes, integration, validation orchestration, local handoff text, and task-status checkbox updates remain orchestrator-owned when they are not candidate production or test content.

Test-only work: production dispatch is evidence-backed `N/A` with baseline/current-boundary proof; fresh SDET is the sole content author. Exact co-located test blocks/content only; unsafe attribution blocks.

### 3. Candidate Freeze (pre-SDET)

After production path completion and before Applicable Proof or Fresh SDET dispatch, the orchestrator closes every mutation-capable production writer only after terminal report, adapter-proven terminal cessation, or isolated/revoked write authority, integrates production outputs, and freezes the complete scoped pre-SDET candidate: baseline assumption; every added, modified, and deleted in-scope artifact; reviewable representation for generated or binary artifacts; ownership of overlapping pre-existing work. Exclude secrets and unrelated workspace content. Use any project-native capture mechanism.

Record a privacy-safe `Identity Recipe` from the discovered identity-generation capability (capture adapter or paired adapter). The recipe binds to the same scoped candidate as both identities and MUST include: mechanism/algorithm identifier and version; baseline/reference used to determine the candidate and pre-existing task items; stable scoped path manifest and ordering; add/modify/delete representation including deletion framing; path/content boundary framing; exact byte and line-ending treatment; semantic-normalization rule/version; and reproduction procedure with required local inputs. Do not prescribe a universal hash, version-control product, OS, language, command, filename, or product. Adapter-defined stable framing is acceptable only when recorded and reproducible. Capture both `Semantic Candidate Identity` and `Package Identity` for that frozen pre-SDET candidate. Missing, incomplete, or unreproducible recipe blocks qualification, blocks Applicable Proof progression, and blocks SDET dispatch.

Freeze one candidate only after every open mutation-capable execution is closed under **Universal writer attempt closure**. Accounting that a writer blocked, timed out, was cancelled, or returned a missing report is required but not sufficient without that closure or isolation. No concurrent writers during qualification. Any mutation, including late writer mutation after the attempt boundary, invalidates and abandons the current qualification attempt and affected evidence, but does not close a still-live mutation-capable execution; terminal-or-isolated closure remains required before freeze, recapture, proof, or qualification.

After provisional authored-tests, freeze and recapture the complete post-test candidate before post-test Applicable Proof, complete validation, and final SDET. Integrate test outputs before qualification of the post-test candidate.

### 4. Applicable Proof

After Candidate Freeze and before Fresh SDET dispatch, the orchestrator executes current applicable proof against that frozen candidate:

- production work: observable happy-path proof at the relevant boundary (inspection, compilation alone, or mocked-helper-only claims are insufficient);
- test-only work: production-dispatch `N/A` rationale plus baseline/current-boundary proof.

Retain exact blockers when proof cannot run. Early implementation feedback is never final review.

After Applicable Proof and after terminal-or-isolated closure of any mutation-capable proof execution, recapture both identities with the same recorded Identity Recipe. Both Semantic Candidate Identity and Package Identity MUST be unchanged before Fresh SDET dispatch. Any scoped mutation abandons the current proof/candidate and requires owner routing, a new freeze, and replay of affected gates.

### 5. Fresh SDET

Every behavior change gets a fresh SDET context that did not author production. Provide Authoritative Brief, original sources, current scoped candidate, current tests, project testing guidance, Applicable Proof, exact test-only scope, authorized validation descriptions, and exact `Input Semantic Candidate Identity`, `Input Package Identity`, and `Identity Recipe` for the frozen pre-SDET candidate covered by the initial Applicable Proof.

Prefer a distinct effective SDET model when the project/session configuration makes one available. Same effective model remains portable and allowed; then record residual same-model correlation risk and keep the fresh role/context requirement. Do not hard-code a provider or model in the portable contract.

SDET independently builds a realistic risk and observable-oracle matrix and selects cases representatively from high-impact risks (see **Acceptance scope lock and anti-polishing**). Coverage percentage, test count, opaque snapshot growth, retry-until-green, exhaustive Cartesian expansion by default, and mock-interaction-only assertions do not establish acceptance. Prefer real boundaries; record justified simulation/mock exceptions as confidence gaps.

#### SDET Provisional Report

SDET first returns a provisional report with action `authored-tests | assessed-existing-tests | blocked`, risk/oracle matrix, test changes or existing-test evidence, required validation procedures, residual risks, and identity fields: Input Semantic Candidate Identity, Input Package Identity, Semantic Candidate Identity, Package Identity, and Identity Recipe. The orchestrator inspects write scope. Out-of-scope mutation blocks progression.

Provisional identity rules:

- `authored-tests`: input pair exact; current Semantic Candidate Identity and Package Identity are exactly `pending orchestrator recapture after test edits`; Identity Recipe records the input recipe and notes that main must confirm/reuse or replace it during current recapture. SDET must not fabricate post-edit hashes.
- `assessed-existing-tests`: no mutation; current pair equals input pair and recipe unchanged. Prior current Applicable Proof remains valid when identity and recipe are unchanged; do not replay proof solely for SDET assessment.
- `blocked`: report known input/current status exactly, or unknown.

#### Authored-tests identity handshake

After provisional `authored-tests`, main maintains one reproducible current candidate chain:

1. Inspect exact test-only scope; out-of-scope mutation blocks.
2. Freeze the complete post-test candidate; record/reproduce the current Identity Recipe; recapture both current Semantic Candidate Identity and Package Identity.
3. Re-run Applicable Proof at the relevant production/system boundary against the complete post-test current candidate before complete validation. Production need not be redispatched when production content is unchanged, but observable proof must run and bind to the current semantic identity.
4. If recapture changes the recipe unexpectedly, scope is unsafe, proof cannot run or pass, or current identities cannot be reproduced, block before final SDET and validation progression.
5. Run complete project-native validation on the current post-test candidate.
6. Send the exact current pair, recipe, post-test Applicable Proof outcome, and bounded validation outcomes to the same SDET context for the final report. Final SDET records exact current pair and recipe; pending is forbidden in final. Final SDET checks received proof/validation coherence and does not execute them.

Same SDET context remains valid only for provisional→final on that inspected test-only mutation. Any subsequent production or test correction still requires a new fresh corrected-candidate SDET and affected replay.

### 6. Project-Native Validation

Record each exact authorized procedure and its trusted source before execution. Agent suggestions do not expand authority. If the candidate changes a validation definition or directly invoked tool/script, re-derive authorization from trusted project or owner evidence first.

Execute complete applicable validation against the current candidate. After authored-tests, validation runs only after post-test recapture and post-test Applicable Proof on the current semantic identity. After any procedure that may mutate artifacts, recapture the candidate. Scoped mutation invalidates prior candidate-bound proof and gates.

Return exact current pair, recipe, post-test Applicable Proof outcome when applicable, and bounded validation outcomes to the same SDET context for its final report when SDET ran. Accept only the final SDET report with exact current identities (pending forbidden). Candidate correction requires a new fresh SDET assessment.

### 7. Correction routing and replay

| Failure | Owner |
| --- | --- |
| Qualifying product/build defect (P0/P1 serious or mandatory-gate) | Production author; preserve reproducer |
| Qualifying test, fixture, simulator, harness, snapshot, or oracle defect | Fresh SDET |
| Missing high-impact risk oracle for an accepted serious risk | Fresh SDET (representative matrix only; not coverage polish) |
| P2/note, coverage-only, optional evidence, wording polish | Residual Risks or separately approved follow-up; no blocking correction |
| Unknown cause or ownership | Orchestrator diagnosis or block; no correction author yet |
| Validation authority/environment | Orchestrator or evidence owner |
| Final-review qualifying production finding | Production author |
| Final-review qualifying test finding | Fresh SDET |
| Handoff-package text only | Orchestrator / package author |

When a production defect belongs to the same recorded production author and role, objective, ownership scope, and continuity remain safe, resume that same production-author context using the discovered runtime continuation adapter. The continuation brief must include the new reproducer/outcome, exact current Semantic Candidate Identity, Package Identity, and Identity Recipe, explicit objective text continuous with the original production objective, explicit brief delta, unchanged forbidden actions, and return contract—not chat-memory-only handoff.

When session identity is unavailable, continuity is unknown, role, objective, or ownership changes, scope materially expands, or independence requires freshness, dispatch a new conforming production author with a complete cold-context brief or block. If resumable specialist sessions are unavailable, use a fresh production author with the complete brief and report that continuation is unavailable; do not invent durable memory.

Corrected-candidate SDET is always a new fresh context. Final review remains fresh and read-only. Production-author continuation does not preserve Applicable Proof, SDET, validation, or final-review evidence; replay all affected gates on the corrected candidate.

Any qualifying production or test correction (mandatory-gate failure or reproducible P0/P1 serious defect per **Acceptance scope lock and anti-polishing**) invalidates affected Applicable Proof, SDET, validation, specialist review, and final review. Replay only those affected downstream gates on the corrected candidate. Do not replay gates for P2/note polish, coverage-only gaps, or evidence-wording strength alone.

Maintain two deterministic identities and one recorded `Identity Recipe` for the same scoped candidate:

- **Semantic Candidate Identity** covers all candidate content, including active specification artifacts. Status-marker normalization is adapter-owned, explicit, and absent by default: the Identity Recipe records any selected status artifact and the enumerated pre-existing status items/marker transitions that are normalized. Portable text does not prescribe a universal status filename or marker syntax. Only proven forward transitions on those adapter-enumerated pre-existing status items may be qualification-neutral; reverse, unknown, wording, order, add/delete, or evidence changes remain semantic. Task wording, order, add/delete, evidence text, and every other candidate artifact remain part of semantic identity.
- **Package Identity** covers exact bytes of the complete scoped candidate package for handoff and audit.
- **Identity Recipe** is the adapter-owned, privacy-safe record of how both identities are framed and reproduced (mechanism/algorithm identifier and version; baseline/reference; stable scoped path manifest and ordering; add/modify/delete and deletion framing; path/content boundary framing; exact byte and line-ending treatment; semantic-normalization rule/version including any adapter-owned status-marker normalization or explicit absence of normalization; reproduction procedure and required local inputs). It does not prescribe a portable hash, tool, OS, language, command, filename, or product.

Qualification gates bind to Semantic Candidate Identity. Package Identity records exact bytes handed off or reviewed. Both identities and the Identity Recipe bind to the same scoped candidate. If the recorded recipe and required local inputs cannot reproduce both identities after restart, compaction, or handoff, continuity is unknown and qualification blocks.

Only an exact adapter-enumerated forward status-marker transition on a pre-existing status item, with current literal evidence that the item is complete, is qualification-neutral metadata. Exact diff must prove only those marker transitions; use the same recorded Identity Recipe and baseline/pre-existing status-item set (baseline and pre-existing set cannot silently change); recapture Package Identity; Semantic Candidate Identity remains unchanged and candidate gates are not replayed. There is no generic handoff-note exception. Any change to wording, evidence, blocker, verdict, risk, command, requirement, status text/order/add/delete, reverse or unknown marker direction, or any other candidate artifact is semantic mutation and invalidates affected gates. Identity Recipe change is always semantic process-evidence change: any change to the canonical recorded recipe stales qualification evidence and requires recapture and replay of affected gates. There is no recipe-change exception. Handoff-package-only text that is outside the scoped candidate may skip candidate qualification only when the recorded Identity Recipe itself is unchanged, both identities remain independently reproduced with that same prior recipe, and requirements and candidate artifacts are unchanged.

Unexplained fail/pass on an unchanged candidate remains blocked. Stop with `Change-Ready: no` when the same failure repeats without new root-cause evidence, a mandatory adapter is unavailable, workspace ownership is unsafe, an owner decision remains unresolved, or the predeclared correction budget is exhausted while a serious or mandatory blocker remains. No universal numeric cycle cap; the predeclared correction budget is the planning ceiling (see **Acceptance scope lock and anti-polishing**).

### 8. Final Candidate Review

Begin only after accepted final SDET evidence (or evidence-backed SDET `N/A` only for proven non-behavioral work; behavior-changing or test-content work cannot use `N/A`) and complete applicable validation. Dispatch a fresh read-only final reviewer that authored neither production nor tests. Map native verdicts to `approved | approved_with_notes | changes_requested | blocked`. Actionable notes that request a candidate change for a qualifying P0/P1 or mandatory-gate failure do not pass. P2/note and optional-evidence polish alone must not produce `changes_requested` or blocking Required Next Actions; route them to Residual Risks or follow-up. No conforming reviewer means blocked.

Before any reviewer dispatch, verify every candidate and evidence input is directly readable under the reviewer's effective permissions. External path references alone are insufficient. Supply a privacy-safe inline or attached evidence bundle: manifest, reviewable diff or content for every scoped artifact, runtime event excerpts when used as proof, final SDET report, and validation outcomes. Missing readability blocks before dispatch; do not relax reviewer permissions to reach external paths.

Supply Authoritative Brief, complete privacy-safe candidate, recorded `Identity Recipe`, current Applicable Proof, SDET risk/oracle evidence, validation outcomes, simulation/mock exceptions, corrections, and residual risks. For test-only work, Applicable Proof is production-dispatch `N/A`, baseline/test-boundary proof, and passing validation of the changed test boundary. After `authored-tests`, Applicable Proof must be the post-test proof bound to the current semantic identity and recipe; missing post-test proof replay after authored-tests blocks final review.

Require a structured report: exact verdict enum, `Semantic Candidate Identity`, `Package Identity`, and `Identity Recipe` for the candidate assessed, ordered evidence-backed findings with `Evidence Type`, `Likely Root Cause`, `Artifact Owner`, `Recommendation`, `Confidence`, and `Needs external reviewer`, plus blockers, residual risks, and actionable continuation items—not a bare verdict. Final review verifies that post-test Applicable Proof (when authored-tests ran), final SDET, validation, and this review share the current semantic identity and recipe; missing or unreproducible recipe or missing post-test proof continuity after authored-tests blocks.

### 9. Change-Ready Decision

Report `Change-Ready: yes` only when the same current candidate has:

- accepted requirements;
- Applicable Proof;
- SDET final evidence or evidence-backed `N/A` (N/A only for proven non-behavioral work);
- complete project/owner validation pass;
- accepted Final Candidate Review;
- for Material work, an explicitly accepted conforming delivery result;
- scoped candidate ownership with no unsafe overlap;
- no binding blocker or required action;
- complete local change-handoff package.

Material work always supplies current task/evidence status to the discovered conforming delivery/readiness gate; missing conforming capability blocks. Small uses proportional evidence and invokes that gate only when policy, risk, or owner requires it. Every `Change-Ready: no`, delivery `Verdict: material deviations`, an evidence-insufficient delivery verdict, `Blocking for Acceptance: yes`, `Verdict: blocked`, qualifying P0/P1 serious blocker, mandatory-gate failure, or non-empty Required Next Actions (restricted to those blocker classes) is binding and keeps readiness blocked. P2/note and optional polish must not appear in Required Next Actions.

Finite status-marker closure for Material delivery: after all prerequisite gates pass, the orchestrator MAY mark proven adapter-enumerated pre-existing status items up to and including final-candidate review as exact forward marker-only metadata transitions and recapture Package Identity. It MAY then run the delivery/readiness gate with only that gate's own closing status marker unchecked when every other applicable status item is checked and current literal evidence supports those markers. After accepted delivery with no other blocker or required action, the orchestrator marks that closing item as the same exact forward marker-only metadata transition, recaptures Package Identity, and does not replay semantic candidate gates. Any other unchecked applicable status item blocks readiness.

Local package contents: context; requirements; scope; non-goals; main changes; Applicable Proof; SDET/testing evidence; validation; review results; risks/rollback; review focus; changed-artifact scope; baseline/candidate assumptions; residual blockers; `External Operations: not performed`.

Projects may render `PR-Ready`, `MR-Ready`, `Ready To Land`, or another native label. Publication, upload, remote review creation/update, integration, deployment, release, and archive require separate explicit authority and are not part of Change-Ready.

### Rollback plan and evidence

Rollback is planned and evidenced in the local handoff package. It is executed only when separately authorized and is never required to claim Change-Ready.

**Full change rollback** restores the entire authoritative scoped candidate manifest to the captured baseline identified by the recorded Identity Recipe and baseline reference: every modified path restored, every added path removed, and every deleted path restored when a baseline copy exists. Scope identity comes only from that recorded manifest/recipe/baseline. Preserve unrelated, pre-existing, or teammate work outside the manifest.

Do not perform unjournaled sequential in-place rollback in a shared or dirty workspace. Build the complete baseline-restored candidate in an isolated workspace or project-native snapshot/transaction, validate that restored package there, then integrate or swap into the target workspace only using a discovered project-native failure-atomic or explicitly journaled/recoverable mechanism that retains preimages. Owner authorization may be additionally required but never substitutes for failure atomicity or journaling. Preflight every manifest path, ownership, and acceptable preimage (qualified candidate or baseline) before integration. After interruption or restart, re-inventory; only complete candidate or complete baseline states may continue. A third or unattributed state blocks.

If no safe isolated failure-atomic or journaled integration capability exists, ownership overlaps, integration partially fails or is interrupted, or any path has a third/unattributed state: stop before unprotected target mutation when possible and report rollback incomplete/blocked; hand off the validated isolated restored package; do not promise original workspace preservation after unprotected partial target mutation; do not run baseline validation against a mixed state; do not claim rollback complete.

After complete restoration only, run baseline-compatible repository validation. Restart or reload OpenCode only when active global runtime artifacts or the active config pointer changed. No application data or external-state rollback is required when the change creates none; remote operations remain separately authorized.

**Runtime activation rollback** is a separate operational action: restore the prior active config pointer and restart/reload without mutating the repository candidate. It may disable the new runtime for subsequent sessions and does not count as full change rollback of the repository candidate or non-runtime support artifacts.

Session delivery verifies a complete rollback plan and evidence distinguishing full change rollback from runtime activation rollback. Actual rollback execution remains separately authorized.

### Restart and continuity

After restart, compaction, cancellation, or context loss, reconstruct brief, candidate, role identities, recorded `Identity Recipe`, validation, and correction evidence from authoritative project/session sources. Continuity requires that the recorded recipe and required local inputs can reproduce both Semantic Candidate Identity and Package Identity for the same scoped candidate; otherwise continuity is unknown and qualification blocks. Anything unproved is stale and blocks Change-Ready. Continuity uncertainty never resets prior failures.

## Compact orchestration output

Return a compact record:

- `Profile`: Small | Material
- `Stage / evidence`: current stage and what is proved
- `Semantic Candidate Identity`: privacy-safe semantic identity of the scoped candidate
- `Package Identity`: exact-byte package identity handed off or reviewed
- `Identity Recipe`: privacy-safe mechanism/version/framing reference for how both identities are reproduced (no secrets or absolute private paths)
- `Gates`: Applicable Proof, SDET action or N/A, validation, final review
- `Delivery/readiness gate`: accepted, blocked, or `N/A - Small <reason>`; when applicable, include finite closing-marker or package-transition status
- `Corrections`: owner routes and replays, or none
- `Change-Ready`: yes | no
- `Native label`: project label if any, else none
- `External Operations`: not performed (unless separately authorized and recorded)
- `Blockers / residual risks`: exact items or none

## Enforcement honesty

These are process controls for instruction-only runtime: mandatory pre-mutation load, one complete orchestration skill, mutually exclusive roles, exact briefs and reports, main-session candidate inspection, and binding independent review. They are not an OS sandbox, dynamic path ACL, durable run database, or cryptographic guarantee of model compliance.
