# Tasks 2.1 Through 3.1 Context-Quality Evidence

Date: 2026-08-26

## Candidate And Boundary

- Repository: `D:/home/sergey-akhalkov/opencode-kit`
- Branch: `main`
- HEAD: `541c71314660b066a0a148e38660a437e6f36925`
- Source scope: maintained catalog model-facing Markdown only
- Context-quality owner: `tools/instruction-context-quality.ts`
- Inventory owner: `tools/instruction-artifacts-inventory.ts`, catalog schema version 3
- Seed: `config/instruction-context-quality.json`, schema version 1
- Architecture decision: extend the cohesive context-quality parser/evaluator; do not add a second scanner. Structural eligibility, exception resolution, and fixed-point writes remain in the same owner. The inventory remains measurement, classification, redaction, and reporting only.

## Parser And Exception Corrections

- Protected-only inline code and link paragraphs are outside operative duplicate comparison.
- Plain one-token labels ending in `:` and concise bold labels are outside operative duplicate comparison; a bold normative sentence remains enforced by a negative fixture.
- An exception resolves the one shared block whose complete repository occurrence set exactly equals its owner/consumer locator set. Stale, broad, orphaned, duplicate-heading, and genuinely ambiguous exceptions still fail closed.
- Sparse fixtures use the maintained canonicalization rules without importing repository-specific duplicate exceptions.
- The two audit scope fragments were combined into one operative goal sentence. Project process-control duplicates retained exact wording and received narrow subheadings so exception heading paths are semantically unique.

## Initial Finding Dispositions

| Initial digest | Disposition |
| --- | --- |
| `a6a35997b6c39e6e8c9198195c5e35bf35eb50d0effce8a09d0c49b56834cd21` | Retained under `openspec-store-selection`; lifecycle skills load independently. |
| `1398d7a3350403522c960d8bc266fa763d42167102ec117d04e3e50fd05de302` | Removed from the operative population; the paragraph consists only of protected inline code. |
| `790eea8455eaf0f5207eaf653ff4477b6e1de2ee64fd3287deee6f3758f30151` | Retained under `reviewer-no-product-decision`; reviewer agents load independently. |
| `22b491c40722a115586109d51d08b0f6be289230b2e979db9cd792216a501605` | Retained under `reviewer-candidate-reference`; leaf reviewers require local candidate identity. |
| `eaf57d382229f89ba30e799520ae0571fb786d590450831aca2aaa0576552544` | Retained under `reviewer-effective-model`. |
| `97ddc2744447b7bfc87da9a19ec0f426cc65a4d49f81a10255f0df072fda21ed` | Removed from the operative population; `Return:` is structural output scaffolding. |
| `125e747384ecbc6fafc515f1be7d2e780b949ec2829b2acd4544bfe96da11262` | Retained under `reviewer-risk-matrix`. |
| `0fac4faa2dfd6ccf89d52c30a6b9127886f334ddf3641ed36ede167027bb7782` | Retained under `reviewer-evidence-gaps`. |
| `8882de86e6ca05c0d1c35b076783ae09f91ee6da516455430a5cdd908ec78be3` | Retained under `reviewer-terminal-non-authority`. |
| `1f3750f9c564ea327a95898b4b0aef8fcdad89ae73b52564b83f42defe8b459b` | Retained under `reviewer-practice-contract`. |
| `ff8b478dcc284dd5dfe0171458ca17166551454dde061d65471d23bc1bcada0e` | Retained under `reviewer-preproof-candidate`. |
| `dac654fca8c5a7b9bd4d85dbefaeb88cfaaba8c294808822d3fdeecc9bb8d386` | Retained under `instruction-artifact-authority-check`. |
| `dac2cfda0dffe5d5bff2590b96022587919715de7d087ea67a80f5f8bda97af7` | Retained under `worker-confidence-field`. |
| `d1e7bb7d4450059d26f283ff9f47d2aca28acfa4d2524fbab84cab4d866292f7` | Retained under `helper-ledger-determinism`. |
| `2138e2efd607f2544cb239e52f1acd51ed527a42ca2f5f08d644d44bc4ab5a5c` | Consolidated with the adjacent goal field and retained under `audit-scope-goal`. |
| `60f48aa92b5dfd500a94edc4d99efdc2aa34db57010430da0edc267cae11086e` | Consolidated with the adjacent introduction and retained under `audit-scope-goal`. |
| `953624c3fdc63652410fd4fd4cd3c18a72ae241fae1c586c3725d023ab0b3394` | Retained under `audit-output-findings`. |
| `77af6ba7caeee68da3564a3b7189ebd72d97eaf332582b221c6a89b98323281e` | Retained under `skill-no-remote-mutation`; specialist skills load independently. |
| `1aaf31eb7b79cfc72e75e894c00375caf594ba5e6ebbf071a76c6b9dffc71324` | Retained under `skill-output-findings`. |
| `35602611386c924f2dcf6f7a6f3b5983187635625588eb6a14fbef2a1993453d` | Removed from the operative population; `**Steps**` is structural scaffolding. |
| `2cec5efcb56e95d8da4dbea817d9929512ef63e2593c93ec8f86eec03a227902` | Removed from the operative population; `**Guardrails**` is structural scaffolding. |
| `40434ebf0fd644b0361da4835e307998795cff48cb27d8fca81ea0df03012d49` | Retained under `project-change-ready-routing`. |
| `0e6d08108d38dfb683ff53387c492d01089f81dea28cf643ac5b04a94e8027b0` | Retained under `project-worktree-preservation`. |
| `f3305af985ce2fa1aae36ccaaa24c782fdc7ac31468a6dc74a36823e15a161fb` | Retained under `project-autonomy-continuation`. |
| `3cfc562522ec4cdb99e97e09b43390513a619fddd429c5c78151d860d43e72a5` | Retained under `project-delegation-brief`. |
| `e575151d1b9b446205bf8e26f49900fc13f450f9543485e67f270bd6bbfd3eee` | Retained under `project-prompt-orchestration`. |
| `5a0d091339da379984751178701c8b73fbf65f45ba6fa3a06f5a1058350ac367` | Retained under `project-main-integration-ownership`. |
| `1c1395fb8f7f360e7757883572079e1fdb19034aae51d84c90848fbfd7cc3421` | Retained under `project-scope-and-evidence-authority`. |
| `8707dcba5a7e6adff920143903381e9086735b63c5044456678d3b966e00967b` | Retained under `project-optional-review-routing`. |
| `04ee8611b5c011f3f0ce58e3d0d2e72dc5b266d99c84192785c13c8131f75f5d` | Retained under `project-sdet-terminal-contract`. |
| `259e4582645416f4966d4f229a8d99fbfe963eab5ef80e48b253f7abbf027458` | Retained under `project-remote-state-guard`. |

## Runtime Proof And Validation

- `npm.cmd run test:focused:instruction-context`: exit 0, `OK: instruction context quality tests=15`.
- `npm.cmd run instruction:canonicalize -- --check . --format json`: exit 0, status `passed`, 71 files, 26/26 active exceptions, no errors, no fixes, no changed files.
- Immediate second package-entry check with Markdown output: exit 0, status `passed`, 372655 chars unchanged, 0 changed files.
- `npm.cmd run instruction:inventory -- --format json`: exit 0, context quality `passed`, 71 artifacts.
- Two direct inventory CLI runs were byte-identical: SHA-256 `266a216b1432824ad921fb73333e182b9bd6811f8824fea976b94bc759768a13`; 372655 chars and token proxy 93186 are diagnostics only.
- `npm.cmd run test:focused:validation`: exit 0, `OK: library validation script tests=3`.
- `npm.cmd run test:focused:library`: exit 0, `OK: library tests=177` after isolated replay of the corrected catalog compatibility fixture.
- `node global/bin/openspec-operation-gate.ts --root . --operation apply --change replace-instruction-limits-with-context-quality`: exit 0, status `passed`.
- `openspec.cmd validate replace-instruction-limits-with-context-quality --strict --no-interactive`: exit 0, valid.
- `git diff --check`: exit 0; line-ending warnings only.

The failed parallel focused replay was a proof-runner race: two test commands shared and cleaned `agents-and-skills-tests`. Both processes terminated, no workspace file was affected, and serialized replay passed. Mutable validations sharing that temp parent remain serialized.

## Claim Ceiling

This evidence proves deterministic exact-block ownership, protected structural exclusion, exception fail-closed behavior, read-only strict integration, and a current-repository zero-fix fixed point. It does not prove semantic uniqueness or contradiction absence for differently worded prose, and it does not replace the later loaded consumer no-regression gate.
