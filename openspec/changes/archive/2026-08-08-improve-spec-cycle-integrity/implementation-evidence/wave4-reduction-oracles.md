# Always-Loaded Reduction Oracles

Date: 2026-08-08

## Comparison Contract

- Same prompt, model (`openai/gpt-5.5`), OpenCode (`1.18.15`), agent, and machine.
- Baseline instructions: worktree `C:\Users\Sergey\AppData\Local\Temp\opencode\spec-cycle-baseline` at `3402779` with its baseline global config directory.
- Candidate instructions: current `improve-spec-cycle-integrity` working tree with `D:\sa-gh\opencode-kit\global` as the global config directory.
- Both runs were tool-free and produced no file changes.
- Oracles: complete cold-context SDET brief, self-contained protected-boundary owner handoff, and fail-closed hardware substitution/equivalence status.

## Raw Identities

```text
Baseline  session ses_01e8aed2fffeRaI0nrg3I8H8s3, output 1092 tokens, created 1786193973969, updated 1786194010977
Candidate session ses_01e8a0bd0ffeTEK3F9JNBDn0wE, output  889 tokens, created 1786194031663, updated 1786194065140
```

The candidate output was 203 tokens (18.6%) smaller. The single-run elapsed difference is not retained as a performance claim.

## Oracle Results

- Delegation: both outputs specified a fresh test-only SDET, frozen production, exact single-file write scope, exact commands, no credentials/network/remote/user questions, independently checkable acceptance, and evidence/blocker return. The candidate used grouped scope rather than the baseline's long fixed field inventory.
- Owner handoff: both outputs separated known local proof from unknown production effects, identified credentials/destruction/remote state/cost as owner-controlled, recommended the safe preparation path first, gave real alternatives with consequences, and requested explicit approval details before execution.
- Substitution: both outputs treated helper tests as component-only evidence and kept `Development-Stage: development`. The candidate additionally required identical actor path/workload/environment/initial state, exact substitution boundary, downstream observations, side effects/order/failure/cleanup equivalence, and end-to-end operator-visible measurement before owner-authorized hardware execution.

## Retention Decision

Retain the selective reductions. `global/AGENTS.md` is 65 net lines smaller and `global/skills/next-step/SKILL.md` is 34 net lines smaller relative to the baseline. The tested material-safety, delegation, handoff, next-step, compaction, propose, apply, and archive oracles did not regress. No broader untested lifecycle deletion is admitted by this evidence.
