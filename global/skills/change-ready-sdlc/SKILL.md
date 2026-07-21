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
- Resolved Decisions and Rationale: ownership, error model, compatibility, **accepted outcome** capsule (envelope, non-goals, invariants, protected boundaries), adaptable task/path inventory, mandatory gates/baselines, **one initial fresh SDET**, **one correction wave**, at most one fresh corrected-candidate SDET, one final review, one delivery review when required, attempt stop line, and root **working-result stop budget** used/remaining (canonical non-reset in global AGENTS).
- Verification as authorized project-native procedures; Return Contract with evidence/artifacts/blockers/residual risks plus stop-budget status; Blocker policy: agent-resolvable vs owner.

## Outcome authority and qualification attempts

### Capsule and dependency closure

Before first behavior-changing mutation, freeze the project-specific scope lock as the outcome authority capsule: accepted outcome; envelope; non-goals; non-deferrable invariants; proof intent; protected boundaries; unresolved owner decisions; mandatory gates (IDs, procedures, trusted sources, baselines); one initial fresh SDET; one correction wave; at most one fresh corrected-candidate SDET when consumed; one final review; Material delivery review; attempt stop line; root working-result stop budget used/remaining. Tasks/paths/artifacts are mutable footprint under that capsule. Checkbox/status/evidence-reference updates allowed.

Scope expansion (changed accepted outcome, out-of-envelope behavior, weakened invariant, protected-boundary crossing) needs explicit owner approval. Main MAY add/change task, local path, artifact, check, or action only as the smallest sufficient dependency closure: necessary for accepted outcome/invariant, local, reversible, no protected boundary, unrelated work preserved. Record traceability, update brief, invalidate affected evidence. Optional cleanup/tooling/hardening stays residual. Findings may bind `Change-Ready: no` but never authorize mutation; main routes dependency closure, residual disposition, or exact owner blocker.

### Working result and root stop budget

Canonical floor, two-cycle post-green budget, cycle start/slot/in-flight closure, progress gate, residual polish classes, exhaustion handoff, and mandatory-gate honesty live only in always-loaded global `AGENTS.md` (Working result and root stop budget). This skill applies them and owns qualification mechanics only: record used/remaining budget and open-cycle state in brief/handoff/capsule/output; in-attempt **one correction wave** remains and the root budget is an additional stricter cross-attempt cap; starting a new post-green cycle needs remaining capacity + concrete current consequence; open-cycle attributable fixes to restore green do not consume another root slot.

### Correction eligibility (in-attempt)

Eligible only when all hold: (1) accepted outcome or non-deferrable invariant ref; (2) concrete candidate reproducer; (3) candidate-vs-baseline attribution; (4) authorized local reversible dependency closure without persistent evidence infrastructure and unused single correction wave; (5) if the working-result floor was already reached and no post-green cycle is open, remaining root stop-budget capacity and a concrete current consequence; if a post-green cycle is already open, only the global AGENTS in-flight progress gate (new root-cause evidence + narrowing bounded repair)—no extra root slot. Else `Blocking Evidence` rejects readiness without authorizing mutation. Baseline debt stays baseline unless its removal is the accepted outcome. Unrelated later gates cannot authorize cleanup.

### Unknowns, evidence infra, debt, waves

Unknown → bounded read-only investigation, residual, authorized defect, or exact blocker—never solo implementation authority. Protected-boundary needs: `Change-Ready: no`, preserve evidence, request exact owner authority. New reusable harness/validator/simulator/ledger/generator solely to qualify the candidate needs a separate prerequisite unless it independently meets dependency-closure for the product outcome.

Reviewer/SDET: `Blocking Evidence` + non-authorizing `Follow-up Candidates` only (no action lists). Main classes: outcome blocker; non-deferrable blocker (never debt, including at budget stop); contained material limitation (post-proof acceptance before `Pilot-Ready: yes`); deferrable technical debt (batch after working proof; never a post-green new attempt). P2/note → Residual Risks or `Follow-up Candidates`.

Plan one initial fresh SDET, zero or one eligible correction wave, at most one fresh corrected-candidate SDET in that wave, one Final Candidate Review, Material delivery wave. Second serious failure after the correction wave, or final/delivery rejection, ends only that attempt with `Change-Ready: no`. It does not automatically end the unfinished root goal, require internal-revision approval, or bar read-only diagnosis—and does not automatically authorize another attempt. Final/delivery never authorize mutation of that attempt.

### Role views

- Production: production scope; happy path; no test artifacts; return artifacts, proof procedure, blockers, residual risks.
- SDET: fresh, test-only; action `authored-tests | assessed-existing-tests | blocked`; independent risk/oracle matrix; `Blocking Evidence` / non-authorizing `Follow-up Candidates`. Main owns post-test proof/validation.
- Final: fresh read-only; complete candidate + proof + final SDET (or evidence-backed `N/A` for proven non-behavioral only) + validation; verdict `approved | approved_with_notes | rejected | blocked`. Rejection ends inspected attempt only.
- Delivery (Material always; Ordinary Small if required): package/continuity evidence only; negative outcomes terminal for inspected attempt; missing conforming capability blocks.
- Diagnosis: cause only; route authorized repairs to production/SDET; else exact blocker for main.

### Cold-context dispatch gate

Before dispatch, a cold receiver must know required result, why, what may change, proof, and return. Else repair the brief.

## Orchestrator ownership

Active primary owns: Authoritative Brief; profile/tasks; Adapter Discovery; specialist dispatch/freshness; serial writers unless isolated or exact non-overlapping; integration; Candidate Reference capture/recapture; Applicable Proof; authorized Project-Native Validation; failure routing; Final Candidate Review; local handoff; Change-Ready Decision. On qualification, main dispatches production author and fresh SDET; main-owned notes/integration/validation orchestration/handoff/checkboxes allowed when not candidate production/test content.

Only the active primary may create or resume specialist sessions. Leaves never nest agents. Parallelism is one orchestrator-owned fan-out of independent isolated or exact non-overlapping scopes; single dispatches stay serial. Record role, ownership, runtime session/task identity. Accept dispatch/resume only with active primary parent identity, child session/task identity, and expected child role/context. Top-level/default-primary fallback is not specialist evidence. Unavailable or unverifiable child blocks the gate.

**Universal writer attempt closure (serial or fan-out):** apply only to actual asynchronous or concurrent mutation-capable executions—including concurrent writer dispatch/attempt and mutation-capable validation that can race. Such an execution remains open after timeout, cancel, missing report, partial mutation, or unknown liveness until a terminal report is received, adapter-proven terminal cessation is established (cancellation counts only after the writer/execution can no longer execute or mutate), or its workspace/write authority is isolated or revoked so it cannot mutate the candidate. Recorded timeout, cancel, or missing report alone is not closure. Cancellation request or acknowledgement alone is not closure. Unknown liveness or unisolated ownership blocks integration, freeze, proof, and qualification. Late output or late mutation after the attempt boundary invalidates the qualification attempt and does not close a still-live mutator. Prefer isolated workspaces for mutation-capable validation. Ordinary synchronous direct edits do not require this full liveness protocol. If any concurrent attempt blocks, times out, is cancelled, returns a missing report, or leaves a partial mutation, do not freeze, prove, or qualify—close/isolate first. No production/test mutation during frozen-candidate qualification. Specialists do not ask the user, expand validation, or declare readiness.

## Lifecycle transitions

### 1. Classify and prepare

Restate requirements, constraints, non-goals, invariants, happy path, and validation boundary. Classify Material when a When To Load trigger applies. Discover adapters. Build the complete cold-context Authoritative Brief. Record profile, complete brief, and adapter discovery before any behavior-changing candidate mutation.

### 2. Production path or test-only N/A

Production work: dispatch the configured production author for the smallest complete happy path only. No test, fixture, snapshot, fake, simulator, harness, or golden artifact edits by production. Main-owned planning notes, integration, validation orchestration, local handoff text, and task-status checkbox updates remain orchestrator-owned when they are not candidate production or test content.

Test-only work: production dispatch is evidence-backed `N/A` with baseline/current-boundary proof; fresh SDET is the sole content author. Exact co-located test blocks/content only; unsafe attribution blocks.

### 3. Candidate Reference

After production path completion and before Applicable Proof or Fresh SDET dispatch, the orchestrator closes every concurrent mutation-capable production writer under **Universal writer attempt closure** when concurrent writers ran, integrates production outputs, and captures a project-native **Candidate Reference**: readable scoped candidate evidence such as a diff, snapshot, manifest, revision, or equivalent. Exclude secrets and unrelated workspace content. Missing readable Candidate Reference blocks qualification when the project cannot otherwise identify the scoped candidate. Dual `Semantic Candidate Identity` / `Package Identity` / `Identity Recipe` are not portable requirements. Any mutation invalidates the current attempt and affected evidence. After test edits, recapture Candidate Reference before post-test proof and complete validation.

### 4. Applicable Proof

After Candidate Reference capture and before Fresh SDET dispatch, the orchestrator executes current applicable proof: production work needs observable happy-path proof at the relevant boundary (inspection, compilation alone, or mocked-helper-only claims are insufficient); test-only work needs production-dispatch `N/A` rationale plus baseline/current-boundary proof. Record exact blockers if proof cannot run. Early implementation feedback is never final review.

### 5. Fresh SDET

Every Material/explicit qualification behavior change gets a fresh SDET that did not author production. Inputs: Authoritative Brief, sources, candidate, tests, guidance, Applicable Proof, test-only scope, authorized validation, optional Candidate Reference. Prefer a distinct SDET model when available; same model → record correlation residual. SDET builds an independent risk/oracle matrix for high-impact risks inside the accepted enforced envelope—not coverage %, count, snapshots, retry-until-green, or mock-only assertions. Prefer real boundaries; record mock exceptions. Action exactly `authored-tests | assessed-existing-tests | blocked`. Main owns post-test proof/validation; out-of-scope mutation blocks.

### 6. Project-Native Validation

Record each authorized procedure and trusted source before run. Agent suggestions do not expand authority. Run complete applicable validation; recapture Candidate Reference after any mutating procedure. Candidate correction needs a new fresh SDET.

### 7. Correction routing and replay

| Failure | Owner |
| --- | --- |
| Eligible outcome/invariant product defect | Production via dependency closure; preserves reproducer; uses the single correction wave |
| Eligible test/fixture/oracle defect | Fresh SDET; uses the correction wave when it is the correction |
| Missing high-impact oracle for accepted risk, fully fixable in test scope | Fresh SDET while wave unused and predicates hold |
| Protected-boundary, baseline debt, missing capability, incomplete fit | `Blocking Evidence`; `Change-Ready: no`; exact owner/prerequisite—never unauthorized mutation |
| P2/note, optional evidence polish | Residual Risks or non-authorizing `Follow-up Candidates` |
| Unknown cause/ownership | Read-only investigation, residual, or exact blocker—not implementation authority alone |
| Validation env/authority | Orchestrator; missing mandatory capability → exact capability handoff |
| Final/delivery rejection | Terminal for inspected attempt; new candidate only under global AGENTS root stop budget |
| Handoff package text only | Orchestrator |
| Post-green polish without current defect | Residual per global AGENTS—never a new candidate attempt |

In-attempt correction only when eligibility holds and the correction wave is unused. When role/objective/ownership/continuity hold, resume that same production-author context using the discovered runtime continuation adapter; brief needs reproducer, Candidate Reference/diff, explicit objective text continuous with the original, explicit brief delta, unchanged forbidden actions, return contract, and current root stop-budget status. Else fresh cold production author or block. Corrected-candidate SDET is always a new fresh context and part of the single correction wave. Final review remains fresh and read-only. Production-author continuation does not preserve Applicable Proof, SDET, validation, or final-review evidence; replay affected gates once in that wave. Second serious failure after the correction wave ends the attempt with `Change-Ready: no`.

After attempt closure, bounded read-only diagnosis. Start a new post-green cycle without user approval only when: authorized local reversible repair; concrete current accepted-outcome or non-deferrable defect (not polish); root stop budget has a free slot if floor already reached and no cycle is open. An open cycle stays open through attributable failed-replay repairs under the progress gate until green or abandoned; those fixes do not start or consume another root slot. Needs new root-cause evidence plus repair, narrower useful envelope, or environment/evidence fix unblocking a current defect. Never retry an unchanged candidate until green. Never ask the user solely to approve an internal revision, correction counter, continuation, or stop-budget extension. Unexplained fail/pass on an unchanged candidate stays blocked. Attempt exhaustion is not the root-cause story. Exhaustion blocks a new cycle only; open-cycle stop or ineligible rejection: global AGENTS stop-line handoff with decision-ready options when a real user decision exists.

### 8. Final Candidate Review

After accepted final SDET (or evidence-backed `N/A` only for proven non-behavioral work) and complete validation, dispatch a fresh read-only final reviewer. Map to `approved | approved_with_notes | rejected | blocked`. Accept-or-reject only: `rejected`/`blocked` ends the qualification attempt—no autonomous correction/replay of that attempt. Post-closure routing only inside root stop budget (global AGENTS). P2/note alone must not `rejected`. No conforming reviewer → blocked.

Before any reviewer dispatch, verify every candidate and evidence input is directly readable under the reviewer's effective permissions. External path references alone are insufficient. Supply a privacy-safe inline or attached evidence bundle: Candidate Reference or reviewable diff/content for every scoped artifact, runtime event excerpts when used as proof, final SDET report, and validation outcomes. Missing readability blocks before dispatch.

Require a structured report: exact verdict enum, optional Candidate Reference for the candidate assessed, ordered evidence-backed findings with `Evidence Type`, `Likely Root Cause`, `Artifact Owner`, `Recommendation`, `Confidence`, and `Needs external reviewer`, plus blockers, residual risks, `Blocking Evidence`, and non-authorizing `Follow-up Candidates`—not a bare verdict and not an action list.

### 9. Change-Ready Decision

Report `Change-Ready: yes` only when the same current candidate has:

- accepted outcome/requirements inside the outcome authority capsule;
- Applicable Proof;
- SDET final evidence or evidence-backed `N/A` (N/A only for proven non-behavioral work);
- complete project/owner validation pass;
- accepted Final Candidate Review (`approved` or `approved_with_notes`);
- for Material work, an explicitly accepted conforming delivery result;
- scoped candidate ownership with no unsafe overlap;
- no binding `Blocking Evidence`;
- complete local change-handoff package.

Material work always supplies current task/evidence status to the discovered conforming delivery/readiness gate; missing conforming capability blocks with an exact capability handoff. Ordinary Small uses proportional evidence and invokes that gate only when policy, risk, or owner requires it. Accepted delivery: `on plan` or `minor deviations` only with `Change-Ready: yes` and `Blocking for Acceptance: no`. Every `Change-Ready: no`, delivery `Verdict: material deviations`, evidence-insufficient delivery, `Blocking for Acceptance: yes`, `Verdict: blocked`, final `rejected`/`blocked`, mandatory-gate failure, or non-empty `Blocking Evidence` rejects readiness for the inspected candidate, is terminal for the current attempt, and never authorizes mutation or protected-boundary expansion. It does not automatically end the unfinished root goal or automatically authorize another attempt. New candidate and exhaustion handoff follow global AGENTS Working result and root stop budget. P2/note → Residual Risks or non-authorizing `Follow-up Candidates`.

Local package: context; requirements; scope; non-goals; changes; Applicable Proof; SDET; validation; reviews; risks/rollback when relevant; residual blockers; working-result stop budget used/remaining; `External Operations: not performed`. Native labels (`PR-Ready`, etc.) allowed; publication/deploy/release need separate authority.

### 10. Pilot-Ready Decision

`Pilot-Ready: yes | no | not requested` is limited-use, not a third lifecycle profile, and does not replace `Ordinary Small | Material` or Change-Ready. The complete Pilot safety floor is authoritative only in always-loaded global `AGENTS.md`; this skill does not restate that floor.

`Pilot-Ready: yes` may coexist with `Change-Ready: no` or `not requested` only when the Change-Ready blocker is outside the pilot envelope and does not undermine candidate identity/scope, proof, containment, safety floor, validation, or material-risk acceptance. Final/delivery rejection stays terminal for Change-Ready and never authorizes mutation/replay of that inspected attempt; new candidate only under global AGENTS root stop budget. It does not automatically erase independently proven Pilot-Ready evidence unless pilot facts become unreadable or untrustworthy. Current happy-path/non-deferrable defect at stop forbids `Pilot-Ready: yes`. Neither disposition authorizes deployment, release, installation, activation, credentials, or remote-state mutation.

### Rollback plan

Rollback planning is proportional. Detailed rollback evidence is required when migration, destructive state, deployment/activation, or substantial multi-surface risk makes it relevant. Rollback is executed only when separately authorized and is never required to claim Change-Ready. Preserve unrelated, pre-existing, or teammate work outside the candidate scope. Runtime activation rollback (prior active config pointer + restart/reload without repository mutation) is separate and does not count as full change rollback.

### Restart and continuity

After restart, compaction, cancellation, or context loss, reconstruct brief, Candidate Reference, role identities, validation, correction evidence, and root stop-budget used/remaining from authoritative sources. Unproved items are stale and block Change-Ready. Continuity uncertainty never resets prior failures or the root working-result stop budget (global AGENTS).

## Compact orchestration output

Return a compact record:

- `Profile`: Ordinary Small | Material
- `Stage / evidence`: current stage and what is proved
- `Candidate Reference`: project-native readable scoped candidate evidence, or none when not applicable
- `Gates`: Applicable Proof, SDET action or N/A, validation, final review
- `Delivery/readiness gate`: accepted, blocked, or `N/A - Ordinary Small <reason>`
- `Corrections`: owner routes and replays, or none
- `Working-result stop budget`: used/remaining post-green cycles; floor reached yes/no
- `Outcome working status`: working | not working | unknown (separate from readiness)
- `Pilot-Ready`: yes | no | not requested
- `Change-Ready`: yes | no | not requested
- `Native label`: project label if any, else none
- `External Operations`: not performed (unless separately authorized and recorded)
- `Blockers / residual risks`: exact items or none; pilot envelope limits when Pilot-Ready is yes; post-floor polish residual per global AGENTS

## Enforcement honesty

These are process controls for instruction-only runtime: conditional pre-mutation load, one orchestration skill, mutually exclusive roles when SDET/final review is invoked, exact briefs/reports, main-session candidate inspection, and binding independent review. Not an OS sandbox, path ACL, durable run DB, or cryptographic guarantee.
