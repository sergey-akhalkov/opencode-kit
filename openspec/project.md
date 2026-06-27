# Project OpenSpec Guide

This repository uses OpenSpec changes for durable follow-up work that affects reusable skills, agents, instructions, validators, tools, templates, or project documentation.

OpenSpec archive does not require a separate learning file or archive-time process gate. Archive readiness is based on completed scoped tasks, synchronized specs, validation evidence, reviewer evidence when risk warrants it, and explicit handling of unresolved blockers or follow-ups.

## Configuration Layering

The kit ships three OpenCode config files with a documented layering (see `README.md` -> "Configuration Layering" for the full contract):

- `opencode.json` (repo root) — workspace config loaded when running OpenCode in this repository.
- `global/opencode.json.template` — portable safe default committed with the kit.
- `global/opencode.json` — machine-local override (gitignored); the installer writes `machineOverride: true` into the provisioned copy so intentional local permission/provider overrides pass strict validation as info notes.

`global/opencode.local.json` is the documented overlay pattern for machine-specific paths; it is gitignored next to `global/opencode.json`.

## Active Roadmap

The full audit ledger at `docs/feedbacks/audit-opencode-kit-2026-06-27.md` (commit `1af6e5b`) split the audit findings into six OpenSpec changes. Current state, based on `npx openspec list`, task checkboxes, recent commits, and GitHub Actions run `28288079534`:

### Implemented / Archive Candidates

- `deduplicate-instruction-artifacts` — Complete. Tasks 37/37 checked. Implemented in commit `f5c314e` plus follow-up `48f9ffe` for reviewer-binding contract test names. Candidate for archive after final `npm run validate:strict`, `npm test`, and reviewer gate.
- `kit-config-hygiene` — Complete. Tasks 24/24 checked. Implemented in commit `f0bce9d`. Candidate for archive after final `npm run validate:strict`, `npm test`, and reviewer gate.

### Implemented But Not Green

- `add-ci-workflow` — Workflow and docs implemented, but not archive-ready. Latest GitHub Actions runs fail before install because `actions/setup-node@v4` with `cache: npm` requires a root lockfile; this repo currently has no root `package-lock.json`. Keep active until the lockfile/cache policy is fixed and a merged workflow run is green.

### Partially Implemented

- `refactor-tools-split-candidate` — 7/45 tasks complete. Contract extraction task group 1 is done (`tools/contracts/{skills,agents,complain,reviewer-binding,implementation-worker,openspec}.ts` plus byte-equal tests). Remaining work: validator split, parser replacement, `node --test` migration, delivery-context split, final validation/docs.

### Not Started

- `install-init-hardening` — 0/22 tasks. Now unblocked because `kit-config-hygiene` is complete; it may start in the next implementation wave.
- `plugin-self-containment` — 20/20 tasks. Implemented; reader moved under `global/plugin/session-delivery-context/`, plugin uses a static import, `tools/session-delivery-context.ts` is a 12-line CLI shim. Candidate for archive after final `npm run validate:strict`, `npm test`, `npm run openspec:validate`, `npm run openspec:gate -- --operation prepush`, and the new regression test that copies `global/plugin/` into a temp config dir and executes `session_delivery_context` without a `tools/` directory.

## Active Execution Waves

### Wave 0 — Stabilize Implemented CI Gate

- `add-ci-workflow`: fix the current GitHub Actions failure. Choose one path:
  - Add a root `package-lock.json` and keep `npm ci` + `cache: npm` as specified.
  - Or remove npm cache / change install policy, then update the OpenSpec spec because it currently requires npm cache.
- Exit condition: latest `validate` GitHub Actions run is green and `add-ci-workflow` tasks are 16/16.

### Wave 1 — Parallel Active Work

After Wave 0 is green, run these in parallel:

- `refactor-tools-split-candidate`: continue from task group 2 (validator split). This remains the critical path.
- `install-init-hardening`: start now that `kit-config-hygiene` is complete. It owns `tools/install-opencode-global.ts`, `tools/init-project.ts`, and `tools/headroom-mcp-wrapper.ts`.

Archive candidates from the completed bucket (`deduplicate-instruction-artifacts`, `kit-config-hygiene`) can be archived in parallel with Wave 1 if final validation and reviewer evidence are fresh.

### Wave 2 — Depends on Wave 1

- (none — `refactor-tools-split-candidate` task group 5 already landed at commit `5821351`, and `plugin-self-containment` has executed on top of that split.)

### Wave 3 — Archive Remaining Active Changes

Archive in dependency order after implementation, validation, and reviewer gates:

1. `add-ci-workflow` once GitHub Actions is green.
2. `plugin-self-containment` (now implemented) after final `npm run validate:strict`, `npm test`, `npm run openspec:validate`, `npm run openspec:gate -- --operation prepush`.
3. `install-init-hardening` after Wave 1 completion.
4. `refactor-tools-split-candidate` after all 45 tasks and final inventories pass.

### File conflict matrix

| File | refactor | dedup-instr | plugin | config | install-init | ci |
| --- | :-: | :-: | :-: | :-: | :-: | :-: |
| `tools/validate-library.ts` | ✏️ | | | | | |
| `tools/validators/opencode-config.ts` | ✏️ | | | ✏️ | | |
| `tools/test-*.ts` (9) | ✏️ | | | | | |
| `tools/session-delivery-context.ts` | ✏️ | | ✏️ | | | |
| `tools/delivery-context/*.ts` | ✏️ | | ✏️ | | | |
| `tools/install-opencode-global.ts` | | | | ✏️ | ✏️ | |
| `tools/init-project.ts` | | | | | ✏️ | |
| `tools/headroom-mcp-wrapper.ts` | | | | | ✏️ | |
| `global/opencode*.json*` | | | | ✏️ | | |
| `docs/`, `instructions/`, `templates/` | | ✏️ | | | | |
| `global/agents/*.md` (14) | | ✏️ | | | | |
| `README.md` | | ✏️ | | ✏️ | ✏️ | ✏️ |
| `.github/workflows/validate.yml` | | | | | | ✏️ |

### Conflict-resolution rules

- `tools/validate-library.ts` is single-writer during Wave 1 (only `refactor-tools-split-candidate`); after Wave 1 the orchestrator is small enough that no other change should touch it.
- `tools/install-opencode-global.ts` is single-writer across `kit-config-hygiene` and `install-init-hardening`; CHG-004 lands first, CHG-005 follows.
- `tools/session-delivery-context.ts` is single-writer across `refactor-tools-split-candidate` and `plugin-self-containment`; CHG-001 splits it first, CHG-003 rewrites it as a CLI shim.
- README.md has three sections touched by three different changes (`deduplicate-instruction-artifacts`, `kit-config-hygiene`, `add-ci-workflow`); each change touches a distinct section so merges stay trivial.
