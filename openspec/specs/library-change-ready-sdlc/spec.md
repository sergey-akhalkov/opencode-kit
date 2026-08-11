# library-change-ready-sdlc Specification

## Purpose
Define proportional Change-Ready routing that prioritizes a minimal observable happy path for Ordinary Small work while preserving explicit scope control and full qualification for concrete Material risks.
## Requirements
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

### Requirement: The lifecycle uses one simple development stage

Every repository-changing session SHALL report exactly one `Development-Stage: development | MVP | RC<n> | stable` field. Active authority SHALL NOT retain `Change-Status`, `Done-Done`, Pilot-Ready, Change-Ready, or hidden lifecycle aliases.

#### Scenario: Unproved work remains development
- **WHEN** the current candidate lacks representative happy-path proof
- **THEN** Development-Stage SHALL remain `development`.

#### Scenario: Real happy path earns MVP
- **WHEN** the smallest complete accepted end-to-end happy path is invoked with representative input and observed meaningful output or side effects
- **THEN** Development-Stage SHALL become `MVP`
- **AND** compilation, static checks, unit tests, or mocked helpers alone SHALL NOT satisfy this scenario.

### Requirement: RC means release candidate

The next monotonic `RC<n>` SHALL be assigned only when accepted scope is complete, current MVP proof exists, applicable project-native validation is green, applicable Material critical SDET is terminal and usable, and no known confirmed reachable critical or non-deferrable defect remains.

#### Scenario: Non-critical limitations do not block RC
- **WHEN** all RC requirements pass and only documented non-critical bugs, limitations, optional coverage gaps, maintainability work, or optimization remain
- **THEN** the candidate MAY become the next RC
- **AND** those items SHALL remain recorded rather than forced into the current scope.

#### Scenario: Critical defect blocks RC
- **WHEN** a known confirmed reachable critical or non-deferrable defect remains
- **THEN** Development-Stage SHALL remain `MVP` until correction and requalification.

### Requirement: Stable means locally complete

An RC SHALL become `stable` when its local handoff is complete and all applicable critical/safety/validation gates remain green. No mandatory soak-time threshold SHALL apply. The handoff SHALL record `Stable Candidate: RC<n>`.

#### Scenario: Stable does not perform release
- **WHEN** a candidate becomes stable
- **THEN** deployment, release, publication, installation, activation, credentials, destructive action, and remote mutation SHALL remain separately authorized
- **AND** `External Operations: not performed` SHALL be reported unless separately authorized and observed.

### Requirement: Candidate mutation invalidates RC and stable

Any candidate-affecting production, test, fixture, configuration, instruction, or generated-output mutation SHALL return Development-Stage to `development`. Current representative proof SHALL restore `MVP`; complete requalification SHALL assign `RC<n+1>` without resetting root RC history.

#### Scenario: RC mutation requires a new candidate number
- **WHEN** an `RC<n>` candidate receives a candidate-affecting mutation
- **THEN** Development-Stage SHALL return to `development`
- **AND** current representative proof SHALL restore only `MVP`
- **AND** complete requalification SHALL assign `RC<n+1>`.

### Requirement: Post-MVP work stops at critical boundaries

After MVP, mandatory work SHALL be limited to incomplete accepted scope, evidence-backed session improvements admitted into the active OpenSpec `tasks.md` under the owner-approved persistence contract, and reproduced accepted-outcome, critical, or non-deferrable defects. An admitted improvement task becomes accepted scope and SHALL remain required until its stated implementation, observable proof, and validation pass or the owner explicitly changes accepted scope.

Current-change architecture and diagnostic non-degradation obligations SHALL be accepted-scope implementation rather than post-MVP cleanup. Known non-critical bugs, optional coverage, pre-existing maintainability debt, style, wording, evidence formatting, diagnostic polish, optimization, and future-scale work that did not pass the improvement admission gate SHALL be documented and parked and SHALL NOT block RC or stable.

#### Scenario: Non-critical post-MVP finding is parked
- **WHEN** main confirms a reachable non-critical limitation after MVP and it does not pass the session-improvement admission gate
- **THEN** the limitation SHALL be documented and parked
- **AND** it SHALL NOT authorize mandatory candidate mutation or block RC/stable.

#### Scenario: Admitted improvement becomes accepted scope
- **WHEN** an evidence-backed local reversible low-cost improvement is causally linked to the original goal, does not expand scope, and is appended to the active `tasks.md`
- **THEN** it SHALL be implemented and proven before RC/stable or normal complete archive
- **AND** it SHALL NOT be reclassified as optional polish merely because MVP already exists.

### Requirement: Material SDET is critical-only and convergent

For Material behavior changes, fresh test-only SDET SHALL run after current MVP proof and accepted-scope completion. It SHALL return exactly `critical-risks-reported | no-critical-risk | blocked` and author only the smallest critical reproducer/regression oracle.

Another attempt SHALL require an immediately-prior main-confirmed critical defect, production fix, and new current proof. The first precondition-valid attempt without a confirmed critical defect SHALL permanently stop SDET for the root. Non-critical findings SHALL NOT prolong SDET.

#### Scenario: No confirmed critical defect stops SDET
- **WHEN** the first precondition-valid Material SDET attempt yields no main-confirmed critical defect
- **THEN** SDET SHALL stop permanently for the root
- **AND** non-critical findings SHALL be parked.

### Requirement: Non-SDET review is optional evidence

Read-only final, delivery, code-quality, and domain reviewers MAY run after MVP only for concrete risk, project policy, or owner request. Their absence, timeout, malformed output, or disagreement SHALL NOT by itself block a stage. Reviewer evidence SHALL NOT authorize mutation or lifecycle decisions.

Every plausible non-deferrable authorization, privacy, data-integrity, irreversible-action, or envelope-escape claim SHALL still be reproduced, disproved, or shown unreachable by main before RC/stable.

#### Scenario: Missing optional reviewer does not block stage
- **WHEN** no concrete risk, project policy, or owner request requires a non-SDET reviewer
- **THEN** no reviewer launch or report SHALL be required for RC or stable.

### Requirement: Ordinary Small remains proportional

Ordinary Small SHALL reach MVP through main-owned representative proof, RC through accepted-scope completion and focused validation with no known critical/non-deferrable defect, and stable through local handoff. It SHALL NOT acquire mandatory reviewers or SDET solely to advance stage when no project, risk, or owner rule requires them.

#### Scenario: Ordinary Small advances without Material ceremony
- **WHEN** bounded local work has current MVP proof, complete accepted scope, green focused validation, and no known critical/non-deferrable defect
- **THEN** it MAY advance to RC and stable without SDET or reviewer evidence.

### Requirement: Current work preserves local comprehension

Human-written production changes SHALL keep the changed behavior understandable through targeted reads of a cohesive owner and narrow neighbors. Line count SHALL be a navigation signal rather than a hard quota. A change SHALL NOT add a new responsibility to an already mixed file or materially worsen change locality, testability, or navigation without extracting one cohesive responsibility or recording a `split-or-justify` decision. Existing unrelated debt MAY remain parked, and the requirement SHALL NOT justify speculative abstractions, wrapper-only micro-files, or broad unrelated refactoring.

#### Scenario: Large cohesive file remains intact
- **WHEN** a touched file is large but has one clear owner and the current behavior remains locally understandable and testable
- **THEN** line count alone SHALL NOT require a split.

#### Scenario: New responsibility reaches mixed code
- **WHEN** a current change would add a responsibility to a human-written file that already mixes unrelated owners
- **THEN** the implementation SHALL extract one cohesive owner within the accepted dependency closure or record why a split would increase current risk
- **AND** SHALL NOT defer its own structural degradation as pre-existing debt.

### Requirement: Runtime behavior and proof retain diagnostic evidence

Behavior-changing work SHALL identify meaningful failure boundaries before implementation and use the project's existing logging/error mechanism. At the owning process, service, job, external-dependency, or persistence boundary, the implementation SHALL preserve the original exception cause and stack and provide structured privacy-safe operation/correlation context when useful. It SHALL log once at the owning boundary, avoid duplicate catch-and-rethrow logging and routine per-item noise, and SHALL NOT add an unrelated telemetry stack solely for compliance.

Runtime Proof SHALL preserve the exact invocation and representative input, Candidate/Environment identity, exit status, stdout/stderr, relevant logs and exceptions, observed side effects, and artifact paths. The production author SHALL inspect those diagnostics before mutation or another run. When they cannot distinguish realistic in-scope causes, the author SHALL add the smallest safe instrumentation at the owning boundary and recapture the affected proof lane rather than guess from a summary.

#### Scenario: Failed real-boundary proof has actionable evidence
- **WHEN** a representative invocation fails
- **THEN** the author SHALL receive preserved raw diagnostics and the original exception chain before correction
- **AND** another run SHALL occur only after the evidence is inspected or the exact missing diagnostic fact is identified.

#### Scenario: Routine success avoids log noise
- **WHEN** normal processing succeeds repeatedly or iterates over many items
- **THEN** the implementation SHALL NOT emit per-item success logs solely to satisfy observability
- **AND** meaningful failures SHALL remain attributable at their owning boundary.

### Requirement: Every behavior dependency chain gets the earliest safe real signal

For every behavior-changing slice, the active runtime authority SHALL identify and execute the earliest safely reachable real boundary rather than defer all real-system feedback to phase completion. The proof ladder SHALL distinguish deterministic offline or preserved replay, local integration or simulator, shadow/read-only real dependency, bounded live effects, and end-to-end user or operator workflow. Offline, unit, mock, replay, and simulator evidence SHALL remain useful fast feedback but SHALL NOT be represented as proof of a reachable real boundary.

The roadmap SHALL optimize time-to-first-real-signal. When a harness, identity check, independent effect suppression, capture schema, restoration procedure, or owner authorization packet is the smallest prerequisite for real feedback, that prerequisite SHALL precede more behavior that depends on the unverified real-system model.

#### Scenario: Read-only real characterization is safely reachable

- **WHEN** a feature can be exercised against a real dependency in an independently enforced read-only or no-effect envelope after separate owner authorization
- **THEN** the roadmap places the minimal harness and authorization gate before further dependent model expansion
- **AND** the authorized characterization records exact input, environment and initial state, output and state transitions, ordering, timing, failures, recovery, cleanup, and restoration.

#### Scenario: Only offline evidence is currently reachable

- **WHEN** the next real boundary is unavailable, unauthorized, unsafe, or blocked by a live-attempt gate
- **THEN** the current slice executes the highest-fidelity safe offline or local boundary
- **AND** records the exact blocker, earliest unblocking task, required authorization and safeguards, restoration procedure, and expected real evidence.

### Requirement: Unknown real behavior stops only dependent expansion

When missing, unobservable, or mismatched real behavior can invalidate planned downstream behavior, the main session SHALL stop adding behavior in that dependency chain until characterization or equivalence evidence resolves the uncertainty. Independent work that does not rely on that uncertainty MAY continue. If owner authorization or external capability is the remaining blocker, the main session SHALL raise the decision at the first safe, decision-ready gate rather than defer it to final qualification.

#### Scenario: Emulator behavior relies on an uncharacterized state transition

- **WHEN** the next emulator layer depends on a real-system state transition whose output, ordering, side effects, or recovery semantics are unknown
- **THEN** dependent emulator expansion stops before that layer
- **AND** independent parser, diagnostics, or harness work MAY continue when it does not assume the unknown transition.

### Requirement: Shift-left sequencing does not grant live authority

The shift-left contract SHALL NOT authorize credentials, remote or shared-environment access, physical effects, destructive or irreversible action, deployment, installation, activation, release, publication, or owner-controlled cost. Existing protected-boundary decisions, fail-closed safety and identity guards, restoration and cleanup, immutable evidence, equivalence requirements, and blocked-live-attempt offline replay SHALL remain controlling.

Early per-slice characterization and Runtime Proof SHALL remain production-author responsibilities, including the Proof Runner, capture/evaluator, and restoration tooling needed to obtain observations. Automated test harnesses, fixtures, simulators, goldens, and test-oracle artifacts SHALL remain SDET-owned. Material fresh critical-only SDET SHALL remain after current MVP proof and accepted-scope completion.

#### Scenario: A real boundary requires physical access

- **WHEN** the first useful real observation requires a physical, credentialed, shared, costly, or otherwise owner-controlled operation
- **THEN** local harness and safety preparation MAY proceed
- **AND** no live request occurs before exact owner authorization and all applicable fail-closed gates are green.

