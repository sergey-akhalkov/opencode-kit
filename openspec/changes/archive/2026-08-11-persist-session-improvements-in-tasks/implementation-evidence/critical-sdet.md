# Critical SDET Evidence

## Attempt 1

- Fresh role: `sdet-quality-engineer`
- Effective Model: `xai/grok-4.5`
- Terminal action: `critical-risks-reported`
- Test-only change: additive oracle in `tools/test-contracts-change-ready-delivery.ts`; pre-existing owner-only pause tests preserved

### CR-PSI-01

The dedicated hidden-compaction prompt is a real entry point that does not inherit the changed `global/AGENTS.md` behavior in isolated compaction. Both `global/opencode.json.template` and active `global/opencode.json` retained the old single-selection rule and lacked the `Pending Improvement Tasks` fallback. This can drop admitted non-selected candidates at the exact write-unavailable boundary.

### Main Reproduction

- Source inspection confirmed `exactly one Working Repository improvement`, `select only one highest-ROI`, and no `Pending Improvement Tasks` in both compaction prompts.
- `docs/workflows/session-reflection.md` records that the candidate `global/AGENTS.md` must be isolated to obtain a valid compaction baseline, confirming prompt ownership.
- `npm run test:focused:contracts`: exit non-zero; all other contract tests passed, and `contracts: admitted session improvements stay durable across apply/archive and compaction entry point` failed on missing `Pending Improvement Tasks` in `global/opencode.json.template`.
- Main classification: confirmed reachable accepted-outcome/non-deferrable lifecycle defect. Correction authorized as the smallest Product Candidate dependency closure.

Attempt 2 is permitted only after the compaction prompts are corrected, focused validation passes, and fresh compaction runtime proof restores current `MVP`.

## Correction and Re-Proof

- Corrected template and active compaction prompt tails without changing model/variant or unrelated config.
- SDET oracle now passes in `OK: contracts tests=65`.
- Strict library and active-change validation pass.
- Fresh installed `--agent compaction` proof exited `0`, emitted complete pending records for both admitted candidates, prohibited summary-only loss, preserved one safety-ordering action, and performed no mutation.

The corrected candidate is eligible for a second fresh critical-only SDET attempt.

## Attempt 2

- Fresh role: `sdet-quality-engineer`
- Effective Model: `xai/grok-4.5`
- Terminal action: `critical-risks-reported`
- Test-only change: extended the existing persistence oracle to the real `.opencode/commands/opsx-archive.md` entry point

### CR-PSI-02

The `/opsx-archive` command invoked the deterministic helper without the session-derived improvement reconciliation added to the archive skill. Because apply directs operators to this command and the helper cannot observe chat-only pending candidates, this command-only path could archive all-checked on-disk tasks while admitted work remained only in continuation evidence.

### Main Reproduction

- Source comparison confirmed archive skill/command asymmetry and direct helper invocation in the command.
- `npm run test:focused:contracts`: exit non-zero; the persistence oracle alone failed on missing `Pending Improvement Tasks` in `.opencode/commands/opsx-archive.md`.
- Main classification: confirmed reachable accepted-outcome/non-deferrable lifecycle defect. A narrow command-mirror correction is authorized.

## Attempt 2 Correction and Re-Proof

- Mirrored the archive-skill reconciliation block into `.opencode/commands/opsx-archive.md` before helper execution.
- Extended SDET oracle now passes in `OK: contracts tests=65`; strict library and active-change validation pass.
- Fresh installed `opencode run --command opsx-archive` proof exited `0`, forbade helper invocation, required both synthetic pending candidates to become unchecked structured tasks, returned to apply, and performed no mutation.

The corrected candidate is eligible for a third fresh critical-only SDET attempt. The first precondition-valid attempt without a new main-confirmed critical defect will terminate SDET for this root.

## Attempt 3 Terminal Result

- Fresh role: `sdet-quality-engineer`; not a resume and not an author of production/proof.
- Effective Model: `xai/grok-4.5`.
- Terminal action: `no-critical-risk`.
- Critical risk matrix: none.
- Test changes: none.
- Independent focused oracle: exit `0`, `OK: contracts tests=65`.
- Independent source check found required all-candidate, owner-blocker, gate-ordering, apply/archive, and template/active-compaction markers present with no single-select or summary-only authorization on current runtime entry points.

Under the root stop rule, this first precondition-valid attempt without a new main-confirmed critical defect permanently terminates SDET for this change. Residual instruction-adherence uncertainty and pre-archive main-spec lag are non-critical and do not authorize another SDET attempt.
