## Why

The current instruction inventory measures the kit catalog but is also used as a
proxy for context economy. In a consumer repository it misses config-declared and
project-local instruction sources, while the living token ceilings are already
exceeded without a validation signal. This prevents reliable control of both the
always-visible prompt floor and the larger on-demand catalog.

## Outcome Capsule

- **Outcome:** Maintainers can deterministically measure the privacy-safe
  loader-visible instruction set for a selected project separately from the kit
  catalog, and validation reports drift against one explicit checked-in budget.
- **Operating Envelope:** Local Markdown instruction files discovered through
  reviewed conventional source locations and explicit local `instructions`
  entries in OpenCode config; aggregate counts and redacted identities only.
- **Non-Goals:** Claim exact model tokenization; print instruction content; expand
  remote URLs or unsupported dynamic config; infer undocumented precedence;
  optimize or delete instruction text in this increment.
- **Non-Deferrable Invariants:** Catalog and loader-visible totals remain separate;
  unsupported/unreadable sources are reported as unknown; external instruction
  content never appears in repeated-line or artifact output; validation cannot
  silently compare against stale prose-only ceilings.
- **Observable Proof:** The installed inventory distinguishes kit catalog from a
  disposable consumer with global, parent, project, and `.opencode` sources;
  budget drift produces a stable non-zero validation result without reading
  vendor/evidence trees.
- **Material Residual Risks:** OpenCode loader semantics and model tokenization may
  change; presence and config declaration do not prove final prompt inclusion or
  precedence.
- **Stop Line:** Stop after explicit source-scope inventory, privacy-safe output,
  unknown reporting, one checked-in budget owner, deterministic drift validation,
  and representative kit/consumer proof. Instruction rewrites remain separate.

## What Changes

- Preserve the existing kit-catalog inventory as an explicit source scope.
- Add a loader-visible project scope that reuses runtime-source discovery and
  includes supported explicit local `instructions` entries without scanning
  unrelated vendor, generated, target, or evidence trees.
- Report always-visible candidates, on-demand catalog artifacts, unsupported
  sources, and totals as separate categories rather than one prompt-cost number.
- Redact external paths and suppress repeated instruction text in loader-visible
  output.
- Replace unenforced prose-only token ceilings with one checked-in budget owner and
  deterministic validation of catalog and always-visible boundaries.
- Preserve current over-budget debt explicitly rather than deleting safety policy
  or silently resetting historical limits.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `library-instruction-artifacts`: Define source-scoped instruction inventory,
  privacy-safe runtime totals, and enforceable budget ownership.
- `library-config-portability`: Define supported discovery and unknown handling for
  config-declared local instruction sources.

## Impact

- Affected code: `tools/instruction-artifacts-inventory.ts`, runtime-source/config
  discovery helpers, validation tooling, focused fixtures, and token-economy docs.
- Affected data: one reviewed budget seed containing limits only; measured totals
  remain derived output and are not duplicated into the seed.
- Compatibility: existing catalog invocation and output remain available; new
  fields/modes are versioned if the JSON shape changes.
- Systems: local read-only inventory and validation only. No provider, model,
  installation, activation, project mutation, or remote operation.
