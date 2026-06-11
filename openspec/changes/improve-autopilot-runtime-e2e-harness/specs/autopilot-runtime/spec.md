# Autopilot Runtime Spec

## ADDED Requirements

### Requirement: Plugin-Owned Runtime Harness

Autopilot SHALL provide a plugin-owned way to test runtime states without requiring agents to manually write protected paths.

#### Scenario: Harness seeds runtime state safely

- **GIVEN** a regression or test needs Ready ledgers, worker reports, blocker questions, or MR waits
- **WHEN** the test uses the Autopilot runtime harness
- **THEN** state is created through plugin-owned code or deterministic in-memory fixtures
- **AND** agents do not manually write `.autopilot/**` or `openspec/changes/*/automation/**`

### Requirement: Ready Ledger Runtime Progress Is Explicit

Autopilot SHALL distinguish no work, valid Ready work that cannot be advanced by the current MVP, and work that was actually advanced.

#### Scenario: Ready ledger cannot be advanced by current runtime

- **GIVEN** a valid Ready task ledger exists
- **WHEN** `autopilot_run_next` cannot claim, dispatch, or advance it
- **THEN** the tool reports a clear deferred/blocked reason instead of ambiguous progress
- **AND** the output includes the task id or ledger evidence needed for the next safe action

### Requirement: Blocker Answers Match Pending Questions

Autopilot SHALL accept blocker answers only for plugin-owned pending questions.

#### Scenario: Unknown blocker answer is rejected

- **GIVEN** no pending blocker question has id `Q`
- **WHEN** `autopilot_answer_blocker` is called with `questionId` `Q`
- **THEN** the tool returns a clear failed or blocked result
- **AND** no state is advanced

### Requirement: MR Wait Stops Without Auto-Merge

Autopilot SHALL expose MR wait evidence and SHALL NOT merge automatically.

#### Scenario: MR waits for user or provider decision

- **GIVEN** a task ledger is waiting for MR review or merge
- **WHEN** Autopilot inspects the task
- **THEN** the output includes MR status and URL when available
- **AND** Autopilot stops at `waiting_for_mr`
- **AND** it does not merge without explicit user approval
