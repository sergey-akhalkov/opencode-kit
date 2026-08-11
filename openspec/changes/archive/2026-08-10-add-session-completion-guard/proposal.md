## Why

OpenCode root sessions can become idle after an incomplete handoff, an unnecessary question, or a claimed blocker even when safe autonomous work remains. The kit needs a runtime guard that distinguishes real asynchronous waiting from terminal delivery without asking a model to infer PTY state, then uses an independent completion arbiter only when deterministic checks prove the root session is no longer waiting on background work.

## Outcome Capsule

- **Outcome**: A root session explicitly opted into grind mode is allowed to remain stopped only after explicit user interruption, deterministic asynchronous waiting, an evidence-backed completion verdict, or an exact owner-only blocker; otherwise the guard resumes the root session with bounded continuation evidence. New roots default to ordinary unguarded chat. `/enable-grind` and `/disable-grind` control the persisted mode of only the current root. On an opted-in Windows desktop, one separate read-only terminal monitor per enabled root keeps the current guard state visible without changing root or audit-child behavior.
- **Operating Envelope**: OpenCode 1.18.15-compatible local root sessions using the kit global source, the pinned `opencode-pty` integration, built-in background child sessions, one configured hidden completion-arbiter model, Node 24+, and optional minimized PowerShell shell monitoring on an interactive Windows desktop. Main-session permission requests default to allow; specialist agent permissions remain governed by their own configurations.
- **Non-Goals**: Product release approval, RC/stable authority, remote deployment, replacing domain reviewers or SDET, generic process supervision outside OpenCode, model-based inference of PTY or background-process liveness, cloning/forking the root transcript, starting a second OpenCode server, interactive attachment to the audit child, or cross-platform terminal-window automation in this increment.
- **Non-Deferrable Invariants**: Grind defaults off for every new root; disabled roots trigger no completion audit, continuation, PTY fallback, question interception, or monitor. Disable cancels current guard work without cancelling user work; enable affects the next ordinary human revision rather than auditing its own control turn. When enabled, user interrupt wins immediately; PTY/background state is resolved programmatically before any completion-model call; synthetic guard/task/PTY messages never become user requirements; one root revision has at most one active audit; stale verdicts have no effect; human question replies win races; the same failed strategy is not repeated without new evidence satisfying its retry condition. The optional monitor is read-only and failure-isolated, receives no provider credentials, never authorizes or blocks a guard transition, opens at most once per enabled root in one runtime, starts minimized, and does not activate or steal foreground focus.
- **Observable Proof**: A disposable OpenCode root first demonstrates ordinary idle chat with zero guard child/model/continuation/window, then `/enable-grind`, programmatic PTY waiting without an arbiter call, PTY completion followed by one arbiter call, incomplete work followed by synthetic continuation, completed work followed by a Passed status, `/disable-grind` cancellation and suppression, user interrupt suppression, stale-verdict rejection, background-task waiting, question-race handling, and default main permission allow. A current Windows proof additionally demonstrates one real minimized terminal monitor for one enabled root across waiting/auditing/terminal transitions, unchanged foreground-window identity, no duplicate window on repeated status, root-correlated read-only observation of persisted runtime metadata, terminal auto-close, and unchanged guard behavior when monitor launch or storage read fails.
- **Material Residual Risks**: One model call is added to terminal root idles after deterministic preflight; retained audit children grow OpenCode session storage; the pinned deep `opencode-pty` manager integration requires a compatibility assertion; one unavailable arbiter model can leave the guard retrying with backoff until the user interrupts or availability returns. Opted-in monitoring creates a visible local OS window, one concurrent root can create one window, and PowerShell/Node/read-only database availability can remove visibility without disabling the guard.
- **Stop Line**: Stop when the bounded runtime guard, arbiter, context provenance, PTY/background integration, strategy-history routing, old-reviewer migration, per-root read-only Windows monitor, focused tests, and disposable live proof are complete. Root forks, interactive audit sessions, cross-platform terminal launchers, broader command-effect classification, additional process managers, release automation, and speculative reviewer consolidation remain outside this change.

## What Changes

- Add an explicit global completion-guard plugin with a per-root single-flight state machine, structured arbiter verdicts, synthetic continuation, status/toast reporting, indefinite configurable audit retry, and immediate user-pause handling.
- Register `/enable-grind` and `/disable-grind` as plugin-owned commands. Persist an opt-in flag per root, default new roots to disabled, suppress the control turn itself, and cancel guard-owned work immediately on disable.
- Replace cache-isolated `opencode-pty` loading with a pinned local bridge that shares the exported manager singleton with the guard. Programmatically correlate `pty_spawn`, `pty_kill`, manager transitions, and `<pty_exited>` delivery before permitting a model audit.
- Track built-in background tasks and child-session liveness as deterministic async leases. Active or unknown leases suppress completion-model calls.
- Add a hidden `session-completion-arbiter` agent that maps the root user goal, question replies, todos, changes, proof, validation, and strategy history to a versioned machine verdict without claiming RC, stable, release, or production-author authority.
- Extend `session_delivery_context` to separate human and synthetic messages, preserve guard/question provenance, and expose bounded assistant, tool, diff, async, and completion evidence needed by the arbiter.
- Enforce main-session permission requests as allowed by default through merged runtime config while preserving explicit specialist-agent restrictions.
- Persist materially distinct strategies and failed attempts in the relevant OpenSpec `history.md`, or `docs/session-strategy-history/<session-ref>.md` when no relevant change is provable. Journal-only edits do not count as product progress.
- Route proven stagnation back through the main session to the existing diagnosis-only `troubleshooter`; repeated troubleshooting requires new evidence or a different mechanism.
- Add an opt-in per-root read-only PowerShell shell monitor that observes the same OpenCode server through bounded root/retained-child metadata, shows waiting/auditing/retry/continuation/owner/pause/error/pass state, and cannot send messages or alter either session.
- **BREAKING**: Remove the active `session-delivery-reviewer` agent and its config, profile, routing, validator, test, README, and loaded-instruction references after the new guard is live-proven. Preserve archived OpenSpec evidence and feedback history as superseded historical facts.

## Capabilities

### New Capabilities

- `session-completion-guard`: Deterministic async-wait gating, independent completion arbitration, safe root-session continuation, user stop, strategy stagnation handling, and observable runtime status.

### Modified Capabilities

- `library-plugin-architecture`: Add explicit configured extension plugins, pinned shared `opencode-pty` loading, completion-guard packaging, and synthetic-safe session evidence.
- `library-config-portability`: Make the completion guard's merged runtime config allow main-session permission requests by default while retaining documented specialist restrictions and schema-valid plugin options.
- `library-model-routing`: Replace the retired delivery-reviewer route with complete configurable routing for the hidden completion arbiter in every committed profile.
- `library-instruction-artifacts`: Replace active delivery-reviewer routing with automatic completion-guard authority, define the arbiter as a machine adjudicator rather than an optional reviewer, and retain superseded historical references only in history/evidence surfaces.

## Impact

- Runtime plugin/config surfaces: `global/opencode.json.template`, machine-local config provisioning, a new explicit extension entrypoint and modules, the read-only monitor launcher/console, `global/package.json`, and the existing session context plugin.
- Agent/instruction surfaces: a new hidden arbiter, removal of the old delivery reviewer, model profiles, global and reusable routing instructions, catalogs, validators, and contract fixtures.
- Tests and proof: focused state-machine, PTY lease, synthetic provenance, structured verdict, question race, retry, restart, config, installer, and disposable OpenCode integration coverage.
- Dependency behavior: pin `opencode-pty` to the live-proven version and load it through the kit source so the PTY bridge and guard share one manager instance.
- No implementation, installation, activation, deployment, release, commit, push, or other remote operation is performed by this proposal.
