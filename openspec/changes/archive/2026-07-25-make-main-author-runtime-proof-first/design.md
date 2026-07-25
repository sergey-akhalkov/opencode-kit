## Context

Software release terminology distinguishes a minimum working implementation from a release candidate. The owner selected a compact model rather than the full pre-alpha/alpha/beta vocabulary. MVP is used as the clear working-version milestone; RC keeps its conventional release-candidate meaning; stable means locally complete but not externally released.

## Goals

- Make the current maturity of an OpenSpec implementation immediately understandable.
- Prevent endless polishing once accepted behavior works and no known critical defect remains.
- Avoid hard bug-count, coverage, or soak-time thresholds.
- Preserve critical safety, data, authorization, and irreversible-action boundaries.
- Keep external release authority separate from local maturity.

## Non-Goals

- Claim that all undiscovered bugs are impossible.
- Require every non-critical bug or optimization to be fixed before RC/stable.
- Turn reviewers into approval authorities.
- Add a durable workflow database or release automation.
- Deploy, publish, install, activate, or archive automatically.

## Decisions

### D1. One maturity field

The only user-facing lifecycle field is:

```text
Development-Stage: development | MVP | RC<n> | stable
```

Internal `Ordinary Small | Material` profiles remain proportional gate selectors, not lifecycle stages.

### D2. MVP is the minimum working version

MVP is earned only when the smallest complete accepted happy path is invoked at a representative boundary with meaningful input and observed output or side effects. Compilation, static checks, unit tests, code inspection, or mocked helper output alone are insufficient.

MVP is usable but not release-qualified. Additional accepted scope may remain. A candidate-affecting mutation returns to development until current proof restores MVP.

### D3. RC has release-candidate meaning

RC is assigned only after:

- accepted scope is complete;
- current MVP proof exists;
- applicable project-native validation is green;
- Material critical SDET is terminal and usable when applicable;
- no known confirmed reachable critical or non-deferrable defect remains.

Known documented non-critical bugs, limitations, optional coverage gaps, and suboptimal code do not block RC. RC numbering is monotonic within the root. Mutation invalidates the RC; after proof and requalification the next candidate is `RC<n+1>`.

### D4. Stable is local completion

Stable promotes the same RC after the local handoff records the outcome, scope, proof, validation, critical-SDET state when applicable, known non-critical limitations, and external-operation state. No soak-time threshold is required. The handoff records `Stable Candidate: RC<n>`.

Stable does not authorize deploy, release, publication, installation, activation, credentials, destructive action, or remote mutation.

### D5. Critical-only stop line

After MVP, required work is limited to incomplete accepted scope and reproduced accepted-outcome, critical, or non-deferrable defects. Non-critical bugs, coverage, maintainability, naming, formatting, evidence polish, and optimization are documented and parked.

"All critical bugs are fixed" means no known confirmed reachable critical or non-deferrable defect remains inside the enforced operating envelope. It does not assert that future testing cannot discover another defect.

### D6. Review is optional; Material SDET is focused

Read-only reviewers may run after MVP only for concrete risk, project policy, or owner request. Their absence or unusable output is not a stage blocker. Findings never authorize mutation.

Material behavior changes use fresh critical-only SDET after MVP and accepted-scope completion. Another attempt requires an immediately-prior main-confirmed critical defect, production fix, and new proof. The first valid no-confirmed-critical attempt stops SDET. Non-critical findings cannot prolong testing.

## Lifecycle

```text
development --representative happy-path proof--> MVP
MVP --scope complete + validation + critical gates--> RC1
RC1 --complete local handoff--> stable (Stable Candidate: RC1)

RC<n> or stable --candidate mutation--> development
development --current proof--> MVP
MVP --full requalification--> RC<n+1>
```

## Risks And Controls

- Undiscovered bug after stable: normal software risk; record evidence and fix in a new change when found.
- Non-critical issue causes polishing loop: park it unless it breaks accepted scope or reaches critical/non-deferrable consequence.
- Reviewer recommendation expands scope: main rejects it unless owner authority or a reproduced in-scope defect permits work.
- RC confused with release: every handoff states that external operations were not performed unless separately authorized.

## Migration

Replace active `Change-Status`/`Done-Done` contracts rather than retaining aliases. Preserve old runtime evidence as historical evidence only. Update loaded authority, role deltas, mirrors, contracts, validators, and focused tests. Re-prove the new loaded policy before assigning the next stage.
