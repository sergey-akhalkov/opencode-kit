## Context

The kit's validators (`npm run validate`, `npm run validate:strict`) and tests (`npm test`) are the only machine-checked gates. They run locally when a developer remembers to invoke them. The local pre-push hook (`tools/pre-push-validate.ts`) only runs after `git config core.hooksPath .githooks`, which is opt-in.

Without a CI workflow, regressions slip through:
- A reviewer could approve a PR that breaks `npm run validate:strict`.
- A new split-candidate file could land because `npm run code-quality:inventory` was not run.
- OpenSpec changes could be archived without `npm run openspec:validate` running.

The kit ships `templates/ci/github-actions.yml` for downstream consumers but does not apply the same discipline to itself. This change closes that gap.

Stakeholders: kit maintainers, contributors without local hooks enabled, and downstream consumers who look at the repo's own CI as a quality signal.

## Goals / Non-Goals

**Goals:**

- A `.github/workflows/validate.yml` that runs on every PR and push to main.
- The job runs every npm script the kit defines that is machine-checkable.
- POSIX path handling is exercised at least once per change.

**Non-Goals:**

- Replace local pre-push hooks.
- Add release automation (separate change).
- Add code coverage reporting.
- Change the validator behavior to gate CI exclusively.

## Decisions

### D1 — One workflow file, multiple commands

**Choice**: A single `validate.yml` runs all machine-checkable commands in sequence: `npm ci`, `npm run validate:strict`, `npm test`, `npm run code-quality:inventory` (with `--fail-on-split-candidates`), `npm run instruction:inventory`, conditional OpenSpec gates.

**Rationale**: A single file keeps the CI surface obvious. Multiple workflow files (one per check) fragment review.

**Alternatives considered**:

- *One workflow per check*: rejected; over-engineered for the kit's size.
- *Reusable workflow imported into per-check jobs*: rejected; adds indirection without benefit at this scale.

### D2 — Ubuntu primary + Windows matrix when budget allows

**Choice**: Default to `ubuntu-latest`. If the project later grows, add `windows-latest` as a matrix entry. Document the asymmetry.

**Rationale**: Ubuntu is the cheapest runner and exercises POSIX path handling. Windows adds cost; defer until there is evidence that Windows-only bugs exist.

**Alternatives considered**:

- *Matrix on day one*: rejected; costs more, gains little for a kit whose primary runtime is Node and whose platform-specific code paths are minimal.

### D3 — Cache `~/.npm`

**Choice**: Use `actions/cache@v4` keyed on `package-lock.json` hash to restore `~/.npm` between runs.

**Rationale**: `npm ci` is fast when cache is warm; cold install of every CI run costs minutes.

### D4 — code-quality:inventory fails on split-candidates

**Choice**: The CI step runs `npm run code-quality:inventory -- --fail-on-split-candidates`. Any file reaching the 800-line band fails the build.

**Rationale**: This makes the F01 finding structurally enforceable. The validator cannot regress without CI failure.

### D5 — OpenSpec steps conditional on existence

**Choice**: `npm run openspec:validate` and `npm run openspec:gate -- --operation prepush` run only when `openspec/` exists and is non-empty.

**Rationale**: Today the kit has `openspec/project.md` only; CI would otherwise fail on a missing changes directory.

## Risks / Trade-offs

- **[Risk] CI secrets required for OpenCode provider** → The CI workflow runs only validators and tests; it does not invoke OpenCode. No secrets required.
- **[Risk] Code-quality:inventory thresholds drift** → Pin `--attention-lines=400 --split-lines=800` explicitly in the CI invocation.
- **[Risk] Cache poisoning** → Keying on `package-lock.json` hash invalidates the cache automatically when dependencies change.

## Migration Plan

1. Create `.github/workflows/validate.yml`.
2. Update `README.md` "Validate" section.
3. Add a CI status badge to `README.md` once the workflow is merged and visible.

## Open Questions

- Should the workflow also run `npm run doctor -- --project .`? Recommendation: no; doctor checks a target project's readiness, not the kit itself.
- Should the workflow publish a coverage report? Recommendation: no; coverage is out of scope for this change.