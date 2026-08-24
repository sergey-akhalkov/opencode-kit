# agent-workflow-automation Specification

## Purpose
Defines bounded deterministic automation that removes repeated agent orchestration while preserving repository state, accepted outcomes, safety evidence, and proportional workflow scope.

## Requirements

### Requirement: Repository candidate snapshot reports bounded review facts
The kit SHALL expose one portable repository candidate snapshot that accepts an explicit Git worktree root and emits a stable schema-versioned result containing the resolved repository identity, HEAD and branch or detached state, upstream presence and ahead/behind counts when available, staged, unstaged, untracked, ignored-excluded, and conflicting path classifications, bounded staged and unstaged diff summaries and patch content, and bounded recent commit facts. Paths SHALL be repository-relative and ordinally sorted where Git ordering is not semantically significant.

The default output SHALL remain compact, SHALL cap combined patch content at 131072 bytes, SHALL mark the exact section and omitted byte count when truncated, SHALL omit untracked file contents, and SHALL expose an explicit lower patch-byte limit or summary-only mode. Truncated output SHALL remain usable as an inventory but SHALL NOT claim complete diff review.

#### Scenario: Mixed worktree is captured in one invocation
- **WHEN** the snapshot runs against a worktree with staged, unstaged, untracked, and conflicting paths
- **THEN** one result classifies every observed path without changing the index or worktree
- **AND** includes bounded staged and unstaged review content plus current HEAD, branch, upstream, and recent-history facts.

#### Scenario: Patch content exceeds the bound
- **WHEN** combined staged and unstaged patch bytes exceed the selected limit
- **THEN** the result reports truncation, the affected section, and omitted byte count
- **AND** does not represent the bounded patch as a complete diff review.

#### Scenario: Detached head and missing upstream remain explicit
- **WHEN** the repository is detached or the current branch has no configured upstream
- **THEN** the result represents the detached and upstream-absent states explicitly
- **AND** does not invent a branch, comparison base, or remote authority.

### Requirement: Repository candidate snapshot is read-only and portable
Snapshot help and inspection SHALL perform no Git write, checkout, reset, clean, add, commit, fetch, network, hook, credential, or remote operation. The helper SHALL invoke Git without a shell, SHALL disable external diff execution, SHALL preserve the original Git failure cause and exit status, and SHALL reject a missing root, non-worktree, unsupported schema request, or unreadable required fact with an actionable bounded diagnostic. `--help` and `-h` SHALL enumerate inputs, output modes, limits, and effects and exit zero without requiring a repository.

The reusable core SHALL accept explicit root and behavior arguments and SHALL NOT embed this kit checkout, a target repository name, a package manager, or a platform-specific shell command. A project-specific command MAY remain a thin adapter over that core.

#### Scenario: Help is effect-free outside a repository
- **WHEN** either help form is invoked from a non-repository directory
- **THEN** it exits zero and documents root, format, patch, limit, and effect behavior
- **AND** starts no Git inspection and creates no file or process that outlives the command.

#### Scenario: Non-worktree input fails closed
- **WHEN** the explicit root is not a readable Git worktree
- **THEN** the command exits non-zero with the failing root represented safely and the original Git diagnostic preserved
- **AND** performs no fallback search, repository initialization, or mutation.

#### Scenario: Inspection cannot execute an external diff program
- **WHEN** repository configuration names an external diff command
- **THEN** snapshot collection disables that command and uses Git's internal non-interactive diff path
- **AND** no repository-configured executable runs.

### Requirement: Eligible changes declare one automation dividend
Every OpenSpec proposal SHALL declare `Automation Dividend` as either `required - <candidate>` or `exempt - <reason>`. Material changes SHALL declare `required`. An Ordinary Small change MAY declare `exempt` unless its accepted outcome introduces or materially extends repeated operator, agent, proof, or workflow behavior. The declaration is a reviewed semantic decision; deterministic tooling SHALL validate only its shape and correlated evidence and SHALL NOT infer profile, recurrence, value, or exemption from prose, changed files, task count, measurements, or model output.

A required candidate SHALL name one deterministic sequence observed at least twice in current attributable tool evidence or in one maintained feedback, audit, or prior evidence source that records at least two occurrences. The proposal and tasks remain mutable process controls: apply MAY replace the candidate with a better observed sequence without owner approval when accepted product semantics and protected boundaries remain unchanged.

#### Scenario: Material change declares a candidate
- **WHEN** a Material change reaches proposal readiness
- **THEN** its proposal declares one required automation dividend and names the repeated sequence or maintained recurrence source
- **AND** the declaration does not authorize any protected effect performed by that sequence.

#### Scenario: Ordinary Small change remains proportional
- **WHEN** a clear bounded local reversible change neither introduces repeated-use behavior nor has an accepted automation outcome
- **THEN** its proposal may declare the dividend exempt with a concrete reason
- **AND** no automation task, retrospective, or helper is required for complete archive.

#### Scenario: Tooling cannot infer eligibility
- **WHEN** a proposal omits or malforms the declaration or supplies unsupported evidence
- **THEN** deterministic validation reports the exact declaration or evidence gap
- **AND** does not classify the change, select a candidate, or manufacture an exemption.

### Requirement: Automation dividends harvest one current repeated sequence
A required automation dividend SHALL eliminate one declared repeated deterministic sequence through the ordered disposition `reuse`, `extend`, or `build-minimal`. Apply SHALL first remove unnecessary steps and inspect current repository and platform owners; it SHALL reuse a fitting current helper, extend the narrowest fitting owner, or add one minimal helper only when neither lower-cost option satisfies the declared sequence. The dividend SHALL be a tracked `[automation-dividend]` task placed before its first remaining current consumer and SHALL be exercised through that consumer before completion.

The helper or extension SHALL have explicit inputs, outputs, effects, stable ordering, privacy-safe cause-preserving errors, bounded output, effect-free help when repeatedly invoked, maintained discovery documentation, and focused real-entrypoint proof. It SHALL NOT infer semantic decisions, run arbitrary recorded commands, or become a generic workflow engine.

#### Scenario: Existing owner satisfies the sequence
- **WHEN** a current helper already produces every required fact with no weaker safety or material invocation cost
- **THEN** the dividend records `reuse` and proves the actual current consumer uses that helper
- **AND** no duplicate wrapper or new CLI is added.

#### Scenario: Narrow extension is sufficient
- **WHEN** one existing owner lacks only a bounded fact or mode needed by the repeated sequence
- **THEN** the dividend records `extend` and adds the smallest cohesive behavior to that owner
- **AND** does not create a competing top-level mechanism.

#### Scenario: Minimal new helper is justified
- **WHEN** removal, reuse, and extension cannot satisfy the observed sequence at lower total lifecycle cost
- **THEN** the dividend records `build-minimal`, the rejected owners, and the new helper's exact contract
- **AND** the helper remains limited to the current deterministic responsibility.

### Requirement: Automation dividend evidence is candidate-correlated
A completed `[automation-dividend]` task SHALL have one current evidence-index row containing the task id and digest, disposition, recurrence source, helper identity, exact real-entrypoint invocation and status, before-sequence operation identities, after-sequence operation identities, observed output/effects, candidate and environment identity, bounded artifact references, and cleanup. The row SHALL demonstrate equivalent required facts and no weaker safety; call-count reduction SHALL be reported only from exact comparable operations or matched consumer evidence.

Automation evidence SHALL NOT satisfy or replace any accepted product proof, validation, safety, cleanup, or qualification requirement. Missing, stale, truncated acceptance-critical, red, or weaker evidence SHALL leave only the dividend incomplete.

#### Scenario: Current helper proof satisfies the dividend
- **WHEN** the checked dividend task has a matching current evidence row and the first consumer successfully uses the helper
- **THEN** the operation gate accepts the dividend fact
- **AND** product completion remains independently gated by its own tasks and evidence.

#### Scenario: Checked task has stale automation evidence
- **WHEN** the helper, task text, candidate, environment, or declared sequence changes after capture
- **THEN** the dividend is reported incomplete despite its checkbox
- **AND** preserved product evidence outside the dependency of that change remains valid.

### Requirement: Workflow-friction claims require matched outcome evidence
A change that claims lower agent workflow friction SHALL use the maintained consumer-outcome regression capability with identical reviewed scenarios, model/profile, permissions, environment, initial state, and accepted outcome oracles. Outcome, proof, validation, safety, diagnostics, and cleanup equivalence SHALL pass before friction evaluation. Every candidate friction field SHALL be no greater than baseline and at least one maintained scenario median `totalToolCallCount` SHALL be strictly lower for an improvement claim.

Deterministic snapshot fixtures SHALL separately prove exact Git facts and side-effect absence. Neither fixture checks nor structural instruction markers alone SHALL establish agent workflow improvement.

#### Scenario: Candidate uses fewer calls with equivalent outcome
- **WHEN** matched baseline and candidate samples satisfy every hard outcome and safety oracle, no friction field regresses, and candidate median total tool calls are strictly lower in at least one scenario
- **THEN** evaluation reports the exact improved scenario and counts within the declared claim ceiling
- **AND** retains raw samples and candidate/environment identities.

#### Scenario: One-call helper loses required facts
- **WHEN** the candidate uses fewer calls but omits a required repository state, weakens validation, or leaves cleanup unknown
- **THEN** evaluation fails or blocks before friction credit
- **AND** does not represent call aggregation alone as an improvement.
