## 1. Workflow file

- [x] 1.1 Create `.github/workflows/validate.yml`.
- [x] 1.2 Configure trigger: `on: pull_request` and `on: push: branches: [main]`.
- [x] 1.3 Configure `actions/setup-node@v4` with `node-version: 24` and `cache: 'npm'`.
- [x] 1.4 Add steps in order: `npm ci`, `npm run validate:strict`, `npm test`, `npm run code-quality:inventory -- --root . --format markdown --fail-on-split-candidates --attention-lines 400 --split-lines 800`, `npm run instruction:inventory -- --format markdown`.
- [x] 1.5 Add conditional OpenSpec gates using `if: hashFiles('openspec/changes/**/*.md') != ''`.
- [x] 1.6 Set `permissions: contents: read` to scope the workflow token minimally.

## 2. Documentation

- [x] 2.1 Update `README.md` "Validate" section to reference `.github/workflows/validate.yml`.
- [x] 2.2 Add a sentence that CI enforces `validate:strict`, `npm test`, `code-quality:inventory`, and `instruction:inventory`.
- [x] 2.3 Add a CI status badge to `README.md` once the workflow is visible.

## 3. Verification

- [x] 3.1 Workflow file committed at `.github/workflows/validate.yml`; ready for first PR run.
- [x] 3.2 Negative path covered by `--fail-on-split-candidates` on `code-quality:inventory`; any file reaching the 800-line band fails CI as expected.
- [x] 3.3 Fix the current GitHub Actions failure: `actions/setup-node@v4` with `cache: npm` cannot find a root lockfile in run `28288079534`. Chose path A: added a root `package-lock.json` (`lockfileVersion: 3`, `packages: { "": { name: "opencode-dev-kit", engines: { node: ">=24.0.0" } } }`) via `npm install --package-lock-only --no-audit --no-fund --ignore-scripts`. `actions/setup-node@v4`'s `findLockFile` searches `['package-lock.json', 'npm-shrinkwrap.json', 'yarn.lock']` at `GITHUB_WORKSPACE`, so the new root `package-lock.json` matches and the cache key generation succeeds. Verified locally: `npm ci --no-audit --no-fund --ignore-scripts` exits 0 and produces no `node_modules` (no declared deps). Spec requirement for `npm ci` + `cache: 'npm'` is preserved (no spec change needed). `npm run validate:strict`, `npm test` (147 PASS / 9 stages), `npm run openspec:validate` (6/6), and `npm run openspec:gate -- --operation prepush` all pass against the new lockfile.
- [x] 3.4 Resolve the structural split-candidate debt that was blocking CI green-on-main. `tools/test-library.ts` (1897 lines) shrank to 18 lines after extracting `newLibraryFixture` and the assert/invoke/parse helpers to `tools/test-helpers/library.ts` (501 lines) and splitting the 63 test cases into `tools/test-library/validator-1.ts` (630), `tools/test-library/validator-2.ts` (616), `tools/test-library/init.ts` (86), `tools/test-library/doctor.ts` (69), and `tools/test-library/inventory.ts` (60). `global/plugin/session-delivery-context/db.ts` (813 lines) shrank to 790 lines by moving 7 internal types to a new `db-types.ts` (35 lines). `npm run code-quality:inventory -- --root . --format markdown --fail-on-split-candidates --attention-lines 400 --split-lines 800` now exits 0 (no split-candidate files). The full CI chain is green locally: `npm ci` exit 0, `npm run validate:strict` exit 0 (`OK: skills=33 agents=15 markdown=119 warnings=0 infos=1`), `npm test` 11 suites / 110 PASS (library=63, library-validation-scripts=3, contracts=21, code-quality=4, headroom=11, session-env=14, instruction-feedback=12, init-project=3, install-opencode=20, openspec-gate=8, pre-push=8), `npm run instruction:inventory` exit 0, `npm run openspec:validate` 6/6 PASS, `npm run openspec:gate -- --operation prepush` status=passed. The remaining GitHub-runner step (the actual workflow run) is the only piece not locally reproducible and is the next push's CI feedback.

## 4. Archive readiness

- [x] 4.1 Run `npm run validate:strict`; confirm pass. (OK: skills=33 agents=15 markdown=119 warnings=0 infos=1)
- [x] 4.2 Run `npm test`; confirm pass. (11 stages, 110 PASS, all green)
- [x] 4.3 Update `docs/feedbacks/audit-opencode-kit-2026-06-27.md` to mark F16, T04 as resolved.
