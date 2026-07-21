## MODIFIED Requirements

### Requirement: SDLC-002 Scope expansion requires explicit user approval

Before mutation, the portable SDLC SHALL freeze an outcome authority capsule containing the accepted user-visible outcome, operating envelope, non-goals, non-deferrable invariants, observable proof, protected boundaries, and any unresolved user-owned decisions. Scope expansion SHALL mean changing that accepted outcome, adding user-visible behavior outside it, weakening or changing a non-deferrable invariant, or crossing a protected boundary. Scope expansion SHALL require explicit user approval.

Protected boundaries SHALL include credentials or privilege elevation; destructive, irreversible, or remote action; deployment, installation, activation, release, or external publication; owner-controlled cost or external commitment; changes to public API, protocol, or compatibility semantics; persisted-data or migration semantics; security, privacy, or authorization semantics; and product, legal, or policy decisions that the agent cannot derive from accepted evidence. Editing an artifact that implements already accepted semantics SHALL NOT by itself count as crossing the corresponding protected boundary.

The implementation footprint SHALL remain adaptable after the first mutation. The orchestrator MAY add or change a task, local write path, artifact, focused check, or implementation action without user approval only when current evidence shows that it is necessary to satisfy the accepted outcome or a non-deferrable invariant, the action is local and reversible, it does not cross a protected boundary, it is the smallest sufficient dependency closure, and unrelated work remains preserved. The orchestrator SHALL update the working brief, invalidate affected candidate evidence, and retain traceability from the new work to the accepted outcome.

A reviewer, SDET, validation result, delivery result, severity label, unknown, or missing capability SHALL NOT itself grant implementation authority. The main orchestrator SHALL first diagnose the finding and establish either authorized local reversible dependency closure, a residual-risk disposition, or an exact user-owned blocker. Optional abstractions, hardening, cleanup, compatibility behavior, tooling, and evidence infrastructure that are not necessary for the accepted outcome SHALL remain residual or separately approved follow-up work.

#### Scenario: unexpected local dependency is completed autonomously

- **WHEN** proof shows that the accepted feature cannot run without a change to an initially unlisted local module or configuration artifact
- **AND** the change is necessary, reversible, preserves accepted semantics, and crosses no protected boundary
- **THEN** the orchestrator SHALL add the smallest required work and continue autonomously
- **AND** SHALL NOT ask the user to approve a new revision solely because the path or task was not in the initial plan.

#### Scenario: reviewer finding requires diagnosis before mutation

- **WHEN** a reviewer reports a serious defect outside the initial implementation footprint
- **THEN** the finding SHALL bind the applicable readiness decision but SHALL NOT directly authorize mutation
- **AND** the orchestrator SHALL diagnose whether the minimal repair is necessary local reversible dependency closure, a protected-boundary decision, or residual work
- **AND** SHALL continue autonomously when the dependency-closure conditions are met.

#### Scenario: optional cleanup remains outside autonomous authority

- **WHEN** a working candidate has duplication, an optional abstraction opportunity, speculative hardening, or unrelated baseline debt that is not necessary for the accepted outcome or a non-deferrable invariant
- **THEN** the orchestrator SHALL record it as residual or a non-authorizing follow-up candidate
- **AND** SHALL NOT implement it merely because the implementation footprint is adaptable.

#### Scenario: public contract change still requires approval

- **WHEN** the accepted result cannot be achieved without changing public API, protocol, compatibility, persisted-data, migration, security, privacy, or authorization semantics
- **THEN** the orchestrator SHALL present the exact required semantic change and its consequences to the user
- **AND** SHALL NOT cross that protected boundary without explicit approval.

#### Scenario: internal revision is not a user decision

- **WHEN** the candidate or qualification attempt must be replaced but the accepted outcome, non-goals, non-deferrable invariants, and protected boundaries are unchanged
- **THEN** the orchestrator MAY record a new internal revision or attempt and continue
- **AND** SHALL NOT ask the user to approve the identifier or process transition itself.

#### Scenario: broad all-tasks request permits necessary discovered work

- **WHEN** the user requests completion of all accepted work for an outcome and implementation evidence discovers an additional local reversible task necessary to make that outcome work
- **THEN** the task MAY be added with explicit traceability to the frozen outcome
- **AND** a task that introduces a new outcome, protected boundary, or optional improvement SHALL still require separate approval.

### Requirement: SDLC-006 Qualification is finite and cannot create evidence products

Each candidate qualification attempt SHALL be finite. Before an attempt begins, Material or explicit Change-Ready work SHALL record the current accepted outcome capsule, current Candidate Reference, applicable mandatory gates and trusted procedures, one initial fresh SDET, no more than one correction wave inside that attempt, at most one fresh corrected-candidate SDET when that correction is consumed, one final review, one Material delivery review when required, and an attempt stop line.

Exhaustion or rejection SHALL terminate only the current qualification attempt and SHALL produce `Change-Ready: no` for that candidate. It SHALL NOT by itself terminate the root user goal, require approval of a new revision, or prohibit read-only diagnosis. When a reproduced failure violates the accepted outcome or a non-deferrable invariant and an authorized local reversible repair path exists, the orchestrator SHALL return the root goal to diagnosis or implementation, create a new candidate and qualification attempt as internal bookkeeping, and replay only the affected evidence after current observable proof succeeds.

The orchestrator SHALL NOT retry an unchanged candidate until it passes. A new attempt after failure SHALL require concrete new root-cause evidence and at least one relevant change: a candidate repair, a technically enforced narrower operating envelope that still delivers useful accepted value, or correction of a demonstrated environment or evidence defect. Repeated failure without new root-cause evidence or a credible autonomous path SHALL become an exact technical blocker handoff rather than another blind attempt.

A mandatory gate SHALL remain candidate authority only when it comes from an accepted project or owner source. Baseline debt or a later-discovered unrelated gate SHALL NOT authorize cleanup. Persistent evidence infrastructure introduced only to qualify the current candidate, including a reusable harness, validator framework, benchmark system, simulator, ledger, generator, or cross-repository runner, SHALL remain a separate prerequisite unless it independently satisfies the authorized dependency-closure rules for the accepted product outcome.

Final and delivery reviewers SHALL remain read-only accept-or-reject gates for the candidate they inspect. Their rejection SHALL NOT authorize mutation, but the main orchestrator SHALL diagnose and route evidence after the attempt closes. A new candidate correction SHALL use the proper production or fresh SDET owner and fresh downstream evidence.

#### Scenario: second serious failure closes the attempt but not the root goal

- **WHEN** the current attempt has consumed its correction wave and another serious or mandatory candidate failure remains or appears
- **THEN** that attempt SHALL terminate with `Change-Ready: no`
- **AND** the orchestrator SHALL preserve the failure, perform bounded diagnosis, and continue the unfinished root goal when an authorized local reversible repair path exists
- **AND** SHALL NOT ask for approval solely to increment a revision or correction counter.

#### Scenario: final review exposes a locally repairable product defect

- **WHEN** Final Candidate Review rejects a candidate with a reproduced defect against the accepted outcome
- **AND** diagnosis establishes a smallest local reversible repair that crosses no protected boundary
- **THEN** the reviewed attempt SHALL remain terminal and its evidence SHALL remain rejected
- **AND** the orchestrator SHALL route a new candidate repair and fresh affected gates without requiring owner approval of the process transition.

#### Scenario: delivery rejection exposes only a candidate packaging defect

- **WHEN** Material delivery rejects the current candidate because a required local handoff or packaging fact is incorrect but the correction changes no product semantics or protected boundary
- **THEN** the current delivery attempt SHALL remain rejected
- **AND** the orchestrator MAY correct the authorized local artifact and qualify a new candidate with affected evidence replay.

#### Scenario: unchanged failure cannot be retried blindly

- **WHEN** the same candidate repeats the same failure without a demonstrated environment correction or new root-cause evidence
- **THEN** the orchestrator SHALL stop replaying that check
- **AND** SHALL diagnose, choose a materially different authorized approach, narrow the enforced envelope while preserving useful value, or produce an exact blocker handoff.

#### Scenario: missing mandatory capability can become a true blocker

- **WHEN** an explicitly required Change-Ready gate has no conforming capability and bounded investigation finds no authorized local substitute
- **THEN** the candidate SHALL remain `Change-Ready: no`
- **AND** the handoff SHALL name the missing capability, why it is mandatory, what was investigated, and what concrete owner action could unlock progress
- **AND** SHALL NOT describe correction-budget exhaustion as the blocker.

#### Scenario: protected-boundary repair waits for owner authority

- **WHEN** diagnosis proves that the only viable repair requires credentials, privilege elevation, destructive or remote action, or changed public, data, security, privacy, authorization, deployment, or policy semantics
- **THEN** the orchestrator SHALL preserve the candidate and evidence and request the exact missing authority or decision
- **AND** SHALL NOT perform the protected action autonomously.

## ADDED Requirements

### Requirement: SDLC-017 Working-result and technical-debt dispositions are explicit

The main orchestrator SHALL classify unresolved current findings by their effect on the accepted operating envelope: an outcome blocker, a non-deferrable invariant blocker, a contained material limitation, or deferrable technical debt. A broken observable happy path SHALL be an outcome blocker. An uncontrolled authorization, privacy, data-integrity, irreversible-action, or envelope-escape risk SHALL be a non-deferrable blocker. Neither class SHALL be relabeled as technical debt to complete the task.

A contained material limitation MAY remain after a useful working candidate exists only when the enforced envelope, failure visibility, containment, recovery, and evidence confidence make the limitation bounded and the applicable Pilot-Ready or Change-Ready rules are reported honestly. Deferrable technical debt SHALL include optional architecture improvement, maintainability polish, unreachable future-scale behavior, non-mandatory evidence, and other issues that do not invalidate the accepted outcome or non-deferrable invariants inside the enforced envelope.

The orchestrator SHALL first produce and prove the smallest useful working candidate when authorized. It SHALL then present one compact residual bundle instead of interrupting implementation for each deferrable item. Explicit user acceptance SHALL still precede `Pilot-Ready: yes` for reachable material pilot risk, but the acceptance question SHOULD occur after working-result evidence is available unless the decision is required to choose behavior or cross a protected boundary.

#### Scenario: broken happy path is not technical debt

- **WHEN** the primary feature cannot complete its accepted observable happy path inside the operating envelope
- **THEN** the finding SHALL remain an outcome blocker and the root goal SHALL remain unfinished
- **AND** the orchestrator SHALL continue authorized diagnosis and repair rather than report successful completion with residual debt.

#### Scenario: uncontrolled critical risk cannot be deferred

- **WHEN** the working path can cause uncontrolled authorization bypass, private-data exposure, data corruption or loss, irreversible action, or escape from the declared envelope
- **THEN** the finding SHALL block the applicable working or pilot disposition until removed, contained, narrowed, or corrected
- **AND** a risk-matrix entry or user preference for speed SHALL NOT waive it.

#### Scenario: ordinary technical debt is batched at handoff

- **WHEN** the accepted outcome and non-deferrable invariants are proven and remaining findings are optional refactoring, duplication, unreachable future behavior, or non-mandatory evidence polish
- **THEN** the orchestrator SHALL complete the working-result handoff and list the items in one compact residual bundle
- **AND** SHALL NOT interrupt implementation to ask whether each item must be perfected.

#### Scenario: contained material limitation is presented after proof

- **WHEN** a useful candidate is proven inside an enforced envelope and a reachable material limitation is bounded, visible, recoverable, and does not violate the non-waivable safety floor
- **THEN** the orchestrator SHALL present the limitation, impact, containment, recovery, confidence, and deferral value in one decision bundle
- **AND** SHALL obtain required acceptance before reporting `Pilot-Ready: yes` without discarding the working candidate.

### Requirement: SDLC-018 User blocking requires a decision-ready handoff

The main session SHALL ask the user to unblock work only when a specific user-owned permission, credential, elevation, protected-boundary decision, product or policy choice, external capability, destructive or remote authorization, or material risk acceptance is necessary for the next meaningful step. An internal revision number, correction-wave exhaustion, candidate rejection, `Change-Ready: no`, reviewer severity, or process stop line SHALL NOT alone be a user-owned blocker.

Before asking, the orchestrator SHALL perform safe bounded read-only diagnosis, test available local reversible alternatives, and consider a technically enforced narrower envelope that still preserves useful accepted value. The blocker handoff SHALL state: the accepted outcome and whether it currently works; the exact failure and evidence; root-cause status and confidence; autonomous paths already attempted; why no authorized path can continue; the precise user action or decision required; real alternatives with consequences when they exist; residual risk; and the preserved candidate/workspace state.

The question SHALL use product and consequence language rather than requiring the user to understand internal lifecycle terminology. If no user action can unlock progress, the session SHALL report an evidence-backed technical impossibility or missing capability instead of presenting a fictitious approval choice.

#### Scenario: process counter does not trigger a question

- **WHEN** a correction wave or qualification attempt ends but read-only diagnosis or a necessary local reversible repair remains authorized
- **THEN** the orchestrator SHALL continue that work
- **AND** SHALL NOT ask the user to approve another revision or continuation merely because the internal counter ended.

#### Scenario: privilege elevation produces a concrete request

- **WHEN** the only viable next action requires privilege elevation
- **THEN** the handoff SHALL explain the operation, why elevation is required, what it changes, the risk, and any real non-elevated alternative
- **AND** SHALL ask for that exact authority rather than general permission to continue.

#### Scenario: semantic expansion produces a decision-ready choice

- **WHEN** the only viable implementation changes public, persisted-data, security, privacy, authorization, deployment, or product semantics
- **THEN** the handoff SHALL describe the current behavior, required change, compatibility or safety consequences, and available alternatives
- **AND** SHALL wait for the user's semantic decision.

#### Scenario: no-progress technical blocker preserves evidence

- **WHEN** repeated failure yields no new root-cause evidence and bounded diagnosis finds no credible authorized repair path
- **THEN** the handoff SHALL identify the exact unresolved fact, attempted diagnostics, retained reproducer, candidate state, and information or capability that could change the conclusion
- **AND** SHALL NOT hide the unknown behind lifecycle jargon or a generic continue-or-stop question.

#### Scenario: alternatives are not fabricated

- **WHEN** evidence supports only one viable owner action and stopping incomplete work
- **THEN** the handoff SHALL state that fact and its consequence plainly
- **AND** SHALL NOT invent unsafe or meaningless choices merely to satisfy an option count.
