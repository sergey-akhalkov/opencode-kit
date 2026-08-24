# library-model-routing Specification

## Purpose
Defines explicit portable model-routing profiles, launcher behavior, schema restrictions, and machine-local override boundaries.
## Requirements
### Requirement: Restricted complete model profiles
The library SHALL support committed model profiles under `global/model-profiles/<id>.json` and gitignored personal profiles under `global/model-profiles/local/<id>.json`. Each profile SHALL be a complete restricted OpenCode config fragment containing only `$schema`, `model`, `small_model`, and per-agent `model` and `variant` routing. Each profile SHALL cover every governed built-in agent and every agent defined under `global/agents/` except inherit-from-primary roles, without adding model or variant pins to agent Markdown files.

#### Scenario: Complete committed profile
- **WHEN** repository validation inspects a committed model profile
- **THEN** the profile SHALL map the complete routed governed agent catalog to non-empty `provider/model` identifiers and variants
- **AND** inherit-from-primary agents SHALL be omitted from the per-agent matrix
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
The library SHALL ship `quality-independent`, `sol-only`, and `grok-only` committed presets. `quality-independent` SHALL route creation roles to GPT-5.6 Sol Xhigh and independent challenge roles to Grok 4.6 High. `troubleshooter` SHALL omit per-agent model and variant pins and inherit the invoking primary session model. The single-model presets SHALL provide complete deterministic control matrices for every routed agent.

#### Scenario: Recommended creator roles
- **WHEN** `quality-independent` is selected
- **THEN** `build`, `plan`, `general`, `compaction`, and `implementation-worker` SHALL resolve to `openai/gpt-5.6-sol` with variant `xhigh`.

#### Scenario: Diagnosis role inherits primary
- **WHEN** any committed profile is selected
- **THEN** `troubleshooter` SHALL be omitted from the per-agent matrix
- **AND** it SHALL inherit the invoking primary session model.

#### Scenario: Recommended challenge roles
- **WHEN** `quality-independent` is selected
- **THEN** `explore`, `title`, `summary`, `qwen-local-worker`, `sdet-quality-engineer`, and every reusable reviewer SHALL resolve to `xai/grok-4.6` with variant `high`.

#### Scenario: Single-model controls
- **WHEN** `sol-only` or `grok-only` is validated
- **THEN** every routed governed agent SHALL resolve respectively to `openai/gpt-5.6-sol`/`xhigh` or `xai/grok-4.6`/`high`
- **AND** no routed governed agent SHALL rely on inherited routing inside those profiles.

### Requirement: Visible selection and override semantics
The profile launcher SHALL provide stable inspection output for the selected source and complete resolved routing matrix. Explicit OpenCode model overrides SHALL remain permitted, SHALL win over profile defaults at their supported boundary, and SHALL be reported as deviations rather than silently presented as profile-conforming execution.

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
Repository validation SHALL check profile syntax, restricted shape, complete catalog coverage, exact committed preset matrices, local ignore policy, and launcher behavior without requiring credentials, network access, or a model response. Focused runtime proof SHALL use OpenCode debug boundaries and SHALL remain non-billable.

#### Scenario: Static repository validation
- **WHEN** `npm run validate:strict` runs
- **THEN** malformed, incomplete, unsafe, or drifted committed model profiles SHALL fail with file- and field-specific diagnostics
- **AND** validation SHALL NOT contact a provider or infer whether credentials are available.

#### Scenario: Focused launcher tests
- **WHEN** the model-profile test suite runs
- **THEN** it SHALL cover committed and local resolution, traversal rejection, inherited-inline refusal, stable explain output, conflicting project config precedence, child environment construction, argument forwarding, and explicit primary overrides
- **AND** all test fixtures SHALL be disposable and credential-free.

#### Scenario: Runtime proof
- **WHEN** the candidate receives local runtime proof
- **THEN** the proof SHALL observe one Sol-routed agent and one Grok-routed agent under `quality-independent`
- **AND** it SHALL not send a provider prompt, mutate remote state, or require credentials.

### Requirement: Completion arbiter has complete configurable routing
Every committed model profile SHALL explicitly route the hidden `session-completion-arbiter`. The arbiter Markdown SHALL omit model and variant frontmatter. `quality-independent` SHALL route it to `xai/grok-4.6` with variant `high`; `sol-only` and `grok-only` SHALL route it to their respective complete single-model settings.

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
