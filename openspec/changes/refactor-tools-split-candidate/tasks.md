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

- [ ] 2.1 Extract `tools/validators/frontmatter.ts` from the handwritten `getFrontmatterMap` and `convertFromFrontmatterScalar`.
- [ ] 2.2 Extract `tools/validators/skills.ts` (`validateSkills`, `validateFeedbackLedgerArtifacts`).
- [ ] 2.3 Extract `tools/validators/agents.ts` (`validateAgents`, `validateReviewerBashPermission`, `validateReviewerFeedbackEditPermission`, `validateComplainSkillPermission`, `validateImplementationWorker`, `validateSessionDeliveryContextPermission`).
- [ ] 2.4 Extract `tools/validators/profiles.ts` (`validateProfiles`, `validateStringArray`, `findDuplicateStrings`, `compareStringSets`).
- [ ] 2.5 Extract `tools/validators/opencode-config.ts` (`validateOpenCodeConfigFiles`, `validateOpenCodePermissionRules`, `jsonReplacementForAutomationMarkdown`).
- [ ] 2.6 Extract `tools/validators/markdown.ts` (`validateMarkdownFile`, trailing-whitespace, TDD-language detection, forbidden-anchor scan, legacy-tooling-reference scan).
- [ ] 2.7 Extract `tools/validators/devkit-contract.ts` (`validateDevKitContract`, `validatePackageScripts`, `validateInstallerConfigDirModel`, `validateReadme`, `validateAgentsMd`, `validateInstructionFeedbackContracts`).
- [ ] 2.8 Extract `tools/validators/routing.ts` (`validateImplementationWorkerRouting`, `validateSessionDeliveryBinding`).
- [ ] 2.9 Reduce `tools/validate-library.ts` to argument parsing + dispatch + aggregate output; assert it stays under 400 lines.

## 3. Parser replacement

- [ ] 3.1 Add `jsonc-parser` and `js-yaml` and `zod` to `package.json` `dependencies`.
- [ ] 3.2 Replace `stripJsonComments` + `stripJsonTrailingCommas` calls in `tools/validators/opencode-config.ts` with `jsonc-parser`'s `parse(text, null, true)`.
- [ ] 3.3 Replace `getFrontmatterMap` in `tools/validators/frontmatter.ts` with `js-yaml.load` followed by `zod` validation for `name`, `description`, `mode`.
- [ ] 3.4 Add regression tests: invalid YAML, JSONC with `//` and `/* */` comments, JSONC with trailing commas, multiline strings with embedded colons.
- [ ] 3.5 Remove `stripJsonComments`, `stripJsonTrailingCommas`, `getFrontmatterMap`, `convertFromFrontmatterScalar` from the orchestrator.

## 4. Test-runner migration to `node --test`

- [ ] 4.1 Create `tools/test-helpers/fixture-builder.ts` exporting `newLibraryFixture` (extracted from `tools/test-library.ts`).
- [ ] 4.2 Create `tools/test-helpers/temp.ts` exporting `newTempDir`, `withTempDir`, `writeText` for suite-specific use.
- [ ] 4.3 Create `tools/test-helpers/process.ts` exporting `invokeProcessCapture` and `assertSuccess`/`assertFailure`/`assertOutputContains`/`assertOutputExcludes`.
- [ ] 4.4 Migrate `tools/test-library.ts` to `node --test`; assert the suite reports 54+ tests, all passing.
- [ ] 4.5 Migrate `tools/test-library-validation-scripts.ts` to `node --test`.
- [ ] 4.6 Migrate `tools/test-code-quality-inventory.ts` to `node --test`.
- [ ] 4.7 Migrate `tools/test-headroom-mcp-wrapper.ts` to `node --test`.
- [ ] 4.8 Migrate `tools/test-session-env-plugin.ts` to `node --test`.
- [ ] 4.9 Migrate `tools/test-instruction-feedback-ledger.ts` to `node --test`.
- [ ] 4.10 Migrate `tools/test-install-opencode-global.ts` to `node --test`.
- [ ] 4.11 Migrate `tools/test-openspec-operation-gate.ts` to `node --test`.
- [ ] 4.12 Migrate `tools/test-pre-push-validate.ts` to `node --test`.
- [ ] 4.13 Update `package.json` `scripts.test` to `node --test tools/test-*.ts`.

## 5. Delivery-context split

- [ ] 5.1 Create `tools/delivery-context/db.ts` with the SQLite query helpers (`selectSessions`, `selectMessages`, `selectParts`, `selectTodos`, `selectEvents`).
- [ ] 5.2 Create `tools/delivery-context/requirements.ts` exporting `REQUIREMENT_SIGNAL_RULES` and the negation helpers.
- [ ] 5.3 Create `tools/delivery-context/redaction.ts` with `STRUCTURAL_SECRET_KEYS` and the redactor function.
- [ ] 5.4 Create `tools/delivery-context/projection.ts` exporting the result-shape builders.
- [ ] 5.5 Reduce `tools/session-delivery-context.ts` to the CLI entrypoint that wires the modules; assert under 200 lines.

## 6. Validation and archive readiness

- [ ] 6.1 Run `npm run code-quality:inventory`; confirm no file remains in the split-candidate band.
- [ ] 6.2 Run `npm run validate`; confirm zero new errors and zero new warnings vs. the pre-change baseline.
- [ ] 6.3 Run `npm test`; confirm all migrated suites pass and total test count is >= pre-change total.
- [ ] 6.4 Add a snapshot test that diffs `npm run validate` stdout against the captured pre-change baseline.
- [ ] 6.5 Update `README.md` to mention the new module layout and the `node --test` migration.
- [ ] 6.6 Update `docs/feedbacks/audit-opencode-kit-2026-06-27.md` to mark F01-F05 and D05-D08 as resolved.