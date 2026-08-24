## Context

See `proposal.md` for motivation. Current kit authority already requires representative real-boundary proof, scoped claim ceilings, shift-left characterization for modeled substitutions, bounded evidence indexes, candidate-correlated task evidence, deterministic complete-archive checks, a hidden completion arbiter, and matched consumer-workflow regression tooling. The missing owner is the logical bridge between those mechanisms: no universal record states which population and path a broad claim covers, and current completion checks can prove every declared requirement while the requirement itself composes incompatible evidence scopes.

The current worktree contains several active candidates and large uncommitted evidence sets. `add-autonomous-roadmap-mission-runtime` depends on current completion behavior, and `bound-completion-runtime-hot-paths` previously owned `global/plugins` while explicitly excluding verdict semantics. Owner priority now pauses both changes and transfers the shared root to this change after process reconciliation found no live non-shell writer. Existing candidate/evidence bytes remain preserved. The observed consumer incident is causal evidence only; portable artifacts and fixtures remain domain-neutral.

## Goals / Non-Goals

**Goals:**

- Add one reusable claim-evidence model rather than another lifecycle or test framework.
- Make representative proof an early working signal without allowing unsupported promotion.
- Reuse the existing evidence index, operation gates, completion arbiter, instruction inventories, and consumer-outcome harness.
- Keep semantic decisions reviewed and model-authored while deterministic code validates only explicit facts.
- Preserve a fast exact-case route for Ordinary Small work.

**Non-Goals:**

- Compute semantic equivalence, safety, partitions, or test completeness automatically.
- Require exhaustive execution for infinite domains or every bounded local fix.
- Replace domain-specific qualification, critical SDET, project tests, or competent safety review.
- Modify a consumer repository or encode one incident as portable policy.
- Mutate current overlapping completion-runtime candidates before ownership closure.

## Decisions

### 1. Add one orthogonal claim-evidence axis

Lifecycle stage and evidence breadth remain separate. Existing `Outcome`, Runtime Proof, validation, RC, and stable fields continue to answer whether one candidate passed its lifecycle gates. The new record answers what that evidence is allowed to claim.

Use these stable conceptual levels without turning them into a score: exact case, finite population, reviewed partitioned domain, real-system equivalence, compatibility/interchangeability, safety, and phase/milestone. A record can be `supported`, `narrowed`, `blocked`, or `unknown`. The maximum claim is explicit text plus structured identities, not a numeric confidence value.

Alternative rejected: redefining `MVP`, `RC`, or `stable` to imply evidence breadth. That would conflate candidate lifecycle with population and environment coverage and repeat the original failure shape.

### 2. Extend the existing evidence index

Add an optional bounded `claims` section to the current `evidence-index.json` contract for triggered changes. Each claim stores stable identifiers and references existing product, runner, evaluator, environment, raw, replay, and terminal lanes rather than copying hashes or observations. The record includes:

- claim id, class, statement, and accepted outcome ref;
- population identity and coverage basis;
- production, baseline, and candidate path identities;
- environment, observation boundary, and real-oracle state;
- evidence lane refs, material exclusions, unknowns, and independent-review ref;
- maximum claim and disposition.

Finite population rows remain in a reviewed manifest or project-native matrix referenced by identity and digest. Deterministic code checks schema, stable order, uniqueness, cardinality, references, current candidate/environment identity, terminal state, and unresolved fields. It never invents members, classes, equivalence, exclusions, or thresholds.

Alternative rejected: a second `claim-evidence.json` database. It would duplicate candidate, environment, and evidence references already owned by the evidence index.

### 3. Keep authoring proportional

Extend the Spec Capsule with one `Claim And Evidence Scope` field. Ordinary Small exact-case work can satisfy it in one line. Triggered broad claims must name the complete structured closure before production mutation. OpenSpec tasks reference the change-level owner and add only changed row, proof, or blocker details.

The semantic trigger is instruction- and reviewer-owned because deterministic code cannot infer whether prose is universal, safety-critical, or a true equivalence class. Once a claim declares its class, operation helpers can enforce its explicit closure mechanically.

Alternative rejected: require a matrix for every change. That would add proxy ceremony to exact-case fixes without improving evidence.

### 4. Use one focused substitution skill

Add `behavioral-substitution-qualification` for skip, omit, suppress, cache, replay, emulation, replacement, and optimized bypass work. It freezes baseline/candidate identity, population, state-and-effect observations, real boundary, unknowns, and claim ceiling. `change-ready-sdlc` keeps only the trigger and lifecycle integration.

This is `extend`, not a parallel qualification system: the skill composes existing Runtime Proof, evidence topology, live-attempt, restoration, cleanup, and critical-SDET rules. It introduces no dependency or runner.

Alternative rejected: copy detailed substitution rules into `AGENTS.md` and every domain skill. That would increase startup context and drift.

### 5. Add one independent entailment reviewer

Add `evidence-sufficiency-reviewer` as a fresh read-only leaf. It compares the original accepted outcome and current claim against population, path, real oracle, observations, and evidence freshness. Its output is a Claim-Evidence Matrix and risk rows with maximum supported ceilings. It never edits, runs external effects, writes tests, returns approval, or authorizes lifecycle state.

The review is mandatory only for triggered finite-population, partitioned-domain, real-system equivalence, compatibility/interchangeability, safety, and phase/milestone claims. Main must independently disposition its rows. Missing review evidence blocks only the broad claim; exact-case proof survives.

Alternatives rejected:

- Extending `test-coverage-reviewer` would keep the problem framed as tests rather than whether heterogeneous evidence entails the original claim.
- Extending `final-candidate-reviewer` would leave the gate optional and focused on candidate risks after requirements are accepted, while this role must challenge requirement sufficiency itself.
- Expanding SDET would mix critical test authorship with evidence-scope adjudication and make non-critical but material overclaim invisible.

### 6. Make archive and completion fail closed without semantic inference

The propose gate checks that `Claim And Evidence Scope` exists. Apply permits incomplete closure while the candidate is under development and reports the exact next row or proof boundary. Complete archive requires every accepted triggered claim to be supported or explicitly narrowed by the accepted outcome; blocked or unknown claims stop complete archive.

The bounded session-delivery projection supplies claim records and omission metadata to the existing arbiter. The arbiter maps human requirements to supported claim ids and returns `continue` for unsupported promotion. It does not read arbitrary project files or decide partitions from transcript prose. A later deterministic terminal certificate must bind the same accepted claim ids and evidence refs before it can bypass model arbitration.

Alternative rejected: let the arbiter infer closure from tests, checkboxes, and summaries. That is the failure this change removes and would make truncation unsafe.

### 7. Reuse matched consumer-outcome proof

Extend the existing consumer-outcome harness with a focused decision-gap pack that does not change the maintained baseline pointer or general friction scenarios. Use generic disposable projects and reviewed synthetic facts for four decisions:

1. complete offline finite-population evidence plus one real representative case cannot complete the population claim;
2. every finite row on one exact boundary supports only that declared population/environment;
3. unavailable real evidence blocks only the dependent real-system claim;
4. Ordinary Small exact-case work still completes proportionally.

Run the same model, variant, OpenCode version, source staging, permissions, and initial fixture state for baseline and candidate. Outcome and safety remain hard gates. The pack claims only correction of these decisions, not universal model quality or productivity.

Alternative rejected: add a new prompt-evaluation framework. Existing matched capture/replay already owns source staging, identity, cleanup, privacy, and provider bounds.

### 8. Transfer current ownership before shared mutation

Recapture active ownership and writer state before implementation. The owner-selected delivery order pauses `add-autonomous-roadmap-mission-runtime` and `bound-completion-runtime-hot-paths`, transfers `global/plugins`, and gives this change one current mutation set covering the claim, instruction, OpenSpec, proof, and completion-runtime paths. Preserve all existing dependent candidate/evidence bytes and treat later resumption as a new scoped invalidation review.

No historical session or inactive manifest authorizes concurrent mutation. Any newly observed external writer or liveness ambiguity blocks integration until terminal closure or isolation.

## Failure Boundaries And Diagnostics

- Missing or invalid claim record: fail the affected propose/apply/archive gate with claim id, field, and source path; preserve the original parse cause.
- Missing evidence-index lane or stale identity: return `unknown` and name the mismatched candidate, environment, path, or ref without exposing private content.
- Incomplete finite population: report expected, observed, duplicate, excluded, blocked, and unknown counts plus bounded row refs; never infer a pass from totals alone.
- Unqualified real oracle or truncated closure: block only the dependent claim and retain narrower evidence.
- Reviewer unavailable or malformed: record the evidence gap; do not impersonate review or erase exact-case proof.
- Arbiter request overflow: retain explicit omitted closure fields and fail closed rather than dropping claim evidence.
- Configured-provider proof failure: preserve the matched raw bundle, replay evaluator/finalization offline, and satisfy the live-attempt gate before a new capture.

## Fidelity And Authorization

- **Current Rung**: repository and consumer-incident evidence, current source/spec audit, and existing provider-free structural owners.
- **Next Real Boundary**: provider-free claim/evidence-index fixtures and operation-gate readback, followed by one matched loaded-session focused pack through the installed OpenCode entry point.
- **Authorization**: local source/spec/test edits and bounded synthetic configured-provider validation already authorized for this kit; no consumer, remote, deployment, release, or hardware effect.
- **Safeguards**: generic disposable fixtures, same-model baseline/candidate, explicit provider and evidence bounds, one writer, privacy-safe records, no external directories or protected tools.
- **Restoration/Cleanup**: close and delete proof sessions/processes/fixtures after preserving bounded evidence; cleanup uncertainty blocks the next sample.
- **Expected Evidence**: candidate and environment identities, exact scenario records, source manifests, tool/session outputs, claim decisions, validation, cleanup, replay result, and no consumer-specific portable text.

## Risks / Trade-offs

- [Agents may over-declare broad claims to be cautious] -> Keep exact-case syntax one line and behavioral proof that Ordinary Small remains proportional.
- [Agents may under-declare a trigger] -> Put the compact trigger in always-loaded authority, challenge it in the dedicated reviewer, and retain matched loaded-session scenarios rather than marker checks alone.
- [Finite exhaustive closure becomes expensive] -> Permit reviewed partitions or explicit narrower outcomes; never relabel missing evidence as non-applicable.
- [Independent review adds latency] -> Restrict it to broad claim classes and reuse one leaf role; no review is required for exact-case Ordinary Small work.
- [Structured records become a proxy] -> Keep semantic decisions reviewed, make helpers fact-only, and preserve real-boundary proof as the primary measure.
- [Active runtime changes invalidate proof] -> Serialize ownership, capture candidate identities after transfer, and replay only dependent lanes.
- [Portable policy drifts toward one incident] -> Reject consumer names, paths, protocols, hardware, and thresholds in maintained instructions and fixtures.

## Migration Plan

1. Reconcile active ownership, pause dependency changes, transfer the shared runtime root, and verify no live external writer.
2. Add the claim-evidence index schema and provider-free fixtures, then extend operation-gate readback without changing runtime verdict semantics.
3. Add the compact principle/routing, on-demand skill, and read-only reviewer with deterministic catalog/permission checks.
4. Extend OpenSpec capsule/apply/archive handling and prove exact-case plus broad-claim structural scenarios.
5. Add completion-evidence projection and arbiter handling on the bounded current runtime, then replay focused guard tests.
6. Run the matched generic loaded-session decision-gap pack and retain only if candidate behavior fixes overclaim without regressing Ordinary Small outcome, safety, cleanup, or friction.
7. Run project validation and produce a local handoff. Installation, activation, archive, commit, push, and release remain separate actions.

Rollback removes the archive/completion gate first, then the reviewer/skill and claim-index extension, while preserving raw evaluation evidence and restoring the previous loaded instruction source. A rollback cannot relabel a previously blocked broad claim as supported.
