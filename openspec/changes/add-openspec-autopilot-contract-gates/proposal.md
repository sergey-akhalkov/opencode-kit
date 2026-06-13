# Proposal: Add OpenSpec Autopilot Contract Gates

## Why

OpenSpec and Autopilot safety rules are strong but still contain several duplicated or prose-only seams. Retrospective archive status is spread across skills and README prose; legacy `retrospective.md` wrappers still exist even though new automation evidence must be JSON-backed; Autopilot reason codes, task statuses, task types, trigger modes, and public tool contracts are repeated in README and `openspec-autopilot` skill text.

These are finite contracts. They should be checked by deterministic status commands, migration/deny rules, and generated or verified documentation fragments instead of relying on agents to keep long prose synchronized.

## What Changes

- Add a read-only `openspec:retro-status` command that reports finite retrospective/archive states with blockers and next actions.
- Add explicit validation and migration handling for legacy `openspec/changes/<change>/retrospective.md` wrappers so JSON retrospectives become the canonical automation evidence.
- Add `autopilot:docs-check` to verify compact README/skill fragments against TypeScript contract enums and public tool names.
- Update OpenSpec/Autopilot skills and README to consume the status/docs checks rather than repeating full checklist logic.

## Depends On

- `require-autopilot-json-artifacts` for JSON-backed automation artifact policy.
- `require-openspec-change-retro-gate` for the existing retrospective gate and follow-up generation behavior.
- `add-openspec-operation-gates` for broader lifecycle gate composition; this change can provide retro-status/docs-check primitives that operation gates may call.

## Goals

- Make retrospective/archive readiness a finite machine-readable state.
- Prevent new Markdown automation wrappers from being introduced or extended.
- Provide a safe migration path for existing legacy `retrospective.md` files.
- Keep Autopilot model-facing docs synchronized with source-level finite contracts.
- Keep all checks deterministic: schemas, enums, exact paths, exact fragments, and known status values.

## Non-Goals

- Do not replace `openspec:retro-gate` or `openspec:retro-followups`; `retro-status` summarizes and composes their evidence.
- Do not infer whether a retrospective finding is important from prose content.
- Do not generate long Autopilot explanatory prose; only compact contract tables/fragments are generated or checked.
- Do not mutate protected Autopilot ledgers or runtime state.

## Impact

- Archive-related skills can ask one command for status instead of repeating full archive readiness prose.
- New `retrospective.md` wrappers are blocked by validation while canonical OpenSpec documents remain allowed.
- Autopilot docs drift is caught before merge when finite source contracts change.

## Validation

- Add failing tests for missing/invalid/stale retrospective states before implementation.
- Add tests for blocking legacy `retrospective.md` wrappers and migration behavior.
- Add tests for stale Autopilot generated fragments.
- Run `npm run validate`.
- Run `npm test`.
- Run `npm run openspec:validate`.
- Run new `openspec:retro-status` and `autopilot:docs-check` commands.
