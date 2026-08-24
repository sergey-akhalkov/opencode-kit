## Why

Tray and Desktop Restart on this workstation abort with `OpenCode workstation command failed` and often need several clicks. Live `controller-errors.log` shows `restart` failing inside `stopManagedServer()` because `taskkill /T /F` returns 128 (already gone) or 255 (access denied) on unmatched descendants, after which Start can sit in `Ready` or identity-drift for up to 60s. The operator needs one Restart that actually replaces the managed server or reports a real cause.

## Outcome Capsule

- **Outcome**: On this Windows workstation, one tray or Desktop Restart of a positively identified managed server stops only that server's validated supervisor, server-root, and listener identities, proves port `4096` is free, starts a different healthy authenticated listener, and either returns the `opencode-server` lamp to green or shows one secret-free failure that names the controller-error log. The operator does not need a second Restart click to finish that same attempt.
- **Operating Envelope**: Current installed OpenCode workstation on this machine: loopback `127.0.0.1:4096`, elevated shared-server task, tray host, Desktop Start/Restart invoker, local ProgramData controller and logs. No new bind, credential scheme, repository mapping, or remote endpoint.
- **Non-Goals**: Windows service packaging; killing or reconnecting attached TUI/client trees; changing authentication or credential storage; extra tray menu items; suppressing fail-closed refusal of unmatched listeners; committing, pushing, deploying, or publishing; changing other kit capabilities.
- **Non-Deferrable Invariants**: Terminate only positively matched managed identities; refuse unmatched or drifted process/listener ownership; never start a replacement while a prior managed listener still owns `4096`; credential never appears in arguments, tray state, dialogs, or logs; unelevated processes cannot modify privileged runtime material; Desktop and tray Restart keep the same ownership contract.
- **Observable Proof**: Through the live tray Restart menu on the installed workstation, one click replaces supervisor/server-root/listener PIDs, returns the lamp to green, and leaves `controller-errors.log` without a new `operation: restart` error. A second proof injects an already-exited validated child condition or uses the current host tree and still completes. A failure path (unmatched listener or refused identity) shows one secret-free dialog/balloon naming the log and does not kill the unmatched process.
- **Material Residual Risks**: Attached clients still disconnect across a successful Restart. A descendant that is not in the validated identity set may keep running after stop; that is accepted unless it still owns `4096`, which remains fail-closed. Repair of the installed ProgramData controller requires an elevated stopped install/repair.
- **Stop Line**: Finish when targeted stop, already-gone success, in-progress-start replacement, one-click tray/Desktop Restart, cause-preserving tray failure, live host proof, focused validation, and Material critical SDET are complete. Do not add a service, client reconnect, or extra tray commands.

## What Changes

- Change Restart/Stop to terminate only the validated supervisor, server-root, and listener process identities instead of `taskkill /T` over the whole descendant graph.
- Treat already-exited validated identities as successful stop of those PIDs; keep access-denied or live unmatched ownership as fail-closed errors.
- Allow Restart/Stop of a matching in-progress `starting` managed tree instead of failing with `Managed server state is 'starting'`.
- Keep one in-flight Restart from tray; extra clicks do not launch a second controller.
- On Restart failure, the tray lamp stays red and shows a secret-free balloon that names `controller-errors.log`. It MUST NOT return to green merely because port `4096` is still listening.
- Repair/reinstall the installed ProgramData controller and tray helper so the live operator entry points load the candidate. No **BREAKING** public CLI mode or repository mapping change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `local-opencode-workstation`: Restart/Stop terminate only validated managed identities; already-gone validated PIDs are not controller failures; Restart of a matching starting tree completes replacement; one operator Restart is one attempt; tray Restart failures stay red and surface the same secret-free log pointer as the Desktop invoker.

## Impact

- Repository owner: `tools/windows/opencode-workstation.ts` (`stopManagedServer`, `restart`, `start`, `validateManagedRunningState`, derived tray script, invoker diagnostics).
- Installed artifacts after authorized repair: `C:\ProgramData\OpenCodeWorkstation\opencode-workstation.ts`, `tray.ps1`, and hashes in the protected manifest.
- Existing spec `openspec/specs/local-opencode-workstation/spec.md`.
- Proof/evidence under the change and, if a new repeated runner is required, `tools/proofs/**` inventory. No new package dependency.
- Unrelated active change `add-autonomous-roadmap-mission-runtime` is not in scope.
