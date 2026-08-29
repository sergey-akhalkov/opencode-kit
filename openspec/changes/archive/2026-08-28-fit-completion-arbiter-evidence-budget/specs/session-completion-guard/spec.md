## ADDED Requirements

### Requirement: Provider-bound completion evidence fits the aggregate request budget
The completion guard SHALL derive one deterministic, versioned provider-bound representation from the correlated bounded session-delivery snapshot and SHALL measure the exact UTF-8 bytes sent to the hidden arbiter. For the reviewed long-root population, the complete request SHALL fit within the configured finite request limit without silently removing human authority, pending-question facts, current or unresolved todo facts, validation outcomes, descendant liveness, truncation records, or required claim-closure fields.

Repeated representations of the same fact MAY be replaced by one canonical fact plus stable relationship or membership refs only when the guard proves the represented values agree. Such normalization SHALL NOT convert omitted evidence, conflicting values, truncated critical evidence, assistant prose, or summaries into completion evidence.

#### Scenario: Reviewed long root reaches the arbiter
- **WHEN** a correlated root has the reviewed retained evidence cardinalities and four ordinary bounded claim records that previously produced a request above 200,000 bytes
- **THEN** the exact provider-bound request is no larger than the configured 200,000 byte limit
- **AND** one hidden tool-denied arbiter invocation receives all required authority, liveness, todo, validation, truncation, and claim-closure facts with their stable refs.

#### Scenario: Canonical relationships preserve repeated facts
- **WHEN** one todo appears in multiple current, open, unresolved, or historical views, or one validation summary exactly matches the retained output of its tool call
- **THEN** the provider-bound representation may encode the fact once with deterministic sorted memberships or refs
- **AND** readback reconstructs the same statuses, evidence text, truncation state, and relationships supplied by the bounded source snapshot.

#### Scenario: Canonical identity conflicts
- **WHEN** records that claim the same canonical event or call ref contain conflicting status, text, output, or truncation values
- **THEN** the guard persists a privacy-safe terminal input-state diagnostic
- **AND** it does not merge the conflict, create an arbiter child, invoke a model, inject a continuation, or produce a completion verdict.

#### Scenario: Required claim closure cannot fit
- **WHEN** the required claim identifier, class, outcome, population, coverage, path, environment, oracle, unresolved-observation, challenge, disposition, evidence-ref, and maximum-claim fields cannot fit within the configured request limit after lossless canonicalization
- **THEN** the guard retains terminal evidence-overflow behavior with observed and allowed bytes
- **AND** it does not remove another required closure field, create or retry an arbiter prompt, or infer a narrower claim without an explicit evidence record.

#### Scenario: Descendant liveness is incomplete
- **WHEN** the correlated session graph exceeds its bounded row or depth capability or otherwise omits descendants that can affect liveness
- **THEN** completion adjudication remains fail-closed before the arbiter request
- **AND** aggregate budgeting does not trade descendant completeness for a smaller prompt.

#### Scenario: Identical normalized input is byte-stable
- **WHEN** the same correlated bounded snapshot, fixed generation time, audit identity, revision, and strategy-journal facts are serialized twice
- **THEN** the provider-bound request bytes and contribution diagnostics are identical
- **AND** the measured request size equals the bytes passed to the provider boundary.

### Requirement: Arbiter budgeting is isolated from the public delivery-context contract
The completion guard SHALL keep its provider-bound normalization private to the hidden arbiter boundary. The public `session_delivery_context` tool SHALL retain its current schema, compatibility aliases, bounded surfaces, redaction, and truncation semantics, and ordinary roots below the request limit SHALL preserve existing completion verdict and continuation behavior.

#### Scenario: Public delivery context remains compatible
- **WHEN** the same session is read through the public `session_delivery_context` tool before and after this change
- **THEN** the public schema and existing bounded evidence fields remain available with their current meaning
- **AND** internal canonical memberships or output refs do not replace public fields.

#### Scenario: Ordinary root remains behaviorally unchanged
- **WHEN** a sub-limit grind-enabled root is evaluated by the baseline and candidate under the same actor, request, environment, and initial state
- **THEN** both paths produce schema-valid correlated verdicts with the same expected disposition, requirement statuses, claim matrix, tool restrictions, and root side-effect class
- **AND** the comparison does not claim equivalence outside the reviewed fixture and runtime identity.
