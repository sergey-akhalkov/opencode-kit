## ADDED Requirements

### Requirement: Reuse discovery has one compact loaded trigger and one lazy detail source

`global/AGENTS.md` SHALL be the canonical loaded authority for the new-mechanism trigger, compact disposition, minimum-sufficient abstraction rule, and conditional loading of the reuse-discovery skill. Detailed search order, total-cost factors, registry protocol, query limits, source verification, and outbox behavior SHALL live in one lazy-loaded reusable skill.

Project templates, reusable instructions, maintainer guidance, implementation roles, and quality guidance SHALL use a pointer or role-specific delta and SHALL NOT reproduce the complete trigger/workflow contract. No new agent SHALL be introduced solely for reuse discovery.

#### Scenario: Triggered new mechanism loads detail
- **WHEN** a fresh session determines that a proposed change adds a triggered mechanism
- **THEN** the loaded authority SHALL require the reuse-discovery skill before production code
- **AND** the skill SHALL provide the detailed workflow without requiring a duplicate always-loaded block.

#### Scenario: Trivial fix avoids detail load
- **WHEN** a fresh session receives an owner-local fix with no triggered mechanism
- **THEN** it SHALL proceed without loading the reuse-discovery skill or registry catalog
- **AND** deterministic instruction checks SHALL reject mirror wording that makes the workflow universal for every edit.

### Requirement: Inventory uses one reusable free-form command artifact

The kit SHALL provide one reusable command file under a supported global command directory for `/reuse-inventory`. Its prompt SHALL accept `$ARGUMENTS` as free-form user intent, route deterministic scanning through the canonical reuse-discovery skill/client contract, and avoid duplicating the full loaded new-mechanism trigger or registry protocol.

README/catalog/profile and validation surfaces SHALL make the command discoverable and SHALL verify its frontmatter/body, natural-language input contract, exact-resolution/privacy rules, local-checkout-only Git policy, and deterministic-core handoff. The command SHALL remain lazy and SHALL not add its full body to every session's instruction context.

#### Scenario: User invokes command without CLI flags
- **WHEN** the user supplies a plain-language inventory or rescan request after `/reuse-inventory`
- **THEN** the command SHALL treat the full text as intent and resolve a machine-readable plan
- **AND** it SHALL not require positional syntax or expose deterministic-core flags as the user contract.

#### Scenario: Command policy is duplicated into global authority
- **WHEN** a maintained loaded instruction copies the complete bootstrap/rescan prompt instead of keeping a compact pointer/trigger
- **THEN** deterministic validation SHALL fail and name the duplicate surface
- **AND** command detail SHALL remain in the one lazy command/skill owner.

### Requirement: Reuse policy does not increase routine instruction context

The change SHALL not increase the token proxy of `global/AGENTS.md` or the maintained always-loaded/shared runtime corpus above their captured pre-change baselines. Any new lazy-skill instruction cost SHALL be paid for by consolidating superseded reuse, modularity, and inventory wording rather than copying the new contract across artifacts. Registry schemas, catalog data, generated indexes, and query results SHALL not be loaded as instructions.

Deterministic validation SHALL check exact canonical markers, forbidden universal-search wording, maintained mirror pointers, and instruction-inventory budgets. These checks SHALL remain drift tripwires and SHALL NOT claim to prove model behavior.

#### Scenario: New detail is copied into project templates
- **WHEN** a maintained template repeats the complete search order or registry workflow instead of using the canonical pointer
- **THEN** repository validation SHALL fail and name the duplicate surface
- **AND** the duplicate SHALL be removed or reduced to a role-specific delta.

#### Scenario: Registry catalog is added to loaded instructions
- **WHEN** a committed instruction source embeds capability entries, private project membership, or a generated capability index
- **THEN** repository validation SHALL reject the loaded catalog content
- **AND** discovery SHALL remain a bounded runtime query.

### Requirement: Same-model evaluation proves proportional reuse behavior

Loaded-policy qualification SHALL compare baseline and candidate sessions using the same model/profile, synthetic inputs, disposable environment, and observable outcome/proof oracles. The matrix SHALL include an existing local owner, an allowlisted registered capability, a stale record, a typical external capability, a no-match custom implementation, a trivial owner-local fix, and unavailable registry/cache.

Raw evidence SHALL preserve exact candidate/baseline instruction identity, invocations, tool calls, token/context facts, elapsed-time facts when observed, outputs, side effects, diagnostics, and cleanup. Retention SHALL require that the candidate fixes the reproduced discovery defect or improves reuse while preserving outcome quality and adding no registry/skill call to the trivial-fix scenario. A deterministic helper SHALL NOT derive a synthetic quality or prompt-effectiveness score.

#### Scenario: Candidate adds ceremony to trivial work
- **WHEN** the candidate trivial-fix session loads reuse-discovery detail or queries registry sources while the equivalent baseline task requires neither
- **THEN** the candidate SHALL fail the proportionality oracle
- **AND** the policy SHALL be narrowed or discarded before qualification.

#### Scenario: Candidate finds seeded registered reuse
- **WHEN** an allowlisted disposable registry contains an exact capability for the synthetic task
- **THEN** the candidate SHALL verify and select the bound source without querying unallowlisted projects or adding a duplicate mechanism
- **AND** raw evidence SHALL retain the query and source-verification facts.
