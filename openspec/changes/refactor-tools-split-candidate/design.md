## Context

The current `tools/` directory grew organically. `validate-library.ts` started as a single-purpose validator for skills and absorbed every new check (agents, profiles, AGENTS.md, OpenCode config, permission policy, routing, session-delivery binding, implementation-worker routing, markdown, forbidden anchors) until it carried 10+ responsibilities in 1468 lines. `test-library.ts` embedded its fixture builder inline (~230 lines), repeated the reviewer permission YAML verbatim across ~7 test cases, and did the same for the CI template and `package.json` literal. `session-delivery-context.ts` mixed SQLite schema introspection with Russian+English heuristic regex and JSON projection. Nine additional `tools/test-*.ts` files re-implement a hand-rolled test runner that Node has shipped natively since version 22.

Stakeholders: the kit maintainers (read every change here), downstream consumers of `npm run validate` and `npm test` (must keep working unchanged), and the validator reviewer agent (relies on the structural assertions enforced by `validate-library.ts`).

## Goals / Non-Goals

**Goals:**

- Bring every `tools/*.ts` file under the 400-line attention band by splitting mixed responsibilities.
- Replace reinvented JSONC and YAML parsers with established dependencies.
- Centralize required-text and permission-rule contracts in `tools/contracts/`.
- Migrate every `tools/test-*.ts` to `node --test` so failures are isolated and runs are parallel.
- Preserve all existing validator, installer, and test behavior with zero observable change for CLI users.

**Non-Goals:**

- Add new validator rules (separate change).
- Change CLI flags, JSON output, or exit codes.
- Rewrite `tools/session-delivery-context.ts`'s public `readSessionDeliveryContext` API.
- Remove the hand-rolled test harness from files that have not been edited as part of this change (only apply the rule to next-edit windows).

## Decisions

### D1 — Use `js-yaml` and `zod`, not a hand-written parser

**Choice**: Replace the handwritten `getFrontmatterMap` with `js-yaml` followed by a `zod` schema for the three scalar fields the validator relies on (skill `name`, `description`; agent `description`, `mode`).

**Rationale**: The hand-written parser handles only the subset of YAML the kit currently emits and silently misclassifies edge cases (multiline scalars, anchor references, escaped colons). `js-yaml` is the same parser OpenCode already depends on transitively. Adding `zod` for three scalars costs ~10 lines and gives precise error positions.

**Alternatives considered**:

- *Stick with hand-written parser*: rejected because bug surface grows with new skill/agent frontmatter patterns (lists, nested maps, multiline).
- *Use `yaml` package*: rejected; `js-yaml` is already in the dep tree.

### D2 — Use `jsonc-parser`, not a hand-written JSONC stripper

**Choice**: Replace `stripJsonComments` + `stripJsonTrailingCommas` with `jsonc-parser`'s `parse(text, reviver, true)` (the third argument enables comments).

**Rationale**: `jsonc-parser` is small, well-tested, and the same parser OpenCode itself uses for `opencode.jsonc`. The hand-written stripper does not handle Unicode escapes, multi-line raw strings, or nested templates safely.

**Alternatives considered**:

- *Use Node's `JSON.parse` with a strip*: rejected; the strip is exactly what we are removing.
- *Move to plain JSON only*: rejected; users want comments in `opencode.jsonc`.

### D3 — `node --test` migration is per-edit, not bulk

**Choice**: Migrate each `tools/test-*.ts` file to `node --test` when it is next edited as part of this change. Existing files keep the hand-rolled harness until they are touched.

**Rationale**: A bulk migration is risky and offers no behavior gain until each file is exercised in the new runner. The change enforces the rule for every file modified under CHG-001 and for every new file going forward.

**Alternatives considered**:

- *Bulk migration*: rejected; too large for one change; review cost would dominate.
- *Forbid hand-rolled harness in all files at once*: rejected; would force edits unrelated to the refactor.

### D4 — Contracts module is the single source of required text

**Choice**: Move every required-text list (e.g. prevention feedback tokens, session-delivery binding tokens, implementation-worker handoff fields) into `tools/contracts/<domain>.ts`. The validator imports these lists; the tests reference the same symbols.

**Rationale**: Today, the validator and the tests duplicate the same token strings in two places. When a token is added, both places must be edited. Centralizing removes that drift surface.

### D5 — Module layout for `tools/session-delivery-context.ts`

**Choice**: Split the existing 1019-line file into:

- `tools/delivery-context/db.ts` — typed SQLite scans for sessions, messages, parts, todos, events.
- `tools/delivery-context/requirements.ts` — the deterministic `REQUIREMENT_SIGNAL_RULES` table and negation patterns.
- `tools/delivery-context/redaction.ts` — structural secret key handling.
- `tools/delivery-context/projection.ts` — final result shape and metadata.
- `tools/session-delivery-context.ts` — thin CLI entrypoint that wires the modules.

**Rationale**: Heuristic rules and DB scans have different validation contracts and different change rates. Mixing them in one file hides which one is exercised by tests.

## Risks / Trade-offs

- **[Risk] New parser packages drift from transitive versions** → Pin `jsonc-parser` and `js-yaml` to a specific minor range; document in `package.json` and add a `lockfile-lint` style check in CI.
- **[Risk] `node --test` parallel run flakes on shared filesystem state** → Each migrated test must use `fs.mkdtempSync` for fixtures; reject any test that hardcodes paths.
- **[Risk] Contract extraction expands scope** → Only move lists touched by this change; leave unrelated inline lists for follow-up changes.
- **[Risk] Frontmatter validation becomes stricter and rejects previously-accepted artifacts** → Run `npm run validate` after the swap; if any genuine artifact is now flagged, the change must add a regression test, not relax the schema.
- **[Risk] Refactor accidentally changes observable output** → Add a snapshot test that diffs `node tools/validate-library.ts` stdout on the fixture repo before and after; if diffs exist beyond formatting, the change is invalid.

## Migration Plan

1. Land `tools/contracts/*` first, with the original required-text strings moved verbatim and re-exported from the old location as a thin shim so no external consumer breaks.
2. Split `tools/validate-library.ts` into `tools/validators/*` one domain at a time. Each split lands behind the same orchestrator entrypoint.
3. Replace JSONC and frontmatter parsers after the orchestrator has been split into smaller files, so the swap touches a focused module.
4. Migrate `tools/test-library.ts` to `node --test` together with the fixture-builder extraction.
5. Update `package.json` `scripts.test` last, after every `tools/test-*.ts` file uses `node --test`.
6. Roll back: each step is a normal commit; no data migration, no remote state.

## Open Questions

- Should the `node --test` migration keep `assertSuccess`/`assertFailure` style output for backward compatibility with reviewer expectations, or accept `node:test`'s TAP-style output? Recommendation: keep current human-readable lines by overriding the reporter, so `npm test` output stays the same shape.
- Do we want `tools/validators/*.ts` to be importable from other tools (e.g. `tools/openspec-operation-gate.ts` reusing `tools/validators/opencode-config.ts`)? Recommendation: yes for the OpenCode-config rules, but defer to a follow-up change after this one lands.