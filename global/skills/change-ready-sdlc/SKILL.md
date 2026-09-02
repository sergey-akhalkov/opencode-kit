---
name: change-ready-sdlc
description: Use this skill before mutation only for explicit stable/full-qualification, project policy, or Material risk involving public API/protocol/compatibility, persisted data or migration, security/privacy/authorization, destructive or remote action, concurrency correctness, deployment/release, or a loaded instruction/configuration lifecycle/safety policy change.
license: MIT
---

# Change-Ready SDLC

Material-safety and qualification adapter. The active primary user-session agent remains the sole orchestrator and default production author. Specialists are optional evidence sources except for fresh critical-only SDET when a reachable named critical risk or explicit requirement triggers it.

## When To Load

Load before the first mutation only when at least one applies:

- the user explicitly requests `stable` / full qualification;
- project policy requires qualification;
- the change crosses a named Material boundary: public API/protocol/compatibility, persisted data or migration, security/privacy/authorization, destructive or remote action, concurrency correctness, deployment/release, or a loaded instruction/configuration change that alters lifecycle or safety policy.

Do not load for Ordinary Small work, pure research, ordinary review-only work, inert content, or clear bounded local reversible changes without a named Material boundary. Unknown escalates only when it can materially affect accepted behavior or a named boundary. High-risk behavior must not be downgraded merely because the diff is small.

## Profiles And Stage

Profiles remain exactly `Ordinary Small | Material`; they select proportional gates and are not lifecycle stages.

Use the stage field only for explicit stable/full qualification, project-required qualification, or a reachable named critical-risk qualification path:

`Development-Stage: development | MVP | RC<n> | stable`

- `development`: the current candidate is incomplete, mutable, or lacks current representative happy-path proof.
- `MVP`: the smallest complete accepted end-to-end happy path works at a real boundary. It is usable; additional accepted scope may remain.
- `RC<n>`: accepted scope is complete, applicable project-native validation is green, and no known confirmed reachable critical or non-deferrable defect remains. Triggered critical SDET has usable terminal evidence when applicable. Known documented non-critical bugs, limitations, coverage gaps, and suboptimal code may remain.
- `stable`: the same RC has a complete local handoff and every applicable critical/safety/validation gate is green. No soak-time threshold is required. Record `Stable Candidate: RC<n>`.

Neither MVP, RC, nor stable authorizes deployment, release, installation, activation, publication, credentials, destructive action, or remote-state mutation.

Material work outside that qualification track reports `Outcome: working | blocked | unknown`, representative proof, applicable validation, and Known Non-Critical Limitations without RC numbering or stable promotion.

## Authoritative Brief

Use the complete Universal Task Briefing Contract from global `AGENTS.md`. Preserve accepted outcome, operating envelope, non-goals, non-deferrable invariants, proof boundary, trusted validation, root RC counter, SDET continuation/terminal state, parked risks, protected boundaries, and exact owner blockers. Never delegate a raw user prompt or invent a missing threshold.

Scope expansion changes the accepted outcome, weakens an invariant, adds out-of-envelope behavior, or crosses protected boundaries and needs explicit owner approval. Main SHALL autonomously adapt the smallest sufficient dependency closure and process controls—including planning artifacts, tasks, candidate/revision labels, attempt limits, and stop lines—when accepted semantics remain unchanged. Agent-authored one-attempt or `no successor` wording is not owner scope by itself. After causal correction and a satisfied retry/`Live-Attempt Gate`, update traceability and continue without asking for process approval. The underlying protected action retains separate authority, safety, identity, restoration/cleanup, and evidence gates. Reviewer/SDET/validation evidence must never authorize mutation; main owns reproduction, classification, correction, parking, and stage transitions.

For explicitly grind-enabled roots, consume the canonical task-scoped frontier contract from global `AGENTS.md`: preserve each blocked dependency cone and its evidence ceiling, complete every controller-derived runnable accepted item, and permit a product decision only after the runnable set is empty. A proven protected action or unavailable capability remains an enforced non-product gate and becomes question-free waiting after frontier drain; this never grants action authority. Outside grind, the existing decision-ready owner handoff remains unchanged.

## Outcome-First Stop Line

Before MVP, correct only the accepted happy path and applicable non-deferrable invariants. Runtime Proof means launching or invoking the candidate at the nearest safe representative boundary, supplying representative input, and observing meaningful output or side effects. Inspection, compilation, static checks, unit tests, or mocked helper output alone are not Runtime Proof.

After MVP:

- incomplete accepted scope remains required work;
- a correction directly required for the still-current accepted outcome remains ordinary dependency-closure work and receives the smallest normal task;
- a reproduced accepted-outcome, critical, or non-deferrable defect authorizes its smallest correction;
- known non-critical bugs, optional coverage, pre-existing maintainability debt, style, wording, report formatting, optional diagnostic polish, optimization, and future-scale work are recorded and parked;
- parked non-critical work never blocks RC or stable.

Current-change architecture and diagnostics are part of the same bounded implementation edit set as the behavior change, not a second post-MVP refactor program. A touched human-written file that already mixes unrelated semantic owners SHALL NOT receive a new responsibility or be preserved merely as a coordinator without one cohesive owner extraction or a `split-or-justify` decision. A private capability boundary selected from current semantic-owner, bounded-contract, and direct-oracle evidence remains inside its semantic owner and does not satisfy this mixed-owner rule by itself. Existing unrelated debt remains parked. Meaningful in-scope failure boundaries preserve the original exception cause/stack and sufficient safe diagnostic context; optional logging polish remains parked.

The phrase "all critical bugs are fixed" means no **known confirmed reachable** critical or non-deferrable defect remains inside the enforced operating envelope. It never claims that undiscovered bugs are impossible.

## Shift-Left Proof Cadence

- For each behavior dependency chain, minimize `time-to-first-real-signal`: execute the first safely reachable real boundary sufficient to observe the accepted effect, from local tests or simulators through shadow or independently effect-blocked read-only real use, bounded live effects, and end-to-end operation. Unit/mock/component checks are support, not real-boundary proof. Authority is a ceiling, not a fidelity target; climb only for a current requirement, invariant, or unresolved equivalence risk.
- For a compound Material dependency chain, identify the smallest evidence-bearing leaves before the next costly, live, or integration action. Each leaf names one bounded result, dependencies, owner/effect boundary, earliest sufficient oracle, local diagnostics, safeguards, restoration/cleanup, and expected evidence; common change-level envelope facts stay shared. Prove each required leaf before climbing, keep its evidence at that leaf ceiling, then run a distinct parent integration oracle. A newly observed independent prerequisite becomes a child and blocks only its cone; same-leaf and integration-only failures stay with their current boundaries; no decomposition weakens live-attempt, writer-liveness, protected-action, population, substitution, or critical-risk controls.
- When a selected private capability has a distinct current contract and direct oracle, treat it as a dependent evidence boundary: prove that capability first, then run the semantic owner's separate parent integration boundary. A module without a truthful direct oracle creates no component-proof requirement, and capability success never proves the parent.
- Roadmaps SHALL state the ladder once. Each behavior-slice item SHALL include `Current Rung`, `Next Real Boundary`, `Blocker/Unblocker`, `Observable Proof`, owner authorization, safeguards, and restoration/cleanup; omission is incomplete. Run the sufficient boundary before dependent expansion. A path-only action/gate stays blocked; reconcile controls and use an alternate sufficient route without claiming that path. Stop the accepted outcome only when every sufficient route requires owner action.
- For emulation, replacement, replay, caching, skipping, or another substitution claim, load `behavioral-substitution-qualification`; it owns baseline/candidate path identity, same-actor/environment comparison, observation closure, real-oracle dependency, and the maximum supported claim. Keep this skill focused on lifecycle rules rather than copying that workflow.
- This cadence does not authorize external operations or weaken protected boundaries, physical-effect suppression, `Live-Attempt Gate`, identity, restoration, cleanup, cost, or remote/destructive/deploy/install/release controls. Early characterization is production-owned run-observe-correct; fresh critical SDET remains after current proof and accepted-scope completion only when the named-risk or explicit requirement applies.

## Runtime Proof And Retry Discipline

Identify the Product Candidate, real boundary, representative input, environment identity, expected observation, safety guards, and cleanup. Prefer the actual entry point and project-native tests. Do not build or retain an evidence bundle, lane index, evaluator archive, or replay corpus.

### Blocker self-diagnosis and absence-source qualification

Before main declares a technical/evidence blocker, treats negative observation as Product Candidate failure, repeats a governed attempt, or escalates uncertain ownership, it SHALL perform one bounded pass when cause or ownership is not proven and the claim depends on contradictory evidence, a failed canary/preflight, a zero/empty/timeout/absence result, or a machine-local identity or observation path. Preserve the accepted goal and envelope; state the falsifiable blocker claim and affected requirement; classify the affected layer as Product Candidate, Proof Runner, Evaluator, Environment, Authority, or `unknown`; separate current observed facts from assumptions; inspect material contradictions; verify environment-dependent identities; select the smallest safe causally distinct probe that can falsify a live hypothesis; and state the narrowest supported claim ceiling. An obvious evidenced local defect proceeds through normal run-observe-correct without generic diagnostic ceremony.

A mandatory source used to prove that an event, state, packet, process, response, or side effect is absent SHALL establish the expected observable phenomenon, current source identity, freshness, observation point, intersection with the expected execution path, and one safe positive control showing that the source can observe that phenomenon. If the positive control is unavailable, unauthorized, unsafe, or fails, the source is `unqualified`; its negative result cannot establish Product Candidate failure, completion failure, or owner-only status. Preserve contradictory direct observations.

Missing qualification keeps only the dependent Proof Runner/Evaluator/Environment lane unknown. It never clears or waives safety, identity/liveness, authorization, data-integrity, restoration/cleanup, irreversible-action, envelope, or live-attempt gates and never authorizes another costly/live attempt through the blocked path. Keep a defective proof path blocked while another sufficient safe route advances the accepted outcome; evidence on the alternate route does not clear the defective path. If the bounded pass remains inconclusive, follow the global one-consultation `troubleshooter` route; if an exact owner-only boundary is already proven, bypass redundant diagnosis.

Inspect the current run's exact invocation, representative input, Candidate/Environment identity, exit status, stdout/stderr, relevant logs and exceptions, observed side effects, artifact paths, and cleanup before mutation or another live attempt. If those diagnostics cannot distinguish realistic in-scope causes, add only the smallest safe instrumentation at the owning boundary and rerun. Product Candidate or relevant environment mutation invalidates dependent Runtime Proof; report formatting does not.

Keep runtime fail-closed guards for non-deferrable safety, identity/liveness, authorization, data-integrity, ownership/correlation, required restoration/cleanup, irreversible-action, and envelope-escape conditions. Domain-specific policy may add concrete guards but must not omit accepted global invariants. A live fail-closed outcome is not report-only and later evaluation cannot waive it. Evaluate non-safety cardinality, grouping, formatting, percentile, report, and similar acceptance oracles from current-run observations when possible. Such evaluator failures must not alter cleanup or manufacture an unknown product state.

Proof may compose multiple bounded runs against the same Product Candidate and compatible Environment Identity unless simultaneity is itself an accepted requirement. A new exception, log, failing line, or later failure in the same chain is diagnosis, not outcome progress. Inspect the current run, correct the owning cause, and use the smallest safe causally distinct probe rather than building a retained replay path.

A failed external, physical, costly, destructive, or long-running attempt blocks unchanged repetition through the same path. The invocation remains finalized and non-reusable. Another authorized attempt requires a causal mechanism change or the exact missing observation, plus the same safety and cleanup guards. Current-run diagnostics, not a retained replay corpus, determine that decision.

## Orchestrator And Writer Safety

Only the active primary may create or resume specialist sessions. Optional production delegation requires exact bounded ownership, safe isolation or serialization, a representative proof boundary, and evidenced benefit. Real parallelism is one orchestrator-owned fan-out of independent isolated or exact non-overlapping scopes.

Asynchronous or concurrent mutation-capable work remains open after timeout, cancellation, missing report, partial mutation, or unknown liveness until a terminal report, adapter-proven terminal cessation, or write isolation/revocation. Cancellation acknowledgement alone is not closure. Unknown liveness blocks integration, proof, and qualification. Ordinary synchronous direct edits do not require this liveness protocol.

## Qualification Flow

Run this stage flow only for explicit/project-required qualification or a reachable named critical-risk qualification path. Otherwise complete the verified-outcome path above.

### 1. Prepare

Freeze the accepted outcome capsule, trusted validation, operating envelope, protected boundaries, non-goals, non-deferrable invariants, root RC history, stop line, and per-dependency proof ladder. Start or return to `development` when the current candidate is unproved.

### 2. Implement And Prove MVP

Main implements the smallest complete happy path and owns run-observe-correct at the earliest safely reachable real boundary. Production authors may build its Proof Runner, capture/evaluator, and restoration tooling before proof. After current representative proof, main may create or update the smallest focused regression oracle for a reproduced accepted-outcome defect or realistic requirement-linked regression; this is not independent SDET evidence.

After current Runtime Proof, record a readable Product Candidate Reference, environment identity, invocation, and observed result in the session handoff, then set `Development-Stage: MVP`. Failed proof remains `development` and consumes no RC number.

### 3. Complete Accepted Scope

Implement the remaining accepted scope without optional polishing. Product Candidate mutation returns to `development`; repeat affected Runtime Proof lanes to restore `MVP`. Runner, evaluator, environment, and report mutations follow the scoped invalidation rules above. Keep unrelated work intact.

### 4. Optional Risk Discovery

After MVP, main may invoke read-only final, delivery, code-quality, or domain reviewers only when concrete risk, project policy, or the owner makes that review useful. Reviewer absence, timeout, malformed output, or disagreement is not itself a stage blocker. Reviewers return evidence, never a verdict or work authorization.

Main must reproduce, disprove, or show unreachable every plausible non-deferrable authorization, privacy, data-integrity, irreversible-action, or envelope-escape claim. Ordinary non-critical findings are parked. Code-quality reductions are optional unless required for the accepted outcome or an invariant.

### 5. Critical SDET

Dispatch one fresh test-only SDET after current proof and accepted-scope completion only for a reachable authorization/privacy compromise, important data corruption/loss, irreversible external action, materially wrong financial/legal/business outcome, system-wide/mission-critical outage, another explicitly accepted critical consequence, or an explicit project/owner requirement. Supply original requirements, Candidate Reference, current proof result, safe local/ephemeral runner, current tests, criticality rubric, exact test-only write scope, and require Effective Model provenance.

SDET challenges only reachable incidents that can cause authorization/privacy compromise, important data corruption/loss, irreversible external action, materially wrong financial/legal/business outcome, system-wide or mission-critical outage, or another explicitly accepted critical outcome. It returns exactly `Action: critical-risks-reported | no-critical-risk | blocked` and may author only the smallest critical reproducer/regression oracle.

Main independently reproduces each row. An unchanged candidate and unchanged critical-risk hypothesis receive no equivalent verdict-seeking rerun. A fresh attempt may follow a main-confirmed critical defect and production fix, another production mutation that materially changes reachable critical behavior, or new decision-changing evidence identifying a distinct reachable critical hypothesis, after current Runtime Proof and accepted-scope completion. No SDET attempt count permanently prohibits future risk assessment of a materially changed candidate, and SDET convergence never stops unfinished production work. Non-critical findings never prolong SDET. A blocked/unusable report leaves the candidate at MVP unless another current critical/non-deferrable defect is independently known.

### 6. Validate And Freeze RC

Run every applicable trusted project-native validation procedure. With accepted scope complete, validation green, triggered critical SDET terminal and usable when applicable, and no known confirmed reachable critical/non-deferrable defect, freeze the next monotonic `RC<n>`.

RC numbering starts at RC1 and never resets within the root. Product Candidate mutation invalidates RC/stable and returns to `development`; scoped runner/environment mutation invalidates affected proof. Report-only formatting changes do not invalidate trustworthy product observations. Current affected proof restores MVP, and the next complete qualification freezes `RC<n+1>`.

### 7. Stable Handoff

Promote the same RC to `stable` when the local handoff records outcome, scope/non-goals, changes, author/worker routing, Runtime Proof, environment, Candidate Reference/RC history, critical-SDET terminal reason when applicable, validation, known non-critical limitations, rollback/disable notes when relevant, and external-operation state.

Known documented non-critical limitations do not require an owner quiz and do not block stable. Ask the owner only for a material residual-risk decision or another protected-boundary decision. No mandatory reviewer, delivery, final-review, or soak ceremony exists.

## Restart And Continuity

After restart or compaction, reconstruct the accepted outcome, current Candidate Reference, Development-Stage, root RC history, current proof, SDET state, validation, known limitations, and any live-attempt gate with its observed failure, changed mechanism or missing observation, and retry/stop condition. Uncertainty never resets RC history or clears a live-attempt gate. Unknown RC history leaves the candidate at MVP after proof and blocks the next RC number until history is resolved; unknown live-attempt gate state blocks another high-cost live attempt until resolved.

## Output

- `Profile`: Ordinary Small | Material
- `Outcome`: working | blocked | unknown
- `Candidate Reference`: readable Product Candidate plus environment identity when applicable, or none
- `Live-Attempt Gate`: clear | blocked | unknown for a relevant costly/live path; when not clear, state the observed failure, causal change or exact missing observation, and retry/stop condition
- `Runtime Proof`: boundary, input, expected/actual observation, side effects, outcome
- `Architecture`: touched responsibilities and `split-or-justify` decisions, or N/A with reason
- `Diagnostics`: current-run exit status, stdout/stderr, relevant log/exception, effects, and cleanup, or N/A with reason
- `Critical SDET`: terminal state and confirmed-critical correction history, or N/A with reason
- `Validation`: trusted commands and outcomes
- `Known Non-Critical Limitations`: list or none
- `Development-Stage: development | MVP | RC<n> | stable`: qualification track only
- `Stable Candidate: RC<n>`: only when stable, else none
- `External Operations`: not performed unless separately authorized and recorded

## Enforcement Honesty

These are instruction-level controls, deterministic contracts, and runtime evidence requirements. They are not an OS sandbox, durable workflow database, or guarantee that undiscovered defects do not exist.
