## MODIFIED Requirements

### Requirement: Operation gate checks completion facts at each caller boundary
`global/bin/openspec-operation-gate.ts` SHALL expose project-neutral operation-specific deterministic checks consumed by the globally installed propose, apply, and complete-archive entrypoints. It SHALL require an explicit project root and change identity and SHALL NOT depend on a target project's package manager or scripts. A repository-maintenance compatibility shim MAY re-export the portable core for existing local tests and callers but SHALL NOT own behavior.

Registry operations without shipped callers SHALL NOT be represented as integrated. Propose checks SHALL validate the explicit automation-dividend declaration shape. Apply and archive checks SHALL correlate a required declaration with exactly one tagged task. Complete archive checks SHALL fail on unchecked tasks, missing or stale required automation-dividend evidence, and other explicit incomplete state. The gate SHALL parse only reviewed stable fields, task identifiers and digests, and evidence-index identities; it SHALL NOT infer Material profile, recurrence, value, semantic equivalence, or exemption from prose or repository contents. The prepush plan SHALL run repository validation, tests, and OpenSpec validation directly; it SHALL NOT retain an operation check that passes solely because `openspec/` exists.

#### Scenario: Archive gate sees unchecked tasks
- **WHEN** the archive gate reads a tasks file with one or more unchecked items
- **THEN** it returns non-zero with a blocking check and exact unchecked count
- **AND** it does not classify that state as a non-blocking summary.

#### Scenario: Archive gate sees stale required dividend evidence
- **WHEN** a required dividend task is checked but its evidence row has a different task digest, helper identity, candidate, or environment
- **THEN** the gate returns non-zero with the mismatched field
- **AND** does not invalidate unrelated product evidence or infer a replacement value.

#### Scenario: Unrelated project invokes apply gate
- **WHEN** a target project invokes the global operation gate with explicit `--root`, operation, and change id
- **THEN** the same completion checks run without a target npm script
- **AND** diagnostics use project-relative sources rather than a maintainer checkout path.

#### Scenario: Prepush gate has no meaningful check
- **WHEN** all useful prepush facts are already enforced by repository validation and OpenSpec validation
- **THEN** the redundant no-op gate is removed from the prepush plan
- **AND** CI and documentation no longer invoke the removed operation.
