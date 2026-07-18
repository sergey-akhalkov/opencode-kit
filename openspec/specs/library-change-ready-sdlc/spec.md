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

Autonomous work MAY include only changes necessary for accepted behavior or a concrete serious defect inside the accepted boundary. Any unrequested feature, abstraction, compatibility behavior, configuration, tooling, hardening, adjacent cleanup, new acceptance criterion, or other scope expansion MUST be proposed to the user and MUST NOT be implemented until explicitly approved. P2/note/theoretical/coverage-only items SHALL remain residual or separately approved follow-up.

#### Scenario: post-mutation polish is residual

- **GIVEN** final review or delivery reports only P2/note wording or coverage polish
- **WHEN** the orchestrator routes the finding
- **THEN** it SHALL place the item in Residual Risks or a separately approved follow-up
- **AND** SHALL NOT treat it as a blocking Required Next Action or autonomous scope expansion.

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

Static contracts and validators SHALL require Ordinary Small direct-main path wording, happy path before edge testing, explicit scope-expansion approval, named Material triggers, explicit Change-Ready routing, `Change-Ready: not requested`, role separation when SDET/final review is invoked, and protection of unrelated work and remote/destructive authority.

Static validators SHALL reject old universal anti-patterns including exact phrases equivalent to: `Any false or unknown condition selects Material`; `Every behavior change still receives fresh independent SDET assessment`; universal direct-main prohibition for all behavior-changing work; and mandatory Identity Recipe dual-identity wording.

Active-authority ordered skill headings SHALL match the simplified qualification lifecycle and SHALL NOT require identity-specific headings/tokens. Helper code SHALL NOT encode fuzzy risk classification.

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
