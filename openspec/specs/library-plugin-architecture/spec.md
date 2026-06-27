# library-plugin-architecture Specification

## Purpose
TBD - created by archiving change plugin-self-containment. Update Purpose after archive.
## Requirements
### Requirement: Plugin self-containment

Every TypeScript file under `global/plugin/` SHALL be loadable when copied into a directory that contains no other repository files. A plugin SHALL NOT resolve a module from outside `global/plugin/` via dynamic path lookup.

#### Scenario: plugin loads without repo context

- **WHEN** the `global/plugin/session-env.ts` plugin is copied into a fresh directory that contains only `global/plugin/` and no other repository assets
- **THEN** OpenCode SHALL load the plugin successfully
- **AND** the `session_delivery_context` tool SHALL be registered.

#### Scenario: no dynamic cross-directory resolution

- **WHEN** `global/plugin/*.ts` files are inspected
- **THEN** they SHALL NOT contain `path.resolve(pluginDir, "..", ...)`, `path.resolve(import.meta.url, "..", "..", ...)`, or equivalent cross-directory dynamic imports
- **AND** they SHALL reach collaborators via static `import` statements only.

### Requirement: Co-located session-delivery-context module

The implementation of the `session_delivery_context` tool SHALL live under `global/plugin/session-delivery-context/` as a directory module. The module SHALL expose `readSessionDeliveryContext(options: ReadSessionDeliveryContextOptions): SessionDeliveryContextResult` as its public entry point.

#### Scenario: module entry point

- **WHEN** the plugin imports the session-delivery-context module
- **THEN** it SHALL import from `./session-delivery-context/index.ts` (or `./session-delivery-context/mod.ts` if the kit's TypeScript config supports it)
- **AND** the import SHALL resolve statically without filesystem probing.

#### Scenario: module split mirrors tools/delivery-context

- **WHEN** the kit implements `global/plugin/session-delivery-context/`
- **THEN** the directory SHALL contain `db.ts`, `requirements.ts`, `redaction.ts`, `projection.ts`, and `index.ts`
- **AND** `index.ts` SHALL be the only file the plugin imports.

### Requirement: tools/session-delivery-context.ts is a CLI shim

The file `tools/session-delivery-context.ts` SHALL exist as a thin CLI entrypoint only. It SHALL import its implementation from `global/plugin/session-delivery-context/` and SHALL NOT contain business logic.

#### Scenario: CLI shim size

- **WHEN** `tools/session-delivery-context.ts` is inspected
- **THEN** it SHALL NOT exceed 100 lines
- **AND** it SHALL NOT contain SQL queries, regex rule definitions, or result-shape projection logic.

#### Scenario: CLI shim delegates to plugin module

- **WHEN** a developer runs `node tools/session-delivery-context.ts` from the repo root
- **THEN** the shim SHALL resolve the implementation from `global/plugin/session-delivery-context/index.ts`
- **AND** the shim's output SHALL match the pre-change behavior byte-for-byte on the fixture SQLite databases in `tools/test-session-env-plugin.ts`.

