# Task 1.1 Current-Host Baseline

Captured: 2026-08-17

## Commands And Outcomes

All commands were read-only and ran from `D:\home\sergey-akhalkov\opencode-kit`.

1. Effective identity and environment: queried `WindowsIdentity`, `WindowsPrincipal`, `Win32_OperatingSystem`, Windows known-folder Desktop, and process/user `OPENCODE_CONFIG_DIR`. Command completed successfully. Observed `NEURO\noilw`, SID identity `sha256:b47c028cc46c71f1548d6f29ee5bbb5c29965ac34d28340a136b2cb292d2f67d`, elevated token `true`, session `1`, Windows 11 build `26200`, Desktop `C:\Users\noilw\OneDrive\Desktop`, and matching process/user config source `D:\home\sergey-akhalkov\opencode-kit\global`.
2. Installed tools: invoked `alacritty --version`, `pwsh -NoLogo -NoProfile -Version`, and `opencode --version` through their resolved command paths. All completed successfully. Observed Alacritty `0.17.0 (94e7c88)`, PowerShell `7.6.5`, and OpenCode `1.18.18`.
3. Stable PowerShell identity: queried `Microsoft.PowerShell` Appx registration and hashed its package executable. Command completed successfully. Observed stable package `Microsoft.PowerShell_7.6.5.0_x64__8wekyb3d8bbwe`, alias `C:\Users\noilw\AppData\Local\Microsoft\WindowsApps\pwsh.exe`, package executable SHA-256 `362A356CE7F0940EC74F73A8FC2C990A2CC24A38A11C90BBD8ECA947110AD139`. The first direct alias hash probe emitted `Get-FileHash FileReadError` because the App Execution Alias is a zero-length special entry; the package executable probe supplied the byte identity instead.
4. Other executable identities: queried file metadata and SHA-256. Command completed successfully for Alacritty and OpenCode. Alacritty path `C:\Program Files\Alacritty\alacritty.exe`, SHA-256 `5AD70DDC5C2A2BFE84084A2C4C73558E9360914F035A902D7A69277BE7249F1F`; OpenCode shim `C:\Users\noilw\.bun\bin\opencode.exe`, SHA-256 `59B379B53354DA72D2C5262119FE70C44B4E473826EBBAA94D47A2D58A359B1A`.
5. Repository identities: ran `git -C <path> rev-parse --show-toplevel` for all four selected paths. Every command completed successfully and exactly matched its configured root: `D:\home\sergey-akhalkov\opencode-kit`, `D:\mekha\mtronics\pmac-emulator`, `D:\mekha\mtronics\controller-gateway-service`, and `D:\mekha\mtronics\windows-ui-automation`.
6. Global source: tested the configured directory, OpenCode config, and operation gate. Command completed successfully; all exist.
7. Collision inventory: queried `C:\ProgramData\OpenCodeWorkstation`, task `OpenCode Workstation Shared Server`, `%APPDATA%\alacritty\alacritty.toml`, the six planned Desktop shortcut names, and `Get-NetTCPConnection -LocalPort 4096`. Initial and final readbacks completed successfully and both observed protected root absent, task absent, Alacritty config absent, zero planned shortcuts present, and zero port `4096` listeners.
8. Repository scope: `git status --short -- openspec/changes/configure-local-opencode-workstation` reported only the new untracked change directory. No existing unrelated worktree path was changed by the baseline.

## Zero-Mutation Readback

The final collision readback matched the initial readback exactly:

```json
{
  "protectedRootExists": false,
  "taskExists": false,
  "alacrittyConfigExists": false,
  "existingShortcutCount": 0,
  "listenerCount": 0
}
```

No process, task, ACL, registry value, host config, Desktop item, credential, endpoint, or target repository was created, modified, or removed.
