---
name: windows-service-packaging
description: Plan, implement, or review Windows service, tray app, installer, lifecycle, logging, permissions, and deployment packaging for a desktop/server component.
license: MIT
---

# Windows Service Packaging

Use this skill when work touches Windows service deployment, tray UI, installer, service account, logging, event log, firewall, startup, upgrade, or uninstall behavior.

## Principles

- Keep Windows service and user tray UI separate unless an accepted design explicitly chooses another model.
- Services must not depend on an interactive desktop session.
- Installer behavior must be reversible: install, upgrade, repair, uninstall, rollback.
- Startup, shutdown, crash recovery, logs, diagnostics, permissions, and firewall rules are part of the production contract.
- Define automated lifecycle tests or manual gate checklists before service/installer behavior changes; if infeasible, state why and use the closest reproducible substitute evidence.
- Never assume admin privileges without documenting how they are requested and verified.

## Safety

- Default to artifact edits, dry-run validation, and manual gate checklists.
- Do not run installers, service install/uninstall, service-control commands, registry edits, firewall changes, shortcut writes, scheduled task changes, or other host-mutating/admin-affecting commands unless the user explicitly approves the target environment, exact command, expected side effects, and rollback plan.
- No commits, pushes, merges, remote-state changes, source deletion, or destructive cleanup without explicit user request and repository policy.

## Checks

- Service name, display name, account, dependencies, recovery policy, and start mode are explicit.
- Tray app communicates through a documented local IPC/API boundary.
- Installer writes only intended files, registry keys, services, firewall rules, and shortcuts.
- Upgrade preserves config/data and handles running processes.
- Logs and diagnostics are available without attaching a debugger.
- Tests or manual gates cover install, start, stop, restart, upgrade, uninstall, and failure cases.

## Output

Return deployment model, changed artifacts, validation/manual gates, security/permissions notes, and residual risks.
