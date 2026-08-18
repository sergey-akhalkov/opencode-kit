# Task 2.1 Protected Stopped Installation

Captured: 2026-08-17

## Candidate And Effects

- Repository controller SHA-256: `2A189E47DF4B59D11ED9344EEC4A09A3A5AEA9DD2F348931845B61A46D0ABE6E`
- Installed controller SHA-256: `2A189E47DF4B59D11ED9344EEC4A09A3A5AEA9DD2F348931845B61A46D0ABE6E`
- Protected root: `C:\ProgramData\OpenCodeWorkstation`
- Scheduled task: `OpenCode Workstation Shared Server`
- Desktop entry point: `C:\Users\noilw\OneDrive\Desktop\OpenCode Server - Start.lnk`
- Server state: stopped; port `4096` has no listener; no provider/model call occurred.

The controller generated one password with the OS cryptographic RNG and stored it only in the protected credential file. The value was never emitted or copied into evidence.

## Proof

1. `node --check tools\windows\opencode-workstation.ts`, help, preflight, status, and rollback dry-run were green before installation. Preflight captured the exact task, ACL, path, shortcut, executable, repository, and endpoint plan with zero host effects.
2. Immediate pre-mutation readback reported ProgramData/Desktop parents present and effective token elevated. `install` created the protected stopped runtime, task, credential, manifest, log directory, and Start shortcut.
3. Task XML contains `LogonType=InteractiveToken`, `RunLevel=HighestAvailable`, `MultipleInstancesPolicy=IgnoreNew`, `ExecutionTimeLimit=PT0S`, one fixed Node/controller `serve` action, and `<Triggers />`.
4. The first CIM projection counted a null trigger placeholder and mismatched safe controller quoting. Direct task XML proved no trigger. The evaluator and protected manifest were repaired without task recreation; current Status reports `triggerCount: 0`, one exact action, and `state: Ready`.
5. Root ACL owner is `BUILTIN\Administrators`; explicit rules are SYSTEM full control, Administrators full control, and Users read/execute. Credential ACL owner is Administrators and grants only SYSTEM/Administrators full control.
6. A Basic User trust-level child exited through `runas` with exit `0`, created its proof marker in the user temp directory, and could not create a file in the protected root (`ProtectedWriteSucceeded: false`). Both proof paths were removed.
7. Secret-presence checks returned repository `0`, Desktop `0`, controller log `0`, and process-argument `0` matches. Shortcut readback contains only fixed Node path, protected controller path, and `start` mode.
8. Installed `status` reports complete integrity, matching controller hash, credential present, server state absent/stopped, task Ready/Highest/no triggers, and health unreachable as expected before Start.
9. Installed `rollback --dry-run` reports `eligible: true`; controller, task run level/trigger/action/execute/arguments, Start shortcut, and credential checks are all true.

## Validation

- `node --check tools\windows\opencode-workstation.ts`: exit `0`.
- `npm.cmd run validate:strict`: exit `0`, `OK: skills=29 agents=18 markdown=469 warnings=0 infos=2`.
- Repository and protected installed controller hashes match exactly.
- No unrelated Desktop item, task, process, config, repository, firewall, registry value, software package, or remote state was changed.
