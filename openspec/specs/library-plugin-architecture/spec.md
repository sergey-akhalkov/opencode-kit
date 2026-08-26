# library-plugin-architecture Specification

## Purpose
Defines self-contained global plugin packaging, runtime discovery, privacy-safe session context, and independence from repository-only source paths.

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

### Requirement: Explicit extension plugins may use pinned global dependencies
The global kit source SHALL support explicitly configured extension plugin entrypoints outside auto-discovered `global/plugin/` when a runtime integration requires plugin options or one shared pinned dependency instance. Each extension SHALL use static imports within the kit global source, declare external packages in `global/package.json`, and pass a copied-source load test with its declared dependencies installed.

#### Scenario: Completion extensions load from kit source
- **WHEN** OpenCode loads the kit global configuration
- **THEN** the configured PTY bridge and completion guard SHALL resolve from stable kit-relative paths
- **AND** they SHALL not dynamically locate modules in the OpenCode package cache or repository-maintenance `tools/` directory.

### Requirement: PTY bridge and guard share one manager instance
The kit SHALL pin the supported `opencode-pty` version and load both its plugin bridge and guard-side manager import from the same Node module graph. Runtime and deterministic validation SHALL fail closed if the exported manager contract is missing or two manager identities are observed.

#### Scenario: Shared manager observes live PTY
- **WHEN** a PTY is spawned through the configured bridge
- **THEN** the completion guard's imported manager SHALL list the same PTY id and status
- **AND** its registered callback SHALL observe the matching transition.

### Requirement: Session delivery context separates provenance classes
`session_delivery_context` SHALL distinguish non-synthetic human messages from synthetic OpenCode, PTY, background-task, compaction, and completion-guard messages. Only human messages and human question replies SHALL feed accepted-goal and requirement-signal projection.

#### Scenario: Guard continuation is read back
- **WHEN** the context reader encounters a provenance-marked synthetic guard continuation
- **THEN** it SHALL return the message under synthetic evidence
- **AND** it SHALL not include the text in human-message counts or requirement signals.

#### Scenario: Human and synthetic message data coexist
- **WHEN** one root contains human prompts, question replies, PTY notifications, task results, and guard interventions
- **THEN** the context schema SHALL preserve each evidence class with stable privacy-safe refs and explicit truncation warnings
- **AND** it SHALL not attribute a guard rejection to the human user.

### Requirement: Completion evidence is bounded and self-contained
The session context module SHALL expose bounded assistant completion text, tool execution state, patch/diff evidence, validation evidence, descendant/background state, and strategy-history refs needed by the arbiter without depending on repository-only source paths. Sensitive shapes SHALL pass through the existing redaction layer.

#### Scenario: Execution evidence exceeds bounds
- **WHEN** tool or assistant evidence exceeds the deterministic projection limit
- **THEN** the result SHALL include bounded content and an explicit truncation record
- **AND** the arbiter SHALL not receive a silent claim of complete evidence.

### Requirement: Diagnostic sidecars do not acquire session authority
An optional completion-guard monitor process SHALL be a read-only consumer of the root-correlated persisted metadata in the existing OpenCode runtime database. It SHALL receive only the bounded storage/root state needed through one one-use local IPC handoff, SHALL open the database read-only, and SHALL NOT load the plugin graph, start a server, fork/attach a session, mutate metadata, send prompts, answer questions, or inherit provider credentials.

#### Scenario: Monitor process is launched
- **WHEN** the enabled Windows launcher starts the monitor console
- **THEN** its argv SHALL contain only executable/script paths, non-sensitive display arguments, and an opaque short-lived local handoff name while the raw root id and database path remain in one-use in-memory IPC
- **AND** the process SHALL render privacy-safe refs rather than raw ids, directories, prompts, commands, or credentials.

#### Scenario: Monitor consumes connection handoff
- **WHEN** the first monitor process connects with the random local handoff name before timeout
- **THEN** it SHALL receive one bounded config payload and the producer SHALL close the handoff
- **AND** a second reader, timeout, or malformed payload SHALL fail without changing guard state or exposing provider credentials.

#### Scenario: Monitor process fails
- **WHEN** spawn, connection, polling, or rendering fails
- **THEN** the owning guard SHALL retain its original completion state and side effects
- **AND** diagnostics SHALL preserve a bounded original cause without retry-spawning a window loop.

### Requirement: Session evidence acquisition is root-correlated before projection
Session-delivery evidence SHALL obtain a root and its reachable descendants through indexed, parameterized, bounded queries before message/event projection. It SHALL NOT materialize every session in the database for one root audit. The current defaults SHALL retain at most 512 session rows and 16 descendant levels for one root graph. Query results SHALL report omitted counts or unknown state without silently claiming completeness.

#### Scenario: Database contains unrelated sessions
- **WHEN** a database contains 100,000 unrelated sessions and one bounded root tree
- **THEN** evidence queries read only rows needed to resolve that root tree plus explicit bounded metadata
- **AND** query-plan evidence contains no full session-table scan

#### Scenario: Descendant bound is exceeded
- **WHEN** a root has more descendants than the configured bound
- **THEN** projection records the retained rows and omitted count
- **AND** completion arbitration fails closed when omitted descendants can affect liveness or completion

### Requirement: Query performance evidence is maintained
The repository SHALL retain provider-free fixtures and query-plan/latency/resource observations for small, large-unrelated, deep, wide, missing, and malformed session graphs. Acceptance SHALL require bounded work growth with the selected root graph rather than total database size; timing SHALL be reported with environment identity and SHALL NOT be the sole correctness oracle.

#### Scenario: Unrelated database size grows
- **WHEN** unrelated session count increases while the selected root graph is unchanged
- **THEN** selected-row count and projection output remain unchanged
- **AND** latency and memory remain environment-attributed diagnostics while row count, query plan, bounds, and output identity determine correctness in this increment
