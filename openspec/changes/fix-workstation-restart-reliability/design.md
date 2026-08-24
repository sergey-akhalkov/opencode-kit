## Context

See `proposal.md` for motivation. The installed controller already owns Start/Stop/Restart, fail-closed identity checks, the hidden Desktop invoker, and the tray host. Live `C:\ProgramData\OpenCodeWorkstation\logs\controller-errors.log` shows the current `restart` path calling `taskkill.exe /PID <supervisor> /T /F` and treating every non-zero exit as fatal. Decoded OEM `taskkill` text on this host is exit 128 (`данная задача не выполняется` / process already gone) and exit 255 (`не имеете разрешения` / access denied) against unmatched descendants. After that abort, `start` can wait the full 60s and fail with `Managed task is 'Ready', not Running` or supervisor identity drift because a leftover listener made `serve()` exit. The tray starts `node … restart` asynchronously, ignores further clicks while that worker lives, and on non-zero exit returns to green whenever port `4096` is still listening. The screenshot dialog is emitted only by `invoke.vbs` (Desktop Start/Restart/project shortcuts) when the controller exits non-zero.

This is a Material process-termination and authorization change. It mutates the privileged installed controller and tray helper. Apply requires the standing local-machine grant, a re-verified elevated token immediately before ProgramData repair, loopback-only effects, and rollback to the previous protected controller hash.

### Fidelity Ladder

`live controller-error and source/identity audit -> effect-free repository --help/preflight/status -> authorized stopped repair of the ProgramData controller and tray helper -> one live tray Restart happy path -> fail-closed unmatched-listener Restart -> Desktop Restart invoker path -> fresh critical-only SDET -> project-native validation`. The current rung is planning from the live log and repository source. The next real boundary after implementation begins is `node tools/windows/opencode-workstation.ts --help` (no host mutation). Host repair and live Restart remain separately authorized; safeguards are exact ProgramData paths, recorded hashes, loopback-only bind, no provider/model call, no target-repository write, one writer, fail-closed unmatched ownership, and restore-from-manifest/rollback.

## Goals / Non-Goals

**Goals:**

- Make `stopManagedServer()` succeed when the validated supervisor, server-root, and listener identities are gone, even if unmatched descendants already exited or refuse `taskkill /T`.
- Keep fail-closed refusal of drifted or unmatched listener/process identity.
- Make one tray or Desktop Restart a single replacement attempt with an honest lamp and a secret-free failure surface.
- Repair the installed ProgramData copies so the live operator entry points run the candidate.

**Non-Goals:**

- A second process-killer, Windows service, or generic supervisor.
- Parsing locale-specific `taskkill` text as the success oracle.
- Reconnecting attached TUI clients after Restart.
- Changing credential storage, bind address, tray menu shape, or repository mappings.

## Decisions

### Decision 1: Kill only the three validated managed identities

`stopManagedServer()` already resolves supervisor, server-root, and listener through `validateManagedStopState()`. After that check, terminate those PIDs individually with `taskkill /PID <id> /F` and without `/T`. Order: server-root, listener, supervisor. Killing the listener first lets `opencode serve` respawn an orphan on `4096` (live stop 2026-08-19: recorded PIDs gone, one leftover listener, task `Ready`). After the recorded kills, terminate only a leftover listener whose parent is the killed server-root/supervisor or that still descends from that server-root. Then `stopServerTask()`. Wait until those PIDs are gone and `snapshotListeners()` is empty. `restart()` keeps the existing “no leftover listener before `startServerTask()`” gate.

`serve()`'s `terminateChild` currently uses silent `taskkill /T` on the OpenCode child. Change it to terminate only that child PID so a supervisor signal cannot walk attached-client descendants.

Reuse: extend the existing stop owner. Do not add a new killer or package.

Alternative rejected: keep `/T` and ignore every non-zero `taskkill` exit. Access denied on the actual supervisor would look like success while the listener stayed up. Alternative rejected: `Stop-Process -Force` on the whole CIM descendant graph. Same over-broad blast radius that produced the live 128/255 failures. The scheduled-task invoker is `invoke.vbs`. Desktop Start/Restart must still popup on non-zero. `serve` must not: a Restart kill makes `serve` exit non-zero, the modal popup keeps the task `Running`, and `IgnoreNew` blocks the replacement. After the recorded PIDs die, also terminate the `wscript.exe` whose command line is this machine's `invoke.vbs serve`, then `Stop-ScheduledTask` until the task is not `Running`.

Alternative rejected: kill only the supervisor and rely on Windows job cleanup. Prior workstation proof required explicit descendant and listener absence because `opencode serve` orphans a second `opencode.exe` listener.

### Decision 2: Liveness after the kill is the success oracle

Do not treat `taskkill` exit 128 or garbled OEM stderr as the contract. After each targeted kill, `processAlive(pid)` decides: gone means that identity is stopped; still alive after access-denied or other non-zero is fail-closed with the original `taskkill` cause preserved. This is locale-independent and matches the existing `processAlive` helper.

Alternative rejected: parse English/Russian `taskkill` phrases. The live log is already mojibake under `encoding: "utf8"`. Alternative rejected: change `run()` globally to ignore non-zero. Other callers need fail-closed `taskkill`/`schtasks` failures.

### Decision 3: Stop a matching `starting` tree

`validateManagedRunningState()` today requires `state.status === "running"` and a listener. Live errors include Restart during `starting`, which fails before any kill and leaves the operator clicking again. For Stop/Restart only, accept `starting` when the scheduled task is Running and supervisor plus server-root identities still match the state file. Kill those recorded PIDs and the listener if one is already recorded or currently owned by that server-root. Drifted starting state still fails closed and performs no kill.

Alternative rejected: wait up to 60s for `running` then restart. That is the delay the operator already sees. Alternative rejected: leave starting as a hard error. It is a reachable happy-path race after logon and after a previous failed Restart.

### Decision 4: One in-flight tray Restart and honest failure

Keep the existing single worker and `phase === 'restarting'` guard. Remove the tray path that, on non-zero Restart, silently calls `start` when port `4096` is empty and otherwise returns to green while the old listener still lives. On worker exit: prove replacement only by a new healthy listen plus idle/green; otherwise set red, write `tray-state.json` to a failed/red color, and `ShowBalloonTip` with a secret-free “Restart failed. See …\controller-errors.log” message. A later Restart click is a new attempt, not a continuation of the failed one.

Desktop `invoke.vbs` already pops the same log pointer on non-zero exit. Keep that. Optionally prefix the popup with the mode name; do not put `taskkill` OEM text or secrets in the dialog.

Alternative rejected: make the tray invoke `invoke.vbs` so the screenshot dialog appears. That would block the WinForms thread or nest another `wscript` wait and recreate the earlier UI-freeze history. Alternative rejected: keep silent auto-start after failed Restart. That is the 60s “nothing happens” path in the live log (`start` after failed `restart`).

### Decision 5: Installed artifacts stay derived; live proof uses the operator entry points

Repository `tools/windows/opencode-workstation.ts` remains the source. The Product Candidate for Runtime Proof is the repaired ProgramData controller and tray script loaded by the tray task and Desktop Restart shortcut. Use the existing install/repair path after a verified elevated token and after the managed server is in a state the current installer accepts (stop first when the installer requires it). Rollback is the existing workstation rollback / restore of the previous protected controller hash.

Attempt limits and this stop line are revisable process controls. They do not authorize the ProgramData repair or process termination; those keep the existing owner grant, identity checks, and restoration.

### Reuse disposition

`extend` the current controller stop/restart/tray owner. `verified` local reuse: `validateManagedRunningState`, `processAlive`, `stopServerTask`, `startServerTask`, `waitForValidatedRunningState`, tray worker, `invoke.vbs` failure dialog. No new dependency. Cross-project: `not-applicable` (machine-local Windows workstation).

## Risks / Trade-offs

- **[Risk] A non-validated `opencode.exe` descendant keeps running after stop** → Accepted unless it still owns `4096`; leftover listener remains fail-closed and blocks replacement.
- **[Risk] Killing the listener PID without `/T` leaves the server-root running long enough to rebind** → Kill listener then server-root then supervisor; wait for PID and listener absence before start; fail if the port is re-owned by an unmatched process.
- **[Risk] Stopping a `starting` tree with incomplete listener identity kills the wrong process** → Require matching supervisor and server-root identities; kill only recorded PIDs plus a listener that validates as a child of that server-root.
- **[Risk] ProgramData repair while the old controller is serving** → Stop first when required; record hashes; one writer; restore previous bytes on repair failure.
- **[Risk] Balloon tip is missed and the lamp is the only signal** → Lamp stays red on failure; tooltip includes `(restart failed)`; Desktop invoker dialog remains for the `.lnk` path.
- **[Risk] Attached TUIs disconnect** → Unchanged and out of scope; operator relaunches project shortcuts.

## Migration Plan

1. Prove repository `--help` / preflight / status with no host mutation.
2. Implement targeted stop, starting-state stop, and tray failure signaling in repository source; `node --check` the controller.
3. Re-verify elevation, stop the managed server if the installer requires it, repair ProgramData controller and tray, confirm manifest hashes.
4. One live tray Restart: new PIDs, green lamp, no new `restart` error line.
5. Prove fail-closed unmatched listener and Desktop Restart through `invoke.vbs`.
6. Fresh critical-only SDET, then `node --check`, installed help/status, `npm test`, `npm run validate:strict`, and `npx openspec validate fix-workstation-restart-reliability --strict`.

Rollback: existing workstation rollback or restore of the previous protected controller/tray hashes. No commit, push, remote, or unrelated-task change.

## Open Questions

None for this increment.
