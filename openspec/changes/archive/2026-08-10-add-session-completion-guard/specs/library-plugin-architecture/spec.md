## ADDED Requirements

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
