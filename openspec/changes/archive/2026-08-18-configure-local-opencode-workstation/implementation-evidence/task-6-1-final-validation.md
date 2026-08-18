# Task 6.1 Final Validation And Local Handoff

Date: 2026-08-18

## Stable Candidate

- Stable Candidate: `RC1`
- Repository/installed/manifest/state controller SHA-256: `E9ADB0FD0992CB479343BB2A5DBE87679EC21172E14E6780EE376F5A1073ECCF`
- Repository/manifest configuration SHA-256: `A80299795EC358DA1BB73610C2D3E8B1453B8A4AF265ED524B66E620DA7738A0`
- Final managed supervisor/root/listener PIDs: `20944` / `9512` / `25172`
- Final server state: `running`, authenticated health `200`, OpenCode `1.18.18`, one `127.0.0.1:4096` listener
- Final SDET: `ses_febe5f9dcffexcohff2FqE31Nx`, `xai/grok-4.6`, `no-critical-risk`, no test changes

## Named Validation

| Check | Result |
|---|---|
| `node --check tools\windows\opencode-workstation.ts` | exit `0`, no output |
| Installed `opencode-workstation.ts --help` | exit `0`; all eight modes and four IDs listed; no effect |
| Repository configured preflight | exit `0`, expected `status: collision` for the current installed/running workstation; exact tool/config/repository/task/shortcut/port plan read back |
| Installed Status | exit `0`, complete integrity, Running/Highest/no-trigger task, healthy `1.18.18`, one listener, six shortcuts |
| Installed `rollback --dry-run` | exit `0`, `eligible: true`; every controller/task/shortcut/config/backup/credential check true |
| Parser/allowlist negatives | unknown repository, launch surplus, Start surplus, and serve surplus each exit `1`; no Alacritty root or listener change |
| `npm.cmd test` | exit `0`; all eleven test files passed (`...........`) |
| `npm.cmd run validate:strict` | exit `0`; `OK: skills=29 agents=18 markdown=480 warnings=0 infos=2` |
| `npm.cmd run openspec:validate` | exit `0`; 14 passed, 0 failed |
| `openspec.cmd validate configure-local-opencode-workstation --strict` | exit `0`, change valid |

## Final Host Readback

1. Repository source, protected installed source, manifest candidate, and state candidate hashes are identical. Configuration source and manifest configuration hashes are identical.
2. Task state is Running, run level Highest, one protected `serve` action, and controller-reported trigger count `0`. XML has zero element trigger nodes; the earlier raw CIM null placeholder is not a real trigger.
3. All six shortcuts exist and read back to the protected Node/controller with fixed Start, Restart, or one of four allowlisted repository IDs. Their working directories match the protected manifest mappings.
4. Protected-root ACL inheritance is disabled; Users have no write/modify/full-control ACE. Credential has no Users ACE. SYSTEM/Administrators retain the intended ownership.
5. Process command-line inspection has zero password/auth-value patterns. Protected logs have zero password/auth-value patterns. General controller errors are retained as secret-free JSON lines.
6. No proof-owned Alacritty/client/listener remains. Owner roots `13088` and `8520` were intentionally preserved through authorized server repairs; they may need manual reopen because Restart does not claim auto-reconnect.
7. Current preflight collision is expected installed-state evidence, not an installation failure. A clean rollback/reinstall cycle was already proven in task 4.3.

## Runtime Proof Summary

- Actual ordinary Alacritty resolves stable PowerShell Core `7.6.5` through the stable alias.
- Actual Desktop Start is healthy and idempotent; actual Restart proves old-tree absence before replacement.
- Every project shortcut attaches with its exact mapped `--dir` and creates no extra server.
- Actual no-delay `pmac-emulator` then `opencode-kit` shortcuts remain alive concurrently on one unchanged listener; second-client cleanup leaves the first alive.
- Unrelated listener, stale state, unknown ID/path, missing server, and rollback drift controls fail closed.
- Complete identity-matched rollback and repository-driven reinstall recreate the workstation from `tools/windows` source/config/docs.

## SDET Disposition

The first fresh SDET identified ownership-before-health. Main reproduced and corrected it. Later fresh SDET passes exposed two cleanup control-flow gaps; main corrected the complete spawned-child owner boundary and re-proved Start/Restart. The owner-reported concurrent-client failure was then reproduced through actual shortcuts, diagnosed from the new protected operation log as a transient single health timeout, corrected with bounded ownership-validated retry, and re-proven with two simultaneous actual clients.

The final fresh SDET inspected `E9ADB0FD...` and returned `no-critical-risk`. All prior rows have main disposition in `task-5-2-main-disposition.md`.

## Rollback

Review before mutation:

```powershell
node C:\ProgramData\OpenCodeWorkstation\opencode-workstation.ts rollback --dry-run
```

When every check is true and rollback is intended:

```powershell
node C:\ProgramData\OpenCodeWorkstation\opencode-workstation.ts rollback
```

Reinstall from repository source with the documented commands in `tools/windows/README.md`.

## Known Non-Critical Limitations

- Restart disconnects existing clients; automatic reconnect is out of scope. Reopen project shortcuts afterward.
- A different workstation must supply its own exact four repository paths through the strict configuration.
- If a spawned OpenCode root has already exited while an independently surviving descendant remains, the immediate serve-error cleanup cannot target that descendant through the dead root PID. No such orphan is observed on current or corrected-candidate proof; persisted normal runtime/Restart/rollback retain their separate process/listener identities.
- Current protected log contains historical/synthetic error lines from proof and the confirmed pre-fix concurrent failure; no sensitive value is present.

## External Operations

No commit, push, merge, release, deployment, third-party install, remote bind, firewall change, target-repository mutation, or provider/model product call was performed. Unrelated repository worktree changes were preserved.

`Development-Stage: stable`

`Stable Candidate: RC1`
