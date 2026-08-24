## ADDED Requirements

### Requirement: Ordinary Small reports verified outcome without qualification bookkeeping
Ordinary Small work SHALL report `Outcome: working | blocked | unknown`, representative runtime proof, applicable focused validation, and known limitations. It SHALL NOT assign RC numbers, promote stable, preserve RC history, or require a `Development-Stage` field unless the user explicitly requests qualification or project policy requires it.

#### Scenario: Bounded local fix is complete
- **WHEN** a bounded local change has a green representative happy path, complete accepted scope, green focused validation, and no known non-deferrable defect
- **THEN** its handoff reports `Outcome: working` with proof and validation
- **AND** contains no RC or stable ceremony.

### Requirement: Qualification stages are scoped to explicit qualification
The `Development-Stage: development | MVP | RC<n> | stable` lifecycle SHALL apply only when the user explicitly requests stable/full qualification, project policy requires qualification, or main enters qualification for a reachable named critical-risk class. Inside that track, representative proof, accepted scope, applicable validation, critical-risk disposition when triggered, monotonic RC numbering, candidate invalidation, and external-operation separation SHALL remain enforced.

#### Scenario: Material change has no qualification request or critical-risk trigger
- **WHEN** a Material change alters loaded lifecycle instructions but has no reachable named critical incident and no explicit or project-required qualification
- **THEN** it completes with verified outcome reporting rather than RC/stable promotion
- **AND** retains all applicable safety, proof, and validation gates.

#### Scenario: Project requires qualification
- **WHEN** project policy requires qualification
- **THEN** the full Development-Stage lifecycle applies
- **AND** stage labels never authorize deployment, release, credentials, or another protected action.

### Requirement: Critical SDET is risk-triggered and independent
Fresh test-only SDET SHALL be mandatory only when the enforced current envelope contains a reachable incident involving authorization or privacy compromise, important data corruption or loss, irreversible external action, materially wrong financial, legal, or business outcome, system-wide or mission-critical outage, another explicitly accepted critical consequence, or an explicit project or owner qualification requirement. When invoked, SDET SHALL remain fresh, independent, test-only, critical-focused, non-authorizing, and attributed to the exact candidate.

#### Scenario: Material change has no reachable critical incident
- **WHEN** a Material change has current proof and validation but no named reachable critical-risk class and no explicit SDET requirement
- **THEN** SDET is not a completion gate
- **AND** the handoff records the risk-trigger decision and evidence.

#### Scenario: Security boundary is reachable
- **WHEN** the current envelope can expose an authorization or privacy compromise
- **THEN** one fresh critical-focused SDET challenge is required after current proof and accepted-scope completion
- **AND** main independently dispositions every reported row.

### Requirement: Main may own focused regression tests after proof
After current representative happy-path proof, main MAY create or update the smallest focused regression test, fixture, or oracle needed for a reproduced accepted-outcome defect or realistic requirement-linked regression in either profile. Main SHALL NOT use this authority to impersonate an independent SDET challenge or create broad speculative coverage. A later SDET, when triggered, SHALL not have authored production and SHALL remain independent from main-authored tests.

#### Scenario: Ordinary regression is reproduced after proof
- **WHEN** main reproduces a non-critical but accepted-outcome regression after the happy path is current
- **THEN** main may add the smallest focused regression oracle and correct the defect
- **AND** runs the affected proof and validation without launching SDET solely for test authorship.

## MODIFIED Requirements

### Requirement: Post-MVP work stops at critical boundaries
After representative happy-path proof, mandatory work SHALL be limited to incomplete accepted scope, a correction directly required by the accepted outcome, and reproduced accepted-outcome, critical, or non-deferrable defects. Current-change architecture and diagnostic non-degradation remain part of accepted implementation. Known non-critical bugs outside accepted outcome, optional coverage, pre-existing maintainability debt, style, wording, evidence formatting, process reflection, optimization, and future-scale work SHALL be documented or routed separately and SHALL NOT block qualified or ordinary completion.

#### Scenario: Optional workflow improvement appears after proof
- **WHEN** a useful process improvement is observed but is not required by accepted scope or an invariant
- **THEN** it does not become mandatory current-change work
- **AND** may be recorded through explicit feedback or a separate proposal.

#### Scenario: Accepted behavior remains incomplete
- **WHEN** a required accepted scenario is still unimplemented after the first happy-path proof
- **THEN** it remains mandatory work
- **AND** optional ceremony does not preempt its next real boundary.

#### Scenario: Non-critical post-MVP finding is parked
- **WHEN** main confirms a reachable non-critical limitation after MVP and it has no exact remaining current-change consumer
- **THEN** the limitation SHALL be documented or deferred with its re-evaluation condition
- **AND** it SHALL NOT authorize mandatory candidate mutation or block RC/stable.

#### Scenario: Admitted improvement becomes accepted scope
- **WHEN** an evidence-backed local reversible low-cost improvement is consumed by an exact remaining task, does not expand outcome, and is appended to the active `tasks.md`
- **THEN** it SHALL be implemented and proven at its earliest safe point before that consumer and before RC/stable or normal complete archive
- **AND** it SHALL NOT be reclassified as optional polish merely because MVP already exists.

#### Scenario: Deferred improvement remains non-blocking
- **WHEN** an evidence-backed improvement has no exact remaining current-change consumer
- **THEN** it SHALL be preserved as a non-checkbox deferred record with `Execution Class: separate-change`
- **AND** it SHALL NOT become mandatory post-MVP work until an owning change later admits it.

### Requirement: Shift-left sequencing does not grant live authority
The shift-left contract SHALL NOT authorize credentials, remote or shared-environment access, physical effects, destructive or irreversible action, deployment, installation, activation, release, publication, or owner-controlled cost. Existing protected-boundary decisions, fail-closed safety and identity guards, restoration and cleanup, immutable evidence, equivalence requirements, and blocked-live-attempt offline replay SHALL remain controlling.

Early per-slice characterization, Runtime Proof, proof runners, capture/evaluator, restoration tooling, and post-proof focused regression tests SHALL remain main or production-author responsibilities. Fresh critical-only SDET SHALL remain independent and test-only when the risk-trigger requirement applies.

#### Scenario: A real boundary requires physical access
- **WHEN** the first useful real observation requires a physical, credentialed, shared, costly, or otherwise owner-controlled operation
- **THEN** local harness and safety preparation may proceed
- **AND** no live request occurs before exact owner authorization and all applicable fail-closed gates are green.

## REMOVED Requirements

### Requirement: The lifecycle uses one simple development stage
**Reason**: One qualification lifecycle imposed on every repository edit creates RC/stable bookkeeping without improving Ordinary Small proof.
**Migration**: Ordinary Small uses verified outcome reporting; qualification-only work uses the retained stage model.

### Requirement: RC means release candidate
**Reason**: RC semantics remain valid only inside the scoped qualification track rather than every repository-changing session.
**Migration**: Use the new qualification-stage requirement.

### Requirement: Stable means locally complete
**Reason**: Stable promotion is qualification output, not an Ordinary Small completion requirement.
**Migration**: Use normal verified handoff outside qualification and stable only inside qualification.

### Requirement: Candidate mutation invalidates RC and stable
**Reason**: Candidate invalidation remains necessary only after a qualification candidate exists.
**Migration**: Enforce invalidation and monotonic RC numbering inside the new qualification-stage requirement.

### Requirement: Material SDET is critical-only and convergent
**Reason**: Material classification alone does not prove a reachable critical incident and should not force an independent model/test handoff.
**Migration**: Use the named risk-trigger requirement; retain freshness and non-authorizing behavior when SDET runs.

### Requirement: Ordinary Small remains proportional
**Reason**: The old requirement still forces MVP, RC, and stable transitions and is not proportional in reporting cost.
**Migration**: Use verified outcome reporting without qualification bookkeeping.
