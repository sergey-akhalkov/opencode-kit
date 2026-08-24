## Context

See `proposal.md` for motivation and the bounded outcome. The current kit already has four relevant owners: always-loaded blocker routing in `global/AGENTS.md`, Material evidence topology in `change-ready-sdlc`, independent pre-escalation diagnosis in `troubleshooter`, and structured continuation/stagnation handling in the session completion guard. The existing `pre-escalation-recovery` proof exercises safe-local, stale-proof-path, uncertain-owner, exhausted-technical, and true owner-only behavior, but it does not cover an invalid measurement source. The proof inventory likewise records boundary, effects, evidence, cleanup, and limits without requiring a positive control for absence-based evidence.

The reproduced failure class is premature closure across layers: direct product/relay facts show an operation, an indirect observer and its canary both report zero, a stale numeric component id and wrong endpoint place the observer outside the actual path, yet the negative result is elevated to a product or owner blocker. The change must prevent that class without turning every ordinary failure into an exhaustive audit.

This is a Material loaded lifecycle-policy change. It changes when a primary may stop or escalate, how a hidden arbiter treats incomplete technical diagnosis, and what evidence is required before absence supports a blocker claim. It remains local, reversible, provider-bounded, and remote-free.

### Fidelity Ladder

`current source/spec and reproduced-incident audit -> provider-free synthetic fixture/oracle preflight -> same-model current-source baseline -> concise loaded-authority/troubleshooter/arbiter candidate -> same-model candidate primary and troubleshooter capture -> installed grind-enabled completion-guard continuation -> focused validators and full Material qualification`. The current rung is planning from source and incident evidence. The first implementation boundary is provider-free oracle preflight in the existing proof runners. The first real behavior boundary is the current-source same-model baseline before instruction mutation. Standing machine authorization covers the minimum non-sensitive configured-provider calls needed for kit validation; safeguards are fixed synthetic inputs, exact local tool permissions, disposable roots, finite scenarios, immutable evidence, no target project, and deterministic session/process cleanup.

## Goals / Non-Goals

**Goals:**

- Make self-diagnosis unavoidable at the point where a technical/evidence blocker could become a user interruption or an unsupported product claim.
- Qualify absence-based evidence using current identity, observation-path relevance, freshness, and a positive control.
- Reuse existing authority, diagnosis, continuation, and proof owners with one finite main pass and at most one independent consultation per unchanged failure chain.
- Prove improved behavior through same-model baseline/candidate observations and preserve ordinary local-fix and true owner-only controls.

**Non-Goals:**

- A new diagnostic skill, workflow engine, generic topology solver, domain adapter, telemetry system, or automatic production repair mechanism.
- Exhaustive assumption enumeration on ordinary known-cause failures.
- A deterministic program that attempts to infer semantic root cause or score model reasoning.
- A new completion-verdict schema, public API, compatibility layer, target-project activation, or protected/live effect.

## Decisions

### Decision 1: Use an always-loaded trigger and existing specialized owners

`global/AGENTS.md` receives the shortest complete trigger and routing rule. `change-ready-sdlc` owns the detailed evidence qualification and scoped invalidation rules for Material proof. `troubleshooter` owns the independent diagnosis case/report delta. The completion arbiter owns stop-versus-continue adjudication from supplied evidence. Portable mirrors receive only their role-specific delta.

This is a `reuse + narrow extension` decision: every required responsibility already has a current owner, no dependency or top-level diagnostic mechanism is needed, and cross-project reuse is not applicable to portable kit authority. Alternative rejected: a new optional self-diagnosis skill. The failure occurs when the primary does not recognize that its own assumptions are wrong, so optional discovery cannot be the primary trigger. Alternative rejected: copying the full checklist into every role, which would increase always-loaded context and drift.

### Decision 2: Trigger deeply only on blocker-quality signals

The deep pass triggers before a technical/evidence blocker, an absence-based product-failure claim, a governed repeated attempt, or uncertain owner escalation when one of these signals is material: contradictory evidence, failed canary/preflight, zero/empty/timeout/absence result, or a machine-local identity/observation path necessary to the claim. An obvious current evidenced local defect follows normal run-observe-correct.

The bounded pass records six semantic facts in the session evidence rather than a new persisted data model:

1. falsifiable blocker claim and affected accepted requirement;
2. layer classification: Product Candidate, Proof Runner, Evaluator, Environment, Authority, or `unknown`;
3. observed facts versus assumptions and current environment-dependent identities;
4. material contradictions and observer qualification when absence is used;
5. one smallest safe causally distinct probe and its expected decision-changing observation;
6. claim ceiling and recovery disposition.

Alternative rejected: recheck every fact after every failure. It would delay simple corrections, consume context, and encourage checklist completion rather than causal diagnosis. Alternative rejected: a numeric confidence score, because deterministic helpers may not infer reasoning quality and a model score would add no evidence.

### Decision 3: Extend evidence topology instead of adding an Observer role

An observer remains part of the Proof Runner/Environment boundary. Any source used to prove absence must declare the expected phenomenon, current source identity, freshness, observation point, intersection with the expected execution path, and a safe positive control. Failed or impossible qualification yields `unqualified`; negative output from that source cannot establish Product Candidate failure or owner-only status.

This preserves the existing Product Candidate, Proof Runner, Evaluator, Environment Identity, and Raw Evidence Bundle topology. Alternative rejected: a sixth top-level `Observer` role, because it would duplicate Runner/Environment ownership and complicate invalidation without changing behavior. Safety and live-attempt gates remain independent: an unqualified observer narrows claims but never clears a protected or fail-closed gate.

### Decision 4: Reuse the current completion verdict and continuation schema

The arbiter can express missing blocker-layer, assumption, contradiction, observer, probe, and claim-ceiling evidence through the existing `unresolved` entries and can prohibit repetition through `strategyAssessment`. The existing synthetic continuation already carries exact next action, next evidence, and stop condition. Therefore this increment changes the arbiter contract and behavior, not `CompletionVerdict` schema version 1 or production parsing.

Alternative rejected: add a mandatory `diagnosticAssessment` object before behavior evidence. Its fields would remain model-authored semantics that deterministic parsing cannot validate, while causing schema, compatibility, projection, and replay churn. If installed same-model evidence later reproduces an omission that the existing fields cannot represent, that is evidence for a separate schema change rather than permission to prebuild one now.

### Decision 5: Troubleshooter is the only independent escalation pass

Main performs the first bounded pass. If cause and owner status remain uncertain after safe distinct local mechanisms are exhausted, one cold-context `troubleshooter` receives a complete case containing layer, facts, assumptions, contradictions, observer qualification, probes, bounds, and validation. Its report adds the same diagnostic fields to the existing recovery disposition; main still verifies and executes the route. Known owner-only boundaries bypass consultation, and unchanged failure chains cannot invoke an equivalent consultant again.

Alternative rejected: a new reviewer or root-cause agent in the live blocker path. `troubleshooter` already has the correct read-only, pre-escalation, safe-probe, and owner-classification authority. `root-cause-analysis` remains useful for retrospective recurrence records, not as the runtime trigger.

### Decision 6: Extend two existing proof boundaries

The maintained `pre-escalation-recovery` runner gains fixed provider-free fixtures and same-model baseline/candidate cases for primary and `troubleshooter` routing. One combined broken-observer case carries the stale id, wrong observation layer, failed positive control, and contradictory direct evidence so the evaluator tests the causal behavior without multiplying expensive calls. Qualified-absence, straightforward-local-defect, and true owner-only controls prevent over-triggering and authority regression.

The installed completion-guard proof gains one grind-enabled technical-blocker lane that supplies the same evidence class and observes at least one synthetic continuation before terminal disposition. It verifies that incomplete diagnosis cannot stop or become owner-required and that current `unresolved` fields are sufficient. Each runner exposes `--help`, provider-free preflight/replay where applicable, fixed permissions, create-new immutable evidence, session/process cleanup, and raw source/model/environment identities.

Alternative rejected: source inspection or a structural marker test as behavioral proof. Alternative rejected: a new top-level proof runner, because the existing pre-escalation and installed guard runners already own the two exact routes. Structural validators remain drift tripwires only.

### Decision 7: Evidence invalidation stays role-scoped

Proof-runner fixture/oracle changes invalidate captures driven by those scenarios, not unrelated product proof. Loaded instruction, `troubleshooter`, or arbiter-prompt mutation changes the Product Candidate and returns it to `development`; candidate capture must use the same fixed model/profile/input/environment as the preserved baseline. Evaluator-only correction replays preserved bundles before another provider call. A failed configured-provider or installed-guard capture blocks its lane until preserved-corpus replay reaches a terminal result or names the exact missing raw observation.

## Failure Boundaries And Diagnostics

- **Fixture/oracle preflight**: preserve scenario id, allowed tools, expected file facts, rejected/accepted oracle results, source hashes, and zero provider calls.
- **Primary/troubleshooter capture**: preserve source/profile/model identities, exact synthetic input digest, tool/task/question calls, consultant correlation, assistant markers, file manifests, exits, stdout/stderr, session deletion, and cleanup.
- **Completion-guard lane**: preserve root/child refs, revision and audit correlation, arbiter verdict, synthetic continuation, blocker claim ceiling, terminal state, model-call classes, and root/child cleanup.
- **Evaluation**: preserve baseline and candidate bundle refs, per-scenario observable facts, control regressions, and terminal verdict; never infer unrecorded semantic intent.
- **Failure handling**: retain original SDK/process cause and bounded logs. After an evidence-only failure, replay the preserved evaluator/finalization chain before another configured-provider attempt.

## Risks / Trade-offs

- **The trigger may over-activate on simple failures** -> keep the always-loaded rule signal-based and prove a straightforward-local-defect control with no consultant or user question.
- **The model may satisfy labels without genuine diagnosis** -> require an allowed decision-changing probe and observable claim/tool facts rather than prose-only markers.
- **A positive control may itself require protected effects** -> mark the observer unqualified, preserve the blocked qualification lane, and continue only independent safe work.
- **More diagnostic context increases token use** -> keep one compact main record, one combined failure fixture, and at most one consultant per unchanged chain.
- **Prompt-only arbiter behavior may remain inconsistent** -> use the actual installed guard route; if existing fields cannot carry the required continuation, stop this candidate and propose a separately evidenced schema change rather than silently widening scope.
- **Baseline/candidate provider variance may obscure benefit** -> use the same selected model/profile/input/environment, immutable captures, explicit controls, and no universal-compliance claim.

## Migration Plan

1. Extend the existing proof fixtures, deterministic oracles, and inventory, then run provider-free preflight.
2. Capture the same-model current-source baseline for the selected scenarios before loaded instruction mutation.
3. Update the concise global trigger, Material evidence contract, `troubleshooter`, completion arbiter, maintained mirrors, and structural validators without changing verdict schema version 1.
4. Run provider-free structural/loader checks, then capture and evaluate the candidate primary/troubleshooter behavior against the preserved baseline.
5. Exercise the installed grind-enabled completion-guard continuation lane, correct only reproduced current-scope defects, and regain current proof after each Product Candidate mutation.
6. Complete fresh critical-only Material SDET, project-native validation, strict OpenSpec consistency, and local handoff. Do not install, activate, deploy, or modify a target project.

Rollback restores the prior version-controlled instruction/agent/arbiter sources and validator mirrors, starts no new provider run, and leaves preserved baseline/candidate evidence immutable. Any running proof root or child must be terminally deleted and every proof-owned process/fixture cleaned before rollback is considered complete.

## Open Questions

None for the current increment.
