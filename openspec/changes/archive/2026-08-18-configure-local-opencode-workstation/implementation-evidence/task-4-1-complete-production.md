# Task 4.1 Complete Production Evidence

Date: 2026-08-17

## Candidate

- Repository controller: `tools/windows/opencode-workstation.ts`
- Controller/installed/candidate SHA-256: `6FE34AFF839D1E0171E059ADA29AF03ECA4757C41C8D5921490E934DF23F5145`
- Repository configuration: `tools/windows/opencode-workstation.config.json`
- Configuration/manifest SHA-256: `A80299795EC358DA1BB73610C2D3E8B1453B8A4AF265ED524B66E620DA7738A0`
- Protected controller: `C:\ProgramData\OpenCodeWorkstation\opencode-workstation.ts`
- Endpoint: `http://127.0.0.1:4096`

## Repository Reproducibility

1. `tools/windows/README.md` is the non-secret operator runbook. It documents prerequisites, strict machine configuration, effect-free preflight, install, six shortcuts, manual elevated-shell attach, status, rollback, reinstall, and repository validation.
2. `opencode-workstation.config.json` has schema `1` and exactly four mappings. `opencode-kit` resolves relative to the config; the other current-host paths are explicit. `--config <path>` permits a different host-specific file without changing controller source.
3. Configured preflight reported the config path/hash, exact four Git roots, stable installed tool identities, protected root/task/endpoint, and six shortcuts. Because the current candidate was installed/running, its expected result was `status: collision`; it made no mutation.
4. Missing config, unsupported schema, missing repository ID, unknown top-level key, non-string path, and missing Git root each exited `1` before mutation with an actionable field/path diagnostic. Ephemeral invalid configs were removed from the approved temp root.
5. Source and config changes do not hot reload. The installed protected manifest remains runtime authority until explicit stopped repair or rollback/reinstall.
6. Reuse disposition: `build-minimal`. Repository search found no workstation config loader or lifecycle owner; Node JSON/filesystem APIs and existing controller ownership provide strict parsing with no package. Cross-project discovery is not applicable to this machine-local integration.

## Installed Scope

1. Stopped repair copied the repository controller after exact hash verification and recorded the configuration identity/resolved mappings in the protected manifest.
2. Manifest readback contained exactly repository IDs `opencode-kit`, `pmac-emulator`, `controller-gateway-service`, and `windows-ui-automation` and exactly shortcut IDs `start`, `restart`, and those four repository IDs.
3. All six shortcuts read back with the protected controller target, fixed mode/allowlisted ID, and expected protected or repository working directory. Task readback remained Highest, no-trigger, one action, and one protected `serve` command.
4. Actual Desktop Start exited `0`. Its returned/current state was already `running` for the current candidate with one listener, supervisor PID `14880`, OpenCode root PID `16748`, and listener PID `16264`. This verifies the corrected health/state correlation rather than relying on a later transition from `starting`.
5. Authenticated installed Status reported healthy OpenCode `1.18.18`, one running highest-privilege task, one `127.0.0.1:4096` listener, complete integrity, four mappings, and six present shortcuts.

## Negative And Rollback Controls

1. A proof-owned temporary state candidate mismatch made installed `restart` exit `1` with `Managed server state candidate does not match the installed manifest.` The original state bytes were restored in `finally`; supervisor and listener PIDs remained unchanged and alive.
2. `rollback --dry-run` returned `eligible: true`. Controller, task run level/triggers/action/execute/arguments, all six shortcuts, ordinary/protected Alacritty config, and credential-presence checks were all `true`.
3. A credential-presence scan compared the protected secret in memory against repository files, Desktop artifacts, controller logs, and all process command lines without printing it. File hits: `0`; process-argument hits: `0`.
4. `node --check tools\windows\opencode-workstation.ts` exited `0` with no output. `npm.cmd run validate:strict` exited `0` with `OK: skills=29 agents=18 markdown=474 warnings=0 infos=2` before this evidence file was added.

## State

- Task 4.1 is complete for candidate `6FE34AFF839D1E0171E059ADA29AF03ECA4757C41C8D5921490E934DF23F5145` plus configuration `A80299795EC358DA1BB73610C2D3E8B1453B8A4AF265ED524B66E620DA7738A0`.
- The managed server is running and healthy.
- Runtime proof for all four actual project launchers and the actual Desktop Restart remains task 4.2.
- Destructive collision, rollback, repository reinstall, and affected reproof remain task 4.3.
