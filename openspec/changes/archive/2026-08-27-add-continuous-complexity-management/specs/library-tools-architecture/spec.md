## ADDED Requirements

### Requirement: Complexity foraging inventory reports facts without scoring

The library SHALL provide one portable complexity-foraging inventory that accepts an
explicit local project root, optional reviewed include/exclude scope, and JSON or
Markdown output. It SHALL emit a versioned stable schema containing privacy-safe root
identity, reviewed scope and exclusion reasons, source/test/component/manifest
candidates, architecture/documentation/entrypoint/proof candidates, generated/vendor/
evidence/corpus/unknown path counts, line/navigation facts, and original-cause
diagnostics for unreadable inputs. Candidate labels SHALL identify exact detection
evidence and SHALL NOT represent semantic ownership or correctness.

The inventory SHALL report `unknown`, `unreadable`, `unsupported`, or `blocked` when an
input cannot support a field. It SHALL NOT score, rank, summarize, infer architecture
quality, select an abstraction or split, infer project severity, or treat excluded paths
as absent. Its CLI, schema, scan policy, and tests SHALL remain distinct from project,
instruction, code-quality, and OpenSpec inventories while reusing proven traversal and
rendering primitives whose contracts match.

#### Scenario: Noisy evidence and corpus roots are explicitly scoped

- **WHEN** reviewed scope marks large evidence or corpus roots outside the maintained source hot path
- **THEN** inventory reports their path classes, reasons, and counts while excluding them from source/component candidates
- **AND** retains a note that the exclusion is not proof that no relevant evidence exists there.

#### Scenario: Default scan lacks ecosystem support

- **WHEN** a readable project uses manifests or entrypoint conventions outside the maintained detector set
- **THEN** inventory returns the readable generic facts and marks ecosystem-specific fields `unsupported` or `unknown`
- **AND** exits successfully only with an explicit partial-support status rather than a clean complete map.

#### Scenario: Root is unreadable

- **WHEN** the explicit target root does not exist or cannot be read
- **THEN** inventory exits non-zero with privacy-safe root identity and the original cause
- **AND** emits no partial successful architecture map.

#### Scenario: Nested path is unreadable

- **WHEN** traversal can read the root but one nested path fails with an access or IO cause
- **THEN** inventory preserves that path's privacy-safe identity and original cause, increments the unreadable facts, and reports partial support
- **AND** does not emit a clean complete-map status.

#### Scenario: Traversal reaches a bound or cancellation

- **WHEN** entry, aggregate-byte, wall-clock, or cancellation bounds stop traversal before the reviewed scope is complete
- **THEN** inventory reports `blocked`, preserves the reached counts and cause, and exits non-zero
- **AND** does not materialize a complete-map projection from the partial scan.

#### Scenario: Two designs fit the same facts

- **WHEN** inventory facts are consistent with both reshaping a current owner and extracting one facade
- **THEN** output preserves the same candidates and facts without ranking either design
- **AND** semantic workflow ownership remains with main and the triggered existing Practice Owner.

### Requirement: Complexity inventory is callable from the active kit source

The focused workflow SHALL invoke the maintained portable inventory from the explicitly
resolved active kit global source and SHALL NOT require the target project to copy a
package script or install a dependency. Effect-free help SHALL describe inputs, outputs,
scope/exclusion semantics, privacy, fallback states, and exit behavior. Repository
validation SHALL exercise the same entrypoint that installed instructions reference. The
helper SHALL be self-contained under `global/bin` or import only exact `global/bin`
dependencies shipped in the same selected profile; it SHALL NOT depend on repository-only
`tools` paths.

#### Scenario: Target project has no package manager script

- **WHEN** a readable local project has no `complexity:inventory` or compatible package script
- **THEN** the workflow invokes the helper from the verified active kit source with the target root as explicit input
- **AND** does not edit the target project merely to run inventory.

#### Scenario: Active helper cannot be resolved

- **WHEN** the configured global source is absent, colliding, or lacks the exact helper
- **THEN** the workflow reports the inventory lane unavailable and falls back to bounded manual foraging with a degraded evidence statement
- **AND** does not guess a repository parent or claim that the portable helper ran.
