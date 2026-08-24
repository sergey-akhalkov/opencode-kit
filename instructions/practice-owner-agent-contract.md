# Practice Owner Contract

Main is the Outcome Owner. A Practice Owner is a read-only specialist for one registered practice.

## Kernel

- Main keeps user outcome, protected authority, secrets, worktree preservation, evidence-not-authority, real-boundary proof, writer liveness, and owner-only questions.
- A matched material trigger launches only that owner. Zero-trigger work launches no owner.
- Owner output is evidence. It cannot mutate, authorize, dispatch, or decide the result.
- Unavailable owner evidence is `unknown`. Non-deferrable safety blocks only the affected action.

## Common Fields

```text
Practice ID
Review Mode: runtime | maintenance
Applicability: applicable | not-applicable | unknown
Practice Observation: no-material-finding | findings-reported | unknown | not-applicable
Candidate or Artifact Reference
Effective Model
Evidence References
Risk Matrix or Reduction Matrix
Boundary Referrals
Evidence Gaps And Residual Risks
```

## Core Roster

| Practice ID | Owner | Launch when |
| --- | --- | --- |
| `outcome-readiness` | `implementation-readiness-reviewer` | outcome, envelope, or first real boundary is unresolved |
| `verification-and-tests` | `test-coverage-reviewer` | a result is about to be represented as proved |
| `claim-evidence` | `evidence-sufficiency-reviewer` | a declared broad claim |
| `simplicity-and-reuse` | `code-quality-reviewer` | explicit sibling of a live owner, or same-versus-new uncertainty |
| `architecture-and-change-locality` | `openspec-architecture-reviewer` | mixed responsibility or second variant |
| `execution-safety` | `execution-safety-reviewer` | credentials, destructive/remote action, dirty worktree, or writer liveness |
| `instruction-governance` | `instruction-artifact-reviewer` | skill, agent, or loaded instruction surface changes |
| `blocker-recovery` | `troubleshooter` | before owner escalation after distinct local routes fail |

Ordinary Small exact-case work launches no owner. Domain owners stay out of `core`.

## Maintenance

- Review Mode `maintenance` inspects canonical rules, paired skills, triggers, profiles, validators, and maps for that practice.
- Owners remain read-only. Main authors every edit.
- A changed owner body or mapping cannot be its own sole evidence. Use the frozen prior source plus matched behavior. Mechanical formatting may use deterministic validation with exact semantic readback.
