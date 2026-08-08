## ADDED Requirements

### Requirement: Shipped workflow tools use portable cores and thin project adapters

Every workflow tool made available to target projects SHALL accept explicit project identity and behavior inputs rather than embedding this repository's path, name, package manager, shell, service, or validation commands. Project-specific convenience commands MAY be thin adapters, but reusable core behavior SHALL remain independently invocable in an unrelated project.

Repository-maintenance-only validators MAY target the documented kit schema when they are not installed or represented as generic project workflow tools.

#### Scenario: Another project uses a different build system

- **WHEN** a target project supplies a native validation executable instead of npm
- **THEN** the reusable workflow core invokes the explicit argv without requiring npm
- **AND** only that project's thin adapter contains its technology-specific command.

#### Scenario: Reusable core contains checkout identity

- **WHEN** a shipped project workflow core embeds this repository name, an absolute maintainer path, or an implicit current-checkout validation command
- **THEN** deterministic repository validation fails
- **AND** the behavior is moved behind an explicit root/config/argv adapter before delivery.

### Requirement: Complete archive delegates spec merge and movement to official OpenSpec

The shipped complete-archive path SHALL run a deterministic completion gate and applicable project validation before invoking the installed official OpenSpec archive command in machine-readable non-interactive mode. It SHALL NOT ask a model to edit main specs, reimplement delta parsing, or move the change directory manually.

The path SHALL preserve the official archive result, run post-archive validation, and refuse a success claim when any gate, official operation, or post-validation is red.

#### Scenario: Complete delta is archived

- **WHEN** all artifacts and tasks are complete, strict delta validation passes, and project validation exits zero
- **THEN** the official OpenSpec command applies and validates the delta and moves the change
- **AND** the portable wrapper reports the machine archive identity and operation totals.

#### Scenario: Incomplete task with non-interactive archive

- **WHEN** a change contains an unchecked task
- **THEN** the portable gate exits non-zero before invoking `openspec archive --yes`
- **AND** neither main specs nor the active change location changes.

#### Scenario: Partial modified delta is unsupported

- **WHEN** official deterministic OpenSpec merge rejects a partial `MODIFIED` delta
- **THEN** the wrapper preserves the official diagnostic and exits non-zero
- **AND** it does not fall back to agent-authored merge behavior.

### Requirement: Staged validation executes the exact Git index candidate

The shipped staged-validation tool SHALL materialize the current Git index into an isolated disposable worktree and run an explicit project validation argv there. It SHALL NOT validate unstaged source as candidate content, modify the source worktree, guess dependency preparation, or hardcode a project package manager.

Explicit reused paths SHALL be relative, ignored, existing, absent from the staged tree, and attached only for the validation lifetime. The tool SHALL remove its links and disposable worktree on success or failure; unknown cleanup state SHALL return non-zero with the preserved path.

#### Scenario: Worktree conflicts with staged candidate

- **WHEN** a tracked file has green staged content and red unstaged content
- **THEN** staged validation observes only the green indexed content
- **AND** the source worktree bytes remain unchanged.

#### Scenario: Validation command fails

- **WHEN** the explicit validation argv exits non-zero
- **THEN** stdout, stderr, signal, and exit status remain visible
- **AND** the disposable worktree is still removed before the wrapper exits non-zero.
