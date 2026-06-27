## 1. Workflow file

- [ ] 1.1 Create `.github/workflows/validate.yml`.
- [ ] 1.2 Configure trigger: `on: pull_request` and `on: push: branches: [main]`.
- [ ] 1.3 Configure `actions/setup-node@v4` with `node-version: 24` and `cache: 'npm'`.
- [ ] 1.4 Add steps in order: `npm ci`, `npm run validate:strict`, `npm test`, `npm run code-quality:inventory -- --root . --format markdown --fail-on-split-candidates --attention-lines 400 --split-lines 800`, `npm run instruction:inventory -- --format markdown`.
- [ ] 1.5 Add conditional OpenSpec gates using `if: hashFiles('openspec/changes/**/*.md') != ''`.
- [ ] 1.6 Set `permissions: contents: read` to scope the workflow token minimally.

## 2. Documentation

- [ ] 2.1 Update `README.md` "Validate" section to reference `.github/workflows/validate.yml`.
- [ ] 2.2 Add a sentence that CI enforces `validate:strict`, `npm test`, `code-quality:inventory`, and `instruction:inventory`.
- [ ] 2.3 Add a CI status badge to `README.md` once the workflow is visible.

## 3. Verification

- [ ] 3.1 Open a draft PR; confirm the workflow runs.
- [ ] 3.2 Confirm a deliberately-broken change (e.g. force a split-candidate file) fails CI as expected.
- [ ] 3.3 Confirm the merged change resolves the failure.

## 4. Archive readiness

- [ ] 4.1 Run `npm run validate:strict`; confirm pass.
- [ ] 4.2 Run `npm test`; confirm pass.
- [ ] 4.3 Update `docs/feedbacks/audit-opencode-kit-2026-06-27.md` to mark F16, T04 as resolved.