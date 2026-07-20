## ADDED Requirements

### Requirement: SDLC-012 Outcome-first slices minimize sufficient lifecycle complexity
The portable runtime instructions SHALL optimize for the earliest useful working increment that satisfies the accepted outcome and non-deferrable invariants inside an explicitly enforced operating envelope. Simplicity SHALL mean the fewest capabilities, reachable modes, states, configuration dimensions, recovery paths, compatibility paths, owner boundaries, and abstractions sufficient for that increment, not merely the fewest lines of code.

Before adding a new mechanism or abstraction, the main session and implementation roles SHALL consider, in order: removing an unnecessary capability; narrowing users, data, interfaces, modes, load, concurrency, persistence, or side effects; reusing an existing project/platform mechanism; and adding a local guard, validation, or focused test. Multiple new coordination, recovery, compatibility, policy, or evidence mechanisms SHALL require presenting a narrower slice or explicit evidence that the simpler options cannot satisfy the accepted increment.

Risk classification SHALL evaluate behavior reachable inside the proposed operating envelope. A relied-upon envelope limit SHALL remove a risk from current reachability only when the candidate or an accepted existing project mechanism enforces that limit. A prose-only, ambiguous, or bypassable limit SHALL NOT reduce risk classification.

#### Scenario: Scope reduction removes unnecessary concurrency
- **WHEN** the first useful increment can be restricted by an enforced single-worker or single-user boundary
- **THEN** the agent SHALL prefer that bounded slice over adding locks, distributed coordination, retries, and recovery state for unreachable concurrent use
- **AND** future concurrency SHALL remain explicit non-goal or follow-up scope.

#### Scenario: Prose-only containment does not reduce risk
- **WHEN** a proposed pilot says "single tenant only" but no accepted mechanism prevents another tenant from reaching the behavior
- **THEN** multi-tenant effects SHALL remain reachable for risk classification
- **AND** the candidate SHALL NOT receive a simplified disposition based on prose alone.

#### Scenario: Existing mechanism is preferred
- **WHEN** an existing feature flag, allowlist, read-only mode, queue, transaction, or project-native boundary can enforce the accepted slice
- **THEN** the implementation SHALL reuse it unless evidence shows it cannot meet the current outcome
- **AND** SHALL NOT add a parallel mechanism for hypothetical future flexibility.

### Requirement: SDLC-013 Pilot-Ready is separate from Change-Ready
The portable runtime SHALL support `Pilot-Ready: yes | no | not requested` as a local limited-use disposition separate from `Change-Ready: yes | no | not requested`. Pilot-Ready SHALL NOT create a third lifecycle profile, replace `Ordinary Small | Material`, weaken an explicit Change-Ready request or project-required qualification, or authorize deployment, release, installation, activation, credentials, or remote-state mutation.

The main session SHALL report `Pilot-Ready: yes` only when the same readable candidate has: one bounded outcome and non-goals; technically enforced operating-envelope limits; observable happy-path proof at the relevant real boundary; focused project-native validation; protection of applicable critical safety/data/authorization invariants; sufficient failure visibility; proportional disable, rollback, or containment for persistent/spreading effects; explicit user acceptance of every material residual pilot risk; and no uncontrolled authorization, privacy, data-integrity, irreversible-action, or envelope-escape risk.

A candidate MAY be `Pilot-Ready: yes` while `Change-Ready` is `not requested` or `no` only when the Change-Ready blocker is evidenced outside the pilot envelope and does not undermine candidate identity/scope, current proof, enforced containment, the pilot safety floor, applicable validation, or material-risk acceptance. Neither disposition SHALL imply that an external operation occurred.

#### Scenario: Limited pilot succeeds without full qualification request
- **WHEN** an Ordinary Small candidate proves its real-boundary outcome, enforces its limited operating envelope, passes focused validation, has no unaccepted material residual risk, and full qualification was not requested
- **THEN** the handoff MAY report `Pilot-Ready: yes`
- **AND** SHALL report `Change-Ready: not requested`
- **AND** SHALL report that external operations were not performed.

#### Scenario: Change-Ready blocker is outside pilot reachability
- **WHEN** full qualification rejects broad multi-tenant or scale readiness but the accepted pilot technically enforces a single-tenant bounded load and all pilot evidence remains trustworthy
- **THEN** `Change-Ready` MAY remain `no`
- **AND** the main session MAY retain `Pilot-Ready: yes` with the exact operating envelope and blocker separation.

#### Scenario: Change-Ready evidence gap also invalidates pilot evidence
- **WHEN** a qualification blocker makes the current candidate, real-boundary proof, enforced envelope, material-risk decision, or applicable validation outcome unreadable or untrustworthy
- **THEN** the main session SHALL report `Pilot-Ready: no`
- **AND** SHALL NOT treat the issue as formatting-only evidence polish.

#### Scenario: Pilot disposition does not deploy
- **WHEN** the candidate receives `Pilot-Ready: yes`
- **THEN** no deployment, release, activation, installation, credentialed operation, or remote mutation SHALL be implied or authorized
- **AND** any such operation SHALL require its existing separate explicit authority and project policy.

### Requirement: SDLC-014 Material pilot risk is approved without turning every finding into work
Before `Pilot-Ready: yes`, the main session SHALL present one compact bundle containing every material residual risk reachable inside the enforced pilot envelope and obtain explicit user acceptance. Each bundled risk SHALL state the reachable scenario, impact, containment, detection or recovery, evidence confidence, and why deferral preserves the value of the current increment. The bundle SHALL NOT require speculative numeric probability.

User acceptance SHALL NOT make uncontrolled authorization bypass, privacy exposure, data corruption/loss, irreversible external action, or envelope escape Pilot-Ready. Those risks SHALL require containment, scope reduction, correction, or `Pilot-Ready: no`. P2/note, wording, optional evidence, unreachable future behavior, and theoretical coverage findings SHALL remain visible as Residual Risks or non-authorizing Follow-up Candidates and SHALL NOT require a user question.

#### Scenario: Contained material residual risk requires one decision
- **WHEN** a reachable pilot limitation can cause a material but bounded and recoverable failure and the safety floor otherwise passes
- **THEN** the main session SHALL include it in one material-risk acceptance bundle
- **AND** SHALL wait for explicit user acceptance before reporting `Pilot-Ready: yes`.

#### Scenario: Minor risk does not create approval ceremony
- **WHEN** a finding is low-impact wording, optional evidence, coverage-only, or unreachable future behavior
- **THEN** it SHALL be reported without asking the user to approve it
- **AND** SHALL NOT block Pilot-Ready by itself.

#### Scenario: User acceptance cannot waive an uncontrolled critical risk
- **WHEN** the pilot can reach an authorization bypass, private-data exposure, uncontrolled data loss, irreversible external action, or its declared envelope can escape
- **THEN** the candidate SHALL remain `Pilot-Ready: no` until the behavior is contained, removed, or corrected
- **AND** a user preference for speed alone SHALL NOT satisfy the pilot safety floor.

### Requirement: SDLC-015 Review disposition is reachability-based and remedy-minimal
Reviewers SHALL continue to report all evidence-backed findings. A finding SHALL block Pilot-Ready only when evidence shows that its scenario is reachable inside the accepted enforced pilot envelope and that it violates the current accepted outcome, a pilot safety-floor item, a non-deferrable invariant, an explicitly accepted risk limit, or applicable trusted mandatory validation. A severity label alone SHALL NOT establish those conditions.

Reviewer recommendations SHALL use existing finding fields and SHALL identify the smallest sufficient remedy or explain why removal, scope reduction, reuse, a local guard, or explicit deferral cannot make the current increment safe. Reviewers SHALL NOT add a separate action-authoring field. A finding MAY block Change-Ready under its stricter existing contract without blocking Pilot-Ready when its impact is proven outside the pilot envelope.

Missing evidence SHALL block Pilot-Ready only when it prevents establishing the readable candidate/scope, current proof, enforced envelope, safety-floor compliance, material-risk acceptance, or an applicable trusted validation result. Missing headings, section ordering, duplicated provenance, report formatting, or optional packaging detail SHALL remain residual unless it makes one of those facts unreadable or untrustworthy.

#### Scenario: Future-scale finding remains visible but non-blocking
- **WHEN** a reviewer proves a future high-load limitation that cannot be reached under the enforced bounded pilot load
- **THEN** the reviewer SHALL report the finding and its future impact
- **AND** SHALL route it to Residual Risks or a non-authorizing Follow-up Candidate rather than block Pilot-Ready.

#### Scenario: Reachable invariant violation blocks
- **WHEN** a reviewer proves that the current pilot can violate its accepted data-integrity or authorization invariant
- **THEN** the finding SHALL block Pilot-Ready
- **AND** its recommendation SHALL first consider removal, narrowing, reuse, or a local guard before a new subsystem.

#### Scenario: Evidence format polish does not block
- **WHEN** candidate scope, proof, envelope, validation, and accepted material risks are directly readable but an optional report heading, order, or duplicate provenance field is imperfect
- **THEN** the imperfection SHALL remain non-blocking evidence polish for Pilot-Ready
- **AND** SHALL NOT trigger candidate mutation or gate replay.

#### Scenario: Semantic evidence gap blocks
- **WHEN** incomplete evidence prevents the reviewer or main session from determining which candidate ran or whether its enforced envelope and critical invariant were proven
- **THEN** the gap SHALL block Pilot-Ready
- **AND** SHALL name the exact unknowable fact rather than a formatting preference.

### Requirement: SDLC-016 Existing validators enforce explicit pilot policy without judging risk semantics
Existing deterministic contract and validator owners SHALL require the canonical Pilot-Ready disposition, separate Change-Ready meaning, enforced-envelope marker, material-risk approval marker, minimum-remedy order, and reachability-based blocking marker on their configured authority surfaces. They SHALL reject a third profile, remote-operation implication, prose-only containment, blanket user-waiver language for uncontrolled critical risk, duplicated canonical policy blocks, and evidence-format polish presented as an unconditional Pilot-Ready blocker.

Deterministic helpers SHALL inspect explicit headings, fields, markers, paths, and configured text only. They SHALL NOT infer risk severity, reachability, materiality, user acceptance, or safe containment from fuzzy prose. The implementation SHALL extend existing `tools/contracts/`, `tools/validators/`, and focused existing test modules and SHALL NOT create a new validator framework, runtime service, or evidence store.

#### Scenario: Validator accepts two dispositions and two profiles
- **WHEN** loaded authority retains exactly `Ordinary Small | Material` profiles and adds `Pilot-Ready` beside `Change-Ready` as an output disposition
- **THEN** existing strict validation SHALL accept the structure
- **AND** SHALL NOT require or infer a third lifecycle profile.

#### Scenario: Validator rejects deployment implication
- **WHEN** an authority surface states or implies that `Pilot-Ready: yes` authorizes deployment, activation, credentials, or remote mutation
- **THEN** deterministic validation SHALL fail and name the offending surface.

#### Scenario: Helper does not classify natural-language risk
- **WHEN** a finding describes a potential pilot risk in natural language
- **THEN** deterministic tooling SHALL NOT assign reachability, severity, materiality, or acceptance
- **AND** those judgments SHALL remain with the main session and reviewers using evidence.
