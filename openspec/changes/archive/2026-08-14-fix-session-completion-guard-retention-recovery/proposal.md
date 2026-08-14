## Why

An interrupted completion audit can leave a guard-owned child permanently marked `auditing`. After the finite retention limit is filled, every later OpenCode startup re-audits the persisted grind-enabled root, fails before creating an arbiter child, and shows the same terminal `input-state` toast.

This bounded change restores unattended recovery without weakening fail-closed ownership or deleting an audit that may still be active.

## Outcome Capsule

- **Outcome:** Interrupted completion-audit children no longer permanently block later audits or repeat the retention-limit toast on every project startup.
- **Operating Envelope:** Guard-owned children for one persisted root in the configured local project directory; recovery may quarantine only a successfully re-fetched non-current child whose runtime is canonically idle (explicit `idle` or absent from OpenCode's active-status map), whose metadata still says `auditing`, and whose age exceeds prompt timeout plus settle grace.
- **Non-Goals:** Inferring an audit verdict, deleting unrelated children, relaxing retention, recovering unknown/busy child ownership, changing model routing, or changing grind enablement semantics.
- **Non-Deferrable Invariants:** Never mutate or delete an explicitly busy/retrying, status-unreadable, current, recent, or ownership-invalid audit child; preserve exact root ownership and correlation; retain fail-closed behavior when liveness cannot be proven; preserve original failure diagnostics.
- **Observable Proof:** A real loaded guard starts against a disposable persisted root containing two idle interrupted audit children at retention limit two, quarantines only eligible stale children, creates and completes the next audit, and does not emit the retention-limit `input-state` failure after restart.
- **Material Residual Risks:** OpenCode runtime status may omit a child, leaving it intentionally blocked as unknown; process termination between quarantine and rotation may require another startup pass.
- **Stop Line:** Stop when the installed/loaded plugin recovers the reproduced local scenario, focused and complete validation are green, fresh critical SDET is terminal, and the existing affected local root no longer repeats the banner. Do not broaden recovery to busy, unknown, unrelated, or ownership-invalid children.

## What Changes

- Reconcile idle interrupted guard-owned audit children into an explicit terminal `stale` state before finite retention is enforced.
- Preserve busy, unknown, current-epoch, retrying, and ownership-invalid children without mutation or deletion.
- Add focused regression coverage for safe quarantine and fail-closed liveness boundaries.
- Extend the existing restart/long-run proof boundary to exercise the loaded-plugin recovery path and retained-child rotation.
- Repair the already persisted affected local session only through the corrected guard path or an equivalent ownership-checked local operation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `session-completion-guard`: Startup recovery and retained-audit policy explicitly quarantine provably idle interrupted audit children while preserving unknown or active ownership fail-closed.

## Impact

- Production: `global/extensions/session-completion-guard/arbiter-child.ts` and startup reconciliation in `controller.ts` if required by the smallest design.
- Validation: existing guard test and proof runners under `tools/` and `tools/proofs/`.
- Runtime state: guard-owned child metadata for eligible local interrupted audits; no public API, dependency, model route, or unrelated session changes.
