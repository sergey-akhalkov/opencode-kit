## Context

The session-env plugin (`global/plugin/session-env.ts`) is OpenCode's only contributor to the `session_delivery_context` tool. The implementation of that tool lives in `tools/session-delivery-context.ts`, 1019 lines. The plugin reaches across the repository to find it: `loadSessionDeliveryContextModule` iterates over candidate paths under the plugin directory and the repo root.

This coupling is invisible until someone tries to relocate the plugin (e.g. vendor it as an npm package), change the repo layout (e.g. move `tools/` to `scripts/`), or install the kit into a project whose repo already has a `tools/` directory with a different `session-delivery-context.ts`. In all three cases the dynamic import resolves to the wrong file or throws.

Stakeholders: kit maintainers (relocate the plugin without rewriting), the plugin itself (OpenCode loads it on startup), and any future vendor that wants to publish the plugin standalone.

## Goals / Non-Goals

**Goals:**

- Plugin module is portable: it loads successfully when copied into any directory.
- Plugin reaches collaborators via static imports only, never `path.resolve` to parent directories.
- `tools/session-delivery-context.ts` keeps working as a CLI entrypoint.

**Non-Goals:**

- Change the plugin's public surface (the `session_delivery_context` tool contract stays the same).
- Vendor the plugin as an npm package.
- Split `session-delivery-context.ts` by concern — that work belongs to CHG-001 (refactor-tools-split-candidate).

## Decisions

### D1 — Move module under `global/plugin/session-delivery-context/`

**Choice**: Place the module next to the plugin that consumes it. Use a subdirectory because the file is 1019 lines and a single file would re-create the split-candidate problem CHG-001 addresses.

**Rationale**: Co-location is the strongest form of dependency declaration. OpenCode's plugin discovery already walks `global/plugin/`, and a subdirectory does not break that discovery because OpenCode loads each `*.ts` file in the plugin directory individually.

**Alternatives considered**:

- *Single `global/plugin/session-delivery-context.ts`*: rejected; 1019 lines violates CHG-001's split-candidate rule.
- *Create a separate npm package*: rejected; adds build/distribution steps unrelated to self-containment.
- *Move to `global/session-delivery-context/`*: rejected; OpenCode would treat that directory as skill/agent config rather than a plugin module.

### D2 — Plugin uses a static import

**Choice**: Replace the dynamic `loadSessionDeliveryContextModule` function with a top-level `import { readSessionDeliveryContext } from "./session-delivery-context/index.ts";`.

**Rationale**: The dynamic loader exists to find the file across `pluginDir/../../tools/` paths. Once the file lives next to the plugin, the dynamic loader is unnecessary. TypeScript's static analysis catches missing files at build time.

### D3 — `tools/session-delivery-context.ts` becomes a CLI shim

**Choice**: Keep the file at the repo root as a CLI wrapper that imports from `global/plugin/session-delivery-context/` and re-exports the entrypoint.

**Rationale**: Tests in `tools/test-session-env-plugin.ts` import the CLI entrypoint, and the file is referenced from `global/agents/session-delivery-reviewer.md`'s contract checks (via `tools/openspec-operation-gate.ts` and the validator). Removing the file breaks those paths. Keeping a thin shim preserves them.

### D4 — Subdirectory layout mirrors CHG-001's split

**Choice**: Inside `global/plugin/session-delivery-context/`, use the same `{db, requirements, redaction, projection, index}.ts` shape that CHG-001 establishes for `tools/delivery-context/`.

**Rationale**: A single canonical layout makes the codebase navigable. The plugin and the tool share the same internal module boundaries.

## Risks / Trade-offs

- **[Risk] OpenCode plugin discovery might ignore subdirectories** → Add a fixture test that copies the plugin into a fresh dir and confirms OpenCode (or a mock discovery function) loads both `session-env.ts` and the helper module.
- **[Risk] Co-location creates two copies of the same logic if CHG-001 ships first** → Coordinate: CHG-001 should land its split into `tools/delivery-context/`, then CHG-003 moves the result into `global/plugin/session-delivery-context/`.
- **[Risk] The CLI shim adds an extra import hop for tests** → Acceptable; one import is cheap.

## Migration Plan

1. CHG-001 lands first (or concurrently), producing `tools/delivery-context/{db,requirements,redaction,projection}.ts`.
2. Move those files to `global/plugin/session-delivery-context/` with the same shape.
3. Add `global/plugin/session-delivery-context/index.ts` exporting `readSessionDeliveryContext` and types.
4. Update `global/plugin/session-env.ts` to use a static import from `./session-delivery-context/`.
5. Rewrite `tools/session-delivery-context.ts` as a CLI shim that imports from `../global/plugin/session-delivery-context/index.ts`.
6. Update the import in `tools/test-session-env-plugin.ts` if it pointed at the old `global/plugin/session-env.ts` module path.
7. Add the regression test described in the proposal.
8. Verify `npm run validate` and `npm test` both pass.

## Open Questions

- Should the co-located module be importable from outside the plugin directory? E.g. does the validator (`tools/validators/agents.ts`) need to import `session-delivery-context/index.ts`? Recommendation: no; the validator's contract checks are textual and don't depend on the runtime module.