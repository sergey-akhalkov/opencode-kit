## ADDED Requirements

### Requirement: Loaded authority separates invocation finalization from mission completion

The always-loaded authority and role-specific workflow instructions SHALL use
separate semantics for a finalized execution invocation, an achieved accepted
outcome, and a completed or explicitly abandoned change. They SHALL state
concisely that a one-shot authorization or non-reusable evidence root prevents
automatic replay of that invocation but does not impose a fixed mission-wide
attempt ceiling on causally distinct, authorized successors.

The complete rule SHALL have one canonical owner. Proportional mirrors SHALL not
repeat stronger phrases such as `immediately blocks another live attempt`,
`permanently stops for the root`, or `no further retry` without the causal
continuation and protected-action distinction in the same local context.

#### Scenario: Agent sees zero-retry artifact wording

- **WHEN** a loaded primary sees an unfinished accepted outcome and an agent-authored artifact that says `one attempt`, `zero retries`, or `no successor`
- **THEN** it treats the consumed invocation as immutable and the process ceiling as revisable
- **AND** it continues through a causally justified authorized successor without asking the owner to approve process bookkeeping.

#### Scenario: Explicit user limit remains controlling

- **WHEN** the user explicitly limits work to one named attempt or instructs the session to stop
- **THEN** loaded authority preserves that human boundary
- **AND** autonomous continuation wording SHALL NOT override it.

### Requirement: Checked-but-unmet outcome behavior is evaluated through installed routes

Instruction behavior changes affecting continuation or completion SHALL retain a
same-model baseline/candidate scenario containing all of these observable facts:
an unfinished human requirement, every current task checked, Development-Stage
`development`, a missing required receipt, trustworthy direct operation evidence,
zero output and a failed positive control from an indirect observer, a stale
machine-local observer identity, an existing safe causal correction, and an
agent-authored zero-retry stop line.

The candidate evaluation SHALL observe requirement mapping, process-control
updates, task reopen/add behavior, owner-question absence, selected next mechanism,
operation-helper resolution, protected-action restraint, and terminal cleanup. It
SHALL retain controls for an achieved outcome, explicit user pause, true
owner-only action, and unchanged live repetition.

#### Scenario: Candidate continues the reproduced failure class

- **WHEN** baseline and candidate run the fixed checked-but-unmet scenario with the same model, profile, inputs, permissions, and environment
- **THEN** the candidate preserves prior evidence, narrows the broken observer lane, restores pending outcome work, and chooses the safe causally distinct continuation without a user question
- **AND** it does not perform a protected action whose current gate is not clear.

#### Scenario: Candidate preserves stop controls

- **WHEN** the same candidate receives an achieved-outcome, explicit-pause, true-owner-only, or unchanged-live-repetition control
- **THEN** it stops or blocks the exact governed path as required
- **AND** it does not generalize outcome continuation into unlimited blind retries.

### Requirement: Workflow reflection remains outside product completion scope

Retrospective, compaction, and instruction-feedback analysis MAY preserve an
evidence-backed observation in a dedicated feedback or future-change owner, but
SHALL NOT automatically append a mandatory final-history task or generate product
implementation tasks solely because a change is nearing completion. Reflection
SHALL NOT delay an accepted outcome, RC, stable handoff, or complete archive.

An improvement that is directly necessary for the still-current accepted outcome
remains ordinary dependency-closure work and SHALL be represented by the smallest
normal task when discovered. Optional process, token, or workflow improvement
ideas remain outside the active product task graph.

#### Scenario: Change reaches its accepted outcome

- **WHEN** implementation, representative proof, and applicable validation satisfy the accepted outcome and no required dependency work remains
- **THEN** proposal/apply/archive SHALL NOT require a final history retrospective or six-cell improvement task before completion
- **AND** optional workflow feedback may be recorded separately without becoming accepted product scope.

#### Scenario: Reflection finds a required current correction

- **WHEN** evidence identifies a correction without which the current accepted outcome or non-deferrable invariant is not satisfied
- **THEN** main adds the smallest ordinary implementation task and completes it
- **AND** it does not classify that required correction as optional retrospective polish.

## REMOVED Requirements

### Requirement: New OpenSpec changes schedule one final history retrospective

**Reason:** Mandatory final-history tasks convert internal process reflection into
product completion scope, add ceremony after the accepted outcome, and can generate
new work unrelated to the user goal.

**Migration:** Newly proposed changes omit the task. Existing active changes may
remove an unstarted agent-authored retrospective when doing so preserves accepted
semantics; historical completed evidence remains unchanged.

### Requirement: Final history analysis uses the existing improvement contract

**Reason:** Automatic admission and execution of retrospective findings can make
the product task graph self-expanding and distract from outcome completion.

**Migration:** Preserve evidence-backed optional observations in the existing
feedback or separately owned change path. Represent a correction required for the
current accepted outcome as an ordinary task when discovered.
