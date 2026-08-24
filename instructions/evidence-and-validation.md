# Evidence And Validation Discipline

Use this instruction template when a repository needs stronger proof standards for agentic development.

Apply proof through the working philosophy: preserve quality and honest outcome semantics, choose the shortest sufficient evidence path, continue autonomously until a real owner boundary, minimize context cost, and fix or remove concrete evidence-process impediments without weakening safety.

## Evidence Hierarchy

Highest confidence:

- Source code, executable tests, schemas, generated artifacts, scripts, and live command output.
- Wire captures, logs, benchmark output, or manual run output when reproducible and relevant.

Medium confidence:

- Project docs that are directly linked to source/tests or recently validated.
- Issue/MR descriptions that match the inspected diff and validation evidence.

Low confidence:

- Comments, generated summaries, stale docs, unverified examples, and user recollection.

## Required Practice

- State whether important claims are confirmed, docs-only, assumption, or blocked.
- Do not mark a task complete without evidence.
- Do not claim production readiness without acceptance tests, validation output, benchmark/manual gates where relevant, and residual risk review.
- First prove the happy path through observable execution and complete accepted scope. Main may add a focused requirement-linked regression after proof; delegate independent critical risk discovery to fresh test-only SDET only for a reachable named critical consequence or explicit requirement.
- Optimize test scenarios for realistic business and operational failures, not coverage percentages. Prioritize real-boundary end-to-end evidence and document every material mock exception or unavailable dependency.
- Per behavior dependency chain, execute the first safely reachable real boundary sufficient for the accepted effect before dependent expansion. If deferred, record the current rung, path-scoped blocker, unblocker/replan, authorization, safeguards, restoration, evidence, and stop condition; shift-left never authorizes external operations.
- If validation cannot run, report `Validation skipped` with reason and risk.
- For performance claims, include measurement, environment, profile, and before/after comparison when relevant.

## Finding Format

Use this format for material risk rows:

- `Risk ID`: stable identifier.
- `Requirement/Invariant`: exact behavior or protected boundary.
- `Evidence`: file:line, command output, schema path, test name, log, or explicit missing evidence.
- `Evidence Type`: source | test | schema | live output | docs-only | assumption.
- `Reachable Scenario`: how the risk occurs inside the enforced envelope.
- `Business Consequence`: what can break or be misunderstood.
- `Likelihood`: known estimate or `unknown`.
- `Smallest Mitigation Note`: remove, narrow, reuse, local guard, or defer for main disposition.
- `Confidence`: high | medium | low.

## Validation Loop

1. Read the original requirements and define the observable happy path, business invariants, boundaries, and acceptance evidence.
2. Reproduce or prove current behavior at the first safely reachable real boundary sufficient for the accepted effect; characterize the real baseline before modeling or substitution when authorized.
3. Make the smallest complete happy-path change.
4. Prove the happy path through observable execution at the current fidelity rung; do not defer an already reachable real rung before dependent work.
5. Optionally collect reviewer evidence only for concrete risk; main dispositions any invoked findings.
6. Apply only authorized corrections, then rerun observable proof.
7. When a named critical-risk or explicit SDET requirement applies, after current proof and accepted-scope completion start a fresh-context testing subagent with test-only scope.
8. Feed confirmed failures into production hardening, then rerun the happy path and affected suites.
9. Run broader validation when the change crosses module/API/deployment boundaries.
10. Report proof, validation, known non-critical limitations, ordinary `Outcome` or qualification-only `Development-Stage`, critical-SDET state when applicable, and external-operation state.
