## ADDED Requirements

### Requirement: Registry tooling uses a portable deterministic core

The reusable registry client SHALL use a project-neutral core with explicit resolved plan, config, registry, cache, outbox, and operation inputs. The core SHALL expose bootstrap, rescan, status, bounded query, validate, enqueue, and local sync behavior through stable machine-readable results. A thin kit adapter MAY resolve `OPENCODE_REUSE_CONFIG`, but natural-language interpretation, package managers, shells, maintainer paths, private project identities, Codebase Memory binaries, and repository-specific validation commands SHALL NOT be embedded in the deterministic core.

The client SHALL preserve original exception cause/stack at its owning CLI boundary, return stable statuses and non-zero exits for invalid, conflict, blocked, and cleanup-unknown outcomes, and redact absolute roots by default. It SHALL NOT install dependencies, execute registry-provided commands, initialize an owner registry, invoke Git remote operations, commit, push, or publish.

#### Scenario: Unrelated project invokes the core
- **WHEN** a disposable unrelated project provides explicit registry/config roots and argv without npm or this repository identity
- **THEN** the core SHALL complete the requested operation with the same schema and safety behavior
- **AND** only an optional thin project adapter SHALL contain project-specific invocation details.

#### Scenario: Registry field contains a command
- **WHEN** a capability record contains a valid command entrypoint or command-like text
- **THEN** query SHALL return it as bounded data only
- **AND** no client operation SHALL execute it during bootstrap, rescan, status, query, validation, enqueue, or sync.

### Requirement: Inventory scanner reads exact committed trees and bounded project structure

The deterministic scanner SHALL accept exact project root, logical identity, scan ref/commit, registry root, group, scanner/schema/policy identity, and operation mode through a resolved plan. It SHALL use Git tree/diff evidence as checkpoint truth and SHALL reuse existing portable process, safe-relative-path, temporary-worktree, and failure-atomic write owners where they fit.

The scanner SHALL inventory supported manifests, workspace/package roots, public exports/entrypoints, commands/tools/runners, explicit services/routes, dependencies, docs/specs/tests/proofs, and optional exact-project graph hints without executing target code or package scripts. Unsupported language/artifact classes SHALL be reported explicitly rather than inferred.

#### Scenario: Active checkout is dirty
- **WHEN** the target worktree contains tracked modifications and untracked files
- **THEN** the scanner SHALL materialize or inspect only the exact configured commit tree through an isolated read boundary
- **AND** it SHALL neither read candidate facts from nor modify the active dirty worktree.

#### Scenario: Target manifest is unsupported
- **WHEN** a selected committed tree contains an unsupported build or module format
- **THEN** the scanner SHALL retain project/path evidence and report that inventory class `unsupported`
- **AND** it SHALL not fabricate exports, dependencies, services, or capability candidates.

### Requirement: Incremental scan plans are deterministic and fail safely to broader scope

The scanner SHALL derive `no-op`, `incremental`, or `full-fallback` from full commit ancestry plus scanner/schema/policy identity. Incremental mode SHALL consume rename-aware aggregate name/status changes and SHALL rebuild each changed path plus deterministically affected package/module owners. Changes to ownership/build/workspace manifests or unknown impact SHALL broaden the scan to a recorded workspace/project boundary.

One canonical generated project file SHALL co-locate scan state, complete active inventory, and candidates. The implementation SHALL build and validate the complete next file before failure-atomic replacement and SHALL update the derived index only from validated canonical files. A failed operation SHALL not advance the checkpoint or leave a partial active inventory.

#### Scenario: Commit range is a valid fast-forward
- **WHEN** the prior full commit is an ancestor of the current configured ref tip and scanner/schema/policy identities match
- **THEN** the plan SHALL include the exact aggregate diff range, changed path statuses, affected owners/scopes, and incremental reason
- **AND** stable output SHALL not depend on filesystem enumeration order.

#### Scenario: Prior commit is non-ancestor
- **WHEN** Git cannot prove the prior checkpoint is an ancestor of the current tip
- **THEN** the plan SHALL select complete `full-fallback` with the ancestry diagnostic
- **AND** no prior generated facts SHALL be merged through an unsupported delta.

#### Scenario: Atomic replacement fails
- **WHEN** the next generated project file or derived index cannot be installed and validated atomically
- **THEN** the operation SHALL return non-zero with original cause/stack and recovery paths
- **AND** the prior generated project file and checkpoint SHALL remain active.

### Requirement: Free-form command orchestration stays outside the deterministic core

The reusable command prompt SHALL interpret `$ARGUMENTS`, resolve only named/configured registry/project/group/ref inputs, produce an explicit plan/preview, and invoke the core. The command SHALL ask for an existing local checkout path when only a Git URL is supplied and SHALL ask one exact question on ambiguity. It SHALL NOT hide inferred roots in a model-only call or pass unrestricted project inventories to the core.

#### Scenario: Command resolves a safe exact plan
- **WHEN** the free-form prompt and private config uniquely identify local registry, group, projects, and refs
- **THEN** orchestration SHALL provide the deterministic core an explicit schema-valid plan and continue without routine approval
- **AND** raw proof SHALL preserve both the user request and resolved plan with private paths redacted in shared output.

### Requirement: Registry validation and synchronization are atomic and fail closed

Validation SHALL check schema versions, unique logical IDs, project/group/capability references, contained normalized paths, bounded fields, maturity/status rules, deprecation replacements, external-package identity, and exact derivation of the generated index. Invalid source data SHALL not produce a successful query or overwrite a previously validated cache.

Enqueue and sync writes SHALL use atomic same-filesystem replacement inside explicitly configured private roots. Sync SHALL preserve pending state on conflict or failure, change only the intended central capability record and derived index, validate the complete resulting registry before success, and expose unknown cleanup or write state as non-zero. It SHALL not mutate producer source or unrelated registry files.

#### Scenario: Derived index differs from canonical data
- **WHEN** the generated index contains a missing, extra, or changed capability relative to canonical project/external files
- **THEN** validation SHALL fail with the affected stable capability ID
- **AND** query SHALL not treat the mismatched index as current registry evidence.

#### Scenario: Registry write fails after candidate staging
- **WHEN** local synchronization cannot atomically install or validate the complete intended registry state
- **THEN** it SHALL return non-zero, preserve the pending candidate, and report the exact affected paths in privacy-safe diagnostics
- **AND** it SHALL not mark the candidate synced.

### Requirement: Registry query output is bounded without hidden ranking

The query implementation SHALL normalize and match exact request terms, sort by stable capability ID, enforce a default limit of 10 and a finite configured maximum, and report total and `hasMore`. It SHALL not use fuzzy scoring, semantic inference, model calls, nondeterministic ordering, or an unbounded fallback.

#### Scenario: Broad query exceeds the maximum
- **WHEN** a caller requests a limit above the configured maximum
- **THEN** the client SHALL reject the value or apply the documented maximum with an explicit diagnostic
- **AND** it SHALL not emit an unbounded capability set.

### Requirement: Proof tooling exercises the real local client boundary

Before new proof code is created, implementation SHALL inventory existing project proof runners and reuse or extend a fitting owner. The retained proof tooling SHALL create disposable non-sensitive registry, producer, and consumer Git repositories; invoke the actual portable client; capture exact stdout, stderr, exit status, file effects and hashes, environment/candidate identity, and cleanup; and document its invocation and limits in the project-native proof inventory.

The runner SHALL cover valid query, group isolation, root redaction, stale binding/entrypoint, invalid schema, cache identity mismatch, unavailable registry/cache, enqueue, conflict-preserving sync, successful local sync, and no remote effect. It SHALL not create or populate the owner's real registry.

#### Scenario: Disposable integration proof completes
- **WHEN** the proof runner exercises query and outbox sync through the actual CLI in unrelated disposable repositories
- **THEN** the raw evidence SHALL show exact operations, bounded output, intended local file effects, zero remote effects, and deterministic cleanup
- **AND** compilation or isolated helper tests alone SHALL not satisfy the proof.
