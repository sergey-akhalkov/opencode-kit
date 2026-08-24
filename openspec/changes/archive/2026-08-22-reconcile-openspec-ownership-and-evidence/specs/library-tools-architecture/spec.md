## ADDED Requirements

### Requirement: Ownership and evidence inventories are explicit deterministic data
The repository SHALL provide project-neutral readers for active change ownership and task evidence indexes. They SHALL validate exact schemas, stable paths/digests/counts/bytes/status, and dependency acyclicity; report unsupported or missing facts as unknown; and SHALL NOT infer semantic equivalence, proof quality, product priority, or which conflicting change should win.

#### Scenario: Ownership manifests overlap
- **WHEN** two exact manifests contain the same capability requirement or overlapping write root
- **THEN** inventory returns the conflict and declared dependency/transfer facts in stable order
- **AND** does not select a winner

#### Scenario: Evidence index has an unknown row
- **WHEN** a row lacks a readable candidate or artifact identity
- **THEN** inventory marks the task evidence unknown
- **AND** operation callers treat that row as non-complete

### Requirement: Operation callers compose official validation and index facts
Shipped propose, apply, qualification, and archive callers SHALL invoke the maintained ownership/evidence readers plus official selected strict OpenSpec validation at their required boundary. They SHALL preserve official diagnostics and SHALL NOT reimplement delta merge semantics. A registered check without a shipped caller SHALL not be represented as integrated.

#### Scenario: Apply sees a conflicting active owner
- **WHEN** apply runs before mutation and the ownership reader reports an unresolved overlap
- **THEN** apply exits non-zero before production writes
- **AND** names the blocking owner manifests and transfer condition

#### Scenario: Archive sees stale task evidence
- **WHEN** official selected validation passes but one checked task row references an older candidate
- **THEN** archive stops before invoking official archive
- **AND** reports the stale row and current candidate identity
