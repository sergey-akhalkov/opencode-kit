## ADDED Requirements

### Requirement: Main performs bounded recovery before blocker escalation
The active global instructions SHALL require main, immediately before its first user question for a blocker, to preserve the original accepted outcome and operating envelope and classify whether progress requires a proven owner-only action. Owner-only status SHALL require an exact protected action, evidence that no safe local substitute can advance the affected dependency chain, and a self-contained explanation of why only the owner can act.

When owner-only status is not proven, main SHALL execute an unused safe local mechanism that is causally distinct from the failed strategy when one remains. If no such mechanism remains and the blocker is technical or uncertain, main SHALL invoke at most one diagnosis-only `troubleshooter` consultation for the current failure chain before asking the user. Main SHALL verify the report and execute any authorized goal-preserving recovery itself, and SHALL NOT ask the user when that recovery advances the original task.

An equivalent consultation for the same failure chain SHALL require new decision-changing evidence or a distinct causal mechanism. An unavailable or unusable `troubleshooter` SHALL cause main to perform the same bounded classification and unused-mechanism pass itself, record the capability gap, and SHALL NOT become a Development-Stage, RC, or stable blocker by itself.

#### Scenario: A safe distinct local route remains
- **WHEN** a blocker occurs and evidence identifies an unused safe local mechanism that preserves the accepted outcome and differs causally from the failed strategy
- **THEN** main executes that mechanism instead of asking the user or invoking `troubleshooter`
- **AND** main continues the accepted task when the mechanism advances the affected dependency chain.

#### Scenario: A technical blocker has exhausted local mechanisms
- **WHEN** no unused safe causally distinct local mechanism remains for a technical blocker and owner-only status is not proven
- **THEN** main invokes exactly one diagnosis-only `troubleshooter` consultation with the current failure-chain evidence before any user question
- **AND** main verifies and executes an authorized recovery returned by that consultation.

#### Scenario: Recovery removes the need for user action
- **WHEN** the verified `troubleshooter` report identifies a safe local route that advances the original accepted outcome
- **THEN** main executes the route under its existing authority
- **AND** main does not escalate that blocker to the user.

#### Scenario: Owner action is proven
- **WHEN** progress requires an exact credential, elevation, destructive or remote action, deployment or release action, owner-controlled cost, protected semantic decision, unavailable external capability, or another protected owner action
- **AND** evidence establishes that no safe local substitute can advance the affected dependency chain
- **THEN** main proceeds directly to the self-contained owner handoff without invoking `troubleshooter`
- **AND** the handoff names the exact owner action, attempted alternatives, preserved state, consequences, and next continuation.

#### Scenario: Owner-only classification is uncertain
- **WHEN** a blocker resembles an owner boundary but available evidence does not prove the exact protected action or the absence of a safe local substitute
- **THEN** main treats the blocker as technical or uncertain rather than owner-only
- **AND** it completes the bounded recovery pass before asking the user.

#### Scenario: Equivalent consultation would repeat
- **WHEN** `troubleshooter` has already completed for the current failure chain and no new decision-changing evidence or distinct causal mechanism exists
- **THEN** main does not invoke an equivalent consultation again
- **AND** it either executes the established continuation or presents the exact remaining owner handoff.

#### Scenario: Troubleshooter is unavailable
- **WHEN** the task adapter or installed `troubleshooter` is unavailable
- **THEN** main performs the owner-only classification and unused-distinct-mechanism pass itself
- **AND** the missing specialist alone does not block lifecycle progression or create a process-approval question.

### Requirement: Troubleshooter returns one goal-preserving continuation route
The `troubleshooter` role SHALL remain diagnosis-only and SHALL receive a case file containing the original user goal, accepted outcome and operating envelope, blocker symptoms, preserved raw diagnostics, materially distinct prior attempts, remaining candidate mechanisms, allowed diagnostic scope, forbidden paths, protected boundaries, and expected validation gate.

The role SHALL identify missing decision-changing evidence, compare only realistic routes that preserve the accepted outcome, and return one best bounded continuation route with rejected alternatives and owner routing. It SHALL distinguish an autonomous route from an exact unavoidable owner action and SHALL NOT author production corrections, test artifacts, user questions, lifecycle verdicts, or protected decisions. Main SHALL independently verify the report before using it and remains the correction, proof, validation, and handoff owner.

#### Scenario: Autonomous continuation is available
- **WHEN** safe diagnostic evidence identifies a local recovery that main is authorized to execute
- **THEN** the report selects that recovery as the best goal-preserving route and identifies its validation observation
- **AND** it does not request user action or implement the correction itself.

#### Scenario: More evidence can resolve the blocker
- **WHEN** the available evidence cannot distinguish realistic recovery hypotheses and a safe bounded diagnostic observation can do so
- **THEN** the report identifies the smallest decision-changing observation and how main can acquire it
- **AND** it does not classify the blocker as owner-only merely because the current cause is unknown.

#### Scenario: Only an owner action remains
- **WHEN** diagnostic evidence proves that every safe autonomous route is unavailable or cannot advance the accepted outcome and progress requires an exact protected action
- **THEN** the report names that action, the evidence proving it unavoidable, and the preserved continuation after owner action
- **AND** it does not simulate, authorize, or weaken the protected boundary.

#### Scenario: Case file is insufficient
- **WHEN** the invocation omits prior-attempt evidence or the goal and operating envelope needed to assess goal preservation
- **THEN** the role remains read-only and reports the missing evidence or whether escalation is justified
- **AND** it does not guess a correction or owner.

### Requirement: Pre-escalation behavior is qualified at the loaded entry point
The complete pre-escalation policy SHALL have one canonical always-loaded owner in `global/AGENTS.md`. The `troubleshooter` artifact SHALL contain only its role-specific contract, and maintained templates, reusable instructions, commands, skills, and documentation SHALL use concise pointers or routing deltas instead of copying the complete policy.

Deterministic contract checks SHALL enforce critical owner-boundary, one-consultation, diagnosis-only, and canonical-owner markers but SHALL NOT claim semantic compliance. Candidate retention SHALL additionally require bounded same-model baseline/candidate scenarios through the actual loaded OpenCode main, task, and question paths with identical model, prompts, permissions, and disposable environment. Raw evidence SHALL preserve tool calls, outputs, source identity, candidate identity, cleanup, and the observed final route.

#### Scenario: Deterministic markers pass
- **WHEN** canonical and role-specific required-text checks pass
- **THEN** validation reports structural contract integrity
- **AND** implementation readiness still requires loaded same-model behavior evidence.

#### Scenario: Proven owner-only scenario is evaluated
- **WHEN** the loaded candidate receives a synthetic blocker that requires an exact protected owner action and has no safe local substitute
- **THEN** evidence shows one self-contained owner handoff and zero `troubleshooter` calls
- **AND** the candidate does not claim or execute the protected action.

#### Scenario: Recoverable technical scenario is evaluated
- **WHEN** the loaded candidate receives a synthetic technical blocker with an unused safe distinct route or a valid diagnosis-only continuation
- **THEN** evidence shows the route is executed by main and no blocker question is sent to the user
- **AND** `troubleshooter` does not author production or test corrections.

#### Scenario: Exhausted technical scenario is evaluated
- **WHEN** no safe unused local route remains and owner-only status is not proven
- **THEN** evidence shows exactly one current-chain `troubleshooter` consultation before any owner handoff
- **AND** a second equivalent consultation is suppressed without new evidence or a distinct mechanism.

#### Scenario: Completion guard mutation is considered
- **WHEN** loaded grind-on evidence does not reproduce a bypass caused by the guard's troubleshooter detection or failure-chain identity
- **THEN** this increment does not modify completion-guard runtime behavior
- **AND** any future guard mutation requires its own reproduced cause, scoped invalidation, and runtime proof.
