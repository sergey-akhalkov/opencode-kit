## Why

Model selection is currently spread across the global default, inherited agent behavior, machine-local Dream Team environment defaults, and occasional agent pins. This makes frequent Sol/Grok experiments create configuration drift and makes the effective model harder to reproduce or audit.

## What Changes

- Add schema-valid launch-time model profiles that centrally assign model and variant values to primary, built-in, reusable, and Dream Team agents without adding pins to reusable agent Markdown files.
- Add a profile launcher that selects a committed preset or gitignored local profile, validates it, applies it through `OPENCODE_CONFIG_CONTENT`, and starts OpenCode without rewriting tracked or machine-local configuration.
- Ship `quality-independent`, `sol-only`, and `grok-only` presets. The recommended profile uses GPT-5.6 Sol Xhigh for authoring, orchestration, troubleshooting, and compaction, and Grok 4.5 High for bounded discovery, SDET, and independent review roles.
- Extend the existing Dream Team tool-context bridge so omitted review and implementation model arguments receive the selected profile values explicitly, while user-supplied overrides continue to win and are reported as profile deviations.
- Add deterministic profile validation, resolved-routing inspection, effective-model diagnostics, and focused runtime proof for normal subagents and both Dream Team tools.
- Preserve exactly three automatically loaded base configuration layers. Model profiles are explicit launch-time overlays, not a new implicit config layer.
- Keep live hot reload, automatic task-to-model classification, benchmark harnesses, credential management, and provider installation out of scope.

## Capabilities

### New Capabilities
- `library-model-routing`: Versioned and local model profiles, launch-time selection, per-agent routing, Dream Team propagation, explicit override semantics, diagnostics, and validation.

### Modified Capabilities
- `library-config-portability`: Clarify that the three-layer base configuration contract permits schema-valid model profile overlays applied explicitly through supported inline configuration without becoming additional automatically loaded layers.

## Impact

- New profile assets under `global/model-profiles/` plus a gitignored local profile area.
- A small cross-platform launcher and deterministic validation/tests under `tools/` and root package scripts.
- Focused changes to `global/plugin/dream-team-mcp-tool-context.ts` for explicit Dream Team model propagation and deviation reporting.
- Documentation updates for profile selection, precedence, restart behavior, local customization, explicit overrides, and effective-model inspection.
- No provider credentials, remote state, model invocation during static validation, or changes to reusable agent prompt ownership.
