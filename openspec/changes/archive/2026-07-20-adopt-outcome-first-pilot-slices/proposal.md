## Why

The current instructions already prefer small happy paths and finite qualification, but OpenSpec authoring and reviewer evidence gates can still turn every valid finding into more specification, proof packaging, or scope before any usable result is recognized. The process needs to optimize explicitly for the earliest safe working increment in real conditions while preserving user control over material residual risk and retaining full Change-Ready qualification for broader release claims.

## What Changes

- Establish an outcome-first rule: choose the least complex solution that satisfies the current accepted outcome and non-deferrable invariants inside an explicitly enforced operating envelope.
- Introduce `Pilot-Ready: yes | no | not requested` as a local limited-use disposition separate from `Change-Ready`, without adding another lifecycle profile or authorizing deployment, release, or other remote operations.
- Define a minimum pilot safety floor: observable real-boundary proof, enforced reachability limits, critical-invariant protection, failure visibility, proportional disable/rollback capability, focused validation, and explicit user acceptance of material residual risks.
- Require implementation and review recommendations to try removal, scope reduction, and reuse before adding mechanisms, states, abstractions, compatibility paths, configuration, recovery protocols, or evidence infrastructure.
- Make reviewer blocking conditional on reachability inside the accepted operating envelope and impact on the current outcome, a non-deferrable invariant, or trusted mandatory validation. Valid future-scope findings remain visible as residual risks or non-authorizing follow-up candidates.
- Replace maximal up-front OpenSpec detail with next-increment sufficiency: resolve only decisions that can materially change the next working slice or its safety envelope, and stop specification refinement once a capable implementer can proceed without guessing user-owned or high-risk decisions.
- Keep specialized guidance conditional on the current operating envelope. Centralize shared policy instead of copying Occam or pilot prose into every skill and reviewer.
- Add focused deterministic contract checks and fresh-session behavioral evals for thin-slice selection, pilot containment, material-risk approval, minimum-remedy review, and non-blocking evidence polish.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `library-change-ready-sdlc`: Add the separate Pilot-Ready disposition, enforced operating-envelope rules, minimum pilot safety floor, material residual-risk approval, and reachability-based finding routing while preserving full Change-Ready qualification for residual Material risk and explicit qualification requests.
- `library-instruction-artifacts`: Replace maximal OpenSpec pre-resolution with next-increment sufficiency and require canonical, non-duplicated outcome-first and minimum-remedy guidance across global instructions, skills, agents, and reviewer contracts.

## Impact

- Canonical runtime authority: `global/AGENTS.md` and `global/skills/change-ready-sdlc/SKILL.md`.
- Planning and specification guidance: `global/skills/deep-task-planning/SKILL.md`, `global/skills/next-step/SKILL.md`, `global/skills/service-architecture-design/SKILL.md`, `global/skills/openspec-consistency-review/SKILL.md`, and `global/skills/documentation-hardening-loop/SKILL.md` only where their current wording independently requires broader design than the next accepted slice.
- Role boundaries: `global/agents/implementation-worker.md`, `global/agents/sdet-quality-engineer.md`, `global/agents/implementation-readiness-reviewer.md`, `global/agents/openspec-architecture-reviewer.md`, `global/agents/final-candidate-reviewer.md`, `global/agents/session-delivery-reviewer.md`, and the canonical `instructions/leaf-reviewer-agent-contract.md`.
- Quality guidance: existing `code-quality-audit`, `code-quality-reviewer`, and `instruction-artifact-tuning` wording is preserved where already conforming and changed only for missing delete/narrow/reuse or canonical-placement rules.
- Deterministic contracts, validators, and focused fixtures under `tools/` must align with the new dispositions and reject duplicated or contradictory authority. No new runtime service, agent, skill, plugin, MCP server, state store, deployment mechanism, or remote operation is introduced.
- The active `integrate-continuous-sdlc-learning` change is not expanded or rewritten by this change. Its later implementation must consume the accepted policy baseline and preserve its runtime instruction non-growth budget.
