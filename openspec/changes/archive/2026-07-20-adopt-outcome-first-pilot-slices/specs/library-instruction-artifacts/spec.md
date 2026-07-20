## ADDED Requirements

### Requirement: OpenSpec authoring is sufficient for the next working increment
Loaded OpenSpec authoring guidance SHALL default each change to the next useful working increment rather than exhaustive resolution of the imagined final system. Actionable proposal, design, spec, and task content SHALL resolve decisions only when they can materially change the current increment's outcome, technically enforced operating envelope, non-deferrable invariants, observable proof, material residual risk, or stop line.

Every behavior-changing increment SHALL identify, directly or through an accepted project-native equivalent: `Outcome`, `Operating Envelope`, `Non-Goals`, `Non-Deferrable Invariants`, `Observable Proof`, `Material Residual Risks`, and `Stop Line`. Implementation readiness SHALL require enough evidence for a capable cold-context implementer to build and prove that increment without guessing a user-owned decision or a decision that changes material risk. It SHALL NOT require future scaling, variants, integrations, compatibility, or edge behavior that cannot be reached inside the current envelope.

Tasks SHALL represent meaningful behavior, evidence, or gate outcomes and MAY group mechanical edits that share one owner and validation result. Requirement-to-test traceability SHALL cover accepted current-increment requirements rather than an imagined final product. Specification review SHALL stop when remaining findings are future-scope, unreachable, optional, or polish-only.

#### Scenario: Broad product idea becomes one working increment
- **WHEN** a requested capability includes future multi-user, scale, compatibility, and operational ambitions but one bounded useful slice can be delivered safely first
- **THEN** OpenSpec SHALL make that slice's outcome and envelope normative
- **AND** SHALL keep the unreachable ambitions as non-goals, context, or later changes rather than current acceptance work.

#### Scenario: Capable implementer can start without exhaustive future design
- **WHEN** the current slice has resolved its outcome, enforced envelope, invariants, proof, material risks, and user-owned decisions
- **THEN** implementation readiness SHALL be `ready` even when future-scope design questions remain
- **AND** those questions SHALL NOT trigger another specification-polish loop.

#### Scenario: Material current-slice decision remains blocking
- **WHEN** an unresolved decision can change current user-visible behavior, safety, data integrity, authorization, irreversible effects, or the enforceability of the operating envelope
- **THEN** implementation SHALL remain blocked on that exact decision
- **AND** the artifact SHALL NOT hide it as future scope merely to start coding.

#### Scenario: Mechanical edits stay grouped
- **WHEN** several instruction mirrors require the same accepted semantic update under one owner and one validation result
- **THEN** `tasks.md` MAY group them into one bounded task
- **AND** SHALL NOT create separate tasks solely for each mechanical file edit.

### Requirement: Outcome-first policy has canonical authority and minimal role deltas
The complete outcome-first, operating-envelope, Pilot-Ready, material-risk-acceptance, and minimum-remedy policy SHALL have canonical loaded authority in `global/AGENTS.md`, with qualification-specific detail in `global/skills/change-ready-sdlc/SKILL.md`. Shared reviewer maintenance provenance SHALL live in `instructions/leaf-reviewer-agent-contract.md`. Other global skills, agents, project-facing templates, and guidance SHALL carry only role-specific decision deltas and SHALL NOT copy the complete policy block.

Specialized checklists SHALL be conditional on the accepted operating envelope and current increment. They SHALL NOT convert every listed domain area into current acceptance scope. Existing artifacts that already express no-perfection, stop-line, minimal-remedy, or replacement rules SHALL remain unchanged unless a concrete contradiction is evidenced.

No new runtime instruction artifact SHALL be added for this policy. The implementation SHALL replace conflicting maximal-planning and duplicated readiness text so `global/AGENTS.md` and the combined changed runtime instruction corpus do not increase under the existing `instruction:inventory` token proxy.

#### Scenario: Role agent references shared policy
- **WHEN** a reviewer or implementation role needs outcome-first behavior
- **THEN** it SHALL contain only the role-specific reachability, evidence, remedy, or output rule needed by that role
- **AND** SHALL NOT duplicate the complete operating-envelope or Pilot-Ready contract.

#### Scenario: Specialized checklist is scoped
- **WHEN** a domain reviewer lists concurrency, migration, compatibility, overload, recovery, or deployment checks
- **THEN** it SHALL apply only checks reachable in the accepted current envelope or required by a non-deferrable invariant
- **AND** SHALL report other valid concerns as future scope rather than automatically block the increment.

#### Scenario: Existing conforming artifact is preserved
- **WHEN** `code-quality-audit`, `code-quality-reviewer`, `documentation-hardening-loop`, or `instruction-artifact-tuning` already provides the accepted minimal-remedy or stop-line behavior without contradiction
- **THEN** implementation SHALL leave that artifact unchanged
- **AND** SHALL NOT edit it merely to repeat the new terminology.

#### Scenario: Runtime context does not grow
- **WHEN** the policy is implemented across its bounded runtime instruction set
- **THEN** `instruction:inventory` SHALL show no increase for `global/AGENTS.md` or the combined changed runtime corpus
- **AND** any new guidance SHALL replace conflicting or duplicated prose rather than append another override layer.

### Requirement: Reviewer contracts separate finding validity from current disposition
Loaded shared reviewer invariants and the canonical reviewer maintenance contract SHALL require evidence-backed findings to distinguish reachability inside the accepted operating envelope from future-scope validity. Existing finding `Recommendation` fields SHALL state the smallest sufficient remedy or why removal, narrowing, reuse, a local guard, or deferral cannot satisfy the current increment. No new standalone action-authoring output field SHALL be introduced.

Qualification and delivery roles SHALL keep Pilot-Ready and Change-Ready evidence separate. A full-qualification rejection SHALL remain binding for Change-Ready, but SHALL NOT automatically erase independently proven Pilot-Ready evidence unless the finding makes the pilot candidate, proof, containment, safety floor, validation, or material-risk acceptance invalid or unknowable.

#### Scenario: Reviewer reports a valid future issue
- **WHEN** a reviewer finds an evidence-backed issue outside the technically enforced pilot envelope
- **THEN** the finding SHALL remain in the report with its impact and confidence
- **AND** SHALL NOT become current Pilot-Ready blocking evidence solely because it is valid.

#### Scenario: Recommendation avoids unnecessary subsystem
- **WHEN** a finding can be resolved by dropping a variant or narrowing the operating envelope
- **THEN** the recommendation SHALL prefer that remedy over a new state machine, compatibility layer, recovery protocol, or framework
- **AND** SHALL explain why a larger mechanism is necessary when it recommends one.

#### Scenario: Change-Ready rejection retains its authority
- **WHEN** final or delivery review produces binding Change-Ready evidence
- **THEN** `Change-Ready` SHALL remain `no` under the existing terminal qualification rules
- **AND** the main session SHALL separately evaluate Pilot-Ready only against the accepted pilot contract without replaying or mutating the rejected qualification attempt.

### Requirement: Existing validators prevent policy duplication and contradiction
Existing instruction contracts and validators SHALL enforce canonical outcome-first placement, exact Pilot-Ready output tokens on configured surfaces, separation from Change-Ready, minimum-remedy ordering, and the prohibition on remote-operation implication. They SHALL reject duplicated complete policy blocks and unconditional wording that turns unreachable future findings or evidence-format polish into Pilot-Ready blockers.

Validation SHALL extend existing contract, active-authority, routing, and focused test owners. It SHALL NOT add a new validator framework, fuzzy semantic classifier, lifecycle service, persistent evidence artifact, or runtime dependency.

#### Scenario: Duplicate complete policy is rejected
- **WHEN** a role agent or secondary skill copies the complete canonical outcome-first and Pilot-Ready contract
- **THEN** strict validation SHALL fail with the canonical source and offending artifact
- **AND** SHALL require a role-specific delta instead.

#### Scenario: Contradictory maximal-planning rule is rejected
- **WHEN** a loaded OpenSpec authoring surface requires every future decision or edge case to be resolved before the next bounded increment can start
- **THEN** strict validation SHALL fail or a focused behavioral eval SHALL reject the artifact
- **AND** SHALL require next-increment sufficiency and the specification stop line.

#### Scenario: Deterministic scope remains explicit
- **WHEN** validators inspect the new policy
- **THEN** they SHALL check configured files, headings, fields, exact markers, forbidden duplication, and output-token presence
- **AND** SHALL NOT infer whether arbitrary natural-language risk is reachable or acceptable.
