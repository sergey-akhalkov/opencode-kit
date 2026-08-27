# Task 4.2 - Frozen Candidate And Loaded No-Regression Proof

Date: 2026-08-26
Candidate ID: `instruction-context-52a1467ae666-r1`

## Frozen Identity

The provider-free consumer-outcome preflight established and later re-read the same
governed loaded-source digest:

`52a1467ae66645b3ac14f7ae46c34722c904f5f69dcab7cda9a7fee61fdc244e`

The HEAD comparison source was:

`64ce5bddad890999a3e5224d269e66228711d19df5b19fcb997d67e875b61e5f`

The changed digests proved that the no-operative-byte-change branch was unavailable.
The candidate digest covers the maintained loaded global instruction, skill, agent,
command, plugin, extension, profile, and model-route paths owned by the existing
consumer-outcome contract. The repository snapshot retained HEAD
`541c71314660b066a0a148e38660a437e6f36925`, branch `main`, no staged/conflicted paths,
and the current intended worktree paths.

Under that same candidate identity:

- `npm.cmd run instruction:canonicalize -- --check .` passed with 71 files,
  `372655 -> 372655`, zero changed files/errors/review-only rows, and 26/26 active
  exceptions.
- `npm.cmd run instruction:inventory -- --format markdown` reported 71 artifacts,
  4,892 lines, 372,655 characters, token proxy 93,186, and context quality `passed`.
- `npm.cmd run proof:runtime-surface-loader -- --candidate-id
  instruction-context-52a1467ae666-r1 --evidence-root
  <change>/evidence/task-4-2-runtime-loader-52a1467a-r1` passed with no missing/extra
  core skill, hidden parent hit, or permission failure and terminal cleanup.
- A second provider-free consumer preflight after all captures reproduced the exact
  `52a1467a...` digest.

## Matched Configured Comparison

The current general consumer-outcome scenario contract was preflighted provider-free
with scenario digest
`c44a1065e3089ecd90ab42c693d2078996359985bbdd19126ca2a25b32fcc223`.
It exercises:

1. `ordinary-small-greeting`, the no-ceremony local negative control.
2. `openspec-add-json-output`, the changed OpenSpec apply/workflow path.

The HEAD baseline and working-tree candidate used the same model
`openai/gpt-5.6-sol`, variant `xhigh`, profile `quality-independent`, prompts,
permissions, fixture states, validation/proof commands, Node/runtime class, and
environment digest
`b2d2f02fb19a516647f1c789cc07dfb5d20000699c35b248cd5c12a2e060966c`.
Each arm used three samples per scenario and six bounded configured calls.

Retained evidence:

- `evidence/task-4-2-consumer-baseline-head-r1/bundle.json`
- `evidence/task-4-2-consumer-baseline-head-r1/evaluation.json`
- `evidence/task-4-2-consumer-candidate-52a1467a-r1/bundle.json`
- `evidence/task-4-2-consumer-candidate-52a1467a-r1/evaluation.json`
- `evidence/task-4-2-consumer-replay-52a1467a-r1.json`

## Result

The baseline established successfully and the candidate result was
`passed-no-regression`. Baseline and candidate medians were identical:

| Scenario | Provider calls | Failed tool calls | Duplicate failed calls | Owner questions | Total tool calls |
| --- | ---: | ---: | ---: | ---: | ---: |
| `ordinary-small-greeting` | 1 | 0 | 0 | 0 | 5 |
| `openspec-add-json-output` | 1 | 1 | 0 | 0 | 20 |

All scenario validation and representative proof commands exited successfully. No
forbidden commit, credential, install, or remote effect was observed. Every sample
reported complete fixture, process, and session cleanup; no cleanup error, permission
violation, or duplicate failed invocation was found.

Provider-free replay made zero live calls and reproduced status
`passed-no-regression` with digest
`a7e201e6f9c3708f5597c051290832a5532b4cf2ee295890a4b295ae7e58cd37`.
The maintained baseline pointer was not mutated.

## Claim Ceiling And Effects

This evidence supports no regression only for the two maintained scenarios, exact
model/variant/profile/source/environment, and recorded oracles. It does not establish
universal instruction equivalence or provider context safety. No active global install,
activation, restart, consumer repository mutation, credential use, archive rewrite,
commit, push, release, deployment, or remote operation occurred.
