## Shared Execution Envelope

CI and local proof use disposable roots and injected effects. No task installs packages, changes execution policy or environment, elevates, registers tasks/services, controls workstation processes, opens UI, or calls configured providers. Workstation config movement is blocked until current workstation owners release that file.

## 1. Reproduce And Fix Platform Invocation

- [x] 1.1 Add Windows fixtures reproducing blocked `.ps1` shim resolution, spaces in paths, missing executables, and exact argv; verify current behavior fails for the intended reason before implementation.
- [x] 1.2 Extend the portable process owner with platform candidate resolution and cause-preserving diagnostics; verify Windows selects `.cmd`/direct Node, Ubuntu behavior is unchanged, no shell string is used, and all focused tests pass.
- [x] 1.3 Update documented/package entrypoints to use the maintained resolver or explicit Windows forms; verify every README/getting-started command used by Windows CI resolves without execution-policy mutation.

## 2. Complete MCP Installer Evidence

- [x] 2.1 Isolate existing MCP probe/install effects behind narrow adapters and add present/missing/partial/probe-failure/install-failure/path-with-spaces fixtures; verify decisions, order, stdout/stderr, and stop-on-failure behavior.
- [x] 2.2 Prove `--help`, `--check`, and `--dry-run` produce their exact exits/output with zero package-manager/config/environment effect; verify default fixture installs only missing tools and re-probes before success.

## 3. Add Native Windows Merge Feedback

- [x] 3.1 Add a `windows-latest` CI job for strict validation, tests, OpenSpec validation, invocation fixtures, and non-mutating install/bootstrap/MCP cases; include a hard effect guard and verify the workflow never invokes real install, `setx`, elevation, task/service/UI, or provider operations.
- [x] 3.2 Run the CI-equivalent Windows and Ubuntu command sets locally or in hosted runners and preserve exact status/stdout/stderr; correct only platform defects inside this change and keep macOS future scope.

## 4. Separate Machine Workstation Configuration

- [x] 4.1 Reconcile active ownership of `tools/windows/opencode-workstation.config.json`; do not mutate it while either workstation change remains mutation-enabled, and record the exact transfer condition.
- [x] 4.2 After transfer, create a path-free tracked example plus ignored local config and migration/readback tests; verify absent/invalid local config fails before elevation or host mutation and rollback restores prior local bytes.

## 5. Complete Validation

- [x] 5.1 Run focused process/installer/bootstrap/config tests on Windows and Ubuntu, workflow readback, `npm test`, `npm run validate:strict`, selected strict validation, and `openspec validate --all`; report any unrelated active-change failure without mutating that owner.
