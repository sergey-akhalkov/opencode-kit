---
name: com-activex-adapter-implementation
description: Implement or review Windows COM/ActiveX adapters, local-server or DLL boundaries, activation, threading, events, shared-server semantics, and legacy client compatibility.
license: MIT
---

# COM ActiveX Adapter Implementation

Use this skill for Windows legacy adapter work involving COM, ActiveX, IDL/type libraries, local servers, DLLs, apartment threading, events, or compatibility shims.

## Principles

- Treat legacy IDL/type library, activation behavior, threading model, and event semantics as public compatibility contracts.
- Derive the adapter contract from legacy IDL/type-library/client evidence, implement and prove the smallest compatible happy path with a real client where feasible, then use a separate fresh-context testing subagent to author realistic compatibility, threading, activation, and lifecycle tests.
- Do not assume transparent compatibility without running or inspecting legacy clients where possible.
- Separate adapter boundary from modern service/runtime boundary.
- Keep registration, bitness, permissions, and installer behavior explicit.

## Safety

- Default to source/IDL/type-library inspection, tests, dry-run packaging checks, and manual registration gates.
- Do not run `regsvr32`, COM registration/unregistration, installer registration, registry edits, service-control commands, or other host-mutating/admin-affecting commands unless the user explicitly approves the target environment, exact command, expected side effects, and rollback plan.
- No commits, pushes, merges, remote-state changes, source deletion, or destructive cleanup without explicit user request and repository policy.

## Checks

- CLSID/ProgID/interface names, DISPIDs, argument types, return types, and error codes match required compatibility.
- 32-bit/64-bit registration and activation paths are documented.
- STA/MTA expectations and cross-thread calls are safe.
- Events/callbacks are ordered, disconnect-safe, and do not deadlock.
- Shared local-server semantics are tested if multiple clients can attach.
- Installer/register/unregister behavior is reversible.

## Output

Return compatibility matrix, adapter boundary, activation/threading decisions, tests/manual gates, installer notes, and residual risks.
