# Runtime Proof

## Evidence Topology

- **Product Candidate:** loaded instruction/normative diff identity `05ca9caef750a04478ef6be501bc2660fe62eef4` over the exact scoped `git diff` at proof time.
- **Proof Runner:** installed OpenCode `1.18.18` `opencode run --command opsx-propose|opsx-apply` plus the installed OpenSpec CLI and repository `tools/openspec-operation-gate.ts` through a disposable local adapter.
- **Evaluator:** explicit behavior oracles: one initially-last retrospective; canonical six-cell history input; all admitted tasks retained and immediately executed; honest `none`; no second analysis; complete propose readiness; no premature product implementation.
- **Environment Identity:** Windows local process, `openai/gpt-5.6-sol` variant `xhigh`, agent `build`, fresh command loading from current candidate `.opencode`, copied current `openspec/config.yaml`, installed OpenSpec CLI, disposable roots under the approved temp parent.
- **Raw Evidence:** exact command stdout/stderr/exit in current session tool records, source/artifact readbacks summarized below, and failed-environment strategy chain preserved in `history.md`.

## Baseline Comparison

Same model, variant, installed command loaders, and substantive read-only scenarios:

- Baseline propose exit `0`: explicitly said the final task was not required.
- Candidate propose exit `0`: required one unchecked initially-last task, complete `history.md`, the canonical matrix, admitted work or `none`, and no later creation/rerun.
- Baseline apply exit `0`: explicitly said complete-history six-cell analysis and one-time scheduling were not required.
- Candidate apply with two candidates exit `0`: emitted all six cells, admitted both candidates, required all standard fields, recorded both task IDs, and immediately routed through implementation/proof/validation without another analysis.
- Candidate apply with no evidence exit `0`: emitted six `none` cells, invented no task, completed the existing retrospective, and prohibited rerun.

All five read-only sessions denied `edit`, `bash`, `task`, `question`, and `external_directory`; no file or external effect occurred. The sessions were deleted after capture.

## Disposable Authoring Boundary

Final fresh root contained the current candidate `.opencode` loaders, current `openspec/config.yaml`, and a local package adapter invoking the trusted repository OpenSpec gate with `--root .`.

Invocation:

`opencode run --dir <disposable-root> --command opsx-propose --model openai/gpt-5.6-sol --variant xhigh <minimal synthetic change>`

Observed result:

- Exit `0`.
- Actual OpenSpec change `history-retro-proof` created through `openspec new change` and artifact instructions.
- `proposal.md` includes all seven required Outcome Capsule fields.
- `tasks.md` contains exactly two unchecked tasks: one ordinary `note.md` task, then one final history retrospective.
- The retrospective names all six cells, complete `history.md`, the existing admission/ownership/authority gate, all standard task fields, immediate apply continuation, `none`, and no rerun.
- `history.md` records no invented attempts.
- `note.md` is absent, proving propose did not implement product work.
- `npm run openspec:gate -- --operation propose --change history-retro-proof`: exit `0`, status `passed`.
- `openspec validate history-retro-proof --strict`: exit `0`, change valid.
- `openspec status --change history-retro-proof`: `4/4 artifacts complete`.
- No archive, commit, push, install, activation, remote state, credential, or protected effect occurred.
- The proof session was deleted and both attributable disposable roots were removed after evidence readback.

## Failed Environment Chain

The first disposable root copied only `.opencode`. It successfully created the correct `tasks.md`, but its readiness command first lacked `openspec:gate`; after a local adapter was added, the gate exposed missing project Outcome Capsule rules because `openspec/config.yaml` was absent. This was a proof-environment defect, not a Product Candidate defect. No product/working-repository mutation occurred. The complete environment changed the causal mechanism and reached terminal green in one run; details and do-not-repeat condition are in `history.md`.

## Verdict

The accepted happy path works at the actual fresh loaded OpenCode/OpenSpec authoring boundary. Candidate behavior fixes the reproduced baseline gap while preserving `none`, no recursion, and no premature implementation.

`Development-Stage: MVP`
