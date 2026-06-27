## 1. setx truncation guard

- [x] 1.1 In `tools/install-opencode-global.ts`, add a `measuredValueLength()` helper that returns `globalDir.length + ENV_VAR.length + 1`.
- [x] 1.2 In `runSet`, before the `setx` call, check `measuredValueLength() > 900`. If true, print a warning that names the `setx` 1024-char limit, print the `--print` command, and `process.exit(2)`.
- [x] 1.3 Add a regression test in `tools/test-install-opencode-global.ts` (or its `node --test` successor) using a fake `runSet` that exercises the long-path branch without invoking `setx`.

## 2. POSIX persistence helper

- [x] 2.1 Add `--persist-script <file>` to `parseArgs` and `Options` in `tools/install-opencode-global.ts`.
- [x] 2.2 Add `--unset-script <file>` symmetrically.
- [x] 2.3 Implement `appendExportLine(file, envLine)` that reads the file, checks for the export line, and appends if missing.
- [x] 2.4 Implement `removeExportLine(file, envName)` that strips the matching export line.
- [x] 2.5 Wire the new modes in `main()` so they exit zero on success.
- [x] 2.6 Add regression tests for idempotent append, idempotent unset, and unchanged-file edge cases.

## 3. Backup stamp collision resistance

- [x] 3.1 In `tools/init-project.ts`, replace the backup-stamp computation with `stamp + "-" + crypto.randomUUID().slice(0, 8)`.
- [x] 3.2 Update `backupExisting` to format the directory name as `<YYYYMMDDHHMMSS>-<8-hex>`.
- [x] 3.3 Add a regression test that calls `backupExisting` twice within the same second and confirms the two paths differ.
- [x] 3.4 Update `package.json` to confirm `node:crypto` import works (it is a built-in Node module).

## 4. headroom binary availability check

- [x] 4.1 In `tools/headroom-mcp-wrapper.ts`, add `probeHeadroom()` that runs `spawnSync("headroom", ["--version"], { stdio: "ignore" })` and returns `{ available, exitCode, signal }`.
- [x] 4.2 In `startHeadroomMcpWrapper`, call `probeHeadroom()` before `spawn("headroom", ["mcp", "serve"])`.
- [x] 4.3 On `available === false`, print `error: headroom binary not found on PATH` and `process.exit(2)`.
- [x] 4.4 On `exitCode !== 0`, print `error: headroom binary not usable (exit <code>)` and `process.exit(3)`.
- [x] 4.5 Add regression tests using a tempdir that contains a fake `headroom` shim with a known exit code, and a tempdir that contains no `headroom`.

## 5. Validation and archive readiness

- [x] 5.1 Run `npm run validate:strict`; confirm no regressions. (`OK: skills=33 agents=15 markdown=114 warnings=0 infos=1`)
- [x] 5.2 Run `npm test`; confirm all suites pass and total test count is >= pre-change total. (10 stages all PASS: init-project=3 new, install-opencode-global=20 was 8, headroom-mcp-wrapper=11 was 7, others unchanged)
- [x] 5.3 Update `README.md` to document `--persist-script`, `--unset-script`, and the headroom pre-check behavior.
- [x] 5.4 Update `docs/feedbacks/audit-opencode-kit-2026-06-27.md` to mark F18, F19, F20, F22, T01, T07, T08 as resolved.