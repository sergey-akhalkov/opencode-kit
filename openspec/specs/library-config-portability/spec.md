# library-config-portability Specification

## Purpose
Defines portable OpenCode configuration sources, machine-local separation, schema validation, permissions disclosure, and runtime-loading diagnostics.

## Requirements

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
The portable global config and installer SHALL configure the completion guard through an official plugin tuple and supported option values. Defaults SHALL include default-off per-root grind mode, the hidden arbiter name, finite continuation and retry limits suitable for recovery, one configured model, exponential retry capped by delay and attempt count, bounded arbiter prompt timeout, bounded wait recheck, bounded final request bytes, finite retained-child policy, per-session strategy fallback, and status/toast reporting. The plugin SHALL register `/enable-grind` and `/disable-grind` through its supported config hook; the config SHALL NOT add unsupported OpenCode top-level fields. Startup SHALL verify the installed client capabilities required by the enabled guard, including official question reply APIs, and SHALL fail closed on a missing capability.

The maintained proof inventory SHALL include one installed-runtime autonomous-question runner that records OpenCode, plugin source, SDK, agent/model route, question event, official reply, original tool continuation, terminal root state, diagnostics, and cleanup. A private controller call, mocked SDK adapter, owner-only question fixture, or model response without a real question tool event SHALL not satisfy that runtime boundary.

#### Scenario: Portable config is validated
- **WHEN** the global template containing the guard plugin tuple is checked against the current OpenCode schema and live loader
- **THEN** OpenCode SHALL start without `ConfigInvalidError`
- **AND** every guard option SHALL be inside the plugin tuple with a supported value.

#### Scenario: Commands are loaded
- **WHEN** OpenCode starts with the enabled guard plugin
- **THEN** command inventory SHALL include `/enable-grind` and `/disable-grind` with bounded confirmation templates
- **AND** the presence of those commands SHALL NOT enable grind for any root.

#### Scenario: Question reply capability is unavailable
- **WHEN** OpenCode starts with the enabled guard plugin
- **AND** the installed SDK/client lacks a required session, question reply, event, or tool capability
- **THEN** the guard SHALL fail startup with an actionable capability mismatch
- **AND** it SHALL not reject the question, invoke an arbiter, or inject a continuation.

#### Scenario: Installed autonomous-question proof runs
- **WHEN** the maintained runner uses a disposable root with the actual loaded guard and a real interactive question tool request
- **THEN** the guard SHALL select only a validated offered label through the official reply API, resume the original tool call, preserve synthetic provenance, and reach a terminal correlated audit
- **AND** the runner SHALL preserve stdout, stderr, status/log evidence, and environment identity
- **AND** it SHALL delete its root and child sessions in `finally`.

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

### Requirement: Runtime diagnostics expose unattended workflow and guard identity
Privacy-safe runtime diagnostics SHALL report resolved standard OpenSpec command/skill locations, project same-name collisions, mission-controller/helper identities, relevant finite guard limits, active guard plugin origin, and whether startup/recovery capability checks passed. They SHALL not print prompts, provider options, credentials, mission payload values, or sensitive command output.

#### Scenario: Target project has stale overlays
- **WHEN** runtime diagnostics inspect a target project with same-name OpenSpec project and global sources
- **THEN** diagnostics identify each safe location and unattended collision status
- **AND** they do not claim precedence from source presence alone.

### Requirement: Doctor SHALL compose canonical runtime-source collision evidence

Doctor SHALL reuse the maintained privacy-safe runtime-source inspector to evaluate
loader-visible collisions for canonical OpenSpec propose, apply, and archive skill
and command names. A same-name collision with unknown precedence SHALL block both
qualification and unattended readiness. Other additive instruction, config,
plugin, agent, command, or skill sources SHALL remain visible without becoming a
blocker unless an existing requirement identifies them as required authority.

#### Scenario: Canonical project overlay blocks lifecycle gates
- **WHEN** a project and global source both expose the same canonical OpenSpec apply skill or command and runtime precedence is unknown
- **THEN** doctor names both privacy-safe locations and blocks qualification and unattended readiness

#### Scenario: Ordinary additive instructions do not block
- **WHEN** global, parent, and project instruction sources are all loader-visible without competing canonical authority
- **THEN** doctor reports the sources and does not block a lifecycle gate solely because more than one instruction source exists

### Requirement: Runtime-source CLI help SHALL be effect-free

The runtime-source CLI SHALL parse `--help` and `-h` before resolving or walking
any source root. Help SHALL list every supported option, perform no inventory or
project effect, and exit `0`. An unknown option SHALL produce usage diagnostics and
exit `1` without running the inventory.

#### Scenario: Help performs no source scan
- **WHEN** an operator invokes `opencode:sources --help`
- **THEN** the CLI prints usage, exits `0`, and does not inspect host, custom, explicit, or project sources

#### Scenario: Unknown option fails before inventory
- **WHEN** an operator passes an unsupported runtime-source option
- **THEN** the CLI prints a cause-preserving usage error, exits `1`, and does not emit a runtime-source report

### Requirement: Loader-visible instruction discovery SHALL be bounded and evidence-classified

Loader-visible instruction discovery SHALL reuse maintained runtime-source facts,
conventional instruction locations, and supported explicit local filesystem entries
from OpenCode `instructions` configuration. It SHALL read only the resulting
bounded instruction manifest and SHALL NOT recursively scan unrelated project,
vendor, generated, evidence, or build-output trees. Every source SHALL identify
whether it was runtime-observed, config-declared, conventional, or unknown.

#### Scenario: Explicit local instruction path is discovered
- **WHEN** project OpenCode config declares a supported local Markdown instruction path
- **THEN** discovery records the path as config-declared and inventories only that resolved file

#### Scenario: Vendor tree is not part of instruction discovery
- **WHEN** a project contains a large vendor tree with Markdown files that are not instruction sources
- **THEN** loader-visible inventory does not walk or count that tree

#### Scenario: Presence does not prove precedence
- **WHEN** more than one instruction source is discovered without current loader evidence establishing a winner
- **THEN** every source remains reported and the inventory does not claim precedence or final prompt inclusion

### Requirement: Guard loading preserves config permission precedence
Portable and machine-local config MAY select permissive main permissions explicitly, but loading the completion guard SHALL NOT modify the merged permission policy. Runtime diagnostics SHALL distinguish configured permission state from guard capability and SHALL not describe plugin mutation as autonomy.

#### Scenario: Portable template remains permissive
- **WHEN** the portable global template explicitly sets `permission: "allow"`
- **THEN** runtime may resolve permissive main permissions through normal config precedence
- **AND** disabling or removing the guard does not change that configured result.

#### Scenario: Consumer narrows permissions
- **WHEN** a higher-precedence consumer or managed config narrows main permissions
- **THEN** the guard preserves the resolved restriction
- **AND** reports a cause-preserving capability gap if a required action cannot run.

### Requirement: Managed config prompt drift is visible without disclosure
Privacy-safe runtime-source diagnostics SHALL compare managed template-owned prompt fields with the active machine-local managed copy by stable digest and semantic marker inventory without printing prompt text, provider options, or credentials. Drift SHALL be reported as `same`, `different`, `missing`, or `unknown`; diagnostics SHALL not overwrite the active copy.

#### Scenario: Active compaction prompt differs from template
- **WHEN** the machine-local compaction prompt contains a removed workflow matrix that the committed template no longer contains
- **THEN** diagnostics report the managed field as different and identify the restart/synchronization boundary
- **AND** do not expose either prompt body.

### Requirement: MCP installer behavior is completely fixture-tested
The code-intelligence MCP installer SHALL expose effect-free help, `--check`, and `--dry-run`; probe Serena and Codebase Memory independently; install only missing tools in default mode; preserve working versions; stop on package-manager failure; and report stable privacy-safe executable/result facts. Maintained tests SHALL cover both present, both missing, each partial state, failed probe, failed install, invalid option, check, dry-run, and path-with-spaces behavior.

#### Scenario: One MCP is missing
- **WHEN** one executable probe succeeds and the other reports missing
- **THEN** default mode invokes only the documented installer for the missing executable
- **AND** re-probes it before success

#### Scenario: Check mode finds a missing MCP
- **WHEN** `--check` observes either executable missing
- **THEN** it exits non-zero without running a package manager
- **AND** reports each executable state independently

#### Scenario: Dry-run observes missing MCPs
- **WHEN** `--dry-run` observes missing executables
- **THEN** it prints normalized planned argv without installing or initializing anything
- **AND** exits according to the documented dry-run contract

### Requirement: Workstation path configuration has portable and machine-local owners
The repository SHALL track a schema-valid workstation configuration example containing placeholders or repository IDs but no absolute maintainer paths. The concrete host mapping SHALL live in a gitignored machine-local file. Tools SHALL require an explicit config path or documented local default and SHALL never infer the maintainer's repositories from the tracked example.

#### Scenario: Clean checkout on another machine
- **WHEN** the tracked workstation example is inspected after clone
- **THEN** it contains no absolute user or repository path
- **AND** preflight explains how to create the ignored local config

#### Scenario: Local config is absent
- **WHEN** a workstation command requiring repository mappings runs without the machine-local config
- **THEN** it fails before elevation or host mutation
- **AND** names the expected safe local path and example
