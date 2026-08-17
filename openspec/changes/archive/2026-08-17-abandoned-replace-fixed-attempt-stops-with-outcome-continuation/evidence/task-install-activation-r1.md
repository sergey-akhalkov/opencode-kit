# Installed Source Activation R1

- Owner authorization: install, archive, and push explicitly requested on
  2026-08-17.
- OpenCode upgrade command: `opencode upgrade --method bun`, exit `0`; upgrade
  skipped because `1.18.18` is already the latest installed/available version.
- Installer tests: `npm.cmd run test:focused:install`, `27/27`.
- Dry run: selected `OPENCODE_CONFIG_DIR=<repo>\global`
  and the guarded Windows `setx` path without mutation.
- Activation: `npm.cmd run install:global`, exit `0`.
- Readback: `npm.cmd run install:global -- --check`, exit `0`, exact configured
  source matched the repository `global/` directory.
- Runtime-source inventory: canonical OpenSpec workflow collision status `clear`;
  `opsx-propose`, `opsx-apply`, and `opsx-archive` plus their skills selected from
  the custom source; operation/archive helpers resolved from the same source.
- Doctor: structural kit authority and canonical runtime-source identity passed;
  repository project-AGENTS/adapter qualification warnings remain pre-existing.
- Activation boundary: a new OpenCode process is required to load changed
  instruction/config/plugin files. This session was not hot-reloaded.
- Scope note: the configured source is the complete dirty `global/` worktree and
  therefore includes concurrent roadmap/troubleshooter edits outside this change.

External operation state: local source activation completed; no release or remote
operation occurred before this record.
