## Why

The kit ships a `templates/ci/github-actions.yml` template that downstream consumers can copy, but the kit itself has no `.github/workflows/` directory. Every contributor must remember to enable the local git hook manually (`git config core.hooksPath .githooks`) and there is no CI feedback loop for the validator or the test suite. As a result, regressions land without any machine-checked gate.

## What Changes

- Add `.github/workflows/validate.yml` that runs on `pull_request` and on push to `main`. The job SHALL:
  - Set up Node 24.
  - Run `npm ci`.
  - Run `npm run validate:strict`.
  - Run `npm test`.
  - Run `npm run code-quality:inventory` and fail when any file is in the split-candidate band.
  - Run `npm run instruction:inventory` and surface any repeated-line drift.
  - Run `npm run openspec:validate` when `openspec/changes/` is non-empty.
  - Run `npm run openspec:gate -- --operation prepush` when `openspec/` exists.
- Mirror the same checks into a second matrix job on `ubuntu-latest` so POSIX path handling is exercised at least once per change.
- Cache `~/.npm` to keep CI fast.
- Document the CI workflow in `README.md` "Validate" section and reference the existing `templates/ci/github-actions.yml` as the user-facing template.

## Capabilities

### New Capabilities

- `library-ci-validation`: defines the CI workflow that runs the kit's own validators and tests on every PR, providing a machine-checked gate independent of local pre-push hooks.

## Impact

- New file: `.github/workflows/validate.yml`.
- `README.md` "Validate" subsection gains a paragraph about CI.
- The CI configuration references the existing npm scripts; no script changes required.