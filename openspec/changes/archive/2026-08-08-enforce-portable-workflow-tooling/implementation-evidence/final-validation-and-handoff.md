# Final Validation And Handoff

Date: 2026-08-08

## Candidate Reference

- Change: `enforce-portable-workflow-tooling`
- Base commit: `2370675cedb577af09a59a25ccafa69a36619a60`
- Product Candidate: scoped working-tree paths documented by this change: portable `global/bin/` cores, thin package/archive mirrors, installer/doctor/operation gate/maintainer validators, runtime+compaction instructions, docs/templates, SDET tests, and delta specs.
- Excluded dirty work: separate feedback-ledger and `integrate-continuous-sdlc-learning` deletions plus `.serena/` are not part of this candidate and remain untouched.

## Runtime And SDET

- Archive and staged validation reached unrelated disposable project boundaries with current absolute spaced Node argv and complete cleanup.
- OpenCode loader-safe candidate and compaction strategy-switch workflow exited zero.
- Fresh corrected-candidate SDET: `ses_01db4db2cffevyD3jAKSnptBiE`, Effective Model `xai/grok-4.5`, terminal `no-critical-risk`.
- Confirmed critical correction history: `PWT-WIN-ARGV-SPACES-001` reproduced, fixed, re-proved, and covered by exact regression oracle.

## Current Validation

```text
npm run validate:strict                         -> exit 0, markdown=208, warnings=0, infos=2
npm run openspec:validate                       -> exit 0, 9 passed / 0 failed
openspec validate enforce-portable-workflow-tooling --strict -> exit 0
node tools/install-opencode-global.ts --check   -> exit 0
npm run install:global -- --dry-run             -> exit 0, no environment mutation
npm run instruction:inventory                   -> exit 0, 53 artifacts / 4114 lines / token proxy 83625
git diff --check                                -> exit 0
npm run prepush:validate                        -> exit 0, validation + 10 serial test files + 9 OpenSpec items
```

## Dogfood Complete Archive

The completed change archived through its own new thin adapter:

```text
npm run openspec:archive -- --change enforce-portable-workflow-tooling -- npm run prepush:validate
```

Observed completion gate `artifacts=4 tasks=12/12`; pre-archive strict and project validation exited zero; official OpenSpec archive synchronized and moved the change; post-archive OpenSpec and project validation exited zero. Final machine result: `status=archived`, `specsUpdated=true`, totals `added=6 modified=0 removed=0 renamed=0`, path `openspec/changes/archive/2026-08-08-enforce-portable-workflow-tooling`.

Post-archive compatibility inspection found that the initial module-boundary edit had replaced existing `global/package.json` dependencies. The final candidate preserves every base dependency/devDependency and adds only `private` plus `type: module`. Current `opencode debug config`, import-safe module loading, installer check, strict validation, and full pre-push validation all exit zero on that corrected manifest.

## Known Non-Critical Limitations

- OpenSpec 1.6 deterministic merge rejects partial `MODIFIED` requirements that omit existing scenarios; the wrapper fails closed and does not restore model merge behavior.
- If post-archive project validation fails, the official archive has already reported and performed its local move; the wrapper returns non-zero with that archive path rather than claiming success or guessing a rollback.
- `--reuse` paths are explicit trusted ignored local dependencies. The staged tool rejects tracked/symlink/non-directory sources but does not attest dependency contents.
- Windows spaced `.exe/.com` paths are directly proven. Non-native spaced `.cmd/.bat` wrappers remain on the guarded cmd path with fixture coverage; no current critical defect is reproduced.
- Staged validation creates an unreachable deterministic Git commit object; normal Git garbage collection owns eventual object cleanup after worktree removal.
- The gitignored machine-local `global/opencode.json` was updated for the current owner, but OpenCode config is load-on-start; existing OpenCode sessions retain their previously loaded compaction prompt until restart.

## Rollback

Restore the scoped repository files to base commit content and remove the local `global/bin/`/`global/package.json` additions. No remote operation, installation, deployment, release, credential use, or environment mutation occurred. Disposable proof directories can be removed independently.

## Lifecycle

- Stable Candidate: `RC1`
- Development-Stage: `stable`
- External Operations: not performed.
