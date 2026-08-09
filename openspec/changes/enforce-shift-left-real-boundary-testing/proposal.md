## Why

The kit requires observable Runtime Proof and realistic boundaries, but it does not consistently require roadmaps and feature slices to obtain the first safe real-system signal as soon as that signal becomes reachable. A team can therefore satisfy the current wording with strong offline components, defer authorized real-dependency or hardware characterization until a late phase, and discover model, protocol, state, timing, recovery, or integration errors only after dependent layers have accumulated.

## What Changes

- Add one portable shift-left real-boundary contract: every behavior slice selects the earliest safely reachable rung from offline/replay through local integration, shadow/read-only real use, bounded live effects, and end-to-end operation.
- Make roadmaps optimize time-to-first-real-signal and place the smallest harness, safety, restoration, authorization, and evidence prerequisites before dependent implementation.
- Require baseline characterization against the real source of truth before emulator, replacement, cache, replay, or simulator behavior depends on an unverified model.
- Stop only the affected dependency chain when unknown real behavior can invalidate downstream work; continue independent local work and request owner authorization at the first exact external gate.
- Preserve protected-boundary authority, physical-effect suppression, cleanup/restoration, immutable evidence, equivalence, and the existing blocked-live-attempt replay rules. Shift-left never grants external-operation authority.
- Add deterministic drift markers for the canonical runtime authority and maintained project-facing mirrors, plus a same-model baseline/candidate workflow for semantic behavior.

### Outcome Capsule

- **Outcome**: OpenCode plans and executes each behavior increment around the earliest safely reachable real boundary, so real-system feedback invalidates wrong assumptions before more dependent product behavior is built.
- **Operating Envelope**: reusable OpenCode instructions, OpenSpec planning/apply guidance, local deterministic validation, and bounded synthetic same-model instruction evaluation; no real controller, shared environment, credential, deployment, installation, or remote mutation is performed.
- **Non-Goals**: forcing live access when unavailable or unauthorized; replacing fast offline/unit/replay checks; starting systematic SDET before current MVP proof and accepted-scope completion; encoding product-specific controller or HMI policy in reusable artifacts; making every feature Material.
- **Non-Deferrable Invariants**: external and physical operations remain separately owner-authorized; live attempts remain fail-closed on safety, identity, restoration, cleanup, and blocked-gate state; mock/simulator evidence is never presented as real-boundary equivalence; unrelated worktree changes remain untouched.
- **Observable Proof**: maintained instruction surfaces expose the shift-left markers; generated OpenSpec context orders a real-signal-unlocking task before dependent behavior; strict repository/OpenSpec validation passes; the same model and prompt under a fresh candidate session preserve every baseline safety oracle and make the fidelity ladder, earliest real boundary, and deferred-boundary unblocker explicit.
- **Material Residual Risks**: prose and exact-marker validation cannot guarantee model adherence; early real access can increase interruption or operational risk if authorization and containment are underspecified; over-broad stop wording could block independent local work; current active config has multiple config sources even though the kit instruction source is unambiguous.
- **Stop Line**: stop when canonical authority, maintained mirrors, planning/OpenSpec routing, deterministic drift checks, same-model behavior proof, focused/full validation, and local handoff are current; product-specific qualification harnesses and actual live-system runs remain separate project changes and owner-authorized operations.

## Capabilities

### Modified Capabilities

- `library-change-ready-sdlc`: Add per-slice earliest-real-boundary proof cadence without changing lifecycle stages or external-operation authority.
- `library-instruction-artifacts`: Keep roadmap, planning, project-template, and validation mirrors synchronized and deterministically guarded.

## Impact

- Always-loaded `global/AGENTS.md`, conditional `change-ready-sdlc`, canonical loop, project templates, planning skills, evidence guidance, and OpenSpec project rules.
- Instruction drift contracts and focused tests.
- README routing and quality-gate documentation.
- Running OpenCode sessions need a restart or fresh process to observe changed global instructions and skills.
