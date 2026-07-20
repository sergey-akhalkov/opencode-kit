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
- Resolved Decisions and Rationale including ownership, error model, compatibility, **frozen acceptance criterion IDs**, **task IDs**, **project-specific scope lock** (write roots, exact allowed additions, forbidden artifacts), **mandatory gate IDs/procedures/baselines**, **one initial fresh SDET**, **one correction wave**, **at most one fresh corrected-candidate SDET**, **one final review**, **one delivery review**, and **stop line** (record before first candidate mutation).
- Verification as exact project-native procedures already authorized by adapter discovery.
- Return Contract requiring evidence, changed artifacts, procedures/outcomes, blockers, and residual risks.
- Blocker and Escalation Policy distinguishing agent-resolvable unknowns from owner decisions.

## Closed-world scope firewall

### Pre-mutation scope capsule

Before the first behavior-changing candidate mutation on the qualification path, freeze a readable project-native scope capsule with: primary outcome; frozen acceptance criterion IDs and exact observable statements; frozen task IDs; allowed write roots and exact allowed additions; forbidden artifacts and non-goals; mandatory gate IDs, exact procedures, trusted sources, and baseline outcomes; one initial fresh SDET; one correction wave; at most one fresh corrected-candidate SDET when that correction is consumed; one final review; one delivery review for Material; and the stop line. Project-specific scope lock is this capsule. After freeze, checkbox/status and evidence-reference updates are allowed; new criterion, task, gate, path, or evidence-tool IDs are not part of the current revision.

### Post-freeze closed world

After the first candidate mutation, post-freeze scope may only shrink. Only explicit owner approval from the user may expand scope, and expansion creates a new revision or separate change with a new scope capsule and invalidated prior qualification evidence. Reviewers, SDET, validation, delivery gates, severity labels, P0/P1 findings, mandatory-gate failures, unknowns, and missing capabilities may bind readiness and require `Change-Ready: no` but never authorize scope expansion, mutation, task addition, new acceptance criteria, new gates, new write paths, artifacts, or persistent evidence infrastructure.

### Correction eligibility (four predicates)

A current-change correction is eligible only when all are evidenced:

1. The finding references a frozen acceptance criterion ID.
2. A concrete reproducer demonstrates the violation on the current candidate.
3. Baseline-versus-candidate evidence shows the candidate introduced, worsened, or newly reached the violation.
4. The complete minimal correction remains inside frozen write roots and exact allowed artifacts, introduces no persistent evidence infrastructure, and the single correction wave remains unused.

If any predicate is false or unknown, the finding may reject readiness via `Blocking Evidence` but cannot authorize current-change work. Pre-existing baseline debt remains baseline-attributed unless frozen scope made its removal the primary outcome. Mandatory gates are current-change authority only when frozen with trusted source and baseline outcome; baseline failures and later-discovered gates cannot authorize cleanup.

### Unknown and external blockers

After freeze, an unknown may receive bounded read-only investigation, then residual risk, an evidence-backed in-scope defect, or a terminal external blocker. Unknown never becomes implementation authority by itself. Out-of-scope P0/P1 findings remain stop-ship evidence: report `Change-Ready: no` and route an owner decision or separate prerequisite/follow-up change; do not fix inside the frozen change.

### Persistent evidence infrastructure

A new reusable harness, validator framework, benchmark system, simulator, ledger, generator, cross-repository runner, or equivalent persistent artifact introduced solely to prove the current candidate requires a separate prerequisite change. The current change may use existing validation, an already frozen focused regression-test path, a bounded manual procedure, or ephemeral output.

### Blocking versus residual

Reviewer and SDET outputs use `Blocking Evidence` for readiness-rejecting facts and non-authorizing `Follow-up Candidates` for separate revision/change/investigation proposals. No superseded action-list or current-task authoring fields. `Follow-up Candidates` never authorize current-candidate work. Route P2/note, coverage-only gaps, optional evidence, and wording polish to Residual Risks or non-authorizing `Follow-up Candidates`.

### Finite qualification waves

Plan one initial fresh SDET, zero or one eligible correction wave, at most one fresh corrected-candidate SDET inside that wave, one Final Candidate Review, and for Material one delivery/readiness wave. The corrected-candidate SDET never authorizes a second correction. A second serious failure after the correction wave terminates the attempt. Final and delivery review are accept-or-reject gates and never initiate autonomous correction or replay.

### Role views

- Production author: production write scope only; smallest complete happy path; no automated test artifacts; return changed artifacts, observable proof procedure, blockers, residual risks.
- SDET: fresh context that did not author production; test-only write scope; original requirements and current candidate; optional project-native Candidate Reference; action exactly `authored-tests | assessed-existing-tests | blocked`; independent risk/oracle matrix; `Blocking Evidence` and non-authorizing `Follow-up Candidates` only. Main owns post-test proof/validation.
- Final reviewer: fresh read-only context that authored neither production nor tests; complete current candidate; Applicable Proof; final SDET evidence or evidence-backed SDET `N/A` only for proven non-behavioral work; complete validation; optional Candidate Reference; structured verdict `approved | approved_with_notes | rejected | blocked` only. Rejection terminates. This is a qualification gate, not an ordinary completion gate.
- Delivery/readiness reviewer (always for Material; for Ordinary Small only when policy/risk/owner requires): local package and continuity evidence via readable scoped candidate/diff/manifest; no candidate authorship; `Blocking Evidence` and non-authorizing `Follow-up Candidates` only. Negative outcomes are terminal. Missing conforming Material delivery/readiness capability blocks.
- Diagnosis specialist: cause analysis only; route eligible in-scope production fixes to production author and test fixes to fresh SDET under correction eligibility; otherwise report terminal blocker.

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

SDET independently builds a realistic risk and observable-oracle matrix and selects cases representatively from high-impact risks reachable inside the accepted enforced operating envelope. Coverage percentage, test count, opaque snapshot growth, retry-until-green, exhaustive Cartesian expansion by default, and mock-interaction-only assertions do not establish acceptance. Prefer real boundaries; record justified simulation/mock exceptions as confidence gaps. Unreachable future-scale risks stay residual.

SDET returns exactly one report with action `authored-tests | assessed-existing-tests | blocked`, risk/oracle matrix, test changes or existing-test evidence, required validation procedures, residual risks, blockers, and optional Candidate Reference. The orchestrator inspects write scope. Out-of-scope mutation blocks progression. Main owns post-test Applicable Proof and complete validation after authored-tests.

### 6. Project-Native Validation

Record each exact authorized procedure and its trusted source before execution. Agent suggestions do not expand authority. Execute complete applicable validation against the current candidate. After any procedure that may mutate artifacts, recapture the Candidate Reference. Candidate correction requires a new fresh SDET assessment.

### 7. Correction routing and replay

| Failure | Owner |
| --- | --- |
| Eligible candidate-attributable frozen-criterion product/build defect | Production author inside frozen scope; preserve reproducer; consumes the single correction wave |
| Eligible candidate-attributable frozen-criterion test/fixture/simulator/harness/snapshot/oracle defect | Fresh SDET inside frozen test scope; consumes the single correction wave when it is the correction |
| Missing high-impact risk oracle for a frozen accepted serious risk fully correctable in frozen test scope | Fresh SDET; only while correction wave unused and predicates hold |
| Out-of-scope P0/P1, baseline debt, missing capability, or incomplete correction fit | `Blocking Evidence`; `Change-Ready: no`; owner decision or separate change — never current mutation |
| P2/note, coverage-only, optional evidence, wording polish | Residual Risks or non-authorizing `Follow-up Candidates` |
| Unknown cause or ownership | Bounded read-only investigation, residual risk, or terminal external blocker — never implementation authority alone |
| Validation authority/environment | Orchestrator or evidence owner; missing mandatory capability blocks without expanding scope |
| Final-review or delivery rejection | Terminal for current attempt; new revision/separate change requires explicit owner decision |
| Handoff-package text only | Orchestrator / package author |

A current correction may run only when correction eligibility holds and the single correction wave is unused. When a production defect belongs to the same recorded production author and role, objective, ownership scope, and continuity remain safe, resume that same production-author context using the discovered runtime continuation adapter. The continuation brief must include the new reproducer/outcome, Candidate Reference or reviewable diff, explicit objective text continuous with the original production objective, explicit brief delta, unchanged forbidden actions, and return contract—not chat-memory-only handoff.

When session identity is unavailable, continuity is unknown, role, objective, or ownership changes, scope materially expands, or independence requires freshness, dispatch a new conforming production author with a complete cold-context brief or block.

Corrected-candidate SDET is always a new fresh context and is part of the single correction wave. Final review remains fresh and read-only. Production-author continuation does not preserve Applicable Proof, SDET, validation, or final-review evidence; replay all affected gates on the corrected candidate exactly once inside that wave.

Any eligible production or test correction invalidates affected Applicable Proof, SDET, validation, specialist review, and final review. Replay only those affected downstream frozen gates. A second serious failure after the correction wave, or any serious finding from corrected-candidate SDET, terminates the attempt.

Unexplained fail/pass on an unchanged candidate remains blocked. Stop with `Change-Ready: no` when the same failure repeats without new root-cause evidence, a mandatory adapter is unavailable, concurrent workspace ownership is unsafe, an owner decision remains unresolved, correction eligibility fails, the single correction wave is exhausted while a serious or mandatory blocker remains, or final/delivery rejection occurs.

### 8. Final Candidate Review

Begin only after accepted final SDET evidence (or evidence-backed SDET `N/A` only for proven non-behavioral work; behavior-changing or test-content work cannot use `N/A`) and complete applicable validation. Dispatch a fresh read-only final reviewer that authored neither production nor tests. Map native verdicts to `approved | approved_with_notes | rejected | blocked`. Final review is accept-or-reject only: `rejected` or `blocked` terminates the qualification attempt and never authorizes autonomous correction or replay. P2/note polish alone must not produce `rejected`. No conforming reviewer means blocked.

Before any reviewer dispatch, verify every candidate and evidence input is directly readable under the reviewer's effective permissions. External path references alone are insufficient. Supply a privacy-safe inline or attached evidence bundle: Candidate Reference or reviewable diff/content for every scoped artifact, runtime event excerpts when used as proof, final SDET report, and validation outcomes. Missing readability blocks before dispatch.

Require a structured report: exact verdict enum, optional Candidate Reference for the candidate assessed, ordered evidence-backed findings with `Evidence Type`, `Likely Root Cause`, `Artifact Owner`, `Recommendation`, `Confidence`, and `Needs external reviewer`, plus blockers, residual risks, `Blocking Evidence`, and non-authorizing `Follow-up Candidates`—not a bare verdict and not an action list.

### 9. Change-Ready Decision

Report `Change-Ready: yes` only when the same current candidate has:

- accepted frozen requirements;
- Applicable Proof;
- SDET final evidence or evidence-backed `N/A` (N/A only for proven non-behavioral work);
- complete project/owner validation pass;
- accepted Final Candidate Review (`approved` or `approved_with_notes`);
- for Material work, an explicitly accepted conforming delivery result;
- scoped candidate ownership with no unsafe overlap;
- no binding `Blocking Evidence`;
- complete local change-handoff package.

Material work always supplies current task/evidence status to the discovered conforming delivery/readiness gate; missing conforming capability blocks. Ordinary Small uses proportional evidence and invokes that gate only when policy, risk, or owner requires it. Delivery accepted mapping retains diagnostic verdict names: `on plan` or `minor deviations` only with `Change-Ready: yes` and `Blocking for Acceptance: no`. Every `Change-Ready: no`, delivery `Verdict: material deviations`, an evidence-insufficient delivery verdict, `Blocking for Acceptance: yes`, `Verdict: blocked`, final `rejected`/`blocked`, mandatory-gate failure, or non-empty `Blocking Evidence` is binding readiness rejection, is terminal for the current attempt, and never authorize scope expansion. P2/note and optional polish route only to Residual Risks or non-authorizing `Follow-up Candidates`.

Local package contents: context; requirements; scope; non-goals; main changes; Applicable Proof; SDET/testing evidence; validation; review results; risks and proportional rollback notes when relevant; review focus; changed-artifact scope; baseline/candidate assumptions; residual blockers; `External Operations: not performed`.

Projects may render `PR-Ready`, `MR-Ready`, `Ready To Land`, or another native label. Publication, upload, remote review creation/update, integration, deployment, release, and archive require separate explicit authority and are not part of Change-Ready.

### 10. Pilot-Ready Decision

`Pilot-Ready: yes | no | not requested` is a main-session limited-use disposition. It is not a third lifecycle profile and does not replace `Ordinary Small | Material` or Change-Ready. The complete Pilot safety floor is authoritative only in always-loaded global `AGENTS.md` and applies on the qualification path; this skill does not restate that floor.

`Pilot-Ready: yes` may coexist with `Change-Ready: no` or `not requested` only when the Change-Ready blocker is outside the pilot envelope and does not undermine candidate identity/scope, proof, containment, safety floor, validation, or material-risk acceptance. Final/delivery rejection stays terminal for Change-Ready and never authorizes mutation/replay; it does not automatically erase independently proven Pilot-Ready evidence unless pilot facts become unreadable or untrustworthy. Neither disposition authorizes deployment, release, installation, activation, credentials, or remote-state mutation.

### Rollback plan

Rollback planning is proportional. Detailed rollback evidence is required when migration, destructive state, deployment/activation, or substantial multi-surface risk makes it relevant. Rollback is executed only when separately authorized and is never required to claim Change-Ready. Preserve unrelated, pre-existing, or teammate work outside the candidate scope. Runtime activation rollback (prior active config pointer + restart/reload without repository mutation) is separate and does not count as full change rollback.

### Restart and continuity

After restart, compaction, cancellation, or context loss, reconstruct brief, Candidate Reference, role identities, validation, and correction evidence from authoritative sources. Unproved items are stale and block Change-Ready. Continuity uncertainty never resets prior failures.

## Compact orchestration output

Return a compact record:

- `Profile`: Ordinary Small | Material
- `Stage / evidence`: current stage and what is proved
- `Candidate Reference`: project-native readable scoped candidate evidence, or none when not applicable
- `Gates`: Applicable Proof, SDET action or N/A, validation, final review
- `Delivery/readiness gate`: accepted, blocked, or `N/A - Ordinary Small <reason>`
- `Corrections`: owner routes and replays, or none
- `Pilot-Ready`: yes | no | not requested
- `Change-Ready`: yes | no | not requested
- `Native label`: project label if any, else none
- `External Operations`: not performed (unless separately authorized and recorded)
- `Blockers / residual risks`: exact items or none; include technically enforced pilot envelope limits when Pilot-Ready is yes

## Enforcement honesty

These are process controls for instruction-only runtime: conditional pre-mutation load, one orchestration skill, mutually exclusive roles when SDET/final review is invoked, exact briefs/reports, main-session candidate inspection, and binding independent review. Not an OS sandbox, path ACL, durable run DB, or cryptographic guarantee.
