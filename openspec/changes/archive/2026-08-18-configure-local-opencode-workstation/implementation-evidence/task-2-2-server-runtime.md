# Task 2.2 Shared Server Runtime Proof

Captured: 2026-08-17

## Boundary

The actual Desktop `OpenCode Server - Start.lnk` entry point launched the installed controller, highest-privilege Scheduled Task, OpenCode shim/installed binary process tree, Basic authentication middleware, configured global source, and loopback listener. No model/provider request or target-repository write occurred.

## First Start

- Desktop launcher process exit: `0`.
- Task: `Running`, Highest, zero triggers, one fixed action.
- Authenticated `GET /global/health`: HTTP `200`, `healthy: true`, version `1.18.18`.
- Unauthenticated `GET /global/health`: HTTP `401`, rejected.
- Listener: exactly one `127.0.0.1:4096` listener.
- Managed tree: elevated Node supervisor PID `24900`, elevated OpenCode shim PID `8652`, elevated installed OpenCode listener PID `11660`.
- Pinned candidate: `2A189E47DF4B59D11ED9344EEC4A09A3A5AEA9DD2F348931845B61A46D0ABE6E`.
- State file correlates task, endpoint, supervisor, server root, listener, creation identities, command hashes, and health without a credential.

An authenticated read-only `/path` request with the `opencode-kit` directory header returned worktree `D:\home\sergey-akhalkov\opencode-kit`. The current OpenCode native log run then recorded loading `D:\home\sergey-akhalkov\opencode-kit\global\opencode.json` and `opencode.jsonc`, proving the server child received the accepted `OPENCODE_CONFIG_DIR`.

## Idempotent Reuse

The actual Start shortcut was invoked a second time and exited `0`.

- Supervisor PID unchanged: true.
- OpenCode shim PID unchanged: true.
- Listener PID unchanged: true.
- Listener count remained one.
- Task remained Running.
- Complete `opencode serve` inventory contains only the one expected shim/listener pair in this managed tree.

## Diagnostics And Cleanup State

Installed Status reports complete controller integrity, credential present, authenticated health green, exact task/action identity, and one listener. The server remains running as the requested reusable workstation server. Existing TUI processes were not terminated or modified. No password was emitted into evidence, argv, Desktop artifacts, repository files, or logs.
