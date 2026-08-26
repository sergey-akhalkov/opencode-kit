# project-memory-context Specification

## Purpose
Defines an opt-in, project-scoped memory layer that records reusable knowledge explicitly and recalls only bounded, current, privacy-safe context for primary OpenCode sessions.

## Requirements

### Requirement: Project memory is explicitly enabled and project-isolated

Project memory SHALL read activation once when the plugin starts and SHALL be enabled only when `OPENCODE_PROJECT_MEMORY=1`; changing activation SHALL require an OpenCode restart. The canonical project root SHALL be the real path of `PluginInput.worktree`, falling back in order to `PluginInput.project.worktree` and `PluginInput.directory` only when the earlier value is absent. A session directory outside that root SHALL fail closed for memory operations.

An enabled project SHALL resolve one machine-local store using a 32-hex-character SHA-256 prefix of that canonical root and SHALL support concurrent readers and exclusive append creation. The data-root precedence SHALL be `OPENCODE_DATA_DIR`; otherwise `%LOCALAPPDATA%/opencode` then `%APPDATA%/opencode` on Windows, `$XDG_DATA_HOME/opencode` then `~/.local/share/opencode` on other non-macOS hosts, and `~/Library/Application Support/opencode` on macOS. It SHALL NOT place memory records or indexes in the project worktree. Values other than `1`, an incomplete plugin input, or a root mismatch SHALL leave project-memory tools and context hooks disabled while preserving existing plugin behavior.

#### Scenario: Feature is disabled by default

- **WHEN** OpenCode loads the kit without `OPENCODE_PROJECT_MEMORY=1`
- **THEN** no project-memory tool SHALL be registered
- **AND** no project-memory context SHALL be injected or written.

#### Scenario: Activation changes while OpenCode is running

- **WHEN** `OPENCODE_PROJECT_MEMORY` changes after the plugin has started
- **THEN** the loaded project-memory activation state SHALL remain unchanged
- **AND** the new value SHALL take effect only after restart.

#### Scenario: Session directory is outside the plugin worktree

- **WHEN** an enabled tool or hook resolves a session directory outside the canonical plugin worktree
- **THEN** memory access and injection SHALL fail closed
- **AND** no alternate project store SHALL be selected from that session directory.

#### Scenario: Two projects use the same OpenCode data directory

- **WHEN** project memory is enabled for two distinct canonical project roots
- **THEN** each project SHALL resolve a distinct privacy-safe store
- **AND** neither store path or diagnostic SHALL disclose the other project's absolute path.

### Requirement: Memory records use a strict append-only Markdown lifecycle

The enabled capability SHALL expose exactly two tools named `project_memory_recall` and `project_memory_manage`. `project_memory_manage` SHALL support only `candidate`, `promote`, and `invalidate` actions. A candidate SHALL use the versioned Markdown schema and include an id, title, kind (`tip`, `pitfall`, or `procedure`), status event, triggers, repository-relative paths or symbols to which it applies, creation time, confidence (`low`, `medium`, or `high`), technique, rationale, evidence, and an explicit `Invalidated When` condition. Candidate events SHALL be at most 16 KiB after redaction and SHALL use one of 2,000 fixed exclusive-created card slots. Promotion and invalidation events SHALL each be at most 4 KiB and SHALL use one of 8,000 fixed exclusive-created lifecycle slots, bounding one project store to 2,000 cards and 10,000 total events without a mutable counter or lock.

Promotion and invalidation SHALL append immutable Markdown events rather than overwrite or delete prior records. An invalidation event SHALL be terminal for that card id. The capability SHALL NOT infer candidates from transcripts, tool output, or compaction and SHALL NOT promote a candidate without an explicit tool action.

#### Scenario: Agent records a reusable procedure

- **WHEN** `project_memory_manage` receives a valid `candidate` action for a verified procedure
- **THEN** it SHALL redact the input and append one schema-versioned candidate record with a privacy-safe card ref
- **AND** that candidate SHALL remain ineligible for automatic context injection.

#### Scenario: Candidate is promoted explicitly

- **WHEN** `project_memory_manage` receives a valid `promote` action for an existing candidate with evidence and a current verification time
- **THEN** it SHALL append a promotion event
- **AND** subsequent recall SHALL fold the card to active status without changing the candidate record.

#### Scenario: Card is invalidated

- **WHEN** `project_memory_manage` receives an `invalidate` action with a non-empty reason
- **THEN** it SHALL append an invalidation event
- **AND** no later promotion event SHALL make that card eligible for automatic injection.

#### Scenario: Concurrent actions target one card

- **WHEN** two processes append promotion or invalidation events concurrently
- **THEN** each event SHALL use exclusive creation and SHALL NOT overwrite another event
- **AND** deterministic folding SHALL make any valid invalidation terminal while duplicate promotions remain idempotent.

#### Scenario: Manage reaches fixed capacity

- **WHEN** a candidate action has no free card slot or any manage action has no free applicable event slot
- **THEN** the action SHALL fail before writing semantic content
- **AND** an externally created over-limit store SHALL remain read-only to project-memory tools until repaired outside the plugin.

### Requirement: Recall is deterministic, relevant, and bounded

`project_memory_recall` and automatic recall SHALL normalize text with Unicode NFKC, lowercase it, and split Unicode letter/number terms plus camel-case boundaries. The scoring corpus SHALL contain current active local cards and safe current curated files other than `core.md` after schema, lifecycle, freshness, fingerprint, containment, and envelope filters but before query relevance filtering. For each title, trigger, selector, and body field it SHALL use BM25 with `k1=1.2` and `b=0.75`, then multiply those field scores by `3`, `3`, `4`, and `1`. A curated file's title field SHALL be its relative memory name plus first level-one heading. An exact normalized trigger phrase SHALL add `8`; an exact repository-relative path or symbol SHALL add `10`. A result SHALL be automatically eligible only when an exact trigger/path/symbol signal exists or at least two distinct query terms match and the weighted BM25 score is at least `1.0`.

Ranking SHALL order exact path/symbol matches first, then total score, confidence (`high`, `medium`, `low`), verification time descending, source label, and privacy-safe ref. Current curated Serena records SHALL use `medium` confidence and filesystem modification time for these tie-breaks. Automatic recall SHALL return zero results rather than pad a weak match and SHALL select at most seven combined local and curated results. The complete advisory capsule, including precedence header, warnings, a maximum 2-KiB `core.md` payload, and recalled results, SHALL be at most 8 KiB; L3 results receive only the remaining bytes after header, warnings, and L1 core.

The explicit recall tool SHALL accept a required query and optional repository-relative path, symbol, status inclusion, and limit not greater than seven. Its versioned output SHALL identify source class, status, score evidence, freshness, warnings, and truncation without exposing absolute paths and SHALL be at most 16 KiB. Manage output SHALL be at most 4 KiB and contain refs/status/diagnostics rather than echoing complete candidate content.

#### Scenario: Exact path and symbol match wins

- **WHEN** multiple active cards share lexical terms but one card also matches the supplied repository-relative path or symbol
- **THEN** the exact metadata match SHALL rank ahead of cards with lexical overlap alone
- **AND** repeated recall over the same corpus and query SHALL return the same order.

#### Scenario: Query has no meaningful match

- **WHEN** every eligible result is below the relevance threshold
- **THEN** automatic recall SHALL inject no memory card
- **AND** explicit recall SHALL return an empty result set with no fabricated fallback.

#### Scenario: Result budget is exceeded

- **WHEN** more than seven eligible results or more than 8 KiB of rendered content would be selected
- **THEN** recall SHALL keep the highest-ranked content within both bounds
- **AND** output SHALL report deterministic truncation counts.

### Requirement: Automatic recall excludes stale or contradicted cards

An active local card SHALL become stale when its `verified_at` value is older than 180 days, a declared repository evidence path is missing, or a stored evidence fingerprint differs from the current file. Stale, malformed, candidate, invalidated, and fingerprint-mismatched local cards SHALL be excluded from automatic injection. Explicit recall SHALL return such cards only when the caller requests their status and SHALL label the exclusion reason. Current user instructions, source, specifications, and runtime evidence SHALL always outrank memory content.

#### Scenario: Referenced source changes

- **WHEN** an active card's stored evidence fingerprint no longer matches the current repository file
- **THEN** automatic recall SHALL omit the card
- **AND** explicit status-inclusive recall SHALL mark it stale with a privacy-safe fingerprint-mismatch reason.

#### Scenario: Verification age crosses the limit

- **WHEN** an active card was last verified more than 180 days before the current clock
- **THEN** automatic recall SHALL omit the card
- **AND** it SHALL remain preserved for explicit re-verification or invalidation.

### Requirement: Memory context is injected only into verified primary root sessions

For each human message in an enabled primary root session, the capability SHALL use the message text ephemerally to select current memory, then append one advisory system capsule containing a bounded project core and eligible recalled results. It SHALL not persist the raw prompt, normalized query, or query-derived tokens. If session parentage cannot be verified, the capability SHALL inject nothing.

Before system transformation or compaction uses a cached selection, the capability SHALL re-read lifecycle state and revalidate freshness, evidence fingerprints, and current curated files for only the selected refs. It SHALL remove any newly invalidated, stale, mismatched, missing, or unsafe item and re-render within the total capsule budget. Newly added cards SHALL wait until the next human message selection.

The root lookup SHALL use one local OpenCode `session.get` request with a one-second deadline and no retry. Missing session id, timeout, lookup failure, or hook-order state without a preceding selection SHALL produce one privacy-safe owning-boundary warning and no memory injection. The compaction hook SHALL append only the revalidated bounded capsule, privacy-safe card refs, and explicit truncation or warning state. It SHALL not create memory records, read raw session transcripts, replace the default compaction prompt, or schedule improvement work.

#### Scenario: Primary root receives relevant memory

- **WHEN** an enabled primary root receives a human prompt that matches current active memory
- **THEN** the system context SHALL receive one advisory capsule within the configured bounds
- **AND** the capsule SHALL state that current instructions, source, specs, and runtime evidence take precedence.

#### Scenario: Subagent receives the same prompt

- **WHEN** a child or subagent session receives text that would match the same cards
- **THEN** automatic project-memory context SHALL not be injected.

#### Scenario: Root lookup fails

- **WHEN** the runtime cannot establish whether a session has a parent
- **THEN** automatic recall SHALL fail closed with no injection
- **AND** unrelated OpenCode plugin behavior SHALL remain available.

#### Scenario: Session compacts after recall

- **WHEN** compaction starts after a bounded capsule was selected
- **THEN** compaction context SHALL contain only that bounded advisory capsule and privacy-safe state
- **AND** no candidate, transcript, mandatory task, or replacement compaction prompt SHALL be created.

#### Scenario: Another process invalidates a selected card

- **WHEN** a second process appends a valid invalidation after selection but before system transformation or compaction
- **THEN** revalidation SHALL remove that card from the cached capsule
- **AND** no stale cached content for that card SHALL be injected.

#### Scenario: Root lookup does not terminate promptly

- **WHEN** the local session lookup exceeds one second or the system transform has no matching prior root selection
- **THEN** automatic recall SHALL emit one privacy-safe warning and inject nothing
- **AND** it SHALL not retry or delay unrelated plugin behavior further.

### Requirement: Curated Serena memories remain optional and read-only

When `.serena/memories/` exists, the capability SHALL read current regular Markdown files beneath that directory as an optional curated source without requiring a Serena MCP process. It SHALL use a maximum of 100 files and 512 KiB total, reject symbolic links or resolved paths outside the directory, cap `core.md` project context at 2 KiB, exclude `core.md` from L3 ranking, and include other curated matches within the remaining shared seven-result/8-KiB total capsule budget. It SHALL never write, rename, promote, invalidate, or delete a Serena memory.

#### Scenario: Project has curated Serena memories

- **WHEN** an enabled project contains a valid `.serena/memories/core.md` and relevant curated Markdown
- **THEN** the current bounded core SHALL be available as project context
- **AND** relevant curated content SHALL be eligible to rank with local active cards while retaining a distinct source label.

#### Scenario: Serena is absent

- **WHEN** the project has no `.serena/memories/` directory or no Serena MCP process
- **THEN** local project-memory recall SHALL continue without an error.

#### Scenario: Curated source exceeds its envelope

- **WHEN** the curated source exceeds 100 files or 512 KiB, contains a symbolic link, or resolves outside `.serena/memories/`
- **THEN** the unsafe or over-limit curated source SHALL be omitted
- **AND** the capsule or recall output SHALL contain a bounded warning without exposing an absolute path.

### Requirement: Memory preserves privacy and unrelated state

All candidate inputs, persisted text, curated snippets, tool output, injected context, and diagnostics SHALL first replace case-insensitive canonical project-root prefixes in native and slash-normalized forms with `<project-root>`, then pass through the existing plugin redaction behavior before leaving their source boundary. Repository selectors SHALL reject absolute paths and parent traversal. Persisted state and diagnostics SHALL use privacy-safe project, session, and card refs; the local store SHALL contain no raw prompt, session transcript, provider credential, or absolute project-path manifest.

Recall SHALL perform no provider or external-network request and no project worktree mutation; the bounded local OpenCode session metadata lookup is the only client request used by automatic recall. A manage action SHALL write only under the resolved project-memory data store. Retrieval, parsing, or write failure SHALL preserve its original cause at the owning tool or hook boundary without logging the same failure repeatedly.

#### Scenario: Candidate contains a recognizable secret and home path

- **WHEN** a candidate contains a supported token shape and an absolute user-home path
- **THEN** persisted and returned content SHALL contain redacted placeholders instead of either value
- **AND** no raw value SHALL appear in metadata or diagnostics.

#### Scenario: Candidate contains the project root outside a user-home pattern

- **WHEN** candidate content includes the canonical project root such as `D:\home\project` or its slash-normalized form
- **THEN** persisted and returned content SHALL contain `<project-root>` instead of that prefix
- **AND** the replacement SHALL occur even when the existing user-home redaction pattern does not match it.

#### Scenario: Selector escapes the repository

- **WHEN** a manage or recall request supplies an absolute path or a selector containing parent traversal
- **THEN** the request SHALL fail before reading or writing memory
- **AND** the diagnostic SHALL identify the invalid field without echoing a sensitive path.

#### Scenario: Recall runs in a disposable repository

- **WHEN** automatic and explicit recall complete against an isolated data store
- **THEN** an external-egress canary SHALL observe no provider or external-network request
- **AND** `git status --porcelain` for the project SHALL be unchanged.

### Requirement: Invalid memory input fails visibly without disabling OpenCode

Unsupported schema versions, malformed metadata, invalid state transitions, over-limit records, unreadable stores, and corpus-envelope violations SHALL produce bounded cause-preserving warnings or tool errors. A malformed individual card SHALL be quarantined from automatic recall while valid in-envelope cards remain usable. If safe bounded corpus enumeration cannot establish both the 2,000-card and 10,000-event limits, automatic local recall SHALL inject nothing rather than use a silent partial population.

#### Scenario: One card has malformed metadata

- **WHEN** an in-envelope store contains one malformed card and one valid active card
- **THEN** automatic recall SHALL exclude the malformed card and SHALL select the valid card when it meets the relevance threshold
- **AND** diagnostics SHALL contain a privacy-safe malformed-card ref.

#### Scenario: Store exceeds a corpus limit

- **WHEN** safe enumeration finds more than 2,000 local cards or more than 10,000 local events
- **THEN** automatic local recall SHALL inject no partial local result
- **AND** explicit recall SHALL return a bounded envelope error while curated recall remains independently available.

#### Scenario: Memory hook fails

- **WHEN** an enabled automatic recall hook encounters an unreadable local store
- **THEN** the owning boundary SHALL report one bounded cause-preserving warning and inject no local card
- **AND** unrelated tools, messages, and compaction behavior SHALL continue.
