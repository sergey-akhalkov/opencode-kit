## Context

The current kit has two useful but disconnected pieces. `session_delivery_context` reconstructs root user prompts, question replies, permission replies, and todo history for an optional delivery reviewer. `opencode-pty` injects a future `<pty_exited>` prompt into the parent session when a background process exits. Neither piece prevents a root session from becoming idle with unfinished work, and the current delivery reviewer is intentionally optional and forbidden from returning a completion verdict.

OpenCode 1.18.15 exposes the event and session surfaces needed for a runtime controller: root/child identity, `session.status`, `session.idle`, `session.error`, message and question events, child sessions, structured output, synthetic text parts, session metadata, `promptAsync`, and TUI toast. The installed kit dependencies are currently version-skewed from the CLI, so this change must pin and prove the exact v2 client surface it uses.

`opencode-pty` 0.3.6 exports `manager`, `manager.list/get`, and session-update callback registration, but the configured npm plugin is currently resolved into an OpenCode package-cache copy. A kit plugin that imports another copy would observe an empty manager. The runtime must therefore load both the PTY plugin and guard from one kit-owned dependency graph.

The owner selected these operating decisions:

- Load the guard plugin for every parentless root, but default grind behavior off. `/enable-grind` opts in only the current root and `/disable-grind` returns it to ordinary chat.
- Resolve PTY and built-in background waiting programmatically before any completion-model call.
- Keep useful cycles unlimited with `maxCycles: -1`, but never repeat a failed strategy without new evidence satisfying its retry condition.
- Retry an unavailable or malformed arbiter indefinitely on one configured model with exponential backoff.
- Retain every arbiter child session.
- Persist strategy attempts/failures in a relevant OpenSpec history or a per-session docs fallback.
- Require the main session to invoke the existing diagnosis-only troubleshooter when a strategy is stuck.
- Immediately suspend on user interrupt or an explicit stop/pause instruction.
- Allow main-session permission requests by default without model-based permission analysis.
- Replace and remove the active `session-delivery-reviewer`, while preserving historical evidence that names it.
- On the owner's Windows machine, opt in to one read-only minimized PowerShell shell monitor per guarded root. Keep the portable template disabled, do not fork the root, do not attach an interactive TUI to the audit child, and do not start a second OpenCode server.

This is a Material session-lifecycle, concurrency, and loaded-policy change. Implementation must use the qualification path, real disposable OpenCode runtime proof, fresh critical-only SDET after proof and accepted-scope completion, and full applicable repository validation.

## Goals / Non-Goals

**Goals:**

- Prevent a root session from silently remaining idle while an accepted user requirement is incomplete and safe autonomous work remains.
- Avoid completion-model calls while the root is waiting for an awaited PTY, built-in background task, child session, compaction continuation, or another known synthetic continuation.
- Give one fresh hidden arbiter enough privacy-safe evidence to return a versioned, correlated machine verdict.
- Resume the exact root agent/model/tool context once when an audit proves continuation is required.
- Preserve user authority over interruption and human question replies.
- Detect no-progress strategy repetition and route a complete case file through the main session to `troubleshooter`.
- Keep runtime status observable without polluting the transcript on successful audits.
- Keep a dismissed toast from becoming the only audit visibility by offering a separate, failure-isolated, read-only per-root monitor window.
- Migrate useful delivery checks into one automatic mechanism and remove active duplicated reviewer routing.

**Non-Goals:**

- Deciding whether a product is RC, stable, releasable, deployed, or accepted for external operations.
- Replacing final-candidate, domain, code-quality, test-coverage, architecture, SDET, or production-author roles.
- Inferring PTY or background liveness from model prose.
- Classifying arbitrary command effects or using a model to grant permissions.
- Supervising non-OpenCode process managers or remote workers.
- Rewriting archived OpenSpec evidence or historical feedback that accurately names the retired reviewer.
- Solving future OpenCode or `opencode-pty` versions that fail the pinned capability contract.
- Forking full root transcripts, exposing model chain-of-thought, permitting monitor input, or implementing non-Windows terminal launchers.

## Decisions

### 1. Load PTY and guard from one explicit kit dependency graph

Add an exact `opencode-pty` dependency to `global/package.json`. Replace the npm-spec plugin entry with a kit extension bridge that imports the PTY plugin from this dependency. Load a second explicit completion-guard extension from the same config. Both modules then resolve the same exported `opencode-pty/plugin/pty/manager` module and singleton.

The guard performs a startup capability assertion for the pinned OpenCode v2 client and PTY manager functions it uses. A missing capability disables completion adjudication, emits an actionable error status/toast, and does not fall back to model inference.

Alternative considered: observe only `pty_spawn` and `<pty_exited>` transcript messages. Rejected because a swallowed notification, immediate exit race, kill through the PTY UI, or plugin restart can leave an incorrect lease.

Alternative considered: reconcile through `client.pty.list()`. Rejected because that API describes OpenCode's built-in PTY subsystem, not the external `opencode-pty` manager used by this kit.

Alternative considered: import the package-cache manager directly. Rejected because cache paths and module identity are not portable or stable.

### 2. Use a deterministic async lease registry before any completion audit

Maintain one registry per root session. A lease contains a stable type, external id, creating tool call, root id, runtime generation, awaited flag, status, notification state, and privacy-safe timestamps/refs.

PTY lease behavior:

- `tool.execute.before/after` correlates `pty_spawn` to the exact root, output PTY id, `notifyOnExit`, timeout, and manager record.
- Only `notifyOnExit: true` creates an awaited lease. A long-running server with `notifyOnExit: false` does not prevent completion auditing merely because the process remains alive.
- Manager callbacks and `manager.list/get` are authoritative for live process status.
- An exit callback received before spawn correlation creates a terminal tombstone that the later tool result resolves without reopening the lease.
- On terminal status, the guard waits a bounded settle window for the normal `<pty_exited>` synthetic prompt. If no matching prompt appears, it emits one deduplicated synthetic fallback from the manager record.
- A running awaited PTY with unknown root attribution blocks completion adjudication fail-closed and emits an actionable status.

Built-in task lease behavior:

- Background `task` tool metadata, child parent ids, child statuses, and synthetic `task_result`/`task_error` markers create and close deterministic leases.
- A non-idle descendant, an open background tool record, a terminal child whose result has not been consumed by the root, or an unreadable state blocks completion adjudication.

The guard rechecks root idle status and the lease generation after the settle window. Only a second `async-clear` observation can launch an arbiter.

### 3. Model one per-root single-flight state machine

Each root is in exactly one state:

```text
disabled
  -> running (after /enable-grind and the next ordinary human revision)
running
  -> settling-idle
  -> waiting-async | auditing | paused
auditing
  -> passed | continuation-pending | owner-required | audit-retrying | stale
continuation-pending
  -> running
question-pending
  -> question-auditing -> human-replied | guard-rejected | owner-required
any guard-owned state
  -> disabled (/disable-grind)
```

An audit epoch records `auditID`, root session ref, latest human message ref, latest assistant message ref, session diff digest, todo digest, async lease generation, and strategy-journal digest. Duplicate idle/status events coalesce into one epoch. Before rejecting a question, showing a terminal result, or calling `promptAsync`, the guard compares the current epoch to the inspected epoch. Any changed component makes the verdict stale and side-effect free.

Child-session idle events never trigger root adjudication. Guard-owned synthetic prompts are tagged and cannot start another audit until the resulting root turn reaches a new assistant revision.

New roots initialize `grindEnabled: false`. The flag is persisted in root `completionGuard` metadata so an explicitly selected mode survives a process restart for that root; absence of the field remains disabled. The plugin config hook registers `/enable-grind` and `/disable-grind` without unsupported top-level config. The command hook changes only the correlated root, replaces the command template with one bounded synthetic confirmation, and suppresses completion adjudication for that control turn. The next ordinary non-synthetic human message clears command suppression.

Disable aborts the active audit/retry timer, clears guard-owned lease/fallback state and pending question-correction intent, and prevents idle, PTY fallback, question rejection, continuation, status monitor, or arbiter model work until re-enabled. It does not interrupt the primary response, kill user PTYs/tasks, delete retained evidence, or alter other roots. Enable starts tracking only subsequent tool/background work; already-running untracked work is not guessed into a lease.

### 4. Expand session evidence without treating synthetic input as user intent

Keep the session-delivery context projection as the single evidence source and extend its schema version. After deterministic preflight, the controller reads the same production projection, validates its root ref and schema, applies a bounded input limit, and embeds the redacted snapshot as data in the correlated audit request. The arbiter receives no registered tools. The projection separates:

- `humanMessages`: non-synthetic root user text and direct user session inputs.
- `syntheticMessages`: compaction, PTY, background-task, guard, and other machine-generated input with provenance.
- `questionReplies`: human replies only.
- `questionInterventions`: guard rejection and request state, never presented as user answers.
- Current and historical todos.
- Bounded final assistant text, tool calls/status/results, patch/diff paths and digests, validation evidence, child/background state, audit history refs, and truncation warnings.

Message ids, session ids, paths, credentials, and secret-shaped text continue through the privacy-safe redaction layer. Full human prompts remain available after redaction because they define the accepted goal. Large execution evidence is bounded deterministically and carries explicit truncation metadata.

Session-input/message duplicates are merged by stable evidence identity. Synthetic text never enters requirement-signal detection.

### 5. Use one hidden machine arbiter with a versioned structured verdict

Create hidden subagent `session-completion-arbiter`. It is read-only, cannot dispatch agents, cannot ask the user, and receives the controller-captured session-delivery evidence as bounded redacted input without registered tools. Model and variant remain in committed profiles rather than agent frontmatter. The default quality-independent route is `xai/grok-4.5` with `high`; single-model profiles remain complete.

The arbiter transport is one exact JSON text object, not OpenCode's `format: json_schema` synthetic function. The controller parses the entire trimmed assistant text with `JSON.parse`; Markdown fences, prose, trailing text, malformed JSON, or substring extraction are rejected. Only the existing versioned schema and audit/root/revision correlation parser can turn that object into a verdict. This preserves the configured XAI route while keeping malformed output fail-closed.

The plugin creates one retained child per audit epoch with root `parentID`, guard metadata, exact model/agent identity, and a structured-output JSON schema. Retries reuse that child.

The verdict envelope includes:

```text
schemaVersion
auditID
rootSessionRef
inspectedRevision
verdict: allow_stop | continue | owner_required | user_paused
goalSummary
requirementMatrix[]
unresolved[]
strategyAssessment
ownerBoundary
evidenceRefs[]
evidenceGaps[]
confidence
```

`allow_stop` means the current root turn may remain idle; it does not approve a lifecycle stage. `continue` requires at least one current unsatisfied user requirement, concrete evidence, and a bounded safe next action. `owner_required` requires an exact protected decision/action or unavailable capability, evidence that independent work is complete, and a self-contained handoff. Optional polish, speculative hardening, and non-critical residual risk cannot force continuation.

Unknown fields are ignored only within the same schema version. Unknown versions, invalid enums, missing correlation, malformed or non-exact JSON output, model errors, and timeouts enter audit retry rather than being interpreted as a verdict.

### 6. Resume roots with a plugin-constructed synthetic prompt

The arbiter does not author a free-form instruction prompt. The plugin validates structured fields and constructs a bounded system-controlled continuation containing the exact unresolved requirement refs, observed gaps, prohibited repeated strategies, journal path, required next evidence, and stop condition. Arbiter text is quoted as evidence rather than trusted as executable instruction.

The injected text part is `synthetic: true` with stable guard provenance. `promptAsync` restores the latest root primary agent, model, variant, and inherited tools. The continuation is submitted only after the final epoch CAS check and only once for that epoch.

Passed audits produce status/toast only. Owner-required verdicts cause the main session to render the existing self-contained owner handoff contract; the arbiter never impersonates a human answer.

### 7. Audit pending questions separately from terminal completion

`question.asked` starts an escalation audit while the root tool call is pending. The audit receives the request id, exact question/options, root evidence, protected-boundary contract, and current independent-work state.

If the arbiter proves the question is autonomous, the guard transitions the request atomically from `open` to `guard-rejecting`, calls the v2 reject API only if no human reply has won, records guard provenance, waits for the root to become idle after OpenCode reports the rejection, and injects a corrective continuation stating that the guard, not the user, rejected the question.

If the request is owner-only, the guard leaves it open. If `question.replied` arrives first, the human reply wins, the child result becomes stale, and no rejection or continuation occurs.

### 8. Grind mode is explicit per-root opt-in

The installed plugin is infrastructure, not consent to autonomous completion scanning. Every new root starts disabled. `/enable-grind` enables deterministic preflight, completion/question arbitration, continuation, status monitor, and guard-owned PTY fallback only for the current root. `/disable-grind` cancels those guard-owned effects and restores ordinary OpenCode behavior for that root. Both commands are idempotent and leave sibling roots unchanged.

Alternative considered: globally enable every root from plugin config. Rejected because ordinary exploratory conversation should not incur completion-model calls, autonomous question interception, or monitor windows.

Alternative considered: make the toggle process-global. Rejected because multiple concurrent roots can have different user intent and one chat must not silently change another.

### 9. User interruption is an unconditional suspension

`MessageAbortedError`, the supported session interrupt event, or an unambiguous non-synthetic human stop/pause instruction suspends the root immediately. The detector covers explicit Russian and English imperatives while rejecting negated forms such as `do not stop` and `ne ostanavlivaysya` equivalents, quotations, and discussion of the term.

Suspension cancels in-flight audit/retry work, closes guard-owned continuation intent, shows `Guard paused`, and prevents idle adjudication. Only a later non-synthetic human message starts a new root revision and clears suspension.

### 10. Default main permissions to allow without permission arbitration

The guard's config hook sets the merged top-level permission policy to `allow`. It does not call a model, inspect commands, set durable `always` replies, or maintain a permission state machine. Explicit per-agent restrictions in hidden arbiter, reviewer, SDET, worker, and troubleshooter definitions remain authoritative after merged config resolution and must be proven through `opencode debug agent` plus a disposable permission request.

This choice intentionally removes permission-effect classification from the change. Instruction-level protected-boundary and remote-operation rules remain separate model authority, not claims about an OS sandbox.

### 11. Make stagnation evidence-driven and repository-visible

The arbiter fingerprints the current requirement gap, attempted mechanism, and terminal evidence. A repeat of the same strategy is allowed only when new evidence satisfies the previous entry's explicit retry condition or invalidates the prior result.

The main session writes every material attempt/failure before another strategy:

- A proven relevant active change uses `openspec/changes/<change>/history.md`.
- Otherwise use `docs/session-strategy-history/<privacy-safe-session-ref>.md`.

Entries contain objective, approach, evidence, outcome, reason, do-not-repeat condition, and evidence-based retry condition. Journal-only changes are excluded from product progress and candidate mutation.

When no untried strategy is supported, the guard continuation requires main to invoke `troubleshooter` through the normal `task` adapter with the complete case file. The next audit verifies the task call and report. Another troubleshooter call requires new raw evidence or a distinct mechanism.

### 12. Retry arbiter failures in the same retained child

Audit failures use configurable exponential backoff on one configured model. Defaults are `initialDelayMs: 2000`, multiplier `2`, and `maxDelayMs: 60000`; `maxCycles` defaults to `-1`; `retainAuditSessions` defaults to `-1`. Retry state is stored in child metadata and reconstructible by listing retained children after plugin startup. No separate temp/state directory is introduced.

Only one retry timer exists per root epoch. A human message, interrupt, root deletion, plugin disposal, or stale revision cancels it. Toast state changes are deduplicated so repeated failures do not create per-attempt UI noise. Main is never resumed without a valid current verdict.

### 13. Migrate the old reviewer only after current runtime proof

First add the context schema, hidden arbiter, runtime guard, deterministic tests, and disposable proof while the existing reviewer remains available. After the candidate guard proves PTY waiting, audit, continuation, pass, interruption, and question handling, migrate active catalogs/profiles/contracts/routing and delete `global/agents/session-delivery-reviewer.md`.

Preserve archived OpenSpec artifacts and feedback ledgers. Mark active feedback/catalog references as superseded where they remain for historical interpretation. The automatic arbiter is not added to the shared optional-reviewer contract and cannot be manually used as stage approval.

### 14. Observe each enabled root through one read-only PowerShell monitor

The monitor is an optional diagnostic sidecar, not a fork, agent, reviewer, task result, or completion authority. The controller continues to own deterministic preflight, retained-child creation, exact-JSON validation, CAS, question races, continuation, and terminal state. The guard uses OpenCode's provided in-process-capable plugin client. The monitor independently performs only read-only SQLite queries for the root and children in the same persisted OpenCode runtime database, then renders privacy-safe root/audit/child refs plus bounded state fields already persisted by the guard.

The portable plugin tuple contains an `auditWindow` object with `enabled: false`, `mode: "read-only-monitor"`, `scope: "per-root"`, `terminal: "powershell-shell"`, and `closePassedAfterMs: 15000`. The owner's machine-local kit config opts in with `enabled: true`. Unsupported mode/scope/terminal values are rejected by kit validation and disable monitor launch without weakening the guard.

The launcher runs only on `win32`, starts at most once for a root during one server runtime when the root first reaches Waiting, Auditing, Question Auditing, Retrying, Error, Owner Required, or Passed, and starts one minimized PowerShell console with a single encoded bootstrap and stable privacy-safe title. The hidden launcher polls for that exact title, applies `SW_SHOWMINNOACTIVE`/`SWP_NOACTIVATE`, and restores only a foreground window actually displaced by the monitor. It launches a plain Node console from the kit source rather than `opencode attach`; OpenCode 1.18.15 exposes no read-only attach mode. The plugin opens one random short-lived local named-pipe handoff. The encoded bootstrap contains only the monitor script path and opaque pipe name. The first reader receives a bounded raw root id, correlated absolute database path, and close timeout in memory; the pipe then closes. Provider keys, server credentials, and unrelated process environment are never placed in the handoff, inherited by the console, printed, or placed in plaintext argv.

The console opens the root-correlated OpenCode database read-only, polls the root's `completionGuard` metadata and retained guard child at a bounded interval, and redraws one compact screen. It exposes no write path and never calls prompt, update, question, tool, model, or mutation endpoints. Passed closes after the configured delay; Continuing/Running remains open for the next epoch; Owner Required, Paused, and Error remain until manual close; root deletion or database unavailability produces a terminal diagnostic and exits. Closing the window has no product effect and the launcher does not reopen it for that root in the same runtime.

Monitor spawn, executable discovery, connection, render, and close failures are diagnostic-only. They log once with the safe root ref and original bounded error cause, but cannot change guard state, trigger retry, suppress an arbiter, inject a continuation, or claim Passed. Headless, non-Windows, and disabled environments continue to use toast, metadata, and logs.

Alternative considered: fork the root and run the audit in a visible TUI. Rejected because a fork copies unbounded transcript data, does not return a result to root automatically, increases prompt-injection/privacy surface, shares the worktree, and can recursively trigger the guard.

Alternative considered: `opencode attach` to the retained child. Rejected because the pinned CLI is interactive and has no `--read-only`; accidental input could mutate child history or cause model cost. A controller-owned read-only console provides persistent visibility without introducing an authority path.

Alternative considered: Windows Terminal as the explicit host. Rejected after alias, `Start-Process`, encoded-command, and direct package-executable captures all failed to create an observable command process from the plugin context while the same console/pipe path worked directly. Preserve those do-not-repeat conditions in `history.md`; the owner selected the minimized PowerShell shell host.

## Failure Boundaries And Diagnostics

- PTY manager capability mismatch: fail closed, no model, error toast with safe version/capability names.
- Root/child identity lookup failure: fail closed for that session, no parent assumption.
- Unknown async lease: waiting status with lease type/ref, no model call.
- Exit notification failure: bounded transcript check, one deduplicated guard fallback notification.
- Structured-output or provider failure: retry state in child metadata with safe attempt/next-time diagnostics.
- Stale audit: record discarded correlation refs without injecting or notifying success.
- Root continuation failure: preserve SDK error/cause and return to retryable continuation-pending state; do not claim delivery.
- Question race: record terminal winner by request id and discard the loser.
- Journal ambiguity: use the docs fallback; never guess among multiple changes.
- Monitor launch/connect/render failure: log once with privacy-safe root/runtime refs and continue the unchanged guard path; do not retry-spawn the window for that root in the same runtime.

Diagnostics never print raw session ids, prompts, credentials, provider options, sensitive payloads, or full command output. Owning-boundary errors retain their original cause and stack in local logs.

## Risks / Trade-offs

- **[Risk] Deep `opencode-pty` manager export changes** -> Pin the exact package, assert capabilities at startup, test the bridge against the installed package, and fail closed rather than silently falling back.
- **[Risk] Every terminal root idle adds model latency and cost** -> Run deterministic preflight first, debounce duplicate idle events, use one retained child per epoch, and expose audit status.
- **[Risk] Ordinary conversation unexpectedly starts autonomous scans** -> Default every new root to disabled, require explicit per-root `/enable-grind`, suppress the control turn, and make `/disable-grind` abort guard-owned work immediately.
- **[Risk] Unlimited retries never recover from a permanent provider/config error** -> Preserve the owner's selected indefinite backoff, make suspension immediate, show persistent but deduplicated error status, and prove configuration compatibility before live use.
- **[Risk] Retained child sessions grow the OpenCode database** -> Preserve the selected retain-all behavior, store bounded evidence, and report child count in diagnostics without auto-deleting history.
- **[Risk] Question rejection is rendered as user dismissal by OpenCode** -> Preserve guard provenance, serialize the request state, and inject an explicit correction after rejection.
- **[Risk] Broad main permission allow overrides project asks** -> Make the behavior explicit in config/spec/docs and prove specialist per-agent restrictions remain effective.
- **[Risk] Strategy history changes pollute worktree and progress detection** -> Write only on material attempts/failures and exclude journal-only paths from product progress.
- **[Risk] Multiple simultaneous root sessions share one PTY manager** -> Correlate every agent-spawned PTY by tool call/root; block on awaited unattributed sessions instead of guessing.
- **[Risk] Active PTY at OpenCode restart loses manager ownership** -> Reconcile retained lease evidence with the new runtime generation; unresolved liveness remains unknown and suppresses model audit until a human resumes or resolves it.
- **[Risk] Removing the old reviewer breaks validators and profiles** -> Perform the removal as the final production mutation after guard proof, then update the complete active dependency closure and validate historical exclusions.
- **[Risk] Monitor windows become intrusive or multiply** -> Portable default off, machine-local opt-in, exactly one launch per root/runtime, one retained window across retries/continuations, and terminal auto-close on Passed.
- **[Risk] A visible audit terminal becomes an input/authority path** -> Use a read-only SQLite console, not a fork or `opencode attach`; expose no write or prompt/update path and treat every monitor failure as diagnostic-only.
- **[Risk] Child environment leaks provider credentials** -> Build an allowlisted environment, keep credentials out of the handoff, and pass only OS launch essentials through environment; never print environment or place monitor state in plaintext argv.
- **[Risk] A new shell steals focus or interrupts desktop work** -> Launch the PowerShell console minimized and qualify the real shell boundary by comparing foreground identity and window show state.

## Migration Plan

1. Align the kit plugin/SDK dependency with the supported OpenCode 1.18.15 v2 API and pin `opencode-pty` in the kit global dependency graph.
2. Add the local PTY bridge, guard modules, context schema changes, and hidden arbiter without removing the existing reviewer.
3. Add focused deterministic tests and run disposable no-model PTY/background preflight proof.
4. Run the full representative guard happy path through root idle, child audit, and root continuation.
5. Complete accepted guard behavior, fresh critical-only SDET, and applicable validation.
6. Migrate profiles, validators, instructions, catalogs, and tests; delete the active old reviewer only after current proof exists.
7. Re-run affected runtime proof, SDET only if the qualification continuation rule permits it, validation, installer/config checks, and local handoff.
8. Add explicit default-off per-root grind commands and prove disabled ordinary chat before re-running enabled behavior.
9. Add the opt-in read-only per-root monitor, prove its real Windows launch and failure isolation, run a fresh critical SDET for the expanded outcome, and freeze the next monotonic RC only after current validation.

Rollback before activation restores the prior explicit `opencode-pty` package entry and removes the new extension entries, leaving the old reviewer intact until the final migration step. After migration, rollback restores the old reviewer/config/routing from the pre-change candidate and removes the guard as one coherent local change; archived history is not rewritten.

## Open Questions

None for the current increment. Exact debounce and audit timeout defaults may be tuned from disposable runtime evidence without changing the accepted behavior, provided async unknown remains fail-closed and user interruption remains immediate.
