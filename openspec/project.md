# Project OpenSpec Guide

This repository uses OpenSpec changes for durable follow-up work that affects reusable skills, agents, instructions, validators, tools, templates, or project documentation.

OpenSpec archive does not require a separate learning file or archive-time process gate. Archive readiness is based on completed scoped tasks, synchronized specs, validation evidence, reviewer evidence when risk warrants it, and explicit handling of unresolved blockers or follow-ups.

## Active Execution Plan

The full audit ledger at `docs/feedbacks/audit-opencode-kit-2026-06-27.md` (commit `1af6e5b`) splits the audit findings into six independent OpenSpec changes. The recommended execution order and parallel decomposition:

### Phase 0 — Foundation (single track)

- `refactor-tools-split-candidate` (45 tasks) — must land first. Splits `tools/validate-library.ts`, `tools/test-library.ts`, `tools/session-delivery-context.ts`; migrates to `node --test`; replaces hand-rolled JSONC and frontmatter parsers.

### Phase 1 — Parallel streams (3-4 concurrent workers)

- `add-ci-workflow` (15 tasks) — isolated `.github/workflows/validate.yml`; can start in week 1 alongside Phase 0 to provide a CI gate for subsequent changes.
- `deduplicate-instruction-artifacts` (37 tasks) — touches `docs/`, `instructions/`, `templates/`, `global/agents/*.md`; no overlap with tools/.
- `kit-config-hygiene` (24 tasks) — touches `tools/install-opencode-global.ts`, `global/opencode*.json*`, `README.md`.
- `install-init-hardening` (22 tasks) — touches `tools/install-opencode-global.ts`, `tools/init-project.ts`, `tools/headroom-mcp-wrapper.ts`.

### Conflict-resolution rules

- Only one worker may write `tools/install-opencode-global.ts` at a time. `kit-config-hygiene` lands before `install-init-hardening`; the latter consumes the `machineOverride` marker the former introduces.
- Only the Phase 0 worker may write `tools/validate-library.ts`. After Phase 0 the orchestrator is small enough that no other change should touch it.
- `plugin-self-containment` (Phase 2) depends on Phase 0's `tools/delivery-context/*.ts` split.

### Phase 2 — Plugin integration

- `plugin-self-containment` (20 tasks) — moves `tools/delivery-context/*.ts` into `global/plugin/session-delivery-context/`; replaces `loadSessionDeliveryContextModule` dynamic loader with a static import.

### Phase 3 — Archive

`openspec archive <change>` for each completed change after `npm run validate:strict` and `npm test` pass and a session-delivery-reviewer pass is recorded.