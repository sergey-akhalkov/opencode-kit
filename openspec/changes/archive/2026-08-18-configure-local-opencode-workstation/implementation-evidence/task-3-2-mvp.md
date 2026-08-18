# Task 3.2 First Attached Client Runtime Proof

Captured: 2026-08-17

## Ordinary Alacritty Boundary

The actual Alacritty executable was launched without a project launcher or `-e` override. Its new root PID `23784` started child PID `18944` with:

- executable `C:\Program Files\WindowsApps\Microsoft.PowerShell_7.6.5.0_x64__8wekyb3d8bbwe\pwsh.exe`;
- command line `pwsh.exe -NoLogo`;
- stable package identity `Microsoft.PowerShell_7.6.5.0_x64__8wekyb3d8bbwe`;
- one unchanged shared-server listener.

The first immediate CIM sample had not populated `ExecutablePath`; a causally distinct follow-up on the same live PID returned the exact package executable. The proof-launched Alacritty tree was then terminated by root; both root and pwsh disappeared and the server listener remained.

## Actual Project Shortcut Boundary

The actual `OpenCode - opencode-kit.lnk` entry point created one new protected-config Alacritty tree:

- Alacritty PID `18268`, protected config and worktree arguments present.
- Stable PowerShell PID `24760`, package executable `7.6.5`, `-NoLogo -NoProfile -NoExit`.
- OpenCode attach shim PID `2668` and installed client PID `10000`.
- Both OpenCode command lines contain `attach http://127.0.0.1:4096 --dir D:\home\sergey-akhalkov\opencode-kit`.
- Alacritty, PowerShell, and both OpenCode client processes have elevated tokens.
- No client command line contains the server credential.
- Authenticated server `/path` reports worktree `D:\home\sergey-akhalkov\opencode-kit`.
- Listener count remained one; the only serve processes are the expected managed shim/listener pair.

The initial proof wrapper used `Start-Process -Wait` and timed out because it followed the detached GUI tree. This Proof Runner failure and its do-not-repeat condition are recorded in `history.md`; no duplicate client was launched. The existing client was attributed from its protected config/creation identity, captured, and terminated by Alacritty root. All four client PIDs are gone, the timed wrapper is gone, and all three managed server processes plus the single listener remain healthy.

## Lifecycle

The accepted real happy path now works through ordinary Alacritty and the actual elevated Desktop project launcher against the reusable server. Additional accepted launchers, Restart, collision, and rollback work remain.

`Development-Stage: MVP`
