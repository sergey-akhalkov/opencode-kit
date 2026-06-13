# Deterministic Coverage Inventory Spec

## ADDED Requirements

### Requirement: Coverage Ledgers Validate Line Ranges

Audit and documentation review ledgers SHALL prove scoped text-file coverage with deterministic interval checks.

#### Scenario: Ledger covers a file exactly

- **GIVEN** a readable scoped text file with `N` lines
- **WHEN** the coverage ledger validator runs
- **THEN** block ranges for that file cover `[1..N]` exactly
- **AND** no two block ranges overlap
- **AND** block ordering is deterministic

#### Scenario: Ledger has a gap or overlap

- **GIVEN** a ledger block set skips or overlaps a line range
- **WHEN** validation runs
- **THEN** validation fails with file path and offending line ranges

### Requirement: Changed Blocks Require Re-Review

Coverage ledgers SHALL detect stale reviewed blocks after file changes.

#### Scenario: Reviewed block hash changes

- **GIVEN** a block was previously reviewed
- **AND** the current file content for that range no longer matches the block hash
- **WHEN** validation runs
- **THEN** the block is reported as `needs-rereview`
- **AND** final completion status is not `pass`

#### Scenario: File is unreadable or generated

- **GIVEN** a scoped file cannot be line-reviewed
- **WHEN** the ledger includes an explicit file status and reason
- **THEN** validation reports the file as covered by exception
- **AND** the exception appears in coverage limits

### Requirement: Findings Have Required Evidence Fields

Coverage ledger findings SHALL include enough structured evidence for later reviewer synthesis.

#### Scenario: Material finding is complete

- **GIVEN** a block has a material finding
- **WHEN** validation checks the finding
- **THEN** it includes severity, evidence, impact, root cause or `unknown`, recommendation, confidence, and status

#### Scenario: Finding is missing root cause routing

- **GIVEN** a finding has root cause `unknown`
- **WHEN** validation checks the recommendation
- **THEN** the recommendation routes investigation, instrumentation, or evidence gathering instead of a guessed remediation

### Requirement: Code Quality Inventory Supports Changed Scope

Code-quality inventory SHALL support changed-file analysis against a base ref.

#### Scenario: Changed file crosses split threshold

- **GIVEN** a changed human-written code file crosses the split-candidate line threshold relative to the base ref
- **WHEN** changed-file inventory runs
- **THEN** the file appears in `requiresSplitDecision[]`
- **AND** old and new line counts and bands are reported

#### Scenario: Existing split candidate is unchanged

- **GIVEN** a file was already a split candidate before the change and was not changed
- **WHEN** changed-file inventory runs
- **THEN** it does not fail `--fail-on-new-split-candidates`

#### Scenario: Git base cannot be resolved

- **GIVEN** the repository has no usable git base ref
- **WHEN** changed-file inventory runs
- **THEN** the output reports `unsupported` rather than inferring changed files
