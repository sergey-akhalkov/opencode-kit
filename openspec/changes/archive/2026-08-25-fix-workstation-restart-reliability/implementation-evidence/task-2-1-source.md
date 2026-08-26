# Task 2.1 source

- `node --check tools/windows/opencode-workstation.ts` exit `0`
- `node tools/windows/opencode-workstation.ts --help` exit `0`; lists `restart`/`stop`
- `stopManagedServer` / `terminateValidatedProcess` use `taskkill /PID /F` only; no `/T`
- `serve()` `terminateChild` calls `terminateValidatedProcess` (no `/T`)
- Tray script: `ShowBalloonTip` + `(restart failed)`; no silent post-failure `start`
- Remaining `Start-ControllerAsync 'start'` is the tray-host boot start only
