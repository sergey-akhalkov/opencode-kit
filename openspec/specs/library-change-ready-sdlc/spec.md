# library-change-ready-sdlc Specification

## Purpose
Define proportional Change-Ready routing that prioritizes a minimal observable happy path for Ordinary Small work while preserving explicit scope control and full qualification for concrete Material risks.
## Requirements
### Requirement: SDLC-001 Runtime SDLC uses Ordinary Small default and conditional Material qualification

The portable runtime instructions SHALL default clear, bounded, local, reversible work with known focused validation and no concrete named high-risk boundary to **Ordinary Small**. Ordinary Small SHALL NOT require loading `change-ready-sdlc` merely because code, config, or generated-output behavior changes. Ordinary Small SHALL allow the main session to author production changes directly, prove the happy path observably, run focused validation, inspect only realistic requirement-linked edge cases, and optionally create or update the smallest focused regression test after happy-path proof. Ordinary completion SHALL report `Change-Ready: not requested` and SHALL NOT claim full qualification.

The portable runtime instructions SHALL load `change-ready-sdlc` before the first mutation only when at least one applies: explicit Change-Ready request; project-required qualification; or concrete Material risk involving public API/protocol/compatibility semantics, persisted data or migration, security/privacy/authorization, destructive or remote action, concurrency correctness, deployment/release, or a loaded instruction/configuration change that alters lifecycle or safety policy.

Unknown SHALL escalate to Material only when it can materially change accepted behavior or one of those named risk domains. Missing optional adapters or generic uncertainty alone SHALL NOT force Material. High-risk behavior SHALL NOT be downgraded merely because the diff is small.

Material and explicit Change-Ready work SHALL retain independent risk testing, complete applicable validation, fresh final review, and Material delivery review when required.

#### Scenario: one-line local behavior change stays Ordinary Small

- **GIVEN** a clear one-line or local behavior change with known focused validation and no named high-risk boundary
- **WHEN** the main session classifies and implements the work
- **THEN** it SHALL use direct main implementation, observable proof, and focused validation
- **AND** SHALL NOT mandatorily load `change-ready-sdlc`, dispatch fresh SDET, require dual identity/Identity Recipe, final-candidate review, or Material delivery ceremony
- **AND** SHALL report `Change-Ready: not requested`.

#### Scenario: small bug fix with sufficient existing tests

- **GIVEN** a small bug with a known reproducer and sufficient existing focused tests
- **WHEN** the main session fixes it on the Ordinary Small path
- **THEN** it SHALL reproduce, apply the minimal fix, prove the happy path, and run the existing focused test
- **AND** SHALL NOT invent a framework or mandatorily author new tests when existing tests suffice.

#### Scenario: realistic edge defect after proof stays in-scope

- **GIVEN** a realistic edge defect found after happy-path proof that traces to accepted behavior or the changed boundary
- **WHEN** the main session corrects it
- **THEN** it SHALL apply only the smallest in-scope correction and focused regression evidence
- **AND** SHALL NOT expand into theoretical coverage polish without owner approval.

#### Scenario: unrequested abstraction requires approval

- **GIVEN** an optional abstraction, feature, config, tooling, or hardening idea is not part of accepted behavior
- **WHEN** the agent considers implementing it
- **THEN** it SHALL propose it to the user
- **AND** SHALL NOT implement it until explicit user approval.

#### Scenario: ambiguous public or security semantics block before mutation

- **GIVEN** public API/protocol, security/privacy/authorization, or persisted-data semantics are unresolved in a way that can materially change accepted behavior
- **WHEN** the orchestrator prepares mutation
- **THEN** it SHALL ask or block before mutation
- **AND** SHALL select Material when a named Material trigger applies.

#### Scenario: named Material risks retain qualification gates

- **GIVEN** security, persisted-data/migration, destructive/remote, concurrency correctness, deployment, or compatibility risk is present
- **WHEN** the orchestrator classifies the task
- **THEN** it SHALL load `change-ready-sdlc` before mutation
- **AND** SHALL require Applicable Proof, fresh SDET (or evidence-backed non-behavioral N/A), complete validation, fresh final review, and Material delivery when Material applies.

#### Scenario: explicit Change-Ready does not become the later default

- **GIVEN** the user requested Change-Ready for one change and that qualification completed
- **WHEN** a later Ordinary Small request arrives
- **THEN** the agent SHALL use the Ordinary Small default path again
- **AND** SHALL NOT keep full qualification as the default merely because a prior change used it.

#### Scenario: unrelated baseline validation debt stays attributed

- **GIVEN** baseline inventory debt exists in an out-of-scope file such as an 839-line split candidate
- **WHEN** the candidate is validated
- **THEN** the debt SHALL be attributed as unrelated baseline
- **AND** SHALL NOT trigger unrelated fixes inside this change.

### Requirement: SDLC-002 Scope expansion requires explicit user approval

Autonomous work MAY include only changes that directly satisfy a frozen acceptance criterion inside the frozen artifact/write scope. After the first candidate mutation, the scope SHALL be closed-world and MAY only shrink. No reviewer, SDET, validation result, delivery gate, severity label, P0/P1 finding, mandatory-gate failure, unknown, or missing capability SHALL authorize a new acceptance criterion, task, gate, write path, artifact, evidence tool, or implementation action.

A serious finding MAY bind readiness and require `Change-Ready: no` without authorizing correction. A current-change correction SHALL be allowed only when the finding references a frozen criterion, has a concrete reproducer, is attributable to the current candidate relative to baseline, is completely correctable inside the frozen scope without persistent evidence infrastructure, and the single predeclared correction wave remains unused.

Any user-approved expansion after freeze SHALL create an explicit new revision or separate change with a new scope capsule and invalidated prior qualification evidence; it SHALL NOT silently enlarge the frozen revision. P2/note/theoretical/coverage-only items SHALL remain residual or separately approved follow-up.

#### Scenario: post-mutation polish is residual

- **GIVEN** final review or delivery reports only P2/note wording or coverage polish
- **WHEN** the orchestrator routes the finding
- **THEN** it SHALL place the item in Residual Risks or a separately approved follow-up
- **AND** SHALL NOT treat it as `Blocking Evidence` or autonomous scope expansion solely for polish.

#### Scenario: candidate-attributable defect receives one in-scope correction

- **WHEN** a reproducer proves that the current candidate violates frozen criterion `AC-2`, baseline evidence attributes the violation to the candidate, the complete fix fits the frozen write scope, and the correction wave is unused
- **THEN** the orchestrator MAY route exactly one bounded correction
- **AND** SHALL replay only the affected frozen gates.

#### Scenario: out-of-scope P0 blocks without expanding work

- **WHEN** a reviewer finds a reproducible P0 defect whose complete correction requires an unfrozen path, artifact, criterion, gate, or capability
- **THEN** the finding SHALL bind `Change-Ready: no`
- **AND** SHALL route an owner decision or separate prerequisite/follow-up change
- **AND** SHALL NOT authorize mutation of the frozen candidate.

#### Scenario: unknown does not become implementation authority

- **WHEN** a post-freeze risk, cause, ownership decision, or validation result is unknown
- **THEN** the orchestrator MAY perform bounded read-only investigation
- **AND** SHALL otherwise record residual risk or a terminal external blocker
- **AND** SHALL NOT create implementation work from the unknown alone.

#### Scenario: broad all-tasks request uses the frozen snapshot

- **WHEN** the user requested implementation of all OpenSpec tasks and the task IDs were frozen before candidate mutation
- **THEN** only that frozen task-ID snapshot SHALL define the current revision
- **AND** later task additions SHALL require a new user-approved revision or separate change.

#### Scenario: owner expansion creates a new revision

- **WHEN** the user approves a new acceptance criterion, task, gate, path, artifact, or domain after freeze
- **THEN** the current qualification attempt SHALL terminate
- **AND** the expansion SHALL be recorded as a new revision or separate change with a new scope capsule and fresh evidence.

### Requirement: SDLC-003 Proportional briefing and role separation when invoked

Ordinary Small direct main-session work SHALL use a compact record: objective, in-scope/non-goals, acceptance proof, focused validation, forbidden actions, and return status. The full Universal Task Briefing Contract field list SHALL NOT be required for direct Ordinary Small work. Delegated Ordinary Small MAY keep the Universal contract concise and mark irrelevant fields `N/A - <reason>`. Material and cold-context handoffs SHALL remain complete.

`implementation-worker` SHALL remain production-only when used. Same-slice continuation SHALL require Candidate Reference or reviewable diff plus reproducer, continuous objective text, brief delta, and unchanged forbidden actions; it SHALL NOT mandate dual identities or Identity Recipe.

When SDET is invoked, `sdet-quality-engineer` SHALL remain fresh and test-only, return exactly one action `authored-tests | assessed-existing-tests | blocked`, and SHALL NOT use a mandatory provisional/final dual-identity handshake. Main owns post-test proof/validation.

`final-candidate-reviewer` SHALL be a qualification gate, not an ordinary Ordinary Small completion gate. Missing dual identity/Identity Recipe SHALL NOT universally block when the complete candidate is otherwise readable.

`session-delivery-reviewer` SHALL remain required for Material/full delivery. Candidate continuity SHALL use readable scoped candidate/diff/manifest evidence. Detailed rollback SHALL be required only when migration, destructive state, deployment/activation, or substantial multi-surface risk makes it relevant.

`implementation-readiness-reviewer` and `test-coverage-reviewer` SHALL NOT turn optional adapters, inferred edge cases, or theoretical risks into new acceptance scope.

#### Scenario: Ordinary Small direct brief stays compact

- **GIVEN** Ordinary Small work is implemented directly by main
- **WHEN** the session records the task
- **THEN** a compact objective/scope/proof/validation/forbidden/return record is sufficient
- **AND** the full 17-field delegation brief is not required.

#### Scenario: SDET single report action

- **GIVEN** Material qualification invokes fresh SDET after Applicable Proof
- **WHEN** SDET finishes assessment
- **THEN** it SHALL return exactly one report with action `authored-tests | assessed-existing-tests | blocked`
- **AND** main SHALL own post-test proof and complete validation.

### Requirement: SDLC-004 Candidate Reference replaces universal dual identity

Portable runtime and role prompts SHALL NOT require universal `Semantic Candidate Identity`, `Package Identity`, and `Identity Recipe`. Full qualification SHALL use a project-native **Candidate Reference** (diff, snapshot, manifest, revision, or equivalent readable evidence). Candidate Reference SHALL NOT be required for Ordinary Small completion.

Concurrent-writer liveness protection SHALL apply to actual asynchronous/concurrent mutation-capable executions and SHALL NOT impose the full liveness protocol on ordinary synchronous direct edits. Rollback planning SHALL be proportional and conditional.

#### Scenario: Ordinary Small needs no Candidate Reference

- **GIVEN** Ordinary Small work completes with proof and focused validation
- **WHEN** readiness is reported
- **THEN** missing Candidate Reference SHALL NOT block
- **AND** the report SHALL use `Change-Ready: not requested`.

#### Scenario: Material qualification uses readable candidate evidence

- **GIVEN** Material qualification is in progress
- **WHEN** proof, SDET, validation, final review, or delivery inspects continuity
- **THEN** they SHALL use readable scoped candidate/diff/manifest evidence
- **AND** SHALL NOT universally block solely because dual identity fields are absent.

### Requirement: SDLC-005 Static contracts and validators enforce the new model

Static contracts and validators SHALL require Ordinary Small direct-main path wording, happy path before edge testing, closed-world post-freeze scope, exclusive user scope authority, non-authorizing blockers, named Material triggers, explicit Change-Ready routing, `Change-Ready: not requested`, role separation when SDET/final review is invoked, finite qualification waves, and protection of unrelated work and remote/destructive authority.

Static validators SHALL reject old universal anti-patterns including exact phrases equivalent to: `Any false or unknown condition selects Material`; `Every behavior change still receives fresh independent SDET assessment`; universal direct-main prohibition for all behavior-changing work; mandatory Identity Recipe dual-identity wording; P0/P1 or mandatory-gate findings authorizing new acceptance scope; reviewer/SDET output containing `Required Next Actions` or `Actionable Continuation Items`; persistent evidence tooling added because a current gate cannot run; and correction replay beyond the single frozen correction wave.

Active-authority ordered skill headings SHALL match the simplified qualification lifecycle and SHALL NOT require identity-specific headings/tokens. Helper code SHALL NOT encode fuzzy risk classification, semantic scope inference, or reviewer severity judgment.

#### Scenario: validator accepts Ordinary Small default

- **GIVEN** global AGENTS defines Ordinary Small default and `Change-Ready: not requested`
- **WHEN** `validate:strict` runs after this change
- **THEN** the routing validators SHALL pass the new positive tokens
- **AND** SHALL fail if old universal anti-pattern needles are reintroduced.

#### Scenario: skill authority uses Candidate Reference heading

- **GIVEN** the canonical skill body is validated structurally
- **WHEN** ordered lifecycle headings are checked
- **THEN** Candidate Reference SHALL appear in the qualification sequence
- **AND** dual-identity Identity Recipe headings SHALL NOT be required.

#### Scenario: validator accepts closed-world authority

- **WHEN** `validate:strict` scans the loaded global routing, canonical skill, qualification roles, and project-facing mirrors
- **THEN** every authority surface SHALL state that rejection may bind readiness but never authorize scope expansion
- **AND** the validation SHALL pass when the exact frozen-scope and finite-wave markers are present.

#### Scenario: validator rejects P0 scope authorization

- **WHEN** an authority surface states that a P0/P1 finding or mandatory-gate failure may add a criterion, task, path, evidence tool, or correction outside frozen scope
- **THEN** deterministic validation SHALL fail and name the offending surface.

#### Scenario: validator rejects reviewer and SDET action lists

- **WHEN** a reviewer or SDET output contract contains `changes_requested`, `Required Next Actions`, `Actionable Continuation Items`, or an equivalent action-authoring field
- **THEN** deterministic validation SHALL fail
- **AND** SHALL require accept-or-reject plus `Blocking Evidence` and non-authorizing `Follow-up Candidates`.

#### Scenario: helper remains deterministic

- **WHEN** the validator evaluates the scope-firewall contract
- **THEN** it SHALL check explicit headings, fields, markers, forbidden phrases, and configured surfaces
- **AND** SHALL NOT infer severity, root cause, semantic scope, or correction eligibility from fuzzy text.

### Requirement: SDLC-006 Qualification is finite and cannot create evidence products

Before candidate mutation, Material work SHALL freeze acceptance IDs, task IDs, write roots, exact allowed additions, forbidden artifacts, mandatory gate IDs and procedures, baseline gate outcomes, one initial fresh SDET, one correction wave, at most one fresh corrected-candidate SDET when that correction is consumed, one final review, one delivery review, and a stop line in a readable project-native scope capsule.

A mandatory gate SHALL be current-change authority only when it was frozen with its trusted source and baseline outcome. A baseline failure, later-discovered gate, or missing prerequisite capability MAY block readiness but SHALL NOT authorize baseline cleanup or new current-change work.

Persistent infrastructure introduced solely to qualify the current candidate, including a reusable harness, validator framework, benchmark system, simulator, ledger, generator, or cross-repository runner, SHALL require a separate prerequisite change. Final and delivery review SHALL be accept-or-reject gates and SHALL NOT initiate autonomous correction or replay.

#### Scenario: baseline gate failure remains external

- **WHEN** a proposed mandatory gate already failed on the recorded baseline and baseline remediation is not the frozen primary outcome
- **THEN** the gate SHALL NOT attribute the failure to the candidate
- **AND** SHALL route a user decision or separate prerequisite change instead of baseline cleanup inside the current change.

#### Scenario: missing evidence infrastructure becomes a prerequisite

- **WHEN** qualification would require a new persistent harness, validator framework, benchmark system, simulator, ledger, generator, or cross-repository runner
- **THEN** the current change SHALL report the missing prerequisite and `Change-Ready: no` when the evidence is mandatory
- **AND** SHALL NOT add that infrastructure to the current candidate.

#### Scenario: second serious failure terminates the attempt

- **WHEN** the single correction wave has been consumed and another serious or mandatory failure remains or appears
- **THEN** the current qualification attempt SHALL terminate with `Change-Ready: no`
- **AND** SHALL NOT dispatch another autonomous correction or replay wave.

#### Scenario: corrected-candidate SDET cannot reopen correction

- **WHEN** the single correction wave is consumed
- **THEN** one new fresh SDET MAY assess the corrected candidate
- **AND** any serious finding from that assessment SHALL terminate the attempt rather than authorize a second correction.

#### Scenario: final review rejection is terminal

- **WHEN** Final Candidate Review returns `rejected` or `blocked`
- **THEN** the current qualification attempt SHALL terminate
- **AND** the reviewer SHALL provide `Blocking Evidence` and non-authorizing `Follow-up Candidates` only
- **AND** correction SHALL require a new user-approved revision or separate change.

#### Scenario: delivery rejection is terminal

- **WHEN** the Material delivery review rejects or blocks the candidate
- **THEN** the candidate SHALL remain `Change-Ready: no`
- **AND** the delivery reviewer SHALL NOT authorize candidate mutation or gate replay.

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
