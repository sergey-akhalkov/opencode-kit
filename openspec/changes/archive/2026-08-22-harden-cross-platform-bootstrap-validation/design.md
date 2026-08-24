## Context

The current Ubuntu job validates most repository logic, while Windows-specific behavior is represented mainly by fixtures and owner-host proofs. PowerShell command resolution selected blocked `.ps1` shims during the audit. Installer functions also bind directly to process/global state, making MCP decisions harder to fixture-test.

## Goals / Non-Goals

**Goals:** native Windows merge feedback, deterministic platform entrypoint selection, complete effect-free installer fixtures, and clean machine-local path separation.

**Non-Goals:** real package installation, UAC, tasks/services, desktop/tray automation, macOS CI, or workstation lifecycle redesign.

## Decisions

### Use existing process execution with platform candidate resolution

Extend the portable process owner with an explicit executable-candidate resolver. Windows candidates prefer `.cmd` for npm/OpenSpec shims and direct `node <script>` for repository-owned tools. Commands remain argv arrays with no shell. Diagnostics retain the selected executable identity and original resolution/spawn error.

Alternative rejected: changing PowerShell execution policy is a host security mutation and hides portability defects.

### Add one Windows CI job with a non-effecting envelope

Mirror the Ubuntu setup and run strict validation, tests, OpenSpec validation, and dedicated Windows bootstrap/MCP fixtures. Tests inject fake PATH roots, executable probes, package runners, filesystem, and environment writers. A guard fails any attempted real install, `setx`, elevation, task/service/process, UI, or provider operation.

### Refactor installer dependencies only at effect boundaries

Keep installer decision logic in its current owner; pass probe/install/write adapters at the outer boundary. Do not create a general dependency injection framework. Exact state matrices exercise present/missing/partial/failure/check/dry-run cases.

### Separate tracked example from local workstation mappings

After active workstation changes release the config file, rename the tracked concrete config to `.example.json`, add the concrete name to ignore rules, and require explicit/local config resolution. Preserve the old local bytes through migration backup; do not synthesize paths.

## Failure Boundaries And Diagnostics

- Shim resolution failure: report candidate names/PATH-safe facts, no shell fallback.
- Installer probe/install failure: preserve command/status/stdout/stderr and stop later installs.
- Atomic write failure: retain old bytes and clean attributable temp files.
- Workstation owner still active: stop only config movement; CI/MCP work may proceed on disjoint files.

## Fidelity And Authorization

- Current rung: reproduced command-resolution failure and green Ubuntu fixtures.
- Next real boundary: Windows-hosted effect-blocked fixtures, then non-mutating owner-host `--check`/`--dry-run` readback.
- No install, activation, elevation, service, task, remote, credential, or provider action is authorized by this change.

## Risks / Trade-offs

- [Hosted Windows differs from owner host] -> retain separate bounded owner-host proof for workstation-only behavior.
- [Adapter seams overcomplicate tools] -> inject only existing effect boundaries and keep decision functions local.
- [Config rename collides with active work] -> explicit ownership gate before touching workstation files.

## Migration Plan

1. Add failing Windows command/MCP fixtures on current source.
2. Implement resolver and installer seams; make both platform jobs green.
3. Add docs using platform-correct commands.
4. After workstation ownership closes, move concrete config to ignored local source with backup/readback.
