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
- [ ] 3.3 Confirm the merged change resolves the failure (deferred to PR-level verification on GitHub; local CI machinery is not runnable here).

## 4. Archive readiness

- [x] 4.1 Run `npm run validate:strict`; confirm pass. (OK: skills=33 agents=15 markdown=115 warnings=0)
- [x] 4.2 Run `npm test`; confirm pass. (9 stages, all PASS)
- [x] 4.3 Update `docs/feedbacks/audit-opencode-kit-2026-06-27.md` to mark F16, T04 as resolved.