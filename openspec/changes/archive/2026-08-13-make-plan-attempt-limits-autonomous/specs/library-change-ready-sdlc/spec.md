## MODIFIED Requirements

### Requirement: Process controls adapt autonomously inside accepted outcome authority

The main session SHALL own and update implementation plans, task and path inventories, OpenSpec artifact text, candidate and revision labels, attempt counts, and process stop lines when evidence shows that the update is the smallest necessary route to the accepted outcome and it does not change the accepted outcome, operating envelope, non-deferrable invariants, material risk acceptance, or protected-boundary authority. Such an update SHALL NOT be classified as scope expansion merely because an earlier agent-authored artifact prohibited another attempt or declared a process stop.

After a causal correction, satisfied retry condition, and current required offline replay, the main session SHALL record the change, update affected artifacts, invalidate only dependent evidence, and continue through the next authorized bounded attempt. It SHALL NOT ask the owner whether to expand the change, create a successor revision, raise an attempt count, or continue the process.

Updating a process control SHALL NOT authorize the underlying external, physical, costly, destructive, irreversible, remote, credentialed, deployed, released, or otherwise protected action. That action SHALL retain its separate owner authority, `Live-Attempt Gate`, safety, identity, restoration, cleanup, and immutable-evidence prerequisites.

#### Scenario: Corrected pre-boundary failure earns an autonomous successor

- **WHEN** a bounded live attempt stops before the protected dependency because of a diagnosed local defect
- **AND** the defect is corrected, preserved-corpus replay is terminal and green, the retry condition is satisfied, and existing authority already covers the underlying bounded action
- **THEN** main updates the OpenSpec attempt limit and stop line, records the causal successor, and executes the next bounded attempt without an owner process-approval question
- **AND** all underlying safety, restoration, cleanup, identity, and evidence gates remain enforced.

#### Scenario: Plan update does not grant protected action authority

- **WHEN** a successor plan is necessary but the underlying physical, remote, destructive, credentialed, costly, or manual action lacks current authority or prerequisites
- **THEN** main MAY update and prepare the plan and artifacts autonomously
- **AND** SHALL stop only at the exact protected action with a self-contained owner handoff.

#### Scenario: Changed semantics remain owner-owned

- **WHEN** the proposed artifact update would change user-visible outcome, operating envelope, a non-deferrable invariant, material risk acceptance, or protected API/data/security/policy semantics
- **THEN** it remains scope expansion requiring an exact owner decision
- **AND** process-autonomy wording SHALL NOT be used to cross that boundary.
