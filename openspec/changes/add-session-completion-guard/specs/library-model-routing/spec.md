## ADDED Requirements

### Requirement: Completion arbiter has complete configurable routing
Every committed model profile SHALL explicitly route the hidden `session-completion-arbiter`. The arbiter Markdown SHALL omit model and variant frontmatter. `quality-independent` SHALL route it to `xai/grok-4.5` with variant `high`; `sol-only` and `grok-only` SHALL route it to their respective complete single-model settings.

#### Scenario: Arbiter replaces retired profile key
- **WHEN** the active delivery reviewer is retired
- **THEN** every committed profile SHALL remove `session-delivery-reviewer` and add `session-completion-arbiter`
- **AND** profile validation SHALL still cover the complete governed agent catalog.

#### Scenario: Owner configures another arbiter model
- **WHEN** a supported profile or machine-local agent override selects another valid model for the arbiter
- **THEN** the guard SHALL use that configured model in a fresh child session
- **AND** model coincidence with the primary session SHALL not invalidate fresh-context independence by itself.

### Requirement: Runtime proof records arbiter identity
Completion-guard runtime evidence SHALL record the effective arbiter agent, model, variant, child session ref, root parent ref, audit id, and structured schema version using privacy-safe identifiers.

#### Scenario: Audit child is created
- **WHEN** deterministic preflight launches a completion audit
- **THEN** the retained child metadata and proof record SHALL identify the effective route and correlation fields
- **AND** SHALL not expose provider credentials or raw session ids.
