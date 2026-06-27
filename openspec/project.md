# Project OpenSpec Guide

This repository uses OpenSpec changes for durable follow-up work that affects reusable skills, agents, instructions, validators, tools, templates, or project documentation.

OpenSpec archive does not require a separate learning file or archive-time process gate. Archive readiness is based on completed scoped tasks, synchronized specs, validation evidence, reviewer evidence when risk warrants it, and explicit handling of unresolved blockers or follow-ups.

## Active Execution Plan

The full audit ledger at `docs/feedbacks/audit-opencode-kit-2026-06-27.md` (commit `1af6e5b`) splits the audit findings into six independent OpenSpec changes. The recommended execution is wave-based:

### Wave 1 — Parallel (no cross-dependencies, no shared-file conflicts)

Four changes can start in parallel:

- `refactor-tools-split-candidate` (45 tasks) — foundation. Splits `tools/validate-library.ts`, `tools/test-*.ts`, `tools/session-delivery-context.ts`; migrates to `node --test`; replaces hand-rolled JSONC and frontmatter parsers. Critical path.
- `deduplicate-instruction-artifacts` (37 tasks) — touches `docs/`, `instructions/`, `templates/`, `global/agents/*.md` only.
- `kit-config-hygiene` (24 tasks) — touches `tools/install-opencode-global.ts`, `global/opencode*.json*`, README config-layering section.
- `add-ci-workflow` (15 tasks) — isolated `.github/workflows/validate.yml` plus one README paragraph.

### Wave 2 — Depends on Wave 1

- `plugin-self-containment` (20 tasks) — depends on `refactor-tools-split-candidate` task group 5 producing `tools/delivery-context/{db,requirements,redaction,projection}.ts`. Without that split, `plugin-self-containment` has no files to move into `global/plugin/session-delivery-context/`.
- `install-init-hardening` (22 tasks) — depends on `kit-config-hygiene` landing first because both modify `tools/install-opencode-global.ts`. The `machineOverride` marker introduced by `kit-config-hygiene` is the branch point `install-init-hardening` uses for its setx guard and `--persist-script` mode.

### Wave 3 — Archive

`openspec archive <change>` for each completed change after `npm run validate:strict`, `npm test`, and a session-delivery-reviewer pass are recorded.

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