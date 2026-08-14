## ADDED Requirements

### Requirement: Reuse registry machine configuration is explicit and private

The portable registry core SHALL require an explicit config path. A thin kit adapter MAY obtain that path only from a nonblank `OPENCODE_REUSE_CONFIG` environment value; it SHALL NOT infer another config file, registry root, project root, group, or Codebase Memory identity from the current directory, repository basename, `OPENCODE_CONFIG_DIR`, or a full local project inventory.

The private config SHALL contain schema version, explicit existing local registry/cache/outbox roots, enabled named groups, and logical-project bindings to local roots, saved scan refs, and optional exact Codebase Memory project names. It SHALL NOT contain credentials. Committed reusable templates SHALL use placeholders and SHALL NOT contain owner roots, project memberships, refs, or private index identities.

#### Scenario: Environment config path is blank
- **WHEN** the thin adapter receives a missing, empty, or whitespace-only `OPENCODE_REUSE_CONFIG`
- **THEN** it SHALL report registry configuration unavailable and enter explicit degraded behavior
- **AND** it SHALL not select the current directory or another OpenCode config source as fallback.

#### Scenario: Core receives an explicit config path
- **WHEN** an unrelated project invokes the portable core with a valid explicit private config
- **THEN** the core SHALL use only that config's registry, cache, outbox, groups, and bindings
- **AND** its behavior SHALL not depend on the kit checkout or package manager.

#### Scenario: Prompt supplies only a registry Git URL
- **WHEN** the free-form command request contains a Git URL but private config has no existing local checkout binding for that registry
- **THEN** orchestration SHALL request one local checkout path and persist nothing until it is validated
- **AND** no clone, fetch, pull, implicit destination, commit, push, or credential request SHALL occur.

### Requirement: Target scan refs remain explicit local bindings

Each target project binding SHALL persist one exact local `scanRef`. Initial resolution SHALL prefer an existing locally known default-branch ref and SHALL use the exact current branch only when no default ref can be resolved. Future scans SHALL resolve the local tip of the saved ref without network fetch/pull and SHALL report missing, detached, ambiguous, or replaced refs explicitly.

Changing a saved scan ref SHALL be an explicit command-plan change and SHALL trigger full project rescan unless the existing checkpoint is proven compatible with the new ref by the scan contract.

#### Scenario: Saved ref has new local commits
- **WHEN** the saved ref resolves locally to a descendant of `lastSuccessfulCommit`
- **THEN** rescan SHALL use that local descendant as current tip without fetching a remote
- **AND** the resolved full commit SHALL appear in the preview before local registry mutation.

#### Scenario: Saved ref is missing
- **WHEN** the configured scan ref cannot be resolved in the target local repository
- **THEN** the command SHALL stop that project with an exact ref diagnostic and leave its prior checkpoint active
- **AND** it SHALL not substitute current `HEAD`, another branch, or a remote-tracking ref automatically.

### Requirement: Logical project bindings do not broaden allowlist authority

A machine-local project binding SHALL map one stable logical project ID to one explicit local root and optional exact Codebase Memory project name. The binding SHALL be usable only when its logical project belongs to the intersection of requested and enabled registry groups. A local binding or indexed project SHALL NOT add group membership or trust by itself.

Path comparisons SHALL normalize separators and trailing separators and SHALL require exact canonical-root identity. Basename similarity, related worktrees, temporary audit copies, or another index with a similar name SHALL not satisfy the binding.

#### Scenario: Similar checkout is indexed
- **WHEN** the machine has multiple indexed checkouts whose names or basenames resemble the bound project
- **THEN** source verification SHALL use only the exact configured canonical root and exact configured index identity
- **AND** it SHALL not substitute another checkout automatically.

#### Scenario: Bound project is outside selected groups
- **WHEN** a private config contains a valid binding for a project absent from the active group intersection
- **THEN** query and verification SHALL not expose or use that binding
- **AND** diagnostics SHALL not reveal its root or index name.

### Requirement: Private config and cache diagnostics preserve privacy

Status and errors SHALL identify the selected config source, registry logical identity, enabled/requested group IDs, and affected logical project/capability IDs when useful. Absolute registry, cache, outbox, and project roots SHALL be redacted by default and shown only under an explicit local diagnostic option. Raw config content, credentials, unrelated bindings, and unallowlisted project identities SHALL never be printed.

#### Scenario: One binding is malformed
- **WHEN** config validation finds an invalid root or Codebase Memory identity for one logical project
- **THEN** the diagnostic SHALL name that logical project and field without printing unrelated bindings or raw config
- **AND** no query SHALL proceed with partially accepted ambiguous authority.
