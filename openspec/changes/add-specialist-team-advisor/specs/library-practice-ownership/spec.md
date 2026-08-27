## MODIFIED Requirements

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
