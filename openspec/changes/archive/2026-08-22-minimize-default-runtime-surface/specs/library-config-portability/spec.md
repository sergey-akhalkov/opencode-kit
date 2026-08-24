## MODIFIED Requirements

### Requirement: Three-layer config layering

The repository SHALL maintain these three kit-owned OpenCode configuration files with distinct audiences inside a broader additive runtime source model:

- `opencode.json` (repo root) - the workspace configuration used when a developer runs OpenCode inside this repository, retaining its separate `permission: "ask"` policy.
- `global/opencode.json.template` - the portable full-catalog compatibility source shipped with the kit; it SHALL NOT be materialized as the new-install default without explicit `all` selection.
- `global/opencode.json` (gitignored) - the machine-local config provisioned inside the custom directory and editable per machine.

A new core installation SHALL render a schema-valid owner-neutral config with ask-level mutation permissions and no personal facts. An operator MAY explicitly select machine-local autonomy, which writes permissive policy only to the gitignored machine-local config and records that choice in privacy-safe diagnostics. Explicit `all` selection SHALL retain the template's disclosed permissive compatibility policy. Existing machine-local configs SHALL be preserved byte-for-byte unless explicit migration is selected.

The repository SHALL describe OpenCode configuration and artifact loading according to the current official schema, source, and observed runtime. It SHALL distinguish at least remote or managed configuration, the host default global config, explicit `OPENCODE_CONFIG`, project config and `.opencode`, custom `OPENCODE_CONFIG_DIR`, and inline `OPENCODE_CONFIG_CONTENT` where supported. The three kit-owned files SHALL NOT be described as the complete set of sources in the resolved runtime.

`OPENCODE_CONFIG_DIR` SHALL be described as selecting a custom loader-visible directory with precedence, not as proof that the host default global directory is bypassed or unloaded. Claims about `AGENTS.md`, skill, agent, command, plugin, or config precedence SHALL require current docs, source, or isolated live evidence for that artifact class.

Any global `allow` selection SHALL be documented as an explicit machine-local permissive tool configuration rather than an OS sandbox or managed safety boundary. Instruction-level protected-boundary rules remain required but SHALL NOT be described as hard permission enforcement.

The repository MAY additionally ship restricted schema-valid model profile fragments under `global/model-profiles/`. These fragments SHALL NOT be treated as automatically loaded base layers, SHALL contain only model-routing fields, and SHALL take effect only when explicitly supplied as ephemeral `OPENCODE_CONFIG_CONTENT` by the model-profile launcher.

#### Scenario: Contributor identifies the right file
- **WHEN** a contributor needs to change kit default OpenCode behavior other than launch-time model routing
- **THEN** the README SHALL name which of the three kit-owned files or runtime-surface manifests to edit
- **AND** doctor SHALL identify the inspected kit source without claiming that every other runtime source is absent.

#### Scenario: Contributor changes model routing
- **WHEN** a contributor needs a reusable launch-time model matrix
- **THEN** the README SHALL direct them to a committed or `local:` model profile rather than agent frontmatter or a fourth implicit config layer
- **AND** it SHALL explain that profile selection starts a new OpenCode process and does not rewrite the three kit-owned files.

#### Scenario: Template seeds the machine-local config
- **WHEN** default installation runs and `global/opencode.json` does not exist
- **THEN** the installer SHALL materialize only the reviewed core config and documented local-instructions path through a temporary file plus atomic rename
- **AND** the new config SHALL use ask-level mutation permissions and contain only official schema fields.

#### Scenario: Operator explicitly selects machine autonomy
- **WHEN** the operator selects the documented autonomy mode during provisioning
- **THEN** permissive main-tool policy is written only to the gitignored machine-local config
- **AND** portable committed authority remains owner-neutral.

#### Scenario: Existing kit config is preserved
- **WHEN** `global/opencode.json` already exists without the expected core/profile metadata or local-instructions path
- **THEN** the installer SHALL preserve its bytes and report the missing or differing facts actionably
- **AND** it SHALL NOT migrate or overwrite machine-local configuration.

#### Scenario: Existing legacy config
- **WHEN** installer or doctor encounters an existing `global/opencode.json` containing an unsupported marker field
- **THEN** it SHALL report a blocking diagnostic that instructs the user to remove the field
- **AND** it SHALL NOT print, rewrite, or discard the user's remaining machine-local configuration.

#### Scenario: Explicit model profile overlay
- **WHEN** the owner selects a valid model profile through the launcher
- **THEN** only the child OpenCode process SHALL receive the profile as inline configuration
- **AND** no repository, project, global, machine-local, shell-profile, or managed configuration file SHALL be modified.

#### Scenario: Runtime loads default and custom plugins
- **WHEN** current runtime evidence reports a plugin from the host default config and plugins from `OPENCODE_CONFIG_DIR`
- **THEN** doctor and documentation report additive sources
- **AND** they do not claim the host default directory stopped loading.

#### Scenario: Contributor identifies a machine-local instruction source
- **WHEN** a contributor needs personal language, authorization, availability, or model-routing notes outside portable authority
- **THEN** documentation uses a gitignored file referenced by an official config option
- **AND** no personal content is committed to portable `global/AGENTS.md`.
