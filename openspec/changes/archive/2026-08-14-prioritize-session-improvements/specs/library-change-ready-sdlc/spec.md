## MODIFIED Requirements

### Requirement: Post-MVP work stops at critical boundaries

After MVP, mandatory work SHALL be limited to incomplete accepted scope, evidence-backed session improvements admitted into the active OpenSpec `tasks.md` under the owner-approved persistence contract, and reproduced accepted-outcome, critical, or non-deferrable defects. An admitted improvement task becomes accepted scope and SHALL remain required until its stated implementation, observable proof, and validation pass or the owner explicitly changes accepted scope.

An improvement SHALL be admitted only when an exact remaining current-change consumer ties it to the accepted outcome. After safety and live-attempt gates, admitted work SHALL execute at its earliest safe consumer boundary: gate-closing work first, then `do-now` or `before-task-<id>` work before its first consumer, and `before-freeze` work before qualification. A same-repository multiplier MAY be admitted when the current change consumes and proves an existing shared owner and at least one additional exact repository consumer is evidenced; the additional consumer SHALL remain outside current mutation scope.

Evidence-backed candidates without a current consumer SHALL remain non-blocking deferred records and SHALL NOT become accepted scope or block RC, stable, or complete archive. Current-change architecture and diagnostic non-degradation obligations SHALL remain accepted-scope implementation. Known non-critical bugs, optional coverage, pre-existing maintainability debt, style, wording, evidence formatting, diagnostic polish, optimization, unsupported generic improvement ideas, and future-scale work that did not pass current admission SHALL be documented or deferred as applicable and SHALL NOT block RC or stable.

#### Scenario: Non-critical post-MVP finding is parked
- **WHEN** main confirms a reachable non-critical limitation after MVP and it has no exact remaining current-change consumer
- **THEN** the limitation SHALL be documented or deferred with its re-evaluation condition
- **AND** it SHALL NOT authorize mandatory candidate mutation or block RC/stable.

#### Scenario: Admitted improvement becomes accepted scope
- **WHEN** an evidence-backed local reversible low-cost improvement is consumed by an exact remaining task, does not expand outcome, and is appended to the active `tasks.md`
- **THEN** it SHALL be implemented and proven at its earliest safe point before that consumer and before RC/stable or normal complete archive
- **AND** it SHALL NOT be reclassified as optional polish merely because MVP already exists.

#### Scenario: Deferred improvement remains non-blocking
- **WHEN** an evidence-backed improvement has no exact remaining current-change consumer
- **THEN** it SHALL be preserved as a non-checkbox deferred record with `Execution Class: separate-change`
- **AND** it SHALL NOT become mandatory post-MVP work until an owning change later admits it.
