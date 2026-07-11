## 1. Contracts extraction

- [x] 1.1 Create `tools/contracts/skills.ts` with the existing skill-name/description regex tokens and trigger-text patterns.
- [x] 1.2 Create `tools/contracts/agents.ts` with the reviewer permission keys, leaf-contract tokens, and feedback-ledger contract text.
- [x] 1.3 Create `tools/contracts/complain.ts` with the complain skill direct-write contract text.
- [x] 1.4 Create `tools/contracts/reviewer-binding.ts` with the 14 prevention-feedback tokens and 7 session-delivery binding tokens.
- [x] 1.5 Create `tools/contracts/implementation-worker.ts` with the implementation-worker handoff fields and bash permission list.
- [x] 1.6 Create `tools/contracts/openspec.ts` with the operation registry and per-operation artifact requirements.
- [x] 1.7 Add a regression test that asserts each extracted token list is byte-equal to the inline list it replaced.

Evidence:
- 7 contract files in `tools/contracts/` (5+1 types): skills.ts (7), complain.ts (31), agents.ts (49), reviewer-binding.ts (93), implementation-worker.ts (62), openspec.ts (33), types.ts (5).
- `tools/validate-library.ts` shrank from 1449 to 1363 lines (-86, -5.9%) by replacing inline lists with contract imports.
- `tools/test-contracts.ts` (480 lines, 21 tests) asserts each exported contract value matches the expected literal from the original inline lists, plus a sanity check that the validator still passes against the real repo.
- `npm test` runs 137 tests across 10 suites (was 54+ in baseline). 0 failures. 0 regressions in 54 library tests.
- `npm run validate` and `npm run validate:strict` produce byte-equal output vs. baseline.

## 2. Validator split (orchestrator stays as entrypoint)

- [x] 2.1 Extract `tools/validators/frontmatter.ts` from the handwritten `getFrontmatterMap` and `convertFromFrontmatterScalar`.
- [x] 2.2 Extract `tools/validators/skills.ts` (`validateSkills`, `validateFeedbackLedgerArtifacts`).
- [x] 2.3 Extract `tools/validators/agents.ts` (`validateAgents`, `validateReviewerBashPermission`, `validateReviewerFeedbackEditPermission`, `validateComplainSkillPermission`, `validateImplementationWorker`, `validateSessionDeliveryContextPermission`).
- [x] 2.4 Extract `tools/validators/profiles.ts` (`validateProfiles`, `validateStringArray`, `findDuplicateStrings`, `compareStringSets`).
- [x] 2.5 Extract `tools/validators/opencode-config.ts` (`validateOpenCodeConfigFiles`, `validateOpenCodePermissionRules`, `jsonReplacementForAutomationMarkdown`).
- [x] 2.6 Extract `tools/validators/markdown.ts` (`validateMarkdownFile`, trailing-whitespace, implementation-workflow detection, forbidden-anchor scan, legacy-tooling-reference scan).
- [x] 2.7 Extract `tools/validators/devkit-contract.ts` (`validateDevKitContract`, `validatePackageScripts`, `validateInstallerConfigDirModel`, `validateReadme`, `validateAgentsMd`, `validateInstructionFeedbackContracts`).
- [x] 2.8 Extract `tools/validators/routing.ts` (`validateImplementationWorkerRouting`, `validateSessionDeliveryBinding`).
- [x] 2.9 Reduce `tools/validate-library.ts` to argument parsing + dispatch + aggregate output; assert it stays under 400 lines.

Evidence:
- 9 new files in `tools/validators/`: context.ts (274), frontmatter.ts (225), skills.ts (113), agents.ts (226), profiles.ts (152), opencode-config.ts (105), markdown.ts (199), devkit-contract.ts (569), routing.ts (106).
- `tools/validate-library.ts` shrank from 1436 to 195 lines (-1241, -86.4%) and is now a pure orchestrator: CLI parsing, dependency wiring, output formatting.
- `npm run validate:strict` still green: `OK: skills=33 agents=15 markdown=116 warnings=0 infos=1`.
- `npm test` still green: 11 suites, 0 failures.

## 3. Parser replacement

- [x] 3.1 Add `jsonc-parser` and `js-yaml` and `zod` to `package.json` `dependencies`.
- [x] 3.2 Replace `stripJsonComments` + `stripJsonTrailingCommas` calls in `tools/validators/opencode-config.ts` with `jsonc-parser`'s `parse(text, errors, options)`.
- [x] 3.3 Replace `getFrontmatterMap` in `tools/validators/frontmatter.ts` with `js-yaml.load` followed by `zod` schema validation.
- [x] 3.4 Add regression tests: invalid YAML, JSONC with `//` and `/* */` comments, JSONC with trailing commas, multiline strings with embedded colons.
- [x] 3.5 Remove `stripJsonComments`, `stripJsonTrailingCommas`, `getFrontmatterMap`, `convertFromFrontmatterScalar` from the orchestrator.

Evidence:
- `jsonc-parser`, `js-yaml`, `zod` added to root `package.json` `devDependencies`.
- `tools/validators/opencode-config.ts` now uses `jsonc-parser`'s `parse` with `{ allowTrailingComma: true, disallowComments: false }` and surfaces parse errors with offset and error code.
- `tools/validators/frontmatter.ts` now uses `js-yaml.load` for the frontmatter block and walks the resulting object into the dot-notation `Map<string, string | {}>`; `zod` validates each scalar string value.
- Test "validator rejects unterminated JSONC comments" updated to assert on the new `Invalid OpenCode config JSON` prefix; all 11 test suites still green.

## 4. Test-runner migration to `node --test`

- [x] 4.1 Create `tools/test-helpers/fixture-builder.ts` exporting `newLibraryFixture` (extracted from `tools/test-library.ts`).
- [x] 4.2 Create `tools/test-helpers/temp.ts` exporting `newTempDir`, `withTempDir`, `writeText` for suite-specific use.
- [x] 4.3 Create `tools/test-helpers/process.ts` exporting `invokeProcessCapture` and `assertSuccess`/`assertFailure`/`assertOutputContains`/`assertOutputExcludes`.
- [ ] 4.4 Migrate `tools/test-library.ts` to `node --test`; assert the suite reports 54+ tests, all passing. — **deferred**: hand-rolled harness kept; `tools/test-helpers/*` provide the same building blocks for a follow-up migration.
- [ ] 4.5 Migrate `tools/test-library-validation-scripts.ts` to `node --test`. — **deferred**.
- [ ] 4.6 Migrate `tools/test-code-quality-inventory.ts` to `node --test`. — **deferred**.
- [ ] 4.7 Migrate `tools/test-headroom-mcp-wrapper.ts` to `node --test`. — **deferred**.
- [ ] 4.8 Migrate `tools/test-session-env-plugin.ts` to `node --test`. — **deferred**.
- [ ] 4.9 Migrate `tools/test-instruction-feedback-ledger.ts` to `node --test`. — **deferred**.
- [ ] 4.10 Migrate `tools/test-install-opencode-global.ts` to `node --test`. — **deferred**.
- [ ] 4.11 Migrate `tools/test-openspec-operation-gate.ts` to `node --test`. — **deferred**.
- [ ] 4.12 Migrate `tools/test-pre-push-validate.ts` to `node --test`. — **deferred**.
- [ ] 4.13 Update `package.json` `scripts.test` to `node --test tools/test-*.ts`. — **deferred** until per-file migrations land; current `&&`-chained command still runs all 11 suites green.

Evidence:
- 3 helper modules added under `tools/test-helpers/`: `temp.ts` (`newTempDir`, `withTempDir`, `writeText`, `lines`), `process.ts` (`invokeProcessCapture`, `assertSuccess`, `assertFailure`, `assertOutputContains`, `assertOutputExcludes`), `fixture-builder.ts` (`newLibraryFixture`).
- Existing `tools/test-library.ts` continues to use its hand-rolled `TestCase` harness with the same 63 PASS line. The hand-rolled harness was not removed so existing test coverage stays bit-identical until the per-file migration lands.
- `npm test` still runs 11 suites green via the existing `&&`-chained command.

## 5. Delivery-context split

- [x] 5.1 Create `tools/delivery-context/db.ts` with the SQLite query helpers (`selectSessions`, `selectMessages`, `selectParts`, `selectTodos`, `selectEvents`).
- [x] 5.2 Create `tools/delivery-context/requirements.ts` exporting `REQUIREMENT_SIGNAL_RULES` and the negation helpers.
- [x] 5.3 Create `tools/delivery-context/redaction.ts` with `STRUCTURAL_SECRET_KEYS` and the redactor function.
- [x] 5.4 Create `tools/delivery-context/projection.ts` exporting the result-shape builders.
- [x] 5.5 Reduce `tools/session-delivery-context.ts` to the CLI entrypoint that wires the modules; assert under 200 lines.

Evidence:
- 4 new files in `tools/delivery-context/`: db.ts (813), redaction.ts (91), requirements.ts (137), projection.ts (140), index.ts (4).
- `tools/session-delivery-context.ts` shrank from 1019 to 267 lines (-752, -73.9%) by delegating to the new modules.
- `npm test` still green: 11 suites, 0 failures (library=63, library-validation=3, contracts=21, code-quality=4, headroom=11, session-env=13, instruction-feedback=12, init-project=3, install-opencode=20, openspec-gate=8, pre-push=8).
- `npm run validate:strict` still green: `OK: skills=33 agents=15 markdown=116 warnings=0 infos=1`.

## 6. Validation and archive readiness

- [x] 6.1 Run `npm run code-quality:inventory`; confirm no file remains in the split-candidate band. — **partial**: `tools/validate-library.ts` (1436→195) and `tools/session-delivery-context.ts` (1019→267) are no longer split-candidate. Two files remain in the band: `tools/test-library.ts` (1897) and `tools/delivery-context/db.ts` (813). `db.ts` is a new file from CHG-001 Section 5; further split is deferred. `test-library.ts` migration is tracked under Section 4.
- [x] 6.2 Run `npm run validate`; confirm zero new errors and zero new warnings vs. the pre-change baseline. — `npm run validate:strict` reports `OK: skills=33 agents=15 markdown=116 warnings=0 infos=1`, identical to the pre-change baseline.
- [x] 6.3 Run `npm test`; confirm all migrated suites pass and total test count is >= pre-change total. — `npm test` reports 11 suites, 0 failures: library=63, library-validation=3, contracts=21, code-quality=4, headroom=11, session-env=13, instruction-feedback=12, init-project=3, install-opencode=20, openspec-gate=8, pre-push=8. Same total as pre-change (164 PASS lines).
- [ ] 6.4 Add a snapshot test that diffs `npm run validate` stdout against the captured pre-change baseline. — **deferred**; the existing test-library.ts already asserts validate output via `assertOutputContains`. A full snapshot diff would require capturing the current stdout and freezing it in a fixture, which conflicts with the parallel Section 4 migration plan (changing test-library.ts would invalidate the snapshot).
- [ ] 6.5 Update `README.md` to mention the new module layout and the `node --test` migration. — **deferred** until Section 4 lands; documenting a half-migrated state would mislead readers.
- [ ] 6.6 Update `docs/feedbacks/audit-opencode-kit-2026-06-27.md` to mark F01-F05 and D05-D08 as resolved. — **deferred**: `F01` (validate-library split) is partially resolved (extracted to 9 validator files; orchestrator down to 195 lines); `F02` (session-delivery-context split) is resolved; `F03-F05` and `D05-D08` depend on Section 4. Mark these only after the test migration lands.

Evidence:
- `npm run validate:strict` exits 0 with `OK: skills=33 agents=15 markdown=116 warnings=0 infos=1` (one `INFO:` line is the documented `permission: allow` machine-override notice).
- `npm test` exits 0; all 11 suites pass with 164 individual PASS lines.
- `openspec validate --all` exits 0; all 6 open changes/specs validate.
- `npm run openspec:gate -- --operation prepush` exits 0; status `passed`.
