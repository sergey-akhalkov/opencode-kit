## ADDED Requirements

### Requirement: Scoped deduplication artifacts preserve lazy routing
The global kit SHALL provide one `deduplication-audit` skill and one `/dedup` command with valid loader metadata, an explicit scoped trigger, and a read-only output contract. The workflow SHALL stay unloaded for unrelated trivial fixes and SHALL not duplicate the exhaustive `codebase-audit-loop` contract.

#### Scenario: Global loader discovers the new artifacts
- **WHEN** OpenCode starts with `OPENCODE_CONFIG_DIR` pointing at the kit `global/` source
- **THEN** its skill inventory SHALL include `deduplication-audit`
- **AND** its command inventory SHALL include `/dedup` after restart.

#### Scenario: Command carries the whole scope argument
- **WHEN** the user invokes `/dedup src one`
- **THEN** the command SHALL pass the complete argument text as scope intent to the lazy skill
- **AND** it SHALL not reinterpret the command as an exhaustive audit request.

### Requirement: Deduplication structural checks do not claim behavioral proof
Deterministic contract tests SHALL verify skill metadata, command routing, candidate classifications, recommendation/output fields, reviewer reuse, forbidden agent/upstream-skill artifacts, and trivial-fix opt-out wording. They SHALL NOT claim that those markers prove semantic classification or runtime behavior.

#### Scenario: Required safety marker is removed
- **WHEN** the skill omits the rule that clone output is not semantic-equivalence proof or the command permits automatic production editing
- **THEN** focused contract validation SHALL fail and name the affected artifact
- **AND** the failure SHALL remain structural evidence only.

### Requirement: Same-model evaluation covers deduplication decisions
The instruction change SHALL be evaluated with bounded same-model baseline/candidate workflows using identical model, input, workspace shape, and tool envelope for local existing owner, exact clone, near clone with different semantics, unique compatibility test, no-match helper, and trivial fix scenarios. Candidate retention SHALL require the expected scoped decision and absence of unauthorized source mutation.

#### Scenario: Candidate merges semantic near clones
- **WHEN** the candidate recommends merging the near-clone scenario solely because the text is similar
- **THEN** behavior evaluation SHALL fail that scenario
- **AND** the instruction candidate SHALL not qualify until corrected and re-proved.

#### Scenario: Candidate adds trivial-fix ceremony
- **WHEN** the candidate loads the skill, invokes `jscpd`, or dispatches a reviewer for the unrelated trivial-fix scenario
- **THEN** behavior evaluation SHALL fail the proportionality oracle
- **AND** the workflow SHALL remain at `development` or `MVP` rather than RC.
