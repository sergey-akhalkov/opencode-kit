## ADDED Requirements

### Requirement: Triggered work performs bounded reuse discovery before production code

When the active SDLC trigger classifies a change as introducing a new mechanism, the workflow SHALL perform reuse discovery before production implementation. Discovery SHALL consider, in order, removal or narrowing, current-repository owners, platform or already installed dependencies, enabled central-registry groups, and public ecosystem libraries for a typical capability that remains unmatched.

Discovery SHALL stop after a current verified candidate satisfies the accepted contract with lower total lifecycle cost, or when the next layer is unavailable or cannot materially change the selection within the bounded task. A stopped or blocked layer SHALL remain visible in the reuse disposition.

#### Scenario: Current repository already owns the behavior
- **WHEN** a triggered task finds a current-repository owner that satisfies the required inputs, outputs, effects, constraints, and proof boundary
- **THEN** the workflow SHALL select that owner for reuse or extension
- **AND** it SHALL stop before central-registry and public-ecosystem search unless evidence shows the local owner cannot satisfy the accepted contract.

#### Scenario: Typical capability remains unmatched
- **WHEN** no current, installed, or allowlisted registered candidate satisfies a typical ecosystem capability
- **THEN** the workflow SHALL perform bounded read-only public library research
- **AND** it SHALL NOT install or add a dependency merely because the search found one.

#### Scenario: Trivial owner-local fix does not trigger discovery
- **WHEN** a change only corrects behavior inside an existing cohesive owner and introduces no new dependency, mechanism, reusable API, abstraction, or repeated implementation
- **THEN** the workflow SHALL NOT load the reuse-discovery detail or query the registry
- **AND** ordinary targeted source inspection SHALL remain sufficient.

### Requirement: Reuse decisions use contract fit and total lifecycle cost

A triggered workflow SHALL record exactly one `reuse`, `extend`, or `build-minimal` disposition. Selection SHALL consider current contract and error/effect fit, adaptation cost, runtime/platform cost, provenance, maintenance, license and known security evidence, API/upgrade ownership, proof cost, and resulting code/context cost. Ready-made code SHALL NOT have absolute priority when its total lifecycle cost or risk exceeds a minimal custom owner.

The disposition SHALL include the requested capability and trigger, search layers reached, material candidates, blocked layers, selection reason, and `synced | pending | not-applicable` registry impact. It SHALL remain compact and SHALL NOT copy a complete search transcript into durable instruction or planning context.

#### Scenario: External package requires disproportionate glue
- **WHEN** an external package partially matches the contract but requires additional states, adapters, exception paths, or runtime dependencies beyond a minimal local owner
- **THEN** the disposition SHALL account for those costs
- **AND** the workflow SHALL be permitted to select `build-minimal` without claiming that ready-made code was unavailable.

#### Scenario: Existing dependency is an exact fit
- **WHEN** an already installed maintained dependency satisfies the full current contract and proof boundary without a parallel wrapper mechanism
- **THEN** the disposition SHALL select `reuse` or the smallest necessary `extend`
- **AND** no duplicate custom implementation SHALL be added.

### Requirement: The central registry uses stable logical identities and named allowlist groups

The registry contract SHALL define stable logical registry, project, group, and capability IDs. Named groups SHALL contain explicit logical project membership. A query SHALL operate only on groups requested by the caller and enabled by the active machine-local config; it SHALL use their intersection and SHALL NOT disclose projects outside it.

The committed registry data SHALL NOT contain machine-local absolute project, cache, outbox, or Codebase Memory paths. Codebase Memory project names SHALL remain machine-local bindings and SHALL NOT define registry trust or group membership.

#### Scenario: Requested group is not machine-enabled
- **WHEN** a query requests a valid registry group that the active machine-local config does not enable
- **THEN** the client SHALL reject or omit that group with an explicit privacy-safe diagnostic
- **AND** it SHALL NOT return any project or capability from that group.

#### Scenario: Unrelated indexed projects exist
- **WHEN** Codebase Memory contains projects that are absent from the selected registry groups
- **THEN** discovery SHALL NOT query or disclose those project identities
- **AND** `list_projects` output SHALL NOT be used as an implicit peer-project allowlist.

### Requirement: Capability records remain concise, strict, and navigational

Each owned capability record SHALL contain a unique capability ID, owning logical project ID, enumerated kind, bounded summary and keywords, one or more contained relative entrypoints, declared effects and constraints, enumerated maturity, evidence references, and active or deprecated status. External adopted-library records SHALL additionally identify ecosystem, package, and accepted version range.

Supported maturity SHALL be `local-reusable`, `portable-proven`, or `adopted-external`. Only `portable-proven` SHALL represent successful representative use in an unrelated disposable or real project. Registry evidence and entrypoints SHALL be navigation facts and SHALL NOT be executed or treated as current compatibility proof.

#### Scenario: Relative entrypoint escapes the bound project
- **WHEN** a capability entrypoint is absolute, contains parent traversal, or resolves outside its owning bound project root
- **THEN** registry validation SHALL fail and name the logical capability and invalid field
- **AND** query and synchronization SHALL NOT expose the entry as usable.

#### Scenario: Local reusable capability lacks portability proof
- **WHEN** a shared local owner has two current consumers but no representative unrelated-project proof
- **THEN** it SHALL be registerable as `local-reusable`
- **AND** it SHALL NOT be described as portable or cross-project proven.

#### Scenario: External search result was rejected
- **WHEN** public ecosystem research considers but does not adopt a package
- **THEN** the rejected package SHALL NOT be added to the central registry
- **AND** only its material rejection reason MAY remain in the compact task disposition.

### Requirement: Query output is deterministic, bounded, and context-efficient

Registry query SHALL validate registry/config/cache identity, intersect allowed groups, match all normalized request terms against capability ID, summary, and keywords without fuzzy or model-like scoring, and sort results by stable capability ID. The default result limit SHALL be 10 and the implementation SHALL enforce a finite maximum.

The result SHALL report total matches and `hasMore` when truncated. It SHALL return schema-defined capability data, logical ownership, binding state, registry identity/hash, and verification hints only. Absolute roots SHALL remain redacted unless the caller explicitly requests local diagnostics.

#### Scenario: More capabilities match than the result limit
- **WHEN** a valid query has more matches than its effective limit
- **THEN** the client SHALL return the stable first bounded set with exact total and `hasMore: true`
- **AND** it SHALL require a narrower or paginated query rather than silently claiming complete results.

#### Scenario: Registry text contains instruction-like content
- **WHEN** a valid string field contains command-like or prompt-like text
- **THEN** the client SHALL return it only in the field's bounded data position
- **AND** neither the client nor workflow SHALL execute it or treat it as agent authority.

### Requirement: Selected registry candidates require current source verification

A query match SHALL be a discovery candidate only. Before selecting it, the workflow SHALL verify the explicit machine binding, contained entrypoint, named symbol or command, actual inputs/outputs/effects/constraints, and relevant proof evidence in the current source. Missing, mismatched, contradictory, unreadable, or stale evidence SHALL prevent a reuse claim.

Codebase Memory SHALL be used only with the exact project identity from the selected machine binding and only as source navigation. If that index is unavailable or stale, targeted file/source inspection SHALL remain the source of truth.

#### Scenario: Registered symbol no longer exists
- **WHEN** the project binding is valid but the registered path or symbol is absent from current source
- **THEN** verification SHALL mark the candidate stale with the missing fact
- **AND** the workflow SHALL NOT select it as compatible or silently continue as though the query had no diagnostic.

#### Scenario: Codebase Memory project is unavailable
- **WHEN** the selected capability has readable bound source but its bound Codebase Memory project cannot be queried
- **THEN** the workflow SHALL verify through targeted source reads
- **AND** it SHALL report the index limitation without querying other indexed projects.

### Requirement: Capability-level registration excludes speculative modules

New custom code SHALL qualify for registry registration only when it exposes a stable shared/public or standalone tool boundary, has at least two current consumers, or has representative unrelated-project proof. Private one-use helpers, generated/vendor code, one-off glue, and hypothetical interfaces or extension points SHALL be `not-applicable`.

Custom production code SHALL remain the smallest concrete owner sufficient for current requirements. Registration SHALL NOT require adding configurability, generic types, factories, plugins, wrappers, or compatibility paths not needed by current consumers or proof.

#### Scenario: One-use helper has no independent boundary
- **WHEN** a new helper serves one cohesive owner and has no standalone tool contract or unrelated-project proof
- **THEN** registry impact SHALL be `not-applicable` with a brief reason
- **AND** the workflow SHALL NOT generalize it solely to qualify for registration.

#### Scenario: Standalone proof runner has an explicit reusable contract
- **WHEN** a proof runner has explicit inputs, modes, effects, cleanup, evidence output, and an independently invocable boundary
- **THEN** it SHALL be eligible for capability registration even with one current project caller
- **AND** its maturity SHALL remain `local-reusable` until unrelated-project proof exists.

### Requirement: Pending registration is durable but not discoverable

Every qualifying new owned capability or newly adopted external library SHALL end with registry impact `synced` or `pending`. When the active registry is writable and valid, local synchronization SHALL add or update only a non-conflicting intended record and rebuild/validate the derived index. When synchronization is unavailable, enqueue SHALL atomically preserve a schema-valid candidate in the configured private outbox.

Pending state SHALL be reported by registry status, the triggered workflow, and the task handoff. A pending entry SHALL NOT appear in registry query results or be represented as centrally discoverable. Synchronization SHALL preserve every conflicting or failed pending item and SHALL NOT commit, push, publish, or mutate a remote.

#### Scenario: Registry is unavailable after capability proof
- **WHEN** a qualifying capability is complete but the configured registry root cannot be read or written
- **THEN** enqueue SHALL preserve a private schema-valid pending candidate and report its stable ID
- **AND** product-code completion SHALL not be blocked solely by the unavailable registry.

#### Scenario: Synchronization conflicts with an existing record
- **WHEN** a pending record has the same identity as a non-equivalent central record
- **THEN** synchronization SHALL fail with `conflict`, leave the pending record intact, and leave the central record unchanged
- **AND** it SHALL not guess a merge or overwrite policy.

#### Scenario: Synchronization succeeds locally
- **WHEN** a pending record is non-conflicting, the configured registry is writable, the derived index rebuilds, and complete registry validation passes
- **THEN** synchronization SHALL mark the candidate `synced` and remove it from pending discovery status
- **AND** it SHALL perform no Git commit, push, package publication, or other remote effect.

### Requirement: Registry unavailability produces explicit degraded discovery

A validated cache SHALL be usable only when its registry identity and schema match the active private config. Registry age SHALL be reported as fact and SHALL NOT be converted into a hidden expiry heuristic. If the registry is unavailable, a matching validated cache SHALL be identified as `source: cache`.

If neither registry nor matching cache is usable, triggered discovery SHALL report the cross-project layer as degraded, continue with current repository, platform/installed dependencies, and applicable public ecosystem research, and build only a minimal concrete owner when needed. The workflow SHALL NOT claim complete peer-project search, reusable status, or portability until current registry verification occurs.

#### Scenario: Registry and matching cache are unavailable
- **WHEN** triggered discovery cannot read the configured registry and has no schema-valid identity-matching cache
- **THEN** it SHALL record the cross-project layer as blocked and continue through the remaining safe sources
- **AND** any resulting custom implementation SHALL remain unregistered and non-portable until a later query and registration disposition.

#### Scenario: Cache belongs to another registry
- **WHEN** the available cache has a different registry logical identity or incompatible schema version
- **THEN** the client SHALL reject it with an identity diagnostic
- **AND** it SHALL follow no-cache degraded behavior.

### Requirement: The kit ships a template without activating an owner registry

The kit SHALL provide a project-neutral registry template, schemas, client contract, and disposable proof fixtures. Repository implementation and validation SHALL NOT instantiate, populate, commit, push, publish, or select the owner's actual private registry or project groups.

#### Scenario: Disposable registry proof completes
- **WHEN** implementation proof exercises a generated registry from the shipped template
- **THEN** it SHALL use disposable non-sensitive project identities and remove or preserve cleanup diagnostics according to proof policy
- **AND** no owner registry path, private project inventory, credential, or remote state SHALL be created or changed.

### Requirement: Users initiate inventory with one free-form command request

The kit SHALL expose a reusable OpenCode `/reuse-inventory` command whose input is one free-form natural-language request rather than user-facing positional or flag syntax. The command SHALL resolve only the registry, projects, group, and operation named in the request or already present in the active private config. It SHALL convert those facts into an explicit machine-readable plan for the deterministic core.

Before mutation, the command SHALL show a concise resolved preview containing logical registry/project/group IDs, local target refs/commits, planned `initial | incremental | no-op | full-fallback` mode, and intended local write roots. It SHALL continue autonomously when resolution is exact and safe. If registry, project, group, or ref identity is materially ambiguous, it SHALL ask one precise question and SHALL NOT guess or enumerate unrelated local projects.

If the request supplies only a Git URL for a registry with no configured local checkout, the command SHALL ask for an existing local path. It SHALL NOT clone, fetch, pull, commit, push, or create a remote repository.

#### Scenario: Simple prompt resolves exactly
- **WHEN** the user asks `/reuse-inventory` to inventory two uniquely configured named projects into one uniquely configured local registry group
- **THEN** the command SHALL display the two logical project IDs, selected local refs/commits, group, registry identity, planned writes, and scan modes
- **AND** it SHALL invoke the deterministic plan without requiring the user to construct or approve CLI flags.

#### Scenario: Project name is ambiguous
- **WHEN** a free-form request names a project that resolves to more than one allowed local binding
- **THEN** the command SHALL ask one question containing only the real matching alternatives and consequences
- **AND** it SHALL perform no scan or registry write until one exact binding is selected.

#### Scenario: Registry URL lacks a local checkout
- **WHEN** the request identifies the registry only by Git URL and no existing local checkout is configured
- **THEN** the command SHALL request one local checkout path
- **AND** it SHALL perform no clone, fetch, pull, commit, push, or implicit destination selection.

### Requirement: Initial bootstrap creates generated structure and architecture knowledge

For each explicitly selected local Git project, initial bootstrap SHALL scan one exact committed tree and produce one generated project record. The record SHALL include logical/repository/commit identity; language, build, workspace, and package roots; public exports and code entrypoints; executable commands and standalone tools/runners; explicit services/routes where supported by deterministic source evidence; declared dependencies; docs, specs, tests, and proof/evidence paths; optional exact-project Codebase Memory hints; and untrusted capability candidates with source evidence.

Generated facts and candidates SHALL remain separate from curated capability records. Bootstrap SHALL NOT assign trusted maturity, infer undocumented business semantics, merge similar candidates across projects, or represent a discovered item as recommended reuse. Registry query SHALL distinguish curated results from an explicitly requested bounded generated-candidate view.

#### Scenario: Empty registry bootstraps two projects
- **WHEN** a valid command plan selects two allowlisted local Git projects and an empty valid registry group
- **THEN** bootstrap SHALL create or replace one validated generated project record per project and update project/group/index facts
- **AND** curated capability files SHALL remain unchanged until source-verified candidates are enqueued and synchronized.

#### Scenario: Deterministic entrypoint is discovered
- **WHEN** a selected committed tree declares a public export, CLI command, standalone runner, or explicit service route supported by the scanner
- **THEN** the generated inventory SHALL identify its project, relative path, symbol or command, owner/package scope, and source evidence
- **AND** the generated candidate SHALL remain untrusted until agent verification.

#### Scenario: Codebase Memory is unavailable
- **WHEN** a target project has no usable exact-identity Codebase Memory index
- **THEN** bootstrap SHALL complete from committed source/manifests with an explicit enrichment limitation
- **AND** it SHALL NOT query another indexed project or fail solely because optional graph enrichment is absent.

### Requirement: Project inventory refreshes from the last successful Git commit

Each generated project record SHALL atomically contain its complete current inventory/candidates and scan state: exact `scanRef`, full `lastSuccessfulCommit`, full tree identity, scanner version, schema version, scan-policy hash, and scan mode. Bootstrap and rescan SHALL inspect the exact committed tree of the saved local ref and SHALL exclude dirty and untracked working-tree bytes.

When the prior commit equals the current local ref tip and scanner/schema/policy identity is unchanged, rescan SHALL return `no-op`. When the prior commit is an ancestor, rescan SHALL use aggregate rename-aware Git changes from prior to current and rebuild changed/added/renamed/deleted file facts plus the smallest safely determined owning package/module scope. Manifest changes or unknown impact SHALL broaden to a workspace/project scan with an explicit reason.

When ancestry cannot be established because the prior commit is missing/non-ancestor, or scanner/schema/policy identity changed, rescan SHALL perform and report a complete `full-fallback`. It SHALL not process each intermediate commit merely to reconstruct current inventory.

The complete next generated project record and derived index SHALL validate before the prior project file is atomically replaced. `lastSuccessfulCommit` SHALL advance only with that successful replacement. Any scan, write, validation, or cleanup failure SHALL preserve the prior active record/checkpoint and expose recovery diagnostics.

#### Scenario: Target ref did not change
- **WHEN** the saved full commit equals the current local tip and scanner, schema, and policy identities match
- **THEN** rescan SHALL report `no-op` without rereading unchanged source content
- **AND** the generated project file and checkpoint SHALL remain byte-identical.

#### Scenario: New commits have rename-aware changes
- **WHEN** the saved commit is an ancestor of the current tip and aggregate Git diff reports added, changed, renamed, and deleted paths
- **THEN** rescan SHALL update those facts and every deterministically affected owner/package scope
- **AND** untouched safely isolated package facts SHALL remain unchanged without a full project scan.

#### Scenario: Workspace manifest changes
- **WHEN** an aggregate diff changes a workspace, package, build, export-map, or dependency manifest whose impact exceeds one safely known file owner
- **THEN** rescan SHALL broaden to the affected workspace or complete project and record the exact fallback scope/reason
- **AND** it SHALL not claim file-only incremental completeness.

#### Scenario: History was rewritten
- **WHEN** the saved commit is missing or not an ancestor of the current configured ref tip
- **THEN** rescan SHALL perform a complete project scan with `full-fallback` and the ancestry reason
- **AND** it SHALL not combine the old generated state with an unsupported delta.

#### Scenario: Incremental scan fails
- **WHEN** scanning, rebuilding, validation, atomic replacement, derived-index update, or cleanup fails before completion
- **THEN** the prior generated project record and `lastSuccessfulCommit` SHALL remain authoritative
- **AND** the failed current commit SHALL be retried on the next rescan rather than skipped.

#### Scenario: Dirty working tree differs from committed ref
- **WHEN** a target checkout has modified or untracked files while its configured committed ref is scanned
- **THEN** generated inventory SHALL reflect only the exact committed tree
- **AND** the active worktree bytes SHALL remain unread by the scanner and unchanged.

### Requirement: Source changes invalidate generated and curated knowledge proportionally

Deleted and renamed paths SHALL update generated facts and candidate status. A current change that intersects a curated entrypoint/evidence path or its deterministically known owner/package scope SHALL mark the curated capability `needs-review` in derived verification state without deleting or rewriting the curated record. Unknown ownership SHALL broaden invalidation rather than retaining a current claim.

Submodule Git links SHALL be recorded by commit and SHALL be scanned recursively only when the submodule is also an explicitly selected logical project.

#### Scenario: Curated entrypoint changed after verification
- **WHEN** incremental refresh detects a change or rename in a curated capability's entrypoint or owning package scope
- **THEN** the derived registry view SHALL mark that capability `needs-review` and link the changed commit/path evidence
- **AND** query SHALL require current source verification before reuse.

#### Scenario: Curated entrypoint was deleted
- **WHEN** incremental refresh detects deletion of a curated entrypoint
- **THEN** generated facts SHALL remove the entrypoint and derived verification SHALL mark the capability stale or `needs-review`
- **AND** the curated source record SHALL remain intact for explicit deprecation/replacement disposition.
