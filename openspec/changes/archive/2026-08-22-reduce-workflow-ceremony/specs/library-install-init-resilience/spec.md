## ADDED Requirements

### Requirement: Doctor distinguishes the kit checkout from consumer projects
Doctor SHALL identify the `opencode-dev-kit` checkout through repository-owned package identity plus the intentional `REPO_AGENTS.md` and `global/` runtime-authority layout. For that self-hosted layout, absence of a root `AGENTS.md` or `opencode-dev-kit/adapter.json` SHALL not block structural or qualification status when equivalent repository-native authority and concrete package validation commands are present. Consumer projects SHALL retain the existing project AGENTS and adapter or validation requirements.

#### Scenario: Doctor inspects the kit checkout
- **WHEN** doctor targets the kit repository containing its package identity, `REPO_AGENTS.md`, conforming `global/AGENTS.md`, qualification skill, and concrete package validation scripts
- **THEN** it does not report missing consumer project AGENTS or adapter as qualification blockers
- **AND** still reports genuine runtime-source, authority, validation, or unattended blockers.

#### Scenario: Doctor inspects an unbootstrapped consumer
- **WHEN** doctor targets a normal consumer repository without project runtime guidance or a complete validation adapter
- **THEN** qualification remains blocked with the existing explicit reasons
- **AND** the kit self-hosted exception is not applied from a similar directory name alone.

### Requirement: Doctor reports active workflow contract conflicts
Doctor's qualification and unattended reports SHALL include cross-artifact workflow consistency results from repository validation or an equivalent deterministic owner. A detected require/forbid contradiction in active normative/runtime surfaces SHALL block the affected gate even when every individual document parses successfully.

#### Scenario: Individually valid artifacts contradict each other
- **WHEN** a normative spec requires a completion ceremony that active workflow validation forbids
- **THEN** doctor reports the conflict as a qualification blocker
- **AND** names the affected capability and privacy-safe artifact paths.
