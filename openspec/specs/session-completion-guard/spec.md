# session-completion-guard Specification

## Purpose
TBD - created by archiving change add-session-completion-guard. Update Purpose after archive.

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

For a current unresolved technical or evidence blocker, the completion arbiter SHALL inspect supplied evidence for the bounded self-diagnostic disposition required by the loaded authority. When the blocker claim relies on contradictory, zero, empty, timeout, or absence-based evidence and the supplied record does not establish the affected layer, material assumptions, observer qualification, claim ceiling, and the smallest remaining safe causally distinct probe, the arbiter SHALL return `continue` with that exact diagnostic evidence gap, next action, next evidence, and stop condition. It SHALL NOT convert incomplete diagnosis, a blocked agent-chosen proof path, or generic uncertainty into `allow_stop` or `owner_required`.

The existing structured `unresolved` and `strategyAssessment` fields SHALL carry this continuation without granting lifecycle authority. A structured owner boundary SHALL remain valid only when evidence proves the exact protected action or unavailable external capability and no unused safe goal-preserving route remains.

#### Scenario: Root trusts an observer that failed its canary
- **WHEN** an enabled root reports a product or owner blocker from zero observer output, the same observer failed its positive control, and direct runtime evidence says the operation occurred
- **THEN** the arbiter returns `continue` for a bounded observer identity, configuration, or observation-path check
- **AND** the guard issues one stale-safe synthetic continuation without treating the user as required.

#### Scenario: Self-diagnostic evidence is complete and owner action is exact
- **WHEN** the current evidence includes the bounded self-diagnostic disposition and proves that every sufficient safe route requires one exact protected owner action
- **THEN** the arbiter may return `owner_required` with the existing structured owner boundary
- **AND** it does not require a redundant `troubleshooter` consultation.

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

### Requirement: Completion adjudication preserves claim-evidence closure
When a current human requirement or active OpenSpec outcome contains a triggered broad claim, the bounded completion evidence supplied to the arbiter SHALL include the current claim identifier, class, accepted outcome reference, population and coverage basis, production and comparison paths, environment and real-oracle status, unresolved material observations, evidence-lane references, independent-challenge status, disposition, and maximum supported claim. Missing or truncated closure evidence SHALL remain an explicit gap.

The arbiter SHALL return `continue` when the current root attempts to stop with a broader claim than the supplied closure supports and a bounded autonomous closure or honest artifact correction remains. It SHALL preserve a narrower supported result without representing the original broad requirement complete. It SHALL NOT infer semantic partitions, equivalence, non-applicability, compatibility, safety, or population closure from assistant prose, task checkboxes, aggregate test counts, or green validation.

#### Scenario: Representative completion is over-broad
- **WHEN** completion evidence contains a passing representative real case but the current finite-population or phase claim has incomplete matching rows
- **THEN** the arbiter returns `continue` with the exact claim-evidence gap and next bounded closure action
- **AND** it retains the representative case only at its supplied claim ceiling.

#### Scenario: Complete exact claim may stop
- **WHEN** every current human requirement has matching supported closure, current evidence, completed accepted scope, and no autonomous unresolved action
- **THEN** the arbiter may return `allow_stop`
- **AND** the verdict cannot widen the supplied maximum claim or approve lifecycle, release, deployment, or protected effects.

#### Scenario: Closure evidence is truncated
- **WHEN** bounded projection omits an acceptance-critical population, path, oracle, unresolved-observation, or disposition field
- **THEN** the arbiter cannot infer completion and returns a conservative evidence gap
- **AND** the guard does not retry by removing another required closure field.

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
