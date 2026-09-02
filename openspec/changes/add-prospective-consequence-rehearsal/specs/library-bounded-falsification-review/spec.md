## MODIFIED Requirements

### Requirement: Fresh challenge receives independent task and candidate inputs

A required falsification episode SHALL use one fresh read-only reviewer that authored neither the candidate nor prior challenge evidence. Main SHALL semantically determine whether the current decision surface has distinction pressure: a representation, identity, occurrence, actor, state, lifecycle, ownership, recovery, or proof-boundary choice can make observably different downstream outcomes appear equivalent. Deterministic tooling SHALL NOT infer distinction pressure from keywords, counts, paths, or model output.

When distinction pressure is present for a newly authored candidate, the challenge SHALL use a pre-authoring-separated reconstruct-then-compare protocol. Before any proposal, design, specification, task plan, inline decision frame, or candidate source mutation is created, main SHALL launch the first reviewer task with the original accepted request and success boundary, enforced operating envelope, non-goals, non-deferrable invariants, exact review boundary, and the smallest current raw system/consumer evidence needed to reconstruct actors, state, lifecycle, ownership, recovery, observability, and evidence gaps. Candidate bytes, an author-named represented risk, a corrected answer, and a mechanism-revealing candidate summary SHALL be absent from its prompt, filesystem scope, and tool results because the candidate does not yet exist. The reviewer SHALL return a bounded context reconstruction with a privacy-safe reference and explicit unsupported facts.

Only after the reconstruction returns SHALL main create the first candidate, then resume the exact correlated reviewer child with the candidate reference and bytes. The resumed comparison SHALL record the effective model and inspected candidate identity and SHALL compare the candidate against the prior reconstruction. If the runtime cannot resume the exact child or the child/session identity is unavailable, stale, or unverified, main SHALL preserve the challenge as `unknown`; it SHALL NOT substitute a candidate-visible fresh prompt and call it separated. A candidate that already existed before reconstruction SHALL use `single-stage` evidence and SHALL NOT be relabeled pre-authoring-separated.

When current evidence has no distinction pressure, the existing single-stage original-request-grounded challenge MAY remain in use. The pre-implementation challenger SHALL remain `implementation-readiness-reviewer`. A Material request without a formal planning artifact SHALL first receive the smallest project-native or session-local decision frame needed to carry the original request, decision surface, envelope, proof boundary, and failure hypotheses into the same early challenge. `final-candidate-reviewer` SHALL retain its optional post-proof concrete-risk boundary and SHALL NOT become a mandatory fallback. Exact Practice Owners SHALL retain their current triggers and boundaries; this contract SHALL NOT create a universal reviewer or central review router.

#### Scenario: Candidate restates the wrong problem coherently

- **WHEN** the candidate is internally consistent but differs materially from the independently supplied original request
- **THEN** the fresh reviewer assesses the mismatch against the original request rather than treating candidate consistency as task-fit evidence.

#### Scenario: Raw evidence contains a consequential distinction before authoring

- **WHEN** current source or system evidence shows two actors, states, occurrences, lifecycle positions, owners, recovery paths, or proof outcomes that a decision could make equivalent
- **THEN** the first reviewer task reconstructs those facts before any current candidate artifact or source mutation exists
- **AND** main creates the candidate only after reconstruction and gives it only to the identity-proven continuation.

#### Scenario: Candidate already exists

- **WHEN** a decision-material candidate exists before any candidate-free reconstruction was completed
- **THEN** the review records `single-stage` or `unknown` rather than claiming pre-authoring separation
- **AND** main does not hide the candidate by prompt instruction and call that physical isolation.

#### Scenario: Reviewer continuation cannot be proven

- **WHEN** stage one returns but the runtime cannot prove that stage two resumes the same reviewer child and role
- **THEN** the candidate-separated challenge remains `unknown` with the exact missing continuity evidence
- **AND** main does not launch a candidate-visible replacement and represent it as the same challenge.

#### Scenario: Existing exact practice trigger is also reached

- **WHEN** the candidate independently reaches an architecture, instruction, safety, claim-evidence, or domain Practice Owner trigger
- **THEN** main routes that exact concern to its registered owner without asking the bounded falsification reviewer to impersonate the owner
- **AND** no generic challenge is repeated solely because an exact owner also reports evidence.

#### Scenario: Material work has no formal planning artifact

- **WHEN** a Material request is ready to enter production mutation without an OpenSpec change or another durable plan
- **THEN** main completes candidate-free reconstruction before creating the smallest session-local decision frame, then supplies that frame only to the exact reviewer continuation
- **AND** it does not defer generic task-fit review until post-proof or make `final-candidate-reviewer` mandatory.

### Requirement: One episode has a finite challenge budget

One unchanged accepted-outcome episode SHALL contain exactly one initial fresh challenge when required. One pre-authoring reconstruction followed by one exact continuation for initial comparison SHALL count as one challenge, not two; task-call count SHALL remain separate from challenge count. An incomplete, failed, or unverified continuation SHALL leave that one challenge `unknown` and SHALL NOT authorize an equivalent replacement attempt for confidence.

A confirmed material correction SHALL permit at most one fresh corrected-candidate re-review only when the correction changes the challenged outcome, envelope, invariant, proof boundary, user-owned decision, or material-risk surface. The corrected-candidate reviewer SHALL be a new fresh child and SHALL receive the frozen candidate-free reconstruction plus the corrected candidate; it SHALL NOT resume the reviewer that inspected the prior candidate or repeat reconstruction around an already-existing candidate. If current raw evidence materially invalidates the frozen reconstruction, the corrected generic challenge remains `unknown` and the affected boundary uses focused evidence or its exact Practice Owner. Repeated requests for confidence, an unchanged candidate, optional findings, or a different wording of the same hypothesis SHALL NOT authorize another generic challenge.

If the corrected-candidate re-review discovers another confirmed accepted-outcome or non-deferrable defect, main SHALL correct it and close it through focused evidence or the exact Practice Owner boundary; it SHALL NOT start a third generic falsification challenge for the same episode. A materially changed user requirement starts a new accepted-outcome episode rather than silently resetting the prior budget.

#### Scenario: Pre-authoring reconstruction and comparison complete

- **WHEN** one fresh reviewer reconstructs context before candidate creation and its exact continuation compares the initial candidate
- **THEN** the record reports challenge count one even though two correlated task calls occurred.

#### Scenario: Initial correction changes the challenged design

- **WHEN** main confirms a material finding and the smallest correction changes a challenged decision surface
- **THEN** one fresh corrected-candidate reviewer may compare the corrected candidate against the still-current frozen reconstruction
- **AND** its completion exhausts the generic challenge budget for that accepted-outcome episode.

#### Scenario: Same candidate is challenged again

- **WHEN** the candidate, original request, operating envelope, and decision-changing evidence are unchanged after a terminal challenge
- **THEN** main reuses the terminal disposition and launches no equivalent generic review.

#### Scenario: Second challenge finds a new material defect

- **WHEN** the one permitted corrected-candidate re-review exposes another reproducible current material defect
- **THEN** main corrects the defect and obtains focused proof or exact-owner evidence for the affected boundary
- **AND** it does not seek a third generic verdict for the same episode.

### Requirement: Review state remains candidate-correlated and structurally honest

A durable project-native falsification record SHALL identify the original-request reference, candidate reference, reviewer identity and effective model, challenge count, attempted attack classes, material rows or `no-material-finding`, main dispositions, correction invalidation, exact terminal reason, and unresolved evidence. A new record SHALL also declare `Protocol Mode: single-stage | pre-authoring-separated`, `Context Reconstruction Ref: none | <privacy-safe-ref>`, `Candidate State At Reconstruction: absent | present | unknown`, `Initial Comparison Continuity: not-applicable | verified | unknown`, and `Corrected Review Freshness: not-applicable | verified | unknown`. A pre-authoring-separated closed initial challenge SHALL require a non-`none` reconstruction reference, absent candidate state, and verified initial continuity. A challenge count of two SHALL additionally require verified corrected-review freshness. Separation, reconstruction currency, continuity, or freshness that cannot be established SHALL remain `unknown` with unresolved evidence.

Records created before these fields existed SHALL remain readable as `single-stage`, `none`, `unknown`, `not-applicable`, and `not-applicable`; that compatibility projection SHALL NOT upgrade them to pre-authoring-separated evidence. OpenSpec changes that require the review SHALL keep the record with the active change. A full or legacy-strict change using a reviewed exemption SHALL record the exemption reason without a synthetic review report. A valid compact change with current `ordinary-small-exact` disposition and no decision-material surface SHALL treat review as not applicable: it SHALL omit both the bounded-falsification declaration and reviewer artifact rather than manufacture an exemption record.

Deterministic helpers MAY validate explicit schema, identities, counts, ordering, freshness, protocol correlation, and terminal states. They SHALL return `unknown` for unsupported semantics and SHALL NOT decide whether review was required, whether distinction pressure exists, whether candidate bytes were intellectually ignored, whether a finding is material, whether an exact compact omission is semantically justified, whether the review was sufficient, or whether the candidate solves the task.

#### Scenario: Pre-authoring-separated closed record is complete

- **WHEN** a pre-authoring-separated challenge reports a closed terminal state
- **THEN** structural validation requires a context reconstruction reference, absent candidate state, and verified initial continuity plus corrected-review freshness when challenge count is two
- **AND** it still reports only structural validity rather than semantic readiness.

#### Scenario: Candidate changes after review

- **WHEN** an artifact mutation changes a challenged outcome, envelope, invariant, proof boundary, user-owned decision, or material-risk surface
- **THEN** the prior terminal record becomes stale for that surface
- **AND** main uses the remaining episode budget or exact focused evidence rather than representing the stale review as current.

#### Scenario: Structural validation passes without semantic evidence

- **WHEN** a record has every required field but no configured review observation or main disposition evidence
- **THEN** deterministic validation reports only structural validity
- **AND** semantic falsification readiness remains `unknown`.

#### Scenario: Legacy record is read

- **WHEN** an existing falsification record predates the protocol fields
- **THEN** the parser preserves it as a single-stage record without claiming candidate separation
- **AND** no archived or concurrently active historical evidence is rewritten.

#### Scenario: Compact exact review is not applicable

- **WHEN** a compact proposal has current `riskDisposition.kind: ordinary-small-exact`, no decision-material surface, and passing structural checks
- **THEN** it contains neither an exemption declaration nor `falsification-review.md`
- **AND** normal runtime proof, validation, safety, dependency, and Practice Owner routes remain required.

## ADDED Requirements

### Requirement: Consequence comparison stops at supported evidence

For each candidate distinction challenged by the resumed comparison, the reviewer SHALL report a stable row containing the causal-use chain from current evidence, the distinction the candidate discards or conflates, the downstream observer or effect, the reachable current-envelope consequence, exact evidence or evidence gap, the earliest sufficient falsifier, and the smallest mitigation note. A maintenance or next-change consequence SHALL appear only when current evidence identifies that consumer or change pressure; generic future possibilities SHALL not become findings.

The reviewer SHALL stop a chain at the first verified contract or real oracle that preserves the distinction, at an exact owner or protected decision boundary, or at explicit `unknown` when evidence cannot support the next link. Fluent speculation, checklist completion, risk vocabulary, and number of rows SHALL NOT substitute for a supported chain. Main SHALL retain all admission and disposition authority from the existing bounded-falsification contract.

#### Scenario: Candidate collapses an observable distinction

- **WHEN** stage-one evidence shows two currently reachable states with different downstream observations and the candidate represents them as one state
- **THEN** the resumed reviewer reports the discarded distinction and causal consequence with the earliest sufficient falsifier
- **AND** main independently reproduces or disproves the row before correction.

#### Scenario: Evidence ends before the claimed consequence

- **WHEN** source evidence establishes a distinction but does not establish any downstream consumer or effect inside the current envelope
- **THEN** the reviewer stops the chain at `unknown` rather than inventing a consequence
- **AND** the unknown alone does not create optional hardening work.

#### Scenario: No evidence identifies a likely future consumer

- **WHEN** the current outcome and source evidence identify no concrete maintenance path or next consumer
- **THEN** the reviewer omits future-change speculation
- **AND** the absence of such a row is not treated as review failure.
