## Context

OpenCode supports a top-level model, per-agent model and variant overrides, runtime inline configuration through `OPENCODE_CONFIG_CONTENT`, and explicit model arguments for Dream Team tools. The kit currently uses these mechanisms independently: reusable agent files omit model pins, the active global config supplies a default model, and Dream Team review may receive a separate environment default. Git history shows repeated model-pin changes and later removal of those pins in favor of inheritance.

The accepted user preference is profile selection at process launch, global applicability across projects, quality plus cross-model independence, committed presets plus gitignored local profiles, one policy for standard and Dream Team agents, and visible but permitted explicit overrides. A local benchmark harness is not part of this increment.

OpenCode loads configuration once. Inline configuration is the last ordinary user-controlled config source after project and custom-directory configuration, so it is the only supported config layer that can make a selected global profile deterministic across projects without rewriting their files. Managed administrator configuration remains higher priority.

### Accepted increment

- **Outcome:** One launch command selects a complete, inspectable model/variant matrix for all governed OpenCode and Dream Team roles without editing agent prompts or existing config files.
- **Operating Envelope:** Local OpenCode launches from this installed kit, schema-shaped JSON profile files, the existing global Dream Team tool-context plugin, and models/providers already available to OpenCode.
- **Non-Goals:** Hot reload, automatic semantic routing, provider authentication, provider installation, billing controls, remote execution, model benchmarking, and guaranteed enforcement against administrator-managed configuration.
- **Non-Deferrable Invariants:** Existing config is not rewritten; reusable agent Markdown remains model-agnostic; profile files cannot change permissions/tools/providers; explicit overrides are preserved and disclosed; Dream Team receives an unambiguous explicit model identity when a profile is active.
- **Observable Proof:** Launch with a fixture project containing a conflicting project model, observe the selected primary model and representative Sol/Grok subagents, and observe both Dream Team tool calls receiving the selected explicit model/variant without invoking a billable model.
- **Material Residual Risks:** Upstream OpenCode config precedence or plugin-hook behavior may change; model availability remains machine-specific; in-session primary model switching can intentionally diverge from the startup profile.
- **Stop Line:** Three presets, local profile selection, explain/check commands, deterministic validation, Dream Team propagation, focused runtime proof, and documentation are complete. Dynamic routing and comparative model evaluation remain separate work.

## Goals / Non-Goals

**Goals:**

- Centralize model and variant routing in one selected profile.
- Keep profiles compatible with official OpenCode config fields and precedence.
- Make the recommended creator/challenger split explicit and reproducible.
- Preserve direct `opencode` startup as a backward-compatible no-profile path.
- Give Dream Team review and implementation the same selected routing policy.
- Surface the selected source, resolved matrix, and explicit deviations without exposing secrets.
- Validate every governed agent whenever the catalog or a committed preset changes.

**Non-Goals:**

- Do not add `model` or `variant` frontmatter to reusable agent files.
- Do not infer a model from prompt content, repository language, risk classification, or task history.
- Do not change agent prompts, lifecycle authority, permissions, or test ownership.
- Do not persist `OPENCODE_CONFIG_CONTENT` or mutate shell profiles.
- Do not collect prompts, model responses, token use, cost, or quality scores.
- Do not make model availability or credentials part of repository validation.

## Decisions

### 1. Profiles are restricted OpenCode config fragments

Committed presets live at `global/model-profiles/<id>.json`; personal profiles live at `global/model-profiles/local/<id>.json` and the local directory contents are gitignored. A profile uses only official OpenCode fields:

- `$schema`
- `model`
- `small_model`
- `agent.<name>.model`
- `agent.<name>.variant`

The filename is the profile identifier. Custom metadata fields are forbidden because OpenCode rejects unsupported config keys. Profile validation rejects permissions, tools, providers, MCP definitions, prompts, temperatures, and any other behavior outside model routing.

Every profile is a complete matrix, not a delta on another profile. It must cover the built-in governed agents and every Markdown agent discovered under `global/agents/`. This duplicates a small number of model strings but keeps resolution native, deterministic, and explainable without a custom profile compiler.

Alternatives rejected:

- Agent frontmatter pins recreate the Git churn and scattered ownership this change removes.
- A custom alias/group schema needs a compiler and creates a second configuration language.
- A model-routing plugin is unnecessary for standard agents and would hide resolved config from OpenCode's own debug surfaces.

### 2. Selection uses an ephemeral launcher and inline config

A cross-platform Node launcher selects either a committed `<id>` or explicit `local:<id>`, validates and reads the regular file inside the corresponding root, sets the profile JSON as child-process `OPENCODE_CONFIG_CONTENT`, derives Dream Team bridge environment values, and spawns OpenCode with forwarded arguments.

Committed and local identifiers use separate namespaces. Local files never silently shadow committed presets. Identifiers reject path separators, traversal, blank values, ambiguous duplicate flags, and non-regular or escaping paths.

The launcher refuses to overwrite a non-empty inherited `OPENCODE_CONFIG_CONTENT`; this avoids a hidden merge order and preserves owner-controlled inline configuration. Normal OpenCode arguments remain forwardable. An explicit OpenCode `--model` is allowed, is reported as a primary-model deviation, and keeps OpenCode's native precedence.

The launcher provides three modes:

- launch: print a concise selected-profile summary, then start OpenCode;
- `--explain`: print the stable, sorted complete routing matrix and exit without starting OpenCode;
- `--check`: validate profile selection and routing completeness and exit without starting OpenCode.

Direct `opencode` startup remains unchanged and uses existing inheritance/default behavior.

Alternatives rejected:

- `OPENCODE_CONFIG` is loaded before project config and cannot guarantee the selected global profile across projects.
- Rewriting `global/opencode.json` creates mutable state, restart races, backup requirements, and Git/config drift.
- Hot reload conflicts with OpenCode's load-on-start behavior and the selected launch-profile UX.

### 3. Presets encode one recommended split and two controls

`quality-independent` uses GPT-5.6 Sol Xhigh for primary creation, implementation, troubleshooting, and compaction. It uses Grok 4.5 High for bounded discovery, SDET, and every independent reviewer. This deliberately trades a modest public benchmark gap for model-diverse challenge after Sol authorship.

`sol-only` maps every governed agent to `openai/gpt-5.6-sol` with `xhigh`. `grok-only` maps every governed agent to `xai/grok-4.5` with `high`. These are deterministic control and fallback profiles, not the recommended default.

The committed matrix is validated exactly. Local complete profiles may use any non-empty `provider/model` identifier and non-empty variant supported by the owner's runtime; static validation checks shape, not credentials or live availability.

### 4. Dream Team receives explicit profile routing

The launcher derives review and implementation model/variant pairs from the selected profile's `dream-team-reviewer` and `dream-team-implementer` entries and exports them to the child OpenCode process through dedicated non-secret bridge variables together with the selected profile identifier.

The existing `global/plugin/dream-team-mcp-tool-context.ts` remains the sole hook owner for both Dream Team tools. When a profile marker is present, it applies this precedence:

1. Preserve an explicit tool argument.
2. If model is absent, inject the role's profile model.
3. If variant is absent and the effective model equals the profile model, inject the role's profile variant.
4. If an explicit model differs from the profile model, do not combine it with the profile variant.
5. Emit a structured informational deviation diagnostic for every explicit differing model or variant.

If a profile marker exists but the required bridge values are incomplete or malformed, the plugin fails the Dream Team call before dispatch. Without a profile marker, the plugin preserves its current behavior and Dream Team's existing fallback semantics.

Explicit model propagation avoids the ambiguous `opencode-server-default:model` session identity when profiles change. It also makes review and implementation routing visible in Dream Team request evidence.

### 5. Effective routing is observable without model invocation

`--explain` prints profile identifier, source kind, resolved path, top-level fallback model, small model, and every agent's model/variant in stable name order. It prints no environment values other than the non-secret model identifiers and variants.

Static tests exercise profile parsing, path containment, completeness, preset matrices, child environment construction, argument forwarding, inherited-inline refusal, and override diagnostics. The plugin tests exercise omitted, matching, and conflicting Dream Team model/variant combinations for both tools.

Runtime proof uses `opencode debug config` and `opencode debug agent` under the launcher against a disposable fixture project with a conflicting project model. The proof verifies resolution only and must not send a prompt to a provider. A separate local smoke inspects the pre-dispatch Dream Team arguments for both tools without starting a billable workflow.

### 6. New agents fail validation until routed

The deterministic validator discovers all `global/agents/*.md` names plus the documented built-in governed set. Every committed and local profile encountered by validation must map the complete set. Adding an agent therefore requires an explicit choice in every committed profile rather than silently inheriting an accidental model.

Reusable Markdown validators continue to reject model/variant pins. Central config routing and model-agnostic reusable role definitions are complementary contracts.

## Risks / Trade-offs

- **Profile repetition can drift** -> Validate exact committed matrices and require complete coverage whenever the agent catalog changes.
- **A new model may not support a stored variant** -> Static checks validate shape; `--check` reports runtime availability when OpenCode exposes it, and startup fails before useful work if OpenCode rejects the pair.
- **An inherited inline config would be overwritten** -> Refuse launch with a precise diagnostic instead of merging unknown owner settings.
- **An explicit override can remove creator/challenger independence** -> Preserve it by owner choice, print/log the deviation, and rely on existing Effective Model provenance in agent reports.
- **A model switch through `/models` occurs after launcher output** -> Treat OpenCode's native current-model display and agent Effective Model evidence as the source of truth; do not add live policy enforcement.
- **Dream Team runs without the launcher** -> Preserve current fallback behavior when no profile marker exists.
- **Managed configuration overrides inline configuration** -> Document this upstream precedence and report the actual resolved model during checks; do not bypass administrator policy.
- **Plugin reads bridge environment** -> Bridge values contain only profile id, model id, and variant; no credentials or prompt content are introduced.

## Migration Plan

1. Add restricted profile assets, parser/resolver, validator coverage, and `--explain`/`--check` without changing default startup.
2. Add launcher process execution and package command while keeping direct `opencode` behavior unchanged.
3. Extend and test the existing Dream Team tool-context plugin with profile-aware argument injection.
4. Prove a normal Sol route, a normal Grok route, Dream Team review, and Dream Team implementation at non-billable debug/pre-dispatch boundaries.
5. Document the recommended launcher and local profile workflow. Do not modify `OPENCODE_CONFIG_DIR`, shell profiles, credentials, or machine-local OpenCode config.

Rollback is to stop using the launcher and start OpenCode directly. The feature writes no persistent runtime selection, so rollback requires no config restoration. Repository rollback removes the new profiles, launcher, validation, tests, and focused plugin branch while preserving all prior configuration and agent files.

## Open Questions

None for this increment. Future work may evaluate model quality on local historical tasks or add live profile switching, but neither is required for the accepted outcome.
