# Task 2.2 Runtime Profile Availability Evidence

## Outcome And Ownership

- Candidate: `continuous-complexity-management-profile-r1`.
- Environment: Windows, Node `24.18.1`, OpenCode `1.18.23`, generated disposable `core` profile with external skill catalogs disabled and pure provider-free debug commands.
- Decision: `extend` the existing runtime-surface owner. `CORE_SKILLS`, `CORE_FILES`, `profiles/core.json`, and `profiles/all.json` now name `complexity-management`; core files contain exactly `global/bin/complexity-foraging-contract.ts` and `global/bin/complexity-foraging-inventory.ts`. `all` retains its complete `global/bin` compatibility directory and explicitly lists the same closure because the maintained full-file catalog shares `CORE_FILES`.
- Existing `code-quality-audit`, `codebase-audit-loop`, and `codebase-audit-ledger` remain `all`-only. No always-loaded route, install, active source, target project, provider, model, network, or remote state was changed.

## Profile And Fixture Proof

- The existing runtime-surface profile suite gained one cohesive case that verifies focused availability in core/all, exact core helper closure, all-only changed-code/exhaustive skills, generated core readback, explicit `project-unavailable`/no-approximation text, and a valid custom profile that omits both focused skill and helper closure.
- `node tools/test-library.ts`: exit `0`; terminal `OK: library tests=177`, including `complexity management and its exact helper closure are profile available`, generated core/all byte-readback, hidden-parent rejection, and missing-core fixtures.
- First profile test run failed because the maintained full `all` file catalog expected the newly expanded `CORE_FILES` entries in `profiles/all.json`. Source readback showed directory/file owners are distinct; the exact two files were added to `all` without removing its compatibility directory or weakening validation. The next run passed.
- `node tools/test-complexity-foraging-inventory.ts`: exit `0`; `help=2 cohesive=1 noisy=2 cleanup=complete`, proving profile edits did not alter the helper contract.

## Actual Loader Boundary

- Invocation: `npm run proof:runtime-surface-loader -- --candidate-id continuous-complexity-management-profile-r1 --evidence-root openspec/changes/add-continuous-complexity-management/implementation-evidence/task-2-2-runtime-core-r2 --profile core`.
- OpenCode commands: isolated generated profile, disposable unrelated project, `opencode debug skill`, and `opencode debug agent foundation-integrity-reviewer`; both statuses `0`.
- Result: `passed`; missing core skills `[]`; extra domain skills `[]`; hidden parent hits `[]`; permission failures `[]`; canonical OpenSpec skills complete.
- Generated paths: `complexityManagementSkill=<generated>/skills/complexity-management/SKILL.md`, `complexityForagingContract=<generated>/bin/complexity-foraging-contract.ts`, and `complexityForagingInventory=<generated>/bin/complexity-foraging-inventory.ts`.
- Effects: temporary generated profile/project/XDG roots only; runner reports `cleanup=complete` after terminal child closure.
- Preserved narrower first bundle: `task-2-2-runtime-core/` proved loader discovery before the evaluator exposed helper paths. The proof runner was then extended with exact generated-path checks and recaptured at `task-2-2-runtime-core-r2/`; no provider/model call or semantic workflow was repeated.

## Validation

- `npm run validate:strict`: exit `0`; skills `33`, agents `21`, markdown `873`, warnings `0`, infos `2`.
- `npm run instruction:inventory -- --format markdown`: context quality passed, deterministic errors `0`, review-only `0`.
- `npm run instruction:canonicalize -- --check .`: changed files `0`, safe fixes `0`, deterministic errors `0`.
- `openspec validate add-continuous-complexity-management --strict --no-interactive`: valid.
- Apply operation gate: exit `0`; bounded-falsification structure passes and broad claim remains warning/unknown.
- Serena diagnostics on touched TypeScript report only repository-wide missing Node ambient/library declarations and pre-existing null-narrowing noise; actual Node syntax, runtime suite, strict validation, and loaded boundary pass. No editor-only dependency was added.

## Claim Ceiling

The generated core/all profile contract and actual provider-free OpenCode core loader expose the focused skill and exact helper closure without hidden parent discovery; core keeps changed-code/exhaustive skills unavailable and the source contract reports project mode unavailable rather than approximating it. No always-loaded integrated routing, configured semantic assessment, model result, same-scenario refactor, or population member is supported yet.
