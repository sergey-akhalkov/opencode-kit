## ADDED Requirements

### Requirement: Skill discovery descriptions are domain precise
Every maintained skill description SHALL name the literal domain, artifact, or command that activates it and SHALL state a stay-quiet boundary when generic adjacent wording could match. A description for an OpenSpec skill SHALL include `OpenSpec`; generic words such as implement, build, propose, review, test, or configure SHALL NOT by themselves satisfy trigger precision.

#### Scenario: Generic implementation request is inspected
- **WHEN** a user asks to implement ordinary application code without mentioning OpenSpec or an active OpenSpec change
- **THEN** OpenSpec apply/propose skills are not selected from their descriptions alone
- **AND** ordinary implementation routing remains available

#### Scenario: Description is precise only in the body
- **WHEN** a skill body names its domain but frontmatter description remains generic
- **THEN** strict validation fails the discovery contract
- **AND** identifies the frontmatter description as the affected surface

### Requirement: Default-surface reductions require matched behavior evidence
A change to core always-loaded or discovery-visible content SHALL bind before/after loader inventories to one exact candidate and SHALL use the maintained consumer outcome gate. The core candidate SHALL preserve all hard outcome/safety oracles, satisfy `no-regression`, and meet both core context ceilings. Static marker and token checks SHALL remain supporting evidence only.

#### Scenario: Context reduction is only structurally green
- **WHEN** a candidate meets token and marker checks but lacks current matched consumer evidence
- **THEN** it cannot become the default core surface
- **AND** remains a staged candidate or explicit optional profile

#### Scenario: Candidate reduces context and preserves behavior
- **WHEN** current inventories meet the ceilings and matched consumer evidence passes no-regression
- **THEN** the candidate may become core
- **AND** retained evidence records baseline/candidate/runtime identities
