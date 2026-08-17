## ADDED Requirements

### Requirement: Completion arbitration prioritizes unfinished outcomes over process ceilings

For an enabled root, the completion arbiter SHALL treat task checkboxes, attempt
counts, invocation finalization, handoff documents, and process stop lines as
supporting evidence rather than proof that a current human requirement is
complete. If the accepted outcome lacks its required observation and a bounded safe
causally distinct continuation remains, the arbiter SHALL return `continue` even
when every current OpenSpec task is checked or an agent-authored attempt budget is
exhausted.

The continuation SHALL identify the unfinished requirement, trustworthy preserved
facts, the invalid or blocked evidence lane, the causal delta, the smallest next
action, its expected decision-changing evidence, and the exact protected action it
must not cross. `owner_required` SHALL remain valid only for a proven owner boundary
necessary to the accepted outcome with no safe goal-preserving route.

#### Scenario: All tasks are checked but receipt is absent

- **WHEN** the root reports `23/23`, Development-Stage `development`, no required receipt, direct startup success, and zero output plus a failed canary from a stale indirect observer
- **AND** a safe observer-identity correction and subsequent authorized route remain available
- **THEN** the arbiter returns `continue` for artifact reconciliation and the safe correction
- **AND** it does not return `allow_stop` or `owner_required` from the checked tasks or zero-retry wording.

#### Scenario: Unchanged live repetition is proposed

- **WHEN** the only proposed continuation repeats the same live mechanism without a causal delta, current replay, or known cleanup
- **THEN** the arbiter prohibits that repetition and requests diagnosis or a distinct mechanism
- **AND** outcome-continuation policy does not clear the live-attempt gate.

#### Scenario: Completed outcome may stop

- **WHEN** every current human requirement has current observable completion evidence and no unresolved non-deferrable invariant remains
- **THEN** the arbiter may return `allow_stop`
- **AND** it does not create work solely for retrospective or process-improvement analysis.
