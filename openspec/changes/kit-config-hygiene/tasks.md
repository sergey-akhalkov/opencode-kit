## 1. Pre-flight investigation

- [ ] 1.1 Run `git ls-files global/package.json | wc -l`; record whether tracked.
- [ ] 1.2 Run `git ls-files global/package-lock.json | wc -l`; record whether tracked.
- [ ] 1.3 Run `git ls-files global/node_modules | wc -l`; record total tracked entries.
- [ ] 1.4 If `global/node_modules` has tracked entries, document `git rm -r --cached global/node_modules` as a follow-up task before completion.

## 2. machineOverride marker

- [ ] 2.1 Update `tools/install-opencode-global.ts` so the provisioned `global/opencode.json` includes `"machineOverride": true`.
- [ ] 2.2 Update `tools/validators/opencode-config.ts` so `validateOpenCodePermissionRules` reads the `machineOverride` field from the parsed config and downgrades `permission: allow` and `permission.<key>: allow` warnings to `INFO:` when the marker is set.
- [ ] 2.3 Add `addInfo` to the validator alongside `addWarning` and `addError`.
- [ ] 2.4 Update the validator summary line (`OK: skills=… agents=… markdown=… warnings=…`) to also report `infos=…`.
- [ ] 2.5 Confirm `validate:strict` (which fails on warnings) still fails when the marker is missing.

## 3. Path overlay pattern

- [ ] 3.1 Edit the working-tree `global/opencode.json` to remove the hardcoded `C:/Users/Sergey/.local/bin/codebase-memory-mcp.exe` provider block.
- [ ] 3.2 Create `global/opencode.local.json.example` with a documented overlay snippet that adds the local provider.
- [ ] 3.3 Update `.gitignore` (root) to add `global/opencode.local.json`.
- [ ] 3.4 Update `README.md` "Configuration layering" subsection to document the overlay pattern.

## 4. .gitignore consistency

- [ ] 4.1 If the pre-flight check showed `global/package.json` and `global/package-lock.json` as tracked: remove their entries from `global/.gitignore`.
- [ ] 4.2 If they were not tracked: add a follow-up task that decides between deletion and hoisting.
- [ ] 4.3 Confirm `global/.gitignore` no longer contains contradictory entries.

## 5. Documentation

- [ ] 5.1 Add a "Configuration layering" subsection to `README.md` covering the three layers, the `machineOverride` marker, and the `opencode.local.json` overlay.
- [ ] 5.2 Update `openspec/project.md` to reference the layering section.
- [ ] 5.3 Update `tools/doctor.ts` so its output mentions which `opencode.json` layer is active (root vs global) when both exist.

## 6. Validation and archive readiness

- [ ] 6.1 Run `npm run validate:strict`; confirm zero errors and zero warnings against the updated config.
- [ ] 6.2 Run `npm test`; confirm all suites pass.
- [ ] 6.3 Add a regression test in `tools/test-library.ts` (or its `node --test` successor) that constructs a fixture repo with `machineOverride: true` and confirms `validate:strict` passes.
- [ ] 6.4 Add a regression test that constructs a fixture repo without `machineOverride: true` and confirms `validate:strict` fails on `permission: allow`.
- [ ] 6.5 Update `docs/feedbacks/audit-opencode-kit-2026-06-27.md` to mark F08, F09, F13, F14, D04 as resolved.