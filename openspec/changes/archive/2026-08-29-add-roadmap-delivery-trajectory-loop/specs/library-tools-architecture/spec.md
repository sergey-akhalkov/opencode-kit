## ADDED Requirements

### Requirement: Trajectory context SHALL have one portable fact owner

The kit SHALL provide one portable trajectory-context core and CLI at the active global
source. It SHALL accept explicit root, horizon id, current successful archive id,
output format, archive-count, aggregate-byte, and timeout arguments; read only the
versioned horizon plus bounded linked archived planning/evidence metadata; and emit one
stable schema with privacy-safe root identity, exact paths, digests, sizes, support
states, and cause-preserving diagnostics. The repository command, if any, SHALL remain a
thin adapter over that core.

The owner SHALL use bounded regular-file reads, path containment, stable ordering, and
explicit cancellation. It SHALL perform no source, Git, OpenSpec, archive, horizon,
receipt, or evidence mutation. Help SHALL be effect-free outside a repository.

#### Scenario: Global helper runs in a consumer project

- **WHEN** the exact active global helper receives a valid consumer root, horizon, and
  successful archive under its limits
- **THEN** it returns normalized linked facts without requiring a consumer package
  script or repository-local copy
- **AND** output contains no absolute private root, source payload, untracked content,
  credential, provider call, or write effect.

#### Scenario: Archive window exceeds a bound

- **WHEN** linked archive count, input bytes, elapsed collection time, or one required
  file exceeds the explicit maintained bound
- **THEN** collection exits blocked with the exact exceeded boundary and original cause
- **AND** it does not silently truncate acceptance-critical context or emit a complete
  projection.

### Requirement: Deterministic trajectory tooling SHALL not infer effectiveness

Trajectory schemas, parsers, validators, receipt materializers, and proof evaluators MAY
validate explicit fields, ids, enums, ordering, bounds, references, digests, candidate
correlation, and exact reviewed fixture expectations. They SHALL NOT infer semantic
progress, roadmap membership, trigger class, cost dominance, forecast, strategy value,
N/K equivalence, quality sufficiency, owner authority, or successor scope from text,
counts, timestamps, diffs, or model output.

Unsupported or incomplete semantic fields SHALL remain `unknown`, `missing`,
`unreadable`, `unsupported`, or `blocked`. The reviewed main-owned signal and review
receipt SHALL remain the semantic source; deterministic readback cannot promote its
claim or authorize mutation.

#### Scenario: Archive count is high but semantics are absent

- **WHEN** facts show many linked archives but no reviewed outcome delta, repeated-owner
  relation, forecast conflict, or bottleneck evidence
- **THEN** deterministic tooling reports the archive facts only
- **AND** it does not classify the horizon slow, trigger review, or select batching.

#### Scenario: Reviewed receipt is malformed

- **WHEN** a receipt lacks exact horizon/context/trigger correlation, disposition,
  evidence references, or retry condition
- **THEN** readback rejects the receipt for current duplicate suppression
- **AND** it does not repair semantic content or infer which disposition was intended.

### Requirement: Trajectory behavior SHALL reuse the maintained consumer proof family

Configured trajectory behavior SHALL extend the maintained consumer-outcome fixture,
capture, replay, and evaluator family with one reviewed partition pack. The pack SHALL
preserve identical baseline/candidate model, profile, permissions, environment,
accepted outcome, archive state, and fixture inputs and SHALL retain raw samples,
candidate/source identities, tool/effect records, diagnostics, and cleanup.

The extension SHALL not add a second configured-session runner, evaluator framework,
or semantic classifier. Deterministic evaluation SHALL check exact reviewed outcome and
safety oracles before reporting any friction difference.

#### Scenario: Trajectory pack uses existing capture ownership

- **WHEN** provider-free preflight selects the reviewed trajectory partitions
- **THEN** the existing capture/evaluator path owns configured sessions, immutable
  bundles, replay, and cleanup
- **AND** no parallel runner or manually correlated result format is introduced.
