# Strategy History

This file records materially distinct strategies tried for this change so later sessions do not repeat failed or superseded approaches without new evidence.

## Strategy: archive-official-cli

- **Objective**: Replace model-authored OpenSpec delta synchronization and manual archive movement.
- **Approach**: Invoke the installed official `openspec archive <change> --yes --json` only after an independent completion gate, strict change validation, and explicit project validation argv.
- **Evidence**: OpenSpec 1.6.0 source prepares every target spec, validates every rebuilt spec before writes, emits machine-readable archive identity/totals, and owns Windows move fallback.
- **Outcome**: selected
- **Why**: Reuses the official deterministic parser/merge owner and avoids a private deep import or second implementation.
- **Do Not Repeat**: Do not return to model-edited specs or manual directory moves when the official CLI supports the accepted delta.
- **Retry Condition**: Reconsider only if official CLI runtime proof cannot preserve a required accepted delta semantic and that semantic is explicitly kept in scope.

## Strategy: archive-private-specs-apply

- **Objective**: Synchronize main specs before post-sync project validation without moving the change.
- **Approach**: Deep-import OpenSpec `dist/core/specs-apply.js`, validate, then call archive with `--skip-specs`.
- **Evidence**: `@fission-ai/openspec` exports only its package root; `specs-apply.js` is not a declared package export.
- **Outcome**: rejected
- **Why**: Couples the kit to private package layout and creates an unsupported compatibility boundary.
- **Do Not Repeat**: Do not deep-import OpenSpec `dist/` internals.
- **Retry Condition**: Reconsider only if OpenSpec publishes a supported standalone sync API/CLI.

## Strategy: staged-index-worktree

- **Objective**: Validate exact indexed bytes without disturbing unrelated working-tree changes.
- **Approach**: Build a deterministic commit from `git write-tree`, add a detached temporary worktree, attach only explicit ignored reuse paths, run explicit validation argv, and clean up on every exit.
- **Evidence**: The prior improvised checkout-index proof exposed a validator defect hidden by broader dirty-worktree validation; Git objects preserve the exact staged tree without stashing user work.
- **Outcome**: selected
- **Why**: Exact candidate identity, project-neutral command adapter, and no source-worktree mutation.
- **Do Not Repeat**: Do not use stash/restore or validate the dirty source worktree as a substitute for the staged candidate.
- **Retry Condition**: Reconsider only if Git worktree creation is unavailable or cleanup cannot be technically enforced.

## Strategy: global-tools-distribution

- **Objective**: Make portable executables available with the resolved OpenCode global source.
- **Approach**: Place standalone TypeScript CLI entrypoints under `global/tools/`.
- **Evidence**: Candidate compaction process imported both files as OpenCode custom tools and each top-level CLI parsed OpenCode's `run` argument, emitting `Unknown option: run`; the model output passed its content oracles but the host process exited `2`.
- **Outcome**: rejected
- **Why**: `global/tools/` is a loader-reserved custom-tool location, not a neutral executable distribution directory.
- **Do Not Repeat**: Do not place standalone side-effecting CLI entrypoints under OpenCode `tool/` or `tools/` discovery paths.
- **Retry Condition**: Reconsider only if current OpenCode documentation and isolated loader proof establish an explicit non-loading executable subdirectory contract.

## Strategy: global-bin-distribution

- **Objective**: Keep portable executables colocated with the resolved global kit source without loader side effects.
- **Approach**: Place import-safe CLI modules under `global/bin/` and execute them explicitly by path; every entrypoint uses a main-module guard.
- **Evidence**: This mechanism removes the loader-reserved path and top-level import side effect identified by candidate exit `2`.
- **Outcome**: selected
- **Why**: Preserves project-independent discovery from the global source while separating executable distribution from OpenCode custom-tool loading.
- **Do Not Repeat**: Do not remove the main guard merely because the files currently live outside a loader directory.
- **Retry Condition**: Reconsider only if isolated startup or direct CLI proof remains red after the move.

## Strategy: corrected-sdet-wait-resume

- **Objective**: Obtain the required terminal report from the corrected-candidate SDET after its authorized validation run.
- **Approach**: Resume the same SDET context and ask it to wait for or synchronously finish the library suite, then return the terminal schema.
- **Evidence**: Initial return was `Awaiting the wait timer, then checking library test status.`; resumed return was `Waiting for library suite completion signal.` Neither supplied classification, commands, risk matrix, Candidate Reference, or Effective Model.
- **Outcome**: stalled
- **Why**: Two materially similar continuation requests produced no usable report or new validation evidence.
- **Do Not Repeat**: Do not send another wait/progress-oriented resume to this SDET context without a new terminal process observation.
- **Retry Condition**: Resume only if the runtime adapter exposes a completed child process result that this exact SDET context can inspect and convert into the mandatory report.

## Strategy: corrected-sdet-runtime-reconciliation

- **Objective**: Close the unusable SDET attempt safely and determine whether a conforming terminal report remains reachable.
- **Approach**: Inspect adapter-visible PTY/process liveness, close or quarantine any surviving validation process, preserve raw outputs, then route either an evidence-backed same-context report or a complete cold replacement according to continuity policy.
- **Evidence**: The SDET task adapter reports the child session completed while its text claims an unobserved suite remains pending.
- **Outcome**: selected
- **Why**: Changes the causal mechanism from repeated waiting prompts to direct liveness/evidence reconciliation.
- **Do Not Repeat**: Do not assume task completion alone proves all spawned subprocesses terminated.
- **Retry Condition**: N/A; execute once for this attempt.

## Strategy: replace-global-package-manifest

- **Objective**: Establish an ES module boundary for portable TypeScript executables.
- **Approach**: Replace `global/package.json` with a minimal `private` plus `type: module` manifest.
- **Evidence**: Post-archive diff against base commit showed the replacement removed tracked `@opencode-ai/plugin`, `detect-terminal`, and `node-notifier` dependency declarations.
- **Outcome**: rejected
- **Why**: It fixed module warnings but created an avoidable plugin-install compatibility regression.
- **Do Not Repeat**: Do not replace an existing package manifest to add module type.
- **Retry Condition**: Reconsider only if the prior manifest is generated/untracked and source evidence proves no fields require preservation.

## Strategy: preserve-global-package-manifest

- **Objective**: Keep the ES module boundary without changing existing dependency ownership.
- **Approach**: Preserve every tracked dependency/devDependency field and add only `private: true` and `type: module`.
- **Evidence**: `opencode debug config` exited zero and loaded the expected plugins/updated command templates; direct module imports were side-effect-free; strict validation, installer check, and full pre-push validation exited zero.
- **Outcome**: selected
- **Why**: Smallest compatibility-preserving package metadata change.
- **Do Not Repeat**: Do not normalize, upgrade, or remove dependency declarations as part of portable-tool work.
- **Retry Condition**: Reconsider only for a separately scoped dependency-management change.
