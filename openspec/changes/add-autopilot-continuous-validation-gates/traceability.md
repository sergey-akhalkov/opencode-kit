# Traceability: Add Autopilot Continuous Validation Gates

## Source Questions

| User Concern | Proposed Coverage |
| --- | --- |
| How do we guarantee Autopilot steps are not skipped? | Layered checks validate ledgers, legal transitions, phase evidence, reviewer/MR gates, and final freshness before claims. |
| Can checks happen before push? | `cheap` and `standard` levels run during work; `prepush` remains a final local blocking gate. |
| Can push catch more Autopilot failures? | Pre-push adds active ledger validation and relevant freshness checks. |
| How do we avoid stopping halfway? | Machine-readable output and next actions expose blockers, unknowns, invalid ledgers, and final-gate gaps instead of silently proceeding. |
| How do we avoid too much overhead? | Gate levels and command deduplication keep frequent checks cheap and reserve heavy checks for pre-push/final. |

## Requirement To Task Map

| Requirement | Primary Tasks |
| --- | --- |
| Layered Autopilot Validation Checks | Tests First 1-4; Implementation 1-6; Acceptance 1, 6 |
| Pre-Push Gate Includes Autopilot Ledger Coverage | Tests First 5-6; Implementation 6-7; Acceptance 2-3 |
| Validation Plans Are Deduplicated And Cost-Aware | Tests First 4; Implementation 6-7; Acceptance 1, 5 |
| Evidence Freshness Is Checked Before Final Claims | Tests First 7; Implementation 4, 6; Acceptance 4 |
| Final Checks Include Retrospective Archive Gates | Tests First 8; Implementation 6; Validation final command; Acceptance 4 |
| Autopilot Check Output Is Machine-Readable | Tests First 9; Implementation 8-9; Acceptance 5 |

## Implementation Boundaries

In scope:

- TypeScript planner/checker.
- `package.json` script for local checks.
- Pre-push plan expansion.
- README and Autopilot instruction updates.
- Tests for planner, pre-push behavior, freshness triggers, output, and docs drift.

Out of scope:

- Worker dispatch or protected ledger mutation.
- Remote MR/provider checks.
- Auto-merge, deploy, force-push, or protected branch pushes.
- Secrets inspection.
- Running full repository tests after every cheap checkpoint.

## Suggested Implementation Order

1. Define output and planner fixtures in tests.
2. Implement discovery and level planning without command execution.
3. Add ledger validation execution and no-ledger handling.
4. Integrate planner into pre-push with fail-fast tests.
5. Add standard/final evidence and freshness planning.
6. Add CLI output, redaction, and warning behavior.
7. Update docs and instructions.
8. Run validation and reviewer gates.
