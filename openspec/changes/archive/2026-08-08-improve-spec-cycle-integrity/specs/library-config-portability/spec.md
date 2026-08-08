## MODIFIED Requirements

### Requirement: Three-layer config layering

The repository SHALL maintain these three kit-owned OpenCode configuration files with distinct audiences inside a broader additive runtime source model:

- `opencode.json` (repo root) - the workspace configuration used when a developer runs OpenCode inside this repository, retaining its separate `permission: "ask"` policy.
- `global/opencode.json.template` - the portable autonomy-first provisioning source shipped with the kit, using `permission: "allow"`.
- `global/opencode.json` (gitignored) - the machine-local config provisioned inside the custom directory and editable per machine.

The repository SHALL describe OpenCode configuration and artifact loading according to the current official schema, source, and observed runtime. It SHALL distinguish at least remote or managed configuration, the host default global config, explicit `OPENCODE_CONFIG`, project config and `.opencode`, custom `OPENCODE_CONFIG_DIR`, and inline `OPENCODE_CONFIG_CONTENT` where supported. The three kit-owned files SHALL NOT be described as the complete set of sources in the resolved runtime.

`OPENCODE_CONFIG_DIR` SHALL be described as selecting a custom loader-visible directory with precedence, not as proof that the host default global directory is bypassed or unloaded. Claims about `AGENTS.md`, skill, agent, command, plugin, or config precedence SHALL require current docs, source, or isolated live evidence for that artifact class.

The global `allow` default SHALL be documented as permissive tool configuration rather than an OS sandbox or managed safety boundary. Instruction-level protected-boundary rules remain required but SHALL NOT be described as hard permission enforcement.

The repository MAY additionally ship restricted schema-valid model profile fragments under `global/model-profiles/`. These fragments SHALL NOT be treated as automatically loaded base layers, SHALL contain only model-routing fields, and SHALL take effect only when explicitly supplied as ephemeral `OPENCODE_CONFIG_CONTENT` by the model-profile launcher.

#### Scenario: Contributor identifies the right file

- **WHEN** a contributor needs to change kit default OpenCode behavior other than launch-time model routing
- **THEN** the README SHALL name which of the three kit-owned files to edit
- **AND** doctor SHALL identify the inspected kit source without claiming that every other runtime source is absent.

#### Scenario: Contributor changes model routing

- **WHEN** a contributor needs a reusable launch-time model matrix
- **THEN** the README SHALL direct them to a committed or `local:` model profile rather than agent frontmatter or a fourth implicit config layer
- **AND** it SHALL explain that profile selection starts a new OpenCode process and does not rewrite the three kit-owned files.

#### Scenario: Template seeds the machine-local config

- **WHEN** `tools/install-opencode-global.ts` runs in default mode and `global/opencode.json` does not exist
- **THEN** the installer SHALL materialize only the documented local-instructions placeholder as an absolute forward-slash path and write the result through a temporary file plus atomic rename
- **AND** the new file SHALL retain `permission: "allow"`, contain only fields supported by the official OpenCode schema, and provision the gitignored local instruction file from its portable example.

#### Scenario: Existing kit config is preserved

- **WHEN** `global/opencode.json` already exists without the expected absolute local-instructions path
- **THEN** the installer SHALL preserve its bytes and report the missing path actionably
- **AND** it SHALL NOT migrate or overwrite machine-local configuration.

#### Scenario: Existing legacy config

- **WHEN** installer or doctor encounters an existing `global/opencode.json` containing the previously generated unsupported marker field
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

- **WHEN** a contributor needs personal language or model-routing notes outside portable authority
- **THEN** documentation uses a gitignored file referenced by the official `instructions` config option
- **AND** no personal content is committed to portable `global/AGENTS.md`.

## ADDED Requirements

### Requirement: Runtime source diagnostics are privacy-safe and collision-aware
Doctor or an equivalent read-only diagnostic SHALL enumerate loader-visible source kinds and safe locations relevant to instructions, skills, agents, commands, plugins, and config. It SHALL identify same-name or competing authority sources as collisions or unknown precedence without printing file contents, prompts, credentials, provider options, or secret-bearing config.

#### Scenario: Default and custom skills share a name
- **WHEN** runtime discovery reports the same skill name from the host default and custom directories
- **THEN** diagnostics identify both safe source locations and the collision
- **AND** qualification does not assume one source is absent without resolved precedence evidence.

#### Scenario: Debug output may contain sensitive config
- **WHEN** runtime source inspection uses OpenCode debug commands
- **THEN** the diagnostic extracts only approved source names and paths
- **AND** raw secret-bearing resolved config is not persisted or printed.
