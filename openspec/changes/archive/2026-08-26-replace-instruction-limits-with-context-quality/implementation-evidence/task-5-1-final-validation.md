# Task 5.1 - Final Candidate Validation

Date: 2026-08-26
Candidate ID: `instruction-context-52a1467ae666-r1`
Loaded-source digest: `52a1467ae66645b3ac14f7ae46c34722c904f5f69dcab7cda9a7fee61fdc244e`
Repository HEAD: `541c71314660b066a0a148e38660a437e6f36925`

## Runtime Boundary

The final validation retained the task 4.2 candidate and its actual-entrypoint proof:

- `npm run proof:runtime-surface-loader` loaded the disposable generated `core`
  surface with no missing or extra owner, collision, permission failure, provider call,
  active install, or cleanup failure.
- The matched configured consumer comparison covered `ordinary-small-greeting` and
  `openspec-add-json-output` with identical model, variant, profile, prompt,
  permissions, environment, and three samples per arm. The candidate result remained
  `passed-no-regression`; provider-free replay reproduced the terminal result.
- `npm run instruction:inventory -- --format json` exercised the current repository
  entry point and reported context quality `passed`, 71 model-facing artifacts, 26/26
  active duplicate exceptions, no deterministic error, and no private source body.
- Two immediate `npm run instruction:canonicalize -- --check` executions each reported
  `372655 -> 372655`, zero changed files, no safe fix, no deterministic error, and no
  review-only finding.

Retained runtime evidence is indexed by:

- `implementation-evidence/task-4-1-disposable-core-loader.md`
- `implementation-evidence/task-4-2-loaded-no-regression.md`
- `evidence/task-4-2-runtime-loader-52a1467a-r1/`
- `evidence/task-4-2-consumer-baseline-head-r1/`
- `evidence/task-4-2-consumer-candidate-52a1467a-r1/`
- `evidence/task-4-2-consumer-replay-52a1467a-r1.json`

## Validation Matrix

Every listed command exited `0` on the retained candidate:

| Boundary | Result |
| --- | --- |
| portable apply operation gate | `passed` |
| `npm run test:focused:instruction-context` | 15 tests passed |
| `npm run test:focused:library` | 175 tests passed |
| `npm run test:focused:validation` | 3 tests passed |
| `npm run test:focused:model-routing` | 16 tests passed |
| `npm run test:focused:consumer-outcome` | 24 tests passed |
| `openspec validate replace-instruction-limits-with-context-quality --strict` | selected change valid |
| `openspec validate --all --strict` | 26 items passed, 0 failed |
| `npm run validate:strict` | 31 skills, 20 agents, 778 Markdown files, 0 warnings |
| `npm test` | full serial project suite passed |
| `npm run instruction:inventory -- --format json` | context quality passed |
| `npm run instruction:canonicalize -- --check` twice | fixed point, zero changes |
| proof inventory readback | replacement runners retained; removed budget runner absent |
| `git diff --check` | exit 0; informational LF-to-CRLF worktree warnings only |

The first focused-library replay was interrupted by the user control message. The next
run reached the host's 120-second observation timeout. Process readback found no live
matching Node or npm process after either interruption, and a serialized replay with a
sufficient observation window passed all 175 tests. No source, fixture, or writer was
left live.

Bounded active-change search found no executable numeric instruction ceiling or removed
`instruction:budget` / `proof:instruction-budget` command. Remaining matches are
accurate supersession history and explicitly prohibit restoring the removed owner.

## Claim Ceiling And Effects

Validation supports the exact maintained category set and the two captured consumer
scenarios only. It does not prove semantic uniqueness for differently worded prose,
universal model equivalence, or provider context safety. No active global installation,
activation, restart, consumer mutation, credential use, commit, push, release,
deployment, or remote operation occurred. All proof-owned disposable roots and
processes reported terminal cleanup.
