## ADDED Requirements

### Requirement: Inventory tooling SHALL reuse proven equivalent internal owners

Instruction inventory SHALL use the maintained Markdown walker that already
provides its required sorted traversal, Markdown filtering, and `.git` and
`node_modules` exclusions. Focused code-quality inventory tests SHALL use the
maintained test fixture, process-capture, and assertion helpers. The reduction
SHALL add no generic inventory framework or new dependency.

#### Scenario: Instruction walker is reused without drift
- **WHEN** instruction inventory replaces its private walker with the maintained equivalent owner
- **THEN** ordered artifact paths, classifications, totals, repeated-line results, root redaction, JSON version, exits, and errors remain observably unchanged

#### Scenario: Focused test harness is reused without oracle loss
- **WHEN** code-quality inventory tests replace their private harness with maintained shared helpers
- **THEN** attention filtering, split-candidate failure, default-root redaction, and invalid-root redaction scenarios remain present and green

### Requirement: Distinct inventory contracts SHALL remain separate

The reduction SHALL NOT merge project, instruction, or code-quality inventory
CLIs; unify their differing ignore policies; import a sibling executable with
top-level effects; remove `largeFiles` or `--fail-on-split-candidates`; or change
their package-script entry points.

#### Scenario: Broader unification is proposed during implementation
- **WHEN** a reduction would change an inventory's scanned file set, public output, CLI surface, or test oracle
- **THEN** it remains outside this change and the two exact reductions proceed independently
