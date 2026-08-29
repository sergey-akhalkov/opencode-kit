# Task 6.3 Windows Source-Plan Evidence

## Identity

- Candidate: `task-6-3-windows-source-r2`
- Environment: `node-24.18.1-windows-task-6-3-r2`
- Boundary: source-only Windows supervisor `preview`, `check`, `repair-plan`,
  `rollback-plan`, and protected host execution in disposable fixtures

## Implementation

- `opencode-workstation-layout.ts` owns the shared workstation root, campaign sibling
  root, task name, credential path, ACL principal, and owner-logon contract.
- `work-campaign-supervisor.ts` plans one exact no-argument Scheduled Task and complete
  protected runtime installation without applying host effects.
- `work-campaign-supervisor-host.ts` checks manifest, source, installed, task, runtime,
  and credential identity before injecting `OPENCODE_SERVER_PASSWORD` only in memory.
- The existing workstation installer copies the shared layout module so its installed
  controller remains runnable, while its rollback remains confined to the workstation
  root and workstation-owned tasks.

## Runtime Proof

- `task-6-3-windows-r2` completed five production-entrypoint fixtures with one
  proof-owned child process and zero provider, OpenCode, host-mutation, source-write,
  registry, Scheduled Task, ACL, credential, or installed-process effects.
- `task-6-3-windows-replay-r2a` and `task-6-3-windows-replay-r2b` both completed from
  the preserved raw with `liveCalls: 0`.
- The fixtures prove effect-free preview, independent source/installed/task/runtime
  identity, fail-closed repair and rollback plans, source-drift separation, and
  credential-private host execution after exact identity checks.

## Review And Validation

- Corrected architecture re-review `ses_fb8b6ee75ffeKEV19yiezkOJC4`
  (`xai/grok-4.6`) returned `no-material-finding`.
- Code-quality review `ses_fb89ca703ffeZhR4a200ZDsGfT` (`xai/grok-4.6`) found five
  high-confidence dead or unnecessarily public seams; main removed all five and
  recaptured the resulting `r2` candidate. Optional helper sharing was rejected because
  it would widen the protected host API for a small private-line reduction.
- `npm run test:focused:work-campaign-windows`: 5/5 passed.
- `npm run test:focused:work-campaign`: passed all campaign suites.
- `npm run test:focused:workstation-config`: 7/7 passed.
- `npm run test:focused:workstation-restart`: 6/6 passed.
- `node tools/test-windows-ci-envelope.ts`: 2/2 passed.
- `npm run test:focused:library`: 180/180 passed.
- `npm run test:focused:install`: 30/30 passed.
- OpenSpec gate 23/23 and change-inventory 10/10 focused suites passed; the production
  apply gate exited zero with only the expected incomplete broad-claim warning.
- Strict selected OpenSpec validation, schema-v2 evidence readback with zero unindexed
  files, and `git diff --check` passed.
- A read-only live workstation preflight loaded the shared-layout controller and stopped
  at the pre-existing environment prerequisite that `alacritty.exe` is absent from
  `PATH`; it performed no host mutation and is not installation evidence.

## Ownership And Claim Ceiling

- `work-campaign-supervisor.ts` remains one cohesive pure planning/check owner; layout
  constants and effectful host execution are already split into their narrow owners.
- The large existing workstation controller received only the shared-layout and installed
  import-closure compatibility needed to preserve its current install/repair lifecycle.
- Evidence supports Task 6.3 source plans and disposable host-injector behavior only. It
  does not support live ProgramData installation, ACL mutation, credential provisioning,
  Scheduled Task registration, process activation, reboot/logon re-entry, repair,
  rollback, deployment, release, RC, stable, or remote effects.
