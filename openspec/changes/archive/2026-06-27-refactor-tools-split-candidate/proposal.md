## Why

Three files in `tools/` exceed the `code-quality-inventory` split-candidate band (800 lines): `tools/validate-library.ts` (1468), `tools/test-library.ts` (1708), and `tools/session-delivery-context.ts` (1019). They mix frontmatter parsing, JSONC stripping, embedded required-text contracts, fixture building, DB introspection, and projection. Nine `tools/test-*.ts` files re-implement their own test runner, and the kit reinvents a JSONC parser and a YAML frontmatter parser that already exist as established dependencies. The combined effect is high review cost, drift between fixture and source, and a sequential `npm test` chain that hides partial failures.

## What Changes

- Split `tools/validate-library.ts` into focused validators under `tools/validators/` (frontmatter, skills, agents, profiles, opencode-config, markdown, devkit-contract, permission-policy, routing, binding).
- Split `tools/test-library.ts` into `tools/test-helpers/` (fixture-builder, assert-helpers, runner) plus per-domain test files; cap each file under ~400 lines.
- Split `tools/session-delivery-context.ts` into `tools/delivery-context/{db,requirements,redaction,projection}.ts` with explicit module boundaries.
- Migrate every `tools/test-*.ts` from a hand-rolled `TestCase`/assert/withTemp* harness to `node --test` (stable since Node 22, available on Node >=24 required by the repo).
- Replace the handwritten `stripJsonComments` and `stripJsonTrailingCommas` in `tools/validate-library.ts` with `jsonc-parser`.
- Replace the handwritten `getFrontmatterMap` in `tools/validate-library.ts` with `js-yaml` for YAML and a `zod` schema for `name`, `description`, and `mode` fields.
- Extract the 15+ inline `for (const required of [...])` required-text contracts into `tools/contracts/*.ts` named by domain (skills, agents, complain, reviewer-binding, session-delivery, implementation-worker, openspec).
- Change `npm test` from a long `&&`-chained command to `node --test tools/test-*.ts` so files run in parallel and one failure does not hide the rest.

No external API changes. The CLI surface (`npm run validate`, `npm test`, `npm run code-quality:inventory`, `npm run instruction:inventory`) stays identical.

## Capabilities

### New Capabilities
- `library-tools-architecture`: defines the module layout, validator/test runner, and contract-source conventions for `tools/` so future contributors split responsibilities instead of growing monolithic files.

### Modified Capabilities
- (none — the kit does not yet ship a documented capability surface for `tools/`; this change introduces the canonical one.)

## Impact

- `tools/validate-library.ts` becomes an orchestrator that imports from `tools/validators/*` and `tools/contracts/*`; expected final size ~150-250 lines.
- `tools/test-library.ts` becomes either a thin aggregator or is removed in favour of `node --test` discovery.
- `tools/session-delivery-context.ts` keeps its CLI entrypoint but delegates to `tools/delivery-context/*` modules.
- New dev dependencies: `jsonc-parser`, `js-yaml`, `zod` (already a transitive via OpenCode; declared explicitly so behavior is stable).
- `package.json` `scripts.test` switches to `node --test tools/test-*.ts`.
- All 54 existing library tests and the 8 pre-push tests must continue to pass with no behavior change.
- The kit's validator (`tools/validate-library.ts` orchestrator) must still detect every regression it detects today.