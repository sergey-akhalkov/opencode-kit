# Critical SDET Evidence

Date: 2026-08-08

## Initial Attempt

- SDET child: `ses_01dc9d5d0ffeRxtle9G64oQlSw`
- Effective model: `xai/grok-4.5`
- Result: `critical-risks-reported`
- Confirmed risk: `PWT-WIN-ARGV-SPACES-001`
- Main reproduction: absolute `C:\Program Files\nodejs\node.exe` validation argv was cmd-joined and failed as an unrecognized command while bare `node` remained green.

Main corrected the owning boundary in `global/bin/portable-process.ts`. Windows `.exe/.com` executable argv now uses direct `spawnSync` with `shell:false`; bare/cmd/bat wrappers retain the cmd path, and whole-command wrapping applies only when the wrapper executable path contains whitespace. An overbroad first correction broke bare `git` and was narrowed before candidate reproof.

Current real-boundary reproof used the absolute spaced Node executable for both staged validation and archive project validation. Both paths exited zero; archive completed through official OpenSpec and staged validation preserved index isolation and cleanup.

## Corrected-Candidate Attempt

- SDET child: `ses_01db4db2cffevyD3jAKSnptBiE`
- Effective model: `xai/grok-4.5`
- Terminal result: `no-critical-risk`
- Critical risk matrix: none
- Prior confirmed risk: closed

The corrected SDET context initially returned progress-only messages while its validation subprocesses remained alive. Main followed writer-attempt closure: recorded the stalled wait strategy in `history.md`, inspected OS process liveness, waited for the exact process tree to terminate, read the preserved raw outputs, and resumed the same SDET context only after its evidence-based retry condition was satisfied.

Raw terminal outputs:

```text
npm run test:focused:library       -> exit 0, OK: library tests=147
npm run test:focused:contracts     -> exit 0, OK: contracts tests=55
npm run test:focused:openspec-gate -> exit 0, OK: OpenSpec operation gate tests=11
npm run test:focused:install       -> exit 0, OK: install opencode global tests=25
npm test                            -> exit 0, ten serial test files
```

Test-only evidence covers spaced native executable direct spawn, bare command and fake `.cmd` behavior, metacharacter rejection before execution, archive completion/history gates, staged pass/fail cleanup, loader-safe imports, installer/doctor distribution, and portability/stagnation marker failures.

## Main Disposition

No current reachable critical or non-deferrable defect is known. Fixture-based fake `.cmd` OpenSpec coverage remains a non-critical confidence gap supplemented by real OpenSpec 1.6.0 archive runtime proof.
