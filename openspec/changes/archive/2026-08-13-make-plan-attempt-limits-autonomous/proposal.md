## Why

The current outcome-first policy permits new internal candidates, but it does not explicitly classify OpenSpec attempt counts, revision labels, task inventories, and stop lines as orchestrator-owned implementation controls. This gap can turn an already diagnosed and offline-unlocked failure into a false owner question asking whether the agent may update its own plan instead of continuing the accepted task.

## Outcome Capsule

- **Outcome**: When evidence shows that completing the accepted outcome requires a changed plan, OpenSpec artifact, task inventory, candidate/revision, or attempt limit, the main session updates that control autonomously and continues without asking for process approval.
- **Operating Envelope**: Local, reversible planning and implementation changes inside the accepted outcome and its existing protected-boundary authority. A repeated live attempt still requires a clear `Live-Attempt Gate`, satisfied safety/restoration prerequisites, and separate authority for the underlying operation.
- **Non-Goals**: Do not authorize credentials, remote/destructive/physical effects, deployment, release, cost, manual hardware action, protected semantic changes, repeated unchanged strategies, or waived restoration/cleanup.
- **Non-Deferrable Invariants**: Preserve the accepted outcome, operating envelope, safety/data/authorization invariants, protected-boundary authority, evidence topology, live-attempt replay gate, unrelated work, and honest task/proof state.
- **Observable Proof**: A fresh OpenCode session given the fixed-image pre-COM scenario updates the one-attempt OpenSpec boundary and selects the bounded successor without asking the owner; a paired scenario lacking authority for the underlying protected action still stops at that exact action.
- **Material Residual Risks**: Instruction wording may overgeneralize plan autonomy into live-operation authority. Exact positive and negative contract markers, paired runtime scenarios, and existing protected-boundary validation contain this risk.
- **Stop Line**: Relevant loaded, OpenSpec, portable-template, completion-arbiter, normative-spec, and deterministic-contract surfaces agree; the fresh-session behavior and applicable validation are green; no protected operation is performed by this change.

## What Changes

- Define plans, task/path inventories, OpenSpec artifact text, candidate/revision labels, attempt counts, and process stop lines as main-session controls rather than owner scope when accepted semantics remain unchanged.
- Require the main session to update those controls and continue after causal correction and live-attempt unlock evidence, instead of asking whether to expand a change or allow a successor attempt.
- Preserve separate authority for the underlying protected/live action and all fail-closed replay, restoration, cleanup, identity, and safety gates.
- Align OpenSpec propose/apply/archive routing, portable project instructions, the completion arbiter, normative specifications, and deterministic contract markers.
- Add focused post-proof regression coverage through fresh test-only SDET when the current suites do not already enforce the distinction.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `library-change-ready-sdlc`: Clarify autonomous implementation-control adaptation versus protected action authority.
- `library-instruction-artifacts`: Require loaded instruction and completion-guard surfaces to reject process-only owner questions for spec and attempt-limit changes.
- `library-spec-workflow-integrity`: Require OpenSpec artifacts and apply/archive routing to remain mutable implementation controls inside accepted semantics.

## Impact

Affected surfaces are `global/AGENTS.md`, `global/skills/change-ready-sdlc/SKILL.md`, `global/agents/session-completion-arbiter.md`, project instruction templates, OpenSpec config and command/skill mirrors, current normative specs, and existing TypeScript contract markers/validators. No product API, dependency, credential, external system, or remote state changes.
