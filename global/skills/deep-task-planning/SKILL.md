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
- Sequence every behavior dependency chain to minimize time-to-first-real-signal. Identify the current fidelity rung, earliest safely reachable real boundary, next rung, and the exact blocker and earliest unblocking task when deferred; a reachable real check precedes dependent behavior.
- Material behavior-changing slices: original requirements, minimal happy-path implementation and observable MVP proof, accepted-scope completion, independent fresh critical-only SDET/test authoring, and final validation. Optional reviewers run only for concrete risk. Ordinary Small uses direct production, proof, focused validation, and optional smallest regression test.
- For Material live-proof work, define the evidence topology before building proof tooling: Product Candidate, production-owned Proof Runner/capture/evaluator/restoration tooling, Environment Identity, immutable Raw Evidence Bundle, online non-deferrable guards, offline replay boundary, lane composition, and scoped invalidation rules. Keep automated test harnesses and test-oracle artifacts SDET-owned after MVP. Record authorization, independent effect suppression, restoration/cleanup, and the dependency-chain stop condition. Shift-left sequencing never supplies external-operation authority.
- Make the test plan risk-driven rather than coverage-driven: identify realistic business and operational failures, real boundaries, justified mock exceptions, and residual risks.
- Plan touched ownership for local comprehension: identify mixed-responsibility or navigation-heavy files, keep line count as a signal rather than a quota, and require a cohesive extraction or `split-or-justify` when the slice adds a responsibility.
- Plan diagnostic evidence at meaningful failure boundaries: existing logging/error mechanism, original exception cause/stack, safe operation/correlation context, noise/redaction limits, and capture of exit status, stdout/stderr, logs, and artifact paths.
- Consider an optional `code-quality-reviewer` checkpoint only when concrete maintainability, navigation, duplication, module-boundary, or public-surface risk justifies independent evidence; it is never lifecycle authority.
- Separate confirmed facts from assumptions and open questions.
- Do not invent unavailable tools, APIs, or requirements.
- If the plan exposes independent workstreams with bounded evidence and validation, recommend coordinated fan-out with bounded workers; keep tightly coupled or decision-blocked work serial.

## Plan Shape

Return:

- `Outcome` / `Operating Envelope`: one bounded next increment and its enforced limits.
- `Current Evidence`: what was checked and what remains unverified.
- `Implementation Slices`: state the fidelity ladder once; every behavior-slice item SHALL include labeled `Current Rung`, `Next Real Boundary`, `Blocker/Unblocker`, `Observable Proof`, and its dependency-chain stop condition, ordered by time-to-first-real-signal. Treat omitted fields as incomplete. Material then completes accepted scope and uses independent fresh critical-only SDET/test authoring before RC validation. Ordinary Small uses focused validation and optional post-proof regression only.
- `Test Plan`: unit, integration, acceptance, negative, performance, or manual gates as applicable.
- `Evidence Plan`: for Material/evidence-heavy work, runner/evaluator boundary, preserved observations, replay corpus, environment identity, live-only guards, composable lanes, and exact invalidation consequences; otherwise `N/A - <reason>`.
- `Architecture And Context Plan`: touched responsibility map, navigation risks, cohesive boundaries, and `split-or-justify` decisions; `N/A - <reason>` for a non-code or truly mechanical slice.
- `Diagnostic Evidence Plan`: failure boundaries, exception/log context, correlation/redaction policy, captured stdout/stderr, and artifact locations; otherwise `N/A - <reason>`.
- `Code Quality Checkpoint`: when concrete risk justifies `code-quality-audit` or `code-quality-reviewer`, or `N/A - <reason>`.
- `Risk Register`: risk, impact, mitigation, owner or blocker.
- `Decision Points`: choices that need evidence or owner input.
- `Ready To Start`: yes/no with blockers.

If the user asks to execute after planning, continue from the first safe slice instead of asking routine follow-up questions.
