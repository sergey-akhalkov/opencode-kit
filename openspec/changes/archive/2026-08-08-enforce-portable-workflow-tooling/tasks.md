# Tasks

## 1. Portable Contract

- [x] 1.1 Freeze baseline/candidate archive and staged-validation paths, substitution boundaries, invariants, operating envelope, and residual risks in proposal/design.
- [x] 1.2 Add the mandatory reusable-core/project-adapter contract to repository maintainer authority and deterministic validation; proof: missing portability markers fail validation.
- [x] 1.3 Add compaction stagnation detection, pending-history handoff, and per-change `history.md` strategy-switch authority; proof: same-model workflow records prior attempts and selects a mechanism-level alternative.

## 2. Deterministic Archive

- [x] 2.1 Implement the project-neutral archive entrypoint under `global/bin/` with explicit root/change/store/OpenSpec executable/project-validation argv and an import-safe main guard.
- [x] 2.2 Update archive command/skill mirrors and thin kit package adapter to use the portable tool and official machine-readable archive result; remove model sync and manual move instructions.
- [x] 2.3 Run representative complete and incomplete disposable archive workflows; proof: complete delta reaches main spec/archive, incomplete state exits non-zero with no side effects, and no model-authored sync occurs.

## 3. Exact Staged Validation

- [x] 3.1 Implement the project-neutral staged validation entrypoint with deterministic index commit, disposable worktree, explicit reuse paths, argv execution, and fail-closed cleanup.
- [x] 3.2 Add the thin kit package adapter without embedding npm or this repository identity in the reusable core.
- [x] 3.3 Run representative disposable staged/worktree divergence and reuse-path workflows; proof: validation observes staged bytes, ignores conflicting unstaged bytes, preserves child diagnostics, and removes the disposable worktree.

## 4. Portable Distribution And Evidence

- [x] 4.1 Make installer/doctor/docs expose the reusable global tools without assuming a target package manager or operating system.
- [x] 4.2 After current happy-path proof and accepted-scope completion, run one fresh critical-only test SDET with exact test write scope and main disposition.
- [x] 4.3 Run strict validation, complete tests, OpenSpec validation, and pre-push validation on the current candidate; record Candidate Reference, environment, raw proof, limitations, and rollback.
