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

Main SHALL remain solely accountable for the accepted user outcome, operating envelope, scope, implementation and integration decisions, specialist selection, correction routing, Runtime Proof, validation, finding disposition, owner questions, and final handoff. A Practice Owner SHALL be responsible only for the semantics, runtime application, and maintenance consistency of its registered practice.

A Practice Owner report SHALL never authorize mutation, scope expansion, a protected action, a product or architecture decision, another specialist launch, Development-Stage, RC, stable, release, deployment, or completion. Main SHALL disposition every owner finding or unknown by reproducing and correcting it, disproving it, showing it unreachable or not applicable, narrowing the affected claim, recording an allowed non-critical limitation, or stopping at an independently established owner boundary. Main SHALL NOT silently treat owner absence, malformed output, disagreement, or `unknown` as practice conformance.

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

### Requirement: Practice routing is trigger-based and proportional

Main SHALL use compact discovered Practice Owner descriptions and the loaded generic routing contract rather than a second central routing agent or a complete per-practice policy copy. Each practice SHALL define an exact material runtime trigger and a named uncertainty trigger in the reviewed ownership seed. Main SHALL invoke the registered owner when one of those exact triggers is reached, and the owner SHALL first confirm `applicable`, `not-applicable`, or `unknown` within its boundary. Generic possibility that a task could affect quality, architecture, proof, or safety SHALL NOT satisfy an uncertainty trigger.

Ordinary Small work that reaches no registered material trigger SHALL launch no Practice Owner solely for compliance. Main SHALL NOT fan out to every owner, invoke multiple owners for the same primary practice, or ask an owner to dispatch another owner. When multiple independent practices are materially triggered, main MAY use one orchestrator-owned bounded fan-out only when the runtime supports it and the scopes are independent; otherwise it SHALL invoke them serially and integrate all reports.

#### Scenario: Trivial owner-local work has no trigger

- **WHEN** a bounded local task changes no owned material boundary and applicability is not uncertain
- **THEN** main completes the task without a Practice Owner launch
- **AND** retains the always-loaded outcome, safety, proof, and worktree floor.

#### Scenario: One material practice is triggered

- **WHEN** task evidence matches exactly one registered material trigger
- **THEN** main invokes only that Practice Owner with a bounded self-contained brief
- **AND** no unrelated owner or routing subagent is launched.

#### Scenario: Independent practices are triggered together

- **WHEN** two registered triggers apply to disjoint concerns in the same candidate
- **THEN** main obtains one report from each exact owner under isolated read scopes
- **AND** main integrates both reports without transferring orchestration or result ownership.

#### Scenario: Applicability is materially uncertain

- **WHEN** available evidence matches one practice's reviewed named uncertainty trigger and the answer can change a current decision or non-deferrable invariant
- **THEN** main consults that practice's owner for an applicability observation
- **AND** does not invoke all owners to search for an unspecified concern.

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

The initial registry SHALL contain these core practice-to-owner bindings: `outcome-readiness` to `implementation-readiness-reviewer`; `verification-and-tests` to `test-coverage-reviewer`; `claim-evidence` to `evidence-sufficiency-reviewer`; `simplicity-and-reuse` to `code-quality-reviewer`; `architecture-and-change-locality` to `openspec-architecture-reviewer`; `execution-safety` to `execution-safety-reviewer`; `instruction-governance` to `instruction-artifact-reviewer`; and `blocker-recovery` to `troubleshooter`.

The initial registry SHALL contain these optional domain bindings: `configuration-and-deployment` to `deployment-config-reviewer`; `performance-and-reliability` to `performance-reliability-reviewer`; `rust-concurrency` to `rust-concurrency-reviewer`; `protocol-api-semantics` to `protocol-api-reviewer`; `wire-format-and-transport` to `wire-protocol-reviewer`; `legacy-contract-evidence` to `legacy-evidence-reviewer`; and `legacy-client-compatibility` to `legacy-client-compatibility-reviewer`.

`implementation-worker`, `sdet-quality-engineer`, `final-candidate-reviewer`, `qwen-local-worker`, and `session-completion-arbiter` SHALL remain execution, optional cross-cutting review, helper, or control-plane roles rather than primary Practice Owners. Their governing rules SHALL map to the appropriate registered core practice.

#### Scenario: Initial registry is validated

- **WHEN** strict validation inspects the initial roster
- **THEN** all fifteen practice IDs resolve to the exact named agents and maintained rule anchors
- **AND** no excluded execution, optional cross-cutting, helper, or control-plane role is promoted implicitly.

#### Scenario: Protocol and wire concerns are separated

- **WHEN** a change affects schema evolution and request correlation without changing framing bytes
- **THEN** `protocol-api-reviewer` owns the practice observation and `wire-protocol-reviewer` is not invoked solely for that concern
- **AND** byte order, framing lengths, binary safety, and golden transport vectors remain owned by `wire-protocol-reviewer`.

#### Scenario: Test coverage observes a domain test gap

- **WHEN** `test-coverage-reviewer` finds missing requirement-to-test traceability for protocol behavior
- **THEN** it owns only the verification gap and refers the protocol semantic evidence to main
- **AND** it does not become a second owner of protocol correctness.

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
