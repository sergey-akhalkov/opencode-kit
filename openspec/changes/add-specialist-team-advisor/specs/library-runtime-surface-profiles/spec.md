## ADDED Requirements

### Requirement: Default profiles expose one current team-advice surface

The default `core` and compatibility `all` profiles SHALL expose exactly one retained team-advice surface and one standalone read-only `specialist_catalog` plugin source under non-auto-discovered `global/extensions/`, required for the advisor to fetch parent-root availability facts. The plugin SHALL be an explicit profile-owned file and config entry rather than an implicit auto-discovered plugin, directory-wide core dependency, or a new profile-entry kind. The retained advisor SHALL remain loader-visible through concise discovery metadata while its complete body remains on demand. Profile resolution SHALL reject duplicate semantic advisors, missing advisor or plugin bytes, conflicting profile copies, unavailable catalog dependencies, or a recommendation surface that can name artifacts outside the root-effective catalog.

The `core` config renderer SHALL emit a plugin array containing only the materialized `extensions/specialist-catalog.ts` URL; it SHALL NOT copy the full compatibility template plugin list into `core`. The `all` profile SHALL retain its existing template/directory behavior and add the same explicit standalone plugin exactly once. Merely adding the repository source file SHALL NOT activate it in the current global runtime; installation, config mutation, and restart remain separate authorized operations.

Adding team advice SHALL preserve canonical ownership, exact-duplicate handling, context quality, loaded discovery behavior, committed-authority, safety, consumer-outcome, and cleanup boundaries. Inventory size and token-proxy measurements SHALL remain diagnostics. Implementation SHALL remove or consolidate overlapping routing text only when one canonical owner and unchanged behavior are evidenced; it SHALL NOT introduce a replacement size ceiling or silently omit the default advisory behavior.

#### Scenario: Core resolves the retained advisor

- **WHEN** the candidate `core` profile is resolved and inspected through the actual loader
- **THEN** exactly one retained team-advice surface and the standalone `specialist_catalog` plugin are materialized and loader-visible through the core config
- **AND** excluded domain agents remain absent and cannot be recommended as available.

#### Scenario: Core renders only the catalog plugin

- **WHEN** the candidate core profile materializes its `opencode.json`
- **THEN** the plugin array contains exactly the materialized `specialist-catalog.ts` entry
- **AND** does not enable notify, session environment, PTY, completion guard, roadmap, or another all-only plugin through this change.

#### Scenario: Catalog API is unavailable during plugin execution

- **WHEN** generated core starts with the catalog plugin but the official runtime listing or caller/root identity API is absent or unreadable
- **THEN** plugin initialization remains successful and the tool call returns `unknown` with no entries
- **AND** ordinary core startup and unrelated tools remain available.

#### Scenario: Repository source exists without activation

- **WHEN** implementation adds `global/extensions/specialist-catalog.ts` but performs no profile materialization, install, config edit, or restart
- **THEN** the active global runtime does not load the plugin from source presence alone
- **AND** external-operation state remains `not performed`.

#### Scenario: Full profile supplies domain availability

- **WHEN** the candidate `all` profile is resolved
- **THEN** the advisor receives the exact full-profile agent and skill availability projection
- **AND** every recommendation remains constrained to that effective manifest.

#### Scenario: Two profiles supply different advisor bytes

- **WHEN** selected profiles expose the same retained advisor identity with conflicting bytes or expose two semantic team advisors
- **THEN** profile resolution fails before installation or config mutation
- **AND** names the conflicting profile and source identities.

#### Scenario: Unique advisor behavior changes a context diagnostic

- **WHEN** the advisor description, compact main routing rule, skill metadata, or active-catalog projection adds unique required behavior and increases a size or token-proxy measurement
- **THEN** inventory reports the changed diagnostic and canonical ownership, context quality, and loaded behavior remain the acceptance gates
- **AND** the candidate is not rejected solely for size growth and no replacement ceiling is introduced.

#### Scenario: Advisor is unavailable after profile resolution

- **WHEN** a resolved profile names the retained advisor but live loader evidence cannot discover or invoke it
- **THEN** runtime readiness reports the exact profile, loader, and source mismatch
- **AND** main does not silently substitute a checkout copy, another reviewer, or a static roster.
