# Evidence And Validation Discipline

Use this instruction template when a repository needs stronger proof standards for agentic development.

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
- For behavior-changing implementation, first prove the smallest complete happy path through observable execution, then delegate systematic risk discovery and all automated test authoring to a separate fresh-context testing subagent that did not author production code.
- Optimize test scenarios for realistic business and operational failures, not coverage percentages. Prioritize real-boundary end-to-end evidence and document every material mock exception or unavailable dependency.
- If validation cannot run, report `Validation skipped` with reason and risk.
- For performance claims, include measurement, environment, profile, and before/after comparison when relevant.

## Finding Format

Use this format for material findings:

- `Severity`: P0 blocker | P1 material | P2 minor.
- `Evidence`: file:line, command output, schema path, test name, log, or explicit missing evidence.
- `Evidence Type`: source | test | schema | live output | docs-only | assumption.
- `Impact`: what can break or be misunderstood.
- `Recommendation`: smallest useful fix or evidence gate.
- `Confidence`: high | medium | low.

## Validation Loop

1. Read the original requirements and define the observable happy path, business invariants, boundaries, and acceptance evidence.
2. Reproduce or prove current behavior where feasible.
3. Make the smallest complete happy-path change.
4. Prove the happy path through observable execution at the relevant boundary.
5. Start a fresh-context testing subagent with test-only write scope to build the risk matrix and author realistic negative/end-to-end tests.
6. Feed discovered failures into production hardening, then rerun the happy path and negative suites.
7. Run broader validation when the change crosses module/API/deployment boundaries.
8. Report happy-path evidence, testing agent/session, risk matrix, mock exceptions, failures found, validation, and residual risks.
