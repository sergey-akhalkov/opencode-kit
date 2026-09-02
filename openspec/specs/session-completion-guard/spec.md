# session-completion-guard Specification

## Purpose
Define an opt-in root-session guard that waits for correlated asynchronous work,
adjudicates completion through bounded structured evidence, continues only within current
authority, and fails closed without interfering with user-owned work.

## Requirements

### Requirement: Root idle is guarded by deterministic preflight
The completion guard SHALL evaluate an explicitly grind-enabled parentless OpenCode root session when it becomes idle. It SHALL NOT invoke the completion arbiter until root identity, user-suspension state, compaction/guard ownership, PTY leases, built-in background leases, descendant status, and a post-settle root status recheck all prove `async-clear` for one unchanged revision. A disabled root SHALL remain ordinary OpenCode chat with no guard completion or question audit.

#### Scenario: Awaited PTY is still running
- **WHEN** a root session becomes idle with a correlated `opencode-pty` session that is `running` and `notifyOnExit` is true
- **THEN** the guard SHALL report waiting status without invoking an arbiter model
- **AND** it SHALL re-evaluate only after a deterministic PTY transition or a new human instruction.

#### Scenario: Async state is unknown
- **WHEN** an awaited PTY, background task, child status, root identity, or lease attribution cannot be resolved programmatically
- **THEN** the guard SHALL fail closed without invoking the arbiter
- **AND** it SHALL expose an actionable privacy-safe diagnostic rather than infer liveness from transcript prose.

#### Scenario: Deterministic preflight is clear
- **WHEN** the root remains idle after the settle window and every tracked lease is closed or non-awaited for the same lease generation
- **THEN** the guard SHALL create at most one completion audit for the current root revision.

### Requirement: Grind mode is explicit, default-off, and per-root
Every new root SHALL initialize with grind mode disabled unless that same root has persisted explicit enable metadata. The plugin SHALL register `/enable-grind` and `/disable-grind`. Commands SHALL affect only their correlated root, be idempotent, persist the selected mode, and suppress audit of their own control turn.

#### Scenario: Ordinary conversation remains unguarded
- **WHEN** a new or explicitly disabled root receives ordinary human messages and becomes idle
- **THEN** the guard SHALL NOT create an arbiter child, invoke an arbiter model, inject a continuation or PTY fallback, reject a question, or launch a monitor
- **AND** another root's enabled state SHALL have no effect.

#### Scenario: User enables grind
- **WHEN** the user executes `/enable-grind` in a disabled root
- **THEN** the guard SHALL persist enabled mode for that root and provide one bounded confirmation
- **AND** it SHALL begin guard behavior only for the next ordinary non-synthetic human revision, without auditing the enable command itself.

#### Scenario: User disables grind during guard work
- **WHEN** the user executes `/disable-grind` while the root is waiting, auditing, retrying, continuing, paused, or handling a question
- **THEN** the guard SHALL cancel guard-owned timers/audits/fallback intent, persist disabled mode, and perform no later guard side effect from the cancelled epoch
- **AND** it SHALL NOT kill user PTYs/tasks, interrupt the primary response, delete retained evidence, or alter another root.

### Requirement: External PTY state uses one shared live manager
The kit SHALL load the pinned `opencode-pty` plugin and completion guard from one kit-owned dependency graph so both resolve the same exported manager singleton. The guard SHALL correlate agent PTY tool calls to root sessions and reconcile live status through manager APIs and callbacks; it SHALL NOT use a model or OpenCode's unrelated built-in PTY list to decide external `opencode-pty` liveness.

#### Scenario: PTY bridge starts successfully
- **WHEN** OpenCode loads the configured PTY bridge and completion guard
- **THEN** both SHALL observe the same manager instance and the required `list`, `get`, and session-update callback capabilities
- **AND** a missing capability SHALL disable adjudication fail-closed with no model fallback.

#### Scenario: PTY exits before spawn correlation completes
- **WHEN** a PTY terminal callback arrives before `tool.execute.after` has associated its id with the creating root
- **THEN** the guard SHALL retain a terminal tombstone and close the later correlated lease
- **AND** it SHALL NOT transiently classify the PTY as running after terminal evidence.

#### Scenario: Exit notification is lost
- **WHEN** the manager reports a correlated awaited PTY terminal but no matching `<pty_exited>` synthetic message appears within the settle window
- **THEN** the guard SHALL inject one deduplicated synthetic fallback notification using the recorded terminal facts
- **AND** completion arbitration SHALL wait until that continuation is observed or becomes explicitly terminal-failed.

### Requirement: Built-in background work is a deterministic lease
The guard SHALL correlate background `task` tool state, root/child identity, descendant status, and synthetic task-result consumption. A root SHALL remain waiting while a background task is running, its terminal result is pending root consumption, or its state is unknown.

#### Scenario: Background child is running
- **WHEN** a root session is idle while a correlated background child session remains non-idle
- **THEN** the guard SHALL suppress completion arbitration and show waiting status.

#### Scenario: Background result reaches the root
- **WHEN** the child becomes terminal and the corresponding synthetic `task_result` or `task_error` starts the root continuation
- **THEN** the guard SHALL close the lease only after correlating the result marker
- **AND** it SHALL not race a completion audit into the child-to-root handoff window.

### Requirement: Completion audits are single-flight and revision-correlated
Each root revision SHALL have at most one active completion audit. Every verdict and side effect SHALL carry and validate an audit id, root ref, latest human and assistant refs, diff/todo/journal digests, and async lease generation. A stale or duplicate result SHALL have no effect.

#### Scenario: Duplicate idle events arrive
- **WHEN** `session.status: idle` and `session.idle` are both emitted for one unchanged root revision
- **THEN** the guard SHALL coalesce them into one audit epoch and one child session.

#### Scenario: User changes the task during audit
- **WHEN** a non-synthetic human message arrives before the arbiter result is applied
- **THEN** the prior verdict SHALL be marked stale
- **AND** it SHALL NOT reject a question, show Passed, or inject a continuation.

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

### Requirement: Continuations are synthetic bounded and stale-safe
For a current `continue` verdict, the plugin SHALL validate the structured fields and construct one bounded synthetic continuation. It SHALL quote arbiter content as evidence, restore the root's primary agent/model/variant/tools, and perform a final epoch comparison before `promptAsync`.

#### Scenario: Current incomplete verdict is applied
- **WHEN** a valid `continue` verdict still matches the root revision and async state
- **THEN** the guard SHALL submit exactly one provenance-marked synthetic continuation to the root
- **AND** that message SHALL not be counted as a human requirement by later audits.

#### Scenario: Verdict becomes stale before injection
- **WHEN** any correlation component changes after verdict generation
- **THEN** the guard SHALL discard the verdict without calling `promptAsync`.

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

### Requirement: User interruption suspends the guard immediately
The guard SHALL suspend a root on `MessageAbortedError`, a supported explicit session interrupt, or an unambiguous non-synthetic human stop/pause instruction. Suspension SHALL cancel guard audit/retry work and persist until a later non-synthetic human message starts a new revision.

#### Scenario: User presses interrupt
- **WHEN** the root emits a user-triggered abort while running, auditing, retrying, or continuing
- **THEN** the guard SHALL cancel its in-flight work, show Paused status, and SHALL NOT restart the root on the following idle event.

#### Scenario: Negated stop phrase is not interruption
- **WHEN** a human says an equivalent of `do not stop` or discusses/quotes the word `stop` without directing the agent to pause
- **THEN** the guard SHALL not suspend solely because the text contains a stop synonym.

### Requirement: Audit failures retry with bounded concurrency
An arbiter provider error, bounded timeout, malformed result, unknown schema version, correlation mismatch, evidence overflow, retained-child conflict, or unsupported runtime capability SHALL NOT become a completion verdict. The guard SHALL classify each failure as transient retryable, terminal input/state, stale/cancelled, or capability-blocked. Transient failures SHALL reuse only the current valid epoch child with configurable exponential backoff, finite attempt count, and at most one retry timer. Terminal, immutable, stale, or capability failures SHALL NOT enter an infinite retry loop. The arbiter call itself SHALL have a configurable timeout.

Before classifying a missing configured hidden arbiter agent/provider/model route as capability-blocked, the guard SHALL perform a short finite provider-free readiness settle. The settle SHALL create no child and invoke no model, SHALL stop on the current audit cancellation signal, and SHALL preserve the original failure as the cause when readiness remains unavailable. Exhaustion SHALL retain the existing fail-closed capability result rather than enter model-verdict retry.

#### Scenario: Arbiter provider is unavailable
- **WHEN** the configured model call fails transiently and the root has not been interrupted or revised
- **THEN** the guard SHALL show deduplicated Retrying status and retry within the configured attempt/delay limits
- **AND** exhaustion SHALL persist a resumable bounded error without another automatic model call.

#### Scenario: Fresh instance route becomes ready during settle
- **WHEN** the first provider-free route lookup cannot yet resolve the configured hidden arbiter but the same agent/provider/model route becomes available inside the readiness window
- **THEN** the guard SHALL continue the current audit using that route without consuming a model retry
- **AND** it SHALL create at most one current audit child after readiness succeeds.

#### Scenario: Route settle is interrupted or exhausted
- **WHEN** the root is interrupted during readiness settling or the route remains unavailable through the finite window
- **THEN** interruption SHALL cancel the wait without creating a child or model call
- **AND** exhaustion SHALL persist a capability failure with the last route error as its cause.

#### Scenario: Completion evidence is oversized
- **WHEN** bounded projection still produces a final serialized arbiter request above the configured byte limit
- **THEN** the guard SHALL persist a terminal evidence-overflow diagnostic with observed and allowed bytes
- **AND** it SHALL not create or retry an arbiter prompt.

#### Scenario: Root is interrupted during backoff
- **WHEN** the user interrupts before the next retry
- **THEN** the retry timer and child work SHALL be cancelled and the root SHALL remain paused.

### Requirement: No-progress strategies are not repeated
The guard and arbiter SHALL treat new accepted artifacts, terminal evidence, resolved blockers, or downstream boundary advancement as progress. A new exception, wording change, timeout change, or journal-only edit SHALL not by itself permit the same strategy to repeat. Every material attempt/failure SHALL be recorded before another strategy.

#### Scenario: Active OpenSpec change owns the strategy
- **WHEN** one relevant active OpenSpec change is proven
- **THEN** main SHALL record the attempt in that change's `history.md` with objective, approach, evidence, outcome, reason, do-not-repeat condition, and evidence-based retry condition.

#### Scenario: No relevant change is proven
- **WHEN** OpenSpec is absent or multiple changes cannot be disambiguated from evidence
- **THEN** main SHALL use `docs/session-strategy-history/<privacy-safe-session-ref>.md`
- **AND** the guard SHALL not guess a change owner.

#### Scenario: Session is stuck
- **WHEN** the same requirement gap remains without a valid untried strategy or satisfied retry condition
- **THEN** the guard SHALL require main to invoke the diagnosis-only `troubleshooter` through the normal task adapter with the recorded case file
- **AND** another equivalent troubleshooter call SHALL require new raw evidence or a distinct mechanism.

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

### Requirement: Opted-in audit monitoring is per-root, read-only, and failure-isolated
On a supported interactive Windows desktop, an enabled audit-window option SHALL launch at most one separate read-only monitor for each guarded root during one OpenCode runtime. The guard SHALL use the client supplied by the plugin runtime, and the monitor SHALL read only the root-correlated persisted session/child metadata from that same runtime database without forking a session, starting a server, attaching an interactive TUI, writing session state, invoking a model, or affecting any guard transition. Disabled, unsupported, closed, disconnected, or failed monitors SHALL leave completion behavior unchanged.

#### Scenario: Monitor opens without interrupting desktop work
- **WHEN** an enabled guard launches the first monitor for a root while another application owns foreground focus
- **THEN** the PowerShell monitor window SHALL start minimized
- **AND** the launcher SHALL preserve the existing foreground window rather than activate the monitor.

#### Scenario: Root waits for asynchronous work
- **WHEN** an opted-in root reaches deterministic Waiting before any arbiter child exists
- **THEN** one monitor window SHALL show the privacy-safe root ref, Waiting state, and bounded reason
- **AND** duplicate idle/status events SHALL not open another window.

#### Scenario: One root continues through multiple audit epochs
- **WHEN** a guarded root moves through Auditing, Retrying, Continuing, and a later Auditing epoch
- **THEN** the same monitor window SHALL observe the retained root/child state
- **AND** no retry, continuation, or retained-child reuse SHALL create another window for that root in the same runtime.

#### Scenario: Audit passes
- **WHEN** the current root reaches Passed
- **THEN** the monitor SHALL show the validated terminal state and close after the configured non-negative delay
- **AND** no success turn SHALL be added to the root transcript.

#### Scenario: Monitor is closed or unavailable
- **WHEN** the user closes the monitor, PowerShell or Node is unavailable, the root-correlated database cannot be opened read-only, or the environment is headless/non-Windows
- **THEN** the guard SHALL preserve the exact preflight/audit/verdict behavior and log at most one bounded privacy-safe monitor failure for that root/runtime
- **AND** it SHALL not reopen a manually closed or failed monitor for that root in the same runtime.

#### Scenario: Root question is pending
- **WHEN** a question audit is active
- **THEN** the monitor MAY show privacy-safe request state and owner/autonomous disposition from guard metadata
- **AND** it SHALL not clone, answer, reject, or expose an interactive copy of the root question.

### Requirement: Automatic arbiter replaces active delivery reviewer routing
The completion guard SHALL absorb the root-goal, question-decision, todo-history, changed-scope, proof, validation, exact-blocker, and requirement-matrix checks that remain relevant from the retired delivery reviewer. The active old agent and its routing SHALL be removed only after the guard has current runtime proof. Historical evidence MAY retain the old name when marked as historical or superseded.

#### Scenario: Migration completes after proof
- **WHEN** the new guard has current representative runtime proof and the active dependency closure is migrated
- **THEN** `session-delivery-reviewer` SHALL no longer be installed, routed, profiled, validated, or advertised as an active agent
- **AND** archived OpenSpec evidence and feedback history SHALL not be rewritten as if another agent produced them.

### Requirement: Completion evidence is bounded on every surface
The session-delivery projection SHALL cap human messages, question/permission events, todos and todo history, assistant/tool/validation/diff evidence, descendants, audit refs, strategy refs, and synthetic messages using explicit stable limits. Every omission or truncated text SHALL produce a bounded truncation record. The guard SHALL measure the exact final serialized request passed to the provider.

#### Scenario: Long root exceeds a surface limit
- **WHEN** a root contains more human, todo, event, or execution evidence than the configured projection permits
- **THEN** the projection returns the retained bounded subset and explicit omitted counts
- **AND** the arbiter is not given an unbounded surface.

### Requirement: Guard restart reconciles enabled roots and async ownership
On startup the guard SHALL inspect persisted grind-enabled parentless roots in its configured directory, validate root/runtime identity, reconstruct bounded retry and question provenance, reconcile PTY and background-child liveness, and schedule one settle pass for safely recoverable idle roots. A guard-owned completion-audit child left `auditing` by an interrupted runtime SHALL become terminal `stale` only when it is not referenced by the current epoch, its root ownership remains exact after re-fetch, its last update is older than the configured arbiter prompt timeout plus settle grace, and it is canonically idle. Canonical idle SHALL mean an explicit `idle` status or absence from OpenCode's successfully read active-status map; an explicit `busy`/`retry` status or an unreadable status request SHALL remain unknown. Unknown writer, lease, child, or reply state SHALL remain fail-closed with actionable status. Startup SHALL NOT infer completion or resume a root from transcript prose.

#### Scenario: Runtime restarts during retry
- **WHEN** a grind-enabled root persisted a transient retry below its attempt limit and no revision or async ownership changed
- **THEN** startup schedules at most one remaining bounded retry or settle pass
- **AND** it does not reset the attempt counter or create another child.

#### Scenario: Runtime restarts with running unleased child
- **WHEN** a child remains running but no trustworthy reconstructed lease identifies its handoff state
- **THEN** the root remains Waiting/Error with unknown ownership
- **AND** completion arbitration does not start.

#### Scenario: Runtime restarts with an old idle interrupted audit
- **WHEN** a guard-owned child is still marked `auditing`, is older than prompt timeout plus settle grace, is not current, and is explicitly idle or absent from a successfully read active-status map
- **THEN** the guard records that child as terminal `stale` without inferring a verdict
- **AND** restart recovery may apply normal retained-child rotation.

#### Scenario: Interrupted audit liveness is not safely known
- **WHEN** an `auditing` child is explicitly busy/retrying, the status request fails, the child cannot be re-fetched, or it is too recent, current, or ownership-invalid
- **THEN** the guard leaves the child unchanged
- **AND** retention remains fail-closed if no independently eligible terminal child exists.

### Requirement: Waiting async work receives bounded deterministic rechecks
Waiting roots SHALL receive a configurable bounded recheck after PTY/task transitions and while a consumed-result handoff is pending. A terminal background child whose synthetic result is not observed SHALL receive at most one deduplicated fallback marker equivalent to the PTY fallback, with exact child/root correlation. Rechecks and fallback SHALL stop on disable, interrupt, revision, deletion, terminal failure, or configured limit.

#### Scenario: Background result notification is lost
- **WHEN** a correlated background child is terminal but no matching result marker reaches the unchanged root within the configured settle/recheck envelope
- **THEN** the guard injects at most one bounded synthetic fallback using recorded terminal facts
- **AND** arbitration waits until the fallback is consumed or terminally fails.

### Requirement: Retained audit child policy is enforced
The configured retained-audit policy SHALL be implemented. A finite policy SHALL rotate or delete guard-owned children only after they are terminal and no current epoch references them. Before reporting a full finite limit, the guard SHALL quarantine an old interrupted audit as terminal `stale` only after re-fetching and proving exact root ownership, non-current identity, `auditing` metadata, prompt-timeout-plus-settle age, and canonical idle runtime status from a successfully read active-status map. `-1` MAY remain supported for explicit manual configuration but SHALL NOT be the unattended-capable default. Multiple matching children SHALL produce terminal ownership conflict unless one is deterministically current and every other child is proven terminal and quarantined.

#### Scenario: Child retention limit is reached
- **WHEN** a new audit epoch would exceed the finite retained-child limit
- **THEN** the guard quarantines only eligible old idle interrupted audits and removes or rotates only eligible guard-owned terminal children before creating the new child
- **AND** it preserves the current epoch and non-guard children.

#### Scenario: Full retention contains active or unknown children
- **WHEN** the finite limit is full and every non-current child is explicitly active, status-unreadable, too recent, or otherwise ineligible
- **THEN** the guard preserves every child and returns the existing terminal retention conflict
- **AND** it does not create an additional arbiter child.

### Requirement: Long-running guard liveness is observable
Persisted status and bounded logs SHALL include privacy-safe audit start/end time, elapsed duration, retry class and attempt/limit, request byte count, wait reason enum and recheck count, restart recovery action, retained child count, and terminal error class. Repeated identical states SHALL remain deduplicated.

#### Scenario: Root exhausts transient retries
- **WHEN** the final configured retry attempt fails
- **THEN** metadata and one owning-boundary log identify the error class, attempts, elapsed time, and manual/resume condition
- **AND** no per-minute duplicate error loop continues.

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

### Requirement: Stagnant diagnosis uses one independent consultation

When the same technical or uncertain failure chain remains after the bounded main self-diagnostic pass, no unused safe route is known, and owner-only status is unproven, the guard SHALL require one diagnosis-only `troubleshooter` consultation with the complete recorded case file. The case file SHALL include the layer classification, observed facts, assumptions, contradictions, observer-qualification state when applicable, prior probes, protected boundaries, and exact validation gate. The guard SHALL NOT require or accept another equivalent consultation without new decision-changing evidence or a causally distinct mechanism.

#### Scenario: Main pass remains inconclusive
- **WHEN** the root records a complete bounded self-diagnostic pass but cannot distinguish the remaining technical hypotheses and no unused safe route is known
- **THEN** the guard requires one correlated `troubleshooter` consultation before owner escalation
- **AND** main verifies and executes any returned authorized route rather than forwarding the consultant report as authority.

#### Scenario: Equivalent consultation already completed
- **WHEN** one correlated `troubleshooter` consultation completed for the same unchanged failure chain and no new decision-changing evidence or distinct mechanism exists
- **THEN** the guard does not request another equivalent consultation
- **AND** the unresolved disposition retains the exact missing evidence or proven owner boundary without entering a consultant loop.

### Requirement: Certified terminal roots bypass model arbitration
The completion guard SHALL support a versioned deterministic terminal certificate issued by an explicitly configured owning workflow. The certificate SHALL bind the issuer, root, current revision, async lease generation, accepted requirement identifiers, terminal disposition, and evidence references. The guard SHALL accept it only after its existing deterministic preflight proves the same root and revision are idle, unpaused, question-free, and async-clear. A valid certificate SHALL produce terminal `allow_stop` behavior without creating an arbiter child or invoking an arbiter model.

#### Scenario: Owning workflow certifies terminal completion
- **WHEN** a trusted configured owner supplies a current certificate whose root, revision, lease generation, requirements, and terminal evidence match deterministic preflight
- **THEN** the guard records a deterministic passed state with zero arbiter prompt
- **AND** the certificate and evidence references remain observable in privacy-safe status.

#### Scenario: Certificate is stale or mismatched
- **WHEN** a certificate has an unknown issuer, wrong root, stale revision, stale lease generation, missing requirement, malformed disposition, or invalid evidence reference
- **THEN** the guard does not stop from that certificate
- **AND** proceeds through normal bounded arbitration or fail-closed status according to the current root state.

#### Scenario: Root remains ambiguous
- **WHEN** no valid terminal certificate exists for an otherwise async-clear grind root
- **THEN** the guard invokes the existing hidden arbiter
- **AND** preserves structured requirement mapping, owner boundaries, retries, and continuation behavior.

### Requirement: Completion guard preserves resolved permissions
The completion guard config hook SHALL NOT replace or widen the merged top-level OpenCode permission policy. Ordinary OpenCode source precedence SHALL control main permissions, and explicit per-agent restrictions SHALL remain effective. The guard SHALL expose a privacy-safe capability diagnostic when its required operation is denied and SHALL not convert that denial into permission mutation.

#### Scenario: Project main permissions require ask
- **WHEN** project and global configuration resolve an ask-level main permission while the guard plugin is loaded
- **THEN** runtime config retains the ask-level permission
- **AND** the guard neither writes a persistent approval nor changes it to allow.

#### Scenario: Hidden arbiter remains denied
- **WHEN** the hidden arbiter is invoked under any main permission policy
- **THEN** its explicit edit, bash, task, question, skill, and external restrictions remain denied
- **AND** its model prompt receives no enabled tools.

### Requirement: Completion adjudication uses current-session facts
The bounded completion context supplied to the arbiter SHALL contain current human requirements, task state, runtime observations, validation results, questions, permissions, descendants, liveness, and truncation warnings directly from the active session. It SHALL NOT read or require a repository evidence index, retained bundle, replay corpus, or separate proof report.

The arbiter SHALL return `continue` when the current root attempts to stop with a broader result than those current facts support and a bounded autonomous action remains. It SHALL preserve narrower observations without representing an unproved requirement complete. It SHALL NOT infer semantic partitions, equivalence, non-applicability, compatibility, safety, or population closure from assistant prose, task checkboxes, aggregate test counts, or green validation.

#### Scenario: Representative completion is over-broad
- **WHEN** current-session facts contain one passing representative real case but do not establish the complete accepted scope
- **THEN** the arbiter returns `continue` with the exact missing requirement and next bounded action
- **AND** it retains the representative observation only at its exercised boundary.

#### Scenario: Complete exact requirement may stop
- **WHEN** every current human requirement has direct current-session support, accepted scope is complete, and no autonomous unresolved action remains
- **THEN** the arbiter may return `allow_stop`
- **AND** the verdict cannot widen the observed result or approve lifecycle, release, deployment, or protected effects.

#### Scenario: Current-session facts are truncated
- **WHEN** bounded projection omits an acceptance-critical requirement, runtime, validation, safety, liveness, or cleanup fact
- **THEN** the arbiter cannot infer completion and returns a conservative evidence gap
- **AND** the guard does not retry by removing another required current-session field.

### Requirement: Status convergence is finite and observable
Guard status persistence SHALL stop after at most eight convergence passes or two seconds, whichever occurs first. Successful convergence SHALL preserve current behavior. Exhaustion SHALL persist or log one privacy-safe terminal convergence diagnostic with root/audit refs, observed passes, elapsed time, and last state digest, then release the caller without another automatic persistence loop.

#### Scenario: Status stabilizes normally
- **WHEN** the desired state stops changing within the configured envelope
- **THEN** persistence writes the converged state and returns
- **AND** performs no extra pass after readback matches

#### Scenario: Status changes continuously
- **WHEN** concurrent updates prevent convergence through eight passes or two seconds
- **THEN** persistence terminates with one bounded diagnostic
- **AND** does not spin, retry indefinitely, or block unrelated roots

### Requirement: Arbiter prompts use one process-wide bounded scheduler
All completion-guard instances in one OpenCode process SHALL share a FIFO scheduler with configurable finite active and queued limits. Defaults SHALL permit at most two active arbiter prompts and 32 queued roots. A root SHALL have at most one active or queued audit epoch; cancellation, revision, disable, deletion, timeout, or terminal failure SHALL remove its queued work and release capacity.

#### Scenario: Two prompts are active
- **WHEN** a third eligible root requests arbitration under default limits
- **THEN** it waits in FIFO order without starting a provider request
- **AND** active prompt count remains two

#### Scenario: Queue capacity is exhausted
- **WHEN** another root would exceed 32 queued roots
- **THEN** it receives a bounded overload state with retry/unblock evidence
- **AND** no existing queued root is evicted or duplicated

#### Scenario: Queued root is revised
- **WHEN** a human revision invalidates a queued audit before capacity is available
- **THEN** the queued entry is removed
- **AND** no provider request starts for the stale epoch

### Requirement: Provider-bound completion evidence fits the aggregate request budget
The completion guard SHALL derive one deterministic, versioned provider-bound representation from the correlated bounded session-delivery snapshot and SHALL measure the exact UTF-8 bytes sent to the hidden arbiter. For the reviewed long-root population, the complete request SHALL fit within the configured finite request limit without silently removing human authority, pending-question facts, current or unresolved todo facts, validation outcomes, descendant liveness, truncation records, or required claim-closure fields.

Repeated representations of the same fact MAY be replaced by one canonical fact plus stable relationship or membership refs only when the guard proves the represented values agree. Such normalization SHALL NOT convert omitted evidence, conflicting values, truncated critical evidence, assistant prose, or summaries into completion evidence.

#### Scenario: Reviewed long root reaches the arbiter
- **WHEN** a correlated root has the reviewed bounded session-delivery cardinalities and four ordinary claim rows that previously produced a request above 200,000 bytes
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

### Requirement: Grind completion SHALL use a task-scoped work frontier
Each grind-enabled root SHALL expose one plugin-owned `grind_frontier` tool as the only main-to-controller write ingress for a bounded versioned frontier. The tool SHALL derive root and latest-human identity from its current execution context, validate a complete candidate before atomically replacing state under an expected server generation, and return the persisted generation plus controller-derived runnable refs. Each completion audit SHALL receive the current persisted frontier identifying accepted work items, dependencies, scoped gates, parked product decisions, progress identity, and evidence refs. The guard SHALL validate shape, bounds, human/task-basis correlation, reference integrity, and acyclicity and SHALL derive runnable items from dependency and gate state. Deterministic code SHALL NOT trust caller-supplied root/human/audit identity or infer product meaning, task dependencies, or gate semantics from prose.

#### Scenario: Independent item remains runnable
- **WHEN** one pending item is blocked by a gate and another pending item has complete dependencies and no open gate
- **THEN** the controller derives the independent item as runnable
- **AND** no verdict may pause the whole root for the blocked item.

#### Scenario: Frontier human or task basis is stale
- **WHEN** a structurally valid frontier differs from the latest non-synthetic human requirement ref or current trusted task-state digest
- **THEN** the guard performs no ordinary question, work continuation, completion, waiting, or protected effect from that frontier
- **AND** keeps at most one reconciliation-only continuation in flight while permitting a finite controller-owned correction sequence when a completed turn does not persist a current frontier.

#### Scenario: First reconciliation candidate is rejected
- **WHEN** a reconciliation turn omits `grind_frontier` or its first candidate is rejected by tool-schema or frontier validation
- **THEN** the guard preserves the last valid frontier unchanged and automatically issues a bounded correction turn for the same human/task basis
- **AND** the correction receives only a safe cause code, may repair representation without changing accepted semantics, survives controller restart within the finite attempt budget, and clears its recovery state after a valid atomic frontier update
- **AND** repeated failure exhausts visibly without an unbounded provider loop or ordinary continuation from absent or stale state.

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

### Requirement: Grind delivery checkpoints remain task scoped and non-product
After the task-scoped frontier capability is current, a grind-enabled primary session SHALL represent a due outcome-preserving delivery checkpoint as a bounded process item or process-gate dependency attached only to the affected costly work items. Main SHALL supply the semantic trigger, evidence refs, affected items, selected checkpoint action, and suppression identity; deterministic frontier code SHALL validate only structure, correlation, dependencies, gate state, and readiness and SHALL NOT infer delivery drag, cost dominance, or optimization quality.

A due runnable checkpoint SHALL complete before its dependent costly item becomes runnable. Independent accepted items SHALL remain runnable and mandatory. An incomplete checkpoint, unavailable safe optimization, or process budget SHALL NOT become `product_decision_required`; only a separately established material product or proof-scope decision may use that path after the controller-derived runnable set is empty.

#### Scenario: Checkpoint precedes one costly item
- **WHEN** main submits a current frontier with one pending process checkpoint that is a dependency of a costly item
- **THEN** the controller derives the checkpoint, not its dependent costly item, as runnable
- **AND** completion arbitration cannot select the costly item until the checkpoint is complete and every other gate is satisfied.

#### Scenario: Independent sibling drains first
- **WHEN** one lane has a due delivery checkpoint and an independent authorized sibling item is runnable
- **THEN** the controller keeps the sibling in the runnable set and prevents global waiting or product-decision handoff
- **AND** sibling completion does not satisfy the checkpoint or clear its dependent lane.

#### Scenario: Main omits a current due checkpoint
- **WHEN** supplied completion evidence establishes an unresolved delivery-checkpoint requirement but the current frontier omits or marks it complete without its stated oracle
- **THEN** the arbiter requests one bounded main-owned frontier reconciliation rather than selecting dependent costly work or completion
- **AND** deterministic code does not synthesize the missing semantic checkpoint from prose.

#### Scenario: No safe optimization is currently available
- **WHEN** the checkpoint is complete with `irreducible` or `unknown` evidence and the existing costly route remains safe and authorized
- **THEN** main may satisfy the process item and make the original route eligible under its unchanged gates
- **AND** the guard does not ask the owner to approve process continuation.

#### Scenario: Optimization requires a product decision
- **WHEN** the only proposed faster route changes accepted product behavior or proof scope while the original accepted route remains available
- **THEN** the checkpoint does not block or replace the original route solely to force the faster choice
- **AND** any parked decision follows the existing product-decision contract only when it is actually required by remaining accepted work.

### Requirement: Grind frontiers preserve leaf-first parent dependencies
For a grind-enabled root, main SHALL reconcile accepted leaf and parent work into the existing bounded frontier so each parent item depends on every required child item. A newly discovered independent prerequisite SHALL appear as a new or reopened child with current requirement and evidence refs before the affected parent can be selected again. The controller SHALL continue to derive readiness only from explicit status, dependency, and gate facts and SHALL NOT infer semantic decomposition quality, compoundness, or leaf completion from task prose.

The completion arbiter SHALL reject continuation or completion that selects a parent with an unresolved child, treats child evidence as parent proof, or stops while a dependency-valid child or independent sibling remains runnable. A due delivery checkpoint represented as a process item SHALL compose with the child dependency update and SHALL NOT create a second process gate for the same suppression identity.

#### Scenario: Parent is not runnable before every child
- **WHEN** a frontier parent depends on two children and only one child is complete
- **THEN** the controller excludes the parent from runnable refs and retains the incomplete child when its gates permit
- **AND** no arbiter verdict may select or complete the parent.

#### Scenario: New child replaces a coarse runnable parent
- **WHEN** current evidence shows that a previously runnable parent contains an unresolved independent prerequisite
- **THEN** main atomically reconciles the frontier with the new child and parent dependency under the current generation
- **AND** the parent remains unavailable until the child reaches complete with current evidence.

#### Scenario: Independent sibling remains runnable
- **WHEN** the new child is blocked by a scoped gate and another accepted item is outside its dependency cone
- **THEN** the controller keeps the independent item runnable and mandatory
- **AND** its success neither clears the child gate nor completes the parent.

#### Scenario: Frontier schema remains unchanged
- **WHEN** leaf-first state is projected through item ids, `dependsOn`, status, gate refs, requirement refs, and evidence refs
- **THEN** deterministic frontier validation and readiness derivation use the existing schema
- **AND** no hierarchy field, semantic task parser, or model-derived controller edge is required.
