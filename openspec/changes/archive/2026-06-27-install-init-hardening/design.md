## Context

The kit's install and bootstrap scripts grew organically with Windows-first assumptions. Four concrete issues affect users:

1. **setx truncation**: `setx OPENCODE_CONFIG_DIR <path>` silently truncates values above 1024 chars (Windows limit). A developer with `D:\Users\<long-name>\Repos\opencode-dev-kit\global` may produce a 200+ char path; nested deeper, the truncation risk is real. The installer today has no guard.

2. **POSIX asymmetry**: On Windows, `setx` runs and persists. On POSIX, the installer only prints an `export` line. The user must edit their shell profile manually. There is no helper to append idempotently and no test of the round-trip. `--unset` is similarly manual.

3. **Backup collision**: `tools/init-project.ts` builds a backup path from `new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)` which is `YYYYMMDDHHMMSS`. Two overwrites in the same second produce the same backup filename; the second overwrites the first.

4. **Missing `headroom` binary**: `tools/headroom-mcp-wrapper.ts` spawns `headroom mcp serve` without an availability check. If the binary is not on PATH, OpenCode still registers the MCP, but startup fails cryptically. The wrapper's `child.on("error", ...)` sets an exit code but the diagnostic is buried.

Stakeholders: kit maintainers, downstream consumers who run `npm run install:global`, and OpenCode operators who enable the headroom MCP.

## Goals / Non-Goals

**Goals:**

- Deterministic, documented behavior on long Windows paths.
- Idempotent POSIX persistence helper that round-trips.
- Backup collisions become impossible.
- Missing-binary conditions surface a clear, machine-readable error.

**Non-Goals:**

- Replace `setx` with a PowerShell module.
- Add a GUI installer.
- Change the headroom MCP contract.
- Refactor the existing installer beyond the scope of these four fixes.

## Decisions

### D1 — Measure the configured value before calling `setx`

**Choice**: In `tools/install-opencode-global.ts`, before the `setx` call, measure `globalDir.length + ENV_VAR.length + 1`. If > 900 chars, print a warning that points to `--print` for manual setup and exit 2.

**Rationale**: 900 leaves headroom under Windows' 1024-char limit and accounts for the surrounding `setx` syntax. A measured value is reliable across machines and tool versions.

**Alternatives considered**:

- *Try `setx` and check the registry*: rejected; writes to user environment, hard to roll back.
- *Use PowerShell's `[Environment]::SetEnvironmentVariable`*: rejected; assumes PowerShell availability.

### D2 — `--persist-script <file>` for POSIX

**Choice**: Add a `--persist-script <file>` mode that appends `export OPENCODE_CONFIG_DIR=<path>` to `<file>` if it is not already present, and a `--unset-script <file>` mode that removes the line. The default behavior on POSIX continues to print the export line for transparency.

**Rationale**: Manual profile editing is error-prone. An idempotent appender is safe to re-run and produces a deterministic result.

**Alternatives considered**:

- *Always write to `~/.zshrc`*: rejected; users may prefer `~/.bashrc`, `~/.profile`, or `~/.config/fish/config.fish`. The user passes the file.
- *Shell-detection*: out of scope; the explicit-file mode is portable.

### D3 — Backup stamp with random suffix

**Choice**: Replace `slice(0, 14)` with `slice(0, 14) + "-" + crypto.randomUUID().slice(0, 8)`. Format: `YYYYMMDDHHMMSS-<8-hex>`.

**Rationale**: 8 hex chars give ~4 billion buckets, eliminating practical collisions. UUID v4 is already used in test fixtures.

**Alternatives considered**:

- *Monotonic counter*: rejected; requires persistent state.
- *Higher-precision timestamp*: rejected; Node's `performance.now()` is not wall-clock stable across processes.

### D4 — Pre-check `headroom` availability

**Choice**: In `tools/headroom-mcp-wrapper.ts`, before spawning, attempt `spawnSync("headroom", ["--version"], { stdio: "ignore" })`. On non-zero exit or `ENOENT`, print `error: headroom binary not found on PATH` to stderr and `process.exit(2)`.

**Rationale**: A sync probe is cheap and gives a deterministic exit code that OpenCode can recognize. The probe does not require extra dependencies.

**Alternatives considered**:

- *Rely on the child's `error` event*: rejected; diagnostics are buried, exit code is undocumented.
- *Add an `npm install` step for `headroom`*: out of scope; the binary is provided externally.

## Risks / Trade-offs

- **[Risk] Pre-checking `headroom` adds latency at startup** → The probe is `~10ms` on a fast machine and runs once per MCP startup. Acceptable.
- **[Risk] `--persist-script` could be misused on a shared shell profile** → Document that the mode appends exactly one line per invocation; idempotent re-runs are safe.
- **[Risk] Backup-stamp change breaks log parsing** → Old backup files (no random suffix) remain; new ones add the suffix; both formats coexist.
- **[Risk] Setx guard's 900-char threshold is too aggressive** → 900 is conservative; users with longer paths use `--print`.

## Migration Plan

1. Implement the setx guard and add `--persist-script` / `--unset-script`.
2. Update `tools/init-project.ts` with the new backup-stamp format.
3. Add the `headroom` pre-check.
4. Add regression tests for each fix.
5. Update README to document `--persist-script` and the headroom pre-check behavior.
6. Run `npm run validate:strict` and `npm test`.

## Open Questions

- Should the kit ship a default `~/.bashrc` location when `--persist-script` is omitted on POSIX? Recommendation: no; require explicit path so the user knows where the change lands.
- Should the `headroom` pre-check be configurable via env var (`HEADROOM_BIN`)? Recommendation: yes, but defer to a follow-up.