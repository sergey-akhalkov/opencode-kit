## MODIFIED Requirements

### Requirement: Loaded authority rejects process-only owner questions

The loaded global authority, Material qualification skill, OpenSpec author/apply/archive surfaces, portable project templates, and completion arbiter SHALL distinguish orchestrator-owned process controls from owner-owned outcome and protected-action decisions. They SHALL explicitly classify plan changes, task and path additions, OpenSpec artifact updates, candidate or revision creation, attempt-limit changes, and process stop-line changes as autonomous when accepted semantics remain unchanged.

Deterministic contracts SHALL require both the positive autonomy marker and the separate protected-action-authority marker on canonical surfaces. The completion arbiter SHALL classify a question asking only whether to modify those process controls as autonomous and SHALL return `continue`, not `owner_required`, while a bounded safe continuation exists.

#### Scenario: Fake choice between spec expansion and stopping is rejected

- **WHEN** a pending question asks the owner to choose between extending an OpenSpec change for a corrected successor attempt and stopping an unfinished accepted goal
- **AND** the successor remains inside accepted semantics and existing action authority
- **THEN** loaded authority treats the question as process-only and continues autonomously
- **AND** the owner is not presented with a choice that has no meaningful product or risk alternative.

#### Scenario: Completion arbiter preserves the exact action boundary

- **WHEN** artifact updates are autonomous but the next underlying action still needs credentials, physical/manual participation, remote/destructive authority, cost, release, or another protected decision
- **THEN** the arbiter permits autonomous preparation
- **AND** returns `owner_required` only for that exact action or decision.

#### Scenario: Historical records remain evidence

- **WHEN** archived changes contain earlier closed-world attempt or scope wording
- **THEN** validators and runtime routing SHALL treat those files as historical evidence rather than active authority
- **AND** this change SHALL NOT rewrite them merely to remove textual contradictions.
