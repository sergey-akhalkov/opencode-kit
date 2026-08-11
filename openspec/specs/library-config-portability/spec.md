# library-config-portability Specification

## Purpose
Defines portable OpenCode configuration sources, machine-local separation, schema validation, permissions disclosure, and runtime-loading diagnostics.
## Requirements
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

### Requirement: Schema-valid machine-local config

The installer, validator, examples, and documentation SHALL NOT add or require fields absent from the official OpenCode schema. The validator SHALL identify only the exact root-relative `global/opencode.json.template` and gitignored `global/opencode.json` layers by path and downgrade broad-permission diagnostics for those intentional global defaults to info level. Other configs with broad mutation-capable permissions SHALL retain warning severity.

#### Scenario: portable global template permission allow

- **WHEN** the exact root-relative `global/opencode.json.template` contains `"permission": "allow"`
- **THEN** `npm run validate` SHALL emit an `INFO:` line instead of a `WARN:` line
- **AND** `npm run validate:strict` SHALL NOT fail.

#### Scenario: machine-local permission allow

- **WHEN** the exact root-relative gitignored `global/opencode.json` contains `"permission": "allow"`
- **THEN** `npm run validate` SHALL emit an `INFO:` line instead of a `WARN:` line
- **AND** `npm run validate:strict` SHALL NOT fail.

#### Scenario: near-miss path remains strict

- **WHEN** a config such as `nested/global/opencode.json`, `nested/global/opencode.json.template`, or repo-root `opencode.json` contains `"permission": "allow"`
- **THEN** validation SHALL emit a warning
- **AND** strict validation SHALL fail.

#### Scenario: unsupported field

- **WHEN** any OpenCode config contains a field that this repository previously invented as a local-override marker
- **THEN** validation SHALL reject the config and instruct the contributor to remove the unsupported field.

### Requirement: No hardcoded user paths in shipped config

The committed `global/opencode.json` SHALL NOT contain absolute user paths. The committed file SHALL either omit machine-specific providers/MCPs or reference them via documented placeholder values.

#### Scenario: working tree before change

- **WHEN** `global/opencode.json` currently contains `C:/Users/Sergey/.local/bin/codebase-memory-mcp.exe`
- **THEN** this change SHALL remove that path
- **AND** the README SHALL document how to add the path back via `global/opencode.local.json`.

#### Scenario: overlay example

- **WHEN** `global/opencode.local.json.example` exists in the repo
- **THEN** it SHALL contain only official OpenCode schema fields
- **AND** README SHALL state that `OPENCODE_CONFIG` must explicitly load the copied overlay
- **AND** `.gitignore` SHALL ignore `global/opencode.local.json`.

### Requirement: Portable global code-intelligence MCP setup

`global/opencode.json.template` SHALL enable Serena and Codebase Memory as local MCP servers through commands resolved from `PATH`, without absolute user paths. The repository SHALL expose a TypeScript installer that installs only missing executables, preserves working existing versions, and supports non-mutating `--check` and `--dry-run` modes.

#### Scenario: global MCP launch commands

- **WHEN** OpenCode loads the provisioned global config from a project workspace
- **THEN** Codebase Memory SHALL launch through `codebase-memory-mcp`
- **AND** Serena SHALL launch through `serena start-mcp-server --context ide --project-from-cwd`.

#### Scenario: existing MCP installations

- **WHEN** both executable version probes succeed
- **THEN** `npm run install:mcps` SHALL NOT run either package installation command
- **AND** SHALL report both executables as configured.

#### Scenario: missing MCP installations

- **WHEN** an executable version probe reports that Serena or Codebase Memory is missing
- **THEN** default `npm run install:mcps` SHALL use the documented official package-manager command for that executable
- **AND** `--dry-run` SHALL print the command without installing or initializing anything
- **AND** `--check` SHALL exit non-zero without installing or initializing anything.

### Requirement: global/.gitignore consistency

The file `global/.gitignore` SHALL NOT ignore files that are intentionally tracked in `global/`. The dependencies in `global/package.json` and `global/package-lock.json` SHALL be either both tracked or both ignored, not mismatched.

#### Scenario: tracked dependency files

- **WHEN** `git ls-files global/package.json global/package-lock.json` reports them as tracked
- **THEN** `global/.gitignore` SHALL NOT list `package.json` or `package-lock.json`
- **AND** the change SHALL include a task confirming the `git ls-files` result.

#### Scenario: ignored dependency files

- **WHEN** the dependency files are NOT tracked
- **THEN** this change SHALL either remove `global/package.json` and `global/package-lock.json` from the working tree, OR hoist the dependency into the root `package.json` and remove the files from `global/`.

### Requirement: validator recognizes machine-local path

The validator SHALL recognize `global/opencode.json` as the machine-local layer by path and SHALL downgrade specific broad-permission warnings accordingly. It SHALL reject unsupported marker fields. Both behaviors SHALL be covered by regression tests.

#### Scenario: regression test for local-path behavior

- **WHEN** the fixture repo is constructed with a `global/opencode.json` containing `"permission": "allow"`
- **THEN** `npm run validate:strict` SHALL pass
- **AND** the output SHALL include an `INFO:` line referencing the broad local permission.

#### Scenario: regression test for unsupported marker

- **WHEN** a fixture OpenCode config contains an unsupported local-override marker field
- **THEN** validation SHALL fail with a diagnostic that the field can prevent OpenCode startup.

### Requirement: Portable workflow tools accompany the global kit source

Reusable project workflow entrypoints SHALL live under explicit non-loader `global/bin/` so the same resolved kit global source provides runtime instructions and their deterministic executables in unrelated project contexts. The tools SHALL use import-safe main guards and remain explicit invocations rather than auto-loaded OpenCode custom tools or plugins.

#### Scenario: Kit source is used from another project

- **WHEN** `OPENCODE_CONFIG_DIR` resolves to the kit global source and the current working directory is an unrelated project
- **THEN** the project can invoke the portable tools with its own explicit root and validation argv
- **AND** the tools do not derive behavior from the kit repository working directory.

### Requirement: Completion guard options use schema-valid plugin configuration
The portable global config and installer SHALL configure the completion guard through an official plugin tuple and supported option values. Defaults SHALL include default-off per-root grind mode, the hidden arbiter name, `maxCycles: -1`, single-model exponential retry, per-session docs fallback, retain-all audit sessions, and status/toast reporting. The plugin SHALL register `/enable-grind` and `/disable-grind` through its supported config hook; the config SHALL NOT add unsupported OpenCode top-level fields.

#### Scenario: Portable config is validated
- **WHEN** the global template containing the guard plugin tuple is checked against the current OpenCode schema and live loader
- **THEN** OpenCode SHALL start without `ConfigInvalidError`
- **AND** the plugin SHALL receive the documented option object.

#### Scenario: Commands are loaded
- **WHEN** OpenCode starts with the enabled guard plugin
- **THEN** command inventory SHALL include `/enable-grind` and `/disable-grind` with bounded confirmation templates
- **AND** the presence of those commands SHALL NOT enable grind for any root.

### Requirement: Guard runtime defaults main permissions to allow
When enabled, the completion guard config hook SHALL set the merged top-level permission policy to `allow` for the running OpenCode instance. Documentation SHALL state that this is permissive tool configuration, not an OS sandbox or external-operation authorization. Explicit specialist-agent permission rules SHALL remain separately inspectable and effective.

#### Scenario: Project ask is merged under active guard
- **WHEN** a project config would otherwise resolve an ask-level main permission and the global guard is enabled
- **THEN** runtime config inspection SHALL show the main permission default as allow
- **AND** the project file itself SHALL not be rewritten.

#### Scenario: Guard is disabled
- **WHEN** the configured completion guard is disabled
- **THEN** it SHALL not mutate the merged permission policy
- **AND** ordinary OpenCode source precedence SHALL determine permissions.

### Requirement: Runtime diagnostics identify the pinned PTY source
Privacy-safe source diagnostics SHALL report the kit-relative PTY bridge, completion guard, pinned `opencode-pty` version, and whether the shared-manager capability check passed. They SHALL not print plugin source, prompts, provider options, or credentials.

#### Scenario: Cache package also exists
- **WHEN** an OpenCode package-cache copy of `opencode-pty` is present while the kit bridge is configured
- **THEN** diagnostics SHALL identify the kit bridge as the active intended source
- **AND** SHALL report a collision or unknown if runtime evidence cannot prove which copy loaded.

### Requirement: Audit-window configuration is portable and opt-in
The completion-guard plugin options SHALL carry the monitor configuration inside the existing plugin tuple rather than through unsupported OpenCode top-level fields. The portable template SHALL default to `enabled: false` with fixed `mode: read-only-monitor`, `scope: per-root`, `terminal: powershell-shell`, and `closePassedAfterMs: 15000`. A machine-local config MAY opt in without rewriting the portable template.

#### Scenario: Portable config is installed on a non-Windows or headless machine
- **WHEN** the portable template is materialized without a machine-local opt-in
- **THEN** no OS terminal window SHALL be launched
- **AND** ordinary guard toast, metadata, and log observability SHALL remain available.

#### Scenario: Owner opts in on Windows
- **WHEN** the machine-local plugin tuple sets `auditWindow.enabled` to true and the fixed option values are valid
- **THEN** the running guard SHALL enable one read-only minimized PowerShell shell monitor per guarded root after restart
- **AND** config validation SHALL reject unsupported mode, scope, terminal, or close-delay values before activation.

