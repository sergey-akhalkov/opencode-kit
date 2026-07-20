---
name: deep-task-planning
description: Build an execution-grade plan for complex, risky, or unclear software tasks before implementation, including scope, evidence, tests, risks, and stop conditions.
license: MIT
---

# Deep Task Planning

Use this skill when the user asks for a plan, when implementation would be risky without decomposition, or when a task spans architecture, tests, data migration, deployment, performance, security, or multiple repositories.

Do not use it for routine single-file changes, simple questions, or tasks where the user clearly expects immediate implementation.

## Planning Contract

- Define `Outcome`, `Operating Envelope`, `Non-Goals`, `Non-Deferrable Invariants`, `Observable Proof`, `Material Residual Risks`, and `Stop Line` (or project-native equivalents).
- Identify primary evidence: source, tests, schemas, scripts, live output, product docs, external specs, or owner decisions.
- Prefer the next useful working increment inside a technically enforced operating envelope; unreachable future design is non-blocking residual.
- Material/explicit qualification behavior-changing slices: original requirements, minimal happy-path implementation, observable proof, then independent fresh-context SDET/risk discovery and test-only negative/end-to-end authoring, hardening, and final validation. Ordinary Small reuses always-loaded direct production, observable proof, focused validation, and optional smallest post-proof regression test. Future/unreachable scope stays non-blocking.
- Make the test plan risk-driven rather than coverage-driven: identify realistic business and operational failures, real boundaries, justified mock exceptions, and residual risks.
- Add a `code-quality-reviewer` gate for slices likely to affect maintainability, file navigation, duplication, module boundaries, or public surface area.
- Separate confirmed facts from assumptions and open questions.
- Do not invent unavailable tools, APIs, or requirements.
- If the plan exposes independent workstreams with bounded evidence and validation, recommend coordinated fan-out with bounded workers; keep tightly coupled or decision-blocked work serial.

## Plan Shape

Return:

- `Outcome` / `Operating Envelope`: one bounded next increment and its enforced limits.
- `Current Evidence`: what was checked and what remains unverified.
- `Implementation Slices`: ordered happy-path implementation and observable proof first; Material/explicit qualification then independent fresh-context SDET/test-only authoring before hardening/validation; Ordinary Small uses focused validation and optional post-proof regression only. Group mechanical mirror edits that share one owner/validation.
- `Test Plan`: unit, integration, acceptance, negative, performance, or manual gates as applicable.
- `Code Quality Gate`: when to run `code-quality-audit` or `code-quality-reviewer`, or why it is not needed.
- `Risk Register`: risk, impact, mitigation, owner or blocker.
- `Decision Points`: choices that need evidence or owner input.
- `Ready To Start`: yes/no with blockers.

If the user asks to execute after planning, continue from the first safe slice instead of asking routine follow-up questions.
