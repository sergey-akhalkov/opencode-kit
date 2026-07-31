---
name: change-ready-sdlc
description: Use this skill before mutation only for explicit stable/full-qualification, project policy, or concrete Material risk involving public API/protocol/compatibility, data migration, security/privacy/authorization, destructive or remote action, concurrency correctness, deployment/release, or a loaded lifecycle/safety policy change.
license: MIT
---

# Change-Ready SDLC

Qualification adapter for Material work. The active primary user-session agent remains the sole orchestrator and default production author. Specialists are optional evidence sources except for fresh critical-only SDET when Material behavior changes.

## When To Load

Load before the first mutation only when at least one applies:

- the user explicitly requests `stable` / full qualification;
- project policy requires qualification;
- the change crosses a named Material boundary: public API/protocol/compatibility, persisted data or migration, security/privacy/authorization, destructive or remote action, concurrency correctness, deployment/release, or a loaded instruction/configuration change that alters lifecycle or safety policy.

Do not load for Ordinary Small work, pure research, ordinary review-only work, inert content, or clear bounded local reversible changes without a named Material boundary. Unknown escalates only when it can materially affect accepted behavior or a named boundary. High-risk behavior must not be downgraded merely because the diff is small.

## Profiles And Stage

Profiles remain exactly `Ordinary Small | Material`; they select proportional gates and are not lifecycle stages.

Use one user-facing field:

`Development-Stage: development | MVP | RC<n> | stable`

- `development`: the current candidate is incomplete, mutable, or lacks current representative happy-path proof.
- `MVP`: the smallest complete accepted end-to-end happy path works at a real boundary. It is usable; additional accepted scope may remain.
- `RC<n>`: accepted scope is complete, applicable project-native validation is green, and no known confirmed reachable critical or non-deferrable defect remains. Material behavior has usable terminal critical-SDET evidence. Known documented non-critical bugs, limitations, coverage gaps, and suboptimal code may remain.
- `stable`: the same RC has a complete local handoff and every applicable critical/safety/validation gate is green. No soak-time threshold is required. Record `Stable Candidate: RC<n>`.

Neither MVP, RC, nor stable authorizes deployment, release, installation, activation, publication, credentials, destructive action, or remote-state mutation.

## Authoritative Brief

Use the complete Universal Task Briefing Contract from global `AGENTS.md`. Preserve accepted outcome, operating envelope, non-goals, non-deferrable invariants, proof boundary, trusted validation, root RC counter, SDET continuation/terminal state, parked risks, protected boundaries, and exact owner blockers. Never delegate a raw user prompt or invent a missing threshold.

Scope expansion changes the accepted outcome, weakens an invariant, adds out-of-envelope behavior, or crosses protected boundaries and needs explicit owner approval. The implementation footprint may adapt only as the smallest sufficient dependency closure when it is local and reversible. Reviewer/SDET/validation evidence must never authorize mutation; main owns reproduction, classification, correction, parking, and stage transitions.

## Outcome-First Stop Line

Before MVP, correct only the accepted happy path and applicable non-deferrable invariants. Runtime Proof means launching or invoking the candidate at the nearest safe representative boundary, supplying representative input, and observing meaningful output or side effects. Inspection, compilation, static checks, unit tests, or mocked helper output alone are not Runtime Proof.

After MVP:

- incomplete accepted scope remains required work;
- a reproduced accepted-outcome, critical, or non-deferrable defect authorizes its smallest correction;
- known non-critical bugs, optional coverage, pre-existing maintainability debt, style, wording, report formatting, optional diagnostic polish, optimization, and future-scale work are recorded and parked;
- parked non-critical work never blocks RC or stable.

Current-change architecture and diagnostics are part of the same bounded implementation edit set as the behavior change, not a second post-MVP refactor program. A touched human-written file that already mixes owners SHALL NOT receive a new responsibility without one cohesive extraction or a `split-or-justify` decision. Existing unrelated debt remains parked. Meaningful in-scope failure boundaries preserve the original exception cause/stack and sufficient safe diagnostic context; optional logging polish remains parked.

The phrase "all critical bugs are fixed" means no **known confirmed reachable** critical or non-deferrable defect remains inside the enforced operating envelope. It never claims that undiscovered bugs are impossible.

## Evidence Topology And Scoped Invalidation

For evidence-heavy work, identify these roles before building or changing a proof harness:

- **Product Candidate**: behavior-affecting production code, config, data, or schema;
- **Proof Runner**: drives the real boundary and records observations;
- **Evaluator**: derives acceptance results from observations;
- **Environment Identity**: relevant executable, configuration, dependency, hardware, dataset, or service identity;
- **Raw Evidence Bundle**: immutable observations and hashes used for replay.

For runtime lanes, the Raw Evidence Bundle includes the exact invocation and representative input, Candidate/Environment identity, exit status, stdout/stderr, relevant logs and exceptions, observed side effects, and artifact paths. Inspect that preserved evidence before mutation or another live attempt. If it cannot distinguish realistic in-scope causes, add only the smallest safe instrumentation at the owning boundary and recapture the affected lane.

Invalidation is dependency-scoped:

- Product Candidate mutation invalidates dependent Runtime Proof and validation lanes and returns the candidate to `development`.
- Environment mutation invalidates only lanes that rely on that identity.
- Proof Runner mutation invalidates only captures whose driven behavior or recorded facts may differ.
- Evaluator-only mutation invalidates derived verdicts, not trustworthy raw observations; replay the preserved bundle instead of repeating a live/external attempt.
- Report or documentation formatting changes invalidate nothing unless accepted semantics or evidence interpretation changed.

Keep runtime fail-closed guards for non-deferrable safety, identity/liveness, authorization, data-integrity, ownership/correlation, required restoration/cleanup, irreversible-action, and envelope-escape conditions. Domain-specific policy may add concrete guards but must not omit accepted global invariants. A live fail-closed outcome is not evidence-only and evaluator replay cannot waive it. Evaluate non-safety cardinality, grouping, formatting, percentile, report, and similar acceptance oracles after raw capture when possible. Such evaluator failures must not alter cleanup or manufacture an unknown product state.

Proof may compose multiple bounded lanes against the same Product Candidate and compatible Environment Identity unless simultaneity is itself an accepted requirement. After an evidence-only failure, preserve the complete raw bundle and replay every reachable evaluator before another live/external attempt. A repeated evidence-only failure in the same chain blocks another attempt until regression evidence covers the preserved corpus or the exact missing observation is recorded.

## Orchestrator And Writer Safety

Only the active primary may create or resume specialist sessions. Optional production delegation requires exact bounded ownership, safe isolation or serialization, a representative proof boundary, and evidenced benefit. Real parallelism is one orchestrator-owned fan-out of independent isolated or exact non-overlapping scopes.

Asynchronous or concurrent mutation-capable work remains open after timeout, cancellation, missing report, partial mutation, or unknown liveness until a terminal report, adapter-proven terminal cessation, or write isolation/revocation. Cancellation acknowledgement alone is not closure. Unknown liveness blocks integration, proof, and qualification. Ordinary synchronous direct edits do not require this liveness protocol.

## Qualification Flow

### 1. Prepare

Freeze the accepted outcome capsule, trusted validation, operating envelope, protected boundaries, non-goals, non-deferrable invariants, root RC history, and stop line. Start or return to `development` when the current candidate is unproved.

### 2. Implement And Prove MVP

Main implements the smallest complete happy path and owns run-observe-correct. Production authors do not create or modify automated tests, fixtures, snapshots, fakes, simulators, harnesses, or goldens.

After current Runtime Proof, capture a readable Product Candidate Reference plus Proof Runner, Evaluator, Environment Identity, and Raw Evidence Bundle identities when applicable, then set `Development-Stage: MVP`. Failed proof remains `development` and consumes no RC number.

### 3. Complete Accepted Scope

Implement the remaining accepted scope without optional polishing. Product Candidate mutation returns to `development`; repeat affected Runtime Proof lanes to restore `MVP`. Runner, evaluator, environment, and report mutations follow the scoped invalidation rules above. Keep unrelated work intact.

### 4. Optional Risk Discovery

After MVP, main may invoke read-only final, delivery, code-quality, or domain reviewers only when concrete risk, project policy, or the owner makes that review useful. Reviewer absence, timeout, malformed output, or disagreement is not itself a stage blocker. Reviewers return evidence, never a verdict or work authorization.

Main must reproduce, disprove, or show unreachable every plausible non-deferrable authorization, privacy, data-integrity, irreversible-action, or envelope-escape claim. Ordinary non-critical findings are parked. Code-quality reductions are optional unless required for the accepted outcome or an invariant.

### 5. Critical SDET

For Material behavior changes, dispatch one fresh test-only SDET after current MVP proof and accepted-scope completion. Supply original requirements, Candidate Reference, raw proof, safe local/ephemeral runner, current tests, criticality rubric, exact test-only write scope, and require Effective Model provenance.

SDET challenges only reachable incidents that can cause authorization/privacy compromise, important data corruption/loss, irreversible external action, materially wrong financial/legal/business outcome, system-wide or mission-critical outage, or another explicitly accepted critical outcome. It returns exactly `Action: critical-risks-reported | no-critical-risk | blocked` and may author only the smallest critical reproducer/regression oracle.

Main independently reproduces each row. Another fresh attempt is earned only when the immediately prior attempt yields a main-confirmed critical defect, production fixes it, and current Runtime Proof passes again. The first precondition-valid attempt without a confirmed critical defect permanently stops SDET for the root. Non-critical findings never prolong SDET. A blocked/unusable report leaves the candidate at MVP unless another current critical/non-deferrable defect is independently known.

### 6. Validate And Freeze RC

Run every applicable trusted project-native validation procedure. With accepted scope complete, validation green, terminal Material SDET usable when applicable, and no known confirmed reachable critical/non-deferrable defect, freeze the next monotonic `RC<n>`.

RC numbering starts at RC1 and never resets within the root. Product Candidate mutation invalidates RC/stable and returns to `development`; scoped runner/environment mutation invalidates affected evidence lanes; evaluator/report mutation requires replay but does not erase trustworthy raw product observations. Current affected proof restores MVP, and the next complete qualification freezes `RC<n+1>`.

### 7. Stable Handoff

Promote the same RC to `stable` when the local handoff records outcome, scope/non-goals, changes, author/worker routing, Runtime Proof, environment, Candidate Reference/RC history, critical-SDET terminal reason when applicable, validation, known non-critical limitations, rollback/disable notes when relevant, and external-operation state.

Known documented non-critical limitations do not require an owner quiz and do not block stable. Ask the owner only for a material residual-risk decision or another protected-boundary decision. No mandatory reviewer, delivery, final-review, or soak ceremony exists.

## Restart And Continuity

After restart or compaction, reconstruct the accepted outcome, current Candidate Reference, Development-Stage, root RC history, current proof, SDET state, validation, and known limitations from authoritative evidence for the root change. Uncertainty never resets RC history. Unknown RC history leaves the candidate at MVP after proof and blocks the next RC number until history is resolved.

## Output

- `Profile`: Ordinary Small | Material
- `Outcome`: working | not working | unknown
- `Candidate Reference`: readable Product Candidate plus runner/evaluator/environment identities when applicable, or none
- `Raw Evidence Bundle`: immutable observations and lane status, or N/A with reason
- `Runtime Proof`: boundary, input, expected/actual observation, side effects, outcome
- `Architecture`: touched responsibilities and `split-or-justify` decisions, or N/A with reason
- `Diagnostics`: exit status, stdout/stderr, relevant log/exception and artifact paths, or N/A with reason
- `Critical SDET`: terminal state and confirmed-critical correction history, or N/A with reason
- `Validation`: trusted commands and outcomes
- `Known Non-Critical Limitations`: list or none
- `Development-Stage: development | MVP | RC<n> | stable`
- `Stable Candidate: RC<n>`: only when stable, else none
- `External Operations`: not performed unless separately authorized and recorded

## Enforcement Honesty

These are instruction-level controls, deterministic contracts, and runtime evidence requirements. They are not an OS sandbox, durable workflow database, or guarantee that undiscovered defects do not exist.
