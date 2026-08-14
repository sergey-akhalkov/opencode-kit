## ADDED Requirements

### Requirement: Instruction inventory SHALL expose explicit source scopes

The instruction inventory SHALL preserve the current repository catalog as the
default `catalog` source scope and SHALL expose a separate `loader-visible` source
scope for one explicitly selected project. It SHALL report startup-visible
instruction candidates, discovery metadata, and on-demand artifact bodies as
separate categories and SHALL NOT combine them into one claimed prompt size.

#### Scenario: Existing catalog inventory remains stable
- **WHEN** the inventory runs without an explicit source scope
- **THEN** it reports the kit catalog using the existing classification and does not reinterpret all skill bodies as startup-loaded prompt text

#### Scenario: Consumer runtime categories remain separate
- **WHEN** loader-visible inventory finds project instructions and global and project skill catalogs
- **THEN** it reports instruction candidates, skill-description metadata, and skill bodies in separate totals

### Requirement: Loader-visible inventory SHALL preserve privacy and uncertainty

Loader-visible inventory SHALL emit aggregate counts, token proxies, evidence
classes, and redacted source identities only. It SHALL NOT emit instruction text,
repeated-line samples, config values outside supported instruction paths, provider
options, credentials, or secret-bearing content. Unsupported, unreadable, remote,
dynamic, or precedence-ambiguous sources SHALL be reported as `unknown` rather
than silently omitted or treated as loaded.

#### Scenario: External local instruction is counted without disclosure
- **WHEN** project config declares a readable local instruction file outside the project root
- **THEN** the report includes its aggregate size and redacted identity without any content-derived excerpt

#### Scenario: Unsupported instruction source remains visible
- **WHEN** a configured instruction source cannot be safely resolved as a supported local file
- **THEN** the report records one cause-preserving unknown row and does not infer its size or loaded state

### Requirement: Instruction budgets SHALL have one enforceable seed owner

The repository SHALL maintain one versioned checked-in budget seed containing only
reviewed maximum token proxies for the kit catalog and committed global startup
authority. Measured counts, hashes, lengths, ordering, and drift SHALL be derived
from source. Strict validation SHALL fail when a measured boundary exceeds its
reviewed maximum or when the seed is malformed. Historical lower targets SHALL
remain documented as reduction debt until separately achieved or superseded.

#### Scenario: Instruction growth exceeds the reviewed maximum
- **WHEN** a catalog or committed global-authority token proxy is greater than its checked-in maximum
- **THEN** strict validation fails with the boundary name, maximum, actual value, and deterministic regeneration command

#### Scenario: Derived values are not duplicated into the seed
- **WHEN** the budget seed is reviewed
- **THEN** it contains no current hash, measured total, source ordering, or generated drift field

#### Scenario: Consumer has no project-owned budget
- **WHEN** loader-visible inventory runs for a project without a compatible budget seed
- **THEN** it reports measurements without imposing the kit's catalog maximum on that project
