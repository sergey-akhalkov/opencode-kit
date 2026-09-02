## ADDED Requirements

### Requirement: Grind delivery checkpoints remain task scoped and non-product
After the task-scoped frontier capability is current, a grind-enabled primary session SHALL represent a due outcome-preserving delivery checkpoint as a bounded process item or process-gate dependency attached only to the affected costly work items. Main SHALL supply the semantic trigger, evidence refs, affected items, selected checkpoint action, and suppression identity; deterministic frontier code SHALL validate only structure, correlation, dependencies, gate state, and readiness and SHALL NOT infer delivery drag, cost dominance, or optimization quality.

A due runnable checkpoint SHALL complete before its dependent costly item becomes runnable. Independent accepted items SHALL remain runnable and mandatory. An incomplete checkpoint, unavailable safe optimization, or process budget SHALL NOT become `product_decision_required`; only a separately established material product or proof-scope decision may use that path after the controller-derived runnable set is empty.

#### Scenario: Checkpoint precedes one costly item
- **WHEN** main submits a current frontier with one pending process checkpoint that is a dependency of a costly item
- **THEN** the controller derives the checkpoint, not its dependent costly item, as runnable
- **AND** completion arbitration cannot select the costly item until the checkpoint is complete and every other gate is satisfied.

#### Scenario: Independent sibling drains first
- **WHEN** one lane has a due delivery checkpoint and an independent authorized sibling item is runnable
- **THEN** the controller keeps the sibling in the runnable set and prevents global waiting or product-decision handoff
- **AND** sibling completion does not satisfy the checkpoint or clear its dependent lane.

#### Scenario: Main omits a current due checkpoint
- **WHEN** supplied completion evidence establishes an unresolved delivery-checkpoint requirement but the current frontier omits or marks it complete without its stated oracle
- **THEN** the arbiter requests one bounded main-owned frontier reconciliation rather than selecting dependent costly work or completion
- **AND** deterministic code does not synthesize the missing semantic checkpoint from prose.

#### Scenario: No safe optimization is currently available
- **WHEN** the checkpoint is complete with `irreducible` or `unknown` evidence and the existing costly route remains safe and authorized
- **THEN** main may satisfy the process item and make the original route eligible under its unchanged gates
- **AND** the guard does not ask the owner to approve process continuation.

#### Scenario: Optimization requires a product decision
- **WHEN** the only proposed faster route changes accepted product behavior or proof scope while the original accepted route remains available
- **THEN** the checkpoint does not block or replace the original route solely to force the faster choice
- **AND** any parked decision follows the existing product-decision contract only when it is actually required by remaining accepted work.
