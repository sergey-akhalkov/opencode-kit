## ADDED Requirements

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
