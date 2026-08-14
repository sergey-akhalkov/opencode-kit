# Runtime Proof

## Candidate

- Product Candidate: SDET `edit: allow`, pre-authorized exact test-only scope,
  synchronized contract/validator/spec, and explicit permission proof oracle.
- Proof Runner: `tools/proofs/opencode-permissions.ts` plus
  `tools/proofs/sdet-unattended-edit.ts`.
- Environment: installed OpenCode `1.18.18`, kit global source selected by
  `OPENCODE_CONFIG_DIR`, configured SDET model route, local disposable project.
- Development-Stage: `MVP` after routed SDET capture and terminal cleanup replay.

## Provider-Free Readback

- Baseline direct `opencode debug agent sdet-quality-engineer` resolved final
  `edit: ask` despite top-level allow.
- Candidate direct readback resolves `edit: allow`; `bash`, task, question, skill,
  webfetch, websearch, todowrite, external-directory, LSP, and doom-loop resolve
  `deny`.
- `npm run proof:permissions` exits `0` and reports
  `sdet.editPermission=allow` while retaining the specialist deny matrix.
- Exact SDET contract oracle, direct validator, selected strict OpenSpec validation,
  and `git diff --check` pass.
- Aggregate focused contracts pass the changed SDET row but currently retain one
  unrelated README doctor-copy failure from concurrent work.

## Rejected Direct CLI Attempt

- Invocation: direct `opencode run --agent sdet-quality-engineer --format json`
  against a disposable project, without `--auto`.
- Observed: OpenCode reported that the role is a subagent and fell back to the
  default primary agent. Root session `ses_fff64af4bffePI8GHuHHz7YeFg` created and
  read only the disposable test file before main interrupted the invalid route.
- Exit: Windows Ctrl-C `-1073741510`; 20 output lines; no permission event.
- Disposition: not Runtime Proof for SDET. Session and disposable project were
  deleted successfully. `history.md` records the do-not-repeat condition.

## Routed SDET Capture

- Preflight `preflight-r1` created a fresh installed OpenCode server and correlated
  root/child sessions. Child readback was exactly `sdet-quality-engineer` on
  `xai/grok-4.6/high`; parent correlation was exact; pending permissions were zero;
  sessions, server, and fixture cleaned.
- Live `capture-r1` used the same route with no `--auto`. The child completed the
  `edit` tool, created exactly `tests/permission-proof.txt` with 18 bytes and the
  expected SHA-256, and read it. The monitor completed 1,155 polls with zero
  pending permission requests before and after. No second project file existed.
- Child/root sessions were deleted and the OpenCode server stopped. Immediate
  fixture deletion returned Windows `EPERM`, so the immutable capture evaluation
  correctly remained `fail` and blocked another live call.
- After process handle release, main deleted the exact proof-owned fixture. The
  provider-free `replay-r1` evaluator verified the preserved input digest, all
  product facts, current Product Candidate hashes, approved temp containment,
  session/server cleanup, and fixture absence; status is `pass`.
- Runner-only cleanup was hardened with bounded `rmSync` retries. Current-runner
  `preflight-r2` passes and cleans all local state. No second provider call was
  made.

## Live-Attempt Gate

- State: `clear`.
- Failure Chain: invalid direct-CLI fallback, then successful routed SDET product
  interaction with cleanup-only Windows `EPERM`.
- Preserved Raw Bundles: `capture-r1/raw.json` and its immutable failed evaluation;
  `replay-r1` composes terminal cleanup; `preflight-r2` identifies the current
  runner.
- Offline Replay Coverage: candidate/source identity, child/parent route, exact file
  manifest, completed edit tool, 1,155 zero-request permission polls, session/server
  cleanup, approved fixture containment, and fixture absence.
- Terminal Replay Result: `replay-r1/evaluation.json` is `pass`.
- Unlock Condition: satisfied; no additional live capture is needed or authorized
  unless Product Candidate behavior changes.
