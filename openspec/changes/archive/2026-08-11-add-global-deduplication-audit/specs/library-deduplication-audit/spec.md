## ADDED Requirements

### Requirement: Global scoped deduplication entrypoint
The kit SHALL expose `/dedup <scope>` through the configured global OpenCode source and SHALL lazy-load `deduplication-audit` only for explicit command or scoped duplication-audit intent. The command SHALL remain read-only and SHALL NOT route automatically into `codebase-audit-loop`.

#### Scenario: User invokes a bounded audit
- **WHEN** the user invokes `/dedup src/parsers`
- **THEN** the command loads `deduplication-audit` and limits discovery and evidence enrichment to that repository-contained scope
- **AND** it does not edit production or start an exhaustive audit.

#### Scenario: Trivial local fix has no dedup ceremony
- **WHEN** the user requests a trivial owner-local fix without deduplication or clone-audit intent
- **THEN** the deduplication skill, `jscpd`, and code-quality reviewer SHALL NOT be invoked solely because code is being edited.

### Requirement: jscpd is candidate evidence only
The workflow SHALL use machine-installed `jscpd` v5 for exact and near textual clone candidate discovery. It SHALL NOT treat a clone report, similarity, duplicate count, or successful process exit as proof of semantic equivalence, safe deletion, or safe extraction.

#### Scenario: Near clone has different effects
- **WHEN** `jscpd` reports two similar blocks but source evidence shows different errors, effects, lifecycle, or compatibility behavior
- **THEN** the workflow SHALL classify them as `keep separate by design` or `not proven`
- **AND** it SHALL NOT recommend merge solely from textual similarity.

#### Scenario: Scan fails
- **WHEN** `jscpd` exits non-zero or the requested scope cannot be read
- **THEN** the workflow SHALL report the exact failed tool layer and diagnostics
- **AND** it SHALL NOT report that no duplicates exist.

### Requirement: Scan boundaries and exclusions are safe
The workflow SHALL resolve one explicit scope inside the current repository, preserve `jscpd` default `.gitignore` behavior, and exclude generated, vendor, build, cache, coverage, output, and dependency directories. It SHALL NOT write a target repository config, report, dependency, or source file during the audit.

#### Scenario: Ignored dependency clone exists
- **WHEN** a matching block exists only under an ignored dependency or generated directory
- **THEN** the bounded scan SHALL exclude it from the material candidate set
- **AND** the audit SHALL record the exclusion policy.

#### Scenario: Scope escapes the repository
- **WHEN** the supplied scope resolves outside the current repository without separate explicit authorization
- **THEN** the audit SHALL stop with an actionable scope diagnostic
- **AND** it SHALL not scan the external path.

### Requirement: Material candidates receive semantic repository evidence
For every material clone candidate, the workflow SHALL inspect locations, symbols, owning modules, callers/importers, tests, fixtures, compatibility contracts, input/output contract, errors, effects, mutation or I/O, timing/concurrency/cleanup where reachable, and activation/lifecycle differences. Missing evidence SHALL remain explicit and SHALL NOT be inferred.

#### Scenario: Existing canonical owner is found
- **WHEN** one candidate is already the canonical implementation used by current callers and its contract covers the duplicate
- **THEN** the audit SHALL name that canonical owner and affected callers
- **AND** it MAY recommend `reuse` only with the required caller-level Runtime Proof.

#### Scenario: Evidence cannot prove ownership
- **WHEN** symbol, caller, or test evidence cannot establish a canonical owner or compatible contract
- **THEN** the candidate SHALL be classified `not proven`
- **AND** no production change SHALL be recommended as safe.

### Requirement: Classification and reduction output are explicit
Each material candidate SHALL use one classification from `exact duplicate`, `near duplicate`, `overlapping responsibility`, `redundant wrapper`, `keep separate by design`, or `not proven`. Each row SHALL include locations, canonical owner or `unknown`, contract/error/effect/lifecycle differences, retained test oracles, one recommendation from `remove | reuse | extract | parameterize | keep separate`, estimated net line and concept delta, coupling effect, confidence, and required Runtime Proof.

#### Scenario: Redundant wrapper has no unique behavior
- **WHEN** a wrapper only forwards to an existing owner and caller/test evidence shows no unique contract, error, effect, lifecycle, or compatibility behavior
- **THEN** it MAY be classified `redundant wrapper` with `remove` or `reuse`
- **AND** the row SHALL name every retained oracle and required caller proof.

#### Scenario: Extraction adds a new concept
- **WHEN** a proposed shared helper would add a public abstraction, parameter matrix, or coupling without removing more current concepts
- **THEN** the workflow SHALL recommend `keep separate`
- **AND** it SHALL NOT recommend `extract` or `parameterize` for line-count reduction alone.

### Requirement: Unique critical and compatibility oracles are retained
The workflow SHALL retain every unique critical or compatibility test oracle. A test SHALL be proposed for deletion only when named retained evidence proves the same externally meaningful oracle without losing regression or compatibility signal.

#### Scenario: Duplicate implementation has a unique compatibility test
- **WHEN** two implementations appear equivalent but one test uniquely covers a shipped compatibility behavior
- **THEN** the audit SHALL list that test under retained oracles
- **AND** no recommendation SHALL delete that oracle.

### Requirement: Existing reviewer is reused without mutation authority
For material candidates, main MAY use the existing `code-quality-reviewer` for an independent read-only reduction matrix and SHALL NOT create a `deduplicator` agent. Reviewer evidence SHALL NOT authorize production changes, and no-match audits SHALL NOT require a reviewer launch.

#### Scenario: Material exact clone is enriched
- **WHEN** main has exact source/test locations and a material reduction candidate
- **THEN** it may dispatch `code-quality-reviewer` with the current candidate reference
- **AND** main remains responsible for classification, reproduction, and any later implementation decision.

### Requirement: Later production reduction is main-owned and separately proved
The audit SHALL NOT edit production. Any accepted reduction SHALL be implemented later by main as the smallest complete slice and SHALL preserve named critical/compatibility oracles and prove affected caller-visible contract, errors, effects, and lifecycle at a representative runtime boundary.

#### Scenario: User chooses a reported reduction
- **WHEN** the user or accepted task later authorizes one reported reduction
- **THEN** main SHALL implement only that bounded slice and run its required Runtime Proof
- **AND** clone disappearance alone SHALL not establish completion.

### Requirement: Machine-global CLI is pinned and upstream skills remain absent
This machine SHALL install `jscpd@5.0.14` with npm global installation and SHALL expose `jscpd --version` as `5.0.14`. The repository SHALL NOT add `jscpd` to package manifests or lockfiles, and the upstream `jscpd` and `dry-refactoring` skills SHALL remain uninstalled.

#### Scenario: Installation is verified
- **WHEN** host installation completes
- **THEN** `jscpd --version` SHALL report `5.0.14`
- **AND** global package inventory SHALL identify `jscpd@5.0.14` without a repository dependency change.

#### Scenario: Global skill inventory is inspected
- **WHEN** kit and host-default global skill sources are checked
- **THEN** `deduplication-audit` SHALL be present in the kit global source
- **AND** upstream skills named `jscpd` and `dry-refactoring` SHALL be absent.

### Requirement: Real scan proof is bounded and read-only
Qualification SHALL include one disposable fixture scan and one bounded repository scan through the installed CLI. Evidence SHALL record invocation, version, scope, exclusions, exit status, stdout/stderr, source status or hashes, and cleanup; the scans SHALL not mutate target source.

#### Scenario: Disposable fixture contains a controlled clone
- **WHEN** two fixture files contain the controlled matching block
- **THEN** the real CLI SHALL report both locations
- **AND** fixture source hashes SHALL remain unchanged before cleanup.

#### Scenario: Repository scan is bounded
- **WHEN** the current repository is scanned at an explicitly selected bounded source scope
- **THEN** the command SHALL terminate with recorded diagnostics and exclusions
- **AND** no ignored dependency, generated, vendor, or build path SHALL be treated as a material candidate.
