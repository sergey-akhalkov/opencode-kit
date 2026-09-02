## ADDED Requirements

### Requirement: Beads integration uses one explicit full on-demand runtime surface
The kit SHALL define one exact full `core-beads` profile whose effective manifest equals the current `core` manifest plus the on-demand Beads portfolio skill and its deterministic helper closure. Profile validation SHALL compare that exact union and fail on a missing core artifact, extra unrelated artifact, stale copy, duplicate, conflict, or missing Beads dependency. The global installer SHALL accept `core-beads` as a concrete full profile identity rather than treating a Beads-only partial tree as a runnable installation.

The default `core` profile SHALL omit the Beads artifacts. The explicit `all` compatibility profile and an unprofiled full `global/` source SHALL expose the same on-demand Beads skill/helper exactly once because they represent the full catalog; that discovery SHALL be reported truthfully rather than described as inert source. No profile or full-source discovery SHALL install the external binary, initialize or register a project, add an always-loaded Beads instruction block, invoke `bd prime`, run `bd setup opencode`, or activate a plugin or MCP.

The skill discovery description and body SHALL use an exact stay-quiet contract: load only when the user explicitly names Beads/`bd` or when a verified enabled Beads registration exists and the user requests portfolio status or coordination; stay quiet for ordinary OpenSpec, Kaizen, grind, implementation, review, and task work; when no registration exists, allow only an explicit Beads installation, enablement, or diagnostic request. The skill SHALL route vendor operations only through the closed adapter and SHALL never advise vendor-managed `AGENTS.md`, `bd prime`, or direct arbitrary `bd` execution. Complete guidance and issue context SHALL remain on demand.

#### Scenario: Core is installed without Beads
- **WHEN** a fresh default core profile is resolved
- **THEN** the Beads skill, adapter, commands, plugin, MCP, and vendor instruction block are absent from the effective manifest
- **AND** existing core behavior and Kaizen/OpenSpec ownership remain unchanged.

#### Scenario: Core-Beads profile is selected
- **WHEN** the operator explicitly selects the valid full `core-beads` profile
- **THEN** the effective manifest contains every current core artifact plus the exact on-demand Beads skill/helper closure once
- **AND** no binary install, project initialization, plugin startup, MCP process, or always-loaded Beads instruction occurs from profile resolution.

#### Scenario: Beads-only partial profile is supplied
- **WHEN** a candidate profile contains the Beads artifacts without the complete current core authority surface
- **THEN** installer/profile validation rejects it before materialization
- **AND** does not present the partial tree as a composable or runnable OpenCode installation.

#### Scenario: Full catalogs expose the optional skill
- **WHEN** the explicit `all` profile or unprofiled full `global/` source is loaded after the Beads source artifacts exist
- **THEN** their discovery metadata appears exactly once and deep guidance remains unloaded until matched
- **AND** missing binary or project registration is reported as an exact optional capability prerequisite rather than successful activation.

#### Scenario: Ordinary workflow does not trigger Beads
- **WHEN** a session performs ordinary OpenSpec, Kaizen, grind, implementation, review, or task work without an explicit Beads request or enabled-project portfolio request
- **THEN** the Beads skill remains unloaded and supplies no tracker or command guidance
- **AND** existing lifecycle owners continue without vendor setup or `bd ready` routing.

#### Scenario: Vendor-managed instructions are present in candidate output
- **WHEN** profile materialization would add the Beads managed `AGENTS.md` section or a directive that Beads owns all tracking
- **THEN** validation fails before installed-source or config mutation
- **AND** names the conflicting lifecycle authority and source artifact.
