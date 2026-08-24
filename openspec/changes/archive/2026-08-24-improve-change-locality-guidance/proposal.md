## Why

The current guidance protects simplicity, cohesion, and local comprehension, but it does not explicitly make the main session accountable for the cost of the next plausible change. This leaves room for two opposite failures: a narrowly hard-coded implementation that makes an evidenced follow-up expensive, or speculative SOLID/GoF infrastructure that increases navigation and lifecycle cost before any variation exists.

## Outcome Capsule

- **Outcome**: The main session solves the accepted current increment with the smallest complete design while keeping the next requirement-backed or evidence-backed change local when a low-cost seam can do so. Main remains accountable for the concrete design, integration, proof, and result; the registered `architecture-and-change-locality` Practice Owner is responsible for the practice's material-trigger observation and maintenance semantics without becoming a decision authority.
- **Operating Envelope**: Human-written production design and implementation performed through the loaded OpenCode guidance for Ordinary Small and Material work. The rule applies only when current requirements, existing variants, an external/system boundary, a state transition, or inspected code evidence identifies a plausible change axis or important invariant. Data-only, generated, mechanical, and owner-local edits remain direct unless they independently introduce such a trigger.
- **Non-Goals**: Mandatory SOLID or Gang of Four pattern use; a new autonomous architect or architecture-decision agent; an owner call for zero-trigger ordinary work; interfaces for every implementation; plugin systems, factories, wrappers, inheritance hierarchies, or generic frameworks for hypothetical variants; broad refactoring of neighboring debt; prediction of every future requirement; deterministic scoring of architecture quality.
- **Non-Deferrable Invariants**: The accepted current outcome, safety, proof, and protected-boundary rules remain controlling. Direct code is the default when no concrete change axis exists. A new seam or abstraction must improve current locality, testability, safety, or comprehension and isolate a named source of change; it must not merely advertise extensibility. Main retains the concrete architecture decision and integration accountability after delegation. A matched material trigger receives one bounded read-only Practice Owner observation, which never authorizes architecture work or scope expansion. Static checks never claim to prove semantic design quality.
- **Observable Proof**: Run bounded same-model baseline/candidate workflows with identical prompts, model, variant, workspace fixtures, tools, and environment. Cover a one-off local fix, a requirement-backed second behavior variant, an external integration boundary, non-trivial state transitions, a mixed-owner file, and a tempting but hypothetical extension point. Retain the candidate only when it preserves current correctness and safety, keeps evidenced follow-ups local, avoids speculative layers and owner calls in negative-control scenarios, invokes only the exact Practice Owner on material triggers, and leaves the concrete decision and disposition with main.
- **Material Residual Risks**: "Plausible" change axes require judgment and may be misidentified; model behavior varies between runs; a concise seam can still become stale; synthetic scenarios cannot prove architecture quality across all languages and repositories; additional always-loaded wording can increase startup context unless it replaces overlapping guidance.
- **Stop Line**: Finish when one canonical principle owner, one concise operational main-session rule, the registered Practice Owner delta, necessary production-role deltas, exact structural drift checks, and bounded behavior evaluation are synchronized and green. Do not create an autonomous architect/decision agent, owner call for zero-trigger work, architecture scoring helper, pattern catalog, universal layer template, mandatory per-task artifact, or refactor unrelated production code.

## Claim And Evidence Scope

- **Claim ID**: `CLC-001`
- **Claim Class**: Loaded instruction behavior for change-local architecture decisions.
- **Population**: The maintained synthetic scenario set covering direct local work, evidenced variation, external boundaries, state transitions, mixed ownership, delegation, and hypothetical-extensibility negative controls.
- **Coverage Basis**: One identical baseline/candidate run per maintained scenario plus deterministic inspection of canonical principle ownership, main decision authority, registered Practice Owner routing, and forbidden autonomous-architect or zero-trigger owner-call language.
- **Production Path**: The resolved active global instructions used by the main session and the implementation brief/role path they govern.
- **Comparison Paths**: The unchanged baseline global source and the candidate global source exercised in disposable workspaces.
- **Environment**: Same OpenCode build, effective model and variant, permissions, synthetic repository fixtures, and non-sensitive prompts for both paths.
- **Real Oracle**: Observable owner applicability/report identity, main candidate decisions, and proposed file/responsibility shapes satisfy each scenario's current outcome, locality, directness, delegation-accountability, no-speculation, and zero-trigger-no-call oracle without weakening safety or proof.
- **Unresolved Observations**: Other models, languages, repository scales, and unrepresented architecture pressures remain unqualified.
- **Maximum Claim**: The candidate improves or preserves the selected architecture decisions for the maintained scenario population; it does not prove universal SOLID/GoF compliance or optimal architecture in untested projects.

## What Changes

- Make `main` explicitly accountable for choosing and integrating either direct implementation or the smallest useful architectural seam, while the registered owner controls the practice observation when a reviewed material change-axis trigger matches.
- Define a seam as justified only when it pays for itself in the current increment through locality, comprehension, testability, or safety while containing named volatility.
- Treat SOLID and Gang of Four patterns as optional diagnostic vocabulary, never mandatory structure or evidence of quality.
- Require delegation briefs to preserve the chosen responsibility boundary and require main to verify integration locality after delegated work.
- Reuse `openspec-architecture-reviewer` as the trigger-required but non-authorizing `architecture-and-change-locality` Practice Owner for material cases; keep `code-quality-reviewer` within its separate `simplicity-and-reuse` boundary and keep zero-trigger work owner-free.
- Add deterministic ownership/drift checks only for exact instruction markers and evaluate semantic behavior through matched disposable baseline/candidate workflows.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `library-change-ready-sdlc`: Extends outcome-first simplicity and local-comprehension requirements with main-owned design/result decisions, Practice-Owner-controlled material observations, and pay-as-you-go architecture behavior.
- `library-instruction-artifacts`: Defines canonical principle ownership, main-versus-Practice-Owner routing, deterministic structural limits, and matched behavior-evaluation requirements for the new guidance.

## Impact

- Loaded instruction owners: `global/principles-of-work.md` and the implementation guardrails in `global/AGENTS.md`, with replacement or consolidation rather than duplicated policy.
- Role and workflow deltas: implementation-author and the registered architecture/change-locality owner surface only where the existing contract needs an explicit responsibility distinction; the owner infrastructure is supplied by `establish-practice-owner-agents` before this change mutates loaded behavior.
- OpenSpec deltas: `library-change-ready-sdlc` and `library-instruction-artifacts`.
- Validation/evaluation: existing instruction contract validators, fixtures, and same-model behavior-evaluation tooling; no architecture scorer or new dependency.
- No application API, persisted data, protocol, security boundary, deployment, release, remote effect, or production-code architecture is changed by this planning increment.
