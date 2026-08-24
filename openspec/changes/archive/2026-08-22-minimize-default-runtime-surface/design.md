## Context

See the proposal, audit `docs/audits/2026-08-21-principles-alignment-audit.md`, and the three delta specs. The repository source currently doubles as the active `OPENCODE_CONFIG_DIR`, so every artifact under `global/` is loader-visible. Existing installations and the current maintainer rely on the full catalog and permissive machine behavior; automatic migration would be unsafe.

## Goals / Non-Goals

**Goals:** materialize a small selected global source, preserve an explicit full catalog, separate portable and machine-local authority, and prove the default reduction through loader and consumer evidence.

**Non-Goals:** delete optional artifacts, redesign domain skills, rewrite existing local config, or optimize model behavior without the consumer gate.

## Decisions

### Materialize profiles into ignored generated roots

Keep canonical source files in their current repository owners. Add deterministic profile manifests and materialize selected files into `global/.runtime-profiles/<profile>/`, which is gitignored and becomes the explicit `OPENCODE_CONFIG_DIR`. This avoids relocating every artifact or relying on unsupported per-skill disable semantics. Generation uses create-new staging, schema/readback validation, then atomic directory swap with backup.

Alternative rejected: leaving `OPENCODE_CONFIG_DIR=global/` and merely documenting core does not change loader visibility. Moving all optional source outside `global/` creates a broad repository migration before the profile mechanism works.

### Core and all have exact manifests

`profiles/core.json` and `profiles/all.json` enumerate files/directories and config mode. Core includes `change-ready-sdlc`, `reuse-discovery`, `complain`, `openspec-propose`, `openspec-apply-change`, `openspec-archive-change`, `openspec-abandon-change`, and `next-step`; the canonical OpenSpec commands; and `implementation-worker`, `sdet-quality-engineer`, `final-candidate-reviewer`, `implementation-readiness-reviewer`, `test-coverage-reviewer`, `code-quality-reviewer`, and `troubleshooter`. Built-in primary/explore/general agents remain runtime-owned. Completion guard/arbiter and domain skills/agents are optional packs. All preserves the full catalog and permissive compatibility config. The generator rejects unowned files, collisions, missing dependencies, and source paths escaping the repository.

### New installs are restricted; existing installs are preserved

The generated core config uses ask-level mutation permission and no completion-guard permission normalization. Machine autonomy is selected explicitly and written only into generated/machine-local config. Existing `global/opencode.json` and environment values are previewed, never overwritten without migration mode. Personal standing authorization moves from committed `global/AGENTS.md` into the existing gitignored local instructions source.

### Trigger precision is checked at metadata and behavior boundaries

Extend frontmatter validation to inspect descriptions, not body trigger phrases. Add positive/negative fixtures for generic and domain-specific requests. Use the consumer outcome gate for the final retained core, not a heuristic semantic score.

### Budgets bind to loader-visible core

Instruction budget reads the generated core root and records source/profile digests. Full-catalog numbers remain diagnostics. A core over 12,000 startup or 1,200 discovery token-proxy fails before behavior capture.

## Failure Boundaries And Diagnostics

- Missing/colliding manifest entry: fail before generated-root mutation.
- Schema or loader readback failure: preserve previous generated root and original cause.
- Existing unprofiled install: preview only without explicit migration.
- Consumer no-regression failure: retain previous default and preserve candidate evidence.
- Unknown runtime precedence/collision: block the default claim, never infer hidden sources are absent.

## Fidelity And Authorization

- Current rung: source inventory and installed runtime facts; no smaller loaded candidate.
- Next real boundary: generate core into a disposable config root, start OpenCode, inspect loader-visible sources, then run matched consumer no-regression.
- Protected boundary: no current machine activation or config migration without separate explicit operation; configured-provider work is owned by the consumer gate.
- Cleanup: remove disposable generated roots/sessions and restore the prior environment; preserve bounded proof artifacts only.

## Risks / Trade-offs

- [Generated roots can drift] -> source/profile digests plus regeneration/readback in validation.
- [Core omits needed routing] -> explicit no-regression scenarios and easy `all` selection.
- [Ask permission increases prompts] -> measure owner questions and allow explicit machine-local autonomy.
- [Consumer friction-only growth] -> r3 hard oracles, owner-question, and provider-bound held; failedToolCallCount 1→2 / 1→3 is a recorded non-critical limitation, not an outcome defect. Owner directed completion of the increment.
- [OpenCode loader semantics change] -> live loader inventory is required before retaining the default.

## Migration Plan

1. Add profile schema/manifests and disposable generator tests.
2. Generate and loader-prove core without changing the active environment.
3. Move personal authority to local instructions and narrow descriptions in the candidate root.
4. Capture core versus full consumer evidence and retain only a passing candidate.
5. Change fresh install default to core; keep existing installations and `all` rollback intact.
