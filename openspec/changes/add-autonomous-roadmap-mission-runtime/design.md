## Context

See `proposal.md` for motivation and the bounded outcome. The existing `roadmap-mission` controller already owns mission parsing, transition state, archive/checkpoint sequencing, and recovery policy. The existing completion guard owns one grind-enabled root's unfinished work, bounded question answers, compaction continuation, and terminal verdict. The existing `opencode-pty` bridge exports the one pinned manager and already supplies a Web UI with live session output, input, kill, and retained buffers.

The missing production seam is an executor that turns a controller slice into a real grind root and a small operator surface that launches the controller visibly. OpenCode's plugin input exposes both the current SDK client and `serverUrl`; therefore a launcher can keep slice roots on the already-running server rather than creating a nested server whose PTYs and lifecycle would be invisible to the operator's cockpit.

This is a Material lifecycle change. It installs a new launcher, creates autonomous model sessions, changes unattended active-change admission, and adds stop/recovery behavior. It remains local and remote-free.

### Fidelity Ladder

`current source/spec/type audit -> provider-free parser/preflight and structured-result replay -> same-runtime executor against a disposable installed OpenCode server -> installed slash launch with shared PTY cockpit in a disposable project -> bounded configured-provider two-slice disposable mission`. The current rung is source/spec/type audit. The next real boundary after implementation begins is the provider-free installed CLI and preflight path. No blocker exists for that rung. The configured-provider rung is covered by the machine owner's standing authorization for bounded synthetic kit validation; safeguards are safe synthetic prompts, one disposable repository, no remote/deploy/release effects, local-commit-only checkpointing, bounded attempts, retained raw evidence, and deterministic session/process/project cleanup. Target-project operation is outside this change.

## Goals / Non-Goals

**Goals:**

- Connect the existing mission controller to fresh same-runtime grind roots with a typed terminal result.
- Let an operator start, observe, inspect, gracefully stop, or emergency-kill one campaign without a custom UI.
- Admit pre-created active changes only when the remaining mission queue, Git checkpoint, and runtime ownership make them exact and dormant.
- Preserve fail-closed writer ownership across stop, hard kill, OpenCode loss, and restart.
- Keep launcher, executor, controller, guard, archive, and PTY responsibilities narrow and independently testable.

**Non-Goals:**

- A new scheduler, workflow engine, terminal renderer, question server, archive path, completion arbiter, or roadmap parser.
- Keeping a campaign alive after its OpenCode runtime exits.
- Attaching a future root to the transcript of an interrupted or owner-required root.
- Running missions from arbitrary paths or arbitrary executor commands supplied through slash arguments.
- Parallel slice writers, cross-project campaigns, remote checkpoints, or target-specific rules.

## Decisions

### Decision 1: Reuse the current OpenCode runtime

The launcher passes the plugin-provided loopback `serverUrl`, project directory, mission id, and privacy-safe launch correlation to the controller's fixed executor argv through transient process environment or arguments that are never persisted as authority. The session executor constructs an SDK client for that URL and verifies loopback location, project identity, and required installed capabilities before creating a session.

Each attempt creates a fresh parentless root with metadata containing the mission definition digest, slice id, change id, attempt, and completion-guard state `{ grindEnabled: true, state: "running" }`. A `propose` attempt invokes the canonical proposal command for the exact requested change and bounded outcome, then apply for that change. A `continue` attempt invokes apply directly. Archive, validation, checkpoint, and successor activation remain controller-owned.

Alternative rejected: start `opencode serve` inside every executor. A nested server has a different PTY manager and cockpit, duplicates lifecycle cleanup, hides work from the operator, and adds a second crash boundary.

Alternative rejected: reuse the interactive parent root. Parent transcript and user actions would contaminate campaign authority, prevent fresh per-attempt context, and make completion-guard ownership ambiguous.

### Decision 2: The executor returns facts, not lifecycle authority

The executor writes one versioned JSON result to its result path and emits a bounded summary to stdout. The result contains:

- disposition: `completed`, `owner-required`, `paused`, `transient`, or `terminal`;
- mission/slice/attempt and current-runtime correlation digests;
- root session reference and terminal status;
- command phases invoked and their terminal evidence references;
- completion-guard state, pending-question disposition, and writer-closure evidence;
- error class, bounded original-cause diagnostic, and cleanup result.

`completed` means only that the root is terminal-clear for deterministic verification. The controller still reads OpenSpec/tasks, runs project validation, archives through the existing helper, performs readback, and checkpoints. Non-zero process exit alone does not imply retry: the controller maps the structured disposition and evidence to its existing recovery policy. Missing, malformed, mismatched, or incomplete result data is terminal/unknown and never retryable by default.

Alternative rejected: infer success from executor exit code or model text. Neither can distinguish owner-required, provider-transient, incomplete, stale, or unknown-writer outcomes.

### Decision 3: One thin slash launcher owns only operator control

A new extension registers these commands:

```text
/mission-run <mission-id>
/mission-resume <mission-id>
/mission-status <mission-id>
/mission-stop <mission-id>
```

The argument must match the existing safe mission-id grammar. Paths are derived as `opencode-dev-kit/missions/<mission-id>.json` and the fixed project adapter path; no path, executable, shell fragment, or environment override comes from the command text.

For run and resume, the extension first asks the current TUI to execute the existing `/pty-open-background-spy` command. Only after that request succeeds does it spawn the canonical `roadmap-mission` command through `SHARED_PTY_MANAGER` with a verified fixed script runtime, an argv array, project workdir, no shell, a stable mission title, and `notifyOnExit: false`. The launcher plugin tuple requires one absolute regular Node/Bun executable; the installer materializes its own Node `process.execPath`, and loader validation fails closed on a missing, non-file, or differently named runtime. No executable is selected from command text or `PATH`. The launcher keeps an in-memory `ptyID -> rootSessionID -> missionID` correlation and privacy-safe root metadata. `notifyOnExit` remains false because a manager-direct PTY has no completion-guard tool lease and would otherwise be correctly classified as an unattributed awaited PTY.

The launcher listens to the shared manager's terminal callback, updates mission/root status, and emits a TUI toast. Scheduling, retry, archive, and state transitions are never implemented in the extension. Status reconciles manager liveness with durable mission state; durable state wins only where it records a completed transition, while unknown live ownership remains blocking.

Alternative rejected: ask a model to call `pty_spawn`. Deterministic launch, safe argv, and command correlation would depend on model compliance.

Alternative rejected: add a custom dashboard or OS terminal windows. The pinned cockpit already provides session list, WebSocket streaming, input, kill, and retained output and keeps all PTYs in one observable surface.

### Decision 4: All observable work shares the cockpit

Because slice roots use the same server, any `pty_spawn` they invoke resolves the same exported manager singleton and appears in the already-open cockpit. The controller itself is one named cockpit session. Controller-owned subprocesses that use pipes rather than PTYs stream line-bounded stdout and stderr into the controller tab with stable `[slice/change/phase/stream]` prefixes; the raw bounded streams and exit facts are also written to immutable evidence files.

The contract is visibility of every mission-created PTY and every controller-owned child stream, not discovery of unrelated operating-system processes. Session and process references appear in `/mission-status`, but raw prompts, credentials, provider options, and sensitive payloads do not.

### Decision 5: Queued active changes are derived, not separately configured

The expected active set is derived from all not-yet-checkpointed slices whose operation is `continue`. Preflight requires the machine-readable OpenSpec active ids to equal that set. This avoids another allowlist that could drift from the mission.

For every expected active change, preflight proves:

- its OpenSpec status and artifacts are readable;
- its owned paths match the accepted checkpoint and contain no unattributed dirt;
- no mission transition records an active operation for it;
- no project writer lease is live or unknown;
- current-runtime session metadata, status, and pending-question evidence show no owner;
- no process reference associated with the change is running or unknown.

The provider-free phase checks definition, OpenSpec, Git, mission state, and leases. The same-runtime launch phase adds session/question/process checks before model creation. Any check that cannot be performed is `unknown`, not dormant.

Alternative rejected: one-time cleanup that deletes extra changes. Existing active changes may be intentional work and must never be removed to make unattended preflight pass.

Alternative rejected: permit any clean active change. Cleanliness does not prove campaign scope or writer dormancy.

### Decision 6: Graceful stop and emergency kill have different guarantees

`/mission-stop` records a correlated stop intent and first lets the controller's bounded stop poll close its child and writer. If the controller PTY remains running after that settle window, the launcher sends Ctrl+C as a fallback. Signal handling prevents successor activation, asks the executor to abort the active root when supported, waits within a bounded shutdown envelope, records terminal writer/cleanup evidence, and returns `paused` only when mutation authority is terminal or isolated. If closure cannot be proved, the state is `paused-unknown`.

The existing cockpit Kill control remains the immediate emergency mechanism. A hard kill may bypass controller finalization. Therefore the absence of a durable graceful-stop transition forces `paused-unknown`; resume performs process, session, lease, question, Git, and OpenSpec reconciliation and refuses a new writer until closure or isolation is proven.

An owner-required question follows the same fresh-root rule: the executor preserves a bounded handoff, resolves the pending request as no longer live through supported runtime APIs, terminates its ownership, and stops the campaign. The eventual owner response is a new mission resume instruction and creates a fresh root; it is never injected into the stale transcript.

Alternative rejected: keep an OpenCode server or pending question alive indefinitely. Runtime loss would turn that wait into ambiguous authority and contradict fail-closed restart behavior.

### Decision 7: Existing owners are extended at their responsibility boundaries

- `preflight.ts` owns queued-active and same-runtime readiness facts.
- `contracts.ts` owns the 100-slice bound and executor result schema.
- the new session-executor module owns SDK session/command/event/cleanup interaction only.
- `controller.ts` owns structured-result mapping, stop transitions, and existing lifecycle sequencing.
- the new launcher extension owns slash parsing, cockpit-open request, shared PTY spawn/correlation, status, and stop intent only.
- the completion guard, archive helper, PTY package, and OpenSpec workflows retain their existing responsibilities.

This is a `reuse + narrow extension + build-minimal glue` decision. Current-repository and platform owners are verified; broad cross-project reuse is not required for this kit runtime and remains not applicable until disposable project proof demonstrates portability. No new external dependency is introduced.

### Decision 8: Proof separates candidate, runner, evaluator, and environment

The Product Candidate is the launcher, executor, controller/preflight/contracts, installed config/validator changes, and runtime docs. The Proof Runner drives the installed OpenCode and slash-command boundary in disposable projects and captures raw facts. The Evaluator reads preserved bundles and derives scenario verdicts without driving providers or mutation. Environment Identity includes OpenCode, kit commit/diff digest, pinned PTY package, OpenSpec CLI, Node/Bun runtime, selected configured model, and disposable project digest.

Proof lanes are ordered for first real signal:

1. provider-free manifest, queued-active, structured-result, state, and evaluator replay;
2. installed same-runtime executor with a deterministic command fixture and real completion guard;
3. installed launcher/cockpit/controller lifecycle with no provider mutation;
4. one bounded configured-provider generic mission covering propose, apply, archive, local commit, question, compaction, local blocker recovery, and auto-chain;
5. preserved-corpus replay for owner-required, unlisted/dirty active, hard kill, mid-slice runtime loss, malformed result, and unknown writer.

The raw bundle records exact invocation, representative input, exit/signal, stdout/stderr, PTY list and buffers, root/session status, question/guard state, transitions, Git/OpenSpec effects, cleanup, and hashes. An evidence-only failure blocks another configured-provider attempt until evaluator and non-side-effecting finalization replay pass over all preserved bundles from that failure chain or identify the exact missing observation.

## Failure Boundaries And Diagnostics

- **Launcher/TUI:** preserve command, mission id digest, cockpit request result, manager identity, PTY ref, and original SDK cause; do not start mutation when visibility cannot be established.
- **Runtime identity:** preserve redacted loopback origin, project directory digest, capability check, and mismatch; never persist a reusable server endpoint as authority.
- **Executor/session:** preserve root ref, command phase, guard state, session status, pending-question disposition, result schema version, cleanup, and original cause/stack.
- **Controller child process:** tee bounded prefixed output to the controller PTY and retain full bounded stdout/stderr artifacts, exit/signal, PID/ref, and liveness result.
- **Stop/restart:** preserve stop source, signal, last durable transition, session/process/lease reconciliation, and exact unblock condition.
- **Queued actives:** preserve expected/observed ids, checkpoint and dirt facts, runtime ownership facts, and unknown source without deleting or editing any change.

Each error is logged once at its owning boundary. Status and toasts are concise and privacy-safe; immutable evidence carries detailed diagnostics.

## Risks / Trade-offs

- **The current TUI cannot open the cockpit** -> interactive run/resume fails before controller spawn; status remains available and no hidden mission starts.
- **The parent OpenCode runtime exits** -> its campaign and same-runtime sessions stop; durable state records or later reconciliation produce `paused-unknown`, never auto-resume.
- **Direct manager spawn lacks a completion-guard lease** -> launcher uses `notifyOnExit: false`, owns terminal callbacks, and keeps the interactive root independent from campaign completion.
- **Cockpit hard kill may leave descendants** -> emergency action is immediate but resume remains blocked until process-tree and session reconciliation prove closure/isolation.
- **Same-runtime parent and campaign roots share providers and plugins** -> roots remain parentless and metadata-correlated; only mission roots are grind-enabled by the executor.
- **Forwarded child logs can be large** -> controller output is line-bounded and rolling-buffered while immutable evidence applies explicit byte caps and truncation markers.
- **Pre-created actives can become stale between checks** -> acquire the mission writer lease, repeat OpenSpec/Git/runtime status after settle, and start only on an unchanged revision.
- **Configured-provider proof has cost and nondeterminism** -> use the minimum synthetic mission, finite attempts, preserved bundles, and offline evaluator replay before any repeat.

## Migration Plan

1. Add and validate provider-free contracts for the slice bound, structured executor result, queued-active rules, stop intent, and replay before any model call.
2. Implement the same-runtime executor and prove one grind root against a disposable installed OpenCode runtime without archive or successor expansion.
3. Implement the thin launcher against the existing PTY bridge and prove cockpit-open, visible controller output, status, graceful stop, hard-kill classification, and cleanup.
4. Integrate structured results into controller transitions, then prove one complete disposable slice before enabling a second auto-chained slice.
5. Add config/profile/doctor validation and operator documentation, then run the complete disposable configured-provider proof and critical-only SDET/validation required for the Material candidate.
6. Do not activate a consumer mission as part of this change.

Rollback stops the controller through `/mission-stop` when possible, closes the current OpenCode runtime, preserves mission state/evidence, restores the previous version-controlled kit and generated installed profile, and starts a new OpenCode process. A hard-stopped or partially completed mission remains paused/unknown and is never relabeled complete by rollback.

## Open Questions

None for the current increment.
