# outcome-preserving-delivery-checkpoints Specification

## Purpose
Defines a project-neutral checkpoint that detects evidence-backed delivery drag, improves the route to the same accepted outcome, and resumes work without weakening scope, quality, safety, or proof.

## Requirements

### Requirement: Delivery drag is evidence-backed and project-neutral
The active primary session SHALL classify delivery drag only from current evidence tied to one accepted dependency lane. Supported patterns SHALL be: materially similar attempts without downstream advancement; materially different failures that are repeatedly discovered only after the same late or costly boundary; repeated coarse owner or identity changes that invalidate an unchanged costly prerequisite chain; a failed costly action whose proposed successor would repeat the same costly class after only a local correction; or an observed repeatable setup or validation cost combined with a declared remaining cardinality that makes that cost the current dominant delivery constraint.

The classification SHALL state the last accepted downstream advancement, affected lane, observed attempts or costs, failure or invalidation layer, and uncertainty. Deterministic tooling MAY validate supplied fields and arithmetic but SHALL NOT infer semantic similarity, materiality, dominance, or optimization quality. Elapsed time alone, a coarse unchanged task count, one cheap failure, a legitimately long action that is advancing its required boundary, or required irreducible work SHALL NOT establish delivery drag.

#### Scenario: Different defects arrive at the same late boundary
- **WHEN** two materially different defects in one dependency lane are discovered only after separate executions of the same costly late integration boundary and neither execution advances the accepted downstream boundary
- **THEN** the primary session classifies a late-discovery delivery-drag pattern before another dependent costly execution
- **AND** it does not misrepresent the different defects as materially similar retries.

#### Scenario: Repeated setup dominates the remaining population
- **WHEN** current evidence contains one observed representative setup cost, the declared remaining repetition count, and the repeated setup term dominates the bounded remaining route
- **THEN** the primary session records a dominant-cost delivery-drag pattern with the exact evidence and arithmetic
- **AND** it does not infer unobserved duration, throughput, compatibility, or population closure.

#### Scenario: Long work advances normally
- **WHEN** a long-running action reaches its required downstream boundary or produces accepted terminal evidence without a repeated late-failure or invalidation pattern
- **THEN** no delivery checkpoint is required solely because of duration or unchanged task count
- **AND** ordinary run-observe-correct continues without reflection ceremony.

#### Scenario: One cheap failure remains ordinary correction
- **WHEN** one inexpensive local attempt fails with a directly actionable cause and no costly repetition, invalidation amplification, or dominant-cost evidence exists
- **THEN** the primary session uses ordinary local correction
- **AND** does not create a delivery checkpoint merely to satisfy process wording.

### Requirement: A due checkpoint pauses only the dependent costly action
Before another action in the affected costly class, the primary session SHALL perform one bounded outcome-preserving delivery checkpoint. The checkpoint SHALL preserve the accepted outcome, operating envelope, non-deferrable invariants, accepted proof and population, protected-boundary authority, restoration and cleanup duties, current scoped gates, and trustworthy evidence. It SHALL identify the bottleneck layer, current route, repeated cost or invalidation, plausible route alternatives, selected smallest safe change or `irreducible | unknown`, dependency-scoped evidence invalidation, next real boundary, observable benefit, and one suppression identity based on the unchanged outcome lane, last downstream advancement, pattern class, and evidence refs.

The due checkpoint SHALL block only the next dependent costly action. Independent dependency-valid work SHALL remain runnable. One checkpoint SHALL use the current session's evidence and ordinary tools; it SHALL NOT require a specialist, provider call, new project artifact, or user question by default. Re-evaluation for the same suppression identity SHALL require new decision-changing evidence, a changed bottleneck, or a failed selected optimization at its stated oracle.

#### Scenario: Checkpoint selects a shift-left boundary
- **WHEN** late-discovery delivery drag is current and a cheaper local or replay boundary can falsify the same failure class before the costly boundary
- **THEN** the checkpoint selects that earliest sufficient boundary and states its expected observation
- **AND** the next costly action remains blocked until the selected prerequisite reaches its stated result and all existing gates permit continuation.

#### Scenario: Independent work remains available
- **WHEN** one costly lane has a due checkpoint and another accepted item is dependency-valid, authorized, and independent
- **THEN** the independent item remains runnable and mandatory under existing task-scoped rules
- **AND** its success neither completes the checkpoint nor clears the affected lane.

#### Scenario: Duplicate checkpoint is suppressed
- **WHEN** a completed checkpoint's outcome lane, last downstream advancement, pattern class, bottleneck evidence, and selected-route oracle are unchanged
- **THEN** the primary session does not repeat the checkpoint
- **AND** continues the selected route or retains its exact unresolved gate.

#### Scenario: Cost is irreducible in the current envelope
- **WHEN** the bounded checkpoint finds no safe route that can remove, shift, isolate, replay, automate, batch, or parallelize the observed cost without weakening a requirement or unproved equivalence
- **THEN** it records `irreducible` or `unknown` with the limiting evidence and resumes the existing safe route when authorized
- **AND** it does not enter a reflection loop or ask the owner to approve ordinary process continuation.

### Requirement: Route improvements preserve outcome and evidence semantics
The primary session SHALL prefer, in order, removal of unnecessary process work, an earlier sufficient real signal, replay of trustworthy preserved evidence, narrower dependency-scoped invalidation, isolation of a volatile runner or evaluator identity, automation with checkpoint and resume, safe non-overlapping parallelism, and batching or reuse only when each option preserves the accepted behavior and claim. It SHALL autonomously update process controls when the selected option changes no accepted product or proof semantics.

Skipping, caching, batching, replay substitution, emulation, or reuse that claims the same observable result SHALL remain subject to the existing behavioral-substitution qualification owner. A route that reduces an accepted test/evidence population, changes the observable oracle, weakens independence or restoration, changes product behavior, crosses a protected boundary, or accepts a material risk SHALL remain unselected until the existing owner-decision and authorization contract permits it. The checkpoint SHALL never clear a Live-Attempt Gate, writer-liveness gate, safety gate, or protected-action prerequisite.

#### Scenario: Automation preserves the same population
- **WHEN** an existing manually supervised finite campaign can execute the same accepted members, setup, oracle, restoration, and cleanup through a bounded queue with checkpoint and resume
- **THEN** the primary session may select automation as an outcome-preserving process correction
- **AND** proof remains incomplete until the automated production path observes the original population and oracles.

#### Scenario: Batching changes observation independence
- **WHEN** a proposed batching or process-reuse route may share state that was reset between accepted observations
- **THEN** the route remains an unproved substitution and cannot replace the original proof path
- **AND** it proceeds only through the existing behavioral-substitution qualification contract or is rejected.

#### Scenario: Faster route narrows accepted coverage
- **WHEN** a proposed optimization would replace an accepted complete population with a sample or remove a required validation boundary
- **THEN** the checkpoint preserves the current route and parks the exact product or evidence-scope decision under existing owner authority
- **AND** no instruction, task update, or grind continuation treats the narrower route as accepted.

#### Scenario: Process correction stays autonomous
- **WHEN** fail-fast probing, dependency isolation, evaluator replay, automation, or safe scheduling preserves the accepted outcome, population, invariants, authority, and proof semantics
- **THEN** the primary session updates the route and continues without asking whether to revise agent-authored plans, attempts, or stop lines
- **AND** the underlying protected action retains every existing prerequisite.

### Requirement: Checkpoint continuity uses existing lifecycle owners
An active OpenSpec change SHALL record a materially changed route in its existing strategy history and update only the affected proposal, design, task, stop-line, or evidence controls needed for coherent continuation. A checkpoint that confirms the current route SHALL create no planning churn. An ordinary non-OpenSpec root SHALL not create a repository file solely for the checkpoint. An explicitly grind-enabled root SHALL project a due checkpoint through its existing task-scoped frontier as a process item or gate dependency. Compaction SHALL preserve an unresolved checkpoint's suppression identity, evidence, selected next action, and oracle so the next session continues it rather than repeating reflection.

Reusable workflow friction MAY be reported through the existing Kaizen path after the current route is handled. Kaizen capture SHALL remain non-authorizing and SHALL NOT replace, schedule, complete, or block the current checkpoint.

#### Scenario: OpenSpec route changes materially
- **WHEN** a checkpoint selects a new causal route for an active OpenSpec dependency lane
- **THEN** the primary session records the prior route and retry condition in `history.md` and updates only the planning controls invalidated by the change
- **AND** the route update remains implementation control rather than a new accepted product outcome.

#### Scenario: Checkpoint confirms the current route
- **WHEN** a bounded checkpoint concludes that the current route is irreducible or already the smallest safe route
- **THEN** OpenSpec tasks and design remain unchanged unless an existing factual record requires correction
- **AND** no mandatory retrospective or optional improvement task is added.

#### Scenario: Compaction occurs during a due checkpoint
- **WHEN** compaction occurs after delivery drag is established but before the selected route reaches its oracle
- **THEN** the continuation summary preserves the checkpoint identity, evidence, route, next action, and suppression condition
- **AND** the next session does not downgrade it to optional feedback or repeat the same checkpoint.

#### Scenario: Reusable friction is reported separately
- **WHEN** the checkpoint exposes a project-neutral process or tooling gap useful beyond the current task
- **THEN** the primary session may submit one bounded Kaizen signal without changing current checkpoint authority
- **AND** signal capture failure or later triage never blocks the accepted task.
