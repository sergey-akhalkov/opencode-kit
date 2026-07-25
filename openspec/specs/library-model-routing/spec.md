# library-model-routing Specification

## Purpose
TBD - created by archiving change add-model-routing-profiles. Update Purpose after archive.
## Requirements
### Requirement: Restricted complete model profiles
The library SHALL support committed model profiles under `global/model-profiles/<id>.json` and gitignored personal profiles under `global/model-profiles/local/<id>.json`. Each profile SHALL be a complete restricted OpenCode config fragment containing only `$schema`, `model`, `small_model`, and per-agent `model` and `variant` routing. Each profile SHALL cover every governed built-in agent and every agent defined under `global/agents/` without adding model or variant pins to agent Markdown files.

#### Scenario: Complete committed profile
- **WHEN** repository validation inspects a committed model profile
- **THEN** the profile SHALL map the complete governed agent catalog to non-empty `provider/model` identifiers and variants
- **AND** it SHALL contain no permission, tool, provider, prompt, MCP, credential, or unsupported metadata fields.

#### Scenario: New reusable agent is added
- **WHEN** a new Markdown agent appears under `global/agents/`
- **THEN** validation SHALL fail until every committed model profile explicitly routes the new agent
- **AND** the new agent Markdown SHALL continue to omit `model` and `variant` frontmatter.

#### Scenario: Local profile is selected
- **WHEN** the owner selects `local:<id>`
- **THEN** the launcher SHALL resolve only `global/model-profiles/local/<id>.json`
- **AND** a same-named committed profile SHALL NOT silently shadow or be shadowed by the local profile.

### Requirement: Launch-time profile selection
The library SHALL provide a cross-platform launcher that applies one selected model profile to a child OpenCode process through `OPENCODE_CONFIG_CONTENT` without rewriting repository, project, global, machine-local, or shell-profile configuration. The selected profile SHALL override conflicting ordinary project model configuration while remaining subordinate to upstream administrator-managed configuration.

#### Scenario: Profile overrides project model
- **WHEN** a fixture project config specifies a model that differs from the selected profile
- **THEN** `opencode debug config` launched through the profile SHALL resolve the profile top-level model
- **AND** representative `opencode debug agent` output SHALL resolve each configured per-agent model and variant.

#### Scenario: Existing inline configuration
- **WHEN** the launcher inherits a non-empty `OPENCODE_CONFIG_CONTENT`
- **THEN** it SHALL refuse to launch with a precise conflict diagnostic
- **AND** it SHALL NOT overwrite, print, persist, or merge the inherited content.

#### Scenario: Direct OpenCode launch
- **WHEN** the owner starts `opencode` without the profile launcher
- **THEN** existing OpenCode config and agent inheritance behavior SHALL remain unchanged
- **AND** no profile environment marker SHALL be introduced.

#### Scenario: Invalid profile identifier
- **WHEN** a profile identifier is blank, contains a path separator or traversal, resolves outside its profile root, or identifies a non-regular file
- **THEN** the launcher SHALL fail before setting child configuration or starting OpenCode
- **AND** the diagnostic SHALL identify the invalid profile selection without exposing unrelated paths or file content.

### Requirement: Shipped routing presets
The library SHALL ship `quality-independent`, `sol-only`, and `grok-only` committed presets. `quality-independent` SHALL route creation and diagnosis roles to GPT-5.6 Sol Xhigh and independent challenge roles to Grok 4.5 High. The single-model presets SHALL provide complete deterministic control matrices.

#### Scenario: Recommended creator roles
- **WHEN** `quality-independent` is selected
- **THEN** `build`, `plan`, `general`, `compaction`, `implementation-worker`, `dream-team-implementer`, and `troubleshooter` SHALL resolve to `openai/gpt-5.6-sol` with variant `xhigh`.

#### Scenario: Recommended challenge roles
- **WHEN** `quality-independent` is selected
- **THEN** `explore`, `scout`, `title`, `summary`, `qwen-local-worker`, `sdet-quality-engineer`, `dream-team-reviewer`, and every reusable reviewer SHALL resolve to `xai/grok-4.5` with variant `high`.

#### Scenario: Single-model controls
- **WHEN** `sol-only` or `grok-only` is validated
- **THEN** every governed agent SHALL resolve respectively to `openai/gpt-5.6-sol`/`xhigh` or `xai/grok-4.5`/`high`
- **AND** no governed agent SHALL rely on inherited routing inside those profiles.

### Requirement: Dream Team profile propagation
When a profile-launched OpenCode process invokes `dream_team_review` or `dream_team_implement`, the existing Dream Team tool-context plugin SHALL provide an explicit model and compatible variant from the corresponding profile agent entry whenever the caller omitted them. The plugin SHALL preserve explicit caller values and SHALL NOT combine a profile variant with a differing explicit model.

#### Scenario: Omitted Dream Team routing
- **WHEN** either Dream Team tool is called without model or variant under an active profile
- **THEN** the plugin SHALL inject the corresponding Dream Team agent's profile model and variant before dispatch
- **AND** the resulting request SHALL carry an explicit model identity rather than an implicit server-default identity.

#### Scenario: Explicit differing model
- **WHEN** a Dream Team call explicitly supplies a model different from the selected profile and omits variant
- **THEN** the plugin SHALL preserve the explicit model and leave variant unspecified
- **AND** it SHALL emit a structured informational profile-deviation diagnostic.

#### Scenario: Explicit matching model
- **WHEN** a Dream Team call explicitly supplies the profile model but omits variant
- **THEN** the plugin SHALL inject the profile variant
- **AND** it SHALL preserve every unrelated tool argument unchanged.

#### Scenario: Incomplete active bridge
- **WHEN** a profile marker is present but the selected Dream Team role's bridge model or variant is missing or malformed
- **THEN** the plugin SHALL fail before Dream Team dispatch with a precise routing diagnostic
- **AND** it SHALL NOT fall back silently to server-default or machine-local model selection.

#### Scenario: No active profile
- **WHEN** a Dream Team tool is called from an OpenCode process without a profile marker
- **THEN** the plugin SHALL preserve the pre-change Dream Team model fallback behavior
- **AND** existing caller-hierarchy and repository-path handling SHALL remain unchanged.

### Requirement: Visible selection and override semantics
The profile launcher SHALL provide stable inspection output for the selected source and complete resolved routing matrix. Explicit OpenCode or Dream Team model overrides SHALL remain permitted, SHALL win over profile defaults at their supported boundary, and SHALL be reported as deviations rather than silently presented as profile-conforming execution.

#### Scenario: Explain a profile
- **WHEN** the owner runs the profile launcher with `--explain`
- **THEN** it SHALL print the profile id, committed or local source kind, resolved profile path, top-level model, small model, and every agent model/variant in stable agent-name order
- **AND** it SHALL exit without starting OpenCode or invoking a model.

#### Scenario: Explicit primary model argument
- **WHEN** launch arguments contain an explicit OpenCode `--model` that differs from the profile top-level model
- **THEN** the launcher SHALL preserve the explicit argument and report the primary-model deviation before startup
- **AND** per-agent profile routing SHALL remain unchanged.

#### Scenario: Inspection privacy
- **WHEN** selection, validation, or deviation diagnostics are emitted
- **THEN** they SHALL include only profile identifiers, safe paths, agent names, model identifiers, variants, and validation details
- **AND** they SHALL NOT print credentials, inherited inline config content, prompts, or provider secrets.

### Requirement: Deterministic validation and non-billable proof
Repository validation SHALL check profile syntax, restricted shape, complete catalog coverage, exact committed preset matrices, local ignore policy, launcher behavior, and Dream Team propagation without requiring credentials, network access, or a model response. Focused runtime proof SHALL use OpenCode debug and pre-dispatch boundaries and SHALL remain non-billable.

#### Scenario: Static repository validation
- **WHEN** `npm run validate:strict` runs
- **THEN** malformed, incomplete, unsafe, or drifted committed model profiles SHALL fail with file- and field-specific diagnostics
- **AND** validation SHALL NOT contact a provider or infer whether credentials are available.

#### Scenario: Focused launcher tests
- **WHEN** the model-profile test suite runs
- **THEN** it SHALL cover committed and local resolution, traversal rejection, inherited-inline refusal, stable explain output, conflicting project config precedence, child environment construction, argument forwarding, and explicit primary overrides
- **AND** all test fixtures SHALL be disposable and credential-free.

#### Scenario: Focused Dream Team tests
- **WHEN** the Dream Team tool-context tests run
- **THEN** they SHALL cover omitted, matching, differing, malformed, and no-profile model/variant cases for review and implementation
- **AND** existing hierarchy, mutability, caller-session, and repo-resolution tests SHALL remain green.

#### Scenario: Runtime proof
- **WHEN** the candidate receives local runtime proof
- **THEN** the proof SHALL observe one Sol-routed normal agent, one Grok-routed normal agent, and both Dream Team tools' pre-dispatch explicit routing under `quality-independent`
- **AND** it SHALL not send a provider prompt, start a billable Dream Team workflow, mutate remote state, or require credentials.
