# Instruction Artifact Contracts Spec

## ADDED Requirements

### Requirement: Tool Contracts Are Manifest-Backed

Repository automation scripts SHALL be verified against a deterministic tool contract manifest.

#### Scenario: Package script matches contract

- **GIVEN** `tools/tool-contracts.json` defines a script and command
- **WHEN** the tooling contract checker runs
- **THEN** `package.json` contains the script
- **AND** the script command matches exactly
- **AND** required test files and README anchors exist

#### Scenario: Package script drifts

- **GIVEN** a package script command differs from the manifest
- **WHEN** validation runs
- **THEN** validation fails with the script name, expected command, and actual command

### Requirement: Instruction Artifact Catalogs Are Deterministic

Skill, agent, instruction template, profile, and README catalog state SHALL be checked by exact artifact sets and stable ordering.

#### Scenario: README catalog matches artifacts

- **GIVEN** skills, agents, and instruction templates exist in the repository
- **WHEN** the instruction manifest checker runs
- **THEN** README catalog entries match the artifact set exactly
- **AND** missing, stale, or duplicate entries are reported deterministically

#### Scenario: Generated README block is stale

- **GIVEN** a README block is marked as generated or contract-checked
- **WHEN** the source manifest changes without updating the block
- **THEN** the checker fails with the block name and expected replacement content or hash

### Requirement: Reviewer Agents Follow The Leaf Contract

Reusable reviewer agents SHALL conform to the shared leaf reviewer contract.

#### Scenario: Reviewer agent permissions are valid

- **GIVEN** a reusable reviewer agent Markdown file
- **WHEN** the reviewer contract checker parses frontmatter
- **THEN** read-only search tools are allowed
- **AND** mutating, delegation, question, web, external directory, LSP, and doom-loop permissions are denied

#### Scenario: Reviewer output contract is incomplete

- **GIVEN** a reviewer agent omits a required output section
- **WHEN** validation runs
- **THEN** validation fails and names the missing section

### Requirement: Porting Anchors Are Explicit

Project-specific anchors in reusable artifacts SHALL be checked from an explicit manifest.

#### Scenario: Forbidden anchor appears

- **GIVEN** `porting-anchors.json` lists a forbidden substring or regex
- **WHEN** validation scans instruction artifacts
- **THEN** each unsuppressed match is reported with file and line evidence

#### Scenario: Anchor suppression lacks reason

- **GIVEN** a suppression entry has no reason
- **WHEN** the anchor manifest is validated
- **THEN** validation fails before scanning content

### Requirement: Instruction Audits Produce Redacted Evidence Bundles

Broad instruction-artifact audits SHALL be able to start from a deterministic evidence bundle.

#### Scenario: Audit evidence bundle is produced

- **GIVEN** the repository has skills, agents, instructions, profiles, README, and validators
- **WHEN** the audit evidence helper runs
- **THEN** it emits schema-backed JSON with artifact counts, catalog status, permission matrix, profile references, duplicate exact blocks, and validator/test presence
- **AND** absolute paths are redacted unless explicitly requested

#### Scenario: Duplicate prose is reported exactly

- **GIVEN** the same normalized multi-line block appears in multiple instruction artifacts
- **WHEN** duplicate block reporting is enabled
- **THEN** the helper reports exact hashes, line ranges, and occurrence paths without scoring or ranking quality
