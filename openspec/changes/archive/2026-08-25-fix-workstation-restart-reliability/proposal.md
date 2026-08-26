## Why

Tray and Desktop Restart on this workstation abort with `OpenCode workstation command failed` and often need several clicks. Live `controller-errors.log` shows `restart` failing inside `stopManagedServer()` because `taskkill /T /F` returns 128 (already gone) or 255 (access denied) on unmatched descendants, after which Start can sit in `Ready` or identity-drift for up to 60s. The operator needs one Restart that actually replaces the managed server or reports a real cause.

## Outcome Capsule

- **Outcome**: On this Windows workstation, one tray or Desktop Restart of a positively identified managed runtime stops only its validated supervisor, OpenCode server-root/listener, and Graphify root/listener identities, proves ports `4096` and `4097` are free, starts different healthy authenticated OpenCode and Graphify listeners, and either returns the `opencode-server` lamp to green or shows one secret-free failure that names the controller-error log. The operator does not need a second Restart click to finish that same attempt.
- **Operating Envelope**: Current installed OpenCode workstation on this machine: loopback OpenCode `127.0.0.1:4096`, loopback Graphify `127.0.0.1:4097`, elevated shared-server task, tray host, Desktop Start/Restart invoker, local ProgramData controller and logs. No new bind, credential scheme, repository mapping, or remote endpoint.
- **Non-Goals**: Windows service packaging; killing or reconnecting attached TUI/client trees; changing authentication or credential storage; extra tray menu items; suppressing fail-closed refusal of unmatched listeners; committing, pushing, deploying, or publishing; changing other kit capabilities.
- **Non-Deferrable Invariants**: Terminate only positively matched managed identities; refuse unmatched or drifted process/listener ownership; never start a replacement while a prior managed listener still owns `4096` or `4097`; neither credential appears in arguments, tray state, dialogs, or logs; unelevated processes cannot modify privileged runtime material; Desktop and tray Restart keep the same ownership contract.
- **Observable Proof**: Through the live tray Restart menu on the installed workstation, one click replaces the validated OpenCode and Graphify runtime identities, returns the lamp to green only after both authenticated services are healthy, and leaves `controller-errors.log` without a new `operation: restart` error. The Desktop shortcut proves the same replacement contract. The unmatched-listener path refuses ownership, stays red, and leaves the unmatched process alive; offline critical tests cover already-gone and matching-starting branches without another host mutation.
- **Material Residual Risks**: Attached clients still disconnect across a successful Restart. A descendant that is not in the validated identity set may keep running after stop; that is accepted unless it still owns `4096` or `4097`, which remains fail-closed. Repair of the installed ProgramData controller requires an elevated stopped install/repair.
- **Stop Line**: Finish when targeted stop, already-gone success, in-progress-start replacement, one-click tray/Desktop Restart, cause-preserving tray failure, live host proof, focused validation, and Material critical SDET are complete. Do not add a service, client reconnect, or extra tray commands.
- **Automation Dividend**: required - the inventoried `tools/test-workstation-restart-critical.ts` regression catches targeted-stop, ownership-refusal, starting-state, tray-signaling, and credential-boundary regressions in project-native validation.
- **Claim And Evidence Scope**: Exact-case only for candidate `8e403f654255d4dc9e85f6d17b23613ecdc98a55ac8126c2bb83124f1a6f4dd9` on this workstation through retained tray, unmatched-`4096`, Desktop, offline SDET, and validation evidence. This does not claim other workstations, live unmatched-`4097` injection, live starting-state injection, or Windows balloon rendering.

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

- `local-opencode-workstation`: Restart/Stop terminate only validated managed OpenCode and Graphify identities; already-gone validated PIDs are not controller failures; Restart of a matching starting tree completes replacement; one operator Restart is one attempt; tray Restart failures stay red and surface the same secret-free log pointer as the Desktop invoker.

## Impact

- Repository owner: `tools/windows/opencode-workstation.ts` (`stopManagedServer`, `restart`, `start`, `validateManagedRunningState`, derived tray script, invoker diagnostics).
- Installed artifacts after authorized repair: the protected controller, shared tools, configuration module, tray helper, and their manifest hashes under `C:\ProgramData\OpenCodeWorkstation`.
- Existing spec `openspec/specs/local-opencode-workstation/spec.md`.
- Proof/evidence under the change and, if a new repeated runner is required, `tools/proofs/**` inventory. No new package dependency.
- Unrelated active change `add-autonomous-roadmap-mission-runtime` is not in scope.
