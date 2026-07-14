# Project Validation

Record project-specific commands here. Keep the Universal Development Loop and Change-Ready runtime unchanged; this file only adapts validation commands to the current technology stack.

## Commands

| Purpose | Command | Notes |
| --- | --- | --- |
| Focused test | `unknown` | Replace after discovery. |
| Full test | `unknown` | Replace after discovery. |
| Typecheck | `unknown` | Replace after discovery. |
| Lint | `unknown` | Replace after discovery. |
| Build | `unknown` | Replace after discovery. |

## Validation Policy

- Run focused validation before broad validation.
- Run broad validation before final handoff when the change crosses module, public API, data, deployment, protocol, or compatibility boundaries.
- Discover concrete project-native validation procedures before claiming Change-Ready. A Command cell is resolved when its backticked value is a concrete non-placeholder command, or an explicit reasoned non-applicability decision: Command `N/A - <nonempty reason>`, or Command `N/A` with a nonempty non-placeholder Notes reason. Bare `N/A`, `unknown`, `TBD`, `TODO`, `replace-me` / `Replace after discovery`, blank, and equivalent template placeholders remain unresolved.
- A complete Purpose/Command table for Focused test, Full test, Typecheck, Lint, and Build is a documented equivalent validation adapter source to concrete `opencode-dev-kit/adapter.json` validation entries. Adapter JSON may record reasoned non-applicability as the string `N/A - <nonempty reason>`.
- Entries left as `unknown`, blank, bare `N/A`, or other unresolved placeholders must be resolved or explicitly recorded as non-applicable with residual risk.
- Applicable unresolved or skipped validation keeps `Change-Ready: no`.
- If a command cannot run locally, report the skipped command, reason, and risk.
- Mutation-capable validation, generator, or formatter commands remain open under Universal writer attempt closure until terminal report, adapter-proven terminal cessation, or isolated/revoked write authority. Prefer isolated workspaces for mutation-capable validation; mutation invalidates qualification evidence but does not close a still-live mutator.
