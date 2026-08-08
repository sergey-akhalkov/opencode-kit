## ADDED Requirements

### Requirement: Repository maintainer authority requires portable workflow tooling

`REPO_AGENTS.md` SHALL require every workflow tool shipped into project context to use a project-neutral core with explicit root/config/argv inputs and a thin project adapter for technology-specific behavior. It SHALL prohibit hardcoded maintainer paths, repository identity, package manager, shell, service, and validation commands in reusable cores.

The authority SHALL require representative proof in an unrelated disposable project before a new or materially changed workflow tool is called reusable.

#### Scenario: Maintainer adds a project-specific helper

- **WHEN** a helper directly embeds one project's package command in reusable core logic
- **THEN** repository validation rejects the portability contract
- **AND** the command moves into a project adapter while the core remains reusable.

#### Scenario: Kit-schema validator is maintained

- **WHEN** a repository-maintenance validator explicitly targets the documented kit artifact schema and is not distributed as a generic project tool
- **THEN** it MAY retain kit-schema-specific contracts
- **AND** documentation SHALL not claim that validator is application-project-neutral.

### Requirement: Compaction switches stalled strategies and preserves strategy history

The active global instructions and compaction prompt SHALL identify stagnation when at least two materially similar attempts since the last observable progress produce no new accepted artifact, runtime evidence, resolved blocker, or downstream boundary advancement. On stagnation the agent SHALL select a different causal mechanism rather than retrying with only changed flags, wording, timeout, or repetition count.

For an active OpenSpec change, each materially distinct attempted strategy SHALL be recorded in `openspec/changes/<change>/history.md` with objective, approach, evidence, outcome, reason, do-not-repeat condition, and evidence-based retry condition. A later session SHALL read that history before substantial work and SHALL NOT repeat a recorded strategy unless new evidence satisfies its retry condition or invalidates the previous result.

If compaction cannot write files, its summary SHALL emit structured pending history entries and exactly one distinct next strategy. The next session SHALL persist those entries before substantial work.

#### Scenario: Similar retries make no progress

- **WHEN** two attempts use the same causal mechanism and neither advances an accepted artifact, runtime observation, blocker, or downstream boundary
- **THEN** the next attempt uses a materially different mechanism
- **AND** the attempted mechanism is recorded in the active change `history.md`.

#### Scenario: New evidence makes an old strategy viable

- **WHEN** later evidence satisfies a recorded retry condition or disproves the prior failure cause
- **THEN** the agent MAY retry the recorded strategy
- **AND** the new evidence and reason for retry are appended to `history.md` before execution.

#### Scenario: Automatic compaction cannot mutate files

- **WHEN** compaction detects stagnation but has no file-write capability
- **THEN** the summary includes a structured pending history entry and a different next strategy
- **AND** the next session persists the entry before continuing implementation.
