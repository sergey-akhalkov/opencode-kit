# Task 4.2 Launchers And Restart Runtime Evidence

Date: 2026-08-17

## Candidate And Initial Server

- Controller candidate: `6FE34AFF839D1E0171E059ADA29AF03ECA4757C41C8D5921490E934DF23F5145`
- Configuration: `A80299795EC358DA1BB73610C2D3E8B1453B8A4AF265ED524B66E620DA7738A0`
- Initial supervisor/root/listener PIDs: `14880` / `16748` / `16264`
- Initial listener count: one on `127.0.0.1:4096`

## Actual Project Shortcuts

Each actual Desktop `.lnk` was invoked without `-Wait`. The proof snapshotted existing Alacritty PIDs, accepted exactly one new root with the protected config and expected working directory, captured its descendants/tokens/commands and authenticated server path, then terminated only that new Alacritty tree and proved every captured PID absent before continuing.

| Repository | Alacritty PID | Stable PowerShell PID | Attach PID(s) | Server worktree/directory | Listener PID |
|---|---:|---:|---|---|---:|
| `opencode-kit` | 23668 | 15148 | 9708, 25432 | `D:\home\sergey-akhalkov\opencode-kit` | 16264 |
| `pmac-emulator` | 9588 | 12364 | 25168 | `D:\mekha\mtronics\pmac-emulator` | 16264 |
| `controller-gateway-service` | 18348 | 6140 | 10284, 14260 | `D:\mekha\mtronics\controller-gateway-service` | 16264 |
| `windows-ui-automation` | 14680 | 10544 | 22648, 17316 | `D:\mekha\mtronics\windows-ui-automation` | 16264 |

For all four captures:

1. Alacritty used `C:\ProgramData\OpenCodeWorkstation\alacritty.toml`, the exact mapped `--working-directory`, stable `pwsh.exe`, and `-NoLogo -NoProfile -NoExit`.
2. The resolved PowerShell executable was the stable Microsoft Store `7.6.5` package, not Windows PowerShell or Preview.
3. Every observed Alacritty, PowerShell, and OpenCode attach process had an elevated token.
4. Every OpenCode client command contained `attach http://127.0.0.1:4096 --dir <exact-mapped-path>` and no server password.
5. Authenticated `/path?directory=<mapped-path>` returned the exact worktree and directory.
6. Listener PID remained `16264`; additional listener count was `0`. No per-client server was created.
7. Cleanup removed every captured client tree before the next shortcut. Target repositories were not modified and no provider/model request was made.

## Actual Desktop Restart

The actual `OpenCode Server - Restart.lnk` completed with exit `0`.

- Candidate remained `6FE34AFF839D1E0171E059ADA29AF03ECA4757C41C8D5921490E934DF23F5145`.
- Old supervisor/root/listener PIDs `14880` / `16748` / `16264` all disappeared; remaining old PID count was `0`.
- New supervisor/root/listener PIDs were `24480` / `6624` / `18776`.
- All three identities changed.
- Returned persisted state was `running`; exactly one listener existed and its live owner matched recorded PID `18776`.

## Post-Restart Reattachment And Cleanup

The actual `opencode-kit` shortcut then created Alacritty PID `7940` and attach PIDs `21224` and `19980` with the exact endpoint and `--dir D:\home\sergey-akhalkov\opencode-kit`. Authenticated server path returned that same worktree/directory and the only listener remained PID `18776`. The complete client tree was removed afterward.

Final installed Status reported complete integrity, healthy authenticated OpenCode `1.18.18`, one running Highest/no-trigger task, one listener, four mappings, and six shortcuts. Unauthenticated `/global/health` returned `401`. A process-name-qualified independent check found zero remaining protected-config Alacritty clients. The earlier unqualified command-line search counted its own observer because the observer command contained the config path; the process-name-qualified follow-up disproved a product orphan.

## State

- Task 4.2 is complete for the stated controller/configuration candidate.
- One managed server remains running and healthy with supervisor/root/listener PIDs `24480` / `6624` / `18776`.
- No proof client remains.
- Collision, destructive rollback, repository reinstall, and affected reproof remain task 4.3.
