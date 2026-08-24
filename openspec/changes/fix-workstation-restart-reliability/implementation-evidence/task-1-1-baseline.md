# Task 1.1 baseline

- `node --check tools/windows/opencode-workstation.ts` exit `0`
- `node tools/windows/opencode-workstation.ts --help` exit `0`; stdout lists `restart` and `stop`
- `node tools/windows/opencode-workstation.ts preflight` exit `0`; `status: collision` (existing install)
- `node tools/windows/opencode-workstation.ts status` exit `0`; `elevated: true`; health `200`/`healthy`
- After those commands, ProgramData hashes unchanged for `opencode-workstation.ts`, `manifest.json`, `tray.ps1`, `invoke.vbs`, `tray-host.vbs`, `alacritty.toml`
- Installed candidate: `2035F30776BB6E4D566B852CDAC902B94E7F598F796E57AB50BE3AE05C4BD3E6`
