## Why

Session compaction already preserves evidence-backed improvements, but the workflow does not reliably distinguish work that should execute before the next consumer from work that belongs at freeze or in a separate change. It also does not require concrete same-repository consumers, so reusable improvements can receive too little attention while speculative future work can become blocking scope.

## Outcome Capsule

- **Outcome:** Every evidence-backed improvement is classified by impact horizon and execution point; active-change improvements run at their earliest safe consumer boundary, while concrete same-repository multipliers receive explicit attention and future-only work remains non-blocking.
- **Operating Envelope:** Loaded global compaction, apply, archive, and final-history workflows for a writable active OpenSpec change with known remaining tasks, current evidence, and existing owner/safety gates.
- **Non-Goals:** Add a scoring engine, backlog service, generic benchmark framework, automatic cross-change mutation, estimated savings, or authority to cross protected boundaries.
- **Non-Deferrable Invariants:** Live-attempt and safety gate closure stays first; no candidate expands accepted outcome; no other change or repository is mutated without an owning path; no admitted task is lost; no future-only candidate blocks current completion.
- **Observable Proof:** The same loaded compaction entry point classifies a synthetic current-path improvement, a same-repository multiplier with exact consumers, and unsupported future work; apply/contract checks enforce the resulting order and archive behavior.
- **Material Residual Risks:** Model-facing classification remains judgment rather than deterministic semantic enforcement; instruction changes require a new OpenCode process before future sessions load them.
- **Stop Line:** Stop after current-change sequencing, same-repository multiplier handling, deferred-candidate preservation, loaded runtime proof, focused contracts, critical SDET, and repository validation are green; do not build a scheduler or implement deferred consumers.

## What Changes

- Add canonical improvement fields for impact horizon, concrete consumers, execution class, earliest safe point, invalidated evidence, and observable payback.
- Require active-change improvements to execute at their earliest safe consumer boundary after safety and live-attempt blockers.
- Treat an improvement as a same-repository multiplier only when the active change consumes and proves it and at least one additional exact repository consumer is named.
- Preserve evidence-backed candidates with no current consumer as non-blocking deferred records for a separate owning change instead of admitting them into the current change.
- Align compaction, apply, archive, final-history, documentation, normative specs, and focused contract checks.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `library-instruction-artifacts`: Classify, persist, and route session-derived improvements by impact horizon and earliest safe execution point.
- `library-spec-workflow-integrity`: Execute admitted improvements before their first concrete consumer while keeping deferred work outside current completion scope.
- `library-change-ready-sdlc`: Preserve critical-path ordering and accepted-scope convergence when session-derived improvements are introduced.

## Impact

- Loaded policy: `global/AGENTS.md`, `global/opencode.json.template`, and the active machine-local `global/opencode.json` prompt.
- OpenSpec workflow: canonical global apply/archive skill and command surfaces.
- Documentation and contracts: `docs/workflows/session-reflection.md`, current normative OpenSpec specs, and focused delivery contract tests.
- No dependency, public API, persisted product data, remote operation, deployment, or release change.
