# Wave 1 Prompt-Path Runtime Proof

Date: 2026-08-08

## Environment

- Repository: `D:\sa-gh\opencode-kit`
- OpenCode: `1.18.15`
- OpenSpec: `1.6.0`
- Candidate instructions: current working-tree mirrors under `.opencode/commands/` and `.opencode/skills/`

## Propose

Corrected candidate session `ses_01ebea95fffec5ghNHyR7330d6` (`pty_01daeb86`) created a disposable change, ran the `propose` operation gate and `openspec validate <change> --strict`, and exited zero. Its final status remained `Development-Stage: development`; it did not claim an RC or stable lifecycle stage.

## Apply

- Failure session `ses_01eb09c85ffe8xrOCiEZOZ1Yfg` (`pty_0b5f81f0`) observed a generic non-zero proof result, kept the task unchecked, and reported the precise process exit as `unknown` rather than substituting the expected fixture exit.
- Success session `ses_01eabd120ffewbz9cfsbidwVCr` (`pty_61395345`) observed `proof-ok` and strict validation before checking the task. Its final lifecycle claim was capped at `Development-Stage: MVP`.

## Complete Archive And Abandon

- Baseline archive session `ses_01edb1202ffee2KzxOxqIdsy1Z` (`pty_069cc9eb`) showed that the previous prompt could archive an incomplete disposable change after confirmation.
- Candidate archive session `ses_01ed7e4edffeFDIYKgTioXfpUq` (`pty_cdd3beea`) stopped at `archive:tasks-incomplete`, exited non-zero, and did not synchronize specs, validate the archive, or move the change.
- Abandon session `ses_01ea8adfdffe0rOJQ4FDEl6K0X` (`pty_be80189f`) preserved an incomplete disposable change under `2026-08-08-abandoned-eval-abandon-proof`, retained its unchecked task and delta spec, wrote `Status: abandoned-incomplete`, and reported `Main specs synchronized: no`. The disposable archive was deleted after evidence capture.

## Result

The evaluated propose, apply, complete-archive, and abandon paths obey the intended evidence and lifecycle boundaries. These observations are model- and environment-specific and do not replace repository validation.

The complete-archive mirrors require delta assessment and verified synchronization before archive when changes are needed, then strict change validation and the trusted full repository validation adapter. The observed incomplete archive stopped before those steps and confirmation could not bypass it; the distinct abandon path retained unsynchronized state without a completion claim.
