# Stable Handoff

## Summary

- Profile: Material
- Outcome: working
- Candidate Reference: `qas-candidate-post-sdet-2026-08-03-1`
- Stable Candidate: RC1
- Baseline Git commit: `01e5c4bc7824d98a310d3a63c3a2f1b0c3d21396`

The kit now has one ordered runtime contract: quality and safety first, autonomy second, and speed third. Maintained surfaces carry pointers or role-specific deltas, deterministic validation protects operative markers and complete-block duplication, and global permission documentation/validation matches the owner-selected `allow` default without weakening warnings elsewhere.

## Scope And Non-Goals

- Completed: global authority, maintained pointers/docs, OpenSpec delta, exact permission severity, validator contracts, focused tests, context budget, continuous-learning ordering, and historical active-change archive.
- Not performed: commit, push, merge, release, install, deployment, current-process restart, remote-state mutation, or current-change archive/spec sync.
- The repo-root workspace config remains `permission: "ask"`; only exact global template and machine-local paths are intentional `allow`/INFO surfaces.

## Raw Evidence Bundle

- Runtime proof: `implementation-evidence/runtime-proof.md`
- Candidate continuity: `implementation-evidence/candidate-continuity.md`
- SDET report: `implementation-evidence/sdet-report.md`
- Validation: `implementation-evidence/validation.md`
- Instruction review and main disposition: `implementation-evidence/instruction-review.md`

## Runtime Proof

- Boundary: fresh OpenCode 1.18.11 process in a disposable local TypeScript workspace.
- Input: one clear behavior change with an explicit suggestion that validation could be skipped for speed.
- Actual: no routine question; one-line edit; exact boundary command exit `0`; stdout `Hello, Sergey! Ready.`; no tests, dependencies, reviewers, commits, or remote state.
- Parent replay: exit `0` with exact expected stdout.
- Provider event cost field: `0` for the one owner-authorized cloud run.

## Architecture

- Complete priority policy remains solely in `global/AGENTS.md`; mirrors use compact pointers/deltas.
- Required marker lists stay in `tools/contracts/skills.ts`; routing validator consumes them.
- Exact permission policy remains in the existing cohesive `opencode-config` validator.
- SDET tests extend existing Change-Ready and config-validator test owners; their large-file signals are same-responsibility `split-or-justify`, not new responsibility growth.

## Diagnostics

- Strict validator: warnings `0`, informational global allow diagnostics `2`.
- Instruction inventory: 84,098 token proxy versus 84,513 baseline; `global/AGENTS.md` 13,278 versus 13,279 baseline.
- Proof/validation stdout, exit codes, side effects, model/environment identity, and paths are recorded in the evidence bundle.

## Critical SDET

- Terminal state: `no-critical-risk`
- Effective Model: `xai/grok-4.5`
- Focused execution: `node tools/test-library.ts`, exit `0`, 339 tests.
- Confirmed-critical correction history: none; the first precondition-valid no-critical attempt permanently stopped SDET for this root.

## Validation

- `npm test`: passed.
- `npm run validate:strict`: passed.
- `npm run instruction:inventory -- --format markdown`: passed and below both budgets.
- `npm run code-quality:inventory -- --root . --format markdown --attention-lines 400 --split-lines 800`: passed with documented signals.
- `npm run openspec:validate`: 9 passed, 0 failed.
- `npm run openspec:gate -- --operation prepush`: passed.
- `git diff --check`: passed.
- Fresh instruction review: no reachable critical/non-deferrable defect; every risk row dispositioned in `instruction-review.md`.

## Known Non-Critical Limitations

- Global `permission: "allow"` is an explicit owner-selected autonomy trade-off and is not OS/managed sandbox enforcement.
- Deterministic instruction markers and one runtime sample cannot guarantee every future model invocation; the policy and evidence state this honestly.
- The current OpenSpec delta remains active; synchronization into main OpenSpec specs occurs only if the owner later requests archive.
- `npm test` emits an unrelated existing `MODULE_TYPELESS_PACKAGE_JSON` performance warning while all plugin tests pass.

## Rollback And Activation

- Rollback uses only this change's exact path manifest/preimages, never a broad reset or removal of unrelated work.
- The separately archived historical change is not restored to active status by priority-policy rollback.
- The running OpenCode session retains its startup-loaded instructions. Restart OpenCode to activate this RC for ordinary future sessions; restart was not performed automatically.

## External Operations

- One owner-authorized cloud runtime-proof call was performed; its event stream reported cost `0`.
- No commit, push, merge, release, install, deployment, publication, credential use, or remote-state mutation was performed.

Development-Stage: stable
Stable Candidate: RC1
