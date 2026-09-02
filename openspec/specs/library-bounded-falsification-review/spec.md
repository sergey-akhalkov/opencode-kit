# library-bounded-falsification-review Specification

## Purpose
Defines a finite, evidence-backed attempt to disprove decision-material authored work
against the original accepted request before confidence or substantial investment.

## Requirements

### Requirement: Decision-material authoring starts from failure hypotheses

Before drafting a plan, specification, architecture decision, or Material-change plan
that resolves or assumes a fact capable of changing the accepted outcome, operating
envelope, non-deferrable invariant, observable proof boundary, user-owned decision, or
material residual risk, main SHALL restate the original accepted request and success
boundary independently from the candidate. Main SHALL identify a bounded set of the
strongest realistic ways a formally compliant result could still solve the wrong task,
hide a required decision, fail only during implementation, or introduce unnecessary
scope, and SHALL use those hypotheses while authoring the first candidate.

The decision-material classification SHALL remain a semantic main-owned judgment.
Deterministic tooling SHALL NOT infer it from task count, file count, line count,
keywords, model output, or a numeric score.

#### Scenario: A plan can satisfy its text while missing the user outcome

- **WHEN** a requested plan contains a plausible interpretation that would satisfy its own acceptance text but not the independently supplied original request
- **THEN** main includes that mismatch among the pre-authoring failure hypotheses
- **AND** the first candidate makes the accepted outcome and observable success boundary explicit.

#### Scenario: Ordinary Small owner-local work has no decision-material surface

- **WHEN** a bounded local reversible change has a known owner, exact behavior, focused validation, and no unresolved decision affecting the outcome, envelope, invariant, proof boundary, or material risk
- **THEN** main proceeds without manufacturing failure hypotheses or a falsification episode solely for compliance.

### Requirement: Fresh challenge receives independent task and candidate inputs

A required falsification episode SHALL use one fresh read-only reviewer that authored
neither the candidate nor prior challenge evidence. The brief SHALL provide the original
accepted request and success boundary separately from the candidate, plus the enforced
operating envelope, non-goals, non-deferrable invariants, candidate reference, relevant
source/evidence references, and exact review boundary. The reviewer SHALL record its
effective model and inspected candidate identity.

The pre-implementation challenger SHALL be the existing
`implementation-readiness-reviewer`. A Material request without a formal planning
artifact SHALL first receive the smallest project-native or session-local decision frame
needed to carry the original request, decision surface, envelope, proof boundary, and
failure hypotheses into the same early challenge. `final-candidate-reviewer` SHALL retain
its optional post-proof concrete-risk boundary and SHALL NOT become a mandatory fallback.
Exact Practice Owners SHALL retain their current triggers and boundaries; this contract
SHALL NOT create a universal reviewer or central review router.

#### Scenario: Candidate restates the wrong problem coherently

- **WHEN** the candidate is internally consistent but differs materially from the independently supplied original request
- **THEN** the fresh reviewer assesses the mismatch against the original request rather than treating candidate consistency as task-fit evidence.

#### Scenario: Existing exact practice trigger is also reached

- **WHEN** the candidate independently reaches an architecture, instruction, safety, claim-evidence, or domain Practice Owner trigger
- **THEN** main routes that exact concern to its registered owner without asking the bounded falsification reviewer to impersonate the owner
- **AND** no generic challenge is repeated solely because an exact owner also reports evidence.

#### Scenario: Material work has no formal planning artifact

- **WHEN** a Material request is ready to enter production mutation without an OpenSpec change or another durable plan
- **THEN** main creates the smallest decision frame and obtains the same fresh `implementation-readiness-reviewer` challenge before mutation
- **AND** it does not defer generic task-fit review until post-proof or make `final-candidate-reviewer` mandatory.

### Requirement: Challenge attacks task fit and unnecessary work

The reviewer SHALL attempt to falsify at least these current-envelope propositions:
literal completion still solves the original task; no user-owned or material decision is
silently guessed; acceptance is externally observable; implementation is not forced to
discover a decision that can invalidate dependent work; proposal, design, specifications,
tasks, and relevant source evidence do not contradict; and each capability, abstraction,
task, reviewer, or proof mechanism is necessary for the accepted outcome or an invariant.

The reviewer SHALL be explicitly permitted to return no material finding. Finding count,
review length, severity inflation, and novelty SHALL NOT be review-success measures.

#### Scenario: Candidate contains work that does not support the outcome

- **WHEN** a capability or task can be removed without weakening the accepted outcome, enforced envelope, non-deferrable invariants, observable proof, or required evidence
- **THEN** the reviewer reports the exact unnecessary scope and its evidence as a candidate material finding.

#### Scenario: Honest attack finds no material defect

- **WHEN** every realistic attempted falsification is contradicted by current candidate or source evidence and remaining observations are optional, future-scope, stylistic, or polish-only
- **THEN** the reviewer returns `no-material-finding`
- **AND** main terminates the episode without adding work to obtain a non-empty report.

### Requirement: Material findings require complete admission evidence

A finding SHALL enter correction disposition only when it identifies the accepted outcome
or non-deferrable invariant at risk, a reachable scenario inside the enforced current
envelope, concrete consequence, exact artifact/source/live evidence, why the issue is
current rather than future scope, and the smallest sufficient correction. Missing fields,
reviewer preference, generic uncertainty, hypothetical scale, optional hardening, style,
or polish SHALL remain `unproven`, `future-scope`, `optional`, or `polish` and SHALL create
no task, backlog item, review loop, or readiness blocker.

#### Scenario: Reviewer proposes speculative hardening

- **WHEN** a review row lacks a reachable current-envelope scenario or names only a possible future variant
- **THEN** main classifies it outside material correction admission
- **AND** the row does not extend the falsification episode or accepted scope.

#### Scenario: Reviewer identifies a reachable wrong-outcome path

- **WHEN** a row links exact candidate evidence to a reachable path that can complete all planned tasks while failing the original accepted outcome
- **THEN** main treats it as a material candidate finding and independently reproduces or disproves it before mutation.

### Requirement: Main owns disposition and correction

Reviewer evidence SHALL NOT authorize mutation, scope expansion, product or architecture
selection, a protected action, implementation readiness, Development-Stage, or
completion. Main SHALL independently reproduce, disprove, show unreachable, narrow, or
classify every admitted row. Only a confirmed current accepted-outcome or non-deferrable
defect SHALL receive the smallest correction, and that correction SHALL remain ordinary
in-scope work when accepted semantics are unchanged.

#### Scenario: Reviewer finding is not reproducible

- **WHEN** main checks the cited path and current evidence disproves the reviewer's consequence
- **THEN** main records the finding as falsified
- **AND** no correction or successor review is created from that finding.

#### Scenario: Reviewer finding is confirmed

- **WHEN** main reproduces a current material defect against the original accepted request
- **THEN** main applies or plans the smallest correction without treating reviewer text as authority
- **AND** scope outside that correction remains unchanged.

### Requirement: One episode has a finite challenge budget

One unchanged accepted-outcome episode SHALL contain exactly one initial fresh challenge
when required. A confirmed material correction SHALL permit at most one fresh
corrected-candidate re-review only when the correction changes the challenged outcome,
envelope, invariant, proof boundary, user-owned decision, or material-risk surface.
Repeated requests for confidence, an unchanged candidate, optional findings, or a
different wording of the same hypothesis SHALL NOT authorize another generic challenge.

If the corrected-candidate re-review discovers another confirmed accepted-outcome or
non-deferrable defect, main SHALL correct it and close it through focused evidence or the
exact Practice Owner boundary; it SHALL NOT start a third generic falsification challenge
for the same episode. A materially changed user requirement starts a new accepted-outcome
episode rather than silently resetting the prior budget.

#### Scenario: Initial correction changes the challenged design

- **WHEN** main confirms a material finding and the smallest correction changes a challenged decision surface
- **THEN** one fresh corrected-candidate re-review is permitted
- **AND** its completion exhausts the generic challenge budget for that accepted-outcome episode.

#### Scenario: Same candidate is challenged again

- **WHEN** the candidate, original request, operating envelope, and decision-changing evidence are unchanged after a terminal challenge
- **THEN** main reuses the terminal disposition and launches no equivalent generic review.

#### Scenario: Second challenge finds a new material defect

- **WHEN** the one permitted corrected-candidate re-review exposes another reproducible current material defect
- **THEN** main corrects the defect and obtains focused proof or exact-owner evidence for the affected boundary
- **AND** it does not seek a third generic verdict for the same episode.

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
