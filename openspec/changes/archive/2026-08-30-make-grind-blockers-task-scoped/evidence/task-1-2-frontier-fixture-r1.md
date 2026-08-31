# Task 1.2 Frontier Fixture And Replay

- Result: `complete`
- Candidate: `grind-task-scoped-frontier-fixture-r1`
- Environment: `windows-node-24.18.1-provider-free-frontier-r1`
- Recorded: `2026-08-29T20:50:35.3449450+03:00`
- Boundary: reviewed repository-local seed through the completion-guard frontier fixture materializer and offline replay evaluator
- Effects: create-new evidence only; no OpenCode, provider, network, source/config/project-runtime mutation, credential, installation, activation, restart, protected, remote, or target-project effect

## Reuse Disposition

- Trigger: one new proof CLI/materializer and reviewed seed family.
- Sources reached: current completion-guard proof CLIs, package proof scripts, focused completion-guard tests, and the project-memory reviewed-seed/materializer pattern.
- Selection: `extend` the existing completion-guard proof family with one concrete CLI and seed. No package dependency, shared proof framework, second general runner, or production abstraction was added.
- Contract/total-cost reason: the exact owner already provides proof CLI conventions and focused tests; a cross-family helper would add ownership and navigation cost before production frontier types exist.
- Cross-project discovery: `not-applicable`; a verified current-repository owner satisfied the complete task-1.2 contract.

## Reviewed Seed

- Seed: `tools/proofs/fixtures/session-completion-guard/grind-frontier-v1/grind-frontier-v1.seed.json`.
- Seed blob: `a213edc0e6720cb3fabe51c67d32fa0c1d2af02f`.
- Runtime fixture digest: `0d12c7b7933640835faaf0c170ca106a5860971c77ccee7590d6302ab10df713`.
- Canonical seed digest: `52469de52f0990476f50fe0dc19fc8d247ea5991d2569126c55a6cdae2d5aadc`.
- Reviewed limits: 32,768 frontier bytes; 16 items; 64 dependency edges; 16 gates; 8 parked decisions; 4 refs per field; 256 bytes per bounded text field.
- Product/dependency/gate semantics are explicit seed facts. Helper code validates exact fields, refs, limits, cycles, and readiness; it does not score prose or infer product ownership.

## Scenario Results

| Scenario | Result | Exact observation |
| --- | --- | --- |
| `all-product-blocked` | accepted | `product-decision`; no runnable item; product gate and parked decision retained |
| `bounded-field-bytes` | rejected | `limit-resumeCondition` |
| `bounded-reference-count` | rejected | `limit-requirementRefs` |
| `complete` | accepted | `complete`; no runnable item or open gate |
| `cyclic` | rejected | `dependency-cycle` |
| `malformed` | rejected | `invalid-item-status` |
| `migration` | reconcile | `missing-frontier`; `frontier-reconciling` |
| `non-product-waiting` | accepted | `waiting`; exact technical gate retained |
| `partial-product-block` | accepted | `runnable`; only `item_independent` is runnable while product work remains gated |
| `stale-generation` | rejected | `stale-generation` |

## Source Identity

| Path | Git blob |
| --- | --- |
| `tools/proofs/session-completion-guard-frontier.ts` | `ae2d8865bd1e173b05a0c4873715b8b414be0934` |
| `tools/proofs/fixtures/session-completion-guard/grind-frontier-v1/grind-frontier-v1.seed.json` | `a213edc0e6720cb3fabe51c67d32fa0c1d2af02f` |
| `tools/test-session-completion-guard.ts` | `0172ff41cfdc780f01e18f662341dbbf1842f010` |
| `package.json` | `c97f472b5a0959cbec5114f3f07accba3f6e182d` |
| `tools/proofs/README.md` | `89be66fcac4d9a8af8176f36b164bad02dbb1ef4` |

## Runtime Proof

- `npm run proof:guard-frontier -- --help`: exit `0`; documented materialize/replay inputs, effects, evidence, and no-write help behavior through the maintained package entrypoint.
- Materialize invocation: `node tools/proofs/session-completion-guard-frontier.ts --mode materialize --candidate-id grind-task-scoped-frontier-fixture-r1 --environment-id windows-node-24.18.1-provider-free-frontier-r1 --fixture tools/proofs/fixtures/session-completion-guard/grind-frontier-v1/grind-frontier-v1.seed.json --evidence-root <create-new-frontier-fixture-r1>`; exit `0`, status `passed`, ten ordered scenarios, expected results true, stable second pass true, provider-free true, source unchanged true, cleanup complete.
- Replay invocation: `node tools/proofs/session-completion-guard-frontier.ts --mode replay --candidate-id grind-task-scoped-frontier-fixture-r1 --environment-id windows-node-24.18.1-provider-free-frontier-r1 --input-root <frontier-fixture-r1> --evidence-root <create-new-frontier-fixture-replay-r1>`; exit `0`, status `passed`, input observations match true, expected results true, provider-free true, source unchanged true, cleanup complete.
- `npm run test:focused:session-completion-guard`: exit `0`, `OK: session completion guard tests=47`; focused test also proved help created no evidence, materialize/replay equality, zero provider/network calls, runner/seed byte identity, and temporary-root cleanup.
- `git diff --check` on task-1.2 files: exit `0`; line-ending warnings only.

## Failure And Correction

- First help/focused run failed before CLI execution because Node strip-only mode does not support a TypeScript parameter property in `FixtureError`.
- Correction: replace the parameter property with one explicit readonly field and assignment. The same help and focused boundaries then passed.
- This was a proof-runner compatibility defect, not a frontier scenario result. No failed evidence directory or partial source mutation was produced.

## Changed-Code Quality

- Deterministic inventory: new CLI is `attention` at 564 lines; the existing focused test owner remains `split-candidate` at 3,221 lines.
- Split-or-justify: keep the CLI cohesive for task 1.2 because argument parsing, explicit seed validation, graph checks, materialize/replay, and evidence output form one proof owner; splitting before production frontier types exist would add navigation-only files. The focused test change adds about 50 lines to the existing owner and retains unique help/no-effect/replay/cleanup oracles.
- Fresh reduction review: task `ses_fb1607e27ffeM3qBANwrX3X1Ub`, Effective Model `xai/grok-4.6`, reduction matrix `none`. Main disposition: no current-scope deletion, abstraction, or test removal preserves the complete contract at lower cost.

## Claim Ceiling

- `GRIND-TSB-001` remains `unknown`, supported members `0/20`, real oracle `unknown`, independent challenge `missing`.
- This evidence proves only reviewed seed identity, explicit-field fixture validation, deterministic provider-free materialization/replay, stable ordering, exact graph readiness, bounded cause codes, effect-free help, and cleanup.
- It does not prove the production frontier parser/tool/persistence, verdict schema version 2, question deferral, execution epochs, roadmap/campaign scheduling, loaded instructions, installed OpenCode behavior, authorization containment, any `GRIND-TSB-001` population member, SDET, independent claim challenge, archive, installation, activation, or restart.

## Next Boundary

- Task 2.1 may implement the production frontier types/parser/tool/persistence and run every reviewed seed through that production owner.
- The production parser must preserve the fixture's exact accepted/rejected/reconcile observations or narrow them with an explicit evidence-backed schema correction; helper code must not become the production parser.
