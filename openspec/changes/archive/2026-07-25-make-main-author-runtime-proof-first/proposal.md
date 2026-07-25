## Why

The previous lifecycle assigned RC immediately after happy-path proof and made reviewer evidence a mandatory qualification gate. That conflicted with the ordinary meaning of Release Candidate and created a path to endless evidence and polish work after the product was already usable.

The owner wants a simple maturity signal for the implementation represented by an OpenSpec change. The process must show when a minimum working version exists, when the accepted scope is release-candidate quality, and when local work is complete. It must not imply that undiscovered defects are impossible or that a local stage authorizes an external release.

## What Changes

- Use one field: `Development-Stage: development | MVP | RC<n> | stable`.
- `development` means the current candidate is incomplete, mutable, or lacks current representative happy-path proof.
- `MVP` means the smallest complete accepted end-to-end happy path works at a real boundary. More accepted scope may remain.
- `RC<n>` means accepted scope is complete, applicable validation is green, and no known confirmed reachable critical or non-deferrable defect remains. Known documented non-critical bugs, limitations, coverage gaps, and suboptimal code may remain.
- `stable` means the same RC has a complete local handoff and all applicable critical/safety/validation gates are green. No soak-time threshold is required.
- Treat non-SDET reviewers as optional risk discovery, never mandatory stage gates.
- Keep fresh critical-only SDET for Material behavior changes. Repeat only after a main-confirmed critical defect, production fix, and new proof; stop on the first valid attempt with no confirmed critical defect.
- After MVP, do not require fixes for non-critical bugs, optional coverage, maintainability, wording, formatting, or optimization. Record and park them.
- Keep deployment, release, installation, activation, publication, credentials, destructive action, and remote mutation separately authorized.

## Capabilities

### Modified Capabilities

- `library-change-ready-sdlc`: introduce the simple development/MVP/RC/stable lifecycle and critical-only stop line.
- `library-instruction-artifacts`: keep loaded authority, roles, mirrors, contracts, validators, and tests consistent with the lifecycle without compatibility aliases or mandatory reviewer ceremony.

## Impact

- Loaded runtime authority and the `change-ready-sdlc` skill.
- Project-facing instruction mirrors and lifecycle role wording.
- Deterministic contracts, validators, and focused lifecycle tests.
- Current OpenSpec tasks and handoff evidence.
- No application API, data migration, dependency, deployment, credential, or external service change.
