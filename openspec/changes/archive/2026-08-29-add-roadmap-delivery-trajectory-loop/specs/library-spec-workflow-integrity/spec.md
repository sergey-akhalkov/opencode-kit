## ADDED Requirements

### Requirement: OpenSpec changes SHALL link delivery horizons explicitly

The proposal workflow SHALL require one exact `Delivery Horizon` declaration for newly
authored changes: a valid project-contained horizon id, or `none` with a concrete reason.
Deterministic checks SHALL validate only declaration shape, horizon existence, exact id,
and contained schema references. They SHALL NOT infer roadmap membership, materiality,
progress, forecast, or trigger state from proposal prose, tasks, changed files, or
capability names. Legacy active and archived changes SHALL remain readable without
retroactive linkage.

#### Scenario: Unrelated ordinary change declares none

- **WHEN** a new change is not an implementation or evidence slice for an explicit
  project Delivery Horizon
- **THEN** its proposal declares `Delivery Horizon: none` with the reason
- **AND** proposal/apply/archive remain proportional without a trajectory signal or
  invented project-level association.

#### Scenario: Link names an unknown horizon

- **WHEN** a new proposal declares a horizon id absent from the explicit project record
- **THEN** proposal readiness reports the exact missing horizon before implementation
- **AND** the gate does not create, select, or infer a replacement horizon.

### Requirement: Complete archive SHALL remain independent of trajectory review

The canonical complete-archive path SHALL finish accepted completion, official spec
merge/movement, and post-archive validation before any delivery-trajectory signal. A
successful archive result SHALL remain successful when the later signal is `none`,
`review-required`, `unknown`, unavailable, or fails. Trajectory work SHALL NOT become an
unchecked task, claim-closure member, automation-dividend substitute, final-history
analysis, or additional complete-archive gate for the archived change.

After success, the archive workflow SHALL route a horizon-linked archive to the compact
signal and SHALL report signal state separately from archive state. An unlinked archive
SHALL report trajectory `not-applicable` without semantic inference. Failed archive or
post-validation SHALL retain ordinary archive failure and SHALL NOT emit a success-based
trajectory signal.

#### Scenario: Archive succeeds and deep review is required

- **WHEN** every product/archive gate succeeds and the post-archive signal later reports
  `review-required`
- **THEN** the operation remains `archived` and the review is future-horizon planning
- **AND** no archived artifact or completion result is rewritten or downgraded.

#### Scenario: Archive itself fails

- **WHEN** completion, official archive, or post-archive validation exits non-zero
- **THEN** ordinary archive diagnostics and state remain controlling
- **AND** no trajectory signal represents the change as successfully archived.

### Requirement: Horizon-dependent propose and apply SHALL consume current trajectory disposition

Before substantial work for a horizon-linked proposal, the propose/apply workflow SHALL
evaluate the latest successful linked archive and consume a matching current review
receipt when its semantic signal is `review-required`. This check SHALL be scoped to the
same horizon and dependency path. It SHALL permit unrelated or evidence-only work and
SHALL NOT infer a no-trigger result from missing evidence.

#### Scenario: Current receipt permits the successor

- **WHEN** the latest context and trigger tuple matches a terminal receipt that names the
  current outcome-preserving successor
- **THEN** ordinary propose/apply work may continue for that successor
- **AND** all existing artifact, proof, safety, validation, and owner-boundary gates still
  apply independently.

#### Scenario: Decision evidence changed after the receipt

- **WHEN** reviewed horizon intent or decision-material trigger evidence changes the
  receipt tuple before dependent implementation
- **THEN** the old receipt remains historical for the changed evidence and main first
  recomputes the compact signal
- **AND** main performs another deep review only for a materially distinct current trigger
  or when the changed evidence satisfies the prior receipt's retry condition; changed
  archive identity or other non-key operational metadata alone does not invalidate it.
