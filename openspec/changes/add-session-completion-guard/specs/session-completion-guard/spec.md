## ADDED Requirements

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
The hidden completion arbiter SHALL return a versioned structured verdict correlated to its audit epoch. It SHALL distinguish `allow_stop`, `continue`, `owner_required`, and `user_paused`, map every current user requirement to evidence or an unresolved item, and SHALL NOT set or approve Development-Stage, RC, stable, release, deployment, or external-operation state.

The verdict transport SHALL be one exact JSON text object from the configured arbiter model with no registered model tools. The plugin SHALL parse the entire trimmed text and then apply the versioned schema and audit/root/revision correlation checks. Markdown fences, prose, trailing content, malformed JSON, unknown schema versions, and correlation mismatches SHALL enter retry with no root side effect.

#### Scenario: Root goal is complete
- **WHEN** every current uncancelled human requirement and question decision has evidence of completion or explicit user deferral
- **THEN** the arbiter MAY return `allow_stop`
- **AND** the guard SHALL show Passed status without adding a success message to the transcript.

#### Scenario: Autonomous work remains
- **WHEN** a current user requirement lacks completion evidence and a bounded autonomous next action remains inside the accepted envelope
- **THEN** the arbiter SHALL return `continue` with the requirement ref, evidence gap, prohibited repeated strategy, next evidence, and stop condition.

#### Scenario: Only owner action remains
- **WHEN** independent work is complete and the remaining item requires an exact protected owner decision/action or unavailable capability
- **THEN** the arbiter SHALL return `owner_required` with a structured `ownerBoundary` containing the exact decision, reason, and privacy-safe evidence refs needed for a self-contained handoff
- **AND** it SHALL not classify optional polish or generic uncertainty as owner-required.

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
The guard SHALL audit a pending `question.asked` request independently from terminal completion. A human reply SHALL always win. The guard MAY reject the request only after a current arbiter verdict proves the decision is autonomous; guard rejection SHALL be recorded separately from user decisions and followed by an explicit synthetic provenance correction.

#### Scenario: Human answers during audit
- **WHEN** `question.replied` arrives before the guard transitions the request from open to guard-rejecting
- **THEN** the human answer SHALL close the request
- **AND** the guard SHALL discard the escalation verdict without rejection or corrective continuation.

#### Scenario: Autonomous question is rejected by guard
- **WHEN** the current escalation verdict proves a safe decision is available without owner authority and the request remains open
- **THEN** the guard SHALL reject that exact request id, wait for the root rejection turn to settle, and inject a synthetic continuation stating that the guard rather than the user rejected it
- **AND** the rejection SHALL never appear in `questionReplies` as a human answer.
- **AND** a correlated `continue` or `allow_stop` escalation verdict SHALL both count as autonomous when neither reports an owner boundary.

#### Scenario: Owner-only question remains open
- **WHEN** the arbiter proves the pending question crosses the accepted owner boundary
- **THEN** the guard SHALL leave the request open without auto-answering or auto-rejecting it.
- **AND** a schema-valid structured `ownerBoundary` SHALL terminate the question audit as Owner Required rather than enter retry.

### Requirement: User interruption suspends the guard immediately
The guard SHALL suspend a root on `MessageAbortedError`, a supported explicit session interrupt, or an unambiguous non-synthetic human stop/pause instruction. Suspension SHALL cancel guard audit/retry work and persist until a later non-synthetic human message starts a new revision.

#### Scenario: User presses interrupt
- **WHEN** the root emits a user-triggered abort while running, auditing, retrying, or continuing
- **THEN** the guard SHALL cancel its in-flight work, show Paused status, and SHALL NOT restart the root on the following idle event.

#### Scenario: Negated stop phrase is not interruption
- **WHEN** a human says an equivalent of `do not stop` or discusses/quotes the word `stop` without directing the agent to pause
- **THEN** the guard SHALL not suspend solely because the text contains a stop synonym.

### Requirement: Audit failures retry with bounded concurrency
An arbiter provider error, timeout, malformed result, unknown schema version, or correlation mismatch SHALL NOT become a completion verdict. Retryable audit failures SHALL reuse the same retained child for the epoch with configurable exponential backoff on one configured model. There SHALL be at most one retry timer per root epoch.

#### Scenario: Arbiter provider is unavailable
- **WHEN** the configured model call fails and the root has not been interrupted or revised
- **THEN** the guard SHALL show deduplicated Retrying status and retry according to the configured backoff
- **AND** it SHALL not resume the main session without a valid verdict.

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
The guard SHALL expose Disabled, Auditing, Waiting, Retrying, Passed, Paused, Owner Required, and Error transitions through persisted status and intentional command/status toasts without adding routine Passed messages to the root transcript. Diagnostics SHALL use privacy-safe refs and SHALL not expose raw prompts, credentials, provider options, or sensitive tool output. Disabled roots SHALL NOT launch the status monitor.

#### Scenario: Terminal audit passes
- **WHEN** a current audit returns `allow_stop`
- **THEN** the user SHALL receive a compact Passed status/toast
- **AND** no synthetic success turn SHALL be added to the root transcript.

#### Scenario: Capability mismatch blocks adjudication
- **WHEN** required OpenCode or PTY integration capabilities are missing
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

### Requirement: Main permission requests default to allow
The completion-guard runtime SHALL set the merged top-level OpenCode permission policy to `allow` without invoking a permission model or writing persistent permission replies. Explicit per-agent restrictions for the hidden arbiter and other specialist roles SHALL remain effective.

#### Scenario: Main requests a tool permission
- **WHEN** a main-session tool would otherwise produce an ask-level permission request under project configuration
- **THEN** the merged guard runtime SHALL permit the request without stopping for user input.

#### Scenario: Arbiter attempts a denied capability
- **WHEN** the hidden arbiter attempts edit, task dispatch, question, or another capability denied by its agent definition
- **THEN** the per-agent restriction SHALL remain denied despite the top-level allow default.

### Requirement: Automatic arbiter replaces active delivery reviewer routing
The completion guard SHALL absorb the root-goal, question-decision, todo-history, changed-scope, proof, validation, exact-blocker, and requirement-matrix checks that remain relevant from the retired delivery reviewer. The active old agent and its routing SHALL be removed only after the guard has current runtime proof. Historical evidence MAY retain the old name when marked as historical or superseded.

#### Scenario: Migration completes after proof
- **WHEN** the new guard has current representative runtime proof and the active dependency closure is migrated
- **THEN** `session-delivery-reviewer` SHALL no longer be installed, routed, profiled, validated, or advertised as an active agent
- **AND** archived OpenSpec evidence and feedback history SHALL not be rewritten as if another agent produced them.
