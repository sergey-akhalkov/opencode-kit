---
name: change-ready-sdlc
description: Use this skill before mutation only for an explicit Change-Ready request, project-required qualification, or concrete Material risk (public API/protocol/compatibility, persisted data/migration, security/privacy/authorization, destructive or remote action, concurrency correctness, deployment/release, or a loaded instruction/configuration change that alters lifecycle or safety policy). Stay quiet for Ordinary Small work, pure research, ordinary review-only work, inert content, and routine implementation/bug fix/refactor/generated-output change or configuration change that is clear, bounded, local, and reversible.
license: MIT
---

# Change-Ready SDLC

Canonical portable orchestration adapter for **full qualification** work. The active primary user-session agent is the sole orchestrator. Nested general-purpose subagents are not orchestrators. Specialists return report-only handoffs and never claim lifecycle completion, ask the user, or perform external operations.

Ordinary Small work does **not** load this skill. If this skill cannot be loaded when Material/qualification work requires it, block before mutation. Do not reconstruct a partial process from memory or import a foreign stack default.

## When To Load

Load before the first mutation only when at least one applies:

- the user explicitly requests Change-Ready readiness;
- project policy requires full qualification for this change class;
- concrete Material risk is present: public API/protocol/compatibility semantics, persisted data or migration, security/privacy/authorization, destructive or remote action, concurrency correctness, deployment/release, or a loaded instruction/configuration change that alters lifecycle or safety policy.

Do not load for Ordinary Small work, pure research, ordinary review-only questions, or content edits already proven inert for runtime, loading, routing, protocol, configuration, generation, and user-visible behavior—unless Change-Ready was explicitly requested.

Unknown escalates to Material only when it can materially change accepted behavior or one of the named risk domains above. Missing optional adapters or generic uncertainty alone must not force Material.

## Profile: Ordinary Small | Material

Initially classify as `Ordinary Small` (default) or `Material`. A run may escalate only from Ordinary Small to Material when a named Material trigger appears; never downgrade Material or discard already-required evidence.

Ordinary Small (handled by always-loaded global routing, not this skill body) requires all of:

- clear accepted behavior;
- local reversible scope;
- known focused validation;
- no concrete named high-risk boundary from When To Load.

Material/qualification work uses this skill end-to-end. High-risk behavior must not be downgraded merely because the diff is small.

Profile controls planning and delivery ceremony. Fresh independent SDET is required for Material/explicit qualification behavior changes. SDET `N/A` is allowed only for evidence-backed non-behavioral work on the qualification path.

## Adapter Discovery

Before production or SDET authorship on the qualification path, discover project-native adapters from project instructions, validation configuration, existing automation, schemas, and explicit owner input:

- requirement source;
- production author;
- SDET / testing capability;
- validation procedures;
- candidate capture / Candidate Reference mechanism;
- independent final reviewer;
- delivery / readiness gate;
- external-operation policy;
- native readiness label.

Missing mandatory capability is `unknown` or `blocked`. Never invent a language, package manager, build system, test framework, version-control product, CI/hosting provider, operating system, shell, review product, model, or fixed command. Kit-local workers or tools are optional discovered adapters only, never portable requirements.

## Authoritative Brief

Use the complete shared field schema from the always-loaded Universal Task Briefing Contract in global `AGENTS.md`. Do not copy that schema here. Material/cold handoff is complete; delegated Ordinary Small may keep fields concise and mark irrelevant fields `N/A - <reason>`.

Rules:

- Never delegate a raw user prompt or rely on hidden conversation context.
- Use `N/A - <reason>` for genuinely inapplicable fields; never omit silently.
- Material uses the project's accepted durable specification system when present; otherwise a complete session brief.
- Keep original sources, later owner decisions, and superseded statements traceable.
- Report missing domain expectations as `unknown`; do not invent thresholds.

### Lifecycle field values

Populate every Universal Task Briefing Contract field. Emphasize:

- Role and Objective as end state and value for the receiver.
- Current State and Evidence with labeled observations, assumptions, hypotheses, and recommendations.
- Requirements and Invariants plus independently checkable acceptance criteria and the observable happy path.
- Exact read scope, write scope, and forbidden actions for this role only.
- Resolved Decisions and Rationale including ownership, error model, compatibility, **accepted acceptance criteria**, **project-specific scope lock**, **planned gate waves**, **correction budget**, and **stop line** (record before first candidate mutation).
- Verification as exact project-native procedures already authorized by adapter discovery.
- Return Contract requiring evidence, changed artifacts, procedures/outcomes, blockers, and residual risks.
- Blocker and Escalation Policy distinguishing agent-resolvable unknowns from owner decisions.

## Acceptance scope lock and anti-polishing

### Pre-mutation record

Before the first behavior-changing candidate mutation on the qualification path, record accepted acceptance criteria, project-specific scope lock, planned gate waves, correction budget, and stop line.

### Post-mutation expansion rule

After the first candidate mutation, a new blocking candidate correction or new acceptance criterion requires either:

1. explicit owner approval; or
2. a reproducible P0/P1 defect that affects behavior, CI, security, data integrity, or compatibility.

Missing or failed mandatory lifecycle gate, unsafe concurrent writer ownership/liveness, or unresolved owner decision still blocks Change-Ready, but must not justify speculative product or evidence scope.

### Blocking versus residual

Keep `Required Next Actions` and final-review `changes_requested` binding only for mandatory-gate failures or qualifying P0/P1 serious defects. Route P2/note, coverage-only gaps, optional evidence, and wording polish to Residual Risks or a separately approved follow-up.

### Planned gate waves and replay

Plan one SDET qualification wave, one Final Candidate Review wave, and for Material one delivery/readiness wave. Replay only gates invalidated by a qualifying P0/P1 correction or a failed mandatory gate.

### Role views

- Production author: production write scope only; smallest complete happy path; no automated test artifacts; return changed artifacts, observable proof procedure, blockers, residual risks.
- SDET: fresh context that did not author production; test-only write scope; original requirements and current candidate; optional project-native Candidate Reference; action exactly `authored-tests | assessed-existing-tests | blocked`; independent risk/oracle matrix. Main owns post-test proof/validation.
- Final reviewer: fresh read-only context that authored neither production nor tests; complete current candidate; Applicable Proof; final SDET evidence or evidence-backed SDET `N/A` only for proven non-behavioral work; complete validation; optional Candidate Reference; structured verdict only. This is a qualification gate, not an ordinary completion gate.
- Delivery/readiness reviewer (always for Material; for Ordinary Small only when policy/risk/owner requires): local package and continuity evidence via readable scoped candidate/diff/manifest; no candidate authorship. Missing conforming Material delivery/readiness capability blocks.
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
- Candidate Reference capture and recapture after mutation;
- Applicable Proof execution;
- Project-Native Validation under authorized procedures only;
- failure batching and owner routing;
- Final Candidate Review dispatch;
- local handoff package and Change-Ready Decision.

On the qualification path, the active primary remains orchestrator: it dispatches the configured production author and fresh SDET for Material/explicit qualification work. Main-owned planning notes, integration, validation orchestration, local handoff package text, and task-status checkbox updates remain allowed when they are not candidate production or test content.

Only the active primary orchestrator may create or resume specialist sessions. Leaf production, SDET, review, diagnosis, and delivery specialists must never dispatch or resume nested agents. Real parallelism uses one orchestrator-owned fan-out using the discovered runtime fan-out adapter and is limited to independent isolated or exact non-overlapping scopes proved before dispatch; single specialist dispatches remain serial. Reconcile and integrate every fan-out result before proof or qualification. For every specialist dispatch, record role, ownership scope, and available runtime session/task identity.

Accept specialist dispatch or resume evidence only when the discovered runtime adapter proves active primary parent identity, child session/task identity, and expected child role/context. Top-level/default-primary fallback is not specialist evidence. Unavailable or unverifiable child dispatch or continuation blocks the affected gate. Do not hard-code a concrete runtime mechanism, provider, model, OS, or product name in portable runtime text.

**Universal writer attempt closure (serial or fan-out):** apply only to actual asynchronous or concurrent mutation-capable executions—including every concurrent writer dispatch/attempt and every mutation-capable validation, generator, or formatter command that can race. Such an execution remains open after timeout, cancel, missing report, partial mutation, or unknown liveness until a terminal report is received, adapter-proven terminal cessation is established (cancellation counts only after the writer or execution can no longer execute or mutate), or its workspace/write authority is isolated or revoked so it cannot mutate the candidate. Recorded timeout, cancel, or missing report alone is not closure. Cancellation request or acknowledgement alone is not closure. Unknown liveness or unisolated ownership blocks integration, freeze, proof, and qualification. Late output or late mutation after the attempt boundary invalidates the qualification attempt and does not close a still-live mutator. Prefer isolated workspaces for mutation-capable validation. Ordinary synchronous direct edits do not require this full liveness protocol.

If any fan-out child or concurrent writer attempt blocks, times out, is cancelled, returns a missing report, or leaves a partial mutation, do not freeze, prove, or qualify. Apply **Universal writer attempt closure** to every open concurrent attempt: record each slice/attempt state and identity, recapture attributable mutations, quarantine unsafe ownership, integrate only after every result is accounted for, and route retry, resume, or fresh dispatch by continuity rules without erasing prior failure—only after the open attempt is closed or isolated. Do not invent a coordinator or durable orchestration state store.

No production or test mutation runs during qualification of a frozen candidate. Specialists do not delegate, ask the user, expand validation authority, or declare readiness.

## Lifecycle transitions

### 1. Classify and prepare

Restate requirements, constraints, non-goals, invariants, happy path, and validation boundary. Classify Material when a When To Load trigger applies. Discover adapters. Build the complete cold-context Authoritative Brief. Record profile, complete brief, and adapter discovery before any behavior-changing candidate mutation.

### 2. Production path or test-only N/A

Production work: dispatch the configured production author for the smallest complete happy path only. No test, fixture, snapshot, fake, simulator, harness, or golden artifact edits by production. Main-owned planning notes, integration, validation orchestration, local handoff text, and task-status checkbox updates remain orchestrator-owned when they are not candidate production or test content.

Test-only work: production dispatch is evidence-backed `N/A` with baseline/current-boundary proof; fresh SDET is the sole content author. Exact co-located test blocks/content only; unsafe attribution blocks.

### 3. Candidate Reference

After production path completion and before Applicable Proof or Fresh SDET dispatch, the orchestrator closes every concurrent mutation-capable production writer under **Universal writer attempt closure** when concurrent writers ran, integrates production outputs, and captures a project-native **Candidate Reference**: readable scoped candidate evidence such as a diff, snapshot, manifest, revision, or equivalent. Exclude secrets and unrelated workspace content.

Missing readable Candidate Reference blocks qualification when the project cannot otherwise identify the scoped candidate. Dual `Semantic Candidate Identity` / `Package Identity` / `Identity Recipe` are not portable requirements.

Any mutation invalidates and abandons the current qualification attempt and affected evidence. After test edits, recapture Candidate Reference before post-test proof and complete validation.

### 4. Applicable Proof

After Candidate Reference capture and before Fresh SDET dispatch, the orchestrator executes current applicable proof:

- production work: observable happy-path proof at the relevant boundary (inspection, compilation alone, or mocked-helper-only claims are insufficient);
- test-only work: production-dispatch `N/A` rationale plus baseline/current-boundary proof.

Retain exact blockers when proof cannot run. Early implementation feedback is never final review.

### 5. Fresh SDET

Every Material/explicit qualification behavior change gets a fresh SDET context that did not author production. Provide Authoritative Brief, original sources, current scoped candidate, current tests, project testing guidance, Applicable Proof, exact test-only scope, authorized validation descriptions, and optional Candidate Reference.

Prefer a distinct effective SDET model when available. Same effective model remains allowed; then record residual same-model correlation risk.

SDET independently builds a realistic risk and observable-oracle matrix and selects cases representatively from high-impact risks. Coverage percentage, test count, opaque snapshot growth, retry-until-green, exhaustive Cartesian expansion by default, and mock-interaction-only assertions do not establish acceptance. Prefer real boundaries; record justified simulation/mock exceptions as confidence gaps.

SDET returns exactly one report with action `authored-tests | assessed-existing-tests | blocked`, risk/oracle matrix, test changes or existing-test evidence, required validation procedures, residual risks, blockers, and optional Candidate Reference. The orchestrator inspects write scope. Out-of-scope mutation blocks progression. Main owns post-test Applicable Proof and complete validation after authored-tests.

### 6. Project-Native Validation

Record each exact authorized procedure and its trusted source before execution. Agent suggestions do not expand authority. Execute complete applicable validation against the current candidate. After any procedure that may mutate artifacts, recapture the Candidate Reference. Candidate correction requires a new fresh SDET assessment.

### 7. Correction routing and replay

| Failure | Owner |
| --- | --- |
| Qualifying product/build defect (P0/P1 serious or mandatory-gate) | Production author; preserve reproducer |
| Qualifying test, fixture, simulator, harness, snapshot, or oracle defect | Fresh SDET |
| Missing high-impact risk oracle for an accepted serious risk | Fresh SDET |
| P2/note, coverage-only, optional evidence, wording polish | Residual Risks or separately approved follow-up |
| Unknown cause or ownership | Orchestrator diagnosis or block |
| Validation authority/environment | Orchestrator or evidence owner |
| Final-review qualifying production finding | Production author |
| Final-review qualifying test finding | Fresh SDET |
| Handoff-package text only | Orchestrator / package author |

When a production defect belongs to the same recorded production author and role, objective, ownership scope, and continuity remain safe, resume that same production-author context using the discovered runtime continuation adapter. The continuation brief must include the new reproducer/outcome, Candidate Reference or reviewable diff, explicit objective text continuous with the original production objective, explicit brief delta, unchanged forbidden actions, and return contract—not chat-memory-only handoff.

When session identity is unavailable, continuity is unknown, role, objective, or ownership changes, scope materially expands, or independence requires freshness, dispatch a new conforming production author with a complete cold-context brief or block.

Corrected-candidate SDET is always a new fresh context. Final review remains fresh and read-only. Production-author continuation does not preserve Applicable Proof, SDET, validation, or final-review evidence; replay all affected gates on the corrected candidate.

Any qualifying production or test correction invalidates affected Applicable Proof, SDET, validation, specialist review, and final review. Replay only those affected downstream gates.

Unexplained fail/pass on an unchanged candidate remains blocked. Stop with `Change-Ready: no` when the same failure repeats without new root-cause evidence, a mandatory adapter is unavailable, concurrent workspace ownership is unsafe, an owner decision remains unresolved, or the predeclared correction budget is exhausted while a serious or mandatory blocker remains.

### 8. Final Candidate Review

Begin only after accepted final SDET evidence (or evidence-backed SDET `N/A` only for proven non-behavioral work; behavior-changing or test-content work cannot use `N/A`) and complete applicable validation. Dispatch a fresh read-only final reviewer that authored neither production nor tests. Map native verdicts to `approved | approved_with_notes | changes_requested | blocked`. Actionable notes that request a candidate change for a qualifying P0/P1 or mandatory-gate failure do not pass. P2/note polish alone must not produce `changes_requested`. No conforming reviewer means blocked.

Before any reviewer dispatch, verify every candidate and evidence input is directly readable under the reviewer's effective permissions. External path references alone are insufficient. Supply a privacy-safe inline or attached evidence bundle: Candidate Reference or reviewable diff/content for every scoped artifact, runtime event excerpts when used as proof, final SDET report, and validation outcomes. Missing readability blocks before dispatch.

Require a structured report: exact verdict enum, optional Candidate Reference for the candidate assessed, ordered evidence-backed findings with `Evidence Type`, `Likely Root Cause`, `Artifact Owner`, `Recommendation`, `Confidence`, and `Needs external reviewer`, plus blockers, residual risks, and actionable continuation items—not a bare verdict.

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

Material work always supplies current task/evidence status to the discovered conforming delivery/readiness gate; missing conforming capability blocks. Ordinary Small uses proportional evidence and invokes that gate only when policy, risk, or owner requires it. Every `Change-Ready: no`, delivery `Verdict: material deviations`, an evidence-insufficient delivery verdict, `Blocking for Acceptance: yes`, `Verdict: blocked`, qualifying P0/P1 serious blocker, mandatory-gate failure, or non-empty Required Next Actions (restricted to those blocker classes) is binding and keeps readiness blocked. P2/note and optional polish must not appear in Required Next Actions.

Local package contents: context; requirements; scope; non-goals; main changes; Applicable Proof; SDET/testing evidence; validation; review results; risks and proportional rollback notes when relevant; review focus; changed-artifact scope; baseline/candidate assumptions; residual blockers; `External Operations: not performed`.

Projects may render `PR-Ready`, `MR-Ready`, `Ready To Land`, or another native label. Publication, upload, remote review creation/update, integration, deployment, release, and archive require separate explicit authority and are not part of Change-Ready.

### Rollback plan

Rollback planning is proportional. Detailed rollback evidence is required when migration, destructive state, deployment/activation, or substantial multi-surface risk makes it relevant. Rollback is executed only when separately authorized and is never required to claim Change-Ready. Preserve unrelated, pre-existing, or teammate work outside the candidate scope. Runtime activation rollback (restore prior active config pointer and restart/reload without mutating the repository candidate) is a separate operational action and does not count as full change rollback of the repository candidate.

### Restart and continuity

After restart, compaction, cancellation, or context loss, reconstruct brief, Candidate Reference, role identities, validation, and correction evidence from authoritative project/session sources. Anything unproved is stale and blocks Change-Ready. Continuity uncertainty never resets prior failures.

## Compact orchestration output

Return a compact record:

- `Profile`: Ordinary Small | Material
- `Stage / evidence`: current stage and what is proved
- `Candidate Reference`: project-native readable scoped candidate evidence, or none when not applicable
- `Gates`: Applicable Proof, SDET action or N/A, validation, final review
- `Delivery/readiness gate`: accepted, blocked, or `N/A - Ordinary Small <reason>`
- `Corrections`: owner routes and replays, or none
- `Change-Ready`: yes | no
- `Native label`: project label if any, else none
- `External Operations`: not performed (unless separately authorized and recorded)
- `Blockers / residual risks`: exact items or none

## Enforcement honesty

These are process controls for instruction-only runtime: conditional pre-mutation load for Material/qualification work, one complete orchestration skill, mutually exclusive roles when SDET/final review is invoked, exact briefs and reports, main-session candidate inspection, and binding independent review. They are not an OS sandbox, dynamic path ACL, durable run database, or cryptographic guarantee of model compliance.
