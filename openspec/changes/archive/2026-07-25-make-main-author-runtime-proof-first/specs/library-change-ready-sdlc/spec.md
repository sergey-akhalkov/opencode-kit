## REMOVED Requirements

### Requirement: SDLC-001 Runtime SDLC uses Ordinary Small default and conditional Material qualification

**Reason**: The Change-Ready disposition and mandatory reviewer gates are superseded by the Development-Stage lifecycle, optional review, and critical-only Material SDET.

**Migration**: Use the new simple lifecycle, RC, stable, Material SDET, optional-review, and proportional Ordinary Small requirements below.

### Requirement: SDLC-002 Scope expansion requires explicit user approval

**Reason**: The closed-world correction-wave wording is superseded by accepted-outcome authority, protected boundaries, and the critical-only post-MVP stop line.

**Migration**: Use the new post-MVP stop-line and non-authorizing review requirements together with the current loaded outcome-authority contract.

### Requirement: SDLC-003 Proportional briefing and role separation when invoked

**Reason**: Its old SDET action enum and mandatory final/delivery gates conflict with the current critical-only SDET and optional-review model.

**Migration**: Use the new Material SDET, optional-review, and proportional Ordinary Small requirements below.

### Requirement: SDLC-004 Candidate Reference replaces universal dual identity

**Reason**: Candidate Reference remains implementation evidence, but the old Change-Ready disposition wording is no longer an active lifecycle contract.

**Migration**: Use the new RC/stable requirements and current loaded Candidate Reference contract.

### Requirement: SDLC-005 Static contracts and validators enforce the new model

**Reason**: Its Change-Ready, finite-wave, and mandatory-review markers are superseded by explicit Development-Stage semantics.

**Migration**: Use the new lifecycle requirements and the instruction-artifact validator requirement in this change.

### Requirement: SDLC-006 Qualification is finite and cannot create evidence products

**Reason**: Mandatory final/delivery review and fixed correction-wave qualification are superseded by optional review and convergent critical-only SDET.

**Migration**: Use the new RC, stable, post-MVP stop-line, Material SDET, and optional-review requirements below.

### Requirement: SDLC-013 Pilot-Ready is separate from Change-Ready

**Reason**: Pilot-Ready and Change-Ready are removed as active lifecycle aliases.

**Migration**: Use `Development-Stage: development | MVP | RC<n> | stable`.

### Requirement: SDLC-014 Material pilot risk is approved without turning every finding into work

**Reason**: Pilot-specific risk acceptance is superseded by the MVP/RC/stable lifecycle and the non-deferrable risk floor.

**Migration**: Use the new post-MVP stop-line and critical/non-deferrable disposition requirements.

### Requirement: SDLC-015 Review disposition is reachability-based and remedy-minimal

**Reason**: The Pilot-Ready/Change-Ready review split is removed; reviewer evidence is now optional and non-authorizing.

**Migration**: Use the new optional-review and post-MVP stop-line requirements.

### Requirement: SDLC-016 Existing validators enforce explicit pilot policy without judging risk semantics

**Reason**: Pilot-Ready and Change-Ready validator markers are superseded by explicit Development-Stage semantics.

**Migration**: Use the new lifecycle requirements and current deterministic validator contracts.

## ADDED Requirements

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

After MVP, mandatory work SHALL be limited to incomplete accepted scope and reproduced accepted-outcome, critical, or non-deferrable defects. Known non-critical bugs, optional coverage, maintainability, style, wording, evidence formatting, diagnostics, optimization, and future-scale work SHALL be documented and parked and SHALL NOT block RC or stable.

#### Scenario: Non-critical post-MVP finding is parked
- **WHEN** main confirms a reachable non-critical limitation after MVP
- **THEN** the limitation SHALL be documented and parked
- **AND** it SHALL NOT authorize mandatory candidate mutation or block RC/stable.

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
