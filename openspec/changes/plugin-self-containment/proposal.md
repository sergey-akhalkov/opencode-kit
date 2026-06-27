## Why

`global/plugin/session-env.ts` dynamically imports `tools/session-delivery-context.ts` via `path.resolve(pluginDir, "..", "..", "tools", "session-delivery-context.ts")`. The plugin reaches across the repository layout to find its only collaborator, which makes the plugin non-portable: relocating the plugin, packaging it as a standalone npm package, or moving the kit to a different repository structure breaks the import. The plugin should be self-contained, with all collaborators under `global/plugin/`.

## What Changes

- Move the body of `tools/session-delivery-context.ts` (1019 lines) into a module under `global/plugin/session-delivery-context/` (split into `db.ts`, `requirements.ts`, `redaction.ts`, `projection.ts`, `index.ts`).
- Update `global/plugin/session-env.ts` to import the module directly from `global/plugin/session-delivery-context/`, removing the dynamic `path.resolve` lookup.
- Keep `tools/session-delivery-context.ts` as a thin CLI wrapper that re-exports the public API for tests and for any future CLI consumers. The wrapper imports from `global/plugin/session-delivery-context/`.
- Add a regression test in `tools/test-session-env-plugin.ts` (or its `node --test` successor) that loads the plugin from a fixture `OPENCODE_CONFIG_DIR` without any `tools/` directory present, confirming the plugin does not reach outside its own directory.
- Update `openspec-operation-gate.ts` and `instruction-feedback-ledger.ts` if they imported from the old path.

## Capabilities

### New Capabilities

- `library-plugin-architecture`: defines the convention that `global/plugin/*.ts` files SHALL be self-contained and SHALL NOT reach outside the `global/plugin/` directory via dynamic path resolution.

## Impact

- `global/plugin/session-env.ts` removes `loadSessionDeliveryContextModule` and uses a static import.
- A new `global/plugin/session-delivery-context/` directory replaces the cross-directory coupling.
- `tools/session-delivery-context.ts` becomes a thin CLI shim (≤ 100 lines).
- All tests must continue to pass.
- `tools/openspec-operation-gate.ts` and `tools/instruction-feedback-ledger.ts` keep their existing imports via the shim.