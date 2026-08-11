## ADDED Requirements

### Requirement: Completion arbiter is a hidden machine adjudicator
The `session-completion-arbiter` SHALL be a hidden read-only subagent invoked only by the completion guard. It SHALL return the versioned completion verdict contract and SHALL not be governed as an optional reviewer, manually dispatched as a lifecycle gate, or permitted to edit, test, dispatch agents, ask the user, or approve Development-Stage.

#### Scenario: Arbiter agent is inspected
- **WHEN** repository validation reads the arbiter frontmatter and body
- **THEN** it SHALL require the guard-supplied bounded session-delivery evidence, deny all tool/mutation/orchestration/user-question capabilities, omit model pins, and define only completion-adjudication authority
- **AND** it SHALL not reference the optional leaf-reviewer output contract as its verdict authority.

### Requirement: Automatic guard replaces active delivery-reviewer routing
Loaded global authority, reusable project instructions, templates, README catalogs, agent inventories, profiles, validators, and current tests SHALL describe the automatic completion guard instead of instructing main to dispatch `session-delivery-reviewer`. The old active agent file SHALL be removed only after current guard proof.

#### Scenario: Active instruction inventory after migration
- **WHEN** instruction and agent inventories run on the migrated candidate
- **THEN** they SHALL find `session-completion-arbiter` and automatic guard routing in the maintained active surfaces
- **AND** they SHALL find no active `session-delivery-reviewer` agent, config key, profile key, validator binding, or invocation instruction.

### Requirement: Historical delivery-reviewer evidence remains attributable
Archived OpenSpec artifacts, implementation evidence, and feedback ledgers MAY retain `session-delivery-reviewer` references when they describe work that agent actually performed. Such references SHALL be treated as superseded historical evidence and SHALL not re-register or route the retired agent.

#### Scenario: Historical archive contains retired name
- **WHEN** validation encounters the retired name under archived change evidence or feedback history
- **THEN** it SHALL preserve the historical attribution
- **AND** it SHALL exclude that occurrence from active-agent and active-routing drift failures.

### Requirement: Main honors guard continuation without self-approval
Loaded main-session authority SHALL require a current completion-guard continuation to be processed as synthetic control evidence, while preserving main ownership of implementation, proof, specialist dispatch, and exact owner handoff. Main SHALL not mark guard todos complete, rewrite the root goal, or treat a prior Passed audit as approval of a changed revision.

#### Scenario: Guard resumes incomplete root
- **WHEN** main receives a current synthetic continuation with unresolved requirement refs
- **THEN** main SHALL continue the bounded work or invoke the required troubleshooter route
- **AND** a production mutation or new human requirement SHALL require a new completion audit.
