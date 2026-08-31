## ADDED Requirements

### Requirement: Grind completion SHALL use a task-scoped work frontier
Each grind-enabled root SHALL expose one plugin-owned `grind_frontier` tool as the only main-to-controller write ingress for a bounded versioned frontier. The tool SHALL derive root and latest-human identity from its current execution context, validate a complete candidate before atomically replacing state under an expected server generation, and return the persisted generation plus controller-derived runnable refs. Each completion audit SHALL receive the current persisted frontier identifying accepted work items, dependencies, scoped gates, parked product decisions, progress identity, and evidence refs. The guard SHALL validate shape, bounds, human/task-basis correlation, reference integrity, and acyclicity and SHALL derive runnable items from dependency and gate state. Deterministic code SHALL NOT trust caller-supplied root/human/audit identity or infer product meaning, task dependencies, or gate semantics from prose.

#### Scenario: Independent item remains runnable
- **WHEN** one pending item is blocked by a gate and another pending item has complete dependencies and no open gate
- **THEN** the controller derives the independent item as runnable
- **AND** no verdict may pause the whole root for the blocked item.

#### Scenario: Frontier human or task basis is stale
- **WHEN** a structurally valid frontier differs from the latest non-synthetic human requirement ref or current trusted task-state digest
- **THEN** the guard performs no ordinary question, work continuation, completion, waiting, or protected effect from that frontier
- **AND** issues at most one reconciliation-only continuation with only the `grind_frontier` tool enabled.

#### Scenario: Frontier candidate is cyclic or malformed
- **WHEN** a tool candidate contains a cycle, missing reference, stale expected generation, unsupported schema, or enforced-bound overflow
- **THEN** the tool returns one cause-preserving validation error and persists no part of the candidate
- **AND** the last valid frontier and every root side-effect count remain unchanged.

#### Scenario: Persisted frontier is unreadable
- **WHEN** persisted frontier metadata is corrupt or uses an unsupported schema
- **THEN** the guard exposes a terminal capability/error diagnostic and performs no continuation, question, completion, waiting, or protected effect
- **AND** restart does not infer or silently overwrite the state.

### Requirement: Product decision is the only blocking grind question
The completion protocol SHALL distinguish `continue`, `product_decision_required`, non-product `waiting`, `allow_stop`, and `user_paused`. `product_decision_required` SHALL be valid only for an exact material product decision with no accepted reversible default and only when the controller-derived runnable set is empty. Access, permission, credential, elevation, process, technical, capability, external, safety, live-attempt, writer-liveness, and budget conditions SHALL NOT populate the product owner boundary.

#### Scenario: Product decision blocks one branch only
- **WHEN** a current product decision affects task A while independent task B remains runnable
- **THEN** the arbiter returns `continue` for task B and parks the decision for task A
- **AND** the guard neither presents nor leaves open a blocking product question.

#### Scenario: Product decision blocks all remaining work
- **WHEN** every incomplete accepted item depends on one exact material product decision and no item is runnable
- **THEN** the guard may enter `product_decision_required` with the decision, affected item refs, consequences, and safe resume condition
- **AND** it performs no dependent mutation before the human decision.

#### Scenario: Only a capability prerequisite remains
- **WHEN** no item is runnable and every incomplete item is blocked by an unavailable capability rather than a product decision
- **THEN** the guard enters a non-terminal capability waiting state with the exact resume condition
- **AND** it does not ask a product question or claim completion.

### Requirement: Premature product questions SHALL be deferred safely
When a grind-enabled root invokes any blocker question that is not currently eligible to remain open, the question arbiter SHALL use `questionAction=defer` with no question answers and either `continue` plus one selected runnable item or non-product `waiting` plus no selected item. The guard SHALL preserve human reply precedence, record synthetic deferral provenance, reject the pending request through the supported question API without inventing an answer, persist either the parked product decision or exact non-product gate, and resume one bounded selected-item continuation or commit the waiting state after rejection. Deferred question events SHALL NOT appear as human answers or autonomous option selections. Reply, defer, present-product-decision, and non-question continuation combinations SHALL be mutually exclusive under schema validation.

#### Scenario: Guard defers before human reply
- **WHEN** a product question is open, no human reply has occurred, and an independent item is runnable for the same current epoch
- **THEN** the guard rejects the request once, records the decision as parked, and continues the independent item
- **AND** the product question becomes eligible again only after the runnable frontier is empty.

#### Scenario: Human reply wins the deferral race
- **WHEN** a human reply resolves the product question before the guard's rejection succeeds
- **THEN** the guard records the human reply as authoritative and performs no rejection or stale continuation
- **AND** reconciles the frontier from the human decision before dependent work.

#### Scenario: Premature non-product question has runnable work
- **WHEN** a credential, access, process, capability, technical, safety, external, live-attempt, writer-liveness, or budget question is open, no human reply has occurred, and an independent item is runnable
- **THEN** the guard rejects the request once, records its exact non-product gate, and continues the selected independent item
- **AND** the question is never left open or represented as a product decision.

#### Scenario: Non-product question has no runnable work
- **WHEN** a valid non-product blocker question is open, no human reply has occurred, and the controller-derived runnable set is empty
- **THEN** the guard rejects the request once and enters the matching non-terminal waiting state with the exact gate and resume condition
- **AND** no product question, answer, or completion claim is emitted.

#### Scenario: Autonomous offered-label question remains autonomous
- **WHEN** a pending offered-label question is safely answerable inside current authority and is not a parked product decision
- **THEN** the guard uses the existing official reply path with an exact validated answer matrix
- **AND** does not route that question through product-decision deferral.

### Requirement: Process budgets SHALL NOT manufacture owner scope
Finite audit, retry, request, retention, wait, and continuation budgets SHALL bound one execution epoch or mechanism. Progress SHALL permit a new bounded epoch under the current accepted outcome. Exhaustion SHALL route an eligible causally distinct successor, bounded reconciliation, diagnosis, or non-product waiting/error state and SHALL NOT create a product decision, ownerBoundary, completion claim, or authorization for a protected action.

#### Scenario: Continuation cycle budget is exhausted with runnable work
- **WHEN** the current execution epoch reaches its cycle limit and a causally distinct runnable item remains
- **THEN** the guard checkpoints the current frontier and starts an eligible bounded successor epoch
- **AND** does not inject an owner-required handoff.

#### Scenario: No safe distinct mechanism remains
- **WHEN** the epoch is exhausted, the accepted outcome is incomplete, and no safe causally distinct action is currently eligible
- **THEN** the root records a non-product waiting or technical disposition with exact evidence and resume condition
- **AND** neither repeats the unchanged mechanism nor reports the outcome complete.

### Requirement: Frontier migration SHALL fail closed without freezing new work permanently
New audits SHALL use the current frontier and verdict schema. A retained older-schema verdict SHALL be stale for new side effects. A grind-enabled root without current frontier state SHALL reconcile the frontier from current human requirements and trusted task evidence before completion or product-decision classification. Historical rejected, answered, or owner-required questions SHALL NOT be reinterpreted.

#### Scenario: Existing root lacks frontier metadata
- **WHEN** a newly loaded guard inspects an enabled unpaused root whose metadata predates the frontier schema
- **THEN** it requests one bounded main-owned frontier reconciliation and suppresses completion and product-decision verdicts until current state exists
- **AND** does not infer dependencies from assistant summaries in plugin code.

## MODIFIED Requirements

### Requirement: Arbiter verdicts are structured and non-lifecycle
The hidden completion arbiter SHALL return a versioned structured verdict correlated to its audit epoch and current controller-derived frontier. It SHALL distinguish `allow_stop`, `continue`, `product_decision_required`, `waiting`, and `user_paused`, map every current user requirement to evidence or an unresolved item, reference only supplied item/gate/decision ids, and SHALL NOT set or approve Development-Stage, RC, stable, release, deployment, or external-operation state. A pending-question audit SHALL include the exact bounded question text, ordered offered labels and descriptions, single/multiple selection mode, custom-input policy, and current runnable refs. Its `questionAction` SHALL be exactly one of `answer`, `defer`, `present-product-decision`, or null. `answer` SHALL include one exact offered-label answer row per question; `defer` SHALL include either parked-decision refs or exact non-product gate refs; every other action and every completion audit SHALL carry no question answers.

The verdict transport SHALL be one exact JSON text object from the configured arbiter model with no registered model tools. The plugin SHALL parse the entire trimmed text and then apply the versioned schema, audit/root/human/task/frontier correlation, controller-derived runnable-set equality, selected-item constraints, and pending-question cross-field constraints. Markdown fences, prose, trailing content, malformed JSON, unknown schema versions, correlation mismatches, invented refs, runnable-set mismatches, illegal question actions, unoffered or duplicate labels, wrong answer cardinality, optionless/custom-only autonomous answers, and answers on a non-answer action SHALL enter retry with no root side effect.

#### Scenario: Root goal is complete
- **WHEN** every current uncancelled human requirement and question decision has evidence of completion or explicit user deferral
- **THEN** the arbiter MAY return `allow_stop`
- **AND** the guard SHALL show Passed status without adding a success message to the transcript.

#### Scenario: Autonomous work remains
- **WHEN** a current user requirement lacks completion evidence and the controller-derived runnable set is non-empty
- **THEN** the arbiter SHALL return `continue` with one runnable selected item, the requirement ref, evidence gap, prohibited repeated strategy, next evidence, and stop condition
- **AND** it SHALL NOT return `product_decision_required`, `waiting`, or `allow_stop`.

#### Scenario: Pending question has an autonomous exact choice
- **WHEN** every question in one pending request has at least one offered option and the supplied authority/evidence establishes a complete safe selection
- **THEN** a correlated `continue` or `allow_stop` verdict SHALL use `questionAction=answer` and contain exactly one validated answer row per question
- **AND** it SHALL select only exact offered labels while respecting single- and multi-select cardinality.

#### Scenario: Only owner action remains
- **WHEN** the controller-derived runnable set is empty and every incomplete accepted item depends on one exact material product decision with no accepted reversible default
- **THEN** the arbiter SHALL return `product_decision_required` with `questionAction=present-product-decision` and a structured `ownerBoundary` containing only that product decision, consequences, affected item refs, and privacy-safe evidence refs
- **AND** it SHALL provide no question answers or non-product action request.

#### Scenario: Only non-product prerequisites remain
- **WHEN** the controller-derived runnable set is empty and incomplete accepted items remain blocked only by access, permission, credential, process, technical, capability, external, safety, live-attempt, writer-liveness, or budget gates
- **THEN** the arbiter SHALL return `waiting` with the exact wait kind, gate refs, and resume condition
- **AND** it SHALL carry no ownerBoundary, question action, or question answers.

#### Scenario: Pending non-product question is rejected into waiting
- **WHEN** a pending question asks for a non-product prerequisite, no human reply has occurred, and the controller-derived runnable set is empty
- **THEN** the arbiter SHALL return `waiting` with `questionAction=defer`, no selected item, and exact non-product gate refs and resume condition
- **AND** the guard SHALL reject the request before committing the waiting state.

### Requirement: Pending questions receive a race-safe escalation audit
The guard SHALL audit a pending `question.asked` or `question.v2.asked` request independently from terminal completion. It SHALL normalize and bound the exact questions/options and include the current controller-derived runnable refs before invoking the arbiter. A human reply SHALL always win. The guard SHALL answer an autonomous request only through the official question reply API under `questionAction=answer` with a current validated answer matrix. It SHALL defer any product or non-product blocker question that is not eligible to remain open only under `questionAction=defer`, by persisting pending provenance and the parked-decision or gate refs, revalidating the epoch, calling the official rejection API, confirming provenance, and then injecting one selected-item continuation or committing non-product waiting. Rejection SHALL never be an autonomous answer. Successful guard answers and deferrals SHALL be persisted as distinct privacy-safe synthetic question interventions and SHALL not become human authority.

#### Scenario: Human answers before guard reply wins
- **WHEN** a human reply resolves the request before the guard's official reply or rejection succeeds
- **THEN** the human answer SHALL close the request
- **AND** the guard SHALL remove provisional synthetic provenance, discard the escalation verdict, and perform no reply, rejection, or continuation.

#### Scenario: Human answers during audit
- **WHEN** `question.replied` arrives while the guard is auditing or applying an answer or deferral and before its official effect succeeds
- **THEN** the human answer SHALL close the request
- **AND** the guard SHALL discard the escalation verdict without a reply, rejection, continuation, or synthetic authority record.

#### Scenario: Autonomous single-select question is answered
- **WHEN** the current escalation verdict uses `questionAction=answer`, supplies exactly one offered label for an open single-select question, and no product decision boundary exists
- **THEN** the guard SHALL persist synthetic answer provenance, revalidate the current epoch, and reply to that exact request id with that label
- **AND** the original question tool call SHALL receive the selected answer and resume normally without a separate corrective prompt.

#### Scenario: Autonomous question is rejected by guard
- **WHEN** an open request has a complete validated offered-label answer under `questionAction=answer`
- **THEN** the guard SHALL NOT reject the request and SHALL use the official question reply API instead
- **AND** answer provenance SHALL remain distinct from human authority.

#### Scenario: Autonomous multi-question request is answered
- **WHEN** one open request contains multiple valid single- or multi-select questions and the current `questionAction=answer` verdict supplies a complete valid answer matrix
- **THEN** the guard SHALL apply the matrix once in original question order
- **AND** every selected label SHALL be unique within its row and exactly match an offered label.

#### Scenario: Autonomous answer is not human authority
- **WHEN** the official reply succeeds for a guard-selected answer
- **THEN** session-delivery evidence SHALL expose it as a guard question intervention with the observed answer matrix
- **AND** it SHALL not expose it in human `questionReplies` or requirement signals.

#### Scenario: Premature product question is deferred
- **WHEN** an open product question has no human reply and the current controller-derived runnable set is non-empty
- **THEN** the arbiter SHALL use `continue + questionAction=defer` with no answer matrix and one selected runnable item, and the guard SHALL reject the request once after final epoch validation
- **AND** it SHALL park the decision and continue the selected item without recording an answer.

#### Scenario: Premature non-product question is deferred
- **WHEN** an open non-product blocker question has no human reply and the current controller-derived runnable set is non-empty
- **THEN** the arbiter SHALL use `continue + questionAction=defer` with no answer matrix, one selected runnable item, and exact gate refs, and the guard SHALL reject the request once after final epoch validation
- **AND** it SHALL preserve the gate and continue the selected item without recording an answer or product decision.

#### Scenario: Empty-frontier non-product question is cleared into waiting
- **WHEN** an open non-product blocker question has no human reply and the current controller-derived runnable set is empty
- **THEN** the arbiter SHALL use `waiting + questionAction=defer` with no answer matrix or selected item, and the guard SHALL reject the request once after final epoch validation
- **AND** it SHALL commit the exact non-terminal gate and resume condition without leaving a question open.

#### Scenario: Owner-only question remains open
- **WHEN** an open product question is the exact material product decision for every incomplete item and the controller-derived runnable set is empty
- **THEN** the arbiter SHALL use `product_decision_required + questionAction=present-product-decision`
- **AND** the guard SHALL leave the current request open without auto-answering or auto-rejecting it.

#### Scenario: Question payload cannot be safely answered
- **WHEN** a question has duplicate labels, exceeds enforced bounds, receives an invalid answer matrix, lacks the required parked-decision linkage, or cannot satisfy one legal question-action schema
- **THEN** the guard SHALL fail closed without calling question reply or reject
- **AND** it SHALL expose a bounded privacy-safe diagnostic or retry only the invalid arbiter verdict according to the existing retry contract.

#### Scenario: Grind is disabled during question handling
- **WHEN** `/disable-grind`, user interruption, latest-human basis, session deletion, or another epoch change invalidates a question audit before its effect succeeds
- **THEN** no late guard reply, rejection, continuation, or synthetic authority record SHALL remain from that invalidated epoch.

### Requirement: Completion adjudication rejects premature technical-blocker stop
For a current unresolved technical or evidence blocker, the completion arbiter SHALL inspect supplied evidence for the bounded self-diagnostic disposition required by the loaded authority. When the blocker claim relies on contradictory, zero, empty, timeout, or absence-based evidence and the supplied record does not establish the affected layer, material assumptions, observer qualification, claim ceiling, and the smallest remaining safe causally distinct probe, the arbiter SHALL return `continue` with that exact diagnostic evidence gap, next action, next evidence, and stop condition. It SHALL NOT convert incomplete diagnosis, a blocked agent-chosen proof path, generic uncertainty, or an exact protected action into `allow_stop` or `product_decision_required`.

The existing structured `unresolved` and `strategyAssessment` fields SHALL carry this continuation without granting lifecycle authority. `product_decision_required` SHALL remain valid only for an exact material product decision after the runnable set is empty. A proven protected action or unavailable external capability SHALL remain a scoped gate while independent work runs and SHALL produce non-product `waiting` only when no runnable route remains.

#### Scenario: Root trusts an observer that failed its canary
- **WHEN** an enabled root reports a product or owner blocker from zero observer output, the same observer failed its positive control, and direct runtime evidence says the operation occurred
- **THEN** the arbiter returns `continue` for a bounded observer identity, configuration, or observation-path check
- **AND** the guard issues one stale-safe synthetic continuation without treating the user as required.

#### Scenario: Self-diagnostic evidence is complete and owner action is exact
- **WHEN** the current evidence includes the bounded self-diagnostic disposition, no runnable independent item remains, and every sufficient safe route requires one exact protected action or unavailable external capability
- **THEN** the arbiter returns `waiting` with the matching gate, evidence, and resume condition
- **AND** it emits no product question and does not require a redundant `troubleshooter` consultation.

#### Scenario: Blocked path has a safe alternate route
- **WHEN** one proof path remains blocked but supplied evidence identifies an unused safe route that can observe the accepted effect within the current envelope
- **THEN** the arbiter returns `continue` for that route and preserves the blocked-path claim ceiling
- **AND** evidence from the alternate route cannot be represented as clearing the blocked path.
