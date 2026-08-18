# Task 5.2 Main SDET Disposition And Critical Correction

Date: 2026-08-18

## Candidate Transition

- SDET-inspected candidate: `1B607F16AF43C706249C20871AC57F6E7D5C38A75023CB8CFAA7FF5823CDA30B`
- Main-confirmed defect: `WS-CR-01`, authenticated health accepted before local listener ownership
- Final corrected repository/installed candidate: `E9ADB0FD0992CB479343BB2A5DBE87679EC21172E14E6780EE376F5A1073ECCF`
- Configuration remains: `A80299795EC358DA1BB73610C2D3E8B1453B8A4AF265ED524B66E620DA7738A0`

## Independent Reproduction

Main positively matched and stopped only the recorded managed supervisor/root/listener tree. A bounded proof-owned loopback process then returned a healthy-shaped response without exposing or persisting any credential value.

The inspected installed candidate returned:

- operation `start`;
- status `reused`;
- health status `200`;
- version `proof-impostor`;
- stale prior managed state despite the recorded managed PIDs being absent.

The proof process recorded one `/global/health` request with Basic Authorization present. This independently confirmed the SDET claim and classified it as a reachable critical current-outcome defect: endpoint response shape had been trusted before task/process/listener ownership. The proof process was terminated by its exact PID/command identity, the port became free, and the real managed server was restored before production editing.

## Correction

1. `validatedManagedHealth` now calls `validateManagedRunningState` before reading/sending the health credential.
2. Start refreshes process/listener state after manifest validation, accepts reuse only after full task/candidate/supervisor/root/listener correlation, and waits for validated persisted running state before its health check after task startup.
3. Status and Launch refresh and validate the managed runtime immediately before any health check or client spawn.
4. Restart relies on its validated stop path, then waits for validated new running state before health and requires old-tree absence as before.
5. `serve` now waits for exactly one `127.0.0.1` `opencode-serve` listener descending from the spawned managed server root, with unchanged root creation/path/command identity, before readiness. It rechecks the same listener after health.
6. No package, protocol, endpoint, repository mapping, shortcut UX, password storage, or external behavior was added.

## Main Runtime Proof

- Source syntax and `npm.cmd run validate:strict` passed before each stopped repair.
- A plain unrelated listener made installed Start, Status, valid Launch, and Restart each exit `1` with task/ownership mismatch. The process and listener identities stayed unchanged; no protected-config Alacritty client appeared.
- The proof listener was removed by its PTY/PID identity and the port was observed empty before managed Start.
- Real Start reached validated `running` state with one listener. Repeated actual Desktop Start preserved all three managed PIDs.
- All four actual project shortcuts produced exact mapped `attach http://127.0.0.1:4096 --dir <path>` clients against one unchanged listener and were fully cleaned.
- Actual Desktop Restart removed every old recorded PID before accepting a new validated running tree; a post-Restart actual attach succeeded and was cleaned.
- After the final fresh-snapshot correction, candidate `10808B...` repeated actual Start, representative exact attach, actual Restart with old-tree absence, and the complete unrelated-listener Start/Status/Launch/Restart rejection matrix.
- Final running server PIDs are `9328` / `23356` / `25260`; one listener and six shortcuts remain; no proof client/listener remains.

## Initial Matrix Disposition

- `WS-CR-01`: reproduced, classified critical, corrected, and re-proven. Requires fresh corrected-candidate SDET before terminal disposition.
- `WS-H01`: live authentication rejection evidence remains green; corrected ordering narrows rather than weakens it.
- `WS-H02`: ACL evidence remains green; no production ACL mutation.
- `WS-H03`: prior live secret scans were zero; correction removes the confirmed network disclosure path and adds no logging/argv persistence.
- `WS-H04`: stale and unrelated listener identity remains fail-closed; correction adds validation to more modes.
- `WS-H05`: actual Restart old-tree absence remains green on the corrected candidates.
- `WS-H06`: fixed allowlist/parser behavior unchanged and remains green.
- `WS-H07`: all four exact mapped directories were re-proven after correction.
- `WS-H08`: rollback code and fully eligible dry-run are unchanged.
- `WS-H09`: no implicit server fallback; unrelated-listener Launch now fails before client spawn.
- `WS-H10`: strict config/manifest authority is unchanged.

Task 5.2 remains open until a new fresh SDET inspects the final corrected candidate and main records its terminal matrix disposition.

## Later Critical And Concurrent Corrections

- Fresh SDET on `82BD5B...` identified `WS-CR-02`: ownership validation thrown from the serve readiness retry bypassed spawned-child cleanup. Main confirmed the control-flow gap. The complete readiness loop is now inside the same `terminateChild()` cause-preserving catch used by other startup failures. Actual Start/Restart old-tree absence and post-Restart attach remained green.
- Owner evidence exposed the previously omitted concurrent-client requirement. General controller error logging was installed, then exact concurrent proof reproduced a single health-timeout launcher failure while the server remained healthy. Candidate `14CD0165...` now uses bounded health retry with fresh ownership validation per attempt. Two fresh actual `.lnk` clients were proven alive concurrently on one unchanged listener, with first-client survival after second-client cleanup.
- Final current server after complete lifecycle cleanup correction remains healthy with supervisor/root/listener PIDs `20944` / `9512` / `25172`; six shortcuts remain and no proof client remains. Owner windows were preserved.

## Terminal Fresh SDET

- Session/task: `ses_febe5f9dcffexcohff2FqE31Nx`
- SDET identity: `fresh-sdet-child-xai-grok-4.6-workstation-2026-08-18-e9adb0`
- Effective Model: `xai/grok-4.6`
- Inspected candidate: `E9ADB0FD0992CB479343BB2A5DBE87679EC21172E14E6780EE376F5A1073ECCF`
- Terminal state: `no-critical-risk`
- Test changes: none

The final SDET independently matched repository/installed/config/manifest/state hashes, current task/process/listener/shortcut/ACL facts, and fully eligible rollback dry-run. It traced every health path through ownership, every post-spawn throw/rejection through the outer exact-child cleanup boundary, the bounded concurrent health retry, Restart ownership, allowlist/directory, rollback, fallback, and strict config behavior. It found no reachable critical incident.

Parked non-critical limitation: if the spawned OpenCode root has already exited while an independently surviving descendant remains, `terminateChild` cannot address that descendant through the dead root PID. No such orphan is observed on the current tree or preserved corrected-candidate proof; normal Restart/rollback retain their separately persisted process/listener identity checks. This unconfirmed edge does not extend the accepted scope.

All SDET rows now have main disposition. Task 5.2 is complete.
