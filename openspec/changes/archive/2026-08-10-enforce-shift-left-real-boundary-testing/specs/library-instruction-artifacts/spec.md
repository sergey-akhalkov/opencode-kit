## ADDED Requirements

### Requirement: Maintained planning surfaces preserve shift-left cadence

The canonical Universal Development Loop, reusable project instructions, project template, repository maintainer instructions, qualification skill, roadmap/planning skills, OpenSpec project context, evidence guidance, and quality-gate documentation SHALL route behavior slices toward the earliest safely reachable real boundary. Planning surfaces SHALL require a current fidelity rung, next real boundary, exact blocker and unblocking task when deferred, and a dependency-chain stop rule.

The complete policy SHALL remain in always-loaded `global/AGENTS.md`; other surfaces SHALL contain only concise shared markers or role-specific deltas.

#### Scenario: OpenSpec tasks are generated for a real-backed feature

- **WHEN** a proposal or task graph includes behavior that models, integrates with, or substitutes a real system
- **THEN** its first dependency-valid tasks minimize time-to-first-real-signal
- **AND** later dependent behavior does not precede an already reachable safe characterization task.

### Requirement: Shift-left markers are deterministic drift tripwires

The repository validator SHALL require exact shift-left markers in the canonical runtime authority and explicitly maintained mirror list. The validator SHALL report the missing marker and artifact, SHALL inspect operative text rather than fenced examples, and SHALL NOT claim that marker presence proves semantic model behavior.

#### Scenario: Project template drops the real-boundary cadence

- **WHEN** a maintained project template omits the earliest-safe-real-boundary marker
- **THEN** repository validation fails and names that template
- **AND** same-model workflow evaluation remains required for semantic adherence.

### Requirement: Behavior evaluation preserves safety and demonstrates cadence

The shift-left instruction change SHALL use a bounded same-model baseline/candidate workflow with identical prompt, model, variant, workspace, and active config. Candidate retention SHALL require preservation of baseline authorization, physical-safety, restoration, cleanup, equivalence, and dependency-stop behavior plus explicit fidelity-ladder and deferred-boundary-unblocker evidence.

#### Scenario: Candidate says test early but bypasses authorization

- **WHEN** candidate output moves a real test earlier but omits separate authorization or applicable safety and restoration gates
- **THEN** the candidate fails behavior evaluation
- **AND** the durable instruction change is not qualified.
