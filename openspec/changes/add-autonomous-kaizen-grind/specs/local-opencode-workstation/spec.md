## ADDED Requirements

### Requirement: Kaizen Grind task installation is explicit and protected
The Windows workstation SHALL provide provider-free preview, install, check, repair, enable, disable, run-now, status, and rollback operations for one separately named Kaizen Grind Scheduled Task and its exact versioned controller closure. The protected manifest SHALL bind source and installed file digests, absolute `D:\OpenCode\data\kaizen` root, schema-valid Grind configuration, distinct validated Grind project registry, managed runtime endpoint/version and protected credential-file path, task name/principal/triggers/settings/action, result/log paths, disabled generation, and rollback ownership. The host SHALL verify and read the existing workstation credential file only at invocation and inject it in memory; config, task argv, logs, and status SHALL contain no credential value.

Installed task actions, controller files, manifests, configuration, state ownership metadata, and logs SHALL live under an independently reversible protected workstation sibling root and be unmodifiable by unelevated processes. Neither model output, signal content, project source, plugin load, doctor, profile source presence, nor ordinary project bootstrap SHALL install, enable, repair, or alter the task.

#### Scenario: Install preview is requested
- **WHEN** the operator previews a valid Kaizen Grind installation
- **THEN** output identifies exact protected files, task settings, data root, runtime and registry dependencies, expected effects, and rollback plan without host mutation
- **AND** includes no credential value, signal payload, arbitrary argv, or unrelated private path.

#### Scenario: Installed closure drifts
- **WHEN** task action, controller/config bytes, principal, trigger, protected ACL, data root, runtime, or registry identity differs from the manifest
- **THEN** check reports the exact drift and Grind launches no semantic or project work
- **AND** repair requires the explicit protected lifecycle rather than trusting the task or model output.

### Requirement: The task is daily, finite, non-overlapping, and missed-run capable
The installed task SHALL use `InteractiveToken` for the current owner account at highest run level, one daily 03:00 local trigger repeated every 15 minutes for 24 hours, `StartWhenAvailable`, `WakeToRun=false`, a five-hour execution limit, and `IgnoreNew` non-overlap. Each wake SHALL invoke the same pinned protected host, validate the disabled generation and `nextEligibleAt`, and exit provider-free when no run is eligible. Enablement MAY request run-now for that same task. Missed-run recovery SHALL occur only after the owner has an interactive session and the existing authenticated managed OpenCode runtime is healthy; Grind SHALL not store a Windows password, select S4U, wake the machine, or start the shared server itself. No free-form project command, prompt, credential value, or repository checkout path SHALL appear in the task action.

The controller process SHALL exit after cycle closure, persisted continuation, safe pause, explicit stop, or terminal failure. Process restart/backoff SHALL be finite and cause-preserving. The task SHALL not become a permanent Windows service or require an interactive terminal window.

#### Scenario: Scheduled time occurs during an active run
- **WHEN** the daily trigger fires while the correlated controller lease is active
- **THEN** no second controller process starts
- **AND** status continues to report the existing run and its next durable boundary.

#### Scenario: Daily start was missed
- **WHEN** the owner logs on or resumes an interactive session after the scheduled time and the managed runtime becomes healthy
- **THEN** one task invocation starts when the managed runtime prerequisites become available
- **AND** it consumes the durable pending cycle rather than manufacturing a duplicate watermark.

#### Scenario: Repetition wakes with no eligible continuation
- **WHEN** the 15-minute trigger fires before `nextEligibleAt` or while no cycle is due
- **THEN** the protected host exits without a provider call, session, campaign, or project mutation
- **AND** preserves the next daily or continuation eligibility.

#### Scenario: Controller exceeds its graceful wall-clock budget
- **WHEN** the four-hour invocation budget expires
- **THEN** the controller persists its cursor and begins graceful ownership closure before the five-hour task limit
- **AND** an eventual task timeout leaves ownership unknown for later reconciliation rather than authorizing a replacement writer.

### Requirement: Disable and rollback preserve data and project evidence
Disable SHALL prevent future task launches, stop active Grind ownership through the portable graceful-stop boundary, and retain the installed files for later enablement. Rollback SHALL remove only the matching Kaizen Grind task, protected derived controller/config/manifest/log material, and attributable inactive process ownership after exact identity verification. Both operations SHALL preserve the D: Kaizen database, migration backup, signals, execution-record/campaign/mission transitions, visible sessions, project source, OpenSpec artifacts, archives, local commits, shared managed OpenCode services, credentials, unrelated tasks, and workstation configuration.

If controller, task, process, session, writer, installed bytes, or cleanup identity is drifted or unknown, disable/rollback SHALL fail closed for that item and retain diagnostics. Task deletion or absent PID SHALL not establish writer closure.

#### Scenario: Disable runs during an active project writer
- **WHEN** the exact task and controller are known but a correlated mission still owns project mutation
- **THEN** no successor task/controller/execution record launches and status remains stopping until mission closure or isolation
- **AND** project and Kaizen evidence remain unchanged.

#### Scenario: Rollback matches installed material
- **WHEN** the task, protected closure, inactive process ownership, and manifest identities match
- **THEN** rollback removes only those derived installation artifacts
- **AND** leaves the D: lifecycle and all project results available for manual or later compatible resume.
