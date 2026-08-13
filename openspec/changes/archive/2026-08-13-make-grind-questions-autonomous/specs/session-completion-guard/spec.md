## MODIFIED Requirements

### Requirement: Arbiter verdicts are structured and non-lifecycle
The hidden completion arbiter SHALL return a versioned structured verdict correlated to its audit epoch. It SHALL distinguish `allow_stop`, `continue`, `owner_required`, and `user_paused`, map every current user requirement to evidence or an unresolved item, and SHALL NOT set or approve Development-Stage, RC, stable, release, deployment, or external-operation state. A pending-question audit SHALL include the exact bounded question text, ordered offered labels and descriptions, single/multiple selection mode, and custom-input policy. Its autonomous verdict SHALL include one exact offered-label answer row per question; every other verdict SHALL carry no question answers.

The verdict transport SHALL be one exact JSON text object from the configured arbiter model with no registered model tools. The plugin SHALL parse the entire trimmed text and then apply the versioned schema, audit/root/revision correlation, and pending-question answer constraints. Markdown fences, prose, trailing content, malformed JSON, unknown schema versions, correlation mismatches, unoffered or duplicate labels, wrong answer cardinality, optionless/custom-only autonomous answers, and question answers on a non-autonomous verdict SHALL enter retry with no root side effect.

#### Scenario: Root goal is complete
- **WHEN** every current uncancelled human requirement and question decision has evidence of completion or explicit user deferral
- **THEN** the arbiter MAY return `allow_stop`
- **AND** the guard SHALL show Passed status without adding a success message to the transcript.

#### Scenario: Autonomous work remains
- **WHEN** a current user requirement lacks completion evidence and a bounded autonomous next action remains inside the accepted envelope
- **THEN** the arbiter SHALL return `continue` with the requirement ref, evidence gap, prohibited repeated strategy, next evidence, and stop condition.

#### Scenario: Pending question has an autonomous exact choice
- **WHEN** every question in one pending request has at least one offered option and the supplied authority/evidence establishes a complete safe selection
- **THEN** a correlated `continue` or `allow_stop` verdict SHALL contain exactly one validated answer row per question
- **AND** it SHALL select only exact offered labels while respecting single- and multi-select cardinality.

#### Scenario: Only owner action remains
- **WHEN** independent work is complete and the remaining item requires an exact protected owner decision/action or unavailable capability
- **THEN** the arbiter SHALL return `owner_required` with a structured `ownerBoundary` containing the exact decision, reason, and privacy-safe evidence refs needed for a self-contained handoff
- **AND** it SHALL not classify optional polish or generic uncertainty as owner-required
- **AND** it SHALL not provide question answers.

### Requirement: Pending questions receive a race-safe escalation audit
The guard SHALL audit a pending `question.asked` or `question.v2.asked` request independently from terminal completion. It SHALL normalize and bound the exact questions/options before invoking the arbiter. A human reply SHALL always win. The guard SHALL answer an autonomous request only through the official question reply API with a current validated answer matrix; it SHALL never use rejection as an autonomous answer. Successful guard answers SHALL be persisted as privacy-safe synthetic question interventions and SHALL not become human authority.

#### Scenario: Human answers before guard reply wins
- **WHEN** a human reply resolves the request before the guard's official reply succeeds
- **THEN** the human answer SHALL close the request
- **AND** the guard SHALL remove any provisional synthetic provenance, discard the escalation verdict, and perform no reply, rejection, or corrective continuation.

#### Scenario: Human answers during audit
- **WHEN** `question.replied` arrives while the guard is auditing or applying an answer and before its official reply succeeds
- **THEN** the human answer SHALL close the request
- **AND** the guard SHALL discard the escalation verdict without a reply, rejection, corrective continuation, or synthetic authority record.

#### Scenario: Autonomous single-select question is answered
- **WHEN** the current escalation verdict supplies exactly one offered label for an open single-select question and no owner boundary exists
- **THEN** the guard SHALL persist synthetic provenance, revalidate the current epoch, and reply to that exact request id with that label
- **AND** the original question tool call SHALL receive the selected answer and resume normally without a separate corrective prompt.

#### Scenario: Autonomous question is rejected by guard
- **WHEN** the legacy rejection path would have handled an open request whose current escalation verdict supplies a complete validated offered-label answer
- **THEN** the guard SHALL NOT reject the request and SHALL use the official question reply API instead
- **AND** the retired reject-then-corrective-continuation behavior SHALL not reappear or be classified as a human answer.

#### Scenario: Autonomous multi-question request is answered
- **WHEN** one open request contains multiple valid single- or multi-select questions and the current verdict supplies a complete valid answer matrix
- **THEN** the guard SHALL apply the matrix once in original question order
- **AND** every selected label SHALL be unique within its row and exactly match an offered label.

#### Scenario: Autonomous answer is not human authority
- **WHEN** the official reply succeeds for a guard-selected answer
- **THEN** session-delivery evidence SHALL expose it as a guard question intervention with the observed answer matrix
- **AND** it SHALL not expose it in human `questionReplies` or requirement signals.

#### Scenario: Owner-only question remains open
- **WHEN** the arbiter proves the pending question crosses the accepted owner boundary
- **THEN** the guard SHALL leave the request open without auto-answering or auto-rejecting it
- **AND** a schema-valid structured `ownerBoundary` SHALL terminate the question audit as Owner Required rather than enter retry.

#### Scenario: Question payload cannot be safely answered
- **WHEN** a question has no offered option, duplicate labels, exceeds the enforced bounds, requires an arbitrary custom value, or receives an incomplete/invalid answer matrix
- **THEN** the guard SHALL fail closed without calling question reply or reject
- **AND** it SHALL expose a bounded privacy-safe diagnostic or retry only the invalid arbiter verdict according to the existing retry contract.

#### Scenario: Grind is disabled during question handling
- **WHEN** `/disable-grind`, user interruption, root revision, session deletion, or another epoch change invalidates a question audit before reply succeeds
- **THEN** no late guard reply, rejection, corrective prompt, or synthetic authority record SHALL remain from that invalidated epoch.

### Requirement: Guard status is observable and privacy-safe
The guard SHALL expose Disabled, Auditing, Waiting, Retrying, Question Auditing, Question Answering, Passed, Paused, Owner Required, and Error transitions through persisted status and intentional command/status toasts without adding routine Passed messages to the root transcript. Diagnostics SHALL use privacy-safe refs and SHALL not expose raw prompts, question text, selected labels, credentials, provider options, or sensitive tool output. Disabled roots SHALL NOT launch the status monitor. Successful autonomous-answer metadata SHALL retain privacy-safe request refs needed to distinguish guard interventions from human replies and SHALL fail closed before its enforced capacity is exceeded.

#### Scenario: Terminal audit passes
- **WHEN** a current completion audit returns `allow_stop`
- **THEN** the user SHALL receive a compact Passed status/toast
- **AND** no synthetic success turn SHALL be added to the root transcript.

#### Scenario: Autonomous question is being answered
- **WHEN** a current validated answer is persisted before the official reply call
- **THEN** status metadata SHALL expose Question Answering with privacy-safe correlation only
- **AND** it SHALL not expose the question or chosen labels.

#### Scenario: Synthetic provenance capacity is exhausted
- **WHEN** another autonomous answer would exceed the enforced per-root provenance capacity
- **THEN** the guard SHALL fail closed before replying
- **AND** it SHALL not evict an older ref that is required to prevent false human-authority classification.

#### Scenario: Capability mismatch blocks adjudication
- **WHEN** required OpenCode question reply, event, session, or PTY integration capabilities are missing
- **THEN** the guard SHALL display the safe capability/version failure and suppress model adjudication.
