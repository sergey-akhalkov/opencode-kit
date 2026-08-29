# library-practice-ownership Specification

## Purpose
Defines exclusive semantic ownership of maintained working practices by specialized subagents while preserving main-session responsibility for user outcomes, integration, proof, and protected decisions.

## Requirements

### Requirement: Maintained practices have exclusive semantic owners

The kit SHALL maintain one versioned, stable-ordered Practice Ownership Registry. Every maintained normative rule anchor in the portable working philosophy and operational authority SHALL map to exactly one registered practice, every registered practice SHALL name exactly one existing specialized subagent as its primary Practice Owner, and one subagent SHALL own no more than one primary practice. The registry SHALL distinguish core practices from optional domain practices and SHALL identify canonical rule surfaces, runtime trigger class, maintenance surfaces, selected runtime profiles, and explicit ownership exclusions.

Execution roles, optional cross-cutting candidate review, helper roles, and control-plane agents SHALL NOT become implicit Practice Owners merely because they consume or inspect practice evidence. A deterministic validator SHALL reject missing, duplicate, cyclic, or ambiguous ownership and SHALL NOT infer practice meaning or owner selection from prose.

#### Scenario: Every normative anchor has one owner

- **WHEN** repository validation reads the reviewed registry and the maintained global principle and operational-rule anchor inventory
- **THEN** each anchor resolves to one registered practice and one existing owner agent
- **AND** no anchor or practice has two primary owners.

#### Scenario: An unregistered reviewer overlaps a practice

- **WHEN** an optional reviewer can inspect a concern already assigned to a Practice Owner
- **THEN** the reviewer remains a non-owning evidence source
- **AND** its existence does not create a second primary owner.

#### Scenario: Helper code sees an unmapped rule

- **WHEN** a maintained normative anchor is absent from the reviewed registry
- **THEN** validation fails with the exact anchor and missing ownership fact
- **AND** the helper does not choose an owner from names, descriptions, similarity, or model-like classification.

### Requirement: Main owns results and Practice Owners own practices

Main SHALL remain solely accountable for the accepted user outcome, operating envelope, scope, final specialist selection, dispatch, correction routing, implementation and integration decisions, Runtime Proof, validation, finding disposition, owner questions, and final handoff. A bounded team advisor MAY recommend a smallest sufficient engagement map but SHALL remain a non-owning, non-dispatching control-plane evidence source. A Practice Owner SHALL be responsible only for the semantics, runtime application, and maintenance consistency of its registered practice.

A team-advisor or Practice Owner report SHALL never authorize mutation, scope expansion, a protected action, a product or architecture decision, another specialist launch, Development-Stage, RC, stable, release, deployment, or completion. Main SHALL disposition every recommendation, owner finding, and unknown by accepting only a bounded evidence-backed work package, reproducing and correcting a finding, disproving it, showing it unreachable or not applicable, narrowing the affected claim, recording an allowed non-critical limitation, or stopping at an independently established owner boundary. Main SHALL NOT silently treat advisor or owner absence, malformed output, disagreement, or `unknown` as conformance.

#### Scenario: Practice Owner reports a violation

- **WHEN** the selected owner returns evidence that its practice is violated inside the accepted envelope
- **THEN** main independently dispositions the finding against the accepted outcome and controlling priorities
- **AND** the owner neither edits the candidate nor decides the overall result.

#### Scenario: Main disagrees with an owner finding

- **WHEN** main has direct source, runtime, schema, or test evidence that contradicts the owner report
- **THEN** main records the conflicting evidence and its resulting disposition
- **AND** does not defer the decision to another owner or suppress the original report.

#### Scenario: Practice evidence crosses a protected boundary

- **WHEN** an owner identifies that satisfying a practice would require credentials, destructive or remote action, deployment, release, cost, a protected semantic decision, or another owner-controlled action
- **THEN** the report identifies the boundary as evidence only
- **AND** main applies the existing owner-authority contract without treating the report as permission.

#### Scenario: Team advisor recommends a Practice Owner

- **WHEN** the team advisor maps current task evidence to one registered material or named uncertainty trigger
- **THEN** it recommends the exact owner and activation evidence to main without judging the practice
- **AND** main remains responsible for dispatching the owner and dispositioning its report.

### Requirement: Practice routing is trigger-based and proportional

For a new non-trivial parentless root mission, main SHALL use one bounded team recommendation together with compact discovered Practice Owner descriptions and the loaded generic routing contract. The advisor is a non-owner default and SHALL NOT be counted as a Practice Owner launch. Each practice SHALL retain an exact material runtime trigger and a named uncertainty trigger in the reviewed ownership seed. The advisor MAY identify evidence matching those triggers, but SHALL NOT become a Practice Owner or replace owner applicability review. Main SHALL invoke the registered owner when one of those exact triggers is reached, and the owner SHALL first confirm `applicable`, `not-applicable`, or `unknown` within its boundary. Advisor absence or an advisor `main alone` result SHALL NOT satisfy, suppress, or clear a matched Practice Owner trigger. Generic possibility that a task could affect quality, architecture, proof, or safety SHALL NOT satisfy an uncertainty trigger.

Trivial owner-local work that reaches no registered material trigger SHALL launch neither the advisor nor a Practice Owner solely for compliance. A non-trivial advisory pass SHALL NOT require an owner when no exact trigger is reached. Main SHALL NOT fan out to every owner, invoke multiple owners for the same primary practice, or ask the advisor or an owner to dispatch another owner. When multiple independent practices are materially triggered, main MAY use one orchestrator-owned bounded fan-out only when the runtime supports it and the scopes are independent; otherwise it SHALL invoke them serially and integrate all reports.

#### Scenario: Trivial owner-local work has no trigger

- **WHEN** a bounded local task changes no owned material boundary, applicability is not uncertain, and no useful team-composition uncertainty exists
- **THEN** main completes the task without a team-advisor or Practice Owner launch
- **AND** retains the always-loaded outcome, safety, proof, and worktree floor.

#### Scenario: One material practice is triggered

- **WHEN** task evidence matches exactly one registered material trigger
- **THEN** main invokes only that Practice Owner with a bounded self-contained brief
- **AND** no unrelated owner is launched whether the trigger was found by main or recommended by the advisor.

#### Scenario: Independent practices are triggered together

- **WHEN** two registered triggers apply to disjoint concerns in the same candidate
- **THEN** main obtains one report from each exact owner under isolated read scopes
- **AND** main integrates both reports without transferring orchestration or result ownership.

#### Scenario: Applicability is materially uncertain

- **WHEN** available evidence matches one practice's reviewed named uncertainty trigger and the answer can change a current decision or non-deferrable invariant
- **THEN** main consults that practice's owner for an applicability observation
- **AND** neither main nor the advisor invokes all owners to search for an unspecified concern.

#### Scenario: Non-trivial advice finds no Practice Owner trigger

- **WHEN** a non-trivial task receives team advice but current evidence reaches no exact material or named uncertainty trigger
- **THEN** the engagement map recommends no Practice Owner solely for compliance
- **AND** may still recommend an available skill, execution role, or independent specialist for a distinct evidence-backed need.

### Requirement: Practice Owners support runtime and maintenance review modes

Every Practice Owner SHALL support `runtime` and `maintenance` review modes under one coherent semantic responsibility. Runtime mode SHALL inspect an exact task, candidate, and evidence boundary. Maintenance mode SHALL inspect a proposed or current change to the practice's canonical rule, trigger, owner body, paired skill, validator contract, profile binding, scenarios, or documentation map.

Each report SHALL identify `Practice ID`, `Review Mode`, `Applicability`, exact candidate or artifact reference, Effective Model, evidence references, one `Practice Observation` from `no-material-finding | findings-reported | unknown | not-applicable`, the role-specific risk or reduction matrix, boundary referrals, and evidence gaps. `Practice Observation` SHALL describe only the owned practice and SHALL NOT be an acceptance or lifecycle verdict. Boundary referrals SHALL name evidence and another registered practice for main routing; the owner SHALL NOT dispatch the referred agent or judge that practice.

#### Scenario: Runtime review stays within one practice

- **WHEN** an owner receives a runtime brief containing concerns inside and outside its registered boundary
- **THEN** it returns findings only for the owned practice and refers exact out-of-boundary evidence to main
- **AND** it does not broaden its checks or invoke another agent.

#### Scenario: Maintenance changes a paired skill

- **WHEN** a skill implementing one registered practice changes its trigger, authority, procedure, or output contract
- **THEN** the Practice Owner reviews semantic consistency across the registered maintenance surfaces
- **AND** main remains the only author and integrator of any correction.

#### Scenario: No material finding is observed

- **WHEN** the owner can read all required evidence and finds no material issue inside its exact boundary
- **THEN** it returns `Practice Observation: no-material-finding` with evidence references
- **AND** makes no claim about uninspected practices or the overall outcome.

### Requirement: Practice maintenance cannot self-certify

Practice Owners SHALL remain unable to edit their canonical rules, agent bodies, paired skills, source/config/test artifacts, or registry records. The existing feedback-ledger exception MAY remain. A semantic change SHALL receive current-owner impact analysis before mutation when safely available, main-owned authoring, candidate consistency review, deterministic structural validation, and matched behavior evidence proportional to the changed trigger.

When the owner agent body, its ownership record, or its own trigger semantics change, that candidate owner's report SHALL NOT be the sole maintenance evidence. The change SHALL additionally use the exact frozen prior owner source plus matched baseline/candidate scenarios; another independent read-only instruction-artifact review source MAY supplement but SHALL NOT replace the prior-source comparison. Mechanical formatting or derived-view updates with unchanged semantics MAY use deterministic validation without a model review.

#### Scenario: Owner proposes to edit its own practice

- **WHEN** an owner report identifies a correction to an owned instruction artifact
- **THEN** it returns evidence and a bounded mitigation note without editing the artifact
- **AND** main decides and authors any accepted correction.

#### Scenario: Owner body changes

- **WHEN** a candidate modifies the Practice Owner's own body, ownership mapping, or trigger semantics
- **THEN** candidate self-review is insufficient to close maintenance evidence
- **AND** frozen prior-source review plus matched behavior evidence is required.

#### Scenario: Mechanical owner map rendering changes

- **WHEN** a generated human-readable ownership view changes only because reviewed registry data changed and semantic fields read back exactly
- **THEN** deterministic regeneration and drift validation MAY establish the mechanical result
- **AND** no helper infers or rewrites practice meaning.

### Requirement: The initial roster covers core and maintained domain practices

The initial registry SHALL contain these core practice-to-owner bindings:
`outcome-readiness` to `implementation-readiness-reviewer`;
`verification-and-tests` to `test-coverage-reviewer`; `claim-evidence` to
`evidence-sufficiency-reviewer`; `foundation-integrity` to
`foundation-integrity-reviewer`; `simplicity-and-reuse` to
`code-quality-reviewer`; `architecture-and-change-locality` to
`openspec-architecture-reviewer`; `execution-safety` to
`execution-safety-reviewer`; `instruction-governance` to
`instruction-artifact-reviewer`; and `blocker-recovery` to `troubleshooter`.

The initial registry SHALL contain these optional domain bindings:
`configuration-and-deployment` to `deployment-config-reviewer`;
`performance-and-reliability` to `performance-reliability-reviewer`;
`rust-concurrency` to `rust-concurrency-reviewer`; `protocol-api-semantics` to
`protocol-api-reviewer`; `wire-format-and-transport` to
`wire-protocol-reviewer`; `legacy-contract-evidence` to
`legacy-evidence-reviewer`; and `legacy-client-compatibility` to
`legacy-client-compatibility-reviewer`.

`implementation-worker`, `sdet-quality-engineer`, `final-candidate-reviewer`,
`qwen-local-worker`, and `session-completion-arbiter` SHALL remain execution,
optional cross-cutting review, helper, or control-plane roles rather than primary
Practice Owners. Their governing rules SHALL map to the appropriate registered
core practice. `foundation-integrity-reviewer` SHALL own only current foundation-
relation applicability and observation; main SHALL remain the sole recovery and
outcome owner.

#### Scenario: Initial registry is validated

- **WHEN** strict validation inspects the initial roster
- **THEN** all sixteen practice IDs resolve to the exact named agents and maintained rule anchors
- **AND** no excluded execution, optional cross-cutting, helper, or control-plane role is promoted implicitly.

#### Scenario: Protocol and wire concerns are separated

- **WHEN** a change affects schema evolution and request correlation without changing framing bytes
- **THEN** `protocol-api-reviewer` owns the practice observation and `wire-protocol-reviewer` is not invoked solely for that concern
- **AND** byte order, framing lengths, binary safety, and golden transport vectors remain owned by `wire-protocol-reviewer`.

#### Scenario: Test coverage observes a domain test gap

- **WHEN** `test-coverage-reviewer` finds missing requirement-to-test traceability for protocol behavior
- **THEN** it owns only the verification gap and refers the protocol semantic evidence to main
- **AND** it does not become a second owner of protocol correctness.

#### Scenario: Foundation owner detects a current identity contradiction

- **WHEN** a reviewed material trigger binds a current outcome to mismatched workload/profile/oracle identities
- **THEN** only `foundation-integrity-reviewer` owns the foundation practice observation
- **AND** main independently reproduces, corrects, and sweeps the result without transferring outcome ownership to the reviewer.

### Requirement: Unavailable owners fail visibly and proportionally

If a materially triggered Practice Owner is absent from the selected profile, unreadable, unavailable, malformed, stale, or unable to establish applicability, main SHALL record the practice as `unknown`, preserve the exact capability failure, and continue only to the narrowest result allowed by the always-loaded kernel and available evidence. Missing optional quality evidence SHALL NOT become an automatic lifecycle blocker, but unknown authorization, privacy, data-integrity, irreversible-action, worktree, writer-liveness, or operating-envelope safety SHALL block the affected action.

Main MAY perform the smallest direct fallback analysis needed to preserve the user outcome, but SHALL report that the registered owner evidence was unavailable and SHALL NOT claim that the ownership architecture operated successfully for that practice.

#### Scenario: Optional quality owner is unavailable

- **WHEN** a non-critical quality practice is triggered but its owner cannot run
- **THEN** main records the capability gap and directly dispositions the reachable evidence
- **AND** the missing report alone does not block unrelated accepted work or create a false successful ownership claim.

#### Scenario: Execution-safety owner is unavailable

- **WHEN** a triggered execution-safety review is unavailable and the next action could cross authorization, data-integrity, destructive, irreversible, worktree, or writer-liveness boundaries
- **THEN** the affected action remains blocked or unknown under the always-loaded safety kernel
- **AND** main does not weaken the boundary to preserve progress.

### Requirement: Outcome readiness owns pre-investment task-fit falsification

The `outcome-readiness` practice SHALL include one exact material trigger when main is
about to represent a newly authored decision-material plan, specification, or architecture
decision as semantically implementation-ready. Its existing
`implementation-readiness-reviewer` owner SHALL inspect original-request fit, unresolved
current decisions, observable acceptance, likely late invalidation, internal consistency,
and unnecessary scope under the bounded-falsification contract.

This trigger SHALL remain distinct from `foundation-integrity` bind/rebind contradiction,
`architecture-and-change-locality`, `claim-evidence`, `instruction-governance`, and domain
practice triggers. Main SHALL invoke an independently triggered exact owner only for that
owner's boundary and SHALL NOT fan out to all owners or make outcome readiness a central
router.

#### Scenario: Newly authored plan is decision-material

- **WHEN** its current decisions can alter the accepted outcome, operating envelope, non-deferrable invariant, proof boundary, user-owned decision, or material residual risk
- **THEN** main obtains one bounded fresh observation from `implementation-readiness-reviewer` before semantic readiness is represented.

#### Scenario: Foundation identities later contradict

- **WHEN** already reviewed planning later binds or rebinds a materially contradictory workload, profile, environment, or oracle identity
- **THEN** the separate `foundation-integrity` trigger owns that observation
- **AND** the earlier readiness review is not repeated as a substitute.

#### Scenario: Exact architecture trigger is independently present

- **WHEN** a supported change axis or mixed responsibility reaches `architecture-and-change-locality` in the same candidate
- **THEN** its registered owner reviews only that architecture boundary
- **AND** neither owner claims the other's practice or launches another owner.

### Requirement: Unavailable challenge narrows readiness rather than inventing conformance

When a materially required fresh readiness observation is unavailable, unreadable,
malformed, stale, or lacks effective-model and candidate attribution, main SHALL preserve
the exact capability failure and report semantic readiness `unknown`. It SHALL NOT infer
conformance, manufacture a same-context independent report, or treat the absence as a
product defect. Zero-trigger Ordinary Small work SHALL remain unaffected.

#### Scenario: Required reviewer cannot run

- **WHEN** a decision-material plan reaches the trigger but no conforming fresh readiness owner evidence is available
- **THEN** structural planning may remain complete while semantic readiness is `unknown`
- **AND** no optional findings or owner authority are invented.
