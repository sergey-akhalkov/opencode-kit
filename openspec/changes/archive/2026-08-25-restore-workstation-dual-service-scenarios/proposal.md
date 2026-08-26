## Why

Archiving `fix-workstation-restart-reliability` preserved the dual-service parent requirements but replaced several scenarios with older single-server wording. The specification now contradicts itself for Graphify readiness, degraded Restart, listener absence, and credential non-disclosure even though production behavior and accepted evidence remain dual-service.

## Outcome Capsule

- **Outcome**: The archived `local-opencode-workstation` contract consistently requires OpenCode and Graphify health, identity, listener, and credential safety in every affected Restart and tray scenario.
- **Operating Envelope**: Specification-only correction of the affected scenarios in `openspec/specs/local-opencode-workstation/spec.md`; no production, installed-runtime, task, process, port, credential, or external effect.
- **Non-Goals**: Changing workstation behavior; adding scenarios beyond the existing parent requirements; rerunning lifecycle proof or SDET; changing another capability; committing, pushing, deploying, or publishing.
- **Non-Deferrable Invariants**: Preserve the already-accepted dual-service SHALL clauses; never weaken unmatched-owner refusal or credential non-disclosure; use the official OpenSpec merge path rather than editing the base spec manually.
- **Observable Proof**: The delta restates each affected complete requirement, every corrected scenario names the same dual-service boundary as its parent, strict OpenSpec validation passes, and the deterministic archive helper updates the base spec with green project validation.
- **Material Residual Risks**: None beyond wording drift; production and installed candidate remain unchanged. A partial MODIFIED delta could repeat the regression, so each modified requirement is complete.
- **Stop Line**: Finish after the exact scenario wording is merged through the canonical archive helper and post-archive strict validation is green. Do not touch workstation code or runtime evidence.
- **Automation Dividend**: exempt - this is a one-off correction to already-proven requirement wording with no new repeatable execution path.
- **Claim And Evidence Scope**: Exact-case only for the affected `local-opencode-workstation` requirement text after official merge; no runtime, compatibility, population, or other-workstation claim.

## What Changes

- Restore dual-service OpenCode and Graphify wording in Restart completion, starting-state, tray-health, failure, and credential scenarios.
- Make the degraded-runtime tray Restart scenario leave its current steady state, not an impossible steady-green precondition.
- Preserve the full current requirement text so official `MODIFIED` merge cannot discard accepted semantics.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `local-opencode-workstation`: synchronize affected Restart and tray scenarios with the already-accepted dual-service parent requirements.

## Impact

- `openspec/specs/local-opencode-workstation/spec.md` through one official delta merge.
- No source, test, package, installed workstation, credential, process, or remote-system impact.
