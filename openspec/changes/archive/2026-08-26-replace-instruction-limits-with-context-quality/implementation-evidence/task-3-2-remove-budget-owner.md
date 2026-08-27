# Task 3.2 - Remove The Instruction-Budget Owner

Date: 2026-08-26

## Candidate Scope

The replacement context-quality owner was already green before deletion. This task removed only the maintained numeric enforcement path and retained separate inventory measurements, deterministic duplicate ownership, reviewed canonicalization, and strict read-only quality checks.

Deleted owners:

- `config/instruction-budget.json`
- `tools/instruction-budget.ts`
- `tools/proofs/instruction-inventory-budget.ts`
- package scripts `instruction:budget` and `proof:instruction-budget`
- validator import, ownership predicate, and maximum-failure branch
- budget-specific test helpers and focused fixture blocks
- budget-specific maintained metric aggregate in `tools/instruction-artifacts-inventory.ts`
- proof-inventory row and maintained README/token-economy instructions

Historical audits, archived OpenSpec changes, and prior evidence remain unchanged. Current active-change wording is explicitly pending task 3.3.

## Contract Correction

The first current-candidate `npm.cmd run validate:strict` reached the new quality gate but exited non-zero (the tool result did not expose the exact process status). Its diagnostics showed that `tools/validators/devkit-contract.ts`, `tools/validators/workflow-contracts.ts`, and focused contract fixtures still required complete outcome/helper/sequencing policy to be copied into the now-thin `opsx-propose`, `opsx-apply`, and `opsx-archive` commands.

The smallest correction kept full policy in the canonical skills and changed validators/tests to require each command to name exactly its skill, delegate the complete workflow, pass `$ARGUMENTS`, and fail closed when the skill is unavailable. No command regained a duplicate workflow body.

## Runtime Proof

`npm.cmd run test:focused:instruction-context` exited `0` with `OK: instruction context quality tests=15`. Its actual strict-validator fixture appends a unique instruction, invokes `node tools/validate-library.ts --root <fixture> --fail-on-warnings`, observes success, and verifies byte-identical source. The same fixture still proves exact duplicates and malformed context-quality seeds fail without source mutation.

Actual package-entry diagnostics remained available:

- `npm.cmd run instruction:inventory -- --format markdown`: exit `0`; 71 artifacts; 4,892 lines; 372,655 characters; token proxy 93,186; context quality `passed`; deterministic errors `0`; safe fixes `0`; 26/26 duplicate exceptions active.
- `npm.cmd run instruction:canonicalize -- --check .`: exit `0`; 71 files; `372655 -> 372655`; changed files `0`; context quality `passed`; 26/26 duplicate exceptions active.

## Validation

- `npm.cmd run test:focused:validation`: exit `0`; 3 tests.
- `npm.cmd run test:focused:contracts`: exit `0`; 71 tests after the canonical-skill contract correction.
- `npm.cmd run test:focused:library`: exit `0`; 175 tests on the corrected candidate.
- `npm.cmd run validate:strict`: exit `0`; skills `31`; agents `20`; Markdown files `774`; warnings `0`; informational diagnostics `2`.
- `git diff --check`: exit `0`; only existing LF-to-CRLF worktree warnings.

Package and proof-inventory readback contain `instruction:inventory` and `instruction:canonicalize` but no `instruction:budget`, `proof:instruction-budget`, budget seed, materializer, or compatibility alias. A bounded maintained-TypeScript owner search returned no budget owner references, and exact-path readback confirmed all three deleted files are absent.

## Limits And Effects

This evidence does not claim that active OpenSpec plans or canonical base specs are reconciled; task 3.3 owns that closure. It does not claim semantic-equivalence detection or a provider context guarantee. No provider call, install, activation, consumer mutation, credential use, archive rewrite, commit, push, release, deployment, or remote operation occurred.
