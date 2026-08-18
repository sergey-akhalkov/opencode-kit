# Task 4.3 Collision, Rollback, And Reinstall Evidence

Date: 2026-08-17

## Final Candidate

- Controller/source/installed SHA-256: `1B607F16AF43C706249C20871AC57F6E7D5C38A75023CB8CFAA7FF5823CDA30B`
- Configuration/manifest SHA-256: `A80299795EC358DA1BB73610C2D3E8B1453B8A4AF265ED524B66E620DA7738A0`
- Final server supervisor/root/listener PIDs: `9172` / `11852` / `20556`
- Final state: one healthy authenticated elevated server running, six shortcuts installed, no proof client/listener remaining

## Unrelated Listener Collision

1. The prior managed supervisor/root/listener PIDs `24480` / `6624` / `18776` were positively matched to persisted executable/parent/listener ownership, terminated as one tree, and independently observed absent. Task state became Ready and port listener count became zero.
2. A proof-owned Node process PID `18012`, created `08/17/2026 20:27:00` from the installed Node executable, listened only on `127.0.0.1:4096` in PTY `pty_b2cc2bfe`.
3. Installed `start` exited `1` with `Port 4096 has an unverified listener; refusing to start the managed server.` PID, creation identity, executable, and listener remained unchanged.
4. Installed `restart` exited `1` with `Managed task is 'Ready', not Running.` PID, creation identity, executable, and listener remained unchanged.
5. The first capture wrapper used reserved PowerShell variable `$PID` and failed before producing the intended matrix. Immediate readback proved PID `18012` and its listener still alive and task Ready; the corrected wrapper used `$proofPid` and captured both product results without changing the proof listener.
6. The PTY was terminated through its recorded session identity with exit `0`. PID `18012` disappeared, listener count became zero, and no unrelated process was killed.

## Rollback Failure, Diagnosis, And Correction

1. Pre-effect installed `rollback --dry-run` was fully eligible. The first real rollback removed the task, all six shortcuts, and managed ordinary Alacritty file, then exited `1` with `ERR_FS_EISDIR` while attempting file-only `rmSync` on the now-empty Alacritty directory.
2. Immediate preserved-state readback found: server/listener absent; task absent; six shortcuts absent; ordinary config absent; empty Alacritty directory present; protected root, manifest, credential, source, state, protected config, backup directory, and logs intact. No unknown or user-drifted artifact was removed.
3. Root cause: Node `rmSync` without recursive directory semantics is not an empty-directory operation. Recursive removal would be broader than necessary. The source now uses `rmdirSync` only after exact emptiness readback and validates any required Alacritty backup hash in dry-run before effects.
4. `node --check`, a disposable real `rmdirSync` empty-directory probe, and `npm.cmd run validate:strict` exited `0`. The reviewed repository controller then completed only the remaining partial rollback state and restored the exact clean baseline.
5. To prove the correction independently, the fixed candidate was installed fresh in stopped state. Installed `rollback --dry-run` returned every task/controller/shortcut/config/credential check plus `alacrittyBackup: true`. The installed controller then rolled back with exit `0`, reporting all six shortcut IDs removed, task removed, prior Alacritty absence restored, and protected root removed.
6. Exact post-rollback readback matched task 1.1 for managed scope: protected root absent, task absent, ordinary Alacritty directory/config absent, six shortcut count zero, and port listener count zero.

## Repository Reinstall And Reproof

1. The documented repository command `node tools\windows\opencode-workstation.ts preflight --config tools\windows\opencode-workstation.config.json` returned `status: ready`, no collisions, exact four Git roots, six absent shortcut paths, and source/config identities.
2. The documented install command created the fixed candidate stopped with one Highest/no-trigger task, protected controller/manifest/credential/config, stable ordinary Alacritty config, and all six shortcuts. Source/installed and config/manifest hashes match; protected-root inheritance is disabled.
3. Actual Desktop Start returned candidate state `running` with supervisor/root/listener PIDs `21192` / `24104` / `19736`. A second actual Start preserved all three identities and one listener.
4. Ordinary Alacritty created stable PowerShell Core `7.6.5` from the Microsoft Store package with `pwsh.exe -NoLogo`; its proof tree was removed and listener count remained one.
5. All four actual project shortcuts were re-run one at a time. Each produced protected-config Alacritty, stable PowerShell, exact `attach http://127.0.0.1:4096 --dir <mapping>`, exact authenticated server worktree/directory, listener PID `19736`, and complete client cleanup.
6. The actual Restart shortcut exited `0`; old PIDs `21192` / `24104` / `19736` all disappeared before new `running` PIDs `9172` / `11852` / `20556` were accepted. A final actual `opencode-kit` shortcut attached through listener `20556`, returned the exact server path, and was fully cleaned up.
7. Final installed Status reports complete integrity and authenticated health `200` for OpenCode `1.18.18`. Dry-run rollback is fully eligible including backup validation. There is one listener, zero protected-config Alacritty clients, no proof collision PID, four mappings, and six shortcuts. Credential scans found zero repository/Desktop/log/process-argument hits.

## Scope And State

- No provider/model request, target-repository mutation, remote action, software install, or unrelated cleanup occurred.
- Accepted production scope through task 4.3 is complete and current for the final candidate/configuration pair.
- The first rollback failure and proof-wrapper parse failures remain preserved evidence; they are not counted as successful proof.
- Fresh critical-only Material SDET and main disposition remain tasks 5.1 and 5.2.
