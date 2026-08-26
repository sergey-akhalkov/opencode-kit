## Why

The kit already has a durable roadmap controller and a grind-enabled completion guard, but it still lacks the installed runtime that turns one accepted mission into observable OpenCode sessions without operator-driven slice commands. The missing bridge forces manual orchestration and can hide nested runtime activity, so the next increment must connect the existing owners while keeping every launched terminal visible and locally stoppable.

## Outcome Capsule

- **Outcome**: From an interactive OpenCode root, an operator can launch or resume one project-contained mission of at most 100 already accepted slices; the kit executes each slice in a fresh grind-enabled root on the current OpenCode server, creates or continues the named OpenSpec change, applies and archives it, records authorized local commits, and advances automatically until a terminal mission disposition.
- **Operating Envelope**: Local Windows OpenCode runtime with the kit plugins loaded, the pinned shared `opencode-pty` manager, a loopback current-runtime `serverUrl`, one versioned project-contained mission and adapter, safe mission/change identifiers, serialized mutation, configured model providers, local repository effects, and disposable generic qualification projects. Interactive launch and resume require the existing PTY cockpit to open before work starts.
- **Non-Goals**: Product-roadmap invention, model-generated successor campaigns, arbitrary command or path execution, a second scheduler/arbiter/archive implementation, a custom terminal dashboard, hidden nested OpenCode servers, remote push/deploy/release, target-project-specific behavior, automatic continuation after unknown mid-slice liveness, or preserving an owner-required question as a live server wait.
- **Non-Deferrable Invariants**: The mission goal and ordered slice set remain immutable; only declared dependency closure may be added within an accepted slice; every mutation-capable owner is correlated and serialized; every PTY is exposed through the existing cockpit; non-PTY child output is streamed into its owning controller PTY; owner-required, unknown writer, hard kill, runtime loss, and mid-slice crash stop fail closed; protected effects remain unauthorized; no remote operation occurs.
- **Observable Proof**: Through the installed OpenCode entry point in a disposable generic repository, open the existing PTY cockpit, launch a configured two-slice mission by slash command, observe the controller and agent-created PTYs plus prefixed child output, complete propose/apply/archive/local-commit transitions, and inspect terminal state, evidence, cleanup, and no-remote effects. Separately attributed current provider-free or local lanes prove bounded question/compaction behavior, local-blocker recovery, graceful stop, hard-kill fail-closed behavior, queued-active acceptance, unlisted-active rejection, and restart reconciliation without representing those deterministic partitions as one configured runtime execution.
- **Material Residual Risks**: Same-runtime session lifecycle and PTY correlation may differ across OpenCode versions; hard process termination may leave child liveness unknown; model/provider failure can pause a slice; visibility covers PTYs and forwarded child streams rather than arbitrary OS processes; cockpit/browser availability is platform-dependent and interactive launch therefore fails closed when it cannot be established.
- **Stop Line**: Finish when the installed same-runtime slash launcher, generic grind session executor, queued-active preflight, structured dispositions, operator cockpit/status/stop controls, fail-closed recovery, disposable proof, focused tests, validators, and operator documentation are complete. Do not add campaign generation, cross-project scheduling, remote effects, another UI, or target-specific adapters.

## What Changes

- Add a project-neutral mission session executor that connects to the launcher's current loopback OpenCode server, creates one fresh grind-enabled parentless root per slice, invokes the canonical propose/apply commands, observes terminal guard/session state, and returns a bounded structured disposition with correlated evidence references.
- Extend mission preflight to accept only explicitly listed, clean, dormant active OpenSpec changes that correspond exactly to remaining `continue` slices; reject unlisted, dirty, running, ambiguous, or ownership-unknown changes.
- Add a thin slash-command launcher for run, resume, status, and stop. It opens the existing `opencode-pty` cockpit before interactive work, starts the canonical controller as one named shared-manager PTY, correlates that PTY to mission/root state, and delegates all scheduling and recovery to `roadmap-mission`.
- Keep all slice roots on the current OpenCode runtime so their PTYs share one cockpit. Require non-PTY child processes to forward bounded, prefixed stdout/stderr to the controller PTY and retain full diagnostics in mission evidence.
- Add graceful stop between or during slices and classify hard cockpit kill, runtime loss, unknown child liveness, or mid-slice crash as fail-closed pause/terminal evidence before any resume.
- Add disposable, project-neutral runtime proof and validation for happy-path auto-chaining, propose and continue slices, questions, compaction, local blocker recovery, archive and local commit, visible PTYs, listed dormant actives, rejection paths, and interruption recovery.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `unattended-roadmap-orchestration`: Add the installed same-runtime grind executor, visible operator launcher and stop surface, bounded queued-active preflight, and fail-closed structured runtime dispositions needed to execute the existing mission contract autonomously.

## Impact

- Mission CLI and owners under `global/bin/roadmap-mission.ts` and `global/bin/roadmap-mission/`.
- New kit extension for mission slash commands, using `PluginInput.serverUrl` and the shared manager exported by `global/extensions/opencode-pty-bridge.ts`.
- OpenCode config templates, profile installation/validation, doctor readiness, and operator documentation for the installed launcher/executor contract.
- Existing `unattended-roadmap-orchestration` requirements and disposable proof tooling under `tools/proofs/`.
- The pinned `opencode-pty` Web UI is reused without a second dashboard or dependency. No public network API, persisted product data, remote repository state, or consumer-specific source is changed.
