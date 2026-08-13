## MODIFIED Requirements

### Requirement: Final history retrospective is an evidence-bound completion task

For a change authored under the final-history-retrospective policy, the final analysis task SHALL remain unchecked until every other currently known task is complete and the full change `history.md` has been analyzed through the canonical compaction improvement contract. Its completion evidence SHALL identify the resulting admitted task IDs or `none`.

If the analysis appends tasks, they SHALL become ordinary accepted completion scope and remain unchecked until their implementation, observable proof, and validation pass. Apply SHALL continue without a routine user question. Complete archive SHALL remain unavailable while the analysis task or any generated task is unchecked.

#### Scenario: Compaction adds work before final analysis

- **WHEN** session-derived improvement tasks are appended after initial proposal authoring but before the final history analysis runs
- **THEN** the final analysis remains ineligible until those tasks are complete
- **AND** it then analyzes the complete accumulated `history.md` once.

#### Scenario: Analysis creates executable work

- **WHEN** the final analysis persists one or more admitted improvements
- **THEN** it records the generated task IDs and apply immediately proceeds to the new unchecked work
- **AND** normal task proof and validation rules govern completion.

#### Scenario: Honest none completes the analysis

- **WHEN** the six-cell history analysis produces no admitted candidate
- **THEN** the task records `none` and may be checked
- **AND** no additional task or approval ceremony is required.

#### Scenario: Archive cannot bypass the retrospective

- **WHEN** complete archive is requested for a policy-authored change whose final history analysis or generated improvement task remains unchecked
- **THEN** archive stops and returns the change to apply
- **AND** confirmation cannot waive the incomplete task.
