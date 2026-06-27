## Why

The kit's install and bootstrap code paths have at least four latent failure modes that today produce silent or asymmetric behavior: `setx` truncation on long Windows paths, asymmetric POSIX persistence that only prints an `export` line, backup-stamp collisions in `tools/init-project.ts` when two overwrites happen within one second, and a `headroom-mcp-wrapper.ts` that spawns the `headroom` binary without an availability check. Each is a small defect that surfaces only on the second user.

## What Changes

- Add a `setx` truncation guard in `tools/install-opencode-global.ts`: measure the configured value before calling `setx`; if > 900 chars (the safe headroom under Windows' 1024-char cap), print a warning and offer `--print` for manual setup.
- Add a `--persist-script <file>` mode that appends an idempotent `export` line to a POSIX shell profile (or removes it on `--unset`); test the round-trip.
- Replace the 14-char `YYYYMMDDHHMMSS` backup stamp with a stamp that includes a short random suffix to prevent in-second collisions.
- Make `tools/headroom-mcp-wrapper.ts` pre-check the `headroom` binary with a sync probe (PATH lookup or `which`-style check); on miss, emit a deterministic error to stderr and exit with a documented code rather than relying on the child's `error` event.

## Capabilities

### New Capabilities

- `library-install-init-resilience`: defines the resilience requirements for `tools/install-opencode-global.ts`, `tools/init-project.ts`, and `tools/headroom-mcp-wrapper.ts` so installation and bootstrap handle long paths, POSIX persistence, in-second overwrite collisions, and missing-binary conditions deterministically.

## Impact

- `tools/install-opencode-global.ts` grows ~30-40 lines for the setx guard and POSIX persistence helper.
- `tools/init-project.ts` changes the backup-stamp format; old backups remain readable.
- `tools/headroom-mcp-wrapper.ts` grows ~10-20 lines for the binary probe.
- New tests in `tools/test-install-opencode-global.ts` and `tools/test-headroom-mcp-wrapper.ts`.
- README gains a brief note on POSIX install and the setx truncation behavior.