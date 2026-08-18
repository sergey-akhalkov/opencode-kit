# Task 1.2 Controller Preflight Contract

Captured: 2026-08-17

## Candidate

- Source: `tools/windows/opencode-workstation.ts`
- SHA-256: `770367311647E6EDD51137994B53C701E486111AFB2025C2C3C8D6AF1DF4F093`
- Runtime: Node `v24.18.1`
- Dependencies added: none

The initial PowerShell-source strategy is preserved in `history.md`. It reached green AST/help/preflight checks but was removed before host installation after `npm.cmd run validate:strict` enforced the repository's TypeScript-only tooling boundary.

## Proof And Validation

1. `node --check tools\windows\opencode-workstation.ts` exited `0` with no output.
2. `node tools\windows\opencode-workstation.ts --help` exited `0`, listed install, preflight, status, start, restart, launch, rollback, and all four repository IDs, and produced no host effect.
3. `node tools\windows\opencode-workstation.ts preflight` exited `0` with `status: ready`. It reported Node, Alacritty `0.17.0`, stable PowerShell Core `7.6.5`, OpenCode `1.18.18`, the configured global source, protected root, task, endpoint, ordinary Alacritty config, six shortcut paths, exact four Git roots, and no credential.
4. `node tools\windows\opencode-workstation.ts status` exited `0` with `installed: false`, task/root/config/shortcuts absent, and zero port `4096` listeners. This matched the task 1.1 baseline and proves help/preflight/status made no host mutation.
5. Unknown mode, unknown repository ID, and surplus status argument each returned structured `operation: parse`, `status: error`, a cause-preserving message, and child exit code `1` before any host query or effect.
6. `npm.cmd run validate:strict` exited `0`: `OK: skills=29 agents=18 markdown=468 warnings=0 infos=2`. The two reported infos are pre-existing top-level OpenCode permission notices.

## Host Readback

After all checks: protected root absent, scheduled task absent, ordinary Alacritty config absent, all six planned shortcuts absent, and port `4096` listener count zero. No process, task, ACL, registry value, host config, Desktop item, credential, endpoint, or target repository was created, modified, or removed.
