# Task 3.1 Stable Terminal And First Client Installation

Captured: 2026-08-17

## Candidate

- Candidate/controller SHA-256: `DF088DF1E73B6C7BCA3523544EEC8A8202BE601DB57CCDF1A220B2CC9A2F5FA6`
- Ordinary config: `C:\Users\noilw\AppData\Roaming\alacritty\alacritty.toml`
- Protected elevated config: `C:\ProgramData\OpenCodeWorkstation\alacritty.toml`
- Project shortcut: `C:\Users\noilw\OneDrive\Desktop\OpenCode - opencode-kit.lnk`

## Proof And Validation

1. The prior managed tree was positively identified from task/state/listener ownership, terminated by the supervisor root with descendant-tree semantics, and read back as zero remaining managed processes, zero listeners, task Ready before protected repair.
2. Atomic stopped repair installed the exact source hash, created both Alacritty configs, preserved `previousExists: false`, added only the `opencode-kit` shortcut, retained the credential, and left the task Ready/Highest/no triggers.
3. Both config files contain only `[terminal]` and `shell = { program = "pwsh.exe", args = ["-NoLogo"] }`; their SHA-256 values match: `3E79514882EF6057A50A9BCD1E24090ED907AEB7CA3966076E19FAFC55333BF0`.
4. Actual Alacritty `--config-file ... --version` parsed both ordinary and protected files successfully and reported `alacritty 0.17.0 (94e7c88)`.
5. With the shared server stopped, protected `launch --repository opencode-kit` exited `1` with an actionable Start instruction, created zero Alacritty processes and zero listeners, and did not fall back to ordinary OpenCode startup.
6. Unknown repository ID exited `1` at strict parsing before launch/elevation work.
7. Shortcut readback contains only the exact Node target, protected controller `launch --repository opencode-kit`, mapped worktree, and Alacritty icon; no credential or arbitrary path argument exists.
8. The actual Start shortcut restored one healthy authenticated server on the repaired candidate. Installed Status is green and reports only Start plus `opencode-kit` as created shortcut IDs.
9. `node --check tools\windows\opencode-workstation.ts` and `npm.cmd run validate:strict` exited `0`; strict validation reported `OK: skills=29 agents=18 markdown=471 warnings=0 infos=2`.

No target repository content, global elevation setting, provider/model route, software package, firewall rule, or remote state changed.
