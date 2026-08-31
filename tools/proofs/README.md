# Proof Tools

Proof tools exercise real kit entry points in disposable local environments. They support development and regression diagnosis; they are not a separate completion system.

## Rules

- Prefer the project-native test or installed entry point that directly observes the accepted behavior.
- Inspect the current invocation, exit status, stdout/stderr, effects, and cleanup.
- Put any required intermediate output in an automatically cleaned temporary directory outside the repository.
- Do not create repository `evidence/` trees, `evidence-index.json`, raw/evaluation/replay bundles, or separate proof reports.
- Do not require an offline replay before ordinary continuation. After a failed costly or live run, diagnose that run and require a causal mechanism change or the exact missing observation before retrying.
- Keep provider, credential, remote, destructive, install, activation, and protected effects separately authorized.
- Treat a proof tool's output as bounded to the exercised candidate, environment, path, and oracle.

Some existing proof CLIs still name a disposable output option `--evidence-root`. That option is test-only temporary output, not an OpenSpec artifact or handoff requirement. Callers must use an outside-repository temporary path and remove it after inspecting the run.

## Maintained Entrypoints

- `consumer-outcome-regression.ts`: bounded synthetic consumer-workflow regression harness.
- `delivery-trajectory-context.ts`: project-neutral trajectory-context checks.
- `roadmap-mission.ts`, `roadmap-mission-controller.ts`, and `roadmap-mission-provider.ts`: disposable mission lifecycle checks.
- `session-completion-guard-*.ts`: completion guard and restart checks.
- `opencode-permissions.ts` and `runtime-surface-loader.ts`: installed loader and permission checks.
- `nuphus-desktop.ts`: bounded local desktop integration checks.

Use `package.json` proof scripts and each CLI's effect-free `--help` output for exact current invocations. New proof tools must document their boundary, effects, cleanup, and claim limit here without adding retained artifact workflow.
