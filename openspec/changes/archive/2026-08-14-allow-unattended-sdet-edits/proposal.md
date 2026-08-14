## Why

The global OpenCode default allows tools, but `sdet-quality-engineer` overrides
that default with `edit: ask`. Every justified test edit therefore interrupts an
otherwise unattended qualification run with the approval dialog shown by the
operator.

## Outcome Capsule

- **Outcome:** SDET can create the smallest authorized test-only evidence without
  an interactive edit-permission prompt.
- **Operating Envelope:** Fresh `sdet-quality-engineer` children working only in
  the exact local test-artifact scope supplied by main after current Runtime Proof.
- **Non-Goals:** Enable shell, network, delegation, questions, production edits,
  credentials, external/shared environments, or external operations for SDET;
  change reviewer permissions; add a path-classification permission mechanism.
- **Non-Deferrable Invariants:** SDET remains test-only, never edits production,
  blocks when the exact write scope is absent, asks no user question, and cannot
  authorize lifecycle progression or another attempt.
- **Observable Proof:** A fresh installed OpenCode process resolves SDET edit
  permission to `allow`, then an actual SDET invocation writes only one supplied
  disposable test artifact without a permission reply or production mutation.
- **Material Residual Risks:** OpenCode edit permission is tool-wide rather than
  dynamically bound to the supplied path list; test-only containment therefore
  still depends on the role contract, main's attribution checks, and frozen-candidate
  validation.
- **Stop Line:** Stop after the SDET edit prompt is removed, exact test-only scope
  remains operative, resolved runtime permissions and one disposable invocation
  are green, and affected contracts and validation pass.

## What Changes

- Change the SDET `edit` permission override from `ask` to `allow`.
- Replace runtime-approval wording with explicit pre-authorized test-only edit
  wording while retaining the exact supplied scope and production prohibition.
- Synchronize the SDET validator, deterministic contract, normative requirement,
  and runtime permission proof.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `library-instruction-artifacts`: Permit unattended SDET test-only edits while
  preserving its role and authority boundaries.

## Impact

- Affected source: `global/agents/sdet-quality-engineer.md`, its contract and
  validator, focused tests, and the installed permission proof.
- Affected behavior: SDET no longer asks the operator to approve `edit`; all other
  explicit SDET permissions remain unchanged.
- Dependencies and systems: Existing OpenCode permission resolution only; no new
  package, installation, activation, credential, or remote operation.
