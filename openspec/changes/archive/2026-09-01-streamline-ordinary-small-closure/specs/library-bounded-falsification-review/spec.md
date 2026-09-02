## MODIFIED Requirements

### Requirement: Review state remains candidate-correlated and structurally honest

A durable project-native falsification record SHALL identify the original-request reference, candidate reference, reviewer identity and effective model, challenge count, attempted attack classes, material rows or `no-material-finding`, main dispositions, correction invalidation, exact terminal reason, and unresolved evidence. OpenSpec changes that require the review SHALL keep the record with the active change. A full or legacy-strict change using a reviewed exemption SHALL record the exemption reason without a synthetic review report. A valid compact change with current `ordinary-small-exact` disposition and no decision-material surface SHALL treat review as not applicable: it SHALL omit both the bounded-falsification declaration and reviewer artifact rather than manufacture an exemption record.

Deterministic helpers MAY validate explicit schema, identities, counts, ordering, freshness, and terminal states. They SHALL return `unknown` for unsupported semantics and SHALL NOT decide whether review was required, whether a finding is material, whether an exact compact omission is semantically justified, whether the review was intellectually sufficient, or whether the candidate solves the task.

#### Scenario: Candidate changes after review

- **WHEN** an artifact mutation changes a challenged outcome, envelope, invariant, proof boundary, user-owned decision, or material-risk surface
- **THEN** the prior terminal record becomes stale for that surface
- **AND** main uses the remaining episode budget or exact focused evidence rather than representing the stale review as current.

#### Scenario: Structural validation passes without semantic evidence

- **WHEN** a record has every required field but no configured review observation or main disposition evidence
- **THEN** deterministic validation reports only structural validity
- **AND** semantic falsification readiness remains `unknown`.

#### Scenario: Compact exact review is not applicable

- **WHEN** a compact proposal has current `riskDisposition.kind: ordinary-small-exact`, no decision-material surface, and passing structural checks
- **THEN** it contains neither an exemption declaration nor `falsification-review.md`
- **AND** normal runtime proof, validation, safety, dependency, and Practice Owner routes remain required.
