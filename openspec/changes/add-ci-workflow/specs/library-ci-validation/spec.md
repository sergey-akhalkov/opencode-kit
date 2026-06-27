## ADDED Requirements

### Requirement: CI validation workflow

The repository SHALL contain `.github/workflows/validate.yml` that runs on `pull_request` and on `push` to `main`. The workflow SHALL install dependencies with `npm ci`, run `npm run validate:strict`, run `npm test`, and fail on any non-zero exit.

#### Scenario: PR opened

- **WHEN** a contributor opens a pull request
- **THEN** GitHub Actions SHALL run the validate workflow
- **AND** the workflow SHALL report pass/fail status to the PR.

#### Scenario: push to main

- **WHEN** a commit is pushed to `main`
- **THEN** GitHub Actions SHALL run the validate workflow
- **AND** a regression SHALL fail the run.

### Requirement: Code-quality inventory in CI

The CI workflow SHALL run `npm run code-quality:inventory -- --root . --format markdown --fail-on-split-candidates --attention-lines 400 --split-lines 800`. A file in the split-candidate band SHALL fail the build.

#### Scenario: split-candidate file introduced

- **WHEN** a contributor lands a 900-line code file
- **THEN** CI SHALL fail with the inventory's report naming the file
- **AND** the contributor SHALL be required to split or justify the file before merge.

### Requirement: Instruction inventory in CI

The CI workflow SHALL run `npm run instruction:inventory -- --format markdown` and SHALL fail when the `Repeated Lines` table contains more than the canonical-source entries.

#### Scenario: contract duplication regression

- **WHEN** a reviewer agent is edited to re-inline the prevention-feedback block
- **THEN** `instruction:inventory` SHALL show the block repeated
- **AND** CI SHALL fail.

### Requirement: OpenSpec gates in CI when OpenSpec exists

The CI workflow SHALL run `npm run openspec:validate -- --all` and `npm run openspec:gate -- --operation prepush` when `openspec/` exists and contains changes. When `openspec/` exists but no changes exist, the workflow SHALL skip the gate.

#### Scenario: openspec with active changes

- **WHEN** `openspec/changes/` is non-empty
- **THEN** CI SHALL run `npm run openspec:validate -- --all`
- **AND** SHALL run `npm run openspec:gate -- --operation prepush`.

#### Scenario: openspec without changes

- **WHEN** `openspec/` exists but `openspec/changes/` is empty
- **THEN** CI SHALL skip the OpenSpec gates without failing.

### Requirement: npm cache

The CI workflow SHALL configure `actions/setup-node@v4` with `cache: 'npm'` to share `~/.npm` cache between runs.

#### Scenario: cache hit

- **WHEN** the cache key matches the previous run
- **THEN** `npm ci` SHALL reuse the cache
- **AND** the install step SHALL complete in under 30 seconds.

### Requirement: README documents CI

The `README.md` SHALL include a brief paragraph in the "Validate" section that points to `.github/workflows/validate.yml` as the machine-checked gate.

#### Scenario: contributor reads README

- **WHEN** a contributor reads the Validate section
- **THEN** they SHALL find a reference to the CI workflow
- **AND** they SHALL understand that strict validation runs on every PR.