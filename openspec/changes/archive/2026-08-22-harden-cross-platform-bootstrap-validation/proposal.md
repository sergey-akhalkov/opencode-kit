## Why

The kit claims Windows/macOS/Linux bootstrap portability, but repository CI runs only on Ubuntu, bare commands failed under the audited Windows PowerShell execution policy, and the MCP installer lacks regression tests. Machine-specific workstation mappings are also committed as a concrete config rather than a portable example plus gitignored local source.

## Outcome Capsule

- **Outcome**: A clean Windows or Ubuntu checkout can run the documented non-mutating bootstrap/validation path through platform-correct command resolution, with tested MCP installer decisions and no committed host-specific path requirement.
- **Operating Envelope**: Windows-latest and Ubuntu-latest CI, disposable home/config/project roots, mocked package-manager/executable probes, no real package installation, service/task mutation, elevation, credentials, provider calls, or workstation activation.
- **Non-Goals**: macOS CI in this increment; changing workstation Start/Restart/Stop semantics; running a real elevated install in CI; changing OpenCode/provider versions; resolving active workstation change behavior.
- **Non-Deferrable Invariants**: Check/dry-run remain effect-free; default install is failure-atomic; command selection preserves argv and cause; existing machine-local files are not overwritten; committed examples contain no absolute maintainer path; secrets never enter logs or fixtures.
- **Observable Proof**: Ubuntu and Windows CI run strict validation/tests plus installer/bootstrap fixtures; PowerShell invokes working `.cmd` shims or direct Node entrypoints without policy bypass; MCP missing/existing/check/dry-run cases pass; a fresh example config materializes only after explicit local copy and validation.
- **Material Residual Risks**: Hosted Windows differs from the owner workstation; package-manager upstream behavior can change; real UAC/scheduled-task/desktop integration remains host proof owned by active workstation changes.
- **Stop Line**: Finish native Windows CI, portable command resolution, MCP installer tests, machine-local config example/ignore behavior, and disposable bootstrap proof. Do not mutate workstation lifecycle implementation while its active owners remain open.

## What Changes

- Add a Windows CI job for repository validation, tests, OpenSpec validation, and non-mutating installer/bootstrap fixtures.
- Centralize platform-correct invocation so Windows documentation/tests use `.cmd` or direct Node entrypoints rather than execution-policy-sensitive `.ps1` resolution.
- Add complete MCP installer tests for existing, missing, partial, failing, `--check`, and `--dry-run` states.
- Replace committed concrete workstation path config with a portable example and gitignored local config contract after active workstation owners release the file.
- Add cross-platform diagnostics that preserve exact executable/argv/status without private paths or credentials.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `library-install-init-resilience`: Adds Windows-native CI and command-resolution/bootstrap failure contracts.
- `library-config-portability`: Adds tested MCP installer behavior and portable example versus machine-local workstation config separation.

## Impact

- `.github/workflows/validate.yml`, package scripts, portable process helpers, installer/bootstrap/MCP tools and tests, README/getting-started guidance, `.gitignore`, and workstation config example/local paths.
- Implementation of workstation config movement is serialized behind `fix-workstation-restart-reliability` and `optimize-shared-opencode-runtime-resources` ownership closure.

## Implementation Dependencies

- Package/Ubuntu workflow edits serialize after `establish-consumer-outcome-regression-gate` lands its provider-free step; this change then adds the Windows job without rewriting that step.
- Workstation config movement remains planning-only until both workstation changes archive or explicitly transfer `tools/windows/opencode-workstation.config.json`; resolver, MCP tests, and Windows CI may proceed on disjoint files.
